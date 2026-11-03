// พื้นที่ใช้งานบนเว็บ: เมนูซ้าย + หัวข้อ + แอปที่เลือก
import React from 'react';
import { SOFTWARE_PROGRAMS, SUBSCRIPTION_PLANS, SubscriptionPlan } from '../../data/programs';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WORKSPACE_APPS } from './apps';

interface CloudWorkspaceViewProps {
  activeAppId: string;
  onSelectApp: (appId: string) => void;
  activePlanId: SubscriptionPlan['id'];
  onChangePlan: (planId: SubscriptionPlan['id']) => void;
  onBackToStore: () => void;
}

export const CloudWorkspaceView: React.FC<CloudWorkspaceViewProps> = ({
  activeAppId,
  onSelectApp,
  activePlanId,
  onChangePlan,
  onBackToStore,
}) => {
  const currentProgram =
    SOFTWARE_PROGRAMS.find((p) => p.id === activeAppId) || SOFTWARE_PROGRAMS[0];
  const currentPlan =
    SUBSCRIPTION_PLANS.find((p) => p.id === activePlanId) || SUBSCRIPTION_PLANS[1];

  return (
    <div className="min-h-[calc(100vh-65px)] bg-[#FAF9F5] flex flex-col lg:flex-row">
      <WorkspaceSidebar
        currentProgram={currentProgram}
        currentPlan={currentPlan}
        activePlanId={activePlanId}
        onChangePlan={onChangePlan}
        onSelectApp={onSelectApp}
        onBackToStore={onBackToStore}
      />

      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <WorkspaceHeader currentProgram={currentProgram} />

        {/* ทุกแอปถูก mount ค้างไว้ (ซ่อนตัวที่ไม่ได้เลือก) เพื่อให้ข้อมูลที่กรอกไม่หายเมื่อสลับแอป */}
        {Object.entries(WORKSPACE_APPS).map(([appId, AppComponent]) => (
          <div key={appId} hidden={appId !== currentProgram.id}>
            <AppComponent />
          </div>
        ))}
      </div>
    </div>
  );
};
