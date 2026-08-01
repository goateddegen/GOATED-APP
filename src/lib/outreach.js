// =============================================================================
// GOATED — Per-business outreach strategy
// -----------------------------------------------------------------------------
// Shared by LeadsPage (row expander) and LeadDetail (full call sheet) so both
// say the same thing about a given business.
//
// Everything here is derived from fields Apollo actually returns. When a signal
// is missing we say less rather than inventing it — no generic SaaS filler.
// =============================================================================

// ─── Per-business outreach strategy ─────────────────────────────────────────
// Derived from the record's ACTUAL signals rather than a fixed template. The
// old version greeted a company as a person ("Hi Titus" for Titus HVAC) and
// said the same thing to a 4-person plumber and a 300-person manufacturer.
//
// Everything below keys off fields Apollo really returns: headcount, revenue,
// web/LinkedIn presence, 12-month growth, intent, keywords, founding year.
// If a signal is missing we say less rather than inventing it.

/** Concrete gaps we can name on the call, straight from the record. */
export function deriveGaps(lead) {
  const gaps = [];
  if (!lead.website && !lead.domain) {
    gaps.push({ key: 'no-site', label: 'No website on file', angle: 'They are invisible to search — every lead comes from referral or luck.' });
  }
  // Only meaningful for a company that would plausibly have one. A two-truck
  // plumber has no LinkedIn and does not care, so this fired on every local
  // lead and buried the gaps that actually matter.
  const isLocalOperator = lead.lead_source === 'Google Places' || lead._source === 'places'
    || (!lead.employees && lead.reviewCount != null);
  if (!lead.linkedin_url && !isLocalOperator) {
    gaps.push({ key: 'no-linkedin', label: 'No LinkedIn presence', angle: 'No employer brand — hiring and credibility both suffer.' });
  }
  if (!lead.phone) {
    gaps.push({ key: 'no-phone', label: 'No published phone', angle: 'If we cannot find a number quickly, neither can their customers.' });
  }
  const growth = lead.momentum;
  if (growth === 'declining') {
    gaps.push({ key: 'shrinking', label: 'Headcount shrinking', angle: 'Doing more with fewer people — automation lands well right now.' });
  } else if (growth === 'rising') {
    gaps.push({ key: 'growing', label: 'Headcount growing', angle: 'Growing fast; intake is usually the first thing to break.' });
  }
  if (lead.foundedYear && new Date().getFullYear() - lead.foundedYear <= 5) {
    gaps.push({ key: 'young', label: `Founded ${lead.foundedYear}`, angle: 'Young business still building repeatable lead flow.' });
  }
  // Review signals ride along on every Places lead and are the strongest local
  // angle we have, but this only looked at Apollo-shaped fields — so a business
  // with 4.9 stars and six reviews showed no gap at all.
  const reviews = lead.reviewCount;
  const rating = lead.rating;
  if (reviews === 0) {
    gaps.push({ key: 'no-reviews', label: 'No reviews at all', angle: 'Invisible in local ranking — review generation is the fastest lever here.' });
  } else if (typeof reviews === 'number' && reviews < 25) {
    gaps.push({
      key: 'thin-reviews',
      label: rating ? `Only ${reviews} reviews at ${rating}★` : `Only ${reviews} reviews`,
      angle: rating && rating >= 4
        ? 'Customers are happy but nobody is asking them to say so — competitors outrank them on volume alone.'
        : 'Too little social proof to win a comparison.',
    });
  }
  if (typeof rating === 'number' && rating > 0 && rating < 4 && reviews > 5) {
    gaps.push({
      key: 'low-rating',
      label: `${rating}★ average`,
      angle: 'Rating is actively costing them calls. Fixing follow-up matters more than more traffic.',
    });
  }
  return gaps;
}

/** Which tier to pitch, from headcount and revenue — mirrors PRICING.tiers. */
export function recommendTier(lead) {
  const emp = lead.employees || 0;
  const rev = lead.revenue || 0;
  if (emp > 200 || rev >= 10_000_000) {
    return { id: 'growth', label: 'Growth Engine', price: '$10–20K setup + $2.5–5K/mo',
      why: `${emp ? `${emp} staff` : 'Larger org'}${rev ? ` · ${lead.revenueFormatted || ''} revenue` : ''} — multi-location or high call volume.` };
  }
  if (emp >= 10 || rev >= 1_000_000) {
    return { id: 'local', label: 'Local Engine', price: '$2,000 setup + $750/mo',
      why: `${emp ? `${emp} staff` : 'SMB'} — classic missed-call recovery profile.` };
  }
  return { id: 'starter', label: 'Local Engine (starter)', price: '$2,000 setup + $750/mo',
    why: 'Very small team — owner likely answers the phone themselves. Lead with time saved, not headcount.' };
}

/**
 * Build a channel-by-channel plan for this specific business.
 * Email is intentionally absent — outreach is phone-first and manual for now.
 */
export function buildOutreachStrategy(lead) {
  const biz = lead.company || lead.name || 'this business';
  const industry = lead.industry && lead.industry !== 'Unknown' ? lead.industry : null;
  const where = lead.location ? ` in ${lead.location}` : '';
  const gaps = deriveGaps(lead);
  const tier = recommendTier(lead);
  const lead_gap = gaps[0];

  // Channel priority follows what contact data actually exists.
  const channels = [];
  if (lead.phone) channels.push('call');
  channels.push('sms');
  if (lead.linkedin_url) channels.push('linkedin');

  const hook = lead_gap
    ? lead_gap.angle
    : `${industry ? `${industry} operators${where}` : `Businesses${where}`} usually leak most revenue on calls nobody picks up.`;

  return {
    business: biz,
    tier,
    gaps,
    primaryChannel: channels[0],
    channels,
    // Opening line for a live call — addressed to whoever answers, not a
    // fabricated first name.
    call: `Hi, is the owner or manager around? — I'm calling about ${biz}. ${hook} `
      + `We set up an AI receptionist that answers in under 60 seconds and books the job. `
      + `Worth two minutes?`,
    sms: `Hi — reaching out about ${biz}. ${hook} `
      + `We can have missed calls answered and booked automatically within 14 days. Want the details?`,
    linkedin: lead.linkedin_url
      ? `Hi — I work with ${industry ? `${industry} businesses` : 'local service businesses'}${where}. `
        + `${hook} Happy to share what we did for similar operators. Worth a conversation?`
      : null,
    // What to actually say once they engage.
    talkingPoints: [
      lead.employees ? `Team of ${lead.employees} — ask who covers the phone after hours.` : 'Ask how calls are handled after hours.',
      lead.revenueFormatted ? `Revenue around ${lead.revenueFormatted} — size the leak against that.` : 'Ask their average job value to size the leak.',
      ...gaps.slice(0, 2).map(g => g.angle),
      `Pitch: ${tier.label} — ${tier.price}.`,
    ].filter(Boolean),
  };
}

// ─── Cold-call sheet ────────────────────────────────────────────────────────
// A full script built from this business's own record. Replaces the previous
// hardcoded fallbacks ("Pipeline acceleration", "Core CRM", "Email automation"),
// which were generic B2B-SaaS filler and made no sense for an HVAC contractor.
//
// Nothing here is invented: every number traces to a field on the lead, and any
// section without supporting data is omitted rather than padded.

const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;

/**
 * Missed-call revenue estimate. Deliberately conservative and fully shown so
 * the operator can defend it on the phone rather than quoting a black box.
 * Returns null when we lack the inputs to compute it honestly.
 */
export function estimateMissedCallLoss(lead) {
  const emp = lead.employees;
  if (!emp) return null;

  // The model only holds for a phone-driven local service operation. Above a
  // certain size a business has a call centre, multiple locations, or simply
  // doesn't sell over the phone — extrapolating headcount linearly produced
  // absurdities (a 150-staff publisher "losing $96,188/mo"). Cap the crew size
  // the estimate is built from and frame it as a single location.
  const CREW_CAP = 40;
  const crew = Math.min(emp, CREW_CAP);
  const capped = emp > CREW_CAP;

  const callsPerMonth = Math.round(crew * 12);
  const missedRate = 0.22;             // typical unanswered / after-hours share
  const closeRate = 0.35;              // of answered calls that become jobs
  // Per-job value from revenue-per-head where we have it, clamped to a range a
  // local service ticket can plausibly sit in.
  const ticket = lead.revenue && emp
    ? Math.min(1200, Math.max(180, Math.round((lead.revenue / emp) / 240)))
    : 320;

  const monthly = callsPerMonth * missedRate * closeRate * ticket;
  return {
    monthly,
    annual: monthly * 12,
    formatted: money(monthly),
    annualFormatted: money(monthly * 12),
    capped,
    // Shown in the UI so the operator can defend the number on the call.
    basis: `${callsPerMonth} calls/mo (est. from ${capped ? `${CREW_CAP} of ${emp} staff — single location` : `${emp} staff`}) `
      + `× ${Math.round(missedRate * 100)}% missed × ${Math.round(closeRate * 100)}% close × ${money(ticket)} avg job`,
  };
}

/** Objections worth pre-empting, chosen by what this record actually shows. */
export function buildObjections(lead) {
  const biz = lead.company || lead.name || 'you';
  const loss = estimateMissedCallLoss(lead);
  const out = [];

  out.push({
    objection: 'We already answer our phones',
    response: loss
      ? `Most owners think so. ${loss.basis} — that's ${loss.formatted}/mo walking. We can measure it for free: we track your missed calls for two weeks, and if the number is zero you owe nothing.`
      : `Most owners think so until they see the after-hours log. We'll track missed calls for two weeks free — if it's zero, you owe nothing.`,
  });

  out.push({
    objection: "It's too expensive",
    response: loss
      ? `Setup is $2,000 and $750/mo. You're losing roughly ${loss.formatted}/mo right now. It pays for itself if it recovers three jobs.`
      : `Setup is $2,000 and $750/mo. It pays for itself the moment it recovers a handful of jobs — and there's a 30-day refund.`,
  });

  if (!lead.website && !lead.domain) {
    out.push({
      objection: 'We get all our work by referral',
      response: `That's exactly why this matters — with no website, referral calls are your only channel. Every one that rings out is gone for good, because there's nowhere else for them to find you.`,
    });
  }

  if (lead.momentum === 'rising') {
    out.push({
      objection: "We're too busy right now",
      response: `That's the reason, not the objection. You're growing — intake is the first thing that breaks. This is a 14-day setup that takes work off your plate, not adds to it.`,
    });
  }

  return out;
}

/** Discovery questions tailored to what we don't yet know about this business. */
export function buildDiscovery(lead) {
  const q = [
    'Who picks up when a customer calls at 6pm or on a Saturday?',
    'Roughly how many calls come in on a normal week?',
    "What's a typical job worth to you?",
  ];
  if (!lead.website && !lead.domain) q.push('Where do most of your new customers find you today?');
  if (lead.employees && lead.employees > 50) q.push('Is that one central number, or does each location take its own calls?');
  if (lead.momentum === 'rising') q.push("You've been hiring — is booking keeping up with the extra crew?");
  return q;
}

/**
 * Full cold-call sheet for one business. Every section is grounded in the
 * record; `loss` is null when we can't compute it, and the UI should say so
 * rather than showing a made-up figure.
 */
export function buildCallSheet(lead) {
  const strategy = buildOutreachStrategy(lead);
  const loss = estimateMissedCallLoss(lead);
  const biz = lead.company || lead.name || 'this business';

  return {
    ...strategy,
    loss,
    opener: strategy.call,
    discovery: buildDiscovery(lead),
    pitch: loss
      ? `Based on a team your size, you're likely losing around ${loss.formatted} a month to calls that never get answered. We put an AI receptionist on your line — it picks up in under 60 seconds, qualifies the caller, books the job, and texts you the transcript. Live in 14 days.`
      : `We put an AI receptionist on your line — picks up in under 60 seconds, qualifies the caller, books the job, texts you the transcript. Live in 14 days, and you keep your existing number.`,
    close: `If I set up a two-week measurement on your line at no cost and it shows you're not missing calls, we're done and it cost you nothing. If it shows otherwise, we talk. Fair?`,
    objections: buildObjections(lead),
  };
}

// ─── What to sell this specific business ────────────────────────────────────
// Priced off PRICING in lib/config.js, assembled from the gaps the record
// actually shows. Two signals dominate for a local operator:
//
//   no website   — they are invisible outside Maps, and there is nowhere for a
//                  lead to land. Highest-value build, so it leads the package.
//   no reception — nobody answers after hours, so demand they already paid to
//                  create rings out. This is the retainer line.
//
// Everything carries an explicit deposit and monthly so the operator can quote
// on the call without opening another tab.
export function buildPackage(lead) {
  const items = [];
  const noWebsite = !lead.website && !lead.domain;
  const reviews = lead.reviewCount;
  const thinReviews = typeof reviews === 'number' && reviews > 0 && reviews < 25;
  const noReviews = reviews === 0;

  if (noWebsite) {
    items.push({
      name: 'Website build + lead capture',
      why: 'No site on file — every enquiry has to arrive by phone or Maps, and anything after hours is gone.',
      deposit: 2000,
      monthly: 250,
      priority: 'P0',
    });
  }

  // The core offer. Pitched to everyone, because a local operator without an
  // after-hours answer is the norm rather than the exception.
  items.push({
    name: 'AI receptionist — missed-call recovery',
    why: lead.phone
      ? 'Answers in under 60 seconds, qualifies the caller, books the job, texts you the transcript.'
      : 'No published number, so there is no reliable way for a customer to reach them at all.',
    deposit: 2000,
    monthly: 750,
    priority: 'P0',
  });

  if (noReviews || thinReviews) {
    items.push({
      name: 'Review engine',
      why: noReviews
        ? 'No reviews at all — effectively invisible in local ranking.'
        : `Only ${reviews} reviews. Competitors outrank them on volume, not quality.`,
      deposit: 1500,
      monthly: 300,
      priority: 'P1',
    });
  }

  const deposit = items.reduce((a, i) => a + i.deposit, 0);
  const monthly = items.reduce((a, i) => a + i.monthly, 0);

  return {
    items,
    deposit,
    monthly,
    // What actually lands in month one — the number that matters on the call.
    firstMonth: deposit + monthly,
    year1: deposit + monthly * 12,
    headline: noWebsite
      ? 'No website + no after-hours answer — build and phone cover together'
      : 'Missed-call recovery, live in 14 days',
  };
}
