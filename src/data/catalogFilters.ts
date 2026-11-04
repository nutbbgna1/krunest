// ปุ่มกรองหมวดหมู่และแพ็กเกจในหน้าคลังระบบงาน
import { ProgramCategory } from './programs';
import { TierFilter } from '../types';

export const CATEGORY_TABS: { id: ProgramCategory; label: string }[] = [
  { id: 'all', label: 'ทุกระบบงาน (6)' },
  { id: 'erp', label: 'สต็อก & ขายหน้าร้าน' },
  { id: 'creative', label: 'แต่งภาพสินค้า' },
  { id: 'crm', label: 'รวมแชท & CRM' },
  { id: 'document', label: 'เอกสารภาษี & บุคคล' },
];

// ป้าย "เปิดสิทธิ์แล้ว" จะต่อท้ายด้วยจำนวนระบบที่ปลดล็อกโดยอัตโนมัติ
export const TIER_FILTERS: { id: TierFilter; label: string }[] = [
  { id: 'all', label: 'ทุกแพ็กเกจ' },
  { id: 'unlocked', label: 'เปิดสิทธิ์แล้ว' },
  { id: 'free', label: 'ฟรี (Free)' },
  { id: 'go', label: 'Go' },
  { id: 'pro', label: 'Pro' },
  { id: 'max', label: 'Max' },
];
