// เมนูด้านซ้ายของพื้นที่ใช้งาน: แพ็กเกจ + รายการโปรแกรม + พื้นที่คลาวด์
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { SOFTWARE_PROGRAMS, SUBSCRIPTION_PLANS, SoftwareProgram, SubscriptionPlan } from '../../data/programs';

interface WorkspaceSidebarProps {
  currentProgram: SoftwareProgram;
  currentPlan: SubscriptionPlan;
  activePlanId: SubscriptionPlan['id'];
  onChangePlan: (planId: SubscriptionPlan['id']) => void;
  onSelectApp: (appId: string) => void;
  onBackToStore: () => void;
}

export function WorkspaceSidebar({
  currentProgram,
  currentPlan,
  activePlanId,
  onChangePlan,
  onSelectApp,
  onBackToStore,
}: WorkspaceSidebarProps) {
  return (
    <aside className="w-full lg:w-[272px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-stone-200 p-5 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าคลังจำหน่ายโปรแกรม</span>
          </button>

          <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-stone-200">
            <div className="text-xs text-slate-500">แพ็กเกจ Subscription ปัจจุบัน</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{currentPlan.name}</div>
            <div className="text-xs text-emerald-700 font-medium mt-1">
              สถานะ: เปิดใช้งานออนไลน์ครบวงจร
            </div>
            <div className="mt-2.5 flex items-center gap-1">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => onChangePlan(plan.id)}
                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    activePlanId === plan.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-stone-200/70 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {plan.id === 'starter' ? 'Starter' : plan.id === 'pro' ? 'All-Apps' : 'Enterprise'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* App Switcher List */}
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-2.5 px-1">
            เลือกโปรแกรมออนไลน์ที่ต้องการใช้งาน
          </div>
          <nav className="space-y-1" aria-label="รายการโปรแกรมบนคลาวด์">
            {SOFTWARE_PROGRAMS.map((prog) => {
              const isSelected = prog.id === currentProgram.id;
              return (
                <button
                  key={prog.id}
                  type="button"
                  onClick={() => onSelectApp(prog.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-blue-50/80 text-blue-900 font-semibold border border-blue-200'
                      : 'text-slate-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="truncate">
                    <div className="text-xs font-semibold truncate">{prog.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{prog.thaiName}</div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {prog.version.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="hidden lg:block pt-6 border-t border-stone-200 text-xs text-slate-500 space-y-1">
        <div className="font-medium text-slate-700">พื้นที่คลาวด์ส่วนตัว</div>
        <div className="font-mono tabular-nums">
          ใช้งานไป 18.4 GB / {currentPlan.cloudStorageGb} GB
        </div>
        <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden mt-1">
          <div className="w-1/4 h-full bg-blue-600 rounded-full" />
        </div>
      </div>
    </aside>
  );
}
