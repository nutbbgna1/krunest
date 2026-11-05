import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { CustomerPriceTier } from '../../types';
import { blankTier, TierEditor, withIds } from './PluginPricing';

type Act = (task: () => Promise<unknown>, ok: string) => void;

export function CustomerPriceTiers({ tiers, busy, act }: { tiers: CustomerPriceTier[]; busy: boolean; act: Act }) {
  const [rows, setRows] = useState<CustomerPriceTier[]>(tiers.length ? tiers : [
    { ...blankTier(0), id: 'basic', name: 'Basic', description: 'สำหรับใช้งานทั่วไป' },
  ]);
  useEffect(() => { if (tiers.length) setRows(tiers); }, [tiers]);
  const save = () => act(
    () => api('/admin/customer-price-tiers', { method: 'PUT', body: { tiers: withIds(rows).map((tier) => ({ ...tier, offline: false })) } }),
    'บันทึกระดับราคาลูกค้าแล้ว',
  );
  return <div className="space-y-5">
    <section className="portal-card overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-extrabold">คลังระดับราคาลูกค้า</h2><p className="mt-1 text-xs text-slate-500">สร้างราคาไว้ครั้งเดียว แล้วเลือกใช้ตอนอัปโหลดระบบงาน เช่น Basic, Pro และ Premium</p></div>
      <div className="p-5"><TierEditor tiers={rows} onChange={setRows} canOffline={false}/><button type="button" disabled={busy} onClick={save} className="primary-button mt-5 disabled:opacity-50">บันทึกระดับราคา</button></div>
    </section>
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900"><div className="font-bold">วิธีใช้งาน</div><ol className="mt-2 list-decimal space-y-1 pl-5"><li>สร้างหรือแก้ราคาในหน้านี้แล้วกดบันทึก</li><li>เปิดเมนู “ระบบงาน” และเลือกไฟล์ ZIP</li><li>ติ๊กระดับราคาที่ต้องการก่อนกดติดตั้ง</li></ol><p className="mt-3 text-xs text-blue-700">การแก้ราคาในคลังจะใช้กับการเลือกครั้งถัดไป โปรแกรมที่ติดตั้งแล้วจะไม่เปลี่ยนราคาเอง</p></section>
  </div>;
}
