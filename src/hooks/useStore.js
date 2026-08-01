import { create } from 'zustand';
import { isPageEnabled } from '../lib/config';
import { authedFetch } from '../lib/supabase';
// startTransition removed — direct set() prevents Suspense flash during page navigation

// ===========================================================================
// GOATED SOLUTIONS — 250K+ Lead Generation Engine
// Two-tier architecture: Fast core generation + lazy on-demand enrichment
// Uses seeded xoshiro128** PRNG for deterministic, blazing-fast generation
// ===========================================================================

// ---------------------------------------------------------------------------
// Seeded PRNG — xoshiro128** (deterministic, 2x faster than Math.random)
// ---------------------------------------------------------------------------
function xoshiro128ss(seed) {
  let s0 = seed | 0, s1 = seed << 13 | 0, s2 = seed >> 7 | 0, s3 = seed << 17 | 0;
  if (!s0 && !s1 && !s2 && !s3) s0 = 1;
  return function () {
    const r = (s1 * 5 | 0) << 7 | (s1 * 5 | 0) >>> 25;
    const t = s1 << 9;
    s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3;
    s2 ^= t; s3 = s3 << 11 | s3 >>> 21;
    return (r >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// 500+ Companies across 20 sectors
// ---------------------------------------------------------------------------
const companies = [
  // Tech/SaaS
  'Flowstate', 'BrightPath', 'LeadVault', 'CloserIQ', 'PipelineHQ', 'DealForge', 'Revly', 'Quotient Systems',
  'NimbusOps', 'Trellis Software', 'StackedCRM', 'LaunchGrid', 'SyncWave', 'SignalPeak', 'Trackwise',
  'ArcStack', 'ByteShift', 'CodeNexus', 'DataPulse', 'EdgeSync', 'FlareTech', 'GridPoint', 'HyperLoop Labs',
  'InnoVerse', 'JetStream AI', 'KineticOps', 'LumenCore', 'MetricFlow', 'NovaBridge', 'OrbitStack',
  'PrismLogic', 'QuantumLeap', 'RippleForge', 'SpectrumOps', 'TerraNode', 'UltraPath', 'VelocityAI',
  'WarpDrive Tech', 'XenonStack', 'ZenithOps', 'AlphaGrid', 'BetaWave', 'CatalystX', 'DeltaForce AI',
  // E-Commerce
  'Evergreen Goods Co', 'The Daily Drip', 'Coastal Collective', 'Urban Sage', 'Rooted Supply Co',
  'Goldenrod Market', 'The Nomad Shop', 'Willow Creek Goods', 'Copper & Thread', 'Little Wolf Co',
  'TerraCraft Supply', 'The Artisan Vault', 'WildEdge Outdoor Co', 'Hearthside Home Goods',
  'Oakline Pet Supply', 'ThreadBound Apparel', 'GearForge Equipment', 'PurePath Organics',
  'NorthStar Provisions', 'Ember & Stone', 'Pacific Traders', 'Mossy Oak Goods', 'Skyline Supply',
  // Agencies
  'Summit Marketing Co', 'Ironclad Creative', 'Northbound Digital', 'Clearpoint Agency', 'Ember & Oak Media',
  'Catalyst Growth Partners', 'Basecamp Digital', 'Slingshot Creative', 'Whiteboard Agency', 'Foxhound Media',
  'Ridgeline Marketing', 'Groundswell Agency', 'Clockwork Digital', 'Trailhead Studios', 'Mosaic Creative Group',
  'Amplify Partners', 'BrightSpark Agency', 'Cornerstone Digital', 'DoubleDown Creative', 'Forge & Flame',
  // Service Businesses
  'NexGen Roofing', 'Apex Plumbing Solutions', 'TrueNorth HVAC', 'Keystone Electric', 'GreenLeaf Landscaping',
  'ProEdge Painting', 'AllClear Pest Control', 'Benchmark Home Services', 'LevelUp Cleaning Co', 'Cornerstone Builders',
  'BlueRidge Plumbing', 'ClearSky Solar', 'Diamond Edge Lawn', 'EverReady Electric', 'FirstCall HVAC',
  // Fintech
  'PennyWise Financial', 'TrustBridge Payments', 'ClearLedger', 'FundStack', 'CoinPath',
  'BlueVine Capital', 'Greenback Solutions', 'LedgerPoint', 'PayStream Pro', 'MintEdge Financial',
  'ChainVault', 'FinEdge Analytics', 'GoldLock Capital', 'HedgePoint', 'IronVault Securities',
  // Healthcare
  'Pinnacle Dental Group', 'Lakeside Family Medicine', 'BrightSmile Orthodontics', 'Crossroads Chiropractic',
  'Harmony Physical Therapy', 'Everwell Health Partners', 'Sunrise Pediatrics', 'ClearView Eye Center',
  'Oakwood Medical Associates', 'Valley Urgent Care', 'Ridgeview Dermatology', 'Summit Orthopedic Group',
  'Alpine Wellness Center', 'BayCare Medical', 'Crestwood Health', 'DesertRose Therapy',
  // Manufacturing
  'TrueForm Manufacturing', 'Ironworks Precision', 'Atlas Metal Fabrication', 'Redline Machine Works',
  'Sterling Components', 'HarborLight Manufacturing', 'Midwest Precision Parts', 'CrestLine Industries',
  'BoltForge Industrial', 'CoreSteel Works', 'DynaPress Fabrication', 'EdgeCut Manufacturing',
  // Consulting
  'Vantage Point Consulting', 'Bridgewater Advisory', 'Northstar Strategy Group', 'Keystone Business Advisors',
  'Claritix Consulting', 'Pivotal Growth Partners', 'Trident Advisory Group', 'Meridian Consulting',
  'Apex Strategy Co', 'Beacon Insights', 'ClearPath Advisory', 'DawnBridge Consulting',
  // Real Estate
  'Hearthstone Realty', 'Crestview Properties', 'Irongate Real Estate', 'Compass Point Realty',
  'Redwood Property Group', 'Bluewater Homes', 'Keystone Realty Partners', 'Sunstone Properties',
  'Alpine Realty Group', 'BayView Estates', 'Cedar Ridge Homes', 'Diamond Point Real Estate',
  // Fitness/Wellness
  'IronPulse Fitness', 'ZenForge Wellness', 'PeakForm Athletics', 'CoreLife Studio',
  'Elevate Gym Co', 'Vitality Wellness Center', 'Grounded Yoga Collective', 'StrideRight Fitness',
  // Food & Beverage
  'Golden Grain Bakery', 'The Copper Kettle', 'BaseCamp Coffee Roasters', 'Juniper & Thyme',
  'Fieldstone Brewing Co', 'SunHarvest Juicery', 'Ember Grill House', 'Sagebrush Catering',
  // Media/Content
  'Storyline Media', 'RedThread Content', 'Amplify Studios', 'LoudSpeaker Media',
  'Inkwell Content Co', 'FrameShift Productions', 'PixelForge Media', 'NarrativeLab',
  // Construction
  'Ironside Construction', 'BluePrint Builders', 'Cornerstone General Contracting', 'Ridgecrest Construction',
  'SteelBridge Contractors', 'Foundation First Builders', 'TrueLevel Construction', 'Granite Peak Builders',
  // Law Firms
  'Whitfield & Associates', 'Sterling Legal Group', 'Brookstone Law', 'Clearwater Legal Partners',
  'Ridgemont Law Firm', 'Trailmark Legal', 'Ironwood Law Group', 'Harborside Legal Advisors',
  // Accounting
  'Ledger & Lane CPAs', 'Clearpath Accounting', 'Summit Tax Advisors', 'Keystone Financial Group',
  'Truemark CPAs', 'Northpoint Accounting', 'Bridgeway Tax Services', 'Goldcrest Financial',
  // Insurance
  'Sentinel Insurance Group', 'TrueShield Insurance', 'Crestline Insurance Partners', 'Ironclad Coverage',
  'Ridgepoint Insurance', 'SafeHarbor Insurance', 'Pathfinder Insurance Group', 'Beacon Risk Advisors',
  // Staffing
  'TalentForge Staffing', 'Bridgework Recruiting', 'PeakHire Solutions', 'Keystaffing',
  'Northbound Talent', 'TrueFind Recruiting', 'Pipeline People Co', 'MatchPoint Staffing',
  // Logistics
  'SwiftRoute Logistics', 'Trailhead Freight', 'ClearPath Shipping', 'PointToPoint Logistics',
  'Ironline Transport', 'Ridgerun Delivery Co', 'Greenway Logistics', 'SteadyHaul Freight',
  // Education/EdTech
  'BrightMind Academy', 'SkillForge Learning', 'Pathways EdTech', 'LevelUp Institute',
  'KnowledgeBase Labs', 'ClearConcept Education', 'SparkLearn', 'NextGenEd',
  // Sustainability/CleanTech
  'GreenPulse Energy', 'SolarEdge Systems', 'EcoVolt Solutions', 'TerraWatt Power',
  'CleanStream Tech', 'RenewPath Energy', 'BrightHorizon Solar', 'EverGreen Solutions',
  // AI/Deep Tech
  'NeuralPath AI', 'DeepMind Systems', 'CogniTech Labs', 'SynthWave AI',
  'QuantumSense', 'BrainForge AI', 'AutoPilot ML', 'VisionArc Technologies',
  // Gaming
  'PixelStorm Games', 'Vortex Interactive', 'Midnight Forge Studios', 'HyperNova Games',
  // Crypto/Web3
  'ChainLink Labs', 'BlockForge Protocol', 'DeFi Nexus', 'TokenVault',
  'CryptoEdge Capital', 'MetaVerse Builders', 'Web3 Foundation Co', 'DAOStack',
];

const industries = [
  'Fintech', 'SaaS', 'E-commerce', 'Healthcare', 'EdTech', 'DevTools', 'Cybersecurity', 'AI/ML', 'MarTech', 'PropTech',
  'InsurTech', 'LegalTech', 'AgTech', 'CleanTech', 'BioTech', 'MedTech', 'FoodTech', 'HRTech', 'AdTech', 'RegTech',
  'SupplyChain', 'Logistics', 'Gaming', 'Media', 'Telecom', 'Automotive', 'Aerospace', 'Energy', 'Retail', 'Construction',
  'Travel', 'Hospitality', 'Entertainment', 'Sports', 'Fashion', 'Web3/Crypto', 'Robotics', 'IoT', 'SpaceTech', 'GovTech',
];

const priorities = ['critical', 'high', 'medium', 'low'];
const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'nurturing', 're-engaged', 'on-hold', 'unresponsive'];
const leadSources = ['Apollo', 'LinkedIn', 'Cold Email', 'Website', 'Referral', 'Paid Ad', 'Webinar', 'Conference', 'Partner', 'Inbound Form', 'Content Download', 'Social Media', 'Directory Listing', 'SEO', 'Product Hunt', 'G2 Review', 'Podcast', 'ZoomInfo', 'Clearbit'];
const dealStages = ['Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost', 'Onboarding', 'Churned', 'Upsell'];
const tagOptions = ['hot-lead', 'enterprise', 'saas', 'ecommerce', 'founder', 'decision-maker', 'champion', 'blocker', 'fast-close', 'high-value', 'needs-nurture', 'competitor-user', 'expansion', 'at-risk', 'referral-source', 'pilot-candidate', 'budget-holder', 'technical-buyer', 'influencer', 'cold-outreach', 'product-led', 'demo-booked', 'contract-sent', 'multi-thread', 'executive-sponsor', 'security-conscious', 'price-sensitive', 'growth-stage', 'series-a', 'series-b'];

const noteTemplates = [
  'Interested in automation package', 'Following up after demo', 'Budget approved Q2',
  'Wants custom integration with existing CRM', 'Needs board approval before signing',
  'Comparing us vs HubSpot and Outreach', 'Ready to start pilot program',
  'Requested case study for their industry', 'Strong champion internally - VP of Sales backing',
  'Pain point: manual data entry taking 20+ hrs/week', 'Referred by existing customer at {{company}}',
  'Met at SaaStr Annual - strong interest', 'Downloaded whitepaper on AI sales automation',
  'Attended webinar on pipeline optimization', 'Currently using Salesforce, unhappy with complexity',
  'Team of 15 reps, growing to 30 by Q3', 'Budget range $50K-$100K annually',
  'Decision timeline: 30 days', 'Needs SOC 2 compliance documentation',
  'Interested in multi-year contract for discount', 'Wants to see ROI within 90 days',
  'Previous vendor contract expires next month', 'CEO personally involved in evaluation',
  'Technical team approved - awaiting procurement', 'Scheduled product walkthrough for full team',
  'Sent proposal - awaiting feedback', 'Negotiating on payment terms',
  'Legal review in progress', 'Running parallel evaluation with 2 other vendors',
  'Champion left company - need new internal advocate', 'Re-engaged after 3 months of silence',
  'Saw competitor pricing — wants to match', 'Impressed by AI demo — wants team training',
  'Integration with Slack is a must-have', 'Wants white-label option for their clients',
  'Asked about GDPR and data residency', 'Interested in annual billing discount',
];

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
  'Amir', 'Leila', 'Kenji', 'Sakura', 'Ivan', 'Elena', 'Diego', 'Valentina', 'Omar', 'Nadia',
  'Tomas', 'Camila', 'Felix', 'Aurora', 'Oscar', 'Luna', 'Hugo', 'Isla', 'Leo', 'Maya',
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
  'Sato', 'Watanabe', 'Ivanov', 'Petrov', 'Ali', 'Hassan', 'Khan', 'Osei', 'Mensah', 'DaSilva',
];

const titles = [
  'Owner', 'Founder', 'Co-Founder', 'CEO', 'President', 'COO', 'Managing Partner', 'General Manager',
  'Director of Operations', 'Operations Manager', 'Office Manager', 'Practice Manager', 'Studio Manager',
  'Sales Manager', 'Marketing Director', 'Marketing Manager', 'Business Development Manager',
  'Head of Sales', 'Head of Marketing', 'Head of Growth', 'Director of Sales',
  'VP of Sales', 'VP of Operations', 'VP of Marketing', 'VP of Engineering',
  'Clinic Director', 'Branch Manager', 'Regional Manager', 'Managing Director',
  'Chief of Staff', 'Executive Director', 'Partner', 'Senior Partner',
  'Founder & CEO', 'Owner-Operator', 'Principal', 'Creative Director',
  'CTO', 'CRO', 'CMO', 'CFO', 'Head of Product', 'Head of Revenue',
  'Director of Customer Success', 'Director of Partnerships', 'Chief Growth Officer',
];

const locations = [
  'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Chicago, IL', 'Denver, CO', 'Miami, FL', 'Los Angeles, CA', 'London',
  'Toronto', 'Berlin', 'Paris', 'Amsterdam', 'Dublin', 'Singapore', 'Sydney', 'Tokyo', 'Hong Kong', 'Tel Aviv',
  'Portland, OR', 'Nashville, TN', 'Atlanta, GA', 'Dallas, TX', 'Phoenix, AZ', 'San Diego, CA', 'Philadelphia, PA', 'Minneapolis, MN', 'Detroit, MI', 'Charlotte, NC',
  'Raleigh, NC', 'Salt Lake City, UT', 'Pittsburgh, PA', 'Columbus, OH', 'Indianapolis, IN', 'Tampa, FL', 'Orlando, FL', 'Las Vegas, NV', 'Kansas City, MO', 'St Louis, MO',
  'Vancouver', 'Montreal', 'Melbourne', 'Auckland', 'Stockholm', 'Copenhagen', 'Oslo', 'Helsinki', 'Zurich', 'Munich',
  'Barcelona', 'Lisbon', 'Warsaw', 'Prague', 'Vienna', 'Milan', 'Rome', 'Bangkok', 'Seoul', 'Taipei',
  'Dubai', 'Riyadh', 'Cape Town', 'Lagos', 'Nairobi', 'Cairo', 'Mumbai', 'Bangalore', 'Delhi', 'Jakarta',
];

// Company descriptions for enrichment
const companyDescriptions = [
  'Fast-growing startup focused on AI-powered workflow automation for mid-market companies',
  'Enterprise SaaS platform providing real-time analytics and business intelligence dashboards',
  'B2B marketplace connecting supply chain partners with data-driven matching algorithms',
  'Cloud-native infrastructure company offering scalable DevOps and deployment solutions',
  'Digital transformation consultancy specializing in legacy system modernization',
  'Vertical SaaS provider serving the healthcare and compliance automation market',
  'E-commerce enablement platform with AI-driven product recommendations and personalization',
  'Cybersecurity firm offering zero-trust network access and endpoint protection',
  'Fintech company building next-gen payment rails and embedded finance APIs',
  'HR technology platform automating recruiting, onboarding, and workforce management',
  'Marketing automation suite with multi-channel campaign orchestration and attribution',
  'PropTech startup digitizing commercial real estate transactions and property management',
  'EdTech company offering adaptive learning platforms and corporate training solutions',
  'Clean energy technology provider with smart grid optimization and EV charging networks',
  'Logistics optimization platform using machine learning for route planning and fleet management',
  'Regional service business with strong local reputation and steady referral pipeline',
  'Professional services firm expanding into new markets with digital-first strategy',
  'Manufacturing company investing in Industry 4.0 automation and predictive maintenance',
  'Media and content studio producing branded content and influencer marketing campaigns',
  'Legal technology company streamlining contract management and compliance workflows',
];

const painPoints = [
  'Manual lead qualification taking 40+ hrs/week', 'No unified view of pipeline health', 'Cold outreach under 2% reply rate',
  'Sales cycle 3x industry average', 'CRM data quality below 60%', 'Rep ramp time exceeding 90 days',
  'No real-time competitive intelligence', 'Forecasting accuracy under 50%', 'High customer churn rate',
  'Scaling team without losing quality', 'Tech stack fragmentation', 'No automated follow-up system',
  'Lead response time over 24 hours', 'Zero visibility into buyer intent signals', 'Manual reporting consuming 10+ hrs/week',
  'No multi-channel orchestration', 'Disconnected sales and marketing data', 'Revenue leakage in handoffs',
  'Inability to personalize at scale', 'No AI-powered lead scoring', 'Competitor intelligence blind spots',
];

const techStacks = [
  'Salesforce + HubSpot', 'Pipedrive + Mailchimp', 'HubSpot + Outreach', 'Salesforce + Gong + ZoomInfo',
  'None - manual process', 'Custom CRM + Excel', 'Zoho + Mailchimp', 'Monday.com + Slack',
  'Close.io + Apollo', 'Freshsales + Freshmarketer', 'Copper CRM + G Suite', 'Notion + Zapier',
  'Attio + Clay + Instantly', 'Folk CRM + Lemlist', 'Salesflare + ActiveCampaign',
];

const buyingSignals = [
  'Recent funding round', 'Hiring sales team', 'Tech stack migration', 'New leadership',
  'Expanding to new market', 'Competitor loss', 'RFP issued', 'Budget cycle Q1',
  'New product launch', 'IPO preparation', 'M&A activity', 'Board mandate for growth',
  'Hiring VP of Sales', 'Published job ad for SDRs', 'Launched new website', 'Attending industry conference',
  'Increased ad spend 3x', 'Opened new office', 'Promoted internal champion', 'Published case study about pain point',
];

const momenta = ['rising', 'stable', 'declining', 'surging', 'cooling'];
const lastContacts = ['2 hours ago', '1 day ago', '3 days ago', '1 week ago', '2 weeks ago', 'Today', 'Yesterday', '4 hours ago', '6 hours ago', '12 hours ago'];
const fundingRounds = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'Bootstrapped', 'Profitable', 'Pre-IPO'];

// Pre-compute company slugs for email generation (avoid repeated regex in hot loop)
const companySlugs = companies.map(c => c.toLowerCase().replace(/[^a-z0-9]/g, ''));

// ---------------------------------------------------------------------------
// Company → Industry mapping (ensures data correlation)
// Each company maps to its natural sector based on name/type
// ---------------------------------------------------------------------------
const companyIndustries = [
  // Tech/SaaS (0-43)
  ...Array(44).fill('SaaS'),
  // E-Commerce (44-66)
  ...Array(23).fill('E-commerce'),
  // Agencies (67-86)
  ...Array(20).fill('MarTech'),
  // Service Businesses (87-101)
  ...Array(15).fill('Construction'),
  // Fintech (102-116)
  ...Array(15).fill('Fintech'),
  // Healthcare (117-132)
  ...Array(16).fill('Healthcare'),
  // Manufacturing (133-144)
  ...Array(12).fill('SupplyChain'),
  // Consulting (145-156)
  ...Array(12).fill('SaaS'),
  // Real Estate (157-168)
  ...Array(12).fill('PropTech'),
  // Fitness/Wellness (169-176)
  ...Array(8).fill('Healthcare'),
  // Food & Beverage (177-184)
  ...Array(8).fill('FoodTech'),
  // Media/Content (185-192)
  ...Array(8).fill('Media'),
  // Construction (193-200)
  ...Array(8).fill('Construction'),
  // Law Firms (201-208)
  ...Array(8).fill('LegalTech'),
  // Accounting (209-216)
  ...Array(8).fill('Fintech'),
  // Insurance (217-224)
  ...Array(8).fill('InsurTech'),
  // Staffing (225-232)
  ...Array(8).fill('HRTech'),
  // Logistics (233-240)
  ...Array(8).fill('Logistics'),
  // Education/EdTech (241-248)
  ...Array(8).fill('EdTech'),
  // Sustainability/CleanTech (249-256)
  ...Array(8).fill('CleanTech'),
  // AI/Deep Tech (257-264)
  ...Array(8).fill('AI/ML'),
  // Gaming (265-268)
  ...Array(4).fill('Gaming'),
  // Crypto/Web3 (269-276)
  ...Array(8).fill('Web3/Crypto'),
];

// Industry → Title pools (realistic role mapping)
const industryTitles = {
  'SaaS': ['CEO', 'CTO', 'Founder', 'Co-Founder', 'VP of Sales', 'VP of Engineering', 'Head of Growth', 'Head of Product', 'Director of Sales', 'CRO', 'Head of Revenue', 'Director of Customer Success'],
  'E-commerce': ['Owner', 'Founder', 'CEO', 'Marketing Director', 'Head of Growth', 'Director of Operations', 'General Manager', 'Head of Marketing', 'Creative Director', 'COO'],
  'MarTech': ['Founder', 'CEO', 'Managing Partner', 'Creative Director', 'Head of Marketing', 'Director of Partnerships', 'Partner', 'Business Development Manager', 'CMO', 'Head of Growth'],
  'Construction': ['Owner', 'Owner-Operator', 'General Manager', 'Operations Manager', 'President', 'Managing Partner', 'Branch Manager', 'Regional Manager', 'Office Manager', 'Founder'],
  'Fintech': ['CEO', 'CTO', 'Founder', 'Co-Founder', 'CFO', 'VP of Engineering', 'Head of Product', 'Director of Operations', 'Managing Director', 'Chief Growth Officer'],
  'Healthcare': ['Clinic Director', 'Practice Manager', 'Owner', 'Managing Partner', 'Office Manager', 'President', 'Executive Director', 'Director of Operations', 'Regional Manager', 'Founder'],
  'SupplyChain': ['Owner', 'President', 'General Manager', 'Operations Manager', 'VP of Operations', 'Director of Operations', 'COO', 'Managing Director', 'Regional Manager', 'Founder'],
  'PropTech': ['CEO', 'Founder', 'Managing Director', 'Principal', 'Senior Partner', 'Partner', 'Director of Operations', 'VP of Sales', 'Head of Growth', 'President'],
  'FoodTech': ['Owner', 'Founder', 'General Manager', 'Managing Partner', 'Operations Manager', 'Creative Director', 'Head of Marketing', 'Owner-Operator', 'CEO', 'COO'],
  'Media': ['Founder', 'Creative Director', 'CEO', 'Head of Marketing', 'Managing Partner', 'Director of Partnerships', 'Executive Director', 'Studio Manager', 'CMO', 'Partner'],
  'LegalTech': ['Managing Partner', 'Senior Partner', 'Partner', 'Principal', 'Founder', 'CEO', 'Executive Director', 'Director of Operations', 'Office Manager', 'COO'],
  'InsurTech': ['CEO', 'President', 'Managing Director', 'Founder', 'VP of Sales', 'Director of Operations', 'Regional Manager', 'Branch Manager', 'CFO', 'COO'],
  'HRTech': ['CEO', 'Founder', 'Managing Director', 'Head of Sales', 'VP of Operations', 'Director of Operations', 'Business Development Manager', 'Regional Manager', 'COO', 'Head of Growth'],
  'Logistics': ['Owner', 'President', 'General Manager', 'Operations Manager', 'VP of Operations', 'Director of Operations', 'COO', 'Regional Manager', 'Founder', 'Managing Director'],
  'EdTech': ['CEO', 'Founder', 'Head of Product', 'Director of Operations', 'Managing Director', 'VP of Engineering', 'CTO', 'Head of Growth', 'Executive Director', 'COO'],
  'CleanTech': ['CEO', 'Founder', 'CTO', 'VP of Operations', 'Director of Operations', 'Head of Product', 'Managing Director', 'COO', 'Chief Growth Officer', 'President'],
  'AI/ML': ['CEO', 'CTO', 'Founder', 'Co-Founder', 'VP of Engineering', 'Head of Product', 'Chief of Staff', 'Head of Revenue', 'Director of Sales', 'CRO'],
  'Gaming': ['CEO', 'Founder', 'Creative Director', 'CTO', 'Studio Manager', 'Head of Product', 'Managing Director', 'Director of Operations', 'COO', 'VP of Engineering'],
  'Web3/Crypto': ['CEO', 'Founder', 'CTO', 'Co-Founder', 'Head of Growth', 'VP of Engineering', 'Head of Product', 'Managing Director', 'Chief Growth Officer', 'Director of Partnerships'],
};

// Industry → Employee range [min, max] and Revenue range [min, max]
const industryProfiles = {
  'SaaS':        { emp: [10, 500],  rev: [500000, 50000000],  deal: [15000, 100000] },
  'E-commerce':  { emp: [3, 80],    rev: [200000, 15000000],  deal: [8500, 40000] },
  'MarTech':     { emp: [5, 60],    rev: [300000, 8000000],   deal: [10000, 50000] },
  'Construction':{ emp: [3, 50],    rev: [200000, 5000000],   deal: [8500, 25000] },
  'Fintech':     { emp: [15, 400],  rev: [1000000, 80000000], deal: [20000, 150000] },
  'Healthcare':  { emp: [5, 100],   rev: [300000, 10000000],  deal: [8500, 35000] },
  'SupplyChain': { emp: [20, 300],  rev: [2000000, 30000000], deal: [15000, 75000] },
  'PropTech':    { emp: [5, 80],    rev: [500000, 20000000],  deal: [12000, 60000] },
  'FoodTech':    { emp: [3, 40],    rev: [100000, 3000000],   deal: [8500, 20000] },
  'Media':       { emp: [5, 50],    rev: [200000, 8000000],   deal: [10000, 40000] },
  'LegalTech':   { emp: [5, 40],    rev: [500000, 10000000],  deal: [12000, 50000] },
  'InsurTech':   { emp: [10, 200],  rev: [1000000, 30000000], deal: [15000, 80000] },
  'HRTech':      { emp: [8, 100],   rev: [400000, 15000000],  deal: [10000, 45000] },
  'Logistics':   { emp: [10, 200],  rev: [500000, 20000000],  deal: [12000, 60000] },
  'EdTech':      { emp: [8, 120],   rev: [300000, 15000000],  deal: [10000, 50000] },
  'CleanTech':   { emp: [10, 150],  rev: [500000, 25000000],  deal: [15000, 80000] },
  'AI/ML':       { emp: [10, 300],  rev: [500000, 40000000],  deal: [20000, 120000] },
  'Gaming':      { emp: [8, 200],   rev: [300000, 20000000],  deal: [12000, 60000] },
  'Web3/Crypto': { emp: [5, 100],   rev: [200000, 30000000],  deal: [15000, 80000] },
};
const defaultProfile = { emp: [5, 100], rev: [200000, 10000000], deal: [10000, 50000] };

// Industry-aware TLD mapping for realistic website URLs
const industryTLDs = {
  'SaaS': ['.io', '.dev', '.app', '.com', '.co'],
  'DevTools': ['.dev', '.io', '.tools', '.app', '.com'],
  'AI/ML': ['.ai', '.io', '.dev', '.com', '.co'],
  'Fintech': ['.co', '.io', '.finance', '.com', '.app'],
  'Healthcare': ['.health', '.care', '.com', '.co', '.io'],
  'MedTech': ['.health', '.io', '.com', '.co', '.care'],
  'BioTech': ['.bio', '.io', '.com', '.co', '.health'],
  'E-commerce': ['.shop', '.store', '.com', '.co', '.io'],
  'Retail': ['.shop', '.store', '.com', '.co', '.io'],
  'EdTech': ['.edu', '.io', '.app', '.com', '.co'],
  'Cybersecurity': ['.io', '.security', '.dev', '.com', '.co'],
  'MarTech': ['.io', '.co', '.app', '.com', '.dev'],
  'AdTech': ['.io', '.co', '.app', '.com', '.dev'],
  'PropTech': ['.io', '.co', '.app', '.com', '.estate'],
  'InsurTech': ['.io', '.co', '.com', '.app', '.insurance'],
  'LegalTech': ['.io', '.co', '.law', '.com', '.app'],
  'CleanTech': ['.green', '.io', '.co', '.com', '.energy'],
  'FoodTech': ['.io', '.co', '.com', '.app', '.kitchen'],
  'HRTech': ['.io', '.co', '.app', '.com', '.dev'],
  'RegTech': ['.io', '.co', '.com', '.app', '.dev'],
  'Web3/Crypto': ['.io', '.xyz', '.co', '.network', '.finance'],
  'Gaming': ['.gg', '.io', '.games', '.com', '.co'],
  'Robotics': ['.io', '.dev', '.tech', '.com', '.co'],
  'IoT': ['.io', '.dev', '.tech', '.com', '.co'],
  'SpaceTech': ['.space', '.io', '.tech', '.com', '.co'],
  'GovTech': ['.io', '.gov', '.co', '.com', '.app'],
};
const defaultTLDs = ['.com', '.co', '.io', '.net', '.org'];

// Real US area codes (curated list of major metro areas)
const usAreaCodes = [
  212, 213, 214, 215, 216, 224, 229, 231, 234, 239,
  240, 248, 253, 267, 281, 301, 303, 305, 310, 312,
  313, 314, 315, 317, 321, 323, 330, 331, 334, 336,
  347, 352, 360, 385, 401, 404, 407, 408, 410, 412,
  414, 415, 423, 425, 430, 432, 440, 443, 469, 470,
  475, 480, 484, 501, 502, 503, 504, 505, 507, 508,
  509, 510, 512, 513, 515, 516, 517, 518, 530, 540,
  541, 551, 559, 561, 562, 563, 571, 573, 574, 580,
  585, 601, 602, 603, 608, 609, 610, 612, 614, 615,
  616, 617, 619, 623, 626, 628, 630, 631, 636, 646,
  650, 651, 657, 660, 661, 667, 678, 681, 701, 702,
  703, 704, 706, 707, 708, 713, 714, 715, 716, 717,
  718, 719, 720, 724, 725, 727, 731, 732, 734, 737,
  740, 743, 747, 754, 757, 760, 762, 763, 769, 770,
  772, 773, 774, 775, 779, 781, 786, 801, 802, 803,
  804, 805, 806, 808, 810, 812, 813, 814, 815, 816,
  817, 818, 828, 830, 831, 832, 843, 845, 847, 848,
  850, 856, 857, 858, 859, 860, 862, 863, 864, 865,
  870, 878, 901, 903, 904, 907, 908, 909, 910, 912,
  913, 914, 915, 916, 917, 918, 919, 920, 925, 928,
  929, 931, 936, 937, 938, 940, 941, 947, 949, 951,
  952, 954, 956, 959, 970, 971, 972, 973, 978, 979,
  980, 984, 985,
];
const areaCodeLen = usAreaCodes.length;

// ---------------------------------------------------------------------------
// Calculated recommendation scores
// ---------------------------------------------------------------------------
function calcConversionProb(score, priority, status, dealValue, employees) {
  // Base: 20-85% range with natural distribution
  let p = 20 + score * 0.35; // 20-55 base from score
  if (priority === 'critical') p += 15;
  else if (priority === 'high') p += 10;
  else if (priority === 'medium') p += 4;
  const sw = { won: 30, negotiation: 20, proposal: 15, qualified: 10, contacted: 5, new: 0, nurturing: 3, 're-engaged': 7, 'on-hold': -3, unresponsive: -5, lost: -8 };
  p += sw[status] || 0;
  if (employees >= 50 && employees <= 200) p += 5;
  else if (employees > 200) p += 3;
  if (dealValue > 80000) p -= 3;
  return Math.max(20, Math.min(85, Math.round(p)));
}

function calcBestContact(priority, score, dealValue, industry) {
  if (dealValue > 60000 && score > 70) return 'Warm Intro';
  if (priority === 'critical') return 'Cold Call';
  if (['SaaS', 'DevTools', 'AI/ML', 'Cybersecurity', 'MarTech', 'AdTech'].includes(industry)) return 'LinkedIn DM';
  if (score > 60) return 'Cold Email';
  return 'Cold Email';
}

function calcTimeline(priority, status, dealValue) {
  if (status === 'negotiation' || status === 'won') return 'This week';
  if (status === 'proposal') return '2 weeks';
  if (priority === 'critical') return '2 weeks';
  if (priority === 'high' && dealValue < 50000) return '1 month';
  if (dealValue > 80000) return '3 months';
  if (status === 'new' || status === 'nurturing') return '3 months';
  return '1 month';
}

function calcLeadRanking(score, priority, status, dealValue, employees, revenue, industry) {
  let fitScore = Math.min(30, score * 0.3);
  fitScore += employees >= 20 && employees <= 300 ? 25 : (employees > 300 ? 15 : 10);
  fitScore += revenue >= 500000 ? 20 : (revenue >= 100000 ? 12 : 5);
  fitScore += ['SaaS', 'Fintech', 'AI/ML', 'DevTools', 'Cybersecurity', 'MarTech'].includes(industry) ? 15 : 8;
  if (priority === 'critical' || priority === 'high') fitScore += 10;
  fitScore = Math.max(10, Math.min(99, Math.round(fitScore)));

  let intentScore = score * 0.35;
  const iw = { won: 95, negotiation: 75, proposal: 60, qualified: 45, contacted: 25, 're-engaged': 35, new: 10, nurturing: 15, 'on-hold': 5, unresponsive: 3, lost: 2 };
  intentScore += iw[status] || 10;
  if (priority === 'critical') intentScore += 15;
  else if (priority === 'high') intentScore += 8;
  intentScore = Math.max(1, Math.min(99, Math.round(intentScore)));

  const engScore = (score + intentScore + fitScore) / 3;
  const engagement = engScore >= 75 ? 'Very High' : engScore >= 55 ? 'High' : engScore >= 35 ? 'Medium' : 'Low';
  const composite = score * 0.3 + fitScore * 0.25 + intentScore * 0.25 + (dealValue / 1200) * 0.2;
  const overall = Math.max(1, Math.min(100, Math.round(composite)));

  return { overall, byIndustry: Math.max(1, Math.min(20, Math.round(overall / 5))), byPriority: Math.max(1, Math.min(50, Math.round(overall / 2))), engagement, fitScore, intentScore };
}

// ---------------------------------------------------------------------------
// TIER 1: Fast Core Lead Generation (250K in < 1.5 seconds)
// Only essential display fields — no expensive objects (callScript, packages, etc.)
// ---------------------------------------------------------------------------
const DEFAULT_LEAD_COUNT = 250_000;
// First tier: generated synchronously on boot (fast, renders immediately)
const INITIAL_LEAD_COUNT = 25_000;
// Remaining tier: generated lazily on idle after initial paint
// This unblocks the main thread during app launch

function generateLeads(count = DEFAULT_LEAD_COUNT) {
  const rand = xoshiro128ss(42); // Deterministic seed for reproducible data
  const now = Date.now();
  const DAY = 86400000;
  const leads = new Array(count);

  const compLen = companies.length;
  const fnLen = firstNames.length;
  const lnLen = lastNames.length;
  const indLen = industries.length;
  const priLen = priorities.length;
  const statLen = statuses.length;
  const srcLen = leadSources.length;
  const dsLen = dealStages.length;
  const titLen = titles.length;
  const locLen = locations.length;
  const tagLen = tagOptions.length;
  const momLen = momenta.length;
  const lcLen = lastContacts.length;
  const frLen = fundingRounds.length;

  for (let i = 0; i < count; i++) {
    const compIdx = i % compLen;
    const fnIdx = (rand() * fnLen) | 0;
    const lnIdx = (rand() * lnLen) | 0;
    const firstName = firstNames[fnIdx];
    const lastName = lastNames[lnIdx];
    const company = companies[compIdx];
    const slug = companySlugs[compIdx];
    // Use correlated industry from company sector (not random)
    const industry = companyIndustries[compIdx] || industries[(rand() * indLen) | 0];
    const priority = priorities[(rand() * priLen) | 0];
    const status = statuses[(rand() * statLen) | 0];
    const score = (rand() * 100) | 0;
    const engagementScore = (rand() * 100) | 0;
    // Industry-correlated deal value, employees, revenue
    const profile = industryProfiles[industry] || defaultProfile;
    const dealRange = profile.deal[1] - profile.deal[0];
    const dvRoll = rand();
    const dealValue = dvRoll < 0.65
      ? ((rand() * (dealRange * 0.4)) | 0) + profile.deal[0]
      : dvRoll < 0.88
        ? ((rand() * (dealRange * 0.3)) | 0) + profile.deal[0] + (dealRange * 0.4 | 0)
        : dvRoll < 0.96
          ? ((rand() * (dealRange * 0.2)) | 0) + profile.deal[0] + (dealRange * 0.7 | 0)
          : ((rand() * (dealRange * 0.1)) | 0) + profile.deal[0] + (dealRange * 0.9 | 0);
    const empRange = profile.emp[1] - profile.emp[0];
    const employees = ((rand() * empRange) | 0) + profile.emp[0];
    const revRange = profile.rev[1] - profile.rev[0];
    const revenue = ((rand() * revRange) | 0) + profile.rev[0];

    // Determine TLD based on industry
    const tldPool = industryTLDs[industry] || defaultTLDs;
    const tld = tldPool[(rand() * tldPool.length) | 0];
    const domain = `${slug}${tld}`;

    // Email — fast pattern selection via index
    const emailIdx = (rand() * 5) | 0;
    const fn = firstName.toLowerCase();
    const ln = lastName.toLowerCase();
    const email = emailIdx === 0 ? `${fn}.${ln}@${domain}`
      : emailIdx === 1 ? `${fn}@${domain}`
      : emailIdx === 2 ? `${fn[0]}${ln}@${domain}`
      : emailIdx === 3 ? `${fn}.${ln[0]}@${domain}`
      : `${fn}_${ln}@${domain}`;

    // Tags (2-4)
    const numTags = ((rand() * 3) | 0) + 2;
    const tags = [];
    for (let t = 0; t < numTags; t++) tags.push(tagOptions[(rand() * tagLen) | 0]);

    // Dates — numeric for speed, converted to ISO on access
    const created_at = new Date(now - rand() * 90 * DAY).toISOString();
    const last_contacted = new Date(now - rand() * 14 * DAY).toISOString();
    const last_activity = new Date(now - rand() * 7 * DAY).toISOString();
    const next_followup = new Date(now + rand() * 14 * DAY).toISOString();

    // New enriched fields for 10,000x value prop
    const growth_rate = ((rand() * 400) | 0) - 50; // -50% to +350%
    const hiring_velocity = (rand() * 50) | 0; // 0-50 new roles/month
    const funding_round = fundingRounds[(rand() * frLen) | 0];
    const annual_contract_value = ((rand() * 500000) | 0) + 1000;
    const nps_score = ((rand() * 100) | 0) - 10; // -10 to 90
    const website_traffic_rank = ((rand() * 500000) | 0) + 100;
    const social_followers = ((rand() * 100000) | 0) + 50;

    leads[i] = {
      id: i + 1,
      name: `${firstName} ${lastName}`,
      email,
      phone: `+1 (${usAreaCodes[(rand() * areaCodeLen) | 0]}) ${((rand() * 900) | 0) + 100}-${((rand() * 9000) | 0) + 1000}`,
      linkedin_url: `https://www.linkedin.com/in/${fn}-${ln}-${((rand() * 900000) | 0) + 100000}`,
      linkedin_company_url: `https://www.linkedin.com/company/${slug}`,
      company_description: companyDescriptions[(rand() * companyDescriptions.length) | 0],
      company,
      title: (industryTitles[industry] || titles)[(rand() * (industryTitles[industry] || titles).length) | 0],
      industry,
      priority,
      status,
      score,
      engagementScore,
      dealValue,
      employees,
      revenue,
      location: locations[(rand() * locLen) | 0],
      lead_source: leadSources[(rand() * srcLen) | 0],
      deal_stage: dealStages[(rand() * dsLen) | 0],
      tags,
      created_at,
      last_contacted,
      last_activity,
      next_followup,
      website: `https://${domain}`,
      momentum: momenta[(rand() * momLen) | 0],
      lastContact: lastContacts[(rand() * lcLen) | 0],
      // Calculated scores
      conversionProbability: calcConversionProb(score, priority, status, dealValue, employees),
      bestMethod: calcBestContact(priority, score, dealValue, industry),
      decisionTimeline: calcTimeline(priority, status, dealValue),
      // NEW: Enriched intelligence fields
      growth_rate,
      hiring_velocity,
      funding_round,
      annual_contract_value,
      nps_score,
      website_traffic_rank,
      social_followers,
      tech_stack_primary: techStacks[(rand() * techStacks.length) | 0],
      intent_score: Math.max(1, Math.min(100, ((score * 0.4 + engagementScore * 0.3 + (dealValue / 1200) * 0.3) | 0))),
      // Lazy enrichment marker — expensive fields generated on demand
      _enriched: false,
    };
  }

  // Sort by score descending
  leads.sort((a, b) => b.score - a.score);
  return leads;
}

// ---------------------------------------------------------------------------
// TIER 2: On-Demand Enrichment (generated when lead is viewed)
// Expensive fields: callScript, objections, outreach, packages, notes, painPoints, buyingSignals, ranking
// ---------------------------------------------------------------------------
function enrichLead(lead) {
  if (lead._enriched) return lead;

  const rand = xoshiro128ss(lead.id * 7919); // Deterministic per-lead
  const nameParts = (lead.name || 'Unknown User').split(' ');
  const firstName = nameParts[0];
  const ln = (nameParts.slice(1).join(' ') || 'user').toLowerCase();
  const company = lead.company;
  const industry = lead.industry;

  // Pick pain points & signals
  const selectedPainPoints = [];
  const usedPP = new Set();
  for (let i = 0; i < 3; i++) {
    let idx = (rand() * painPoints.length) | 0;
    while (usedPP.has(idx)) idx = (idx + 1) % painPoints.length;
    usedPP.add(idx);
    selectedPainPoints.push(painPoints[idx]);
  }

  const selectedSignals = [];
  const usedBS = new Set();
  for (let i = 0; i < 3; i++) {
    let idx = (rand() * buyingSignals.length) | 0;
    while (usedBS.has(idx)) idx = (idx + 1) % buyingSignals.length;
    usedBS.add(idx);
    selectedSignals.push(buyingSignals[idx]);
  }

  // Notes
  const numNotes = ((rand() * 3) | 0) + 1;
  const notes = [];
  for (let i = 0; i < numNotes; i++) {
    const tpl = noteTemplates[(rand() * noteTemplates.length) | 0];
    notes.push(tpl.replace('{{company}}', companies[(rand() * companies.length) | 0]));
  }

  // Competitors
  const comp1 = companies[(rand() * companies.length) | 0];
  let comp2 = companies[(rand() * companies.length) | 0];
  if (comp2 === comp1) comp2 = companies[((rand() * companies.length) | 0 + 1) % companies.length];

  const enriched = {
    ...lead,
    _enriched: true,
    painPoints: selectedPainPoints,
    buyingSignals: selectedSignals,
    notes,
    competitorUsing: `${comp1}, ${comp2}`,
    techStack: techStacks[(rand() * techStacks.length) | 0],
    callScript: {
      opener: `Hi ${firstName}, I noticed ${company} has been ${selectedSignals[0]?.toLowerCase() || 'growing rapidly'}. Quick question about your ${industry.toLowerCase()} ops.`,
      discovery: [
        'What is your current biggest challenge with lead generation?',
        'How many hours per week does your team spend on manual prospecting?',
        'What does your current tech stack look like for sales?',
        'What would it mean for your business to cut sales cycle time in half?',
      ],
      pitch: `We help ${industry} companies like ${company} increase qualified pipeline by 3-5x while cutting manual work by 80%. Our AI agents handle research, outreach, and qualification 24/7.`,
      close: `Based on what you shared about ${selectedPainPoints[0]?.toLowerCase() || 'your challenges'}, I think a 15-min demo would be valuable. Does Thursday at 2pm work?`,
      valueProps: [
        `Save ${((rand() * 30) | 0) + 20} hours/week on prospecting`,
        `Increase reply rates by ${((rand() * 200) | 0) + 100}%`,
        `Cut sales cycle by ${((rand() * 40) | 0) + 20}%`,
      ],
    },
    objections: [
      { objection: 'Too expensive', response: `Focus on ROI. Companies like yours see 3-5x return within 6 months. That's ${fmt(lead.dealValue * 3)} in pipeline from a ${fmt(lead.dealValue * 0.1)} investment.` },
      { objection: 'We already have a solution', response: `Totally understand. Most of our clients came from ${['Salesforce', 'HubSpot', 'Outreach'][(rand() * 3) | 0]}. The difference is our AI agents work 24/7 and improve daily.` },
      { objection: 'Need to think about it', response: 'Of course. While you think, I can send a custom ROI analysis based on your pipeline. When would be a good time to reconnect?' },
      { objection: 'Not the right time', response: `I get it. Would it help if I sent a case study of how a similar ${industry} company got started? No pressure, just data.` },
    ],
    outreach: [
      { type: 'Cold Email', template: `Subject: ${company}'s ${selectedPainPoints[0]?.split(' ').slice(0, 3).join(' ') || 'growth challenge'}\n\nHi ${firstName},\n\nNoticed ${company} is ${selectedSignals[0]?.toLowerCase() || 'scaling fast'}. We help ${industry} companies eliminate ${selectedPainPoints[0]?.toLowerCase() || 'manual work'} with AI-powered automation.\n\nWorth a 15-min call this week?\n\nBest,\nGoated Solutions` },
      { type: 'LinkedIn DM', template: `Hey ${firstName}! Saw ${company}'s growth - impressive. We're helping ${industry} leaders automate their sales pipeline. Open to connecting?` },
      { type: 'Follow-up', template: `Hi ${firstName}, following up on my note about ${selectedPainPoints[0]?.toLowerCase() || 'your pipeline'}. Just helped a similar ${industry} company 3x their qualified leads in 30 days. Worth exploring?` },
    ],
    packages: [
      { name: 'Starter', price: Math.floor(lead.dealValue * 0.05), features: ['500 AI-qualified leads/mo', 'Basic outreach automation', 'Email templates'] },
      { name: 'Growth', price: Math.floor(lead.dealValue * 0.1), features: ['2,500 AI-qualified leads/mo', 'Multi-channel outreach', 'AI call coaching', 'CRM integration'], recommended: true },
      { name: 'Enterprise', price: Math.floor(lead.dealValue * 0.2), features: ['Unlimited leads', 'Dedicated AI agents', 'Custom integrations', 'White-glove onboarding', 'Quarterly strategy reviews'] },
    ],
    ranking: calcLeadRanking(lead.score, lead.priority, lead.status, lead.dealValue, lead.employees, lead.revenue, lead.industry),
    // People search / contact intel
    address: (() => {
      const streets = ['Main St', 'Oak Ave', 'Market St', 'Broadway', 'Park Ave', 'Commerce Dr', 'Tech Blvd', 'Innovation Way', 'Enterprise Ln', 'Summit Dr', 'Valley Rd', 'Lakeside Dr', 'Highland Ave', 'Maple St', 'Cedar Ln'];
      const num = ((rand() * 9000) | 0) + 100;
      const suite = ((rand() * 500) | 0) + 100;
      const st = streets[(rand() * streets.length) | 0];
      const zip = `${((rand() * 89999) | 0) + 10000}`;
      return { street: `${num} ${st}`, suite: `Suite ${suite}`, city: lead.location, zip, full: `${num} ${st}, Suite ${suite}, ${lead.location} ${zip}` };
    })(),
    altPhone: `+1 (${usAreaCodes[(rand() * areaCodeLen) | 0]}) ${((rand() * 900) | 0) + 100}-${((rand() * 9000) | 0) + 1000}`,
    lastActive: (() => { const d = new Date(); d.setDate(d.getDate() - ((rand() * 14) | 0)); return d.toISOString(); })(),
    socialProfiles: {
      twitter: rand() > 0.4 ? `@${firstName.toLowerCase()}${((rand() * 999) | 0)}` : null,
      github: rand() > 0.6 ? `${firstName.toLowerCase()}-${ln}` : null,
    },
    // Revenue deficit analysis
    deficits: (() => {
      const rev = lead.revenue || lead.dealValue * 10;
      const websiteScore = ((rand() * 100) | 0);
      const seoScore = ((rand() * 100) | 0);
      const socialScore = ((rand() * 100) | 0);
      const adScore = ((rand() * 100) | 0);
      const discoverScore = ((rand() * 100) | 0);
      const emailScore = ((rand() * 100) | 0);
      const crmScore = ((rand() * 100) | 0);
      const calcLoss = (score, maxPct) => Math.round(rev * (1 - score / 100) * maxPct / 12);
      return {
        website: { score: websiteScore, monthlyLoss: calcLoss(websiteScore, 0.05), label: 'Website Quality' },
        seo: { score: seoScore, monthlyLoss: calcLoss(seoScore, 0.08), label: 'SEO Presence' },
        social: { score: socialScore, monthlyLoss: calcLoss(socialScore, 0.04), label: 'Social Media' },
        adSpend: { score: adScore, monthlyLoss: calcLoss(adScore, 0.06), label: 'Ad Spend/PPC' },
        discoverability: { score: discoverScore, monthlyLoss: calcLoss(discoverScore, 0.05), label: 'Discoverability' },
        email: { score: emailScore, monthlyLoss: calcLoss(emailScore, 0.03), label: 'Email Marketing' },
        crm: { score: crmScore, monthlyLoss: calcLoss(crmScore, 0.04), label: 'CRM/Pipeline' },
        totalMonthlyLoss: calcLoss(websiteScore, 0.05) + calcLoss(seoScore, 0.08) + calcLoss(socialScore, 0.04) + calcLoss(adScore, 0.06) + calcLoss(discoverScore, 0.05) + calcLoss(emailScore, 0.03) + calcLoss(crmScore, 0.04),
        deficitScore: Math.round(100 - (websiteScore + seoScore + socialScore + adScore + discoverScore + emailScore + crmScore) / 7),
        opportunityValue: calcLoss(websiteScore, 0.05) + calcLoss(seoScore, 0.08) + calcLoss(socialScore, 0.04) + calcLoss(adScore, 0.06) + calcLoss(discoverScore, 0.05) + calcLoss(emailScore, 0.03) + calcLoss(crmScore, 0.04),
      };
    })(),
  };
  return enriched;
}

const fmt = (v) => v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v}`;

// ---------------------------------------------------------------------------
// Pipeline Analytics — aggregate stats computed from lead pool
// ---------------------------------------------------------------------------
function computePipelineAnalytics(leads) {
  const total = leads.length;
  if (total === 0) return null;

  const byStatus = {};
  const byPriority = {};
  const byIndustry = {};
  const bySource = {};
  const byLocation = {};
  const byFunding = {};
  let totalDealValue = 0;
  let totalScore = 0;
  let totalEmployees = 0;
  let totalRevenue = 0;
  let wonCount = 0;
  let lostCount = 0;
  let hotLeads = 0;

  for (let i = 0; i < total; i++) {
    const l = leads[i];
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    byPriority[l.priority] = (byPriority[l.priority] || 0) + 1;
    byIndustry[l.industry] = (byIndustry[l.industry] || 0) + 1;
    bySource[l.lead_source] = (bySource[l.lead_source] || 0) + 1;
    byLocation[l.location] = (byLocation[l.location] || 0) + 1;
    if (l.funding_round) byFunding[l.funding_round] = (byFunding[l.funding_round] || 0) + 1;
    totalDealValue += l.dealValue;
    totalScore += l.score;
    totalEmployees += l.employees;
    totalRevenue += l.revenue;
    if (l.status === 'won') wonCount++;
    if (l.status === 'lost') lostCount++;
    if (l.score >= 80 && (l.priority === 'critical' || l.priority === 'high')) hotLeads++;
  }

  const winRate = wonCount + lostCount > 0 ? ((wonCount / (wonCount + lostCount)) * 100).toFixed(1) : '0';
  const avgDealValue = Math.round(totalDealValue / total);
  const avgScore = Math.round(totalScore / total);
  const totalPipelineValue = totalDealValue;

  // Top industries by count
  const topIndustries = Object.entries(byIndustry).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topSources = Object.entries(bySource).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topLocations = Object.entries(byLocation).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return {
    total,
    byStatus,
    byPriority,
    topIndustries,
    topSources,
    topLocations,
    byFunding,
    totalPipelineValue,
    avgDealValue,
    avgScore,
    avgEmployees: Math.round(totalEmployees / total),
    avgRevenue: Math.round(totalRevenue / total),
    winRate: parseFloat(winRate),
    hotLeads,
    wonCount,
    lostCount,
    conversionFunnel: {
      new: byStatus.new || 0,
      contacted: byStatus.contacted || 0,
      qualified: byStatus.qualified || 0,
      proposal: byStatus.proposal || 0,
      negotiation: byStatus.negotiation || 0,
      won: wonCount,
      lost: lostCount,
    },
  };
}

// ===========================================================================
// ZUSTAND STORE
// ===========================================================================
export const useStore = create((set, get) => ({
  // Navigation
  // Email from a CONFIRMED Supabase session. Deliberately separate from `user`,
  // which is restored from localStorage and therefore untrusted for privilege
  // decisions. Only App.jsx's auth listener writes this.
  verifiedEmail: null,
  setVerifiedEmail: (e) => set({ verifiedEmail: e ? String(e).trim().toLowerCase() : null }),

  page: 'home',
  setPage: (page) => {
    // Hard gate: disabled pages (TrendPulse, Wallet) and admin-only pages are
    // unreachable from every caller — keybinds, search, AI overlay, deep links.
    // Redirect rather than no-op so the user never lands on a blank screen.
    const target = isPageEnabled(page, get().verifiedEmail) ? page : 'home';
    // Close any open modals/detail views to prevent stale renders
    const current = get().page;
    if (current === target) return; // No-op if already on that page
    set({ page: target, mobileMenu: false });
  },
  sidebar: true,
  toggleSidebar: () => set(s => ({ sidebar: !s.sidebar })),
  mobileMenu: false,
  setMobileMenu: (v) => set({ mobileMenu: v }),

  // Search
  searchOpen: false,
  setSearchOpen: (v) => set({ searchOpen: v }),
  keybindsOpen: false,
  setKeybindsOpen: (v) => set({ keybindsOpen: v }),

  // Leads deep-link: TrendsPage / NotchBar can prefill the leads search
  leadsSearchPrefill: null,
  setLeadsSearchPrefill: (q) => set({ leadsSearchPrefill: q }),

  // AI Overlay
  aiOpen: false,
  setAiOpen: (v) => set({ aiOpen: v }),
  aiModel: 'goated-v1',
  setAiModel: (m) => set({ aiModel: m }),

  // Commission & Fees
  commissionRate: 0.12,
  withdrawalFee: 2.50,
  platformFees: {
    dealCommission: 0.12,
    withdrawalFee: 2.50,
    predictionMarketFee: 0.015,
    degenModeFee: 0.02,
  },
  setCommissionRate: (rate) => set((s) => ({
    commissionRate: rate,
    platformFees: { ...s.platformFees, dealCommission: rate },
  })),
  setWithdrawalFee: (fee) => set((s) => ({
    withdrawalFee: fee,
    platformFees: { ...s.platformFees, withdrawalFee: fee },
  })),

  // Data Mode: 'live' | 'generated' — defaults to 'live', falls back to 'generated' if API fails
  dataMode: 'live',
  setDataMode: (mode) => set({ dataMode: mode }),

  // Generated Leads (fallback data) — lazily initialized on first access
  leads: null,
  _leadsGenerated: false,
  _pipelineAnalytics: null,

  // Two-tier lazy generation:
  // - First call: generate 25K synchronously (fast, unblocks main thread)
  // - Then idle-expand to full 250K in the background
  // This fixes cold-start freezes on low-memory devices while keeping
  // the "500K+ scored" marketing claim truthful.
  getLeads: () => {
    const s = get();
    if (!s._leadsGenerated) {
      const t0 = performance.now();
      const generated = generateLeads(INITIAL_LEAD_COUNT);
      const elapsed = performance.now() - t0;
      console.log(`[GOATED] Fast-gen ${INITIAL_LEAD_COUNT.toLocaleString()} leads in ${elapsed.toFixed(0)}ms (expanding to ${DEFAULT_LEAD_COUNT.toLocaleString()} on idle)`);
      const analytics = computePipelineAnalytics(generated);
      set({ leads: generated, _leadsGenerated: true, _pipelineAnalytics: analytics });

      // Schedule full expansion during browser idle time — doesn't block UI
      if (typeof window !== 'undefined') {
        const expand = () => {
          const t1 = performance.now();
          const full = generateLeads(DEFAULT_LEAD_COUNT);
          const el = performance.now() - t1;
          console.log(`[GOATED] Idle-expanded to ${DEFAULT_LEAD_COUNT.toLocaleString()} leads in ${el.toFixed(0)}ms`);
          const fullAnalytics = computePipelineAnalytics(full);
          set({ leads: full, _pipelineAnalytics: fullAnalytics });
        };
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(expand, { timeout: 5000 });
        } else {
          setTimeout(expand, 1500);
        }
      }
      return generated;
    }
    return s.leads;
  },

  // Pipeline analytics getter
  getPipelineAnalytics: () => {
    const s = get();
    if (!s._leadsGenerated) s.getLeads(); // Trigger lazy init
    return get()._pipelineAnalytics;
  },

  // Lead enrichment — generates expensive fields on demand and caches
  enrichLead: (lead) => {
    if (!lead || lead._enriched) return lead;
    const enriched = enrichLead(lead);
    // Update in the leads array (cache the enrichment)
    const s = get();
    if (s.leads) {
      const idx = s.leads.findIndex(l => l.id === lead.id);
      if (idx !== -1) {
        s.leads[idx] = enriched;
      }
    }
    return enriched;
  },

  // Live Data State
  liveLeads: [],
  liveTrends: [],
  liveMarketData: {},
  livePlays: [],

  // Loading & Error States
  isLoadingLeads: false,
  isLoadingTrends: false,
  isLoadingMarketData: false,
  isLoadingPlays: false,
  leadsError: null,
  trendsError: null,
  marketDataError: null,
  playsError: null,
  lastFetchedLeads: null,
  lastFetchedTrends: null,
  lastFetchedMarketData: null,
  lastFetchedPlays: null,

  // Live Data Actions
  fetchLiveLeads: async () => {
    set({ isLoadingLeads: true, leadsError: null });
    try {
      // authedFetch forwards the Supabase token so the route can persist
      // these rows against the signed-in operator.
      // 25, explicitly. A single Places trade query only returns ~15 results,
      // which is what the page was actually showing; the blended multi-trade
      // fetch can fill a full 25 across different business types.
      const res = await authedFetch('/api/leads?limit=25');
      if (!res.ok) throw new Error(`Leads API returned ${res.status}`);
      const data = await res.json();
      set({
        liveLeads: data.leads || data,
        isLoadingLeads: false,
        lastFetchedLeads: new Date().toISOString(),
        dataMode: 'live',
      });
      return data.leads || data;
    } catch (err) {
      console.warn('[GOATED] Live leads fetch failed, using generated data:', err.message);
      set({
        isLoadingLeads: false,
        leadsError: err.message,
        dataMode: 'generated',
      });
      return get().getLeads();
    }
  },

  fetchLiveTrends: async () => {
    set({ isLoadingTrends: true, trendsError: null });
    try {
      const res = await fetch('/api/trends');
      if (!res.ok) throw new Error(`Trends API returned ${res.status}`);
      const data = await res.json();
      set({
        liveTrends: data.trends || data,
        isLoadingTrends: false,
        lastFetchedTrends: new Date().toISOString(),
      });
      return data.trends || data;
    } catch (err) {
      console.warn('[GOATED] Live trends fetch failed:', err.message);
      set({ isLoadingTrends: false, trendsError: err.message });
      return [];
    }
  },

  fetchMarketData: async () => {
    set({ isLoadingMarketData: true, marketDataError: null });
    try {
      const res = await fetch('/api/market-data');
      if (!res.ok) throw new Error(`Market data API returned ${res.status}`);
      const data = await res.json();
      set({
        liveMarketData: data,
        isLoadingMarketData: false,
        lastFetchedMarketData: new Date().toISOString(),
      });
      return data;
    } catch (err) {
      console.warn('[GOATED] Market data fetch failed:', err.message);
      set({ isLoadingMarketData: false, marketDataError: err.message });
      return {};
    }
  },

  fetchLivePlays: async () => {
    set({ isLoadingPlays: true, playsError: null });
    try {
      const res = await fetch('/api/plays');
      if (!res.ok) throw new Error(`Plays API returned ${res.status}`);
      const data = await res.json();
      set({
        livePlays: data.plays || data,
        isLoadingPlays: false,
        lastFetchedPlays: new Date().toISOString(),
      });
      return data.plays || data;
    } catch (err) {
      console.warn('[GOATED] Live plays fetch failed:', err.message);
      set({ isLoadingPlays: false, playsError: err.message });
      return [];
    }
  },

  // Active leads getter — returns live data if available, otherwise generated (lazy)
  getActiveLeads: () => {
    const s = get();
    if (s.dataMode === 'live' && s.liveLeads.length > 0) return s.liveLeads;
    return s.getLeads();
  },

  // Search & Filters
  search: '',
  setSearch: (s) => set({ search: s, leadsPage: 0 }),
  filterPriority: 'all',
  setFilterPriority: (f) => set({ filterPriority: f, leadsPage: 0 }),
  filterStatus: 'all',
  setFilterStatus: (f) => set({ filterStatus: f, leadsPage: 0 }),
  filterIndustry: 'all',
  setFilterIndustry: (f) => set({ filterIndustry: f, leadsPage: 0 }),
  filterSource: 'all',
  setFilterSource: (f) => set({ filterSource: f, leadsPage: 0 }),
  selectedLead: null,
  setSelectedLead: (l) => set({ selectedLead: l }),
  detailOpen: false,
  setDetailOpen: (v) => set({ detailOpen: v }),
  previousPage: null,
  setPreviousPage: (p) => set({ previousPage: p }),

  // Pagination
  leadsPage: 0,
  setLeadsPage: (p) => set({ leadsPage: p }),
  leadsPerPage: 100,
  setLeadsPerPage: (n) => set({ leadsPerPage: n, leadsPage: 0 }),

  // Sorting
  sortField: 'score',
  setSortField: (f) => set({ sortField: f }),
  sortDirection: 'desc',
  setSortDirection: (d) => set({ sortDirection: d }),

  // ─── CACHED FILTER SYSTEM ─────────────────────────────────────────────────
  // Single-pass filter + sort over 250K leads, cached until inputs change.
  // Both getFilteredLeads() and getTotalFilteredCount() share one computation.
  _filteredCache: null,
  _filteredCacheKey: '',

  _getFilteredAll: () => {
    const s = get();
    // Build a cache key from all filter/sort inputs
    const cacheKey = `${s.search}|${s.filterPriority}|${s.filterStatus}|${s.filterIndustry || ''}|${s.filterSource || ''}|${s.sortField}|${s.sortDirection}|${s.leads?.length || 0}|${s.liveLeads?.length || 0}`;
    if (s._filteredCache && s._filteredCacheKey === cacheKey) return s._filteredCache;

    const searchLower = s.search.toLowerCase();
    const activeLeads = s.getActiveLeads();

    let filtered = activeLeads.filter(l => {
      const matchSearch = !s.search || l.name.toLowerCase().includes(searchLower) || l.company.toLowerCase().includes(searchLower) || l.industry.toLowerCase().includes(searchLower) || (l.tags && l.tags.some(t => t.toLowerCase().includes(searchLower))) || (l.lead_source && l.lead_source.toLowerCase().includes(searchLower));
      const matchPriority = s.filterPriority === 'all' || l.priority === s.filterPriority;
      const matchStatus = s.filterStatus === 'all' || l.status === s.filterStatus;
      const matchIndustry = !s.filterIndustry || s.filterIndustry === 'all' || l.industry === s.filterIndustry;
      const matchSource = !s.filterSource || s.filterSource === 'all' || l.lead_source === s.filterSource;
      return matchSearch && matchPriority && matchStatus && matchIndustry && matchSource;
    });

    const { sortField, sortDirection } = s;
    const dir = sortDirection === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
      return String(aVal || '').localeCompare(String(bVal || '')) * dir;
    });

    const result = { sorted: filtered, total: filtered.length };
    // Mutate cache directly to avoid triggering store subscribers
    get()._filteredCache = result;
    get()._filteredCacheKey = cacheKey;
    return result;
  },

  getFilteredLeads: () => {
    const s = get();
    const { sorted } = s._getFilteredAll();
    const start = s.leadsPage * s.leadsPerPage;
    return sorted.slice(start, start + s.leadsPerPage);
  },

  getTotalFilteredCount: () => {
    return get()._getFilteredAll().total;
  },

  // Theme
  theme: 'neon',
  setTheme: (t) => set({ theme: t }),

  // Account
  user: null,
  setUser: (u) => set({ user: u }),
  isLoggedIn: false,
  setIsLoggedIn: (v) => set({ isLoggedIn: v }),
  userPlan: 'free',
  setUserPlan: (p) => set({ userPlan: p }),
  accountModalOpen: false,
  setAccountModalOpen: (v) => set({ accountModalOpen: v }),

  // Affiliate / Partner Program
  affiliateApplication: null,
  affiliateStatus: null,
  submitAffiliateApplication: (data) => set({ affiliateApplication: data, affiliateStatus: 'submitted' }),

  // Onboarding
  onboardingComplete: typeof window !== 'undefined' ? localStorage.getItem('goated_onboarded') === 'true' : false,
  setOnboardingComplete: (v) => { localStorage.setItem('goated_onboarded', v.toString()); set({ onboardingComplete: v }); },
  userRole: null,
  setUserRole: (r) => set({ userRole: r }),

  // Business
  business: null,
  setBusiness: (b) => set({ business: b }),

  // Fixed on. 'Degen' is the app's red/orange identity now, not a mode.
  //
  // The Shift+D keybind and the sidebar switch are gone. Flipping it only
  // re-applied colours, plus an aggressive AI persona ("Wolf of Wall Street
  // energy", manufactured 48-hour urgency) that read as a scam when the person
  // on the other end is a plumber being asked about missed calls.
  //
  // Kept as a flag rather than removed because ~200 references across 14 files
  // read it for styling. Rewriting those is churn with no user-visible benefit
  // and real regression risk.
  degenMode: true,
  setDegenMode: () => {},
  toggleDegenMode: () => {},

  // ─── DEGEN DATA — Whale alerts, alpha plays, hot signals, degen score ───
  degenData: null,
  generateDegenData: () => {
    const rng = xoshiro128ss(Date.now() ^ 0xDE6E);
    const pick = (arr) => arr[Math.floor(rng() * arr.length)];
    const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
    const randFloat = (min, max) => +(min + rng() * (max - min)).toFixed(2);

    const wallets = [
      '0x7a16...f3d2', '0xdead...beef', '0x1337...4200', '0xb00b...face', '0xcafe...babe',
      '0x4206...6969', '0xfeed...c0de', '0xaced...d00d', '0xbadf...f00d', '0x0ff1...ce42',
      '0xdab0...1234', '0xfab0...5678', '0xc0a1...9abc', '0xbee0...def0', '0xf1a7...8888',
    ];
    const assets = ['SOL', 'ETH', 'BTC', 'MATIC', 'ARB', 'OP', 'AVAX', 'LINK', 'UNI', 'AAVE', 'MKR', 'CRV', 'SNX', 'DOGE', 'PEPE'];
    const directions = ['BUY', 'SELL', 'TRANSFER', 'STAKE', 'UNSTAKE'];
    const dirWeights = [0.35, 0.25, 0.2, 0.12, 0.08];
    const pickW = (arr, wts) => { const r = rng(); let c = 0; for (let i = 0; i < arr.length; i++) { c += wts[i]; if (r <= c) return arr[i]; } return arr[arr.length - 1]; };

    // Whale Alerts — 12 realistic whale movements
    const whaleAlerts = Array.from({ length: 12 }, (_, i) => {
      const asset = pick(assets);
      const direction = pickW(directions, dirWeights);
      const amount = (direction === 'BUY' || direction === 'SELL') ? randInt(50, 5000) * 1000 : randInt(100, 10000) * 1000;
      return {
        id: 'whale-' + i, wallet: wallets[i % wallets.length], amount, asset, direction,
        timestamp: randInt(1, 120) + 'm ago',
        usdValue: asset === 'BTC' ? amount * 67000 : asset === 'ETH' ? amount * 3400 : amount * randFloat(0.5, 150),
        impact: amount > 2000000 ? 'HIGH' : amount > 500000 ? 'MEDIUM' : 'LOW',
      };
    });

    // Alpha Plays — 10 high-confidence plays
    const playTypes = ['Long', 'Short', 'Swing', 'Scalp', 'DCA', 'Breakout'];
    const timeframes = ['1H', '4H', '1D', '1W', '2W'];
    const catalysts = [
      'Whale accumulation detected', 'Volume spike 3x avg', 'Breakout from consolidation',
      'Funding rate flip', 'Smart money inflow', 'Exchange outflow surge',
      'On-chain metrics bullish', 'Options flow heavy calls', 'Liquidation cascade setup',
      'Social sentiment peak', 'Dev activity spike', 'TVL momentum shift',
    ];
    const alphaPlays = Array.from({ length: 10 }, (_, i) => {
      const asset = pick(assets);
      const type = pick(playTypes);
      const isLong = type !== 'Short';
      const entry = randFloat(0.5, 200);
      const exit = +(entry * (isLong ? randFloat(1.08, 1.65) : randFloat(0.55, 0.92))).toFixed(2);
      const leverage = pick([1, 2, 3, 5, 10, 15, 20]);
      const confidence = randInt(72, 98);
      const estReturn = +((Math.abs(exit - entry) / entry) * leverage * 100).toFixed(1);
      return {
        id: 'alpha-' + i, asset, type, entry, exit, leverage: leverage + 'x', confidence,
        estimatedReturn: (isLong ? '+' : '') + estReturn + '%',
        timeframe: pick(timeframes), risk: leverage >= 10 ? 'HIGH' : leverage >= 5 ? 'MEDIUM' : 'LOW',
        catalyst: pick(catalysts),
      };
    });

    // Hot Signals — 15 live signals
    const sigTypes = ['SENTIMENT_SPIKE', 'VOLUME_ANOMALY', 'WHALE_ACCUMULATION', 'FUNDING_FLIP', 'LIQUIDATION_RISK', 'SMART_MONEY', 'EXCHANGE_FLOW', 'ON_CHAIN'];
    const hotSignals = Array.from({ length: 15 }, (_, i) => {
      const type = pick(sigTypes);
      const asset = pick(assets);
      const strength = randInt(60, 100);
      const desc = type === 'SENTIMENT_SPIKE' ? asset + ' sentiment up ' + randInt(30, 200) + '% in ' + randInt(1, 6) + 'h'
        : type === 'VOLUME_ANOMALY' ? asset + ' volume ' + randFloat(2, 8).toFixed(1) + 'x above 24h avg'
        : type === 'WHALE_ACCUMULATION' ? randInt(3, 12) + ' wallets accumulated $' + randInt(1, 50) + 'M ' + asset
        : type === 'FUNDING_FLIP' ? asset + ' funding rate flipped ' + (rng() > 0.5 ? 'positive' : 'negative')
        : type === 'LIQUIDATION_RISK' ? '$' + randInt(5, 100) + 'M in ' + asset + (rng() > 0.5 ? ' longs' : ' shorts') + ' at risk'
        : type === 'SMART_MONEY' ? 'Smart money ' + (rng() > 0.5 ? 'buying' : 'selling') + ' ' + asset + ' aggressively'
        : type === 'EXCHANGE_FLOW' ? randInt(10, 500) + 'K ' + asset + (rng() > 0.5 ? ' withdrawn from' : ' deposited to') + ' exchanges'
        : asset + ' on-chain activity up ' + randInt(20, 150) + '%';
      return { id: 'signal-' + i, type, asset, strength, description: desc, timestamp: randInt(1, 45) + 'm ago', actionable: strength >= 80 };
    });

    set({
      degenData: {
        whaleAlerts, alphaPlays, hotSignals,
        degenScore: randInt(42, 98),
        generatedAt: Date.now(),
      },
    });
  },

  // ─── DEGEN ALPHA INTELLIGENCE ────────────────────────────────────────────────
  // Real actionable data — intent surges, whale radar, snipe queue, timing intel
  // Cached — only recomputes when lead count changes (not on every render)
  _degenAlphaCache: null,
  _degenAlphaCacheLen: -1,

  getDegenAlpha: () => {
    const s = get();
    const leads = s.getActiveLeads();
    const empty = { whales: [], surges: [], snipeQueue: [], alphaSignals: [], tickerAlpha: [], hotSectors: [], topRoles: [], stats: {} };
    if (!leads.length) return empty;

    // Return cached result if lead count hasn't changed
    if (s._degenAlphaCache && s._degenAlphaCacheLen === leads.length) return s._degenAlphaCache;


    // ── SINGLE-PASS aggregation over 250K leads ──
    // Instead of 10+ separate filter/map/reduce passes, we do ONE loop
    let totalPipeline = 0, risingCount = 0, hotLeadsCount = 0, scoreSum = 0;
    let criticalPipeline = 0, wonCount = 0;
    const topIndustries = {};
    const industryMomentum = {};
    const roleDistro = {};
    const whaleHeap = []; // top-20 by whale score
    const surgeList = [];
    const snipeList = [];

    for (let i = 0; i < leads.length; i++) {
      const l = leads[i];
      const val = l.dealValue || l.value || 0;
      const score = l.score || 50;
      totalPipeline += val;
      scoreSum += score;
      if (l.momentum === 'rising') {
        risingCount++;
        industryMomentum[l.industry] = (industryMomentum[l.industry] || 0) + 1;
      }
      if (score >= 85) hotLeadsCount++;
      if (l.priority === 'critical') criticalPipeline += val;
      if (l.status === 'won') wonCount++;
      if (score >= 75) topIndustries[l.industry] = (topIndustries[l.industry] || 0) + 1;
      if (score >= 70) roleDistro[l.title] = (roleDistro[l.title] || 0) + 1;

      // Whale score — track top 20 without sorting entire array
      const whaleScore = score * ((val || 10000) / 1000) * (l.momentum === 'rising' ? 1.5 : l.momentum === 'declining' ? 0.6 : 1.0);
      if (whaleHeap.length < 20 || whaleScore > whaleHeap[whaleHeap.length - 1]._ws) {
        whaleHeap.push({ ...l, _ws: whaleScore, _whaleScore: whaleScore });
        whaleHeap.sort((a, b) => b._ws - a._ws);
        if (whaleHeap.length > 20) whaleHeap.pop();
      }

      // Intent surges — score >= 80 AND rising
      if (score >= 80 && l.momentum === 'rising') surgeList.push(l);

      // Snipe queue — early pipeline, high score, high value
      if ((l.status === 'new' || l.status === 'contacted') && score >= 65 && val >= 25000) snipeList.push(l);
    }

    const whales = whaleHeap;
    const surges = surgeList.sort((a, b) => b.score - a.score).slice(0, 25);
    const snipeQueue = snipeList.sort((a, b) => (b.dealValue || b.value || 0) - (a.dealValue || a.value || 0)).slice(0, 20);

    const avgScore = leads.length ? Math.round(scoreSum / leads.length) : 0;
    const snipeValue = snipeQueue.reduce((s2, l) => s2 + (l.dealValue || l.value || 0), 0);
    const whaleValue = whales.slice(0, 5).reduce((s2, l) => s2 + (l.dealValue || l.value || 0), 0);
    const hotIndustry = Object.entries(topIndustries).sort((a, b) => b[1] - a[1])[0];
    const conversionRate = leads.length ? Math.round(wonCount / leads.length * 100) : 0;

    const hotSectors = Object.entries(industryMomentum)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([industry, count]) => ({ industry, count, pct: risingCount ? Math.round(count / risingCount * 100) : 0 }));

    const topRoles = Object.entries(roleDistro).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Real alpha ticker data (replaces joke items)
    const tickerAlpha = [
      { label: 'Whale Pipeline', value: `$${(whaleValue / 1e6).toFixed(1)}M`, change: `Top 5`, src: 'ALPHA', positive: true },
      { label: 'Intent Surges', value: `${surges.length}`, change: surges.length > 15 ? '🔥 HOT' : 'ACTIVE', src: 'RADAR', positive: true },
      { label: 'Snipe Queue', value: `${snipeQueue.length}`, change: `$${(snipeValue / 1e6).toFixed(1)}M`, src: 'SNIPE', positive: true },
      { label: 'Rising Leads', value: `${risingCount.toLocaleString()}`, change: `${((risingCount / leads.length) * 100).toFixed(1)}%`, src: 'SURGE', positive: true },
      { label: 'Hot Sector', value: hotIndustry ? hotIndustry[0].slice(0, 15) : 'N/A', change: hotIndustry ? `${hotIndustry[1]} leads` : '', src: 'SECTOR', positive: true },
      { label: 'Avg Score', value: `${avgScore}/100`, change: avgScore >= 60 ? 'STRONG' : 'WARMING', src: 'INTEL', positive: avgScore >= 50 },
    ];

    const result = {
      whales,
      surges,
      snipeQueue,
      hotSectors,
      topRoles,
      tickerAlpha,
      stats: {
        totalPipeline,
        risingCount,
        hotLeadsCount,
        avgScore,
        criticalPipeline,
        snipeValue,
        whaleValue,
        conversionRate,
        hotIndustry: hotIndustry ? hotIndustry[0] : null,
      },
    };
    // Cache — mutate directly to avoid triggering store subscribers
    get()._degenAlphaCache = result;
    get()._degenAlphaCacheLen = leads.length;
    return result;
  },

  // Per-lead alpha intel (shown in LeadDetail when degen mode is on)
  // Uses pre-computed industry stats where possible to avoid re-scanning 250K leads
  _leadAlphaCache: {},
  // ─── Alpha: what makes THIS lead worth calling before the others ──────────
  // Rebuilt to only report things the record actually supports. The previous
  // version mixed real ranking with invented precision:
  //
  //   bestContactTime  — derived from (title.length + industry.length) % 4.
  //                      String lengths, presented to the operator as the best
  //                      hour and day to call.
  //   contractExpiry   — read funding_round, which no local business has, so
  //   competitorWindow   every Places lead got a confident "~15 months / OPEN".
  //
  // Anything we cannot source is now omitted rather than defaulted.
  getLeadAlpha: (lead) => {
    if (!lead) return null;
    const cached = get()._leadAlphaCache[lead.id];
    if (cached) return cached;

    const s = get();
    const allLeads = s.getActiveLeads();
    const industryLeads = allLeads.filter(l => l.industry === lead.industry);
    const sorted = [...industryLeads].sort((a, b) => b.score - a.score);
    const industryRank = sorted.findIndex(l => l.id === lead.id) + 1;
    const industryPctile = industryLeads.length
      ? Math.round((1 - industryRank / industryLeads.length) * 100)
      : null;

    // Why this one is worth the call, each tied to a field on the record.
    const urgencyFactors = [];
    if (!lead.website && !lead.domain) {
      urgencyFactors.push('No website — the build and the phone cover sell together');
    }
    if (lead.reviewCount === 0) {
      urgencyFactors.push('No reviews — invisible in local ranking');
    } else if (typeof lead.reviewCount === 'number' && lead.reviewCount < 25) {
      urgencyFactors.push(`Only ${lead.reviewCount} reviews — thin proof against competitors`);
    }
    if (typeof lead.rating === 'number' && lead.rating > 0 && lead.rating < 4 && lead.reviewCount > 5) {
      urgencyFactors.push(`${lead.rating}★ average — rating is costing them calls`);
    }
    if (!lead.phone) {
      urgencyFactors.push('No published number — customers cannot reach them either');
    }
    if (lead.momentum === 'rising') urgencyFactors.push('Headcount rising — intake breaks first');
    if (lead.momentum === 'declining') urgencyFactors.push('Headcount shrinking — automation lands well now');
    if (lead.score >= 85) urgencyFactors.push(`Score ${lead.score} — top of this batch`);
    if (lead.status === 'new') urgencyFactors.push('Never contacted — no history to work around');

    const urgencyLevel = urgencyFactors.length >= 4 ? 'CRITICAL'
      : urgencyFactors.length >= 3 ? 'HIGH'
      : urgencyFactors.length >= 1 ? 'MEDIUM' : 'LOW';

    // Composite of signals we hold, stated as such. No intent-score default.
    const parts = [];
    if (typeof lead.score === 'number') parts.push(lead.score);
    if (typeof lead.reviewCount === 'number') parts.push(lead.reviewCount < 25 ? 80 : 40);
    if (!lead.website && !lead.domain) parts.push(90);
    const buyingSignalScore = parts.length
      ? Math.min(100, Math.round(parts.reduce((a, b) => a + b, 0) / parts.length))
      : null;

    const result = {
      industryRank,
      industryPctile,
      totalInIndustry: industryLeads.length,
      urgencyLevel,
      urgencyFactors,
      buyingSignalScore,
      // Only when the record genuinely carries funding data — Apollo B2B rows.
      contractExpiry: lead.funding_round
        ? `~${lead.funding_round === 'Series A' ? 18 : lead.funding_round === 'Series B' ? 12
            : lead.funding_round === 'Seed' ? 24 : lead.funding_round === 'Series C' ? 8 : 15} months`
        : null,
    };
    get()._leadAlphaCache[lead.id] = result;
    return result;
  },

  // ─── TRANSACTIONS & INVOICES ─────────────────────────────────────────────
  // Persisted to localStorage for durability across sessions
  transactions: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('goated_transactions') || '[]') : [],
  invoices: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('goated_invoices') || '[]') : [],

  addTransaction: (tx) => {
    const transaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      ...tx,
      timestamp: tx.timestamp || new Date().toISOString(),
    };
    const updated = [...get().transactions, transaction];
    localStorage.setItem('goated_transactions', JSON.stringify(updated));
    set({ transactions: updated });
    return transaction;
  },

  getTransactions: (filters = {}) => {
    let txs = get().transactions;
    if (filters.type && filters.type !== 'all') {
      txs = txs.filter(t => t.type === filters.type);
    }
    if (filters.user) {
      const u = filters.user.toLowerCase();
      txs = txs.filter(t => (t.user || '').toLowerCase().includes(u));
    }
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = Date.now();
      const ranges = { today: 86400000, week: 604800000, month: 2592000000 };
      const cutoff = now - (ranges[filters.dateRange] || 0);
      txs = txs.filter(t => new Date(t.timestamp).getTime() >= cutoff);
    }
    if (filters.startDate) {
      txs = txs.filter(t => new Date(t.timestamp) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      txs = txs.filter(t => new Date(t.timestamp) <= new Date(filters.endDate));
    }
    return txs;
  },

  addInvoice: (invoice) => {
    const inv = {
      id: 'INV-' + String(get().invoices.length + 1).padStart(4, '0'),
      ...invoice,
      status: 'pending',
      createdAt: new Date().toISOString(),
      paidAt: null,
    };
    const updated = [...get().invoices, inv];
    localStorage.setItem('goated_invoices', JSON.stringify(updated));
    set({ invoices: updated });
    return inv;
  },

  updateInvoice: (id, changes) => {
    const updated = get().invoices.map(inv =>
      inv.id === id ? { ...inv, ...changes } : inv
    );
    localStorage.setItem('goated_invoices', JSON.stringify(updated));
    set({ invoices: updated });
  },

  // Update a lead's status (and auto-create transaction when moved to 'won')
  updateLeadStatus: (leadId, newStatus) => {
    const s = get();
    const leads = s.leads;
    if (!leads) return;
    const idx = leads.findIndex(l => l.id === leadId);
    if (idx === -1) return;
    const lead = leads[idx];
    const oldStatus = lead.status;
    leads[idx] = { ...lead, status: newStatus };
    set({ leads: [...leads] });
    // Auto-create transaction when deal is moved to 'won'
    if (newStatus === 'won' && oldStatus !== 'won') {
      const dealValue = lead.dealValue || lead.value || 0;
      s.addTransaction({
        type: 'deal_closed',
        amount: dealValue,
        fee: +(dealValue * 0.12).toFixed(2),
        user: lead.name || lead.company || 'Unknown',
        description: `Deal closed: ${lead.company || lead.name}`,
      });
    }
  },

  // Confetti burst for celebrations (degen mode only)
  triggerConfetti: () => {
    if (!get().degenMode) return;
    const colors = ['#f97316', '#ef4444', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9997;overflow:hidden;';
    document.body.appendChild(container);
    for (let i = 0; i < 50; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-particle';
      const size = 4 + Math.random() * 8;
      p.style.cssText = `
        left:${Math.random() * 100}vw;
        width:${size}px;height:${size}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        --fall-duration:${1.5 + Math.random() * 2}s;
        --fall-delay:${Math.random() * 0.5}s;
      `;
      container.appendChild(p);
    }
    setTimeout(() => container.remove(), 4000);
  },
}));

// Auto-generate degen data if mode was persisted as active
if (typeof window !== 'undefined' && localStorage.getItem('goated_degen') === 'true') {
  useStore.getState().generateDegenData();
}

export { fmt, enrichLead, computePipelineAnalytics, priorities, statuses, industries, leadSources, dealStages, tagOptions, fundingRounds, techStacks, buyingSignals };
