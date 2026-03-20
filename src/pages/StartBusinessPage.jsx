import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Building2, Tag, FileText, Briefcase, Target, DollarSign,
  Check, Circle, ChevronRight, Users, CreditCard, Globe, Megaphone,
  Gift, UserPlus, Sparkles, BookOpen, Wrench, Link, TrendingUp,
  Package, GraduationCap, HeartHandshake, ShoppingBag, MessageSquare, Crown,
  BarChart3, ArrowUpRight, Zap, Star, Layout, Code, Palette
} from 'lucide-react';
import { useStore } from '../hooks/useStore';

const industries = [
  'SaaS & Software', 'E-commerce & Retail', 'Agency & Consulting', 'Creator Economy',
  'Education & Courses', 'Fintech & Finance', 'Health & Wellness', 'Real Estate',
  'Marketing & Advertising', 'AI & Technology', 'Food & Beverage', 'Media & Entertainment',
];

const businessModels = [
  { id: 'saas', icon: Code, label: 'SaaS', desc: 'Recurring software subscriptions' },
  { id: 'marketplace', icon: ShoppingBag, label: 'Marketplace', desc: 'Connect buyers and sellers' },
  { id: 'course', icon: GraduationCap, label: 'Course / Info', desc: 'Digital education products' },
  { id: 'service', icon: HeartHandshake, label: 'Service', desc: 'Professional services & consulting' },
  { id: 'agency', icon: Building2, label: 'Agency', desc: 'Client work at scale' },
  { id: 'ecommerce', icon: Package, label: 'Ecommerce', desc: 'Physical or digital products' },
];

const audiences = [
  'Small Businesses (SMB)', 'Enterprise (Fortune 500)', 'Startups', 'Creators & Influencers',
  'Freelancers', 'Students', 'Developers', 'Marketers', 'Consumers (B2C)', 'Agencies',
];

const defaultChecklist = [
  { id: 'profile', label: 'Set up business profile', desc: 'Name, logo, description', icon: Building2, done: false },
  { id: 'product', label: 'Add your first product/service', desc: 'Create your core offering', icon: Package, done: false },
  { id: 'payment', label: 'Connect payment method', desc: 'Stripe, PayPal, or crypto', icon: CreditCard, done: false },
  { id: 'landing', label: 'Create landing page', desc: 'Build your online presence', icon: Globe, done: false },
  { id: 'affiliate', label: 'Set up affiliate program', desc: 'Let others sell for you', icon: Gift, done: false },
  { id: 'marketing', label: 'Launch marketing campaign', desc: 'Get your first traffic', icon: Megaphone, done: false },
  { id: 'customers', label: 'Get first 10 customers', desc: 'Validate your business', icon: UserPlus, done: false },
];

const templates = [
  {
    id: 'saas-kit', name: 'SaaS Startup Kit', icon: Code, color: '#10b981',
    desc: 'Everything to launch a SaaS product: landing page, pricing, onboarding flow, and customer dashboard.',
    tags: ['Landing Page', 'Pricing Table', 'Auth Flow', 'Dashboard'],
    revenue: '$5K-$50K MRR',
  },
  {
    id: 'creator-course', name: 'Creator Course Business', icon: GraduationCap, color: '#a855f7',
    desc: 'Launch a digital course or community: content delivery, memberships, and student management.',
    tags: ['Course Platform', 'Memberships', 'Community', 'Drip Content'],
    revenue: '$10K-$100K/mo',
  },
  {
    id: 'agency-playbook', name: 'Agency Playbook', icon: Briefcase, color: '#06b6d4',
    desc: 'Scale a service agency: client portal, project management, proposals, and billing.',
    tags: ['Client Portal', 'Proposals', 'Contracts', 'Invoicing'],
    revenue: '$20K-$200K/mo',
  },
  {
    id: 'ecommerce-store', name: 'Ecommerce Store', icon: ShoppingBag, color: '#f97316',
    desc: 'Launch a product store: inventory, checkout, shipping, and customer management.',
    tags: ['Product Catalog', 'Cart & Checkout', 'Shipping', 'Reviews'],
    revenue: '$5K-$100K/mo',
  },
  {
    id: 'consulting', name: 'Consulting Practice', icon: HeartHandshake, color: '#ec4899',
    desc: 'Build a consulting business: scheduling, proposals, deliverables, and recurring engagements.',
    tags: ['Scheduling', 'Proposals', 'Deliverables', 'CRM'],
    revenue: '$10K-$80K/mo',
  },
  {
    id: 'community', name: 'Community / Membership', icon: Users, color: '#eab308',
    desc: 'Build a paid community: forums, events, content library, and member perks.',
    tags: ['Forums', 'Events', 'Content Library', 'Tiers'],
    revenue: '$5K-$50K/mo',
  },
];

const resources = [
  { title: 'How to Validate Your Idea in 48 Hours', type: 'Guide', icon: BookOpen, color: '#10b981' },
  { title: 'Pricing Strategy Playbook', type: 'Template', icon: DollarSign, color: '#a855f7' },
  { title: 'Launch Checklist for First-Time Founders', type: 'Checklist', icon: Check, color: '#06b6d4' },
  { title: 'Cold Outreach Templates That Convert', type: 'Templates', icon: MessageSquare, color: '#f97316' },
  { title: 'Building in Public: The Complete Guide', type: 'Guide', icon: Globe, color: '#ec4899' },
  { title: 'Tech Stack Recommendations by Business Type', type: 'Tool', icon: Wrench, color: '#eab308' },
];

const revenueData = [
  { month: 'Jan', value: 0 }, { month: 'Feb', value: 0 }, { month: 'Mar', value: 0 },
  { month: 'Apr', value: 0 }, { month: 'May', value: 0 }, { month: 'Jun', value: 0 },
  { month: 'Jul', value: 0 }, { month: 'Aug', value: 0 }, { month: 'Sep', value: 0 },
  { month: 'Oct', value: 0 }, { month: 'Nov', value: 0 }, { month: 'Dec', value: 0 },
];

export default function StartBusinessPage() {
  const { business, setBusiness } = useStore();
  const [activeTab, setActiveTab] = useState('setup');
  const [checklist, setChecklist] = useState(defaultChecklist);

  // Wizard state
  const [wizardStep, setWizardStep] = useState(0);
  const [bizName, setBizName] = useState(business?.name || '');
  const [bizTagline, setBizTagline] = useState(business?.tagline || '');
  const [bizDesc, setBizDesc] = useState(business?.description || '');
  const [bizIndustry, setBizIndustry] = useState(business?.industry || '');
  const [bizModel, setBizModel] = useState(business?.model || '');
  const [bizRevGoal, setBizRevGoal] = useState(business?.revenueGoal || 10000);
  const [bizAudience, setBizAudience] = useState(business?.audience || []);
  const [wizardComplete, setWizardComplete] = useState(!!business?.name);

  const toggleCheckItem = (id) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const completedCount = checklist.filter(i => i.done).length;

  const toggleAudience = (aud) => {
    setBizAudience(prev => prev.includes(aud) ? prev.filter(a => a !== aud) : [...prev, aud]);
  };

  const handleWizardComplete = () => {
    const biz = {
      name: bizName, tagline: bizTagline, description: bizDesc,
      industry: bizIndustry, model: bizModel, revenueGoal: bizRevGoal,
      audience: bizAudience,
    };
    setBusiness(biz);
    setWizardComplete(true);
    setChecklist(prev => prev.map(item => item.id === 'profile' ? { ...item, done: true } : item));
  };

  const formatRevenue = (v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`;

  const tabs = [
    { id: 'setup', label: 'Business Setup', icon: Building2 },
    { id: 'checklist', label: 'Launch Checklist', icon: Check },
    { id: 'templates', label: 'Templates', icon: Layout },
    { id: 'revenue', label: 'Revenue', icon: BarChart3 },
    { id: 'resources', label: 'Resources', icon: BookOpen },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-cyan-400 flex items-center justify-center">
          <Rocket size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Start a Business</h1>
          <p className="text-slate-500 text-sm">Build, launch, and scale your business on GOATED</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2 -mx-1 px-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id ? 'bg-brand/15 text-brand' : 'text-slate-400 hover:bg-white/[0.02] hover:text-slate-200'
            }`}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ===== BUSINESS SETUP TAB ===== */}
        {activeTab === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {wizardComplete ? (
              // Show business summary
              <div>
                <motion.div
                  className="rounded-2xl p-8 relative overflow-hidden mb-6"
                  style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(15,23,42,0.9) 50%, rgba(6,182,212,0.15) 100%)' }}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                >
                  <div className="absolute inset-0 neon-border rounded-2xl" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-3xl font-black mb-1">{bizName || 'Your Business'}</h2>
                        {bizTagline && <p className="text-brand text-sm">{bizTagline}</p>}
                      </div>
                      <button onClick={() => { setWizardComplete(false); setWizardStep(0); }}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-sm text-slate-300 hover:bg-white/15 transition-colors">
                        Edit
                      </button>
                    </div>
                    {bizDesc && <p className="text-slate-400 text-sm mb-4">{bizDesc}</p>}
                    <div className="flex flex-wrap gap-2">
                      {bizIndustry && <span className="px-3 py-1 rounded-full bg-brand/15 text-brand text-xs font-medium">{bizIndustry}</span>}
                      {bizModel && <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-400 text-xs font-medium">{businessModels.find(m => m.id === bizModel)?.label}</span>}
                      <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-400 text-xs font-medium">Goal: {formatRevenue(bizRevGoal)}/mo</span>
                      {bizAudience.map(a => <span key={a} className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium">{a}</span>)}
                    </div>
                  </div>
                </motion.div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
                    <div className="text-2xl font-bold text-brand">$0</div>
                    <div className="text-xs text-slate-500">MRR</div>
                  </div>
                  <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
                    <div className="text-2xl font-bold text-purple-400">0</div>
                    <div className="text-xs text-slate-500">Customers</div>
                  </div>
                  <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
                    <div className="text-2xl font-bold text-cyan-400">{completedCount}/{checklist.length}</div>
                    <div className="text-xs text-slate-500">Checklist</div>
                  </div>
                  <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
                    <div className="text-2xl font-bold text-amber-400">0%</div>
                    <div className="text-xs text-slate-500">To Goal</div>
                  </div>
                </div>
              </div>
            ) : (
              // Wizard steps
              <div className="max-w-2xl mx-auto">
                {/* Wizard progress */}
                <div className="flex items-center gap-2 mb-6">
                  {['Details', 'Industry & Model', 'Audience & Goals'].map((label, i) => (
                    <div key={label} className="flex items-center gap-2 flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        i < wizardStep ? 'bg-brand text-black' : i === wizardStep ? 'bg-brand/20 text-brand border border-brand/50' : 'bg-white/[0.02] text-slate-500'
                      }`}>
                        {i < wizardStep ? <Check size={14} /> : i + 1}
                      </div>
                      <span className={`text-xs hidden sm:block ${i === wizardStep ? 'text-white' : 'text-slate-500'}`}>{label}</span>
                      {i < 2 && <div className={`flex-1 h-px ${i < wizardStep ? 'bg-brand' : 'bg-white/[0.04]'}`} />}
                    </div>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {/* Wizard Step 0: Details */}
                  {wizardStep === 0 && (
                    <motion.div key="wiz0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                      className="bg-surface-3 rounded-2xl p-6 border border-white/[0.03] space-y-4">
                      <h3 className="text-lg font-bold flex items-center gap-2"><Building2 size={18} className="text-brand" />Business Details</h3>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Business Name *</label>
                        <input type="text" placeholder="e.g. Acme Solutions" value={bizName} onChange={e => setBizName(e.target.value)}
                          className="w-full bg-surface-2 rounded-lg px-4 py-3 border border-white/[0.03] focus:border-brand/30 outline-none text-sm text-white placeholder-slate-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Tagline</label>
                        <input type="text" placeholder="e.g. Helping businesses grow faster" value={bizTagline} onChange={e => setBizTagline(e.target.value)}
                          className="w-full bg-surface-2 rounded-lg px-4 py-3 border border-white/[0.03] focus:border-brand/30 outline-none text-sm text-white placeholder-slate-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Description</label>
                        <textarea placeholder="What does your business do?" value={bizDesc} onChange={e => setBizDesc(e.target.value)} rows={3}
                          className="w-full bg-surface-2 rounded-lg px-4 py-3 border border-white/[0.03] focus:border-brand/30 outline-none text-sm text-white placeholder-slate-500 transition-colors resize-none" />
                      </div>
                      <div className="flex justify-end">
                        <button onClick={() => setWizardStep(1)} disabled={!bizName}
                          className={`px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${bizName ? 'bg-brand text-black hover:bg-brand/90' : 'bg-white/[0.02] text-slate-500 cursor-not-allowed'}`}>
                          Next <ChevronRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Wizard Step 1: Industry & Model */}
                  {wizardStep === 1 && (
                    <motion.div key="wiz1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                      className="bg-surface-3 rounded-2xl p-6 border border-white/[0.03] space-y-5">
                      <h3 className="text-lg font-bold flex items-center gap-2"><Briefcase size={18} className="text-brand" />Industry & Model</h3>
                      <div>
                        <label className="block text-xs text-slate-400 mb-2">Industry</label>
                        <div className="flex flex-wrap gap-2">
                          {industries.map(ind => (
                            <button key={ind} onClick={() => setBizIndustry(ind)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${bizIndustry === ind ? 'bg-brand/20 text-brand border border-brand/30' : 'bg-surface-2 text-slate-400 border border-white/[0.03] hover:border-white/[0.05]'}`}>
                              {ind}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-2">Business Model</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {businessModels.map(model => (
                            <button key={model.id} onClick={() => setBizModel(model.id)}
                              className={`p-4 rounded-xl border text-left transition-all ${
                                bizModel === model.id ? 'border-brand bg-brand/10' : 'border-white/[0.03] bg-surface-2 hover:border-white/[0.05]'
                              }`}>
                              <model.icon size={20} className={bizModel === model.id ? 'text-brand mb-2' : 'text-slate-400 mb-2'} />
                              <div className="text-sm font-medium">{model.label}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{model.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <button onClick={() => setWizardStep(0)} className="px-5 py-2.5 rounded-lg bg-white/[0.02] text-slate-400 hover:text-white text-sm transition-colors">
                          Back
                        </button>
                        <button onClick={() => setWizardStep(2)}
                          className="px-6 py-2.5 rounded-lg bg-brand text-black font-bold text-sm hover:bg-brand/90 transition-all flex items-center gap-2">
                          Next <ChevronRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Wizard Step 2: Audience & Goals */}
                  {wizardStep === 2 && (
                    <motion.div key="wiz2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                      className="bg-surface-3 rounded-2xl p-6 border border-white/[0.03] space-y-5">
                      <h3 className="text-lg font-bold flex items-center gap-2"><Target size={18} className="text-brand" />Audience & Goals</h3>
                      <div>
                        <label className="block text-xs text-slate-400 mb-2">Target Audience (select all that apply)</label>
                        <div className="flex flex-wrap gap-2">
                          {audiences.map(aud => (
                            <button key={aud} onClick={() => toggleAudience(aud)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${bizAudience.includes(aud) ? 'bg-brand/20 text-brand border border-brand/30' : 'bg-surface-2 text-slate-400 border border-white/[0.03] hover:border-white/[0.05]'}`}>
                              {aud}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-2">Monthly Revenue Goal: <span className="text-white font-bold">{formatRevenue(bizRevGoal)}/mo</span></label>
                        <input type="range" min={1000} max={100000} step={1000} value={bizRevGoal} onChange={e => setBizRevGoal(Number(e.target.value))}
                          className="w-full accent-brand" />
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                          <span>$1K</span><span>$25K</span><span>$50K</span><span>$75K</span><span>$100K</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <button onClick={() => setWizardStep(1)} className="px-5 py-2.5 rounded-lg bg-white/[0.02] text-slate-400 hover:text-white text-sm transition-colors">
                          Back
                        </button>
                        <button onClick={handleWizardComplete}
                          className="px-6 py-2.5 rounded-lg bg-brand text-black font-bold text-sm hover:bg-brand/90 transition-all flex items-center gap-2">
                          <Rocket size={14} /> Launch Business
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* ===== LAUNCH CHECKLIST TAB ===== */}
        {activeTab === 'checklist' && (
          <motion.div key="checklist" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {/* Progress */}
            <div className="bg-surface-3 rounded-xl p-5 border border-white/[0.03] mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Launch Progress</h3>
                <span className="text-sm text-brand font-bold">{completedCount}/{checklist.length} complete</span>
              </div>
              <div className="w-full h-3 rounded-full bg-surface-2 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-cyan-400"
                  animate={{ width: `${(completedCount / checklist.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              {completedCount === checklist.length && (
                <motion.div className="mt-3 flex items-center gap-2 text-brand text-sm font-medium"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Sparkles size={16} /> All tasks complete! You're ready to scale.
                </motion.div>
              )}
            </div>

            {/* Checklist items */}
            <div className="space-y-2">
              {checklist.map((item, i) => (
                <motion.button
                  key={item.id}
                  onClick={() => toggleCheckItem(item.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    item.done ? 'bg-brand/5 border-brand/20' : 'bg-surface-3 border-white/[0.03] hover:border-white/[0.05]'
                  }`}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    item.done ? 'bg-brand text-black' : 'border-2 border-white/20'
                  }`}>
                    {item.done && <Check size={14} />}
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-brand/15 text-brand' : 'bg-white/[0.02] text-slate-400'}`}>
                    <item.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${item.done ? 'text-brand line-through' : 'text-white'}`}>{item.label}</div>
                    <div className="text-xs text-slate-500">{item.desc}</div>
                  </div>
                  <ChevronRight size={16} className="text-slate-500 flex-shrink-0" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ===== TEMPLATES TAB ===== */}
        {activeTab === 'templates' && (
          <motion.div key="templates" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {templates.map((tmpl, i) => (
                <motion.div
                  key={tmpl.id}
                  className="bg-surface-3 rounded-xl border border-white/[0.03] overflow-hidden card-hover group"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                >
                  {/* Template header */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${tmpl.color}15` }}>
                        <tmpl.icon size={22} style={{ color: tmpl.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{tmpl.name}</h3>
                        <span className="text-[10px] text-slate-500">{tmpl.revenue}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{tmpl.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tmpl.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded text-[10px] bg-white/[0.02] text-slate-400">{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Template footer */}
                  <div className="px-5 py-3 border-t border-white/[0.03] flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Star size={12} className="text-amber-400" /> Popular
                    </div>
                    <button className="text-xs font-medium text-brand hover:text-brand/80 transition-colors flex items-center gap-1">
                      Use Template <ArrowUpRight size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ===== REVENUE TAB ===== */}
        {activeTab === 'revenue' && (
          <motion.div key="revenue" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {/* Revenue header card */}
            <motion.div
              className="rounded-2xl p-8 text-center mb-6 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(15,23,42,0.9) 50%, rgba(6,182,212,0.15) 100%)' }}
            >
              <div className="absolute inset-0 neon-border rounded-2xl" />
              <div className="relative">
                <p className="text-slate-400 mb-2 text-sm">Monthly Recurring Revenue</p>
                <h2 className="text-5xl font-black mb-1">$0</h2>
                <p className="text-slate-500 text-sm">Goal: {formatRevenue(bizRevGoal || 10000)}/mo</p>
                <div className="w-full max-w-xs mx-auto mt-4">
                  <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full bg-brand" style={{ width: '0%' }} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">0% of goal</div>
                </div>
              </div>
            </motion.div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
                <div className="flex items-center gap-2 mb-2"><DollarSign size={14} className="text-brand" /><span className="text-xs text-slate-500">ARR</span></div>
                <div className="text-xl font-bold">$0</div>
              </div>
              <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
                <div className="flex items-center gap-2 mb-2"><Users size={14} className="text-purple-400" /><span className="text-xs text-slate-500">Customers</span></div>
                <div className="text-xl font-bold">0</div>
              </div>
              <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
                <div className="flex items-center gap-2 mb-2"><TrendingUp size={14} className="text-cyan-400" /><span className="text-xs text-slate-500">Growth</span></div>
                <div className="text-xl font-bold">0%</div>
              </div>
              <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
                <div className="flex items-center gap-2 mb-2"><Zap size={14} className="text-amber-400" /><span className="text-xs text-slate-500">LTV</span></div>
                <div className="text-xl font-bold">$0</div>
              </div>
            </div>

            {/* Revenue chart placeholder */}
            <div className="bg-surface-3 rounded-xl border border-white/[0.03] p-6">
              <h3 className="font-bold mb-4">Revenue Over Time</h3>
              <div className="flex items-end gap-2 h-48">
                {revenueData.map((d, i) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-white/[0.02] transition-all hover:bg-brand/20" style={{ height: `${Math.max(8, d.value)}%` }} />
                    <span className="text-[10px] text-slate-500">{d.month}</span>
                  </div>
                ))}
              </div>
              <div className="text-center mt-6">
                <p className="text-sm text-slate-500 mb-3">Start tracking revenue by completing your launch checklist</p>
                <button onClick={() => setActiveTab('checklist')} className="px-4 py-2 rounded-lg bg-brand/15 text-brand text-sm font-medium hover:bg-brand/20 transition-colors">
                  View Checklist
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== RESOURCES TAB ===== */}
        {activeTab === 'resources' && (
          <motion.div key="resources" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {/* Featured resource */}
            <motion.div
              className="rounded-2xl p-6 mb-6 border border-brand/20 bg-brand/5"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand/15 flex items-center justify-center flex-shrink-0">
                  <Crown size={24} className="text-brand" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] bg-brand/20 text-brand px-2 py-0.5 rounded-full font-medium uppercase">Featured</span>
                  <h3 className="text-lg font-bold mt-2">The GOATED Business Playbook</h3>
                  <p className="text-sm text-slate-400 mt-1">A comprehensive guide to building a profitable business from $0 to $100K MRR using the GOATED platform.</p>
                  <button className="mt-3 px-4 py-2 rounded-lg bg-brand text-black text-sm font-medium hover:bg-brand/90 transition-colors flex items-center gap-2">
                    Read Now <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Resource grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((res, i) => (
                <motion.div
                  key={res.title}
                  className="bg-surface-3 rounded-xl p-5 border border-white/[0.03] card-hover group cursor-pointer"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${res.color}15` }}>
                      <res.icon size={18} style={{ color: res.color }} />
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.02] text-slate-400 font-medium uppercase">{res.type}</span>
                  </div>
                  <h4 className="font-medium text-sm mb-2 group-hover:text-brand transition-colors">{res.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">5 min read</span>
                    <ArrowUpRight size={14} className="text-slate-500 group-hover:text-brand transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Tools section */}
            <div className="mt-8">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Wrench size={16} className="text-brand" /> Recommended Tools</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'Stripe', desc: 'Payments', icon: '💳' },
                  { name: 'Notion', desc: 'Documentation', icon: '📝' },
                  { name: 'Vercel', desc: 'Hosting', icon: '▲' },
                  { name: 'Resend', desc: 'Email', icon: '📧' },
                  { name: 'Cal.com', desc: 'Scheduling', icon: '📅' },
                  { name: 'PostHog', desc: 'Analytics', icon: '📊' },
                  { name: 'Linear', desc: 'Project Mgmt', icon: '📋' },
                  { name: 'Crisp', desc: 'Live Chat', icon: '💬' },
                ].map((tool, i) => (
                  <motion.div
                    key={tool.name}
                    className="bg-surface-3 rounded-xl p-4 border border-white/[0.03] card-hover cursor-pointer text-center"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  >
                    <div className="text-2xl mb-2">{tool.icon}</div>
                    <div className="text-sm font-medium">{tool.name}</div>
                    <div className="text-[10px] text-slate-500">{tool.desc}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
