import express from 'express';
import crypto from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve, basename, dirname } from 'node:path';
import AdmZip from 'adm-zip';
import generatePromptPayPayload from 'promptpay-qr';
import QRCode from 'qrcode';
import { openDatabase, hashPassword, verifyPassword, publicUser } from './db.mjs';

const DAY = 86_400_000;
const token = () => crypto.randomBytes(24).toString('hex');
const isoAfter = (ms) => new Date(Date.now() + ms).toISOString();
const parseCookies = (header = '') => Object.fromEntries(header.split(';').map(v => v.trim().split('=').map(decodeURIComponent)).filter(v => v.length === 2));
const validPassword = (value) => typeof value === 'string' && value.length >= 10 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);

export function createApp(options = {}) {
  const db = options.db || openDatabase(options.dbFile);
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '7mb' }));
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'",
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
  const admin = (req, res, next) => req.user?.role === 'admin' || req.user?.role === 'staff' ? next() : res.status(403).json({ error: 'ไม่มีสิทธิ์ผู้ดูแล' });
  const csrf = (req, res, next) => ['GET','HEAD','OPTIONS'].includes(req.method) || req.headers['x-csrf-token'] === req.session?.csrf_token
    ? next() : res.status(403).json({ error: 'CSRF token ไม่ถูกต้อง' });
  const setSession = (res, userId) => {
    const id = token(); const csrfToken = token();
    db.prepare('DELETE FROM sessions WHERE user_id=?').run(userId);
    db.prepare('INSERT INTO sessions (id,user_id,csrf_token,expires_at) VALUES (?,?,?,?)').run(id, userId, csrfToken, isoAfter(7 * DAY));
    res.setHeader('Set-Cookie', `krunest_session=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);
    return csrfToken;
  };

  app.get('/api/health', (_req, res) => res.json({ ok: true, database: true, time: new Date().toISOString() }));
  app.get('/api/catalog', (_req, res) => res.json({
    programs: db.prepare('SELECT * FROM programs WHERE active=1 ORDER BY price').all(),
    plans: db.prepare('SELECT * FROM plans WHERE active=1 ORDER BY monthly_price').all(),
  }));
  app.post('/api/auth/register', (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const name = String(req.body.name || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email) || name.length < 2 || !validPassword(req.body.password)) return res.status(400).json({ error: 'กรอกข้อมูลให้ครบ และรหัสผ่านต้องมีอย่างน้อย 10 ตัว พร้อมตัวพิมพ์ใหญ่ พิมพ์เล็ก และตัวเลข' });
    if (db.prepare('SELECT id FROM users WHERE email=?').get(email)) return res.status(409).json({ error: 'อีเมลนี้มีบัญชีแล้ว' });
    const result = db.prepare('INSERT INTO users (email,password_hash,name,organization) VALUES (?,?,?,?)').run(email, hashPassword(req.body.password), name, String(req.body.organization || ''));
    db.prepare('INSERT INTO entitlements (user_id,program_id,source) VALUES (?,?,?)').run(result.lastInsertRowid, 'docuflow-tax', 'free');
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
  app.get('/api/auth/google', (_req, res) => res.status(501).json({ error: 'Google OAuth พร้อมเชื่อมต่อเมื่อกำหนด GOOGLE_CLIENT_ID และ GOOGLE_CLIENT_SECRET' }));
  app.post('/api/auth/logout', auth, csrf, (req, res) => { db.prepare('DELETE FROM sessions WHERE id=?').run(req.session.id); res.setHeader('Set-Cookie','krunest_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'); res.json({ ok:true }); });
  app.get('/api/me', auth, (req, res) => {
    const entitlements = db.prepare(`SELECT e.*,p.name,p.thai_name FROM entitlements e JOIN programs p ON p.id=e.program_id WHERE user_id=? AND (expires_at IS NULL OR expires_at>CURRENT_TIMESTAMP)`).all(req.user.id);
    const subscription = db.prepare(`SELECT s.*,p.name plan_name FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE user_id=? AND status='active' ORDER BY s.id DESC LIMIT 1`).get(req.user.id);
    res.json({ user: publicUser(req.user), csrfToken:req.session.csrf_token, entitlements, subscription });
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
    const type=req.body.targetType; const id=String(req.body.targetId||''); let amount=0;
    if(type==='program'){const p=db.prepare('SELECT * FROM programs WHERE id=? AND active=1').get(id); if(!p)return res.status(404).json({error:'ไม่พบโปรแกรม'}); amount=p.price;}
    else if(type==='plan'){const p=db.prepare('SELECT * FROM plans WHERE id=? AND active=1').get(id); if(!p)return res.status(404).json({error:'ไม่พบแพ็กเกจ'}); amount=req.body.billingCycle==='yearly'?p.yearly_price:p.monthly_price;}
    else return res.status(400).json({error:'ประเภทรายการไม่ถูกต้อง'});
    const reference=`KN${new Date().toISOString().slice(2,10).replaceAll('-','')}${crypto.randomInt(10000,99999)}`;
    const result=db.prepare('INSERT INTO orders (reference,user_id,target_type,target_id,amount,expires_at) VALUES (?,?,?,?,?,?)').run(reference,req.user.id,type,id,amount,isoAfter(48*60*60_000)); audit(req.user.id,'create_order','order',result.lastInsertRowid);
    const order=db.prepare('SELECT * FROM orders WHERE id=?').get(result.lastInsertRowid);
    const promptpayId=db.prepare("SELECT value FROM settings WHERE key='promptpay_id'").get()?.value || '0812345678';
    const promptPayPayload=generatePromptPayPayload(promptpayId,{amount:Number(amount)});
    const qrDataUrl=await QRCode.toDataURL(promptPayPayload,{width:320,margin:1,errorCorrectionLevel:'M'});
    res.status(201).json({...order,promptPayPayload,qrDataUrl});
  }catch(error){next(error)}});
  app.post('/api/orders/:id/slip',auth,csrf,(req,res)=>{ const order=db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(req.params.id,req.user.id); if(!order||order.status!=='pending')return res.status(404).json({error:'ไม่พบคำสั่งซื้อที่รอชำระ'}); const {fileName,mimeType,data}=req.body; if(!['image/jpeg','image/png','application/pdf'].includes(mimeType)||typeof data!=='string')return res.status(400).json({error:'รองรับไฟล์ JPG, PNG หรือ PDF เท่านั้น'}); const size=Buffer.byteLength(data,'utf8'); if(size>5*1024*1024)return res.status(413).json({error:'ไฟล์ต้องไม่เกิน 5MB'}); db.prepare('INSERT OR REPLACE INTO payment_slips (order_id,file_name,mime_type,size,data) VALUES (?,?,?,?,?)').run(order.id,basename(String(fileName||'slip')),mimeType,size,data); db.prepare("UPDATE orders SET status='reviewing' WHERE id=?").run(order.id); notify(req.user.id,'รับหลักฐานการชำระเงินแล้ว',`คำสั่งซื้อ ${order.reference} กำลังรอตรวจสอบ`); res.status(201).json({ok:true}); });
  app.get('/api/orders/:id/receipt',auth,(req,res)=>{const row=db.prepare(`SELECT r.receipt_no,r.issued_at,o.reference,o.amount,o.target_type,o.target_id,u.name,u.organization FROM receipts r JOIN orders o ON o.id=r.order_id JOIN users u ON u.id=o.user_id WHERE o.id=? AND (o.user_id=? OR ? IN ('admin','staff'))`).get(req.params.id,req.user.id,req.user.role); if(!row)return res.status(404).json({error:'ยังไม่มีใบเสร็จ'}); res.json(row);});

  app.get('/api/teams',auth,(req,res)=>res.json(db.prepare(`SELECT t.*,tm.team_role,(SELECT COUNT(*) FROM team_members x WHERE x.team_id=t.id) member_count FROM teams t JOIN team_members tm ON tm.team_id=t.id WHERE tm.user_id=?`).all(req.user.id)));
  app.post('/api/teams',auth,csrf,(req,res)=>{const name=String(req.body.name||'').trim();if(name.length<2)return res.status(400).json({error:'กรุณาระบุชื่อทีม'});const result=db.prepare('INSERT INTO teams (name,owner_id,seat_limit) VALUES (?,?,?)').run(name,req.user.id,Math.min(100,Math.max(2,Number(req.body.seatLimit)||5)));db.prepare("INSERT INTO team_members (team_id,user_id,team_role) VALUES (?,?,'owner')").run(result.lastInsertRowid,req.user.id);res.status(201).json({id:Number(result.lastInsertRowid),name});});
  app.post('/api/teams/:id/invites',auth,csrf,(req,res)=>{const team=db.prepare('SELECT * FROM teams WHERE id=? AND owner_id=?').get(req.params.id,req.user.id);if(!team)return res.status(403).json({error:'เฉพาะเจ้าของทีม'});const invite=token();db.prepare('INSERT INTO team_invites (token,team_id,email,expires_at) VALUES (?,?,?,?)').run(invite,team.id,String(req.body.email||'').toLowerCase()||null,isoAfter(7*DAY));if(req.body.email)queueEmail(req.body.email,'team_invite',{team:team.name,token:invite});res.status(201).json({token:invite,inviteUrl:`/join/${invite}`});});
  app.post('/api/teams/join/:token',auth,csrf,(req,res)=>{const invite=db.prepare('SELECT * FROM team_invites WHERE token=? AND used_at IS NULL AND expires_at>CURRENT_TIMESTAMP').get(req.params.token);if(!invite)return res.status(400).json({error:'ลิงก์เชิญไม่ถูกต้องหรือหมดอายุ'});const team=db.prepare('SELECT * FROM teams WHERE id=?').get(invite.team_id);const count=db.prepare('SELECT COUNT(*) count FROM team_members WHERE team_id=?').get(team.id).count;if(count>=team.seat_limit)return res.status(409).json({error:'ที่นั่งของทีมเต็มแล้ว'});db.prepare("INSERT OR IGNORE INTO team_members (team_id,user_id) VALUES (?,?)").run(team.id,req.user.id);db.prepare('UPDATE team_invites SET used_at=CURRENT_TIMESTAMP WHERE token=?').run(invite.token);res.json({ok:true,team:team.name});});

  app.get('/api/admin/summary',auth,admin,(req,res)=>res.json({users:db.prepare('SELECT COUNT(*) count FROM users').get().count,pendingOrders:db.prepare("SELECT COUNT(*) count FROM orders WHERE status IN ('pending','reviewing')").get().count,revenue:db.prepare("SELECT COALESCE(SUM(amount),0) total FROM orders WHERE status='approved'").get().total,activeSubscriptions:db.prepare("SELECT COUNT(*) count FROM subscriptions WHERE status='active'").get().count,queuedEmails:db.prepare("SELECT COUNT(*) count FROM email_queue WHERE status='queued'").get().count}));
  app.get('/api/admin/users',auth,admin,(req,res)=>res.json(db.prepare('SELECT id,email,name,organization,role,email_verified,created_at FROM users ORDER BY id DESC').all()));
  app.patch('/api/admin/users/:id',auth,admin,csrf,(req,res)=>{if(!['member','staff','admin'].includes(req.body.role))return res.status(400).json({error:'บทบาทไม่ถูกต้อง'});db.prepare('UPDATE users SET role=? WHERE id=?').run(req.body.role,req.params.id);audit(req.user.id,'change_role','user',req.params.id,{role:req.body.role});res.json({ok:true});});
  app.get('/api/admin/orders',auth,admin,(req,res)=>res.json(db.prepare(`SELECT o.*,u.name,u.email,ps.file_name FROM orders o JOIN users u ON u.id=o.user_id LEFT JOIN payment_slips ps ON ps.order_id=o.id ORDER BY o.id DESC`).all()));
  app.post('/api/admin/orders/:id/review',auth,admin,csrf,(req,res)=>{const order=db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);if(!order||!['reviewing','pending'].includes(order.status))return res.status(404).json({error:'ไม่พบรายการที่รอตรวจสอบ'});if(req.body.decision==='reject'){db.prepare("UPDATE orders SET status='rejected',reject_reason=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?").run(String(req.body.reason||'หลักฐานไม่ถูกต้อง'),req.user.id,order.id);notify(order.user_id,'การชำระเงินไม่ผ่านการตรวจสอบ',String(req.body.reason||'กรุณาส่งหลักฐานใหม่'));audit(req.user.id,'reject_order','order',order.id);return res.json({ok:true});}if(req.body.decision!=='approve')return res.status(400).json({error:'ผลตรวจสอบไม่ถูกต้อง'});db.exec('BEGIN');try{db.prepare("UPDATE orders SET status='approved',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?").run(req.user.id,order.id);if(order.target_type==='program'){db.prepare("INSERT INTO entitlements (user_id,program_id,source) VALUES (?,?,?) ON CONFLICT(user_id,program_id) DO UPDATE SET access_level='full',source=excluded.source,expires_at=NULL").run(order.user_id,order.target_id,'purchase');}else{db.prepare("UPDATE subscriptions SET status='expired' WHERE user_id=? AND status='active'").run(order.user_id);const cycle='monthly';const end=isoAfter(30*DAY);db.prepare('INSERT INTO subscriptions (user_id,plan_id,billing_cycle,ends_at) VALUES (?,?,?,?)').run(order.user_id,order.target_id,cycle,end);const limit=db.prepare('SELECT program_limit FROM plans WHERE id=?').get(order.target_id).program_limit;const programs=db.prepare('SELECT id FROM programs WHERE active=1 ORDER BY price LIMIT ?').all(limit);for(const p of programs)db.prepare("INSERT INTO entitlements (user_id,program_id,source,expires_at) VALUES (?,?,?,?) ON CONFLICT(user_id,program_id) DO UPDATE SET access_level='full',source=excluded.source,expires_at=excluded.expires_at").run(order.user_id,p.id,'subscription',end);}const receipt=`RC${new Date().getFullYear()}${String(order.id).padStart(6,'0')}`;db.prepare('INSERT INTO receipts (receipt_no,order_id) VALUES (?,?)').run(receipt,order.id);db.exec('COMMIT');notify(order.user_id,'อนุมัติการชำระเงินแล้ว',`คำสั่งซื้อ ${order.reference} พร้อมใช้งาน`);const u=db.prepare('SELECT email,name FROM users WHERE id=?').get(order.user_id);queueEmail(u.email,'payment_approved',{name:u.name,reference:order.reference,receipt});audit(req.user.id,'approve_order','order',order.id);res.json({ok:true,receipt});}catch(error){db.exec('ROLLBACK');throw error;}});
  app.get('/api/admin/audit',auth,admin,(req,res)=>res.json(db.prepare(`SELECT a.*,u.email actor_email FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 200`).all()));
  app.get('/api/admin/emails',auth,admin,(req,res)=>res.json(db.prepare('SELECT * FROM email_queue ORDER BY id DESC LIMIT 100').all()));
  app.post('/api/admin/announcements',auth,admin,csrf,(req,res)=>{const result=db.prepare('INSERT INTO announcements (title,message,created_by) VALUES (?,?,?)').run(String(req.body.title||''),String(req.body.message||''),req.user.id);audit(req.user.id,'create_announcement','announcement',result.lastInsertRowid);res.status(201).json({id:Number(result.lastInsertRowid)});});
  app.get('/api/announcements',(_req,res)=>res.json(db.prepare('SELECT * FROM announcements WHERE active=1 ORDER BY id DESC LIMIT 5').all()));

  app.get('/api/admin/plugins',auth,admin,(req,res)=>res.json(db.prepare('SELECT id,slug,name,version,status,installed_at FROM plugins ORDER BY id DESC').all()));
  app.post('/api/admin/plugins',auth,admin,csrf,(req,res)=>{
    let manifest; let archiveEntries = null;
    try {
      if (req.body.archive) {
        const raw = String(req.body.archive).replace(/^data:application\/(zip|x-zip-compressed);base64,/, '');
        const buffer = Buffer.from(raw, 'base64');
        if (buffer.length > 10 * 1024 * 1024) return res.status(413).json({error:'ไฟล์ปลั๊กอินต้องไม่เกิน 10MB'});
        const zip = new AdmZip(buffer); const seen = new Set(); let total = 0;
        archiveEntries = zip.getEntries();
        for (const entry of archiveEntries) {
          const name = entry.entryName;
          if (!name || name.startsWith('/') || name.includes('\\') || name.split('/').includes('..') || seen.has(name)) return res.status(400).json({error:'โครงสร้าง ZIP ไม่ปลอดภัย'});
          seen.add(name); total += Number(entry.header.size || 0);
        }
        if (total > 20 * 1024 * 1024) return res.status(413).json({error:'ขนาดไฟล์หลังแตก ZIP ต้องไม่เกิน 20MB'});
        const manifestEntry = archiveEntries.find(entry => entry.entryName === 'manifest.json');
        if (!manifestEntry) return res.status(400).json({error:'ไม่พบ manifest.json ที่ระดับบนสุดของ ZIP'});
        manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
      } else manifest = typeof req.body.manifest === 'string' ? JSON.parse(req.body.manifest) : req.body.manifest;
    } catch { return res.status(400).json({error:'ไฟล์ ZIP หรือ manifest ไม่ถูกต้อง'}); }
    if(!manifest?.slug||!manifest?.name||!/^\d+\.\d+\.\d+$/.test(manifest.version||'')||!/^[a-z0-9-]+$/.test(manifest.slug))return res.status(400).json({error:'manifest ต้องมี slug, name และ version แบบ x.y.z'});
    if (archiveEntries) {
      const root = resolve('data/plugins'); const target = resolve(root, manifest.slug);
      if (!target.startsWith(`${root}/`)) return res.status(400).json({error:'ชื่อปลั๊กอินไม่ปลอดภัย'});
      rmSync(target,{recursive:true,force:true}); mkdirSync(target,{recursive:true});
      for (const entry of archiveEntries) { const output=resolve(target,entry.entryName); if(!output.startsWith(`${target}/`))return res.status(400).json({error:'ตำแหน่งไฟล์ไม่ปลอดภัย'}); if(entry.isDirectory)mkdirSync(output,{recursive:true});else{mkdirSync(dirname(output),{recursive:true});writeFileSync(output,entry.getData(),{mode:0o644});} }
    }
    db.prepare(`INSERT INTO plugins (slug,name,version,status,manifest) VALUES (?,?,?,'inactive',?) ON CONFLICT(slug) DO UPDATE SET name=excluded.name,version=excluded.version,manifest=excluded.manifest`).run(manifest.slug,manifest.name,manifest.version,JSON.stringify(manifest));audit(req.user.id,'install_plugin','plugin',manifest.slug);res.status(201).json({ok:true});
  });
  app.post('/api/admin/plugins/:id/toggle',auth,admin,csrf,(req,res)=>{const p=db.prepare('SELECT * FROM plugins WHERE id=?').get(req.params.id);if(!p)return res.status(404).json({error:'ไม่พบปลั๊กอิน'});const status=p.status==='active'?'inactive':'active';db.prepare('UPDATE plugins SET status=? WHERE id=?').run(status,p.id);audit(req.user.id,'toggle_plugin','plugin',p.id,{status});res.json({ok:true,status});});
  app.delete('/api/admin/plugins/:id',auth,admin,csrf,(req,res)=>{const plugin=db.prepare('SELECT * FROM plugins WHERE id=?').get(req.params.id);if(!plugin)return res.status(404).json({error:'ไม่พบปลั๊กอิน'});const root=resolve('data/plugins');const target=resolve(root,plugin.slug);if(target.startsWith(`${root}/`))rmSync(target,{recursive:true,force:true});db.prepare('DELETE FROM plugins WHERE id=?').run(plugin.id);audit(req.user.id,'uninstall_plugin','plugin',plugin.id);res.json({ok:true});});
  app.post('/api/me/2fa/setup',auth,csrf,(req,res)=>{const secret=crypto.randomBytes(20).toString('hex').toUpperCase();db.prepare('UPDATE users SET two_factor_secret=?,two_factor_enabled=0 WHERE id=?').run(secret,req.user.id);res.json({secret,otpauth:`otpauth://totp/Krunest:${encodeURIComponent(req.user.email)}?secret=${secret}&issuer=Krunest`});});
  app.post('/api/me/2fa/enable',auth,csrf,(req,res)=>{const u=db.prepare('SELECT two_factor_secret FROM users WHERE id=?').get(req.user.id);if(!u?.two_factor_secret||req.body.otp!==totp(u.two_factor_secret))return res.status(400).json({error:'รหัส OTP ไม่ถูกต้อง'});db.prepare('UPDATE users SET two_factor_enabled=1 WHERE id=?').run(req.user.id);audit(req.user.id,'enable_2fa','user',req.user.id);res.json({ok:true});});

  app.use((error,_req,res,_next)=>{console.error(error);res.status(500).json({error:'ระบบขัดข้อง กรุณาลองใหม่'});});
  return { app, db };
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
