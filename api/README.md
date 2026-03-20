# GOATED Solutions - API Routes

Vercel Serverless Functions powering the GOATED Solutions platform.

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/chat` | POST | AI chat assistant (Claude) |
| `/api/leads` | GET | Lead data aggregation from Apollo, ZoomInfo, Clearbit |
| `/api/market-data` | GET | Real-time crypto/market prices from CoinGecko |
| `/api/trends` | GET | Trending topics aggregation |
| `/api/health` | GET | System health check and diagnostics |
| `/api/analytics` | GET/POST | Event tracking and KPI aggregation |
| `/api/webhook` | POST | Webhook receiver for Stripe, Apollo, GitHub, Slack |

---

## API Keys Required

### Required (Core Functionality)

| Service | Env Variable | Get Key At | Used By |
|---|---|---|---|
| **Anthropic (Claude AI)** | `ANTHROPIC_API_KEY` | https://console.anthropic.com/ | `/api/chat` - AI assistant |

### Optional (Enhanced Data)

| Service | Env Variable | Get Key At | Used By | Free Tier? |
|---|---|---|---|---|
| **CoinGecko** | None needed | https://www.coingecko.com/ | `/api/market-data` | Yes (30 req/min) |
| **Apollo.io** | `APOLLO_API_KEY` | https://app.apollo.io/ | `/api/leads?source=apollo` | Yes (limited) |
| **ZoomInfo** | `ZOOMINFO_API_KEY` | https://www.zoominfo.com/ | `/api/leads?source=zoominfo` | No |
| | `ZOOMINFO_USERNAME` | | | |
| | `ZOOMINFO_PASSWORD` | | | |
| **Clearbit** | `CLEARBIT_API_KEY` | https://dashboard.clearbit.com/ | `/api/leads?source=clearbit` | Yes (limited) |
| **Stripe** | `STRIPE_SECRET_KEY` | https://dashboard.stripe.com/apikeys | Payments | Yes (test mode) |
| | `STRIPE_WEBHOOK_SECRET` | https://dashboard.stripe.com/webhooks | `/api/webhook?source=stripe` | |
| **Twitter/X** | `TWITTER_BEARER_TOKEN` | https://developer.twitter.com/ | `/api/trends` | Yes (limited) |
| **SerpAPI** (Google Trends) | `SERPAPI_KEY` | https://serpapi.com/ | `/api/trends` | Yes (100 searches/mo) |
| **TikTok** | `TIKTOK_API_KEY` | https://developers.tiktok.com/ | `/api/trends` | Requires approval |
| **GitHub** | `GITHUB_WEBHOOK_SECRET` | GitHub repo Settings | `/api/webhook?source=github` | Yes |
| **Slack** | `SLACK_SIGNING_SECRET` | https://api.slack.com/apps | `/api/webhook?source=slack` | Yes |

### Future / Database

| Service | Env Variable | Notes |
|---|---|---|
| **Database** | `DATABASE_URL` | PostgreSQL, MySQL, etc. for persistent storage |
| **Redis** | `REDIS_URL` | Caching layer (Upstash recommended for Vercel) |
| **PostHog** | `POSTHOG_API_KEY` | Open-source analytics alternative |

---

## Setting Environment Variables

### In Vercel (Production)

```bash
# Using Vercel CLI
vercel env add ANTHROPIC_API_KEY
vercel env add APOLLO_API_KEY
vercel env add STRIPE_SECRET_KEY
# ... etc

# Or set them in the Vercel Dashboard:
# Project Settings -> Environment Variables
```

### Local Development

Create a `.env.local` file in the project root (it is already gitignored):

```env
ANTHROPIC_API_KEY=sk-ant-...
APOLLO_API_KEY=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Endpoint Details

### GET /api/leads

Fetch lead data from various sources.

```bash
# Mock data (default)
curl "http://localhost:3000/api/leads"

# With filters
curl "http://localhost:3000/api/leads?industry=Fintech&minScore=70&limit=10"

# From Apollo (requires API key)
curl "http://localhost:3000/api/leads?source=apollo&limit=25"
```

**Query Parameters:**
- `source` - `mock` (default), `apollo`, `zoominfo`, `clearbit`
- `limit` - Number of leads (1-100, default: 25)
- `offset` - Pagination offset (default: 0)
- `industry` - Filter by industry name
- `minScore` - Minimum lead score (0-100)

---

### GET /api/market-data

Fetch real-time cryptocurrency prices.

```bash
# Default (BTC, ETH, SOL)
curl "http://localhost:3000/api/market-data"

# Custom coins
curl "http://localhost:3000/api/market-data?coins=bitcoin,ethereum,dogecoin,cardano"

# Different currency
curl "http://localhost:3000/api/market-data?vs=eur"
```

**Query Parameters:**
- `coins` - Comma-separated CoinGecko IDs (default: `bitcoin,ethereum,solana`)
- `vs` - Fiat currency code (default: `usd`)

---

### GET /api/trends

Fetch trending topics with business relevance scoring.

```bash
# All categories
curl "http://localhost:3000/api/trends"

# Specific category
curl "http://localhost:3000/api/trends?category=ai&limit=10"
```

**Query Parameters:**
- `category` - `all`, `tech`, `finance`, `crypto`, `marketing`, `ai`
- `limit` - Number of trends (1-50, default: 20)

---

### GET /api/health

System health and diagnostic information.

```bash
curl "http://localhost:3000/api/health"
```

Returns: memory usage, uptime, environment variable status, runtime info.

---

### POST /api/analytics

Track user events.

```bash
curl -X POST "http://localhost:3000/api/analytics" \
  -H "Content-Type: application/json" \
  -d '{"event": "page_view", "properties": {"page": "leads"}, "userId": "user_123"}'
```

### GET /api/analytics

Retrieve aggregated analytics.

```bash
# Last 24 hours
curl "http://localhost:3000/api/analytics?period=24h"

# Last 7 days, filtered by event
curl "http://localhost:3000/api/analytics?period=7d&event=page_view"
```

**Query Parameters (GET):**
- `period` - `1h`, `24h`, `7d`, `30d`
- `event` - Filter by event type

**Valid Event Types:**
`page_view`, `button_click`, `feature_used`, `lead_viewed`, `lead_contacted`, `ai_chat`, `ai_query`, `search`, `export`, `filter_applied`, `deal_updated`, `playbook_used`, `signup`, `login`, `logout`, `subscription_change`, `error`, `custom`

---

### POST /api/webhook

Receive webhooks from external services.

```bash
# Stripe webhook
curl -X POST "http://localhost:3000/api/webhook?source=stripe" \
  -H "Content-Type: application/json" \
  -d '{"type": "checkout.session.completed", "data": {"object": {"id": "cs_test_123"}}}'

# Custom webhook
curl -X POST "http://localhost:3000/api/webhook?source=custom" \
  -H "Content-Type: application/json" \
  -d '{"event": "custom_event", "data": {"key": "value"}}'
```

**Query Parameters:**
- `source` - `stripe`, `apollo`, `github`, `slack`, `custom`

---

## Architecture Notes

- All endpoints are Vercel Serverless Functions (Node.js runtime)
- CORS is enabled on all endpoints
- Error handling with try/catch on every route
- In-memory storage is used for analytics and webhook logs (resets on cold start)
- CoinGecko data is cached for 60 seconds to respect rate limits
- Mock data generators match the exact shape of the frontend store objects
- All real API integrations are commented out with full working code, ready to uncomment when API keys are configured
