# GOATED — STRATEGIC ANALYSIS & $100K MRR ROADMAP

**Date:** March 2026
**Version:** 5.0 — FINAL CONSOLIDATED VISION
**Status:** Investor-Ready | Internal Strategy

---

## VISION

GOATED = **Palantir for Crypto/Predictive Trading + Apollo for B2B Sales** — built better, in one platform, taking 10% of everything. **The ONLY platform that GUARANTEES close rates with an AI-guided playbook.**

Three revenue verticals. One ecosystem. One brand.
1. **Predictive Intelligence** — TrendPulse, prediction markets, social sentiment, betting spreads (real-time, global, no dummy data)
2. **B2B Revenue Engine** — AI-powered lead discovery, VoIP/SMS outreach, deal closing with 10% commission, powered by the GOATED Guarantee Closing System
3. **Web3 Finance Layer** — Solana-first wallet, GOAT token, on-chain settlement for bets and deals

---

## IDEAL CUSTOMER PROFILES (ICP)

### Primary ICP: Degen Crypto / Prediction Market Traders
Polymarket and Kalshi power users who are hypervigilant on speech sentiment, word choice, and narrative trading. These are people who bet on Trump speeches, analyze word choice for market signals, and trade prediction markets based on sentiment and narrative shifts. Think "Palantir meets Robinhood meets Apollo" user. They want real-time intelligence, fast execution, and edge over other traders.

### Secondary ICP: B2B Closers / Sales Reps / SDRs
Professional salespeople who need a free all-in-one platform. Currently spending $500-$2,000/month across Apollo, Outreach, Gong, ZoomInfo, and LinkedIn Sales Navigator. They want leads, outreach tools, AI coaching, and a guaranteed close system in one place for $0.

### Tertiary ICP: Small Business Owners / Solopreneurs
Founders and solo operators needing leadgen without paying $300/month. Currently using spreadsheets and free LinkedIn because they cannot afford proper tools. They want enterprise-grade capabilities at a price point that works for a one-person business.

---

## GOATED GUARANTEE CLOSING SYSTEM

**The single biggest differentiator vs every competitor in the market.**

No CRM, no leadgen platform, no sales tool has ever guaranteed close rates. GOATED does.

### 6-Step AI-Guided Process
1. **Research** — AI deep-dives the lead: company intel, pain points, buying signals, decision-maker mapping, competitive landscape
2. **Outreach** — AI generates personalized multi-channel sequences (call scripts, emails, SMS) tailored to the specific lead
3. **Discovery** — AI coaches the user through discovery calls with real-time objection handling and question suggestions
4. **Value Demo** — AI builds custom value propositions and demo talking points based on the lead's specific pain points
5. **Negotiation** — AI provides pricing guidance, competitor comparison ammunition, and real-time negotiation coaching
6. **Close** — AI generates proposals, handles final objections, and guides the user through contract execution

### The Guarantee
- **90%+ close rate** for leads scored 85+ when the full playbook is followed
- If the user follows the playbook and does not close, GOATED analyzes the failure, identifies what went wrong, and optimizes the next approach
- AI learns from every win and loss across the platform, continuously improving close rates for all users
- This creates a data flywheel: more closes generate more training data, which improves AI coaching, which drives more closes

---

## FEATURE DECISIONS — FINAL

| Feature | Decision | Revenue Model | Priority |
|---------|----------|---------------|----------|
| **3D GOAT Mascot** | KEEP + improve animations/perf | Brand equity, retention | HIGH |
| **TrendPulse** | KEEP + 100X (real APIs, no dummy data) | $49-299/mo premium data | CRITICAL |
| **Predictive Markets/Betting** | KEEP + 100X (backend settlement, real USDC) | 10% win commission + 2% volume | CRITICAL |
| **Social Sentiment Engine** | KEEP + 100X (Twitter, Reddit, on-chain) | Bundled with TrendPulse premium | CRITICAL |
| **Consumer/Global Trend Analysis** | KEEP + BUILD (real data feeds) | Premium tier differentiator | HIGH |
| **B2B LeadGen + Closing** | KEEP + 100X (VoIP, SMS, email, AI agents) | 10% commission + SaaS | CRITICAL |
| **Web3 Wallet (Solana-first)** | KEEP + improve (Phantom, real USDC) | 0.5% withdrawal, tx settlement | HIGH |
| **AI Overlay (Claude)** | KEEP + improve (context-aware, multi-model) | Core platform value | HIGH |
| **Plays/Playbooks** | KEEP — absorb into Leads Intelligence tab | Bundled value | MEDIUM |
| **User Accounts/Auth** | BUILD (Supabase Auth, fluid UX) | Required for everything | CRITICAL |
| **AI Agents** | BUILD (email, caller, signal, research) | Usage-based overage | HIGH |
| **AI App Builder** | REMOVE | N/A | — |
| **Finder Page** | REMOVE (merge into Leads) | N/A | — |
| **Creator Economy** | REMOVE (no profit margin at 0 users) | N/A | — |
| **Start Business** | REMOVE (absorb into Onboarding) | N/A | — |
| **Comms (standalone)** | REMOVE (lead-level comms into Leads) | N/A | — |

### Why Remove Creator Economy (Final Verdict)

- 0 real creators, 0 brand deals, 0 affiliate revenue flowing
- Affiliate commissions (15-30%) conflict with core 10% model
- Needs 10K+ active users to generate meaningful creator marketplace rev
- Different persona entirely (creators vs traders/sales teams)
- No social media API integration actually built
- **No upside until GOATED has traction.** Revisit at $100K MRR if demand exists.
- Salvage: Repurpose affiliate tracking logic into user referral program (20% rev share)

---

## 2. FEATURES TO REMOVE

### REMOVE: AI App Builder (BuilderPage.jsx) — 503 lines
- Zero revenue, entirely mock, doesn't build anything
- Competes with v0/Bolt/Lovable — can't win inside a sales/trading platform
- Confuses product narrative. Not our vertical.

### REMOVE: Finder Page — 1,630 lines → MERGE into Leads
- Duplicate of LeadsPage (both do prospect discovery)
- SEO metrics, pain points, revenue gaps → become enrichment tabs on lead profiles
- One discovery page, not two.

### REMOVE: Creator Economy — 712 lines
- 0 users, 0 revenue, 0 real creators onboarded
- Different persona (creators ≠ traders/sales teams)
- No social media API integration built
- Affiliate logic repurposed into referral program

### REMOVE: Start Business Page — 593 lines → MERGE into Onboarding
- Overlaps with Onboarding (duplicate business profile capture)
- Revenue tracker shows all zeros
- Business model/ICP selection absorbed into onboarding wizard

### REMOVE: Comms (standalone page) — 1,557 lines → STRIP + embed
- Slack-clone nobody asked for. Team channels (#watercooler) ≠ deal closing.
- Keep ONLY lead-level communication thread (calls/emails/SMS per lead)
- Embed stripped comms into Leads page Engage tab

**Total code removed/consolidated: ~5,000 lines (38% reduction in page count: 13 → 7)**

---

## 3. FEATURES TO KEEP + 100X

### 3D GOAT MASCOT — KEEP + IMPROVE
- Brand identity, memorable, competitive differentiator
- Improve: Optimize geometry for mobile, add reaction animations (celebrates wins, reacts to losses)
- Improve: Loading state animation, seasonal skins, user-customizable (unlock with GOAT tokens)
- Performance: Lazy-load 3D, 2D fallback on low-end devices, target 60fps

### TRENDPULSE — 100X into "Palantir for Crypto/Trading"
**Current:** Real APIs (CoinGecko, CryptoPanic, Fear&Greed, Polymarket)
**100X Plan — NO MORE DUMMY DATA:**
```
Real-Time Data Sources (all live, global):
├── Crypto prices: Binance WebSocket (upgrade from CoinGecko polling)
├── News sentiment: CryptoPanic + NewsAPI + custom RSS aggregation
├── Social sentiment: Twitter/X API ($TICKER mentions, engagement scoring)
├── Reddit sentiment: r/cryptocurrency, r/wallstreetbets, niche subs
├── On-chain analytics: Nansen/Arkham APIs (whale wallet tracking)
├── Fear & Greed Index: alternative.me (already integrated)
├── Prediction market odds: Polymarket Gamma API (already integrated)
├── DeFi yields: DeFiLlama API
├── Global macro: FRED API (interest rates, employment, GDP)
├── Startup/VC: Crunchbase API (funding rounds, valuations)
├── Consumer trends: Google Trends API
└── Regulatory: SEC EDGAR, Congress.gov API

Intelligence Layer (AI-powered):
├── Composite sentiment score (weighted: 25% price + 25% social + 25% news + 25% on-chain)
├── Signal generation: "BTC sentiment flipped bullish — 78% 30-day correlation with 5%+ moves"
├── Backtested signal accuracy (track predictions vs outcomes over time)
├── AI daily briefing (Claude generates market summary every 6 hours)
├── Anomaly detection (unusual volume, whale movements, social spikes)
├── Betting spread analysis (real-time odds movement tracking)
├── Consumer trend correlation (Google Trends → market impact)
└── Exportable PDF reports for sharing/pitching

What Makes This Competitive vs Bloomberg/Santiment/LunarCrush:
├── All-in-one (they each cover one data type — we combine ALL)
├── AI signal generation (not just data display — actionable predictions)
├── Integrated betting (see signal → bet on it → get paid)
├── B2B crossover (market intelligence informs sales decisions)
├── 10x cheaper ($49-299/mo vs $2K+ for Bloomberg/Refinitiv)
└── Degen-native UX (fast, dark, mobile-first — not enterprise bloatware)
```
**Revenue:** Free (delayed) → $49/mo (real-time) → $149/mo (signals + alerts) → $299/mo (API + export)

### PREDICTIVE MARKETS / BETTING — 100X into "GOATED Markets"
**Current:** 24 markets, 10% commission, GOAT tokens (localStorage only)
**100X Plan:**
```
Backend Settlement (Supabase):
├── Move ALL bet logic to server (no more localStorage cheating)
├── Atomic transactions (bet placement, resolution, payout)
├── Real USDC wagering via Phantom wallet (Solana)
├── Auto-resolution via price oracles (Pyth/Chainlink for crypto targets)
├── User-created markets ($10 GOAT creation fee, platform takes 2% of volume)

Market Categories (expanded):
├── Crypto: Price targets, market cap milestones, chain metrics
├── AI/Tech: Model releases, adoption milestones, company valuations
├── M&A: Acquisitions, mergers, deal valuations
├── IPO: Filing dates, pricing, first-day performance
├── Regulation: Bills, rulings, enforcement actions
├── Startups: Unicorn status, funding rounds, shutdowns
├── Global Macro: Rate decisions, employment, GDP, elections
└── Custom: User-created (moderated, community-voted)

Social + Competitive Features:
├── Global leaderboard (P&L ranked, win streaks)
├── Follow/copy top traders
├── Weekly prediction tournaments with prize pools
├── Market-maker rewards (provide liquidity → earn reduced fees)
└── Social feed (share positions, discuss markets)

Revenue Model:
├── 10% commission on winning payouts (current, keep)
├── 2% volume fee on ALL trades (new — win or lose)
├── 0.5% withdrawal fee (current, keep)
├── $10 market creation fee (new)
├── Premium: $29/mo for reduced fees + early market access
└── Projected: 500 traders × $700/mo vol × 12% avg fee = $42K/mo
```

### SOCIAL SENTIMENT ENGINE — 100X into "Signal Engine"
**What traders pay $200-2K/mo for elsewhere — we bundle it into TrendPulse.**
```
Data Sources (all real-time, global):
├── Twitter/X: $TICKER mentions, engagement, influencer tracking
├── Reddit: Subreddit activity spikes, sentiment shifts
├── Telegram: Crypto alpha channel monitoring
├── Discord: Community engagement metrics
├── On-chain: Whale movements, exchange inflows/outflows
├── News: Volume + sentiment scoring per asset
└── Google Trends: Search interest correlation

AI Signal Generation:
├── "SOL social mentions up 340% in 24h — historically correlates with 8% move within 48h"
├── "Whale moved 50K ETH to exchange — 72% chance of sell pressure"
├── "Fear & Greed at 15 (Extreme Fear) — 3 of last 4 times = 20%+ bounce in 14d"
├── Custom signal builder (combine indicators into personal strategy)
└── Alert system: SMS/push when signals trigger (via Twilio)
```

### B2B LEADGEN + CLOSING — 100X
**Current:** Apollo works, Claude chat works, scoring works. VoIP/SMS are placeholder.
**100X Plan:**
```
Consolidated Leads Page (4 tabs — replaces Leads + Finder + Comms + Plays):

TAB 1: DISCOVER
├── AI natural language search ("SaaS companies in CA hiring for sales")
├── Apollo.io integration (real data, no mocks)
├── Multi-source enrichment (Apollo + Clearbit + Hunter.io)
├── Lead scoring 0-100 (fit + engagement + intent + buying signals)
├── Company enrichment (revenue, employees, funding, tech stack, SEO metrics)
├── Pain point analysis per company (ex-Finder feature)
├── Revenue gap detection (ex-Finder feature)
├── Intent signals (job postings, tech changes, funding events)
└── Buying signal indicators (website visits, content engagement)

TAB 2: ENGAGE
├── Click-to-call VoIP (Twilio Voice API)
├── SMS outreach sequences (Twilio Messaging API)
├── Email sequences (SendGrid, 5-7 touch drip)
├── AI call coaching overlay (Claude real-time whisper during calls)
├── Call recording + transcription (Deepgram real-time)
├── Local presence dialing (match area code to lead)
├── Lead communication thread (ex-Comms, per-lead view)
├── Multi-channel activity timeline
└── Voicemail drop (pre-recorded messages)

TAB 3: CLOSE
├── Deal pipeline kanban (drag-and-drop stages)
├── AI proposal generator (Claude Sonnet)
├── Invoice creation (Stripe Connect)
├── 10% commission auto-deduction on payment
├── Contract templates (DocuSign-ready)
├── Payment tracking + receipts
├── Milestone-based billing
└── Revenue dashboard per deal + cumulative

TAB 4: INTELLIGENCE
├── SWOT analysis per lead (AI-generated)
├── Deal analysis reports (exportable PDF)
├── Playbook recommendations (ex-Plays, 32 plays integrated)
├── Win/loss pattern analysis
├── Competitive intelligence per lead's industry
├── AI-suggested next best action
└── Conversion probability scoring

How a User Gets to $100K in First Month:
  Path A: 4 deals × $25K = $100K (agency/consulting — 100 leads → 40 calls → 4 closes)
  Path B: 10 deals × $10K = $100K (SaaS/services — 200 leads → 80 calls → 10 closes)
  Path C: 40 deals × $2.5K = $100K (SMB volume — AI agents handle pipeline, user closes)
  GOATED's job: Make paths A-C achievable through data quality + AI automation
```

### WEB3 WALLET — KEEP + IMPROVE (Solana-First)
```
Why Solana:
├── 400ms finality (bets settle instantly)
├── $0.00025 avg transaction fee
├── Phantom has 10M+ wallet users (distribution)
├── Jupiter aggregator for swaps
├── Degen-native culture = our target user
└── SPL token standard is simpler than ERC-20

Phase 1 (Now): Solana only
├── Phantom wallet connection
├── USDC (SPL) for predictions + deal payments
├── GOAT token as SPL token
├── Real deposits/withdrawals

Phase 2 ($100K MRR): Add Base (Ethereum L2)
├── Coinbase Smart Wallet
├── Bridge GOAT via Wormhole
├── Tap 100M+ Coinbase users

Phase 3 ($500K MRR): Full multi-chain if demand warrants

GOAT Token Utility:
├── Pay fees in GOAT = 50% discount
├── Stake GOAT = earn 30% of platform fees
├── Hold 10K+ GOAT = unlock premium tier free
├── Create prediction markets = burn 100 GOAT
├── Governance (vote on new market categories)
└── Referral rewards paid in GOAT
```

### AI OVERLAY (Claude) — IMPROVE
```
Current: Haiku, 3 modes, 2048 tokens, basic
Improved:
├── Route: Quick queries → Haiku (fast). Deep analysis → Sonnet (smart).
├── Context injection: Every AI call includes user profile, current page, history
├── Real-time call coaching: Haiku for latency (<500ms whisper)
├── Email generation: Sonnet for quality
├── Signal analysis: Sonnet for accuracy
├── Daily briefings: Sonnet generates comprehensive market summary
├── Agent framework: Autonomous research, email, calling, signals
└── Fine-tuning (post-$50K MRR): Train on winning cold emails, accurate signals
```

---

## 4. CONSOLIDATION: StartBusiness + LeadGen

### Current Problem

StartBusiness (593 LOC) is a standalone page that:
- Collects business type, industry, audience
- Shows a launch checklist
- Displays empty revenue charts
- Has no connection to the lead generation system

**This is literally the same data the onboarding flow collects.**

### Proposed Consolidation

```
BEFORE (Fragmented):
  Onboarding Wizard → Generic Dashboard → StartBusiness Page (separate)
                                        → LeadGen Page (separate)
                                        → Finder Page (separate)

AFTER (Unified):
  Smart Onboarding → ICP-Matched Lead Pipeline → Outreach Engine → Close & Invoice
       |                     |                        |                  |
       v                     v                        v                  v
  Business Profile    AI-Curated Leads         VoIP/Email/SMS      10% Commission
  Industry Select     Scoring + Ranking        Call Coaching        Stripe Payments
  Revenue Goals       Company Intel            Sequences            Proposals
  Target Audience     Pain Point Analysis      Follow-ups           Contracts
```

### Implementation

**Merge StartBusiness INTO the onboarding flow:**

1. Step 1: "What do you sell?" (services, SaaS, products, consulting)
2. Step 2: "Who do you sell to?" (industries, company sizes, titles)
3. Step 3: "What's your deal size?" ($5K, $10K, $25K, $50K, $100K+)
4. Step 4: "How do you sell?" (cold outreach, inbound, referral, all)
5. Step 5: "Revenue goal?" ($10K/mo, $50K/mo, $100K/mo, $500K/mo)

**Then immediately generate:**
- 500+ ICP-matched leads
- Recommended playbooks for their business type
- Outreach sequence templates
- Revenue projection based on their inputs

**Kill the separate StartBusiness page.** Its data points become onboarding inputs that power the entire platform.

---

## 5. BUSINESS MODEL ANALYSIS

### Option A: Pure SaaS (Current Plan)

```
Revenue = Users x Monthly Price
$99-$499/mo per user

Pros:
+ Predictable MRR
+ High margins (85%+)
+ Investors love it
+ Simple to understand

Cons:
- Slow ramp (need 500+ users for $50K MRR)
- High churn in SMB market (5-10% monthly)
- Price ceiling ($499 is max for SMB)
- No revenue alignment with customer success
```

### Option B: Pure Commission/Marketplace

```
Revenue = GMV x Commission Rate (10%)
User closes $50K deal → GOATED takes $5K

Pros:
+ Revenue scales with user success
+ No upfront cost barrier (easier adoption)
+ Aligns incentives (you win when they win)
+ Potential for massive revenue per user

Cons:
- Unpredictable revenue
- Users may circumvent platform for large deals
- Hard to enforce commission on offline deals
- Investors skeptical of take-rate models for B2B
- Legal complexity (are you a broker?)
```

### Option C: HYBRID MODEL (RECOMMENDED)

```
Revenue = SaaS Base + Transaction Commission + Usage Fees

Structure:
┌─────────────────────────────────────────────────────────────┐
│                    GOATED PRICING                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BASE SUBSCRIPTION (access to platform):                    │
│  ├── Starter: $49/mo  (100 leads, basic outreach)          │
│  ├── Growth:  $149/mo (1K leads, AI agents, VoIP)          │
│  ├── Scale:   $299/mo (unlimited, full AI, priority)       │
│  └── Agency:  $499/mo (white-label, API, team seats)       │
│                                                             │
│  TRANSACTION COMMISSION (on deals closed via platform):     │
│  ├── Invoices paid through GOATED: 5% commission           │
│  ├── Marketplace deals: 10% commission                     │
│  └── AI-executed service delivery: 20% margin              │
│                                                             │
│  USAGE FEES (pay-per-use):                                  │
│  ├── AI agent minutes: $0.10/min                           │
│  ├── VoIP calling: $0.05/min                               │
│  ├── SMS: $0.02/message                                    │
│  ├── Email sends: $0.001/email                             │
│  └── Lead enrichment: $0.05/lead                           │
│                                                             │
│  PREDICTION MARKETS:                                        │
│  └── 10% commission on winnings                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Why Hybrid Wins

| Metric | Pure SaaS | Pure Commission | Hybrid |
|--------|-----------|-----------------|--------|
| MRR Predictability | HIGH | LOW | MEDIUM-HIGH |
| Revenue Per User | $99-499 | $0-50K+ | $49-5K+ |
| Adoption Barrier | MEDIUM | LOW | LOW-MEDIUM |
| Churn Risk | HIGH | LOW (free) | MEDIUM |
| Investor Appeal | HIGH | MEDIUM | HIGH |
| Revenue Ceiling | LIMITED | UNLIMITED | UNLIMITED |
| Incentive Alignment | LOW | HIGH | HIGH |

**Projected revenue per user (hybrid):**
- Starter user: $49/mo base + $20 usage + $50 commissions = **$119/mo**
- Growth user: $149/mo base + $80 usage + $500 commissions = **$729/mo**
- Scale user: $299/mo base + $200 usage + $2,000 commissions = **$2,499/mo**
- Agency user: $499/mo base + $500 usage + $5,000 commissions = **$5,999/mo**

---

## 6. B2B LEADGEN IMPROVEMENTS

### Current Gaps (Critical)

1. **No real outreach execution** - Can find leads but can't contact them
2. **No sequence automation** - Every touchpoint is manual
3. **No multi-channel orchestration** - Email, call, SMS, LinkedIn are separate
4. **No pipeline tracking** - Leads go in but deals don't come out
5. **No attribution** - Can't tell which plays/channels close deals

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOATED OUTREACH ENGINE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LEAD INTAKE                                                    │
│  ├── Apollo.io API (real, working)                              │
│  ├── LinkedIn import (CSV + future API)                         │
│  ├── Manual upload (CSV)                                        │
│  ├── Website visitor tracking (Clearbit Reveal)                 │
│  └── Referral intake form                                       │
│                                                                 │
│  AI ENRICHMENT                                                  │
│  ├── Company data (Apollo + Clearbit)                           │
│  ├── Contact verification (Hunter.io + NeverBounce)             │
│  ├── Intent signals (job postings, tech changes, funding)       │
│  ├── Social activity (LinkedIn posts, Twitter engagement)       │
│  └── GOATED AI analysis (pain points, timing, approach)         │
│                                                                 │
│  OUTREACH SEQUENCES                                             │
│  ├── Day 1: Personalized email (AI-written)                     │
│  ├── Day 3: LinkedIn connection + message                       │
│  ├── Day 5: Follow-up email                                     │
│  ├── Day 7: Cold call (VoIP with AI coaching)                   │
│  ├── Day 10: SMS touchpoint                                     │
│  ├── Day 14: Breakup email                                      │
│  └── [AI adjusts timing based on engagement signals]            │
│                                                                 │
│  REAL-TIME CALLING                                              │
│  ├── Twilio power dialer                                        │
│  ├── Local presence (area code matching)                        │
│  ├── AI call coaching (real-time whisper)                        │
│  ├── Call recording + transcription                             │
│  ├── Sentiment analysis                                         │
│  ├── Auto-log to CRM                                            │
│  └── Post-call AI summary + next steps                          │
│                                                                 │
│  DEAL CLOSING                                                   │
│  ├── Proposal generator (AI + templates)                        │
│  ├── E-signature integration                                    │
│  ├── Stripe invoicing (10% commission)                          │
│  ├── Milestone tracking                                         │
│  └── Revenue recognition                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### VoIP/SMS Implementation Plan

**Phase 1: Basic Calling (Week 1-2)**
```
Dependencies:
- Twilio Account (twilio.com)
- Phone number provisioning ($1/mo per number)
- TwiML webhooks for call control

Implementation:
1. POST /api/voip/call - Initiate outbound call
2. POST /api/voip/sms - Send SMS
3. POST /api/webhooks/call-status - Handle call events
4. POST /api/webhooks/recording - Handle recordings
5. GET /api/voip/logs - Call history
```

**Phase 2: Power Dialer (Week 3-4)**
```
Features:
- Queue leads for sequential calling
- Auto-advance on no-answer/voicemail
- Voicemail drop (pre-recorded)
- Disposition codes (interested/callback/not interested/wrong number)
- Call scheduling (respect timezone + business hours)
```

**Phase 3: AI Call Coaching (Week 5-6)**
```
Features:
- Real-time transcription (Deepgram WebSocket)
- Claude analysis of conversation in real-time
- Whisper suggestions (only caller sees)
- Objection detection + response suggestions
- Meeting booking detection + auto-calendar
- Post-call summary generation
```

---

## 7. COMMISSION ARCHITECTURE (10% ON EVERYTHING)

### Where 10% Commission Applies

```
┌─────────────────────────────────────────────────────────────┐
│              GOATED 10% COMMISSION STRUCTURE                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. INVOICES PROCESSED VIA GOATED                           │
│     User sends invoice through platform                     │
│     Client pays via Stripe                                  │
│     GOATED takes 10% before depositing to user              │
│     Example: $50K invoice → $5K to GOATED, $45K to user    │
│                                                             │
│  2. MARKETPLACE TRANSACTIONS                                │
│     Service provider listed on marketplace                  │
│     Buyer purchases service                                 │
│     GOATED takes 10% of transaction                         │
│     Example: $10K project → $1K to GOATED                  │
│                                                             │
│  3. PREDICTION MARKET WINNINGS                              │
│     User places prediction bet                              │
│     Prediction resolves correctly                           │
│     GOATED takes 10% of net winnings                        │
│     Example: Bet $100, win $300 → $20 to GOATED            │
│                                                             │
│  4. AI SERVICE DELIVERY (Phase 3)                           │
│     AI executes service on behalf of user                   │
│     Client pays for deliverable                             │
│     GOATED takes 20% margin (higher due to execution)       │
│     Example: AI builds website for $5K → $1K to GOATED     │
│                                                             │
│  5. REFERRAL COMMISSIONS                                    │
│     User refers new customer                                │
│     Referred customer pays subscription                     │
│     Referrer gets 20% of MRR for 12 months                  │
│     GOATED keeps 80%                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation (Stripe Connect)

```
Payment Flow:
1. Client clicks "Pay Invoice" on GOATED-hosted invoice
2. Stripe processes payment
3. Stripe Connect splits funds:
   - 10% → GOATED platform account
   - 90% → User's connected Stripe account
4. User can withdraw to bank via Stripe dashboard
5. All tracked in GOATED transaction history

Tech: Stripe Connect (Standard or Express accounts)
Cost: 2.9% + $0.30 per transaction (passed to client or absorbed)
Setup: ~1 week for basic flow, 2-3 weeks for full dashboard
```

---

## 8. PREDICTION MARKETS + BETTING — DETAILED REVENUE MODEL

### VERDICT: KEEP + 100X. This is the fastest path to revenue.

**Why prediction markets are the #1 revenue priority:**
1. Polymarket did $1B+ volume in 2024 — the market is proven
2. 10% win commission + 2% volume fee = 12% effective take rate
3. Crypto-native users bet fast and bet often (high frequency revenue)
4. No enterprise sales cycle needed — users find you through Twitter/crypto communities
5. Directly feeds TrendPulse engagement (see signal → bet → check results → repeat)
6. Every bet generates platform revenue regardless of who wins

### Revenue Math

```
Conservative (Month 1):
  200 active traders × $500/mo avg volume × 12% fee = $12,000/mo

Growth (Month 3):
  700 active traders × $750/mo avg volume × 12% fee = $63,000/mo

Scale (Month 6):
  2,000 active traders × $1,000/mo avg volume × 12% fee = $240,000/mo

This ALONE can carry you past $100K MRR.
```

### What Must Be Built

```
Week 1-2: Backend settlement
├── Supabase tables: users, bets, markets, settlements, balances
├── Atomic bet placement (deduct balance → record bet → confirm)
├── Market resolution engine (auto-resolve crypto via price oracle)
├── Manual resolution queue for non-crypto markets
├── Commission auto-deduction (10% on payouts)
└── Volume fee tracking (2% on all trades)

Week 2-3: Real money integration
├── Phantom wallet connection (Solana)
├── USDC deposit flow (user sends USDC → balance credits)
├── USDC withdrawal flow (user requests → 0.5% fee → send USDC)
├── Fiat onramp (MoonPay or Stripe for credit card → USDC)
└── Balance persistence in Supabase (not localStorage)

Week 3-4: Market expansion
├── User-created markets ($10 creation fee)
├── Order book with market-maker spread
├── Social features (follow/copy traders)
├── Tournament system (weekly leagues, prize pools)
└── API for programmatic trading
```

---

## 9. SMD — SECOND APP (POST-$100K MRR)

### VERDICT: Focus GOATED. Build SMD only after $100K MRR.

Two products at $0 MRR = twice the cost, zero the revenue. GOATED's prediction markets + B2B alone can hit $100K MRR. Don't dilute.

### SMD Concept (parked for Q3/Q4 2026)
- Recycles removed GOATED features (Creator Economy, AI Builder, Marketplace)
- Targets: Crypto creators, indie hackers, degen traders
- Revenue: $0-99/mo SaaS + 5% transaction fee
- Launch only when GOATED has traction + revenue to fund development

---

## 10. $100K MRR ROADMAP — 90-DAY SPRINT

### Month 1: Ship Revenue Engine (Target: $20K MRR)

```
WEEK 1-2: Prediction Markets Go Live
├── Backend bet settlement (Supabase)
├── Real USDC deposits via Phantom wallet
├── 24+ active markets with auto-resolution
├── 10% commission + 2% volume fee enforced server-side
├── Leaderboard with real rankings
├── User accounts (Supabase Auth)
└── Target: 200 traders × $500 vol = $100K vol → $12K fees

WEEK 2-3: TrendPulse Premium Launch
├── Paywall real-time data ($49/mo minimum)
├── Free tier: 15-min delayed, no alerts, no signals
├── Paid: Real-time + alerts + AI briefings + export
├── Twitter/X launch: "Free 7-day trial of the Palantir for crypto"
└── Target: 150 subscribers × $49 = $7,350 MRR

WEEK 3-4: Auth + Subscriptions
├── Supabase Auth (email + wallet login)
├── Stripe Billing (subscription management)
├── Usage metering (API calls, VoIP minutes)
└── Onboarding flow (absorb StartBusiness data)

Month 1 Total: ~$19,350 MRR
```

### Month 2: B2B Engine + Scale (Target: $70K MRR)

```
WEEK 5-6: VoIP + SMS Activation
├── Twilio Voice API (click-to-call)
├── Twilio SMS (cold outreach sequences)
├── Deepgram real-time transcription
├── AI coaching overlay (Claude whisper)
├── Local presence dialing
└── Call recording with post-call AI summary

WEEK 7-8: Consolidated Leads + 10% Commission
├── Merge Finder → Leads (4-tab page)
├── Stripe Connect split payments (90/10)
├── Invoice → payment → auto-commission
├── Pipeline kanban
├── Email sequences (SendGrid)
└── AI proposal generator

Revenue:
  Predictions:    400 traders × $650 vol × 12% = $31,200
  TrendPulse:     250 users × $65 avg          = $16,250
  B2B SaaS:       50 users × $149              = $7,450
  B2B Commission: 15 deals × $25K × 10%        = $37,500
  Overage:                                      = $2,000
  ──────────────────────────────────────────────────────
  Month 2 Total:                                 $94,400
```

### Month 3: AI Agents + $100K+ (Target: $150K+ MRR)

```
WEEK 9-10: AI Agent Launch
├── Email Agent (autonomous cold email + reply handling)
├── Caller Agent (AI voice qualification via Bland.ai/Retell.ai)
├── Signal Agent (automated market alerts)
├── Research Agent (nightly lead enrichment)
└── Agent dashboard with activity log

WEEK 11-12: Growth Flywheel
├── Referral program (20% rev share, lifetime)
├── ProductHunt launch (TrendPulse angle)
├── Crypto Twitter influencer partnerships
├── Discord/Telegram community
├── Scale tier push ($299/mo)

Revenue:
  Predictions:    700 traders × $750 vol × 12%  = $63,000
  TrendPulse:     400 users × $75 avg           = $30,000
  B2B SaaS:       120 users × $175 avg          = $21,000
  B2B Commission: 25 deals × $30K × 10%         = $75,000
  AI Overage:                                    = $5,000
  VoIP/SMS:                                      = $4,000
  Referrals:                                     = $3,000
  ──────────────────────────────────────────────────────
  Month 3 Total:                                  $201,000
```

### Year 1 Vision: $500K MRR

```
Prediction Markets:  5,000 traders × $1K vol × 12% = $600K/mo (capped at realistic $300K)
TrendPulse Premium:  2,000 users × $100 avg        = $200K/mo
B2B SaaS:            500 users × $200 avg           = $100K/mo
B2B Commission:      100 deals/mo × $30K × 10%     = $300K/mo (capped at $150K)
AI/Usage:                                           = $50K/mo
──────────────────────────────────────────────────────────────
Year 1 Run Rate:                                     ~$500K MRR = $6M ARR
```

---

## 11. INVESTOR PITCH

### One-Liner
"GOATED is the Bloomberg Terminal meets Polymarket meets Apollo — real-time market intelligence, prediction markets, and B2B deal closing in one platform, taking 10% of all value flowing through."

### Deck (12 slides)

```
1. COVER: GOATED — AI-Powered Revenue Intelligence
2. PROBLEM: Traders use 8 tools. Sales teams use 10. Everyone drowns in tabs.
3. SOLUTION: Intelligence + Predictions + Closing. 10% of all value.
4. DEMO: TrendPulse + Markets + Lead Intelligence (3 screenshots)
5. MARKET: $50B market data + $50B predictions + $50B CRM = $150B TAM
6. MODEL: SaaS ($49-499/mo) + 10% commission + 2% volume + usage fees
7. TRACTION: MRR, users, volume, deals closed, signal accuracy
8. TECH: Claude AI, Solana settlement, 4+ real-time APIs, WebRTC
9. MOAT: Proprietary signals + network effects (more bettors = better odds)
10. COMPETITION: We're the intersection nobody else occupies
11. TEAM: Solo founder, full-stack + AI + Web3 + sales
12. ASK: $500K pre-seed at $5M cap for 18mo runway

Key Metrics:
├── MRR + growth rate (target 20%+ MoM)
├── Platform volume (predictions + deals GMV)
├── Signal accuracy (backtested, builds trust)
├── Net revenue retention (>100%)
├── ARPU (target $120+ blended)
└── CAC payback (<3 months via organic/community)
```

---

## 12. IMPLEMENTATION TIMELINE

### Week 1-2: Revenue Foundation
```
[ ] Supabase Auth + user accounts (email + Phantom wallet)
[ ] Prediction market backend (bets, settlements, balances tables)
[ ] Connect Phantom wallet for real USDC deposits/withdrawals
[ ] 10% win commission + 2% volume fee enforced server-side
[ ] Remove routes: /builder, /market, /start-business
[ ] Merge Finder enrichment data into LeadsPage
[ ] TrendPulse: Upgrade to WebSocket price feeds (Binance)
[ ] TrendPulse: Add Twitter/X sentiment (via API)
```

### Week 3-4: B2B Outreach Engine
```
[ ] Activate Twilio (VoIP + SMS)
[ ] Click-to-call from lead profiles
[ ] SMS cold outreach sequences (5-touch drip)
[ ] Deepgram real-time transcription
[ ] AI coaching overlay for live calls (Claude Haiku, <500ms)
[ ] SendGrid email integration (cold email + tracking)
[ ] TrendPulse premium paywall (Stripe Billing, $49/mo gate)
[ ] Push alert system for signals (Twilio SMS)
```

### Week 5-6: Closing + Consolidation
```
[ ] Stripe Connect split payments (90/10 for B2B invoices)
[ ] Consolidated Leads page (4 tabs: Discover, Engage, Close, Intelligence)
[ ] Pipeline kanban in Close tab
[ ] AI proposal generator (Claude Sonnet)
[ ] 3D GOAT mascot optimization (lazy-load, mobile fallback)
[ ] Referral program launch (20% rev share)
```

### Week 7-8: AI Agents + Scale
```
[ ] Email Agent (autonomous cold email with reply handling)
[ ] Caller Agent (AI voice qualification via Bland.ai/Retell.ai)
[ ] Signal Agent (automated market alerts and briefings)
[ ] Research Agent (nightly lead enrichment via Apollo)
[ ] Agent dashboard with activity log
[ ] User-created prediction markets ($10 fee)
[ ] Tournament system (weekly prediction leagues)
```

### Week 9-12: Growth + Polish
```
[ ] Mobile optimization (betting must work on phone)
[ ] Performance audit (bundle size, load times, 60fps animations)
[ ] Social features (follow/copy traders, share positions)
[ ] ProductHunt launch (TrendPulse angle)
[ ] Crypto Twitter campaign
[ ] Discord/Telegram community
[ ] Iterate based on real user feedback + metrics
```

---

## FINAL DECISION MATRIX

| Decision | Answer | Confidence |
|----------|--------|------------|
| Keep 3D GOAT? | YES — improve + optimize | 100% |
| Keep TrendPulse? | YES — 100X with real data, no dummies | 100% |
| Keep Prediction Markets? | YES — 100X, fastest revenue path | 100% |
| Keep Social Sentiment? | YES — bundle into TrendPulse premium | 100% |
| Keep Web3/Wallet? | YES — Solana-first, real USDC | 100% |
| Keep B2B LeadGen? | YES — 100X with VoIP/SMS/email | 100% |
| Keep AI Overlay? | YES — improve with multi-model routing | 100% |
| Remove AI App Builder? | YES | 100% |
| Remove Finder? | YES — merge into Leads | 100% |
| Remove Creator Economy? | YES — no ROI at current scale | 95% |
| Remove Start Business? | YES — absorb into Onboarding | 100% |
| Remove standalone Comms? | YES — strip to per-lead thread in Leads | 100% |
| 10% commission on everything? | YES — via Stripe Connect + on-chain | 100% |
| SaaS vs Commission? | HYBRID (SaaS floor + commission upside) | 95% |
| Solana vs multi-chain? | Solana-first, multi-chain after $100K MRR | 90% |
| Build SMD now? | NO — after GOATED hits $100K MRR | 95% |
| Custom LLM? | NO — Claude API now, fine-tune after $50K MRR | 90% |

---

## CONSOLIDATED GOATED NAVIGATION (FINAL)

```
🏠 Dashboard       — Portfolio P&L, AI briefing, 3D GOAT, quick actions
📊 TrendPulse      — Real-time sentiment, signals, news, alerts, global trends
🎰 Markets         — Prediction markets, betting, leaderboard, tournaments
🎯 Leads           — Discover → Engage → Close → Intelligence (all-in-one)
💰 Wallet          — Solana wallet, USDC, invoices, commissions, GOAT token
🤖 AI Agents       — Autonomous email, calling, signals, research
⚙️ Settings        — Account, billing, integrations, API keys

Pages: 13 → 7 (46% reduction)
Every page has a clear revenue purpose.
```

---

## WHAT DIFFERENTIATES GOATED FROM EVERYTHING ELSE

```
vs Bloomberg Terminal ($25K/yr):
  We're 100x cheaper, AI-native, with integrated betting on the data you see.

vs Polymarket:
  We add real-time intelligence + AI signals on TOP of prediction markets.
  See the data → understand why → bet on it → get paid. Full loop.

vs Apollo/LinkedIn Sales Nav:
  We don't just show leads — we call them (VoIP), email them (sequences),
  coach you live (AI), and close the deal (invoicing) — all in one page.

vs Santiment/LunarCrush ($200-2K/mo):
  We combine ALL their data sources into one composite signal engine,
  add AI interpretation, and let you bet on the signals. They show data. We make money.

vs Whop:
  Similar dark/premium aesthetic, but we're intelligence + trading + B2B.
  Not a storefront. A revenue machine.

The intersection of these 5 products = GOATED. Nobody else occupies this space.
```

---

*Living document. Update monthly. Next review: April 2026.*
*Ship from goated-app repo. Port backend from goated-solutions. Archive goated-v2.*
