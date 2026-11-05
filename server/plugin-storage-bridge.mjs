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
})();
</script>`;
}
