import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Users, Search, Download, Phone, Mail, ArrowUp, ArrowDown,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Loader2, DollarSign, TrendingUp, Building2, Zap, Send, Sparkles,
  Linkedin, Clock, Flame, Brain, MessageSquare, Bot, Wand2, Filter,
  Target, Star, Eye, Copy, X, Activity, CheckCircle,
  Crown, PhoneCall, CalendarClock, Timer, UserSearch, Table2,
  CheckSquare, Square, ExternalLink, MapPin, Crosshair, AlertTriangle,
} from 'lucide-react';
import { useStore, fmt, priorities, statuses, industries } from '../hooks/useStore';

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

const perPageOptions = [25, 50, 100];

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

function getOutreachTemplates(lead) {
  const firstName = (lead.name || 'Unknown').split(' ')[0];
  return {
    email: { subject: `Quick question about ${lead.company}'s growth`, body: `Hi ${firstName},\n\nI noticed ${lead.company} is doing great things in ${lead.industry}. I help similar companies increase revenue by 20-40% through optimized digital presence.\n\nWould you be open to a quick 15-min call this week?\n\nBest,\n[Your Name]` },
    linkedin: `Hi ${firstName}, I came across ${lead.company} and was impressed by your work in ${lead.industry}. I help companies like yours unlock hidden revenue. Would love to connect.`,
    sms: `Hi ${firstName}, this is [Your Name] from GOATED. I have insights on how ${lead.company} could capture more revenue in ${lead.industry}. Worth a quick chat? Reply YES.`,
    call: `Hi ${firstName}, this is [Your Name]. I work with companies in ${lead.industry} and noticed opportunities for ${lead.company} to capture additional revenue. Do you have a few minutes?`,
  };
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
// AI Chat Prompt Parser
// ---------------------------------------------------------------------------
function parseAIPrompt(prompt) {
  const text = prompt.toLowerCase();
  const filters = { industry: null, status: null, priority: null, minScore: 0, maxScore: 100, minDeal: 0, maxDeal: Infinity, location: null, title: null, source: null, momentum: null, search: null, sort: null, order: null };
  const understood = [];

  const industryList = ['SaaS', 'Fintech', 'E-commerce', 'Healthcare', 'EdTech', 'Cybersecurity', 'AI/ML', 'DevTools', 'MarTech', 'PropTech', 'InsurTech', 'LegalTech', 'CleanTech', 'BioTech', 'MedTech', 'FoodTech', 'HRTech', 'AdTech', 'Logistics', 'Gaming', 'Media', 'Retail', 'Construction', 'Travel', 'Fashion', 'Energy', 'Automotive', 'Aerospace', 'Sports'];
  for (const ind of industryList) {
    if (text.includes(ind.toLowerCase())) { filters.industry = ind; understood.push(`Industry: ${ind}`); break; }
  }
  for (const s of statuses) { if (text.includes(s)) { filters.status = s; understood.push(`Status: ${s}`); break; } }
  for (const p of priorities) { if (text.includes(p)) { filters.priority = p; understood.push(`Priority: ${p}`); break; } }

  const scoreMatch = text.match(/(?:score|rating)\s*(?:>=?|above|over|>)\s*(\d+)/);
  if (scoreMatch) { filters.minScore = parseInt(scoreMatch[1]); understood.push(`Score >= ${scoreMatch[1]}`); }
  const dealMatch = text.match(/(?:\$|deal|value)\s*(?:>=?|above|over|>)\s*\$?(\d+)k?/i);
  if (dealMatch) { const v = parseInt(dealMatch[1]); filters.minDeal = v < 1000 ? v * 1000 : v; understood.push(`Deal >= $${(filters.minDeal / 1000).toFixed(0)}K`); }

  const cities = ['san francisco', 'new york', 'austin', 'chicago', 'seattle', 'miami', 'boston', 'denver', 'los angeles', 'london', 'toronto', 'berlin', 'singapore', 'sydney', 'tokyo'];
  for (const city of cities) { if (text.includes(city)) { filters.location = city; understood.push(`Location: ${city}`); break; } }

  const roles = [{ kw: ['ceo', 'founder', 'chief executive'], val: 'CEO' }, { kw: ['cto', 'chief technology', 'tech lead'], val: 'CTO' }, { kw: ['cmo', 'marketing'], val: 'CMO' }, { kw: ['vp', 'vice president'], val: 'VP' }, { kw: ['director'], val: 'Director' }];
  for (const r of roles) { for (const kw of r.kw) { if (text.includes(kw)) { filters.title = r.val; understood.push(`Role: ${r.val}`); break; } } if (filters.title) break; }

  if (text.includes('hot') || text.includes('best') || text.includes('top')) { filters.minScore = Math.max(filters.minScore, 80); if (!understood.some(u => u.startsWith('Score'))) understood.push('Score >= 80 (hot leads)'); }
  if (text.includes('closing') || text.includes('close') || text.includes('negotiat')) { filters.status = 'negotiation'; understood.push('Status: negotiation'); }
  if (text.includes('highest value') || text.includes('biggest deal')) { filters.sort = 'dealValue'; filters.order = 'desc'; understood.push('Sort: highest deal value'); }

  if (understood.length === 0 && text.trim()) { filters.search = prompt.trim(); }

  return { filters, understood };
}

const PRESET_PROMPTS = [
  { label: 'Hot Leads', prompt: 'Show me hot leads with score above 85', icon: Flame },
  { label: 'Ready to Close', prompt: 'Show leads in negotiation status ready to close', icon: Target },
  { label: 'Big Deals', prompt: 'Show highest value deals above $25K', icon: DollarSign },
  { label: 'SaaS CEOs', prompt: 'SaaS founders and CEOs with high scores', icon: Crown },
  { label: 'This Week', prompt: 'Leads with decision timeline this week', icon: Timer },
];

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
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
// VoIP Quick Dialer (simplified)
// ---------------------------------------------------------------------------
function VoIPDialer({ lead, phone, onClose, showToast }) {
  const [callState, setCallState] = useState('idle');
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (callState === 'active') { timerRef.current = setInterval(() => setDuration(d => d + 1), 1000); }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  const fmtDur = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm mx-4 bg-[#0a0a0a] rounded-2xl border border-white/[0.08] shadow-2xl p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-brand/15 flex items-center justify-center mx-auto mb-3">
          <Phone size={28} className={callState === 'active' ? 'text-emerald-400' : 'text-brand'} />
        </div>
        <div className="text-lg font-bold text-white mb-1">{lead.name}</div>
        <div className="text-sm text-slate-400 mb-1">{lead.company}</div>
        <div className="text-lg font-mono text-brand mb-4">{phone}</div>

        {callState === 'idle' && (
          <div className="space-y-2">
            <button onClick={() => {
              if (/Mobi|Android/i.test(navigator.userAgent)) { window.open(`tel:${phone.replace(/[^\d+]/g, '')}`, '_self'); return; }
              setCallState('ringing'); setTimeout(() => setCallState('active'), 2000);
            }} className="w-full py-3 rounded-xl bg-brand text-black font-bold text-sm hover:bg-brand/90 transition-colors flex items-center justify-center gap-2">
              <PhoneCall size={16} /> Start Call
            </button>
            <button onClick={() => { navigator.clipboard.writeText(phone); showToast('Phone number copied'); }}
              className="w-full py-2.5 rounded-xl bg-surface-2 text-slate-300 text-sm hover:bg-surface-1 transition-colors flex items-center justify-center gap-2">
              <Copy size={14} /> Copy Number
            </button>
          </div>
        )}
        {callState === 'ringing' && <div className="text-amber-400 font-medium animate-pulse">Ringing...</div>}
        {callState === 'active' && (
          <div>
            <div className="text-2xl font-mono text-emerald-400 mb-3">{fmtDur(duration)}</div>
            <button onClick={() => { clearInterval(timerRef.current); setCallState('idle'); showToast(`Call ended — ${fmtDur(duration)}`); onClose(); }}
              className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-sm">End Call</button>
          </div>
        )}
        <button onClick={onClose} className="mt-3 text-xs text-slate-500 hover:text-white">Close</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schedule Modal (simplified)
// ---------------------------------------------------------------------------
function ScheduleModal({ lead, onClose, showToast }) {
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm mx-4 bg-[#0a0a0a] rounded-2xl border border-white/[0.08] shadow-2xl p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-white">Schedule Follow-up</div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16} /></button>
        </div>
        <div className="text-xs text-slate-400 mb-3">{lead.name} &middot; {lead.company}</div>
        <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
          className="w-full px-3 py-2.5 mb-3 bg-surface-2 border border-white/[0.06] rounded-xl text-sm text-white outline-none focus:border-brand/40" />
        <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)"
          className="w-full px-3 py-2.5 mb-4 bg-surface-2 border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-brand/40" />
        <button onClick={() => { if (!date) return; showToast(`Follow-up scheduled for ${lead.name}`); onClose(); }}
          className="w-full py-2.5 rounded-xl bg-brand text-black font-bold text-sm disabled:opacity-40" disabled={!date}>
          Schedule
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Close Coach Panel (inline per-lead)
// ---------------------------------------------------------------------------
function CloseCoachRow({ lead, index, colSpan, onCallClick, showToast }) {
  const prob = getCloseProbability(lead, index);
  const strategy = getCloseStrategy(lead, prob);
  const painPoints = getLeadPainPoints(lead);
  const templates = getOutreachTemplates(lead);
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
                <span className="text-brand font-bold">{fmt(Math.round((lead.dealValue || 0) * 0.12))}</span>
              </div>
            </div>

            {/* Quick Outreach */}
            <div className="bg-black/30 rounded-xl p-4 border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-3">
                <Send size={14} className="text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Quick Outreach</span>
              </div>
              <div className="space-y-2 mb-3">
                <button onClick={() => intel.phone ? onCallClick(lead, intel.phone) : showToast('Connect Apollo.io API key to enrich contact data')}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors text-left">
                  <Phone size={13} /> {intel.phone || 'Enrich to unlock phone'}
                </button>
                <button onClick={() => setActiveOutreach(activeOutreach === 'email' ? null : 'email')}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-medium text-purple-400 hover:bg-purple-500/20 transition-colors text-left">
                  <Mail size={13} /> Email Template
                </button>
                <button onClick={() => setActiveOutreach(activeOutreach === 'linkedin' ? null : 'linkedin')}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-colors text-left">
                  <Linkedin size={13} /> LinkedIn Message
                </button>
                <button onClick={() => setActiveOutreach(activeOutreach === 'sms' ? null : 'sms')}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors text-left">
                  <MessageSquare size={13} /> SMS Template
                </button>
              </div>
              {activeOutreach && (
                <div className="bg-surface-2 rounded-lg p-3 border border-white/[0.04]">
                  <div className="text-xs text-slate-300 whitespace-pre-wrap max-h-24 overflow-y-auto mb-2">
                    {activeOutreach === 'email' ? templates.email.body : templates[activeOutreach]}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(activeOutreach === 'email' ? templates.email.body : templates[activeOutreach]); showToast('Copied to clipboard'); }}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-brand/15 text-brand text-[10px] font-bold hover:bg-brand/25 transition-colors">
                      <Copy size={10} /> Copy
                    </button>
                    {activeOutreach === 'email' && (
                      <a href={`mailto:${lead.email}?subject=${encodeURIComponent(templates.email.subject)}&body=${encodeURIComponent(templates.email.body)}`}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-purple-500 text-white text-[10px] font-bold hover:bg-purple-600 transition-colors">
                        <Mail size={10} /> Send
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
                <div className="flex justify-between"><span className="text-slate-500">Deal Value</span><span className="text-brand font-bold">{fmt(lead.dealValue || 0)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Score</span><span className={`font-bold ${scoreColor(lead.score)}`}>{lead.score}/100</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Timeline</span><span className="text-white">{lead.decisionTimeline || '--'}</span></div>
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
  const {
    search, setSearch, filterPriority, setFilterPriority, filterStatus, setFilterStatus,
    leadsPage, setLeadsPage, leadsPerPage, setLeadsPerPage,
    sortField, setSortField, sortDirection, setSortDirection,
    leads: allLeads, getLeads, degenMode,
  } = useStore();

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  useEffect(() => { if (!allLeads) getLeads(); }, [allLeads, getLeads]);
  const activeLeads = allLeads || [];

  // Core state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const showToast = useCallback((msg) => { setToastMsg(msg); setToastVisible(true); }, []);
  const [visibleCount, setVisibleCount] = useState(50);

  // Modals
  const [voipLead, setVoipLead] = useState(null);
  const [voipPhone, setVoipPhone] = useState('');
  const [scheduleLead, setScheduleLead] = useState(null);

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
      if (filters.search && !(l.name.toLowerCase().includes(filters.search.toLowerCase()) || l.company.toLowerCase().includes(filters.search.toLowerCase()))) continue;
      matchCount++;
      pipeline += l.dealValue || 0;
      totalScore += l.score;
      if (topLeads.length < 5) topLeads.push({ name: l.name, company: l.company, score: l.score, dealValue: l.dealValue, status: l.status, industry: l.industry });
    }
    const avgScore = matchCount > 0 ? Math.round(totalScore / matchCount) : 0;
    const quickMsg = understood.length > 0
      ? `Found ${matchCount.toLocaleString()} leads. Pipeline: ${fmt(pipeline)}, avg score: ${avgScore}.`
      : `Searched "${text}" \u2014 ${matchCount.toLocaleString()} results.`;
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

  // Filtered + sorted leads
  const allFilteredLeads = useMemo(() => {
    const searchLower = search.toLowerCase();
    let filtered = [...activeLeads];

    filtered = filtered.filter(l => {
      const matchSearch = !search || l.name.toLowerCase().includes(searchLower) || l.company.toLowerCase().includes(searchLower) || l.industry.toLowerCase().includes(searchLower);
      const matchPriority = filterPriority === 'all' || l.priority === filterPriority;
      const matchStatus = filterStatus === 'all' || l.status === filterStatus;
      return matchSearch && matchPriority && matchStatus;
    });

    if (aiFilters) {
      filtered = filtered.filter(l => {
        if (aiFilters.industry && l.industry !== aiFilters.industry) return false;
        if (aiFilters.minScore && l.score < aiFilters.minScore) return false;
        if (aiFilters.minDeal && l.dealValue < aiFilters.minDeal) return false;
        if (aiFilters.maxDeal < Infinity && l.dealValue > aiFilters.maxDeal) return false;
        if (aiFilters.location && !l.location?.toLowerCase().includes(aiFilters.location.toLowerCase())) return false;
        if (aiFilters.title && !l.title?.toLowerCase().includes(aiFilters.title.toLowerCase())) return false;
        return true;
      });
    }

    // Sort by close probability * deal value (money-first ordering)
    filtered.sort((a, b) => {
      const sf = aiFilters?.sort || sortField;
      const dir = (aiFilters?.order || sortDirection) === 'asc' ? 1 : -1;
      const aVal = a[sf]; const bVal = b[sf];
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
      return String(aVal || '').localeCompare(String(bVal || '')) * dir;
    });

    return filtered;
  }, [activeLeads, search, filterPriority, filterStatus, aiFilters, sortField, sortDirection]);

  const filteredLeads = useMemo(() => allFilteredLeads.slice(0, visibleCount), [allFilteredLeads, visibleCount]);
  const totalFiltered = allFilteredLeads.length;
  const leads = filteredLeads;
  const hasMore = visibleCount < totalFiltered;

  // Pipeline stats
  const stats = useMemo(() => {
    const total = activeLeads.length;
    const pipeline = activeLeads.reduce((s, l) => s + (l.dealValue || 0), 0);
    const commission = Math.round(pipeline * 0.12);
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

  const handleCallClick = useCallback((lead, phone) => { setVoipLead(lead); setVoipPhone(phone || ''); }, []);

  const toggleRow = useCallback((id) => {
    setExpandedRows(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, []);

  const toggleSelect = useCallback((id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, []);

  const handleExport = useCallback(() => {
    const selected = leads.filter(l => selectedIds.has(l.id));
    const data = selected.length > 0 ? selected : leads;
    const csv = [
      ['Name', 'Email', 'Company', 'Score', 'Value', 'Priority', 'Status', 'Industry', 'Location'].join(','),
      ...data.map(l => [l.name, l.email, l.company, l.score, l.dealValue || 0, l.priority, l.status, l.industry, l.location].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `leads-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast(`${data.length} leads exported`);
  }, [leads, selectedIds, showToast]);

  const handleSelectLead = useCallback((lead) => { if (onSelect) onSelect(lead); }, [onSelect]);

  const allOnPageSelected = leads.length > 0 && leads.every(l => selectedIds.has(l.id));

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <Toast message={toastMsg} visible={toastVisible} onDone={() => setToastVisible(false)} />

      {/* Modals */}
      {voipLead && <VoIPDialer lead={voipLead} phone={voipPhone} onClose={() => setVoipLead(null)} showToast={showToast} />}
      {scheduleLead && <ScheduleModal lead={scheduleLead} onClose={() => setScheduleLead(null)} showToast={showToast} />}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            {degenMode ? <><Flame size={24} className="text-orange-400" /> DEGEN Closer</> : <><Target size={24} className="text-brand" /> Closing Pipeline</>}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {totalFiltered.toLocaleString()} leads {aiFilters ? '(filtered)' : ''} &middot; Close deals, earn 12% commission
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setAiChatOpen(!aiChatOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${aiChatOpen ? 'bg-brand/15 border-brand/30 text-brand' : 'bg-surface-2 border-white/[0.05] text-slate-400 hover:text-white'}`}>
            <Brain size={14} /> AI Search
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2 border border-white/[0.05] text-sm text-slate-400 hover:text-white transition-colors">
            <Download size={14} /> {selectedIds.size > 0 ? `Export ${selectedIds.size}` : 'Export'}
          </button>
        </div>
      </div>

      {/* ── Pipeline Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><DollarSign size={14} /> Pipeline Value</div>
          <div className="text-xl font-bold text-white">{fmt(stats.pipeline)}</div>
        </div>
        <div className="bg-surface-3 rounded-xl p-4 border border-emerald-500/10">
          <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1"><DollarSign size={14} /> Your Commission</div>
          <div className="text-xl font-bold text-emerald-400">{fmt(stats.commission)}</div>
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
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand/10 border border-brand/20">
            <span className="text-xs font-medium text-brand">{selectedIds.size} selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="text-slate-500 hover:text-white"><X size={12} /></button>
          </div>
        )}
      </div>

      {/* ── Lead Table ── */}
      <div className="bg-surface-3 rounded-xl border border-white/[0.03] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.03]">
                <th className="px-3 py-3 text-left w-10">
                  <button onClick={() => { if (allOnPageSelected) setSelectedIds(new Set()); else setSelectedIds(new Set(leads.map(l => l.id))); }}
                    className="text-slate-500 hover:text-white">
                    {allOnPageSelected ? <CheckSquare size={15} className="text-brand" /> : <Square size={15} />}
                  </button>
                </th>
                <SortHeader field="name" label="Lead" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortHeader field="company" label="Company" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortHeader field="score" label="Score" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortHeader field="dealValue" label="Deal Value" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <th className="px-3 py-3 text-left text-xs text-emerald-400 font-medium uppercase tracking-wider">Close %</th>
                <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium uppercase tracking-wider hidden lg:table-cell">Timeline</th>
                <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l, i) => {
                const isSelected = selectedIds.has(l.id);
                const isExpanded = expandedRows.has(l.id);
                const prob = getCloseProbability(l, i);
                const dv = l.dealValue || 0;
                const isHot = l.score >= 85;
                return (
                  <React.Fragment key={l.id}>
                    <tr onClick={() => handleSelectLead(l)}
                      className={`border-b border-white/[0.02] cursor-pointer hover:bg-white/[0.02] transition-colors ${isSelected ? 'bg-brand/5' : ''} ${isExpanded ? 'bg-brand/[0.03]' : ''}`}>
                      <td className="px-3 py-2.5" onClick={e => toggleSelect(l.id, e)}>
                        {isSelected ? <CheckSquare size={15} className="text-brand" /> : <Square size={15} className="text-slate-600" />}
                      </td>

                      {/* Lead */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isHot ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-brand/15 text-brand'}`}>
                            {l.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-sm truncate">{l.name}</span>
                              {isHot && <span className="px-1 py-0 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"><Flame size={8} className="inline" /> HOT</span>}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{l.title}</div>
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

                      {/* Deal Value */}
                      <td className="px-3 py-2.5">
                        <div className="font-mono text-sm text-white">{fmt(dv)}</div>
                        <div className="text-[10px] text-emerald-400/60">{fmt(Math.round(dv * 0.12))} comm.</div>
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

                      {/* Timeline */}
                      <td className="px-3 py-2.5 hidden lg:table-cell">
                        <span className={`text-[11px] font-medium ${l.decisionTimeline === 'This week' ? 'text-emerald-400' : l.decisionTimeline === '2 weeks' ? 'text-amber-400' : 'text-slate-500'}`}>
                          {l.decisionTimeline || '--'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5">
                        <div className="flex gap-0.5">
                          <button onClick={e => { e.stopPropagation(); const intel = getContactIntel(l, i); intel.phone ? handleCallClick(l, intel.phone) : showToast('Connect Apollo.io to unlock contact data'); }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title={l.phone ? 'Call' : 'Enrich to unlock'}>
                            <Phone size={13} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); setScheduleLead(l); }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Schedule">
                            <CalendarClock size={13} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); toggleRow(l.id); }}
                            className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'text-brand bg-brand/10' : 'text-slate-500 hover:text-brand hover:bg-brand/10'}`} title="Close Coach">
                            <Crosshair size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && <CloseCoachRow lead={l} index={i} colSpan={9} onCallClick={handleCallClick} showToast={showToast} />}
                  </React.Fragment>
                );
              })}
              {leads.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500 text-sm">
                  {aiFilters ? 'No leads match your AI query. Try different criteria.' : 'No leads match your filters.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Load More / Pagination */}
        <div className="px-4 py-3 border-t border-white/[0.03] flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Showing {leads.length.toLocaleString()} of {totalFiltered.toLocaleString()}
          </span>
          <div className="flex items-center gap-3">
            {hasMore && (
              <button onClick={() => setVisibleCount(prev => Math.min(prev + 50, totalFiltered))}
                className="px-4 py-2 rounded-lg bg-brand/15 border border-brand/25 text-sm font-medium text-brand hover:bg-brand/25 transition-colors">
                Load More ({Math.min(50, totalFiltered - visibleCount)} more)
              </button>
            )}
            <select value={leadsPerPage} onChange={e => setLeadsPerPage(Number(e.target.value))}
              className="px-2 py-1 bg-surface-1 border border-white/[0.03] rounded text-sm text-white outline-none">
              {perPageOptions.map(n => <option key={n} value={n}>{n}/page</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
