import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, LayoutDashboard, Bot, Users, TrendingUp, Play, Store, Dice5, Wallet, Sparkles, ArrowRight, Shield, Globe, Rocket, Crown, Star, ChevronRight } from 'lucide-react';
import GoatLogo from '../components/GoatLogo';
import { useStore } from '../hooks/useStore';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

export default function HomePage() {
  const { setPage, setAiOpen } = useStore();
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    { icon: Users, title: 'Lead Intelligence', desc: '2,500+ pre-qualified B2B leads with AI scoring, pain points, and closing scripts', page: 'leads', color: '#10b981' },
    { icon: TrendingUp, title: 'Trend Pulse', desc: 'Real-time market intelligence with 3D global heatmap visualization', page: 'trends', color: '#06b6d4' },
    { icon: Play, title: 'Live Plays', desc: 'Step-by-step playbooks with real-time deal tracking and success rates', page: 'plays', color: '#f59e0b' },
    { icon: Bot, title: 'GOATED AI', desc: 'Advanced AI overlay assistant — shits on Cluely. Multiple models. Always on.', color: '#a855f7', action: () => setAiOpen(true) },
    { icon: Store, title: 'Creator Marketplace', desc: 'Courses, tools, and creator partnerships. Launch your brand empire.', page: 'market', color: '#ec4899' },
    { icon: Dice5, title: 'Prediction Casino', desc: 'Bet on market trends, startup outcomes, and crypto plays', page: 'casino', color: '#ef4444' },
    { icon: Wallet, title: 'Multi-Chain Wallet', desc: 'ETH, SOL, MATIC — track revenue and connect MetaMask/Phantom', page: 'wallet', color: '#f97316' },
    { icon: Sparkles, title: 'AI Automation', desc: '24/7 autonomous agents for research, outreach, and qualification', page: 'dashboard', color: '#8b5cf6' },
  ];

  const stats = [
    { value: '2,500+', label: 'Qualified Leads', icon: Users },
    { value: '$4.2M', label: 'Pipeline Value', icon: Wallet },
    { value: '34%', label: 'Win Rate', icon: TrendingUp },
    { value: '94%', label: 'AI Accuracy', icon: Bot },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <motion.section className="relative px-6 pt-16 pb-20" initial="hidden" animate="visible" variants={stagger}>
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(16,185,129,0.4) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
          <motion.div variants={fadeUp}>
            {/* Version badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm mb-8"
              whileHover={{ scale: 1.05 }}
            >
              <Zap size={16} />
              <span className="font-medium">v3.0 — The Degen Business OS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.05] mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-brand via-emerald-300 to-cyan-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                FROM ZERO
              </span>
              <br />
              <span className="text-white">TO CEO</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-slate-400 max-w-lg mb-4 leading-relaxed">
              AI-powered revenue intelligence for the next generation. 2,500+ leads, autonomous agents, and the most fire overlay tool Gen Z has ever built.
            </p>
            <p className="text-sm text-slate-500 mb-8">
              Built for degens, creators, and startup founders who want to snipe deals and stack racks.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-12">
              <motion.button
                onClick={() => setPage('dashboard')}
                className="flex items-center gap-3 px-8 py-4 rounded-xl bg-brand text-black font-bold text-lg neon-border"
                whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(16,185,129,0.5)' }}
                whileTap={{ scale: 0.98 }}
              >
                <LayoutDashboard size={22} />Enter Dashboard
                <ArrowRight size={18} />
              </motion.button>
              <motion.button
                onClick={() => setAiOpen(true)}
                className="flex items-center gap-3 px-8 py-4 rounded-xl bg-surface-2 text-white font-semibold text-lg border border-white/10 hover:border-brand/30"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Bot size={22} />Try GOATED AI
              </motion.button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-white/5">
              {stats.map((s, i) => (
                <motion.div key={i} variants={fadeUp} className="group">
                  <div className="text-2xl lg:text-3xl font-black text-brand group-hover:animate-pulse-neon">{s.value}</div>
                  <div className="text-sm text-slate-500 flex items-center gap-1.5 mt-1"><s.icon size={14} />{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 3D Goat */}
          <motion.div className="flex justify-center lg:justify-end" variants={fadeUp} style={{ animation: 'floatSlow 6s ease-in-out infinite' }}>
            <GoatLogo size={400} />
          </motion.div>
        </div>
      </motion.section>

      {/* Features Grid */}
      <section className="px-6 py-20 bg-surface-1/40">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">Core Features</h2>
            <p className="text-slate-400 text-lg">Everything you need to dominate B2B sales and the creator economy</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.button
                key={i}
                onClick={() => f.action ? f.action() : f.page && setPage(f.page)}
                className="bg-surface-3 rounded-xl p-5 text-left border border-white/5 card-hover group relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${f.color}10 0%, transparent 70%)` }} />
                <div className="relative">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors duration-300"
                    style={{ background: `${f.color}15`, color: f.color }}>
                    <f.icon size={20} />
                  </div>
                  <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Overlay Promo - Retro 80s style */}
      <section className="px-6 py-20 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.05) 0%, rgba(16,185,129,0.05) 50%, rgba(6,182,212,0.05) 100%)' }} />
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            className="rounded-2xl border border-brand/20 p-8 lg:p-12 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(15,23,42,0.95) 50%, rgba(168,85,247,0.08) 100%)' }}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-2xl neon-border" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider mb-4">
                  <Crown size={14} />OUT NOW — JUST RELEASED
                </div>
                <h2 className="text-4xl lg:text-5xl font-black mb-4">
                  <span className="bg-gradient-to-r from-brand via-purple-400 to-cyan-400 bg-clip-text text-transparent">GOATED</span>
                  {' '}OVERLAY
                </h2>
                <p className="text-xl text-slate-300 mb-3">The AI overlay that <span className="text-brand font-bold">shits on Cluely</span></p>
                <p className="text-slate-400 mb-6 leading-relaxed">
                  Desktop always-on AI assistant with real-time page analysis, deal sniping, headline summaries, automated insights, and the best LLM interface Gen Z has ever coded. Multiple AI models. Keyboard-driven. Widget-based UI. 3D goat included.
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  {['Real-time Analysis', 'Deal Sniping', 'Multiple AI Models', 'Widget UI', 'Keybind Driven', '3D Canvas'].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-300">{tag}</span>
                  ))}
                </div>
                <div className="flex gap-4">
                  <motion.button
                    onClick={() => setAiOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand to-emerald-400 text-black font-bold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Rocket size={18} />Launch Overlay
                  </motion.button>
                  <motion.button
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium"
                    whileHover={{ scale: 1.05 }}
                  >
                    Learn More <ChevronRight size={16} />
                  </motion.button>
                </div>
              </div>

              {/* Retro promo card */}
              <div className="relative">
                <div className="bg-surface-0 rounded-xl border border-brand/30 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-brand text-black text-xs font-black uppercase tracking-wider rounded-bl-xl">
                    LIVE NOW
                  </div>
                  <div className="flex justify-center mb-4 pt-4">
                    <GoatLogo size={120} />
                  </div>
                  <div className="text-center mb-4">
                    <div className="text-2xl font-black mb-1">GOATED AI v1</div>
                    <div className="text-sm text-slate-400">Custom LLM  trained on deal data</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {['Snipes racks in real-time', 'Page analysis + context awareness', 'Lead scoring + outreach generation', 'Beats every normie AI tool'].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-300">
                        <Star size={14} className="text-brand flex-shrink-0" />{f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gen Z / Youth Section */}
      <section className="px-6 py-16 bg-surface-1/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Built by Gen Z. <span className="text-brand">For Gen Z.</span>
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              We're not your dad's CRM. GOATED is the first business OS built for the generation that grew up on Discord,
              turned memes into businesses, and believes AI should do the boring work. Whether you're a creator, founder,
              or degen — this is your command center.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['No-code setup', 'AI-first', 'Community driven', 'Meme-worthy UI', 'Built different'].map(tag => (
                <span key={tag} className="px-5 py-2.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm font-medium">{tag}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="text-4xl lg:text-5xl font-black mb-4">Ready to go <span className="text-brand">GOATED</span>?</h2>
            <p className="text-xl text-slate-400 mb-8">Join 2,500+ leads in your pipeline. Start closing today.</p>
            <motion.button
              onClick={() => setPage('dashboard')}
              className="px-12 py-5 rounded-xl bg-brand text-black font-bold text-xl neon-border"
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(16,185,129,0.6)' }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Free <ArrowRight className="inline ml-2" size={22} />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
