import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../hooks/useStore';
import { useGoatedAI } from '../hooks/useGoatedAI';
import {
  TrendingUp, TrendingDown, ArrowUp, ArrowDown, BarChart3, Activity,
  RefreshCw, Zap, Target, Globe, Clock, DollarSign, Layers, Search,
  ChevronRight, ChevronDown, ChevronUp, ExternalLink, Eye, Flame,
  Brain, AlertTriangle, Star, Sparkles, Radio, Wifi, Filter, X,
  ArrowUpRight, ArrowDownRight, Minus, Signal, LayoutGrid, List,
  PieChart, LineChart, Hash, ShieldCheck, Percent, Coins, Building2,
  Landmark, Fuel, Gem, Scale, Vote, Cpu, Banknote, CircleDollarSign
} from 'lucide-react';

// ============================================================================
// MARKET INTELLIGENCE - Multi-Asset Real-Time Dashboard
// Crypto | Stocks | Prediction Markets | Forex | Commodities
// ============================================================================

const REFRESH_INTERVAL = 15_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatPrice(n, decimals) {
  if (n == null || isNaN(n)) return '$0.00';
  if (decimals != null) return `$${n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(6)}`;
}

function formatLargeNumber(n) {
  if (n == null || isNaN(n)) return '$0';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatCompactNumber(n) {
  if (n == null || isNaN(n)) return '0';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n}`;
}

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

// ---------------------------------------------------------------------------
// ASSET CLASS COLORS / ICONS
// ---------------------------------------------------------------------------
const ASSET_COLORS = {
  // Crypto
  BTC: '#f7931a', ETH: '#627eea', SOL: '#00ffa3', BNB: '#f3ba2f',
  ADA: '#0033ad', DOT: '#e6007a', AVAX: '#e84142', MATIC: '#8247e5',
  LINK: '#2a5ada', UNI: '#ff007a', XRP: '#00aae4', DOGE: '#c2a633',
  ATOM: '#2e3148', NEAR: '#00ec97', ARB: '#28a0f0', OP: '#ff0420',
  APT: '#00bcd4', SUI: '#4da2ff', FIL: '#0090ff', INJ: '#00f2fe',
  // Stocks
  AAPL: '#a2aaad', NVDA: '#76b900', TSLA: '#cc0000', MSFT: '#00a4ef',
  GOOGL: '#4285f4', AMZN: '#ff9900', META: '#0668e1', JPM: '#003087',
  'SPY': '#1a73e8', 'QQQ': '#7b1fa2', 'DIA': '#0d47a1', 'IWM': '#2e7d32',
  // Forex
  'EUR/USD': '#003399', 'GBP/USD': '#cf142b', 'USD/JPY': '#bc002d',
  'AUD/USD': '#00843d', 'USD/CAD': '#ff0000', 'USD/CHF': '#d52b1e',
  // Commodities
  GOLD: '#ffd700', SILVER: '#c0c0c0', OIL: '#4a4a4a', 'NAT GAS': '#00bcd4',
  COPPER: '#b87333', PLATINUM: '#e5e4e2',
};

const CLASS_ICONS = {
  crypto: Coins,
  stocks: Building2,
  predictions: Brain,
  forex: CircleDollarSign,
  commodities: Gem,
};

const CLASS_COLORS = {
  crypto: '#00ff88',
  stocks: '#00a4ef',
  predictions: '#a855f7',
  forex: '#f59e0b',
  commodities: '#ffd700',
};

// ---------------------------------------------------------------------------
// MOCK DATA: Stocks
// ---------------------------------------------------------------------------
const STOCKS_DATA = [
  { id: 'spy', symbol: 'SPY', name: 'S&P 500 ETF', price: 5842.50, change24h: 0.73, marketCap: 5.2e12, volume24h: 82e9, assetClass: 'stocks' },
  { id: 'qqq', symbol: 'QQQ', name: 'Nasdaq 100 ETF', price: 20465.20, change24h: 1.12, marketCap: 3.8e12, volume24h: 64e9, assetClass: 'stocks' },
  { id: 'dia', symbol: 'DIA', name: 'Dow Jones ETF', price: 43210.80, change24h: -0.18, marketCap: 4.1e12, volume24h: 38e9, assetClass: 'stocks' },
  { id: 'iwm', symbol: 'IWM', name: 'Russell 2000 ETF', price: 2284.30, change24h: -0.92, marketCap: 1.8e12, volume24h: 22e9, assetClass: 'stocks' },
  { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.', price: 234.82, change24h: 1.42, marketCap: 3.62e12, volume24h: 58e9, assetClass: 'stocks' },
  { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA Corp.', price: 142.56, change24h: 3.87, marketCap: 3.49e12, volume24h: 48e9, assetClass: 'stocks' },
  { id: 'tsla', symbol: 'TSLA', name: 'Tesla Inc.', price: 248.92, change24h: -2.34, marketCap: 793e9, volume24h: 32e9, assetClass: 'stocks' },
  { id: 'msft', symbol: 'MSFT', name: 'Microsoft Corp.', price: 442.18, change24h: 0.56, marketCap: 3.29e12, volume24h: 28e9, assetClass: 'stocks' },
  { id: 'googl', symbol: 'GOOGL', name: 'Alphabet Inc.', price: 178.94, change24h: 0.89, marketCap: 2.21e12, volume24h: 24e9, assetClass: 'stocks' },
  { id: 'amzn', symbol: 'AMZN', name: 'Amazon.com Inc.', price: 218.64, change24h: 1.67, marketCap: 2.28e12, volume24h: 31e9, assetClass: 'stocks' },
  { id: 'meta', symbol: 'META', name: 'Meta Platforms', price: 612.40, change24h: 2.15, marketCap: 1.56e12, volume24h: 22e9, assetClass: 'stocks' },
  { id: 'jpm', symbol: 'JPM', name: 'JPMorgan Chase', price: 242.68, change24h: -0.45, marketCap: 698e9, volume24h: 12e9, assetClass: 'stocks' },
];

// ---------------------------------------------------------------------------
// MOCK DATA: Forex pairs
// ---------------------------------------------------------------------------
const FOREX_DATA = [
  { id: 'eurusd', symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0892, change24h: 0.14, volume24h: 2.1e12, assetClass: 'forex' },
  { id: 'gbpusd', symbol: 'GBP/USD', name: 'British Pound / USD', price: 1.2734, change24h: -0.22, volume24h: 1.1e12, assetClass: 'forex' },
  { id: 'usdjpy', symbol: 'USD/JPY', name: 'US Dollar / Yen', price: 149.82, change24h: 0.31, volume24h: 1.5e12, assetClass: 'forex' },
  { id: 'audusd', symbol: 'AUD/USD', name: 'Australian Dollar / USD', price: 0.6648, change24h: -0.47, volume24h: 450e9, assetClass: 'forex' },
  { id: 'usdcad', symbol: 'USD/CAD', name: 'US Dollar / Canadian', price: 1.3542, change24h: 0.08, volume24h: 380e9, assetClass: 'forex' },
  { id: 'usdchf', symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', price: 0.8834, change24h: -0.15, volume24h: 320e9, assetClass: 'forex' },
  { id: 'nzdusd', symbol: 'NZD/USD', name: 'New Zealand Dollar / USD', price: 0.6124, change24h: -0.62, volume24h: 120e9, assetClass: 'forex' },
  { id: 'eurgbp', symbol: 'EUR/GBP', name: 'Euro / British Pound', price: 0.8554, change24h: 0.36, volume24h: 280e9, assetClass: 'forex' },
];

// ---------------------------------------------------------------------------
// MOCK DATA: Commodities
// ---------------------------------------------------------------------------
const COMMODITIES_DATA = [
  { id: 'gold', symbol: 'GOLD', name: 'Gold (XAU/USD)', price: 2648.30, change24h: 0.82, volume24h: 180e9, marketCap: null, assetClass: 'commodities' },
  { id: 'silver', symbol: 'SILVER', name: 'Silver (XAG/USD)', price: 31.24, change24h: 1.34, volume24h: 28e9, marketCap: null, assetClass: 'commodities' },
  { id: 'oil', symbol: 'OIL', name: 'Crude Oil (WTI)', price: 71.82, change24h: -1.87, volume24h: 95e9, marketCap: null, assetClass: 'commodities' },
  { id: 'natgas', symbol: 'NAT GAS', name: 'Natural Gas', price: 3.42, change24h: 2.64, volume24h: 18e9, marketCap: null, assetClass: 'commodities' },
  { id: 'copper', symbol: 'COPPER', name: 'Copper (HG)', price: 4.18, change24h: -0.72, volume24h: 22e9, marketCap: null, assetClass: 'commodities' },
  { id: 'platinum', symbol: 'PLATINUM', name: 'Platinum (XPT/USD)', price: 982.40, change24h: 0.44, volume24h: 6e9, marketCap: null, assetClass: 'commodities' },
];

// ---------------------------------------------------------------------------
// MOCK DATA: Prediction Markets (expanded 25+ events)
// ---------------------------------------------------------------------------
const PREDICTION_MARKETS = [
  // Political
  { id: 'pm1', question: 'Will the Republican candidate win the 2028 Presidential Election?', yesPrice: 0.48, volume: 142000000, category: 'Political', platform: 'Polymarket', trend: 'up', change: +1.8, alpha: '+108%', resolution: 'Nov 2028' },
  { id: 'pm2', question: 'Will Trump run for President in 2028?', yesPrice: 0.12, volume: 68000000, category: 'Political', platform: 'Polymarket', trend: 'down', change: -2.4, alpha: '+733%', resolution: 'Jun 2028' },
  { id: 'pm3', question: 'Will there be a US government shutdown in 2026?', yesPrice: 0.38, volume: 24000000, category: 'Political', platform: 'Kalshi', trend: 'up', change: +4.1, alpha: '+163%', resolution: 'Dec 2026' },
  { id: 'pm4', question: 'Will US impose new tariffs on China in Q2 2026?', yesPrice: 0.67, volume: 31000000, category: 'Political', platform: 'Kalshi', trend: 'up', change: +2.9, alpha: '+49%', resolution: 'Jun 2026' },
  // Economic / Macro
  { id: 'pm5', question: 'Will the Fed cut rates before June 2026?', yesPrice: 0.61, volume: 89000000, category: 'Economic', platform: 'Kalshi', trend: 'down', change: -1.8, alpha: '+64%', resolution: 'Jun 2026' },
  { id: 'pm6', question: 'Will US GDP growth exceed 3% in 2026?', yesPrice: 0.29, volume: 18000000, category: 'Economic', platform: 'Kalshi', trend: 'down', change: -0.7, alpha: '+245%', resolution: 'Jan 2027' },
  { id: 'pm7', question: 'Will S&P 500 hit 6500 in 2026?', yesPrice: 0.42, volume: 54000000, category: 'Economic', platform: 'Kalshi', trend: 'up', change: +3.2, alpha: '+138%', resolution: 'Dec 2026' },
  { id: 'pm8', question: 'Will US inflation drop below 2% by end of 2026?', yesPrice: 0.34, volume: 22000000, category: 'Economic', platform: 'Kalshi', trend: 'up', change: +1.1, alpha: '+194%', resolution: 'Dec 2026' },
  { id: 'pm9', question: 'Will US unemployment exceed 5% in 2026?', yesPrice: 0.18, volume: 15000000, category: 'Economic', platform: 'Kalshi', trend: 'flat', change: +0.2, alpha: '+456%', resolution: 'Dec 2026' },
  // Crypto
  { id: 'pm10', question: 'Will BTC reach $150K before July 2026?', yesPrice: 0.31, volume: 76000000, category: 'Crypto', platform: 'Polymarket', trend: 'up', change: +5.4, alpha: '+223%', resolution: 'Jul 2026' },
  { id: 'pm11', question: 'Will Ethereum flip BTC market cap in 2026?', yesPrice: 0.06, volume: 12000000, category: 'Crypto', platform: 'Polymarket', trend: 'flat', change: +0.2, alpha: '+1567%', resolution: 'Dec 2026' },
  { id: 'pm12', question: 'Will Solana reach $500 in 2026?', yesPrice: 0.22, volume: 28000000, category: 'Crypto', platform: 'Polymarket', trend: 'up', change: +3.1, alpha: '+355%', resolution: 'Dec 2026' },
  { id: 'pm13', question: 'US spot Solana ETF approved in 2026?', yesPrice: 0.41, volume: 45000000, category: 'Crypto', platform: 'Polymarket', trend: 'up', change: +8.7, alpha: '+144%', resolution: 'Dec 2026' },
  { id: 'pm14', question: 'Will DOGE reach $1 in 2026?', yesPrice: 0.09, volume: 34000000, category: 'Crypto', platform: 'Polymarket', trend: 'up', change: +1.9, alpha: '+1011%', resolution: 'Dec 2026' },
  { id: 'pm15', question: 'Will AI tokens outperform BTC in Q2 2026?', yesPrice: 0.44, volume: 16000000, category: 'Crypto', platform: 'Kalshi', trend: 'up', change: +2.4, alpha: '+127%', resolution: 'Jun 2026' },
  { id: 'pm16', question: 'Will total crypto market cap exceed $5T in 2026?', yesPrice: 0.52, volume: 38000000, category: 'Crypto', platform: 'Polymarket', trend: 'up', change: +1.6, alpha: '+92%', resolution: 'Dec 2026' },
  // Tech
  { id: 'pm17', question: 'Will Apple release an AI-first iPhone in 2026?', yesPrice: 0.73, volume: 21000000, category: 'Tech', platform: 'Kalshi', trend: 'up', change: +1.2, alpha: '+37%', resolution: 'Dec 2026' },
  { id: 'pm18', question: 'Will OpenAI IPO in 2026?', yesPrice: 0.35, volume: 42000000, category: 'Tech', platform: 'Polymarket', trend: 'down', change: -3.4, alpha: '+186%', resolution: 'Dec 2026' },
  { id: 'pm19', question: 'Will AGI be declared achieved by a major lab in 2026?', yesPrice: 0.14, volume: 56000000, category: 'Tech', platform: 'Polymarket', trend: 'up', change: +2.8, alpha: '+614%', resolution: 'Dec 2026' },
  { id: 'pm20', question: 'Will NVIDIA market cap exceed $5T in 2026?', yesPrice: 0.38, volume: 29000000, category: 'Tech', platform: 'Kalshi', trend: 'up', change: +4.2, alpha: '+163%', resolution: 'Dec 2026' },
  { id: 'pm21', question: 'Will Tesla release a fully autonomous robotaxi in 2026?', yesPrice: 0.19, volume: 33000000, category: 'Tech', platform: 'Polymarket', trend: 'down', change: -1.6, alpha: '+426%', resolution: 'Dec 2026' },
  // Geopolitical
  { id: 'pm22', question: 'Will Russia-Ukraine ceasefire happen in 2026?', yesPrice: 0.32, volume: 48000000, category: 'Geopolitical', platform: 'Polymarket', trend: 'up', change: +2.1, alpha: '+213%', resolution: 'Dec 2026' },
  { id: 'pm23', question: 'Will China invade Taiwan in 2026?', yesPrice: 0.04, volume: 62000000, category: 'Geopolitical', platform: 'Polymarket', trend: 'flat', change: -0.1, alpha: '+2400%', resolution: 'Dec 2026' },
  { id: 'pm24', question: 'Will Iran develop a nuclear weapon in 2026?', yesPrice: 0.08, volume: 19000000, category: 'Geopolitical', platform: 'Kalshi', trend: 'down', change: -0.5, alpha: '+1150%', resolution: 'Dec 2026' },
  // Sports / Entertainment
  { id: 'pm25', question: 'Will viewership for 2026 World Cup final exceed 2B?', yesPrice: 0.62, volume: 14000000, category: 'Sports', platform: 'Polymarket', trend: 'up', change: +0.8, alpha: '+61%', resolution: 'Jul 2026' },
  { id: 'pm26', question: 'Will a streaming service surpass Netflix subscribers in 2026?', yesPrice: 0.21, volume: 8000000, category: 'Tech', platform: 'Kalshi', trend: 'down', change: -1.2, alpha: '+376%', resolution: 'Dec 2026' },
];

// ---------------------------------------------------------------------------
// Alpha signals
// ---------------------------------------------------------------------------
const ALPHA_SIGNALS = [
  { id: 'a1', title: 'Whale Alert: 12,400 BTC moved from exchange to cold wallet', type: 'whale', severity: 'high', coin: 'BTC', time: Date.now() - 900_000, impact: 'Bullish -- supply squeeze signal',
    trade: { direction: 'LONG', asset: 'BTC', entry: '$97,200', target: '$102,000', stop: '$95,500', leverage: '3x', timeframe: '2-7 days', expectedReturn: '+4.9%', predictionLink: 'BTC above $100K by April 2026?', predictionOdds: '72% YES' } },
  { id: 'a2', title: 'NVDA after-hours: beat earnings by 18%, guidance raised', type: 'flow', severity: 'high', coin: 'NVDA', time: Date.now() - 1_200_000, impact: 'Bullish -- AI capex cycle intact',
    trade: { direction: 'LONG', asset: 'NVDA', entry: '$142.50', target: '$165.00', stop: '$135.00', leverage: '1x (shares)', timeframe: '1-4 weeks', expectedReturn: '+15.8%', predictionLink: 'Will NVIDIA market cap exceed $5T in 2026?', predictionOdds: '38% YES (+163% alpha)' } },
  { id: 'a3', title: 'Ethereum ETF inflows hit $340M today -- 3rd consecutive record', type: 'flow', severity: 'high', coin: 'ETH', time: Date.now() - 1_800_000, impact: 'Bullish -- institutional demand accelerating',
    trade: { direction: 'LONG', asset: 'ETH', entry: '$3,840', target: '$4,200', stop: '$3,650', leverage: '5x', timeframe: '1-2 weeks', expectedReturn: '+9.4%', predictionLink: 'Will Ethereum flip BTC market cap in 2026?', predictionOdds: '6% YES (+1567% alpha)' } },
  { id: 'a4', title: 'Gold breaks $2,650 as Middle East tensions escalate', type: 'volume', severity: 'high', coin: 'GOLD', time: Date.now() - 2_400_000, impact: 'Bullish -- safe haven bid intensifying',
    trade: { direction: 'LONG', asset: 'GOLD (XAU/USD)', entry: '$2,648', target: '$2,720', stop: '$2,610', leverage: '10x', timeframe: '3-10 days', expectedReturn: '+2.7%', predictionLink: null, predictionOdds: null } },
  { id: 'a5', title: 'SOL open interest surged 28% in 4 hours on Binance', type: 'derivatives', severity: 'high', coin: 'SOL', time: Date.now() - 3_600_000, impact: 'Volatile -- leveraged long buildup',
    trade: { direction: 'LONG', asset: 'SOL', entry: '$198', target: '$225', stop: '$185', leverage: '5x', timeframe: '1-3 days', expectedReturn: '+13.6%', predictionLink: 'Will Solana reach $500 in 2026?', predictionOdds: '22% YES (+355% alpha)' } },
  { id: 'a6', title: 'EUR/USD breaks above 1.09 -- ECB rate decision tomorrow', type: 'flow', severity: 'medium', coin: 'EUR/USD', time: Date.now() - 4_200_000, impact: 'Volatile -- forex markets pricing in divergence',
    trade: { direction: 'LONG', asset: 'EUR/USD', entry: '1.0892', target: '1.0960', stop: '1.0840', leverage: '20x', timeframe: '1-3 days', expectedReturn: '+0.6% (12% w/ leverage)', predictionLink: null, predictionOdds: null } },
  { id: 'a7', title: 'BTC funding rate turning negative across major exchanges', type: 'derivatives', severity: 'medium', coin: 'BTC', time: Date.now() - 5_400_000, impact: 'Contrarian bullish -- shorts may get squeezed',
    trade: { direction: 'LONG', asset: 'BTC Perp', entry: '$97,400', target: '$101,000', stop: '$95,800', leverage: '5x', timeframe: '12-48h', expectedReturn: '+3.7%', predictionLink: 'BTC above $100K by April 2026?', predictionOdds: '72% YES' } },
  { id: 'a8', title: 'TSLA put/call ratio spikes to 1.8 -- unusual options activity', type: 'derivatives', severity: 'medium', coin: 'TSLA', time: Date.now() - 6_000_000, impact: 'Bearish -- hedging activity elevated',
    trade: { direction: 'SHORT', asset: 'TSLA', entry: '$248.90', target: '$230.00', stop: '$258.00', leverage: '2x', timeframe: '1-2 weeks', expectedReturn: '+7.6%', predictionLink: 'Will Tesla release a fully autonomous robotaxi in 2026?', predictionOdds: '19% YES' } },
  { id: 'a9', title: 'AVAX sees 140% spike in DEX volume -- new protocol launch', type: 'volume', severity: 'medium', coin: 'AVAX', time: Date.now() - 7_200_000, impact: 'Bullish -- ecosystem growth catalyst',
    trade: { direction: 'LONG', asset: 'AVAX', entry: '$38.50', target: '$45.00', stop: '$35.50', leverage: '3x', timeframe: '3-7 days', expectedReturn: '+16.9%', predictionLink: null, predictionOdds: null } },
  { id: 'a10', title: 'Crude oil inventories draw larger than expected (-8.2M bbl)', type: 'volume', severity: 'medium', coin: 'OIL', time: Date.now() - 8_400_000, impact: 'Bullish -- tighter supply outlook',
    trade: { direction: 'LONG', asset: 'WTI Crude', entry: '$71.82', target: '$75.50', stop: '$69.80', leverage: '5x', timeframe: '1-2 weeks', expectedReturn: '+5.1%', predictionLink: null, predictionOdds: null } },
];

// ---------------------------------------------------------------------------
// Spread Comparison: GOATED vs Kalshi vs Polymarket
// ---------------------------------------------------------------------------
const SPREAD_COMPARISONS = [
  { event: 'Republican wins 2028 Election', goated: 0.46, kalshi: 0.52, polymarket: 0.50, volume: '142M', category: 'Political' },
  { event: 'Fed cuts rates before June 2026', goated: 0.59, kalshi: 0.65, polymarket: 0.63, volume: '89M', category: 'Economic' },
  { event: 'BTC reaches $150K by Jul 2026', goated: 0.29, kalshi: 0.35, polymarket: 0.33, volume: '76M', category: 'Crypto' },
  { event: 'S&P 500 hits 6500 in 2026', goated: 0.40, kalshi: 0.46, polymarket: 0.44, volume: '54M', category: 'Economic' },
  { event: 'OpenAI IPO in 2026', goated: 0.33, kalshi: 0.39, polymarket: 0.37, volume: '42M', category: 'Tech' },
  { event: 'Solana ETF approved in 2026', goated: 0.39, kalshi: 0.45, polymarket: 0.43, volume: '45M', category: 'Crypto' },
];

// ---------------------------------------------------------------------------
// Degen Picks (highest alpha plays for degen mode)
// ---------------------------------------------------------------------------
const DEGEN_PICKS = [
  { asset: 'SOL', direction: 'LONG', leverage: '10x', entry: '$198', target: '$250', confidence: 94, expectedReturn: '+26.3%', reason: 'ETF approval catalyst + OI surge' },
  { asset: 'BTC', direction: 'LONG', leverage: '5x', entry: '$97,200', target: '$115,000', confidence: 91, expectedReturn: '+18.3%', reason: 'Whale accumulation + negative funding' },
  { asset: 'DOGE', direction: 'LONG', leverage: '20x', entry: '$0.18', target: '$0.35', confidence: 78, expectedReturn: '+94.4%', reason: 'Meme supercycle + retail FOMO incoming' },
  { asset: 'TSLA', direction: 'SHORT', leverage: '3x', entry: '$248.90', target: '$210', confidence: 82, expectedReturn: '+15.6%', reason: 'Put/call ratio 1.8x + robotaxi delay' },
  { asset: 'AVAX', direction: 'LONG', leverage: '8x', entry: '$38.50', target: '$55', confidence: 85, expectedReturn: '+42.9%', reason: 'DEX volume +140% + new protocol launch' },
];

// ---------------------------------------------------------------------------
// Cross-Asset Correlations
// ---------------------------------------------------------------------------
const CROSS_CORRELATIONS = [
  { pair: 'BTC-Gold', correlation: 0.31, direction: 'rising', change: '+0.08', insight: 'Safe-haven narrative strengthening as macro uncertainty grows', colorA: '#f7931a', colorB: '#ffd700' },
  { pair: 'BTC-SPY', correlation: -0.12, direction: 'diverging', change: '-0.19', insight: 'Decoupling from equities -- crypto becoming uncorrelated alpha', colorA: '#f7931a', colorB: '#1a73e8' },
  { pair: 'ETH-SOL', correlation: 0.87, direction: 'stable', change: '+0.02', insight: 'Alt-L1s moving in lockstep. Rotation risk low', colorA: '#627eea', colorB: '#00ffa3' },
  { pair: 'NVDA-BTC', correlation: 0.44, direction: 'rising', change: '+0.11', insight: 'AI/crypto convergence trade gaining institutional traction', colorA: '#76b900', colorB: '#f7931a' },
  { pair: 'Oil-USD/JPY', correlation: 0.38, direction: 'stable', change: '-0.03', insight: 'Energy-yen carry trade correlation holding steady', colorA: '#4a4a4a', colorB: '#bc002d' },
  { pair: 'Gold-EUR/USD', correlation: 0.52, direction: 'rising', change: '+0.06', insight: 'Dollar weakness benefiting both gold and euro', colorA: '#ffd700', colorB: '#003399' },
];

// ---------------------------------------------------------------------------
// Fear & Greed + Market Health
// ---------------------------------------------------------------------------
const FEAR_GREED_INDEX = {
  value: 72,
  label: 'Greed',
  previousClose: 68,
  weekAgo: 61,
  monthAgo: 45,
};

const BTC_DOMINANCE = 52.4;
const ETH_DOMINANCE = 17.8;

const signalTypeIcons = { whale: Zap, flow: TrendingUp, derivatives: Activity, volume: BarChart3, adoption: Globe };
const signalSeverityColors = {
  high: 'bg-red-500/15 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
const MARKET_TABS = [
  { key: 'all', label: 'All Markets', icon: Globe },
  { key: 'crypto', label: 'Crypto', icon: Coins },
  { key: 'stocks', label: 'Stocks', icon: Building2 },
  { key: 'predictions', label: 'Predictions', icon: Brain },
  { key: 'forex', label: 'Forex', icon: CircleDollarSign },
  { key: 'commodities', label: 'Commodities', icon: Gem },
];

// ---------------------------------------------------------------------------
// HeatmapCell (multi-asset)
// ---------------------------------------------------------------------------
function HeatmapCell({ asset, onClick, flash }) {
  const change = asset.change24h ?? 0;
  let bgClass = 'bg-white/[0.02]';
  if (change > 5) bgClass = 'bg-emerald-500/30';
  else if (change > 2) bgClass = 'bg-emerald-500/20';
  else if (change > 0) bgClass = 'bg-emerald-500/10';
  else if (change < -5) bgClass = 'bg-red-500/30';
  else if (change < -2) bgClass = 'bg-red-500/20';
  else if (change < 0) bgClass = 'bg-red-500/10';

  const textColor = change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-slate-400';
  const accentColor = ASSET_COLORS[asset.symbol] || CLASS_COLORS[asset.assetClass] || '#888';

  const flashBorder = flash === 'green' ? 'border-emerald-400/60 shadow-emerald-500/20 shadow-lg' : flash === 'red' ? 'border-red-400/60 shadow-red-500/20 shadow-lg' : 'border-white/5';

  return (
    <motion.button
      onClick={onClick}
      className={`${bgClass} rounded-xl p-3 border ${flashBorder} text-left transition-all hover:border-white/10 hover:scale-[1.02] active:scale-[0.98] w-full`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {asset.symbol?.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <span className="text-xs font-bold text-white truncate block">{asset.symbol}</span>
          <p className="text-[9px] text-slate-500 leading-none truncate">{asset.name}</p>
        </div>
      </div>
      <div className={`text-sm font-bold mb-0.5 transition-colors duration-300 ${flash === 'green' ? 'text-emerald-300' : flash === 'red' ? 'text-red-300' : 'text-white'}`}>
        {asset.assetClass === 'forex' ? `$${asset.price.toFixed(4)}` : formatPrice(asset.price)}
      </div>
      <div className={`flex items-center gap-1 text-xs font-medium ${textColor}`}>
        {change > 0 ? <ArrowUpRight size={12} /> : change < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
        {change > 0 ? '+' : ''}{change.toFixed(2)}%
      </div>
      {asset.assetClass && (
        <div className="mt-1.5">
          <span
            className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
            style={{ backgroundColor: `${CLASS_COLORS[asset.assetClass] || '#888'}15`, color: CLASS_COLORS[asset.assetClass] || '#888' }}
          >
            {asset.assetClass}
          </span>
        </div>
      )}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// PredictionCard (with alpha/return display)
// ---------------------------------------------------------------------------
function PredictionCard({ market, onBet }) {
  const [betSide, setBetSide] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const pct = Math.round(market.yesPrice * 100);
  const noPct = 100 - pct;
  const trendColor = market.trend === 'up' ? 'text-emerald-400' : market.trend === 'down' ? 'text-red-400' : 'text-slate-400';
  const TrendIcon = market.trend === 'up' ? ArrowUpRight : market.trend === 'down' ? ArrowDownRight : Minus;
  const isTrending = market.volume >= 40000000;
  const QUICK_BETS = [5, 25, 100, 500];

  const calcPayout = (amount, side) => {
    if (!amount) return { payout: 0, returnPct: 0 };
    const price = side === 'yes' ? market.yesPrice : (1 - market.yesPrice);
    const payout = (parseFloat(amount) / price).toFixed(2);
    const returnPct = ((1 / price - 1) * 100).toFixed(0);
    return { payout, returnPct };
  };

  return (
    <motion.div
      className={`rounded-xl border bg-surface-2/60 p-4 hover:border-white/15 transition-all ${isTrending ? 'border-orange-500/20' : 'border-white/5'}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="text-sm font-semibold text-white leading-snug flex-1">{market.question}</h4>
        <div className="flex items-center gap-1.5 shrink-0">
          {isTrending && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/20 animate-pulse">
              Trending
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-slate-400">
            {market.platform}
          </span>
        </div>
      </div>

      {/* Probability bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">YES probability</span>
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon size={12} />
            {market.change > 0 ? '+' : ''}{market.change}%
          </div>
        </div>
        <div className="h-3 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: pct >= 60 ? 'linear-gradient(90deg, #10b981, #34d399)' : pct <= 30 ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xl font-black text-white">{pct}<span className="text-sm text-slate-500">%</span></span>
          <span className="text-xs text-slate-500">Vol {formatCompactNumber(market.volume)}</span>
        </div>
      </div>

      {/* Quick payout preview */}
      <div className="mb-3 p-2.5 rounded-lg bg-black/20 border border-white/5">
        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">Quick Payout Preview (YES wins)</div>
        <div className="grid grid-cols-4 gap-1.5">
          {QUICK_BETS.map(amt => {
            const { payout } = calcPayout(amt, 'yes');
            return (
              <button
                key={amt}
                onClick={() => { setBetSide('yes'); setBetAmount(String(amt)); }}
                className="text-center p-1.5 rounded-lg bg-white/[0.03] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 transition-all cursor-pointer group"
              >
                <div className="text-[10px] text-slate-400 group-hover:text-emerald-400">Bet ${amt}</div>
                <div className="text-xs font-bold text-white group-hover:text-emerald-300">Win ${payout}</div>
                <div className="text-[9px] text-emerald-500/70">{((1 / market.yesPrice - 1) * 100).toFixed(0)}% return</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alpha badge - more prominent */}
      {market.alpha && (
        <div className="mb-3 p-2.5 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-emerald-400" />
              <span className="text-sm font-black text-emerald-400">{market.alpha}</span>
              <span className="text-[10px] text-emerald-400/70">return if YES wins</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">ALPHA</span>
          </div>
        </div>
      )}

      {/* Spread comparison: GOATED vs Kalshi vs Polymarket */}
      {(() => {
        const spread = SPREAD_COMPARISONS.find(s => market.question.toLowerCase().includes(s.event.toLowerCase().slice(0, 15)));
        if (!spread) return null;
        const kalshiSave = ((1 - spread.goated / spread.kalshi) * 100).toFixed(0);
        const polySave = ((1 - spread.goated / spread.polymarket) * 100).toFixed(0);
        return (
          <div className="mb-3 p-2.5 rounded-lg bg-brand/5 border border-brand/15">
            <div className="flex items-center gap-1.5 mb-2">
              <Scale size={11} className="text-brand" />
              <span className="text-[10px] font-bold text-brand uppercase tracking-wider">Spread Comparison</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-brand/10 rounded-lg p-1.5 border border-brand/20">
                <div className="text-[8px] text-brand/70 uppercase">GOATED</div>
                <div className="text-xs font-black text-brand">${spread.goated.toFixed(2)}</div>
              </div>
              <div className="bg-black/20 rounded-lg p-1.5 border border-white/5">
                <div className="text-[8px] text-slate-500 uppercase">Kalshi</div>
                <div className="text-xs font-bold text-slate-400">${spread.kalshi.toFixed(2)}</div>
                <div className="text-[8px] text-emerald-400 font-bold">Save {kalshiSave}%</div>
              </div>
              <div className="bg-black/20 rounded-lg p-1.5 border border-white/5">
                <div className="text-[8px] text-slate-500 uppercase">Polymarket</div>
                <div className="text-xs font-bold text-slate-400">${spread.polymarket.toFixed(2)}</div>
                <div className="text-[8px] text-emerald-400 font-bold">Save {polySave}%</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Category + resolution metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand/10 text-brand border border-brand/20">
            {market.category}
          </span>
          {market.resolution && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock size={9} />
              {market.resolution}
            </span>
          )}
        </div>
        <span className="text-[9px] text-slate-600">Vol ${formatCompactNumber(market.volume)}</span>
      </div>

      {/* Bet buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => setBetSide(betSide === 'yes' ? null : 'yes')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
            betSide === 'yes'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
          }`}
        >
          BET YES {pct}% <span className="opacity-60 ml-1">${market.yesPrice.toFixed(2)}</span>
        </button>
        <button
          onClick={() => setBetSide(betSide === 'no' ? null : 'no')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
            betSide === 'no'
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
          }`}
        >
          BET NO {noPct}% <span className="opacity-60 ml-1">${(1 - market.yesPrice).toFixed(2)}</span>
        </button>
      </div>

      {/* Bet amount input */}
      <AnimatePresence>
        {betSide && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`mt-2 p-3 rounded-lg border ${betSide === 'yes' ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-slate-400">Bet Amount (USDC)</span>
                <div className="flex gap-1 ml-auto">
                  {QUICK_BETS.map(v => (
                    <button key={v} onClick={() => setBetAmount(String(v))} className={`text-[9px] px-2 py-0.5 rounded font-bold transition-colors ${betAmount === String(v) ? 'bg-brand/20 text-brand' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>${v}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    placeholder="0.00"
                    value={betAmount}
                    onChange={e => setBetAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand/30"
                  />
                </div>
                <button
                  onClick={() => { if (onBet) onBet(market.id, betSide, betAmount); setBetSide(null); setBetAmount(''); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    betSide === 'yes'
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'bg-red-500 text-white hover:bg-red-400'
                  } ${!betAmount ? 'opacity-40 cursor-not-allowed' : ''}`}
                  disabled={!betAmount}
                >
                  {betSide === 'yes' ? 'BUY YES' : 'BUY NO'}
                </button>
              </div>
              {betAmount && (() => {
                const { payout, returnPct } = calcPayout(betAmount, betSide);
                return (
                  <div className="mt-2 p-2 rounded-lg bg-black/20 border border-white/5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">If {betSide.toUpperCase()} wins:</span>
                      <span className="text-brand font-black text-sm">Bet ${betAmount} &rarr; Win ${payout} (+{returnPct}%)</span>
                    </div>
                  </div>
                );
              })()}
              <div className="flex items-center gap-1.5 mt-2 text-[9px] text-slate-600">
                <Gem size={9} />
                <span>Connect Phantom to bet with SOL</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// AlphaSignalRow
// ---------------------------------------------------------------------------
function AlphaSignalRow({ signal, index, expanded, onToggle, degenMode }) {
  const Icon = signalTypeIcons[signal.type] || Zap;
  const severityClass = signalSeverityColors[signal.severity] || signalSeverityColors.low;
  const coinColor = ASSET_COLORS[signal.coin] || '#888';
  const t = signal.trade;
  const isLong = t?.direction === 'LONG';

  const glowBorder = signal.severity === 'high'
    ? 'border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
    : signal.severity === 'medium'
    ? 'border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
    : 'border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]';

  return (
    <motion.div
      className={`rounded-xl bg-surface-2/50 border ${glowBorder} hover:border-white/20 transition-all overflow-hidden`}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <button onClick={onToggle} className="flex items-start gap-3 p-4 w-full text-left">
        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${severityClass} border`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {t && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide ${isLong ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {t.direction}
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${coinColor}20`, color: coinColor }}>{signal.coin}</span>
            {t && <span className="text-xs font-bold text-brand">{t.expectedReturn}</span>}
          </div>
          <p className="text-sm text-white leading-snug font-medium">{signal.title}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500">{signal.impact}</span>
          </div>
          {/* Always-visible trade summary */}
          {t && (
            <div className="flex items-center gap-3 mt-2 text-[10px]">
              <span className="text-slate-500">Entry <span className="text-white font-mono font-bold">{t.entry}</span></span>
              <span className="text-slate-500">Target <span className="text-emerald-400 font-mono font-bold">{t.target}</span></span>
              <span className="text-slate-500">Stop <span className="text-red-400 font-mono font-bold">{t.stop}</span></span>
              <span className="text-slate-500">Lev <span className="text-yellow-400 font-mono font-bold">{t.leverage}</span></span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] text-slate-500 whitespace-nowrap">{timeAgo(new Date(signal.time).toISOString())}</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${signal.severity === 'high' ? 'bg-red-500/15 text-red-400' : signal.severity === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>
            {signal.severity.toUpperCase()}
          </span>
          {t && <ChevronDown size={12} className={`text-slate-600 transition-transform ${expanded ? 'rotate-180' : ''}`} />}
        </div>
      </button>

      {/* Expandable trade setup panel */}
      <AnimatePresence>
        {expanded && t && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`mx-3 mb-3 p-4 rounded-lg border ${isLong ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} className={isLong ? 'text-emerald-400' : 'text-red-400'} />
                <span className="text-sm font-bold text-white">Trade Setup</span>
                <span className={`text-[11px] px-2 py-0.5 rounded font-black ${isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {t.direction} {t.asset}
                </span>
                <span className="ml-auto text-xs text-slate-400">{t.timeframe}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-black/20 rounded-lg p-2.5 text-center">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Entry</span>
                  <span className="text-sm text-white font-mono font-bold">{t.entry}</span>
                </div>
                <div className="bg-black/20 rounded-lg p-2.5 text-center">
                  <span className="text-[9px] text-emerald-500 uppercase tracking-wider block mb-1">Target</span>
                  <span className="text-sm text-emerald-400 font-mono font-bold">{t.target}</span>
                </div>
                <div className="bg-black/20 rounded-lg p-2.5 text-center">
                  <span className="text-[9px] text-red-500 uppercase tracking-wider block mb-1">Stop Loss</span>
                  <span className="text-sm text-red-400 font-mono font-bold">{t.stop}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] bg-black/20 rounded-lg p-2.5">
                <div className="flex items-center gap-4">
                  <span className="text-slate-500">Leverage: <span className="text-yellow-400 font-bold">{t.leverage}</span></span>
                  <span className="text-slate-500">Expected: <span className="text-brand font-bold text-sm">{t.expectedReturn}</span></span>
                </div>
                {degenMode && (
                  <button className="px-3 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/30 hover:bg-orange-500/30 transition-colors">
                    COPY TRADE
                  </button>
                )}
              </div>
              {t.predictionLink && (
                <div className="mt-3 p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/15 flex items-center gap-2">
                  <Brain size={12} className="text-purple-400 shrink-0" />
                  <div className="text-[11px] text-slate-400 flex-1">
                    <span className="text-purple-400 font-medium">Prediction Market:</span> {t.predictionLink}
                  </div>
                  <span className="text-[11px] font-bold text-purple-400 whitespace-nowrap bg-purple-500/10 px-2 py-0.5 rounded">{t.predictionOdds}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Market Movers Row
// ---------------------------------------------------------------------------
function MoverRow({ asset, rank }) {
  const change = asset.change24h ?? 0;
  const isGain = change >= 0;
  const color = isGain ? 'text-emerald-400' : 'text-red-400';
  const accentColor = ASSET_COLORS[asset.symbol] || '#888';

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-600 w-4 text-right">{rank}</span>
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {asset.symbol?.slice(0, 2)}
        </div>
        <span className="text-xs font-medium text-white">{asset.symbol}</span>
        <span
          className="text-[8px] font-semibold px-1 py-0.5 rounded uppercase"
          style={{ backgroundColor: `${CLASS_COLORS[asset.assetClass] || '#888'}15`, color: CLASS_COLORS[asset.assetClass] || '#888' }}
        >
          {asset.assetClass}
        </span>
      </div>
      <span className={`text-xs font-bold ${color}`}>
        {isGain ? '+' : ''}{change.toFixed(2)}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MoverCard (prominent card with mini sparkline for top movers)
// ---------------------------------------------------------------------------
function MiniSparkline({ positive, color }) {
  // Generate a simple SVG sparkline path
  const points = useMemo(() => {
    const pts = [];
    let y = 20;
    for (let i = 0; i < 12; i++) {
      const delta = (Math.random() - (positive ? 0.35 : 0.65)) * 6;
      y = Math.max(4, Math.min(36, y + delta));
      pts.push({ x: i * 7, y });
    }
    return pts;
  }, [positive]);
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return (
    <svg width="77" height="40" viewBox="0 0 77 40" fill="none" className="opacity-60">
      <path d={pathD} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`${pathD} L 77 40 L 0 40 Z`} fill={`url(#sparkGrad-${positive ? 'up' : 'down'})`} opacity="0.15" />
      <defs>
        <linearGradient id={`sparkGrad-${positive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="40">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MoverCard({ asset, rank, type }) {
  const change = asset.change24h ?? 0;
  const isGain = type === 'gainer';
  const accentColor = ASSET_COLORS[asset.symbol] || CLASS_COLORS[asset.assetClass] || '#888';
  const changeColor = isGain ? '#10b981' : '#ef4444';

  return (
    <motion.div
      className={`rounded-xl p-3 border transition-all hover:scale-[1.02] ${
        isGain
          ? 'bg-emerald-500/[0.06] border-emerald-500/15 hover:border-emerald-500/30'
          : 'bg-red-500/[0.06] border-red-500/15 hover:border-red-500/30'
      }`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.06 }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ${isGain ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {rank}
          </span>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            {asset.symbol?.slice(0, 2)}
          </div>
          <div>
            <span className="text-sm font-bold text-white">{asset.symbol}</span>
            <span
              className="ml-1.5 text-[8px] font-semibold px-1 py-0.5 rounded uppercase"
              style={{ backgroundColor: `${CLASS_COLORS[asset.assetClass] || '#888'}15`, color: CLASS_COLORS[asset.assetClass] || '#888' }}
            >
              {asset.assetClass}
            </span>
          </div>
        </div>
        <MiniSparkline positive={isGain} color={changeColor} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">
          {asset.assetClass === 'forex' ? `$${asset.price.toFixed(4)}` : formatPrice(asset.price)}
        </span>
        <span className={`text-lg font-black ${isGain ? 'text-emerald-400' : 'text-red-400'}`}>
          {change > 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// CorrelationBadge
// ---------------------------------------------------------------------------
function CorrelationBadge({ data }) {
  const dirColor = data.direction === 'rising' ? 'text-emerald-400' : data.direction === 'diverging' ? 'text-red-400' : 'text-slate-400';
  const dirIcon = data.direction === 'rising' ? ArrowUpRight : data.direction === 'diverging' ? ArrowDownRight : Minus;
  const DirIcon = dirIcon;
  // Correlation bar width (scale -1 to 1 mapped to 0-100%)
  const barWidth = Math.abs(data.correlation) * 100;
  const barColor = data.correlation > 0.5 ? '#10b981' : data.correlation > 0 ? '#f59e0b' : '#ef4444';

  return (
    <motion.div
      className="rounded-xl border border-white/5 bg-surface-2/40 p-3 hover:border-white/10 transition-all"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `${data.colorA}30`, boxShadow: `0 0 6px ${data.colorA}30` }} />
            <span className="text-[10px] text-slate-600 mx-0.5">/</span>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `${data.colorB}30`, boxShadow: `0 0 6px ${data.colorB}30` }} />
          </div>
          <span className="text-xs font-bold text-white">{data.pair}</span>
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-bold ${dirColor}`}>
          <DirIcon size={10} />
          {data.direction}
          <span className="text-slate-500 ml-0.5">({data.change})</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, backgroundColor: barColor }} />
        </div>
        <span className="text-sm font-black text-white">{data.correlation.toFixed(2)}</span>
      </div>
      <p className="text-[10px] text-slate-500 leading-snug">{data.insight}</p>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function MarketPage() {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [view, setView] = useState('heatmap');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [predFilter, setPredFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [expandedSignal, setExpandedSignal] = useState(null);
  const [priceFlashes, setPriceFlashes] = useState({});
  const [tickTimestamp, setTickTimestamp] = useState(Date.now());
  const [selectedBetAmounts, setSelectedBetAmounts] = useState({});
  const [leverageCalcAmount, setLeverageCalcAmount] = useState('1000');
  const [leverageCalcMultiplier, setLeverageCalcMultiplier] = useState('10');
  const degenMode = useStore(s => s.degenMode);
  const { regime, predictions: aiPredictions, getPrediction, portfolioHeat } = useGoatedAI();
  const intervalRef = useRef(null);
  const tickRef = useRef(null);

  // -- Fetch crypto data (server API with CoinGecko fallback) --
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/market-data');
      const ct = res.headers.get('content-type') || '';
      if (!res.ok || !ct.includes('json')) throw new Error('Not available');
      const data = await res.json();
      setMarketData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      try {
        const [coinsRes, globalRes] = await Promise.allSettled([
          fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d'),
          fetch('https://api.coingecko.com/api/v3/global'),
        ]);
        const coins = coinsRes.status === 'fulfilled' && coinsRes.value.ok ? await coinsRes.value.json() : [];
        const globalData = globalRes.status === 'fulfilled' && globalRes.value.ok ? await globalRes.value.json() : null;

        if (Array.isArray(coins) && coins.length > 0) {
          const prices = coins.map(c => ({
            id: c.id, name: c.name, symbol: c.symbol?.toUpperCase(), image: c.image,
            price: c.current_price, change1h: c.price_change_percentage_1h_in_currency || 0,
            change24h: c.price_change_percentage_24h || 0,
            change7d: c.price_change_percentage_7d_in_currency || 0,
            volume24h: c.total_volume, marketCap: c.market_cap, rank: c.market_cap_rank,
            assetClass: 'crypto',
          }));
          const gd = globalData?.data || {};
          const totalMC = gd.total_market_cap?.usd || prices.reduce((s, c) => s + (c.marketCap || 0), 0);
          const totalVol = gd.total_volume?.usd || prices.reduce((s, c) => s + (c.volume24h || 0), 0);
          const gainCount = prices.filter(c => c.change24h > 0).length;
          const loseCount = prices.filter(c => c.change24h < 0).length;
          const avgChange = prices.reduce((s, c) => s + c.change24h, 0) / prices.length;
          const sentimentLabel = avgChange > 2 ? 'Strongly Bullish' : avgChange > 0 ? 'Mildly Bullish' : avgChange > -2 ? 'Mildly Bearish' : 'Strongly Bearish';

          setMarketData({
            prices,
            marketOverview: { totalMarketCap: totalMC, total24hVolume: totalVol, totalCoinsTracked: prices.length, gainers: gainCount, losers: loseCount, marketSentiment: sentimentLabel },
            timestamp: new Date().toISOString(),
          });
          setLastUpdated(new Date());
          setError(null);
        } else {
          throw new Error('No coin data');
        }
      } catch {
        setError('Market data temporarily unavailable');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  // -- Real-time price tick simulation (micro-movements every 2s) --
  // Crypto: +/-0.1-0.5%, Stocks/Forex: +/-0.02-0.1%
  useEffect(() => {
    tickRef.current = setInterval(() => {
      const flashMap = {};
      setMarketData(prev => {
        if (!prev?.prices) return prev;
        const prices = (Array.isArray(prev.prices) ? prev.prices : Object.values(prev.prices)).map(c => {
          const isCrypto = (c.assetClass || 'crypto') === 'crypto';
          const range = isCrypto ? 0.005 : 0.001; // 0.5% vs 0.1%
          const minMove = isCrypto ? 0.001 : 0.0002;
          const jitter = ((Math.random() - 0.5) * 2 * range);
          const absJitter = Math.abs(jitter) < minMove ? (jitter >= 0 ? minMove : -minMove) : jitter;
          const newPrice = c.price * (1 + absJitter);
          const newChange = (c.change24h || 0) + absJitter * 100;
          flashMap[c.symbol] = absJitter > 0 ? 'green' : 'red';
          return { ...c, price: newPrice, change24h: newChange };
        });
        return { ...prev, prices };
      });
      setPriceFlashes(flashMap);
      setTickTimestamp(Date.now());
      // Clear flashes after 600ms
      setTimeout(() => setPriceFlashes({}), 600);
    }, 2000);
    return () => clearInterval(tickRef.current);
  }, []);

  // -- Build unified asset lists --
  const cryptoAssets = useMemo(() => {
    if (!marketData?.prices) return [];
    const arr = Array.isArray(marketData.prices) ? marketData.prices : Object.values(marketData.prices);
    return arr.map(c => ({ ...c, assetClass: c.assetClass || 'crypto' })).sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
  }, [marketData]);

  const allAssets = useMemo(() => {
    const crypto = cryptoAssets;
    return [...crypto, ...STOCKS_DATA, ...FOREX_DATA, ...COMMODITIES_DATA];
  }, [cryptoAssets]);

  const filteredAssets = useMemo(() => {
    let list = allAssets;
    if (activeTab !== 'all' && activeTab !== 'predictions') {
      list = list.filter(a => a.assetClass === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.symbol?.toLowerCase().includes(q) || a.name?.toLowerCase().includes(q));
    }
    return list;
  }, [allAssets, activeTab, searchQuery]);

  // Movers across all asset classes
  const allGainers = useMemo(() => [...allAssets].filter(a => a.change24h > 0).sort((a, b) => b.change24h - a.change24h), [allAssets]);
  const allLosers = useMemo(() => [...allAssets].filter(a => a.change24h < 0).sort((a, b) => a.change24h - b.change24h), [allAssets]);

  const overview = marketData?.marketOverview || {};
  const sentimentLabel = overview.marketSentiment || 'Loading...';
  const sentimentColor = sentimentLabel.includes('Bullish') ? 'text-emerald-400' : sentimentLabel.includes('Bearish') ? 'text-red-400' : 'text-yellow-400';

  const predCategories = ['All', ...new Set(PREDICTION_MARKETS.map(p => p.category))];
  const filteredPredictions = predFilter === 'All' ? PREDICTION_MARKETS : PREDICTION_MARKETS.filter(p => p.category === predFilter);

  // -- Stats for header cards --
  const totalTracked = allAssets.length;
  const totalGainers = allGainers.length;
  const totalLosers = allLosers.length;

  // ── Loading state ──
  if (loading && !marketData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw size={32} className="text-brand animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading market intelligence...</p>
          <p className="text-slate-600 text-xs mt-2">Crypto, Stocks, Forex, Commodities, Predictions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
            <Activity size={22} className="text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Market Intelligence</h1>
            <p className="text-sm text-slate-500">Multi-asset terminal -- Crypto, Stocks, Forex, Commodities, Predictions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live -- updated {timeAgo(lastUpdated.toISOString())}
            </div>
          )}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 border border-white/5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <Search size={12} />
          </button>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 border border-white/5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ═══════ MARKET OVERVIEW DASHBOARD ═══════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {/* Total Market Cap */}
        <motion.div className="rounded-xl border border-white/5 bg-surface-1/80 p-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-1.5 mb-1">
            <PieChart size={11} className="text-brand" />
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Total Market Cap</span>
          </div>
          <div className="text-lg font-black text-white">{overview.totalMarketCap ? formatLargeNumber(overview.totalMarketCap) : '--'}</div>
          <div className="text-[10px] text-slate-500">Crypto only</div>
        </motion.div>
        {/* 24h Volume */}
        <motion.div className="rounded-xl border border-white/5 bg-surface-1/80 p-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 size={11} className="text-blue-400" />
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">24h Volume</span>
          </div>
          <div className="text-lg font-black text-white">{overview.total24hVolume ? formatLargeNumber(overview.total24hVolume) : '--'}</div>
          <div className="text-[10px] text-slate-500">All exchanges</div>
        </motion.div>
        {/* BTC Dominance */}
        <motion.div className="rounded-xl border border-white/5 bg-surface-1/80 p-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Coins size={11} className="text-orange-400" />
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">BTC Dominance</span>
          </div>
          <div className="text-lg font-black text-white">{BTC_DOMINANCE}%</div>
          <div className="h-1 rounded-full bg-white/5 mt-1 overflow-hidden">
            <div className="h-full rounded-full bg-orange-400/60" style={{ width: `${BTC_DOMINANCE}%` }} />
          </div>
        </motion.div>
        {/* Fear & Greed */}
        <motion.div className="rounded-xl border border-white/5 bg-surface-1/80 p-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Activity size={11} className={FEAR_GREED_INDEX.value > 60 ? 'text-emerald-400' : FEAR_GREED_INDEX.value > 40 ? 'text-yellow-400' : 'text-red-400'} />
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Fear & Greed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-black ${FEAR_GREED_INDEX.value > 60 ? 'text-emerald-400' : FEAR_GREED_INDEX.value > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              {FEAR_GREED_INDEX.value}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              FEAR_GREED_INDEX.value > 75 ? 'bg-emerald-500/15 text-emerald-400' :
              FEAR_GREED_INDEX.value > 60 ? 'bg-emerald-500/10 text-emerald-400' :
              FEAR_GREED_INDEX.value > 40 ? 'bg-yellow-500/10 text-yellow-400' :
              'bg-red-500/10 text-red-400'
            }`}>
              {FEAR_GREED_INDEX.label}
            </span>
          </div>
        </motion.div>
        {/* Market Status */}
        <motion.div className="rounded-xl border border-white/5 bg-surface-1/80 p-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Signal size={11} className={sentimentColor} />
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Market Status</span>
          </div>
          <div className={`text-lg font-black ${sentimentColor}`}>
            {sentimentLabel.includes('Bullish') ? 'BULL' : sentimentLabel.includes('Bearish') ? 'BEAR' : 'NEUTRAL'}
          </div>
          <div className={`text-[10px] ${sentimentColor}`}>{sentimentLabel}</div>
        </motion.div>
        {/* Assets Tracked */}
        <motion.div className="rounded-xl border border-white/5 bg-surface-1/80 p-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Layers size={11} className="text-brand" />
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Assets Tracked</span>
          </div>
          <div className="text-lg font-black text-white">{totalTracked + PREDICTION_MARKETS.length}</div>
          <div className="text-[10px] text-slate-500">5 asset classes</div>
        </motion.div>
        {/* Gainers / Losers */}
        <motion.div className="rounded-xl border border-white/5 bg-surface-1/80 p-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={11} className="text-emerald-400" />
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Gainers / Losers</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg font-black text-emerald-400">{totalGainers}</span>
            <span className="text-sm text-slate-600">/</span>
            <span className="text-lg font-black text-red-400">{totalLosers}</span>
          </div>
          <div className="h-1 rounded-full bg-white/5 mt-1 overflow-hidden flex">
            <div className="h-full bg-emerald-400/60" style={{ width: `${totalTracked > 0 ? (totalGainers / totalTracked) * 100 : 50}%` }} />
            <div className="h-full bg-red-400/60 flex-1" />
          </div>
        </motion.div>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search any asset... BTC, AAPL, EUR/USD, Gold..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-surface-2 border border-white/5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand/30"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ AI REGIME BANNER ═══════ */}
      {(() => {
        const r = regime || { regime: 'Analyzing...', color: '#a855f7', description: 'GOATED AI is computing market regime from RSI, MACD, Bollinger & macro signals...', action: 'HOLD' };
        const ph = portfolioHeat || { heat: 0, label: 'Calculating...' };
        return (
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-white/[0.02]" style={{ borderColor: `${r.color}30` }}>
            <div className="flex items-center gap-2">
              <Brain size={16} style={{ color: r.color }} className={!regime ? 'animate-pulse' : ''} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: r.color }}>{r.regime}</span>
            </div>
            <span className="text-xs text-slate-400 flex-1 hidden sm:block">{r.description}</span>
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: `${r.color}15`, color: r.color }}>{r.action}</span>
            <div className="flex items-center gap-1.5 pl-3 border-l border-white/10">
              <Flame size={12} className={ph.heat > 60 ? 'text-red-400' : ph.heat > 35 ? 'text-amber-400' : 'text-blue-400'} />
              <span className={`text-xs font-bold ${ph.heat > 60 ? 'text-red-400' : ph.heat > 35 ? 'text-amber-400' : 'text-blue-400'}`}>{ph.heat}</span>
              <span className="text-[10px] text-slate-600">{ph.label}</span>
            </div>
            <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded-full font-semibold">GOATED AI</span>
          </div>
        );
      })()}

      {/* ═══════ TAB NAVIGATION ═══════ */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {MARKET_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand/15 text-brand border border-brand/30 shadow-lg shadow-brand/5'
                  : 'bg-surface-3 text-slate-500 border border-white/[0.03] hover:text-white hover:bg-surface-2'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {tab.key !== 'all' && tab.key !== 'predictions' && (
                <span className={`text-[10px] px-1.5 rounded-full ${isActive ? 'bg-brand/20' : 'bg-white/5'}`}>
                  {tab.key === 'crypto' ? cryptoAssets.length : tab.key === 'stocks' ? STOCKS_DATA.length : tab.key === 'forex' ? FOREX_DATA.length : COMMODITIES_DATA.length}
                </span>
              )}
              {tab.key === 'predictions' && (
                <span className={`text-[10px] px-1.5 rounded-full ${isActive ? 'bg-brand/20' : 'bg-white/5'}`}>
                  {PREDICTION_MARKETS.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══════ SPREAD COMPARISON: GOATED vs COMPETITORS ═══════ */}
      {(() => {
        const avgKalshiEdge = (SPREAD_COMPARISONS.reduce((s, c) => s + ((1 - c.goated / c.kalshi) * 100), 0) / SPREAD_COMPARISONS.length).toFixed(1);
        const avgPolyEdge = (SPREAD_COMPARISONS.reduce((s, c) => s + ((1 - c.goated / c.polymarket) * 100), 0) / SPREAD_COMPARISONS.length).toFixed(1);
        const avgEdge = ((parseFloat(avgKalshiEdge) + parseFloat(avgPolyEdge)) / 2).toFixed(1);
        return (
          <motion.div
            className="rounded-xl border border-brand/20 bg-gradient-to-r from-brand/5 via-surface-1/80 to-purple-500/5 overflow-hidden"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* GOATED Edge Banner */}
            <div className="px-4 py-2.5 bg-brand/10 border-b border-brand/20 flex items-center justify-center gap-3">
              <Zap size={14} className="text-brand" />
              <span className="text-sm font-black text-brand">GOATED spreads avg {avgEdge}% tighter than competitors</span>
              <span className="text-[10px] text-brand/70 hidden sm:inline">|  Save {avgKalshiEdge}% vs Kalshi  |  Save {avgPolyEdge}% vs Polymarket</span>
            </div>
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale size={16} className="text-brand" />
                  <h2 className="font-bold text-white text-sm">Prediction Market Spread Comparison</h2>
                </div>
                <span className="text-[10px] text-slate-500">Lower price = more upside</span>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SPREAD_COMPARISONS.map((s, i) => {
                const kalshiEdge = ((1 - s.goated / s.kalshi) * 100).toFixed(0);
                const polyEdge = ((1 - s.goated / s.polymarket) * 100).toFixed(0);
                const bestEdge = Math.max(parseFloat(kalshiEdge), parseFloat(polyEdge));
                return (
                  <motion.div
                    key={i}
                    className="bg-black/20 rounded-lg p-3 border border-white/5 hover:border-brand/20 transition-all"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-white leading-snug flex-1 mr-2">{s.event}</span>
                      <span className="text-[10px] font-black text-brand bg-brand/15 px-2 py-0.5 rounded-full">{bestEdge}% EDGE</span>
                    </div>
                    {/* Visual bar comparison */}
                    <div className="space-y-1.5 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-brand font-bold w-14">GOATED</span>
                        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${s.goated * 100}%` }} />
                        </div>
                        <span className="text-[11px] text-brand font-black w-10 text-right">${s.goated.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-500 w-14">Kalshi</span>
                        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-slate-600" style={{ width: `${s.kalshi * 100}%` }} />
                        </div>
                        <span className="text-[11px] text-slate-400 font-bold w-10 text-right">${s.kalshi.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-500 w-14">Poly</span>
                        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-slate-600" style={{ width: `${s.polymarket * 100}%` }} />
                        </div>
                        <span className="text-[11px] text-slate-400 font-bold w-10 text-right">${s.polymarket.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-600">Vol ${s.volume}</span>
                      <span className="text-emerald-400 font-bold">You save ${(s.kalshi - s.goated).toFixed(2)}-${(s.polymarket - s.goated).toFixed(2)}/share</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })()}

      {/* ═══════ LIVE PRICE TICKER ═══════ */}
      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-emerald-400">LIVE</span>
        </div>
        <span>Prices tick every 2s</span>
        <span className="text-slate-600">|</span>
        <span>Last tick: {new Date(tickTimestamp).toLocaleTimeString()}</span>
        <span className="text-slate-600">|</span>
        <span>{filteredAssets.length} assets tracked</span>
      </div>

      {/* ═══════ MARKET MOVERS — TOP GAINERS & LOSERS CARDS ═══════ */}
      <div className="rounded-xl border border-white/5 bg-surface-1/80 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-brand" />
            <h2 className="font-bold text-white text-sm">Market Movers</h2>
            <span className="text-[10px] text-slate-500">Top gainers & losers across all asset classes</span>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gainers */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <TrendingUp size={14} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">Top Gainers</span>
              </div>
              <div className="space-y-2">
                {allGainers.slice(0, 3).map((a, i) => (
                  <MoverCard key={`mg-${a.assetClass}-${a.symbol}`} asset={a} rank={i + 1} type="gainer" />
                ))}
              </div>
            </div>
            {/* Losers */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <TrendingDown size={14} className="text-red-400" />
                <span className="text-xs font-bold text-red-400">Top Losers</span>
              </div>
              <div className="space-y-2">
                {allLosers.slice(0, 3).map((a, i) => (
                  <MoverCard key={`ml-${a.assetClass}-${a.symbol}`} asset={a} rank={i + 1} type="loser" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ CONDITIONAL CONTENT BASED ON TAB ═══════ */}
      {activeTab !== 'predictions' ? (
        <>
          {/* ═══════ DEGEN PICKS — TOP OF ALL/CRYPTO TABS ═══════ */}
          {degenMode && (activeTab === 'all' || activeTab === 'crypto') && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="alpha-panel degen-fire-border rounded-2xl border-2 border-orange-500/50 bg-gradient-to-r from-orange-500/10 via-surface-1/90 to-red-500/8 overflow-hidden shadow-[0_0_40px_rgba(249,115,22,0.15)]"
            >
              <div className="p-4 border-b border-orange-500/25 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Flame size={20} className="text-orange-400 animate-pulse" />
                  <h2 className="text-base font-black text-orange-400 tracking-wide">DEGEN PICKS</h2>
                  <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full font-bold animate-pulse">FIRE ALPHA</span>
                </div>
                <span className="text-[10px] text-orange-400/60">Max conviction plays</span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {DEGEN_PICKS.map((pick, i) => {
                  const isLong = pick.direction === 'LONG';
                  const coinColor = ASSET_COLORS[pick.asset] || '#ff6b00';
                  return (
                    <motion.div
                      key={i}
                      className={`rounded-xl p-3 border ${isLong ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'} hover:border-orange-500/50 transition-all`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {pick.direction}
                          </span>
                          <span className="text-sm font-black" style={{ color: coinColor }}>{pick.asset}</span>
                        </div>
                        <span className="text-xs font-bold text-orange-400">{pick.leverage}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] mb-2">
                        <span className="text-slate-500">Entry <span className="text-white font-mono font-bold">{pick.entry}</span></span>
                        <span className="text-slate-500">Target <span className="text-emerald-400 font-mono font-bold">{pick.target}</span></span>
                      </div>
                      {/* Confidence bar */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px] text-slate-500">Confidence</span>
                          <span className="text-[9px] font-bold text-orange-400">{pick.confidence}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: pick.confidence >= 90 ? 'linear-gradient(90deg, #f97316, #ef4444)' : pick.confidence >= 80 ? 'linear-gradient(90deg, #f97316, #fbbf24)' : 'linear-gradient(90deg, #fbbf24, #f59e0b)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pick.confidence}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-brand">{pick.expectedReturn}</span>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1 leading-snug">{pick.reason}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ═══════ ALL MARKETS MIXED INSIGHTS FEED ═══════ */}
          {activeTab === 'all' && (
            <motion.div
              className="rounded-xl border border-white/5 bg-surface-1/80 overflow-hidden"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-brand" />
                  <h2 className="font-bold text-white text-sm">Cross-Market Insights</h2>
                  <span className="text-[10px] text-slate-500">Key data points across all asset classes</span>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* BTC Dominance insight */}
                <div className="rounded-lg bg-surface-2/40 border border-white/5 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded-full bg-orange-400/20 flex items-center justify-center">
                      <Coins size={10} className="text-orange-400" />
                    </div>
                    <span className="text-[10px] font-bold text-orange-400 uppercase">BTC Dominance</span>
                  </div>
                  <div className="text-lg font-black text-white">{BTC_DOMINANCE}%</div>
                  <p className="text-[10px] text-slate-500 mt-1">ETH at {ETH_DOMINANCE}%. Alt season unlikely until BTC dom falls below 48%.</p>
                </div>
                {/* Top alpha signal preview */}
                <div className="rounded-lg bg-surface-2/40 border border-white/5 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded-full bg-yellow-400/20 flex items-center justify-center">
                      <Zap size={10} className="text-yellow-400" />
                    </div>
                    <span className="text-[10px] font-bold text-yellow-400 uppercase">Top Alpha</span>
                  </div>
                  <div className="text-xs font-bold text-white leading-snug">{ALPHA_SIGNALS[0]?.title.slice(0, 50)}...</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-bold text-brand">{ALPHA_SIGNALS[0]?.trade?.expectedReturn}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ALPHA_SIGNALS[0]?.trade?.direction === 'LONG' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {ALPHA_SIGNALS[0]?.trade?.direction} {ALPHA_SIGNALS[0]?.coin}
                    </span>
                  </div>
                </div>
                {/* Hot prediction preview */}
                <div className="rounded-lg bg-surface-2/40 border border-white/5 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded-full bg-purple-400/20 flex items-center justify-center">
                      <Brain size={10} className="text-purple-400" />
                    </div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase">Hot Prediction</span>
                  </div>
                  <div className="text-xs font-bold text-white leading-snug">{PREDICTION_MARKETS.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0]?.question.slice(0, 55)}...</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-bold text-purple-400">{Math.round(PREDICTION_MARKETS.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0]?.yesPrice * 100)}% YES</span>
                    <span className="text-[9px] text-emerald-400 font-bold">{PREDICTION_MARKETS.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0]?.alpha}</span>
                  </div>
                </div>
                {/* Forex/Commodities snapshot */}
                <div className="rounded-lg bg-surface-2/40 border border-white/5 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center">
                      <Globe size={10} className="text-amber-400" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase">Macro Pulse</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Gold</span>
                      <span className="text-white font-bold">${COMMODITIES_DATA[0]?.price.toLocaleString()}</span>
                      <span className={COMMODITIES_DATA[0]?.change24h >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {COMMODITIES_DATA[0]?.change24h >= 0 ? '+' : ''}{COMMODITIES_DATA[0]?.change24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Oil</span>
                      <span className="text-white font-bold">${COMMODITIES_DATA[2]?.price.toFixed(2)}</span>
                      <span className={COMMODITIES_DATA[2]?.change24h >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {COMMODITIES_DATA[2]?.change24h >= 0 ? '+' : ''}{COMMODITIES_DATA[2]?.change24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">EUR/USD</span>
                      <span className="text-white font-bold">{FOREX_DATA[0]?.price.toFixed(4)}</span>
                      <span className={FOREX_DATA[0]?.change24h >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {FOREX_DATA[0]?.change24h >= 0 ? '+' : ''}{FOREX_DATA[0]?.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════ HEATMAP / LIST ═══════ */}
          <div className="rounded-xl border border-white/5 bg-surface-1/80 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-brand" />
                <h2 className="font-bold text-white">
                  {activeTab === 'all' ? 'All Markets' : activeTab === 'crypto' ? 'Crypto Markets' : activeTab === 'stocks' ? 'Stock Markets' : activeTab === 'forex' ? 'Forex Markets' : 'Commodities'} Heatmap
                </h2>
                <span className="text-xs text-slate-500">{filteredAssets.length} assets</span>
              </div>
              <div className="flex items-center gap-1 bg-surface-3 rounded-lg p-0.5">
                <button
                  onClick={() => setView('heatmap')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${view === 'heatmap' ? 'bg-brand/15 text-brand' : 'text-slate-500 hover:text-white'}`}
                >
                  <LayoutGrid size={12} />Grid
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${view === 'list' ? 'bg-brand/15 text-brand' : 'text-slate-500 hover:text-white'}`}
                >
                  <List size={12} />List
                </button>
              </div>
            </div>

            {view === 'heatmap' ? (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {filteredAssets.map(asset => (
                  <HeatmapCell
                    key={`${asset.assetClass}-${asset.symbol}`}
                    asset={asset}
                    flash={priceFlashes[asset.symbol]}
                    onClick={() => setSelectedAsset(selectedAsset?.symbol === asset.symbol && selectedAsset?.assetClass === asset.assetClass ? null : asset)}
                  />
                ))}
                {filteredAssets.length === 0 && (
                  <div className="col-span-full text-center py-12 text-slate-500 text-sm">No assets match your search</div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-slate-500 font-medium">
                  <div className="col-span-3">Asset</div>
                  <div className="col-span-1 text-center">Class</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">24h Change</div>
                  <div className="col-span-2 text-right">Market Cap</div>
                  <div className="col-span-2 text-right">Volume</div>
                </div>
                {filteredAssets.map((asset, i) => {
                  const change = asset.change24h ?? 0;
                  const changeColor = change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-slate-400';
                  const ChangeIcon = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus;
                  const accentColor = ASSET_COLORS[asset.symbol] || '#888';
                  return (
                    <motion.div
                      key={`${asset.assetClass}-${asset.symbol}`}
                      className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors cursor-pointer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setSelectedAsset(selectedAsset?.symbol === asset.symbol && selectedAsset?.assetClass === asset.assetClass ? null : asset)}
                    >
                      <div className="col-span-3 flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                        >
                          {asset.symbol?.slice(0, 2)}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white">{asset.symbol}</span>
                          <p className="text-[10px] text-slate-500 leading-none truncate max-w-[120px]">{asset.name}</p>
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <span
                          className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full uppercase"
                          style={{ backgroundColor: `${CLASS_COLORS[asset.assetClass] || '#888'}15`, color: CLASS_COLORS[asset.assetClass] || '#888' }}
                        >
                          {asset.assetClass}
                        </span>
                      </div>
                      <div className="col-span-2 text-right text-sm font-medium text-white">
                        {asset.assetClass === 'forex' ? `$${asset.price.toFixed(4)}` : formatPrice(asset.price)}
                      </div>
                      <div className={`col-span-2 text-right text-sm font-medium flex items-center justify-end gap-1 ${changeColor}`}>
                        <ChangeIcon size={14} />
                        {change > 0 ? '+' : ''}{change.toFixed(2)}%
                      </div>
                      <div className="col-span-2 text-right text-sm text-slate-400">
                        {asset.marketCap ? formatLargeNumber(asset.marketCap) : '--'}
                      </div>
                      <div className="col-span-2 text-right text-sm text-slate-400">
                        {asset.volume24h ? formatLargeNumber(asset.volume24h) : '--'}
                      </div>
                    </motion.div>
                  );
                })}
                {filteredAssets.length === 0 && (
                  <div className="text-center py-12 text-slate-500 text-sm">No assets match your search</div>
                )}
              </div>
            )}
          </div>

          {/* ═══════ SELECTED ASSET DETAIL ═══════ */}
          <AnimatePresence>
            {selectedAsset && (
              <motion.div
                className="rounded-xl border border-white/5 bg-surface-1/80 p-5"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: `${ASSET_COLORS[selectedAsset.symbol] || '#888'}20`, color: ASSET_COLORS[selectedAsset.symbol] || '#888' }}
                    >
                      {selectedAsset.symbol?.slice(0, 3)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{selectedAsset.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-500">{selectedAsset.symbol}</p>
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase"
                          style={{ backgroundColor: `${CLASS_COLORS[selectedAsset.assetClass] || '#888'}15`, color: CLASS_COLORS[selectedAsset.assetClass] || '#888' }}
                        >
                          {selectedAsset.assetClass}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedAsset(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-surface-2/50 rounded-lg p-3">
                    <span className="text-xs text-slate-500">Price</span>
                    <p className="text-lg font-bold text-white">
                      {selectedAsset.assetClass === 'forex' ? `$${selectedAsset.price.toFixed(4)}` : formatPrice(selectedAsset.price)}
                    </p>
                  </div>
                  <div className="bg-surface-2/50 rounded-lg p-3">
                    <span className="text-xs text-slate-500">24h Change</span>
                    <p className={`text-lg font-bold ${(selectedAsset.change24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(selectedAsset.change24h ?? 0) >= 0 ? '+' : ''}{(selectedAsset.change24h ?? 0).toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-surface-2/50 rounded-lg p-3">
                    <span className="text-xs text-slate-500">Market Cap</span>
                    <p className="text-lg font-bold text-white">{selectedAsset.marketCap ? formatLargeNumber(selectedAsset.marketCap) : 'N/A'}</p>
                  </div>
                  <div className="bg-surface-2/50 rounded-lg p-3">
                    <span className="text-xs text-slate-500">24h Volume</span>
                    <p className="text-lg font-bold text-white">{selectedAsset.volume24h ? formatLargeNumber(selectedAsset.volume24h) : 'N/A'}</p>
                  </div>
                </div>
                {/* AI Prediction for selected asset */}
                {(() => {
                  const pred = getPrediction(selectedAsset.symbol);
                  if (!pred) return (
                    <div className="mt-3 p-3 rounded-lg border border-purple-500/15 bg-purple-500/5">
                      <div className="flex items-center gap-2">
                        <Brain size={14} className="text-purple-400 animate-pulse" />
                        <span className="text-xs font-bold text-purple-400">GOATED AI Prediction</span>
                        <span className="text-[10px] text-slate-500 ml-auto">Computing signals for {selectedAsset.symbol}...</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-center mt-2">
                        {['GOATED Score', '24h Target', '7d Target', 'Risk'].map(label => (
                          <div key={label}>
                            <div className="text-[9px] text-slate-500">{label}</div>
                            <div className="text-sm font-bold text-slate-600 animate-pulse">--</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                  return (
                    <div className="mt-3 p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain size={14} className="text-purple-400" />
                        <span className="text-xs font-bold text-purple-400">GOATED AI Prediction</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto" style={{ backgroundColor: `${pred.actionColor}15`, color: pred.actionColor }}>{pred.action}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <div className="text-[9px] text-slate-500">GOATED Score</div>
                          <div className="text-sm font-bold text-brand">{pred.goatedScore}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-500">24h Target</div>
                          <div className={`text-sm font-bold ${pred.change24hPredicted >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{pred.change24hPredicted >= 0 ? '+' : ''}{pred.change24hPredicted}%</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-500">7d Target</div>
                          <div className={`text-sm font-bold ${pred.change7dPredicted >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{pred.change7dPredicted >= 0 ? '+' : ''}{pred.change7dPredicted}%</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-500">Risk</div>
                          <div className="text-sm font-bold" style={{ color: pred.riskScore > 60 ? '#ef4444' : pred.riskScore > 35 ? '#f59e0b' : '#10b981' }}>{pred.riskLabel}</div>
                        </div>
                      </div>
                      {pred.breakout?.probability > 30 && (
                        <div className="mt-2 text-[10px] text-purple-300 flex items-center gap-1">
                          <Zap size={10} />Breakout {pred.breakout.direction} — {pred.breakout.probability}% probability ({pred.breakout.timeframe})
                          {pred.breakout.signals?.slice(0, 2).map((s, i) => <span key={i} className="ml-1 text-slate-500">· {s}</span>)}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        /* ═══════ PREDICTIONS TAB FULL VIEW ═══════ */
        <div className="rounded-xl border border-white/5 bg-surface-1/80 overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-purple-400" />
                <h2 className="font-bold text-white">Prediction Markets</h2>
                <span className="text-xs text-slate-500">{PREDICTION_MARKETS.length} events</span>
              </div>
              <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded-full bg-white/5">Polymarket / Kalshi</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {predCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setPredFilter(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    predFilter === cat
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                      : 'bg-surface-3 text-slate-500 border border-white/[0.03] hover:text-white'
                  }`}
                >
                  {cat}
                  <span className="ml-1 text-[10px] opacity-60">
                    ({cat === 'All' ? PREDICTION_MARKETS.length : PREDICTION_MARKETS.filter(p => p.category === cat).length})
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[700px] overflow-y-auto scrollbar-hide">
            {filteredPredictions.map(market => (
              <PredictionCard key={market.id} market={market} />
            ))}
          </div>
        </div>
      )}

      {/* ═══════ CROSS-ASSET CORRELATIONS ═══════ */}
      <motion.div
        className="rounded-xl border border-white/5 bg-surface-1/80 overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-blue-400" />
            <h2 className="font-bold text-white text-sm">Cross-Asset Correlations</h2>
            <span className="text-[10px] text-slate-500">Real-time correlation matrix insights</span>
          </div>
          <span className="text-[9px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">30-day rolling</span>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {CROSS_CORRELATIONS.map((corr, i) => (
            <CorrelationBadge key={corr.pair} data={corr} />
          ))}
        </div>
      </motion.div>

      {/* ═══════ THREE-COLUMN: MOVERS + PREDICTIONS PREVIEW + ALPHA ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── MARKET MOVERS (across ALL asset classes) ── */}
        <div className="rounded-xl border border-white/5 bg-surface-1/80 overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-brand" />
              <h2 className="font-bold text-white text-sm">Market Movers</h2>
              <span className="text-[10px] text-slate-500">All assets</span>
            </div>
          </div>
          <div className="p-4">
            {/* Top Gainers */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={12} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">Top Gainers</span>
              </div>
              <div className="space-y-0.5">
                {allGainers.slice(0, 8).map((a, i) => (
                  <MoverRow key={`g-${a.assetClass}-${a.symbol}`} asset={a} rank={i + 1} />
                ))}
              </div>
            </div>
            {/* Top Losers */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown size={12} className="text-red-400" />
                <span className="text-xs font-bold text-red-400">Top Losers</span>
              </div>
              <div className="space-y-0.5">
                {allLosers.slice(0, 8).map((a, i) => (
                  <MoverRow key={`l-${a.assetClass}-${a.symbol}`} asset={a} rank={i + 1} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── PREDICTION MARKETS PREVIEW (when not on predictions tab) ── */}
        <div className="rounded-xl border border-white/5 bg-surface-1/80 overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-purple-400" />
                <h2 className="font-bold text-white text-sm">Hot Predictions</h2>
              </div>
              <button
                onClick={() => setActiveTab('predictions')}
                className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                View all <ChevronRight size={10} />
              </button>
            </div>
          </div>
          <div className="p-3 space-y-2 max-h-[480px] overflow-y-auto scrollbar-hide">
            {PREDICTION_MARKETS.sort((a, b) => b.volume - a.volume).slice(0, 6).map(market => {
              const pct = Math.round(market.yesPrice * 100);
              const trendColor = market.trend === 'up' ? 'text-emerald-400' : market.trend === 'down' ? 'text-red-400' : 'text-slate-400';
              return (
                <div key={market.id} className="rounded-lg bg-surface-2/40 border border-white/5 p-3 hover:border-white/10 transition-all">
                  <p className="text-xs font-medium text-white leading-snug mb-2">{market.question}</p>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 60 ? '#10b981' : pct <= 30 ? '#ef4444' : '#f59e0b',
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-white">{pct}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400">{market.category}</span>
                      <span className="text-[9px] text-slate-600">{market.platform}</span>
                    </div>
                    {market.alpha && (
                      <span className="text-[9px] font-bold text-emerald-400">{market.alpha}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ALPHA SIGNALS (enhanced) ── */}
        <div className={`rounded-xl border bg-surface-1/80 overflow-hidden ${degenMode ? 'border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.08)]' : 'border-white/5'}`}>
          <div className={`flex items-center gap-2 p-4 border-b ${degenMode ? 'border-orange-500/20 bg-orange-500/5' : 'border-white/5'}`}>
            <Zap size={16} className={degenMode ? 'text-orange-400' : 'text-yellow-400'} />
            <h2 className="font-bold text-white text-sm">Alpha Signals</h2>
            <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded-full bg-white/5">Real-time</span>
            <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{ALPHA_SIGNALS.length} active</span>
          </div>
          {/* Quick signal summary strip */}
          <div className="px-3 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
            {ALPHA_SIGNALS.slice(0, 5).map(sig => {
              const isLong = sig.trade?.direction === 'LONG';
              return (
                <button
                  key={sig.id}
                  onClick={() => setExpandedSignal(expandedSignal === sig.id ? null : sig.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    expandedSignal === sig.id
                      ? 'bg-brand/15 border-brand/30 text-brand'
                      : isLong
                        ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15'
                        : 'bg-red-500/8 border-red-500/20 text-red-400 hover:bg-red-500/15'
                  }`}
                >
                  <span className={`${isLong ? 'text-emerald-400' : 'text-red-400'}`}>{sig.trade?.direction}</span>
                  <span className="text-white">{sig.coin}</span>
                  <span className="text-brand">{sig.trade?.expectedReturn}</span>
                </button>
              );
            })}
          </div>
          <div className="p-3 space-y-2 max-h-[480px] overflow-y-auto scrollbar-hide">
            {ALPHA_SIGNALS.map((signal, i) => (
              <AlphaSignalRow key={signal.id} signal={signal} index={i} expanded={expandedSignal === signal.id} onToggle={() => setExpandedSignal(expandedSignal === signal.id ? null : signal.id)} degenMode={degenMode} />
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ DEGEN MODE: FULL SUITE ═══════ */}
      {degenMode && (
        <>
          {/* ── DEGEN PICKS: Highest Alpha Plays ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-orange-500/40 bg-gradient-to-br from-orange-500/10 via-surface-1/80 to-red-500/5 overflow-hidden shadow-[0_0_30px_rgba(249,115,22,0.1)]"
          >
            <div className="p-5 border-b border-orange-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-lg">
                    <Flame size={22} className="text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-orange-400 flex items-center gap-2">
                      DEGEN PICKS
                      <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-semibold animate-pulse">HIGH ALPHA</span>
                    </h2>
                    <p className="text-xs text-slate-500">Maximum conviction plays. Highest expected returns. Not for the faint of heart.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // YOLO mode - select all picks
                    alert('YOLO MODE ACTIVATED! All max-confidence plays selected. Connect Phantom to execute.');
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-sm hover:from-orange-400 hover:to-red-400 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                >
                  YOLO ALL
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {DEGEN_PICKS.map((pick, i) => {
                const isLong = pick.direction === 'LONG';
                const coinColor = ASSET_COLORS[pick.asset] || '#ff6b00';
                return (
                  <motion.div
                    key={i}
                    className={`rounded-xl p-4 border-2 ${isLong ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'} hover:border-orange-500/40 transition-all`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-sm font-black ${isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {pick.direction}
                        </span>
                        <span className="text-lg font-black text-white" style={{ color: coinColor }}>{pick.asset}</span>
                        <span className="text-sm font-bold text-orange-400">{pick.leverage}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Expected Return</div>
                          <div className="text-lg font-black text-brand">{pick.expectedReturn}</div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-lg font-black text-orange-400">{pick.confidence}</div>
                            <div className="text-[8px] text-slate-500 -mt-0.5">CONF</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] mb-2">
                      <span className="text-slate-500">Entry <span className="text-white font-mono font-bold">{pick.entry}</span></span>
                      <span className="text-slate-500">Target <span className="text-emerald-400 font-mono font-bold">{pick.target}</span></span>
                    </div>
                    <div className="text-[11px] text-slate-400">{pick.reason}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ── LEVERAGE CALCULATOR ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border-2 border-orange-500/20 bg-gradient-to-r from-orange-500/5 via-surface-1/80 to-yellow-500/5 overflow-hidden"
          >
            <div className="p-5 border-b border-orange-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Percent size={22} className="text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-orange-400">Leverage Calculator</h2>
                  <p className="text-xs text-slate-500">Calculate your position size, liquidation price, and potential P&L</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Capital (USD)</label>
                  <input
                    type="number"
                    value={leverageCalcAmount}
                    onChange={e => setLeverageCalcAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-orange-500/20 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/40"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Leverage</label>
                  <div className="flex gap-1">
                    {['3', '5', '10', '20', '50', '100'].map(lev => (
                      <button
                        key={lev}
                        onClick={() => setLeverageCalcMultiplier(lev)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          leverageCalcMultiplier === lev
                            ? 'bg-orange-500 text-black'
                            : 'bg-black/30 text-slate-400 border border-orange-500/10 hover:border-orange-500/30'
                        }`}
                      >
                        {lev}x
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Position Size</label>
                  <div className="px-3 py-2 rounded-lg bg-black/30 border border-white/5 text-lg font-black text-orange-400">
                    ${(parseFloat(leverageCalcAmount || 0) * parseFloat(leverageCalcMultiplier || 1)).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Liquidation at</label>
                  <div className="px-3 py-2 rounded-lg bg-black/30 border border-red-500/20 text-lg font-bold text-red-400">
                    -{(100 / parseFloat(leverageCalcMultiplier || 1)).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '+5% move', pnl: (parseFloat(leverageCalcAmount || 0) * parseFloat(leverageCalcMultiplier || 1) * 0.05), color: 'text-emerald-400' },
                  { label: '+10% move', pnl: (parseFloat(leverageCalcAmount || 0) * parseFloat(leverageCalcMultiplier || 1) * 0.10), color: 'text-emerald-400' },
                  { label: '-5% move', pnl: -(parseFloat(leverageCalcAmount || 0) * parseFloat(leverageCalcMultiplier || 1) * 0.05), color: 'text-red-400' },
                ].map((scenario, i) => (
                  <div key={i} className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
                    <div className="text-[10px] text-slate-500 mb-1">{scenario.label}</div>
                    <div className={`text-sm font-black ${scenario.color}`}>
                      {scenario.pnl >= 0 ? '+' : ''}${Math.abs(scenario.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── DEGEN CASINO GAMES ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/5 via-surface-1/80 to-red-500/5 overflow-hidden"
          >
            <div className="p-5 border-b border-orange-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-lg">
                  <Sparkles size={22} className="text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-orange-400 flex items-center gap-2">
                    DEGEN CASINO
                    <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-semibold animate-pulse">LIVE</span>
                  </h2>
                  <p className="text-xs text-slate-500">Crypto-native gambling. Solana bets. Instant settlement.</p>
                </div>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { name: 'BTC 1min Candle', desc: 'Will the next 1-min candle be green?', odds: '1.95x', icon: '📊', color: '#f7931a' },
                { name: 'SOL Coin Flip', desc: 'Deposit SOL, 50/50 double or nothing', odds: '2.00x', icon: '🪙', color: '#00ffa3' },
                { name: 'Degen Roulette', desc: 'Spin with SPL tokens. 36x max payout', odds: '36x', icon: '🎯', color: '#ff4444' },
                { name: 'Whale or Shrimp', desc: 'Guess if next on-chain tx is >$100K', odds: '2.40x', icon: '🐋', color: '#00bcd4' },
                { name: 'Prediction PvP', desc: 'Bet against other degens on market moves', odds: 'Dynamic', icon: '⚔️', color: '#a855f7' },
                { name: 'Leverage Roulette', desc: '100x a random coin. Survive 5 mins = win', odds: '5.00x', icon: '🔥', color: '#ff6b00' },
                { name: 'Meme Coin Derby', desc: 'Pick which meme coin pumps most in 1hr', odds: '3-10x', icon: '🐎', color: '#fbbf24' },
                { name: 'Liquidation Lottery', desc: 'Pool entry. Win when next big liquidation hits', odds: '50x', icon: '💀', color: '#ef4444' },
              ].map(game => (
                <div key={game.name} className="bg-black/30 border border-orange-500/10 rounded-xl p-4 hover:border-orange-500/30 hover:bg-black/40 transition-all cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{game.icon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">{game.name}</h3>
                      <p className="text-[10px] text-slate-500">{game.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">{game.odds} payout</span>
                    <span className="text-[10px] text-slate-600 group-hover:text-orange-400 transition-colors flex items-center gap-1">
                      Play <ChevronRight size={10} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-4 flex items-center gap-2 text-[10px] text-orange-500/60">
              <AlertTriangle size={10} />
              <span>Crypto gambling involves risk. Play responsibly. Must connect Phantom wallet. SOL network fees apply.</span>
            </div>
          </motion.div>
        </>
      )}

      {/* ═══════ FOOTER NOTE ═══════ */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <ShieldCheck size={12} className="text-slate-600" />
        <p className="text-[10px] text-slate-600">
          Crypto via CoinGecko. Stocks, forex, commodities are indicative. Prediction data from Polymarket &amp; Kalshi. Not financial advice. Refreshes every 15s.
        </p>
      </div>
    </div>
  );
}
