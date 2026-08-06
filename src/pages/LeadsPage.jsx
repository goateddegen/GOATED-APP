import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Users, Search, Phone, Mail, ArrowUp, ArrowDown,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Loader2, DollarSign, TrendingUp, Building2, Zap, Send, Sparkles,
  Linkedin, Clock, Flame, Brain, MessageSquare, Bot, Wand2, Filter,
  Target, Star, Eye, Copy, X, Activity, CheckCircle, Check,
  Crown, PhoneCall, Timer, UserSearch, Table2,
  ExternalLink, MapPin, Crosshair, AlertTriangle, Radio, RefreshCw, Globe,
} from 'lucide-react';
import { useStore, fmt, priorities, statuses, industries, initialsOf, cityOf } from '../hooks/useStore';
import { buildOutreachStrategy, deriveGaps, recommendTier, buildPackage } from '../lib/outreach';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const priorityColors = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  medium: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};
const statusColors = {
  won: 'bg-emerald-500/15 text-emerald-400', lost: 'bg-red-500/15 text-red-400',
  negotiation: 'bg-yellow-500/15 text-yellow-400', proposal: 'bg-purple-500/15 text-purple-400',
  qualified: 'bg-blue-500/15 text-blue-400', contacted: 'bg-cyan-500/15 text-cyan-400',
  new: 'bg-slate-500/15 text-slate-400', nurturing: 'bg-teal-500/15 text-teal-400',
  're-engaged': 'bg-indigo-500/15 text-indigo-400', 'on-hold': 'bg-orange-500/15 text-orange-400',
  unresponsive: 'bg-gray-500/15 text-gray-400',
};


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function simpleHash(seed) {
  let h = seed | 0;
  h = ((h >> 16) ^ h) * 0x45d9f3b | 0;
  h = ((h >> 16) ^ h) * 0x45d9f3b | 0;
  h = (h >> 16) ^ h;
  return (h >>> 0) / 4294967296;
}
function seededRange(seed, min, max) {
  return Math.floor(simpleHash(seed) * (max - min + 1)) + min;
}

function getCloseProbability(lead, index) {
  const seed = (index + 1) * 5021;
  let prob = 20;
  if (lead.score >= 90) prob += 35;
  else if (lead.score >= 80) prob += 25;
  else if (lead.score >= 60) prob += 15;
  else prob += 5;
  if (lead.status === 'negotiation') prob += 25;
  else if (lead.status === 'proposal') prob += 18;
  else if (lead.status === 'qualified') prob += 12;
  else if (lead.status === 'contacted') prob += 6;
  else if (lead.status === 'won') prob = 100;
  else if (lead.status === 'lost') prob = 0;
  if (lead.priority === 'critical') prob += 10;
  else if (lead.priority === 'high') prob += 5;
  if (lead.momentum === 'surging') prob += 8;
  else if (lead.momentum === 'rising') prob += 4;
  else if (lead.momentum === 'declining') prob -= 8;
  prob += Math.round((simpleHash(seed) - 0.5) * 10);
  return Math.max(0, Math.min(100, prob));
}

function closeProbColor(prob) {
  if (prob >= 75) return 'text-emerald-400';
  if (prob >= 50) return 'text-amber-400';
  if (prob >= 25) return 'text-orange-400';
  return 'text-red-400';
}

function closeProbBg(prob) {
  if (prob >= 75) return 'bg-emerald-500';
  if (prob >= 50) return 'bg-amber-500';
  if (prob >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

const INDUSTRY_PAIN_POINTS = {
  'SaaS': ['High churn rate bleeding MRR', 'Customer acquisition cost too high', 'No product-led growth engine'],
  'Fintech': ['Compliance bottlenecks slowing launches', 'Customer trust deficit', 'Legacy system migration pain'],
  'E-commerce': ['Cart abandonment over 70%', 'No retention/loyalty program', 'Rising ad costs crushing margins'],
  'Healthcare': ['Patient acquisition cost rising', 'No online booking system', 'HIPAA-compliant marketing gaps'],
  'EdTech': ['Low course completion rates', 'Student acquisition cost too high', 'No community engagement strategy'],
  'Cybersecurity': ['Long enterprise sales cycles', 'Difficulty proving ROI to prospects', 'Crowded market positioning'],
  'AI/ML': ['Difficulty monetizing research', 'Enterprise trust and explainability concerns', 'Data pipeline reliability issues'],
  'MarTech': ['Client retention under 60%', 'No scalable fulfillment process', 'Proposal-to-close ratio below 20%'],
  'Construction': ['No online lead generation', 'Relying 100% on referrals', 'No CRM or follow-up system'],
  'PropTech': ['Long sales cycles with multiple stakeholders', 'No digital transaction workflow', 'Market data blind spots'],
  'InsurTech': ['Agent productivity declining', 'Claims processing bottlenecks', 'Customer experience gaps'],
  'LegalTech': ['Billable hour tracking inefficiency', 'Client intake process too slow', 'No marketing or referral pipeline'],
  'FoodTech': ['Thin margins with no upsell strategy', 'No online ordering presence', 'Customer loyalty program gaps'],
  'HRTech': ['Time-to-fill exceeding 45 days', 'Candidate sourcing costs too high', 'No employer branding strategy'],
  'Logistics': ['Route optimization gaps costing 20%+ fuel', 'No real-time tracking visibility', 'Manual dispatch processes'],
  'CleanTech': ['Long government procurement cycles', 'Difficulty proving ROI payback period', 'Market education burden'],
  'SupplyChain': ['Production downtime exceeding 15%', 'No predictive maintenance system', 'Quality control gaps'],
  'Media': ['Content monetization challenges', 'Audience growth plateau', 'Ad revenue declining year over year'],
  'Gaming': ['User retention dropping after day 7', 'Monetization rate below industry average', 'Rising UA costs'],
  'Web3/Crypto': ['Community growth stalling', 'Token utility unclear to users', 'Regulatory uncertainty blocking partnerships'],
  'default': ['No clear digital presence', 'Inefficient lead generation process', 'Poor conversion rates on website'],
};

function getLeadPainPoints(lead) {
  return INDUSTRY_PAIN_POINTS[lead.industry] || INDUSTRY_PAIN_POINTS['default'];
}

function getCloseStrategy(lead, prob) {
  if (prob >= 75) return { label: 'Close Now', color: 'emerald', steps: ['Send final proposal with limited-time incentive', 'Schedule decision call within 48 hours', 'Have contract ready for e-signature'] };
  if (prob >= 50) return { label: 'Nurture to Close', color: 'amber', steps: ['Address remaining objections', 'Share relevant case study', 'Offer pilot/trial to reduce risk'] };
  if (prob >= 25) return { label: 'Build Trust', color: 'orange', steps: ['Send personalized value analysis', 'Schedule discovery call', 'Share free resource'] };
  return { label: 'Long Nurture', color: 'red', steps: ['Add to drip campaign', 'Engage on LinkedIn', 'Check back in 30-60 days'] };
}

function getContactIntel(lead, index) {
  const seed = (index + 1) * 4219;
  const lastActiveDays = seededRange(seed + 6, 0, 90);
  const lastActive = lastActiveDays === 0 ? 'Active now' : lastActiveDays < 7 ? `${lastActiveDays}d ago` : lastActiveDays < 30 ? `${Math.floor(lastActiveDays / 7)}w ago` : `${Math.floor(lastActiveDays / 30)}mo ago`;
  return { phone: lead.phone || null, lastActive, lastActiveDays };
}

function relativeTime(dateStr) {
  if (!dateStr) return '--';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function scoreColor(score) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-brand';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBarColor(score) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-brand';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

// ---------------------------------------------------------------------------
// AI Chat Prompt Parser — Natural Language Lead Search
// ---------------------------------------------------------------------------
function parseAIPrompt(prompt) {
  const text = prompt.toLowerCase();
  const filters = { industry: null, status: null, priority: null, minScore: 0, maxScore: 100, minDeal: 0, maxDeal: Infinity, location: null, title: null, source: null, momentum: null, search: null, sort: null, order: null };
  const understood = [];

  // Industry matching with aliases
  const industryAliases = {
    'SaaS': ['saas', 'software', 'b2b software', 'cloud'],
    'Fintech': ['fintech', 'finance', 'financial', 'banking', 'payments', 'accounting'],
    'E-commerce': ['ecommerce', 'e-commerce', 'online store', 'retail', 'shop', 'dtc', 'd2c'],
    'Healthcare': ['healthcare', 'health', 'medical', 'dental', 'clinic', 'hospital', 'wellness', 'fitness'],
    'EdTech': ['edtech', 'education', 'learning', 'training', 'academy'],
    'AI/ML': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep tech', 'neural'],
    'MarTech': ['martech', 'marketing', 'agency', 'creative agency', 'digital agency', 'advertising'],
    'Construction': ['construction', 'roofing', 'plumbing', 'hvac', 'electric', 'home service', 'contractor', 'landscaping', 'painting'],
    'PropTech': ['proptech', 'real estate', 'realty', 'property'],
    'InsurTech': ['insurtech', 'insurance'],
    'LegalTech': ['legaltech', 'legal', 'law firm', 'attorney', 'lawyer'],
    'CleanTech': ['cleantech', 'clean energy', 'solar', 'renewable', 'sustainability', 'green energy'],
    'FoodTech': ['foodtech', 'food', 'restaurant', 'catering', 'bakery', 'brewery', 'coffee'],
    'HRTech': ['hrtech', 'hr', 'staffing', 'recruiting', 'talent'],
    'Logistics': ['logistics', 'shipping', 'freight', 'transport', 'supply chain'],
    'SupplyChain': ['manufacturing', 'industrial', 'fabrication'],
    'Media': ['media', 'content', 'production', 'studio', 'publishing'],
    'Gaming': ['gaming', 'game', 'esports'],
    'Web3/Crypto': ['web3', 'crypto', 'blockchain', 'defi', 'dao', 'nft', 'token'],
    'DevTools': ['devtools', 'developer tools', 'dev tools', 'infrastructure'],
    'Cybersecurity': ['cybersecurity', 'security', 'infosec'],
    'IoT': ['iot', 'internet of things', 'connected devices'],
  };
  for (const [ind, aliases] of Object.entries(industryAliases)) {
    for (const alias of aliases) {
      if (text.includes(alias)) { filters.industry = ind; understood.push(`Industry: ${ind}`); break; }
    }
    if (filters.industry) break;
  }

  // Status matching with natural language
  const statusAliases = {
    'negotiation': ['negotiation', 'negotiating', 'closing', 'close', 'almost closed', 'about to close'],
    'proposal': ['proposal', 'proposed', 'sent proposal'],
    'qualified': ['qualified', 'warm'],
    'contacted': ['contacted', 'reached out', 'outreached'],
    'new': ['new', 'fresh', 'untouched', 'cold'],
    'won': ['won', 'closed won', 'converted', 'customer'],
    'lost': ['lost', 'closed lost', 'dead'],
    'nurturing': ['nurturing', 'nurture', 'drip'],
    're-engaged': ['re-engaged', 'reengaged', 'came back', 'returned'],
    'unresponsive': ['unresponsive', 'ghosted', 'no response', 'silent'],
  };
  for (const [status, aliases] of Object.entries(statusAliases)) {
    for (const alias of aliases) {
      if (text.includes(alias)) { filters.status = status; understood.push(`Status: ${status}`); break; }
    }
    if (filters.status) break;
  }

  // Priority
  for (const p of priorities) { if (text.includes(p)) { filters.priority = p; understood.push(`Priority: ${p}`); break; } }

  // Score parsing — more patterns
  const scorePatterns = [
    /(?:score|rating)\s*(?:>=?|above|over|>)\s*(\d+)/,
    /(\d+)\+?\s*(?:score|rating)/,
    /(?:above|over|min(?:imum)?)\s*(\d+)\s*(?:score|rating)/,
  ];
  for (const pat of scorePatterns) {
    const m = text.match(pat);
    if (m) { filters.minScore = parseInt(m[1]); understood.push(`Score >= ${m[1]}`); break; }
  }

  // Deal value parsing — more patterns including plain dollar amounts
  const dealPatterns = [
    /\$(\d+)\s*k/i,
    /\$(\d+),?(\d{3})/,
    /(\d+)\s*k\s*(?:\+|deal|value)/i,
    /(?:deal|value|worth|pipeline)\s*(?:>=?|above|over|>)\s*\$?(\d+)\s*k?/i,
    /(?:above|over|more than|at least|minimum)\s*\$(\d+)\s*k?/i,
  ];
  for (const pat of dealPatterns) {
    const m = text.match(pat);
    if (m) {
      let v = parseInt(m[1]);
      if (m[2]) v = parseInt(m[1] + m[2]); // Handle $50,000
      else if (v < 1000) v *= 1000; // Handle $50k
      filters.minDeal = v;
      understood.push(`Deal >= $${(v / 1000).toFixed(0)}K`);
      break;
    }
  }

  // Location — expanded city list
  const cities = [
    'san francisco', 'new york', 'austin', 'chicago', 'seattle', 'miami', 'boston', 'denver',
    'los angeles', 'london', 'toronto', 'berlin', 'singapore', 'sydney', 'tokyo', 'portland',
    'atlanta', 'dallas', 'phoenix', 'nashville', 'raleigh', 'salt lake', 'vancouver', 'dubai',
    'mumbai', 'bangalore', 'seoul', 'amsterdam', 'dublin', 'tel aviv', 'paris', 'stockholm',
    'copenhagen', 'melbourne', 'cape town', 'lagos', 'nairobi',
  ];
  for (const city of cities) { if (text.includes(city)) { filters.location = city; understood.push(`Location: ${city}`); break; } }

  // Roles — expanded with more aliases
  const roles = [
    { kw: ['ceo', 'chief executive', 'c-suite'], val: 'CEO' },
    { kw: ['founder', 'cofounder', 'co-founder'], val: 'Founder' },
    { kw: ['cto', 'chief technology', 'tech lead'], val: 'CTO' },
    { kw: ['cmo', 'chief marketing'], val: 'CMO' },
    { kw: ['cfo', 'chief financial'], val: 'CFO' },
    { kw: ['cro', 'chief revenue'], val: 'CRO' },
    { kw: ['vp', 'vice president'], val: 'VP' },
    { kw: ['director'], val: 'Director' },
    { kw: ['owner', 'owner-operator'], val: 'Owner' },
    { kw: ['manager', 'head of'], val: 'Manager' },
    { kw: ['partner', 'managing partner'], val: 'Partner' },
    { kw: ['marketing director', 'marketing manager', 'marketer'], val: 'Marketing' },
    { kw: ['sales manager', 'head of sales', 'sales lead'], val: 'Sales' },
    { kw: ['operations', 'ops'], val: 'Operations' },
  ];
  for (const r of roles) { for (const kw of r.kw) { if (text.includes(kw)) { filters.title = r.val; understood.push(`Role: ${r.val}`); break; } } if (filters.title) break; }

  // Momentum
  if (text.includes('surging') || text.includes('momentum') || text.includes('trending up')) { filters.momentum = 'surging'; understood.push('Momentum: surging'); }
  else if (text.includes('rising') || text.includes('growing')) { filters.momentum = 'rising'; understood.push('Momentum: rising'); }
  else if (text.includes('declining') || text.includes('dropping') || text.includes('falling')) { filters.momentum = 'declining'; understood.push('Momentum: declining'); }

  // Natural language intent shortcuts
  if (text.includes('hot') || text.includes('best') || text.includes('top') || text.includes('highest score') || text.includes('strongest')) {
    filters.minScore = Math.max(filters.minScore, 80); if (!understood.some(u => u.startsWith('Score'))) understood.push('Score >= 80 (hot leads)');
  }
  if (text.includes('biggest') || text.includes('largest') || text.includes('best')) {
    filters.minScore = Math.max(filters.minScore || 0, 75); if (!understood.some(u => u.startsWith('Score'))) understood.push('Score >= 75');
    filters.sort = 'dealValue'; filters.order = 'desc';
  }
  if (text.includes('quick win') || text.includes('easy close') || text.includes('low hanging') || text.includes('ready to buy')) {
    filters.minScore = Math.max(filters.minScore, 70);
    if (!filters.status) { filters.status = 'negotiation'; understood.push('Status: negotiation (ready to close)'); }
    if (!understood.some(u => u.startsWith('Score'))) understood.push('Score >= 70 (quick wins)');
  }
  if (text.includes('highest value') || text.includes('biggest deal') || text.includes('most valuable') || text.includes('highest revenue')) {
    filters.sort = 'dealValue'; filters.order = 'desc'; understood.push('Sort: highest deal value');
  }
  if (text.includes('newest') || text.includes('most recent') || text.includes('latest')) {
    filters.sort = 'created_at'; filters.order = 'desc'; understood.push('Sort: newest first');
  }
  if (text.includes('highest score') || text.includes('best score')) {
    filters.sort = 'score'; filters.order = 'desc'; understood.push('Sort: highest score');
  }

  // Lead source matching
  const sources = ['apollo', 'linkedin', 'cold email', 'website', 'referral', 'paid ad', 'webinar', 'conference', 'partner', 'inbound'];
  for (const src of sources) { if (text.includes(src)) { filters.source = src; understood.push(`Source: ${src}`); break; } }

  // Fallback to text search if nothing was parsed
  if (understood.length === 0 && text.trim()) { filters.search = prompt.trim(); }

  return { filters, understood };
}

// v7.5.4 — Two-tier targeting:
//   Local Engine (Tier 1): brick & mortar, deal $5-25K, deposit $2K + $750/mo
//   Growth Engine (Tier 2): online/agency/SMB, deal $25K+, deposit $10-20K + $2.5-5K/mo
// Filters for the businesses we actually list. The previous set was written
// for an Apollo-shaped pipeline — "SaaS or MarTech founders above $25K",
// "whale enterprise deals above $50K" — and returned nothing, because every
// lead here is a local operator with a $2,000 deposit.
const PRESET_PROMPTS = [
  { label: 'Open right now',  prompt: 'Businesses that are open right now and have a phone number',        icon: Flame },
  { label: 'No website',      prompt: 'Businesses with no website at all',                                 icon: Globe },
  { label: 'Thin reviews',    prompt: 'Businesses with fewer than 25 reviews',                             icon: Star },
  { label: 'Emergency trades',prompt: 'HVAC, plumbing, electrical and water damage businesses',            icon: Target },
  { label: 'Actively trading',prompt: 'Businesses with a review in the last month',                        icon: UserSearch },
  { label: 'Best scores',     prompt: 'Highest closability scores first',                                  icon: Crown },
];

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
// ─── City filter ────────────────────────────────────────────────────────────
// Sits in the filter bar next to the priority and status selects. Options come
// from the leads actually held so it never lists a place with nothing behind
// it, and it carries its own search box because a working session can
// accumulate dozens of cities.
function CityFilter({ options, selected, onToggle, onClear, onApply, onSearchNew }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  // Close on outside click and on Escape — a filter popover that traps you is
  // worse than no popover.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); setQ(''); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? options.filter(o => o.city.toLowerCase().includes(needle)) : options;
  }, [options, q]);

  if (!options.length) return null;

  const label = selected.length === 0
    ? 'All Cities'
    : selected.length === 1 ? selected[0] : `${selected.length} Cities`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs outline-none border transition-colors ${
          selected.length
            ? 'bg-brand/15 border-brand/40 text-brand'
            : 'bg-surface-2 border-white/[0.05] text-white hover:border-white/[0.12]'}`}>
        <MapPin size={12} className="shrink-0" />
        <span className="max-w-[120px] truncate">{label}</span>
        <ChevronDown size={12} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-40 mt-1 left-0 w-64 max-w-[85vw] rounded-xl border border-white/[0.08] bg-surface-3 shadow-2xl shadow-black/60 overflow-hidden">
          <div className="p-2 border-b border-white/[0.05]">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search cities…"
                aria-label="Search cities"
                className="w-full pl-7 pr-2 h-8 bg-surface-2 border border-white/[0.05] rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-brand/40" />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {shown.map(({ city, count }) => {
              const on = selected.includes(city);
              return (
                <button
                  key={city}
                  onClick={() => onToggle(city)}
                  className="w-full flex items-center gap-2.5 px-3 h-9 text-left hover:bg-white/[0.04] transition-colors">
                  <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                    on ? 'bg-brand border-brand' : 'border-white/20'}`}>
                    {on && <Check size={10} className="text-black" strokeWidth={3} />}
                  </span>
                  <span className={`flex-1 text-xs truncate ${on ? 'text-brand' : 'text-slate-300'}`}>{city}</span>
                  <span className="text-[10px] text-slate-600 shrink-0">{count}</span>
                </button>
              );
            })}
            {/* Nothing local matches, so offer to go and fetch it. This is
                where the separate market box used to live — folding it in here
                means one control for "which city", whether you already have
                leads there or not. */}
            {!shown.length && q.trim().length > 1 && (
              <button
                onClick={() => { onSearchNew(q.trim()); setQ(''); setOpen(false); }}
                className="w-full px-3 py-3 text-left hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-2">
                  <Search size={12} className="text-brand shrink-0" />
                  <span className="text-xs text-brand truncate">Find leads in “{q.trim()}”</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 pl-5">No leads here yet — pull some</div>
              </button>
            )}
            {!shown.length && q.trim().length <= 1 && (
              <div className="px-3 py-4 text-center text-[11px] text-slate-500">Type a city to search.</div>
            )}
          </div>

          <div className="flex items-center gap-2 p-2 border-t border-white/[0.05]">
            <button
              onClick={() => { onClear(); setQ(''); }}
              disabled={!selected.length}
              className="text-[11px] text-slate-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Clear
            </button>
            <button
              onClick={() => { onApply(selected); setOpen(false); setQ(''); }}
              disabled={!selected.length}
              className="ml-auto px-3 h-8 rounded-lg bg-brand/15 border border-brand/30 text-brand text-[11px] font-semibold hover:bg-brand/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Load these cities
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Toast({ message, visible, onDone }) {
  useEffect(() => { if (visible) { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); } }, [visible, onDone]);
  if (!visible) return null;
  return <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-xl bg-brand text-black text-sm font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-4">{message}</div>;
}

// ---------------------------------------------------------------------------
// Sort Header
// ---------------------------------------------------------------------------
function SortHeader({ field, label, sortField, sortDirection, onSort }) {
  const active = sortField === field;
  return (
    <th onClick={() => onSort(field)} className="px-3 py-3 text-left text-xs text-slate-500 font-medium uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none">
      <div className="flex items-center gap-1">
        {label}
        {active && (sortDirection === 'asc' ? <ArrowUp size={12} className="text-brand" /> : <ArrowDown size={12} className="text-brand" />)}
      </div>
    </th>
  );
}

// ---------------------------------------------------------------------------
// AI Chat Message
// ---------------------------------------------------------------------------
function AIChatMessage({ role, content, understood, leadCount, timestamp, isAI, isError }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end mb-2">
        <div className="max-w-[80%] px-3 py-2 rounded-xl bg-brand/15 border border-brand/20 text-sm text-white">{content}</div>
      </div>
    );
  }
  return (
    <div className="flex gap-2 mb-2">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand/30 to-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot size={12} className="text-brand" />
      </div>
      <div className={`flex-1 px-3 py-2 rounded-xl text-sm ${isError ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-surface-2 border border-white/[0.04] text-slate-300'}`}>
        {content}
        {understood && understood.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1.5">
            {understood.map((u, i) => <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-brand/10 text-brand/80 border border-brand/15">{u}</span>)}
          </div>
        )}
        {leadCount !== undefined && <div className="mt-1 text-[10px] text-slate-500">{leadCount.toLocaleString()} leads matched</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Call Modal — Native device calling via tel: links + copy number fallback
// ---------------------------------------------------------------------------
function CallModal({ lead, phone, onClose, showToast }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm mx-4 bg-[#0a0a0a] rounded-2xl border border-white/[0.08] shadow-2xl p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-brand/15 flex items-center justify-center mx-auto mb-3">
          <Phone size={28} className="text-brand" />
        </div>
        <div className="text-lg font-bold text-white mb-1">{lead.name}</div>
        <div className="text-sm text-slate-400 mb-1">{lead.company} · {lead.industry}</div>
        <div className="text-xs text-slate-500 mb-4">Direct line available</div>

        <div className="space-y-2">
          <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}
            className="w-full py-3 rounded-xl bg-brand text-black font-bold text-sm hover:bg-brand/90 transition-colors flex items-center justify-center gap-2">
            <PhoneCall size={16} /> Call from Device
          </a>
          <button onClick={() => { navigator.clipboard.writeText(phone); showToast('Phone number copied'); }}
            className="w-full py-2.5 rounded-xl bg-surface-2 text-slate-300 text-sm hover:bg-surface-1 transition-colors flex items-center justify-center gap-2">
            <Copy size={14} /> Copy Number
          </button>
        </div>
        <button onClick={onClose} className="mt-3 text-xs text-slate-500 hover:text-white">Close</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schedule Modal (simplified)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Close Coach Panel (inline per-lead)
// ---------------------------------------------------------------------------
function CloseCoachRow({ lead, index, colSpan, onCallClick, showToast }) {
  const prob = getCloseProbability(lead, index);
  const strategy = getCloseStrategy(lead, prob);
  const painPoints = getLeadPainPoints(lead);
  const outreach = buildOutreachStrategy(lead);
  const intel = getContactIntel(lead, index);
  const [activeOutreach, setActiveOutreach] = useState(null);

  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <div className="bg-gradient-to-r from-brand/[0.03] via-transparent to-brand/[0.02] border-t border-brand/10 px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Close Strategy */}
            <div className="bg-black/30 rounded-xl p-4 border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} className={`text-${strategy.color}-400`} />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Close Strategy</span>
                <span className={`ml-auto text-lg font-black ${closeProbColor(prob)}`}>{prob}%</span>
              </div>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-${strategy.color}-500/10 border border-${strategy.color}-500/20 text-xs font-bold text-${strategy.color}-400 mb-3`}>
                {strategy.label}
              </div>
              <div className="space-y-2">
                {strategy.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-brand font-bold mt-0.5">{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.04]">
                <div className="text-[10px] text-slate-500 mb-1">Primary pain point:</div>
                <div className="text-xs text-orange-300 font-medium">{painPoints[0]}</div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-slate-500">Commission:</span>
                <span className="text-brand font-bold">{fmt(Math.round((lead.dealValue || 0) * 0.13))}</span>
              </div>
            </div>

            {/* Quick Outreach */}
            <div className="bg-black/30 rounded-xl p-4 border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-3">
                <Send size={14} className="text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Quick Outreach</span>
              </div>

              {/* Recommended package, sized from this business's own headcount
                  and revenue rather than a fixed pitch. */}
              <div className="mb-3 rounded-lg border border-brand/25 bg-brand/[0.07] px-3 py-2.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-brand font-bold">Recommended</span>
                  <span className="text-[10px] font-mono text-slate-400">{outreach.tier.price}</span>
                </div>
                <div className="text-sm font-bold text-white">{outreach.tier.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{outreach.tier.why}</div>
              </div>

              {/* Gaps we can actually name on the call — each one comes from a
                  field on the record, not a generic industry list. */}
              {outreach.gaps.length > 0 && (
                <div className="mb-3 space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Angles for this business</div>
                  {outreach.gaps.slice(0, 3).map(g => (
                    <div key={g.key} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <span className="mt-1 w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                      <span><span className="text-amber-400 font-medium">{g.label}</span> — {g.angle}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 mb-3">
                <button onClick={() => intel.phone ? onCallClick(lead, intel.phone) : showToast('Connect Apollo.io API key to enrich contact data')}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors text-left">
                  <Phone size={13} /> {intel.phone ? 'Call Now · Direct line' : 'Enrich to unlock phone'}
                </button>
                {/* Email intentionally absent — outreach is phone-first and
                    manual. Apollo's free plan returns no person-level address
                    anyway, so an email button would have been mailto:null. */}
                <button onClick={() => setActiveOutreach(activeOutreach === 'call' ? null : 'call')}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors text-left">
                  <MessageSquare size={13} /> Call Opener
                </button>
                {lead.linkedin_url && (
                  <button onClick={() => setActiveOutreach(activeOutreach === 'linkedin' ? null : 'linkedin')}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-colors text-left">
                    <Linkedin size={13} /> LinkedIn Message
                  </button>
                )}
                <button onClick={() => setActiveOutreach(activeOutreach === 'sms' ? null : 'sms')}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors text-left">
                  <MessageSquare size={13} /> SMS Template
                </button>
              </div>
              {activeOutreach && (
                <div className="bg-surface-2 rounded-lg p-3 border border-white/[0.04]">
                  <div className="text-xs text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto mb-2">
                    {outreach[activeOutreach]}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(outreach[activeOutreach] || ''); showToast('Copied to clipboard'); }}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-brand/15 text-brand text-[10px] font-bold hover:bg-brand/25 transition-colors">
                      <Copy size={10} /> Copy
                    </button>
                    {activeOutreach === 'sms' && lead.phone && (
                      <a href={`sms:${(lead.phone || '').replace(/[^+\d]/g, '')}&body=${encodeURIComponent(outreach.sms)}`}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-amber-500 text-black text-[10px] font-bold hover:bg-amber-400 transition-colors">
                        <MessageSquare size={10} /> Open SMS
                      </a>
                    )}
                    {activeOutreach === 'linkedin' && (
                      <a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(lead.name + ' ' + lead.company)}`} target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-blue-500 text-white text-[10px] font-bold hover:bg-blue-600 transition-colors">
                        <Linkedin size={10} /> Open
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Lead Intel */}
            <div className="bg-black/30 rounded-xl p-4 border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-3">
                <Crosshair size={14} className="text-brand" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Lead Intel</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Industry</span><span className="text-white font-medium">{lead.industry}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Location</span><span className="text-white font-medium">{lead.location || '--'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Deposit</span><span className="text-brand font-bold">{fmt(buildPackage(lead).deposit)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Monthly</span><span className="text-brand font-bold">{fmt(buildPackage(lead).monthly)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Score</span><span className={`font-bold ${scoreColor(lead.score)}`}>{lead.score}/100</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Last Active</span><span className="text-white">{intel.lastActive}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Momentum</span><span className={`font-medium ${lead.momentum === 'rising' || lead.momentum === 'surging' ? 'text-emerald-400' : lead.momentum === 'declining' ? 'text-red-400' : 'text-slate-400'}`}>{lead.momentum || 'stable'}</span></div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.04]">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">All Pain Points</div>
                {painPoints.map((p, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-slate-400 mb-1">
                    <AlertTriangle size={10} className="text-orange-400 mt-0.5 flex-shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function LeadsPage({ onSelect }) {
  // Selective selectors to avoid full-store re-renders (ticker, RAF, etc).
  const search = useStore(s => s.search);
  const setSearch = useStore(s => s.setSearch);
  const filterPriority = useStore(s => s.filterPriority);
  const setFilterPriority = useStore(s => s.setFilterPriority);
  const filterStatus = useStore(s => s.filterStatus);
  const setFilterStatus = useStore(s => s.setFilterStatus);
  const leadsPage = useStore(s => s.leadsPage);
  const setLeadsPage = useStore(s => s.setLeadsPage);
  const leadsPerPage = useStore(s => s.leadsPerPage);
  const setLeadsPerPage = useStore(s => s.setLeadsPerPage);
  const sortField = useStore(s => s.sortField);
  const setSortField = useStore(s => s.setSortField);
  const sortDirection = useStore(s => s.sortDirection);
  const setSortDirection = useStore(s => s.setSortDirection);
  const allLeads = useStore(s => s.leads);
  const getLeads = useStore(s => s.getLeads);
  const degenMode = useStore(s => s.degenMode);

  const fetchLiveLeads = useStore(s => s.fetchLiveLeads);
  const lastAddedLeadCount = useStore(s => s.lastAddedLeadCount);
  const noWebsiteLeads = useStore(s => s.noWebsiteLeads);
  // Opening a lead is a two-step store action — LeadDetail reads selectedLead
  // and renders on detailOpen. Both were missing from this page's selectors.
  const setSelectedLead = useStore(s => s.setSelectedLead);
  const setDetailOpen = useStore(s => s.setDetailOpen);
  const market = useStore(s => s.market);
  const setMarket = useStore(s => s.setMarket);
  const selectedCities = useStore(s => s.selectedCities);
  const toggleCity = useStore(s => s.toggleCity);
  const setSelectedCities = useStore(s => s.setSelectedCities);
  const fetchLeadsForCities = useStore(s => s.fetchLeadsForCities);
  const resolvedMarket = useStore(s => s.resolvedMarket);

  const liveLeads = useStore(s => s.liveLeads);
  const dataMode = useStore(s => s.dataMode);
  const isLoadingLeads = useStore(s => s.isLoadingLeads);
  const leadsError = useStore(s => s.leadsError);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  // Pull fresh businesses every time the page is opened.
  //
  // This was previously once-per-load, because refetching used to REPLACE the
  // list and pressing back from a lead wiped everything worked so far. Fetches
  // now append and dedupe, so a refetch can only add — and the server is told
  // which places we already hold, so what comes back is genuinely new rather
  // than the same rotation.
  //
  // Coming back from a lead detail is excluded: that's not a fresh visit, and
  // firing a search because someone pressed back is just noise.
  const currentPage = useStore(s => s.page);
  const detailOpen = useStore(s => s.detailOpen);
  useEffect(() => {
    if (currentPage !== 'leads' || detailOpen) return;
    fetchLiveLeads();
  }, [currentPage, detailOpen, fetchLiveLeads]);

  const isLive = dataMode === 'live' && liveLeads.length > 0;

  // Only pay the cost of generating the synthetic pool when we actually need it.
  useEffect(() => {
    if (!isLive && !isLoadingLeads && !allLeads) getLeads();
  }, [isLive, isLoadingLeads, allLeads, getLeads]);

  // While the first live fetch is in flight we show a skeleton, so the
  // synthetic pool must not render underneath it.
  const activeLeads = isLive ? liveLeads : (isLoadingLeads ? [] : (allLeads || []));

  // ── Who to ring right now ────────────────────────────────────────────────
  // The tables answer "who exists". This answers "who can I actually reach in
  // the next ten minutes": open at this moment (Places publishes hours, and
  // roughly half a sample is shut at any given time) and with a number to dial.
  // Only offer cities we actually have leads in — a filter listing places
  // with nothing behind it is just a dead end.
  const availableCities = useMemo(() => {
    const counts = new Map();
    for (const l of [...(liveLeads || []), ...(noWebsiteLeads || [])]) {
      const c = cityOf(l);
      if (c) counts.set(c, (counts.get(c) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([city, count]) => ({ city, count }));
  }, [liveLeads, noWebsiteLeads]);

  const callQueue = useMemo(() => {
    const pool = [...(liveLeads || []), ...(noWebsiteLeads || [])];
    return pool
      .filter(l => l.phone && l.openNow === true)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 12);
  }, [liveLeads, noWebsiteLeads]);


  // Core state
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const showToast = useCallback((msg) => { setToastMsg(msg); setToastVisible(true); }, []);
  const [visibleCount, setVisibleCount] = useState(50);
  const sentinelRef = useRef(null);

  // Modals — NOTE: CallModal is a native `tel:` launcher, NOT in-app VoIP.
  // We intentionally hand off to the user's OS dialer / their own BYO number (OpenPhone, Dialpad, etc).
  const [callLead, setCallLead] = useState(null);
  const [callPhone, setCallPhone] = useState('');

  // AI Chat
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState([{
    role: 'assistant',
    content: "I'm your AI lead finder. Tell me what you're looking for \u2014 industry, deal size, location, role \u2014 and I'll find them. Try: \"SaaS founders with $50K+ deals\"",
    timestamp: 'Now',
  }]);
  const [aiFilters, setAiFilters] = useState(null);
  const [aiUnderstood, setAiUnderstood] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages]);

  // AI Submit
  const handleAISubmit = useCallback(async (promptText) => {
    const text = promptText || aiPrompt;
    if (!text.trim()) return;
    setAiMessages(prev => [...prev, { role: 'user', content: text }]);
    setAiPrompt('');
    setIsAiThinking(true);

    const { filters, understood } = parseAIPrompt(text);
    setAiFilters(filters);
    setAiUnderstood(understood);
    if (filters.search) setSearch(filters.search);
    if (filters.status) setFilterStatus(filters.status);
    if (filters.priority) setFilterPriority(filters.priority);
    if (filters.sort) setSortField(filters.sort === 'dealValue' ? 'dealValue' : filters.sort);
    if (filters.order) setSortDirection(filters.order);

    const store = useStore.getState();
    const all = store.getActiveLeads();
    let matchCount = 0, pipeline = 0, totalScore = 0;
    const topLeads = [];
    for (const l of all) {
      if (filters.industry && l.industry !== filters.industry) continue;
      if (filters.status && l.status !== filters.status) continue;
      if (filters.priority && l.priority !== filters.priority) continue;
      if (filters.minScore && l.score < filters.minScore) continue;
      if (filters.maxScore < 100 && l.score > filters.maxScore) continue;
      if (filters.minDeal && l.dealValue < filters.minDeal) continue;
      if (filters.maxDeal < Infinity && l.dealValue > filters.maxDeal) continue;
      if (filters.location && !l.location?.toLowerCase().includes(filters.location.toLowerCase())) continue;
      if (filters.title && !l.title?.toLowerCase().includes(filters.title.toLowerCase())) continue;
      if (filters.momentum && l.momentum !== filters.momentum) continue;
      if (filters.source && !l.lead_source?.toLowerCase().includes(filters.source.toLowerCase())) continue;
      if (filters.search && !(l.name.toLowerCase().includes(filters.search.toLowerCase()) || l.company.toLowerCase().includes(filters.search.toLowerCase()) || l.industry.toLowerCase().includes(filters.search.toLowerCase()) || l.title?.toLowerCase().includes(filters.search.toLowerCase()) || l.location?.toLowerCase().includes(filters.search.toLowerCase()))) continue;
      matchCount++;
      pipeline += l.dealValue || 0;
      totalScore += l.score;
      if (topLeads.length < 5) topLeads.push({ name: l.name, company: l.company, score: l.score, dealValue: l.dealValue, status: l.status, industry: l.industry });
    }
    const avgScore = matchCount > 0 ? Math.round(totalScore / matchCount) : 0;
    const commission = Math.round(pipeline * 0.13);
    const quickMsg = understood.length > 0
      ? `Found ${matchCount.toLocaleString()} leads matching your criteria. Total pipeline: ${fmt(pipeline)} (${fmt(commission)} commission potential). Average score: ${avgScore}/100.${matchCount > 0 && topLeads.length > 0 ? ` Top match: ${topLeads[0].name} at ${topLeads[0].company} (${topLeads[0].score}/100, ${fmt(topLeads[0].dealValue)}).` : ''}`
      : matchCount > 0 ? `Found ${matchCount.toLocaleString()} results for "${text}". Try being more specific — mention an industry, role, location, or deal size.` : `No results for "${text}". Try: "SaaS founders in Austin" or "healthcare leads above $20K".`;
    setAiMessages(prev => [...prev, { role: 'assistant', content: quickMsg, understood, leadCount: matchCount }]);
    setLeadsPage(0);
    setVisibleCount(50);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'leads', context: { matchCount, pipeline: fmt(pipeline), avgScore, filters: understood.join(', ') || text, topLeads: topLeads.sort((a, b) => b.score - a.score) }, messages: [{ role: 'user', content: text }] }),
      });
      const data = await res.json();
      if (!data.fallback && data.content) {
        setAiMessages(prev => [...prev, { role: 'assistant', content: data.content, isAI: true }]);
      }
    } catch {} finally { setIsAiThinking(false); }
  }, [aiPrompt, setSearch, setFilterStatus, setFilterPriority, setSortField, setSortDirection, setLeadsPage]);

  const clearAIFilters = useCallback(() => {
    setAiFilters(null); setAiUnderstood([]); setSearch(''); setFilterPriority('all'); setFilterStatus('all'); setLeadsPage(0); setVisibleCount(50);
    showToast('Filters cleared');
  }, [setSearch, setFilterPriority, setFilterStatus, setLeadsPage, showToast]);

  // Deep-link: TrendsPage hotspot / NotchBar / Cmd+K can prefill a search, we consume once on mount
  const leadsSearchPrefill = useStore(s => s.leadsSearchPrefill);
  const setLeadsSearchPrefill = useStore(s => s.setLeadsSearchPrefill);
  useEffect(() => {
    if (!leadsSearchPrefill) return;
    setAiChatOpen(true);
    handleAISubmit(leadsSearchPrefill);
    setLeadsSearchPrefill(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadsSearchPrefill]);

  // Filtered + sorted leads
  const allFilteredLeads = useMemo(() => {
    const searchLower = search.toLowerCase();
    let filtered = [...activeLeads];

    filtered = filtered.filter(l => {
      const matchSearch = !search || l.name.toLowerCase().includes(searchLower) || l.company.toLowerCase().includes(searchLower) || l.industry.toLowerCase().includes(searchLower);
      const matchPriority = filterPriority === 'all' || l.priority === filterPriority;
      const matchStatus = filterStatus === 'all' || l.status === filterStatus;
      const matchCity = !selectedCities.length || selectedCities.includes(cityOf(l));
      return matchSearch && matchPriority && matchStatus && matchCity;
    });

    if (aiFilters) {
      filtered = filtered.filter(l => {
        if (aiFilters.industry && l.industry !== aiFilters.industry) return false;
        if (aiFilters.minScore && l.score < aiFilters.minScore) return false;
        if (aiFilters.minDeal && l.dealValue < aiFilters.minDeal) return false;
        if (aiFilters.maxDeal < Infinity && l.dealValue > aiFilters.maxDeal) return false;
        if (aiFilters.location && !l.location?.toLowerCase().includes(aiFilters.location.toLowerCase())) return false;
        if (aiFilters.title && !l.title?.toLowerCase().includes(aiFilters.title.toLowerCase())) return false;
        if (aiFilters.momentum && l.momentum !== aiFilters.momentum) return false;
        if (aiFilters.source && !l.lead_source?.toLowerCase().includes(aiFilters.source.toLowerCase())) return false;
        return true;
      });
    }

    // Sort by close probability * deal value (money-first ordering)
    filtered.sort((a, b) => {
      const sf = aiFilters?.sort || sortField;
      const dir = (aiFilters?.order || sortDirection) === 'asc' ? 1 : -1;
      // `deposit` isn't a field on the lead — it's derived from the gaps the
      // record shows, so the column has to compute it to sort by what's
      // actually on screen.
      const pick = (l) => sf === 'deposit' ? buildPackage(l).deposit : l[sf];
      const aVal = pick(a); const bVal = pick(b);
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
      return String(aVal || '').localeCompare(String(bVal || '')) * dir;
    });

    return filtered;
  }, [activeLeads, search, filterPriority, filterStatus, aiFilters, sortField, sortDirection, selectedCities]);

  const filteredLeads = useMemo(() => allFilteredLeads.slice(0, visibleCount), [allFilteredLeads, visibleCount]);
  const totalFiltered = allFilteredLeads.length;
  const leads = filteredLeads;
  const hasMore = visibleCount < totalFiltered;

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore) {
          setVisibleCount(prev => Math.min(prev + 50, totalFiltered));
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, totalFiltered]);

  // Pipeline stats
  const stats = useMemo(() => {
    const total = activeLeads.length;
    const pipeline = activeLeads.reduce((s, l) => s + (l.dealValue || 0), 0);
    const commission = Math.round(pipeline * 0.13);
    const negotiating = activeLeads.filter(l => l.status === 'negotiation').length;
    const hot = activeLeads.filter(l => l.score >= 80).length;
    return { total, pipeline, commission, negotiating, hot };
  }, [activeLeads]);

  // Handlers
  const handleSort = useCallback((field) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection(field === 'name' || field === 'company' ? 'asc' : 'desc'); }
    setVisibleCount(50);
  }, [sortField, sortDirection, setSortField, setSortDirection]);

  const handleCallClick = useCallback((lead, phone) => { setCallLead(lead); setCallPhone(phone || ''); }, []);

  const toggleRow = useCallback((id) => {
    setExpandedRows(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, []);

  // Bulk select/action menu removed — leads are single-click to open detail

  const handleSelectLead = useCallback((lead) => { if (onSelect) onSelect(lead); }, [onSelect]);

  return (
    <div
      className={`p-4 sm:p-6 max-w-[1600px] mx-auto ${degenMode ? 'leads-degen' : 'leads-chill'}`}
      data-degen={degenMode ? 'true' : 'false'}
      style={degenMode ? {
        // Subtle accent wash so degen tone bleeds onto the page (not just header)
        backgroundImage: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(249,115,22,0.04), transparent 70%)',
      } : undefined}
    >
      <Toast message={toastMsg} visible={toastVisible} onDone={() => setToastVisible(false)} />

      {/* Modals */}
      {callLead && <CallModal lead={callLead} phone={callPhone} onClose={() => setCallLead(null)} showToast={showToast} />}

      {/* First load, nothing stored yet. Previously this rendered the synthetic
          pool under a "Sample data" banner, so a new user's first impression
          was a screen of companies that do not exist, for the three or four
          seconds the real fetch takes. A skeleton says the same thing without
          putting invented businesses in front of them. */}
      {isLoadingLeads && !isLive && (
        <div className="mb-4">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-emerald-500/[0.06] border-emerald-500/20 mb-4">
            <RefreshCw size={16} className="text-emerald-400 animate-spin flex-shrink-0" />
            <span className="text-sm text-emerald-200/90">
              Finding local businesses{market ? ` in ${market}` : ' near you'}…
            </span>
          </div>
          <div className="rounded-2xl border border-white/[0.04] overflow-hidden divide-y divide-white/[0.03]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-3 animate-pulse" style={{ opacity: 1 - i * 0.13 }}>
                <div className="w-10 h-10 rounded-full bg-white/[0.05] shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-3 rounded bg-white/[0.05]" style={{ width: `${55 - i * 4}%` }} />
                  <div className="h-2.5 rounded bg-white/[0.03]" style={{ width: `${38 - i * 3}%` }} />
                </div>
                <div className="w-14 h-8 rounded-lg bg-white/[0.04] shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Data provenance banner — reflects the ACTUAL source in use ── */}
      {isLoadingLeads && !isLive ? null : isLive ? (
        <div className="mb-4 px-4 py-2.5 rounded-xl flex items-center gap-3 border bg-emerald-500/10 border-emerald-500/25">
          <Radio size={16} className="text-emerald-400 flex-shrink-0" />
          <span className="text-sm text-emerald-200/90">
            <span className="font-semibold">Live data</span>
            {(market || resolvedMarket) && <> &mdash; <span className="font-semibold text-white">{market || resolvedMarket}</span></>}
            {' '}&mdash; real local businesses from Google Maps. Names, addresses, phone numbers and
            review counts are theirs; revenue is estimated from review volume and shown as a range.
            {/* IP geolocation is approximate, and on a mobile network it often
                resolves to the carrier's gateway rather than the handset — a
                Houston phone can come back as Philadelphia. Say which city we
                used and how to change it, rather than leaving the operator to
                work it out from the addresses. */}
            {!market && resolvedMarket && (
              <span className="text-emerald-200/60"> Not your area? Pick or search a city in the filter bar.</span>
            )}
          </span>
        </div>
      ) : (
        <div className={`mb-4 px-4 py-2.5 rounded-xl flex items-center gap-3 border ${degenMode ? 'bg-orange-500/10 border-orange-500/25' : 'bg-amber-500/10 border-amber-500/20'}`}>
          <AlertTriangle size={16} className={degenMode ? 'text-orange-400 flex-shrink-0' : 'text-amber-400 flex-shrink-0'} />
          <span className={`text-sm ${degenMode ? 'text-orange-200/90' : 'text-amber-300/90'}`}>
            <span className="font-semibold">Sample data &mdash; not real companies.</span>{' '}
            {isLoadingLeads
              ? 'Loading live results…'
              : leadsError
                ? `Live lookup failed (${leadsError}). Every name, number and dollar figure below is generated.`
                : 'Every name, number and dollar figure below is generated. Search a vertical to pull live companies.'}
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            {degenMode ? <><Flame size={24} className="text-orange-400" /> DEGEN Closer</> : <><Target size={24} className="text-brand" /> Closing Pipeline</>}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {/* Commission dropped here too — payouts aren't wired, so the
                header was advertising a split we have no way to pay. */}
            {(totalFiltered + noWebsiteLeads.length).toLocaleString()} leads {aiFilters || selectedCities.length ? '(filtered)' : ''} &middot; Ranked by closability
            {lastAddedLeadCount > 0 && (
              <span className="text-emerald-400"> &middot; {lastAddedLeadCount} new added</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Leads accumulate rather than being replaced, so there has to be a
              way to pull more without reloading the whole page. */}
          <button onClick={() => fetchLiveLeads()} disabled={isLoadingLeads}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border bg-surface-2 border-white/[0.05] text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
            <RefreshCw size={14} className={isLoadingLeads ? 'animate-spin' : ''} />
            {isLoadingLeads ? 'Finding…' : 'Load more'}
          </button>
          <button onClick={() => setAiChatOpen(!aiChatOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${aiChatOpen ? 'bg-brand/15 border-brand/30 text-brand' : 'bg-surface-2 border-white/[0.05] text-slate-400 hover:text-white'}`}>
            <Brain size={14} /> AI Search
          </button>
        </div>
      </div>

      {/* ── Call Now ─────────────────────────────────────────────────────────
          The tables answer "who exists". This answers "who can I actually
          reach in the next ten minutes" — businesses whose published hours say
          they are open at this moment, with a number to dial, best score
          first. Roughly half of any sample is shut at a given time, so this is
          the difference between dialling and leaving voicemails. */}
      {callQueue.length > 0 && (
        <div className="mb-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.03] overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-emerald-500/15">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
              <PhoneCall size={16} className="text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-emerald-400">Call Now</h2>
              <p className="text-[11px] text-slate-500">Open right now · has a number · ranked by closability</p>
            </div>
            <div className="ml-auto shrink-0 text-right">
              <div className="text-sm font-bold text-white">{callQueue.length}</div>
              <div className="text-[9px] text-slate-600 uppercase tracking-wider">open now</div>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04] max-h-[460px] overflow-y-auto">
            {callQueue.map((l) => (
              <div key={l._placeId || l.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleSelectLead(l)}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{l.company}</span>
                      {!l.website && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 shrink-0">
                          NO SITE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {l.industry}{l.location ? ` · ${l.location}` : ''}
                      {l.revenueFormatted ? ` · est. ${l.revenueFormatted}` : ''}
                    </div>
                    {l.receptionist?.qualified && (
                      <div className="text-[10px] text-emerald-400 mt-0.5">
                        Unreachable {l.receptionist.uncoveredHoursPerWeek}h a week — open on that
                      </div>
                    )}
                  </div>
                  <a href={`tel:${(l.phone || '').replace(/[^+\d]/g, '')}`}
                    className="shrink-0 flex items-center gap-1.5 px-3 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 active:bg-emerald-500/30">
                    <PhoneCall size={14} />
                    <span className="hidden sm:inline font-mono">{l.phone}</span>
                    <span className="sm:hidden">Call</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── No website: the strongest pitch we have ──────────────────────────
          These used to sit scattered through the main table a few rows apart,
          which buried them. A business with no website is the one call where
          we sell the build and the phone cover together, so it gets its own
          list, populated from the same fetch as the main one. */}
      {noWebsiteLeads.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-500/25 bg-amber-500/[0.03] overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-amber-500/15">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <Globe size={16} className="text-amber-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-amber-400">No Website — Highest Intent</h2>
              <p className="text-[11px] text-slate-500">
                Invisible outside Maps. Sell the build plus the receptionist: {fmt(4000)} deposit + {fmt(1000)}/mo
              </p>
            </div>
            <span className="ml-auto shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
              {noWebsiteLeads.length}
            </span>
          </div>
          <div className="divide-y divide-white/[0.04] max-h-[420px] overflow-y-auto">
            {noWebsiteLeads.map((l) => {
              const act = l.activity || {};
              const live = act.level === 'active';
              return (
                <button key={l.id} onClick={() => { setSelectedLead(l); setDetailOpen(true); }}
                  className="w-full text-left px-4 py-3 hover:bg-white/[0.03] transition-colors flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{l.company}</span>
                      {act.label && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 ${
                          live ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                               : 'bg-white/[0.03] text-slate-400 border-white/[0.06]'}`}>
                          {act.label}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {l.location || 'Location unknown'}
                      {l.reviewCount != null && ` · ${l.reviewCount} reviews`}
                      {l.revenueFormatted && ` · est. ${l.revenueFormatted}`}
                    </div>
                  </div>
                  {l.phone && (
                    <span className="hidden sm:block text-[11px] font-mono text-slate-400 shrink-0">{l.phone}</span>
                  )}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-amber-400">{l.score}</div>
                    <div className="text-[9px] text-slate-600 uppercase tracking-wider">score</div>
                  </div>
                  <ChevronRight size={14} className="text-slate-600 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Pipeline Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><DollarSign size={14} /> Pipeline Value</div>
          <div className="text-xl font-bold text-white">{fmt(stats.pipeline)}</div>
        </div>
        {/* Commission tile replaced — payouts aren't wired, and the count of
            businesses with no website is the number worth acting on. */}
        <div className="bg-surface-3 rounded-xl p-4 border border-amber-500/15">
          <div className="flex items-center gap-2 text-amber-400 text-xs mb-1"><Globe size={14} /> No Website</div>
          <div className="text-xl font-bold text-amber-400">{noWebsiteLeads.length.toLocaleString()}</div>
        </div>
        <div className="bg-surface-3 rounded-xl p-4 border border-amber-500/10">
          <div className="flex items-center gap-2 text-amber-400 text-xs mb-1"><Target size={14} /> Negotiating</div>
          <div className="text-xl font-bold text-amber-400">{stats.negotiating.toLocaleString()}</div>
        </div>
        <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Flame size={14} className="text-red-400" /> Hot Leads (80+)</div>
          <div className="text-xl font-bold text-white">{stats.hot.toLocaleString()}</div>
        </div>
      </div>

      {/* ── AI Chat Panel ── */}
      {aiChatOpen && (
        <div className="mb-5 bg-surface-3 rounded-2xl border border-white/[0.03] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.03] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand/30 to-purple-500/30 flex items-center justify-center">
                <Bot size={14} className="text-brand" />
              </div>
              <span className="text-sm font-medium">GOATED AI Lead Finder</span>
            </div>
            <div className="flex items-center gap-2">
              {aiFilters && <button onClick={clearAIFilters} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20"><X size={12} /> Clear</button>}
              <button onClick={() => setAiChatOpen(false)} className="p-1 text-slate-500 hover:text-white"><X size={14} /></button>
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto px-4 py-3 space-y-1">
            {aiMessages.map((msg, i) => <AIChatMessage key={i} {...msg} />)}
            {isAiThinking && <div className="flex items-center gap-2 text-sm text-slate-500 pl-8"><Loader2 size={14} className="animate-spin text-brand" /> Analyzing...</div>}
            <div ref={chatEndRef} />
          </div>
          <div className="px-4 py-2 border-t border-white/[0.03] flex gap-2 overflow-x-auto scrollbar-hide">
            {PRESET_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => handleAISubmit(p.prompt)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-white/[0.03] text-xs text-slate-400 hover:text-brand hover:border-brand/20 transition-colors">
                <p.icon size={12} /> {p.label}
              </button>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-white/[0.03] flex gap-2">
            <div className="flex-1 relative">
              <Wand2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand/50" />
              <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAISubmit(); } }}
                placeholder="Describe leads you want... e.g. 'SaaS CEOs in NYC $50K+'"
                className="w-full pl-9 pr-4 py-2.5 bg-surface-1 border border-white/[0.05] rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-brand/40" />
            </div>
            <button onClick={() => handleAISubmit()} disabled={!aiPrompt.trim() || isAiThinking}
              className="px-4 py-2.5 rounded-xl bg-brand text-black font-medium text-sm disabled:opacity-50"><Send size={14} /></button>
          </div>
        </div>
      )}

      {/* ── Active Filters ── */}
      {aiFilters && aiUnderstood.length > 0 && (
        <div className="bg-brand/5 border border-brand/15 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Brain size={14} className="text-brand" />
            {aiUnderstood.map((u, i) => <span key={i} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand/10 text-brand/80 border border-brand/20">{u}</span>)}
          </div>
          <button onClick={clearAIFilters} className="text-xs text-slate-500 hover:text-white flex items-center gap-1"><X size={12} /> Clear</button>
        </div>
      )}

      {/* ── Filters Bar ── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setVisibleCount(50); }}
            placeholder="Search leads..."
            className="w-full pl-9 pr-4 py-2 bg-surface-2 border border-white/[0.05] rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-brand/40" />
        </div>
        <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setLeadsPage(0); setVisibleCount(50); }}
          className="px-3 py-2 bg-surface-2 border border-white/[0.05] rounded-lg text-xs text-white outline-none">
          <option value="all">All Priorities</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setLeadsPage(0); setVisibleCount(50); }}
          className="px-3 py-2 bg-surface-2 border border-white/[0.05] rounded-lg text-xs text-white outline-none">
          <option value="all">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* Ticking filters the table straight away; "Load these cities" goes
            and fetches more of those markets, which is the slower action and
            so is explicit rather than firing on every checkbox. */}
        <CityFilter
          options={availableCities}
          selected={selectedCities}
          onToggle={(city) => { toggleCity(city); setVisibleCount(50); }}
          onClear={() => { setSelectedCities([]); setVisibleCount(50); }}
          onApply={(cities) => fetchLeadsForCities(cities)}
          onSearchNew={(city) => { setMarket(city); fetchLeadsForCities([city]); setVisibleCount(50); }}
        />
      </div>

      {/* ── Lead Table ── */}
      <div className="bg-surface-3 rounded-xl border border-white/[0.03] overflow-hidden">
        {/* ── Mobile: cards, not a table ────────────────────────────────────
            The table below carries eight columns. At 375px that becomes a
            sideways scroll where nothing useful is visible without dragging,
            so on small screens the same rows render as cards instead: the
            fields that decide whether to call, and a call button that works
            with a thumb. */}
        <div className="md:hidden divide-y divide-white/[0.03]">
          {leads.map((l, i) => {
            const prob = getCloseProbability(l, i);
            const pkg = buildPackage(l);
            const act = l.activity || {};
            const isHot = l.score >= 85;
            return (
              <div key={l.id} onClick={() => handleSelectLead(l)}
                className="p-4 active:bg-white/[0.04] transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isHot ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-brand/15 text-brand'}`}>
                    {(l.company || l.name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-white">{l.company}</span>
                      {isHot && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                          <Flame size={8} className="inline" /> HOT
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {l.industry}{l.location ? ` · ${l.location}` : ''}
                    </div>
                    {act.label && (
                      <div className={`text-[10px] mt-1 ${act.level === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {act.label}{l.revenueFormatted ? ` · est. ${l.revenueFormatted}` : ''}
                      </div>
                    )}
                    {l.receptionist?.qualified && (
                      <div className="text-[10px] mt-0.5 text-emerald-400">
                        {l.receptionist.uncoveredHoursPerWeek}h/week nobody answers
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-lg font-bold ${isHot ? 'text-emerald-400' : 'text-brand'}`}>{l.score}</div>
                    <div className="text-[9px] text-slate-600 uppercase tracking-wider">score</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 min-w-0 text-[11px] text-slate-400">
                    <span className="text-white font-semibold">{fmt(pkg.deposit)}</span> + {fmt(pkg.monthly)}/mo
                    <span className="text-slate-600"> · </span>
                    <span className="text-emerald-400">{prob}% close</span>
                  </div>
                  {l.phone && (
                    <a href={`tel:${(l.phone || '').replace(/[^+\d]/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 flex items-center gap-1.5 px-3 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold active:bg-emerald-500/25">
                      <PhoneCall size={14} /> Call
                    </a>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); toggleRow(l.id); }}
                    aria-label="Toggle lead details"
                    className="shrink-0 w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 flex items-center justify-center active:bg-white/[0.06]">
                    {expandedRows.has(l.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
          {leads.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">No leads match the current filters.</div>
          )}
        </div>

        <div className="overflow-x-auto hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.03]">
                <SortHeader field="name" label="Lead" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortHeader field="company" label="Company" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortHeader field="score" label="Score" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortHeader field="deposit" label="Deposit" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <th className="px-3 py-3 text-left text-xs text-emerald-400 font-medium uppercase tracking-wider">Close %</th>
                <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l, i) => {
                const isExpanded = expandedRows.has(l.id);
                const prob = getCloseProbability(l, i);
                const dv = l.dealValue || 0;
                const pkg = buildPackage(l);
                const isHot = l.score >= 85;
                return (
                  <React.Fragment key={l.id}>
                    <tr onClick={() => handleSelectLead(l)}
                      className={`border-b border-white/[0.02] cursor-pointer hover:bg-white/[0.02] transition-colors ${isExpanded ? 'bg-brand/[0.03]' : ''}`}>

                      {/* Lead */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isHot ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-brand/15 text-brand'}`}>
                            {initialsOf(l.company || l.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-sm truncate">{l.name}</span>
                              {isHot && <span className="px-1 py-0 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"><Flame size={8} className="inline" /> HOT</span>}
                            </div>
                            {/* The receptionist verdict was computed for every
                                lead but only visible after opening one. It is
                                the difference between a call worth making and
                                one that opens with a claim they can disprove,
                                so it belongs in the scan. */}
                            <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                              {l.receptionist?.qualified ? (
                                <span className="text-emerald-400/90 shrink-0">
                                  {l.receptionist.uncoveredHoursPerWeek}h unreachable
                                </span>
                              ) : l.receptionist?.label === 'Listed as open 24/7' ? (
                                <span className="text-slate-600 shrink-0">24/7 — no phone gap</span>
                              ) : (
                                <span className="truncate">{l.title || l.industry}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="px-3 py-2.5">
                        <div className="text-sm text-white">{l.company}</div>
                        <div className="text-[10px] text-slate-500">{l.industry}</div>
                      </td>

                      {/* Score */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${scoreBarColor(l.score)}`} style={{ width: `${l.score}%` }} />
                          </div>
                          <span className={`font-bold text-xs tabular-nums ${scoreColor(l.score)}`}>{l.score}</span>
                        </div>
                      </td>

                      {/* Price — deposit up front, retainer per month. */}
                      <td className="px-3 py-2.5">
                        <div className="font-mono text-sm text-white">{fmt(pkg.deposit)}</div>
                        <div className="text-[10px] text-slate-500">+ {fmt(pkg.monthly)}/mo</div>
                      </td>

                      {/* Close % */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${closeProbBg(prob)}`} style={{ width: `${prob}%` }} />
                          </div>
                          <span className={`font-bold text-xs ${closeProbColor(prob)}`}>{prob}%</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[l.status] || 'bg-slate-500/15 text-slate-400'}`}>{l.status}</span>
                      </td>


                    </tr>
                    {isExpanded && <CloseCoachRow lead={l} index={i} colSpan={6} onCallClick={handleCallClick} showToast={showToast} />}
                  </React.Fragment>
                );
              })}
              {leads.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-sm">
                  {aiFilters ? 'No leads match your AI query. Try different criteria.' : 'No leads match your filters.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Infinite scroll sentinel + status */}
        <div className="px-4 py-3 border-t border-white/[0.03] flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {/* Counts what is actually on screen. The no-website leads live in
                their own section and are not in this table, so they are named
                separately rather than silently missing from the total. */}
            Showing {leads.length.toLocaleString()} of {totalFiltered.toLocaleString()}
            {selectedCities.length > 0 && <span className="text-slate-600"> in {selectedCities.length === 1 ? selectedCities[0] : `${selectedCities.length} cities`}</span>}
            {noWebsiteLeads.length > 0 && (
              <span className="text-slate-600"> · {noWebsiteLeads.length} more with no website</span>
            )}
          </span>
          {hasMore && (
            <span className="text-xs text-slate-600">Scroll for more</span>
          )}
        </div>
        {/* Sentinel for IntersectionObserver */}
        <div ref={sentinelRef} className="h-1" />
      </div>
    </div>
  );
}
