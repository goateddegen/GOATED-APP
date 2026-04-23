# GOATED — Monday Launch Ops Doc

Single source of truth for what ships Monday, what env vars need setting, and how money actually moves.

---

## 1. Master Wallet Routing — what's wired vs what's pending

### Phantom (Solana) — READ-ONLY, WORKS
- `src/pages/WalletPage.jsx` already detects Phantom, connects, reads SOL balance + tx history.
- No secret keys needed client-side (window.solana provider).
- **What works:** connect, show balance, show transactions.
- **What's pending:** sending SOL (requires signed tx flow — can add when payouts demand it).

### Plaid (Bank) — STUBBED
Currently shows an alert telling the user to set env vars. To enable:
1. Create a Plaid account → get sandbox keys.
2. Add to Vercel env:
   - `PLAID_CLIENT_ID`
   - `PLAID_SECRET`
   - `PLAID_ENV` → `sandbox` or `production`
3. Create `api/plaid-link-token.js` that calls `/link/token/create` (server-side — keeps secret out of client).
4. Wire the "Connect Bank" button to exchange the public token and store the access_token in Supabase once auth is live.

### Stripe (Card) — STUBBED
Currently shows an alert. To enable:
1. Create a Stripe account → get API keys.
2. Add to Vercel env:
   - `STRIPE_PUBLISHABLE_KEY` (client-side safe)
   - `STRIPE_SECRET_KEY` (server-side only)
3. Create `api/stripe-intent.js` for payment intents.
4. Wire the Stripe Elements form on the wallet page.

### Payout flow design (spec, not built)
1. Deal closes in Closer OS → event logged with `dealValue` and `commission = dealValue * 0.12`.
2. Platform fee auto-deducted; net routes to user's **Master Wallet**.
3. User chooses payout rail: Phantom (SOL, instant), Plaid (bank, 1-3d), or Stripe (card refund, same day).
4. Webhook confirms settlement → in-app notification fires via `src/utils/notifications.js`.

**Build priority:** Phantom send-tx → Stripe → Plaid. Don't ship Plaid Monday.

---

## 2. Env Vars — Vercel setup checklist

Set these in the Vercel dashboard under the project's **Settings → Environment Variables**. Most are optional; app degrades gracefully without them.

### Required for Monday
| Key | Purpose | Required |
|-----|---------|----------|
| `ANTHROPIC_API_KEY` | Claude Haiku for `/api/chat` and `/api/plays` | YES — AI chat is a pillar |
| `VITE_SUPABASE_URL` | Supabase project URL | YES — for auth |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | YES — for auth |

### Optional — unlocks better data
| Key | Purpose |
|-----|---------|
| `COINGECKO_API_KEY` | Higher rate limit on price data |
| `APOLLO_API_KEY` | Real leads instead of PRNG demo |
| `CRYPTOCOMPARE_API_KEY` | Crypto news feed |
| `CRON_SECRET` | Protects scheduled endpoints |

### Later — payout rails
| Key | Purpose |
|-----|---------|
| `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY` | Card payouts |
| `PLAID_CLIENT_ID` + `PLAID_SECRET` + `PLAID_ENV` | Bank payouts |

### Setting via CLI (faster than dashboard for batch)
```bash
vercel env add ANTHROPIC_API_KEY production
vercel env add VITE_SUPABASE_URL production
# ... repeat
vercel --prod   # redeploy to pick up new env
```

---

## 3. Namecheap / DNS — USER ACTION REQUIRED

The domain `goated.solutions` is **suspended due to contact verification**. No code fix — you must:
1. Log into Namecheap → check email for the ICANN/Namecheap verification link.
2. Click the verification link. (Also check spam / junk.)
3. If no email: Namecheap Dashboard → Domain List → `goated.solutions` → **Resend Verification**.
4. Domain is NOT expired (expires Mar 19, 2027) — just needs contact verification.

### Once verified — point DNS at Vercel
In Namecheap's Advanced DNS panel:
- `A` record, host `@`, value `76.76.21.21`
- `CNAME` record, host `www`, value `cname.vercel-dns.com`

Then in Vercel:
- Project → Settings → Domains → Add `goated.solutions` → confirm DNS is propagating.

DNS typically propagates in 15-60 min. Use `dig goated.solutions` to verify.

### Production URL today
`goated-app-nine.vercel.app` is the live deployment. Use this for the Monday launch if DNS isn't verified in time — nobody cares about the subdomain once the product is good.

---

## 4. Monday GTM Plan (v1)

### Pre-launch (tonight → Monday AM)
- [ ] Ship current build to prod (`vercel --prod`)
- [ ] Smoke test all 3 pillars on production domain:
  - Alpha Radar loads globe, fetches F&G + coins + news, generates plays
  - Closer OS renders 500K leads, infinite scroll, search works, AI chat responds
  - Master Wallet detects Phantom, shows $0 revenue state truthfully
- [ ] Verify build + console clean — zero errors
- [ ] Send Anthropic API key to prod env (non-optional)
- [ ] Push notifications permission prompt fires after 15s (user can grant or dismiss)

### Monday AM launch post (Twitter/X + LinkedIn)
**Hook:** "I built the money-printing OS I wish existed. $0 upfront. Wolf mode on by default."

**Thread:**
1. Problem: closers pay rent to 5 different tools and still lose deals
2. Solution: 3 pillars collapsed into one OS
   - ALPHA RADAR — globe of real-time market plays
   - CLOSER OS — 500K targets, AI scripts, push alerts
   - MASTER WALLET — every closed deal routes here, instant SOL payout
3. Model: $0 upfront. 12% fee only on closed deals. 15% on whales.
4. Try it: [URL]
5. Don't buy another subscription. Start closing.

### Distribution channels (first 48 hrs)
- X/Twitter: thread + 3 standalone money-shots (globe, AI chat, wallet)
- LinkedIn: a longer-form version, tag it as "we're hiring closers"
- Reddit: r/sales (careful — no link in first post, hint at tool), r/cryptocurrency (alpha angle)
- IndieHackers launch post — ship $0 story
- ProductHunt scheduled for Tuesday (builds Monday traffic first)

### Creator / affiliate program (week 2)
- 10% referral commission on successful sign-ups that close a deal in 30 days
- Target: top 20 "closing bro" / day-trader content creators
- Signup form + unique referral codes — needs Supabase auth first

### Metrics to watch
- Sign-ups (needs Supabase live)
- Time-to-first-signal (how long after signup does a user see a real alpha play?)
- Push notification opt-in rate (target: 60%+)
- Wolf mode stickiness (target: 80%+ keep it on)

---

## 5. Must-ship-before-Monday shortlist

| Priority | Item | Status |
|---|---|---|
| P0 | TrendPulse → ALPHA RADAR (globe-only) | DONE |
| P0 | AI chat perf + no crash | DONE |
| P0 | Wolf mode default + CHILL rename | DONE |
| P0 | Homepage no-competitor-mention pitch | DONE |
| P0 | Lazy lead generation (no boot freeze) | DONE |
| P0 | Notifications system | DONE (needs live testing) |
| P1 | Supabase auth wired | PENDING (needs user env vars) |
| P1 | DNS verified → goated.solutions live | PENDING (user action) |
| P2 | Stripe payout rail | LATER |
| P2 | Plaid payout rail | LATER |
| P2 | Creator / affiliate program | Week 2 |

---

*Last updated: Monday launch build.*
