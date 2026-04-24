import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, TrendingUp, TrendingDown, Zap, Target, Globe2, Sparkles, AlertTriangle, ArrowRight, Activity } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useGoatedAI } from '../hooks/useGoatedAI';

/**
 * NotchBar — macOS-notch-inspired top-center pill.
 *
 * States:
 *   collapsed  →  thin rounded pill, top-center, shows ONE rotating "hero alpha"
 *                 (top hot lead | breaking signal | market shift | sentiment flip)
 *   expanded   →  wider card on hover/click with:
 *                   • live market prices
 *                   • AI regime + sentiment
 *                   • top commission opportunity (right now)
 *                   • click-through to the relevant page
 *
 * Design ethos:
 *   • Backdrop-blur + glass ring — reads as floating hardware
 *   • Rotating content every ~7s keeps it alive without motion sickness
 *   • Animation is subtle morph, not confetti
 */

function fmtUsd(n) {
  if (n == null || Number.isNaN(n)) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default React.memo(function NotchBar() {
  const setPage = useStore(s => s.setPage);
  const leads = useStore(s => s.leads);
  const degenMode = useStore(s => s.degenMode);
  const { regime, sentiment: aiSentiment } = useGoatedAI();

  const [expanded, setExpanded] = useState(false);
  const [marketData, setMarketData] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const rotateRef = useRef(null);

  // ─── Fetch real market data every 30s ─────────────────────────────────────
  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
        const r = await fetch('/api/market-data');
        if (!r.ok) return;
        const j = await r.json();
        if (!alive) return;
        const byId = {};
        (j.prices || []).forEach(p => { byId[(p.symbol || '').toLowerCase()] = p; });
        setMarketData({
          btc: byId.btc, eth: byId.eth, sol: byId.sol,
          fearGreed: j.fearGreed || null,
          updated: Date.now(),
        });
      } catch { /* keep previous */ }
    };
    pull();
    const id = setInterval(pull, 30_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // ─── Compute hot lead (highest score × deal value) for commission hook ────
  const hotLead = useMemo(() => {
    if (!leads?.length) return null;
    let best = null;
    let bestWeight = 0;
    for (let i = 0; i < Math.min(leads.length, 2000); i++) {
      const l = leads[i];
      if (!l || l.status === 'won' || l.status === 'lost') continue;
      const w = (l.score || 0) * ((l.dealValue || 0) / 1000);
      if (w > bestWeight) { bestWeight = w; best = l; }
    }
    return best;
  }, [leads]);

  // ─── Build rotating slides (1 line of "what's the play right now") ───────
  const slides = useMemo(() => {
    const out = [];

    // Slide 1 — hottest lead with commission math (13%)
    if (hotLead) {
      const commission = Math.round((hotLead.dealValue || 0) * 0.13);
      out.push({
        key: 'hot-lead',
        icon: Flame,
        accent: degenMode ? '#f97316' : '#10b981',
        label: 'CLOSE NOW',
        text: `${hotLead.company || hotLead.name || 'Lead'} — ${fmtUsd(hotLead.dealValue)} deal, ${fmtUsd(commission)} commission`,
        cta: 'leads',
        pulse: true,
      });
    }

    // Slide 2 — market regime + sentiment
    if (regime?.name) {
      out.push({
        key: 'regime',
        icon: Activity,
        accent: regime.name === 'Accumulation' || regime.name === 'Markup' ? '#10b981' : '#f59e0b',
        label: 'REGIME',
        text: `${regime.name} — ${regime.action || 'hold conviction'}`,
        cta: 'trends',
      });
    }

    // Slide 3 — BTC/ETH/SOL movers
    if (marketData?.btc) {
      const btc = marketData.btc;
      const pct = btc.price_change_percentage_24h ?? 0;
      out.push({
        key: 'btc',
        icon: pct >= 0 ? TrendingUp : TrendingDown,
        accent: pct >= 0 ? '#10b981' : '#ef4444',
        label: 'BTC',
        text: `$${Math.round(btc.current_price || 0).toLocaleString()} ${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}% · 24h`,
        cta: 'trends',
      });
    }

    // Slide 4 — AI sentiment composite
    if (aiSentiment?.composite != null) {
      const s = Math.round(aiSentiment.composite);
      out.push({
        key: 'sentiment',
        icon: Sparkles,
        accent: s >= 60 ? '#10b981' : s >= 40 ? '#f59e0b' : '#ef4444',
        label: 'PULSE',
        text: `AI sentiment ${s}/100 — ${s >= 60 ? 'bullish' : s >= 40 ? 'neutral' : 'defensive'}`,
        cta: 'trends',
      });
    }

    // Fallback intro slide if nothing else loaded yet
    if (out.length === 0) {
      out.push({
        key: 'boot',
        icon: Globe2,
        accent: '#10b981',
        label: 'GOATED',
        text: 'B2B revenue OS · 13% only when we close',
        cta: 'audit',
      });
    }

    return out;
  }, [hotLead, regime, aiSentiment, marketData, degenMode]);

  // ─── Auto-rotate every 7s (pause while expanded) ──────────────────────────
  useEffect(() => {
    if (expanded) return;
    if (slides.length <= 1) return;
    rotateRef.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % slides.length);
    }, 7_000);
    return () => clearInterval(rotateRef.current);
  }, [slides.length, expanded]);

  // Clamp activeIdx when slides length changes
  useEffect(() => {
    if (activeIdx >= slides.length) setActiveIdx(0);
  }, [slides.length, activeIdx]);

  const active = slides[activeIdx] || slides[0];
  const ActiveIcon = active?.icon || Globe2;

  const go = useCallback((page) => {
    if (page) setPage(page);
    setExpanded(false);
  }, [setPage]);

  // ─── Keyboard: "N" toggles expanded ───────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      // Ignore when typing in inputs / when modifier keys are down
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setExpanded(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="fixed top-0 left-1/2 -translate-x-1/2 z-[55] hidden sm:block"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
        className="relative"
        style={{
          // Notch pill: rounded bottom, flat top, deep black with glass
          borderBottomLeftRadius: 22,
          borderBottomRightRadius: 22,
          background: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(22px) saturate(180%)',
          WebkitBackdropFilter: 'blur(22px) saturate(180%)',
          boxShadow: expanded
            ? `0 14px 40px -10px ${active?.accent || '#10b981'}55, 0 2px 0 rgba(255,255,255,0.04) inset`
            : '0 6px 20px -8px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.04) inset',
          border: '1px solid rgba(255,255,255,0.06)',
          borderTop: 'none',
        }}
      >
        {/* Inner glow halo (shows around expanded state) */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none rounded-[22px]"
              style={{
                background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${active?.accent || '#10b981'}18 0%, transparent 70%)`,
              }}
            />
          )}
        </AnimatePresence>

        {/* ═══ COLLAPSED (thin pill) ═══ */}
        {!expanded && (
          <button
            onClick={() => go(active?.cta)}
            className="relative flex items-center gap-2.5 px-4 py-1.5 cursor-pointer group"
            style={{ minWidth: 280 }}
            aria-label={`${active?.label}: ${active?.text}. Click to open ${active?.cta}`}
          >
            {/* Live dot + accent icon */}
            <div className="relative flex-shrink-0">
              <ActiveIcon size={13} style={{ color: active?.accent || '#10b981' }} />
              {active?.pulse && (
                <span
                  className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full animate-ping"
                  style={{ background: active.accent }}
                />
              )}
            </div>
            <span
              className="text-[9px] uppercase tracking-[0.22em] font-black"
              style={{ color: active?.accent || '#10b981' }}
            >
              {active?.label}
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={active?.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-[11px] font-semibold text-slate-200 truncate max-w-[320px]"
              >
                {active?.text}
              </motion.span>
            </AnimatePresence>
            <ArrowRight size={11} className="text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
          </button>
        )}

        {/* ═══ EXPANDED (full alpha card) ═══ */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden"
            >
              <div className="px-5 py-4 flex flex-col gap-3" style={{ minWidth: 540 }}>
                {/* Header strip */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <span className="absolute inset-0 rounded-full animate-pulse" style={{ background: `${active?.accent || '#10b981'}30` }} />
                      <ActiveIcon size={12} style={{ color: active?.accent || '#10b981' }} className="relative" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.3em] font-black text-white">Live alpha feed</span>
                    <span className="text-[9px] text-slate-600 font-mono">·</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                      {degenMode ? 'DEGEN MODE' : 'CHILL'}
                    </span>
                  </div>
                  <kbd className="text-[9px] text-slate-500 font-mono bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5">N</kbd>
                </div>

                {/* Grid of slides — all visible on expand */}
                <div className="grid grid-cols-2 gap-2">
                  {slides.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.key}
                        onClick={() => go(s.cta)}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/[0.10] transition-all text-left group"
                      >
                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${s.accent}18`, color: s.accent }}>
                          <Icon size={12} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] uppercase tracking-wider font-black" style={{ color: s.accent }}>{s.label}</div>
                          <div className="text-[11px] text-slate-200 font-medium truncate">{s.text}</div>
                        </div>
                        <ArrowRight size={10} className="text-slate-600 group-hover:text-white transition-colors flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>

                {/* Market snapshot strip */}
                {marketData && (
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/[0.04]">
                    {['btc', 'eth', 'sol'].map((sym) => {
                      const c = marketData[sym];
                      if (!c) return null;
                      const pct = c.price_change_percentage_24h ?? 0;
                      return (
                        <div key={sym} className="flex items-center gap-1.5">
                          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">{sym}</span>
                          <span className="text-[10px] font-bold text-slate-200 font-mono">${Math.round(c.current_price || 0).toLocaleString()}</span>
                          <span className={`text-[10px] font-mono font-bold ${pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                    {marketData.fearGreed?.value != null && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">F&amp;G</span>
                        <span className="text-[10px] font-bold text-slate-200 font-mono">{marketData.fearGreed.value}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Hot lead call-to-action */}
                {hotLead && (
                  <button
                    onClick={() => go('leads')}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg border transition-all group"
                    style={{
                      background: degenMode ? 'rgba(249,115,22,0.08)' : 'rgba(16,185,129,0.05)',
                      borderColor: degenMode ? 'rgba(249,115,22,0.3)' : 'rgba(16,185,129,0.25)',
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Target size={13} style={{ color: degenMode ? '#f97316' : '#10b981' }} className="flex-shrink-0" />
                      <div className="min-w-0 flex-1 text-left">
                        <div className="text-[10px] uppercase tracking-wider font-black" style={{ color: degenMode ? '#f97316' : '#10b981' }}>
                          Top commission opportunity
                        </div>
                        <div className="text-[11px] text-white font-semibold truncate">
                          {hotLead.company || hotLead.name} · score {hotLead.score}/100 · {fmtUsd((hotLead.dealValue || 0) * 0.13)} if closed
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={12} className="text-slate-400 group-hover:text-white transition-colors flex-shrink-0" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
});
