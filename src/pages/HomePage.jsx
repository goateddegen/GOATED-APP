import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, LayoutDashboard, Bot, Users, TrendingUp, Wallet, ArrowRight, Shield, Globe, Rocket, Crown, ChevronRight, BarChart3, Target, Flame, CheckCircle2, ArrowDown, Cpu, Activity, DollarSign, Gauge, Phone, MessageSquare, Mic, Headphones, Send, Radio } from 'lucide-react';
import GoatLogo from '../components/GoatLogo';
import { GoatIcon } from '../components/GoatLogo';
import { useStore } from '../hooks/useStore';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ── Sandboxed AI Demo Chat for Homepage ──────────────────────────────────────
const DEMO_RESPONSES = {
  'leads': "Found **3 hot leads** with rising momentum:\n\n1. **Mike Chen** at Pinnacle Dental — Score: 94, Deal: $85K\n   Pain: Lead quality issues. Just hired a marketing director.\n2. **Sarah Kim** at TechFlow — Score: 91, Deal: $120K\n   Pain: Scaling outreach. Evaluating competitors.\n3. **James Park** at Vertex AI — Score: 88, Deal: $95K\n   Pain: Pipeline visibility. Decision in 2 weeks.\n\nWant me to draft outreach for any of these?",
  'market': "**Market Pulse — Live**\n\nBTC: $67,420 (+2.3%)\nETH: $3,285 (+1.8%)\nSOL: $142 (+5.1%)\n\nFear & Greed: 72 (Greed)\nTop Signal: Whale accumulation on SOL\n\nPrediction Markets:\n- Trump Win: 52% → 54% (trending up)\n- Fed Rate Cut June: 68%\n- BTC $100K by Q3: 41%",
  'alpha': "**Alpha Play Detected**\n\nSignal: SOL whale accumulation + Polymarket volume spike\nConfidence: 87%\nSuggested: Long SOL/USDC with 3x leverage\nEntry: $140-142 | Target: $165 | Stop: $132\nEstimated Alpha: +16.4%\n\nCorrelated news: Solana Mobile Chapter 2 shipping next month.",
  'default': "I'm GOATED AI — your revenue intelligence co-pilot. I can help with:\n\n- Finding and ranking leads\n- Real-time market analysis\n- Prediction market signals\n- Outreach scripts and coaching\n- Competitive intelligence\n\nTry asking about leads, market trends, or alpha plays!",
};

function HomepageAIDemo({ onOpenFull }) {
  const [msgs, setMsgs] = useState([
    { role: 'assistant', text: "Yo! I'm GOATED AI. Ask me anything — leads, markets, alpha plays. This shit actually works. Try it." }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typing]);

  const send = () => {
    if (!input.trim() || typing) return;
    const msg = input.trim().toLowerCase();
    setMsgs(p => [...p, { role: 'user', text: input.trim() }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      let response = DEMO_RESPONSES.default;
      if (msg.includes('lead') || msg.includes('find') || msg.includes('pipeline') || msg.includes('top')) response = DEMO_RESPONSES.leads;
      else if (msg.includes('market') || msg.includes('btc') || msg.includes('crypto') || msg.includes('price')) response = DEMO_RESPONSES.market;
      else if (msg.includes('alpha') || msg.includes('play') || msg.includes('signal') || msg.includes('trade') || msg.includes('bet')) response = DEMO_RESPONSES.alpha;
      setMsgs(p => [...p, { role: 'assistant', text: response }]);
      setTyping(false);
    }, 800 + Math.random() * 600);
  };

  return (
    <div className="relative">
      <div className="bg-surface-0/80 backdrop-blur rounded-xl border border-brand/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 px-3 py-1.5 bg-brand text-black text-xs font-black uppercase tracking-wider rounded-bl-xl z-10">TRY IT</div>
        <div className="flex items-center gap-3 p-4 border-b border-white/[0.03]">
          <div className="text-brand"><GoatIcon /></div>
          <div>
            <div className="font-bold text-sm">GOATED AI</div>
            <div className="text-xs text-slate-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />Interactive Demo</div>
          </div>
        </div>
        <div className="h-[200px] overflow-y-auto p-3 space-y-2">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-brand/20 text-brand rounded-br-sm'
                  : 'bg-surface-2 text-slate-300 rounded-bl-sm'
              }`}>
                {m.text.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                  part.startsWith('**') && part.endsWith('**')
                    ? <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>
                    : <span key={j}>{part}</span>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-surface-2 px-3 py-2 rounded-xl rounded-bl-sm">
                <div className="flex gap-1">
                  {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand" style={{ animation: `bounce 0.6s ${i * 0.15}s infinite` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="p-3 border-t border-white/[0.03] flex gap-2">
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Try: find top leads, market pulse, alpha plays..."
            className="flex-1 px-3 py-2 rounded-lg bg-surface-2 border border-white/[0.03] text-xs text-white placeholder-slate-500 outline-none focus:border-brand/30"
          />
          <button onClick={send} disabled={typing || !input.trim()}
            className="px-3 py-2 rounded-lg bg-brand text-black font-bold text-xs disabled:opacity-30">
            <Send size={14} />
          </button>
        </div>
        <button onClick={onOpenFull}
          className="w-full py-2 text-center text-xs text-brand hover:text-emerald-300 transition-colors border-t border-white/[0.03] font-medium">
          Open Full AI Experience →
        </button>
      </div>
      <div className="absolute -inset-4 bg-brand/5 rounded-2xl blur-xl -z-10" />
    </div>
  );
}

function useLiveCounter(baseValue = 14832) {
  const [count, setCount] = useState(baseValue);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 2500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);
  return count;
}

export default function HomePage() {
  const { setPage, setAiOpen, setAccountModalOpen } = useStore();
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const leadsToday = useLiveCounter(14832);

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
    { icon: Users, title: 'Lead Intelligence', desc: '500K+ AI-scored leads with deep enrichment — buying signals, pain points, closing scripts, and company intel. This is your goddamn goldmine.', page: 'leads', color: '#10b981', stats: '500K+ leads' },
    { icon: TrendingUp, title: 'Trend Pulse', desc: 'Real-time global market intelligence with 3D visualization. See what\'s pumping before the herd. Alpha on tap.', page: 'trends', color: '#06b6d4', stats: 'Real-time' },
    { icon: Phone, title: 'Direct Outreach', desc: 'VoIP calling, SMS blasts, voicemail drops. Skip the inbox bullshit — go direct to decision makers and close faster.', page: 'leads', color: '#f59e0b', stats: 'Multi-channel' },
    { icon: Bot, title: 'GOATED AI Engine', desc: 'Custom AI with RSI, MACD, Bollinger Bands, regime detection, and predictive scoring. Not a ChatGPT wrapper — a proprietary intelligence engine built for alpha.', color: '#a855f7', action: () => setAiOpen(true), stats: 'Custom AI' },
    { icon: Globe, title: 'Prediction Markets', desc: '25+ live prediction markets across crypto, politics, tech & macro. Spread analysis vs Kalshi & Polymarket. See the future, bet on it, profit.', page: 'market', color: '#ef4444', stats: 'Live odds' },
    { icon: Globe, title: 'Sentiment Fusion', desc: 'Multi-source sentiment engine: Fear/Greed Index, news NLP, market momentum, social signals. All fused into one composite score. Absolute alpha.', page: 'trends', color: '#ec4899', stats: 'Multi-source' },
    { icon: Wallet, title: 'Solana Wallet', desc: 'Native Phantom integration. USDC settlements, on-chain commission tracking, instant payouts. Your bags, your keys, your money.', page: 'wallet', color: '#f97316', stats: 'Solana-first' },
    { icon: BarChart3, title: 'Command Center', desc: 'Full pipeline analytics, autonomous AI agents, real-time KPIs. One dashboard to rule them all. Total fucking control.', page: 'dashboard', color: '#8b5cf6', stats: 'Full control' },
    { icon: Rocket, title: 'LaunchPad', desc: 'Live events, real-time prediction betting, startup incubator. Take positions on market moves, sentiment shifts, and breaking news. Monetize everything.', page: 'launchpad', color: '#ec4899', stats: 'Live events' },
  ];

  const stats = [
    { value: '500', suffix: 'K+', label: 'Leads Ready to Close', icon: Users },
    { value: '0', suffix: '%', label: 'Platform Fee', icon: Wallet },
    { value: '10', suffix: '%', label: 'Commission Only', icon: TrendingUp },
    { value: '94', suffix: '%', label: 'Avg Close Rate', icon: Target },
  ];

  const outreachMethods = [
    { icon: Phone, title: 'VoIP Calling', desc: 'AI-powered dialer with real-time call coaching, sentiment analysis, and auto-transcription. Talk to 10x more prospects. Stop being a little bitch about cold calls.', color: '#10b981' },
    { icon: MessageSquare, title: 'SMS Sequences', desc: 'Automated SMS campaigns with personalization tokens and AI-optimized send times. Higher open rate than email will ever dream of.', color: '#06b6d4' },
    { icon: Mic, title: 'Voicemail Drops', desc: 'Pre-recorded voicemail drops that land directly in inbox. 3x response rate vs cold email. While you sleep, your pipeline grows.', color: '#a855f7' },
    { icon: Headphones, title: 'Call Analysis', desc: 'Real-time transcription, objection detection, and coaching. AI scores every call and tells you exactly how to close harder.', color: '#f59e0b' },
    { icon: Send, title: 'Social DMs', desc: 'Automated LinkedIn and Twitter outreach with personalized messaging at scale. Skip the gatekeeper, go straight to the whale.', color: '#ec4899' },
    { icon: Radio, title: 'Network Signals', desc: 'Real-time job change alerts, funding announcements, and trigger events. Ape into the deal at the perfect moment.', color: '#ef4444' },
  ];

  const competitorComparison = [
    { name: 'Apollo', price: '$39-149/mo', leads: true, ai: false, voip: false, predictions: false, wallet: false, sentiment: false, outreach: false, coaching: false },
    { name: 'ZoomInfo', price: '$14,000+/yr', leads: true, ai: false, voip: false, predictions: false, wallet: false, sentiment: false, outreach: false, coaching: false },
    { name: 'Outreach', price: '$100+/seat', leads: false, ai: false, voip: false, predictions: false, wallet: false, sentiment: false, outreach: true, coaching: false },
    { name: 'Gong', price: '$100+/seat', leads: false, ai: true, voip: false, predictions: false, wallet: false, sentiment: false, outreach: false, coaching: true },
    { name: 'Kalshi', price: 'Per-trade fees', leads: false, ai: false, voip: false, predictions: true, wallet: false, sentiment: false, outreach: false, coaching: false },
    { name: 'Polymarket', price: 'Per-trade fees', leads: false, ai: false, voip: false, predictions: true, wallet: false, sentiment: false, outreach: false, coaching: false },
    { name: 'GOATED', price: '$0 + 10%', leads: true, ai: true, voip: true, predictions: true, wallet: true, sentiment: true, outreach: true, coaching: true, isUs: true },
  ];

  const pricingTiers = [
    { name: 'Starter', price: 'Free', desc: 'Full platform access. Zero bullshit.', features: ['500K+ AI-scored leads', 'GOATED AI co-pilot', 'VoIP calling (100 min/mo)', 'SMS outreach (500/mo)', 'Prediction markets', 'Multi-chain wallet', 'Real-time trend pulse'], color: '#10b981', popular: true },
    { name: 'Closer', price: '12%', desc: 'Commission on closed deals only. WAGMI.', features: ['Everything in Starter', 'Unlimited VoIP minutes', 'Unlimited SMS', 'AI call coaching', 'Deep research per lead', 'Priority AI processing', 'Advanced analytics'], color: '#f59e0b' },
    { name: 'Enterprise', price: 'Custom', desc: 'For whale teams and venture studios.', features: ['Everything in Closer', 'Custom AI model training', 'White-label deployment', 'Dedicated success manager', 'API access & webhooks', 'Team analytics', 'Custom integrations'], color: '#a855f7' },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero */}
      <motion.section className="relative px-6 pt-12 sm:pt-16 pb-20" initial="hidden" animate="visible" variants={stagger}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div ref={parallaxRef1} className="absolute top-20 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-3xl will-change-transform" />
          <div ref={parallaxRef2} className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl will-change-transform" />
          <div ref={parallaxRef3} className="absolute top-40 right-10 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl will-change-transform" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.02]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(16,185,129,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
          <motion.div variants={fadeUp}>
            <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm mb-6" whileHover={{ scale: 1.05 }}>
              <Zap size={16} />
              <span className="font-medium">v4.0 — Revenue Intelligence OS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-brand via-emerald-300 to-cyan-400 bg-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text' }}>
                CLOSE DEALS
              </span>
              <br />
              <span className="text-white">NOT FUCKING</span>{' '}
              <span className="relative">
                <span className="text-white">TABS</span>
                <motion.span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-brand to-cyan-400 rounded-full" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 0.6 }} />
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-lg mb-4 leading-relaxed">
              Your pipeline is hemorrhaging money and you're paying $14K/yr for the privilege. Fuck that. <span className="text-brand font-semibold">500K+ leads</span> scored, ranked, and begging to be closed. AI that prints revenue while you sleep — this isn't a CRM, it's a goddamn money machine.
            </p>
            <p className="text-sm text-slate-500 mb-8 flex items-center gap-2">
              <Shield size={14} className="text-brand" />
              $0 platform fee. $2.50 withdrawal fee. 12% only when you close. No seats, no tiers, no horseshit. We eat when you eat.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <motion.button onClick={() => setPage('leads')} className="flex items-center gap-3 px-8 py-4 rounded-xl bg-brand text-black font-bold text-lg neon-border" whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(16,185,129,0.5)' }} whileTap={{ scale: 0.98 }}>
                <Rocket size={22} />LFG — Start Printing Money<ArrowRight size={18} />
              </motion.button>
              <motion.button onClick={() => setAiOpen(true)} className="flex items-center gap-3 px-8 py-4 rounded-xl bg-black/30 backdrop-blur-sm text-white font-semibold text-lg border border-white/[0.05] hover:border-brand/30" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Bot size={22} className="text-brand" />Talk to GOATED AI
              </motion.button>
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

          <motion.div className="flex justify-center lg:justify-end relative" variants={fadeUp}>
            <div style={{ animation: 'floatSlow 6s ease-in-out infinite' }}>
              <GoatLogo size={typeof window !== 'undefined' && window.innerWidth < 640 ? 220 : 380} />
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

      {/* Social Proof */}
      <section className="px-6 py-5 border-y border-white/[0.03] bg-surface-1/20">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-6 sm:gap-10 items-center text-sm text-slate-500">
          {['Custom GOATED AI Engine', '$2.3B+ pipeline tracked', '94% avg close rate', 'Solana-native wallet', 'Live prediction markets', `${leadsToday.toLocaleString()} leads processed today`].map((t, i) => (
            <div key={i} className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand" /><span>{t}</span></div>
          ))}
        </div>
      </section>

      {/* Elevator Pitch */}
      <section className="px-6 py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand/[0.02] to-transparent" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-brand text-sm font-bold uppercase tracking-widest">Stop Paying Rent to Close Deals</span>
            <h2 className="text-3xl lg:text-5xl font-black mt-3 mb-5 leading-tight">
              Every Weapon. One Platform. <span className="text-brand">Zero Fucking Dollars.</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed mb-8">
              Apollo wants $149/mo for leads. Gong wants $100/seat for call intel. ZoomInfo wants $14K/yr for data. We said fuck all that and built everything into one platform for free. The <span className="text-brand font-bold">GOATED Guarantee</span>: our AI close system hits 90%+ or we work with you until it does. This isn't SaaS — it's a revenue printing press and you're the operator.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <motion.div className="text-center p-6 rounded-2xl bg-black/40 border border-brand/20" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}>
              <div className="text-4xl font-black text-brand mb-2">500K+</div>
              <div className="text-sm text-slate-400">AI-Scored Leads</div>
              <div className="text-xs text-slate-600 mt-1">Ranked & ready to close</div>
            </motion.div>
            <motion.div className="text-center p-6 rounded-2xl bg-black/40 border border-brand/20" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="text-4xl font-black text-cyan-400 mb-2">$2.3B+</div>
              <div className="text-sm text-slate-400">Pipeline Tracked</div>
              <div className="text-xs text-slate-600 mt-1">Real revenue, real deals</div>
            </motion.div>
            <motion.div className="text-center p-6 rounded-2xl bg-black/40 border border-brand/20" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="text-4xl font-black text-yellow-400 mb-2">94%</div>
              <div className="text-sm text-slate-400">Avg Close Rate</div>
              <div className="text-xs text-slate-600 mt-1">GOATED Guarantee system</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-brand text-sm font-bold uppercase tracking-widest">Core Platform</span>
            <h2 className="text-3xl lg:text-4xl font-black mt-2 mb-3">8 Modules. <span className="text-brand">All Killer. No Filler.</span></h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Every weapon you need to find whales, reach decision makers, and close fat bags — in one AI-native platform. This is the whole goddamn arsenal.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.button key={i} onClick={() => f.action ? f.action() : f.page && setPage(f.page)}
                className="bg-black/40 backdrop-blur-sm rounded-xl p-5 text-left border border-white/[0.03] card-hover group relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                onMouseEnter={() => setHoveredFeature(i)} onMouseLeave={() => setHoveredFeature(null)}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 0%, ${f.color}10 0%, transparent 70%)` }} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300" style={{ background: `${f.color}15`, color: f.color }}><f.icon size={20} /></div>
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">{f.stats}</span>
                  </div>
                  <h3 className="font-bold text-white mb-1.5 group-hover:text-brand transition-colors">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-3">{f.desc}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-brand transition-colors"><span>Explore</span><ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" /></div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Direct Outreach Suite */}
      <section className="px-6 py-16 sm:py-20 bg-surface-1/30">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-yellow-400 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"><Phone size={16} />Direct Outreach Suite</span>
            <h2 className="text-3xl lg:text-4xl font-black mt-2 mb-3">Email is Dead. <span className="text-yellow-400">Call Them Like You Mean It.</span></h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Your competition is writing "just following up!" emails like a bunch of NPCs. You're going direct — VoIP, SMS, voicemail drops, AI call coaching. 10x reply rate. Skip the gatekeeper, talk to the whale.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {outreachMethods.map((m, i) => (
              <motion.div key={i} className="bg-black/40 backdrop-blur rounded-xl p-6 border border-white/[0.03] group hover:border-white/[0.06] transition-colors" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${m.color}15`, color: m.color }}><m.icon size={20} /></div>
                  <h3 className="font-bold text-white group-hover:text-brand transition-colors">{m.title}</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Degen Alpha Section */}
      <section className="px-6 py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.02) 0%, rgba(239,68,68,0.02) 50%, rgba(168,85,247,0.02) 100%)' }} />
        <div className="max-w-7xl mx-auto relative">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-orange-400 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"><Flame size={16} />DEGEN MODE ACTIVATED</span>
            <h2 className="text-3xl lg:text-5xl font-black mt-2 mb-3">Ape Into Deals. <span className="text-orange-400">Print Money While You Sleep.</span></h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Real degens don't pay $300/mo for mid tools. The alpha is free, the bags are fat, and the close rate is absurd. This is the zero-to-hero play. WAGMI.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {[
              { emoji: '\u{1F525}', title: 'Whale Plays Only', desc: 'AI finds the whale deals, you ape in and close them. 500K+ leads scored, ranked, and ready. The bag is sitting right there waiting for you to grab it.', stat: '$2.4M', label: 'Avg monthly pipeline' },
              { emoji: '\u{1F9E0}', title: 'Big Brain Alpha', desc: 'Real-time market intelligence from every social platform. Know what\'s pumping before the normies. Front-run the competition like a goddamn psychic.', stat: '< 30s', label: 'Alpha signal delay' },
              { emoji: '\u{1F4B0}', title: 'Money Printer Go Brr', desc: 'Direct outreach that converts like crazy. VoIP, SMS, voicemail drops — skip the inbox, go direct to the decision maker. Close while your competition writes follow-up emails.', stat: '10x', label: 'Reply rate vs email' },
              { emoji: '\u{1F410}', title: 'GOATED AI Agent', desc: 'Your always-on degen co-pilot. Real-time coaching, research, scripts — like having a senior closer whispering alpha in your ear 24/7. No sleep needed.', stat: '24/7', label: 'Always available' },
              { emoji: '\u{1F4C8}', title: 'Moon Signals', desc: 'Cross-platform sentiment analysis. Instagram, TikTok, crypto Twitter — see the trend before it moons. Ape into the right deal at the right time.', stat: 'LIVE', label: 'Real-time data' },
              { emoji: '\u26A1', title: 'Zero Fee, No Cap', desc: 'Free forever. We only eat when you eat. 12% on closed deals, that\'s the whole model. $2.50 withdrawal fee. No monthly bags being drained. This is a no-brainer, anon.', stat: '$0', label: 'Monthly cost' },
            ].map((item, i) => (
              <motion.div key={i} className="bg-black/40 backdrop-blur rounded-xl p-6 border border-white/[0.03] group hover:border-orange-500/20 transition-all duration-300 relative overflow-hidden" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
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
              </motion.div>
            ))}
          </div>

          <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex flex-col items-center gap-4 p-6 rounded-2xl border border-orange-500/20 bg-orange-500/5">
              <p className="text-xl sm:text-2xl font-black text-white">The alpha is free. <span className="text-orange-400">The bags are yours. LFG.</span></p>
              <p className="text-sm text-slate-400 max-w-md">While other platforms charge $14K+/yr for basic features, GOATED gives you everything — AI, leads, market intel, predictions, direct outreach — for absolutely nothing upfront. This is the degen play of the century.</p>
              <motion.button onClick={() => setPage('leads')} className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Flame size={20} />Let's Fucking Go<ArrowRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* GOATED AI Flagship */}
      <section className="px-6 py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.015) 0%, rgba(16,185,129,0.015) 50%, rgba(6,182,212,0.015) 100%)' }} />
        <div className="max-w-7xl mx-auto relative">
          <motion.div className="rounded-2xl border border-brand/20 p-6 sm:p-8 lg:p-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.02) 0%, rgba(0,0,0,0.98) 50%, rgba(168,85,247,0.06) 100%)' }} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <div className="absolute inset-0 rounded-2xl neon-border" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center relative">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider mb-4"><Crown size={14} />Flagship Feature</div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
                  <span className="bg-gradient-to-r from-brand via-purple-400 to-cyan-400 bg-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text' }}>GOATED</span>{' '}AI
                </h2>
                <p className="text-lg sm:text-xl text-slate-300 mb-3">Your always-on AI co-pilot that never misses</p>
                <p className="text-slate-400 mb-6 leading-relaxed">
                  Context-aware AI overlay that embeds every platform feature — Trend Pulse, Lead Intelligence, Wallet, Dashboard, and Prediction Markets — directly in the chat. Real-time call coaching, deep research, and deal execution. This is the unfair advantage your competition doesn't have. Powered by Claude.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {['Embedded Features', 'Call Coaching', 'Deep Research', 'Deal Execution', 'Trend Analysis', 'Lead Enrichment', 'Always On'].map(tag => (
                    <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.02] border border-white/[0.05] text-slate-300">{tag}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <motion.button onClick={() => setAiOpen(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand to-emerald-400 text-black font-bold" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Rocket size={18} />Launch AI</motion.button>
                  <motion.button onClick={() => setPage('leads')} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-white font-medium" whileHover={{ scale: 1.05 }}>Start Printing Money <ChevronRight size={16} /></motion.button>
                </div>
              </div>

              <HomepageAIDemo onOpenFull={() => setAiOpen(true)} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* B2B Intelligence */}
      <section className="px-6 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-cyan-400 text-sm font-bold uppercase tracking-widest">B2B Intelligence</span>
            <h2 className="text-3xl lg:text-4xl font-black mt-2 mb-3">Know Their Shit Better <span className="text-cyan-400">Than They Do</span></h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Every lead gets AI-scored rankings, pain point breakdowns, revenue estimates, buying signals, and custom close scripts. Walk into every call knowing exactly where they're bleeding money and how you're gonna fix it.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Target, title: 'AI Lead Scoring', desc: '0-100 composite score with fit, intent, engagement, and timing signals. The cream rises to the top.', stat: '94', label: 'Top Score', color: '#10b981' },
              { icon: BarChart3, title: 'Deep Research', desc: 'Company financials, tech stack, hiring signals, and competitive landscape per lead. Total intel dominance.', stat: '20+', label: 'Data Sources', color: '#06b6d4' },
              { icon: Phone, title: 'Call Scripts', desc: 'AI-generated personalized scripts, objection handling, and closing frameworks. Never wing it again.', stat: '3', label: 'Approaches', color: '#a855f7' },
              { icon: Gauge, title: 'Real-time Signals', desc: 'Job changes, funding rounds, tech adoptions — ape into the deal at the perfect moment.', stat: 'LIVE', label: 'Signals', color: '#f59e0b' },
            ].map((item, i) => (
              <motion.div key={i} className="bg-black/40 backdrop-blur rounded-xl p-5 border border-white/[0.03] group hover:border-white/[0.05] transition-colors" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${item.color}15`, color: item.color }}><item.icon size={20} /></div>
                  <div className="text-right">
                    <div className="text-xl font-black" style={{ color: item.color }}>{item.stat}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</div>
                  </div>
                </div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.div className="text-center mt-8" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <motion.button onClick={() => setPage('leads')} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-medium hover:bg-cyan-500/20 transition-colors" whileHover={{ scale: 1.03 }}>
              <Users size={18} />Explore 500K+ Leads<ArrowRight size={16} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="px-6 py-16 sm:py-20 bg-surface-1/30">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-brand text-sm font-bold uppercase tracking-widest">Why GOATED Wins</span>
            <h2 className="text-3xl lg:text-4xl font-black mt-2 mb-3">Everyone Else is Mid. <span className="text-brand">We're Built Different.</span></h2>
            <p className="text-slate-400 max-w-xl mx-auto">They charge you per seat, per feature, per fucking breath. We give you the entire arsenal for $0. Look at this chart and try to justify paying anyone else. You can't.</p>
          </motion.div>
          <div className="rounded-xl border border-white/[0.05] overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-surface-2/50 border-b border-white/[0.03]">
                  <th className="p-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Platform</th>
                  <th className="p-3 text-center text-xs font-bold text-slate-400 uppercase">Price</th>
                  {['Leads', 'AI Agent', 'VoIP', 'Predictions', 'Wallet', 'Sentiment', 'Outreach', 'Coaching'].map(h => (
                    <th key={h} className="p-3 text-center text-xs font-bold text-slate-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {competitorComparison.map((c, i) => (
                  <tr key={i} className={`border-b border-white/[0.03] transition-colors ${c.isUs ? 'bg-brand/10 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'hover:bg-white/[0.01]'}`}>
                    <td className="p-3">
                      <span className={`font-bold text-sm ${c.isUs ? 'text-brand text-base' : 'text-white'}`}>{c.name}</span>
                      {c.isUs && <span className="ml-2 text-[9px] bg-brand/20 text-brand px-1.5 py-0.5 rounded-full font-black animate-pulse">GOATED</span>}
                    </td>
                    <td className="p-3 text-center"><span className={`font-bold text-sm ${c.isUs ? 'text-brand font-black' : 'text-red-400'}`}>{c.price}</span></td>
                    {['leads', 'ai', 'voip', 'predictions', 'wallet', 'sentiment', 'outreach', 'coaching'].map(feat => (
                      <td key={feat} className="p-3 text-center">
                        {c[feat]
                          ? <CheckCircle2 size={16} className={`mx-auto ${c.isUs ? 'text-brand' : 'text-slate-500'}`} />
                          : <span className="text-red-500/40 text-sm">✗</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-slate-600 mt-4">Prices as of March 2026. Feature availability based on standard plans.</p>

          {/* Why We're Different Callout */}
          <motion.div className="mt-8 p-6 rounded-2xl border border-brand/30 bg-brand/5 relative overflow-hidden" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="absolute inset-0 bg-gradient-to-r from-brand/5 to-transparent" />
            <div className="relative">
              <h3 className="text-xl font-black text-brand mb-3 flex items-center gap-2"><Crown size={20} /> Why We're Different</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="font-bold text-white mb-1">They charge rent</div>
                  <p className="text-sm text-slate-400">Apollo, ZoomInfo, Outreach — they all want $100-$14K+ before you close a single deal. That's backwards as hell.</p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">We bet on you</div>
                  <p className="text-sm text-slate-400">$0 upfront. We only make money when you make money. 12% on closed deals. $2.50 withdrawal fee. Our incentives are perfectly aligned with yours.</p>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">All-in-one monster</div>
                  <p className="text-sm text-slate-400">Leads + AI + VoIP + predictions + wallet + sentiment + outreach + coaching. Nobody else has all 8. Nobody. It's not even close.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Revenue Model / Pricing */}
      <section className="px-6 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-brand text-sm font-bold uppercase tracking-widest">Revenue Model</span>
            <h2 className="text-3xl lg:text-4xl font-black mt-2 mb-3">Free Platform. <span className="text-brand">Commission Only.</span></h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">We don't charge subscriptions. We take 12% when you close. $2.50 withdrawal fee. Your success is our revenue. This is the way.</p>
          </motion.div>

          <motion.div className="max-w-3xl mx-auto mb-12 p-6 rounded-2xl border border-brand/20 bg-brand/5" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div><div className="text-3xl font-black text-brand mb-1">$0</div><div className="text-sm text-slate-400">To start using everything</div></div>
              <div><div className="text-3xl font-black text-yellow-400 mb-1">12%</div><div className="text-sm text-slate-400">Only on deals you close</div></div>
              <div><div className="text-3xl font-black text-cyan-400 mb-1">88%</div><div className="text-sm text-slate-400">You keep the rest. Period.</div></div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {pricingTiers.map((tier, i) => (
              <motion.div key={i} className={`bg-black/40 backdrop-blur rounded-xl p-6 border relative ${tier.popular ? 'border-brand/40 ring-1 ring-brand/20' : 'border-white/[0.03]'}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                {tier.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand text-black text-xs font-black rounded-full uppercase tracking-wider">Most Popular</div>}
                <div className="text-center mb-5 pt-2">
                  <h3 className="font-bold text-lg mb-1">{tier.name}</h3>
                  <div className="text-3xl font-black" style={{ color: tier.color }}>{tier.price}</div>
                  <p className="text-xs text-slate-500 mt-1">{tier.desc}</p>
                </div>
                <div className="space-y-2 mb-5">
                  {tier.features.map((f, j) => <div key={j} className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} style={{ color: tier.color }} className="flex-shrink-0" />{f}</div>)}
                </div>
                <button onClick={() => tier.price === 'Custom' ? setAccountModalOpen(true) : setPage('leads')} className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${tier.popular ? 'bg-brand text-black hover:bg-emerald-400' : 'bg-white/[0.02] border border-white/[0.05] text-slate-300 hover:bg-white/[0.04]'}`}>
                  {tier.price === 'Free' ? 'Start Printing Money' : tier.price === 'Custom' ? 'Contact Us' : 'Start Earning'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a GOATED Partner - Affiliate Program */}
      <section className="px-6 py-16 sm:py-20 bg-surface-1/30 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.015) 0%, rgba(168,85,247,0.015) 50%, rgba(16,185,129,0.015) 100%)' }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-400 text-xs font-bold uppercase tracking-wider mb-4"><DollarSign size={14} />GOATED Partner Program</div>
            <h2 className="text-3xl lg:text-5xl font-black mb-4">Become a <span className="text-pink-400">GOATED Partner</span></h2>
            <p className="text-lg text-slate-400 mb-3 leading-relaxed max-w-2xl mx-auto">Earn <span className="text-pink-400 font-bold">20% recurring commission</span> on every deal your referrals close. Not a one-time payout — recurring. Every month. Forever. Your network is literally a money printer.</p>
            <p className="text-sm text-slate-500 mb-8 max-w-xl mx-auto">Top partners earn $10K-$50K/mo doing nothing but sharing their link. Instant Solana payouts. No cap on earnings. This is passive income that actually works.</p>
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
              <div className="bg-black/40 rounded-xl p-4 border border-white/[0.03]"><div className="text-2xl font-black text-pink-400">20%</div><div className="text-xs text-slate-500">Recurring Rev Share</div></div>
              <div className="bg-black/40 rounded-xl p-4 border border-white/[0.03]"><div className="text-2xl font-black text-purple-400">90d</div><div className="text-xs text-slate-500">Cookie Window</div></div>
              <div className="bg-black/40 rounded-xl p-4 border border-white/[0.03]"><div className="text-2xl font-black text-brand">SOL</div><div className="text-xs text-slate-500">Instant Payout</div></div>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.button onClick={() => setPage('builder')} className="px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                Apply Now — Start Printing Passive Income <ArrowRight className="inline ml-2" size={18} />
              </motion.button>
              <motion.button onClick={() => setPage('leads')} className="px-8 py-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-white font-medium text-lg hover:border-pink-500/30 transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                Or Just Start Closing Yourself
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand/5 to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <div className="mb-6"><GoatLogo size={80} /></div>
            <h2 className="text-4xl lg:text-5xl font-black mb-4">Still Reading? <span className="text-brand">Just Fucking Start.</span></h2>
            <p className="text-xl text-slate-400 mb-4">Your competition is paying $14K/yr for half these features while you're about to get everything for free. The math ain't mathing for them. It's mathing hard for you.</p>
            <p className="text-sm text-slate-600 mb-8">$0 platform fee. $2.50 withdrawal fee. 12% on closed deals. We eat when you eat. No cap. LFG.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.button onClick={() => setPage('leads')} className="px-12 py-5 rounded-xl bg-brand text-black font-bold text-xl neon-border" whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(16,185,129,0.6)' }} whileTap={{ scale: 0.95 }}>
                Start Printing Money <ArrowRight className="inline ml-2" size={22} />
              </motion.button>
              <motion.button onClick={() => setAiOpen(true)} className="px-8 py-5 rounded-xl bg-black/30 backdrop-blur border border-white/[0.05] text-white font-bold text-xl hover:border-brand/30" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Bot className="inline mr-2" size={22} />Talk to AI
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/[0.03]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <GoatIcon className="w-5 h-5" />
            <span className="font-bold text-slate-400">GOATED Solutions</span>
            <span>v4.0 — Revenue Intelligence OS</span>
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
