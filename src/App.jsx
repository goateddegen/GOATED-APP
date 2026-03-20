import React, { useEffect, useState, lazy, Suspense, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useStore } from './hooks/useStore';
import Sidebar from './components/Sidebar';
import Ticker from './components/Ticker';
import SearchModal from './components/SearchModal';
import KeybindsModal from './components/KeybindsModal';
import LeadDetail from './components/LeadDetail';
import AIOverlay from './components/AIOverlay';
import AccountModal from './components/AccountModal';
import Onboarding from './components/Onboarding';
import { onAuthStateChange, trackPerformance, trackPageView } from './lib/supabase';

const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LeadsPage = lazy(() => import('./pages/LeadsPage'));
const TrendsPage = lazy(() => import('./pages/TrendsPage'));
const MarketPage = lazy(() => import('./pages/MarketPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const BuilderPage = lazy(() => import('./pages/BuilderPage'));
const WhopPage = lazy(() => import('./pages/WhopPage'));
const LaunchPadPage = lazy(() => import('./pages/LaunchPadPage'));
const CasinoPage = lazy(() => import('./pages/CasinoPage'));
const CommsPage = lazy(() => import('./pages/CommsPage'));
const FinderPage = lazy(() => import('./pages/FinderPage'));

// Loading fallback — NO black background, NO framer-motion delays
// Renders instantly visible to prevent any dark flash during lazy loading
function LoadingFallback() {
  return (
    <div className="suspense-fallback flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 border-2 border-brand/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-brand rounded-full animate-spin" />
        </div>
        <span className="text-brand text-xs animate-pulse tracking-[0.25em] uppercase font-medium">Loading</span>
      </div>
    </div>
  );
}

// Custom cursor — high-perf dot + ring, throttled hover detection
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const hoveringRef = useRef(false);
  const mouseRef = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const rafRef = useRef(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    let lastHoverCheck = 0;
    const tick = (now) => {
      const { x, y } = mouseRef.current;
      // Ring follows with smooth lerp
      ringPos.current.x += (x - 14 - ringPos.current.x) * 0.2;
      ringPos.current.y += (y - 14 - ringPos.current.y) * 0.2;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }
      // Throttled hover detection — check every 200ms, skip during transitions
      if (now - lastHoverCheck > 200) {
        lastHoverCheck = now;
        // Skip expensive elementFromPoint if mouse hasn't moved (avoids layout thrash during transitions)
        if (x > 0 && y > 0) {
          try {
            const el = document.elementFromPoint(x, y);
            if (el) {
              const isInteractive = el.closest('button, a, [role="button"], input, select, textarea, [data-clickable]');
              if (isInteractive && !hoveringRef.current) {
                hoveringRef.current = true;
                ringRef.current?.classList.add('hovering');
              } else if (!isInteractive && hoveringRef.current) {
                hoveringRef.current = false;
                ringRef.current?.classList.remove('hovering');
              }
            }
          } catch { /* ignore during DOM teardown */ }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // Dot: INSTANT position — direct DOM write on mousemove
    const onMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX - 3}px, ${e.clientY - 3}px, 0)`;
      }
      // Show cursor if it was hidden
      if (!visibleRef.current) {
        visibleRef.current = true;
        if (dotRef.current) dotRef.current.style.opacity = '1';
        if (ringRef.current) ringRef.current.style.opacity = '1';
      }
    };

    // Hide cursor when mouse leaves window
    const onLeave = () => {
      visibleRef.current = false;
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}

// Page fade-in — pure CSS animation, zero React state, cannot get stuck
// The key prop forces React to create a new DOM node, replaying the animation
function PageFadeIn({ children, pageKey }) {
  return (
    <div key={pageKey} className="page-fade-in">
      {children}
    </div>
  );
}

// Error Boundary — catches component crashes and shows recovery UI
// WITHOUT this, any thrown error in a page component causes a permanent black screen
class PageErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('[GOATED] Page crash caught by error boundary:', error, info?.componentStack); }
  componentDidUpdate(prevProps) {
    // Auto-recover when user navigates to a different page
    if (prevProps.pageKey !== this.props.pageKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen p-8">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-6">
              This page encountered an error. Click below to recover.
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); useStore.getState().setPage('home'); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-emerald-400 text-black font-semibold text-sm rounded-lg transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    let timeout;
    const onResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsMobile(window.innerWidth < 768), 150);
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return isMobile;
}

export default function App() {
  // Use individual selectors to avoid re-rendering on every store change
  const page = useStore(s => s.page);
  const setPage = useStore(s => s.setPage);
  const sidebar = useStore(s => s.sidebar);
  const toggleSidebar = useStore(s => s.toggleSidebar);
  const searchOpen = useStore(s => s.searchOpen);
  const setSearchOpen = useStore(s => s.setSearchOpen);
  const keybindsOpen = useStore(s => s.keybindsOpen);
  const setKeybindsOpen = useStore(s => s.setKeybindsOpen);
  const aiOpen = useStore(s => s.aiOpen);
  const setAiOpen = useStore(s => s.setAiOpen);
  const selectedLead = useStore(s => s.selectedLead);
  const detailOpen = useStore(s => s.detailOpen);
  const setDetailOpen = useStore(s => s.setDetailOpen);
  const setSelectedLead = useStore(s => s.setSelectedLead);
  const setMobileMenu = useStore(s => s.setMobileMenu);
  const setPreviousPage = useStore(s => s.setPreviousPage);
  const accountModalOpen = useStore(s => s.accountModalOpen);
  const setAccountModalOpen = useStore(s => s.setAccountModalOpen);
  const onboardingComplete = useStore(s => s.onboardingComplete);
  const setUser = useStore(s => s.setUser);
  const setIsLoggedIn = useStore(s => s.setIsLoggedIn);
  const setUserPlan = useStore(s => s.setUserPlan);
  const degenMode = useStore(s => s.degenMode);
  const isMobile = useIsMobile();

  // Restore persisted user session on mount + Supabase auth listener
  useEffect(() => {
    const savedUser = localStorage.getItem('goated_current_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setIsLoggedIn(true);
        setUserPlan(parsed.plan || 'free');
      } catch (e) { /* ignore */ }
    }

    // Listen for Supabase auth state changes (OAuth callbacks, token refresh, etc.)
    const { data } = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const u = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url,
          plan: 'free',
          provider: session.user.app_metadata?.provider || 'email',
        };
        setUser(u);
        setIsLoggedIn(true);
        localStorage.setItem('goated_current_user', JSON.stringify(u));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('goated_current_user');
      }
    });

    // Performance monitoring (Web Vitals)
    const perfObserver = trackPerformance();

    return () => {
      data?.subscription?.unsubscribe();
      perfObserver?.disconnect();
    };
  }, []);

  // Track page views
  useEffect(() => {
    trackPageView(page);
  }, [page]);

  // Debounced page navigation — prevents choppy rapid-fire page switching
  const lastNavRef = useRef(0);
  const navTo = useCallback((target) => {
    const now = Date.now();
    if (now - lastNavRef.current < 150) return; // 150ms debounce
    lastNavRef.current = now;
    setDetailOpen(false);
    setPage(target);
  }, [setDetailOpen, setPage]);

  useEffect(() => {
    const onKey = (e) => {
      // Never intercept keystrokes in form fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      const key = e.key.toLowerCase();
      const hasModifier = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+K — universal search (works always)
      if (hasModifier && e.key === 'k') { e.preventDefault(); setSearchOpen(true); return; }

      // Escape — close overlays in priority order (topmost first)
      if (e.key === 'Escape') {
        e.preventDefault();
        const s = useStore.getState();
        if (s.searchOpen) { setSearchOpen(false); return; }
        if (s.keybindsOpen) { setKeybindsOpen(false); return; }
        if (s.accountModalOpen) { setAccountModalOpen(false); return; }
        if (s.aiOpen) { setAiOpen(false); return; }
        if (s.detailOpen) { setDetailOpen(false); return; }
        if (s.mobileMenu) { setMobileMenu(false); return; }
        return;
      }

      // Block all keybinds when any modal/overlay is open (except keybinds modal which handles nav)
      const state = useStore.getState();
      if (state.searchOpen || state.accountModalOpen) return;

      // If AI overlay is open, only allow Escape (handled above) — don't navigate
      if (state.aiOpen) return;

      // If keybinds modal is open, handle navigation keys then close
      if (state.keybindsOpen) {
        e.preventDefault();
        const keybindNav = { h: 'home', d: 'dashboard', l: 'leads', t: 'trends', c: 'market', w: 'wallet', x: 'admin', u: 'whop', p: 'casino', m: 'market', r: 'launchpad', v: 'comms', f: 'finder' };
        const target = keybindNav[key];
        setKeybindsOpen(false);
        if (target) { navTo(target); }
        else if (key === 'g') { setAiOpen(true); }
        else if (key === 's') { toggleSidebar(); }
        else if (key === 'a') { setAccountModalOpen(true); }
        return;
      }

      // Skip if modifier keys are held (except Escape/Cmd+K handled above)
      if (hasModifier) return;

      // Navigation map — single lookup
      const navMap = { h: 'home', d: 'dashboard', l: 'leads', t: 'trends', c: 'market', w: 'wallet', x: 'admin', u: 'whop', r: 'launchpad', p: 'casino', v: 'comms', f: 'finder' };
      const navTarget = navMap[key];
      if (navTarget) {
        e.preventDefault();
        navTo(navTarget);
        return;
      }

      // Action keys
      if (key === 's') { e.preventDefault(); toggleSidebar(); }
      else if (key === '/' || key === '?') { e.preventDefault(); setKeybindsOpen(true); }
      else if (key === 'g') { e.preventDefault(); setAiOpen(true); }
      else if (key === 'a') { e.preventDefault(); setAccountModalOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navTo]);

  const selectLead = useCallback((l) => { setPreviousPage(page); setSelectedLead(l); setDetailOpen(true); }, [page, setPreviousPage, setSelectedLead, setDetailOpen]);
  const mainML = isMobile ? 0 : (sidebar ? 240 : 72);

  // No useMemo — prevents stale renders & black screen during rapid page switching
  const renderPage = () => {
    switch (page) {
      case 'home': return <HomePage />;
      case 'dashboard': return <DashboardPage onSelect={selectLead} />;
      case 'leads': return <LeadsPage onSelect={selectLead} />;
      case 'trends': return <TrendsPage />;
      case 'market': return <MarketPage />;
      case 'wallet': return <WalletPage />;
      case 'admin': return <AdminPage />;
      case 'builder': return <BuilderPage />;
      case 'whop': return <WhopPage />;
      case 'launchpad': return <LaunchPadPage />;
      case 'casino': return <CasinoPage />;
      case 'comms': return <CommsPage />;
      case 'finder': return <FinderPage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className={`min-h-screen bg-surface-0 text-slate-100 font-sans noise-overlay ${degenMode ? 'degen-mode' : ''}`}>
      {/* Skip to content for keyboard/screen reader users */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-1/2 focus:-translate-x-1/2 focus:z-[100] focus:bg-brand focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium">
        Skip to main content
      </a>
      {!isMobile && <CustomCursor />}
      <Ticker />
      <Sidebar />
      <main
        id="main-content"
        role="main"
        className="transition-[margin-left] duration-300 pt-0 sm:pt-9"
        style={{ marginLeft: mainML }}
      >
        <PageErrorBoundary pageKey={detailOpen ? 'lead-detail' : page}>
          <Suspense fallback={<LoadingFallback />}>
            {detailOpen && selectedLead ? (
              <PageFadeIn pageKey="lead-detail">
                <LeadDetail />
              </PageFadeIn>
            ) : (
              <PageFadeIn pageKey={page}>
                {renderPage()}
              </PageFadeIn>
            )}
          </Suspense>
        </PageErrorBoundary>
      </main>
      <AnimatePresence>
        {searchOpen && <SearchModal key="search" />}
        {keybindsOpen && <KeybindsModal key="keybinds" />}
        {aiOpen && <AIOverlay key="ai" />}
        {accountModalOpen && <AccountModal key="account" />}
      </AnimatePresence>
      {!onboardingComplete && <Onboarding />}
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
