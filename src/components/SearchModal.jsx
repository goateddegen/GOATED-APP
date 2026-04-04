import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Home, Users, X, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react';
import { useStore } from '../hooks/useStore';

export default function SearchModal() {
  const { setSearchOpen, leads: rawLeads, getLeads, setPage, setSelectedLead, setDetailOpen } = useStore();
  const leads = rawLeads || [];
  const [q, setQ] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!rawLeads) getLeads();
  }, [rawLeads, getLeads]);

  const results = useMemo(() => {
    if (!q) return { leads: [], pages: [] };
    const query = q.toLowerCase();
    return {
      leads: leads.filter(l => l.name.toLowerCase().includes(query) || l.company.toLowerCase().includes(query) || l.industry.toLowerCase().includes(query)).slice(0, 8),
      pages: [
        { id: 'home', name: 'Home' }, { id: 'dashboard', name: 'Dashboard' }, { id: 'leads', name: 'Leads' },
        { id: 'trends', name: 'TrendPulse & Markets' },
        { id: 'wallet', name: 'Wallet' }, { id: 'casino', name: 'Casino' }, { id: 'admin', name: 'Admin' },
      ].filter(p => p.name.toLowerCase().includes(query)),
      actions: [
        { id: 'toggle-degen', name: 'Toggle DEGEN Mode', desc: 'Casino, Alpha Plays, Insider Intel, Market Signals' },
      ].filter(a => a.name.toLowerCase().includes(query) || a.desc.toLowerCase().includes(query))
    };
  }, [q, leads]);

  // Flat list of all results for keyboard navigation
  const flatResults = useMemo(() => {
    const items = [];
    results.pages.forEach(p => items.push({ type: 'page', data: p }));
    if (results.actions) results.actions.forEach(a => items.push({ type: 'action', data: a }));
    results.leads.forEach(l => items.push({ type: 'lead', data: l }));
    return items;
  }, [results]);

  // Reset active index when results change
  useEffect(() => { setActiveIdx(0); }, [q]);

  const selectItem = useCallback((item) => {
    if (item.type === 'page') {
      setPage(item.data.id);
    } else if (item.type === 'action') {
      if (item.data.id === 'toggle-degen') {
        useStore.getState().toggleDegenMode();
      }
    } else {
      setSelectedLead(item.data);
      setDetailOpen(true);
    }
    setSearchOpen(false);
  }, [setPage, setSelectedLead, setDetailOpen, setSearchOpen]);

  const onKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(prev => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && flatResults.length > 0) {
      e.preventDefault();
      selectItem(flatResults[activeIdx]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSearchOpen(false);
    }
  }, [flatResults, activeIdx, selectItem, setSearchOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const active = listRef.current.querySelector('[data-active="true"]');
      if (active) active.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIdx]);

  let itemCounter = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
      <div className="relative w-full max-w-xl mx-4 rounded-xl bg-surface-1 border border-white/[0.05] shadow-2xl overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
        <div className="flex items-center gap-3 p-4 border-b border-white/[0.03]">
          <Search size={20} className="text-slate-500" />
          <input ref={inputRef} autoFocus type="text" placeholder="Search leads, pages, commands..." value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-slate-500" />
          <kbd className="px-2 py-1 rounded bg-surface-2 text-xs text-slate-500">ESC</kbd>
        </div>
        {q && (
          <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
            {results.pages.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1.5 text-xs text-slate-500 font-medium uppercase">Pages</div>
                {results.pages.map(p => {
                  itemCounter++;
                  const idx = itemCounter;
                  return (
                    <button key={p.id} onClick={() => selectItem({ type: 'page', data: p })}
                      data-active={idx === activeIdx}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-slate-200 transition-colors ${idx === activeIdx ? 'bg-brand/10 text-brand' : 'hover:bg-white/[0.02]'}`}>
                      <Home size={16} className={idx === activeIdx ? 'text-brand' : 'text-slate-500'} />
                      <span className="flex-1">{p.name}</span>
                      {idx === activeIdx && <CornerDownLeft size={14} className="text-brand/50" />}
                    </button>
                  );
                })}
              </div>
            )}
            {results.actions && results.actions.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1.5 text-xs text-slate-500 font-medium uppercase">Actions</div>
                {results.actions.map(a => {
                  itemCounter++;
                  const idx = itemCounter;
                  return (
                    <button key={a.id} onClick={() => selectItem({ type: 'action', data: a })}
                      data-active={idx === activeIdx}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-slate-200 transition-colors ${idx === activeIdx ? 'bg-orange-500/10 text-orange-400' : 'hover:bg-white/[0.02]'}`}>
                      <span className="text-lg">🔥</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${idx === activeIdx ? 'text-orange-400' : 'text-white'}`}>{a.name}</div>
                        <div className="text-xs text-slate-500 truncate">{a.desc}</div>
                      </div>
                      {idx === activeIdx && <CornerDownLeft size={14} className="text-orange-400/50" />}
                    </button>
                  );
                })}
              </div>
            )}
            {results.leads.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs text-slate-500 font-medium uppercase">Leads</div>
                {results.leads.map(l => {
                  itemCounter++;
                  const idx = itemCounter;
                  return (
                    <button key={l.id} onClick={() => selectItem({ type: 'lead', data: l })}
                      data-active={idx === activeIdx}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${idx === activeIdx ? 'bg-brand/10' : 'hover:bg-white/[0.02]'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx === activeIdx ? 'bg-brand/20 text-brand' : 'bg-brand/15 text-brand'}`}>
                        {l.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${idx === activeIdx ? 'text-brand' : 'text-white'}`}>{l.name}</div>
                        <div className="text-xs text-slate-500 truncate">{l.title} at {l.company}</div>
                      </div>
                      <span className="text-sm font-bold text-brand">{l.score}</span>
                      {idx === activeIdx && <CornerDownLeft size={14} className="text-brand/50" />}
                    </button>
                  );
                })}
              </div>
            )}
            {results.leads.length === 0 && results.pages.length === 0 && (!results.actions || results.actions.length === 0) && (
              <div className="py-8 text-center text-slate-500">No results for "{q}"</div>
            )}
          </div>
        )}
        {/* Keyboard hints */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/[0.03] text-[11px] text-slate-600">
          <span className="flex items-center gap-1"><ArrowUp size={11} /><ArrowDown size={11} /> Navigate</span>
          <span className="flex items-center gap-1"><CornerDownLeft size={11} /> Select</span>
          <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-surface-2 text-[10px]">ESC</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
