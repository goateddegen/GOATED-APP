// =============================================================================
// GOATED Solutions - Multi-Source Lead Scraping Engine
// =============================================================================
// Endpoint: POST /api/scrape
//
// POST Body (JSON):
//   - sources:          string[] — which scrapers to query
//                       Options: "apollo", "hunter", "goated"
//   - targetIndustries: string[] — industries to target
//   - targetLocations:  string[] — geographic filters
//   - targetTitles:     string[] — job title filters
//   - minEmployees:     number   — minimum company employee count
//   - maxEmployees:     number   — maximum company employee count
//   - keywords:         string   — freeform keyword search
//   - batchSize:        number   — leads per source (default: 100, max: 250000)
//   - page:             number   — pagination page (default: 1)
//
// GET /api/scrape — returns available sources, their status, and config
//
// Features:
//   - Parallel multi-source scraping (Apollo.io, Hunter.io, GOATED engine)
//   - Deduplication by email or name+company composite key
//   - Quality scoring (0-100) based on data completeness
//   - In-memory job caching for large batches (30 min TTL)
//   - Unified lead format across all sources
//   - CORS headers
// =============================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ---------------------------------------------------------------------------
// In-memory job cache — 30 minute TTL for large batch results
// ---------------------------------------------------------------------------
const jobCache = new Map();
const JOB_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function buildCacheKey(params) {
  return JSON.stringify({
    sources: params.sources,
    targetIndustries: params.targetIndustries,
    targetLocations: params.targetLocations,
    targetTitles: params.targetTitles,
    minEmployees: params.minEmployees,
    maxEmployees: params.maxEmployees,
    keywords: params.keywords,
    batchSize: params.batchSize,
    page: params.page,
  });
}

function getCachedResult(key) {
  const entry = jobCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > JOB_CACHE_TTL) {
    jobCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedResult(key, data) {
  // Evict stale entries when cache grows large
  if (jobCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of jobCache) {
      if (now - v.timestamp > JOB_CACHE_TTL) jobCache.delete(k);
    }
  }
  jobCache.set(key, { data, timestamp: Date.now() });
}

// ---------------------------------------------------------------------------
// Source 1: Apollo.io — B2B contacts via POST
// ---------------------------------------------------------------------------
async function scrapeApollo({
  targetIndustries,
  targetLocations,
  targetTitles,
  minEmployees,
  maxEmployees,
  keywords,
  batchSize,
  page,
}) {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    return {
      leads: [],
      meta: { available: false, reason: 'APOLLO_API_KEY not set' },
    };
  }

  try {
    const perPage = Math.min(batchSize, 100); // Apollo caps at 100 per page

    const body = {
      api_key: apiKey,
      page: page || 1,
      per_page: perPage,
    };

    // Titles filter
    if (targetTitles && targetTitles.length > 0) {
      body.person_titles = targetTitles;
    } else {
      body.person_titles = [
        'CEO',
        'Founder',
        'Owner',
        'VP Sales',
        'Head of Marketing',
        'CTO',
        'COO',
        'CMO',
        'Director',
      ];
    }

    // Keywords
    if (keywords) {
      body.q_keywords = keywords;
    }

    // Locations
    if (targetLocations && targetLocations.length > 0) {
      body.person_locations = targetLocations;
    }

    // Industries
    if (targetIndustries && targetIndustries.length > 0) {
      body.organization_industries = targetIndustries;
    }

    // Employee ranges
    if (minEmployees != null || maxEmployees != null) {
      const min = minEmployees || 1;
      const max = maxEmployees || 10000;
      body.organization_num_employees_ranges = [`${min},${max}`];
    }

    const res = await fetch(
      'https://api.apollo.io/api/v1/mixed_people/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Apollo API ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const people = data.people || data.contacts || [];

    return {
      leads: people.map((p, i) => ({
        _sourceId: `apollo_${p.id || i}`,
        _source: 'apollo',
        name:
          p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        email: p.email || null,
        emailVerified: p.email_status === 'verified',
        phone: p.phone_numbers?.[0]?.sanitized_number || null,
        company: p.organization?.name || null,
        title: p.title || null,
        industry: p.organization?.industry || null,
        employees: p.organization?.estimated_num_employees || null,
        revenue: p.organization?.annual_revenue || null,
        location:
          [p.city, p.state, p.country].filter(Boolean).join(', ') || null,
        website:
          p.organization?.website_url ||
          p.organization?.primary_domain ||
          null,
        linkedin: p.linkedin_url || null,
        techStack: (p.organization?.current_technologies || []).slice(0, 15),
        fundingRound: p.organization?.latest_funding_round_type || null,
        fundingAmount: p.organization?.total_funding || null,
        keywords: p.organization?.keywords || [],
        rawData: { apolloId: p.id, emailStatus: p.email_status },
      })),
      meta: {
        available: true,
        source: 'apollo',
        total: data.pagination?.total_entries || people.length,
        fetched: people.length,
        page: data.pagination?.page || page,
        totalPages: data.pagination?.total_pages || 1,
      },
    };
  } catch (err) {
    console.error('[GOATED] Apollo scrape error:', err.message);
    return {
      leads: [],
      meta: { available: true, source: 'apollo', error: err.message },
    };
  }
}

// ---------------------------------------------------------------------------
// Source 2: Hunter.io — Email finder via GET domain-search
// ---------------------------------------------------------------------------
async function scrapeHunter({ keywords, batchSize, page }) {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) {
    return {
      leads: [],
      meta: { available: false, reason: 'HUNTER_API_KEY not set' },
    };
  }

  try {
    // Hunter requires a domain to search
    const domain = extractDomain(keywords);
    if (!domain) {
      return {
        leads: [],
        meta: {
          available: true,
          source: 'hunter',
          error:
            'Hunter.io requires a domain in the keywords field (e.g., "example.com")',
        },
      };
    }

    const limit = Math.min(batchSize, 100);
    const offset = ((page || 1) - 1) * limit;
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(
      domain
    )}&api_key=${apiKey}&limit=${limit}&offset=${offset}`;

    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Hunter API ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const emails = data.data?.emails || [];
    const orgName = data.data?.organization || domain;

    return {
      leads: emails.map((e, i) => ({
        _sourceId: `hunter_${e.value || i}`,
        _source: 'hunter',
        name: [e.first_name, e.last_name].filter(Boolean).join(' ') || null,
        email: e.value || null,
        emailVerified: e.verification?.status === 'valid',
        phone: e.phone_number || null,
        company: orgName,
        title: e.position || null,
        industry: null,
        employees: null,
        revenue: null,
        location: null,
        website: domain,
        linkedin: e.linkedin || null,
        techStack: [],
        keywords: [],
        rawData: {
          confidence: e.confidence,
          type: e.type,
          department: e.department,
        },
      })),
      meta: {
        available: true,
        source: 'hunter',
        total: data.data?.total || emails.length,
        fetched: emails.length,
        domain,
        webmail: data.data?.webmail || false,
      },
    };
  } catch (err) {
    console.error('[GOATED] Hunter scrape error:', err.message);
    return {
      leads: [],
      meta: { available: true, source: 'hunter', error: err.message },
    };
  }
}

function extractDomain(str) {
  if (!str) return null;
  const match = str.match(
    /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/
  );
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Source 3: GOATED Engine — deterministic seeded lead generation (always on)
// ---------------------------------------------------------------------------
function scrapeGoated({
  targetIndustries,
  targetLocations,
  targetTitles,
  minEmployees,
  maxEmployees,
  keywords,
  batchSize,
  page,
}) {
  const effectiveBatch = Math.min(batchSize || 100, 250000);
  const effectivePage = page || 1;
  const offset = (effectivePage - 1) * effectiveBatch;

  const seedInput = JSON.stringify({
    targetIndustries,
    targetLocations,
    targetTitles,
    keywords,
  });
  const baseSeed = hashString(seedInput);

  const leads = [];
  for (let i = 0; i < effectiveBatch; i++) {
    const idx = offset + i;
    const rng = seededRng(baseSeed + idx * 7919 + 104729);

    const firstName = pick(FIRST_NAMES, rng);
    const lastName = pick(LAST_NAMES, rng);
    const company = pick(SMB_COMPANIES, rng);
    const companySlug = company.toLowerCase().replace(/[^a-z0-9]/g, '');
    const employees = Math.floor(rng() * 495) + 5;

    // Apply employee filters
    if (minEmployees != null && employees < minEmployees) continue;
    if (maxEmployees != null && employees > maxEmployees) continue;

    const leadIndustry =
      targetIndustries && targetIndustries.length > 0
        ? pick(targetIndustries, rng)
        : pick(INDUSTRIES, rng);

    const leadLocation =
      targetLocations && targetLocations.length > 0
        ? pick(targetLocations, rng)
        : pick(LOCATIONS, rng);

    const leadTitle =
      targetTitles && targetTitles.length > 0
        ? pick(targetTitles, rng)
        : pick(TITLES, rng);

    const revenue = Math.floor(rng() * 19900000) + 100000;
    const momentum = pick(['rising', 'stable', 'declining', 'surging'], rng);
    const techStackStr = pick(TECH_STACKS, rng);

    leads.push({
      _sourceId: `goated_${idx}`,
      _source: 'goated',
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companySlug}.com`,
      emailVerified: false,
      phone: `+1 (${Math.floor(rng() * 900) + 100}) ${
        Math.floor(rng() * 900) + 100
      }-${Math.floor(rng() * 9000) + 1000}`,
      company,
      title: leadTitle,
      industry: leadIndustry,
      employees,
      revenue,
      location: leadLocation,
      website: `https://${companySlug}.com`,
      linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${
        Math.floor(rng() * 900000) + 100000
      }`,
      techStack: techStackStr.split(' + ').map((s) => s.trim()),
      keywords: keywords
        ? [keywords.toLowerCase(), leadIndustry.toLowerCase()]
        : [leadIndustry.toLowerCase()],
      rawData: { momentum, generatedIndex: idx },
    });
  }

  return {
    leads,
    meta: {
      available: true,
      source: 'goated',
      total: leads.length,
      fetched: leads.length,
      page: effectivePage,
      capacity: '250K leads',
    },
  };
}

// ---------------------------------------------------------------------------
// GOATED engine data pools
// ---------------------------------------------------------------------------
const SMB_COMPANIES = [
  'Flowstate', 'BrightPath', 'LeadVault', 'CloserIQ', 'PipelineHQ',
  'DealForge', 'Revly', 'Quotient Systems', 'NimbusOps', 'Trellis Software',
  'StackedCRM', 'LaunchGrid', 'SyncWave', 'SignalPeak', 'Trackwise',
  'Evergreen Goods Co', 'The Daily Drip', 'Coastal Collective', 'Urban Sage',
  'Rooted Supply Co', 'Summit Marketing Co', 'Ironclad Creative',
  'Northbound Digital', 'Clearpoint Agency', 'Ember & Oak Media',
  'NexGen Roofing', 'Apex Plumbing Solutions', 'TrueNorth HVAC',
  'Keystone Electric', 'GreenLeaf Landscaping', 'PennyWise Financial',
  'TrustBridge Payments', 'ClearLedger', 'FundStack', 'CoinPath',
  'Pinnacle Dental Group', 'Lakeside Family Medicine',
  'BrightSmile Orthodontics', 'Crossroads Chiropractic',
  'TrueForm Manufacturing', 'Ironworks Precision',
  'Atlas Metal Fabrication', 'Redline Machine Works',
  'Vantage Point Consulting', 'Bridgewater Advisory',
  'Northstar Strategy Group', 'Keystone Business Advisors',
  'Hearthstone Realty', 'Crestview Properties', 'Irongate Real Estate',
  'Compass Point Realty', 'IronPulse Fitness', 'ZenForge Wellness',
  'PeakForm Athletics', 'CoreLife Studio', 'Golden Grain Bakery',
  'The Copper Kettle', 'BaseCamp Coffee Roasters', 'Juniper & Thyme',
  'Storyline Media', 'RedThread Content', 'Amplify Studios',
  'PixelForge Media', 'Ironside Construction', 'BluePrint Builders',
  'Cornerstone General Contracting', 'Ridgecrest Construction',
  'Whitfield & Associates', 'Sterling Legal Group', 'Brookstone Law',
  'Clearwater Legal Partners', 'Ledger & Lane CPAs', 'Clearpath Accounting',
  'Summit Tax Advisors', 'Keystone Financial Group',
  'Sentinel Insurance Group', 'TrueShield Insurance',
  'Crestline Insurance Partners', 'Ironclad Coverage',
  'TalentForge Staffing', 'Bridgework Recruiting', 'PeakHire Solutions',
  'Pipeline People Co', 'SwiftRoute Logistics', 'Trailhead Freight',
  'ClearPath Shipping', 'Greenway Logistics', 'TerraCraft Supply',
  'The Artisan Vault', 'WildEdge Outdoor Co', 'PurePath Organics',
  'Catalyst Growth Partners', 'Basecamp Digital', 'Slingshot Creative',
  'Whiteboard Agency', 'Foxhound Media', 'Ridgeline Marketing',
  'Groundswell Agency', 'Clockwork Digital', 'BlueVine Capital',
  'Greenback Solutions', 'LedgerPoint', 'PayStream Pro',
  'MintEdge Financial', 'Harmony Physical Therapy',
  'Everwell Health Partners', 'Sunrise Pediatrics', 'ClearView Eye Center',
  'Sterling Components', 'HarborLight Manufacturing',
  'Midwest Precision Parts', 'CrestLine Industries',
];

const FIRST_NAMES = [
  'James', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Chris',
  'Amanda', 'Matt', 'Rachel', 'Alex', 'Nicole', 'Ryan', 'Taylor', 'Jordan',
  'Morgan', 'Andrew', 'Samantha', 'Brian', 'Lauren', 'Kevin', 'Megan',
  'Jason', 'Stephanie', 'Justin', 'Ashley', 'Brandon', 'Rebecca', 'Tyler',
  'Hannah', 'Daniel', 'Olivia', 'Nathan', 'Sophia', 'Ethan', 'Isabella',
  'Lucas', 'Emma', 'Mason', 'Ava', 'Raj', 'Priya', 'Wei', 'Mei', 'Carlos',
  'Maria', 'Ahmed', 'Fatima', 'Hans', 'Anna', 'Pierre', 'Claire', 'Marco',
  'Sofia', 'Lars', 'Ingrid',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Wilson', 'Anderson', 'Chen', 'Kumar', 'Park', 'Lee', 'Taylor',
  'Thomas', 'Moore', 'Jackson', 'Martin', 'White', 'Harris', 'Clark',
  'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright',
  'Scott', 'Patel', 'Singh', 'Sharma', 'Nguyen', 'Tran', 'Kim', 'Zhang',
  'Wang', 'Li', 'Liu', 'Muller', 'Schmidt', 'Rossi', 'Fernandez', 'Lopez',
  'Martinez', 'Gonzalez', 'Rodriguez', 'Hernandez', 'Diaz',
];

const TITLES = [
  'Owner', 'Founder', 'CEO', 'President', 'COO', 'VP of Sales',
  'Head of Marketing', 'CTO', 'Director of Operations', 'Sales Manager',
  'Marketing Director', 'Business Development Manager', 'Head of Growth',
  'Managing Partner', 'General Manager', 'Creative Director',
  'Practice Manager', 'Branch Manager', 'CMO', 'VP of Engineering',
  'Chief Revenue Officer', 'Director of Sales',
];

const INDUSTRIES = [
  'SaaS', 'Fintech', 'E-commerce', 'Healthcare', 'EdTech', 'Cybersecurity',
  'AI/ML', 'MarTech', 'PropTech', 'InsurTech', 'LegalTech', 'CleanTech',
  'BioTech', 'FoodTech', 'HRTech', 'Construction', 'Logistics', 'Retail',
  'Manufacturing', 'Consulting',
];

const LOCATIONS = [
  'San Francisco', 'New York', 'Austin', 'Seattle', 'Boston', 'Chicago',
  'Denver', 'Miami', 'Los Angeles', 'Portland', 'Nashville', 'Atlanta',
  'Dallas', 'Phoenix', 'San Diego', 'Philadelphia', 'Minneapolis', 'Tampa',
  'Orlando', 'Raleigh', 'Salt Lake City', 'Detroit',
];

const TECH_STACKS = [
  'Salesforce + HubSpot',
  'Pipedrive + Mailchimp',
  'HubSpot + Outreach',
  'Salesforce + Gong + ZoomInfo',
  'None - manual process',
  'Custom CRM + Excel',
  'Zoho CRM + SendGrid',
  'Monday.com + Slack',
  'Freshsales + Freshdesk',
  'Close.io + Intercom',
  'ActiveCampaign + Zapier',
  'Copper + Gmail',
];

// ---------------------------------------------------------------------------
// Seeded RNG utilities
// ---------------------------------------------------------------------------
function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash || 1;
}

// ---------------------------------------------------------------------------
// Deduplication — by email or name+company composite key
// ---------------------------------------------------------------------------
function deduplicateLeads(allLeads) {
  const seen = new Map();
  const merged = [];

  for (const lead of allLeads) {
    const key = lead.email
      ? lead.email.toLowerCase()
      : `${(lead.name || '').toLowerCase()}::${(lead.company || '').toLowerCase()}`;

    if (!key || key === '::') {
      // No dedup key possible, keep the lead as-is
      merged.push({ ...lead, _sources: [lead._source], _dedupKey: null });
      continue;
    }

    if (seen.has(key)) {
      const existing = seen.get(key);
      existing._sources.push(lead._source);
      // Merge: fill in missing fields from the new source
      for (const [field, value] of Object.entries(lead)) {
        if (field.startsWith('_')) continue;
        if (value && !existing[field]) {
          existing[field] = value;
        }
        // Prefer longer tech stacks
        if (
          field === 'techStack' &&
          Array.isArray(value) &&
          value.length > (existing.techStack?.length || 0)
        ) {
          existing.techStack = value;
        }
      }
    } else {
      const entry = { ...lead, _sources: [lead._source], _dedupKey: key };
      seen.set(key, entry);
      merged.push(entry);
    }
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Quality scoring — 0 to 100 based on data completeness
// ---------------------------------------------------------------------------
function scoreLeads(leads) {
  return leads
    .map((lead) => {
      let score = 0;

      // Contact info completeness (up to 50)
      if (lead.email) score += 15;
      if (lead.emailVerified) score += 15;
      if (lead.phone) score += 10;
      if (lead.name) score += 5;
      if (lead.linkedin) score += 5;

      // Company data completeness (up to 35)
      if (lead.company) score += 5;
      if (lead.title) score += 5;
      if (lead.industry) score += 5;
      if (lead.employees) score += 5;
      if (lead.revenue) score += 5;
      if (lead.location) score += 5;
      if (lead.website) score += 5;

      // Enrichment indicators (up to 20)
      if (lead.techStack && lead.techStack.length > 0) score += 5;
      if (lead.techStack && lead.techStack.length >= 3) score += 5;
      if (lead.fundingRound) score += 5;
      if (lead.fundingAmount) score += 5;

      // Multi-source bonus
      if (lead._sources && lead._sources.length > 1) {
        score += 10 * (lead._sources.length - 1);
      }

      lead.qualityScore = Math.min(100, score);
      lead.scoreBreakdown = {
        contactInfo: Math.min(
          50,
          (lead.email ? 15 : 0) +
            (lead.emailVerified ? 15 : 0) +
            (lead.phone ? 10 : 0) +
            (lead.name ? 5 : 0) +
            (lead.linkedin ? 5 : 0)
        ),
        companyData: Math.min(
          35,
          (lead.company ? 5 : 0) +
            (lead.title ? 5 : 0) +
            (lead.industry ? 5 : 0) +
            (lead.employees ? 5 : 0) +
            (lead.revenue ? 5 : 0) +
            (lead.location ? 5 : 0) +
            (lead.website ? 5 : 0)
        ),
        enrichment: Math.min(
          20,
          (lead.techStack?.length > 0 ? 5 : 0) +
            (lead.techStack?.length >= 3 ? 5 : 0) +
            (lead.fundingRound ? 5 : 0) +
            (lead.fundingAmount ? 5 : 0)
        ),
        multiSourceBonus:
          lead._sources?.length > 1
            ? 10 * (lead._sources.length - 1)
            : 0,
      };

      return lead;
    })
    .sort((a, b) => b.qualityScore - a.qualityScore);
}

// ---------------------------------------------------------------------------
// Source registry
// ---------------------------------------------------------------------------
const SOURCE_REGISTRY = {
  apollo: {
    fn: scrapeApollo,
    name: 'Apollo.io',
    description: 'B2B contacts and company data via POST search',
    type: 'people',
    envKey: 'APOLLO_API_KEY',
    isAsync: true,
  },
  hunter: {
    fn: scrapeHunter,
    name: 'Hunter.io',
    description: 'Email finder via GET domain search',
    type: 'email',
    envKey: 'HUNTER_API_KEY',
    isAsync: true,
  },
  goated: {
    fn: scrapeGoated,
    name: 'GOATED Engine',
    description:
      'Built-in deterministic lead generation, always available, scales to 250K',
    type: 'generated',
    envKey: null,
    isAsync: false,
  },
};

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  // -----------------------------------------------------------------------
  // GET — return available sources and their status
  // -----------------------------------------------------------------------
  if (req.method === 'GET') {
    const sources = {};
    for (const [key, cfg] of Object.entries(SOURCE_REGISTRY)) {
      sources[key] = {
        name: cfg.name,
        description: cfg.description,
        type: cfg.type,
        available: cfg.envKey ? !!process.env[cfg.envKey] : true,
        envKey: cfg.envKey || '(none - always available)',
      };
    }

    const activeSources = Object.values(sources).filter(
      (s) => s.available
    ).length;

    // Cache stats
    let activeCacheEntries = 0;
    const now = Date.now();
    for (const [, v] of jobCache) {
      if (now - v.timestamp <= JOB_CACHE_TTL) activeCacheEntries++;
    }

    return res.status(200).json({
      sources,
      activeSources,
      totalSources: Object.keys(sources).length,
      maxBatchSize: 250000,
      cache: {
        totalEntries: jobCache.size,
        activeEntries: activeCacheEntries,
        ttlMinutes: 30,
      },
      params: {
        sources:
          'string[] -- which sources to query (default: all available)',
        targetIndustries: 'string[] -- industries to target',
        targetLocations: 'string[] -- geographic locations',
        targetTitles: 'string[] -- job title filters',
        minEmployees: 'number -- minimum company employee count',
        maxEmployees: 'number -- maximum company employee count',
        keywords:
          'string -- freeform keyword search (include a domain for Hunter.io)',
        batchSize: 'number -- leads per source (default: 100, max: 250000)',
        page: 'number -- pagination page (default: 1)',
      },
      _meta: {
        version: '2.0',
        engine: 'GOATED Multi-Source Scraping Engine',
        timestamp: new Date().toISOString(),
      },
    });
  }

  // -----------------------------------------------------------------------
  // POST — scrape leads from selected sources
  // -----------------------------------------------------------------------
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed. Use GET for status or POST to scrape.',
    });
  }

  try {
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    const params = {
      sources: Array.isArray(body.sources)
        ? body.sources.filter((s) => SOURCE_REGISTRY[s])
        : null,
      targetIndustries: Array.isArray(body.targetIndustries)
        ? body.targetIndustries
        : [],
      targetLocations: Array.isArray(body.targetLocations)
        ? body.targetLocations
        : [],
      targetTitles: Array.isArray(body.targetTitles)
        ? body.targetTitles
        : [],
      minEmployees:
        body.minEmployees != null
          ? parseInt(body.minEmployees) || null
          : null,
      maxEmployees:
        body.maxEmployees != null
          ? parseInt(body.maxEmployees) || null
          : null,
      keywords: body.keywords || '',
      batchSize: Math.min(
        Math.max(parseInt(body.batchSize) || 100, 1),
        250000
      ),
      page: Math.max(parseInt(body.page) || 1, 1),
    };

    // Check job cache first
    const jobKey = buildCacheKey(params);
    const cachedResult = getCachedResult(jobKey);
    if (cachedResult) {
      return res.status(200).json({
        ...cachedResult,
        _meta: {
          ...cachedResult._meta,
          cached: true,
          cacheHit: true,
        },
      });
    }

    // Determine which sources to use
    let sourceKeys;
    if (params.sources && params.sources.length > 0) {
      sourceKeys = params.sources;
    } else {
      // Auto-select all available sources
      sourceKeys = Object.entries(SOURCE_REGISTRY)
        .filter(([, cfg]) =>
          cfg.envKey ? !!process.env[cfg.envKey] : true
        )
        .map(([key]) => key);
    }

    // Always include goated as fallback if nothing else is available
    if (sourceKeys.length === 0) {
      sourceKeys = ['goated'];
    }

    // Scrape all sources in parallel
    const startTime = Date.now();
    const results = await Promise.allSettled(
      sourceKeys.map(async (key) => {
        const cfg = SOURCE_REGISTRY[key];
        const result = cfg.isAsync
          ? await cfg.fn(params)
          : cfg.fn(params);
        return { key, ...result };
      })
    );

    // Collect leads and metadata
    let allLeads = [];
    const sourceMeta = {};
    const errors = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { key, leads, meta } = result.value;
        allLeads.push(...leads);
        sourceMeta[key] = meta;
        if (meta.error) errors.push({ source: key, error: meta.error });
      } else {
        const errMsg = result.reason?.message || 'Unknown error';
        console.error('[GOATED] Source scrape failed:', errMsg);
        errors.push({ source: 'unknown', error: errMsg });
      }
    }

    // Deduplicate across sources
    let finalLeads = deduplicateLeads(allLeads);

    // Quality scoring
    finalLeads = scoreLeads(finalLeads);

    const elapsed = Date.now() - startTime;

    const responseData = {
      leads: finalLeads,
      total: finalLeads.length,
      sources: sourceMeta,
      sourcesUsed: sourceKeys,
      errors: errors.length > 0 ? errors : undefined,
      query: {
        targetIndustries: params.targetIndustries,
        targetLocations: params.targetLocations,
        targetTitles: params.targetTitles,
        minEmployees: params.minEmployees,
        maxEmployees: params.maxEmployees,
        keywords: params.keywords,
        batchSize: params.batchSize,
        page: params.page,
      },
      processing: {
        elapsedMs: elapsed,
        rawLeads: allLeads.length,
        afterDedup: finalLeads.length,
        duplicatesRemoved: allLeads.length - finalLeads.length,
        avgQualityScore:
          finalLeads.length > 0
            ? Math.round(
                finalLeads.reduce((s, l) => s + l.qualityScore, 0) /
                  finalLeads.length
              )
            : 0,
      },
      _meta: {
        engine: 'GOATED Multi-Source Scraping Engine v2.0',
        generatedAt: new Date().toISOString(),
        cached: false,
        cacheHit: false,
      },
    };

    // Cache the result for non-trivial batches
    if (params.batchSize >= 50) {
      setCachedResult(jobKey, responseData);
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('[GOATED] Scrape engine error:', error);
    return res.status(500).json({
      error: 'Scrape engine error',
      message: error.message,
      leads: [],
      _meta: { generatedAt: new Date().toISOString() },
    });
  }
}
