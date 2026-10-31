import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Minimize2, Globe, Users, TrendingUp, Lightbulb, ChevronRight, ChevronDown, Check, BarChart3, Wallet, Zap, Target, ArrowRight, MessageSquare, Sparkles, LayoutDashboard, ExternalLink, Phone, UserSearch, Trophy, Flame, DollarSign, Clock, Activity, Shield, ClipboardList, FileText, Brain, Newspaper, BookOpen, Crosshair, Bell, Copy, Eye, AlertTriangle, Award, Voicemail, Search
} from 'lucide-react';
import { useStore, fmt, initialsOf, placeIdOf, formatPhone } from '../hooks/useStore';
import { GoatIcon } from './GoatLogo';
import { notify, requestNotifPermission, getNotifPermission } from '../utils/notifications';
import { isPageEnabled } from '../lib/config';

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
    if (!leads || leads.length === 0) return null;

    // Rebuilt on fields a local business record actually has.
    //
    // Every signal here used to key off conversionProbability, decisionTimeline
    // or a 12% commission — the first two are null on every live lead and the
    // third is money we do not pay. They surfaced as confident notifications:
    // "42% close prob", "2 weeks timeline", "your commission: $4,800".
    const candidates = [];

    const noSite = leads.filter(l => !l.website && !l.domain);
    if (noSite.length) {
      const lead = noSite[0];
      candidates.push({
        type: 'opportunity',
        title: `${lead.company} has no website`,
        description: `${lead.industry || 'Local business'}${lead.location ? ` in ${lead.location}` : ''} — the build and the phone cover sell together. $4,000 + $1,000/mo.`,
        action: { label: 'View Lead', type: 'viewLead', leadId: lead.id, lead },
      });
    }

    const openNow = leads.filter(l => l.openNow === true && l.phone);
    if (openNow.length >= 3) {
      candidates.push({
        type: 'timing',
        title: `${openNow.length} businesses open right now`,
        description: 'Published hours say they are trading and every one has a number. Best window you will get today.',
        action: { label: 'See the list', type: 'navigate', page: 'leads' },
      });
    }

    const strong = leads.filter(l => (l.score || 0) >= 85 && l.phone);
    if (strong.length) {
      const lead = strong[0];
      candidates.push({
        type: 'priority',
        title: `${lead.company} scores ${lead.score}/100`,
        description: `${lead.activity?.label || 'Worth a call'}${lead.reviewCount != null ? ` · ${lead.reviewCount} reviews` : ''}${lead.revenueFormatted ? ` · est. ${lead.revenueFormatted}` : ''}.`,
        action: { label: 'View Lead', type: 'viewLead', leadId: lead.id, lead },
      });
    }

    const thin = leads.filter(l => typeof l.reviewCount === 'number' && l.reviewCount > 0 && l.reviewCount < 25);
    if (thin.length >= 3) {
      candidates.push({
        type: 'opportunity',
        title: `${thin.length} businesses with thin reviews`,
        description: 'Under 25 reviews each. The review engine is an easy second sale once the receptionist is live.',
        action: { label: 'See the list', type: 'navigate', page: 'leads' },
      });
    }

    if (!candidates.length) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];

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
  // TrendPulse + Wallet entries removed — those pages are disabled, so linking
  // to them produced dead ends. See DISABLED_PAGES in lib/config.js.
  // v7.5 — markets/prediction/crypto/solana/casino keywords removed; B2B agency only
  audit:      { page: 'audit',     label: 'Audit',      icon: Award },
  leak:       { page: 'audit',     label: 'Audit',      icon: Award },
  dashboard:  { page: 'dashboard', label: 'Dashboard',  icon: BarChart3 },
  admin:      { page: 'admin',     label: 'Admin',      icon: LayoutDashboard },
};

// Snap modes removed — AI overlay is always right panel

// ─── CONTEXT-AWARE SUGGESTED PROMPTS ───────────────────────────────────
// Suggested prompts, per page. The old set asked for "$50K+ deals" and
// "$20K+ deals" against a book where every deposit is $2,000, and pointed at
// Trends and Market, which are disabled.
const PAGE_PROMPTS = {
  home: [
    { label: 'Find leads near me', icon: Globe },
    { label: 'What does GOATED sell?', icon: ClipboardList },
    { label: 'Businesses with no website', icon: Target },
    { label: 'Audit a website for me', icon: Sparkles },
  ],
  dashboard: [
    { label: 'Who should I call today?', icon: Users },
    { label: 'What do I quote them?', icon: DollarSign },
    { label: 'Handle a price objection', icon: Target },
    { label: 'Write me a voicemail', icon: ClipboardList },
  ],
  leads: [
    { label: 'Who should I call first?', icon: Users },
    { label: 'Close strategy for lead', icon: Target },
    { label: 'Businesses with no website', icon: Globe },
    { label: 'Cold call opener', icon: ClipboardList },
  ],
  audit: [
    { label: 'What do I sell them?', icon: DollarSign },
    { label: 'Turn this into an opener', icon: ClipboardList },
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

// The aggressive "Wolf of Wall Street" prompt set lived here — ape into,
// mooning, bag tracker, whale to close, 100x ideas. It was the set that
// rendered, so the suggestions under the chat were offering crypto plays to
// someone prospecting plumbers. Aliased to the real prompts rather than kept.

// ─── QUICK INSIGHT BUTTONS ─────────────────────────────────────────────
const QUICK_INSIGHTS = [
  { label: "Who to call now", prompt: 'Which businesses should I call in the next hour? Prioritise ones that are open right now, have a phone number, and have an obvious gap I can open on.', icon: Phone },
  { label: 'No-website leads', prompt: 'Find local service businesses near me with no website. Those are the ones I can sell a site build and the AI receptionist to together.', icon: Globe },
  { label: 'What do I say?', prompt: 'Give me a 15-second cold call opener for a local service business that is losing calls after hours. No fluff, no email.', icon: ClipboardList },
  { label: 'Handle the price push', prompt: 'A plumber just said "that is too expensive" to $2,000 setup plus $750 a month. Give me three ways to reframe it on the call.', icon: Crosshair },
];

// The DEGEN insight and quick-action sets lived here: "Best Alpha RN", "Who to
// Ape Into", "Whale Alert", "Send It Analysis", prediction-market spreads and
// Kalshi/Polymarket comparisons. They were still what rendered, because the
// DEGEN toggle was removed but the flag it read is pinned on — so the buttons
// under the chat were offering crypto plays to someone prospecting plumbers.

// ─── CONTEXTUAL QUICK ACTION BUTTONS (below chat input) ──────────────
const QUICK_ACTIONS = {
  leads: [
    { label: 'Who to call now', prompt: 'Which businesses should I call in the next hour? Open right now, reachable by phone, best score first.', icon: Phone },
    { label: 'No website', prompt: 'Find local service businesses near me with no website at all.', icon: Globe },
    { label: 'HVAC near me', prompt: 'Find HVAC contractors near me.', icon: Target },
    { label: 'Plumbers near me', prompt: 'Find plumbers near me.', icon: Target },
    { label: 'Coach me', prompt: 'Coach me on closing the lead I have open — what do I say first?', icon: Trophy },
  ],
  dashboard: [
    { label: 'Who to call now', prompt: 'Which businesses should I call in the next hour? Open right now and reachable by phone.', icon: Phone },
    { label: "What's the pitch?", prompt: 'What exactly am I selling and what does it cost? Give me the one-line version I can say on a call.', icon: ClipboardList },
    { label: 'Handle an objection', prompt: 'Give me three ways to handle "we already handle our own calls" on a cold call.', icon: Shield },
  ],
  audit: [
    { label: 'What do I sell them?', prompt: 'Based on a site audit, how do I turn the findings into a package I can quote on the phone?', icon: DollarSign },
    { label: 'Open the call', prompt: 'I just audited a prospect site. Give me a 15-second opener that references what I found.', icon: Phone },
  ],
  home: [
    { label: 'Find me leads', prompt: 'Find local service businesses near me worth calling today.', icon: Target },
    { label: "What's the pitch?", prompt: 'What exactly does GOATED sell and what does it cost?', icon: ClipboardList },
  ],
};

// ─── TEMPLATE FALLBACK RESPONSES ───────────────────────────────────────
function getTemplateResponse(msg, leads, { coachMode, selectedLead, degenMode } = {}) {
  const lower = msg.toLowerCase();
  // The commission/MRR/goal/streak block that used to sit here was dead — every
  // value fed only other values in the same block, all of them invented, and it
  // survived the earlier coach rewrite because nothing read it any more.

  // ── COACH MODE ────────────────────────────────────────────────────────────
  // Rewritten. The previous version quoted a commission we do not pay, a
  // conversionProbability that is null on every live lead, a decisionTimeline
  // field that does not exist, a "$25K MRR goal" nobody set, and a closing
  // streak generated with Math.random(). It congratulated the operator on
  // numbers that were invented at render time.
  if (coachMode && (lower.includes('coach') || lower.includes('close') || lower.includes('closing') || lower.includes('what should') || lower.includes('next step') || lower.includes('help me'))) {
    if (selectedLead) {
      const l = selectedLead;
      const noSite = !l.website && !l.domain;
      const quote = noSite ? '$4,000 deposit + $1,000/mo' : '$2,000 deposit + $750/mo';
      const gaps = [];
      if (noSite) gaps.push('no website at all');
      if (l.reviewCount === 0) gaps.push('no reviews');
      else if (typeof l.reviewCount === 'number' && l.reviewCount < 25) gaps.push(`only ${l.reviewCount} reviews`);
      if (!l.phone) gaps.push('no published number');

      return `**${l.company}** — ${l.industry}${l.location ? ` · ${l.location}` : ''}\n\n`
        + `Score **${l.score}/100**${l.activity?.label ? ` · ${l.activity.label}` : ''}`
        + `${l.revenueFormatted ? ` · est. ${l.revenueFormatted}` : ''}\n\n`
        + `**Open with:** ${gaps.length
            ? `they have ${gaps.join(' and ')}. Name it in the first sentence.`
            : `nothing is obviously broken, so open on the missed-call math — "what happens to a call that comes in while you are on a job?"`}\n\n`
        + `**Then diagnose, do not pitch.** One question: "What is a job like that worth to you?" `
        + `Once they say the number out loud the price argument is over.\n\n`
        + `**Quote on the call:** ${quote}. No proposal, no follow-up deck — they decide in one conversation.\n\n`
        + `${l.phone ? `**Dial:** ${formatPhone(l.phone)}` : '**No number published** — walk in, or message the Maps listing.'}`;
    }

    return `Open a lead and I will coach you through that specific call.\n\n`
      + `Or ask me directly — "what should I say on a cold call", "handle a price objection", `
      + `"write me a voicemail script".`;
  }


  // ── COACH MODE: Celebration after action ─────────────────────────

  // ── TRENDPULSE MONETIZATION HELPER ───────────────────────────────

  // Navigation intent detection — short-circuits LLM for "go to X" / "open X" commands
  // Exception: if the user is asking to SEARCH leads ("leads in austin", "show me $100k deals"),
  // fall through to the specialized lead search below.
  const isNavVerb = /(?:\bgo to\b|\bopen\b|\btake me to\b|\bswitch to\b|^show me\b|^show\b)/i.test(lower);
  const isLeadSearch = lower.includes('lead') && /(?: in | above | below | over | under | industry | score | \$)/i.test(lower);
  if (isNavVerb && !isLeadSearch) {
    const navMap = {
      // Only pages that are actually reachable. Keywords for TrendPulse,
      // Wallet and Admin are deliberately absent so the assistant never offers
      // a route a user can't take.
      'dashboard': 'dashboard', 'dash': 'dashboard',
      'lead': 'leads', 'pipeline': 'leads',
      'audit': 'audit', 'leak': 'audit', 'revenue audit': 'audit',
      'managed': 'leads', 'dfy': 'leads', 'done for you': 'leads', 'management': 'leads',
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
      res += `   Score: **${l.score}**/100${l.reviewCount != null ? ` | ${l.reviewCount} reviews` : ''}${l.website ? '' : ' | **no website**'}${l.phone ? ` | ${formatPhone(l.phone)}` : ''}\n\n`;
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

  // ── CLOSABILITY SCORE BREAKDOWN ──
  if (lower.includes('closability') || lower.includes('closability score') || lower.includes('score breakdown') || (lower.includes('score') && lower.includes('break'))) {
    const target = selectedLead || leads[0];
    if (target) {
      // The old breakdown scored Budget Fit, Timing, Decision Maker Access,
      // Pain Urgency and Competition off conversionProbability, momentum,
      // dealValue and competitorUsing. Every one of those is null or constant
      // on a Places record, so decisionMaker was always 40 and timing always
      // 60 — five confident-looking numbers that measured nothing.
      //
      // These are the signals the score is genuinely built from.
      const noSite = !target.website && !target.domain;
      const reviews = target.reviewCount;
      const rating = target.rating;
      const rows = [];

      rows.push(noSite
        ? '| No website | **+25** | Biggest lever we have — nowhere to send anyone, nothing to capture |'
        : '| Has a website | — | Already online, so lead with the phone instead of the build |');

      if (reviews === 0) rows.push('| No reviews | **+12** | Invisible in local ranking; review engine is an easy second sale |');
      else if (typeof reviews === 'number' && reviews < 25) rows.push(`| Only ${reviews} reviews | **+12** | Happy customers, nobody asking them to say so |`);
      else if (typeof reviews === 'number' && reviews > 800) rows.push(`| ${reviews.toLocaleString()} reviews | **−12** | Big enough to have an agency already — harder sale |`);
      else if (typeof reviews === 'number') rows.push(`| ${reviews} reviews${rating ? ` at ${rating}★` : ''} | **+10** | Established but still owner-run: the sweet spot |`);

      rows.push(target.phone
        ? `| ${formatPhone(target.phone)} | **+10** | Reachable today |`
        : '| No published number | — | Cannot dial them; walk in or message the listing |');

      const act = target.activity;
      if (act?.level === 'active') rows.push(`| ${act.label} | **+12** | ${act.why || 'Recent review activity'} |`);
      else if (act?.level === 'steady') rows.push(`| ${act.label} | **+5** | ${act.why || 'Trading, lower volume'} |`);
      else if (act?.level === 'slowing') rows.push(`| ${act.label} | **−10** | ${act.why || 'Verify they are still taking work'} |`);

      const quote = noSite ? '$4,000 deposit + $1,000/mo' : '$2,000 deposit + $750/mo';

      return `**${target.company || target.name} — why it scores ${target.score}/100**\n\n`
        + `| Signal | Weight | What it means |\n|---|---|---|\n${rows.join('\n')}\n\n`
        + `${target.revenueFormatted ? `Estimated revenue **${target.revenueFormatted}** — from review pace against a typical job value for the trade. Treat it as a range, not a figure.\n\n` : ''}`
        + `**Quote:** ${quote}\n\n`
        + `The score ranks how *closable* they are, not how successful. A business with gaps we can fix scores higher than a polished one.`;
    }
  }






  if (lower.includes('help') || lower.includes('command') || lower.includes('what can')) {
    return `**What I can do**\n\n`
      + `**Find businesses**\n`
      + `- "hvac in tampa" / "plumbers near me" / "roofers with no website"\n`
      + `- "who should I call first?"\n\n`
      + `**Know what to say**\n`
      + `- "what should I say on a cold call"\n`
      + `- "handle a price objection"\n`
      + `- "write me a voicemail script"\n\n`
      + `**Price it**\n`
      + `- "what does GOATED sell?" / "what do I quote a plumber with no site?"\n\n`
      + `**Audit a site**\n`
      + `- paste any address, for example "audit joesplumbing.com"\n\n`
      + `Pages: **Home** · **Audit** · **Leads** · **Dashboard**`;
  }

  if (lower.includes('competitor') || lower.includes('compet') || lower.includes('intel')) {
    const topCompanies = [...new Set(leads.map(l => l.competitorUsing).join(', ').split(', '))].slice(0, 8);
    return `**Competitive Intelligence Report**\n\n---\n\n**Top Competitor Mentions Across Your Pipeline:**\n${topCompanies.map((c, i) => `${i + 1}. **${c}** - mentioned by ${leads.filter(l => l.competitorUsing.includes(c)).length} leads`).join('\n')}\n\n**Key Observations:**\n- Most leads are evaluating **2-3 competitors** simultaneously\n- ${leads.filter(l => l.techStack.includes('Salesforce')).length} leads currently use Salesforce (prime displacement opportunity)\n- ${leads.filter(l => l.techStack === 'None - manual process').length} leads have no CRM (greenfield opportunity)\n\n**Displacement Strategy:**\n1. Target leads with manual processes first (lowest switching cost)\n2. Focus on Salesforce users experiencing pain points\n3. Offer migration packages for HubSpot users\n\n---\n\nGo to **Market** for full competitive landscape, or **Dashboard** for displacement scripts.\n\nWant me to build a specific battle card against any competitor?`;
  }

  // Catch-all when nothing else matched. The DEGEN variant that used to live
  // here opened with a random "LFG. / WAGMI. / Ape in." and suggested whale
  // leads and $50K+ deals — neither of which this product has.
  if (degenMode) {
    return `Ask me for a trade and a city and I will pull them live:\n\n- "plumbers in tampa"\n- "hvac near me"\n- "roofers with no website"\n- "what do I quote a plumber with no site?"\n- "handle a price objection"`;
  }

  // Default / catch-all response
  const totalValue = leads.reduce((s, l) => s + l.dealValue, 0);
  const critical = leads.filter(l => l.priority === 'critical');
  const rising = leads.filter(l => l.momentum === 'rising');
  const won = leads.filter(l => l.status === 'won');
  return `I can pull real businesses or tell you what to say.\n\n`
    + `**Find businesses** — "hvac in tampa", "plumbers near me", "roofers with no website", "who should I call first?"\n\n`
    + `**Know what to say** — "what should I say on a cold call", "handle a price objection", "write me a voicemail script"\n\n`
    + `**Price it** — "what does GOATED sell?"\n\n`
    + `**Audit a site** — paste any address, for example "audit joesplumbing.com"`;
}

// ─── PARSE RESPONSE WITH FEATURE LINKS + LEAD LINKING ────────────────
function ParsedMessage({ content, onNavigate, onOpenLead, onOpenPlace, onAudit, leads }) {
  // Split on bold markers, --- dividers, lead card embeds, and markdown links.
  // Links come last in the alternation but are matched first in the body below,
  // because a link label may itself contain bold markers.
  const parts = content.split(/(\[[^\]\n]+\]\((?:#\/[^)\s]+|https?:\/\/[^)\s]+)\)|\*\*[^*]+\*\*|---|\[LEAD_CARD:\d+\])/g);

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
                  {initialsOf(lead.company || lead.name)}
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
        // Markdown link. Three in-app destinations get intercepted so they open
        // inside the app instead of reloading it; anything else is a normal
        // outbound link.
        const link = part.match(/^\[([^\]\n]+)\]\(([^)\s]+)\)$/);
        if (link) {
          const [, label, href] = link;
          const leadHref = href.match(/^#\/lead\/([A-Za-z0-9_-]{10,})$/);
          if (leadHref && onOpenPlace) {
            return (
              <button key={i} onClick={() => onOpenPlace(leadHref[1])}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold
                  bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20
                  hover:border-purple-500/40 transition-colors duration-200 cursor-pointer mx-0.5">
                <Users size={10} />
                {label}
                <ChevronRight size={9} className="opacity-60" />
              </button>
            );
          }
          const auditHref = href.match(/^#\/audit\?u=(.+)$/);
          if (auditHref && onAudit) {
            return (
              <button key={i} onClick={() => onAudit(decodeURIComponent(auditHref[1]))}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold
                  bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20
                  hover:border-amber-500/40 transition-colors duration-200 cursor-pointer mx-0.5">
                <Search size={10} />
                {label}
              </button>
            );
          }
          const savedAudit = href.match(/^#\/a\/[a-z0-9]{6,32}$/i);
          if (savedAudit) {
            return (
              <a key={i} href={href}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold
                  bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20
                  transition-colors mx-0.5">
                <Search size={10} />
                {label}
              </a>
            );
          }
          return (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer"
              className="text-brand underline decoration-brand/30 hover:text-white transition-colors">
              {label}
            </a>
          );
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
function StreamingAssistantMessage({ content, isLatest, onNavigate, onOpenLead, onOpenPlace, onAudit, leads }) {
  const { displayed, isStreaming } = useStreamingText(content, isLatest);
  return (
    <>
      <ParsedMessage content={displayed} onNavigate={onNavigate} onOpenLead={onOpenLead} onOpenPlace={onOpenPlace} onAudit={onAudit} leads={leads} />
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

// Proactive tips, computed from what is actually on the page.
//
// These used to be fixed strings fired every thirty seconds as if they were
// findings: "I found 3 leads with 80%+ close probability", "Revenue is
// trending up", "BTC breaking resistance — check alpha plays". None of it was
// measured, and the degen variant claimed "$45K bag incoming" against a book
// where the deposit is $2,000. A tip that invents a number is worse than no
// tip, so anything we cannot count is simply not offered.
function buildProactiveTips(state, page) {
  const leads = state.liveLeads || [];
  const noSite = state.noWebsiteLeads || [];
  const tips = [];

  if (page === 'leads' || page === 'dashboard') {
    const openNow = leads.filter(l => l.openNow === true && l.phone).length;
    if (openNow >= 3) tips.push(`${openNow} businesses on your list are open right now and have a number`);

    if (noSite.length) {
      tips.push(`${noSite.length} ${noSite.length === 1 ? 'business has' : 'businesses have'} no website — that is the build plus the receptionist together`);
    }

    const strong = leads.filter(l => (l.score || 0) >= 85).length;
    if (strong >= 2) tips.push(`${strong} leads scoring 85+ — work those before the rest of the list`);

    const thin = leads.filter(l => typeof l.reviewCount === 'number' && l.reviewCount < 25).length;
    if (thin >= 3) tips.push(`${thin} businesses have fewer than 25 reviews — the review engine sells itself there`);
  }

  if (!tips.length) {
    // Nothing measured worth surfacing: prompt rather than assert.
    tips.push('Ask me for a trade and a city — "plumbers in tampa" — and I will pull them live');
  }
  return tips;
}


// ─── CONTEXT SUMMARY CARD ─────────────────────────────────────────────
function ContextSummaryCard({ currentPage, leads, degenMode, onAction }) {
  const summaries = useMemo(() => {
    if (!leads || leads.length === 0) return null;
    const topCloseable = leads
      .filter(l => l.status !== 'won' && l.status !== 'lost')
      .sort((a, b) => (b.score || 0) - (a.score || 0))
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
          // Was `${l.conversionProbability}%` — null on every live lead, so
          // this rendered "(undefined%)" next to each company.
          items: topCloseable.map(l => `${l.company || l.name} — ${l.score}/100${l.website ? '' : ' · no website'}${l.phone ? ` · ${formatPhone(l.phone)}` : ''}`),
          action: { label: 'Who do I call first?', prompt: 'Who should I call first?' },
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
            `${topCloseable.filter(l => (l.score || 0) >= 75).length} scoring 75+`,
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
  leads: "Ask for a trade and a city — I'll pull live businesses.",
  dashboard: "Pipeline is what you have saved. Ask me to find more.",
  audit: "Drop a URL and I'll find the leak",
  home: "Ask for HVAC in Tampa, or what to say on a cold call.",
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
  const setAuditPrefill = useStore(s => s.setAuditPrefill);
  const liveLeads = useStore(s => s.liveLeads);
  const currentPage = useStore(s => s.page);
  const setPage = useStore(s => s.setPage);
  const selectedLead = useStore(s => s.selectedLead);
  const setSelectedLead = useStore(s => s.setSelectedLead);
  const setDetailOpen = useStore(s => s.setDetailOpen);
  const setPreviousPage = useStore(s => s.setPreviousPage);
  const degenMode = useStore(s => s.degenMode);
  const leads = Array.isArray(liveLeads) ? liveLeads : [];

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
  // What greets every user. The DEGEN variant — "let's print… LFG. What's the
  // play?" — was what actually rendered, because the mode flag is pinned on
  // even though its toggle was removed. The normal one was not much better: it
  // advertised a 250K pipeline, market sentiment and an "open wallet" command,
  // none of which exist.
  const NORMAL_INTRO = "**GOATED AI**\n\n- **Find leads** — \"hvac in tampa\", \"plumbers near me\", \"roofers with no website\"\n- **Know what to say** — openers, objections, voicemails for any business\n- **Price it** — what to quote and why\n- **Audit a site** — paste a URL, get what it is costing them\n\nReal businesses, real numbers. Ask for a city and a trade.";

  const DEGEN_INTRO = NORMAL_INTRO;

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
          const pageSuggestions = buildProactiveTips(useStore.getState(), currentPage);
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
      for (let i = 0; i < cap; i++) if ((leads[i].score || 0) >= 85) hot++;
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
      probability: selectedLead.score,
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

  // Revenue tracking removed. It reported a commission rate we do not charge,
  // an MRR derived from that commission, a $25K/mo goal nobody set, a pipeline
  // health score keyed on a `momentum` field that is hardcoded 'stable' for
  // every Places lead, and — literally — a weekly call count and closing streak
  // generated with Math.random(). All of it was injected into the model prompt
  // on every message, so the assistant reported invented figures with total
  // confidence and coach mode was explicitly told to quote them.

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
    const base = QUICK_ACTIONS[currentPage] || QUICK_ACTIONS.home;
    if (coachMode && currentPage === 'leads') {
      return [
        { label: 'Call Script', prompt: selectedLead ? `Write a word-for-word cold call script for ${selectedLead.company}${selectedLead.location ? ` in ${selectedLead.location}` : ''}. Ask for the owner by role — I do not have a name. Opener, one diagnosing question, the quote, and the close.` : 'Write a cold call script for a local service business. Ask for the owner by role. Opener, one diagnosing question, the quote, the close.', icon: Phone },
        { label: 'Handle Objections', prompt: selectedLead ? `Objection handling for ${selectedLead.company} (${selectedLead.industry}). Cover the four I actually hear: "too expensive", "we handle our own calls", "call me next week", "not interested".` : 'Objection handling for a cold call to a local service business: "too expensive", "we handle our own calls", "call me next week", "not interested".', icon: Shield },
        { label: 'Voicemail', prompt: selectedLead ? `Write a 20-second voicemail for ${selectedLead.company}. Gaps: ${(selectedLead.painPoints||[]).join(', ') || 'none obvious — use missed-call math'}. Name a callback number, no pitch.` : 'Write a 20-second cold voicemail for a local service business. Name a callback number, no pitch.', icon: Voicemail },
        { label: 'Next Best Action', prompt: selectedLead ? `Single best next move on ${selectedLead.company}? Score ${selectedLead.score}/100${selectedLead.website ? '' : ', no website'}${selectedLead.reviewCount != null ? `, ${selectedLead.reviewCount} reviews` : ''}. One action, be specific.` : 'What is the single best action I should take right now to book more jobs? Be specific.', icon: Target },
      ];
    }
    if (selectedLead && currentPage === 'leads') {
      const outreachAction = {
        label: 'Draft outreach',
        prompt: `Draft a phone-first outreach sequence for ${selectedLead.company}${selectedLead.location ? ` in ${selectedLead.location}` : ''}. Industry: ${selectedLead.industry}. Gaps: ${(selectedLead.painPoints||[]).join(', ') || 'none obvious'}. Cold call opener, voicemail, and an SMS follow-up. No email, no LinkedIn.`,
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
    const prompts = PAGE_PROMPTS;
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

  // Open a lead the assistant named, by Google place id.
  //
  // Fetched rather than looked up locally: the chat runs its own Places search,
  // so the businesses it lists are usually NOT in the operator's store. The old
  // behaviour only linked a name when it exactly matched a lead already held,
  // which meant results from a fresh search — the common case — rendered as
  // plain text you had to go and find by hand.
  const openPlace = useCallback(async (placeId) => {
    const local = leads.find(l => placeIdOf(l) === placeId);
    if (local) { openLead(local); return; }
    try {
      const r = await fetch(`/api/leads?action=place&id=${encodeURIComponent(placeId)}`);
      const d = r.ok ? await r.json() : null;
      if (d?.lead) openLead(d.lead);
      else setPage('leads');
    } catch {
      setPage('leads');
    }
  }, [leads, openLead, setPage]);

  // Send a site straight into the auditor and run it.
  const runAudit = useCallback((url) => {
    setAuditPrefill(url);
    setPage('audit');
    setAiOpen(false);
  }, [setAuditPrefill, setPage, setAiOpen]);

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

    const leadCtx = selectedLead ? `\n\nCurrently viewing lead: ${selectedLead.name} at ${selectedLead.company} (${selectedLead.industry}), Score: ${selectedLead.score}/100, Deal: $${(selectedLead.dealValue||0).toLocaleString()}, Status: ${selectedLead.status}, Priority: ${selectedLead.priority}, Phone: ${selectedLead.phone ? formatPhone(selectedLead.phone) : 'N/A'}, Email: ${selectedLead.email||'N/A'}, Website: ${selectedLead.website||'N/A'}, Location: ${selectedLead.location||'N/A'}, Pain Points: ${(selectedLead.painPoints||[]).join(', ')}, Buying Signals: ${(selectedLead.buyingSignals||[]).join(', ')}, Best Method: ${selectedLead.bestMethod||'email'}` : '';
    const coachCtx = coachMode ? '\n\nCOACH MODE IS ON: Act as a closing coach for the lead in view. Work only from the fields given above — do not quote commission, MRR, quotas or streaks, none of which exist in this product. If a number is not in the context, do not state one.' : '';
    const pipelineContext = `Pipeline context: ${leads.length} leads, top 5: ${leads.slice(0, 5).map(l =>
      `${l.name} at ${l.company} (score: ${l.score}, value: ${fmt(l.dealValue)}, priority: ${l.priority}, status: ${l.status})`
    ).join('; ')}${leadCtx}${coachCtx}`;

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
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, degenMode, currentPage }),
        });
        const data = await res.json();
        // A rate-limited or unreachable provider now comes back with a plain
        // explanation attached. Show that rather than a canned template that
        // reads like a real answer to a question we never processed.
        if (data.fallback && data.content) {
          setMessages(p => [...p, { role: 'assistant', content: data.content }]);
          setTyping(false);
          return;
        }
        if (!data.fallback && data.content) {
          // Auto-navigate if response contains [NAVIGATE:page]
          const navMatch = data.content.match(/\[NAVIGATE:(\w+)\]/);
          if (navMatch) {
            const navPage = navMatch[1];
            if (isPageEnabled(navPage, useStore.getState().verifiedEmail)) {
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
    const res = getTemplateResponse(msg, leads, { coachMode, selectedLead, degenMode });

    // Smart auto-navigate based on user intent
    const lower = msg.toLowerCase();
    const PAGE_INTENTS = {
      leads: /\b(lead|prospect|pipeline|find.*(?:in|at|from)|show.*(?:lead|company|deal)|search.*(?:lead|company)|close|outreach)\b/,
      dashboard: /\b(dashboard|stats|analytics|kpi|overview|performance)\b/,
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
  }, [input, typing, messages, leads, useAI, degenMode, coachMode, selectedLead, aiOpen]);

  // Coach Mode: proactive suggestions when viewing a lead
  const prevSelectedRef = useRef(selectedLead?.id);
  useEffect(() => {
    if (coachMode && selectedLead && selectedLead.id !== prevSelectedRef.current) {
      prevSelectedRef.current = selectedLead.id;
      // Rebuilt on real fields. The previous version opened with a commission
      // at 12% of dealValue (we charge none), a "days in stage" from
      // Math.random(), and a decisionTimeline field that does not exist on any
      // lead — so it greeted every lead with three fabricated numbers.
      const l = selectedLead;
      const noSite = !l.website && !l.domain;
      const gaps = [];
      if (noSite) gaps.push('no website');
      if (l.reviewCount === 0) gaps.push('no reviews');
      else if (typeof l.reviewCount === 'number' && l.reviewCount < 25) gaps.push(`only ${l.reviewCount} reviews`);
      if (!l.phone) gaps.push('no published number');

      const bits = [`**${l.company}** — score ${l.score}/100`];
      if (l.revenueFormatted) bits.push(`est. ${l.revenueFormatted}`);
      if (l.activity?.label) bits.push(l.activity.label);

      setMessages(p => [...p, {
        role: 'assistant',
        content: `**Coaching:** ${bits.join(' · ')}\n\n`
          + (gaps.length
              ? `Open on **${gaps.join(' and ')}** — name it in the first sentence.`
              : `Nothing obvious is broken, so open on the missed-call math.`)
          + (l.phone ? `\n\n**Dial:** ${formatPhone(l.phone)}` : `\n\nNo number published — walk in or message the listing.`)
          + `\n\nAsk me to run the close and I will walk the call with you.`,
      }]);
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
        const coachCtx = coachMode ? '\n\nCOACH MODE IS ON: Act as a real-time closing coach.' : '';
        const pipelineContext = `Pipeline context: ${leads.length} leads, top 5: ${leads.slice(0, 5).map(l =>
          `${l.name} at ${l.company} (score: ${l.score}, value: ${fmt(l.dealValue)}, priority: ${l.priority}, status: ${l.status})`
        ).join('; ')}${leadCtx}${coachCtx}`;

        const slimLeadsQA = leads.slice(0, 25).map(l => ({
          id: l.id, name: l.name, company: l.company, industry: l.industry,
          location: l.location, score: l.score, dealValue: l.dealValue,
          status: l.status, priority: l.priority,
          // conversionProbability dropped: it is only ever set on the synthetic
          // pool, so on live Places leads this sent the model a null it was
          // free to fill in with a confident-sounding percentage.
          bestMethod: l.bestMethod, email: l.email,
          // Formatted, so a number the model repeats back is already readable.
          phone: formatPhone(l.phone),
          // Real, and far more useful to reason about than a made-up close rate.
          reviewCount: l.reviewCount, rating: l.rating, website: l.website || null,
          revenueFormatted: l.revenueFormatted || null,
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
              if (navM && isPageEnabled(navM[1], useStore.getState().verifiedEmail)) {
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
            const res = getTemplateResponse(label, leads, { coachMode, selectedLead, degenMode });
            setMessages(p => [...p, { role: 'assistant', content: res }]);
            setTyping(false);
          });
      } else {
        const res = getTemplateResponse(label, leads, { coachMode, selectedLead, degenMode });
        setMessages(p => [...p, { role: 'assistant', content: res }]);
        setTyping(false);
      }
      setInput('');
    }, 10);
  }, [messages, leads, useAI, degenMode, coachMode, selectedLead, aiOpen]);

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

              {/* Coach mode banner. The mini dashboard that used to sit here
                  showed an MRR, a pending-commission figure, a progress bar
                  toward a $25K goal and a "day streak" — none of which were
                  real. The streak was Math.random(); the money was a 12%
                  commission we do not charge. */}
              {coachMode && (
                <div className="mx-2 mt-1 px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.05), rgba(245,158,11,0.02))',
                    borderColor: 'rgba(245,158,11,0.15)',
                  }}
                >
                  <Trophy size={10} className="text-amber-400" />
                  <span className="text-[9px] font-bold text-amber-400 tracking-wider">COACH MODE</span>
                  <div className="flex-1" />
                  <span className="text-[9px] text-amber-400/60">
                    {selectedLead ? `Coaching: ${selectedLead.company}` : 'Open a lead to coach a call'}
                  </span>
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
                    {QUICK_INSIGHTS.map(qi => (
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
                        {initialsOf(selectedLead.company || selectedLead.name)}
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
                      // These addressed the lead by `name` "at" `company` —
                      // identical strings for a Places record, so the prompt
                      // read "for ADU Water Fire Mold Storm at ADU Water Fire
                      // Mold Storm". They also asked about competitorUsing,
                      // decisionTimeline, buyingSignals and conversionProbability,
                      // none of which exist on a local business, which invited
                      // the model to fill the gaps in.
                      { label: 'Lead Brief', action: `Brief me on ${selectedLead.company}${selectedLead.location ? ` in ${selectedLead.location}` : ''} — ${selectedLead.industry}. `
                        + `${selectedLead.website ? `Site: ${selectedLead.website}. ` : 'No website. '}`
                        + `${selectedLead.reviewCount != null ? `${selectedLead.reviewCount} reviews${selectedLead.rating ? ` at ${selectedLead.rating} stars` : ''}. ` : ''}`
                        + `${selectedLead.activity?.label ? `${selectedLead.activity.label}. ` : ''}`
                        + `What do I open with and what do I quote?` },
                      { label: 'Why call them', action: `Why is ${selectedLead.company} worth calling? Score ${selectedLead.score}/100`
                        + `${selectedLead.website ? '' : ', no website'}`
                        + `${selectedLead.reviewCount != null ? `, ${selectedLead.reviewCount} reviews` : ''}. Two sentences.` },
                      { label: 'Cold call script', action: `Write a cold call script for ${selectedLead.company} (${selectedLead.industry}). `
                        + `I do not have a contact name — ask for the owner by role. Opener, one diagnosing question, the quote, the close.` },
                      { label: 'Coach Me', action: `Coach me on closing ${selectedLead.company}. Score ${selectedLead.score}/100`
                        + `${selectedLead.website ? '' : ', no website'}. What is the single best next move?` },
                      { label: 'What do I quote?', action: `What do I quote ${selectedLead.company}?`
                        + `${selectedLead.website ? '' : ' They have no website.'}` },
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
                                onOpenPlace={openPlace}
                                onAudit={runAudit}
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
