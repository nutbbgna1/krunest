// หัวข้อด้านบนของโปรแกรมที่เปิดอยู่ (breadcrumb + ชื่อ + เวอร์ชัน)
import React from 'react';
import { SoftwareProgram } from '../../data/programs';

export function WorkspaceHeader({ currentProgram }: { currentProgram: SoftwareProgram }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-stone-200">
      <div>
        <div className="text-xs text-slate-500 mb-1">
          <span>Cloud Workspace</span>
          <span aria-hidden="true" className="mx-2">/</span>
          <span>{currentProgram.categoryLabel}</span>
          <span aria-hidden="true" className="mx-2">/</span>
          <span className="text-slate-900 font-medium">{currentProgram.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {currentProgram.name} — {currentProgram.thaiName}
        </h1>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-xs text-slate-500 font-mono">
          {currentProgram.version} · ซิงค์ข้อมูลอัตโนมัติ
        </span>
      </div>
    </div>
  );
}
