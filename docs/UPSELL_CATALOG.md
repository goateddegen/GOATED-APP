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

## 🟠 NEW CUSTOM MODULES (added v2 — 2026-04-25)

These are the modules you can quote on calls when prospects ask "what else?". Each one is implementable solo with the GOATED tech stack already in repo. Use the deposit threshold to qualify the prospect — don't pitch a $25K custom build to a $750/mo prospect.

---

### 14. AI Receptionist (24/7 phone replacement) 🟠 CUSTOM
**What:** Replaces the human receptionist entirely for after-hours, lunch hours, and overflow. Handles intake, booking, FAQs, payment collection, and transfers urgent calls.
**Who:** Practices/shops with $2M+ revenue who can't justify a 24/7 human receptionist.
**You charge:** $5,000 setup + $1,500/mo (vs hiring a human at $40K/yr).
**Costs you:** VAPI premium voice ($0.09/min) + Twilio HIPAA-eligible ($150/mo if healthcare) + Cal.com Enterprise.
**Time to deliver:** 5-7 days.
**Deposit threshold:** $5K+ deal.
**How to implement:**
1. Map ALL inbound call categories (new patient, existing patient, billing, urgent, etc.)
2. Build intent router: VAPI assistant per category with handoff logic
3. Knowledge base: FAQ bank trained on their intake forms + service menu
4. Calendar integration: Cal.com webhook for booking
5. Payment: Stripe Payment Link generation for cash-pay procedures
6. Transfer logic: urgent calls route to owner's mobile via Twilio
7. SMS summary: every call → text summary to office manager next morning

---

### 15. Review Generation Engine 🟡 UPSELL
**What:** Automated 5-star review request engine. Texts every closed-job customer at the optimal moment (4-24 hr post-job) asking for a Google review with a one-click link.
**Who:** Any business with Google Business Profile presence.
**You charge:** $500 setup + $300/mo. OR bundled into Tier 2.
**Costs you:** Twilio SMS ($0.0079/msg) + GMB API access (free).
**Time to deliver:** 2-4 hours.
**How to implement:**
1. Hook into their CRM/PMS to detect "job completed" event (or import CSV weekly)
2. Twilio scheduled SMS at +6 hours post-completion
3. SMS contains shortened Google review link with pre-filled rating
4. Handle replies: 1-3 stars → route to owner ("save the relationship"), 4-5 stars → route to public Google
5. Weekly summary: how many sent, replied, posted

**Math sell:** "You'll add ~10-15 5-star reviews per month. In 6 months you go from 80 reviews to 150+ → top of local search."

---

### 16. Booking AI / Scheduling Assistant 🟡 UPSELL
**What:** AI parses natural language ("can I come in next Tuesday around 2?") and books directly into your calendar. Works on website, SMS, and voice.
**Who:** Service businesses with complex availability.
**You charge:** $1,500 setup + $500/mo.
**Costs you:** Claude Haiku API (~$5/mo per client) + Cal.com.
**Time to deliver:** 1-2 days.
**How to implement:**
1. Cal.com event types: configure all bookable services + durations + technicians
2. Claude Haiku as parser: convert natural language to ISO date/time + service ID
3. Confirmation flow: AI confirms, books, sends calendar invite
4. Reschedule/cancel: handle via SMS reply
5. Double-booking prevention: Cal.com handles this natively

---

### 17. GMB / Local SEO Auto-Poster 🟡 UPSELL
**What:** Posts to Google Business Profile 3x/week with AI-generated content tied to their business — recent jobs, seasonal tips, before/after photos, offers.
**Who:** Local service businesses with weak GMB presence.
**You charge:** $500 setup + $400/mo.
**Costs you:** Claude Haiku for content (~$3/mo) + GMB API + your Sunday content batch (1 hr/wk per client).
**Time to deliver:** 1 day.
**How to implement:**
1. GMB API access (OAuth their Google account)
2. Content templates per vertical: 12 prompt templates
3. Claude Haiku generates 3 posts/week against templates
4. Image: pull from their existing photos OR generate via DALL·E ($0.04/img)
5. Schedule via GMB API
6. Monthly performance report: views, clicks, calls from posts

---

### 18. AI Email Nurture Sequences 🟡 UPSELL
**What:** Personalized email sequences for every new lead, broken down by where they came from and what they wanted.
**Who:** Practices with $500K+ revenue and a leaky form-fill funnel.
**You charge:** $1,000 setup + $400/mo.
**Costs you:** Resend ($20/mo) or Customer.io ($150/mo) + Claude for personalization.
**Time to deliver:** 2-3 days.
**How to implement:**
1. Map their lead sources (form, GMB, paid ads)
2. Build 5-email sequences per source with Claude personalization tokens
3. CRM integration: hook to their existing system OR use a basic Airtable
4. A/B test subject lines (Resend supports natively)
5. Monthly report: opens, clicks, conversions

---

### 19. AI Call Transcription + Insights 🟡 UPSELL
**What:** Records every inbound + outbound call, transcribes, and summarizes. Owner gets a weekly email: "Here are the 3 themes your customers brought up this week."
**Who:** Owners who want operational intelligence.
**You charge:** $750 setup + $300/mo.
**Costs you:** Twilio call recording ($0.0025/min) + Whisper API ($0.006/min) + Claude summary.
**Time to deliver:** 1 day.
**How to implement:**
1. Twilio recording on all calls
2. Webhook → Whisper transcription → S3 storage
3. Claude weekly job: pull last 7 days transcripts → output 3 themes + 5 specific quotes
4. Email to owner Monday morning
5. Searchable archive UI (built on existing GOATED stack)

---

### 20. Reactivation Campaign (one-time, big-cash) 🟠 CUSTOM
**What:** Mine their dormant customer list (lapsed 6+ months) and run a personalized AI outreach campaign — voice, SMS, email.
**Who:** Any business with 500+ dormant customers.
**You charge:** $3,000 setup + 15% of recovered revenue (no monthly).
**Costs you:** VAPI calls + Twilio SMS + Claude personalization. ~$0.50 per dormant contact.
**Time to deliver:** 5 days.
**How to implement:**
1. Pull their CRM/PMS export — filter to lapsed 6-18 months
2. Segment: by service, by spend tier, by cancellation reason
3. Build per-segment personalized scripts
4. Launch: 3-day rolling cadence (email day 1, SMS day 2, voicemail drop day 3)
5. Hot replies → book on owner's calendar
6. Report at day 14: revenue recovered

**Math sell:** "If you have 800 dormant customers and 5% reactivate at $300 LTV, that's $12K. We take 15%. You net $10K from a list you weren't using."

---

### 21. Predictive Maintenance AI (HVAC/Plumbing specific) 🟠 CUSTOM
**What:** AI calls customers 6-12 months after install/repair to schedule preventive maintenance. Generates recurring revenue from one-time customers.
**Who:** HVAC, plumbing, water heater installers, garage door, pool service.
**You charge:** $3,500 setup + $750/mo + 10% rev share on booked maintenance.
**Costs you:** VAPI + your time scripting per service-line.
**Time to deliver:** 3-4 days.
**How to implement:**
1. Pull historical install/repair data with dates + customer info
2. Build trigger: "6 months from install date" event
3. VAPI agent: "Hi, this is [Name] from [Shop] — your AC was installed 6 months ago, want to schedule the seasonal tune-up?"
4. Booking + payment via Stripe
5. Monthly report: how many maintenance jobs created vs baseline

---

### 22. Insurance Verification Bot (dental/med spa) 🟠 CUSTOM
**What:** AI calls insurance companies to verify benefits before appointments. Saves front desk 10-15 hr/week.
**Who:** Any healthcare practice with insurance billing.
**You charge:** $4,000 setup + $1,000/mo.
**Costs you:** VAPI premium + lots of testing. Insurance phone trees are gnarly.
**Time to deliver:** 7-10 days (this one is harder).
**How to implement:**
1. Map top 10 insurers' phone trees per practice
2. Build VAPI agent that navigates each tree
3. Outputs: deductible, copay, max benefit, approved procedures
4. Posts to PMS or internal Sheet for office manager
5. Daily batch: pulls tomorrow's appointments, runs verification overnight

---

### 23. Photo-AI Estimator (Roofing/Solar) 🟠 CUSTOM
**What:** Homeowner uploads photo of roof → AI gives a rough estimate → books inspection.
**Who:** Roofing, solar, exterior painting, fence builders.
**You charge:** $5,000 setup + $1,200/mo.
**Costs you:** Claude Vision API + your dev time.
**Time to deliver:** 7-10 days.
**How to implement:**
1. Embed photo upload widget on their website
2. Claude Vision: estimate sq ft, condition, material
3. Pricing model: their per-sq-ft rates
4. Output: estimated range + "book free inspection" CTA
5. Lead routes to owner's phone with photos attached

---

### 24. Owner Copilot (Slack/SMS bot for the owner) 🟠 CUSTOM
**What:** Slack or SMS bot that the owner can ask anything about their business. "How many jobs did we do this week?" "Which tech is best?" "What's our top complaint?"
**Who:** Owners who text/Slack constantly and want a CFO-in-their-pocket.
**You charge:** $4,000 setup + $1,000/mo.
**Costs you:** Claude Sonnet (~$30-80/mo per client) + integrations to their data sources.
**Time to deliver:** 5-7 days.
**How to implement:**
1. Connect to their data sources: PMS, QuickBooks, Stripe, GMB, calendar
2. Build RAG layer: vectorize their data weekly
3. Claude with tool use: query the right source per question
4. Slack app OR SMS via Twilio
5. Daily 8 AM digest: top 3 metrics

---

### 25. Voice Cloning of Owner 🟡 UPSELL
**What:** Clone the owner's voice and use it for personalized voicemails to prospects.
**Who:** Solo owner-operators with a memorable voice and brand.
**You charge:** $750 setup + $200/mo.
**Costs you:** ElevenLabs ($22/mo for voice cloning) + your scripting.
**Time to deliver:** 1 day.
**How to implement:**
1. Owner records 5 min of audio (ElevenLabs needs a sample)
2. Train clone (auto)
3. Generate voicemails per prospect with name + company + specific hook
4. Twilio voicemail drop (no ringing)
5. Track: response rate, callback rate

---

### 26. AI-Generated Social/Video Ads 🟠 CUSTOM
**What:** Monthly batch of 4 AI-generated short-form video ads for the business. YouTube Shorts, TikTok, Instagram Reels, Facebook.
**Who:** Marketing-aware owners, $1M+ revenue.
**You charge:** $2,500 setup + $1,500/mo (4 ads).
**Costs you:** Sora / Runway / Pika ($60-150/mo) + Claude scripts + your editing.
**Time to deliver:** 5 days for first batch.
**How to implement:**
1. Brand audit: tone, brand colors, CTA preferences
2. Claude generates 4 scripts/month
3. AI video gen: generate 4 ads at 15-30 sec
4. Owner approves
5. Publish to YouTube Shorts + push assets to client for their other channels

---

### 27. Reputation Management Agent (auto-respond to reviews) 🟡 UPSELL
**What:** AI auto-responds to every Google/Yelp review. 5-star = thank you. 1-3 star = empathetic, route to owner.
**Who:** Any business getting 5+ reviews/week.
**You charge:** $500 setup + $300/mo.
**Costs you:** GMB API + Claude.
**Time to deliver:** 1 day.
**How to implement:**
1. Webhook: GMB new review event
2. Claude generates response based on review text + sentiment
3. 4-5 star: post immediately
4. 1-3 star: hold for owner approval (60 min) before posting

---

### 28. Competitor Monitoring Agent 🟡 UPSELL
**What:** Weekly report: what your competitors are charging, what new offers they're running, what reviews they're getting.
**Who:** Owners obsessed with competitive position.
**You charge:** $500 setup + $400/mo.
**Costs you:** Web scraping (your time) + Claude summary.
**Time to deliver:** 2-3 days for first competitor list.
**How to implement:**
1. Identify 5 local competitors per client
2. Scrape their website + GMB + Yelp weekly
3. Diff against last week's snapshot
4. Claude summary: "Competitor X added a new $99 tune-up offer. Competitor Y got 12 new reviews."
5. Email Friday morning

---

### 29. Custom Mobile App 🟠 CUSTOM (largest deals)
**What:** Branded customer-facing mobile app: book service, track visit, pay invoice, see history.
**Who:** Multi-location operators, franchise candidates, $5M+ revenue.
**You charge:** $15,000-25,000 setup + $2,500/mo.
**Costs you:** React Native dev (your time) + Apple/Google dev accounts ($99 + $25) + push notification service.
**Time to deliver:** 6-8 weeks.
**Deposit threshold:** $15K minimum.
**How to implement:**
1. Design sprint: wireframes + brand
2. React Native app (you already have RN-friendly stack)
3. Backend: extend existing GOATED API
4. Auth: their existing customer DB OR build new
5. Submit to App Store + Google Play
6. Push notifications for appointments, promotions

---

### 30. Custom POS Integration 🟠 CUSTOM
**What:** Hook the AI stack into their POS (Square, Clover, ServiceTitan) for unified data + automation.
**Who:** Any business with a POS not yet integrated with their other tools.
**You charge:** $5,000-15,000 setup + $1,000/mo (depends on POS).
**Costs you:** Their POS API access + your dev time.
**Time to deliver:** 2-4 weeks per POS.
**How to implement:**
1. Per-POS adapter (write once per platform, reuse)
2. Pull: transactions, customer list, products
3. Push: bookings, customer updates
4. Claude reasoning layer: detect upsell opportunities, churn signals

---

### 31. Custom AI Agent Trained on Their Data (RAG) 🟠 CUSTOM
**What:** A private AI agent that knows their entire knowledge base: SOPs, training docs, customer history, FAQs.
**Who:** Practices/shops with mature operations and 10+ employees.
**You charge:** $7,500 setup + $1,500/mo.
**Costs you:** Vector DB (Pinecone $20/mo) + Claude + your scripting.
**Time to deliver:** 1-2 weeks.
**How to implement:**
1. Audit all their docs: SOPs, training, FAQs, customer-facing scripts
2. Vectorize via OpenAI embeddings (cheap) or Voyage
3. Slack/web/SMS interface
4. Use cases: train new hires, answer customer questions, look up old SOPs

---

### 32. Multi-Location Brain (franchise-tier) 🟠 CUSTOM
**What:** A unified AI that runs across all of a franchise's or multi-location operator's locations. Cross-location reporting, pricing optimization, demand forecasting.
**Who:** Operators with 3+ locations.
**You charge:** $25,000-50,000 setup + $5,000/mo.
**Costs you:** Substantial data plumbing + Claude orchestration.
**Time to deliver:** 4-8 weeks.
**Deposit threshold:** $25K+.
**How to implement:**
1. Centralize data from all locations (POS, calendar, GMB)
2. Build dashboard with location-level + roll-up views
3. AI reports: "Location A is underperforming on X — here's why"
4. Routing: new leads route to best-fit location based on capacity + proximity
5. Pricing optimization: suggest dynamic pricing per location

---

### 33. Onboarding Done-For-You 🟡 UPSELL
**What:** White-glove onboarding for any new tech they're adopting (a new PMS, a new payments platform, etc.).
**Who:** Owners who hate setup.
**You charge:** $2,500 flat per project.
**Costs you:** Your time, ~10-15 hours.
**Time to deliver:** 1-2 weeks.
**How to implement:**
1. Discovery: what are they switching to/from?
2. Migration plan: data export, mapping, training
3. Train staff (1-hr Loom + 1-hr live)
4. Stand by for 30 days post-launch

---

### 34. Owner-Coaching Subscription 🟡 UPSELL
**What:** Monthly 1:1 strategy call with owner. Review their dashboard, plan next 30 days.
**Who:** Owners who want a thinking partner.
**You charge:** $750/mo.
**Costs you:** 1 hr of your time per client per month.
**Time to deliver:** Immediate.
**How to implement:**
1. Cal.com booking link
2. Pre-call: pull their last 30 days from your dashboard
3. 60-min Zoom: review wins, identify next move, accountability
4. Follow-up email with 3 action items

**Margin sell to yourself:** at $750/hr equivalent, this is the highest-margin line item in the catalog. 5 of these = $3,750/mo for 5 hrs/week.

---

### 35. AI Software Build (custom-coded for them) 🟠 CUSTOM
**What:** Custom-built software (web app, internal tool) using GOATED's full tech stack: React, Three.js, Claude, Supabase, etc.
**Who:** Operators who want their own branded internal tooling — typically multi-location, $5M+, or franchise.
**You charge:** $25,000-100,000 setup + $5,000-15,000/mo SaaS license.
**Costs you:** Your dev time + infrastructure.
**Time to deliver:** 6-16 weeks.
**Deposit threshold:** $25K+.
**How to implement:**
1. Use GOATED app as starter kit (you've already built 80% of the patterns)
2. Customize for their workflow
3. Deploy on their domain or your white-label
4. Maintain + iterate on retainer

**This is your highest-leverage upsell.** Reuse 80% of GOATED's existing code per project.

---

## Decision tree: which upsell to pitch on Day 30 check-in

```
Did they complain about reviews? → #15 Review Generation
Did they complain about no-shows? → already in Tier 1
Did they say "I have a list of old customers I should call"? → #20 Reactivation
Did they say "my front desk is overwhelmed"? → #14 AI Receptionist OR #22 Insurance Verification
Did they say "I want to grow but don't know what's working"? → #34 Owner-Coaching
Did they say "I have multiple locations"? → #32 Multi-Location Brain
Did they say "I want my own app"? → #29 Custom App
Did they ask about marketing/ads? → #26 AI-Generated Ads OR #17 GMB Auto-Poster
Did they say "I have weird software no one else uses"? → #30 Custom POS Integration
Did they say "I just need help running my business"? → #24 Owner Copilot + #34 Coaching combo
```

---

## Revenue stacking math (the compounding play)

Year-1 single-client realistic max:

| Module | Setup | Monthly | Setup × | Monthly × |
|---|---|---|---|---|
| Tier 1 base | $2,000 | $750 | 1 | 12 |
| #15 Review gen | $500 | $300 | 1 | 11 |
| #17 GMB poster | $500 | $400 | 1 | 10 |
| #20 Reactivation | $3,000 | $0 (one-time) | 1 | 0 |
| #34 Coaching | $0 | $750 | 0 | 9 |
| **Total** | **$6,000** | **$2,200/mo** | | **$24,300/yr recurring + $3,000 one-time** |

**Per-client annual value: ~$33,000** if you upsell well.

10 clients at this depth = **$330K ARR**. With ~$50K of cost. **$280K net margin.**

---

*Catalog version 2 · 2026-04-25 · 35 modules. Add new ones as you ship them.*
