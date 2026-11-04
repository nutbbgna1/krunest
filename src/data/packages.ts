// แพ็กเกจสมาชิกตลอดชีพ (Free / Go / Pro / Max) — แก้ราคา ฟีเจอร์ และระบบที่ปลดล็อกได้ที่นี่
import { MemberTier } from '../types';

export interface KruPackage {
  id: MemberTier;
  name: string;
  badge?: string;
  price: number;
  periodLabel: string;
  subtitle: string;
  techScope: string;
  unlockProgramIds: string[];
  features: string[];
  popular?: boolean;
  bestValue?: boolean;
  gradientBg: string;
  borderColor: string;
}

export const KRU_PACKAGES: KruPackage[] = [
  {
    id: 'free',
    name: 'แพ็กเกจ ฟรี',
    price: 0,
    periodLabel: 'ฟรีตลอดชีพ',
    subtitle: 'สำหรับทดลองใช้งานระบบพื้นฐานบนเว็บได้ทันที',
    techScope: 'ระบบที่ติดป้าย "ฟรี"',
    unlockProgramIds: ['docuflow-tax'],
    gradientBg: 'bg-gradient-to-b from-slate-50 via-white to-slate-50/60',
    borderColor: 'border-slate-300',
    features: [
      'เปิดใช้งานระบบที่ติดป้าย "ฟรี" บนเว็บได้ทันที',
      'ดูภาพจำลองการทำงานครบทุกโปรแกรม',
      'อัปเกรดเป็นแพ็กเกจสูงขึ้นได้ตลอดเวลา',
    ],
  },
  {
    id: 'go',
    name: 'แพ็กเกจ Go',
    price: 299,
    periodLabel: 'ตลอดชีพ',
    subtitle: 'เหมาะสำหรับระบบ HTML Standalone พร้อมใช้ทันที',
    techScope: 'HTML Standalone',
    unlockProgramIds: ['docuflow-tax', 'veloce-pos'],
    gradientBg: 'bg-gradient-to-b from-sky-50/80 via-white to-blue-50/40',
    borderColor: 'border-sky-300',
    features: [
      'ปลดล็อกระบบหมวด HTML Standalone ทั้งหมด',
      'มีปุ่ม "เข้าใช้งานบนเว็บทันที" ไม่ต้องติดตั้งเอง',
      'ดาวน์โหลดไฟล์ระบบพร้อมคู่มือการใช้งาน',
    ],
  },
  {
    id: 'pro',
    name: 'แพ็กเกจ Pro',
    badge: 'ยอดนิยม',
    price: 399,
    periodLabel: 'ตลอดชีพ',
    subtitle: 'คุ้มที่สุด! ครอบคลุมทั้ง HTML และ Cloud Apps Script',
    techScope: 'HTML + Google Apps Script',
    unlockProgramIds: [
      'docuflow-tax',
      'veloce-pos',
      'flowsync-erp',
      'pixelcraft-studio',
      'shiftpulse-hr',
    ],
    gradientBg: 'bg-gradient-to-b from-blue-100/70 via-white to-indigo-50/50',
    borderColor: 'border-blue-600 ring-4 ring-blue-500/15',
    features: [
      'ปลดล็อก 5 ระบบหลัก (HTML + Cloud Apps Script)',
      'กดปุ่ม "เข้าใช้งานบนเว็บทันที" ได้ครบทั้ง 5 ระบบ',
      'รองรับการส่งออกรายงาน PDF / Excel / Word ครบชุด',
      'อัปเดตระบบใหม่ในหมวดนี้ฟรีตลอดชีพ',
    ],
    popular: true,
  },
  {
    id: 'max',
    name: 'แพ็กเกจ Max',
    badge: 'สุดคุ้มครบทุกตัว',
    price: 499,
    periodLabel: 'ตลอดชีพ',
    subtitle: 'ครอบคลุมทุกประเภทระบบ รวม PHP + MySQL และระบบอนาคต',
    techScope: 'ครบทุกระบบ (HTML + GAS + PHP/MySQL)',
    unlockProgramIds: [
      'docuflow-tax',
      'veloce-pos',
      'flowsync-erp',
      'pixelcraft-studio',
      'shiftpulse-hr',
      'pulsecrm-chat',
    ],
    gradientBg: 'bg-gradient-to-b from-amber-100/70 via-white to-orange-50/50',
    borderColor: 'border-amber-400 ring-4 ring-amber-400/15',
    features: [
      'ปลดล็อกครบทั้ง 6 ระบบในคลัง (รวม PHP + MySQL)',
      'เปิดปุ่ม "เข้าใช้งานบนเว็บทันที" ครบทุกโปรแกรม 100%',
      'รับสิทธิ์ใช้งานระบบใหม่ที่จะอัปเดตในอนาคตฟรี',
      'คู่มือการติดตั้งและทีมงานดูแลช่วยเหลือพิเศษ',
    ],
    bestValue: true,
  },
];
