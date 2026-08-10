// =============================================================================
// GOATED — Google Places (New) prospecting layer
// -----------------------------------------------------------------------------
// Apollo is a firmographic database: it knows headcount and revenue, and it is
// biased toward companies with a corporate footprint. Searching it for "HVAC"
// returns Samsung HVAC America and Inc. Magazine because those are the entities
// it has good data on — not the ten-person shop three suburbs over.
//
// Places indexes the physical world instead, so it returns the actual local
// operator. Two things it carries that Apollo does not:
//
//   userRatingCount — the opening line. "You have 11 reviews, the company
//                     outranking you has 240" is concrete, verifiable, and
//                     immediately uncomfortable in a useful way.
//   websiteUri      — absent for a real share of small operators, which is the
//                     strongest possible signal for a web/AI engagement.
//
// So: Places finds and qualifies, Apollo enriches with firmographics, and
// _lib/contacts.js digs out the human. Different jobs.
//
// This module is NOT a serverless function (underscore prefix = excluded).
// =============================================================================

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

// Ask only for what we use — Places bills by field mask, so a lazy '*' here is
// a direct cost increase per request.
import { assessActivity, estimateRevenue, assessReceptionist } from './qualify.js';

const FIELDS = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.shortFormattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'places.primaryTypeDisplayName',
  'places.googleMapsUri',
  'places.location',
  // Qualification signals. `reviews` is the important one: it carries
  // publishTime for the 5 most recent, which is the only direct evidence
  // Places gives us that a business is still trading. A listing with a
  // review from last week is a live operation; one whose newest is from
  // 2021 is a dead contact that still looks fine on paper.
  //
  // NOTE ON BILLING: places.reviews moves Text Search from the Pro SKU to
  // Enterprise+Atmosphere ($32 -> $35 per 1,000). The $200/month free credit
  // still covers roughly 5,700 requests, and we issue ~5 per leads page load.
  'places.reviews',
  'places.regularOpeningHours',
  // priceLevel rides in the same SKU we already pay for via reviews, and it
  // sizes the pitch: a very-expensive operator loses more per missed call.
  'places.priceLevel',
  // Photos are a Pro-tier field, and `reviews` above has already moved this
  // request to Enterprise+Atmosphere — so asking for them adds nothing to the
  // search bill. Fetching the image bytes is a separate SKU; that happens on
  // demand through the photo proxy, one image per lead, not per result.
  'places.photos',
  // All three below are already inside the SKU `reviews` put us in, so they add
  // nothing to the bill. Verified populated against real trade searches before
  // being added — see the notes on each.
  //
  // 10/10 populated. Carries writeAReviewUri, which is not just a signal but a
  // deliverable: the link a client sends customers to get reviewed.
  'places.googleMapsLinks',
  // ~60% populated on trades, and it is Google's own observed ticket range for
  // the business. Better than inferring spend from a trade average.
  'places.priceRange',
  // 10/10. Their local clock, so the call window is a fact rather than a guess.
  'places.utcOffsetMinutes',
  'nextPageToken',
].join(',');

const key = () => process.env.GOOGLE_PLACES_API_KEY || '';
export const placesConfigured = () => !!key();

/**
 * Rank by how much this business NEEDS the offer, and how likely the owner is to
 * be the one who answers — not by how impressive the business is.
 *
 * Rewritten after a day of cold calls returned nothing. The previous version
 * rewarded rating and review volume as "demand you can scale", which sounds
 * right and is backwards: it surfaced 4.9-star operators with 118 reviews, a
 * working website and a phone that gets answered. Those businesses have no
 * problem to sell against, so the call dies in the first ten seconds.
 *
 * Two independent things are being measured, and conflating them was the bug:
 *
 *   reachable — will a human answer and can they decide? A dead listing wastes
 *               the call no matter how good the gap looks.
 *   need      — is something visibly broken that we sell the fix for?
 *
 * A business must clear the reachability bar to appear at all; among those that
 * do, need decides the order.
 */
function scorePlace(p) {
  const reviews = p.userRatingCount ?? 0;
  const rating = p.rating ?? 0;
  const act = assessActivity(p);
  const photos = Array.isArray(p.photos) ? p.photos.length : 0;
  const hasPhone = !!(p.nationalPhoneNumber || p.internationalPhoneNumber);

  // ── Reachability: can this call go anywhere at all? ──────────────────────
  let reach = 50;
  if (hasPhone) reach += 25;
  if (p.businessStatus && p.businessStatus !== 'OPERATIONAL') reach -= 60;
  // Trading recently means someone is there to pick up. Note this is NOT a
  // measure of need — a busy shop is easy to reach and hard to sell.
  if (act.level === 'active') reach += 15;
  else if (act.level === 'steady') reach += 10;
  else if (act.level === 'slowing') reach -= 5;
  else if (act.level === 'stale') reach -= 30;   // probably gone
  // Past a few hundred reviews there is a marketing manager, an agency on
  // retainer and a procurement process. The owner no longer answers the phone,
  // and nobody signs on a first call.
  if (reviews > 2000) reach -= 45;
  else if (reviews > 800) reach -= 30;
  else if (reviews > 300) reach -= 15;

  // ── Need: what is visibly broken that we sell the fix for? ───────────────
  let need = 0;
  // Nowhere to capture anything that does not phone. Still the strongest signal.
  if (!p.websiteUri) need += 40;
  // Invisible in local ranking, and they know it. This is the segment that
  // actually buys: enough of a business to have money, not enough presence to
  // feel safe.
  if (reviews === 0) need += 30;
  else if (reviews < 10) need += 32;
  else if (reviews < 30) need += 25;
  else if (reviews < 60) need += 12;
  // Well reviewed and highly rated is a business with no felt problem. Say so
  // in the score rather than rewarding it.
  else if (reviews >= 120 && rating >= 4.7) need -= 15;
  // Momentum falling off is the moment an owner starts taking calls about
  // getting more work. The old scorer treated this purely as a risk.
  if (act.level === 'slowing') need += 20;
  // A listing nobody has touched: no photos, or no published hours.
  if (photos === 0) need += 12;
  if (!(p.regularOpeningHours?.weekdayDescriptions || []).length) need += 10;
  // No number on a listing is a real gap, but it also means we cannot call
  // them — it is scored as need and paid for in reach above.
  if (!hasPhone) need += 8;

  // Reachability gates; need orders. Weighted so a genuinely unreachable
  // business cannot ride a big need score to the top of the list.
  const score = Math.round(reach * 0.45 + need * 0.85);
  return Math.max(1, Math.min(99, score));
}

/** Named, dollar-relevant gaps. Each one traces to a Places field. */
function placeGaps(p) {
  const gaps = [];
  const reviews = p.userRatingCount ?? 0;
  const rating = p.rating ?? 0;

  if (!p.websiteUri) {
    gaps.push({
      key: 'no-website',
      label: 'No website',
      angle: 'Everything comes from Maps or word of mouth. Nowhere to capture the rest.',
    });
  }
  if (rating >= 4.0 && reviews > 0 && reviews < 25) {
    gaps.push({
      key: 'thin-reviews',
      label: `Only ${reviews} reviews at ${rating}★`,
      angle: `Customers are happy but nobody is asking them to say so — competitors outrank them on volume alone.`,
    });
  }
  if (reviews === 0) {
    gaps.push({
      key: 'no-reviews',
      label: 'No reviews at all',
      angle: 'Invisible in local ranking. Review generation is the fastest lever here.',
    });
  }
  if (!p.nationalPhoneNumber && !p.internationalPhoneNumber) {
    gaps.push({
      key: 'no-phone',
      label: 'No phone on the listing',
      angle: 'If we cannot find a number in ten seconds, neither can their customers.',
    });
  }
  // A listing with no photos is one nobody has logged into in years. Google
  // ranks photo-rich profiles higher, and it's the cheapest thing to fix.
  const photos = Array.isArray(p.photos) ? p.photos.length : 0;
  if (photos === 0) {
    gaps.push({
      key: 'no-photos',
      label: 'No photos on the listing',
      angle: 'Nobody has touched this profile in years. Photos lift local ranking and are a same-day fix.',
    });
  }
  return gaps;
}

/** Normalise to E.164 so it matches Apollo/contacts output. */
function e164(p) {
  const raw = p.internationalPhoneNumber || p.nationalPhoneNumber || '';
  const d = raw.replace(/[^\d]/g, '');
  if (!d) return null;
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith('1')) return `+${d}`;
  return raw.startsWith('+') ? raw.replace(/\s/g, '') : `+${d}`;
}

/**
 * Map a Place onto the app's lead shape so LeadsPage, buildOutreachStrategy and
 * buildCallSheet all work on it unchanged.
 *
 * Headcount is deliberately left null rather than guessed. Places doesn't know
 * it, and inventing a number would flow straight into the tier recommendation
 * and the missed-call estimate.
 */
export function transformPlace(p, index = 0) {
  const score = scorePlace(p);
  const phone = e164(p);
  const reviews = p.userRatingCount ?? null;
  const gaps = placeGaps(p);
  const activity = assessActivity(p);
  const revenue = estimateRevenue(p);
  const receptionist = assessReceptionist(p);

  return {
    id: index + 1,
    name: p.displayName?.text || 'Unknown',
    company: p.displayName?.text || 'Unknown',
    contactName: null,
    title: null,
    email: null,
    phone,
    industry: p.primaryTypeDisplayName?.text || 'Local service',
    priority: score >= 75 ? 'critical' : score >= 60 ? 'high' : score >= 45 ? 'medium' : 'low',
    status: 'new',
    score,
    // Local Engine pricing — these are owner-operated businesses by definition.
    value: 2000,
    dealValue: 2000,
    employees: null,
    revenue: null,
    revenueFormatted: null,
    location: p.shortFormattedAddress || p.formattedAddress || null,
    address: p.formattedAddress || null,
    website: p.websiteUri || null,
    domain: p.websiteUri ? (() => { try { return new URL(p.websiteUri).hostname.replace(/^www\./, ''); } catch { return null; } })() : null,
    linkedin_url: null,
    logo: null,
    foundedYear: null,
    momentum: 'stable',
    // Places-specific, and the reason this source exists.
    rating: p.rating ?? null,
    reviewCount: reviews,
    mapsUrl: p.googleMapsUri || null,
    businessStatus: p.businessStatus || null,
    // First listing photo, as an opaque reference. Not a URL: fetching the
    // bytes needs the API key, so the client asks the photo proxy for it by
    // reference and the key never leaves the server.
    photoRef: p.photos?.[0]?.name || null,
    // How many photos the listing has at all. Zero means nobody has touched
    // this profile in years — that's the GMB-management pitch, and it costs
    // nothing extra to know.
    photoCount: Array.isArray(p.photos) ? p.photos.length : 0,
    // Refs only — no image is fetched until something asks for one. Capped at
    // six because photo media bills per request and nobody needs ten pictures
    // of a van to decide whether to call.
    photoRefs: Array.isArray(p.photos) ? p.photos.slice(0, 6).map(x => x.name).filter(Boolean) : [],
    // The review link is the one to hand a client; the rest are for us.
    reviewLink: p.googleMapsLinks?.writeAReviewUri || null,
    reviewsLink: p.googleMapsLinks?.reviewsUri || null,
    // Google's observed ticket range. Sanity-checked because the low bound is
    // sometimes a literal $1, which would make any pitch built on it nonsense.
    ticketRange: (() => {
      const lo = Number(p.priceRange?.startPrice?.units);
      const hi = Number(p.priceRange?.endPrice?.units);
      if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= 0 || hi < lo || lo < 20) return null;
      return { low: lo, high: hi, currency: p.priceRange?.startPrice?.currencyCode || 'USD' };
    })(),
    utcOffsetMinutes: Number.isFinite(p.utcOffsetMinutes) ? p.utcOffsetMinutes : null,
    // Qualification — is this a live business, and roughly how big?
    activity,
    revenueEstimate: revenue,
    revenueFormatted: revenue
      ? `$${Math.round(revenue.monthlyLow / 1000)}K–$${Math.round(revenue.monthlyHigh / 1000)}K/mo`
      : null,
    openNow: p.regularOpeningHours?.openNow ?? null,
    // Whether the after-hours pitch is supportable, computed from published
    // hours rather than assumed. See assessReceptionist.
    receptionist,
    priceLevel: p.priceLevel || null,
    hasPublishedHours: (p.regularOpeningHours?.weekdayDescriptions || []).length > 0,
    lastReviewDays: activity.daysSinceNewest ?? null,
    painPoints: [],
    techStack: null,
    keywords: [],
    buyingSignals: gaps.map(g => g.label),
    placeGaps: gaps,
    lead_source: 'Google Places',
    deal_stage: 'Discovery',
    tags: [
      phone ? 'has-phone' : 'no-phone',
      p.websiteUri ? 'has-website' : 'no-website',
      reviews != null && reviews < 25 ? 'thin-reviews' : null,
    ].filter(Boolean),
    created_at: new Date().toISOString(),
    last_activity: null,
    lastContact: null,
    bestMethod: phone ? 'Cold Call' : 'Walk-in / Maps message',
    contactAvailable: false,
    _source: 'places',
    _placeId: p.id,
    _apolloId: `place:${p.id}`, // persistence keys on external_id
  };
}

/**
 * Text search. Places works best with a natural query — "HVAC repair in Katy TX"
 * beats structured filters, because it's the same ranking a customer gets.
 *
 * @param {object} opts
 * @param {string} opts.query     trade/vertical, e.g. "HVAC repair"
 * @param {string} [opts.location] "Katy TX"
 * @param {number} [opts.limit]   max 20 per Places
 */
export async function searchPlaces({ query, location = '', limit = 20, pageToken = '' }) {
  if (!placesConfigured()) return { error: 'GOOGLE_PLACES_API_KEY not set', fallback: true };
  if (!query) return { error: 'query is required', fallback: true };

  const textQuery = location ? `${query} in ${location}` : query;

  try {
    const r = await fetch(SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key(),
        'X-Goog-FieldMask': FIELDS,
      },
      body: JSON.stringify({
        textQuery,
        // 20 is the per-request ceiling, but searchText DOES return a
        // nextPageToken — verified: 20 then 18 then more. So depth within a
        // single trade+geo is available, and the caller can walk it.
        maxResultCount: Math.min(Math.max(limit, 1), 20),
        // Domestic only. Apollo without a country filter returned Dubai and
        // Belgrade for "hvac"; don't leave the same gap open here.
        regionCode: 'US',
        ...(pageToken ? { pageToken } : {}),
      }),
      signal: AbortSignal.timeout(12000),
    });

    const body = await r.json().catch(() => null);

    if (!r.ok) {
      const msg = body?.error?.message || `HTTP ${r.status}`;
      // Surface the enable-the-API case explicitly; it's the common first-run
      // failure and the message is otherwise buried.
      const needsEnabling = /has not been used|is disabled|PERMISSION_DENIED/i.test(msg);
      return {
        error: needsEnabling
          ? 'Places API (New) is not enabled on the project that owns this key.'
          : `Places API error: ${msg.slice(0, 200)}`,
        needsEnabling,
        fallback: true,
      };
    }

    const places = body?.places || [];
    // Drop anything not currently trading — a closed business is not a lead.
    const open = places.filter(p => !p.businessStatus || p.businessStatus === 'OPERATIONAL');

    // Places matches on business NAME as well as place, so a search for
    // "pest control in tampa" returned "Houston Pest Control" — in Houston —
    // as the top result, because the name is a strong text match. Anything
    // whose address doesn't mention the city we asked for is not in that city.
    //
    // Only applied when the city token is distinctive enough to test, and only
    // if it doesn't wipe the whole result set — a neighbouring-suburb address
    // ("Oldsmar" for a Tampa search) is still a legitimate local lead.
    // Domestic-focused, not domestic-locked.
    //
    // `regionCode: 'US'` is a bias rather than a restriction, so a US city
    // search could still return the odd foreign result — a US business address
    // ends with a state code and ZIP ("…, TX 77007") where a foreign one ends
    // with a country ("…, UK"), and those strays are filtered out.
    //
    // But when EVERY result is foreign the caller has explicitly asked for a
    // foreign market, so we serve it rather than handing back an empty page.
    // The automatic path can't reach here — it only sets a location for US
    // callers — so this is reachable only by typing a city in deliberately.
    const US_ADDRESS = /,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\s*$|,\s*USA\s*$/;
    const domestic = open.filter(p => US_ADDRESS.test(p.formattedAddress || ''));
    let candidates = domestic.length ? domestic : open;
    const cityToken = String(location || '').split(',')[0].trim().toLowerCase();
    if (cityToken.length >= 4) {
      const inCity = candidates.filter(p => {
        const addr = `${p.formattedAddress || ''} ${p.shortFormattedAddress || ''}`.toLowerCase();
        const name = (p.displayName?.text || '').toLowerCase();
        // Named for a different city and not addressed in this one → drop.
        return addr.includes(cityToken) || !/\b(houston|dallas|austin|phoenix|atlanta|chicago|denver|miami|seattle|boston|tampa|orlando|nashville|charlotte|portland|vegas)\b/.test(name)
          || name.includes(cityToken);
      });
      // Keep the filter only if it left us a usable list.
      if (inCity.length >= Math.min(5, candidates.length)) candidates = inCity;
    }

    const leads = candidates.map((p, i) => transformPlace(p, i)).sort((a, b) => b.score - a.score);

    return {
      leads,
      total: leads.length,
      source: 'places',
      query: textQuery,
      nextPageToken: body?.nextPageToken || null,
      stats: {
        withoutWebsite: leads.filter(l => !l.website).length,
        thinReviews: leads.filter(l => l.reviewCount != null && l.reviewCount < 25).length,
        reachable: leads.filter(l => l.phone).length,
      },
    };
  } catch (e) {
    return { error: `Places request failed: ${e.message}`, fallback: true };
  }
}

/**
 * One place by id, normalised through the same mapper as search results.
 *
 * This is what makes a lead permalink resolve for someone whose browser has
 * never seen that lead — the link carries the place id, not a row from anyone's
 * local store. It also backfills leads captured before a field existed: an old
 * row with a _placeId can be re-hydrated rather than left permanently missing
 * whatever we added since.
 *
 * The field mask is the same constant the search uses, minus the `places.`
 * prefix that only applies to the search response envelope.
 */
export async function getPlaceById(placeId) {
  if (!placesConfigured()) return { error: 'GOOGLE_PLACES_API_KEY not set' };
  if (!/^[A-Za-z0-9_-]{10,}$/.test(String(placeId || ''))) {
    return { error: 'Invalid place id' };
  }
  const mask = FIELDS
    .split(',')
    .filter(f => f.startsWith('places.'))
    .map(f => f.slice('places.'.length))
    .join(',');
  try {
    const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': key(),
        'X-Goog-FieldMask': mask,
      },
      signal: AbortSignal.timeout(9000),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      return { error: r.status === 404 ? 'That business is no longer listed on Google.' : `Places ${r.status}`, detail: body.slice(0, 160) };
    }
    const p = await r.json();
    if (!p?.id) return { error: 'That business is no longer listed on Google.' };
    return { lead: transformPlace(p, 0) };
  } catch (e) {
    return { error: 'Could not reach Google Places just now.', detail: String(e.message || e).slice(0, 120) };
  }
}
