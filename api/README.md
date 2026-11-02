# GOATED Solutions - API Routes

Vercel serverless functions for the GOATED sales app. Node 24.

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
| `/api/chat` | POST | GOATED AI. xAI `grok-4`, then Groq `qwen/qwen3.8-27b` if xAI is unset |
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

## Leads

`GET /api/leads` searches Google Places. With no `location` query, the city is the caller's. `source=saved` is the signed-in book and returns 401 otherwise. `action=place` loads one business for `#/lead/{id}`.

There is no `/api/market-data`, `/api/trends`, `/api/health`, `/api/analytics`, or `/api/webhook`. Those were CoinGecko, mock analytics, and a Stripe webhook sketch. They are not deployed.
