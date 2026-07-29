// =============================================================================
// GOATED Solutions - Lead Data API (Live Generated Data + Apollo.io)
// =============================================================================
// Endpoint: GET /api/leads
//
// Query Parameters:
//   - page:     number (default: 1)
//   - limit:    number (default: 50, max: 200)
//   - sort:     field name (default: "score")
//   - order:    "asc" | "desc" (default: "desc")
//   - search:   text search across name, company, email, industry
//   - industry: filter by industry
//   - status:   filter by status
//   - priority: filter by priority
//   - minScore: number 0-100
//   - source:   "apollo" | "generated" (force a specific data source)
//
// Data Sources:
//   1. Apollo.io ORGANISATION search (when APOLLO_API_KEY is set)
//      POST https://api.apollo.io/api/v1/organizations/search
//      Person-level endpoints (mixed_people/search, people/match,
//      people/bulk_match) all return 403 on the Free plan — verified.
//      Defaults to 1–25 employees: owner-operated businesses where the decision
//      maker answers the phone.
//   2. ?action=enrich&website= — crawls the prospect's own site for named
//      humans, direct numbers and named inboxes, which is where person-level
//      contact data actually comes from for this ICP. See _lib/contacts.js.
//   3. In-memory generated data (fallback, clearly labelled as synthetic)
//
// Returns paginated results with total count + summary stats
// Uses in-memory caching for sub-ms response times
// =============================================================================

const ALLOWED_ORIGINS = [process.env.CORS_ORIGIN || 'https://goated.solutions', 'http://localhost:5173', 'http://localhost:5174'];
function getCorsOrigin(req) {
  const origin = req.headers?.origin || '';
  if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) return origin;
  return ALLOWED_ORIGINS[0];
}

const getCorsHeaders = (req) => ({
  'Access-Control-Allow-Origin': getCorsOrigin(req),
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
});

// ---------------------------------------------------------------------------
// Apollo.io API integration — cache + transform
// ---------------------------------------------------------------------------
let apolloCache = { data: null, timestamp: 0, key: '' };
const APOLLO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Apollo's person-level endpoints (mixed_people/search, people/match) are gated
// behind a paid plan and return 403 even with a master key. organizations/search
// and organizations/enrich ARE available on Free, and company-level records are
// what an agency targeting local businesses actually prospects against anyway.
// If the account is later upgraded, set APOLLO_PEOPLE_ENABLED=true to re-enable
// contact-level enrichment on top of these company records.
const APOLLO_ORG_SEARCH_URL = 'https://api.apollo.io/api/v1/organizations/search';

/**
 * Score a company from real Apollo signals — no randomness.
 * Higher = better fit for a done-for-you revenue/automation engagement.
 */
function scoreApolloOrg(org) {
  let score = 30;
  const emp = org.estimated_num_employees || 0;
  const rev = org.organization_revenue || 0;

  // Headcount sweet spot: big enough to have budget, small enough to have no ops team.
  if (emp >= 10 && emp <= 200) score += 22;
  else if (emp > 200 && emp <= 1000) score += 12;
  else if (emp >= 5) score += 6;

  // Revenue signal
  if (rev >= 10_000_000) score += 18;
  else if (rev >= 1_000_000) score += 14;
  else if (rev > 0) score += 7;

  // Reachability — a lead you cannot contact is not a lead.
  if (org.sanitized_phone || org.primary_phone?.number || org.phone) score += 10;
  if (org.website_url || org.primary_domain) score += 5;
  if (org.linkedin_url) score += 4;

  // Growth = budget is moving.
  const growth = org.organization_headcount_twelve_month_growth;
  if (typeof growth === 'number') {
    if (growth > 0.2) score += 10;
    else if (growth > 0) score += 5;
    else if (growth < -0.15) score -= 6;
  }

  // Apollo's own buyer-intent signal
  if (org.show_intent && org.intent_strength) score += 8;

  return Math.max(1, Math.min(99, Math.round(score)));
}

/** Real buying signals derived from the record — empty if the data isn't there. */
function apolloBuyingSignals(org) {
  const out = [];
  const growth = org.organization_headcount_twelve_month_growth;
  if (typeof growth === 'number' && growth > 0.15) out.push(`Headcount up ${Math.round(growth * 100)}% in 12mo`);
  if (org.founded_year && new Date().getFullYear() - org.founded_year <= 5) out.push(`Founded ${org.founded_year} — early growth stage`);
  if (org.show_intent && org.intent_strength) out.push(`Apollo intent signal: ${org.intent_strength}`);
  if (org.retail_location_count > 1) out.push(`${org.retail_location_count} physical locations`);
  if (!org.linkedin_url) out.push('No LinkedIn presence — weak digital footprint');
  return out;
}

/**
 * Transform an Apollo ORGANIZATION record into our standard lead format.
 * Every field is either straight from Apollo or computed from Apollo values —
 * nothing is invented. Missing data stays null so the UI can show it as missing.
 */
function transformApolloOrg(org, index) {
  const score = scoreApolloOrg(org);
  const emp = org.estimated_num_employees || null;
  const rev = org.organization_revenue || null;
  const location = [org.city, org.state].filter(Boolean).join(', ') || org.country || org.raw_address || null;
  const phone = org.sanitized_phone || org.primary_phone?.number || org.phone || null;
  const industry = org.industry || org.industries?.[0] || 'Unknown';

  // Deal value modelled off the published Local/Growth tiers, not a random number.
  const dealValue = emp && emp > 200 ? 12500 : emp && emp >= 20 ? 2750 : 2000;
  const priority = score >= 75 ? 'critical' : score >= 60 ? 'high' : score >= 45 ? 'medium' : 'low';

  return {
    id: index + 1,
    // Free-plan Apollo is company-level: the record IS the business, not a person.
    name: org.name || 'Unknown',
    company: org.name || 'Unknown',
    contactName: null,
    title: null,
    email: null,
    phone,
    industry,
    priority,
    status: 'new',
    score,
    value: dealValue,
    dealValue,
    employees: emp,
    revenue: rev,
    revenueFormatted: org.organization_revenue_printed || null,
    location,
    address: org.raw_address || null,
    website: org.website_url || (org.primary_domain ? `https://${org.primary_domain}` : null),
    domain: org.primary_domain || null,
    linkedin_url: org.linkedin_url || null,
    logo: org.logo_url || null,
    foundedYear: org.founded_year || null,
    momentum: org.organization_headcount_twelve_month_growth > 0.1 ? 'rising'
      : org.organization_headcount_twelve_month_growth < -0.1 ? 'declining' : 'stable',
    painPoints: [],
    techStack: null,
    keywords: (org.keywords || []).slice(0, 12),
    buyingSignals: apolloBuyingSignals(org),
    lead_source: 'Apollo',
    deal_stage: 'Discovery',
    tags: [phone ? 'has-phone' : 'no-phone', org.linkedin_url ? 'has-linkedin' : 'no-linkedin'],
    created_at: new Date().toISOString(),
    last_activity: null,
    lastContact: null,
    conversionProbability: calcConversionProbability(score, priority, 'new', dealValue, emp || 0),
    bestMethod: phone ? 'Cold Call' : org.linkedin_url ? 'LinkedIn DM' : 'Cold Email',
    decisionTimeline: calcDecisionTimeline(priority, 'new', dealValue),
    ranking: calcRanking(score, priority, 'new', dealValue, emp || 0, rev || 0, industry),
    // Honest provenance so the UI never claims contact data it doesn't have.
    contactAvailable: false,
    _source: 'apollo',
    _apolloId: org.id,
  };
}

/**
 * Fetch company leads from Apollo.io Organization Search API.
 * Returns { leads, total, source: 'apollo' } on success,
 * or { error, fallback: true } on failure.
 */
async function fetchApolloLeads({ page, limit, search, industry, location, minEmployees, maxEmployees }) {
  const cacheKey = JSON.stringify({ page, limit, search, industry, location, minEmployees, maxEmployees });
  const now = Date.now();

  if (apolloCache.data && apolloCache.key === cacheKey && (now - apolloCache.timestamp) < APOLLO_CACHE_TTL) {
    return { ...apolloCache.data, cached: true };
  }

  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return { error: 'APOLLO_API_KEY not set', fallback: true };

  // Apollo caps per_page at 100 for org search.
  const perPage = Math.min(Math.max(limit, 1), 100);

  const body = { page, per_page: perPage };

  // Keyword tags drive the vertical (hvac, dental, roofing, med spa...).
  const tags = [search, industry].filter(Boolean).map(s => String(s).toLowerCase().trim());
  if (tags.length) body.q_organization_keyword_tags = tags;

  if (location) body.organization_locations = [location];

  // Employee-range filter uses Apollo's "min,max" string format.
  // Default to genuinely small operators. The old 1–500 default is what surfaced
  // Samsung HVAC America, Inc. Magazine and Y Combinator — companies with a
  // procurement process, an in-house team, and no interest in a $2K setup.
  //
  // 1–25 is the sweet spot for this offer: the owner still answers the phone, so
  // a missed call is lost revenue they feel personally, and one person can say
  // yes. Callers can widen it with ?minEmployees=&maxEmployees=.
  const lo = Number(minEmployees) || 1;
  const hi = Number(maxEmployees) || 25;
  body.organization_num_employees_ranges = [`${lo},${hi}`];

  try {
    const response = await fetch(APOLLO_ORG_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      console.error(`[GOATED] Apollo API error ${response.status}: ${errText}`);
      return {
        error: `Apollo API returned ${response.status}`,
        statusCode: response.status,
        detail: errText.slice(0, 300),
        fallback: true,
      };
    }

    const data = await response.json();
    const orgs = data.organizations || data.accounts || [];
    if (!orgs.length) {
      return { error: 'Apollo returned no organizations for this query', fallback: true };
    }

    const total = data.pagination?.total_entries || orgs.length;
    const leads = orgs.map((org, idx) => transformApolloOrg(org, (page - 1) * perPage + idx));

    const result = { leads, total, source: 'apollo', cached: false };
    apolloCache = { data: result, timestamp: now, key: cacheKey };
    return result;
  } catch (err) {
    console.error(`[GOATED] Apollo API fetch failed: ${err.message}`);
    return {
      error: `Apollo API request failed: ${err.message}`,
      fallback: true,
    };
  }
}

// ---------------------------------------------------------------------------
// SMB company list (matches the store exactly)
// ---------------------------------------------------------------------------
const companies = [
  'Flowstate', 'BrightPath', 'LeadVault', 'CloserIQ', 'PipelineHQ', 'DealForge', 'Revly', 'Quotient Systems',
  'NimbusOps', 'Trellis Software', 'StackedCRM', 'LaunchGrid', 'SyncWave', 'SignalPeak', 'Trackwise',
  'Evergreen Goods Co', 'The Daily Drip', 'Coastal Collective', 'Urban Sage', 'Rooted Supply Co',
  'Goldenrod Market', 'The Nomad Shop', 'Willow Creek Goods', 'Copper & Thread', 'Little Wolf Co',
  'Summit Marketing Co', 'Ironclad Creative', 'Northbound Digital', 'Clearpoint Agency', 'Ember & Oak Media',
  'Catalyst Growth Partners', 'Basecamp Digital', 'Slingshot Creative', 'Whiteboard Agency', 'Foxhound Media',
  'Ridgeline Marketing', 'Groundswell Agency', 'Clockwork Digital', 'Trailhead Studios', 'Mosaic Creative Group',
  'NexGen Roofing', 'Apex Plumbing Solutions', 'TrueNorth HVAC', 'Keystone Electric', 'GreenLeaf Landscaping',
  'ProEdge Painting', 'AllClear Pest Control', 'Benchmark Home Services', 'LevelUp Cleaning Co', 'Cornerstone Builders',
  'PennyWise Financial', 'TrustBridge Payments', 'ClearLedger', 'FundStack', 'CoinPath',
  'BlueVine Capital', 'Greenback Solutions', 'LedgerPoint', 'PayStream Pro', 'MintEdge Financial',
  'Pinnacle Dental Group', 'Lakeside Family Medicine', 'BrightSmile Orthodontics', 'Crossroads Chiropractic',
  'Harmony Physical Therapy', 'Everwell Health Partners', 'Sunrise Pediatrics', 'ClearView Eye Center',
  'Oakwood Medical Associates', 'Valley Urgent Care', 'Ridgeview Dermatology', 'Summit Orthopedic Group',
  'TrueForm Manufacturing', 'Ironworks Precision', 'Atlas Metal Fabrication', 'Redline Machine Works',
  'Sterling Components', 'HarborLight Manufacturing', 'Midwest Precision Parts', 'CrestLine Industries',
  'Vantage Point Consulting', 'Bridgewater Advisory', 'Northstar Strategy Group', 'Keystone Business Advisors',
  'Claritix Consulting', 'Pivotal Growth Partners', 'Trident Advisory Group', 'Meridian Consulting',
  'Hearthstone Realty', 'Crestview Properties', 'Irongate Real Estate', 'Compass Point Realty',
  'Redwood Property Group', 'Bluewater Homes', 'Keystone Realty Partners', 'Sunstone Properties',
  'IronPulse Fitness', 'ZenForge Wellness', 'PeakForm Athletics', 'CoreLife Studio',
  'Elevate Gym Co', 'Vitality Wellness Center', 'Grounded Yoga Collective', 'StrideRight Fitness',
  'Golden Grain Bakery', 'The Copper Kettle', 'BaseCamp Coffee Roasters', 'Juniper & Thyme',
  'Fieldstone Brewing Co', 'SunHarvest Juicery', 'Ember Grill House', 'Sagebrush Catering',
  'Storyline Media', 'RedThread Content', 'Amplify Studios', 'LoudSpeaker Media',
  'Inkwell Content Co', 'FrameShift Productions', 'PixelForge Media', 'NarrativeLab',
  'Ironside Construction', 'BluePrint Builders', 'Cornerstone General Contracting', 'Ridgecrest Construction',
  'SteelBridge Contractors', 'Foundation First Builders', 'TrueLevel Construction', 'Granite Peak Builders',
  'Whitfield & Associates', 'Sterling Legal Group', 'Brookstone Law', 'Clearwater Legal Partners',
  'Ridgemont Law Firm', 'Trailmark Legal', 'Ironwood Law Group', 'Harborside Legal Advisors',
  'Ledger & Lane CPAs', 'Clearpath Accounting', 'Summit Tax Advisors', 'Keystone Financial Group',
  'Truemark CPAs', 'Northpoint Accounting', 'Bridgeway Tax Services', 'Goldcrest Financial',
  'Sentinel Insurance Group', 'TrueShield Insurance', 'Crestline Insurance Partners', 'Ironclad Coverage',
  'Ridgepoint Insurance', 'SafeHarbor Insurance', 'Pathfinder Insurance Group', 'Beacon Risk Advisors',
  'TalentForge Staffing', 'Bridgework Recruiting', 'PeakHire Solutions', 'Keystaffing',
  'Northbound Talent', 'TrueFind Recruiting', 'Pipeline People Co', 'MatchPoint Staffing',
  'SwiftRoute Logistics', 'Trailhead Freight', 'ClearPath Shipping', 'PointToPoint Logistics',
  'Ironline Transport', 'Ridgerun Delivery Co', 'Greenway Logistics', 'SteadyHaul Freight',
  'TerraCraft Supply', 'The Artisan Vault', 'WildEdge Outdoor Co', 'Hearthside Home Goods',
  'Oakline Pet Supply', 'ThreadBound Apparel', 'GearForge Equipment', 'PurePath Organics',
];

const industries = [
  'Fintech', 'SaaS', 'E-commerce', 'Healthcare', 'EdTech', 'DevTools', 'Cybersecurity', 'AI/ML', 'MarTech', 'PropTech',
  'InsurTech', 'LegalTech', 'AgTech', 'CleanTech', 'BioTech', 'MedTech', 'FoodTech', 'HRTech', 'AdTech', 'RegTech',
  'SupplyChain', 'Logistics', 'Gaming', 'Media', 'Telecom', 'Automotive', 'Aerospace', 'Energy', 'Retail', 'Construction',
  'Travel', 'Hospitality', 'Entertainment', 'Sports', 'Fashion',
];

const priorities = ['critical', 'high', 'medium', 'low'];
const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'nurturing', 're-engaged', 'on-hold', 'unresponsive'];
const leadSources = ['LinkedIn', 'Cold Email', 'Website', 'Referral', 'Paid Ad', 'Webinar', 'Conference', 'Partner', 'Inbound Form', 'Content Download', 'Social Media', 'Directory Listing'];
const dealStages = ['Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost', 'Onboarding', 'Churned', 'Upsell'];
const tagOptions = ['hot-lead', 'enterprise', 'saas', 'ecommerce', 'founder', 'decision-maker', 'champion', 'blocker', 'fast-close', 'high-value', 'needs-nurture', 'competitor-user', 'expansion', 'at-risk', 'referral-source', 'pilot-candidate', 'budget-holder', 'technical-buyer', 'influencer', 'cold-outreach'];

const firstNames = [
  'James', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Chris', 'Amanda', 'Matt', 'Rachel',
  'Alex', 'Nicole', 'Ryan', 'Taylor', 'Jordan', 'Morgan', 'Andrew', 'Samantha', 'Brian', 'Lauren',
  'Kevin', 'Megan', 'Jason', 'Stephanie', 'Justin', 'Ashley', 'Brandon', 'Rebecca', 'Tyler', 'Hannah',
  'Daniel', 'Olivia', 'Nathan', 'Sophia', 'Ethan', 'Isabella', 'Lucas', 'Emma', 'Mason', 'Ava',
  'Logan', 'Chloe', 'Aiden', 'Lily', 'Owen', 'Zoe', 'Caleb', 'Grace', 'Liam', 'Ella',
  'Noah', 'Mia', 'Jacob', 'Abigail', 'William', 'Charlotte', 'Benjamin', 'Amelia', 'Henry', 'Harper',
  'Sebastian', 'Evelyn', 'Alexander', 'Aria', 'Theodore', 'Luna', 'Samuel', 'Layla', 'Jack', 'Penelope',
  'Raj', 'Priya', 'Wei', 'Mei', 'Yuki', 'Hana', 'Carlos', 'Maria', 'Ahmed', 'Fatima',
  'Dmitri', 'Olga', 'Hans', 'Anna', 'Pierre', 'Claire', 'Marco', 'Sofia', 'Lars', 'Ingrid',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Anderson',
  'Chen', 'Kumar', 'Park', 'Lee', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'White',
  'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott',
  'Hill', 'Green', 'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner',
  'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers',
  'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox',
  'Patel', 'Singh', 'Sharma', 'Nguyen', 'Tran', 'Kim', 'Tanaka', 'Yamamoto', 'Zhang', 'Wang',
  'Li', 'Liu', 'Yang', 'Huang', 'Muller', 'Schmidt', 'Fischer', 'Weber', 'Meyer', 'Wagner',
  'Rossi', 'Bianchi', 'Fernandez', 'Lopez', 'Martinez', 'Gonzalez', 'Rodriguez', 'Hernandez', 'Diaz', 'Morales',
];

const titles = [
  'Owner', 'Founder', 'Co-Founder', 'CEO', 'President', 'COO', 'Managing Partner', 'General Manager',
  'Director of Operations', 'Operations Manager', 'Office Manager', 'Practice Manager', 'Studio Manager',
  'Sales Manager', 'Marketing Director', 'Marketing Manager', 'Business Development Manager',
  'Head of Sales', 'Head of Marketing', 'Head of Growth', 'Director of Sales',
  'VP of Sales', 'VP of Operations', 'VP of Marketing',
  'Clinic Director', 'Branch Manager', 'Regional Manager', 'Managing Director',
  'Chief of Staff', 'Executive Director', 'Partner', 'Senior Partner',
  'Founder & CEO', 'Owner-Operator', 'Principal', 'Creative Director',
];

const locations = [
  'San Francisco', 'New York', 'Austin', 'Seattle', 'Boston', 'Chicago', 'Denver', 'Miami', 'LA', 'London',
  'Toronto', 'Berlin', 'Paris', 'Amsterdam', 'Dublin', 'Singapore', 'Sydney', 'Tokyo', 'Hong Kong', 'Tel Aviv',
  'Portland', 'Nashville', 'Atlanta', 'Dallas', 'Phoenix', 'San Diego', 'Philadelphia', 'Minneapolis', 'Detroit', 'Charlotte',
  'Raleigh', 'Salt Lake City', 'Pittsburgh', 'Columbus', 'Indianapolis', 'Tampa', 'Orlando', 'Las Vegas', 'Kansas City', 'St Louis',
  'Vancouver', 'Montreal', 'Melbourne', 'Auckland', 'Stockholm', 'Copenhagen', 'Oslo', 'Helsinki', 'Zurich', 'Munich',
];

const painPoints = [
  'Manual lead qualification taking 40+ hrs/week', 'No unified view of pipeline health', 'Cold outreach under 2% reply rate',
  'Sales cycle 3x industry average', 'CRM data quality below 60%', 'Rep ramp time exceeding 90 days',
  'No real-time competitive intelligence', 'Forecasting accuracy under 50%', 'High customer churn rate',
  'Scaling team without losing quality', 'Tech stack fragmentation', 'No automated follow-up system',
];
const techStacks = ['Salesforce + HubSpot', 'Pipedrive + Mailchimp', 'HubSpot + Outreach', 'Salesforce + Gong + ZoomInfo', 'None - manual process', 'Custom CRM + Excel'];
const buyingSignals = ['Recent funding round', 'Hiring sales team', 'Tech stack migration', 'New leadership', 'Expanding to new market', 'Competitor loss', 'RFP issued', 'Budget cycle Q1'];

// ---------------------------------------------------------------------------
// Deterministic seeded random for consistent lead data
// ---------------------------------------------------------------------------
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN(arr, n, rng) {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

function fmt(v) {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v}`;
}

// ---------------------------------------------------------------------------
// Calculated lead recommendation & scoring (replaces random rankings)
// ---------------------------------------------------------------------------
function calcConversionProbability(score, priority, status, dealValue, employees) {
  let prob = score * 0.4; // Base: 40% weight on lead score
  // Priority boost
  if (priority === 'critical') prob += 20;
  else if (priority === 'high') prob += 12;
  else if (priority === 'medium') prob += 5;
  // Status boost — further in pipeline = higher probability
  const statusWeights = { won: 95, negotiation: 30, proposal: 22, qualified: 15, contacted: 8, new: 3, nurturing: 5, 're-engaged': 10, 'on-hold': -5, unresponsive: -10, lost: -20 };
  prob += statusWeights[status] || 0;
  // Company size sweet spot (50-200 employees = ideal)
  if (employees >= 50 && employees <= 200) prob += 8;
  else if (employees > 200) prob += 4;
  // Deal size — larger deals take longer but aren't less likely
  if (dealValue > 80000) prob -= 3;
  return Math.max(1, Math.min(99, Math.round(prob)));
}

function calcBestMethod(priority, score, dealValue, industry, rng) {
  // High-value enterprise leads → warm intro/conference
  if (dealValue > 60000 && score > 70) return 'Warm Intro';
  if (priority === 'critical') return 'Cold Call';
  // Tech industries respond to LinkedIn
  if (['SaaS', 'DevTools', 'AI/ML', 'Cybersecurity', 'MarTech', 'AdTech'].includes(industry)) return 'LinkedIn DM';
  if (score > 60) return 'Cold Email';
  if (priority === 'high') return pick(['Cold Email', 'LinkedIn DM', 'Cold Call'], rng);
  return pick(['Cold Email', 'LinkedIn DM', 'Conference'], rng);
}

function calcDecisionTimeline(priority, status, dealValue) {
  if (status === 'negotiation' || status === 'won') return 'This week';
  if (status === 'proposal') return '2 weeks';
  if (priority === 'critical') return '2 weeks';
  if (priority === 'high' && dealValue < 50000) return '1 month';
  if (dealValue > 80000) return '3 months';
  if (status === 'new' || status === 'nurturing') return '3 months';
  return '1 month';
}

function calcRanking(score, priority, status, dealValue, employees, revenue, industry) {
  // Fit Score: how well the lead matches ideal customer profile
  let fitScore = 0;
  fitScore += Math.min(30, score * 0.3); // Lead score contributes 30%
  fitScore += employees >= 20 && employees <= 300 ? 25 : (employees > 300 ? 15 : 10); // Company size fit
  fitScore += revenue >= 500000 ? 20 : (revenue >= 100000 ? 12 : 5); // Revenue fit
  fitScore += ['SaaS', 'Fintech', 'AI/ML', 'DevTools', 'Cybersecurity', 'MarTech'].includes(industry) ? 15 : 8; // Industry fit
  if (priority === 'critical' || priority === 'high') fitScore += 10;
  fitScore = Math.max(10, Math.min(99, Math.round(fitScore)));

  // Intent Score: buying signals strength
  let intentScore = 0;
  intentScore += score * 0.35;
  const intentByStatus = { won: 95, negotiation: 75, proposal: 60, qualified: 45, contacted: 25, 're-engaged': 35, new: 10, nurturing: 15, 'on-hold': 5, unresponsive: 3, lost: 2 };
  intentScore += intentByStatus[status] || 10;
  if (priority === 'critical') intentScore += 15;
  else if (priority === 'high') intentScore += 8;
  intentScore = Math.max(1, Math.min(99, Math.round(intentScore)));

  // Engagement level
  const engagementScore = (score + intentScore + fitScore) / 3;
  const engagement = engagementScore >= 75 ? 'Very High' : engagementScore >= 55 ? 'High' : engagementScore >= 35 ? 'Medium' : 'Low';

  // Overall ranking — composite of all factors
  const composite = score * 0.3 + fitScore * 0.25 + intentScore * 0.25 + (dealValue / 1200) * 0.2;
  const overall = Math.max(1, Math.min(100, Math.round(composite)));

  return {
    overall,
    byIndustry: Math.max(1, Math.min(20, Math.round(overall / 5))),
    byPriority: Math.max(1, Math.min(50, Math.round(overall / 2))),
    engagement,
    fitScore,
    intentScore,
  };
}

// ---------------------------------------------------------------------------
// Generate a single lead deterministically by ID
// ---------------------------------------------------------------------------
function generateLead(id) {
  const rng = seededRandom(id * 7919 + 104729);
  const company = companies[id % companies.length];
  const firstName = pick(firstNames, rng);
  const lastName = pick(lastNames, rng);
  const industry = pick(industries, rng);
  const priority = pick(priorities, rng);
  const status = pick(statuses, rng);
  const score = Math.floor(rng() * 100);
  const dealValue = Math.floor(rng() * 115000) + 5000;
  const employees = Math.floor(rng() * 495) + 5;
  const revenue = Math.floor(rng() * 19900000) + 100000;
  const location = pick(locations, rng);
  const selectedPainPoints = pickN(painPoints, 3, rng);
  const selectedSignals = pickN(buyingSignals, 3, rng);
  const selectedTags = pickN(tagOptions, Math.floor(rng() * 4) + 1, rng);
  const leadSource = pick(leadSources, rng);
  const dealStage = pick(dealStages, rng);

  // Generate realistic created_at within last 90 days
  const daysAgo = Math.floor(rng() * 90);
  const hoursAgo = Math.floor(rng() * 24);
  const createdAt = new Date(Date.now() - (daysAgo * 86400000 + hoursAgo * 3600000)).toISOString();

  // Generate last_activity within last 7 days
  const activityHoursAgo = Math.floor(rng() * 168);
  const lastActivity = new Date(Date.now() - activityHoursAgo * 3600000).toISOString();

  return {
    id,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    phone: `+1 (${Math.floor(rng() * 900) + 100}) ${Math.floor(rng() * 900) + 100}-${Math.floor(rng() * 9000) + 1000}`,
    company,
    title: pick(titles, rng),
    industry,
    priority,
    status,
    score,
    value: dealValue,
    dealValue,
    employees,
    revenue,
    location,
    website: `https://${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    momentum: pick(['rising', 'stable', 'declining'], rng),
    painPoints: selectedPainPoints,
    techStack: pick(techStacks, rng),
    buyingSignals: selectedSignals,
    lead_source: leadSource,
    deal_stage: dealStage,
    tags: selectedTags,
    created_at: createdAt,
    last_activity: lastActivity,
    lastContact: pick(['2 hours ago', '1 day ago', '3 days ago', '1 week ago', '2 weeks ago'], rng),
    conversionProbability: calcConversionProbability(score, priority, status, dealValue, employees),
    bestMethod: calcBestMethod(priority, score, dealValue, industry, rng),
    decisionTimeline: calcDecisionTimeline(priority, status, dealValue),
    ranking: calcRanking(score, priority, status, dealValue, employees, revenue, industry),
  };
}

// ---------------------------------------------------------------------------
// In-memory cache -- generate once, serve forever
// ---------------------------------------------------------------------------
let _cachedLeads = null;
let _indexByIndustry = null;
let _indexByStatus = null;
let _indexByPriority = null;

// Pool size: controlled via ?pool=5000 (default) up to 250000
const DEFAULT_POOL = 5000;
const MAX_POOL = 500000; // Scale to 500K+ leads

// Multiple pool caches for different sizes
const _poolCache = {};

function getAllLeads(poolSize = DEFAULT_POOL) {
  const size = Math.min(Math.max(poolSize, 100), MAX_POOL);
  const cacheKey = size;

  if (_poolCache[cacheKey]) return _poolCache[cacheKey];

  const leads = [];
  for (let i = 1; i <= size; i++) {
    leads.push(generateLead(i));
  }
  // Pre-sort by score descending
  leads.sort((a, b) => b.score - a.score);

  // Build indexes
  const indexByIndustry = {};
  const indexByStatus = {};
  const indexByPriority = {};
  for (const lead of leads) {
    const indKey = lead.industry.toLowerCase();
    if (!indexByIndustry[indKey]) indexByIndustry[indKey] = [];
    indexByIndustry[indKey].push(lead);

    const statKey = lead.status.toLowerCase();
    if (!indexByStatus[statKey]) indexByStatus[statKey] = [];
    indexByStatus[statKey].push(lead);

    const prioKey = lead.priority.toLowerCase();
    if (!indexByPriority[prioKey]) indexByPriority[prioKey] = [];
    indexByPriority[prioKey].push(lead);
  }

  _poolCache[cacheKey] = { leads, indexByIndustry, indexByStatus, indexByPriority };

  // Also set the legacy globals for backward compat
  _cachedLeads = leads;
  _indexByIndustry = indexByIndustry;
  _indexByStatus = indexByStatus;
  _indexByPriority = indexByPriority;

  return _poolCache[cacheKey];
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
import { guardRequest, setCacheHeaders } from './_lib/guard.js';
import { extractContacts } from './_lib/contacts.js';

export default async function handler(req, res) {
  // Apollo API passthrough — 30/min per IP is plenty, daily cap prevents quota burn
  const guard = guardRequest(req, res, {
    rateMaxPerWindow: 30,
    llmDailyCap: 0, // no LLM here, but Apollo enrichment costs real $$
    methods: ['GET'],
  });
  if (!guard.ok) {
    if (guard.handled) return;
    return res.status(guard.status).json(guard.body);
  }
  setCacheHeaders(res, 30, 15);

  try {
    const {
      page: rawPage = '1',
      limit: rawLimit = '50',
      sort: sortField = 'score',
      order: sortOrder = 'desc',
      search = '',
      industry = '',
      status = '',
      priority = '',
      minScore: rawMinScore = '0',
      source: forceSource = '',
      pool: rawPool = '5000',
      location = '',
      minEmployees = '',
      maxEmployees = '',
      action = '',
      website = '',
    } = req.query;

    // ── Person-level enrichment ────────────────────────────────────────────
    // GET /api/leads?action=enrich&website=example.com
    //
    // Apollo's person endpoints are all 403 on the Free plan (verified against
    // mixed_people/search, people/match and people/bulk_match), so individual
    // names and direct numbers are scraped from the prospect's own published
    // pages instead. Runs on demand, not per row, so opening the Leads page
    // never fires 50 crawls.
    if (action === 'enrich') {
      if (!website) return res.status(400).json({ error: 'website is required' });
      const contacts = await extractContacts(website);
      return res.status(200).json({
        website,
        ...contacts,
        _meta: {
          source: 'target-website-crawl',
          note: 'Every value is quoted from the prospect\'s own public pages. Nothing inferred.',
          fetchedAt: new Date().toISOString(),
        },
      });
    }

    const page = Math.max(parseInt(rawPage, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 50, 1), 1000); // Bumped max to 1000 for bulk ops

    // Set cache headers for CDN edge caching (Vercel, Cloudflare, etc.)
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=59');
    const minScore = Math.max(parseInt(rawMinScore, 10) || 0, 0);
    const poolSize = Math.min(Math.max(parseInt(rawPool, 10) || DEFAULT_POOL, 100), MAX_POOL);

    // -------------------------------------------------------------------
    // Apollo.io live data path — used when APOLLO_API_KEY is set
    // Pass ?source=apollo to force, or it auto-detects when key exists
    // Pass ?source=generated to force fallback data
    // -------------------------------------------------------------------
    const hasApolloKey = !!process.env.APOLLO_API_KEY;
    const useApollo = forceSource === 'apollo' || (hasApolloKey && forceSource !== 'generated');

    let apolloError = null;

    if (useApollo && hasApolloKey) {
      const apolloResult = await fetchApolloLeads({ page, limit, search, industry, location, minEmployees, maxEmployees });

      if (!apolloResult.fallback && apolloResult.leads) {
        let apolloLeads = apolloResult.leads;
        // Apollo can't filter on our computed score, so apply it here.
        if (minScore > 0) apolloLeads = apolloLeads.filter(l => l.score >= minScore);
        if (priority) apolloLeads = apolloLeads.filter(l => l.priority === priority.toLowerCase());

        const pipelineValue = apolloLeads.reduce((s, l) => s + (l.dealValue || 0), 0);
        const withPhone = apolloLeads.filter(l => l.phone).length;

        return res.status(200).json({
          leads: apolloLeads,
          total: apolloResult.total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(apolloResult.total / limit)),
          sort: sortField,
          order: sortOrder,
          filters: { search: search || null, industry: industry || null, location: location || null, status: status || null, priority: priority || null, minScore: minScore || null },
          summary: {
            totalLeads: apolloResult.total,
            returned: apolloLeads.length,
            pipelineValue,
            pipelineFormatted: fmt(pipelineValue),
            avgScore: Math.round(apolloLeads.reduce((s, l) => s + (l.score || 0), 0) / (apolloLeads.length || 1)),
            topIndustry: apolloLeads[0]?.industry || 'Unknown',
            reachableByPhone: withPhone,
            avgDealSize: Math.round(pipelineValue / (apolloLeads.length || 1)),
          },
          _meta: {
            generatedAt: new Date().toISOString(),
            dataType: 'apollo-live',
            cached: apolloResult.cached || false,
            source: 'apollo.io/organizations/search',
            granularity: 'company',
            // Honest about the plan limitation rather than faking contacts.
            contactDataAvailable: false,
            contactDataNote: 'Apollo Free plan exposes company records only. Person-level contacts (name/email/direct dial) require a paid Apollo plan.',
          },
        });
      }
      // Apollo failed — fall through to generated data, but surface why.
      apolloError = apolloResult.error || 'unknown Apollo error';
      console.warn('[GOATED] Apollo failed, falling back to generated data:', apolloError, apolloResult.detail || '');
    }

    // -------------------------------------------------------------------
    // Generated data path (fallback / default when no API key)
    // Supports ?pool=N for pools up to 250,000 leads
    // -------------------------------------------------------------------
    const pool = getAllLeads(poolSize);
    const allLeads = pool.leads;
    let filtered = allLeads;

    // -- Filter by industry (fast path using index) --
    if (industry) {
      const key = industry.toLowerCase();
      filtered = pool.indexByIndustry[key] || [];
    }

    // -- Filter by status --
    if (status) {
      const key = status.toLowerCase();
      if (industry) {
        filtered = filtered.filter(l => l.status.toLowerCase() === key);
      } else {
        filtered = pool.indexByStatus[key] || [];
      }
    }

    // -- Filter by priority --
    if (priority) {
      const key = priority.toLowerCase();
      filtered = filtered.filter(l => l.priority.toLowerCase() === key);
    }

    // -- Filter by minScore --
    if (minScore > 0) {
      filtered = filtered.filter(l => l.score >= minScore);
    }

    // -- Search --
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.industry.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q)
      );
    }

    // -- Sort --
    const validSortFields = ['score', 'name', 'company', 'value', 'dealValue', 'priority', 'status', 'industry', 'created_at', 'last_activity', 'location'];
    const sf = validSortFields.includes(sortField) ? sortField : 'score';
    const dir = sortOrder === 'asc' ? 1 : -1;

    // Only sort if not already sorted by score desc (the default)
    if (sf !== 'score' || dir !== -1) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sf];
        const bVal = b[sf];
        if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
        return String(aVal || '').localeCompare(String(bVal || '')) * dir;
      });
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const paginatedLeads = filtered.slice(offset, offset + limit);

    // -- Summary stats --
    const allLeadsRef = allLeads;
    const pipelineValue = allLeadsRef.reduce((s, l) => s + l.dealValue, 0);
    const avgScore = Math.round(allLeadsRef.reduce((s, l) => s + l.score, 0) / allLeadsRef.length);
    const wonCount = allLeadsRef.filter(l => l.status === 'won').length;
    const lostCount = allLeadsRef.filter(l => l.status === 'lost').length;
    const closedCount = wonCount + lostCount;
    const activeCount = allLeadsRef.filter(l => ['qualified', 'proposal', 'negotiation'].includes(l.status)).length;
    const criticalCount = allLeadsRef.filter(l => l.priority === 'critical').length;
    const risingCount = allLeadsRef.filter(l => l.momentum === 'rising').length;

    // Industry breakdown
    const industryBreakdown = {};
    for (const key of Object.keys(pool.indexByIndustry)) {
      industryBreakdown[key] = pool.indexByIndustry[key].length;
    }

    // Top industry by lead count
    const topIndustryEntry = Object.entries(industryBreakdown).sort((a, b) => b[1] - a[1])[0];
    const topIndustry = topIndustryEntry ? topIndustryEntry[0].charAt(0).toUpperCase() + topIndustryEntry[0].slice(1) : 'Unknown';

    // Status breakdown
    const statusBreakdown = {};
    for (const key of Object.keys(pool.indexByStatus)) {
      statusBreakdown[key] = pool.indexByStatus[key].length;
    }

    // Win rate: won / (won + lost) -- standard sales metric
    const winRate = closedCount > 0
      ? parseFloat(((wonCount / closedCount) * 100).toFixed(1))
      : 0;

    return res.status(200).json({
      leads: paginatedLeads,
      total,
      page,
      limit,
      totalPages,
      sort: sf,
      order: sortOrder === 'asc' ? 'asc' : 'desc',
      filters: {
        search: search || null,
        industry: industry || null,
        status: status || null,
        priority: priority || null,
        minScore: minScore || null,
      },
      summary: {
        totalLeads: allLeadsRef.length,
        pipelineValue,
        pipelineFormatted: fmt(pipelineValue),
        avgScore,
        topIndustry,
        wonDeals: wonCount,
        winRate,
        activeDeals: activeCount,
        criticalLeads: criticalCount,
        risingMomentum: risingCount,
        avgDealSize: Math.round(pipelineValue / allLeadsRef.length),
        avgDealFormatted: fmt(Math.round(pipelineValue / allLeadsRef.length)),
        industryBreakdown,
        statusBreakdown,
      },
      _meta: {
        generatedAt: new Date().toISOString(),
        dataType: hasApolloKey ? 'generated-fallback' : 'generated',
        // Explicit flag the UI must respect — these records are synthetic.
        isSyntheticData: true,
        cached: true,
        totalInPool: poolSize,
        apolloAvailable: hasApolloKey,
        apolloError,
        note: apolloError
          ? `Synthetic data. Apollo call failed: ${apolloError}`
          : hasApolloKey
            ? 'Synthetic data. Apollo key present — pass ?source=apollo with a search/industry/location to pull live companies.'
            : 'Synthetic data. Set APOLLO_API_KEY for live Apollo.io company data.',
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
      _meta: { generatedAt: new Date().toISOString() },
    });
  }
}
