import React from 'react';
import { Home, LayoutDashboard, Users, TrendingUp, Play, Store, Dice5, Wallet, Bot, Keyboard, Search, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { GoatIcon } from './GoatLogo';

const nav = [
  { id: 'home', icon: Home, label: 'Home', key: '1' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', key: '2' },
  { id: 'leads', icon: Users, label: 'Leads', key: '3', badge: '2.5K' },
  { id: 'trends', icon: TrendingUp, label: 'Trend Pulse', key: '4' },
  { id: 'plays', icon: Play, label: 'Live Plays', key: '5' },
  { id: 'market', icon: Store, label: 'Marketplace', key: '6' },
  { id: 'casino', icon: Dice5, label: 'Casino', key: '7' },
  { id: 'wallet', icon: Wallet, label: 'Wallet', key: '8' },
];

export default function Sidebar() {
  const { page, setPage, sidebar, toggleSidebar, setAiOpen, setKeybindsOpen, setSearchOpen, mobileMenu, setMobileMenu } = useStore();

  const navContent = (expanded) => (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-white/5 flex items-center gap-3">
        <div className="text-brand flex-shrink-0"><GoatIcon /></div>
        {expanded && (
          <div className="overflow-hidden">
            <div className="font-bold text-lg tracking-tight">GOATED</div>
            <div className="text-[10px] text-slate-500 tracking-[3px] uppercase">Degen Business OS</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-2 flex-1 overflow-y-auto">
        {nav.map(n => (
          <button
            key={n.id}
            onClick={() => setPage(n.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-200 border-l-2 ${
              page === n.id
                ? 'bg-brand/10 text-brand border-brand'
                : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <n.icon size={20} className="flex-shrink-0" />
            {expanded && (
              <>
                <span className="flex-1 text-left text-sm">{n.label}</span>
                {n.badge && <span className="text-[11px] bg-brand/15 text-brand px-2 py-0.5 rounded-full">{n.badge}</span>}
                <span className="text-[10px] text-slate-600">{n.key}</span>
              </>
            )}
          </button>
        ))}

        <div className="border-t border-white/5 my-3" />

        <button onClick={() => { setAiOpen(true); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all">
          <Bot size={20} className="flex-shrink-0" />
          {expanded && <><span className="flex-1 text-left text-sm">GOATED AI</span><span className="text-[10px] text-slate-600">G</span></>}
        </button>
        <button onClick={() => { setKeybindsOpen(true); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all">
          <Keyboard size={20} className="flex-shrink-0" />
          {expanded && <><span className="flex-1 text-left text-sm">Keybinds</span><span className="text-[10px] text-slate-600">?</span></>}
        </button>
        <button onClick={() => { setSearchOpen(true); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all">
          <Search size={20} className="flex-shrink-0" />
          {expanded && <><span className="flex-1 text-left text-sm">Search</span><span className="text-[10px] text-slate-600">{'\u2318'}K</span></>}
        </button>
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileMenu(!mobileMenu)}
        className="fixed top-2 left-3 z-50 p-2 rounded-lg bg-surface-2 border border-white/10 text-slate-400 hover:text-white transition-colors md:hidden"
      >
        {mobileMenu ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileMenu && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenu(false)} />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed left-0 top-0 bottom-0 glass z-40 flex flex-col transition-transform duration-300 md:hidden w-[260px] ${
          mobileMenu ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent(true)}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="fixed left-0 top-9 bottom-0 glass z-40 transition-all duration-300 flex-col hidden md:flex"
        style={{ width: sidebar ? 240 : 72 }}
      >
        {navContent(sidebar)}

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="m-3 p-2 rounded-lg bg-surface-2 text-slate-400 hover:text-slate-200 transition-colors self-end"
        >
          {sidebar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </aside>
    </>
  );
}
