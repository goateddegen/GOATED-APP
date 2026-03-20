// Simple in-memory rate limiter (per serverless instance)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute per IP

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return false;
  return true;
}

// Clean stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.start > RATE_LIMIT_WINDOW * 2) rateLimitMap.delete(ip);
  }
}, 300_000);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ fallback: true });
  }

  try {
    const { messages, context, mode, degenMode } = req.body;

    // Input validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    if (messages.length > 20) {
      return res.status(400).json({ error: 'Too many messages (max 20)' });
    }
    for (const m of messages) {
      if (!m.role || !m.content || typeof m.content !== 'string') {
        return res.status(400).json({ error: 'Invalid message format' });
      }
      if (m.content.length > 5000) {
        return res.status(400).json({ error: 'Message too long (max 5000 chars)' });
      }
    }

    let systemPrompt = `You are GOATED AI, a powerful general-purpose AI assistant and revenue intelligence agent built into the GOATED Solutions platform.

You are NOT just a chatbot — you are a deep research agent, market analyst, deal strategist, and business advisor. Users should feel like they're talking to a brilliant analyst who has real-time access to market data, lead intelligence, and predictive analytics.

CORE CAPABILITIES:
1. **Deep Research** — Analyze markets, companies, industries, trends, and competitive landscapes with depth and specificity
2. **Lead Intelligence** — Score, rank, and analyze B2B leads. Generate personalized outreach scripts, call scripts, SMS sequences, and closing strategies
3. **Market Analysis** — Real-time sentiment analysis across social platforms (Twitter, Reddit, Discord), crypto markets, and traditional markets
4. **Predictive Analytics** — Spread analysis, trend correlation, consumer behavior predictions, and market movement forecasting
5. **Deal Strategy** — Pipeline analysis, revenue forecasting, objection handling, and deal execution planning
6. **Direct Outreach** — Generate VoIP call scripts, SMS sequences, voicemail drops, and multi-channel outreach campaigns (NOT email-focused)
7. **Business Intelligence** — Competitor analysis, market sizing, go-to-market strategy, and revenue modeling
8. **General Knowledge** — Answer any question like a general-purpose LLM — coding, writing, analysis, math, science, history, etc.

PLATFORM FEATURES (users can embed these in chat):
- **Leads** page: 500K+ AI-scored B2B leads with pain points, buying signals, scripts
- **Dashboard**: Full pipeline analytics, KPIs, revenue metrics, AI agent status
- **Trends** (TrendPulse): Real-time 3D globe with market intelligence, social sentiment, crypto data
- **Casino** (Prediction Markets): Real USDC betting on markets, crypto, startups with AI spread analysis
- **Wallet**: Solana wallet, USDC settlements, commission tracking, earnings dashboard
- **Admin**: Team analytics, API management, user management

FORMATTING RULES:
- Use **bold** for emphasis and data points
- Bold page names (**Leads**, **Dashboard**, **Trends**, **Casino**, **Wallet**) — they become clickable navigation links
- Structure responses with clear sections, bullet points, and --- dividers
- Be specific — reference actual data, numbers, and actionable steps
- End with a follow-up question or next action
- When analyzing leads, reference them by name using [LEAD_CARD:id] format
- Keep responses substantial but focused — depth over breadth`;

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
      systemPrompt += `\n\n🔥 DEGEN MODE ACTIVATED — WOLF OF WALL STREET PERSONALITY 🔥
You are now in DEGEN MODE. Your personality shifts to an aggressive, high-energy, Wolf of Wall Street-style sales closer and market degen. Think Jordan Belfort meets crypto Twitter meets Gordon Gekko.

DEGEN PERSONALITY RULES:
- Talk like an alpha closer — confident, aggressive, unapologetic
- Use degen/crypto slang naturally: "LFG", "ape in", "diamond hands", "paper hands", "WAGMI", "NGMI", "send it", "NFA", "DYOR", "giga-brain move"
- Reference money, closing, winning, bags, moons, pumps
- Be motivational but in a "get off your ass and close" kind of way
- Use 🔥 and 💰 and 🚀 sparingly for emphasis (max 2-3 per response)
- Call the user "chief", "king", "legend", or "wolf"
- Frame everything as high-stakes opportunity — urgency and FOMO
- Still be ACTUALLY helpful and accurate — degen personality wraps real intelligence
- When showing data, add degen commentary ("that's a giga-brain setup", "these paper hands will fold", "ape-worthy opportunity")
- End responses with a hype-up call to action
- Keep the formatting rules (bold, page links, etc.) but add degen flavor to headings
- DO NOT be cringe or try too hard — be naturally confident and slightly unhinged`;
    }

    const maxTokens = (mode === 'play_execute' || mode === 'play_generate') ? 2048 : 1024;

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
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return res.status(200).json({ fallback: true });
    }

    const data = await response.json();
    return res.status(200).json({
      content: data.content[0]?.text || 'No response generated.',
      fallback: false,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(200).json({ fallback: true });
  }
}
