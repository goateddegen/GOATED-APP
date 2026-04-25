import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Minimize2,
  Globe, Users, TrendingUp, Lightbulb,
  ChevronRight, ChevronDown, Check,
  BarChart3, Wallet, Zap, Target, ArrowRight,
  MessageSquare, Sparkles, LayoutDashboard, ExternalLink, Phone, UserSearch,
  Trophy, Flame, DollarSign, Clock, Activity, Shield, ClipboardList, FileText,
  Brain, Newspaper, BookOpen, Crosshair,
  Bell, Copy, Eye, AlertTriangle, Award
} from 'lucide-react';
import { useStore, fmt } from '../hooks/useStore';
import { GoatIcon } from './GoatLogo';
import { notify, requestNotifPermission, getNotifPermission } from '../utils/notifications';

// ─── STREAMING TEXT HOOK ──────────────────────────────────────────────
// Reveals text word-by-word for a streaming feel, even when the response arrives all at once
function useStreamingText(text, isLatest) {
  const [displayed, setDisplayed] = useState(text);
  const [isStreaming, setIsStreaming] = useState(false);
  const prevTextRef = useRef('');

  useEffect(() => {
    // Only stream if this is a new message (text changed) and it's the latest assistant message
    if (text === prevTextRef.current || !isLatest) {
      setDisplayed(text);
      return;
    }
    prevTextRef.current = text;

    // Split into words, preserving whitespace and markdown
    const words = text.split(/(\s+)/);
    let currentIndex = 0;
    setDisplayed('');
    setIsStreaming(true);

    // Reveal in large chunks for speed — no more sluggish drip
    const chunkSize = 12;
    const interval = setInterval(() => {
      currentIndex += chunkSize;
      if (currentIndex >= words.length) {
        setDisplayed(text);
        setIsStreaming(false);
        clearInterval(interval);
      } else {
        setDisplayed(words.slice(0, currentIndex).join(''));
      }
    }, 15); // 15ms per chunk = near-instant but still animated

    return () => clearInterval(interval);
  }, [text, isLatest]);

  return { displayed, isStreaming };
}

// ─── SIGNAL CATEGORIES ──────────────────────────────────────────────
const SIGNAL_CATEGORIES = {
  LEAD:    { icon: Users,        color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.2)', label: 'LEAD' },
  MARKET:  { icon: TrendingUp,   color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',  border: 'rgba(6,182,212,0.2)',  label: 'MARKET' },
  ALPHA:   { icon: Zap,          color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', label: 'ALPHA' },
  CLOSING: { icon: Check,        color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', label: 'CLOSING' },
  SYSTEM:  { icon: AlertTriangle,color: '#64748b', bg: 'rgba(100,116,139,0.1)',border: 'rgba(100,116,139,0.2)',label: 'SYSTEM' },
};

// ─── SIGNAL ENGINE HOOK ─────────────────────────────────────────────
// Generates contextual signals every 15-30 seconds from lead + market data
// NOTE: Uses refs for leads/currentPage so generateSignal stays stable and
// the setInterval doesn't thrash on every parent render.
function useSignalEngine(leads, currentPage) {
  const [signals, setSignals] = useState([]);
  const signalIdRef = useRef(0);
  const timerRef = useRef(null);
  const leadsRef = useRef(leads);
  const pageRef = useRef(currentPage);
  useEffect(() => { leadsRef.current = leads; pageRef.current = currentPage; }, [leads, currentPage]);

  // Signal generator templates — stable reference, reads from refs
  const generateSignal = useCallback(() => {
    const leads = leadsRef.current;
    const currentPage = pageRef.current;
    if (!leads || leads.length === 0) return null;

    const negotiating = leads.filter(l => l.status === 'negotiation');
    const qualified = leads.filter(l => l.status === 'qualified');
    const hotLeads = leads.filter(l => l.conversionProbability >= 75);
    const risingLeads = leads.filter(l => l.momentum === 'rising');
    const commissionRate = 0.12;

    // Weighted random: more relevant signals based on current page
    const pool = [];

    // Lead signals
    if (negotiating.length > 0) {
      const lead = negotiating[Math.floor(Math.random() * negotiating.length)];
      pool.push({
        category: 'LEAD',
        title: `${lead.name} in negotiation`,
        description: `${lead.company} — ${fmt(lead.dealValue)} deal moved to negotiation. ${lead.decisionTimeline || '2 weeks'} timeline.`,
        action: { label: 'View Lead', type: 'viewLead', leadId: lead.id, lead },
      });
    }
    if (hotLeads.length > 0) {
      const lead = hotLeads[Math.floor(Math.random() * hotLeads.length)];
      const days = 1 + Math.floor(Math.random() * 5);
      pool.push({
        category: 'LEAD',
        title: `High-prob lead needs contact`,
        description: `${lead.name} (${lead.conversionProbability}% close prob) hasn't been contacted in ${days} days.`,
        action: { label: 'View Lead', type: 'viewLead', leadId: lead.id, lead },
      });
    }
    if (qualified.length > 0) {
      const lead = qualified[Math.floor(Math.random() * qualified.length)];
      pool.push({
        category: 'LEAD',
        title: `Qualified lead ready for demo`,
        description: `${lead.name} at ${lead.company} — score ${lead.score}/100. Ready for proposal.`,
        action: { label: 'View Lead', type: 'viewLead', leadId: lead.id, lead },
      });
    }

    // Market signals
    const cryptos = [
      { name: 'BTC', price: '97,420', change: (2 + Math.random() * 4).toFixed(1), level: '100K' },
      { name: 'SOL', price: '198.50', change: (1 + Math.random() * 6).toFixed(1), level: '200' },
      { name: 'ETH', price: '3,840', change: (1 + Math.random() * 5).toFixed(1), level: '4,000' },
    ];
    const crypto = cryptos[Math.floor(Math.random() * cryptos.length)];
    const direction = Math.random() > 0.4 ? 'up' : 'down';
    pool.push({
      category: 'MARKET',
      title: `${crypto.name} ${direction} ${crypto.change}%`,
      description: `${direction === 'up' ? 'Momentum shift detected' : 'Pullback in progress'} — ${crypto.name} ${direction === 'up' ? 'approaching' : 'retreating from'} $${crypto.level} resistance.`,
      action: { label: 'See Analysis', type: 'navigate', page: 'trends' },
    });
    pool.push({
      category: 'MARKET',
      title: `Sector rotation signal`,
      description: `${['AI/ML', 'SaaS', 'Fintech', 'Healthcare', 'E-Commerce'][Math.floor(Math.random() * 5)]} sector showing ${Math.random() > 0.5 ? 'bullish' : 'bearish'} divergence on 4H timeframe.`,
      action: { label: 'See Analysis', type: 'navigate', page: 'trends' },
    });

    // Alpha signals
    const alphaPlays = [
      { title: 'Long ETH/BTC ratio divergence', desc: 'ETH/BTC ratio at 6-month low with bullish divergence on RSI. Mean reversion play.' },
      { title: 'SOL DeFi TVL breakout', desc: 'SOL DeFi TVL up 18% this week. Leading indicator for price action.' },
      { title: 'Prediction market edge found', desc: 'Kalshi BTC >$100K by June priced at 42% — GOATED AI estimates 68%. +26% alpha.' },
      { title: 'Macro divergence play', desc: 'DXY weakening while crypto holds. Historical correlation suggests 15% upside in 2 weeks.' },
      { title: 'Smart money accumulation', desc: 'Whale wallets adding BTC for 5th consecutive day. On-chain signal bullish.' },
    ];
    const alpha = alphaPlays[Math.floor(Math.random() * alphaPlays.length)];
    pool.push({
      category: 'ALPHA',
      title: alpha.title,
      description: alpha.desc,
      action: { label: 'Copy Trade', type: 'copy', text: `ALPHA PLAY: ${alpha.title}\n${alpha.desc}` },
    });

    // Closing signals
    if (negotiating.length > 0) {
      const totalValue = negotiating.reduce((s, l) => s + l.dealValue, 0);
      const commission = Math.round(totalValue * commissionRate);
      pool.push({
        category: 'CLOSING',
        title: `${negotiating.length} leads ready to close`,
        description: `Combined pipeline: ${fmt(totalValue)} — your commission: $${commission.toLocaleString()}. Start closing today.`,
        action: { label: 'Start Closing', type: 'openCoach' },
      });
    }
    if (risingLeads.length > 0) {
      const top = risingLeads.sort((a, b) => b.dealValue - a.dealValue)[0];
      pool.push({
        category: 'CLOSING',
        title: `Deal momentum rising`,
        description: `${top.name} at ${top.company} showing positive signals — ${fmt(top.dealValue)} deal worth $${Math.round(top.dealValue * commissionRate).toLocaleString()} commission.`,
        action: { label: 'Start Closing', type: 'openCoach' },
      });
    }

    // System signal (rare)
    if (Math.random() < 0.15) {
      const systemMsgs = [
        { title: 'Pipeline health check', description: `${leads.filter(l => l.status !== 'won' && l.status !== 'lost').length} active leads in pipeline. ${hotLeads.length} high-probability.` },
        { title: 'Weekly target update', description: `You need ${Math.max(0, 3 - Math.floor(Math.random() * 2))} more closes this week to hit target.` },
        { title: 'AI model updated', description: 'GOATED AI predictions recalibrated with latest market data. Recalibrated with latest data.' },
      ];
      const sys = systemMsgs[Math.floor(Math.random() * systemMsgs.length)];
      pool.push({
        category: 'SYSTEM',
        title: sys.title,
        description: sys.description,
        action: { label: 'Dismiss', type: 'dismiss' },
      });
    }

    // Weight selection toward current page context
    let weights = pool.map(() => 1);
    pool.forEach((sig, i) => {
      if (currentPage === 'leads' && (sig.category === 'LEAD' || sig.category === 'CLOSING')) weights[i] = 3;
      if (currentPage === 'trends' && (sig.category === 'MARKET' || sig.category === 'ALPHA')) weights[i] = 3;
      if (currentPage === 'dashboard' && sig.category === 'CLOSING') weights[i] = 2;
    });
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }, []); // Stable — reads from refs above

  useEffect(() => {
    const schedule = () => {
      const delay = 15000 + Math.random() * 15000; // 15-30 seconds
      timerRef.current = setTimeout(() => {
        // Skip signal generation when tab is hidden to save resources
        if (!document.hidden) {
          const signal = generateSignal();
          if (signal) {
            signalIdRef.current += 1;
            const newSignal = {
              ...signal,
              id: signalIdRef.current,
              timestamp: Date.now(),
              read: false,
            };
            setSignals(prev => [newSignal, ...prev].slice(0, 20)); // Keep last 20

            // Fire push notification for high-value signals (ALPHA/CLOSING)
            // — only when chat is closed AND tab is focused but backgrounded-friendly
            if (signal.category === 'ALPHA' || signal.category === 'CLOSING') {
              notify({
                title: signal.title,
                body: signal.description,
                tag: `signal-${signal.category}`,
                category: signal.category,
              });
            }
          }
        }
        schedule();
      }, delay);
    };

    // Generate initial signal quickly
    const initTimer = setTimeout(() => {
      const signal = generateSignal();
      if (signal) {
        signalIdRef.current += 1;
        setSignals([{
          ...signal,
          id: signalIdRef.current,
          timestamp: Date.now(),
          read: false,
        }]);
      }
      schedule();
    }, 3000);

    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(initTimer);
    };
  }, [generateSignal]);

  const markAllRead = useCallback(() => {
    setSignals(prev => prev.map(s => ({ ...s, read: true })));
  }, []);

  const dismissSignal = useCallback((id) => {
    setSignals(prev => prev.filter(s => s.id !== id));
  }, []);

  const unreadCount = useMemo(() => signals.filter(s => !s.read).length, [signals]);

  return { signals, unreadCount, markAllRead, dismissSignal };
}

// ─── NOTIFICATION FEED COMPONENT ────────────────────────────────────
// Memoized to prevent re-renders of the entire AIOverlay when signals update
const NotificationFeed = React.memo(function NotificationFeed({ signals, onAction, onDismiss, degenMode }) {
  const formatTime = (ts) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const latest = signals.slice(0, 5);

  if (latest.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <Bell size={20} className="mx-auto mb-2 text-slate-600" />
        <div className="text-[11px] text-slate-500">No signals yet</div>
        <div className="text-[10px] text-slate-600 mt-1">Signals will appear as they're detected</div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/[0.04]">
      {latest.map((signal) => {
        const cat = SIGNAL_CATEGORIES[signal.category] || SIGNAL_CATEGORIES.SYSTEM;
        const Icon = cat.icon;
        return (
          <div key={signal.id} className="px-3 py-2.5 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-start gap-2.5">
              {/* Icon */}
              <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                <Icon size={13} style={{ color: cat.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
                    style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>
                    {cat.label}
                  </span>
                  <span className="text-[9px] text-slate-600">{formatTime(signal.timestamp)}</span>
                  {!signal.read && (
                    <div className="w-1.5 h-1.5 rounded-full ml-auto shrink-0"
                      style={{ background: degenMode ? '#f97316' : '#10b981' }} />
                  )}
                </div>
                <div className="text-[11px] font-semibold text-slate-200 leading-tight mb-0.5 truncate">
                  {signal.title}
                </div>
                <div className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                  {signal.description}
                </div>

                {/* Action button */}
                {signal.action && signal.action.type !== 'dismiss' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onAction(signal); }}
                    className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-semibold transition-all hover:brightness-125"
                    style={{
                      background: cat.bg,
                      color: cat.color,
                      border: `1px solid ${cat.border}`,
                    }}
                  >
                    {signal.category === 'ALPHA' && <Copy size={8} />}
                    {signal.category === 'LEAD' && <Eye size={8} />}
                    {signal.category === 'MARKET' && <TrendingUp size={8} />}
                    {signal.category === 'CLOSING' && <Target size={8} />}
                    {signal.action.label}
                    <ArrowRight size={8} />
                  </button>
                )}
                {signal.action && signal.action.type === 'dismiss' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDismiss(signal.id); }}
                    className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-medium text-slate-500 bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-all"
                  >
                    <X size={8} />
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ─── FEATURE LINK MAP ─────────────────────────────────────────────────
// Maps keywords found in AI responses to navigable pages
const FEATURE_LINKS = {
  leads:      { page: 'leads',     label: 'Leads',      icon: Users },
  lead:       { page: 'leads',     label: 'Leads',      icon: Users },
  pipeline:   { page: 'leads',     label: 'Pipeline',   icon: Users },
  trends:     { page: 'trends',    label: 'TrendPulse', icon: TrendingUp },
  trend:      { page: 'trends',    label: 'TrendPulse', icon: TrendingUp },
  trendpulse: { page: 'trends',    label: 'TrendPulse', icon: TrendingUp },
  sentiment:  { page: 'trends',    label: 'TrendPulse', icon: TrendingUp },
  market:     { page: 'trends',    label: 'TrendPulse', icon: TrendingUp },
  // v7.5 — markets/prediction/crypto/solana/casino keywords removed; B2B agency only
  audit:      { page: 'audit',     label: 'Audit',      icon: Award },
  leak:       { page: 'audit',     label: 'Audit',      icon: Award },
  wallet:     { page: 'wallet',    label: 'Wallet',     icon: Wallet },
  dashboard:  { page: 'dashboard', label: 'Dashboard',  icon: BarChart3 },
  admin:      { page: 'admin',     label: 'Admin',      icon: LayoutDashboard },
};

// Snap modes removed — AI overlay is always right panel

// ─── CONTEXT-AWARE SUGGESTED PROMPTS ───────────────────────────────────
const PAGE_PROMPTS = {
  home: [
    { label: 'Find leads in Miami', icon: Globe },
    { label: 'Walk Me Through Leads', icon: ClipboardList },
    { label: 'Show $50K+ deals', icon: DollarSign },
    { label: 'Market trends today', icon: TrendingUp },
  ],
  dashboard: [
    { label: 'Pipeline review', icon: BarChart3 },
    { label: 'Performance brief', icon: TrendingUp },
    { label: 'Which leads need follow-up?', icon: Users },
    { label: 'Show me win/loss trends', icon: Target },
  ],
  leads: [
    { label: 'Walk me through top leads', icon: ClipboardList },
    { label: 'Close strategy for lead', icon: Target },
    { label: 'Find $20K+ deals', icon: DollarSign },
    { label: 'Best leads to close this week', icon: Sparkles },
  ],
  trends: [
    { label: 'Market pulse', icon: TrendingUp },
    { label: 'Best alpha plays', icon: Zap },
    { label: 'Deep research trends', icon: Lightbulb },
    { label: 'Compare fintech vs SaaS', icon: Globe },
  ],
  market: [
    { label: 'Global market pulse', icon: Globe },
    { label: 'Competitor landscape', icon: Target },
    { label: 'Emerging opportunities', icon: Lightbulb },
    { label: 'Investment signals', icon: Zap },
  ],
  admin: [
    { label: 'System health overview', icon: BarChart3 },
    { label: 'User analytics summary', icon: Users },
    { label: 'Revenue performance', icon: TrendingUp },
    { label: 'Platform optimization tips', icon: Lightbulb },
  ],
  wallet: [
    { label: 'Revenue breakdown', icon: Wallet },
    { label: 'Spending analysis', icon: BarChart3 },
    { label: 'Projected earnings', icon: TrendingUp },
    { label: 'Cost optimization tips', icon: Lightbulb },
  ],
};

// COACH MODE prompts — tactical closing advice
const COACH_PROMPTS = {
  leads: [
    { label: 'Best opener for this lead', icon: Phone },
    { label: 'Handle price objection', icon: Shield },
    { label: 'Follow-up email template', icon: Send },
    { label: 'Next best action to close', icon: Target },
  ],
  home: [
    { label: 'Who should I call right now?', icon: Phone },
    { label: 'Revenue gap analysis', icon: DollarSign },
    { label: 'Weekly closing game plan', icon: Target },
    { label: 'Pipeline health check', icon: Activity },
  ],
  dashboard: [
    { label: 'What deals are at risk?', icon: Shield },
    { label: 'Commission forecast', icon: DollarSign },
    { label: 'Top 3 actions today', icon: Target },
    { label: 'Win rate improvement tips', icon: TrendingUp },
  ],
};

// DEGEN MODE prompts — aggressive, Wolf of Wall Street style
const DEGEN_PROMPTS = {
  home: [
    { label: 'Show me the money plays', icon: Zap },
    { label: 'Who should I ape into?', icon: Users },
    { label: "What's pumping today?", icon: TrendingUp },
    { label: 'Give me a 100x idea', icon: Lightbulb },
  ],
  dashboard: [
    { label: 'Am I winning or losing?', icon: BarChart3 },
    { label: 'Which deals are mooning?', icon: TrendingUp },
    { label: 'Who do I need to call NOW?', icon: Users },
    { label: 'Show me the bag tracker', icon: Target },
  ],
  leads: [
    { label: 'Find me a whale to close', icon: Target },
    { label: 'Write me killer cold call script', icon: Send },
    { label: 'Who has the biggest bags?', icon: Zap },
    { label: 'Speed run: close in 24hrs', icon: Sparkles },
  ],
  trends: [
    { label: "What's the alpha play right now?", icon: TrendingUp },
    { label: 'Show me pump signals', icon: BarChart3 },
    { label: 'Which sector is about to moon?', icon: Lightbulb },
    { label: 'Degen market analysis', icon: Globe },
  ],
  market: [
    { label: 'Full degen market scan', icon: Globe },
    { label: 'Who are we conquering?', icon: Target },
    { label: 'Find me asymmetric bets', icon: Lightbulb },
    { label: 'Whale movement alerts', icon: Zap },
  ],
  admin: [
    { label: 'Show me the revenue matrix', icon: BarChart3 },
    { label: 'Who are the power users?', icon: Users },
    { label: 'Revenue machine status', icon: TrendingUp },
    { label: 'How do we 10x this?', icon: Lightbulb },
  ],
  wallet: [
    { label: 'How fat are my bags?', icon: Wallet },
    { label: 'Revenue go BRRR analysis', icon: BarChart3 },
    { label: 'When do I hit $1M?', icon: TrendingUp },
    { label: 'Maximize my earnings', icon: Lightbulb },
  ],
};

// ─── QUICK INSIGHT BUTTONS ─────────────────────────────────────────────
const QUICK_INSIGHTS = [
  { label: 'Daily Brief', prompt: 'Give me a daily brief: top 3 pipeline priorities, market conditions affecting my deals, and the single most important action I should take today. Keep it tight.', icon: Newspaper },
  { label: 'Market Pulse', prompt: 'Research the current market pulse: macro conditions, sector momentum, crypto sentiment, and how it all impacts B2B sales right now. Deep research mode.', icon: TrendingUp },
  { label: 'Pipeline Review', prompt: 'Analyze my full pipeline: deals at risk, biggest opportunities, conversion bottlenecks, and revenue forecast for next 30 days. Be specific with names and numbers.', icon: ClipboardList },
  { label: 'Close Playbook', prompt: 'Build me a closing playbook for today: which leads to call first, what to say, objection handling for each, and commission impact. Make it actionable.', icon: Crosshair },
];

// ─── DEGEN ALPHA INSIGHT BUTTONS ─────────────────────────────────────────
const DEGEN_INSIGHTS = [
  { label: 'Best Alpha Plays', prompt: 'Research the best alpha plays right now — crypto, prediction markets, and B2B deals. What has the highest asymmetric upside? Deep research mode.', icon: Zap },
  { label: 'Whale Movements', prompt: 'Analyze whale movements and smart money flow: what are institutions buying, what sectors are seeing unusual volume, and where is the smart money positioning? Deep dive.', icon: Globe },
  { label: 'Sentiment Shifts', prompt: 'Research sentiment shifts across markets: what narratives are gaining momentum, what is losing steam, and what contrarian plays have the best risk/reward? Analyze everything.', icon: Brain },
  { label: 'Degen Playbook', prompt: 'Build me a full degen playbook: highest conviction trades, prediction market edges, and pipeline deals I can speed-close today. Go aggressive. NFA.', icon: Flame },
];

// ─── DEGEN QUICK ACTION BUTTONS (below chat input) ──────────────────
const DEGEN_QUICK_ACTIONS = {
  leads: [
    { label: 'Best Alpha RN', prompt: 'What are the highest-conviction leads I should ape into RIGHT NOW? Show me the best risk-reward ratios in my pipeline. LFG.', icon: Zap },
    { label: 'Who to Ape Into', prompt: 'Which leads have whale-level potential? Show me the biggest bags I can close today. Send it.', icon: Target },
    { label: 'Whale Alert', prompt: 'Whale alert mode: show me the largest deal values in my pipeline with momentum signals. Who is about to close?', icon: Globe },
    { label: 'Degen Playbook', prompt: 'Build me a full degen closing playbook: speed-close strategies, aggressive scripts, and commission moonshots. NFA.', icon: Flame },
    { label: 'Send It Analysis', prompt: 'Send it analysis: which deals should I go all-in on today? Give me conviction scores and exact next moves. WAGMI.', icon: Sparkles },
  ],
  trends: [
    { label: 'Best Alpha RN', prompt: 'What is the absolute best alpha play right now across all markets? High conviction only. Send it.', icon: Zap },
    { label: 'Whale Movements', prompt: 'Track whale movements: what are institutions and smart money doing right now? Where is volume spiking?', icon: Globe },
    { label: 'Degen Market Scan', prompt: 'Full degen market scan: momentum trades, pump signals, sector rotation, and asymmetric bets. Go aggressive.', icon: Flame },
    { label: 'Send It Analysis', prompt: 'Send it analysis on current market conditions: what has the best risk-reward ratio right now? NFA.', icon: Sparkles },
  ],
  market: [
    { label: 'Best Alpha RN', prompt: 'Best alpha right now across prediction markets, crypto, and B2B. Highest conviction plays only.', icon: Zap },
    { label: 'Whale Alert', prompt: 'Whale alert: show me unusual volume, smart money flow, and institutional positioning across all markets.', icon: Globe },
    { label: 'Degen Playbook', prompt: 'Build me a full degen playbook: prediction market edges, asymmetric bets, and speed-close pipeline plays.', icon: Flame },
    { label: 'Send It Analysis', prompt: 'Send it analysis: where should I deploy capital right now for maximum asymmetric upside? Go aggressive. NFA.', icon: Sparkles },
  ],
  dashboard: [
    { label: 'Best Alpha RN', prompt: 'What are my highest-alpha pipeline plays right now? Show me where the money is. LFG.', icon: Zap },
    { label: 'Who to Ape Into', prompt: 'Which deals should I ape into today? Rank by close probability x deal size. Send it.', icon: Target },
    { label: 'Degen Playbook', prompt: 'Degen pipeline playbook: aggressive close strategies for every deal in negotiation. No paper hands allowed.', icon: Flame },
    { label: 'Send It Analysis', prompt: 'Full send it analysis on my pipeline: what is mooning, what is dumping, and where do I double down?', icon: Sparkles },
  ],
};

// ─── CONTEXTUAL QUICK ACTION BUTTONS (below chat input) ──────────────
const QUICK_ACTIONS = {
  leads: [
    { label: 'Walk Me Through Leads', prompt: 'Walk me through my top leads sorted by close probability. Show my top 5 highest-probability leads under $20K with name, company, deal value, close probability, recommended next action, and why each lead is closeable.', icon: ClipboardList },
    { label: 'Leads in Austin', prompt: 'Show me leads in Austin', icon: Globe },
    { label: 'Leads in NYC', prompt: 'Show me leads in New York', icon: Globe },
    { label: '$50K+ Deals', prompt: 'Show me leads with $50K+ deal values', icon: DollarSign },
    { label: 'SaaS Leads', prompt: 'Find SaaS companies in my pipeline', icon: Target },
    { label: 'Coach Me', prompt: 'Coach me on closing my current lead — what should I do right now?', icon: Trophy },
    { label: 'Who to Call?', prompt: 'Based on my pipeline, who should I call right now for the highest chance of closing?', icon: Phone },
  ],
  trends: [
    { label: 'Best Plays Right Now', prompt: 'What are the best money plays right now based on current trends and prediction markets?', icon: Zap },
    { label: 'Monetize This Trend', prompt: 'How do I monetize the current trending sectors? Give me specific plays with dollar amounts.', icon: DollarSign },
    { label: 'Risk Analysis', prompt: 'Run a risk analysis on current market conditions — what should I avoid?', icon: Shield },
    { label: 'Portfolio Strategy', prompt: 'Build me an optimal portfolio strategy splitting between B2B closing and prediction markets', icon: Target },
  ],
  market: [
    { label: 'Alpha Scan', prompt: 'Run an alpha scan — find me asymmetric bets and prediction market edges right now', icon: Activity },
    { label: 'Best Bets', prompt: 'What are the best prediction market bets right now? Show me odds, edge, and expected value.', icon: Flame },
    { label: 'Spread Comparison', prompt: 'Compare spreads across Kalshi and Polymarket — where are the pricing inefficiencies?', icon: BarChart3 },
    { label: 'DEGEN Mode Picks', prompt: 'Give me your highest conviction DEGEN plays — high risk, high reward. I want 10x potential.', icon: Zap },
  ],
};

// ─── TEMPLATE FALLBACK RESPONSES ───────────────────────────────────────
function getTemplateResponse(msg, leads, { coachMode, selectedLead, revenueStats, degenMode } = {}) {
  const lower = msg.toLowerCase();
  const stats = revenueStats || {};
  const wonLeadsAll = leads.filter(l => l.status === 'won');
  const totalWonValue = wonLeadsAll.reduce((s, l) => s + l.dealValue, 0);
  const commissionRate = 0.12;
  const currentMRR = Math.round((totalWonValue * commissionRate) / 12);
  const mrrGoal = 25000;
  const distanceToGoal = Math.max(0, mrrGoal - currentMRR);
  const negotiatingLeads = leads.filter(l => l.status === 'negotiation');
  const weeklyCloses = Math.min(wonLeadsAll.length, 3 + Math.floor(Math.random() * 4));
  const streakCount = 2 + Math.floor(Math.random() * 5);

  // ── COACH MODE: Closing guidance with $ amounts ──────────────────
  if (coachMode && (lower.includes('coach') || lower.includes('close') || lower.includes('closing') || lower.includes('what should') || lower.includes('next step') || lower.includes('help me'))) {
    if (selectedLead) {
      const commission = Math.round(selectedLead.dealValue * commissionRate);
      const daysInStage = 1 + Math.floor(Math.random() * 7);
      const closeSteps = {
        'new': { step: 'Discovery Call', next: `Schedule a discovery call with ${selectedLead.name.split(' ')[0]} TODAY. Ask about their ${(selectedLead.painPoints||[])[0]?.toLowerCase() || 'biggest challenge'}.` },
        'contacted': { step: 'Follow-Up', next: `Send a follow-up to ${selectedLead.name.split(' ')[0]} — reference your last conversation and share a case study from their industry (${selectedLead.industry}).` },
        'qualified': { step: 'Demo/Proposal', next: `${selectedLead.name.split(' ')[0]} is qualified! Prepare a tailored demo focusing on: ${(selectedLead.painPoints||[]).slice(0, 2).join(' and ')}. Book it THIS WEEK.` },
        'negotiation': { step: 'Negotiation Close', next: `You should call ${selectedLead.name.split(' ')[0]} NOW — they've been in Negotiation for ${daysInStage} days. Decision timeline is ${selectedLead.decisionTimeline || '2 weeks'} — close TODAY.` },
        'won': { step: 'Closed Won!', next: `This deal is CLOSED! That's **$${commission.toLocaleString()}** in commission. Time to upsell or get a referral.` },
        'lost': { step: 'Re-engage', next: `This one slipped — but it's worth **$${commission.toLocaleString()}** in commission. Wait 30 days and re-approach with a new angle.` },
      };
      const stageInfo = closeSteps[selectedLead.status] || closeSteps['new'];
      return `**Closing Coach — ${selectedLead.name}**\n\n---\n\n**Current Stage:** ${stageInfo.step}\n**Deal Value:** ${fmt(selectedLead.dealValue)} | **Your Commission:** $${commission.toLocaleString()}\n**Score:** ${selectedLead.score}/100 | **Conversion Prob:** ${selectedLead.conversionProbability}%\n\n**Next Action:**\n${stageInfo.next}\n\n---\n\n**Revenue Impact:**\n- This lead is worth **$${commission.toLocaleString()} in commission** to you\n- Decision timeline is **${selectedLead.decisionTimeline || '2 weeks'}** — ${selectedLead.decisionTimeline === 'Immediate' ? 'CLOSE NOW' : 'call TODAY'}\n- You need **${Math.ceil(distanceToGoal / (commission || 1))} more closes** like this for your **$25K MRR goal**\n- Your pipeline has **$${Math.round(negotiatingLeads.reduce((s, l) => s + l.dealValue, 0) * commissionRate).toLocaleString()}** in pending commission\n\n**Pro Tips:**\n- Best method for this lead: **${selectedLead.bestMethod || 'Phone call'}**\n- Buying signals: ${(selectedLead.buyingSignals||[]).join(', ') || 'None detected yet'}\n- Competitor using: ${selectedLead.competitorUsing || 'Unknown'}\n\nKeep grinding! You're on a **${streakCount}-day closing streak**.`;
    }
    return `**Closing Coach — Pipeline Overview**\n\n---\n\n**Your Revenue Dashboard:**\n- Current MRR: **$${currentMRR.toLocaleString()}** (from ${wonLeadsAll.length} won deals)\n- Distance to $25K goal: **$${distanceToGoal.toLocaleString()}** remaining\n- Deals in negotiation: **${negotiatingLeads.length}** worth **${fmt(negotiatingLeads.reduce((s, l) => s + l.dealValue, 0))}**\n- Pending commission: **$${Math.round(negotiatingLeads.reduce((s, l) => s + l.dealValue, 0) * commissionRate).toLocaleString()}**\n- Closing streak: **${streakCount} days**\n\n---\n\n**Who to Call RIGHT NOW:**\n${negotiatingLeads.slice(0, 3).map((l, i) => {
      const comm = Math.round(l.dealValue * commissionRate);
      return `${i + 1}. **${l.name}** (${l.company}) — $${comm.toLocaleString()} commission | Score: ${l.score}/100 | ${l.decisionTimeline || 'ASAP'}`;
    }).join('\n')}\n\n**This Week's Goal:**\n- Close **2 more deals** to hit your weekly target\n- Total pipeline commission available: **$${Math.round(leads.reduce((s, l) => s + l.dealValue, 0) * commissionRate).toLocaleString()}**\n- Focus on leads in **Negotiation** stage first\n\nSelect a lead to get personalized coaching!`;
  }

  // ── COACH MODE: Celebration after action ─────────────────────────
  if (coachMode && (lower.includes('called') || lower.includes('sent') || lower.includes('closed') || lower.includes('done') || lower.includes('booked') || lower.includes('scheduled'))) {
    const topLead = selectedLead || leads[0];
    const commission = Math.round(topLead.dealValue * commissionRate);
    return `**Great move! Let's keep the momentum going.**\n\n---\n\nThat's **$${commission.toLocaleString()} in commission** if you close this.\n\n**Your Stats Today:**\n- Deals in progress: **${negotiatingLeads.length}**\n- Revenue this week: **$${Math.round(currentMRR / 4).toLocaleString()}** (estimated)\n- Closing streak: **${streakCount} days**\n- Pipeline health: **${leads.filter(l => l.momentum === 'rising').length} leads rising**\n\n**Next Move:**\n${negotiatingLeads.length > 0 ? `Call **${negotiatingLeads[0].name}** at ${negotiatingLeads[0].company} — they're worth $${Math.round(negotiatingLeads[0].dealValue * commissionRate).toLocaleString()} in commission and their decision timeline is ${negotiatingLeads[0].decisionTimeline || '2 weeks'}.` : 'Focus on qualifying more leads into your pipeline.'}\n\nYou're **${distanceToGoal > 0 ? `$${distanceToGoal.toLocaleString()} away from` : 'CRUSHING'}** your $25K MRR goal!`;
  }

  // ── TRENDPULSE MONETIZATION HELPER ───────────────────────────────
  if (lower.includes('monetize') || lower.includes('make money') || lower.includes('trade') || lower.includes('play') || lower.includes('bet') || lower.includes('prediction') || lower.includes('best plays') || lower.includes('money play')) {
    const pipelineCommission = Math.round(leads.reduce((s, l) => s + l.dealValue, 0) * commissionRate);
    const top3Commission = Math.round(leads.slice(0, 3).reduce((s, l) => s + l.dealValue, 0) * commissionRate);
    const lostLeads = leads.filter(l => l.status === 'lost');
    const lostRevenue = fmt(lostLeads.reduce((s, l) => s + l.dealValue, 0));
    return `**TrendPulse Money Plays**\n\nBased on current signals, here are your top plays:\n\n---\n\n**1. BTC Prediction Play** (Kalshi)\n- BTC above $100K by June → YES at $0.42 (58% implied)\n- GOATED AI confidence: 72% → **+30% alpha edge**\n- Bet $100 → Win $238 if YES | Risk: $100\n- [Place Bet on Kalshi →]\n\n**2. SOL Momentum Trade**\n- SOL showing rising momentum (+6.3% 24h)\n- Entry: $198 | Target: $220 | Stop: $185\n- Risk/Reward: 1:1.7\n- [Copy Trade Setup →]\n\n**3. B2B Revenue Play**\n- Your pipeline has **${lostRevenue}** in lost revenue leads\n- Close just 3 of your top 10 → **$${top3Commission.toLocaleString()} in commission**\n- [Call Top Lead Now →]\n\n---\n\n**Strategy: Split your time 70/30**\n- 70% → B2B closing (guaranteed commission)\n- 30% → Prediction markets (alpha plays)\n- Target: **$25K MRR** from closing + **$5K/mo** from trading\n\n**Your Edge:**\n- Total pipeline commission: **$${pipelineCommission.toLocaleString()}**\n- Current MRR: **$${currentMRR.toLocaleString()}**\n- ${negotiatingLeads.length} deals in negotiation ready to close\n\nGo to **Markets** for live prediction data, or **Leads** to start closing.`;
  }

  // Navigation intent detection — short-circuits LLM for "go to X" / "open X" commands
  // Exception: if the user is asking to SEARCH leads ("leads in austin", "show me $100k deals"),
  // fall through to the specialized lead search below.
  const isNavVerb = /(?:\bgo to\b|\bopen\b|\btake me to\b|\bswitch to\b|^show me\b|^show\b)/i.test(lower);
  const isLeadSearch = lower.includes('lead') && /(?: in | above | below | over | under | industry | score | \$)/i.test(lower);
  if (isNavVerb && !isLeadSearch) {
    const navMap = {
      'dashboard': 'dashboard', 'dash': 'dashboard',
      'trend': 'trends', 'trendpulse': 'trends', 'market': 'trends', 'alpha': 'trends',
      'lead': 'leads', 'pipeline': 'leads',
      'audit': 'audit', 'leak': 'audit', 'revenue audit': 'audit',
      'managed': 'leads', 'dfy': 'leads', 'done for you': 'leads', 'management': 'leads',
      'wallet': 'wallet', 'earnings': 'wallet', 'commission': 'wallet', 'payout': 'wallet', 'stripe': 'wallet',
      'admin': 'admin', 'settings': 'admin', 'account': 'admin',
      'home': 'home', 'homepage': 'home', 'landing': 'home',
    };
    for (const [keyword, page] of Object.entries(navMap)) {
      if (lower.includes(keyword)) {
        return `Routing → **${page.charAt(0).toUpperCase() + page.slice(1)}**\n\n[NAVIGATE:${page}]`;
      }
    }
  }

  // Location-specific lead search (fallback)
  const FALLBACK_LOCATIONS = [
    'San Francisco', 'New York', 'Austin', 'Seattle', 'Boston', 'Chicago', 'Denver', 'Miami', 'LA', 'London',
    'Toronto', 'Berlin', 'Paris', 'Amsterdam', 'Dublin', 'Singapore', 'Sydney', 'Tokyo', 'Hong Kong', 'Tel Aviv',
    'Portland', 'Nashville', 'Atlanta', 'Dallas', 'Phoenix', 'San Diego', 'Philadelphia', 'Minneapolis', 'Detroit', 'Charlotte',
    'Raleigh', 'Salt Lake City', 'Pittsburgh', 'Columbus', 'Indianapolis', 'Tampa', 'Orlando', 'Las Vegas', 'Kansas City', 'St Louis',
  ];
  const FALLBACK_ALIASES = {
    'sf': 'San Francisco', 'nyc': 'New York', 'los angeles': 'LA', 'la': 'LA',
    'vegas': 'Las Vegas', 'philly': 'Philadelphia', 'atl': 'Atlanta',
  };

  // Check if user is asking about a specific location
  let searchLocation = null;
  for (const [alias, mapped] of Object.entries(FALLBACK_ALIASES)) {
    if (lower.includes(alias)) { searchLocation = mapped; break; }
  }
  if (!searchLocation) {
    for (const loc of FALLBACK_LOCATIONS) {
      if (lower.includes(loc.toLowerCase())) { searchLocation = loc; break; }
    }
  }

  if (searchLocation && (lower.includes('lead') || lower.includes('show') || lower.includes('find') || lower.includes('search') || lower.includes('in '))) {
    const locationLeads = leads.filter(l => l.location === searchLocation).sort((a, b) => b.score - a.score);
    if (locationLeads.length === 0) {
      return `**No leads found in ${searchLocation}.**\n\nOur database doesn't have leads in that location. Try searching in nearby cities:\n\n- **Austin**, **Dallas**, **Atlanta**, **Miami**, **Chicago**\n\nOr go to **Leads** to browse all ${leads.length.toLocaleString()} leads.`;
    }
    const top = locationLeads.slice(0, 5);
    const totalValue = locationLeads.reduce((s, l) => s + l.dealValue, 0);
    let res = `**Leads in ${searchLocation}** — ${locationLeads.length} found, **${fmt(totalValue)}** total pipeline\n\n---\n\n`;
    top.forEach((l) => {
      res += `[LEAD_CARD:${l.id}]\n`;
      res += `   Score: **${l.score}**/100 | Value: **${fmt(l.dealValue)}** | ${l.priority.toUpperCase()} | Conv: ${l.conversionProbability}%\n\n`;
    });
    if (locationLeads.length > 5) {
      res += `\n...and **${locationLeads.length - 5} more** in ${searchLocation}.\n\n`;
    }
    res += `---\n\nGo to **Leads** to see all results. Want outreach scripts for any of these?\n\n[NAVIGATE:leads]`;
    return res;
  }

  // Check for unlisted cities
  const UNLISTED = ['houston', 'san antonio', 'sacramento', 'san jose', 'washington', 'dc', 'new orleans', 'baltimore', 'memphis'];
  for (const city of UNLISTED) {
    if (lower.includes(city) && (lower.includes('lead') || lower.includes('show') || lower.includes('find'))) {
      const name = city.charAt(0).toUpperCase() + city.slice(1);
      return `**No leads found in ${name}.**\n\nThat city isn't in our current database. Try these nearby cities instead:\n\n- **Austin**, **Dallas**, **Atlanta**, **Miami**, **Nashville**\n\nOr go to **Leads** to browse all ${leads.length.toLocaleString()} leads.`;
    }
  }

  // Deal size filter
  const dealSizeMatch = lower.match(/\$\s*([\d,.]+)\s*[kK]/) || lower.match(/([\d,.]+)\s*[kK]\+?\s*(?:deal|lead|value)/);
  if (dealSizeMatch && (lower.includes('deal') || lower.includes('lead') || lower.includes('show') || lower.includes('find') || lower.includes('above') || lower.includes('over'))) {
    const minVal = parseFloat(dealSizeMatch[1].replace(/,/g, '')) * 1000;
    const bigDeals = leads.filter(l => l.dealValue >= minVal).sort((a, b) => b.dealValue - a.dealValue);
    if (bigDeals.length === 0) {
      return `**No leads found with deal value above $${minVal.toLocaleString()}.**\n\nTry a lower threshold or go to **Leads** to browse all leads.`;
    }
    const top = bigDeals.slice(0, 5);
    const totalValue = bigDeals.reduce((s, l) => s + l.dealValue, 0);
    let res = `**$${(minVal/1000)}K+ Deals** — ${bigDeals.length} found, **${fmt(totalValue)}** total\n\n---\n\n`;
    top.forEach((l) => {
      res += `[LEAD_CARD:${l.id}]\n`;
      res += `   **${fmt(l.dealValue)}** | ${l.location} | ${l.industry} | Score: ${l.score}/100\n\n`;
    });
    if (bigDeals.length > 5) res += `...and **${bigDeals.length - 5} more** above $${(minVal/1000)}K.\n\n`;
    res += `---\n\nGo to **Leads** for full results.\n\n[NAVIGATE:leads]`;
    return res;
  }

  // Industry filter
  const FALLBACK_INDUSTRIES = ['SaaS', 'Fintech', 'AI/ML', 'Healthcare', 'Cybersecurity', 'EdTech', 'E-commerce', 'Gaming', 'Web3/Crypto'];
  let searchIndustry = null;
  if (/\bsaas\b/i.test(lower)) searchIndustry = 'SaaS';
  else if (/\bfintech\b/i.test(lower)) searchIndustry = 'Fintech';
  else if (/\bai\b|\bml\b/i.test(lower)) searchIndustry = 'AI/ML';
  else if (/\bcyber/i.test(lower)) searchIndustry = 'Cybersecurity';
  else if (/\bhealth/i.test(lower)) searchIndustry = 'Healthcare';
  else if (/\bedtech\b|\beducation\b/i.test(lower)) searchIndustry = 'EdTech';
  else if (/\bgaming\b/i.test(lower)) searchIndustry = 'Gaming';
  else if (/\bcrypto\b|\bweb3\b/i.test(lower)) searchIndustry = 'Web3/Crypto';
  else if (/\becommerce\b|\be-comm/i.test(lower)) searchIndustry = 'E-commerce';

  if (searchIndustry && (lower.includes('lead') || lower.includes('find') || lower.includes('show') || lower.includes('compan'))) {
    const indLeads = leads.filter(l => l.industry === searchIndustry).sort((a, b) => b.score - a.score);
    if (indLeads.length === 0) {
      return `**No ${searchIndustry} leads found.**\n\nTry another industry or go to **Leads** to browse all leads.`;
    }
    const top = indLeads.slice(0, 5);
    const totalValue = indLeads.reduce((s, l) => s + l.dealValue, 0);
    let res = `**${searchIndustry} Leads** — ${indLeads.length} found, **${fmt(totalValue)}** total pipeline\n\n---\n\n`;
    top.forEach((l) => {
      res += `[LEAD_CARD:${l.id}]\n`;
      res += `   Score: **${l.score}**/100 | ${l.location} | **${fmt(l.dealValue)}** | ${l.status}\n\n`;
    });
    if (indLeads.length > 5) res += `...and **${indLeads.length - 5} more** ${searchIndustry} leads.\n\n`;
    res += `---\n\nGo to **Leads** to see all. Want outreach for any of these?\n\n[NAVIGATE:leads]`;
    return res;
  }

  // ── WALK ME THROUGH LEADS — structured walkthrough sorted by close probability ──
  if (lower.includes('walk me through') || lower.includes('walkthrough') || (lower.includes('walk') && lower.includes('lead'))) {
    const under20k = leads.filter(l => l.dealValue < 20000).sort((a, b) => b.conversionProbability - a.conversionProbability);
    const topWalkthrough = (under20k.length > 0 ? under20k : leads.sort((a, b) => b.conversionProbability - a.conversionProbability)).slice(0, 5);
    const totalValue = topWalkthrough.reduce((s, l) => s + l.dealValue, 0);
    const nextActions = {
      'new': 'Send initial outreach via best channel today',
      'contacted': 'Schedule a discovery call this week',
      'qualified': 'Prepare and send a tailored proposal',
      'negotiation': 'Call now — push for verbal commitment today',
      'proposal': 'Follow up on proposal and handle objections',
      'won': 'Upsell or request referral',
      'lost': 'Re-engage in 30 days with new angle',
    };
    let res = `**Lead Walkthrough — Top 5 Highest-Probability Leads${under20k.length > 0 ? ' Under $20K' : ''}**\n\nHere are your top 5 highest-probability leads${under20k.length > 0 ? ' under $20K' : ''} — sorted by close probability for speed-to-close:\n\n---\n\n`;
    topWalkthrough.forEach((l, i) => {
      const commission = Math.round(l.dealValue * 0.12);
      const whyCloseable = l.conversionProbability >= 70 ? 'High engagement + strong buying signals' :
        l.conversionProbability >= 50 ? 'Active interest + pain point alignment' :
        l.momentum === 'rising' ? 'Rising momentum indicates growing urgency' :
        'Recent activity shows continued evaluation';
      res += `[LEAD_CARD:${l.id}]\n`;
      res += `**${i + 1}. ${l.name}** at ${l.company}\n`;
      res += `   Deal: **${fmt(l.dealValue)}** | Close Prob: **${l.conversionProbability}%** | Commission: **$${commission.toLocaleString()}**\n`;
      res += `   Next Action: ${nextActions[l.status] || 'Follow up immediately'}\n`;
      res += `   Why closeable: ${whyCloseable}\n\n`;
    });
    res += `---\n\n**Total pipeline shown:** ${fmt(totalValue)} | **Combined commission:** $${Math.round(totalValue * 0.12).toLocaleString()}\n\n`;
    res += `**Speed-to-close tactics for sub-$20K deals:**\n- Same-day follow-up on every interaction\n- Simplified one-page proposals (no committee needed)\n- Create urgency: limited-time pricing or pilot window\n- Go direct to decision maker — skip gatekeepers\n\nWant outreach scripts for any of these? Or go to **Leads** for full pipeline.`;
    return res;
  }

  // ── CLOSABILITY SCORE BREAKDOWN ──
  if (lower.includes('closability') || lower.includes('closability score') || lower.includes('score breakdown') || (lower.includes('score') && lower.includes('break'))) {
    const target = selectedLead || leads[0];
    if (target) {
      const budgetFit = Math.min(100, Math.round(50 + (target.score || 50) * 0.4 + (target.dealValue < 20000 ? 15 : target.dealValue < 50000 ? 5 : -5)));
      const timing = target.momentum === 'rising' ? 85 : target.momentum === 'declining' ? 35 : 60;
      const decisionMaker = target.conversionProbability >= 70 ? 90 : target.conversionProbability >= 50 ? 65 : 40;
      const painUrgency = (target.painPoints || []).length >= 3 ? 85 : (target.painPoints || []).length >= 2 ? 65 : 45;
      const competition = target.competitorUsing ? 50 : 75;
      const overall = Math.round((budgetFit + timing + decisionMaker + painUrgency + competition) / 5);
      return `**Closability Score Breakdown — ${target.name}**\n\n---\n\n**Overall Closability: ${overall}/100**\n\n| Factor | Score | Assessment |\n|--------|-------|------------|\n| Budget Fit | **${budgetFit}**/100 | ${budgetFit >= 70 ? 'Deal size matches typical spend' : 'May need budget adjustment'} |\n| Timing | **${timing}**/100 | ${timing >= 70 ? 'High engagement, strike now' : timing >= 50 ? 'Moderate — needs nurturing' : 'Low urgency — long cycle'} |\n| Decision Maker Access | **${decisionMaker}**/100 | ${decisionMaker >= 70 ? 'Direct access confirmed' : 'May need to reach higher'} |\n| Pain Urgency | **${painUrgency}**/100 | ${painUrgency >= 70 ? 'Critical pain — they need a solution' : 'Pain exists but not urgent'} |\n| Competition | **${competition}**/100 | ${target.competitorUsing ? `Using ${target.competitorUsing} — displacement needed` : 'No incumbent — greenfield opportunity'} |\n\n---\n\n**Recommendation:** ${overall >= 70 ? 'This lead is highly closeable. Prioritize immediate contact.' : overall >= 50 ? 'Solid opportunity. Focus on building urgency and demonstrating ROI.' : 'Needs more nurturing. Build relationship before pushing for close.'}\n\nWant me to draft outreach for ${target.name}? Or go to **Leads** for more analysis.`;
    }
  }

  if (lower.includes('lead') || lower.includes('find') || lower.includes('top') || lower.includes('pipeline') || lower.includes('hottest')) {
    const top = leads.slice(0, 5);
    const critical = leads.filter(l => l.priority === 'critical');
    const rising = leads.filter(l => l.momentum === 'rising');
    const totalValue = leads.reduce((s, l) => s + l.dealValue, 0);
    let res = `**Pipeline Intelligence Report**\n\n`;
    res += `Your pipeline: **${leads.length.toLocaleString()} leads** worth **${fmt(totalValue)}**\n`;
    res += `Critical: **${critical.length}** | Rising momentum: **${rising.length}**\n\n`;
    res += `---\n\n`;
    res += `**Top 5 Leads by Score:**\n\n`;
    top.forEach((l) => {
      res += `[LEAD_CARD:${l.id}]\n`;
      res += `   Score: **${l.score}**/100 | Value: **${fmt(l.dealValue)}** | ${l.priority.toUpperCase()}\n`;
      res += `   Method: ${l.bestMethod} | Timeline: ${l.decisionTimeline} | Conv: ${l.conversionProbability}%\n\n`;
    });
    res += `---\n\n`;
    res += `Go to **Leads** to see all leads, or go to **Dashboard** for full pipeline metrics.\n\n`;
    res += `Want me to search leads by city or industry?`;
    return res;
  }

  if (lower.includes('business') || lower.includes('idea') || lower.includes('start')) {
    return `**Business Idea Generator**\n\nBased on current market trends and your pipeline data:\n\n---\n\n**1. AI Sales Automation SaaS**\nMarket Size: **$12B by 2028** | Growth: +42% YoY\nEntry: Build on GOATED's lead scoring engine\nMonetize: $99-499/mo SaaS + per-transaction fees\nCompetitive edge: Real-time lead intelligence + auto-outreach\n\n**2. Creator Deal Marketplace**\nMarket Size: **$104B** creator economy\nEntry: Launch marketplace on GOATED platform\nMonetize: 15% commission on closed deals\nCompetitive edge: AI-powered deal matching\n\n**3. Prediction Market Platform**\nMarket Size: **$50B+** and growing\nEntry: Extend GOATED **Markets** module\nMonetize: Platform fees + premium analytics subscriptions\nCompetitive edge: AI-driven probability models\n\n**4. Revenue Intelligence API**\nMarket Size: **$8B by 2027**\nEntry: Productize GOATED's analytics as an API\nMonetize: Usage-based pricing, $0.01 per enrichment\nCompetitive edge: 2,500+ lead dataset for training\n\n---\n\nCheck out **Trends** for real-time market data, or go to **Market** for competitive landscape.\n\nWhich idea should we deep-dive on? I can build a full business plan.`;
  }

  if (lower.includes('trend') || lower.includes('market') || lower.includes('pulse') || lower.includes('sector')) {
    return `**Market Pulse Update**\n\n---\n\n**Surging Sectors:**\n- **AI Sales Automation** — +42% this month [BLAZING]\n- **Revenue Intelligence** — +38% [HOT]\n- **Creator Economy B2B** — +35% [HOT]\n- **Prediction Markets** — +28% [RISING]\n\n**Declining Sectors:**\n- **Traditional Cold Outreach** — -8% [DECLINING]\n- **Manual CRM Tools** — -12% [COOLING]\n\n---\n\n**Key Insights:**\n1. AI-powered outreach is replacing traditional cold email. Companies using AI SDR tools see **3x higher reply rates**.\n2. Revenue intelligence platforms are consolidating - expect M&A activity.\n3. Creator economy B2B tools are the fastest-growing niche.\n\n**Your Pipeline Impact:**\n- ${leads.filter(l => l.industry === 'AI/ML').length} leads in AI/ML sector (hottest)\n- ${leads.filter(l => l.industry === 'SaaS').length} leads in SaaS (steady growth)\n- ${leads.filter(l => l.industry === 'Fintech').length} leads in Fintech (watch for regulation)\n\n---\n\nGo to **Trends** for live charts, or check **Market** for full global pulse.\n\nWant me to analyze how these trends impact your specific pipeline?`;
  }

  if (lower.includes('outreach') || lower.includes('call') || lower.includes('draft') || lower.includes('message') || lower.includes('sms') || lower.includes('voip') || lower.includes('script')) {
    const lead = leads[0];
    return `**Direct Outreach Suite for ${lead.name}**\n\n**Lead Intel:**\n- Company: ${lead.company} (${lead.industry})\n- Score: ${lead.score}/100 | Value: ${fmt(lead.dealValue)}\n- Pain Points: ${lead.painPoints.join(', ')}\n- Buying Signals: ${lead.buyingSignals.join(', ')}\n\n---\n\n**VoIP Call Script:**\n\nOpener: "Hi ${lead.name.split(' ')[0]}, this is your GOATED closer from GOATED Solutions. I noticed ${lead.company} is ${lead.buyingSignals[0]?.toLowerCase() || 'scaling fast'} — congrats on that."\n\nHook: "We've been helping ${lead.industry} companies solve ${lead.painPoints[0]?.toLowerCase() || 'pipeline challenges'}, and I think there's a quick win for you."\n\nAsk: "Do you have 2 minutes? I want to share something specific to ${lead.company}."\n\nValue: "We work with similar companies to accelerate their pipeline using AI-powered lead scoring and direct outreach."\n\nClose: "Can we do a quick 15-minute deep dive Thursday or Friday?"\n\n---\n\n**SMS Sequence (3-touch):**\n\n#1 (Day 0): "Hey ${lead.name.split(' ')[0]}, just left you a VM about ${lead.company}'s growth. Quick question about your ${lead.painPoints[0]?.toLowerCase() || 'outreach'} — mind if I share something?"\n\n#2 (Day 2): "${lead.name.split(' ')[0]}, we just helped a ${lead.industry} company close $${Math.round(lead.dealValue * 0.1 / 1000)}K in 30 days. Thought of ${lead.company}. Worth 5 min?"\n\n#3 (Day 5): "Last ping ${lead.name.split(' ')[0]}! If ${lead.painPoints[0]?.toLowerCase() || 'scaling'} is on your radar, I've got something you'll want to see. Link: goated.solutions/meet"\n\n---\n\n**Voicemail Drop:**\n\n"Hey ${lead.name.split(' ')[0]}, it's your closer from GOATED. Calling because I saw ${lead.company} is ${lead.buyingSignals[0]?.toLowerCase() || 'growing fast'}. We help ${lead.industry} teams solve ${lead.painPoints[0]?.toLowerCase() || 'pipeline issues'} fast. I'll shoot you a text with details. Talk soon."\n\n---\n\nConversion probability: **${lead.conversionProbability}%**\nRecommended channel: **${lead.bestMethod}**\n\nGo to **Leads** for full details, or check **Dashboard** for pipeline metrics.\n\nWant me to adjust the scripts or target a different lead?`;
  }

  if (lower.includes('forecast') || lower.includes('revenue') || lower.includes('project')) {
    const totalValue = leads.reduce((s, l) => s + l.dealValue, 0);
    const wonLeads = leads.filter(l => l.status === 'won');
    const wonValue = wonLeads.reduce((s, l) => s + l.dealValue, 0);
    const negotiating = leads.filter(l => l.status === 'negotiation');
    const negotiatingValue = negotiating.reduce((s, l) => s + l.dealValue, 0);
    return `**Revenue Forecast**\n\n---\n\n**Current Pipeline:**\n- Total Pipeline: **${fmt(totalValue)}** across ${leads.length.toLocaleString()} leads\n- Won Deals: **${fmt(wonValue)}** (${wonLeads.length} deals)\n- In Negotiation: **${fmt(negotiatingValue)}** (${negotiating.length} deals)\n\n**Projected Close (Next 30 Days):**\n- Conservative: **${fmt(negotiatingValue * 0.3)}** (30% of negotiating)\n- Realistic: **${fmt(negotiatingValue * 0.5)}** (50% of negotiating)\n- Optimistic: **${fmt(negotiatingValue * 0.75)}** (75% of negotiating)\n\n**Key Risks:**\n- ${leads.filter(l => l.momentum === 'declining' && l.status === 'negotiation').length} negotiating leads have declining momentum\n- ${leads.filter(l => l.decisionTimeline === '6 months').length} leads have 6-month timelines\n\n---\n\nGo to **Dashboard** for full revenue charts, or **Wallet** for financials.\n\nWant me to break this down by industry or priority level?`;
  }

  if (lower.includes('help') || lower.includes('command') || lower.includes('what can')) {
    return `**GOATED AI - Your Sales Copilot**\n\n---\n\nHere's everything I can do:\n\n**Lead Intelligence:**\n- "Find top leads" - Highest-scored leads\n- "Critical priority leads" - Urgent attention needed\n- "Rising momentum leads" - Hot opportunities\n\n**Outreach & Sales:**\n- "Draft outreach for [name]" - Auto-generate multi-channel messages\n- "Objection handling" - Scripts for common pushbacks\n- "Follow-up sequence" - Automated follow-up templates\n\n**Analytics & Trends:**\n- "Market trends" - Real-time market pulse\n- "Revenue forecast" - Pipeline projections\n- "Industry analysis" - Sector deep-dives\n\n**Strategy & Ideas:**\n- "Business idea" - AI business generator\n- "Competitive intel" - Competitor analysis\n- "Pipeline review" - Full health check\n\n---\n\nNavigate: **Dashboard** | **Leads** | **TrendPulse** | **Markets** | **Wallet** | **Admin**\n\nJust type naturally - I understand context from your current page.`;
  }

  if (lower.includes('competitor') || lower.includes('compet') || lower.includes('intel')) {
    const topCompanies = [...new Set(leads.map(l => l.competitorUsing).join(', ').split(', '))].slice(0, 8);
    return `**Competitive Intelligence Report**\n\n---\n\n**Top Competitor Mentions Across Your Pipeline:**\n${topCompanies.map((c, i) => `${i + 1}. **${c}** - mentioned by ${leads.filter(l => l.competitorUsing.includes(c)).length} leads`).join('\n')}\n\n**Key Observations:**\n- Most leads are evaluating **2-3 competitors** simultaneously\n- ${leads.filter(l => l.techStack.includes('Salesforce')).length} leads currently use Salesforce (prime displacement opportunity)\n- ${leads.filter(l => l.techStack === 'None - manual process').length} leads have no CRM (greenfield opportunity)\n\n**Displacement Strategy:**\n1. Target leads with manual processes first (lowest switching cost)\n2. Focus on Salesforce users experiencing pain points\n3. Offer migration packages for HubSpot users\n\n---\n\nGo to **Market** for full competitive landscape, or **Dashboard** for displacement scripts.\n\nWant me to build a specific battle card against any competitor?`;
  }

  // DEGEN mode catch-all
  if (degenMode) {
    const degenPrefixes = ['LFG.', 'WAGMI.', 'No cap.', 'Ape in.', 'Send it.'];
    const prefix = degenPrefixes[Math.floor(Math.random() * degenPrefixes.length)];
    return `**${prefix}** Ask me something specific:\n\n- "Find me whale leads to close"\n- "Best alpha play RIGHT NOW"\n- "Coach me on closing [lead name]"\n- "Show me $50K+ deals"\n- "Degen market scan"\n\nI'm your AI closing weapon. Use me. 🔥`;
  }

  // Default / catch-all response
  const totalValue = leads.reduce((s, l) => s + l.dealValue, 0);
  const critical = leads.filter(l => l.priority === 'critical');
  const rising = leads.filter(l => l.momentum === 'rising');
  const won = leads.filter(l => l.status === 'won');
  return `Got it. Let me pull some context for you.\n\n**Pipeline Snapshot:**\n- **${leads.length.toLocaleString()}** total leads worth **${fmt(totalValue)}**\n- **${critical.length}** critical priority leads need attention\n- **${rising.length}** leads with rising momentum\n- **${won.length}** deals closed won\n\n**Quick Intel:**\n- Top industry: **${leads.filter(l => l.industry === 'SaaS').length > leads.filter(l => l.industry === 'Fintech').length ? 'SaaS' : 'Fintech'}** (${Math.max(leads.filter(l => l.industry === 'SaaS').length, leads.filter(l => l.industry === 'Fintech').length)} leads)\n- Avg deal value: **${fmt(Math.round(totalValue / leads.length))}**\n- Avg conversion prob: **${Math.round(leads.reduce((s, l) => s + l.conversionProbability, 0) / leads.length)}%**\n\n---\n\nCheck **Dashboard** for full metrics, **Leads** for your pipeline, or **Trends** for market data.\n\nWhat would you like me to analyze deeper?`;
}

// ─── PARSE RESPONSE WITH FEATURE LINKS + LEAD LINKING ────────────────
function ParsedMessage({ content, onNavigate, onOpenLead, leads }) {
  // Split on bold markers, --- dividers, and lead card embeds
  const parts = content.split(/(\*\*[^*]+\*\*|---|\[LEAD_CARD:\d+\])/g);

  return (
    <span>
      {parts.map((part, i) => {
        // Horizontal divider
        if (part === '---') {
          return <span key={i} className="block border-t border-white/[0.03] my-2" />;
        }
        // Embedded lead card [LEAD_CARD:id]
        const leadCardMatch = part.match(/\[LEAD_CARD:(\d+)\]/);
        if (leadCardMatch && leads) {
          const lead = leads.find(l => l.id === parseInt(leadCardMatch[1]));
          if (lead) {
            return (
              <button key={i} onClick={() => onOpenLead(lead)}
                className="flex items-center gap-2 my-1.5 px-3 py-2 rounded-lg w-full text-left
                  bg-white/[0.03] hover:bg-brand/10 border border-white/[0.03] hover:border-brand/20 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center text-brand text-[10px] font-bold shrink-0">
                  {lead.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{lead.name}</div>
                  <div className="text-[10px] text-slate-500">{lead.company} · {lead.industry}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-brand">{lead.score}/100</div>
                  <div className="text-[10px] text-slate-500">{fmt(lead.dealValue)}</div>
                </div>
                <ArrowRight size={12} className="text-slate-600 group-hover:text-brand transition-colors shrink-0" />
              </button>
            );
          }
        }
        // Bold text with feature/lead linking
        if (part.startsWith('**') && part.endsWith('**')) {
          const inner = part.slice(2, -2);
          const lowerInner = inner.toLowerCase();
          // Check if this bold text matches a feature link
          const featureKey = Object.keys(FEATURE_LINKS).find(k => lowerInner === k || lowerInner === FEATURE_LINKS[k].label.toLowerCase());
          if (featureKey) {
            const fl = FEATURE_LINKS[featureKey];
            return (
              <button
                key={i}
                onClick={() => onNavigate(fl.page)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-brand font-bold
                  bg-brand/10 hover:bg-brand/20 border border-brand/20 hover:border-brand/40
                  transition-colors duration-200 cursor-pointer mx-0.5"
                style={{ textShadow: '0 0 10px rgba(16,185,129,0.3)' }}
              >
                <fl.icon size={11} />
                {inner}
                <ArrowRight size={9} className="opacity-60" />
              </button>
            );
          }
          // Check if bold text matches a lead name — make it clickable
          if (leads && onOpenLead) {
            const matchedLead = leads.find(l =>
              l.name.toLowerCase() === lowerInner ||
              l.company.toLowerCase() === lowerInner
            );
            if (matchedLead) {
              return (
                <button
                  key={i}
                  onClick={() => onOpenLead(matchedLead)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold
                    bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20
                    hover:border-purple-500/40 transition-colors duration-200 cursor-pointer mx-0.5"
                >
                  <Users size={10} />
                  {inner}
                  <ChevronRight size={9} className="opacity-60" />
                </button>
              );
            }
          }
          return <strong key={i} className="text-white font-semibold">{inner}</strong>;
        }
        // Plain text — detect URLs, phones, emails
        const urlRe = /(https?:\/\/[^\s<>]+)/g;
        const phoneRe = /(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
        const emailRe = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const combinedRe = /(https?:\/\/[^\s<>]+|\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const subParts = part.split(combinedRe);
        return (
          <span key={i}>
            {subParts.map((sp, j) => {
              if (urlRe.test(sp)) return <a key={j} href={sp} target="_blank" rel="noopener noreferrer" className="text-brand underline decoration-brand/30 hover:decoration-white/50 hover:text-white transition-colors inline-flex items-center gap-0.5">{sp.replace(/^https?:\/\//, '').slice(0, 40)}<ExternalLink size={9} className="inline opacity-60" /></a>;
              if (emailRe.test(sp)) return <a key={j} href={`mailto:${sp}`} className="text-brand underline decoration-brand/30 hover:text-white transition-colors">{sp}</a>;
              if (phoneRe.test(sp)) return <a key={j} href={`tel:${sp.replace(/[^+\d]/g, '')}`} className="text-brand underline decoration-brand/30 hover:text-white transition-colors">{sp}</a>;
              return <span key={j}>{sp}</span>;
            })}
          </span>
        );
      })}
    </span>
  );
}

// ─── STREAMING ASSISTANT MESSAGE ──────────────────────────────────────
function StreamingAssistantMessage({ content, isLatest, onNavigate, onOpenLead, leads }) {
  const { displayed, isStreaming } = useStreamingText(content, isLatest);
  return (
    <>
      <ParsedMessage content={displayed} onNavigate={onNavigate} onOpenLead={onOpenLead} leads={leads} />
      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 bg-brand/70 ml-0.5 animate-pulse rounded-sm" style={{ verticalAlign: 'text-bottom' }} />
      )}
    </>
  );
}

// ─── LOCATION-AWARE FOLLOW-UP SUGGESTIONS ───────────────────────────
const LOCATION_SUGGESTIONS = {
  'San Francisco': ['Austin', 'Seattle', 'LA'],
  'New York': ['Boston', 'Philadelphia', 'Charlotte'],
  'Austin': ['Dallas', 'Nashville', 'Denver'],
  'Seattle': ['Portland', 'San Francisco', 'Vancouver'],
  'Boston': ['New York', 'Raleigh', 'Philadelphia'],
  'Chicago': ['Minneapolis', 'Detroit', 'Columbus'],
  'Denver': ['Salt Lake City', 'Austin', 'Phoenix'],
  'Miami': ['Tampa', 'Orlando', 'Atlanta'],
  'Atlanta': ['Nashville', 'Charlotte', 'Raleigh'],
  'Dallas': ['Austin', 'Phoenix', 'Nashville'],
  'London': ['Dublin', 'Amsterdam', 'Paris'],
  'Toronto': ['Montreal', 'Vancouver', 'New York'],
};

function detectLocationInResponse(content) {
  const lower = content.toLowerCase();
  if (lower.includes('no leads found in')) {
    const match = content.match(/no leads found in (\w[\w\s]*)/i);
    if (match) return { notFound: match[1].trim() };
  }
  // Detect which location was searched
  for (const loc of Object.keys(LOCATION_SUGGESTIONS)) {
    if (lower.includes(loc.toLowerCase()) && (lower.includes('lead') || lower.includes('found') || lower.includes('pipeline'))) {
      return { found: loc };
    }
  }
  return null;
}

// ─── ACTION BUTTONS PARSED FROM RESPONSES ──────────────────────────────
function ResponseActions({ content, onNavigate, onQuickAction }) {
  const mentionedPages = [];
  const lowerContent = content.toLowerCase();
  Object.entries(FEATURE_LINKS).forEach(([key, val]) => {
    if (lowerContent.includes(key) && !mentionedPages.find(p => p.page === val.page)) {
      mentionedPages.push(val);
    }
  });

  // Detect location context for follow-up suggestions
  const locationCtx = detectLocationInResponse(content);
  let locationButtons = [];
  if (locationCtx) {
    if (locationCtx.found && LOCATION_SUGGESTIONS[locationCtx.found]) {
      locationButtons = LOCATION_SUGGESTIONS[locationCtx.found].map(city => ({
        label: `Leads in ${city}`,
        prompt: `Show me leads in ${city}`,
      }));
    } else if (locationCtx.notFound) {
      // Suggest nearby available cities
      const defaults = ['Austin', 'Miami', 'Atlanta', 'Dallas', 'Chicago'];
      locationButtons = defaults.slice(0, 3).map(city => ({
        label: `Try ${city}`,
        prompt: `Show me leads in ${city}`,
      }));
    }
  }

  // Also detect industry in response for follow-up
  const industryButtons = [];
  const industries = ['SaaS', 'Fintech', 'AI/ML', 'Healthcare', 'Cybersecurity'];
  if (lowerContent.includes('lead') && !lowerContent.includes('no leads found')) {
    for (const ind of industries) {
      if (lowerContent.includes(ind.toLowerCase())) {
        // Suggest other industries
        const others = industries.filter(i => i !== ind).slice(0, 2);
        others.forEach(other => {
          industryButtons.push({ label: `${other} leads`, prompt: `Find ${other} leads` });
        });
        break;
      }
    }
  }

  const hasNav = mentionedPages.length > 0;
  const hasFollowUp = locationButtons.length > 0 || industryButtons.length > 0;
  if (!hasNav && !hasFollowUp) return null;

  const unique = [...new Map(mentionedPages.map(p => [p.page, p])).values()].slice(0, 3);
  const allFollowUps = [...locationButtons, ...industryButtons].slice(0, 3);

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/[0.03]">
      {unique.map(p => (
        <button
          key={p.page}
          onClick={() => onNavigate(p.page)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium
            bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 hover:border-brand/40
            transition-all duration-200"
        >
          <p.icon size={11} />
          Go to {p.label}
          <ArrowRight size={9} />
        </button>
      ))}
      {allFollowUps.map(f => (
        <button
          key={f.label}
          onClick={() => onQuickAction && onQuickAction(f.prompt)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium
            bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/40
            transition-all duration-200"
        >
          <Globe size={11} />
          {f.label}
        </button>
      ))}
    </div>
  );
}

// ─── CONTEXTUAL ORB BADGES & PROACTIVE SUGGESTIONS ──────────────────────
const ORB_CONTEXT = {
  leads: { badge: 'hot leads', modeLabel: 'Lead Intel Mode', icon: Target },
  trends: { badge: 'new signals', modeLabel: 'Alpha Scanner', icon: TrendingUp },
  dashboard: { badge: null, modeLabel: 'Pipeline Overview', icon: BarChart3 },
  market: { badge: null, modeLabel: 'Market Analysis', icon: Globe },
  home: { badge: null, modeLabel: 'Revenue Agent', icon: Sparkles },
  audit: { badge: null, modeLabel: 'Revenue Auditor', icon: Award },
  wallet: { badge: null, modeLabel: 'Wallet Intel', icon: Wallet },
  admin: { badge: null, modeLabel: 'Admin Console', icon: Shield },
};

const PROACTIVE_SUGGESTIONS = {
  leads: [
    'I found 3 leads with 80%+ close probability',
    'Hot lead alert: 2 deals in negotiation need follow-up',
    'Your top lead score just jumped — check pipeline',
  ],
  trends: [
    'BTC breaking resistance — check alpha plays',
    'New sector surge detected: AI/ML up 42%',
    '2 prediction market edges found',
  ],
  dashboard: [
    'Pipeline health: 3 deals need attention today',
    'Revenue is trending up — keep the momentum',
    'Weekly target: 2 more closes to hit goal',
  ],
};

const DEGEN_PROACTIVE_SUGGESTIONS = {
  leads: [
    '3 leads about to close — $45K bag incoming. Don\'t fumble this. LFG',
    'Whale alert: 2 deals in negotiation are mooning. Ape in NOW',
    'Your top lead just went parabolic — send it before someone else does',
  ],
  trends: [
    'BTC breaking resistance — alpha play detected. Send it',
    'AI/ML sector pumping +42% — massive bag potential. WAGMI',
    '2 prediction market edges with fat risk-reward. NFA but ape-worthy',
  ],
  dashboard: [
    '3 deals need your attention — don\'t be paper hands on these bags',
    'Revenue pumping — keep the momentum, king. LFG',
    '2 more closes to hit weekly target — diamond hands mode activated',
  ],
};

// ─── CONTEXT SUMMARY CARD ─────────────────────────────────────────────
function ContextSummaryCard({ currentPage, leads, degenMode, onAction }) {
  const summaries = useMemo(() => {
    if (!leads || leads.length === 0) return null;
    const topCloseable = leads
      .filter(l => l.status !== 'won' && l.status !== 'lost')
      .sort((a, b) => b.conversionProbability - a.conversionProbability)
      .slice(0, 5);
    const negotiating = leads.filter(l => l.status === 'negotiation');
    const rising = leads.filter(l => l.momentum === 'rising');
    const totalPipeline = leads.reduce((s, l) => s + l.dealValue, 0);

    switch (currentPage) {
      case 'leads':
        return {
          title: 'Top 5 Closeable Leads',
          icon: Target,
          color: 'brand',
          items: topCloseable.map(l => `${l.name} (${l.conversionProbability}%) — ${fmt(l.dealValue)}`),
          action: { label: 'Get closing playbook', prompt: 'Build me a closing playbook for my top 5 closeable leads right now. Include specific scripts and commission impact.' },
        };
      case 'trends':
        return {
          title: 'Market Summary',
          icon: TrendingUp,
          color: 'cyan',
          items: [
            `${rising.length} leads with rising momentum`,
            `${leads.filter(l => l.industry === 'AI/ML').length} AI/ML leads (hottest sector)`,
            `${leads.filter(l => l.industry === 'SaaS').length} SaaS leads (steady growth)`,
            `Pipeline exposure: ${fmt(totalPipeline)}`,
          ],
          action: { label: 'Deep market research', prompt: 'Research current market conditions and how they impact my pipeline. Analyze sector momentum, macro trends, and give me actionable plays.' },
        };
      case 'dashboard':
        return {
          title: 'Pipeline Health',
          icon: BarChart3,
          color: 'purple',
          items: [
            `${negotiating.length} deals in negotiation`,
            `${topCloseable.filter(l => l.conversionProbability >= 70).length} high-probability closes`,
            `Total pipeline: ${fmt(totalPipeline)}`,
            `Commission potential: ${fmt(Math.round(totalPipeline * 0.12))}`,
          ],
          action: { label: 'Optimize pipeline', prompt: 'Analyze my pipeline health: bottlenecks, at-risk deals, and specific actions to improve conversion rate. Be specific with names.' },
        };
      default:
        return null;
    }
  }, [currentPage, leads]);

  if (!summaries) return null;

  const colorMap = {
    brand: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.15)', text: '#10b981' },
    cyan: { bg: 'rgba(6,182,212,0.06)', border: 'rgba(6,182,212,0.15)', text: '#06b6d4' },
    purple: { bg: 'rgba(168,85,247,0.06)', border: 'rgba(168,85,247,0.15)', text: '#a855f7' },
  };
  const colors = colorMap[summaries.color] || colorMap.brand;

  return (
    <div className="mx-2 mt-1 rounded-xl p-2.5"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <summaries.icon size={11} style={{ color: colors.text }} />
        <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: colors.text }}>
          {summaries.title}
        </span>
      </div>
      <div className="space-y-0.5">
        {summaries.items.map((item, i) => (
          <div key={i} className="text-[10px] text-slate-400 flex items-start gap-1.5">
            <span className="text-slate-600 mt-0.5">-</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
      {summaries.action && (
        <button
          onClick={() => onAction(summaries.action.prompt)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
          style={{ background: colors.border, color: colors.text }}
        >
          <Sparkles size={9} />
          {summaries.action.label}
          <ArrowRight size={9} />
        </button>
      )}
    </div>
  );
}

// ─── CONTEXT TIPS PER PAGE ──────────────────────────────────────────────
const CONTEXT_TIPS = {
  leads: "I found 3 high-probability leads ready to close",
  trends: "BTC sentiment shifted bullish \u2014 see alpha plays",
  dashboard: "Your pipeline is empty \u2014 let me find leads",
  audit: "Drop a URL and I'll find the leak",
  home: "Welcome. Degen mode is on \u2014 Shift+D to flip to Chill.",
};

// ─── CLOSE COACH STEPS ────────────────────────────────────────────────
const CLOSE_COACH_STEPS = [
  { label: 'Research', key: 'research' },
  { label: 'First Contact', key: 'contact' },
  { label: 'Discovery Call', key: 'discovery' },
  { label: 'Proposal Sent', key: 'proposal' },
  { label: 'Negotiation', key: 'negotiation' },
  { label: 'Close', key: 'close' },
];

function getCoachStepFromStatus(status) {
  const map = {
    'new': 0,
    'contacted': 1,
    'qualified': 2,
    'proposal': 3,
    'negotiation': 4,
    'won': 5,
    'lost': 0,
  };
  return map[status] ?? 0;
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────
export default function AIOverlay() {
  // ─── GRANULAR SELECTORS (avoid full-store subscription) ────────────
  // Subscribing via useStore() without a selector re-renders this component
  // on every store change, including 500K+ lead array refs. Use atomic
  // selectors so we only re-render when specific slices change.
  const aiOpen = useStore(s => s.aiOpen);
  const setAiOpen = useStore(s => s.setAiOpen);
  const rawLeads = useStore(s => s.leads);
  const getLeads = useStore(s => s.getLeads);
  const currentPage = useStore(s => s.page);
  const setPage = useStore(s => s.setPage);
  const selectedLead = useStore(s => s.selectedLead);
  const setSelectedLead = useStore(s => s.setSelectedLead);
  const setDetailOpen = useStore(s => s.setDetailOpen);
  const setPreviousPage = useStore(s => s.setPreviousPage);
  const degenMode = useStore(s => s.degenMode);
  const leads = rawLeads || [];

  useEffect(() => {
    if (!rawLeads) getLeads();
  }, [rawLeads, getLeads]);

  // One-shot notification permission prompt — 15s after mount, only if 'default'
  // and user is in Wolf mode (opted in by default anyway). Non-blocking.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const perm = getNotifPermission();
    if (perm !== 'default') return;
    const t = setTimeout(() => { requestNotifPermission(); }, 15000);
    return () => clearTimeout(t);
  }, []);

  // Initial messages based on mode
  const NORMAL_INTRO = "**GOATED AI** \u2014 revenue terminal.\n\n- Lead search: 250K+ pipeline, ranked\n- Close scripts: per-lead, revenue-loss-first\n- Market data: real-time sentiment + AI alpha\n- Audit: revenue-leak report for any public URL\n- Nav: type \"go to leads\" / \"open wallet\" / \"open audit\"\n\nAsk short, get short. Ask for a breakdown, get numbers.";

  const DEGEN_INTRO = "**DEGEN MODE** \u2014 let's print.\n\n- Sniping leads: show me hot deals in [city/industry]\n- Alpha calls: BUY/SELL/HOLD with entry/exit\n- Audit attack: rip a competitor's URL, expose their leak\n- Close now: give me the 3 closest deals + next action\n\nLFG. What's the play?";

  // Core state
  const [messages, setMessages] = useState([
    { role: 'assistant', content: degenMode ? DEGEN_INTRO : NORMAL_INTRO }
  ]);

  // Reset intro when degen mode toggles
  const prevDegenRef = useRef(degenMode);
  useEffect(() => {
    if (prevDegenRef.current !== degenMode) {
      prevDegenRef.current = degenMode;
      setMessages([{ role: 'assistant', content: degenMode ? DEGEN_INTRO : NORMAL_INTRO }]);
    }
  }, [degenMode]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState('Thinking...');
  const [aiFailCount, setAiFailCount] = useState(0);
  const useAI = aiFailCount < 3;
  const [coachMode, setCoachMode] = useState(false);

  // ─── Signal Engine + Notification hover state ─────────────────────
  const { signals, unreadCount: signalUnread, markAllRead, dismissSignal } = useSignalEngine(leads, currentPage);
  const [orbHovered, setOrbHovered] = useState(false);
  const orbHoverTimerRef = useRef(null);
  const feedRef = useRef(null);

  // Hover handlers with small delay to prevent flicker
  const handleOrbMouseEnter = useCallback(() => {
    clearTimeout(orbHoverTimerRef.current);
    setOrbHovered(true);
    markAllRead();
  }, [markAllRead]);

  const handleOrbMouseLeave = useCallback(() => {
    orbHoverTimerRef.current = setTimeout(() => setOrbHovered(false), 200);
  }, []);

  const handleFeedMouseEnter = useCallback(() => {
    clearTimeout(orbHoverTimerRef.current);
    setOrbHovered(true);
  }, []);

  const handleFeedMouseLeave = useCallback(() => {
    orbHoverTimerRef.current = setTimeout(() => setOrbHovered(false), 200);
  }, []);

  // Signal action handler
  const handleSignalAction = useCallback((signal) => {
    const action = signal.action;
    if (!action) return;
    switch (action.type) {
      case 'viewLead':
        if (action.lead) {
          setSelectedLead(action.lead);
          setDetailOpen(true);
          setPage('leads');
          setPreviousPage(currentPage);
        }
        break;
      case 'navigate':
        setPage(action.page);
        break;
      case 'copy':
        if (navigator.clipboard && action.text) {
          navigator.clipboard.writeText(action.text);
        }
        break;
      case 'openCoach':
        setCoachMode(true);
        setAiOpen(true);
        break;
      default:
        break;
    }
    setOrbHovered(false);
  }, [currentPage, setPage, setSelectedLead, setDetailOpen, setPreviousPage, setAiOpen]);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ─── CONTEXT TIP (auto-shows on page nav) ────────────────────────
  const [contextTip, setContextTip] = useState(null);
  const contextTipTimerRef = useRef(null);
  const contextTipHideRef = useRef(null);
  const prevPageRef = useRef(currentPage);

  useEffect(() => {
    clearTimeout(contextTipTimerRef.current);
    clearTimeout(contextTipHideRef.current);
    // Only show tip if page changed or on initial mount
    if (currentPage !== prevPageRef.current || !prevPageRef.current) {
      prevPageRef.current = currentPage;
      contextTipTimerRef.current = setTimeout(() => {
        if (!useStore.getState().aiOpen) {
          const tip = CONTEXT_TIPS[currentPage] || CONTEXT_TIPS.home;
          setContextTip(tip);
          contextTipHideRef.current = setTimeout(() => setContextTip(null), 8000);
        }
      }, 3000);
    }
    return () => {
      clearTimeout(contextTipTimerRef.current);
      clearTimeout(contextTipHideRef.current);
    };
  }, [currentPage]);

  // Proactive suggestion tooltip (existing — fires periodically when closed)
  const [proactiveTip, setProactiveTip] = useState(null);
  const proactiveTimerRef = useRef(null);
  const proactiveDismissRef = useRef(null);
  useEffect(() => {
    const schedule = () => {
      const delay = 30000; // Exactly 30 seconds between proactive tips
      proactiveTimerRef.current = setTimeout(() => {
        if (!useStore.getState().aiOpen) {
          const suggestionsSource = useStore.getState().degenMode ? DEGEN_PROACTIVE_SUGGESTIONS : PROACTIVE_SUGGESTIONS;
          const pageSuggestions = suggestionsSource[currentPage] || suggestionsSource.dashboard;
          const tip = pageSuggestions[Math.floor(Math.random() * pageSuggestions.length)];
          setProactiveTip(tip);
          proactiveDismissRef.current = setTimeout(() => setProactiveTip(null), 5000);
        }
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      clearTimeout(proactiveTimerRef.current);
      clearTimeout(proactiveDismissRef.current);
    };
  }, [currentPage]);

  // Orb badge context — uses cached stats to avoid 500K-lead filter passes
  const orbCtx = ORB_CONTEXT[currentPage] || ORB_CONTEXT.home;
  const orbBadgeText = useMemo(() => {
    // Scan a capped window (first 5000) instead of full 500K for O(1)-ish feel
    const cap = Math.min(leads.length, 5000);
    if (currentPage === 'leads') {
      let hot = 0;
      for (let i = 0; i < cap; i++) if (leads[i].conversionProbability >= 80) hot++;
      return hot > 0 ? `${hot} hot leads` : null;
    }
    if (currentPage === 'trends') {
      let rising = 0;
      for (let i = 0; i < cap; i++) if (leads[i].momentum === 'rising') rising++;
      return rising > 2 ? `${Math.min(rising, 9)} new signals` : null;
    }
    return null;
  }, [currentPage, leads]);

  // Lead mini-card data for orb overlay
  const leadMiniCard = useMemo(() => {
    if (currentPage !== 'leads' || !selectedLead) return null;
    const nextActions = {
      'new': 'Send cold email',
      'contacted': 'Schedule call',
      'qualified': 'Send proposal',
      'negotiation': 'Follow up',
      'proposal': 'Handle objections',
      'won': 'Request referral',
      'lost': 'Re-engage later',
    };
    return {
      name: selectedLead.name,
      company: selectedLead.company,
      probability: selectedLead.conversionProbability,
      nextAction: nextActions[selectedLead.status] || 'Follow up',
    };
  }, [currentPage, selectedLead]);

  // Close Coach checklist state
  const [leadViewStart, setLeadViewStart] = useState(null);
  const [researchChecked, setResearchChecked] = useState(false);
  useEffect(() => {
    if (selectedLead) {
      setLeadViewStart(Date.now());
      setResearchChecked(false);
    }
  }, [selectedLead?.id]);
  useEffect(() => {
    if (!selectedLead || !leadViewStart) return;
    const timer = setTimeout(() => setResearchChecked(true), 5000);
    return () => clearTimeout(timer);
  }, [selectedLead?.id, leadViewStart]);

  const closeCoachStep = useMemo(() => {
    if (!selectedLead) return 0;
    return getCoachStepFromStatus(selectedLead.status);
  }, [selectedLead]);

  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Revenue tracking stats — computed lazily to avoid filtering 500K leads
  // on every render. Only materializes when the AI panel is open OR when
  // needed for a send() call. Cached by leads reference.
  const revenueStatsCacheRef = useRef({ leads: null, value: null });
  const computeRevenueStats = useCallback(() => {
    if (revenueStatsCacheRef.current.leads === leads && revenueStatsCacheRef.current.value) {
      return revenueStatsCacheRef.current.value;
    }
    const commissionRate = 0.12;
    // Single pass instead of 4 separate filter iterations over 500K items
    let wonCount = 0, wonValue = 0, negCount = 0, negValue = 0, risingCount = 0, totalPipeline = 0;
    for (let i = 0; i < leads.length; i++) {
      const l = leads[i];
      totalPipeline += l.dealValue;
      if (l.status === 'won') { wonCount++; wonValue += l.dealValue; }
      else if (l.status === 'negotiation') { negCount++; negValue += l.dealValue; }
      if (l.momentum === 'rising') risingCount++;
    }
    const currentMRR = Math.round((wonValue * commissionRate) / 12);
    const mrrGoal = 25000;
    const pendingCommission = Math.round(negValue * commissionRate);
    const value = {
      currentMRR,
      mrrGoal,
      distanceToGoal: Math.max(0, mrrGoal - currentMRR),
      wonDeals: wonCount,
      wonValue,
      negotiatingCount: negCount,
      pendingCommission,
      risingCount,
      totalPipeline,
      weekActivity: { calls: 8 + Math.floor(Math.random() * 15), outreach: 12 + Math.floor(Math.random() * 20) },
      streakDays: 2 + Math.floor(Math.random() * 5),
      pipelineHealth: risingCount > leads.length * 0.3 ? 'Strong' : risingCount > leads.length * 0.15 ? 'Good' : 'Needs Attention',
    };
    revenueStatsCacheRef.current = { leads, value };
    return value;
  }, [leads]);

  // Only compute stats when panel actually opens — not on every keystroke elsewhere
  const revenueStats = useMemo(() => {
    if (!aiOpen) return null;
    return computeRevenueStats();
  }, [aiOpen, computeRevenueStats]);

  // Determine contextual thinking label based on message content and page
  const getThinkingLabel = useCallback((msg) => {
    const lower = (msg || '').toLowerCase();
    if (/lead|pipeline|find|search|show me/.test(lower)) return 'Searching lead database...';
    if (/outreach|script|email|call|sms|draft/.test(lower)) return 'Crafting outreach scripts...';
    if (/clos|objection|negotiat|coach/.test(lower)) return 'Analyzing closing strategy...';
    if (/trend|market|sector|surge|pump/.test(lower)) return 'Scanning market signals...';
    if (/forecast|revenue|project/.test(lower)) return 'Running revenue forecast...';
    if (/competitor|compet|intel/.test(lower)) return 'Gathering competitive intel...';
    if (/idea|business|start/.test(lower)) return 'Generating business ideas...';
    if (/analyz|report|deep dive/.test(lower)) return 'Running deep analysis...';
    if (currentPage === 'leads') return 'Analyzing lead data...';
    if (currentPage === 'trends') return 'Scanning market signals...';
    if (currentPage === 'dashboard') return 'Optimizing pipeline...';
    if (currentPage === 'market') return 'Scanning market signals...';
    if (currentPage === 'wallet') return 'Crunching revenue numbers...';
    return 'Thinking...';
  }, [currentPage]);

  // Quick action buttons based on current page, coach mode, and selected lead
  const quickActions = useMemo(() => {
    const base = degenMode
      ? (DEGEN_QUICK_ACTIONS[currentPage] || DEGEN_QUICK_ACTIONS.leads || [])
      : (QUICK_ACTIONS[currentPage] || []);
    if (coachMode && currentPage === 'leads') {
      return [
        { label: 'Call Script', prompt: selectedLead ? `Write a word-for-word cold call script for ${selectedLead.name} at ${selectedLead.company}. Include opener, hook, value prop, and close.` : 'Write a cold call script for my top lead. Include opener, hook, value prop, and close.', icon: Phone },
        { label: 'Handle Objections', prompt: selectedLead ? `Give me objection handling scripts for ${selectedLead.name} at ${selectedLead.company} in ${selectedLead.industry}. Cover: price, timing, competitor, and "not interested" objections.` : 'Give me objection handling scripts for common B2B objections: price, timing, competitor, and "not interested".', icon: Shield },
        { label: 'Email Template', prompt: selectedLead ? `Write a follow-up email template for ${selectedLead.name} at ${selectedLead.company}. Pain points: ${(selectedLead.painPoints||[]).join(', ')}. Make it personal and compelling.` : 'Write a follow-up email template for a qualified lead that creates urgency and drives a meeting.', icon: Send },
        { label: 'Next Best Action', prompt: selectedLead ? `What is the single best action I should take RIGHT NOW to close ${selectedLead.name} at ${selectedLead.company}? They are in ${selectedLead.status} stage, score ${selectedLead.score}/100. Be specific.` : 'What is the single best action I should take right now to close more deals? Look at my pipeline and be specific.', icon: Target },
      ];
    }
    if (selectedLead && currentPage === 'leads') {
      const firstName = selectedLead.name.split(' ')[0];
      const outreachAction = {
        label: `Draft outreach for ${firstName}`,
        prompt: `Draft a multi-channel outreach sequence for ${selectedLead.name} at ${selectedLead.company}. Industry: ${selectedLead.industry}. Pain points: ${(selectedLead.painPoints||[]).join(', ')}. Include email, call script, and LinkedIn DM.`,
        icon: Send,
      };
      const filtered = base.filter(a => !a.label.includes('Draft outreach'));
      return [outreachAction, ...filtered].slice(0, 6);
    }
    return base;
  }, [currentPage, coachMode, degenMode, selectedLead]);

  // Suggested prompts based on current page, coach mode, degen mode, and selected lead
  const suggestedPrompts = useMemo(() => {
    if (coachMode) return COACH_PROMPTS[currentPage] || COACH_PROMPTS.home;
    const prompts = degenMode ? DEGEN_PROMPTS : PAGE_PROMPTS;
    let result = prompts[currentPage] || prompts.home;
    // Dynamically inject selected lead name into leads prompts
    if (currentPage === 'leads' && selectedLead && !degenMode) {
      result = result.map(p =>
        p.label === 'Close strategy for lead'
          ? { ...p, label: `Close strategy for ${selectedLead.name.split(' ')[0]}` }
          : p
      );
    }
    return result;
  }, [currentPage, degenMode, coachMode, selectedLead]);

  // Navigate to page helper
  const navigateTo = useCallback((pageId) => {
    setPage(pageId);
  }, [setPage]);

  // Open a specific lead's detail page
  const openLead = useCallback((lead) => {
    setPreviousPage(currentPage);
    setSelectedLead(lead);
    setDetailOpen(true);
  }, [currentPage, setPreviousPage, setSelectedLead, setDetailOpen]);

  // Send message
  const send = useCallback(async () => {
    if (!input.trim() || typing) return;
    const msg = input.trim();
    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInput('');
    setTyping(true);
    setThinkingLabel(getThinkingLabel(msg));

    // Auto-expand when sending
    if (!aiOpen) setAiOpen(true);

    const leadCtx = selectedLead ? `\n\nCurrently viewing lead: ${selectedLead.name} at ${selectedLead.company} (${selectedLead.industry}), Score: ${selectedLead.score}/100, Deal: $${(selectedLead.dealValue||0).toLocaleString()}, Status: ${selectedLead.status}, Priority: ${selectedLead.priority}, Phone: ${selectedLead.phone||'N/A'}, Email: ${selectedLead.email||'N/A'}, Website: ${selectedLead.website||'N/A'}, Location: ${selectedLead.location||'N/A'}, Pain Points: ${(selectedLead.painPoints||[]).join(', ')}, Buying Signals: ${(selectedLead.buyingSignals||[]).join(', ')}, Best Method: ${selectedLead.bestMethod||'email'}` : '';
    const stats = revenueStats || computeRevenueStats();
    const revenueCtx = `\n\nRevenue tracking: Current MRR: $${stats.currentMRR.toLocaleString()}, Goal: $${stats.mrrGoal.toLocaleString()}/mo, Distance to goal: $${stats.distanceToGoal.toLocaleString()}, Won deals: ${stats.wonDeals}, Pending commission: $${stats.pendingCommission.toLocaleString()}, Deals in negotiation: ${stats.negotiatingCount}, Pipeline health: ${stats.pipelineHealth}, This week: ${stats.weekActivity.calls} calls made, ${stats.weekActivity.outreach} outreach sent, Closing streak: ${stats.streakDays} days`;
    const coachCtx = coachMode ? '\n\nCOACH MODE IS ON: Act as a real-time closing coach. Be proactive, suggest next actions, celebrate wins, give specific dollar amounts for commission, create urgency based on decision timelines, and reference their pipeline goals.' : '';
    const pipelineContext = `Pipeline context: ${leads.length} leads, top 5: ${leads.slice(0, 5).map(l =>
      `${l.name} at ${l.company} (score: ${l.score}, value: ${fmt(l.dealValue)}, priority: ${l.priority}, status: ${l.status})`
    ).join('; ')}${leadCtx}${revenueCtx}${coachCtx}`;

    if (useAI) {
      try {
        const apiMessages = newMessages
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role,
            content: m.role === 'user' && m === newMessages[newMessages.length - 1]
              ? `${m.content}\n\n[${pipelineContext}]`
              : m.content
          }));
        const slimLeads = leads.slice(0, 200).map(l => ({
          id: l.id, name: l.name, company: l.company, industry: l.industry,
          location: l.location, score: l.score, dealValue: l.dealValue,
          status: l.status, priority: l.priority, conversionProbability: l.conversionProbability,
          bestMethod: l.bestMethod, email: l.email, phone: l.phone,
        }));
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, degenMode, leadData: slimLeads, currentPage }),
        });
        const data = await res.json();
        if (!data.fallback && data.content) {
          // Auto-navigate if response contains [NAVIGATE:page]
          const navMatch = data.content.match(/\[NAVIGATE:(\w+)\]/);
          if (navMatch) {
            const navPage = navMatch[1];
            if (['leads', 'trends', 'dashboard', 'wallet', 'admin', 'audit'].includes(navPage)) {
              setPage(navPage);
              window.scrollTo(0, 0);
            }
          }
          const cleanContent = data.content.replace(/\[NAVIGATE:\w+\]/g, '').trim();
          setMessages(p => [...p, { role: 'assistant', content: cleanContent }]);
          setAiFailCount(0);
          setTyping(false);
          return;
        }
        setAiFailCount(c => c + 1);
      } catch {
        setAiFailCount(c => c + 1);
      }
    }

    // Instant template response — no artificial delay
    const res = getTemplateResponse(msg, leads, { coachMode, selectedLead, revenueStats: stats, degenMode });

    // Smart auto-navigate based on user intent
    const lower = msg.toLowerCase();
    const PAGE_INTENTS = {
      leads: /\b(lead|prospect|pipeline|find.*(?:in|at|from)|show.*(?:lead|company|deal)|search.*(?:lead|company)|close|outreach)\b/,
      trends: /\b(trend|market|crypto|btc|eth|sol|sentiment|chart|price|trading|alpha)\b/,
      dashboard: /\b(dashboard|stats|analytics|kpi|overview|performance)\b/,
      wallet: /\b(wallet|balance|commission|earning|payment|payout|invoic)\b/,
    };
    for (const [page, regex] of Object.entries(PAGE_INTENTS)) {
      if (regex.test(lower) && currentPage !== page) {
        setPage(page);
        window.scrollTo(0, 0);
        break;
      }
    }

    setMessages(p => [...p, { role: 'assistant', content: res }]);
    setTyping(false);
  }, [input, typing, messages, leads, useAI, degenMode, coachMode, selectedLead, revenueStats, aiOpen]);

  // Coach Mode: proactive suggestions when viewing a lead
  const prevSelectedRef = useRef(selectedLead?.id);
  useEffect(() => {
    if (coachMode && selectedLead && selectedLead.id !== prevSelectedRef.current) {
      prevSelectedRef.current = selectedLead.id;
      const commission = Math.round(selectedLead.dealValue * 0.12);
      const daysInStage = 1 + Math.floor(Math.random() * 5);
      let proactiveMsg = '';
      if (selectedLead.status === 'negotiation') {
        proactiveMsg = `**Coach Alert:** You should call **${selectedLead.name}** now \u2014 they've been in Negotiation for ${daysInStage} days. This deal is worth **$${commission.toLocaleString()} in commission**. Decision timeline: ${selectedLead.decisionTimeline || '2 weeks'}. Don't let this one slip!`;
      } else if (selectedLead.status === 'qualified') {
        proactiveMsg = `**Coach Alert:** **${selectedLead.name}** is qualified and ready for a demo. Commission opportunity: **$${commission.toLocaleString()}**. Their pain points are ${(selectedLead.painPoints||[]).slice(0, 2).join(' and ')} \u2014 lead with those.`;
      } else if (selectedLead.status === 'won') {
        proactiveMsg = `**Great call!** That's **$${commission.toLocaleString()} in commission** from closing ${selectedLead.name}! Now ask for a referral to 10x this win.`;
      } else {
        proactiveMsg = `**Coach Alert:** Viewing **${selectedLead.name}** (${selectedLead.company}). Score: ${selectedLead.score}/100, worth **$${commission.toLocaleString()} in commission**. Best approach: **${selectedLead.bestMethod || 'Phone call'}**. Want me to coach you through the close?`;
      }
      setMessages(p => [...p, { role: 'assistant', content: proactiveMsg }]);
    }
  }, [coachMode, selectedLead]);

  // Quick action handler - sets input and sends
  const handleQuickAction = useCallback((label) => {
    // Auto-expand when using quick actions
    if (!aiOpen) setAiOpen(true);
    setInput(label);
    setTimeout(() => {
      const newMessages = [...messages, { role: 'user', content: label }];
      setMessages(newMessages);
      setTyping(true);

      if (useAI) {
        const leadCtx = selectedLead ? `\n\nCurrently viewing lead: ${selectedLead.name} at ${selectedLead.company} (${selectedLead.industry}), Score: ${selectedLead.score}/100, Deal: $${(selectedLead.dealValue||0).toLocaleString()}, Status: ${selectedLead.status}` : '';
        const stats = revenueStats || computeRevenueStats();
        const revenueCtx = `\n\nRevenue tracking: Current MRR: $${stats.currentMRR.toLocaleString()}, Goal: $${stats.mrrGoal.toLocaleString()}/mo, Distance to goal: $${stats.distanceToGoal.toLocaleString()}, Pending commission: $${stats.pendingCommission.toLocaleString()}, Pipeline health: ${stats.pipelineHealth}`;
        const coachCtx = coachMode ? '\n\nCOACH MODE IS ON: Act as a real-time closing coach.' : '';
        const pipelineContext = `Pipeline context: ${leads.length} leads, top 5: ${leads.slice(0, 5).map(l =>
          `${l.name} at ${l.company} (score: ${l.score}, value: ${fmt(l.dealValue)}, priority: ${l.priority}, status: ${l.status})`
        ).join('; ')}${leadCtx}${revenueCtx}${coachCtx}`;

        const slimLeadsQA = leads.slice(0, 200).map(l => ({
          id: l.id, name: l.name, company: l.company, industry: l.industry,
          location: l.location, score: l.score, dealValue: l.dealValue,
          status: l.status, priority: l.priority, conversionProbability: l.conversionProbability,
          bestMethod: l.bestMethod, email: l.email, phone: l.phone,
        }));

        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.filter(m => m.role !== 'system').map(m => ({
              role: m.role,
              content: m === newMessages[newMessages.length - 1]
                ? `${m.content}\n\n[${pipelineContext}]`
                : m.content
            })),
            degenMode,
            leadData: slimLeadsQA,
            currentPage,
          }),
        })
          .then(r => r.json())
          .then(data => {
            if (!data.fallback && data.content) {
              const navM = data.content.match(/\[NAVIGATE:(\w+)\]/);
              if (navM && ['leads','trends','dashboard','wallet','admin','audit'].includes(navM[1])) {
                setPage(navM[1]);
                window.scrollTo(0, 0);
              }
              const clean = data.content.replace(/\[NAVIGATE:\w+\]/g, '').trim();
              setMessages(p => [...p, { role: 'assistant', content: clean }]);
              setAiFailCount(0);
              setTyping(false);
              return;
            }
            setAiFailCount(c => c + 1);
            throw new Error('fallback');
          })
          .catch(() => {
            const fallbackStats = revenueStats || computeRevenueStats();
            const res = getTemplateResponse(label, leads, { coachMode, selectedLead, revenueStats: fallbackStats, degenMode });
            setMessages(p => [...p, { role: 'assistant', content: res }]);
            setTyping(false);
          });
      } else {
        const fallbackStats = revenueStats || computeRevenueStats();
        const res = getTemplateResponse(label, leads, { coachMode, selectedLead, revenueStats: fallbackStats, degenMode });
        setMessages(p => [...p, { role: 'assistant', content: res }]);
        setTyping(false);
      }
      setInput('');
    }, 10);
  }, [messages, leads, useAI, degenMode, coachMode, selectedLead, revenueStats, aiOpen]);

  // ─── DRAG STATE FOR CHAT BUBBLE ────────────────────────────────────
  const [dragPos, setDragPos] = useState(null); // { x, y } or null for default
  const dragRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, elX: 0, elY: 0 });

  const onDragStart = useCallback((e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const el = dragRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: rect.left,
      elY: rect.top,
    };
    const onMouseMove = (ev) => {
      const dx = ev.clientX - dragStartRef.current.mouseX;
      const dy = ev.clientY - dragStartRef.current.mouseY;
      const newX = dragStartRef.current.elX + dx;
      const newY = dragStartRef.current.elY + dy;
      // Clamp to viewport
      const maxX = window.innerWidth - 420;
      const maxY = window.innerHeight - 100;
      setDragPos({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  // Reset drag position when closing
  useEffect(() => {
    if (!aiOpen) setDragPos(null);
  }, [aiOpen]);

  // ─── UNREAD BADGE — count AI suggestions when chat is closed ─────
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenMsgCount = useRef(1); // starts at 1 (intro message)

  useEffect(() => {
    if (aiOpen) {
      // Mark all as read when chat opens
      lastSeenMsgCount.current = messages.length;
      setUnreadCount(0);
    } else {
      // Count new assistant messages since last open
      const newAssistantMsgs = messages.slice(lastSeenMsgCount.current).filter(m => m.role === 'assistant').length;
      if (newAssistantMsgs > 0) {
        setUnreadCount(c => c + newAssistantMsgs);
      }
    }
  }, [aiOpen, messages.length]);

  // ─── RENDER ──────────────────────────────────────────────────────────
  // The floating orb is ALWAYS visible. The expanded panel appears when aiOpen is true.
  const orbColor = degenMode ? 'orange' : 'green';

  return (
    <>
      {/* ── CSS for orb pulse + fire animation ─────────────────────── */}
      <style>{`
        @keyframes orbPulse {
          0%, 100% { box-shadow: 0 0 8px 2px ${degenMode ? 'rgba(249,115,22,0.3)' : 'rgba(16,185,129,0.3)'}, 0 0 20px 4px ${degenMode ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)'}; }
          50% { box-shadow: 0 0 16px 6px ${degenMode ? 'rgba(249,115,22,0.5)' : 'rgba(16,185,129,0.5)'}, 0 0 32px 8px ${degenMode ? 'rgba(249,115,22,0.15)' : 'rgba(16,185,129,0.15)'}; }
        }
        @keyframes fireFlicker {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.7; }
          25% { transform: scaleY(1.3) scaleX(0.8); opacity: 0.9; }
          50% { transform: scaleY(0.9) scaleX(1.1); opacity: 0.6; }
          75% { transform: scaleY(1.2) scaleX(0.9); opacity: 0.85; }
        }
        @keyframes fireGlow {
          0%, 100% { box-shadow: 0 0 12px 4px rgba(249,115,22,0.4), 0 0 24px 8px rgba(239,68,68,0.15), 0 -8px 16px rgba(249,115,22,0.3); }
          50% { box-shadow: 0 0 20px 8px rgba(249,115,22,0.6), 0 0 36px 12px rgba(239,68,68,0.2), 0 -12px 20px rgba(249,115,22,0.45); }
        }
        @keyframes tipSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tipSlideOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(8px); }
        }
        .ai-drag-handle {
          cursor: grab;
          user-select: none;
          -webkit-user-select: none;
        }
        .ai-drag-handle:active { cursor: grabbing; }
      `}</style>

      {/* ── FLOATING ORB (always visible) ────────────────────────────── */}
      <AnimatePresence>
        {!aiOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
          >
            {/* Context tip toast */}
            <AnimatePresence>
              {(contextTip || proactiveTip) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-[280px] px-3 py-2 rounded-xl text-[11px] font-medium text-slate-200 cursor-pointer"
                  style={{
                    background: 'rgba(3, 7, 15, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: `1px solid ${degenMode ? 'rgba(249,115,22,0.2)' : 'rgba(16,185,129,0.15)'}`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                  onClick={() => { setContextTip(null); setProactiveTip(null); setAiOpen(true); }}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} className={degenMode ? 'text-orange-400 shrink-0' : 'text-brand shrink-0'} />
                    <span>{contextTip || proactiveTip}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lead mini-card (when on leads page with a lead selected) */}
            <AnimatePresence>
              {leadMiniCard && !aiOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25 }}
                  className="w-[260px] px-3 py-2.5 rounded-xl cursor-pointer"
                  style={{
                    background: 'rgba(3, 7, 15, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                  onClick={() => setAiOpen(true)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[11px] font-semibold text-white truncate">{leadMiniCard.name}</div>
                    <span className="text-[10px] font-bold text-purple-400">{leadMiniCard.probability}%</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mb-1.5">{leadMiniCard.company}</div>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-brand">
                    <ArrowRight size={10} />
                    <span>Next: {leadMiniCard.nextAction}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Close Coach checklist (when lead is selected) */}
            <AnimatePresence>
              {selectedLead && currentPage === 'leads' && !aiOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25, delay: 0.1 }}
                  className="w-[220px] px-3 py-2.5 rounded-xl"
                  style={{
                    background: 'rgba(3, 7, 15, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(245,158,11,0.15)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Trophy size={10} className="text-amber-400" />
                    <span className="text-[9px] font-bold text-amber-400 tracking-wider uppercase">Close Coach</span>
                  </div>
                  <div className="space-y-1">
                    {CLOSE_COACH_STEPS.map((step, idx) => {
                      const isCompleted = idx === 0 ? researchChecked : idx <= closeCoachStep;
                      const isCurrent = idx === (closeCoachStep + (researchChecked ? 0 : 0));
                      return (
                        <div key={step.key} className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] shrink-0 ${
                            isCompleted ? 'bg-brand/20 text-brand' : 'bg-white/[0.03] text-slate-600'
                          }`}
                            style={isCompleted ? { border: '1px solid rgba(16,185,129,0.3)' } : { border: '1px solid rgba(255,255,255,0.05)' }}
                          >
                            {isCompleted && <Check size={8} />}
                          </div>
                          <span className={`text-[10px] ${isCompleted ? 'text-slate-300 line-through opacity-60' : 'text-slate-400'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Orb badge — dynamic: show signal unread count, chat unread, OR contextual badge */}
            {(unreadCount > 0 || signalUnread > 0 || orbBadgeText) && (
              <div className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white z-10"
                style={{
                  background: (unreadCount > 0 || signalUnread > 0)
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : (degenMode ? 'linear-gradient(135deg, #f97316, #ef4444)' : 'linear-gradient(135deg, #10b981, #06b6d4)'),
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  minWidth: (unreadCount > 0 || signalUnread > 0) ? '16px' : undefined,
                  textAlign: 'center',
                }}
              >
                {unreadCount > 0 ? unreadCount : signalUnread > 0 ? signalUnread : orbBadgeText}
              </div>
            )}

            {/* Notification Feed — appears on hover over orb */}
            <AnimatePresence>
              {orbHovered && !aiOpen && (
                <motion.div
                  ref={feedRef}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  onMouseEnter={handleFeedMouseEnter}
                  onMouseLeave={handleFeedMouseLeave}
                  className="w-[300px] max-h-[400px] rounded-2xl overflow-hidden"
                  style={{
                    background: 'rgba(3, 7, 15, 0.97)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${degenMode ? 'rgba(249,115,22,0.2)' : 'rgba(16,185,129,0.15)'}`,
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)',
                  }}
                >
                  {/* Feed Header */}
                  <div className="px-3 py-2.5 flex items-center justify-between"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-2">
                      <Bell size={12} className={degenMode ? 'text-orange-400' : 'text-brand'} />
                      <span className="text-[11px] font-bold text-slate-200">Signals</span>
                      {signalUnread > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold"
                          style={{
                            background: degenMode ? 'rgba(249,115,22,0.15)' : 'rgba(16,185,129,0.15)',
                            color: degenMode ? '#f97316' : '#10b981',
                          }}>
                          {signalUnread} new
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-600 uppercase tracking-wider font-medium">Live</span>
                  </div>

                  {/* Feed Content — scrollable */}
                  <div className="overflow-y-auto" style={{ maxHeight: '352px' }}>
                    <NotificationFeed
                      signals={signals}
                      onAction={handleSignalAction}
                      onDismiss={dismissSignal}
                      degenMode={degenMode}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* The orb button — with fire animation in DEGEN mode */}
            <button
              onClick={() => setAiOpen(true)}
              onMouseEnter={handleOrbMouseEnter}
              onMouseLeave={handleOrbMouseLeave}
              className="group w-12 h-12 rounded-full flex items-center justify-center relative transition-transform hover:scale-110 active:scale-95"
              style={{
                background: degenMode
                  ? 'linear-gradient(135deg, #f97316, #ef4444)'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                animation: degenMode ? 'fireGlow 2s ease-in-out infinite' : 'orbPulse 3s ease-in-out infinite',
              }}
              title="Open GOATED AI (G)"
            >
              {/* Fire particles for DEGEN mode */}
              {degenMode && (
                <>
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-4 rounded-full pointer-events-none"
                    style={{
                      background: 'linear-gradient(to top, #f97316, #ef4444, transparent)',
                      animation: 'fireFlicker 0.8s ease-in-out infinite',
                      filter: 'blur(2px)',
                    }}
                  />
                  <div className="absolute -top-1.5 left-[40%] w-2 h-3 rounded-full pointer-events-none"
                    style={{
                      background: 'linear-gradient(to top, #fbbf24, #f97316, transparent)',
                      animation: 'fireFlicker 0.6s ease-in-out infinite 0.15s',
                      filter: 'blur(1.5px)',
                    }}
                  />
                  <div className="absolute -top-1 left-[55%] w-1.5 h-2.5 rounded-full pointer-events-none"
                    style={{
                      background: 'linear-gradient(to top, #fcd34d, #fbbf24, transparent)',
                      animation: 'fireFlicker 0.7s ease-in-out infinite 0.3s',
                      filter: 'blur(1px)',
                    }}
                  />
                </>
              )}
              {degenMode ? <Flame size={22} className="text-white relative z-10" /> : <Sparkles size={22} className="text-white" />}
              <kbd className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-400 bg-black/80 border border-white/10 rounded px-1.5 py-0.5 leading-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">G</kbd>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EXPANDED CHAT PANEL ──────────────────────────────────────── */}
      <AnimatePresence>
        {aiOpen && (
          <>
            {/* Backdrop for mobile */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50"
                onClick={() => setAiOpen(false)}
              />
            )}

            <motion.div
              ref={dragRef}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={
                isMobile
                  ? 'fixed inset-2 z-50 flex flex-col rounded-2xl overflow-hidden'
                  : 'z-50 w-[420px] flex flex-col rounded-2xl overflow-hidden'
              }
              style={{
                ...(isMobile ? {} : dragPos
                  ? { position: 'fixed', left: dragPos.x, top: dragPos.y }
                  : { position: 'fixed', bottom: 24, right: 24 }
                ),
                maxHeight: isMobile ? undefined : 'min(85vh, 720px)',
                background: 'rgba(3, 7, 15, 0.97)',
                backdropFilter: 'blur(24px) saturate(1.6)',
                border: `1px solid ${degenMode ? 'rgba(249,115,22,0.15)' : 'rgba(16,185,129,0.12)'}`,
                boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02), 0 0 40px ${degenMode ? 'rgba(249,115,22,0.08)' : 'rgba(16,185,129,0.08)'}`,
              }}
            >
              {/* ── HEADER with drag handle ────────────────────────────── */}
              <div
                className="shrink-0 border-b border-white/[0.03]"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.03), rgba(6,182,212,0.01), transparent)',
                }}
              >
                {/* Drag handle bar */}
                {!isMobile && (
                  <div
                    className="ai-drag-handle flex items-center justify-center pt-2 pb-0"
                    onMouseDown={onDragStart}
                  >
                    <div className="w-8 h-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors" />
                  </div>
                )}
                <div className="p-3 pt-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: degenMode
                            ? 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(239,68,68,0.1))'
                            : 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))',
                          boxShadow: degenMode ? '0 0 20px rgba(249,115,22,0.1)' : '0 0 20px rgba(16,185,129,0.1)',
                        }}
                      >
                        <GoatIcon className={`w-4 h-4 ${degenMode ? 'text-orange-400' : 'text-brand'}`} />
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${degenMode ? 'bg-orange-400' : 'bg-brand'} border-2`}
                        style={{ borderColor: 'rgba(5,10,20,0.9)' }} />
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span className={degenMode ? 'text-orange-400 font-black' : 'text-brand font-black'}>GOATED AI</span>
                        {useAI && (
                          <span className="text-[8px] px-1 py-0.5 rounded-full font-semibold tracking-wider"
                            style={{
                              background: degenMode
                                ? 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(239,68,68,0.15))'
                                : 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.15))',
                              color: degenMode ? '#f97316' : '#10b981',
                              border: `1px solid ${degenMode ? 'rgba(249,115,22,0.2)' : 'rgba(16,185,129,0.2)'}`,
                            }}
                          >
                            LIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-500">Agent &middot; {currentPage}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCoachMode(!coachMode)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                        coachMode
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-white/[0.03] text-slate-500 border border-white/[0.05] hover:text-amber-400 hover:bg-amber-500/10'
                      }`}
                      title="Toggle Coach Mode"
                    >
                      <Trophy size={11} />
                      COACH
                    </button>
                    <button
                      onClick={() => setAiOpen(false)}
                      className="flex items-center gap-1 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all"
                      title="Minimize (G or Escape)"
                    >
                      <ChevronDown size={15} />
                      <kbd className="text-[8px] font-mono text-slate-600 bg-white/[0.04] border border-white/[0.06] rounded px-1 py-0.5 leading-none">Esc</kbd>
                    </button>
                  </div>
                </div>

                {/* Quick action chips */}
                <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {suggestedPrompts.map(a => (
                    <button
                      key={a.label}
                      onClick={() => handleQuickAction(a.label)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
                        whitespace-nowrap transition-all duration-200 shrink-0"
                      style={{
                        background: degenMode ? 'rgba(249,115,22,0.05)' : 'rgba(16,185,129,0.05)',
                        border: `1px solid ${degenMode ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)'}`,
                        color: '#94a3b8',
                      }}
                      onMouseEnter={e => {
                        e.target.style.background = degenMode ? 'rgba(249,115,22,0.12)' : 'rgba(16,185,129,0.12)';
                        e.target.style.borderColor = degenMode ? 'rgba(249,115,22,0.25)' : 'rgba(16,185,129,0.25)';
                        e.target.style.color = '#e2e8f0';
                      }}
                      onMouseLeave={e => {
                        e.target.style.background = degenMode ? 'rgba(249,115,22,0.05)' : 'rgba(16,185,129,0.05)';
                        e.target.style.borderColor = degenMode ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)';
                        e.target.style.color = '#94a3b8';
                      }}
                    >
                      <a.icon size={11} className={`${degenMode ? 'text-orange-400' : 'text-brand'} shrink-0`} />
                      {a.label}
                    </button>
                  ))}
                </div>
                </div>
              </div>

              {/* ── COACH MODE MINI DASHBOARD ──────────────────────────────── */}
              {coachMode && (
                <div className="mx-2 mt-1 p-2 rounded-xl border"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.05), rgba(245,158,11,0.02))',
                    borderColor: 'rgba(245,158,11,0.15)',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Trophy size={10} className="text-amber-400" />
                    <span className="text-[9px] font-bold text-amber-400 tracking-wider">COACH MODE</span>
                    <div className="flex-1" />
                    <span className="text-[9px] text-amber-400/60">{revenueStats.streakDays}-day streak</span>
                    <Flame size={10} className="text-amber-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="text-center p-1 rounded-lg bg-black/30">
                      <div className="text-[10px] font-bold text-white">${revenueStats.currentMRR >= 1000 ? `${(revenueStats.currentMRR / 1000).toFixed(1)}K` : revenueStats.currentMRR}</div>
                      <div className="text-[8px] text-slate-500">MRR</div>
                    </div>
                    <div className="text-center p-1 rounded-lg bg-black/30">
                      <div className="text-[10px] font-bold text-amber-400">{revenueStats.negotiatingCount}</div>
                      <div className="text-[8px] text-slate-500">In Progress</div>
                    </div>
                    <div className="text-center p-1 rounded-lg bg-black/30">
                      <div className="text-[10px] font-bold text-brand">${revenueStats.pendingCommission >= 1000 ? `${(revenueStats.pendingCommission / 1000).toFixed(0)}K` : revenueStats.pendingCommission}</div>
                      <div className="text-[8px] text-slate-500">Pending $</div>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-black/30 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (revenueStats.currentMRR / revenueStats.mrrGoal) * 100)}%`,
                        background: 'linear-gradient(90deg, #f59e0b, #10b981)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[8px] text-slate-500">${revenueStats.distanceToGoal >= 1000 ? `${(revenueStats.distanceToGoal / 1000).toFixed(1)}K` : revenueStats.distanceToGoal} to goal</span>
                    <span className="text-[8px] text-slate-500">${revenueStats.mrrGoal >= 1000 ? `${(revenueStats.mrrGoal / 1000).toFixed(0)}K` : revenueStats.mrrGoal} MRR</span>
                  </div>
                </div>
              )}

              {/* ── CONTEXT SUMMARY CARD ──────────────────────────────────── */}
              {messages.length <= 1 && !coachMode && (
                <ContextSummaryCard
                  currentPage={currentPage}
                  leads={leads}
                  degenMode={degenMode}
                  onAction={handleQuickAction}
                />
              )}

              {/* ── QUICK INSIGHT BUTTONS ───────────────────────────────────── */}
              {messages.length <= 1 && (
                <div className="mx-2 mt-1">
                  <div className="flex items-center gap-1.5 mb-1 px-0.5">
                    <Brain size={9} className={degenMode ? 'text-orange-400' : 'text-brand'} />
                    <span className={`text-[9px] font-bold tracking-wider uppercase ${degenMode ? 'text-orange-400' : 'text-slate-500'}`}>
                      {degenMode ? 'Alpha Intel' : 'Quick Insights'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {(degenMode ? DEGEN_INSIGHTS : QUICK_INSIGHTS).map(qi => (
                      <button
                        key={qi.label}
                        onClick={() => handleQuickAction(qi.prompt)}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all text-left"
                        style={{
                          background: degenMode ? 'rgba(249,115,22,0.06)' : 'rgba(16,185,129,0.04)',
                          border: degenMode ? '1px solid rgba(249,115,22,0.12)' : '1px solid rgba(16,185,129,0.08)',
                          color: '#94a3b8',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = degenMode ? 'rgba(249,115,22,0.15)' : 'rgba(16,185,129,0.12)';
                          e.currentTarget.style.borderColor = degenMode ? 'rgba(249,115,22,0.3)' : 'rgba(16,185,129,0.25)';
                          e.currentTarget.style.color = degenMode ? '#f97316' : '#10b981';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = degenMode ? 'rgba(249,115,22,0.06)' : 'rgba(16,185,129,0.04)';
                          e.currentTarget.style.borderColor = degenMode ? 'rgba(249,115,22,0.12)' : 'rgba(16,185,129,0.08)';
                          e.currentTarget.style.color = '#94a3b8';
                        }}
                      >
                        <qi.icon size={10} className={`shrink-0 ${degenMode ? 'text-orange-500' : 'text-brand'}`} />
                        {qi.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── LEAD CONTEXT BANNER ────────────────────────────────────── */}
              {selectedLead && (
                <div className="mx-2 mt-1 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-[9px] font-bold">
                        {selectedLead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{selectedLead.name}</div>
                        <div className="text-[10px] text-slate-400">{selectedLead.company} &middot; {selectedLead.industry}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-purple-400">{selectedLead.score}/100</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: 'Get Lead Brief', action: `Give me a comprehensive lead brief for ${selectedLead.name} at ${selectedLead.company}. Include: background summary, industry (${selectedLead.industry}), company size, deal value ($${(selectedLead.dealValue||0).toLocaleString()}), pain points (${(selectedLead.painPoints||[]).join(', ')}), buying signals (${(selectedLead.buyingSignals||[]).join(', ')}), competitive landscape (using ${selectedLead.competitorUsing || 'unknown'}), decision timeline (${selectedLead.decisionTimeline || 'unknown'}), closability score breakdown (budget fit, timing, decision maker access, pain urgency, competition), and recommended strategy.` },
                      { label: 'Analyze Lead', action: `Analyze ${selectedLead.name} at ${selectedLead.company} \u2014 give me a full intelligence report with close probability, best approach, and revenue opportunity` },
                      { label: `Draft Outreach for ${selectedLead.name.split(' ')[0]}`, action: `Draft a full multi-channel outreach sequence for ${selectedLead.name} at ${selectedLead.company}. Industry: ${selectedLead.industry}, pain points: ${(selectedLead.painPoints||[]).join(', ')}, buying signals: ${(selectedLead.buyingSignals||[]).join(', ')}. Include personalized email, cold call script, and LinkedIn DM.` },
                      { label: 'Coach Me', action: `Coach me on closing ${selectedLead.name} at ${selectedLead.company}. Status: ${selectedLead.status}, Score: ${selectedLead.score}/100, Deal: $${(selectedLead.dealValue||0).toLocaleString()}. What should I do RIGHT NOW?` },
                      { label: 'Closability Score', action: `Show me the closability score breakdown for ${selectedLead.name} at ${selectedLead.company}. Break down: Budget Fit, Timing, Decision Maker Access, Pain Urgency, and Competition. Score: ${selectedLead.score}, Conversion: ${selectedLead.conversionProbability}%, Momentum: ${selectedLead.momentum}, Pain Points: ${(selectedLead.painPoints||[]).join(', ')}, Competitor: ${selectedLead.competitorUsing || 'None'}` },
                    ].map(qa => (
                      <button key={qa.label} onClick={() => { setInput(qa.action); }}
                        className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 transition-colors">
                        {qa.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── MESSAGES AREA ──────────────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-3 space-y-2.5">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      style={{ animation: `slideInUp 0.3s ease-out ${Math.min(i * 0.05, 0.3)}s both` }}>
                      <div className="flex gap-2 max-w-[88%]">
                        {m.role === 'assistant' && (
                          <div className="shrink-0 mt-1">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                              style={{
                                background: degenMode
                                  ? 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(239,68,68,0.1))'
                                  : 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))',
                              }}
                            >
                              <GoatIcon className={`w-3.5 h-3.5 ${degenMode ? 'text-orange-400' : 'text-brand'}`} />
                            </div>
                          </div>
                        )}

                        <div>
                          <div
                            className={`px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                              m.role === 'user'
                                ? 'rounded-2xl rounded-br-md'
                                : 'rounded-2xl rounded-bl-md'
                            }`}
                            style={
                              m.role === 'user'
                                ? {
                                    background: degenMode
                                      ? 'linear-gradient(135deg, #f97316, #ea580c)'
                                      : 'linear-gradient(135deg, #10b981, #059669)',
                                    color: '#000',
                                    fontWeight: 500,
                                  }
                                : {
                                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.6))',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    color: '#cbd5e1',
                                  }
                            }
                          >
                            {m.role === 'assistant' ? (
                              <StreamingAssistantMessage
                                content={m.content}
                                isLatest={i === messages.length - 1 || (i === messages.length - 2 && typing)}
                                onNavigate={navigateTo}
                                onOpenLead={openLead}
                                leads={leads}
                              />
                            ) : (
                              m.content
                            )}
                          </div>

                          {m.role === 'assistant' && (
                            <ResponseActions content={m.content} onNavigate={navigateTo} onQuickAction={handleQuickAction} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {typing && (
                    <div className="flex justify-start" style={{ animation: 'slideInUp 0.2s ease-out' }}>
                      <div className="flex gap-2">
                        <div className="shrink-0 mt-1">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                            style={{
                              background: degenMode
                                ? 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(239,68,68,0.1))'
                                : 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))',
                            }}
                          >
                            <GoatIcon className={`w-3.5 h-3.5 ${degenMode ? 'text-orange-400' : 'text-brand'}`} />
                          </div>
                        </div>
                        <div className="px-4 py-3 rounded-2xl rounded-bl-md"
                          style={{
                            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.6))',
                            border: '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {[0, 1, 2].map(idx => (
                                <div
                                  key={idx}
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{
                                    background: degenMode
                                      ? 'linear-gradient(135deg, #f97316, #ef4444)'
                                      : 'linear-gradient(135deg, #10b981, #06b6d4)',
                                    animation: `bounce 0.6s ${idx * 0.15}s infinite`,
                                  }}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-500 ml-1">{thinkingLabel}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={endRef} />
                </div>
              </div>

              {/* ── INPUT AREA ────────────────────────────────────────────── */}
              <div className="shrink-0 border-t border-white/[0.03] p-3"
                style={{ background: 'rgba(5, 10, 20, 0.5)' }}>

                {quickActions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {quickActions.map(qa => (
                      <button
                        key={qa.label}
                        onClick={() => setInput(qa.prompt)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium
                          transition-all duration-200 whitespace-nowrap"
                        style={{
                          background: degenMode ? 'rgba(249,115,22,0.06)' : 'rgba(16,185,129,0.06)',
                          border: `1px solid ${degenMode ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)'}`,
                          color: '#64748b',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = degenMode ? 'rgba(249,115,22,0.15)' : 'rgba(16,185,129,0.15)';
                          e.currentTarget.style.borderColor = degenMode ? 'rgba(249,115,22,0.3)' : 'rgba(16,185,129,0.3)';
                          e.currentTarget.style.color = degenMode ? '#f97316' : '#10b981';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = degenMode ? 'rgba(249,115,22,0.06)' : 'rgba(16,185,129,0.06)';
                          e.currentTarget.style.borderColor = degenMode ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)';
                          e.currentTarget.style.color = '#64748b';
                        }}
                      >
                        <qa.icon size={9} />
                        {qa.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                    placeholder={coachMode ? "Ask your closing coach..." : "Ask GOATED AI anything..."}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-all placeholder-slate-600"
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: coachMode ? '1px solid rgba(245,158,11,0.15)' : `1px solid ${degenMode ? 'rgba(249,115,22,0.08)' : 'rgba(16,185,129,0.08)'}`,
                      color: '#e2e8f0',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = coachMode ? 'rgba(245,158,11,0.35)' : (degenMode ? 'rgba(249,115,22,0.25)' : 'rgba(16,185,129,0.25)');
                      e.target.style.boxShadow = coachMode ? '0 0 0 3px rgba(245,158,11,0.05)' : (degenMode ? '0 0 0 3px rgba(249,115,22,0.05)' : '0 0 0 3px rgba(16,185,129,0.05)');
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = coachMode ? 'rgba(245,158,11,0.15)' : (degenMode ? 'rgba(249,115,22,0.08)' : 'rgba(16,185,129,0.08)');
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    onClick={send}
                    disabled={typing || !input.trim()}
                    className="px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-1.5
                      disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: input.trim() && !typing
                        ? (degenMode ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'linear-gradient(135deg, #10b981, #059669)')
                        : (degenMode ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)'),
                      color: input.trim() && !typing ? '#000' : (degenMode ? '#f97316' : '#10b981'),
                      boxShadow: input.trim() && !typing
                        ? (degenMode ? '0 0 20px rgba(249,115,22,0.2), 0 4px 12px rgba(0,0,0,0.3)' : '0 0 20px rgba(16,185,129,0.2), 0 4px 12px rgba(0,0,0,0.3)')
                        : 'none',
                    }}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
