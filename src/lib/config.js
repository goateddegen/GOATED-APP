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
// Used across HomePage, ManagedPage, AuditPage result CTA.
// NOTE: 13% flat = 12% net platform + ~1% Stripe fee absorption (2.9%+30¢ avg
// ≈ 3.2% on $10K deals, netted against 13% = ~9.8% net take).
export const PRICING = {
  commission: {
    flat: 13,               // % we take on every closed deal (platform absorbs Stripe fees)
    platformSourced: 13,    // deprecated alias — all deals are 13% flat now
    railsOnly: 13,          // deprecated alias — no more tiered rate
  },
  managed: {
    starter: { setup: 5000, retainer: 3000, revShare: 10, label: 'Starter' },
    pro:     { setup: 8000, retainer: 4000, revShare: 12, label: 'Pro',     recommended: true },
    elite:   { setup: 8500, retainer: 5000, revShare: 15, label: 'Elite'   },
  },
  productized: {
    growthAudit: 1500,      // contingency plan fallback
    smsReactivation: 1500,
    chatbotEmbedSetup: 2000, chatbotEmbedMonthly: 500,
    reviewAutoSetup: 1500,  reviewAutoMonthly: 300,
  },
};

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
