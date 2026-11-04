import React, { useEffect, useState } from 'react';
import { Landmark, Plus, QrCode, Trash2, Upload } from 'lucide-react';
import { api } from '../../lib/api';

interface Account { id: string; type: 'promptpay' | 'bank' | 'qr'; qrImage?: string; label: string; bankName: string; accountName: string; accountNumber: string; note: string; active: boolean }
type Act = (task: () => Promise<unknown>, ok: string) => void;

const blank = (type: Account['type']): Account => ({ id: '', type, label: type === 'promptpay' ? 'PromptPay' : type === 'qr' ? 'QR Code รับเงิน' : '', bankName: '', accountName: '', accountNumber: '', note: '', active: true });
const idFor = (a: Account, i: number, taken: Set<string>) => {
  if (a.id) return a.id;
  let id = (a.type === 'promptpay' ? 'promptpay' : a.type === 'qr' ? 'qr' : `bank-${a.bankName.toLowerCase().replace(/[^a-z0-9]+/g, '') || i + 1}`).slice(0, 30);
  while (taken.has(id)) id = `${id}-${i + 1}`.slice(0, 30);
  taken.add(id); return id;
};

// Shrinks the uploaded QR image (keeps it sharp enough to scan) so it stays small in the database.
const readQr = (file: File) => new Promise<string>((resolve, reject) => {
  if (!['image/png', 'image/jpeg'].includes(file.type)) { reject(new Error('รองรับเฉพาะไฟล์ PNG หรือ JPG')); return; }
  const reader = new FileReader();
  reader.onerror = () => reject(reader.error);
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => reject(new Error('เปิดรูปภาพไม่ได้'));
    img.onload = () => {
      const scale = Math.min(1, 640 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas'); canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d'); if (!ctx) { reject(new Error('ประมวลผลรูปไม่ได้')); return; }
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const png = canvas.toDataURL('image/png');
      resolve(png.length < 800_000 ? png : canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = String(reader.result);
  };
  reader.readAsDataURL(file);
});

export function PaymentAccounts({ busy, act }: { busy: boolean; act: Act }) {
  const [rows, setRows] = useState<Account[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api<Account[]>('/admin/payment-accounts').then(setRows).catch((e) => setError((e as Error).message)); }, []);
  if (!rows) return <div className="text-sm text-slate-500">{error || 'กำลังโหลด…'}</div>;
  const set = (i: number, patch: Partial<Account>) => setRows(rows.map((r, n) => (n === i ? { ...r, ...patch } : r)));
  const activeCount = rows.filter((r) => r.active).length;
  const save = () => { const taken = new Set(rows.map((r) => r.id).filter(Boolean)); act(async () => { const saved = await api<Account[]>('/admin/payment-accounts', { method: 'PUT', body: { accounts: rows.map((r, i) => ({ ...r, id: idFor(r, i, taken) })) } }); setRows(saved); }, 'บันทึกบัญชีรับเงินแล้ว'); };
  return <div className="space-y-4">
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    {activeCount === 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">ยังไม่มีบัญชีที่เปิดใช้งาน ลูกค้าจะสร้างคำสั่งซื้อไม่ได้จนกว่าจะเพิ่มบัญชีอย่างน้อย 1 บัญชี</div>}
    {rows.map((a, i) => <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-bold">{a.type === 'bank' ? <Landmark className="h-4 w-4 text-blue-600"/> : <QrCode className="h-4 w-4 text-blue-600"/>}{a.type === 'promptpay' ? 'PromptPay (สร้าง QR ตามยอดอัตโนมัติ)' : a.type === 'qr' ? 'QR Code จากรูปภาพ (QR คงที่ ลูกค้ากรอกยอดเอง)' : 'โอนผ่านบัญชีธนาคาร'}</span>
        <div className="flex items-center gap-3"><label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={a.active} onChange={(e) => set(i, { active: e.target.checked })}/>เปิดใช้งาน</label><button onClick={() => setRows(rows.filter((_, n) => n !== i))} aria-label="ลบบัญชี" className="text-rose-600"><Trash2 className="h-4 w-4"/></button></div></div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs font-bold text-slate-600">ชื่อที่แสดง<input value={a.label} onChange={(e) => set(i, { label: e.target.value })} className="form-field mt-1" placeholder="เช่น กสิกรไทย (บัญชีหลัก)"/></label>
        {a.type !== 'qr' && <label className="text-xs font-bold text-slate-600">{a.type === 'promptpay' ? 'เบอร์ PromptPay (10 หลัก) หรือเลขบัตร/ภาษี (13 หลัก)' : 'เลขบัญชี'}<input value={a.accountNumber} onChange={(e) => set(i, { accountNumber: e.target.value })} inputMode="numeric" className="form-field mt-1 font-mono"/></label>}
        {a.type === 'qr' && <div className="md:col-span-1 text-xs font-bold text-slate-600">รูป QR Code (PNG/JPG)
          <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-3 text-blue-700">
            {a.qrImage ? <img src={a.qrImage} alt="ตัวอย่าง QR Code" className="h-24 w-24 rounded-lg border bg-white object-contain"/> : <Upload className="h-6 w-6"/>}
            <span>{a.qrImage ? 'เปลี่ยนรูป' : 'เลือกรูป QR จากแอปธนาคาร'}</span>
            <input type="file" accept="image/png,image/jpeg" hidden onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { set(i, { qrImage: await readQr(file) }); setError(''); } catch (x) { setError((x as Error).message); } e.target.value = ''; }}/>
          </label></div>}
        {a.type === 'bank' && <>
          <label className="text-xs font-bold text-slate-600">ธนาคาร<input value={a.bankName} onChange={(e) => set(i, { bankName: e.target.value })} className="form-field mt-1" placeholder="เช่น กสิกรไทย"/></label>
          <label className="text-xs font-bold text-slate-600">ชื่อบัญชี<input value={a.accountName} onChange={(e) => set(i, { accountName: e.target.value })} className="form-field mt-1"/></label>
        </>}
        <label className="text-xs font-bold text-slate-600 md:col-span-2">หมายเหตุถึงลูกค้า (ไม่บังคับ)<input value={a.note} onChange={(e) => set(i, { note: e.target.value })} className="form-field mt-1" placeholder="เช่น โอนแล้วแนบสลิปในหน้านี้"/></label>
      </div>
    </div>)}
    <div className="flex flex-wrap gap-2">
      <button onClick={() => setRows([...rows, blank('promptpay')])} className="secondary-button flex items-center gap-2"><Plus className="h-4 w-4"/>เพิ่ม PromptPay</button>
      <button onClick={() => setRows([...rows, blank('qr')])} className="secondary-button flex items-center gap-2"><Plus className="h-4 w-4"/>เพิ่ม QR Code (รูปภาพ)</button>
      <button onClick={() => setRows([...rows, blank('bank')])} className="secondary-button flex items-center gap-2"><Plus className="h-4 w-4"/>เพิ่มบัญชีธนาคาร</button>
      <button disabled={busy} onClick={save} className="primary-button ml-auto">บันทึกบัญชีรับเงิน</button>
    </div>
  </div>;
}
