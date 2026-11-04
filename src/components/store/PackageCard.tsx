// การ์ดแพ็กเกจสมาชิก 1 ใบ (ข้อมูลอยู่ที่ data/packages.ts)
import React from 'react';
import { motion } from 'motion/react';
import { Clock3, Check, QrCode } from 'lucide-react';
import { KruPackage } from '../../data/packages';
import { OrderTarget } from '../modals/QuickOrderModal';

interface PackageCardProps {
  pkg: KruPackage;
  isCurrentTier: boolean;
  allIncludedUnlocked: boolean;
  onLaunch: (programId: string) => void;
  onOrder: (target: OrderTarget) => void;
}

export function PackageCard({ pkg, isCurrentTier, allIncludedUnlocked, onLaunch, onOrder }: PackageCardProps) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl p-6 flex flex-col justify-between border-2 transition-all ${pkg.gradientBg} ${pkg.borderColor} shadow-sm hover:shadow-xl`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-extrabold text-slate-900">
            {pkg.name}
          </h3>
          {pkg.badge && (
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-xs ${
                pkg.popular
                  ? 'bg-blue-600 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {pkg.badge}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 min-h-[32px]">
          {pkg.subtitle}
        </p>

        <div className="py-3 border-y border-slate-200/80">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              ฿{pkg.price.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">
              / {pkg.periodLabel}
            </span>
          </div>
          <div className="text-[11px] font-bold text-blue-700 mt-1">
            รองรับ: {pkg.techScope}
          </div>
        </div>

        <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
          {pkg.features.map((feat) => (
            <li key={feat} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-6 mt-6 border-t border-slate-200">
        {allIncludedUnlocked ? (
          <button
            type="button"
            disabled
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
          >
            <Clock3 className="w-3.5 h-3.5" />
            <span>{isCurrentTier ? 'แพ็กเกจปัจจุบัน · ระบบกำลังเตรียมเปิด' : 'ระบบกำลังเตรียมเปิด'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              onOrder({
                type: 'package',
                id: pkg.id,
                title: `${pkg.name} (${pkg.techScope})`,
                subtitle: `รับสิทธิ์ ${pkg.unlockProgramIds.length} ระบบงานและรับแจ้งเมื่อระบบพร้อมใช้งาน`,
                price: pkg.price,
                unlockProgramIds: pkg.unlockProgramIds,
                badgeLabel: 'แพ็กเกจสมาชิกตลอดชีพ',
              })
            }
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
              pkg.popular
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'
                : pkg.bestValue
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/25'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>สมัคร{pkg.name} (฿{pkg.price})</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
