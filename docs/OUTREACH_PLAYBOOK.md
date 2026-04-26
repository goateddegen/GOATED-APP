# GOATED — Outreach Playbook (v7.5, brick-and-mortar agency edition)

**Last updated:** 2026-04-24
**Owner:** Tarek Ali (solo)
**Goal:** Book 4-6 sales calls/week with brick-and-mortar SMB owners.

---

## TL;DR

> **Phone first. SMS second. Email third. LinkedIn skipped.**
>
> Use **Google Voice** with 3 area-code-matched numbers for first 50 dials.
> Lead every conversation with the **lost revenue number** from a pre-run GOATED audit.
> Pitch is one sentence (Tier 1 / Local Engine):
> *"You're missing X calls a week worth $Y/mo. I plug the leak. **$2K setup, $750/mo**, 30-day refund."*
>
> Tier 2 (Growth Engine, online biz / agencies): **$10–20K setup + $2.5–5K/mo** + optional 10–20% rev share. Don't pitch on first call — book a discovery call instead.
>
> See **`docs/CLOSING_PLAYBOOK.md`** for the full dial script, objection map, and post-close onboarding sprint.

---

## 1. The 4-channel mix (ranked by ROI for SMB)

| Channel    | Effort | Conversion to booked | When to use                             |
| ---------- | ------ | -------------------- | --------------------------------------- |
| **Phone**  | High   | 5-15% per pickup     | Primary. First touch + high-stakes f/u. |
| **SMS**    | Medium | 8-20% reply rate     | Same-day after voicemail / no-answer    |
| **Email**  | Low    | 1-3% reply rate      | Audit-PDF leave-behind only             |
| **LinkedIn** | Wasted | <1% for SMB         | **SKIP for brick-and-mortar.** Use only for inbound SaaS founders. |

### Why LinkedIn is skipped
Plumbers don't live on LinkedIn. Med spa owners barely log in. Dental practice owners have a profile from 2014. Owner-operators ignore InMails. **Plus**: Tarek's LinkedIn presence is reputation-burned. Don't prospect under personal face. If we ever do LinkedIn, it's from a GOATED brand profile, **not** Tarek's.

---

## 2. Virtual numbers — the spam-mitigation play

### Free / cheap option (start here)

| Service           | Cost          | Numbers/account | Pros                                  | Cons                                   |
| ----------------- | ------------- | --------------- | ------------------------------------- | -------------------------------------- |
| **Google Voice**  | Free          | 1 per Gmail     | Free, US-only, works with Gmail SMS   | One number per Gmail; carrier blocks possible at scale |
| **TextNow**       | Free (ads)    | 1 per acct      | Free, real US numbers                 | Ads, lower deliverability              |
| **Hushed**        | $5/mo         | 1+ per acct     | Multiple area codes                   | Limited features                       |
| **Burner**        | $5/mo trial   | 1+ per acct     | Disposable                            | Higher per-number cost                 |

### Production-grade (after first revenue)

| Service           | Cost          | Pros                                       | Cons                                |
| ----------------- | ------------- | ------------------------------------------ | ----------------------------------- |
| **OpenPhone**     | $19/mo        | Multi-number, shared inbox, iMessage-like  | Per-user pricing scales fast        |
| **Dialpad**       | $23/mo        | Enterprise-grade, AI transcription         | Overkill for solo                   |
| **Twilio**        | ~$1/mo/number + usage | Programmable, can wire into GOATED stack | Build your own UI                |
| **Sinch**         | Pay-as-go     | International, very low cost               | API-only, no native dialer          |

### Recommendation (week 1)
1. Create **3 Gmail accounts** (e.g., `tarek.outreach@gmail.com`, `goated.atlanta@gmail.com`, `goated.dallas@gmail.com`).
2. Set up **3 Google Voice numbers** in 3 target metros (e.g., 415 SF, 305 Miami, 404 Atlanta).
3. Forward all to Tarek's iPhone.
4. Use the matching area code when calling that metro's prospects (4× higher pickup rate).

### Recommendation (week 3+, after 1st close)
- Switch to **OpenPhone** ($19/mo) for: shared inbox, real iMessage continuity, easy team handoff later, native voicemail-to-text.
- Keep Google Voice numbers as throwaways for cold-call days.

---

## 3. Anti-blacklisting tactics

### Phone number reputation

- **Never call the same number 3+ times in 7 days without a voicemail or text in between.** Carriers (T-Mobile especially) auto-flag this as spam.
- **Stagger your dials.** 25-30/day from one number is fine. 80+/day from one number = guaranteed flagging.
- **Rotate numbers across metros.** Use the area-code-matched number for each call.
- **Register your numbers with the FCC's Robocall Mitigation Database** (free) to claim legitimate-business status.
- **STIR/SHAKEN compliance**: OpenPhone and Twilio handle this automatically. Google Voice does for you. Hushed/Burner = at risk.

### SMS — A2P 10DLC matters

If sending more than 10 SMS/day per number:
- **Twilio / OpenPhone**: register with The Campaign Registry (TCR) for A2P 10DLC ($4 brand fee + $2/mo per campaign) — required by US carriers since 2023
- **Google Voice**: limited to ~50 SMS/day per number, no A2P registration needed at small scale, but throttled
- **First touch SMS**: must include `Reply STOP to opt out` (TCPA + carrier requirement)

### Email deliverability

If outbound email becomes part of the mix later (week 3+):
- Use a **dedicated cold-outbound domain** like `getgoated.com` or `goated.io`, NOT the main `goated.solutions` (protect main domain reputation)
- Set up **SPF, DKIM, DMARC** records (Cloudflare DNS, free, 30 min)
- **Warm up inboxes for 2 weeks before bulk send** using Smartlead.ai ($39/mo for 10 inboxes warmed)
- Send **40 emails/day per inbox**, never more
- Use multiple inboxes per domain (e.g., `tarek@`, `team@`, `hello@`) and rotate

---

## 4. Pre-call ritual (3 minutes before every dial)

1. Open the prospect's URL → run `/audit` on the GOATED app
2. Note the headline number (e.g., "$8,400/mo leakage")
3. Note 1 specific leak (e.g., "no live chat, no booking, missed-call rate ~30%")
4. Open Google Maps → check their reviews → note 1 review-related insight
5. Take a deep breath. Smile. Dial.

---

## 5. The dial script (memorize, don't read)

### Opening (15 seconds)
> "Hey [First Name], this is Tarek from GOATED. I'm not pitching you — I literally just ran a free audit on [Their Website] and noticed something specific. Got 30 seconds?"

**If yes** → drop the number:
> "You're missing about [X] calls a week. Each one is roughly [$Y]. That's [$Z]/month. I built a system that auto-calls every missed lead in 60 seconds and books them. Want me to send you the audit and we hop on a 15-min walkthrough?"

**If no / objection** → reply STOP path:
> "Totally fair. If you want to see the audit anyway, what's a good email? It'll show you the exact number — no obligation."

### Common objections + scripts

| Objection                          | Response                                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| "We have a marketing person already" | "Cool — show them the audit anyway. If they're already covering this, no harm. If they're missing it, you just got a free second opinion."         |
| "How much?"                          | "Setup is $1,500. Monthly is $2,500. 30-day refund if I don't generate at least the setup back."     |
| "I need to think about it"          | "Of course. The audit's free — let me email it. Worst case you have a useful document. Email?"        |
| "We already tried [Hibu / a local agency]" | "Right, that's why this is different. Most agencies do generic ads. I'm running missed-call recovery, which targets people who already wanted to call you."  |
| "Send me an email"                  | "Will do. What's the email and your name spelled out? I'll send within 5 minutes — be looking for it." |
| "Is this AI?"                       | "It uses AI for the calls. It's me running the system. You'll be talking to me, not a bot. The bot just makes sure no lead falls through."   |

### Voicemail (always leave one — increases callback 3x)
> "Hey [First Name], Tarek from GOATED. Quick voicemail — I ran a free audit on [their site] and you're missing about [$X] a month. I'll text you the link. 30 seconds and you'll see exactly where. No pitch, just the number. [Your callback number]."

Then text within 60 seconds:
> "Hey [First Name], Tarek from earlier. Here's the audit: [shareable URL]. Take a look — happy to chat when you have a sec."

---

## 6. Daily / weekly rhythm

### Daily (Monday-Thursday, 8 hours total)

| Time           | Activity                                                  |
| -------------- | --------------------------------------------------------- |
| 8:00–9:00 am   | List prep: 25 prospects pulled, audits pre-run            |
| 9:00–9:30      | Coffee + script warmup (cold-call yourself out loud first)|
| 9:30–12:00     | **Dial block 1** (East Coast metros, 13 dials/hr × 2.5)   |
| 12:00–1:00     | Lunch + check inbox + reply to interested prospects       |
| 1:00–3:30      | **Dial block 2** (West Coast metros)                      |
| 3:30–5:00      | Follow-ups: SMS, email audit PDFs, book sales calls       |
| 5:00–6:00      | Sales call delivery (any booked for today)                |

**Daily target: 50 dials, 5-8 connects, 1-2 booked calls.**

### Weekly (Friday)
- 9:00–11:00: 5 booked sales calls (back-to-back, demo audit live)
- 11:00–1:00: Follow-up + Stripe Payment Links
- Afternoon off. Recovery day.

### Saturday: OFF
### Sunday: OFF (or 2 hours light prep)

---

## 7. Lists — where prospects come from

### Free / scraped (week 1)
1. **Google Maps**: Search "[vertical] in [metro]". Use Phantombuster free trial to scrape 100 results with phone + website.
2. **Yelp**: Free scrape via Apify or manual copy. 50 prospects/hr manually.
3. **BBB / industry association directories** (HVAC: ACCA, MCAA. Plumbing: PHCC. Roofing: NRCA, etc.)
4. **Apollo free tier**: 50 emails/day with phone numbers (some).

### Cheap (week 2-3, after first close)
5. **ListKit**: $99 trial → 1000 high-quality SMB prospects with verified phone + email
6. **D7 Lead Finder**: $50/mo, scrapes Google Maps at scale, gives reviews + phone + email

### Paid (week 4+, scaled)
7. **Apollo paid**: $99/mo, unlimited search, integrates with Google sheet
8. **ZoomInfo**: $14k/yr, only if hitting 7-figure ARR (skip for now)

---

## 8. Closing the call

When a prospect says "okay, I'm interested":

1. **Set up a Zoom or Google Meet immediately** — same call, screen-share, walk through the audit live
2. **Show their lost-revenue number on screen** — make them feel it
3. **Pitch the package** — $1,500 setup + $2,500/mo, 30-day refund
4. **Ask for the close** — "Want me to send the Stripe link now? You can pay with card, takes 30 seconds."
5. **Send Stripe Payment Link** while still on the call (have it pre-saved)
6. **Confirm payment** in real-time (Stripe pings)
7. **Schedule onboarding kickoff** for within 48 hours
8. **End call with**: "Welcome to GOATED. Talk Friday."

If they need to think:
- Send the audit + 1-page proposal via email same day
- Follow up tomorrow morning with a 1-line text: "Hey [Name], you have any questions on the proposal?"
- Don't chase more than 2 follow-ups. Move on.

---

## 9. Compliance notes (don't get sued)

- **TCPA**: cold calls to mobile numbers are technically legal for B2B, BUT honor every "do not call" request in writing
- **National DNC list**: B2B is exempt, but verify every personal-cell number
- **CAN-SPAM**: every email must have unsubscribe link + physical address
- **A2P 10DLC**: required for SMS over 10/day per number
- **Recording**: never record calls without consent. CA, FL, MA, MD, MT, NV, NH, PA, WA all require two-party consent.

---

## 10. KPIs to track in dashboard

| Metric                      | Target/wk | Failure threshold |
| --------------------------- | --------- | ----------------- |
| Dials placed                | 250       | < 150 = fix infra |
| Connects (live conversations) | 25-40   | < 15 = pitch broken |
| Booked sales calls          | 5-8       | < 3 = pitch or list broken |
| Closes                      | 1-2       | < 0.5/wk = price too high or audit too weak |
| Cash collected              | $5K+      | < $2K = full plan review |

---

## 11. Quick-reference: tools to set up TODAY

```
[ ] Google Voice — 3 numbers, 3 area codes (free)
[ ] Cal.com — book 15-min slots (free)
[ ] Stripe — Payment Link template ($1,500 setup + $2,500/mo recurring)
[ ] Notion / Google Sheet — CRM (track every dial)
[ ] Loom — record 60-sec audit walkthroughs to send via SMS (free)
[ ] Phantombuster — scrape Google Maps (free trial 14 days)
[ ] GOATED audit page — pre-run audits as leave-behinds
```

Total setup time: **3 hours.** Total cost: **$0.**

---

*"You can't out-think a slump. You can only dial through it."* — every successful agency owner ever.
