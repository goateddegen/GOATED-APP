import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap, Crown, Zap, Star, Users, DollarSign, TrendingUp, CheckCircle,
  Play, Clock, BookOpen, ChevronRight, ExternalLink, Link2, Shield, Flame,
  BarChart3, Phone, Brain, FileText, Lock, Award, MessageSquare
} from 'lucide-react';
import { useStore } from '../hooks/useStore';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }),
};

const tiers = [
  {
    name: 'Free',
    price: 0,
    badge: 'Starter',
    icon: Zap,
    color: 'text-slate-400',
    border: 'border-white/5',
    bg: 'bg-white/[0.02]',
    cta: 'Get Started Free',
    features: [
      'Access to GOATED platform',
      'Basic AI chat assistant',
      '50 leads per day',
      'Community Discord access',
    ],
  },
  {
    name: 'Pro',
    price: 29,
    badge: 'Most Popular',
    icon: Crown,
    color: 'text-brand',
    border: 'border-brand/30',
    bg: 'bg-brand/[0.04]',
    cta: 'Go Pro',
    popular: true,
    features: [
      'Unlimited leads',
      'Alpha signals & alerts',
      'VoIP calling built-in',
      'Priority AI assistant',
      'Prediction market access',
      'Weekly group coaching calls',
    ],
  },
  {
    name: 'Elite',
    price: 99,
    badge: 'Maximum Alpha',
    icon: Flame,
    color: 'text-orange-400',
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/[0.04]',
    cta: 'Join Elite',
    features: [
      'Everything in Pro',
      '1-on-1 coaching sessions',
      'Custom AI playbooks',
      'Whale alerts & intel',
      'Exclusive DEGEN alpha',
      'White-label reports',
    ],
  },
];

const modules = [
  { title: 'Cold Outreach Mastery', lessons: 12, hours: 4.2, icon: Phone, progress: 0 },
  { title: 'Objection Annihilation', lessons: 8, hours: 2.8, icon: Shield, progress: 0 },
  { title: 'Pipeline Management', lessons: 10, hours: 3.5, icon: BarChart3, progress: 0 },
  { title: 'Crypto & Prediction Markets for Closers', lessons: 6, hours: 2.1, icon: TrendingUp, progress: 0 },
  { title: 'DEGEN Mode: Advanced Alpha Trading', lessons: 8, hours: 3.0, icon: Flame, progress: 0 },
  { title: 'Building Your B2B Empire', lessons: 10, hours: 4.0, icon: Brain, progress: 0 },
];

const stats = [
  { label: 'Members', value: '2,400+', icon: Users },
  { label: 'Revenue Generated', value: '$4.2M+', icon: DollarSign },
  { label: 'Active Closers', value: '340+', icon: TrendingUp },
  { label: 'Satisfaction Rate', value: '92%', icon: Star },
];

const testimonials = [
  {
    quote: "Went from $3K/mo to $18K/mo in 60 days. The cold outreach module alone changed my entire approach. GOATED lives up to the name.",
    name: 'Jake M.',
    location: 'Austin, TX',
    revenue: '$18K/mo',
  },
  {
    quote: "The alpha signals alone paid for a year of Elite in the first week. The prediction market intel is unmatched. This community is different.",
    name: 'Sarah K.',
    location: 'Miami, FL',
    revenue: '$24K/mo',
  },
  {
    quote: "I was skeptical about another sales course, but the 1-on-1 coaching and AI playbooks are next level. Closed my first $50K deal within 30 days.",
    name: 'Marcus T.',
    location: 'New York, NY',
    revenue: '$31K/mo',
  },
  {
    quote: "The DEGEN mode signals are insane. Combined with the closing techniques, I'm running a full pipeline on autopilot now. Best investment I've made.",
    name: 'Priya R.',
    location: 'San Francisco, CA',
    revenue: '$22K/mo',
  },
];

export default function WhopPage() {
  const degenMode = useStore(s => s.degenMode);
  const [whopConnected, setWhopConnected] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 lg:px-8">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand/10 rounded-full blur-[120px]" />
          {degenMode && <div className="absolute top-20 right-1/4 w-[300px] h-[200px] bg-orange-500/10 rounded-full blur-[80px]" />}
        </div>

        <motion.div
          className="relative max-w-4xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold tracking-wider uppercase mb-6">
            <GraduationCap className="w-4 h-4" />
            Powered by Whop
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4">
            <span className="text-white">GOATED</span>{' '}
            <span className={degenMode ? 'text-orange-400' : 'text-brand'}>University</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg sm:text-xl text-slate-300 font-medium mb-2">
            Master the Art of Closing. From Cold Call to Commission Check.
          </motion.p>

          <motion.p variants={fadeUp} custom={3} className="text-sm text-slate-500 mb-8">
            Join 2,400+ closers printing money with GOATED's proven systems
          </motion.p>

          <motion.a
            variants={fadeUp}
            custom={4}
            href="https://goated.solutions/whop"
            className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-black text-sm transition-all hover:scale-105 active:scale-95 ${
              degenMode ? 'bg-orange-400 hover:bg-orange-300' : 'bg-brand hover:bg-emerald-400'
            }`}
          >
            Join GOATED on Whop
            <ExternalLink className="w-4 h-4" />
          </motion.a>
        </motion.div>
      </section>

      {/* Tier Cards */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Choose Your Path</h2>
          <p className="text-slate-400 text-sm">Every tier includes access to GOATED University</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => {
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-30px' }}
                variants={fadeUp}
                custom={i}
                className={`relative rounded-2xl border ${tier.border} ${tier.bg} p-6 flex flex-col transition-all hover:border-opacity-60 hover:scale-[1.02] ${
                  tier.popular ? 'ring-1 ring-brand/30' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand text-black text-[10px] font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tier.bg} border ${tier.border}`}>
                    <Icon className={`w-5 h-5 ${tier.color}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{tier.name}</h3>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold ${tier.color}`}>{tier.badge}</span>
                  </div>
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-black text-white">${tier.price}</span>
                  <span className="text-slate-500 text-sm">/mo</span>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.color}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="https://goated.solutions/whop"
                  className={`block w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95 ${
                    tier.popular
                      ? 'bg-brand text-black hover:bg-emerald-400'
                      : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {tier.cta}
                </a>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Community Stats */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center"
              >
                <Icon className={`w-5 h-5 mx-auto mb-2 ${degenMode ? 'text-orange-400' : 'text-brand'}`} />
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Course Modules */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">GOATED University Curriculum</h2>
          <p className="text-slate-400 text-sm">6 modules. 54 lessons. From zero to elite closer.</p>
        </motion.div>

        <div className="space-y-3">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.5}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:p-5 flex items-center gap-4 hover:bg-white/[0.04] transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  degenMode ? 'bg-orange-500/10' : 'bg-brand/10'
                }`}>
                  <Icon className={`w-5 h-5 ${degenMode ? 'text-orange-400' : 'text-brand'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Module {i + 1}</span>
                  </div>
                  <h3 className="text-white font-semibold text-sm sm:text-base truncate">{mod.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {mod.lessons} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {mod.hours} hours
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${degenMode ? 'bg-orange-500' : 'bg-brand'}`}
                      style={{ width: `${mod.progress}%` }}
                    />
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">What Closers Are Saying</h2>
          <p className="text-slate-400 text-sm">Real results from GOATED members</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
            >
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className={`w-3.5 h-3.5 fill-current ${degenMode ? 'text-orange-400' : 'text-brand'}`} />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.quote}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white text-sm font-semibold">{t.name}</div>
                  <div className="text-slate-500 text-xs">{t.location}</div>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  degenMode ? 'bg-orange-500/10 text-orange-400' : 'bg-brand/10 text-brand'
                }`}>
                  {t.revenue}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Whop Integration Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto mb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8"
        >
          <div className="text-center mb-6">
            <Link2 className={`w-8 h-8 mx-auto mb-3 ${degenMode ? 'text-orange-400' : 'text-brand'}`} />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Whop Integration</h2>
            <p className="text-slate-400 text-sm">Connect your Whop account to sync your membership and unlock features</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            {whopConnected ? (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand/10 border border-brand/20">
                <CheckCircle className="w-5 h-5 text-brand" />
                <span className="text-brand font-semibold text-sm">Connected to Whop</span>
              </div>
            ) : (
              <button
                onClick={() => setWhopConnected(true)}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95 ${
                  degenMode
                    ? 'bg-orange-400 text-black hover:bg-orange-300'
                    : 'bg-brand text-black hover:bg-emerald-400'
                }`}
              >
                <Link2 className="w-4 h-4" />
                Connect Your Whop Account
              </button>
            )}

            <p className="text-slate-500 text-xs text-center">
              Already a Whop member? Connect to automatically sync your tier benefits.
            </p>
          </div>

          {/* Benefits sync */}
          {whopConnected && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 pt-6 border-t border-white/5"
            >
              <h3 className="text-white font-semibold text-sm mb-3">Synced Benefits</h3>
              <div className="space-y-2">
                {[
                  { feature: 'GOATED Platform Access', unlocked: true },
                  { feature: 'AI Chat Assistant', unlocked: true },
                  { feature: 'Daily Lead Quota (50)', unlocked: true },
                  { feature: 'Community Discord', unlocked: true },
                  { feature: 'Unlimited Leads', unlocked: false },
                  { feature: 'Alpha Signals', unlocked: false },
                  { feature: '1-on-1 Coaching', unlocked: false },
                ].map((b) => (
                  <div key={b.feature} className="flex items-center gap-2 text-sm">
                    {b.unlocked ? (
                      <CheckCircle className="w-4 h-4 text-brand flex-shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    )}
                    <span className={b.unlocked ? 'text-slate-300' : 'text-slate-600'}>{b.feature}</span>
                    {!b.unlocked && (
                      <span className="text-[10px] text-slate-600 font-medium ml-auto">Pro+</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to Get GOATED?</h2>
          <p className="text-slate-400 text-sm mb-6">Stop leaving money on the table. Join the community that closes.</p>
          <a
            href="https://goated.solutions/whop"
            className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-black text-sm transition-all hover:scale-105 active:scale-95 ${
              degenMode ? 'bg-orange-400 hover:bg-orange-300' : 'bg-brand hover:bg-emerald-400'
            }`}
          >
            Join GOATED on Whop
            <ExternalLink className="w-4 h-4" />
          </a>
        </motion.div>
      </section>
    </div>
  );
}
