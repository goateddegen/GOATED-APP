import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, Server, Database, Cpu, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Lock, Wifi, Bot, Globe, Zap, Eye, Settings, BarChart3, LogIn,
  MousePointer, Navigation, Timer, DollarSign, Users, TrendingUp, TrendingDown,
  Rocket, Terminal, GitBranch, Clock, Radio, Flame, Target, PieChart,
  ArrowUpRight, ArrowDownRight, Layers, ChevronDown, ChevronUp, ExternalLink,
  Phone, Mail, Briefcase, Crown, Percent, CreditCard, ToggleLeft, ToggleRight,
  Key, Hash, Map, Monitor, AlertCircle, Gauge, Wallet, FileText, Download,
  Filter, Search, Receipt, ArrowDown, ArrowUp, Bitcoin, Banknote
} from 'lucide-react';
import { useStore, fmt } from '../hooks/useStore';
import WorldMap from '../components/WorldMap';

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatMs(ms) {
  if (ms === null || ms === undefined) return '--';
  return ms < 1 ? '<1ms' : `${Math.round(ms)}ms`;
}
function formatBytes(bytes) {
  if (!bytes) return '--';
  if (bytes < 1024) return `${bytes} B`;
  return bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
}
function formatUptime(startMs) {
  const s = Math.floor((Date.now() - startMs) / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}h ${m}m ${sec}s` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

// ─── Sparkline SVG ──────────────────────────────────────────────────────────
function Sparkline({ data, width = 80, height = 24, color = '#10b981', filled = false }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = `M${points.join(' L')}`;
  const fillPath = `${linePath} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} className="inline-block">
      {filled && <path d={fillPath} fill={color} opacity={0.15} />}
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    online:   { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Online' },
    offline:  { bg: 'bg-red-500/15',     text: 'text-red-400',     dot: 'bg-red-400',     label: 'Offline' },
    checking: { bg: 'bg-yellow-500/15',  text: 'text-yellow-400',  dot: 'bg-yellow-400',  label: 'Checking' },
    unknown:  { bg: 'bg-slate-500/15',   text: 'text-slate-400',   dot: 'bg-slate-400',   label: 'Unknown' },
  }[status] || { bg: 'bg-slate-500/15', text: 'text-slate-400', dot: 'bg-slate-400', label: 'Unknown' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'checking' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
}

// ─── Collapsible Section ────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, delay = 0, defaultOpen = true, badge = null }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay }}
      className="bg-[#0d0f12] rounded-xl border border-white/[0.04] overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full px-5 py-3.5 border-b border-white/[0.04] flex items-center gap-2.5 hover:bg-white/[0.02] transition-colors cursor-pointer">
        <Icon size={16} className="text-orange-400" />
        <h3 className="text-sm font-semibold tracking-tight flex-1 text-left">{title}</h3>
        {badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 mr-2">{badge}</span>}
        {open ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}>
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Access Denied ──────────────────────────────────────────────────────────
function AccessDenied({ onLogin }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
          <Lock size={28} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-slate-400 text-sm mb-6">
          You must be logged in to access the System Admin dashboard. This area contains sensitive system health data and configuration details.
        </p>
        <button onClick={onLogin} className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-semibold text-sm rounded-lg transition-colors">
          <LogIn size={16} /> Sign In to Continue
        </button>
      </motion.div>
    </div>
  );
}

// ─── Ping endpoint ──────────────────────────────────────────────────────────
async function pingEndpoint(url) {
  const start = performance.now();
  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    return { status: res.ok ? 'online' : 'offline', latency: performance.now() - start, httpStatus: res.status, checkedAt: Date.now() };
  } catch {
    return { status: 'offline', latency: performance.now() - start, httpStatus: null, checkedAt: Date.now() };
  }
}

// ─── Performance metrics from browser API ───────────────────────────────────
function getPerformanceMetrics() {
  const m = { pageLoad: null, ttfb: null, lcp: null, fid: null, cls: null, memory: null, domNodes: null };
  try { const n = performance.getEntriesByType('navigation')[0]; if (n) { m.pageLoad = n.loadEventEnd - n.startTime; m.ttfb = n.responseStart - n.requestStart; } } catch {}
  try { const e = performance.getEntriesByType('largest-contentful-paint'); if (e.length) m.lcp = e[e.length - 1].startTime; } catch {}
  try { const e = performance.getEntriesByType('first-input'); if (e.length) m.fid = e[0].processingStart - e[0].startTime; } catch {}
  try { const e = performance.getEntriesByType('layout-shift'); if (e.length) m.cls = e.reduce((s, x) => s + (x.hadRecentInput ? 0 : x.value), 0); } catch {}
  try { if (performance.memory) m.memory = { used: performance.memory.usedJSHeapSize, total: performance.memory.totalJSHeapSize, limit: performance.memory.jsHeapSizeLimit }; } catch {}
  try { m.domNodes = document.querySelectorAll('*').length; } catch {}
  return m;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const ENV_CHECKS = [
  { key: 'VITE_SUPABASE_URL', label: 'Supabase URL' },
  { key: 'VITE_SUPABASE_ANON_KEY', label: 'Supabase Anon Key' },
  { key: 'VITE_STRIPE_PUBLIC_KEY', label: 'Stripe Public Key' },
  { key: 'VITE_APOLLO_API_KEY', label: 'Apollo.io API Key' },
  { key: 'VITE_ANTHROPIC_API_KEY', label: 'Anthropic API Key' },
  { key: 'VITE_COINGECKO_API_KEY', label: 'CoinGecko API Key' },
];
const API_ENDPOINTS = [
  { id: 'sentiment',  url: '/api/sentiment',  label: 'Sentiment API',      icon: Activity },
  { id: 'market',     url: '/api/market-data', label: 'Market Data API',   icon: BarChart3 },
  { id: 'leads',      url: '/api/leads',       label: 'Leads API',         icon: Database },
  { id: 'chat',       url: '/api/chat',        label: 'AI Chat API',       icon: Bot },
  { id: 'coingecko',  url: 'https://api.coingecko.com/api/v3/ping', label: 'CoinGecko', icon: Globe },
  { id: 'fng',        url: 'https://api.alternative.me/fng/?limit=1', label: 'Fear & Greed Index', icon: Zap },
];

// ─── Observability Services ─────────────────────────────────────────────────
const OBS_SERVICES = [
  { id: 'coingecko', label: 'CoinGecko', icon: Globe, baseLatency: 142, errorRate: 0.12, uptime: 99.94, reqPerHour: 2400 },
  { id: 'kalshi',    label: 'Kalshi',     icon: Target, baseLatency: 89, errorRate: 0.05, uptime: 99.99, reqPerHour: 1800 },
  { id: 'polymarket',label: 'Polymarket', icon: PieChart, baseLatency: 112, errorRate: 0.08, uptime: 99.97, reqPerHour: 3200 },
  { id: 'supabase',  label: 'Supabase',   icon: Database, baseLatency: 34, errorRate: 0.02, uptime: 99.99, reqPerHour: 8500 },
  { id: 'vercel',    label: 'Vercel Edge', icon: Rocket, baseLatency: 18, errorRate: 0.01, uptime: 99.99, reqPerHour: 12000 },
];

// ─── Revenue Stats from Leads ────────────────────────────────────────────────
// PRE-REVENUE: All revenue/pipeline figures are $0 until real transactions flow.
// Lead counts and status breakdowns are real; dollar amounts are zeroed out.
function useLeadStats() {
  const leads = useStore(s => s.leads) || [];
  return useMemo(() => {
    const total = leads.length;
    const won = leads.filter(l => l.status === 'won');
    const lost = leads.filter(l => l.status === 'lost' || l.status === 'unresponsive');
    const active = leads.filter(l => !['won', 'lost', 'unresponsive'].includes(l.status));
    // PRE-REVENUE: all dollar values are $0
    const totalPipeline = 0;
    const wonRevenue = 0;
    const lostRevenue = 0;
    const activePipeline = 0;
    const closeRate = 0;
    const avgDeal = 0;
    const byStatus = {};
    leads.forEach(l => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });
    const byIndustry = {};
    leads.forEach(l => { if (l.industry) byIndustry[l.industry] = (byIndustry[l.industry] || 0) + 1; });
    const topIndustries = Object.entries(byIndustry).sort((a, b) => b[1] - a[1]).slice(0, 8);

    // Revenue by region — zeroed, will populate with real transactions
    const topRegions = [];

    // Commission calculations — $0 pre-revenue
    const commissionRate = 0.12;
    const totalCommission = 0;
    const avgCommission = 0;
    const pendingCommission = 0;
    const monthlyProjection = 0;

    return {
      total, won: won.length, lost: lost.length, active: active.length,
      totalPipeline, wonRevenue, lostRevenue, activePipeline,
      closeRate, avgDeal, byStatus, topIndustries, topRegions,
      totalCommission, avgCommission, pendingCommission, monthlyProjection, commissionRate
    };
  }, [leads]);
}

// ─── Revenue by Region Bar Chart (SVG) ──────────────────────────────────────
function RevenueByRegionChart({ regions }) {
  if (!regions || regions.length === 0) return <div className="text-xs text-slate-500">No region data available</div>;
  const maxVal = Math.max(...regions.map(([, d]) => d.total));
  const barH = 28;
  const chartH = regions.length * barH + 10;
  const labelW = 120;
  const chartW = 500;
  return (
    <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
      {regions.map(([name, data], i) => {
        const barWidth = maxVal > 0 ? ((data.total / maxVal) * (chartW - labelW - 40)) : 0;
        const y = i * barH + 5;
        const displayName = name.length > 15 ? name.slice(0, 14) + '...' : name;
        return (
          <g key={name}>
            <text x={labelW - 8} y={y + 17} fill="#94a3b8" fontSize="10" textAnchor="end" fontFamily="monospace">{displayName}</text>
            <rect x={labelW} y={y + 4} width={barWidth} height={16} rx={3} fill="#10b981" opacity={0.7}>
              <animate attributeName="width" from="0" to={barWidth} dur="0.6s" fill="freeze" />
            </rect>
            <text x={labelW + barWidth + 6} y={y + 17} fill="#64748b" fontSize="9" fontFamily="monospace">
              ${(data.total / 1e6).toFixed(1)}M
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Latency Gauge ──────────────────────────────────────────────────────────
function LatencyGauge({ value, max = 300, label }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = value < 50 ? '#10b981' : value < 150 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
      <span className="text-[11px] font-mono" style={{ color }}>{value}ms</span>
    </div>
  );
}

// ─── Real-Time Activity Feed ─────────────────────────────────────────────────
function generateActivities(count = 12) {
  const seed = Math.floor(Date.now() / 60000);
  const actions = [
    { tmpl: (n, c, v) => `${n} moved to Qualified — ${c}`, icon: ArrowUpRight, color: 'text-yellow-400' },
    { tmpl: (n, c, v) => `New lead from LinkedIn — ${c}`, icon: Users, color: 'text-blue-400' },
    { tmpl: (n, c, v) => `Lead scored — ${c}`, icon: CheckCircle2, color: 'text-emerald-400' },
    { tmpl: (n, c, v) => `${n} sent proposal — ${c}`, icon: Mail, color: 'text-purple-400' },
    { tmpl: (n, c, v) => `VoIP call completed — ${n} at ${c}`, icon: Phone, color: 'text-cyan-400' },
    { tmpl: (n, c, v) => `AI generated close strategy for ${c}`, icon: Bot, color: 'text-orange-400' },
    { tmpl: (n, c, v) => `${c} re-engaged after 30 days`, icon: RefreshCw, color: 'text-indigo-400' },
    { tmpl: (n, c, v) => `Lead report generated — ${c}`, icon: BarChart3, color: 'text-pink-400' },
  ];
  const names = ['Sarah J.', 'Mike C.', 'Alex W.', 'Jordan T.', 'Chris M.', 'Emily R.', 'David K.', 'Rachel L.', 'Matt B.', 'Nicole P.'];
  const cos = ['Acme Corp', 'Pipeline HQ', 'FlowState', 'NimbusOps', 'DealForge', 'BrightPath', 'SyncWave', 'MetricFlow', 'StackedCRM', 'LaunchGrid'];
  const vals = ['$0', '$0', '$0', '$0', '$0', '$0', '$0', '$0', '$0', '$0'];
  const result = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = ((s * 1103515245 + 12345) & 0x7fffffff);
    const a = actions[s % actions.length];
    const n = names[(s >> 4) % names.length];
    const c = cos[(s >> 8) % cos.length];
    const v = vals[(s >> 12) % vals.length];
    const mins = i * 3 + (s % 5);
    result.push({ text: a.tmpl(n, c, v), icon: a.icon, color: a.color, time: `${mins}m ago` });
  }
  return result;
}

// ─── Generate Mock Sparkline Data ───────────────────────────────────────────
function generateSparkData(base, variance, count = 20) {
  const data = [];
  let val = base;
  for (let i = 0; i < count; i++) {
    val += (Math.random() - 0.45) * variance;
    val = Math.max(base * 0.5, Math.min(base * 1.8, val));
    data.push(Math.round(val));
  }
  return data;
}

// ─── Deployment Log ──────────────────────────────────────────────────────────
function DeploymentPanel() {
  const [deploying, setDeploying] = useState(false);
  const [deployLog, setDeployLog] = useState([]);
  const [lastDeploy, setLastDeploy] = useState(null);

  const simulateDeploy = useCallback(() => {
    setDeploying(true);
    setDeployLog([]);
    const steps = [
      { msg: '$ git push origin master', delay: 0 },
      { msg: 'Enumerating objects: 47, done.', delay: 400 },
      { msg: 'Compressing objects: 100% (32/32), done.', delay: 800 },
      { msg: 'Writing objects: 100% (47/47), 156.2 KiB, done.', delay: 1200 },
      { msg: '$ vercel --prod', delay: 1600 },
      { msg: 'Vercel CLI 37.x — goated.solutions', delay: 2000 },
      { msg: 'Building project...', delay: 2400 },
      { msg: '$ vite build', delay: 2800 },
      { msg: 'transforming (142) src/pages/...', delay: 3200 },
      { msg: 'dist/assets/index-Dq4f2k.js   482.31 kB │ gzip: 148.2 kB', delay: 3600 },
      { msg: 'Build completed in 4.2s', delay: 4000 },
      { msg: 'Deploying to production...', delay: 4400 },
      { msg: '✓ Production: https://goated.solutions [4s]', delay: 5000 },
    ];
    steps.forEach(({ msg, delay }) => {
      setTimeout(() => setDeployLog(prev => [...prev, msg]), delay);
    });
    setTimeout(() => { setDeploying(false); setLastDeploy(new Date().toLocaleTimeString()); }, 5500);
  }, []);

  return (
    <div className="space-y-3">
      {/* Deployment Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Version', value: 'v3.2.1', color: 'text-emerald-400' },
          { label: 'Commit', value: 'a3f0f3f', color: 'text-cyan-400' },
          { label: 'Last Deploy', value: 'Mar 18, 2026 02:14 PM', color: 'text-purple-400' },
          { label: 'Build Status', value: 'Passing', color: 'text-emerald-400', dot: true },
        ].map(d => (
          <div key={d.label} className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{d.label}</div>
            <div className={`text-[12px] font-medium ${d.color} flex items-center gap-1.5 mt-0.5`}>
              {d.dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              {d.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Domain:</span>
          <span className="text-xs font-mono text-emerald-400">goated.solutions</span>
          <a href="https://goated.solutions" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 transition-colors">
            <ExternalLink size={11} />
          </a>
        </div>
        <button onClick={simulateDeploy} disabled={deploying}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
          <Rocket size={13} className={deploying ? 'animate-bounce' : ''} /> {deploying ? 'Deploying...' : 'Deploy to Production'}
        </button>
      </div>
      {lastDeploy && <div className="text-[10px] text-slate-500">Last deploy: {lastDeploy}</div>}
      {deployLog.length > 0 && (
        <div className="bg-black/50 rounded-lg border border-white/[0.04] p-3 max-h-48 overflow-y-auto font-mono text-[11px] space-y-0.5">
          {deployLog.map((line, i) => (
            <div key={i} className={line.startsWith('✓') ? 'text-emerald-400 font-semibold' : line.startsWith('$') ? 'text-cyan-400' : 'text-slate-400'}>
              {line}
            </div>
          ))}
          {deploying && <div className="text-yellow-400 animate-pulse">▋</div>}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Framework', value: 'Vite + React', color: 'text-cyan-400' },
          { label: 'Region', value: 'iad1 (US East)', color: 'text-purple-400' },
          { label: 'Runtime', value: 'Edge + Serverless', color: 'text-orange-400' },
        ].map(d => (
          <div key={d.label} className="px-2 py-2 rounded-lg bg-white/[0.02]">
            <div className="text-[10px] text-slate-500">{d.label}</div>
            <div className={`text-[11px] font-medium ${d.color}`}>{d.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Feature Flag Toggle ────────────────────────────────────────────────────
function FeatureFlag({ label, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-slate-500">{description}</div>
      </div>
      <button onClick={onToggle} className="flex-shrink-0">
        {enabled
          ? <ToggleRight size={28} className="text-emerald-400" />
          : <ToggleLeft size={28} className="text-slate-600" />}
      </button>
    </div>
  );
}

// ─── Admin Email Gate ─────────────────────────────────────────────────────
const ADMIN_EMAIL = 'secrdev@gmail.com';

function AdminAccessDenied() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
          <Shield size={28} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Admin Access Only</h2>
        <p className="text-slate-400 text-sm mb-6">
          This page is restricted to platform administrators. Your account does not have admin privileges.
        </p>
      </motion.div>
    </div>
  );
}

// ─── Seeded PRNG for deterministic transaction data ──────────────────────
function seededRandom(seed) {
  let s = seed | 0;
  if (!s) s = 1;
  return function () {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ─── Generate mock transaction log (deterministic, will be replaced by real data) ─
function generateTransactionLog() {
  // Returns empty array — these will be populated by real transactions
  // For now, show the structure with $0 totals
  return [];
}

// ─── Master Wallet Section ───────────────────────────────────────────────
function MasterWalletSection() {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');

  return (
    <div className="space-y-4">
      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="px-4 py-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-emerald-400" />
            <span className="text-[10px] text-emerald-400/70 uppercase tracking-wider">Total Balance</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">$0.00</div>
          <div className="text-[10px] text-slate-500 mt-1">Platform wallet — grows with transaction fees</div>
        </div>
        <div className="px-4 py-4 rounded-xl bg-blue-500/[0.06] border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-blue-400" />
            <span className="text-[10px] text-blue-400/70 uppercase tracking-wider">Available to Withdraw</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">$0.00</div>
          <div className="text-[10px] text-slate-500 mt-1">After pending settlements</div>
        </div>
        <div className="px-4 py-4 rounded-xl bg-purple-500/[0.06] border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-purple-400" />
            <span className="text-[10px] text-purple-400/70 uppercase tracking-wider">Pending Settlement</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">$0.00</div>
          <div className="text-[10px] text-slate-500 mt-1">Processing within 24-48h</div>
        </div>
      </div>

      {/* Recent Wallet Transactions */}
      <div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Recent Wallet Transactions</div>
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 text-center">
          <Receipt size={24} className="text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No transactions yet</p>
          <p className="text-[10px] text-slate-600 mt-1">Transactions will appear here as the platform processes fees</p>
        </div>
      </div>

      {/* Withdraw Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowWithdraw(!showWithdraw)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-semibold transition-colors"
        >
          <Download size={15} /> Withdraw Funds
        </button>
        <span className="text-[10px] text-slate-600">Min withdrawal: $50.00</span>
      </div>

      {showWithdraw && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 space-y-3">
          <div className="text-sm font-medium text-white">Withdraw to External Wallet</div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider">Amount (USD)</label>
            <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="0.00"
              className="w-full mt-1 px-3 py-2 bg-black/30 border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40" />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider">Destination Address</label>
            <input type="text" value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} placeholder="Wallet address or bank account"
              className="w-full mt-1 px-3 py-2 bg-black/30 border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40" />
          </div>
          <button disabled className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed">
            Insufficient balance
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Invoicing Section ───────────────────────────────────────────────────
function InvoicingSection() {
  const [invoiceFilter, setInvoiceFilter] = useState('all');

  // Empty invoices — will populate with real data
  const invoices = [];

  const filteredInvoices = invoiceFilter === 'all' ? invoices : invoices.filter(i => i.status === invoiceFilter);

  return (
    <div className="space-y-4">
      {/* Invoice Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Invoiced', value: '$0.00', color: '#10b981' },
          { label: 'Paid', value: '$0.00', color: '#22c55e' },
          { label: 'Pending', value: '$0.00', color: '#f59e0b' },
          { label: 'Overdue', value: '$0.00', color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</div>
            <div className="text-lg font-bold mt-0.5" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['all', 'paid', 'pending', 'overdue'].map(f => (
          <button key={f} onClick={() => setInvoiceFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border capitalize ${
              invoiceFilter === f
                ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                : 'bg-white/[0.02] border-white/[0.04] text-slate-400 hover:bg-white/[0.05]'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 text-center">
        <FileText size={24} className="text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No invoices yet</p>
        <p className="text-[10px] text-slate-600 mt-1">Invoices will be generated automatically as transactions occur</p>
      </div>
    </div>
  );
}

// ─── Transaction Fee Display ─────────────────────────────────────────────
function TransactionFeeDisplay() {
  return (
    <div className="space-y-4">
      {/* Fee Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Deal Commission */}
        <div className="px-4 py-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/15">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase size={16} className="text-emerald-400" />
            <span className="text-sm font-semibold text-white">Deal Commission</span>
          </div>
          <div className="text-3xl font-bold text-emerald-400 mb-1">10-15%</div>
          <p className="text-[11px] text-slate-400">Platform takes 10-15% on all closed deals</p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Standard deals</span>
              <span className="text-emerald-400 font-mono font-medium">10%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Premium / expedited</span>
              <span className="text-emerald-400 font-mono font-medium">12%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Enterprise deals (&gt;$100K)</span>
              <span className="text-emerald-400 font-mono font-medium">15%</span>
            </div>
          </div>
        </div>

        {/* Betting / Prediction Market Spread */}
        <div className="px-4 py-4 rounded-xl bg-orange-500/[0.04] border border-orange-500/15">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-orange-400" />
            <span className="text-sm font-semibold text-white">Betting Spread Fee</span>
          </div>
          <div className="text-3xl font-bold text-orange-400 mb-1">2-5%</div>
          <p className="text-[11px] text-slate-400">Spread taken on prediction market & casino bets</p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Prediction market bets</span>
              <span className="text-orange-400 font-mono font-medium">2%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Casino games (house edge)</span>
              <span className="text-orange-400 font-mono font-medium">3-5%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Live event betting</span>
              <span className="text-orange-400 font-mono font-medium">4%</span>
            </div>
          </div>
        </div>

        {/* Crypto Transaction Fees */}
        <div className="px-4 py-4 rounded-xl bg-blue-500/[0.04] border border-blue-500/15">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-blue-400" />
            <span className="text-sm font-semibold text-white">Crypto Transaction Fee</span>
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-1">1-2%</div>
          <p className="text-[11px] text-slate-400">Fee on crypto deposits, withdrawals, and swaps</p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Deposits (crypto)</span>
              <span className="text-blue-400 font-mono font-medium">1%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Withdrawals (crypto)</span>
              <span className="text-blue-400 font-mono font-medium">1.5%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Token swaps</span>
              <span className="text-blue-400 font-mono font-medium">2%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Fiat on-ramp / off-ramp</span>
              <span className="text-blue-400 font-mono font-medium">2.5%</span>
            </div>
          </div>
        </div>

        {/* Platform Subscription */}
        <div className="px-4 py-4 rounded-xl bg-purple-500/[0.04] border border-purple-500/15">
          <div className="flex items-center gap-2 mb-3">
            <Crown size={16} className="text-purple-400" />
            <span className="text-sm font-semibold text-white">Platform Model</span>
          </div>
          <div className="text-3xl font-bold text-purple-400 mb-1">$0</div>
          <p className="text-[11px] text-slate-400">No platform subscription fee — revenue from transaction fees only</p>
          <div className="mt-3 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <p className="text-[11px] text-purple-300">Users pay $0 to use the platform. Revenue is generated solely from commissions on closed deals and transaction fees.</p>
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Revenue Collected to Date</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'From Deal Commissions', value: '$0.00' },
            { label: 'From Betting Spread', value: '$0.00' },
            { label: 'From Crypto Fees', value: '$0.00' },
            { label: 'Total Revenue', value: '$0.00', bold: true },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-[10px] text-slate-600">{s.label}</div>
              <div className={`text-sm font-mono mt-0.5 ${s.bold ? 'font-bold text-emerald-400' : 'text-slate-300'}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Transaction Activity Log ────────────────────────────────────────────
function TransactionActivityLog() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [searchUser, setSearchUser] = useState('');

  const ACTION_TYPES = [
    { key: 'all', label: 'All', color: 'text-slate-400' },
    { key: 'deal_closed', label: 'Deal Closed', color: 'text-emerald-400' },
    { key: 'bet_placed', label: 'Bet Placed', color: 'text-orange-400' },
    { key: 'bet_won', label: 'Bet Won', color: 'text-yellow-400' },
    { key: 'deposit', label: 'Deposit', color: 'text-blue-400' },
    { key: 'withdrawal', label: 'Withdrawal', color: 'text-red-400' },
    { key: 'subscription', label: 'Subscription', color: 'text-purple-400' },
  ];

  // Empty log — will populate with real-time data
  const transactions = [];

  return (
    <div className="space-y-4">
      {/* Running Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Transactions', value: '0', color: '#64748b' },
          { label: 'Total Volume', value: '$0.00', color: '#10b981' },
          { label: 'Total Fees Collected', value: '$0.00', color: '#22c55e' },
          { label: 'Deals Closed', value: '0', color: '#3b82f6' },
          { label: 'Bets Processed', value: '0', color: '#f97316' },
          { label: 'Withdrawals', value: '0', color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">{s.label}</div>
            <div className="text-base font-bold font-mono mt-0.5" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type Filter */}
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-slate-500" />
          <span className="text-[10px] text-slate-500">Type:</span>
          <div className="flex gap-1">
            {ACTION_TYPES.map(t => (
              <button key={t.key} onClick={() => setTypeFilter(t.key)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors border ${
                  typeFilter === t.key
                    ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                    : 'bg-white/[0.02] border-white/[0.04] text-slate-500 hover:bg-white/[0.04]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-slate-500" />
          <span className="text-[10px] text-slate-500">Range:</span>
          <div className="flex gap-1">
            {[
              { key: 'all', label: 'All Time' },
              { key: 'today', label: 'Today' },
              { key: 'week', label: '7 Days' },
              { key: 'month', label: '30 Days' },
            ].map(d => (
              <button key={d.key} onClick={() => setDateRange(d.key)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors border ${
                  dateRange === d.key
                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                    : 'bg-white/[0.02] border-white/[0.04] text-slate-500 hover:bg-white/[0.04]'
                }`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* User Search */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Search size={12} className="text-slate-500" />
          <input type="text" value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Search user..."
            className="px-2 py-1 bg-black/30 border border-white/[0.06] rounded text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40 w-32" />
        </div>
      </div>

      {/* Transaction Table */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-6 gap-2 px-4 py-2.5 border-b border-white/[0.04] text-[10px] text-slate-500 uppercase tracking-wider font-medium">
          <span>Timestamp</span>
          <span>User</span>
          <span>Action</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Fee Taken</span>
          <span className="text-right">Status</span>
        </div>

        {/* Empty State */}
        {transactions.length === 0 && (
          <div className="px-4 py-8 text-center">
            <Activity size={24} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No transactions recorded yet</p>
            <p className="text-[10px] text-slate-600 mt-1">Real-time transaction feed will appear here as users interact with the platform</p>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[10px] text-emerald-400">Listening for transactions...</span>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Types Legend */}
      <div className="flex flex-wrap gap-3 px-2">
        {[
          { type: 'deal_closed', icon: Briefcase, label: 'Deal Closed', desc: '10-15% commission', color: '#10b981' },
          { type: 'bet_placed', icon: Target, label: 'Bet Placed', desc: '2-5% spread', color: '#f97316' },
          { type: 'bet_won', icon: Crown, label: 'Bet Won', desc: 'Payout processed', color: '#eab308' },
          { type: 'deposit', icon: ArrowDown, label: 'Deposit', desc: '1% fee', color: '#3b82f6' },
          { type: 'withdrawal', icon: ArrowUp, label: 'Withdrawal', desc: '1.5% fee', color: '#ef4444' },
          { type: 'subscription', icon: CreditCard, label: 'Subscription', desc: 'Recurring', color: '#a855f7' },
        ].map(t => (
          <div key={t.type} className="flex items-center gap-1.5 text-[10px]">
            <t.icon size={11} style={{ color: t.color }} />
            <span style={{ color: t.color }} className="font-medium">{t.label}</span>
            <span className="text-slate-600">({t.desc})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function AdminPage() {
  const { isLoggedIn, user, page, setAccountModalOpen, setPage, setAiOpen } = useStore();
  const [endpoints, setEndpoints] = useState(() =>
    API_ENDPOINTS.reduce((a, ep) => ({ ...a, [ep.id]: { status: 'unknown', latency: null, httpStatus: null, checkedAt: null } }), {})
  );
  const [isChecking, setIsChecking] = useState(false);
  const [perfMetrics, setPerfMetrics] = useState(null);
  const [dataSources, setDataSources] = useState(null);
  const [sessionStart] = useState(Date.now);
  const [sessionUptime, setSessionUptime] = useState('0s');
  const [sessionActions, setSessionActions] = useState({ clicks: 0, navigations: 0 });
  const [pagesVisited, setPagesVisited] = useState([]);
  const actionsRef = useRef({ clicks: 0, navigations: 0 });
  const pagesRef = useRef(new Set());
  const lastPageRef = useRef(page);

  // Platform Settings state
  const [commissionRate, setCommissionRate] = useState(12);
  const [withdrawalFee, setWithdrawalFee] = useState(2.50);
  const [featureFlags, setFeatureFlags] = useState({
    degenMode: true,
    predictionMarkets: true,
    voip: false,
    aiChat: true,
  });

  const stats = useLeadStats();
  const activities = useMemo(() => generateActivities(12), []);

  // Mock observability data with sparklines
  const obsData = useMemo(() => {
    return OBS_SERVICES.map(svc => ({
      ...svc,
      latency: svc.baseLatency + Math.round((Math.random() - 0.5) * 30),
      sparkData: generateSparkData(svc.reqPerHour, svc.reqPerHour * 0.15),
      status: Math.random() > 0.03 ? 'online' : 'degraded',
    }));
  }, []);

  // User analytics — PRE-REVENUE: all zeros until real analytics are connected
  const userAnalytics = useMemo(() => ({
    dau: 0,
    wau: 0,
    mau: 0,
    dauTrend: generateSparkData(0, 0),
    wauTrend: generateSparkData(0, 0),
    mauTrend: generateSparkData(0, 0),
    funnel: [
      { stage: 'Visitors', count: 0, pct: 0 },
      { stage: 'Signups', count: 0, pct: 0 },
      { stage: 'Active', count: 0, pct: 0 },
      { stage: 'Paid', count: 0, pct: 0 },
    ],
    topPages: [
      { path: '/dashboard', views: 0, pct: 0 },
      { path: '/leads', views: 0, pct: 0 },
      { path: '/market', views: 0, pct: 0 },
      { path: '/trends', views: 0, pct: 0 },
      { path: '/wallet', views: 0, pct: 0 },
      { path: '/admin', views: 0, pct: 0 },
    ],
  }), []);

  // Auth gate
  if (!isLoggedIn) return <AccessDenied onLogin={() => setAccountModalOpen(true)} />;

  // Admin email gate — only secrdev@gmail.com can access
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Health check all endpoints
  const checkAllEndpoints = useCallback(async () => {
    setIsChecking(true);
    setEndpoints(prev => {
      const next = { ...prev };
      API_ENDPOINTS.forEach(ep => { next[ep.id] = { status: 'checking', latency: null, httpStatus: null, checkedAt: null }; });
      return next;
    });
    const results = await Promise.allSettled(API_ENDPOINTS.map(async ep => ({ id: ep.id, ...(await pingEndpoint(ep.url)) })));
    const final = {};
    results.forEach(r => { if (r.status === 'fulfilled') final[r.value.id] = r.value; });
    setEndpoints(prev => ({ ...prev, ...final }));
    setIsChecking(false);
  }, []);

  // Check data sources
  const checkDataSources = useCallback(async () => {
    const src = {};
    src.supabase = { configured: !!import.meta.env.VITE_SUPABASE_URL, label: 'Supabase', detail: import.meta.env.VITE_SUPABASE_URL ? 'Connected' : 'Not configured' };
    try {
      const res = await fetch('/api/leads', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json(); const leads = data.leads || data;
        const isReal = Array.isArray(leads) && leads.length > 0 && leads[0]?.source !== 'generated';
        src.apollo = { configured: isReal, label: 'Apollo.io / Leads', detail: isReal ? `${leads.length} real leads` : 'Using generated data' };
      } else src.apollo = { configured: false, label: 'Apollo.io / Leads', detail: `API returned ${res.status}` };
    } catch { src.apollo = { configured: false, label: 'Apollo.io / Leads', detail: 'API unreachable' }; }
    src.coingecko = { configured: true, label: 'CoinGecko', detail: 'Free tier (no key required)' };
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'ping' }] }) });
      if (res.ok) {
        const data = await res.json(); const isFallback = data.fallback === true || data.error;
        src.anthropic = { configured: !isFallback, label: 'Anthropic AI', detail: isFallback ? 'Fallback mode (no API key)' : 'Live AI responses' };
      } else src.anthropic = { configured: false, label: 'Anthropic AI', detail: `API returned ${res.status}` };
    } catch { src.anthropic = { configured: false, label: 'Anthropic AI', detail: 'API unreachable' }; }
    src.stripe = { configured: !!import.meta.env.VITE_STRIPE_PUBLIC_KEY, label: 'Stripe Payments', detail: import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 'Key configured' : 'Not configured' };
    setDataSources(src);
  }, []);

  // Track session analytics
  useEffect(() => {
    const onClick = () => { actionsRef.current.clicks += 1; setSessionActions({ ...actionsRef.current }); };
    window.addEventListener('click', onClick);
    const timer = setInterval(() => setSessionUptime(formatUptime(sessionStart)), 1000);
    return () => { window.removeEventListener('click', onClick); clearInterval(timer); };
  }, [sessionStart]);

  useEffect(() => {
    if (page && page !== lastPageRef.current) { lastPageRef.current = page; pagesRef.current.add(page); actionsRef.current.navigations += 1; setPagesVisited([...pagesRef.current]); setSessionActions({ ...actionsRef.current }); }
    if (page) { pagesRef.current.add(page); setPagesVisited([...pagesRef.current]); }
  }, [page]);

  useEffect(() => { setPerfMetrics(getPerformanceMetrics()); checkAllEndpoints(); checkDataSources(); }, [checkAllEndpoints, checkDataSources]);

  // Computed
  const onlineCount = Object.values(endpoints).filter(e => e.status === 'online').length;
  const totalEp = API_ENDPOINTS.length;
  const healthPct = totalEp > 0 ? Math.round((onlineCount / totalEp) * 100) : 0;
  const envStatus = ENV_CHECKS.map(e => ({ ...e, configured: !!import.meta.env[e.key] }));
  const configuredCount = envStatus.filter(e => e.configured).length;
  const avgLatency = Object.values(endpoints).filter(e => e.latency).reduce((s, e, _, a) => s + e.latency / a.length, 0) || null;

  const toggleFlag = (key) => setFeatureFlags(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center"><Shield size={20} className="text-orange-400" /></div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">System Admin</h1>
            <p className="text-xs text-slate-500">Logged in as <span className="text-slate-300">{user?.name || user?.email || 'Admin'}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${healthPct === 100 ? 'bg-emerald-500/15 text-emerald-400' : healthPct >= 50 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
            {healthPct}% Healthy
          </span>
          <button onClick={() => { checkAllEndpoints(); checkDataSources(); setPerfMetrics(getPerformanceMetrics()); }} disabled={isChecking}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
            <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} /> {isChecking ? 'Checking...' : 'Refresh All'}
          </button>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PRE-REVENUE BANNER                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-blue-500/25 bg-blue-500/[0.06] p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
          <DollarSign size={18} className="text-blue-400" />
        </div>
        <div>
          <div className="text-sm font-bold text-blue-400">Pre-Revenue Phase</div>
          <div className="text-[11px] text-slate-500">All revenue, pipeline, and commission figures are $0.00. Values will update automatically as real transactions flow through the platform.</div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ADMIN-ONLY SECTIONS — Master Wallet, Fees, Invoicing, Transaction Log */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isAdmin ? (
        <>
          {/* Master Wallet */}
          <Section title="Master Wallet" icon={Wallet} delay={0.01} badge="Admin Only">
            <MasterWalletSection />
          </Section>

          {/* Transaction Fee Schedule */}
          <Section title="Transaction Fee Schedule" icon={Percent} delay={0.02} badge="Revenue Model">
            <TransactionFeeDisplay />
          </Section>

          {/* Invoicing */}
          <Section title="Invoicing" icon={FileText} delay={0.03} badge="Billing">
            <InvoicingSection />
          </Section>

          {/* Real-Time Transaction Activity Log */}
          <Section title="Transaction Activity Log" icon={Activity} delay={0.04} badge="Real-Time">
            <TransactionActivityLog />
          </Section>
        </>
      ) : (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/[0.04] p-4 flex items-center gap-3">
          <Lock size={16} className="text-yellow-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-yellow-400">Limited Access</div>
            <div className="text-[11px] text-slate-500">Wallet, invoicing, and transaction management are only visible to platform administrators.</div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 1. REVENUE ANALYTICS DASHBOARD                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section title="Revenue Analytics Dashboard" icon={DollarSign} delay={0.02} badge="10-15% Commission Model">
        <div className="space-y-5">
          {/* Top Revenue KPIs — $0 baseline, grows with real transactions */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Platform Revenue', value: '$0.00', sub: '10-15% commission on closed deals', color: '#10b981', icon: DollarSign },
              { label: 'Total Deals Closed', value: '0', sub: 'No deals closed yet', color: '#22c55e', icon: CheckCircle2 },
              { label: 'MRR', value: '$0.00', sub: 'Will grow with transactions', color: '#3b82f6', icon: TrendingUp },
              { label: 'Avg Commission', value: '$0.00', sub: 'per closed deal', color: '#a855f7', icon: Percent },
              { label: 'Pending Revenue', value: '$0.00', sub: 'No pending deals', color: '#f59e0b', icon: Clock },
            ].map((kpi, i) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
                className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <kpi.icon size={13} style={{ color: kpi.color }} />
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                </div>
                <div className="text-xl font-bold tracking-tight" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{kpi.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Revenue by Region Bar Chart */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Revenue by Region</div>
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-4 overflow-x-auto">
              <RevenueByRegionChart regions={stats.topRegions} />
            </div>
          </div>

          {/* Commission Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="px-4 py-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
              <div className="text-[10px] text-emerald-400/70 uppercase tracking-wider">Total Collected</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">$0.00</div>
              <div className="text-[10px] text-slate-500 mt-0.5">No deals closed yet</div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-purple-500/[0.06] border border-purple-500/20">
              <div className="text-[10px] text-purple-400/70 uppercase tracking-wider">Per-Deal Average</div>
              <div className="text-lg font-bold text-purple-400 mt-1">$0.00</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Avg deal size: $0.00</div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-yellow-500/[0.06] border border-yellow-500/20">
              <div className="text-[10px] text-yellow-400/70 uppercase tracking-wider">Pending Commission</div>
              <div className="text-lg font-bold text-yellow-400 mt-1">$0.00</div>
              <div className="text-[10px] text-slate-500 mt-0.5">No active deals in pipeline</div>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 2. OBSERVABILITY PANEL                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section title="Observability Panel" icon={Monitor} delay={0.04} badge="Real-time">
        <div className="space-y-4">
          {/* Service Status Table */}
          <div className="space-y-2">
            {obsData.map((svc, i) => {
              const SvcIcon = svc.icon;
              return (
                <motion.div key={svc.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                  {/* Service Name */}
                  <div className="flex items-center gap-2.5 w-36 flex-shrink-0">
                    <SvcIcon size={15} className="text-slate-400" />
                    <span className="text-sm font-medium">{svc.label}</span>
                  </div>
                  {/* Status */}
                  <StatusBadge status={svc.status === 'online' ? 'online' : 'checking'} />
                  {/* Latency Gauge */}
                  <div className="w-28 flex-shrink-0">
                    <LatencyGauge value={svc.latency} max={300} label="Response" />
                  </div>
                  {/* Error Rate */}
                  <div className="text-center w-16 flex-shrink-0">
                    <div className="text-[10px] text-slate-500">Errors</div>
                    <div className={`text-xs font-mono font-medium ${svc.errorRate < 0.1 ? 'text-emerald-400' : 'text-yellow-400'}`}>{svc.errorRate}%</div>
                  </div>
                  {/* Uptime */}
                  <div className="text-center w-16 flex-shrink-0">
                    <div className="text-[10px] text-slate-500">Uptime</div>
                    <div className="text-xs font-mono font-medium text-emerald-400">{svc.uptime}%</div>
                  </div>
                  {/* Request Volume Sparkline */}
                  <div className="flex-1 min-w-0 hidden md:block">
                    <div className="text-[10px] text-slate-500 mb-0.5">{fmt(svc.reqPerHour)} req/hr</div>
                    <Sparkline data={svc.sparkData} width={120} height={20} color="#3b82f6" filled />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Aggregate Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {[
              { label: 'Total Requests/hr', value: fmt(obsData.reduce((s, d) => s + d.reqPerHour, 0)), color: 'text-blue-400' },
              { label: 'Avg Latency', value: `${Math.round(obsData.reduce((s, d) => s + d.latency, 0) / obsData.length)}ms`, color: 'text-cyan-400' },
              { label: 'Avg Error Rate', value: `${(obsData.reduce((s, d) => s + d.errorRate, 0) / obsData.length).toFixed(2)}%`, color: 'text-emerald-400' },
              { label: 'Avg Uptime', value: `${(obsData.reduce((s, d) => s + d.uptime, 0) / obsData.length).toFixed(2)}%`, color: 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</div>
                <div className={`text-base font-bold ${s.color} mt-0.5`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 3. USER ANALYTICS                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section title="User Analytics" icon={Users} delay={0.06} badge="Pre-Revenue">
        <div className="space-y-5">
          {/* DAU / WAU / MAU */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'Daily Active Users', value: fmt(userAnalytics.dau), trend: userAnalytics.dauTrend, color: '#10b981', change: 'No Data' },
              { label: 'Weekly Active Users', value: fmt(userAnalytics.wau), trend: userAnalytics.wauTrend, color: '#3b82f6', change: 'No Data' },
              { label: 'Monthly Active Users', value: fmt(userAnalytics.mau), trend: userAnalytics.mauTrend, color: '#a855f7', change: 'No Data' },
            ].map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{m.label}</span>
                  <span className="text-[10px] font-medium text-emerald-400">{m.change}</span>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
                  <Sparkline data={m.trend} width={100} height={28} color={m.color} filled />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Conversion Funnel */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Conversion Funnel</div>
            <div className="space-y-2">
              {userAnalytics.funnel.map((step, i) => {
                const colors = ['#64748b', '#3b82f6', '#10b981', '#f59e0b'];
                const width = step.pct;
                return (
                  <div key={step.stage} className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 w-20">{step.stage}</span>
                    <div className="flex-1 h-6 bg-white/[0.03] rounded-lg overflow-hidden relative">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(3, width)}%` }}
                        transition={{ delay: 0.15 + i * 0.1, duration: 0.6 }}
                        className="h-full rounded-lg" style={{ background: colors[i] }} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-mono">
                        {fmt(step.count)} ({step.pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Pages + Geographic Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Pages */}
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Top Pages by Traffic</div>
              <div className="space-y-1.5">
                {userAnalytics.topPages.map((pg, i) => (
                  <div key={pg.path} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02]">
                    <span className="text-[10px] text-slate-600 w-4 text-right">{i + 1}.</span>
                    <span className="text-xs font-mono text-slate-300 flex-1">{pg.path}</span>
                    <div className="w-24 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500/70" style={{ width: `${pg.pct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono w-14 text-right">{fmt(pg.views)}</span>
                    <span className="text-[10px] text-slate-600 w-10 text-right">{pg.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Geographic Distribution */}
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Geographic Distribution</div>
              <div className="rounded-xl overflow-hidden border border-white/[0.04] bg-black/30" style={{ height: 220 }}>
                <Suspense fallback={<div className="flex items-center justify-center h-full text-xs text-slate-500">Loading map...</div>}>
                  <WorldMap />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 4. PLATFORM SETTINGS                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section title="Platform Settings" icon={Settings} delay={0.08} badge="Configuration">
        <div className="space-y-5">
          {/* Commission Rate Slider */}
          <div className="px-4 py-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium">Commission Rate</div>
                <div className="text-[11px] text-slate-500">Platform fee on closed deals</div>
              </div>
              <div className="text-2xl font-bold text-brand">{commissionRate}%</div>
            </div>
            <input type="range" min="5" max="20" step="0.5" value={commissionRate}
              onChange={e => setCommissionRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer accent-emerald-400
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>5%</span>
              <span>12% (default)</span>
              <span>20%</span>
            </div>
          </div>

          {/* Withdrawal Fee */}
          <div className="px-4 py-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium">Withdrawal Fee</div>
                <div className="text-[11px] text-slate-500">Per-withdrawal processing fee</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-slate-200">${withdrawalFee.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {[0, 1.00, 2.50, 5.00].map(fee => (
                <button key={fee} onClick={() => setWithdrawalFee(fee)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    withdrawalFee === fee
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/[0.02] border-white/[0.04] text-slate-400 hover:bg-white/[0.05]'
                  }`}>
                  {fee === 0 ? '$0 (Free)' : `$${fee.toFixed(2)}`}
                  {fee === 2.50 && <span className="text-[9px] text-yellow-400 ml-1">suggested</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Feature Flags */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Feature Flags</div>
            <div className="space-y-1.5">
              <FeatureFlag label="DEGEN MODE" description="Orange theme with alpha intel features" enabled={featureFlags.degenMode} onToggle={() => toggleFlag('degenMode')} />
              <FeatureFlag label="Prediction Markets" description="Kalshi + Polymarket integrations" enabled={featureFlags.predictionMarkets} onToggle={() => toggleFlag('predictionMarkets')} />
              <FeatureFlag label="VoIP Calling" description="In-app calling via WebRTC" enabled={featureFlags.voip} onToggle={() => toggleFlag('voip')} />
              <FeatureFlag label="AI Chat" description="Claude-powered strategy assistant" enabled={featureFlags.aiChat} onToggle={() => toggleFlag('aiChat')} />
            </div>
          </div>

          {/* API Key Management */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">API Key Management</div>
            <div className="space-y-1.5">
              {[
                { label: 'Anthropic API Key', key: 'VITE_ANTHROPIC_API_KEY', prefix: 'sk-ant-' },
                { label: 'Supabase Anon Key', key: 'VITE_SUPABASE_ANON_KEY', prefix: 'eyJhbGc' },
                { label: 'Stripe Public Key', key: 'VITE_STRIPE_PUBLIC_KEY', prefix: 'pk_live_' },
                { label: 'CoinGecko API Key', key: 'VITE_COINGECKO_API_KEY', prefix: 'CG-' },
                { label: 'Apollo.io API Key', key: 'VITE_APOLLO_API_KEY', prefix: 'apollo-' },
              ].map(apiKey => {
                const isSet = !!import.meta.env[apiKey.key];
                return (
                  <div key={apiKey.key} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Key size={13} className={isSet ? 'text-emerald-400' : 'text-slate-600'} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{apiKey.label}</div>
                        <div className="text-[11px] font-mono text-slate-600">
                          {isSet ? `${apiKey.prefix}${'*'.repeat(20)}` : 'Not configured'}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isSet ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {isSet ? 'Active' : 'Missing'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 5. DEPLOYMENT STATUS                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Section title="Deployment Status" icon={Rocket} delay={0.10} badge="goated.solutions">
        <DeploymentPanel />
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* EXISTING SECTIONS (preserved)                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* Top Stats - 8 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'APIs Online', value: `${onlineCount}/${totalEp}`, icon: Wifi, color: onlineCount === totalEp ? '#10b981' : '#f59e0b' },
          { label: 'Avg Latency', value: formatMs(avgLatency), icon: Zap, color: '#3b82f6' },
          { label: 'Total Leads', value: fmt(stats.total), icon: Users, color: '#10b981' },
          { label: 'Pipeline Value', value: '$0.00', icon: DollarSign, color: '#10b981' },
          { label: 'Won Revenue', value: '$0.00', icon: TrendingUp, color: '#22c55e' },
          { label: 'Lost Revenue', value: '$0.00', icon: TrendingDown, color: '#ef4444' },
          { label: 'Close Rate', value: `${stats.closeRate.toFixed(1)}%`, icon: Target, color: stats.closeRate >= 50 ? '#10b981' : '#f59e0b' },
          { label: 'Session Time', value: sessionUptime, icon: Timer, color: '#a855f7' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="bg-[#0d0f12] rounded-xl border border-white/[0.04] p-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${stat.color}15`, color: stat.color }}><stat.icon size={15} /></div>
            <div className="text-lg font-bold tracking-tight">{stat.value}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Intelligence + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Revenue Intelligence" icon={DollarSign} delay={0.04}>
          <div className="space-y-3">
            {/* Pipeline Funnel */}
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Pipeline Funnel</div>
            {['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won'].map((stage, i) => {
              const count = stats.byStatus[stage] || 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              const colors = { new: '#64748b', contacted: '#06b6d4', qualified: '#3b82f6', proposal: '#a855f7', negotiation: '#f59e0b', won: '#10b981' };
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 w-20 capitalize">{stage}</span>
                  <div className="flex-1 h-4 bg-white/[0.03] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(2, pct)}%` }} transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
                      className="h-full rounded-full" style={{ background: colors[stage] }} />
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono w-12 text-right">{fmt(count)}</span>
                </div>
              );
            })}
            {/* GOATED Guarantee */}
            <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown size={14} className="text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">GOATED Guarantee</span>
              </div>
              <span className="text-xs font-bold bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30">90%+ Close Rate</span>
            </div>
            {/* Top Industries */}
            <div className="pt-2">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Top Industries</div>
              <div className="flex flex-wrap gap-1.5">
                {stats.topIndustries.map(([ind, cnt]) => (
                  <span key={ind} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400">{ind} ({fmt(cnt)})</span>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section title="Live Activity Feed" icon={Radio} delay={0.06}>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {activities.map((a, i) => {
              const AIcon = a.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <AIcon size={13} className={`${a.color} mt-0.5 flex-shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-slate-300 leading-snug">{a.text}</div>
                  </div>
                  <span className="text-[10px] text-slate-600 flex-shrink-0">{a.time}</span>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center gap-1.5">
            <Radio size={10} className="text-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400">Live — updates every 60s</span>
          </div>
        </Section>
      </div>

      {/* API Health Dashboard */}
      <Section title="API Health Dashboard" icon={Server} delay={0.05}>
        <div className="space-y-2">
          {API_ENDPOINTS.map(ep => {
            const d = endpoints[ep.id] || {}; const EpIcon = ep.icon;
            return (
              <div key={ep.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <EpIcon size={15} className="text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{ep.label}</div>
                    <div className="text-[11px] text-slate-500 truncate font-mono">{ep.url}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-400 font-mono">{formatMs(d.latency)}</div>
                    {d.checkedAt && <div className="text-[10px] text-slate-600">{new Date(d.checkedAt).toLocaleTimeString()}</div>}
                  </div>
                  {d.httpStatus && d.status === 'offline' && <span className="text-[10px] text-red-400 font-mono">{d.httpStatus}</span>}
                  <StatusBadge status={d.status} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Performance + Data Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Performance Metrics" icon={Cpu} delay={0.1}>
          {perfMetrics ? (
            <div className="space-y-3">
              {[
                { label: 'Page Load Time', value: formatMs(perfMetrics.pageLoad), good: perfMetrics.pageLoad != null && perfMetrics.pageLoad < 3000 },
                { label: 'Time to First Byte', value: formatMs(perfMetrics.ttfb), good: perfMetrics.ttfb != null && perfMetrics.ttfb < 600 },
                { label: 'Largest Contentful Paint', value: formatMs(perfMetrics.lcp), good: perfMetrics.lcp != null && perfMetrics.lcp < 2500 },
                { label: 'First Input Delay', value: perfMetrics.fid != null ? formatMs(perfMetrics.fid) : 'No input yet', good: perfMetrics.fid == null || perfMetrics.fid < 100 },
                { label: 'Cumulative Layout Shift', value: perfMetrics.cls != null ? perfMetrics.cls.toFixed(4) : '--', good: perfMetrics.cls != null && perfMetrics.cls < 0.1 },
                { label: 'DOM Nodes', value: perfMetrics.domNodes ? perfMetrics.domNodes.toLocaleString() : '--', good: perfMetrics.domNodes && perfMetrics.domNodes < 1500 },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="text-xs text-slate-400">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-medium">{m.value}</span>
                    {m.value !== '--' && m.value !== 'No input yet' && (m.good
                      ? <CheckCircle2 size={13} className="text-emerald-400" />
                      : <AlertTriangle size={13} className="text-yellow-400" />
                    )}
                  </div>
                </div>
              ))}
              {perfMetrics.memory && (
                <div className="pt-2 mt-2 border-t border-white/[0.04]">
                  <div className="text-[11px] text-slate-500 mb-2 font-medium uppercase tracking-wider">Memory (JS Heap)</div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${Math.min(100, (perfMetrics.memory.used / perfMetrics.memory.limit) * 100)}%` }} />
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{Math.round((perfMetrics.memory.used / perfMetrics.memory.limit) * 100)}%</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Used: {formatBytes(perfMetrics.memory.used)}</span>
                    <span>Limit: {formatBytes(perfMetrics.memory.limit)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : <div className="text-sm text-slate-500">Loading metrics...</div>}
        </Section>

        <Section title="Data Source Status" icon={Database} delay={0.15}>
          {dataSources ? (
            <div className="space-y-2">
              {Object.entries(dataSources).map(([key, s]) => (
                <div key={key} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {s.configured ? <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" /> : <XCircle size={15} className="text-red-400 flex-shrink-0" />}
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{s.label}</div>
                      <div className="text-[11px] text-slate-500 truncate">{s.detail}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.configured ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {s.configured ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-500"><RefreshCw size={13} className="animate-spin" /> Checking data sources...</div>
          )}
        </Section>
      </div>

      {/* Session + Environment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Session Analytics" icon={Eye} delay={0.2}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Session Duration', value: sessionUptime, icon: Timer },
                { label: 'Pages Visited', value: pagesVisited.length, icon: Navigation },
                { label: 'Total Clicks', value: sessionActions.clicks, icon: MousePointer },
                { label: 'Page Navigations', value: sessionActions.navigations, icon: Navigation },
              ].map(s => (
                <div key={s.label} className="px-3 py-2.5 rounded-lg bg-white/[0.02]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <s.icon size={12} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</span>
                  </div>
                  <div className="text-base font-bold">{s.value}</div>
                </div>
              ))}
            </div>
            {pagesVisited.length > 0 && (
              <div className="pt-2 border-t border-white/[0.04]">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Pages Visited This Session</div>
                <div className="flex flex-wrap gap-1.5">
                  {pagesVisited.map(p => (
                    <span key={p} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${p === page ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-white/[0.04] text-slate-400'}`}>{p}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-2 border-t border-white/[0.04]">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Current View</div>
              <div className="text-sm font-medium text-orange-400 capitalize">{page || 'Unknown'}</div>
            </div>
          </div>
        </Section>

        <Section title="Environment Configuration" icon={Settings} delay={0.25}>
          <div className="space-y-2">
            {envStatus.map(e => (
              <div key={e.key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02]">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{e.label}</div>
                  <div className="text-[10px] text-slate-600 font-mono">{e.key}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {e.configured
                    ? <><CheckCircle2 size={14} className="text-emerald-400" /><span className="text-[11px] text-emerald-400 font-medium">Set</span></>
                    : <><XCircle size={14} className="text-slate-600" /><span className="text-[11px] text-slate-600 font-medium">Missing</span></>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs">
            <span className="text-slate-500">{configuredCount} of {ENV_CHECKS.length} variables configured</span>
            <span className={configuredCount === ENV_CHECKS.length ? 'text-emerald-400' : 'text-yellow-400'}>
              {configuredCount === ENV_CHECKS.length ? 'All set' : 'Incomplete'}
            </span>
          </div>
        </Section>
      </div>

      {/* Quick Actions */}
      <Section title="Quick Actions" icon={Flame} delay={0.3}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'View Leads', icon: Users, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', action: () => setPage('leads') },
            { label: 'Market Intel', icon: BarChart3, color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', action: () => setPage('market') },
            { label: 'AI Strategy', icon: Bot, color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', action: () => setAiOpen(true) },
            { label: 'Dashboard', icon: PieChart, color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', action: () => setPage('dashboard') },
          ].map(qa => (
            <button key={qa.label} onClick={qa.action}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${qa.color} text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]`}>
              <qa.icon size={15} /> {qa.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="text-center text-[11px] text-slate-600 pt-2">
        GOATED System Admin v3.2 &middot; Build {import.meta.env.MODE} &middot; {new Date().toLocaleDateString()} &middot; goated.solutions
      </motion.div>
    </div>
  );
}
