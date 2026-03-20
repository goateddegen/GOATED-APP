import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, LayoutDashboard, TrendingUp, Play, Store, Dice5, Wallet, Bot, ChevronRight, ChevronLeft, Rocket, Briefcase, Mic, LineChart, Target, Building2, Globe, DollarSign, Check, Sparkles } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import GoatLogo from './GoatLogo';

const roles = [
  { id: 'founder', icon: Rocket, label: 'Founder', desc: 'Building & scaling a business', color: 'from-brand to-emerald-400' },
  { id: 'sales', icon: Target, label: 'Sales Rep', desc: 'Closing deals & growing pipeline', color: 'from-cyan-400 to-blue-500' },
  { id: 'creator', icon: Mic, label: 'Creator', desc: 'Monetizing content & audience', color: 'from-purple-400 to-pink-500' },
  { id: 'investor', icon: LineChart, label: 'Investor', desc: 'Finding & funding winners', color: 'from-amber-400 to-orange-500' },
];

const features = [
  { icon: Users, label: 'Leads', desc: '2,500+ AI-scored leads with call scripts, outreach templates, and objection handlers. Turn cold prospects into warm deals.', color: '#10b981' },
  { icon: LayoutDashboard, label: 'Dashboard', desc: 'Real-time pipeline analytics, revenue tracking, and performance metrics. Your command center for growth.', color: '#06b6d4' },
  { icon: TrendingUp, label: 'Trend Pulse', desc: 'Live market trends, viral opportunities, and industry signals. Stay ahead of every curve.', color: '#a855f7' },
  { icon: Play, label: 'Live Plays', desc: 'Active sales plays, campaign strategies, and proven playbooks. Execute like a pro.', color: '#f97316' },
  { icon: Store, label: 'Marketplace', desc: 'Buy and sell business assets, templates, and tools. The marketplace for entrepreneurs.', color: '#ec4899' },
  { icon: Dice5, label: 'Casino', desc: 'Gamified challenges, prediction markets, and revenue competitions. Make money fun.', color: '#eab308' },
  { icon: Wallet, label: 'Wallet', desc: 'Multi-chain wallet with revenue tracking, commissions, and instant payouts.', color: '#8b5cf6' },
  { icon: Bot, label: 'GOATED AI', desc: 'Your AI co-pilot for sales, research, content, and strategy. Ask anything, get results.', color: '#14b8a6' },
];

const businessIndustries = [
  'SaaS & Software', 'E-commerce', 'Agency & Services', 'Creator Economy', 'Education & Courses',
  'Fintech', 'Health & Wellness', 'Real Estate', 'Marketing', 'AI & Technology',
];

export default function Onboarding() {
  const { onboardingComplete, setOnboardingComplete, setUserRole, setBusiness, setPage } = useStore();
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState(null);
  const [featureIdx, setFeatureIdx] = useState(0);
  const [bizName, setBizName] = useState('');
  const [bizIndustry, setBizIndustry] = useState('');
  const [bizTarget, setBizTarget] = useState('');
  const [bizRevGoal, setBizRevGoal] = useState(10000);

  if (onboardingComplete) return null;

  const totalSteps = 5;

  const handleComplete = () => {
    if (bizName) {
      setBusiness({ name: bizName, industry: bizIndustry, targetMarket: bizTarget, revenueGoal: bizRevGoal });
    }
    if (selectedRole) setUserRole(selectedRole);
    setOnboardingComplete(true);
    setPage('home');
  };

  const handleSkipBusiness = () => {
    if (selectedRole) setUserRole(selectedRole);
    setStep(4);
  };

  const canNext = () => {
    if (step === 1 && !selectedRole) return false;
    return true;
  };

  const nextStep = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };
  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const formatRevenue = (v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`;

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-surface-0 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/[0.02]">
        <motion.div
          className="h-full bg-gradient-to-r from-brand to-cyan-400"
          animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      </div>

      {/* Step indicator */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-brand w-6' : i < step ? 'bg-brand/50' : 'bg-white/[0.04]'}`} />
        ))}
      </div>

      {/* Skip button */}
      <button onClick={() => { setOnboardingComplete(true); setPage('home'); }}
        className="absolute top-6 right-6 text-sm text-slate-500 hover:text-white transition-colors z-10">
        Skip
      </button>

      {/* Content */}
      <div className="relative w-full max-w-2xl mx-auto px-6">
        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-8">
                <GoatLogo size={160} />
              </div>
              <motion.h1
                className="text-4xl sm:text-5xl font-black mb-4 bg-gradient-to-r from-brand via-emerald-300 to-cyan-400 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: 'text' }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              >
                Welcome to GOATED
              </motion.h1>
              <motion.p
                className="text-lg text-slate-400 max-w-md mb-2"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              >
                The Revenue Operating System for the next generation of entrepreneurs.
              </motion.p>
              <motion.p
                className="text-sm text-slate-500 max-w-sm mb-8"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              >
                AI-powered leads, real-time analytics, and everything you need to build a money-printing machine.
              </motion.p>
              <motion.button
                onClick={nextStep}
                className="px-8 py-3 rounded-xl bg-brand text-black font-bold text-sm hover:bg-brand/90 transition-all flex items-center gap-2"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                Get Started <ChevronRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <motion.div
              key="role"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-2xl sm:text-3xl font-black mb-2 text-center">What's your role?</h2>
              <p className="text-slate-400 mb-8 text-center">This helps us personalize your experience</p>
              <div className="grid grid-cols-2 gap-4 w-full max-w-lg mb-8">
                {roles.map((role, i) => (
                  <motion.button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all ${
                      selectedRole === role.id
                        ? 'border-brand bg-brand/10 shadow-lg shadow-brand/10'
                        : 'border-white/[0.05] bg-surface-2 hover:border-white/20 hover:bg-surface-3'
                    }`}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  >
                    {selectedRole === role.id && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                        <Check size={12} className="text-black" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center`}>
                      <role.icon size={24} className="text-white" />
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-sm">{role.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{role.desc}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={prevStep} className="px-5 py-2.5 rounded-lg bg-white/[0.02] text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-1">
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={nextStep} disabled={!selectedRole}
                  className={`px-8 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${selectedRole ? 'bg-brand text-black hover:bg-brand/90' : 'bg-white/[0.02] text-slate-500 cursor-not-allowed'}`}>
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Feature Tour */}
          {step === 2 && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-2xl sm:text-3xl font-black mb-2 text-center">Your Toolkit</h2>
              <p className="text-slate-400 mb-8 text-center">8 powerful features to dominate your market</p>

              {/* Feature carousel */}
              <div className="w-full max-w-lg mb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={featureIdx}
                    initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="bg-surface-2 rounded-2xl p-8 border border-white/[0.03] text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${features[featureIdx].color}15` }}>
                      {React.createElement(features[featureIdx].icon, { size: 32, style: { color: features[featureIdx].color } })}
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: features[featureIdx].color }}>{features[featureIdx].label}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{features[featureIdx].desc}</p>
                  </motion.div>
                </AnimatePresence>

                {/* Carousel dots */}
                <div className="flex items-center justify-center gap-1.5 mt-4">
                  {features.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setFeatureIdx(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === featureIdx ? 'bg-brand w-5' : 'bg-white/15 hover:bg-white/25'}`}
                    />
                  ))}
                </div>

                {/* Carousel nav */}
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button onClick={() => setFeatureIdx(Math.max(0, featureIdx - 1))} disabled={featureIdx === 0}
                    className="p-2 rounded-lg bg-white/[0.02] text-slate-400 hover:text-white disabled:opacity-30 transition-all">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs text-slate-500">{featureIdx + 1} / {features.length}</span>
                  <button onClick={() => setFeatureIdx(Math.min(features.length - 1, featureIdx + 1))} disabled={featureIdx === features.length - 1}
                    className="p-2 rounded-lg bg-white/[0.02] text-slate-400 hover:text-white disabled:opacity-30 transition-all">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={prevStep} className="px-5 py-2.5 rounded-lg bg-white/[0.02] text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-1">
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={nextStep}
                  className="px-8 py-2.5 rounded-lg bg-brand text-black font-bold text-sm hover:bg-brand/90 transition-all flex items-center gap-2">
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Start a Business */}
          {step === 3 && (
            <motion.div
              key="business"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center w-full"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-cyan-400 flex items-center justify-center mb-4">
                <Building2 size={22} className="text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2 text-center">Quick Business Setup</h2>
              <p className="text-slate-400 mb-6 text-center text-sm">Set up your business in 60 seconds (you can change this later)</p>

              <div className="w-full max-w-lg space-y-4 mb-6">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Business Name</label>
                  <input type="text" placeholder="e.g. Acme Solutions" value={bizName} onChange={e => setBizName(e.target.value)}
                    className="w-full bg-surface-2 rounded-lg px-4 py-3 border border-white/[0.03] focus:border-brand/30 outline-none text-sm text-white placeholder-slate-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Industry</label>
                  <div className="flex flex-wrap gap-2">
                    {businessIndustries.map(ind => (
                      <button key={ind} onClick={() => setBizIndustry(ind)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${bizIndustry === ind ? 'bg-brand/20 text-brand border border-brand/30' : 'bg-surface-2 text-slate-400 border border-white/[0.03] hover:border-white/[0.05]'}`}>
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Target Market</label>
                  <input type="text" placeholder="e.g. Small businesses, Creators, Enterprise" value={bizTarget} onChange={e => setBizTarget(e.target.value)}
                    className="w-full bg-surface-2 rounded-lg px-4 py-3 border border-white/[0.03] focus:border-brand/30 outline-none text-sm text-white placeholder-slate-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Monthly Revenue Goal: {formatRevenue(bizRevGoal)}</label>
                  <input type="range" min={1000} max={100000} step={1000} value={bizRevGoal} onChange={e => setBizRevGoal(Number(e.target.value))}
                    className="w-full accent-brand" />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>$1K/mo</span><span>$100K/mo</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={prevStep} className="px-5 py-2.5 rounded-lg bg-white/[0.02] text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-1">
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={handleSkipBusiness} className="px-5 py-2.5 rounded-lg bg-white/[0.02] text-slate-400 hover:text-white text-sm transition-colors">
                  Skip for now
                </button>
                <button onClick={nextStep}
                  className="px-8 py-2.5 rounded-lg bg-brand text-black font-bold text-sm hover:bg-brand/90 transition-all flex items-center gap-2">
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Ready */}
          {step === 4 && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand to-cyan-400 flex items-center justify-center mb-6"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
              >
                <Sparkles size={36} className="text-white" />
              </motion.div>
              <motion.h2
                className="text-3xl sm:text-4xl font-black mb-3"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              >
                Your <span className="text-brand">GOATED</span> workspace is ready!
              </motion.h2>
              <motion.p
                className="text-slate-400 mb-2 max-w-md"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              >
                You're all set to start crushing it. We've personalized your experience based on your preferences.
              </motion.p>

              {(selectedRole || bizName) && (
                <motion.div
                  className="flex flex-wrap items-center justify-center gap-2 mt-4 mb-6"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                >
                  {selectedRole && (
                    <span className="px-3 py-1 rounded-full bg-brand/15 text-brand text-xs font-medium">
                      {roles.find(r => r.id === selectedRole)?.label}
                    </span>
                  )}
                  {bizName && (
                    <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-400 text-xs font-medium">
                      {bizName}
                    </span>
                  )}
                  {bizIndustry && (
                    <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-400 text-xs font-medium">
                      {bizIndustry}
                    </span>
                  )}
                </motion.div>
              )}

              <motion.button
                onClick={handleComplete}
                className="px-10 py-3.5 rounded-xl bg-brand text-black font-bold text-sm hover:bg-brand/90 transition-all flex items-center gap-2"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                Go to Dashboard <Rocket size={16} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
