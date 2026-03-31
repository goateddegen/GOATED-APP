import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Globe, Send, CheckCircle2, Plus,
  Lightbulb, Target, Brain, Trophy
} from 'lucide-react';
import { useStore } from '../hooks/useStore';

// ============================================================================
// LAUNCHPAD - Startup Incubation Platform (Clean / No Fake Data)
// ============================================================================

const TABS = [
  { id: 'discover', label: 'Discover', icon: Globe },
  { id: 'apply', label: 'Apply', icon: Send },
];

const STORAGE_KEY = 'goated_launchpad_applications';

function getApplications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveApplication(app) {
  try {
    const existing = getApplications();
    existing.push({ ...app, id: Date.now(), submittedAt: new Date().toISOString(), status: 'pending' });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch {
    return false;
  }
}

// ---- Approved projects stored in localStorage by admin ----
const APPROVED_KEY = 'goated_launchpad_approved';

function getApprovedProjects() {
  try {
    const raw = localStorage.getItem(APPROVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ---- Empty State for Discover ----
function DiscoverEmptyState({ onApply, accentColor }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: accentColor + '15' }}
      >
        <Rocket size={36} style={{ color: accentColor }} />
      </div>
      <h2 className="text-xl font-black text-white mb-2">No Projects Yet</h2>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        The GOATED LaunchPad is where founders build, launch, and scale. Be the first to apply
        for incubation and get your project in front of the community.
      </p>
      <button
        onClick={onApply}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-black hover:brightness-110 transition-all active:scale-[0.98]"
        style={{ background: accentColor }}
      >
        <Plus size={16} />
        Apply for Incubation
      </button>

      {/* What you get section */}
      <div className="mt-12 w-full max-w-2xl">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          What You Get
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Target, title: 'Market Access', desc: 'Reach 500K+ leads and potential customers from day one' },
            { icon: Brain, title: 'AI Tools', desc: 'GOATED AI helps with outreach, pitch decks, and market analysis' },
            { icon: Trophy, title: 'Community', desc: 'Get feedback, votes, and support from the GOATED network' },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-left">
              <item.icon size={18} className="text-brand mb-2" />
              <h4 className="text-xs font-bold text-white mb-1">{item.title}</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Approved Project Card ----
function ApprovedProjectCard({ project, accentColor }) {
  if (!project) return null;
  return (
    <div
      className="rounded-xl border p-4 transition-all duration-200 hover:border-white/[0.08]"
      style={{ background: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.04)' }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-bold text-white">{project.name || 'Untitled'}</h3>
        <span
          className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
          style={{ background: accentColor + '20', color: accentColor }}
        >
          Approved
        </span>
      </div>
      {project.description && (
        <p className="text-[11px] text-slate-400 mb-3 leading-relaxed line-clamp-3">{project.description}</p>
      )}
      {project.website && (
        <a
          href={project.website.startsWith('http') ? project.website : 'https://' + project.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-brand hover:underline"
        >
          {project.website}
        </a>
      )}
    </div>
  );
}

// ---- Discover Tab (with approved projects or empty state) ----
function DiscoverTab({ onApply, accentColor }) {
  const [approved, setApproved] = useState([]);

  useEffect(() => {
    setApproved(getApprovedProjects());
  }, []);

  if (!approved || approved.length === 0) {
    return <DiscoverEmptyState onApply={onApply} accentColor={accentColor} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold text-slate-300">
          {approved.length} Project{approved.length !== 1 ? 's' : ''} in the Incubator
        </h2>
        <button
          onClick={onApply}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-black hover:brightness-110 transition-all"
          style={{ background: accentColor }}
        >
          <Plus size={14} />
          Apply
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {approved.map((proj, i) => (
          <ApprovedProjectCard key={proj.id || i} project={proj} accentColor={accentColor} />
        ))}
      </div>
    </div>
  );
}

// ---- Application Form ----
function ApplyTab({ accentColor, onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    helpNeeded: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Project name is required.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please describe your project.');
      return;
    }

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
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: accentColor + '20' }}
        >
          <CheckCircle2 size={32} style={{ color: accentColor }} />
        </div>
        <h3 className="text-xl font-black text-white mb-2">Application Submitted</h3>
        <p className="text-sm text-slate-400 max-w-md leading-relaxed">
          Your project is now under review. An admin will review your application and reach out if approved.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setFormData({ name: '', description: '', website: '', helpNeeded: '' });
          }}
          className="mt-6 px-6 py-2.5 rounded-xl text-sm font-bold border transition-all hover:bg-white/[0.04]"
          style={{ color: accentColor, borderColor: accentColor + '40' }}
        >
          Submit Another
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Info banner */}
      <div className="mb-6 p-4 rounded-xl border border-brand/10 bg-brand/[0.03]">
        <div className="flex items-start gap-3">
          <Lightbulb size={20} className="text-brand flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Apply for GOATED Incubation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tell us about your project. Approved projects get access to the GOATED network,
              AI tools, community support, and exposure to 500K+ leads. No cost to apply.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Project Name *
          </label>
          <input
            required
            value={formData.name}
            onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
            placeholder="What is your project called?"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-brand/40 transition-colors placeholder:text-slate-600"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Description *
          </label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
            placeholder="What does your project do? What problem does it solve?"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-brand/40 transition-colors placeholder:text-slate-600 resize-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Website / Social Link
          </label>
          <input
            value={formData.website}
            onChange={e => setFormData(f => ({ ...f, website: e.target.value }))}
            placeholder="https://yourproject.com or @handle"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-brand/40 transition-colors placeholder:text-slate-600"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            What Do You Need Help With?
          </label>
          <textarea
            rows={3}
            value={formData.helpNeeded}
            onChange={e => setFormData(f => ({ ...f, helpNeeded: e.target.value }))}
            placeholder="e.g., Finding customers, building an MVP, fundraising, marketing..."
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-brand/40 transition-colors placeholder:text-slate-600 resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 font-medium">{error}</p>
        )}

        <button
          type="submit"
          className="w-full py-3.5 rounded-xl text-sm font-black text-black transition-all hover:brightness-110 active:scale-[0.98]"
          style={{ background: accentColor }}
        >
          Submit Application
        </button>

        <p className="text-[10px] text-slate-600 text-center">
          Applications are reviewed by the GOATED team. You will be contacted if approved.
        </p>
      </form>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function LaunchPadPage() {
  const degenMode = useStore(s => s.degenMode);
  const [tab, setTab] = useState('discover');

  const accentColor = degenMode ? '#f97316' : '#00ff88';

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const showToast = useCallback((msg) => { setToastMsg(msg); setToastVisible(true); }, []);

  useEffect(() => {
    if (toastVisible) {
      const t = setTimeout(() => setToastVisible(false), 2500);
      return () => clearTimeout(t);
    }
  }, [toastVisible]);

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div
            className={'w-10 h-10 rounded-xl flex items-center justify-center ' +
              (degenMode ? 'bg-orange-500/15' : 'bg-brand/10')
            }
          >
            <Rocket size={22} className={degenMode ? 'text-orange-400' : 'text-brand'} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              LaunchPad
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/15 text-brand font-bold tracking-wider">
                BETA
              </span>
            </h1>
            <p className="text-xs text-slate-500">Apply for incubation. Build and launch with the GOATED network.</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/[0.02] border border-white/[0.04] w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ' +
              (tab === t.id
                ? degenMode ? 'bg-orange-500/20 text-orange-400' : 'bg-brand/15 text-brand'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]')
            }
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'discover' && (
        <DiscoverTab
          onApply={() => setTab('apply')}
          accentColor={accentColor}
        />
      )}

      {tab === 'apply' && (
        <ApplyTab
          accentColor={accentColor}
          onSubmitSuccess={() => showToast('Application submitted successfully!')}
        />
      )}

      {/* Toast notification */}
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
