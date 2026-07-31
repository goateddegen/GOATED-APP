// =============================================================================
// GOATED — Revenue Loss Auditor API (LIVE CRAWL + LLM ANALYSIS)
// -----------------------------------------------------------------------------
// Single serverless endpoint. No hardcoded categories, no lookup tables.
// Real flow: POST { url } -> fetch HTML live -> extract signals via regex
// (cheerio skipped to keep cold start light) -> pass to LLM -> return JSON.
//
// LLM priority:
//   1. Groq (Llama 3.3 70B Versatile) — sub-second, JSON mode, free tier
//   2. Anthropic Claude Haiku — fallback if Groq fails or is rate-limited
//
// Env vars required (set in Vercel → Project → Settings → Environment):
//   GROQ_API_KEY          (https://console.groq.com/keys)
//   ANTHROPIC_API_KEY     (https://console.anthropic.com/settings/keys)
// Either one alone is enough; both = resilience.
// =============================================================================

// ─── CORS whitelist ─────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://goated-app-nine.vercel.app',
  'https://www.goated.solutions',
  'https://goated.solutions',
  'http://localhost:5173',
  'http://localhost:5174',
];

function getCorsOrigin(req) {
  const origin = req.headers?.origin || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

function setHeaders(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

// ─── Rate limiting (sliding window, per IP) ─────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10; // 10 audits per min per IP — crawls are expensive

function checkRate(ip) {
  const now = Date.now();
  let e = rateLimitMap.get(ip);
  if (!e) { e = { ts: [] }; rateLimitMap.set(ip, e); }
  e.ts = e.ts.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (e.ts.length >= RATE_LIMIT_MAX) return false;
  e.ts.push(now);
  return true;
}

// ─── URL sanitization ───────────────────────────────────────────────────────
// Returns { url } on success, or { error } with a message that names the actual
// problem. The previous version collapsed every rejection into one null, so a
// typo, an intranet address and a `javascript:` string all produced the same
// unhelpful "Invalid URL" — the visitor had no idea what to change.
function normalizeUrl(raw) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return { error: 'Enter a website address to audit — for example goated.solutions.' };
  }
  let url = raw.trim().toLowerCase();

  if (url.startsWith('file:') || url.startsWith('javascript:') || url.startsWith('data:')) {
    return { error: 'That looks like a local file or script, not a website. Paste a public web address starting with https://.' };
  }
  if (/\s/.test(url)) {
    return { error: "That address contains a space, so it isn't a valid web address. Check for a typo and paste the full URL." };
  }
  if (/^[^:]+:\/\//.test(url) && !/^https?:\/\//.test(url)) {
    return { error: 'Only http and https addresses can be audited. Paste the site’s normal web address.' };
  }
  if (!/^https?:\/\//.test(url)) url = `https://${url}`;

  let parsed;
  try { parsed = new URL(url); }
  catch { return { error: `We couldn't read “${raw.trim()}” as a web address. It should look like https://example.com.` }; }

  const h = parsed.hostname;
  if (h === 'localhost' || h.startsWith('127.') || h.startsWith('10.') || h.startsWith('192.168.')
      || h.startsWith('169.254.') || h === '0.0.0.0' || h.endsWith('.local') || h.endsWith('.internal')) {
    return { error: 'That address is on a private or local network, so we cannot reach it from the internet. Use the site’s public address.' };
  }
  if (!h.includes('.')) {
    return { error: `“${h}” is missing a domain ending. Try something like ${h}.com.` };
  }
  if (h.endsWith('.')) {
    return { error: `“${h}” ends with a dot. Remove the trailing dot and try again.` };
  }
  return { url: parsed.toString() };
}

// ─── Fetch with timeout + size cap ──────────────────────────────────────────
async function fetchPage(url, timeoutMs = 5000, maxBytes = 500_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GOATED-Audit/1.0; +https://goated.solutions/audit)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!resp.ok) { const e = new Error(`HTTP ${resp.status}`); e.httpStatus = resp.status; throw e; }
    const ct = resp.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('application/xhtml')) { const e = new Error('Non-HTML response'); e.contentType = ct || 'unknown'; throw e; }
    // Cap body size — abort reading after maxBytes
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let html = '';
    let read = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      read += value.length;
      html += decoder.decode(value, { stream: true });
      if (read >= maxBytes) { try { reader.cancel(); } catch {} break; }
    }
    return html;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Best-effort secondary page crawl (pricing, about, contact, blog) ────────
// Budget: 3 additional pages, 3s each, 100KB cap per page.
async function fetchAdditionalPages(baseUrl, html) {
  const probes = new Set();
  try {
    const base = new URL(baseUrl);
    // Common high-signal paths
    const candidates = ['/pricing', '/plans', '/about', '/contact', '/demo', '/book', '/book-a-call', '/schedule', '/blog', '/reviews', '/testimonials', '/case-studies'];
    // Prefer paths we actually saw linked in HTML (higher hit rate)
    for (const path of candidates) {
      if (new RegExp(`href=["'][^"']*${path.replace('/', '\\/')}`, 'i').test(html)) {
        probes.add(new URL(path, base).toString());
      }
    }
    // Also probe /pricing and /about unconditionally (cheap)
    probes.add(new URL('/pricing', base).toString());
    probes.add(new URL('/about', base).toString());
  } catch { /* ignore */ }

  const targets = [...probes].slice(0, 3);
  const results = await Promise.allSettled(
    targets.map(u => fetchPage(u, 3000, 100_000).then(h => ({ url: u, html: h })))
  );
  return results
    .filter(r => r.status === 'fulfilled' && r.value?.html)
    .map(r => r.value);
}

// ─── Best-effort social profile snippet fetch ────────────────────────────────
// Most socials will block anonymous crawls — we still try for 1.5s each in
// parallel. Anything we get goes in as extra signal. Failures silent.
async function fetchSocialSnippets(socials) {
  const urls = [];
  if (socials?.instagram) urls.push({ net: 'instagram', url: `https://www.instagram.com/${socials.instagram}/` });
  if (socials?.twitter)   urls.push({ net: 'twitter',   url: `https://x.com/${socials.twitter}` });
  if (socials?.linkedin)  urls.push({ net: 'linkedin',  url: `https://www.linkedin.com/company/${socials.linkedin}` });
  if (socials?.tiktok)    urls.push({ net: 'tiktok',    url: `https://www.tiktok.com/@${socials.tiktok}` });
  if (socials?.youtube)   urls.push({ net: 'youtube',   url: `https://www.youtube.com/${socials.youtube.startsWith('@') ? socials.youtube : '@' + socials.youtube}` });

  if (urls.length === 0) return {};
  const results = await Promise.allSettled(
    urls.slice(0, 4).map(({ net, url }) =>
      fetchPage(url, 1500, 40_000).then(html => ({ net, url, html }))
    )
  );
  const out = {};
  for (const r of results) {
    if (r.status === 'fulfilled') {
      const { net, url, html } = r.value;
      // Extract lightweight signals — title + og:description + follower hints if leakable
      const title = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i)?.[1]?.trim();
      const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,500})["']/i)?.[1]?.trim();
      // Follower/subscriber hints (best-effort, many socials block SSR)
      const followerMatch = html.match(/(\d[\d,.]*\s*(?:K|M|B)?)\s*(?:followers?|subscribers?|likes?)/i);
      out[net] = {
        url,
        reachable: html.length > 500,
        title: title || null,
        description: ogDesc || null,
        followerHint: followerMatch?.[1] || null,
        htmlBytes: html.length,
      };
    }
  }
  return out;
}

// ─── Signal extraction from HTML (regex-based, no cheerio) ───────────────────
function extractSignals(html, urlStr) {
  const sig = {
    url: urlStr,
    title: null,
    description: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    ogType: null,
    canonical: null,
    language: null,
    headings: { h1: [], h2: [] },
    links: { internal: 0, external: 0 },
    forms: 0,
    images: 0,
    wordCount: 0,
    tech: new Set(),
    socials: {},
    cta: [],
    contacts: { emails: [], phones: [] },
    hasPricingPage: false,
    hasBlog: false,
    hasCheckout: false,
    hasLiveChat: false,
    hasBooking: false,
    hasShopify: false,
    hasTestimonials: false,
    hasStructuredData: false,
    loadsAnalytics: false,
    mobileViewport: false,
    rawTextSnippet: '',
  };

  const pick = (re, src = html) => { const m = src.match(re); return m ? (m[1] || m[0]).trim() : null; };

  // Meta
  sig.title = pick(/<title[^>]*>([^<]{1,500})<\/title>/i);
  sig.description = pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i);
  sig.ogTitle = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,500})["']/i);
  sig.ogDescription = pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,500})["']/i);
  sig.ogImage = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']{1,500})["']/i);
  sig.ogType = pick(/<meta[^>]+property=["']og:type["'][^>]+content=["']([^"']{1,100})["']/i);
  sig.canonical = pick(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']{1,500})["']/i);
  sig.language = pick(/<html[^>]+lang=["']([^"']{1,20})["']/i);
  sig.mobileViewport = /name=["']viewport["']/i.test(html);
  sig.hasStructuredData = /application\/ld\+json/i.test(html);

  // Headings (first 5 of each)
  const h1s = [...html.matchAll(/<h1[^>]*>([^<]{1,200})<\/h1>/gi)].slice(0, 5);
  const h2s = [...html.matchAll(/<h2[^>]*>([^<]{1,200})<\/h2>/gi)].slice(0, 10);
  sig.headings.h1 = h1s.map(m => m[1].replace(/\s+/g, ' ').trim()).filter(Boolean);
  sig.headings.h2 = h2s.map(m => m[1].replace(/\s+/g, ' ').trim()).filter(Boolean);

  // Links
  const allLinks = [...html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)].map(m => m[1]);
  let internal = 0, external = 0;
  try {
    const host = new URL(urlStr).hostname;
    for (const l of allLinks) {
      if (l.startsWith('#') || l.startsWith('mailto:') || l.startsWith('tel:')) continue;
      try {
        const u = new URL(l, urlStr);
        if (u.hostname === host) internal++; else external++;
      } catch { internal++; }
    }
  } catch {}
  sig.links.internal = internal; sig.links.external = external;

  // Forms + images
  sig.forms = (html.match(/<form\b/gi) || []).length;
  sig.images = (html.match(/<img\b/gi) || []).length;

  // Contacts
  const emails = [...html.matchAll(/[\w.+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi)].map(m => m[0]).filter(e => !/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(e));
  sig.contacts.emails = [...new Set(emails)].slice(0, 5);
  const phones = [...html.matchAll(/(?:tel:)?[\+\(]?\d{1,3}[\s.\-\)]?\s?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g)].map(m => m[0]).filter(p => p.length < 30);
  sig.contacts.phones = [...new Set(phones)].slice(0, 3);

  // Socials
  const socialPats = {
    instagram: /instagram\.com\/([a-z0-9_.]{2,40})/i,
    twitter:   /(?:twitter|x)\.com\/([a-z0-9_]{2,40})/i,
    linkedin:  /linkedin\.com\/(?:company|in)\/([a-z0-9-]{2,80})/i,
    tiktok:    /tiktok\.com\/@?([a-z0-9_.]{2,40})/i,
    youtube:   /youtube\.com\/(?:@|c\/|channel\/|user\/)([a-z0-9_.-]{2,80})/i,
    facebook:  /facebook\.com\/([a-z0-9.-]{2,80})/i,
  };
  for (const [net, re] of Object.entries(socialPats)) {
    const m = html.match(re);
    if (m) sig.socials[net] = m[1];
  }

  // Tech stack detection (common SaaS/scripts)
  const techPats = {
    'Shopify': /cdn\.shopify\.com|shopify\.com\/s\/|shopify-section/i,
    'WooCommerce': /woocommerce|wc-ajax/i,
    'Webflow': /webflow\.com|website-files\.com/i,
    'Squarespace': /squarespace\.com|static1\.squarespace/i,
    'Wix': /wix\.com|wixstatic\.com/i,
    'WordPress': /wp-content|wp-includes|wordpress/i,
    'Klaviyo': /klaviyo|a\.klaviyo\.com/i,
    'Mailchimp': /chimpstatic|mailchimp/i,
    'HubSpot': /hs-scripts\.com|hubspot\.com|hs-analytics/i,
    'Intercom': /widget\.intercom\.io|intercomcdn/i,
    'Drift': /drift\.com|js\.driftt\.com/i,
    'Zendesk': /zendesk\.com|zdassets\.com/i,
    'Gorgias': /gorgias\.chat|gorgias\.com/i,
    'Tidio': /tidio\.com|tidiochat/i,
    'Calendly': /calendly\.com/i,
    'Cal.com': /cal\.com\/embed|embed\.cal\.com/i,
    'Segment': /cdn\.segment\.com/i,
    'Stripe': /js\.stripe\.com|stripe\.com\/v3/i,
    'PayPal': /paypal\.com\/sdk|paypalobjects/i,
    'Google Analytics': /google-analytics\.com|googletagmanager|gtag\(/i,
    'Meta Pixel': /connect\.facebook\.net\/en_US\/fbevents/i,
    'TikTok Pixel': /analytics\.tiktok\.com/i,
    'Attentive': /attentivemobile/i,
    'Postscript': /postscript\.io/i,
    'Yotpo': /yotpo\.com/i,
    'Okendo': /okendo\.io/i,
    'ReCharge': /rechargepayments/i,
    'Judge.me': /judge\.me/i,
    'Next.js': /__next|_next\/static/i,
    'React': /\/react(?:-dom)?(?:\.production\.min)?\.js/i,
    'Vue': /vue(?:\.runtime)?(?:\.min)?\.js/i,
    'jQuery': /jquery(?:\.min)?\.js/i,
    'Framer': /framerusercontent/i,
  };
  for (const [name, re] of Object.entries(techPats)) {
    if (re.test(html)) sig.tech.add(name);
  }

  // Feature heuristics
  sig.hasShopify = sig.tech.has('Shopify');
  sig.hasPricingPage = /href=["'][^"']*\/pricing/i.test(html) || /\bpricing\b/i.test(sig.headings.h1.join(' ') + ' ' + sig.headings.h2.join(' '));
  sig.hasBlog = /href=["'][^"']*\/blog/i.test(html);
  sig.hasCheckout = /\/cart|\/checkout|add.to.cart/i.test(html);
  sig.hasLiveChat = sig.tech.has('Intercom') || sig.tech.has('Drift') || sig.tech.has('Zendesk') || sig.tech.has('Gorgias') || sig.tech.has('Tidio');
  sig.hasBooking = sig.tech.has('Calendly') || sig.tech.has('Cal.com') || /book.?(?:now|a.?call|demo)/i.test(html);
  sig.hasTestimonials = /testimonial|review|case.study|\bclient\b|\btrust(ed)?.by\b/i.test(html);
  sig.loadsAnalytics = sig.tech.has('Google Analytics') || sig.tech.has('Meta Pixel') || sig.tech.has('Segment');

  // CTA button extraction — up to 10 buttons
  const btns = [...html.matchAll(/<(?:a|button)[^>]*>([^<]{2,60})<\/(?:a|button)>/gi)]
    .map(m => m[1].replace(/\s+/g, ' ').trim())
    .filter(t => t.length >= 3 && /^[A-Z0-9]/i.test(t) && !/^[\d\s,.-]+$/.test(t))
    .slice(0, 20);
  sig.cta = [...new Set(btns)].slice(0, 10);

  // Raw visible-text snippet — strip tags, collapse whitespace, cap at 3000 chars
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  sig.wordCount = text.split(/\s+/).length;
  sig.rawTextSnippet = text.slice(0, 3000);

  sig.tech = [...sig.tech];
  return sig;
}

// ─── LLM prompt construction ─────────────────────────────────────────────────
function buildPrompt(signals, extraPages, socialData) {
  const compact = {
    url: signals.url,
    title: signals.title,
    description: signals.description,
    ogType: signals.ogType,
    canonical: signals.canonical,
    language: signals.language,
    mobileViewport: signals.mobileViewport,
    hasStructuredData: signals.hasStructuredData,
    h1: signals.headings.h1,
    h2: signals.headings.h2.slice(0, 6),
    tech_stack: signals.tech,
    socials: signals.socials,
    top_ctas: signals.cta,
    links_internal: signals.links.internal,
    links_external: signals.links.external,
    forms: signals.forms,
    images: signals.images,
    has_pricing_page: signals.hasPricingPage,
    has_blog: signals.hasBlog,
    has_checkout: signals.hasCheckout,
    has_live_chat: signals.hasLiveChat,
    has_booking: signals.hasBooking,
    has_testimonials: signals.hasTestimonials,
    loads_analytics: signals.loadsAnalytics,
    emails_found: signals.contacts.emails.length,
    phones_found: signals.contacts.phones.length,
    word_count: signals.wordCount,
    text_sample: signals.rawTextSnippet.slice(0, 1200),
    additional_pages_sampled: (extraPages || []).slice(0, 2).map(p => ({
      url: p.url,
      title: p.html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1]?.trim() || null,
      snippet: p.html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 350),
    })),
    social_profile_snapshots: socialData || {},
  };

  return `You are GOATED — a ruthless AI revenue-loss auditor for online businesses. Your job: analyze the scraped site + social signals, estimate how much money they are LEAVING ON THE TABLE monthly, and produce a hard, tactical, money-focused audit across every revenue-affecting dimension of an online business.

ABSOLUTE RULES:
- EVERY number you output must be grounded in the signals below. Show the math inline in "reasoning" fields.
- If a signal is missing (e.g. no traffic data), explicitly note you are estimating from proxy signals (word count, tech stack, brand scale, H1/H2 tone, social presence) and give a confidence band.
- NO generic advice. Every finding must cite specific observed evidence ("Your H1 says X, CTA is Y, no live chat detected → this costs …").
- Tone: direct, tactical, numbers-heavy, no marketing fluff. You are a sales engineer + growth operator, not a copywriter.
- GOATED products you can recommend: AI Voice Agent (Vapi), SMS Reactivation + Missed-Call Rescue (Twilio), LinkedIn Outreach (Unipile), Website Chatbot (site-crawl grounded), Abandoned-Cart Recovery, Review Automation, SEO Content Engine (programmatic), AI Ads Copy Generator, Pricing Optimization, Referral Setup, Managed Service (full stack DFY).
- Commission is 13% flat on closed revenue sourced through the GOATED stack. Only mention it if the user explicitly asks pricing — otherwise defer to "scoped on the qualification call".

ANALYZE EVERY DIMENSION of their online business:

1. **TRAFFIC**: estimated monthly visitors (from scale cues — brand name, social presence if any, content depth, tech stack), bounce risk signals, mobile-readiness.
2. **CONVERSION**: H1/H2 clarity, CTA presence + language, form count, friction, checkout path, pricing transparency, trust signals.
3. **LTV / RETENTION**: recurring model cues, email capture presence, loyalty hooks, upsell mechanics in the content.
4. **SOCIAL / BRAND**: social profiles detected, reachability, follower hints, off-site authority. If NO social presence → call it out as a trust gap.
5. **SEO / ORGANIC**: blog present? canonical set? structured data? H1 count + keyword targeting? programmatic SEO opportunity?
6. **LOCAL / REVIEWS**: Google / Yelp / Trustpilot signals visible? If local-services and NO review integration → huge flag.
7. **TRUST / SOCIAL PROOF**: testimonials, logos, case studies, press, "trusted by".
8. **EMAIL CAPTURE**: newsletter forms, lead magnets, exit intent, modals — anything to convert cold traffic to a list.
9. **CHECKOUT / BOOKING FRICTION**: steps to buy / book, payment processor detected, missing payment options, abandonment rescue presence.
10. **PRICING STRATEGY**: public pricing page? tier structure? free trial? anchor pricing? "contact us" gatekeeping?
11. **UPSELL / CROSS-SELL**: bundle offers, order-bumps, post-purchase flows, rev-share / referral mechanics, higher-tier hooks.
12. **OUTBOUND READINESS**: phones/emails exposed (for a warm outbound angle), booking tech (Calendly/Cal.com), live chat, SMS opt-in.

Return STRICT JSON matching this shape (no markdown, no prose outside JSON):

{
  "business": {
    "name": "extracted or inferred brand name",
    "type": "one-liner what they do",
    "stage": "pre-revenue | early-revenue | scaling | enterprise",
    "modelGuess": "DTC | B2B-SaaS | B2B-Services | Marketplace | Agency | Local-Services | Ecom | Creator | Other",
    "primaryAudience": "who they sell to, one line",
    "estimatedMonthlyTrafficBand": "e.g. '<1K', '1K-10K', '10K-50K', '50K-250K', '250K+'",
    "estimatedMonthlyRevenueBand": "e.g. '<$10K', '$10K-$50K', '$50K-$250K', '$250K-$1M', '$1M+'",
    "revenueBandReasoning": "1-2 sentences on how you triangulated this from signals"
  },
  "scrapedSummary": "2-3 sentence honest description of what's on the site + social presence",
  "revenueLoss": {
    "monthlyLowEstimate": number,
    "monthlyHighEstimate": number,
    "annualLowEstimate": number,
    "annualHighEstimate": number,
    "reasoning": "plain-English math showing each contributor. e.g. 'no live chat at their traffic scale = $X/mo lost, no abandoned cart = $Y/mo, no SMS reactivation = $Z/mo, total $X+Y+Z to $Xmax+Ymax+Zmax'",
    "confidenceBand": "low | medium | high",
    "biggestSingleLeak": "one-liner naming the #1 issue and its $ impact"
  },
  "dimensions": [
    {
      "area": "Traffic | Conversion | LTV | Social | SEO | Local/Reviews | Trust | Email Capture | Checkout | Pricing | Upsell | Outbound Readiness",
      "score": 0-100,
      "observed": "what signals you actually saw",
      "gap": "what's missing or broken",
      "dollarImpactMonthly": number,
      "fixProduct": "GOATED product that plugs this hole",
      "priority": "P0 | P1 | P2"
    }
  ],
  "leaks": [
    {
      "title": "short punchy headline",
      "severity": "high | medium | low",
      "observed": "exact signals / quotes",
      "impact": "$ or % cost",
      "fixProduct": "GOATED product",
      "expectedLift": "quantified e.g. '+12% conversion' or '+$3K/mo recovered carts'",
      "timeToImplement": "e.g. '48 hours', '1 week', '30 days'"
    }
  ],
  "upsellOpportunities": [
    { "name": "product name", "why": "why this target specifically needs it", "priceRangeMonthly": "e.g. '$500-$2000'" }
  ],
  "outreachAngles": [
    { "channel": "voice | sms | linkedin | chatbot", "hook": "the exact opening line referencing specific observed signal", "value": "what you'd offer in 15 seconds" }
  ],
  "confidenceScore": 0-100,
  "oneLinePitch": "single cold-call opener referencing something specific from their site"
}

IMPORTANT:
- Return 6-10 entries in "dimensions" (cover every major area even if score is high — a high score is useful signal too).
- Return 4-7 "leaks" ranked by severity desc, then dollarImpact.
- Return 3-5 "upsellOpportunities".
- Return 3 "outreachAngles", one per channel when possible.
- Cite actual H1/H2/CTA text when relevant — quote them.
- If the business is too small / early-stage to justify upsells, say so honestly in scrapedSummary and downscale estimates.

SIGNALS:
${JSON.stringify(compact, null, 2)}`;
}

// ─── LLM call: Groq (primary) ────────────────────────────────────────────────
async function callGroq(prompt, apiKey) {
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are GOATED AI. Always return strict JSON matching the schema specified in the user prompt. No markdown, no prose outside the JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.35,
      max_tokens: 2600,
      response_format: { type: 'json_object' },
    }),
  });
  if (!resp.ok) throw new Error(`Groq ${resp.status}: ${await resp.text()}`);
  const j = await resp.json();
  const content = j?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq: empty response');
  return JSON.parse(content);
}

// ─── LLM call: Claude (fallback) ─────────────────────────────────────────────
async function callClaude(prompt, apiKey) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2600,
      system: 'You are GOATED AI. Return strict JSON matching the schema in the user prompt. No markdown, no prose outside the JSON. Begin your response directly with { and end with }.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!resp.ok) throw new Error(`Claude ${resp.status}: ${await resp.text()}`);
  const j = await resp.json();
  const text = j?.content?.[0]?.text;
  if (!text) throw new Error('Claude: empty response');
  // Strip any accidental code fences
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(clean);
}


// ─── Deterministic fallback report ───────────────────────────────────────────
// When every LLM provider is unavailable — most often the daily token cap, not
// an outage — we previously returned a bare 500. The scrape had already
// succeeded, so we were throwing away real findings and showing the visitor a
// failure on the public lead magnet.
//
// Shape matches the LLM schema exactly so AuditPage renders it unchanged.
// Nothing is invented: every finding names the signal that triggered it, the
// revenue range is explicitly a wide low-confidence band, and the response is
// flagged `degraded` so the UI can say the analysis is rule-based.
function deterministicAnalysis(signals) {
  const s = signals;
  const has = (v) => !!v;
  const dimensions = [];
  const leaks = [];

  const dim = (area, score, observed, gap, dollarImpactMonthly, fixProduct, priority) =>
    dimensions.push({ area, score, observed, gap, dollarImpactMonthly, fixProduct, priority });

  // Scale proxy. Word count and link graph are the only size signals we have
  // without an LLM, so the bands stay deliberately wide.
  const big = s.wordCount > 2000 || s.links.internal > 60;
  const mid = s.wordCount > 600 || s.links.internal > 20;
  const base = big ? 4000 : mid ? 1500 : 600;

  dim('Conversion', has(s.forms) || s.hasBooking ? 65 : 20,
    s.forms ? `${s.forms} form(s) on the page.` : 'No form or booking widget found.',
    s.forms || s.hasBooking ? 'Capture exists but no instant follow-up detected.' : 'No way to convert a visitor without phoning during business hours.',
    s.forms || s.hasBooking ? base : base * 2, 'Lead capture + AI receptionist', s.forms ? 'P1' : 'P0');

  dim('Trust', s.hasTestimonials ? 70 : 30,
    s.hasTestimonials ? 'Testimonials or reviews present.' : 'No testimonial or review section found.',
    s.hasTestimonials ? 'Proof present but not quantified.' : 'Nothing answers "why trust these people".',
    s.hasTestimonials ? Math.round(base * 0.3) : base, 'Review engine', s.hasTestimonials ? 'P2' : 'P1');

  dim('Email Capture', s.forms ? 60 : 15,
    s.forms ? 'A form exists that could capture email.' : 'No email capture anywhere on the page.',
    'Visitors who are not ready to buy leave with no way to be reached again.',
    Math.round(base * 0.6), 'Lead capture + nurture', 'P1');

  dim('Local/Reviews', Object.keys(s.socials || {}).length ? 60 : 25,
    `${Object.keys(s.socials || {}).length} social profile(s) linked.`,
    Object.keys(s.socials || {}).length ? 'Presence exists; consistency unverified.' : 'No off-site authority signals.',
    Math.round(base * 0.4), 'Brand presence setup', 'P2');

  dim('SEO', s.description && s.headings.h1.length ? 65 : 30,
    `${s.headings.h1.length} H1(s); meta description ${s.description ? 'present' : 'missing'}; structured data ${s.hasStructuredData ? 'present' : 'absent'}.`,
    s.description && s.headings.h1.length ? 'Basics present; depth unverified without rank data.' : 'Missing fundamentals that decide how they appear in search.',
    Math.round(base * 0.5), 'Technical SEO pass', 'P1');

  dim('Outbound Readiness', s.contacts.phones.length || s.contacts.emails.length ? 70 : 20,
    `${s.contacts.phones.length} phone(s), ${s.contacts.emails.length} email(s) published.`,
    s.contacts.phones.length ? 'Reachable, but after-hours handling is unknown.' : 'No published phone — the primary conversion path for a local business is missing.',
    s.contacts.phones.length ? Math.round(base * 0.4) : base * 2, 'AI receptionist', s.contacts.phones.length ? 'P1' : 'P0');

  dim('Traffic', s.mobileViewport ? 60 : 20,
    `Mobile viewport ${s.mobileViewport ? 'present' : 'absent'}; ${s.wordCount} words of content.`,
    s.mobileViewport ? 'Mobile-ready; performance unmeasured.' : 'Served desktop-only while most local search is on a phone.',
    s.mobileViewport ? Math.round(base * 0.3) : base * 2, 'Website rebuild', s.mobileViewport ? 'P2' : 'P0');

  const leak = (title, severity, observed, impact, fixProduct, expectedLift, timeToImplement) =>
    leaks.push({ title, severity, observed, impact, fixProduct, expectedLift, timeToImplement });

  if (!s.forms && !s.hasBooking)
    leak('No way to convert a visitor', 'high', 'No form and no booking widget found.',
      'Every ready-to-buy visitor must find a number and call during business hours.',
      'Lead capture + AI receptionist', 'Usually the single largest conversion gain on a site like this.', '1 week');
  if (!s.contacts.phones.length)
    leak('No phone number on the page', 'high', 'No phone number in the page markup.',
      'For a local service business the call is the sale, and there is no obvious way to place one.',
      'Tracked number + AI receptionist', 'Restores the primary conversion path.', '48 hours');
  if (!s.mobileViewport)
    leak('Not mobile-ready', 'high', 'No mobile viewport meta tag.',
      'The majority of local search traffic arrives on a phone.',
      'Website rebuild', 'Affects most of their traffic.', '2 weeks');
  if (!s.hasLiveChat)
    leak('No instant-response channel', 'medium', 'No live chat or messaging widget detected.',
      'Questions that would close a sale wait until someone checks email.',
      'AI chat + SMS follow-up', 'Recovers a share of undecided visitors.', '48 hours');
  if (!s.hasTestimonials)
    leak('No social proof', 'medium', 'No testimonial or review section detected.',
      'Nothing on the page establishes credibility.',
      'Review engine', 'Meaningful lift on high-consideration purchases.', '2 weeks');
  if (!s.loadsAnalytics)
    leak('Flying blind — no analytics', 'medium', 'No analytics script detected.',
      'They cannot tell which marketing spend works, so all of it continues.',
      'Tracking + reporting setup', 'Enables every other optimisation.', '48 hours');
  if (!Object.keys(s.socials || {}).length)
    leak('No social presence linked', 'low', 'No social profile links found.',
      'No off-site authority and no second touchpoint.',
      'Brand presence setup', 'Supporting trust signal.', '1 week');

  const monthlyLow = dimensions.reduce((a, d) => a + d.dollarImpactMonthly, 0);
  const monthlyHigh = Math.round(monthlyLow * 2.2);
  const highs = leaks.filter(l => l.severity === 'high');
  const modelGuess = s.hasCheckout ? 'Ecom' : s.contacts.phones.length ? 'Local-Services' : 'Other';

  return {
    business: {
      name: s.title || s.url,
      type: s.description || 'Not stated on the page.',
      stage: big ? 'scaling' : mid ? 'early-revenue' : 'pre-revenue',
      modelGuess,
      primaryAudience: 'Not determinable without AI analysis.',
      estimatedMonthlyTrafficBand: big ? '10K-50K' : mid ? '1K-10K' : '<1K',
      estimatedMonthlyRevenueBand: big ? '$50K-$250K' : mid ? '$10K-$50K' : '<$10K',
      revenueBandReasoning: `Estimated from content depth (${s.wordCount} words) and internal link count (${s.links.internal}) only — no traffic data available in rule-based mode.`,
    },
    scrapedSummary: `${s.title || s.url} — ${s.wordCount} words, ${s.forms || 0} form(s), `
      + `${s.contacts.phones.length} phone number(s), ${s.contacts.emails.length} email(s), `
      + `${Object.keys(s.socials || {}).length} social profile(s) linked. `
      + `Rule-based analysis from observed page signals; AI analysis was unavailable.`,
    revenueLoss: {
      monthlyLowEstimate: monthlyLow,
      monthlyHighEstimate: monthlyHigh,
      annualLowEstimate: monthlyLow * 12,
      annualHighEstimate: monthlyHigh * 12,
      reasoning: dimensions.filter(d => d.dollarImpactMonthly > 0)
        .map(d => `${d.area}: $${d.dollarImpactMonthly.toLocaleString('en-US')}/mo (${d.gap})`).join(' · ')
        + `. Scale base of $${base.toLocaleString('en-US')} derived from content depth and link count, not traffic data.`,
      confidenceBand: 'low',
      biggestSingleLeak: highs[0]?.title || leaks[0]?.title || 'No high-severity gaps detected from page signals.',
    },
    dimensions,
    leaks: leaks.slice(0, 7),
    upsellOpportunities: [
      { name: 'AI receptionist', why: 'Answers and books every call, including after hours.', priceRangeMonthly: '$750' },
      !s.forms && { name: 'Website + lead capture', why: 'No working conversion path on the current site.', priceRangeMonthly: '$250' },
      !s.hasTestimonials && { name: 'Review engine', why: 'No social proof on the page.', priceRangeMonthly: '$300' },
    ].filter(Boolean),
    outreachAngles: [
      { channel: 'voice',
        hook: highs.length
          ? `I pulled up ${s.title || 'your site'} — there are ${highs.length} things costing you calls right now.`
          : `I pulled up ${s.title || 'your site'} — one quick thing about how your calls get handled.`,
        value: 'Missed calls answered and booked automatically within 14 days.' },
      { channel: 'sms',
        hook: `Looked at ${s.title || 'your site'} — ${(leaks[0]?.title || 'a gap in how enquiries come in').toLowerCase()}.`,
        value: 'Two minutes to show what it is costing.' },
      { channel: 'chatbot',
        hook: `${s.hasLiveChat ? 'Your chat widget' : 'No chat on the site'} — visitors with questions have nowhere to go.`,
        value: 'AI chat that qualifies and books, live in 48 hours.' },
    ],
    confidenceScore: 55,
    oneLinePitch: leaks[0]
      ? `Noticed ${leaks[0].title.toLowerCase()} on ${s.title || 'your site'} — that is costing you jobs every week.`
      : `Had a look at ${s.title || 'your site'} — worth two minutes on how your calls get handled?`,
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const origin = getCorsOrigin(req);
  setHeaders(res, origin);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRate(ip)) return res.status(429).json({
    error: "You've run several audits in a row — give it about a minute and try again.",
    retryable: true,
  });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const rawUrl = body?.url;
  const norm = normalizeUrl(rawUrl);
  if (norm.error) return res.status(400).json({ error: norm.error, retryable: false });
  const url = norm.url;

  const GROQ_KEY = process.env.GROQ_API_KEY;
  const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY;
  if (!GROQ_KEY && !CLAUDE_KEY) {
    return res.status(500).json({
      error: 'The audit service is not fully configured yet. This is on our side, not your URL — try again shortly.',
      retryable: true,
    });
  }

  const startedAt = Date.now();

  let html;
  try {
    html = await fetchPage(url);
  } catch (e) {
    // 422, not 502. An unreachable or misspelled domain is bad input, not a
    // failure of this service — returning 5xx made every typo look like an
    // outage and showed the visitor a scary error on the public lead magnet.
    //
    // Each branch names what actually went wrong, because "Could not fetch
    // that site" gave the visitor nothing to act on.
    const host = (() => { try { return new URL(url).hostname; } catch { return url; } })();
    const msg = e?.message || '';
    const code = e?.cause?.code || '';
    let error, retryable = true;

    if (e?.httpStatus === 404) {
      error = `${host} is reachable, but that page doesn't exist (404). Try the homepage instead.`;
      retryable = false;
    } else if (e?.httpStatus === 401 || e?.httpStatus === 403) {
      error = `${host} blocked our scan (${e.httpStatus}). Sites behind a login or a strict firewall can't be audited.`;
      retryable = false;
    } else if (e?.httpStatus === 429) {
      error = `${host} is rate-limiting us. Wait a minute and try again.`;
    } else if (e?.httpStatus >= 500) {
      error = `${host} returned a server error (${e.httpStatus}). Their site is having trouble — try again later.`;
    } else if (e?.contentType) {
      const ct = e.contentType.split(';')[0].trim();
      error = ct && ct !== 'unknown'
        ? `That address returned ${ct}, not a web page. Point us at an HTML page — usually the homepage.`
        : "That address didn't return a web page. Point us at the site's homepage.";
      retryable = false;
    } else if (/abort/i.test(msg) || e?.name === 'AbortError' || code === 'UND_ERR_HEADERS_TIMEOUT' || code === 'UND_ERR_CONNECT_TIMEOUT') {
      error = `${host} took too long to respond. It may be slow or temporarily down — try again in a moment.`;
    } else if (code === 'ENOTFOUND' || code === 'EAI_AGAIN' || /getaddrinfo/i.test(e?.cause?.message || '')) {
      error = `We couldn't find a site at ${host}. Check the spelling — that domain doesn't appear to exist.`;
      retryable = false;
    } else if (/CERT|SSL|TLS/i.test(code) || /certificate/i.test(msg)) {
      error = `${host} has an invalid security certificate, so we couldn't connect safely.`;
      retryable = false;
    } else if (code === 'ECONNREFUSED') {
      error = `${host} refused the connection. The domain exists but nothing is serving a website on it.`;
      retryable = false;
    } else if (code === 'UND_ERR_SOCKET' || code === 'ECONNRESET') {
      error = `${host} closed the connection before responding. It's likely blocking automated visits.`;
    } else {
      error = `We couldn't load ${host}. It may be down or blocking automated visits.`;
    }
    return res.status(422).json({ error, url, retryable });
  }

  let signals;
  try {
    signals = extractSignals(html, url);
  } catch (e) {
    return res.status(500).json({
      error: 'We reached the site but could not read its structure. This is usually a very unusual page layout — try the homepage.',
      retryable: false,
    });
  }

  // Deep-crawl helpers are OPTIONAL enrichment, and they were what pushed heavy
  // sites past Vercel's 10s function ceiling — the page fetch, then extra pages,
  // then social profiles, then the LLM. Total ~8.5s on a content-heavy site, and
  // anything over budget returned 502, which is what "audit failed" looked like.
  //
  // Reserve time for the LLM call, which is the part that actually produces the
  // report. If the page fetch already ate the budget, skip enrichment and audit
  // the page alone — a thinner report beats a failed one.
  const LLM_RESERVE_MS = 5200;   // Groq typically answers in 3-5s
  const HARD_BUDGET_MS = 9000;   // stay inside the 10s platform cap
  const remaining = HARD_BUDGET_MS - (Date.now() - startedAt) - LLM_RESERVE_MS;

  let extraPages = [];
  let socialData = {};
  let enrichmentSkipped = false;

  if (remaining > 900) {
    const timeboxed = (p) => Promise.race([
      p,
      new Promise(resolve => setTimeout(() => resolve(null), remaining)),
    ]);
    const [extraPagesSettled, socialDataSettled] = await Promise.allSettled([
      timeboxed(fetchAdditionalPages(url, html)),
      timeboxed(fetchSocialSnippets(signals.socials)),
    ]);
    extraPages = (extraPagesSettled.status === 'fulfilled' && extraPagesSettled.value) || [];
    socialData = (socialDataSettled.status === 'fulfilled' && socialDataSettled.value) || {};
  } else {
    enrichmentSkipped = true;
  }

  const prompt = buildPrompt(signals, extraPages, socialData);

  let analysis = null;
  let llmUsed = null;
  let llmError = null;
  if (GROQ_KEY) {
    try { analysis = await callGroq(prompt, GROQ_KEY); llmUsed = 'groq:llama-3.3-70b'; }
    catch (e) { llmError = `Groq failed: ${e.message}`; }
  }
  if (!analysis && CLAUDE_KEY) {
    try { analysis = await callClaude(prompt, CLAUDE_KEY); llmUsed = 'anthropic:haiku-3.5'; }
    catch (e) { llmError = `${llmError || ''} | Claude failed: ${e.message}`; }
  }

  // Never fail the whole audit because the LLM tier is exhausted. We already
  // have real scraped signals — fall back to the rule-based report and label it.
  let degraded = false;
  if (!analysis) {
    analysis = deterministicAnalysis(signals);
    llmUsed = 'rule-based';
    degraded = true;
  }

  return res.status(200).json({
    ok: true,
    url,
    generatedAt: new Date().toISOString(),
    llm: llmUsed,
    degraded,
    // Surfaced so the UI can explain *why* the report is rule-based rather than
    // implying the site itself scored badly.
    degradedReason: degraded
      ? (/rate.?limit|quota|429|tokens per day|TPD/i.test(llmError || '')
          ? 'AI analysis is at its daily limit — showing rule-based findings from the live scan.'
          : 'AI analysis is temporarily unavailable — showing rule-based findings from the live scan.')
      : null,
    enrichmentSkipped,
    signals,     // include so the UI can show the "here's what we saw" transparency panel
    extraPages: extraPages.map(p => ({ url: p.url, bytes: p.html?.length || 0 })), // just metadata, not raw HTML
    socialData,  // { instagram: {...}, twitter: {...} } or {} if none
    analysis,
  });
}
