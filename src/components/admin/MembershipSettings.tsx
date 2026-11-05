import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

type Plan = { id: string; name: string; monthly_price: number; yearly_price: number; program_limit: number; active: number | boolean; badge: string; subtitle: string };
type Promo = { code: string; label: string; discountPercent: number; active: boolean };
type Settings = { plans: Plan[]; promoCodes: Promo[] };

export function MembershipSettings() {
  const [data, setData] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { api<Settings>('/admin/membership').then(setData).catch((e) => setError((e as Error).message)); }, []);

  const setPlan = (id: string, change: Partial<Plan>) => setData((old) => old && ({ ...old, plans: old.plans.map((plan) => plan.id === id ? { ...plan, ...change } : plan) }));
  const setPromo = (index: number, change: Partial<Promo>) => setData((old) => old && ({ ...old, promoCodes: old.promoCodes.map((promo, i) => i === index ? { ...promo, ...change } : promo) }));
  const save = async () => {
    if (!data) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await api<Settings>('/admin/membership', { method: 'PUT', body: {
        plans: data.plans.map((plan) => ({ ...plan, active: Boolean(plan.active) })),
        promoCodes: data.promoCodes,
      } });
      setData(result); setMessage('บันทึกแพ็กเกจและโปรโมชันแล้ว ราคาหน้าร้านและคำสั่งซื้อใช้ค่าใหม่ทันที');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  if (!data) return <div className="portal-card p-6 text-sm text-slate-500">{error || 'กำลังโหลดข้อมูลสมาชิก...'}</div>;
  return <div className="space-y-5">
    <div className="portal-card p-5"><h2 className="text-xl font-extrabold">ราคาและชื่อแพ็กเกจสมาชิก</h2><p className="mt-1 text-sm text-slate-500">ราคาที่กำหนดตรงนี้จะใช้ทั้งบนหน้าร้านและยอดชำระจริง สิทธิ์รายเดือนมีอายุ 30 วัน รายปีมีอายุ 365 วัน</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">{data.plans.map((plan) => <section key={plan.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3"><div className="text-xs font-bold uppercase text-blue-700">{plan.id}</div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(plan.active)} onChange={(e) => setPlan(plan.id, { active: e.target.checked })}/>แสดงแพ็กเกจ</label></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-700 sm:col-span-2">ชื่อแพ็กเกจ<input className="form-field mt-1" value={plan.name} maxLength={80} onChange={(e) => setPlan(plan.id, { name: e.target.value })}/></label>
          <label className="text-sm font-bold text-slate-700">รายเดือน (บาท)<input className="form-field mt-1" type="number" min="0" max="1000000" value={plan.monthly_price} onChange={(e) => setPlan(plan.id, { monthly_price: Number(e.target.value) })}/></label>
          <label className="text-sm font-bold text-slate-700">รายปี (บาท)<input className="form-field mt-1" type="number" min="0" max="1000000" value={plan.yearly_price} onChange={(e) => setPlan(plan.id, { yearly_price: Number(e.target.value) })}/></label>
          <label className="text-sm font-bold text-slate-700">จำนวนโปรแกรมที่ใช้ได้<input className="form-field mt-1" type="number" min="0" max="1000" value={plan.program_limit} onChange={(e) => setPlan(plan.id, { program_limit: Number(e.target.value) })}/></label>
          <label className="text-sm font-bold text-slate-700">ป้ายโปรโมชัน<input className="form-field mt-1" value={plan.badge} maxLength={60} placeholder="เช่น ยอดนิยม" onChange={(e) => setPlan(plan.id, { badge: e.target.value })}/></label>
          <label className="text-sm font-bold text-slate-700 sm:col-span-2">คำอธิบายสั้น<input className="form-field mt-1" value={plan.subtitle} maxLength={200} onChange={(e) => setPlan(plan.id, { subtitle: e.target.value })}/></label>
        </div>
      </section>)}</div>
    </div>
    <div className="portal-card p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold">รหัสส่วนลดสมาชิก</h2><p className="mt-1 text-sm text-slate-500">ใช้ได้กับการสมัครแพ็กเกจสมาชิก ส่วนลดจะหักจากยอดคำสั่งซื้อจริง</p></div><button type="button" className="secondary-button" onClick={() => setData({ ...data, promoCodes: [...data.promoCodes, { code: '', label: '', discountPercent: 10, active: true }] })}>เพิ่มรหัส</button></div>
      <div className="mt-4 space-y-3">{data.promoCodes.map((promo, index) => <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_1.5fr_110px_auto_auto] sm:items-end">
        <label className="text-sm font-bold">รหัส<input className="form-field mt-1 uppercase" value={promo.code} maxLength={24} onChange={(e) => setPromo(index, { code: e.target.value.toUpperCase() })}/></label>
        <label className="text-sm font-bold">ชื่อโปรโมชัน<input className="form-field mt-1" value={promo.label} maxLength={80} onChange={(e) => setPromo(index, { label: e.target.value })}/></label>
        <label className="text-sm font-bold">ส่วนลด %<input className="form-field mt-1" type="number" min="1" max="100" value={promo.discountPercent} onChange={(e) => setPromo(index, { discountPercent: Number(e.target.value) })}/></label>
        <label className="flex items-center gap-2 pb-3 text-sm"><input type="checkbox" checked={promo.active} onChange={(e) => setPromo(index, { active: e.target.checked })}/>เปิดใช้</label>
        <button type="button" className="secondary-button" onClick={() => setData({ ...data, promoCodes: data.promoCodes.filter((_, i) => i !== index) })}>ลบ</button>
      </div>)}{!data.promoCodes.length && <p className="text-sm text-slate-500">ยังไม่มีรหัสส่วนลดสมาชิก</p>}</div>
    </div>
    {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
    <button type="button" disabled={busy} onClick={save} className="primary-button">{busy ? 'กำลังบันทึก...' : 'บันทึกราคาและโปรโมชัน'}</button>
  </div>;
}
