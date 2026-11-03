// การ์ดโปรแกรม 1 ใบในคลังระบบงาน (สี/ราคา/ป้าย มาจาก data/programMeta.ts)
import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Play, Eye, Check, QrCode, Lock, Unlock } from 'lucide-react';
import { SoftwareProgram } from '../../data/programs';
import { PROGRAM_META } from '../../data/programMeta';
import { CartItem } from '../../utils/pricing';
import { ProgramVisualDiagram } from '../common/ProgramVisualDiagram';
import { OrderTarget } from '../modals/QuickOrderModal';

export interface ProgramCardProps {
  program: SoftwareProgram;
  isUnlocked: boolean;
  onInspect: (program: SoftwareProgram) => void;
  onLaunch: (programId: string) => void;
  onOrder: (target: OrderTarget) => void;
  onAddToCart: (program: SoftwareProgram, licenseType: CartItem['licenseType']) => void;
}

export function ProgramCard({ program, isUnlocked, onInspect, onLaunch, onOrder, onAddToCart }: ProgramCardProps) {
  const meta = PROGRAM_META[program.id];

  return (
    <motion.article
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl border-2 transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl ${
        isUnlocked
          ? 'border-emerald-400 ring-2 ring-emerald-300/60'
          : `${meta.theme.cardBorder} ${meta.theme.cardBorderHover}`
      }`}
    >
      <div>
        {/* Card Top Colored Header Banner */}
        <div
          className={`px-4 py-3 bg-gradient-to-r ${meta.theme.cardTopGradient} border-b border-slate-100 flex items-center justify-between gap-2`}
        >
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${meta.theme.badgeBg} ${meta.theme.badgeText}`}
          >
            {meta.techBadge}
          </span>

          {isUnlocked ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
              <Unlock className="w-3 h-3 text-emerald-700" />
              <span>พร้อมใช้งานบนเว็บ</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200">
              <Lock className="w-3 h-3 text-blue-700" />
              <span>{meta.packageLabel}</span>
            </span>
          )}
        </div>

        {/* Interactive Visual Illustration Preview */}
        <div
          onClick={() => onInspect(program)}
          className={`p-3 ${meta.theme.previewBg} border-b border-slate-100 cursor-pointer group relative`}
        >
          <ProgramVisualDiagram
            diagramType={program.diagramType}
            compact
          />
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 px-1">
            <span className="font-medium">คลิกเพื่อดูภาพขั้นตอนการทำงานจริง</span>
            <span
              className={`font-bold ${meta.theme.accentText} group-hover:underline inline-flex items-center gap-1`}
            >
              <Eye className="w-3.5 h-3.5" />
              ดูภาพขยาย
            </span>
          </div>
        </div>

        {/* Program Title & Key Highlights */}
        <div className="p-5 space-y-3">
          <div>
            <div
              className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-md ${meta.theme.tagBg} mb-1`}
            >
              {program.categoryLabel}
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              {program.name}
            </h3>
            <p className="text-xs font-semibold text-slate-600">
              {program.thaiName}
            </p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
            {program.tagline}
          </p>

          <ul className="space-y-1.5 pt-1">
            {program.highlights.slice(0, 2).map((hl) => (
              <li
                key={hl}
                className="flex items-start gap-2 text-xs text-slate-700"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{hl}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Card Footer: Price + Order OR Launch Web App Button */}
      <div className="p-5 pt-3 border-t border-slate-100 bg-slate-50/80 space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">
              {meta.singleBuyPrice === 0
                ? 'สิทธิ์การใช้งาน'
                : 'ราคาซื้อแยกเฉพาะระบบ'}
            </span>
            <div className="text-xl font-extrabold font-mono text-slate-900">
              {meta.singleBuyPrice === 0
                ? 'ฟรี (฿0)'
                : `฿${meta.singleBuyPrice.toLocaleString()}`}
              {meta.singleBuyPrice > 0 && (
                <span className="text-xs font-sans font-normal text-slate-500 ml-1">
                  / ตลอดชีพ
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onInspect(program)}
            aria-label={`ดูภาพการทำงานของ ${program.name}`}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>รายละเอียด</span>
          </button>
        </div>

        {isUnlocked ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onLaunch(program.id)}
              aria-label={`เข้าใช้งาน ${program.name} บนเว็บทันที`}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-101"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>เข้าใช้งานบนเว็บทันที</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-2">
            <button
              type="button"
              onClick={() =>
                onOrder({
                  type: 'single_program',
                  id: program.id,
                  title: `${program.name} (${program.thaiName})`,
                  subtitle: `ซื้อแยกเฉพาะระบบ (${meta.techBadge}) พร้อมเปิดปุ่มใช้งานบนเว็บทันที`,
                  price: meta.singleBuyPrice,
                  unlockProgramIds: [program.id],
                  badgeLabel: 'ซื้อแยกรายระบบ · ตลอดชีพ',
                })
              }
              aria-label={`สั่งซื้อระบบ ${program.name}`}
              className="col-span-8 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-101"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>สั่งซื้อระบบนี้ (฿{meta.singleBuyPrice})</span>
            </button>

            <button
              type="button"
              onClick={() => onAddToCart(program, 'monthly_cloud')}
              aria-label={`เพิ่ม ${program.name} ลงตะกร้า`}
              className="col-span-4 py-2.5 px-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
              <span>ใส่ตะกร้า</span>
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
}
