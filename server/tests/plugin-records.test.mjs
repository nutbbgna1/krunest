import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../app.mjs';
import AdmZip from 'adm-zip';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { storageBridge } from '../plugin-storage-bridge.mjs';

test('browser bridge restores saved values and sends later writes', async () => {
  const sent=[];
  const window={localStorage:{},addEventListener:()=>{}};
  const script=storageBridge('sample','csrf-token',[{record_key:'draft',payload:{value:'old text'}}]).replace(/^<script>|<\/script>$/g,'');
  runInNewContext(script,{window,fetch:(url,options)=>{sent.push({url,options});return Promise.resolve({ok:true});},setTimeout:(fn)=>{fn();return 1;},clearTimeout:()=>{}});
  assert.equal(window.localStorage.getItem('draft'),'old text');
  window.localStorage.setItem('draft','new text');
  assert.equal(sent.length,1);
  assert.equal(JSON.parse(sent[0].options.body).value,'new text');
  assert.match(sent[0].url,/\/api\/plugins\/sample\/records\/draft$/);
});

test('plugin records belong to the signed-in user; admin can inspect', async () => {
  const pluginRoot=mkdtempSync(join(tmpdir(),'krunest-plugin-records-'));
  const { app, db } = createApp({ dbFile: ':memory:', pluginRoot });
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const mkClient = () => { let cookie = '', csrf = ''; return async (path, method = 'GET', body) => {
    const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', cookie, 'x-csrf-token': csrf }, body: body === undefined ? undefined : JSON.stringify(body) });
    const next = res.headers.get('set-cookie'); if (next) cookie = next.split(';')[0];
    const data = res.headers.get('content-type')?.includes('application/json') ? await res.json() : await res.text(); if (data.csrfToken) csrf = data.csrfToken;
    return { status: res.status, data };
  }; };
  try {
    db.prepare("INSERT INTO programs (id,name,thai_name,price) VALUES ('sample','Sample','ตัวอย่าง',0)").run();
    db.prepare("INSERT INTO plugins (slug,name,version,status,manifest) VALUES ('sample','Sample','1.0.0','active',?)").run(JSON.stringify({ slug:'sample',name:'Sample',version:'1.0.0',type:'html-standalone',program:{id:'sample',name:'Sample',thaiName:'ตัวอย่าง',price:0} }));
    const admin = mkClient(), a = mkClient(), b = mkClient();
    assert.equal((await admin('/api/auth/login','POST',{email:'me.patiphan1@gmail.com',password:'Admin@12345'})).status,200);
    for (const [client,email] of [[a,'a@example.test'],[b,'b@example.test']]) {
      const reg=await client('/api/auth/register','POST',{email,password:'Teacher@12345',name:'ครูตัวอย่าง'});
      await client('/api/auth/verify','POST',{token:reg.data.devToken});
      await client('/api/auth/login','POST',{email,password:'Teacher@12345'});
    }
    db.prepare("INSERT INTO entitlements (user_id,program_id,source) SELECT id,'sample','test' FROM users WHERE email IN ('a@example.test','b@example.test')").run();
    assert.equal((await a('/api/plugins/sample/records/draft','PUT',{note:'งาน A'})).status,200);
    assert.equal((await b('/api/plugins/sample/records/draft','PUT',{note:'งาน B'})).status,200);
    assert.equal((await a('/api/plugins/sample/records')).data[0].value.note,'งาน A');
    assert.equal((await b('/api/plugins/sample/records')).data[0].value.note,'งาน B');
    assert.equal((await a('/api/admin/plugin-records?slug=sample')).status,403);
    assert.equal((await admin('/api/admin/plugin-records?slug=sample')).data.length,2);
    const zip=new AdmZip(); zip.addFile('sample-app/index.html',Buffer.from('<!doctype html><html><head></head><body>โปรแกรมตัวอย่าง</body></html>'));
    const installed=await admin('/api/admin/plugins','POST',{archive:zip.toBuffer().toString('base64'),name:'ระบบใหม่',slug:'new-app',manual:Buffer.from('%PDF-1.4\n').toString('base64'),price:0});
    assert.equal(installed.status,201);
    const row=db.prepare("SELECT id FROM plugins WHERE slug='new-app'").get();
    await admin(`/api/admin/plugins/${row.id}/toggle`,'POST',{});
    const detail=await admin('/api/plugins/new-app');
    assert.equal(detail.data.manualUrl,'/plugins/new-app/manual');
    const page=await admin('/plugins/new-app/app/');
    assert.equal(page.status,200);
    assert.match(page.data,/KrunestRecords/);
  } finally { await new Promise((resolve) => server.close(resolve)); db.close(); rmSync(pluginRoot,{recursive:true,force:true}); }
});
