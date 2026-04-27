# GOATED — Prospect List Building Queries

**Owner:** Tarek
**Updated:** 2026-04-25
**Use:** Copy-paste search queries for Apify, PhantomBuster, and manual list building. Per-metro × per-vertical scrape recipes that yield 100-300 prospects each.

---

## Recommended tools (in order of preference)

| Tool | Cost | Speed | Quality | When to use |
|---|---|---|---|---|
| **Apify Google Maps Scraper** | $49/run | Fast (5-10 min) | High | Default — best per-dollar |
| **PhantomBuster Google Maps Search** | $69/mo subscription | Medium | High | If you'll scrape monthly |
| **Manual Google Maps + spreadsheet** | $0 | Slow (60-120 min per 100) | Highest | When scraping isn't ideal |
| **Apollo.io free tier** | $0/mo | Medium | Mixed | For email capture, not phone |
| **ZoomInfo** | $$$$ | N/A | High | Skip — too expensive for SMB |

**Recommendation:** Apify single run ($49) → 250-500 prospects → list lasts 4-6 weeks. Don't subscribe to anything monthly Phase 0.

---

## Apify Google Maps Scraper — query format

**Tool:** [apify.com/compass/crawler-google-places](https://apify.com/compass/crawler-google-places)

**Input format:**
```json
{
  "searchStringsArray": ["{query}"],
  "locationQuery": "{metro}, USA",
  "maxCrawledPlacesPerSearch": 250,
  "language": "en",
  "deeperCityScrape": false,
  "scrapeReviewsCount": 0,
  "skipClosedPlaces": true
}
```

**What you get back per result:**
- Business name
- Phone number (often direct line)
- Website
- Address
- Category
- Rating + review count
- Hours
- Photos (URL list)
- Owner reply patterns (hints at engagement)

---

## Per-vertical search queries

### HVAC

**Apify:**
```
"HVAC {metro}"
"AC repair {metro}"
"heating cooling {metro}"
"air conditioning service {metro}"
"furnace repair {metro}"
```

**Best filter post-scrape:**
- Rating: 3.8-4.7 (not 5.0 = fake reviews; not <3.5 = struggling business)
- Review count: 30-300 (not new, not too big to need help)
- Has website (avoid no-website operators — too small)
- Has phone (mandatory)

**Estimated yield:** 150-250 prospects per metro

---

### Dental

**Apify:**
```
"dentist {metro}"
"dental clinic {metro}"
"family dentistry {metro}"
"cosmetic dentist {metro}"
"pediatric dentist {metro}"
```

**Best filter:**
- 1-3 doctor practices (skip DSO chains — they have corporate marketing)
- Look for "Dr. {Name} DDS" branding (owner-operator)
- Reviews: 50-300
- Skip: Aspen Dental, Heartland, Pacific Dental Services (DSOs)

**Estimated yield:** 100-200 prospects per metro

---

### Plumbing

**Apify:**
```
"plumber {metro}"
"plumbing {metro}"
"emergency plumber {metro}"
"drain cleaning {metro}"
"water heater {metro}"
```

**Best filter:**
- Independent shops (avoid Roto-Rooter franchises)
- 1-10 employees (Yelp business pages often show this)
- Look for "owner-operated" in description
- Skip large national chains

**Estimated yield:** 100-180 prospects per metro

---

### Med Spa / Cosmetic

**Apify:**
```
"med spa {metro}"
"medical spa {metro}"
"botox {metro}"
"laser hair removal {metro}"
"aesthetic clinic {metro}"
```

**Best filter:**
- Rating: 4.2-4.9 (luxury market expects high reviews)
- Reviews: 100+ (lower count = too new)
- Look for: own branding, professional photos
- Skip: hair salons that "also do botox"

**Estimated yield:** 50-120 prospects per metro (smaller market)

---

### Roofing / Solar

**Apify:**
```
"roofing {metro}"
"roof repair {metro}"
"residential roofing {metro}"
"roofing contractor {metro}"
"solar installation {metro}"
```

**Best filter:**
- Independent contractors (skip Tesla Solar, SunPower direct)
- Local presence: address in metro
- Reviews: 50+
- Look for: BBB accreditation in description (signals legit)
- Skip: any "storm chaser" patterns (no fixed address, recent reviews only)

**Estimated yield:** 100-200 prospects per metro

---

### Chiropractic / Wellness

**Apify:**
```
"chiropractor {metro}"
"chiropractic {metro}"
"chiropractic clinic {metro}"
"wellness chiropractor {metro}"
"sports chiropractor {metro}"
```

**Best filter:**
- 1-doctor practices (most chiros are solo)
- Reviews: 50-300
- Look for: "Dr. {Name} DC" branding
- Skip: large multi-location chains (The Joint, etc.)

**Estimated yield:** 80-150 prospects per metro

---

## Per-metro scrape priority

Based on density of high-margin SMBs + your existing geographic anchor (Texas):

### Tier 1 — Texas metros (start here, area-code advantage)

| Metro | Area codes | Why |
|---|---|---|
| Dallas-Fort Worth | 214, 469, 972, 817, 940 | Largest TX metro, highest SMB density |
| Houston | 281, 713, 832, 346 | Energy + healthcare = high revenue SMBs |
| Austin | 512, 737 | Growing rapidly, tech-forward owners |
| San Antonio | 210, 726 | Underserved, less competition |

### Tier 2 — Sunbelt expansion (no state income tax + warm climate = HVAC heavy)

| Metro | Area codes | Why |
|---|---|---|
| Phoenix, AZ | 602, 480, 623 | Heavy HVAC market, 110°F summers |
| Tampa, FL | 813, 727 | Growing retiree population |
| Las Vegas, NV | 702, 725 | High service demand, transient population |
| Atlanta, GA | 404, 678, 770, 470 | Largest SE metro, dense SMB |

### Tier 3 — Tier 2 secondary (after first 5 closes)

```
Charlotte NC | Nashville TN | Raleigh NC | Jacksonville FL | Denver CO
Salt Lake City UT | Oklahoma City OK | Memphis TN | Richmond VA
```

**Don't dial:** NYC, San Francisco, Boston, LA in Phase 0. Time-zone unfriendly + saturated competition.

---

## The Saturday list-build sequence (90 min)

```
0:00-0:10  Set up Apify account, fund $50 ($49 + buffer)
0:10-0:15  Pick top metro (Dallas)
0:15-0:25  Run scrape #1: HVAC Dallas (5-10 min)
0:25-0:35  Run scrape #2: Dental Dallas
0:35-0:45  Run scrape #3: Plumbing Dallas
0:45-0:55  Run scrape #4: Med spa Dallas
0:55-1:05  Run scrape #5: Roofing Dallas
1:05-1:30  Download all 5 CSVs, merge into one Google Sheet
            Filter to top 250 (highest review count, 4.0+ rating)
            Add columns: Vertical, Source, Audit Done, Outcome, etc.
            Sort by best to dial first
```

**Output:** 250 highly-curated Dallas SMB prospects across 5 verticals, ready to dial Monday.

---

## PhantomBuster alternative (subscription path)

If you anticipate scraping monthly:

**Tool:** [phantombuster.com](https://phantombuster.com) Google Maps Search Export
**Cost:** $69/mo (free trial: 14 days, 250 records)

**Search format:**
```
{vertical} in {metro}, USA
```

E.g., "HVAC in Dallas, TX, USA" → 250 records.

**Pros:** scheduled scrapes, runs in cloud, no local CPU.
**Cons:** more expensive long-term than Apify pay-per-run.

---

## Manual list building (zero budget)

If you can't spend $49 on Apify:

```
1. Open Google Maps in browser
2. Search: "HVAC near Dallas, TX"
3. For each result on the first 3 pages:
   a. Click → opens side panel
   b. Copy: name, phone, website, rating, address
   c. Paste into Google Sheet
4. Repeat for 5 verticals
5. Total time: 4-6 hours for 250 prospects
```

**Verdict:** if you have $49, USE APIFY. The 4-6 hours is worth way more than $49 in opportunity cost.

---

## Apollo.io free-tier email enrichment

Apify gives phone but rarely email. To get owner emails:

1. Free Apollo account (50 enrichment credits/mo)
2. Upload your list of business names/domains
3. Get back: owner name + email when available
4. Hit rate: ~30-50% for SMB

**Use case:** post-voicemail email follow-ups when you have email but not just phone.

---

## CRM column mapping (after scrape)

Copy CSV from Apify into Google Sheet with these columns:

```
Date Added | Business Name | Owner First Name | Phone | Email | Website |
City | State | Vertical | Source (Apify-Dallas-HVAC) | Rating | Reviews |
Audit Done? | Outcome | Disposition | Booking Date | Notes | Closed? | Cash
```

(Match your CRM template from CHEAT_SHEETS.md §8)

---

## Filtering rules (post-scrape, before dialing)

Apply these IN ORDER to your scraped CSV:

```
1. Has phone number — required
2. Has website — strong signal of professionalism
3. Rating between 3.8 and 4.7 — sweet spot
4. Review count between 30 and 300 — established but not too big
5. Not a known chain/franchise — skip Roto-Rooter, Aspen Dental, etc.
6. Phone area code matches their stated location — skip suspicious mismatches
7. Listed hours look reasonable — skip 24/7 operations (likely call centers)
8. Photos exist on listing — signals real, active business
```

This typically filters 250 raw scrapes down to 100-150 high-quality prospects.

---

## Top-30 hot list selection

From your filtered 100-150, pick the top 30 to dial Monday:

```
1. Highest revenue indicators (review count + rating + multiple services listed)
2. Active web presence (recent updates, modern site)
3. NOT an existing client of any AI agency (check website for "AI" mentions)
4. Phone has direct dial pattern (not 1-800)
5. Owner name discoverable on website "About" page (warmer call)
6. 4.0+ Google rating with active reviews in last 90 days
7. Mix of all 5 verticals you'll dial (not all HVAC)
```

Save these 30 in their own tab: "MONDAY HOT LIST"

---

## Refresh cadence

Lists go stale. Refresh schedule:

| Phase | Refresh | Why |
|---|---|---|
| Phase 0 | Every 4-6 weeks | New SMBs open, old ones close |
| Phase 1 | Monthly | VA can run scrapes |
| Phase 2 | Bi-weekly | Multiple metros, multiple verticals |

**Cost at Phase 1:** $49 × 4 metros × 5 verticals = $980/mo. Way cheaper than ZoomInfo.

---

## Anti-patterns (what NOT to do)

❌ Don't buy "1 million SMB lists" off Fiverr — usually scraped from old data, low conversion
❌ Don't use Yelp's API (too expensive, owners hate Yelp)
❌ Don't scrape LinkedIn — TOS violation, account ban risk
❌ Don't manually enrich beyond 100 — your time is more valuable
❌ Don't scrape into a CSV and never dial — momentum matters

---

## Sample CSV row (after Apify scrape, post-filter)

```csv
Business Name,Owner Name,Phone,Email,Website,City,State,Vertical,Rating,Reviews,Source
"Ace HVAC Services","Mike Johnson","(214) 555-0123","mike@acehvac.com","acehvac.com","Plano","TX","HVAC",4.6,87,"Apify-Dallas-HVAC-2026-04-26"
```

---

## Final pre-Monday verification

Saturday 8 PM, before you stop working:

```
[ ] Total prospects in CRM: 250+
[ ] Top-30 hot list flagged with audit pre-runs done
[ ] All phone numbers verified format (XXX) XXX-XXXX
[ ] All entries have city + state + vertical
[ ] Sheet shared to your iPhone for offline access
[ ] Backup CSV exported to Desktop folder
```

---

*The list is the moat in Week 1. A great list with a mediocre script beats a great script with a bad list. Spend the time Saturday — it pays back Monday.*

— v1, 2026-04-25
