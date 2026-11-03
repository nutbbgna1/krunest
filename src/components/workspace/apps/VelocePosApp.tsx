// ระบบขายหน้าร้าน Veloce POS (แอปจำลองในพื้นที่ใช้งานบนเว็บ)
import React, { useState } from 'react';

export function VelocePosApp() {
  const [posCart, setPosCart] = useState<{ name: string; price: number; qty: number }[]>([
    { name: 'เอสเพรสโซ่เย็น', price: 75, qty: 2 },
    { name: 'ครัวซองต์เนยสดฝรั่งเศส', price: 85, qty: 1 },
  ]);
  const [posMemberPhone, setPosMemberPhone] = useState('089-452-9911');
  const [posReceiptNotice, setPosReceiptNotice] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          กดเลือกสินค้าเพื่อทำรายการขายหน้าร้าน
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { name: 'เอสเพรสโซ่เย็น', price: 75 },
            { name: 'ครัวซองต์เนยสดฝรั่งเศส', price: 85 },
            { name: 'มัทฉะลาเต้พรีเมียม', price: 95 },
            { name: 'เมล็ดกาแฟคั่วกลาง 250g', price: 320 },
            { name: 'ช็อกโกแลตซิกเนเจอร์', price: 80 },
            { name: 'เค้กแครอทครีมชีส', price: 115 },
          ].map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => {
                setPosCart((prev) => {
                  const existing = prev.find((i) => i.name === item.name);
                  if (existing) {
                    return prev.map((i) =>
                      i.name === item.name ? { ...i, qty: i.qty + 1 } : i
                    );
                  }
                  return [...prev, { ...item, qty: 1 }];
                });
              }}
              className="p-4 rounded-xl border border-stone-200 bg-[#FAF9F5] hover:border-blue-600 text-left transition-colors"
            >
              <div className="text-xs font-semibold text-slate-900">{item.name}</div>
              <div className="text-sm font-mono font-bold text-blue-700 mt-1">
                ฿{item.price}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-6 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-3">รายการท้ายบิลปัจจุบัน</h3>
          <div className="mb-3">
            <label htmlFor="pos-member-phone" className="block text-xs text-slate-500 mb-1">
              เบอร์โทรสมาชิกสะสมแต้ม (ลดท้ายบิล ฿20)
            </label>
            <input
              id="pos-member-phone"
              type="text"
              value={posMemberPhone}
              onChange={(e) => setPosMemberPhone(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono border border-stone-200 rounded-lg"
            />
          </div>
          <div className="space-y-2 border-t border-stone-200 pt-3">
            {posCart.map((c) => (
              <div key={c.name} className="flex justify-between text-xs">
                <span>
                  {c.qty}x {c.name}
                </span>
                <span className="font-mono font-semibold">฿{c.qty * c.price}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 border-t border-stone-200 pt-3">
          <div className="flex justify-between text-sm font-bold text-slate-900">
            <span>ยอดรับชำระสุทธิ</span>
            <span className="font-mono text-blue-700">
              ฿
              {Math.max(
                0,
                posCart.reduce((s, i) => s + i.qty * i.price, 0) -
                  (posMemberPhone.trim() ? 20 : 0)
              ).toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPosReceiptNotice('รับชำระเงินและตัดสต็อกหน้าร้านเรียบร้อยแล้ว');
              setPosCart([]);
            }}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
          >
            รับชำระเงินและพิมพ์ใบเสร็จ
          </button>
          {posReceiptNotice && (
            <p className="text-xs text-emerald-700 font-medium">{posReceiptNotice}</p>
          )}
        </div>
      </div>
    </div>
  );
}
