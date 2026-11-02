# GOATED Solutions - API Routes

Vercel Serverless Functions powering the GOATED Solutions B2B Sales Intelligence + Degen Alpha Platform (v5.1).

## API Endpoints

Vercel Hobby caps a project at 12 serverless functions. We are at 7, and the
budget is the binding constraint on new endpoints — which is why related
operations ride on one route behind an `action` parameter rather than each
taking a slot of their own.

| Endpoint | Method | Description |
|---|---|---|
| `/api/audit` | POST | Live crawl + LLM revenue-loss report |
| `/api/audit` | POST | `action=claim` — attach a contact to a saved audit (inbound lead) |
| `/api/audit` | GET | `?id={shareId}` — replay a saved report; `?inbound=1` — admin inbound queue |
| `/api/chat` | POST | GOATED AI assistant (Groq) |
| `/api/leads` | GET | Google Places lead sourcing |
| `/api/leads` | GET | `action=whoami` — server-authoritative identity |
| `/api/leads` | GET | `action=enrich` — contact extraction from the prospect's own site |
| `/api/leads` | GET | `action=photo` — Places photo proxy (keeps the API key server-side) |
| `/api/dashboard` | GET | Operator dashboard aggregation |
| `/api/goated-ai` | POST | Assistant backend |
| `/api/intelligence` | GET | Market/company intelligence |
| `/api/voice` | POST | Voice agent (Vapi) |

## Auth

Google sign-in (Supabase) is optional. The browser attaches the session token when one exists and still calls these routes without one.

| Call | Session |
|---|---|
| `POST /api/chat` | None. The assistant works signed out. |
| `GET /api/leads` (Places search), `action=place`, `action=photo`, `action=enrich` | None. Anonymous searches are returned and not stored. A signed-in search is saved under that user. |
| `GET /api/leads?action=whoami` | None required. With no token the body is `{ signedIn: false, isAdmin: false }`. |
| `GET /api/leads?source=saved` | Required. `401` without a session. |
| `POST /api/audit`, `GET /api/audit?id=` | None. A signed-in scan is filed under that user; an anonymous scan is stored with no owner. |
| `GET /api/audit?inbound=1` | Admin only. `403` unless the token's email is on `ADMIN_EMAILS`. |

The dashboard and admin **pages** are the account wall in the client. Admin also checks the same allow-list. A signed-in visitor who is not on that list is sent home.

**Removed in this revision:** `/api/trends`, `/api/sentiment`, `/api/plays` and
`/api/market-data`. They existed only for the disabled Trends page, and three of
the four returned `Math.random()` rather than real data. `src/pages/TrendsPage.jsx`
is still on disk, per the decision to keep hidden pages, but it is unrouted and
its `fetch('/api/sentiment')` call now has no endpoint behind it — reviving that
page means rebuilding the data layer first.

---

## API keys

Names only. Values go in `.env.local` (gitignored) or the Vercel project environment. Never commit them. `.env.example` is the blank template.

| Variable | Used by | Client-visible? |
|---|---|---|
| `XAI_API_KEY` | Chat, audit, intelligence. Preferred model `grok-4`. | No |
| `GROQ_API_KEY` | Same routes when xAI is unset. Model `qwen/qwen3.8-27b`, fallback `openai/gpt-oss-120b`. | No |
| `GOOGLE_PLACES_API_KEY` | Lead search and place permalinks | No |
| `APOLLO_API_KEY` | Organization search for larger deals | No |
| `VAPI_PRIVATE_KEY` or `VAPI_API_KEY` | `/api/voice` | No |
| `VAPI_ASSISTANT_ID`, `VAPI_PHONE_NUMBER_ID` | `/api/voice` | No |
| `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` | Saving audits and leads | No |
| `VITE_SUPABASE_URL` | Browser auth client | Yes, public by design |
| `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY` | Browser auth client | Yes, public by design. Row-level security is what protects the data. |
| `VITE_LAUNCH_READY` | Cover page | Yes, a flag, not a secret |
| `ADMIN_EMAILS` | `whoami` and the inbound audit queue | No |

Claude is not called. ZoomInfo, Clearbit, Twitter, SerpAPI, and TikTok are not wired to a live route.

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
