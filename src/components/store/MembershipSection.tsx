import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { MemberTier } from '../../types';
import { OrderTarget } from '../modals/QuickOrderModal';

type Plan = { id: string; name: string; monthly_price: number; yearly_price: number; badge: string; subtitle: string };

export function MembershipSection({ memberTier, onOrder }: { memberTier: MemberTier; onOrder: (target: OrderTarget) => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  useEffect(() => { api<{ plans: Plan[] }>('/membership').then((data) => setPlans(data.plans)).catch(() => setPlans([])); }, []);
  if (!plans.length) return null;
  return <section id="membership" className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold text-blue-700">สมาชิก KRUNEST</p><h2 className="mt-2 text-2xl font-black text-slate-900">เลือกแพ็กเกจสมาชิก</h2><p className="mt-1 text-sm text-slate-600">แต่ละระบบงานระบุชัดเจนว่าใช้ได้กับแพ็กเกจระดับใด</p></div><div className="flex rounded-xl border border-slate-200 bg-white p-1 text-sm font-bold"><button type="button" onClick={() => setCycle('monthly')} className={`rounded-lg px-4 py-2 ${cycle === 'monthly' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>รายเดือน</button><button type="button" onClick={() => setCycle('yearly')} className={`rounded-lg px-4 py-2 ${cycle === 'yearly' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>รายปี</button></div></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{plans.map((plan) => {
      const price = cycle === 'yearly' ? plan.yearly_price : plan.monthly_price;
      return <article key={plan.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex min-h-7 items-start justify-between gap-2"><h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>{plan.badge && <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-800">{plan.badge}</span>}</div><p className="mt-2 min-h-12 text-sm text-slate-500">{plan.subtitle || `ใช้ระบบงานที่กำหนดสิทธิ์ระดับ ${plan.id.toUpperCase()} และระดับก่อนหน้า`}</p><div className="mt-4 text-3xl font-black text-slate-900">฿{price.toLocaleString()}<span className="ml-1 text-sm font-normal text-slate-500">/{cycle === 'yearly' ? 'ปี' : 'เดือน'}</span></div><p className="mt-2 text-sm text-slate-600">สิทธิ์เป็นไปตามระดับที่กำหนดในแต่ละระบบงาน</p><button type="button" disabled={plan.id === 'free'} onClick={() => onOrder({ type: 'package', id: plan.id, title: plan.name, subtitle: `${cycle === 'yearly' ? 'รายปี 365 วัน' : 'รายเดือน 30 วัน'} · ใช้ระบบงานตามระดับแพ็กเกจ`, price, unlockProgramIds: [], badgeLabel: plan.badge || 'แพ็กเกจสมาชิก', billingCycle: cycle })} className="primary-button mt-6 w-full disabled:cursor-default disabled:opacity-50">{plan.id === 'free' ? 'แพ็กเกจพื้นฐาน' : memberTier === plan.id ? 'ต่ออายุแพ็กเกจ' : 'สมัครแพ็กเกจ'}</button></article>;
    })}</div>
  </section>;
}
