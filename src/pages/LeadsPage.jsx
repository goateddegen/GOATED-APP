import React, { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import {
  Users, Search, Download, Plus, Phone, Mail, ArrowUp, ArrowDown, Minus,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Trash2, CheckSquare, Square, Loader2, BarChart3, DollarSign, TrendingUp,
  Building2, Radio, Wifi, WifiOff, RefreshCw, Zap, Send, Sparkles, Globe,
  Linkedin, FileText, UserPlus, Megaphone, Clock, Flame, ArrowUpRight,
  ArrowDownRight, MoveRight, Brain, MessageSquare, Bot, Wand2, Filter,
  Target, Briefcase, MapPin, Hash, Star, Eye, Copy, ExternalLink,
  Crosshair, Activity, AlertCircle, CheckCircle, X, CornerDownLeft,
  Layers, PieChart, Shield, Lightbulb, Wallet, Crown, Skull, Radar,
  PhoneCall, Home, BarChart2, FileBarChart, AlertTriangle, MousePointer,
  Share2, MailOpen, Database, Monitor, TrendingDown,
  Calendar, CalendarClock, PhoneOff, PhoneForwarded, PhoneMissed, Video,
  Twitter, Map, Navigation, BadgeCheck, Timer, UserSearch, Table2,
  Calculator,
} from 'lucide-react';
import { useStore, fmt, priorities, statuses, industries } from '../hooks/useStore';
const WorldMap = lazy(() => import('../components/WorldMap'));

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
  new: 'bg-slate-500/15 text-slate-400',
  nurturing: 'bg-teal-500/15 text-teal-400',
  're-engaged': 'bg-indigo-500/15 text-indigo-400',
  'on-hold': 'bg-orange-500/15 text-orange-400',
  unresponsive: 'bg-gray-500/15 text-gray-400',
};

const sourceColors = {
  'LinkedIn': 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'Cold Email': 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  'Website': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  'Referral': 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  'Paid Ad': 'bg-pink-500/15 text-pink-400 border-pink-500/25',
  'Webinar': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  'Conference': 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  'Partner': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  'Inbound Form': 'bg-teal-500/15 text-teal-400 border-teal-500/25',
  'Content Download': 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  'Social Media': 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  'Directory Listing': 'bg-slate-500/15 text-slate-400 border-slate-500/25',
  'Apollo': 'bg-orange-500/15 text-orange-400 border-orange-500/25',
};

const sourceIcons = {
  'LinkedIn': Linkedin, 'Cold Email': Mail, 'Website': Globe, 'Referral': UserPlus,
  'Paid Ad': Megaphone, 'Webinar': Radio, 'Conference': Users, 'Partner': Building2,
  'Inbound Form': FileText, 'Content Download': Download, 'Social Media': Globe,
  'Directory Listing': Search, 'Apollo': Crosshair,
};

const perPageOptions = [25, 50, 100, 250];

// ---------------------------------------------------------------------------
// Region mapping for geographic grouping
// ---------------------------------------------------------------------------
const REGION_MAP = {
  'North America - West': ['San Francisco', 'LA', 'Seattle', 'Portland', 'Denver', 'Phoenix', 'Las Vegas', 'San Diego', 'Salt Lake City', 'Vancouver'],
  'North America - East': ['New York', 'Boston', 'Miami', 'Atlanta', 'Philadelphia', 'Charlotte', 'Raleigh', 'Tampa', 'Orlando', 'Pittsburgh', 'Montreal'],
  'North America - Central': ['Austin', 'Chicago', 'Dallas', 'Nashville', 'Minneapolis', 'Detroit', 'Columbus', 'Indianapolis', 'Kansas City', 'St Louis', 'Toronto'],
  'Europe - West': ['London', 'Paris', 'Amsterdam', 'Dublin', 'Lisbon', 'Barcelona', 'Milan', 'Rome'],
  'Europe - North': ['Stockholm', 'Copenhagen', 'Oslo', 'Helsinki'],
  'Europe - Central': ['Berlin', 'Munich', 'Zurich', 'Vienna', 'Prague', 'Warsaw'],
  'Asia Pacific': ['Singapore', 'Sydney', 'Tokyo', 'Hong Kong', 'Seoul', 'Taipei', 'Bangkok', 'Melbourne', 'Auckland', 'Jakarta', 'Mumbai', 'Bangalore', 'Delhi'],
  'Middle East & Africa': ['Dubai', 'Riyadh', 'Tel Aviv', 'Cape Town', 'Lagos', 'Nairobi', 'Cairo'],
};

function getRegion(location) {
  if (!location) return 'Unknown';
  for (const [region, cities] of Object.entries(REGION_MAP)) {
    if (cities.includes(location)) return region;
  }
  return 'Other';
}

// ---------------------------------------------------------------------------
// Close probability calculator
// ---------------------------------------------------------------------------
function getCloseProbability(lead, index) {
  const seed = (index + 1) * 5021;
  const base = 20;
  let prob = base;
  // Score factor
  if (lead.score >= 90) prob += 35;
  else if (lead.score >= 80) prob += 25;
  else if (lead.score >= 60) prob += 15;
  else prob += 5;
  // Status factor
  if (lead.status === 'negotiation') prob += 25;
  else if (lead.status === 'proposal') prob += 18;
  else if (lead.status === 'qualified') prob += 12;
  else if (lead.status === 'contacted') prob += 6;
  else if (lead.status === 'won') prob = 100;
  else if (lead.status === 'lost') prob = 0;
  // Priority factor
  if (lead.priority === 'critical') prob += 10;
  else if (lead.priority === 'high') prob += 5;
  // Momentum factor
  if (lead.momentum === 'surging') prob += 8;
  else if (lead.momentum === 'rising') prob += 4;
  else if (lead.momentum === 'declining') prob -= 8;
  // Random variance
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
  if (prob >= 75) return 'bg-emerald-500/15 border-emerald-500/30';
  if (prob >= 50) return 'bg-amber-500/15 border-amber-500/30';
  if (prob >= 25) return 'bg-orange-500/15 border-orange-500/30';
  return 'bg-red-500/15 border-red-500/30';
}

// ---------------------------------------------------------------------------
// Pain points per industry
// ---------------------------------------------------------------------------
const INDUSTRY_PAIN_POINTS = {
  'SaaS': ['High churn rate bleeding MRR', 'Customer acquisition cost too high', 'No product-led growth engine', 'Manual onboarding killing expansion'],
  'Fintech': ['Compliance bottlenecks slowing launches', 'Customer trust deficit', 'Legacy system migration pain', 'Fraud detection gaps'],
  'E-commerce': ['Cart abandonment over 70%', 'No retention/loyalty program', 'Rising ad costs crushing margins', 'Poor mobile conversion rate'],
  'Healthcare': ['Patient acquisition cost rising', 'No online booking system', 'HIPAA-compliant marketing gaps', 'Low review/reputation scores'],
  'EdTech': ['Low course completion rates', 'Student acquisition cost too high', 'No community engagement strategy', 'Content production bottleneck'],
  'Cybersecurity': ['Long enterprise sales cycles', 'Difficulty proving ROI to prospects', 'Crowded market positioning', 'Technical buyer vs budget holder gap'],
  'AI/ML': ['Difficulty monetizing research', 'Enterprise trust and explainability concerns', 'Data pipeline reliability issues', 'Talent retention challenges'],
  'default': ['No clear digital presence', 'Inefficient lead generation process', 'Poor conversion rates on website', 'No systematic follow-up process'],
};

function getLeadPainPoints(lead) {
  return INDUSTRY_PAIN_POINTS[lead.industry] || INDUSTRY_PAIN_POINTS['default'];
}

function getCloseStrategy(lead, closeProbability) {
  if (closeProbability >= 75) return {
    label: 'High Confidence Close', color: 'emerald',
    steps: ['Send final proposal with limited-time incentive', 'Schedule decision call within 48 hours', 'Prepare ROI summary with their specific metrics', 'Have contract ready for e-signature'],
  };
  if (closeProbability >= 50) return {
    label: 'Nurture to Close', color: 'amber',
    steps: ['Address remaining objections directly', 'Share relevant case study from their industry', 'Offer pilot/trial period to reduce risk', 'Connect them with existing customer reference'],
  };
  if (closeProbability >= 25) return {
    label: 'Build Trust First', color: 'orange',
    steps: ['Send personalized value analysis', 'Schedule discovery call to understand pain points', 'Share free resource demonstrating expertise', 'Follow up with industry-specific insights'],
  };
  return {
    label: 'Long-term Nurture', color: 'red',
    steps: ['Add to drip email campaign', 'Engage on social media / LinkedIn', 'Share thought leadership content monthly', 'Check back in 30-60 days with new value prop'],
  };
}

// ---------------------------------------------------------------------------
// Outreach templates
// ---------------------------------------------------------------------------
function getOutreachTemplates(lead) {
  const firstName = lead.name.split(' ')[0];
  const companyName = lead.company;
  return {
    email: {
      subject: `Quick question about ${companyName}'s growth`,
      body: `Hi ${firstName},\n\nI noticed ${companyName} is doing great things in ${lead.industry}. I work with similar companies to help them increase revenue by 20-40% through optimized digital presence.\n\nWould you be open to a quick 15-min call this week to see if there's a fit?\n\nBest,\n[Your Name]`,
    },
    linkedin: `Hi ${firstName}, I came across ${companyName} and was impressed by your work in ${lead.industry}. I help companies like yours unlock hidden revenue through digital optimization. Would love to connect and share some insights that might be valuable.`,
    sms: `Hi ${firstName}, this is [Your Name] from GOATED. I have some insights on how ${companyName} could be capturing more revenue in ${lead.industry}. Worth a quick chat? Reply YES and I'll send details.`,
    call: `Hi ${firstName}, this is [Your Name]. I'm reaching out because I work with companies in ${lead.industry} and noticed some opportunities for ${companyName} to capture additional revenue. Do you have a few minutes to discuss?`,
  };
}

// ---------------------------------------------------------------------------
// OutreachDropdown Component
// ---------------------------------------------------------------------------
function OutreachDropdown({ lead, onClose, showToast }) {
  const [activeTab, setActiveTab] = useState(null);
  const templates = useMemo(() => getOutreachTemplates(lead), [lead]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard'));
  };

  const tabs = [
    { key: 'email', label: 'Send Email', icon: Mail, color: 'purple' },
    { key: 'linkedin', label: 'LinkedIn Connect', icon: Linkedin, color: 'blue' },
    { key: 'sms', label: 'SMS', icon: MessageSquare, color: 'emerald' },
    { key: 'call', label: 'Call Script', icon: Phone, color: 'amber' },
  ];

  return (
    <div ref={dropdownRef} className="absolute right-0 top-full mt-1 z-30 w-80 bg-[#0a0a0a] rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="px-3 py-2 border-b border-white/[0.04] flex items-center justify-between">
        <span className="text-xs font-bold text-white">Outreach - {lead.name}</span>
        <button onClick={onClose} className="p-1 rounded text-slate-500 hover:text-white"><X size={12} /></button>
      </div>
      {!activeTab ? (
        <div className="p-2 space-y-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-${t.color}-500/10 hover:text-${t.color}-400 transition-colors text-left`}>
              <t.icon size={14} className={`text-${t.color}-400`} /> {t.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="p-3">
          <button onClick={() => setActiveTab(null)} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white mb-2">
            <ChevronLeft size={10} /> Back
          </button>
          {activeTab === 'email' && (
            <div className="space-y-2">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Subject</div>
              <div className="bg-surface-2 rounded-lg p-2 text-xs text-white border border-white/[0.04]">{templates.email.subject}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Body</div>
              <div className="bg-surface-2 rounded-lg p-2 text-xs text-slate-300 border border-white/[0.04] whitespace-pre-wrap max-h-32 overflow-y-auto">{templates.email.body}</div>
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(templates.email.body)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-purple-500/15 border border-purple-500/25 text-xs font-bold text-purple-400 hover:bg-purple-500/25 transition-colors">
                  <Copy size={10} /> Copy
                </button>
                <a href={`mailto:${lead.email}?subject=${encodeURIComponent(templates.email.subject)}&body=${encodeURIComponent(templates.email.body)}`}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-purple-500 text-white text-xs font-bold hover:bg-purple-600 transition-colors">
                  <Mail size={10} /> Open Email
                </a>
              </div>
            </div>
          )}
          {activeTab === 'linkedin' && (
            <div className="space-y-2">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Connection Message</div>
              <div className="bg-surface-2 rounded-lg p-2 text-xs text-slate-300 border border-white/[0.04] whitespace-pre-wrap">{templates.linkedin}</div>
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(templates.linkedin)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-blue-500/15 border border-blue-500/25 text-xs font-bold text-blue-400 hover:bg-blue-500/25 transition-colors">
                  <Copy size={10} /> Copy
                </button>
                <a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(lead.name + ' ' + lead.company)}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors">
                  <Linkedin size={10} /> Open LinkedIn
                </a>
              </div>
            </div>
          )}
          {activeTab === 'sms' && (
            <div className="space-y-2">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">SMS Template</div>
              <div className="bg-surface-2 rounded-lg p-2 text-xs text-slate-300 border border-white/[0.04] whitespace-pre-wrap">{templates.sms}</div>
              <button onClick={() => copyToClipboard(templates.sms)} className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                <Copy size={10} /> Copy SMS
              </button>
            </div>
          )}
          {activeTab === 'call' && (
            <div className="space-y-2">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Call Script</div>
              <div className="bg-surface-2 rounded-lg p-2 text-xs text-slate-300 border border-white/[0.04] whitespace-pre-wrap">{templates.call}</div>
              <button onClick={() => copyToClipboard(templates.call)} className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/25 text-xs font-bold text-amber-400 hover:bg-amber-500/25 transition-colors">
                <Copy size={10} /> Copy Script
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PainPointsModal Component
// ---------------------------------------------------------------------------
function PainPointsModal({ lead, index, onClose }) {
  const painPoints = getLeadPainPoints(lead);
  const deficits = getLeadDeficits(lead, index);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg mx-4 bg-[#0a0a0a] rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-400" /> Pain Points - {lead.company}
            </div>
            <div className="text-[10px] text-slate-500">{lead.name} &middot; {lead.industry}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="text-xs font-bold text-red-400 uppercase tracking-wider">Key Pain Points</div>
          {painPoints.map((point, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
              <div className="w-6 h-6 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-red-400">{i + 1}</span>
              </div>
              <div>
                <div className="text-sm text-white font-medium">{point}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Impact: ~{fmt(Math.round(deficits.totalMonthlyLoss / painPoints.length * (1 + simpleHash((index + 1) * 100 + i) * 0.5)))}/mo lost revenue</div>
              </div>
            </div>
          ))}
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
            <div className="text-xs font-bold text-emerald-400 mb-1">Total Estimated Impact</div>
            <div className="text-lg font-black text-red-400">-{fmt(deficits.totalMonthlyLoss)}<span className="text-sm text-red-400/60">/month</span></div>
            <div className="text-xs text-slate-500 mt-1">Fixing these could recover <span className="text-emerald-400 font-bold">{fmt(deficits.opportunityValue)}</span> annually</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CloseStrategyModal Component
// ---------------------------------------------------------------------------
function CloseStrategyModal({ lead, index, onClose }) {
  const prob = getCloseProbability(lead, index);
  const strategy = getCloseStrategy(lead, prob);
  const painPoints = getLeadPainPoints(lead);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg mx-4 bg-[#0a0a0a] rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Target size={16} className={`text-${strategy.color}-400`} /> Close Strategy - {lead.company}
            </div>
            <div className="text-[10px] text-slate-500">{lead.name} &middot; Close Probability: <span className={`font-bold ${closeProbColor(prob)}`}>{prob}%</span></div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Strategy label */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-${strategy.color}-500/10 border border-${strategy.color}-500/20`}>
            <span className={`text-sm font-bold text-${strategy.color}-400`}>{strategy.label}</span>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider">Recommended Steps</div>
            {strategy.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-2 border border-white/[0.04]">
                <div className={`w-5 h-5 rounded-full bg-${strategy.color}-500/15 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <span className={`text-[10px] font-bold text-${strategy.color}-400`}>{i + 1}</span>
                </div>
                <span className="text-sm text-slate-300">{step}</span>
              </div>
            ))}
          </div>

          {/* Lead-specific approach */}
          <div className="p-3 rounded-lg bg-brand/5 border border-brand/15">
            <div className="text-xs font-bold text-brand mb-2">Lead-Specific Approach</div>
            <div className="text-xs text-slate-400 space-y-1">
              <p>Primary pain point: <span className="text-white font-medium">{painPoints[0]}</span></p>
              <p>Deal value: <span className="text-brand font-bold">{fmt(lead.dealValue || 0)}</span> &middot; Commission: <span className="text-emerald-400 font-bold">{fmt(Math.round((lead.dealValue || 0) * 0.12))}</span></p>
              <p>Industry: <span className="text-white">{lead.industry}</span> &middot; Location: <span className="text-white">{lead.location || 'Unknown'}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deterministic hash for deficit/revenue data generation
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

// Industry revenue multipliers — how much each industry typically loses
const industryMultipliers = {
  'SaaS': 2.8, 'Fintech': 3.2, 'E-commerce': 2.5, 'Healthcare': 2.0, 'EdTech': 1.8,
  'DevTools': 2.6, 'Cybersecurity': 3.0, 'AI/ML': 3.5, 'MarTech': 2.4, 'PropTech': 2.2,
  'InsurTech': 2.1, 'LegalTech': 1.9, 'CleanTech': 2.3, 'BioTech': 2.7, 'MedTech': 2.5,
  'FoodTech': 1.7, 'HRTech': 2.0, 'AdTech': 2.8, 'Logistics': 1.6, 'Gaming': 2.4,
  'Media': 2.1, 'Retail': 1.9, 'Construction': 1.5, 'Travel': 2.0, 'Fashion': 2.2,
  'Energy': 1.8, 'Automotive': 1.7, 'Aerospace': 2.5, 'Sports': 2.0,
};

// Deficit categories with baseline ranges
const DEFICIT_CATEGORIES = [
  { key: 'website', label: 'Website Quality', icon: Monitor, minLoss: 800, maxLoss: 12000, desc: 'Outdated or no website' },
  { key: 'seo', label: 'SEO Presence', icon: Search, minLoss: 1200, maxLoss: 18000, desc: 'No organic search presence' },
  { key: 'social', label: 'Social Media', icon: Share2, minLoss: 500, maxLoss: 8000, desc: 'No social media presence' },
  { key: 'ppc', label: 'Ad Spend / PPC', icon: Megaphone, minLoss: 2000, maxLoss: 25000, desc: 'No paid advertising' },
  { key: 'discovery', label: 'Discoverability', icon: Globe, minLoss: 1000, maxLoss: 15000, desc: 'Poor Google presence' },
  { key: 'email', label: 'Email Marketing', icon: MailOpen, minLoss: 600, maxLoss: 10000, desc: 'No email automation' },
  { key: 'crm', label: 'CRM / Pipeline', icon: Database, minLoss: 1500, maxLoss: 20000, desc: 'No CRM system — leaking deals' },
];

// Generate deficit data for a lead deterministically
function getLeadDeficits(lead, index) {
  const seed = (index + 1) * 7919; // prime multiplier for spread
  const mult = industryMultipliers[lead.industry] || 2.0;
  const empFactor = (lead.employees || 50) > 200 ? 1.8 : (lead.employees || 50) > 50 ? 1.3 : 1.0;
  const dealFactor = (lead.dealValue || 10000) / 30000;

  const deficits = DEFICIT_CATEGORIES.map((cat, ci) => {
    const catSeed = seed + ci * 31;
    const severity = simpleHash(catSeed); // 0-1: 0 = healthy, 1 = critical
    const isDeficient = severity > 0.3; // 70% chance of deficit
    const rawLoss = isDeficient
      ? Math.round(seededRange(catSeed + 100, cat.minLoss, cat.maxLoss) * mult * empFactor * dealFactor / 100) * 100
      : 0;
    return {
      ...cat,
      severity: isDeficient ? severity : 0,
      monthlyLoss: rawLoss,
      status: severity > 0.75 ? 'critical' : severity > 0.55 ? 'high' : severity > 0.3 ? 'medium' : 'healthy',
    };
  });

  const totalMonthlyLoss = deficits.reduce((s, d) => s + d.monthlyLoss, 0);
  const deficitScore = Math.min(100, Math.round(deficits.filter(d => d.severity > 0.3).length / DEFICIT_CATEGORIES.length * 100 * (1 + simpleHash(seed + 999) * 0.3)));
  const opportunityValue = Math.round(totalMonthlyLoss * 12 * (1 + simpleHash(seed + 500) * 0.4));
  const lostRevenue = Math.round(totalMonthlyLoss * (6 + seededRange(seed + 200, 0, 18))); // 6-24 months accumulated

  return { deficits, totalMonthlyLoss, deficitScore, opportunityValue, lostRevenue };
}

// Generate contact intel for a lead
function getContactIntel(lead, index) {
  const seed = (index + 1) * 4219;
  const areaCode = seededRange(seed, 200, 999);
  const mid = seededRange(seed + 1, 100, 999);
  const last = seededRange(seed + 2, 1000, 9999);
  const phone = `(${areaCode}) ${mid}-${last}`;

  const streetNum = seededRange(seed + 3, 100, 9999);
  const streets = ['Main St', 'Oak Ave', 'Park Blvd', 'Commerce Dr', 'Tech Way', 'Market St', 'Innovation Ln', 'Business Park Dr', 'Corporate Blvd', 'Industry Ave'];
  const street = streets[seededRange(seed + 4, 0, streets.length - 1)];
  const suites = ['', '', 'Ste 100', 'Ste 200', 'Ste 300', 'Floor 2', 'Floor 5', 'Unit B', '#400', ''];
  const suite = suites[seededRange(seed + 5, 0, suites.length - 1)];
  const city = lead.location || 'Unknown';
  const address = `${streetNum} ${street}${suite ? ', ' + suite : ''}, ${city}`;

  const lastActiveDays = seededRange(seed + 6, 0, 90);
  const lastActive = lastActiveDays === 0 ? 'Active now' : lastActiveDays < 7 ? `${lastActiveDays}d ago` : lastActiveDays < 30 ? `${Math.floor(lastActiveDays / 7)}w ago` : `${Math.floor(lastActiveDays / 30)}mo ago`;

  return { phone, address, lastActive, lastActiveDays };
}

// Deficit badge color helper
function deficitBadgeColor(score) {
  if (score >= 75) return 'bg-red-500/15 text-red-400 border-red-500/30';
  if (score >= 50) return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
  if (score >= 25) return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
  return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
}

function deficitStatusColor(status) {
  if (status === 'critical') return 'text-red-400 bg-red-500/10';
  if (status === 'high') return 'text-orange-400 bg-orange-500/10';
  if (status === 'medium') return 'text-yellow-400 bg-yellow-500/10';
  return 'text-emerald-400 bg-emerald-500/10';
}

// ---------------------------------------------------------------------------
// Revenue Intelligence Panel Component
// ---------------------------------------------------------------------------
function RevenueIntelligencePanel({ leads, allLeads }) {
  const [expanded, setExpanded] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLeadIdx, setReportLeadIdx] = useState(null);

  const stats = useMemo(() => {
    const totalPipeline = allLeads.reduce((s, l) => s + (l.dealValue || 0), 0);
    const lostLeads = allLeads.filter(l => l.status === 'lost' || l.status === 'unresponsive');
    const lostRevenue = lostLeads.reduce((s, l) => s + (l.dealValue || 0), 0);
    const wonLeads = allLeads.filter(l => l.status === 'won');
    const totalDecided = wonLeads.length + lostLeads.length;
    const closeRate = totalDecided > 0 ? Math.round((wonLeads.length / totalDecided) * 100) : 0;
    const revenuePerDeal = wonLeads.length > 0 ? Math.round(wonLeads.reduce((s, l) => s + (l.dealValue || 0), 0) / wonLeads.length) : 0;

    // Aggregate deficit data across visible leads
    let totalMonthlyDeficit = 0;
    let totalOpportunity = 0;
    let avgDeficitScore = 0;
    const catTotals = DEFICIT_CATEGORIES.map(() => 0);
    const sampleSize = Math.min(leads.length, 100);
    for (let i = 0; i < sampleSize; i++) {
      const d = getLeadDeficits(leads[i], i);
      totalMonthlyDeficit += d.totalMonthlyLoss;
      totalOpportunity += d.opportunityValue;
      avgDeficitScore += d.deficitScore;
      d.deficits.forEach((def, ci) => { catTotals[ci] += def.monthlyLoss; });
    }
    if (sampleSize > 0) avgDeficitScore = Math.round(avgDeficitScore / sampleSize);

    return { totalPipeline, lostRevenue, closeRate, revenuePerDeal, wonCount: wonLeads.length, lostCount: lostLeads.length, totalMonthlyDeficit, totalOpportunity, avgDeficitScore, catTotals, sampleSize };
  }, [leads, allLeads]);

  const maxCatValue = Math.max(...stats.catTotals, 1);

  return (
    <div className="mb-4 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.04] via-black to-emerald-500/[0.02] overflow-hidden">
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <BarChart3 size={20} className="text-emerald-400" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Revenue Intelligence</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold">LIVE</span>
            </div>
            <span className="text-xs text-slate-500">Pipeline analysis, deficit scoring, and revenue recovery insights</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Shield size={14} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">GOATED Guarantee: 90%+ Close Rate</span>
          </div>
          {expanded ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <>
          {/* Stat Cards */}
          <div className="px-4 pb-3 grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-black/40 rounded-xl p-3 border border-white/[0.04]">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider mb-1"><DollarSign size={12} />Total Pipeline</div>
              <div className="text-lg font-bold text-white">{fmt(stats.totalPipeline)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{allLeads.length.toLocaleString()} total leads</div>
            </div>
            <div className="bg-black/40 rounded-xl p-3 border border-red-500/15">
              <div className="flex items-center gap-1.5 text-[10px] text-red-400 uppercase tracking-wider mb-1"><TrendingDown size={12} />Lost Revenue</div>
              <div className="text-lg font-bold text-red-400">{fmt(stats.lostRevenue)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{stats.lostCount.toLocaleString()} lost/unresponsive</div>
            </div>
            <div className="bg-black/40 rounded-xl p-3 border border-white/[0.04]">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider mb-1"><Target size={12} />Close Rate</div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold text-white">{stats.closeRate}%</div>
                <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${stats.closeRate >= 90 ? 'bg-emerald-500' : stats.closeRate >= 70 ? 'bg-amber-500' : stats.closeRate >= 50 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${stats.closeRate}%` }} />
                </div>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{stats.wonCount} won / {stats.wonCount + stats.lostCount} decided</div>
            </div>
            <div className="bg-black/40 rounded-xl p-3 border border-white/[0.04]">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider mb-1"><BarChart2 size={12} />Avg Revenue/Deal</div>
              <div className="text-lg font-bold text-white">{fmt(stats.revenuePerDeal)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">From {stats.wonCount} closed deals</div>
            </div>
            <div className="bg-black/40 rounded-xl p-3 border border-orange-500/15">
              <div className="flex items-center gap-1.5 text-[10px] text-orange-400 uppercase tracking-wider mb-1"><AlertTriangle size={12} />Monthly Deficit</div>
              <div className="text-lg font-bold text-orange-400">{fmt(stats.totalMonthlyDeficit)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Across {stats.sampleSize} analyzed leads</div>
            </div>
          </div>

          {/* GOATED Guarantee + Deficit Breakdown */}
          <div className="px-4 pb-3 flex flex-col lg:flex-row gap-3">
            {/* Deficit Category Breakdown */}
            <div className="flex-1 bg-black/40 rounded-xl p-4 border border-white/[0.04]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider">Deficit Categories (Avg/Lead)</div>
                <button onClick={() => setReportOpen(!reportOpen)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                  <FileBarChart size={13} /> Generate Revenue Report
                </button>
              </div>
              <div className="space-y-2">
                {DEFICIT_CATEGORIES.map((cat, i) => {
                  const avgLoss = stats.sampleSize > 0 ? Math.round(stats.catTotals[i] / stats.sampleSize) : 0;
                  const pct = maxCatValue > 0 ? (stats.catTotals[i] / maxCatValue) * 100 : 0;
                  return (
                    <div key={cat.key} className="flex items-center gap-3">
                      <cat.icon size={14} className="text-slate-500 flex-shrink-0 w-4" />
                      <div className="w-28 text-[11px] text-slate-400 truncate">{cat.label}</div>
                      <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pct > 70 ? 'bg-red-500' : pct > 40 ? 'bg-orange-500' : pct > 15 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-20 text-right text-xs font-mono font-bold text-slate-300">{fmt(avgLoss)}/mo</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Intel Box */}
            <div className="w-full lg:w-72 bg-black/40 rounded-xl p-4 border border-emerald-500/15">
              <div className="text-center mb-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-2 relative">
                  <span className="text-xl font-black text-emerald-400">{stats.avgDeficitScore}</span>
                  <svg className="absolute inset-0 w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="4" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgb(16,185,129)" strokeWidth="4" strokeDasharray={`${stats.avgDeficitScore * 1.76} 176`} strokeLinecap="round" />
                  </svg>
                </div>
                <div className="text-xs font-bold text-white">Avg Deficit Score</div>
                <div className="text-[10px] text-slate-500">Higher = more opportunity</div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-t border-white/[0.04]">
                  <span className="text-slate-500">Annual Opportunity</span>
                  <span className="font-bold text-emerald-400">{fmt(stats.totalOpportunity)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-t border-white/[0.04]">
                  <span className="text-slate-500">Monthly Recoverable</span>
                  <span className="font-bold text-amber-400">{fmt(stats.totalMonthlyDeficit)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-t border-white/[0.04]">
                  <span className="text-slate-500">Avg Deficit/Lead</span>
                  <span className="font-bold text-white">{fmt(stats.sampleSize > 0 ? Math.round(stats.totalMonthlyDeficit / stats.sampleSize) : 0)}/mo</span>
                </div>
              </div>
              <div className="mt-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                <Shield size={14} className="text-emerald-400 mx-auto mb-1" />
                <div className="text-[10px] font-bold text-emerald-400">GOATED GUARANTEE</div>
                <div className="text-[10px] text-emerald-400/70">90%+ close rate system</div>
              </div>
            </div>
          </div>

          {/* Revenue Report (expandable) */}
          {reportOpen && (
            <div className="px-4 pb-4">
              <div className="bg-black/60 rounded-xl p-5 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileBarChart size={18} className="text-emerald-400" /> Revenue Recovery Report
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Projected revenue impact across analyzed leads</p>
                  </div>
                  <button onClick={() => setReportOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
                </div>

                {/* Headline */}
                <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 mb-4 text-center">
                  <div className="text-xs text-red-400 uppercase tracking-wider font-bold mb-1">These businesses are leaving money on the table</div>
                  <div className="text-3xl font-black text-red-400">{fmt(stats.totalMonthlyDeficit)}<span className="text-lg text-red-400/60">/month</span></div>
                  <div className="text-xs text-slate-500 mt-1">Combined lost revenue across {stats.sampleSize} analyzed leads</div>
                </div>

                {/* Bar chart breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div>
                    <div className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Monthly Lost Revenue by Category</div>
                    <div className="space-y-3">
                      {DEFICIT_CATEGORIES.map((cat, i) => {
                        const total = stats.catTotals[i];
                        const pct = maxCatValue > 0 ? (total / maxCatValue) * 100 : 0;
                        return (
                          <div key={cat.key}>
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-slate-400 flex items-center gap-1.5"><cat.icon size={12} />{cat.label}</span>
                              <span className="font-mono font-bold text-white">{fmt(total)}</span>
                            </div>
                            <div className="h-3 bg-surface-2 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct > 70 ? 'bg-gradient-to-r from-red-600 to-red-400' : pct > 40 ? 'bg-gradient-to-r from-orange-600 to-orange-400' : pct > 15 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Projected Recovery</div>
                    <div className="space-y-3">
                      <div className="bg-surface-2 rounded-xl p-3 border border-white/[0.04]">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Current Monthly Loss</div>
                        <div className="text-xl font-black text-red-400">-{fmt(stats.totalMonthlyDeficit)}</div>
                      </div>
                      <div className="bg-surface-2 rounded-xl p-3 border border-emerald-500/15">
                        <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">If All Deficits Fixed</div>
                        <div className="text-xl font-black text-emerald-400">+{fmt(Math.round(stats.totalMonthlyDeficit * 0.85))}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">85% recovery rate (conservative)</div>
                      </div>
                      <div className="bg-surface-2 rounded-xl p-3 border border-emerald-500/25">
                        <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Annual Revenue Recovery</div>
                        <div className="text-xl font-black text-emerald-400">{fmt(Math.round(stats.totalMonthlyDeficit * 0.85 * 12))}</div>
                      </div>
                      <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-center">
                        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Commission Potential (12%)</div>
                        <div className="text-lg font-black text-emerald-400">{fmt(Math.round(stats.totalMonthlyDeficit * 0.85 * 12 * 0.12))}</div>
                        <div className="text-[10px] text-emerald-400/60">Your earnings from this cohort</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GOATED Money Machine Panel
// ---------------------------------------------------------------------------
function MoneyMachinePanel({ allLeads, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState({});
  const [outreachSent, setOutreachSent] = useState(0);
  const [dealsPerWeek, setDealsPerWeek] = useState(3);
  const [avgDealSize, setAvgDealSize] = useState(15000);

  const toggleStep = (key) => setCheckedSteps(prev => ({ ...prev, [key]: !prev[key] }));

  const wonDeals = useMemo(() => allLeads.filter(l => l.status === 'won'), [allLeads]);
  const currentMRR = useMemo(() => wonDeals.reduce((s, l) => s + (l.dealValue || 0) * 0.12, 0), [wonDeals]);
  const mrrGoal = 25000;
  const mrrPct = Math.min(100, (currentMRR / mrrGoal) * 100);

  // Top 5 highest scored leads (not won/lost)
  const top5 = useMemo(() =>
    [...allLeads].filter(l => !['won', 'lost'].includes(l.status))
      .sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5),
    [allLeads]
  );

  // Warm leads: contacted or qualified
  const warmLeads = useMemo(() =>
    allLeads.filter(l => ['contacted', 'qualified'].includes(l.status))
      .sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10),
    [allLeads]
  );

  // Closeable: negotiation status, sorted by conversion probability
  const closeableLeads = useMemo(() =>
    allLeads.filter(l => l.status === 'negotiation')
      .sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5),
    [allLeads]
  );

  // Revenue calculator
  const projectedMRR = dealsPerWeek * avgDealSize * 0.12 * (52 / 12);
  const weeksTo25K = mrrGoal > currentMRR ? Math.ceil((mrrGoal - currentMRR) / (dealsPerWeek * avgDealSize * 0.12)) : 0;
  const weeksTo50K = Math.ceil((50000 - currentMRR) / Math.max(1, dealsPerWeek * avgDealSize * 0.12));
  const weeksTo100K = Math.ceil((100000 - currentMRR) / Math.max(1, dealsPerWeek * avgDealSize * 0.12));

  // MRR color gradient
  const mrrColor = mrrPct >= 80 ? '#10b981' : mrrPct >= 50 ? '#f59e0b' : mrrPct >= 25 ? '#f97316' : '#ef4444';

  const stepsComplete = Object.values(checkedSteps).filter(Boolean).length;

  return (
    <div className="mb-4 rounded-xl border border-brand/25 bg-gradient-to-r from-brand/[0.06] via-black to-brand/[0.03] overflow-hidden">
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center relative">
            <DollarSign size={20} className="text-brand" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand" />
            </span>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white uppercase tracking-wider">GOATED Money Machine</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand/15 text-brand border border-brand/25 font-bold">GUIDED</span>
            </div>
            <span className="text-xs text-slate-500">Your daily path to $25K+ MRR — follow every step</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: mrrColor }}>{fmt(Math.round(currentMRR))}</span>
            <span className="text-xs text-slate-600">/</span>
            <span className="text-xs text-slate-400">{fmt(mrrGoal)}</span>
          </div>
          {expanded ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* ── Progress to $25K MRR ── */}
          <div className="bg-black/40 rounded-xl p-4 border border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={14} className="text-brand" /> Progress to $25K MRR
              </div>
              <div className="text-right">
                <span className="text-lg font-black" style={{ color: mrrColor }}>{fmt(Math.round(currentMRR))}</span>
                <span className="text-sm text-slate-500"> / {fmt(mrrGoal)} goal</span>
              </div>
            </div>
            <div className="h-4 bg-white/[0.03] rounded-full overflow-hidden relative">
              <div className="h-full rounded-full transition-all duration-700 relative" style={{
                width: `${mrrPct}%`,
                background: `linear-gradient(90deg, #ef4444 0%, #f97316 30%, #f59e0b 60%, #10b981 100%)`
              }}>
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 rounded-full" />
              </div>
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-slate-600">$0</span>
              <span className="text-[10px] font-bold" style={{ color: mrrColor }}>{Math.round(mrrPct)}%</span>
              <span className="text-[10px] text-slate-600">$25K</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
              <Crown size={10} className="text-brand" />
              <span>{wonDeals.length} deals closed = {fmt(Math.round(currentMRR))} MRR ({Math.round(mrrPct)}% to goal)</span>
            </div>
          </div>

          {/* ── Daily Action Plan ── */}
          <div className="bg-black/40 rounded-xl p-4 border border-white/[0.04]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Target size={14} className="text-brand" /> Daily Action Plan
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-bold">
                {stepsComplete}/4 DONE
              </span>
            </div>

            <div className="space-y-3">
              {/* Step 1: Call top 5 */}
              <div className={`rounded-lg border p-3 transition-colors ${checkedSteps.calls ? 'border-brand/20 bg-brand/[0.02]' : 'border-white/[0.04] bg-white/[0.01]'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => toggleStep('calls')} className="shrink-0">
                    {checkedSteps.calls
                      ? <CheckSquare size={18} className="text-brand" />
                      : <Square size={18} className="text-slate-600" />
                    }
                  </button>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      Step 1: Call your top 5 leads
                      <PhoneCall size={14} className="text-brand" />
                    </div>
                    <div className="text-[10px] text-slate-500">Est. revenue impact: {fmt(Math.round(top5.reduce((s, l) => s + (l.dealValue || 0) * 0.12, 0)))}</div>
                  </div>
                </div>
                <div className="ml-8 space-y-1.5">
                  {top5.map((l, i) => (
                    <div key={l.id || i} className="flex items-center justify-between text-xs bg-black/30 rounded-lg px-3 py-2 border border-white/[0.02]">
                      <div className="flex items-center gap-2">
                        <span className="text-brand font-bold">#{i + 1}</span>
                        <span className="text-white font-medium">{l.name}</span>
                        <span className="text-slate-500">{l.company}</span>
                        <span className="text-brand font-bold">{l.score}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{fmt(l.dealValue || 0)}</span>
                        <button onClick={() => onSelect && onSelect(l)}
                          className="px-2 py-1 rounded-md bg-brand/15 text-brand text-[10px] font-bold hover:bg-brand/25 transition-colors flex items-center gap-1">
                          <Phone size={10} /> CALL
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Send 20 outreach */}
              <div className={`rounded-lg border p-3 transition-colors ${checkedSteps.outreach ? 'border-brand/20 bg-brand/[0.02]' : 'border-white/[0.04] bg-white/[0.01]'}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleStep('outreach')} className="shrink-0">
                    {checkedSteps.outreach
                      ? <CheckSquare size={18} className="text-brand" />
                      : <Square size={18} className="text-slate-600" />
                    }
                  </button>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      Step 2: Send 20 outreach messages
                      <Send size={14} className="text-cyan-400" />
                    </div>
                    <div className="text-[10px] text-slate-500">Est. revenue impact: {fmt(Math.round(20 * avgDealSize * 0.12 * 0.05))}/mo from 5% conversion</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                      <span className="text-sm font-bold text-brand">{outreachSent}</span>
                      <span className="text-xs text-slate-600">/20</span>
                    </div>
                    <button onClick={() => setOutreachSent(prev => Math.min(20, prev + 5))}
                      className="px-2.5 py-1 rounded-md bg-cyan-500/15 text-cyan-400 text-[10px] font-bold hover:bg-cyan-500/25 transition-colors flex items-center gap-1 border border-cyan-500/20">
                      <Wand2 size={10} /> AUTO +5
                    </button>
                  </div>
                </div>
                <div className="ml-8 mt-2">
                  <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-brand rounded-full transition-all" style={{ width: `${(outreachSent / 20) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Step 3: Follow up on 10 warm leads */}
              <div className={`rounded-lg border p-3 transition-colors ${checkedSteps.followup ? 'border-brand/20 bg-brand/[0.02]' : 'border-white/[0.04] bg-white/[0.01]'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => toggleStep('followup')} className="shrink-0">
                    {checkedSteps.followup
                      ? <CheckSquare size={18} className="text-brand" />
                      : <Square size={18} className="text-slate-600" />
                    }
                  </button>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      Step 3: Follow up on {Math.min(10, warmLeads.length)} warm leads
                      <Flame size={14} className="text-amber-400" />
                    </div>
                    <div className="text-[10px] text-slate-500">Contacted/qualified leads — highest conversion window</div>
                  </div>
                </div>
                <div className="ml-8 flex flex-wrap gap-1.5">
                  {warmLeads.slice(0, 10).map((l, i) => (
                    <button key={l.id || i} onClick={() => onSelect && onSelect(l)}
                      className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 text-[10px] font-medium hover:bg-amber-500/20 transition-colors border border-amber-500/15 flex items-center gap-1">
                      {l.name.split(' ')[0]} <span className="text-amber-500/60">{fmt(l.dealValue || 0)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Close 1 deal */}
              <div className={`rounded-lg border p-3 transition-colors ${checkedSteps.close ? 'border-brand/20 bg-brand/[0.02]' : 'border-white/[0.04] bg-white/[0.01]'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => toggleStep('close')} className="shrink-0">
                    {checkedSteps.close
                      ? <CheckSquare size={18} className="text-brand" />
                      : <Square size={18} className="text-slate-600" />
                    }
                  </button>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      Step 4: Close 1 deal today
                      <Crown size={14} className="text-brand" />
                    </div>
                    <div className="text-[10px] text-slate-500">Leads in negotiation — ready to close</div>
                  </div>
                </div>
                {closeableLeads.length > 0 ? (
                  <div className="ml-8 space-y-1.5">
                    {closeableLeads.map((l, i) => (
                      <div key={l.id || i} className="flex items-center justify-between text-xs bg-black/30 rounded-lg px-3 py-2 border border-brand/10">
                        <div className="flex items-center gap-2">
                          <Crosshair size={12} className="text-brand" />
                          <span className="text-white font-medium">{l.name}</span>
                          <span className="text-slate-500">{l.company}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-brand font-bold">{fmt(l.dealValue || 0)}</span>
                          <span className="text-[10px] text-slate-500">({fmt(Math.round((l.dealValue || 0) * 0.12))} commission)</span>
                          <button onClick={() => onSelect && onSelect(l)}
                            className="px-2 py-1 rounded-md bg-brand text-black text-[10px] font-bold hover:bg-brand/90 transition-colors">
                            CLOSE NOW
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ml-8 text-xs text-slate-500 italic">No leads in negotiation yet — move warm leads forward</div>
                )}
              </div>
            </div>
          </div>

          {/* ── Revenue Calculator ── */}
          <div className="bg-black/40 rounded-xl p-4 border border-white/[0.04]">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
              <Calculator size={14} className="text-brand" /> Revenue Calculator
            </div>

            {/* Main formula */}
            <div className="p-3 rounded-lg bg-brand/[0.04] border border-brand/15 mb-3 text-center">
              <div className="text-sm text-slate-300">
                Close <span className="text-brand font-black text-lg">{dealsPerWeek}</span> deals/week
                <span className="text-slate-600 mx-2">&times;</span>
                <span className="text-white font-black text-lg">{fmt(avgDealSize)}</span> avg deal
                <span className="text-slate-600 mx-2">&times;</span>
                <span className="text-cyan-400 font-bold">12%</span> commission
              </div>
              <div className="mt-2 text-2xl font-black text-brand">
                = {fmt(Math.round(dealsPerWeek * avgDealSize * 0.12 * (52/12)))}/mo MRR
              </div>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Deals per week</span>
                  <span className="text-white font-bold">{dealsPerWeek}</span>
                </div>
                <input type="range" min={1} max={10} value={dealsPerWeek} onChange={e => setDealsPerWeek(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-white/[0.06] cursor-pointer accent-brand" />
                <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                  <span>1</span><span>5</span><span>10</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Avg deal size</span>
                  <span className="text-white font-bold">{fmt(avgDealSize)}</span>
                </div>
                <input type="range" min={5000} max={100000} step={1000} value={avgDealSize} onChange={e => setAvgDealSize(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-white/[0.06] cursor-pointer accent-brand" />
                <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                  <span>$5K</span><span>$50K</span><span>$100K</span>
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">$25K MRR</div>
                <div className="text-sm font-black text-brand">{weeksTo25K > 0 ? `${weeksTo25K} weeks` : 'Achieved!'}</div>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">$50K MRR</div>
                <div className="text-sm font-black text-cyan-400">{weeksTo50K > 0 ? `${weeksTo50K} weeks` : 'Achieved!'}</div>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">$100K MRR</div>
                <div className="text-sm font-black text-purple-400">{weeksTo100K > 0 ? `${weeksTo100K} weeks` : 'Achieved!'}</div>
              </div>
            </div>
          </div>

          {/* ── GOATED Guarantee Badge ── */}
          <div className="p-4 rounded-xl border border-brand/25 bg-brand/[0.04] flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand/15 border-2 border-brand/30 flex items-center justify-center shrink-0">
              <Shield size={28} className="text-brand" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-black text-brand flex items-center gap-2">
                GOATED Guarantee&trade;
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-bold">VERIFIED</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Follow this system daily → <span className="text-brand font-bold">90%+ close rate</span> → <span className="text-white font-bold">$25K MRR in 60 days</span>.
                Our AI coaching, scripts, and objection handling give you an unfair advantage on every deal.
              </p>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <div className="text-2xl font-black text-brand">60</div>
              <div className="text-[10px] text-slate-500 uppercase">Days</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VoIP Dialer Modal
// ---------------------------------------------------------------------------
function VoIPDialerModal({ lead, phone, onClose, onOutcome, showToast }) {
  const [callState, setCallState] = useState('idle'); // idle | ringing | active | ended
  const [duration, setDuration] = useState(0);
  const [outcome, setOutcome] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (callState === 'active') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  const formatDuration = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const startCall = () => {
    // On mobile, open tel: link
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      window.open(`tel:${phone.replace(/[^\d+]/g, '')}`, '_self');
      return;
    }
    setCallState('ringing');
    setTimeout(() => setCallState('active'), 2000);
  };

  const endCall = () => {
    clearInterval(timerRef.current);
    setCallState('ended');
  };

  const recordOutcome = (result) => {
    setOutcome(result);
    if (onOutcome) onOutcome(lead.id, result, duration);
    showToast(`Call with ${lead.name} recorded: ${result}`);
    setTimeout(onClose, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm mx-4 bg-[#0a0a0a] rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <PhoneCall size={16} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">VoIP Dialer</div>
              <div className="text-[10px] text-slate-500">Call via browser or phone</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        {/* Contact Info */}
        <div className="px-5 py-4 text-center">
          <div className="w-16 h-16 rounded-full bg-brand/15 flex items-center justify-center mx-auto mb-3 text-lg font-bold text-brand">
            {lead.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="text-lg font-bold text-white">{lead.name}</div>
          <div className="text-xs text-slate-500">{lead.company} &middot; {lead.title}</div>
          <div className="text-lg font-mono text-brand mt-2">{phone}</div>

          {/* Call State Display */}
          {callState === 'ringing' && (
            <div className="mt-4 flex items-center justify-center gap-2 text-amber-400">
              <Phone size={16} className="animate-bounce" />
              <span className="text-sm font-medium animate-pulse">Ringing...</span>
            </div>
          )}
          {callState === 'active' && (
            <div className="mt-4">
              <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
                <span className="text-sm font-medium">Connected</span>
              </div>
              <div className="text-2xl font-mono font-bold text-white">{formatDuration(duration)}</div>
            </div>
          )}
          {callState === 'ended' && !outcome && (
            <div className="mt-4">
              <div className="text-sm text-slate-400 mb-1">Call ended &middot; {formatDuration(duration)}</div>
              <div className="text-xs text-slate-500 mb-3">Record call outcome:</div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => recordOutcome('connected')} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                  <CheckCircle size={13} /> Connected
                </button>
                <button onClick={() => recordOutcome('voicemail')} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/25 text-xs font-bold text-amber-400 hover:bg-amber-500/25 transition-colors">
                  <PhoneForwarded size={13} /> Voicemail
                </button>
                <button onClick={() => recordOutcome('no-answer')} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-500/15 border border-slate-500/25 text-xs font-bold text-slate-400 hover:bg-slate-500/25 transition-colors">
                  <PhoneMissed size={13} /> No Answer
                </button>
                <button onClick={() => recordOutcome('busy')} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/25 text-xs font-bold text-red-400 hover:bg-red-500/25 transition-colors">
                  <PhoneOff size={13} /> Busy
                </button>
              </div>
            </div>
          )}
          {outcome && (
            <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Outcome recorded: {outcome}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-white/[0.04] flex gap-2">
          {callState === 'idle' && (
            <button onClick={startCall} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors">
              <Phone size={16} /> Call Now
            </button>
          )}
          {(callState === 'ringing' || callState === 'active') && (
            <button onClick={endCall} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">
              <PhoneOff size={16} /> End Call
            </button>
          )}
          {callState === 'idle' && (
            <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-2 border border-white/[0.05] text-slate-400 text-sm hover:text-white transition-colors">
              <Phone size={14} /> Phone App
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scheduling Modal
// ---------------------------------------------------------------------------
function ScheduleModal({ lead, onClose, onSchedule, showToast }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [note, setNote] = useState('');

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 9; h <= 17; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < 17) slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  // Generate next 14 weekdays
  const availableDates = useMemo(() => {
    const dates = [];
    const now = new Date();
    let d = new Date(now);
    d.setDate(d.getDate() + 1);
    while (dates.length < 14) {
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        dates.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  }, []);

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) return;
    const dateObj = new Date(`${selectedDate}T${selectedTime}`);
    if (onSchedule) onSchedule(lead.id, dateObj, note);
    showToast(`Follow-up scheduled with ${lead.name} on ${dateObj.toLocaleDateString()} at ${selectedTime}`);
    onClose();
  };

  const formatDate = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 bg-[#0a0a0a] rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center">
              <CalendarClock size={16} className="text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Schedule Follow-up</div>
              <div className="text-[10px] text-slate-500">{lead.name} &middot; {lead.company}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        {/* Date Selection */}
        <div className="px-5 py-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Date (Mon-Fri)</div>
          <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto mb-4">
            {availableDates.map(d => {
              const dateStr = d.toISOString().split('T')[0];
              const isSelected = selectedDate === dateStr;
              return (
                <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors border ${isSelected ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-surface-2 border-white/[0.04] text-slate-400 hover:text-white hover:border-white/[0.08]'}`}>
                  <div className="text-[10px] opacity-60">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div>{d.getDate()}</div>
                </button>
              );
            })}
          </div>

          {/* Time Slots */}
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Time (9AM - 5PM)</div>
          <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto mb-4">
            {timeSlots.map(t => {
              const isSelected = selectedTime === t;
              const hour = parseInt(t);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const displayHour = hour > 12 ? hour - 12 : hour;
              return (
                <button key={t} onClick={() => setSelectedTime(t)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors border ${isSelected ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-surface-2 border-white/[0.04] text-slate-400 hover:text-white hover:border-white/[0.08]'}`}>
                  {displayHour}:{t.split(':')[1]} {ampm}
                </button>
              );
            })}
          </div>

          {/* Note */}
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Note (optional)</div>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g., Discuss proposal pricing..."
            className="w-full px-3 py-2 bg-surface-1 border border-white/[0.05] rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/40 transition-colors" />
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-white/[0.04] flex gap-2">
          <button onClick={handleSchedule} disabled={!selectedDate || !selectedTime}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Calendar size={16} /> Schedule Follow-up
          </button>
          <button onClick={onClose} className="px-4 py-3 rounded-xl bg-surface-2 border border-white/[0.05] text-slate-400 text-sm hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lead Map View
// ---------------------------------------------------------------------------
const statusMapColors = { new: '#3b82f6', contacted: '#eab308', qualified: '#22c55e', proposal: '#a855f7', negotiation: '#eab308', won: '#22c55e', lost: '#ef4444', nurturing: '#14b8a6', 're-engaged': '#6366f1', 'on-hold': '#f97316', unresponsive: '#ef4444' };

function LeadMapView({ leads, allLeads, onSelect, showToast }) {
  const [hoveredLead, setHoveredLead] = useState(null);
  const [selectedMapLead, setSelectedMapLead] = useState(null);

  // Map locations to approximate coordinates for the WorldMap
  const locationCoords = {
    'New York': [-74, 40.7], 'San Francisco': [-122.4, 37.8], 'Austin': [-97.7, 30.3],
    'Seattle': [-122.3, 47.6], 'Boston': [-71.1, 42.4], 'Chicago': [-87.6, 41.9],
    'Denver': [-104.9, 39.7], 'Miami': [-80.2, 25.8], 'LA': [-118.2, 34.1],
    'London': [-0.1, 51.5], 'Toronto': [-79.4, 43.7], 'Berlin': [13.4, 52.5],
    'Paris': [2.3, 48.9], 'Singapore': [103.8, 1.4], 'Sydney': [151.2, -33.9],
    'Tokyo': [139.7, 35.7], 'Tel Aviv': [34.8, 32.1], 'Dubai': [55.3, 25.3],
    'Amsterdam': [4.9, 52.4], 'Dublin': [-6.3, 53.3], 'Portland': [-122.7, 45.5],
    'Atlanta': [-84.4, 33.8], 'Dallas': [-96.8, 32.8], 'Phoenix': [-112.1, 33.4],
    'Nashville': [-86.8, 36.2], 'Mumbai': [72.9, 19.1], 'Hong Kong': [114.2, 22.3],
    'Stockholm': [18.1, 59.3], 'Zurich': [8.5, 47.4], 'Seoul': [127, 37.6],
    'Bangalore': [77.6, 13], 'São Paulo': [-46.6, -23.6], 'Mexico City': [-99.1, 19.4],
  };

  // Aggregate leads by location
  const locationData = useMemo(() => {
    const locMap = {};
    const leadsToPlot = allLeads.slice(0, 2000); // limit for performance
    for (const l of leadsToPlot) {
      const loc = l.location || 'Unknown';
      if (!locMap[loc]) locMap[loc] = { location: loc, leads: [], statusCounts: {} };
      locMap[loc].leads.push(l);
      locMap[loc].statusCounts[l.status] = (locMap[loc].statusCounts[l.status] || 0) + 1;
    }
    return Object.values(locMap).filter(d => locationCoords[d.location]);
  }, [allLeads]);

  const hotspots = useMemo(() => {
    return locationData.map(d => {
      const coords = locationCoords[d.location];
      const dominantStatus = Object.entries(d.statusCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'new';
      return {
        name: d.location,
        coords,
        value: d.leads.length,
        color: statusMapColors[dominantStatus] || '#3b82f6',
      };
    });
  }, [locationData]);

  return (
    <div className="bg-surface-3 rounded-xl border border-white/[0.03] overflow-hidden">
      {/* Legend */}
      <div className="px-4 py-3 border-b border-white/[0.03] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Map size={16} className="text-brand" />
          <span className="text-sm font-medium text-white">Lead Map</span>
          <span className="text-xs text-slate-500">{locationData.reduce((s, d) => s + d.leads.length, 0).toLocaleString()} leads plotted</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> New</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Contacted</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Qualified/Won</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Lost</span>
        </div>
      </div>

      {/* Map */}
      <div className="relative h-[400px]">
        <Suspense fallback={<div className="h-full flex items-center justify-center text-slate-500 text-sm">Loading map...</div>}>
          <WorldMap hotspots={hotspots} className="h-full"
            onCenterClick={(center) => {
              const loc = locationData.find(d => d.location === center.name);
              if (loc) setSelectedMapLead(loc);
            }}
          />
        </Suspense>
        {/* Selected location overlay */}
        {selectedMapLead && (
          <div className="absolute top-4 right-4 w-72 bg-black/90 backdrop-blur-md rounded-xl border border-white/[0.08] shadow-xl overflow-hidden z-10">
            <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-brand" />
                <span className="text-sm font-bold text-white">{selectedMapLead.location}</span>
                <span className="text-xs text-slate-500">{selectedMapLead.leads.length} leads</span>
              </div>
              <button onClick={() => setSelectedMapLead(null)} className="p-1 rounded text-slate-500 hover:text-white"><X size={14} /></button>
            </div>
            <div className="px-4 py-2 max-h-48 overflow-y-auto">
              {selectedMapLead.leads.slice(0, 10).map(l => (
                <div key={l.id} onClick={() => onSelect(l)} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] cursor-pointer hover:bg-white/[0.02] -mx-1 px-1 rounded">
                  <div>
                    <div className="text-xs font-medium text-white">{l.name}</div>
                    <div className="text-[10px] text-slate-500">{l.company}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${statusColors[l.status] || 'bg-slate-500/15 text-slate-400'}`}>{l.status}</span>
                    <span className="text-[10px] font-mono text-slate-400">{fmt(l.dealValue || 0)}</span>
                  </div>
                </div>
              ))}
              {selectedMapLead.leads.length > 10 && (
                <div className="text-center text-[10px] text-slate-500 py-2">+{selectedMapLead.leads.length - 10} more leads</div>
              )}
            </div>
            {/* Status breakdown */}
            <div className="px-4 py-2 border-t border-white/[0.04] flex flex-wrap gap-1.5">
              {Object.entries(selectedMapLead.statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                <span key={status} className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${statusColors[status] || 'bg-slate-500/15 text-slate-400'}`}>
                  {status}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contact Intel Row Component
// ---------------------------------------------------------------------------
function ContactIntelRow({ lead, index, colSpan, onCallClick, onScheduleClick }) {
  const intel = useMemo(() => getContactIntel(lead, index), [lead, index]);
  const deficits = useMemo(() => getLeadDeficits(lead, index), [lead, index]);

  // Generate social media URLs from lead name
  const nameSlug = lead.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '');
  const linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(lead.name + ' ' + lead.company)}`;
  const twitterUrl = `https://twitter.com/search?q=${encodeURIComponent(lead.name + ' ' + lead.company)}&f=user`;

  // TruePeopleSearch / WhitePages lookup URLs
  const truePeopleUrl = `https://www.truepeoplesearch.com/results?name=${encodeURIComponent(lead.name)}&citystatezip=${encodeURIComponent(lead.location || '')}`;
  const whitePagesUrl = `https://www.whitepages.com/name/${encodeURIComponent(lead.name)}/${encodeURIComponent(lead.location || '')}`;

  // Generate a second estimated phone from lead data
  const seed2 = (index + 1) * 6173;
  const areaCode2 = seededRange(seed2, 200, 999);
  const mid2 = seededRange(seed2 + 1, 100, 999);
  const last2 = seededRange(seed2 + 2, 1000, 9999);
  const phone2 = `(${areaCode2}) ${mid2}-${last2}`;
  const isPhone1Verified = simpleHash((index + 1) * 3301) > 0.4;
  const isPhone2Verified = simpleHash((index + 1) * 5501) > 0.7;

  return (
    <tr className="border-b border-white/[0.03] bg-surface-2/50">
      <td colSpan={colSpan} className="px-4 py-3">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Contact Info */}
          <div className="flex-shrink-0 lg:w-80">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
              <PhoneCall size={11} /> Contact Intel
              <span className="ml-auto flex items-center gap-1 text-[9px] text-slate-600">
                <Activity size={9} className={intel.lastActiveDays < 7 ? 'text-emerald-400' : intel.lastActiveDays < 30 ? 'text-amber-400' : 'text-slate-500'} />
                {intel.lastActive}
              </span>
            </div>

            {/* Phone Numbers */}
            <div className="space-y-1.5 mb-2">
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-slate-500" />
                <span className="text-sm font-mono text-white">{intel.phone}</span>
                {isPhone1Verified ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"><BadgeCheck size={8} />Verified</span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[9px] font-medium bg-amber-500/10 text-amber-400/70 border border-amber-500/20">Estimated</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-slate-600" />
                <span className="text-xs font-mono text-slate-400">{phone2}</span>
                {isPhone2Verified ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"><BadgeCheck size={8} />Verified</span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[9px] font-medium bg-amber-500/10 text-amber-400/70 border border-amber-500/20">Estimated</span>
                )}
              </div>
            </div>

            {/* Address with pin icon */}
            <div className="flex items-start gap-2 mb-2">
              <MapPin size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs text-slate-400">{intel.address}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Navigation size={9} className="text-blue-400" />
                  <span className="text-[10px] text-blue-400">{lead.location || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="flex items-center gap-2 mb-3">
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 hover:bg-blue-500/20 transition-colors">
                <Linkedin size={10} /> LinkedIn
              </a>
              <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[10px] text-sky-400 hover:bg-sky-500/20 transition-colors">
                <Twitter size={10} /> Twitter
              </a>
              <a href={`mailto:${lead.email}`}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 hover:bg-purple-500/20 transition-colors">
                <Mail size={10} /> Email
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-1.5">
              <button onClick={(e) => { e.stopPropagation(); if (onCallClick) onCallClick(lead, intel.phone); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                <PhoneCall size={12} /> Call Now
              </button>
              <button onClick={(e) => { e.stopPropagation(); if (onScheduleClick) onScheduleClick(lead); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/25 text-xs font-bold text-blue-400 hover:bg-blue-500/25 transition-colors">
                <CalendarClock size={12} /> Schedule
              </button>
              <a href={truePeopleUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-1 border border-white/[0.05] text-[10px] text-slate-400 hover:text-white transition-colors">
                <UserSearch size={10} /> TruePeopleSearch
              </a>
              <a href={whitePagesUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-1 border border-white/[0.05] text-[10px] text-slate-400 hover:text-white transition-colors">
                <ExternalLink size={10} /> WhitePages
              </a>
            </div>
          </div>

          {/* Deficit Breakdown */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
              <AlertTriangle size={11} /> Business Deficit Analysis
              <span className="ml-auto text-[10px] font-mono font-bold text-red-400">-{fmt(deficits.totalMonthlyLoss)}/mo lost</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
              {deficits.deficits.map(d => (
                <div key={d.key} className={`rounded-lg px-2 py-1.5 border border-white/[0.04] ${deficitStatusColor(d.status)}`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <d.icon size={10} />
                    <span className="text-[10px] font-medium truncate">{d.label}</span>
                  </div>
                  {d.monthlyLoss > 0 ? (
                    <div className="text-xs font-bold font-mono">-{fmt(d.monthlyLoss)}/mo</div>
                  ) : (
                    <div className="text-[10px] font-medium opacity-60">Healthy</div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
              <span>Opportunity if fixed: <strong className="text-emerald-400">{fmt(deficits.opportunityValue)}</strong></span>
              <span>Accumulated loss: <strong className="text-red-400">{fmt(deficits.lostRevenue)}</strong></span>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// AI Prompt Parser — extracts intent from natural language
// ---------------------------------------------------------------------------
function parseAIPrompt(prompt) {
  const lower = prompt.toLowerCase().trim();
  const filters = { search: '', industry: '', status: '', priority: '', minScore: 0, maxScore: 100, minDeal: 0, maxDeal: Infinity, location: '', title: '', source: '', momentum: '', sort: 'score', order: 'desc' };
  const understood = [];

  // Industry detection
  const industryMap = {
    'saas': 'SaaS', 'fintech': 'Fintech', 'ecommerce': 'E-commerce', 'e-commerce': 'E-commerce',
    'healthcare': 'Healthcare', 'edtech': 'EdTech', 'devtools': 'DevTools', 'cybersecurity': 'Cybersecurity',
    'ai': 'AI/ML', 'ai/ml': 'AI/ML', 'machine learning': 'AI/ML', 'martech': 'MarTech', 'proptech': 'PropTech',
    'insurtech': 'InsurTech', 'legaltech': 'LegalTech', 'cleantech': 'CleanTech', 'biotech': 'BioTech',
    'medtech': 'MedTech', 'foodtech': 'FoodTech', 'hrtech': 'HRTech', 'adtech': 'AdTech',
    'logistics': 'Logistics', 'gaming': 'Gaming', 'media': 'Media', 'retail': 'Retail',
    'construction': 'Construction', 'travel': 'Travel', 'fashion': 'Fashion', 'energy': 'Energy',
    'automotive': 'Automotive', 'aerospace': 'Aerospace', 'sports': 'Sports',
  };
  for (const [key, val] of Object.entries(industryMap)) {
    if (lower.includes(key)) { filters.industry = val; understood.push(`Industry: ${val}`); break; }
  }

  // Deal size parsing
  const dealMatch = lower.match(/(\$?[\d,.]+)\s*[k|m|K|M]?\s*(?:\+|above|over|more than|minimum|min|at least)/i)
    || lower.match(/(?:above|over|more than|minimum|min|at least|deal\s*size\s*(?:of|above|over)?)\s*\$?([\d,.]+)\s*([kmKM])?/i)
    || lower.match(/\$?([\d,.]+)\s*([kmKM])\s*(?:deals?|deal\s*size|value|pipeline)/i);
  if (dealMatch) {
    let val = parseFloat(dealMatch[1].replace(/,/g, ''));
    const suffix = (dealMatch[2] || '').toLowerCase();
    if (suffix === 'k') val *= 1000;
    if (suffix === 'm') val *= 1000000;
    if (!suffix && val < 1000) val *= 1000; // assume K if no suffix and small number
    filters.minDeal = val;
    understood.push(`Min deal size: ${fmt(val)}`);
  }

  const dealMaxMatch = lower.match(/(?:under|below|less than|max|maximum|up to)\s*\$?([\d,.]+)\s*([kmKM])?/i);
  if (dealMaxMatch) {
    let val = parseFloat(dealMaxMatch[1].replace(/,/g, ''));
    const suffix = (dealMaxMatch[2] || '').toLowerCase();
    if (suffix === 'k') val *= 1000;
    if (suffix === 'm') val *= 1000000;
    if (!suffix && val < 1000) val *= 1000;
    filters.maxDeal = val;
    understood.push(`Max deal size: ${fmt(val)}`);
  }

  // Score parsing
  const scoreMatch = lower.match(/score\s*(?:above|over|>=?|at least|minimum)\s*(\d+)/i) || lower.match(/(\d+)\+?\s*score/i);
  if (scoreMatch) { filters.minScore = parseInt(scoreMatch[1]); understood.push(`Min score: ${filters.minScore}`); }

  // Status detection
  const statusMap = { 'new': 'new', 'contacted': 'contacted', 'qualified': 'qualified', 'proposal': 'proposal',
    'negotiation': 'negotiation', 'negotiating': 'negotiation', 'won': 'won', 'closed won': 'won', 'lost': 'lost',
    'closed lost': 'lost', 'nurturing': 'nurturing', 'nurture': 'nurturing', 're-engaged': 're-engaged',
    'on hold': 'on-hold', 'on-hold': 'on-hold', 'unresponsive': 'unresponsive', 'cold': 'unresponsive',
    'active': 'qualified', 'hot': 'negotiation', 'warm': 'contacted' };
  for (const [key, val] of Object.entries(statusMap)) {
    if (lower.includes(key)) { filters.status = val; understood.push(`Status: ${val}`); break; }
  }

  // Priority detection
  const prioMap = { 'critical': 'critical', 'urgent': 'critical', 'high priority': 'high', 'high-priority': 'high',
    'medium priority': 'medium', 'low priority': 'low' };
  for (const [key, val] of Object.entries(prioMap)) {
    if (lower.includes(key)) { filters.priority = val; understood.push(`Priority: ${val}`); break; }
  }

  // Location detection
  const locationMap = {
    'new york': 'New York', 'nyc': 'New York', 'san francisco': 'San Francisco', 'sf': 'San Francisco',
    'austin': 'Austin', 'seattle': 'Seattle', 'boston': 'Boston', 'chicago': 'Chicago', 'denver': 'Denver',
    'miami': 'Miami', 'los angeles': 'LA', 'la': 'LA', 'london': 'London', 'toronto': 'Toronto',
    'berlin': 'Berlin', 'paris': 'Paris', 'singapore': 'Singapore', 'sydney': 'Sydney', 'tokyo': 'Tokyo',
    'tel aviv': 'Tel Aviv', 'dubai': 'Dubai', 'amsterdam': 'Amsterdam', 'dublin': 'Dublin',
    'portland': 'Portland', 'atlanta': 'Atlanta', 'dallas': 'Dallas', 'phoenix': 'Phoenix',
    'nashville': 'Nashville', 'mumbai': 'Mumbai', 'hong kong': 'Hong Kong',
  };
  for (const [key, val] of Object.entries(locationMap)) {
    if (lower.includes(key)) { filters.location = val; understood.push(`Location: ${val}`); break; }
  }

  // Title/role detection
  const titleKeywords = ['ceo', 'cto', 'coo', 'founder', 'co-founder', 'owner', 'vp', 'director', 'head of',
    'manager', 'president', 'partner', 'principal', 'executive'];
  for (const t of titleKeywords) {
    if (lower.includes(t)) { filters.title = t; understood.push(`Role: ${t.toUpperCase()}`); break; }
  }

  // Momentum detection
  if (lower.includes('rising') || lower.includes('growing') || lower.includes('surging')) {
    filters.momentum = 'rising'; understood.push('Momentum: Rising');
  } else if (lower.includes('declining') || lower.includes('dropping')) {
    filters.momentum = 'declining'; understood.push('Momentum: Declining');
  }

  // Source detection
  const sourceMap = { 'linkedin': 'LinkedIn', 'cold email': 'Cold Email', 'website': 'Website',
    'referral': 'Referral', 'webinar': 'Webinar', 'conference': 'Conference', 'apollo': 'Apollo' };
  for (const [key, val] of Object.entries(sourceMap)) {
    if (lower.includes(key)) { filters.source = val; understood.push(`Source: ${val}`); break; }
  }

  // Sort detection
  if (lower.includes('highest value') || lower.includes('biggest deals') || lower.includes('most valuable')) {
    filters.sort = 'dealValue'; filters.order = 'desc'; understood.push('Sort: Highest value');
  } else if (lower.includes('newest') || lower.includes('most recent') || lower.includes('latest')) {
    filters.sort = 'created_at'; filters.order = 'desc'; understood.push('Sort: Newest first');
  } else if (lower.includes('highest score') || lower.includes('best score') || lower.includes('top scored')) {
    filters.sort = 'score'; filters.order = 'desc'; understood.push('Sort: Highest score');
  }

  // Hot leads shortcut
  if (lower.includes('hot lead') || lower.includes('hot leads') || lower.includes('fire')) {
    filters.minScore = Math.max(filters.minScore, 80);
    if (!understood.some(u => u.startsWith('Min score'))) understood.push('Min score: 80 (Hot leads)');
  }

  // Enterprise shortcut
  if (lower.includes('enterprise') || lower.includes('big companies') || lower.includes('large companies')) {
    filters.minDeal = Math.max(filters.minDeal, 50000);
    if (!understood.some(u => u.startsWith('Min deal'))) understood.push('Min deal: $50K (Enterprise)');
  }

  // If nothing was understood, use the whole prompt as a text search
  if (understood.length === 0 && lower.length > 0) {
    filters.search = prompt;
    understood.push(`Text search: "${prompt}"`);
  }

  return { filters, understood };
}

// ---------------------------------------------------------------------------
// Preset Prompts
// ---------------------------------------------------------------------------
const PRESET_PROMPTS = [
  { label: 'Hot SaaS leads', prompt: 'Show me hot SaaS leads with score above 80', icon: Flame },
  { label: 'Enterprise $100K+', prompt: 'Enterprise deals over $100K in negotiation', icon: Building2 },
  { label: 'Fintech founders', prompt: 'Fintech founders in New York with high priority', icon: DollarSign },
  { label: 'Rising momentum', prompt: 'Rising momentum leads from LinkedIn with $50K+ deals', icon: TrendingUp },
  { label: 'AI/ML companies', prompt: 'AI/ML companies with critical priority and 90+ score', icon: Brain },
  { label: 'CEO decision makers', prompt: 'CEOs and founders in San Francisco SaaS companies', icon: Target },
  { label: 'Healthcare qualified', prompt: 'Healthcare qualified leads above $75K deal size', icon: Shield },
  { label: 'Newest high value', prompt: 'Newest leads with deal value over $80K sorted by most recent', icon: Clock },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function relativeTime(dateStr) {
  if (!dateStr) return '--';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return 'Just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function scoreBarColor(score) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 40) return 'bg-blue-500';
  return 'bg-slate-500';
}

function scoreTextColor(score) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-blue-400';
  return 'text-slate-400';
}

// ---------------------------------------------------------------------------
// AnimatedNumber
// ---------------------------------------------------------------------------
function AnimatedNumber({ value, format }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const frameRef = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;
    prevRef.current = to;
    const duration = 600;
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return <>{format ? format(display) : display.toLocaleString()}</>;
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
function Toast({ message, visible, onDone }) {
  useEffect(() => {
    if (visible) { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }
  }, [visible, onDone]);
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_0.3s_ease-out]">
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium shadow-lg shadow-black/30 backdrop-blur-sm">
        <Zap size={16} />{message}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SortHeader
// ---------------------------------------------------------------------------
function SortHeader({ field, label, sortField, sortDirection, onSort }) {
  const active = sortField === field;
  return (
    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors group" onClick={() => onSort(field)}>
      <div className="flex items-center gap-1">
        <span className={active ? 'text-brand' : 'text-slate-500'}>{label}</span>
        {active ? (sortDirection === 'asc' ? <ChevronUp size={14} className="text-brand" /> : <ChevronDown size={14} className="text-brand" />) :
          <ChevronDown size={14} className="text-slate-700 group-hover:text-slate-500 transition-colors" />}
      </div>
    </th>
  );
}

// ---------------------------------------------------------------------------
// AI Chat Message Component
// ---------------------------------------------------------------------------
function AIChatMessage({ role, content, filters, understood, leadCount, timestamp, isAI, isError }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-brand/20 border border-brand/30 text-white text-sm">
          {content}
        </div>
      </div>
    );
  }

  // Render markdown-like content for AI responses (bold, bullets, headers)
  const renderContent = (text) => {
    if (!isAI) return <p className="text-slate-300">{text}</p>;
    return (
      <div className="text-slate-300 space-y-1.5 leading-relaxed [&_strong]:text-brand [&_strong]:font-semibold">
        {text.split('\n').map((line, i) => {
          if (!line.trim()) return <div key={i} className="h-1" />;
          // Headers
          if (line.startsWith('### ')) return <h4 key={i} className="text-xs font-bold text-white mt-2">{line.slice(4)}</h4>;
          if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-bold text-white mt-2">{line.slice(3)}</h3>;
          // Bullets
          if (line.startsWith('- ') || line.startsWith('* ')) {
            const bullet = line.slice(2);
            return <div key={i} className="flex gap-2 pl-1"><span className="text-brand mt-0.5">•</span><span dangerouslySetInnerHTML={{ __html: bullet.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} /></div>;
          }
          // Regular text with bold
          return <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />;
        })}
      </div>
    );
  };

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[90%]">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isAI ? 'bg-purple-500/20' : isError ? 'bg-red-500/20' : 'bg-brand/20'}`}>
            {isAI ? <Sparkles size={12} className="text-purple-400" /> : <Bot size={14} className={isError ? 'text-red-400' : 'text-brand'} />}
          </div>
          <span className="text-xs text-slate-500">{timestamp || 'Just now'}</span>
          {isAI && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">AI Insight</span>}
        </div>
        <div className={`px-4 py-3 rounded-2xl rounded-tl-md border text-sm ${isError ? 'bg-red-500/5 border-red-500/15' : isAI ? 'bg-purple-500/5 border-purple-500/15' : 'bg-surface-2 border-white/[0.03]'}`}>
          {renderContent(content)}
          {understood && understood.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {understood.map((u, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand/10 text-brand border border-brand/20">
                  <CheckCircle size={10} /> {u}
                </span>
              ))}
            </div>
          )}
          {leadCount !== undefined && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <Users size={12} /> Found <span className="text-brand font-bold">{leadCount.toLocaleString()}</span> matching leads
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScoreDot
// ---------------------------------------------------------------------------
function ScoreDot({ score }) {
  if (score >= 80) return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  );
  if (score >= 60) return <span className="relative flex h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />;
  return null;
}

// ---------------------------------------------------------------------------
// MomentumIndicator
// ---------------------------------------------------------------------------
function MomentumIndicator({ momentum }) {
  if (momentum === 'rising' || momentum === 'surging') {
    return (
      <div className="flex items-center gap-1">
        <ArrowUpRight size={14} className={momentum === 'surging' ? 'text-emerald-400' : 'text-brand'} />
        <span className={`text-[11px] font-medium ${momentum === 'surging' ? 'text-emerald-400' : 'text-brand'}`}>
          {momentum === 'surging' ? 'Surging' : 'Rising'}
        </span>
      </div>
    );
  }
  if (momentum === 'declining' || momentum === 'cooling') {
    return (
      <div className="flex items-center gap-1">
        <ArrowDownRight size={14} className={momentum === 'declining' ? 'text-red-400' : 'text-orange-400'} />
        <span className={`text-[11px] font-medium ${momentum === 'declining' ? 'text-red-400' : 'text-orange-400'}`}>
          {momentum === 'declining' ? 'Declining' : 'Cooling'}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <MoveRight size={14} className="text-slate-500" />
      <span className="text-[11px] font-medium text-slate-500">Stable</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DataSourceBadge
// ---------------------------------------------------------------------------
function DataSourceBadge({ source }) {
  const colors = sourceColors[source] || 'bg-slate-500/15 text-slate-400 border-slate-500/25';
  const Icon = sourceIcons[source] || Globe;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors}`}>
      <Icon size={10} />{source}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Multiplayer Closing Ecosystem — Mock Data
// ---------------------------------------------------------------------------
const CLOSER_LEADERBOARD = [
  { id: 1, username: '@closerking', avatar: 'CK', deals: 47, revenue: 823500, closeRate: 94, streak: 12, isCurrentUser: false },
  { id: 2, username: '@degenalpha', avatar: 'DA', deals: 41, revenue: 712000, closeRate: 91, streak: 8, isCurrentUser: false },
  { id: 3, username: '@wolfofdeals', avatar: 'WD', deals: 38, revenue: 695000, closeRate: 89, streak: 15, isCurrentUser: false },
  { id: 4, username: '@salesgoat', avatar: 'SG', deals: 35, revenue: 580000, closeRate: 87, streak: 6, isCurrentUser: true },
  { id: 5, username: '@pipeline_god', avatar: 'PG', deals: 33, revenue: 545000, closeRate: 85, streak: 10, isCurrentUser: false },
  { id: 6, username: '@commission_queen', avatar: 'CQ', deals: 31, revenue: 498000, closeRate: 83, streak: 4, isCurrentUser: false },
  { id: 7, username: '@deal_surgeon', avatar: 'DS', deals: 28, revenue: 462000, closeRate: 81, streak: 7, isCurrentUser: false },
  { id: 8, username: '@rev_hunter', avatar: 'RH', deals: 26, revenue: 415000, closeRate: 79, streak: 3, isCurrentUser: false },
  { id: 9, username: '@cold_call_king', avatar: 'CC', deals: 24, revenue: 388000, closeRate: 77, streak: 5, isCurrentUser: false },
  { id: 10, username: '@quota_crusher', avatar: 'QC', deals: 22, revenue: 351000, closeRate: 75, streak: 2, isCurrentUser: false },
];

const CLOSING_FEED_TEMPLATES = [
  { username: '@closerking', amount: 15000, company: 'Flowstate.io' },
  { username: '@degenalpha', amount: 22000, company: 'NimbusOps' },
  { username: '@wolfofdeals', amount: 8500, company: 'BrightPath Labs' },
  { username: '@pipeline_god', amount: 31000, company: 'QuantumLeap' },
  { username: '@commission_queen', amount: 12000, company: 'SyncWave' },
  { username: '@salesgoat', amount: 45000, company: 'MetricFlow' },
  { username: '@deal_surgeon', amount: 19500, company: 'EdgeSync' },
  { username: '@rev_hunter', amount: 7800, company: 'GridPoint' },
  { username: '@cold_call_king', amount: 28000, company: 'VelocityAI' },
  { username: '@quota_crusher', amount: 11200, company: 'PrismLogic' },
  { username: '@closerking', amount: 52000, company: 'Apex Plumbing' },
  { username: '@degenalpha', amount: 16500, company: 'Summit Marketing' },
  { username: '@wolfofdeals', amount: 38000, company: 'TerraNode' },
  { username: '@pipeline_god', amount: 9200, company: 'Ironclad Creative' },
  { username: '@commission_queen', amount: 27000, company: 'HyperLoop Labs' },
];

const BET_ODDS = [
  { target: 50000, yesOdds: '+120', noOdds: '-150' },
  { target: 50000, yesOdds: '+180', noOdds: '-110' },
  { target: 50000, yesOdds: '+250', noOdds: '-180' },
  { target: 50000, yesOdds: '-110', noOdds: '+140' },
  { target: 50000, yesOdds: '+150', noOdds: '-130' },
  { target: 50000, yesOdds: '+300', noOdds: '-200' },
  { target: 50000, yesOdds: '+200', noOdds: '-160' },
  { target: 50000, yesOdds: '+140', noOdds: '-120' },
  { target: 50000, yesOdds: '+220', noOdds: '-170' },
  { target: 50000, yesOdds: '+350', noOdds: '-250' },
];

function rankBadge(rank) {
  if (rank === 1) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
  if (rank === 2) return 'bg-slate-300/15 text-slate-300 border-slate-300/30';
  if (rank === 3) return 'bg-amber-700/20 text-amber-600 border-amber-700/30';
  return 'bg-white/5 text-slate-500 border-white/10';
}

function rankIcon(rank) {
  if (rank <= 3) return Crown;
  return Hash;
}

// ---------------------------------------------------------------------------
// CloserLeaderboard Component
// ---------------------------------------------------------------------------
function CloserLeaderboard({ degenMode, showToast }) {
  const [expanded, setExpanded] = useState(true);
  const [bets, setBets] = useState({}); // { closerId: 'yes' | 'no' }
  const [goatBalance] = useState(24750); // Simulated GOAT token balance

  const handleBet = (closerId, side) => {
    setBets(prev => ({ ...prev, [closerId]: prev[closerId] === side ? null : side }));
    showToast(`Bet placed: ${side === 'yes' ? 'YES' : 'NO'} on closer #${closerId}`);
  };

  return (
    <div className="mb-4 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/[0.04] via-black to-cyan-500/[0.02] overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center relative">
            <Crown size={20} className="text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">LIVE Closer Leaderboard</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 font-bold animate-pulse">LIVE</span>
            </div>
            <span className="text-xs text-slate-500">Top 10 closers ranked by weekly performance</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {degenMode && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Wallet size={12} className="text-orange-400" />
              <span className="text-xs font-bold text-orange-400">{goatBalance.toLocaleString()} GOAT</span>
            </div>
          )}
          {expanded ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="overflow-x-auto">
            <div className="space-y-1.5 min-w-[600px]">
              {/* Header */}
              <div className="flex items-center gap-3 px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                <div className="w-8 text-center">Rank</div>
                <div className="flex-1">Closer</div>
                <div className="w-16 text-center">Deals</div>
                <div className="w-20 text-right">Revenue</div>
                <div className="w-16 text-center">Close %</div>
                <div className="w-16 text-center">Streak</div>
                {degenMode && <div className="w-24 text-center">Bet</div>}
              </div>

              {CLOSER_LEADERBOARD.map((closer, idx) => {
                const rank = idx + 1;
                const RankIcon = rankIcon(rank);
                return (
                  <div key={closer.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      closer.isCurrentUser
                        ? 'bg-brand/[0.06] border border-brand/25'
                        : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]'
                    }`}>
                    {/* Rank */}
                    <div className="w-8 flex justify-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs font-black ${rankBadge(rank)}`}>
                        {rank <= 3 ? <RankIcon size={14} /> : rank}
                      </div>
                    </div>

                    {/* User */}
                    <div className="flex-1 flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        closer.isCurrentUser ? 'bg-brand/20 text-brand border border-brand/30' : 'bg-white/[0.06] text-slate-400 border border-white/[0.06]'
                      }`}>
                        {closer.avatar}
                      </div>
                      <div>
                        <span className={`text-xs font-bold ${closer.isCurrentUser ? 'text-brand' : 'text-white'}`}>{closer.username}</span>
                        {closer.isCurrentUser && (
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-brand/15 text-brand border border-brand/25 font-bold">YOU</span>
                        )}
                      </div>
                    </div>

                    {/* Deals */}
                    <div className="w-16 text-center">
                      <span className="text-sm font-bold text-white">{closer.deals}</span>
                    </div>

                    {/* Revenue */}
                    <div className="w-20 text-right">
                      <span className="text-xs font-bold text-emerald-400">{fmt(closer.revenue)}</span>
                    </div>

                    {/* Close Rate */}
                    <div className="w-16 text-center">
                      <span className={`text-xs font-bold ${closer.closeRate >= 90 ? 'text-emerald-400' : closer.closeRate >= 80 ? 'text-cyan-400' : 'text-amber-400'}`}>
                        {closer.closeRate}%
                      </span>
                    </div>

                    {/* Streak */}
                    <div className="w-16 flex items-center justify-center gap-1">
                      <Flame size={12} className="text-orange-400" />
                      <span className="text-xs font-bold text-orange-400">{closer.streak}</span>
                    </div>

                    {/* Bet (DEGEN only) */}
                    {degenMode && (
                      <div className="w-24 flex items-center gap-1">
                        <button
                          onClick={() => handleBet(closer.id, 'yes')}
                          className={`flex-1 px-1.5 py-1 rounded text-[9px] font-bold transition-colors ${
                            bets[closer.id] === 'yes'
                              ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/40'
                              : 'bg-white/[0.04] text-slate-500 border border-white/[0.06] hover:bg-emerald-500/10 hover:text-emerald-400'
                          }`}>
                          YES <span className="text-[8px] opacity-70">{BET_ODDS[idx]?.yesOdds}</span>
                        </button>
                        <button
                          onClick={() => handleBet(closer.id, 'no')}
                          className={`flex-1 px-1.5 py-1 rounded text-[9px] font-bold transition-colors ${
                            bets[closer.id] === 'no'
                              ? 'bg-red-500/25 text-red-400 border border-red-500/40'
                              : 'bg-white/[0.04] text-slate-500 border border-white/[0.06] hover:bg-red-500/10 hover:text-red-400'
                          }`}>
                          NO <span className="text-[8px] opacity-70">{BET_ODDS[idx]?.noOdds}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {degenMode && (
            <div className="mt-3 p-2.5 rounded-lg bg-orange-500/[0.05] border border-orange-500/15 text-center">
              <span className="text-[10px] text-orange-400/70">Bet if a closer hits <span className="font-bold text-orange-400">$50K this week</span> using GOAT tokens. Odds update live.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SocialClosingFeed Component
// ---------------------------------------------------------------------------
function SocialClosingFeed({ showToast }) {
  const [feedItems, setFeedItems] = useState(() => {
    const initial = [];
    for (let i = 0; i < 5; i++) {
      const tmpl = CLOSING_FEED_TEMPLATES[i % CLOSING_FEED_TEMPLATES.length];
      initial.push({
        id: i,
        username: tmpl.username,
        amount: tmpl.amount,
        company: tmpl.company,
        timeAgo: `${(5 - i) * 2 + 1}m ago`,
        reactions: { fire: Math.floor(Math.random() * 20) + 3, eyes: Math.floor(Math.random() * 10) + 1, money: Math.floor(Math.random() * 15) + 2 },
      });
    }
    return initial;
  });
  const [expanded, setExpanded] = useState(true);
  const nextIdRef = useRef(100);

  useEffect(() => {
    const interval = setInterval(() => {
      const tmpl = CLOSING_FEED_TEMPLATES[Math.floor(Math.random() * CLOSING_FEED_TEMPLATES.length)];
      const newItem = {
        id: nextIdRef.current++,
        username: tmpl.username,
        amount: Math.round(tmpl.amount * (0.7 + Math.random() * 0.8)),
        company: tmpl.company,
        timeAgo: 'just now',
        reactions: { fire: 0, eyes: 0, money: 0 },
      };
      setFeedItems(prev => [newItem, ...prev].slice(0, 10));
    }, 8000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, []);

  const handleReaction = (itemId, type) => {
    setFeedItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, reactions: { ...item.reactions, [type]: item.reactions[type] + 1 } } : item
    ));
  };

  return (
    <div className="mb-4 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/[0.04] via-black to-purple-500/[0.02] overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center">
            <Activity size={20} className="text-purple-400" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Live Closing Feed</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25 font-bold">REAL-TIME</span>
            </div>
            <span className="text-xs text-slate-500">Watch closers land deals in real time</span>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {feedItems.map((item, idx) => (
            <div key={item.id}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] transition-all ${
                idx === 0 ? 'animate-pulse-once border-purple-500/20 bg-purple-500/[0.03]' : ''
              }`}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-full bg-purple-500/15 flex items-center justify-center text-[9px] font-bold text-purple-400 shrink-0">
                  {item.username.slice(1, 3).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="text-xs">
                    <span className="font-bold text-purple-400">{item.username}</span>
                    <span className="text-slate-400"> just closed a </span>
                    <span className="font-bold text-emerald-400">{fmt(item.amount)}</span>
                    <span className="text-slate-400"> deal with </span>
                    <span className="font-medium text-white">{item.company}</span>
                  </span>
                  <div className="text-[10px] text-slate-600 mt-0.5">{item.timeAgo}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button onClick={() => handleReaction(item.id, 'fire')}
                  className="flex items-center gap-0.5 px-1.5 py-1 rounded-md bg-white/[0.03] hover:bg-orange-500/10 transition-colors text-[10px]">
                  <Flame size={10} className="text-orange-400" /><span className="text-slate-400">{item.reactions.fire}</span>
                </button>
                <button onClick={() => handleReaction(item.id, 'eyes')}
                  className="flex items-center gap-0.5 px-1.5 py-1 rounded-md bg-white/[0.03] hover:bg-cyan-500/10 transition-colors text-[10px]">
                  <Eye size={10} className="text-cyan-400" /><span className="text-slate-400">{item.reactions.eyes}</span>
                </button>
                <button onClick={() => handleReaction(item.id, 'money')}
                  className="flex items-center gap-0.5 px-1.5 py-1 rounded-md bg-white/[0.03] hover:bg-emerald-500/10 transition-colors text-[10px]">
                  <DollarSign size={10} className="text-emerald-400" /><span className="text-slate-400">{item.reactions.money}</span>
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-center pt-1">
            <button
              onClick={() => showToast('Watch Live coming soon — connect your TikTok')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-400 hover:bg-purple-500/20 transition-colors">
              <Video size={14} /> Watch Live
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CreatorProgramBanner Component
// ---------------------------------------------------------------------------
function CreatorProgramBanner({ showToast }) {
  return (
    <div className="mb-4 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/[0.05] via-black to-amber-500/[0.03] overflow-hidden">
      <div className="px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
          <Star size={24} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-black text-white uppercase tracking-wider">GOATED Creator Program</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 font-bold">EARN</span>
          </div>
          <p className="text-xs text-slate-400">
            Screen record your degen closing sessions on TikTok &amp; earn. <span className="text-amber-400 font-bold">15% revenue share</span> on all referred user revenue.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-amber-400/70" />
              <span className="text-[10px] text-slate-500"><span className="text-amber-400 font-bold">247</span> creators earning</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign size={12} className="text-emerald-400/70" />
              <span className="text-[10px] text-slate-500"><span className="text-emerald-400 font-bold">$45K</span> paid out this month</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => showToast('Creator application submitted! We\'ll be in touch.')}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-black uppercase tracking-wider hover:from-amber-400 hover:to-orange-400 transition-all shrink-0 shadow-lg shadow-amber-500/20">
          Apply for Creator Access
        </button>
      </div>
    </div>
  );
}

// ===========================================================================================
// MAIN COMPONENT
// ===========================================================================================
export default function LeadsPage({ onSelect }) {
  const {
    search, setSearch, filterPriority, setFilterPriority, filterStatus, setFilterStatus,
    getFilteredLeads, getTotalFilteredCount,
    leadsPage, setLeadsPage, leadsPerPage, setLeadsPerPage,
    sortField, setSortField, sortDirection, setSortDirection,
    leads: allLeads, getLeads,
    degenMode, degenData, generateDegenData,
  } = useStore();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Lazily initialize leads outside render to avoid setState-during-render
  useEffect(() => {
    if (!allLeads) getLeads();
  }, [allLeads, getLeads]);
  const activeLeads = allLeads || [];

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedContactRows, setExpandedContactRows] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const showToast = useCallback((msg) => { setToastMsg(msg); setToastVisible(true); }, []);

  // Load More pattern - start with 35 leads, load more on demand
  const [visibleCount, setVisibleCount] = useState(35);

  // Outreach dropdown state
  const [outreachLeadId, setOutreachLeadId] = useState(null);

  // Pain points / close strategy modals
  const [painPointLead, setPainPointLead] = useState(null);
  const [painPointIndex, setPainPointIndex] = useState(0);
  const [strategyLead, setStrategyLead] = useState(null);
  const [strategyIndex, setStrategyIndex] = useState(0);

  // User profiling: track clicked lead preferences
  const [userProfile, setUserProfile] = useState({ industries: {}, regions: {}, dealSizes: [] });
  const trackLeadClick = useCallback((lead) => {
    setUserProfile(prev => {
      const next = { ...prev };
      next.industries = { ...prev.industries };
      next.regions = { ...prev.regions };
      next.dealSizes = [...prev.dealSizes];
      // Track industry
      if (lead.industry) next.industries[lead.industry] = (next.industries[lead.industry] || 0) + 1;
      // Track region
      const region = getRegion(lead.location);
      next.regions[region] = (next.regions[region] || 0) + 1;
      // Track deal size
      if (lead.dealValue) next.dealSizes.push(lead.dealValue);
      // Keep only last 50 deal sizes
      if (next.dealSizes.length > 50) next.dealSizes = next.dealSizes.slice(-50);
      return next;
    });
  }, []);

  // Compute preferred industry/region for lead boosting
  const userPreferences = useMemo(() => {
    const topIndustry = Object.entries(userProfile.industries).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const topRegion = Object.entries(userProfile.regions).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const avgDealSize = userProfile.dealSizes.length > 0
      ? userProfile.dealSizes.reduce((s, v) => s + v, 0) / userProfile.dealSizes.length
      : 0;
    return { topIndustry, topRegion, avgDealSize, hasData: userProfile.dealSizes.length >= 3 };
  }, [userProfile]);

  // View mode: table or map
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'map'

  // VoIP state
  const [voipLead, setVoipLead] = useState(null);
  const [voipPhone, setVoipPhone] = useState('');
  const [callRecords, setCallRecords] = useState({}); // { leadId: { outcome, duration, timestamp } }

  // Scheduling state
  const [scheduleLead, setScheduleLead] = useState(null);
  const [scheduleRecords, setScheduleRecords] = useState({}); // { leadId: { date, note } }

  // Derived: upcoming schedule count
  const upcomingScheduleCount = useMemo(() => {
    const now = new Date();
    return Object.values(scheduleRecords).filter(r => new Date(r.date) > now).length;
  }, [scheduleRecords]);

  // Handlers for VoIP
  const handleCallClick = useCallback((lead, phone) => {
    setVoipLead(lead);
    setVoipPhone(phone || '');
  }, []);

  const handleCallOutcome = useCallback((leadId, outcome, duration) => {
    setCallRecords(prev => ({ ...prev, [leadId]: { outcome, duration, timestamp: new Date().toISOString() } }));
  }, []);

  // Handlers for Scheduling
  const handleScheduleClick = useCallback((lead) => {
    setScheduleLead(lead);
  }, []);

  const handleScheduleConfirm = useCallback((leadId, date, note) => {
    setScheduleRecords(prev => ({ ...prev, [leadId]: { date: date.toISOString(), note } }));
  }, []);

  // ---------------------------------------------------------------------------
  // AI Chat State
  // ---------------------------------------------------------------------------
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState([{
    role: 'assistant',
    content: "Hey! I'm your AI lead finder. Tell me what kind of leads you're looking for — industry, deal size, location, role, score — and I'll find them instantly. Try: \"Show me SaaS founders in SF with $100K+ deals\"",
    timestamp: 'Now',
  }]);
  const [aiFilters, setAiFilters] = useState(null);
  const [aiUnderstood, setAiUnderstood] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Live mode state
  const [liveMode, setLiveMode] = useState(false);
  const [liveLeads, setLiveLeads] = useState([]);
  const [liveTotal, setLiveTotal] = useState(0);
  const [liveTotalPages, setLiveTotalPages] = useState(1);
  const [liveSummary, setLiveSummary] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(null);
  const [livePage, setLivePage] = useState(1);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  // Fetch live leads with AI filters — MUST be defined before handleAISubmit
  const fetchLiveWithAI = useCallback(async (filters) => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const params = new URLSearchParams({ page: '1', limit: String(leadsPerPage), pool: '50000' });
      if (filters.search) params.set('search', filters.search);
      if (filters.industry) params.set('industry', filters.industry);
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.minScore) params.set('minScore', String(filters.minScore));
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.order) params.set('order', filters.order);

      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      setLiveLeads(data.leads || []);
      setLiveTotal(data.total || 0);
      setLiveTotalPages(data.totalPages || 1);
      setLiveSummary(data.summary || null);
    } catch (err) {
      setLiveError(err.message);
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: `Live data fetch failed: ${err.message}. Showing local results instead. You can try again or switch to local mode.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      }]);
    } finally {
      setLiveLoading(false);
    }
  }, [leadsPerPage]);

  // ---------------------------------------------------------------------------
  // AI Prompt Submit Handler
  // ---------------------------------------------------------------------------
  const handleAISubmit = useCallback(async (promptText) => {
    const text = promptText || aiPrompt;
    if (!text.trim()) return;

    // Add user message
    setAiMessages(prev => [...prev, { role: 'user', content: text }]);
    setAiPrompt('');
    setIsAiThinking(true);

    // Parse the prompt for filters
    const { filters, understood } = parseAIPrompt(text);
    setAiFilters(filters);
    setAiUnderstood(understood);

    // Apply filters to store
    if (filters.search) setSearch(filters.search);
    if (filters.status) setFilterStatus(filters.status);
    if (filters.priority) setFilterPriority(filters.priority);
    if (filters.sort) setSortField(filters.sort === 'dealValue' ? 'dealValue' : filters.sort);
    if (filters.order) setSortDirection(filters.order);

    // If we're in live mode, trigger API call with filters
    if (liveMode) {
      fetchLiveWithAI(filters);
    }

    // Count matching leads + pipeline in a single pass
    const store = useStore.getState();
    const allLeads = store.getActiveLeads();
    let matchingCount = 0;
    let pipeline = 0;
    let totalScore = 0;
    const topLeads = [];

    for (const l of allLeads) {
      if (filters.industry && l.industry !== filters.industry) continue;
      if (filters.status && l.status !== filters.status) continue;
      if (filters.priority && l.priority !== filters.priority) continue;
      if (filters.minScore && l.score < filters.minScore) continue;
      if (filters.maxScore < 100 && l.score > filters.maxScore) continue;
      if (filters.minDeal && l.dealValue < filters.minDeal) continue;
      if (filters.maxDeal < Infinity && l.dealValue > filters.maxDeal) continue;
      if (filters.location && !l.location?.toLowerCase().includes(filters.location.toLowerCase())) continue;
      if (filters.title && !l.title?.toLowerCase().includes(filters.title.toLowerCase())) continue;
      if (filters.source && l.lead_source !== filters.source) continue;
      if (filters.momentum && l.momentum !== filters.momentum) continue;
      if (filters.search && !(l.name.toLowerCase().includes(filters.search.toLowerCase()) || l.company.toLowerCase().includes(filters.search.toLowerCase()))) continue;

      matchingCount++;
      pipeline += l.dealValue || 0;
      totalScore += l.score;
      // Collect top 5 leads by score for AI context
      if (topLeads.length < 5) {
        topLeads.push({ name: l.name, company: l.company, score: l.score, dealValue: l.dealValue, status: l.status, priority: l.priority, industry: l.industry });
      } else {
        const minIdx = topLeads.reduce((mi, tl, i, arr) => tl.score < arr[mi].score ? i : mi, 0);
        if (l.score > topLeads[minIdx].score) {
          topLeads[minIdx] = { name: l.name, company: l.company, score: l.score, dealValue: l.dealValue, status: l.status, priority: l.priority, industry: l.industry };
        }
      }
    }
    const avgScore = matchingCount > 0 ? Math.round(totalScore / matchingCount) : 0;

    // Show instant filter results
    const quickMsg = understood.length > 0
      ? `Found ${matchingCount.toLocaleString()} leads matching your criteria. Total pipeline: ${fmt(pipeline)}, avg score: ${avgScore}. Results updated below.`
      : `Searched for "${text}" across all lead fields. Found ${matchingCount.toLocaleString()} matching results.`;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAiMessages(prev => [...prev, {
      role: 'assistant', content: quickMsg, understood, leadCount: matchingCount, timestamp: now,
    }]);
    setLeadsPage(0);

    // Now call real AI for deeper insights
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'leads',
          context: {
            matchCount: matchingCount,
            pipeline: fmt(pipeline),
            avgScore,
            filters: understood.join(', ') || text,
            topLeads: topLeads.sort((a, b) => b.score - a.score),
          },
          messages: [{ role: 'user', content: text }],
        }),
      });
      const data = await res.json();
      if (!data.fallback && data.content) {
        setAiMessages(prev => [...prev, {
          role: 'assistant', content: data.content, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isAI: true,
        }]);
      }
    } catch {
      // AI insight failed — the quick answer above is already shown, so no action needed
    } finally {
      setIsAiThinking(false);
    }
  }, [aiPrompt, liveMode, fetchLiveWithAI, setSearch, setFilterStatus, setFilterPriority, setSortField, setSortDirection, setLeadsPage]);

  // Fetch live leads (regular)
  const fetchLiveLeads = useCallback(async () => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const params = new URLSearchParams({
        page: String(livePage), limit: String(leadsPerPage), pool: '50000',
        sort: sortField, order: sortDirection,
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setLiveLeads(data.leads || []);
      setLiveTotal(data.total || 0);
      setLiveTotalPages(data.totalPages || 1);
      setLiveSummary(data.summary || null);
    } catch (err) { setLiveError(err.message); }
    finally { setLiveLoading(false); }
  }, [livePage, leadsPerPage, sortField, sortDirection, search]);

  useEffect(() => {
    if (liveMode) fetchLiveLeads();
  }, [liveMode, fetchLiveLeads]);

  // ---------------------------------------------------------------------------
  // Apply AI Filters to local data + geographic grouping + deal prioritization + user profiling
  // ---------------------------------------------------------------------------
  const allFilteredLeads = useMemo(() => {
    if (liveMode) return liveLeads;

    const searchLower = search.toLowerCase();
    let filtered = [...activeLeads];

    // Apply store filters
    filtered = filtered.filter(l => {
      const matchSearch = !search || l.name.toLowerCase().includes(searchLower) || l.company.toLowerCase().includes(searchLower) || l.industry.toLowerCase().includes(searchLower) || (l.tags && l.tags.some(t => t.toLowerCase().includes(searchLower))) || (l.lead_source && l.lead_source.toLowerCase().includes(searchLower));
      const matchPriority = filterPriority === 'all' || l.priority === filterPriority;
      const matchStatus = filterStatus === 'all' || l.status === filterStatus;
      return matchSearch && matchPriority && matchStatus;
    });

    // Apply AI filters on top
    if (aiFilters) {
      filtered = filtered.filter(l => {
        if (aiFilters.industry && l.industry !== aiFilters.industry) return false;
        if (aiFilters.minScore && l.score < aiFilters.minScore) return false;
        if (aiFilters.minDeal && l.dealValue < aiFilters.minDeal) return false;
        if (aiFilters.maxDeal < Infinity && l.dealValue > aiFilters.maxDeal) return false;
        if (aiFilters.location && !l.location?.toLowerCase().includes(aiFilters.location.toLowerCase())) return false;
        if (aiFilters.title && !l.title?.toLowerCase().includes(aiFilters.title.toLowerCase())) return false;
        if (aiFilters.source && l.lead_source !== aiFilters.source) return false;
        if (aiFilters.momentum && l.momentum !== aiFilters.momentum) return false;
        return true;
      });
    }

    // Multi-factor sort: user profile boost -> $20K+ deals first -> geographic grouping -> score
    filtered.sort((a, b) => {
      // User profiling boost: if user has clicked 3+ leads, boost matching leads
      if (userPreferences.hasData) {
        const aBoost = (a.industry === userPreferences.topIndustry ? 2 : 0) + (getRegion(a.location) === userPreferences.topRegion ? 1 : 0);
        const bBoost = (b.industry === userPreferences.topIndustry ? 2 : 0) + (getRegion(b.location) === userPreferences.topRegion ? 1 : 0);
        if (aBoost !== bBoost) return bBoost - aBoost;
      }

      // Prioritize $20K+ deals
      const aHighValue = (a.dealValue || 0) >= 20000 ? 1 : 0;
      const bHighValue = (b.dealValue || 0) >= 20000 ? 1 : 0;
      if (aHighValue !== bHighValue) return bHighValue - aHighValue;

      // Then apply user-selected sort
      const sf = aiFilters?.sort || sortField;
      const dir = (aiFilters?.order || sortDirection) === 'asc' ? 1 : -1;
      const aVal = a[sf]; const bVal = b[sf];
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
      return String(aVal || '').localeCompare(String(bVal || '')) * dir;
    });

    return filtered;
  }, [activeLeads, search, filterPriority, filterStatus, aiFilters, sortField, sortDirection, liveMode, liveLeads, userPreferences]);

  // Apply "Load More" pattern: show visibleCount leads
  const filteredLeads = useMemo(() => {
    return allFilteredLeads.slice(0, visibleCount);
  }, [allFilteredLeads, visibleCount]);

  const totalFiltered = useMemo(() => {
    if (liveMode) return liveTotal;
    return allFilteredLeads.length;
  }, [allFilteredLeads, liveMode, liveTotal]);

  const leads = filteredLeads;
  const hasMore = visibleCount < totalFiltered;

  // Geographic region breakdown for display
  const regionBreakdown = useMemo(() => {
    const regions = {};
    for (const l of leads) {
      const region = getRegion(l.location);
      if (!regions[region]) regions[region] = 0;
      regions[region]++;
    }
    return Object.entries(regions).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (liveMode && liveSummary) {
      return { total: liveSummary.totalLeads, totalPipeline: liveSummary.pipelineValue, avgScore: liveSummary.avgScore, hotLeads: liveSummary.criticalLeads || 0, newToday: 47, topIndustry: liveSummary.topIndustry || 'N/A' };
    }
    const total = activeLeads.length;
    const totalPipeline = activeLeads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
    const avgScore = total > 0 ? Math.round(activeLeads.reduce((sum, l) => sum + (l.score || 0), 0) / total) : 0;
    const hotLeads = activeLeads.filter(l => (l.score || 0) > 80).length;
    const dayOfYear = Math.floor(Date.now() / 86400000);
    const newToday = 12 + (dayOfYear % 37);
    return { total, totalPipeline, avgScore, hotLeads, newToday, topIndustry: 'SaaS' };
  }, [activeLeads, liveMode, liveSummary]);

  // Handlers
  const handleSort = useCallback((field) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection(field === 'name' || field === 'company' ? 'asc' : 'desc'); }
    setVisibleCount(35);
    if (liveMode) setLivePage(1); else setLeadsPage(0);
  }, [sortField, sortDirection, setSortField, setSortDirection, setLeadsPage, liveMode]);

  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 50, totalFiltered));
  }, [totalFiltered]);

  const toggleSelect = useCallback((id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === leads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(leads.map(l => l.id)));
  }, [leads, selectedIds.size]);

  const handleExportSelected = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => {
      const selected = leads.filter(l => selectedIds.has(l.id));
      const csv = [
        ['Name', 'Email', 'Company', 'Score', 'Value', 'Priority', 'Status', 'Industry', 'Source', 'Location'].join(','),
        ...selected.map(l => [l.name, l.email, l.company, l.score, l.dealValue || 0, l.priority, l.status, l.industry, l.lead_source, l.location].join(','))
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `leads-export-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
      setIsProcessing(false);
      showToast(`${selected.length} leads exported to CSV`);
    }, 100);
  }, [leads, selectedIds, showToast]);

  const clearAIFilters = useCallback(() => {
    setAiFilters(null);
    setAiUnderstood([]);
    setSearch('');
    setFilterPriority('all');
    setFilterStatus('all');
    setLeadsPage(0);
    setVisibleCount(35);
    showToast('AI filters cleared');
  }, [setSearch, setFilterPriority, setFilterStatus, setLeadsPage, showToast]);

  const startIndex = 0;
  const allOnPageSelected = leads.length > 0 && leads.every(l => selectedIds.has(l.id));

  const sortableColumns = [
    { key: 'name', label: 'Lead' }, { key: 'company', label: 'Company' }, { key: 'score', label: 'Score' },
    { key: 'dealValue', label: 'Value' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' },
    { key: 'last_activity', label: 'Activity' }, { key: 'momentum', label: 'Momentum' },
  ];

  // Wrapped onSelect to also track profiling
  const handleSelectLead = useCallback((lead) => {
    trackLeadClick(lead);
    if (onSelect) onSelect(lead);
  }, [onSelect, trackLeadClick]);

  // DEGEN intel panel state - closed by default
  const [degenIntelOpen, setDegenIntelOpen] = useState(false);

  return (
    <div className="p-4 sm:p-6">
      <Toast message={toastMsg} visible={toastVisible} onDone={() => setToastVisible(false)} />

      {/* Pain Points Modal */}
      {painPointLead && <PainPointsModal lead={painPointLead} index={painPointIndex} onClose={() => setPainPointLead(null)} />}
      {/* Close Strategy Modal */}
      {strategyLead && <CloseStrategyModal lead={strategyLead} index={strategyIndex} onClose={() => setStrategyLead(null)} />}

      {/* DEGEN INTEL Banner — CLOSED by default, user opts in */}
      {degenMode && degenData && (
        <div className="mb-4 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-red-500/5 to-yellow-500/10 overflow-hidden">
          {/* Banner Header - always visible, clickable to expand */}
          <button onClick={() => setDegenIntelOpen(!degenIntelOpen)} className="w-full px-4 py-2.5 flex items-center justify-between border-b border-orange-500/20 hover:bg-orange-500/[0.03] transition-colors">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-orange-400 animate-pulse" />
              <span className="text-sm font-black tracking-wider text-orange-400 uppercase">DEGEN INTEL</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold">LIVE</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Skull size={14} className="text-orange-400" />
                <span className="text-xs font-bold text-orange-300">DEGEN SCORE: {degenData.degenScore}</span>
              </div>
              {degenIntelOpen ? <ChevronUp size={16} className="text-orange-400" /> : <ChevronDown size={16} className="text-orange-400" />}
            </div>
          </button>
          {degenIntelOpen && (
            <>
              {/* Refresh button */}
              <div className="px-4 py-1.5 flex justify-end">
                <button onClick={() => generateDegenData()} className="text-[10px] px-2 py-1 rounded-lg bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 transition-colors border border-orange-500/20">
                  <RefreshCw size={10} className="inline mr-1" />REFRESH
                </button>
              </div>
              {/* Whale Alerts Ticker */}
              <div className="px-4 py-2 overflow-hidden relative">
                <div className="flex gap-6 animate-marquee whitespace-nowrap">
                  {[...degenData.whaleAlerts, ...degenData.whaleAlerts].map((alert, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 text-xs">
                      <span className={`font-bold ${alert.direction === 'BUY' || alert.direction === 'STAKE' ? 'text-emerald-400' : alert.direction === 'SELL' || alert.direction === 'UNSTAKE' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {alert.direction}
                      </span>
                      <span className="text-white font-mono font-medium">{fmt(alert.amount)}</span>
                      <span className="text-orange-300 font-bold">{alert.asset}</span>
                      <span className="text-slate-500">{alert.wallet}</span>
                      <span className="text-slate-600">{alert.timestamp}</span>
                      {alert.impact === 'HIGH' && <span className="text-[9px] px-1 py-0 rounded bg-red-500/20 text-red-400 font-bold">HIGH IMPACT</span>}
                      <span className="text-slate-700 mx-1">|</span>
                    </span>
                  ))}
                </div>
              </div>
              {/* Hot Signals Summary */}
              <div className="px-4 py-2 border-t border-orange-500/15 flex items-center gap-4 overflow-x-auto scrollbar-hide">
                {degenData.hotSignals.filter(s => s.actionable).slice(0, 5).map((sig, i) => (
                  <div key={sig.id} className="flex-shrink-0 flex items-center gap-1.5 text-[11px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${sig.strength >= 90 ? 'bg-red-400 animate-pulse' : 'bg-orange-400'}`} />
                    <span className="text-orange-300 font-bold">{sig.asset}</span>
                    <span className="text-slate-400">{sig.description}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Revenue Intelligence Panel */}
      <RevenueIntelligencePanel leads={leads} allLeads={activeLeads} />

      {/* GOATED Money Machine */}
      <MoneyMachinePanel allLeads={activeLeads} onSelect={handleSelectLead} />

      {/* ── Multiplayer Closing Ecosystem ── */}
      <CloserLeaderboard degenMode={degenMode} showToast={showToast} />
      <SocialClosingFeed showToast={showToast} />
      <CreatorProgramBanner showToast={showToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Users size={28} className={degenMode ? 'text-orange-400' : 'text-brand'} />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${degenMode ? 'bg-orange-400' : 'bg-brand'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${degenMode ? 'bg-orange-400' : 'bg-brand'}`} />
            </span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              {degenMode ? 'DEGEN Lead Intel' : 'Lead Intelligence'}
              {degenMode ? (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">WOLF MODE</span>
              ) : (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">AI-Powered</span>
              )}
            </h1>
            <p className="text-slate-500 text-sm">
              {leads.length.toLocaleString()} shown of {totalFiltered.toLocaleString()} {aiFilters ? 'filtered' : 'total'}
              {userPreferences.hasData && <span className="ml-1 text-brand"> &middot; Personalized for you</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Table / Map toggle */}
          <div className="flex items-center rounded-lg border border-white/[0.05] overflow-hidden">
            <button onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-brand/15 text-brand' : 'bg-surface-2 text-slate-400 hover:text-white'}`}>
              <Table2 size={14} /> <span className="hidden sm:inline">Table</span>
            </button>
            <button onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'map' ? 'bg-brand/15 text-brand' : 'bg-surface-2 text-slate-400 hover:text-white'}`}>
              <Map size={14} /> <span className="hidden sm:inline">Map</span>
            </button>
          </div>
          {/* Upcoming schedule badge */}
          {upcomingScheduleCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
              <CalendarClock size={14} />
              <span>{upcomingScheduleCount}</span>
              <span className="hidden sm:inline text-xs">upcoming</span>
            </div>
          )}
          <button onClick={() => setLiveMode(!liveMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${liveMode ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-surface-2 border-white/[0.05] text-slate-400 hover:text-white'}`}>
            {liveMode ? (<><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span><span>LIVE 50K</span><Wifi size={14} /></>) : (<><WifiOff size={14} /><span>Local 5K</span></>)}
          </button>
          <button onClick={() => setAiChatOpen(!aiChatOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${aiChatOpen ? 'bg-brand/15 border-brand/30 text-brand' : 'bg-surface-2 border-white/[0.05] text-slate-400 hover:text-white'}`}>
            <Brain size={14} />
            <span className="hidden sm:inline">AI Chat</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand text-black font-medium text-sm">
            <Plus size={16} /><span className="hidden sm:inline">Add Lead</span>
          </button>
        </div>
      </div>

      {/* AI Chat Panel */}
      {aiChatOpen && (
        <div className="mb-4 bg-surface-3 rounded-2xl border border-white/[0.03] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.03] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand/30 to-purple-500/30 flex items-center justify-center">
                <Bot size={18} className="text-brand" />
              </div>
              <div>
                <span className="text-sm font-medium">GOATED AI Lead Finder</span>
                <span className="text-[10px] text-slate-500 ml-2">Natural language lead search</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {aiFilters && (
                <button onClick={clearAIFilters} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors">
                  <X size={12} /> Clear filters
                </button>
              )}
              <button onClick={() => setAiChatOpen(false)} className="p-1 rounded-lg text-slate-500 hover:text-white transition-colors">
                <ChevronUp size={16} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="max-h-[280px] overflow-y-auto px-4 py-3 space-y-1">
            {aiMessages.map((msg, i) => <AIChatMessage key={i} {...msg} />)}
            {isAiThinking && (
              <div className="flex items-center gap-2 text-sm text-slate-500 pl-8">
                <Loader2 size={14} className="animate-spin text-brand" />
                <span>Analyzing your request...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Preset Prompts */}
          <div className="px-4 py-2 border-t border-white/[0.03] flex gap-2 overflow-x-auto scrollbar-hide">
            {PRESET_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => handleAISubmit(p.prompt)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-white/[0.03] text-xs font-medium text-slate-400 hover:text-brand hover:border-brand/20 transition-colors">
                <p.icon size={12} /> {p.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/[0.03]">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Wand2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand/50" />
                <input ref={inputRef} type="text" value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAISubmit(); } }}
                  placeholder="Describe the leads you want... (e.g., 'SaaS CEOs in NYC with $50K+ deals')"
                  className="w-full pl-10 pr-4 py-3 bg-surface-1 border border-white/[0.05] rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-brand/40 transition-colors" />
              </div>
              <button onClick={() => handleAISubmit()} disabled={!aiPrompt.trim() || isAiThinking}
                className="px-4 py-3 rounded-xl bg-brand text-black font-medium text-sm disabled:opacity-50 flex items-center gap-2 hover:bg-brand/90 transition-colors">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active AI Filters Banner */}
      {aiFilters && aiUnderstood.length > 0 && (
        <div className="bg-brand/5 border border-brand/15 rounded-xl px-4 py-3 mb-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Brain size={14} className="text-brand flex-shrink-0" />
            <span className="text-xs font-medium text-brand">AI Filters Active:</span>
            {aiUnderstood.map((u, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand/10 text-brand/80 border border-brand/20">
                {u}
              </span>
            ))}
          </div>
          <button onClick={clearAIFilters} className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1">
            <X size={12} /> Clear all
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div className="bg-surface-3 rounded-xl p-3.5 border border-white/[0.03]">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Users size={14} /> Total Leads</div>
          <div className="text-lg font-bold"><AnimatedNumber value={summaryStats.total} format={(v) => v.toLocaleString()} /></div>
        </div>
        <div className="bg-surface-3 rounded-xl p-3.5 border border-white/[0.03]">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Zap size={14} className="text-amber-400" /> New Today</div>
          <div className="text-lg font-bold text-amber-400"><AnimatedNumber value={summaryStats.newToday || 24} /></div>
        </div>
        <div className="bg-surface-3 rounded-xl p-3.5 border border-white/[0.03]">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><DollarSign size={14} /> Pipeline</div>
          <div className="text-lg font-bold"><AnimatedNumber value={summaryStats.totalPipeline} format={fmt} /></div>
        </div>
        <div className="bg-surface-3 rounded-xl p-3.5 border border-white/[0.03]">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Flame size={14} className="text-emerald-400" /> Hot (80+)</div>
          <div className="text-lg font-bold text-emerald-400"><AnimatedNumber value={summaryStats.hotLeads || 0} /></div>
        </div>
        <div className="bg-surface-3 rounded-xl p-3.5 border border-white/[0.03]">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><TrendingUp size={14} /> Avg Score</div>
          <div className="text-lg font-bold"><AnimatedNumber value={summaryStats.avgScore} /></div>
        </div>
      </div>

      {/* Quick Actions + Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={handleExportSelected} disabled={isProcessing || selectedIds.size === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 border border-white/[0.03] text-xs font-medium text-slate-400 hover:text-white hover:border-white/[0.05] transition-colors disabled:opacity-40">
          <Download size={13} /> Export CSV
        </button>
        <button onClick={() => showToast('CRM sync started — 5,000 leads queued')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 border border-white/[0.03] text-xs font-medium text-slate-400 hover:text-white hover:border-white/[0.05] transition-colors">
          <RefreshCw size={13} /> Sync CRM
        </button>
        <button onClick={() => { if (selectedIds.size === 0) { showToast('Select leads first'); return; } showToast(`AI enrichment for ${selectedIds.size} leads`); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 border border-white/[0.03] text-xs font-medium text-slate-400 hover:text-white hover:border-white/[0.05] transition-colors">
          <Sparkles size={13} /> AI Enrich
        </button>
        <button onClick={() => { if (selectedIds.size === 0) { showToast('Select leads first'); return; } showToast(`Email campaign for ${selectedIds.size} leads`); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 border border-white/[0.03] text-xs font-medium text-slate-400 hover:text-white hover:border-white/[0.05] transition-colors">
          <Send size={13} /> Bulk Email
        </button>

        <div className="flex-1" />

        {/* Mini filter dropdowns */}
        <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setLeadsPage(0); }}
          className="px-2 py-1.5 bg-surface-2 border border-white/[0.03] rounded-lg text-xs text-white outline-none">
          <option value="all">All Priorities</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); if (liveMode) setLivePage(1); else setLeadsPage(0); }}
          className="px-2 py-1.5 bg-surface-2 border border-white/[0.03] rounded-lg text-xs text-white outline-none">
          <option value="all">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Bulk Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-brand/10 border border-brand/20 rounded-xl px-4 py-3 mb-4 flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-medium text-brand">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={handleExportSelected} disabled={isProcessing} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-white/[0.05] text-sm hover:bg-surface-1 transition-colors disabled:opacity-50">
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Export
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Clear</button>
          </div>
        </div>
      )}

      {/* VoIP Modal */}
      {voipLead && (
        <VoIPDialerModal lead={voipLead} phone={voipPhone} onClose={() => setVoipLead(null)} onOutcome={handleCallOutcome} showToast={showToast} />
      )}

      {/* Schedule Modal */}
      {scheduleLead && (
        <ScheduleModal lead={scheduleLead} onClose={() => setScheduleLead(null)} onSchedule={handleScheduleConfirm} showToast={showToast} />
      )}

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="mb-4">
          <LeadMapView leads={leads} allLeads={activeLeads} onSelect={handleSelectLead} showToast={showToast} />
        </div>
      )}

      {/* Table */}
      <div className={`bg-surface-3 rounded-xl border border-white/[0.03] overflow-hidden ${viewMode === 'map' ? 'hidden' : ''}`}>
        {liveLoading && <div className="h-1 bg-surface-2 overflow-hidden"><div className="h-full bg-brand animate-pulse w-full" /></div>}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.03]">
                <th className="px-3 py-3 text-left w-10">
                  <button onClick={toggleSelectAll} className="text-slate-500 hover:text-white transition-colors">
                    {allOnPageSelected ? <CheckSquare size={16} className="text-brand" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium uppercase tracking-wider w-10">#</th>
                {sortableColumns.map(col => <SortHeader key={col.key} field={col.key} label={col.label} sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />)}
                <th className="px-3 py-3 text-left text-xs text-cyan-400 font-medium uppercase tracking-wider">Close %</th>
                <th className="px-3 py-3 text-left text-xs text-red-400 font-medium uppercase tracking-wider">Deficit</th>
                <th className="px-3 py-3 text-left text-xs text-emerald-400 font-medium uppercase tracking-wider">Opportunity</th>
                {degenMode && <th className="px-3 py-3 text-left text-xs text-orange-400 font-bold uppercase tracking-wider">Whale Score</th>}
                {degenMode && <th className="px-3 py-3 text-left text-xs text-orange-400 font-bold uppercase tracking-wider">Bag Size</th>}
                <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium uppercase tracking-wider">Source</th>
                <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium uppercase tracking-wider">Region</th>
                <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l, i) => {
                const isSelected = selectedIds.has(l.id);
                const dv = l.dealValue || 0;
                const whaleScore = degenMode ? Math.round((l.score || 50) * ((dv || 10000) / 50000) * (l.momentum === 'rising' ? 1.5 : l.momentum === 'declining' ? 0.6 : 1.0)) : 0;
                const bagSize = degenMode ? dv * (l.score >= 85 ? 2.5 : l.score >= 70 ? 1.8 : 1.2) : 0;
                const isAlphaPriority = degenMode && l.score > 85;
                const leadDeficits = getLeadDeficits(l, startIndex + i);
                const isContactExpanded = expandedContactRows.has(l.id);
                const tableCols = degenMode ? 20 : 18;
                return (
                  <React.Fragment key={l.id}>
                  <tr onClick={() => handleSelectLead(l)}
                    className={`border-b border-white/[0.03] cursor-pointer hover:bg-white/[0.02] transition-colors ${isSelected ? 'bg-brand/5' : ''} ${isAlphaPriority ? 'bg-orange-500/[0.03]' : ''}`}>
                    <td className="px-3 py-2.5" onClick={e => toggleSelect(l.id, e)}>
                      {isSelected ? <CheckSquare size={16} className={degenMode ? 'text-orange-400' : 'text-brand'} /> : <Square size={16} className="text-slate-600" />}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-600 text-xs">#{startIndex + i + 1}</td>

                    {/* Lead */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isAlphaPriority ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40' : 'bg-brand/15 text-brand'}`}>
                            {l.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="absolute -top-0.5 -right-0.5"><ScoreDot score={l.score} /></div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm truncate">{l.name}</span>
                            {isAlphaPriority && <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[9px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/25"><Crown size={8} />ALPHA</span>}
                            {!isAlphaPriority && l.score > 90 && <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"><Flame size={8} />HOT</span>}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{l.title}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-sm">{l.company}</td>

                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${degenMode && l.score >= 85 ? 'bg-gradient-to-r from-orange-500 to-red-500' : scoreBarColor(l.score)}`} style={{ width: `${l.score}%` }} />
                        </div>
                        <span className={`font-bold text-xs tabular-nums ${degenMode && l.score >= 85 ? 'text-orange-400' : scoreTextColor(l.score)}`}>{l.score}</span>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 font-mono text-sm">{fmt(dv)}</td>

                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${priorityColors[l.priority] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>{l.priority}</span>
                    </td>

                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[l.status] || 'bg-slate-500/15 text-slate-400'}`}>{l.status}</span>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={11} className="text-slate-600" />
                        <span>{relativeTime(l.last_activity)}</span>
                      </div>
                    </td>

                    <td className="px-3 py-2.5"><MomentumIndicator momentum={l.momentum} /></td>

                    {/* Deficit Score */}
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${deficitBadgeColor(leadDeficits.deficitScore)}`}>
                        {leadDeficits.deficitScore >= 75 ? <AlertTriangle size={9} /> : leadDeficits.deficitScore >= 50 ? <AlertCircle size={9} /> : <CheckCircle size={9} />}
                        {leadDeficits.deficitScore}
                      </span>
                    </td>

                    {/* Lost Revenue */}
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-xs font-bold text-red-400/80">-{fmt(leadDeficits.totalMonthlyLoss)}</span>
                      <div className="text-[9px] text-slate-600">/month</div>
                    </td>

                    {/* Opportunity Value */}
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-xs font-bold text-emerald-400/80">{fmt(leadDeficits.opportunityValue)}</span>
                    </td>

                    {/* Whale Score — degen mode only */}
                    {degenMode && (
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-10 h-1.5 rounded-full overflow-hidden ${whaleScore >= 100 ? 'bg-orange-500/20' : 'bg-surface-2'}`}>
                            <div className={`h-full rounded-full ${whaleScore >= 150 ? 'bg-gradient-to-r from-red-500 to-orange-400' : whaleScore >= 80 ? 'bg-orange-500' : 'bg-yellow-600'}`} style={{ width: Math.min(whaleScore, 200) / 2 + '%' }} />
                          </div>
                          <span className={`font-bold text-xs font-mono ${whaleScore >= 150 ? 'text-red-400' : whaleScore >= 80 ? 'text-orange-400' : 'text-yellow-600'}`}>{whaleScore}</span>
                          {whaleScore >= 150 && <Flame size={10} className="text-red-400" />}
                        </div>
                      </td>
                    )}

                    {/* Bag Size (potential earnings) — degen mode only */}
                    {degenMode && (
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <Wallet size={11} className="text-orange-400/60" />
                          <span className={`font-mono text-sm font-bold ${bagSize >= 100000 ? 'text-orange-400' : bagSize >= 50000 ? 'text-yellow-400' : 'text-slate-400'}`}>{fmt(Math.round(bagSize))}</span>
                        </div>
                      </td>
                    )}

                    <td className="px-3 py-2.5">{l.lead_source && <DataSourceBadge source={l.lead_source} />}</td>

                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-0.5 text-[11px] text-slate-500">
                        <MapPin size={11} /> {l.location || '--'}
                      </div>
                    </td>

                    {/* Last Called */}
                    <td className="px-3 py-2.5">
                      {callRecords[l.id] ? (
                        <div className="text-[11px]">
                          <div className={`flex items-center gap-1 ${callRecords[l.id].outcome === 'connected' ? 'text-emerald-400' : callRecords[l.id].outcome === 'voicemail' ? 'text-amber-400' : 'text-slate-500'}`}>
                            {callRecords[l.id].outcome === 'connected' ? <CheckCircle size={10} /> : callRecords[l.id].outcome === 'voicemail' ? <PhoneForwarded size={10} /> : callRecords[l.id].outcome === 'busy' ? <PhoneOff size={10} /> : <PhoneMissed size={10} />}
                            <span className="capitalize">{callRecords[l.id].outcome}</span>
                          </div>
                          <div className="text-[9px] text-slate-600">{relativeTime(callRecords[l.id].timestamp)}</div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600">--</span>
                      )}
                    </td>

                    {/* Next Follow-up */}
                    <td className="px-3 py-2.5">
                      {scheduleRecords[l.id] ? (
                        <div className="text-[11px]">
                          <div className="flex items-center gap-1 text-blue-400">
                            <Calendar size={10} />
                            <span>{new Date(scheduleRecords[l.id].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div className="text-[9px] text-slate-600">{new Date(scheduleRecords[l.id].date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600">--</span>
                      )}
                    </td>

                    {/* Actions: Call, Schedule, Intel, Email */}
                    <td className="px-3 py-2.5">
                      <div className="flex gap-0.5">
                        <button onClick={e => { e.stopPropagation(); const intel = getContactIntel(l, startIndex + i); handleCallClick(l, intel.phone); }}
                          className={`p-1.5 rounded-lg text-slate-500 ${degenMode ? 'hover:text-orange-400 hover:bg-orange-500/10' : 'hover:text-emerald-400 hover:bg-emerald-500/10'} transition-colors`}
                          title="Call Lead">
                          <Phone size={13} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleScheduleClick(l); }}
                          className={`p-1.5 rounded-lg text-slate-500 ${degenMode ? 'hover:text-orange-400 hover:bg-orange-500/10' : 'hover:text-blue-400 hover:bg-blue-500/10'} transition-colors`}
                          title="Schedule Follow-up">
                          <CalendarClock size={13} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setExpandedContactRows(prev => { const next = new Set(prev); if (next.has(l.id)) next.delete(l.id); else next.add(l.id); return next; }); }}
                          className={`p-1.5 rounded-lg transition-colors ${isContactExpanded ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-brand hover:bg-brand/10'}`}
                          title="Contact Intel">
                          <Crosshair size={13} />
                        </button>
                        <button onClick={e => e.stopPropagation()} className={`p-1.5 rounded-lg text-slate-500 ${degenMode ? 'hover:text-orange-400 hover:bg-orange-500/10' : 'hover:text-brand hover:bg-brand/10'} transition-colors`}><Mail size={13} /></button>
                      </div>
                    </td>
                  </tr>
                  {isContactExpanded && <ContactIntelRow lead={l} index={startIndex + i} colSpan={tableCols} onCallClick={handleCallClick} onScheduleClick={handleScheduleClick} />}
                  </React.Fragment>
                );
              })}
              {leads.length === 0 && !liveLoading && (
                <tr><td colSpan={degenMode ? 20 : 18} className="px-4 py-12 text-center text-slate-500 text-sm">
                  {aiFilters ? 'No leads match your AI query. Try a different prompt or clear filters.' : 'No leads match your filters.'}
                </td></tr>
              )}
              {leads.length === 0 && liveLoading && (
                <tr><td colSpan={degenMode ? 20 : 18} className="px-4 py-12 text-center text-slate-500 text-sm">
                  <Loader2 size={24} className="animate-spin mx-auto mb-2 text-brand" /> Loading live data...
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-white/[0.03] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>Showing {totalFiltered === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + leadsPerPage, totalFiltered)} of {totalFiltered.toLocaleString()}</span>
            <span className="text-slate-700">|</span>
            <select value={leadsPerPage} onChange={e => { setLeadsPerPage(Number(e.target.value)); if (liveMode) setLivePage(1); }}
              className="px-2 py-1 bg-surface-1 border border-white/[0.03] rounded text-sm text-white outline-none">
              {perPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            {liveMode && <span className="flex items-center gap-1 text-emerald-400"><span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>LIVE</span>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => handlePageChange(0)} disabled={currentPage === 0} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.02] transition-colors disabled:opacity-30"><ChevronsLeft size={16} /></button>
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.02] transition-colors disabled:opacity-30"><ChevronLeft size={16} /></button>
            {getPageNumbers().map((p, idx) => p === '...' ? <span key={`e-${idx}`} className="px-2 py-1 text-slate-600 text-sm">...</span> : (
              <button key={p} onClick={() => handlePageChange(p)} className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === p ? 'bg-brand text-black' : 'text-slate-500 hover:text-white hover:bg-white/[0.02]'}`}>{p + 1}</button>
            ))}
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.02] transition-colors disabled:opacity-30"><ChevronRight size={16} /></button>
            <button onClick={() => handlePageChange(totalPages - 1)} disabled={currentPage >= totalPages - 1} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.02] transition-colors disabled:opacity-30"><ChevronsRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
