# GOATED — Monday Launch Master Checklist

**Owner:** Tarek
**Updated:** 2026-04-25
**Use:** The single integrated action list for everything that must be wired, signed, scripted, and ready by Monday April 27, 6 AM CST.

---

## Read this doc Saturday morning, first thing.

Before doing ANYTHING else this weekend. It tells you what's done, what's missing, and the order to fix it. If you only have 4 hours this weekend, the **MUST-HAVE** items (Tier 1) are the only ones that matter.

---

## Status legend

| Symbol | Meaning |
|---|---|
| ✅ | Done — verified working |
| 🟡 | In progress — finish this weekend |
| 🔴 | Blocker — without this you cannot launch |
| ⚪ | Optional / nice-to-have / Phase 1 |

---

## Tier 1 — MUST-HAVE before Monday 6 AM

These are the non-negotiables. Without these, Monday is dead.

### 🔴 1.1 Stripe Payment Links

**Why:** moment of close, you paste a link in an SMS — money lands in 2 days.

```
[ ] Stripe account active, business name "GOATED SOLUTIONS LLC"
[ ] LLC tax ID + EIN entered
[ ] Bank account linked (Mercury or Brex)
[ ] Identity verification complete (KYC)
[ ] Test charge to your own card — confirm $1 charge clears
```

**Create these 5 Payment Links** (Stripe → Products → Payment Links):

| Link Label | Type | Amount | Description |
|---|---|---|---|
| `tier1-setup` | One-time | $2,000 | Local Engine setup |
| `tier1-monthly` | Recurring | $750/mo | Local Engine monthly |
| `tier1-bundle` | One-time | $2,750 | First-month bundle (setup + 1 mo) |
| `tier2-setup` | One-time | $10,000-$20,000 (custom) | Growth Engine setup |
| `tier2-monthly` | Recurring | $2,500-$5,000 (custom) | Growth Engine monthly |

**Save URLs** in iPhone Notes app, named clearly. You'll paste these on calls.

---

### 🔴 1.2 Phone — Twilio numbers

**Why:** caller-ID = "GOATED SOLUTIONS" not your personal name. Three numbers for rotation = avoids per-day call limits.

```
[ ] Twilio account active, business-tied (LLC EIN entered)
[ ] 3 numbers purchased (Texas area codes: 469/214/972 OR 512/737)
[ ] A2P 10DLC brand registered ($4 one-time)
[ ] A2P 10DLC campaign registered ($2/mo per campaign)
[ ] Caller ID verified to display "GOATED SOLUTIONS" (CNAM update — takes 24-48h)
[ ] Test outbound call from each number → your personal cell (verify number shows + audio)
[ ] Test inbound SMS to each number → confirms delivery to webhook or email
```

**Numbers to keep:**
- 1 primary outbound (for cold dials)
- 1 secondary (rotation)
- 1 SMS-only (for follow-ups)

---

### 🔴 1.3 Voice AI — VAPI agent (at least one live)

**Why:** within 60 seconds of "yes" on a call, you can offer to deploy a working voice agent. Without it, your pitch is theory.

```
[ ] VAPI account active
[ ] At least 1 voice agent built per vertical you'll dial Monday
   (HVAC default is fine for week 1)
[ ] System prompt tuned to: hours, services, pricing range, escalation rules
[ ] Voice selected (premium ElevenLabs or default — anything natural)
[ ] Webhook → Cal.com OR a placeholder webhook to a logged endpoint
[ ] Test call: dial the VAPI number, simulate a customer, confirm
   greeting + qualification + booking flow works
[ ] Recording enabled for all calls (you'll review)
```

If you can build only ONE voice agent this weekend, build the **HVAC default**. It generalizes well to plumbing and roofing on the fly.

---

### 🔴 1.4 Booking — Cal.com

**Why:** when a prospect says "I want a sales call," you need to send a calendar link in 5 seconds.

```
[ ] Cal.com account, custom URL: cal.com/goated-solutions or similar
[ ] Event types created:
    - "GOATED Discovery Call" — 20 min, weekday 8 AM-5 PM CST
    - "GOATED Demo / Audit" — 30 min, same hours
    - "GOATED Onboarding Kickoff" — 60 min
[ ] Calendar synced (Google Cal or iCal)
[ ] Custom intake form: name, company, vertical, current monthly call volume
[ ] Confirmation email auto-sends with Zoom/Meet link
[ ] Reminder emails 24h + 1h before
[ ] Buffer time between meetings: 10 min
```

**Save your Cal.com URL** in iPhone Notes — paste during sales calls.

---

### 🔴 1.5 Email — `@goated.solutions` aliases

**Why:** you can NEVER send a sales email from `secrdev@gmail.com`. Reads as scam-tier.

```
[ ] Domain ownership confirmed (DNS records visible)
[ ] Email host configured: Cloudflare Email Routing (free) OR
    Google Workspace ($6/mo) OR Fastmail ($5/mo)
[ ] Aliases created and routed to your real inbox:
    - tarek@goated.solutions
    - hello@goated.solutions
    - sales@goated.solutions
    - support@goated.solutions
[ ] SPF, DKIM, DMARC records configured (not just routing — sending too)
[ ] Test: send from tarek@goated.solutions to your Gmail. Confirm:
    - From address shows "Tarek <tarek@goated.solutions>"
    - Goes to Inbox not Spam
    - Has SPF + DKIM passing in headers
```

**Pro tip:** test sending to a Gmail, Outlook, AND Yahoo address. Each spam-filters differently. Pass all three.

---

### 🔴 1.6 Vercel deployment — production live

**Why:** when prospects Google "GOATED Solutions," they hit your site. It must look pro.

```
[ ] Latest commit (v7.5.6) deployed and live
[ ] Domain pointed correctly:
    - goated-app-nine.vercel.app shows app
    - goated.solutions points to Vercel (when CNAME configured)
[ ] HTTPS valid certificate (auto via Vercel)
[ ] /audit page works end-to-end (real audit runs, real result)
[ ] Cover page (`VITE_LAUNCH_READY=false`) showing while you're soft-launching
   OR full app showing if going live
[ ] No 500 errors on any major route
[ ] Mobile responsive — test on iPhone
[ ] Open Graph image renders correctly when URL shared
```

**Decision: cover page or full app on Monday?**

| If cover ON | If full app ON |
|---|---|
| Cleaner, more "private/exclusive" feel | Prospects can browse, see scale |
| Less risk of bugs | More risk of bugs, but also more conversion |
| **Recommended for Week 1** | Phase 1+ |

I'd keep `VITE_LAUNCH_READY=false` for week 1. Cover page is lower risk + creates intrigue.

---

### 🔴 1.7 Prospect list — minimum 100 ready

**Why:** you can't dial what you don't have. List quality > list quantity.

```
[ ] At least 100 prospects in CRM Sheet:
    - Business name
    - Owner first name
    - Phone (verified, not bouncing)
    - Email (if available)
    - City + state
    - Vertical (HVAC/dental/plumbing/etc.)
    - Source (Apify/Manual/Referral)
[ ] At least top-30 have audit pre-runs done
[ ] At least top-10 have a personalized note (1 sentence about their site/business)
[ ] List sorted by "best to dial first" — biggest revenue, most ammunition
[ ] List shared in iPhone for offline access if internet drops
```

**Where to get the list this weekend:**
- Apify Google Maps Scraper — $49 one-time, scrape 500 SMBs in 1 metro by vertical
- PhantomBuster Google Maps Search Export — free trial, 250 prospects
- Manual: pick 5 zip codes × 5 verticals × 10 businesses each = 250 manual

---

### 🔴 1.8 CRM — Google Sheet ready

**Why:** every dial logged. Patterns emerge from data.

```
[ ] Google Sheet created, named "GOATED CRM Week 1"
[ ] 20 columns from CHEAT_SHEETS.md §8 (Date, Time, Business, Owner,
    Phone, Email, City, Vertical, Source, Audit, Outcome, Disposition,
    Booking Date, Booking Time, Follow-up, Notes, Closed, Cash, Tier, LTV)
[ ] First 100 prospects pre-loaded
[ ] Quick filter / sort for: today's prospects, hot list, follow-ups
[ ] Shared to your secondary device (iPhone) for offline access
```

---

### 🔴 1.9 Mental + physical readiness

**Why:** the cadence depends on you being on. 6 AM Monday is real.

```
[ ] Sunday: 8 hours sleep
[ ] Saturday: gym OR walk OR any movement
[ ] Sunday night: prep coffee, breakfast, clothes for Monday
[ ] Alarm set: 6 AM CST Monday
[ ] Backup alarm: 6:05 AM (different device)
[ ] Phone Do Not Disturb scheduled 7 AM-12 PM (Monday focus block)
[ ] Workspace cleaned: water, headset, notebook, pen
```

---

## Tier 2 — STRONGLY RECOMMENDED before Monday

You'll launch without these but they multiply effectiveness.

### 🟡 2.1 Loom audits — 5 pre-recorded

**Why:** within 90 sec of leaving a voicemail, send a personalized audit Loom via SMS. Conversion 3-5x.

```
[ ] Loom account (free works for first 25 videos)
[ ] Pre-record 5 audit Looms for your top hot list:
    - Open the prospect's website
    - Scroll the homepage on screen
    - Speak: "Hey [first name], Tarek with GOATED. Just looked at your site.
      Three things I'd fix this week. First..." (60-90 sec each)
    - Save with descriptive title
[ ] URLs saved in iPhone Notes alongside the prospect's name
```

**Sunday afternoon project: 90 min.** 5 Looms × 15 min each (record + watch + redo).

---

### 🟡 2.2 Privacy policy + Terms of Service

**Why:** Stripe REQUIRES these on your domain. Without them, your account can be reviewed/frozen.

```
[ ] Generate via Termly.io (free) or PrivacyPolicies.com
[ ] Pages created:
    - /privacy → linked from footer
    - /terms → linked from footer
    - /refund-policy → describes 30-day money-back
[ ] Stripe → Settings → Public details → links to these pages
[ ] Footer of website has these links visible
```

**5 min with a generator.** Don't skip — Stripe will eventually flag.

---

### 🟡 2.3 GOATED Solutions LinkedIn company page

**Why:** when prospects Google you (and they will, even if they don't tell you), having a real company page is a trust signal.

```
[ ] Create page: linkedin.com/company/goated-solutions
[ ] Logo + cover image
[ ] Description (200 words max)
[ ] Industry: "Information Technology & Services" or "Marketing & Advertising"
[ ] Headquarters: Texas, USA
[ ] Founded: 2026
[ ] Specialties: AI for SMBs, voice automation, local services
[ ] 3 seed posts (announcement, vision, first case study placeholder)
```

**Time:** 30 min Saturday.

---

### 🟡 2.4 Google Business Profile

**Why:** SMBs trust Google more than LinkedIn. If a prospect Googles "GOATED Solutions Texas," you want this verified result.

```
[ ] Claim listing at business.google.com
[ ] Business name: GOATED SOLUTIONS LLC
[ ] Category: "Marketing Agency" or "Software Company"
[ ] Service area: United States (covers all metros)
[ ] Hours: Mon-Fri 8 AM-6 PM CST
[ ] Phone: your Twilio business number
[ ] Website: your domain
[ ] Photos: logo + workspace shot
[ ] Description: 750 chars, agency-first
[ ] Verification: postcard or phone (takes 5-7 days, start NOW)
```

---

### 🟡 2.5 OPSEC sprint (90 min, see OPSEC_PLAYBOOK.md)

```
[ ] Personal LinkedIn hibernated (verify at incognito URL)
[ ] Personal IG/FB/TikTok locked private
[ ] DeleteMe subscription started ($129/yr)
[ ] LLC registered agent service (Northwest Registered, $125/yr)
[ ] Virtual mailbox (Stable.app, ~$30/mo)
[ ] Domain WHOIS privacy enabled (free on most registrars)
[ ] Twilio caller ID showing "GOATED SOLUTIONS"
[ ] Twitter @goatedsolutions brand account created
```

---

### 🟡 2.6 Pre-built outreach assets

**Why:** Tuesday morning at 9 AM you'll need to send 5 follow-ups. If templates exist, it's 30 sec each. If not, 10 min each.

```
[ ] Email templates saved (see TEMPLATES.md):
    - Follow-up after no-answer
    - Audit delivery (sent post-call)
    - Discovery call confirmation
    - Post-close onboarding kickoff
    - 30-day check-in
[ ] SMS templates saved:
    - Voicemail double-tap
    - Day-2 follow-up
    - Calendar reminder
    - "Send me Stripe link" handoff
[ ] Voicemail script memorized (CHEAT_SHEETS.md §4)
[ ] Loom script template (90-sec format)
```

---

## Tier 3 — NICE-TO-HAVE (Phase 1+, not Monday-critical)

Defer these. They don't move the Monday needle.

```
⚪ HubSpot or Pipedrive CRM (Sheets is fine for Week 1)
⚪ Slack workspace (no team yet)
⚪ Mercury treasury account (have business checking is enough)
⚪ Custom email signature image
⚪ Branded Cal.com page styling
⚪ Crunchbase listing (Phase 1)
⚪ BBB profile (some industries don't care)
⚪ Better website design (current is good enough)
⚪ AI agent prompts for verticals beyond HVAC (build as you close)
⚪ Video case study (need first close first)
⚪ Press release (Phase 2)
⚪ Trademark filing (Phase 2)
```

---

## Saturday timeline (8 hours)

```
8:00 AM   Wake, breakfast, walk
9:00 AM   Read this checklist + EXECUTION_PLAN_2026
9:30 AM   Tier 1 work begins:
          - Stripe Payment Links (30 min)
          - Twilio numbers + A2P (60 min, includes wait time)
12:00 PM  Lunch
1:00 PM   - VAPI agent build (90 min)
          - Cal.com setup (30 min)
3:00 PM   - Email aliases + DNS (30 min)
          - Vercel deployment verify (15 min)
3:45 PM   Break / walk
4:00 PM   - List build via Apify (60 min)
          - CRM sheet pre-load (30 min)
5:30 PM   Dinner
6:30 PM   Tier 2 work:
          - OPSEC sprint (90 min)
8:00 PM   Decompress / read
9:30 PM   Sleep
```

---

## Sunday timeline (6 hours)

```
8:00 AM   Wake, breakfast, walk
9:00 AM   - Pre-run audits for top 30 prospects (90 min)
10:30 AM  - Record 5 Loom audits (90 min)
12:00 PM  Lunch
1:00 PM   - Practice opening x10 in front of mirror
          - Practice 5 most common objection responses
          - Read closing creed twice
2:00 PM   - Final Tier 1 verification: each item, test end-to-end
3:00 PM   - Privacy/Terms pages (30 min)
          - GOATED LinkedIn page (30 min)
4:00 PM   Free time — DO SOMETHING NON-WORK. Walk, gym, friend, family.
6:00 PM   Dinner
7:00 PM   Re-read CLOSING_PLAYBOOK + CHEAT_SHEETS
8:00 PM   Last verification:
          - Stripe link works
          - Twilio call works
          - Cal.com link works
          - VAPI call works
          - Email send works
          - List has 100+ prospects
          - Top-30 has audits + Looms
9:00 PM   Phone on Do Not Disturb
9:30 PM   Sleep
```

---

## Sunday night final 5-minute check (do this in bed)

Last thing before phone goes on the nightstand:

```
[ ] Alarm 6:00 AM CST verified
[ ] Backup alarm 6:05 AM verified
[ ] Stripe Payment Link URLs visible in Notes
[ ] Cal.com URL visible in Notes
[ ] Top-30 prospect list accessible offline
[ ] Two openings memorized — recite each once silently
[ ] Closer's creed memorized — recite once silently
[ ] Body relaxed — 4-7-8 breath x3
[ ] Sleep
```

---

## Monday 6 AM checklist (printed + pinned)

```
6:00  Wake, water, walk 10 min outside
6:30  Breakfast: eggs + protein, coffee
7:00  Workspace setup, water bottle, headset
7:15  Re-read closer's creed out loud once
7:30  Pull up Top-30 list on screen
7:45  Practice opening 3x in mirror
7:55  First-dial mental prep: deep breath, smile, dial
8:00  DIAL #1
```

---

## Monday contingency plans

When something breaks (it will), here's the playbook:

### "VAPI agent isn't responding to test call"
→ Drop VAPI from pitch for the day. Pivot to "I'll deploy on Wednesday." Continue dialing. Fix VAPI Tuesday.

### "Twilio number not connecting outbound"
→ Use Google Voice as backup. Display name will show your real name temporarily. Don't volunteer last name. Dial.

### "Stripe link gives error on test charge"
→ Skip closing today. Goal becomes: book 5 sales calls, close them Tue/Wed when Stripe is verified.

### "Domain showing 'site not secure' or DNS issue"
→ Switch business cards / sales pitch to use goated-app-nine.vercel.app directly. Don't reference goated.solutions until DNS resolves.

### "Email aliases bouncing"
→ Use Gmail directly with display name "Tarek Ali | GOATED Solutions" for the day. Set up email tomorrow.

### "Prospect Googles you and finds something embarrassing"
→ Acknowledge briefly: "Yeah, I went through a chaotic stretch online when I was younger. I built this agency to put my time and energy into real, measurable work for businesses like yours. Want to focus on the audit?"

### "Audit page is slow / down"
→ Use a screenshare instead. Manually walk through their website's leaks. Same value.

### "Phone battery dies mid-call"
→ Charge bank in pocket. ALWAYS carry charged backup phone (your personal phone) just for emergency call-back.

### "Caller hangs up on you 5 times in a row"
→ Take the 8-min recovery walk (CHEAT_SHEETS.md §11). Cold water on face. Re-read creed. Lowest-stakes prospect first when back.

### "I just feel like quitting"
→ Read your wins log from yesterday. Read closer's creed. Make ONE more dial. Just one. Then decide.

---

## What to do if 50%+ of Tier 1 isn't ready by Sunday night

Don't panic. **Reorder by criticality:**

**Absolute minimum to launch Monday:**
1. ✅ Stripe Payment Links (at least Tier 1 setup + monthly + bundle)
2. ✅ Phone (Twilio OR Google Voice as backup)
3. ✅ Cal.com URL
4. ✅ Email (Gmail with proper signature is OK for Day 1)
5. ✅ List of 50+ prospects (smaller list, still launch)

**Defer to Week 2 if not ready:**
- VAPI (can pitch and deploy Wednesday)
- Custom domain on goated.solutions (use Vercel URL)
- LinkedIn company page (helpful but not blocking)
- Privacy/Terms (Stripe gives you a grace period)

**Do not delay Monday for:**
- Custom email signature
- Branded Cal.com
- Full LinkedIn presence
- Crunchbase / BBB

**Better to launch ugly than not launch.** A scrappy Monday with one close = 1000% better than a polished Tuesday with zero.

---

## What's NOT on this checklist (intentionally)

- ❌ Hiring (Phase 1)
- ❌ Buying ads (Phase 2)
- ❌ Public PR / Twitter blasts (Phase 1)
- ❌ Optimizing your office aesthetic (waste)
- ❌ Buying a new laptop (current works)
- ❌ Custom CRM build (Sheets works)
- ❌ Onboarding flow polish (you'll iterate after first close)
- ❌ Retainer billing automation (Stripe Subscriptions handles it)
- ❌ Multiple voice agent variants (one HVAC default is fine)

These are distractions. The grind starts Monday. Distractions wait.

---

## Self-assessment scorecard (run Sunday 8 PM)

Score each Tier 1 item: ✅ done, 🟡 in progress, 🔴 blocker.

```
[__] 1.1 Stripe Payment Links
[__] 1.2 Twilio numbers
[__] 1.3 VAPI voice agent
[__] 1.4 Cal.com booking
[__] 1.5 Email aliases
[__] 1.6 Vercel deployment
[__] 1.7 Prospect list (100+)
[__] 1.8 CRM Sheet
[__] 1.9 Mental + physical
```

**Score:**
- 9/9 ✅ → SHIP IT. Sleep well.
- 7-8 ✅ → SHIP IT. Fix gaps Monday afternoon.
- 5-6 ✅ → SHIP IT WITH MINIMUM (see above). Fix the rest Tuesday.
- <5 ✅ → Push launch to Tuesday. But ONLY if absolutely necessary.

---

## After Monday — what to add

Doc updates after Week 1:

```
[ ] Update CRM with actual call data → patterns
[ ] Friday retro completed (per WEEK_1_TACTICAL.md)
[ ] Wins log read aloud Friday
[ ] Update CLOSING_PLAYBOOK with any new objections heard
[ ] Update OUTREACH_OPENINGS_RANKED with which opener actually worked
[ ] Update UPSELL_CATALOG with any modules clients asked about
[ ] First case study drafted (after first close)
[ ] OPSEC review: any new Google results showing up?
```

---

## Last word

The grind is the system. The checklist is how you survive Day 1. After Day 1, the grind takes over.

**You don't have to be ready. You have to be on the phone.**

— v1, 2026-04-25
