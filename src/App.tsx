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
import { HtmlPluginDetail } from './views/HtmlPluginDetail';
import { CloudWorkspaceView } from './components/workspace/CloudWorkspaceView';
import { ProgramDetailModal } from './components/modals/ProgramDetailModal';
import { QuickOrderModal, OrderTarget } from './components/modals/QuickOrderModal';
import { CartDrawer } from './components/modals/CartDrawer';
import { AuthModal } from './components/account/AuthModal';
import { MemberCenter } from './views/MemberCenter';
import { AdminCenter } from './views/AdminCenter';
import { SalesCenter } from './views/SalesCenter';

const VIEW_MODES: ViewMode[] = ['store', 'workspace', 'member', 'sales', 'admin'];
const savedViewMode = (): ViewMode => {
  const params = new URLSearchParams(window.location.search);
  const urlView = params.get('view') as ViewMode | null;
  if (urlView && VIEW_MODES.includes(urlView)) return urlView;
  if (params.has('system')) return 'store';
  try {
    const value = window.localStorage.getItem('krunest:last-view') as ViewMode | null;
    return value && VIEW_MODES.includes(value) ? value : 'store';
  } catch { return 'store'; }
};

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(savedViewMode);
  const [sessionReady, setSessionReady] = useState(false);
  const [detailSlug, setDetailSlug] = useState(new URLSearchParams(window.location.search).get('system'));
  const [session, setSession] = useState<MemberSession | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  // ระบบจริงที่ผู้ใช้มีสิทธิ์ (ไม่มีการเติมระบบตัวอย่างอัตโนมัติ)
  const [unlockedProgramIds, setUnlockedProgramIds] = useState<string[]>([]);
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
      setCurrentMemberTier(data.subscription?.plan_id || 'free');
    } catch { setSession(null); setUnlockedProgramIds([]); setCurrentMemberTier('free'); }
    finally { setSessionReady(true); }
  };
  useEffect(() => { refreshSession(); }, []);
  useEffect(() => {
    try { window.localStorage.setItem('krunest:last-view', viewMode); } catch { /* storage may be unavailable */ }
    const url = new URL(window.location.href);
    if (viewMode === 'store') {
      url.searchParams.delete('view');
      url.searchParams.delete('admin');
    } else {
      url.searchParams.set('view', viewMode);
      if (viewMode !== 'admin') url.searchParams.delete('admin');
    }
    window.history.replaceState({}, document.title, url);
  }, [viewMode]);
  useEffect(() => { const sync = () => setDetailSlug(new URLSearchParams(window.location.search).get('system')); window.addEventListener('popstate', sync); return () => window.removeEventListener('popstate', sync); }, []);
  useEffect(() => {
    if (!window.location.hash.includes('access_token=')) return;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token');
    if (!accessToken) return;
    window.history.replaceState({}, document.title, '/');
    api<{ user: AuthUser; csrfToken: string }>('/auth/google/session', { method: 'POST', body: { accessToken } })
      .then((result) => {
        setCsrfToken(result.csrfToken);
        setSession((current) => current ? { ...current, user: result.user, csrfToken: result.csrfToken } : { user: result.user, csrfToken: result.csrfToken, entitlements: [], subscription: null });
        return refreshSession();
      })
      .catch(() => setAuthOpen(true));
  }, []);

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST', body: {} }); } catch { /* clear local state even if session expired */ }
    setCsrfToken(''); setSession(null); setViewMode('store'); setUnlockedProgramIds([]);
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

      {!sessionReady && ['admin','sales','member'].includes(viewMode) ? <main className="flex-1 grid place-items-center p-8 bg-portal-mesh"><div className="text-sm font-bold text-slate-500">กำลังเปิดหน้าที่บันทึกไว้...</div></main> : viewMode === 'admin' && session?.user.role === 'admin' ? <AdminCenter /> : viewMode === 'sales' && session && ['admin','staff'].includes(session.user.role) ? <SalesCenter /> : viewMode === 'member' && session ? <MemberCenter session={session} onRefresh={refreshSession} /> : ['admin','sales','member'].includes(viewMode) && !session ? <main className="flex-1 grid place-items-center p-8 bg-portal-mesh"><div className="portal-card max-w-md p-8 text-center"><h1 className="text-2xl font-black">เข้าสู่ระบบเพื่อกลับไปหน้าที่เปิดไว้</h1><p className="text-sm text-slate-500 mt-2 mb-5">เซสชันหมดอายุหรือยังไม่ได้เข้าสู่ระบบ หน้าปัจจุบันยังถูกเก็บไว้และจะไม่พากลับหน้าหลัก</p><button onClick={()=>setAuthOpen(true)} className="primary-button">เข้าสู่ระบบ / สมัครสมาชิก</button></div></main> : viewMode === 'workspace' ? (
        <main className="flex-1">
          <CloudWorkspaceView
            activeAppId={activeCloudAppId}
            onSelectApp={(id) => setActiveCloudAppId(id)}
            activePlanId={activePlanId}
            onChangePlan={(planId) => setActivePlanId(planId)}
            onBackToStore={() => setViewMode('store')}
          />
        </main>
      ) : detailSlug ? <HtmlPluginDetail slug={detailSlug} unlockedProgramIds={unlockedProgramIds} isAdmin={session?.user.role === 'admin'} loggedIn={Boolean(session)} onLogin={() => setAuthOpen(true)} onOrder={setActiveOrderTarget}/> : (
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
          setViewMode(session ? 'member' : 'store');
        }}
      />
    </div>
  );
}
