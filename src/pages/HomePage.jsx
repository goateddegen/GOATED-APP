import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, LayoutDashboard, Bot, Users, TrendingUp, Wallet, ArrowRight, Shield, Globe, Rocket, Crown, ChevronRight, BarChart3, Target, Flame, CheckCircle2, ArrowDown, Cpu, Activity, DollarSign, Gauge, Phone, MessageSquare, Mic, Headphones, Send, Radio, Sparkles, Eye, Lock, Crosshair, Layers, Building2, Code2, Star, Briefcase, ShoppingBag, ExternalLink, Trophy, Dice1, Swords, CircleDot, Megaphone, TrendingDown, Award, Gem, Zap as ZapIcon } from 'lucide-react';
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

// ── Floating Particles ───────────────────────────────────────────────────────
function FloatingParticles() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.parentElement.offsetWidth;
    let h = canvas.parentElement.offsetHeight;
    canvas.width = w;
    canvas.height = h;

    // Initialize particles (reduced from 40 for perf — connection lines are O(n²))
    const count = 20;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.5 ? '16,185,129' : '6,182,212',
    }));

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener('mousemove', handleMouse, { passive: true });

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      particlesRef.current.forEach((p) => {
        // Mouse influence
        const ddx = mx - p.x;
        const ddy = my - p.y;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist < 200 && dist > 0) {
          const force = (200 - dist) / 200 * 0.02;
          p.vx += ddx / dist * force;
          p.vy += ddy / dist * force;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy *= 0.99;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      });

      // Draw connections
      const pts = particlesRef.current;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(16,185,129,${0.06 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      w = canvas.parentElement.offsetWidth;
      h = canvas.parentElement.offsetHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      canvas.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('resize', handleResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-auto" style={{ zIndex: 0, willChange: 'transform' }} />;
}

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
  const { setPage, setAiOpen, setAccountModalOpen } = useStore();
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const leadsToday = useLiveCounter(14832);
  const liveEvents = useLiveCounter(47);

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
    { icon: Users, title: 'Lead Intelligence', desc: '500K+ AI-scored leads with deep enrichment — buying signals, pain points, closing scripts, and company intel. This is your goddamn goldmine.', page: 'leads', color: '#10b981', stats: '500K+ leads' },
    { icon: TrendingUp, title: 'Trend Pulse', desc: 'Real-time global market intelligence with 3D visualization. See what\'s pumping before the herd. Alpha on tap.', page: 'trends', color: '#06b6d4', stats: 'Real-time' },
    { icon: Phone, title: 'Direct Outreach', desc: 'VoIP calling, SMS blasts, voicemail drops. Skip the inbox bullshit — go direct to decision makers and close faster.', page: 'leads', color: '#f59e0b', stats: 'Multi-channel' },
    { icon: Bot, title: 'GOATED AI Engine', desc: 'Custom AI with RSI, MACD, Bollinger Bands, regime detection, and predictive scoring. Not a ChatGPT wrapper — a proprietary intelligence engine built for alpha.', color: '#a855f7', action: () => setAiOpen(true), stats: 'Custom AI' },
    { icon: Globe, title: 'Prediction Markets', desc: '25+ live prediction markets across crypto, politics, tech & macro. Spread analysis vs Kalshi & Polymarket. See the future, bet on it, profit.', page: 'trends', color: '#ef4444', stats: 'Live odds' },
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

        {/* Floating Particles Canvas */}
        <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: 'none' }}>
          <FloatingParticles />
        </div>

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
              <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm" whileHover={{ scale: 1.05 }}>
                <Zap size={16} />
                <span className="font-medium">v4.0 — Revenue Intelligence OS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              </motion.div>
              <motion.div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs" whileHover={{ scale: 1.05 }}>
                <Flame size={12} />
                <span className="font-bold">DEGEN MODE Available</span>
              </motion.div>
            </div>

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
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-8">
              <span className="flex items-center gap-1.5"><Shield size={14} className="text-brand" />$0 platform fee</span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1.5"><DollarSign size={14} className="text-yellow-400" />10-15% on closed deals</span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1.5"><Wallet size={14} className="text-cyan-400" />Instant SOL payouts</span>
            </div>

            <div className="flex flex-wrap gap-4 mb-10">
              <GlowButton onClick={() => setPage('leads')} color="brand">
                <Rocket size={22} />LFG -- Start Printing Money<ArrowRight size={18} />
              </GlowButton>
              <GlowButton onClick={() => setAiOpen(true)} variant="secondary">
                <Bot size={22} className="text-brand" />Talk to GOATED AI
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

      {/* ═══ SOCIAL PROOF ═══ */}
      <section className="px-6 py-5 border-y border-white/[0.03] bg-surface-1/20">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-6 sm:gap-10 items-center text-sm text-slate-500">
          {['Custom GOATED AI Engine', '500K+ leads scored', 'AI-powered close system', 'Solana-native wallet', 'Live prediction markets', `${leadsToday.toLocaleString()} leads processed today`].map((t, i) => (
            <div key={i} className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand" /><span>{t}</span></div>
          ))}
        </div>
      </section>

      {/* ═══ DEGEN MODE UPSELL ═══ */}
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
                  Unlock DEGEN MODE
                </span>
              </h2>
              <p className="text-lg text-slate-400 max-w-3xl mb-8">
                For the real ones. Activate DEGEN MODE and unlock the full alpha toolkit — casino games, insider signals, leaderboards, and market intel that normies will never see. This is the degenerate layer on top of professional-grade tools.
              </p>

              {/* Casino Games Row */}
              <div className="mb-6">
                <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles size={14} />Casino Games</h3>
                <StaggeredCards className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: TrendingUp, label: 'Price Prediction', desc: 'Bet on where BTC, ETH, SOL go next. Real-time charts, real stakes.', color: '#f97316' },
                    { icon: CircleDot, label: 'Roulette', desc: 'Crypto roulette with USDC. Fast rounds, instant payouts.', color: '#ef4444' },
                    { icon: Swords, label: 'Portfolio Duel', desc: '1v1 portfolio battles. Build the best bag in 24hrs and win.', color: '#a855f7' },
                    { icon: Bot, label: 'AI Oracle', desc: 'Bet against GOATED AI predictions. Think you know more? Prove it.', color: '#ec4899' },
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

              {/* Alpha & Intel Row */}
              <div className="mb-8">
                <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Eye size={14} />Alpha Intel & Leaderboards</h3>
                <StaggeredCards className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: Crosshair, label: 'Alpha Plays', desc: 'AI-detected trade signals with entry/exit targets and confidence scores.', color: '#f97316' },
                    { icon: Activity, label: 'Live Closing Feed', desc: 'Real-time feed of deals being closed across the platform. See the money move.', color: '#10b981' },
                    { icon: Trophy, label: 'Bet-on-Closers', desc: 'Leaderboard of top closers. Bet on who closes the most this week.', color: '#f59e0b' },
                    { icon: Eye, label: 'Insider Signals', desc: 'Whale wallet tracking, social sentiment spikes, and breaking alpha.', color: '#ef4444' },
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
                  <Flame size={20} />Activate DEGEN MODE<ArrowRight size={18} />
                </GlowButton>
                <span className="text-sm text-slate-500">Toggle anytime with <kbd className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold text-xs mx-1">Shift+D</kbd></span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ LAUNCHPAD UPSELL ═══ */}
      <section className="px-6 py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/[0.02] to-transparent" />
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="rounded-2xl border border-pink-500/20 p-8 sm:p-10 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.04) 0%, rgba(0,0,0,0.97) 50%, rgba(168,85,247,0.04) 100%)' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: '0 0 40px rgba(236,72,153,0.08)' }} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-400 text-xs font-bold uppercase tracking-wider mb-4">
                  <Rocket size={14} />LaunchPad
                </div>
                <h2 className="text-3xl sm:text-4xl font-black mb-4">
                  Live Prediction Markets.{' '}
                  <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text' }}>
                    Real Money.
                  </span>
                </h2>
                <p className="text-lg text-slate-400 mb-6 leading-relaxed">
                  Take positions on crypto moves, political outcomes, tech launches, and macro events. Real-time odds from Kalshi and Polymarket — plus GOATED exclusive markets. Monetize your predictions.
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  {['Crypto', 'Politics', 'Tech', 'Macro', 'Sports', 'Culture'].map(tag => (
                    <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium bg-pink-500/10 border border-pink-500/20 text-pink-300">{tag}</span>
                  ))}
                </div>
                <GlowButton onClick={() => setPage('launchpad')} color="pink">
                  <Rocket size={18} />Enter LaunchPad<ArrowRight size={16} />
                </GlowButton>
              </div>

              {/* Live stats panel */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: liveEvents, label: 'Live Events', color: '#ec4899', suffix: '' },
                  { value: '25', label: 'Active Markets', color: '#a855f7', suffix: '+' },
                  { value: '$0', label: 'Volume Today', color: '#06b6d4', suffix: '' },
                  { value: '89', label: 'Accuracy Rate', color: '#10b981', suffix: '%' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="bg-black/60 backdrop-blur rounded-xl p-5 border border-white/[0.04] text-center group hover:border-pink-500/20 transition-all duration-300"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="text-3xl font-black mb-1" style={{ color: stat.color }}>
                      {stat.value}{stat.suffix}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</div>
                    {i === 0 && <div className="w-2 h-2 rounded-full bg-pink-500 mx-auto mt-2 animate-pulse" />}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ ELEVATOR PITCH ═══ */}
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

          <StaggeredCards className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center p-6 rounded-2xl bg-black/40 border border-brand/20 hover:border-brand/40 transition-colors duration-300">
              <div className="text-4xl font-black text-brand mb-2">500K+</div>
              <div className="text-sm text-slate-400">AI-Scored Leads</div>
              <div className="text-xs text-slate-600 mt-1">Ranked & ready to close</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-black/40 border border-brand/20 hover:border-cyan-400/40 transition-colors duration-300">
              <div className="text-4xl font-black text-cyan-400 mb-2">$0</div>
              <div className="text-sm text-slate-400">Revenue (Pre-Launch)</div>
              <div className="text-xs text-slate-600 mt-1">$0 until real deals close</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-black/40 border border-brand/20 hover:border-yellow-400/40 transition-colors duration-300">
              <div className="text-4xl font-black text-yellow-400 mb-2">94%</div>
              <div className="text-sm text-slate-400">Avg Close Rate</div>
              <div className="text-xs text-slate-600 mt-1">GOATED Guarantee system</div>
            </div>
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
                className="bg-black/40 backdrop-blur-sm rounded-xl p-5 text-left border border-white/[0.03] group relative overflow-hidden hover:border-white/[0.08] transition-all duration-300 hover:-translate-y-1"
                onMouseEnter={() => setHoveredFeature(i)} onMouseLeave={() => setHoveredFeature(null)}
                whileTap={{ scale: 0.98 }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 0%, ${f.color}10 0%, transparent 70%)` }} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg" style={{ background: `${f.color}15`, color: f.color, boxShadow: hoveredFeature === i ? `0 0 20px ${f.color}30` : 'none' }}><f.icon size={20} /></div>
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">{f.stats}</span>
                  </div>
                  <h3 className="font-bold text-white mb-1.5 group-hover:text-brand transition-colors">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-3">{f.desc}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-brand transition-colors"><span>Explore</span><ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" /></div>
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
            <span className="text-yellow-400 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"><Phone size={16} />Direct Outreach Suite</span>
            <h2 className="text-3xl lg:text-4xl font-black mt-2 mb-3">Email is Dead. <span className="text-yellow-400">Call Them Like You Mean It.</span></h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Your competition is writing "just following up!" emails like a bunch of NPCs. You're going direct — VoIP, SMS, voicemail drops, AI call coaching. 10x reply rate. Skip the gatekeeper, talk to the whale.</p>
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
            <span className="text-orange-400 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"><Flame size={16} />DEGEN MODE ACTIVATED</span>
            <h2 className="text-3xl lg:text-5xl font-black mt-2 mb-3">Ape Into Deals. <span className="text-orange-400">Print Money While You Sleep.</span></h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Real degens don't pay $300/mo for mid tools. The alpha is free, the bags are fat, and the close rate is absurd. This is the zero-to-hero play. WAGMI.</p>
          </motion.div>

          <StaggeredCards className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {[
              { emoji: '\u{1F525}', title: 'Whale Plays Only', desc: 'AI finds the whale deals, you ape in and close them. 500K+ leads scored, ranked, and ready. The bag is sitting right there waiting for you to grab it.', stat: '500K+', label: 'Leads scored' },
              { emoji: '\u{1F9E0}', title: 'Big Brain Alpha', desc: 'Real-time market intelligence from every social platform. Know what\'s pumping before the normies. Front-run the competition like a goddamn psychic.', stat: '< 30s', label: 'Alpha signal delay' },
              { emoji: '\u{1F4B0}', title: 'Money Printer Go Brr', desc: 'Direct outreach that converts like crazy. VoIP, SMS, voicemail drops — skip the inbox, go direct to the decision maker. Close while your competition writes follow-up emails.', stat: '10x', label: 'Reply rate vs email' },
              { emoji: '\u{1F410}', title: 'GOATED AI Agent', desc: 'Your always-on degen co-pilot. Real-time coaching, research, scripts — like having a senior closer whispering alpha in your ear 24/7. No sleep needed.', stat: '24/7', label: 'Always available' },
              { emoji: '\u{1F4C8}', title: 'Moon Signals', desc: 'Cross-platform sentiment analysis. Instagram, TikTok, crypto Twitter — see the trend before it moons. Ape into the right deal at the right time.', stat: 'LIVE', label: 'Real-time data' },
              { emoji: '\u26A1', title: 'Zero Fee, No Cap', desc: 'Free forever. We only eat when you eat. 12% on closed deals, that\'s the whole model. $2.50 withdrawal fee. No monthly bags being drained. This is a no-brainer, anon.', stat: '$0', label: 'Monthly cost' },
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

      {/* ═══ GOATED AI FLAGSHIP ═══ */}
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
                  <GlowButton onClick={() => setAiOpen(true)} color="brand" className="!px-6 !py-3 !text-base">
                    <Rocket size={18} />Launch AI
                  </GlowButton>
                  <motion.button onClick={() => setPage('leads')} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-white font-medium hover:border-brand/20 transition-colors" whileHover={{ scale: 1.05 }}>Start Printing Money <ChevronRight size={16} /></motion.button>
                </div>
              </div>

              <HomepageAIDemo onOpenFull={() => setAiOpen(true)} />
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

      {/* ═══ PARTNER / INTEGRATION SHOWCASE ═══ */}
      <section className="px-6 py-14 sm:py-16 border-y border-white/[0.03] bg-surface-1/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand/[0.01] via-transparent to-cyan-500/[0.01]" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Powered By & Integrated With</span>
            <h3 className="text-2xl font-black mt-2 text-white">The Best Stack in the Game</h3>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'Apollo', color: '#6366f1' },
              { name: 'Kalshi', color: '#ef4444' },
              { name: 'Polymarket', color: '#3b82f6' },
              { name: 'CoinGecko', color: '#8dc63f' },
              { name: 'Supabase', color: '#3ecf8e' },
              { name: 'Phantom', color: '#ab9ff2' },
              { name: 'Solana', color: '#14f195' },
              { name: 'Claude AI', color: '#d4a574' },
              { name: 'Vercel', color: '#ffffff' },
              { name: 'Plaid', color: '#0a85ea' },
              { name: 'Whop', color: '#7c3aed' },
            ].map((partner, i) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <PartnerLogo name={partner.name} color={partner.color} />
              </motion.div>
            ))}
          </div>

          <motion.p
            className="text-center text-sm text-slate-600 mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            11+ integrations powering the most complete revenue intelligence platform ever built
          </motion.p>
        </div>
      </section>

      {/* ═══ COMPETITOR COMPARISON ═══ */}
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
                          : <span className="text-red-500/40 text-sm">{'\u2717'}</span>
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

      {/* ═══ REVENUE MODEL / PRICING ═══ */}
      <section className="px-6 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-brand text-sm font-bold uppercase tracking-widest">Revenue Model</span>
            <h2 className="text-3xl lg:text-5xl font-black mt-2 mb-3">$0 Platform Fee. <span className="text-brand">You Pay When You Profit.</span></h2>
            <p className="text-xl text-slate-300 font-semibold mb-2">Multiple revenue streams. All performance-based.</p>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">No subscriptions. No seat fees. No monthly drain. Every revenue stream is tied to actual value delivered. We only win when you win.</p>
          </motion.div>

          {/* Revenue Streams Grid */}
          <StaggeredCards className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto mb-10">
            {[
              { icon: DollarSign, title: '$0 Platform Fee', value: '$0', desc: 'Full access to every tool, every feature, every lead. Zero upfront cost. No monthly charges ever.', color: '#10b981', label: 'Always free' },
              { icon: Target, title: 'Deal Commission', value: '10-15%', desc: 'Commission on closed deals only. We eat when you eat. Scales with deal size for fairness.', color: '#f59e0b', label: 'On closed deals' },
              { icon: TrendingUp, title: 'Betting Spreads', value: '2-5%', desc: 'Spread on prediction market bets. Competitive with Kalshi and Polymarket. Better odds, more markets.', color: '#a855f7', label: 'On market bets' },
              { icon: Wallet, title: 'Crypto Transactions', value: '1-2%', desc: 'Small fee on crypto transactions and settlements. Lower than any exchange. Instant Solana payouts.', color: '#06b6d4', label: 'On transactions' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="bg-black/40 backdrop-blur rounded-2xl p-6 border border-white/[0.05] hover:border-brand/20 transition-all duration-300 hover:-translate-y-1 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: `${item.color}15`, color: item.color }}>
                  <item.icon size={24} />
                </div>
                <div className="text-3xl font-black mb-1" style={{ color: item.color }}>{item.value}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">{item.label}</div>
                <h3 className="font-bold text-white text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </StaggeredCards>

          {/* Competitor comparison callout */}
          <motion.div className="max-w-4xl mx-auto mb-10 p-5 rounded-xl border border-red-500/20 bg-red-500/5 text-center" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-sm text-red-400 font-bold uppercase tracking-wider mb-2">vs. The Competition</p>
            <p className="text-lg text-slate-300">Competitors charge <span className="text-red-400 font-black">$99-$299/mo</span> regardless of whether you close a single deal.</p>
            <p className="text-sm text-slate-500 mt-2">Apollo ($39-149/mo), ZoomInfo ($14K+/yr), Outreach ($100+/seat), Gong ($100+/seat) -- all charge you whether you make money or not. We don't.</p>
          </motion.div>

          {/* Pricing Tiers */}
          <StaggeredCards className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier, i) => (
              <div key={i} className={`bg-black/40 backdrop-blur rounded-2xl p-6 border relative hover:-translate-y-1 transition-all duration-300 flex flex-col ${tier.popular ? 'border-brand/40 ring-1 ring-brand/20 shadow-[0_0_30px_rgba(16,185,129,0.08)]' : 'border-white/[0.05]'}`}>
                {tier.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand text-black text-xs font-black rounded-full uppercase tracking-wider">Most Popular</div>}
                <div className="text-center mb-6 pt-2">
                  <h3 className="font-bold text-lg mb-2">{tier.name}</h3>
                  <div className="text-4xl font-black mb-1" style={{ color: tier.color }}>{tier.price}</div>
                  <p className="text-xs text-slate-500 mt-1">{tier.desc}</p>
                </div>
                <div className="space-y-2.5 mb-6 flex-1">
                  {tier.features.map((f, j) => <div key={j} className="flex items-center gap-2.5 text-sm text-slate-300"><CheckCircle2 size={14} style={{ color: tier.color }} className="flex-shrink-0" />{f}</div>)}
                </div>
                <button onClick={() => tier.price === 'Custom' ? setAccountModalOpen(true) : setPage('leads')} className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 ${tier.popular ? 'bg-brand text-black hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white/[0.03] border border-white/[0.06] text-slate-300 hover:bg-white/[0.06]'}`}>
                  {tier.price === 'Free' ? 'Start Printing Money' : tier.price === 'Custom' ? 'Contact Us' : 'Start Earning'}
                </button>
              </div>
            ))}
          </StaggeredCards>
        </div>
      </section>

      {/* ═══ GOATED PARTNER PROGRAM ═══ */}
      <section className="px-6 py-16 sm:py-24 bg-surface-1/30 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.02) 0%, rgba(168,85,247,0.02) 50%, rgba(16,185,129,0.02) 100%)' }} />
        <div className="absolute top-20 right-20 w-72 h-72 bg-pink-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-56 h-56 bg-purple-500/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Rocket size={14} />Launch on GOATED
            </div>
            <h2 className="text-3xl lg:text-5xl font-black mb-4">The <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-brand bg-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text' }}>GOATED Partner Program</span></h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed mb-3">
              Like Magic Eden for projects, Whop for communities. Launch your project on GOATED and get instant access to <span className="text-pink-400 font-bold">250K+ B2B leads</span>, AI-powered promotion, and a community of closers ready to sell your product.
            </p>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto">Private deal flow, ad marketing, community amplification. Whether you are a startup, SaaS tool, or crypto project — GOATED is your go-to-market engine.</p>
          </motion.div>

          {/* Partnership Tiers */}
          <StaggeredCards className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {[
              { name: 'Free Listing', price: '$0', period: '/forever', desc: 'Get listed in the GOATED marketplace. Basic visibility to our closer network.', features: ['Project listing page', 'Basic lead exposure', 'Community feed mentions', 'Self-serve analytics'], color: '#10b981', border: 'border-brand/20' },
              { name: 'Featured', price: '$499', period: '/mo', desc: 'Boosted visibility with AI-powered matching to relevant closers.', features: ['Everything in Free', 'Featured placement', 'AI lead matching', 'Priority in search', 'Monthly performance report'], color: '#f59e0b', border: 'border-yellow-500/20', popular: true },
              { name: 'Premium', price: '$2,499', period: '/mo', desc: 'Full-service promotion with dedicated deal flow and ad campaigns.', features: ['Everything in Featured', 'Dedicated account manager', 'Custom ad campaigns', 'Private deal flow access', 'Community amplification', 'Co-branded outreach'], color: '#a855f7', border: 'border-purple-500/20' },
              { name: 'Enterprise', price: 'Custom', period: '', desc: 'White-glove partnership for high-volume projects and venture studios.', features: ['Everything in Premium', 'Custom AI model training', 'API access & webhooks', 'White-label options', 'Exec introductions', 'Revenue share model'], color: '#ec4899', border: 'border-pink-500/20' },
            ].map((tier, i) => (
              <motion.div
                key={i}
                className={`bg-black/50 backdrop-blur rounded-2xl p-6 border ${tier.border} relative hover:-translate-y-1 transition-all duration-300 flex flex-col`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {tier.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-500 text-black text-[10px] font-black rounded-full uppercase tracking-wider">Most Popular</div>}
                <div className="text-center mb-5 pt-1">
                  <h3 className="font-bold text-sm mb-2 uppercase tracking-wider" style={{ color: tier.color }}>{tier.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-black text-white">{tier.price}</span>
                    {tier.period && <span className="text-sm text-slate-500">{tier.period}</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{tier.desc}</p>
                </div>
                <div className="space-y-2 mb-5 flex-1">
                  {tier.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 size={12} style={{ color: tier.color }} className="flex-shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => tier.price === 'Custom' ? setAccountModalOpen(true) : setPage('builder')}
                  className="w-full py-2.5 rounded-xl font-bold text-xs transition-all duration-300"
                  style={{
                    background: tier.popular ? tier.color : 'rgba(255,255,255,0.03)',
                    color: tier.popular ? '#000' : tier.color,
                    border: tier.popular ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {tier.price === '$0' ? 'List for Free' : tier.price === 'Custom' ? 'Contact Us' : 'Get Started'}
                </button>
              </motion.div>
            ))}
          </StaggeredCards>

          {/* Partner Benefits */}
          <motion.div
            className="rounded-2xl border border-pink-500/20 p-8 sm:p-10 mb-12 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.04) 0%, rgba(0,0,0,0.97) 50%, rgba(168,85,247,0.04) 100%)' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black mb-4">Why Projects <span className="text-pink-400">Launch on GOATED</span></h3>
                <p className="text-slate-400 mb-6 leading-relaxed">
                  Stop burning ad budget on cold audiences. GOATED gives you direct access to a verified network of B2B closers who are actively looking for products to sell. AI matches your project with the right closers for your niche.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Users, text: '250K+ verified B2B leads and active closers in the network' },
                    { icon: Bot, text: 'AI-powered promotion that matches your project to ideal sellers' },
                    { icon: Megaphone, text: 'Community amplification across all GOATED channels' },
                    { icon: BarChart3, text: 'Real-time analytics on impressions, leads generated, and deals closed' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-pink-500/10 text-pink-400 flex-shrink-0">
                        <item.icon size={16} />
                      </div>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Success Metrics */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '142', label: 'Projects Launched', color: '#ec4899', suffix: '+' },
                  { value: '$4.2', label: 'Total Raised', color: '#a855f7', suffix: 'M' },
                  { value: '89', label: 'Active Partners', color: '#10b981', suffix: '' },
                  { value: '20', label: 'Recurring Rev Share', color: '#f59e0b', suffix: '%' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="bg-black/60 backdrop-blur rounded-xl p-5 border border-white/[0.04] text-center group hover:border-pink-500/20 transition-all duration-300"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="text-3xl font-black mb-1" style={{ color: stat.color }}>
                      {stat.value}{stat.suffix}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Referral CTA */}
          <motion.div className="text-center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="inline-flex flex-col items-center gap-4 p-6 rounded-2xl border border-pink-500/20 bg-pink-500/5">
              <p className="text-xl sm:text-2xl font-black text-white">Not a project? <span className="text-pink-400">Earn 20% as a referral partner.</span></p>
              <p className="text-sm text-slate-400 max-w-lg">Share your link, earn 20% recurring commission on every deal your referrals close. Instant Solana payouts. No cap on earnings. Program launching soon.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <GlowButton onClick={() => setPage('builder')} color="pink">
                  <Rocket size={18} />Launch on GOATED<ArrowRight size={16} />
                </GlowButton>
                <GlowButton onClick={() => setPage('leads')} variant="secondary">
                  Or Start Closing Yourself
                </GlowButton>
              </div>
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
            <h2 className="text-4xl lg:text-6xl font-black mb-4">Still Reading? <span className="text-brand">Just Fucking Start.</span></h2>
            <p className="text-xl text-slate-400 mb-4 max-w-2xl mx-auto">Your competition is paying $14K/yr for half these features while you're about to get everything for free. The math ain't mathing for them. It's mathing hard for you.</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500 mb-8">
              <span>$0 platform fee</span>
              <span className="text-slate-700">|</span>
              <span>10-15% on closed deals</span>
              <span className="text-slate-700">|</span>
              <span>2-5% betting spreads</span>
              <span className="text-slate-700">|</span>
              <span>1-2% crypto transactions</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <GlowButton onClick={() => setPage('leads')} color="brand" className="!px-12 !py-5 !text-xl">
                Start Printing Money <ArrowRight className="inline ml-2" size={22} />
              </GlowButton>
              <GlowButton onClick={() => setAiOpen(true)} variant="secondary" className="!px-8 !py-5 !text-xl">
                <Bot className="inline mr-2" size={22} />Talk to AI
              </GlowButton>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1"><Flame size={12} className="text-orange-400" />DEGEN MODE: Shift+D</span>
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
