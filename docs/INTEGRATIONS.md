# GOATED — Integrations & Production Readiness

**Version:** v7.5
**Last updated:** 2026-04-24
**Audience:** Tarek (operator) — copy-paste setup guide

---

## How this document works

Every integration is tagged with one of:

- 🟢 **REQUIRED** — app won't function without it
- 🟡 **RECOMMENDED** — needed for production close-the-loop, can defer 1-2 weeks
- ⚪ **OPTIONAL** — nice-to-have, only when scaling
- ❌ **REMOVED** — gone in v7.5, do not wire

When the **🟢 REQUIRED** keys are set + `VITE_LAUNCH_READY=true`, the app flips from cover page to live mode automatically.

---

## 0. Launch flag — flip the cover off

```env
VITE_LAUNCH_READY=true
```

🟢 **REQUIRED to go live.** Until this is set, every visitor sees the cover page. Set it in Vercel → Project → Settings → Environment Variables → Production scope. Then **redeploy** (the build picks up env vars at compile time for `VITE_*` keys).

**Local preview without flipping live:** open browser console on the cover page and run `localStorage.setItem('goated_operator_preview','1')` then refresh. (Or append `?preview=1` to the hash.)

### What the cover page shows (v7.5.2)

- Oversized 3D goat head with cursor tracking — the only interactive element
- "GOATED" wordmark with red→orange→amber animated gradient (degen palette)
- Tiny subtext: "Probably the greatest thing that's ever happened to small business."
- Two soft halos (red top-left, orange bottom-right) breathing on different cycles
- 70 drift particles tinted on the same warm gradient
- Footer pip: `v7.5 · private · access by application`
- **No email capture, no CTA, no marketing copy.** Pure aesthetic gate.

The audit route (`/#/audit` and `/#/for/{slug}`) **stays public even before launch flag flips** — it's the lead magnet you send prospects directly. They see the audit, you don't have to expose the rest of the app.

---

## 1. AI providers (the audit + chat brain)

### 1A. Groq (PRIMARY — free, fast)

🟢 **REQUIRED for audit.** Llama 3.3 70B in JSON mode — sub-second responses, free tier 30M tokens/mo.

**Sign up:** https://console.groq.com/signup
**Get key:** https://console.groq.com/keys → "Create API Key" → copy
**Vercel env:**
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
```
**Cost:** $0/mo on free tier. Hard rate-limit at 30M tokens/mo (≈3000 audits).

### 1B. Anthropic Claude (FALLBACK + AI overlay)

🟢 **REQUIRED for AI chat overlay** (the right-side AI panel uses Haiku 3.5).
🟡 **Recommended fallback for audit** if Groq rate-limits.

**Sign up:** https://console.anthropic.com/
**Get key:** https://console.anthropic.com/settings/keys → "Create Key"
**Add credit:** Settings → Billing → at least $5 to unlock production usage
**Vercel env:**
```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxx
```
**Cost:** Haiku 3.5 = $0.80/M input + $4/M output tokens. ~$5-15/mo for solo agency usage.

---

## 2. Supabase (auth + persistence)

🟡 **REQUIRED for accounts.** Sign-in is optional. Home, the audit, leads, outreach (call, SMS, scripts), and GOATED AI work with no session. The dashboard and admin pages ask you to sign in. Saved leads (`/api/leads?source=saved`) and cloud sync of the operator's own data also require a session. Without these keys, the Account button cannot sign anyone in, and nothing is persisted to a user.

**Sign up:** https://supabase.com/ → "Start your project" (free)
**Create project:** Pick a region (US East), set a strong DB password, wait 90 sec
**Get keys:** Project Settings → API → copy these 3:
```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...long-jwt
SUPABASE_SERVICE_KEY=eyJhbGciOi...different-long-jwt
```
**SQL setup (run in Supabase SQL Editor):**
```sql
-- Auth users table is auto-created. Add a profile table:
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  plan text default 'free',
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "users see own profile" on profiles for select using (auth.uid() = id);
create policy "users update own profile" on profiles for update using (auth.uid() = id);

-- Closes table for tracking commission-eligible closes:
create table public.closes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  client_name text,
  deal_value numeric,
  commission_amount numeric,
  status text default 'pending',
  stripe_payment_intent text,
  closed_at timestamptz default now()
);
alter table public.closes enable row level security;
create policy "users see own closes" on closes for select using (auth.uid() = user_id);
create policy "users insert own closes" on closes for insert with check (auth.uid() = user_id);
```

**OAuth setup (Google only):**
- Authentication → Providers → Google → enable, paste the OAuth client ID + secret from https://console.cloud.google.com/apis/credentials
- The Account modal offers Google and nothing else. Email/password and GitHub were removed from the UI.
- Redirect URL: the production origin (`https://www.goated.solutions`) and `http://localhost:5173` for local sign-in. Supabase sends the user back to `window.location.origin`.

**Cost:** Free tier — 50K MAU + 500MB DB. More than enough for v1.

---

## 3. Stripe (collect money)

🟢 **REQUIRED to charge clients.** No money in without this.

### 3A. Stripe account + API key

**Sign up:** https://dashboard.stripe.com/register
**Verify:** Add bank account, business details (sole prop is fine — pick "Individual / Sole Proprietorship")
**Get keys:** Developers → API keys → "Reveal live key" (start with test keys, switch when ready)
```env
# TEST mode (safe for development):
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx

# LIVE mode (when ready to charge real money):
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3B. Payment Links (v1 — what you're using Monday)

**Create your first link:** Payments → Payment Links → "New" → set up:
- Product: "GOATED Setup Fee" — $1,500 one-time
- Add another product on same link: "GOATED Monthly Retainer" — $2,500 recurring monthly
- Subscription: 3-month minimum
- Save the URL → that's your closer link, send to every closing client

**Send via SMS/email after sales call:**
```
Hey [Name], here's the link to lock it in: https://buy.stripe.com/xxx
$1,500 setup + $2,500/mo, 30-day refund. Takes 30 seconds. Once it clears I'll kick off onboarding tomorrow.
```

### 3C. Stripe Webhooks (for tracking real revenue in dashboard)

🟡 **RECOMMENDED week 2.** Until then, manually mark closes in the app.

**Setup:** Developers → Webhooks → "Add endpoint":
- URL: `https://goated-app-nine.vercel.app/api/stripe-webhook` (build this when needed)
- Events: `checkout.session.completed`, `invoice.paid`, `payment_intent.succeeded`
**Get signing secret:**
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3D. Stripe Connect (v2 — automatic commission split)

⚪ **OPTIONAL, after $30K MRR.** Lets clients pay you and have a slice auto-routed to a partner/contractor.

**Setup later:** Connect → Settings → enable Express accounts. Wire `application_fee_amount` on each PaymentIntent.

**Cost:** Stripe takes 2.9% + $0.30 per US card transaction (paid by client through pricing). Connect adds 0.25% + $2/account/mo for active connected accounts.

---

## 4. Apollo.io (real B2B leads)

🟡 **RECOMMENDED week 1.** Replaces seeded demo leads with real prospect data.

**Sign up:** https://apollo.io/sign-up (free tier: 50 emails/day, 10K credits/mo)
**Get key:** Settings → Integrations → API → Generate
```env
APOLLO_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
```
**Cost:** Free tier covers solo agency for 60+ days. $99/mo when scaling beyond 50/day.

**What this unlocks:** When set, `/api/leads` returns real Apollo prospect data instead of seeded PRNG demo leads. Until set, the demo data still works — labeled "Demo Data" in the UI.

---

## 5. NewsAPI / CryptoCompare (TrendPulse data)

⚪ **OPTIONAL.** TrendPulse currently runs on free public APIs:
- CoinGecko (no key needed)
- CryptoCompare news (no key needed)
- Fear & Greed (no key needed)

You can wire a NewsAPI key for general business news, but it's not blocking. Skip until you want to repurpose TrendPulse → BizPulse (regional industry signals for B2B targeting).

**If you want it later:**
**Sign up:** https://newsapi.org/register (free 100 requests/day for development)
```env
NEWSAPI_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 6. Email infrastructure (cold outreach)

⚪ **OPTIONAL — week 2 setup.** Email is your secondary channel; phone is primary.

### 6A. Resend (transactional + cold outbound)

**Sign up:** https://resend.com/ (free tier: 3,000 emails/mo, 100/day)
**Get key:** API Keys → "Create API Key" (full access)
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 6B. Smartlead.ai (email warmup for cold outbound)

**Sign up:** https://smartlead.ai/ ($39/mo — best per-dollar value)
**Setup:** Connect 3 inboxes from your cold-outreach domain (NOT goated.solutions — use a separate domain like `getgoated.com` to protect your main domain reputation). Run warmup for 14 days before any cold send.

**Cost:** $39/mo (10 warmed inboxes) → cancellable monthly

---

## 7. Phone / SMS infrastructure

🟡 **RECOMMENDED week 1.** Phone is your primary channel.

### 7A. Google Voice (FREE, start here)

**Sign up:** https://voice.google.com/ (need a Gmail account)
**Get number:** Pick a metro area code that matches your prospect city
**Repeat:** Create 2-3 more Gmail accounts for 2-3 more numbers in different area codes
**Cost:** $0/mo for personal use. No A2P registration needed at solo scale.

**Forward to your iPhone:** Settings → Calls → forward to your real number

### 7B. OpenPhone (PRODUCTION when revenue starts)

**Sign up:** https://www.openphone.com/ ($19/mo)
**Setup:** Get one shared number per metro you target. Set business hours, auto-text on missed call, transcript voicemail, native iMessage.
**Cost:** $19/mo per user. Worth every penny once you're closing $5K+ deals.

---

## 8. CORS allow-list (security)

The app's API endpoints have a hardcoded CORS allow-list in `api/_lib/guard.js`:
```
goated-app-nine.vercel.app  ← keep
www.goated.solutions        ← keep (custom domain when DNS resolved)
goated.solutions            ← keep
localhost:5173              ← dev
localhost:5174              ← dev
```

If you add a new custom domain (e.g., `getgoated.com`), edit `api/_lib/guard.js` and add it to `ALLOWED_ORIGINS`. Browsers from any origin not on this list will get CORS errors hitting `/api/*`.

**Why this matters:** prevents random scrapers from burning your Anthropic/Groq budget by hitting your API from their domain.

---

## 9. Active API surface (what's deployed)

| Endpoint            | Purpose                              | Required keys                     |
| ------------------- | ------------------------------------ | --------------------------------- |
| `/api/audit`        | URL crawl + LLM revenue audit        | `GROQ_API_KEY` OR `ANTHROPIC_API_KEY` |
| `/api/chat`         | AI overlay (Claude Haiku)            | `ANTHROPIC_API_KEY`               |
| `/api/dashboard`    | Pipeline analytics                   | none (works on demo data)         |
| `/api/goated-ai`    | Custom RSI/MACD analysis engine      | none                              |
| `/api/intelligence` | TrendPulse intelligence aggregator   | none                              |
| `/api/leads`        | Lead enrichment                      | `APOLLO_API_KEY` (optional)       |
| `/api/market-data`  | Crypto price snapshot (CoinGecko)    | none                              |
| `/api/plays`        | AI alpha plays (TrendPulse)          | `ANTHROPIC_API_KEY`               |
| `/api/sentiment`    | News + Fear&Greed aggregator         | none                              |
| `/api/trends`       | TrendPulse aggregator                | none                              |

**10/12 Hobby plan slots used.** Two free for `/api/stripe-webhook` and `/api/supabase-bridge` when you wire them.

---

## 10. Removed in v7.5 (DO NOT re-add)

❌ **Phantom wallet (`@solana/web3.js`)** — read-only Solana wallet. Useless for B2B agency. Removed from package.json next prune.
❌ **Kalshi API (`/api/kalshi`)** — prediction market. Moved to `_api-disabled/`. Saves 1 function slot.
❌ **Polymarket API (`/api/polymarket`)** — prediction market. Moved to `_api-disabled/`. Saves 1 function slot.
❌ **Casino page** — fake bets/P&L. Removed earlier in v7.x.
❌ **VoIP / Twilio voice** — never properly implemented. Use native `tel:` links + your Google Voice number.
❌ **AI Voice Brief** — speech synthesis. Sounded bad, removed earlier.

---

## 11. Security hardening (paramount, per your note)

### Accounts (optional)

Sign-in is Google via Supabase. It is not required to use the product.

✅ **Open with no account:** home, audit (including a new scan and a shared `#/a/{id}` report), leads, a lead's overview, call / SMS / scripts, and GOATED AI.
✅ **Account wall:** the dashboard page and the admin page. Admin also requires an email on `ADMIN_EMAILS`. A signed-in non-admin is sent home and never sees the admin tools.
✅ **Account-bound data, not a page wall:** `GET /api/leads?source=saved` returns 401 without a session. A signed-in Places search is saved under that user; an anonymous search is returned and not stored. Cloud sync starts only after a session exists. `GET /api/audit?inbound=1` is 403 unless the caller is an allow-listed admin.
✅ **Cover page is separate.** `VITE_LAUNCH_READY` hides the app before launch. A signed-in user, an in-progress Google redirect, operator preview, and a saved audit link bypass that cover. Flipping the cover off does not turn sign-in into a requirement.

### Rate limiting (already wired)

Every API endpoint behind `api/_lib/guard.js`:
- IP-based sliding window (10-30 req/min depending on endpoint)
- Daily LLM budget cap (prevents runaway Anthropic spend)
- Body size cap (prevents large-payload DoS)

### What you should also do (manual):

1. **Vercel: enable Deployment Protection** — Project Settings → Deployment Protection → "Vercel Authentication" for previews (so random people can't snoop preview deploys)
2. **Vercel: rotate any leaked keys** — if a key was ever committed, rotate immediately
3. **Supabase: enable RLS on every table** — already done in the SQL above. Don't disable.
4. **Stripe: enable test mode webhook signing** — never trust unsigned webhooks
5. **Domain: set up DMARC + SPF + DKIM** — required for cold email + protects domain from spoofing
6. **Never commit `.env` files** — `.gitignore` already excludes them. Verify with `git ls-files | grep .env`

### Sensitive surfaces to never expose in client bundle

The following must NEVER be `VITE_*` (those are public):
```env
ANTHROPIC_API_KEY      # server-side only
GROQ_API_KEY           # server-side only
STRIPE_SECRET_KEY      # server-side only
STRIPE_WEBHOOK_SECRET  # server-side only
SUPABASE_SERVICE_KEY   # server-side only
APOLLO_API_KEY         # server-side only
RESEND_API_KEY         # server-side only
NEWSAPI_KEY            # server-side only
```

OK to expose (`VITE_*` prefix bakes them into the client bundle):
```env
VITE_LAUNCH_READY      # public flag
VITE_SUPABASE_URL      # public, designed to be in client
VITE_SUPABASE_ANON_KEY # public, RLS-gated, designed to be in client
```

---

## 12. The 30-minute setup checklist (do this Sunday night)

```
[ ] 5 min  — Sign up Groq, get free API key
[ ] 5 min  — Sign up Anthropic, add $5 credit, get key
[ ] 5 min  — Sign up Supabase, create project, copy 3 keys
[ ] 5 min  — Run the SQL above in Supabase SQL Editor
[ ] 5 min  — Sign up Stripe, get test API keys, create one Payment Link
[ ] 5 min  — Paste all keys into Vercel → Settings → Environment Variables
[ ] 5 min  — Set VITE_LAUNCH_READY=true in Vercel
[ ] 5 min  — Click "Redeploy" on Vercel
─────────────────────────────────────────────
Total: 35 min. Cost: $5 (Anthropic credit). Result: live private app, secured, ready.
```

---

## 13. What "ready for production" actually means

The cover page falls away when:

1. ✅ Build succeeds (Vercel green)
2. ✅ `VITE_LAUNCH_READY=true` is set
3. ✅ At least Anthropic OR Groq key is set (audit works)
4. ✅ Supabase keys set (Google sign-in works; dashboard, admin, and saved data can attach to a user)
5. ✅ Stripe key set (you can collect money)

That's the minimum bar. Apollo, Resend, Smartlead are all weeks 2-4. Don't gold-plate before you've closed deal #1.

---

## 14. What to remove from package.json next prune (v7.6)

```json
// candidates for removal once unused:
"@solana/web3.js"           // Phantom wallet, dead in v7.5
"@reown/appkit"             // Web3 modal, dead
"@reown/appkit-adapter-solana"  // Web3 modal adapter, dead
"@solana/wallet-adapter-react"  // Solana wallet adapter, dead
```

**Net bundle savings: ~180KB gzipped.** Big win for first-paint perf on the cover page.

---

*Owner: secrdev@gmail.com · Repo: github.com/goatedfuckingdegen/GOATED-APP · Live: goated-app-nine.vercel.app*
