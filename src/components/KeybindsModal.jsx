import React from 'react';
import { Keyboard, X, Home, LayoutDashboard, Users, Bot, Search, Eye, Shield, User, Flame, Award } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { isPageEnabled } from '../lib/config';

const sections = [
  {
    title: 'Navigation',
    desc: 'Jump to any page instantly',
    // Mirrors PAGE_KEYBINDS in lib/config.js. Disabled pages (TrendPulse T/C,
    // Wallet W, Managed M) have no binding and are deliberately not listed.
    keys: [
      { key: 'H', label: 'Home', icon: Home, color: '#10b981' },
      { key: 'U', label: 'Audit', icon: Award, color: '#22d3ee' },
      { key: 'L', label: 'Leads', icon: Users, color: '#f59e0b' },
      { key: 'D', label: 'Dashboard', icon: LayoutDashboard, color: '#06b6d4' },
      { key: 'X', label: 'Admin', icon: Shield, color: '#ef4444', page: 'admin' },
    ]
  },
  {
    title: 'Quick Actions',
    desc: 'Power user shortcuts',
    keys: [
      { key: '⌘K', label: 'Search leads & pages', icon: Search, color: '#10b981' },
      { key: 'G', label: 'Open GOATED AI', icon: Bot, color: '#a855f7' },
      { key: 'A', label: 'Account settings', icon: User, color: '#ec4899' },
      { key: 'S', label: 'Toggle sidebar', icon: Eye, color: '#06b6d4' },
      { key: 'Shift+D', label: 'Toggle DEGEN Mode', icon: Flame, color: '#f97316' },
      { key: '?', label: 'Show this guide', icon: Keyboard, color: '#f59e0b' },
      { key: 'ESC', label: 'Close any overlay', icon: X, color: '#64748b' },
    ]
  }
];

export default function KeybindsModal() {
  const { setKeybindsOpen } = useStore();
  const user = useStore(s => s.user);
  // Don't advertise a shortcut the user isn't allowed to use.
  const visible = (k) => !k.page || isPageEnabled(k.page, user);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setKeybindsOpen(false)} />
      <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-surface-1/95 border border-white/[0.05] shadow-2xl overflow-hidden" style={{ animation: 'scaleIn 0.25s ease-out', backdropFilter: 'blur(20px)' }}>
        {/* Header */}
        <div className="p-5 border-b border-white/[0.03] flex justify-between items-center bg-gradient-to-r from-brand/5 to-transparent">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2"><Keyboard size={22} className="text-brand" />Keyboard Guide</h2>
            <p className="text-xs text-slate-500 mt-0.5">Master the shortcuts, dominate faster</p>
          </div>
          <button onClick={() => setKeybindsOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.02] transition-colors"><X size={18} /></button>
        </div>

        {/* Sections */}
        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {sections.map(section => (
            <div key={section.title}>
              <div className="mb-3">
                <h3 className="text-sm font-bold text-brand uppercase tracking-wider">{section.title}</h3>
                <p className="text-xs text-slate-500">{section.desc}</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {section.keys.filter(visible).map(({ key, label, icon: Icon, color }) => (
                  <div key={key} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.03] transition-colors group">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${color}12` }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <span className="text-sm text-slate-300 flex-1 truncate group-hover:text-white transition-colors">{label}</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-black/30 text-[11px] font-mono text-slate-500 border border-white/[0.03] min-w-[28px] text-center">{key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="px-5 py-3 border-t border-white/[0.03] bg-surface-0/50">
          <p className="text-[11px] text-slate-600 text-center">Pro tip: All shortcuts work from any page. No modifier keys needed.</p>
        </div>
      </div>
    </div>
  );
}
