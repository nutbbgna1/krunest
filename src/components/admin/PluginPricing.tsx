import React, { useId, useState } from 'react';
import { FileArchive, Plus, Tags, Trash2, Upload } from 'lucide-react';
import { api } from '../../lib/api';
import { ACCESS_LABELS, CustomerPriceTier, PluginAccess, PluginCategory, PluginTech, PriceTier, TECH_LABELS } from '../../types';

type Act = (task: () => Promise<unknown>, ok: string) => void;

export const blankTier = (index: number): PriceTier => ({ id: `tier-${index + 1}`, name: '', price: 0, description: '', offline: false, durationDays: null });
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

export const withIds = (tiers: PriceTier[]) => tiers.map((t, i) => ({ ...t, id: /^[a-z0-9-]{1,20}$/.test(t.id) ? t.id : slug(t.name).slice(0, 20) || `tier-${i + 1}` }));

function TierPicker({ tiers, selected, onChange }: { tiers: CustomerPriceTier[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  if (!tiers.length) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">ยังไม่มีระดับราคาลูกค้า กรุณาสร้างในเมนู “ระดับราคาลูกค้า” ก่อน</div>;
  return <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{tiers.map((tier) => <label key={tier.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${selected.includes(tier.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
    <input type="checkbox" checked={selected.includes(tier.id)} onChange={() => toggle(tier.id)} className="mt-1"/>
    <span><span className="block font-bold text-slate-800">{tier.name} · ฿{tier.price.toLocaleString()}</span><span className="mt-0.5 block text-[11px] text-slate-500">{tier.description || (tier.durationDays ? `ใช้งาน ${tier.durationDays} วัน` : 'ใช้งานได้ตลอดชีพ')}</span></span>
  </label>)}</div>;
}

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
export function PluginMeta({ plugin, categories, customerTiers, busy, act }: { plugin: any; categories: PluginCategory[]; customerTiers: CustomerPriceTier[]; busy: boolean; act: Act }) {
  const manifest = plugin.manifest;
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>(manifest?.category || '');
  const [tech, setTech] = useState<string>(manifest?.tech || '');
  const [access, setAccess] = useState<string>(manifest?.access || '');
  const [selectedTierIds, setSelectedTierIds] = useState<string[]>(() => (manifest?.priceTiers || []).map((tier: PriceTier) => tier.id).filter((id: string) => customerTiers.some((tier) => tier.id === id)));
  if (!manifest?.program) return null;
  const summary = (manifest.priceTiers?.length ? manifest.priceTiers : [{ name: 'มาตรฐาน', price: Number(manifest?.program?.price || 0) }]).map((t: PriceTier) => `${t.name} ฿${t.price.toLocaleString()}`).join(' · ');
  return <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
    <div className="flex items-center justify-between gap-2"><span className="font-bold text-slate-700">หมวด: {categories.find((c) => c.id === manifest.category)?.label || manifest.category || 'ไม่ระบุ'}</span><button onClick={() => setOpen(!open)} className="font-bold text-blue-700">{open ? 'ปิด' : 'ตั้งค่าระบบงาน'}</button></div>
    <div className="mt-1 text-slate-500">{summary}</div>
    {open && <div className="mt-3 space-y-3"><div className="flex flex-wrap gap-2"><CategorySelect value={category} categories={categories} onChange={setCategory}/><TechAccessSelects tech={tech} access={access} onTech={setTech} onAccess={setAccess}/></div><div><div className="mb-2 font-bold text-slate-700">เลือกระดับราคาลูกค้า</div><TierPicker tiers={customerTiers} selected={selectedTierIds} onChange={setSelectedTierIds}/></div>
      <button disabled={busy || selectedTierIds.length === 0} onClick={() => act(() => api(`/admin/plugins/${plugin.id}/meta`, { method: 'PATCH', body: { category, ...(tech ? { tech } : {}), ...(access ? { access } : {}), priceTierIds: selectedTierIds } }), 'บันทึกการตั้งค่าระบบงานแล้ว')} className="primary-button w-full py-2 text-xs disabled:opacity-50">บันทึก</button></div>}
  </div>;
}

// Install form: ZIP + optional category and price tiers set at upload time.
export function UploadForm({ categories, customerTiers, busy, act, onError }: { categories: PluginCategory[]; customerTiers: CustomerPriceTier[]; busy: boolean; act: Act; onError: (message: string) => void }) {
  const archiveInputId = useId();
  const [archiveName, setArchiveName] = useState('');
  const [legacy, setLegacy] = useState(false);
  const [category, setCategory] = useState('');
  const [tech, setTech] = useState('');
  const [access, setAccess] = useState('');
  const [selectedTierIds, setSelectedTierIds] = useState<string[]>([]);
  return <form onSubmit={async (e) => {
    e.preventDefault(); const form = e.currentTarget; const file = new FormData(form).get('archive') as File;
    if (!file?.size) { onError('กรุณาเลือกไฟล์ Plugin ZIP'); return; }
    if (!selectedTierIds.length) { onError('กรุณาเลือกระดับราคาลูกค้าอย่างน้อย 1 ระดับ'); return; }
    const read = (input: File) => new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(r.error); r.readAsDataURL(input); });
    const archive = await read(file);
    const fields = new FormData(form);
    const manualFile = fields.get('manual') as File;
    const manual = legacy && manualFile?.size ? await read(manualFile) : undefined;
    act(() => api('/admin/plugins', { method: 'POST', body: { archive, ...(legacy ? { name: String(fields.get('name')||''), slug: String(fields.get('slug')||''), description: String(fields.get('description')||''), price: Number(fields.get('price')||0), ...(manual ? { manual } : {}) } : {}), ...(category ? { category } : {}), ...(tech ? { tech } : {}), ...(access ? { access } : {}), priceTierIds: selectedTierIds } }), 'ตรวจสอบและติดตั้งปลั๊กอินแล้ว'); form.reset(); setArchiveName('');
  }} className="space-y-3">
    <div className="flex flex-wrap items-center gap-3">
      <input id={archiveInputId} name="archive" required type="file" accept=".zip,application/zip" className="sr-only" onChange={(event)=>setArchiveName(event.target.files?.[0]?.name||'')}/>
      <label htmlFor={archiveInputId} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 transition hover:border-blue-400 hover:bg-blue-100 focus-within:ring-4 focus-within:ring-blue-100"><FileArchive className="h-5 w-5"/>เลือกไฟล์ ZIP</label>
      <span className={`min-w-0 max-w-full truncate text-sm ${archiveName?'font-bold text-slate-700':'text-slate-400'}`}>{archiveName||'ยังไม่ได้เลือกไฟล์'}</span>
      <button disabled={busy} className="primary-button flex gap-2"><Upload className="h-4 w-4"/>ตรวจสอบและติดตั้ง</button>
      <span className="text-xs text-slate-500">ZIP ไม่เกิน 20MB · หลังแตกไม่เกิน 60MB</span>
    </div>
    <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={legacy} onChange={(e)=>setLegacy(e.target.checked)}/>ZIP เดิมที่ไม่มี manifest.json</label>
    {legacy && <div className="grid gap-2 md:grid-cols-2"><input name="name" required placeholder="ชื่อระบบงาน" className="form-field mt-0"/><input name="slug" required pattern="[a-z0-9-]+" placeholder="slug เช่น html-qr-attendance" className="form-field mt-0"/><input name="price" type="number" min="0" defaultValue="0" aria-label="ราคา" className="form-field mt-0"/><label className="text-xs">คู่มือ PDF <input name="manual" type="file" accept=".pdf,application/pdf" className="mt-1 block"/></label><input name="description" placeholder="คำอธิบายสั้น" className="form-field mt-0 md:col-span-2"/></div>}
    <div className="flex flex-wrap items-center gap-3 text-xs"><span className="font-bold text-slate-600">หมวดหมู่</span><CategorySelect value={category} categories={categories} onChange={setCategory}/><TechAccessSelects tech={tech} access={access} onTech={setTech} onAccess={setAccess}/></div>
    <div><div className="mb-2 text-xs font-bold text-slate-700">เลือกระดับราคาที่จะให้ลูกค้าเห็น</div><TierPicker tiers={customerTiers} selected={selectedTierIds} onChange={setSelectedTierIds}/></div>
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
