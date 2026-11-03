// สตูดิโอแต่งภาพสินค้า PixelCraft (แอปจำลองในพื้นที่ใช้งานบนเว็บ)
import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export function PixelCraftStudioApp() {
  const [studioBackdrop, setStudioBackdrop] = useState<'alabaster' | 'marble' | 'oak' | 'cobalt'>(
    'alabaster'
  );
  const [studioPadding, setStudioPadding] = useState<number>(20);
  const [studioShadow, setStudioShadow] = useState<boolean>(true);
  const [batchExportCount, setBatchExportCount] = useState<number>(12);
  const [exportStatusText, setExportStatusText] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Studio Canvas Preview (7 cols) */}
      <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              หน้าจอจำลองไฟสตูดิโอและฉากหลังสินค้า (Batch Preview)
            </h2>
            <p className="text-xs text-slate-500">
              การตั้งค่านี้จะถูกนำไปใช้กับภาพสินค้าทั้งหมดในคิวงาน ({batchExportCount} ภาพ)
            </p>
          </div>
          <span className="text-xs font-mono text-blue-700">1200 × 1200 px (1:1)</span>
        </div>

        <div
          className={`w-full aspect-[4/3] rounded-xl border border-stone-200 flex items-center justify-center transition-all ${
            studioBackdrop === 'alabaster'
              ? 'bg-[#F7F5EE]'
              : studioBackdrop === 'marble'
              ? 'bg-gradient-to-br from-slate-100 via-white to-stone-200'
              : studioBackdrop === 'oak'
              ? 'bg-[#EFE6D5]'
              : 'bg-[#EFF6FF]'
          }`}
        >
          <div
            className="bg-white/90 border border-stone-200/80 rounded-2xl flex flex-col items-center justify-center transition-all"
            style={{
              padding: `${studioPadding}px`,
              boxShadow: studioShadow
                ? '0 22px 38px -12px rgba(15, 23, 42, 0.18)'
                : 'none',
            }}
          >
            {/* Vector Product Illustration inside live studio */}
            <svg className="w-40 h-40" viewBox="0 0 160 160">
              <ellipse
                cx="80"
                cy="138"
                rx="42"
                ry="8"
                fill={studioShadow ? '#CBD5E1' : 'transparent'}
              />
              <rect x="64" y="24" width="32" height="16" rx="4" fill="#0F172A" />
              <rect x="46" y="40" width="68" height="94" rx="18" fill="#2563EB" />
              <rect x="56" y="60" width="48" height="46" rx="6" fill="#FFFFFF" />
              <text x="64" y="82" fontSize="9" fontWeight="700" fill="#0F172A">
                VELOCE
              </text>
              <text x="64" y="95" fontSize="7.5" fill="#475569">
                STUDIO SERUM
              </text>
            </svg>
            <span className="text-[11px] font-mono text-slate-500 mt-2">
              ไดคัทขอบคมชัด · เว้นระยะขอบ {studioPadding}px
            </span>
          </div>
        </div>
      </div>

      {/* Studio Controls (5 cols) */}
      <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-slate-900">ตั้งค่าการประมวลผลภาพยกเซ็ต</h3>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">
            เลือกโทนฉากหลังสตูดิโอ
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'alabaster', label: 'ขาวอลาบาสเตอร์' },
              { id: 'marble', label: 'หินอ่อนคาร์รารา' },
              { id: 'oak', label: 'ไม้โอ๊คธรรมชาติ' },
              { id: 'cobalt', label: 'ฟ้าสตูดิโอคลีน' },
            ].map((bg) => (
              <button
                key={bg.id}
                type="button"
                onClick={() => setStudioBackdrop(bg.id as typeof studioBackdrop)}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-left transition-colors ${
                  studioBackdrop === bg.id
                    ? 'border-blue-600 bg-blue-50/50 text-blue-800 font-semibold'
                    : 'border-stone-200 text-slate-700 hover:border-stone-300'
                }`}
              >
                {bg.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="studio-padding-range"
            className="flex justify-between text-xs font-medium text-slate-700 mb-1.5"
          >
            <span>ระยะขอบรอบสินค้า (Margin Padding)</span>
            <span className="font-mono">{studioPadding} px</span>
          </label>
          <input
            id="studio-padding-range"
            type="range"
            min={8}
            max={44}
            value={studioPadding}
            onChange={(e) => setStudioPadding(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>

        <div className="flex items-center justify-between py-2 border-y border-stone-200">
          <span className="text-xs font-medium text-slate-700">
            เปิดเงาตกกระทบพื้นผิวธรรมชาติ (Soft Drop Shadow)
          </span>
          <button
            type="button"
            onClick={() => setStudioShadow(!studioShadow)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              studioShadow
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-200 text-slate-700'
            }`}
          >
            {studioShadow ? 'เปิดใช้งาน' : 'ปิด'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setBatchExportCount((c) => c + 12);
            setExportStatusText(
              `ประมวลผลและไดคัทภาพสินค้าทั้ง ${batchExportCount} รูปสำเร็จ พร้อมดาวน์โหลด ZIP`
            );
          }}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>เริ่มประมวลผลภาพยกเซ็ต ({batchExportCount} รูป)</span>
        </button>

        {exportStatusText && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
            {exportStatusText}
          </div>
        )}
      </div>
    </div>
  );
}
