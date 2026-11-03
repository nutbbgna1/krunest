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
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
            SYS
          </div>
          <div>
            <div className="font-extrabold text-white text-sm">LuminaSys Hub</div>
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
          <button
            type="button"
            onClick={() => {
              onChangeView('workspace');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-white transition-colors cursor-pointer"
          >
            เข้าหน้าเว็บแอปออนไลน์
          </button>
          <span>·</span>
          <button type="button" onClick={() => onChangeView('member')} className="hover:text-white transition-colors">ศูนย์สมาชิก</button>
          <span>·</span>
          <a href="#packages" className="hover:text-white transition-colors">
            แพ็กเกจสมาชิกตลอดชีพ
          </a>
        </div>

        <div className="text-xs text-slate-500">
          © 2026 LuminaSys Hub. พร้อมใช้งานบนเว็บได้ทันที
        </div>
      </div>
    </footer>
  );
}
