import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, CheckCircle2, ArrowRight, KeyRound, ShieldCheck } from 'lucide-react';
import { CartItem, calculateCartSummary } from '../../utils/pricing';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (programId: string, licenseType: CartItem['licenseType'], delta: number) => void;
  onRemoveItem: (programId: string, licenseType: CartItem['licenseType']) => void;
  onClearCart: () => void;
  onCompleteOrderAndOpenWorkspace: (purchasedProgramIds: string[]) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCompleteOrderAndOpenWorkspace,
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [companyTaxId, setCompanyTaxId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'promptpay' | 'card' | 'transfer'>('promptpay');
  const [formError, setFormError] = useState<string | null>(null);

  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    totalPaid: number;
    licenseKeys: { name: string; key: string; typeLabel: string }[];
    programIds: string[];
  } | null>(null);

  if (!isOpen) return null;

  const summary = calculateCartSummary(items, appliedPromo);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setAppliedPromo('');
      setPromoFeedback(null);
      return;
    }
    const testSummary = calculateCartSummary(items, code);
    if (testSummary.appliedPromoCode) {
      setAppliedPromo(code);
      setPromoFeedback(`ใช้รหัสส่วนลด ${code} สำเร็จ (-฿${testSummary.promoDiscount.toLocaleString()})`);
    } else {
      setPromoFeedback('ไม่พบรหัสส่วนลดนี้ (ลองใช้รหัส LAUNCH20 หรือ VELOCE10)');
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!customerName.trim() || !customerEmail.trim() || !customerEmail.includes('@')) {
      setFormError('กรุณากรอกชื่อผู้สั่งซื้อและอีเมลที่ถูกต้องเพื่อรับรหัสเปิดใช้งาน');
      return;
    }

    setFormError(null);
    const generatedKeys = items.map((item, idx) => ({
      name: `${item.programName} (${item.thaiName})`,
      key: `VLC-2026-${item.programId.slice(0, 4).toUpperCase()}-${8490 + idx * 137}`,
      typeLabel:
        item.licenseType === 'monthly_cloud'
          ? `Cloud Subscription (${item.quantity} สิทธิ์)`
          : `Perpetual Desktop License (${item.quantity} เครื่อง)`,
    }));

    setConfirmedOrder({
      orderNumber: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      totalPaid: summary.grandTotal,
      licenseKeys: generatedKeys,
      programIds: items.map((i) => i.programId),
    });
    onClearCart();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="ตะกร้าสั่งซื้อโปรแกรมและออกใบอนุญาตใช้งาน"
    >
      <div className="relative w-full max-w-lg bg-white h-full border-l border-stone-200 flex flex-col justify-between overflow-y-auto">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-600/30 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white sticky top-0 z-10">
          <div>
            <h2 className="text-base font-extrabold text-white">
              {confirmedOrder ? 'ยืนยันคำสั่งซื้อและเปิดสิทธิ์สำเร็จ' : 'ตะกร้าสั่งซื้อโปรแกรม'}
            </h2>
            <p className="text-xs text-blue-100">
              {confirmedOrder
                ? `หมายเลขคำสั่งซื้อ ${confirmedOrder.orderNumber}`
                : 'ซื้อครบ 2 โปรแกรมขึ้นไป รับส่วนลดแพ็กคู่ 10% อัตโนมัติ'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmedOrder(null);
              onClose();
            }}
            aria-label="ปิดตะกร้าสินค้า"
            className="p-2 text-blue-100 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 flex-1 space-y-6">
          {confirmedOrder ? (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-base mb-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>ชำระเงินและเปิดสิทธิ์ Cloud Workspace เรียบร้อยแล้ว</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  ระบบได้จัดส่งใบกำกับภาษีและคู่มือการติดตั้งไปยัง {confirmedOrder.customerEmail} พร้อมเปิดสิทธิ์เข้าใช้งานโปรแกรมออนไลน์ให้คุณทันที
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-700">
                  รหัสใบอนุญาต (License Keys) และสิทธิ์การใช้งานของคุณ
                </h3>
                {confirmedOrder.licenseKeys.map((lic) => (
                  <div
                    key={lic.key}
                    className="p-4 rounded-xl border border-stone-200 bg-[#FAF9F5] flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{lic.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{lic.typeLabel}</div>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 shrink-0">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{lic.key}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl border border-stone-200 bg-white flex items-center justify-between text-sm">
                <span className="text-slate-600">ยอดชำระสุทธิ (รวม VAT 7%)</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  ฿{confirmedOrder.totalPaid.toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const ids = confirmedOrder.programIds;
                  setConfirmedOrder(null);
                  onCompleteOrderAndOpenWorkspace(ids);
                }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>เข้าสู่หน้า Cloud Workspace เพื่อใช้งานโปรแกรมทันที</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-800">
                ยังไม่มีรายการโปรแกรมในตะกร้า
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                คุณสามารถเลือกเช่าใช้โปรแกรมรายเดือนบนเว็บ หรือเลือกซื้อขาดสำหรับติดตั้งลงเครื่องได้จากหน้ารายการโปรแกรม
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                เลือกดูโปรแกรมในคลัง
              </button>
            </div>
          ) : (
            <>
              {/* Itemized List */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={`${item.programId}-${item.licenseType}`}
                    className="p-4 rounded-xl border border-stone-200 bg-[#FAF9F5]/60 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900">
                        {item.programName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.thaiName} ·{' '}
                        {item.licenseType === 'monthly_cloud'
                          ? 'Cloud รายเดือน'
                          : 'ซื้อขาดตลอดชีพ'}
                      </div>
                      <div className="text-xs font-mono font-semibold text-blue-700 pt-1">
                        ฿{item.unitPrice.toLocaleString()} / สิทธิ์
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center border border-stone-200 rounded-lg bg-white">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.programId, item.licenseType, -1)}
                          aria-label={`ลดจำนวน ${item.programName}`}
                          className="p-1.5 text-slate-600 hover:text-slate-900"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-mono font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.programId, item.licenseType, 1)}
                          aria-label={`เพิ่มจำนวน ${item.programName}`}
                          className="p-1.5 text-slate-600 hover:text-slate-900"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.programId, item.licenseType)}
                        aria-label={`ลบ ${item.programName} ออกจากตะกร้า`}
                        className="text-xs text-slate-400 hover:text-red-600 inline-flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบ</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Form */}
              <form onSubmit={handleApplyPromo} className="space-y-2">
                <label
                  htmlFor="cart-promo-input"
                  className="block text-xs font-medium text-slate-700"
                >
                  รหัสส่วนลดโปรโมชัน (ลองใส่ LAUNCH20)
                </label>
                <div className="flex gap-2">
                  <input
                    id="cart-promo-input"
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="กรอกรหัสส่วนลด เช่น LAUNCH20"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-blue-600 font-mono uppercase"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    ใช้รหัส
                  </button>
                </div>
                {promoFeedback && (
                  <p className="text-xs text-blue-700 font-medium">{promoFeedback}</p>
                )}
              </form>

              {/* Price Summary Breakdown */}
              <div className="p-4 rounded-xl border border-stone-200 bg-[#FAF9F5] space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>ยอดรวมก่อนส่วนลด</span>
                  <span className="font-mono tabular-nums">
                    ฿{summary.subtotal.toLocaleString()}
                  </span>
                </div>
                {summary.bundleDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>ส่วนลดแพ็กคู่ 2 โปรแกรมขึ้นไป (10%)</span>
                    <span className="font-mono tabular-nums">
                      -฿{summary.bundleDiscount.toLocaleString()}
                    </span>
                  </div>
                )}
                {summary.promoDiscount > 0 && (
                  <div className="flex justify-between text-blue-700 font-medium">
                    <span>ส่วนลดรหัส {summary.appliedPromoCode}</span>
                    <span className="font-mono tabular-nums">
                      -฿{summary.promoDiscount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                  <span className="font-mono tabular-nums">
                    ฿{summary.vatAmount.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-stone-200 pt-2.5 flex justify-between text-sm font-bold text-slate-900">
                  <span>ยอดชำระสุทธิ</span>
                  <span className="font-mono tabular-nums text-blue-700">
                    ฿{summary.grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Customer Verification & Checkout Form */}
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold text-slate-900">
                  ข้อมูลผู้รับใบอนุญาตใช้งานและใบกำกับภาษี
                </h3>
                <div>
                  <label
                    htmlFor="customer-name-input"
                    className="block text-xs text-slate-600 mb-1"
                  >
                    ชื่อ-นามสกุล หรือชื่อบริษัท *
                  </label>
                  <input
                    id="customer-name-input"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="เช่น บริษัท เวโลเซ่ คอมเมิร์ซ จำกัด"
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="customer-email-input"
                    className="block text-xs text-slate-600 mb-1"
                  >
                    อีเมลสำหรับรับ License Key และเข้าสู่ระบบ Cloud *
                  </label>
                  <input
                    id="customer-email-input"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@company.co.th"
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="customer-taxid-input"
                    className="block text-xs text-slate-600 mb-1"
                  >
                    เลขประจำตัวผู้เสียภาษี 13 หลัก (สำหรับออกใบกำกับภาษีเต็มรูป)
                  </label>
                  <input
                    id="customer-taxid-input"
                    type="text"
                    value={companyTaxId}
                    onChange={(e) => setCompanyTaxId(e.target.value)}
                    placeholder="01055XXXXXXXX (ไม่บังคับ)"
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div className="pt-1">
                  <span className="block text-xs text-slate-600 mb-1.5">ช่องทางชำระเงิน</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'promptpay', label: 'สแกน QR' },
                      { id: 'card', label: 'บัตรเครดิต' },
                      { id: 'transfer', label: 'โอนบัญชีบริษัท' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as typeof paymentMethod)}
                        className={`py-2 px-2.5 text-xs font-medium rounded-lg border transition-colors ${
                          paymentMethod === method.id
                            ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-semibold'
                            : 'border-stone-200 text-slate-600 hover:border-stone-300'
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {formError && (
                  <p className="text-xs text-red-600 font-medium">{formError}</p>
                )}

                <button
                  type="submit"
                  className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>ยืนยันการชำระเงิน ฿{summary.grandTotal.toLocaleString()}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
