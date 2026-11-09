import crypto from 'node:crypto';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import AdmZip from 'adm-zip';
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase.mjs';

// Supabase is the system of record; the local SQLite file is the fast runtime copy.
//  - every write to a durable table is mirrored to Supabase shortly afterwards (write-through)
//  - on boot: KRUNEST_SUPABASE_BOOTSTRAP decides which copy wins (auto, remote, local)
// Volatile tables (sessions, tokens, login_attempts) are not mirrored.
export const MIRROR_TABLES = [
  ['programs', ['id']], ['plans', ['id']], ['users', ['id']], ['subscriptions', ['id']],
  ['entitlements', ['user_id', 'program_id']], ['orders', ['id']], ['payment_slips', ['id']],
  ['receipts', ['id']], ['teams', ['id']], ['team_members', ['team_id', 'user_id']],
  ['team_invites', ['token']], ['notifications', ['id']], ['announcements', ['id']],
  ['email_queue', ['id']], ['plugins', ['id']], ['plugin_records', ['plugin_slug', 'user_id', 'record_key']],
  ['plugin_record_events', ['id']], ['audit_logs', ['id']], ['settings', ['key']],
];
const PK = new Map(MIRROR_TABLES);
const VERIFY_TABLES = ['users', 'programs', 'plugins', 'orders', 'settings'];
const BOOTSTRAP_MODES = new Set(['auto', 'remote', 'local']);
const WRITE_RE = /^\s*(?:INSERT(?:\s+OR\s+\w+)?\s+INTO|REPLACE\s+INTO|UPDATE(?:\s+OR\s+\w+)?|DELETE\s+FROM)\s+["`]?(\w+)/i;
const hash = (row) => crypto.createHash('sha1').update(JSON.stringify(row)).digest('hex');
const keyOf = (row, pk) => pk.map((c) => row[c]).join('\u0001');
const toRemote = (row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v]));
const normalizeRemote = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(Z|[+-]\d\d:?\d\d)$/.test(value)) {
    return new Date(value).toISOString().slice(0, 19).replace('T', ' ');
  }
  return value;
};

export function createMirror(db, { client = null, storage = null, delayMs = 2000, log = console } = {}) {
  const enabled = Boolean(client) || (isSupabaseConfigured() && process.env.KRUNEST_SUPABASE_MIRROR !== 'off');
  const sb = () => client || getSupabaseAdmin();
  const known = new Map(MIRROR_TABLES.map(([t]) => [t, new Map()])); // table -> pk -> row hash
  const dirty = new Set();
  const configuredBootstrapMode = String(process.env.KRUNEST_SUPABASE_BOOTSTRAP || 'auto').toLowerCase();
  const bootstrapMode = BOOTSTRAP_MODES.has(configuredBootstrapMode) ? configuredBootstrapMode : 'auto';
  const status = {
    enabled,
    mode: enabled ? 'starting' : 'disabled',
    bootstrapMode,
    lastFlushAt: null,
    lastError: null,
    pushed: 0,
    verification: null,
  };
  let timer = null; let running = null; let again = false;
  const children = new Map(); // parent table -> child tables (cascade deletes)
  for (const [table] of MIRROR_TABLES) {
    for (const fk of db.prepare(`PRAGMA foreign_key_list(${table})`).all()) {
      if (PK.has(fk.table)) children.set(fk.table, [...(children.get(fk.table) || []), table]);
    }
  }

  const schedule = () => {
    if (!enabled || timer) return;
    timer = setTimeout(() => { timer = null; flush().catch(() => {}); }, delayMs);
    timer.unref?.();
  };
  const markTable = (table, isDelete) => {
    if (!PK.has(table)) return;
    dirty.add(table);
    if (isDelete) for (const child of children.get(table) || []) dirty.add(child);
    schedule();
  };
  const track = (sql) => {
    for (const statement of String(sql).split(';')) {
      const match = WRITE_RE.exec(statement);
      if (match) markTable(match[1].toLowerCase(), /^\s*DELETE/i.test(statement));
    }
  };

  const wrapStatement = (statement, sql) => new Proxy(statement, {
    get(target, prop) {
      const value = Reflect.get(target, prop, target);
      if (typeof value !== 'function') return value;
      if (prop === 'run') return (...args) => { const result = value.apply(target, args); track(sql); return result; };
      return value.bind(target);
    },
  });
  const wrapped = new Proxy(db, {
    get(target, prop) {
      const value = Reflect.get(target, prop, target);
      if (typeof value !== 'function') return value;
      if (prop === 'prepare') return (sql) => { const st = value.call(target, sql); return WRITE_RE.test(sql) ? wrapStatement(st, sql) : st; };
      if (prop === 'exec') return (sql) => { const result = value.call(target, sql); track(sql); return result; };
      return value.bind(target);
    },
  });

  async function pushTable(table) {
    const pk = PK.get(table); const cache = known.get(table);
    const rows = db.prepare(`SELECT * FROM ${table}`).all().map(toRemote);
    const seen = new Set(); const changed = [];
    for (const row of rows) {
      const key = keyOf(row, pk); seen.add(key);
      const digest = hash(row);
      if (cache.get(key) !== digest) changed.push([key, digest, row]);
    }
    for (let i = 0; i < changed.length; i += 100) {
      const chunk = changed.slice(i, i + 100);
      const { error } = await sb().from(table).upsert(chunk.map((c) => c[2]), { onConflict: pk.join(',') });
      if (error) throw new Error(`${table}: ${error.message}`);
      for (const [key, digest] of chunk) cache.set(key, digest);
      status.pushed += chunk.length;
    }
    const removed = [...cache.keys()].filter((key) => !seen.has(key));
    for (const key of removed) {
      const values = key.split('\u0001'); let query = sb().from(table).delete();
      pk.forEach((column, index) => { query = query.eq(column, values[index]); });
      const { error } = await query;
      if (error) throw new Error(`${table} delete: ${error.message}`);
      cache.delete(key);
    }
  }

  async function flush() {
    if (!enabled) return status;
    if (running) { again = true; return running; }
    running = (async () => {
      do {
        again = false;
        const tables = MIRROR_TABLES.map(([t]) => t).filter((t) => dirty.has(t));
        for (const table of tables) {
          dirty.delete(table);
          try { await pushTable(table); status.lastError = null; }
          catch (error) { dirty.add(table); status.lastError = error.message; log.error?.(`[supabase-mirror] ${error.message}`); schedule(); }
        }
        status.lastFlushAt = new Date().toISOString();
      } while (again);
    })().finally(() => { running = null; });
    await running;
    return status;
  }

  async function pushAll() {
    for (const [table] of MIRROR_TABLES) dirty.add(table);
    await flush();
    if (status.lastError) throw new Error(status.lastError);
    const { error } = await sb().rpc('krunest_reset_sequences');
    if (error) log.warn?.(`[supabase-mirror] reset sequences: ${error.message}`);
  }

  async function remoteCount(table) {
    const { count, error } = await sb().from(table).select('*', { count: 'exact', head: true });
    if (error) throw new Error(`${table}: ${error.message}`);
    return count || 0;
  }

  async function fetchRemoteTable(table, pk) {
    const rows = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb().from(table).select('*').order(pk[0], { ascending: true }).range(from, from + 999);
      if (error) throw new Error(`${table}: ${error.message}`);
      rows.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    return rows;
  }

  async function hydrate() {
    // Download the complete snapshot before touching SQLite. A network failure
    // therefore leaves the current runtime copy intact.
    const snapshot = new Map();
    for (const [table, pk] of MIRROR_TABLES) snapshot.set(table, await fetchRemoteTable(table, pk));

    db.exec('PRAGMA foreign_keys = OFF; BEGIN IMMEDIATE');
    try {
      // Make the cache an exact copy. INSERT OR REPLACE alone leaves rows that
      // were deleted remotely, which can resurrect stale accounts and orders.
      for (const [table] of [...MIRROR_TABLES].reverse()) db.prepare(`DELETE FROM ${table}`).run();
      for (const [table] of MIRROR_TABLES) {
        const localColumns = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name));
        for (const remote of snapshot.get(table)) {
          const columns = Object.keys(remote).filter((c) => localColumns.has(c));
          const values = columns.map((c) => normalizeRemote(remote[c]));
          db.prepare(`INSERT OR REPLACE INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`).run(...values);
        }
      }
      // Volatile local sessions are intentionally not mirrored. Remove any that
      // point at users which no longer exist in the authoritative snapshot.
      db.prepare('DELETE FROM sessions WHERE user_id NOT IN (SELECT id FROM users)').run();
      db.prepare('DELETE FROM tokens WHERE user_id NOT IN (SELECT id FROM users)').run();
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    } finally { db.exec('PRAGMA foreign_keys = ON'); }
    for (const [table, pk] of MIRROR_TABLES) {
      const cache = known.get(table); cache.clear();
      for (const row of db.prepare(`SELECT * FROM ${table}`).all().map(toRemote)) cache.set(keyOf(row, pk), hash(row));
    }
  }

  async function verify() {
    const local = {}; const remote = {}; const differences = {};
    for (const table of VERIFY_TABLES) {
      local[table] = Number(db.prepare(`SELECT COUNT(*) count FROM ${table}`).get().count);
      remote[table] = await remoteCount(table);
      if (local[table] !== remote[table]) differences[table] = { local: local[table], remote: remote[table] };
    }
    const result = { checkedAt: new Date().toISOString(), local, remote, differences, ok: Object.keys(differences).length === 0 };
    status.verification = result;
    return result;
  }

  // Restore plugin folders from Supabase Storage (plugins/<slug>.zip) when they are missing on disk.
  async function restorePluginFiles(pluginRoot) {
    if (!storage) return 0;
    let restored = 0;
    for (const { slug } of db.prepare("SELECT slug FROM plugins").all()) {
      const target = resolve(pluginRoot, slug);
      if (existsSync(target) || !/^[a-z0-9-]+$/.test(slug)) continue;
      try {
        const zip = new AdmZip(await storage.download(`plugins/${slug}.zip`));
        mkdirSync(target, { recursive: true });
        for (const entry of zip.getEntries()) {
          const output = resolve(target, entry.entryName);
          if (!output.startsWith(`${target}/`)) continue;
          if (entry.isDirectory) mkdirSync(output, { recursive: true });
          else { mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, entry.getData(), { mode: 0o644 }); }
        }
        restored += 1;
      } catch (error) { rmSync(target, { recursive: true, force: true }); log.warn?.(`[supabase-mirror] plugin ${slug}: ${error.message}`); }
    }
    return restored;
  }

  // Called once at startup, before the server accepts requests.
  async function bootstrap({ pluginRoot, mode = bootstrapMode } = {}) {
    if (!enabled) return status;
    try {
      if (!BOOTSTRAP_MODES.has(mode)) throw new Error(`KRUNEST_SUPABASE_BOOTSTRAP ไม่ถูกต้อง: ${mode}`);
      if (storage) await storage.ensureBucket();
      status.bootstrapMode = mode;
      const localUsers = db.prepare('SELECT COUNT(*) c FROM users').get().c;
      const localOrders = db.prepare('SELECT COUNT(*) c FROM orders').get().c;
      const remoteUsers = await remoteCount('users');
      if (mode === 'remote') {
        if (remoteUsers === 0) throw new Error('ปฏิเสธการกู้จาก Supabase เพราะตาราง users ยังว่าง');
        await hydrate(); status.mode = 'restored-from-supabase';
      } else if (mode === 'local') {
        await pushAll(); status.mode = 'synced-from-local';
      } else if (localUsers <= 1 && localOrders === 0 && remoteUsers > localUsers) {
        // Backward-compatible safe auto mode for a brand-new Hostinger runtime.
        await hydrate(); status.mode = 'restored-from-supabase';
      } else {
        await pushAll(); status.mode = 'synced';
      }
      if (pluginRoot) await restorePluginFiles(pluginRoot);
      await verify();
    } catch (error) {
      status.mode = 'error'; status.lastError = error.message;
      log.error?.(`[supabase-mirror] bootstrap failed, continuing with local data: ${error.message}`);
    }
    return status;
  }

  return {
    db: wrapped, enabled, flush, bootstrap, hydrate, pushAll, verify, restorePluginFiles,
    status: () => ({ ...status, pending: [...dirty] }),
    stop: () => { if (timer) clearTimeout(timer); timer = null; },
  };
}
