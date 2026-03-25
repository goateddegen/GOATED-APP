import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Zap, TrendingUp, Clock, Users, DollarSign, Flame, Target, Globe,
  Brain, BarChart3, Activity, AlertTriangle, Trophy, Sparkles, ArrowUp,
  ArrowDown, ChevronRight, ExternalLink, Shield, Star, Radio, Timer,
  Layers, Crown, Lightbulb, Building2, CheckCircle2, XCircle, RefreshCw,
  Plus, Briefcase, Milestone, ArrowRight, Eye, Hash, X, Share2, MessageCircle,
  Medal, Award, ThumbsUp, Filter, ChevronDown, Send, GitBranch, Cpu,
  Code2, Coins, Wifi, Database, Lock, Megaphone, BadgeCheck,
  CircleDollarSign, Gem, ShieldCheck, Banknote, BarChart2, HeartHandshake
} from 'lucide-react';
const Vote = ThumbsUp;
import { useStore } from '../hooks/useStore';
import { useGoatedAI } from '../hooks/useGoatedAI';

// ============================================================================
// LAUNCHPAD - GenZ Startup Launch Platform
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
  { id: 'discover', label: 'Discover', icon: Globe },
  { id: 'incubator', label: 'Incubator', icon: Rocket },
  { id: 'dealflow', label: 'Deal Flow', icon: Briefcase },
  { id: 'partners', label: 'Partners', icon: HeartHandshake },
  { id: 'rankings', label: 'Rankings', icon: Trophy },
];

const PROJECT_CATEGORIES = ['All', 'SaaS', 'Creator Tools', 'DeFi', 'AI', 'E-commerce', 'Content', 'Services', 'Web3'];

const DISCOVER_CATEGORIES = ['All', 'SaaS', 'Creator Tools', 'DeFi', 'AI', 'E-commerce', 'Content', 'Services', 'Web3'];

const CATEGORY_COLORS = {
  SaaS: '#3b82f6', 'Creator Tools': '#ec4899', DeFi: '#f59e0b', AI: '#a855f7',
  'E-commerce': '#10b981', Content: '#06b6d4', Services: '#ef4444', Web3: '#84cc16',
};

const PROJECT_STAGES = {
  idea: { label: 'Idea', color: '#94a3b8', step: 0 },
  prototype: { label: 'Prototype', color: '#a855f7', step: 1 },
  beta: { label: 'Beta', color: '#f59e0b', step: 2 },
  launch: { label: 'Launch', color: '#3b82f6', step: 3 },
  scale: { label: 'Scale', color: '#10b981', step: 4 },
};

const STAGE_ORDER = ['idea', 'prototype', 'beta', 'launch', 'scale'];

const DEAL_FUNDING_STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth'];

const DEAL_FLOW_CATEGORIES = ['All', 'DeFi', 'AI', 'SaaS', 'Web3', 'FinTech', 'Infrastructure', 'Gaming'];

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
    'Strong signal from on-chain data',
    'Historical patterns suggest otherwise',
    'The macro environment supports this',
    'Tracking this closely, probability seems right',
    'Interesting divergence from consensus here',
    'My model gives this higher odds',
    'Following the institutional flow on this one',
    'Market is underpricing this outcome',
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
      followers: randInt(200, 25000),
      endsIn: pick(['2h', '6h', '1d', '3d', '1w', '2w', '30d', '90d']),
      trending: rng() > 0.6 ? (rng() > 0.5 ? 'up' : 'down') : null,
      change24h: +(rng() * 20 - 10).toFixed(1),
      userPrediction: null,
      trackingNow: randInt(3, 48),
      comments: generateComments(rng),
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
    const correct = Math.floor(rng() * 150) + 20;
    const incorrect = Math.floor(rng() * 80) + 5;
    const total = correct + incorrect;
    const accuracy = ((correct / total) * 100).toFixed(1);
    const streak = Math.floor(rng() * 12);
    const predictions = Math.floor(rng() * 300) + 30;
    return {
      rank: i + 1,
      name,
      avatar: AVATAR_COLORS[i % AVATAR_COLORS.length],
      accuracy: +accuracy,
      correct,
      incorrect,
      streak,
      predictions,
      isCurrentUser: name === '@closerking',
    };
  }).sort((a, b) => b.accuracy - a.accuracy).map((u, i) => ({ ...u, rank: i + 1 }));
}

function generateIncubatorProjects() {
  const rng = seedRng(99999);
  const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

  const projects = [
    {
      id: 'proj-1', name: 'YieldVault', tagline: 'Automated DeFi yield optimization',
      category: 'DeFi', stage: 'scale', teamSize: 8, fundingRaised: 2400000,
      communityMembers: 12400, upvotes: 842, monthlyGrowth: 34,
      founder: '@alphawhale', founderAvatar: '#3b82f6',
      description: 'AI-powered yield farming aggregator that automatically rebalances across 15+ DeFi protocols for optimal returns.',
      tags: ['Solana', 'DeFi', 'Yield'],
    },
    {
      id: 'proj-2', name: 'NeuralPitch', tagline: 'AI pitch deck generator for founders',
      category: 'AI', stage: 'launch', teamSize: 4, fundingRaised: 500000,
      communityMembers: 3200, upvotes: 567, monthlyGrowth: 62,
      founder: '@tradequeen', founderAvatar: '#a855f7',
      description: 'Generate investor-ready pitch decks in minutes. Trained on 10,000+ successful fundraising decks.',
      tags: ['AI', 'SaaS', 'Fundraising'],
    },
    {
      id: 'proj-3', name: 'ChainGuard', tagline: 'Real-time smart contract security',
      category: 'Web3', stage: 'beta', teamSize: 3, fundingRaised: 150000,
      communityMembers: 890, upvotes: 312, monthlyGrowth: 28,
      founder: '@diamondhands', founderAvatar: '#10b981',
      description: 'Automated smart contract auditing and real-time vulnerability monitoring for DeFi protocols.',
      tags: ['Security', 'Web3', 'Auditing'],
    },
    {
      id: 'proj-4', name: 'MetricFlow', tagline: 'Revenue analytics for SaaS founders',
      category: 'SaaS', stage: 'launch', teamSize: 5, fundingRaised: 800000,
      communityMembers: 5600, upvotes: 445, monthlyGrowth: 41,
      founder: '@profitpete', founderAvatar: '#f59e0b',
      description: 'One dashboard for MRR, churn, LTV, CAC, and 50+ SaaS metrics. Integrates with Stripe, Paddle, and more.',
      tags: ['Analytics', 'SaaS', 'Revenue'],
    },
    {
      id: 'proj-5', name: 'SolPay', tagline: 'Instant crypto payments for merchants',
      category: 'FinTech', stage: 'scale', teamSize: 12, fundingRaised: 5200000,
      communityMembers: 28000, upvotes: 1203, monthlyGrowth: 22,
      founder: '@stacksats', founderAvatar: '#ec4899',
      description: 'Accept SOL, USDC, and 20+ tokens at checkout. Instant settlement, 0.1% fees, no chargebacks.',
      tags: ['Payments', 'Crypto', 'Merchants'],
    },
    {
      id: 'proj-6', name: 'DataForge', tagline: 'No-code data pipeline builder',
      category: 'Infrastructure', stage: 'prototype', teamSize: 2, fundingRaised: 75000,
      communityMembers: 450, upvotes: 189, monthlyGrowth: 55,
      founder: '@moonboy99', founderAvatar: '#06b6d4',
      description: 'Visual data pipeline builder with 100+ connectors. ETL without writing code.',
      tags: ['Data', 'No-Code', 'ETL'],
    },
    {
      id: 'proj-7', name: 'CloserNet', tagline: 'AI-powered sales outreach platform',
      category: 'SaaS', stage: 'idea', teamSize: 1, fundingRaised: 0,
      communityMembers: 120, upvotes: 87, monthlyGrowth: 0,
      founder: '@closerking', founderAvatar: '#00ff88',
      description: 'Hyper-personalized cold outreach using AI that reads prospect signals from LinkedIn, Twitter, and on-chain activity.',
      tags: ['Sales', 'AI', 'Outreach'],
    },
    {
      id: 'proj-8', name: 'TrustGraph', tagline: 'On-chain reputation scoring',
      category: 'Web3', stage: 'idea', teamSize: 2, fundingRaised: 25000,
      communityMembers: 340, upvotes: 156, monthlyGrowth: 0,
      founder: '@vibecheck', founderAvatar: '#8b5cf6',
      description: 'Build verifiable reputation from on-chain history. Credit scores for the decentralized world.',
      tags: ['Identity', 'Web3', 'Reputation'],
    },
    {
      id: 'proj-9', name: 'FeedAI', tagline: 'Personalized content curation engine',
      category: 'AI', stage: 'launch', teamSize: 6, fundingRaised: 1100000,
      communityMembers: 7800, upvotes: 634, monthlyGrowth: 48,
      founder: '@wagmi_wes', founderAvatar: '#84cc16',
      description: 'AI that learns your interests and curates a feed from 500+ sources. Zero algorithmic manipulation.',
      tags: ['AI', 'Content', 'Curation'],
    },
    {
      id: 'proj-10', name: 'LiquidLayer', tagline: 'Cross-chain liquidity aggregation',
      category: 'DeFi', stage: 'beta', teamSize: 4, fundingRaised: 300000,
      communityMembers: 1600, upvotes: 278, monthlyGrowth: 37,
      founder: '@apemaxi', founderAvatar: '#f97316',
      description: 'Aggregate liquidity across 8 chains for the best swap rates. One click, best execution.',
      tags: ['DeFi', 'Cross-chain', 'Liquidity'],
    },
  ];
  return projects;
}

function generateDealFlowProjects() {
  const rng = seedRng(55555);
  const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  return [
    {
      id: 'deal-1', name: 'ArcLayer Protocol', category: 'DeFi',
      tagline: 'Next-gen L2 with native yield for staked assets',
      fundingStage: 'Series A', teamSize: 18, traction: { users: 42000, revenue: 1800000, growth: 28 },
      seeking: 8000000, tags: ['L2', 'Yield', 'Staking'], hot: true,
    },
    {
      id: 'deal-2', name: 'CognitiveOS', category: 'AI',
      tagline: 'Enterprise AI orchestration platform for Fortune 500',
      fundingStage: 'Series B', teamSize: 45, traction: { users: 320, revenue: 12000000, growth: 65 },
      seeking: 25000000, tags: ['Enterprise', 'AI Agents', 'Automation'], hot: true,
    },
    {
      id: 'deal-3', name: 'VaultKey', category: 'Web3',
      tagline: 'Self-custodial wallet with MPC and social recovery',
      fundingStage: 'Seed', teamSize: 7, traction: { users: 8500, revenue: 0, growth: 120 },
      seeking: 3000000, tags: ['Wallet', 'MPC', 'Security'], hot: false,
    },
    {
      id: 'deal-4', name: 'DataLoom', category: 'SaaS',
      tagline: 'Real-time data mesh for distributed teams',
      fundingStage: 'Pre-Seed', teamSize: 3, traction: { users: 150, revenue: 24000, growth: 45 },
      seeking: 750000, tags: ['Data', 'Collaboration', 'Real-time'], hot: false,
    },
    {
      id: 'deal-5', name: 'PayGrid', category: 'FinTech',
      tagline: 'Cross-border B2B payments on stablecoin rails',
      fundingStage: 'Series A', teamSize: 22, traction: { users: 1200, revenue: 5400000, growth: 38 },
      seeking: 12000000, tags: ['Payments', 'Stablecoin', 'B2B'], hot: true,
    },
    {
      id: 'deal-6', name: 'NodeForge', category: 'Infrastructure',
      tagline: 'One-click validator infrastructure for PoS chains',
      fundingStage: 'Seed', teamSize: 5, traction: { users: 620, revenue: 380000, growth: 52 },
      seeking: 2000000, tags: ['Validators', 'Staking', 'DevOps'], hot: false,
    },
    {
      id: 'deal-7', name: 'PixelVerse', category: 'Gaming',
      tagline: 'On-chain gaming engine with composable NFT assets',
      fundingStage: 'Seed', teamSize: 9, traction: { users: 15000, revenue: 200000, growth: 88 },
      seeking: 4000000, tags: ['Gaming', 'NFT', 'Engine'], hot: true,
    },
    {
      id: 'deal-8', name: 'SynthLab', category: 'AI',
      tagline: 'Synthetic data generation for ML model training',
      fundingStage: 'Pre-Seed', teamSize: 4, traction: { users: 90, revenue: 45000, growth: 70 },
      seeking: 1200000, tags: ['ML', 'Synthetic Data', 'Privacy'], hot: false,
    },
  ];
}

function generatePrivateDeals() {
  return [
    {
      id: 'priv-1', name: 'PHANTOM Token Launch', type: 'Token Launch',
      description: 'Exclusive pre-sale allocation for the Phantom Protocol governance token. 50x potential from IDO price.',
      allocation: '$500 - $5,000', roi: '15-50x projected', closes: '48h',
      minTier: 'degen', tags: ['Token', 'Governance', 'Early Access'],
    },
    {
      id: 'priv-2', name: 'ArcLayer Private Round', type: 'Private Round',
      description: 'Strategic round at $0.08/token before public sale at $0.25. 6-month cliff, 12-month vest.',
      allocation: '$1,000 - $25,000', roi: '3.1x at IDO', closes: '5d',
      minTier: 'degen', tags: ['L2', 'Private Sale', 'Vesting'],
    },
    {
      id: 'priv-3', name: 'CognitiveOS SAFE Note', type: 'Equity',
      description: 'Participate in the $25M Series B at a $180M valuation. AI enterprise with $12M ARR.',
      allocation: '$5,000 - $50,000', roi: 'Equity upside', closes: '12d',
      minTier: 'degen', tags: ['Equity', 'AI', 'Series B'],
    },
    {
      id: 'priv-4', name: 'DEGEN Genesis NFT Mint', type: 'NFT Drop',
      description: 'Genesis collection of 2,222 NFTs. Holders get lifetime access to all future private deals.',
      allocation: '0.5 SOL per mint', roi: 'Access + utility', closes: '24h',
      minTier: 'degen', tags: ['NFT', 'Access Pass', 'Genesis'],
    },
    {
      id: 'priv-5', name: 'PixelVerse Seed Extension', type: 'Private Round',
      description: 'Last chance to join the seed round. Gaming engine with 15K users and growing 88% MoM.',
      allocation: '$2,000 - $10,000', roi: '8-20x projected', closes: '3d',
      minTier: 'degen', tags: ['Gaming', 'Seed', 'Extension'],
    },
  ];
}

function generateAdFlowProjects() {
  const rng = seedRng(33333);
  const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  return [
    {
      id: 'ad-1', name: 'ArcLayer Protocol', tagline: 'The fastest L2 with native yield -- now live on mainnet',
      category: 'DeFi', type: 'featured', impressions: 284000, clicks: 12400, ctr: 4.4,
      image: null, link: '#', badge: 'Promoted',
    },
    {
      id: 'ad-2', name: 'CognitiveOS', tagline: 'Deploy AI agents across your entire org in minutes, not months',
      category: 'AI', type: 'featured', impressions: 156000, clicks: 8900, ctr: 5.7,
      image: null, link: '#', badge: 'Promoted',
    },
    {
      id: 'ad-3', name: 'PayGrid', tagline: 'Stop paying 3% on cross-border transfers. Pay 0.1% with stablecoins.',
      category: 'FinTech', type: 'sponsored', impressions: 98000, clicks: 5200, ctr: 5.3,
      image: null, link: '#', badge: 'Sponsored',
    },
    {
      id: 'ad-4', name: 'PixelVerse', tagline: 'Build games that players actually own. Open beta starts now.',
      category: 'Gaming', type: 'banner', impressions: 210000, clicks: 9800, ctr: 4.7,
      image: null, link: '#', badge: 'Promoted',
    },
    {
      id: 'ad-5', name: 'VaultKey', tagline: 'The wallet that recovers itself. No seed phrases. No stress.',
      category: 'Web3', type: 'sponsored', impressions: 72000, clicks: 4100, ctr: 5.7,
      image: null, link: '#', badge: 'Sponsored',
    },
    {
      id: 'ad-6', name: 'NodeForge', tagline: 'Run validators in 1 click. Earn staking rewards without the DevOps.',
      category: 'Infrastructure', type: 'banner', impressions: 45000, clicks: 2300, ctr: 5.1,
      image: null, link: '#', badge: 'Promoted',
    },
  ];
}

const fmtNum = (n) => {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return '' + n;
};

const fmtMoney = (n) => {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + n;
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
      <span className="text-[10px] text-slate-500">{count} tracking now</span>
    </div>
  );
}

// Progress stage indicator for incubator projects
function StageProgress({ stage }) {
  const stageInfo = PROJECT_STAGES[stage];
  const currentStep = stageInfo.step;

  return (
    <div className="flex items-center gap-1">
      {STAGE_ORDER.map((s, i) => {
        const info = PROJECT_STAGES[s];
        const isActive = i <= currentStep;
        const isCurrent = i === currentStep;
        return (
          <React.Fragment key={s}>
            <div
              className={'w-2 h-2 rounded-full transition-all ' + (isCurrent ? 'ring-2 ring-offset-1 ring-offset-black' : '')}
              style={{
                background: isActive ? info.color : 'rgba(255,255,255,0.06)',
                ringColor: isCurrent ? info.color : 'transparent',
              }}
              title={info.label}
            />
            {i < STAGE_ORDER.length - 1 && (
              <div className="w-3 h-px" style={{ background: isActive && i < currentStep ? info.color : 'rgba(255,255,255,0.06)' }} />
            )}
          </React.Fragment>
        );
      })}
      <span className="text-[9px] font-bold ml-1.5" style={{ color: stageInfo.color }}>
        {stageInfo.label}
      </span>
    </div>
  );
}

// Event detail expansion panel
function EventDetailExpansion({ event, degenMode }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      <div className="pt-3 mt-3 border-t border-white/[0.05] space-y-4">
        <div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Probability History</div>
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
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
            Discussion ({event.comments.length})
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
          Share Prediction
        </button>
      </div>
    </motion.div>
  );
}

// Prediction event card (no betting/wagering)
function EventCard({ event, degenMode, onPredict, expanded, onToggleExpand }) {
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
            <Eye size={9} />{event.trackingNow} watching
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
        <span className="flex items-center gap-1"><Users size={10} />{event.followers.toLocaleString()} followers</span>
        {event.change24h !== 0 && (
          <span className={'flex items-center gap-0.5 font-bold ' + (event.change24h > 0 ? 'text-emerald-400' : 'text-red-400')}>
            {event.change24h > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {Math.abs(event.change24h)}% 24h
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onPredict(event, 'yes')}
          className={'py-2 rounded-lg text-xs font-bold transition-all ' +
            (event.userPrediction === 'yes'
              ? 'bg-emerald-500 text-black'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20')
          }
        >
          {event.userPrediction === 'yes' ? <CheckCircle2 size={12} className="inline mr-1" /> : null}
          Predict YES
        </button>
        <button
          onClick={() => onPredict(event, 'no')}
          className={'py-2 rounded-lg text-xs font-bold transition-all ' +
            (event.userPrediction === 'no'
              ? 'bg-red-500 text-white'
              : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20')
          }
        >
          {event.userPrediction === 'no' ? <XCircle size={12} className="inline mr-1" /> : null}
          Predict NO
        </button>
      </div>

      <AnimatePresence>
        {expanded && <EventDetailExpansion event={event} degenMode={degenMode} />}
      </AnimatePresence>
    </motion.div>
  );
}

// Leaderboard row - prediction accuracy focused
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
            <span>{user.correct} correct / {user.incorrect} wrong</span>
            {user.streak > 0 && (
              <span className="flex items-center gap-0.5 text-orange-400">
                <Flame size={9} />{user.streak} streak
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className={'text-sm font-black ' + (user.accuracy >= 60 ? 'text-emerald-400' : user.accuracy >= 45 ? 'text-yellow-400' : 'text-red-400')}>
          {user.accuracy}%
        </div>
        <div className="text-[10px] text-slate-500">{user.predictions} predictions</div>
      </div>
    </motion.div>
  );
}

// Incubator project card
function ProjectCard({ project, degenMode, onUpvote, onView, onVote, hasVoted }) {
  const stageInfo = PROJECT_STAGES[project.stage];
  const accentColor = degenMode ? '#f97316' : '#00ff88';
  const categoryIcon = {
    DeFi: Coins,
    AI: Cpu,
    SaaS: Code2,
    Web3: Database,
    FinTech: DollarSign,
    Infrastructure: Layers,
    Social: Users,
  }[project.category] || Rocket;
  const CatIcon = categoryIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={'rounded-xl border p-4 transition-all duration-200 hover:border-white/[0.08] group ' +
        (degenMode ? 'alpha-panel degen-fire-border' : '')
      }
      style={{
        background: 'rgba(255,255,255,0.015)',
        borderColor: 'rgba(255,255,255,0.04)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: stageInfo.color + '15', border: '1px solid ' + stageInfo.color + '25' }}>
            <CatIcon size={16} style={{ color: stageInfo.color }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-brand transition-colors">{project.name}</h3>
            <p className="text-[10px] text-slate-500">{project.tagline}</p>
          </div>
        </div>
        <StageProgress stage={project.stage} />
      </div>

      <p className="text-[11px] text-slate-400 mb-3 leading-relaxed line-clamp-2">{project.description}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {project.tags.map(tag => (
          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500 border border-white/[0.05]">
            {tag}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
        <div className="text-center">
          <div className="text-[9px] text-slate-500 mb-0.5">Team</div>
          <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
            <Users size={10} className="text-slate-400" />
            {project.teamSize}
          </div>
        </div>
        <div className="text-center border-x border-white/[0.04]">
          <div className="text-[9px] text-slate-500 mb-0.5">Raised</div>
          <div className="text-xs font-bold text-white">
            {project.fundingRaised > 0 ? fmtMoney(project.fundingRaised) : '--'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-slate-500 mb-0.5">Community</div>
          <div className="text-xs font-bold text-white">{fmtNum(project.communityMembers)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black text-black"
              style={{ background: project.founderAvatar }}>
              {project.founder.slice(1, 3).toUpperCase()}
            </div>
            <span>{project.founder}</span>
          </div>
        </div>
        {project.monthlyGrowth > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-bold">
            <TrendingUp size={10} />
            +{project.monthlyGrowth}% /mo
          </span>
        )}
      </div>

      {/* Milestone progress */}
      <MilestoneTracker stage={project.stage} degenMode={degenMode} />

      <div className="flex gap-2">
        <button
          onClick={() => onUpvote(project.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white"
        >
          <ThumbsUp size={12} />
          {project.upvotes}
        </button>
        <button
          onClick={() => onVote && onVote(project.id)}
          className={'flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all border ' +
            (hasVoted
              ? 'bg-brand/15 text-brand border-brand/20'
              : 'bg-white/[0.04] text-slate-400 border-white/[0.06] hover:bg-white/[0.06] hover:text-white')
          }
        >
          <Vote size={12} />
          {hasVoted ? 'Voted' : 'Vote'}
        </button>
        <button
          onClick={() => onView(project.id)}
          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all text-black hover:brightness-110"
          style={{ background: accentColor }}
        >
          View Project
        </button>
      </div>
    </motion.div>
  );
}

// Project submission modal
function SubmitProjectModal({ onClose, degenMode }) {
  const accentColor = degenMode ? '#f97316' : '#00ff88';
  const [formData, setFormData] = useState({
    name: '', tagline: '', description: '', category: 'DeFi', stage: 'idea',
    website: '', teamSize: '1',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
        className="w-full max-w-lg rounded-2xl border p-6 relative max-h-[90vh] overflow-y-auto"
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

        {submitted ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: accentColor + '20' }}>
              <CheckCircle2 size={32} style={{ color: accentColor }} />
            </div>
            <h3 className="text-xl font-black text-white mb-1">Project Submitted!</h3>
            <p className="text-sm text-slate-400">Your project is under review. You will be notified when it goes live.</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 rounded-xl text-sm font-bold text-black"
              style={{ background: accentColor }}
            >
              Done
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-black text-white mb-1 flex items-center gap-2">
              <Rocket size={20} style={{ color: accentColor }} />
              Submit Your Project
            </h2>
            <p className="text-xs text-slate-400 mb-6">Get your startup in front of the GOATED community</p>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Project Name *</label>
                <input
                  required
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., YieldVault"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-brand/40 transition-colors placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tagline *</label>
                <input
                  required
                  value={formData.tagline}
                  onChange={e => setFormData(f => ({ ...f, tagline: e.target.value }))}
                  placeholder="One-line description"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-brand/40 transition-colors placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="What does your project do and what problem does it solve?"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-brand/40 transition-colors placeholder:text-slate-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-brand/40 transition-colors"
                  >
                    {PROJECT_CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c} className="bg-black">{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Stage</label>
                  <select
                    value={formData.stage}
                    onChange={e => setFormData(f => ({ ...f, stage: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-brand/40 transition-colors"
                  >
                    {STAGE_ORDER.map(s => (
                      <option key={s} value={s} className="bg-black">{PROJECT_STAGES[s].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Website</label>
                  <input
                    value={formData.website}
                    onChange={e => setFormData(f => ({ ...f, website: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-brand/40 transition-colors placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Team Size</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.teamSize}
                    onChange={e => setFormData(f => ({ ...f, teamSize: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-brand/40 transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 w-full py-3 rounded-xl text-sm font-black text-black transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background: accentColor }}
            >
              Submit Project for Review
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

// Deal Flow project card
function DealFlowCard({ deal, degenMode, onConnect }) {
  const accentColor = degenMode ? '#f97316' : '#00ff88';
  const stageColors = {
    'Pre-Seed': '#94a3b8', 'Seed': '#a855f7', 'Series A': '#3b82f6', 'Series B': '#10b981', 'Growth': '#f59e0b',
  };
  const stageColor = stageColors[deal.fundingStage] || '#64748b';
  const categoryIcon = {
    DeFi: Coins, AI: Cpu, SaaS: Code2, Web3: Database, FinTech: DollarSign,
    Infrastructure: Layers, Gaming: Rocket,
  }[deal.category] || Briefcase;
  const CatIcon = categoryIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={'rounded-xl border p-4 transition-all duration-200 hover:border-white/[0.08] group ' +
        (degenMode ? 'alpha-panel degen-fire-border' : '')}
      style={{ background: 'rgba(255,255,255,0.015)', borderColor: deal.hot ? stageColor + '30' : 'rgba(255,255,255,0.04)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: stageColor + '15', border: '1px solid ' + stageColor + '25' }}>
            <CatIcon size={16} style={{ color: stageColor }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-brand transition-colors flex items-center gap-2">
              {deal.name}
              {deal.hot && <Flame size={12} className="text-orange-400" />}
            </h3>
            <p className="text-[10px] text-slate-500">{deal.tagline}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
          style={{ background: stageColor + '20', color: stageColor, border: '1px solid ' + stageColor + '30' }}>
          {deal.fundingStage}
        </span>
        {deal.tags.map(tag => (
          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500 border border-white/[0.05]">
            {tag}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
        <div className="text-center">
          <div className="text-[9px] text-slate-500 mb-0.5">Team</div>
          <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
            <Users size={10} className="text-slate-400" />{deal.teamSize}
          </div>
        </div>
        <div className="text-center border-x border-white/[0.04]">
          <div className="text-[9px] text-slate-500 mb-0.5">Users</div>
          <div className="text-xs font-bold text-white">{fmtNum(deal.traction.users)}</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-slate-500 mb-0.5">Revenue</div>
          <div className="text-xs font-bold text-white">{deal.traction.revenue > 0 ? fmtMoney(deal.traction.revenue) : '--'}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] text-slate-500">
          Seeking <span className="text-white font-bold">{fmtMoney(deal.seeking)}</span>
        </div>
        <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-bold">
          <TrendingUp size={10} />+{deal.traction.growth}% /mo
        </span>
      </div>

      <button
        onClick={() => onConnect && onConnect(deal.name)}
        className="w-full py-2 rounded-lg text-xs font-bold transition-all text-black hover:brightness-110 flex items-center justify-center gap-1.5"
        style={{ background: accentColor }}
      >
        <Briefcase size={12} />
        Connect
      </button>
    </motion.div>
  );
}

// Private deal card (DEGEN only)
function PrivateDealCard({ deal, degenMode, locked, onAccessDeal }) {
  const accentColor = '#f97316';
  const typeColors = {
    'Token Launch': '#f59e0b', 'Private Round': '#a855f7', 'Equity': '#3b82f6', 'NFT Drop': '#ec4899',
  };
  const typeColor = typeColors[deal.type] || '#64748b';

  if (locked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border p-4 relative overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.04)' }}
      >
        <div className="absolute inset-0 backdrop-blur-sm bg-black/60 z-10 flex flex-col items-center justify-center">
          <Lock size={24} className="text-slate-500 mb-2" />
          <p className="text-xs font-bold text-slate-400">DEGEN Mode Required</p>
          <p className="text-[10px] text-slate-600 mt-1">Enable DEGEN mode to access private deals</p>
        </div>
        <div className="opacity-20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-white/[0.04]" />
            <div>
              <div className="h-3 w-24 bg-white/[0.06] rounded" />
              <div className="h-2 w-16 bg-white/[0.04] rounded mt-1" />
            </div>
          </div>
          <div className="h-8 bg-white/[0.03] rounded mb-2" />
          <div className="h-8 bg-white/[0.03] rounded" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border p-4 transition-all duration-200 hover:border-orange-500/20 group alpha-panel degen-fire-border"
      style={{ background: 'rgba(255,255,255,0.015)', borderColor: 'rgba(249,115,22,0.15)' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: typeColor + '15', border: '1px solid ' + typeColor + '25' }}>
            <Gem size={16} style={{ color: typeColor }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">{deal.name}</h3>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{ background: typeColor + '20', color: typeColor }}>
              {deal.type}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-orange-400 font-bold">
          <Clock size={10} />Closes in {deal.closes}
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">{deal.description}</p>

      <div className="grid grid-cols-2 gap-2 mb-3 p-2 rounded-lg bg-white/[0.02] border border-orange-500/10">
        <div>
          <div className="text-[9px] text-slate-500 mb-0.5">Allocation</div>
          <div className="text-xs font-bold text-white">{deal.allocation}</div>
        </div>
        <div>
          <div className="text-[9px] text-slate-500 mb-0.5">Expected ROI</div>
          <div className="text-xs font-bold text-emerald-400">{deal.roi}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {deal.tags.map(tag => (
          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/[0.08] text-orange-300 border border-orange-500/15">
            {tag}
          </span>
        ))}
      </div>

      <button
        onClick={() => onAccessDeal && onAccessDeal(deal.name)}
        className="w-full py-2 rounded-lg text-xs font-bold transition-all text-black hover:brightness-110 flex items-center justify-center gap-1.5 bg-orange-500"
      >
        <ShieldCheck size={12} />
        Access Deal
      </button>
    </motion.div>
  );
}

// Ad Flow card
function AdFlowCard({ ad, degenMode, onLearnMore }) {
  const accentColor = degenMode ? '#f97316' : '#00ff88';
  const catColors = {
    DeFi: '#f59e0b', AI: '#a855f7', SaaS: '#3b82f6', Web3: '#10b981',
    FinTech: '#06b6d4', Infrastructure: '#ec4899', Gaming: '#ef4444',
  };
  const catColor = catColors[ad.category] || '#64748b';
  const isFeatured = ad.type === 'featured';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={'rounded-xl border p-4 transition-all duration-200 hover:border-white/[0.08] group relative ' +
        (isFeatured ? 'ring-1 ring-brand/10' : '') +
        (degenMode ? ' alpha-panel degen-fire-border' : '')}
      style={{
        background: isFeatured
          ? 'linear-gradient(135deg, rgba(0,255,136,0.02), rgba(168,85,247,0.02))'
          : 'rgba(255,255,255,0.015)',
        borderColor: isFeatured ? accentColor + '20' : 'rgba(255,255,255,0.04)',
      }}
    >
      <div className="absolute top-3 right-3">
        <span className={'text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ' +
          (ad.badge === 'Promoted'
            ? 'bg-brand/15 text-brand border border-brand/20'
            : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
          )
        }>
          {ad.badge}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: catColor + '15', border: '1px solid ' + catColor + '25' }}>
          <Megaphone size={18} style={{ color: catColor }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white group-hover:text-brand transition-colors">{ad.name}</h3>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500">{ad.category}</span>
        </div>
      </div>

      <p className="text-[12px] text-slate-300 mb-3 leading-relaxed font-medium">{ad.tagline}</p>

      <div className="flex items-center gap-4 mb-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><Eye size={10} />{fmtNum(ad.impressions)} views</span>
        <span className="flex items-center gap-1"><BarChart2 size={10} />{ad.ctr}% CTR</span>
      </div>

      <button
        onClick={() => onLearnMore && onLearnMore(ad.name)}
        className="w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border hover:brightness-110"
        style={{ background: accentColor + '12', color: accentColor, borderColor: accentColor + '25' }}
      >
        <ExternalLink size={12} />
        Learn More
      </button>
    </motion.div>
  );
}

// Milestone progress bar for incubator
function MilestoneTracker({ stage, degenMode }) {
  const accentColor = degenMode ? '#f97316' : '#00ff88';
  const stageInfo = PROJECT_STAGES[stage];
  const currentStep = stageInfo.step;
  const progress = ((currentStep) / (STAGE_ORDER.length - 1)) * 100;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        {STAGE_ORDER.map((s, i) => {
          const info = PROJECT_STAGES[s];
          const isComplete = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={s} className="flex flex-col items-center flex-1">
              <div
                className={'w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black transition-all ' +
                  (isComplete ? 'text-black' : isCurrent ? 'text-black ring-2 ring-offset-1 ring-offset-black' : 'text-slate-600 border border-white/[0.08]')}
                style={{
                  background: isComplete || isCurrent ? info.color : 'rgba(255,255,255,0.03)',
                  ringColor: isCurrent ? info.color : 'transparent',
                }}
              >
                {isComplete ? <CheckCircle2 size={12} /> : i + 1}
              </div>
              <span className={'text-[8px] font-bold mt-1 ' + (isComplete || isCurrent ? '' : 'text-slate-600')}
                style={{ color: isComplete || isCurrent ? info.color : undefined }}>
                {info.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: stageInfo.color }}
          initial={{ width: 0 }}
          animate={{ width: progress + '%' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// Announcement banner for homepage upsell
export function LaunchPadBanner({ degenMode }) {
  const accentColor = degenMode ? '#f97316' : '#00ff88';
  return (
    <div
      className="p-4 rounded-xl border relative overflow-hidden group cursor-pointer hover:border-brand/20 transition-all"
      style={{
        background: 'linear-gradient(135deg, rgba(0,255,136,0.03), rgba(168,85,247,0.03))',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, ' + accentColor + ', transparent)' }} />
      <div className="flex items-center justify-between flex-wrap gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: accentColor + '15' }}>
            <Rocket size={20} style={{ color: accentColor }} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              LaunchPad is Live
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand/15 text-brand font-bold tracking-wider">NEW</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Track real-time predictions, submit your startup to the Incubator, and climb the accuracy leaderboard.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">20 live predictions</span>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: accentColor + '15', color: accentColor }}>
            Explore <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function LaunchPadPage() {
  const degenMode = useStore(s => s.degenMode);
  const { regime } = useGoatedAI();
  const [tab, setTab] = useState('dealflow');
  const [catFilter, setCatFilter] = useState('All');
  const [projCatFilter, setProjCatFilter] = useState('All');
  const [projStageFilter, setProjStageFilter] = useState('All');
  const [dealCatFilter, setDealCatFilter] = useState('All');
  const [events, setEvents] = useState(generateEvents);
  const leaderboard = useMemo(generateLeaderboard, []);
  const [projects, setProjects] = useState(generateIncubatorProjects);
  const dealFlowProjects = useMemo(generateDealFlowProjects, []);
  const privateDeals = useMemo(generatePrivateDeals, []);
  const adFlowProjects = useMemo(generateAdFlowProjects, []);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [totalTrackingNow, setTotalTrackingNow] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [projectVotes, setProjectVotes] = useState({});

  // Toast notification
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const showToast = useCallback((msg) => { setToastMsg(msg); setToastVisible(true); }, []);

  useEffect(() => {
    if (toastVisible) {
      const t = setTimeout(() => setToastVisible(false), 2500);
      return () => clearTimeout(t);
    }
  }, [toastVisible]);

  useEffect(() => {
    setTotalTrackingNow(events.reduce((s, e) => s + e.trackingNow, 0));
  }, [events]);

  // Real-time probability updates
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
          followers: e.followers + Math.floor(Math.random() * 20),
          trackingNow: Math.max(1, e.trackingNow + Math.floor(Math.random() * 5) - 2),
        };
      }));
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  const handlePredict = useCallback((event, position) => {
    setEvents(prev => prev.map(e =>
      e.id === event.id
        ? { ...e, userPrediction: e.userPrediction === position ? null : position }
        : e
    ));
  }, []);

  const handleUpvote = useCallback((projectId) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, upvotes: p.upvotes + 1 } : p
    ));
  }, []);

  const filteredEvents = useMemo(() =>
    catFilter === 'All' ? events : events.filter(e => e.category === catFilter),
    [events, catFilter]
  );

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (projCatFilter !== 'All') result = result.filter(p => p.category === projCatFilter);
    if (projStageFilter !== 'All') result = result.filter(p => p.stage === projStageFilter);
    return result;
  }, [projects, projCatFilter, projStageFilter]);

  const filteredDeals = useMemo(() =>
    dealCatFilter === 'All' ? dealFlowProjects : dealFlowProjects.filter(d => d.category === dealCatFilter),
    [dealFlowProjects, dealCatFilter]
  );

  const handleVote = useCallback((projectId) => {
    setProjectVotes(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  }, []);

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
              <p className="text-xs text-slate-500">Deal flow, incubator, predictions & closing platform</p>
            </div>
          </div>
          <LiveIndicator count={totalTrackingNow} degenMode={degenMode} />
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

      {/* DEAL FLOW TAB */}
      {tab === 'dealflow' && (
        <div>
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-brand/[0.05] to-blue-500/[0.03] border border-brand/10">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2">
                  <HeartHandshake size={20} style={{ color: accentColor }} />
                  Deal Flow
                </h2>
                <p className="text-xs text-slate-400 mt-1">Featured projects seeking partnerships and investment</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <CircleDollarSign size={12} className="text-emerald-400" />
                <span>{dealFlowProjects.length} active deals</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Active Deals', value: dealFlowProjects.length, icon: Briefcase, color: '#a855f7' },
              { label: 'Total Seeking', value: fmtMoney(dealFlowProjects.reduce((s, d) => s + d.seeking, 0)), icon: DollarSign, color: '#10b981' },
              { label: 'Avg Team Size', value: Math.round(dealFlowProjects.reduce((s, d) => s + d.teamSize, 0) / dealFlowProjects.length), icon: Users, color: '#06b6d4' },
              { label: 'Hot Deals', value: dealFlowProjects.filter(d => d.hot).length, icon: Flame, color: '#f59e0b' },
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

          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            {DEAL_FLOW_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setDealCatFilter(cat)}
                className={'px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ' +
                  (dealCatFilter === cat
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDeals.map(deal => (
              <DealFlowCard key={deal.id} deal={deal} degenMode={degenMode} onConnect={(name) => showToast(`Connection request sent to ${name} — they'll be in touch.`)} />
            ))}
          </div>

          {filteredDeals.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <Briefcase size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No deals in this category</p>
            </div>
          )}
        </div>
      )}

      {/* PRIVATE DEALS TAB (DEGEN GATED) */}
      {tab === 'privatedeals' && (
        <div>
          <div className="mb-6 p-4 rounded-xl border"
            style={{
              background: degenMode
                ? 'linear-gradient(135deg, rgba(249,115,22,0.05), rgba(168,85,247,0.03))'
                : 'rgba(255,255,255,0.015)',
              borderColor: degenMode ? '#f9731620' : 'rgba(255,255,255,0.06)',
            }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2">
                  {degenMode ? <Gem size={20} className="text-orange-400" /> : <Lock size={20} className="text-slate-500" />}
                  Private Deals
                  {degenMode && <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 font-bold tracking-wider">DEGEN ACCESS</span>}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {degenMode
                    ? 'Exclusive early access deals, token launches, and private investment rounds'
                    : 'Enable DEGEN mode to unlock exclusive private deals and early access opportunities'}
                </p>
              </div>
              {degenMode && (
                <div className="flex items-center gap-2 text-[10px] text-orange-400 font-bold">
                  <ShieldCheck size={14} />
                  {privateDeals.length} exclusive deals
                </div>
              )}
            </div>
          </div>

          {!degenMode && (
            <div className="mb-6 p-6 rounded-xl border border-white/[0.06] bg-white/[0.01] text-center">
              <Lock size={40} className="mx-auto mb-3 text-slate-600" />
              <h3 className="text-base font-black text-white mb-1">DEGEN Mode Required</h3>
              <p className="text-sm text-slate-400 mb-4 max-w-md mx-auto">
                Private deals are exclusive to DEGEN mode users. Enable DEGEN mode in settings to access token launches, private rounds, and early access opportunities.
              </p>
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-600">
                <Shield size={10} />Verified deals only &mdash; curated by the GOATED team
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {privateDeals.map(deal => (
              <PrivateDealCard key={deal.id} deal={deal} degenMode={degenMode} locked={!degenMode} onAccessDeal={(name) => showToast(`Requesting access to ${name} — verification in progress.`)} />
            ))}
          </div>
        </div>
      )}

      {/* AD FLOW TAB */}
      {tab === 'adflow' && (
        <div>
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-yellow-500/[0.03] via-transparent to-brand/[0.03] border"
            style={{ borderColor: accentColor + '15' }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2">
                  <Megaphone size={20} style={{ color: accentColor }} />
                  Ad Flow
                </h2>
                <p className="text-xs text-slate-400 mt-1">Promoted projects and sponsored content from the GOATED ecosystem</p>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:brightness-110"
                style={{ background: accentColor + '12', color: accentColor, borderColor: accentColor + '25' }}
              >
                <Plus size={14} />
                Promote Your Project
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Active Campaigns', value: adFlowProjects.length, icon: Megaphone, color: '#a855f7' },
              { label: 'Total Impressions', value: fmtNum(adFlowProjects.reduce((s, a) => s + a.impressions, 0)), icon: Eye, color: '#06b6d4' },
              { label: 'Total Clicks', value: fmtNum(adFlowProjects.reduce((s, a) => s + a.clicks, 0)), icon: Target, color: '#10b981' },
              { label: 'Avg CTR', value: (adFlowProjects.reduce((s, a) => s + a.ctr, 0) / adFlowProjects.length).toFixed(1) + '%', icon: BarChart2, color: '#f59e0b' },
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

          {/* Featured section */}
          {adFlowProjects.filter(a => a.type === 'featured').length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Star size={12} className="text-yellow-400" />
                Featured Projects
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {adFlowProjects.filter(a => a.type === 'featured').map(ad => (
                  <AdFlowCard key={ad.id} ad={ad} degenMode={degenMode} onLearnMore={(name) => showToast(`${name} details coming soon — project page under construction.`)} />
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Megaphone size={12} />
              Sponsored &amp; Banners
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {adFlowProjects.filter(a => a.type !== 'featured').map(ad => (
                <AdFlowCard key={ad.id} ad={ad} degenMode={degenMode} onLearnMore={(name) => showToast(`${name} details coming soon — project page under construction.`)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PREDICTIONS TAB */}
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
              { label: 'Active Predictions', value: events.length, icon: Zap, color: '#a855f7' },
              { label: 'Total Followers', value: fmtNum(events.reduce((s, e) => s + e.followers, 0)), icon: Users, color: '#06b6d4' },
              { label: 'Your Predictions', value: events.filter(e => e.userPrediction).length, icon: Target, color: '#10b981' },
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
                onPredict={handlePredict}
                expanded={expandedEvent === event.id}
                onToggleExpand={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
              />
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <Zap size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No predictions in this category yet</p>
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
                  Prediction Leaderboard
                </h2>
                <p className="text-xs text-slate-400 mt-1">Top predictors ranked by accuracy</p>
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
              { label: 'Total Predictors', value: leaderboard.length, icon: Users, color: '#06b6d4' },
              { label: 'Top Accuracy', value: leaderboard[0]?.accuracy + '%' || '--', icon: Target, color: '#10b981' },
              { label: 'Total Predictions', value: fmtNum(leaderboard.reduce((s, u) => s + u.predictions, 0)), icon: BarChart3, color: '#a855f7' },
              { label: 'Your Rank', value: '#' + (leaderboard.find(u => u.isCurrentUser)?.rank || '-'), icon: Trophy, color: '#f59e0b' },
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

      {/* INCUBATOR TAB */}
      {tab === 'incubator' && (
        <div>
          {/* Incubator header */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-brand/[0.05] to-purple-500/[0.03] border border-brand/10">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2">
                  <Building2 size={20} className="text-brand" />
                  GOATED Incubator
                </h2>
                <p className="text-xs text-slate-400 mt-1">Build, launch, and scale your startup with AI-powered tools and the GOATED network</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-black hover:brightness-110 transition-all"
                  style={{ background: accentColor }}
                >
                  <Plus size={14} />
                  Submit Project
                </button>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:brightness-110"
                  style={{ background: accentColor + '12', color: accentColor, borderColor: accentColor + '25' }}
                >
                  <Rocket size={14} />
                  Apply for Incubation
                </button>
              </div>
            </div>
          </div>

          {/* Milestone Tracker Overview */}
          <div className="mb-6 p-4 rounded-xl bg-white/[0.015] border border-white/[0.04]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Milestone size={12} />
              Incubation Milestones
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {STAGE_ORDER.map((s, i) => {
                const info = PROJECT_STAGES[s];
                const count = projects.filter(p => p.stage === s).length;
                const descriptions = {
                  idea: 'Concept validation & market research',
                  prototype: 'MVP development & early testing',
                  beta: 'Beta testing & user feedback',
                  launch: 'Public launch & growth',
                  scale: 'Scaling & expansion',
                };
                return (
                  <div key={s} className="text-center p-3 rounded-lg border relative"
                    style={{ background: info.color + '06', borderColor: info.color + '15' }}>
                    <div className="text-2xl font-black" style={{ color: info.color }}>{count}</div>
                    <div className="text-[10px] font-bold" style={{ color: info.color }}>{info.label}</div>
                    <div className="text-[8px] text-slate-600 mt-1">{descriptions[s]}</div>
                    {i < STAGE_ORDER.length - 1 && (
                      <ArrowRight size={10} className="absolute -right-1.5 top-1/2 -translate-y-1/2 text-slate-700 hidden sm:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Active Projects', value: projects.length, icon: Rocket, color: '#a855f7' },
              { label: 'Total Raised', value: fmtMoney(projects.reduce((s, p) => s + p.fundingRaised, 0)), icon: DollarSign, color: '#10b981' },
              { label: 'Community', value: fmtNum(projects.reduce((s, p) => s + p.communityMembers, 0)), icon: Users, color: '#06b6d4' },
              { label: 'Scaling', value: projects.filter(p => p.stage === 'scale').length, icon: TrendingUp, color: '#f59e0b' },
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

          {/* Community Voting Section */}
          <div className="mb-6 p-4 rounded-xl bg-white/[0.015] border border-white/[0.04]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Vote size={12} />
              Community Voting
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">Vote on projects you believe in. Top-voted projects get priority for incubation resources, mentorship, and funding.</p>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="text-slate-500">Your votes: <span className="font-bold text-white">{Object.values(projectVotes).filter(Boolean).length}</span></span>
              <span className="text-slate-500">Total projects: <span className="font-bold text-white">{projects.length}</span></span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {PROJECT_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setProjCatFilter(cat)}
                  className={'px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ' +
                    (projCatFilter === cat
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
            <div className="flex gap-1.5 overflow-x-auto pb-1 ml-auto">
              <button
                onClick={() => setProjStageFilter('All')}
                className={'px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ' +
                  (projStageFilter === 'All'
                    ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                    : 'text-slate-500 hover:text-slate-300 bg-white/[0.02] border border-white/[0.04]')
                }
              >
                All Stages
              </button>
              {STAGE_ORDER.map(s => {
                const info = PROJECT_STAGES[s];
                return (
                  <button
                    key={s}
                    onClick={() => setProjStageFilter(s === projStageFilter ? 'All' : s)}
                    className={'px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ' +
                      (projStageFilter === s
                        ? 'border'
                        : 'text-slate-500 hover:text-slate-300 bg-white/[0.02] border border-white/[0.04]')
                    }
                    style={projStageFilter === s ? {
                      background: info.color + '15',
                      color: info.color,
                      borderColor: info.color + '30',
                    } : {}}
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                degenMode={degenMode}
                onUpvote={handleUpvote}
                onView={(id) => { const p = projects.find(x => x.id === id); showToast(`${p?.name || 'Project'} details page coming soon.`); }}
                onVote={handleVote}
                hasVoted={!!projectVotes[project.id]}
              />
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-16 text-slate-500 mb-8">
              <Rocket size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No projects match these filters</p>
            </div>
          )}

          {/* Quick Launch section */}
          <div className="mb-6 p-5 rounded-xl border border-brand/15 bg-black/30 relative overflow-hidden">
            <h3 className="text-sm font-bold text-brand mb-3 flex items-center gap-2">
              <Lightbulb size={16} />
              Quick Launch &mdash; Start a Business in 60 Seconds
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              onClick={() => setShowSubmitModal(true)}
              className="mt-3 w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all hover:brightness-110"
              style={{ background: accentColor + '15', color: accentColor, borderColor: accentColor + '25' }}
            >
              <Rocket size={14} />
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Submit Project Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <SubmitProjectModal
            onClose={() => setShowSubmitModal(false)}
            degenMode={degenMode}
          />
        )}
      </AnimatePresence>

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
