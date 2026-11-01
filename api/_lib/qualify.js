// ─── Qualification: is this business actually trading, and how big is it? ────
// Everything here is derived from what Places returns. Where a signal is
// missing we say we don't know rather than assuming the flattering answer —
// a listing we can't date is "unknown", not "active".

/**
 * Typical ticket by trade, in dollars. Used only to size a revenue band, and
 * deliberately conservative — these are mid-market residential jobs, not
 * commercial contracts.
 */
const TICKET_BY_TRADE = [
  [/plastic surg/i, 6500],
  [/lawyer|attorney|law firm|law office/i, 3500],
  [/cpa|accountant|accounting|bookkeep|tax prepar/i, 2200],
  [/orthodont|oral surg|periodont|cosmetic dent/i, 2800],
  [/wealth management|financial advis/i, 2500],
  [/mortgage/i, 3000],
  [/real estate|realtor/i, 5000],
  [/architect/i, 6000],
  [/interior design/i, 3500],
  [/dermatolog/i, 400],
  [/physical therap/i, 160],
  [/therap|psycholog|counsel|mental health/i, 180],
  [/audiolog/i, 250],
  [/insurance agency|insurance agent/i, 900],
  [/roof/i, 9000], [/foundation|underpin/i, 8000], [/solar/i, 15000],
  [/remodel|renovat/i, 12000], [/window|siding/i, 6000], [/paving|driveway/i, 5000],
  [/hvac|air condition|heating|furnace/i, 900], [/water damage|restoration|mold/i, 3500],
  [/septic|well drilling/i, 2200], [/fence|fencing/i, 3500], [/concrete/i, 4000],
  [/flooring/i, 3800], [/painting|painter/i, 3000], [/pool/i, 350],
  [/plumb|drain|water heater/i, 500], [/electric/i, 550],
  [/garage door/i, 700], [/appliance/i, 280], [/locksmith/i, 180],
  [/pest|exterminat/i, 220], [/landscap|lawn|tree service/i, 400],
  [/clean/i, 200], [/junk removal|moving/i, 600], [/chimney|gutter/i, 350],
  [/tow/i, 150], [/auto|mechanic|transmission|body shop/i, 800],
  [/dentist|dental/i, 600], [/chiropract/i, 120], [/med spa|medspa/i, 350],
  [/vet|animal/i, 250], [/optometr|eye/i, 300],
];

function ticketFor(typeText, name) {
  const hay = `${typeText || ''} ${name || ''}`;
  for (const [re, amount] of TICKET_BY_TRADE) if (re.test(hay)) return amount;
  return 400; // generic local service
}

/**
 * Read the review stream for evidence of life.
 * Places returns the 5 most recent reviews with publishTime.
 */
function reviewActivity(p) {
  const reviews = Array.isArray(p.reviews) ? p.reviews : [];
  const times = reviews.map(r => Date.parse(r.publishTime)).filter(Number.isFinite).sort((a, b) => b - a);
  if (!times.length) return { known: false };

  const now = Date.now();
  const DAY = 86_400_000;
  const daysSinceNewest = Math.round((now - times[0]) / DAY);

  // Reviews per month, measured across the sample we actually have. With a
  // single review there's no span to measure, so we don't guess a rate.
  let perMonth = null;
  if (times.length >= 2) {
    const spanDays = Math.max(1, (times[0] - times[times.length - 1]) / DAY);
    perMonth = (times.length - 1) / (spanDays / 30.44);
  }

  return { known: true, daysSinceNewest, sampleSize: times.length, perMonth };
}

/**
 * Liveness verdict. The point is to stop the operator dialling businesses
 * that closed two years ago but still have a tidy Maps listing.
 */
export function assessActivity(p) {
  if (p.businessStatus && p.businessStatus !== 'OPERATIONAL') {
    return { level: 'closed', label: 'Permanently closed', confidence: 'high',
      why: `Google lists this as ${String(p.businessStatus).toLowerCase().replace(/_/g, ' ')}.`, callable: false };
  }

  const a = reviewActivity(p);
  const openNow = p.regularOpeningHours?.openNow;
  const hasHours = (p.regularOpeningHours?.weekdayDescriptions || []).length > 0;

  if (!a.known) {
    // No dated reviews at all. Total count still tells us something.
    const total = p.userRatingCount ?? 0;
    if (total === 0) {
      return { level: 'unproven', label: 'No reviews yet', confidence: 'low',
        why: 'No reviews at all, so there is no evidence either way about how busy they are.', callable: true };
    }
    return { level: 'unknown', label: 'Activity unknown', confidence: 'low',
      why: `${total} reviews on file but none dated, so recency cannot be checked.`, callable: true };
  }

  const d = a.daysSinceNewest;
  const rate = a.perMonth;
  const base = { daysSinceNewest: d, reviewsPerMonth: rate != null ? Number(rate.toFixed(1)) : null };
  const rateNote = rate != null ? ` about ${rate < 1 ? rate.toFixed(1) : Math.round(rate)} review${rate >= 1.5 ? 's' : ''}/month recently` : '';

  if (d <= 45) {
    return { ...base, level: 'active', label: 'Actively trading', confidence: 'high',
      why: `Newest review is ${d} day${d === 1 ? '' : 's'} old${rateNote}.`
        + (hasHours && openNow != null ? ` Hours published and currently ${openNow ? 'open' : 'closed'}.` : ''),
      callable: true };
  }
  if (d <= 180) {
    return { ...base, level: 'steady', label: 'Trading, quieter', confidence: 'medium',
      why: `Newest review is ${Math.round(d / 30)} months old${rateNote}. Still operating, lower volume.`, callable: true };
  }
  if (d <= 540) {
    return { ...base, level: 'slowing', label: 'Little recent activity', confidence: 'medium',
      why: `No review in ${Math.round(d / 30)} months. Worth confirming they're still taking work.`, callable: true };
  }
  return { ...base, level: 'stale', label: 'Possibly inactive', confidence: 'medium',
    why: `No review in over ${Math.floor(d / 365)} year${d >= 730 ? 's' : ''}. Verify before spending time on it.`,
    callable: false };
}

/**
 * Revenue band from review throughput.
 *
 * The chain is: reviews/month -> customers/month -> revenue/month. Only a
 * small share of customers ever leave a review; 3% is the widely used figure
 * for local services, and we bracket it at 2-6% to produce a range rather
 * than a single number we can't defend.
 *
 * Returns null when we can't measure a rate — an invented figure is worse
 * than an empty field, because the operator will quote it.
 */
export function estimateRevenue(p) {
  const a = reviewActivity(p);
  if (!a.known || a.perMonth == null || a.perMonth <= 0) return null;

  const act = assessActivity(p);
  if (act.level === 'closed' || act.level === 'stale') return null;

  const ticket = ticketFor(p.primaryTypeDisplayName?.text, p.displayName?.text);
  const REVIEW_RATE_HIGH = 0.06;   // 6% of customers review -> fewer customers
  const REVIEW_RATE_LOW = 0.02;    // 2% review -> more customers

  const customersLow = a.perMonth / REVIEW_RATE_HIGH;
  const customersHigh = a.perMonth / REVIEW_RATE_LOW;

  // Clamp. A handful of listings carry an implausible review rate — solicited
  // in bulk, or aggregating several locations — and the naive multiplication
  // then reports $384K/month for a suburban plumber. We sell to owner-operated
  // single locations; above roughly $250K/month this stops being that, and a
  // number the operator can't say out loud is worse than a wider band.
  const CEILING = 250_000;
  const monthlyLow = Math.min(CEILING, Math.round(customersLow * ticket));
  const monthlyHigh = Math.min(CEILING, Math.round(customersHigh * ticket));
  const clamped = customersHigh * ticket > CEILING;

  return {
    monthlyLow, monthlyHigh,
    annualLow: monthlyLow * 12, annualHigh: monthlyHigh * 12,
    ticket,
    reviewsPerMonth: Number(a.perMonth.toFixed(1)),
    customersPerMonthLow: Math.round(customersLow),
    customersPerMonthHigh: Math.round(customersHigh),
    clamped,
    confidence: clamped ? 'low' : (a.sampleSize >= 4 && act.level === 'active' ? 'medium' : 'low'),
    // Shown in the UI so the operator can defend or discard it on the call.
    basis: `${a.perMonth.toFixed(1)} reviews/month × ~${ticket.toLocaleString('en-US')} typical job, `
      + `assuming 2-6% of customers leave a review. Estimate from public signals only.`
      + (clamped ? ' Capped — the review rate implies multiple locations or solicited reviews.' : ''),
  };
}

// ─── Receptionist qualification ─────────────────────────────────────────────
// Can we tell whether a business needs an AI receptionist without ringing them?
//
// Yes, from published hours. Places returns structured `periods` with exact
// open and close times per day, so the hours nobody is answering are simple
// arithmetic — no guessing, no calling the number and no assuming.
//
// The honest boundaries matter more than the pitch here:
//   - Publishes limited hours  -> we can state exactly how many hours a week
//                                 go unanswered. This is the sale.
//   - Claims 24/7              -> they already have cover of some kind. We do
//                                 NOT claim they need us; it becomes a question
//                                 to ask, not a gap to assert.
//   - Publishes nothing        -> unknown. Say unknown.
//
// Trade matters too: a burst pipe at 2am converts, a chiropractor enquiry at
// 2am waits until morning. Both leak, but only one is urgent.
const EMERGENCY_TRADE = /plumb|hvac|air condition|heating|electric|water damage|flood|restoration|locksmith|garage door|towing|tow truck|roof|sewer|drain|mold|glass|lock/i;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function assessReceptionist(p) {
  const hours = p.regularOpeningHours;
  const periods = Array.isArray(hours?.periods) ? hours.periods : [];
  const typeText = `${p.primaryTypeDisplayName?.text || ''} ${p.displayName?.text || ''}`;
  const isEmergency = EMERGENCY_TRADE.test(typeText);
  const hasPhone = !!(p.nationalPhoneNumber || p.internationalPhoneNumber);

  if (!periods.length) {
    return {
      qualified: false,
      confidence: 'none',
      label: 'Hours not published',
      why: 'No opening hours on the listing, so there is no way to tell from here how much of the week goes unanswered. Ask on the call.',
      isEmergency,
    };
  }

  // A period with no close, or one spanning the whole week, means 24/7.
  const alwaysOpen = periods.some(x => !x.close)
    || periods.some(x => x.open?.day === 1 && x.open?.hour === 0 && x.close?.day === 6 && x.close?.hour === 0);

  if (alwaysOpen) {
    return {
      qualified: false,
      confidence: 'high',
      label: 'Listed as open 24/7',
      why: hasPhone
        ? 'They advertise round-the-clock cover, so the after-hours argument does not land as stated. '
          + 'Worth asking who actually picks up at 2am — an answering service they already pay for is a cost we replace, '
          + 'and "it rings my mobile" is a person we can give their evenings back.'
        : 'They advertise round-the-clock cover but publish no number to call.',
      openHoursPerWeek: 168,
      uncoveredHoursPerWeek: 0,
      isEmergency,
    };
  }

  // Sum the published open hours across the week.
  let openMinutes = 0;
  const openDays = new Set();
  for (const per of periods) {
    const o = per.open, c = per.close;
    if (!o || !c) continue;
    openDays.add(o.day);
    let mins = ((c.day - o.day + 7) % 7) * 1440 + (c.hour * 60 + (c.minute || 0)) - (o.hour * 60 + (o.minute || 0));
    if (mins <= 0) mins += 7 * 1440;          // wraps past midnight
    openMinutes += Math.min(mins, 7 * 1440);
  }

  const openHours = Math.round(openMinutes / 60);
  const uncovered = Math.max(0, 168 - openHours);
  const closedDays = DAY_NAMES.filter((_, i) => !openDays.has(i));
  const pctUncovered = Math.round((uncovered / 168) * 100);

  // Below roughly 100 hours a week there is a real gap worth naming. Above it
  // they are close enough to always-on that the pitch weakens.
  const qualified = uncovered >= 40;

  return {
    qualified,
    confidence: 'high',
    label: qualified
      ? `Unreachable ${uncovered}h a week`
      : `Open ${openHours}h a week — good cover`,
    openHoursPerWeek: openHours,
    uncoveredHoursPerWeek: uncovered,
    pctUncovered,
    closedDays,
    isEmergency,
    why: qualified
      ? `Open ${openHours} hours a week, so ${uncovered} hours — ${pctUncovered}% of it — nobody is answering`
        + (closedDays.length ? `, including all day ${closedDays.length > 2 ? `${closedDays.length} days` : closedDays.join(' and ')}` : '')
        + (isEmergency
            ? '. This is an emergency trade: the customer with a burst pipe at midnight rings the next name on the list.'
            : '. Enquiries landing outside those hours wait until morning, by which point they have usually called someone else.')
      : `Open ${openHours} hours a week, so only ${uncovered} go unanswered. The after-hours gap is small — lead with something else.`,
  };
}
