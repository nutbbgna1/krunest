import { createClient } from '@supabase/supabase-js';

let client;

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_API_KEY));
}

export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) throw new Error('ยังไม่ได้กำหนด SUPABASE_URL และ SUPABASE_SECRET_KEY/SUPABASE_API_KEY');
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_API_KEY;
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { 'X-Client-Info': 'krunest-server/1.0' } },
    });
  }
  return client;
}

export async function checkSupabase() {
  if (!isSupabaseConfigured()) return { configured: false, connected: false, reason: 'missing_environment' };
  try {
    const { error } = await getSupabaseAdmin().from('settings').select('key').limit(1);
    if (error) return { configured: true, connected: false, reason: error.code || 'query_failed', message: error.message };
    return { configured: true, connected: true };
  } catch (error) {
    return { configured: true, connected: false, reason: 'connection_failed', message: error instanceof Error ? error.message : String(error) };
  }
}
