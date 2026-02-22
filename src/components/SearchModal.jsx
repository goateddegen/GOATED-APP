import React, { useState, useMemo } from 'react';
import { Search, Home, Users, X } from 'lucide-react';
import { useStore } from '../hooks/useStore';

export default function SearchModal() {
  const { setSearchOpen, leads, setPage, setSelectedLead, setDetailOpen } = useStore();
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    if (!q) return { leads: [], pages: [] };
    const query = q.toLowerCase();
    return {
      leads: leads.filter(l => l.name.toLowerCase().includes(query) || l.company.toLowerCase().includes(query) || l.industry.toLowerCase().includes(query)).slice(0, 8),
      pages: [
        { id: 'home', name: 'Home' }, { id: 'dashboard', name: 'Dashboard' }, { id: 'leads', name: 'Leads' },
        { id: 'trends', name: 'Trend Pulse' }, { id: 'plays', name: 'Live Plays' }, { id: 'market', name: 'Marketplace' },
        { id: 'casino', name: 'Casino' }, { id: 'wallet', name: 'Wallet' },
      ].filter(p => p.name.toLowerCase().includes(query))
    };
  }, [q, leads]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
      <div className="relative w-full max-w-xl mx-4 rounded-xl bg-surface-1 border border-white/10 shadow-2xl overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          <Search size={20} className="text-slate-500" />
          <input autoFocus type="text" placeholder="Search leads, pages, commands..." value={q} onChange={e => setQ(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-slate-500" />
          <kbd className="px-2 py-1 rounded bg-surface-2 text-xs text-slate-500">ESC</kbd>
        </div>
        {q && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.pages.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1.5 text-xs text-slate-500 font-medium uppercase">Pages</div>
                {results.pages.map(p => (
                  <button key={p.id} onClick={() => { setPage(p.id); setSearchOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-slate-200 hover:bg-white/5 transition-colors">
                    <Home size={16} className="text-slate-500" /><span>{p.name}</span>
                  </button>
                ))}
              </div>
            )}
            {results.leads.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs text-slate-500 font-medium uppercase">Leads</div>
                {results.leads.map(l => (
                  <button key={l.id} onClick={() => { setSelectedLead(l); setDetailOpen(true); setSearchOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center text-brand text-xs font-bold flex-shrink-0">
                      {l.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{l.name}</div>
                      <div className="text-xs text-slate-500 truncate">{l.title} at {l.company}</div>
                    </div>
                    <span className="text-sm font-bold text-brand">{l.score}</span>
                  </button>
                ))}
              </div>
            )}
            {results.leads.length === 0 && results.pages.length === 0 && (
              <div className="py-8 text-center text-slate-500">No results for "{q}"</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
