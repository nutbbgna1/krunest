// ไฟล์หลัก: เก็บ state ของทั้งแอป แล้วส่งต่อให้แต่ละหน้า/คอมโพเนนต์
// - ข้อมูล (ราคา, แพ็กเกจ, ข้อความ) อยู่ที่ src/data/
// - หน้าตาแต่ละส่วนอยู่ที่ src/components/
import React, { useEffect, useState } from 'react';
import { SOFTWARE_PROGRAMS, SoftwareProgram, SubscriptionPlan } from './data/programs';
import { CartItem } from './utils/pricing';
import { AuthUser, MemberSession, MemberTier, ViewMode } from './types';
import { api, setCsrfToken } from './lib/api';
import { useCart } from './hooks/useCart';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { StoreView } from './views/StoreView';
import { CloudWorkspaceView } from './components/workspace/CloudWorkspaceView';
import { ProgramDetailModal } from './components/modals/ProgramDetailModal';
import { QuickOrderModal, OrderTarget } from './components/modals/QuickOrderModal';
import { CartDrawer } from './components/modals/CartDrawer';
import { AuthModal } from './components/account/AuthModal';
import { MemberCenter } from './views/MemberCenter';
import { AdminCenter } from './views/AdminCenter';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('store');
  const [session, setSession] = useState<MemberSession | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  // ระบบที่ปลดล็อกแล้ว (เริ่มต้นด้วยระบบฟรี)
  const [unlockedProgramIds, setUnlockedProgramIds] = useState<string[]>(['docuflow-tax']);
  const [currentMemberTier, setCurrentMemberTier] = useState<MemberTier>('free');

  // Modal ที่เปิดอยู่
  const [inspectingProgram, setInspectingProgram] = useState<SoftwareProgram | null>(null);
  const [activeOrderTarget, setActiveOrderTarget] = useState<OrderTarget | null>(null);

  // ตะกร้า
  const cart = useCart();
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // พื้นที่ใช้งานบนเว็บ
  const [activeCloudAppId, setActiveCloudAppId] = useState<string>('flowsync-erp');
  const [activePlanId, setActivePlanId] = useState<SubscriptionPlan['id']>('pro');

  const refreshSession = async () => {
    try {
      const data = await api<MemberSession>('/me');
      setCsrfToken(data.csrfToken);
      setSession(data);
      setUnlockedProgramIds(data.entitlements.map((item) => item.program_id));
      if (data.subscription?.plan_id) setCurrentMemberTier(data.subscription.plan_id);
    } catch { setSession(null); setUnlockedProgramIds(['docuflow-tax']); setCurrentMemberTier('free'); }
  };
  useEffect(() => { refreshSession(); }, []);

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST', body: {} }); } catch { /* clear local state even if session expired */ }
    setCsrfToken(''); setSession(null); setViewMode('store'); setUnlockedProgramIds(['docuflow-tax']);
  };

  const handleUnlockPrograms = (programIds: string[], packageId?: string) => {
    setUnlockedProgramIds((prev) => Array.from(new Set([...prev, ...programIds])));
    if (
      packageId === 'free' ||
      packageId === 'go' ||
      packageId === 'pro' ||
      packageId === 'max'
    ) {
      setCurrentMemberTier(packageId);
      if (packageId === 'max' || packageId === 'pro') {
        setActivePlanId('pro');
      }
    }
  };

  const handleAddToCart = (program: SoftwareProgram, licenseType: CartItem['licenseType']) => {
    cart.addToCart(program, licenseType);
    setIsCartOpen(true);
  };

  const handleLaunchCloudApp = (programId: string) => {
    setActiveCloudAppId(programId);
    setViewMode('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EDF2F7] text-[#0F172A]">
      <Header
        viewMode={viewMode}
        unlockedCount={unlockedProgramIds.length}
        cartCount={cart.totalCount}
        onChangeView={setViewMode}
        onOpenCart={() => setIsCartOpen(true)}
        user={session?.user || null}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={logout}
      />

      {viewMode === 'admin' && session && ['admin','staff'].includes(session.user.role) ? <AdminCenter /> : viewMode === 'member' && session ? <MemberCenter session={session} onRefresh={refreshSession} /> : viewMode === 'member' && !session ? <main className="flex-1 grid place-items-center p-8 bg-portal-mesh"><div className="portal-card max-w-md p-8 text-center"><h1 className="text-2xl font-black">เข้าสู่ระบบเพื่อเปิดศูนย์สมาชิก</h1><p className="text-sm text-slate-500 mt-2 mb-5">จัดการสิทธิ์ คำสั่งซื้อ ทีม และความปลอดภัยของบัญชี</p><button onClick={()=>setAuthOpen(true)} className="primary-button">เข้าสู่ระบบ / สมัครสมาชิก</button></div></main> : viewMode === 'workspace' ? (
        <main className="flex-1">
          <CloudWorkspaceView
            activeAppId={activeCloudAppId}
            onSelectApp={(id) => setActiveCloudAppId(id)}
            activePlanId={activePlanId}
            onChangePlan={(planId) => setActivePlanId(planId)}
            onBackToStore={() => setViewMode('store')}
          />
        </main>
      ) : (
        <StoreView
          memberTier={currentMemberTier}
          unlockedProgramIds={unlockedProgramIds}
          onChangeView={setViewMode}
          onLaunch={handleLaunchCloudApp}
          onInspect={setInspectingProgram}
          onOrder={setActiveOrderTarget}
          onAddToCart={handleAddToCart}
        />
      )}

      <Footer onChangeView={setViewMode} />

      {/* Program Visual Detail Modal */}
      <ProgramDetailModal
        program={inspectingProgram}
        onClose={() => setInspectingProgram(null)}
        onAddToCart={(prog, licType) => {
          setInspectingProgram(null);
          handleAddToCart(prog, licType);
        }}
        onLaunchCloudApp={(progId) => {
          setInspectingProgram(null);
          handleLaunchCloudApp(progId);
        }}
      />

      {/* Quick QR PromptPay Order & Instant Unlock Modal (sys.krucom.net style) */}
      <QuickOrderModal
        orderTarget={activeOrderTarget}
        onClose={() => setActiveOrderTarget(null)}
        user={session?.user || null}
        onRequireLogin={() => { setActiveOrderTarget(null); setAuthOpen(true); }}
        onSubmitted={refreshSession}
      />

      <AuthModal open={authOpen} onClose={()=>setAuthOpen(false)} onAuthenticated={(_user:AuthUser)=>refreshSession()} />

      {/* Slide-over Cart & Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart.cartItems}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeItem}
        onClearCart={cart.clearCart}
        onCompleteOrderAndOpenWorkspace={(purchasedIds) => {
          handleUnlockPrograms(purchasedIds);
          setIsCartOpen(false);
          if (purchasedIds.length > 0) {
            handleLaunchCloudApp(purchasedIds[0]);
          } else {
            setViewMode('workspace');
          }
        }}
      />
    </div>
  );
}
