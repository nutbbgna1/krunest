// ชนิดข้อมูลที่ใช้ร่วมกันทั้งแอป
export type ViewMode = 'store' | 'workspace' | 'member' | 'admin';
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
