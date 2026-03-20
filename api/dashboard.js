// =============================================================================
// GOATED Solutions - Dashboard Aggregation API
// =============================================================================
// Endpoint: GET /api/dashboard
//
// Fetches REAL data from multiple free APIs in parallel and returns a single
// aggregated payload to power the Dashboard page.
//
// Data Sources (all free, no API key required):
//   1. CoinGecko /api/v3/global           - total market cap, volume, BTC dominance
//   2. CoinGecko /api/v3/coins/markets     - top 10 coins by market cap
//   3. Alternative.me /fng/?limit=1        - Fear & Greed index
//   4. CoinGecko /api/v3/search/trending   - trending coins
//
// Features:
//   - 30-second in-memory cache to respect rate limits
//   - Parallel fetching with individual timeouts
//   - Graceful degradation: if one source fails, the rest still return
//   - Computed signals (bullish/bearish based on >5% daily change)
//   - Top movers (biggest gainers and losers)
//   - Volume analysis
//   - API latency tracking
// =============================================================================

// ---------------------------------------------------------------------------
// CORS helpers -- mirrors the pattern used across all GOATED API endpoints
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  process.env.CORS_ORIGIN || 'https://goated.solutions',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

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

// ---------------------------------------------------------------------------
// In-memory cache -- 30 second TTL
// ---------------------------------------------------------------------------
let cachedResponse = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30 * 1000;

// ---------------------------------------------------------------------------
// Individual data fetchers -- each returns null on failure instead of throwing
// ---------------------------------------------------------------------------

async function fetchGlobalData() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/global', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`CoinGecko global returned ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('[dashboard] CoinGecko global failed:', err.message);
    return null;
  }
}

async function fetchTopCoins() {
  try {
    const url =
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&price_change_percentage=24h';
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`CoinGecko markets returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[dashboard] CoinGecko markets failed:', err.message);
    return null;
  }
}

async function fetchFearGreed() {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Fear & Greed API returned ${res.status}`);
    const json = await res.json();
    return json.data?.[0] || null;
  } catch (err) {
    console.warn('[dashboard] Fear & Greed failed:', err.message);
    return null;
  }
}

async function fetchTrending() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/search/trending', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`CoinGecko trending returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[dashboard] CoinGecko trending failed:', err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
function formatLargeNumber(n) {
  if (n == null || isNaN(n)) return '$0';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(2)}`;
}

function round2(n) {
  return Math.round((n || 0) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Build the market overview section from CoinGecko /global data
// ---------------------------------------------------------------------------
function buildMarketOverview(globalData) {
  if (!globalData) {
    return {
      totalMarketCap: 0,
      totalMarketCapFormatted: '$0',
      totalVolume: 0,
      totalVolumeFormatted: '$0',
      btcDominance: 0,
      marketCapChange24h: 0,
      activeCryptos: 0,
    };
  }

  const totalMarketCap = globalData.total_market_cap?.usd || 0;
  const totalVolume = globalData.total_volume?.usd || 0;
  const btcDominance = round2(globalData.market_cap_percentage?.btc || 0);
  const marketCapChange24h = round2(globalData.market_cap_change_percentage_24h_usd || 0);
  const activeCryptos = globalData.active_cryptocurrencies || 0;

  return {
    totalMarketCap,
    totalMarketCapFormatted: formatLargeNumber(totalMarketCap),
    totalVolume,
    totalVolumeFormatted: formatLargeNumber(totalVolume),
    btcDominance,
    marketCapChange24h,
    activeCryptos,
  };
}

// ---------------------------------------------------------------------------
// Build the Fear & Greed section
// ---------------------------------------------------------------------------
function buildFearGreed(fngData) {
  if (!fngData) {
    return { value: 50, label: 'Neutral' };
  }
  return {
    value: parseInt(fngData.value, 10) || 50,
    label: fngData.value_classification || 'Neutral',
  };
}

// ---------------------------------------------------------------------------
// Build the top coins array from CoinGecko /coins/markets data
// ---------------------------------------------------------------------------
function buildTopCoins(marketsData) {
  if (!marketsData || !Array.isArray(marketsData)) return [];

  return marketsData.map((coin) => ({
    name: coin.name,
    symbol: (coin.symbol || '').toUpperCase(),
    price: coin.current_price || 0,
    priceFormatted: formatPrice(coin.current_price),
    change24h: round2(coin.price_change_percentage_24h || 0),
    volume: coin.total_volume || 0,
    volumeFormatted: formatLargeNumber(coin.total_volume),
    marketCap: coin.market_cap || 0,
    marketCapFormatted: formatLargeNumber(coin.market_cap),
    image: coin.image || '',
    rank: coin.market_cap_rank || 0,
    high24h: coin.high_24h || 0,
    low24h: coin.low_24h || 0,
  }));
}

function formatPrice(n) {
  if (n == null) return '$0';
  if (n >= 1) return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 0.01) return '$' + n.toFixed(4);
  return '$' + n.toFixed(8);
}

// ---------------------------------------------------------------------------
// Build the trending coins array from CoinGecko /search/trending
// ---------------------------------------------------------------------------
function buildTrending(trendingData) {
  if (!trendingData?.coins) return [];

  return trendingData.coins.slice(0, 7).map((entry, index) => {
    const item = entry.item || {};
    return {
      name: item.name || 'Unknown',
      symbol: (item.symbol || '').toUpperCase(),
      rank: index + 1,
      marketCapRank: item.market_cap_rank || null,
      thumb: item.thumb || item.small || '',
      score: item.score || 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Compute signals: count coins with >5% daily move as active signals
// ---------------------------------------------------------------------------
function buildSignals(marketsData) {
  if (!marketsData || !Array.isArray(marketsData) || marketsData.length === 0) {
    return {
      bullish: 0,
      bearish: 0,
      total: 0,
      topSignal: 'No data available',
    };
  }

  const SIGNAL_THRESHOLD = 5; // percent

  let bullish = 0;
  let bearish = 0;
  let topGainer = null;
  let topLoser = null;

  for (const coin of marketsData) {
    const change = coin.price_change_percentage_24h || 0;

    if (change >= SIGNAL_THRESHOLD) {
      bullish++;
      if (!topGainer || change > topGainer.change) {
        topGainer = { name: coin.name, symbol: (coin.symbol || '').toUpperCase(), change };
      }
    }

    if (change <= -SIGNAL_THRESHOLD) {
      bearish++;
      if (!topLoser || change < topLoser.change) {
        topLoser = { name: coin.name, symbol: (coin.symbol || '').toUpperCase(), change };
      }
    }
  }

  const total = bullish + bearish;

  // Determine the headline signal
  let topSignal = 'Market is calm -- no strong signals';
  if (topGainer && (!topLoser || topGainer.change >= Math.abs(topLoser.change))) {
    topSignal = `${topGainer.symbol} surging +${topGainer.change.toFixed(1)}% in 24h`;
  } else if (topLoser) {
    topSignal = `${topLoser.symbol} dropping ${topLoser.change.toFixed(1)}% in 24h`;
  }

  return {
    bullish,
    bearish,
    total,
    topSignal,
    topGainer: topGainer
      ? { symbol: topGainer.symbol, name: topGainer.name, change: round2(topGainer.change) }
      : null,
    topLoser: topLoser
      ? { symbol: topLoser.symbol, name: topLoser.name, change: round2(topLoser.change) }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Build top movers and volume analysis from market data
// ---------------------------------------------------------------------------
function buildTopMovers(marketsData) {
  if (!marketsData || !Array.isArray(marketsData) || marketsData.length === 0) {
    return { gainers: [], losers: [] };
  }

  const sorted = [...marketsData].sort(
    (a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
  );

  const mapMover = (coin) => ({
    name: coin.name,
    symbol: (coin.symbol || '').toUpperCase(),
    change24h: round2(coin.price_change_percentage_24h || 0),
    price: coin.current_price || 0,
    priceFormatted: formatPrice(coin.current_price),
    image: coin.image || '',
  });

  return {
    gainers: sorted.slice(0, 3).map(mapMover),
    losers: sorted.slice(-3).reverse().map(mapMover),
  };
}

function buildVolumeAnalysis(marketsData) {
  if (!marketsData || !Array.isArray(marketsData) || marketsData.length === 0) {
    return { totalVolume: 0, avgVolume: 0, highestVolume: null };
  }

  const totalVolume = marketsData.reduce((sum, c) => sum + (c.total_volume || 0), 0);
  const avgVolume = totalVolume / marketsData.length;

  const highestVolCoin = [...marketsData].sort(
    (a, b) => (b.total_volume || 0) - (a.total_volume || 0)
  )[0];

  return {
    totalVolume,
    totalVolumeFormatted: formatLargeNumber(totalVolume),
    avgVolume: Math.round(avgVolume),
    avgVolumeFormatted: formatLargeNumber(avgVolume),
    highestVolume: highestVolCoin
      ? {
          name: highestVolCoin.name,
          symbol: (highestVolCoin.symbol || '').toUpperCase(),
          volume: highestVolCoin.total_volume || 0,
          volumeFormatted: formatLargeNumber(highestVolCoin.total_volume),
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  // -- CORS --
  const corsHeaders = getCorsHeaders(req);
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    const startTime = Date.now();

    // -- Return cached response if still fresh (30s TTL) --
    if (cachedResponse && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      return res.status(200).json({
        ...cachedResponse,
        performance: {
          ...cachedResponse.performance,
          cached: true,
          apiLatency: Date.now() - startTime,
        },
      });
    }

    // -- Fetch all four sources in parallel --
    const [globalResult, marketsResult, fngResult, trendingResult] = await Promise.allSettled([
      fetchGlobalData(),
      fetchTopCoins(),
      fetchFearGreed(),
      fetchTrending(),
    ]);

    const globalData = globalResult.status === 'fulfilled' ? globalResult.value : null;
    const marketsData = marketsResult.status === 'fulfilled' ? marketsResult.value : null;
    const fngData = fngResult.status === 'fulfilled' ? fngResult.value : null;
    const trendingData = trendingResult.status === 'fulfilled' ? trendingResult.value : null;

    // Count how many sources returned usable data
    const sourcesQueried = 4;
    const sourcesSucceeded =
      (globalData ? 1 : 0) +
      (marketsData ? 1 : 0) +
      (fngData ? 1 : 0) +
      (trendingData ? 1 : 0);

    const apiLatency = Date.now() - startTime;

    // -- Build the aggregated response --
    const response = {
      timestamp: new Date().toISOString(),

      marketOverview: buildMarketOverview(globalData),

      fearGreed: buildFearGreed(fngData),

      topCoins: buildTopCoins(marketsData),

      trending: buildTrending(trendingData),

      signals: buildSignals(marketsData),

      topMovers: buildTopMovers(marketsData),

      volumeAnalysis: buildVolumeAnalysis(marketsData),

      performance: {
        apiLatency,
        sourcesQueried,
        sourcesSucceeded,
        cached: false,
        sources: {
          global: globalData ? 'live' : 'unavailable',
          markets: marketsData ? 'live' : 'unavailable',
          fearGreed: fngData ? 'live' : 'unavailable',
          trending: trendingData ? 'live' : 'unavailable',
        },
        cacheTTL: `${CACHE_TTL_MS / 1000}s`,
      },
    };

    // -- Cache the response --
    cachedResponse = response;
    cacheTimestamp = Date.now();

    // -- Edge cache header for Vercel CDN --
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');

    return res.status(200).json(response);
  } catch (error) {
    console.error('[dashboard] Unhandled error:', error);

    // If we have stale cache, return it rather than an error
    if (cachedResponse) {
      return res.status(200).json({
        ...cachedResponse,
        performance: {
          ...cachedResponse.performance,
          cached: true,
          stale: true,
          error: 'Serving stale cache due to error',
        },
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
