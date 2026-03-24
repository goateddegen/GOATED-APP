// =============================================================================
// GOATED Solutions - Real-Time Intelligence API
// =============================================================================
// Endpoint: GET /api/intelligence
//
// Aggregates live data from multiple free sources:
//   1. CoinGecko — crypto prices, market cap, 24h change
//   2. CryptoPanic — crypto news with sentiment labels
//   3. Polymarket — prediction market odds (via Gamma API)
//   4. CoinGecko Trending — trending coins
//   5. Fear & Greed Index
//
// Query Parameters:
//   - section: "all" | "prices" | "news" | "predictions" | "trending" | "sentiment"
//   - coins:   comma-separated coin IDs (default: top 20)
//   - limit:   number of news items (default: 30, max: 50)
//
// All data is cached with short TTLs for real-time feel without rate limits.
// =============================================================================

// Inline Claude helper (avoid api/lib/ being treated as serverless function)
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
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

// =============================================================================
// AI Analysis Engine (POST handler)
// =============================================================================

// --- Analysis cache with 5-minute TTL ---
const analysisCache = new Map();
const ANALYSIS_CACHE_TTL = 300_000; // 5 minutes

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return hash.toString(36);
}

function getCachedAnalysis(type, data) {
  const key = `${type}:${simpleHash(JSON.stringify(data))}`;
  const entry = analysisCache.get(key);
  if (entry && (Date.now() - entry.ts) < ANALYSIS_CACHE_TTL) {
    return entry.result;
  }
  analysisCache.delete(key);
  return null;
}

function setCachedAnalysis(type, data, result) {
  const key = `${type}:${simpleHash(JSON.stringify(data))}`;
  analysisCache.set(key, { result, ts: Date.now() });
  // Evict old entries
  if (analysisCache.size > 200) {
    const now = Date.now();
    for (const [k, v] of analysisCache) {
      if (now - v.ts > ANALYSIS_CACHE_TTL) analysisCache.delete(k);
    }
  }
}

// --- Rate limiter for POST ---
const postRateLimitMap = new Map();
const POST_RATE_LIMIT_WINDOW = 60_000;
const POST_RATE_LIMIT_MAX = 15;

function checkPostRateLimit(ip) {
  const now = Date.now();
  const entry = postRateLimitMap.get(ip);
  if (!entry || now - entry.start > POST_RATE_LIMIT_WINDOW) {
    postRateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= POST_RATE_LIMIT_MAX;
}

// Clean stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of postRateLimitMap) {
    if (now - entry.start > POST_RATE_LIMIT_WINDOW * 2) postRateLimitMap.delete(ip);
  }
}, 300_000);

// --- System prompts by analysis type ---
const SYSTEM_PROMPTS = {
  lead_analysis: "You are GOATED's B2B intelligence engine. Analyze this lead data and provide: close probability, best approach, revenue opportunity, risk factors, and a step-by-step closing strategy.",
  market_intel: "You are GOATED's market intelligence AI. Analyze market data and provide: trend direction, key signals, tradeable opportunities, risk assessment, and correlation with prediction markets.",
  sentiment: "You are GOATED's global sentiment analyzer. Process this consumer behavior and social data to provide: sentiment scores by region, trending topics, behavioral shifts, and actionable insights for traders and B2B closers.",
  revenue_report: "You are GOATED's revenue intelligence engine. Analyze this business data and quantify: lost revenue, deficit categories, recovery potential, and specific recommendations to fix each deficit.",
  consumer_behavior: "You are GOATED's consumer intelligence AI. Analyze behavioral patterns, purchasing trends, and market dynamics to provide: consumer sentiment index, spending predictions, and market opportunities.",
};

const VALID_TYPES = Object.keys(SYSTEM_PROMPTS);

// --- Deterministic mock analysis fallback ---
function generateMockAnalysis(type, data) {
  const dataStr = JSON.stringify(data || {});
  const seed = simpleHash(dataStr);
  const seedNum = Math.abs(parseInt(seed, 36)) || 42;
  const confidence = 0.7 + (seedNum % 20) / 100; // 0.70 - 0.89

  const mocksByType = {
    lead_analysis: {
      analysis: `**Lead Analysis Report**\n\n**Close Probability:** ${(confidence * 100).toFixed(0)}%\n\n**Best Approach:** ${data?.company ? `For ${data.company}, ` : ''}a consultative sales approach focusing on ROI demonstration is recommended. Lead with pain point validation, then transition to a value-based proposal.\n\n**Revenue Opportunity:** ${data?.dealValue ? `$${Number(data.dealValue).toLocaleString()}` : '$50,000 - $150,000'} estimated deal value with ${data?.industry ? data.industry : 'this sector'} benchmarks suggesting 15-25% expansion potential within 6 months.\n\n**Risk Factors:**\n- Budget cycle timing — verify fiscal year alignment\n- Competitive alternatives may be under evaluation\n- Decision-maker access needs validation\n\n**Closing Strategy:**\n1. Conduct discovery call focused on quantifying current pain\n2. Deliver customized ROI analysis within 48 hours\n3. Schedule technical demo with key stakeholders\n4. Present proposal with 3-tier pricing\n5. Create urgency with limited-time pilot program`,
      signals: ['High engagement score', 'Recent funding round', 'Tech stack alignment', 'Active hiring in target department'],
      recommendations: ['Schedule discovery call within 48 hours', 'Prepare ROI calculator with industry benchmarks', 'Identify and map 3+ stakeholders', 'Draft personalized outreach sequence'],
    },
    market_intel: {
      analysis: `**Market Intelligence Brief**\n\n**Trend Direction:** ${seedNum % 2 === 0 ? 'Bullish' : 'Cautiously Bullish'} with moderate momentum\n\n**Key Signals:**\n- Volume patterns indicate accumulation phase\n- Social sentiment trending ${seedNum % 3 === 0 ? 'positive' : 'neutral-to-positive'} across major platforms\n- Institutional flow data shows net inflows\n\n**Tradeable Opportunities:**\n- Mean reversion plays on oversold assets\n- Momentum continuation on leaders\n- Spread compression between correlated markets\n\n**Risk Assessment:** Moderate. Macro headwinds persist but sector-specific catalysts provide upside potential.\n\n**Prediction Market Correlation:** Current odds align with a ${confidence > 0.8 ? 'strong' : 'moderate'} continuation of the prevailing trend.`,
      signals: ['Volume spike detected', 'Sentiment divergence', 'Institutional accumulation', 'Correlation breakdown'],
      recommendations: ['Monitor key support levels', 'Scale into positions gradually', 'Set stop-losses at -8% from entry', 'Review prediction market odds for confirmation'],
    },
    sentiment: {
      analysis: `**Global Sentiment Analysis**\n\n**Overall Sentiment Score:** ${(seedNum % 30 + 55)}/100 (${seedNum % 30 + 55 > 65 ? 'Positive' : 'Neutral'})\n\n**Regional Breakdown:**\n- North America: ${seedNum % 20 + 60}/100 — Consumer confidence stable\n- Europe: ${seedNum % 15 + 50}/100 — Mixed signals from economic data\n- Asia-Pacific: ${seedNum % 25 + 55}/100 — Growth momentum accelerating\n\n**Trending Topics:**\n- AI/automation adoption acceleration\n- Supply chain reshoring\n- Sustainability-driven purchasing\n\n**Behavioral Shifts:**\n- B2B buyers increasingly self-serve before engaging sales\n- Decision cycles compressing for sub-$50K deals\n- Social proof and peer reviews gaining influence\n\n**Actionable Insights:** Focus outreach on companies showing digital transformation intent signals. Sentiment data suggests receptivity to efficiency-focused value propositions.`,
      signals: ['Consumer confidence rising', 'Social media sentiment positive', 'B2B buying intent up 12%', 'Regional divergence in EMEA'],
      recommendations: ['Target high-sentiment regions first', 'Adjust messaging to match behavioral shifts', 'Monitor weekly sentiment deltas', 'Cross-reference with prediction markets'],
    },
    revenue_report: {
      analysis: `**Revenue Intelligence Report**\n\n**Total Revenue Gap:** ${data?.revenue ? `$${(Number(data.revenue) * 0.15).toLocaleString()} (15% below target)` : '$125,000 identified deficit'}\n\n**Deficit Categories:**\n1. **Pipeline Leakage** — ${(seedNum % 10 + 25)}% of qualified leads dropping at proposal stage\n2. **Cycle Elongation** — Average close time extended by ${seedNum % 8 + 5} days\n3. **Churn Impact** — ${(seedNum % 5 + 3)}% monthly churn eroding MRR base\n4. **Pricing Gaps** — Under-monetization of ${seedNum % 3 + 2} key segments\n\n**Recovery Potential:** ${data?.revenue ? `$${(Number(data.revenue) * 0.12).toLocaleString()}` : '$95,000'} recoverable within 90 days\n\n**Recommendations:**\n1. Implement stage-gate reviews to reduce pipeline leakage by 40%\n2. Deploy automated follow-up sequences to compress deal cycles\n3. Launch retention campaign targeting at-risk accounts\n4. A/B test pricing tiers for underperforming segments`,
      signals: ['Pipeline velocity declining', 'Win rate compression', 'Churn rate above benchmark', 'Expansion revenue stagnant'],
      recommendations: ['Audit pipeline stage conversion rates', 'Implement deal acceleration playbook', 'Launch proactive retention program', 'Review and optimize pricing strategy'],
    },
    consumer_behavior: {
      analysis: `**Consumer Intelligence Report**\n\n**Consumer Sentiment Index:** ${seedNum % 25 + 60}/100\n\n**Spending Predictions:**\n- Discretionary spending: ${seedNum % 2 === 0 ? 'Stable' : 'Slight uptick'} next quarter\n- B2B SaaS budgets: Growing ${seedNum % 8 + 5}% YoY\n- Enterprise deals: Consolidation trend — fewer vendors, larger contracts\n\n**Behavioral Patterns:**\n- Mobile-first research increasing ${seedNum % 10 + 15}% YoY\n- Average evaluation period: ${seedNum % 15 + 20} days\n- Peer referral influence: ${seedNum % 20 + 35}% of purchase decisions\n\n**Market Opportunities:**\n- Underserved mid-market segment showing 2x growth rate\n- Cross-sell potential in existing accounts averaging 30%+ of current ACV\n- New vertical entry points identified in ${seedNum % 3 + 2} adjacent markets\n\n**Key Takeaway:** Consumer behavior data indicates a window of opportunity for aggressive market capture, particularly in segments showing positive sentiment momentum.`,
      signals: ['Spending intent rising', 'Mobile engagement up', 'Referral-driven growth accelerating', 'Mid-market opportunity expanding'],
      recommendations: ['Prioritize mid-market segment expansion', 'Invest in referral program infrastructure', 'Optimize mobile experience for buyers', 'Launch cross-sell campaign for existing accounts'],
    },
  };

  const mock = mocksByType[type] || mocksByType.lead_analysis;

  return {
    analysis: mock.analysis,
    confidence: Math.round(confidence * 100) / 100,
    signals: mock.signals,
    recommendations: mock.recommendations,
    metadata: {
      model: 'mock-fallback',
      timestamp: new Date().toISOString(),
      cached: false,
    },
  };
}

// --- POST handler for AI analysis ---
async function handleAnalysisPost(req, res) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkPostRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  const { type, data, query } = req.body || {};

  // Validate type
  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({
      error: `Invalid analysis type. Must be one of: ${VALID_TYPES.join(', ')}`,
    });
  }

  // Validate data
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Data object is required.' });
  }

  // Check data size (prevent abuse)
  const dataStr = JSON.stringify(data);
  if (dataStr.length > 50_000) {
    return res.status(400).json({ error: 'Data payload too large (max 50KB).' });
  }

  // Check cache
  const cached = getCachedAnalysis(type, data);
  if (cached) {
    return res.status(200).json({ ...cached, metadata: { ...cached.metadata, cached: true } });
  }

  // Try Claude API
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const mock = generateMockAnalysis(type, data);
    setCachedAnalysis(type, data, mock);
    return res.status(200).json(mock);
  }

  try {
    const systemPrompt = SYSTEM_PROMPTS[type] + `\n\nRespond with structured analysis. Be specific, data-driven, and actionable. Reference specific numbers from the provided data. Format with **bold** for key metrics and clear section headers.`;

    let userMessage = `Analyze the following ${type.replace('_', ' ')} data:\n\n\`\`\`json\n${dataStr}\n\`\`\``;
    if (query) {
      userMessage += `\n\nAdditional context/query: ${query}`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Intelligence] Claude API error:', errText);
      // Fallback to mock
      const mock = generateMockAnalysis(type, data);
      setCachedAnalysis(type, data, mock);
      return res.status(200).json(mock);
    }

    const aiData = await response.json();
    const analysisText = aiData.content?.[0]?.text || '';

    // Extract signals and recommendations from the AI response
    const signals = extractBulletPoints(analysisText, ['signal', 'key signal', 'indicator', 'key finding']);
    const recommendations = extractBulletPoints(analysisText, ['recommend', 'action', 'next step', 'suggestion']);

    const result = {
      analysis: analysisText,
      confidence: computeConfidence(type, data, analysisText),
      signals: signals.length > 0 ? signals : getDefaultSignals(type),
      recommendations: recommendations.length > 0 ? recommendations : getDefaultRecommendations(type),
      metadata: {
        model: 'claude-sonnet',
        timestamp: new Date().toISOString(),
        cached: false,
      },
    };

    setCachedAnalysis(type, data, result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Intelligence] Analysis error:', error);
    const mock = generateMockAnalysis(type, data);
    setCachedAnalysis(type, data, mock);
    return res.status(200).json(mock);
  }
}

// --- Helper: extract bullet points near section headers ---
function extractBulletPoints(text, keywords) {
  const lines = text.split('\n');
  const results = [];
  let capturing = false;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (keywords.some(kw => lower.includes(kw)) && (lower.includes('**') || lower.includes('#') || lower.includes(':'))) {
      capturing = true;
      continue;
    }
    if (capturing) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+[\.\)]\s/.test(trimmed)) {
        const clean = trimmed.replace(/^[-*\d.\)]+\s*/, '').replace(/\*\*/g, '').trim();
        if (clean.length > 5 && clean.length < 200) {
          results.push(clean);
        }
      } else if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('**')) {
        capturing = false;
      }
    }
    if (results.length >= 6) break;
  }
  return results.slice(0, 4);
}

// --- Helper: compute confidence from data richness ---
function computeConfidence(type, data, analysisText) {
  let score = 0.75;
  const keys = Object.keys(data || {});
  if (keys.length > 5) score += 0.05;
  if (keys.length > 10) score += 0.05;
  if (analysisText.length > 500) score += 0.03;
  if (analysisText.length > 1000) score += 0.02;
  return Math.min(0.95, Math.round(score * 100) / 100);
}

// --- Default signals/recommendations when AI doesn't provide structured ones ---
function getDefaultSignals(type) {
  const defaults = {
    lead_analysis: ['Engagement pattern detected', 'Budget cycle alignment', 'Competitive landscape shift', 'Decision-maker accessibility'],
    market_intel: ['Volume anomaly detected', 'Sentiment shift identified', 'Institutional flow change', 'Correlation pattern emerging'],
    sentiment: ['Regional sentiment divergence', 'Trend momentum shift', 'Behavioral pattern change', 'Social signal amplification'],
    revenue_report: ['Pipeline velocity change', 'Conversion rate anomaly', 'Revenue concentration risk', 'Growth rate deviation'],
    consumer_behavior: ['Spending pattern shift', 'Channel preference change', 'Decision cycle compression', 'Peer influence increase'],
  };
  return defaults[type] || defaults.lead_analysis;
}

function getDefaultRecommendations(type) {
  const defaults = {
    lead_analysis: ['Prioritize high-intent leads', 'Personalize outreach cadence', 'Map stakeholder network', 'Prepare value-based proposal'],
    market_intel: ['Monitor key levels', 'Diversify position sizing', 'Track prediction market odds', 'Set automated alerts'],
    sentiment: ['Align messaging with sentiment trends', 'Target high-sentiment regions', 'Monitor weekly deltas', 'Cross-reference data sources'],
    revenue_report: ['Audit conversion funnel', 'Implement stage-gate reviews', 'Launch retention campaign', 'Optimize pricing strategy'],
    consumer_behavior: ['Invest in top-performing channels', 'Optimize for mobile buyers', 'Launch referral program', 'Expand into adjacent segments'],
  };
  return defaults[type] || defaults.lead_analysis;
}

// --- In-memory caches with TTL ---
const cache = {
  prices: { data: null, ts: 0, ttl: 30_000 },       // 30s
  news: { data: null, ts: 0, ttl: 60_000 },          // 60s
  predictions: { data: null, ts: 0, ttl: 120_000 },  // 2min
  trending: { data: null, ts: 0, ttl: 300_000 },     // 5min
  fearGreed: { data: null, ts: 0, ttl: 600_000 },    // 10min
};

function isFresh(key) {
  return cache[key].data && (Date.now() - cache[key].ts) < cache[key].ttl;
}

// Default coins to track
const DEFAULT_COINS = 'bitcoin,ethereum,solana,binancecoin,cardano,polkadot,avalanche-2,polygon,chainlink,uniswap,dogecoin,shiba-inu,pepe,sui,aptos,arbitrum,optimism,celestia,injective,render-token';

// --- Fetch crypto prices from CoinGecko ---
async function fetchPrices(coinIds) {
  if (isFresh('prices')) return cache.prices.data;
  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=50&sparkline=true&price_change_percentage=1h,24h,7d`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();
    const prices = data.map(c => ({
      id: c.id,
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      price: c.current_price,
      marketCap: c.market_cap,
      volume24h: c.total_volume,
      change1h: c.price_change_percentage_1h_in_currency,
      change24h: c.price_change_percentage_24h,
      change7d: c.price_change_percentage_7d_in_currency,
      high24h: c.high_24h,
      low24h: c.low_24h,
      ath: c.ath,
      athChangePercent: c.ath_change_percentage,
      sparkline7d: c.sparkline_in_7d?.price?.slice(-48) || [], // Last 48 data points (~2 days)
      image: c.image,
      rank: c.market_cap_rank,
      lastUpdated: c.last_updated,
    }));
    cache.prices = { data: prices, ts: Date.now(), ttl: cache.prices.ttl };
    return prices;
  } catch (err) {
    console.error('[Intelligence] Prices fetch failed:', err.message);
    return cache.prices.data || [];
  }
}

// --- Fetch news from CryptoPanic (free, no key needed for basic) ---
async function fetchNews(limit = 30) {
  if (isFresh('news')) return cache.news.data;
  try {
    // CryptoPanic public API (no auth for basic access)
    const url = `https://cryptopanic.com/api/free/v1/posts/?auth_token=&public=true&kind=news&filter=important&regions=en`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    let articles = [];

    if (res.ok) {
      const data = await res.json();
      articles = (data.results || []).slice(0, limit).map(a => ({
        id: a.id,
        title: a.title,
        url: a.url,
        source: a.source?.title || a.domain || 'Unknown',
        publishedAt: a.published_at || a.created_at,
        sentiment: a.votes ? (
          a.votes.positive > a.votes.negative ? 'bullish' :
          a.votes.negative > a.votes.positive ? 'bearish' : 'neutral'
        ) : 'neutral',
        votes: a.votes || {},
        currencies: (a.currencies || []).map(c => ({
          code: c.code,
          title: c.title,
          slug: c.slug,
        })),
        kind: a.kind || 'news',
      }));
    }

    // Fallback: if CryptoPanic is blocked, use CoinGecko status updates
    if (articles.length === 0) {
      const fallbackUrl = 'https://api.coingecko.com/api/v3/status_updates?per_page=30';
      const fbRes = await fetch(fallbackUrl);
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        articles = (fbData.status_updates || []).slice(0, limit).map((u, i) => ({
          id: `cg-${i}`,
          title: u.description?.slice(0, 200) || 'Market Update',
          url: u.project?.links?.homepage?.[0] || '#',
          source: u.project?.name || 'CoinGecko',
          publishedAt: u.created_at,
          sentiment: 'neutral',
          votes: {},
          currencies: u.project?.symbol ? [{ code: u.project.symbol, title: u.project.name }] : [],
          kind: 'update',
        }));
      }
    }

    // Final fallback: generate from real market conditions
    if (articles.length === 0) {
      articles = generateNewsFromPrices();
    }

    cache.news = { data: articles, ts: Date.now(), ttl: cache.news.ttl };
    return articles;
  } catch (err) {
    console.error('[Intelligence] News fetch failed:', err.message);
    if (cache.news.data) return cache.news.data;
    return generateNewsFromPrices();
  }
}

// Generate news headlines from actual price data
function generateNewsFromPrices() {
  const now = new Date().toISOString();
  const prices = cache.prices.data || [];
  if (prices.length === 0) return [];

  return prices.slice(0, 15).map((coin, i) => {
    const direction = coin.change24h > 0 ? 'surges' : coin.change24h < -5 ? 'crashes' : 'dips';
    const pct = Math.abs(coin.change24h || 0).toFixed(1);
    return {
      id: `gen-${i}`,
      title: `${coin.name} (${coin.symbol}) ${direction} ${pct}% in 24h — Now at $${coin.price?.toLocaleString()}`,
      url: `https://www.coingecko.com/en/coins/${coin.id}`,
      source: 'GOATED Intelligence',
      publishedAt: now,
      sentiment: coin.change24h > 2 ? 'bullish' : coin.change24h < -2 ? 'bearish' : 'neutral',
      votes: {},
      currencies: [{ code: coin.symbol, title: coin.name }],
      kind: 'analysis',
    };
  });
}

// --- Fetch Polymarket prediction markets ---
async function fetchPredictions() {
  if (isFresh('predictions')) return cache.predictions.data;
  try {
    // Polymarket Gamma API - public, no auth needed
    const url = 'https://gamma-api.polymarket.com/markets?limit=30&active=true&closed=false&order=volume&ascending=false';
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`Polymarket ${res.status}`);
    const data = await res.json();
    const markets = (Array.isArray(data) ? data : []).map(m => ({
      id: m.id || m.conditionId,
      question: m.question,
      description: m.description?.slice(0, 200),
      outcomes: m.outcomes || ['Yes', 'No'],
      outcomePrices: m.outcomePrices ? JSON.parse(m.outcomePrices) : [],
      volume: parseFloat(m.volume || 0),
      liquidity: parseFloat(m.liquidity || 0),
      endDate: m.endDate,
      category: m.groupItemTitle || m.category || 'General',
      image: m.image,
      active: m.active,
      slug: m.slug,
      // Calculate implied probability from prices
      yesPrice: m.outcomePrices ? parseFloat(JSON.parse(m.outcomePrices)[0] || 0) : null,
      noPrice: m.outcomePrices ? parseFloat(JSON.parse(m.outcomePrices)[1] || 0) : null,
    }));
    cache.predictions = { data: markets, ts: Date.now(), ttl: cache.predictions.ttl };
    return markets;
  } catch (err) {
    console.error('[Intelligence] Polymarket fetch failed:', err.message);
    return cache.predictions.data || [];
  }
}

// --- Fetch trending coins from CoinGecko ---
async function fetchTrending() {
  if (isFresh('trending')) return cache.trending.data;
  try {
    const url = 'https://api.coingecko.com/api/v3/search/trending';
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`CoinGecko trending ${res.status}`);
    const data = await res.json();
    const trending = (data.coins || []).map(c => ({
      id: c.item.id,
      symbol: c.item.symbol,
      name: c.item.name,
      rank: c.item.market_cap_rank,
      thumb: c.item.thumb,
      score: c.item.score,
      priceBtc: c.item.price_btc,
      data: c.item.data ? {
        price: c.item.data.price,
        priceChange24h: c.item.data.price_change_percentage_24h?.usd,
        marketCap: c.item.data.market_cap,
        volume: c.item.data.total_volume,
        sparkline: c.item.data.sparkline,
      } : null,
    }));
    cache.trending = { data: trending, ts: Date.now(), ttl: cache.trending.ttl };
    return trending;
  } catch (err) {
    console.error('[Intelligence] Trending fetch failed:', err.message);
    return cache.trending.data || [];
  }
}

// --- Fetch Fear & Greed Index ---
async function fetchFearGreed() {
  if (isFresh('fearGreed')) return cache.fearGreed.data;
  try {
    const url = 'https://api.alternative.me/fng/?limit=30';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fear&Greed ${res.status}`);
    const data = await res.json();
    const result = {
      current: data.data?.[0] ? {
        value: parseInt(data.data[0].value),
        label: data.data[0].value_classification,
        timestamp: data.data[0].timestamp,
      } : null,
      history: (data.data || []).map(d => ({
        value: parseInt(d.value),
        label: d.value_classification,
        timestamp: d.timestamp,
      })),
    };
    cache.fearGreed = { data: result, ts: Date.now(), ttl: cache.fearGreed.ttl };
    return result;
  } catch (err) {
    console.error('[Intelligence] Fear&Greed fetch failed:', err.message);
    return cache.fearGreed.data || { current: null, history: [] };
  }
}

// --- Compute aggregate sentiment ---
function computeSentiment(prices, news, fearGreed) {
  // Price-based sentiment
  const avgChange24h = prices.length > 0
    ? prices.reduce((s, p) => s + (p.change24h || 0), 0) / prices.length
    : 0;

  // News-based sentiment
  const bullishNews = news.filter(n => n.sentiment === 'bullish').length;
  const bearishNews = news.filter(n => n.sentiment === 'bearish').length;
  const totalNews = news.length || 1;
  const newsSentimentScore = ((bullishNews - bearishNews) / totalNews) * 50 + 50; // 0-100

  // Fear & Greed
  const fgScore = fearGreed?.current?.value || 50;

  // Composite score (weighted average)
  const compositeScore = Math.round(
    (avgChange24h > 0 ? Math.min(avgChange24h * 10 + 50, 90) : Math.max(avgChange24h * 10 + 50, 10)) * 0.3 +
    newsSentimentScore * 0.3 +
    fgScore * 0.4
  );

  return {
    composite: Math.max(1, Math.min(99, compositeScore)),
    label: compositeScore >= 75 ? 'Extreme Greed' :
           compositeScore >= 60 ? 'Greed' :
           compositeScore >= 45 ? 'Neutral' :
           compositeScore >= 25 ? 'Fear' : 'Extreme Fear',
    components: {
      priceAction: { score: Math.round(avgChange24h * 10 + 50), avgChange24h },
      newsSentiment: { score: Math.round(newsSentimentScore), bullish: bullishNews, bearish: bearishNews, neutral: totalNews - bullishNews - bearishNews },
      fearGreed: { score: fgScore, label: fearGreed?.current?.label || 'Unknown' },
    },
    totalDataPoints: prices.length + news.length,
    lastUpdated: new Date().toISOString(),
  };
}

// --- Main handler ---
export default async function handler(req, res) {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  // POST: AI analysis engine
  if (req.method === 'POST') {
    return handleAnalysisPost(req, res);
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Cache for CDN
  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');

  const {
    section = 'all',
    coins = DEFAULT_COINS,
    limit: rawLimit = '30',
  } = req.query;

  const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 30, 1), 50);

  try {
    const result = {};

    // Fetch requested sections in parallel
    const sections = section === 'all'
      ? ['prices', 'news', 'predictions', 'trending', 'sentiment']
      : [section];

    const promises = [];

    if (sections.includes('prices') || sections.includes('sentiment')) {
      promises.push(fetchPrices(coins).then(d => { result.prices = d; }));
    }
    if (sections.includes('news') || sections.includes('sentiment')) {
      promises.push(fetchNews(limit).then(d => { result.news = d; }));
    }
    if (sections.includes('predictions')) {
      promises.push(fetchPredictions().then(d => { result.predictions = d; }));
    }
    if (sections.includes('trending')) {
      promises.push(fetchTrending().then(d => { result.trending = d; }));
    }
    if (sections.includes('sentiment')) {
      promises.push(fetchFearGreed().then(d => { result.fearGreed = d; }));
    }

    await Promise.all(promises);

    // Compute aggregate sentiment if requested
    if (sections.includes('sentiment')) {
      result.sentiment = computeSentiment(
        result.prices || [],
        result.news || [],
        result.fearGreed,
      );
    }

    // Generate AI market intelligence brief from raw data
    let aiBrief = null;
    if (section === 'all') {
      try {
        const briefData = {
          topCoins: (result.prices || []).slice(0, 5).map(c => ({ symbol: c.symbol, price: c.price, change24h: c.change24h })),
          sentiment: result.sentiment ? { composite: result.sentiment.composite, label: result.sentiment.label } : null,
          fearGreed: result.fearGreed?.current || null,
          newsCount: (result.news || []).length,
          topHeadlines: (result.news || []).slice(0, 3).map(n => n.title),
          trendingCount: (result.trending || []).length,
          predictionMarkets: (result.predictions || []).slice(0, 3).map(p => ({ question: p.question, yesPrice: p.yesPrice })),
        };
        const briefText = await callClaude(
          'You are GOATED\'s market intelligence AI. Respond ONLY with valid JSON, no markdown fences.',
          `Generate a concise market intelligence brief from this data. Return JSON:
{
  "headline": "1-sentence market headline",
  "brief": "3-4 sentence executive summary covering market conditions, key movers, and outlook",
  "riskLevel": "low|moderate|elevated|high",
  "topOpportunity": "1 sentence on the best opportunity right now",
  "watchList": ["SYMBOL1", "SYMBOL2", "SYMBOL3"]
}

Market Data:\n${JSON.stringify(briefData)}`,
          500
        );
        if (briefText) {
          const clean = briefText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
          aiBrief = JSON.parse(clean);
        }
      } catch (e) {
        console.warn('[Intelligence] AI brief generation failed:', e.message);
      }
    }

    return res.status(200).json({
      ...result,
      aiBrief,
      _meta: {
        generatedAt: new Date().toISOString(),
        sections: sections,
        cached: {
          prices: isFresh('prices'),
          news: isFresh('news'),
          predictions: isFresh('predictions'),
          trending: isFresh('trending'),
          fearGreed: isFresh('fearGreed'),
        },
      },
    });
  } catch (error) {
    console.error('[Intelligence] Fatal error:', error);
    return res.status(500).json({
      error: 'Intelligence aggregation failed',
      message: process.env.NODE_ENV === 'production' ? 'Temporary data disruption' : error.message,
    });
  }
}
