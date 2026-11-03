// ระบบใบกำกับภาษี DocuFlow e-Tax (แอปจำลองในพื้นที่ใช้งานบนเว็บ)
import React, { useState } from 'react';
import { calculateTaxInvoice } from '../../../utils/pricing';

export function DocuFlowTaxApp() {
  const [taxClientName, setTaxClientName] = useState('บริษัท สยามโกลบอล เทรดดิ้ง จำกัด');
  const [taxClientTaxId, setTaxClientTaxId] = useState('0105564098211');
  const [taxBaseAmount, setTaxBaseAmount] = useState<number>(20000);
  const [taxIncludeVat, setTaxIncludeVat] = useState<boolean>(true);
  const [taxWhtRate, setTaxWhtRate] = useState<number>(3);
  const [signedTaxLedger, setSignedTaxLedger] = useState<
    { docNo: string; client: string; netAmount: number; signedHash: string }[]
  >([
    {
      docNo: 'TIV-2026-088',
      client: 'หจก. นอร์ทเทิร์น ซัพพลาย',
      netAmount: 15600,
      signedHash: 'ETAX-8820-TH',
    },
  ]);
  const taxCalculation = calculateTaxInvoice(taxBaseAmount, taxIncludeVat, taxWhtRate);

  const handleSignTaxDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxClientName.trim()) return;
    const nextNum = 89 + signedTaxLedger.length;
    setSignedTaxLedger((prev) => [
      {
        docNo: `TIV-2026-0${nextNum}`,
        client: taxClientName.trim(),
        netAmount: taxCalculation.netPayable,
        signedHash: `ETAX-${9100 + nextNum}-TH`,
      },
      ...prev,
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <form
        onSubmit={handleSignTaxDocument}
        className="lg:col-span-6 bg-white border border-stone-200 rounded-xl p-6 space-y-4"
      >
        <h2 className="text-base font-bold text-slate-900">
          สร้างและคำนวณใบกำกับภาษีอิเล็กทรอนิกส์ (e-Tax Invoice)
        </h2>

        <div>
          <label htmlFor="etax-client-name" className="block text-xs text-slate-600 mb-1">
            ชื่อบริษัทลูกค้า / ผู้รับบริการ
          </label>
          <input
            id="etax-client-name"
            type="text"
            value={taxClientName}
            onChange={(e) => setTaxClientName(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="etax-client-id" className="block text-xs text-slate-600 mb-1">
              เลขผู้เสียภาษี 13 หลัก
            </label>
            <input
              id="etax-client-id"
              type="text"
              value={taxClientTaxId}
              onChange={(e) => setTaxClientTaxId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="etax-base-amount" className="block text-xs text-slate-600 mb-1">
              มูลค่าบริการก่อนภาษี (บาท)
            </label>
            <input
              id="etax-base-amount"
              type="number"
              value={taxBaseAmount}
              onChange={(e) => setTaxBaseAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <span className="block text-xs text-slate-600 mb-1">ภาษีหัก ณ ที่จ่าย (WHT)</span>
            <div className="flex gap-1.5">
              {[0, 1, 3, 5].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setTaxWhtRate(rate)}
                  className={`flex-1 py-1.5 text-xs font-mono rounded-lg border ${
                    taxWhtRate === rate
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                      : 'border-stone-200 text-slate-600'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="block text-xs text-slate-600 mb-1">ภาษีมูลค่าเพิ่ม 7%</span>
            <button
              type="button"
              onClick={() => setTaxIncludeVat(!taxIncludeVat)}
              className="w-full py-1.5 px-3 text-xs font-medium rounded-lg border border-stone-200 bg-[#FAF9F5]"
            >
              {taxIncludeVat ? 'คำนวณรวม VAT 7%' : 'ยกเว้น VAT'}
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF9F5] border border-stone-200 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600">มูลค่าก่อนภาษี</span>
            <span className="font-mono">฿{taxCalculation.baseAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-blue-700">
            <span>บวก ภาษีมูลค่าเพิ่ม 7%</span>
            <span className="font-mono">+฿{taxCalculation.vatAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-amber-700">
            <span>หัก ภาษี ณ ที่จ่าย ({taxWhtRate}%)</span>
            <span className="font-mono">
              -฿{taxCalculation.withholdingAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-stone-200">
            <span>ยอดรับชำระสุทธิ</span>
            <span className="font-mono text-emerald-700">
              ฿{taxCalculation.netPayable.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          ประทับตราดิจิทัลและบันทึกเข้าสมุดทะเบียนคุม
        </button>
      </form>

      <div className="lg:col-span-6 bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          สมุดทะเบียนคุมเอกสารภาษีที่ลงนามแล้ว ({signedTaxLedger.length})
        </h3>
        <div className="space-y-2.5">
          {signedTaxLedger.map((doc) => (
            <div
              key={doc.docNo}
              className="p-4 rounded-xl border border-stone-200 bg-[#FAF9F5] flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-mono font-bold text-blue-700">{doc.docNo}</div>
                <div className="text-sm font-semibold text-slate-900">{doc.client}</div>
                <div className="text-xs font-mono text-emerald-700 mt-0.5">
                  Verified Seal: {doc.signedHash}
                </div>
              </div>
              <div className="text-right font-mono font-bold text-sm text-slate-900">
                ฿{doc.netAmount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
