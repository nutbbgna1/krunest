// ทะเบียนแอปในพื้นที่ใช้งาน: จับคู่ id โปรแกรม (ใน data/programs.ts) กับ component ที่แสดงผล
// เพิ่มโปรแกรมใหม่ = สร้างไฟล์ในโฟลเดอร์นี้ แล้วเพิ่มบรรทัดด้านล่าง
import React from 'react';
import { FlowSyncErpApp } from './FlowSyncErpApp';
import { PixelCraftStudioApp } from './PixelCraftStudioApp';
import { PulseCrmChatApp } from './PulseCrmChatApp';
import { DocuFlowTaxApp } from './DocuFlowTaxApp';
import { VelocePosApp } from './VelocePosApp';
import { ShiftPulseHrApp } from './ShiftPulseHrApp';

export const WORKSPACE_APPS: Record<string, React.ComponentType> = {
  'flowsync-erp': FlowSyncErpApp,
  'pixelcraft-studio': PixelCraftStudioApp,
  'pulsecrm-chat': PulseCrmChatApp,
  'docuflow-tax': DocuFlowTaxApp,
  'veloce-pos': VelocePosApp,
  'shiftpulse-hr': ShiftPulseHrApp,
};
