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
  const built = createApp({ dbFile: ':memory:', exposeTokens: true, seedDemoPrograms: true });
  db = built.db;
  server = createServer(built.app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  db.prepare("INSERT INTO settings (key,value) VALUES ('payment_accounts',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify([{ id: 'pp', type: 'promptpay', label: 'PromptPay ร้าน', bankName: '', accountName: '', accountNumber: '0891234567', note: '', active: true }]));
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
      const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text();
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
  assert.equal(googleStub.response.status, 503);
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
  const allUsers = await administrator.request('/api/admin/users');
  const teacher = allUsers.data.find((item) => item.email === 'teacher@school.ac.th');
  const promoted = await administrator.request(`/api/admin/users/${teacher.id}`, { method: 'PATCH', body: { role: 'staff' } });
  assert.equal(promoted.response.status, 200);
  const salesSummary = await member.request('/api/sales/summary');
  assert.equal(salesSummary.response.status, 200);
  assert.equal(salesSummary.data.approvedOrders, 1);
  const deniedAdmin = await member.request('/api/admin/summary');
  assert.equal(deniedAdmin.response.status, 403);
  for (const path of ['/api/admin/users', '/api/admin/orders', '/api/admin/audit', '/api/admin/emails', '/api/admin/supabase', '/api/admin/plugins', '/api/admin/announcements']) {
    const denied = await member.request(path);
    assert.equal(denied.response.status, 403, `staff must not reach ${path}`);
  }
  const deniedRole = await member.request(`/api/admin/users/${teacher.id}`, { method: 'PATCH', body: { role: 'admin' } });
  assert.equal(deniedRole.response.status, 403);
  for (const path of ['/api/sales/summary', '/api/sales/orders', '/api/sales/customers']) {
    assert.equal((await administrator.request(path)).response.status, 200, `admin must reach ${path}`);
  }
  const salesCustomers = await member.request('/api/sales/customers');
  assert.equal(salesCustomers.data[0].email, 'teacher@school.ac.th');
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
  zip.addFile('manifest.json', Buffer.from(JSON.stringify({
    slug: 'school-report', name: 'รายงานโรงเรียน', version: '1.0.0', type: 'html-standalone',
    entry: 'app/index.html', manual: 'app/manual.pdf', description: 'ระบบทดสอบ', highlights: ['พร้อมใช้'], steps: ['เปิดโปรแกรม'],
    program: { id: 'school-report', name: 'School Report', thaiName: 'รายงานโรงเรียน', price: 299 },
  })));
  zip.addFile('app/index.html', Buffer.from('<!doctype html><title>School Report</title><h1>พร้อมใช้</h1>'));
  zip.addFile('app/manual.pdf', Buffer.from('%PDF-1.4 test manual'));
  const plugin = await administrator.request('/api/admin/plugins', { method: 'POST', body: { archive: `data:application/zip;base64,${zip.toBuffer().toString('base64')}` } });
  assert.equal(plugin.response.status, 201);
  assert.equal(existsSync('data/plugins/school-report/app/index.html'), true);
  const plugins = await administrator.request('/api/admin/plugins');
  assert.equal(plugins.data[0].slug, 'school-report');
  const toggled = await administrator.request(`/api/admin/plugins/${plugins.data[0].id}/toggle`, { method: 'POST', body: {} });
  assert.equal(toggled.data.status, 'active');
  const publicPlugins = await member.request('/api/plugins');
  assert.equal(publicPlugins.data[0].programId, 'school-report');
  const demo = await member.request('/plugins/school-report/demo/?vsdemo=1');
  assert.equal(demo.response.status, 200);
  assert.match(demo.data, /พร้อมใช้/);
  const denied = await member.request('/plugins/school-report/app/');
  assert.equal(denied.response.status, 403);
  const pluginTrial = await member.request('/api/me/trials/school-report', { method: 'POST', body: {} });
  assert.equal(pluginTrial.response.status, 201);
  const fullApp = await member.request('/plugins/school-report/app/');
  assert.equal(fullApp.response.status, 200);
  const setup = await member.request('/api/me/2fa/setup', { method: 'POST', body: {} });
  assert.match(setup.data.otpauth, /^otpauth:\/\/totp/);
  const maintenance = runMaintenance(db, `/tmp/krunest-test-mail-${Date.now()}`);
  assert.ok(maintenance.emailsSent >= 1);
  const removed = await administrator.request(`/api/admin/plugins/${plugins.data[0].id}`, { method: 'DELETE' });
  assert.equal(removed.response.status, 200);
  assert.equal(existsSync('data/plugins/school-report'), false);
});

test('payment accounts: admin manages them, sales reviews slips and approves', async () => {
  const bad = await administrator.request('/api/admin/payment-accounts', { method: 'PUT', body: { accounts: [{ type: 'promptpay', label: 'x', accountNumber: '0812345678' }] } });
  assert.equal(bad.response.status, 400, 'the old sample number is rejected');
  assert.equal((await administrator.request('/api/admin/payment-accounts', { method: 'PUT', body: { accounts: [{ type: 'bank', label: 'KBank', accountNumber: '123' }] } })).response.status, 400);
  const denied = await member.request('/api/admin/payment-accounts', { method: 'PUT', body: { accounts: [] } });
  assert.equal(denied.response.status, 403, 'staff cannot change where money goes');
  const saved = await administrator.request('/api/admin/payment-accounts', { method: 'PUT', body: { accounts: [
    { type: 'promptpay', label: 'PromptPay', accountNumber: '089-123-4567' },
    { type: 'bank', label: 'ธนาคารกสิกรไทย', bankName: 'กสิกรไทย', accountName: 'บจก. ครูเนสต์', accountNumber: '123-4-56789-0', active: true },
    { type: 'bank', label: 'ซ่อนอยู่', bankName: 'ไทยพาณิชย์', accountName: 'x', accountNumber: '9999999999', active: false },
  ] } });
  assert.equal(saved.response.status, 200); assert.equal(saved.data[0].accountNumber, '0891234567');
  const publicList = await member.request('/api/payment-accounts');
  assert.equal(publicList.data.length, 2, 'inactive accounts are hidden from customers');

  const customer = client();
  await customer.request('/api/auth/register', { method: 'POST', body: { email: 'payer@school.ac.th', password: 'Payer@12345', name: 'Payer', organization: 'School' } });
  const token = db.prepare("SELECT token FROM tokens WHERE type='verify' ORDER BY rowid DESC").get()?.token;
  if (token) await customer.request('/api/auth/verify', { method: 'POST', body: { token } });
  const login = await customer.request('/api/auth/login', { method: 'POST', body: { email: 'payer@school.ac.th', password: 'Payer@12345' } });
  assert.equal(login.response.status, 200);
  const order = await customer.request('/api/orders', { method: 'POST', body: { targetType: 'program', targetId: 'veloce-pos' } });
  assert.equal(order.response.status, 201); assert.equal(order.data.accounts.length, 2);
  const noSlip = await member.request(`/api/sales/orders/${order.data.id}/review`, { method: 'POST', body: { decision: 'approve' } });
  assert.equal(noSlip.response.status, 400, 'no approval without a payment slip');
  assert.equal((await customer.request(`/api/orders/${order.data.id}/slip`, { method: 'POST', body: { fileName: 's.png', mimeType: 'image/png', data: 'data:image/png;base64,iVBORw0KGgo=' } })).response.status, 201);
  const slip = await member.request(`/api/sales/orders/${order.data.id}/slip`);
  assert.equal(slip.response.status, 200); assert.equal(slip.data.mime_type, 'image/png');
  assert.equal((await member.request(`/api/sales/orders/${order.data.id}/review`, { method: 'POST', body: { decision: 'approve' } })).response.status, 200);
  assert.equal(db.prepare("SELECT 1 FROM entitlements WHERE program_id='veloce-pos' AND user_id=(SELECT id FROM users WHERE email='payer@school.ac.th')").get() !== undefined, true);

  const badQr = await administrator.request('/api/admin/payment-accounts', { method: 'PUT', body: { accounts: [{ type: 'qr', label: 'QR', qrImage: 'data:text/html;base64,PHNjcmlwdD4=' }] } });
  assert.equal(badQr.response.status, 400, 'only png/jpeg images are accepted as QR');
  const qr = await administrator.request('/api/admin/payment-accounts', { method: 'PUT', body: { accounts: [{ type: 'qr', label: 'QR ธนาคาร', qrImage: 'data:image/png;base64,iVBORw0KGgo=' }] } });
  assert.equal(qr.response.status, 200);
  const qrOrder = await customer.request('/api/orders', { method: 'POST', body: { targetType: 'program', targetId: 'pixelcraft-studio' } });
  assert.equal(qrOrder.response.status, 201);
  assert.equal(qrOrder.data.qrDataUrl, null); assert.equal(qrOrder.data.accounts[0].qrImage, 'data:image/png;base64,iVBORw0KGgo=');
  await administrator.request('/api/admin/payment-accounts', { method: 'PUT', body: { accounts: [] } });
  const none = await customer.request('/api/orders', { method: 'POST', body: { targetType: 'program', targetId: 'veloce-pos' } });
  assert.equal(none.response.status, 503, 'orders are blocked until an account is configured');
});
