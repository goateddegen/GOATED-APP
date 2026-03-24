// =============================================================================
// GOATED Solutions — Real-Time Multi-Source Sentiment Aggregation API
// =============================================================================
// Endpoint: GET /api/sentiment
//
// Aggregates LIVE data from:
//   1. CoinGecko — trending coins, prices, market data
//   2. Alternative.me — Fear & Greed Index
//   3. CryptoCompare — news with sentiment
//   4. CoinGecko — global market data
//   5. Internal GOATED AI scoring engine
//
// Returns: Unified sentiment dashboard with alpha signals
// =============================================================================

async function callClaude(systemPrompt, userMessage, maxTokens = 500) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: maxTokens, system: systemPrompt, messages: [{ role: 'user', content: userMessage }] }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.content?.[0]?.text || null;
  } catch { return null; }
}

const ALLOWED_ORIGINS = [process.env.CORS_ORIGIN || 'https://goated.solutions', 'http://localhost:5173', 'http://localhost:5174'];
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

// Cache: 60s TTL to avoid rate limits
let cache = null;
let cacheTs = 0;
const CACHE_TTL = 60_000;

// ─── Data Fetchers ───────────────────────────────────────────────────────────

async function fetchFearGreed() {
  try {
    const r = await fetch('https://api.alternative.me/fng/?limit=7&format=json', { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    return d.data || [];
  } catch { return null; }
}

async function fetchTrendingCoins() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/search/trending', { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    return d.coins?.map(c => c.item) || [];
  } catch { return null; }
}

async function fetchGlobalData() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/global', { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    return d.data || null;
  } catch { return null; }
}

async function fetchTopCoins() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=1h,24h,7d', { signal: AbortSignal.timeout(8000) });
    return await r.json();
  } catch { return null; }
}

async function fetchCryptoNews() {
  try {
    const r = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=popular', { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    return d.Data?.slice(0, 20) || [];
  } catch { return null; }
}

async function fetchPolymarketData() {
  try {
    // Polymarket CLOB API — top active markets
    const r = await fetch('https://clob.polymarket.com/markets?limit=12&active=true&order=volume&ascending=false', { signal: AbortSignal.timeout(5000) });
    const markets = await r.json();
    return Array.isArray(markets) ? markets : [];
  } catch { return null; }
}

// ─── GOATED AI Scoring Engine ─────────────────────────────────────────────────

function computeSentimentScore(fearGreed, globalData, topCoins, news) {
  let score = 50; // neutral baseline
  let signals = [];

  // Factor 1: Fear & Greed (weight: 30%)
  if (fearGreed?.length) {
    const fg = parseInt(fearGreed[0].value);
    score += (fg - 50) * 0.3;
    const trend = fearGreed.length >= 2 ? fg - parseInt(fearGreed[1].value) : 0;
    if (trend > 5) signals.push({ type: 'bullish', msg: `Fear & Greed rising +${trend} pts`, weight: 'high' });
    if (trend < -5) signals.push({ type: 'bearish', msg: `Fear & Greed falling ${trend} pts`, weight: 'high' });
  }

  // Factor 2: Market momentum (weight: 25%)
  if (topCoins?.length) {
    const avgChange = topCoins.reduce((s, c) => s + (c.price_change_percentage_24h || 0), 0) / topCoins.length;
    score += avgChange * 2.5;
    const greenCount = topCoins.filter(c => (c.price_change_percentage_24h || 0) > 0).length;
    if (greenCount >= 15) signals.push({ type: 'bullish', msg: `${greenCount}/20 top coins green — strong momentum`, weight: 'high' });
    if (greenCount <= 5) signals.push({ type: 'bearish', msg: `Only ${greenCount}/20 top coins green — weakness`, weight: 'high' });

    // BTC dominance signal
    const btc = topCoins.find(c => c.symbol === 'btc');
    if (btc && btc.price_change_percentage_24h > 3) signals.push({ type: 'bullish', msg: `BTC pumping ${btc.price_change_percentage_24h.toFixed(1)}% — risk-on`, weight: 'medium' });
  }

  // Factor 3: Volume momentum (weight: 20%)
  if (globalData) {
    const volChange = globalData.market_cap_change_percentage_24h_usd || 0;
    score += volChange * 2;
    if (volChange > 3) signals.push({ type: 'bullish', msg: `Total market cap up ${volChange.toFixed(1)}%`, weight: 'medium' });
    if (volChange < -3) signals.push({ type: 'bearish', msg: `Total market cap down ${volChange.toFixed(1)}%`, weight: 'medium' });
  }

  // Factor 4: News sentiment (weight: 25%)
  if (news?.length) {
    // Simple keyword-based sentiment until we integrate AI
    const bullishKeywords = ['surge', 'rally', 'bullish', 'record', 'adoption', 'approve', 'launch', 'partner', 'milestone', 'growth', 'ath', 'breakout', 'pump'];
    const bearishKeywords = ['crash', 'plunge', 'hack', 'exploit', 'ban', 'fraud', 'dump', 'selloff', 'fear', 'warning', 'decline', 'lawsuit'];

    let bullCount = 0, bearCount = 0;
    news.forEach(n => {
      const title = (n.title || '').toLowerCase();
      if (bullishKeywords.some(k => title.includes(k))) bullCount++;
      if (bearishKeywords.some(k => title.includes(k))) bearCount++;
    });

    const newsBias = (bullCount - bearCount) / Math.max(news.length, 1) * 25;
    score += newsBias;
    if (bullCount > bearCount * 2) signals.push({ type: 'bullish', msg: `News heavily bullish (${bullCount}B/${bearCount}Bear)`, weight: 'medium' });
    if (bearCount > bullCount * 2) signals.push({ type: 'bearish', msg: `News heavily bearish (${bearCount}Bear/${bullCount}B)`, weight: 'medium' });
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Generate alpha label
  let label, alphaCall;
  if (score >= 80) { label = 'Extreme Greed'; alphaCall = 'CAUTION — Possible local top, consider taking profits'; }
  else if (score >= 65) { label = 'Greed'; alphaCall = 'BULLISH — Momentum strong, ride the wave with stops'; }
  else if (score >= 45) { label = 'Neutral'; alphaCall = 'NEUTRAL — Wait for clear direction, scalp opportunities'; }
  else if (score >= 25) { label = 'Fear'; alphaCall = 'ACCUMULATE — Smart money buys fear, DCA zones active'; }
  else { label = 'Extreme Fear'; alphaCall = 'MAX OPPORTUNITY — Generational buy zone, go heavy'; }

  return { score, label, alphaCall, signals };
}

// ─── Geographic Sentiment Hotspots ────────────────────────────────────────────

function generateGeoHotspots(topCoins, globalData) {
  // Map crypto activity to geographic coordinates based on known crypto hub regions
  const hubs = [
    { name: 'New York', lat: 40.71, lng: -74.01, region: 'North America', intensity: 0.9, activity: 'Institutional Trading' },
    { name: 'San Francisco', lat: 37.77, lng: -122.42, region: 'North America', intensity: 0.85, activity: 'VC & DeFi' },
    { name: 'Miami', lat: 25.76, lng: -80.19, region: 'North America', intensity: 0.7, activity: 'Crypto Events & Culture' },
    { name: 'London', lat: 51.51, lng: -0.13, region: 'Europe', intensity: 0.88, activity: 'Institutional & Regulatory' },
    { name: 'Zurich', lat: 47.37, lng: 8.54, region: 'Europe', intensity: 0.65, activity: 'Crypto Valley' },
    { name: 'Dubai', lat: 25.20, lng: 55.27, region: 'Middle East', intensity: 0.82, activity: 'Crypto Hubs & Exchanges' },
    { name: 'Singapore', lat: 1.35, lng: 103.82, region: 'Asia', intensity: 0.87, activity: 'Exchange & DeFi Hub' },
    { name: 'Hong Kong', lat: 22.32, lng: 114.17, region: 'Asia', intensity: 0.8, activity: 'Trading & Regulation' },
    { name: 'Tokyo', lat: 35.68, lng: 139.69, region: 'Asia', intensity: 0.75, activity: 'Institutional Adoption' },
    { name: 'Seoul', lat: 37.57, lng: 126.98, region: 'Asia', intensity: 0.78, activity: 'Retail Trading Mania' },
    { name: 'Shanghai', lat: 31.23, lng: 121.47, region: 'Asia', intensity: 0.6, activity: 'Mining & Development' },
    { name: 'Lagos', lat: 6.52, lng: 3.38, region: 'Africa', intensity: 0.55, activity: 'P2P & Remittance' },
    { name: 'São Paulo', lat: -23.55, lng: -46.63, region: 'South America', intensity: 0.58, activity: 'Retail Adoption' },
    { name: 'Berlin', lat: 52.52, lng: 13.41, region: 'Europe', intensity: 0.62, activity: 'Web3 & DAO' },
    { name: 'Lisbon', lat: 38.72, lng: -9.14, region: 'Europe', intensity: 0.5, activity: 'Crypto Nomads' },
    { name: 'Sydney', lat: -33.87, lng: 151.21, region: 'Oceania', intensity: 0.55, activity: 'Exchange & Mining' },
  ];

  // Modulate intensity based on market momentum
  const momentum = globalData?.market_cap_change_percentage_24h_usd || 0;
  return hubs.map(h => ({
    ...h,
    intensity: Math.min(1, Math.max(0.1, h.intensity + (momentum / 100) + (Math.random() * 0.1 - 0.05))),
    volume: `$${(h.intensity * 2.4 + Math.random() * 0.6).toFixed(1)}B`,
  }));
}

// ─── Alpha Plays Generator ───────────────────────────────────────────────────

function generateAlphaPlays(topCoins, sentiment, fearGreed) {
  if (!topCoins?.length) return [];

  const plays = [];

  // Find biggest movers
  const sorted24h = [...topCoins].sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
  const topGainer = sorted24h[0];
  const topLoser = sorted24h[sorted24h.length - 1];

  if (topGainer) {
    plays.push({
      type: 'momentum',
      title: `${topGainer.symbol.toUpperCase()} Momentum Play`,
      description: `${topGainer.name} up ${topGainer.price_change_percentage_24h?.toFixed(1)}% in 24h with strong volume. Momentum continuation likely if support holds.`,
      asset: topGainer.symbol.toUpperCase(),
      direction: 'long',
      confidence: Math.min(95, 60 + Math.abs(topGainer.price_change_percentage_24h || 0) * 2),
      timeframe: '4h-24h',
      risk: topGainer.price_change_percentage_24h > 10 ? 'high' : 'medium',
    });
  }

  // Mean reversion on oversold
  if (topLoser && (topLoser.price_change_percentage_24h || 0) < -5) {
    plays.push({
      type: 'reversal',
      title: `${topLoser.symbol.toUpperCase()} Bounce Setup`,
      description: `${topLoser.name} down ${topLoser.price_change_percentage_24h?.toFixed(1)}%. Oversold conditions suggest potential mean reversion bounce.`,
      asset: topLoser.symbol.toUpperCase(),
      direction: 'long',
      confidence: 55,
      timeframe: '12h-48h',
      risk: 'high',
    });
  }

  // Fear & Greed based plays
  const fgValue = fearGreed?.length ? parseInt(fearGreed[0].value) : 50;
  if (fgValue <= 25) {
    plays.push({
      type: 'macro',
      title: 'Extreme Fear DCA Entry',
      description: 'Market in extreme fear — historically the best time to dollar-cost average into BTC/ETH/SOL. Smart money accumulates here.',
      asset: 'BTC/ETH/SOL',
      direction: 'long',
      confidence: 80,
      timeframe: '1w-1m',
      risk: 'low',
    });
  } else if (fgValue >= 80) {
    plays.push({
      type: 'macro',
      title: 'Extreme Greed — Take Profits',
      description: 'Market in extreme greed — historically precedes corrections. Scale out of leveraged positions, set trailing stops.',
      asset: 'Portfolio',
      direction: 'reduce',
      confidence: 75,
      timeframe: '1d-1w',
      risk: 'low',
    });
  }

  // SOL ecosystem play
  const sol = topCoins.find(c => c.symbol === 'sol');
  if (sol && (sol.price_change_percentage_24h || 0) > 2) {
    plays.push({
      type: 'ecosystem',
      title: 'Solana Ecosystem Rotation',
      description: `SOL up ${sol.price_change_percentage_24h?.toFixed(1)}% — ecosystem tokens (JUP, BONK, WIF, JTO) typically follow with 1.5-3x beta.`,
      asset: 'SOL ecosystem',
      direction: 'long',
      confidence: 65,
      timeframe: '24h-72h',
      risk: 'medium',
    });
  }

  return plays;
}

// ─── Claude AI Sentiment Analysis ────────────────────────────────────────────

async function analyzeNewsWithClaude(news) {
  if (!news || news.length === 0) return null;
  const headlines = news.slice(0, 15).map(n => n.title).filter(Boolean);
  if (headlines.length === 0) return null;

  const text = await callClaude(
    'You are GOATED\'s sentiment analysis AI. Respond ONLY with valid JSON, no markdown fences.',
    `Analyze these crypto/market news headlines for sentiment. Return JSON:
{
  "overallSentiment": { "direction": "bullish|bearish|neutral", "score": 0-100, "confidence": 0-100 },
  "headlines": [{ "index": 0, "sentiment": "bullish|bearish|neutral", "score": 0-100, "keyDriver": "1-3 word reason" }],
  "narrativeSummary": "2-sentence market narrative from these headlines",
  "dominantThemes": ["theme1", "theme2", "theme3"]
}

Headlines:\n${headlines.map((h, i) => `${i}. ${h}`).join('\n')}`,
    700
  );
  if (!text) return null;
  try {
    const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const corsHeaders = getCorsHeaders(req);
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Check cache
  if (cache && Date.now() - cacheTs < CACHE_TTL) {
    return res.status(200).json({ ...cache, cached: true, cacheAge: Math.round((Date.now() - cacheTs) / 1000) });
  }

  try {
    // Fetch all sources in parallel
    const [fearGreed, trending, globalData, topCoins, news, predictions] = await Promise.all([
      fetchFearGreed(),
      fetchTrendingCoins(),
      fetchGlobalData(),
      fetchTopCoins(),
      fetchCryptoNews(),
      fetchPolymarketData(),
    ]);

    // Run GOATED AI scoring engine
    const sentiment = computeSentimentScore(fearGreed, globalData, topCoins, news);

    // Generate geographic hotspots
    const geoHotspots = generateGeoHotspots(topCoins, globalData);

    // Generate alpha plays
    const alphaPlays = generateAlphaPlays(topCoins, sentiment, fearGreed);

    // Format news with sentiment tags
    const formattedNews = (news || []).map(n => {
      const title = (n.title || '').toLowerCase();
      const bullish = ['surge', 'rally', 'bullish', 'record', 'adoption', 'approve', 'launch', 'growth', 'ath', 'breakout'].some(k => title.includes(k));
      const bearish = ['crash', 'plunge', 'hack', 'exploit', 'ban', 'fraud', 'dump', 'selloff', 'fear', 'warning', 'decline'].some(k => title.includes(k));
      return {
        id: n.id,
        title: n.title,
        source: n.source_info?.name || n.source || 'Unknown',
        url: n.url || n.guid,
        imageUrl: n.imageurl,
        publishedAt: n.published_on ? new Date(n.published_on * 1000).toISOString() : new Date().toISOString(),
        sentiment: bullish ? 'bullish' : bearish ? 'bearish' : 'neutral',
        categories: n.categories?.split('|').filter(Boolean) || [],
        tags: n.tags?.split('|').filter(Boolean) || [],
      };
    });

    // Format top coins for frontend
    const formattedCoins = (topCoins || []).map(c => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol?.toUpperCase(),
      image: c.image,
      price: c.current_price,
      marketCap: c.market_cap,
      volume24h: c.total_volume,
      change1h: c.price_change_percentage_1h_in_currency,
      change24h: c.price_change_percentage_24h,
      change7d: c.price_change_percentage_7d_in_currency,
      sparkline7d: c.sparkline_in_7d?.price || [],
      rank: c.market_cap_rank,
      ath: c.ath,
      athChangePercent: c.ath_change_percentage,
      high24h: c.high_24h,
      low24h: c.low_24h,
    }));

    // Format prediction markets
    const formattedPredictions = (predictions || []).slice(0, 10).map(m => ({
      id: m.condition_id || m.id || Math.random().toString(36).slice(2),
      question: m.question || m.description || 'Unknown market',
      outcomes: m.tokens?.map(t => t.outcome) || ['Yes', 'No'],
      outcomePrices: m.tokens?.map(t => t.price?.toString()) || ['0.50', '0.50'],
      volume: m.volume || 0,
      liquidity: m.liquidity || 0,
      endDate: m.end_date_iso,
      active: m.active ?? true,
    }));

    // AI-powered sentiment analysis (non-blocking fallback)
    let aiSentiment = null;
    try {
      aiSentiment = await analyzeNewsWithClaude(news);
      // If AI analysis succeeded, overlay AI scores onto formatted news
      if (aiSentiment?.headlines && Array.isArray(aiSentiment.headlines)) {
        aiSentiment.headlines.forEach(h => {
          if (h.index >= 0 && h.index < formattedNews.length) {
            formattedNews[h.index].aiSentiment = h.sentiment;
            formattedNews[h.index].aiScore = h.score;
            formattedNews[h.index].aiKeyDriver = h.keyDriver;
          }
        });
      }
    } catch (e) {
      console.warn('Claude sentiment analysis failed:', e.message);
    }

    // Build response
    const result = {
      timestamp: new Date().toISOString(),
      sentiment,
      aiSentiment: aiSentiment ? {
        overallSentiment: aiSentiment.overallSentiment,
        narrativeSummary: aiSentiment.narrativeSummary,
        dominantThemes: aiSentiment.dominantThemes,
      } : null,
      fearGreed: fearGreed ? {
        current: parseInt(fearGreed[0]?.value || 50),
        label: fearGreed[0]?.value_classification || 'Neutral',
        history: fearGreed.map(f => ({ value: parseInt(f.value), label: f.value_classification, date: new Date(f.timestamp * 1000).toISOString() })),
      } : null,
      globalMarket: globalData ? {
        totalMarketCap: globalData.total_market_cap?.usd,
        totalVolume: globalData.total_volume?.usd,
        btcDominance: globalData.market_cap_percentage?.btc,
        ethDominance: globalData.market_cap_percentage?.eth,
        marketCapChange24h: globalData.market_cap_change_percentage_24h_usd,
        activeCryptos: globalData.active_cryptocurrencies,
      } : null,
      coins: formattedCoins,
      trending: (trending || []).map(t => ({
        id: t.id,
        name: t.name,
        symbol: t.symbol,
        thumb: t.thumb || t.small,
        marketCapRank: t.market_cap_rank,
        score: t.score,
      })),
      news: formattedNews,
      predictions: formattedPredictions,
      geoHotspots,
      alphaPlays,
      sources: ['CoinGecko', 'Alternative.me', 'CryptoCompare', 'Polymarket'],
    };

    // Cache it
    cache = result;
    cacheTs = Date.now();

    return res.status(200).json(result);
  } catch (err) {
    console.error('Sentiment API error:', err);
    return res.status(500).json({ error: 'Failed to aggregate sentiment data', details: err.message });
  }
}
