import React, { useEffect, useState, lazy, Suspense, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useStore } from './hooks/useStore';
import Sidebar from './components/Sidebar';
// NotchBar removed v7.4 — conflicted with AI overlay. AI overlay is the one AI surface.
import SearchModal from './components/SearchModal';
import KeybindsModal from './components/KeybindsModal';
// Lazy: at 188 kB this is the largest module in the app and it renders only
// after someone opens a specific lead, yet it was in the entry bundle for
// every visitor including anyone who never signs in. It already sits inside
// the Suspense boundary below, so nothing about the UI changes.
const LeadDetail = React.memo(lazy(() => import('./components/LeadDetail')));
// AIOverlay is 2600+ LOC + framer-motion + voice synth imports — lazy-load so first-paint stays thin.
const AIOverlay = lazy(() => import('./components/AIOverlay'));
import AccountModal from './components/AccountModal';
import { onAuthStateChange, trackPerformance, trackPageView, startAutoSync, stopAutoSync, loadUserDataFromCloud, supabase, getUser, authedFetch } from './lib/supabase';
import { PAGE_KEYBINDS, isPageEnabled, isAdminEmail, NAV_PAGES } from './lib/config';

// Lazy-loaded pages wrapped in React.memo to reduce CSR overhead on re-renders
const HomePage = React.memo(lazy(() => import('./pages/HomePage')));
const DashboardPage = React.memo(lazy(() => import('./pages/DashboardPage')));
const LeadsPage = React.memo(lazy(() => import('./pages/LeadsPage')));
const TrendsPage = React.memo(lazy(() => import('./pages/TrendsPage')));
// MarketPage merged into TrendsPage — kept for reference
// const MarketPage = lazy(() => import('./pages/MarketPage'));
const WalletPage = React.memo(lazy(() => import('./pages/WalletPage')));
const AdminPage = React.memo(lazy(() => import('./pages/AdminPage')));
// Revenue Loss Auditor. Account-walled; permalinks at /#/a/{shareId}.
const AuditPage = React.memo(lazy(() => import('./pages/AuditPage')));
// v7.5 cover page — shown until VITE_LAUNCH_READY === 'true' is set in env vars.
// Eagerly imported (not lazy) so it shows instantly with no loading flash.
import ComingSoonPage from './pages/ComingSoonPage';
const RecruitingPage = React.memo(lazy(() => import('./pages/RecruitingPage')));
// ManagedPage removed v7.4 — "managed" is just the top B2B tier, not a separate product.
// Enterprise sell moved into HomePage hero + Leads page CTA. No booking calls surface.
// BuilderPage, WhopPage, LaunchPadPage removed
// CasinoPage removed — fake bets/P&L, will rethink tied to TrendPulse later
// CommsPage and FinderPage removed — outreach built into leads side

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
// On low-perf devices (<=4 logical cores or deviceMemory<=4), skip the ring entirely
const isLowPerf = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
  (navigator.deviceMemory && navigator.deviceMemory <= 4);

function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const hoveringRef = useRef(false);
  const mouseRef = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const rafRef = useRef(null);
  const visibleRef = useRef(true);
  const showRing = !isLowPerf;

  useEffect(() => {
    let lastHoverCheck = 0;
    // Track the current page to skip elementFromPoint during transitions
    let lastPage = useStore.getState().page;
    let transitioning = false;
    let transitionTimer = null;
    const unsub = useStore.subscribe((state) => {
      if (state.page !== lastPage) {
        lastPage = state.page;
        transitioning = true;
        clearTimeout(transitionTimer);
        transitionTimer = setTimeout(() => { transitioning = false; }, 600);
      }
    });

    const tick = (now) => {
      // Pause entirely when tab is hidden
      if (document.hidden) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const { x, y } = mouseRef.current;
      // Ring follows with smooth lerp
      if (showRing) {
        ringPos.current.x += (x - 14 - ringPos.current.x) * 0.45;
        ringPos.current.y += (y - 14 - ringPos.current.y) * 0.45;
        if (ringRef.current) {
          ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
        }
      }
      // Hover detection via CSS pointer-events — no more elementFromPoint reflows
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
        if (showRing && ringRef.current) ringRef.current.style.opacity = '1';
      }
    };

    // Hide cursor when mouse leaves window
    const onLeave = () => {
      visibleRef.current = false;
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (showRing && ringRef.current) ringRef.current.style.opacity = '0';
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(transitionTimer);
      unsub();
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" style={{ willChange: 'transform' }} aria-hidden="true" />
      {showRing && <div ref={ringRef} className="cursor-ring" style={{ willChange: 'transform' }} aria-hidden="true" />}
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
  componentDidCatch(error, info) {
    // Structured error reporting for observability
    const errorReport = {
      type: 'component_error',
      component: this.props.pageKey || 'unknown',
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
      },
      componentStack: info?.componentStack?.split('\n').slice(0, 5).join('\n'),
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    console.error('[GOATED] Error Boundary Report:', JSON.stringify(errorReport, null, 2));
    // Also fire as a trackEvent if available
    try { trackPageView && trackPageView('error_boundary_' + (this.props.pageKey || 'unknown')); } catch {}
  }
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
  const pendingLeadId = useStore(s => s.pendingLeadId);
  const setPendingLeadId = useStore(s => s.setPendingLeadId);
  const hydrateStoredLeads = useStore(s => s.hydrateStoredLeads);
  const setMobileMenu = useStore(s => s.setMobileMenu);
  const setPreviousPage = useStore(s => s.setPreviousPage);
  const accountModalOpen = useStore(s => s.accountModalOpen);
  const setAccountModalOpen = useStore(s => s.setAccountModalOpen);
  const setUser = useStore(s => s.setUser);
  const setIsLoggedIn = useStore(s => s.setIsLoggedIn);
  const isLoggedIn = useStore(s => s.isLoggedIn);
  const user = useStore(s => s.user);
  // Privilege decisions read this, never `user` (localStorage-backed).
  const verifiedEmail = useStore(s => s.verifiedEmail);
  const setVerifiedEmail = useStore(s => s.setVerifiedEmail);
  const setUserPlan = useStore(s => s.setUserPlan);
  const degenMode = useStore(s => s.degenMode);
  const isMobile = useIsMobile();
  const [showKeyHint, setShowKeyHint] = useState(true);
  // False until Supabase has told us whether a session exists. requireAuth must
  // not bounce anyone before this flips, or a signed-in user gets the login
  // modal thrown at them on every page load.
  const [authChecked, setAuthCheckedLocal] = useState(!supabase);
  const setAuthCheckedStore = useStore(s => s.setAuthChecked);
  // Kept in both places: App renders off the local copy, and the store copy
  // lets gates outside this component (the assistant) wait for the same signal.
  const setAuthChecked = useCallback((v) => {
    setAuthCheckedLocal(v);
    setAuthCheckedStore(v);
  }, [setAuthCheckedStore]);

  // Scroll to top on ANY view change — page nav, detail open/close, etc.
  useEffect(() => {
    window.scrollTo(0, 0);
    // Also force the main element to scroll top (catches overflow containers)
    document.getElementById('main-content')?.scrollTo(0, 0);
  }, [page, detailOpen]);

  // Auto-hide keyboard shortcut hint after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowKeyHint(false), 10000);
    return () => clearTimeout(timer);
  }, []);

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
    //
    // INITIAL_SESSION is essential and was missing: supabase-js fires that — not
    // SIGNED_IN — when it rehydrates an existing session on page load, including
    // when it picks the tokens out of the URL after an OAuth redirect. Handling
    // only SIGNED_IN meant a returning user's session was never adopted from
    // Supabase and we fell back to whatever localStorage happened to hold.
    const adopt = (session) => {
      const su = session.user;
      const admin = isAdminEmail(su.email);
      const u = {
        id: su.id,
        email: su.email,
        name: su.user_metadata?.full_name || su.email?.split('@')[0],
        avatar: su.user_metadata?.avatar_url,
        // Match AccountModal.finalizeUser so the two entry points agree.
        isAdmin: admin,
        plan: admin ? 'enterprise' : 'free',
        provider: su.app_metadata?.provider || 'email',
      };
      setUser(u);
      setIsLoggedIn(true);
      setUserPlan(u.plan);
      // Confirm admin status with the SERVER rather than trusting this client's
      // own reading of the session. The browser now asks; it does not decide.
      // Set optimistically to the session email so the UI isn't blocked on a
      // round-trip, then corrected by the server's answer.
      setVerifiedEmail(su.email);
      authedFetch('/api/leads?action=whoami')
        .then(r => r.json())
        .then(({ isAdmin }) => {
          // If the server disagrees, the server wins.
          if (!isAdmin && isAdminEmail(su.email)) setVerifiedEmail(null);
        })
        .catch(() => { /* keep the optimistic value; nav gate still applies */ });
      localStorage.setItem('goated_current_user', JSON.stringify(u));
      loadUserDataFromCloud(su.id).then(() => startAutoSync(su.id));
    };

    const { data } = onAuthStateChange((event, session) => {
      if (session?.user && ['SIGNED_IN', 'INITIAL_SESSION', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        adopt(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoggedIn(false);
        setVerifiedEmail(null);
        localStorage.removeItem('goated_current_user');
        stopAutoSync();
      }
      // Whatever the outcome, we now know the answer — release the auth gate.
      // INITIAL_SESSION fires even with no session, so this always runs.
      setAuthChecked(true);
    });

    // Don't depend solely on the listener. If INITIAL_SESSION is late, fires with
    // null, or the stored token has expired, verifiedEmail would stay null and the
    // operator silently loses Admin while still appearing signed in. getUser()
    // validates the token server-side, so this both rehydrates and revokes.
    (async () => {
      if (!supabase) { setAuthChecked(true); return; }
      try {
        const { data, error } = await getUser();
        if (!error && data?.user) {
          adopt({ user: data.user });
        } else if (localStorage.getItem('goated_current_user')) {
          // Stored session is no longer valid — clear it rather than showing a
          // logged-in shell with no privileges.
          setUser(null);
          setIsLoggedIn(false);
          setVerifiedEmail(null);
          localStorage.removeItem('goated_current_user');
        }
      } catch { /* listener + timeout still cover us */ }
      setAuthChecked(true);
    })();

    // Final fallback: never leave protected pages hanging.
    const authTimeout = setTimeout(() => setAuthChecked(true), 3000);

    // Performance monitoring (Web Vitals)
    const perfObserver = trackPerformance();

    return () => {
      clearTimeout(authTimeout);
      data?.subscription?.unsubscribe();
      perfObserver?.disconnect();
      stopAutoSync();
    };
  }, []);

  // Track page views
  useEffect(() => {
    trackPageView(page);
  }, [page]);

  // Hash router — the app stays a lazy-loaded SPA; these are the permalinks
  // into it.
  //   /#/a/{shareId}        saved audit report
  //   /#/lead/{placeId}     one lead, resolved from Google's place id
  //   /#/for/{slug}         legacy audit link, re-runs live
  //   /#/{page}             any nav page — home, audit, leads, dashboard, admin
  //
  // Re-runs when the session resolves. Dashboard and admin open the account
  // wall for a signed-out visitor; a lead or audit permalink does not. This
  // also has to fire once we know they are signed in and were waiting on that.
  useEffect(() => {
    const resolveHash = () => {
      const h = window.location.hash || '';
      const lead = h.match(/^#\/lead\/([A-Za-z0-9_-]{10,})/);
      if (lead) {
        setPendingLeadId(lead[1]);
        setPage('leads');
        return;
      }
      if (/^#\/(a\/|for\/)/i.test(h)) {
        setPage('audit');
        return;
      }
      if (/^#\/managed/i.test(h)) {
        // Managed consolidated into B2B leads v7.4
        setPage('leads');
        return;
      }
      // Every nav page by name. setPage has been WRITING these to the address
      // bar since the URL sync went in, but nothing read them back — so the bar
      // showed #/dashboard and loading that same URL landed you on Home. The
      // link was real in one direction only.
      //
      // isPageEnabled inside setPage still decides: an admin link opened by a
      // non-admin redirects to Home rather than rendering, so a permalink
      // cannot be used to reach a page the account is not entitled to.
      const named = h.match(/^#\/([a-z]+)\/?$/i);
      if (named && NAV_PAGES.includes(named[1].toLowerCase())) {
        setPage(named[1].toLowerCase());
      }
    };
    resolveHash();
    window.addEventListener('hashchange', resolveHash);
    return () => window.removeEventListener('hashchange', resolveHash);
  }, [setPage, setPendingLeadId, isLoggedIn, authChecked]);

  // Bring the deep lead store into memory once, after first paint. localStorage
  // covers the first render; this restores everything past its cap.
  useEffect(() => { hydrateStoredLeads?.(); }, [hydrateStoredLeads]);

  // Resolve a lead permalink for anyone, signed in or not.
  //
  // Fetched by place id rather than looked up in the local store, so the link
  // opens for someone whose browser has never run a search — which is the whole
  // point of being able to send it to someone.
  useEffect(() => {
    if (!pendingLeadId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/leads?action=place&id=${encodeURIComponent(pendingLeadId)}`);
        const d = r.ok ? await r.json() : null;
        if (cancelled) return;
        if (d?.lead) {
          setSelectedLead(d.lead);
          setDetailOpen(true);
        }
      } catch { /* leaves them on the leads list, which is a reasonable landing */ }
      if (!cancelled) setPendingLeadId(null);
    })();
    return () => { cancelled = true; };
  }, [pendingLeadId, setPendingLeadId, setSelectedLead, setDetailOpen]);

  // Debounced page navigation — prevents choppy rapid-fire page switching
  // Also scrolls to top so pages never open mid-scroll
  const lastNavRef = useRef(0);
  const lastNavKeyRef = useRef('');
  const navTo = useCallback((target) => {
    const now = Date.now();
    if (now - lastNavRef.current < 150) return; // 150ms debounce
    lastNavRef.current = now;
    setDetailOpen(false);
    setPage(target);
    // Immediate scroll — no smooth animation, just snap to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // Re-scroll after React render in case lazy content shifts position
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      const main = document.getElementById('main-content');
      if (main) {
        const focusable = main.querySelector('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) focusable.focus({ preventScroll: true });
      }
    });
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

      // If AI overlay is open, allow 'G' to toggle it closed, block other keybinds
      if (state.aiOpen) {
        if (key === 'g') { e.preventDefault(); setAiOpen(false); }
        return;
      }

      // If keybinds modal is open, handle navigation keys then close
      if (state.keybindsOpen) {
        e.preventDefault();
        const target = PAGE_KEYBINDS[key];
        // Admin keybind is inert without an admin session.
        if (target && !isPageEnabled(target, useStore.getState().verifiedEmail)) { setKeybindsOpen(false); return; }
        setKeybindsOpen(false);
        if (target) { navTo(target); }
        else if (key === 'g') { setAiOpen(true); }
        else if (key === 's') { toggleSidebar(); }
        else if (key === 'a') { setAccountModalOpen(true); }
        return;
      }

      // Shift+D removed — degen is a fixed theme now, not a mode.

      // Skip if modifier keys are held (except Escape/Cmd+K handled above)
      if (hasModifier) return;

      // Navigation map — single lookup, sourced from config so disabled pages
      // (TrendPulse, Wallet) have no binding at all rather than a silent one.
      // Debounce same-key rapid presses (200ms) to reduce CSR overhead on low-memory devices
      const navTarget = PAGE_KEYBINDS[key];
      if (navTarget && isPageEnabled(navTarget, useStore.getState().verifiedEmail)) {
        const now = Date.now();
        if (key === lastNavKeyRef.current && now - lastNavRef.current < 200) return;
        lastNavKeyRef.current = key;
        e.preventDefault();
        navTo(navTarget);
        return;
      }

      // Action keys
      if (key === 's') { e.preventDefault(); toggleSidebar(); }
      else if (key === '/' || key === '?') { e.preventDefault(); setKeybindsOpen(true); }
      else if (key === 'g') { e.preventDefault(); setAiOpen(!useStore.getState().aiOpen); }
      else if (key === 'a') { e.preventDefault(); setAccountModalOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navTo]);

  // The permalink is written by setSelectedLead in the store, so every route
  // into a lead gets one — not just this one.
  const selectLead = useCallback((l) => {
    setPreviousPage(page);
    setSelectedLead(l);
    setDetailOpen(true);
  }, [page, setPreviousPage, setSelectedLead, setDetailOpen]);
  const mainML = isMobile ? 0 : (sidebar ? 240 : 72);

  // Account pages. Everything else is usable signed out. Data that belongs
  // to an account (saved leads, cloud sync) still requires a session.
  const PROTECTED_PAGES = new Set(['dashboard', 'admin']);

  // Lightweight auth gate — when launch-ready and visitor isn't logged in,
  // gently redirect them to homepage and pop the AccountModal.
  const requireAuth = (renderFn) => {
    if (isLoggedIn) return renderFn();
    // Session state isn't known yet. Wait rather than assume "logged out" —
    // otherwise a signed-in user gets bounced to Home with the login modal on
    // every single page load, before Supabase has had a chance to rehydrate.
    if (!authChecked) return <LoadingFallback />;
    // Defer state updates to next tick to avoid React render-time setState.
    setTimeout(() => { setAccountModalOpen(true); setPage('home'); }, 0);
    return <HomePage />;
  };

  // A saved audit link is also a way through the public cover, so a prospect
  // can open the report they were sent before the site is generally live.
  const isSavedAuditLink = (typeof window !== 'undefined' &&
    /^#\/a\/[a-z0-9]{6,32}/i.test(window.location.hash || ''));

  // No useMemo — prevents stale renders & black screen during rapid page switching
  const renderPage = () => {
    // A signed-in non-admin never sees the admin tools, even if the page id
    // was set while the session was still resolving.
    if (page === 'admin' && isLoggedIn && !isPageEnabled(page, verifiedEmail)) return <HomePage />;

    if (PROTECTED_PAGES.has(page)) {
      switch (page) {
        case 'dashboard': return requireAuth(() => <DashboardPage onSelect={selectLead} />);
        case 'admin':     return requireAuth(() => <AdminPage />);
      }
    }

    // Anything not in NAV_PAGES renders Home.
    if (!isPageEnabled(page, verifiedEmail)) return <HomePage />;
    switch (page) {
      case 'home':  return <HomePage />;
      case 'leads': return <LeadsPage onSelect={selectLead} />;
      case 'audit': return <AuditPage />;
      default:      return <HomePage />;
    }
  };

  // ───────────────────────────────────────────────────────────────────────
  // v7.5 LAUNCH GATE — show ComingSoonPage until VITE_LAUNCH_READY === 'true'
  // -----------------------------------------------------------------------
  // The full app codebase still ships in the bundle (so previews/audits work
  // for operator/admin), but the public surface is hidden behind the cover.
  // To bypass locally for preview, set localStorage.goated_operator_preview = '1'.
  // To go live in production, set VITE_LAUNCH_READY=true in Vercel env vars.
  // ───────────────────────────────────────────────────────────────────────
  const launchReady = (import.meta.env.VITE_LAUNCH_READY === 'true');
  const operatorPreview = (typeof window !== 'undefined' &&
    (localStorage.getItem('goated_operator_preview') === '1' ||
     window.location.hash.toLowerCase().includes('preview=1')));

  // A signed-in user is never shown the cover page. Reaching a session means
  // Google authenticated them AND — while the OAuth app is in Testing mode —
  // that they're on the test-user allow list. That's a stronger gate than an
  // env var, and it means the cover can stay up for the public while the
  // operator uses the real app in production. Without this, signing in
  // succeeded and then dumped you straight back onto the cover.
  const isMidOAuthRedirect = (typeof window !== 'undefined' &&
    /access_token=|code=/.test(window.location.hash || window.location.search || ''));


  // recruiting.goated.solutions is its own site: same theme, no sales app,
  // and no launch cover. #/recruiting previews it on any host.
  const isRecruitingSite = typeof window !== 'undefined' && (
    window.location.hostname === 'recruiting.goated.solutions'
    || (window.location.hash || '').startsWith('#/recruiting')
  );
  if (isRecruitingSite) {
    return (
      <div className="min-h-screen bg-black text-slate-100 font-sans" style={{ '--brand-rgb': '239 68 68' }}>
        {!isMobile && <CustomCursor />}
        <Suspense fallback={<LoadingFallback />}>
          <RecruitingPage />
        </Suspense>
        <Analytics />
        <SpeedInsights />
      </div>
    );
  }

  if (!launchReady && !isLoggedIn && !isMidOAuthRedirect && !operatorPreview && !isSavedAuditLink) {
    return <ComingSoonPage />;
  }

  return (
    <div className={`min-h-screen bg-surface-0 text-slate-100 font-sans noise-overlay ${degenMode ? 'degen-mode' : ''}`}>
      {/* Skip to content for keyboard/screen reader users */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-1/2 focus:-translate-x-1/2 focus:z-[100] focus:bg-brand focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium">
        Skip to main content
      </a>
      {!isMobile && <CustomCursor />}
      <Sidebar />
      <main
        id="main-content"
        role="main"
        className="transition-[margin-left] duration-300 pt-0"
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
        {accountModalOpen && <AccountModal key="account" />}
      </AnimatePresence>
      <PageErrorBoundary pageKey="ai-overlay">
        {/* Defer AIOverlay mount until first open — shaves ~300KB off initial JS */}
        {aiOpen && (
          <Suspense fallback={null}>
            <AIOverlay />
          </Suspense>
        )}
      </PageErrorBoundary>
      {/* Keyboard shortcut hint — fades out after 10s */}
      {showKeyHint && (
        <div
          className="fixed bottom-4 left-4 z-30 text-[11px] text-slate-500 font-mono bg-black/60 backdrop-blur border border-white/[0.05] rounded-lg px-3 py-1.5 pointer-events-none"
          style={{ animation: 'fadeInOut 10s ease-in-out forwards' }}
        >
          Press <kbd className="text-slate-400 bg-white/[0.06] border border-white/[0.08] rounded px-1 py-0.5">?</kbd> for shortcuts
        </div>
      )}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; }
          5% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes degenFlash {
          0%   { opacity: 0; transform: translate(-50%, -8px) scale(0.92); }
          18%  { opacity: 1; transform: translate(-50%, 0) scale(1); }
          70%  { opacity: 1; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -4px) scale(0.96); }
        }
      `}</style>
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
