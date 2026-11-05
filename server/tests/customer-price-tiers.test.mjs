import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
import { createApp } from '../app.mjs';

test('customer price tiers are managed separately and selected during plugin upload', async () => {
  const pluginRoot = mkdtempSync(join(tmpdir(), 'krunest-customer-tiers-'));
  const { app, db } = createApp({ dbFile: ':memory:', pluginRoot });
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const makeClient = () => { let cookie = '', csrf = ''; return async (path, method = 'GET', body) => {
    const response = await fetch(base + path, { method, headers: { 'content-type': 'application/json', cookie, 'x-csrf-token': csrf }, body: body === undefined ? undefined : JSON.stringify(body) });
    const nextCookie = response.headers.get('set-cookie'); if (nextCookie) cookie = nextCookie.split(';')[0];
    const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text();
    if (data.csrfToken) csrf = data.csrfToken;
    return { status: response.status, data };
  }; };
  try {
    const admin = makeClient(), visitor = makeClient();
    assert.equal((await admin('/api/auth/login', 'POST', { email: 'me.patiphan1@gmail.com', password: 'Admin@12345' })).status, 200);
    assert.equal((await visitor('/api/admin/customer-price-tiers')).status, 401);
    const tiers = [
      { id: 'basic', name: 'Basic', price: 99, description: 'เริ่มต้น', offline: false, durationDays: 30 },
      { id: 'premium', name: 'Premium', price: 299, description: 'ครบทุกฟังก์ชัน', offline: false, durationDays: null },
    ];
    assert.equal((await admin('/api/admin/customer-price-tiers', 'PUT', { tiers })).status, 200);
    assert.equal((await admin('/api/admin/customer-price-tiers')).data.length, 2);
    assert.equal((await admin('/api/admin/customer-price-tiers', 'PUT', { tiers: [{ ...tiers[0], price: -1 }] })).status, 400);

    const zip = new AdmZip();
    const manifest = { slug: 'tier-app', name: 'Tier App', version: '1.0.0', type: 'html-standalone', entry: 'app/index.html', manual: 'app/manual.pdf', program: { id: 'tier-app', name: 'Tier App', thaiName: 'ระบบทดสอบ Tier', price: 0 } };
    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
    zip.addFile('app/index.html', Buffer.from('<!doctype html><html><head></head><body>Tier</body></html>'));
    zip.addFile('app/manual.pdf', Buffer.from('%PDF-1.4\n'));
    const archive = zip.toBuffer().toString('base64');
    assert.equal((await admin('/api/admin/plugins', 'POST', { archive, priceTierIds: ['missing'] })).status, 400);
    assert.equal((await admin('/api/admin/plugins', 'POST', { archive, priceTierIds: ['basic', 'premium'] })).status, 201);
    const installed = db.prepare("SELECT id,manifest FROM plugins WHERE slug='tier-app'").get();
    const savedManifest = JSON.parse(installed.manifest);
    assert.deepEqual(savedManifest.priceTiers.map((tier) => tier.price), [99, 299]);
    assert.equal(savedManifest.program.price, 99);

    const changed = tiers.map((tier) => tier.id === 'basic' ? { ...tier, price: 149 } : tier);
    await admin('/api/admin/customer-price-tiers', 'PUT', { tiers: changed });
    assert.equal(JSON.parse(db.prepare("SELECT manifest FROM plugins WHERE slug='tier-app'").get().manifest).priceTiers[0].price, 99);
    assert.equal((await admin(`/api/admin/plugins/${installed.id}/meta`, 'PATCH', { priceTierIds: ['basic'] })).status, 200);
    assert.equal(JSON.parse(db.prepare("SELECT manifest FROM plugins WHERE slug='tier-app'").get().manifest).priceTiers[0].price, 149);
    assert.equal((await admin(`/api/admin/plugins/${installed.id}/meta`, 'PATCH', { access: 'go' })).status, 200);
    const memberManifest = JSON.parse(db.prepare("SELECT manifest FROM plugins WHERE slug='tier-app'").get().manifest);
    assert.equal(memberManifest.access, 'go');
    assert.equal(memberManifest.program.price, 0);
    assert.equal(memberManifest.priceTiers, undefined);

    const memberZip = new AdmZip();
    const memberPlugin = { ...manifest, slug: 'member-app', name: 'Member App', program: { id: 'member-app', name: 'Member App', thaiName: 'ระบบสมาชิก', price: 999 } };
    memberZip.addFile('manifest.json', Buffer.from(JSON.stringify(memberPlugin)));
    memberZip.addFile('app/index.html', Buffer.from('<!doctype html><html><head></head><body>Member</body></html>'));
    memberZip.addFile('app/manual.pdf', Buffer.from('%PDF-1.4\n'));
    const memberArchive = memberZip.toBuffer().toString('base64');
    assert.equal((await admin('/api/admin/plugins', 'POST', { archive: memberArchive, access: 'go' })).status, 201);
    const uploadedMember = JSON.parse(db.prepare("SELECT manifest FROM plugins WHERE slug='member-app'").get().manifest);
    assert.equal(uploadedMember.access, 'go');
    assert.equal(uploadedMember.program.price, 0);
    assert.equal(uploadedMember.priceTiers, undefined);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    db.close(); rmSync(pluginRoot, { recursive: true, force: true });
  }
});
