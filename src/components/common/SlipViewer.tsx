import React, { useEffect, useState } from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface Slip { file_name: string; mime_type: string; size: number; data: string; uploaded_at: string }
export interface SlipOrder { id: number; reference: string; name: string; email: string; target_id: string; amount: number; status: string }

// data: URLs cannot be opened in a new tab by modern browsers, so the slip is shown inside the page instead
// (images use the data URL directly because the CSP allows img data:; PDFs go through a blob: URL in an iframe).
const toBlobUrl = (dataUrl: string, mime: string) => {
  const raw = dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : dataUrl;
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
};

export function SlipViewer({ order, base, busy, onClose, onDecide }: { order: SlipOrder; base: '/sales' | '/admin'; busy: boolean; onClose: () => void; onDecide: (decision: 'approve' | 'reject', reason?: string) => void }) {
  const [slip, setSlip] = useState<Slip | null>(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('หลักฐานไม่ถูกต้อง กรุณาส่งใหม่');
  useEffect(() => {
    let created = '';
    api<Slip>(`${base}/orders/${order.id}/slip`).then((result) => { setSlip(result); if (result.mime_type === 'application/pdf') created = toBlobUrl(result.data, result.mime_type); setUrl(created || result.data); }).catch((e) => setError((e as Error).message));
    return () => { if (created) URL.revokeObjectURL(created); };
  }, [order.id, base]);
  const open = ['pending', 'reviewing'].includes(order.status);
  return <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label={`หลักฐานการชำระเงิน ${order.reference}`}>
    <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div><div className="font-mono text-xs text-slate-400">{order.reference}</div><h2 className="text-xl font-black">{order.name}</h2><div className="text-xs text-slate-500">{order.email} · {order.target_id}</div></div>
        <div className="text-right"><div className="text-xs text-slate-500">ยอดที่ต้องได้รับ</div><div className="text-2xl font-black text-blue-700">฿{order.amount.toLocaleString()}</div></div>
        <button onClick={onClose} aria-label="ปิด" className="rounded-full bg-slate-100 p-2"><X className="h-4 w-4"/></button>
      </div>
      <div className="grid min-h-[260px] place-items-center bg-slate-50 p-4">
        {error ? <div className="text-sm text-rose-600">{error}</div>
          : !slip ? <div className="text-sm text-slate-400">กำลังโหลดหลักฐาน…</div>
          : slip.mime_type === 'application/pdf' ? <iframe title="สลิป PDF" src={url} className="h-[60vh] w-full rounded-xl border bg-white"/>
          : <img src={url} alt={`สลิปของ ${order.name}`} className="max-h-[60vh] max-w-full rounded-xl border bg-white object-contain"/>}
      </div>
      {slip && <div className="px-5 pt-3 text-xs text-slate-500">{slip.file_name} · {Math.round(slip.size / 1024)} KB · ส่งเมื่อ {new Date(slip.uploaded_at).toLocaleString('th-TH')}</div>}
      <div className="p-5">
        {!open ? <div className="text-sm text-slate-500">รายการนี้ตรวจแล้ว (สถานะ {order.status})</div>
          : rejecting ? <div className="space-y-3"><input value={reason} onChange={(e) => setReason(e.target.value)} className="form-field mt-0" aria-label="เหตุผลที่ไม่ผ่าน"/><div className="flex gap-2"><button disabled={busy || !reason.trim()} onClick={() => onDecide('reject', reason.trim())} className="mini-button bg-rose-600 px-4 py-2 text-white">ยืนยันไม่ผ่าน</button><button onClick={() => setRejecting(false)} className="secondary-button">ยกเลิก</button></div></div>
          : <div className="flex flex-wrap gap-2"><button disabled={busy || !slip} onClick={() => onDecide('approve')} className="primary-button flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/>อนุมัติและออกใบเสร็จ</button><button disabled={busy} onClick={() => setRejecting(true)} className="secondary-button flex items-center gap-2 text-rose-700"><XCircle className="h-4 w-4"/>ไม่ผ่าน</button></div>}
      </div>
    </div>
  </div>;
}
