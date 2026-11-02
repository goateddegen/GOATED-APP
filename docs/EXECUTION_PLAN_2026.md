# GOATED — Execution Plan (v7.5, agency-first)

**Status:** April 24, 2026. Pivot locked.
**Operator:** Tarek Ali (solo)
**North-star metric:** Cash collected by **June 13, 2026** (50 days)
**Realistic target:** **$20–40K collected** (cash, not pipeline)
**Stretch:** $50K if 1–2 whale closes hit early

---

## 1. Strategic call (LOCKED)

**GOATED is a B2B agency that uses its own software as leverage.** Not a SaaS company.

| Question                              | Answer                                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| Are we a SaaS?                        | **No.** SaaS-as-a-product re-attempt comes after $30K+ MRR through services.             |
| Are we publicly marketing the app?    | **No.** Deployed to Vercel, used as live demo on sales calls, not posted on social.      |
| Who is the buyer?                     | Brick-and-mortar SMBs where missed phone calls = lost revenue.                           |
| What's the offer?                     | Free audit → "we run the leak-recovery engine" → $2.5–8.5K setup + monthly retainer.     |
| Are we charging upfront retainers?    | Yes — small setup fee ($1–3K) + monthly retainer ($2.5–6K). Plus 13% commission on close.|
| Are we doing commission-only?         | **No.** Commission-only converts at 5%. Setup-fee deals convert at 30%+ and screen tire-kickers. |
| What channels?                        | **Phone > SMS > email > LinkedIn**. Lead with dial. LinkedIn skipped for SMB owners.     |
| Where do prospects come from?         | Google Maps + Yelp + Apollo free tier + ListKit. Geo-scraped, filtered by ICP.           |
| Who calls them?                       | Tarek personally for first 50 calls. AI voice agent assists once warm.                   |

---

## 2. Money math — what closes get us to $30–40K?

### Deal shape (target) — TWO TIERS, v7.5.4

**Tier 1 — Local Engine** (brick & mortar, primary outbound target)
```
Setup fee:        $2,000  (one-time, refundable in 30 days)
Monthly retainer: $750    (recurring, 3-month minimum)
M1 cash:          $2,750
M6 cash total:    $6,500
M12 cash total:   $11,000
```

**Tier 2 — Growth Engine** (online biz, $1M+ SMB, agencies, consultancies)
```
Setup fee:        $10,000–20,000  (one-time)
Monthly retainer: $2,500–5,000    (recurring, 6-month minimum)
Rev share:        Optional 10–20% on attributed revenue
M1 cash:          $12,500–$25,000
M6 cash total:    $25K–$50K
```

**Why deposit > retainer:** the prior model had monthly retainer ≈ deposit, which is structurally wrong. Big deposit = commitment filter (kills tire-kickers). Sticky-cheap retainer = hard to cancel = long LTV. Compounds favorably for both sides.

**Commission:** 13% flat on attributed closed revenue still applies — that's the Stripe-rails take, separate from setup/retainer.

### Path-to-$30K math

| Scenario       | Clients | Avg deal-1 value | First-month cash | Plausibility   |
| -------------- | ------- | ---------------- | ---------------- | -------------- |
| Conservative   | 5       | $4,500           | **$22,500**      | 100% — 1/wk    |
| Base case      | 7       | $5,000           | **$35,000**      | 80% — possible |
| Stretch        | 10      | $5,500           | **$55,000**      | 30% — whale-luck |
| Whale-driven   | 3 + 1 whale ($15K MRR) | mixed | **$30,000+**     | 25% — PI law / solar |

**Assumed close rate: 25%** (industry standard for SMB cold outbound with strong audit hook = 15-30%).
**Required calls booked → close rate of 25%:** 4 booked calls per close → **20–28 booked calls in 50 days** = ~3-5/week.
**Required dials per booked call:** 30 connects → 1 booked call. **600–900 dials over 50 days.** ~15–20/day.

This is doable solo. Hard. Not luck.

---

## 3. Target verticals (ranked, brick-and-mortar first)

### Tier S — best ICP fit
1. **HVAC / plumbing / electrical** ($3–8K/mo retainer easy, missed-call story is GOATED's thing)
2. **Med spas / aesthetics clinics** ($2–5K/mo, instagram-fluent owners, will try anything for leads)
3. **Roofing / solar / home improvement** ($5–15K/mo, ticket sizes $20K+, one close pays the year)
4. **Dental / chiropractic / med practices** ($2–5K/mo, $3–8K case values, ROI math is obvious)

### Tier A — secondary
5. **Auto body / collision / repair shops**
6. **Pest control / cleaning services**
7. **Personal injury law firms** (high $$ but sophisticated — skip without warm intro)
8. **Real estate teams** (flake rate kills it; only target team leads, not solo agents)

### Tier B — opportunistic only (don't outbound, take inbound)
9. SaaS founders ($1–10M ARR seeking outbound help) — they DM us, we close them
10. E-commerce DTC brands

### Tier C — avoid
- **Reputation-sensitive verticals**: Big tech, VC-backed startups, Fortune 500 (where Tarek's name might appear in a Google search)
- **Volume-low margin verticals**: Restaurants, retail, single-location food service (CAC > LTV math fails)

---

## 4. The offer (canonical pitch)

> "I noticed [Company]'s website is missing about 12-18 calls/week. Each one is worth roughly $X based on your job size. That's $Y/month walking out the door. I built a system that auto-calls every missed lead within 60 seconds, books them into your calendar, and texts a follow-up. **$1,500 to set it up, $2,500/month after, no contracts. I'll prove ROI in 30 days or refund the setup.** Wanna see the audit I already ran on your business?"

This is the entire pitch. Don't deviate. Don't add bullet points. Don't pitch features. **Pitch the recovered phone calls.**

---

## 5. The integration stack — what's wired vs. what's needed

### Working today (no env keys needed)
- `/api/audit` — live URL crawl + LLM analysis (needs `GROQ_API_KEY` OR `ANTHROPIC_API_KEY`)
- `/api/sentiment` — CoinGecko + CryptoCompare + Fear&Greed (free public APIs)
- `/api/chat` — Claude Haiku for AI overlay (needs `ANTHROPIC_API_KEY`)
- `/api/goated-ai` — RSI/MACD/Bollinger engine (no external dep)
- Lead engine — 250K seeded PRNG demo data (works, used internally for ICP browsing)
- 3D Globe — works via Three.js (data-aware, no external dep)

### Cover page, then an optional account
- `src/pages/ComingSoonPage.jsx` — visitors see this until `VITE_LAUNCH_READY=true`
- v7.5.2: oversized 3D goat with cursor tracking, red/orange/amber gradient
  GOATED wordmark, drift particles, no email capture, tiny subtext only
- Sign-in is optional once the cover is off. Home, audit, leads, outreach,
  and GOATED AI work with no account. The dashboard and admin pages are the
  account wall. Saved leads and cloud sync stay tied to a session.

### Needs env vars in Vercel before Monday
```
# REQUIRED (free or cheap)
ANTHROPIC_API_KEY     — Claude Haiku/Sonnet for AI chat + audit fallback
GROQ_API_KEY          — Llama 3.3 70B for audit primary (free 30M tokens/mo)

# RECOMMENDED for v1 close-engine
STRIPE_SECRET_KEY     — Stripe API key for Payment Links + Connect
STRIPE_WEBHOOK_SECRET — to capture payment_intent.succeeded events
SUPABASE_URL          — auth + persistence layer
SUPABASE_ANON_KEY     — for client SDK
SUPABASE_SERVICE_KEY  — for server-side webhook handlers

# OPTIONAL (productizes scaling, not blocking for first $30K)
APOLLO_API_KEY        — replaces seeded leads with real prospect search
NEWSAPI_KEY           — adds business news to TrendPulse repurposing
RESEND_API_KEY        — programmatic email send (for follow-up sequences)
```

**Cost to wire all of the above: ~$0–50/mo for first 3 months** (Groq free, Anthropic $5 trial, Stripe transaction-based, Supabase free tier, Apollo free tier 50 emails/day).

### Future, not for v1
- Twilio (real SMS sending) — use Google Voice + Phone app for now
- Cal.com Pro ($12/mo) — free tier works for 50/mo bookings
- ListKit ($199/mo) — only when manual list building becomes the bottleneck

---

## 6. The 50-day plan (April 24 → June 13)

### Week 1 (Apr 24-30) — INFRA + FIRST 5 CALLS
- [ ] Day 1: Pick first ICP vertical. Lock it. **Recommended: HVAC in 3 nearby metros** (highest deal size + cleanest pitch fit)
- [ ] Day 1: Set up 3× Google Voice numbers across 3 Gmail accounts → 3 area codes
- [ ] Day 1-2: Buy/scrape 500 prospects in vertical+metro (ListKit free trial, Apollo free tier, Google Maps scrape via PhantomBuster free trial)
- [ ] Day 2: Wire `GROQ_API_KEY` + `ANTHROPIC_API_KEY` in Vercel. Verify `/audit` works on 5 random URLs.
- [ ] Day 2: Wire `STRIPE_SECRET_KEY`. Create one Payment Link template ($1,500 setup + recurring $2,500/mo).
- [ ] Day 3-4: Run audit on top 50 prospects. Email each their audit PDF. Cold call same day.
- [ ] Day 5-7: Daily — 25 dials, 30 SMS follow-ups, 50 emails. Goal: book 5 calls.

### Week 2 (May 1-7) — FIRST CLOSE
- [ ] 5 sales calls. Demo audit live on each call. Show the leaks. Ask: "ready to plug them?"
- [ ] Aim: **1 close by Friday May 7.** Card on file. Stripe Payment Link sent on the call.
- [ ] If no close: rerun the offer math with the prospect — likely the price tier was wrong. Adjust $.

### Week 3-4 (May 8-21) — DELIVER + DOUBLE
- [ ] Deliver: missed-call recovery system (use GOATED's voice agent + Twilio + their phone tree)
- [ ] Track: phone calls recovered, deals booked, revenue won
- [ ] Outbound continues: 25/day dials. Goal: 2-3 more closes by May 21.
- [ ] First testimonial captured by May 18.

### Week 5-6 (May 22-Jun 4) — SCALE
- [ ] Use the testimonial in cold outreach. Conversion ~2x.
- [ ] Goal: hit 5-7 retained clients by Jun 4. ~$15-25K cash collected.
- [ ] Decide: hire first VA for prospect list-building? ($5/hr Filipino VA frees 2hrs/day for dials)

### Week 7 (Jun 5-13) — CLOSE BIG
- [ ] Last sprint. Goal 8-10 total clients by Jun 13. **$25-40K cash collected.**
- [ ] Optional: stretch close on 1 PI law firm or solar dealer ($10-15K MRR ticket).
- [ ] Decision point: keep going solo or onboard 1 commission-only closer?

---

## 7. Anti-failure modes

### Failure mode A: "Nobody's picking up"
- **Diagnosis**: Wrong ICP, wrong time, wrong number
- **Fix**: Call between 10am-12pm and 1-4pm local. Skip Mondays/Fridays. Never call weekends. Use local-area-code virtual numbers (the dial-back rate from a 415 number to a 415 prospect is 4x higher than a 1-800).

### Failure mode B: "They're picking up but not booking"
- **Diagnosis**: Pitch is too long or too feature-heavy
- **Fix**: Get to "missed calls = $X/month lost" in 15 seconds. If they engage, send the audit PDF on the spot. Book or hang up.

### Failure mode C: "They book but don't close on the call"
- **Diagnosis**: Pricing/commitment friction or weak audit narrative
- **Fix**: Audit must show ≥$5K/month in identified leakage to support a $2,500/mo pitch. If audit doesn't, the prospect isn't qualified. Dump them. Move on.

### Failure mode D: "First client churned in month 2"
- **Diagnosis**: Over-promised on call, under-delivered in execution
- **Fix**: Setup phase must include weekly check-in calls. Show them the recovered-call dashboard. Make wins visible.

### Failure mode E: "Tarek burns out"
- **Diagnosis**: 25 dials/day is exhausting. Solo founder fatigue.
- **Fix**: Set strict 4-hour calling block (e.g., 10am-2pm). Outside that, no dials. Use afternoons for delivery, audits, follow-ups. Take Saturdays off completely.

---

## 8. Why this beats the SaaS path right now

| Metric                       | SaaS path                      | Agency path                |
| ---------------------------- | ------------------------------ | -------------------------- |
| Time to first $1 of revenue  | 60-180 days (signup → upgrade) | 7-14 days (call → close)   |
| Time to $30K cash            | 12-24 months                   | 50 days (this plan)        |
| Capital required             | $5-15K (ads, SEO, content)     | $200-500 (numbers + lists) |
| Reputation requirement       | High (LinkedIn, founder brand) | Low (anonymous brand)      |
| Tarek's reputation exposure  | High (his cancellation matters)| Low (SMB owners don't know)|
| Skill match (sales-heavy)    | Mid (needs marketing skill)    | High (Tarek's actual edge) |
| Failure mode                 | Slow death (no revenue, churn) | Visible day 5 (can pivot)  |

**Agency wins on every dimension that matters in the next 60 days.**

The SaaS becomes the obvious next step *after* the agency is paying bills. Every agency client is a real-world QA tester for the eventual SaaS product. They'll be the first 10 paid users.

---

## 9. Budget (50 days)

```
Google Voice (3 numbers, free)            $0
ListKit free trial → $99 if needed      $99
Apollo free tier (50/day) → $99 backup  $99
Cal.com (free tier)                       $0
Stripe (transactional, 2.9%+30¢)          $0 (paid by clients)
Domain (already own goated.solutions)     $0
Vercel (existing free tier)               $0
Anthropic API (~$50 for 50 days of audits)$50
Groq API (free tier)                      $0
Supabase (free tier)                      $0
1 VA at $5/hr × 10hrs/wk × 6wks         $300
─────────────────────────────────────────────
Total budget:                            $548
```

**Required cash on hand to execute: < $600.**
**Expected gross from 5 closes in 50 days: $20K-30K.**
**Net margin: ~95% (no fulfillment cost beyond Tarek's time).**

---

## 9.5. Upsell architecture (the LTV multiplier)

Tier 1 base ($2K + $750/mo) is the door-opener. The compounding plays sit in `docs/UPSELL_CATALOG.md` — 17 ranked modules, each with implementation steps + cost-to-build.

**Standard sequencing:**
1. **Day 0-14**: Land + deliver Tier 1 base (voice agent + SMS + booking + monthly report)
2. **Day 15-28**: Show first recovered-revenue numbers
3. **Day 30 check-in call**: Pitch ONE upsell module that matches their stated friction
4. **Day 60-90**: Compound 2-3 modules → $2-3K extra/mo per client

**Where the $30-40K June goal can compound from:**
- 5 Tier 1 base × $2,750 month-1 = $13,750
- 2 of those 5 add #6 review automation by month 2 = +$3,000 setup + $600/mo
- 1 of those 5 adds #8 SMS reactivation = +$1,500
- 1 Tier 2 close × $12,500 month-1 = $12,500
- That Tier 2 client adds #11 custom AI agent in month 2 = +$5,000-10,000

**Realistic compounded total by Jun 13: $35-50K cash collected.**

**The big custom plays** (only for Tier 2 / Growth Engine deposits >$10K):
- #11 Custom industry-specific AI agent (HVAC estimator, dental insurance pre-qual, roofing damage AI, etc.)
- #16 AI-powered SDR replacement (full outbound stack, $8-15K setup + $2.5-5K/mo)
- #17 Computer vision for inspection/quoting (roof/auto/HVAC visual AI)
- #14 Programmatic SEO landing pages (multi-location, e-com)

These are 3-5 week build projects. Stack 1 of these on top of the Tier 2 base = $50-80K first-month deals.

See `docs/UPSELL_CATALOG.md` for full implementation specs on every module.

---

## 10. What we're NOT doing (DELETED scope)

- ❌ Public product launch / Product Hunt / TechCrunch outreach
- ❌ LinkedIn personal-brand content (Tarek's name is reputation-locked there)
- ❌ Paid ads (Meta, Google, LinkedIn) — no capital, low ROI
- ❌ VC fundraising
- ❌ Hiring full-time anyone
- ❌ Building new product features (audit + leads engine + AI overlay = enough)
- ❌ Crypto/casino/prediction market features (orphaned, hidden in admin)
- ❌ TrendPulse marketing (hidden from primary nav, kept as visual prop)

---

## 11. Definition of done — June 13, 2026

✅ **5+ retained clients paying $2.5K+/mo**
✅ **$20K+ cash in Stripe**
✅ **2+ written testimonials**
✅ **Audit page rendered for ≥100 unique URLs**
✅ **Tarek not back on a job board**

If any 4 of 5 hit, this plan worked. Move to scale phase.
If only 2 of 5 hit, diagnose: was it pitch, list, or delivery? Adjust and run another 30 days.
If 0 of 5 hit, we missed the read on the market and the plan needs surgery.

---

## 12. Companion docs (read before Monday)

The execution plan is the strategy. These docs are the tactics:

| Doc | Purpose | When to read |
|---|---|---|
| `WEEKEND_TO_MONDAY.md` | Sat infra → Sun script → Mon kill day | Sat AM |
| `WEEK_1_TACTICAL.md` | Mon-Fri hour-by-hour schedule | Sun PM |
| `CLOSING_PLAYBOOK.md` | Opening, objections, close, follow-up | Memorize Sat-Sun |
| `OUTREACH_OPENINGS_RANKED.md` | 10 openings ranked + per-vertical | Sun PM |
| `OBJECTIONS_BY_VERTICAL.md` | Vertical-specific objection handling | Sun PM |
| `OUTREACH_PLAYBOOK.md` | Lead-gen pipeline, list building | Sat |
| `UPSELL_CATALOG.md` | 35 modules to upsell at Day 30 | After 1st close |
| `CHEAT_SHEETS.md` | Print + pin as desk reference | Mon AM |
| `SCALE_PLAYBOOK.md` | Phases 0 → $1M MRR | First Sat of quarter |
| `DELUSIONAL.md` | Swing-for-fences alt paths | First Sat of quarter |
| `INVESTOR_PITCH.md` | If/when raising Q3+ | When asked |

---

*Last updated: 2026-04-25 · v7.5.6 · Agency-first plan with full tactical companion docs.*
