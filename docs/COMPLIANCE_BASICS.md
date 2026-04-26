# GOATED — Compliance Basics

**Owner:** Tarek
**Updated:** 2026-04-25
**Use:** TCPA, A2P 10DLC, recording consent, and the legal floor for cold outbound. Not legal advice — read once, follow the checkboxes, retain a TX business attorney at $50K profit.

---

## Why this matters

The FCC + FTC + state attorneys general have stepped up enforcement on cold outbound. The fines are real:
- **TCPA (cold call/SMS violations):** $500-$1,500 per call/text
- **State-level violations:** vary, often higher
- **A2P 10DLC SMS without registration:** carrier blocks + reputation damage

You don't need to be paranoid. You need to follow the basic rules.

---

## TCPA cold-calling basics

The Telephone Consumer Protection Act (1991, updated regularly) regulates how you can contact prospects.

### What's regulated

- **Phone calls** to consumers (residential lines)
- **SMS** to mobile numbers
- **Pre-recorded / robocall** messages
- **Auto-dialed calls** (using ATDS — Automatic Telephone Dialing System)

### Who's the prospect?

For SMB B2B cold outbound:
- ✅ Calling a published BUSINESS phone number (Yelp, Google Maps, business website) — generally allowed under business-to-business exemption
- 🟡 Calling a cell phone listed as the business contact — gray area. Legal but document the source
- ❌ Calling a personal cell number scraped from social media — risky
- ❌ Calling a number on the federal Do Not Call (DNC) registry — illegal without prior business relationship

### The DNC registry check

Before mass outbound, scrub your list against the National DNC Registry.

**For pure B2B cold calling to BUSINESSES:** the DNC registry doesn't apply (the FTC carves out B2B). However, if the business uses a cell as their primary line, it's likely on the DNC.

**Safe play:** scrub your prospect list against the DNC anyway. Tools:
- **DNC.com** — pay-per-scrub, $0.05 per record
- **PossibleNOW** — enterprise, expensive
- **Free workaround:** call only published landline business numbers (Apify Google Maps shows this)

### Calling hours

By federal TCPA rules:
- ✅ 8 AM - 9 PM local time of recipient
- ❌ Before 8 AM or after 9 PM in their time zone

This is why your dial blocks rotate (East / Central / West) — to stay within hours for each.

Some states are stricter (Texas: 9 AM - 9 PM; California: 8 AM - 9 PM). Default to **9 AM-8 PM** in their local time to stay safe.

### What you can't do

❌ Pre-recorded message to a cell phone WITHOUT prior express consent
❌ Auto-dialed call to a cell WITHOUT prior express written consent
❌ Calling someone after they've said "stop calling" (DNC their number internally)
❌ Calling residential numbers on DNC

### What you CAN do safely

✅ Manual dialing to a published business number
✅ Live conversation (you're not pre-recorded)
✅ Following up with someone who showed interest (they're "expressed interest")
✅ Calling someone with whom you have a prior business relationship

---

## SMS compliance — A2P 10DLC

Application-to-Person 10-digit-long-code messaging is regulated since June 2023.

### What you must register (BEFORE sending SMS)

Every brand sending SMS via Twilio (or any carrier) must register:

1. **Brand registration** ($4 one-time) — your LLC's identity
2. **Campaign registration** ($2/mo per campaign) — what your messages say + who you're sending to

**Without registration:** carriers will throttle (Verizon: 6,000 msgs/day) or block (AT&T: 100% block rate above limits).

### Register via Twilio

```
Twilio Console → Messaging → A2P 10DLC → Brand registration
   - LLC name + EIN
   - Address (use registered agent)
   - Vertical (TECHNOLOGY or PROFESSIONAL_SERVICES)
   - Stock symbol: PUBLIC = no
   - Brand type: LLC

Twilio Console → A2P 10DLC → Campaigns
   - Use case: MARKETING (cold outreach) AND CONVERSATIONAL (sales follow-ups)
   - Sample messages: paste 3-5 of your real templates from TEMPLATES.md
   - Opt-in flow: "Replied to our cold call/email"
   - Opt-out: "Reply STOP to opt out"
```

### Required SMS elements

Every cold outreach SMS must include:

✅ Brand identification: "from {GOATED}" or company recognizable
✅ Opt-out: "Reply STOP to opt out" (in first message + monthly)
✅ Reply-to-help: "Reply HELP for info"

**Example compliant SMS:**

```
Hey John, Tarek with GOATED. Sent over a 90-sec audit of your site.
Loom: {url}. Reply STOP to opt out.
```

### What you can't do via SMS

❌ Auto-blast to numbers without registration
❌ Send first message without opt-in (cold outreach is gray — see below)
❌ Ignore STOP requests (must process within 24 hr)
❌ Send commercial SMS during quiet hours (10 PM - 8 AM local)

### Cold-SMS gray area

Pure unsolicited cold SMS (no prior consent) is technically risky under TCPA. The safer pattern:

1. Cold CALL first → if they answer + show interest → you've got verbal consent → SMS follow-up is fine
2. Cold CALL → voicemail → SMS follow-up = gray area, low risk in practice for B2B but document source

**Rule of thumb:** if you can show that the prospect's number was published on a public business listing AND your SMS is short, identifying, and offers opt-out, you're in the safe-harbor zone.

---

## Call recording — state-by-state consent

Federal law: ONE-PARTY consent (you can record without telling the other party as long as you're a party to the call).

State law overrides for **two-party consent states**:

### Two-party consent states (you MUST disclose)

```
California
Connecticut
Delaware
Florida
Illinois
Maryland
Massachusetts
Michigan
Montana
Nevada
New Hampshire
Pennsylvania
Vermont
Washington
```

### One-party consent states (you can record silently)

Everywhere else, including:
- Texas ✅ (your home base)
- New York
- Most of South + Midwest

### The rule for interstate calls

If EITHER party is in a two-party state, the call requires two-party consent. So:
- Texas → Texas: one-party (no disclosure needed)
- Texas → Florida: two-party (disclose at start)
- Texas → California: two-party (disclose)

**Safe default:** disclose recording on EVERY call. Costs you nothing, protects you everywhere.

### Disclosure script

At the START of any sales/discovery call:

> "Heads up — this call may be recorded for quality and training. That cool with you?"

If they say no → you can't record. Take notes. Move on.
If they say yes → record (Otter.ai, Krisp, Granola, native iPhone Voice Memo).

---

## Stripe + payment compliance

### KYC

Stripe will require:
- Your real legal name
- Real SSN
- Real address
- Real LLC EIN
- Real bank account

**Don't try to hide here.** Stripe is FinCEN-supervised. They WILL freeze accounts that fail KYC.

### Card-present + chargeback risk

Setup deposits ($2K-$20K) ARE chargeback targets if a client gets buyer's remorse.

**Mitigations:**
1. **Always have a signed contract** (Master Services Agreement) BEFORE charging
2. **Always have email/SMS confirming the engagement** (paper trail)
3. **Document delivery milestones** (so you can dispute "didn't get what I paid for")
4. **30-day money-back guarantee** is your best defense — if you preemptively refund unhappy clients, they can't chargeback (chargebacks come 30-60 days later)

### Refund disclosure

Stripe requires a refund policy on your site. Yours should say:

> "GOATED Solutions offers a 30-day money-back guarantee on all initial setup fees. If you are not satisfied with the service deployed in the first 30 days, contact tarek@goated.solutions for a full refund. Monthly retainers are non-refundable but can be cancelled anytime with 7 days' notice."

Add this to `/refund-policy` page.

---

## Privacy + data handling

### What you collect

For prospects:
- Phone number (from public listing)
- Business name + address (public)
- Email if available (public)

For clients:
- All of the above
- Their customer call recordings (for AI agent processing)
- Their CRM data (during reactivation campaigns)

### Privacy policy MUST cover

✅ What data you collect
✅ Why you collect it
✅ Who you share it with (Twilio, VAPI, Anthropic, Stripe)
✅ How long you retain it (define a policy: e.g., 24 months)
✅ How users can request deletion

**Generate via Termly.io** — free, takes 5 minutes, covers state laws (CCPA, etc.).

### HIPAA (if you serve healthcare)

Dental practices, medical practices, chiropractors, vet clinics → if you handle ANY patient data (call recordings of patients, appointment data with names), you need:

1. **BAA (Business Associate Agreement)** with the practice
2. **HIPAA-eligible Twilio tier** ($150/mo additional, must request)
3. **HIPAA-eligible VAPI** (Bland AI has HIPAA tier)
4. **Encrypted data at rest + in transit**

If you're not ready to handle HIPAA properly, **don't take healthcare clients yet.** They're high-value but high-risk.

---

## Email compliance — CAN-SPAM

For cold email, the CAN-SPAM Act (2003) requires:

✅ Truthful subject line (no "FW:" or "RE:" tricks)
✅ Identification as advertisement
✅ Real physical address in footer
✅ Unsubscribe option
✅ Honor unsubscribe within 10 business days

Your email footer should include:

```
GOATED Solutions LLC
{registered_agent_address}
{city}, TX {zip}

To unsubscribe, reply STOP or click here: {unsub_url}
```

For low-volume manual cold email (you sending 10-30/day), you can get away with simpler. For mass cold email (hundreds/day via Instantly, Smartlead, etc.), CAN-SPAM enforcement is real.

---

## Texas-specific notes

You're domiciled in Texas. Some advantages:

✅ One-party consent recording state
✅ No state income tax
✅ Strong LLC protections
✅ Texas Telephone Solicitation Act = generally B2B-friendly
✅ TX Business Court system (since 2024) = faster commercial disputes

Watch out for:
🟡 Texas "Do Not Call" list (separate from federal) — register your numbers

---

## Compliance checklist for Monday

```
[ ] LLC active in TX
[ ] EIN obtained (free from IRS)
[ ] Twilio brand + campaign registered (A2P 10DLC)
[ ] Stripe account verified (KYC complete)
[ ] Privacy policy at /privacy
[ ] Terms of Service at /terms
[ ] Refund policy at /refund-policy
[ ] CAN-SPAM compliant email footer
[ ] Recording disclosure script memorized
[ ] STOP keyword auto-handler in Twilio
[ ] DNC scrub run on prospect list (or limit to verified business numbers)
[ ] Call hours: only 9 AM - 8 PM local of recipient
[ ] HIPAA setup deferred unless ready (skip healthcare for Week 1 if not BAA-ready)
```

---

## What to do if you get a complaint or threat

### "Take me off your list"

```
1. Mark them in CRM as DNC immediately
2. Reply: "Understood. Removing you now. Apologies for the disruption."
3. Never contact again (you, your VA, no one)
```

### "I'm going to report you to the FCC"

```
1. Take the threat seriously even if they're bluffing
2. Reply professionally: "Understood. We'll remove you from all lists.
   Sorry for the inconvenience."
3. Document the interaction in CRM
4. Move on — most threats don't result in actual filings
```

### "Are you using auto-dialer?"

```
"No — I'm dialing manually from a list of public business listings.
This is a one-on-one conversation, not auto-dialed."
```

### A real lawsuit / regulatory letter

```
1. STOP all outbound to that prospect immediately
2. Don't reply yourself
3. Hire a TCPA attorney — Texas options:
   - Lerman Senter (Austin)
   - Reed Smith (Dallas)
4. Most TCPA suits settle for $500-$5,000 if you're cooperative
5. Update your processes to prevent recurrence
```

**This is rare.** Most B2B cold outbound that follows the basics never sees enforcement. But know the playbook.

---

## When to lawyer up

| Trigger | Action |
|---|---|
| First $25K in revenue | $500/yr basic TX business attorney for contract review |
| First HIPAA-relevant client | $1-2K HIPAA-specific attorney consult |
| First cease-and-desist letter | Stop outbound to that prospect, $500 lawyer letter response |
| Subpoena or formal complaint | $5-15K legal retainer — DO NOT respond yourself |
| Acquired or acquiring | M&A attorney, $20K+ |

---

## Books / resources to skim once

- **CAN-SPAM** plain-language guide: ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- **TCPA** consumer guide: fcc.gov/consumers/guides/stop-unwanted-robocalls-and-texts
- **A2P 10DLC** Twilio guide: twilio.com/docs/messaging/compliance/a2p-10dlc
- **HIPAA** guide for tech companies: hhs.gov/hipaa/for-professionals/

---

## TL;DR — what actually matters Monday

1. **Call only published business numbers** (Apify Google Maps, Yelp).
2. **Stay between 9 AM-8 PM local** for the recipient.
3. **A2P 10DLC registered before sending SMS.**
4. **Disclose recording** at start of every sales call.
5. **Privacy/Terms/Refund pages live** on your domain.
6. **STOP request → instant DNC mark.**
7. **No HIPAA clients until BAA-ready.**
8. **Document everything** — CRM notes are your defense.

---

*Compliance is not glamorous. It's also not optional. The 30 minutes you spend this weekend on A2P + privacy pages save you 30 grand later.*

— v1, 2026-04-25 · Not legal advice — consult a TX attorney at $50K profit
