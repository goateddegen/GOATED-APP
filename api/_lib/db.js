// =============================================================================
// GOATED — Server-side Supabase access
// -----------------------------------------------------------------------------
// Uses the SECRET key, which bypasses row-level security. That is correct for a
// serverless route but means every query here must scope by owner_id itself —
// RLS is not a safety net on this path.
//
// This module is NOT a serverless function (underscore prefix = excluded).
// =============================================================================

const URL_BASE = () => (process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SECRET = () =>
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const dbConfigured = () => !!(URL_BASE() && SECRET());

async function rest(path, opts = {}) {
  const key = SECRET();
  const r = await fetch(`${URL_BASE()}/rest/v1${path}`, {
    ...opts,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    signal: AbortSignal.timeout(12000),
  });
  const text = await r.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!r.ok) {
    const err = new Error(`Supabase ${r.status}: ${typeof body === 'string' ? body.slice(0, 200) : JSON.stringify(body).slice(0, 200)}`);
    err.status = r.status;
    throw err;
  }
  return body;
}

/**
 * Resolve the caller's user id from their Supabase access token.
 * Returns null for anonymous callers — never throws, so an expired token
 * degrades to "not signed in" rather than failing the whole request.
 */
export async function userFromRequest(req) {
  const raw = req.headers?.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
  if (!token || !URL_BASE()) return null;
  try {
    const r = await fetch(`${URL_BASE()}/auth/v1/user`, {
      headers: { apikey: SECRET(), Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const u = await r.json();
    return u?.id ? { id: u.id, email: u.email } : null;
  } catch {
    return null;
  }
}

// ─── Leads ──────────────────────────────────────────────────────────────────

/**
 * A Google Maps search URL for a business we have a name (and ideally an
 * address) for. Used when no canonical listing URL was captured, so the
 * "view the listing" action always works instead of silently disappearing.
 */
function mapsSearchUrl(company, location) {
  if (!company) return null;
  const q = [company, location].filter(Boolean).join(' ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Map our in-memory lead shape onto the leads table columns. */
function toRow(lead, ownerId) {
  return {
    owner_id: ownerId,
    external_id: lead._apolloId || lead.external_id || null,
    name: lead.name || null,
    company: lead.company || null,
    email: lead.email || null,
    phone: lead.phone || null,
    title: lead.title || null,
    industry: lead.industry || null,
    location: lead.location || null,
    website: lead.website || null,
    linkedin_url: lead.linkedin_url || null,
    employees: lead.employees ?? null,
    revenue: lead.revenue ?? null,
    score: typeof lead.score === 'number' ? Math.max(0, Math.min(100, Math.round(lead.score))) : null,
    priority: lead.priority || null,
    status: lead.status || 'new',
    deal_value: lead.dealValue ?? null,
    source: lead.lead_source || lead._source || null,
    tags: Array.isArray(lead.tags) ? lead.tags : null,
    // Everything the columns don't cover, kept so the UI keeps its richer view.
    metadata: {
      keywords: lead.keywords || [],
      buyingSignals: lead.buyingSignals || [],
      revenueFormatted: lead.revenueFormatted || null,
      foundedYear: lead.foundedYear || null,
      momentum: lead.momentum || null,
      address: lead.address || null,
      domain: lead.domain || null,
      logo: lead.logo || null,
      contactAvailable: lead.contactAvailable ?? null,
      mapsUrl: lead.mapsUrl || null,
      rating: lead.rating ?? null,
      reviewCount: lead.reviewCount ?? null,
      photoRef: lead.photoRef || null,
      photoCount: lead.photoCount ?? null,
      placeGaps: lead.placeGaps || [],
      painPoints: lead.painPoints || [],
      bestMethod: lead.bestMethod || null,
    },
  };
}

/** Turn a stored row back into the shape the UI already understands. */
function fromRow(row) {
  const m = row.metadata || {};
  return {
    id: row.id,
    external_id: row.external_id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    title: row.title,
    industry: row.industry || 'Unknown',
    location: row.location,
    website: row.website,
    linkedin_url: row.linkedin_url,
    employees: row.employees,
    revenue: row.revenue,
    score: row.score,
    priority: row.priority,
    status: row.status,
    value: row.deal_value != null ? Number(row.deal_value) : null,
    dealValue: row.deal_value != null ? Number(row.deal_value) : null,
    lead_source: row.source,
    tags: row.tags || [],
    created_at: row.created_at,
    last_activity: row.last_activity,
    keywords: m.keywords || [],
    buyingSignals: m.buyingSignals || [],
    revenueFormatted: m.revenueFormatted || null,
    foundedYear: m.foundedYear || null,
    momentum: m.momentum || 'stable',
    address: m.address || null,
    domain: m.domain || null,
    logo: m.logo || null,
    contactAvailable: m.contactAvailable ?? false,
    // Fall back to a Maps search for the business when no listing URL was
    // stored — leads saved before this field existed, or sourced from Apollo.
    // The link should resolve on every lead, not only freshly-fetched ones.
    mapsUrl: m.mapsUrl || mapsSearchUrl(row.company || row.name, m.address || row.location),
    rating: m.rating ?? null,
    reviewCount: m.reviewCount ?? null,
    photoRef: m.photoRef || null,
    photoCount: m.photoCount ?? null,
    placeGaps: m.placeGaps || [],
    painPoints: m.painPoints || [],
    bestMethod: m.bestMethod || null,
    _source: 'supabase',
  };
}

/**
 * Persist a batch of leads for one operator.
 * Conflict target is (owner_id, external_id) so re-running a search refreshes
 * the record rather than duplicating it. Returns the number written, or 0 if
 * persistence isn't available — callers should treat this as best-effort and
 * never fail the user's request because of it.
 */
export async function saveLeads(leads, ownerId) {
  if (!dbConfigured() || !ownerId || !leads?.length) return 0;
  const rows = leads.map(l => toRow(l, ownerId)).filter(r => r.external_id);
  if (!rows.length) return 0;
  await rest('/leads?on_conflict=owner_id,external_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  return rows.length;
}

/** Read an operator's stored leads, newest scores first. */
export async function loadLeads(ownerId, { limit = 50, offset = 0, search = '', industry = '' } = {}) {
  if (!dbConfigured() || !ownerId) return null;
  const params = new URLSearchParams({
    select: '*',
    owner_id: `eq.${ownerId}`,
    order: 'score.desc.nullslast',
    limit: String(limit),
    offset: String(offset),
  });
  if (industry) params.set('industry', `ilike.*${industry}*`);
  if (search) params.set('or', `(company.ilike.*${search}*,name.ilike.*${search}*)`);
  const rows = await rest(`/leads?${params}`, {
    headers: { Prefer: 'count=exact' },
  });
  return Array.isArray(rows) ? rows.map(fromRow) : [];
}

/** How many leads this operator has stored. */
export async function countLeads(ownerId) {
  if (!dbConfigured() || !ownerId) return 0;
  const r = await fetch(`${URL_BASE()}/rest/v1/leads?select=id&owner_id=eq.${ownerId}`, {
    method: 'HEAD',
    headers: {
      apikey: SECRET(),
      Authorization: `Bearer ${SECRET()}`,
      Prefer: 'count=exact',
      Range: '0-0',
    },
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  const cr = r?.headers?.get('content-range') || '';
  const total = cr.split('/')[1];
  return total && total !== '*' ? Number(total) : 0;
}

// ─── Saved audits ───────────────────────────────────────────────────────────

/**
 * Short, URL-safe, unguessable share id. 10 chars of base32 ≈ 50 bits, which
 * is far more than enough to make the audits table non-enumerable while still
 * fitting in a link you can read out over the phone.
 */
function makeShareId() {
  const alphabet = '23456789abcdefghjkmnpqrstuvwxyz'; // no 0/1/i/l/o — misread aloud
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}

/**
 * Persist a completed audit and return its share id.
 *
 * Best-effort by design: a storage failure must never turn a successful audit
 * into an error for the visitor, so this returns null instead of throwing.
 * Degraded (rule-based) audits are not saved — a permalink should not pin the
 * fallback report in place, same reasoning as the in-memory cache.
 */
function monthlyLoss(payload) {
  const n = Number(payload?.analysis?.revenueLoss?.monthlyLowEstimate);
  // The LLM occasionally returns an absurd figure. Clamped rather than trusted,
  // because this column is what the inbound queue sorts on.
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(Math.round(n), 100_000_000);
}

export async function saveAudit(payload, ownerId = null) {
  if (!dbConfigured() || !payload?.ok || payload.degraded) return null;
  const shareId = makeShareId();
  let host = null;
  try { host = new URL(payload.url).hostname.replace(/^www\./, ''); } catch { /* keep null */ }
  try {
    await rest('/audits', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        share_id: shareId,
        url: payload.url,
        host,
        owner_id: ownerId,
        monthly_loss: monthlyLoss(payload),
        payload,
      }),
    });
    return shareId;
  } catch {
    return null;
  }
}

/**
 * Read a saved audit by share id. Returns the stored payload, or null when the
 * id is unknown — callers should treat null as "this link is dead", not as an
 * outage.
 */
export async function loadAudit(shareId) {
  if (!dbConfigured() || !shareId) return null;
  try {
    const rows = await rest(`/audits?select=payload,created_at,views&share_id=eq.${encodeURIComponent(shareId)}&limit=1`);
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row?.payload) return null;
    // Fire-and-forget view counter: knowing a prospect opened the report is the
    // whole point of sending one, but nobody should wait on the write.
    rest(`/audits?share_id=eq.${encodeURIComponent(shareId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ views: (row.views ?? 0) + 1 }),
    }).catch(() => {});
    return { ...row.payload, savedAt: row.created_at };
  } catch {
    return null;
  }
}

/**
 * Attach a contact to a saved audit — the inbound-lead capture.
 *
 * Keyed on share_id rather than an id we hand the client, so a visitor can only
 * write against an audit they actually ran. Returns true on success; callers
 * should still thank the visitor if it fails, because the report is the thing
 * they came for.
 */
export async function claimAudit(shareId, { email, name, phone } = {}) {
  if (!dbConfigured() || !shareId || !email) return false;
  try {
    await rest(`/audits?share_id=eq.${encodeURIComponent(shareId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        lead_email: String(email).slice(0, 200),
        lead_name: name ? String(name).slice(0, 120) : null,
        lead_phone: phone ? String(phone).slice(0, 40) : null,
        claimed_at: new Date().toISOString(),
      }),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Inbound audits that left a contact, newest first. Operator-facing — the
 * caller is responsible for checking that the requester is an admin.
 */
export async function loadInboundAudits({ limit = 50 } = {}) {
  if (!dbConfigured()) return [];
  try {
    const rows = await rest(
      '/audits?select=share_id,url,host,monthly_loss,views,lead_email,lead_name,lead_phone,claimed_at,created_at' +
      `&lead_email=not.is.null&order=claimed_at.desc&limit=${Math.min(limit, 200)}`,
    );
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}
