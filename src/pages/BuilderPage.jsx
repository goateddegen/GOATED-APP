import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, CheckCircle, Clock, Users, DollarSign, TrendingUp,
  ChevronRight, Send, Star, Shield, Zap, ArrowRight, Link2,
  Copy, ExternalLink,
} from 'lucide-react';
import { useStore } from '../hooks/useStore';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const FOLLOWING_OPTIONS = [
  { value: '', label: 'Select range' },
  { value: '<1K', label: 'Less than 1K' },
  { value: '1K-10K', label: '1K - 10K' },
  { value: '10K-100K', label: '10K - 100K' },
  { value: '100K+', label: '100K+' },
];

const PLATFORM_OPTIONS = [
  { value: '', label: 'Select platform' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'discord', label: 'Discord' },
  { value: 'other', label: 'Other' },
];

const STEPS = [
  {
    icon: Send,
    title: 'Apply',
    desc: 'Fill out the partner application form below',
  },
  {
    icon: Clock,
    title: 'Get Approved',
    desc: '24-48 hour review by our partnerships team',
  },
  {
    icon: DollarSign,
    title: 'Start Earning',
    desc: 'Share your unique link, earn on every close',
  },
];

const STATS = [
  { label: 'Paid to Partners', value: '$1.2M+', icon: DollarSign },
  { label: 'Active Partners', value: '340+', icon: Users },
  { label: 'Avg Conversion Rate', value: '18%', icon: TrendingUp },
];

const PROGRESS_STEPS = ['Applied', 'Under Review', 'Approved', 'Active'];

function InputField({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-300">
        {label}
        {required && <span className="ml-1 text-[#00ff88]">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-[#00ff88]/50 focus:ring-1 focus:ring-[#00ff88]/20';

const selectClass =
  'w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00ff88]/50 focus:ring-1 focus:ring-[#00ff88]/20 appearance-none cursor-pointer';

function ProgressTracker({ currentStep }) {
  return (
    <div className="flex items-center justify-between">
      {PROGRESS_STEPS.map((step, i) => {
        const isActive = i <= currentStep;
        const isComplete = i < currentStep;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  isComplete
                    ? 'border-[#00ff88] bg-[#00ff88]/20'
                    : isActive
                    ? 'border-[#00ff88] bg-transparent'
                    : 'border-white/[0.08] bg-transparent'
                }`}
              >
                {isComplete ? (
                  <CheckCircle size={18} className="text-[#00ff88]" />
                ) : (
                  <span
                    className={`text-sm font-bold ${
                      isActive ? 'text-[#00ff88]' : 'text-gray-600'
                    }`}
                  >
                    {i + 1}
                  </span>
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive ? 'text-white' : 'text-gray-600'
                }`}
              >
                {step}
              </span>
            </div>
            {i < PROGRESS_STEPS.length - 1 && (
              <div
                className={`mx-2 h-px flex-1 ${
                  i < currentStep ? 'bg-[#00ff88]/40' : 'bg-white/[0.06]'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SubmittedView() {
  const [copied, setCopied] = useState(false);
  const refLink = 'https://goated.solutions/ref/YOUR-CODE';

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl"
    >
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-8 sm:p-10">
        {/* Success header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#00ff88]/10"
          >
            <CheckCircle size={32} className="text-[#00ff88]" />
          </motion.div>
          <h2 className="mb-2 text-2xl font-bold text-white">
            Application Submitted
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-gray-400">
            We'll review your application within{' '}
            <span className="font-semibold text-[#00ff88]">24-48 hours</span>.
            You'll receive an email once you're approved.
          </p>
        </div>

        {/* Progress tracker */}
        <div className="mb-10">
          <ProgressTracker currentStep={1} />
        </div>

        {/* Referral link preview */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Link2 size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-400">
              Your Referral Link
            </span>
            <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold text-yellow-400">
              PENDING APPROVAL
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-white/[0.04] bg-black/30 px-4 py-2.5">
              <span className="select-none text-sm text-gray-600 line-through">
                {refLink}
              </span>
            </div>
            <button
              disabled
              className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-4 py-2.5 text-sm text-gray-600 cursor-not-allowed"
            >
              <Copy size={14} />
              Copy
            </button>
          </div>
          <p className="mt-2.5 text-xs text-gray-600">
            Your unique referral link will be activated once your application is
            approved.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function BuilderPage() {
  const affiliateStatus = useStore((s) => s.affiliateStatus);
  const submitAffiliateApplication = useStore(
    (s) => s.submitAffiliateApplication
  );

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    company: '',
    following: '',
    platform: '',
    reason: '',
    referralCode: '',
  });
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Invalid email';
    if (!form.following) errs.following = 'Required';
    if (!form.platform) errs.platform = 'Required';
    if (!form.reason.trim()) errs.reason = 'Required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    submitAffiliateApplication({ ...form, submittedAt: new Date().toISOString() });
  };

  const isSubmitted = affiliateStatus === 'submitted' || affiliateStatus === 'approved';

  return (
    <div className="min-h-screen bg-[#0a0a14] pb-24">
      {/* Hero */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative overflow-hidden border-b border-white/[0.03]"
      >
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00ff88]/[0.04] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pb-12 pt-16 text-center sm:px-6 sm:pt-24 sm:pb-16">
          <motion.div variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5 px-4 py-1.5">
            <Rocket size={14} className="text-[#00ff88]" />
            <span className="text-xs font-semibold text-[#00ff88]">GOATED Launchpad</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl"
          >
            Become a{' '}
            <span className="bg-gradient-to-r from-[#00ff88] to-emerald-400 bg-clip-text text-transparent">
              GOATED Partner
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto max-w-lg text-base leading-relaxed text-gray-400 sm:text-lg"
          >
            Earn{' '}
            <span className="font-bold text-[#00ff88]">
              20% recurring commission
            </span>{' '}
            on every deal your referrals close
          </motion.p>
        </div>
      </motion.section>

      {/* How it works */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={stagger}
        className="mx-auto max-w-4xl px-4 py-14 sm:px-6"
      >
        <motion.h2
          variants={fadeUp}
          className="mb-8 text-center text-xl font-bold text-white sm:text-2xl"
        >
          How It Works
        </motion.h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                variants={fadeUp}
                className="group relative rounded-xl border border-white/[0.04] bg-white/[0.02] p-6 text-center transition-colors hover:border-[#00ff88]/20 hover:bg-white/[0.04]"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#00ff88]/10 px-3 py-0.5 text-xs font-bold text-[#00ff88]">
                  Step {i + 1}
                </div>
                <div className="mx-auto mb-4 mt-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#00ff88]/10">
                  <Icon size={22} className="text-[#00ff88]" />
                </div>
                <h3 className="mb-1.5 text-base font-bold text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Application form OR submitted view */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <SubmittedView key="submitted" />
          ) : (
            <motion.div
              key="form"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={stagger}
              className="mx-auto max-w-2xl"
            >
              <motion.div
                variants={fadeUp}
                className="mb-6 text-center"
              >
                <h2 className="mb-1 text-xl font-bold text-white">
                  Partner Application
                </h2>
                <p className="text-sm text-gray-500">
                  Fill out the form below to apply for the GOATED Partner
                  Program
                </p>
              </motion.div>

              <motion.form
                variants={fadeUp}
                onSubmit={handleSubmit}
                className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 sm:p-8"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Full Name */}
                  <InputField label="Full Name" required>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      placeholder="John Smith"
                      className={`${inputClass} ${
                        errors.fullName ? 'border-red-500/50' : ''
                      }`}
                    />
                    {errors.fullName && (
                      <span className="text-xs text-red-400">
                        {errors.fullName}
                      </span>
                    )}
                  </InputField>

                  {/* Email */}
                  <InputField label="Email" required>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="john@company.com"
                      className={`${inputClass} ${
                        errors.email ? 'border-red-500/50' : ''
                      }`}
                    />
                    {errors.email && (
                      <span className="text-xs text-red-400">
                        {errors.email}
                      </span>
                    )}
                  </InputField>

                  {/* Company */}
                  <InputField label="Company / Brand">
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => updateField('company', e.target.value)}
                      placeholder="Optional"
                      className={inputClass}
                    />
                  </InputField>

                  {/* Referral Code */}
                  <InputField label="Referral Code">
                    <input
                      type="text"
                      value={form.referralCode}
                      onChange={(e) =>
                        updateField('referralCode', e.target.value)
                      }
                      placeholder="Optional - if referred by a partner"
                      className={inputClass}
                    />
                  </InputField>

                  {/* Social Following */}
                  <InputField label="Social Following Size" required>
                    <select
                      value={form.following}
                      onChange={(e) => updateField('following', e.target.value)}
                      className={`${selectClass} ${
                        errors.following ? 'border-red-500/50' : ''
                      } ${!form.following ? 'text-gray-600' : ''}`}
                    >
                      {FOLLOWING_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.following && (
                      <span className="text-xs text-red-400">
                        {errors.following}
                      </span>
                    )}
                  </InputField>

                  {/* Primary Platform */}
                  <InputField label="Primary Platform" required>
                    <select
                      value={form.platform}
                      onChange={(e) => updateField('platform', e.target.value)}
                      className={`${selectClass} ${
                        errors.platform ? 'border-red-500/50' : ''
                      } ${!form.platform ? 'text-gray-600' : ''}`}
                    >
                      {PLATFORM_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.platform && (
                      <span className="text-xs text-red-400">
                        {errors.platform}
                      </span>
                    )}
                  </InputField>
                </div>

                {/* Why partner */}
                <div className="mt-5">
                  <InputField
                    label="Why do you want to partner with GOATED?"
                    required
                  >
                    <textarea
                      value={form.reason}
                      onChange={(e) => updateField('reason', e.target.value)}
                      placeholder="Tell us about your audience, how you'd promote GOATED, and why you're a great fit..."
                      rows={4}
                      className={`${inputClass} resize-none ${
                        errors.reason ? 'border-red-500/50' : ''
                      }`}
                    />
                    {errors.reason && (
                      <span className="text-xs text-red-400">
                        {errors.reason}
                      </span>
                    )}
                  </InputField>
                </div>

                {/* Submit */}
                <div className="mt-8 flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    <span className="text-[#00ff88]">*</span> Required fields
                  </p>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 rounded-lg bg-[#00ff88] px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-[#00ff88]/80"
                  >
                    Submit Application
                    <ArrowRight size={16} />
                  </motion.button>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Stats */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={stagger}
        className="mx-auto mt-20 max-w-4xl px-4 sm:px-6"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="flex flex-col items-center rounded-xl border border-white/[0.04] bg-white/[0.02] p-6 text-center"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#00ff88]/10">
                  <Icon size={20} className="text-[#00ff88]" />
                </div>
                <span className="mb-1 text-2xl font-extrabold text-white">
                  {stat.value}
                </span>
                <span className="text-sm text-gray-500">{stat.label}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Bottom CTA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="mx-auto mt-20 max-w-4xl px-4 pb-12 sm:px-6"
      >
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-[#00ff88]/10 bg-gradient-to-b from-[#00ff88]/[0.04] to-transparent p-8 text-center sm:p-12"
        >
          <Shield size={28} className="mx-auto mb-4 text-[#00ff88]" />
          <h3 className="mb-2 text-xl font-bold text-white">
            Trusted by 340+ Partners Worldwide
          </h3>
          <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-gray-400">
            Join the fastest-growing partner network in sales AI. No upfront
            costs, no minimums, just recurring revenue.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-[#00ff88]" />
              20% recurring commission
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-[#00ff88]" />
              Real-time dashboard
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-[#00ff88]" />
              Monthly payouts
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-[#00ff88]" />
              Dedicated partner support
            </span>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
}
