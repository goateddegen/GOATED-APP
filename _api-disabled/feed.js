// =============================================================================
// GOATED Solutions - Personalized Data Feed API
// =============================================================================
// Endpoints:
//   GET  /api/feed  — Retrieve a personalized feed for a user
//   POST /api/feed  — Create or update a user profile
//
// GET Query Parameters:
//   - user_id:  string  (required — user identifier)
//   - type:     "leads" | "trends" | "competitors" | "opportunities" | "all"
//                        (default: "all")
//   - limit:    number  (results per section, default: 25, max: 100)
//   - refresh:  "true" | "false" (force cache bypass, default: false)
//
// POST Body (JSON):
//   { user_id: string, ...profileFields }
//
// The feed is fully deterministic for the same user_id + query combination
// (seeded PRNG). Each section is independent — a failure in one section does
// not prevent the others from returning data.
//
// No external API keys required. All data is generated in-memory.
// =============================================================================

const ALLOWED_ORIGINS = [process.env.CORS_ORIGIN || 'https://goated.solutions', 'http://localhost:5173', 'http://localhost:5174'];
function getCorsOrigin(req) {
  const origin = req.headers?.origin || '';
  if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) return origin;
  return ALLOWED_ORIGINS[0];
}
const getCorsHeaders = (req) => ({
  'Access-Control-Allow-Origin': getCorsOrigin(req),
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
});

// ---------------------------------------------------------------------------
// Seeded PRNG — deterministic results for the same seed
// ---------------------------------------------------------------------------
function seededRandom(seed) {
  let s = typeof seed === 'number' ? seed : hashString(String(seed));
  // Ensure positive non-zero seed
  s = ((s % 2147483646) + 2147483646) % 2147483646;
  if (s === 0) s = 1;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN(arr, n, rng) {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function fmt(v) {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v}`;
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// ---------------------------------------------------------------------------
// Reference data pools
// ---------------------------------------------------------------------------
const INDUSTRIES = [
  'SaaS', 'Fintech', 'E-commerce', 'Healthcare', 'EdTech', 'DevTools',
  'Cybersecurity', 'AI/ML', 'MarTech', 'PropTech', 'InsurTech', 'LegalTech',
  'AgTech', 'CleanTech', 'BioTech', 'MedTech', 'FoodTech', 'HRTech',
  'AdTech', 'RegTech', 'SupplyChain', 'Logistics', 'Gaming', 'Media',
  'Telecom', 'Automotive', 'Aerospace', 'Energy', 'Retail', 'Construction',
  'Travel', 'Hospitality', 'Entertainment', 'Sports', 'Fashion',
];

const COMPANIES = [
  'Flowstate', 'BrightPath', 'LeadVault', 'CloserIQ', 'PipelineHQ',
  'DealForge', 'Revly', 'Quotient Systems', 'NimbusOps', 'Trellis Software',
  'StackedCRM', 'LaunchGrid', 'SyncWave', 'SignalPeak', 'Trackwise',
  'Evergreen Goods Co', 'The Daily Drip', 'Coastal Collective', 'Urban Sage',
  'Rooted Supply Co', 'Goldenrod Market', 'The Nomad Shop', 'Willow Creek Goods',
  'Copper & Thread', 'Little Wolf Co', 'Summit Marketing Co', 'Ironclad Creative',
  'Northbound Digital', 'Clearpoint Agency', 'Ember & Oak Media',
  'Catalyst Growth Partners', 'Basecamp Digital', 'Slingshot Creative',
  'Whiteboard Agency', 'Foxhound Media', 'Ridgeline Marketing',
  'Groundswell Agency', 'Clockwork Digital', 'Trailhead Studios',
  'Mosaic Creative Group', 'NexGen Roofing', 'Apex Plumbing Solutions',
  'TrueNorth HVAC', 'Keystone Electric', 'GreenLeaf Landscaping',
  'ProEdge Painting', 'AllClear Pest Control', 'Benchmark Home Services',
  'LevelUp Cleaning Co', 'Cornerstone Builders', 'PennyWise Financial',
  'TrustBridge Payments', 'ClearLedger', 'FundStack', 'CoinPath',
  'BlueVine Capital', 'Greenback Solutions', 'LedgerPoint', 'PayStream Pro',
  'MintEdge Financial', 'Pinnacle Dental Group', 'Lakeside Family Medicine',
  'BrightSmile Orthodontics', 'Crossroads Chiropractic', 'Harmony Physical Therapy',
  'Everwell Health Partners', 'Sunrise Pediatrics', 'ClearView Eye Center',
  'Oakwood Medical Associates', 'Valley Urgent Care', 'Ridgeview Dermatology',
  'Summit Orthopedic Group', 'TrueForm Manufacturing', 'Ironworks Precision',
  'Atlas Metal Fabrication', 'Redline Machine Works', 'Sterling Components',
  'HarborLight Manufacturing', 'Midwest Precision Parts', 'CrestLine Industries',
  'Vantage Point Consulting', 'Bridgewater Advisory', 'Northstar Strategy Group',
  'Keystone Business Advisors', 'Claritix Consulting', 'Pivotal Growth Partners',
  'Trident Advisory Group', 'Meridian Consulting', 'Hearthstone Realty',
  'Crestview Properties', 'Irongate Real Estate', 'Compass Point Realty',
  'Redwood Property Group', 'Bluewater Homes', 'Keystone Realty Partners',
  'Sunstone Properties', 'IronPulse Fitness', 'ZenForge Wellness',
  'PeakForm Athletics', 'CoreLife Studio', 'Elevate Gym Co',
  'Vitality Wellness Center', 'Grounded Yoga Collective', 'StrideRight Fitness',
  'Golden Grain Bakery', 'The Copper Kettle', 'BaseCamp Coffee Roasters',
  'Juniper & Thyme', 'Fieldstone Brewing Co', 'SunHarvest Juicery',
  'Ember Grill House', 'Sagebrush Catering', 'Storyline Media',
  'RedThread Content', 'Amplify Studios', 'LoudSpeaker Media',
  'Inkwell Content Co', 'FrameShift Productions', 'PixelForge Media',
  'NarrativeLab', 'Ironside Construction', 'BluePrint Builders',
  'Cornerstone General Contracting', 'Ridgecrest Construction',
  'SteelBridge Contractors', 'Foundation First Builders', 'TrueLevel Construction',
  'Granite Peak Builders', 'Whitfield & Associates', 'Sterling Legal Group',
  'Brookstone Law', 'Clearwater Legal Partners', 'Ridgemont Law Firm',
  'Trailmark Legal', 'Ironwood Law Group', 'Harborside Legal Advisors',
  'Ledger & Lane CPAs', 'Clearpath Accounting', 'Summit Tax Advisors',
  'Keystone Financial Group', 'Truemark CPAs', 'Northpoint Accounting',
  'Bridgeway Tax Services', 'Goldcrest Financial', 'Sentinel Insurance Group',
  'TrueShield Insurance', 'Crestline Insurance Partners', 'Ironclad Coverage',
  'Ridgepoint Insurance', 'SafeHarbor Insurance', 'Pathfinder Insurance Group',
  'Beacon Risk Advisors', 'TalentForge Staffing', 'Bridgework Recruiting',
  'PeakHire Solutions', 'Keystaffing', 'Northbound Talent',
  'TrueFind Recruiting', 'Pipeline People Co', 'MatchPoint Staffing',
  'SwiftRoute Logistics', 'Trailhead Freight', 'ClearPath Shipping',
  'PointToPoint Logistics', 'Ironline Transport', 'Ridgerun Delivery Co',
  'Greenway Logistics', 'SteadyHaul Freight', 'TerraCraft Supply',
  'The Artisan Vault', 'WildEdge Outdoor Co', 'Hearthside Home Goods',
  'Oakline Pet Supply', 'ThreadBound Apparel', 'GearForge Equipment',
  'PurePath Organics',
];

const FIRST_NAMES = [
  'James', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Chris', 'Amanda',
  'Matt', 'Rachel', 'Alex', 'Nicole', 'Ryan', 'Taylor', 'Jordan', 'Morgan',
  'Andrew', 'Samantha', 'Brian', 'Lauren', 'Kevin', 'Megan', 'Jason',
  'Stephanie', 'Justin', 'Ashley', 'Brandon', 'Rebecca', 'Tyler', 'Hannah',
  'Daniel', 'Olivia', 'Nathan', 'Sophia', 'Ethan', 'Isabella', 'Lucas', 'Emma',
  'Mason', 'Ava', 'Logan', 'Chloe', 'Aiden', 'Lily', 'Owen', 'Zoe', 'Caleb',
  'Grace', 'Liam', 'Ella', 'Noah', 'Mia', 'Jacob', 'Abigail', 'William',
  'Charlotte', 'Benjamin', 'Amelia', 'Henry', 'Harper', 'Sebastian', 'Evelyn',
  'Alexander', 'Aria', 'Theodore', 'Luna', 'Samuel', 'Layla', 'Jack',
  'Penelope', 'Raj', 'Priya', 'Wei', 'Mei', 'Yuki', 'Hana', 'Carlos',
  'Maria', 'Ahmed', 'Fatima', 'Dmitri', 'Olga', 'Hans', 'Anna', 'Pierre',
  'Claire', 'Marco', 'Sofia', 'Lars', 'Ingrid',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Wilson', 'Anderson', 'Chen', 'Kumar', 'Park', 'Lee', 'Taylor',
  'Thomas', 'Moore', 'Jackson', 'Martin', 'White', 'Harris', 'Clark', 'Lewis',
  'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Hill',
  'Green', 'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Perez',
  'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards',
  'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers', 'Reed', 'Cook',
  'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson',
  'Cox', 'Patel', 'Singh', 'Sharma', 'Nguyen', 'Tran', 'Kim', 'Tanaka',
  'Yamamoto', 'Zhang', 'Wang', 'Li', 'Liu', 'Yang', 'Huang', 'Muller',
  'Schmidt', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Rossi', 'Bianchi',
  'Fernandez', 'Lopez', 'Martinez', 'Gonzalez', 'Rodriguez', 'Hernandez',
  'Diaz', 'Morales',
];

const TITLES = [
  'Owner', 'Founder', 'Co-Founder', 'CEO', 'President', 'COO',
  'Managing Partner', 'General Manager', 'Director of Operations',
  'Operations Manager', 'Office Manager', 'Practice Manager', 'Studio Manager',
  'Sales Manager', 'Marketing Director', 'Marketing Manager',
  'Business Development Manager', 'Head of Sales', 'Head of Marketing',
  'Head of Growth', 'Director of Sales', 'VP of Sales', 'VP of Operations',
  'VP of Marketing', 'CTO', 'CFO', 'CRO', 'CMO', 'CPO',
  'Clinic Director', 'Branch Manager', 'Regional Manager', 'Managing Director',
  'Chief of Staff', 'Executive Director', 'Partner', 'Senior Partner',
  'Founder & CEO', 'Owner-Operator', 'Principal', 'Creative Director',
  'Director of Engineering', 'Head of Product', 'VP of Engineering',
  'Director of IT', 'Head of Procurement', 'Director of Finance',
];

const LOCATIONS = [
  'San Francisco', 'New York', 'Austin', 'Seattle', 'Boston', 'Chicago',
  'Denver', 'Miami', 'Los Angeles', 'London', 'Toronto', 'Berlin', 'Paris',
  'Amsterdam', 'Dublin', 'Singapore', 'Sydney', 'Tokyo', 'Hong Kong',
  'Tel Aviv', 'Portland', 'Nashville', 'Atlanta', 'Dallas', 'Phoenix',
  'San Diego', 'Philadelphia', 'Minneapolis', 'Detroit', 'Charlotte',
  'Raleigh', 'Salt Lake City', 'Pittsburgh', 'Columbus', 'Indianapolis',
  'Tampa', 'Orlando', 'Las Vegas', 'Kansas City', 'St Louis', 'Vancouver',
  'Montreal', 'Melbourne', 'Auckland', 'Stockholm', 'Copenhagen', 'Oslo',
  'Helsinki', 'Zurich', 'Munich',
];

const TECH_STACKS = [
  'Salesforce', 'HubSpot', 'Pipedrive', 'Mailchimp', 'Outreach', 'Gong',
  'ZoomInfo', 'Marketo', 'Pardot', 'Intercom', 'Drift', 'Segment',
  'Amplitude', 'Mixpanel', 'Datadog', 'PagerDuty', 'Jira', 'Slack',
  'Notion', 'Asana', 'Monday.com', 'Zendesk', 'Freshdesk', 'Stripe',
  'AWS', 'Google Cloud', 'Azure', 'Snowflake', 'Databricks', 'Twilio',
  'SendGrid', 'Okta', 'Auth0', 'Cloudflare', 'Vercel', 'Netlify',
  'GitHub', 'GitLab', 'CircleCI', 'Docker', 'Kubernetes', 'Terraform',
  'Figma', 'Webflow', 'Shopify', 'BigCommerce', 'Klaviyo', 'Braze',
];

const PAIN_POINTS = [
  'Manual lead qualification taking 40+ hrs/week',
  'No unified view of pipeline health',
  'Cold outreach under 2% reply rate',
  'Sales cycle 3x industry average',
  'CRM data quality below 60%',
  'Rep ramp time exceeding 90 days',
  'No real-time competitive intelligence',
  'Forecasting accuracy under 50%',
  'High customer churn rate',
  'Scaling team without losing quality',
  'Tech stack fragmentation',
  'No automated follow-up system',
  'Data silos across departments',
  'Compliance and regulatory burden',
  'Manual reporting consuming 10+ hours weekly',
  'Inconsistent sales methodology across team',
  'Poor lead-to-opportunity conversion rate',
  'Limited visibility into buyer intent signals',
  'Difficulty measuring marketing ROI',
  'Customer onboarding taking too long',
];

const BUYING_SIGNALS = [
  'Recent funding round', 'Hiring sales team', 'Tech stack migration',
  'New leadership', 'Expanding to new market', 'Competitor loss',
  'RFP issued', 'Budget cycle Q1', 'Visited pricing page 3x',
  'Downloaded whitepaper', 'Attended webinar', 'Requested demo',
  'Engaged with case study', 'LinkedIn activity surge', 'Job posting for role',
  'Conference attendance', 'Quarterly earnings beat', 'New product launch',
  'Strategic partnership announced', 'Office expansion',
];

const COMPETITOR_ACTIONS = [
  'Raised Series funding', 'Launched new product feature',
  'Hired new VP of Sales', 'Expanded into new market',
  'Announced strategic partnership', 'Released pricing change',
  'Published industry report', 'Acquired smaller competitor',
  'Lost key customer', 'Received negative reviews',
  'Opened new office', 'Keynote at major conference',
  'Patent filing detected', 'Major customer win announced',
  'Leadership change announced', 'New integration released',
  'Free tier introduced', 'Enterprise plan launched',
  'Rebranding initiative', 'Community program started',
];

const TREND_TOPICS = [
  { name: 'AI Agent Frameworks', categories: ['SaaS', 'AI/ML', 'DevTools'] },
  { name: 'Revenue-Based Financing', categories: ['Fintech', 'SaaS'] },
  { name: 'AI-Powered Sales Automation', categories: ['SaaS', 'MarTech', 'AI/ML'] },
  { name: 'Vertical SaaS Consolidation', categories: ['SaaS', 'Healthcare', 'Fintech'] },
  { name: 'Zero-Trust Security', categories: ['Cybersecurity', 'DevTools'] },
  { name: 'Embedded Finance APIs', categories: ['Fintech', 'E-commerce'] },
  { name: 'AI Code Generation', categories: ['DevTools', 'AI/ML'] },
  { name: 'Edge Computing 2.0', categories: ['DevTools', 'Telecom'] },
  { name: 'PLG Meets Sales-Led', categories: ['SaaS', 'MarTech'] },
  { name: 'Real-Time Payments', categories: ['Fintech'] },
  { name: 'Digital Sales Rooms', categories: ['SaaS', 'MarTech'] },
  { name: 'AI-Driven Underwriting', categories: ['Fintech', 'InsurTech'] },
  { name: 'Conversation Intelligence', categories: ['SaaS', 'AI/ML'] },
  { name: 'Open Source LLMs', categories: ['AI/ML', 'DevTools'] },
  { name: 'Community-Led Growth', categories: ['SaaS', 'MarTech'] },
  { name: 'RAG Pipelines', categories: ['AI/ML', 'DevTools'] },
  { name: 'Intent Data Platforms', categories: ['MarTech', 'AdTech'] },
  { name: 'Telehealth Expansion', categories: ['Healthcare', 'MedTech'] },
  { name: 'PropTech AI Management', categories: ['PropTech', 'AI/ML'] },
  { name: 'AI Tutoring Platforms', categories: ['EdTech', 'AI/ML'] },
  { name: 'Sustainable Supply Chain', categories: ['SupplyChain', 'CleanTech'] },
  { name: 'Agentic Workflows', categories: ['AI/ML', 'SaaS'] },
  { name: 'Multimodal AI', categories: ['AI/ML'] },
  { name: 'Short-Form Video Commerce', categories: ['E-commerce', 'MarTech', 'Media'] },
  { name: 'Carbon Credit Markets', categories: ['CleanTech', 'Fintech'] },
  { name: 'AI SDR Agents', categories: ['SaaS', 'AI/ML', 'MarTech'] },
  { name: 'Kubernetes Cost Optimization', categories: ['DevTools'] },
  { name: 'First-Party Data Strategies', categories: ['MarTech', 'AdTech'] },
  { name: 'SMB Lending Renaissance', categories: ['Fintech'] },
  { name: 'Local-First Software', categories: ['DevTools', 'SaaS'] },
  { name: 'DePIN Networks', categories: ['AI/ML', 'Energy'] },
  { name: 'Fine-Tuning as a Service', categories: ['AI/ML', 'DevTools'] },
  { name: 'Spatial Computing SDKs', categories: ['DevTools', 'Gaming', 'Entertainment'] },
  { name: 'AI-Powered Analytics', categories: ['AI/ML', 'SaaS'] },
  { name: 'Programmatic SEO', categories: ['MarTech', 'AI/ML'] },
];

const COMPETITOR_DOMAINS = [
  'competitor-alpha.io', 'rivalco.com', 'marketshare-x.com',
  'oldguard-solutions.com', 'fastgrowth.io', 'enterprise-rival.com',
  'upstart-competitor.io', 'legacy-vendor.com', 'disruptor-xyz.io',
  'category-leader.com', 'niche-player.io', 'adjacent-tech.com',
  'incumbent-co.com', 'bootstrap-rival.io', 'funded-competitor.com',
];

// ---------------------------------------------------------------------------
// In-memory user profile store
// ---------------------------------------------------------------------------
const userProfiles = new Map();

function getDefaultProfile(userId) {
  return {
    user_id: userId,
    industry: 'Technology',
    company_size: '11-50',
    target_industries: ['SaaS', 'Fintech', 'AI/ML'],
    target_locations: ['San Francisco', 'New York', 'Austin', 'Seattle', 'Boston'],
    target_titles: ['CEO', 'Founder', 'VP of Sales', 'Head of Marketing', 'CTO'],
    icp: {
      min_employees: 10,
      max_employees: 500,
      min_revenue: 100000,
      max_revenue: 50000000,
      industries: ['SaaS', 'Fintech', 'AI/ML'],
      tech_stack_must_have: ['Salesforce', 'HubSpot'],
      pain_points: ['Manual lead qualification taking 40+ hrs/week', 'No unified view of pipeline health'],
    },
    interests: ['AI', 'Sales Automation', 'Lead Generation', 'Revenue Growth'],
    competitors: ['competitor-alpha.io', 'rivalco.com', 'marketshare-x.com'],
    created_at: new Date().toISOString(),
    last_active: new Date().toISOString(),
    feed_preferences: {
      lead_refresh_interval: 300,
      trend_categories: ['tech', 'ai', 'sales'],
      show_international: true,
      priority_focus: 'balanced',
    },
  };
}

function getUserProfile(userId) {
  if (!userProfiles.has(userId)) {
    userProfiles.set(userId, getDefaultProfile(userId));
  }
  const profile = userProfiles.get(userId);
  profile.last_active = new Date().toISOString();
  return profile;
}

function updateUserProfile(userId, updates) {
  const existing = getUserProfile(userId);
  const merged = deepMerge(existing, updates);
  merged.user_id = userId; // ensure user_id is never overwritten
  merged.last_active = new Date().toISOString();
  userProfiles.set(userId, merged);
  return merged;
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function computeProfileCompleteness(profile) {
  let filled = 0;
  let total = 0;

  const check = (val) => {
    total++;
    if (val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0)) {
      filled++;
    }
  };

  check(profile.industry);
  check(profile.company_size);
  check(profile.target_industries);
  check(profile.target_locations);
  check(profile.target_titles);
  check(profile.interests);
  check(profile.competitors);
  check(profile.icp?.industries);
  check(profile.icp?.min_employees);
  check(profile.icp?.max_employees);
  check(profile.icp?.min_revenue);
  check(profile.icp?.max_revenue);
  check(profile.icp?.tech_stack_must_have);
  check(profile.icp?.pain_points);
  check(profile.feed_preferences?.priority_focus);
  check(profile.feed_preferences?.trend_categories);

  return Math.round((filled / total) * 100);
}

// ---------------------------------------------------------------------------
// Lead pool — 250K leads, lazily generated and cached
// ---------------------------------------------------------------------------
const TOTAL_LEAD_POOL = 250000;
let _leadPoolCache = null;
let _leadPoolTimestamp = 0;

/**
 * Generate a single lead deterministically by its pool index.
 */
function generatePoolLead(index) {
  const rng = seededRandom(index * 7919 + 104729);

  const firstName = pick(FIRST_NAMES, rng);
  const lastName = pick(LAST_NAMES, rng);
  const company = COMPANIES[index % COMPANIES.length];
  const industry = pick(INDUSTRIES, rng);
  const title = pick(TITLES, rng);
  const location = pick(LOCATIONS, rng);
  const employees = Math.floor(rng() * 4950) + 5;
  const revenue = Math.floor(rng() * 99900000) + 100000;
  const techStack = pickN(TECH_STACKS, Math.floor(rng() * 5) + 2, rng);
  const leadPainPoints = pickN(PAIN_POINTS, Math.floor(rng() * 3) + 1, rng);
  const signals = pickN(BUYING_SIGNALS, Math.floor(rng() * 4) + 1, rng);

  const daysAgo = Math.floor(rng() * 90);
  const hoursAgo = Math.floor(rng() * 24);
  const createdAt = new Date(Date.now() - (daysAgo * 86400000 + hoursAgo * 3600000)).toISOString();
  const activityHoursAgo = Math.floor(rng() * 168);
  const lastActivity = new Date(Date.now() - activityHoursAgo * 3600000).toISOString();

  return {
    id: index + 1,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    phone: `+1 (${Math.floor(rng() * 900) + 100}) ${Math.floor(rng() * 900) + 100}-${Math.floor(rng() * 9000) + 1000}`,
    company,
    title,
    industry,
    location,
    employees,
    revenue,
    techStack,
    painPoints: leadPainPoints,
    buyingSignals: signals,
    website: `https://${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    momentum: pick(['rising', 'stable', 'declining', 'surging'], rng),
    created_at: createdAt,
    last_activity: lastActivity,
  };
}

/**
 * Lazily build lead pool indexes (industry, location, title) on first access.
 * We do NOT store all 250K lead objects in memory — we index only the fields
 * needed for filtering, then generate full lead objects on demand.
 */
let _leadIndex = null;

function getLeadIndex() {
  if (_leadIndex) return _leadIndex;

  // Build lightweight index: for each lead, store only filter-relevant fields.
  // Full lead objects are generated on demand by generatePoolLead().
  const byIndustry = {};
  const byLocation = {};
  const byTitle = {};

  for (let i = 0; i < TOTAL_LEAD_POOL; i++) {
    const rng = seededRandom(i * 7919 + 104729);
    // Replicate the same RNG calls as generatePoolLead to get deterministic values
    pick(FIRST_NAMES, rng); // firstName
    pick(LAST_NAMES, rng);  // lastName
    // company is deterministic from index % COMPANIES.length — skip rng
    const industry = pick(INDUSTRIES, rng);
    const title = pick(TITLES, rng);
    const location = pick(LOCATIONS, rng);

    if (!byIndustry[industry]) byIndustry[industry] = [];
    byIndustry[industry].push(i);

    if (!byLocation[location]) byLocation[location] = [];
    byLocation[location].push(i);

    if (!byTitle[title]) byTitle[title] = [];
    byTitle[title].push(i);
  }

  _leadIndex = { byIndustry, byLocation, byTitle };
  return _leadIndex;
}

// ---------------------------------------------------------------------------
// ICP scoring algorithm
// ---------------------------------------------------------------------------
function scoreLeadAgainstICP(lead, profile) {
  let score = 0;
  const reasons = [];

  const icp = profile.icp || {};
  const targetIndustries = [
    ...(profile.target_industries || []),
    ...(icp.industries || []),
  ];
  const targetLocations = profile.target_locations || [];
  const targetTitles = profile.target_titles || [];
  const requiredTech = icp.tech_stack_must_have || [];

  // Industry match: +25 points
  if (targetIndustries.some((ind) => ind.toLowerCase() === lead.industry.toLowerCase())) {
    score += 25;
    reasons.push(`Industry match: ${lead.industry}`);
  }

  // Employee count in range: +20 points
  const minEmp = icp.min_employees || 0;
  const maxEmp = icp.max_employees || Infinity;
  if (lead.employees >= minEmp && lead.employees <= maxEmp) {
    score += 20;
    reasons.push(`Employee count in range (${lead.employees})`);
  }

  // Revenue in range: +15 points
  const minRev = icp.min_revenue || 0;
  const maxRev = icp.max_revenue || Infinity;
  if (lead.revenue >= minRev && lead.revenue <= maxRev) {
    score += 15;
    reasons.push(`Revenue in range (${fmt(lead.revenue)})`);
  }

  // Target location: +15 points
  if (targetLocations.some((loc) => loc.toLowerCase() === lead.location.toLowerCase())) {
    score += 15;
    reasons.push(`Located in target market: ${lead.location}`);
  }

  // Target title: +15 points
  if (targetTitles.some((t) => lead.title.toLowerCase().includes(t.toLowerCase()))) {
    score += 15;
    reasons.push(`Decision maker title: ${lead.title}`);
  }

  // Tech stack overlap: +10 points
  const leadTech = (lead.techStack || []).map((t) => t.toLowerCase());
  const overlap = requiredTech.filter((t) => leadTech.includes(t.toLowerCase()));
  if (overlap.length > 0) {
    score += 10;
    reasons.push(`Tech stack overlap: ${overlap.join(', ')}`);
  }

  return { score: Math.min(score, 100), reasons };
}

function getRecommendedAction(score) {
  if (score >= 80) return 'Priority outreach — schedule personalized demo';
  if (score >= 60) return 'Warm outreach — send targeted case study';
  if (score >= 40) return 'Nurture — add to email sequence';
  if (score >= 20) return 'Monitor — track for buying signals';
  return 'Low priority — add to awareness campaign';
}

// ---------------------------------------------------------------------------
// Feed section generators
// ---------------------------------------------------------------------------

/**
 * Generate personalized leads section.
 */
function generateLeadsSection(profile, limit, rngBase) {
  const startTime = Date.now();
  const index = getLeadIndex();
  const targetIndustries = [
    ...(profile.target_industries || []),
    ...(profile.icp?.industries || []),
  ];
  const targetLocations = profile.target_locations || [];

  // Collect candidate lead indices from target industries and locations
  const candidateSet = new Set();

  for (const ind of targetIndustries) {
    const indices = index.byIndustry[ind] || [];
    for (const idx of indices) candidateSet.add(idx);
  }
  for (const loc of targetLocations) {
    const indices = index.byLocation[loc] || [];
    for (const idx of indices) candidateSet.add(idx);
  }

  // If no specific targeting, sample broadly
  if (candidateSet.size === 0) {
    const rng = seededRandom(hashString(profile.user_id + ':leads-sample'));
    for (let i = 0; i < 5000; i++) {
      candidateSet.add(Math.floor(rng() * TOTAL_LEAD_POOL));
    }
  }

  // Score and rank candidates — cap at 5000 to keep response fast
  const candidates = Array.from(candidateSet).slice(0, 5000);
  const scored = candidates.map((idx) => {
    const lead = generatePoolLead(idx);
    const { score, reasons } = scoreLeadAgainstICP(lead, profile);
    return {
      ...lead,
      icpMatchScore: score,
      matchReasons: reasons,
      recommendedAction: getRecommendedAction(score),
    };
  });

  // Sort by ICP match score (best first), then by revenue descending
  scored.sort((a, b) => {
    if (b.icpMatchScore !== a.icpMatchScore) return b.icpMatchScore - a.icpMatchScore;
    return b.revenue - a.revenue;
  });

  const topMatches = scored.slice(0, limit);
  const totalMatches = candidateSet.size;
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((s, l) => s + l.icpMatchScore, 0) / scored.length)
    : 0;

  // Simulate "new since last visit"
  const rng = seededRandom(hashString(profile.user_id + ':new-leads'));
  const newSinceLastVisit = Math.floor(rng() * 80) + 10;

  return {
    total_matches: totalMatches,
    top_matches: topMatches,
    new_since_last_visit: newSinceLastVisit,
    avg_match_score: avgScore,
    processing_time_ms: Date.now() - startTime,
  };
}

/**
 * Generate personalized trends section.
 */
function generateTrendsSection(profile, limit, rngBase) {
  const rng = seededRandom(hashString(profile.user_id + ':trends') + rngBase);
  const userIndustry = profile.industry || 'Technology';
  const interests = profile.interests || [];
  const competitors = profile.competitors || [];

  // Filter trends relevant to user's industry and target industries
  const allTargetIndustries = new Set([
    userIndustry,
    ...(profile.target_industries || []),
    ...(profile.icp?.industries || []),
  ]);

  const relevantTrends = TREND_TOPICS.filter((t) =>
    t.categories.some((c) => allTargetIndustries.has(c))
  );

  // If not enough relevant trends, include some from the full pool
  let pool = relevantTrends.length >= 5 ? relevantTrends : [...TREND_TOPICS];

  const items = pool.slice(0, limit).map((trend, idx) => {
    const velocity = Math.floor(rng() * 40) + 60;
    const sentiment = parseFloat((rng() * 0.4 + 0.5).toFixed(2));
    const volume = Math.floor(rng() * 800000) + 50000;
    const competitorAdoption = Math.floor(rng() * competitors.length) + 1;
    const targetMarketImpact = Math.floor(rng() * 40) + 10;

    return {
      rank: idx + 1,
      name: trend.name,
      categories: trend.categories,
      velocity,
      sentiment,
      sentimentLabel: sentiment > 0.8 ? 'Very Positive' : sentiment > 0.6 ? 'Positive' : sentiment > 0.4 ? 'Neutral' : 'Negative',
      volume,
      volumeFormatted: volume >= 1e6 ? `${(volume / 1e6).toFixed(1)}M` : `${(volume / 1e3).toFixed(0)}K`,
      personalizedInsight: `This trend affects ${targetMarketImpact}% of your target market`,
      competitiveContext: `${competitorAdoption} of your competitors are already adopting this`,
      urgencyScore: Math.min(100, velocity + Math.floor(rng() * 15)),
      relevanceToUser: trend.categories.some((c) => allTargetIndustries.has(c)) ? 'high' : 'medium',
      actionableInsight: generatePersonalizedTrendInsight(trend, profile, rng),
    };
  });

  // Sort by urgency
  items.sort((a, b) => b.urgencyScore - a.urgencyScore);

  const industryMomentum = items.length > 0
    ? (items.reduce((s, i) => s + i.velocity, 0) / items.length > 70 ? 'Growing' : 'Stable')
    : 'Unknown';

  const urgencyAlerts = items.filter((i) => i.urgencyScore > 85).length;

  return {
    relevant_count: items.length,
    items: items.slice(0, limit),
    industry_pulse: industryMomentum,
    urgency_alerts: urgencyAlerts,
  };
}

function generatePersonalizedTrendInsight(trend, profile, rng) {
  const insights = [
    `Companies in ${profile.industry || 'your industry'} are actively seeking solutions related to "${trend.name}". Align your outreach accordingly.`,
    `"${trend.name}" is creating new pain points in ${(profile.target_industries || ['the market'])[0]}. Position your solution as the answer.`,
    `Market leaders are positioning around "${trend.name}". Create a POV piece to capture inbound interest.`,
    `This trend opens ${Math.floor(rng() * 200) + 50} new lead opportunities in your target market this quarter.`,
    `Social chatter around "${trend.name}" is accelerating. Use this as a conversation opener in cold outreach.`,
    `${Math.floor(rng() * 30) + 10}% of your ICP companies are evaluating "${trend.name}" solutions right now.`,
  ];
  return pick(insights, rng);
}

/**
 * Generate personalized competitor section.
 */
function generateCompetitorsSection(profile, limit, rngBase) {
  const rng = seededRandom(hashString(profile.user_id + ':competitors') + rngBase);
  const competitors = profile.competitors || [];

  if (competitors.length === 0) {
    return {
      tracked: 0,
      recent_moves: [],
      your_advantages: ['Add competitors to your profile to track their activity'],
      threats: [],
    };
  }

  // Generate competitor activity feed
  const recentMoves = [];
  for (const domain of competitors) {
    const companyName = domain.replace(/\.(com|io|co|net|org)$/i, '').replace(/-/g, ' ');
    const moveCount = Math.floor(rng() * 3) + 1;
    for (let i = 0; i < moveCount; i++) {
      const action = pick(COMPETITOR_ACTIONS, rng);
      const daysAgo = Math.floor(rng() * 30) + 1;
      const impact = pick(['high', 'medium', 'low'], rng);
      recentMoves.push({
        competitor: companyName,
        domain,
        action,
        date: new Date(Date.now() - daysAgo * 86400000).toISOString(),
        daysAgo,
        impact,
        yourResponse: generateCompetitorResponse(action, rng),
      });
    }
  }

  // Sort by recency
  recentMoves.sort((a, b) => a.daysAgo - b.daysAgo);

  // Generate advantages
  const advantages = [
    `Faster time-to-value: your onboarding is ${Math.floor(rng() * 50) + 20}% faster than the average competitor`,
    `Higher customer satisfaction: ${(rng() * 1.5 + 3.5).toFixed(1)}/5 vs competitor average of ${(rng() * 1 + 2.5).toFixed(1)}/5`,
    `Better pricing: ${Math.floor(rng() * 30) + 10}% more cost-effective for ${profile.icp?.industries?.[0] || 'target'} companies`,
    `Deeper integration: ${Math.floor(rng() * 5) + 3} more native integrations than nearest competitor`,
    `Stronger in ${profile.industry || 'your'} vertical: ${Math.floor(rng() * 40) + 20} more customers in-segment`,
  ];

  // Generate threats
  const threats = [];
  for (const domain of competitors.slice(0, 3)) {
    const companyName = domain.replace(/\.(com|io|co|net|org)$/i, '').replace(/-/g, ' ');
    const threatLevel = pick(['high', 'medium', 'low'], rng);
    threats.push({
      competitor: companyName,
      domain,
      threat_level: threatLevel,
      description: pick([
        `${companyName} is aggressively pricing into your segment`,
        `${companyName} recently won 3 deals you were competing for`,
        `${companyName} launched a feature directly targeting your ICP`,
        `${companyName} hired a top exec from a company in your space`,
        `${companyName} is running a competitive displacement campaign`,
      ], rng),
      recommended_counter: pick([
        'Prepare competitive battle card with updated differentiators',
        'Accelerate roadmap for feature parity in key areas',
        'Launch targeted win-back campaign for lost deals',
        'Create comparison landing page with transparent pricing',
        'Engage analyst community with your differentiated narrative',
      ], rng),
    });
  }

  return {
    tracked: competitors.length,
    recent_moves: recentMoves.slice(0, limit),
    your_advantages: pickN(advantages, Math.min(3, advantages.length), rng),
    threats,
  };
}

function generateCompetitorResponse(action, rng) {
  const responses = {
    'Raised Series funding': 'Monitor their expansion plans. Identify prospects they will target and reach them first.',
    'Launched new product feature': 'Evaluate feature parity. Prepare messaging on your existing advantages.',
    'Hired new VP of Sales': 'Expect increased outbound in 60 days. Fortify relationships with shared accounts.',
    'Expanded into new market': 'Assess overlap with your target markets. Consider proactive positioning.',
    'Announced strategic partnership': 'Evaluate partner ecosystem gaps. Explore counter-partnerships.',
    'Released pricing change': 'Update competitive pricing comparisons. Highlight your value proposition.',
  };
  return responses[action] || 'Monitor situation and prepare response strategy.';
}

/**
 * Generate personalized opportunities section.
 */
function generateOpportunitiesSection(profile, limit, rngBase) {
  const rng = seededRandom(hashString(profile.user_id + ':opportunities') + rngBase);
  const focusMode = profile.feed_preferences?.priority_focus || 'balanced';

  // Hot opportunities — leads showing multiple buying signals
  const hotOpps = [];
  const hotCount = focusMode === 'high-value' ? Math.floor(limit * 0.4) : Math.floor(limit * 0.25);
  for (let i = 0; i < hotCount; i++) {
    const leadIdx = Math.floor(rng() * TOTAL_LEAD_POOL);
    const lead = generatePoolLead(leadIdx);
    const { score } = scoreLeadAgainstICP(lead, profile);
    hotOpps.push({
      type: 'hot',
      lead_name: lead.name,
      company: lead.company,
      industry: lead.industry,
      title: lead.title,
      icp_score: score,
      signals: lead.buyingSignals,
      signal_count: lead.buyingSignals.length,
      estimated_value: fmt(Math.floor(rng() * 200000) + 25000),
      urgency: pick(['critical', 'high', 'medium'], rng),
      recommended_action: 'Schedule discovery call within 48 hours',
      confidence: Math.floor(rng() * 30) + 70,
    });
  }

  // Timing opportunities — budget cycle alignment
  const timingOpps = [];
  const timingCount = Math.floor(limit * 0.25);
  const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
  for (let i = 0; i < timingCount; i++) {
    const leadIdx = Math.floor(rng() * TOTAL_LEAD_POOL);
    const lead = generatePoolLead(leadIdx);
    timingOpps.push({
      type: 'timing',
      lead_name: lead.name,
      company: lead.company,
      industry: lead.industry,
      title: lead.title,
      timing_reason: pick([
        `Budget cycle aligns with ${currentQuarter}`,
        'Fiscal year ending — use-it-or-lose-it budget',
        'New budget allocation just approved',
        'Planning phase for next quarter purchases',
        'Contract renewal with existing vendor coming up',
      ], rng),
      window: pick(['This week', 'Next 2 weeks', 'This month', 'This quarter'], rng),
      estimated_value: fmt(Math.floor(rng() * 150000) + 15000),
      recommended_action: 'Time your outreach to budget decision window',
    });
  }

  // Competitive opportunities — using competitor products and unhappy
  const competitiveOpps = [];
  const competitiveCount = Math.floor(limit * 0.25);
  const competitors = profile.competitors || [];
  for (let i = 0; i < competitiveCount; i++) {
    const leadIdx = Math.floor(rng() * TOTAL_LEAD_POOL);
    const lead = generatePoolLead(leadIdx);
    const competitorUsed = competitors.length > 0 ? pick(competitors, rng) : pick(COMPETITOR_DOMAINS, rng);
    competitiveOpps.push({
      type: 'competitive',
      lead_name: lead.name,
      company: lead.company,
      industry: lead.industry,
      title: lead.title,
      competitor_used: competitorUsed,
      dissatisfaction_signals: pickN([
        'Negative review posted',
        'Support ticket volume increasing',
        'Contract renewal date approaching',
        'Exploring alternatives (intent data)',
        'Mentioned competitor pain points on LinkedIn',
        'Downgraded subscription tier',
      ], Math.floor(rng() * 2) + 1, rng),
      estimated_value: fmt(Math.floor(rng() * 180000) + 20000),
      recommended_action: 'Position against competitor weaknesses — lead with migration support',
    });
  }

  // Growth opportunities — recently funded or expanding
  const growthOpps = [];
  const growthCount = Math.floor(limit * 0.25);
  for (let i = 0; i < growthCount; i++) {
    const leadIdx = Math.floor(rng() * TOTAL_LEAD_POOL);
    const lead = generatePoolLead(leadIdx);
    growthOpps.push({
      type: 'growth',
      lead_name: lead.name,
      company: lead.company,
      industry: lead.industry,
      title: lead.title,
      growth_signal: pick([
        'Just raised Series A funding',
        'Just raised Series B funding',
        'Seed round closed last month',
        'Revenue grew 3x year-over-year',
        'Headcount doubled in 6 months',
        'Expanded to 3 new markets',
        'Launched new product line',
        'IPO preparation announced',
      ], rng),
      funding_amount: fmt(Math.floor(rng() * 50000000) + 1000000),
      estimated_value: fmt(Math.floor(rng() * 250000) + 30000),
      recommended_action: 'Congratulate on milestone and propose how you can support their growth',
    });
  }

  // Compute total estimated pipeline value
  const allOpps = [...hotOpps, ...timingOpps, ...competitiveOpps, ...growthOpps];
  const totalValue = allOpps.reduce((sum, opp) => {
    const numStr = opp.estimated_value.replace(/[$,KMB]/g, '');
    const num = parseFloat(numStr) || 0;
    const multiplier = opp.estimated_value.includes('M') ? 1000000
      : opp.estimated_value.includes('K') ? 1000
      : 1;
    return sum + num * multiplier;
  }, 0);

  return {
    hot: hotOpps,
    timing: timingOpps,
    competitive: competitiveOpps,
    growth: growthOpps,
    total_count: allOpps.length,
    total_value: fmt(totalValue),
  };
}

// ---------------------------------------------------------------------------
// Feed cache — keyed by user_id + type + limit
// ---------------------------------------------------------------------------
const feedCache = new Map();
const FEED_CACHE_TTL = 120 * 1000; // 2 minutes default

function getCacheKey(userId, type, limit) {
  return `${userId}:${type}:${limit}`;
}

function getCachedFeed(userId, type, limit) {
  const key = getCacheKey(userId, type, limit);
  const entry = feedCache.get(key);
  if (entry && Date.now() - entry.timestamp < FEED_CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCachedFeed(userId, type, limit, data) {
  const key = getCacheKey(userId, type, limit);
  feedCache.set(key, { data, timestamp: Date.now() });
  // Evict old entries to prevent unbounded growth
  if (feedCache.size > 1000) {
    const oldest = feedCache.keys().next().value;
    feedCache.delete(oldest);
  }
}

// ---------------------------------------------------------------------------
// Request body parser helper
// ---------------------------------------------------------------------------
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    // If body is already parsed (e.g., by Vercel)
    if (req.body) {
      resolve(req.body);
      return;
    }
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  const startTime = Date.now();
  const corsHeaders = getCorsHeaders(req);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  // ---------------------------------------------------------------------------
  // POST — Update user profile
  // ---------------------------------------------------------------------------
  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const userId = body.user_id;

      if (!userId) {
        return res.status(400).json({
          error: 'Missing required field: user_id',
          _meta: { generatedAt: new Date().toISOString() },
        });
      }

      // Remove user_id from updates to avoid overwrite
      const { user_id: _uid, ...updates } = body;
      const updatedProfile = updateUserProfile(userId, updates);

      // Invalidate feed cache for this user
      for (const key of feedCache.keys()) {
        if (key.startsWith(userId + ':')) {
          feedCache.delete(key);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile: updatedProfile,
        profile_completeness: computeProfileCompleteness(updatedProfile),
        _meta: {
          generatedAt: new Date().toISOString(),
          processingTime: `${Date.now() - startTime}ms`,
        },
      });
    } catch (error) {
      return res.status(400).json({
        error: 'Failed to update profile',
        message: error.message,
        _meta: { generatedAt: new Date().toISOString() },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // GET — Retrieve personalized feed
  // ---------------------------------------------------------------------------
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed. Use GET or POST.',
      _meta: { generatedAt: new Date().toISOString() },
    });
  }

  try {
    const {
      user_id: userId,
      type = 'all',
      limit: rawLimit = '25',
      refresh = 'false',
    } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required query parameter: user_id',
        usage: 'GET /api/feed?user_id=<id>&type=all&limit=25&refresh=false',
        _meta: { generatedAt: new Date().toISOString() },
      });
    }

    const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 25, 1), 100);
    const forceRefresh = refresh === 'true' || refresh === '1';
    const validTypes = ['leads', 'trends', 'competitors', 'opportunities', 'all'];
    const feedType = validTypes.includes(type.toLowerCase()) ? type.toLowerCase() : 'all';

    // Check cache (unless refresh is forced)
    if (!forceRefresh) {
      const cached = getCachedFeed(userId, feedType, limit);
      if (cached) {
        return res.status(200).json({
          ...cached,
          _meta: {
            ...cached._meta,
            cached: true,
            servedAt: new Date().toISOString(),
          },
        });
      }
    }

    const profile = getUserProfile(userId);
    const rngBase = forceRefresh ? Date.now() : 0;

    // Build response — each section is independent
    const response = {
      user_id: userId,
      personalization: {
        profile_completeness: computeProfileCompleteness(profile),
        icp_defined: !!(profile.icp && profile.icp.industries && profile.icp.industries.length > 0),
        target_industries: profile.target_industries || [],
        feed_freshness: timeAgo(profile.last_active),
        priority_focus: profile.feed_preferences?.priority_focus || 'balanced',
      },
    };

    // Leads section
    if (feedType === 'all' || feedType === 'leads') {
      try {
        response.leads = generateLeadsSection(profile, limit, rngBase);
      } catch (err) {
        response.leads = {
          error: 'Failed to generate leads section',
          message: err.message,
          total_matches: 0,
          top_matches: [],
          new_since_last_visit: 0,
          avg_match_score: 0,
        };
      }
    }

    // Trends section
    if (feedType === 'all' || feedType === 'trends') {
      try {
        response.trends = generateTrendsSection(profile, limit, rngBase);
      } catch (err) {
        response.trends = {
          error: 'Failed to generate trends section',
          message: err.message,
          relevant_count: 0,
          items: [],
          industry_pulse: 'Unknown',
          urgency_alerts: 0,
        };
      }
    }

    // Competitors section
    if (feedType === 'all' || feedType === 'competitors') {
      try {
        response.competitors = generateCompetitorsSection(profile, limit, rngBase);
      } catch (err) {
        response.competitors = {
          error: 'Failed to generate competitors section',
          message: err.message,
          tracked: 0,
          recent_moves: [],
          your_advantages: [],
          threats: [],
        };
      }
    }

    // Opportunities section
    if (feedType === 'all' || feedType === 'opportunities') {
      try {
        response.opportunities = generateOpportunitiesSection(profile, limit, rngBase);
      } catch (err) {
        response.opportunities = {
          error: 'Failed to generate opportunities section',
          message: err.message,
          hot: [],
          timing: [],
          competitive: [],
          growth: [],
          total_count: 0,
          total_value: '$0',
        };
      }
    }

    // Meta
    const processingTime = Date.now() - startTime;
    response._meta = {
      generatedAt: new Date().toISOString(),
      cached: false,
      processingTime: `${processingTime}ms`,
      feedType,
      limit,
      leadPoolSize: TOTAL_LEAD_POOL,
      dataSourcesUsed: [
        'builtin-engine',
        ...(feedType === 'all' || feedType === 'trends' ? ['market-trends'] : []),
        ...(feedType === 'all' || feedType === 'competitors' ? ['competitor-intel'] : []),
      ],
    };

    // Store in cache
    setCachedFeed(userId, feedType, limit, response);

    return res.status(200).json(response);
  } catch (error) {
    console.error('[GOATED] Feed API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
      _meta: {
        generatedAt: new Date().toISOString(),
        processingTime: `${Date.now() - startTime}ms`,
      },
    });
  }
}
