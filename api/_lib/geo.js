// Where the request actually came from.
//
// On Vercel the edge sets x-vercel-ip-* from the visitor's address before the
// function runs. A function-to-function fetch does not keep those headers —
// the edge rewrites them to the datacenter — so chat resolves geo once and
// passes the city and coordinates as query params.
//
// When the edge headers are missing (local dev), look the public IP up.
// Private and loopback addresses are left unresolved rather than guessed.

const PRIVATE_IP = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|0\.0\.0\.0|::1$|fc|fd)/i;
const cache = new Map();

function decodeHdr(v) {
  if (!v) return '';
  try { return decodeURIComponent(String(v)).trim(); } catch { return String(v).trim(); }
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function clientIp(req) {
  const xff = req.headers?.['x-forwarded-for'];
  const raw = (typeof xff === 'string' ? xff.split(',')[0] : '')
    || req.socket?.remoteAddress
    || '';
  return String(raw).trim().replace(/^::ffff:/, '');
}

function labelFor({ city, region, country }) {
  if (!city) return '';
  if (country === 'US' && region) return `${city} ${region}`;
  return [city, region, country && country !== 'US' ? country : ''].filter(Boolean).join(', ');
}

function pack({ city, region, country, lat, lng, source }) {
  return {
    city: city || '',
    region: region || '',
    country: (country || '').toUpperCase(),
    lat: num(lat),
    lng: num(lng),
    label: labelFor({ city, region, country: (country || '').toUpperCase() }),
    source,
  };
}

export function callerGeoFromHeaders(req) {
  const h = req.headers || {};
  return pack({
    city: decodeHdr(h['x-vercel-ip-city'] || h['cf-ipcity']),
    region: decodeHdr(h['x-vercel-ip-country-region'] || h['cf-region-code'] || h['cf-region']),
    country: h['x-vercel-ip-country'] || h['cf-ipcountry'] || '',
    lat: h['x-vercel-ip-latitude'],
    lng: h['x-vercel-ip-longitude'],
    source: 'edge',
  });
}

/** City, region, and coordinates for this visitor. Never includes the IP. */
export async function callerGeo(req) {
  const edge = callerGeoFromHeaders(req);
  if (edge.city) return edge;

  const ip = clientIp(req);
  if (!ip || PRIVATE_IP.test(ip)) return { ...edge, source: 'none' };
  if (cache.has(ip)) return cache.get(ip);

  let geo = { ...edge, source: 'none' };
  try {
    const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(2000),
    });
    const j = await r.json().catch(() => null);
    if (j?.success && j.city) {
      geo = pack({
        city: j.city,
        region: j.region_code || j.region || '',
        country: j.country_code || '',
        lat: j.latitude,
        lng: j.longitude,
        source: 'ip',
      });
    }
  } catch { /* leave unresolved; Places still runs */ }

  if (cache.size > 200) cache.clear();
  cache.set(ip, geo);
  return geo;
}
