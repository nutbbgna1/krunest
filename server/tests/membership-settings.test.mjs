import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../app.mjs';
import { openDatabase } from '../db.mjs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('edited membership pricing survives database reopen', () => {
  const directory = mkdtempSync(join(tmpdir(), 'krunest-membership-'));
  const file = join(directory, 'site.sqlite');
  try {
    const first = openDatabase(file);
    first.prepare("UPDATE plans SET name='สมาชิกใหม่',monthly_price=777 WHERE id='go'").run();
    first.close();
    const reopened = openDatabase(file);
    const plan = reopened.prepare("SELECT name,monthly_price FROM plans WHERE id='go'").get();
    assert.equal(plan.name, 'สมาชิกใหม่');
    assert.equal(plan.monthly_price, 777);
    reopened.close();
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('admin membership settings control storefront, discounted orders and yearly access', async () => {
  const { app, db } = createApp({ dbFile: ':memory:' });
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const client = () => { let cookie = '', csrf = ''; return async (path, method = 'GET', body) => {
    const response = await fetch(base + path, { method, headers: { 'content-type': 'application/json', cookie, 'x-csrf-token': csrf }, body: body === undefined ? undefined : JSON.stringify(body) });
    const newCookie = response.headers.get('set-cookie'); if (newCookie) cookie = newCookie.split(';')[0];
    const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text(); if (data.csrfToken) csrf = data.csrfToken;
    return { status: response.status, data };
  }; };
  try {
    const admin = client(), member = client();
    assert.equal((await admin('/api/auth/login', 'POST', { email: 'me.patiphan1@gmail.com', password: 'Admin@12345' })).status, 200);
    const register = await member('/api/auth/register', 'POST', { email: 'member@example.test', password: 'Teacher@12345', name: 'ครูทดสอบ' });
    await member('/api/auth/verify', 'POST', { token: register.data.devToken });
    await member('/api/auth/login', 'POST', { email: 'member@example.test', password: 'Teacher@12345' });
    for (const [id, access, price] of [['free-app', 'free', 0], ['go-app', 'go', 100], ['pro-app', 'pro', 200], ['paid-app', 'paid', 300]]) {
      db.prepare('INSERT INTO programs (id,name,thai_name,price,active) VALUES (?,?,?,?,1)').run(id, id, id, price);
      db.prepare("INSERT INTO plugins (slug,name,version,status,manifest) VALUES (?,?,?,'active',?)").run(id, id, '1.0.0', JSON.stringify({ slug: id, name: id, version: '1.0.0', type: 'html-standalone', access, program: { id, name: id, thaiName: id, price } }));
    }
    assert.deepEqual((await member('/api/me')).data.entitlements.map((item) => item.program_id).sort(), ['free-app']);
    assert.equal((await member('/api/plugins/free-app/records')).status, 200);
    assert.equal((await member('/api/plugins/go-app/records')).status, 403);
    assert.equal((await member('/api/admin/membership')).status, 403);
    const initial = (await admin('/api/admin/membership')).data;
    const plans = initial.plans.map((plan) => plan.id === 'go' ? { ...plan, active: Boolean(plan.active), name: 'สมาชิกห้องเรียน', monthly_price: 320, yearly_price: 3200, badge: 'เปิดเทอมใหม่', subtitle: 'สำหรับกิจกรรมหน้าชั้นเรียน' } : { ...plan, active: Boolean(plan.active) });
    assert.equal((await admin('/api/admin/membership', 'PUT', { plans, promoCodes: [{ code: 'SCHOOL25', label: 'ส่วนลดครู 25%', discountPercent: 25, active: true }] })).status, 200);
    const visible = (await member('/api/membership')).data.plans.find((plan) => plan.id === 'go');
    assert.equal(visible.name, 'สมาชิกห้องเรียน');
    assert.equal(visible.monthly_price, 320);
    assert.equal(visible.badge, 'เปิดเทอมใหม่');
    assert.equal('program_limit' in visible, false);
    assert.equal(db.prepare("SELECT monthly_price FROM plans WHERE id='go'").get().monthly_price, 320);
    assert.equal((await member('/api/admin/membership', 'PUT', { plans, promoCodes: [] })).status, 403);
    assert.equal((await admin('/api/admin/membership', 'PUT', { plans: plans.map((plan) => ({ ...plan, monthly_price: -1 })), promoCodes: [] })).status, 400);
    db.prepare("INSERT INTO settings (key,value) VALUES ('payment_accounts',?)").run(JSON.stringify([{ id: 'bank', type: 'bank', label: 'ธนาคาร', active: true, bankName: 'ธนาคาร', accountName: 'ทดสอบ', accountNumber: '1234567890' }]));
    assert.equal((await member('/api/orders', 'POST', { targetType: 'program', targetId: 'go-app' })).status, 400, 'membership-only apps cannot be bought separately');
    assert.deepEqual((await member('/api/plugins')).data.find((plugin) => plugin.slug === 'go-app').priceTiers, []);
    assert.equal((await member('/api/orders', 'POST', { targetType: 'plan', targetId: 'go', billingCycle: 'monthly', promoCode: 'BADCODE' })).status, 400);
    const order = await member('/api/orders', 'POST', { targetType: 'plan', targetId: 'go', billingCycle: 'yearly', promoCode: 'SCHOOL25' });
    assert.equal(order.status, 201);
    assert.equal(order.data.amount, 2400);
    assert.equal(order.data.target_id, 'go#yearly');
    assert.equal(order.data.promo.label, 'ส่วนลดครู 25%');
    assert.equal((await member(`/api/orders/${order.data.id}/slip`, 'POST', { fileName: 'test.png', mimeType: 'image/png', data: 'data:image/png;base64,AAAA' })).status, 201);
    assert.equal((await admin(`/api/admin/orders/${order.data.id}/review`, 'POST', { decision: 'approve' })).status, 200);
    const subscription = db.prepare("SELECT billing_cycle,plan_id,ends_at FROM subscriptions WHERE user_id=(SELECT id FROM users WHERE email='member@example.test') ORDER BY id DESC LIMIT 1").get();
    assert.equal(subscription.billing_cycle, 'yearly');
    assert.equal(subscription.plan_id, 'go');
    assert.ok((new Date(subscription.ends_at) - Date.now()) / 86_400_000 > 360);
    db.prepare("INSERT INTO entitlements (user_id,program_id,source,expires_at) SELECT id,'pro-app','subscription',? FROM users WHERE email='member@example.test'").run(subscription.ends_at);
    const memberPrograms = (await member('/api/me')).data.entitlements.map((item) => item.program_id).sort();
    assert.deepEqual(memberPrograms, ['free-app', 'go-app']);
    assert.equal((await member('/api/plugins/go-app/records')).status, 200);
    assert.equal((await member('/api/plugins/pro-app/records')).status, 403);
    assert.equal((await member('/api/plugins/paid-app/records')).status, 403);
    db.prepare("UPDATE subscriptions SET ends_at='2020-01-01' WHERE user_id=(SELECT id FROM users WHERE email='member@example.test')").run();
    const expired = (await member('/api/me')).data;
    assert.equal(expired.subscription, null);
    assert.deepEqual(expired.entitlements.map((item) => item.program_id), ['free-app']);
    const off = (await admin('/api/admin/membership')).data;
    assert.equal((await admin('/api/admin/membership', 'PUT', { plans: off.plans.map((plan) => ({ ...plan, active: Boolean(plan.active) })), promoCodes: off.promoCodes.map((promo) => ({ ...promo, active: false })) })).status, 200);
    assert.equal((await member('/api/orders', 'POST', { targetType: 'plan', targetId: 'go', promoCode: 'SCHOOL25' })).status, 400);
  } finally { await new Promise((resolve) => server.close(resolve)); db.close(); }
});
