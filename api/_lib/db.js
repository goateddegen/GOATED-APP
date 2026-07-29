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
