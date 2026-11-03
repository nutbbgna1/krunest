// แถบปุ่มสีเขียว เปิดใช้ระบบที่ปลดล็อกแล้ว
import React from 'react';
import { Play, CheckCircle2 } from 'lucide-react';
import { SOFTWARE_PROGRAMS } from '../../data/programs';

interface UnlockedQuickLaunchProps {
  unlockedProgramIds: string[];
  onLaunch: (programId: string) => void;
}

export function UnlockedQuickLaunch({ unlockedProgramIds, onLaunch }: UnlockedQuickLaunchProps) {
  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-8">
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-100/90 via-teal-50 to-emerald-100/80 border-2 border-emerald-300 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-900">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>
              ระบบที่คุณสั่งซื้อ / เปิดสิทธิ์แล้ว ({unlockedProgramIds.length} ระบบ) — กดปุ่มเพื่อเข้าใช้งานบนเว็บได้ทันที
            </span>
          </div>
          <p className="text-xs text-emerald-800">
            เมื่อคุณสั่งซื้อรายโปรแกรมหรือสมัครแพ็กเกจ ระบบจะปรากฏที่นี่พร้อมปุ่มสีเขียวเข้าใช้งานออนไลน์ทันที
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SOFTWARE_PROGRAMS.filter((p) => unlockedProgramIds.includes(p.id)).map(
            (prog) => (
              <button
                key={prog.id}
                type="button"
                onClick={() => onLaunch(prog.id)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:scale-105 transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>เปิดใช้ {prog.name.split(' ')[0]} บนเว็บ</span>
              </button>
            )
          )}
        </div>
      </div>
    </section>
  );
}
