import React, { useRef, useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { api } from '../../lib/api';

type Act = (task: () => Promise<unknown>, ok: string) => void;
interface PluginRow { id: number; slug: string; manifest: { entry?: string; delivery?: string; offline?: { fileName: string; size: number } } | null }

const size = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
const LABEL: Record<string, string> = { online: 'ใช้งานออนไลน์', offline: 'ติดตั้งเอง (ออฟไลน์)', both: 'ออนไลน์ + ติดตั้งเอง' };

// Offline installer files go straight from the browser to a private Supabase Storage bucket (signed upload URL).
export function OfflineInstaller({ plugin, busy, act }: { plugin: PluginRow; busy: boolean; act: Act }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState('');
  const manifest = plugin.manifest;
  if (!manifest) return null;
  const delivery = manifest.delivery || (manifest.offline ? (manifest.entry ? 'both' : 'offline') : 'online');
  const options = ['online', 'offline', 'both'].filter((d) => (d === 'online' || manifest.offline) && (d === 'offline' || manifest.entry));

  const upload = (file: File) => act(async () => {
    setProgress('กำลังอัปโหลด…');
    try {
      const target = await api<{ path: string; signedUrl: string }>(`/admin/plugins/${plugin.id}/offline/upload-url`, { method: 'POST', body: { fileName: file.name } });
      const form = new FormData(); form.append('cacheControl', '3600'); form.append('', file);
      const response = await fetch(target.signedUrl, { method: 'PUT', body: form, headers: { 'x-upsert': 'true' } });
      if (!response.ok) throw new Error('อัปโหลดไฟล์ไปยัง Supabase ไม่สำเร็จ (ตรวจขนาดไฟล์ตามแผนที่ใช้งาน)');
      await api(`/admin/plugins/${plugin.id}/offline`, { method: 'POST', body: { path: target.path, fileName: file.name } });
    } finally { setProgress(''); if (input.current) input.current.value = ''; }
  }, 'อัปโหลดไฟล์ติดตั้งออฟไลน์แล้ว');

  return <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
    <div className="mb-2 flex items-center justify-between font-bold text-slate-700"><span className="flex items-center gap-1.5"><Download className="h-3.5 w-3.5"/>ไฟล์ติดตั้งออฟไลน์</span><span className="text-slate-500">{LABEL[delivery]}</span></div>
    {manifest.offline
      ? <div className="mb-2 flex items-center justify-between gap-2"><span className="truncate">{manifest.offline.fileName} · {size(manifest.offline.size)}</span><button disabled={busy} onClick={() => window.confirm('ลบไฟล์ติดตั้งออฟไลน์หรือไม่') && act(() => api(`/admin/plugins/${plugin.id}/offline`, { method: 'DELETE' }), 'ลบไฟล์ติดตั้งแล้ว')} aria-label="ลบไฟล์ติดตั้ง" className="text-rose-600"><Trash2 className="h-3.5 w-3.5"/></button></div>
      : <div className="mb-2 text-slate-500">ยังไม่มีไฟล์ติดตั้ง</div>}
    <div className="flex flex-wrap items-center gap-2">
      <input ref={input} type="file" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(file); }}/>
      <button disabled={busy || Boolean(progress)} onClick={() => input.current?.click()} className="mini-button inline-flex gap-1 bg-blue-50 text-blue-700"><Upload className="h-3.5 w-3.5"/>{progress || (manifest.offline ? 'อัปโหลดไฟล์ใหม่' : 'อัปโหลดไฟล์')}</button>
      {options.length > 1 && <select disabled={busy} value={delivery} onChange={(e) => act(() => api(`/admin/plugins/${plugin.id}/delivery`, { method: 'PATCH', body: { delivery: e.target.value } }), 'อัปเดตรูปแบบการให้บริการแล้ว')} className="rounded-lg border px-2 py-1">{options.map((d) => <option key={d} value={d}>{LABEL[d]}</option>)}</select>}
    </div>
  </div>;
}
