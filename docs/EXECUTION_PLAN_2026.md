# GOATED — 2026 Execution Plan (Consolidated)
**Version:** v7.3 · **Locked date:** 2026-04-24 · **Owner:** secrdev@gmail.com

> One living doc for what we're building, why, how we close, and what's left before we take money.
> Replaces scattered strategy docs for operational decision-making. Strategy docs (`GTM_STRATEGY.md`, `100K_MRR_MASTERPLAN.md`, `VIRAL_GROWTH_PLAN.md`) remain as historical reference.

---

## 1. The pitch (30 sec)

> "GOATED is an AI sales engine for B2B founders. We bring you high-intent leads, run your outreach through your own number and email, and only charge **13% flat on closed revenue**. No subscription. No setup fee. We eat when you eat."

**Core product:** AI-curated lead intelligence + done-with-you outreach + closing tools (scripts, coach, deal tracking).
**Secondary surface:** TrendPulse — real-time alpha radar (markets, sentiment, geo-flows) that links directly to B2B lead clusters in the same region. Every alpha insight surfaces a revenue angle.

---

## 2. Commission is locked at 13% flat

- 13% of **closed revenue** sourced through the GOATED stack.
- Single source of truth: `src/lib/config.js` → `PRICING.commission.flat = 13`
- After Stripe rails (~3.2%) + dispute reserve (~0.5%) → net take **≈ 9.8%**.
- Benchmarks: Belkins ~15%, Martal ~15%, Operatix ~18–20%, CIENCE ~$6k/mo flat. We're the cheapest pure-performance B2B sales infra.
- Rationale for flat (not tiered): simpler sell, no negotiation surface, customer math is one click. Earlier tiered "12% platform + 3% rails" rejected.
- Managed Service tier (for $100k+ ACV enterprise): retainer + setup + 10–15% rev-share, **negotiated case-by-case**. Not in self-serve path.

---

## 3. ICP (who we close first)

**Tier 1 — land first 25 customers here:**
- B2B SaaS founders, $500k–$5M ARR, US/CA, team < 20
- Crypto-adjacent B2B infra (wallets, analytics, compliance) — aligns with our TrendPulse surface
- Agencies / fractional CMO shops managing < 10 clients
- Sales-led early-stage startups not yet on Apollo/ZoomInfo

**Why these segments:**
- They have revenue to pay commission on closed deals
- They haven't built in-house SDR teams yet
- Their ICPs are in GOATED's lead graph (tech, finance, ops)
- They tolerate a "commission on results" model (vs enterprise demanding predictable opex)

**Out of scope year 1:** pure B2C, healthcare regulated verticals, government, non-English-first, <$20k ACV deals.

---

## 4. Product readiness — what's real, what's demo

| Surface | Status | Real data? | Notes |
|---------|--------|-----------|-------|
| Lead DB | 🟥 Demo | PRNG 250K | Flip to Apollo on `APOLLO_API_KEY` set |
| Lead scripts | 🟧 Templates + AI regen | Works on real data once lead DB is live |
| Dashboard MRR | ✅ Honest pre-revenue $0 | Populate on first Stripe charge |
| AI chat (`/api/chat`) | ✅ Live | Claude Haiku + Groq fallback |
| GOATED AI engine (`/api/goated-ai`) | ✅ Live | RSI/MACD/Bollinger, real market data |
| Audit (`/api/audit`) | ✅ Live | Full 12-dim + outreachAngles rendered |
| TrendPulse globe | ✅ Live | Dynamic events from `/api/sentiment` + bulletin |
| TrendPulse hotspot card | ✅ Live | Commission math + deep-link to regional leads |
| NotchBar (top) | ✅ Live | BTC/ETH/SOL + hot lead + commission rotation |
| Cmd+K AI search | ✅ Live | Hybrid: instant local filter + `/api/chat` on Enter |
| Audit page | ✅ Live | 13% math, dimensions, outreach angles |
| Stripe Connect | 🟥 Not configured | Need `STRIPE_SECRET_KEY` + `STRIPE_CONNECT_CLIENT_ID` |
| Supabase auth | 🟥 Not configured | Need `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |
| Apollo lead feed | 🟥 Not configured | Need `APOLLO_API_KEY` |
| Groq LLM | 🟥 Not configured | Need `GROQ_API_KEY` (free tier up to 30M tokens/mo) |

**Critical-path before taking money:** Supabase (auth) + Stripe Connect (payout) + Apollo (real leads) + Groq (reduce Claude cost).

---

## 5. Tech architecture highlights

- **Frontend:** React 18 + Vite 5.4 + Tailwind + Zustand + Framer Motion + Three.js / R3F
- **Backend:** 11 Vercel serverless functions (Hobby plan, 12 cap)
- **AI routing:** Claude Sonnet 4.6 (heavy reasoning) · Haiku 3.5 (fast chat) · Groq Llama 3.3 70B (cheap bulk)
- **Data sources:** CoinGecko · CryptoCompare · Fear & Greed · Kalshi · Polymarket · Apollo (pending)
- **Security:** Per-endpoint CORS whitelist, rate limits on AI endpoints, input validation, CSP + HSTS headers
- **Dialer:** **Zero in-app VoIP**. Native `tel:` launcher — users BYO (OpenPhone, Dialpad, iPlum). Detailed in `OUTREACH_PLAYBOOK.md`.

---

## 6. Outreach strategy (condensed — see `OUTREACH_PLAYBOOK.md` for full detail)

### Channel mix (2026, B2B cold)
| Channel | Weight | Use case |
|---------|--------|----------|
| LinkedIn | 35% | Founder-to-founder, referral-pattern |
| Email | 30% | Scale + compounding replies |
| Cold call | 20% | Decision-makers with published lines |
| SMS | 10% | Follow-up after first touch only |
| Physical mail | 5% | $100k+ ACV whales only |

### Stack (what we actually use)
- **OpenPhone** — $19/user, 3 DIDs per number (NYC, SF, LA area codes), iMessage-compatible, A2P 10DLC built-in.
- **Sales Navigator** — $79/user, connection + InMail + search.
- **Smartlead / Instantly** — domain warmup + sequence sending.
- **Dedicated sending domain** (e.g. `goated-reach.com`) — protects `goated.solutions` reputation.
- **Cal.com** — booking embed, already wired into app.

### Anti-blacklist pillars
1. Never call/SMS from personal numbers (carriers + Hiya/YouMail/Truecaller flag instantly).
2. A2P 10DLC brand + campaign registration before any commercial SMS (~$14 + 1-2 wks).
3. Local-presence dialing (area-code matched DIDs) for 2-4× pickup.
4. Gradual warmup (10/day → 50/day → 100/day over 3 weeks per number).
5. STIR/SHAKEN attestation A via verified business CNAM.
6. Separate sending domain for email; SPF/DKIM/DMARC all authenticated.
7. LinkedIn: manual only, 80 connects/week cap, no automation (auto-detection + bans are real in 2026).

### 14-day sequence per lead (field-tested)
Day 0: LinkedIn connect with personalized note. → Day 1: Email #1. → Day 3: Email #2 (bump). → Day 5: Call #1 + VM. → Day 7: SMS follow-up. → Day 8: LinkedIn follow-up. → Day 10: Call #2. → Day 12: Breakup email. → Day 14: Move to 30/60/90 nurture.

### Expected conversion (per rep/mo, 500 qualified touches)
- LinkedIn accept: 30-40%
- Email reply: 3-5%
- Call pickup: 15-25%
- Meetings booked: 3-5% of total
- Meeting → closed: 15-25%
- **Net: 500 touches → 15-25 meetings → 3-6 closed deals/mo**

At 13% × $42k avg deal × 4.5 closes = **~$24.5k MRR per ramped rep**.

---

## 7. Revenue plan (conservative)

| Month | Customers | Avg deals/customer/mo | Avg deal | GMV | 13% take | Platform cost | Net |
|-------|-----------|-----------------------|----------|-----|----------|---------------|-----|
| M1 (May 2026) | 3 | 1 | $40k | $120k | $15.6k | $1.2k | $14.4k |
| M3 | 12 | 1.5 | $42k | $756k | $98k | $5k | $93k |
| M6 | 40 | 2 | $45k | $3.6M | $468k | $15k | $453k |
| M12 | 120 | 2.5 | $50k | $15M | $1.95M | $50k | $1.9M |

Assumptions:
- Churn 5% / mo steady-state. Higher in M1-M3 as we filter ICP.
- CAC for founder-led month 0-6 ≈ $0 (cold outbound). From hire 1 onwards ≈ $800/customer.
- LTV at $45k GMV × 2 deals × 12 mo × 13% = $140k. LTV:CAC > 150× during founder-led phase.

---

## 8. Operational checklist — pre-launch

**This week:**
- [ ] Namecheap DNS contact verification (domain suspended — user action)
- [ ] Supabase project created, auth enabled, env vars in Vercel
- [ ] Stripe Connect Express account, onboarding flow live
- [ ] Apollo.io API key (starter $49/mo plan)
- [ ] Groq API key (free tier)
- [ ] OpenPhone account + 3 DIDs (NYC, SF, LA)
- [ ] A2P 10DLC registration submitted (3-14 day wait)
- [ ] Second sending domain purchased + DNS'd (goated-reach.com)
- [ ] Sales Navigator seat

**Next 2 weeks:**
- [ ] Domain warmup starts (50 → 500 emails over 4 weeks)
- [ ] Phone warmup starts (10/day → 50/day over 3 weeks per DID)
- [ ] First 10 paying customers closed (beta-price = 13% same as public)
- [ ] First Stripe payout verified end-to-end
- [ ] Vercel analytics + Plausible public analytics wired

**Before we 10x the user base:**
- [ ] End-to-end monitoring: Sentry for FE, LogSnag or similar for backend events
- [ ] On-call rotation (right now: founder = on-call 24/7)
- [ ] Rate-limit review per endpoint (esp `/api/chat`, `/api/goated-ai`, `/api/audit`)
- [ ] Backup data model + disaster recovery for Supabase
- [ ] Security audit (CSP, HSTS, CORS whitelist, rate limits — current state good, just needs pen-test)
- [ ] SOC2-lite checklist if pursuing enterprise tier

---

## 9. What we will NOT do

- In-app VoIP/dialer in year 1 (dodge 10DLC brand risk, carrier agreements, E911)
- Subscriptions / platform fees / setup fees for self-serve (13% flat is the whole model)
- Purchased lead lists from raw dumps — only API-sourced or manually qualified
- Ringless voicemail / auto-dial / AI voice outbound — reputational & regulatory risk year 1
- Crypto payments for commissions — Stripe USD only until we hit volume & compliance maturity
- Support Windows of Slack / Intercom 24/7 — docs + async email + weekly office hours only

---

## 10. Risks + mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Apollo rate-limits our lead pulls | HIGH | Self-host Postgres snapshot + nightly delta refresh |
| Claude API cost blows up | HIGH | Route 70% of traffic to Groq Llama 3.3 70B (free tier), Claude for premium only |
| Carrier SMS filtering kills our A2P | HIGH | Strict 10DLC compliance, monitor spam scores weekly, rotate DIDs |
| Customer disputes commission math | MED | Immutable audit log per closed deal, Stripe Connect auto-splits |
| Vercel serverless 12-function cap | MED | Currently 11/12. `_api-disabled/` folder for inactive routes. |
| DNS / domain suspended | Blocking | User action: Namecheap contact verification email |
| Founder burnout / single point of failure | HIGH | Hire 1 ops/SDR in M3; document everything in `/docs` |

---

## 11. 47-day sprint → first $10k MRR

**Days 1-7: Stack setup**
Supabase + Stripe + Apollo + OpenPhone + domain warmup begins. DNS verified. Brand 10DLC submitted.

**Days 8-21: Cold outbound ignition**
80 LinkedIn connects/day → 20/day responses → 10/day meetings booked by week 2. Founder runs all calls.

**Days 22-35: First closes**
3-5 deals closed, avg $40k GMV. First commissions through Stripe Connect. Iterate scripts based on dispositions logged in GOATED.

**Days 36-47: Systemize**
Document what's working. Hire first SDR. Start doubling outbound volume. Hit **10 active paying customers, ~$15k commission MRR, $120k GMV** by day 47.

---

## 12. Feedback loops

- **Daily**: outbound dispositions logged in GOATED, reviewed by founder + AI
- **Weekly**: pipeline review, script rotation, number health checks
- **Monthly**: cohort retention, channel ROI, ICP refinement
- **Quarterly**: commission rate review (only direction is flat or lower, never up — the promise)

---

## Related docs
- `docs/OUTREACH_PLAYBOOK.md` — full operational playbook (scripts, compliance, cadence)
- `PROD_READINESS.md` — live prod-readiness tracker, what's broken now
- `docs/GTM_STRATEGY.md` — historical strategy doc (pre-pivot)
- `docs/100K_MRR_MASTERPLAN.md` — year-1 MRR model (legacy)
- `src/lib/config.js` — commission + fee source of truth

**Disagreements with this doc are resolved by: (1) `src/lib/config.js` for pricing, (2) this doc for execution, (3) `OUTREACH_PLAYBOOK.md` for channel tactics.**
