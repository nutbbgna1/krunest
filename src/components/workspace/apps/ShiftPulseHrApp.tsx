// ระบบเงินเดือนและ OT ShiftPulse (แอปจำลองในพื้นที่ใช้งานบนเว็บ)
import React, { useState } from 'react';

export function ShiftPulseHrApp() {
  const [employees, setEmployees] = useState([
    { id: 'emp-1', name: 'ธนกฤต (หัวหน้าคลังสินค้า)', baseSalary: 28000, otHours: 12, otRate: 180 },
    { id: 'emp-2', name: 'นภัสสร (เจ้าหน้าที่ฝ่ายขาย)', baseSalary: 22000, otHours: 16, otRate: 150 },
    { id: 'emp-3', name: 'กิตติพงศ์ (นักออกแบบสื่อ)', baseSalary: 25000, otHours: 8, otRate: 160 },
  ]);
  const [payrollNotice, setPayrollNotice] = useState<string | null>(null);

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            ตารางคำนวณเงินเดือน ค่าล่วงเวลา (OT) และประกันสังคม 5%
          </h2>
          <p className="text-xs text-slate-500">
            ปรับจำนวนชั่วโมง OT เพื่อคำนวณยอดโอนสุทธิรายบุคคลแบบเรียลไทม์
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setPayrollNotice(
              'สร้างไฟล์โอนเงินเดือนธนาคาร (Batch Payroll) และจัดส่ง e-Payslip เรียบร้อยแล้ว'
            )
          }
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
        >
          อนุมัติจ่ายเงินเดือนและส่งสลิปออนไลน์
        </button>
      </div>

      {payrollNotice && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
          {payrollNotice}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-stone-200 bg-[#FAF9F5] text-slate-600 font-semibold">
              <th className="py-3 px-4">ชื่อพนักงาน</th>
              <th className="py-3 px-4 text-right">ฐานเงินเดือน</th>
              <th className="py-3 px-4 text-right">ชั่วโมง OT</th>
              <th className="py-3 px-4 text-right">ค่าล่วงเวลา</th>
              <th className="py-3 px-4 text-right">หัก สปส. (สูงสุด 750)</th>
              <th className="py-3 px-4 text-right">เงินได้สุทธิ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {employees.map((emp) => {
              const otPay = emp.otHours * emp.otRate;
              const sso = Math.min(750, Math.round(emp.baseSalary * 0.05));
              const netPay = emp.baseSalary + otPay - sso;
              return (
                <tr key={emp.id}>
                  <td className="py-3 px-4 font-semibold text-slate-900">{emp.name}</td>
                  <td className="py-3 px-4 text-right font-mono">
                    ฿{emp.baseSalary.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setEmployees((prev) =>
                            prev.map((e) =>
                              e.id === emp.id
                                ? { ...e, otHours: Math.max(0, e.otHours - 2) }
                                : e
                            )
                          )
                        }
                        className="px-2 py-0.5 bg-stone-100 rounded font-mono"
                      >
                        -2
                      </button>
                      <span className="font-mono font-bold w-8 text-center">
                        {emp.otHours}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEmployees((prev) =>
                            prev.map((e) =>
                              e.id === emp.id ? { ...e, otHours: e.otHours + 2 } : e
                            )
                          )
                        }
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-mono font-bold"
                      >
                        +2
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-blue-700">
                    +฿{otPay.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-red-600">
                    -฿{sso.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    ฿{netPay.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
