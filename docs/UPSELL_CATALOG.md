# GOATED — Upsell & Integration Catalog

**Owner:** Tarek Ali
**Updated:** 2026-04-24
**Use:** Match an offering to the prospect's actual pain, not your inventory. Lead with **one** offer per call.

---

## How to use this catalog

Every module below has the same shape:
- **What it is** — one line
- **Who it's for** — vertical + revenue range
- **What you charge** — setup + monthly
- **What it costs you** — tools + your time
- **How long to deliver** — first version live
- **How to implement** — concrete steps

Each module has a tier tag:
- 🟢 **CORE** — included in Tier 1 / Tier 2 base offers
- 🟡 **UPSELL** — add-on, sold individually after the base is delivered
- 🟠 **CUSTOM** — only for $10K+ Growth Engine deals, scoped per client

---

## 🟢 CORE — bundled into base tiers

### 1. AI Voice Agent for Missed Calls (CORE — Tier 1 + 2)
**What:** AI answers missed calls within 60 seconds, qualifies the lead, books an appointment, texts the owner a transcript.
**Who:** Any phone-driven business — HVAC, dental, plumbing, med spa, roofing, chiropractic, auto.
**You charge:** Tier 1 → bundled with $2,000 setup. Tier 2 → bundled.
**Costs you:** VAPI ~$0.05/min × ~30 min/day per client = ~$45/mo at scale. Bland AI alternative ~$0.09/min. OR Retell ~$0.07/min.
**Time to deliver:** 4-8 hours per client. Voice config + intent prompts + calendar webhook.
**How to implement:**
1. Buy a Twilio number for their area code ($1.15/mo) OR forward their existing number
2. Set up VAPI assistant: industry-tuned system prompt + their hours + their calendar
3. Webhook → Cal.com / Calendly to book confirmed leads
4. SMS to owner via Twilio after every booked call
5. Test with 5 sample voicemails before going live

### 2. SMS Auto-Text-Back (CORE — Tier 1 + 2)
**What:** Every missed call triggers a text in <30 sec: "Hey, sorry we missed you — what can we help with?" Two-way SMS conversation routed to owner's phone.
**Who:** Same as #1.
**You charge:** Bundled.
**Costs you:** Twilio SMS ($0.0079/msg) + A2P 10DLC registration ($4 brand + $2/mo per campaign).
**Time to deliver:** 2-3 hours.
**How to implement:**
1. Twilio webhook on call status → SMS via Twilio API
2. Forward replies to owner's phone (Twilio number forwarding)
3. Quick reply templates ("Yes book me," "Not now," "Send pricing")
4. A2P 10DLC registration with The Campaign Registry — required for US carriers.

### 3. Calendar Booking Integration (CORE — Tier 1 + 2)
**What:** Two-way sync between owner's existing calendar (Google/Outlook/Square Appt) and incoming AI-qualified leads.
**Who:** Anyone with appointment-based revenue.
**You charge:** Bundled.
**Costs you:** Cal.com free tier handles 50/mo — covers most Tier 1 clients. Pro $12/mo if needed.
**Time to deliver:** 1-2 hours.
**How to implement:**
1. Cal.com event type with their availability
2. Webhook from VAPI on confirmed booking
3. Confirmation email + SMS to lead and owner

### 4. Monthly Revenue Recovery Report (CORE — Tier 1 + 2)
**What:** Plain-English email on the 1st of each month: calls answered, leads booked, estimated revenue recovered.
**Who:** Every client (this is your renewal weapon).
**You charge:** Bundled.
**Costs you:** 30 min/client/month to assemble.
**Time to deliver:** First report by day 30.
**How to implement:**
1. Pull data from VAPI dashboard + Twilio logs
2. Plug into your AI summarizer (Claude API, $0.05/report)
3. Send via Resend + a clean HTML template

---

## 🟡 UPSELL — sold separately after Tier 1 delivery

### 5. Website Chatbot Embed ($1,500 setup + $300/mo)
**What:** AI chat widget on their site, trained on their FAQ + pricing + service area. Captures leads and books them when the receptionist's offline.
**Who:** Any business with a website that gets >500 visitors/mo. Especially med spa, dental, online booking-driven.
**You charge:** $1,500 setup + $300/mo.
**Costs you:** Custom Claude/GPT prompt + tiny Vercel edge function (~$0). Or Crisp/Intercom Fin if hands-off ($30-100/mo split).
**Time to deliver:** 6-8 hours.
**How to implement:**
1. Scrape their site → extract FAQs, pricing, service descriptions (use your `/api/audit` data)
2. Build system prompt with that context + booking CTAs
3. Deploy as a `<script>` snippet they paste into their site
4. Stream Claude Haiku replies (cheap)
5. Booking actions hand off to their Cal.com / phone tree

### 6. Review Generation Automation ($1,500 setup + $300/mo)
**What:** Auto-text every paid customer 24h after service: "If you'd give us 5 stars, here's the link 👉 [Google review URL]". Routes 4-5 stars to public, 1-3 stars to private feedback for owner.
**Who:** Any local business with Google Business Profile.
**You charge:** $1,500 setup + $300/mo.
**Costs you:** Twilio + simple webhook from their POS / job-tracking software.
**Time to deliver:** 4-6 hours per client.
**How to implement:**
1. Webhook integration with their software (ServiceTitan, Jobber, Housecall Pro for trades; Mindbody, Vagaro for spas/wellness)
2. Twilio cron: 24h after job-marked-complete, send the SMS
3. Star-routing logic: ≥4 → public Google link; ≤3 → private form
4. Owner gets weekly digest of negative-feedback texts

### 7. Cold Email Outbound Sequencing ($2,000 setup + $1,000/mo)
**What:** We run a 5-touch cold email sequence to a list of THEIR ideal prospects. Inboxes warmed, list scraped, copy AI-personalized.
**Who:** Tier 2 only — online businesses, B2B, agencies. Not for HVAC/local trades.
**You charge:** $2,000 setup + $1,000/mo (covers ~500 emails/day across 3 inboxes).
**Costs you:** Smartlead $39/mo + 3 inboxes × $6/mo Google Workspace = ~$60/mo. Plus AI tokens for personalization.
**Time to deliver:** 14 days (12 of those are inbox warmup).
**How to implement:**
1. Register a fresh outbound domain (e.g., `getclient-name.com`)
2. Set up SPF/DKIM/DMARC (Cloudflare DNS, free)
3. 3 inboxes per domain, warm via Smartlead 14 days
4. Scrape ICP list with Apollo + ListKit
5. AI-personalize first line per prospect (Claude, ~$0.005/email)
6. 5-touch sequence over 14 days, replies → client's phone/email

### 8. SMS Reactivation Blast for Old Customers ($1,500 flat)
**What:** One-time blast: scrape their CRM/POS for inactive customers (90+ days), send a re-engage SMS with a special offer. Clean ROI demo on day 1.
**Who:** Anyone with an existing customer database — med spa, dental, salon, gym, retail.
**You charge:** $1,500 flat (no monthly).
**Costs you:** Twilio per-SMS + 4-6 hours setup.
**Time to deliver:** 5-7 days.
**How to implement:**
1. Pull contacts list from their POS (Mindbody, Square, Toast, etc.)
2. Filter: last visit ≥90 days, has phone number, has consent
3. AI-generate two SMS variants (A/B)
4. Send via Twilio in batches with throttle
5. Replies forward to owner's phone
6. Day 7: send results report ("47 replies, 12 booked, $X recovered")

### 9. Google Business Profile Optimizer ($800 flat + $200/mo)
**What:** Optimize their GBP for local SEO: complete profile, weekly post automation, photo uploads, Q&A monitoring.
**Who:** Any local business with a physical location.
**You charge:** $800 setup + $200/mo.
**Costs you:** GBP API access (free) + 30 min/week per client.
**Time to deliver:** 3-5 days.
**How to implement:**
1. Audit existing GBP → identify gaps (hours, services, photos, attributes)
2. Fill all 100% (services, products, hours, holidays)
3. Set up auto-post script (1 post/week from a content template + their photos)
4. Monitor Q&A daily, AI-draft responses for owner approval

### 10. Personalized Video Outreach (Tavus AI) ($2,500 setup + $800/mo)
**What:** AI-generated personalized video for each cold lead — "Hey [Name], I just looked at [their website], here's what I noticed..." — sent over LinkedIn or email.
**Who:** Tier 2 — agencies, consultants, B2B SaaS.
**You charge:** $2,500 setup + $800/mo.
**Costs you:** Tavus $59/mo (250 videos) + AI script gen.
**Time to deliver:** 7-10 days.
**How to implement:**
1. Record one base video of you/the client doing the pitch
2. Tavus clones their voice + lip-sync to AI-generated personalized script per lead
3. AI-generates the script per lead (using their company data)
4. Send via cold email or LinkedIn DM

---

## 🟠 CUSTOM — Growth Engine ($10K+) only

### 11. Custom Industry-Specific AI Agent ($5,000-$15,000 setup + $1,500-$3,000/mo)
**What:** Bespoke AI agent trained on the client's specific workflow, pricing, knowledge base. Examples:
- **HVAC AI Estimator** — customer describes problem → AI gives instant range quote based on their pricing
- **Dental Insurance Pre-Qual AI** — patient gives insurance info → AI checks coverage and pre-quals before booking
- **Roofing AI Inspector** — customer uploads roof photos → AI flags damage, generates quote
- **Med Spa Treatment Recommender** — quiz-style intake → AI recommends services based on goals
- **Real Estate Listing Description Generator** — agent uploads photos + specs → AI generates polished listing copy
**Who:** Tier 2 with specific repeatable workflows. $1M+ revenue.
**You charge:** $5,000-$15,000 setup + $1,500-$3,000/mo.
**Costs you:** Claude Sonnet API ($3/M input + $15/M output) — typically $50-200/mo at client scale. Plus 2-4 weeks of your time to build.
**Time to deliver:** 3-6 weeks.
**How to implement:**
1. Discovery week: shadow their workflow, document inputs/outputs, gather example data
2. Build RAG knowledge base on their docs/pricing/policies (use Pinecone or Supabase pgvector)
3. Build agent with Claude tool-use (e.g., book_appointment, lookup_pricing, send_quote)
4. Web UI or embed in their existing tool
5. Iterate over 2 weeks of testing with their team
6. Go live, monitor, refine

### 12. Custom Internal Dashboard / Reporting ($3,000-$8,000 setup + $500/mo)
**What:** Build a custom dashboard for their business. Pulls from their tools (POS, CRM, ads) into one screen. Adds AI summaries.
**Who:** Tier 2 with multiple tools that don't talk to each other.
**You charge:** $3,000-$8,000 setup + $500/mo.
**Costs you:** Retool ($10/user/mo) or Vercel + custom React. ~30-60 hours your time.
**Time to deliver:** 2-3 weeks.
**How to implement:**
1. Map their existing tools (POS, CRM, ad platforms, Google Analytics)
2. Pull data via APIs into Supabase / PostgreSQL
3. Build dashboard in Retool OR custom React app on Vercel
4. AI daily summary email: "Here's what changed yesterday + what to act on"

### 13. Workflow Automation (n8n / Zapier) ($2,500 setup + $500/mo)
**What:** Connect their tools so they stop manually copying data. E.g., "When someone books on Cal.com → add to HubSpot → send welcome SMS → notify Slack → schedule follow-up email day 3."
**Who:** Any client doing repetitive admin work. Tier 1 add-on or Tier 2 base.
**You charge:** $2,500 setup + $500/mo (covers ongoing tweaks + monitoring).
**Costs you:** n8n Cloud $20/mo or self-hosted free. Zapier $30/mo if simpler.
**Time to deliver:** 1-2 weeks.
**How to implement:**
1. Map their daily admin tasks (interview their team)
2. Identify 3-5 repetitive flows
3. Build in n8n with triggers + actions across their tools
4. Test with team, iterate
5. Document flows in Notion for them

### 14. Programmatic SEO Landing Pages ($4,000-$10,000 setup + $800/mo)
**What:** Generate 50-500 SEO-optimized landing pages from a template + their data. E.g., "Best HVAC in [city]" × 100 cities.
**Who:** Multi-location service businesses, e-com with many SKUs, marketplaces.
**You charge:** $4,000-$10,000 setup + $800/mo (content refresh + monitoring).
**Costs you:** Claude API for content + Vercel for hosting. ~$50/mo.
**Time to deliver:** 3-4 weeks.
**How to implement:**
1. Identify their template (e.g., service × location)
2. Pull data from Google Maps, Wikipedia, Census for each location
3. Generate page content with Claude (cached, deduped)
4. Build static site on Astro/Next.js, deploy to Vercel
5. Submit XML sitemap, monitor with Search Console

### 15. Custom Booking System ($3,000-$10,000 setup + $300/mo)
**What:** Replace their hodge-podge of Google Calendar + paper notebook + Excel with a real custom booking app. Built on their actual workflow.
**Who:** Trades, professional services, multi-location practices.
**You charge:** $3,000-$10,000 setup + $300/mo.
**Costs you:** Cal.com self-hosted (free) + custom front-end OR build from scratch on Supabase.
**Time to deliver:** 2-4 weeks.
**How to implement:**
1. Discovery: existing booking flow, edge cases, integrations needed
2. Build minimal viable scheduling system (Cal.com + custom UI)
3. Wire to their CRM, calendar, SMS notifications
4. Train staff, go live in 2 weeks

### 16. AI-Powered SDR Replacement ($8,000-$15,000 setup + $2,500-$5,000/mo)
**What:** We replace their human SDR with an AI agent that researches prospects, sends personalized outreach across channels (email + LinkedIn + SMS + voice), books qualified meetings on the rep's calendar.
**Who:** Tier 2 SaaS, agencies, consultancies with $1M+ revenue and ≥1 sales rep.
**You charge:** $8,000-$15,000 setup + $2,500-$5,000/mo. Optional 10-15% rev share.
**Costs you:** Stack: Apollo $99/mo + Smartlead $39/mo + VAPI $50/mo + Claude $100/mo + your time.
**Time to deliver:** 3-4 weeks.
**How to implement:**
1. Discovery: their ICP, current sequences, conversion data
2. Build outbound stack (warm inboxes, scrape lists, write sequences)
3. AI personalization layer (Claude prompts with prospect context)
4. VAPI agent for follow-up calls + qualification
5. Book straight to their AE's calendar
6. Weekly performance review, iterate

### 17. Computer Vision for Inspection / Quoting ($6,000-$12,000 setup + $1,500/mo)
**What:** Customer uploads photos → AI flags issues + generates instant quote. Use cases: roof damage, auto body, plumbing leaks, HVAC unit identification, pest infestations.
**Who:** Trades that quote based on visual inspection.
**You charge:** $6,000-$12,000 setup + $1,500/mo.
**Costs you:** GPT-4V or Claude Sonnet 4 vision. ~$0.10-0.30/image. ~$50-200/mo at scale.
**Time to deliver:** 3-5 weeks.
**How to implement:**
1. Gather 100-500 labeled training photos from client's past jobs
2. Build prompt-engineered Claude vision agent (no fine-tune needed in v1)
3. Web app: upload photo → get instant assessment + ballpark quote
4. Owner reviews + adjusts before sending to customer
5. Iterate prompt as more data comes in

---

## Industry-specific upsell stacks (which to pitch when)

### HVAC / Plumbing / Electrical
1. CORE: Voice agent + SMS + booking
2. UPSELL: Review automation (#6) — these guys live or die by Google reviews
3. UPSELL: GBP optimizer (#9)
4. CUSTOM: AI Estimator agent (#11) + Dispatch optimization

### Roofing / Solar
1. CORE: Voice agent + SMS + booking
2. UPSELL: Cold email outbound (#7) — storm-season prospect lists
3. CUSTOM: Computer vision for damage assessment (#17) — huge moat
4. CUSTOM: AI SDR replacement (#16)

### Dental / Orthodontic
1. CORE: Voice agent + SMS + booking
2. UPSELL: Review automation (#6)
3. UPSELL: SMS reactivation (#8) — dental practices have huge dormant lists
4. UPSELL: Website chatbot (#5) for insurance pre-qual
5. CUSTOM: Insurance pre-qual AI agent (#11)

### Med Spa / Aesthetics
1. CORE: Voice agent + SMS + booking
2. UPSELL: Review automation (#6)
3. UPSELL: SMS reactivation (#8) — med spas churn fast, reactivation is gold
4. UPSELL: Personalized video outreach (#10) — they're IG-fluent
5. CUSTOM: Treatment recommender quiz (#11)

### Chiropractic / Wellness
1. CORE: Voice agent + SMS + booking
2. UPSELL: SMS reactivation (#8)
3. UPSELL: Review automation (#6)
4. UPSELL: GBP optimizer (#9)

### Real Estate (team or brokerage)
1. UPSELL: Cold email outbound (#7) — agents need leads
2. CUSTOM: AI listing description generator (#11)
3. CUSTOM: AI SDR for buyer leads (#16)

### Online businesses / SaaS / Agencies
1. CUSTOM: AI SDR replacement (#16) — biggest deal
2. CUSTOM: Custom dashboard / reporting (#12)
3. UPSELL: Cold email outbound (#7)
4. UPSELL: Programmatic SEO (#14)

---

## Pricing matrix — what to pitch by deposit budget

| Their budget hint | What you offer | Combined first-month cash |
|---|---|---|
| "I have $500 to play with" | Walk away politely. Not your buyer. | $0 |
| "$1-2K is my limit" | Tier 1 base only ($2K setup + $750/mo) | $2,750 |
| "$3-5K to start" | Tier 1 + #6 review automation | $4,250 |
| "$5-8K range" | Tier 1 + #5 chatbot + #8 SMS reactivation | $7,000+ |
| "$10K+ open" | Tier 2 base + #11 custom agent | $15,000-25,000 |
| "$20-50K serious" | Tier 2 elite + #16 SDR replacement + #11 custom | $30,000-50,000 |

---

## How to upsell the next module (sequencing matters)

1. **Land them on Tier 1.** Don't try to sell #5 + #6 + #7 on day 1.
2. **Deliver Tier 1 over 14 days.** Get the first recovered-revenue report into their inbox.
3. **Day 30 check-in call.** Show them the wins. Then offer ONE upsell module.
4. **Pick the upsell that matches the friction they mentioned.** If they complained about reviews → pitch #6. If they complained about no-shows → already in Tier 1. If they complained about old customers not coming back → pitch #8.
5. **Bundle 2-3 upsells = $2-3K extra cash that month.** This is the compounding play.

---

## Building the offer in real time on the call

Don't pre-build packages. Build it in front of them:

> "OK so you said: missed calls, slow Google reviews, and you have like 800 old patients you haven't talked to in a year. Here's what I'd do for you: voice agent on missed calls, review automation, and a one-time SMS blast to your dormant list. Setup is $4,500, monthly is $1,000. The dormant blast alone usually pays for the setup in week one. Want me to send the link?"

This is a $4,500 deposit + $1,000/mo close — built from their own words. They feel custom-served. You're delivering modules from your catalog.

---

*Catalog version 1 · 2026-04-24 · Add new modules as you build them.*
