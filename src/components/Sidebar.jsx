import React from 'react';
import { Home, LayoutDashboard, Users, TrendingUp, Zap, BarChart3, Target, Wallet, Bot, Keyboard, Search, ChevronLeft, ChevronRight, Menu, X, Sparkles, User, Shield, Flame, Rocket, Dice5, Award, Crown } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { isPageEnabled } from '../lib/config';
import { GoatIcon } from './GoatLogo';

// v7.5 — AGENCY-FIRST POSITIONING
// Primary surface: Audit (the closer) → Leads (internal target lists) → Dashboard (track closes).
// Hidden but routable (still Cmd+K / direct hash): TrendPulse (T), Wallet (W).
// TrendPulse will be repositioned to BizPulse (regional industry health) post-revenue.
// Wallet stays for Stripe Payment Links flow but isn't a primary nav surface in v1.
const nav = [
  { id: 'home', icon: Home, label: 'Home', key: 'H' },
  { id: 'audit', icon: Award, label: 'Audit', key: 'U', badge: 'CLOSER' },
  { id: 'leads', icon: Users, label: 'Leads', key: 'L' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', key: 'D' },
  // Operator-only — filtered out below for everyone else. Dashboard is the
  // highest surface a normal user sees.
  { id: 'admin', icon: Shield, label: 'Admin', key: 'X', badge: 'PRO' },
];

// TrendPulse + Wallet are fully disabled for launch — see DISABLED_PAGES in
// lib/config.js. They are unreachable by nav, keybind, Cmd+K, AI navigation, and
// deep link. To bring one back: add its id to NAV_PAGES, give it a key in
// PAGE_KEYBINDS, restore its case in App.jsx renderPage, and add an entry here.

export default function Sidebar() {
  const page = useStore(s => s.page);
  const setPage = useStore(s => s.setPage);
  const sidebar = useStore(s => s.sidebar);
  const toggleSidebar = useStore(s => s.toggleSidebar);
  const setAiOpen = useStore(s => s.setAiOpen);
  const setKeybindsOpen = useStore(s => s.setKeybindsOpen);
  const setSearchOpen = useStore(s => s.setSearchOpen);
  const mobileMenu = useStore(s => s.mobileMenu);
  const setMobileMenu = useStore(s => s.setMobileMenu);
  const setAccountModalOpen = useStore(s => s.setAccountModalOpen);
  const isLoggedIn = useStore(s => s.isLoggedIn);
  // `user` is for DISPLAY only (name, avatar). Privilege decisions use
  // verifiedEmail, which comes from a confirmed Supabase session.
  const user = useStore(s => s.user);
  const verifiedEmail = useStore(s => s.verifiedEmail);
  const degenMode = useStore(s => s.degenMode);
  const toggleDegenMode = useStore(s => s.toggleDegenMode);
  const triggerConfetti = useStore(s => s.triggerConfetti);

  const navContent = (expanded) => (
    <>
      {/* Logo with neon effect — clickable to homepage. Fixed height prevents vertical shift during expand/collapse. */}
      <button
        onClick={() => { setPage('home'); setMobileMenu(false); window.scrollTo(0, 0); }}
        aria-label="Go to homepage"
        className="w-full h-[72px] px-4 border-b border-white/[0.03] flex items-center gap-3 relative overflow-hidden group hover:bg-white/[0.02] transition-colors flex-shrink-0"
      >
        {/* Ambient glow behind logo */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />
        <div className="relative text-brand flex-shrink-0" aria-hidden="true">
          <GoatIcon />
          {/* Neon ring pulse */}
          <div className="absolute inset-0 rounded-full border border-brand/30 animate-ping" style={{ animationDuration: '3s' }} />
        </div>
        {expanded && (
          <div className="overflow-hidden relative text-left">
            <div className="font-black text-lg tracking-tight bg-gradient-to-r from-brand via-emerald-300 to-cyan-400 bg-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text' }}>
              GOATED
            </div>
            <div className="text-[10px] text-slate-500 tracking-[3px] uppercase flex items-center gap-1">
              <Sparkles size={8} className="text-brand" aria-hidden="true" />Solutions
            </div>
          </div>
        )}
      </button>

      {/* Navigation */}
      <nav className="p-2 flex-1 overflow-y-auto" aria-label="Main navigation">
        {nav.filter(n => isPageEnabled(n.id, verifiedEmail)).map(n => (
          <button
            key={n.id}
            onClick={() => { useStore.getState().setDetailOpen(false); setPage(n.id); setMobileMenu(false); window.scrollTo(0, 0); }}
            aria-label={`Navigate to ${n.label}`}
            aria-current={page === n.id ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-colors duration-200 relative group ${
              page === n.id
                ? 'bg-brand/10 text-brand'
                : 'text-slate-400 hover:bg-white/[0.02] hover:text-slate-200'
            }`}
          >
            {/* Active indicator */}
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r transition-colors ${page === n.id ? 'bg-brand' : 'bg-transparent'}`} aria-hidden="true" />
            <n.icon size={20} className="flex-shrink-0" aria-hidden="true" />
            {expanded && (
              <>
                <span className="flex-1 text-left text-sm">{n.label}</span>
                {n.badge && <span className="text-[10px] bg-brand/15 text-brand px-2 py-0.5 rounded-full font-medium" aria-label={`${n.label} ${n.badge}`}>{n.badge}</span>}
                {n.key && <kbd className="text-[10px] text-slate-600 font-mono bg-white/[0.04] border border-white/[0.06] rounded px-1 py-0.5 leading-none" aria-hidden="true">{n.key}</kbd>}
              </>
            )}
          </button>
        ))}

        <div className="border-t border-white/[0.03] my-3" role="separator" />

        <button onClick={() => { setAiOpen(true); setMobileMenu(false); }} aria-label="Open GOATED AI assistant"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-brand/10 hover:text-brand transition-colors group">
          <Bot size={20} className="flex-shrink-0" aria-hidden="true" />
          {expanded && (
            <>
              <span className="flex-1 text-left text-sm">GOATED AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" aria-label="AI is active" />
              <kbd className="text-[10px] text-slate-600 font-mono bg-white/[0.04] border border-white/[0.06] rounded px-1 py-0.5 leading-none" aria-hidden="true">G</kbd>
            </>
          )}
        </button>
        <button onClick={() => { setSearchOpen(true); setMobileMenu(false); }} aria-label="Open search (Cmd+K)"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 transition-colors">
          <Search size={20} className="flex-shrink-0" aria-hidden="true" />
          {expanded && <><span className="flex-1 text-left text-sm">Search</span><kbd className="text-[10px] text-slate-600 font-mono bg-white/[0.04] border border-white/[0.06] rounded px-1 py-0.5 leading-none" aria-hidden="true">{'\u2318'}K</kbd></>}
        </button>
        <button onClick={() => { setKeybindsOpen(true); setMobileMenu(false); }} aria-label="View keyboard shortcuts"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 transition-colors">
          <Keyboard size={20} className="flex-shrink-0" aria-hidden="true" />
          {expanded && <><span className="flex-1 text-left text-sm">Shortcuts</span><kbd className="text-[10px] text-slate-600 font-mono bg-white/[0.04] border border-white/[0.06] rounded px-1 py-0.5 leading-none" aria-hidden="true">?</kbd></>}
        </button>
      </nav>

      {/* Account button — no top border (was causing green-rectangle artifact during transitions) */}
      <div className="p-2">
        <button onClick={() => { setAccountModalOpen(true); setMobileMenu(false); }} aria-label={isLoggedIn && user ? `Account: ${user.name}` : 'Sign in to your account'}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 transition-colors">
          {isLoggedIn && user ? (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand to-cyan-400 flex items-center justify-center text-black text-[10px] font-bold flex-shrink-0" aria-hidden="true">
              {user.avatar || user.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
          ) : (
            <User size={20} className="flex-shrink-0" aria-hidden="true" />
          )}
          {expanded && (
            <>
              <span className="flex-1 text-left text-sm truncate">{isLoggedIn && user ? user.name : 'Account'}</span>
              <kbd className="text-[10px] text-slate-600 font-mono bg-white/[0.04] border border-white/[0.06] rounded px-1 py-0.5 leading-none" aria-hidden="true">A</kbd>
            </>
          )}
        </button>
      </div>

      {/* DEGEN/CHILL toggle removed — the theme is fixed, so the switch only
          re-applied the same colours. */}

      {/* Version tag at bottom */}
      {expanded && (
        <div className="px-4 py-2 border-t border-white/[0.03]">
          <div className="text-[10px] text-slate-600 text-center">{degenMode ? 'v7.2 — DEGEN MODE' : 'v7.2 — CHILL MODE'}</div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileMenu(!mobileMenu)}
        aria-label={mobileMenu ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileMenu}
        className="fixed top-2 left-3 z-50 p-2 rounded-lg bg-black/30 backdrop-blur border border-white/[0.05] text-slate-400 hover:text-white transition-colors md:hidden"
      >
        {mobileMenu ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>

      {/* Mobile overlay */}
      {mobileMenu && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenu(false)} aria-hidden="true" />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        role="navigation"
        aria-label="Mobile navigation"
        className={`fixed left-0 top-0 bottom-0 glass z-40 flex flex-col transition-transform duration-300 md:hidden w-[260px] ${
          mobileMenu ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent(true)}
      </aside>

      {/* Desktop sidebar */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className="fixed left-0 top-0 bottom-0 glass z-40 transition-[width] duration-300 flex-col hidden md:flex overflow-hidden"
        style={{ width: sidebar ? 240 : 72, willChange: 'width' }}
      >
        {navContent(sidebar)}

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          aria-label={sidebar ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={sidebar}
          className="m-3 p-2 rounded-lg bg-surface-2 text-slate-400 hover:text-slate-200 transition-colors self-end"
        >
          {sidebar ? <ChevronLeft size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
        </button>
      </aside>
    </>
  );
}
