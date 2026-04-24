# GOATED Outreach Playbook
**Last updated:** 2026-04-24
**Owner:** Founder/ops
**Scope:** Every cold touch — SMS, call, email, LinkedIn — that comes out of the GOATED stack or any founder-operated stack before we have dedicated reps.

---

## TL;DR — The Rules

1. **Never** call/SMS from your personal cell. Use a BYO virtual number per channel, per persona.
2. **Never** blast 500 leads from one number on day 1. Warm up: 20/day → 50/day → 100/day over 3 weeks.
3. **Always** register for A2P 10DLC (SMS) and SHAKEN/STIR (voice) before commercial traffic — unregistered = instant filter.
4. **Always** identify the sender and offer an opt-out. One missed opt-out = DNC list + possible TCPA complaint.
5. Channel mix for 2026 B2B cold: **LinkedIn (35%) / Email (30%) / Cold Call (20%) / SMS (10%) / Physical (5%)** — adjust per ICP.
6. SMS + voice should run from a number that matches the target area code ("local presence"). National 8XX numbers get filtered 3–5× more.
7. Every outbound gets logged in GOATED with channel, script, sentiment, disposition. No logging = no learning.

---

## 1. The Blacklist Problem (Why Your Own Number Is a Mistake)

Calling 50+ unknown numbers/day from a personal line flags you on:

- **Hiya, YouMail, Truecaller, RoboKiller** — consumer spam filters on 300M+ US devices. They ingest carrier complaint data + crowdsource "spam" reports. 3–5 flags and your number shows "Spam Likely" on every iPhone/Android.
- **T-Mobile Scam Shield, AT&T Call Protect, Verizon Call Filter** — carrier-level filters. Can silently block your calls at the network.
- **Carrier-level SMS spam detection** — pattern matching on content + volume. Personal numbers aren't registered for commercial SMS, so every business-like text is filtered by default (this is A2P 10DLC enforcement from US carriers since 2023).

Once blacklisted, the number is **effectively dead** for business outreach. Clearing it requires carrier disputes and weeks, often permanently damaged.

### Extra risk if using personal:
- iMessage spam filter training (Apple flags the sender globally)
- Apple ID reputation damage (affects your other iCloud services)
- TCPA exposure = $500–$1,500 per message in damages, per recipient, if someone sues. One 200-lead SMS blast with one non-consenting recipient who lawyers up = 6-figure liability.

**Rule:** Personal number = sacred. Business outreach = dedicated BYO stack.

---

## 2. Virtual Number Stack — Recommendations

### Tier 1: Production (use these)

| Service | Best for | Monthly | iMessage? | A2P 10DLC? | Notes |
|---------|----------|---------|-----------|------------|-------|
| **OpenPhone** | Founder-led B2B, <50 calls/day | $19/user | ✅ Yes (iMessage-like, not native) | ✅ Built-in | Shared inbox, CRM integrations, transcripts. Best dev-friendly. |
| **Dialpad** | Scaling 2–20 reps | $27/user | ❌ | ✅ | Native dialer, AI coaching, Salesforce/HubSpot deep. |
| **Sinch / MessageBird** | Programmatic SMS at scale | $0.0075/SMS | ❌ | ✅ | API-first. Use when you wire SMS into GOATED workflows (phase 2). |
| **Aircall** | Pure voice team | $30/user | ❌ | N/A (voice) | Click-to-dial, call recording, analytics. |

### Tier 2: Budget / personal founder backup

| Service | Cost | Use case |
|---------|------|----------|
| **Google Voice (Workspace)** | $10/user in GSuite | Low-volume warmup; weak for cold SMS, filtered more aggressively |
| **iPlum** | $5–10/mo | Single dedicated "business line" on existing iPhone — iMessage compatible |
| **Burner / Hushed** | $5/mo | Throwaway lines for A/B testing scripts. Rotate monthly. |

### What we specifically **NOT** recommend for B2B:
- **TextFree, TextNow, free VOIP apps** — consumer lines, carrier-flagged as spam by default, no 10DLC.
- **Twilio SMS without 10DLC registration** — messages get silently dropped post-2023. If using Twilio, register the brand + campaign first (2–4 week process).
- **Unregistered 8XX toll-free for cold outbound** — filtered at carrier level; only use for inbound support/warm flows.

### iMessage/native contact parity
If the user needs iMessage continuity (blue bubbles → better open rates, image/link previews):
1. **iPlum** or **OpenPhone** both offer it via their own apps (not Apple's native Messages, but visually similar).
2. **Pure iMessage from a secondary Apple ID** — link a dedicated business Apple ID to an iPad or Mac, iMessage only. Compliant for 1-to-1 warm outreach, **not** for cold blasts.
3. Any true cold SMS/MMS campaign → go A2P 10DLC via OpenPhone/Sinch. iMessage is for warm post-booking touches, not cold.

---

## 3. A2P 10DLC Registration (Non-Negotiable for SMS)

If we touch US carriers for SMS (all cold SMS does), we MUST register:

1. **Brand registration** — $4 one-time, via OpenPhone/Twilio/Sinch. Need EIN, company legal name, website, contact.
2. **Campaign registration** — $10 one-time + $2/mo per campaign. We need one campaign per use case: "Sales outreach," "Appointment reminders," "Transactional," etc.
3. **Throughput tiers** — starter = 10 msg/sec (~600/min), standard = 225 msg/sec. We don't need standard until we hit 10k msgs/day.
4. **Consent language** — every campaign must prove how we got opt-in. For cold outreach, "identified lead through publicly-available business contact info" is the weakest but accepted basis. Always include "Reply STOP to opt out" on every message.

**Timeline:** 3–14 days for approval. **Do this week 1 if we haven't already.**

---

## 4. Anti-Blacklist / Deliverability Tactics

### Phone / SMS
- **Local presence dialing** — buy numbers in each target area code. $1/mo per DID. Pick up 2–4× more than a 415 calling Dallas.
- **Warm the number** — week 1: 10 calls/day, 5 SMS/day. Week 2: 25/10. Week 3: 50/25. Hit the cap gradually so carriers don't pattern-flag.
- **Rotate per persona** — don't use the same number for 3 different campaign scripts; carriers pattern-match text content.
- **STIR/SHAKEN attestation A** — the carrier's highest trust level, only possible when your CNAM (caller ID) is registered to your verified business.
- **Spoof? No.** Illegal (TRACED Act 2019, enforced by FCC). Use local-presence dialing, not spoofing.
- **Monitor spam score** — numeracle.com / freecallerregistry.com — check weekly that our DIDs aren't flagged. If flagged, dispute + rotate.
- **Content**: avoid trigger words in SMS ("free," "guaranteed," "winner," "act now," excessive punctuation !!!, all-caps, shortened URLs like bit.ly). Use full custom domain URLs tied to the verified brand.

### Email (for when we turn it on)
- **Separate sending domain** from primary — e.g. `goated-reach.com` not `goated.solutions`. Protects the main domain's reputation from cold-email burns.
- **SPF, DKIM, DMARC all authenticated** — non-negotiable. Run dmarc.postmarkapp.com checks.
- **Warm up the domain**: 50 sends day 1 → 500 by week 4. Tools: Instantly, Smartlead, Lemwarm.
- **Keep reply rate > 2%** and open rate > 30%. Below that, you're flagged.
- **Send windows**: 9am–11am local to recipient, Tue/Wed/Thu. Don't send weekends for B2B.
- **Plain text > HTML** for cold. Richer template = spam flag.

### LinkedIn
- **Connection cap**: 100/week (LinkedIn enforces this; do 80 to stay safe).
- **Premium or Sales Navigator**: 50 InMails/mo for Premium, 150 for Sales Nav. Budget $79/mo for Sales Nav per user on outbound team.
- **No automation tools**: Dripify, Expandi, PhantomBuster all get accounts banned in 2026 (LinkedIn deploys ML detection). Do it manually or via LinkedIn's own API via ~Sales Nav~.
- **Profile first**: no outbound until profile has > 500 connections, recent post in last 7 days, and a company page.

---

## 5. Channel Playbook

### SMS — Best for: confirmation, follow-up to first touch, time-sensitive

**When:** Day 2 and Day 7 follow-ups after initial email/LinkedIn. Cold SMS is legal but low-converting; don't lead with SMS.

**Script template (after warm intro):**
```
Hi [Name] — [Your name] from GOATED, following up on my email Tue re: [specific thing they do].
Got 15 min this week to talk about getting you in front of qualified [industry] leads, 13% on-close only?

Reply STOP to opt out.
```

**Rules:**
- Opening ~50 chars (first preview line). No "Hey!!!"
- One sentence, one ask, one link. No essays.
- STOP in every single message.
- Never 2nd attempt if no reply. One SMS touch, max.

### Cold Call — Best for: founders / decision-makers with published direct lines

**When:** Tue/Wed/Thu, 10–11:30am or 3:30–4:30pm local time. Never Monday AM or Friday PM.

**7-second opener (field-tested):**
```
Hi [Name], this is [Your name] from GOATED. Did I catch you at a bad time? …
I'll be quick. We help [their industry] founders close 3–5 more deals a month
by bringing high-intent leads and AI-run outreach — you only pay 13% on closed
revenue. Worth a 15-minute call this week?
```

**Rules:**
- Start with "Did I catch you at a bad time?" — pattern-interrupts "is this a sales call?" reflex, consistently opens better than "How are you today?"
- Answer their objection in ≤15 words. No defending. Pivot to calendar.
- Max 3 call attempts per lead across 14 days. After that, move to email-only.
- Always leave a 20-second voicemail with a specific reason to call back: "Question about your [recent LinkedIn post / recent hire / company news]."

### LinkedIn — Best for: founder-to-founder, referral-pattern outreach

**Connection note (<300 chars):**
```
Hey [Name], saw your post on [specific topic]. I'm building GOATED — AI lead engine
for [their industry] founders, only pay 13% on closed revenue. Mind if I share
what we're doing? No pitch attached to the connect request.
```

**Follow-up after accept (Day 2):**
```
Appreciate the connect. Quick context: we're closing 3–5 extra deals/mo for
[their industry] teams with AI-run outreach + on-demand lead intel. 13% on-close only, $0 platform.

Worth a 15-min convo this week? Or happy to just share the 1-pager.
```

**Rules:**
- Never pitch in connection request itself.
- Every 2nd message max, then stop. No nagging.
- Engage with their content 2–3 times before any outbound touch (like + meaningful comment).

### Email — Best for: scale + compounding replies

**Cold email template:**
```
Subject: [Their company] × GOATED — quick idea

[Name], saw [specific thing about them]. Sharp move.

Building GOATED — AI lead engine + done-for-you outreach for [their industry].
Only fee: 13% flat on closed revenue. $0 to get started, zero platform fees.

Worth a 15-min call next Tue or Wed?

— [Name]
```

**Rules:**
- Subject line ≤ 40 chars. No emojis.
- First line personal. Not "Hope you're well."
- One CTA. One ask. One link.
- P.S. optional for social proof or humor — sometimes lifts reply 1.5×.
- Follow up 3x: Day 3, Day 7, Day 14. Then archive.

### Physical mail — Best for: whale-level deals ($100k+ ACV)

**When:** Tier-1 enterprise targets only. $10–25/unit cost is justified when LTV is $50k+.

- Handwritten note + one-pager + your card to their office, addressed to them personally.
- Mention you emailed/called. Frame as "just wanted to make sure this got to you personally."
- Convert at 10–15% vs 1–2% for cold email on enterprise. Ludicrous ROI, but doesn't scale.

---

## 6. Cadence / Sequence (field-tested 2026)

**14-day multi-touch cadence, per lead:**

| Day | Channel | Action |
|-----|---------|--------|
| 0 | LinkedIn | Connection request w/ personalized note |
| 1 | Email | Cold email #1 |
| 3 | Email | Follow-up #1 (bumped reply) |
| 5 | Call | Call attempt #1 + voicemail if no answer |
| 7 | SMS | Short SMS if phone found |
| 8 | LinkedIn | Follow-up message (if connected) |
| 10 | Call | Call attempt #2 |
| 12 | Email | Breakup email ("last touch") |
| 14 | — | Move to nurture list (30/60/90-day re-engage) |

**Expected results at scale (for 500 leads/month/rep, qualified ICP match):**
- LinkedIn connect accept: 30–40%
- Email reply: 3–5%
- Call pickup: 15–25%
- Meetings booked: 3–5% of total touched
- Meeting → closed: 15–25%
- **Net: 500 touches → 15–25 meetings → 3–6 closed deals/month/rep**

With 13% commission × avg $42k deal = $5,460/deal × 4.5 avg = **$24,570 MRR per active rep/month** after ramp.

---

## 7. Monitoring + Logging

Every outbound event through GOATED (or any rep's BYO stack) must log:

- `lead_id`, `channel`, `timestamp`, `from_number/email`, `to`, `script_template_id`
- `disposition` (connected / voicemail / no-answer / wrong-number / opt-out / reply-positive / reply-neg)
- `sentiment` (AI-scored on reply text)
- `next_action` (scheduled call-back / nurture / closed / DNC)

This feeds the AI agent to:
- Detect scripts that underperform (drop + iterate)
- Detect numbers getting flagged (pause + rotate)
- Detect ICP segments not responding (re-weight)
- Detect reps not hitting minimums (coach)

**Do not** store outbound data in spreadsheets. Ever. Either it lives in GOATED with structured schema or it's invisible to the AI layer.

---

## 8. Compliance Checklist

- [ ] TCPA — consent basis documented for every SMS campaign
- [ ] A2P 10DLC — brand + campaign registered for every SMS sender
- [ ] CAN-SPAM — physical mailing address + opt-out in every email
- [ ] GDPR / CCPA — opt-out honored within 10 days, scrubbed from DB
- [ ] DNC list — internal list maintained, scrubbed against before every campaign
- [ ] Recording disclosure — "This call may be recorded" in all US 2-party consent states (CA, FL, IL, MD, MA, MT, NH, PA, WA)

---

## 9. Phase-gated internal roadmap (from founder-led → reps)

### Phase 1 — Solo founder, month 0–2 (now)
- 1× OpenPhone line with 3 DIDs (NYC, SF, LA area codes)
- Sales Nav + 1 Lemlist / Smartlead account
- Manual LinkedIn. Target: 100 meaningful touches/week.
- Goal: 10 customers / $10k MRR.

### Phase 2 — First hire, month 3–6
- Add 2nd OpenPhone seat
- Add dedicated SDR with own BYO stack (company pays Dialpad)
- Register with Common Room or Clay for data-enriched sequences
- Goal: 30 customers / $40k MRR.

### Phase 3 — Rep team, month 6–12
- Switch to Dialpad or Aircall (multi-seat dialer with team coaching)
- Centralized Clay + Smartlead + LinkedIn stack
- Goal: 100+ customers / $150k+ MRR, 3–5 reps.

### Phase 4 — Programmatic (year 2)
- Full Sinch/Twilio programmatic SMS integration into GOATED workflow
- AI-generated call-scripts per-lead via Claude + voice clone for VM
- At this phase, we revisit in-app dialer integration since infra is battle-tested

---

## 10. What we are *explicitly* NOT doing

- **No in-app VoIP / dialer** in year 1. Users bring their own number (OpenPhone/Dialpad/iPlum). GOATED opens a native `tel:` link; the user's OS/preferred dialer takes over. This dodges regulatory complexity (carrier agreements, E911, number porting, 10DLC brand risk).
- **No purchased lists** from LeadIQ / ZoomInfo raw dumps. Only manually-qualified or API-sourced (Apollo, LinkedIn) with named provenance. Protects deliverability and brand.
- **No ringless voicemail (RVM)** — gray legal area under TCPA, often auto-flagged.
- **No auto-dial / predictive dialer** in phase 1. Manual-only to stay below TCPA "auto-dialer" definition (which triggers stricter consent requirements).
- **No AI voice clone outbound** until year 2 — reputation risk if a recipient thinks they're talking to a real person and discovers it was AI. Save for warm inbound flows first.

---

## References + reading
- TCPA 2024 FCC final rules: https://www.fcc.gov/consumers/guides/robocalls
- A2P 10DLC guide: https://support.openphone.com/hc/en-us/articles/360057497153
- STIR/SHAKEN attestation: https://www.fcc.gov/call-authentication
- LinkedIn 2026 fair-use limits: https://www.linkedin.com/help/linkedin/answer/a1338610

**Shipping discipline:** every deviation from this playbook must be logged + reviewed weekly. Reputation damage compounds; one bad week can cost 6 months of deliverability.
