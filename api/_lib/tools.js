// =============================================================================
// GOATED — Agentic tools for the AI chat
// -----------------------------------------------------------------------------
// Before this, chat.js guessed at intent with regex: a fixed list of city names,
// a fixed list of industries, and a `\$\s*([\d,.]+)\s*[kK]` pattern for deal
// size. Ask for "dentists in Frisco" and Frisco wasn't in the list, so the
// parameter was silently dropped and the model answered from whatever leads
// happened to be in the page's memory.
//
// These are real tools instead. The model decides what to call and with which
// arguments, so any city and any trade work without being enumerated — and the
// answer is grounded in a live API response rather than the model's guess.
//
// This module is NOT a serverless function (underscore prefix = excluded).
// =============================================================================

/** OpenAI/Groq-compatible tool schemas. */
export const TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'search_leads',
      description:
        'Find real prospect businesses. Use for any request to find, list, source or look up '
        + 'companies, businesses or leads — including when the user names a city, a trade, or a deal size. '
        + 'Returns live results from Google Places (local service businesses) or Apollo (larger B2B).',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The trade or business type, e.g. "dentist", "HVAC repair", "roofing contractor", "marketing agency".',
          },
          location: {
            type: 'string',
            description: 'City and state, e.g. "Frisco TX", "Scottsdale AZ". Omit to use the caller\'s own city.',
          },
          minDeal: {
            type: 'number',
            description: 'Minimum target deal size in dollars. Pass 15000 or more to search larger B2B organisations instead of local businesses.',
          },
          limit: { type: 'number', description: 'How many to return, 1-20. Default 10.' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_contact',
      description:
        'Find the named decision-maker, direct phone numbers and named email addresses for a specific '
        + 'business by crawling its website. Use when the user asks who to speak to, for a contact, '
        + 'an owner, or a direct number.',
      parameters: {
        type: 'object',
        properties: {
          website: { type: 'string', description: 'The business website or domain, e.g. "jbsplumbingservices.com".' },
        },
        required: ['website'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'audit_website',
      description:
        'Run a live revenue-loss audit on a website: crawls it and returns where the business is '
        + 'leaking revenue, with dollar impact per area and which product fixes each one. Use when the '
        + 'user asks what to sell someone, what is wrong with a site, or for audit findings.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The website to audit.' },
        },
        required: ['url'],
      },
    },
  },
];

/**
 * Execute a tool call by calling our own API surface, so the model can only ever
 * reach capabilities we already expose — no arbitrary fetch.
 *
 * @param {string} name
 * @param {object} args
 * @param {object} ctx  { origin, authorization }
 */
export async function runTool(name, args, ctx = {}) {
  const base = ctx.origin || '';
  const headers = ctx.authorization ? { Authorization: ctx.authorization } : {};

  try {
    if (name === 'search_leads') {
      const p = new URLSearchParams();
      if (args.query) p.set('search', args.query);
      if (args.location) p.set('location', args.location);
      if (args.minDeal) p.set('minDeal', String(args.minDeal));
      p.set('limit', String(Math.min(Math.max(Number(args.limit) || 10, 1), 20)));

      const r = await fetch(`${base}/api/leads?${p}`, { headers, signal: AbortSignal.timeout(25000) });
      const j = await r.json();
      // Hand back a compact, decision-useful slice. Sending whole records burns
      // context and buries the fields that matter on a call.
      return {
        source: j._meta?.dataType,
        locationUsed: j._meta?.resolvedLocation || args.location || 'caller location',
        count: (j.leads || []).length,
        leads: (j.leads || []).slice(0, 12).map(l => ({
          company: l.company,
          location: l.location,
          phone: l.phone,
          website: l.website || null,
          rating: l.rating ?? null,
          reviews: l.reviewCount ?? null,
          employees: l.employees ?? null,
          score: l.score,
          gaps: (l.placeGaps || []).map(g => g.label),
        })),
      };
    }

    if (name === 'find_contact') {
      const host = String(args.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
      const r = await fetch(`${base}/api/leads?action=enrich&website=${encodeURIComponent(host)}`, {
        headers, signal: AbortSignal.timeout(25000),
      });
      const j = await r.json();
      if (!j.ok) return { ok: false, reason: j.reason };
      return {
        ok: true,
        confirmedPeople: j.people || [],
        probableFirstNames: j.probableNames || [],
        phones: (j.phones || []).map(p => p.number),
        directEmails: (j.directEmails || []).map(e => e.email),
      };
    }

    if (name === 'audit_website') {
      const r = await fetch(`${base}/api/audit`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: args.url }),
        signal: AbortSignal.timeout(28000),
      });
      const j = await r.json();
      if (!j.ok) return { ok: false, error: j.error };
      const a = j.analysis || {};
      return {
        ok: true,
        business: a.business?.name,
        monthlyLossLow: a.revenueLoss?.monthlyLowEstimate,
        monthlyLossHigh: a.revenueLoss?.monthlyHighEstimate,
        biggestLeak: a.revenueLoss?.biggestSingleLeak,
        topFixes: (a.dimensions || [])
          .filter(d => d.priority === 'P0' || d.priority === 'P1')
          .slice(0, 5)
          .map(d => ({ area: d.area, gap: d.gap, monthlyImpact: d.dollarImpactMonthly, fix: d.fixProduct })),
      };
    }

    return { error: `Unknown tool ${name}` };
  } catch (e) {
    // Return the failure to the model rather than throwing — it can tell the user
    // honestly instead of the whole turn 500ing.
    return { error: `${name} failed: ${e.message}` };
  }
}
