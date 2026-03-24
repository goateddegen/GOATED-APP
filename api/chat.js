// =============================================================================
// GOATED AI Chat — Enhanced LLM Integration with Security Hardening
// =============================================================================

// ─── Security: Input Sanitization ───────────────────────────────────────────
function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  // Strip HTML/script tags
  let clean = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<[^>]*>/g, '');
  // Strip potential JS event handlers
  clean = clean.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  // Limit length
  return clean.slice(0, 2000);
}

function sanitizeOutput(text) {
  if (typeof text !== 'string') return '';
  // Remove any script tags or event handlers that might have leaked through
  let clean = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/javascript:/gi, '');
  clean = clean.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  return clean;
}

// ─── Security: Request ID Tracking ──────────────────────────────────────────
function generateRequestId() {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Security: CORS Whitelist ───────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://goated-app-nine.vercel.app',
  'https://www.goated.solutions',
  'http://localhost:5173',
  'http://localhost:5174',
];

function getCorsOrigin(req) {
  const origin = req.headers?.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  return ALLOWED_ORIGINS[0];
}

// ─── Security: Sliding Window Rate Limiter ──────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute per IP

function checkRateLimit(ip) {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitMap.set(ip, entry);
  }
  // Sliding window: remove timestamps older than the window
  entry.timestamps = entry.timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
  if (entry.timestamps.length >= RATE_LIMIT_MAX) return false;
  entry.timestamps.push(now);
  return true;
}

// Clean stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    entry.timestamps = entry.timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    if (entry.timestamps.length === 0) rateLimitMap.delete(ip);
  }
}, 300_000);

// ─── Security Headers ───────────────────────────────────────────────────────
function setSecurityHeaders(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-XSS-Protection', '1; mode=block');
}

// ─── Lead Search Utilities ──────────────────────────────────────────────────
const KNOWN_LOCATIONS = [
  'San Francisco', 'New York', 'Austin', 'Seattle', 'Boston', 'Chicago', 'Denver', 'Miami', 'LA', 'London',
  'Toronto', 'Berlin', 'Paris', 'Amsterdam', 'Dublin', 'Singapore', 'Sydney', 'Tokyo', 'Hong Kong', 'Tel Aviv',
  'Portland', 'Nashville', 'Atlanta', 'Dallas', 'Phoenix', 'San Diego', 'Philadelphia', 'Minneapolis', 'Detroit', 'Charlotte',
  'Raleigh', 'Salt Lake City', 'Pittsburgh', 'Columbus', 'Indianapolis', 'Tampa', 'Orlando', 'Las Vegas', 'Kansas City', 'St Louis',
  'Vancouver', 'Montreal', 'Melbourne', 'Auckland', 'Stockholm', 'Copenhagen', 'Oslo', 'Helsinki', 'Zurich', 'Munich',
  'Barcelona', 'Lisbon', 'Warsaw', 'Prague', 'Vienna', 'Milan', 'Rome', 'Bangkok', 'Seoul', 'Taipei',
  'Dubai', 'Riyadh', 'Cape Town', 'Lagos', 'Nairobi', 'Cairo', 'Mumbai', 'Bangalore', 'Delhi', 'Jakarta',
];

const LOCATION_ALIASES = {
  'sf': 'San Francisco', 'san fran': 'San Francisco', 'bay area': 'San Francisco',
  'nyc': 'New York', 'new york city': 'New York', 'manhattan': 'New York',
  'los angeles': 'LA', 'la': 'LA',
  'stl': 'St Louis', 'saint louis': 'St Louis',
  'lv': 'Las Vegas', 'vegas': 'Las Vegas',
  'kc': 'Kansas City',
  'slc': 'Salt Lake City',
  'philly': 'Philadelphia',
  'atl': 'Atlanta',
  'bengaluru': 'Bangalore',
  'bombay': 'Mumbai',
  'hk': 'Hong Kong',
};

// Cities people might ask about that are NOT in the dataset
const UNLISTED_CITIES = [
  'houston', 'san antonio', 'sacramento', 'san jose', 'washington', 'dc',
  'new orleans', 'nola', 'baltimore', 'memphis', 'louisville', 'milwaukee',
  'oklahoma city', 'tucson', 'fresno', 'mesa', 'omaha', 'albuquerque',
  'colorado springs', 'virginia beach', 'jacksonville', 'richmond',
  'hartford', 'buffalo', 'rochester', 'honolulu', 'anchorage',
];

const KNOWN_INDUSTRIES = [
  'SaaS', 'DevTools', 'AI/ML', 'Fintech', 'Healthcare', 'MedTech', 'BioTech',
  'E-commerce', 'Retail', 'EdTech', 'Cybersecurity', 'MarTech', 'AdTech',
  'PropTech', 'InsurTech', 'LegalTech', 'CleanTech', 'FoodTech', 'HRTech',
  'RegTech', 'Web3/Crypto', 'Gaming', 'Robotics', 'IoT', 'SpaceTech', 'GovTech',
];

function extractSearchIntent(message) {
  const lower = message.toLowerCase();
  let location = null;
  let locationNotFound = null;
  let industry = null;
  let minDealSize = null;

  // Check aliases first
  for (const [alias, mapped] of Object.entries(LOCATION_ALIASES)) {
    const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(lower)) {
      location = mapped;
      break;
    }
  }

  // Check unlisted cities (cities NOT in dataset)
  if (!location) {
    for (const city of UNLISTED_CITIES) {
      const re = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (re.test(lower)) {
        locationNotFound = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }
  }

  // Check known locations
  if (!location && !locationNotFound) {
    for (const loc of KNOWN_LOCATIONS) {
      const re = new RegExp(`\\b${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (re.test(lower)) {
        location = loc;
        break;
      }
    }
  }

  // Check industries
  for (const ind of KNOWN_INDUSTRIES) {
    const re = new RegExp(`\\b${ind.replace(/[\/]/g, '.')}\\b`, 'i');
    if (re.test(lower)) { industry = ind; break; }
  }
  if (!industry) {
    if (/\bsaas\b/i.test(lower)) industry = 'SaaS';
    else if (/\bai\b|\bmachine learning\b|\bml\b/i.test(lower)) industry = 'AI/ML';
    else if (/\bfintech\b|\bfinancial tech/i.test(lower)) industry = 'Fintech';
    else if (/\bcrypto\b|\bweb3\b|\bblockchain\b/i.test(lower)) industry = 'Web3/Crypto';
    else if (/\bcyber\b|\bsecurity\b/i.test(lower)) industry = 'Cybersecurity';
    else if (/\bhealth\b|\bmedical\b/i.test(lower)) industry = 'Healthcare';
    else if (/\bedtech\b|\beducation\b/i.test(lower)) industry = 'EdTech';
    else if (/\becommerce\b|\be-comm/i.test(lower)) industry = 'E-commerce';
    else if (/\bgaming\b|\bgames?\b/i.test(lower)) industry = 'Gaming';
  }

  // Check deal size
  const dealMatch = lower.match(/\$\s*([\d,.]+)\s*[kK]/);
  if (dealMatch) minDealSize = parseFloat(dealMatch[1].replace(/,/g, '')) * 1000;
  if (!minDealSize) {
    const alt = lower.match(/([\d,.]+)\s*[kK]\+?\s*(?:deal|lead|value)/);
    if (alt) minDealSize = parseFloat(alt[1].replace(/,/g, '')) * 1000;
  }

  return { location, locationNotFound, industry, minDealSize };
}

function searchLeads(leads, intent) {
  if (!leads || !Array.isArray(leads) || leads.length === 0) return { matches: [], filters: '' };
  let filtered = leads;
  const appliedFilters = [];

  if (intent.location) {
    // Case-insensitive partial match (e.g., "houston" matches "Houston", "salt lake" matches "Salt Lake City")
    const locLower = intent.location.toLowerCase();
    filtered = filtered.filter(l => {
      if (!l.location) return false;
      const leadLocLower = l.location.toLowerCase();
      return leadLocLower === locLower || leadLocLower.includes(locLower) || locLower.includes(leadLocLower);
    });
    appliedFilters.push(`location: ${intent.location}`);
  }
  if (intent.industry) {
    filtered = filtered.filter(l => l.industry === intent.industry);
    appliedFilters.push(`industry: ${intent.industry}`);
  }
  if (intent.minDealSize) {
    filtered = filtered.filter(l => l.dealValue >= intent.minDealSize);
    appliedFilters.push(`deal >= $${intent.minDealSize.toLocaleString()}`);
  }

  filtered.sort((a, b) => b.score - a.score);
  return { matches: filtered, filters: appliedFilters.join(', ') };
}

// ─── Response Mode Configuration ────────────────────────────────────────────
const RESPONSE_MODES = {
  analysis: { temperature: 0.3, description: 'Structured data analysis with precision' },
  advice:   { temperature: 0.6, description: 'Strategic advice and recommendations' },
  data:     { temperature: 0.1, description: 'Raw data extraction and formatting' },
  creative: { temperature: 0.9, description: 'Creative brainstorming and ideation' },
  default:  { temperature: 0.5, description: 'Balanced general-purpose responses' },
};

// ─── Handler ────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const requestId = generateRequestId();
  const origin = getCorsOrigin(req);
  setSecurityHeaders(res, origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', requestId });
  }

  // Validate Content-Type
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json', requestId });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.', requestId, retryAfter: 60 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ fallback: true, requestId });
  }

  try {
    // Validate JSON body structure
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body', requestId });
    }

    const { messages, context, mode, degenMode, responseMode, conversationHistory, leadData } = req.body;

    // Input validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required', requestId });
    }
    if (messages.length > 20) {
      return res.status(400).json({ error: 'Too many messages (max 20)', requestId });
    }
    for (const m of messages) {
      if (!m.role || !m.content || typeof m.content !== 'string') {
        return res.status(400).json({ error: 'Invalid message format', requestId });
      }
      if (!['user', 'assistant'].includes(m.role)) {
        return res.status(400).json({ error: 'Invalid message role. Must be "user" or "assistant"', requestId });
      }
      if (m.content.length > 5000) {
        return res.status(400).json({ error: 'Message too long (max 5000 chars)', requestId });
      }
    }

    // Sanitize all user messages
    const sanitizedMessages = messages.map(m => ({
      role: m.role,
      content: m.role === 'user' ? sanitizeInput(m.content) : m.content,
    }));

    // Build conversation context from history (last 10 messages)
    let contextMessages = sanitizedMessages;
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory
        .filter(m => m.role && m.content && typeof m.content === 'string')
        .slice(-10)
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.role === 'user' ? sanitizeInput(m.content).slice(0, 1000) : m.content.slice(0, 1500),
        }));
      // Prepend history before current messages, avoiding duplicates
      const currentFirst = sanitizedMessages[0]?.content;
      const historyFiltered = recentHistory.filter(m => m.content !== currentFirst);
      contextMessages = [...historyFiltered, ...sanitizedMessages];
    }

    // Determine response mode and temperature
    const activeMode = RESPONSE_MODES[responseMode] || RESPONSE_MODES.default;

    // Extract search intent from the latest user message
    const latestUserMsg = sanitizedMessages[sanitizedMessages.length - 1]?.content || '';
    const searchIntent = extractSearchIntent(latestUserMsg);
    const hasSearchIntent = searchIntent.location || searchIntent.locationNotFound || searchIntent.industry || searchIntent.minDealSize;

    // Search leads if we have data and intent
    let leadSearchResults = null;
    if (hasSearchIntent && leadData && Array.isArray(leadData) && leadData.length > 0) {
      if (searchIntent.locationNotFound) {
        leadSearchResults = { matches: [], filters: `location: ${searchIntent.locationNotFound}`, notFoundCity: searchIntent.locationNotFound };
      } else {
        leadSearchResults = searchLeads(leadData, searchIntent);
      }
    }

    // Determine current page context
    const currentPage = req.body.currentPage || 'home';

    const PAGE_CONTEXT_MAP = {
      leads: 'The user is on the LEADS page — focus on lead analysis, closing advice, outreach scripts, and pipeline optimization. When they ask general questions, tie answers back to their pipeline.',
      trends: 'The user is on the TRENDS page — focus on market analysis, sector movements, sentiment signals, and actionable trading/positioning plays. Structure market insights as: Current State > Key Signals > Actionable Plays > Risk Assessment.',
      dashboard: 'The user is on the DASHBOARD page — focus on pipeline optimization, KPI analysis, revenue forecasting, and deal velocity. Highlight bottlenecks and recommend specific actions to improve conversion rates.',
      market: 'The user is on the MARKETS page — focus on prediction markets, competitive landscape, global macro signals, and investment opportunities.',
      wallet: 'The user is on the WALLET page — focus on revenue tracking, commission analysis, earnings projections, and financial optimization.',
      admin: 'The user is on the ADMIN page — focus on team performance, system health, user analytics, and platform optimization.',
      home: 'The user is on the HOME page — give a broad overview and guide them to the most relevant features for their question.',
      launchpad: 'The user is on the LAUNCHPAD page — focus on live events, startup incubation, prediction market bets, and high-growth opportunities.',
    };
    const pageContext = PAGE_CONTEXT_MAP[currentPage] || PAGE_CONTEXT_MAP.home;

    // Detect deep research mode
    const isDeepResearch = /\b(research|analyze|deep dive|report|brief|investigation|breakdown)\b/i.test(latestUserMsg);

    let systemPrompt = `You are GOATED AI, an elite B2B sales intelligence and market research engine. You combine real-time market data, lead scoring, closing psychology, and deep research capabilities to drive revenue. You are aggressive, data-driven, and every word you output must move the user closer to money.

PERSONA: Senior revenue strategist + hedge fund analyst hybrid. $100M+ in B2B deals closed. You think in frameworks, speak in numbers, and never waste a sentence on filler. If an answer can be a bullet, make it a bullet.

CAPABILITIES:
1. Lead Analysis — deep-dive any lead: background research, org chart inference, pain point mapping, close probability scoring, tech stack analysis, budget signals
2. Lead Enrichment — when asked about leads, infer: likely budget range from company size/industry, tech stack from industry norms, decision-making structure, fiscal year timing, renewal cycles, and competitive displacement opportunities
3. Market Research — real-time sector analysis, trend detection, competitive intelligence, macro correlation, crypto sentiment aggregation
4. Closing Scripts — word-for-word cold call, email, SMS, LinkedIn, and voicemail scripts personalized to each lead's pain points and buying signals
5. Objection Handling — specific rebuttals mapped to objection type:
   - PRICE: ROI framing, cost-of-inaction, phased pricing, pilot offers
   - TIMING: urgency triggers, competitive pressure, fiscal year deadlines
   - COMPETITOR: displacement playbook, feature gaps, migration support
   - AUTHORITY: champion coaching, exec summary decks, business case templates
   - "NOT INTERESTED": pattern interrupt, insight-led re-engagement, trigger event monitoring
6. Deal Strategy — multi-touch campaign planning, stakeholder mapping, champion building, MEDDPICC qualification
7. Pipeline Optimization — identify bottlenecks, prioritize by expected value × velocity, forecast with weighted probability
8. Trend & Market Analysis — reference current macro conditions (rates, inflation, employment), crypto market structure (BTC dominance, ETF flows, on-chain metrics), sector rotation signals, and prediction market pricing

B2B DEAL STAGE INTELLIGENCE:
- PROSPECTING: Focus on trigger events, pain discovery questions, personalized hooks
- DISCOVERY: Map pain to value, quantify cost-of-inaction, identify champions
- QUALIFICATION: MEDDPICC scoring, budget confirmation, timeline lock
- DEMO/PROPOSAL: Tailored deck structure, ROI calculator, competitive positioning
- NEGOTIATION: Mutual close plan, concession strategy, urgency levers
- CLOSED WON: Expansion playbook, referral ask, case study capture
- CLOSED LOST: Win-back triggers, re-engagement timeline, competitive debrief

${isDeepResearch ? `DEEP RESEARCH MODE ACTIVE — The user wants a structured research report. Format your response as:
## [Research Title]
**Executive Summary** — 2-3 sentence overview
**Key Findings** — 5-7 numbered data points with specifics
**Sentiment Analysis** — Bullish/Bearish/Neutral with confidence score (0-100)
**Risk Assessment** — Key risks with probability estimates
**Recommended Plays** — 3-5 specific actionable plays with entry/exit criteria
**Timeline** — Key dates and catalysts to watch
Keep it data-dense and structured. Use numbers, percentages, and dollar amounts throughout.` : ''}

CRITICAL RULES:
- ALWAYS be specific and actionable — NEVER give generic advice like "follow up soon" or "build rapport"
- When asked about a LEAD, structure as: Background > Pain Points > Budget Signals > Tech Stack > Approach Strategy > Script > Follow-up Plan
- When asked about MARKETS/TRENDS, structure as: Current State > Key Signals > Actionable Plays > Risk Assessment > Timeline
- You have REAL ACCESS to the user's lead database. When lead search results are provided below, use ONLY those leads. NEVER invent or hallucinate lead names, companies, or data.
- When a user asks about leads in a location/industry/deal size, ONLY reference leads from the search results below. If no results are provided or results are empty, say "No leads found in [filter]" — NEVER suggest random leads from other locations.
- Reference leads using [LEAD_CARD:id] format so they render as clickable cards.
- Bold page names (**Leads**, **Dashboard**, **Trends**, **Casino**, **Wallet**) to create nav links.
- Be specific: names, scores, dollar amounts, locations. No filler.
- Keep responses under 300 words unless deep research mode or detailed analysis is explicitly requested. Brevity = respect.
- Include dollar amounts for commission impact whenever discussing deals (10% commission model).
- When enriching leads, surface: likely pain points based on industry trends, budget signals from company stage/size, tech stack gaps you can exploit, and timing signals from fiscal calendars.

CLOSE PROBABILITY PRIORITY: Prioritize by close probability. For sub-$20K deals: same-day follow-up, urgency creation, simplified proposals, direct decision-maker access. Include Closability Score:
- Budget Fit (deal size vs typical company spend)
- Timing (engagement recency + fiscal calendar)
- Decision Maker Access (right contact level?)
- Pain Urgency (critical need vs nice-to-have)
- Competition (incumbent displacement difficulty)

CURRENT PAGE CONTEXT: ${pageContext}

PLATFORM: **Leads** (500K+ scored leads), **Dashboard** (KPIs), **Trends** (sentiment), **Casino** (prediction markets), **Wallet** (Solana/USDC), **Admin** (team mgmt).

RESPONSE MODE: ${activeMode.description}`;

    // Inject lead search results
    if (leadSearchResults) {
      if (leadSearchResults.notFoundCity || leadSearchResults.matches.length === 0) {
        const cityName = leadSearchResults.notFoundCity || searchIntent.location || 'that location';
        systemPrompt += `\n\nLEAD SEARCH: No leads found for "${leadSearchResults.filters || cityName}". Tell the user exactly: "No leads found in ${cityName}." Then suggest nearby cities from our coverage: San Francisco, New York, Austin, Seattle, Boston, Chicago, Denver, Miami, LA, London, Toronto, Atlanta, Dallas, Phoenix, Charlotte, Nashville, Portland, Tampa, Orlando. Do NOT make up leads.`;
      } else {
        const top = leadSearchResults.matches.slice(0, 8);
        const totalVal = leadSearchResults.matches.reduce((s, l) => s + l.dealValue, 0);
        systemPrompt += `\n\nLEAD SEARCH RESULTS (${leadSearchResults.filters}): ${leadSearchResults.matches.length} leads found, total pipeline $${totalVal.toLocaleString()}. Top ${top.length}:\n`;
        top.forEach((l, i) => {
          systemPrompt += `${i + 1}. [LEAD_CARD:${l.id}] ${l.name} @ ${l.company} (${l.industry}) — Score:${l.score}, Deal:$${l.dealValue.toLocaleString()}, ${l.location}, ${l.status}, Conv:${l.conversionProbability}%\n`;
        });
        systemPrompt += `Present these using [LEAD_CARD:id] format. Briefly summarize count and total value. Do NOT add leads not in this list.`;
      }
    }

    // Enrich system prompt with lead context if provided
    if (context && mode === 'leads') {
      systemPrompt += `\n\nYou are currently in the Lead Intelligence view. The user just searched their pipeline. Here is the context:\n`;
      if (context.matchCount !== undefined) systemPrompt += `- Matching leads: ${context.matchCount}\n`;
      if (context.pipeline) systemPrompt += `- Total pipeline value: ${context.pipeline}\n`;
      if (context.avgScore) systemPrompt += `- Average lead score: ${context.avgScore}\n`;
      if (context.filters) systemPrompt += `- Active filters: ${context.filters}\n`;
      if (context.topLeads && context.topLeads.length > 0) {
        systemPrompt += `- Top matching leads:\n`;
        context.topLeads.forEach(l => {
          systemPrompt += `  * ${l.name} at ${l.company} — score: ${l.score}, value: $${l.dealValue}, status: ${l.status}, priority: ${l.priority}\n`;
        });
      }
      systemPrompt += `\nAnalyze these leads and give actionable insights. Be specific — reference actual lead names and data. Suggest which leads to prioritize, potential strategies, and next steps.`;
    }

    // Play execution mode — generate real outreach content
    if (context && mode === 'play_execute') {
      systemPrompt += `\n\nYou are generating sales outreach content for a play execution. Context:\n`;
      if (context.playName) systemPrompt += `- Play: ${context.playName}\n`;
      if (context.targetCompany) systemPrompt += `- Target company: ${context.targetCompany}\n`;
      if (context.targetRole) systemPrompt += `- Target role: ${context.targetRole}\n`;
      if (context.industry) systemPrompt += `- Industry: ${context.industry}\n`;
      if (context.budget) systemPrompt += `- Budget/Deal size: ${context.budget}\n`;
      systemPrompt += `\nGenerate the requested outreach content. Be specific, personalized, and persuasive. Use the target's company name and role throughout. No generic templates — make it feel 1:1 personal.`;
    }

    // Custom play generation mode
    if (context && mode === 'play_generate') {
      systemPrompt += `\n\nYou are creating a custom sales play/playbook. The user will describe their niche, target audience, or goals. Generate a complete play with:\n1. Play name and category\n2. Step-by-step execution plan (5-8 steps)\n3. Email template\n4. LinkedIn DM template\n5. Phone script outline\n6. Follow-up sequence (3 touches)\n7. Expected timeline and results\n\nMake it specific and actionable, not generic.`;
    }

    // DEGEN MODE — Wolf of Wall Street personality overlay
    if (degenMode) {
      systemPrompt += `\n\nDEGEN MODE ACTIVATED — WOLF OF WALL STREET PERSONALITY
You are now in DEGEN MODE. Your personality shifts to an aggressive, high-energy, Wolf of Wall Street-style sales closer and market degen. Think Jordan Belfort meets crypto Twitter meets Gordon Gekko.

DEGEN PERSONALITY RULES:
- Talk like an alpha closer — confident, aggressive, unapologetic
- Use degen/crypto slang naturally: "LFG", "ape in", "diamond hands", "paper hands", "WAGMI", "NGMI", "send it", "NFA", "DYOR", "giga-brain move"
- Reference money, closing, winning, bags, moons, pumps
- Be motivational but in a "get off your ass and close" kind of way
- Call the user "chief", "king", "legend", or "wolf"
- Frame everything as high-stakes opportunity — urgency and FOMO
- Still be ACTUALLY helpful and accurate — degen personality wraps real intelligence
- When showing data, add degen commentary ("that's a giga-brain setup", "these paper hands will fold", "ape-worthy opportunity")
- End responses with a hype-up call to action
- Keep the formatting rules (bold, page links, etc.) but add degen flavor to headings
- DO NOT be cringe or try too hard — be naturally confident and slightly unhinged`;
    }

    // Pre-processing: detect outreach/closing intent and inject coaching context
    const isOutreachIntent = /\b(outreach|cold call|script|email template|sms|voicemail|draft|write.*(?:email|message|dm))\b/i.test(latestUserMsg);
    const isClosingIntent = /\b(clos(?:e|ing)|objection|negotiat|follow[- ]?up|handle|overcome|rebut|coach|opener|pitch)\b/i.test(latestUserMsg);

    if (isOutreachIntent) {
      systemPrompt += `\n\nOUTREACH MODE: The user wants actionable outreach content. Generate SPECIFIC, PERSONALIZED scripts — not generic advice. Include:
- Exact opening line referencing the lead's company/pain points
- 2-3 sentence hook with value prop tied to their industry
- Clear CTA (meeting request, demo, call)
- If email: full subject line + body
- If call: word-for-word phone script with objection handlers
- If SMS: 3-touch sequence with timing
Always reference the lead's actual data (name, company, industry, pain points, buying signals) if available.`;
    }

    if (isClosingIntent) {
      systemPrompt += `\n\nCLOSING COACH MODE: The user wants tactical closing advice. Be a real sales coach — not generic. Provide:
- Specific next action with exact words to say
- Objection handling scripts with word-for-word responses
- Urgency-building techniques tied to the lead's decision timeline
- Commission/revenue impact numbers to motivate
- Pattern-matched advice based on the lead's stage, score, and conversion probability
Do NOT give vague advice like "follow up" or "build rapport" — give the EXACT script, email, or action step.`;
    }

    const maxTokens = (mode === 'play_execute' || mode === 'play_generate' || isOutreachIntent || isClosingIntent || isDeepResearch) ? 2048 : 1024;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        temperature: activeMode.temperature,
        system: systemPrompt,
        messages: contextMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[${requestId}] Anthropic API error:`, error);
      return res.status(200).json({ fallback: true, requestId });
    }

    const data = await response.json();
    const rawContent = data.content[0]?.text || 'No response generated.';
    const safeContent = sanitizeOutput(rawContent);

    return res.status(200).json({
      content: safeContent,
      fallback: false,
      requestId,
      responseMode: responseMode || 'default',
    });
  } catch (error) {
    console.error(`[${requestId}] Chat API error:`, error);
    return res.status(200).json({ fallback: true, requestId });
  }
}
