# GOATED Solutions

**AI-powered B2B sales intelligence platform that helps closers find, qualify, and close high-value deals.**

GOATED combines real-time market intelligence, AI-driven lead scoring, and closing automation into a single platform built for revenue generation.

## What It Does

GOATED solves the core problem for B2B closers: finding the right leads, knowing exactly what to say, and closing faster. The platform generates revenue through a 12% commission on every deal closed through the platform — zero upfront cost to users.

### Core Features

| Feature | Description |
|---------|-------------|
| **Lead Intelligence** | 500K+ scored B2B leads with AI enrichment, close probability scoring, pain point mapping, and multi-channel outreach scripts |
| **GOATED AI** | Sales copilot powered by Claude that generates personalized cold call scripts, email sequences, SMS campaigns, objection handling, and closing strategies |
| **TrendPulse** | Real-time market intelligence — crypto sentiment, sector rotation signals, prediction market data from Polymarket & Kalshi, and actionable alpha plays |
| **Close Coach** | Step-by-step deal coaching with real-time commission tracking, pipeline health monitoring, and proactive follow-up suggestions |
| **Dashboard** | Pipeline analytics, revenue forecasting, deal velocity tracking, and KPI monitoring |
| **Wallet** | Solana/USDC integration, commission tracking, Stripe Connect for payments, Plaid for bank connections |
| **Casino** | Prediction market betting with GOAT token economy — price predictions, event outcomes, and portfolio challenges |

### Revenue Model

- **$0 platform fee** — completely free to use
- **12% commission** on every deal closed through the platform
- Users keep 88% of every deal they close
- Prediction market spreads: 2-5% on betting volume
- Future: Pro tier at $29/mo, Enterprise custom pricing

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| State | Zustand (single store, 58KB+) |
| Animation | Framer Motion + CSS keyframes |
| 3D | Three.js + React Three Fiber (SentimentGlobe) |
| Auth | Supabase (Google, GitHub OAuth) |
| Payments | Stripe Connect + Plaid Bank Connect |
| Wallet | Phantom (Solana) |
| AI Chat | Claude Sonnet 4.6 via Anthropic API |
| AI Engine | Custom GOATED AI v2 (RSI, MACD, Bollinger, regime detection) |
| Backend | Vercel Serverless Functions (11 endpoints) |
| Analytics | Vercel Analytics + Speed Insights |
| Hosting | Vercel (Hobby plan) |

## Architecture

```
goated-app/
├── api/                    # Vercel serverless functions
│   ├── chat.js             # Claude-powered AI chat
│   ├── goated-ai.js        # Custom AI engine (technical analysis)
│   ├── intelligence.js     # Market intelligence API
│   ├── leads.js            # Apollo.io lead aggregation
│   └── ...                 # 11 total endpoints
├── src/
│   ├── components/
│   │   ├── AIOverlay.jsx   # AI chat panel + signal engine
│   │   ├── LeadDetail.jsx  # Individual lead deep-dive
│   │   ├── Sidebar.jsx     # Navigation
│   │   └── ...
│   ├── hooks/
│   │   ├── useStore.js     # Zustand store (leads, auth, UI state)
│   │   └── useGoatedAI.js  # AI engine hook
│   ├── pages/
│   │   ├── LeadsPage.jsx   # Lead table + filtering
│   │   ├── DashboardPage.jsx
│   │   ├── TrendsPage.jsx  # Market intelligence
│   │   ├── WalletPage.jsx
│   │   └── ...
│   └── lib/
│       └── supabase.js     # Auth, realtime, cloud sync
└── docs/                   # Business strategy docs
```

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ANTHROPIC_API_KEY

# Run development server
npm run dev

# Build for production
npm run build
```

## Key Metrics (Target)

| Metric | Current | Target (90 days) |
|--------|---------|-------------------|
| Active Users | ~20 | 500 |
| MRR | $0 | $250K |
| Avg Deal Size | — | $15-20K |
| Commission/Deal | — | $1,800-$2,400 |
| Deals Closed/Month | — | 100+ |

## How Users Make Money

**Fastest path to $8-25K:**
1. Sign up (free, 30 seconds)
2. Browse AI-scored leads filtered by industry, location, deal size
3. Use GOATED AI to generate personalized outreach (call scripts, emails, SMS)
4. Close the deal using AI coaching and objection handling
5. Collect 88% commission via Stripe/Plaid

**Average time to first close:** Target 2-4 weeks

## Security

- CORS: Per-endpoint origin whitelist (no wildcards)
- Rate limiting: Sliding window per IP on all API endpoints
- Input sanitization: HTML/script stripping on all user inputs
- CSP headers, HSTS, X-Frame-Options DENY
- No secrets in client bundle

## Production

- **URL:** https://goated-app-nine.vercel.app
- **Deployment:** Push to `main` branch triggers auto-deploy on Vercel
- **Constraints:** Vercel Hobby plan — max 12 serverless functions (currently 11)

## License

Proprietary. All rights reserved.

---

Built by GOATED Solutions. Making closers money since 2024.
