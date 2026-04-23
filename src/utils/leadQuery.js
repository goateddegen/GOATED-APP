// ─── GOATED LEAD QUERY ENGINE ──────────────────────────────────────────
// Agentic NLP parser — turns free-text like "SaaS CEOs in Austin $50K+"
// into filters + understood breadcrumbs + a matcher.
//
// Used by LeadsPage and AIOverlay so the AI chat and the leads page
// share identical search semantics.

export const PRIORITIES = ['critical', 'high', 'medium', 'low'];

export function parseAIPrompt(prompt) {
  const text = (prompt || '').toLowerCase();
  const filters = {
    industry: null, status: null, priority: null,
    minScore: 0, maxScore: 100,
    minDeal: 0, maxDeal: Infinity,
    location: null, title: null, source: null,
    momentum: null, search: null, sort: null, order: null,
  };
  const understood = [];

  const industryAliases = {
    'SaaS': ['saas', 'software', 'b2b software', 'cloud'],
    'Fintech': ['fintech', 'finance', 'financial', 'banking', 'payments', 'accounting'],
    'E-commerce': ['ecommerce', 'e-commerce', 'online store', 'retail', 'shop', 'dtc', 'd2c'],
    'Healthcare': ['healthcare', 'health', 'medical', 'dental', 'clinic', 'hospital', 'wellness', 'fitness'],
    'EdTech': ['edtech', 'education', 'learning', 'training', 'academy'],
    'AI/ML': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep tech', 'neural'],
    'MarTech': ['martech', 'marketing', 'agency', 'creative agency', 'digital agency', 'advertising'],
    'Construction': ['construction', 'roofing', 'plumbing', 'hvac', 'electric', 'home service', 'contractor', 'landscaping', 'painting'],
    'PropTech': ['proptech', 'real estate', 'realty', 'property'],
    'InsurTech': ['insurtech', 'insurance'],
    'LegalTech': ['legaltech', 'legal', 'law firm', 'attorney', 'lawyer'],
    'CleanTech': ['cleantech', 'clean energy', 'solar', 'renewable', 'sustainability', 'green energy'],
    'FoodTech': ['foodtech', 'food', 'restaurant', 'catering', 'bakery', 'brewery', 'coffee'],
    'HRTech': ['hrtech', 'hr', 'staffing', 'recruiting', 'talent'],
    'Logistics': ['logistics', 'shipping', 'freight', 'transport', 'supply chain'],
    'SupplyChain': ['manufacturing', 'industrial', 'fabrication'],
    'Media': ['media', 'content', 'production', 'studio', 'publishing'],
    'Gaming': ['gaming', 'game', 'esports'],
    'Web3/Crypto': ['web3', 'crypto', 'blockchain', 'defi', 'dao', 'nft', 'token'],
    'DevTools': ['devtools', 'developer tools', 'dev tools', 'infrastructure'],
    'Cybersecurity': ['cybersecurity', 'security', 'infosec'],
    'IoT': ['iot', 'internet of things', 'connected devices'],
  };
  for (const [ind, aliases] of Object.entries(industryAliases)) {
    for (const alias of aliases) {
      if (text.includes(alias)) { filters.industry = ind; understood.push(`Industry: ${ind}`); break; }
    }
    if (filters.industry) break;
  }

  const statusAliases = {
    'negotiation': ['negotiation', 'negotiating', 'closing', 'close', 'almost closed', 'about to close'],
    'proposal': ['proposal', 'proposed', 'sent proposal'],
    'qualified': ['qualified', 'warm'],
    'contacted': ['contacted', 'reached out', 'outreached'],
    'new': ['new', 'fresh', 'untouched', 'cold'],
    'won': ['won', 'closed won', 'converted', 'customer'],
    'lost': ['lost', 'closed lost', 'dead'],
    'nurturing': ['nurturing', 'nurture', 'drip'],
    're-engaged': ['re-engaged', 'reengaged', 'came back', 'returned'],
    'unresponsive': ['unresponsive', 'ghosted', 'no response', 'silent'],
  };
  for (const [status, aliases] of Object.entries(statusAliases)) {
    for (const alias of aliases) {
      if (text.includes(alias)) { filters.status = status; understood.push(`Status: ${status}`); break; }
    }
    if (filters.status) break;
  }

  for (const p of PRIORITIES) { if (text.includes(p)) { filters.priority = p; understood.push(`Priority: ${p}`); break; } }

  const scorePatterns = [
    /(?:score|rating)\s*(?:>=?|above|over|>)\s*(\d+)/,
    /(\d+)\+?\s*(?:score|rating)/,
    /(?:above|over|min(?:imum)?)\s*(\d+)\s*(?:score|rating)/,
  ];
  for (const pat of scorePatterns) {
    const m = text.match(pat);
    if (m) { filters.minScore = parseInt(m[1]); understood.push(`Score >= ${m[1]}`); break; }
  }

  const dealPatterns = [
    /\$(\d+)\s*k/i,
    /\$(\d+),?(\d{3})/,
    /(\d+)\s*k\s*(?:\+|deal|value)/i,
    /(?:deal|value|worth|pipeline)\s*(?:>=?|above|over|>)\s*\$?(\d+)\s*k?/i,
    /(?:above|over|more than|at least|minimum)\s*\$(\d+)\s*k?/i,
  ];
  for (const pat of dealPatterns) {
    const m = text.match(pat);
    if (m) {
      let v = parseInt(m[1]);
      if (m[2]) v = parseInt(m[1] + m[2]);
      else if (v < 1000) v *= 1000;
      filters.minDeal = v;
      understood.push(`Deal >= $${(v / 1000).toFixed(0)}K`);
      break;
    }
  }

  const cities = [
    'san francisco', 'new york', 'austin', 'chicago', 'seattle', 'miami', 'boston', 'denver',
    'los angeles', 'london', 'toronto', 'berlin', 'singapore', 'sydney', 'tokyo', 'portland',
    'atlanta', 'dallas', 'phoenix', 'nashville', 'raleigh', 'salt lake', 'vancouver', 'dubai',
    'mumbai', 'bangalore', 'seoul', 'amsterdam', 'dublin', 'tel aviv', 'paris', 'stockholm',
    'copenhagen', 'melbourne', 'cape town', 'lagos', 'nairobi',
  ];
  for (const city of cities) { if (text.includes(city)) { filters.location = city; understood.push(`Location: ${city}`); break; } }

  const roles = [
    { kw: ['ceo', 'chief executive', 'c-suite'], val: 'CEO' },
    { kw: ['founder', 'cofounder', 'co-founder'], val: 'Founder' },
    { kw: ['cto', 'chief technology', 'tech lead'], val: 'CTO' },
    { kw: ['cmo', 'chief marketing'], val: 'CMO' },
    { kw: ['cfo', 'chief financial'], val: 'CFO' },
    { kw: ['cro', 'chief revenue'], val: 'CRO' },
    { kw: ['vp', 'vice president'], val: 'VP' },
    { kw: ['director'], val: 'Director' },
    { kw: ['owner', 'owner-operator'], val: 'Owner' },
    { kw: ['manager', 'head of'], val: 'Manager' },
    { kw: ['partner', 'managing partner'], val: 'Partner' },
    { kw: ['marketing director', 'marketing manager', 'marketer'], val: 'Marketing' },
    { kw: ['sales manager', 'head of sales', 'sales lead'], val: 'Sales' },
    { kw: ['operations', 'ops'], val: 'Operations' },
  ];
  for (const r of roles) { for (const kw of r.kw) { if (text.includes(kw)) { filters.title = r.val; understood.push(`Role: ${r.val}`); break; } } if (filters.title) break; }

  if (text.includes('surging') || text.includes('momentum') || text.includes('trending up')) { filters.momentum = 'surging'; understood.push('Momentum: surging'); }
  else if (text.includes('rising') || text.includes('growing')) { filters.momentum = 'rising'; understood.push('Momentum: rising'); }
  else if (text.includes('declining') || text.includes('dropping') || text.includes('falling')) { filters.momentum = 'declining'; understood.push('Momentum: declining'); }

  if (text.includes('hot') || text.includes('best') || text.includes('top') || text.includes('highest score') || text.includes('strongest')) {
    filters.minScore = Math.max(filters.minScore, 80); if (!understood.some(u => u.startsWith('Score'))) understood.push('Score >= 80 (hot leads)');
  }
  if (text.includes('whale') || text.includes('enterprise') || text.includes('big fish') || text.includes('largest')) {
    filters.minDeal = Math.max(filters.minDeal, 50000); if (!understood.some(u => u.startsWith('Deal'))) understood.push('Deal >= $50K (whales)');
    filters.sort = 'dealValue'; filters.order = 'desc';
  }
  if (text.includes('quick win') || text.includes('easy close') || text.includes('low hanging') || text.includes('ready to buy')) {
    filters.minScore = Math.max(filters.minScore, 70);
    if (!filters.status) { filters.status = 'negotiation'; understood.push('Status: negotiation (ready to close)'); }
    if (!understood.some(u => u.startsWith('Score'))) understood.push('Score >= 70 (quick wins)');
  }
  if (text.includes('highest value') || text.includes('biggest deal') || text.includes('most valuable') || text.includes('highest revenue')) {
    filters.sort = 'dealValue'; filters.order = 'desc'; understood.push('Sort: highest deal value');
  }
  if (text.includes('newest') || text.includes('most recent') || text.includes('latest')) {
    filters.sort = 'created_at'; filters.order = 'desc'; understood.push('Sort: newest first');
  }
  if (text.includes('highest score') || text.includes('best score')) {
    filters.sort = 'score'; filters.order = 'desc'; understood.push('Sort: highest score');
  }

  const sources = ['apollo', 'linkedin', 'cold email', 'website', 'referral', 'paid ad', 'webinar', 'conference', 'partner', 'inbound'];
  for (const src of sources) { if (text.includes(src)) { filters.source = src; understood.push(`Source: ${src}`); break; } }

  if (understood.length === 0 && text.trim()) { filters.search = prompt.trim(); }

  return { filters, understood };
}

// Check if a lead matches parsed filters — single source of truth.
export function leadMatches(lead, f) {
  if (!f) return true;
  if (f.industry && lead.industry !== f.industry) return false;
  if (f.status && lead.status !== f.status) return false;
  if (f.priority && lead.priority !== f.priority) return false;
  if (f.minScore && lead.score < f.minScore) return false;
  if (f.maxScore < 100 && lead.score > f.maxScore) return false;
  if (f.minDeal && (lead.dealValue || 0) < f.minDeal) return false;
  if (f.maxDeal < Infinity && (lead.dealValue || 0) > f.maxDeal) return false;
  if (f.location && !(lead.location || '').toLowerCase().includes(f.location.toLowerCase())) return false;
  if (f.title && !(lead.title || '').toLowerCase().includes(f.title.toLowerCase())) return false;
  if (f.momentum && lead.momentum !== f.momentum) return false;
  if (f.source && !(lead.lead_source || '').toLowerCase().includes(f.source.toLowerCase())) return false;
  if (f.search) {
    const s = f.search.toLowerCase();
    const hit = (lead.name || '').toLowerCase().includes(s) ||
                (lead.company || '').toLowerCase().includes(s) ||
                (lead.industry || '').toLowerCase().includes(s) ||
                (lead.title || '').toLowerCase().includes(s) ||
                (lead.location || '').toLowerCase().includes(s);
    if (!hit) return false;
  }
  return true;
}

// Detect if a prompt is lead-related (short circuit for non-lead chats)
export function isLeadQuery(prompt) {
  const t = (prompt || '').toLowerCase();
  return /\b(lead|prospect|pipeline|show|find|search|who|ceo|founder|saas|agency|close|whale|hot|quick win|top)\b/.test(t);
}

// Run the full agentic pipeline: parse + match + rank + return top N
export function runLeadQuery(prompt, leads, { limit = 10 } = {}) {
  const { filters, understood } = parseAIPrompt(prompt);
  let matches = [];
  let pipeline = 0;
  let totalScore = 0;
  for (const l of leads) {
    if (!leadMatches(l, filters)) continue;
    matches.push(l);
    pipeline += l.dealValue || 0;
    totalScore += l.score || 0;
  }
  // Sort — default by score desc
  if (filters.sort === 'dealValue') {
    matches.sort((a, b) => (b.dealValue || 0) - (a.dealValue || 0));
  } else if (filters.sort === 'created_at') {
    matches.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  } else {
    matches.sort((a, b) => (b.score || 0) - (a.score || 0));
  }
  const topMatches = matches.slice(0, limit);
  return {
    filters,
    understood,
    total: matches.length,
    pipeline,
    commission: Math.round(pipeline * 0.12),
    avgScore: matches.length ? Math.round(totalScore / matches.length) : 0,
    topMatches,
  };
}
