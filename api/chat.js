// =============================================================================
// GOATED AI Chat — Enhanced LLM Integration with Security Hardening
// =============================================================================

import { TOOL_SCHEMAS, runTool } from './_lib/tools.js';

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

/**
 * Strip figures the model invented rather than read from a tool result.
 *
 * Llama will not reliably follow "do not invent deal values" — across three
 * identical runs of the same query it produced "$10K - 60%", "$8K - 55%" and
 * "$10K - 50%" for the same businesses. Those numbers are not in the tool
 * output and change every time, which is exactly the kind of confident
 * fabrication that makes the whole feature untrustworthy.
 *
 * Anything numeric that does appear in the tool results is left alone, so real
 * ratings, review counts and prices survive.
 */
/**
 * Render a lead search result without going back to the model.
 *
 * Everything the assistant used to get wrong about a lead list was a
 * re-typing error: company names that were not in the results, phone numbers
 * invented to fill a slot, review counts drifting, "no gaps" attached to a
 * business that had three. The model was reading correct data and
 * paraphrasing it badly.
 *
 * There is no reason to let it paraphrase at all here. The tool output is
 * already structured, so we format it ourselves — which makes this answer
 * hallucination-proof by construction, halves the token cost of the most
 * common query, and still works when the model is rate limited.
 */
function renderLeadResults(result, args) {
  const leads = Array.isArray(result?.leads) ? result.leads : [];
  const titleCase = (t) => String(t || '').replace(/\b[a-z]/g, (c) => c.toUpperCase());
  const where = titleCase(result?.locationUsed || args?.location || '') || 'your area';
  // The tool strips non-trade words like "leads" or "businesses" from the
  // search, but the headline still used them — "12 leads businesses in Tampa",
  // "12 businesses businesses".
  const rawTrade = String(args?.query || '').trim();
  const GENERIC = /^(leads?|businesses|business|companies|company|prospects?|clients?|customers?|places?|people|any(thing)?|stuff|multiple\s+\w+|various\s*\w*|all\s*\w*|trades?|services?|local\s+\w+)$/i;
  const trade = GENERIC.test(rawTrade) ? '' : rawTrade;
  const what = trade ? `${trade} businesses` : 'local businesses';

  if (!leads.length) {
    return `No ${what} found in ${where} right now. Try a nearby city, or a broader trade `
      + `(for example "plumber" rather than "emergency drain repair").`;
  }

  const money = (n) => `$${n.toLocaleString('en-US')}`;
  const lines = leads.slice(0, 8).map((l, i) => {
    const bits = [];
    if (l.reviews != null) bits.push(`${l.reviews} review${l.reviews === 1 ? '' : 's'}${l.rating ? ` at ${l.rating}★` : ''}`);
    if (!l.website) bits.push('**no website**');
    if (!l.phone) bits.push('no published number');
    // `gaps` carries the placeholder string when nothing was found; only show
    // real ones so we never announce a gap that isn't there.
    const realGaps = (l.gaps || []).filter(g => !/^none found/i.test(g));
    if (realGaps.length) bits.push(realGaps.join(', '));

    const quote = !l.website ? `${money(4000)} + ${money(1000)}/mo` : `${money(2000)} + ${money(750)}/mo`;
    return `${i + 1}. **${l.company}**${l.location ? ` — ${l.location}` : ''}\n`
      + `   ${bits.join(' · ') || 'Established operator'}\n`
      + `   ${l.phone ? `${l.phone} · ` : ''}Quote ${quote}`;
  });

  const noSite = leads.filter(l => !l.website).length;
  const head = `${leads.length} ${what} in ${where}, ranked by how closable they are.`;
  const tail = noSite
    ? `\n\n${noSite} ${noSite === 1 ? 'has' : 'have'} no website — lead with the build plus phone cover.`
    : `\n\nAll of them have a site and solid reviews, so there's no obvious gap to open on. `
      + `Pitch missed-call recovery: ask who answers after hours.`;

  return `${head}\n\n${lines.join('\n')}${tail}`;
}

function stripUngroundedFigures(text, toolResultsJson) {
  if (!text) return text;
  const grounded = toolResultsJson || '';
  const isGrounded = (token) => {
    const digits = token.replace(/[^0-9.]/g, '');
    return digits.length > 0 && grounded.includes(digits);
  };

  let out = text;
  // Placeholder maths — "$X/year", "$Y return". No digits, so the grounding
  // check below never sees them, and they read as a broken template.
  out = out.replace(/\$[A-Z]\b\/?\w*/g, '');
  // Dollar amounts: $10K, $8,500, $2000
  out = out.replace(/\$\s?[\d,]+(?:\.\d+)?\s?[KkMm]?\b/g, (m) => (isGrounded(m) ? m : ''));
  // Percentages presented as close/conversion rates. Digit-matching alone is
  // not enough here: "60%" matched `score: 60` in the tool output and
  // survived as a fabricated close rate. A percentage is only real if the
  // tool output actually expressed one.
  const groundedHasPercent = grounded.includes('%');
  out = out.replace(/\b\d{1,3}(?:\.\d+)?\s?%/g, (m) => (groundedHasPercent && isGrounded(m) ? m : ''));
  // Tidy up what the removals left behind, or the line reads as broken
  // ("Rescue Air - - Call to recover"). Collapse runs of separators until
  // stable, then drop any that now dangle at the end of a line.
  let prev;
  do {
    prev = out;
    out = out.replace(/([ \t]*[-–—][ \t]*){2,}/g, ' - ');
  } while (out !== prev);
  out = out.replace(/[ \t]*[-–—][ \t]*(?=[\n,.)]|$)/gm, '');
  out = out.replace(/^[ \t]*[-–—][ \t]*/gm, (m, off) => (off === 0 ? '' : m));
  out = out.replace(/[ \t]{2,}/g, ' ');
  out = out.replace(/[ \t]+([,.])/g, '$1');
  // A stripped figure can leave a stub like "commission =." or
  // "Commission impact: on a deal." Drop clauses that no longer say anything.
  out = out.replace(/[^.\n]*\b(?:commission|deal value|close rate)\b[^.\n]*(?:[.,]|$)/gi, '');
  out = out.replace(/^[\s*\-–—|]*$/gm, '');
  out = out.replace(/\n{3,}/g, '\n\n');
  out = out.replace(/[ \t]{2,}/g, ' ');
  return out.trim();
}

function sanitizeOutput(text) {
  if (typeof text !== 'string') return '';
  // Remove any script tags or event handlers that might have leaked through
  let clean = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/javascript:/gi, '');
  clean = clean.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  return clean;
}

// ─── No-LLM fast path for lead searches ─────────────────────────────────────
// "hvac leads in dallas" is the single most common thing anyone asks this
// chat, and it needs no language model: it's a trade and a city. Parsing it
// directly means the answer is identical every time, costs nothing against the
// daily token allowance, and keeps working when the model is unavailable — the
// state the assistant spent most of today in.
//
// Deliberately conservative. Anything that isn't clearly "<trade> in <place>"
// falls through to the model, because a wrong guess here would answer a
// question the user didn't ask.
const TRADE_WORDS = [
  'hvac', 'air conditioning', 'ac repair', 'heating', 'furnace',
  'plumber', 'plumbing', 'drain', 'water heater',
  'electrician', 'electrical', 'roofer', 'roofing', 'gutter',
  'landscaper', 'landscaping', 'lawn care', 'tree service', 'fencing', 'fence',
  'pest control', 'exterminator', 'locksmith', 'garage door',
  'appliance repair', 'water damage', 'mold remediation', 'restoration',
  'septic', 'well drilling', 'foundation repair', 'concrete', 'paving',
  'painter', 'painting', 'flooring', 'remodeling', 'contractor',
  'auto repair', 'mechanic', 'body shop', 'towing', 'tow truck',
  'pool service', 'pool cleaning', 'window replacement', 'windows',
  'cleaning service', 'house cleaning', 'carpet cleaning', 'junk removal',
  'moving company', 'movers', 'chimney', 'solar',
  'dentist', 'chiropractor', 'med spa', 'veterinarian', 'vet', 'optometrist',
];

function fastLeadSearchIntent(message) {
  if (typeof message !== 'string') return null;
  const text = message.trim();
  if (text.length > 140) return null;                    // long asks are rarely a plain search

  const lower = text.toLowerCase();

  // Must read as a request for businesses, not advice about them.
  if (/\b(how|why|should i|what should|explain|write|draft|script|objection|pitch|email)\b/.test(lower)) return null;

  // Allow the plural — people ask for "plumbers", not "plumber".
  const trade = TRADE_WORDS.find(t =>
    new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`).test(lower));
  if (!trade) return null;

  // Location: whatever follows in/near/around, minus trailing qualifiers.
  let location = null;
  const m = lower.match(/\b(?:in|near|around|from)\s+([a-z .'-]{2,40}?)(?:\s+(?:with|that|who|and|area|please)\b|[,.?!]|$)/);
  if (m) {
    location = m[1].trim().replace(/\s+/g, ' ');
    if (/^(the|my|me|us|here|town|city|area)$/.test(location)) location = null;
  }
  // "near me" matches the in/near/around regex above and captures "me", which
  // then nulls out — so this check has to run afterwards, not as an else. It
  // previously never fired, and "plumbers near me" fell through to the model,
  // which passed "near me" on as a literal place and searched Anaheim.
  if (location === null && /\bnear\s*me\b|\bmy\s*area\b|\baround\s*here\b|\bnearby\b|\blocal\b/.test(lower)) {
    location = '';                                       // caller's own city, resolved server-side
  }
  if (location === null) return null;                    // no place named — let the model handle it

  // An explicit "with no website" style filter is a real request we cannot
  // express through the Places query, so hand those to the model instead of
  // silently ignoring the constraint.
  if (/\bno website\b|\bwithout a website\b|\bbad reviews?\b|\bno reviews?\b/.test(lower)) return null;

  return { query: trade, location };
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
  const groqKey = process.env.GROQ_API_KEY;
  if (!apiKey && !groqKey) {
    return res.status(200).json({ fallback: true, requestId, reason: 'no_llm_key' });
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

    // The latest user turn drives several intent checks below. It was declared
    // alongside the removed lead-search extractor, so pulling that out took
    // this with it.
    const latestUserMsg = sanitizedMessages[sanitizedMessages.length - 1]?.content || '';

    // Detect deep research mode
    const isDeepResearch = /\b(research|analyze|deep dive|report|brief|investigation|breakdown)\b/i.test(latestUserMsg);

    let systemPrompt = `You are GOATED AI — a B2B sales terminal. Tight, numeric, tactical. Zero fluff.

${isDeepResearch ? `DEEP RESEARCH: structured report.
## Title · **Summary** (2 lines) · **Findings** (5 numbered) · **Sentiment** (Bullish/Bearish + confidence) · **Risk** · **Plays** (3) · **Timeline**.
Data-dense. Numbers and dollars throughout.` : ''}

RULES — OBEY EVERY ONE:
- Tools are for fetching real data the user asked for, never for illustrating a point.
  "Find me plumbers in Phoenix" is a search. "What should I sell a roofer with no website"
  is advice — answer it yourself, from what we sell, with NO tool call. If you do not have a
  real domain the user gave you, do not call a tool that needs one.
- Never state a deal value, close rate, commission or percentage that did not come back from
  a tool. If you do not have the number, leave it out — an answer without it is fine.
- NEVER mention commission, payouts or splits. We do not pay them and the UI does not show them.
- Never write placeholder maths like "$X/year" or "$Y return". Either use a real figure or
  describe the benefit in words.
- Our pricing is a one-time deposit plus a monthly retainer: $2,000 + $750/mo for the AI
  receptionist, $2,000 + $250/mo to add a website build. Quote those when asked what to sell.
- 60 words MAX unless the user explicitly asks for a report / breakdown / deep dive.
- Bullets beat paragraphs. Lead with the number or action — no "Sure, here's…" preambles.
- Name + number is a complete answer. Say it and stop.
- EXACT actions only. No "follow up soon" / "build rapport" — give the literal next move.
- ONLY real businesses returned by a tool. Never invent a name, company, phone or dollar amount.
- If a tool returns nothing: say so plainly and stop. Do not fill the gap.
- Page refs bold: **Leads**, **Dashboard**, **Audit**.
- Lead queries are answered from tool output, and the app formats that list itself —
  do NOT restate deal values or close percentages. We do not compute them per business,
  so any figure you write there is invented. This line used to ask you for exactly that.
- Never emit [LEAD_CARD:id]; you have no real ids.
- Nav phrases ("go to X", "open X", "take me to X"): respond with one line and [NAVIGATE:pageid]. No essay.
- Never mention commission, payouts or splits — we do not pay them.
- Sub-$20K deals: same-day follow-up + simplified proposal — speed wins.

${''/* DEGEN prompt removed. It injected "Wolf of Wall Street energy" — trading
slang, "LETS FUCKING GO", insulting inaction, manufactured 48-hour urgency.
Wrong register entirely: the person on the other end is a plumber being asked
about missed calls, and that tone reads as a scam. The visual theme stayed; the
personality did not. */}

CURRENT PAGE CONTEXT: ${pageContext}

RESPONSE MODE: ${activeMode.description}`;

    // The legacy in-memory lead search that used to live here has been removed.
    //
    // It filtered whatever the client had already loaded rather than fetching
    // real businesses, and it injected two fabrications straight into the
    // prompt as fact: `Conv:${l.conversionProbability}%`, which is null on
    // every live lead and therefore rendered as "undefined%", and a "total
    // pipeline" sum of estimated deal values. It also offered London and
    // Toronto as coverage, which is not the market.
    //
    // Live lead search is handled by the deterministic fast path and the
    // search_leads tool, both of which return real businesses.

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

    const chatMessages = contextMessages.map(m => ({ role: m.role, content: m.content }));

    // Two live providers, tried in order. Anthropic first for quality; Groq is a
    // real second engine (not a canned template) so an Anthropic outage, rate
    // limit, or exhausted credit balance never silently degrades the product to
    // static text. Only if BOTH are unavailable do we signal fallback.
    let rawContent = null;
    let llmUsed = null;
    const providerErrors = [];
    // Surfaced in the response so the UI can show what the assistant actually did.
    const toolsUsed = [];
    // Seeded with our own canonical pricing so the ungrounded-figure stripper
    // treats it as real. Without this it deleted the numbers we actually want
    // quoted — "$2,000 + $750/mo" came out as "+ /mo" — because they originate
    // in the system prompt rather than a tool result.
    let groundingJson = JSON.stringify({
      pricing: [2000, 750, 250, 300, 1500, 10000, 20000, 2500, 5000],
    });

    // Before spending a model call: if this is plainly "<trade> in <city>",
    // run the search and format it ourselves. Same answer every time, no
    // tokens, and it still works once the daily allowance is gone.
    // NB: `origin` above is the CORS origin — an allow-listed constant, not
    // this server's address. Self-fetches must use the request's own host, or
    // they end up hitting whatever is first in ALLOWED_ORIGINS.
    const selfHost = req.headers.host || '';
    const selfProto = req.headers['x-forwarded-proto']
      || (/^(localhost|127\.0\.0\.1)/.test(selfHost) ? 'http' : 'https');
    const selfOrigin = `${selfProto}://${selfHost}`;

    // Resolve the caller's city here, where the edge headers are genuine, and
    // hand it to tools as a value. Forwarding the headers themselves does not
    // survive the hop — see the note in tools.js.
    const cityHdr = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : '';
    const regionHdr = req.headers['x-vercel-ip-country-region'] || '';
    const callerCity = (req.headers['x-vercel-ip-country'] === 'US' && cityHdr)
      ? `${cityHdr}${regionHdr ? ' ' + regionHdr : ''}`
      : '';

    const fastIntent = fastLeadSearchIntent(contextMessages[contextMessages.length - 1]?.content || '');
    if (fastIntent) {
      try {
        const result = await runTool('search_leads', fastIntent, {
          origin: selfOrigin,
          authorization: req.headers.authorization,
          callerCity,
        });
        if (result && !result.error) {
          return res.status(200).json({
            content: renderLeadResults(result, fastIntent),
            fallback: false,
            llm: 'deterministic:fast-path',
            toolsUsed: [{ name: 'search_leads', args: fastIntent }],
            requestId,
            responseMode: responseMode || 'default',
          });
        }
      } catch (e) {
        // Fall through to the model rather than failing the request.
        console.warn(`[${requestId}] fast path failed, deferring to LLM:`, e.message);
      }
    }

    if (apiKey) {
      try {
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
            messages: chatMessages,
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (response.ok) {
          const data = await response.json();
          rawContent = data.content?.[0]?.text || null;
          llmUsed = 'anthropic:claude-sonnet-4-6';
        } else {
          providerErrors.push(`anthropic ${response.status}: ${(await response.text()).slice(0, 200)}`);
        }
      } catch (e) {
        providerErrors.push(`anthropic threw: ${e.message}`);
      }
    }

    if (!rawContent && groqKey) {
      try {
        // ── Agentic loop ──────────────────────────────────────────────────
        // The model gets real tools and decides what to call. "hvac leads in
        // dallas" now triggers a live search_leads({query:'hvac',
        // location:'Dallas TX'}) — a fresh API request — rather than being
        // answered from whichever leads happened to be in page memory.
        //
        // Two rounds maximum: enough to call a tool and then answer with the
        // result, bounded so a confused model can't loop until the function
        // times out.
        const convo = [{ role: 'system', content: systemPrompt }, ...chatMessages];
        const MAX_ROUNDS = 2;

        for (let round = 0; round < MAX_ROUNDS && !rawContent; round++) {
          const gr = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              max_tokens: maxTokens,
              temperature: activeMode.temperature,
              messages: convo,
              // Only offer tools on the first round. After results are in, the
              // model should be writing an answer, not calling again.
              ...(round === 0 ? { tools: TOOL_SCHEMAS, tool_choice: 'auto' } : {}),
            }),
            signal: AbortSignal.timeout(30000),
          });

          if (!gr.ok) {
            providerErrors.push(`groq ${gr.status}: ${(await gr.text()).slice(0, 200)}`);
            break;
          }

          const gd = await gr.json();
          const msg = gd.choices?.[0]?.message;
          const calls = msg?.tool_calls || [];

          if (calls.length) {
            convo.push(msg);
            // Hard grounding. Left to itself the model dressed real tool output in
            // invented numbers — "$15K, 80% close, [LEAD_CARD:1234]" for
            // businesses whose deal value and close rate we never computed, and
            // "Email <name>" when no address was returned. Tool output is the
            // only permitted source of fact for this answer.
            convo.push({
              role: 'system',
              content:
                'The tool results below are the ONLY source of truth for your next message.\n'
                + '- Quote company name, city, phone, rating and review count exactly as returned.\n'
                + '- Do NOT invent deal values, close probabilities, commissions or scores. If a field '
                + 'is absent, omit it — never estimate it.\n'
                + '- Do NOT emit [LEAD_CARD:id] tokens; you have no real ids.\n'
                + '- Do NOT suggest emailing anyone unless an email address appears in the results. '
                + 'These are phone-first prospects.\n'
                + '- If a business has no website or few reviews, say so plainly — that is the opening.\n'
                // The model was leading with whichever business looked most
                // impressive — recommending a 4.9-star operator with 4,000
                // reviews, which is the single hardest sale in the list. We
                // rank on need, and `score` already encodes it.
                + '- Rank by how CLOSABLE they are, not how successful. Highest `score` first. '
                + 'A business with no website, few reviews or no phone is the BEST prospect because '
                + 'we can fix that; one with thousands of reviews and a polished site is the WORST. '
                + 'Lead with the ones that have gaps and say which gap.\n'
                + '- NEVER write a phone number that is not present in the results. Llama will '
                + 'happily produce (123) 456-7890 to fill the slot; omit the number instead.\n'
                + '- Be concise: a short list, one line each, then a single next action.',
            });
            let directAnswer = null;
            for (const c of calls) {
              let args = {};
              try { args = JSON.parse(c.function?.arguments || '{}'); } catch { /* malformed args */ }
              const result = await runTool(c.function?.name, args, {
                origin: selfOrigin,
                authorization: req.headers.authorization,
                callerCity,
              });
              toolsUsed.push({ name: c.function?.name, args });

              // A lead list is pure data. Render it ourselves rather than
              // asking the model to read it back — see renderLeadResults.
              if (c.function?.name === 'search_leads' && !result?.error && calls.length === 1) {
                directAnswer = renderLeadResults(result, args);
              }
              convo.push({
                role: 'tool',
                tool_call_id: c.id,
                name: c.function?.name,
                content: (() => {
                  const j = JSON.stringify(result).slice(0, 6000);
                  groundingJson += j;   // what the model was actually allowed to see
                  return j;
                })(),
              });
            }
            if (directAnswer) {
              return res.status(200).json({
                content: directAnswer,
                fallback: false,
                llm: 'deterministic:search_leads',
                toolsUsed,
                requestId,
                responseMode: responseMode || 'default',
              });
            }
            continue; // let the model answer from the tool output
          }

          rawContent = msg?.content || null;
          llmUsed = 'groq:llama-3.3-70b-versatile';
        }
      } catch (e) {
        providerErrors.push(`groq threw: ${e.message}`);
      }
    }

    if (!rawContent) {
      console.error(`[${requestId}] All LLM providers failed:`, providerErrors.join(' | '));
      // Say why. Returning a bare `fallback` rendered as an empty bubble, so a
      // rate limit was indistinguishable from the assistant being broken — the
      // same failure shape the audit endpoint used to have.
      const joined = providerErrors.join(' ');
      // A per-minute throttle and an exhausted daily allowance need different
      // advice. Telling someone to wait "a few seconds" when the day's tokens
      // are gone just sends them in a loop.
      const dailyCap = /tokens per day|TPD/i.test(joined);
      const perMinute = !dailyCap && /429|rate.?limit/i.test(joined);
      return res.status(200).json({
        fallback: true,
        content: dailyCap
          ? "I've used up today's AI allowance, so I can't answer in my own words until it "
            + 'resets. Lead search still works — ask me for businesses in a city and you\'ll '
            + 'get real results. Audits and the leads page are unaffected.'
          : perMinute
          ? "I'm being rate limited right now — give it a few seconds and ask again. "
            + 'Your leads and audits are unaffected.'
          : "I couldn't reach the AI service just then. Try again in a moment — "
            + 'everything else in the app still works.',
        retryable: true,
        requestId,
        providerErrors,
      });
    }

    const safeContent = stripUngroundedFigures(sanitizeOutput(rawContent), groundingJson);

    return res.status(200).json({
      content: safeContent,
      fallback: false,
      llm: llmUsed,
      toolsUsed,
      requestId,
      responseMode: responseMode || 'default',
    });
  } catch (error) {
    console.error(`[${requestId}] Chat API error:`, error);
    return res.status(200).json({ fallback: true, requestId });
  }
}
