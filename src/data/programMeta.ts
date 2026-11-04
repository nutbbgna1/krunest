// ข้อมูลเสริมของแต่ละโปรแกรม: ป้ายเทคโนโลยี, แพ็กเกจที่ปลดล็อก, ราคาซื้อแยก และธีมสีของการ์ด
// แก้ราคา/สี/ป้าย ของการ์ดสินค้าได้ที่ไฟล์นี้
import { MemberTier } from '../types';

export interface ProgramMeta {
  techBadge: string;
  packageTier: MemberTier;
  packageLabel: string;
  singleBuyPrice: number;
  codeTypeIcon: 'html' | 'gas' | 'php';
  theme: {
    cardTopGradient: string;
    cardBorder: string;
    cardBorderHover: string;
    badgeBg: string;
    badgeText: string;
    previewBg: string;
    accentText: string;
    tagBg: string;
  };
}

export const PROGRAM_META: Record<string, ProgramMeta> = {
  'docuflow-tax': {
    techBadge: 'HTML Standalone + PDF',
    packageTier: 'free',
    packageLabel: 'ฟรี (Free Member)',
    singleBuyPrice: 0,
    codeTypeIcon: 'html',
    theme: {
      cardTopGradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      cardBorder: 'border-amber-200/80',
      cardBorderHover: 'hover:border-amber-400 hover:shadow-amber-500/10',
      badgeBg: 'bg-amber-100 border-amber-200',
      badgeText: 'text-amber-900',
      previewBg: 'bg-gradient-to-b from-amber-50/60 to-white',
      accentText: 'text-amber-700',
      tagBg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  },
  'veloce-pos': {
    techBadge: 'HTML Standalone + Cloud',
    packageTier: 'go',
    packageLabel: 'แพ็กเกจ Go ขึ้นไป',
    singleBuyPrice: 399,
    codeTypeIcon: 'html',
    theme: {
      cardTopGradient: 'from-sky-500/20 via-blue-500/10 to-transparent',
      cardBorder: 'border-sky-200/80',
      cardBorderHover: 'hover:border-sky-400 hover:shadow-sky-500/10',
      badgeBg: 'bg-sky-100 border-sky-200',
      badgeText: 'text-sky-900',
      previewBg: 'bg-gradient-to-b from-sky-50/60 to-white',
      accentText: 'text-sky-700',
      tagBg: 'bg-sky-50 text-sky-700 border-sky-200',
    },
  },
  'flowsync-erp': {
    techBadge: 'Google Apps Script + Cloud',
    packageTier: 'pro',
    packageLabel: 'แพ็กเกจ Pro ขึ้นไป',
    singleBuyPrice: 499,
    codeTypeIcon: 'gas',
    theme: {
      cardTopGradient: 'from-blue-600/20 via-indigo-600/10 to-transparent',
      cardBorder: 'border-blue-200/80',
      cardBorderHover: 'hover:border-blue-500 hover:shadow-blue-500/15',
      badgeBg: 'bg-blue-100 border-blue-200',
      badgeText: 'text-blue-900',
      previewBg: 'bg-gradient-to-b from-blue-50/60 to-white',
      accentText: 'text-blue-700',
      tagBg: 'bg-blue-50 text-blue-700 border-blue-200',
    },
  },
  'pixelcraft-studio': {
    techBadge: 'Cloud Web App + Batch AI',
    packageTier: 'pro',
    packageLabel: 'แพ็กเกจ Pro ขึ้นไป',
    singleBuyPrice: 499,
    codeTypeIcon: 'gas',
    theme: {
      cardTopGradient: 'from-purple-600/20 via-fuchsia-600/10 to-transparent',
      cardBorder: 'border-purple-200/80',
      cardBorderHover: 'hover:border-purple-500 hover:shadow-purple-500/15',
      badgeBg: 'bg-purple-100 border-purple-200',
      badgeText: 'text-purple-900',
      previewBg: 'bg-gradient-to-b from-purple-50/60 to-white',
      accentText: 'text-purple-700',
      tagBg: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  },
  'shiftpulse-hr': {
    techBadge: 'Google Apps Script + Sheets',
    packageTier: 'pro',
    packageLabel: 'แพ็กเกจ Pro ขึ้นไป',
    singleBuyPrice: 450,
    codeTypeIcon: 'gas',
    theme: {
      cardTopGradient: 'from-teal-600/20 via-emerald-600/10 to-transparent',
      cardBorder: 'border-teal-200/80',
      cardBorderHover: 'hover:border-teal-500 hover:shadow-teal-500/15',
      badgeBg: 'bg-teal-100 border-teal-200',
      badgeText: 'text-teal-900',
      previewBg: 'bg-gradient-to-b from-teal-50/60 to-white',
      accentText: 'text-teal-700',
      tagBg: 'bg-teal-50 text-teal-700 border-teal-200',
    },
  },
  'pulsecrm-chat': {
    techBadge: 'PHP + MySQL + Cloud Webhook',
    packageTier: 'max',
    packageLabel: 'แพ็กเกจ Max / ซื้อแยก',
    singleBuyPrice: 590,
    codeTypeIcon: 'php',
    theme: {
      cardTopGradient: 'from-emerald-600/20 via-teal-600/10 to-transparent',
      cardBorder: 'border-emerald-200/80',
      cardBorderHover: 'hover:border-emerald-500 hover:shadow-emerald-500/15',
      badgeBg: 'bg-emerald-100 border-emerald-200',
      badgeText: 'text-emerald-900',
      previewBg: 'bg-gradient-to-b from-emerald-50/60 to-white',
      accentText: 'text-emerald-700',
      tagBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  },
};
