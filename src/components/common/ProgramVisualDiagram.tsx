import React from 'react';
import { SoftwareProgram } from '../../data/programs';

interface ProgramVisualDiagramProps {
  diagramType: SoftwareProgram['diagramType'];
  compact?: boolean;
  activeStepIndex?: number;
}

export const ProgramVisualDiagram: React.FC<ProgramVisualDiagramProps> = ({
  diagramType,
  compact = false,
  activeStepIndex = 0,
}) => {
  const backdropStyles: Record<SoftwareProgram['diagramType'], string> = {
    'erp-flow': 'bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100',
    'photo-studio': 'bg-gradient-to-br from-rose-100 via-fuchsia-50 to-indigo-100',
    'omnichat-crm': 'bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100',
    'etax-ledger': 'bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100',
    'pos-smart': 'bg-gradient-to-br from-blue-100 via-indigo-50 to-violet-100',
    'payroll-hr': 'bg-gradient-to-br from-teal-100 via-emerald-50 to-lime-100',
  };

  return (
    <div
      className={`relative w-full overflow-hidden select-none ${backdropStyles[diagramType]} ${
        compact ? 'aspect-[16/10]' : 'aspect-[16/9]'
      }`}
    >
      {/* Decorative soft ambient light orbs */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/70 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-white/60 blur-2xl pointer-events-none" />

      {diagramType === 'erp-flow' && (
        <svg
          viewBox="0 0 480 300"
          className="relative z-10 w-full h-full p-4"
          role="img"
          aria-label="ภาพตัวอย่างโปรแกรมจัดการสต็อก FlowSync ERP"
        >
          <defs>
            <linearGradient id="erpBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
            <filter id="softShadow" x="-10%" y="-10%" width="120%" height="125%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Main App Window Mockup */}
          <g transform="translate(88, 22)" filter="url(#softShadow)">
            <rect x="0" y="0" width="356" height="236" rx="16" fill="#FFFFFF" />
            {/* Window Header */}
            <circle cx="18" cy="18" r="4.5" fill="#FCA5A5" />
            <circle cx="32" cy="18" r="4.5" fill="#FCD34D" />
            <circle cx="46" cy="18" r="4.5" fill="#6EE7B7" />
            <rect x="64" y="12" width="120" height="12" rx="6" fill="#F1F5F9" />
            <rect x="284" y="10" width="56" height="16" rx="8" fill="#DBEAFE" />
            <text x="296" y="21" fontSize="8.5" fontWeight="700" fill="#1D4ED8">
              LIVE SYNC
            </text>

            {/* Visual Chart Area */}
            <g transform="translate(20, 44)">
              <rect x="0" y="0" width="196" height="114" rx="12" fill="#F8FAFC" stroke="#E2E8F0" />
              <text x="14" y="22" fontSize="10" fontWeight="700" fill="#0F172A">
                ยอดสต็อกเข้า-ออกเรียลไทม์
              </text>
              {/* Animated-look Bar Chart */}
              <rect x="20" y="68" width="18" height="32" rx="4" fill="#BFDBFE" />
              <rect x="48" y="52" width="18" height="48" rx="4" fill="#93C5FD" />
              <rect x="76" y="38" width="18" height="62" rx="4" fill="url(#erpBar)" />
              <rect x="104" y="56" width="18" height="44" rx="4" fill="#93C5FD" />
              <rect x="132" y="30" width="18" height="70" rx="4" fill="url(#erpBar)" />
              <rect x="160" y="22" width="18" height="78" rx="4" fill="#1D4ED8" />
              {/* Trend curve */}
              <path
                d="M 28 65 Q 65 40, 85 36 T 140 28 T 170 18"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="170" cy="18" r="4" fill="#10B981" />
            </g>

            {/* Right KPI Ring Card */}
            <g transform="translate(228, 44)">
              <rect x="0" y="0" width="108" height="114" rx="12" fill="#EFF6FF" />
              <circle
                cx="54"
                cy="48"
                r="26"
                fill="none"
                stroke="#BFDBFE"
                strokeWidth="7"
              />
              <circle
                cx="54"
                cy="48"
                r="26"
                fill="none"
                stroke="#2563EB"
                strokeWidth="7"
                strokeDasharray="135 165"
                strokeLinecap="round"
              />
              <text x="38" y="52" fontSize="11" fontWeight="800" fill="#1E3A8A">
                99.9%
              </text>
              <text x="20" y="96" fontSize="9.5" fontWeight="700" fill="#1E40AF">
                สต็อกแม่นยำ
              </text>
            </g>

            {/* Bottom Visual Pipeline Strip */}
            <g transform="translate(20, 170)">
              <rect x="0" y="0" width="316" height="48" rx="10" fill="#F8FAFC" stroke="#E2E8F0" />
              <circle cx="24" cy="24" r="12" fill="#DBEAFE" />
              <text x="20" y="28" fontSize="10" fontWeight="700" fill="#1D4ED8">
                1
              </text>
              <text x="42" y="28" fontSize="10" fontWeight="700" fill="#0F172A">
                สแกนบาร์โค้ด
              </text>

              <path d="M 108 24 L 126 24" stroke="#94A3B8" strokeWidth="1.5" />

              <circle cx="142" cy="24" r="12" fill="#D1FAE5" />
              <text x="138" y="28" fontSize="10" fontWeight="700" fill="#047857">
                2
              </text>
              <text x="160" y="28" fontSize="10" fontWeight="700" fill="#0F172A">
                ตัดคลังทันที
              </text>

              <path d="M 218 24 L 234 24" stroke="#94A3B8" strokeWidth="1.5" />

              <rect x="240" y="11" width="66" height="26" rx="7" fill="#059669" />
              <text x="252" y="27" fontSize="9.5" fontWeight="700" fill="#FFFFFF">
                ออกบิล 7%
              </text>
            </g>
          </g>

          {/* Floating Barcode Scanner Badge (Left Overlay) */}
          <g transform="translate(20, 88)" filter="url(#softShadow)">
            <rect
              x="0"
              y="0"
              width="112"
              height="104"
              rx="14"
              fill="#0F172A"
              stroke={activeStepIndex === 0 ? '#38BDF8' : '#334155'}
              strokeWidth="2"
            />
            <rect x="16" y="18" width="80" height="44" rx="6" fill="#FFFFFF" />
            <path
              d="M24 26v28M30 26v28M34 26v28M42 26v28M48 26v28M54 26v28M62 26v28M68 26v28M76 26v28M84 26v28"
              stroke="#0F172A"
              strokeWidth="2.2"
            />
            <line x1="12" y1="40" x2="100" y2="40" stroke="#EF4444" strokeWidth="2" />
            <text x="20" y="84" fontSize="10" fontWeight="700" fill="#38BDF8">
              SKU-1042 ✓
            </text>
          </g>
        </svg>
      )}

      {diagramType === 'photo-studio' && (
        <svg
          viewBox="0 0 480 300"
          className="relative z-10 w-full h-full p-4"
          role="img"
          aria-label="ภาพตัวอย่างโปรแกรมไดคัทสินค้า PixelCraft Studio"
        >
          <defs>
            <linearGradient id=" bottleGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <pattern id="checker" width="16" height="16" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#F1F5F9" />
              <rect x="8" width="8" height="8" fill="#FFFFFF" />
              <rect y="8" width="8" height="8" fill="#FFFFFF" />
              <rect x="8" y="8" width="8" height="8" fill="#F1F5F9" />
            </pattern>
          </defs>

          {/* Main Studio Split Comparison Frame */}
          <g transform="translate(46, 22)" filter="url(#softShadow)">
            <rect x="0" y="0" width="388" height="248" rx="18" fill="#FFFFFF" />

            {/* Left Half: Raw Photo with Checkerboard Cutout */}
            <g transform="translate(16, 16)">
              <rect x="0" y="0" width="168" height="176" rx="12" fill="url(#checker)" stroke="#E2E8F0" />
              <rect x="10" y="10" width="64" height="20" rx="6" fill="#0F172A" opacity="0.75" />
              <text x="20" y="23" fontSize="9" fontWeight="700" fill="#FFFFFF">
                BEFORE
              </text>
              {/* Dashed AI detection lasso */}
              <circle
                cx="84"
                cy="96"
                r="52"
                fill="none"
                stroke="#6366F1"
                strokeWidth="2"
                strokeDasharray="5 4"
              />
              {/* Product Silhouette */}
              <rect x="70" y="50" width="28" height="14" rx="4" fill="#334155" />
              <rect x="56" y="64" width="56" height="72" rx="16" fill="#94A3B8" />
            </g>

            {/* Right Half: Studio Lit Final Product */}
            <g transform="translate(204, 16)">
              <rect x="0" y="0" width="168" height="176" rx="12" fill="#FDF2F8" stroke="#FBCFE8" />
              <rect x="10" y="10" width="76" height="20" rx="6" fill="#EC4899" />
              <text x="18" y="23" fontSize="9" fontWeight="700" fill="#FFFFFF">
                AI STUDIO ✨
              </text>

              {/* Pedestal & Glow */}
              <circle cx="84" cy="96" r="46" fill="#FFFFFF" opacity="0.9" />
              <ellipse cx="84" cy="144" rx="38" ry="8" fill="#F472B6" opacity="0.35" />

              {/* High-Craft Bottle Product */}
              <rect x="70" y="48" width="28" height="14" rx="4" fill="#1E1B4B" />
              <rect x="56" y="62" width="56" height="76" rx="16" fill="url(# bottleGrad)" />
              <rect x="66" y="80" width="36" height="36" rx="6" fill="#FFFFFF" />
              <circle cx="84" cy="98" r="8" fill="#F43F5E" />
            </g>

            {/* Center Split Slider Handle */}
            <line x1="194" y1="16" x2="194" y2="192" stroke="#6366F1" strokeWidth="2.5" />
            <circle cx="194" cy="104" r="14" fill="#6366F1" />
            <path d="M189 104l-3 3 3 3M199 104l3 3-3 3" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />

            {/* Bottom Studio Swatch & Batch Counter Bar */}
            <g transform="translate(16, 204)">
              <circle cx="16" cy="14" r="10" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
              <circle cx="42" cy="14" r="10" fill="#FCE7F3" stroke="#EC4899" strokeWidth="2" />
              <circle cx="68" cy="14" r="10" fill="#E0E7FF" stroke="#6366F1" />
              <circle cx="94" cy="14" r="10" fill="#FEF3C7" stroke="#F59E0B" />

              <rect x="232" y="2" width="124" height="26" rx="8" fill="#1E1B4B" />
              <text x="246" y="18" fontSize="9.5" fontWeight="700" fill="#FFFFFF">
                500 รูป เสร็จใน 1 คลิก
              </text>
            </g>
          </g>
        </svg>
      )}

      {diagramType === 'omnichat-crm' && (
        <svg
          viewBox="0 0 480 300"
          className="relative z-10 w-full h-full p-4"
          role="img"
          aria-label="ภาพตัวอย่างระบบรวมแชทลูกค้า PulseCRM"
        >
          {/* Main Chat & Conversion Board */}
          <g transform="translate(36, 22)" filter="url(#softShadow)">
            <rect x="0" y="0" width="408" height="248" rx="18" fill="#FFFFFF" />

            {/* Left Channel Icons Column */}
            <g transform="translate(14, 16)">
              <rect x="0" y="0" width="48" height="216" rx="12" fill="#F0FDF4" />
              <circle cx="24" cy="28" r="14" fill="#10B981" />
              <text x="14" y="32" fontSize="8.5" fontWeight="800" fill="#FFFFFF">
                LINE
              </text>
              <circle cx="24" cy="68" r="14" fill="#3B82F6" />
              <text x="17" y="72" fontSize="8.5" fontWeight="800" fill="#FFFFFF">
                FB
              </text>
              <circle cx="24" cy="108" r="14" fill="#EC4899" />
              <text x="18" y="112" fontSize="8.5" fontWeight="800" fill="#FFFFFF">
                IG
              </text>
              <circle cx="24" cy="186" r="12" fill="#D1FAE5" />
            </g>

            {/* Center Visual Chat Stream */}
            <g transform="translate(76, 16)">
              <rect x="0" y="0" width="194" height="216" rx="12" fill="#F8FAFC" stroke="#E2E8F0" />
              {/* Customer Header */}
              <circle cx="24" cy="24" r="12" fill="#FDE68A" />
              <text x="42" y="22" fontSize="10" fontWeight="700" fill="#0F172A">
                คุณพิมพ์ชนก · VIP
              </text>
              <text x="42" y="34" fontSize="8.5" fill="#059669" fontWeight="600">
                ตอบกลับใน 12 วินาที
              </text>

              {/* Incoming Bubble */}
              <rect x="12" y="50" width="136" height="34" rx="10" fill="#FFFFFF" stroke="#E2E8F0" />
              <text x="22" y="70" fontSize="9.5" fontWeight="600" fill="#334155">
                รับชุดกาแฟคั่วกลาง 5 ถุงค่ะ
              </text>

              {/* Outgoing Order Card Bubble */}
              <rect x="34" y="96" width="148" height="66" rx="12" fill="#059669" />
              <text x="46" y="116" fontSize="9.5" fontWeight="700" fill="#FFFFFF">
                บิล #INV-884 · ฿3,745
              </text>
              <rect x="46" y="128" width="124" height="22" rx="6" fill="#FFFFFF" />
              <text x="66" y="142" fontSize="9" fontWeight="700" fill="#047857">
                ชำระเงินสำเร็จ ✓
              </text>

              {/* Bottom input bar */}
              <rect x="12" y="178" width="170" height="26" rx="8" fill="#FFFFFF" stroke="#CBD5E1" />
              <circle cx="168" cy="191" r="9" fill="#2563EB" />
            </g>

            {/* Right Conversion Funnel Card */}
            <g transform="translate(282, 16)">
              <rect x="0" y="0" width="112" height="216" rx="12" fill="#ECFDF5" />
              <text x="14" y="24" fontSize="9.5" fontWeight="700" fill="#065F46">
                ยอดขายจากแชท
              </text>
              <text x="14" y="48" fontSize="17" fontWeight="800" fill="#059669">
                ฿148K
              </text>
              <rect x="14" y="60" width="58" height="18" rx="6" fill="#10B981" />
              <text x="22" y="72" fontSize="8.5" fontWeight="700" fill="#FFFFFF">
                +28% ปิดบิล
              </text>

              {/* Visual Funnel Bars */}
              <rect x="14" y="102" width="84" height="22" rx="6" fill="#FFFFFF" />
              <rect x="14" y="102" width="76" height="22" rx="6" fill="#6EE7B7" />

              <rect x="14" y="134" width="84" height="22" rx="6" fill="#FFFFFF" />
              <rect x="14" y="134" width="62" height="22" rx="6" fill="#34D399" />

              <rect x="14" y="166" width="84" height="22" rx="6" fill="#FFFFFF" />
              <rect x="14" y="166" width="52" height="22" rx="6" fill="#059669" />
            </g>
          </g>
        </svg>
      )}

      {diagramType === 'etax-ledger' && (
        <svg
          viewBox="0 0 480 300"
          className="relative z-10 w-full h-full p-4"
          role="img"
          aria-label="ภาพตัวอย่างโปรแกรมใบกำกับภาษีอิเล็กทรอนิกส์ DocuFlow e-Tax"
        >
          {/* Floating Paper Invoice + Verified Digital Seal */}
          <g transform="translate(64, 20)" filter="url(#softShadow)">
            <rect x="0" y="0" width="248" height="254" rx="16" fill="#FFFFFF" />
            {/* Gold Header Strip */}
            <rect x="0" y="0" width="248" height="48" rx="16" fill="#FFFBEB" />
            <rect x="18" y="14" width="86" height="20" rx="6" fill="#F59E0B" />
            <text x="28" y="27" fontSize="9.5" fontWeight="800" fill="#FFFFFF">
              e-TAX INVOICE
            </text>
            <text x="164" y="28" fontSize="10" fontFamily="monospace" fontWeight="700" fill="#92400E">
              #TIV-2026
            </text>

            {/* Visual Invoice Lines */}
            <rect x="20" y="68" width="120" height="10" rx="5" fill="#E2E8F0" />
            <rect x="20" y="86" width="84" height="8" rx="4" fill="#F1F5F9" />

            <rect x="20" y="112" width="208" height="32" rx="8" fill="#F8FAFC" />
            <text x="30" y="132" fontSize="10" fontWeight="700" fill="#334155">
              VAT 7% + หัก ณ ที่จ่าย 3%
            </text>

            <rect x="20" y="156" width="208" height="36" rx="8" fill="#EFF6FF" />
            <text x="30" y="178" fontSize="11" fontWeight="700" fill="#1D4ED8">
              ยอดสุทธิ ฿20,800.00
            </text>

            <rect x="20" y="208" width="110" height="26" rx="7" fill="#0F172A" />
            <text x="34" y="224" fontSize="9.5" fontWeight="700" fill="#FFFFFF">
              ส่ง PDF ทันที
            </text>
          </g>

          {/* Overlapping Verified Digital Stamp Badge */}
          <g transform="translate(268, 72)" filter="url(#softShadow)">
            <rect x="0" y="0" width="152" height="164" rx="20" fill="#0F172A" />
            <circle cx="76" cy="64" r="36" fill="#10B981" />
            <path
              d="M62 64l10 10 20-20"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text x="32" y="122" fontSize="11" fontWeight="700" fill="#FFFFFF">
              ลงนามดิจิทัลแล้ว
            </text>
            <text x="36" y="140" fontSize="9" fontFamily="monospace" fill="#6EE7B7">
              SHA-256 VERIFIED
            </text>
          </g>
        </svg>
      )}

      {diagramType === 'pos-smart' && (
        <svg
          viewBox="0 0 480 300"
          className="relative z-10 w-full h-full p-4"
          role="img"
          aria-label="ภาพตัวอย่างโปรแกรมขายหน้าร้าน Veloce POS"
        >
          <g transform="translate(44, 24)" filter="url(#softShadow)">
            <rect x="0" y="0" width="392" height="246" rx="18" fill="#FFFFFF" />

            {/* Left Touch Tiles */}
            <g transform="translate(18, 18)">
              <rect x="0" y="0" width="108" height="96" rx="12" fill="#EFF6FF" stroke="#BFDBFE" />
              <circle cx="54" cy="38" r="20" fill="#3B82F6" />
              <text x="24" y="78" fontSize="10" fontWeight="700" fill="#1E3A8A">
                อเมริกาโน่ · ฿75
              </text>

              <rect x="120" y="0" width="108" height="96" rx="12" fill="#FEF3C7" stroke="#FDE68A" />
              <circle cx="174" cy="38" r="20" fill="#F59E0B" />
              <text x="144" y="78" fontSize="10" fontWeight="700" fill="#92400E">
                ครัวซองต์ · ฿85
              </text>

              <rect x="0" y="108" width="108" height="96" rx="12" fill="#ECFDF5" stroke="#A7F3D0" />
              <circle cx="54" cy="146" r="20" fill="#10B981" />
              <text x="26" y="186" fontSize="10" fontWeight="700" fill="#065F46">
                มัทฉะลาเต้ · ฿95
              </text>

              <rect x="120" y="108" width="108" height="96" rx="12" fill="#F3E8FF" stroke="#E9D5FF" />
              <circle cx="174" cy="146" r="20" fill="#8B5CF6" />
              <text x="142" y="186" fontSize="10" fontWeight="700" fill="#5B21B6">
                เค้กเบเกอรี่ · ฿115
              </text>
            </g>

            {/* Right QR Checkout Card */}
            <g transform="translate(262, 18)">
              <rect x="0" y="0" width="112" height="204" rx="14" fill="#0F172A" />
              <rect x="18" y="20" width="76" height="76" rx="10" fill="#FFFFFF" />
              <rect x="28" y="30" width="22" height="22" rx="3" fill="#0F172A" />
              <rect x="62" y="30" width="22" height="22" rx="3" fill="#0F172A" />
              <rect x="28" y="64" width="22" height="22" rx="3" fill="#0F172A" />
              <rect x="56" y="58" width="28" height="28" rx="4" fill="#2563EB" />

              <text x="22" y="122" fontSize="10" fontWeight="700" fill="#93C5FD">
                สแกนจ่าย QR
              </text>
              <text x="22" y="146" fontSize="16" fontWeight="800" fill="#FFFFFF">
                ฿255.00
              </text>
              <rect x="14" y="162" width="84" height="26" rx="8" fill="#10B981" />
              <text x="26" y="178" fontSize="9.5" fontWeight="700" fill="#FFFFFF">
                รับเงินทันที ✓
              </text>
            </g>
          </g>
        </svg>
      )}

      {diagramType === 'payroll-hr' && (
        <svg
          viewBox="0 0 480 300"
          className="relative z-10 w-full h-full p-4"
          role="img"
          aria-label="ภาพตัวอย่างโปรแกรมเงินเดือนและตารางกะ ShiftPulse HR"
        >
          <g transform="translate(48, 26)" filter="url(#softShadow)">
            <rect x="0" y="0" width="384" height="242" rx="18" fill="#FFFFFF" />

            {/* Top Summary Banner */}
            <rect x="18" y="18" width="348" height="58" rx="12" fill="#ECFDF5" />
            <text x="34" y="42" fontSize="10" fontWeight="700" fill="#047857">
              คำนวณเงินเดือน + OT + ประกันสังคม 5% อัตโนมัติ
            </text>
            <text x="34" y="62" fontSize="16" fontWeight="800" fill="#065F46">
              โอนเข้าบัญชีครบ 100 คน ใน 3 วินาที
            </text>

            {/* 2 Visual Payslip Cards */}
            <g transform="translate(18, 92)">
              <rect x="0" y="0" width="168" height="130" rx="12" fill="#F8FAFC" stroke="#E2E8F0" />
              <circle cx="28" cy="28" r="14" fill="#BFDBFE" />
              <text x="50" y="26" fontSize="10" fontWeight="700" fill="#0F172A">
                ธนกฤต · หัวหน้าคลัง
              </text>
              <text x="50" y="40" fontSize="9" fill="#2563EB" fontWeight="600">
                OT +฿3,450
              </text>
              <rect x="14" y="84" width="140" height="32" rx="8" fill="#059669" />
              <text x="32" y="104" fontSize="10.5" fontWeight="700" fill="#FFFFFF">
                รับสุทธิ ฿30,700
              </text>

              <rect x="180" y="0" width="168" height="130" rx="12" fill="#F8FAFC" stroke="#E2E8F0" />
              <circle cx="208" cy="28" r="14" fill="#FDE68A" />
              <text x="230" y="26" fontSize="10" fontWeight="700" fill="#0F172A">
                นภัสสร · ฝ่ายขาย
              </text>
              <text x="230" y="40" fontSize="9" fill="#2563EB" fontWeight="600">
                OT +฿4,800
              </text>
              <rect x="194" y="84" width="140" height="32" rx="8" fill="#0F172A" />
              <text x="212" y="104" fontSize="10.5" fontWeight="700" fill="#FFFFFF">
                รับสุทธิ ฿26,050
              </text>
            </g>
          </g>
        </svg>
      )}
    </div>
  );
};
