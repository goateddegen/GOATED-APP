// =============================================================================
// GOATED — Sprint Config
// -----------------------------------------------------------------------------
// Central place for public-facing URLs and sprint-critical constants.
// Update these as you sign up for each service — everything in the UI reads
// from here, so the whole app moves when one value lands.
// =============================================================================

// ─── Cal.com booking links ──────────────────────────────────────────────────
// Signup:  https://app.cal.com/settings/developer/api-keys
// Update these once your event types are live.
export const CAL_USERNAME = 'tarekali'; // set to your Cal.com username
export const CAL_EVENT_DISCOVERY = 'discovery-15'; // 15-min intro call slug
export const CAL_EVENT_AUDIT_WALKTHROUGH = 'audit-walkthrough-30'; // 30-min post-audit
export const CAL_EVENT_MANAGED = 'managed-audit-45'; // 45-min managed service qualification

export const calLink = (slug) => `https://cal.com/${CAL_USERNAME}/${slug}`;
export const CAL_DISCOVERY_URL = calLink(CAL_EVENT_DISCOVERY);
export const CAL_AUDIT_URL = calLink(CAL_EVENT_AUDIT_WALKTHROUGH);
export const CAL_MANAGED_URL = calLink(CAL_EVENT_MANAGED);

// Embed helper (can be passed a brand + source URL)
export const calEmbedUrl = (slug, opts = {}) => {
  const params = new URLSearchParams();
  if (opts.brand) params.set('name', opts.brand);
  if (opts.email) params.set('email', opts.email);
  if (opts.notes) params.set('notes', opts.notes);
  if (opts.source) params.set('source', opts.source);
  const q = params.toString();
  return `https://cal.com/${CAL_USERNAME}/${slug}?embed=true${q ? `&${q}` : ''}`;
};

// ─── Stripe Payment Links (manual fallback until Connect is fully wired) ────
// Create here:  https://dashboard.stripe.com/payment-links
// Each link = one productized offering. Paste the full https://buy.stripe.com/... URL.
export const STRIPE_PAYMENT_LINKS = {
  audit_paid: '',          // $49 / $99 productized audit (if you toggle free → paid)
  managed_starter: '',     // $5K deposit — Starter tier
  managed_pro: '',         // $8K deposit — Pro tier (recommended)
  managed_enterprise: '',  // Custom — Enterprise tier
  growth_audit: '',        // $1,500 flat-priced productized audit (contingency plan)
  sms_reactivation: '',    // $1,500 flat
  chatbot_embed: '',       // $2,000 flat + $500/mo
  review_automation: '',   // $1,500 setup + $300/mo
};

// ─── Contact + Support ──────────────────────────────────────────────────────
export const CONTACT_EMAIL = 'secrdev@gmail.com';
export const SUPPORT_EMAIL = 'secrdev@gmail.com';
export const CAL_FALLBACK_MAILTO = `mailto:${CONTACT_EMAIL}?subject=GOATED%20Managed%20Service%20%E2%80%94%20Discovery%20Call`;

// ─── Domain + canonical URLs ────────────────────────────────────────────────
export const CANONICAL_HOST = 'goated.solutions';          // once Namecheap verification clears
export const VERCEL_HOST = 'goated-app-nine.vercel.app';    // current fallback

// ─── Pricing source of truth ────────────────────────────────────────────────
// v7.5.4 — Two-tier model: Local Engine (brick & mortar) + Growth Engine (online/SMB).
// Deposit > monthly retainer (fixes the prior "retainer ≈ deposit" problem).
// Deposit is the commitment filter; sticky-cheap retainer drives long LTV.
//
// Tier 1 — Local Engine: brick-and-mortar (HVAC, dental, med spa, chiro, plumbing)
//   $2,000 setup + $750/mo retainer. M1 = $2,750. M6 = $6,500. M12 = $11,000.
//
// Tier 2 — Growth Engine: online biz, consultancies, agencies, larger SMB
//   $10,000-$20,000 setup + $2,500-$5,000/mo retainer + optional 10-20% rev share.
//   M1 = $12,500-$25K. M12 = $40-$80K.
//
// 13% flat commission still applies on attributed closed deal revenue (not retainers).
export const PRICING = {
  commission: {
    flat: 13,
    platformSourced: 13,
    railsOnly: 13,
  },
  // PRIMARY model (tier-based, agency-first)
  tiers: {
    local: {
      label: 'Local Engine',
      target: 'Brick & mortar (HVAC, dental, med spa, chiro, plumbing, roofing)',
      setup: 2000,
      retainer: 750,
      revShare: 0,
      minMonths: 3,
      includes: [
        'Missed-call recovery (AI voice agent answers in <60 sec)',
        'SMS auto-text-back on missed calls + after-hours',
        'Calendar booking integration',
        'Monthly recovered-revenue report',
      ],
      closeCycle: '1-3 calls',
      idealClose: '$2,750 first-month cash',
    },
    growth: {
      label: 'Growth Engine',
      target: 'Online biz, agencies, consultancies, $1M+ SMB',
      setupMin: 10000,
      setupMax: 20000,
      retainerMin: 2500,
      retainerMax: 5000,
      revShareMin: 10,
      revShareMax: 20,
      minMonths: 6,
      includes: [
        'Full revenue audit + custom roadmap',
        'AI voice agent + outbound SDR campaign',
        'Multi-channel outreach (cold call + SMS + email)',
        'Custom CRM/integration build',
        'Weekly performance review',
        'Optional 10-20% rev share on attributed revenue',
      ],
      closeCycle: '2-4 calls',
      idealClose: '$12,500-$25K first-month cash',
    },
  },
  // LEGACY managed shape — kept temporarily for any UI still reading old keys.
  // New code reads PRICING.tiers.* instead.
  managed: {
    starter: { setup: 2000,  retainer: 750,  revShare: 0,  label: 'Local Engine' },
    pro:     { setup: 10000, retainer: 2500, revShare: 10, label: 'Growth Engine', recommended: true },
    elite:   { setup: 20000, retainer: 5000, revShare: 20, label: 'Growth Elite' },
  },
  productized: {
    growthAudit: 1500,
    smsReactivation: 1500,
    chatbotEmbedSetup: 2000, chatbotEmbedMonthly: 500,
    reviewAutoSetup: 1500,  reviewAutoMonthly: 300,
  },
};

// ─── Routing: which pages are actually reachable ────────────────────────────
// Single source of truth. Every navigation surface (sidebar, keybinds, Cmd+K
// search, AI overlay auto-navigate, hash router) reads from here, so a page can
// never be reachable through one door after being closed on another.
//
// NAV_PAGES  — surfaced in the sidebar and reachable by every means.
// DISABLED_PAGES — code is retained and still builds, but the page is NOT
//   reachable: no keybind, no search result, no AI navigation, no hash. Move an
//   id from DISABLED_PAGES back into NAV_PAGES (and add it to the Sidebar nav
//   array) to bring it back online.
//
// TrendPulse + Wallet are parked here: TrendPulse ships crypto-market data that
// doesn't match the agency positioning, and Wallet depends on Stripe Connect
// endpoints that aren't built yet.
export const NAV_PAGES = ['home', 'audit', 'leads', 'dashboard', 'admin'];
export const DISABLED_PAGES = ['trends', 'market', 'wallet', 'managed', 'casino', 'launchpad'];

// ─── Admin access ───────────────────────────────────────────────────────────
// Pages only the operator may reach. Everyone else gets Dashboard as their
// highest surface — Admin is hidden from nav, unbound from its keybind, absent
// from search, and refused by the router.
//
// NOTE: this is UI gating, not a security boundary. The Admin page is client
// rendered, so a determined visitor can still read the bundle. Anything that
// must actually be protected has to be enforced server-side (Supabase RLS on
// the row, or a service-key-only API route) — not by hiding a nav item.
export const ADMIN_PAGES = ['admin'];
export const ADMIN_EMAILS = ['devfudkupradio@gmail.com'];

export const isAdminEmail = (email) =>
  !!email && ADMIN_EMAILS.includes(String(email).trim().toLowerCase());

export const isAdminPage = (id) => ADMIN_PAGES.includes(id);

/**
 * Can this user reach this page?
 * @param {string} id   page id
 * @param {object|null} user  the signed-in user, or null
 */
export const isPageEnabled = (id, user) => {
  if (!NAV_PAGES.includes(id)) return false;
  if (isAdminPage(id)) return isAdminEmail(user?.email);
  return true;
};

// Keybind → page. Only enabled pages get a binding; `x` additionally requires
// an admin session, enforced by isPageEnabled at every call site.
export const PAGE_KEYBINDS = { h: 'home', u: 'audit', l: 'leads', d: 'dashboard', x: 'admin' };

// ─── Feature flags (flip without redeploying UI logic) ──────────────────────
export const FLAGS = {
  auditPaid: false,          // toggle the free audit to paid ($49)
  showManaged: true,         // show ManagedPage in nav + CTAs
  showDegenMode: true,
  requireAuth: false,        // flip once Supabase is live
};

// ─── Social / external links ────────────────────────────────────────────────
export const LINKS = {
  twitter: 'https://x.com/', // TODO: fill
  linkedin: '',
  github: '',
  docs: '',
};

// ─── Utility: format price like "$5,000" or "5,000" ──────────────────────────
export const fmtPrice = (n, withDollar = true) => {
  if (n == null) return '—';
  const s = Math.round(n).toLocaleString('en-US');
  return withDollar ? `$${s}` : s;
};
