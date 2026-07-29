#!/usr/bin/env node
// Did a Google sign-in land? Reads auth.users + profiles + recent auth errors.
import fs from 'node:fs';
const env = {};
for (const l of fs.readFileSync('.env.local','utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const U = env.VITE_SUPABASE_URL, S = env.SUPABASE_SECRET_KEY, PAT = env.SUPABASE_ACCESS_TOKEN;
const h = { apikey: S, Authorization: `Bearer ${S}` };

const users = await fetch(`${U}/auth/v1/admin/users?per_page=20`, { headers: h }).then(r => r.json());
const google = (users.users || []).filter(u => u.app_metadata?.provider === 'google');
console.log(`\nauth.users: ${(users.users || []).length} total, ${google.length} via Google`);
for (const u of users.users || []) console.log(`  ${u.email}  [${u.app_metadata?.provider}]`);

const profs = await fetch(`${U}/rest/v1/profiles?select=email,provider`, { headers: h }).then(r => r.json());
console.log(`profiles: ${Array.isArray(profs) ? profs.length : 0} row(s)`);

if (PAT) {
  const start = new Date(Date.now() - 30 * 60e3).toISOString();
  const r = await fetch(`https://api.supabase.com/v1/projects/kiilohygkifagmhyfsgb/analytics/endpoints/logs.all`
    + `?sql=${encodeURIComponent('select timestamp, event_message from auth_logs order by timestamp desc limit 100')}`
    + `&iso_timestamp_start=${start}&iso_timestamp_end=${new Date().toISOString()}`,
    { headers: { Authorization: `Bearer ${PAT}` } }).then(x => x.json());
  const errs = (r.result || []).filter(x => /invalid_client|invalid_grant|Unable to exchange/.test(x.event_message || ''));
  console.log(`auth errors in last 30min: ${errs.length}`);
  errs.slice(0, 2).forEach(e => console.log('  ' + (e.event_message || '').replace(/\s+/g, ' ').slice(0, 200)));
}
console.log(google.length ? '\n✓ Google sign-in landed.\n' : '\n… no Google user yet.\n');
