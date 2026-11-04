// แถบเมนูด้านบน (โลโก้ / ลิงก์เมนู / ปุ่มตะกร้า)
import React from 'react';
import { ShoppingBag, LogIn, UserRound, ShieldCheck, LogOut, BadgeDollarSign } from 'lucide-react';
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
        className="flex items-center text-left shrink-0 group"
      >
        <span className="flex h-12 items-center rounded-xl bg-white px-2.5 py-1.5 shadow-md ring-1 ring-white/60 transition-transform group-hover:scale-[1.02]">
          <img
            src="/brand/krunest-logo-v1.png"
            alt="Krunest"
            className="h-9 w-auto max-w-[150px] object-contain sm:max-w-[175px]"
          />
        </span>
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
          คลังระบบงาน
        </a>
        <a
          href="#how-to-order"
          onClick={() => onChangeView('store')}
          className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
        >
          ขั้นตอนการสั่งซื้อ
        </a>
      </nav>

      {/* Zone 3: Primary Action CTA */}
      <div className="flex items-center gap-2 shrink-0">
        {user ? <>
          <button type="button" onClick={()=>onChangeView('member')} className={`hidden sm:flex px-3 py-2 rounded-xl text-xs font-bold items-center gap-2 ${viewMode==='member'?'bg-white text-blue-800':'bg-white/10 hover:bg-white/20'}`}><UserRound className="w-4 h-4"/><span className="max-w-28 truncate">{user.name}</span></button>
          {(user.role==='admin'||user.role==='staff')&&<button type="button" onClick={()=>onChangeView('sales')} className={`p-2.5 rounded-xl ${viewMode==='sales'?'bg-cyan-300 text-slate-900':'bg-white/10 hover:bg-white/20'}`} aria-label="ฝ่ายขาย"><BadgeDollarSign className="w-4 h-4"/></button>}
          {user.role==='admin'&&<button type="button" onClick={()=>onChangeView('admin')} className={`p-2.5 rounded-xl ${viewMode==='admin'?'bg-amber-400 text-slate-900':'bg-white/10 hover:bg-white/20'}`} aria-label="ผู้ดูแลระบบ"><ShieldCheck className="w-4 h-4"/></button>}
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
