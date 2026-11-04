import { DatabaseSync } from 'node:sqlite';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import crypto from 'node:crypto';

const DEMO_PROGRAMS = [
  ['docuflow-tax', 'DocuFlow Tax', 'ระบบเอกสารและภาษี', 0],
  ['flowsync-erp', 'FlowSync ERP', 'ระบบบริหารงานและบัญชี', 499],
  ['pulsecrm-chat', 'PulseCRM Chat', 'ระบบลูกค้าสัมพันธ์', 590],
  ['shiftpulse-hr', 'ShiftPulse HR', 'ระบบบุคลากร', 450],
  ['pixelcraft-studio', 'PixelCraft Studio', 'สตูดิโอสื่อออนไลน์', 499],
  ['veloce-pos', 'Veloce POS', 'ระบบขายหน้าร้าน', 399],
];

const PLANS = [
  ['free', 'Free', 0, 0, 1],
  ['go', 'Go', 299, 2990, 2],
  ['pro', 'Pro', 399, 3990, 5],
  ['max', 'Max', 499, 4990, 99],
];

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, expected] = String(stored || '').split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

function databasePath(file) {
  if (file) return file;
  if (process.env.KRUNEST_DB) return process.env.KRUNEST_DB;
  if (process.env.NODE_ENV === 'production' && process.env.HOME) {
    const persistent = join(process.env.HOME, 'krunest-data', 'krunest.sqlite');
    const legacy = './data/krunest.sqlite';
    if (!existsSync(persistent) && existsSync(legacy)) {
      mkdirSync(dirname(persistent), { recursive: true });
      copyFileSync(legacy, persistent);
    }
    return persistent;
  }
  return './data/krunest.sqlite';
}

export function openDatabase(file, options = {}) {
  file = databasePath(file);
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  migrate(db);
  seed(db, options);
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      name TEXT NOT NULL, organization TEXT DEFAULT '', role TEXT NOT NULL DEFAULT 'member',
      email_verified INTEGER NOT NULL DEFAULT 0, two_factor_secret TEXT, two_factor_enabled INTEGER DEFAULT 0,
      notification_email INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, csrf_token TEXT NOT NULL, expires_at TEXT NOT NULL,
      last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS tokens (
      token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, type TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS login_attempts (key TEXT PRIMARY KEY, count INTEGER DEFAULT 0, reset_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, thai_name TEXT NOT NULL, price INTEGER NOT NULL, active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, monthly_price INTEGER NOT NULL, yearly_price INTEGER NOT NULL,
      program_limit INTEGER NOT NULL, active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, plan_id TEXT NOT NULL, billing_cycle TEXT DEFAULT 'monthly',
      status TEXT DEFAULT 'active', starts_at TEXT DEFAULT CURRENT_TIMESTAMP, ends_at TEXT, trial_ends_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY(plan_id) REFERENCES plans(id)
    );
    CREATE TABLE IF NOT EXISTS entitlements (
      user_id INTEGER NOT NULL, program_id TEXT NOT NULL, access_level TEXT DEFAULT 'full', source TEXT NOT NULL,
      expires_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id, program_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY(program_id) REFERENCES programs(id)
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, reference TEXT UNIQUE NOT NULL, user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL, target_id TEXT NOT NULL, amount INTEGER NOT NULL, status TEXT DEFAULT 'pending',
      expires_at TEXT NOT NULL, reviewed_by INTEGER, reviewed_at TEXT, reject_reason TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS payment_slips (
      id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER UNIQUE NOT NULL, file_name TEXT NOT NULL, mime_type TEXT NOT NULL,
      size INTEGER NOT NULL, data TEXT NOT NULL, uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, receipt_no TEXT UNIQUE NOT NULL, order_id INTEGER UNIQUE NOT NULL,
      issued_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(order_id) REFERENCES orders(id)
    );
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, owner_id INTEGER NOT NULL, seat_limit INTEGER DEFAULT 5,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(owner_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS team_members (
      team_id INTEGER NOT NULL, user_id INTEGER NOT NULL, team_role TEXT DEFAULT 'member', joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(team_id, user_id), FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS team_invites (
      token TEXT PRIMARY KEY, team_id INTEGER NOT NULL, email TEXT, expires_at TEXT NOT NULL, used_at TEXT,
      FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL,
      read_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, message TEXT NOT NULL, active INTEGER DEFAULT 1,
      created_by INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS email_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT, dedupe_key TEXT UNIQUE, recipient TEXT NOT NULL, template TEXT NOT NULL,
      payload TEXT DEFAULT '{}', status TEXT DEFAULT 'queued', attempts INTEGER DEFAULT 0, sent_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS plugins (
      id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, version TEXT NOT NULL,
      status TEXT DEFAULT 'inactive', manifest TEXT NOT NULL, installed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id INTEGER, action TEXT NOT NULL, subject_type TEXT NOT NULL,
      subject_id TEXT, detail TEXT DEFAULT '{}', created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
}

function seed(db, { seedDemoPrograms = false } = {}) {
  const addProgram = db.prepare('INSERT INTO programs (id,name,thai_name,price) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,thai_name=excluded.thai_name,price=excluded.price');
  if (seedDemoPrograms) DEMO_PROGRAMS.forEach((row) => addProgram.run(...row));
  else {
    const disableDemo = db.prepare('UPDATE programs SET active=0 WHERE id=?');
    DEMO_PROGRAMS.forEach(([id]) => disableDemo.run(id));
  }
  const addPlan = db.prepare('INSERT INTO plans (id,name,monthly_price,yearly_price,program_limit) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,monthly_price=excluded.monthly_price,yearly_price=excluded.yearly_price,program_limit=excluded.program_limit');
  PLANS.forEach((row) => addPlan.run(...row));
  const adminEmail = (process.env.KRUNEST_ADMIN_EMAIL || 'me.patiphan1@gmail.com').toLowerCase();
  const admin = db.prepare('SELECT id FROM users WHERE email=?').get(adminEmail);
  if (!admin) {
    const result = db.prepare(`INSERT INTO users (email,password_hash,name,organization,role,email_verified)
      VALUES (?,?,?,?,?,1)`).run(adminEmail, hashPassword(process.env.KRUNEST_ADMIN_PASSWORD || 'Admin@12345'), 'ผู้ดูแลระบบ', 'Krunest', 'admin');
    if (seedDemoPrograms) db.prepare(`INSERT INTO entitlements (user_id,program_id,source) VALUES (?,?,?)`).run(result.lastInsertRowid, 'docuflow-tax', 'free');
  } else {
    db.prepare("UPDATE users SET role='admin', email_verified=1 WHERE id=?").run(admin.id);
  }
  db.prepare("INSERT OR IGNORE INTO settings (key,value) VALUES ('promptpay_id','0812345678')").run();
}

export function publicUser(user) {
  if (!user) return null;
  const { password_hash, two_factor_secret, ...safe } = user;
  return { ...safe, email_verified: Boolean(safe.email_verified), two_factor_enabled: Boolean(safe.two_factor_enabled) };
}
