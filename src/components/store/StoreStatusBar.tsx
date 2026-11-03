// แถบสถานะสมาชิก + ปุ่มสลับหน้าร้าน/เว็บแอป
import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { SOFTWARE_PROGRAMS } from '../../data/programs';
import { MemberTier, ViewMode } from '../../types';

interface StoreStatusBarProps {
  memberTier: MemberTier;
  unlockedCount: number;
  onChangeView: (mode: ViewMode) => void;
}

export function StoreStatusBar({ memberTier, unlockedCount, onChangeView }: StoreStatusBarProps) {
  return (
    <div className="bg-gradient-to-r from-blue-100/90 via-indigo-50 to-sky-100/90 border-b border-blue-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
          <span className="inline-flex items-center gap-1.5 font-bold text-white bg-blue-600 px-3 py-1 rounded-lg shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>สถานะสมาชิกของคุณ: แพ็กเกจ {memberTier.toUpperCase()}</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span>ระบบที่พร้อมใช้งาน:</span>
            <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-md text-[11px] shadow-2xs">
              {unlockedCount} / {SOFTWARE_PROGRAMS.length} ระบบ
            </span>
          </span>
        </div>

        <div
          className="inline-flex items-center gap-1.5 p-1 bg-white/80 rounded-xl border border-blue-200/80 shadow-2xs"
          role="group"
          aria-label="สลับโหมดหน้าร้านและเว็บแอปออนไลน์"
        >
          <button
            type="button"
            onClick={() => onChangeView('store')}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-700 text-white shadow-xs transition-colors whitespace-nowrap cursor-pointer"
          >
            หน้าร้านคลังระบบงาน
          </button>
          <button
            type="button"
            onClick={() => onChangeView('workspace')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
          >
            <span>เข้าหน้าเว็บแอปออนไลน์ทันที</span>
            <ArrowRight className="w-3 h-3 text-blue-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
