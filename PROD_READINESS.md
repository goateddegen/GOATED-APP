# GOATED — Production Readiness Tracker

Last updated: 2026-04-23
Owner: secrdev@gmail.com

Single source of truth for what's fake, what's broken, what needs keys, and what needs to be done before this app stops being a demo.

---

## 🟥 HARDCODED / FAKE DATA (needs real sources before prod)

| Surface | File | Issue | Fix |
|---|---|---|---|
| Lead DB | `src/hooks/useStore.js` | 250K+ PRNG-seeded leads | Set `APOLLO_API_KEY` → flip to real `/api/leads` feed |
| Lead scripts | `src/components/LeadDetail.jsx` | Template scripts (now optionally regeneratable via AI) | ✅ AI regen wired — still needs real Apollo leads to work on real data |
| Dashboard MRR | `src/pages/DashboardPage.jsx` | Pre-revenue $0 state (honest) | Populate when first Stripe charges land |
| Ticker | `src/components/Ticker.jsx` | BTC/ETH/SOL prices (real via CoinGecko); hardcoded SOL fallback `$198` | Remove hardcoded fallback, show `—` if API fails |
| TrendPulse live events | `src/pages/TrendsPage.jsx` | Partially hardcoded `LIVE_EVENTS` array alongside real feeds | Merge real `/api/trends` events into globe hotspots |
| AI Overlay intro stats | `src/components/AIOverlay.jsx` | Mentions "250K+ leads" (true for demo PRNG, but we say it's real) | Conditional on `APOLLO_API_KEY` — show actual count |
| Admin fake activities | `src/pages/AdminPage.jsx` | Some simulated sparklines remain | Replace with real Vercel Analytics + API health checks |
| Close Guide confidence | `src/components/LeadDetail.jsx` | Now derived from lead score (no fake progress ticks) | ✅ shipped |

---

## 🟧 INTEGRATIONS — STATUS MATRIX

| Service | Purpose | Key(s) needed | Status | Blocking? |
|---|---|---|---|---|
| **Groq** | Primary LLM (Llama 3.3 70B) | `GROQ_API_KEY` | Not set in Vercel env | YES — audit + chat fallback |
| **Anthropic** | Claude Haiku fallback / chat | `ANTHROPIC_API_KEY` | Set but eating personal usage | Critical — see cost plan |
| **Apollo.io** | Real lead database | `APOLLO_API_KEY` | Not set | YES — platform runs on demo PRNG otherwise |
| **Supabase** | Auth + persistent user data | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Not set | YES — no login = no saved work |
| **Stripe Connect** | Commission split + payouts | `STRIPE_SECRET_KEY`, `STRIPE_CONNECT_CLIENT_ID` | Not set | YES — can't take money |
| **Vapi** | Outbound AI calls | `VAPI_API_KEY` | Not set | NO (Phase 2) |
| **Twilio** | Cold SMS + call routing | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, from-number | Not set | NO (Phase 2) |
| **Unipile** | LinkedIn outreach automation | `UNIPILE_API_KEY`, `UNIPILE_ACCOUNT_ID` | Not set | NO (Phase 2) |
| **Cal.com** | Booking embed | Public embed URL | Configured in client | ✅ |
| **CoinGecko** | Market data | None (public) | ✅ Live |
| **CryptoCompare** | Crypto news | None (public) | ✅ Live |
| **Fear & Greed Index** | Sentiment ticker | None (public) | ✅ Live |
| **Kalshi / Polymarket** | Prediction markets | None (public) | ✅ Live |

---

## 🟨 KNOWN BROKEN / QUIRKY (pre-prod patches)

| Severity | Surface | Issue | Status |
|---|---|---|---|
| HIGH | DNS | `goated.solutions` suspended — Namecheap contact verification | Needs user to click verification email |
| MED | Sidebar | Width transition can flash on slow devices | Acceptable — no fix scheduled |
| MED | TrendsPage globe | Auto-rotation can disorient on click | Disabled by default per plan |
| LOW | AIOverlay | 96KB chunk lazy-loads on first open (~300ms delay) | Acceptable trade-off |
| LOW | Cursor | Custom cursor hover detection disabled to reduce reflow | Shipped |
| LOW | Keybind hint bar | Z-index raised to 60 to clear sidebar | ✅ Shipped |

---

## 🟩 SECURITY / OPSEC — STATUS

| Control | Status | Notes |
|---|---|---|
| CORS whitelist per endpoint | ✅ All 12 endpoints | See `api/_lib/guard.js` |
| Per-IP rate limiting | ✅ On audit, chat, goated-ai, intelligence, plays, sentiment, trends, leads | 10–30/min depending on cost |
| Daily LLM budget cap (per instance) | ✅ plays/sentiment/trends (200–300 calls/day) | In-memory — needs Redis for multi-instance |
| Body size cap | ✅ Default 50KB via guard | |
| Security headers (XFO, nosniff, referrer) | ✅ Via guard | |
| CSP | Partial — only on `api/chat` | TODO: apply globally |
| HSTS | Vercel default | ✅ |
| Secrets in env (never committed) | ✅ | `.env.example` is the template, `.env` gitignored |
| Webhook signature verification | N/A (no webhooks yet) | Needed when Stripe added |
| User auth | ❌ Not wired | Blocked on Supabase |
| Cloudflare / WAF layer | ❌ | Recommended before public launch |

---

## 🟦 CLEAN HYGIENE ITEMS

- [x] Remove Phantom wallet imports, SDK, UI
- [x] Archive dead `CasinoPage.jsx` + `MarketPage.jsx` to `_deleted_pages/`
- [x] Strip voice-chat marketing copy from AI Overlay intros
- [x] Remove CSV export from LeadsPage
- [x] Remove "Copy Trade" references
- [x] Remove VoIP call button from LeadDetail header
- [x] Remove AI Voice Brief from LeadDetail
- [x] Remove `FloatingParticles` from HomePage (perf killer)
- [ ] Remove hardcoded `LIVE_EVENTS` array in TrendsPage (merge with real `/api/trends`)
- [ ] Remove `Ticker` SOL hardcoded fallback `$198`
- [ ] Remove `api/_health.js.bak`, `api/_voip.js.bak`, `api/_webhook.js.bak` once confirmed unused

---

## 🟪 MISSING FEATURES TO REACH PROD

- [ ] Supabase auth (Google + GitHub OAuth buttons already coded — needs keys)
- [ ] Stripe Connect Express onboarding flow (partial)
- [ ] Webhook handler for Stripe events (`charge.succeeded`, `transfer.paid`, `account.updated`)
- [ ] Real Apollo integration with pagination + filters
- [ ] User dashboard with real metrics (tied to Stripe + Supabase)
- [ ] Email delivery (SendGrid / Resend) for outreach sends
- [ ] Audit PDF export (via `react-pdf` or serverless Puppeteer)
- [ ] Managed Service application → Airtable/Supabase table + Slack webhook
- [ ] 1099-K reporting (Stripe generates, but needs UI surface)

---

## 🟫 BACKLOG / NICE-TO-HAVE

- [ ] Mobile-responsive sweeps on LeadsPage + TrendsPage
- [ ] Service worker for offline lead access
- [ ] Saved-searches feature
- [ ] CRM export (HubSpot, Salesforce)
- [ ] Team seats / multi-user accounts
- [ ] A/B test framework for pricing page (once pricing is public-facing)

---

## ✅ SHIPPED (historical record)

- 2026-04-22: Phantom → Stripe wallet rewrite
- 2026-04-22: HomePage Gen Z Business OS reframe (pricing hidden)
- 2026-04-22: ManagedPage application form (no public tiers)
- 2026-04-23: Audit API v2 — 12 dimensions, social snapshots, secondary page crawl
- 2026-04-23: LeadDetail revenue-loss-first layout + keybind z-index fix
- 2026-04-23: AI chat system prompt tightened (60-word cap), nav router extended
- 2026-04-23: AIOverlay lazy-loaded (96KB chunk deferred from initial bundle)
- 2026-04-23: Selective Zustand selectors on LeadDetail / LeadsPage / HomePage
- 2026-04-23: Shared API guard (`api/_lib/guard.js`) — rate limit + body cap + daily LLM budget
- 2026-04-23: Voice chat marketing copy stripped from AI intros
- 2026-04-23: Dead `CasinoPage` + `MarketPage` archived
