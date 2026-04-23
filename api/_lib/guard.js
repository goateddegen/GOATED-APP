// =============================================================================
// GOATED — Shared Endpoint Guard (rate limit + body cap + daily LLM budget)
// -----------------------------------------------------------------------------
// Vercel serverless instances don't share memory, so in-memory maps only cover
// a single warm instance — this is best-effort defense, not a fortress. For
// ironclad protection layer Vercel WAF / Cloudflare / Upstash Redis on top.
//
// This module is NOT a serverless function (underscore prefix = excluded).
// Import into each /api/*.js handler and call guardRequest() before any
// expensive work.
// =============================================================================

const ALLOWED_ORIGINS = [
  'https://goated-app-nine.vercel.app',
  'https://www.goated.solutions',
  'https://goated.solutions',
  'http://localhost:5173',
  'http://localhost:5174',
];

// ─── Per-IP sliding-window counter ──────────────────────────────────────────
const ipBuckets = new Map();

function ipKey(req) {
  const xff = req.headers?.['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function checkIpRate(ip, windowMs, maxPerWindow) {
  const now = Date.now();
  let bucket = ipBuckets.get(ip);
  if (!bucket) { bucket = []; ipBuckets.set(ip, bucket); }
  // Drop expired timestamps in place
  while (bucket.length && now - bucket[0] > windowMs) bucket.shift();
  if (bucket.length >= maxPerWindow) return false;
  bucket.push(now);
  return true;
}

// Sweep stale IP buckets every 5min to stop unbounded growth
setInterval(() => {
  const cutoff = Date.now() - 10 * 60_000;
  for (const [ip, bucket] of ipBuckets) {
    if (!bucket.length || bucket[bucket.length - 1] < cutoff) ipBuckets.delete(ip);
  }
}, 5 * 60_000);

// ─── Daily LLM-call budget (per instance, per UTC day) ──────────────────────
// If an endpoint burns past this, short-circuit with 503 until next UTC day.
// Example: LLM_DAILY_CAP=200 means max 200 expensive LLM calls per day across
// all IPs hitting this particular serverless instance.
const dailyLlmCalls = new Map(); // key = UTC date string, value = count

function todayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function checkDailyBudget(cap) {
  const key = todayKey();
  const count = dailyLlmCalls.get(key) || 0;
  if (count >= cap) return false;
  dailyLlmCalls.set(key, count + 1);
  // Evict yesterday's entry
  for (const k of dailyLlmCalls.keys()) {
    if (k !== key) dailyLlmCalls.delete(k);
  }
  return true;
}

// ─── CORS ───────────────────────────────────────────────────────────────────
function getCorsOrigin(req) {
  const origin = req.headers?.origin || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

function setSecurityHeaders(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

// ─── Body size cap ──────────────────────────────────────────────────────────
// Note: Vercel already has a 4.5MB body limit for Edge/serverless. This is an
// extra belt: if the parsed body stringifies larger than maxBytes, reject.
function checkBodySize(body, maxBytes) {
  if (!body) return true;
  try {
    const size = typeof body === 'string' ? body.length : JSON.stringify(body).length;
    return size <= maxBytes;
  } catch { return false; }
}

// ─── Public API ─────────────────────────────────────────────────────────────
/**
 * Guard a request. Returns { ok: true } if allowed, otherwise { ok: false, status, body }
 * which the handler should return as `res.status(status).json(body)`.
 *
 * Opts:
 *   rateWindowMs     — sliding window size (default 60_000)
 *   rateMaxPerWindow — max requests per window per IP (default 30)
 *   maxBodyBytes     — reject bodies larger than this (default 50_000)
 *   llmDailyCap      — if endpoint calls LLM, hard cap total daily calls (0 = no cap)
 *   methods          — allowed HTTP methods array (default ['POST'])
 */
export function guardRequest(req, res, opts = {}) {
  const {
    rateWindowMs = 60_000,
    rateMaxPerWindow = 30,
    maxBodyBytes = 50_000,
    llmDailyCap = 0,
    methods = ['POST'],
  } = opts;

  const origin = getCorsOrigin(req);
  setSecurityHeaders(res, origin);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return { ok: false, handled: true };
  }

  if (!methods.includes(req.method)) {
    return { ok: false, status: 405, body: { error: 'Method not allowed' } };
  }

  const ip = ipKey(req);
  if (!checkIpRate(ip, rateWindowMs, rateMaxPerWindow)) {
    res.setHeader('Retry-After', '60');
    return { ok: false, status: 429, body: { error: 'Rate limited. Slow down.' } };
  }

  if (req.method === 'POST' && !checkBodySize(req.body, maxBodyBytes)) {
    return { ok: false, status: 413, body: { error: 'Payload too large' } };
  }

  if (llmDailyCap > 0 && !checkDailyBudget(llmDailyCap)) {
    return { ok: false, status: 503, body: { error: 'Daily AI budget exhausted on this instance. Try again after UTC midnight.' } };
  }

  return { ok: true, ip, origin };
}

// Helper: set common cache headers for GET endpoints that proxy public data.
// s-maxage lets Vercel's edge cache soak repeat hits so we don't pay CoinGecko.
export function setCacheHeaders(res, edgeSec = 30, browserSec = 10) {
  res.setHeader('Cache-Control', `public, s-maxage=${edgeSec}, max-age=${browserSec}, stale-while-revalidate=60`);
}
