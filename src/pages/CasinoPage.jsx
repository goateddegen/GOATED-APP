import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dice5, TrendingUp, Clock, Users, Zap, Trophy, DollarSign, BarChart3, Flame, Target, Radio, ExternalLink, ArrowUp, ArrowDown, ChevronRight, AlertTriangle, Newspaper, Star, Sparkles, Coins, RefreshCw, Wifi, Check, X, Minus, Plus, ChevronDown, Activity, Award, Percent, History, Wallet, CreditCard, ArrowRightLeft, Shield, Lock, Unlock, Volume2, VolumeX, Brain, Eye, Gift } from 'lucide-react';
import { useGoatedAI } from '../hooks/useGoatedAI';
import { useStore } from '../hooks/useStore';

// ---------------------------------------------------------------------------
// GOAT Token helpers — sync with WalletPage localStorage
// ---------------------------------------------------------------------------
const GOAT_BALANCE_KEY = 'goated_goat_balance';
const CASINO_BETS_KEY = 'goated_casino_bets';
const CASINO_RESOLVED_KEY = 'goated_casino_resolved';
const WALLET_KEY = 'goated_wallet';
const COMMISSION_RATE = 0.12; // 12% commission on winnings
const BET_HISTORY_KEY = 'goated_casino_bet_history';
const DAILY_BONUS_KEY = 'goated_daily_bonus';
const STREAK_KEY = 'goated_streaks';

function loadGoatBalance() {
  try {
    const v = localStorage.getItem(GOAT_BALANCE_KEY);
    return v !== null ? parseFloat(v) : 1000; // default 1000 GOAT welcome credits
  } catch { return 1000; }
}
function saveGoatBalance(bal) {
  try { localStorage.setItem(GOAT_BALANCE_KEY, String(bal)); } catch {}
}
function loadSavedBets(key) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : [];
  } catch { return []; }
}
function saveBets(key, bets) {
  try { localStorage.setItem(key, JSON.stringify(bets)); } catch {}
}
function loadWallet() {
  try {
    const v = localStorage.getItem(WALLET_KEY);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}
function saveWallet(w) {
  try {
    if (w) localStorage.setItem(WALLET_KEY, JSON.stringify(w));
    else localStorage.removeItem(WALLET_KEY);
  } catch {}
}
function loadStreaks() {
  try {
    const v = localStorage.getItem(STREAK_KEY);
    return v ? JSON.parse(v) : { win: 0, loss: 0, best: 0 };
  } catch { return { win: 0, loss: 0, best: 0 }; }
}
function saveStreaks(s) {
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(s)); } catch {}
}
function loadBetHistory() {
  try {
    const v = localStorage.getItem(BET_HISTORY_KEY);
    return v ? JSON.parse(v) : [];
  } catch { return []; }
}
function saveBetHistory(h) {
  try { localStorage.setItem(BET_HISTORY_KEY, JSON.stringify(h.slice(-50))); } catch {} // keep last 50
}
function canClaimDailyBonus() {
  try {
    const last = localStorage.getItem(DAILY_BONUS_KEY);
    if (!last) return true;
    const lastDate = new Date(parseInt(last));
    const now = new Date();
    return lastDate.toDateString() !== now.toDateString();
  } catch { return true; }
}
function claimDailyBonusStorage() {
  try { localStorage.setItem(DAILY_BONUS_KEY, String(Date.now())); } catch {}
}

// ---------------------------------------------------------------------------
// Markets data — 24 markets across categories
// ---------------------------------------------------------------------------
const initialMarkets = [
  // Crypto (6)
  { id: 1, q: 'Will Bitcoin hit $150K by Q2 2026?', yes: 2.8, no: 1.5, category: 'Crypto', volume: 8700000, ends: '2026-06-30', hot: true, yesPercent: 35, source: 'CoinDesk', resolution: 'btc_price', target: 150000, betsYes: 1240, betsNo: 2300, oddsHistory: [2.6, 2.7, 2.8, 2.9, 2.8, 2.7, 2.8] },
  { id: 2, q: 'Will BTC be above $100K by Friday?', yes: 1.4, no: 3.0, category: 'Crypto', volume: 3200000, ends: '2026-02-27', hot: true, yesPercent: 72, source: 'CoinGecko', resolution: 'btc_price', target: 100000, betsYes: 5100, betsNo: 2000, oddsHistory: [1.5, 1.4, 1.3, 1.4, 1.5, 1.4, 1.4] },
  { id: 3, q: 'Will ETH be above $4K this month?', yes: 2.2, no: 1.7, category: 'Crypto', volume: 4100000, ends: '2026-02-28', hot: false, yesPercent: 45, source: 'CoinGecko', resolution: 'eth_price', target: 4000, betsYes: 1850, betsNo: 2260, oddsHistory: [2.0, 2.1, 2.2, 2.3, 2.2, 2.1, 2.2] },
  { id: 4, q: 'Will SOL break $300 by March?', yes: 3.5, no: 1.3, category: 'Crypto', volume: 2600000, ends: '2026-03-31', hot: false, yesPercent: 25, source: 'CoinDesk', resolution: 'sol_price', target: 300, betsYes: 650, betsNo: 1950, oddsHistory: [3.2, 3.3, 3.5, 3.4, 3.5, 3.6, 3.5] },
  { id: 5, q: 'Will total crypto market cap exceed $5T?', yes: 2.0, no: 1.8, category: 'Crypto', volume: 5500000, ends: '2026-04-30', hot: true, yesPercent: 50, source: 'CoinMarketCap', betsYes: 3200, betsNo: 3150, oddsHistory: [1.9, 2.0, 2.1, 2.0, 1.9, 2.0, 2.0] },
  { id: 6, q: 'Will a Bitcoin ETF hit $100B AUM?', yes: 1.8, no: 2.1, category: 'Crypto', volume: 4800000, ends: '2026-06-30', hot: false, yesPercent: 55, source: 'Bloomberg', betsYes: 2700, betsNo: 2200, oddsHistory: [1.7, 1.8, 1.9, 1.8, 1.7, 1.8, 1.8] },
  // AI (4)
  { id: 7, q: 'Will OpenAI launch GPT-5 by Q2 2026?', yes: 1.6, no: 2.5, category: 'AI', volume: 6200000, ends: '2026-06-30', hot: true, yesPercent: 62, source: 'TechCrunch', betsYes: 4100, betsNo: 2500, oddsHistory: [1.7, 1.6, 1.5, 1.6, 1.7, 1.6, 1.6] },
  { id: 8, q: 'Will AI generate 10% of all code by 2027?', yes: 1.3, no: 4.0, category: 'AI', volume: 3900000, ends: '2027-01-01', hot: false, yesPercent: 78, source: 'McKinsey', betsYes: 5500, betsNo: 1550, oddsHistory: [1.4, 1.3, 1.2, 1.3, 1.4, 1.3, 1.3] },
  { id: 9, q: 'Will Anthropic raise at $100B+ valuation?', yes: 2.4, no: 1.6, category: 'AI', volume: 2800000, ends: '2026-12-31', hot: true, yesPercent: 40, source: 'The Information', betsYes: 1120, betsNo: 1680, oddsHistory: [2.2, 2.3, 2.4, 2.5, 2.4, 2.3, 2.4] },
  { id: 10, q: 'Will AI agents autonomously close a $1M deal?', yes: 5.0, no: 1.2, category: 'AI', volume: 1500000, ends: '2026-12-31', hot: false, yesPercent: 15, source: 'Wired', betsYes: 225, betsNo: 1275, oddsHistory: [4.5, 4.8, 5.0, 5.2, 5.0, 4.8, 5.0] },
  // M&A (4)
  { id: 11, q: 'Will TikTok be acquired by a US company?', yes: 3.0, no: 1.4, category: 'M&A', volume: 7100000, ends: '2026-06-30', hot: true, yesPercent: 30, source: 'Reuters', betsYes: 2130, betsNo: 4970, oddsHistory: [2.8, 2.9, 3.0, 3.1, 3.0, 2.9, 3.0] },
  { id: 12, q: 'Will Adobe acquire Figma (retry)?', yes: 4.0, no: 1.25, category: 'M&A', volume: 2400000, ends: '2026-12-31', hot: false, yesPercent: 20, source: 'Bloomberg', betsYes: 480, betsNo: 1920, oddsHistory: [3.5, 3.8, 4.0, 4.2, 4.0, 3.8, 4.0] },
  { id: 13, q: 'Will Stripe IPO in 2026?', yes: 1.5, no: 2.8, category: 'M&A', volume: 5800000, ends: '2026-12-31', hot: true, yesPercent: 65, source: 'CNBC', betsYes: 3770, betsNo: 2030, oddsHistory: [1.6, 1.5, 1.4, 1.5, 1.6, 1.5, 1.5] },
  { id: 14, q: 'Will there be a $50B+ tech acquisition in Q2?', yes: 2.2, no: 1.7, category: 'M&A', volume: 3600000, ends: '2026-06-30', hot: false, yesPercent: 45, source: 'WSJ', betsYes: 1620, betsNo: 1980, oddsHistory: [2.0, 2.1, 2.2, 2.3, 2.2, 2.1, 2.2] },
  // IPO (3)
  { id: 15, q: 'Will Reddit hit $100/share by mid-2026?', yes: 2.0, no: 1.85, category: 'IPO', volume: 4200000, ends: '2026-06-30', hot: false, yesPercent: 48, source: 'Yahoo Finance', betsYes: 2016, betsNo: 2184, oddsHistory: [1.9, 2.0, 2.1, 2.0, 1.9, 2.0, 2.0] },
  { id: 16, q: 'Will Databricks IPO in 2026?', yes: 1.7, no: 2.3, category: 'IPO', volume: 3100000, ends: '2026-12-31', hot: true, yesPercent: 58, source: 'Bloomberg', betsYes: 1798, betsNo: 1302, oddsHistory: [1.8, 1.7, 1.6, 1.7, 1.8, 1.7, 1.7] },
  { id: 17, q: 'Will SpaceX go public before 2027?', yes: 6.0, no: 1.15, category: 'IPO', volume: 8900000, ends: '2027-01-01', hot: true, yesPercent: 12, source: 'Reuters', betsYes: 1068, betsNo: 7832, oddsHistory: [5.5, 5.8, 6.0, 6.2, 6.0, 5.8, 6.0] },
  // Regulation (3)
  { id: 18, q: 'Will US pass crypto regulation by 2026?', yes: 1.9, no: 1.95, category: 'Regulation', volume: 4600000, ends: '2026-12-31', hot: true, yesPercent: 51, source: 'The Block', betsYes: 2346, betsNo: 2254, oddsHistory: [1.8, 1.9, 2.0, 1.9, 1.8, 1.9, 1.9] },
  { id: 19, q: 'Will EU ban AI-generated deepfakes?', yes: 2.5, no: 1.55, category: 'Regulation', volume: 2100000, ends: '2026-12-31', hot: false, yesPercent: 38, source: 'EuroNews', betsYes: 798, betsNo: 1302, oddsHistory: [2.3, 2.4, 2.5, 2.6, 2.5, 2.4, 2.5] },
  { id: 20, q: 'Will SEC approve Ethereum staking ETF?', yes: 2.1, no: 1.75, category: 'Regulation', volume: 3800000, ends: '2026-06-30', hot: true, yesPercent: 47, source: 'CoinDesk', betsYes: 1786, betsNo: 2014, oddsHistory: [2.0, 2.1, 2.2, 2.1, 2.0, 2.1, 2.1] },
  // Startups (2)
  { id: 21, q: 'Will a solo-founder unicorn emerge in 2026?', yes: 3.2, no: 1.35, category: 'Startups', volume: 1800000, ends: '2026-12-31', hot: false, yesPercent: 28, source: 'TechCrunch', betsYes: 504, betsNo: 1296, oddsHistory: [3.0, 3.1, 3.2, 3.3, 3.2, 3.1, 3.2] },
  { id: 22, q: 'Will YC batch W26 produce a $10B company?', yes: 4.5, no: 1.2, category: 'Startups', volume: 1200000, ends: '2030-01-01', hot: false, yesPercent: 18, source: 'Y Combinator', betsYes: 216, betsNo: 984, oddsHistory: [4.0, 4.2, 4.5, 4.7, 4.5, 4.3, 4.5] },
  // Work (2)
  { id: 23, q: 'Will remote work decline below 30% by 2027?', yes: 2.8, no: 1.45, category: 'Work', volume: 2900000, ends: '2027-01-01', hot: false, yesPercent: 32, source: 'Gallup', betsYes: 928, betsNo: 1972, oddsHistory: [2.6, 2.7, 2.8, 2.9, 2.8, 2.7, 2.8] },
  { id: 24, q: 'Will a 4-day work week become standard in tech?', yes: 3.5, no: 1.3, category: 'Work', volume: 3400000, ends: '2027-01-01', hot: true, yesPercent: 25, source: '4DayWeek.io', betsYes: 850, betsNo: 2550, oddsHistory: [3.2, 3.3, 3.5, 3.6, 3.5, 3.4, 3.5] },
];

const categories = ['All', 'Crypto', 'AI', 'M&A', 'IPO', 'Regulation', 'Startups', 'Work'];

// Live games removed — prediction markets are the core feature

const leaderboardUsers = [
  { rank: 1, name: '0xAlpha.eth', avatar: 'A', trades: 342, pnl: 47500, winRate: 73, streak: '12W' },
  { rank: 2, name: 'CryptoWhale', avatar: 'C', trades: 289, pnl: 38200, winRate: 71, streak: '8W' },
  { rank: 3, name: 'DeFi_Dan', avatar: 'D', trades: 456, pnl: 31800, winRate: 68, streak: '5W' },
  { rank: 4, name: 'MarketMaven', avatar: 'M', trades: 234, pnl: 28400, winRate: 66, streak: '6W' },
  { rank: 5, name: 'SolSurfer', avatar: 'S', trades: 567, pnl: 24100, winRate: 64, streak: '4W' },
  { rank: 6, name: 'TechTrader', avatar: 'T', trades: 198, pnl: 19800, winRate: 62, streak: '3W' },
  { rank: 7, name: 'AIBettor', avatar: 'A', trades: 321, pnl: 15600, winRate: 61, streak: '5W' },
  { rank: 8, name: 'VCVibes', avatar: 'V', trades: 187, pnl: 12300, winRate: 59, streak: '2W' },
  { rank: 9, name: 'StartupSage', avatar: 'S', trades: 145, pnl: 9800, winRate: 58, streak: '3W' },
  { rank: 10, name: 'EthEnthusiast', avatar: 'E', trades: 432, pnl: 7400, winRate: 56, streak: '1W' },
];

// Trending topics from TrendPulse (simulated sync)
const trendPulseTopics = ['Bitcoin', 'ETH', 'OpenAI', 'GPT-5', 'Stripe IPO', 'SEC', 'Solana', 'AI', 'Crypto', 'TikTok', 'Regulation', 'DeFi', 'NFT', 'Remote Work'];

// Recent wins ticker data (simulated other players)
const recentWinNames = ['0xAlpha.eth', 'CryptoWhale', 'DeFi_Dan', 'MarketMaven', 'SolSurfer', 'TechTrader', 'AIBettor', 'VCVibes', 'BlockBet', 'TokenTurtle', 'MoonShot99', 'DiamondHands', 'BullRunner', 'DegenKing'];
const recentWinGames = ['Prediction Market'];

// Daily challenges templates
const dailyChallengesPool = [
  { id: 'bet5', title: 'Place 5 Prediction Bets', desc: 'Place bets on 5 different prediction markets', reward: 100, icon: Target, target: 5, type: 'market_bets' },
  { id: 'bet3crypto', title: 'Bet on 3 Crypto Markets', desc: 'Place bets on 3 crypto prediction markets', reward: 150, icon: TrendingUp, target: 3, type: 'crypto_bets' },
  { id: 'bet2ai', title: 'Bet on 2 AI Markets', desc: 'Place bets on AI-related prediction markets', reward: 125, icon: Sparkles, target: 2, type: 'ai_bets' },
  { id: 'hotbet', title: 'Bet on a Hot Market', desc: 'Place a bet on a trending HOT market', reward: 100, icon: Flame, target: 1, type: 'hot_bet' },
  { id: 'bigbet', title: 'Place a 250+ GOAT Bet', desc: 'Go big or go home - place a 250+ GOAT bet', reward: 200, icon: Target, target: 1, type: 'big_bet' },
  { id: 'diversify', title: 'Bet on 3 Categories', desc: 'Place bets across 3 different market categories', reward: 175, icon: BarChart3, target: 3, type: 'diverse_bets' },
];

// Difficulty levels for AI Oracle
const AO_DIFFICULTIES = [
  { id: 'easy', label: 'Easy', color: '#10b981', multiplier: 1, questionCount: 10, baseReward: 15, bonusThreshold: 7, bonus: 50, desc: '10 questions, 15 GOAT each' },
  { id: 'medium', label: 'Medium', color: '#f59e0b', multiplier: 1.5, questionCount: 10, baseReward: 25, bonusThreshold: 8, bonus: 100, desc: '10 questions, 25 GOAT each' },
  { id: 'hard', label: 'Hard', color: '#ef4444', multiplier: 2.5, questionCount: 10, baseReward: 50, bonusThreshold: 9, bonus: 250, desc: '10 questions, 50 GOAT each' },
];

const newsItems = [
  { title: 'Bitcoin breaks $98K as ETF inflows surge', source: 'CoinDesk', time: '2m ago', category: 'Crypto', sentiment: 'bullish' },
  { title: 'OpenAI in talks for $40B funding round at $300B valuation', source: 'Bloomberg', time: '15m ago', category: 'AI', sentiment: 'bullish' },
  { title: 'Stripe confidentially files S-1 for IPO', source: 'Reuters', time: '1h ago', category: 'IPO', sentiment: 'bullish' },
  { title: 'SEC postpones decision on Ethereum staking ETF', source: 'The Block', time: '2h ago', category: 'Regulation', sentiment: 'bearish' },
  { title: 'Microsoft acquires AI startup for $2.8B', source: 'TechCrunch', time: '3h ago', category: 'M&A', sentiment: 'bullish' },
  { title: 'Remote work adoption declines for third straight quarter', source: 'Gallup', time: '5h ago', category: 'Work', sentiment: 'bearish' },
  { title: 'Solana TVL hits $15B as DeFi activity surges', source: 'DeFi Llama', time: '6h ago', category: 'Crypto', sentiment: 'bullish' },
  { title: 'EU proposes strict AI transparency requirements', source: 'EuroNews', time: '8h ago', category: 'Regulation', sentiment: 'bearish' },
];

// Token unlocks info
const tokenUnlocks = [
  { threshold: 5000, label: 'DEGEN Badge', desc: 'Flex your degen status on leaderboard' },
  { threshold: 10000, label: 'Priority Markets', desc: 'Early access to new prediction markets' },
  { threshold: 25000, label: 'Insider Access', desc: 'Exclusive high-value prediction markets' },
  { threshold: 50000, label: 'Market Maker', desc: 'Create custom prediction markets' },
  { threshold: 100000, label: 'Whale Status', desc: 'Custom leaderboard flair + reduced commission' },
];

// Mini sparkline component
function MiniSparkline({ data, color = '#00ff88', width = 50, height = 16 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg width={width} height={height} className="inline-block ml-1">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Visual flash component for win/loss feedback
function FlashOverlay({ type }) {
  if (!type) return null;
  return (
    <motion.div
      className="fixed inset-0 z-[100] pointer-events-none"
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      style={{
        background: type === 'win'
          ? 'radial-gradient(circle, rgba(0,255,136,0.3) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)',
      }}
    />
  );
}

// Animated price chart for Price Prediction
function PriceChart({ data, color = '#00ff88', height = 120 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data) * 0.999;
  const max = Math.max(...data) * 1.001;
  const range = max - min || 1;
  const w = 300;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 10) - 5}`).join(' ');
  const fillPoints = `0,${height} ${points} ${w},${height}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polygon
        points={fillPoints}
        fill="url(#chartGradient)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      {data.length > 0 && (
        <motion.circle
          cx={(data.length - 1) / (data.length - 1) * w}
          cy={height - ((data[data.length - 1] - min) / range) * (height - 10) - 5}
          r="4"
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

// Format large volumes
function fmtVol(v) {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v}`;
}

// Time left helper
function timeLeft(dateStr) {
  const end = new Date(dateStr);
  const now = new Date();
  const diff = end - now;
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 30) return `${Math.floor(days / 30)}mo ${days % 30}d`;
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function CasinoPage() {
  const { regime, sentiment } = useGoatedAI();
  const isLoggedIn = useStore(s => s.isLoggedIn);
  const [tab, setTab] = useState('markets');
  const [balance, setBalance] = useState(() => loadGoatBalance());
  const [selectedCat, setSelectedCat] = useState('All');
  const [markets, setMarkets] = useState(initialMarkets);
  const [bets, setBets] = useState(() => loadSavedBets(CASINO_BETS_KEY));
  const [resolvedBets, setResolvedBets] = useState(() => loadSavedBets(CASINO_RESOLVED_KEY));
  const [showNews, setShowNews] = useState(true);

  // Wallet connect state
  const [wallet, setWallet] = useState(() => loadWallet());
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletAction, setWalletAction] = useState(null); // 'deposit' | 'withdraw' | null

  // Bet placement state
  const [activeBetMarket, setActiveBetMarket] = useState(null);
  const [activeBetSide, setActiveBetSide] = useState(null);
  const [betAmount, setBetAmount] = useState(50);
  const [showConfirm, setShowConfirm] = useState(false);
  const [betResult, setBetResult] = useState(null);

  // Active game state
  const [activeGame, setActiveGame] = useState(null);
  const [gameBet, setGameBet] = useState(50);

  // Streak tracking
  const [streaks, setStreaks] = useState(() => loadStreaks());
  const streakMultiplier = useMemo(() => {
    if (streaks.win >= 10) return 2.5;
    if (streaks.win >= 7) return 2.0;
    if (streaks.win >= 5) return 1.75;
    if (streaks.win >= 3) return 1.5;
    if (streaks.win >= 2) return 1.25;
    return 1.0;
  }, [streaks.win]);

  // Session bet history
  const [betHistory, setBetHistory] = useState(() => loadBetHistory());
  const sessionPnl = useMemo(() => betHistory.reduce((s, b) => s + b.pnl, 0), [betHistory]);

  // Double or nothing state
  const [doubleOrNothing, setDoubleOrNothing] = useState(null); // { amount, game }

  // Daily bonus
  const [dailyBonusAvailable, setDailyBonusAvailable] = useState(() => canClaimDailyBonus());
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false);

  // Visual flash for win/loss
  const [flashType, setFlashType] = useState(null);

  // Sound toggle (UI only)
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Recent wins ticker
  const [recentWins, setRecentWins] = useState([]);

  // Daily challenges
  const [dailyChallenges, setDailyChallenges] = useState(() => {
    try {
      const saved = localStorage.getItem('goated_daily_challenges');
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && parsed.date === new Date().toDateString()) return parsed.challenges;
    } catch {}
    const shuffled = [...dailyChallengesPool].sort(() => Math.random() - 0.5).slice(0, 3);
    const challenges = shuffled.map(c => ({ ...c, progress: 0, completed: false }));
    try { localStorage.setItem('goated_daily_challenges', JSON.stringify({ date: new Date().toDateString(), challenges })); } catch {}
    return challenges;
  });

  // AI Oracle difficulty
  const [aoDifficulty, setAoDifficulty] = useState(null);
  const [aoConsecutiveCorrect, setAoConsecutiveCorrect] = useState(0);

  // Price Prediction chart data
  const [ppChartData, setPpChartData] = useState([]);

  // Price Prediction game state
  const [ppCoin, setPpCoin] = useState('BTC');
  const [ppDirection, setPpDirection] = useState(null);
  const [ppCountdown, setPpCountdown] = useState(null);
  const [ppStartPrice, setPpStartPrice] = useState(null);
  const [ppResult, setPpResult] = useState(null);
  const [ppLivePrice, setPpLivePrice] = useState(null);
  const ppTimerRef = useRef(null);

  // Market Roulette game state
  const [mrSector, setMrSector] = useState(null);
  const [mrSpinning, setMrSpinning] = useState(false);
  const [mrResult, setMrResult] = useState(null);
  const [mrRotation, setMrRotation] = useState(0);
  const [mrCelebrating, setMrCelebrating] = useState(false);

  // Portfolio Duel game state
  const [pdPicks, setPdPicks] = useState([]);
  const [pdRunning, setPdRunning] = useState(false);
  const [pdRound, setPdRound] = useState(0);
  const [pdPlayerValues, setPdPlayerValues] = useState([]);
  const [pdBotValues, setPdBotValues] = useState([]);
  const [pdBotPicks, setPdBotPicks] = useState([]);
  const [pdResult, setPdResult] = useState(null);
  const [pdRevealing, setPdRevealing] = useState(false);
  const pdTimerRef = useRef(null);

  // AI Oracle game state
  const [aoQuestion, setAoQuestion] = useState(0);
  const [aoScore, setAoScore] = useState(0);
  const [aoSelected, setAoSelected] = useState(null);
  const [aoFinished, setAoFinished] = useState(false);
  const [aoQuestions, setAoQuestions] = useState([]);

  // Live crypto price state
  const [cryptoPrices, setCryptoPrices] = useState(null);
  const [marketOverview, setMarketOverview] = useState(null);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);

  // Show login prompt
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Wallet required prompt
  const [showWalletRequired, setShowWalletRequired] = useState(false);

  // Persist balance changes
  useEffect(() => { saveGoatBalance(balance); }, [balance]);
  useEffect(() => { saveBets(CASINO_BETS_KEY, bets); }, [bets]);
  useEffect(() => { saveBets(CASINO_RESOLVED_KEY, resolvedBets); }, [resolvedBets]);
  useEffect(() => { saveStreaks(streaks); }, [streaks]);
  useEffect(() => { saveBetHistory(betHistory); }, [betHistory]);

  // Record game result helper
  const recordGameResult = useCallback((won, amount, payout, game) => {
    const pnl = won ? payout - amount : -amount;
    setBetHistory(prev => [...prev, { game, won, amount, payout, pnl, time: Date.now() }]);
    setStreaks(prev => {
      const newStreaks = { ...prev };
      if (won) {
        newStreaks.win = prev.win + 1;
        newStreaks.loss = 0;
        newStreaks.best = Math.max(prev.best, newStreaks.win);
      } else {
        newStreaks.loss = prev.loss + 1;
        newStreaks.win = 0;
      }
      return newStreaks;
    });
    // Flash
    setFlashType(won ? 'win' : 'loss');
    setTimeout(() => setFlashType(null), 800);
  }, []);

  // Check if logged in before placing a bet
  const requireLogin = useCallback(() => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return true; // blocked
    }
    return false;
  }, [isLoggedIn]);

  // Claim daily bonus
  const claimDailyBonus = useCallback(() => {
    if (!dailyBonusAvailable) return;
    const bonusAmount = 250 + Math.floor(Math.random() * 250); // 250-500 random
    setBalance(prev => prev + bonusAmount);
    claimDailyBonusStorage();
    setDailyBonusAvailable(false);
    setDailyBonusClaimed(true);
    setFlashType('win');
    setTimeout(() => { setFlashType(null); setDailyBonusClaimed(false); }, 2000);
    setBetHistory(prev => [...prev, { game: 'Daily Bonus', won: true, amount: 0, payout: bonusAmount, pnl: bonusAmount, time: Date.now() }]);
  }, [dailyBonusAvailable]);

  // Double or nothing handler
  const handleDoubleOrNothing = useCallback((accept) => {
    if (!doubleOrNothing) return;
    if (!accept) {
      setDoubleOrNothing(null);
      return;
    }
    const won = Math.random() > 0.5;
    const amt = doubleOrNothing.amount;
    if (won) {
      setBalance(prev => prev + amt);
      setFlashType('win');
      recordGameResult(true, 0, amt, 'Double or Nothing');
    } else {
      setBalance(prev => prev - amt);
      setFlashType('loss');
      recordGameResult(false, amt, 0, 'Double or Nothing');
    }
    setTimeout(() => setFlashType(null), 800);
    setDoubleOrNothing(null);
  }, [doubleOrNothing, recordGameResult]);

  // ---------------------------------------------------------------------------
  // Wallet connect functions
  // ---------------------------------------------------------------------------
  const connectPhantom = async () => {
    try {
      if (window.solana && window.solana.isPhantom) {
        const response = await window.solana.connect();
        const addr = response.publicKey.toString();
        const w = { type: 'phantom', address: addr, chain: 'Solana', connectedAt: Date.now() };
        setWallet(w);
        saveWallet(w);
        setShowWalletModal(false);
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } catch (err) {
      console.error('Phantom connect error:', err);
    }
  };

  const connectMetaMask = async () => {
    try {
      if (window.ethereum && window.ethereum.isMetaMask) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          const w = { type: 'metamask', address: accounts[0], chain: 'Ethereum', connectedAt: Date.now() };
          setWallet(w);
          saveWallet(w);
          setShowWalletModal(false);
        }
      } else {
        window.open('https://metamask.io/', '_blank');
      }
    } catch (err) {
      console.error('MetaMask connect error:', err);
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    saveWallet(null);
  };

  const handleDeposit = () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return;
    const goatTokens = Math.floor(amt * 100);
    setBalance(prev => prev + goatTokens);
    setDepositAmount('');
    setWalletAction(null);
  };

  const handleWithdraw = () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) return;
    const goatTokens = Math.floor(amt * 100);
    if (goatTokens > balance) return;
    const fee = Math.ceil(goatTokens * 0.005);
    setBalance(prev => prev - goatTokens);
    setWithdrawAmount('');
    setWalletAction(null);
  };

  // ---------------------------------------------------------------------------
  // Fetch live market data
  // ---------------------------------------------------------------------------
  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/market-data');
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setCryptoPrices(data.prices || {});
      setMarketOverview(data.marketOverview || null);
      setLastPriceUpdate(new Date());
    } catch (err) {
      console.error('Market data fetch error:', err);
    } finally {
      setPricesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(() => { if (!document.hidden) fetchPrices(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // ---------------------------------------------------------------------------
  // Auto-resolve crypto markets based on live prices
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!cryptoPrices) return;
    const btcP = cryptoPrices.BTC?.price;
    const ethP = cryptoPrices.ETH?.price;
    const solP = cryptoPrices.SOL?.price;

    setMarkets(prev => prev.map(m => {
      if (m.resolved) return m;
      const endDate = new Date(m.ends);
      const now = new Date();
      if (now < endDate) return m;

      let outcome = null;
      if (m.resolution === 'btc_price' && btcP) {
        outcome = btcP >= m.target ? 'yes' : 'no';
      } else if (m.resolution === 'eth_price' && ethP) {
        outcome = ethP >= m.target ? 'yes' : 'no';
      } else if (m.resolution === 'sol_price' && solP) {
        outcome = solP >= m.target ? 'yes' : 'no';
      }
      if (outcome) return { ...m, resolved: true, outcome };
      return m;
    }));
  }, [cryptoPrices]);

  // Resolve bets when markets resolve
  useEffect(() => {
    const resolved = markets.filter(m => m.resolved);
    if (resolved.length === 0) return;

    setBets(prev => {
      const remaining = [];
      const newResolved = [];
      prev.forEach(bet => {
        const market = resolved.find(m => m.id === bet.marketId);
        if (market) {
          const won = bet.side === market.outcome;
          const grossPayout = won ? bet.amount * bet.odds : 0;
          const commission = won ? Math.ceil(grossPayout * COMMISSION_RATE) : 0;
          const netPayout = grossPayout - commission;
          newResolved.push({ ...bet, won, payout: netPayout, grossPayout, commission, resolvedAt: new Date().toISOString() });
          if (won) {
            setBalance(b => b + netPayout);
          }
        } else {
          remaining.push(bet);
        }
      });
      if (newResolved.length > 0) {
        setResolvedBets(r => [...r, ...newResolved]);
      }
      return remaining;
    });
  }, [markets]);

  // Generate simulated recent wins ticker — skip when tab hidden
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      const name = recentWinNames[Math.floor(Math.random() * recentWinNames.length)];
      const game = recentWinGames[Math.floor(Math.random() * recentWinGames.length)];
      const amount = [50, 100, 150, 250, 500, 1000][Math.floor(Math.random() * 6)];
      setRecentWins(prev => [{ name, game, amount, id: Date.now() }, ...prev].slice(0, 5));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const btcPrice = cryptoPrices?.BTC;
  const ethPrice = cryptoPrices?.ETH;
  const solPrice = cryptoPrices?.SOL;
  const filteredMarkets = selectedCat === 'All' ? markets : markets.filter(m => m.category === selectedCat);
  const priceList = cryptoPrices ? Object.values(cryptoPrices) : [];

  // ---------------------------------------------------------------------------
  // Wallet requirement check
  // ---------------------------------------------------------------------------
  const requireWallet = useCallback(() => {
    const w = loadWallet();
    if (!w) {
      setShowWalletRequired(true);
      return true; // blocked
    }
    return false;
  }, []);

  // ---------------------------------------------------------------------------
  // Bet placement functions
  // ---------------------------------------------------------------------------
  const openBetPanel = (marketId, side) => {
    if (requireLogin()) return;
    if (requireWallet()) return;
    setActiveBetMarket(marketId);
    setActiveBetSide(side);
    setBetAmount(50);
    setShowConfirm(false);
    setBetResult(null);
  };

  const closeBetPanel = () => {
    setActiveBetMarket(null);
    setActiveBetSide(null);
    setBetAmount(50);
    setShowConfirm(false);
    setBetResult(null);
  };

  const adjustAmount = (delta) => {
    setBetAmount(prev => Math.max(1, Math.min(balance, prev + delta)));
  };

  const confirmBet = () => {
    if (betAmount <= 0 || betAmount > balance) {
      setBetResult('fail');
      setTimeout(() => setBetResult(null), 1500);
      return;
    }

    const market = markets.find(m => m.id === activeBetMarket);
    if (!market || market.resolved) return;

    const odds = activeBetSide === 'yes' ? market.yes : market.no;
    const payout = betAmount * odds;

    setBalance(prev => prev - betAmount);
    setBets(prev => [...prev, {
      id: Date.now(),
      marketId: market.id,
      market: market.q,
      side: activeBetSide,
      amount: betAmount,
      odds,
      potentialPayout: payout,
      placedAt: new Date().toISOString(),
      category: market.category,
    }]);

    setMarkets(prev => prev.map(m => {
      if (m.id !== market.id) return m;
      const shift = Math.min(0.15, betAmount / 5000);
      let newYes = m.yes, newNo = m.no, newYesPct = m.yesPercent, newBetsYes = m.betsYes, newBetsNo = m.betsNo;
      if (activeBetSide === 'yes') {
        newYes = Math.max(1.05, m.yes - shift);
        newNo = Math.min(10, m.no + shift * 0.7);
        newYesPct = Math.min(95, m.yesPercent + Math.ceil(shift * 10));
        newBetsYes = m.betsYes + 1;
      } else {
        newNo = Math.max(1.05, m.no - shift);
        newYes = Math.min(10, m.yes + shift * 0.7);
        newYesPct = Math.max(5, m.yesPercent - Math.ceil(shift * 10));
        newBetsNo = m.betsNo + 1;
      }
      return {
        ...m,
        yes: Math.round(newYes * 100) / 100,
        no: Math.round(newNo * 100) / 100,
        yesPercent: newYesPct,
        volume: m.volume + betAmount,
        betsYes: newBetsYes,
        betsNo: newBetsNo,
        oddsHistory: [...m.oddsHistory.slice(-6), activeBetSide === 'yes' ? newYes : m.yes],
      };
    }));

    setBetResult('success');
    setTimeout(() => {
      setBetResult(null);
      closeBetPanel();
    }, 1500);
  };

  // ---------------------------------------------------------------------------
  // Portfolio calculations
  // ---------------------------------------------------------------------------
  const totalAtStake = bets.reduce((s, b) => s + b.amount, 0);
  const totalPotentialPayout = bets.reduce((s, b) => s + b.potentialPayout, 0);
  const resolvedPnl = resolvedBets.reduce((s, b) => s + (b.won ? b.payout - b.amount : -b.amount), 0);
  const totalCommissionPaid = resolvedBets.reduce((s, b) => s + (b.commission || 0), 0);
  const userPnl = resolvedPnl - totalAtStake;
  const userRank = leaderboardUsers.filter(u => u.pnl > userPnl).length + 1;
  const activeMarket = markets.find(m => m.id === activeBetMarket);

  // ---------------------------------------------------------------------------
  // AI Oracle trivia questions pool
  // ---------------------------------------------------------------------------
  const triviaPool = useMemo(() => [
    { q: 'What consensus mechanism does Bitcoin use?', opts: ['Proof of Work', 'Proof of Stake', 'Delegated PoS', 'Proof of Authority'], answer: 0, difficulty: 'easy' },
    { q: 'Which company created the GPT series of models?', opts: ['Google', 'Meta', 'OpenAI', 'Anthropic'], answer: 2, difficulty: 'easy' },
    { q: 'What is the maximum supply of Bitcoin?', opts: ['100 million', '21 million', '18 million', 'Unlimited'], answer: 1, difficulty: 'easy' },
    { q: 'What does "DeFi" stand for?', opts: ['Decentralized Finance', 'Digital Finance', 'Derivative Fintech', 'Distributed Fidelity'], answer: 0, difficulty: 'easy' },
    { q: 'Which blockchain does Solana use for consensus?', opts: ['Proof of Work', 'Proof of History', 'Proof of Authority', 'Proof of Burn'], answer: 1, difficulty: 'easy' },
    { q: 'What is a "transformer" in AI?', opts: ['A robot', 'A neural network architecture', 'A data format', 'A GPU type'], answer: 1, difficulty: 'medium' },
    { q: 'What year was Ethereum launched?', opts: ['2013', '2014', '2015', '2016'], answer: 2, difficulty: 'medium' },
    { q: 'What does NFT stand for?', opts: ['New File Token', 'Non-Fungible Token', 'Network Fee Transaction', 'Node Finality Type'], answer: 1, difficulty: 'easy' },
    { q: 'Which company developed the Claude AI model?', opts: ['OpenAI', 'Google', 'Anthropic', 'Microsoft'], answer: 2, difficulty: 'easy' },
    { q: 'What is "gas" in Ethereum?', opts: ['A token', 'Transaction fee unit', 'A smart contract', 'A wallet type'], answer: 1, difficulty: 'medium' },
    { q: 'What does LLM stand for?', opts: ['Large Learning Model', 'Large Language Model', 'Linear Logic Machine', 'Long-term Language Memory'], answer: 1, difficulty: 'easy' },
    { q: 'What is the name of the Ethereum merge upgrade?', opts: ['The Surge', 'The Merge', 'The Purge', 'The Verge'], answer: 1, difficulty: 'medium' },
    { q: 'What is a "hallucination" in AI?', opts: ['A visual bug', 'Generating false information confidently', 'A training method', 'A type of neural network'], answer: 1, difficulty: 'medium' },
    { q: 'Which crypto uses "Proof of Stake" natively since launch?', opts: ['Bitcoin', 'Litecoin', 'Cardano', 'Dogecoin'], answer: 2, difficulty: 'medium' },
    { q: 'What is "fine-tuning" in machine learning?', opts: ['Adjusting hyperparameters', 'Training a pretrained model on specific data', 'Cleaning data', 'Reducing model size'], answer: 1, difficulty: 'hard' },
    { q: 'What is a DAO?', opts: ['Digital Asset Offering', 'Decentralized Autonomous Organization', 'Distributed Algorithm Operation', 'Data Access Object'], answer: 1, difficulty: 'medium' },
    { q: 'Which GPU maker is most associated with AI training?', opts: ['AMD', 'Intel', 'NVIDIA', 'Qualcomm'], answer: 2, difficulty: 'easy' },
    { q: 'What is "staking" in crypto?', opts: ['Mining coins', 'Locking tokens to earn rewards', 'Selling tokens', 'Creating tokens'], answer: 1, difficulty: 'easy' },
    { q: 'What programming language are most smart contracts on Ethereum written in?', opts: ['Python', 'JavaScript', 'Rust', 'Solidity'], answer: 3, difficulty: 'hard' },
    { q: 'What does RLHF stand for in AI?', opts: ['Reinforcement Learning from Human Feedback', 'Recursive Logic for High Frequency', 'Rapid Learning with Hybrid Functions', 'Real-time Language and Heuristic Framework'], answer: 0, difficulty: 'hard' },
  ], []);

  // ---------------------------------------------------------------------------
  // Game helper: reset all game states
  // ---------------------------------------------------------------------------
  const resetGameStates = useCallback(() => {
    setPpDirection(null); setPpCountdown(null); setPpStartPrice(null); setPpResult(null); setPpLivePrice(null); setPpChartData([]);
    if (ppTimerRef.current) { clearInterval(ppTimerRef.current); ppTimerRef.current = null; }
    setMrSector(null); setMrSpinning(false); setMrResult(null); setMrCelebrating(false);
    setPdPicks([]); setPdRunning(false); setPdRound(0); setPdPlayerValues([]); setPdBotValues([]); setPdBotPicks([]); setPdResult(null); setPdRevealing(false);
    if (pdTimerRef.current) { clearInterval(pdTimerRef.current); pdTimerRef.current = null; }
    setAoQuestion(0); setAoScore(0); setAoSelected(null); setAoFinished(false); setAoQuestions([]); setAoDifficulty(null); setAoConsecutiveCorrect(0);
    setGameBet(50);
    setDoubleOrNothing(null);
  }, []);

  const exitGame = useCallback(() => {
    resetGameStates();
    setActiveGame(null);
  }, [resetGameStates]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (ppTimerRef.current) clearInterval(ppTimerRef.current);
      if (pdTimerRef.current) clearInterval(pdTimerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Price Prediction game logic (with animated chart + multiplier)
  // ---------------------------------------------------------------------------
  const startPricePrediction = useCallback((direction) => {
    if (requireLogin()) return;
    if (gameBet > balance) return;
    setPpDirection(direction);
    const coinData = cryptoPrices?.[ppCoin];
    const startP = coinData?.price || (ppCoin === 'BTC' ? 97000 : ppCoin === 'ETH' ? 3200 : 180);
    setPpStartPrice(startP);
    setPpCountdown(30);
    setPpResult(null);
    setPpLivePrice(startP);
    setPpChartData([startP]);
    setBalance(prev => prev - gameBet);

    let timeRemaining = 30;
    let currentPrice = startP;
    const volatility = ppCoin === 'BTC' ? 0.0003 : ppCoin === 'ETH' ? 0.0005 : 0.0008;

    ppTimerRef.current = setInterval(() => {
      timeRemaining -= 1;
      // Animate price movement each tick
      const tick = (Math.random() - 0.48) * volatility;
      currentPrice = currentPrice * (1 + tick);
      setPpLivePrice(currentPrice);
      setPpChartData(prev => [...prev, currentPrice]);
      setPpCountdown(timeRemaining);

      if (timeRemaining <= 0) {
        clearInterval(ppTimerRef.current);
        ppTimerRef.current = null;
        const endPrice = currentPrice;
        const actualDir = endPrice > startP ? 'up' : 'down';
        const won = actualDir === direction;
        const changePct = Math.abs((endPrice - startP) / startP * 100);
        // Multiplier based on how far price moved in correct direction
        const moveMultiplier = won ? Math.max(1.5, 1.5 + changePct * 5) : 0;
        const streakBonus = won ? streakMultiplier : 1;
        const basePayout = won ? Math.floor(gameBet * moveMultiplier * streakBonus) : 0;
        if (won) setBalance(prev => prev + basePayout);
        const result = { startPrice: startP, endPrice, direction: actualDir, won, payout: basePayout, change: ((endPrice - startP) / startP * 100).toFixed(3), moveMultiplier: moveMultiplier.toFixed(2) };
        setPpResult(result);
        recordGameResult(won, gameBet, basePayout, 'Price Prediction');
        if (won) setDoubleOrNothing({ amount: basePayout, game: 'Price Prediction' });
      }
    }, 1000);
  }, [gameBet, balance, cryptoPrices, ppCoin, requireLogin, streakMultiplier, recordGameResult]);

  // ---------------------------------------------------------------------------
  // Market Roulette game logic (smoother spin + celebration)
  // ---------------------------------------------------------------------------
  const mrSectors = useMemo(() => ['Tech', 'Finance', 'Healthcare', 'Energy', 'Crypto', 'AI', 'Real Estate', 'Consumer'], []);
  const mrColors = useMemo(() => ['#3b82f6', '#10b981', '#ec4899', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16'], []);

  const spinRoulette = useCallback(() => {
    if (requireLogin()) return;
    if (!mrSector || gameBet > balance || mrSpinning) return;
    setBalance(prev => prev - gameBet);
    setMrSpinning(true);
    setMrResult(null);
    setMrCelebrating(false);
    const winIndex = Math.floor(Math.random() * 8);
    const targetAngle = 360 * 8 + (winIndex * 45) + 22.5; // 8 full rotations for longer spin
    setMrRotation(prev => prev + targetAngle);
    setTimeout(() => {
      setMrSpinning(false);
      const won = mrSectors[winIndex] === mrSector;
      const payout = won ? Math.floor(gameBet * 6 * streakMultiplier) : 0;
      if (won) {
        setBalance(prev => prev + payout);
        setMrCelebrating(true);
        setTimeout(() => setMrCelebrating(false), 3000);
      }
      setMrResult({ landed: mrSectors[winIndex], won, payout });
      recordGameResult(won, gameBet, payout, 'Market Roulette');
      if (won) setDoubleOrNothing({ amount: payout, game: 'Market Roulette' });
    }, 5000); // 5 seconds for smoother spin
  }, [mrSector, gameBet, balance, mrSpinning, mrSectors, requireLogin, streakMultiplier, recordGameResult]);

  // ---------------------------------------------------------------------------
  // Portfolio Duel game logic (with dramatic reveal)
  // ---------------------------------------------------------------------------
  const pdAssets = useMemo(() => ['BTC', 'ETH', 'SOL', 'AAPL', 'NVDA', 'TSLA', 'GOLD', 'OIL'], []);

  const togglePdPick = useCallback((asset) => {
    setPdPicks(prev => {
      if (prev.includes(asset)) return prev.filter(a => a !== asset);
      if (prev.length >= 3) return prev;
      return [...prev, asset];
    });
  }, []);

  const startPortfolioDuel = useCallback(() => {
    if (requireLogin()) return;
    if (pdPicks.length !== 3 || gameBet > balance) return;
    setBalance(prev => prev - gameBet);
    setPdRunning(true);
    setPdRound(0);
    setPdResult(null);
    setPdRevealing(false);
    const shuffled = [...pdAssets].sort(() => Math.random() - 0.5);
    const botP = shuffled.slice(0, 3);
    setPdBotPicks(botP);
    const pVals = [0];
    const bVals = [0];
    setPdPlayerValues([0]);
    setPdBotValues([0]);

    let round = 0;
    pdTimerRef.current = setInterval(() => {
      round += 1;
      const pChange = pdPicks.reduce((s, _) => s + (Math.random() - 0.47) * 3, 0) / 3;
      const bChange = botP.reduce((s, _) => s + (Math.random() - 0.47) * 3, 0) / 3;
      const newPVal = (pVals[pVals.length - 1] || 0) + pChange;
      const newBVal = (bVals[bVals.length - 1] || 0) + bChange;
      pVals.push(newPVal);
      bVals.push(newBVal);
      setPdPlayerValues([...pVals]);
      setPdBotValues([...bVals]);
      setPdRound(round);

      if (round >= 10) {
        clearInterval(pdTimerRef.current);
        pdTimerRef.current = null;
        setPdRunning(false);
        // Dramatic reveal pause
        setPdRevealing(true);
        setTimeout(() => {
          const won = newPVal > newBVal;
          const tie = Math.abs(newPVal - newBVal) < 0.01;
          const payout = won ? Math.floor(gameBet * 2 * streakMultiplier) : tie ? gameBet : 0;
          if (payout > 0) setBalance(prev => prev + payout);
          setPdResult({ won, tie, payout, playerFinal: newPVal.toFixed(2), botFinal: newBVal.toFixed(2) });
          setPdRevealing(false);
          recordGameResult(won || tie, gameBet, payout, 'Portfolio Duel');
          if (won) setDoubleOrNothing({ amount: payout, game: 'Portfolio Duel' });
        }, 2000);
      }
    }, 800);
  }, [pdPicks, gameBet, balance, pdAssets, requireLogin, streakMultiplier, recordGameResult]);

  // ---------------------------------------------------------------------------
  // AI Oracle game logic (with difficulty + streak bonus)
  // ---------------------------------------------------------------------------
  const startAiOracle = useCallback((diff) => {
    const difficulty = diff || aoDifficulty || AO_DIFFICULTIES[0];
    setAoDifficulty(difficulty);
    // Filter by difficulty if possible, fallback to random
    let pool = triviaPool.filter(q => q.difficulty === difficulty.id);
    if (pool.length < 10) pool = [...triviaPool]; // fallback to all
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, difficulty.questionCount);
    setAoQuestions(shuffled);
    setAoQuestion(0);
    setAoScore(0);
    setAoSelected(null);
    setAoFinished(false);
    setAoConsecutiveCorrect(0);
  }, [triviaPool, aoDifficulty]);

  const answerAoQuestion = useCallback((idx) => {
    if (aoSelected !== null) return;
    setAoSelected(idx);
    const correct = aoQuestions[aoQuestion]?.answer === idx;
    const diff = aoDifficulty || AO_DIFFICULTIES[0];

    if (correct) {
      setAoScore(prev => prev + 1);
      setAoConsecutiveCorrect(prev => prev + 1);
      setFlashType('win');
    } else {
      setAoConsecutiveCorrect(0);
      setFlashType('loss');
    }
    setTimeout(() => setFlashType(null), 400);

    setTimeout(() => {
      if (aoQuestion + 1 >= diff.questionCount) {
        const finalScore = correct ? aoScore + 1 : aoScore;
        const consecutiveBonus = aoConsecutiveCorrect >= 5 ? 75 : aoConsecutiveCorrect >= 3 ? 25 : 0;
        const earned = finalScore * diff.baseReward + (finalScore >= diff.bonusThreshold ? diff.bonus : 0) + consecutiveBonus;
        setBalance(prev => prev + earned);
        setAoFinished(true);
        recordGameResult(finalScore >= diff.bonusThreshold, 0, earned, 'AI Oracle');
      } else {
        setAoQuestion(prev => prev + 1);
        setAoSelected(null);
      }
    }, 1200);
  }, [aoSelected, aoQuestions, aoQuestion, aoScore, aoDifficulty, aoConsecutiveCorrect, recordGameResult]);

  // Next unlock for tokens
  const nextUnlock = useMemo(() => tokenUnlocks.find(u => u.threshold > balance) || tokenUnlocks[tokenUnlocks.length - 1], [balance]);

  return (
    <div className="p-4 sm:p-6">
      {/* Win/Loss Flash Overlay */}
      <FlashOverlay type={flashType} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Dice5 size={28} className="text-brand" />
          <div>
            <h1 className="text-2xl font-bold">Prediction Casino</h1>
            <p className="text-slate-500 text-sm">Bet GOAT tokens on markets, trends & outcomes</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Daily Bonus */}
          {dailyBonusAvailable && (
            <motion.button
              onClick={claimDailyBonus}
              className="px-3 py-2 rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 text-sm font-bold flex items-center gap-1.5 hover:bg-yellow-500/25 transition-colors"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Gift size={14} />Daily Bonus
            </motion.button>
          )}
          {dailyBonusClaimed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-2 rounded-xl bg-brand/15 border border-brand/30 text-brand text-sm font-bold"
            >
              Bonus Claimed!
            </motion.div>
          )}

          {/* Session P&L */}
          <div className={`px-3 py-2 rounded-xl border text-sm font-bold flex items-center gap-1.5 ${
            sessionPnl >= 0 ? 'bg-brand/10 border-brand/20 text-brand' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <Activity size={14} />
            {sessionPnl >= 0 ? '+' : ''}{sessionPnl.toLocaleString()} P&L
          </div>

          {/* Streak */}
          {streaks.win >= 2 && (
            <motion.div
              className="px-3 py-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 text-sm font-bold flex items-center gap-1.5"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Flame size={14} />{streaks.win}x Win Streak ({streakMultiplier}x)
            </motion.div>
          )}
          {streaks.loss >= 3 && (
            <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-1.5">
              {streaks.loss}x Loss Streak
            </div>
          )}

          {/* GOAT Balance */}
          <div className="px-4 py-2 rounded-xl bg-surface-3 border border-white/[0.05] flex items-center gap-2">
            <Coins size={16} className="text-yellow-400" />
            <span className="text-slate-500 text-sm">GOAT:</span>
            <span className="font-bold text-lg text-yellow-400">{balance.toLocaleString()}</span>
          </div>

          {/* Active bets badge */}
          {bets.length > 0 && (
            <div className="px-3 py-2 rounded-xl bg-brand/15 border border-brand/30 text-brand text-sm font-medium">
              {bets.length} active
            </div>
          )}

          {/* Wallet connect / deposit */}
          {wallet ? (
            <button onClick={() => setShowWalletModal(true)}
              className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium flex items-center gap-1.5">
              <Wallet size={14} />
              {wallet.address.slice(0, 4)}...{wallet.address.slice(-4)}
            </button>
          ) : (
            <button onClick={() => setShowWalletModal(true)}
              className="px-3 py-2 rounded-xl bg-brand/15 border border-brand/30 text-brand text-sm font-medium flex items-center gap-1.5 hover:bg-brand/25 transition-colors">
              <Wallet size={14} />Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Token Progress & Unlocks */}
      {nextUnlock && (
        <div className="bg-surface-3 rounded-xl border border-white/[0.03] p-3 mb-4 flex items-center gap-4">
          <div className="flex-shrink-0">
            <Lock size={14} className="text-yellow-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Next unlock: <span className="text-yellow-400 font-bold">{nextUnlock.label}</span> - {nextUnlock.desc}</span>
              <span className="text-slate-500">{balance.toLocaleString()} / {nextUnlock.threshold.toLocaleString()} GOAT</span>
            </div>
            <div className="h-1.5 bg-surface-1 rounded-full overflow-hidden">
              <motion.div className="h-full bg-yellow-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (balance / nextUnlock.threshold) * 100)}%` }} transition={{ duration: 1 }} />
            </div>
          </div>
        </div>
      )}

      {/* Commission notice */}
      <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-3 text-xs">
        <Shield size={14} className="text-yellow-400 flex-shrink-0" />
        <span className="text-slate-400">
          <span className="text-yellow-400 font-bold">12% commission</span> on winnings | <span className="text-yellow-400 font-bold">0% deposit fee</span> | <span className="text-yellow-400 font-bold">$2.50 withdrawal fee</span> | All bets in GOAT tokens (1 GOAT = $0.01)
          {streaks.best > 0 && <span className="ml-2">| Best streak: <span className="text-orange-400 font-bold">{streaks.best}W</span></span>}
        </span>
      </div>

      {/* Recent Wins Ticker */}
      {recentWins.length > 0 && (
        <div className="bg-surface-3 rounded-xl border border-white/[0.03] mb-4 overflow-hidden">
          <div className="px-4 py-2 flex items-center gap-3 overflow-x-auto">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider flex-shrink-0">Recent Wins</span>
            {recentWins.map((w) => (
              <motion.div key={w.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-xs flex-shrink-0">
                <span className="text-slate-400">{w.name}</span>
                <span className="text-brand font-bold">+{w.amount}</span>
                <span className="text-slate-600">{w.game}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Live Price Ticker */}
      {priceList.length > 0 && (
        <div className="bg-surface-3 rounded-xl border border-white/[0.03] mb-4 overflow-hidden">
          <div className="px-4 py-2 border-b border-white/[0.03] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-emerald-400">LIVE PRICES</span>
              {marketOverview && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-2 ${
                  marketOverview.avgChange24h >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  Market {marketOverview.marketSentiment}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {lastPriceUpdate && (
                <span className="text-[10px] text-slate-600">
                  Updated {lastPriceUpdate.toLocaleTimeString()}
                </span>
              )}
              <button onClick={fetchPrices} className="text-slate-500 hover:text-white transition-colors">
                <RefreshCw size={12} className={pricesLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          <div className="flex overflow-x-auto divide-x divide-white/5">
            {priceList.map((coin) => (
              <div key={coin.symbol} className="flex items-center gap-2.5 px-4 py-2.5 min-w-[160px] flex-shrink-0">
                <span className="text-base" style={{ color: coin.color }}>{coin.icon}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm">{coin.symbol}</span>
                    <span className="font-mono text-sm">{coin.priceFormatted}</span>
                  </div>
                  <div className={`text-xs font-medium flex items-center gap-0.5 ${coin.direction === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {coin.direction === 'up' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    {coin.change24hFormatted}
                    <span className="text-slate-600 ml-1">{coin.volume24hFormatted} vol</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* News Feed Toggle */}
      <AnimatePresence>
        {showNews && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
            <div className="bg-surface-3 rounded-xl border border-white/[0.03] overflow-hidden">
              <div className="p-3 border-b border-white/[0.03] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio size={14} className="text-red-400 animate-pulse" />
                  <span className="text-sm font-bold">Market News Feed</span>
                </div>
                <button onClick={() => setShowNews(false)} className="text-xs text-slate-500 hover:text-white transition-colors">Hide</button>
              </div>
              <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                {newsItems.map((news, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${news.sentiment === 'bullish' ? 'bg-brand' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate">{news.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{news.source}</span><span>|</span><span>{news.time}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/[0.02] text-slate-400">{news.category}</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${news.sentiment === 'bullish' ? 'text-brand' : 'text-red-400'}`}>
                      {news.sentiment === 'bullish' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {news.sentiment}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showNews && (
        <button onClick={() => setShowNews(true)} className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand transition-colors">
          <Newspaper size={12} />Show news feed
        </button>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { id: 'markets', label: 'Prediction Markets', icon: BarChart3 },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { id: 'portfolio', label: `Portfolio (${bets.length})`, icon: Target },
          { id: 'history', label: 'Bet History', icon: History },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.id ? 'bg-brand/15 text-brand border border-brand/30' : 'bg-surface-3 text-slate-400 border border-white/[0.03] hover:text-white'}`}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {/* ================================================================= */}
      {/* MARKETS TAB                                                       */}
      {/* ================================================================= */}
      {tab === 'markets' && (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map(c => (
              <button key={c} onClick={() => setSelectedCat(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedCat === c ? 'bg-brand/15 text-brand border border-brand/30' : 'bg-surface-3 text-slate-500 border border-white/[0.03]'}`}>
                {c}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredMarkets.map((m, i) => {
              const isCryptoMarket = m.category === 'Crypto';
              const relevantPrice = m.resolution === 'btc_price' ? btcPrice : m.resolution === 'eth_price' ? ethPrice : m.resolution === 'sol_price' ? solPrice : null;
              const isActive = activeBetMarket === m.id;
              const tl = timeLeft(m.ends);
              const ended = tl === 'Ended';

              return (
                <motion.div key={m.id} className={`bg-surface-3 rounded-xl border overflow-hidden ${m.resolved ? 'border-yellow-500/30' : 'border-white/[0.03]'}`}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className="p-5">
                    {/* Market Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {m.hot && <span className="px-2 py-0.5 bg-red-500/15 text-red-400 text-xs font-bold rounded-full flex items-center gap-1"><Flame size={12} />HOT</span>}
                          <span className="px-2 py-0.5 bg-white/[0.02] text-slate-400 text-xs rounded-full">{m.category}</span>
                          <span className="px-2 py-0.5 bg-white/[0.02] text-slate-500 text-xs rounded-full flex items-center gap-1"><ExternalLink size={10} />{m.source}</span>
                          {m.resolved && (
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${m.outcome === 'yes' ? 'bg-brand/15 text-brand' : 'bg-red-500/15 text-red-400'}`}>
                              RESOLVED: {m.outcome.toUpperCase()}
                            </span>
                          )}
                          {isCryptoMarket && relevantPrice && !m.resolved && (
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full flex items-center gap-1 ${relevantPrice.direction === 'up' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                              {relevantPrice.symbol} {relevantPrice.priceFormatted} {relevantPrice.change24hFormatted}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg">{m.q}</h3>
                      </div>
                      <div className="text-right text-xs text-slate-500 flex-shrink-0 ml-4">
                        <div className={`flex items-center gap-1 justify-end ${ended ? 'text-yellow-400' : ''}`}><Clock size={12} />{tl}</div>
                        <div className="flex items-center gap-1 justify-end mt-1"><DollarSign size={12} />{fmtVol(m.volume)}</div>
                        <div className="flex items-center gap-1 justify-end mt-1"><Users size={12} />{(m.betsYes + m.betsNo).toLocaleString()} bets</div>
                      </div>
                    </div>

                    {/* Probability bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-brand font-medium flex items-center gap-2">
                          YES {m.yesPercent}%
                          <MiniSparkline data={m.oddsHistory} color="#10b981" />
                        </span>
                        <span className="text-red-400 font-medium">NO {100 - m.yesPercent}%</span>
                      </div>
                      <div className="h-2.5 bg-surface-2 rounded-full overflow-hidden flex">
                        <motion.div className="h-full bg-brand rounded-l-full" initial={{ width: 0 }} animate={{ width: `${m.yesPercent}%` }} transition={{ duration: 0.8, delay: i * 0.03 }} />
                        <motion.div className="h-full bg-red-500 rounded-r-full" initial={{ width: 0 }} animate={{ width: `${100 - m.yesPercent}%` }} transition={{ duration: 0.8, delay: i * 0.03 }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                        <span>{m.betsYes.toLocaleString()} YES bets</span>
                        <span>{m.betsNo.toLocaleString()} NO bets</span>
                      </div>
                    </div>

                    {/* Bet buttons */}
                    {!m.resolved && !ended && (
                      <>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <button onClick={() => openBetPanel(m.id, 'yes')}
                            className={`p-4 rounded-xl border transition-colors group ${isActive && activeBetSide === 'yes' ? 'bg-brand/20 border-brand/50' : 'bg-brand/10 border-brand/20 hover:border-brand/40'}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-brand">YES</span>
                              <span className="text-2xl font-black text-white">{m.yes}x</span>
                            </div>
                            <div className="text-xs text-slate-500">Return on 100 GOAT: <span className="text-brand font-bold">{(100 * m.yes).toFixed(0)} GOAT</span></div>
                          </button>
                          <button onClick={() => openBetPanel(m.id, 'no')}
                            className={`p-4 rounded-xl border transition-colors group ${isActive && activeBetSide === 'no' ? 'bg-red-500/20 border-red-500/50' : 'bg-red-500/10 border-red-500/20 hover:border-red-500/40'}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-red-400">NO</span>
                              <span className="text-2xl font-black text-white">{m.no}x</span>
                            </div>
                            <div className="text-xs text-slate-500">Return on 100 GOAT: <span className="text-red-400 font-bold">{(100 * m.no).toFixed(0)} GOAT</span></div>
                          </button>
                        </div>

                        {/* Bet placement panel */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                              <div className={`p-4 rounded-xl border mt-1 ${activeBetSide === 'yes' ? 'bg-brand/5 border-brand/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-bold flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${activeBetSide === 'yes' ? 'bg-brand' : 'bg-red-500'}`} />
                                    Place {activeBetSide.toUpperCase()} Bet
                                  </span>
                                  <button onClick={closeBetPanel} className="text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
                                </div>

                                {/* Amount controls */}
                                <div className="flex items-center gap-2 mb-3">
                                  <button onClick={() => adjustAmount(-10)} className="w-8 h-8 rounded-lg bg-surface-2 border border-white/[0.05] flex items-center justify-center text-slate-400 hover:text-white transition-colors"><Minus size={14} /></button>
                                  <div className="flex-1 relative">
                                    <Coins size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-400" />
                                    <input type="number" value={betAmount}
                                      onChange={e => setBetAmount(Math.max(0, Math.min(balance, parseInt(e.target.value) || 0)))}
                                      className="w-full pl-8 pr-3 py-2.5 bg-surface-1 border border-white/[0.05] rounded-lg text-center font-bold text-lg outline-none focus:border-brand/30 transition-colors" />
                                  </div>
                                  <button onClick={() => adjustAmount(10)} className="w-8 h-8 rounded-lg bg-surface-2 border border-white/[0.05] flex items-center justify-center text-slate-400 hover:text-white transition-colors"><Plus size={14} /></button>
                                </div>

                                {/* Preset amounts */}
                                <div className="flex gap-2 mb-4">
                                  {[10, 50, 100, 500].map(amt => (
                                    <button key={amt} onClick={() => setBetAmount(Math.min(amt, balance))}
                                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${betAmount === amt ? (activeBetSide === 'yes' ? 'bg-brand/20 border-brand/40 text-brand' : 'bg-red-500/20 border-red-500/40 text-red-400') : 'bg-surface-2 border-white/[0.03] text-slate-400 hover:text-white'}`}>
                                      {amt} GOAT
                                    </button>
                                  ))}
                                  <button onClick={() => setBetAmount(balance)}
                                    className="flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-surface-2 border-white/[0.03] text-slate-400 hover:text-white">
                                    MAX
                                  </button>
                                </div>

                                {/* Payout info with commission */}
                                <div className="bg-surface-1 rounded-lg p-3 mb-4">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-400">Your bet</span>
                                    <span className="font-bold">{betAmount.toLocaleString()} GOAT</span>
                                  </div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-400">Odds</span>
                                    <span className="font-bold">{activeBetSide === 'yes' ? activeMarket?.yes : activeMarket?.no}x</span>
                                  </div>
                                  {(() => {
                                    const gross = betAmount * (activeBetSide === 'yes' ? (activeMarket?.yes || 0) : (activeMarket?.no || 0));
                                    const comm = Math.ceil(gross * COMMISSION_RATE);
                                    const net = gross - comm;
                                    return (
                                      <>
                                        <div className="flex justify-between text-sm mb-1">
                                          <span className="text-slate-400">Gross payout</span>
                                          <span className="font-medium text-slate-300">{gross.toFixed(0)} GOAT</span>
                                        </div>
                                        <div className="flex justify-between text-sm mb-1">
                                          <span className="text-yellow-400/70 flex items-center gap-1"><Percent size={10} />Commission (12%)</span>
                                          <span className="text-yellow-400/70">-{comm} GOAT</span>
                                        </div>
                                        <div className="border-t border-white/[0.03] pt-1 mt-1 flex justify-between text-sm">
                                          <span className="text-slate-400">Net payout (if win)</span>
                                          <span className={`font-black text-lg ${activeBetSide === 'yes' ? 'text-brand' : 'text-red-400'}`}>
                                            {net.toFixed(0)} GOAT
                                          </span>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>

                                {/* Confirm / Result */}
                                <AnimatePresence mode="wait">
                                  {betResult === 'success' ? (
                                    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                      className="py-3 rounded-lg bg-brand/20 border border-brand/40 text-center">
                                      <Check size={20} className="text-brand mx-auto mb-1" />
                                      <span className="text-brand font-bold text-sm">Bet Placed!</span>
                                    </motion.div>
                                  ) : betResult === 'fail' ? (
                                    <motion.div key="fail" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                      className="py-3 rounded-lg bg-red-500/20 border border-red-500/40 text-center">
                                      <X size={20} className="text-red-400 mx-auto mb-1" />
                                      <span className="text-red-400 font-bold text-sm">Insufficient GOAT Balance</span>
                                    </motion.div>
                                  ) : !showConfirm ? (
                                    <motion.button key="place" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                      onClick={() => setShowConfirm(true)}
                                      disabled={betAmount <= 0 || betAmount > balance}
                                      className={`w-full py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${activeBetSide === 'yes' ? 'bg-brand text-black hover:bg-brand/90' : 'bg-red-500 text-white hover:bg-red-500/90'}`}>
                                      Place {betAmount.toLocaleString()} GOAT on {activeBetSide.toUpperCase()}
                                    </motion.button>
                                  ) : (
                                    <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                                      <div className="text-center text-xs text-yellow-400 flex items-center justify-center gap-1 mb-2">
                                        <AlertTriangle size={12} />Confirm your bet -- this cannot be undone
                                      </div>
                                      <div className="flex gap-2">
                                        <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-lg bg-surface-2 text-slate-300 text-sm border border-white/[0.05] transition-colors hover:bg-surface-1">Cancel</button>
                                        <button onClick={confirmBet} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-colors ${activeBetSide === 'yes' ? 'bg-brand text-black' : 'bg-red-500 text-white'}`}>Confirm Bet</button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}

                    {/* Resolved badge */}
                    {m.resolved && (
                      <div className={`p-4 rounded-xl border text-center ${m.outcome === 'yes' ? 'bg-brand/10 border-brand/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        <Award size={24} className={`mx-auto mb-2 ${m.outcome === 'yes' ? 'text-brand' : 'text-red-400'}`} />
                        <div className="font-bold text-lg">{m.outcome === 'yes' ? 'YES Wins!' : 'NO Wins!'}</div>
                        <div className="text-xs text-slate-500 mt-1">Market resolved based on live data</div>
                      </div>
                    )}

                    {ended && !m.resolved && (
                      <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center text-sm text-yellow-400 font-medium">
                        <Clock size={14} className="inline mr-1" />Awaiting resolution...
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Daily Bonus Section (shown on markets tab) */}
      {tab === 'markets' && dailyBonusAvailable && (
        <div className="bg-surface-3 rounded-xl border border-yellow-500/20 p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/15 flex items-center justify-center">
              <Gift size={24} className="text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-yellow-400">Daily Bonus Available!</h3>
              <p className="text-sm text-slate-500">Claim your daily GOAT tokens (250-500 GOAT)</p>
            </div>
            <motion.button
              onClick={claimDailyBonus}
              className="px-5 py-2.5 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 font-bold text-sm hover:bg-yellow-500/30 transition-colors"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Claim Now
            </motion.button>
          </div>
        </div>
      )}

      {/* GAMES TAB REMOVED — prediction markets are the core feature */}

      {/* ================================================================= */}
      {/* LEADERBOARD TAB                                                   */}
      {/* ================================================================= */}
      {tab === 'leaderboard' && (
        <div>
          <motion.div className="bg-surface-3 rounded-xl border border-brand/20 p-5 mb-4 flex items-center gap-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-12 h-12 rounded-full bg-brand/15 border-2 border-brand/40 flex items-center justify-center font-black text-brand text-lg">
              #{userRank}
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg">Your Ranking</div>
              <div className="text-xs text-slate-500">{bets.length + resolvedBets.length} trades | {resolvedBets.filter(b => b.won).length}W-{resolvedBets.filter(b => !b.won).length}L | Best streak: {streaks.best}W</div>
            </div>
            <div className="text-right">
              <div className={`font-bold text-lg ${resolvedPnl >= 0 ? 'text-brand' : 'text-red-400'}`}>
                {resolvedPnl >= 0 ? '+' : ''}{resolvedPnl.toLocaleString()} GOAT
              </div>
              <div className="text-xs text-slate-500">P&L</div>
            </div>
          </motion.div>

          <div className="bg-surface-3 rounded-xl border border-white/[0.03] overflow-hidden">
            <div className="p-4 border-b border-white/[0.03]">
              <h2 className="font-semibold flex items-center gap-2"><Trophy size={18} className="text-yellow-400" />Top 10 Predictors</h2>
            </div>
            {leaderboardUsers.slice(0, 10).map((p, i) => (
              <motion.div key={i}
                className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${i < 3 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-surface-2 text-slate-500'}`}>
                  {i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : p.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.winRate}% win rate &middot; {p.streak}</div>
                </div>
                <div className={`font-bold text-sm flex-shrink-0 ${p.pnl >= 0 ? 'text-brand' : 'text-red-400'}`}>
                  {p.pnl >= 0 ? '+' : ''}{Math.abs(p.pnl).toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PORTFOLIO TAB                                                     */}
      {/* ================================================================= */}
      {tab === 'portfolio' && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <motion.div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-xs text-slate-500 mb-1">GOAT Balance</div>
              <div className="text-xl font-black text-yellow-400">{balance.toLocaleString()}</div>
            </motion.div>
            <motion.div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="text-xs text-slate-500 mb-1">At Stake</div>
              <div className="text-xl font-black text-yellow-400">{totalAtStake.toLocaleString()}</div>
            </motion.div>
            <motion.div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="text-xs text-slate-500 mb-1">Potential Payout</div>
              <div className="text-xl font-black text-brand">{totalPotentialPayout.toLocaleString()}</div>
            </motion.div>
            <motion.div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="text-xs text-slate-500 mb-1">Realized P&L</div>
              <div className={`text-xl font-black ${resolvedPnl >= 0 ? 'text-brand' : 'text-red-400'}`}>
                {resolvedPnl >= 0 ? '+' : ''}{resolvedPnl.toLocaleString()}
              </div>
            </motion.div>
            <motion.div className="bg-surface-3 rounded-xl p-4 border border-yellow-500/20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="text-xs text-yellow-400/70 mb-1">Commission Paid</div>
              <div className="text-xl font-black text-yellow-400">{totalCommissionPaid.toLocaleString()}</div>
            </motion.div>
          </div>

          {/* Active bets */}
          <h3 className="font-bold mb-3 flex items-center gap-2"><Activity size={16} className="text-brand" />Active Bets ({bets.length})</h3>
          {bets.length === 0 ? (
            <div className="bg-surface-3 rounded-xl border border-white/[0.03] p-12 text-center mb-6">
              <Target size={48} className="text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">No Active Bets</h3>
              <p className="text-slate-500 mb-4">Place your first prediction to get started</p>
              <button onClick={() => setTab('markets')} className="px-4 py-2 rounded-lg bg-brand text-black font-medium text-sm transition-colors hover:bg-brand/90">Browse Markets</button>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {bets.map((bet, i) => (
                <motion.div key={bet.id}
                  className="bg-surface-3 rounded-xl border border-white/[0.03] p-4 flex items-center gap-4"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${bet.side === 'yes' ? 'bg-brand/15 text-brand' : 'bg-red-500/15 text-red-400'}`}>
                    {bet.side.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{bet.market}</div>
                    <div className="text-xs text-slate-500">Odds: {bet.odds}x | Potential: {bet.potentialPayout.toFixed(0)} GOAT | {bet.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{bet.amount.toLocaleString()} GOAT</div>
                    <div className="text-xs text-yellow-400 flex items-center gap-1 justify-end"><Clock size={10} />Pending</div>
                  </div>
                </motion.div>
              ))}
              <div className="bg-surface-3 rounded-xl border border-white/[0.03] p-4 flex items-center justify-between">
                <span className="text-slate-400">Total at stake</span>
                <span className="font-bold text-lg">{totalAtStake.toLocaleString()} GOAT</span>
              </div>
            </div>
          )}

          {/* Resolved bets */}
          <h3 className="font-bold mb-3 flex items-center gap-2"><History size={16} className="text-slate-400" />Resolved Bets ({resolvedBets.length})</h3>
          {resolvedBets.length === 0 ? (
            <div className="bg-surface-3 rounded-xl border border-white/[0.03] p-8 text-center">
              <Clock size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No resolved bets yet. Markets will auto-resolve based on live data.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resolvedBets.map((bet, i) => (
                <motion.div key={bet.id}
                  className={`bg-surface-3 rounded-xl border p-4 flex items-center gap-4 ${bet.won ? 'border-brand/20' : 'border-red-500/20'}`}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${bet.won ? 'bg-brand/15 text-brand' : 'bg-red-500/15 text-red-400'}`}>
                    {bet.won ? <Check size={18} /> : <X size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{bet.market}</div>
                    <div className="text-xs text-slate-500">
                      Bet {bet.side.toUpperCase()} at {bet.odds}x | {bet.category}
                      {bet.commission > 0 && <span className="text-yellow-400/70 ml-1">| {bet.commission} GOAT fee</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${bet.won ? 'text-brand' : 'text-red-400'}`}>
                      {bet.won ? `+${(bet.payout - bet.amount).toFixed(0)}` : `-${bet.amount}`} GOAT
                    </div>
                    <div className={`text-xs ${bet.won ? 'text-brand' : 'text-red-400'}`}>{bet.won ? 'WON' : 'LOST'}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* BET HISTORY TAB                                                   */}
      {/* ================================================================= */}
      {tab === 'history' && (
        <div>
          {/* Session stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
              <div className="text-xs text-slate-500 mb-1">Session P&L</div>
              <div className={`text-xl font-black ${sessionPnl >= 0 ? 'text-brand' : 'text-red-400'}`}>
                {sessionPnl >= 0 ? '+' : ''}{sessionPnl.toLocaleString()}
              </div>
            </div>
            <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
              <div className="text-xs text-slate-500 mb-1">Total Bets</div>
              <div className="text-xl font-black">{betHistory.length}</div>
            </div>
            <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
              <div className="text-xs text-slate-500 mb-1">Win Rate</div>
              <div className="text-xl font-black text-brand">
                {betHistory.length > 0 ? Math.round((betHistory.filter(b => b.won).length / betHistory.length) * 100) : 0}%
              </div>
            </div>
            <div className="bg-surface-3 rounded-xl p-4 border border-orange-500/20">
              <div className="text-xs text-orange-400 mb-1">Current Streak</div>
              <div className="text-xl font-black">
                {streaks.win > 0 && <span className="text-brand">{streaks.win}W</span>}
                {streaks.loss > 0 && <span className="text-red-400">{streaks.loss}L</span>}
                {streaks.win === 0 && streaks.loss === 0 && <span className="text-slate-500">--</span>}
              </div>
            </div>
          </div>

          {betHistory.length === 0 ? (
            <div className="bg-surface-3 rounded-xl border border-white/[0.03] p-12 text-center">
              <History size={48} className="text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">No Bet History</h3>
              <p className="text-slate-500">Play some games to see your bet history here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...betHistory].reverse().map((b, i) => (
                <motion.div key={i}
                  className={`bg-surface-3 rounded-xl border p-3 flex items-center gap-3 ${b.won ? 'border-brand/15' : 'border-red-500/15'}`}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${b.won ? 'bg-brand/15 text-brand' : 'bg-red-500/15 text-red-400'}`}>
                    {b.won ? <Check size={14} /> : <X size={14} />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{b.game}</div>
                    <div className="text-xs text-slate-500">{new Date(b.time).toLocaleTimeString()}</div>
                  </div>
                  <div className={`font-bold text-sm ${b.pnl >= 0 ? 'text-brand' : 'text-red-400'}`}>
                    {b.pnl >= 0 ? '+' : ''}{b.pnl.toLocaleString()} GOAT
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* LOGIN PROMPT MODAL                                                */}
      {/* ================================================================= */}
      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setShowLoginPrompt(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface-2 rounded-2xl border border-white/[0.05] w-full max-w-sm overflow-hidden p-6 text-center"
              onClick={e => e.stopPropagation()}
            >
              <Lock size={32} className="text-yellow-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold mb-2">Account Required</h2>
              <p className="text-sm text-slate-400 mb-4">You need to be logged in to place bets and play games. Sign up to get 1,000 free GOAT tokens!</p>
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  // Open account modal via store
                  useStore.getState().setAccountModalOpen(true);
                }}
                className="w-full py-3 rounded-lg bg-brand text-black font-bold text-sm hover:bg-brand/90 transition-colors mb-2"
              >
                Sign In / Sign Up
              </button>
              <button onClick={() => setShowLoginPrompt(false)} className="text-sm text-slate-500 hover:text-white transition-colors">
                Maybe Later
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Wallet Required Prompt */}
        {showWalletRequired && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setShowWalletRequired(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface-2 rounded-2xl border border-white/[0.05] w-full max-w-sm overflow-hidden p-6 text-center"
              onClick={e => e.stopPropagation()}
            >
              <Wallet size={32} className="text-purple-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold mb-2">Wallet Required</h2>
              <p className="text-sm text-slate-400 mb-4">Connect your Phantom wallet on the Wallet page to start betting. You need a funded wallet to place bets.</p>
              <button
                onClick={() => {
                  setShowWalletRequired(false);
                  useStore.getState().setPage('wallet');
                }}
                className="w-full py-3 rounded-lg bg-purple-500 text-white font-bold text-sm hover:bg-purple-500/90 transition-colors mb-2"
              >
                Go to Wallet Page
              </button>
              <button onClick={() => setShowWalletRequired(false)} className="text-sm text-slate-500 hover:text-white transition-colors">
                Maybe Later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* WALLET CONNECT MODAL                                              */}
      {/* ================================================================= */}
      <AnimatePresence>
        {showWalletModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => { setShowWalletModal(false); setWalletAction(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface-2 rounded-2xl border border-white/[0.05] w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-white/[0.03] flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Wallet size={20} className="text-brand" />
                  {wallet ? 'Wallet & Funds' : 'Connect Wallet'}
                </h2>
                <button onClick={() => { setShowWalletModal(false); setWalletAction(null); }} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
              </div>

              <div className="p-5 space-y-4">
                {/* Connected wallet info */}
                {wallet && (
                  <div className="bg-surface-3 rounded-xl p-4 border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                          <Wallet size={14} className="text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-emerald-400">{wallet.type === 'phantom' ? 'Phantom' : 'MetaMask'}</div>
                          <div className="text-xs text-slate-500">{wallet.chain}</div>
                        </div>
                      </div>
                      <button onClick={disconnectWallet} className="text-xs text-red-400 hover:text-red-300 transition-colors">Disconnect</button>
                    </div>
                    <div className="font-mono text-xs text-slate-400 break-all bg-surface-1 rounded-lg px-3 py-2">{wallet.address}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="bg-surface-1 rounded-lg p-2 text-center">
                        <div className="text-xs text-slate-500">GOAT Balance</div>
                        <div className="font-bold text-yellow-400">{balance.toLocaleString()}</div>
                      </div>
                      <div className="bg-surface-1 rounded-lg p-2 text-center">
                        <div className="text-xs text-slate-500">USD Value</div>
                        <div className="font-bold">${(balance * 0.01).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Connect options if no wallet */}
                {!wallet && (
                  <>
                    <button onClick={connectPhantom}
                      className="w-full p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-colors flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 font-bold text-lg">P</div>
                      <div className="flex-1 text-left">
                        <div className="font-bold">Phantom</div>
                        <div className="text-xs text-slate-500">Connect Solana wallet</div>
                      </div>
                      <ChevronRight size={16} className="text-slate-500" />
                    </button>

                    <button onClick={connectMetaMask}
                      className="w-full p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-colors flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400 font-bold text-lg">M</div>
                      <div className="flex-1 text-left">
                        <div className="font-bold">MetaMask</div>
                        <div className="text-xs text-slate-500">Connect Ethereum wallet</div>
                      </div>
                      <ChevronRight size={16} className="text-slate-500" />
                    </button>
                  </>
                )}

                {/* Deposit / Withdraw actions */}
                {wallet && !walletAction && (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setWalletAction('deposit')}
                      className="p-3 rounded-xl bg-brand/10 border border-brand/20 hover:border-brand/40 transition-colors text-center">
                      <ArrowDown size={20} className="text-brand mx-auto mb-1" />
                      <div className="text-sm font-bold text-brand">Deposit</div>
                      <div className="text-[10px] text-slate-500">0% fee</div>
                    </button>
                    <button onClick={() => setWalletAction('withdraw')}
                      className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors text-center">
                      <ArrowUp size={20} className="text-red-400 mx-auto mb-1" />
                      <div className="text-sm font-bold text-red-400">Withdraw</div>
                      <div className="text-[10px] text-slate-500">0.5% fee</div>
                    </button>
                  </div>
                )}

                {/* Deposit form */}
                {walletAction === 'deposit' && (
                  <div className="bg-surface-3 rounded-xl p-4 border border-brand/20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm text-brand">Deposit Crypto</h3>
                      <button onClick={() => setWalletAction(null)} className="text-xs text-slate-500 hover:text-white">Back</button>
                    </div>
                    <div className="mb-3">
                      <label className="text-xs text-slate-500 mb-1 block">Amount (USD value)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2.5 bg-surface-1 border border-white/[0.05] rounded-lg outline-none focus:border-brand/30 transition-colors" />
                      </div>
                      {depositAmount && parseFloat(depositAmount) > 0 && (
                        <div className="text-xs text-slate-500 mt-1">
                          You will receive: <span className="text-yellow-400 font-bold">{Math.floor(parseFloat(depositAmount) * 100).toLocaleString()} GOAT</span>
                        </div>
                      )}
                    </div>
                    <button onClick={handleDeposit} disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                      className="w-full py-2.5 rounded-lg bg-brand text-black font-bold text-sm transition-colors hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed">
                      Confirm Deposit
                    </button>
                  </div>
                )}

                {/* Withdraw form */}
                {walletAction === 'withdraw' && (
                  <div className="bg-surface-3 rounded-xl p-4 border border-red-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm text-red-400">Withdraw to Wallet</h3>
                      <button onClick={() => setWalletAction(null)} className="text-xs text-slate-500 hover:text-white">Back</button>
                    </div>
                    <div className="mb-3">
                      <label className="text-xs text-slate-500 mb-1 block">Amount (USD value)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2.5 bg-surface-1 border border-white/[0.05] rounded-lg outline-none focus:border-red-500/30 transition-colors" />
                      </div>
                      {withdrawAmount && parseFloat(withdrawAmount) > 0 && (() => {
                        const goat = Math.floor(parseFloat(withdrawAmount) * 100);
                        const fee = Math.ceil(goat * 0.005);
                        return (
                          <div className="text-xs text-slate-500 mt-1">
                            Deducting: <span className="text-red-400 font-bold">{goat.toLocaleString()} GOAT</span>
                            <span className="text-yellow-400/70 ml-1">(+{fee} fee)</span>
                            {goat > balance && <span className="text-red-500 ml-1">Insufficient balance</span>}
                          </div>
                        );
                      })()}
                    </div>
                    <button onClick={handleWithdraw}
                      disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || Math.floor(parseFloat(withdrawAmount) * 100) > balance}
                      className="w-full py-2.5 rounded-lg bg-red-500 text-white font-bold text-sm transition-colors hover:bg-red-500/90 disabled:opacity-40 disabled:cursor-not-allowed">
                      Confirm Withdrawal
                    </button>
                  </div>
                )}

                {/* Fee structure */}
                <div className="bg-surface-1 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500"><span>Deposit Fee</span><span className="text-brand font-bold">0%</span></div>
                  <div className="flex justify-between text-slate-500"><span>Withdrawal Fee</span><span className="text-yellow-400 font-bold">$2.50</span></div>
                  <div className="flex justify-between text-slate-500"><span>Win Commission</span><span className="text-yellow-400 font-bold">12%</span></div>
                  <div className="flex justify-between text-slate-500"><span>GOAT Rate</span><span>1 GOAT = $0.01</span></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
