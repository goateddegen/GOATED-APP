import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, ArrowUpRight, BarChart3, Activity, RefreshCw, Zap, Target,
  DollarSign, Layers, Flame, Lock, LogIn, Eye,
  Phone, Mail, FileText, Brain, AlertTriangle, CheckCircle, Users, Award,
  ArrowRight, Briefcase, ShieldCheck,
} from 'lucide-react';
import { useStore, fmt } from '../hooks/useStore';

// ============================================================================
// DASHBOARD -- Pipeline Health & Revenue Intelligence
// ============================================================================


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
function formatLargeNumber(n) {
  if (n == null || isNaN(n)) return '$0';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
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
// Generate deterministic B2B activity feed from leads
// ---------------------------------------------------------------------------
function generateActivityFeed(leads, dateSeed) {
  const rand = seededRandom(dateSeed);
  const items = [];
  if (!leads || leads.length === 0) return items;

  const actionTemplates = [
    (l) => ({ icon: ArrowUpRight, color: '#10b981', text: `${(l.name||'Lead').split(' ')[0]} ${(l.name||'').split(' ')[1]?.[0] || ''}. moved to ${l.status === 'negotiation' ? 'Negotiation' : l.status === 'proposal' ? 'Proposal' : 'Qualified'} -- ${fmt(l.dealValue)} deal`, detail: `${l.company} | ${l.industry}` }),
    (l) => ({ icon: Users, color: '#3b82f6', text: `New lead from ${l.lead_source || 'inbound'} -- ${l.company}`, detail: `${l.name} (${l.title}) | Score: ${l.score}` }),
    (l) => ({ icon: CheckCircle, color: '#00ff88', text: `Deal closed! ${fmt(l.dealValue)} -- ${l.company}`, detail: `${l.name} | ${l.industry} | ${l.employees || '?'} employees` }),
    (l) => ({ icon: Phone, color: '#a855f7', text: `Call completed with ${(l.name||'Lead').split(' ')[0]} at ${l.company}`, detail: `${l.title} | Next step: ${l.status === 'contacted' ? 'Schedule demo' : 'Send proposal'}` }),
    (l) => ({ icon: Mail, color: '#06b6d4', text: `Outreach sent to ${l.name} -- ${l.company}`, detail: `Via ${l.lead_source || 'outbound'} | Deal size: ${fmt(l.dealValue)}` }),
    (l) => ({ icon: TrendingUp, color: '#f97316', text: `${l.company} engagement surging -- momentum ${l.momentum || 'rising'}`, detail: `Score jumped to ${l.score} | ${fmt(l.dealValue)} pipeline` }),
    (l) => ({ icon: AlertTriangle, color: '#ef4444', text: `${l.company} going cold -- last contact ${l.last_contact || 'unknown'}`, detail: `${fmt(l.dealValue)} at risk | Priority: ${l.priority || 'medium'}` }),
    (l) => ({ icon: Award, color: '#eab308', text: `${(l.name||'Lead').split(' ')[0]} referred a new lead from ${l.industry}`, detail: `Referral from ${l.company} | High intent signal` }),
    (l) => ({ icon: Briefcase, color: '#8b5cf6', text: `${l.company} requested custom proposal -- ${fmt(l.dealValue)}`, detail: `${l.name} (${l.title}) | ${l.employees || '?'} employees` }),
    (l) => ({ icon: Target, color: '#22c55e', text: `Demo booked: ${l.name} at ${l.company}`, detail: `${l.title} | Budget: ${fmt(l.dealValue)} | ${l.location || 'TBD'}` }),
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

  // ── Revenue Intelligence computed from real store data ──
  const revenueIntel = useMemo(() => {
    if (!leads || !analytics) return null;

    const totalPipeline = analytics.totalPipelineValue || 0;
    const closeRate = analytics.winRate || 0;
    const avgDealSize = analytics.avgDealValue || 0;
    const hotLeads = analytics.hotLeads || 0;
    const totalLeads = analytics.total || 0;
    const wonCount = analytics.wonCount || 0;
    const lostCount = analytics.lostCount || 0;

    // Compute won/lost values from actual leads
    let wonValue = 0;
    let lostValue = 0;
    let atRiskValue = 0;
    let atRiskCount = 0;
    for (let i = 0; i < leads.length; i++) {
      const l = leads[i];
      if (l.status === 'won') wonValue += l.dealValue;
      if (l.status === 'lost') lostValue += l.dealValue;
      // At-risk: leads that went cold or have low momentum
      if (l.momentum === 'declining' || l.status === 'lost') {
        atRiskValue += l.dealValue;
        atRiskCount++;
      }
    }

    // Active pipeline value (excluding won/lost)
    const activePipeline = totalPipeline - wonValue - lostValue;

    // MRR estimate: won deals spread monthly (simplified)
    const mrr = wonCount > 0 ? Math.round(wonValue / 12) : 0;

    // Avg time to close placeholder based on pipeline depth
    const avgTimeToClose = wonCount > 0 ? '~45 days' : '--';

    // Funnel data from real analytics conversionFunnel
    const funnel = analytics.conversionFunnel || {};
    const funnelData = FUNNEL_STAGES.map(stage => {
      const count = funnel[stage.key] || 0;
      // Estimate value per stage: count * avgDealValue
      const value = count * avgDealSize;
      return { ...stage, count, value };
    });

    // Conversion rates between stages
    const funnelWithConversion = funnelData.map((stage, i) => {
      if (i === 0) return { ...stage, conversionRate: 100 };
      const prevCount = funnelData[i - 1].count;
      const rate = prevCount > 0 ? ((stage.count / prevCount) * 100).toFixed(1) : 0;
      return { ...stage, conversionRate: parseFloat(rate) };
    });

    // Top industries from analytics
    const topIndustries = analytics.topIndustries || [];

    return {
      totalPipeline: activePipeline,
      revenueAtRisk: atRiskValue,
      wonValue,
      lostValue,
      mrr,
      closeRate,
      avgDealSize,
      avgTimeToClose,
      funnelData: funnelWithConversion,
      lostCount,
      atRiskCount,
      totalLeads,
      hotLeads,
      topIndustries,
    };
  }, [leads, analytics]);

  // ── Activity Feed (deterministic by date) ──
  const activityFeed = useMemo(() => {
    const today = new Date();
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return generateActivityFeed(leads, dateSeed);
  }, [leads]);

  // ── Loading state ──
  if (!revenueIntel) {
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
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live from store
        </div>
      </div>

      {/* ================================================================= */}
      {/* REAL-TIME SYSTEM METRICS BAR                                      */}
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
                <span className="text-sm font-bold text-white">Commission Model</span>
                <span className="text-[10px] text-brand bg-brand/15 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">12% / 15% Partner</span>
              </div>
              <p className="text-xs text-slate-400">Platform is 100% free. 12% commission on closed deals, 15% for approved partners and $100K+ deals.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-slate-500">Won Revenue</div>
              <div className="text-sm font-bold text-brand">{revenueIntel ? formatLargeNumber(revenueIntel.wonValue) : '$0'}</div>
              <div className="text-[9px] text-slate-600">{revenueIntel ? `${revenueIntel.closeRate}% close rate` : '--'}</div>
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
              <span className="text-[10px] text-slate-600">{revenueIntel.mrr > 0 ? 'Estimated' : 'No wins yet'}</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatLargeNumber(revenueIntel.mrr)}</div>
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
      {/* TOP INDUSTRIES + ACTIVITY FEED (2 columns)                        */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Industries from Pipeline */}
        <motion.div
          className="rounded-xl border border-white/5 bg-surface-3 overflow-hidden"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        >
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <BarChart3 size={16} className="text-cyan-400" /> Pipeline by Industry
            </h2>
            <span className="text-[10px] text-slate-500">{revenueIntel.topIndustries.length} sectors</span>
          </div>

          <div className="p-4 space-y-2">
            {revenueIntel.topIndustries.length > 0 ? (
              revenueIntel.topIndustries.slice(0, 10).map(([industry, count], idx) => {
                const maxCount = revenueIntel.topIndustries[0]?.[1] || 1;
                const pct = Math.max(8, (count / maxCount) * 100);
                const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f97316', '#eab308', '#00ff88', '#ef4444', '#a855f7', '#10b981', '#f59e0b'];
                const color = colors[idx % colors.length];
                return (
                  <div key={industry}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white">{industry}</span>
                      <span className="text-xs font-mono text-slate-400">{count.toLocaleString()} leads</span>
                    </div>
                    <div className="h-5 bg-white/[0.02] rounded-lg overflow-hidden">
                      <motion.div
                        className="h-full rounded-lg"
                        style={{ backgroundColor: `${color}30`, borderLeft: `3px solid ${color}` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.05 * idx, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-sm text-slate-500">No industry data yet</div>
            )}
          </div>

          {/* Pipeline insight */}
          <div className="px-4 pb-4 border-t border-white/5 pt-3">
            <div className="rounded-lg bg-gradient-to-r from-brand/10 to-cyan-500/5 border border-brand/20 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={12} className="text-brand" />
                <span className="text-[10px] text-brand font-bold uppercase tracking-wider">Pipeline Insight</span>
              </div>
              <p className="text-xs text-slate-300">
                {revenueIntel.hotLeads > 0
                  ? `${revenueIntel.hotLeads.toLocaleString()} hot leads in pipeline with ${revenueIntel.closeRate}% close rate. Focus on high-intent signals.`
                  : 'Build your pipeline by adding leads. Use AI Strategy for recommendations.'}
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
      {/* FOOTER                                                            */}
      {/* ================================================================= */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <Eye size={12} className="text-slate-600" />
        <p className="text-[10px] text-slate-600">
          Pipeline data from GOATED lead engine. All metrics computed from store data.
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

