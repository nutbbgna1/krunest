// แถบเมนูด้านบน (โลโก้ / ลิงก์เมนู / ปุ่มตะกร้า)
import React from 'react';
import { ShoppingBag, Play, LogIn, UserRound, ShieldCheck, LogOut } from 'lucide-react';
import { SOFTWARE_PROGRAMS } from '../../data/programs';
import { AuthUser, ViewMode } from '../../types';

interface HeaderProps {
  viewMode: ViewMode;
  unlockedCount: number;
  cartCount: number;
  onChangeView: (mode: ViewMode) => void;
  onOpenCart: () => void;
  user: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function Header({ viewMode, unlockedCount, cartCount, onChangeView, onOpenCart, user, onOpenAuth, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 h-16 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-md border-b border-blue-600/50 px-6 lg:px-10 flex items-center justify-between gap-4">
      {/* Zone 1: Brand Identity */}
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          onChangeView('store');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="flex items-center gap-3 text-left shrink-0 group"
      >
        <div className="w-10 h-10 rounded-xl bg-white text-blue-700 font-extrabold text-base flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
          SYS
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-base tracking-tight text-white leading-none">
            LuminaSys Hub
          </span>
          <span className="text-[11px] text-blue-100 font-medium mt-0.5">
            คลังระบบงานและโปรแกรมสำเร็จรูปออนไลน์
          </span>
        </div>
      </a>

      {/* Zone 2: Inline Navigation Links */}
      <nav
        aria-label="เมนูหลัก"
        className="hidden md:flex items-center gap-2 text-xs font-semibold text-blue-100"
      >
        <a
          href="#catalog"
          onClick={() => onChangeView('store')}
          className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
        >
          คลังระบบงาน ({SOFTWARE_PROGRAMS.length})
        </a>
        <a
          href="#packages"
          onClick={() => onChangeView('store')}
          className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
        >
          แพ็กเกจสมาชิกตลอดชีพ
        </a>
        <a
          href="#how-to-order"
          onClick={() => onChangeView('store')}
          className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
        >
          ขั้นตอนการสั่งซื้อ
        </a>
        <a
          href="#workspace"
          onClick={(e) => {
            e.preventDefault();
            onChangeView('workspace');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            viewMode === 'workspace'
              ? 'bg-white text-blue-800 font-bold shadow-xs'
              : 'hover:text-white hover:bg-white/10'
          }`}
        >
          <Play className="w-3 h-3 fill-current" />
          <span>พื้นที่ใช้งานบนเว็บ ({unlockedCount})</span>
        </a>
      </nav>

      {/* Zone 3: Primary Action CTA */}
      <div className="flex items-center gap-2 shrink-0">
        {user ? <>
          <button type="button" onClick={()=>onChangeView('member')} className={`hidden sm:flex px-3 py-2 rounded-xl text-xs font-bold items-center gap-2 ${viewMode==='member'?'bg-white text-blue-800':'bg-white/10 hover:bg-white/20'}`}><UserRound className="w-4 h-4"/><span className="max-w-28 truncate">{user.name}</span></button>
          {(user.role==='admin'||user.role==='staff')&&<button type="button" onClick={()=>onChangeView('admin')} className={`p-2.5 rounded-xl ${viewMode==='admin'?'bg-amber-400 text-slate-900':'bg-white/10 hover:bg-white/20'}`} aria-label="ผู้ดูแลระบบ"><ShieldCheck className="w-4 h-4"/></button>}
          <button type="button" onClick={onLogout} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20" aria-label="ออกจากระบบ"><LogOut className="w-4 h-4"/></button>
        </>:<button type="button" onClick={onOpenAuth} className="px-4 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 inline-flex items-center gap-2"><LogIn className="w-4 h-4"/>เข้าสู่ระบบ</button>}
        <button
          type="button"
          onClick={() => onOpenCart()}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-md transition-all active:scale-95 inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4 text-slate-900" />
          <span>ตะกร้าสั่งซื้อ ({cartCount})</span>
        </button>
      </div>
    </header>
  );
}
