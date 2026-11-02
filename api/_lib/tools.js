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
        'Find real prospect businesses to call. Use ONLY when the user is asking for actual '
        + 'businesses — "hvac leads in dallas", "find me plumbers in phoenix", "who can I call in Tampa". '
        + 'Returns live results from Google Places (local service businesses) or Apollo (larger B2B).\n'
        + 'Do NOT use it for advice questions about how to sell, what to pitch, what something costs, '
        + 'or how to handle an objection — those are answered directly, with no tool call. '
        + '"What should I sell a roofer with no website" is advice, not a search.',
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
            type: 'string',
            description: 'Only set this when the user explicitly asks for larger or higher-value B2B '
              + 'companies. Digits only, e.g. "15000". Omit it entirely for ordinary local-business '
              + 'searches — setting it switches to a national B2B database and returns the wrong kind of company.',
          },
          solution: {
            type: 'string',
            enum: ['website', 'voice'],
            description: 'Which product the user wants prospects for. '
              + '"website" = businesses with no website, the site-build clients ("website clients", "no website", "site build"). '
              + '"voice" = businesses that are still trading and whose published hours leave 40 or more hours a week with nobody answering, the AI receptionist / voice-agent clients ("voice agent clients", "AI receptionist", "missed calls"). '
              + 'Omit for an ordinary trade search. When set, query can be empty.',
          },
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
        + 'an owner, or a direct number for a business they have named.\n'
        + 'Requires a real domain. Never invent one or pass a placeholder.',
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
        'Run a live revenue-loss audit on ONE specific website the user has named: crawls it and '
        + 'returns where that business is leaking revenue, with dollar impact per area and which '
        + 'product fixes each one.\n'
        + 'Requires a real domain the user actually gave you. Never invent a URL, never pass a '
        + 'description instead of a domain, and never audit "a similar site" to illustrate a point. '
        + 'If no specific website was named, answer from your own knowledge with no tool call.',
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

  // "near me", "my area" and friends are not places. The model passes them
  // through as literal location strings, which produced a search for
  // "plumbers in near me" and returned businesses in Anaheim. Blank them so
  // the caller's own city is used instead.
  // Enumerating phrasings loses: the model produced "near me", then
  // "user's area", then "user's city and state". Anything that describes the
  // caller instead of naming a place is not a location, so blank it and let
  // the caller's own city resolve server-side.
  const PLACEHOLDER_PLACE = /\b(near\s*me|nearby|my|mine|user'?s?|your|current|local|here|around|area|surrounding|city\s+and\s+state|unspecified|unknown|n\/?a)\b/i;
  if (args && typeof args.location === 'string') {
    const loc = args.location.trim();
    if (!loc || PLACEHOLDER_PLACE.test(loc)) args = { ...args, location: '' };
  }

  try {
    if (name === 'search_leads') {
      const p = new URLSearchParams();
      // The caller's city has to travel as a parameter, not a header.
      //
      // Forwarding x-vercel-ip-* looked right and failed in production: this
      // is a fetch from one Vercel function to another, and the edge rewrites
      // those headers on every request it handles — including this one — with
      // the geo of whatever made it. That is the datacenter, so lead search
      // resolved to Ashburn, Virginia for every user regardless of where they
      // actually were. Same mechanism that makes the headers unspoofable.
      if (!args.location && ctx.callerCity) p.set('location', ctx.callerCity);
      // Coordinates travel with the city. The inner /api/leads request is a
      // new edge hop, so its IP headers are the datacenter, not the visitor.
      if (!args.location && ctx.callerLat != null && ctx.callerLng != null) {
        p.set('lat', String(ctx.callerLat));
        p.set('lng', String(ctx.callerLng));
      }
      // "leads", "businesses", "prospects" are not trades. The model passes
      // them straight through from phrasing like "leads in my area", which
      // searched Places for companies literally named that and returned
      // "LeadsNearby". Fall through to the default trade rotation instead.
      const NOT_A_TRADE = /^(leads?|businesses|business|companies|company|prospects?|clients?|customers?|places?|people|any(thing)?|stuff|multiple\s+\w+|various\s*\w*|all\s*\w*|trades?|services?|local\s+\w+|website(\s+clients?)?|voice(\s+agents?)?(\s+clients?)?|ai\s+receptionist|receptionist(\s+clients?)?)$/i;
      const tradeRaw = String(args.query || '').trim();
      // "website clients" is a solution, not a trade. Searching Places for
      // that string returns businesses named that, and it also skips the
      // no-website partition below, which only runs when no trade was named.
      const trade = tradeRaw && !NOT_A_TRADE.test(tradeRaw) ? tradeRaw : '';
      if (args.solution === 'website') args = { ...args, needsWebsite: true };
      if (trade) p.set('search', trade);
      // No trade named for a voice-agent ask. The default blend is full of
      // shops that answer the phone, so start on a trade where the gap shows.
      if (args.solution === 'voice' && !trade) p.set('search', 'plumber');
      if (args.location) p.set('location', args.location);
      if (args.minDeal) p.set('minDeal', String(args.minDeal));
      p.set('limit', '20');   // Places caps here; the API sorts by closability

      const r = await fetch(`${base}/api/leads?${p}`, { headers, signal: AbortSignal.timeout(25000) });
      const j = await r.json();

      // Asked for no-website businesses without naming a trade, use the
      // partition the leads endpoint already builds — it runs a targeted hunt
      // across the trades that actually contain them. Filtering the default
      // blend instead reported "all 20 already have a website", which is true
      // of that sample and false of the request.
      if (args.needsWebsite && !trade && Array.isArray(j?.noWebsiteLeads) && j.noWebsiteLeads.length) {
        j.leads = j.noWebsiteLeads;
      }

      // Businesses with no website are roughly one in ten, so filtering a
      // single 20-result page leaves one or two. Page once more when the
      // caller asked for them — Places returns a nextPageToken, and this only
      // runs for that filter so the common query costs nothing extra.
      if (args.needsWebsite && j?._meta?.nextPageToken) {
        try {
          const p2 = new URLSearchParams(p);
          p2.set('pageToken', j._meta.nextPageToken);
          const r2 = await fetch(`${base}/api/leads?${p2}`, { headers, signal: AbortSignal.timeout(15000) });
          const j2 = await r2.json();
          if (Array.isArray(j2?.leads)) {
            const seen = new Set((j.leads || []).map(l => l._placeId));
            j.leads = [...(j.leads || []), ...j2.leads.filter(l => !seen.has(l._placeId))];
          }
        } catch { /* one page is still an answer */ }
      }

      const activelyTrading = (l) => l.activity?.level === 'active';
      const voiceFit = (l) => !!l.receptionist?.qualified;

      // Voice-agent clients are the ones still taking jobs whose published
      // hours leave 40+ hours a week with nobody answering. A general blend
      // is mostly shops that pick up, so when no trade was named we go and
      // pull the emergency trades where that gap actually shows up.
      if (args.solution === 'voice') {
        const pool = [];
        const seen = new Set();
        const take = (list) => {
          for (const l of list || []) {
            const id = l._placeId || l.company;
            if (!id || seen.has(id)) continue;
            seen.add(id);
            pool.push(l);
          }
        };
        take(j.leads);
        take(j.noWebsiteLeads);
        if (!trade) {
          // Higher-end practices are part of the search, not a fallback. A
          // plumber page that already fills the list used to end the hunt,
          // so dentists and law firms never got pulled.
          const extraTrades = ['dentist', 'law firm'];
          if (pool.filter(l => voiceFit(l) && activelyTrading(l)).length < 6) {
            extraTrades.push('hvac', 'electrician');
          }
          const extras = await Promise.all(extraTrades.map(async (t) => {
            try {
              const p2 = new URLSearchParams(p);
              p2.set('search', t);
              p2.delete('pageToken');
              const r2 = await fetch(`${base}/api/leads?${p2}`, { headers, signal: AbortSignal.timeout(18000) });
              return r2.ok ? await r2.json() : null;
            } catch { return null; }
          }));
          for (const page of extras) {
            if (page?._meta?.resolvedLocation) {
              j._meta = { ...(j._meta || {}), resolvedLocation: j._meta?.resolvedLocation || page._meta.resolvedLocation, dataType: j._meta?.dataType || page._meta.dataType };
            }
            take(page?.leads);
            take(page?.noWebsiteLeads);
          }
        }
        const active = pool.filter(l => voiceFit(l) && activelyTrading(l));
        const chosen = active.length >= 3 ? active : pool.filter(voiceFit);
        chosen.sort((a, b) => {
          const gap = (b.receptionist?.uncoveredHoursPerWeek || 0) - (a.receptionist?.uncoveredHoursPerWeek || 0);
          if (activelyTrading(a) !== activelyTrading(b)) return activelyTrading(b) ? 1 : -1;
          return gap || (b.score || 0) - (a.score || 0);
        });
        j.leads = chosen;
        j._voiceActiveOnly = active.length >= 3 && chosen.every(activelyTrading);
      } else if (args.needsWebsite) {
        j.leads = [...(j.leads || [])].sort((a, b) => {
          if (activelyTrading(a) !== activelyTrading(b)) return activelyTrading(b) ? 1 : -1;
          return (b.score || 0) - (a.score || 0);
        });
      }

      const slice = (j.leads || []).slice(0, args.solution === 'voice' ? 12 : args.needsWebsite ? 40 : 12);
      // Hand back a compact, decision-useful slice. Sending whole records burns
      // context and buries the fields that matter on a call.
      return {
        source: j._meta?.dataType,
        // Null rather than a placeholder string — the renderer title-cases
        // this and was printing "in Caller Location".
        locationUsed: j._meta?.resolvedLocation || args.location || null,
        count: slice.length,
        voiceActiveOnly: j._voiceActiveOnly || false,
        note: args.solution === 'voice'
          ? (slice.length
            ? undefined
            : 'No voice-agent fit. None of these businesses are both still trading and unreachable 40 or more hours a week.')
          : (slice.some(l => (l.placeGaps || []).length)
            ? undefined
            : 'None of these show an obvious gap — they all have sites and solid reviews. '
              + 'Say so honestly and pitch missed-call recovery rather than implying they are weak.'),
        leads: slice.map(l => ({
          // Carried so the chat can link each result to its lead page. Without
          // it the assistant could name a business but never point at it, and
          // the operator had to go and find it by hand on the Leads page.
          placeId: l._placeId || null,
          // Pricing inputs — the chat quotes per business rather than a flat rate.
          revenueEstimate: l.revenueEstimate || null,
          ticketRange: l.ticketRange || null,
          company: l.company,
          location: l.location,
          phone: l.phone,
          website: l.website || null,
          rating: l.rating ?? null,
          reviews: l.reviewCount ?? null,
          employees: l.employees ?? null,
          score: l.score,
          receptionist: l.receptionist?.qualified
            ? { qualified: true, uncoveredHoursPerWeek: l.receptionist.uncoveredHoursPerWeek ?? null }
            : null,
          activity: l.activity?.level
            ? { level: l.activity.level, label: l.activity.label || null }
            : null,
          // An empty array left the model to editorialise — it wrote "no gaps"
          // and "No website issues" while still recommending the business.
          // Say what the absence means so it has something true to repeat.
          gaps: (l.placeGaps || []).length
            ? (l.placeGaps || []).map(g => g.label)
            : ['none found — established operator, open on missed calls instead'],
          closability: l.score >= 75 ? 'high' : l.score >= 55 ? 'medium' : 'low',
        })),
      };
    }

    if (name === 'find_contact') {
      const host = String(args.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
      // Same trap as audit_website: asked "what should I say on a cold call",
      // the model picked a business out of the air and looked up its contacts,
      // answering about a company the user never mentioned.
      if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host)
          || /\b(example|placeholder|their|the site|unknown)\b/i.test(host)) {
        return {
          ok: false,
          reason: 'no-real-domain',
          instruction: 'No specific business was named. Answer the question generally, '
            + 'from what you know about cold-calling local service businesses. '
            + 'Do not invent a company to illustrate it.',
        };
      }
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
      // The model reaches for this on advice questions and passes a
      // placeholder — "roofer's website (if any)", or nothing at all. The audit
      // then failed and its error became the whole answer: asked how to handle
      // a price objection, the assistant replied "No website provided."
      // Refuse here and tell it to answer from its own knowledge instead.
      const url = String(args.url || '').trim();
      const looksReal = /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(url)
        && !/\b(if any|similar|example|placeholder|their|the (site|website)|n\/?a|unknown)\b/i.test(url);
      if (!looksReal) {
        return {
          ok: false,
          reason: 'no-real-url',
          instruction: 'No specific website was named, so there is nothing to audit. '
            + 'Answer the question directly from what you know about the product. '
            + 'Do not mention the missing URL.',
        };
      }

      const r = await fetch(`${base}/api/audit`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
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
