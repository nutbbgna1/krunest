import 'dotenv/config';
import { checkSupabase } from './supabase.mjs';

const result = await checkSupabase();
console.log(JSON.stringify(result, null, 2));
if (!result.connected) process.exitCode = 1;
