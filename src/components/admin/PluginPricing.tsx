import React, { useState } from 'react';
import { Plus, Tags, Trash2, Upload } from 'lucide-react';
import { api } from '../../lib/api';
import { ACCESS_LABELS, PluginAccess, PluginCategory, PluginTech, PriceTier, TECH_LABELS } from '../../types';

type Act = (task: () => Promise<unknown>, ok: string) => void;

const blankTier = (index: number): PriceTier => ({ id: `tier-${index + 1}`, name: '', price: 0, description: '', offline: false, durationDays: null });
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);

// Rows of price tiers (name, price, description, offline installer included, duration). Used when uploading and when editing later.
export function TierEditor({ tiers, onChange, canOffline }: { tiers: PriceTier[]; onChange: (next: PriceTier[]) => void; canOffline: boolean }) {
  const set = (i: number, patch: Partial<PriceTier>) => onChange(tiers.map((t, n) => (n === i ? { ...t, ...patch } : t)));
  return <div className="space-y-2">
    {tiers.map((tier, i) => <div key={i} className="grid grid-cols-[1fr_90px_auto] items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
      <input value={tier.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="ชื่อระดับ เช่น Basic" className="form-field mt-0 py-1.5 text-xs" aria-label="ชื่อระดับราคา"/>
      <input type="number" min={0} value={tier.price} onChange={(e) => set(i, { price: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} className="form-field mt-0 py-1.5 text-xs" aria-label="ราคา (บาท)"/>
      <button type="button" disabled={tiers.length <= 1} onClick={() => onChange(tiers.filter((_, n) => n !== i))} aria-label="ลบระดับราคา" className="text-rose-600 disabled:opacity-30"><Trash2 className="h-4 w-4"/></button>
      <input value={tier.description} onChange={(e) => set(i, { description: e.target.value })} placeholder="รายละเอียดสั้นๆ (ไม่บังคับ)" className="form-field mt-0 col-span-3 py-1.5 text-xs" aria-label="รายละเอียดระดับราคา"/>
      <label className="col-span-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
        <span className="flex items-center gap-1"><input type="checkbox" disabled={!canOffline} checked={tier.offline} onChange={(e) => set(i, { offline: e.target.checked })}/>รวมไฟล์ติดตั้งเอง{!canOffline && ' (อัปโหลดไฟล์ก่อน)'}</span>
        <span className="flex items-center gap-1">อายุสิทธิ์ <input type="number" min={1} placeholder="ตลอดชีพ" value={tier.durationDays ?? ''} onChange={(e) => set(i, { durationDays: e.target.value ? Math.max(1, Math.floor(Number(e.target.value))) : null })} className="w-20 rounded border px-1.5 py-0.5"/> วัน</span>
      </label>
    </div>)}
    {tiers.length < 6 && <button type="button" onClick={() => onChange([...tiers, blankTier(tiers.length)])} className="mini-button inline-flex gap-1 bg-blue-50 text-blue-700"><Plus className="h-3.5 w-3.5"/>เพิ่มระดับราคา</button>}
  </div>;
}

const withIds = (tiers: PriceTier[]) => tiers.map((t, i) => ({ ...t, id: /^[a-z0-9-]{1,20}$/.test(t.id) ? t.id : slug(t.name).slice(0, 20) || `tier-${i + 1}` }));

export function TechAccessSelects({ tech, access, onTech, onAccess }: { tech: string; access: string; onTech: (v: PluginTech | '') => void; onAccess: (v: PluginAccess | '') => void }) {
  return <>
    <select value={tech} onChange={(e) => onTech(e.target.value as PluginTech | '')} className="rounded-lg border px-2 py-1.5 text-xs" aria-label="ประเภทเทคโนโลยี"><option value="">เทคโนโลยี: อัตโนมัติ</option>{(Object.keys(TECH_LABELS) as PluginTech[]).map((t) => <option key={t} value={t}>{TECH_LABELS[t]}</option>)}</select>
    <select value={access} onChange={(e) => onAccess(e.target.value as PluginAccess | '')} className="rounded-lg border px-2 py-1.5 text-xs" aria-label="ประเภทสิทธิ์"><option value="">สิทธิ์: อัตโนมัติจากราคา</option>{(Object.keys(ACCESS_LABELS) as PluginAccess[]).map((a) => <option key={a} value={a}>{ACCESS_LABELS[a]}</option>)}</select>
  </>;
}

export function CategorySelect({ value, categories, onChange }: { value: string; categories: PluginCategory[]; onChange: (id: string) => void }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border px-2 py-1.5 text-xs" aria-label="หมวดหมู่">
    <option value="">ไม่ระบุหมวดหมู่</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
  </select>;
}

// Edit category + price tiers of an already installed plugin.
export function PluginMeta({ plugin, categories, busy, act }: { plugin: any; categories: PluginCategory[]; busy: boolean; act: Act }) {
  const manifest = plugin.manifest;
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>(manifest?.category || '');
  const [tech, setTech] = useState<string>(manifest?.tech || '');
  const [access, setAccess] = useState<string>(manifest?.access || '');
  const [tiers, setTiers] = useState<PriceTier[]>(manifest?.priceTiers?.length ? manifest.priceTiers : [{ ...blankTier(0), id: 'standard', name: 'มาตรฐาน', price: Number(manifest?.program?.price || 0), offline: Boolean(manifest?.offline) }]);
  if (!manifest?.program) return null;
  const summary = (manifest.priceTiers?.length ? manifest.priceTiers : tiers).map((t: PriceTier) => `${t.name} ฿${t.price.toLocaleString()}`).join(' · ');
  return <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
    <div className="flex items-center justify-between gap-2"><span className="font-bold text-slate-700">หมวด: {categories.find((c) => c.id === manifest.category)?.label || manifest.category || 'ไม่ระบุ'}</span><button onClick={() => setOpen(!open)} className="font-bold text-blue-700">{open ? 'ปิด' : 'แก้ราคา / หมวดหมู่'}</button></div>
    <div className="mt-1 text-slate-500">{summary}</div>
    {open && <div className="mt-3 space-y-3"><div className="flex flex-wrap gap-2"><CategorySelect value={category} categories={categories} onChange={setCategory}/><TechAccessSelects tech={tech} access={access} onTech={setTech} onAccess={setAccess}/></div><TierEditor tiers={tiers} onChange={setTiers} canOffline={Boolean(manifest.offline)}/>
      <button disabled={busy} onClick={() => act(() => api(`/admin/plugins/${plugin.id}/meta`, { method: 'PATCH', body: { category, ...(tech ? { tech } : {}), ...(access ? { access } : {}), priceTiers: withIds(tiers) } }), 'บันทึกราคาและหมวดหมู่แล้ว')} className="primary-button w-full py-2 text-xs">บันทึก</button></div>}
  </div>;
}

// Install form: ZIP + optional category and price tiers set at upload time.
export function UploadForm({ categories, busy, act, onError }: { categories: PluginCategory[]; busy: boolean; act: Act; onError: (message: string) => void }) {
  const [category, setCategory] = useState('');
  const [tech, setTech] = useState('');
  const [access, setAccess] = useState('');
  const [custom, setCustom] = useState(false);
  const [tiers, setTiers] = useState<PriceTier[]>([{ ...blankTier(0), id: 'standard', name: 'มาตรฐาน' }]);
  return <form onSubmit={async (e) => {
    e.preventDefault(); const form = e.currentTarget; const file = new FormData(form).get('archive') as File;
    if (!file?.size) { onError('กรุณาเลือกไฟล์ Plugin ZIP'); return; }
    const archive = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(r.error); r.readAsDataURL(file); });
    act(() => api('/admin/plugins', { method: 'POST', body: { archive, ...(category ? { category } : {}), ...(tech ? { tech } : {}), ...(access ? { access } : {}), ...(custom ? { priceTiers: withIds(tiers) } : {}) } }), 'ตรวจสอบและติดตั้งปลั๊กอินแล้ว'); form.reset();
  }} className="space-y-3">
    <div className="flex flex-wrap items-center gap-3"><input name="archive" required type="file" accept=".zip,application/zip" className="text-xs"/><button disabled={busy} className="primary-button flex gap-2"><Upload className="h-4 w-4"/>ตรวจสอบและติดตั้ง</button><span className="text-xs text-slate-500">ต้องมี manifest.json · ZIP ไม่เกิน 10MB · หลังแตกไม่เกิน 20MB</span></div>
    <div className="flex flex-wrap items-center gap-3 text-xs"><span className="font-bold text-slate-600">หมวดหมู่</span><CategorySelect value={category} categories={categories} onChange={setCategory}/><TechAccessSelects tech={tech} access={access} onTech={setTech} onAccess={setAccess}/>
      <label className="flex items-center gap-1.5 font-bold text-slate-600"><input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)}/>กำหนดระดับราคาเอง (ไม่เลือก = ใช้ราคาใน manifest)</label></div>
    {custom && <TierEditor tiers={tiers} onChange={setTiers} canOffline={false}/>}
  </form>;
}

export function CategoryManager({ categories, busy, act }: { categories: PluginCategory[]; busy: boolean; act: Act }) {
  const [rows, setRows] = useState<PluginCategory[]>(categories);
  const [label, setLabel] = useState('');
  const add = () => { const text = label.trim(); if (!text) return; const base = slug(text) || `cat-${rows.length + 1}`; let id = base; let n = 2; while (rows.some((r) => r.id === id)) id = `${base}-${n++}`.slice(0, 30); setRows([...rows, { id, label: text }]); setLabel(''); };
  return <div className="space-y-3 text-sm">
    <div className="flex flex-wrap gap-2">{rows.map((r) => <span key={r.id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"><Tags className="h-3 w-3 text-blue-600"/>
      <input value={r.label} onChange={(e) => setRows(rows.map((x) => (x.id === r.id ? { ...x, label: e.target.value } : x)))} className="w-32 bg-transparent outline-none" aria-label={`ชื่อหมวด ${r.id}`}/>
      <button onClick={() => setRows(rows.filter((x) => x.id !== r.id))} aria-label={`ลบหมวด ${r.label}`} className="text-rose-500"><Trash2 className="h-3 w-3"/></button></span>)}</div>
    <div className="flex gap-2"><input value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} placeholder="ชื่อหมวดหมู่ใหม่" className="form-field mt-0 max-w-xs py-1.5 text-xs"/><button onClick={add} className="secondary-button">เพิ่ม</button>
      <button disabled={busy} onClick={() => act(() => api('/admin/categories', { method: 'PUT', body: { categories: rows.filter((r) => r.label.trim()) } }), 'บันทึกหมวดหมู่แล้ว')} className="primary-button">บันทึกหมวดหมู่</button></div>
    <p className="text-xs text-slate-500">ลบหมวดที่มีโปรแกรมใช้อยู่ได้ โปรแกรมจะแสดงเป็นไม่ระบุหมวดจนกว่าจะเลือกใหม่</p>
  </div>;
}
