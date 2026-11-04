// ส่วนท้ายเว็บ
import React from 'react';
import { ViewMode } from '../../types';

interface FooterProps {
  onChangeView: (mode: ViewMode) => void;
}

export function Footer({ onChangeView }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 py-10 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 items-center rounded-xl bg-white px-2.5 py-1.5 shadow-md">
            <img
              src="/brand/krunest-logo-v1.png"
              alt="Krunest"
              className="h-9 w-auto max-w-[155px] object-contain"
            />
          </div>
          <div>
            <div className="text-xs text-slate-400">
              คลังระบบงานสำเร็จรูปและเว็บแอปพลิเคชันออนไลน์
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
          <button
            type="button"
            onClick={() => {
              onChangeView('store');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-white transition-colors cursor-pointer"
          >
            หน้าร้านคลังระบบ
          </button>
          <span>·</span>
          <button type="button" onClick={() => onChangeView('member')} className="hover:text-white transition-colors">ศูนย์สมาชิก</button>
        </div>

        <div className="text-xs text-slate-500">
          © 2026 Krunest. กำลังทยอยเปิดให้บริการโปรแกรมออนไลน์
        </div>
      </div>
    </footer>
  );
}
