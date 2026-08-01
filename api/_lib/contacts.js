// =============================================================================
// GOATED — Person-level contact extraction from a prospect's own website
// -----------------------------------------------------------------------------
// Apollo's person endpoints (mixed_people/search, people/match, bulk_match) are
// all 403 on the Free plan — verified, not assumed. So individual names and
// direct numbers cannot come from there.
//
// For a 3–25 person local service business the better source is the business's
// own site: owner-operated shops routinely publish "Meet the owner", a team
// page, direct mobiles and named email addresses. That is public information the
// business chose to publish, it costs nothing, and it has no rate limit.
//
// Everything in `people`, `phones` and `emails` is quoted verbatim from the
// page — if it isn't published, the field comes back empty. The one exception is
// `probableNames`, which reads a first name off a named inbox
// (kevin@company.com → "Kevin"); those entries carry inferred:true so the UI can
// hedge them. Nothing else is derived and nothing is generated.
//
// This module is NOT a serverless function (underscore prefix = excluded).
// =============================================================================

// A real browser UA. Verified difference: from a datacenter IP (Vercel), a
// self-identifying bot string gets refused instantly by WAFs that serve the same
// page fine to a residential IP — bluefrogfranchise.com was reachable locally and
// "unreachable" in production with the bot UA. Some sites will still block
// datacenter ranges whatever the UA; extractContacts reports that honestly via
// `reason` rather than pretending the business published nothing.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** Pages most likely to name a human, in priority order. */
const CONTACT_PATHS = ['', '/contact', '/contact-us', '/about', '/about-us', '/team', '/our-team', '/staff'];

async function fetchPage(url, timeoutMs = 2500) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return null;
    // Cap at 400KB — enough for any small-business page, bounded for a lambda.
    const text = await r.text();
    return text.slice(0, 400_000);
  } catch {
    return null;
  }
}

const strip = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ');

// ─── Field extractors ───────────────────────────────────────────────────────

/** North American numbers in any common format, normalised to E.164. */
function extractPhones(html) {
  const out = new Map();
  // tel: links are the highest-confidence signal — the business marked it up.
  for (const m of html.matchAll(/href=["']tel:([^"']+)["']/gi)) {
    const digits = m[1].replace(/[^\d+]/g, '');
    const e164 = normalisePhone(digits);
    if (e164) out.set(e164, 'tel: link');
  }
  const text = strip(html);
  for (const m of text.matchAll(/(?:\+?1[\s.-]?)?\(?([2-9]\d{2})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})\b/g)) {
    const e164 = normalisePhone(`${m[1]}${m[2]}${m[3]}`);
    if (e164 && !out.has(e164)) out.set(e164, 'page text');
  }
  return [...out].map(([number, source]) => ({ number, source }));
}

function normalisePhone(raw) {
  const d = raw.replace(/[^\d]/g, '');
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith('1')) return `+${d}`;
  return null;
}

/** Named inboxes are worth far more than info@ — rank accordingly. */
const ROLE_INBOXES = /^(info|contact|hello|sales|support|admin|office|help|team|enquiries|inquiries|service|billing|noreply|no-reply)@/i;

function extractEmails(html) {
  const found = new Set();
  for (const m of html.matchAll(/href=["']mailto:([^"'?]+)/gi)) found.add(m[1].trim().toLowerCase());
  for (const m of strip(html).matchAll(/\b[\w.+-]+@[\w-]+\.[\w.-]{2,}\b/g)) found.add(m[0].toLowerCase());
  return [...found]
    .filter(e => !/\.(png|jpe?g|gif|svg|webp|css|js)$/i.test(e))
    .filter(e => !/^[0-9a-f]{16,}@/i.test(e)) // tracking-hash addresses
    .map(email => ({ email, isRoleAccount: ROLE_INBOXES.test(email) }))
    .sort((a, b) => Number(a.isRoleAccount) - Number(b.isRoleAccount));
}

// Titles that indicate a decision-maker at an owner-operated business.
const DECISION_TITLES = [
  'owner', 'co-owner', 'founder', 'co-founder', 'president', 'principal',
  'ceo', 'general manager', 'gm', 'operations manager', 'office manager',
  'managing partner', 'partner', 'director', 'proprietor', 'vice president',
];

// Words that look like a given name to a regex but never are. Real failures
// from live sites: "Meet Kevin — President", "Research Bluefrog — Owner",
// "Home Own — Owner". Marketing copy and nav labels are the main source.
const NOT_A_FIRST_NAME = new Set([
  'meet', 'our', 'about', 'contact', 'call', 'email', 'team', 'the', 'your', 'my',
  'home', 'research', 'learn', 'read', 'view', 'click', 'get', 'free', 'book',
  'schedule', 'request', 'find', 'why', 'how', 'what', 'who', 'welcome', 'hello',
  'new', 'best', 'top', 'local', 'trusted', 'licensed', 'certified', 'family',
  'owned', 'operated', 'service', 'services', 'quality', 'expert', 'professional',
  'emergency', 'same', 'next', 'more', 'all', 'every', 'we', 'us', 'you',
]);

// Second token that means we matched "Surname City" rather than a person.
// e.g. "Alsobrooks Austin", "Ruiz Houston" — both real false positives.
const NOT_A_SURNAME = new Set([
  'austin', 'houston', 'dallas', 'plano', 'frisco', 'irving', 'carrollton',
  'katy', 'richardson', 'roanoke', 'texas', 'america', 'usa', 'inc', 'llc',
  'ltd', 'co', 'company', 'group', 'own', 'owner', 'today', 'now', 'here',
  'online', 'near', 'plumbing', 'heating', 'cooling', 'air', 'mechanical',
  'electric', 'roofing', 'dental', 'headquarters', 'franchise',
]);

/**
 * Find "Name — Title" / "Title: Name" pairs near decision-maker titles.
 * Conservative on purpose: a wrong name on a cold call is worse than none, so
 * anything ambiguous is dropped rather than guessed.
 */
function extractPeople(html) {
  const text = strip(html);
  const people = new Map();
  const NAME = '([A-Z][a-z\'’-]{1,20}(?:\\s+[A-Z]\\.?)?\\s+[A-Z][a-z\'’-]{1,25})';

  for (const title of DECISION_TITLES) {
    const t = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`${NAME}\\s*[,–—\\-|]\\s*(${t})\\b`, 'gi'),   // Jane Smith — Owner
      new RegExp(`\\b(${t})\\s*[:–—\\-|]\\s*${NAME}`, 'gi'),    // Owner: Jane Smith
      new RegExp(`\\b(${t})\\s+${NAME}`, 'gi'),                  // Owner Jane Smith
    ];
    for (const re of patterns) {
      for (const m of text.matchAll(re)) {
        // Group order flips between the patterns; pick whichever looks like a name.
        const a = m[1] || '', b = m[2] || '';
        let name = /^[A-Z][a-z]/.test(a) && !new RegExp(`^${t}$`, 'i').test(a) ? a : b;
        if (!name) continue;

        // Drop a leading filler word: "Meet Kevin Smith" → "Kevin Smith".
        let parts = name.trim().split(/\s+/);
        while (parts.length > 2 && NOT_A_FIRST_NAME.has(parts[0].toLowerCase())) parts.shift();
        if (parts.length < 2) continue;

        const [first, last] = [parts[0], parts[parts.length - 1]];
        if (NOT_A_FIRST_NAME.has(first.toLowerCase())) continue;
        if (NOT_A_SURNAME.has(last.toLowerCase())) continue;
        // A business name caught by the name pattern.
        if (/\b(LLC|Inc|Ltd|Co|Company|Services|Heating|Cooling|Plumbing|Air|Mechanical|Electric)\b/i.test(name)) continue;
        // Both tokens must be plausibly name-shaped.
        if (!/^[A-Z][a-z'’-]{1,20}$/.test(first)) continue;
        if (!/^[A-Z][a-z'’-]{1,25}$/.test(last)) continue;

        name = parts.join(' ');
        const key = name.toLowerCase();
        if (!people.has(key)) {
          const pretty = /^(ceo|gm)$/i.test(title)
            ? title.toUpperCase()
            : title.replace(/\b\w/g, c => c.toUpperCase());
          people.set(key, { name, title: pretty });
        }
      }
    }
  }
  return [...people.values()].slice(0, 6);
}

function extractSocials(html) {
  const out = {};
  const grab = (host, key) => {
    const m = html.match(new RegExp(`https?://(?:www\\.)?${host}/[A-Za-z0-9_./-]{2,60}`, 'i'));
    if (m) out[key] = m[0];
  };
  grab('facebook\\.com', 'facebook');
  grab('instagram\\.com', 'instagram');
  grab('linkedin\\.com/in', 'linkedinPerson');
  grab('x\\.com|twitter\\.com', 'twitter');
  return out;
}

/**
 * Crawl a prospect's site for reachable humans.
 *
 * @param {string} website
 * @returns {Promise<object>} contacts, with `pagesFetched` so the caller can
 *   tell "nothing published" apart from "site unreachable".
 */
export async function extractContacts(website, companyHint = '') {
  if (!website) return { ok: false, reason: 'no website on record' };

  let base;
  try {
    base = new URL(website.startsWith('http') ? website : `https://${website}`);
  } catch {
    return { ok: false, reason: 'unparseable website URL' };
  }

  const phones = new Map();
  const emails = new Map();
  const people = new Map();
  let socials = {};
  const pagesFetched = [];

  // Vercel Hobby kills the function at 10s. Walking 8 paths sequentially at the
  // old 8s-per-page timeout could reach 64s, so a slow prospect site would have
  // timed out with nothing to show. Budget the whole crawl and stop early —
  // fewer pages read beats a dead request.
  const startedAt = Date.now();
  const CRAWL_BUDGET_MS = 7000;
  let ranOutOfTime = false;

  for (const path of CONTACT_PATHS) {
    if (Date.now() - startedAt > CRAWL_BUDGET_MS) { ranOutOfTime = true; break; }
    const url = `${base.origin}${path}`;
    const html = await fetchPage(url);
    if (!html) continue;
    pagesFetched.push(path || '/');

    for (const p of extractPhones(html)) if (!phones.has(p.number)) phones.set(p.number, p);
    for (const e of extractEmails(html)) if (!emails.has(e.email)) emails.set(e.email, e);
    for (const p of extractPeople(html)) if (!people.has(p.name.toLowerCase())) people.set(p.name.toLowerCase(), p);
    socials = { ...extractSocials(html), ...socials };

    // Two named humans is plenty for a cold call; stop crawling.
    if (people.size >= 2 && phones.size >= 1) break;
  }

  if (!pagesFetched.length) return { ok: false, reason: 'site unreachable or blocked' };

  const emailList = [...emails.values()];
  const direct = emailList.filter(e => !e.isRoleAccount);

  // A named inbox names a human even when the page doesn't. Sites often say
  // "Meet Kevin" with no surname — correctly rejected above, since we can't
  // confirm one — while kevin@company.com is sitting right there. Surfacing the
  // local part as a *probable* first name is honest and immediately useful on a
  // call ("is Kevin around?"). Flagged as inferred so the UI can hedge it.
  //
  // The inference has to reject the business's own name. A local business
  // mailbox is usually the brand — theonelandscape@gmail.com — and calling that
  // a probable first name put "Hi Theonelandscape" in front of the operator,
  // which is worse than surfacing nothing.
  const brandTokens = new Set(
    `${companyHint} ${base.hostname}`
      .toLowerCase()
      .replace(/\.(com|net|org|co|us|biz|info|io)\b/g, ' ')
      .split(/[^a-z]+/)
      .filter(t => t.length >= 3)
  );
  // Real first names run about 2-12 characters. Anything longer is a brand,
  // a compound, or a phrase.
  const looksLikeBrand = (local) => {
    if (brandTokens.has(local)) return true;
    for (const t of brandTokens) {
      if (t.length >= 4 && (local.includes(t) || t.includes(local))) return true;
    }
    return false;
  };

  const probableNames = [];
  for (const { email } of direct) {
    const local = email.split('@')[0].toLowerCase();
    if (!/^[a-z]{2,12}$/.test(local)) continue;           // skip first.last, k.smith, ops2
    if (NOT_A_FIRST_NAME.has(local)) continue;
    if (looksLikeBrand(local)) continue;                  // it's the business, not a person
    const pretty = local[0].toUpperCase() + local.slice(1);
    // Don't repeat someone already found by name on the page.
    if ([...people.values()].some(p => p.name.toLowerCase().startsWith(local))) continue;
    probableNames.push({ firstName: pretty, evidence: email, inferred: true });
  }

  return {
    ok: true,
    pagesFetched,
    // True when we stopped for time rather than because we ran out of pages —
    // the operator should know the result may be incomplete.
    partial: ranOutOfTime,
    people: [...people.values()],
    probableNames,
    phones: [...phones.values()],
    emails: emailList,
    directEmails: direct,
    socials,
    // Honest summary for the UI.
    summary: {
      namedPeople: people.size,
      probableFirstNames: probableNames.length,
      phoneNumbers: phones.size,
      directEmails: direct.length,
      // True when we have a confirmed name OR a strong first-name signal.
      hasDecisionMaker: people.size > 0 || probableNames.length > 0,
    },
  };
}
