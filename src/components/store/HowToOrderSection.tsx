// ส่วนขั้นตอนการสั่งซื้อ (ข้อความแต่ละขั้นอยู่ที่ data/orderSteps.ts)
import React from 'react';
import { ORDER_STEPS } from '../../data/orderSteps';

export function HowToOrderSection() {
  return (
    <section id="how-to-order" className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
        <div className="inline-block text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-md">
          HOW TO ORDER & USE · ขั้นตอนการสั่งซื้อและใช้งาน
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          ขั้นตอนการรับสิทธิ์เมื่อโปรแกรมเปิดให้บริการ
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {ORDER_STEPS.map((item) => (
          <div
            key={item.step}
            className={`${item.cardBg} p-5 rounded-2xl border-2 shadow-sm space-y-2.5 hover:shadow-md transition-all`}
          >
            <div
              className={`w-10 h-10 rounded-xl ${item.badgeBg} font-mono font-bold text-sm flex items-center justify-center shadow-sm`}
            >
              {item.step}
            </div>
            <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
