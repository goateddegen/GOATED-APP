// =============================================================================
// GOATED — Per-business pricing (server copy)
// -----------------------------------------------------------------------------
// Every quote in this app used to be $2,000 deposit + $750/mo, hardcoded in five
// places. That number was quoted identically to a foundation-repair company the
// app estimates at $63-189K/mo and to a well-drilling outfit it estimates at
// $1-3K/mo. For the second one it is roughly a year of profit for a phone
// service, which is why it does not survive contact with an owner.
//
// Price is now derived from the business. Two anchors, both from data we already
// hold:
//
//   revenueEstimate  — what they turn over, inferred from review pace against a
//                      typical ticket for the trade.
//   ticketRange      — Google's own observed price range for the business, when
//                      it publishes one. This is the honest anchor: a service
//                      that costs less than one recovered job is an easy yes.
//
// Mirrors src/lib/pricing.js — api/ and src/ are separate bundles, so the two
// are duplicated on purpose. Keep them in step.
//
// POLICY LIVES IN THESE TWO FILES AND NOWHERE ELSE. Change these constants and every script,
// quote, chat answer and package in the app moves with them.
// =============================================================================

export const PRICING = {
  // Share of estimated monthly revenue a single vendor can credibly ask for.
  // Local service businesses run marketing at roughly 5-10% of revenue in total;
  // one service inside that is a slice, not the whole thing.
  monthlyShareOfRevenue: 0.02,
  // Floors exist because below them the work is not worth doing. Caps exist
  // because past them you are talking to a procurement process, not an owner.
  minMonthly: 250,
  maxMonthly: 1200,
  // Setup as a multiple of the monthly. Kept deliberately low: the deposit is
  // the thing that kills a cold deal, and recurring is where the value is.
  depositMultiple: 1.5,
  // Floor raised deliberately. Below roughly $550 the setup does not cover the
  // work, and a very cheap unsolicited quote reads as scam-adjacent to a wary
  // owner rather than as a bargain — cheap is not the same as credible.
  minDeposit: 550,
  maxDeposit: 2500,
  // A site build is real one-off work, so it carries its own floor.
  websiteBuildFloor: 850,
  roundTo: 50,
};

const round = (n, to = PRICING.roundTo) => Math.max(to, Math.round(n / to) * to);
const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

/** Midpoint of the revenue estimate, or null when we have no basis to guess. */
function monthlyRevenue(lead) {
  const r = lead?.revenueEstimate;
  if (!r?.monthlyLow || !r?.monthlyHigh) return null;
  return (r.monthlyLow + r.monthlyHigh) / 2;
}

/**
 * What this specific business should be quoted.
 *
 * Returns nulls rather than a guess when there is nothing to base a number on —
 * callers should say "priced on the call" instead of inventing one, which is the
 * whole reason the flat rate was wrong.
 */
export function priceFor(lead, { includesBuild = false } = {}) {
  const rev = monthlyRevenue(lead);
  const ticket = lead?.ticketRange || null;

  if (!rev) {
    return { monthly: null, deposit: null, basis: 'unknown', jobsToBreakEven: null, ticket };
  }

  const monthly = round(clamp(rev * PRICING.monthlyShareOfRevenue, PRICING.minMonthly, PRICING.maxMonthly));

  let deposit = round(clamp(monthly * PRICING.depositMultiple, PRICING.minDeposit, PRICING.maxDeposit));
  if (includesBuild) deposit = round(Math.max(deposit, PRICING.websiteBuildFloor));

  // How many recovered jobs cover a month. This is the sentence that closes:
  // "it costs less than one job." Uses their own observed ticket where Google
  // publishes one, and the trade average otherwise.
  const jobValue = ticket ? (ticket.low + ticket.high) / 2 : null;
  const jobsToBreakEven = jobValue ? Math.max(1, Math.round(monthly / jobValue)) : null;

  return { monthly, deposit, basis: ticket ? 'revenue+ticket' : 'revenue', jobsToBreakEven, ticket, jobValue };
}

/** "$850 to set up, then $250/mo" — or an honest hedge when we cannot price it. */
export function quoteLine(lead, opts) {
  const p = priceFor(lead, opts);
  if (!p.monthly) return 'Priced on the call — not enough public signal to quote blind.';
  const money = (n) => `$${n.toLocaleString('en-US')}`;
  const base = `${money(p.deposit)} to set up, then ${money(p.monthly)}/mo`;
  return p.jobsToBreakEven
    ? `${base} — about ${p.jobsToBreakEven === 1 ? 'one recovered job' : `${p.jobsToBreakEven} recovered jobs`} a month`
    : base;
}

/**
 * Why this number — in a sentence you can say out loud.
 *
 * A quote you cannot justify is a quote you discount the moment it is pushed on.
 * This gives the operator the reasoning, built from the same signals the price
 * was built from, so "why is it that much" has an answer that is about their
 * business rather than about our rate card.
 */
export function priceRationale(lead, opts) {
  const p = priceFor(lead, opts);
  if (!p.monthly) {
    return 'No public revenue signal on this listing, so quote after you have heard their numbers rather than guessing.';
  }
  const money = (n) => `$${n.toLocaleString('en-US')}`;
  const parts = [];

  const rev = lead?.revenueFormatted;
  if (rev) parts.push(`Sized to an estimated ${rev} of turnover`);
  else parts.push('Sized to their estimated turnover');

  if (p.ticket) {
    parts.push(`their own listed jobs run ${money(p.ticket.low)}–${money(p.ticket.high)}, so ${money(p.monthly)}/mo is ${p.jobsToBreakEven === 1 ? 'under one recovered job' : `about ${p.jobsToBreakEven} recovered jobs`}`);
  }

  if (opts?.includesBuild) {
    parts.push(`the ${money(p.deposit)} covers the build itself, which is one-time`);
  } else {
    parts.push(`the ${money(p.deposit)} is setup only — the recurring is where the work is`);
  }

  return parts.join('; ') + '.';
}
