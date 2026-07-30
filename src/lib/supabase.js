import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

// Supabase's newer `sb_publishable_...` keys replace the legacy `anon` JWT.
// Accept either so the app works before and after a project migrates. Both are
// passed straight through as the `apikey` header, so no format handling needed.
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

// Fail loudly on a half-configured project — a URL with no key (or vice versa)
// silently disables auth, cloud sync, and the waitlist, which is exactly the
// kind of thing that only gets noticed after launch.
if ((supabaseUrl && !supabaseAnonKey) || (!supabaseUrl && supabaseAnonKey)) {
  console.error(
    '[GOATED] Supabase is half-configured: ' +
    `VITE_SUPABASE_URL is ${supabaseUrl ? 'set' : 'MISSING'}, ` +
    `publishable/anon key is ${supabaseAnonKey ? 'set' : 'MISSING'}. ` +
    'Both are required — running with browser-local accounts instead.',
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------
export async function signUp(email, password, metadata = {}) {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  return supabase.auth.signUp({ email, password, options: { data: metadata } });
}

export async function signIn(email, password) {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithGoogle() {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  return supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
}

export async function signInWithGithub() {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  return supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: window.location.origin } });
}

export async function signOut() {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  localStorage.removeItem('goated_wallet');
  localStorage.removeItem('goated_goat_balance');
  return supabase.auth.signOut();
}

export async function getSession() {
  if (!supabase) return { data: { session: null } };
  return supabase.auth.getSession();
}

export async function getUser() {
  if (!supabase) return { data: { user: null } };
  return supabase.auth.getUser();
}

// Listen for auth state changes
export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange(callback);
}

// ---------------------------------------------------------------------------
// Waitlist
// ---------------------------------------------------------------------------
export async function joinWaitlist(email, name, businessType) {
  if (!supabase) {
    const existing = JSON.parse(localStorage.getItem('goated_waitlist') || '[]');
    existing.push({ email, name, businessType, joinedAt: new Date().toISOString() });
    localStorage.setItem('goated_waitlist', JSON.stringify(existing));
    return { data: { id: Date.now() }, error: null };
  }
  return supabase.from('waitlist').insert([{ email, name, business_type: businessType, joined_at: new Date().toISOString() }]);
}

// ---------------------------------------------------------------------------
// Realtime subscriptions — scalable channels
// ---------------------------------------------------------------------------
export function subscribeToLeads(callback) {
  if (!supabase) return { unsubscribe: () => {} };
  return supabase
    .channel('leads-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, callback)
    .subscribe();
}

export function subscribeToDeals(callback) {
  if (!supabase) return { unsubscribe: () => {} };
  return supabase
    .channel('deals-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, callback)
    .subscribe();
}

export function subscribeToMarket(callback) {
  if (!supabase) return { unsubscribe: () => {} };
  return supabase
    .channel('market-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'market_data' }, callback)
    .subscribe();
}

// Broadcast channel for real-time collaboration
export function joinPresenceChannel(userId, metadata = {}) {
  if (!supabase) return null;
  const channel = supabase.channel('app-presence', {
    config: { presence: { key: userId } },
  });
  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user_id: userId, online_at: new Date().toISOString(), ...metadata });
    }
  });
  return channel;
}

// ---------------------------------------------------------------------------
// Data operations — for when Supabase tables are set up
// ---------------------------------------------------------------------------
export async function upsertLead(lead) {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  return supabase.from('leads').upsert(lead);
}

export async function fetchLeads({ page = 1, limit = 50, filters = {} } = {}) {
  if (!supabase) return { data: [], error: null, count: 0 };
  let query = supabase.from('leads').select('*', { count: 'exact' });

  if (filters.industry) query = query.eq('industry', filters.industry);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.minScore) query = query.gte('score', filters.minScore);
  if (filters.search) query = query.or(`name.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);

  query = query.range((page - 1) * limit, page * limit - 1).order('score', { ascending: false });
  return query;
}

export async function recordTransaction(tx) {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  return supabase.from('transactions').insert([{
    ...tx,
    created_at: new Date().toISOString(),
  }]);
}

export async function recordCommission(dealId, amount, rate = 0.13) {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  return supabase.from('commissions').insert([{
    deal_id: dealId,
    amount,
    rate,
    created_at: new Date().toISOString(),
  }]);
}

// ---------------------------------------------------------------------------
// Monitoring & Observability helpers
// ---------------------------------------------------------------------------
const PERF_KEY = 'goated_perf_metrics';

export function trackEvent(event, properties = {}) {
  // Column names must be snake_case to match the analytics_events table. This
  // previously sent `userAgent`, which PostgREST rejected with a 400 on every
  // single page view — a steady stream of failed inserts in the Supabase logs,
  // silent in the app because the promise result was discarded.
  const entry = {
    event,
    properties,
    timestamp: new Date().toISOString(),
    page: window.location.pathname,
    user_agent: navigator.userAgent,
  };

  if (import.meta.env.DEV) {
    console.debug('[GOATED Analytics]', event, properties);
  }

  if (supabase) {
    // Surface failures instead of swallowing them — a broken analytics insert
    // should be visible in the console, not just in the provider's dashboard.
    supabase.from('analytics_events').insert([entry]).then(({ error }) => {
      if (error) console.warn('[GOATED] analytics insert failed:', error.message);
    });
  } else {
    // Queue locally for when Supabase is configured
    try {
      const queue = JSON.parse(localStorage.getItem('goated_analytics_queue') || '[]');
      queue.push(entry);
      if (queue.length > 100) queue.splice(0, queue.length - 100); // cap at 100
      localStorage.setItem('goated_analytics_queue', JSON.stringify(queue));
    } catch {}
  }
}

export function trackPageView(page) {
  trackEvent('page_view', { page });
}

// Custom action tracking for key user interactions
export function trackAIChatUsage(mode, messageCount) {
  trackEvent('ai_chat_usage', { mode, messageCount, timestamp: Date.now() });
}

export function trackLeadSearch(query, resultCount, filters) {
  trackEvent('lead_search', { query, resultCount, filters, timestamp: Date.now() });
}

export function trackCasinoBet(marketId, amount, direction) {
  trackEvent('casino_bet', { marketId, amount, direction, timestamp: Date.now() });
}

export function trackMarketRefresh(source, coinCount) {
  trackEvent('market_refresh', { source, coinCount, timestamp: Date.now() });
}

export function trackPerformance() {
  if (typeof window === 'undefined' || !window.performance) return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        trackEvent('web_vital', { metric: 'LCP', value: Math.round(entry.startTime) });
      }
      if (entry.entryType === 'first-input') {
        trackEvent('web_vital', { metric: 'FID', value: Math.round(entry.processingStart - entry.startTime) });
      }
      if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
        trackEvent('web_vital', { metric: 'CLS', value: entry.value });
      }
    }
  });

  try {
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    observer.observe({ type: 'first-input', buffered: true });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch {}

  return observer;
}

// ---------------------------------------------------------------------------
// Cloud Persistence — sync user data to Supabase when logged in
// Falls back to localStorage when offline or Supabase not configured
// ---------------------------------------------------------------------------
const SYNC_KEYS = [
  'goated_degen', 'goated_onboarded', 'goated_goat_balance',
  'goated_transactions', 'goated_invoices', 'goated_wallet',
  'goated_casino_bets', 'goated_casino_resolved', 'goated_casino_bet_history',
  'goated_daily_bonus', 'goated_streaks',
];

export async function syncUserDataToCloud(userId) {
  if (!supabase || !userId) return;
  try {
    const settings = {};
    for (const key of SYNC_KEYS) {
      const val = localStorage.getItem(key);
      if (val !== null) settings[key] = val;
    }
    await supabase.from('user_settings').upsert({
      user_id: userId,
      settings: settings,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch (err) {
    console.warn('[GOATED] Cloud sync failed:', err.message);
  }
}

export async function loadUserDataFromCloud(userId) {
  if (!supabase || !userId) return false;
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single();
    if (error || !data?.settings) return false;
    // Restore to localStorage
    for (const [key, val] of Object.entries(data.settings)) {
      if (val !== null && val !== undefined) {
        localStorage.setItem(key, val);
      }
    }
    return true;
  } catch {
    return false;
  }
}

// Auto-sync on interval (every 60s when logged in)
let syncInterval = null;
export function startAutoSync(userId) {
  stopAutoSync();
  if (!userId) return;
  // Initial sync
  syncUserDataToCloud(userId);
  syncInterval = setInterval(() => syncUserDataToCloud(userId), 60000);
}
export function stopAutoSync() {
  if (syncInterval) { clearInterval(syncInterval); syncInterval = null; }
}

export function getHealthStatus() {
  return {
    supabaseConnected: !!supabase,
    supabaseUrl: supabaseUrl ? 'configured' : 'not set',
    realtimeEnabled: !!supabase,
    localStorage: (() => { try { localStorage.setItem('_test', '1'); localStorage.removeItem('_test'); return true; } catch { return false; } })(),
    walletsConnected: !!localStorage.getItem('goated_wallet'),
    goatBalance: parseFloat(localStorage.getItem('goated_goat_balance') || '0'),
    analyticsQueueSize: (() => { try { return JSON.parse(localStorage.getItem('goated_analytics_queue') || '[]').length; } catch { return 0; } })(),
  };
}

// ---------------------------------------------------------------------------
// Authenticated fetch
// ---------------------------------------------------------------------------
/**
 * fetch() that forwards the current Supabase access token.
 *
 * /api/leads needs this to know who to file saved leads under — without the
 * token the route still returns results, it just can't persist them.
 */
export async function authedFetch(url, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch { /* fall through unauthenticated */ }
  }
  return fetch(url, { ...opts, headers });
}
