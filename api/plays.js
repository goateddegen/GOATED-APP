// =============================================================================
// GOATED Solutions - Live Plays & Playbook API
// =============================================================================
// Endpoint: GET /api/plays
//
// Query Parameters:
//   - limit:     number of plays to return (default: all, max: 50)
//   - category:  filter by category name (case-insensitive partial match)
//   - sort:      "popularity" | "successRate" | "leadsGenerated" | "avgROI"
//                | "difficulty" | "name" (default: "popularity")
//
// Returns:
//   {
//     plays:        [...],            // Playbook catalog
//     liveActivity: [...],            // 20 recent user actions
//     stats:        { totalPlaysRun, avgSuccessRate, activeUsers },
//     total:        <number>,
//     lastUpdated:  "ISO timestamp"
//   }
//
// No API keys required. Data is deterministic per server instance with
// light randomisation on liveActivity timestamps to simulate real-time feed.
// =============================================================================

import { callClaude } from './lib/anthropic.js';

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
// Categories
// ---------------------------------------------------------------------------
const CATEGORIES = [
  'Cold Outreach',
  'Inbound Funnels',
  'Closing Plays',
  'Retention & Upsell',
  'Automation',
];

// ---------------------------------------------------------------------------
// Full Play Catalog (32 plays)
// ---------------------------------------------------------------------------
const PLAYS = [
  // ---- Cold Outreach (7) ----
  {
    id: 'play_001',
    name: 'LinkedIn DM Blitz',
    category: 'Cold Outreach',
    description: 'Hyper-personalised LinkedIn DM sequences targeting decision-makers. Uses AI to research each prospect and craft messages that feel hand-written.',
    steps: [
      'Import ICP list from CRM',
      'AI researches each prospect (role, posts, mutual connections)',
      'Generate personalised DM + follow-up sequence',
      'Schedule sends with human-like timing',
      'Auto-tag positive replies and route to rep',
    ],
    difficulty: 'Intermediate',
    successRate: 68,
    leadsGenerated: 4820,
    avgROI: 5.2,
    timeToResults: '3-5 days',
    popularity: 97,
  },
  {
    id: 'play_002',
    name: 'Cold Email Blitz',
    category: 'Cold Outreach',
    description: 'Multi-step cold email sequences with AI-generated subject lines, dynamic personalisation tokens, and smart send-time optimisation.',
    steps: [
      'Upload or sync prospect list',
      'AI writes personalised email copy per segment',
      'A/B test subject lines automatically',
      'Schedule 4-step drip with smart timing',
      'Auto-pause on positive reply, escalate to rep',
    ],
    difficulty: 'Beginner',
    successRate: 42,
    leadsGenerated: 12400,
    avgROI: 7.8,
    timeToResults: '5-7 days',
    popularity: 95,
  },
  {
    id: 'play_003',
    name: 'Intent Data Sweep',
    category: 'Cold Outreach',
    description: 'Scan third-party intent signals (G2, TrustRadius, Bombora) to find accounts actively researching your category, then auto-enrol them in outreach.',
    steps: [
      'Connect intent data provider (G2, Bombora, etc.)',
      'Define topic clusters and ICP filters',
      'AI scores and ranks surging accounts',
      'Auto-enrich contacts at target accounts',
      'Trigger personalised outreach sequence',
    ],
    difficulty: 'Advanced',
    successRate: 54,
    leadsGenerated: 3200,
    avgROI: 6.1,
    timeToResults: '1-2 weeks',
    popularity: 82,
  },
  {
    id: 'play_004',
    name: 'Competitor Win-Back',
    category: 'Cold Outreach',
    description: 'Target prospects who recently signed with a competitor. Use pain-point messaging and switching incentives to re-open the conversation.',
    steps: [
      'Monitor competitor review sites & social mentions',
      'Identify churned or unhappy competitor users',
      'AI crafts empathy-first outreach (no bashing)',
      'Offer migration incentive or free audit',
      'Route warm replies to senior AE',
    ],
    difficulty: 'Advanced',
    successRate: 31,
    leadsGenerated: 1840,
    avgROI: 4.4,
    timeToResults: '2-4 weeks',
    popularity: 71,
  },
  {
    id: 'play_005',
    name: 'Conference Blitz',
    category: 'Cold Outreach',
    description: 'Pre-event, during-event, and post-event outreach plays for trade shows and conferences. Maximise ROI on every event dollar.',
    steps: [
      'Scrape attendee list from event site / app',
      'AI pre-qualifies attendees against ICP',
      'Send pre-event "let\'s meet" messages',
      'Real-time badge-scan follow-up during event',
      'Post-event nurture drip within 24 hours',
    ],
    difficulty: 'Intermediate',
    successRate: 59,
    leadsGenerated: 2100,
    avgROI: 3.9,
    timeToResults: '1-3 weeks',
    popularity: 74,
  },
  {
    id: 'play_006',
    name: 'AI Cold Caller',
    category: 'Cold Outreach',
    description: 'AI-assisted cold calling with real-time script guidance, objection handling prompts, and automatic CRM logging.',
    steps: [
      'Prioritise call list by lead score',
      'AI generates personalised opener per prospect',
      'Real-time talk-track and objection coach on screen',
      'Auto-log call notes and next steps in CRM',
      'Schedule follow-up tasks automatically',
    ],
    difficulty: 'Intermediate',
    successRate: 38,
    leadsGenerated: 5600,
    avgROI: 4.7,
    timeToResults: '1-3 days',
    popularity: 88,
  },
  {
    id: 'play_007',
    name: 'Multi-Channel Surround',
    category: 'Cold Outreach',
    description: 'Coordinate email, LinkedIn, phone, and direct mail touches into one seamless cadence so prospects see you everywhere.',
    steps: [
      'Define target account list',
      'Map contacts to preferred channels',
      'AI sequences: email day 1, LinkedIn day 2, call day 4, mail day 7',
      'Smart de-dupe across channels',
      'Unified response tracking dashboard',
    ],
    difficulty: 'Advanced',
    successRate: 52,
    leadsGenerated: 3900,
    avgROI: 5.8,
    timeToResults: '1-2 weeks',
    popularity: 79,
  },

  // ---- Inbound Funnels (7) ----
  {
    id: 'play_008',
    name: 'Content Flywheel',
    category: 'Inbound Funnels',
    description: 'Turn one piece of pillar content into 20+ distribution assets. Blog to LinkedIn carousel to Twitter thread to email newsletter, all AI-generated.',
    steps: [
      'Write or paste pillar content (blog, report, etc.)',
      'AI extracts 5-8 key insights',
      'Generate LinkedIn posts, Twitter threads, email blurbs',
      'Create visual assets (carousels, infographics)',
      'Schedule across channels with UTM tracking',
    ],
    difficulty: 'Beginner',
    successRate: 73,
    leadsGenerated: 8900,
    avgROI: 9.2,
    timeToResults: '1-2 weeks',
    popularity: 91,
  },
  {
    id: 'play_009',
    name: 'Webinar Funnel',
    category: 'Inbound Funnels',
    description: 'End-to-end webinar funnel: registration page, email nurture, live event, replay sequence, and hand-off to sales.',
    steps: [
      'Create registration landing page (AI-written copy)',
      'Build 3-email reminder sequence',
      'Host live webinar with Q&A capture',
      'Auto-send replay + bonus resource',
      'Score attendees and route hot leads to AEs',
    ],
    difficulty: 'Intermediate',
    successRate: 61,
    leadsGenerated: 6700,
    avgROI: 6.5,
    timeToResults: '2-4 weeks',
    popularity: 85,
  },
  {
    id: 'play_010',
    name: 'Lead Magnet Machine',
    category: 'Inbound Funnels',
    description: 'Create high-converting lead magnets (calculators, templates, checklists) with gated landing pages and instant email follow-up.',
    steps: [
      'Choose lead magnet type (template, calculator, report)',
      'AI generates content + landing page copy',
      'Set up form with progressive profiling',
      'Deliver asset + start nurture sequence',
      'Score engagement and alert sales on MQLs',
    ],
    difficulty: 'Beginner',
    successRate: 56,
    leadsGenerated: 11200,
    avgROI: 8.1,
    timeToResults: '1-2 weeks',
    popularity: 89,
  },
  {
    id: 'play_011',
    name: 'SEO Content Engine',
    category: 'Inbound Funnels',
    description: 'AI identifies high-intent keywords, generates optimised articles, and builds internal link clusters to dominate search rankings.',
    steps: [
      'AI analyses competitor keywords and gaps',
      'Generate content briefs for top 20 opportunities',
      'Write SEO-optimised articles with AI assistance',
      'Build internal linking structure',
      'Monitor rankings and iterate monthly',
    ],
    difficulty: 'Intermediate',
    successRate: 47,
    leadsGenerated: 15800,
    avgROI: 11.3,
    timeToResults: '2-3 months',
    popularity: 78,
  },
  {
    id: 'play_012',
    name: 'Chatbot Qualifier',
    category: 'Inbound Funnels',
    description: 'AI chatbot on your website that qualifies visitors in real-time, books meetings, and routes hot leads to the right rep instantly.',
    steps: [
      'Install chat widget on high-traffic pages',
      'Configure qualification questions (budget, timeline, authority)',
      'AI routes qualified visitors to live rep or calendar',
      'Capture unqualified leads into nurture sequence',
      'Weekly report on chat conversion metrics',
    ],
    difficulty: 'Beginner',
    successRate: 64,
    leadsGenerated: 7400,
    avgROI: 7.6,
    timeToResults: '3-5 days',
    popularity: 93,
  },
  {
    id: 'play_013',
    name: 'Referral Engine',
    category: 'Inbound Funnels',
    description: 'Automated referral programme: identify happy customers, trigger ask, provide sharing tools, and reward both parties.',
    steps: [
      'Identify promoters via NPS or usage data',
      'AI triggers personalised referral ask',
      'Generate unique referral links with tracking',
      'Automate reward fulfilment for both parties',
      'Report on referral pipeline and attribution',
    ],
    difficulty: 'Intermediate',
    successRate: 71,
    leadsGenerated: 3400,
    avgROI: 12.4,
    timeToResults: '2-4 weeks',
    popularity: 76,
  },
  {
    id: 'play_014',
    name: 'Social Proof Amplifier',
    category: 'Inbound Funnels',
    description: 'Automatically collect, format, and distribute customer testimonials and case studies across all your marketing channels.',
    steps: [
      'Auto-detect positive customer interactions',
      'AI drafts testimonial request email',
      'Format responses into social proof assets',
      'Distribute to website, ads, email signatures',
      'Track conversion lift from social proof',
    ],
    difficulty: 'Beginner',
    successRate: 67,
    leadsGenerated: 4100,
    avgROI: 5.9,
    timeToResults: '1-3 weeks',
    popularity: 72,
  },

  // ---- Closing Plays (6) ----
  {
    id: 'play_015',
    name: 'Proposal Accelerator',
    category: 'Closing Plays',
    description: 'AI generates custom proposals in minutes using deal context, buyer persona, and competitive positioning. Includes e-signature flow.',
    steps: [
      'Pull deal data from CRM automatically',
      'AI generates tailored proposal with ROI projections',
      'Add dynamic pricing and package options',
      'Send with built-in e-signature',
      'Track opens, time-on-page, and forwarding',
    ],
    difficulty: 'Intermediate',
    successRate: 74,
    leadsGenerated: 2800,
    avgROI: 8.7,
    timeToResults: '1-2 days',
    popularity: 90,
  },
  {
    id: 'play_016',
    name: 'Multi-Thread Deal Mapper',
    category: 'Closing Plays',
    description: 'Map every stakeholder in the buying committee, identify champions and blockers, and create engagement plans for each thread.',
    steps: [
      'AI maps org chart from LinkedIn + CRM data',
      'Identify decision-makers, influencers, blockers',
      'Generate personalised messaging per stakeholder',
      'Track engagement across all threads',
      'Alert when champion goes silent or blocker engages',
    ],
    difficulty: 'Advanced',
    successRate: 58,
    leadsGenerated: 1600,
    avgROI: 6.3,
    timeToResults: '1-2 weeks',
    popularity: 83,
  },
  {
    id: 'play_017',
    name: 'Objection Destroyer',
    category: 'Closing Plays',
    description: 'Real-time AI coaching during sales calls. Detects objections and surfaces battle-tested responses, competitor comparisons, and proof points.',
    steps: [
      'Connect to call recording tool (Gong, Chorus, etc.)',
      'AI detects objection patterns in real-time',
      'Surface recommended response + supporting data',
      'Log objection trends across team',
      'Auto-update playbook with new winning responses',
    ],
    difficulty: 'Advanced',
    successRate: 62,
    leadsGenerated: 2200,
    avgROI: 5.4,
    timeToResults: '1-3 days',
    popularity: 86,
  },
  {
    id: 'play_018',
    name: 'Mutual Action Plan',
    category: 'Closing Plays',
    description: 'Co-create a shared close plan with the buyer. AI suggests milestones, owners, and deadlines based on deal stage and buyer signals.',
    steps: [
      'AI generates MAP template based on deal context',
      'Share editable plan with buyer via portal',
      'Track milestone completion in real-time',
      'Auto-nudge on overdue items',
      'Forecast close date based on MAP velocity',
    ],
    difficulty: 'Intermediate',
    successRate: 69,
    leadsGenerated: 1900,
    avgROI: 7.1,
    timeToResults: '1-2 weeks',
    popularity: 81,
  },
  {
    id: 'play_019',
    name: 'Executive Sponsor Play',
    category: 'Closing Plays',
    description: 'Engage C-suite sponsors with board-ready ROI decks, executive briefings, and peer-to-peer introductions.',
    steps: [
      'Identify exec sponsor via org mapping',
      'AI generates exec-level value narrative',
      'Create board-ready ROI presentation',
      'Arrange peer exec introduction',
      'Track exec engagement and buying signals',
    ],
    difficulty: 'Advanced',
    successRate: 45,
    leadsGenerated: 1200,
    avgROI: 9.8,
    timeToResults: '2-4 weeks',
    popularity: 70,
  },
  {
    id: 'play_020',
    name: 'Discount & Urgency Close',
    category: 'Closing Plays',
    description: 'Time-limited offers and strategic discounting to accelerate stalled deals. AI recommends optimal discount level based on deal value and stage.',
    steps: [
      'Identify stalled deals past expected close date',
      'AI calculates optimal discount (margin-safe)',
      'Generate personalised offer with deadline',
      'Track urgency response metrics',
      'Escalate non-responsive deals to manager',
    ],
    difficulty: 'Beginner',
    successRate: 53,
    leadsGenerated: 3100,
    avgROI: 3.2,
    timeToResults: '3-7 days',
    popularity: 77,
  },

  // ---- Retention & Upsell (6) ----
  {
    id: 'play_021',
    name: 'Churn Predictor',
    category: 'Retention & Upsell',
    description: 'AI monitors usage patterns, support tickets, and engagement signals to predict churn 30-60 days before it happens.',
    steps: [
      'Connect product usage and support data',
      'AI builds risk model per account',
      'Daily churn risk score update',
      'Auto-trigger save plays for at-risk accounts',
      'Escalate high-value accounts to CS manager',
    ],
    difficulty: 'Advanced',
    successRate: 72,
    leadsGenerated: 2400,
    avgROI: 14.6,
    timeToResults: '2-4 weeks',
    popularity: 87,
  },
  {
    id: 'play_022',
    name: 'Upsell Identifier',
    category: 'Retention & Upsell',
    description: 'Spot expansion opportunities by analysing feature usage, team growth, and contract timing. AI recommends the right offer at the right time.',
    steps: [
      'Analyse product usage and feature adoption',
      'Detect expansion signals (new users, hitting limits)',
      'AI recommends upsell package and timing',
      'Generate personalised upsell pitch',
      'Track expansion revenue and conversion rate',
    ],
    difficulty: 'Intermediate',
    successRate: 63,
    leadsGenerated: 3800,
    avgROI: 11.2,
    timeToResults: '1-2 weeks',
    popularity: 84,
  },
  {
    id: 'play_023',
    name: 'QBR Autopilot',
    category: 'Retention & Upsell',
    description: 'Auto-generate quarterly business review decks with usage stats, ROI metrics, and recommended next steps. One click to schedule with the customer.',
    steps: [
      'Pull usage metrics, support data, and ROI figures',
      'AI generates QBR slide deck automatically',
      'Include benchmarks vs industry peers',
      'Suggest expansion opportunities',
      'One-click schedule and send to stakeholders',
    ],
    difficulty: 'Intermediate',
    successRate: 78,
    leadsGenerated: 1500,
    avgROI: 8.3,
    timeToResults: '1-3 days',
    popularity: 75,
  },
  {
    id: 'play_024',
    name: 'Customer Advocacy Loop',
    category: 'Retention & Upsell',
    description: 'Turn happy customers into active advocates: case studies, reviews, references, and speaking opportunities.',
    steps: [
      'Identify top NPS respondents and power users',
      'AI drafts personalised advocacy ask',
      'Offer incentives (feature access, swag, co-marketing)',
      'Manage case study pipeline automatically',
      'Track advocacy impact on pipeline',
    ],
    difficulty: 'Beginner',
    successRate: 66,
    leadsGenerated: 2100,
    avgROI: 7.5,
    timeToResults: '2-4 weeks',
    popularity: 69,
  },
  {
    id: 'play_025',
    name: 'Renewal Autopilot',
    category: 'Retention & Upsell',
    description: 'Automated renewal workflow starting 90 days before contract end. Health checks, value recaps, and seamless re-sign flow.',
    steps: [
      'Trigger 90-day renewal countdown',
      'AI generates value recap with ROI data',
      'Health check: usage, satisfaction, open tickets',
      'Auto-send renewal proposal with e-sign',
      'Escalate at-risk renewals to CS manager',
    ],
    difficulty: 'Intermediate',
    successRate: 81,
    leadsGenerated: 4200,
    avgROI: 16.8,
    timeToResults: '1-2 weeks',
    popularity: 92,
  },
  {
    id: 'play_026',
    name: 'Win-Back Campaign',
    category: 'Retention & Upsell',
    description: 'Re-engage churned customers with personalised offers based on their original use case and why they left.',
    steps: [
      'Analyse churn reason from exit surveys + CRM',
      'Wait 30-60 days post-churn',
      'AI crafts empathy-first re-engagement message',
      'Offer comeback incentive (discount, free month, etc.)',
      'Track win-back conversion and lifetime value',
    ],
    difficulty: 'Intermediate',
    successRate: 28,
    leadsGenerated: 1100,
    avgROI: 4.9,
    timeToResults: '1-3 months',
    popularity: 64,
  },

  // ---- Automation (6) ----
  {
    id: 'play_027',
    name: 'CRM Hygiene Bot',
    category: 'Automation',
    description: 'AI continuously cleans and enriches CRM data. Deduplicates contacts, fills missing fields, updates job titles, and validates emails.',
    steps: [
      'Connect CRM and grant read/write access',
      'AI scans for duplicates, blanks, and stale records',
      'Auto-merge duplicates with conflict resolution',
      'Enrich missing fields (title, phone, LinkedIn)',
      'Weekly hygiene report to sales ops',
    ],
    difficulty: 'Beginner',
    successRate: 89,
    leadsGenerated: 6200,
    avgROI: 5.1,
    timeToResults: '1-3 days',
    popularity: 94,
  },
  {
    id: 'play_028',
    name: 'Pipeline Forecaster',
    category: 'Automation',
    description: 'AI analyses deal signals, rep behaviour, and historical patterns to generate accurate pipeline forecasts updated in real-time.',
    steps: [
      'Ingest CRM pipeline and activity data',
      'AI builds predictive model per deal',
      'Generate weekly forecast with confidence intervals',
      'Highlight deals at risk of slipping',
      'Compare AI forecast vs rep forecast',
    ],
    difficulty: 'Advanced',
    successRate: 76,
    leadsGenerated: 1800,
    avgROI: 6.7,
    timeToResults: '1-2 weeks',
    popularity: 80,
  },
  {
    id: 'play_029',
    name: 'Meeting No-Show Recovery',
    category: 'Automation',
    description: 'Automatically detect no-shows, send empathetic follow-up, and reschedule in one click. Recover up to 40% of missed meetings.',
    steps: [
      'Detect no-show from calendar + video platform',
      'Wait 5 minutes, then send friendly reschedule link',
      'If no response in 24h, trigger backup sequence',
      'Log no-show pattern in CRM for rep visibility',
      'Monthly report on no-show trends and recovery rate',
    ],
    difficulty: 'Beginner',
    successRate: 41,
    leadsGenerated: 3500,
    avgROI: 8.9,
    timeToResults: '1-2 days',
    popularity: 88,
  },
  {
    id: 'play_030',
    name: 'Smart Task Router',
    category: 'Automation',
    description: 'AI assigns leads, tasks, and follow-ups to the best-fit rep based on expertise, capacity, timezone, and past win rate.',
    steps: [
      'Define routing rules (geography, vertical, deal size)',
      'AI learns rep strengths from historical data',
      'Auto-assign new leads within 60 seconds',
      'Balance workload across team',
      'Track routing effectiveness and iterate',
    ],
    difficulty: 'Intermediate',
    successRate: 83,
    leadsGenerated: 8100,
    avgROI: 4.3,
    timeToResults: '3-5 days',
    popularity: 86,
  },
  {
    id: 'play_031',
    name: 'Email Warmup Engine',
    category: 'Automation',
    description: 'Gradually warm up new email domains and inboxes to ensure maximum deliverability before launching cold outreach campaigns.',
    steps: [
      'Register and authenticate new sending domains',
      'AI initiates warm-up conversations with seed network',
      'Gradually increase daily send volume over 2-4 weeks',
      'Monitor reputation scores and blacklist status',
      'Green-light domain for outreach when ready',
    ],
    difficulty: 'Beginner',
    successRate: 91,
    leadsGenerated: 0,
    avgROI: 3.8,
    timeToResults: '2-4 weeks',
    popularity: 73,
  },
  {
    id: 'play_032',
    name: 'Revenue Dashboard Builder',
    category: 'Automation',
    description: 'Auto-generate real-time revenue dashboards pulling data from CRM, billing, and product usage. Custom views for reps, managers, and execs.',
    steps: [
      'Connect CRM, billing, and product data sources',
      'AI selects optimal metrics per persona (rep, manager, exec)',
      'Build interactive dashboard with drill-downs',
      'Set up automated alerts for anomalies',
      'Weekly email digest to stakeholders',
    ],
    difficulty: 'Intermediate',
    successRate: 85,
    leadsGenerated: 0,
    avgROI: 4.6,
    timeToResults: '3-5 days',
    popularity: 77,
  },
];

// ---------------------------------------------------------------------------
// Live Activity Feed Data
// ---------------------------------------------------------------------------
const ACTIVITY_USERS = [
  'Sarah M.', 'Alex K.', 'Jordan P.', 'Mike T.', 'Emily R.',
  'Chris D.', 'Taylor W.', 'Rachel L.', 'James C.', 'Nicole H.',
  'Ryan S.', 'Amanda B.', 'Kevin G.', 'Megan F.', 'Brandon V.',
  'Sophia N.', 'Liam O.', 'Priya S.', 'Carlos R.', 'Wei Z.',
  'Daniel J.', 'Olivia W.', 'Nathan B.', 'Isabella G.', 'Lucas T.',
];

const ACTIVITY_ACTIONS = [
  'closed deal',
  'booked meeting',
  'qualified lead',
  'sent proposal',
  'started sequence',
  'recovered no-show',
  'upsold account',
  'generated lead',
  'completed play',
  'won renewal',
  'launched campaign',
  'enriched contacts',
  'mapped org chart',
  'sent follow-up',
  'booked demo',
];

const RESULT_TEMPLATES = [
  '$24K deal', '$18K deal', '$42K deal', '$9.5K deal', '$67K deal',
  '$31K deal', '$55K deal', '$12K deal', '$88K deal', '$15K deal',
  '3 meetings', '5 meetings', '2 meetings', '7 meetings',
  '12 leads', '8 leads', '23 leads', '5 leads', '15 leads',
  '94% open rate', '67% reply rate', '45% conversion',
  '3x ROI', '5x ROI', '8x ROI',
  'saved 12 hrs', 'saved 8 hrs', 'saved 20 hrs',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateLiveActivity(count) {
  const activities = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const minutesAgo = Math.floor(Math.random() * 180); // last 3 hours
    const secondsAgo = Math.floor(Math.random() * 60);
    const ts = new Date(now - (minutesAgo * 60000 + secondsAgo * 1000));

    activities.push({
      id: `act_${now}_${i}`,
      user: pick(ACTIVITY_USERS),
      action: pick(ACTIVITY_ACTIONS),
      play: pick(PLAYS).name,
      result: pick(RESULT_TEMPLATES),
      timestamp: ts.toISOString(),
      minutesAgo,
    });
  }

  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return activities;
}

function computeStats() {
  const totalPlaysRun = 24837 + Math.floor(Math.random() * 500);
  const avgSuccessRate = parseFloat(
    (PLAYS.reduce((sum, p) => sum + p.successRate, 0) / PLAYS.length).toFixed(1)
  );
  const activeUsers = 187 + Math.floor(Math.random() * 40);

  return {
    totalPlaysRun,
    avgSuccessRate,
    activeUsers,
    totalPlays: PLAYS.length,
    categoryCounts: CATEGORIES.reduce((acc, cat) => {
      acc[cat] = PLAYS.filter((p) => p.category === cat).length;
      return acc;
    }, {}),
    topPlay: [...PLAYS].sort((a, b) => b.popularity - a.popularity)[0].name,
    highestROI: [...PLAYS].sort((a, b) => b.avgROI - a.avgROI)[0].name,
    totalLeadsGenerated: PLAYS.reduce((s, p) => s + p.leadsGenerated, 0),
  };
}

// ---------------------------------------------------------------------------
// Claude AI Play Enrichment
// ---------------------------------------------------------------------------
async function enrichPlaysWithClaude(plays) {
  if (!plays || plays.length === 0) return null;
  const summary = plays.slice(0, 10).map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    successRate: p.successRate,
    avgROI: p.avgROI,
    difficulty: p.difficulty,
    leadsGenerated: p.leadsGenerated,
    timeToResults: p.timeToResults,
  }));

  const text = await callClaude(
    'You are GOATED\'s sales strategy AI. Respond ONLY with valid JSON, no markdown fences.',
    `Score and rank these B2B sales plays. Return JSON array:
[{ "id": "play_id", "conviction": 1-100, "thesis": "1-sentence why this play wins", "riskAdjustedRank": 1-N }]

Rank by risk-adjusted return (ROI * successRate / difficulty-weight where Beginner=1, Intermediate=2, Advanced=3).
Be specific and actionable in each thesis.

Plays:\n${JSON.stringify(summary)}`,
    800
  );
  if (!text) return null;
  try {
    const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  const corsHeaders = getCorsHeaders(req);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    const {
      limit: rawLimit,
      category: rawCategory,
      sort: rawSort = 'popularity',
    } = req.query;

    // --- Filter by category ---
    let filtered = [...PLAYS];
    if (rawCategory) {
      const catLower = rawCategory.toLowerCase();
      filtered = filtered.filter(
        (p) => p.category.toLowerCase().includes(catLower)
      );
    }

    // --- Sort ---
    const sortField = rawSort.toLowerCase();
    const SORT_MAP = {
      popularity: (a, b) => b.popularity - a.popularity,
      successrate: (a, b) => b.successRate - a.successRate,
      leadsgenerated: (a, b) => b.leadsGenerated - a.leadsGenerated,
      avgroi: (a, b) => b.avgROI - a.avgROI,
      difficulty: (a, b) => {
        const order = { Beginner: 1, Intermediate: 2, Advanced: 3 };
        return (order[a.difficulty] || 2) - (order[b.difficulty] || 2);
      },
      name: (a, b) => a.name.localeCompare(b.name),
    };
    const sortFn = SORT_MAP[sortField] || SORT_MAP.popularity;
    filtered.sort(sortFn);

    // --- Limit ---
    const total = filtered.length;
    if (rawLimit) {
      const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 50, 1), 50);
      filtered = filtered.slice(0, limit);
    }

    // --- Build response ---
    const liveActivity = generateLiveActivity(20);
    const stats = computeStats();

    // AI enrichment — score conviction, add thesis, rank by risk-adjusted return
    let aiEnrichment = null;
    try {
      const enrichmentData = await enrichPlaysWithClaude(filtered);
      if (enrichmentData && Array.isArray(enrichmentData)) {
        // Merge AI enrichment into plays
        const enrichMap = new Map(enrichmentData.map(e => [e.id, e]));
        filtered = filtered.map(p => {
          const ai = enrichMap.get(p.id);
          if (ai) {
            return {
              ...p,
              aiConviction: ai.conviction,
              aiThesis: ai.thesis,
              aiRiskAdjustedRank: ai.riskAdjustedRank,
            };
          }
          return p;
        });
        aiEnrichment = { enriched: true, playsScored: enrichmentData.length };
      }
    } catch (e) {
      console.warn('Claude plays enrichment failed:', e.message);
    }

    return res.status(200).json({
      plays: filtered,
      liveActivity,
      stats,
      total,
      aiEnrichment,
      lastUpdated: new Date().toISOString(),
      _meta: {
        dataType: 'live-generated',
        refreshInterval: '30s',
        categories: CATEGORIES,
        sortOptions: Object.keys(SORT_MAP),
        note: 'liveActivity is randomised on each call to simulate real-time feed. Play catalog is deterministic.',
      },
    });
  } catch (error) {
    console.error('Plays API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      plays: [],
      liveActivity: [],
      stats: {},
      total: 0,
      lastUpdated: new Date().toISOString(),
    });
  }
}
