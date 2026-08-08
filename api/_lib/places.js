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
  'nextPageToken',
].join(',');

const key = () => process.env.GOOGLE_PLACES_API_KEY || '';
export const placesConfigured = () => !!key();

/**
 * Rank a local business by how much it needs this offer — not by how impressive
 * it is. A polished operation with 400 reviews and a booking widget is a worse
 * prospect than a well-reviewed shop with no website, because the second one has
 * demand it is visibly failing to capture.
 */
function scorePlace(p) {
  let score = 30;
  const reviews = p.userRatingCount ?? 0;
  const rating = p.rating ?? 0;

  // Demand exists and customers are happy — they have something to scale.
  if (rating >= 4.5 && reviews >= 20) score += 20;
  else if (rating >= 4.0 && reviews >= 10) score += 14;
  else if (rating >= 4.0) score += 8;

  // The strongest signal in this whole file. No website means every lead comes
  // from Maps or word of mouth, and there is nowhere to capture the ones that
  // slip. Highest intent for a web/AI build.
  if (!p.websiteUri) score += 25;

  // Thin review count against a good rating = they aren't asking for reviews.
  // Directly addressable by the review engine.
  if (rating >= 4.0 && reviews > 0 && reviews < 25) score += 12;

  // Reachable at all.
  if (p.nationalPhoneNumber || p.internationalPhoneNumber) score += 10;

  // Size, proxied by review volume — the missing dimension. Without this every
  // established business scored exactly 60, so a 6,000-review franchise tied
  // with a 40-review owner-operator and the ordering fell back to whatever
  // Places considered most prominent. That put the single hardest sale in the
  // city at the top of the list.
  //
  // We sell to the owner. Past a few hundred reviews there is a marketing
  // manager, an agency on retainer, and a procurement process; below that the
  // person who answers the phone can also sign.
  if (reviews > 2000) score -= 18;        // regional/franchise, already has an agency
  else if (reviews > 800) score -= 12;
  else if (reviews > 300) score -= 5;
  else if (reviews >= 40) score += 10;    // established but still owner-run: the sweet spot
  else if (reviews >= 10) score += 6;

  // Don't pitch a business that has closed.
  if (p.businessStatus && p.businessStatus !== 'OPERATIONAL') score -= 40;

  // Liveness. A dead contact wastes the operator's time no matter how good the
  // gap looks on paper, and a listing with no review in two years is exactly
  // the kind of thing that scored well here before: no website, thin reviews,
  // maximum apparent need, nobody home.
  const act = assessActivity(p);
  if (act.level === 'stale') score -= 30;
  else if (act.level === 'slowing') score -= 10;
  else if (act.level === 'active') score += 12;
  else if (act.level === 'steady') score += 5;

  return Math.max(1, Math.min(99, Math.round(score)));
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
