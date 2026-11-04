import React, { useState } from 'react';
import { X, Check, ArrowRight, Clock3, Monitor, Cloud } from 'lucide-react';
import { SoftwareProgram } from '../../data/programs';
import { LicensePurchaseType } from '../../utils/pricing';
import { ProgramVisualDiagram } from '../common/ProgramVisualDiagram';

interface ProgramDetailModalProps {
  program: SoftwareProgram | null;
  onClose: () => void;
  onAddToCart: (program: SoftwareProgram, licenseType: LicensePurchaseType) => void;
  onLaunchCloudApp: (programId: string) => void;
}

export const ProgramDetailModal: React.FC<ProgramDetailModalProps> = ({
  program,
  onClose,
  onAddToCart,
  onLaunchCloudApp,
}) => {
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const [selectedLicense, setSelectedLicense] = useState<LicensePurchaseType>('monthly_cloud');

  if (!program) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-program-title"
    >
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Clean Minimal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-blue-600">{program.categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{program.version}</span>
            <span aria-hidden="true">·</span>
            <span>{program.platforms}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างรายละเอียดโปรแกรม"
            className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left 7 Cols: Visual Artboard & 3 Concise Step Tabs */}
          <div className="lg:col-span-7 p-6 bg-slate-50/70 border-b lg:border-b-0 lg:border-r border-slate-100 space-y-5">
            <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs bg-white">
              <ProgramVisualDiagram
                diagramType={program.diagramType}
                activeStepIndex={selectedStep}
              />
            </div>

            {/* Concise 3-Step Visual Selector */}
            <div className="grid grid-cols-3 gap-2.5">
              {program.workflowSteps.map((step, idx) => {
                const isActive = selectedStep === idx;
                return (
                  <button
                    key={step.stepNumber}
                    type="button"
                    onClick={() => setSelectedStep(idx)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-white border-blue-600 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="text-[11px] font-mono font-bold text-blue-600 mb-0.5">
                      STEP {step.stepNumber}
                    </div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-1">
                      {step.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{step.metricLabel}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right 5 Cols: Clean Purchase & Instant Cloud Launch */}
          <div className="lg:col-span-5 p-6 flex flex-col justify-between bg-white">
            <div className="space-y-5">
              <div>
                <h2
                  id="modal-program-title"
                  className="text-2xl font-bold text-slate-900 tracking-tight"
                >
                  {program.name}
                </h2>
                <p className="text-sm font-medium text-blue-600 mt-0.5">{program.thaiName}</p>
              </div>

              {/* License Type Switcher */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedLicense('monthly_cloud')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                    selectedLicense === 'monthly_cloud'
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">เช่าใช้บนเว็บ (Cloud)</div>
                      <div className="text-[11px] text-slate-500">เปิดใช้งานผ่านเว็บได้ทันที</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-slate-900">
                      ฿{program.monthlyPrice.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500">/ เดือน</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLicense('lifetime_desktop')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                    selectedLicense === 'lifetime_desktop'
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">ซื้อขาดตลอดชีพ</div>
                      <div className="text-[11px] text-slate-500">ไฟล์ติดตั้ง + ใช้บนเว็บ 1 ปี</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-slate-900">
                      ฿{program.lifetimePrice.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500">จ่ายครั้งเดียว</div>
                  </div>
                </button>
              </div>

              {/* 3 Short Highlights */}
              <ul className="space-y-2 pt-2">
                {program.highlights.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="line-clamp-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5 pt-6">
              <button
                type="button"
                onClick={() => {
                  onAddToCart(program, selectedLicense);
                  onClose();
                }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>
                  เพิ่มลงตะกร้า — ฿
                  {(selectedLicense === 'monthly_cloud'
                    ? program.monthlyPrice
                    : program.lifetimePrice
                  ).toLocaleString()}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="w-full py-2.5 px-4 bg-amber-50 text-amber-800 font-semibold text-xs rounded-xl border border-amber-200 flex items-center justify-center gap-2">
                <Clock3 className="w-4 h-4" />
                <span>ระบบทดลองใช้งานออนไลน์กำลังเตรียมเปิดให้บริการ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
