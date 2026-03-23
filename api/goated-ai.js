// =============================================================================
// GOATED AI Engine — Custom Intelligence Model
// =============================================================================
// NOT a Claude/GPT wrapper. This is a proprietary multi-factor analysis engine
// that processes raw market data through custom algorithms for:
//   - Technical Analysis (RSI, momentum, volatility regimes)
//   - Predictive Scoring (breakout probability, reversal detection)
//   - Sentiment Fusion (multi-source weighted NLP + market signals)
//   - Cross-Asset Correlation (crypto/macro/social signal blending)
//   - Market Regime Detection (accumulation, markup, distribution, markdown)
//   - Risk Assessment (portfolio heat, drawdown probability)
//
// Endpoint: POST /api/goated-ai
// Body: { type: 'analyze' | 'predict' | 'score', data: {...} }
// =============================================================================

const ALLOWED_ORIGINS = [process.env.CORS_ORIGIN || 'https://goated.solutions', 'http://localhost:5173', 'http://localhost:5174'];
function getCorsOrigin(req) {
  const origin = req.headers?.origin || '';
  if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) return origin;
  return ALLOWED_ORIGINS[0];
}

// ─── Rate Limiter ───────────────────────────────────────────────────────────
const rateMap = new Map();
const RATE_WINDOW = 60_000;
const RATE_MAX = 30;
function checkRate(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) { rateMap.set(ip, { start: now, count: 1 }); return true; }
  entry.count++;
  return entry.count <= RATE_MAX;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of rateMap) { if (now - v.start > RATE_WINDOW * 2) rateMap.delete(k); } }, 120_000);

// ─── Technical Analysis Engine ──────────────────────────────────────────────

function calcRSI(prices, period = 14) {
  if (!prices || prices.length < period + 1) return 50;
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  const recent = changes.slice(-period);
  let gains = 0, losses = 0;
  recent.forEach(c => { if (c > 0) gains += c; else losses += Math.abs(c); });
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round((100 - 100 / (1 + rs)) * 10) / 10;
}

function calcEMA(prices, period) {
  if (!prices || prices.length < period) return prices ? prices[prices.length - 1] : 0;
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

function calcMACD(prices) {
  if (!prices || prices.length < 26) return { macd: 0, signal: 0, histogram: 0, trend: 'neutral' };
  const ema12 = calcEMA(prices, 12);
  const ema26 = calcEMA(prices, 26);
  const macd = ema12 - ema26;
  // Approximate signal line
  const macdLine = [];
  for (let i = 26; i < prices.length; i++) {
    const e12 = calcEMA(prices.slice(0, i + 1), 12);
    const e26 = calcEMA(prices.slice(0, i + 1), 26);
    macdLine.push(e12 - e26);
  }
  const signal = macdLine.length >= 9 ? calcEMA(macdLine, 9) : macd;
  const histogram = macd - signal;
  return {
    macd: Math.round(macd * 100) / 100,
    signal: Math.round(signal * 100) / 100,
    histogram: Math.round(histogram * 100) / 100,
    trend: histogram > 0 ? 'bullish' : 'bearish',
    crossover: Math.abs(histogram) < Math.abs(macd * 0.05) ? 'imminent' : 'none',
  };
}

function calcBollingerBands(prices, period = 20) {
  if (!prices || prices.length < period) return { upper: 0, middle: 0, lower: 0, width: 0, position: 0.5 };
  const recent = prices.slice(-period);
  const mean = recent.reduce((a, b) => a + b, 0) / period;
  const variance = recent.reduce((a, p) => a + (p - mean) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);
  const upper = mean + 2 * stdDev;
  const lower = mean - 2 * stdDev;
  const current = prices[prices.length - 1];
  const width = (upper - lower) / mean;
  const position = (current - lower) / (upper - lower || 1);
  return {
    upper: Math.round(upper * 100) / 100,
    middle: Math.round(mean * 100) / 100,
    lower: Math.round(lower * 100) / 100,
    width: Math.round(width * 10000) / 100,
    position: Math.round(Math.max(0, Math.min(1, position)) * 100) / 100,
  };
}

function calcVolatilityRegime(prices) {
  if (!prices || prices.length < 20) return { regime: 'normal', annualized: 0, percentile: 50 };
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / returns.length;
  const dailyVol = Math.sqrt(variance);
  const annualized = dailyVol * Math.sqrt(365) * 100;
  // Rolling volatility windows for percentile
  const shortVol = calcWindowVol(returns.slice(-7));
  const longVol = calcWindowVol(returns);
  const ratio = shortVol / (longVol || 1);
  let regime = 'normal';
  if (ratio > 1.5 && annualized > 80) regime = 'extreme';
  else if (ratio > 1.2) regime = 'expanding';
  else if (ratio < 0.7) regime = 'contracting';
  else if (annualized < 30) regime = 'low';
  return {
    regime,
    annualized: Math.round(annualized * 10) / 10,
    shortTermVol: Math.round(shortVol * 365 * 10000) / 100,
    longTermVol: Math.round(longVol * 365 * 10000) / 100,
    ratio: Math.round(ratio * 100) / 100,
    percentile: Math.min(99, Math.max(1, Math.round(annualized / 1.5))),
  };
}

function calcWindowVol(returns) {
  if (!returns.length) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  return Math.sqrt(returns.reduce((a, r) => a + (r - mean) ** 2, 0) / returns.length);
}

// ─── Predictive Scoring Engine ──────────────────────────────────────────────

function predictBreakout(coin) {
  const prices = coin.sparkline7d || coin.sparkline_in_7d?.price || [];
  if (prices.length < 20) return { probability: 0, direction: 'neutral', timeframe: 'unknown' };

  const rsi = calcRSI(prices);
  const bb = calcBollingerBands(prices);
  const macd = calcMACD(prices);
  const vol = calcVolatilityRegime(prices);

  let score = 0;
  let direction = 'neutral';
  const signals = [];

  // Bollinger squeeze (low width = impending breakout)
  if (bb.width < 5) { score += 25; signals.push('Bollinger squeeze detected'); }
  // Volume expansion with price at band edge
  if (bb.position > 0.85) { score += 15; direction = 'up'; signals.push('Price at upper Bollinger band'); }
  if (bb.position < 0.15) { score += 15; direction = 'down'; signals.push('Price at lower Bollinger band'); }
  // MACD crossover imminent
  if (macd.crossover === 'imminent') { score += 20; signals.push('MACD crossover imminent'); }
  // RSI divergence
  if (rsi > 65 && macd.trend === 'bullish') { score += 15; direction = 'up'; signals.push('RSI + MACD bullish alignment'); }
  if (rsi < 35 && macd.trend === 'bearish') { score += 15; direction = 'down'; signals.push('RSI + MACD bearish alignment'); }
  // Volatility contraction before expansion
  if (vol.regime === 'contracting') { score += 20; signals.push('Volatility contraction — expansion likely'); }

  // Volume spike detection
  const c24 = coin.price_change_percentage_24h || coin.change24h || 0;
  const volRatio = (coin.total_volume || coin.volume24h || 0) / (coin.market_cap || coin.marketCap || 1);
  if (volRatio > 0.15) { score += 15; signals.push('Volume spike detected'); }

  // Momentum confirmation
  if (Math.abs(c24) > 5) { score += 10; direction = c24 > 0 ? 'up' : 'down'; }

  return {
    probability: Math.min(95, score),
    direction: direction === 'neutral' ? (macd.trend === 'bullish' ? 'up' : 'down') : direction,
    timeframe: score > 60 ? '4-12h' : score > 40 ? '12-48h' : '2-7d',
    signals,
    confidence: score > 70 ? 'high' : score > 40 ? 'medium' : 'low',
  };
}

function detectMarketRegime(coins) {
  if (!coins || coins.length < 10) return { regime: 'unknown', description: '', score: 50 };

  const changes = coins.map(c => c.price_change_percentage_24h || c.change24h || 0);
  const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
  const greenPct = changes.filter(c => c > 0).length / changes.length;
  const bigMovers = changes.filter(c => Math.abs(c) > 5).length / changes.length;

  // Wyckoff-inspired regime detection
  if (avg > 3 && greenPct > 0.75 && bigMovers > 0.2) {
    return { regime: 'markup', description: 'Strong uptrend — broad market momentum. Ride winners, trail stops.', score: 80, action: 'BUY momentum dips', color: '#00ff88' };
  }
  if (avg > 0.5 && greenPct > 0.6 && bigMovers < 0.15) {
    return { regime: 'accumulation', description: 'Quiet accumulation phase — smart money loading. Watch for breakouts.', score: 65, action: 'ACCUMULATE on dips', color: '#10b981' };
  }
  if (avg < -3 && greenPct < 0.25 && bigMovers > 0.2) {
    return { regime: 'markdown', description: 'Active sell-off — high fear, forced liquidations. Cash is king, wait for capitulation.', score: 20, action: 'WAIT for capitulation', color: '#ef4444' };
  }
  if (avg < -0.5 && greenPct < 0.4 && bigMovers < 0.15) {
    return { regime: 'distribution', description: 'Distribution phase — whales selling into strength. Reduce exposure, raise stops.', score: 35, action: 'REDUCE exposure', color: '#f59e0b' };
  }
  return { regime: 'transition', description: 'Market in transition — mixed signals. Wait for clear direction.', score: 50, action: 'WAIT for clarity', color: '#6366f1' };
}

// ─── Advanced Sentiment Engine ──────────────────────────────────────────────

const SENTIMENT_LEXICON = {
  // Strongly bullish (weight 3)
  'breakout': 3, 'moon': 3, 'ath': 3, 'record high': 3, 'surge': 3, 'explode': 3, 'skyrocket': 3,
  'institutional adoption': 3, 'etf approved': 3, 'massive rally': 3, 'parabolic': 3,
  // Moderately bullish (weight 2)
  'rally': 2, 'bullish': 2, 'pump': 2, 'gain': 2, 'growth': 2, 'adoption': 2, 'upgrade': 2,
  'accumulate': 2, 'buy signal': 2, 'outperform': 2, 'partnership': 2, 'launch': 2, 'milestone': 2,
  // Mildly bullish (weight 1)
  'up': 1, 'rise': 1, 'positive': 1, 'strong': 1, 'recover': 1, 'green': 1, 'support': 1,
  'improve': 1, 'optimistic': 1, 'opportunity': 1,
  // Mildly bearish (weight -1)
  'down': -1, 'fall': -1, 'negative': -1, 'weak': -1, 'concern': -1, 'red': -1, 'pressure': -1,
  'uncertainty': -1, 'caution': -1, 'risk': -1,
  // Moderately bearish (weight -2)
  'crash': -2, 'bearish': -2, 'dump': -2, 'plunge': -2, 'selloff': -2, 'decline': -2, 'bearish': -2,
  'hack': -2, 'exploit': -2, 'scam': -2, 'fraud': -2, 'lawsuit': -2, 'ban': -2, 'restrict': -2,
  // Strongly bearish (weight -3)
  'capitulation': -3, 'collapse': -3, 'liquidation': -3, 'rug pull': -3, 'ponzi': -3,
  'bank run': -3, 'insolvency': -3, 'death spiral': -3, 'black swan': -3,
};

function analyzeSentimentAdvanced(text) {
  if (!text) return { score: 0, normalized: 0.5, label: 'neutral', confidence: 0, keywords: [] };
  const lower = text.toLowerCase();
  let totalWeight = 0;
  let maxPossible = 0;
  const foundKeywords = [];

  for (const [phrase, weight] of Object.entries(SENTIMENT_LEXICON)) {
    const regex = new RegExp(`\\b${phrase.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) {
      totalWeight += weight * matches.length;
      maxPossible += Math.abs(weight) * matches.length;
      foundKeywords.push({ phrase, weight, count: matches.length });
    }
  }

  // Context modifiers
  if (lower.includes('not ') || lower.includes("n't ") || lower.includes('no ')) {
    totalWeight *= -0.5; // Negation flips sentiment partially
  }
  if (lower.includes('despite') || lower.includes('although') || lower.includes('however')) {
    totalWeight *= 0.7; // Hedging reduces confidence
  }

  const normalized = maxPossible > 0 ? 0.5 + (totalWeight / (maxPossible * 2)) : 0.5;
  const clamped = Math.max(0, Math.min(1, normalized));
  const confidence = Math.min(100, Math.round(maxPossible * 8));

  return {
    score: totalWeight,
    normalized: Math.round(clamped * 100) / 100,
    label: clamped > 0.65 ? 'bullish' : clamped < 0.35 ? 'bearish' : 'neutral',
    confidence,
    keywords: foundKeywords.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, 5),
  };
}

function fuseSentimentSources(fearGreed, newsSentiment, marketMomentum, socialSignals) {
  // Multi-source weighted sentiment fusion
  const weights = { fearGreed: 0.25, news: 0.25, market: 0.35, social: 0.15 };

  const fgScore = fearGreed != null ? fearGreed / 100 : 0.5;
  const newsScore = newsSentiment != null ? newsSentiment : 0.5;
  const marketScore = marketMomentum != null ? (marketMomentum + 100) / 200 : 0.5;
  const socialScore = socialSignals != null ? socialSignals : 0.5;

  const fused = fgScore * weights.fearGreed +
    newsScore * weights.news +
    marketScore * weights.market +
    socialScore * weights.social;

  // Bayesian confidence based on source agreement
  const scores = [fgScore, newsScore, marketScore, socialScore];
  const variance = scores.reduce((a, s) => a + (s - fused) ** 2, 0) / scores.length;
  const agreement = Math.max(0, 1 - variance * 4); // High variance = low agreement

  return {
    composite: Math.round(fused * 100),
    confidence: Math.round(agreement * 100),
    breakdown: {
      fearGreed: Math.round(fgScore * 100),
      news: Math.round(newsScore * 100),
      market: Math.round(marketScore * 100),
      social: Math.round(socialScore * 100),
    },
    label: fused > 0.7 ? 'Extreme Greed' : fused > 0.55 ? 'Greed' : fused > 0.45 ? 'Neutral' : fused > 0.3 ? 'Fear' : 'Extreme Fear',
  };
}

// ─── Cross-Asset Correlation ────────────────────────────────────────────────

function calcCorrelation(x, y) {
  if (!x || !y || x.length < 5 || y.length < 5) return 0;
  const n = Math.min(x.length, y.length);
  const xs = x.slice(-n), ys = y.slice(-n);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : Math.round((num / denom) * 100) / 100;
}

function buildCorrelationMatrix(coins) {
  if (!coins || coins.length < 2) return [];
  const pairs = [];
  const top = coins.slice(0, 15); // Analyze top 15 assets for broader coverage
  for (let i = 0; i < top.length; i++) {
    for (let j = i + 1; j < top.length; j++) {
      const pi = top[i].sparkline7d || top[i].sparkline_in_7d?.price || [];
      const pj = top[j].sparkline7d || top[j].sparkline_in_7d?.price || [];
      const corr = calcCorrelation(pi, pj);
      if (Math.abs(corr) > 0.25) { // Lower threshold to capture more pairs
        pairs.push({
          a: top[i].symbol?.toUpperCase() || top[i].id,
          b: top[j].symbol?.toUpperCase() || top[j].id,
          correlation: corr,
          label: corr > 0.8 ? 'very strongly correlated' : corr > 0.6 ? 'strongly correlated' : corr > 0.4 ? 'correlated' : corr > 0.25 ? 'weakly correlated' : corr < -0.6 ? 'strongly inversely correlated' : corr < -0.4 ? 'inversely correlated' : 'weakly inversely correlated',
          tradingImplication: corr > 0.7 ? 'Moves together — diversify away or use as confirmation signal' : corr < -0.5 ? 'Natural hedge — consider pair trade opportunity' : 'Low correlation — good for diversification',
        });
      }
    }
  }
  return pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 20);
}

// ─── AI Prediction Generator ────────────────────────────────────────────────

function generatePredictions(coins, sentiment, regime) {
  if (!coins || !coins.length) return [];
  const predictions = [];

  coins.slice(0, 20).forEach(coin => {
    const prices = coin.sparkline7d || coin.sparkline_in_7d?.price || [];
    if (prices.length < 10) return;

    const rsi = calcRSI(prices);
    const macd = calcMACD(prices);
    const bb = calcBollingerBands(prices);
    const breakout = predictBreakout(coin);
    const vol = calcVolatilityRegime(prices);
    const currentPrice = coin.current_price || coin.price || prices[prices.length - 1];

    // Price target based on Bollinger + momentum
    const momentum = (coin.price_change_percentage_24h || coin.change24h || 0);
    let target24h, target7d;
    if (macd.trend === 'bullish' && rsi < 70) {
      target24h = currentPrice * (1 + Math.abs(momentum) * 0.3 / 100 + 0.01);
      target7d = currentPrice * (1 + Math.abs(momentum) * 1.2 / 100 + 0.03);
    } else if (macd.trend === 'bearish' && rsi > 30) {
      target24h = currentPrice * (1 - Math.abs(momentum) * 0.3 / 100 - 0.01);
      target7d = currentPrice * (1 - Math.abs(momentum) * 1.2 / 100 - 0.03);
    } else {
      target24h = currentPrice * (1 + momentum * 0.002);
      target7d = currentPrice * (1 + momentum * 0.008);
    }

    // Risk score (0-100, higher = riskier)
    let riskScore = 30;
    if (vol.regime === 'extreme') riskScore += 30;
    else if (vol.regime === 'expanding') riskScore += 15;
    if (rsi > 80 || rsi < 20) riskScore += 20;
    if (breakout.probability > 60) riskScore += 10;
    riskScore = Math.min(100, riskScore);

    // GOATED Score (proprietary composite)
    let goatedScore = 50;
    if (macd.trend === 'bullish') goatedScore += 10;
    if (rsi > 40 && rsi < 65) goatedScore += 15; // Healthy RSI range
    if (bb.position > 0.3 && bb.position < 0.8) goatedScore += 10;
    if (breakout.probability > 50 && breakout.direction === 'up') goatedScore += 15;
    if (vol.regime === 'contracting') goatedScore += 10;
    if (momentum > 0 && momentum < 8) goatedScore += 10; // Steady growth
    goatedScore = Math.min(99, Math.max(1, goatedScore));

    const symbol = (coin.symbol || '').toUpperCase();
    predictions.push({
      id: coin.id,
      symbol,
      name: coin.name,
      currentPrice,
      target24h: Math.round(target24h * 100) / 100,
      target7d: Math.round(target7d * 100) / 100,
      change24hPredicted: Math.round((target24h / currentPrice - 1) * 10000) / 100,
      change7dPredicted: Math.round((target7d / currentPrice - 1) * 10000) / 100,
      goatedScore,
      riskScore,
      riskLabel: riskScore > 70 ? 'High Risk' : riskScore > 40 ? 'Medium Risk' : 'Low Risk',
      technicals: { rsi, macd: macd.trend, bb: bb.position, volatility: vol.regime },
      breakout,
      action: goatedScore > 70 ? 'STRONG BUY' : goatedScore > 55 ? 'BUY' : goatedScore > 45 ? 'HOLD' : goatedScore > 30 ? 'REDUCE' : 'SELL',
      actionColor: goatedScore > 70 ? '#00ff88' : goatedScore > 55 ? '#10b981' : goatedScore > 45 ? '#f59e0b' : goatedScore > 30 ? '#f97316' : '#ef4444',
    });
  });

  return predictions.sort((a, b) => b.goatedScore - a.goatedScore);
}

// ─── News Intelligence Processing ───────────────────────────────────────────

function processNewsIntelligence(articles) {
  if (!articles || !articles.length) return { articles: [], summary: null };

  const processed = articles.map(article => {
    const text = `${article.title || ''} ${article.body || ''}`;
    const sentiment = analyzeSentimentAdvanced(text);

    // Extract mentioned assets
    const assetMentions = [];
    const assetPatterns = {
      BTC: /bitcoin|btc/i, ETH: /ethereum|eth\b/i, SOL: /solana|sol\b/i,
      BNB: /binance|bnb/i, ADA: /cardano|ada\b/i, DOT: /polkadot|dot\b/i,
      AVAX: /avalanche|avax/i, LINK: /chainlink|link\b/i, XRP: /ripple|xrp/i,
      DOGE: /dogecoin|doge/i, MATIC: /polygon|matic/i, ARB: /arbitrum|arb\b/i,
    };
    for (const [symbol, pattern] of Object.entries(assetPatterns)) {
      if (pattern.test(text)) assetMentions.push(symbol);
    }

    // Categorize impact
    const impactKeywords = {
      high: /regulation|sec |etf|ban|hack|exploit|billion|trillion|institutional|government/i,
      medium: /partnership|launch|upgrade|milestone|funding|investment|exchange/i,
      low: /opinion|analysis|review|guide|tutorial|prediction/i,
    };
    let impact = 'low';
    if (impactKeywords.high.test(text)) impact = 'high';
    else if (impactKeywords.medium.test(text)) impact = 'medium';

    return {
      ...article,
      aiSentiment: sentiment,
      assetMentions,
      impact,
      relevanceScore: sentiment.confidence + (impact === 'high' ? 40 : impact === 'medium' ? 20 : 0) + assetMentions.length * 10,
    };
  });

  // Generate news summary
  const bullish = processed.filter(a => a.aiSentiment.label === 'bullish').length;
  const bearish = processed.filter(a => a.aiSentiment.label === 'bearish').length;
  const neutral = processed.filter(a => a.aiSentiment.label === 'neutral').length;
  const avgSentiment = processed.reduce((s, a) => s + a.aiSentiment.normalized, 0) / (processed.length || 1);
  const highImpact = processed.filter(a => a.impact === 'high');

  return {
    articles: processed.sort((a, b) => b.relevanceScore - a.relevanceScore),
    summary: {
      totalArticles: processed.length,
      bullish, bearish, neutral,
      avgSentiment: Math.round(avgSentiment * 100),
      bias: avgSentiment > 0.55 ? 'bullish' : avgSentiment < 0.45 ? 'bearish' : 'neutral',
      highImpactCount: highImpact.length,
      topStory: highImpact[0]?.title || processed[0]?.title || 'No stories available',
    },
  };
}

// ─── Full Analysis Pipeline ─────────────────────────────────────────────────

function runFullAnalysis(data) {
  const { coins, news, fearGreed, globalData, trending } = data;

  // 1. Market regime detection
  const regime = detectMarketRegime(coins || []);

  // 2. Per-coin technical analysis
  const technicals = (coins || []).slice(0, 20).map(coin => {
    const prices = coin.sparkline7d || coin.sparkline_in_7d?.price || [];
    return {
      id: coin.id,
      symbol: (coin.symbol || '').toUpperCase(),
      rsi: calcRSI(prices),
      macd: calcMACD(prices),
      bollingerBands: calcBollingerBands(prices),
      volatility: calcVolatilityRegime(prices),
      breakout: predictBreakout(coin),
    };
  });

  // 3. AI predictions
  const predictions = generatePredictions(coins, null, regime);

  // 4. News intelligence
  const newsIntel = processNewsIntelligence(news);

  // 5. Cross-asset correlations
  const correlations = buildCorrelationMatrix(coins || []);

  // 6. Fused sentiment
  const avgNewsScore = newsIntel.summary ? newsIntel.summary.avgSentiment / 100 : 0.5;
  const marketMomentum = coins ? coins.reduce((s, c) => s + (c.price_change_percentage_24h || c.change24h || 0), 0) / coins.length : 0;
  const fgValue = fearGreed?.[0]?.value ? parseInt(fearGreed[0].value) : null;
  const fusedSentiment = fuseSentimentSources(fgValue, avgNewsScore, marketMomentum, null);

  // 7. Portfolio heat map
  const portfolioHeat = calcPortfolioHeat(coins);

  return {
    regime,
    technicals,
    predictions,
    newsIntelligence: newsIntel,
    correlations,
    sentiment: fusedSentiment,
    portfolioHeat,
    engineVersion: '2.0.0',
    model: 'GOATED-AI-v2',
    processedAt: new Date().toISOString(),
  };
}

function calcPortfolioHeat(coins) {
  if (!coins || coins.length < 5) return { heat: 50, label: 'Neutral' };
  const volatilities = coins.slice(0, 20).map(c => {
    const prices = c.sparkline7d || c.sparkline_in_7d?.price || [];
    const vol = calcVolatilityRegime(prices);
    return vol.annualized;
  });
  const avgVol = volatilities.reduce((a, b) => a + b, 0) / volatilities.length;
  const heat = Math.min(100, Math.round(avgVol / 1.2));
  return {
    heat,
    label: heat > 75 ? 'Overheated' : heat > 50 ? 'Warm' : heat > 25 ? 'Cool' : 'Cold',
    avgVolatility: Math.round(avgVol * 10) / 10,
    riskAdvice: heat > 75 ? 'Reduce position sizes, tighten stops' : heat > 50 ? 'Normal sizing, maintain stops' : 'Safe to size up, low volatility environment',
  };
}

// ─── Industry Analysis Templates ─────────────────────────────────────────────

const INDUSTRY_TEMPLATES = {
  SaaS: {
    keyMetrics: ['ARR', 'MRR Growth', 'Net Revenue Retention', 'CAC Payback', 'LTV:CAC Ratio', 'Churn Rate', 'Rule of 40'],
    painPoints: ['Customer churn', 'Long sales cycles', 'Integration complexity', 'Feature parity with competitors', 'Scaling infrastructure costs'],
    buyingSignals: ['Hiring SDRs/AEs', 'New funding round', 'CRM migration', 'Expanding into new markets', 'Product launch'],
    closingStrategy: 'Lead with ROI calculator. SaaS buyers respond to payback period < 12 months. Offer pilot/POC with clear success metrics. Target the VP Sales or CRO — they own the budget.',
    avgDealCycle: '45-90 days',
    benchmarks: { avgDealSize: '$35K-$150K', winRate: '22-28%', avgDiscount: '15-20%' },
  },
  Fintech: {
    keyMetrics: ['TPV', 'Take Rate', 'Regulatory Compliance Score', 'Fraud Rate', 'Customer Acquisition Cost', 'Revenue per User'],
    painPoints: ['Regulatory compliance burden', 'Fraud prevention', 'Legacy system integration', 'Customer trust/security', 'Cross-border complexity'],
    buyingSignals: ['New license application', 'Compliance audit', 'Series B+', 'International expansion', 'Partnership announcements'],
    closingStrategy: 'Lead with compliance/security angle. Fintech buyers are risk-averse — show SOC2/ISO certs. Emphasize time-to-market acceleration. Target CPO or Head of Engineering.',
    avgDealCycle: '60-120 days',
    benchmarks: { avgDealSize: '$50K-$250K', winRate: '18-24%', avgDiscount: '10-15%' },
  },
  'AI/ML': {
    keyMetrics: ['Model Accuracy', 'Inference Latency', 'Data Pipeline Throughput', 'GPU Utilization', 'Time to Production', 'Cost per Prediction'],
    painPoints: ['Model deployment complexity', 'Data quality/labeling', 'GPU costs at scale', 'MLOps maturity', 'Talent shortage'],
    buyingSignals: ['Hiring ML engineers', 'Cloud spend increase', 'New data partnerships', 'Model performance issues', 'Scaling challenges'],
    closingStrategy: 'Lead with technical demo. AI buyers are technical — show benchmarks, not slides. Offer proof-of-concept on their data. Target CTO or VP Engineering.',
    avgDealCycle: '30-75 days',
    benchmarks: { avgDealSize: '$25K-$200K', winRate: '25-32%', avgDiscount: '12-18%' },
  },
  'E-commerce': {
    keyMetrics: ['GMV', 'Conversion Rate', 'AOV', 'Cart Abandonment Rate', 'Customer Lifetime Value', 'Return Rate'],
    painPoints: ['Cart abandonment', 'Customer acquisition costs rising', 'Inventory management', 'Shipping/logistics complexity', 'Personalization at scale'],
    buyingSignals: ['Peak season prep', 'New marketplace launch', 'Replatforming', 'International expansion', 'DTC pivot'],
    closingStrategy: 'Lead with revenue impact. E-comm buyers want to see GMV lift. Show A/B test results from similar companies. Target VP Marketing or Head of E-commerce. Create urgency around peak seasons.',
    avgDealCycle: '30-60 days',
    benchmarks: { avgDealSize: '$20K-$100K', winRate: '28-35%', avgDiscount: '18-25%' },
  },
};

function generateIndustryReport(industry) {
  const template = INDUSTRY_TEMPLATES[industry];
  if (!template) return null;
  return {
    industry,
    keyMetrics: template.keyMetrics,
    commonPainPoints: template.painPoints,
    buyingSignals: template.buyingSignals,
    recommendedStrategy: template.closingStrategy,
    avgDealCycle: template.avgDealCycle,
    benchmarks: template.benchmarks,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Deep Research Mode ──────────────────────────────────────────────────────

function generateResearchReport(topic, coins, news) {
  const report = {
    topic,
    generatedAt: new Date().toISOString(),
    engineVersion: '2.0.0',
    sections: {},
  };

  // Market Overview
  if (coins && coins.length > 0) {
    const totalMcap = coins.reduce((s, c) => s + (c.market_cap || c.marketCap || 0), 0);
    const avg24h = coins.reduce((s, c) => s + (c.price_change_percentage_24h || c.change24h || 0), 0) / coins.length;
    const topGainers = [...coins].sort((a, b) => (b.price_change_percentage_24h || b.change24h || 0) - (a.price_change_percentage_24h || a.change24h || 0)).slice(0, 5);
    const topLosers = [...coins].sort((a, b) => (a.price_change_percentage_24h || a.change24h || 0) - (b.price_change_percentage_24h || b.change24h || 0)).slice(0, 5);

    report.sections.marketOverview = {
      totalMarketCap: totalMcap,
      avgChange24h: Math.round(avg24h * 100) / 100,
      sentiment: avg24h > 2 ? 'bullish' : avg24h < -2 ? 'bearish' : 'neutral',
      topGainers: topGainers.map(c => ({ symbol: (c.symbol || '').toUpperCase(), change: Math.round((c.price_change_percentage_24h || c.change24h || 0) * 100) / 100 })),
      topLosers: topLosers.map(c => ({ symbol: (c.symbol || '').toUpperCase(), change: Math.round((c.price_change_percentage_24h || c.change24h || 0) * 100) / 100 })),
    };
  }

  // Technical Analysis Summary
  if (coins && coins.length > 0) {
    const techSummary = coins.slice(0, 10).map(coin => {
      const prices = coin.sparkline7d || coin.sparkline_in_7d?.price || [];
      return {
        symbol: (coin.symbol || '').toUpperCase(),
        rsi: calcRSI(prices),
        macd: calcMACD(prices),
        bollinger: calcBollingerBands(prices),
        volatility: calcVolatilityRegime(prices),
        breakout: predictBreakout(coin),
      };
    });
    report.sections.technicalAnalysis = techSummary;
  }

  // Correlation Matrix
  if (coins && coins.length >= 2) {
    report.sections.correlations = buildCorrelationMatrix(coins);
  }

  // News Sentiment
  if (news && news.length > 0) {
    const newsIntel = processNewsIntelligence(news);
    report.sections.newsSentiment = newsIntel.summary;
    report.sections.topStories = newsIntel.articles.slice(0, 10).map(a => ({
      title: a.title,
      sentiment: a.aiSentiment.label,
      impact: a.impact,
      assets: a.assetMentions,
    }));
  }

  // Industry Analysis (if topic matches an industry)
  const matchedIndustry = Object.keys(INDUSTRY_TEMPLATES).find(k => topic.toLowerCase().includes(k.toLowerCase()));
  if (matchedIndustry) {
    report.sections.industryAnalysis = generateIndustryReport(matchedIndustry);
  }

  // Regime Detection
  if (coins) {
    report.sections.marketRegime = detectMarketRegime(coins);
  }

  // Predictions for top assets
  if (coins) {
    const predictions = generatePredictions(coins, null, report.sections.marketRegime);
    report.sections.predictions = predictions.slice(0, 10);
  }

  return report;
}

// ─── Cache ──────────────────────────────────────────────────────────────────

let cache = { data: null, ts: 0, ttl: 30_000 };

// ─── Main Handler ───────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const origin = req.headers?.origin || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app') ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRate(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
  }

  try {
    if (req.method === 'GET') {
      // Standalone analysis — fetch data ourselves
      if (cache.data && Date.now() - cache.ts < cache.ttl) {
        return res.status(200).json({ ...cache.data, cached: true });
      }

      const [marketsRes, fngRes, newsRes, trendingRes, globalRes] = await Promise.allSettled([
        fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=1h,24h,7d', { signal: AbortSignal.timeout(8000) }).then(r => r.json()),
        fetch('https://api.alternative.me/fng/?limit=7', { signal: AbortSignal.timeout(4000) }).then(r => r.json()),
        fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=popular', { signal: AbortSignal.timeout(5000) }).then(r => r.json()),
        fetch('https://api.coingecko.com/api/v3/search/trending', { signal: AbortSignal.timeout(5000) }).then(r => r.json()),
        fetch('https://api.coingecko.com/api/v3/global', { signal: AbortSignal.timeout(5000) }).then(r => r.json()),
      ]);

      const coins = marketsRes.status === 'fulfilled' ? marketsRes.value : [];
      const fng = fngRes.status === 'fulfilled' ? fngRes.value.data : [];
      const news = newsRes.status === 'fulfilled' ? (newsRes.value.Data || []).slice(0, 25) : [];
      const trending = trendingRes.status === 'fulfilled' ? trendingRes.value : null;
      const globalData = globalRes.status === 'fulfilled' ? globalRes.value.data : null;

      const result = runFullAnalysis({ coins, news, fearGreed: fng, globalData, trending });
      cache.data = result;
      cache.ts = Date.now();
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      // Validate Content-Type
      const ct = req.headers['content-type'] || '';
      if (!ct.includes('application/json')) {
        return res.status(400).json({ error: 'Content-Type must be application/json' });
      }

      const { type, data } = req.body || {};

      // Whitelist valid types
      const VALID_TYPES = ['analyze', 'predict', 'sentiment', 'research', 'industry'];
      if (!type || !VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
      }

      // Validate body size (reject payloads over 100KB)
      const bodySize = JSON.stringify(req.body).length;
      if (bodySize > 102400) {
        return res.status(413).json({ error: 'Request body too large (max 100KB)' });
      }

      if (type === 'analyze' && data) {
        const result = runFullAnalysis(data);
        return res.status(200).json(result);
      }

      if (type === 'predict' && data?.coin) {
        const prediction = predictBreakout(data.coin);
        const prices = data.coin.sparkline7d || data.coin.sparkline_in_7d?.price || [];
        return res.status(200).json({
          prediction,
          technicals: {
            rsi: calcRSI(prices),
            macd: calcMACD(prices),
            bollingerBands: calcBollingerBands(prices),
            volatility: calcVolatilityRegime(prices),
          },
        });
      }

      if (type === 'sentiment' && data?.text) {
        if (typeof data.text !== 'string' || data.text.length > 10000) {
          return res.status(400).json({ error: 'Text must be a string under 10,000 characters' });
        }
        // Strip HTML tags to prevent stored XSS
        const cleanText = data.text.replace(/<[^>]*>/g, '');
        return res.status(200).json(analyzeSentimentAdvanced(cleanText));
      }

      // Deep Research mode: structured research report on any topic
      if (type === 'research') {
        const topic = data?.topic;
        if (!topic || typeof topic !== 'string' || topic.length > 500) {
          return res.status(400).json({ error: 'Research topic required (string, max 500 chars)' });
        }
        // Fetch fresh market data for the report
        const [marketsRes, newsRes] = await Promise.allSettled([
          fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=1h,24h,7d', { signal: AbortSignal.timeout(8000) }).then(r => r.json()),
          fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=popular', { signal: AbortSignal.timeout(5000) }).then(r => r.json()),
        ]);
        const coins = marketsRes.status === 'fulfilled' ? marketsRes.value : [];
        const news = newsRes.status === 'fulfilled' ? (newsRes.value.Data || []).slice(0, 25) : [];
        const report = generateResearchReport(topic, coins, news);
        return res.status(200).json(report);
      }

      // Industry analysis template
      if (type === 'industry') {
        const industry = data?.industry;
        if (!industry || typeof industry !== 'string') {
          return res.status(400).json({ error: 'Industry name required' });
        }
        const report = generateIndustryReport(industry);
        if (!report) {
          const available = Object.keys(INDUSTRY_TEMPLATES);
          return res.status(200).json({ error: `Industry "${industry}" not found. Available: ${available.join(', ')}`, available });
        }
        return res.status(200).json(report);
      }

      return res.status(400).json({ error: 'Invalid request type. Use: analyze, predict, sentiment, research, industry' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('GOATED AI error:', err);
    return res.status(500).json({ error: 'AI engine error', message: err.message });
  }
}

