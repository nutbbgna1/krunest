import 'dotenv/config';
import { openDatabase } from './db.mjs';
import { syncDatabaseToSupabase } from './supabase-sync.mjs';

const db = openDatabase(process.env.KRUNEST_DB || './data/krunest.sqlite');
const summary = await syncDatabaseToSupabase(db);
db.close();
console.log(JSON.stringify({ ok: true, migrated: summary }, null, 2));
