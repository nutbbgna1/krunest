import React, { useEffect, useState } from 'react';
import { Landmark, Plus, QrCode, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';

interface Account { id: string; type: 'promptpay' | 'bank'; label: string; bankName: string; accountName: string; accountNumber: string; note: string; active: boolean }
type Act = (task: () => Promise<unknown>, ok: string) => void;

const blank = (type: Account['type']): Account => ({ id: '', type, label: type === 'promptpay' ? 'PromptPay' : '', bankName: '', accountName: '', accountNumber: '', note: '', active: true });
const idFor = (a: Account, i: number, taken: Set<string>) => {
  if (a.id) return a.id;
  let id = (a.type === 'promptpay' ? 'promptpay' : `bank-${a.bankName.toLowerCase().replace(/[^a-z0-9]+/g, '') || i + 1}`).slice(0, 30);
  while (taken.has(id)) id = `${id}-${i + 1}`.slice(0, 30);
  taken.add(id); return id;
};

export function PaymentAccounts({ busy, act }: { busy: boolean; act: Act }) {
  const [rows, setRows] = useState<Account[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api<Account[]>('/admin/payment-accounts').then(setRows).catch((e) => setError((e as Error).message)); }, []);
  if (!rows) return <div className="text-sm text-slate-500">{error || 'กำลังโหลด…'}</div>;
  const set = (i: number, patch: Partial<Account>) => setRows(rows.map((r, n) => (n === i ? { ...r, ...patch } : r)));
  const activeCount = rows.filter((r) => r.active).length;
  const save = () => { const taken = new Set(rows.map((r) => r.id).filter(Boolean)); act(async () => { const saved = await api<Account[]>('/admin/payment-accounts', { method: 'PUT', body: { accounts: rows.map((r, i) => ({ ...r, id: idFor(r, i, taken) })) } }); setRows(saved); }, 'บันทึกบัญชีรับเงินแล้ว'); };
  return <div className="space-y-4">
    {activeCount === 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">ยังไม่มีบัญชีที่เปิดใช้งาน ลูกค้าจะสร้างคำสั่งซื้อไม่ได้จนกว่าจะเพิ่มบัญชีอย่างน้อย 1 บัญชี</div>}
    {rows.map((a, i) => <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-bold">{a.type === 'promptpay' ? <QrCode className="h-4 w-4 text-blue-600"/> : <Landmark className="h-4 w-4 text-blue-600"/>}{a.type === 'promptpay' ? 'PromptPay (สร้าง QR ตามยอดอัตโนมัติ)' : 'โอนผ่านบัญชีธนาคาร'}</span>
        <div className="flex items-center gap-3"><label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={a.active} onChange={(e) => set(i, { active: e.target.checked })}/>เปิดใช้งาน</label><button onClick={() => setRows(rows.filter((_, n) => n !== i))} aria-label="ลบบัญชี" className="text-rose-600"><Trash2 className="h-4 w-4"/></button></div></div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs font-bold text-slate-600">ชื่อที่แสดง<input value={a.label} onChange={(e) => set(i, { label: e.target.value })} className="form-field mt-1" placeholder="เช่น กสิกรไทย (บัญชีหลัก)"/></label>
        <label className="text-xs font-bold text-slate-600">{a.type === 'promptpay' ? 'เบอร์ PromptPay (10 หลัก) หรือเลขบัตร/ภาษี (13 หลัก)' : 'เลขบัญชี'}<input value={a.accountNumber} onChange={(e) => set(i, { accountNumber: e.target.value })} inputMode="numeric" className="form-field mt-1 font-mono"/></label>
        {a.type === 'bank' && <>
          <label className="text-xs font-bold text-slate-600">ธนาคาร<input value={a.bankName} onChange={(e) => set(i, { bankName: e.target.value })} className="form-field mt-1" placeholder="เช่น กสิกรไทย"/></label>
          <label className="text-xs font-bold text-slate-600">ชื่อบัญชี<input value={a.accountName} onChange={(e) => set(i, { accountName: e.target.value })} className="form-field mt-1"/></label>
        </>}
        <label className="text-xs font-bold text-slate-600 md:col-span-2">หมายเหตุถึงลูกค้า (ไม่บังคับ)<input value={a.note} onChange={(e) => set(i, { note: e.target.value })} className="form-field mt-1" placeholder="เช่น โอนแล้วแนบสลิปในหน้านี้"/></label>
      </div>
    </div>)}
    <div className="flex flex-wrap gap-2">
      <button onClick={() => setRows([...rows, blank('promptpay')])} className="secondary-button flex items-center gap-2"><Plus className="h-4 w-4"/>เพิ่ม PromptPay</button>
      <button onClick={() => setRows([...rows, blank('bank')])} className="secondary-button flex items-center gap-2"><Plus className="h-4 w-4"/>เพิ่มบัญชีธนาคาร</button>
      <button disabled={busy} onClick={save} className="primary-button ml-auto">บันทึกบัญชีรับเงิน</button>
    </div>
  </div>;
}
