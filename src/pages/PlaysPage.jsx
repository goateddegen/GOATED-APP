import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Target, Zap, Trophy, ArrowRight, CheckCircle2, Users, TrendingUp, Star, Shield, ChevronDown, ChevronUp } from 'lucide-react';

const plays = [
  { name: 'Warm Intro Sequence', difficulty: 'easy', rate: 68, steps: 5, time: '3 days', leads: 847, description: 'Leverage mutual connections for warm introductions. Highest conversion rate for enterprise deals.', color: '#10b981',
    steps_detail: ['Research mutual connections on LinkedIn', 'Draft personalized intro request', 'Follow up with value-add content', 'Schedule discovery call', 'Send customized proposal'] },
  { name: 'Value Bomb Outreach', difficulty: 'medium', rate: 52, steps: 7, time: '5 days', leads: 623, description: 'Lead with extreme value — free audits, reports, and insights that make ignoring you impossible.', color: '#f59e0b',
    steps_detail: ['Build custom industry report for target', 'Send free audit/analysis via email', 'Follow up with LinkedIn connection', 'Share additional insights in DM', 'Propose strategy call', 'Present ROI analysis', 'Close with urgency trigger'] },
  { name: 'Multi-Touch Blitz', difficulty: 'hard', rate: 45, steps: 12, time: '14 days', leads: 412, description: 'Coordinated attack across email, LinkedIn, phone, and social. For high-value targets only.', color: '#ef4444',
    steps_detail: ['LinkedIn profile view + connect', 'Day 1: Cold email with hook', 'Day 2: LinkedIn DM follow-up', 'Day 3: Comment on their content', 'Day 5: Cold call attempt #1', 'Day 7: Email #2 with case study', 'Day 8: LinkedIn voice note', 'Day 10: Call attempt #2', 'Day 11: Email #3 breakup teaser', 'Day 12: Final LinkedIn message', 'Day 13: Phone + email same day', 'Day 14: Breakup email'] },
  { name: 'Social Selling Sprint', difficulty: 'medium', rate: 55, steps: 8, time: '7 days', leads: 534, description: 'Build authority and rapport through content engagement before making the ask.', color: '#a855f7',
    steps_detail: ['Engage with target content daily', 'Share relevant industry insight', 'Comment thoughtfully on posts', 'Send connection request', 'Share exclusive content in DM', 'Propose value exchange', 'Schedule informal chat', 'Transition to business discussion'] },
  { name: 'Referral Chain Reaction', difficulty: 'easy', rate: 72, steps: 4, time: '2 days', leads: 298, description: 'Turn every closed deal into 3+ warm referrals. The compounding machine.', color: '#06b6d4',
    steps_detail: ['Send post-close NPS survey', 'Ask for 3 specific referrals', 'Send pre-written referral templates', 'Follow up on each referral within 24hrs'] },
  { name: 'Event-Triggered Outreach', difficulty: 'medium', rate: 58, steps: 6, time: '1 day', leads: 756, description: 'Strike when buying signals are hot — funding rounds, job changes, tech migrations.', color: '#ec4899',
    steps_detail: ['Set up event monitoring alerts', 'Research triggering event context', 'Craft hyper-relevant message', 'Send within 24hrs of event', 'Follow up with relevant resource', 'Schedule meeting'] },
];

const diffColors = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

export default function PlaysPage() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Play size={28} className="text-brand" />
        <div><h1 className="text-2xl font-bold">Live Plays</h1><p className="text-slate-500">Proven playbooks with step-by-step execution</p></div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Plays', value: plays.length, icon: Play },
          { label: 'Avg Success Rate', value: `${Math.round(plays.reduce((s, p) => s + p.rate, 0) / plays.length)}%`, icon: Trophy },
          { label: 'Active Leads', value: plays.reduce((s, p) => s + p.leads, 0).toLocaleString(), icon: Users },
          { label: 'Best Play', value: '72%', icon: Star },
        ].map((s, i) => (
          <div key={i} className="bg-surface-3 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><s.icon size={14} />{s.label}</div>
            <div className="text-xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Plays Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {plays.map((p, i) => (
          <motion.div key={i}
            className="bg-surface-3 rounded-xl border border-white/5 overflow-hidden card-hover"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: `${p.color}15`, color: p.color }}>
                    #{i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: `${diffColors[p.difficulty]}15`, color: diffColors[p.difficulty] }}>{p.difficulty}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} />{p.time}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Target size={12} />{p.steps} steps</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-400 mb-4">{p.description}</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface-2 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">Success Rate</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-surface-0 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${p.rate}%`, background: p.color }} /></div>
                    <span className="font-bold text-sm" style={{ color: p.color }}>{p.rate}%</span>
                  </div>
                </div>
                <div className="bg-surface-2 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">Active Leads</div>
                  <div className="font-bold">{p.leads.toLocaleString()}</div>
                </div>
              </div>

              <button onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-slate-200 transition-colors mb-3">
                <span>View steps</span>
                {expanded === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {expanded === i && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 mb-4 border-t border-white/5 pt-3">
                  {p.steps_detail.map((step, j) => (
                    <div key={j} className="flex items-start gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 mt-0.5">{j + 1}</div>
                      <span className="text-slate-300">{step}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors" style={{ background: `${p.color}15`, color: p.color }}>
                <Zap size={16} />Execute Play <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
