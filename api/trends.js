// =============================================================================
// GOATED Solutions - Real-Time Intelligence Aggregation API
// =============================================================================
// Endpoint: GET /api/trends
// Aggregates LIVE data from: CoinGecko, CryptoCompare, Hacker News, Reddit
// No API keys required for core functionality.
// =============================================================================

import { callClaude } from './lib/anthropic.js';

const ALLOWED_ORIGINS = [process.env.CORS_ORIGIN || 'https://goated.solutions', 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'];
function getCorsOrigin(req) {
  const origin = req.headers?.origin || '';
  if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) return origin;
  return ALLOWED_ORIGINS[0];
}
const getCorsHeaders = (req) => ({
  'Access-Control-Allow-Origin': getCorsOrigin(req),
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
});

// In-memory cache with TTL
const cache = { data: null, ts: 0, ttl: 45_000 }; // 45s cache

// ---------------------------------------------------------------------------
// Live data fetchers
// ---------------------------------------------------------------------------

async function fetchCoinGeckoMarkets() {
  try {
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h,24h,7d';
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('CoinGecko markets failed:', e.message);
    return null;
  }
}

async function fetchCoinGeckoTrending() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/search/trending', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`CG trending ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('CoinGecko trending failed:', e.message);
    return null;
  }
}

async function fetchCoinGeckoGlobal() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/global', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`CG global ${res.status}`);
    const d = await res.json();
    return d.data;
  } catch (e) {
    console.warn('CoinGecko global failed:', e.message);
    return null;
  }
}

async function fetchCryptoCompareNews() {
  try {
    const res = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=popular', { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`CC news ${res.status}`);
    const d = await res.json();
    return d.Data?.slice(0, 25) || [];
  } catch (e) {
    console.warn('CryptoCompare news failed:', e.message);
    return [];
  }
}

async function fetchHackerNewsTop() {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HN ${res.status}`);
    const ids = await res.json();
    const top15 = ids.slice(0, 15);
    const stories = await Promise.allSettled(
      top15.map(id => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(3000) }).then(r => r.json()))
    );
    return stories.filter(s => s.status === 'fulfilled').map(s => s.value).filter(Boolean);
  } catch (e) {
    console.warn('HN failed:', e.message);
    return [];
  }
}

async function fetchFearGreedIndex() {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=7', { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`FnG ${res.status}`);
    const d = await res.json();
    return d.data || [];
  } catch (e) {
    console.warn('Fear & Greed failed:', e.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Sentiment analysis (basic NLP on text)
// ---------------------------------------------------------------------------
const BULLISH_WORDS = ['surge','rally','bull','pump','moon','breakout','soar','gain','high','record','ath','up','rise','grow','boom','buy','accumulate','institutional','adopt','bullish','upgrade','outperform','strong','positive'];
const BEARISH_WORDS = ['crash','dump','bear','plunge','drop','fall','low','sell','fear','risk','hack','exploit','scam','fraud','sec','lawsuit','ban','restrict','bearish','downgrade','weak','negative','decline','loss'];

function analyzeSentiment(text) {
  if (!text) return { score: 0.5, label: 'neutral' };
  const lower = text.toLowerCase();
  let bull = 0, bear = 0;
  BULLISH_WORDS.forEach(w => { if (lower.includes(w)) bull++; });
  BEARISH_WORDS.forEach(w => { if (lower.includes(w)) bear++; });
  const total = bull + bear || 1;
  const score = 0.5 + (bull - bear) / (total * 2);
  const clamped = Math.max(0, Math.min(1, score));
  return {
    score: Math.round(clamped * 100) / 100,
    label: clamped > 0.6 ? 'bullish' : clamped < 0.4 ? 'bearish' : 'neutral',
    bullSignals: bull,
    bearSignals: bear,
  };
}

// ---------------------------------------------------------------------------
// Data processing & enrichment
// ---------------------------------------------------------------------------

function processMarkets(coins) {
  if (!coins || !coins.length) return [];
  return coins.map((c, i) => ({
    rank: i + 1,
    id: c.id,
    symbol: (c.symbol || '').toUpperCase(),
    name: c.name,
    image: c.image,
    price: c.current_price,
    priceFormatted: formatUSD(c.current_price),
    change1h: round2(c.price_change_percentage_1h_in_currency),
    change24h: round2(c.price_change_percentage_24h),
    change7d: round2(c.price_change_percentage_7d_in_currency),
    marketCap: c.market_cap,
    marketCapFormatted: formatLarge(c.market_cap),
    volume24h: c.total_volume,
    volumeFormatted: formatLarge(c.total_volume),
    sparkline7d: c.sparkline_in_7d?.price || [],
    ath: c.ath,
    athChangePercent: round2(c.ath_change_percentage),
    high24h: c.high_24h,
    low24h: c.low_24h,
    circulatingSupply: c.circulating_supply,
    totalSupply: c.total_supply,
    // GOATED alpha signals
    alphaSignal: getAlphaSignal(c),
    volatility: calcVolatility(c.sparkline_in_7d?.price),
    momentumScore: calcMomentum(c),
  }));
}

function getAlphaSignal(coin) {
  const c24 = coin.price_change_percentage_24h || 0;
  const c7d = coin.price_change_percentage_7d_in_currency || 0;
  const volRatio = coin.total_volume / (coin.market_cap || 1);

  if (c24 > 10 && volRatio > 0.15) return { type: 'BREAKOUT', strength: 'high', msg: 'Volume spike + major price move — breakout confirmed' };
  if (c24 < -10 && volRatio > 0.2) return { type: 'CAPITULATION', strength: 'high', msg: 'High volume sell-off — potential reversal incoming' };
  if (c24 > 5 && c7d > 15) return { type: 'MOMENTUM', strength: 'medium', msg: 'Strong uptrend across timeframes — riding the wave' };
  if (c24 > 3 && volRatio < 0.05) return { type: 'LOW_VOL_PUMP', strength: 'low', msg: 'Price up on low volume — be cautious, could fade' };
  if (c7d < -20 && c24 > 0) return { type: 'BOUNCE', strength: 'medium', msg: 'Potential dead cat bounce after heavy drawdown' };
  if (Math.abs(c24) < 1 && volRatio > 0.1) return { type: 'ACCUMULATION', strength: 'medium', msg: 'Quiet price + high volume = smart money loading' };
  return { type: 'NEUTRAL', strength: 'low', msg: 'No strong signal — wait for setup' };
}

function calcVolatility(prices) {
  if (!prices || prices.length < 10) return 0;
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / returns.length;
  return Math.round(Math.sqrt(variance) * 10000) / 100; // percentage
}

function calcMomentum(coin) {
  const w = { h1: 0.15, h24: 0.35, d7: 0.5 };
  const c1 = coin.price_change_percentage_1h_in_currency || 0;
  const c24 = coin.price_change_percentage_24h || 0;
  const c7d = coin.price_change_percentage_7d_in_currency || 0;
  const raw = (c1 * w.h1 + c24 * w.h24 + c7d * w.d7);
  return Math.round(Math.max(-100, Math.min(100, raw)) * 10) / 10;
}

function processNews(ccNews, hnStories) {
  const articles = [];

  // CryptoCompare news — real articles
  ccNews.forEach(n => {
    const sentiment = analyzeSentiment(n.title + ' ' + (n.body || ''));
    articles.push({
      id: `cc-${n.id}`,
      title: n.title,
      body: (n.body || '').slice(0, 200),
      source: n.source,
      sourceImg: n.source_info?.img,
      url: n.url,
      imageUrl: n.imageurl,
      publishedAt: new Date(n.published_on * 1000).toISOString(),
      categories: n.categories?.split('|').filter(Boolean) || [],
      tags: n.tags?.split('|').filter(Boolean).slice(0, 5) || [],
      sentiment,
      type: 'crypto',
    });
  });

  // Hacker News — tech/startup signals
  hnStories.forEach(s => {
    if (!s || !s.title) return;
    const sentiment = analyzeSentiment(s.title);
    // Tag crypto/finance/AI relevance
    const lower = s.title.toLowerCase();
    const isCrypto = /bitcoin|crypto|eth|blockchain|defi|nft|web3|solana|token/i.test(lower);
    const isAI = /ai |gpt|llm|openai|anthropic|machine learn|neural|deep learn/i.test(lower);
    const isFinance = /stock|market|trade|invest|hedge|fund|revenue|ipo|startup/i.test(lower);
    const tags = [];
    if (isCrypto) tags.push('Crypto');
    if (isAI) tags.push('AI');
    if (isFinance) tags.push('Finance');
    if (!tags.length) tags.push('Tech');

    articles.push({
      id: `hn-${s.id}`,
      title: s.title,
      body: '',
      source: 'Hacker News',
      url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
      publishedAt: new Date(s.time * 1000).toISOString(),
      categories: tags,
      tags,
      sentiment,
      type: tags[0].toLowerCase(),
      hnScore: s.score,
      hnComments: s.descendants || 0,
    });
  });

  // Sort by recency
  articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  return articles;
}

function buildGlobalSentiment(global, fng, markets) {
  const fngCurrent = fng?.[0];
  const fngHistory = fng?.map(d => ({ value: parseInt(d.value), label: d.value_classification, ts: d.timestamp })) || [];

  // Compute average 24h change across top 20
  const top20 = markets?.slice(0, 20) || [];
  const avg24h = top20.reduce((s, c) => s + (c.change24h || 0), 0) / (top20.length || 1);

  // Market breadth — % of top 50 coins that are green
  const greenCount = (markets || []).filter(c => (c.change24h || 0) > 0).length;
  const breadth = Math.round((greenCount / Math.max(markets?.length || 1, 1)) * 100);

  return {
    fearGreed: {
      value: parseInt(fngCurrent?.value || 50),
      label: fngCurrent?.value_classification || 'Neutral',
      history: fngHistory,
    },
    marketBreadth: { green: greenCount, total: markets?.length || 0, percent: breadth },
    avgChange24h: round2(avg24h),
    totalMarketCap: global?.total_market_cap?.usd || 0,
    totalMarketCapFormatted: formatLarge(global?.total_market_cap?.usd || 0),
    totalVolume24h: global?.total_volume?.usd || 0,
    totalVolumeFormatted: formatLarge(global?.total_volume?.usd || 0),
    btcDominance: round2(global?.market_cap_percentage?.btc || 0),
    ethDominance: round2(global?.market_cap_percentage?.eth || 0),
    activeCryptos: global?.active_cryptocurrencies || 0,
    // GOATED composite sentiment (0-100)
    compositeScore: calcCompositeSentiment(fngCurrent, avg24h, breadth),
    degenIndex: calcDegenIndex(markets),
  };
}

function calcCompositeSentiment(fng, avg24h, breadth) {
  const fngVal = parseInt(fng?.value || 50);
  // Weighted: 40% fear/greed, 30% market breadth, 30% avg 24h change (normalized)
  const changeNorm = Math.max(0, Math.min(100, 50 + avg24h * 5));
  return Math.round(fngVal * 0.4 + breadth * 0.3 + changeNorm * 0.3);
}

function calcDegenIndex(markets) {
  // DEGEN INDEX: How "degen" is the market right now?
  // High when: small caps pumping, volume high, volatility high
  if (!markets || markets.length < 20) return 50;
  const smallCaps = markets.slice(20, 50);
  const avgSmallChange = smallCaps.reduce((s, c) => s + Math.abs(c.change24h || 0), 0) / (smallCaps.length || 1);
  const avgVolRatio = smallCaps.reduce((s, c) => s + (c.volume24h || 0) / (c.marketCap || 1), 0) / (smallCaps.length || 1);
  const raw = avgSmallChange * 3 + avgVolRatio * 200;
  return Math.round(Math.max(0, Math.min(100, raw)));
}

function buildTrendingCoins(trendingData) {
  if (!trendingData?.coins) return [];
  return trendingData.coins.slice(0, 10).map((t, i) => ({
    rank: i + 1,
    id: t.item?.id,
    name: t.item?.name,
    symbol: t.item?.symbol?.toUpperCase(),
    image: t.item?.small || t.item?.thumb,
    marketCapRank: t.item?.market_cap_rank,
    priceBtc: t.item?.price_btc,
    score: t.item?.score,
  }));
}

// Geo data for 3D globe — map coins to countries/regions of origin
const COIN_GEO = {
  bitcoin: { lat: 37.7749, lng: -122.4194, region: 'Global', city: 'San Francisco' },
  ethereum: { lat: 47.3769, lng: 8.5417, region: 'Europe', city: 'Zug' },
  solana: { lat: 37.7749, lng: -122.4194, region: 'North America', city: 'San Francisco' },
  cardano: { lat: 47.0707, lng: 15.4395, region: 'Europe', city: 'Graz' },
  polkadot: { lat: 47.3769, lng: 8.5417, region: 'Europe', city: 'Zug' },
  'avalanche-2': { lat: 37.5585, lng: -77.4601, region: 'North America', city: 'Cornell' },
  chainlink: { lat: 37.7749, lng: -122.4194, region: 'North America', city: 'San Francisco' },
  uniswap: { lat: 40.7128, lng: -74.0060, region: 'North America', city: 'New York' },
  dogecoin: { lat: 34.0522, lng: -118.2437, region: 'North America', city: 'Los Angeles' },
  binancecoin: { lat: 1.3521, lng: 103.8198, region: 'Asia', city: 'Singapore' },
  ripple: { lat: 37.7749, lng: -122.4194, region: 'North America', city: 'San Francisco' },
  'matic-network': { lat: 19.0760, lng: 72.8777, region: 'Asia', city: 'Mumbai' },
  tron: { lat: 37.7749, lng: -122.4194, region: 'North America', city: 'San Francisco' },
  'shiba-inu': { lat: 35.6762, lng: 139.6503, region: 'Asia', city: 'Tokyo' },
  litecoin: { lat: 37.7749, lng: -122.4194, region: 'North America', city: 'San Francisco' },
};

function buildGeoData(markets) {
  if (!markets) return [];
  return markets.slice(0, 30).map(c => {
    const geo = COIN_GEO[c.id] || { lat: (Math.random() - 0.5) * 120, lng: (Math.random() - 0.5) * 300, region: 'Unknown', city: 'Unknown' };
    return {
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      lat: geo.lat,
      lng: geo.lng,
      region: geo.region,
      city: geo.city,
      size: Math.max(2, Math.log10(c.marketCap || 1) - 6), // scale dot size by market cap
      color: (c.change24h || 0) >= 0 ? '#00ff88' : '#ff4444',
      change24h: c.change24h,
      volume: c.volumeFormatted,
      marketCap: c.marketCapFormatted,
    };
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function round2(n) { return Math.round((n || 0) * 100) / 100; }
function formatUSD(n) {
  if (n == null) return '$0';
  if (n >= 1) return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 0.01) return '$' + n.toFixed(4);
  return '$' + n.toFixed(8);
}
function formatLarge(n) {
  if (!n) return '$0';
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + n.toFixed(0);
}

// ---------------------------------------------------------------------------
// Claude AI Enrichment
// ---------------------------------------------------------------------------
async function enrichWithClaude(data, prompt) {
  const text = await callClaude(
    'You are GOATED\'s elite market intelligence AI. Respond ONLY with valid JSON, no markdown fences.',
    `${prompt}\n\nData:\n${JSON.stringify(data)}`,
    600
  );
  if (!text) return null;
  try {
    // Strip markdown code fences if present
    const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

async function generateMarketIntelligence(sentiment, topGainers, topLosers, news) {
  const summary = {
    fearGreed: sentiment?.fearGreed?.value,
    breadth: sentiment?.marketBreadth,
    avgChange: sentiment?.avgChange24h,
    btcDom: sentiment?.btcDominance,
    topGainers: topGainers?.slice(0, 3).map(c => ({ symbol: c.symbol, change24h: c.change24h })),
    topLosers: topLosers?.slice(0, 3).map(c => ({ symbol: c.symbol, change24h: c.change24h })),
    recentHeadlines: news?.slice(0, 5).map(n => n.title),
  };

  return enrichWithClaude(summary, `Analyze this crypto market snapshot and return JSON with:
{
  "sentiment": { "direction": "bullish|bearish|neutral", "confidence": 1-100, "reasoning": "1 sentence" },
  "marketSummary": "1 concise sentence summarizing current market state",
  "actionablePlays": [
    { "play": "description", "asset": "SYMBOL", "direction": "long|short|hold", "timeframe": "e.g. 4h-24h" }
  ]
}
Return exactly 3 actionable plays. Be specific and data-driven.`);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  const corsHeaders = getCorsHeaders(req);
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Return cache if fresh
    if (cache.data && Date.now() - cache.ts < cache.ttl) {
      return res.status(200).json({ ...cache.data, _meta: { ...cache.data._meta, fromCache: true } });
    }

    // Fetch all sources in parallel
    const [markets, trending, global, ccNews, hnStories, fng] = await Promise.allSettled([
      fetchCoinGeckoMarkets(),
      fetchCoinGeckoTrending(),
      fetchCoinGeckoGlobal(),
      fetchCryptoCompareNews(),
      fetchHackerNewsTop(),
      fetchFearGreedIndex(),
    ]);

    const marketsData = markets.status === 'fulfilled' ? markets.value : null;
    const trendingData = trending.status === 'fulfilled' ? trending.value : null;
    const globalData = global.status === 'fulfilled' ? global.value : null;
    const ccNewsData = ccNews.status === 'fulfilled' ? ccNews.value : [];
    const hnData = hnStories.status === 'fulfilled' ? hnStories.value : [];
    const fngData = fng.status === 'fulfilled' ? fng.value : [];

    // Process & enrich
    const processedMarkets = processMarkets(marketsData);
    const processedNews = processNews(ccNewsData, hnData);
    const sentiment = buildGlobalSentiment(globalData, fngData, processedMarkets);
    const trendingCoins = buildTrendingCoins(trendingData);
    const geoData = buildGeoData(processedMarkets);

    // Top movers
    const topGainers = [...processedMarkets].sort((a, b) => (b.change24h || 0) - (a.change24h || 0)).slice(0, 5);
    const topLosers = [...processedMarkets].sort((a, b) => (a.change24h || 0) - (b.change24h || 0)).slice(0, 5);

    // Alpha signals — coins with notable signals
    const alphaPlays = processedMarkets.filter(c => c.alphaSignal.strength !== 'low').slice(0, 10);

    const response = {
      markets: processedMarkets,
      trending: trendingCoins,
      news: processedNews,
      sentiment,
      geoData,
      topGainers,
      topLosers,
      alphaPlays,
      timestamp: new Date().toISOString(),
      _meta: {
        sources: {
          coinGecko: marketsData ? 'live' : 'unavailable',
          cryptoCompare: ccNewsData.length > 0 ? 'live' : 'unavailable',
          hackerNews: hnData.length > 0 ? 'live' : 'unavailable',
          fearGreed: fngData.length > 0 ? 'live' : 'unavailable',
        },
        coinsTracked: processedMarkets.length,
        newsArticles: processedNews.length,
        fromCache: false,
        fetchedAt: new Date().toISOString(),
        cacheTTL: '45s',
      },
    };

    // Cache the result
    cache.data = response;
    cache.ts = Date.now();

    return res.status(200).json(response);
  } catch (error) {
    console.error('Trends API error:', error);
    // Return cached data if available
    if (cache.data) {
      return res.status(200).json({ ...cache.data, _meta: { ...cache.data._meta, fromCache: true, error: 'Serving stale cache' } });
    }
    return res.status(500).json({ error: 'Failed to fetch trend data', message: error.message });
  }
}
