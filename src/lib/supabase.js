import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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

export async function recordCommission(dealId, amount, rate = 0.10) {
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
  // Log to console in dev, send to Supabase analytics table in prod
  const entry = {
    event,
    properties,
    timestamp: new Date().toISOString(),
    page: window.location.pathname,
    userAgent: navigator.userAgent,
  };

  if (import.meta.env.DEV) {
    console.debug('[GOATED Analytics]', event, properties);
  }

  if (supabase) {
    supabase.from('analytics_events').insert([entry]).then(() => {});
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
