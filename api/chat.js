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
    };
    const pageContext = PAGE_CONTEXT_MAP[currentPage] || PAGE_CONTEXT_MAP.home;

    // Detect deep research mode
    const isDeepResearch = /\b(research|analyze|deep dive|report|brief|investigation|breakdown)\b/i.test(latestUserMsg);

    let systemPrompt = `You are GOATED AI — a B2B sales terminal. Tight, numeric, tactical. Zero fluff.

${isDeepResearch ? `DEEP RESEARCH: structured report.
## Title · **Summary** (2 lines) · **Findings** (5 numbered) · **Sentiment** (Bullish/Bearish + confidence) · **Risk** · **Plays** (3) · **Timeline**.
Data-dense. Numbers and dollars throughout.` : ''}

RULES — OBEY EVERY ONE:
- 60 words MAX unless the user explicitly asks for a report / breakdown / deep dive.
- Bullets beat paragraphs. Lead with the number or action — no "Sure, here's…" preambles.
- Name + number is a complete answer. Say it and stop.
- EXACT actions only. No "follow up soon" / "build rapport" — give the literal next move.
- ONLY real leads from the search results injected below. Never invent a name, company, or dollar amount.
- If no results: "No leads in [filter]." Done.
- Lead refs = [LEAD_CARD:id]. Page refs bold: **Leads**, **Dashboard**, **Trends**, **Wallet**, **Audit**, **Managed**.
- Lead queries: numbered list, each as [LEAD_CARD:id] + deal value + close % + one-line action. End with [NAVIGATE:leads].
- Nav phrases ("go to X", "open X", "take me to X"): respond with one line and [NAVIGATE:pageid]. No essay.
- Plays: BUY/SELL/HOLD first, 1 line why, entry/exit/stop.
- 12% commission model. For every deal mention, include commission $ impact.
- Sub-$20K deals: same-day follow-up + simplified proposal — speed wins.

${degenMode ? `DEGEN MODE IS ACTIVE. You are now GOATED AI in WOLF MODE — an ultra-aggressive, high-energy closer with zero patience for mediocrity. Channel Wolf of Wall Street energy:
- Use trading slang: "ape in", "send it", "LFG", "WAGMI", "bags", "moon", "diamond hands"
- Be ruthlessly direct — no pleasantries, no hedging, no "might" or "could"
- Frame EVERYTHING as money: "That's $X in commission you're leaving on the table"
- Create extreme urgency: "This deal dies in 48 hours if you don't call NOW"
- Celebrate aggressively: fire emojis, "LETS FUCKING GO", "MONEY PRINTER GO BRRR"
- Insult inaction: "You're literally hemorrhaging $X/day by not closing this"
- For market plays: conviction levels, risk appetite high, bold calls
- Keep it SHORT and PUNCHY — 2-3 sentences max unless deep research` : ''}

CURRENT PAGE CONTEXT: ${pageContext}

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
        systemPrompt += `Present these using [LEAD_CARD:id] format. Start with a 1-line summary of count and total value. Do NOT add leads not in this list. ALWAYS include [NAVIGATE:leads] at the end so the app routes to the leads page.`;
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

    // DEGEN MODE is already defined in the system prompt above — no duplicate overlay needed

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

    const maxTokens = (mode === 'play_execute' || mode === 'play_generate' || isDeepResearch) ? 1200
      : (isOutreachIntent || isClosingIntent) ? 600
      : 180; // ~135 words — enforce brevity rule

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
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
