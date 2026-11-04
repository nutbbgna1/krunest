// แถบสถานะสมาชิก + ปุ่มสลับหน้าร้าน/เว็บแอป
import React from 'react';
import { Sparkles } from 'lucide-react';
import { MemberTier } from '../../types';

interface StoreStatusBarProps {
  memberTier: MemberTier;
  unlockedCount: number;
}

export function StoreStatusBar({ memberTier, unlockedCount }: StoreStatusBarProps) {
  return (
    <div className="bg-gradient-to-r from-blue-100/90 via-indigo-50 to-sky-100/90 border-b border-blue-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
          <span className="inline-flex items-center gap-1.5 font-bold text-white bg-blue-600 px-3 py-1 rounded-lg shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>สถานะสมาชิกของคุณ: แพ็กเกจ {memberTier.toUpperCase()}</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span>สิทธิ์โปรแกรมที่ใช้งานได้:</span>
            <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-md text-[11px] shadow-2xs">
              {unlockedCount} ระบบ
            </span>
          </span>
        </div>

      </div>
    </div>
  );
}
