import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Zap, TrendingUp, Clock, Users, DollarSign, Flame, Target, Globe,
  Brain, BarChart3, Activity, AlertTriangle, Trophy, Sparkles, ArrowUp,
  ArrowDown, ChevronRight, ExternalLink, Shield, Star, Radio, Timer,
  Layers, Crown, Lightbulb, Building2, CheckCircle2, XCircle, RefreshCw,
  Plus, Briefcase, Milestone, ArrowRight, Eye, Hash, X, Share2, MessageCircle,
  Medal, Award
} from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useGoatedAI } from '../hooks/useGoatedAI';

// ============================================================================
// LAUNCHPAD - Live Events, Prediction Betting, Leaderboard & Incubator
// ============================================================================

// Seeded RNG for deterministic mock data
function seedRng(s) {
  let h = s | 0;
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}

const TABS = [
  { id: 'events', label: 'Live Events', icon: Zap },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'incubator', label: 'Incubator', icon: Rocket },
];

const EVENT_CATEGORIES = ['All', 'Crypto', 'Politics', 'Tech', 'Business', 'Sports', 'Culture'];

const CATEGORY_COLORS = {
  Crypto: '#f59e0b', Politics: '#3b82f6', Tech: '#a855f7',
  Business: '#10b981', Sports: '#ef4444', Culture: '#ec4899',
};

const SIM_USERS = [
  '@closerking', '@degenmaster', '@alphawhale', '@diamondhands', '@moonboy99',
  '@profitpete', '@tradequeen', '@yoloswaggins', '@sendbets', '@stacksats',
  '@bullrunner', '@bearslayer', '@gigachad_bets', '@rektproof', '@vibecheck',
  '@dripgod', '@apemaxi', '@wagmi_wes', '@nocaptrader', '@flipsidejay',
];

const AVATAR_COLORS = [
  '#f59e0b', '#3b82f6', '#a855f7', '#10b981', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#8b5cf6',
];

function generateComments(rng) {
  const texts = [
    'This is a lock, easy money',
    'No way this happens before deadline',
    'Just aped in with max size',
    'Hedging my position here',
    'The smart money is on YES',
    'Probability is mispriced imo',
    'Diamond handing this one',
    'Market is sleeping on this',
  ];
  const count = Math.floor(rng() * 4) + 2;
  const comments = [];
  for (let i = 0; i < count; i++) {
    comments.push({
      user: SIM_USERS[Math.floor(rng() * SIM_USERS.length)],
      text: texts[Math.floor(rng() * texts.length)],
      time: Math.floor(rng() * 58) + 1 + 'm ago',
      color: AVATAR_COLORS[Math.floor(rng() * AVATAR_COLORS.length)],
    });
  }
  return comments;
}

function generateOrderBook(rng, currentProb) {
  const yesLevels = [];
  const noLevels = [];
  for (let i = 0; i < 5; i++) {
    yesLevels.push({
      price: Math.max(1, currentProb - (i + 1) * 2),
      qty: Math.floor(rng() * 5000) + 500,
    });
    noLevels.push({
      price: Math.max(1, (100 - currentProb) - (i + 1) * 2),
      qty: Math.floor(rng() * 5000) + 500,
    });
  }
  return { yes: yesLevels, no: noLevels };
}

function generateEvents() {
  const rng = seedRng(42069);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

  const templates = [
    { title: 'BTC above $100K by June 2026', cat: 'Crypto', hot: true },
    { title: 'SOL flips ETH market cap this year', cat: 'Crypto', hot: false },
    { title: 'Fed cuts rates before July', cat: 'Politics', hot: true },
    { title: 'Trump wins 2028 primary', cat: 'Politics', hot: false },
    { title: 'Apple announces AI hardware at WWDC', cat: 'Tech', hot: true },
    { title: 'OpenAI IPO before 2027', cat: 'Tech', hot: false },
    { title: 'Tesla deliveries beat Q2 estimates', cat: 'Business', hot: false },
    { title: 'Nvidia hits $5T market cap', cat: 'Tech', hot: true },
    { title: 'Chiefs win Super Bowl LXI', cat: 'Sports', hot: false },
    { title: 'ETH above $5K by September', cat: 'Crypto', hot: true },
    { title: 'TikTok ban upheld by Supreme Court', cat: 'Politics', hot: true },
    { title: 'Recession declared in 2026', cat: 'Business', hot: false },
    { title: 'Spotify reaches 1B users', cat: 'Tech', hot: false },
    { title: 'DOGE coin reaches $1', cat: 'Crypto', hot: true },
    { title: 'Lakers win NBA Championship', cat: 'Sports', hot: false },
    { title: 'US inflation below 2% by EOY', cat: 'Business', hot: true },
    { title: 'New COVID variant causes lockdowns', cat: 'Culture', hot: false },
    { title: 'Anthropic valued above $100B', cat: 'Tech', hot: true },
    { title: 'Gold reaches $3,500/oz', cat: 'Business', hot: false },
    { title: 'World Cup 2026 viewership record', cat: 'Sports', hot: true },
  ];

  return templates.map((t, i) => {
    const baseProb = randInt(15, 85);
    const history = [baseProb];
    let p = baseProb;
    for (let j = 1; j < 20; j++) {
      p = Math.max(5, Math.min(95, p + (rng() - 0.48) * 6));
      history.push(Math.round(p));
    }
    return {
      id: 'evt-' + i,
      title: t.title,
      category: t.cat,
      hot: t.hot,
      yesProb: history[history.length - 1],
      priceHistory: history,
      volume: randInt(50, 5000) * 1000,
      participants: randInt(200, 25000),
      endsIn: pick(['2h', '6h', '1d', '3d', '1w', '2w', '30d', '90d']),
      trending: rng() > 0.6 ? (rng() > 0.5 ? 'up' : 'down') : null,
      change24h: +(rng() * 20 - 10).toFixed(1),
      userPosition: null,
      bettingNow: randInt(3, 48),
      comments: generateComments(rng),
      orderBook: generateOrderBook(rng, history[history.length - 1]),
    };
  });
}

function generateLeaderboard() {
  const rng = seedRng(77777);
  const names = [
    '@closerking', '@degenmaster', '@alphawhale', '@diamondhands', '@moonboy99',
    '@profitpete', '@tradequeen', '@yoloswaggins', '@sendbets', '@stacksats',
    '@bullrunner', '@bearslayer', '@gigachad_bets', '@rektproof', '@vibecheck',
    '@dripgod', '@apemaxi', '@wagmi_wes', '@nocaptrader', '@flipsidejay',
  ];
  return names.map((name, i) => {
    const wins = Math.floor(rng() * 150) + 20;
    const losses = Math.floor(rng() * 80) + 5;
    const pnl = (rng() * 60000) - 8000;
    const streak = Math.floor(rng() * 12);
    const wagered = Math.floor(rng() * 200000) + 5000;
    return {
      rank: i + 1,
      name,
      avatar: AVATAR_COLORS[i % AVATAR_COLORS.length],
      pnl: +pnl.toFixed(2),
      wins,
      losses,
      streak,
      wagered,
      isCurrentUser: name === '@closerking',
    };
  }).sort((a, b) => b.pnl - a.pnl).map((u, i) => ({ ...u, rank: i + 1 }));
}

const fmtVol = (n) => {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + n;
};

const fmtPnl = (n) => {
  const prefix = n >= 0 ? '+' : '';
  if (Math.abs(n) >= 1e3) return prefix + '$' + (n / 1e3).toFixed(1) + 'K';
  return prefix + '$' + n.toFixed(0);
};

// Sparkline SVG chart
function Sparkline({ data, width = 120, height = 32, color = '#00ff88' }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return x + ',' + y;
  }).join(' ');
  const lastX = width;
  const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}

// LIVE pulsing indicator
function LiveIndicator({ count, degenMode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <div className={'w-2 h-2 rounded-full ' + (degenMode ? 'bg-orange-500' : 'bg-red-500')} />
          <div className={'absolute inset-0 w-2 h-2 rounded-full animate-ping ' + (degenMode ? 'bg-orange-500' : 'bg-red-500')} />
        </div>
        <span className={'text-[10px] font-black tracking-widest ' + (degenMode ? 'text-orange-400' : 'text-red-400')}>LIVE</span>
      </div>
      <span className="text-[10px] text-slate-500">{count} people betting now</span>
    </div>
  );
}

// Full-screen betting overlay for degen mode
function BettingOverlay({ event, position, degenMode, onClose, onConfirm }) {
  const [amount, setAmount] = useState(50);
  const [multiplier, setMultiplier] = useState(1.0);
  const [recentBets, setRecentBets] = useState([]);
  const [confirmed, setConfirmed] = useState(false);

  const price = position === 'yes' ? event.yesProb / 100 : (100 - event.yesProb) / 100;
  const payout = (amount / price).toFixed(2);
  const mockBalance = 1000;
  const accentColor = degenMode ? '#f97316' : '#00ff88';

  useEffect(() => {
    const iv = setInterval(() => {
      setMultiplier(prev => {
        const delta = (Math.random() - 0.48) * 0.08;
        return Math.max(1.01, +(prev + delta).toFixed(2));
      });
    }, 800);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const initial = [];
    for (let i = 0; i < 5; i++) {
      initial.push({
        id: i,
        user: SIM_USERS[Math.floor(Math.random() * SIM_USERS.length)],
        side: Math.random() > 0.4 ? 'YES' : 'NO',
        amount: Math.floor(Math.random() * 500) + 10,
        time: Math.floor(Math.random() * 30) + 1 + 's ago',
      });
    }
    setRecentBets(initial);
    const iv = setInterval(() => {
      setRecentBets(prev => {
        const newBet = {
          id: Date.now(),
          user: SIM_USERS[Math.floor(Math.random() * SIM_USERS.length)],
          side: Math.random() > 0.4 ? 'YES' : 'NO',
          amount: Math.floor(Math.random() * 500) + 10,
          time: 'just now',
        };
        return [newBet, ...prev.slice(0, 6)];
      });
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => onConfirm(amount), 1200);
  };

  const presets = [25, 50, 100, 250, 500];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="w-full max-w-lg rounded-2xl border p-6 relative"
        style={{
          background: 'rgba(10,10,10,0.98)',
          borderColor: accentColor + '30',
          boxShadow: '0 0 60px ' + accentColor + '15',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        {confirmed ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: accentColor + '20' }}>
              <CheckCircle2 size={32} style={{ color: accentColor }} />
            </div>
            <h3 className="text-xl font-black text-white mb-1">Bet Placed!</h3>
            <p className="text-sm text-slate-400">${amount} on {position.toUpperCase()} @ ${price.toFixed(2)}</p>
            <p className="text-xs mt-2" style={{ color: accentColor }}>Potential payout: ${payout}</p>
          </motion.div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                  style={{
                    background: position === 'yes' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: position === 'yes' ? '#10b981' : '#ef4444',
                    border: '1px solid ' + (position === 'yes' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'),
                  }}>
                  {position.toUpperCase()} Position
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-400 border border-white/[0.06]">
                  {event.category}
                </span>
              </div>
              <h2 className="text-lg font-black text-white leading-snug">{event.title}</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[10px] text-slate-500 mb-1">Current Price</div>
                <div className="text-2xl font-black" style={{ color: position === 'yes' ? '#10b981' : '#ef4444' }}>
                  ${price.toFixed(2)}
                </div>
              </div>
              <div className="p-3 rounded-xl border"
                style={{ background: accentColor + '05', borderColor: accentColor + '20' }}>
                <div className="text-[10px] text-slate-500 mb-1">Live Multiplier</div>
                <motion.div
                  key={multiplier}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-black"
                  style={{ color: accentColor }}
                >
                  {multiplier.toFixed(2)}x
                </motion.div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-bold">Bet Amount (USDC)</span>
                <span className="text-[10px] text-slate-500">Balance: ${mockBalance.toLocaleString()}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(Math.max(1, Math.min(mockBalance, Number(e.target.value) || 0)))}
                  className="w-full pl-7 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-lg font-bold focus:outline-none focus:border-brand/40 transition-colors"
                  style={{ caretColor: accentColor }}
                />
              </div>
              <div className="flex gap-2 mt-2">
                {presets.map(p => (
                  <button
                    key={p}
                    onClick={() => setAmount(p)}
                    className={'flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ' +
                      (amount === p
                        ? 'text-black'
                        : 'bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06]')
                    }
                    style={amount === p ? { background: accentColor } : {}}
                  >
                    ${p}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] mb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Potential Payout</span>
                <span className="text-lg font-black" style={{ color: accentColor }}>${payout}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-500">Return on investment</span>
                <span className="text-xs font-bold" style={{ color: accentColor }}>
                  {((Number(payout) / amount - 1) * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              className="w-full py-3.5 rounded-xl text-sm font-black transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                background: position === 'yes'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: position === 'yes' ? '#000' : '#fff',
              }}
            >
              Place {position.toUpperCase()} Bet - ${amount}
            </button>

            <div className="mt-5 pt-4 border-t border-white/[0.05]">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={12} className="text-slate-500" />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Recent bets</span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                <AnimatePresence>
                  {recentBets.map(bet => (
                    <motion.div
                      key={bet.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{bet.user}</span>
                        <span className={'font-bold ' + (bet.side === 'YES' ? 'text-emerald-400' : 'text-red-400')}>
                          {bet.side}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">${bet.amount}</span>
                        <span className="text-slate-600">{bet.time}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// Event detail expansion panel
function EventDetailExpansion({ event, degenMode }) {
  const maxQty = Math.max(
    ...event.orderBook.yes.map(l => l.qty),
    ...event.orderBook.no.map(l => l.qty),
  );

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      <div className="pt-3 mt-3 border-t border-white/[0.05] space-y-4">
        <div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Price History</div>
          <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04]">
            <Sparkline
              data={event.priceHistory}
              width={240}
              height={40}
              color={event.yesProb > 50 ? '#10b981' : '#ef4444'}
            />
            <div className="flex items-center justify-between mt-1 text-[9px] text-slate-600">
              <span>24h ago</span>
              <span>Now</span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Order Book</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[9px] text-emerald-400 font-bold mb-1 uppercase">YES Bids</div>
              {event.orderBook.yes.map((level, i) => (
                <div key={i} className="flex items-center gap-1 mb-0.5 relative">
                  <div className="absolute inset-0 rounded bg-emerald-500/[0.06]"
                    style={{ width: (level.qty / maxQty) * 100 + '%' }} />
                  <span className="text-[10px] text-emerald-400 font-mono w-8 relative z-10">${(level.price / 100).toFixed(2)}</span>
                  <span className="text-[10px] text-slate-500 relative z-10">{level.qty.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[9px] text-red-400 font-bold mb-1 uppercase">NO Bids</div>
              {event.orderBook.no.map((level, i) => (
                <div key={i} className="flex items-center gap-1 mb-0.5 relative">
                  <div className="absolute inset-0 rounded bg-red-500/[0.06]"
                    style={{ width: (level.qty / maxQty) * 100 + '%' }} />
                  <span className="text-[10px] text-red-400 font-mono w-8 relative z-10">${(level.price / 100).toFixed(2)}</span>
                  <span className="text-[10px] text-slate-500 relative z-10">{level.qty.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
            Comments ({event.comments.length})
          </div>
          <div className="space-y-1.5">
            {event.comments.map((c, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.015]">
                <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5"
                  style={{ background: c.color + '30', border: '1px solid ' + c.color + '40' }} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-300">{c.user}</span>
                    <span className="text-[9px] text-slate-600">{c.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-brand transition-colors font-bold">
          <Share2 size={10} />
          Share Event
        </button>
      </div>
    </motion.div>
  );
}

// Event card with inline expansion
function EventCard({ event, degenMode, onBet, expanded, onToggleExpand }) {
  const catColor = CATEGORY_COLORS[event.category] || '#64748b';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={'rounded-xl border p-4 transition-all duration-200 hover:border-white/[0.08] group cursor-pointer ' +
        (degenMode ? 'alpha-panel degen-fire-border' : '')
      }
      style={{
        background: 'rgba(255,255,255,0.015)',
        borderColor: expanded ? (degenMode ? '#f9731640' : '#00ff8840') : event.hot ? catColor + '30' : 'rgba(255,255,255,0.04)',
      }}
    >
      <div className="flex items-start justify-between mb-3" onClick={onToggleExpand}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
            style={{ background: catColor + '20', color: catColor, border: '1px solid ' + catColor + '30' }}>
            {event.category}
          </span>
          {event.hot && (
            <span className="flex items-center gap-0.5 text-[10px] text-orange-400">
              <Flame size={10} />HOT
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600 flex items-center gap-1">
            <Users size={9} />{event.bettingNow} live
          </span>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Clock size={10} />
            {event.endsIn}
          </div>
        </div>
      </div>

      <h3 className="text-sm font-bold text-white mb-3 leading-snug group-hover:text-brand transition-colors"
        onClick={onToggleExpand}>
        {event.title}
      </h3>

      <div className="mb-3">
        <div className="flex justify-between text-[11px] mb-1">
          <span className="text-emerald-400 font-bold">YES {event.yesProb}%</span>
          <span className="text-red-400 font-bold">NO {100 - event.yesProb}%</span>
        </div>
        <div className="h-2 rounded-full bg-red-500/30 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: event.yesProb + '%' }} />
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-3">
        <span className="flex items-center gap-1"><DollarSign size={10} />{fmtVol(event.volume)}</span>
        <span className="flex items-center gap-1"><Users size={10} />{event.participants.toLocaleString()}</span>
        {event.change24h !== 0 && (
          <span className={'flex items-center gap-0.5 font-bold ' + (event.change24h > 0 ? 'text-emerald-400' : 'text-red-400')}>
            {event.change24h > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {Math.abs(event.change24h)}%
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onBet(event, 'yes')}
          className={'py-2 rounded-lg text-xs font-bold transition-all ' +
            (event.userPosition === 'yes'
              ? 'bg-emerald-500 text-black'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20')
          }
        >
          {event.userPosition === 'yes' ? <CheckCircle2 size={12} className="inline mr-1" /> : null}
          YES ${(event.yesProb / 100).toFixed(2)}
        </button>
        <button
          onClick={() => onBet(event, 'no')}
          className={'py-2 rounded-lg text-xs font-bold transition-all ' +
            (event.userPosition === 'no'
              ? 'bg-red-500 text-white'
              : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20')
          }
        >
          {event.userPosition === 'no' ? <XCircle size={12} className="inline mr-1" /> : null}
          NO ${((100 - event.yesProb) / 100).toFixed(2)}
        </button>
      </div>

      <AnimatePresence>
        {expanded && <EventDetailExpansion event={event} degenMode={degenMode} />}
      </AnimatePresence>
    </motion.div>
  );
}

// Leaderboard row
function LeaderboardRow({ user, degenMode }) {
  const accentColor = degenMode ? '#f97316' : '#00ff88';
  const rankBadge = user.rank === 1 ? { icon: Crown, color: '#f59e0b' }
    : user.rank === 2 ? { icon: Medal, color: '#94a3b8' }
    : user.rank === 3 ? { icon: Award, color: '#cd7f32' }
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={'flex items-center gap-3 p-3 rounded-xl border transition-all ' +
        (user.isCurrentUser
          ? 'border-brand/20 bg-brand/[0.04]'
          : 'border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.02]')
      }
      style={user.isCurrentUser ? { boxShadow: '0 0 20px ' + accentColor + '08' } : {}}
    >
      <div className="w-8 text-center flex-shrink-0">
        {rankBadge ? (
          <div className="flex flex-col items-center">
            <rankBadge.icon size={16} style={{ color: rankBadge.color }} />
            <span className="text-[8px] font-bold" style={{ color: rankBadge.color }}>{user.rank}</span>
          </div>
        ) : (
          <span className="text-sm font-black text-slate-500">#{user.rank}</span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-black"
          style={{ background: user.avatar }}>
          {user.name.slice(1, 3).toUpperCase()}
        </div>
        <div className="min-w-0">
          <span className={'text-xs font-bold truncate block ' + (user.isCurrentUser ? 'text-brand' : 'text-white')}>
            {user.name}
            {user.isCurrentUser && <span className="text-[9px] text-brand/60 ml-1">(you)</span>}
          </span>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>{user.wins}W / {user.losses}L</span>
            {user.streak > 0 && (
              <span className="flex items-center gap-0.5 text-orange-400">
                <Flame size={9} />{user.streak}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className={'text-sm font-black ' + (user.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
          {fmtPnl(user.pnl)}
        </div>
        <div className="text-[10px] text-slate-500">{fmtVol(user.wagered)} wagered</div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function LaunchPadPage() {
  const degenMode = useStore(s => s.degenMode);
  const { regime, sentiment, predictions } = useGoatedAI();
  const [tab, setTab] = useState('events');
  const [catFilter, setCatFilter] = useState('All');
  const [events, setEvents] = useState(generateEvents);
  const leaderboard = useMemo(generateLeaderboard, []);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [bettingOverlay, setBettingOverlay] = useState(null);
  const [totalBettingNow, setTotalBettingNow] = useState(0);

  useEffect(() => {
    setTotalBettingNow(events.reduce((s, e) => s + e.bettingNow, 0));
  }, [events]);

  useEffect(() => {
    const iv = setInterval(() => {
      setEvents(prev => prev.map(e => {
        const shift = (Math.random() - 0.48) * 3;
        const newProb = Math.max(5, Math.min(95, e.yesProb + shift));
        const newHistory = [...e.priceHistory.slice(1), Math.round(newProb)];
        return {
          ...e,
          yesProb: Math.round(newProb),
          priceHistory: newHistory,
          participants: e.participants + Math.floor(Math.random() * 20),
          volume: e.volume + Math.floor(Math.random() * 10000),
          bettingNow: Math.max(1, e.bettingNow + Math.floor(Math.random() * 5) - 2),
        };
      }));
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  const handleBet = useCallback((event, position) => {
    if (degenMode) {
      setBettingOverlay({ event, position });
    } else {
      setEvents(prev => prev.map(e =>
        e.id === event.id
          ? { ...e, userPosition: e.userPosition === position ? null : position }
          : e
      ));
    }
  }, [degenMode]);

  const handleBetConfirm = useCallback((amount) => {
    if (!bettingOverlay) return;
    setEvents(prev => prev.map(e =>
      e.id === bettingOverlay.event.id
        ? { ...e, userPosition: bettingOverlay.position }
        : e
    ));
    setTimeout(() => setBettingOverlay(null), 1500);
  }, [bettingOverlay]);

  const filteredEvents = useMemo(() =>
    catFilter === 'All' ? events : events.filter(e => e.category === catFilter),
    [events, catFilter]
  );

  const accentColor = degenMode ? '#f97316' : '#00ff88';

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-1">
            <div className={'w-10 h-10 rounded-xl flex items-center justify-center ' +
              (degenMode ? 'bg-orange-500/15' : 'bg-brand/10')
            }>
              <Rocket size={22} className={degenMode ? 'text-orange-400' : 'text-brand'} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                LaunchPad
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/15 text-brand font-bold tracking-wider">BETA</span>
              </h1>
              <p className="text-xs text-slate-500">Live events, predictions & leaderboard</p>
            </div>
          </div>
          <LiveIndicator count={totalBettingNow} degenMode={degenMode} />
        </div>
      </div>

      {/* AI Regime Banner */}
      {regime && (
        <div className="mb-4 p-3 rounded-xl border border-brand/10 bg-brand/[0.03]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-brand" />
              <span className="text-xs font-bold text-brand">GOATED AI:</span>
              <span className="text-xs text-slate-300">{regime?.name || 'Analyzing'} &mdash; {regime?.description || 'Computing market regime...'}</span>
            </div>
            <span className="text-[10px] text-slate-500">{regime?.action || 'Stand by for signals'}</span>
          </div>
        </div>
      )}

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

      {/* LIVE EVENTS TAB */}
      {tab === 'events' && (
        <div>
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            {EVENT_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={'px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ' +
                  (catFilter === cat
                    ? degenMode
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                      : 'bg-brand/15 text-brand border border-brand/20'
                    : 'text-slate-500 hover:text-slate-300 bg-white/[0.02] border border-white/[0.04]')
                }
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Live Events', value: events.length, icon: Zap, color: '#a855f7' },
              { label: 'Total Volume', value: fmtVol(events.reduce((s, e) => s + e.volume, 0)), icon: DollarSign, color: '#10b981' },
              { label: 'Participants', value: events.reduce((s, e) => s + e.participants, 0).toLocaleString(), icon: Users, color: '#06b6d4' },
              { label: 'Hot Events', value: events.filter(e => e.hot).length, icon: Flame, color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon size={14} style={{ color: s.color }} />
                  <span className="text-[10px] text-slate-500">{s.label}</span>
                </div>
                <div className="text-lg font-black text-white">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                degenMode={degenMode}
                onBet={handleBet}
                expanded={expandedEvent === event.id}
                onToggleExpand={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
              />
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <Zap size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No events in this category yet</p>
            </div>
          )}
        </div>
      )}

      {/* LEADERBOARD TAB */}
      {tab === 'leaderboard' && (
        <div>
          <div className="mb-6 p-4 rounded-xl border bg-gradient-to-r from-yellow-500/[0.03] via-transparent to-purple-500/[0.03]"
            style={{ borderColor: accentColor + '15' }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2">
                  <Trophy size={20} style={{ color: accentColor }} />
                  GOATED Leaderboard
                </h2>
                <p className="text-xs text-slate-400 mt-1">Top performers ranked by profit & loss</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><Crown size={10} className="text-yellow-500" /> Gold</span>
                <span className="flex items-center gap-1"><Medal size={10} className="text-slate-400" /> Silver</span>
                <span className="flex items-center gap-1"><Award size={10} className="text-orange-600" /> Bronze</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Players', value: leaderboard.length, icon: Users, color: '#06b6d4' },
              { label: 'Top P&L', value: fmtPnl(leaderboard[0]?.pnl || 0), icon: TrendingUp, color: '#10b981' },
              { label: 'Total Wagered', value: fmtVol(leaderboard.reduce((s, u) => s + u.wagered, 0)), icon: DollarSign, color: '#a855f7' },
              { label: 'Your Rank', value: '#' + (leaderboard.find(u => u.isCurrentUser)?.rank || '-'), icon: Target, color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon size={14} style={{ color: s.color }} />
                  <span className="text-[10px] text-slate-500">{s.label}</span>
                </div>
                <div className="text-lg font-black text-white">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            {leaderboard.map(user => (
              <LeaderboardRow key={user.name} user={user} degenMode={degenMode} />
            ))}
          </div>
        </div>
      )}

      {/* INCUBATOR TAB (Coming Soon) */}
      {tab === 'incubator' && (
        <div>
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-brand/[0.05] to-purple-500/[0.03] border border-brand/10">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2">
                  <Building2 size={20} className="text-brand" />
                  GOATED Incubator
                </h2>
                <p className="text-xs text-slate-400 mt-1">Build, launch, and scale your startup with AI-powered tools and a network of closers</p>
              </div>
              <span className="text-[10px] px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-bold tracking-wider">
                COMING SOON
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Active Projects', value: '0', icon: Rocket, color: '#a855f7' },
              { label: 'Combined MRR', value: '$0', icon: DollarSign, color: '#10b981' },
              { label: 'Total Users', value: '0', icon: Users, color: '#06b6d4' },
              { label: 'Avg Progress', value: '\u2014', icon: Target, color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon size={14} style={{ color: s.color }} />
                  <span className="text-[10px] text-slate-500">{s.label}</span>
                </div>
                <div className="text-lg font-black text-white">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] mb-8">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
              <Rocket size={28} className="text-brand opacity-50" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">No Projects Yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              The GOATED Incubator is launching soon. Be the first to submit your startup and get access to AI-powered tools, a network of closers, and 500K+ leads.
            </p>
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-black text-sm font-bold hover:bg-emerald-400 transition-colors">
              <Plus size={16} />
              Submit the First Project
            </button>
          </div>

          <div className="mb-6 p-5 rounded-xl border border-brand/15 bg-black/30 relative overflow-hidden">
            <div className="absolute top-3 right-3 text-[9px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-bold tracking-wider z-10">
              LAUNCHING SOON
            </div>

            <h3 className="text-sm font-bold text-brand mb-3 flex items-center gap-2">
              <Lightbulb size={16} />
              Quick Launch &mdash; Start a Business in 60 Seconds
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 opacity-60">
              {[
                { step: '1', title: 'Pick Your Niche', desc: 'AI selects the highest-opportunity niche based on market data', icon: Target },
                { step: '2', title: 'Generate MVP', desc: 'GOATED AI builds your landing page, pitch deck, and outreach', icon: Brain },
                { step: '3', title: 'Start Closing', desc: 'Leverage 500K+ leads to find your first 10 customers', icon: Trophy },
              ].map((s, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-brand/15 flex items-center justify-center text-brand text-[10px] font-black">{s.step}</div>
                    <s.icon size={14} className="text-brand" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-0.5">{s.title}</h4>
                  <p className="text-[10px] text-slate-500">{s.desc}</p>
                </div>
              ))}
            </div>
            <button
              disabled
              className="mt-3 w-full py-2.5 rounded-lg bg-white/[0.05] text-slate-500 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-2 border border-white/[0.06]"
            >
              <Rocket size={14} />
              Coming Soon
            </button>
          </div>
        </div>
      )}

      {/* BETTING OVERLAY (Degen Mode) */}
      <AnimatePresence>
        {bettingOverlay && (
          <BettingOverlay
            event={bettingOverlay.event}
            position={bettingOverlay.position}
            degenMode={degenMode}
            onClose={() => setBettingOverlay(null)}
            onConfirm={handleBetConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
