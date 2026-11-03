// ส่วนแพ็กเกจสมาชิกตลอดชีพ
import React from 'react';
import { KRU_PACKAGES } from '../../data/packages';
import { MemberTier } from '../../types';
import { OrderTarget } from '../modals/QuickOrderModal';
import { PackageCard } from './PackageCard';

interface PackagesSectionProps {
  memberTier: MemberTier;
  unlockedProgramIds: string[];
  onLaunch: (programId: string) => void;
  onOrder: (target: OrderTarget) => void;
}

export function PackagesSection({ memberTier, unlockedProgramIds, onLaunch, onOrder }: PackagesSectionProps) {
  return (
    <section
      id="packages"
      className="bg-gradient-to-b from-[#EDF2F7] via-blue-50/70 to-[#EDF2F7] border-y border-blue-200/60 py-16"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-block text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-md">
            LIFETIME PACKAGES · แพ็กเกจสมาชิกตลอดชีพ
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            สมัครแพ็กเกจครั้งเดียว ปลดล็อกปุ่มใช้งานบนเว็บคุ้มกว่าซื้อแยก
          </h2>
          <p className="text-xs sm:text-sm text-slate-700">
            เลือกแพ็กเกจตามประเภทระบบที่ต้องการ (Free / Go / Pro / Max) ชำระครั้งเดียวไม่มีรายเดือน พร้อมกดเข้าใช้งานระบบผ่านเว็บได้ทันที
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {KRU_PACKAGES.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isCurrentTier={memberTier === pkg.id}
              allIncludedUnlocked={pkg.unlockProgramIds.every((id) => unlockedProgramIds.includes(id))}
              onLaunch={onLaunch}
              onOrder={onOrder}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
