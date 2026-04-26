# Solana Degen Trading Platform Research & GOATED Strategic Analysis

**Date:** March 25, 2026
**Scope:** Competitive analysis of GMGN.ai, Jupiter (jup.ag), and Axiom Trade
**Purpose:** Identify opportunities for GOATED Solutions to bridge B2B sales intelligence with degen crypto alpha

---

## Table of Contents

1. [Platform Deep Dives](#platform-deep-dives)
   - [GMGN.ai](#1-gmgnai---the-smart-money-tracker)
   - [Jupiter](#2-jupiter-jupag---the-defi-superapp)
   - [Axiom Trade](#3-axiom-trade---the-speed-terminal)
2. [Ecosystem Trends](#ecosystem-trends)
3. [Opportunities for GOATED](#opportunities-for-goated-solutions)
4. [Feature Recommendations](#specific-feature-recommendations)
5. [Revenue Playbook](#revenue-playbook)
6. [Sources](#sources)

---

## Platform Deep Dives

### 1. GMGN.ai - The Smart Money Tracker

**Revenue:** ~$85M annually | **Fee:** 1% per transaction | **Rating:** 8.7/10 (trading performance)

#### Features

| Category | Details |
|----------|---------|
| **Smart Money Tracking** | Real-time wallet monitoring, KOL tracking, whale alerts, unrealized/realized PnL display |
| **Copy Trading** | One-click replication of successful traders, AFK automation (trades while you sleep) |
| **Token Security** | 27-parameter risk scoring (1-100), rug pull detection, honeypot analysis, contract auditing |
| **AI Signals** | Real-time token discovery alerts, trend detection, early mover identification |
| **Multi-Chain** | Solana, ETH, BSC, Base, Monad |
| **Telegram Bot** | Full trading capability via Telegram with sniping, limits, and copy trade alerts |
| **Anti-MEV** | Sandwich attack protection (requires 0.002 SOL priority fee minimum) |

#### UX/UI Approach
- Dark mode default, data-dense terminal aesthetic
- Real-time streaming data everywhere — prices, wallet movements, token launches
- Mobile app (Android/iOS) plus web terminal plus Telegram bot — triple surface area
- Heavy use of color-coded PnL (green/red) to trigger emotional engagement
- "Discovered early" badges and timestamps create FOMO mechanics

#### Monetization
- 1% platform fee on every successful transaction (simple, no premium tiers needed at this volume)
- Free tier exists with limited features; advanced analytics behind paywall
- Anti-MEV as upsell (need higher priority fees)
- At $85M annual revenue on transaction fees alone, the model prints money

#### What Makes It Sticky
- **Smart money following is addictive.** Watching whale wallets in real-time triggers the same dopamine as watching a sports ticker. Users check obsessively.
- **Copy trading removes friction.** "Set it and forget it" means users stay even when they are not actively trading.
- **Fear of missing the next 100x.** AI signals and early discovery alerts keep users opening the app compulsively.
- **Social proof loops.** Seeing other wallets profit creates urgency.

#### User Complaints
- **Trust issues:** Trustpilot rating of 2.1/5. Multiple reports of funds being moved without confirmation from Telegram bot wallets (especially amounts over 10 SOL).
- **Fee complaints:** Higher fees for advanced features feel extractive.
- **Latency spikes:** Platform slows during market surges — exactly when speed matters most.
- **Mobile app instability:** App crashes after updates, even on high-end devices.
- **Forced re-login:** Every 30 days, disrupting automation.
- **UI clutter:** TradingView grids reappear after being disabled.

#### Key Takeaway
GMGN nailed the "who's making money right now and how do I copy them" use case. Their weakness is trust and reliability. A platform that offers the same intelligence with better trust architecture has a massive opening.

---

### 2. Jupiter (jup.ag) - The DeFi Superapp

**Revenue:** $1.11B in fees (2025) | **Market Share:** 95% of Solana DEX aggregation | **50%+ of all Solana DEX volume**

#### Features

| Category | Details |
|----------|---------|
| **Swap Aggregation** | Best-price routing across all Solana DEXs, no platform fee on standard swaps |
| **Limit Orders** | On-chain limit orders with fee on execution |
| **DCA (Dollar-Cost Averaging)** | Automated recurring buys at intervals |
| **Perpetuals (JupPerps)** | Leveraged trading via JLP liquidity pool, top-10 perp DEX by volume |
| **Lending (Jupiter Lend)** | Launched Aug 2025, hit $1B in supplied assets in 8 days. Up to 95% LTV ratios |
| **JUP Token** | Governance, staking, 50% of fees go to buybacks via Litterbox Trust |
| **JupSOL** | Liquid staking token |
| **JupUSD** | Native stablecoin, expanding utility through Q1 2026 |
| **Jupnet** | Omnichain network aggregating liquidity across blockchains (launching 2026) |

#### UX/UI Approach
- Clean, minimalist interface — stark contrast to data-dense terminals
- Inter font family, modern design system with smooth transitions
- "Just works" philosophy — swap is one screen, one action
- Progressive complexity: simple swap on surface, advanced features (perps, lending) deeper in navigation
- JavaScript-heavy SPA, fast rendering

#### Monetization
- No fee on standard swaps (loss leader to capture volume)
- Fees on limit orders, DCA, perpetuals, lending, JupSOL deposits/withdrawals
- 50% of all protocol fees go to JUP buybacks (Litterbox Trust, 2-year lock)
- Considering redirecting 50% of fees to staker rewards
- $57.9M spent on buybacks in 2025
- Net-zero emission model — no new JUP tokens for team, buybacks offset distributions

#### What Makes It Sticky
- **Default routing.** 95% market share means every Solana user touches Jupiter. Network effects are a moat.
- **Full-stack DeFi.** Swap, borrow, lend, perp, stake — no reason to leave.
- **Token incentives.** JUP staking, Jupuary airdrops (400M JUP in May 2026), creates holding behavior.
- **Trust.** Largest, most audited, most liquid. Safety by default.
- **Ecosystem gravity.** Every new Solana token lists on Jupiter first. It is the liquidity layer.

#### User Complaints
- JUP token underperforms despite platform profitability ("profitable platform, underperforming token" paradox)
- $57.9M in buybacks failed to meaningfully move price
- Complex governance decisions alienate casual users
- Lending is new and untested at scale compared to Aave/Compound

#### Key Takeaway
Jupiter is infrastructure. It is the Stripe of Solana DeFi — everyone uses it, nobody thinks about it. The lesson: own the routing layer and monetize at the edges. GOATED should integrate Jupiter for execution, not compete with it.

---

### 3. Axiom Trade - The Speed Terminal

**Revenue:** $390M in 263 days | **Fee:** 0.95% base | **Per-User Revenue:** $252.10 | **Backed by Y Combinator (W25)**

#### Features

| Category | Details |
|----------|---------|
| **Low-Latency Engine** | Colocated RPC nodes, execution within one Solana block (<400ms) |
| **Migration Snipers** | Auto-buy tokens the instant they graduate from Pump.fun to Raydium |
| **Limit Orders** | On-chain resting orders |
| **Ladder Orders** | DCA-style averaging into positions |
| **Whale Tracking** | Real-time whale wallet insights |
| **Social Sentiment** | Twitter/X sentiment integration |
| **Perpetuals** | Via Hyperliquid integration (BTC, ETH with deep liquidity) |
| **Yield Tools** | Automated yield farming |
| **Fiat On-Ramp** | Coinbase-powered, up to $500/week, no KYC (added July 2025) |
| **Non-Custodial** | Full self-custody, no deposits to centralized ledger |

#### UX/UI Approach
- All-in-one terminal: swaps, wallet tracking, social tracking, perps, yield — single interface
- Speed-first design — everything optimized for millisecond advantages
- Data-dense but organized — Bloomberg terminal aesthetic for degen traders
- Dark mode, real-time price feeds, alert systems

#### Monetization
- 0.95% base fee per transaction (Wood tier)
- Tiered cashback system reduces effective fee as volume increases
- Referral program with 10% fee discount for referred users
- $252.10 per-user revenue — extremely high monetization density
- $390M in 263 days is one of the fastest revenue ramps in crypto history

#### What Makes It Sticky
- **Speed wins.** In memecoin sniping, 400ms is the difference between 10x and -90%. Speed creates dependency.
- **Migration snipers are crack.** Auto-buying Pump.fun graduates creates passive income feeling.
- **All-in-one reduces context switching.** Traders hate switching between tools. Axiom bundles everything.
- **Fiat on-ramp removes barriers.** New users can start with credit card, no CEX needed.

#### The Scandal (February 2026)
- **ZachXBT exposed massive insider trading.** Senior BD lead Broox Bauer and others used "God mode" internal dashboards to view private user data — wallet histories, linked accounts, trade timings.
- **Front-running users for 10+ months.** Employees allegedly pocketed $400K+ by trading on non-public user data.
- **Recorded admission.** Bauer claimed on a recorded call he could "track any Axiom user and find out anything to do with that person."
- **Company response was weak.** "Shocked and disappointed" statement, removed tool access, promised investigation. No structural changes announced.
- **Trust destruction.** This is existential for a non-custodial platform. The entire value proposition is "your keys, your control" — but employees were surveilling users.

#### User Complaints (Pre-Scandal)
- High fees compared to alternatives
- Limited to Solana ecosystem primarily
- Complex interface for beginners

#### Key Takeaway
Axiom proved the demand: traders will pay $252/user for speed and intelligence. But the scandal proves the vulnerability: centralized front-ends with internal tooling are ticking time bombs. **There is now a massive trust vacuum in the Solana trading terminal space.** This is an opening.

---

## Ecosystem Trends

### Where Solana Degen Trading Is Heading

**1. Attention Markets Are the New Asset Class**
Zora launched "attention markets" on Solana in February 2026 — users pay 1 SOL to create markets around hashtags, viral narratives, and cultural moments. This signals a shift from "trade tokens" to "trade attention." Prediction markets + memecoins + social signals are converging.

**2. AI Agents Are Taking Over Execution**
Crypto trading platforms are racing to deploy AI agents for analysis, trade suggestions, and autonomous execution. The expectation is AI agents will handle routine trading decisions, with humans setting strategy and risk parameters. This is already happening in institutional trading and is trickling down to retail degen.

**3. Copy Trading Is Becoming Table Stakes**
Every platform now offers copy trading. It is no longer a differentiator — it is a minimum requirement. The next frontier is **curated copy trading** (who to follow matters more than the ability to follow) and **AI-filtered copy trading** (automatically selecting which trades to copy based on your risk profile).

**4. Speed Wars Are Reaching Physical Limits**
Axiom's <400ms execution via colocated nodes is approaching the physical limits of Solana's block time (~400ms). The speed advantage is commoditizing. The next edge is not faster execution but **smarter signal** — knowing what to trade before others even see it.

**5. Multi-Chain Is Mandatory**
GMGN supports 6 chains. Jupiter is building Jupnet for omnichain liquidity. Single-chain platforms are increasingly viewed as limited. However, Solana remains the center of degen activity due to speed and cost.

**6. Trust Is the Scarce Resource**
Post-Axiom scandal, traders are hyper-aware that platforms with internal dashboards can surveil and front-run them. Transparency, open-source code, and verifiable non-surveillance are becoming competitive moats.

**7. The Shift from Memes to Infra**
Data shows trading flows shifting from meme tokens to SOL-stablecoin pairs. The pure degen memecoin phase is maturing. Traders want tools that work across market regimes, not just during meme seasons.

### What New Features Are Emerging

- **Fiat on-ramps without KYC** (Axiom via Coinbase, $500/week)
- **Attention/narrative markets** (Zora on Solana)
- **AI-powered trade execution agents** (multiple platforms racing)
- **Integrated lending with aggressive LTV** (Jupiter Lend at 95%)
- **Cross-chain liquidity aggregation** (Jupnet)
- **Token security scoring as a service** (GMGN's 27-parameter model)
- **Mobile-first terminals** (GMGN's triple-surface approach: web + mobile + Telegram)

### The Gap Between B2B Sales Intelligence and Degen Trading

Nobody occupies the intersection. Here is why that gap exists and why it is actually a massive opportunity:

| B2B Sales Intelligence | Degen Trading | The Overlap |
|----------------------|---------------|-------------|
| Lead scoring | Token scoring | Both are signal-to-noise problems |
| Pipeline tracking | Portfolio tracking | Both track value through stages |
| Deal velocity | Trade velocity | Both optimize for speed-to-close |
| ICP (Ideal Customer Profile) | Ideal Token Profile | Both filter opportunities by fit |
| Competitive intel | Smart money tracking | Both monitor what sophisticated actors are doing |
| Commission on closed deals | Profit on closed trades | Both monetize outcomes, not activity |
| CRM workflows | Trading workflows | Both need automation to scale |
| Objection handling | Risk management | Both manage downside scenarios |
| Territory mapping | Chain/sector mapping | Both segment opportunity by geography/category |

The insight: **a closer and a degen trader have the same cognitive profile.** They are pattern-matchers who thrive on speed, conviction, and information asymmetry. The tools they need are structurally identical — just applied to different asset classes (deals vs. tokens).

---

## Opportunities for GOATED Solutions

### Unmet Needs GOATED Could Fill

**1. The Trust Terminal**
Post-Axiom scandal, there is no trusted all-in-one Solana terminal. GOATED's commission-based model ($0 platform fee + 10% on closed deals) already signals alignment with users. Extending this trust-first positioning to crypto trading ("we only make money when you make money") is a massive differentiator.

**2. The Closer's Intelligence Layer**
No platform connects "who is buying this token" with "who is buying this company's product." Imagine: you are prospecting a SaaS company and GOATED shows you their treasury wallet is accumulating SOL, or their CEO is a known crypto KOL. That is actionable B2B intel nobody else has.

**3. AI That Serves Both Sides**
GOATED AI already does RSI, MACD, Bollinger, regime detection, predictions, and correlations. This engine can serve dual purposes:
- **For closers:** "This prospect's industry sentiment is bullish — they are likely expanding budget. Strike now."
- **For degens:** "This token's RSI is oversold and smart money is accumulating. Entry signal."
Same engine, two interfaces, double the value.

**4. The "Deal Flow" for Tokens**
Sales people understand pipeline. No crypto platform presents tokens as a pipeline: Discovery > Research > Entry > Position Management > Exit. GOATED could be the first platform that treats token trading with the same rigor as deal closing.

**5. Curated Alpha, Not Raw Data**
GMGN and Axiom dump raw data on users. Most traders are overwhelmed. GOATED's existing lead scoring and qualification model could be adapted to score tokens — not just "is this token safe?" but "is this token right for YOUR strategy, risk profile, and portfolio?"

### Features from These Platforms That Enhance GOATED

| Feature | Source | How GOATED Adapts It |
|---------|--------|---------------------|
| Smart money tracking | GMGN | "Smart Closer Tracking" — follow top-performing closers AND whale wallets |
| Token security scoring | GMGN | Integrate as risk filter in DEGEN MODE, same way lead quality scoring works |
| Jupiter swap integration | Jupiter | Embed Jupiter Terminal SDK for in-app trading execution |
| Migration sniping alerts | Axiom | Alert system for new token launches, filtered by AI for quality |
| Attention markets | Zora | "Narrative Radar" — track trending narratives that affect both deals and tokens |
| Fiat on-ramp | Axiom/Coinbase | Lower barrier to entry for closers who want to start trading |
| Social sentiment | Axiom | Already have sentiment in TrendsPage — extend to per-token and per-company level |

### How GOATED Bridges B2B Closing with Degen Alpha

**The "DEGEN OS FOR CLOSERS" Positioning Is Correct. Here Is How to Operationalize It:**

1. **Unified Dashboard.** Left panel: your deal pipeline. Right panel: your token portfolio. Center: AI intelligence feed that surfaces connections between both.

2. **Cross-Domain Signals.** "Company X just raised Series B" triggers both a B2B lead alert AND a signal to watch their sector's tokens. "Token Y in DeFi lending is surging" triggers both a trading signal AND a lead alert for fintech companies that might need your product.

3. **Commission Symmetry.** $0 platform fee + 10% on closed B2B deals. Mirror this for crypto: $0 platform fee + small % on profitable trades. You only eat when users eat. This is the anti-Axiom model.

4. **The Closer's Edge.** Frame crypto trading as a skill that makes you a better closer: pattern recognition, risk management, speed of decision, conviction under uncertainty. GOATED is not a trading platform with sales tools bolted on — it is a **performance platform for high-agency individuals** who close deals and trade tokens because they are the same cognitive muscle.

### Revenue Opportunities Being Missed

| Opportunity | Estimated Impact | Difficulty |
|-------------|-----------------|------------|
| Transaction fees on in-app swaps (via Jupiter) | High — even 0.1% on volume adds up | Medium (Jupiter Terminal SDK exists) |
| Premium "Alpha Tier" with AI trade signals | High — $29-99/mo subscription | Low (AI engine exists) |
| Copy trading commissions (% of profits from copied trades) | Medium-High | High (requires custody infra) |
| Referral revenue from Jupiter/exchange integrations | Medium | Low (affiliate programs exist) |
| Token security audits as a service | Medium | Medium (extend existing scoring) |
| Fiat on-ramp integration fees | Low-Medium | Low (Coinbase/MoonPay APIs) |
| "GOATED Certified" token badge (projects pay for audit) | Medium | Medium |

---

## Specific Feature Recommendations

### IMPLEMENT (High Priority)

**1. Jupiter Terminal Integration**
Embed Jupiter's swap terminal directly in GOATED. Users can trade without leaving the platform. GOATED takes a thin fee or earns from Jupiter's referral program. This is the single fastest path to crypto revenue. Jupiter provides a React SDK that can be embedded in days.

**2. Token Pipeline View**
A kanban-style board (like a sales CRM) for managing token positions:
- **Watchlist** (Discovery)
- **Researching** (Due Diligence)
- **Position Open** (Active)
- **Taking Profit** (Exiting)
- **Closed** (Realized PnL)

This is unique. No crypto platform presents trading this way. Sales people will immediately understand it.

**3. DEGEN MODE Alpha Feed Enhancement**
Upgrade the existing DEGEN MODE toggle with:
- Real-time Pump.fun graduation alerts (filtered by AI for quality)
- Smart money wallet movement alerts (top 50 wallets on Solana)
- Token security quick-scan (pass/fail with key risk factors)
- Narrative/attention tracking ("DeFi lending is trending, here are the plays")

**4. AI Dual-Signal Engine**
Extend the existing GOATED AI (`/api/goated-ai.js`) to output parallel signals:
- **Closer Signal:** "Healthcare SaaS spending is up 23% this quarter. Your pipeline has 12 healthcare leads — prioritize them."
- **Degen Signal:** "Healthcare tokens (DeSci) are lagging the sector by 2 weeks. Historical pattern suggests catch-up pump incoming."
- **Cross Signal:** "3 of your prospect companies have treasury wallets accumulating SOL. They're crypto-native — adjust your pitch."

**5. Wallet Connect + Portfolio View**
Add Phantom wallet connection (you already have Phantom integration). Show portfolio value, PnL, and position history alongside B2B deal metrics. One dashboard, two income streams.

### IMPLEMENT (Medium Priority)

**6. "Who's GOATED" Leaderboard**
Gamified leaderboard showing top performers across BOTH domains:
- Top closers (deal volume, close rate)
- Top traders (portfolio PnL, win rate)
- Combined "GOATED Score" (weighted composite)
This creates community, competition, and retention.

**7. Narrative Radar**
A dedicated view in the Trends page that tracks trending narratives across crypto Twitter, Reddit, and news — then correlates them with both token movements AND industry trends that affect B2B sales. Uses the existing sentiment analysis but adds narrative clustering.

**8. Mobile Alerts (Push Notifications)**
GMGN and Axiom prove that real-time alerts are retention drivers. Implement push notifications for:
- Lead status changes
- Token price alerts
- Smart money movements
- AI-generated "action now" signals

### DO NOT IMPLEMENT (Avoid Clone Work)

**1. Do NOT build a DEX or swap routing engine.**
Jupiter owns this with 95% market share. Integrate, do not compete. Building swap infra is a multi-year, multi-million dollar effort with no moat.

**2. Do NOT build copy trading infrastructure.**
This requires custodial complexity, regulatory risk, and massive engineering. The liability from the Axiom scandal shows the downside. Instead, surface "who to watch" and let users execute manually or via Jupiter.

**3. Do NOT build migration sniping bots.**
Sub-400ms execution requires colocated infrastructure. This is an arms race with diminishing returns. Instead, provide the intelligence layer — tell users WHICH migrations to watch, not execute the snipe.

**4. Do NOT launch a token.**
Jupiter's JUP token paradox (profitable platform, underperforming token) proves that tokens can be a distraction. GOATED's value is in the platform, not a speculative asset. Avoid tokenomics complexity.

**5. Do NOT build perpetuals/leverage trading.**
Regulatory minefield. Jupiter and Hyperliquid own this. GOATED's brand is "smart closing" not "leveraged gambling."

**6. Do NOT build a Telegram bot.**
GMGN's Telegram bot has trust issues (fund theft reports). Telegram bots require private key exposure. Keep users on the web platform where you control the security model.

---

## Revenue Playbook

### Phase 1: Foundation (Now - 3 Months)

| Action | Revenue Model | Est. Monthly |
|--------|--------------|-------------|
| Jupiter Terminal embed | Referral fee on swap volume | $500-5K (scales with users) |
| Alpha Tier subscription | $29/mo for AI trade signals + advanced analytics | $2.9K per 100 subscribers |
| Existing 10% commission on B2B deals | Already live | Current revenue |

### Phase 2: Growth (3-6 Months)

| Action | Revenue Model | Est. Monthly |
|--------|--------------|-------------|
| Token security audit requests | $99 per deep audit, $9 per quick scan | $5-20K |
| "GOATED Certified" badge for projects | $500-2000 per project | $5-15K |
| Premium Narrative Radar feed | $49/mo add-on | Incremental |
| Fiat on-ramp integration | Revenue share with provider | $1-5K |

### Phase 3: Scale (6-12 Months)

| Action | Revenue Model | Est. Monthly |
|--------|--------------|-------------|
| Enterprise "GOATED for Teams" | $99/seat/mo for sales teams with crypto alpha | $10-50K |
| API access for signal data | Usage-based pricing | $5-20K |
| White-label intelligence feed | B2B licensing | $10-30K |

### The Moat Statement

**Nobody else combines B2B sales intelligence with degen crypto alpha because they think these are different users. They are wrong. The best closers and the best traders share the same traits: speed, conviction, pattern recognition, and information asymmetry. GOATED is the only platform that weaponizes both sides of this brain.**

The competitive landscape validates this:
- GMGN has smart money tracking but zero B2B capability
- Jupiter has DeFi infrastructure but zero intelligence layer
- Axiom had speed but destroyed trust
- ZoomInfo/Apollo have B2B data but zero crypto awareness
- None of them see what GOATED sees: **the closer and the degen are the same person**

---

## Sources

### GMGN.ai
- [GMGN.ai Official](https://gmgn.ai/)
- [GMGN Platform Review - Bitbond](https://www.bitbond.com/resources/gmgn-platform-review/)
- [GMGN.AI Memecoin Exchange Review - Secrets To Trading](https://www.secretstotrading101.com/decentralized-exchanges-dexs/gmgn-ai/)
- [GMGN Solana Trading Bot - Medium](https://medium.com/@gemQueenx/gmgn-857d7b15eec7)
- [GMGN Advanced Analytics - Solana Compass](https://solanacompass.com/projects/gmgn)
- [GMGN Trustpilot Reviews](https://www.trustpilot.com/review/gmgn.ai)
- [GMGN Fees & Revenue - DefiLlama](https://defillama.com/protocol/fees/gmgn)
- [Is GMGN Safe? - SellThePump](https://sellthepump.com/is-gmgn-safe/)

### Jupiter
- [Jupiter Official](https://jup.ag/)
- [What Is Jupiter (JUP)? - CoinGecko](https://www.coingecko.com/learn/what-is-jupiter-crypto-solana)
- [Jupiter JupUSD and DeFi Upgrades - CoinPedia](https://coinpedia.org/news/jupiter-unveils-jupusd-stablecoin-and-major-defi-upgrades-at-solana-breakpoint-2025/)
- [Jupiter Lend - Jupiverse Lovers](https://www.jupiverse-lovers.com/2025/05/23/jupiter-lend-solana-fluid-partnership/)
- [Jupiter DEX Aggregator Guide - LBank](https://www.lbank.com/explore/jupiter-dex-aggregator-jup-coin-solana-defi)
- [What Is Jupiter Exchange? - Nansen](https://www.nansen.ai/post/what-is-jupiter-exchange)
- [Jupiter TVL, Fees, Revenue - DefiLlama](https://defillama.com/protocol/jupiter)
- [Jupiter's Paradox - Medium](https://medium.com/@bokiko/jupiters-paradox-a-profitable-platform-an-underperforming-token-30a8d34c7410)
- [MET and JUP Top 2025 Fees - Bitcoin Ethereum News](https://bitcoinethereumnews.com/tech/met-and-jup-top-in-2025-fees-heres-what-to-expect-2026/)

### Axiom Trade
- [Axiom Trade Official](https://axiom.trade/)
- [Axiom Pro Crypto Review 2026 - West Africa Trade Hub](https://westafricatradehub.com/reviews/axiom-pro/)
- [Axiom Trade Review 2026 - Solana Trading Bots](https://solanatradingbots.com/axiom-trade-how-to-use/)
- [Axiom Trade Review - MEXC](https://www.mexc.com/news/622580)
- [Axiom Fees - DefiLlama](https://defillama.com/protocol/fees/axiom)
- [Axiom Insider Trading Scandal - TradingView](https://www.tradingview.com/news/99Bitcoins:351a5884f094b:0-axiom-exchange-insider-trading-scandal-is-your-trading-data-being-used-against-you/)
- [Axiom Employees Exposed - CCN](https://www.ccn.com/analysis/crypto/axiom-employees-exposed-insider-trading-scandal-zachxbt/)
- [ZachXBT Axiom Allegations - CoinDesk](https://www.coindesk.com/markets/2026/02/26/zachxbt-alleges-axiom-employee-conducted-insider-trading)
- [Axiom $400K Insider Trading - Yahoo Finance](https://finance.yahoo.com/news/axiom-crypto-exposed-zachxbt-alleges-122625589.html)
- [Axiom $390M Revenue Analysis - AInvest](https://www.ainvest.com/news/axiom-390m-revenue-477k-insider-profit-flow-analysis-2602/)
- [Best Axiom Alternatives After Scandal - Medium](https://medium.com/@gemQueenx/best-axiom-trade-alternatives-my-journey-finding-reliable-crypto-trading-tools-after-the-big-8c26ccbaa347)

### Ecosystem & Trends
- [Zora Attention Markets on Solana - CoinDesk](https://www.coindesk.com/tech/2026/02/18/zora-moves-onto-solana-with-attention-markets-for-trading-internet-trends)
- [AI Agents in Crypto Trading - CoinDesk](https://www.coindesk.com/business/2026/03/19/crypto-trading-platforms-race-to-deploy-ai-agents-job-losses-to-artificial-intelligence-will-continue-to-mount)
- [Jupiter Lend Public Beta - Eastern Progress](https://www.easternprogress.com/the-most-advanced-money-market-on-solana-is-here-jupiter-lend-public-beta-is-live/article_0f8150a3-7c9b-537b-b33b-f61bc038ebbe.html)
- [Axiom Y Combinator - Sacra](https://sacra.com/c/axiom/)
