import { openDatabase } from './db.mjs';
import { runMaintenance } from './app.mjs';
const db = openDatabase();
console.log(JSON.stringify(runMaintenance(db), null, 2));
