import React, { useState } from 'react';
import { X, Phone, Mail, Calendar, Globe, Building2, AlertCircle, Copy, ArrowUpRight, TrendingUp, Target, Shield, Zap, Star, ChevronRight } from 'lucide-react';
import { useStore, fmt } from '../hooks/useStore';

const priorityColors = {
  critical: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  high: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  medium: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  low: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
};
const statusColors = {
  won: 'bg-emerald-500/15 text-emerald-400', lost: 'bg-red-500/15 text-red-400',
  negotiation: 'bg-yellow-500/15 text-yellow-400', proposal: 'bg-purple-500/15 text-purple-400',
  qualified: 'bg-blue-500/15 text-blue-400', contacted: 'bg-cyan-500/15 text-cyan-400',
  new: 'bg-slate-500/15 text-slate-400',
};

export default function LeadDetail() {
  const { selectedLead: lead, setDetailOpen, setSelectedLead } = useStore();
  const [tab, setTab] = useState('overview');
  const close = () => { setDetailOpen(false); setSelectedLead(null); };
  if (!lead) return null;
  const pc = priorityColors[lead.priority] || priorityColors.medium;

  return (
    <div className="fixed inset-0 z-50" style={{ animation: 'slideInRight 0.3s ease-out' }}>
      <div className="absolute inset-0 bg-black/50" onClick={close} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-surface-0 border-l border-white/5 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/5 bg-surface-1">
          <div className="flex justify-between mb-4">
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-xl bg-brand/15 flex items-center justify-center text-brand font-bold text-lg">
                {lead.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-xl font-bold">{lead.name}</h2>
                <p className="text-slate-400 text-sm">{lead.title} at {lead.company}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pc.bg} ${pc.text} border ${pc.border}`}>{lead.priority}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>{lead.status}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand/15 text-brand">Rank #{lead.ranking.overall}</span>
                </div>
              </div>
            </div>
            <button onClick={close} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"><X size={20} /></button>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-black font-medium text-sm"><Phone size={14} />Call</button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 border border-white/10 text-sm"><Mail size={14} />Email</button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 border border-white/10 text-sm"><Calendar size={14} />Schedule</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          {['overview', 'scripts', 'outreach', 'packages'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${tab === t ? 'text-brand border-b-2 border-brand' : 'text-slate-500 hover:text-slate-300'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'overview' && (
            <>
              {/* Scores */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-3 rounded-xl p-4 border border-white/5">
                  <div className="text-slate-500 text-xs mb-1">Lead Score</div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-brand">{lead.score}</span>
                    <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden"><div className="h-full bg-brand rounded-full transition-all" style={{ width: `${lead.score}%` }} /></div>
                  </div>
                </div>
                <div className="bg-surface-3 rounded-xl p-4 border border-white/5">
                  <div className="text-slate-500 text-xs mb-1">Deal Value</div>
                  <div className="text-2xl font-bold">{fmt(lead.dealValue)}</div>
                </div>
                <div className="bg-surface-3 rounded-xl p-4 border border-white/5">
                  <div className="text-slate-500 text-xs mb-1">Conversion Probability</div>
                  <div className="text-2xl font-bold text-cyan-400">{lead.conversionProbability}%</div>
                </div>
                <div className="bg-surface-3 rounded-xl p-4 border border-white/5">
                  <div className="text-slate-500 text-xs mb-1">Best Method</div>
                  <div className="text-lg font-bold text-purple-400">{lead.bestMethod}</div>
                </div>
              </div>

              {/* Rankings */}
              <div className="bg-surface-3 rounded-xl p-4 border border-white/5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Target size={16} className="text-brand" />Rankings & Scores</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><span className="text-slate-500 block">Overall</span><span className="font-bold">#{lead.ranking.overall}</span></div>
                  <div><span className="text-slate-500 block">Industry</span><span className="font-bold">#{lead.ranking.byIndustry}</span></div>
                  <div><span className="text-slate-500 block">Fit Score</span><span className="font-bold text-brand">{lead.ranking.fitScore}</span></div>
                  <div><span className="text-slate-500 block">Intent Score</span><span className="font-bold text-cyan-400">{lead.ranking.intentScore}</span></div>
                  <div><span className="text-slate-500 block">Engagement</span><span className="font-bold">{lead.ranking.engagement}</span></div>
                  <div><span className="text-slate-500 block">Timeline</span><span className="font-bold">{lead.decisionTimeline}</span></div>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-surface-3 rounded-xl p-4 border border-white/5">
                <h3 className="font-semibold mb-3">Contact Info</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-3"><Mail size={14} className="text-slate-500" /><span className="text-brand">{lead.email}</span></div>
                  <div className="flex items-center gap-3"><Phone size={14} className="text-slate-500" /><span>{lead.phone}</span></div>
                  <div className="flex items-center gap-3"><Globe size={14} className="text-slate-500" /><span className="text-brand">{lead.website}</span></div>
                  <div className="flex items-center gap-3"><Building2 size={14} className="text-slate-500" /><span>{lead.location}</span></div>
                </div>
              </div>

              {/* Company */}
              <div className="bg-surface-3 rounded-xl p-4 border border-white/5">
                <h3 className="font-semibold mb-3">Company Intel</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500 block">Employees</span><span className="font-medium">{lead.employees.toLocaleString()}</span></div>
                  <div><span className="text-slate-500 block">Revenue</span><span className="font-medium">{fmt(lead.revenue)}</span></div>
                  <div><span className="text-slate-500 block">Industry</span><span className="font-medium">{lead.industry}</span></div>
                  <div><span className="text-slate-500 block">Tech Stack</span><span className="font-medium">{lead.techStack}</span></div>
                  <div className="col-span-2"><span className="text-slate-500 block">Using Competitors</span><span className="font-medium">{lead.competitorUsing}</span></div>
                </div>
              </div>

              {/* Pain Points */}
              <div className="bg-surface-3 rounded-xl p-4 border border-white/5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertCircle size={16} className="text-yellow-400" />Pain Points</h3>
                {lead.painPoints.map((p, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm mb-2.5 last:mb-0"><AlertCircle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" /><span className="text-slate-300">{p}</span></div>
                ))}
              </div>

              {/* Buying Signals */}
              <div className="bg-surface-3 rounded-xl p-4 border border-white/5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Zap size={16} className="text-brand" />Buying Signals</h3>
                <div className="flex flex-wrap gap-2">
                  {lead.buyingSignals.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-brand/10 text-brand border border-brand/20">{s}</span>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'scripts' && (
            <>
              <div className="bg-surface-3 rounded-xl p-4 border border-white/5">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Phone size={16} className="text-brand" />Call Script</h3>
                {[
                  { label: 'Opener', content: lead.callScript.opener },
                  ...lead.callScript.discovery.map((q, i) => ({ label: `Discovery Q${i + 1}`, content: q })),
                  { label: 'Pitch', content: lead.callScript.pitch },
                  { label: 'Close', content: lead.callScript.close },
                ].map((s, i) => (
                  <div key={i} className="mb-3 last:mb-0">
                    <div className="text-xs text-brand uppercase font-medium tracking-wider mb-1">{s.label}</div>
                    <p className="bg-surface-2 p-3 rounded-lg text-sm text-slate-300">{s.content}</p>
                  </div>
                ))}
              </div>
              <div className="bg-surface-3 rounded-xl p-4 border border-white/5">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield size={16} className="text-yellow-400" />Objection Handling</h3>
                {lead.objections.map((o, i) => (
                  <div key={i} className="border-l-2 border-brand/30 pl-4 mb-4 last:mb-0">
                    <div className="text-sm text-red-400 font-medium mb-1">"{o.objection}"</div>
                    <div className="text-sm text-slate-400">{o.response}</div>
                  </div>
                ))}
              </div>
              {lead.callScript.valueProps && (
                <div className="bg-surface-3 rounded-xl p-4 border border-white/5">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Star size={16} className="text-brand" />Value Propositions</h3>
                  {lead.callScript.valueProps.map((v, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300 mb-2"><ChevronRight size={14} className="text-brand" />{v}</div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'outreach' && lead.outreach.map((o, i) => (
            <div key={i} className="bg-surface-3 rounded-xl p-4 border border-white/5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold flex items-center gap-2"><Mail size={16} className="text-brand" />{o.type}</h3>
                <button onClick={() => navigator.clipboard.writeText(o.template)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-white/10 text-xs text-slate-400 hover:text-white transition-colors">
                  <Copy size={12} />Copy
                </button>
              </div>
              <pre className="bg-surface-0 p-4 rounded-lg text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{o.template}</pre>
            </div>
          ))}

          {tab === 'packages' && lead.packages.map((pkg, i) => (
            <div key={i} className={`bg-surface-3 rounded-xl p-4 border ${pkg.recommended ? 'border-brand/40 ring-1 ring-brand/20' : 'border-white/5'} relative`}>
              {pkg.recommended && <div className="absolute -top-2.5 left-4 px-3 py-0.5 bg-brand text-black text-xs font-bold rounded-full">RECOMMENDED</div>}
              <div className="flex justify-between items-start mb-3 mt-1">
                <div><h3 className="font-bold text-lg">{pkg.name}</h3></div>
                <div className="text-right"><span className="text-2xl font-bold">{fmt(pkg.price)}</span><span className="text-slate-500 text-sm">/mo</span></div>
              </div>
              <div className="space-y-2">
                {pkg.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm"><Star size={14} className="text-brand flex-shrink-0" /><span className="text-slate-300">{f}</span></div>
                ))}
              </div>
              <button className={`w-full mt-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${pkg.recommended ? 'bg-brand text-black' : 'bg-surface-2 border border-white/10 text-slate-300 hover:bg-white/10'}`}>
                {pkg.recommended ? 'Get Started' : 'Learn More'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
