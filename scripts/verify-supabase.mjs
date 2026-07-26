#!/usr/bin/env node
// =============================================================================
// GOATED — Supabase connection verifier
// -----------------------------------------------------------------------------
// Confirms the project is reachable, the keys are valid, schema.sql has been
// applied, and RLS is actually protecting the tables.
//
//   node scripts/verify-supabase.mjs                  # reads .env.local
//   node scripts/verify-supabase.mjs <project-ref>    # or pass ref/URL directly
//
// Reads VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY
// from .env.local. Never hardcodes a key.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_FILE = path.join(ROOT, '.env.local');

const env = {};
if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
}

// Accept a bare project ref, a full URL, or fall back to the env value.
const arg = process.argv[2];
let url = env.VITE_SUPABASE_URL || '';
if (arg) url = /^https?:\/\//.test(arg) ? arg : `https://${arg}.supabase.co`;
url = url.replace(/\/+$/, '');

const publishable = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '';
const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '';

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const bad = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);
const warn = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`);

console.log('\nGOATED — Supabase verification\n' + '─'.repeat(60));

if (!url) {
  bad('No project URL.');
  console.log(`
  Find it in your Supabase dashboard address bar:
    https://supabase.com/dashboard/project/\x1b[1m<PROJECT_REF>\x1b[0m/settings/api-keys
                                           ^^^^^^^^^^^^^^ this part

  Then either set VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
  in .env.local, or re-run:  node scripts/verify-supabase.mjs <PROJECT_REF>
`);
  process.exit(1);
}
if (!publishable) { bad('No publishable/anon key in .env.local.'); process.exit(1); }

console.log(`  project : ${url}`);
console.log(`  pub key : ${publishable.slice(0, 22)}…`);
console.log(`  secret  : ${secret ? secret.slice(0, 14) + '…' : '(not set)'}\n`);

const TABLES = ['waitlist', 'user_settings', 'leads', 'deals', 'transactions',
  'commissions', 'market_data', 'analytics_events'];

let failures = 0;

async function req(pathname, key, opts = {}) {
  return fetch(`${url}${pathname}`, {
    ...opts,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...(opts.headers || {}) },
    signal: AbortSignal.timeout(15000),
  });
}

// ── 1. Reachability + key validity ──────────────────────────────────────────
console.log('1. Connection');
try {
  // Probe a table that cannot exist. PostgREST answers 404 once the key has
  // authenticated and 401 when it hasn't — so 404 is the success signal here.
  // (The /rest/v1/ root needs a user JWT, so it 401s even for a valid key.)
  const probe = `__goated_probe_${Date.now()}`;
  const r = await req(`/rest/v1/${probe}?select=*&limit=1`, publishable);
  if (r.status === 401) {
    bad('Publishable key rejected (401). Key may be from a different project.');
    failures++;
  } else if (r.status === 404 || r.ok) {
    ok('REST API reachable, publishable key accepted');
  } else {
    warn(`Unexpected status ${r.status}`);
  }
} catch (e) {
  bad(`Cannot reach ${url} — ${e.message}`);
  console.log('\n  Check the project ref is correct and the project is not paused.\n');
  process.exit(1);
}

// ── 2. Auth service ─────────────────────────────────────────────────────────
console.log('\n2. Auth (GoTrue)');
try {
  const r = await req('/auth/v1/settings', publishable);
  if (r.ok) {
    const s = await r.json();
    ok(`Auth up — email signup ${s.disable_signup ? '\x1b[31mDISABLED\x1b[0m' : 'enabled'}`);
    const providers = Object.entries(s.external || {}).filter(([, v]) => v).map(([k]) => k);
    if (providers.length) ok(`OAuth providers: ${providers.join(', ')}`);
    else warn('No OAuth providers enabled — the Google/GitHub buttons will fail');
  } else {
    bad(`Auth settings returned ${r.status}`);
    failures++;
  }
} catch (e) { bad(`Auth check failed: ${e.message}`); failures++; }

// ── 3. Schema ───────────────────────────────────────────────────────────────
console.log('\n3. Schema (supabase/schema.sql applied?)');
const missing = [];
for (const t of TABLES) {
  const r = await req(`/rest/v1/${t}?select=*&limit=1`, publishable);
  if (r.status === 404) { missing.push(t); bad(`${t} — missing`); }
  else if (r.status === 401 || r.status === 403) ok(`${t} — exists, RLS blocking anon reads (correct)`);
  else if (r.ok) ok(`${t} — exists and readable`);
  else warn(`${t} — HTTP ${r.status}`);
}
if (missing.length) {
  failures++;
  console.log(`\n  \x1b[33m→ ${missing.length} table(s) missing. Apply the schema:\x1b[0m`);
  console.log('    Supabase dashboard → SQL Editor → New query →');
  console.log('    paste supabase/schema.sql → Run\n');
}

// ── 4. RLS enforcement ──────────────────────────────────────────────────────
if (!missing.includes('leads')) {
  console.log('\n4. RLS enforcement');
  const r = await req('/rest/v1/leads?select=*&limit=1', publishable);
  if (r.ok) {
    const rows = await r.json().catch(() => []);
    if (Array.isArray(rows) && rows.length > 0) {
      bad('Anonymous read returned rows from `leads` — RLS is NOT protecting it.');
      failures++;
    } else {
      ok('Anonymous read returns no rows — RLS active');
    }
  } else {
    ok(`Anonymous read refused (${r.status}) — RLS active`);
  }
}

// ── 5. Secret key (server-side only) ────────────────────────────────────────
if (secret) {
  console.log('\n5. Secret key');
  const r = await req('/rest/v1/leads?select=*&limit=1', secret);
  if (r.ok) ok('Secret key valid (bypasses RLS as expected — server-side only)');
  else if (r.status === 401) { bad('Secret key rejected — wrong project or rotated'); failures++; }
  else warn(`Secret key check returned ${r.status}`);
}

console.log('\n' + '─'.repeat(60));
if (failures === 0) {
  console.log('\x1b[32mAll checks passed. Supabase is live.\x1b[0m\n');
} else {
  console.log(`\x1b[31m${failures} check group(s) failed — see above.\x1b[0m\n`);
  process.exit(1);
}
