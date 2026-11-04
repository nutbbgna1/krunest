import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
import { createApp } from '../app.mjs';
import { createMirror } from '../supabase-mirror.mjs';
import { openDatabase } from '../db.mjs';

// Minimal in-memory Supabase stand-in: tables + storage.
function fakeSupabase() {
  const tables = new Map(); const objects = new Map();
  const table = (name) => { if (!tables.has(name)) tables.set(name, []); return tables.get(name); };
  const from = (name) => {
    const rows = table(name);
    return {
      upsert: async (batch, { onConflict }) => {
        const keys = onConflict.split(',');
        for (const row of batch) { const i = rows.findIndex((r) => keys.every((k) => String(r[k]) === String(row[k]))); if (i >= 0) rows[i] = { ...row }; else rows.push({ ...row }); }
        return { error: null };
      },
      select: (_c, opts) => {
        const result = { error: null, data: rows.slice(), count: rows.length };
        const q = { order: () => q, range: (a, b) => Promise.resolve({ error: null, data: rows.slice(a, b + 1) }), then: (f) => Promise.resolve(result).then(f) };
        return opts?.head ? Promise.resolve({ error: null, count: rows.length }) : q;
      },
      delete: () => { const filters = []; const q = { eq: (k, v) => { filters.push([k, v]); return q; }, then: (f) => { for (let i = rows.length - 1; i >= 0; i--) if (filters.every(([k, v]) => String(rows[i][k]) === String(v))) rows.splice(i, 1); return Promise.resolve({ error: null }).then(f); } }; return q; },
    };
  };
  const storage = { from: () => ({
    upload: async (p, body) => { objects.set(p, Buffer.from(body)); return { error: null }; },
    download: async (p) => objects.has(p) ? { data: { arrayBuffer: async () => objects.get(p) }, error: null } : { data: null, error: { message: 'not found' } },
    remove: async (ps) => { ps.forEach((p) => objects.delete(p)); return { error: null }; },
    createSignedUrl: async (p, s, o) => ({ data: { signedUrl: `https://sb.test/sign/${p}?t=${s}${o?.download ? `&dl=${o.download}` : ''}` }, error: null }),
    createSignedUploadUrl: async (p) => ({ data: { path: p, token: 'tok', signedUrl: `https://sb.test/upload/${p}` }, error: null }),
    list: async (dir, { search }) => ({ data: [...objects.keys()].filter((k) => k.startsWith(`${dir}/`) && k.endsWith(search)).map((k) => ({ name: k.split('/').pop(), metadata: { size: objects.get(k).length } })), error: null }),
  }), createBucket: async () => ({ error: null }) };
  return { tables, objects, from, storage, rpc: async () => ({ error: null }) };
}

test('mirror pushes writes, removes deleted rows and restores an empty database', async () => {
  const sb = fakeSupabase();
  const raw = openDatabase(':memory:');
  const mirror = createMirror(raw, { client: sb, delayMs: 5, log: { error() {}, warn() {} } });
  await mirror.bootstrap();
  assert.equal(mirror.status().mode, 'synced');
  mirror.db.prepare("INSERT INTO users (email,password_hash,name) VALUES ('a@x.test','h','A')").run();
  mirror.db.prepare("INSERT INTO announcements (title,message) VALUES ('t','m')").run();
  await mirror.flush();
  assert.ok(sb.tables.get('users').some((u) => u.email === 'a@x.test'));
  assert.equal(sb.tables.get('announcements')[0].title, 't');
  mirror.db.prepare("UPDATE announcements SET title='t2'").run();
  await mirror.flush();
  assert.equal(sb.tables.get('announcements')[0].title, 't2');
  mirror.db.prepare('DELETE FROM announcements').run();
  await mirror.flush();
  assert.equal(sb.tables.get('announcements').length, 0);
  mirror.db.prepare('INSERT INTO sessions (id,user_id,csrf_token,expires_at) VALUES (?,?,?,?)').run('s', 1, 'c', '2099-01-01');
  await mirror.flush();
  assert.equal(sb.tables.has('sessions'), false, 'volatile tables are never mirrored');

  const fresh = openDatabase(':memory:');
  fresh.prepare('DELETE FROM programs').run(); fresh.prepare('DELETE FROM plans').run();
  const restored = createMirror(fresh, { client: sb, log: { error() {}, warn() {} } });
  await restored.bootstrap();
  assert.equal(restored.status().mode, 'restored-from-supabase');
  assert.ok(fresh.prepare("SELECT email FROM users WHERE email='a@x.test'").get());
});

test('mirror failure keeps data pending and never throws into requests', async () => {
  const sb = fakeSupabase(); const raw = openDatabase(':memory:');
  const mirror = createMirror(raw, { client: sb, delayMs: 5, log: { error() {}, warn() {} } });
  await mirror.bootstrap();
  sb.from = () => ({ upsert: async () => ({ error: { message: 'boom' } }) });
  mirror.db.prepare("INSERT INTO announcements (title,message) VALUES ('t','m')").run();
  await mirror.flush();
  assert.equal(mirror.status().lastError, 'announcements: boom');
  assert.deepEqual(mirror.status().pending, ['announcements']);
  mirror.stop();
});

test('offline installers: signed upload, entitlement-gated signed download, restore of plugin files', async (t) => {
  const sb = fakeSupabase();
  const built = createApp({ dbFile: ':memory:', exposeTokens: true, supabaseClient: sb, mirrorDelayMs: 5, pluginRoot: mkdtempSync(join(tmpdir(), 'plug-')) });
  await built.mirror.bootstrap({ pluginRoot: built.pluginRoot });
  const server = createServer(built.app); await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(() => { server.close(); built.mirror.stop(); });
  const session = () => { let cookie = ''; let csrf = ''; return {
    async request(path, init = {}) {
      const res = await fetch(base + path, { ...init, redirect: 'manual', headers: { ...(init.body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...(csrf ? { 'x-csrf-token': csrf } : {}) }, body: init.body ? JSON.stringify(init.body) : undefined });
      const set = res.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
      const text = await res.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
      if (data?.csrfToken) csrf = data.csrfToken;
      return { res, data };
    },
  }; };
  const db = built.db;
  db.prepare("INSERT INTO settings (key,value) VALUES ('payment_accounts',?)").run(JSON.stringify([{ id: 'pp', type: 'promptpay', label: 'PromptPay', bankName: '', accountName: '', accountNumber: '0891234567', note: '', active: true }]));
  const hash = (await import('../db.mjs')).hashPassword;
  db.prepare("INSERT INTO users (email,password_hash,name,role,email_verified) VALUES ('boss@x.test',?,'Boss','admin',1)").run(hash('Admin@12345678'));
  db.prepare("INSERT INTO users (email,password_hash,name,role,email_verified) VALUES ('buyer@x.test',?,'Buyer','member',1)").run(hash('Buyer@12345678'));
  const admin = session(); const buyer = session();
  assert.equal((await admin.request('/api/auth/login', { method: 'POST', body: { email: 'boss@x.test', password: 'Admin@12345678' } })).res.status, 200);
  assert.equal((await buyer.request('/api/auth/login', { method: 'POST', body: { email: 'buyer@x.test', password: 'Buyer@12345678' } })).res.status, 200);
  await admin.request('/api/me'); await buyer.request('/api/me');

  const manifest = { slug: 'pos-lite', name: 'POS Lite', version: '1.0.0', type: 'offline-installer', program: { id: 'pos-lite', name: 'POS Lite', thaiName: 'โปรแกรมขายหน้าร้าน', price: 900 } };
  const zip = new AdmZip(); zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
  assert.equal((await admin.request('/api/admin/plugins', { method: 'POST', body: { archive: zip.toBuffer().toString('base64') } })).res.status, 201);
  await new Promise((r) => setTimeout(r, 30));
  assert.ok(sb.objects.has('plugins/pos-lite.zip'), 'plugin archive is kept in Supabase Storage');
  const pluginId = db.prepare("SELECT id FROM plugins WHERE slug='pos-lite'").get().id;
  assert.equal((await admin.request(`/api/admin/plugins/${pluginId}/toggle`, { method: 'POST', body: {} })).res.status, 200);

  const up = await admin.request(`/api/admin/plugins/${pluginId}/offline/upload-url`, { method: 'POST', body: { fileName: 'POS Lite Setup.exe' } });
  assert.match(up.data.path, /^offline\/pos-lite\/\d+-POS_Lite_Setup\.exe$/);
  assert.equal((await admin.request(`/api/admin/plugins/${pluginId}/offline`, { method: 'POST', body: { path: up.data.path } })).res.status, 400, 'file must be uploaded first');
  sb.objects.set(up.data.path, Buffer.from('installer-bytes'));
  const done = await admin.request(`/api/admin/plugins/${pluginId}/offline`, { method: 'POST', body: { path: up.data.path, fileName: 'POS Lite Setup.exe' } });
  assert.equal(done.res.status, 200); assert.equal(done.data.offline.size, 15);
  assert.equal((await admin.request(`/api/admin/plugins/${pluginId}/offline`, { method: 'POST', body: { path: 'offline/other/x.exe' } })).res.status, 400);

  const listed = await buyer.request('/api/plugins/pos-lite');
  assert.equal(listed.data.delivery, 'offline'); assert.equal(listed.data.downloadUrl, '/api/plugins/pos-lite/download');

  assert.equal((await buyer.request('/api/plugins/pos-lite/download')).res.status, 403, 'no entitlement, no download');
  db.prepare("INSERT INTO entitlements (user_id,program_id,source) VALUES ((SELECT id FROM users WHERE email='buyer@x.test'),'pos-lite','purchase')").run();
  const dl = await buyer.request('/api/plugins/pos-lite/download');
  assert.equal(dl.res.status, 302);
  assert.match(dl.res.headers.get('location'), /^https:\/\/sb\.test\/sign\/offline\/pos-lite\/.*t=300&dl=POS%20Lite%20Setup\.exe/);
  assert.equal((await admin.request('/api/plugins/pos-lite/download')).res.status, 302, 'admin may always download');

  await built.mirror.flush();
  assert.ok(sb.tables.get('plugins').some((p) => p.slug === 'pos-lite' && JSON.parse(p.manifest).offline.size === 15));

  // --- categories + price tiers ---
  const tiers = [{ id: 'basic', name: 'Basic', price: 400, offline: false }, { id: 'full', name: 'Full', price: 900, offline: true, description: 'รวมไฟล์ติดตั้ง' }];
  assert.equal((await admin.request(`/api/admin/plugins/${pluginId}/meta`, { method: 'PATCH', body: { priceTiers: [{ name: 'x', price: -1 }] } })).res.status, 400);
  assert.equal((await admin.request(`/api/admin/plugins/${pluginId}/meta`, { method: 'PATCH', body: { category: 'nope' } })).res.status, 400);
  assert.equal((await buyer.request('/api/admin/categories', { method: 'PUT', body: { categories: [] } })).res.status, 403);
  assert.equal((await admin.request('/api/admin/categories', { method: 'PUT', body: { categories: [{ id: 'pos', label: 'ขายหน้าร้าน' }, { id: 'pos', label: 'ซ้ำ' }] } })).res.status, 400);
  assert.equal((await admin.request('/api/admin/categories', { method: 'PUT', body: { categories: [{ id: 'pos', label: 'ขายหน้าร้าน' }] } })).res.status, 200);
  assert.equal((await admin.request(`/api/admin/plugins/${pluginId}/meta`, { method: 'PATCH', body: { category: 'pos', priceTiers: tiers } })).res.status, 200);
  const shown = (await buyer.request('/api/plugins/pos-lite')).data;
  assert.equal(shown.category, 'ขายหน้าร้าน'); assert.equal(shown.priceTiers.length, 2); assert.equal(shown.program.price, 400);
  assert.equal(db.prepare("SELECT price FROM programs WHERE id='pos-lite'").get().price, 400);

  db.prepare("INSERT INTO users (email,password_hash,name,role,email_verified) VALUES ('b2@x.test',?,'B2','member',1)").run(hash('Buyer2@12345678'));
  const b2 = session(); await b2.request('/api/auth/login', { method: 'POST', body: { email: 'b2@x.test', password: 'Buyer2@12345678' } }); await b2.request('/api/me');
  const place = (tierId) => b2.request('/api/orders', { method: 'POST', body: { targetType: 'program', targetId: 'pos-lite', tierId } });
  const approve = async (order) => { db.prepare("INSERT OR REPLACE INTO payment_slips (order_id,file_name,mime_type,size,data) VALUES (?,'s.png','image/png',1,'x')").run(order.id); assert.equal((await admin.request(`/api/admin/orders/${order.id}/review`, { method: 'POST', body: { decision: 'approve' } })).res.status, 200); };
  assert.equal((await place(undefined)).res.status, 400, 'a tier must be chosen when several exist');
  const basic = (await place('basic')).data; assert.equal(basic.amount, 400); assert.equal(basic.target_id, 'pos-lite#basic');
  await approve(basic);
  assert.equal(db.prepare("SELECT source FROM entitlements WHERE program_id='pos-lite' AND user_id=(SELECT id FROM users WHERE email='b2@x.test')").get().source, 'purchase:basic');
  assert.equal((await b2.request('/api/plugins/pos-lite/download')).res.status, 403, 'basic tier has no offline installer');
  const full = (await place('full')).data; assert.equal(full.amount, 900); await approve(full);
  assert.equal((await b2.request('/api/plugins/pos-lite/download')).res.status, 302);
  await approve((await place('basic')).data);
  assert.equal(db.prepare("SELECT source FROM entitlements WHERE program_id='pos-lite' AND user_id=(SELECT id FROM users WHERE email='b2@x.test')").get().source, 'purchase:full', 'buying a cheaper tier never downgrades');

  assert.equal((await admin.request(`/api/admin/plugins/${pluginId}`, { method: 'DELETE', body: {} })).res.status, 200);
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(sb.objects.has('plugins/pos-lite.zip'), false); assert.equal(sb.objects.has(up.data.path), false);
});
