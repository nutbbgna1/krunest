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
  return <section className="portal-card overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 lg:px-6"><div><div className="text-[11px] font-black uppercase tracking-widest text-blue-600">ข้อมูลผู้ใช้งาน</div><h3 className="mt-1 font-black text-slate-900">ตรวจงานที่บันทึกในแต่ละระบบ</h3><p className="mt-1 text-xs text-slate-500">ผู้ดูแลเท่านั้นที่เห็นข้อมูลส่วนนี้ งานของผู้ใช้แต่ละคนจะแยกจากกัน</p></div><select value={slug} onChange={(event) => load(event.target.value)} aria-label="เลือกโปรแกรมเพื่อตรวจงาน" className="form-field mt-0 w-full sm:w-72"><option value="">เลือกโปรแกรมเพื่อตรวจงาน</option>{plugins.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}</select></div>
    <div className="p-5 lg:p-6">
    {error && <p className="text-sm text-rose-700 mt-3">{error}</p>}
    {slug && <div className="mt-4 space-y-2">{rows.length ? rows.map((row) =>
      <details key={`${row.user_id}:${row.record_key}`} className="rounded-xl border border-slate-200 p-3 text-sm">
        <summary className="cursor-pointer font-bold">{row.name} · {row.record_key} · {new Date(row.updated_at).toLocaleString('th-TH')}</summary>
        <p className="text-xs text-slate-500 mt-2">{row.email}</p>
        <pre className="mt-2 whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-3 text-xs">{JSON.stringify(row.payload, null, 2)}</pre>
      </details>) : <p className="text-sm text-slate-500">ยังไม่มีงานที่บันทึกผ่านระบบนี้</p>}</div>}
    {!slug && <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">เลือกโปรแกรมด้านบนเพื่อดูงานที่ผู้ใช้เคยบันทึกไว้</div>}
    </div>
  </section>;
}
