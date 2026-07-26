import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Home, Users, X, ArrowUp, ArrowDown, CornerDownLeft, Sparkles, Bot, Loader2, ArrowRight } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { isPageEnabled } from '../lib/config';

// Natural-language markers — if the query has these, we surface "Ask AI" first.
const NL_MARKERS = /\b(show|find|list|top|best|which|how many|compare|above|below|over|under|in .* industry|score |this week|this month|closing|hottest|coldest|biggest|smallest|what is|who is)\b|\?/i;

// Parse simple navigation tokens out of an AI response so the user can click through.
function parseNavIntents(text) {
  if (!text) return [];
  const out = [];
  const seen = new Set();
  const push = (page, label) => {
    if (!page || seen.has(page)) return;
    seen.add(page);
    out.push({ page, label });
  };
  const navRe = /\[NAVIGATE:([a-z-]+)\]/gi;
  let m;
  while ((m = navRe.exec(text)) !== null) {
    const pg = m[1].toLowerCase();
    push(pg, `Open ${pg[0].toUpperCase() + pg.slice(1)}`);
  }
  const leadRe = /\[LEAD_CARD:([^\]]+)\]/gi;
  while ((m = leadRe.exec(text)) !== null) {
    out.push({ type: 'lead', id: m[1], label: `Open lead` });
  }
  return out;
}

// Strip the bracketed tokens for a human-readable preview
function stripTokens(text) {
  if (!text) return '';
  return text.replace(/\[NAVIGATE:[a-z-]+\]/gi, '').replace(/\[LEAD_CARD:[^\]]+\]/gi, '').replace(/\*\*([^*]+)\*\*/g, '$1').trim();
}

// Filtered per-user at render time (see `pages` below) so disabled pages never
// appear as a result — and Admin never appears for a non-operator.
const ALL_PAGES = [
  { id: 'home', name: 'Home', hint: 'Landing page' },
  { id: 'audit', name: 'Audit', hint: 'Run a free revenue-loss audit' },
  { id: 'dashboard', name: 'Dashboard', hint: 'Pipeline + revenue' },
  { id: 'leads', name: 'Leads', hint: 'Live B2B company prospecting' },
  { id: 'admin', name: 'Admin', hint: 'System health' },
];

export default function SearchModal() {
  const setSearchOpen = useStore(s => s.setSearchOpen);
  const leads = useStore(s => s.leads) || [];
  const getLeads = useStore(s => s.getLeads);
  const setPage = useStore(s => s.setPage);
  const setSelectedLead = useStore(s => s.setSelectedLead);
  const setDetailOpen = useStore(s => s.setDetailOpen);
  const degenMode = useStore(s => s.degenMode);
  const page = useStore(s => s.page);
  const user = useStore(s => s.user);

  const [q, setQ] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [aiState, setAiState] = useState({ status: 'idle', answer: '', intents: [] }); // idle | loading | done | error
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const aiAbortRef = useRef(null);

  useEffect(() => {
    if (!leads.length) getLeads();
  }, [leads.length, getLeads]);

  // Abort any in-flight AI call on unmount
  useEffect(() => () => { aiAbortRef.current?.abort(); }, []);

  const results = useMemo(() => {
    if (!q) return { leads: [], pages: [], actions: [], aiSuggest: false };
    const query = q.toLowerCase().trim();
    const leadMatches = leads
      .filter(l =>
        (l.name || '').toLowerCase().includes(query) ||
        (l.company || '').toLowerCase().includes(query) ||
        (l.industry || '').toLowerCase().includes(query) ||
        (l.title || '').toLowerCase().includes(query)
      )
      .slice(0, 8);
    const pageMatches = ALL_PAGES.filter(p => isPageEnabled(p.id, user)).filter(p =>
      p.name.toLowerCase().includes(query) || p.hint.toLowerCase().includes(query)
    );
    const actionMatches = [
      { id: 'toggle-degen', name: degenMode ? 'Switch to CHILL mode' : 'Activate DEGEN mode', desc: 'Alpha plays, insider intel, market signals' },
      { id: 'open-audit', name: 'Run a free audit', desc: 'Paste a URL → 12-dimension revenue loss analysis' },
    ].filter(a => a.name.toLowerCase().includes(query) || a.desc.toLowerCase().includes(query));

    // Surface "Ask AI" first when:
    //   • query has a natural-language marker, OR
    //   • query is long (>= 4 words) and no direct local match
    const nlHit = NL_MARKERS.test(query);
    const longQuery = query.split(/\s+/).length >= 4;
    const noLocalMatch = leadMatches.length === 0 && pageMatches.length === 0 && actionMatches.length === 0;
    const aiSuggest = nlHit || (longQuery && noLocalMatch) || noLocalMatch;

    return { leads: leadMatches, pages: pageMatches, actions: actionMatches, aiSuggest };
  }, [q, leads, degenMode, user]);

  // Build flat result list. "Ask AI" is first if aiSuggest; otherwise appended.
  const flatResults = useMemo(() => {
    const items = [];
    if (q && results.aiSuggest) items.push({ type: 'ai', data: { query: q } });
    results.pages.forEach(p => items.push({ type: 'page', data: p }));
    results.actions.forEach(a => items.push({ type: 'action', data: a }));
    results.leads.forEach(l => items.push({ type: 'lead', data: l }));
    // Always allow Ask AI at bottom if we haven't added it already
    if (q && !results.aiSuggest) items.push({ type: 'ai', data: { query: q } });
    return items;
  }, [q, results]);

  useEffect(() => { setActiveIdx(0); }, [q]);

  // ─── Ask GOATED AI handler ────────────────────────────────────────────────
  const askAI = useCallback(async (query) => {
    if (!query?.trim()) return;
    aiAbortRef.current?.abort();
    const ctrl = new AbortController();
    aiAbortRef.current = ctrl;
    setAiState({ status: 'loading', answer: '', intents: [] });
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          message: query,
          page,
          degenMode,
          source: 'cmdk',
        }),
      });
      if (!r.ok) throw new Error(`AI ${r.status}`);
      const j = await r.json();
      const answer = j.response || j.reply || j.text || '';
      const intents = parseNavIntents(answer);
      setAiState({ status: 'done', answer, intents });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setAiState({ status: 'error', answer: 'AI is rate-limited right now. Try again in 30s or use the normal search.', intents: [] });
    }
  }, [page, degenMode]);

  const selectItem = useCallback((item) => {
    if (!item) return;
    if (item.type === 'page') {
      setPage(item.data.id);
      setSearchOpen(false);
    } else if (item.type === 'action') {
      if (item.data.id === 'toggle-degen') {
        useStore.getState().toggleDegenMode();
      } else if (item.data.id === 'open-audit') {
        setPage('audit');
      }
      setSearchOpen(false);
    } else if (item.type === 'lead') {
      setSelectedLead(item.data);
      setDetailOpen(true);
      setSearchOpen(false);
    } else if (item.type === 'ai') {
      askAI(item.data.query);
      // Keep modal open so user can read the answer
    } else if (item.type === 'ai-intent') {
      const intent = item.data;
      if (intent.type === 'lead') {
        const found = leads.find(l => String(l.id) === String(intent.id));
        if (found) {
          setSelectedLead(found);
          setDetailOpen(true);
          setSearchOpen(false);
          return;
        }
      }
      // Never let an AI-proposed link jump to a disabled or admin-only page.
      if (intent.page && isPageEnabled(intent.page, user)) {
        setPage(intent.page);
        setSearchOpen(false);
      }
    }
  }, [setPage, setSelectedLead, setDetailOpen, setSearchOpen, askAI, leads, user]);

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
      if (aiState.status !== 'idle') {
        setAiState({ status: 'idle', answer: '', intents: [] });
      } else {
        setSearchOpen(false);
      }
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      // Cmd+Enter always asks AI regardless of active row
      e.preventDefault();
      askAI(q);
    }
  }, [flatResults, activeIdx, selectItem, setSearchOpen, aiState.status, askAI, q]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const active = listRef.current.querySelector('[data-active="true"]');
      if (active) active.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIdx]);

  const accent = degenMode ? '#f97316' : '#10b981';
  const accentBg = degenMode ? 'bg-orange-500/10' : 'bg-brand/10';
  const accentText = degenMode ? 'text-orange-400' : 'text-brand';
  const accentBorder = degenMode ? 'border-orange-500/20' : 'border-brand/20';

  let itemCounter = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
      <div className="relative w-full max-w-2xl mx-4 rounded-xl bg-surface-1 border border-white/[0.05] shadow-2xl overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
        {/* Header: input + AI badge */}
        <div className="flex items-center gap-3 p-4 border-b border-white/[0.03]">
          <Search size={20} className="text-slate-500" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            placeholder="Search leads, pages, or ask GOATED AI anything…"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-slate-500"
          />
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${accentBg} border ${accentBorder}`}>
            <Sparkles size={11} className={accentText} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${accentText}`}>AI</span>
          </div>
          <kbd className="px-2 py-1 rounded bg-surface-2 text-xs text-slate-500 hidden sm:inline">ESC</kbd>
        </div>

        {/* AI answer panel — shown when there's an AI response in flight or done */}
        {aiState.status !== 'idle' && (
          <div className={`px-4 py-3 border-b border-white/[0.03] ${accentBg}/20`}>
            <div className="flex items-start gap-2.5">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${accentBg} border ${accentBorder}`}>
                {aiState.status === 'loading' ? (
                  <Loader2 size={12} className={`${accentText} animate-spin`} />
                ) : (
                  <Bot size={12} className={accentText} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[10px] uppercase tracking-widest font-black mb-1 ${accentText}`}>
                  {aiState.status === 'loading' ? 'Thinking…' : 'GOATED AI'}
                </div>
                {aiState.status === 'loading' ? (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Routing {degenMode ? 'DEGEN' : ''} query through {page} context</span>
                    <span className="flex gap-1">
                      <span className={`w-1 h-1 rounded-full ${accentBg} animate-pulse`} />
                      <span className={`w-1 h-1 rounded-full ${accentBg} animate-pulse`} style={{ animationDelay: '150ms' }} />
                      <span className={`w-1 h-1 rounded-full ${accentBg} animate-pulse`} style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="text-[12px] text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {stripTokens(aiState.answer)}
                    </div>
                    {aiState.intents.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {aiState.intents.map((intent, i) => (
                          <button
                            key={i}
                            onClick={() => selectItem({ type: 'ai-intent', data: intent })}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] transition-all"
                          >
                            {intent.label}
                            <ArrowRight size={10} className="text-slate-500" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results list */}
        {q && (
          <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
            {flatResults.length === 0 && (
              <div className="py-8 text-center text-slate-500">
                No results for "{q}"
                <div className="text-xs text-slate-600 mt-1">Press Enter to ask GOATED AI</div>
              </div>
            )}

            {/* AI row (could be at top or bottom depending on aiSuggest) */}
            {flatResults.map((item, flatIdx) => {
              if (item.type !== 'ai') return null;
              const idx = flatIdx;
              return (
                <button
                  key="ask-ai"
                  onClick={() => selectItem(item)}
                  data-active={idx === activeIdx}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-2 border ${idx === activeIdx ? `${accentBg} ${accentText} ${accentBorder}` : 'border-transparent hover:bg-white/[0.02]'}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${accentBg} border ${accentBorder}`}>
                    <Sparkles size={13} className={accentText} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${idx === activeIdx ? accentText : 'text-white'}`}>
                      Ask GOATED AI
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      "{q}" · uses your current {page} context
                    </div>
                  </div>
                  <kbd className="text-[10px] text-slate-500 font-mono hidden sm:inline">⌘↵</kbd>
                  {idx === activeIdx && <CornerDownLeft size={13} className={`${accentText} opacity-70`} />}
                </button>
              );
            })}

            {/* Pages */}
            {results.pages.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Pages</div>
                {results.pages.map(p => {
                  // compute idx for this item by scanning flatResults
                  const idx = flatResults.findIndex(f => f.type === 'page' && f.data.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => selectItem({ type: 'page', data: p })}
                      data-active={idx === activeIdx}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${idx === activeIdx ? `${accentBg} ${accentText}` : 'hover:bg-white/[0.02]'}`}
                    >
                      <Home size={16} className={idx === activeIdx ? accentText : 'text-slate-500'} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm ${idx === activeIdx ? 'font-semibold' : 'text-slate-200'}`}>{p.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{p.hint}</div>
                      </div>
                      {idx === activeIdx && <CornerDownLeft size={14} className={`${accentText} opacity-50`} />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            {results.actions.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Actions</div>
                {results.actions.map(a => {
                  const idx = flatResults.findIndex(f => f.type === 'action' && f.data.id === a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => selectItem({ type: 'action', data: a })}
                      data-active={idx === activeIdx}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${idx === activeIdx ? 'bg-orange-500/10 text-orange-400' : 'hover:bg-white/[0.02]'}`}
                    >
                      <span className="text-lg">🔥</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${idx === activeIdx ? 'text-orange-400' : 'text-white'}`}>{a.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{a.desc}</div>
                      </div>
                      {idx === activeIdx && <CornerDownLeft size={14} className="text-orange-400/50" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Leads */}
            {results.leads.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Leads ({results.leads.length})</div>
                {results.leads.map(l => {
                  const idx = flatResults.findIndex(f => f.type === 'lead' && f.data.id === l.id);
                  return (
                    <button
                      key={l.id}
                      onClick={() => selectItem({ type: 'lead', data: l })}
                      data-active={idx === activeIdx}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${idx === activeIdx ? `${accentBg}` : 'hover:bg-white/[0.02]'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx === activeIdx ? `${accentBg} ${accentText}` : 'bg-brand/15 text-brand'}`}>
                        {(l.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${idx === activeIdx ? accentText : 'text-white'}`}>{l.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{l.title} at {l.company} · {l.industry}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-sm font-bold ${accentText}`}>{l.score}</div>
                        <div className="text-[10px] text-slate-500">score</div>
                      </div>
                      {idx === activeIdx && <CornerDownLeft size={14} className={`${accentText} opacity-50`} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Empty state — show quick prompts */}
        {!q && (
          <div className="p-4">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Try asking</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Top 5 healthcare leads above $50K',
                'What deals should I close this week?',
                'SaaS founders in Austin',
                'Show me the biggest commission opportunities',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => { setQ(suggestion); inputRef.current?.focus(); }}
                  className="flex items-center gap-2 p-2.5 rounded-lg text-left bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] transition-all"
                >
                  <Sparkles size={11} className={accentText} />
                  <span className="text-[11px] text-slate-300 truncate">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard hints */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-t border-white/[0.03] text-[10px] text-slate-600">
          <span className="flex items-center gap-1"><ArrowUp size={10} /><ArrowDown size={10} /> Navigate</span>
          <span className="flex items-center gap-1"><CornerDownLeft size={10} /> Select</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded bg-surface-2 text-[9px]">⌘↵</kbd> Ask AI
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <kbd className="px-1 rounded bg-surface-2 text-[9px]">ESC</kbd> {aiState.status !== 'idle' ? 'Clear' : 'Close'}
          </span>
        </div>
      </div>
    </div>
  );
}
