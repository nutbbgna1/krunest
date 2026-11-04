import 'dotenv/config';
import { openDatabase } from './db.mjs';
import { runMaintenance } from './app.mjs';
import { createMirror } from './supabase-mirror.mjs';
const raw = openDatabase();
const mirror = createMirror(raw);
const db = mirror.enabled ? mirror.db : raw;
console.log(JSON.stringify(runMaintenance(db), null, 2));
await mirror.flush();
