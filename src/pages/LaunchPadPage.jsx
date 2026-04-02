import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Globe, Send, CheckCircle2, Plus,
  Lightbulb, Target, Brain, Trophy, Crown, Shield, Lock,
  Users, DollarSign, BarChart3, Zap, Star, ArrowRight, ChevronRight
} from 'lucide-react';
import { useStore } from '../hooks/useStore';

// ============================================================================
// LAUNCHPAD - Exclusive Partner Incubation (High Barrier / Invite-Feel)
// ============================================================================

const STORAGE_KEY = 'goated_launchpad_applications';
const APPROVED_KEY = 'goated_launchpad_approved';

function getApplications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveApplication(app) {
  try {
    const existing = getApplications();
    existing.push({ ...app, id: Date.now(), submittedAt: new Date().toISOString(), status: 'pending' });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch { return false; }
}

function getApprovedProjects() {
  try {
    const raw = localStorage.getItem(APPROVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ---- Approved Partner Card ----
function ApprovedProjectCard({ project, accentColor }) {
  if (!project) return null;
  return (
    <div className="rounded-xl border p-4 transition-all duration-200 hover:border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.04)' }}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-bold text-white">{project.name || 'Untitled'}</h3>
        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ background: accentColor + '20', color: accentColor }}>Approved</span>
      </div>
      {project.description && <p className="text-[11px] text-slate-400 mb-3 leading-relaxed line-clamp-3">{project.description}</p>}
      {project.website && (
        <a href={project.website.startsWith('http') ? project.website : 'https://' + project.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand hover:underline">{project.website}</a>
      )}
    </div>
  );
}

// ---- Exclusive Landing / Discover ----
function DiscoverSection({ onApply, accentColor }) {
  const [approved, setApproved] = useState([]);
  useEffect(() => { setApproved(getApprovedProjects()); }, []);

  return (
    <div>
      {/* Hero / Exclusive Feel */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] mb-8" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.04) 0%, rgba(0,0,0,0.97) 40%, rgba(168,85,247,0.04) 100%)' }}>
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(236,72,153,0.08) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative p-8 sm:p-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-400 text-[10px] font-bold uppercase tracking-widest mb-6">
              <Lock size={12} />
              Application-Only Access
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
              The GOATED <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-brand bg-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text' }}>Partner Incubator</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-2 leading-relaxed">
              We don't accept everyone. We select closers, builders, and operators who are ready to scale. If you get in, we go all-in on your success.
            </p>
            <p className="text-sm text-slate-500 max-w-xl mx-auto mb-8">
              Approved partners earn <span className="text-pink-400 font-bold">15% commission</span> on every closed deal, get dedicated support, priority leads, and co-marketing. No fees. No subscriptions. Just results.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-slate-300">
                <Shield size={14} className="text-brand" /> Vetted & Curated
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-slate-300">
                <Crown size={14} className="text-yellow-400" /> 15% Commission
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-slate-300">
                <Zap size={14} className="text-purple-400" /> Priority Everything
              </div>
            </div>

            <button onClick={onApply} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-black text-black hover:brightness-110 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(236,72,153,0.2)]" style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}>
              <Rocket size={18} />
              Apply for Partner Access
              <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </div>

      {/* What Partners Get */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5 text-center">What Approved Partners Unlock</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: DollarSign, title: '15% Commission', desc: 'Highest commission rate in the game. Every deal you close.', color: '#ec4899' },
            { icon: Target, title: 'Priority Leads', desc: 'First access to high-intent, whale-tier leads before anyone else.', color: '#a855f7' },
            { icon: Users, title: 'Dedicated Manager', desc: 'Your own success manager who helps you close bigger and faster.', color: '#10b981' },
            { icon: BarChart3, title: 'Co-Marketing', desc: 'We promote your wins. Case studies, spotlights, and referrals.', color: '#f59e0b' },
          ].map((item, i) => (
            <motion.div key={i} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all group" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110" style={{ background: `${item.color}15`, color: item.color }}>
                <item.icon size={20} />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5 text-center">The Selection Process</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '01', title: 'Apply', desc: 'Tell us about yourself, your sales background, and what you want to build. 5-minute application.', color: '#ec4899', icon: Send },
            { step: '02', title: 'Interview', desc: 'Quick video call with our team. We want to see ambition, coachability, and hunger. Not everyone makes the cut.', color: '#a855f7', icon: Users },
            { step: '03', title: 'Get Approved & Scale', desc: 'Accepted partners unlock 15% commissions, priority leads, dedicated support, and the full GOATED arsenal.', color: '#10b981', icon: Trophy },
          ].map((item, i) => (
            <motion.div key={i} className="relative p-5 rounded-xl bg-black/40 border border-white/[0.05] hover:border-white/[0.08] transition-all" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 * i }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${item.color}15`, color: item.color }}>
                  <item.icon size={18} />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: item.color }}>Step {item.step}</span>
              </div>
              <h4 className="text-base font-black text-white mb-1.5">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              {i < 2 && <ChevronRight size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-700 hidden sm:block" />}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { value: '15%', label: 'Commission', color: '#ec4899' },
          { value: '$0', label: 'Cost to Join', color: '#10b981' },
          { value: '<5%', label: 'Acceptance Rate', color: '#a855f7' },
          { value: '48hr', label: 'Review Time', color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
            <div className="text-2xl font-black mb-0.5" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Approved Projects */}
      {approved.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            {approved.length} Approved Partner{approved.length !== 1 ? 's' : ''} in the Incubator
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {approved.map((proj, i) => (
              <ApprovedProjectCard key={proj.id || i} project={proj} accentColor={accentColor} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Application Form (More Serious) ----
function ApplySection({ accentColor, onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    background: '',
    revenue: '',
    niche: '',
    website: '',
    why: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim()) { setError('Your name is required.'); return; }
    if (!formData.email.trim()) { setError('Email is required.'); return; }
    if (!formData.background.trim()) { setError('Tell us about your background.'); return; }
    if (!formData.why.trim()) { setError('Tell us why you want in.'); return; }

    const ok = saveApplication(formData);
    if (ok) {
      setSubmitted(true);
      if (onSubmitSuccess) onSubmitSuccess();
    } else {
      setError('Failed to save. Please try again.');
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: accentColor + '20' }}>
          <CheckCircle2 size={32} style={{ color: accentColor }} />
        </div>
        <h3 className="text-xl font-black text-white mb-2">Application Received</h3>
        <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-2">
          We review every application personally. If you're a fit, we'll reach out within 48 hours for a quick interview call.
        </p>
        <p className="text-xs text-slate-500">Most applicants hear back within 24 hours.</p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Serious banner */}
      <div className="mb-6 p-5 rounded-xl border border-pink-500/20 bg-pink-500/[0.03]">
        <div className="flex items-start gap-3">
          <Lock size={20} className="text-pink-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Partner Application</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This isn't a signup form. We handpick partners who are serious about closing deals and building revenue.
              Accepted applicants get 15% commissions, priority leads, and a dedicated success manager. We reject most applications.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Full Name *</label>
            <input required value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="Your name" className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-pink-500/40 transition-colors placeholder:text-slate-600" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email *</label>
            <input required type="email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com" className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-pink-500/40 transition-colors placeholder:text-slate-600" />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Sales / Business Background *</label>
          <textarea required rows={3} value={formData.background} onChange={e => setFormData(f => ({ ...f, background: e.target.value }))} placeholder="Years of experience, industries, biggest deal closed, current role..." className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-pink-500/40 transition-colors placeholder:text-slate-600 resize-none" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Monthly Revenue Target</label>
            <input value={formData.revenue} onChange={e => setFormData(f => ({ ...f, revenue: e.target.value }))} placeholder="$10K, $50K, $100K+..." className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-pink-500/40 transition-colors placeholder:text-slate-600" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Industry / Niche</label>
            <input value={formData.niche} onChange={e => setFormData(f => ({ ...f, niche: e.target.value }))} placeholder="SaaS, Fintech, Health, Real Estate..." className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-pink-500/40 transition-colors placeholder:text-slate-600" />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Website / LinkedIn / Social</label>
          <input value={formData.website} onChange={e => setFormData(f => ({ ...f, website: e.target.value }))} placeholder="https://linkedin.com/in/you or @handle" className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-pink-500/40 transition-colors placeholder:text-slate-600" />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Why Should We Accept You? *</label>
          <textarea required rows={3} value={formData.why} onChange={e => setFormData(f => ({ ...f, why: e.target.value }))} placeholder="What makes you different? Why are you built for this?" className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-pink-500/40 transition-colors placeholder:text-slate-600 resize-none" />
        </div>

        {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

        <button type="submit" className="w-full py-3.5 rounded-xl text-sm font-black text-white transition-all hover:brightness-110 active:scale-[0.98] shadow-[0_0_20px_rgba(236,72,153,0.15)]" style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}>
          Submit Partner Application
        </button>

        <p className="text-[10px] text-slate-600 text-center">
          Applications reviewed within 48 hours. We accept less than 5% of applicants.
        </p>
      </form>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================
export default function LaunchPadPage() {
  const degenMode = useStore(s => s.degenMode);
  const [view, setView] = useState('discover');
  const accentColor = degenMode ? '#f97316' : '#ec4899';

  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const showToast = useCallback((msg) => { setToastMsg(msg); setToastVisible(true); }, []);
  useEffect(() => { if (toastVisible) { const t = setTimeout(() => setToastVisible(false), 2500); return () => clearTimeout(t); } }, [toastVisible]);

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accentColor}15` }}>
            <Crown size={22} style={{ color: accentColor }} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              Partner Program
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider" style={{ background: `${accentColor}15`, color: accentColor }}>
                INVITE ONLY
              </span>
            </h1>
            <p className="text-xs text-slate-500">Application-only partner incubator for serious closers.</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/[0.02] border border-white/[0.04] w-fit">
        {[
          { id: 'discover', label: 'Overview', icon: Globe },
          { id: 'apply', label: 'Apply Now', icon: Send },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} className={'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ' + (view === t.id ? 'text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]')} style={view === t.id ? { background: `${accentColor}20`, color: accentColor } : {}}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {view === 'discover' && <DiscoverSection onApply={() => setView('apply')} accentColor={accentColor} />}
      {view === 'apply' && <ApplySection accentColor={accentColor} onSubmitSuccess={() => showToast('Application submitted!')} />}

      <AnimatePresence>
        {toastVisible && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-xl bg-surface-3 border border-white/10 shadow-2xl text-sm text-white font-medium">
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
