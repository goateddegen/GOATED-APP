# GOATED — Weekend → Monday Sprint Plan

**Owner:** Tarek Ali (solo)
**Goal:** First close by Monday/Tuesday, April 27/28
**Standard:** Cash collected, not pipeline
**Mantra:** Done being broke.

---

## North star math

**$30-40K cash by mid-June.** That's:

- 5-7 Tier 1 closes ($2K + $750/mo) → $13.7K-$19.2K first-month cash
- 1-2 Tier 2 closes ($10-20K + $2.5-5K/mo) → $12.5K-$25K first-month cash
- **Combined target: ~$30K cash first-month, ~$45K M3, ~$70K M6**

Math gets you there at **2-3 closes/week starting May 5**. That's **15-20 booked sales calls/week** at 25% close rate. That's **~75-100 dials/day** at 5% dial-to-meeting rate.

You have to dial. There is no shortcut.

---

## SATURDAY (April 25) — INFRA DAY

### Morning block (8:00-12:00)

**8:00-8:30 — Vercel un-pause**
1. Open https://vercel.com/devs-projects-c5dea2b1/goated-app
2. Look for `live: false` banner. Causes:
   - Bandwidth limit (free 100GB/mo) → wait til May 1 OR upgrade Pro $20/mo
   - Deployment limit (100 builds/day) → wait OR upgrade
   - Billing prompt → add a card (you won't be charged below limits)
3. **Recommendation: upgrade to Pro ($20/mo).** First close pays for it 100×. Plus: Vercel Authentication on previews, custom domain SSL, 1TB bandwidth, faster builds.
4. Once unpaused → Deployments → Redeploy `master` (commit `018d093` or later)

**8:30-9:30 — Domain unlock (Namecheap)**
1. Open https://ap.www.namecheap.com/Domains/DomainControlPanel/goated.solutions
2. Banner says "Domain suspended — contact verification needed"
3. Check email + spam folder for ICANN/Namecheap verification email
4. If not found: Domain List → goated.solutions → "Resend Verification"
5. Click link in email. DNS propagates in 5-30 min.
6. Verify in Vercel → Project → Domains → goated.solutions shows green check

**9:30-11:30 — API keys (the 30-min sprint from INTEGRATIONS.md)**
- [ ] Sign up Groq → free key → set `GROQ_API_KEY`
- [ ] Sign up Anthropic → add $5 credit → set `ANTHROPIC_API_KEY`
- [ ] Sign up Supabase → create project → set 3 keys (URL, anon, service)
- [ ] Run the SQL from INTEGRATIONS.md §2 in Supabase SQL Editor
- [ ] Sign up Stripe → test mode keys → set `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY`
- [ ] Sign up Apollo (free tier) → set `APOLLO_API_KEY`
- [ ] Vercel env vars → paste all 7 keys (Production scope)
- [ ] **Set `VITE_LAUNCH_READY=true`**
- [ ] Click "Redeploy" — cover page falls away, app goes live

**11:30-12:00 — Stripe Payment Links**
- Create **Tier 1 Local Engine link**: $2,000 setup (one-time) + $750/mo recurring (3-mo min)
- Create **Tier 2 Growth Starter link**: $10,000 setup + $2,500/mo recurring (6-mo min)
- Save both URLs in your phone notes for fast pasting on close calls

### Afternoon block (1:00-5:00)

**1:00-2:00 — Virtual numbers**
1. Create 3 fresh Gmail accounts: `goated.dallas@`, `goated.atlanta@`, `goated.tampa@`
2. Set up Google Voice number on each:
   - Dallas Gmail → number with 214/972/469/817 area code
   - Atlanta Gmail → 404/678/770/470
   - Tampa Gmail → 813/727
3. Forward all to your iPhone
4. Test outbound from each number — verify caller ID shows local

**2:00-4:00 — List building**
- Tool: PhantomBuster free trial (https://phantombuster.com)
- Phantom: "Google Maps Search Export"
- Run 3 queries in parallel (different tabs):
  1. `HVAC Dallas TX` → export 75-100 results
  2. `med spa Atlanta GA` → export 75-100 results
  3. `dental practice Tampa FL` → export 75-100 results
- Combined target: 250-300 prospects with name, phone, website, reviews
- Drop into a Google Sheet: `Prospects · Week 1`
- Columns: Company, Website, Phone, Owner Name (research later), Vertical, Metro, Audit URL (fill Sunday), Status, Notes

**4:00-5:00 — Pre-run audits on top 50**
- For each of the top 50 prospects (by review count + visible website):
  - Open `https://goated-app-nine.vercel.app/#/for/{their-slug}?u={their-url}`
  - The audit auto-runs and saves a shareable link
  - Paste audit URL into the sheet
- This is your AMMUNITION. When you call them Monday, you reference the EXACT number from their audit.

### Evening (7:00-9:00)

**Read these end-to-end:**
1. `docs/CLOSING_PLAYBOOK.md` (this commit)
2. `docs/OUTREACH_PLAYBOOK.md`
3. `docs/EXECUTION_PLAN_2026.md`

**Memorize the dial script.** Not "read it." MEMORIZE the opening 15 seconds. Practice out loud 20×. Record yourself, listen back. The opening sells the meeting; everything else is context.

---

## SUNDAY (April 26) — SCRIPT + PSYCHE DAY

### Morning (9:00-12:00)

**9:00-10:00 — Audit the top 50 list**
- Skim each audit page result
- Pick the **TOP 20** with the highest "monthly revenue loss" number
- These are your Monday morning hot list. They get called first.
- Sort the sheet by "audit headline number desc"

**10:00-11:00 — Owner research**
For each of the top 20, find the owner's first name:
- LinkedIn search (do NOT message — just learn the name)
- Google `"[Company]" + "owner"` or `"[Company]" + "founder"`
- Yelp / Google reviews — owners often respond to reviews
- Worst case: just call the business, ask "who handles marketing?" — get the name, hang up, call back tomorrow with the name

**11:00-12:00 — Practice calls**
- Call 3 friends and pretend they're prospects
- Run the full dial script: opening → number → ask → handle objection → book or hang up
- Record yourself with iPhone Voice Memos. Listen for: speed (slow down), filler words ("um/like/so"), confidence in the number ("$8,400/mo" — say it like you'd say your phone number, not like you're guessing)

### Afternoon (1:00-5:00)

**1:00-3:00 — Pitch deck (one Loom video)**
- Open Loom (free)
- 90-second walkthrough of YOUR audit page running on a sample HVAC prospect
- Script:
  - 0-15s: "I just ran an audit on [company]. Here's what I found."
  - 15-45s: walk through the leak headline + the top 3 recovered-revenue plays
  - 45-75s: explain "this is what I'd run for you — voice agent + SMS + booking, $2K to set up, $750/mo, refundable in 30 days if it doesn't recover the setup"
  - 75-90s: "Reply YES to grab a call this week — I'm taking 3 clients in [their city]"
- Save the Loom URL — paste it in SMS follow-ups after every voicemail

**3:00-4:00 — CRM setup**
- Use a Google Sheet (free) — don't gold-plate with HubSpot/Pipedrive yet
- Tabs: `Prospects` (everyone) | `Hot` (top 20) | `Booked` (sales calls scheduled) | `Closed` (won)
- Per-row columns: Date called | Outcome (no answer / left VM / talked / book / not interested) | Next action | Notes

**4:00-5:00 — Mental psych**
- Walk outside. No phone.
- Visualize: 9:30 AM Monday. You hit DIAL #1. They pick up. Smooth open. Number lands. They engage. Book the call. Hang up. **High-five yourself.** Move to dial #2.
- This is mental rehearsal. It works. NFL quarterbacks do it. Closers do it.

### Sunday night (8:00-10:00)

- Set 3 alarms: 5:45 AM, 5:50 AM, 5:55 AM (all CST)
- Lay out: clothes, water bottle, AirPods (or wired headset — better mic), iPhone, MacBook, prospect sheet pinned to one tab, GOATED app pinned to another
- Phone on charger across the room (forces you out of bed)
- **Sleep at 10:00 PM CST.** No phone after 9:00.
- 8 hours sleep > caffeine. Trust me.

---

## MONDAY (April 27) — KILL DAY

### Wake-up: **6:00 AM CST**

(If you're on EST: 7:00 AM EST. If PST: 4:00 AM PST — yes, brutal. If you can't do 4 AM, target West Coast metros instead and dial 7 AM PST.)

### 6:00-7:00 — Body + mind

- Coffee
- 5 min cold shower (yes)
- 15 min walk OR push-ups + air squats — get blood moving
- Read your one-paragraph "why" out loud:
  > *I'm 20. I have everything I need to win. The phone doesn't care about my reputation. It just cares if I'm on it. I'm on it.*

### 7:00-8:00 — Final prep

- Re-read top 20 hot list. Note the headline number for each.
- Pull up the GOATED audit dashboard — make sure each audit URL still loads
- Glass of water. No more coffee yet.
- **Practice the opening 5 times out loud.** Big breath. Smile (it changes your tone — they hear it).

### 8:00-9:30 — DIAL BLOCK 1 (East Coast)

**Target: Atlanta + Tampa (EST/EDT)**
- 30 dials
- Goal: 3-5 connects, 1-2 booked calls

### 9:30-11:30 — DIAL BLOCK 2 (CST primary)

**Target: Dallas + Houston (CST)**
- 40 dials
- Goal: 5-7 connects, 2-3 booked calls

### 11:30-12:00 — Follow-up block 1

- For every voicemail you left: SMS within 60 sec
- For every "send me an email": send within 5 min using the Loom + audit URL
- For every "book a call": send Cal.com link immediately

### 12:00-1:00 — Lunch + decompress

- Step away from the phone
- Walk 15 min
- Do NOT scroll Twitter/IG (defeats nervous system reset)

### 1:00-3:30 — DIAL BLOCK 3 (Mountain + West)

**Target: Phoenix + LA (MST/PST)**
- 35 dials
- Goal: 4-6 connects, 1-2 booked calls

### 3:30-4:30 — Follow-up block 2

- All afternoon SMS
- Schedule sales calls into Cal.com
- Update the CRM sheet

### 4:30-6:00 — SALES CALLS

- Run any booked discovery calls (you should have 2-4 by Monday afternoon)
- Demo the audit live on the call
- **Ask for the close.** Send Stripe Payment Link on the call.

### 6:00-7:00 — Wins log

Write down:
- Total dials: ___
- Connects: ___
- Booked: ___
- Closed: ___
- Cash collected: $___

### 7:00-8:00 — Dinner

### 8:00-9:00 — Set up Tuesday list

Pull tomorrow's 100 dials from the master sheet. Pre-run audits on the top 30. Sleep.

### 9:00 — BED

---

## What "ensure closing every time" actually looks like

You won't close every time. Anyone who tells you they do is lying or about to be sued.

**Realistic numbers for solo cold outbound, week 1:**
- Dial → connect rate: 6-12%
- Connect → booked sales call: 15-25%
- Booked → closed: 20-35%
- **Net: 100 dials = 8 connects = 2 books = 0.5 closes**

That's why the math says 75-100 dials/day. Volume is the strategy.

**What actually moves the close rate higher:**

1. **Lead with their actual number.** Not industry stats. "Your business is missing $8,400/month" beats "the average HVAC business misses 18% of calls."
2. **Be the most prepared person they've talked to.** You ran their audit before calling. You know their reviews. You know their owner's name. They feel it.
3. **Anchor high, settle reasonable.** Open at $3K setup. Settle at $2K. Never start at the floor.
4. **Risk reverse hard.** "30-day money back on the setup if I don't recover at least the setup amount in saved revenue." This kills their main objection.
5. **Assume the close.** Don't ask "do you want to do this?" Ask "want me to send the link now or after the discovery call Friday?" Choice between two yeses.
6. **Name the slot.** "I take 3 new clients in [their city] each month. I have one slot left for May." Scarcity is real because you're solo.
7. **Don't chase.** One follow-up text. If they ghost twice, dump them. Your time is the asset.

---

## The Tier 1 vs Tier 2 split (when to push which)

### Tier 1 — Local Engine ($2K + $750/mo)
**Push when prospect is:**
- Brick-and-mortar SMB (HVAC, dental, plumbing, med spa, chiro, roofing)
- Sub-$2M annual revenue
- Owner-operator, 1-50 employees
- Pain: phone-driven business, missing calls

**Pitch flow:** opening → number → "I plug this leak in 30 days, $2K setup + $750/mo, refundable" → close on the call.

### Tier 2 — Growth Engine ($10-20K + $2.5-5K/mo)
**Push when prospect is:**
- Online business, SaaS, agency, consultancy
- $1M-$10M annual revenue
- Multiple seats, internal marketing person
- Pain: outbound at scale, attribution, brand growth

**Pitch flow:** opening → audit-based diagnosis → "we run the whole revenue engine" → discovery call required (don't try to close on first contact) → proposal → close on call #2 or #3.

**Don't pitch Tier 2 to Tier 1 prospects.** A plumber doesn't need a $20K setup. He needs the phone to ring more. Match the offer to the buyer.

---

## Money-collection: how it actually works

1. Prospect agrees on the call
2. You paste the Stripe Payment Link in iMessage or email **while still on the call**
3. They click → enter card → pay → confirmation lands on your Stripe dashboard
4. You see the green Stripe ping → "I see it landed. Welcome to GOATED. Onboarding kickoff Wednesday at 10."
5. Money is in your Stripe balance T+0 (instant for some processors), payable to your bank T+2

**Don't use:** invoices (slow, easy to ghost), wire transfers (only for $20K+ Tier 2 deals where they ask), checks (no), crypto (lol no).

**Do use:** Stripe Payment Link, every time, no exceptions. Card on file = closed deal.

---

## Confidence anchor (read every morning)

- You have a working product that does something real
- You have a script that's been tested by professional closers globally
- You have lists, tools, virtual numbers, audit URLs ready before the dial
- You have a clear pricing model that screens out tire-kickers
- You have 50 days of runway in the plan and 7 weeks until June 13
- The economy is full of small businesses bleeding money. You found the leak. Now you call them.

**The phone doesn't know your reputation. It only knows if you're on it.**

Be on it. LFG.

---

*Last updated 2026-04-24. Owner: secrdev@gmail.com.*
