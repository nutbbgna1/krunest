import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp, runMaintenance } from '../app.mjs';
import AdmZip from 'adm-zip';
import { existsSync } from 'node:fs';

let server;
let base;
let db;

before(async () => {
  const built = createApp({ dbFile: ':memory:', exposeTokens: true });
  db = built.db;
  server = createServer(built.app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
});

function client() {
  let cookie = '';
  let csrf = '';
  return {
    async request(path, options = {}) {
      const response = await fetch(base + path, {
        ...options,
        headers: { 'content-type': 'application/json', ...(cookie && { cookie }), ...(csrf && { 'x-csrf-token': csrf }), ...options.headers },
        body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
      });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];
      const data = await response.json();
      if (data.csrfToken) csrf = data.csrfToken;
      return { response, data };
    },
    setCsrf(value) { csrf = value; },
  };
}

const member = client();
const administrator = client();
let orderId;

test('phase 0: health and catalog use the database', async () => {
  const health = await member.request('/api/health');
  assert.equal(health.response.status, 200);
  assert.equal(health.data.database, true);
  const catalog = await member.request('/api/catalog');
  assert.equal(catalog.data.programs.length, 6);
  assert.equal(catalog.data.plans.length, 4);
  const googleStub = await member.request('/api/auth/google');
  assert.equal(googleStub.response.status, 501);
});

test('phase 1: register, verify, login, profile and session protection', async () => {
  const email = 'teacher@school.ac.th';
  const registered = await member.request('/api/auth/register', { method: 'POST', body: { email, password: 'Teacher@1234', name: 'ครูทดสอบ', organization: 'โรงเรียนทดสอบ' } });
  assert.equal(registered.response.status, 201);
  assert.ok(registered.data.devToken);
  const verified = await member.request('/api/auth/verify', { method: 'POST', body: { token: registered.data.devToken } });
  assert.equal(verified.response.status, 200);
  const loggedIn = await member.request('/api/auth/login', { method: 'POST', body: { email, password: 'Teacher@1234' } });
  assert.equal(loggedIn.response.status, 200);
  assert.equal(loggedIn.data.user.name, 'ครูทดสอบ');
  const profile = await member.request('/api/me', { method: 'PATCH', body: { name: 'ครูทดสอบระบบ', organization: 'โรงเรียนทดสอบ', notification_email: true } });
  assert.equal(profile.response.status, 200);
  const me = await member.request('/api/me');
  assert.equal(me.data.user.name, 'ครูทดสอบระบบ');
  assert.equal(me.data.entitlements[0].program_id, 'docuflow-tax');
});

test('phase 2: trial rights are granted once with an expiry', async () => {
  const trial = await member.request('/api/me/trials/flowsync-erp', { method: 'POST', body: {} });
  assert.equal(trial.response.status, 201);
  const repeated = await member.request('/api/me/trials/flowsync-erp', { method: 'POST', body: {} });
  assert.equal(repeated.response.status, 409);
  const me = await member.request('/api/me');
  assert.equal(me.data.entitlements.find((item) => item.program_id === 'flowsync-erp').access_level, 'limited');
});

test('phase 3: order, slip, admin approval, entitlement and receipt', async () => {
  const created = await member.request('/api/orders', { method: 'POST', body: { targetType: 'program', targetId: 'pixelcraft-studio' } });
  assert.equal(created.response.status, 201);
  assert.match(created.data.qrDataUrl, /^data:image\/png;base64,/);
  assert.match(created.data.promptPayPayload, /^000201/);
  orderId = created.data.id;
  const slip = await member.request(`/api/orders/${orderId}/slip`, { method: 'POST', body: { fileName: 'slip.png', mimeType: 'image/png', data: 'data:image/png;base64,iVBORw0KGgo=' } });
  assert.equal(slip.response.status, 201);

  const login = await administrator.request('/api/auth/login', { method: 'POST', body: { email: 'me.patiphan1@gmail.com', password: 'Admin@12345' } });
  assert.equal(login.response.status, 200);
  assert.equal(login.data.user.role, 'admin');
  const approved = await administrator.request(`/api/admin/orders/${orderId}/review`, { method: 'POST', body: { decision: 'approve' } });
  assert.equal(approved.response.status, 200);
  assert.match(approved.data.receipt, /^RC/);
  const receipt = await member.request(`/api/orders/${orderId}/receipt`);
  assert.equal(receipt.response.status, 200);
  const me = await member.request('/api/me');
  assert.equal(me.data.entitlements.find((item) => item.program_id === 'pixelcraft-studio').source, 'purchase');
});

test('phase 4: admin dashboard, users, logs and announcements', async () => {
  const summary = await administrator.request('/api/admin/summary');
  assert.equal(summary.response.status, 200);
  assert.equal(summary.data.users, 2);
  assert.equal(summary.data.revenue, 499);
  const announcement = await administrator.request('/api/admin/announcements', { method: 'POST', body: { title: 'แจ้งปรับปรุง', message: 'ระบบพร้อมใช้งานตามปกติ' } });
  assert.equal(announcement.response.status, 201);
  const publicItems = await member.request('/api/announcements');
  assert.equal(publicItems.data[0].title, 'แจ้งปรับปรุง');
  const audit = await administrator.request('/api/admin/audit');
  assert.ok(audit.data.some((item) => item.action === 'approve_order'));
});

test('phase 5: teams, invite links and email queue', async () => {
  const team = await member.request('/api/teams', { method: 'POST', body: { name: 'ทีมครูวิชาการ', seatLimit: 10 } });
  assert.equal(team.response.status, 201);
  const invite = await member.request(`/api/teams/${team.data.id}/invites`, { method: 'POST', body: { email: 'colleague@school.ac.th' } });
  assert.equal(invite.response.status, 201);
  assert.match(invite.data.inviteUrl, /^\/join\//);
  const emails = await administrator.request('/api/admin/emails');
  assert.ok(emails.data.some((item) => item.template === 'team_invite'));
});

test('phase 6: plugins, 2FA setup and scheduled maintenance', async () => {
  const zip = new AdmZip();
  zip.addFile('manifest.json', Buffer.from(JSON.stringify({ slug: 'school-report', name: 'รายงานโรงเรียน', version: '1.0.0' })));
  zip.addFile('index.js', Buffer.from('export default {}'));
  const plugin = await administrator.request('/api/admin/plugins', { method: 'POST', body: { archive: `data:application/zip;base64,${zip.toBuffer().toString('base64')}` } });
  assert.equal(plugin.response.status, 201);
  assert.equal(existsSync('data/plugins/school-report/index.js'), true);
  const plugins = await administrator.request('/api/admin/plugins');
  assert.equal(plugins.data[0].slug, 'school-report');
  const toggled = await administrator.request(`/api/admin/plugins/${plugins.data[0].id}/toggle`, { method: 'POST', body: {} });
  assert.equal(toggled.data.status, 'active');
  const setup = await member.request('/api/me/2fa/setup', { method: 'POST', body: {} });
  assert.match(setup.data.otpauth, /^otpauth:\/\/totp/);
  const maintenance = runMaintenance(db, `/tmp/krunest-test-mail-${Date.now()}`);
  assert.ok(maintenance.emailsSent >= 1);
  const removed = await administrator.request(`/api/admin/plugins/${plugins.data[0].id}`, { method: 'DELETE' });
  assert.equal(removed.response.status, 200);
  assert.equal(existsSync('data/plugins/school-report'), false);
});
