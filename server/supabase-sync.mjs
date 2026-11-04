import { getSupabaseAdmin, isSupabaseConfigured } from './supabase.mjs';

const TABLES = [
  ['programs', 'id'], ['plans', 'id'], ['users', 'id'], ['sessions', 'id'], ['tokens', 'token'],
  ['login_attempts', 'key'], ['subscriptions', 'id'], ['entitlements', 'user_id,program_id'],
  ['orders', 'id'], ['payment_slips', 'id'], ['receipts', 'id'], ['teams', 'id'],
  ['team_members', 'team_id,user_id'], ['team_invites', 'token'], ['notifications', 'id'],
  ['announcements', 'id'], ['email_queue', 'id'], ['plugins', 'id'], ['audit_logs', 'id'], ['settings', 'key'],
];

export async function syncDatabaseToSupabase(db) {
  if (!isSupabaseConfigured()) throw new Error('ยังไม่ได้กำหนด Supabase environment variables');
  const apiKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_API_KEY || '';
  if (apiKey.startsWith('sb_publishable_')) throw new Error('Backend migration ต้องใช้ Supabase Secret key ไม่ใช่ Publishable key');
  const supabase = getSupabaseAdmin();
  const summary = {};
  for (const [table, onConflict] of TABLES) {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    for (let offset = 0; offset < rows.length; offset += 100) {
      const { error } = await supabase.from(table).upsert(rows.slice(offset, offset + 100), { onConflict });
      if (error) throw new Error(`${table}: ${error.message}`);
    }
    summary[table] = rows.length;
  }
  const { error } = await supabase.rpc('krunest_reset_sequences');
  if (error) throw new Error(`reset sequences: ${error.message}`);
  return summary;
}
