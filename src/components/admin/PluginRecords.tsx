import { useState } from 'react';
import { api } from '../../lib/api';

type Row = { user_id: number; name: string; email: string; record_key: string; payload: unknown; updated_at: string };

export function PluginRecords({ plugins }: { plugins: { slug: string; name: string }[] }) {
  const [slug, setSlug] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const load = async (value: string) => {
    setSlug(value); setRows([]); setError('');
    if (!value) return;
    try { setRows(await api<Row[]>(`/admin/plugin-records?slug=${encodeURIComponent(value)}`)); }
    catch (cause) { setError((cause as Error).message); }
  };
  return <div className="portal-card p-5 mt-5">
    <h3 className="font-extrabold">งานที่บันทึกในระบบ (ผู้ดูแล)</h3>
    <p className="text-xs text-slate-500 mt-1">แสดงข้อมูลที่โปรแกรมส่งเข้า API บันทึกงานของ Krunest</p>
    <select value={slug} onChange={(event) => load(event.target.value)} aria-label="เลือกโปรแกรมเพื่อตรวจงาน" className="form-field max-w-md mt-3">
      <option value="">เลือกโปรแกรม</option>{plugins.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
    </select>
    {error && <p className="text-sm text-rose-700 mt-3">{error}</p>}
    {slug && <div className="mt-4 space-y-2">{rows.length ? rows.map((row) =>
      <details key={`${row.user_id}:${row.record_key}`} className="rounded-xl border border-slate-200 p-3 text-sm">
        <summary className="cursor-pointer font-bold">{row.name} · {row.record_key} · {new Date(row.updated_at).toLocaleString('th-TH')}</summary>
        <p className="text-xs text-slate-500 mt-2">{row.email}</p>
        <pre className="mt-2 whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-3 text-xs">{JSON.stringify(row.payload, null, 2)}</pre>
      </details>) : <p className="text-sm text-slate-500">ยังไม่มีงานที่บันทึกผ่านระบบนี้</p>}</div>}
  </div>;
}
