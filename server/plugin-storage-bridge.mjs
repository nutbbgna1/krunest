export function storageBridge(slug, csrfToken, records) {
  const data = Object.fromEntries(records.filter((row) => row.payload?.value != null).map((row) => [row.record_key, String(row.payload.value)]));
  const safe = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');
  return `<script>
(() => {
  const slug = ${safe(slug)}, csrf = ${safe(csrfToken)};
  const values = new Map(Object.entries(${safe(data)}));
  const pending = new Map();
  const persist = (key, value, keepalive = false) => fetch('/api/plugins/' + encodeURIComponent(slug) + '/records/' + encodeURIComponent(key), {
    method: 'PUT', credentials: 'same-origin', keepalive,
    headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
    body: JSON.stringify({ value })
  }).catch(() => {});
  const send = (key, value) => {
    const previous = pending.get(key);
    if (previous) clearTimeout(previous);
    pending.set(key, setTimeout(() => {
      pending.delete(key);
      persist(key, value);
    }, 400));
  };
  window.addEventListener('pagehide', () => { for (const [key, timer] of pending) { clearTimeout(timer); persist(key, values.get(key) ?? null, true); } pending.clear(); });
  const store = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.get(String(key)) ?? null; },
    setItem(key, value) { key = String(key); value = String(value); values.set(key, value); send(key, value); },
    removeItem(key) { key = String(key); values.delete(key); send(key, null); },
    clear() { for (const key of values.keys()) send(key, null); values.clear(); }
  };
  const proxy = new Proxy(store, {
    get(target, key) { return key in target ? Reflect.get(target, key, target) : values.get(String(key)); },
    set(_target, key, value) { store.setItem(key, value); return true; },
    deleteProperty(_target, key) { store.removeItem(key); return true; },
    ownKeys() { return [...values.keys()]; },
    getOwnPropertyDescriptor(_target, key) { return values.has(String(key)) ? { enumerable: true, configurable: true, value: values.get(String(key)) } : undefined; }
  });
  try { Object.defineProperty(window, 'localStorage', { configurable: true, value: proxy }); }
  catch { window.KrunestStorage = proxy; }
  window.KrunestRecords = { list: () => [...values.entries()], save: store.setItem, get: store.getItem };

  // Some standalone apps keep photos and attachments in IndexedDB. Mirror every
  // opened database to the signed-in user's private server storage and restore it
  // before the app receives its first indexedDB.open() success event.
  const nativeIDB = window.indexedDB;
  if (!nativeIDB) return;
  const idbUrl = '/api/plugins/' + encodeURIComponent(slug) + '/indexeddb';
  const snapshotReady = fetch(idbUrl, { credentials: 'same-origin' })
    .then((response) => response.ok ? response.json() : { databases: {} })
    .catch(() => ({ databases: {} }));
  let snapshot = { databases: {} }, saving = Promise.resolve();
  const saveTimers = new Map();
  snapshotReady.then((value) => { if (value && typeof value === 'object') snapshot = value; });

  const bytesToBase64 = (bytes) => {
    let text = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) text += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    return btoa(text);
  };
  const base64ToBytes = (text) => {
    const binary = atob(text), bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  };
  const encodeValue = async (value) => {
    if (value instanceof Blob) return { __krunestType: 'Blob', mime: value.type, data: bytesToBase64(new Uint8Array(await value.arrayBuffer())) };
    if (value instanceof ArrayBuffer) return { __krunestType: 'ArrayBuffer', data: bytesToBase64(new Uint8Array(value)) };
    if (ArrayBuffer.isView(value)) return { __krunestType: 'TypedArray', name: value.constructor.name, data: bytesToBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)) };
    if (value instanceof Date) return { __krunestType: 'Date', value: value.toISOString() };
    if (Array.isArray(value)) return Promise.all(value.map(encodeValue));
    if (value && typeof value === 'object') {
      const out = {};
      for (const [key, item] of Object.entries(value)) out[key] = await encodeValue(item);
      return out;
    }
    return value;
  };
  const decodeValue = async (value) => {
    if (!value || typeof value !== 'object') return value;
    if (value.__krunestType === 'Blob') return new Blob([base64ToBytes(value.data)], { type: value.mime || '' });
    if (value.__krunestType === 'ArrayBuffer') return base64ToBytes(value.data).buffer;
    if (value.__krunestType === 'TypedArray') {
      const bytes = base64ToBytes(value.data), Type = window[value.name];
      return typeof Type === 'function' ? new Type(bytes.buffer) : bytes;
    }
    if (value.__krunestType === 'Date') return new Date(value.value);
    if (Array.isArray(value)) return Promise.all(value.map(decodeValue));
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = await decodeValue(item);
    return out;
  };
  const requestValue = (request) => new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const transactionDone = (transaction) => new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted'));
  });
  const dumpDatabase = async (db) => {
    const stores = {};
    for (const name of [...db.objectStoreNames]) {
      const tx = db.transaction(name, 'readonly'), objectStore = tx.objectStore(name);
      const [keys, rows] = await Promise.all([requestValue(objectStore.getAllKeys()), requestValue(objectStore.getAll())]);
      stores[name] = { keyPath: objectStore.keyPath, entries: await Promise.all(rows.map(async (row, index) => ({ key: await encodeValue(keys[index]), value: await encodeValue(row) }))) };
    }
    return { version: db.version, stores };
  };
  const persistDatabase = async (db) => {
    snapshot.databases ||= {};
    snapshot.databases[db.name] = await dumpDatabase(db);
    await fetch(idbUrl, {
      method: 'PUT', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
      body: JSON.stringify(snapshot),
    }).then((response) => { if (!response.ok) throw new Error('บันทึกไฟล์แนบไม่สำเร็จ'); });
  };
  const scheduleDatabase = (db) => {
    if (saveTimers.has(db.name)) clearTimeout(saveTimers.get(db.name));
    saveTimers.set(db.name, setTimeout(() => { saveTimers.delete(db.name); saving = saving.then(() => persistDatabase(db)).catch(() => {}); }, 700));
  };
  const nativeTransaction = IDBDatabase.prototype.transaction;
  IDBDatabase.prototype.transaction = function(...args) {
    const tx = nativeTransaction.apply(this, args);
    if ((args[1] || 'readonly') === 'readwrite') tx.addEventListener('complete', () => scheduleDatabase(this), { once: true });
    return tx;
  };
  const restoreDatabase = async (db) => {
    const saved = snapshot?.databases?.[db.name];
    if (!saved?.stores) return;
    for (const [name, details] of Object.entries(saved.stores)) {
      if (!db.objectStoreNames.contains(name)) continue;
      const tx = nativeTransaction.call(db, name, 'readwrite'), objectStore = tx.objectStore(name);
      objectStore.clear();
      for (const entry of details.entries || []) {
        const value = await decodeValue(entry.value), key = await decodeValue(entry.key);
        if (objectStore.keyPath == null) objectStore.put(value, key); else objectStore.put(value);
      }
      await transactionDone(tx);
    }
  };
  const eventFor = (type, original) => {
    const event = new Event(type);
    for (const key of ['oldVersion', 'newVersion']) if (original && key in original) Object.defineProperty(event, key, { value: original[key] });
    return event;
  };
  const open = (name, version) => {
    const facade = new EventTarget();
    let result, error = null, transaction = null;
    for (const key of ['result', 'error', 'transaction']) Object.defineProperty(facade, key, { get: () => ({ result, error, transaction })[key] });
    for (const type of ['success', 'error', 'upgradeneeded', 'blocked']) {
      let handler = null;
      Object.defineProperty(facade, 'on' + type, { get: () => handler, set: (next) => { if (handler) facade.removeEventListener(type, handler); handler = next; if (handler) facade.addEventListener(type, handler); } });
    }
    snapshotReady.finally(() => {
      const nativeRequest = version === undefined ? nativeIDB.open(name) : nativeIDB.open(name, version);
      nativeRequest.onupgradeneeded = (event) => { result = nativeRequest.result; transaction = nativeRequest.transaction; facade.dispatchEvent(eventFor('upgradeneeded', event)); };
      nativeRequest.onblocked = (event) => facade.dispatchEvent(eventFor('blocked', event));
      nativeRequest.onerror = () => { error = nativeRequest.error; facade.dispatchEvent(eventFor('error')); };
      nativeRequest.onsuccess = async () => {
        result = nativeRequest.result; transaction = null;
        try { await restoreDatabase(result); } catch { /* app can still use its local database */ }
        facade.dispatchEvent(eventFor('success'));
      };
    });
    return facade;
  };
  const factory = new Proxy(nativeIDB, { get: (target, key) => key === 'open' ? open : (typeof target[key] === 'function' ? target[key].bind(target) : target[key]) });
  try { Object.defineProperty(window, 'indexedDB', { configurable: true, value: factory }); } catch { /* local-only IndexedDB fallback */ }
  window.KrunestIndexedDB = { sync: () => saving };
})();
</script>`;
}
