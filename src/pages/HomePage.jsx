import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, LayoutDashboard, Bot, Users, TrendingUp, Wallet, ArrowRight, Shield, Globe, Rocket, Crown, ChevronRight, BarChart3, Target, Flame, CheckCircle2, ArrowDown, Cpu, Activity, DollarSign, Gauge, Phone, MessageSquare, Mic, Headphones, Send, Radio, Sparkles, Eye, Lock, Crosshair, Layers, Building2, Code2, Star, Briefcase, ShoppingBag, ExternalLink, Trophy, Dice1, Swords, CircleDot, Megaphone, TrendingDown, Award, Gem, Zap as ZapIcon, Calendar } from 'lucide-react';
import GoatLogo from '../components/GoatLogo';
import { GoatIcon } from '../components/GoatLogo';
import { useStore } from '../hooks/useStore';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ── Scroll-triggered animation hook ──────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [isVisible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, isVisible];
}

// ── Mouse-tracking parallax hook ─────────────────────────────────────────────
function useMouseParallax() {
  const ref = useRef(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, mouseX: 0, mouseY: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleMove = (e) => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        setTransform({ rotateX: -dy * 8, rotateY: dx * 8, mouseX: e.clientX, mouseY: e.clientY });
        rafRef.current = null;
      });
    };
    const handleLeave = () => setTransform({ rotateX: 0, rotateY: 0, mouseX: 0, mouseY: 0 });
    el.addEventListener('mousemove', handleMove, { passive: true });
    el.addEventListener('mouseleave', handleLeave, { passive: true });
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
  return [ref, transform];
}

// ── Floating Particles removed — was O(n²) connection lines per frame, tanked homepage perf ──

// HomepageAIDemo deleted — it was defined but never rendered, so it shipped as
// nothing and was tree-shaken out. Worth removing rather than leaving: it held
// four hardcoded "AI" responses with invented leads and benchmarks, and the next
// person to find it would reasonably assume it was live.
//
// The homepage's real AI surface is the button that opens AIOverlay, which hits
// /api/chat and is agentic.


// useLiveCounter removed — was faking incrementing user counts

// ── Staggered Card Animation Wrapper ─────────────────────────────────────────
function StaggeredCards({ children, className = '' }) {
  const [ref, isVisible] = useScrollReveal(0.1);
  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, i) => (
        <div
          className="transition-all duration-700 ease-out"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
            transitionDelay: `${i * 80}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// ── Glow Button Component ────────────────────────────────────────────────────
function GlowButton({ children, onClick, className = '', color = 'brand', variant = 'primary' }) {
  const colorMap = {
    brand: { bg: 'bg-brand', glow: 'rgba(16,185,129,0.6)', gradient: 'from-brand to-emerald-400', text: 'text-black' },
    orange: { bg: 'bg-orange-500', glow: 'rgba(249,115,22,0.6)', gradient: 'from-orange-500 to-red-500', text: 'text-white' },
    cyan: { bg: 'bg-cyan-500', glow: 'rgba(6,182,212,0.6)', gradient: 'from-cyan-400 to-blue-500', text: 'text-black' },
    pink: { bg: 'bg-pink-500', glow: 'rgba(236,72,153,0.6)', gradient: 'from-pink-500 to-purple-500', text: 'text-white' },
  };
  const c = colorMap[color] || colorMap.brand;

  if (variant === 'secondary') {
    return (
      <motion.button
        onClick={onClick}
        className={`relative group flex items-center gap-3 px-8 py-4 rounded-xl bg-black/30 backdrop-blur-sm text-white font-semibold text-lg border border-white/[0.05] overflow-hidden ${className}`}
        whileHover={{ scale: 1.03, borderColor: 'rgba(16,185,129,0.3)' }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-brand/10 to-transparent" />
        <span className="relative">{children}</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      className={`relative group flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r ${c.gradient} ${c.text} font-bold text-lg overflow-hidden ${className}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      style={{ boxShadow: `0 0 0px ${c.glow}` }}
    >
      <motion.div
        className="absolute inset-0 rounded-xl"
        initial={false}
        whileHover={{
          boxShadow: `0 0 40px ${c.glow}, inset 0 0 20px rgba(255,255,255,0.1)`,
        }}
        transition={{ duration: 0.3 }}
      />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]" style={{ transition: 'transform 0.6s ease' }} />
      <span className="relative flex items-center gap-3">{children}</span>
    </motion.button>
  );
}

// ── Partner Logos ────────────────────────────────────────────────────────────
function PartnerLogo({ name, color }) {
  return (
    <motion.div
      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] group hover:border-white/[0.08] transition-all duration-300"
      whileHover={{ scale: 1.05, y: -2 }}
    >
      <div className="w-3 h-3 rounded-full" style={{ background: color }} />
      <span className="text-sm font-semibold text-slate-400 group-hover:text-white transition-colors">{name}</span>
    </motion.div>
  );
}


export default function HomePage() {
  // Selective selectors — HomePage stays snappy even if store mutates elsewhere.
  const setPage = useStore(s => s.setPage);
  const setAiOpen = useStore(s => s.setAiOpen);
  const setAccountModalOpen = useStore(s => s.setAccountModalOpen);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  // Removed fake live counters — no more lying about platform activity

  // Mouse-tracking parallax for hero
  const [heroRef, heroTransform] = useMouseParallax();

  const parallaxRef1 = useRef(null);
  const parallaxRef2 = useRef(null);
  const parallaxRef3 = useRef(null);
  const scrollRafRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      if (scrollRafRef.current) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (parallaxRef1.current) parallaxRef1.current.style.transform = `translateY(${y * 0.1}px)`;
        if (parallaxRef2.current) parallaxRef2.current.style.transform = `translateY(${y * -0.05}px)`;
        if (parallaxRef3.current) parallaxRef3.current.style.transform = `translateY(${y * 0.08}px)`;
        scrollRafRef.current = null;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, []);

  const features = [
    { icon: Phone, title: 'AI Voice Agent', desc: 'Picks up missed calls in under 60 seconds. Qualifies the lead, books the appointment, texts you a transcript. Industry-tuned for HVAC, dental, plumbing, med spas. Live in 14 days.', page: 'leads', color: '#f59e0b', stats: 'Sub-60s pickup' },
    { icon: Award, title: 'Revenue Audit', desc: 'Free, public, shareable. Enter your URL — in 15 seconds we show how much call/booking revenue you\'re leaking. Ammunition for the call. Funnel for the close.', page: 'audit', color: '#10b981', stats: 'Free' },
    { icon: Bot, title: 'SMS Auto-Text-Back', desc: 'Every missed call triggers a 30-second follow-up text. Two-way conversation routed to your phone. Recovers 30-50% of missed call revenue automatically.', color: '#a855f7', action: () => setAiOpen(true), stats: 'Auto-recovery' },
    { icon: Users, title: 'Reactivation Campaigns', desc: 'Mine your dormant customer list — anyone who hasn\'t been in for 6+ months. AI-personalized outreach across voice, SMS, email. We take 15% of recovered revenue, no monthly retainer.', page: 'leads', color: '#10b981', stats: 'Performance-only' },
    // These three used to point at TrendPulse and Wallet. Both are disabled, so
    // the store's gate bounced the visitor silently back to Home — the card
    // looked broken. Repointed at surfaces that exist and actually follow on
    // from the copy.
    { icon: TrendingUp, title: 'Review Engine', desc: 'Auto-requests Google reviews from happy customers at the optimal moment (4-24 hr post-job). Adds 10-15 five-star reviews per month. Tops local search in 6 months.', page: 'audit', cta: 'Check your site', color: '#06b6d4', stats: '+15 reviews/mo' },
    { icon: Globe, title: 'Custom AI Builds', desc: 'For $10K+ deposits: AI receptionist OS, multi-location brain, custom RAG agents trained on your data, owner copilot in Slack/SMS. Built on the GOATED stack.', action: () => setAiOpen(true), cta: 'Scope a build', color: '#ef4444', stats: 'Custom scope' },
    { icon: Wallet, title: '30-Day Refund', desc: 'Real risk-reversal. If we don\'t deliver measurable results in 30 days, every dollar back. No long-term contracts, no setup retention. Aligns our incentives with yours.', page: 'audit', cta: 'Start with a free audit', color: '#06b6d4', stats: 'Money-back' },
    { icon: BarChart3, title: 'Command Center', desc: 'Pipeline + activations + commission split + TCPA compliance logs. One dashboard. Daily close-rate, weekly revenue. Zero noise.', page: 'dashboard', color: '#8b5cf6', stats: 'One view' },
  ];

  const stats = [
    { value: '250', suffix: 'K+', label: 'Leads Scored', icon: Users },
    { value: 'LIVE', suffix: '', label: 'Real-Time Alpha Plays', icon: Activity },
    { value: 'AI', suffix: '', label: 'AI-Powered Closing', icon: Bot },
    { prefix: '$', value: '0', suffix: '', label: 'Platform Fee', icon: Shield },
  ];

  const outreachMethods = [
    { icon: Phone, title: 'Warm-Dial Playbook', desc: 'We write the scripts + objection maps + dial windows. You bring your own number (OpenPhone, Dialpad, Google Voice) — we route you through our close-flow with real-time AI coaching in-app.', color: '#10b981' },
    { icon: MessageSquare, title: 'SMS Sequences', desc: 'AI-personalized sequences with send-window optimization. Plug in your own A2P-registered Twilio/OpenPhone number — we generate the copy, track replies, and auto-advance the pipeline.', color: '#06b6d4' },
    { icon: Mic, title: 'LinkedIn Outreach', desc: 'Connection requests, follow-ups, and reply triggers — all AI-personalized per lead. Wire your own LinkedIn via Unipile. We keep you under daily action caps so your account never gets flagged.', color: '#a855f7' },
    { icon: Headphones, title: 'Call Analysis', desc: 'Real-time transcription, objection detection, and coaching. AI scores every call and tells you exactly how to close harder.', color: '#f59e0b' },
    { icon: Send, title: 'Social DMs', desc: 'Automated LinkedIn and Twitter outreach with personalized messaging at scale. Skip the gatekeeper, go straight to the whale.', color: '#ec4899' },
    { icon: Radio, title: 'Network Signals', desc: 'Real-time job change alerts, funding announcements, and trigger events. Ape into the deal at the perfect moment.', color: '#ef4444' },
  ];

  // Competitor comparison removed — we don't name-drop. The OS stands on its own.

  // No pricing tiers — platform is 100% free, commission-only model

  return (
    <div className="min-h-screen overflow-hidden">
      {/* ═══ HERO — with mouse-tracking parallax + floating particles ═══ */}
      <motion.section className="relative px-6 pt-12 sm:pt-16 pb-20" initial="hidden" animate="visible" variants={stagger}>
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div ref={parallaxRef1} className="absolute top-20 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-3xl will-change-transform" />
          <div ref={parallaxRef2} className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl will-change-transform" />
          <div ref={parallaxRef3} className="absolute top-40 right-10 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl will-change-transform" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.02]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(16,185,129,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>

        {/* Particles removed for performance */}

        {/* Mouse-tracking gradient orbs */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.06] pointer-events-none transition-transform duration-1000 ease-out"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)',
            left: heroTransform.mouseX ? heroTransform.mouseX - 200 : '50%',
            top: heroTransform.mouseY ? heroTransform.mouseY - 200 : '50%',
          }}
        />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative" style={{ zIndex: 1 }}>
          <motion.div variants={fadeUp}>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <motion.div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400 text-xs" whileHover={{ scale: 1.05 }}>
                <Phone size={12} />
                <span className="font-semibold">Voice · SMS · LinkedIn · Zero Email</span>
              </motion.div>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] mb-6 tracking-tight">
              <span className="text-white">You're losing</span>
              <br />
              <span className="relative">
                <span className="bg-gradient-to-r from-brand via-emerald-300 to-cyan-400 bg-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text' }}>
                  $18K a month
                </span>
                <motion.span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-brand to-cyan-400 rounded-full" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 0.6 }} />
              </span>
              <br />
              <span className="text-white">in revenue you'll never see.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-lg mb-4 leading-relaxed">
              Probably <span className="text-white font-semibold">the greatest thing that&apos;s ever happened to small business.</span> We&apos;re serious. Drop your URL, we crawl it, surface every leak, price the fix — then we run the outreach until the phone rings. <span className="text-white font-semibold">Pay only when a deal actually closes.</span> Anything less would be criminal.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-8">
              <span className="flex items-center gap-1.5"><Shield size={14} className="text-brand" />Free forever</span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1.5"><DollarSign size={14} className="text-brand" />$0 until money lands</span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1.5"><Phone size={14} className="text-brand" />AI calls. No email.</span>
            </div>

            <div className="flex flex-wrap gap-4 mb-10">
              <GlowButton onClick={() => setPage('audit')} color="brand">
                <Sparkles size={22} />Run free audit<ArrowRight size={18} />
              </GlowButton>
              <GlowButton onClick={() => setPage('leads')} variant="secondary">
                <Target size={22} className="text-brand" />Explore the platform
              </GlowButton>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-8 border-t border-white/[0.03]">
              {stats.map((s, i) => (
                <motion.div key={i} variants={fadeUp} className="group">
                  <div className="text-2xl lg:text-3xl font-black text-brand group-hover:text-emerald-300 transition-colors">{s.prefix || ''}{s.value}{s.suffix}</div>
                  <div className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1"><s.icon size={14} />{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Hero right — 3D tilt GoatLogo */}
          <motion.div className="flex justify-center lg:justify-end relative" variants={fadeUp}>
            <div
              ref={heroRef}
              className="relative cursor-default"
              style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d',
              }}
            >
              <div
                style={{
                  transform: `rotateX(${heroTransform.rotateX}deg) rotateY(${heroTransform.rotateY}deg)`,
                  transition: 'transform 0.15s ease-out',
                  transformStyle: 'preserve-3d',
                  animation: 'floatSlow 6s ease-in-out infinite',
                }}
              >
                <GoatLogo size={typeof window !== 'undefined' && window.innerWidth < 640 ? 220 : 380} />
                {/* 3D depth shadow */}
                <div
                  className="absolute inset-0 rounded-full blur-3xl opacity-20"
                  style={{
                    background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)',
                    transform: `translateZ(-50px) translateX(${heroTransform.rotateY * 2}px) translateY(${-heroTransform.rotateX * 2}px)`,
                  }}
                />
              </div>
            </div>
            <motion.div className="absolute top-10 left-4 sm:left-10 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur border border-white/[0.05] text-xs font-medium text-slate-300 flex items-center gap-1.5" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Cpu size={12} className="text-brand" />AI-Powered
            </motion.div>
            <motion.div className="absolute bottom-20 right-4 sm:right-10 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur border border-white/[0.05] text-xs font-medium text-slate-300 flex items-center gap-1.5" animate={{ y: [0, 8, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}>
              <Activity size={12} className="text-cyan-400" />Real-time
            </motion.div>
            <motion.div className="absolute top-1/2 left-0 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur border border-brand/20 text-xs font-medium text-brand flex items-center gap-1.5" animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }}>
              <Flame size={12} />GOATED
            </motion.div>
          </motion.div>
        </div>

        <motion.div className="flex flex-col items-center mt-12 text-slate-600" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <span className="text-xs mb-1">Scroll to explore</span>
          <ArrowDown size={16} />
        </motion.div>
      </motion.section>

      {/* ═══ SOCIAL PROOF — horizontal B2B capabilities ═══ */}
      <section className="px-6 py-5 border-y border-white/[0.03] bg-surface-1/20">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-6 sm:gap-10 items-center text-sm text-slate-500">
          {[
            { icon: Phone,    label: 'AI voice calls (Vapi)' },
            { icon: MessageSquare, label: 'SMS follow-up (Twilio)' },
            { icon: Users,    label: 'LinkedIn DMs (compliance-aware)' },
            { icon: Shield,   label: 'TCPA + DNC baked in' },
            { icon: Wallet,   label: 'Stripe Connect — instant payouts' },
          ].map((t, i) => {
            const I = t.icon;
            return (
              <div key={i} className="flex items-center gap-2"><I size={14} className="text-brand" /><span>{t.label}</span></div>
            );
          })}
        </div>
      </section>

      {/* ═══ DEGEN MODE — default-on ═══ */}
      {/* NOTE: keep this section in sync with Sidebar toggle name and TrendsPage copy */}
      <section className="px-6 py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.03) 0%, rgba(239,68,68,0.02) 50%, rgba(0,0,0,0) 100%)' }} />
        <div className="absolute top-10 right-10 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-red-500/5 rounded-full blur-3xl" style={{ animation: 'pulse 4s ease-in-out infinite 1s' }} />

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            className="rounded-2xl border border-orange-500/30 p-8 sm:p-10 lg:p-12 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.06) 0%, rgba(0,0,0,0.95) 40%, rgba(239,68,68,0.04) 100%)' }}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: '0 0 60px rgba(249,115,22,0.1), inset 0 0 60px rgba(249,115,22,0.02)' }} />

            <div className="relative">
              {/* Header */}
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30">
                  <Flame size={16} className="text-orange-400" />
                  <span className="text-orange-400 text-xs font-black uppercase tracking-widest">DEGEN MODE</span>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-slate-400 text-xs font-mono">Press <kbd className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold mx-0.5">Shift+D</kbd> to activate</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <span className="text-orange-300 text-[10px] font-black uppercase tracking-widest">Free with account</span>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-4 mb-4">
                <span className="bg-gradient-to-r from-orange-400 via-red-400 to-orange-500 bg-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text' }}>
                  Wolf mode is on by default.
                </span>
              </h2>
              <p className="text-lg text-slate-400 max-w-3xl mb-8">
                You showed up, you&apos;re already a wolf. Every push notification, every play, every script is tuned for aggression. Need a breather? Flip to CHILL and the same engine runs — quieter. Most never touch it.
              </p>

              {/* Wolf toolkit row */}
              <div className="mb-8">
                <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Eye size={14} />What&apos;s always on in Wolf</h3>
                <StaggeredCards className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: Crosshair, label: 'AI Alpha Plays', desc: 'Market moves get turned into entry / target / stop, pushed live to your radar.', color: '#f97316' },
                    { icon: Activity, label: 'Live Close Feed', desc: 'Real-time ticker of deals being closed across the OS. Watch the money move.', color: '#10b981' },
                    { icon: Trophy, label: 'Closer Leaderboard', desc: 'Top earners ranked live. Community-driven fire under every login.', color: '#f59e0b' },
                    { icon: Eye, label: 'Push Alerts', desc: 'Browser + mobile notifications the second a play or a lead heats up.', color: '#ef4444' },
                  ].map((item, i) => (
                    <div key={i} className="bg-black/60 backdrop-blur rounded-xl p-4 border border-orange-500/10 group hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${item.color}15`, color: item.color }}>
                        <item.icon size={20} />
                      </div>
                      <div className="font-bold text-white text-sm mb-1 group-hover:text-orange-400 transition-colors">{item.label}</div>
                      <div className="text-xs text-slate-500 leading-relaxed">{item.desc}</div>
                    </div>
                  ))}
                </StaggeredCards>
              </div>

              {/* CTA */}
              <div className="flex flex-wrap items-center gap-4">
                <GlowButton onClick={() => setPage('leads')} color="orange">
                  <Flame size={20} />Start Closing<ArrowRight size={18} />
                </GlowButton>
                <span className="text-sm text-slate-500">Toggle Wolf / Chill with <kbd className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold text-xs mx-1">Shift+D</kbd></span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>


      {/* ═══ 3 PILLARS / ELEVATOR PITCH ═══ */}
      <section className="px-6 py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand/[0.02] to-transparent" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-brand text-sm font-bold uppercase tracking-widest">Three pillars. One operating system. Zero subscription.</span>
            <h2 className="text-3xl lg:text-5xl font-black mt-3 mb-5 leading-tight">
              The money OS. <span className="text-brand">Built for the ones who actually move.</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed mb-8">
              Everything that used to be scattered across ten tabs and ten subscriptions — market intel, targets, scripts, payouts — collapsed into one OS. You don&apos;t pay until a deal closes. Every win routes to your Master Wallet. The engine never sleeps.
            </p>
          </motion.div>

          <StaggeredCards className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <button onClick={() => setPage('trends')} className="text-left p-6 rounded-2xl bg-black/40 border border-orange-500/20 hover:border-orange-500/50 transition-all duration-300 group hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-2"><Flame size={16} className="text-orange-400" /><span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Pillar 01</span></div>
              <div className="text-2xl font-black text-orange-400 mb-1">ALPHA RADAR</div>
              <div className="text-sm text-slate-400 leading-snug">Globe view of every market. AI turns moves into plays — entry, target, stop. Push alerts when the opportunity hits.</div>
              <div className="text-[11px] text-orange-300/70 mt-3 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Scan live <ArrowRight size={12} /></div>
            </button>
            <button onClick={() => setPage('leads')} className="text-left p-6 rounded-2xl bg-black/40 border border-brand/20 hover:border-brand/50 transition-all duration-300 group hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-2"><Target size={16} className="text-brand" /><span className="text-[10px] font-black uppercase tracking-widest text-brand">Pillar 02</span></div>
              <div className="text-2xl font-black text-brand mb-1">CLOSER OS</div>
              <div className="text-sm text-slate-400 leading-snug">Per-vertical playbooks for HVAC, dental, plumbing, med spa, roofing, chiro. Scripts, objection handlers, audit ammunition. Built for solo dialers and small agency teams.</div>
              <div className="text-[11px] text-emerald-300/70 mt-3 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Open pipeline <ArrowRight size={12} /></div>
            </button>
            <button onClick={() => setPage('wallet')} className="text-left p-6 rounded-2xl bg-black/40 border border-cyan-400/20 hover:border-cyan-400/50 transition-all duration-300 group hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-2"><Wallet size={16} className="text-cyan-400" /><span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Pillar 03</span></div>
              <div className="text-2xl font-black text-cyan-400 mb-1">STRIPE PAYMENTS</div>
              <div className="text-sm text-slate-400 leading-snug">Every deposit and retainer collected via Stripe Payment Links. Funds in your bank in 2 days. No long-term contracts. Tier 1: $2K + $750/mo. Tier 2: $10-20K + $2.5-5K/mo.</div>
              <div className="text-[11px] text-cyan-300/70 mt-3 flex items-center gap-1 group-hover:translate-x-1 transition-transform">See payouts <ArrowRight size={12} /></div>
            </button>
          </StaggeredCards>
        </div>
      </section>

      {/* ═══ FEATURES GRID — staggered entrance ═══ */}
      <section className="px-6 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-brand text-sm font-bold uppercase tracking-widest">Core Platform</span>
            <h2 className="text-3xl lg:text-4xl font-black mt-2 mb-3">8 Modules. <span className="text-brand">All Killer. No Filler.</span></h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Every weapon you need to find whales, reach decision makers, and close fat bags — in one AI-native platform. This is the whole goddamn arsenal.</p>
          </motion.div>
          <StaggeredCards className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.button key={i} onClick={() => f.action ? f.action() : f.page && setPage(f.page)}
                className="bg-black/40 backdrop-blur-sm rounded-xl p-5 text-left border border-white/[0.03] group relative overflow-hidden hover:border-white/[0.08] transition-all duration-300 hover:-translate-y-1 min-h-[200px] flex flex-col"
                onMouseEnter={() => setHoveredFeature(i)} onMouseLeave={() => setHoveredFeature(null)}
                whileTap={{ scale: 0.98 }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 0%, ${f.color}10 0%, transparent 70%)` }} />
                <div className="relative flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg flex-shrink-0" style={{ background: `${f.color}15`, color: f.color, boxShadow: hoveredFeature === i ? `0 0 20px ${f.color}30` : 'none' }}><f.icon size={20} /></div>
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">{f.stats}</span>
                  </div>
                  <h3 className="font-bold text-white mb-1.5 group-hover:text-brand transition-colors">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-3 flex-1">{f.desc}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-brand transition-colors mt-auto"><span>{f.cta || 'Explore'}</span><ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" /></div>
                </div>
              </motion.button>
            ))}
          </StaggeredCards>
        </div>
      </section>

      {/* ═══ DIRECT OUTREACH SUITE ═══ */}
      <section className="px-6 py-16 sm:py-20 bg-surface-1/30">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-yellow-400 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"><Phone size={16} />Outreach Playbook</span>
            <h2 className="text-3xl lg:text-4xl font-black mt-2 mb-3">Email is Dead. <span className="text-yellow-400">Go Direct.</span></h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Scripts, sequences, coaching. You bring your own number + LinkedIn — we run the play. Warm dials, AI-written SMS, LinkedIn triggers. Skip the gatekeeper, talk to the decision-maker.</p>
          </motion.div>
          <StaggeredCards className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {outreachMethods.map((m, i) => (
              <div key={i} className="bg-black/40 backdrop-blur rounded-xl p-6 border border-white/[0.03] group hover:border-white/[0.06] hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: `${m.color}15`, color: m.color }}><m.icon size={20} /></div>
                  <h3 className="font-bold text-white group-hover:text-brand transition-colors">{m.title}</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </StaggeredCards>
        </div>
      </section>

      {/* ═══ DEGEN ALPHA SECTION ═══ */}
      <section className="px-6 py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.02) 0%, rgba(239,68,68,0.02) 50%, rgba(168,85,247,0.02) 100%)' }} />
        <div className="max-w-7xl mx-auto relative">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-orange-400 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"><Flame size={16} />WHY GOATED WINS</span>
            <h2 className="text-3xl lg:text-5xl font-black mt-2 mb-3">Built For Owners. <span className="text-orange-400">Not Vendors.</span></h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Most AI agencies sell vapor. We deliver in 14 days, guarantee results in 30, and align our incentives with yours. Texas-built, owner-operated, brand-first.</p>
          </motion.div>

          <StaggeredCards className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {[
              { emoji: '\u{1F4DE}', title: 'Sub-60s Pickup', desc: 'AI answers your missed calls in under 60 seconds. Customer hears a natural voice, gets qualified, books appointment. Owner gets a transcript. No more voicemail black hole.', stat: '<60s', label: 'AI pickup time' },
              { emoji: '\u{1F4B5}', title: '14-Day Deploy', desc: 'Most AI agencies promise the moon and ship in 6 months. We deliver Tier 1 in 14 days — voice agent live, SMS automation running, review engine seeded. ROI before the next bill.', stat: '14d', label: 'To live' },
              { emoji: '\u{1F4DD}', title: '30-Day Refund', desc: 'No long-term contracts. If we don\'t deliver measurable results in 30 days, every dollar back. Real risk-reversal. We only stay paid if we keep performing.', stat: '30d', label: 'Money-back' },
              { emoji: '\u{1F4CA}', title: 'Vertical Playbooks', desc: 'HVAC, dental, plumbing, med spa, roofing, chiro. Each has a tailored voice script, objection handlers, integration patterns. We don\'t generalize. We specialize.', stat: '6+', label: 'Verticals deep' },
              { emoji: '\u{1F4C8}', title: 'Compounding Wins', desc: 'Tier 1 captures the calls. Day 30 upsell adds review engine, GMB, reactivation. Day 90 owner copilot. Average client grows from $750/mo to $2,200/mo by month 6.', stat: '3x', label: 'Revenue/client by m6' },
              { emoji: '\u26A1', title: 'Owner-Operated', desc: 'Texas-built. Bootstrapped. Single founder dialing 100x/day. The brand speaks. We deliver what other agencies promise. No fluff, no LinkedIn theater, no monthly drain.', stat: '0%', label: 'VC funded' },
            ].map((item, i) => (
              <div key={i} className="bg-black/40 backdrop-blur rounded-xl p-6 border border-white/[0.03] group hover:border-orange-500/20 transition-all duration-300 relative overflow-hidden hover:-translate-y-1">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(249,115,22,0.05) 0%, transparent 70%)' }} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="text-right">
                      <div className="text-lg font-black text-orange-400">{item.stat}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</div>
                    </div>
                  </div>
                  <h3 className="font-bold text-white mb-1.5 group-hover:text-orange-400 transition-colors">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </StaggeredCards>

          <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex flex-col items-center gap-4 p-6 rounded-2xl border border-orange-500/20 bg-orange-500/5">
              <p className="text-xl sm:text-2xl font-black text-white">The alpha is free. <span className="text-orange-400">The bags are yours. LFG.</span></p>
              <p className="text-sm text-slate-400 max-w-md">While other platforms charge $14K+/yr for basic features, GOATED gives you everything — AI, leads, market intel, predictions, direct outreach — for absolutely nothing upfront. This is the degen play of the century.</p>
              <GlowButton onClick={() => setPage('leads')} color="orange">
                <Flame size={20} />Let's Fucking Go<ArrowRight size={18} />
              </GlowButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ B2B INTELLIGENCE ═══ */}
      <section className="px-6 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-cyan-400 text-sm font-bold uppercase tracking-widest">B2B Intelligence</span>
            <h2 className="text-3xl lg:text-4xl font-black mt-2 mb-3">Know Their Shit Better <span className="text-cyan-400">Than They Do</span></h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Every lead gets AI-scored rankings, pain point breakdowns, revenue estimates, buying signals, and custom close scripts. Walk into every call knowing exactly where they're bleeding money and how you're gonna fix it.</p>
          </motion.div>
          <StaggeredCards className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Target, title: 'AI Lead Scoring', desc: '0-100 composite score with fit, intent, engagement, and timing signals. The cream rises to the top.', stat: '94', label: 'Top Score', color: '#10b981' },
              { icon: BarChart3, title: 'Deep Research', desc: 'Company financials, tech stack, hiring signals, and competitive landscape per lead. Total intel dominance.', stat: '20+', label: 'Data Sources', color: '#06b6d4' },
              { icon: Phone, title: 'Call Scripts', desc: 'AI-generated personalized scripts, objection handling, and closing frameworks. Never wing it again.', stat: '3', label: 'Approaches', color: '#a855f7' },
              { icon: Gauge, title: 'Real-time Signals', desc: 'Job changes, funding rounds, tech adoptions — ape into the deal at the perfect moment.', stat: 'LIVE', label: 'Signals', color: '#f59e0b' },
            ].map((item, i) => (
              <div key={i} className="bg-black/40 backdrop-blur rounded-xl p-5 border border-white/[0.03] group hover:border-white/[0.05] hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: `${item.color}15`, color: item.color }}><item.icon size={20} /></div>
                  <div className="text-right">
                    <div className="text-xl font-black" style={{ color: item.color }}>{item.stat}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</div>
                  </div>
                </div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </StaggeredCards>
          <motion.div className="text-center mt-8" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <GlowButton onClick={() => setPage('leads')} color="cyan" className="!inline-flex !px-6 !py-3 !text-base">
              <Users size={18} />Explore 500K+ Leads<ArrowRight size={16} />
            </GlowButton>
          </motion.div>
        </div>
      </section>

      {/* ═══ WHY GOATED — no competitor name-drops, universal ═══ */}
      <section className="px-6 py-16 sm:py-20 bg-surface-1/30">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-brand text-sm font-bold uppercase tracking-widest">Built different</span>
            <h2 className="text-3xl lg:text-4xl font-black mt-2 mb-3">The only OS that <span className="text-brand">only gets paid when you do.</span></h2>
            <p className="text-slate-400 max-w-xl mx-auto">Every other tool rents you software by the month. We bet on the outcome. Log in, find the play, close the bag, get paid. If you don&apos;t, we don&apos;t.</p>
          </motion.div>

          <motion.div className="p-6 rounded-2xl border border-brand/30 bg-brand/5 relative overflow-hidden" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="absolute inset-0 bg-gradient-to-r from-brand/5 to-transparent" />
            <div className="relative">
              <h3 className="text-xl font-black text-brand mb-4 flex items-center gap-2"><Crown size={20} /> Why it hits different</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <div className="font-bold text-white mb-1">Zero rent, all outcome</div>
                  <p className="text-sm text-slate-400">$0 upfront. You keep the majority of every closed deal — we take a small cut only when money actually moves. Exact split scoped on the audit call. Incentives are stapled to yours.</p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">One OS, every surface</div>
                  <p className="text-sm text-slate-400">Market intel, targets, scripts, wallet — one spine, one AI, one login. Stop paying ten subscriptions to do half a job.</p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Real time, always</div>
                  <p className="text-sm text-slate-400">Push alerts the second a play lights up or a lead heats up. You&apos;re never the last person to know.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ OUTCOME MODEL (pricing hidden — qualified-call only) ═══ */}
      <section className="px-6 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-brand text-sm font-bold uppercase tracking-widest">The Outcome Model</span>
            <h2 className="text-3xl lg:text-5xl font-black mt-2 mb-3">$0 Up Front. <span className="text-brand">We Eat When You Eat.</span></h2>
            <p className="text-xl text-slate-300 font-semibold mb-2">No subscriptions. No seats. No pricing-page games.</p>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">We don&apos;t show the hand on a public page. Every deal is scoped on the audit call, and the split is set at the transaction level — disclosed on the invoice, not the marketing site.</p>
          </motion.div>

          {/* Outcome tracks — Local Engine vs Growth Engine */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-10">
            {[
              { icon: Target,    title: 'Local Engine',  headline: '$2K + $750/mo', desc: 'For HVAC, dental, med spas, plumbing, roofing — anyone who loses revenue when the phone goes unanswered. AI agent answers in 60 sec, books, follows up. Setup pays for itself inside month one or we refund.', color: '#10b981', cta: { label: 'Run free audit', page: 'audit' } },
              { icon: DollarSign, title: 'Growth Engine', headline: '$10–20K + $2.5–5K/mo', desc: 'For online businesses, agencies, $1M+ SMBs. Full audit + outbound SDR + voice agent + custom build. Optional rev share on attributed revenue. Application-only — we limit slots.', color: '#f59e0b', cta: { label: 'Apply', page: 'audit' } },
            ].map((item, i) => (
              <motion.button
                key={i}
                onClick={() => setPage(item.cta.page)}
                className="bg-black/40 backdrop-blur rounded-2xl p-6 border border-white/[0.05] hover:border-brand/30 transition-all duration-300 hover:-translate-y-1 text-left flex flex-col min-h-[260px]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${item.color}15`, color: item.color }}>
                  <item.icon size={24} />
                </div>
                <div className="text-[11px] uppercase tracking-widest font-black mb-1" style={{ color: item.color }}>{item.headline}</div>
                <h3 className="font-black text-white text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4 flex-1">{item.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: item.color }}>
                  {item.cta.label}<ArrowRight size={14} />
                </span>
              </motion.button>
            ))}
          </div>

          {/* Why the model beats subscriptions */}
          <motion.div className="max-w-4xl mx-auto mb-10 p-5 rounded-xl border border-brand/20 bg-brand/5 text-center" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-sm text-brand font-bold uppercase tracking-wider mb-2">Why this model wins</p>
            <p className="text-lg text-slate-300">Other platforms charge <span className="text-red-400 font-black">$99–$14K+/yr</span> whether you close deals or not.</p>
            <p className="text-sm text-slate-500 mt-2">GOATED only gets paid if GOATED actually makes you money. If not — you never cut a check. That&apos;s the whole pitch.</p>
          </motion.div>

          {/* CTA band */}
          <motion.div className="max-w-3xl mx-auto text-center p-8 rounded-2xl border border-brand/20 bg-brand/5" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h3 className="text-2xl font-black text-white mb-3">Terms disclosed on <span className="text-brand">the audit call.</span></h3>
            <p className="text-slate-400 mb-6">Not on a public pricing page. Every split is scoped to the actual deal shape — size, sourcing, region, compliance surface. Invoices document it, not marketing copy.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <GlowButton onClick={() => setPage('audit')} color="brand">
                <Sparkles size={18} />Run free audit<ArrowRight size={16} />
              </GlowButton>
              <GlowButton onClick={() => setPage('leads')} variant="secondary">
                <Target size={18} className="text-brand" />Explore the platform
              </GlowButton>
            </div>
          </motion.div>
        </div>
      </section>


      {/* ═══ FINAL CTA ═══ */}
      <section className="px-6 py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[120px]" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <div className="mb-6"><GoatLogo size={80} /></div>
            <h2 className="text-4xl lg:text-6xl font-black mb-4">Find your leak. <span className="text-brand">Prove it in 15 seconds.</span></h2>
            <p className="text-xl text-slate-400 mb-4 max-w-2xl mx-auto">Look — Apollo is overpriced, cold email died three cycles ago, and SDR agencies charge $8K/mo to send the same template twice. We just built the fix. Ours only bills you when <span className="text-white font-semibold">cash lands in your account.</span> Try not to feel too lucky.</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500 mb-8">
              <span>Free forever</span>
              <span className="text-slate-700">|</span>
              <span>$0 until money lands</span>
              <span className="text-slate-700">|</span>
              <span>Instant Stripe Connect payouts</span>
              <span className="text-slate-700">|</span>
              <span>TCPA-compliant by default</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <GlowButton onClick={() => setPage('audit')} color="brand" className="!px-12 !py-5 !text-xl">
                Run the free audit <ArrowRight className="inline ml-2" size={22} />
              </GlowButton>
              <GlowButton onClick={() => setPage('leads')} variant="secondary" className="!px-8 !py-5 !text-xl">
                <Target className="inline mr-2" size={22} />See the leads engine
              </GlowButton>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1"><Flame size={12} className="text-orange-400" />Wolf / Chill: Shift+D</span>
              <span className="flex items-center gap-1"><Bot size={12} className="text-brand" />AI Chat: G</span>
              <span className="flex items-center gap-1"><Zap size={12} className="text-cyan-400" />Search: Cmd+K</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="px-6 py-8 border-t border-white/[0.03]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <GoatIcon className="w-5 h-5" />
            <span className="font-bold text-slate-400">GOATED Solutions</span>
            <span>v7.1 — Revenue Intelligence OS</span>
          </div>
          <div className="flex gap-6">
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Terms</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Contact</span>
            <span onClick={() => setAccountModalOpen(true)} className="hover:text-brand transition-colors cursor-pointer font-medium">Partner Program</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
