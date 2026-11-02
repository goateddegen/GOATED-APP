# GOATED

**The workspace for selling an AI receptionist to local businesses.**

## Elevator pitch

Local shops lose jobs every time the phone rings and nobody picks up. GOATED finds those businesses, prices what the missed calls are costing them, and puts the number, the script, and the quote in one place. The product you sell is an AI receptionist that answers in under a minute, books the job, and texts the owner. Prospecting in the app is free. The client pays for Local Engine or Growth Engine.

Live at [goated.solutions](https://www.goated.solutions).

---

## The app

GOATED is a sales app for an AI agency. You open it, find a business that needs the offer, and leave with something you can say on the phone. An account is optional until you want a saved pipeline.

| Surface | What you do there |
|---------|-------------------|
| **Home** | The product, the two plans, and a way into the audit, the lead book, and GOATED AI. |
| **Audit** | Paste any URL. The app crawls it and prices the gaps. The report has a link you can send. |
| **Leads** | Real local businesses from Google Maps, ranked by how closable they are. Filter for businesses with no website, or for ones whose published hours leave 40+ hours a week with nobody answering. |
| **Lead** | One business: phone, hours, reviews, the quote, and the opener. Command-click opens that lead in its own tab. |
| **GOATED AI** | Ask in plain language. "Find me website clients" and "find me voice agent clients" return lead rows, not a product description. |
| **Dashboard** | Your pipeline. Requires an account. |
| **Admin** | Operator tools. Requires an account on the allow-list. |

Website clients are businesses with no site. The pitch is the build plus the receptionist. Voice-agent clients are businesses that are still trading and unreachable 40 or more hours a week.

---

## Plans

Both plans include a 30-day refund if the work does not produce a measurable result.

| Plan | Setup | Monthly | Who it's for |
|------|-------|---------|--------------|
| **Local Engine** | $2,000 | $750 | HVAC, dental, plumbing, roofing, med spas, and other owner-run shops that lose money when the phone goes unanswered |
| **Growth Engine** | $10,000–$20,000 | $2,500–$5,000, optional revenue share | Larger SMBs, agencies, and online businesses that want the audit, outbound, the voice agent, and a custom build |

Local Engine includes missed-call recovery, SMS follow-up, calendar booking, and a monthly recovered-revenue report. The module catalog is in [`docs/UPSELL_CATALOG.md`](./docs/UPSELL_CATALOG.md).

---

## Accounts

Sign-in is Google through Supabase. It is not required to use the product. The launch cover (`VITE_LAUNCH_READY`) is a separate switch that hides the app before go-live. Turning the cover off does not make an account mandatory.

| Open with no account | Requires an account |
|----------------------|---------------------|
| Home | Dashboard |
| Audit, including a new scan and a shared report link | Admin (also requires an allow-listed operator email) |
| Leads, a lead's page, call, SMS, and scripts | Saved leads (`/api/leads?source=saved`) and cloud sync of that user's data |
| GOATED AI | The inbound audit queue (`/api/audit?inbound=1`) |

A search with no session still returns leads. Those rows are not stored under a user. A signed-in search is.

---

## Stack

| Layer | What runs it |
|-------|----------------|
| App | React 18, Vite 5, Tailwind CSS, Zustand, Framer Motion. Node 24. |
| Routing | Hash routes in `src/App.jsx` (`#/leads`, `#/lead/{id}`, `#/a/{id}`). |
| API | Vercel Serverless Functions in `api/` |
| Leads | Google Places. Apollo organization search when the deal is large and `APOLLO_API_KEY` is set. |
| Assistant and audit | xAI Grok (`grok-4`) when `XAI_API_KEY` is set. Otherwise Groq (`qwen/qwen3.8-27b`, then `openai/gpt-oss-120b`). Claude is not called. |
| Voice agent API | Vapi (`api/voice.js`) |
| Accounts and saved rows | Supabase Auth (Google) and Postgres. The browser only receives the publishable key. |
| Product analytics | Vercel Analytics and Speed Insights |
| Host | Vercel, [goated.solutions](https://www.goated.solutions) |

Stripe Payment Links are the intended checkout. The secret key is never read by the client. Twilio, Cal.com, Unipile, Hunter, and PostHog are named in `.env.example` and are not called by the running app.

## Secrets

Real keys live in `.env.local` on your machine and in the Vercel project environment. They are not committed.

`.gitignore` ignores `.env`, `.env.local`, and every `.env.*` file except the empty template `.env.example`. That template has blank values. Do not paste a key into it, and do not `git add -f` an env file. `VITE_*` values are baked into the browser bundle, so only the Supabase URL, the Supabase publishable key, and `VITE_LAUNCH_READY` belong there. `XAI_API_KEY`, `GROQ_API_KEY`, `GOOGLE_PLACES_API_KEY`, `APOLLO_API_KEY`, `VAPI_PRIVATE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` stay server-side.

---

## Run it

```bash
npm install
cp .env.example .env.local   # fill this copy only; it is gitignored
npm run dev                  # http://localhost:5173
npm run build
```

Pushing `master` deploys. Production is promoted separately on Vercel.

---

## Repo

```
api/            serverless routes (audit, chat, leads, dashboard)
src/pages/      Home, Audit, Leads, Dashboard, Admin
src/components/ lead detail, GOATED AI, account modal
src/hooks/      Zustand store
src/lib/        config, Supabase client
docs/           sales, finance, and launch playbooks — index in docs/README.md
```

API auth rules: [`api/README.md`](./api/README.md). Business playbooks stay in [`docs/`](./docs/README.md).

---

## License

Proprietary. All rights reserved. © 2026 GOATED Solutions LLC.
