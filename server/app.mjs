import express from 'express';
import crypto from 'node:crypto';
import { cpSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve, basename, dirname } from 'node:path';
import AdmZip from 'adm-zip';
import generatePromptPayPayload from 'promptpay-qr';
import QRCode from 'qrcode';
import { openDatabase, hashPassword, verifyPassword, publicUser } from './db.mjs';
import { checkSupabase, getSupabaseAdmin, isSupabaseConfigured } from './supabase.mjs';
import { syncDatabaseToSupabase } from './supabase-sync.mjs';
import { createMirror } from './supabase-mirror.mjs';
import { createStorage, safeObjectName } from './storage.mjs';
import { storageBridge } from './plugin-storage-bridge.mjs';
import { buildPluginCover } from './plugin-cover.mjs';

const DAY = 86_400_000;
const token = () => crypto.randomBytes(24).toString('hex');
const isoAfter = (ms) => new Date(Date.now() + ms).toISOString();
const parseCookies = (header = '') => Object.fromEntries(header.split(';').map(v => v.trim().split('=').map(decodeURIComponent)).filter(v => v.length === 2));
const validPassword = (value) => typeof value === 'string' && value.length >= 10 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);

export function createApp(options = {}) {
  const rawDb = options.db || openDatabase(options.dbFile, { seedDemoPrograms: Boolean(options.seedDemoPrograms) });
  const storageClient = createStorage(options.supabaseClient || null);
  const mirror = createMirror(rawDb, { client: options.supabaseClient || null, storage: storageClient, delayMs: options.mirrorDelayMs ?? 2000 });
  const db = mirror.enabled ? mirror.db : rawDb;
  const storage = mirror.enabled ? storageClient : null;
  const persistentRoot = process.env.NODE_ENV === 'production' && process.env.HOME ? join(process.env.HOME, 'krunest-data') : 'data';
  const pluginRoot = resolve(options.pluginRoot || process.env.KRUNEST_PLUGIN_ROOT || join(persistentRoot, 'plugins'));
  if (!existsSync(pluginRoot) && process.env.NODE_ENV === 'production' && existsSync('data/plugins')) cpSync('data/plugins', pluginRoot, { recursive: true });
  mkdirSync(pluginRoot, { recursive: true });
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '45mb' }));
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; frame-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'",
    });
    req.cookies = parseCookies(req.headers.cookie);
    next();
  });

  const audit = (actorId, action, type, id = null, detail = {}) => db.prepare(
    'INSERT INTO audit_logs (actor_id,action,subject_type,subject_id,detail) VALUES (?,?,?,?,?)'
  ).run(actorId || null, action, type, id == null ? null : String(id), JSON.stringify(detail));
  const notify = (userId, title, message) => db.prepare('INSERT INTO notifications (user_id,title,message) VALUES (?,?,?)').run(userId, title, message);
  const queueEmail = (recipient, template, payload, key = `${template}:${recipient}:${Date.now()}`) => db.prepare(
    'INSERT OR IGNORE INTO email_queue (dedupe_key,recipient,template,payload) VALUES (?,?,?,?)'
  ).run(key, recipient, template, JSON.stringify(payload));

  function session(req, res, next) {
    const id = req.cookies.krunest_session;
    const row = id && db.prepare(`SELECT s.*,u.email,u.name,u.organization,u.role,u.email_verified,u.two_factor_enabled,u.notification_email
      FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at > CURRENT_TIMESTAMP`).get(id);
    if (row) {
      req.session = row;
      req.user = { id: row.user_id, email: row.email, name: row.name, organization: row.organization, role: row.role,
        email_verified: row.email_verified, two_factor_enabled: row.two_factor_enabled, notification_email: row.notification_email };
      db.prepare('UPDATE sessions SET last_seen_at=CURRENT_TIMESTAMP WHERE id=?').run(id);
    }
    next();
  }
  app.use(session);
  const auth = (req, res, next) => req.user ? next() : res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
  const admin = (req, res, next) => req.user?.role === 'admin' ? next() : res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบ' });
  const sales = (req, res, next) => ['admin','staff'].includes(req.user?.role) ? next() : res.status(403).json({ error: 'ไม่มีสิทธิ์ฝ่ายขาย' });
  const csrf = (req, res, next) => ['GET','HEAD','OPTIONS'].includes(req.method) || req.headers['x-csrf-token'] === req.session?.csrf_token
    ? next() : res.status(403).json({ error: 'CSRF token ไม่ถูกต้อง' });
  const settingJson = (key, fallback) => {
    try { return JSON.parse(db.prepare('SELECT value FROM settings WHERE key=?').get(key)?.value || 'null') ?? fallback; }
    catch { return fallback; }
  };
  const planMeta = () => settingJson('member_plan_meta', {});
  const promoCodes = () => settingJson('member_promo_codes', []);
  const MEMBER_ACCESS_RANK = { free: 0, go: 1, pro: 2, max: 3 };
  const manifestMemberAccess = (manifest) => {
    if (Object.hasOwn(MEMBER_ACCESS_RANK, manifest?.access)) return manifest.access;
    const prices = Array.isArray(manifest?.priceTiers) ? manifest.priceTiers.map((tier) => Number(tier.price)) : [Number(manifest?.program?.price || 0)];
    return prices.length && Math.min(...prices) === 0 ? 'free' : 'paid';
  };
  const memberPlanAllows = (planId, access) => access !== 'paid' && Object.hasOwn(MEMBER_ACCESS_RANK, planId)
    && Object.hasOwn(MEMBER_ACCESS_RANK, access) && MEMBER_ACCESS_RANK[planId] >= MEMBER_ACCESS_RANK[access];
  const membershipPrograms = (planId) => db.prepare("SELECT slug,manifest FROM plugins WHERE status='active'").all().flatMap((row) => {
    try {
      const manifest = JSON.parse(row.manifest);
      if (!memberPlanAllows(planId, manifestMemberAccess(manifest))) return [];
      const id = manifest.program?.id || row.slug;
      const program = db.prepare('SELECT id,name,thai_name FROM programs WHERE id=? AND active=1').get(id);
      return program ? [program] : [];
    } catch { return []; }
  });
  const memberPlans = () => {
    const meta = planMeta();
    return db.prepare('SELECT id,name,monthly_price,yearly_price,active FROM plans ORDER BY monthly_price,id').all()
      .map((plan) => ({ ...plan, badge: meta[plan.id]?.badge || '', subtitle: meta[plan.id]?.subtitle || '' }));
  };
  const setSession = (res, userId) => {
    const id = token(); const csrfToken = token();
    db.prepare('DELETE FROM sessions WHERE user_id=?').run(userId);
    db.prepare('INSERT INTO sessions (id,user_id,csrf_token,expires_at) VALUES (?,?,?,?)').run(id, userId, csrfToken, isoAfter(7 * DAY));
    res.setHeader('Set-Cookie', `krunest_session=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);
    return csrfToken;
  };

  app.get('/api/health', (_req, res) => {
    const state = mirror.status();
    res.json({
      ok: true,
      database: true,
      source: state.mode,
      verified: state.verification?.ok ?? null,
      time: new Date().toISOString(),
    });
  });
  app.get('/api/catalog', (_req, res) => res.json({
    programs: db.prepare('SELECT * FROM programs WHERE active=1 ORDER BY price').all(),
    plans: db.prepare('SELECT * FROM plans WHERE active=1 ORDER BY monthly_price').all(),
  }));
  app.get('/api/membership', (_req, res) => res.json({ plans: memberPlans().filter((plan) => plan.active) }));
  app.get('/api/admin/membership', auth, admin, (_req, res) => res.json({ plans: memberPlans(), promoCodes: promoCodes() }));
  app.put('/api/admin/membership', auth, admin, csrf, (req, res) => {
    const current = db.prepare('SELECT id FROM plans').all().map((row) => row.id);
    const plans = req.body?.plans, codes = req.body?.promoCodes;
    if (!Array.isArray(plans) || plans.length !== current.length || !Array.isArray(codes) || codes.length > 30) return res.status(400).json({ error: 'ข้อมูลแพ็กเกจหรือโปรโมชันไม่ถูกต้อง' });
    const validPrice = (value) => Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000;
    const ids = new Set(), meta = {};
    for (const plan of plans) {
      const name = String(plan.name || '').trim(), badge = String(plan.badge || '').trim(), subtitle = String(plan.subtitle || '').trim();
      if (!current.includes(plan.id) || ids.has(plan.id) || !name || name.length > 80 || badge.length > 60 || subtitle.length > 200 || !validPrice(plan.monthly_price) || !validPrice(plan.yearly_price) || typeof plan.active !== 'boolean') return res.status(400).json({ error: 'ชื่อหรือราคาของแพ็กเกจไม่ถูกต้อง' });
      ids.add(plan.id); meta[plan.id] = { badge, subtitle };
    }
    const seenCodes = new Set(), cleanCodes = [];
    for (const row of codes) {
      const code = String(row.code || '').trim().toUpperCase(), label = String(row.label || '').trim();
      if (!/^[A-Z0-9_-]{3,24}$/.test(code) || seenCodes.has(code) || !label || label.length > 80 || !Number.isSafeInteger(row.discountPercent) || row.discountPercent < 1 || row.discountPercent > 100 || typeof row.active !== 'boolean') return res.status(400).json({ error: 'รหัสหรือส่วนลดโปรโมชันไม่ถูกต้อง' });
      seenCodes.add(code); cleanCodes.push({ code, label, discountPercent: row.discountPercent, active: row.active });
    }
    db.exec('BEGIN');
    try {
      const update = db.prepare('UPDATE plans SET name=?,monthly_price=?,yearly_price=?,active=? WHERE id=?');
      for (const plan of plans) update.run(plan.name.trim(),plan.monthly_price,plan.yearly_price,plan.active ? 1 : 0,plan.id);
      db.prepare("INSERT INTO settings (key,value) VALUES ('member_plan_meta',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(meta));
      db.prepare("INSERT INTO settings (key,value) VALUES ('member_promo_codes',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(cleanCodes));
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    audit(req.user.id,'update_membership','settings',null,{plans:plans.length,promoCodes:cleanCodes.length});
    res.json({ ok: true, plans: memberPlans(), promoCodes: cleanCodes });
  });
  app.post('/api/auth/register', (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const name = String(req.body.name || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email) || name.length < 2 || !validPassword(req.body.password)) return res.status(400).json({ error: 'กรอกข้อมูลให้ครบ และรหัสผ่านต้องมีอย่างน้อย 10 ตัว พร้อมตัวพิมพ์ใหญ่ พิมพ์เล็ก และตัวเลข' });
    if (db.prepare('SELECT id FROM users WHERE email=?').get(email)) return res.status(409).json({ error: 'อีเมลนี้มีบัญชีแล้ว' });
    const result = db.prepare('INSERT INTO users (email,password_hash,name,organization) VALUES (?,?,?,?)').run(email, hashPassword(req.body.password), name, String(req.body.organization || ''));
    db.prepare("INSERT INTO entitlements (user_id,program_id,source) SELECT ?,id,'free' FROM programs WHERE id='docuflow-tax' AND active=1").run(result.lastInsertRowid);
    const verifyToken = token();
    db.prepare('INSERT INTO tokens (token,user_id,type,expires_at) VALUES (?,?,?,?)').run(verifyToken, result.lastInsertRowid, 'verify', isoAfter(DAY));
    queueEmail(email, 'verify_email', { name, token: verifyToken }, `verify:${email}`);
    audit(result.lastInsertRowid, 'register', 'user', result.lastInsertRowid);
    res.status(201).json({ ok: true, message: 'สร้างบัญชีแล้ว กรุณายืนยันอีเมล', devToken: verifyToken });
  });
  app.post('/api/auth/verify', (req, res) => {
    const row = db.prepare("SELECT * FROM tokens WHERE token=? AND type='verify' AND used_at IS NULL AND expires_at>CURRENT_TIMESTAMP").get(req.body.token);
    if (!row) return res.status(400).json({ error: 'ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุ' });
    db.prepare('UPDATE users SET email_verified=1 WHERE id=?').run(row.user_id);
    db.prepare('UPDATE tokens SET used_at=CURRENT_TIMESTAMP WHERE token=?').run(row.token);
    res.json({ ok: true });
  });
  app.post('/api/auth/login', (req, res) => {
    const email = String(req.body.email || '').toLowerCase();
    const key = `${req.ip}:${email}`;
    const attempt = db.prepare('SELECT * FROM login_attempts WHERE key=?').get(key);
    if (attempt && attempt.count >= 5 && new Date(attempt.reset_at) > new Date()) return res.status(429).json({ error: 'ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 15 นาที' });
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!user || !verifyPassword(req.body.password || '', user.password_hash)) {
      db.prepare(`INSERT INTO login_attempts (key,count,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1,reset_at=excluded.reset_at`).run(key, isoAfter(15 * 60_000));
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }
    if (!user.email_verified) return res.status(403).json({ error: 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ' });
    if (user.two_factor_enabled && req.body.otp !== totp(user.two_factor_secret)) return res.status(202).json({ requiresTwoFactor: true });
    const active = db.prepare('SELECT id FROM sessions WHERE user_id=? AND expires_at>CURRENT_TIMESTAMP').get(user.id);
    if (active && !req.body.takeover) return res.status(409).json({ error: 'บัญชีนี้กำลังใช้งานในอุปกรณ์อื่น', reason: 'takeover' });
    db.prepare('DELETE FROM login_attempts WHERE key=?').run(key);
    const csrfToken = setSession(res, user.id);
    audit(user.id, active ? 'session_takeover' : 'login', 'session');
    res.json({ user: publicUser(user), csrfToken });
  });
  app.post('/api/auth/forgot', (req, res) => {
    const email = String(req.body.email || '').toLowerCase(); const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    let resetToken;
    if (user) { resetToken = token(); db.prepare('INSERT INTO tokens (token,user_id,type,expires_at) VALUES (?,?,?,?)').run(resetToken,user.id,'reset',isoAfter(60*60_000)); queueEmail(email,'reset_password',{ token: resetToken },`reset:${email}:${new Date().toISOString().slice(0,13)}`); }
    res.json({ ok: true, message: 'หากพบอีเมล ระบบจะส่งวิธีตั้งรหัสผ่านใหม่', ...(options.exposeTokens && { devToken: resetToken }) });
  });
  app.post('/api/auth/reset', (req, res) => {
    const row = db.prepare("SELECT * FROM tokens WHERE token=? AND type='reset' AND used_at IS NULL AND expires_at>CURRENT_TIMESTAMP").get(req.body.token);
    if (!row || !validPassword(req.body.password)) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้องหรือรหัสผ่านไม่ผ่านเงื่อนไข' });
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashPassword(req.body.password),row.user_id);
    db.prepare('UPDATE tokens SET used_at=CURRENT_TIMESTAMP WHERE token=?').run(row.token); db.prepare('DELETE FROM sessions WHERE user_id=?').run(row.user_id);
    res.json({ ok: true });
  });
  app.get('/api/auth/google', async (req, res, next) => { try {
    if (!isSupabaseConfigured()) return res.status(503).json({ error: 'ยังไม่ได้เชื่อมต่อ Supabase Auth' });
    const siteUrl = process.env.APP_URL || `https://${req.get('host')}`;
    const { data, error } = await getSupabaseAdmin().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl.replace(/\/$/, '')}/auth/google/callback`, skipBrowserRedirect: true },
    });
    if (error || !data?.url) return res.status(503).json({ error: error?.message || 'Google Login ยังไม่พร้อมใช้งาน' });
    res.redirect(data.url);
  } catch (error) { next(error); }});
  app.post('/api/auth/google/session', async (req, res, next) => { try {
    const accessToken = String(req.body.accessToken || '');
    if (!accessToken) return res.status(400).json({ error: 'ไม่พบข้อมูลยืนยันตัวตนจาก Google' });
    const { data, error } = await getSupabaseAdmin().auth.getUser(accessToken);
    const identity = data?.user;
    const email = String(identity?.email || '').toLowerCase();
    if (error || !identity || !email || !identity.email_confirmed_at) return res.status(401).json({ error: 'ไม่สามารถยืนยันบัญชี Google ได้' });
    let user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!user) {
      const metadata = identity.user_metadata || {};
      const name = String(metadata.full_name || metadata.name || email.split('@')[0]).trim().slice(0, 120);
      const passwordHash = hashPassword(crypto.randomBytes(32).toString('hex'));
      const result = db.prepare("INSERT INTO users (email,password_hash,name,organization,email_verified,role) VALUES (?,?,?,?,1,'member')").run(email,passwordHash,name || email,'');
      user = db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid);
      audit(user.id,'register_google','user',user.id,{provider:'google'});
    }
    const csrfToken = setSession(res, user.id);
    audit(user.id,'login_google','session',null,{provider:'google'});
    res.json({ user: publicUser(user), csrfToken });
  } catch (error) { next(error); }});
  app.post('/api/auth/logout', auth, csrf, (req, res) => { db.prepare('DELETE FROM sessions WHERE id=?').run(req.session.id); res.setHeader('Set-Cookie','krunest_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'); res.json({ ok:true }); });
  app.get('/api/me', auth, (req, res) => {
    const subscription = db.prepare(`SELECT s.*,p.name plan_name FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE user_id=? AND status='active' AND (s.ends_at IS NULL OR s.ends_at>CURRENT_TIMESTAMP) ORDER BY s.id DESC LIMIT 1`).get(req.user.id);
    const entitlements = db.prepare(`SELECT e.*,p.name,p.thai_name FROM entitlements e JOIN programs p ON p.id=e.program_id WHERE user_id=? AND e.source<>'subscription' AND p.active=1 AND (expires_at IS NULL OR expires_at>CURRENT_TIMESTAMP)`).all(req.user.id);
    const effectivePlan = subscription?.plan_id || 'free';
    const known = new Set(entitlements.map((item) => item.program_id));
    for (const program of membershipPrograms(effectivePlan)) if (!known.has(program.id)) entitlements.push({
      program_id: program.id, access_level: 'full', source: `membership:${effectivePlan}`,
      expires_at: subscription?.ends_at || null, name: program.name, thai_name: program.thai_name,
    });
    res.json({ user: publicUser(req.user), csrfToken:req.session.csrf_token, entitlements, subscription: subscription || null });
  });
  app.patch('/api/me', auth, csrf, (req, res) => {
    const name=String(req.body.name||'').trim(); if(name.length<2) return res.status(400).json({error:'กรุณาระบุชื่อ'});
    db.prepare('UPDATE users SET name=?,organization=?,notification_email=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(name,String(req.body.organization||''),req.body.notification_email===false?0:1,req.user.id);
    audit(req.user.id,'update_profile','user',req.user.id); res.json({ok:true});
  });
  app.post('/api/me/password', auth, csrf, (req,res)=>{ const u=db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id); if(!verifyPassword(req.body.currentPassword||'',u.password_hash)||!validPassword(req.body.newPassword)) return res.status(400).json({error:'รหัสผ่านเดิมไม่ถูกต้อง หรือรหัสผ่านใหม่ไม่ผ่านเงื่อนไข'}); db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashPassword(req.body.newPassword),u.id); audit(u.id,'change_password','user',u.id); res.json({ok:true}); });
  app.get('/api/me/notifications',auth,(req,res)=>res.json(db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 30').all(req.user.id)));
  app.post('/api/me/trials/:programId',auth,csrf,(req,res)=>{ const p=db.prepare('SELECT * FROM programs WHERE id=? AND active=1').get(req.params.programId); if(!p)return res.status(404).json({error:'ไม่พบโปรแกรม'}); const existing=db.prepare("SELECT 1 FROM entitlements WHERE user_id=? AND program_id=?").get(req.user.id,p.id); if(existing)return res.status(409).json({error:'เคยรับสิทธิ์โปรแกรมนี้แล้ว'}); db.prepare("INSERT INTO entitlements (user_id,program_id,access_level,source,expires_at) VALUES (?,?,?,?,?)").run(req.user.id,p.id,'limited','trial',isoAfter(7*DAY)); notify(req.user.id,'เริ่มทดลองใช้ฟรี',`${p.name} ใช้งานได้ 7 วัน`); res.status(201).json({ok:true}); });

  app.get('/api/orders',auth,(req,res)=>res.json(db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC').all(req.user.id)));
  app.post('/api/orders',auth,csrf,async(req,res,next)=>{try{
    const accounts=getPaymentAccounts().filter(a=>a.active);
    if(!accounts.length)return res.status(503).json({error:'ร้านยังไม่ได้ตั้งค่าบัญชีรับเงิน กรุณาติดต่อผู้ดูแลระบบ'});
    const type=req.body.targetType; const id=String(req.body.targetId||''); let amount=0;
    let targetId=id;
    if(type==='program'){const p=db.prepare('SELECT * FROM programs WHERE id=? AND active=1').get(id); if(!p)return res.status(404).json({error:'ไม่พบโปรแกรม'}); amount=p.price;
      const found=pluginByProgram(id);
      if(found&&accessOf(found.manifest)!=='paid')return res.status(400).json({error:'ระบบนี้ใช้สิทธิ์จากแพ็กเกจสมาชิก ไม่สามารถซื้อแยกได้'});
      if(found&&Array.isArray(found.manifest.priceTiers)&&found.manifest.priceTiers.length){const tiers=found.manifest.priceTiers;const wanted=String(req.body.tierId||'');const tier=wanted?tiers.find(t=>t.id===wanted):(tiers.length===1?tiers[0]:null);if(!tier)return res.status(400).json({error:'กรุณาเลือกระดับราคา'});amount=tier.price;targetId=`${id}#${tier.id}`;}}
    else if(type==='plan'){
      const p=db.prepare('SELECT * FROM plans WHERE id=? AND active=1').get(id);
      if(!p)return res.status(404).json({error:'ไม่พบแพ็กเกจ'});
      const cycle=req.body.billingCycle==='yearly'?'yearly':'monthly';
      amount=cycle==='yearly'?p.yearly_price:p.monthly_price;
      targetId=`${id}#${cycle}`;
      const code=String(req.body.promoCode||'').trim().toUpperCase();
      if(code){
        const promo=promoCodes().find((row)=>row.code===code&&row.active);
        if(!promo)return res.status(400).json({error:'รหัสโปรโมชันไม่ถูกต้องหรือปิดใช้งานแล้ว'});
        amount=Math.max(0,amount-Math.round(amount*promo.discountPercent/100));
        req.memberPromo={code,label:promo.label,discountPercent:promo.discountPercent};
      }
    }
    else return res.status(400).json({error:'ประเภทรายการไม่ถูกต้อง'});
    const reference=`KN${new Date().toISOString().slice(2,10).replaceAll('-','')}${crypto.randomInt(10000,99999)}`;
    const result=db.prepare('INSERT INTO orders (reference,user_id,target_type,target_id,amount,expires_at) VALUES (?,?,?,?,?,?)').run(reference,req.user.id,type,targetId,amount,isoAfter(48*60*60_000)); audit(req.user.id,'create_order','order',result.lastInsertRowid,req.memberPromo || {});
    const order=db.prepare('SELECT * FROM orders WHERE id=?').get(result.lastInsertRowid);
    const pp=accounts.find(a=>a.type==='promptpay');
    const promptPayPayload=pp?generatePromptPayPayload(pp.accountNumber,{amount:Number(amount)}):null;
    const qrDataUrl=promptPayPayload?await QRCode.toDataURL(promptPayPayload,{width:320,margin:1,errorCorrectionLevel:'M'}):null;
    res.status(201).json({...order,promptPayPayload,qrDataUrl,accounts,promo:req.memberPromo || null});
  }catch(error){next(error)}});
  app.post('/api/orders/:id/slip',auth,csrf,(req,res)=>{ const order=db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(req.params.id,req.user.id); if(!order||order.status!=='pending')return res.status(404).json({error:'ไม่พบคำสั่งซื้อที่รอชำระ'}); const {fileName,mimeType,data}=req.body; if(!['image/jpeg','image/png','application/pdf'].includes(mimeType)||typeof data!=='string')return res.status(400).json({error:'รองรับไฟล์ JPG, PNG หรือ PDF เท่านั้น'}); const size=Buffer.byteLength(data,'utf8'); if(size>5*1024*1024)return res.status(413).json({error:'ไฟล์ต้องไม่เกิน 5MB'}); db.prepare('INSERT OR REPLACE INTO payment_slips (order_id,file_name,mime_type,size,data) VALUES (?,?,?,?,?)').run(order.id,basename(String(fileName||'slip')),mimeType,size,data); db.prepare("UPDATE orders SET status='reviewing' WHERE id=?").run(order.id); notify(req.user.id,'รับหลักฐานการชำระเงินแล้ว',`คำสั่งซื้อ ${order.reference} กำลังรอตรวจสอบ`); res.status(201).json({ok:true}); });
  app.get('/api/orders/:id/receipt',auth,(req,res)=>{const row=db.prepare(`SELECT r.receipt_no,r.issued_at,o.reference,o.amount,o.target_type,o.target_id,u.name,u.organization FROM receipts r JOIN orders o ON o.id=r.order_id JOIN users u ON u.id=o.user_id WHERE o.id=? AND (o.user_id=? OR ? IN ('admin','staff'))`).get(req.params.id,req.user.id,req.user.role); if(!row)return res.status(404).json({error:'ยังไม่มีใบเสร็จ'}); res.json(row);});

  app.get('/api/teams',auth,(req,res)=>res.json(db.prepare(`SELECT t.*,tm.team_role,(SELECT COUNT(*) FROM team_members x WHERE x.team_id=t.id) member_count FROM teams t JOIN team_members tm ON tm.team_id=t.id WHERE tm.user_id=?`).all(req.user.id)));
  app.post('/api/teams',auth,csrf,(req,res)=>{const name=String(req.body.name||'').trim();if(name.length<2)return res.status(400).json({error:'กรุณาระบุชื่อทีม'});const result=db.prepare('INSERT INTO teams (name,owner_id,seat_limit) VALUES (?,?,?)').run(name,req.user.id,Math.min(100,Math.max(2,Number(req.body.seatLimit)||5)));db.prepare("INSERT INTO team_members (team_id,user_id,team_role) VALUES (?,?,'owner')").run(result.lastInsertRowid,req.user.id);res.status(201).json({id:Number(result.lastInsertRowid),name});});
  app.post('/api/teams/:id/invites',auth,csrf,(req,res)=>{const team=db.prepare('SELECT * FROM teams WHERE id=? AND owner_id=?').get(req.params.id,req.user.id);if(!team)return res.status(403).json({error:'เฉพาะเจ้าของทีม'});const invite=token();db.prepare('INSERT INTO team_invites (token,team_id,email,expires_at) VALUES (?,?,?,?)').run(invite,team.id,String(req.body.email||'').toLowerCase()||null,isoAfter(7*DAY));if(req.body.email)queueEmail(req.body.email,'team_invite',{team:team.name,token:invite});res.status(201).json({token:invite,inviteUrl:`/join/${invite}`});});
  app.post('/api/teams/join/:token',auth,csrf,(req,res)=>{const invite=db.prepare('SELECT * FROM team_invites WHERE token=? AND used_at IS NULL AND expires_at>CURRENT_TIMESTAMP').get(req.params.token);if(!invite)return res.status(400).json({error:'ลิงก์เชิญไม่ถูกต้องหรือหมดอายุ'});const team=db.prepare('SELECT * FROM teams WHERE id=?').get(invite.team_id);const count=db.prepare('SELECT COUNT(*) count FROM team_members WHERE team_id=?').get(team.id).count;if(count>=team.seat_limit)return res.status(409).json({error:'ที่นั่งของทีมเต็มแล้ว'});db.prepare("INSERT OR IGNORE INTO team_members (team_id,user_id) VALUES (?,?)").run(team.id,req.user.id);db.prepare('UPDATE team_invites SET used_at=CURRENT_TIMESTAMP WHERE token=?').run(invite.token);res.json({ok:true,team:team.name});});

  const orderRows = () => db.prepare(`SELECT o.*,u.name,u.email,u.organization,ps.file_name FROM orders o JOIN users u ON u.id=o.user_id LEFT JOIN payment_slips ps ON ps.order_id=o.id ORDER BY o.id DESC`).all();
  const slipForOrder = (req,res) => {const slip=db.prepare('SELECT file_name,mime_type,size,data,uploaded_at FROM payment_slips WHERE order_id=?').get(req.params.id);return slip?res.json(slip):res.status(404).json({error:'รายการนี้ยังไม่มีหลักฐานการชำระเงิน'});};
  const reviewOrder = (req, res) => {
    const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
    if (!order || !['reviewing','pending'].includes(order.status)) return res.status(404).json({ error: 'ไม่พบรายการที่รอตรวจสอบ' });
    if (req.body.decision === 'reject') {
      db.prepare("UPDATE orders SET status='rejected',reject_reason=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?")
        .run(String(req.body.reason || 'หลักฐานไม่ถูกต้อง'), req.user.id, order.id);
      notify(order.user_id, 'การชำระเงินไม่ผ่านการตรวจสอบ', String(req.body.reason || 'กรุณาส่งหลักฐานใหม่'));
      audit(req.user.id, 'reject_order', 'order', order.id);
      return res.json({ ok: true });
    }
    if (req.body.decision !== 'approve') return res.status(400).json({ error: 'ผลตรวจสอบไม่ถูกต้อง' });
    if (order.amount > 0 && !db.prepare('SELECT 1 FROM payment_slips WHERE order_id=?').get(order.id)) return res.status(400).json({ error: 'ยังไม่มีหลักฐานการชำระเงิน จึงอนุมัติไม่ได้' });
    db.exec('BEGIN');
    try {
      db.prepare("UPDATE orders SET status='approved',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?").run(req.user.id, order.id);
      if (order.target_type === 'program') {
        const { programId, tierId } = splitTarget(order.target_id);
        const found = tierId ? pluginByProgram(programId) : null;
        const tier = found ? tiersOf(found.manifest).find((t) => t.id === tierId) : null;
        const expires = tier?.durationDays ? isoAfter(tier.durationDays * DAY) : null;
        const current = db.prepare('SELECT source,expires_at FROM entitlements WHERE user_id=? AND program_id=?').get(order.user_id, programId);
        const currentTier = current?.source?.startsWith('purchase:') && found ? tiersOf(found.manifest).find((t) => t.id === current.source.slice(9)) : null;
        const currentActive = currentTier && (!current.expires_at || current.expires_at > new Date().toISOString());
        if (!(currentActive && tier && currentTier.price > tier.price)) db.prepare("INSERT INTO entitlements (user_id,program_id,source,expires_at) VALUES (?,?,?,?) ON CONFLICT(user_id,program_id) DO UPDATE SET access_level='full',source=excluded.source,expires_at=excluded.expires_at")
          .run(order.user_id, programId, tier ? `purchase:${tier.id}` : 'purchase', expires);
      } else {
        db.prepare("UPDATE subscriptions SET status='expired' WHERE user_id=? AND status='active'").run(order.user_id);
        db.prepare("DELETE FROM entitlements WHERE user_id=? AND source='subscription'").run(order.user_id);
        const [planId, cycleHint] = String(order.target_id).split('#');
        const cycle = cycleHint === 'yearly' ? 'yearly' : 'monthly';
        const end = isoAfter((cycle === 'yearly' ? 365 : 30) * DAY);
        db.prepare('INSERT INTO subscriptions (user_id,plan_id,billing_cycle,ends_at) VALUES (?,?,?,?)').run(order.user_id, planId, cycle, end);
      }
      const receipt = `RC${new Date().getFullYear()}${String(order.id).padStart(6, '0')}`;
      db.prepare('INSERT INTO receipts (receipt_no,order_id) VALUES (?,?)').run(receipt, order.id);
      db.exec('COMMIT');
      notify(order.user_id, 'อนุมัติการชำระเงินแล้ว', `คำสั่งซื้อ ${order.reference} พร้อมใช้งาน`);
      const user = db.prepare('SELECT email,name FROM users WHERE id=?').get(order.user_id);
      queueEmail(user.email, 'payment_approved', { name: user.name, reference: order.reference, receipt });
      audit(req.user.id, 'approve_order', 'order', order.id);
      res.json({ ok: true, receipt });
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  };

  app.get('/api/sales/summary',auth,sales,(_req,res)=>res.json({totalOrders:db.prepare('SELECT COUNT(*) count FROM orders').get().count,pendingOrders:db.prepare("SELECT COUNT(*) count FROM orders WHERE status IN ('pending','reviewing')").get().count,approvedOrders:db.prepare("SELECT COUNT(*) count FROM orders WHERE status='approved'").get().count,revenue:db.prepare("SELECT COALESCE(SUM(amount),0) total FROM orders WHERE status='approved'").get().total,customers:db.prepare('SELECT COUNT(DISTINCT user_id) count FROM orders').get().count}));
  app.get('/api/sales/orders',auth,sales,(_req,res)=>res.json(orderRows()));
  app.get('/api/sales/orders/:id/slip',auth,sales,slipForOrder);
  app.post('/api/sales/orders/:id/review',auth,sales,csrf,reviewOrder);
  app.get('/api/sales/customers',auth,sales,(_req,res)=>res.json(db.prepare(`SELECT u.id,u.name,u.email,u.organization,COUNT(o.id) order_count,COALESCE(SUM(CASE WHEN o.status='approved' THEN o.amount ELSE 0 END),0) total_spent,MAX(o.created_at) last_order_at FROM users u JOIN orders o ON o.user_id=u.id GROUP BY u.id ORDER BY last_order_at DESC`).all()));

  app.get('/api/admin/summary',auth,admin,(req,res)=>res.json({users:db.prepare('SELECT COUNT(*) count FROM users').get().count,pendingOrders:db.prepare("SELECT COUNT(*) count FROM orders WHERE status IN ('pending','reviewing')").get().count,revenue:db.prepare("SELECT COALESCE(SUM(amount),0) total FROM orders WHERE status='approved'").get().total,activeSubscriptions:db.prepare("SELECT COUNT(*) count FROM subscriptions WHERE status='active'").get().count,queuedEmails:db.prepare("SELECT COUNT(*) count FROM email_queue WHERE status='queued'").get().count,activePrograms:db.prepare("SELECT COUNT(*) count FROM programs WHERE active=1").get().count,activePlugins:db.prepare("SELECT COUNT(*) count FROM plugins WHERE status='active'").get().count}));
  app.get('/api/admin/users',auth,admin,(req,res)=>res.json(db.prepare('SELECT id,email,name,organization,role,email_verified,created_at FROM users ORDER BY id DESC').all()));
  app.patch('/api/admin/users/:id',auth,admin,csrf,(req,res)=>{if(!['member','staff','admin'].includes(req.body.role))return res.status(400).json({error:'บทบาทไม่ถูกต้อง'});db.prepare('UPDATE users SET role=? WHERE id=?').run(req.body.role,req.params.id);audit(req.user.id,'change_role','user',req.params.id,{role:req.body.role});res.json({ok:true});});
  app.get('/api/admin/orders',auth,admin,(_req,res)=>res.json(orderRows()));
  app.get('/api/admin/orders/:id/slip',auth,admin,slipForOrder);
  app.post('/api/admin/orders/:id/review',auth,admin,csrf,reviewOrder);
  app.get('/api/admin/audit',auth,admin,(req,res)=>res.json(db.prepare(`SELECT a.*,u.email actor_email FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 200`).all()));
  app.get('/api/admin/emails',auth,admin,(req,res)=>res.json(db.prepare('SELECT * FROM email_queue ORDER BY id DESC LIMIT 100').all()));
  app.post('/api/admin/emails/:id/retry',auth,admin,csrf,(req,res)=>{const found=db.prepare('SELECT id FROM email_queue WHERE id=?').get(req.params.id);if(!found)return res.status(404).json({error:'ไม่พบอีเมล'});db.prepare("UPDATE email_queue SET status='queued',attempts=0,sent_at=NULL WHERE id=?").run(req.params.id);audit(req.user.id,'retry_email','email',req.params.id);res.json({ok:true});});
  app.get('/api/admin/supabase',auth,admin,async(_req,res)=>res.json({...await checkSupabase(),mirror:mirror.status(),storage:Boolean(storage)}));
  app.post('/api/admin/supabase/sync',auth,admin,csrf,async(req,res,next)=>{try{const migrated=await syncDatabaseToSupabase(db);audit(req.user.id,'sync_supabase','database',null,migrated);res.json({ok:true,migrated})}catch(error){next(error)}});
  app.post('/api/admin/announcements',auth,admin,csrf,(req,res)=>{const result=db.prepare('INSERT INTO announcements (title,message,created_by) VALUES (?,?,?)').run(String(req.body.title||''),String(req.body.message||''),req.user.id);audit(req.user.id,'create_announcement','announcement',result.lastInsertRowid);res.status(201).json({id:Number(result.lastInsertRowid)});});
  app.get('/api/admin/announcements',auth,admin,(req,res)=>res.json(db.prepare('SELECT * FROM announcements ORDER BY id DESC LIMIT 100').all()));
  app.patch('/api/admin/announcements/:id',auth,admin,csrf,(req,res)=>{const item=db.prepare('SELECT id,active FROM announcements WHERE id=?').get(req.params.id);if(!item)return res.status(404).json({error:'ไม่พบประกาศ'});const active=req.body.active==null?(item.active?0:1):(req.body.active?1:0);db.prepare('UPDATE announcements SET active=? WHERE id=?').run(active,item.id);audit(req.user.id,'toggle_announcement','announcement',item.id,{active:Boolean(active)});res.json({ok:true,active:Boolean(active)});});
  app.get('/api/announcements',(_req,res)=>res.json(db.prepare('SELECT * FROM announcements WHERE active=1 ORDER BY id DESC LIMIT 5').all()));

  const safePluginPath = (value) => typeof value === 'string' && value.length > 0 && !value.startsWith('/') && !value.includes('\\') && !value.split('/').includes('..');
  // --- Payment accounts (admin-managed; stored in settings so they are mirrored to Supabase) ---
  const PLACEHOLDER_PROMPTPAY = '0812345678'; // old seeded sample number: never shown to customers
  const getPaymentAccounts = () => {
    try { const saved = JSON.parse(db.prepare("SELECT value FROM settings WHERE key='payment_accounts'").get()?.value || 'null'); if (Array.isArray(saved)) return saved; } catch { /* fall through to legacy */ }
    const legacy = db.prepare("SELECT value FROM settings WHERE key='promptpay_id'").get()?.value;
    return legacy && legacy !== PLACEHOLDER_PROMPTPAY ? [{ id: 'promptpay', type: 'promptpay', label: 'PromptPay', bankName: '', accountName: '', accountNumber: legacy, note: '', active: true }] : [];
  };
  const sanitizeAccounts = (input) => {
    if (!Array.isArray(input) || input.length > 10) return null;
    const seen = new Set(); const out = [];
    for (const [index, item] of input.entries()) {
      const type = ['bank', 'promptpay', 'qr'].includes(item?.type) ? item.type : null;
      const label = String(item?.label || '').trim().slice(0, 40);
      const number = String(item?.accountNumber || '').replace(/[\s-]/g, '');
      const id = String(item?.id || `account-${index + 1}`).trim().toLowerCase();
      if (!type || !label || !/^[a-z0-9-]{1,30}$/.test(id) || seen.has(id)) return null;
      if (type === 'promptpay' && (!/^(\d{10}|\d{13}|\d{15})$/.test(number) || number === PLACEHOLDER_PROMPTPAY)) return null;
      if (type === 'bank' && !/^\d{6,20}$/.test(number)) return null;
      const qrImage = type === 'qr' ? String(item?.qrImage || '') : '';
      if (type === 'qr' && (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(qrImage) || qrImage.length > 900_000)) return null;
      const bankName = String(item?.bankName || '').trim().slice(0, 40); const accountName = String(item?.accountName || '').trim().slice(0, 80);
      if (type === 'bank' && (!bankName || !accountName)) return null;
      seen.add(id);
      out.push({ id, type, label, bankName, accountName, accountNumber: type === 'qr' ? '' : number, qrImage, note: String(item?.note || '').trim().slice(0, 120), active: item?.active !== false });
    }
    return out;
  };

  // --- Categories + price tiers (stored in settings / plugin manifests, so they are mirrored to Supabase) ---
  const DEFAULT_CATEGORIES = [
    { id: 'academic', label: 'งานวิชาการ' }, { id: 'personnel', label: 'งานบุคคล' },
    { id: 'budget', label: 'งานงบประมาณ / พัสดุ' }, { id: 'general-admin', label: 'งานบริหารทั่วไป' }, { id: 'teaching', label: 'สื่อการสอน' },
  ];
  const TECHS = ['html', 'gas', 'php', 'excel', 'other'];
  const ACCESS = ['free', 'go', 'pro', 'max', 'paid']; // label shown in the catalog; actual access is by purchase/entitlement
  const techOf = (manifest) => TECHS.includes(manifest.tech) ? manifest.tech : (manifest.type === 'html-standalone' ? 'html' : 'other');
  const accessOf = (manifest) => ACCESS.includes(manifest.access) ? manifest.access : (minPrice(manifest) === 0 ? 'free' : 'paid');

  const getCategories = () => {
    try { const saved = JSON.parse(db.prepare("SELECT value FROM settings WHERE key='plugin_categories'").get()?.value || 'null'); if (Array.isArray(saved)) return saved; } catch { /* fall back to defaults */ }
    return DEFAULT_CATEGORIES;
  };
  const sanitizeCategories = (input) => {
    if (!Array.isArray(input) || input.length > 30) return null;
    const seen = new Set(); const out = [];
    for (const item of input) {
      const label = String(item?.label || '').trim().slice(0, 40);
      const id = String(item?.id || '').trim().toLowerCase();
      if (!label || !/^[a-z0-9-]{1,30}$/.test(id) || seen.has(id)) return null;
      seen.add(id); out.push({ id, label });
    }
    return out;
  };
  const sanitizeTiers = (input) => {
    if (!Array.isArray(input) || input.length < 1 || input.length > 6) return null;
    const seen = new Set(); const out = [];
    for (const [index, item] of input.entries()) {
      const name = String(item?.name || '').trim().slice(0, 40);
      const price = Number(item?.price);
      const id = String(item?.id || `tier-${index + 1}`).trim().toLowerCase();
      const days = item?.durationDays === null || item?.durationDays === undefined || item?.durationDays === '' ? null : Number(item.durationDays);
      if (!name || !Number.isInteger(price) || price < 0 || price > 1_000_000 || !/^[a-z0-9-]{1,20}$/.test(id) || seen.has(id)) return null;
      if (days !== null && (!Number.isInteger(days) || days < 1 || days > 3650)) return null;
      seen.add(id);
      out.push({ id, name, price, description: String(item?.description || '').trim().slice(0, 200), offline: Boolean(item?.offline), durationDays: days });
    }
    return out;
  };
  const getCustomerPriceTiers = () => {
    const saved = settingJson('customer_price_tiers', []);
    return sanitizeTiers(saved) || [];
  };
  const tiersFromIds = (input) => {
    if (!Array.isArray(input) || input.length < 1 || input.length > 6) return null;
    const ids = input.map((value) => String(value || '').trim().toLowerCase());
    if (new Set(ids).size !== ids.length) return null;
    const library = new Map(getCustomerPriceTiers().map((tier) => [tier.id, tier]));
    const selected = ids.map((id) => library.get(id));
    return selected.every(Boolean) ? selected : null;
  };
  const tiersOf = (manifest) => Array.isArray(manifest.priceTiers) && manifest.priceTiers.length
    ? manifest.priceTiers
    : [{ id: 'standard', name: 'มาตรฐาน', price: Number(manifest.program?.price || 0), description: '', offline: true, durationDays: null }];
  const minPrice = (manifest) => Math.min(...tiersOf(manifest).map((t) => t.price));
  const pluginByProgram = (programId) => {
    for (const row of db.prepare('SELECT * FROM plugins').all()) {
      try { const manifest = JSON.parse(row.manifest); if ((manifest.program?.id || row.slug) === programId) return { row, manifest }; } catch { /* skip broken manifest */ }
    }
    return null;
  };
  const splitTarget = (targetId) => { const [programId, tierId = ''] = String(targetId).split('#'); return { programId, tierId }; };

  const readPlugin = (slug, activeOnly = true) => {
    const row = db.prepare(`SELECT * FROM plugins WHERE slug=?${activeOnly ? " AND status='active'" : ''}`).get(slug);
    if (!row) return null;
    try { return { ...row, manifest: JSON.parse(row.manifest) }; } catch { return null; }
  };
  const publicPlugin = (plugin) => {
    const manifest = plugin.manifest;
    return {
      slug: manifest.slug, name: manifest.name, version: manifest.version,
      type: manifest.type || 'extension', description: manifest.description || '',
      category: getCategories().find((c) => c.id === manifest.category)?.label || manifest.category || 'HTML Standalone', categoryId: manifest.category || '', badge: manifest.badge || 'พร้อมใช้งานบนเว็บ',
      screenshots: Array.isArray(manifest.screenshots) ? manifest.screenshots.map((path, index) => index === 0 && basename(path) === 'cover-v2.svg'
        ? `/api/plugins/${manifest.slug}/cover.svg?v=${encodeURIComponent(plugin.version)}` : `/plugins/${manifest.slug}/demo/${path}`) : [],
      highlights: Array.isArray(manifest.highlights) ? manifest.highlights : [],
      steps: Array.isArray(manifest.steps) ? manifest.steps : [], program: manifest.program ? { ...manifest.program, price: minPrice(manifest) } : null,
      priceTiers: accessOf(manifest) === 'paid' ? tiersOf(manifest) : [], tech: techOf(manifest), access: accessOf(manifest),
      installedAt: plugin.installed_at || null,
      popularity: db.prepare('SELECT COUNT(*) c FROM entitlements WHERE program_id=?').get(manifest.program?.id || manifest.slug).c,
      programId: manifest.program?.id || manifest.slug,
      demoUrl: manifest.entry ? `/plugins/${manifest.slug}/demo/` : null,
      appUrl: manifest.entry ? `/plugins/${manifest.slug}/app/` : null,
      manualUrl: manifest.manual ? `/plugins/${manifest.slug}/manual` : null,
      delivery: manifest.delivery || (manifest.offline && !manifest.entry ? 'offline' : manifest.offline ? 'both' : 'online'),
      downloadUrl: manifest.offline ? `/api/plugins/${manifest.slug}/download` : null,
      offlineFileName: manifest.offline?.fileName || null,
      offlineSize: manifest.offline?.size || null,
    };
  };
  const pluginAsset = (mode) => (req, res) => {
    const plugin = readPlugin(req.params.slug);
    if (!plugin || plugin.manifest.type !== 'html-standalone' || !safePluginPath(plugin.manifest.entry)) return res.status(404).send('ไม่พบโปรแกรม');
    const appRoot = resolve(pluginRoot, plugin.slug, dirname(plugin.manifest.entry));
    const requested = req.params[0] || basename(plugin.manifest.entry);
    if (!safePluginPath(requested)) return res.status(400).send('ตำแหน่งไฟล์ไม่ถูกต้อง');
    const target = resolve(appRoot, requested);
    if ((target !== appRoot && !target.startsWith(`${appRoot}/`)) || !existsSync(target)) return res.status(404).send('ไม่พบไฟล์');
    res.setHeader('Cache-Control', requested.endsWith('.html') ? 'no-store' : 'public, max-age=3600');
    if (mode === 'demo' && requested === basename(plugin.manifest.entry) && !req.query.vsdemo) return res.redirect(`${req.path}?vsdemo=1`);
    if (mode === 'app' && requested.endsWith('.html')) {
      const rows=db.prepare('SELECT record_key,payload FROM plugin_records WHERE plugin_slug=? AND user_id=?').all(plugin.slug,req.user.id)
        .map((row)=>({record_key:row.record_key,payload:JSON.parse(row.payload)}));
      const html=readFileSync(target,'utf8');
      const script=storageBridge(plugin.slug,req.session.csrf_token,rows);
      res.setHeader('Content-Type','text/html; charset=utf-8');
      return res.send(html.replace(/<head([^>]*)>/i, (match)=>match+script));
    }
    return res.sendFile(target);
  };
  const pluginAccess = (req, res, next) => {
    const plugin = readPlugin(req.params.slug);
    if (!plugin) return res.status(404).send('ไม่พบโปรแกรม');
    if (req.user?.role === 'admin') return next();
    const programId = plugin.manifest.program?.id || plugin.slug;
    if (!req.user) return res.status(401).send('กรุณาเข้าสู่ระบบ');
    const direct = db.prepare("SELECT 1 FROM entitlements WHERE user_id=? AND program_id=? AND source<>'subscription' AND (expires_at IS NULL OR expires_at>CURRENT_TIMESTAMP)").get(req.user.id, programId);
    const subscription = db.prepare("SELECT plan_id FROM subscriptions WHERE user_id=? AND status='active' AND (ends_at IS NULL OR ends_at>CURRENT_TIMESTAMP) ORDER BY id DESC LIMIT 1").get(req.user.id);
    return direct || memberPlanAllows(subscription?.plan_id || 'free', manifestMemberAccess(plugin.manifest))
      ? next() : res.status(403).send('บัญชีนี้ยังไม่มีสิทธิ์ใช้งานโปรแกรม');
  };

  app.get('/api/plugins', (_req,res) => res.json(db.prepare("SELECT slug FROM plugins WHERE status='active' ORDER BY installed_at DESC").all().map(({slug})=>readPlugin(slug)).filter(Boolean).map(publicPlugin)));
  app.get('/api/plugins/:slug/cover.svg', (req, res) => {
    const plugin = readPlugin(req.params.slug);
    const screenshot = plugin?.manifest?.screenshots?.[0];
    if (!plugin || plugin.manifest.type !== 'html-standalone' || !safePluginPath(plugin.manifest.entry) || !safePluginPath(screenshot)) return res.status(404).send('ไม่พบรูปปก');
    const source = resolve(pluginRoot, plugin.slug, dirname(plugin.manifest.entry), screenshot);
    if (!source.startsWith(`${resolve(pluginRoot, plugin.slug)}/`) || !existsSync(source)) return res.status(404).send('ไม่พบรูปปก');
    const category = getCategories().find((item) => item.id === plugin.manifest.category)?.label || plugin.manifest.category || 'HTML Standalone';
    const cover = buildPluginCover(plugin.manifest, readFileSync(source, 'utf8'), category);
    if (!cover) return res.sendFile(source);
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(cover);
  });
  app.get('/api/plugins/:slug', (req,res) => { const plugin=readPlugin(req.params.slug); return plugin ? res.json(publicPlugin(plugin)) : res.status(404).json({error:'ไม่พบโปรแกรม'}); });
  const recordKey = (value) => typeof value === 'string' && value.length > 0 && value.length <= 100 && !/[\x00-\x1f/]/.test(value);
  app.get('/api/plugins/:slug/records', auth, pluginAccess, (req,res) => {
    res.json(db.prepare('SELECT record_key,payload,updated_at FROM plugin_records WHERE plugin_slug=? AND user_id=? ORDER BY updated_at DESC').all(req.params.slug,req.user.id)
      .map((row)=>({key:row.record_key,value:JSON.parse(row.payload),updatedAt:row.updated_at})));
  });
  app.put('/api/plugins/:slug/records/:key', auth, pluginAccess, csrf, (req,res) => {
    if (!recordKey(req.params.key) || req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({error:'ข้อมูลบันทึกไม่ถูกต้อง'});
    const payload=JSON.stringify(req.body);
    if (Buffer.byteLength(payload)>2*1024*1024) return res.status(413).json({error:'ข้อมูลบันทึกเกิน 2MB'});
    db.prepare("INSERT INTO plugin_records (plugin_slug,user_id,record_key,payload) VALUES (?,?,?,?) ON CONFLICT(plugin_slug,user_id,record_key) DO UPDATE SET payload=excluded.payload,updated_at=CURRENT_TIMESTAMP")
      .run(req.params.slug,req.user.id,req.params.key,payload);
    db.prepare("INSERT INTO plugin_record_events (plugin_slug,user_id,record_key,action) VALUES (?,?,?,'save')").run(req.params.slug,req.user.id,req.params.key);
    res.json({ok:true});
  });
  const indexedDbPath = (req) => `user-data/${req.user.id}/${req.params.slug}/indexeddb.json`;
  app.get('/api/plugins/:slug/indexeddb', auth, pluginAccess, async (req,res,next) => { try {
    if (!storage) return res.json({ databases: {} });
    const path = indexedDbPath(req);
    if (!await storage.info(path)) return res.json({ databases: {} });
    const body = await storage.download(path);
    res.type('application/json').send(body);
  } catch (error) { next(error); } });
  app.put('/api/plugins/:slug/indexeddb', auth, pluginAccess, csrf, async (req,res,next) => { try {
    if (!storage) return res.status(503).json({error:'พื้นที่เก็บไฟล์ยังไม่พร้อมใช้งาน'});
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || typeof req.body.databases !== 'object') return res.status(400).json({error:'ข้อมูล IndexedDB ไม่ถูกต้อง'});
    const body=Buffer.from(JSON.stringify(req.body));
    if(body.length>20*1024*1024)return res.status(413).json({error:'ข้อมูลรูปภาพและไฟล์แนบเกิน 20MB'});
    await storage.upload(indexedDbPath(req),body,'application/json');
    db.prepare("INSERT INTO plugin_records (plugin_slug,user_id,record_key,payload) VALUES (?,?,?,?) ON CONFLICT(plugin_slug,user_id,record_key) DO UPDATE SET payload=excluded.payload,updated_at=CURRENT_TIMESTAMP")
      .run(req.params.slug,req.user.id,'__indexeddb__',JSON.stringify({bytes:body.length,databases:Object.keys(req.body.databases).length}));
    db.prepare("INSERT INTO plugin_record_events (plugin_slug,user_id,record_key,action) VALUES (?,?,?,'save')").run(req.params.slug,req.user.id,'__indexeddb__');
    res.json({ok:true,bytes:body.length});
  } catch (error) { next(error); } });
  app.get('/api/admin/plugin-records', auth, admin, (req,res) => {
    const slug=String(req.query.slug||'');
    if (!/^[a-z0-9-]{1,100}$/.test(slug)) return res.status(400).json({error:'ระบุ slug ของโปรแกรม'});
    res.json(db.prepare('SELECT r.plugin_slug,r.user_id,u.name,u.email,r.record_key,r.payload,r.updated_at FROM plugin_records r JOIN users u ON u.id=r.user_id WHERE r.plugin_slug=? ORDER BY r.updated_at DESC LIMIT 200').all(slug)
      .map((row)=>({...row,payload:JSON.parse(row.payload)})));
  });
  app.get('/plugins/:slug/demo', (req,res,next) => req.path.endsWith('/') ? next() : res.redirect(`/plugins/${req.params.slug}/demo/`), pluginAsset('demo'));
  app.get('/plugins/:slug/demo/*', pluginAsset('demo'));
  app.get('/plugins/:slug/app', auth, pluginAccess, (req,res,next) => req.path.endsWith('/') ? next() : res.redirect(`/plugins/${req.params.slug}/app/`), pluginAsset('app'));
  app.get('/plugins/:slug/app/*', auth, pluginAccess, pluginAsset('app'));
  app.get('/plugins/:slug/manual', (req,res) => {
    const plugin=readPlugin(req.params.slug);
    if(!plugin || !safePluginPath(plugin.manifest.manual)) return res.status(404).send('ไม่พบคู่มือ');
    const root=resolve(pluginRoot,plugin.slug); const target=resolve(root,plugin.manifest.manual);
    if(!target.startsWith(`${root}/`) || !existsSync(target)) return res.status(404).send('ไม่พบคู่มือ');
    return res.sendFile(target);
  });

  app.get('/api/admin/plugins',auth,admin,(req,res)=>res.json(db.prepare('SELECT id,slug,name,version,status,manifest,installed_at FROM plugins ORDER BY id DESC').all().map((row)=>{try{return{...row,manifest:JSON.parse(row.manifest)}}catch{return{...row,manifest:null}}})));
  app.get('/api/admin/customer-price-tiers', auth, admin, (_req, res) => res.json(getCustomerPriceTiers()));
  app.put('/api/admin/customer-price-tiers', auth, admin, csrf, (req, res) => {
    const tiers = sanitizeTiers(req.body.tiers);
    if (!tiers) return res.status(400).json({ error: 'ระดับราคาลูกค้าไม่ถูกต้อง (1-6 ระดับ ชื่อและรหัสต้องไม่ซ้ำ ราคาเป็นจำนวนเต็มตั้งแต่ 0 บาท)' });
    if (tiers.some((tier) => tier.offline)) return res.status(400).json({ error: 'ระดับราคาส่วนกลางยังไม่รองรับตัวเลือกไฟล์ติดตั้ง ให้ตั้งไฟล์ดาวน์โหลดแยกในระบบงานหลังอัปโหลด' });
    db.prepare("INSERT INTO settings (key,value) VALUES ('customer_price_tiers',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(tiers));
    audit(req.user.id, 'update_customer_price_tiers', 'settings', 'customer_price_tiers', { count: tiers.length });
    res.json(tiers);
  });
  app.post('/api/admin/plugins',auth,admin,csrf,async(req,res,next)=>{ try {
    let manifest; let archiveEntries = null; let archiveBuffer = null;
    try {
      if (req.body.archive) {
        const raw = String(req.body.archive).replace(/^data:application\/(zip|x-zip-compressed);base64,/, '');
        const buffer = Buffer.from(raw, 'base64'); archiveBuffer = buffer;
        if (buffer.length > 20 * 1024 * 1024) return res.status(413).json({error:'ไฟล์ปลั๊กอินต้องไม่เกิน 20MB'});
        const zip = new AdmZip(buffer); const seen = new Set(); let total = 0;
        archiveEntries = zip.getEntries();
        for (const entry of archiveEntries) {
          const name = entry.entryName;
          if (!name || name.startsWith('/') || name.includes('\\') || name.split('/').includes('..') || seen.has(name)) return res.status(400).json({error:'โครงสร้าง ZIP ไม่ปลอดภัย'});
          seen.add(name); total += Number(entry.header.size || 0);
        }
        if (total > 60 * 1024 * 1024) return res.status(413).json({error:'ขนาดไฟล์หลังแตก ZIP ต้องไม่เกิน 60MB'});
        const manifestEntry = archiveEntries.find(entry => entry.entryName === 'manifest.json');
        if (manifestEntry) manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
        else {
          const name=String(req.body.name||'').trim();
          const slug=String(req.body.slug||'').trim().toLowerCase();
          const price=Number(req.body.price||0);
          const entry=archiveEntries.map((item)=>item.entryName).filter((path)=>path==='index.html'||path.endsWith('/index.html')).sort((a,b)=>a.length-b.length)[0];
          if (!name || !/^[a-z0-9-]+$/.test(slug) || !entry || !Number.isInteger(price) || price<0) return res.status(400).json({error:'ZIP เดิมต้องระบุชื่อ, slug, ราคา และมี index.html'});
          let manual=archiveEntries.map((item)=>item.entryName).find((path)=>path.toLowerCase().endsWith('.pdf'));
          if (!manual && req.body.manual) {
            const pdf=Buffer.from(String(req.body.manual).replace(/^data:application\/pdf;base64,/,''),'base64');
            if (pdf.length>8*1024*1024 || pdf.subarray(0,5).toString()!=='%PDF-') return res.status(400).json({error:'คู่มือ PDF ไม่ถูกต้องหรือเกิน 8MB'});
            zip.addFile('manual.pdf',pdf); archiveEntries=zip.getEntries(); manual='manual.pdf';
          }
          if (!manual) return res.status(400).json({error:'กรุณาแนบคู่มือ PDF'});
          manifest={slug,name,version:'1.0.0',type:'html-standalone',entry,manual,description:String(req.body.description||'').slice(0,500),category:String(req.body.category||''),program:{id:slug,name,thaiName:name,price}};
          zip.addFile('manifest.json',Buffer.from(JSON.stringify(manifest),'utf8'));
          archiveBuffer=zip.toBuffer(); archiveEntries=new AdmZip(archiveBuffer).getEntries();
        }
      } else manifest = typeof req.body.manifest === 'string' ? JSON.parse(req.body.manifest) : req.body.manifest;
    } catch { return res.status(400).json({error:'ไฟล์ ZIP หรือ manifest ไม่ถูกต้อง'}); }
    if(!manifest?.slug||!manifest?.name||!/^\d+\.\d+\.\d+$/.test(manifest.version||'')||!/^[a-z0-9-]+$/.test(manifest.slug))return res.status(400).json({error:'manifest ต้องมี slug, name และ version แบบ x.y.z'});
    if (req.body.category !== undefined) manifest.category = String(req.body.category || '').trim().slice(0, 30);
    if (req.body.tech !== undefined) { if (!TECHS.includes(req.body.tech)) return res.status(400).json({error:'ประเภทเทคโนโลยีไม่ถูกต้อง'}); manifest.tech = req.body.tech; }
    if (req.body.access !== undefined) { if (!ACCESS.includes(req.body.access)) return res.status(400).json({error:'ประเภทสิทธิ์ไม่ถูกต้อง'}); manifest.access = req.body.access; }
    if (req.body.priceTierIds !== undefined) { const tiers = tiersFromIds(req.body.priceTierIds); if (!tiers) return res.status(400).json({error:'ไม่พบระดับราคาลูกค้าที่เลือก'}); manifest.priceTiers = tiers; manifest.priceTierSource = 'customer-library'; }
    else if (req.body.priceTiers !== undefined) { const tiers = sanitizeTiers(req.body.priceTiers); if (!tiers) return res.status(400).json({error:'ระดับราคาไม่ถูกต้อง'}); manifest.priceTiers = tiers; }
    else if (manifest.priceTiers !== undefined) { const tiers = sanitizeTiers(manifest.priceTiers); if (!tiers) return res.status(400).json({error:'priceTiers ใน manifest ไม่ถูกต้อง'}); manifest.priceTiers = tiers; }
    if (manifest.delivery !== undefined && !['online','offline','both'].includes(manifest.delivery)) return res.status(400).json({error:'delivery ต้องเป็น online, offline หรือ both'});
    if (['html-standalone','offline-installer'].includes(manifest.type)) {
      const p = manifest.program;
      if (!p?.id || !/^[a-z0-9-]+$/.test(p.id) || !p.name || !p.thaiName || !Number.isFinite(Number(p.price))) return res.status(400).json({error:'ปลั๊กอินที่ขายได้ต้องมี program: id, name, thaiName และ price'});
    }
    if (manifest.type === 'html-standalone') {
      if (!safePluginPath(manifest.entry) || !safePluginPath(manifest.manual)) return res.status(400).json({error:'HTML Plugin ต้องระบุ entry และ manual เป็น path ภายใน ZIP'});
      const names = new Set((archiveEntries || []).map((entry)=>entry.entryName));
      if (archiveEntries && (!names.has(manifest.entry) || !names.has(manifest.manual))) return res.status(400).json({error:'ไม่พบไฟล์ entry หรือคู่มือตามที่ระบุใน manifest'});
      const p = manifest.program;
      if (!p?.id || !/^[a-z0-9-]+$/.test(p.id) || !p.name || !p.thaiName || !Number.isFinite(Number(p.price))) return res.status(400).json({error:'HTML Plugin ต้องมี program: id, name, thaiName และ price'});
    }
    if (archiveEntries) {
      const root = pluginRoot; const target = resolve(root, manifest.slug);
      if (!target.startsWith(`${root}/`)) return res.status(400).json({error:'ชื่อปลั๊กอินไม่ปลอดภัย'});
      rmSync(target,{recursive:true,force:true}); mkdirSync(target,{recursive:true});
      for (const entry of archiveEntries) { const output=resolve(target,entry.entryName); if(!output.startsWith(`${target}/`))return res.status(400).json({error:'ตำแหน่งไฟล์ไม่ปลอดภัย'}); if(entry.isDirectory)mkdirSync(output,{recursive:true});else{mkdirSync(dirname(output),{recursive:true});writeFileSync(output,entry.getData(),{mode:0o644});} }
    }
    const previous = db.prepare('SELECT manifest FROM plugins WHERE slug=?').get(manifest.slug);
    if (previous) { try { const old = JSON.parse(previous.manifest); if (!manifest.offline && old.offline) manifest.offline = old.offline; if (req.body.priceTierIds === undefined && req.body.priceTiers === undefined && manifest.priceTiers === undefined && old.priceTiers && accessOf(manifest) === 'paid') manifest.priceTiers = old.priceTiers; if (req.body.category === undefined && !manifest.category && old.category) manifest.category = old.category; if (req.body.tech === undefined && !manifest.tech && old.tech) manifest.tech = old.tech; if (req.body.access === undefined && !manifest.access && old.access) manifest.access = old.access; } catch { /* keep new manifest */ } }
    if (Object.hasOwn(MEMBER_ACCESS_RANK, manifest.access)) { delete manifest.priceTiers; delete manifest.priceTierSource; if (manifest.program) manifest.program.price = 0; }
    if (manifest.program) manifest.program.price = minPrice(manifest);
    db.prepare(`INSERT INTO plugins (slug,name,version,status,manifest) VALUES (?,?,?,'inactive',?) ON CONFLICT(slug) DO UPDATE SET name=excluded.name,version=excluded.version,manifest=excluded.manifest`).run(manifest.slug,manifest.name,manifest.version,JSON.stringify(manifest));
    if (['html-standalone','offline-installer'].includes(manifest.type)) db.prepare('INSERT INTO programs (id,name,thai_name,price,active) VALUES (?,?,?,?,0) ON CONFLICT(id) DO UPDATE SET name=excluded.name,thai_name=excluded.thai_name,price=excluded.price').run(manifest.program.id,manifest.program.name,manifest.program.thaiName,Number(manifest.program.price));
    if (storage && archiveBuffer) await storage.upload(`plugins/${manifest.slug}.zip`, archiveBuffer, 'application/zip');
    audit(req.user.id,'install_plugin','plugin',manifest.slug);res.status(201).json({ok:true});
  } catch (error) { next(error); } });
  app.post('/api/admin/plugins/:id/toggle',auth,admin,csrf,(req,res)=>{const p=db.prepare('SELECT * FROM plugins WHERE id=?').get(req.params.id);if(!p)return res.status(404).json({error:'ไม่พบปลั๊กอิน'});const status=p.status==='active'?'inactive':'active';db.prepare('UPDATE plugins SET status=? WHERE id=?').run(status,p.id);try{const manifest=JSON.parse(p.manifest);if(['html-standalone','offline-installer'].includes(manifest.type))db.prepare('UPDATE programs SET active=? WHERE id=?').run(status==='active'?1:0,manifest.program.id)}catch{}audit(req.user.id,'toggle_plugin','plugin',p.id,{status});res.json({ok:true,status});});
  app.delete('/api/admin/plugins/:id',auth,admin,csrf,(req,res)=>{const plugin=db.prepare('SELECT * FROM plugins WHERE id=?').get(req.params.id);if(!plugin)return res.status(404).json({error:'ไม่พบปลั๊กอิน'});const root=pluginRoot;const target=resolve(root,plugin.slug);if(target.startsWith(`${root}/`))rmSync(target,{recursive:true,force:true});try{const manifest=JSON.parse(plugin.manifest);if(['html-standalone','offline-installer'].includes(manifest.type))db.prepare('UPDATE programs SET active=0 WHERE id=?').run(manifest.program.id);if(storage)storage.remove([`plugins/${plugin.slug}.zip`,manifest.offline?.path]).catch((error)=>console.error('[storage] remove failed:',error.message))}catch{}db.prepare('DELETE FROM plugins WHERE id=?').run(plugin.id);audit(req.user.id,'uninstall_plugin','plugin',plugin.id);res.json({ok:true});});
  app.get('/api/payment-accounts', (_req, res) => res.json(getPaymentAccounts().filter((a) => a.active)));
  app.get('/api/admin/payment-accounts', auth, admin, (_req, res) => res.json(getPaymentAccounts()));
  app.put('/api/admin/payment-accounts', auth, admin, csrf, (req, res) => {
    const accounts = sanitizeAccounts(req.body.accounts);
    if (!accounts) return res.status(400).json({ error: 'ข้อมูลบัญชีไม่ถูกต้อง (PromptPay ต้องเป็นเบอร์ 10 หลักหรือเลขบัตร/ภาษี 13 หลัก ห้ามใช้เบอร์ตัวอย่าง, บัญชีธนาคารต้องมีชื่อธนาคาร ชื่อบัญชี และเลข 6–20 หลัก, QR ต้องเป็นรูป PNG/JPG ไม่เกิน 600KB)' });
    db.prepare("INSERT INTO settings (key,value) VALUES ('payment_accounts',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(accounts));
    audit(req.user.id, 'update_payment_accounts', 'settings', 'payment_accounts', { count: accounts.length, active: accounts.filter((a) => a.active).length });
    res.json(accounts);
  });
  app.get('/api/categories', (_req, res) => res.json(getCategories()));
  app.put('/api/admin/categories', auth, admin, csrf, (req, res) => {
    const categories = sanitizeCategories(req.body.categories);
    if (!categories) return res.status(400).json({ error: 'หมวดหมู่ไม่ถูกต้อง (id: a-z 0-9 -, ชื่อไม่เกิน 40 ตัวอักษร, ไม่ซ้ำ)' });
    db.prepare("INSERT INTO settings (key,value) VALUES ('plugin_categories',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(categories));
    audit(req.user.id, 'update_categories', 'settings', 'plugin_categories', { count: categories.length });
    res.json(categories);
  });
  app.patch('/api/admin/plugins/:id/meta', auth, admin, csrf, (req, res) => {
    const row = db.prepare('SELECT * FROM plugins WHERE id=?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'ไม่พบปลั๊กอิน' });
    let manifest; try { manifest = JSON.parse(row.manifest); } catch { return res.status(500).json({ error: 'manifest เสียหาย' }); }
    if (req.body.category !== undefined) {
      const category = String(req.body.category || '').trim();
      if (category && !getCategories().some((c) => c.id === category)) return res.status(400).json({ error: 'ไม่พบหมวดหมู่นี้' });
      manifest.category = category;
    }
    if (req.body.tech !== undefined) { if (!TECHS.includes(req.body.tech)) return res.status(400).json({ error: 'ประเภทเทคโนโลยีไม่ถูกต้อง' }); manifest.tech = req.body.tech; }
    if (req.body.access !== undefined) { if (!ACCESS.includes(req.body.access)) return res.status(400).json({ error: 'ประเภทสิทธิ์ไม่ถูกต้อง' }); manifest.access = req.body.access; }
    if (req.body.priceTierIds !== undefined || req.body.priceTiers !== undefined) {
      const tiers = req.body.priceTierIds !== undefined ? tiersFromIds(req.body.priceTierIds) : sanitizeTiers(req.body.priceTiers);
      if (!tiers) return res.status(400).json({ error: 'ระดับราคาไม่ถูกต้อง (1-6 ระดับ, ชื่อและราคาเป็นจำนวนเต็มไม่ติดลบ)' });
      if (tiers.some((t) => t.offline) && !manifest.offline) return res.status(400).json({ error: 'ต้องอัปโหลดไฟล์ติดตั้งออฟไลน์ก่อนจึงจะเปิดสิทธิ์ดาวน์โหลดในระดับราคาได้' });
      manifest.priceTiers = tiers;
      if (req.body.priceTierIds !== undefined) manifest.priceTierSource = 'customer-library';
      if (manifest.program) { manifest.program.price = minPrice(manifest); db.prepare('UPDATE programs SET price=? WHERE id=?').run(manifest.program.price, manifest.program.id); }
    }
    if (Object.hasOwn(MEMBER_ACCESS_RANK, manifest.access)) {
      delete manifest.priceTiers; delete manifest.priceTierSource;
      if (manifest.program) { manifest.program.price = 0; db.prepare('UPDATE programs SET price=0 WHERE id=?').run(manifest.program.id); }
    }
    db.prepare('UPDATE plugins SET manifest=? WHERE id=?').run(JSON.stringify(manifest), row.id);
    audit(req.user.id, 'update_plugin_meta', 'plugin', row.id, { category: manifest.category, tiers: manifest.priceTiers?.length });
    res.json({ ok: true, category: manifest.category || '', tech: techOf(manifest), access: accessOf(manifest), priceTiers: tiersOf(manifest) });
  });
  // --- Offline installers (Supabase Storage, private bucket + short-lived signed URLs) ---
  const adminPlugin = (req, res) => {
    const row = db.prepare('SELECT * FROM plugins WHERE id=?').get(req.params.id);
    if (!row) { res.status(404).json({ error: 'ไม่พบปลั๊กอิน' }); return null; }
    try { return { row, manifest: JSON.parse(row.manifest) }; } catch { res.status(500).json({ error: 'manifest เสียหาย' }); return null; }
  };
  const saveManifest = (row, manifest) => db.prepare('UPDATE plugins SET manifest=? WHERE id=?').run(JSON.stringify(manifest), row.id);
  const needStorage = (_req, res, next) => storage ? next() : res.status(503).json({ error: 'ยังไม่ได้เชื่อมต่อ Supabase Storage' });
  app.post('/api/admin/plugins/:id/offline/upload-url', auth, admin, csrf, needStorage, async (req, res, next) => { try {
    const found = adminPlugin(req, res); if (!found) return;
    const fileName = safeObjectName(req.body.fileName);
    const upload = await storage.signedUploadUrl(`offline/${found.row.slug}/${Date.now()}-${fileName}`);
    res.json(upload);
  } catch (error) { next(error); } });
  app.post('/api/admin/plugins/:id/offline', auth, admin, csrf, needStorage, async (req, res, next) => { try {
    const found = adminPlugin(req, res); if (!found) return;
    const path = String(req.body.path || '');
    if (!path.startsWith(`offline/${found.row.slug}/`) || path.includes('..')) return res.status(400).json({ error: 'ตำแหน่งไฟล์ไม่ถูกต้อง' });
    const info = await storage.info(path);
    if (!info) return res.status(400).json({ error: 'ยังไม่พบไฟล์ที่อัปโหลด' });
    const previous = found.manifest.offline?.path;
    found.manifest.offline = { path, fileName: String(req.body.fileName || path.split('/').pop()).slice(0, 160), size: info.size, uploadedAt: new Date().toISOString() };
    if (!found.manifest.delivery) found.manifest.delivery = found.manifest.entry ? 'both' : 'offline';
    saveManifest(found.row, found.manifest);
    if (previous && previous !== path) storage.remove(previous).catch(() => {});
    audit(req.user.id, 'upload_offline_installer', 'plugin', found.row.id, { size: info.size });
    res.json({ ok: true, offline: found.manifest.offline });
  } catch (error) { next(error); } });
  app.delete('/api/admin/plugins/:id/offline', auth, admin, csrf, needStorage, async (req, res, next) => { try {
    const found = adminPlugin(req, res); if (!found) return;
    const path = found.manifest.offline?.path;
    delete found.manifest.offline;
    if (found.manifest.delivery === 'offline' || found.manifest.delivery === 'both') found.manifest.delivery = found.manifest.entry ? 'online' : 'offline';
    saveManifest(found.row, found.manifest);
    if (path) await storage.remove(path);
    audit(req.user.id, 'remove_offline_installer', 'plugin', found.row.id);
    res.json({ ok: true });
  } catch (error) { next(error); } });
  app.patch('/api/admin/plugins/:id/delivery', auth, admin, csrf, (req, res) => {
    const found = adminPlugin(req, res); if (!found) return;
    const delivery = String(req.body.delivery || '');
    if (!['online', 'offline', 'both'].includes(delivery)) return res.status(400).json({ error: 'delivery ต้องเป็น online, offline หรือ both' });
    if (delivery !== 'online' && !found.manifest.offline) return res.status(400).json({ error: 'ต้องอัปโหลดไฟล์ติดตั้งออฟไลน์ก่อน' });
    if (delivery !== 'offline' && !found.manifest.entry) return res.status(400).json({ error: 'ปลั๊กอินนี้ไม่มีหน้าใช้งานออนไลน์' });
    found.manifest.delivery = delivery; saveManifest(found.row, found.manifest);
    audit(req.user.id, 'set_plugin_delivery', 'plugin', found.row.id, { delivery });
    res.json({ ok: true, delivery });
  });
  app.get('/api/plugins/:slug/download', auth, needStorage, pluginAccess, async (req, res, next) => { try {
    const plugin = readPlugin(req.params.slug);
    const offline = plugin?.manifest.offline;
    if (!offline?.path) return res.status(404).send('โปรแกรมนี้ยังไม่มีไฟล์ติดตั้งออฟไลน์');
    if (req.user.role !== 'admin') {
      const programId = plugin.manifest.program?.id || plugin.slug;
      const ent = db.prepare('SELECT source FROM entitlements WHERE user_id=? AND program_id=?').get(req.user.id, programId);
      const tier = ent?.source?.startsWith('purchase:') ? tiersOf(plugin.manifest).find((t) => t.id === ent.source.slice(9)) : null;
      if (!(ent?.source === 'purchase' || tier?.offline)) return res.status(403).send('ระดับราคาที่ซื้อไม่รวมไฟล์ติดตั้งออฟไลน์');
    }
    const url = await storage.signedUrl(offline.path, 300, offline.fileName);
    audit(req.user.id, 'download_offline_installer', 'plugin', plugin.id, { slug: plugin.slug });
    res.redirect(302, url);
  } catch (error) { next(error); } });

  app.post('/api/me/2fa/setup',auth,csrf,(req,res)=>{const secret=crypto.randomBytes(20).toString('hex').toUpperCase();db.prepare('UPDATE users SET two_factor_secret=?,two_factor_enabled=0 WHERE id=?').run(secret,req.user.id);res.json({secret,otpauth:`otpauth://totp/Krunest:${encodeURIComponent(req.user.email)}?secret=${secret}&issuer=Krunest`});});
  app.post('/api/me/2fa/enable',auth,csrf,(req,res)=>{const u=db.prepare('SELECT two_factor_secret FROM users WHERE id=?').get(req.user.id);if(!u?.two_factor_secret||req.body.otp!==totp(u.two_factor_secret))return res.status(400).json({error:'รหัส OTP ไม่ถูกต้อง'});db.prepare('UPDATE users SET two_factor_enabled=1 WHERE id=?').run(req.user.id);audit(req.user.id,'enable_2fa','user',req.user.id);res.json({ok:true});});

  app.use((error,_req,res,_next)=>{console.error(error);res.status(500).json({error:'ระบบขัดข้อง กรุณาลองใหม่'});});
  return { app, db: rawDb, mirror, storage, pluginRoot };
}

function totp(secret) {
  if (!secret) return '';
  const key = Buffer.from(secret, 'hex'); const counter = Math.floor(Date.now()/30000); const buf=Buffer.alloc(8);buf.writeBigUInt64BE(BigInt(counter));
  const hash=crypto.createHmac('sha1',key).update(buf).digest();const offset=hash[hash.length-1]&15;const code=(hash.readUInt32BE(offset)&0x7fffffff)%1_000_000;return String(code).padStart(6,'0');
}

export function runMaintenance(db, outDir = './data/mail-outbox') {
  db.prepare("UPDATE orders SET status='expired' WHERE status='pending' AND expires_at<CURRENT_TIMESTAMP").run();
  db.prepare("UPDATE subscriptions SET status='expired' WHERE status='active' AND ends_at IS NOT NULL AND ends_at<CURRENT_TIMESTAMP").run();
  const expiring=db.prepare("SELECT s.*,u.email,u.name FROM subscriptions s JOIN users u ON u.id=s.user_id WHERE s.status='active' AND s.ends_at BETWEEN CURRENT_TIMESTAMP AND datetime('now','+7 days')").all();
  for(const item of expiring)db.prepare("INSERT OR IGNORE INTO email_queue (dedupe_key,recipient,template,payload) VALUES (?,?,?,?)").run(`expiry:${item.id}:${item.ends_at}`,item.email,'subscription_expiry',JSON.stringify({name:item.name,endsAt:item.ends_at}));
  mkdirSync(outDir,{recursive:true});const queued=db.prepare("SELECT * FROM email_queue WHERE status='queued' ORDER BY id LIMIT 50").all();
  for(const mail of queued){writeFileSync(join(outDir,`${mail.id}-${mail.template}.json`),JSON.stringify(mail,null,2));db.prepare("UPDATE email_queue SET status='sent',attempts=attempts+1,sent_at=CURRENT_TIMESTAMP WHERE id=?").run(mail.id);}
  return {expiredSubscriptions:db.prepare("SELECT changes() count").get().count,emailsSent:queued.length};
}
