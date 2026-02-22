import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, Trophy, Activity, Download, Plus, ArrowUp, ArrowDown, Minus, Phone, Mail, TrendingUp, Zap, Target, Globe, Clock, BarChart3, PieChart, Layers, FileText, Bot, Rocket } from 'lucide-react';
import { useStore, fmt } from '../hooks/useStore';

const priorityColors = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  medium: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

export default function DashboardPage({ onSelect }) {
  const { leads, getFilteredLeads } = useStore();
  const filtered = getFilteredLeads();

  const stats = useMemo(() => ({
    total: filtered.length,
    pipeline: filtered.reduce((s, l) => s + l.dealValue, 0),
    winRate: (filtered.filter(l => l.status === 'won').length / filtered.length * 100).toFixed(1),
    active: filtered.filter(l => ['qualified', 'proposal', 'negotiation'].includes(l.status)).length,
    critical: filtered.filter(l => l.priority === 'critical').length,
    avgScore: Math.round(filtered.reduce((s, l) => s + l.score, 0) / filtered.length),
    rising: filtered.filter(l => l.momentum === 'rising').length,
    avgDeal: filtered.reduce((s, l) => s + l.dealValue, 0) / filtered.length,
  }), [filtered]);

  const topLeads = filtered.slice(0, 5);
  const statCards = [
    { label: 'Total Leads', value: stats.total.toLocaleString(), icon: Users, change: '+12%', color: '#10b981' },
    { label: 'Pipeline Value', value: fmt(stats.pipeline), icon: DollarSign, change: '+8%', color: '#06b6d4' },
    { label: 'Win Rate', value: `${stats.winRate}%`, icon: Trophy, change: '+5%', color: '#f59e0b' },
    { label: 'Active Deals', value: stats.active.toString(), icon: Activity, change: '+23', color: '#a855f7' },
    { label: 'Critical Leads', value: stats.critical.toString(), icon: Target, change: stats.critical > 10 ? 'HOT' : '+2', color: '#ef4444' },
    { label: 'Avg Score', value: stats.avgScore.toString(), icon: BarChart3, change: '+7', color: '#3b82f6' },
    { label: 'Rising Momentum', value: stats.rising.toString(), icon: TrendingUp, change: '+15%', color: '#10b981' },
    { label: 'Avg Deal Size', value: fmt(stats.avgDeal), icon: DollarSign, change: '+15%', color: '#f97316' },
  ];

  const commandCards = [
    { icon: Bot, title: 'AI Lead Research', desc: 'Run AI agents to enrich and score all pipeline leads', action: 'Launch Agent', color: '#10b981' },
    { icon: Mail, title: 'Bulk Outreach', desc: 'Send personalized emails to all high-priority leads', action: 'Draft Emails', color: '#3b82f6' },
    { icon: Phone, title: 'Call Queue', desc: 'Start calling top 10 leads with AI coaching', action: 'Start Calls', color: '#f59e0b' },
    { icon: FileText, title: 'Pipeline Report', desc: 'Generate SWOT analysis and deal forecast', action: 'Generate', color: '#a855f7' },
    { icon: Rocket, title: 'Launch Campaign', desc: 'Create multi-channel outreach campaign', action: 'Create', color: '#ec4899' },
    { icon: Globe, title: 'Market Intel', desc: 'Scan market for new opportunities and competitors', action: 'Scan Now', color: '#06b6d4' },
    { icon: Layers, title: 'Deal Stacking', desc: 'Identify cross-sell and upsell opportunities', action: 'Analyze', color: '#f97316' },
    { icon: PieChart, title: 'Revenue Forecast', desc: 'Predict Q1 revenue based on current pipeline', action: 'Forecast', color: '#8b5cf6' },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-500">Your sales command center</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 border border-white/10 text-sm"><Download size={16} />Export</button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-black font-medium text-sm"><Plus size={16} />New Lead</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statCards.map((s, i) => (
          <motion.div key={i} className="bg-surface-3 rounded-xl p-4 border border-white/5 card-hover"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15`, color: s.color }}>
                <s.icon size={18} />
              </div>
              <span className={`text-xs font-medium ${s.change.startsWith('+') || s.change === 'HOT' ? 'text-brand' : 'text-red-400'}`}>{s.change}</span>
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Command Center */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Zap size={18} className="text-brand" />Command Center</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {commandCards.map((c, i) => (
            <motion.button key={i} className="bg-surface-3 rounded-xl p-4 border border-white/5 text-left card-hover group"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all" style={{ background: `${c.color}15`, color: c.color }}>
                <c.icon size={20} />
              </div>
              <h3 className="font-semibold text-sm mb-1">{c.title}</h3>
              <p className="text-xs text-slate-500 mb-3">{c.desc}</p>
              <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 group-hover:bg-brand/15 group-hover:text-brand transition-colors">{c.action}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Top 5 Leads */}
      <div className="bg-surface-3 rounded-xl border border-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
          <h2 className="font-semibold flex items-center gap-2"><Trophy size={16} className="text-yellow-400" />Top 5 Leads</h2>
          <button onClick={() => useStore.getState().setPage('leads')} className="text-xs text-brand hover:underline">View all</button>
        </div>
        {topLeads.map((l, i) => (
          <motion.button key={l.id} onClick={() => onSelect(l)}
            className="w-full flex items-center gap-4 px-4 py-3.5 border-b border-white/5 last:border-0 text-left hover:bg-white/[0.02] transition-colors"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }}>
            <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center font-bold text-sm text-slate-500">{i + 1}</div>
            <div className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center text-brand font-bold text-xs">
              {l.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{l.name}</div>
              <div className="text-xs text-slate-500 truncate">{l.title} at {l.company}</div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="font-bold text-brand">{l.score}</div>
              <div className="text-[11px] text-slate-500">Score</div>
            </div>
            <div className="text-right hidden md:block">
              <div className="font-semibold">{fmt(l.dealValue)}</div>
              <div className="text-[11px] text-slate-500">Value</div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border hidden lg:inline ${priorityColors[l.priority]}`}>{l.priority}</span>
            <span className={l.momentum === 'rising' ? 'text-brand' : l.momentum === 'declining' ? 'text-red-400' : 'text-yellow-400'}>
              {l.momentum === 'rising' ? <ArrowUp size={16} /> : l.momentum === 'declining' ? <ArrowDown size={16} /> : <Minus size={16} />}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
