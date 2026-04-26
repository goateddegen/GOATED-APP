# GOATED Solutions

**AI agency for local service businesses. We capture the calls and bookings they're losing — using AI voice agents, SMS automation, and custom integrations.**

GOATED helps HVAC shops, dental practices, plumbing companies, med spas, roofing contractors, and other local service SMBs reclaim revenue they're leaking on missed calls, no-show appointments, and dormant customer lists. Two-tier productized service backed by a custom-built AI stack.

---

## What We Do

Most local service businesses miss 30-60% of inbound calls. Each missed call is a $200-1,500 lost job. We deploy AI to answer those calls in <60 seconds, book appointments, follow up via SMS, generate Google reviews, and revive dormant customer lists.

### Two tiers

| Tier | Setup | Monthly | Target |
|------|-------|---------|--------|
| **Local Engine** | $2,000 | $750 | Solo + small SMBs |
| **Growth Engine** | $10K-20K | $2.5K-5K + opt rev share | $2M+ revenue SMBs |

Both tiers include a **30-day money-back guarantee.** Real risk reversal — if it doesn't work, you don't pay.

### Core capabilities

| Module | What it does |
|--------|--------------|
| **AI Voice Agent** | Picks up missed calls, qualifies leads, books appointments, texts owner a transcript |
| **SMS Auto-Text-Back** | Every missed call triggers a 30-second follow-up text |
| **Review Engine** | Auto-requests Google reviews from happy customers at the optimal moment |
| **Reactivation Campaigns** | Mines dormant customer lists for recoverable revenue |
| **GMB Optimization** | AI-generated posts to Google Business Profile 3×/week |
| **Custom AI Builds** | Multi-location brain, custom RAG agents, owner copilots, photo-based estimators |

Full module catalog: [`docs/UPSELL_CATALOG.md`](./docs/UPSELL_CATALOG.md) (35 modules with implementation specs).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| State | Zustand |
| Animation | Framer Motion |
| 3D | Three.js + React Three Fiber |
| Voice AI | VAPI (with Bland AI / Retell as alternatives) |
| SMS / Phone | Twilio (HIPAA-eligible tier for healthcare) |
| Calendar | Cal.com |
| Auth | Supabase |
| Payments | Stripe Payment Links + Stripe Connect (later) |
| AI Reasoning | Claude (Anthropic API) — Haiku for high-volume, Sonnet for premium |
| Custom AI Engine | GOATED AI v2 (`/api/goated-ai.js`) — RSI, MACD, Bollinger, regime detection |
| Backend | Vercel Serverless Functions (11 endpoints, max 12 on Hobby) |
| Hosting | Vercel |
| Domain | goated-app-nine.vercel.app |

---

## Repository Structure

```
goated-app/
├── api/                    # Vercel serverless functions (11 endpoints)
│   ├── chat.js             # Claude-powered AI chat
│   ├── goated-ai.js        # Custom AI engine
│   ├── intelligence.js     # Market/prospect intelligence
│   ├── leads.js            # Lead aggregation
│   └── ...
├── src/
│   ├── components/         # React components
│   ├── hooks/              # Zustand store + custom hooks
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── AuditPage.jsx   # Free public audit funnel (lead-gen front door)
│   │   ├── LeadsPage.jsx
│   │   ├── DashboardPage.jsx
│   │   └── ...
│   └── lib/
│       ├── config.js       # PRICING.tiers (Tier 1 + Tier 2)
│       └── supabase.js
├── docs/                   # Business strategy + tactical playbooks
│   ├── EXECUTION_PLAN_2026.md
│   ├── SCALE_PLAYBOOK.md
│   ├── CLOSING_PLAYBOOK.md
│   ├── UPSELL_CATALOG.md   # 35 modules
│   ├── OUTREACH_PLAYBOOK.md
│   ├── OPSEC_PLAYBOOK.md
│   ├── LIFESTYLE_AND_FINANCE.md
│   ├── FINANCIAL_GROWTH_STRATEGY.md
│   └── README.md           # Doc index
└── README.md (this file)
```

Full doc index: [`docs/README.md`](./docs/README.md)

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# See INTEGRATIONS.md for required keys

# Run development server
npm run dev

# Build for production
npm run build
```

---

## Key Targets (Phase 0 → Phase 1)

| Metric | Phase 0 (now) | Phase 1 (12 mo) |
|--------|---------------|------------------|
| Active clients | 0 | 30 mixed |
| MRR | $0 | $30K |
| Cumulative cash | $0 | $200-400K |
| Team size | 1 (Tarek) | 2-3 (Tarek + VA + closer) |
| Avg deal LTV | — | $20-90K (24 mo retention) |
| Gross margin | — | 90%+ |

Path to $1M MRR mapped in [`docs/SCALE_PLAYBOOK.md`](./docs/SCALE_PLAYBOOK.md).

---

## Security & Compliance

- **CORS:** per-endpoint origin whitelist (no wildcards)
- **Rate limiting:** sliding window per IP on all endpoints
- **Input validation:** HTML/script stripping, length limits
- **CSP headers, HSTS, X-Frame-Options DENY**
- **No secrets in client bundle**
- **HIPAA:** Twilio HIPAA-eligible tier available for healthcare deployments; BAAs on file
- **A2P 10DLC:** registered for SMS compliance

---

## Production

- **Live URL:** https://goated-app-nine.vercel.app
- **Deployment:** push to `master` → auto-deploy on Vercel
- **Constraints:** Vercel Hobby plan — max 12 serverless functions (currently 11)
- **Status:** private launch (cover gate via `VITE_LAUNCH_READY=false`); flip to `true` when going live

---

## License

Proprietary. All rights reserved. © 2026 GOATED Solutions LLC.

---

*Built in Texas. Bootstrapped. Brand-first. The brand speaks — the founder dials.*
