import { getSupabaseAdmin, isSupabaseConfigured } from './supabase.mjs';

export const BUCKET = 'krunest-files';

// Supabase Storage wrapper. All objects live in one private bucket:
//   plugins/<slug>.zip            - original plugin archive (restores the plugin folder after a redeploy)
//   offline/<slug>/<file>         - installer files sold for offline installation
// `client` can be injected for tests.
export function createStorage(client = null) {
  const sb = () => client || getSupabaseAdmin();
  const bucket = () => sb().storage.from(BUCKET);
  const fail = (error, what) => { if (error) throw new Error(`storage ${what}: ${error.message || error}`); };
  return {
    enabled: () => Boolean(client) || isSupabaseConfigured(),
    async ensureBucket() {
      const { error } = await sb().storage.createBucket(BUCKET, { public: false });
      if (error && !/already exists|duplicate/i.test(error.message || '')) fail(error, 'createBucket');
    },
    async upload(path, body, contentType = 'application/octet-stream') {
      const { error } = await bucket().upload(path, body, { contentType, upsert: true });
      fail(error, 'upload');
    },
    async download(path) {
      const { data, error } = await bucket().download(path);
      fail(error, 'download');
      return Buffer.from(await data.arrayBuffer());
    },
    async remove(paths) {
      const list = (Array.isArray(paths) ? paths : [paths]).filter(Boolean);
      if (!list.length) return;
      const { error } = await bucket().remove(list);
      fail(error, 'remove');
    },
    async signedUrl(path, seconds = 300, downloadName) {
      const { data, error } = await bucket().createSignedUrl(path, seconds, downloadName ? { download: downloadName } : undefined);
      fail(error, 'signedUrl');
      return data.signedUrl;
    },
    async signedUploadUrl(path) {
      const { data, error } = await bucket().createSignedUploadUrl(path, { upsert: true });
      fail(error, 'signedUploadUrl');
      return { path: data.path || path, token: data.token, signedUrl: data.signedUrl };
    },
    async info(path) {
      const slash = path.lastIndexOf('/');
      const { data, error } = await bucket().list(path.slice(0, slash), { search: path.slice(slash + 1), limit: 5 });
      fail(error, 'list');
      const found = (data || []).find((item) => item.name === path.slice(slash + 1));
      return found ? { size: Number(found.metadata?.size ?? 0) } : null;
    },
  };
}

export const safeObjectName = (name) => String(name || 'file').normalize('NFKD').replace(/[^\w.\-]+/g, '_').replace(/^\.+/, '').slice(0, 120) || 'file';
