// หน้าร้าน: รวมทุก section ของหน้าคลังระบบงาน (เรียงลำดับ section ได้ที่ไฟล์นี้)
import React from 'react';
import { SoftwareProgram } from '../data/programs';
import { CartItem } from '../utils/pricing';
import { MemberTier, ViewMode } from '../types';
import { OrderTarget } from '../components/modals/QuickOrderModal';
import { StoreStatusBar } from '../components/store/StoreStatusBar';
import { HeroSection } from '../components/store/HeroSection';
import { HowToOrderSection } from '../components/store/HowToOrderSection';
import { HtmlPluginCatalog } from '../components/store/HtmlPluginCatalog';
import { MembershipSection } from '../components/store/MembershipSection';

interface StoreViewProps {
  memberTier: MemberTier;
  unlockedProgramIds: string[];
  onChangeView: (mode: ViewMode) => void;
  onLaunch: (programId: string) => void;
  onInspect: (program: SoftwareProgram) => void;
  onOrder: (target: OrderTarget) => void;
  onAddToCart: (program: SoftwareProgram, licenseType: CartItem['licenseType']) => void;
}

export function StoreView({
  memberTier,
  unlockedProgramIds,
  onChangeView,
  onLaunch,
  onInspect,
  onOrder,
  onAddToCart,
}: StoreViewProps) {
  return (
    <main id="top" className="flex-1">
      <StoreStatusBar
        memberTier={memberTier}
        unlockedCount={unlockedProgramIds.length}
      />
      <HeroSection />
      <HtmlPluginCatalog unlockedProgramIds={unlockedProgramIds} onOrder={onOrder} />
      <MembershipSection memberTier={memberTier} onOrder={onOrder} />
      <HowToOrderSection />
    </main>
  );
}
