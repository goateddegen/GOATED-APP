// =============================================================================
// GOATED Solutions - Real-Time Market / Crypto Data API
// =============================================================================
// Endpoint: GET /api/market-data
//
// Query Parameters:
//   - coins:  comma-separated list (default: all 10 tracked coins)
//   - vs:     fiat currency (default: "usd")
//
// Data Source: CoinGecko API (free, no API key required)
//   https://api.coingecko.com/api/v3/simple/price
//
// Features:
//   - Real-time prices from CoinGecko
//   - 30-second in-memory cache
//   - Comprehensive fallback data if rate-limited
//   - 10 coins: BTC, ETH, SOL, BNB, ADA, DOT, AVAX, MATIC, LINK, UNI
//   - Market cap, volume, 24h change
// =============================================================================

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

// ---------------------------------------------------------------------------
// Default coin list
// ---------------------------------------------------------------------------
const DEFAULT_COINS = 'bitcoin,ethereum,solana,binancecoin,cardano,polkadot,avalanche-2,matic-network,chainlink,uniswap';

// ---------------------------------------------------------------------------
// In-memory cache -- 30 second TTL
// ---------------------------------------------------------------------------
let cachedData = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

// ---------------------------------------------------------------------------
// Comprehensive fallback data if CoinGecko is unreachable or rate-limited
// ---------------------------------------------------------------------------
const FALLBACK_DATA = {
  bitcoin: { usd: 97250.00, usd_24h_change: 1.42, usd_24h_vol: 28500000000, usd_market_cap: 1910000000000, last_updated_at: Math.floor(Date.now() / 1000) },
  ethereum: { usd: 3420.00, usd_24h_change: -0.38, usd_24h_vol: 14200000000, usd_market_cap: 411000000000, last_updated_at: Math.floor(Date.now() / 1000) },
  solana: { usd: 192.50, usd_24h_change: 3.15, usd_24h_vol: 3800000000, usd_market_cap: 89400000000, last_updated_at: Math.floor(Date.now() / 1000) },
  binancecoin: { usd: 635.20, usd_24h_change: 0.87, usd_24h_vol: 1900000000, usd_market_cap: 94800000000, last_updated_at: Math.floor(Date.now() / 1000) },
  cardano: { usd: 0.78, usd_24h_change: 2.14, usd_24h_vol: 890000000, usd_market_cap: 27600000000, last_updated_at: Math.floor(Date.now() / 1000) },
  polkadot: { usd: 8.45, usd_24h_change: -1.22, usd_24h_vol: 420000000, usd_market_cap: 12100000000, last_updated_at: Math.floor(Date.now() / 1000) },
  'avalanche-2': { usd: 42.30, usd_24h_change: 4.56, usd_24h_vol: 680000000, usd_market_cap: 16800000000, last_updated_at: Math.floor(Date.now() / 1000) },
  'matic-network': { usd: 0.52, usd_24h_change: -0.91, usd_24h_vol: 310000000, usd_market_cap: 5200000000, last_updated_at: Math.floor(Date.now() / 1000) },
  chainlink: { usd: 18.75, usd_24h_change: 1.67, usd_24h_vol: 560000000, usd_market_cap: 11200000000, last_updated_at: Math.floor(Date.now() / 1000) },
  uniswap: { usd: 12.40, usd_24h_change: -2.33, usd_24h_vol: 280000000, usd_market_cap: 9400000000, last_updated_at: Math.floor(Date.now() / 1000) },
};

// Friendly display names and symbols
const COIN_META = {
  bitcoin: { symbol: 'BTC', name: 'Bitcoin', icon: '₿', color: '#f7931a' },
  ethereum: { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', color: '#627eea' },
  solana: { symbol: 'SOL', name: 'Solana', icon: '◎', color: '#00ffa3' },
  binancecoin: { symbol: 'BNB', name: 'BNB', icon: '◆', color: '#f3ba2f' },
  cardano: { symbol: 'ADA', name: 'Cardano', icon: '₳', color: '#0033ad' },
  polkadot: { symbol: 'DOT', name: 'Polkadot', icon: '●', color: '#e6007a' },
  'avalanche-2': { symbol: 'AVAX', name: 'Avalanche', icon: 'A', color: '#e84142' },
  'matic-network': { symbol: 'MATIC', name: 'Polygon', icon: '⬡', color: '#8247e5' },
  chainlink: { symbol: 'LINK', name: 'Chainlink', icon: '⬡', color: '#2a5ada' },
  uniswap: { symbol: 'UNI', name: 'Uniswap', icon: '🦄', color: '#ff007a' },
  dogecoin: { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð', color: '#c2a633' },
  litecoin: { symbol: 'LTC', name: 'Litecoin', icon: 'Ł', color: '#bfbbbb' },
};

// ---------------------------------------------------------------------------
// Fetch from CoinGecko
// ---------------------------------------------------------------------------
async function fetchCoinGeckoData(coins, vsCurrency) {
  const url = new URL('https://api.coingecko.com/api/v3/simple/price');
  url.searchParams.set('ids', coins);
  url.searchParams.set('vs_currencies', vsCurrency);
  url.searchParams.set('include_24hr_change', 'true');
  url.searchParams.set('include_24hr_vol', 'true');
  url.searchParams.set('include_market_cap', 'true');
  url.searchParams.set('include_last_updated_at', 'true');

  const response = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`CoinGecko API returned ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Format raw CoinGecko data into our response shape
// ---------------------------------------------------------------------------
function formatPriceData(raw, vsCurrency) {
  const formatted = {};

  for (const [coinId, data] of Object.entries(raw)) {
    const meta = COIN_META[coinId] || {
      symbol: coinId.toUpperCase().slice(0, 5),
      name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
      icon: '?',
      color: '#888',
    };

    const price = data[vsCurrency] || 0;
    const change24h = data[`${vsCurrency}_24h_change`] || 0;
    const volume24h = data[`${vsCurrency}_24h_vol`] || 0;
    const marketCap = data[`${vsCurrency}_market_cap`] || 0;
    const lastUpdated = data.last_updated_at
      ? new Date(data.last_updated_at * 1000).toISOString()
      : new Date().toISOString();

    formatted[meta.symbol] = {
      id: coinId,
      symbol: meta.symbol,
      name: meta.name,
      icon: meta.icon,
      color: meta.color,
      price,
      priceFormatted: formatCurrency(price, vsCurrency),
      change24h: parseFloat(change24h.toFixed(2)),
      change24hFormatted: `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`,
      direction: change24h > 0 ? 'up' : change24h < 0 ? 'down' : 'flat',
      volume24h,
      volume24hFormatted: formatLargeNumber(volume24h),
      marketCap,
      marketCapFormatted: formatLargeNumber(marketCap),
      lastUpdated,
    };
  }

  return formatted;
}

function formatCurrency(value, currency = 'usd') {
  const symbols = { usd: '$', eur: '€', gbp: '£', jpy: '¥' };
  const sym = symbols[currency] || '$';
  if (value >= 1000) return `${sym}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value >= 1) return `${sym}${value.toFixed(2)}`;
  return `${sym}${value.toFixed(6)}`;
}

function formatLargeNumber(value) {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    const {
      coins: rawCoins = DEFAULT_COINS,
      vs: vsCurrency = 'usd',
    } = req.query;

    const coins = rawCoins
      .split(',')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 20)
      .join(',');

    const now = Date.now();
    let rawData;
    let fromCache = false;
    let source = 'coingecko';

    // Check cache first (30s TTL)
    if (cachedData && now - cacheTimestamp < CACHE_TTL_MS) {
      rawData = cachedData;
      fromCache = true;
    } else {
      try {
        rawData = await fetchCoinGeckoData(coins, vsCurrency);
        cachedData = rawData;
        cacheTimestamp = now;
      } catch (fetchError) {
        console.warn('CoinGecko fetch failed, using fallback:', fetchError.message);
        if (cachedData) {
          rawData = cachedData;
          fromCache = true;
          source = 'cache-stale';
        } else {
          rawData = FALLBACK_DATA;
          fromCache = true;
          source = 'fallback';
        }
      }
    }

    const prices = formatPriceData(rawData, vsCurrency);

    // Compute market overview stats
    const priceEntries = Object.values(prices);
    const totalMarketCap = priceEntries.reduce((s, p) => s + (p.marketCap || 0), 0);
    const totalVolume = priceEntries.reduce((s, p) => s + (p.volume24h || 0), 0);
    const avgChange = priceEntries.length > 0
      ? parseFloat((priceEntries.reduce((s, p) => s + p.change24h, 0) / priceEntries.length).toFixed(2))
      : 0;
    const gainers = priceEntries.filter(p => p.change24h > 0).length;
    const losers = priceEntries.filter(p => p.change24h < 0).length;

    return res.status(200).json({
      prices,
      currency: vsCurrency,
      fromCache,
      marketOverview: {
        totalMarketCap,
        totalMarketCapFormatted: formatLargeNumber(totalMarketCap),
        totalVolume24h: totalVolume,
        totalVolume24hFormatted: formatLargeNumber(totalVolume),
        avgChange24h: avgChange,
        avgChange24hFormatted: `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`,
        gainers,
        losers,
        marketSentiment: avgChange > 2 ? 'Bullish' : avgChange > 0 ? 'Slightly Bullish' : avgChange > -2 ? 'Slightly Bearish' : 'Bearish',
      },
      _meta: {
        source,
        sourceUrl: 'https://www.coingecko.com/',
        apiKeyRequired: false,
        fetchedAt: new Date().toISOString(),
        cacheTTL: `${CACHE_TTL_MS / 1000}s`,
        coinsTracked: priceEntries.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
      prices: formatPriceData(FALLBACK_DATA, 'usd'),
      fromCache: true,
      _meta: {
        source: 'fallback',
        fetchedAt: new Date().toISOString(),
      },
    });
  }
}
