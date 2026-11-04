// ชนิดข้อมูลที่ใช้ร่วมกันทั้งแอป
export type ViewMode = 'store' | 'workspace' | 'member' | 'sales' | 'admin';
export type MemberTier = 'free' | 'go' | 'pro' | 'max';
export type TierFilter = 'all' | MemberTier | 'unlocked';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  organization: string;
  role: 'member' | 'staff' | 'admin';
  email_verified: boolean;
  two_factor_enabled: boolean;
  notification_email: number;
}

export interface Entitlement {
  program_id: string;
  access_level: 'limited' | 'full';
  source: string;
  expires_at: string | null;
  name: string;
  thai_name: string;
}

export interface MemberSession {
  user: AuthUser;
  csrfToken: string;
  entitlements: Entitlement[];
  subscription?: { plan_id: MemberTier; plan_name: string; ends_at: string | null } | null;
}

export interface HtmlPlugin {
  slug: string;
  name: string;
  version: string;
  type: string;
  description: string;
  category: string;
  badge: string;
  screenshots: string[];
  highlights: string[];
  steps: string[];
  programId: string;
  program: { id: string; name: string; thaiName: string; price: number } | null;
  demoUrl: string | null;
  appUrl: string | null;
  manualUrl: string | null;
  categoryId: string;
  tech: PluginTech;
  access: PluginAccess;
  installedAt: string | null;
  popularity: number;
  priceTiers: PriceTier[];
  delivery: 'online' | 'offline' | 'both';
  downloadUrl: string | null;
  offlineFileName: string | null;
  offlineSize: number | null;
}

export interface PriceTier {
  id: string;
  name: string;
  price: number;
  description: string;
  offline: boolean;
  durationDays: number | null;
}

export interface PluginCategory {
  id: string;
  label: string;
}

export type PluginTech = 'html' | 'gas' | 'php' | 'excel' | 'other';
export type PluginAccess = 'free' | 'go' | 'pro' | 'max' | 'paid';

export const TECH_LABELS: Record<PluginTech, string> = { html: 'HTML Standalone', gas: 'Google Apps Script', php: 'PHP + MySQL', excel: 'Excel / Google Sheets', other: 'อื่น ๆ' };
export const ACCESS_LABELS: Record<PluginAccess, string> = { free: 'ฟรีสำหรับสมาชิกทุกคน', go: 'สมาชิกแบบ Go', pro: 'สมาชิกแบบ Pro', max: 'สมาชิกแบบ Max', paid: 'ชำระเงินแยกต่างหาก' };
