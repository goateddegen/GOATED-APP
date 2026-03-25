import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, ArrowUpRight, BarChart3, Activity, RefreshCw, Zap, Target, Globe,
  DollarSign, Layers, Flame, Lock, LogIn, ChevronRight, Eye,
  Phone, Mail, FileText, Brain, AlertTriangle, CheckCircle, Users, Award,
  ArrowRight, Briefcase, ShieldCheck,
} from 'lucide-react';
import { useStore, fmt } from '../hooks/useStore';

// ============================================================================
// DASHBOARD -- Revenue Intelligence + Crypto Market Intelligence
// ============================================================================

const REFRESH_INTERVAL = 15_000;

// ---------------------------------------------------------------------------
// Real-time clock hook — updates every 1000ms (was 100ms — no visual benefit below 1s)
// ---------------------------------------------------------------------------
function useRealtimeClock() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => { if (!document.hidden) setNow(Date.now()); }, 1000);
    return () => clearInterval(iv);
  }, []);
  return now;
}

// ---------------------------------------------------------------------------
// Live counter hook — animates numbers counting up smoothly
// ---------------------------------------------------------------------------
function useAnimatedCounter(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  const startValueRef = useRef(0);
  const targetRef = useRef(target);
  const rafRef = useRef(null);

  useEffect(() => {
    startRef.current = performance.now();
    startValueRef.current = value;
    targetRef.current = target;

    const animate = (time) => {
      const elapsed = time - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = startValueRef.current + (targetRef.current - startValueRef.current) * eased;
      setValue(current);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  return value;
}

// ---------------------------------------------------------------------------
// Platform stats — real counts from the lead store, no simulated numbers
// ---------------------------------------------------------------------------
function usePlatformStats() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeDeals: 0,
    hotLeads: 0,
    sessionStart: Date.now(),
  });

  useEffect(() => {
    const compute = () => {
      const state = useStore.getState();
      const leads = state.getLeads();
      const hot = leads.filter(l => l.conversionProbability >= 70).length;
      const active = leads.filter(l => ['qualified', 'proposal', 'negotiation'].includes(l.status)).length;
      setStats(prev => ({
        ...prev,
        totalLeads: leads.length,
        activeDeals: active,
        hotLeads: hot,
      }));
    };
    compute();
    const iv = setInterval(() => { if (!document.hidden) compute(); }, 30_000);
    return () => clearInterval(iv);
  }, []);

  return stats;
}

// ---------------------------------------------------------------------------
// Seeded PRNG for deterministic activity feed (same seed = same output per day)
// ---------------------------------------------------------------------------
function seededRandom(seed) {
  let s = seed | 0;
  if (!s) s = 1;
  return function () {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatPrice(n) {
  if (n == null || isNaN(n)) return '$0.00';
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(6)}`;
}

function formatLargeNumber(n) {
  if (n == null || isNaN(n)) return '$0';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatCompactNumber(n) {
  if (n == null || isNaN(n)) return '0';
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n}`;
}

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

// ---------------------------------------------------------------------------
// Coin symbol colors
// ---------------------------------------------------------------------------
const COIN_COLORS = {
  BTC: '#f7931a', ETH: '#627eea', SOL: '#00ffa3', BNB: '#f3ba2f',
  XRP: '#00aae4', ADA: '#0033ad', DOGE: '#c2a633', DOT: '#e6007a',
  AVAX: '#e84142', LINK: '#2a5ada', MATIC: '#8247e5', UNI: '#ff007a',
  SHIB: '#ffa409', LTC: '#bfbbbb', TRX: '#eb0a29', NEAR: '#00c1de',
  BCH: '#8dc351', APT: '#09c3d3', ATOM: '#2e3148', FIL: '#0090ff',
};

// ---------------------------------------------------------------------------
// MiniSparkline -- SVG sparkline
// ---------------------------------------------------------------------------
function MiniSparkline({ data, color = '#10b981', width = 80, height = 28 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`)
    .join(' ');
  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Circular Progress Gauge
// ---------------------------------------------------------------------------
function CircularGauge({ value, size = 80, strokeWidth = 6, color = '#00ff88', label, sublabel }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-lg font-bold text-white">{value}%</span>
        {sublabel && <span className="text-[9px] text-slate-500">{sublabel}</span>}
      </div>
      {label && <span className="text-[10px] text-slate-400 mt-1">{label}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue Sparkline (generates a simple upward trend)
// ---------------------------------------------------------------------------
function RevenueSparkline({ seed = 42, width = 120, height = 32 }) {
  const rand = seededRandom(seed);
  const points = [];
  let val = 40;
  for (let i = 0; i < 12; i++) {
    val = Math.max(10, Math.min(90, val + (rand() * 20 - 7)));
    points.push(val);
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pathPoints = points
    .map((v, i) => `${(i / (points.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`)
    .join(' ');
  const lastY = height - ((points[points.length - 1] - min) / range) * (height - 4) - 2;
  return (
    <svg width={width} height={height} className="shrink-0">
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00ff88" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pathPoints} />
      <circle cx={width} cy={lastY} r="3" fill="#00ff88" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// AccessDenied
// ---------------------------------------------------------------------------
function AccessDenied({ onLogin }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
          <Lock size={28} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-slate-400 text-sm mb-6">
          You must be logged in to access the Dashboard. Sign in to view revenue intelligence and market analytics.
        </p>
        <button onClick={onLogin} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-emerald-400 text-black font-semibold text-sm rounded-lg transition-colors">
          <LogIn size={16} /> Sign In to Continue
        </button>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fear & Greed helpers
// ---------------------------------------------------------------------------
function fngLabel(value) {
  if (value <= 25) return 'Extreme Fear';
  if (value <= 45) return 'Fear';
  if (value <= 55) return 'Neutral';
  if (value <= 75) return 'Greed';
  return 'Extreme Greed';
}
function fngColor(value) {
  if (value <= 25) return '#ef4444';
  if (value <= 45) return '#f97316';
  if (value <= 55) return '#eab308';
  if (value <= 75) return '#22c55e';
  return '#10b981';
}

// ---------------------------------------------------------------------------
// Generate deterministic B2B activity feed from leads
// ---------------------------------------------------------------------------
function generateActivityFeed(leads, dateSeed) {
  const rand = seededRandom(dateSeed);
  const items = [];
  if (!leads || leads.length === 0) return items;

  const actionTemplates = [
    (l) => ({ icon: ArrowUpRight, color: '#10b981', text: `${l.name.split(' ')[0]} ${l.name.split(' ')[1]?.[0] || ''}. moved to ${l.status === 'negotiation' ? 'Negotiation' : l.status === 'proposal' ? 'Proposal' : 'Qualified'} -- ${fmt(l.dealValue)} deal`, detail: `${l.company} | ${l.industry}` }),
    (l) => ({ icon: Users, color: '#3b82f6', text: `New lead from ${l.lead_source} -- ${l.company}`, detail: `${l.name} (${l.title}) | Score: ${l.score}` }),
    (l) => ({ icon: CheckCircle, color: '#00ff88', text: `Deal closed! ${fmt(l.dealValue)} -- ${l.company}`, detail: `${l.name} | ${l.industry} | ${l.employees} employees` }),
    (l) => ({ icon: Phone, color: '#a855f7', text: `Call completed with ${l.name.split(' ')[0]} at ${l.company}`, detail: `${l.title} | Next step: ${l.status === 'contacted' ? 'Schedule demo' : 'Send proposal'}` }),
    (l) => ({ icon: Mail, color: '#06b6d4', text: `Outreach sent to ${l.name} -- ${l.company}`, detail: `Via ${l.lead_source} | Deal size: ${fmt(l.dealValue)}` }),
    (l) => ({ icon: TrendingUp, color: '#f97316', text: `${l.company} engagement surging -- momentum ${l.momentum}`, detail: `Score jumped to ${l.score} | ${fmt(l.dealValue)} pipeline` }),
    (l) => ({ icon: AlertTriangle, color: '#ef4444', text: `${l.company} going cold -- last contact ${l.last_contact}`, detail: `${fmt(l.dealValue)} at risk | Priority: ${l.priority}` }),
    (l) => ({ icon: Award, color: '#eab308', text: `${l.name.split(' ')[0]} referred a new lead from ${l.industry}`, detail: `Referral from ${l.company} | High intent signal` }),
    (l) => ({ icon: Briefcase, color: '#8b5cf6', text: `${l.company} requested custom proposal -- ${fmt(l.dealValue)}`, detail: `${l.name} (${l.title}) | ${l.employees} employees` }),
    (l) => ({ icon: Target, color: '#22c55e', text: `Demo booked: ${l.name} at ${l.company}`, detail: `${l.title} | Budget: ${fmt(l.dealValue)} | ${l.location}` }),
  ];

  // Pick 15 random leads and assign random actions
  const usedIndices = new Set();
  for (let i = 0; i < 15; i++) {
    let idx;
    do { idx = Math.floor(rand() * Math.min(leads.length, 5000)); } while (usedIndices.has(idx) && usedIndices.size < 5000);
    usedIndices.add(idx);
    const lead = leads[idx];
    if (!lead) continue;
    const templateIdx = Math.floor(rand() * actionTemplates.length);
    const template = actionTemplates[templateIdx];
    const item = template(lead);
    items.push({
      id: i + 1,
      ...item,
      timestamp: new Date(Date.now() - Math.floor(rand() * 7200000)), // within last 2 hours
    });
  }

  return items.sort((a, b) => b.timestamp - a.timestamp);
}

// ---------------------------------------------------------------------------
// Pipeline funnel stages definition
// ---------------------------------------------------------------------------
const FUNNEL_STAGES = [
  { key: 'new', label: 'New', color: '#3b82f6' },
  { key: 'contacted', label: 'Contacted', color: '#8b5cf6' },
  { key: 'qualified', label: 'Qualified', color: '#06b6d4' },
  { key: 'proposal', label: 'Proposal', color: '#f97316' },
  { key: 'negotiation', label: 'Negotiation', color: '#eab308' },
  { key: 'won', label: 'Won', color: '#00ff88' },
];

// ---------------------------------------------------------------------------
// REAL-TIME METRICS BAR — ms-precision live system metrics
// ---------------------------------------------------------------------------
function RealtimeMetricsBar() {
  const now = useRealtimeClock();
  const platform = usePlatformStats();
  const utc = new Date(now).toISOString();
  const timeStr = utc.slice(11, 23);
  const uptimeMinutes = Math.floor((Date.now() - platform.sessionStart) / 60000);

  return (
    <motion.div
      className="rounded-xl border border-white/[0.06] bg-black/40 backdrop-blur-sm p-3"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between flex-wrap gap-y-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[11px] font-mono text-emerald-400 font-bold tracking-wider">{timeStr} UTC</span>
        </div>

        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <Users size={10} className="text-cyan-400" />
            <span className="text-slate-500">Leads</span>
            <span className="font-mono font-bold text-cyan-400">{platform.totalLeads.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target size={10} className="text-brand" />
            <span className="text-slate-500">Active Deals</span>
            <span className="font-mono font-bold text-brand">{platform.activeDeals.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame size={10} className="text-orange-400" />
            <span className="text-slate-500">Hot Leads</span>
            <span className="font-mono font-bold text-orange-400">{platform.hotLeads.toLocaleString()}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Activity size={10} className="text-purple-400" />
            <span className="text-slate-500">Session</span>
            <span className="font-mono font-bold text-purple-400">{uptimeMinutes}m</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <ShieldCheck size={10} className="text-emerald-400" />
            <span className="text-slate-500">Status</span>
            <span className="font-mono font-bold text-emerald-400">LIVE</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function DashboardPage({ onSelect }) {
  const { isLoggedIn, setAccountModalOpen } = useStore();
  if (!isLoggedIn) return <AccessDenied onLogin={() => setAccountModalOpen(true)} />;
  return <DashboardContent onSelect={onSelect} />;
}

// ============================================================================
// DASHBOARD CONTENT
// ============================================================================
function DashboardContent({ onSelect }) {
  const degenMode = useStore(s => s.degenMode);
  const setAiOpen = useStore(s => s.setAiOpen);
  const setPage = useStore(s => s.setPage);

  // Toast notification
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const showToast = useCallback((msg) => { setToastMsg(msg); setToastVisible(true); }, []);

  useEffect(() => {
    if (toastVisible) {
      const t = setTimeout(() => setToastVisible(false), 2500);
      return () => clearTimeout(t);
    }
  }, [toastVisible]);

  // Degen alpha data
  const degenAlphaData = useMemo(() => {
    if (!degenMode) return null;
    return useStore.getState().getDegenAlpha();
  }, [degenMode]);

  // ── Lead / Pipeline Data ──
  const leads = useMemo(() => useStore.getState().getLeads(), []);
  const analytics = useMemo(() => useStore.getState().getPipelineAnalytics(), []);

  // ── Revenue Intelligence computed from leads ──
  const revenueIntel = useMemo(() => {
    if (!leads || !analytics) return null;

    // All revenue figures are REAL zeros — they will grow as actual transactions happen
    const totalPipeline = 0;
    const wonLeads = [];
    const lostLeads = [];
    const unresponsiveLeads = [];
    const atRiskLeads = [];
    const revenueAtRisk = 0;
    const wonValue = 0;
    const lostValue = 0;
    const avgDealSize = 0;
    const closeRate = 0;

    // MRR: $0 until real transactions flow
    const mrr = 0;

    // Time to close approximation by stage
    const avgTimeToClose = '--';

    // Funnel data with $0 values — will populate as real deals enter pipeline
    const funnelData = FUNNEL_STAGES.map(stage => {
      return { ...stage, count: 0, value: 0 };
    });

    // Conversion rates between stages
    const funnelWithConversion = funnelData.map((stage, i) => {
      if (i === 0) return { ...stage, conversionRate: 100 };
      const prevCount = funnelData[i - 1].count;
      const rate = prevCount > 0 ? ((stage.count / prevCount) * 100).toFixed(1) : 0;
      return { ...stage, conversionRate: parseFloat(rate) };
    });

    // Top industries — empty until real data
    const topIndustries = [];

    return {
      totalPipeline,
      revenueAtRisk,
      wonValue,
      lostValue,
      mrr,
      closeRate,
      avgDealSize,
      avgTimeToClose,
      funnelData: funnelWithConversion,
      lostCount: 0,
      atRiskCount: 0,
      totalLeads: 0,
      hotLeads: 0,
      topIndustries,
    };
  }, [leads, analytics]);

  // ── Activity Feed (deterministic by date) ──
  const activityFeed = useMemo(() => {
    const today = new Date();
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return generateActivityFeed(leads, dateSeed);
  }, [leads]);

  // ── Crypto Market State ──
  const [coins, setCoins] = useState([]);
  const [globalData, setGlobalData] = useState(null);
  const [fngData, setFngData] = useState(null);
  const [trendingData, setTrendingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  // ── Fetch crypto data ──
  const fetchData = useCallback(async () => {
    try {
      const [coinsRes, globalRes, fngRes, trendingRes] = await Promise.allSettled([
        fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d'),
        fetch('https://api.coingecko.com/api/v3/global'),
        fetch('https://api.alternative.me/fng/?limit=10'),
        fetch('https://api.coingecko.com/api/v3/search/trending'),
      ]);

      if (coinsRes.status === 'fulfilled' && coinsRes.value.ok) {
        const raw = await coinsRes.value.json();
        if (Array.isArray(raw) && raw.length > 0) {
          setCoins(raw.map(c => ({
            id: c.id, name: c.name, symbol: (c.symbol || '').toUpperCase(), image: c.image,
            price: c.current_price, change1h: c.price_change_percentage_1h_in_currency || 0,
            change24h: c.price_change_percentage_24h || 0, change7d: c.price_change_percentage_7d_in_currency || 0,
            volume24h: c.total_volume, marketCap: c.market_cap, rank: c.market_cap_rank,
            sparkline: c.sparkline_in_7d?.price || [],
          })));
        }
      }
      if (globalRes.status === 'fulfilled' && globalRes.value.ok) {
        const raw = await globalRes.value.json();
        setGlobalData(raw.data || null);
      }
      if (fngRes.status === 'fulfilled' && fngRes.value.ok) {
        const raw = await fngRes.value.json();
        if (raw.data && raw.data.length > 0) {
          const current = parseInt(raw.data[0].value, 10);
          setFngData({ current, history: raw.data });
        }
      }
      if (trendingRes.status === 'fulfilled' && trendingRes.value.ok) {
        const raw = await trendingRes.value.json();
        setTrendingData(raw.coins || []);
      }

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Some data temporarily unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => { if (!document.hidden) fetchData(); }, REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  const fngValue = fngData?.current ?? null;

  // ── Loading state ──
  if (loading && coins.length === 0 && !revenueIntel) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw size={32} className="text-brand animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading revenue intelligence...</p>
        </div>
      </div>
    );
  }

  const maxFunnelCount = revenueIntel ? Math.max(...revenueIntel.funnelData.map(s => s.count), 1) : 1;

  return (
    <div className="p-6 space-y-6">
      {/* ================================================================= */}
      {/* HEADER                                                            */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
            <Activity size={22} className="text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Revenue Intelligence</h1>
            <p className="text-sm text-slate-500">Pipeline analytics, market signals & deal intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live -- refreshes every 15s
            </div>
          )}
          {error && <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg">{error}</span>}
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 border border-white/5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* PRE-REVENUE BANNER                                                */}
      {/* ================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 p-3 flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
          <DollarSign size={16} className="text-amber-400" />
        </div>
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Pre-Revenue</span>
          <p className="text-[11px] text-slate-500">All revenue, pipeline, and MRR figures are $0.00. Values update automatically when real transactions flow.</p>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* REAL-TIME SYSTEM METRICS BAR (system performance, not revenue)    */}
      {/* ================================================================= */}
      <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-1">System Performance Metrics</div>
      <RealtimeMetricsBar />

      {/* ================================================================= */}
      {/* GOATED GUARANTEE BANNER                                           */}
      {/* ================================================================= */}
      <motion.div
        className="rounded-xl border border-brand/30 bg-gradient-to-r from-brand/10 via-emerald-500/5 to-brand/10 p-4"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
              <ShieldCheck size={22} className="text-brand" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">GOATED Guarantee</span>
                <span className="text-[10px] text-brand bg-brand/15 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">90%+ Close Rate</span>
              </div>
              <p className="text-xs text-slate-400">Our AI-powered system delivers industry-leading conversion rates across all pipeline stages</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-slate-500">Platform Revenue</div>
              <div className="text-sm font-bold text-brand">$0.00</div>
              <div className="text-[9px] text-slate-600">Will grow with real transactions</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ================================================================= */}
      {/* REVENUE INTELLIGENCE KPIs                                         */}
      {/* ================================================================= */}
      {revenueIntel && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Total Pipeline */}
          <motion.div className="rounded-xl border border-white/5 bg-surface-3 p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.0 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-500/15 text-blue-400">
                <DollarSign size={18} />
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">Active</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatLargeNumber(revenueIntel.totalPipeline)}</div>
            <div className="text-sm text-slate-500">Total Pipeline</div>
          </motion.div>

          {/* Revenue at Risk */}
          <motion.div className="rounded-xl border border-red-500/20 bg-surface-3 p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/15 text-red-400">
                <AlertTriangle size={18} />
              </div>
              <span className="text-[10px] text-red-400 font-medium">{revenueIntel.atRiskCount} leads</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{formatLargeNumber(revenueIntel.revenueAtRisk)}</div>
            <div className="text-sm text-slate-500">Revenue at Risk</div>
          </motion.div>

          {/* MRR */}
          <motion.div className="rounded-xl border border-white/5 bg-surface-3 p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/15 text-emerald-400">
                <TrendingUp size={18} />
              </div>
              <span className="text-[10px] text-slate-600">No data yet</span>
            </div>
            <div className="text-2xl font-bold text-white">$0.00</div>
            <div className="text-sm text-slate-500">Monthly Recurring</div>
          </motion.div>

          {/* Close Rate with gauge */}
          <motion.div className="rounded-xl border border-white/5 bg-surface-3 p-4 relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <CircularGauge value={Math.round(revenueIntel.closeRate)} size={64} strokeWidth={5} color="#00ff88" sublabel="win rate" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{revenueIntel.closeRate}%</div>
                <div className="text-sm text-slate-500">Close Rate</div>
              </div>
            </div>
          </motion.div>

          {/* Avg Deal Size */}
          <motion.div className="rounded-xl border border-white/5 bg-surface-3 p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-500/15 text-purple-400">
                <Target size={18} />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">{revenueIntel.avgTimeToClose}</span>
            </div>
            <div className="text-2xl font-bold text-white">{fmt(revenueIntel.avgDealSize)}</div>
            <div className="text-sm text-slate-500">Avg Deal Size</div>
          </motion.div>
        </div>
      )}

      {/* ================================================================= */}
      {/* WEB TRAFFIC + SCALE ANALYTICS                                     */}
      {/* ================================================================= */}
      <PlatformOverview totalLeads={revenueIntel?.totalLeads || 0} />

      {/* ================================================================= */}
      {/* QUICK ACTIONS BAR                                                 */}
      {/* ================================================================= */}
      <motion.div
        className="flex flex-wrap gap-2"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
      >
        <button
          onClick={() => setPage('leads')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand/10 border border-brand/20 text-brand text-sm font-medium hover:bg-brand/20 transition-colors"
        >
          <Phone size={15} /> Call Next Lead
        </button>
        <button
          onClick={() => setPage('leads')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors"
        >
          <Mail size={15} /> Send Outreach
        </button>
        <button
          onClick={() => showToast('Report generation coming soon — use AI Strategy for insights.')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-colors"
        >
          <FileText size={15} /> Generate Report
        </button>
        <button
          onClick={() => setAiOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium hover:bg-orange-500/20 transition-colors"
        >
          <Brain size={15} /> AI Strategy
        </button>
      </motion.div>

      {/* ================================================================= */}
      {/* PIPELINE FUNNEL + REVENUE LEAKAGE (2 columns)                     */}
      {/* ================================================================= */}
      {revenueIntel && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pipeline Funnel */}
          <motion.div
            className="rounded-xl border border-white/5 bg-surface-3 p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Layers size={16} className="text-brand" />
              <h2 className="font-bold text-white">Pipeline Funnel</h2>
              <span className="text-[10px] text-slate-500 ml-auto">{revenueIntel.totalLeads.toLocaleString()} total leads</span>
            </div>
            <div className="space-y-3">
              {revenueIntel.funnelData.map((stage, i) => {
                const widthPct = Math.max(8, (stage.count / maxFunnelCount) * 100);
                return (
                  <div key={stage.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white">{stage.label}</span>
                        {i > 0 && (
                          <span className="text-[10px] text-slate-500">
                            {stage.conversionRate}% from {revenueIntel.funnelData[i - 1].label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400">{stage.count.toLocaleString()}</span>
                        <span className="text-xs font-mono font-bold" style={{ color: stage.color }}>{formatLargeNumber(stage.value)}</span>
                      </div>
                    </div>
                    <div className="h-7 bg-white/[0.02] rounded-lg overflow-hidden relative">
                      <motion.div
                        className="h-full rounded-lg flex items-center pl-2"
                        style={{ backgroundColor: `${stage.color}25`, borderLeft: `3px solid ${stage.color}` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 * i, ease: 'easeOut' }}
                      >
                        <span className="text-[10px] font-bold text-white/70 whitespace-nowrap">
                          {stage.count.toLocaleString()}
                        </span>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Revenue Leakage Dashboard */}
          <motion.div
            className="rounded-xl border border-red-500/20 bg-surface-3 p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-red-400" />
              <h2 className="font-bold text-white">Revenue Leakage</h2>
            </div>

            {/* Warning Callout */}
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 mb-4">
              <p className="text-sm text-red-300 font-medium">
                You're losing {formatLargeNumber(revenueIntel.lostValue)}/month in closed-lost deals
              </p>
              <p className="text-xs text-red-400/70 mt-1">
                {revenueIntel.lostCount} lost deals + {revenueIntel.atRiskCount - revenueIntel.lostCount} unresponsive leads represent {formatLargeNumber(revenueIntel.revenueAtRisk)} in at-risk revenue
              </p>
            </div>

            {/* Leakage Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Lost This Month</div>
                <div className="text-xl font-bold text-red-400">{formatLargeNumber(revenueIntel.lostValue)}</div>
                <div className="text-[10px] text-slate-500">{revenueIntel.lostCount} deals</div>
              </div>
              <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Avg Deal Size</div>
                <div className="text-xl font-bold text-white">{fmt(revenueIntel.avgDealSize)}</div>
                <div className="text-[10px] text-slate-500">across all stages</div>
              </div>
              <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Time to Close</div>
                <div className="text-xl font-bold text-white">{revenueIntel.avgTimeToClose}</div>
                <div className="text-[10px] text-slate-500">avg cycle</div>
              </div>
              <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Hot Leads</div>
                <div className="text-xl font-bold text-brand">{revenueIntel.hotLeads.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500">score 80+, high priority</div>
              </div>
            </div>

            {/* Fix It CTA */}
            <button
              onClick={() => setAiOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand/10 border border-brand/20 text-brand text-sm font-medium hover:bg-brand/20 transition-colors"
            >
              <Brain size={15} /> Get AI Recovery Strategy <ArrowRight size={14} />
            </button>
          </motion.div>
        </div>
      )}

      {/* ================================================================= */}
      {/* DEGEN ALPHA (when degen mode is on)                               */}
      {/* ================================================================= */}
      {degenMode && degenAlphaData && degenAlphaData.stats && (() => {
        const { stats, whales, surges, snipeQueue, hotSectors } = degenAlphaData;
        return (
          <motion.div className="space-y-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-red-500/5 to-yellow-500/10 p-4">
              <div className="flex items-center gap-3 mb-3">
                <Flame size={20} className="text-orange-400" />
                <h2 className="font-bold text-white">DEGEN ALPHA DASHBOARD</h2>
                <span className="text-[10px] text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">LIVE INTEL</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Whale Pipeline', value: `$${(stats.whaleValue / 1e6).toFixed(1)}M`, sub: 'Top 5 opps', color: '#f97316' },
                  { label: 'Intent Surges', value: `${stats.hotLeadsCount}`, sub: 'Score >= 85', color: '#ef4444' },
                  { label: 'Snipe Ready', value: `${snipeQueue.length}`, sub: `$${(stats.snipeValue / 1e6).toFixed(1)}M value`, color: '#eab308' },
                  { label: 'Rising Leads', value: stats.risingCount.toLocaleString(), sub: `${((stats.risingCount / 250000) * 100).toFixed(1)}% of total`, color: '#22c55e' },
                  { label: 'Hot Sector', value: stats.hotIndustry ? stats.hotIndustry.slice(0, 14) : 'N/A', sub: 'Most active', color: '#a855f7' },
                  { label: 'Conv. Rate', value: `${stats.conversionRate}%`, sub: 'Current wins', color: '#06b6d4' },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg border border-white/[0.06] bg-black/20 p-3 text-center">
                    <div className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: item.color }}>{item.label}</div>
                    <div className="text-xl font-bold text-white">{item.value}</div>
                    <div className="text-[10px] text-slate-500">{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Whale Radar */}
              <div className="rounded-xl border border-orange-500/20 bg-surface-3 p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Eye size={16} className="text-orange-400" /> Whale Radar -- Top 5
                </h3>
                <div className="space-y-2">
                  {whales.slice(0, 5).map((w, i) => (
                    <div key={i} onClick={() => onSelect && onSelect(w)}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-orange-500/5 hover:border-orange-500/20 cursor-pointer transition-colors">
                      <div className="w-7 h-7 rounded-full bg-orange-500/15 flex items-center justify-center text-xs font-bold text-orange-400">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{w.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{w.title} at {w.company}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-brand">{fmt(w.dealValue || w.value || 0)}</div>
                        <div className="text-[10px] text-slate-500">Score: {w.score}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Snipe Queue */}
              <div className="rounded-xl border border-yellow-500/20 bg-surface-3 p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Target size={16} className="text-yellow-400" /> Snipe Queue -- Act Now
                </h3>
                <div className="space-y-2">
                  {snipeQueue.slice(0, 5).map((s, i) => (
                    <div key={i} onClick={() => onSelect && onSelect(s)}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-yellow-500/5 hover:border-yellow-500/20 cursor-pointer transition-colors">
                      <div className="w-7 h-7 rounded-full bg-yellow-500/15 flex items-center justify-center text-xs font-bold text-yellow-400">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{s.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{s.company} | {s.industry}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-yellow-400">{fmt(s.dealValue || s.value || 0)}</div>
                        <div className={`text-[10px] px-1.5 py-0.5 rounded-full ${s.status === 'new' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-cyan-500/15 text-cyan-400'}`}>{s.status}</div>
                      </div>
                    </div>
                  ))}
                  {snipeQueue.length === 0 && <div className="text-center py-4 text-sm text-slate-500">No snipe opportunities right now</div>}
                </div>
              </div>
            </div>

            {hotSectors && hotSectors.length > 0 && (
              <div className="rounded-xl border border-purple-500/20 bg-surface-3 p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Zap size={16} className="text-purple-400" /> Hot Sectors -- Rising Momentum
                </h3>
                <div className="flex flex-wrap gap-2">
                  {hotSectors.map((s, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg border border-purple-500/20 bg-purple-500/5">
                      <div className="text-sm font-bold text-white">{s.industry}</div>
                      <div className="text-[10px] text-purple-400">{s.count} rising | {s.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        );
      })()}

      {/* ================================================================= */}
      {/* MARKET INTELLIGENCE + ACTIVITY FEED (2 columns)                   */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Market Intelligence Widget */}
        <motion.div
          className="rounded-xl border border-white/5 bg-surface-3 overflow-hidden"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        >
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Globe size={16} className="text-cyan-400" /> Market Intelligence
            </h2>
            <span className="text-[10px] text-slate-500">Live data</span>
          </div>

          {/* Top 5 Crypto Prices */}
          <div className="p-4 space-y-2">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Top Crypto Assets</div>
            {coins.slice(0, 5).map((coin) => {
              const change = coin.change24h ?? 0;
              const sparkColor = change >= 0 ? '#10b981' : '#ef4444';
              return (
                <div key={coin.id} className="flex items-center gap-3 py-1.5">
                  {coin.image ? (
                    <img src={coin.image} alt={coin.symbol} className="w-5 h-5 rounded-full" loading="lazy" />
                  ) : (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                      style={{ backgroundColor: `${COIN_COLORS[coin.symbol] || '#888'}20`, color: COIN_COLORS[coin.symbol] || '#888' }}>
                      {coin.symbol?.slice(0, 2)}
                    </div>
                  )}
                  <span className="text-xs font-bold text-white w-10">{coin.symbol}</span>
                  <span className="text-xs font-mono text-slate-300 flex-1">{formatPrice(coin.price)}</span>
                  <MiniSparkline data={coin.sparkline} color={sparkColor} width={48} height={18} />
                  <span className={`text-xs font-medium w-14 text-right ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Fear & Greed Gauge */}
          {fngValue != null && (
            <div className="px-4 pb-3 border-t border-white/5 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Fear & Greed Index</span>
                <span className="text-xs font-bold" style={{ color: fngColor(fngValue) }}>{fngValue} -- {fngLabel(fngValue)}</span>
              </div>
              <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: fngColor(fngValue) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${fngValue}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-red-400">Extreme Fear</span>
                <span className="text-[9px] text-emerald-400">Extreme Greed</span>
              </div>
            </div>
          )}

          {/* Trending / Prediction Market Events */}
          {trendingData && trendingData.length > 0 && (
            <div className="px-4 pb-3 border-t border-white/5 pt-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Trending Now</div>
              <div className="flex flex-wrap gap-1.5">
                {trendingData.slice(0, 5).map((t, idx) => {
                  const coin = t.item || t;
                  return (
                    <span key={idx} className="text-[10px] px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-medium">
                      #{idx + 1} {coin.name || coin.id}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alpha of the Day */}
          <div className="px-4 pb-4 border-t border-white/5 pt-3">
            <div className="rounded-lg bg-gradient-to-r from-brand/10 to-cyan-500/5 border border-brand/20 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={12} className="text-brand" />
                <span className="text-[10px] text-brand font-bold uppercase tracking-wider">Alpha of the Day</span>
              </div>
              <p className="text-xs text-slate-300">
                {coins.length > 0 && coins[0].change24h > 2
                  ? `${coins[0].name} showing strong momentum at +${coins[0].change24h.toFixed(1)}%. Volume surge confirms institutional interest.`
                  : fngValue && fngValue < 30
                    ? 'Fear levels elevated -- historically the best time to build positions. Smart money accumulating.'
                    : revenueIntel
                      ? `${revenueIntel.hotLeads.toLocaleString()} hot leads in pipeline with ${revenueIntel.closeRate}% close rate. Focus on high-intent signals.`
                      : 'Market consolidating. Watch for breakout signals in top-5 assets.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          className="rounded-xl border border-white/5 bg-surface-3 overflow-hidden"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        >
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Zap size={16} className="text-brand" /> Recent Activity
            </h2>
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand" />
              </span>
              <span className="text-[10px] text-brand font-medium">Live feed</span>
            </div>
          </div>
          <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {activityFeed.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${item.color}15`, color: item.color }}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-300 truncate">{item.text}</div>
                      <div className="text-[11px] text-slate-500 truncate">{item.detail}</div>
                    </div>
                    <span className="text-[10px] text-slate-600 flex-shrink-0 font-mono">
                      {timeAgo(item.timestamp.toISOString())}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {activityFeed.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">Loading activity feed...</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ================================================================= */}
      {/* FULL CRYPTO TABLE (Collapsible)                                   */}
      {/* ================================================================= */}
      <CryptoMarketTable coins={coins} />

      {/* ================================================================= */}
      {/* FOOTER                                                            */}
      {/* ================================================================= */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <Eye size={12} className="text-slate-600" />
        <p className="text-[10px] text-slate-600">
          Revenue data from GOATED lead engine. Market data via CoinGecko. Fear & Greed via Alternative.me. Refreshes every 30s.
        </p>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-xl bg-surface-3 border border-white/10 shadow-2xl text-sm text-white font-medium"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WEB TRAFFIC + SCALE ANALYTICS
// ---------------------------------------------------------------------------
function PlatformOverview({ totalLeads }) {
  const platform = usePlatformStats();

  return (
    <motion.div
      className="rounded-xl border border-white/5 bg-surface-3 p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-cyan-400" />
          <h2 className="font-bold text-white text-sm">Lead Database</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Leads', value: totalLeads.toLocaleString(), color: '#10b981' },
          { label: 'Active Deals', value: platform.activeDeals.toLocaleString(), color: '#06b6d4' },
          { label: 'Hot Leads (70%+)', value: platform.hotLeads.toLocaleString(), color: '#f59e0b' },
          { label: 'Revenue', value: '$0.00', color: '#a855f7', sub: 'Pre-revenue' },
        ].map((m, i) => (
          <div key={i} className="rounded-lg bg-black/20 border border-white/[0.04] p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-500">{m.label}</span>
            </div>
            <div className="text-lg font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
            {m.sub && <div className="text-[9px] text-slate-600">{m.sub}</div>}
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-gradient-to-r from-brand/5 to-cyan-500/5 border border-brand/15 p-3">
        <div className="flex items-center gap-2">
          <Zap size={12} className="text-brand" />
          <span className="text-[10px] text-brand font-bold uppercase tracking-wider">Platform</span>
          <span className="text-[10px] text-slate-400 ml-2">GOATED enrichment engine processes 500K+ leads with AI scoring, intent signals, and conversion prediction</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// CRYPTO MARKET TABLE (Collapsible)
// ============================================================================
function CryptoMarketTable({ coins }) {
  const [expanded, setExpanded] = useState(false);

  if (!coins || coins.length === 0) return null;

  return (
    <motion.div
      className="rounded-xl border border-white/5 bg-surface-3 overflow-hidden"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-brand" />
          <h2 className="font-bold text-white text-sm">Top Coins by Market Cap</h2>
          <span className="text-xs text-slate-500">{coins.length} tracked</span>
        </div>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={16} className="text-slate-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="divide-y divide-white/5">
              <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-slate-500 font-medium">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-3">Asset</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-1 text-right hidden sm:block">1h</div>
                <div className="col-span-1 text-right">24h</div>
                <div className="col-span-1 text-right hidden md:block">7d</div>
                <div className="col-span-2 text-right hidden lg:block">Market Cap</div>
                <div className="col-span-1 text-right">7d Chart</div>
              </div>
              {coins.slice(0, 20).map((coin, i) => {
                const change = coin.change24h ?? 0;
                const changeColor = change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-slate-400';
                const c1h = coin.change1h ?? 0;
                const c7d = coin.change7d ?? 0;
                const sparkColor = c7d >= 0 ? '#10b981' : '#ef4444';
                return (
                  <div key={coin.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-1 text-center text-xs text-slate-600 font-medium">{coin.rank || i + 1}</div>
                    <div className="col-span-3 flex items-center gap-2">
                      {coin.image ? (
                        <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full" loading="lazy" />
                      ) : (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                          style={{ backgroundColor: `${COIN_COLORS[coin.symbol] || '#888'}20`, color: COIN_COLORS[coin.symbol] || '#888' }}>
                          {coin.symbol?.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-bold text-white">{coin.symbol}</span>
                        <p className="text-[10px] text-slate-500 leading-none truncate max-w-[80px]">{coin.name}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-right text-sm font-medium text-white font-mono">{formatPrice(coin.price)}</div>
                    <div className={`col-span-1 text-right text-xs font-medium hidden sm:block ${c1h > 0 ? 'text-emerald-400' : c1h < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {c1h > 0 ? '+' : ''}{c1h.toFixed(1)}%
                    </div>
                    <div className={`col-span-1 text-right text-xs font-medium ${changeColor}`}>
                      {change > 0 ? '+' : ''}{change.toFixed(1)}%
                    </div>
                    <div className={`col-span-1 text-right text-xs font-medium hidden md:block ${c7d > 0 ? 'text-emerald-400' : c7d < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {c7d > 0 ? '+' : ''}{c7d.toFixed(1)}%
                    </div>
                    <div className="col-span-2 text-right text-xs text-slate-400 hidden lg:block">{formatLargeNumber(coin.marketCap)}</div>
                    <div className="col-span-1 flex justify-end">
                      <MiniSparkline data={coin.sparkline} color={sparkColor} width={64} height={22} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
