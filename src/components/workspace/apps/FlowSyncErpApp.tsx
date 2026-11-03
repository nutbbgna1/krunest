// ระบบคลังสินค้า FlowSync ERP (แอปจำลองในพื้นที่ใช้งานบนเว็บ)
import React, { useState } from 'react';
import { Plus, FileText } from 'lucide-react';

interface StockItem {
  sku: string;
  name: string;
  category: string;
  qty: number;
  minQty: number;
  unitPrice: number;
}

export function FlowSyncErpApp() {
  const [stockItems, setStockItems] = useState<StockItem[]>([
    {
      sku: 'SKU-1042',
      name: 'เมล็ดกาแฟอาราบิก้าคั่วกลาง 1 กก.',
      category: 'วัตถุดิบหลัก',
      qty: 148,
      minQty: 30,
      unitPrice: 650,
    },
    {
      sku: 'SKU-2089',
      name: 'แก้วเก็บความเย็นสแตนเลส 16oz',
      category: 'ภาชนะและอุปกรณ์',
      qty: 64,
      minQty: 25,
      unitPrice: 390,
    },
    {
      sku: 'SKU-3105',
      name: 'ผงมัทฉะเกรดพิธีชงชา 500 กรัม',
      category: 'วัตถุดิบหลัก',
      qty: 18,
      minQty: 20,
      unitPrice: 1250,
    },
  ]);
  const [newSkuName, setNewSkuName] = useState('');
  const [newSkuPrice, setNewSkuPrice] = useState('450');
  const [newSkuQty, setNewSkuQty] = useState('50');
  const [erpLastInvoice, setErpLastInvoice] = useState<string | null>(null);
  const handleAddStockSku = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkuName.trim()) return;
    const nextSku = `SKU-${4010 + stockItems.length}`;
    setStockItems((prev) => [
      ...prev,
      {
        sku: nextSku,
        name: newSkuName.trim(),
        category: 'สินค้าเพิ่มใหม่',
        qty: Math.max(1, Number(newSkuQty) || 10),
        minQty: 15,
        unitPrice: Math.max(1, Number(newSkuPrice) || 100),
      },
    ]);
    setNewSkuName('');
  };

  const handleAdjustStock = (sku: string, delta: number) => {
    setStockItems((prev) =>
      prev.map((item) =>
        item.sku === sku ? { ...item, qty: Math.max(0, item.qty + delta) } : item
      )
    );
  };

  const handleIssueErpInvoice = () => {
    const totalInventoryValue = stockItems.reduce((acc, i) => acc + i.unitPrice * 2, 0);
    const vat = Math.round(totalInventoryValue * 0.07);
    setErpLastInvoice(
      `ออกใบแจ้งหนี้ #INV-2026-${Math.floor(100 + Math.random() * 899)} ยอดรวม VAT ฿${(
        totalInventoryValue + vat
      ).toLocaleString()} และตัดสต็อกเรียบร้อย`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-stone-200">
          <div className="text-xs text-slate-500">รายการสินค้าในคลังทั้งหมด</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {stockItems.length} รายการ (SKUs)
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-stone-200">
          <div className="text-xs text-slate-500">จำนวนหน่วยคงเหลือรวม</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-blue-700 mt-1">
            {stockItems.reduce((sum, i) => sum + i.qty, 0).toLocaleString()} ชิ้น
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-stone-200">
          <div className="text-xs text-slate-500">มูลค่าคลังสินค้า (ราคาขาย)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            ฿
            {stockItems
              .reduce((sum, i) => sum + i.qty * i.unitPrice, 0)
              .toLocaleString()}
          </div>
        </div>
      </div>

      {/* Add SKU + Issue Invoice Bar */}
      <div className="p-5 rounded-xl bg-white border border-stone-200 flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-4">
        <form onSubmit={handleAddStockSku} className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor="erp-sku-name" className="block text-xs text-slate-600 mb-1">
              ชื่อสินค้าใหม่
            </label>
            <input
              id="erp-sku-name"
              type="text"
              value={newSkuName}
              onChange={(e) => setNewSkuName(e.target.value)}
              placeholder="เช่น ชาเอิร์ลเกรย์คัดพิเศษ 500g"
              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label htmlFor="erp-sku-price" className="block text-xs text-slate-600 mb-1">
              ราคาต่อหน่วย (บาท)
            </label>
            <input
              id="erp-sku-price"
              type="number"
              value={newSkuPrice}
              onChange={(e) => setNewSkuPrice(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มเข้าคลัง</span>
            </button>
          </div>
        </form>

        <button
          type="button"
          onClick={handleIssueErpInvoice}
          className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <FileText className="w-4 h-4" />
          <span>ออกใบแจ้งหนี้อัตโนมัติ (VAT 7%)</span>
        </button>
      </div>

      {erpLastInvoice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center justify-between">
          <span>{erpLastInvoice}</span>
          <button
            type="button"
            onClick={() => setErpLastInvoice(null)}
            className="text-emerald-700 underline ml-4"
          >
            รับทราบ
          </button>
        </div>
      )}

      {/* High-Density Inventory Data Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-[#FAF9F5] text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">รหัส SKU</th>
                <th className="py-3 px-4">ชื่อรายการสินค้า</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4 text-right">ราคา/หน่วย</th>
                <th className="py-3 px-4 text-right">คงเหลือ</th>
                <th className="py-3 px-4">สถานะจุดสั่งซื้อ</th>
                <th className="py-3 px-4 text-right">ปรับยอดสต็อกด่วน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-xs">
              {stockItems.map((item) => {
                const isLow = item.qty <= item.minQty;
                return (
                  <tr key={item.sku} className="hover:bg-stone-50/80">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {item.sku}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 text-slate-500">{item.category}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                      ฿{item.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                      {item.qty} ชิ้น
                    </td>
                    <td className="py-3 px-4">
                      {isLow ? (
                        <span className="text-amber-700 font-semibold">
                          ต่ำกว่าเกณฑ์ขั้นต่ำ ({item.minQty})
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">สต็อกปกติ</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(item.sku, -5)}
                          className="px-2 py-1 text-xs font-mono bg-stone-100 hover:bg-stone-200 rounded text-slate-700"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(item.sku, 10)}
                          className="px-2 py-1 text-xs font-mono bg-blue-50 hover:bg-blue-100 rounded text-blue-700 font-semibold"
                        >
                          +10
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
