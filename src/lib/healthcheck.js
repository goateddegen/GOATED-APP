// =============================================================================
// GOATED Solutions - Lightweight Health Check Utility
// =============================================================================
// Tests all API endpoints with a simple GET/HEAD request + timeout.
// Returns structured results: { endpoint, status, latency_ms, error? }
// Can be triggered from the Admin page or programmatically.
// =============================================================================

const API_ENDPOINTS = [
  { id: 'chat',         url: '/api/chat',         label: 'AI Chat',           method: 'GET' },
  { id: 'goated-ai',    url: '/api/goated-ai',    label: 'GOATED AI Engine',  method: 'GET' },
  { id: 'leads',        url: '/api/leads',         label: 'Leads API',         method: 'GET' },
  { id: 'market-data',  url: '/api/market-data',   label: 'Market Data',       method: 'GET' },
  { id: 'sentiment',    url: '/api/sentiment',     label: 'Sentiment API',     method: 'GET' },
  { id: 'trends',       url: '/api/trends',        label: 'Trends API',        method: 'GET' },
  { id: 'dashboard',    url: '/api/dashboard',     label: 'Dashboard API',     method: 'GET' },
  { id: 'plays',        url: '/api/plays',         label: 'Plays API',         method: 'GET' },
  { id: 'intelligence', url: '/api/intelligence',  label: 'Intelligence API',  method: 'GET' },
  { id: 'kalshi',       url: '/api/kalshi',        label: 'Kalshi API',        method: 'GET' },
  { id: 'polymarket',   url: '/api/polymarket',    label: 'Polymarket API',    method: 'GET' },
];

const PING_TIMEOUT_MS = 8000;

/**
 * Ping a single endpoint and return structured result.
 */
async function pingEndpoint(endpoint) {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint.url, {
      method: endpoint.method || 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latency_ms = Math.round(performance.now() - start);
    const ok = res.status >= 200 && res.status < 500; // 4xx considered "alive" (e.g., 405)

    return {
      endpoint: endpoint.id,
      label: endpoint.label,
      url: endpoint.url,
      status: ok ? 'healthy' : 'degraded',
      statusCode: res.status,
      latency_ms,
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    clearTimeout(timer);
    const latency_ms = Math.round(performance.now() - start);
    return {
      endpoint: endpoint.id,
      label: endpoint.label,
      url: endpoint.url,
      status: 'down',
      statusCode: null,
      latency_ms,
      error: err.name === 'AbortError' ? 'Timeout' : err.message,
      checkedAt: new Date().toISOString(),
    };
  }
}

/**
 * Run health checks on all API endpoints in parallel.
 * Returns { results, summary }.
 */
export async function runHealthCheck() {
  const startTime = performance.now();
  const results = await Promise.all(API_ENDPOINTS.map(pingEndpoint));
  const totalDuration = Math.round(performance.now() - startTime);

  const healthy = results.filter(r => r.status === 'healthy').length;
  const degraded = results.filter(r => r.status === 'degraded').length;
  const down = results.filter(r => r.status === 'down').length;
  const avgLatency = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.latency_ms, 0) / results.length)
    : 0;
  const maxLatency = results.length > 0
    ? Math.max(...results.map(r => r.latency_ms))
    : 0;

  return {
    results,
    summary: {
      total: results.length,
      healthy,
      degraded,
      down,
      avgLatency_ms: avgLatency,
      maxLatency_ms: maxLatency,
      totalDuration_ms: totalDuration,
      overallStatus: down > 0 ? 'degraded' : healthy === results.length ? 'healthy' : 'partial',
      checkedAt: new Date().toISOString(),
    },
  };
}

/**
 * Get frontend performance metrics from the Performance API.
 */
export function getFrontendMetrics() {
  const metrics = {
    pageLoad: null,
    ttfb: null,
    lcp: null,
    fid: null,
    cls: null,
    domNodes: null,
    memory: null,
    resourceCount: null,
    totalTransferSize: null,
  };

  try {
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      metrics.pageLoad = Math.round(nav.loadEventEnd - nav.startTime);
      metrics.ttfb = Math.round(nav.responseStart - nav.requestStart);
    }
  } catch {}

  try {
    const lcp = performance.getEntriesByType('largest-contentful-paint');
    if (lcp.length) metrics.lcp = Math.round(lcp[lcp.length - 1].startTime);
  } catch {}

  try {
    const fid = performance.getEntriesByType('first-input');
    if (fid.length) metrics.fid = Math.round(fid[0].processingStart - fid[0].startTime);
  } catch {}

  try {
    const cls = performance.getEntriesByType('layout-shift');
    if (cls.length) metrics.cls = parseFloat(cls.reduce((s, x) => s + (x.hadRecentInput ? 0 : x.value), 0).toFixed(4));
  } catch {}

  try {
    metrics.domNodes = document.querySelectorAll('*').length;
  } catch {}

  try {
    if (performance.memory) {
      metrics.memory = {
        usedHeap: performance.memory.usedJSHeapSize,
        totalHeap: performance.memory.totalJSHeapSize,
        heapLimit: performance.memory.jsHeapSizeLimit,
        usedPct: Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100),
      };
    }
  } catch {}

  try {
    const resources = performance.getEntriesByType('resource');
    metrics.resourceCount = resources.length;
    metrics.totalTransferSize = resources.reduce((s, r) => s + (r.transferSize || 0), 0);
  } catch {}

  return metrics;
}

/**
 * Get list of endpoint definitions (for UI rendering).
 */
export function getEndpointList() {
  return API_ENDPOINTS.map(ep => ({ ...ep }));
}
