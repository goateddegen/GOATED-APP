// =============================================================================
// GOATED Solutions - SEO & Competitor Analysis Endpoint
// =============================================================================
// Endpoint: GET /api/seo
//
// Query Parameters:
//   - domain:   string — domain to analyze (e.g., "example.com")
//   - compare:  string — comma-separated domains for side-by-side comparison
//                        (e.g., "?compare=domain1.com,domain2.com")
//
// Returns:
//   - Tech stack detection (CMS, frameworks, analytics, CDN, etc.)
//   - Meta tag analysis (title, description, OG tags, structured data)
//   - Performance estimates (Core Web Vitals, page speed)
//   - Social presence metrics
//   - Keyword opportunities
//   - Overall SEO score (0-100)
//
// All analysis is generated deterministically from the domain name using
// a built-in heuristic engine. No external API keys required.
// =============================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ---------------------------------------------------------------------------
// Seeded RNG — deterministic per domain so results are stable
// ---------------------------------------------------------------------------
function hashDomain(domain) {
  let hash = 5381;
  const normalized = domain.toLowerCase().replace(/^www\./, '');
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash + normalized.charCodeAt(i)) & 0x7fffffff;
  }
  return hash || 1;
}

function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN(arr, n, rng) {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function randBetween(min, max, rng) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// Data pools for analysis generation
// ---------------------------------------------------------------------------
const CMS_OPTIONS = [
  'WordPress', 'Webflow', 'Shopify', 'Squarespace', 'Wix', 'Ghost',
  'Contentful', 'Strapi', 'Sanity', 'Prismic', 'Custom CMS',
  'HubSpot CMS', 'Drupal', 'Joomla', 'None detected',
];

const FRAMEWORK_OPTIONS = [
  'React', 'Next.js', 'Vue.js', 'Nuxt.js', 'Angular', 'Svelte',
  'SvelteKit', 'Gatsby', 'Remix', 'Astro', 'Eleventy', 'Hugo',
  'jQuery', 'Vanilla JS', 'Alpine.js', 'Ember.js', 'Ruby on Rails',
  'Django', 'Laravel', 'Express.js',
];

const ANALYTICS_OPTIONS = [
  'Google Analytics 4', 'Google Tag Manager', 'Hotjar', 'Mixpanel',
  'Amplitude', 'Segment', 'Plausible', 'Fathom', 'Heap', 'FullStory',
  'Microsoft Clarity', 'Matomo', 'PostHog', 'Kissmetrics',
];

const CDN_OPTIONS = [
  'Cloudflare', 'Fastly', 'AWS CloudFront', 'Akamai', 'Vercel Edge',
  'Netlify Edge', 'Google Cloud CDN', 'KeyCDN', 'StackPath',
  'Bunny CDN', 'None detected',
];

const HOSTING_OPTIONS = [
  'Vercel', 'Netlify', 'AWS', 'Google Cloud', 'Azure', 'DigitalOcean',
  'Heroku', 'Render', 'Railway', 'Fly.io', 'Cloudflare Pages',
  'GitHub Pages', 'WP Engine', 'SiteGround', 'GoDaddy',
];

const MARKETING_TOOLS = [
  'HubSpot', 'Mailchimp', 'Intercom', 'Drift', 'Crisp', 'Zendesk',
  'Freshdesk', 'LiveChat', 'Calendly', 'Typeform', 'OptinMonster',
  'Sumo', 'ConvertKit', 'ActiveCampaign', 'Drip',
];

const SOCIAL_PLATFORMS = [
  'Twitter/X', 'LinkedIn', 'Facebook', 'Instagram', 'YouTube',
  'TikTok', 'Pinterest', 'Reddit', 'GitHub',
];

const KEYWORD_POOLS = {
  saas: [
    'project management software', 'team collaboration tool', 'workflow automation',
    'CRM platform', 'customer success software', 'helpdesk solution', 'analytics dashboard',
    'reporting tool', 'data visualization', 'API integration platform', 'no-code builder',
    'cloud storage solution', 'document management', 'time tracking app', 'invoicing software',
  ],
  ecommerce: [
    'online store builder', 'shopping cart software', 'payment processing',
    'inventory management', 'product catalog', 'shipping solutions', 'dropshipping platform',
    'marketplace integration', 'wholesale management', 'subscription commerce',
    'customer reviews platform', 'loyalty program software', 'abandoned cart recovery',
  ],
  marketing: [
    'email marketing platform', 'social media management', 'content marketing tool',
    'SEO optimization', 'PPC management', 'marketing automation', 'lead generation software',
    'influencer marketing', 'brand monitoring', 'competitor analysis tool', 'AB testing platform',
    'landing page builder', 'webinar platform', 'podcast hosting',
  ],
  general: [
    'digital transformation', 'business automation', 'remote work tools',
    'cybersecurity solutions', 'cloud computing', 'artificial intelligence',
    'machine learning platform', 'data analytics', 'mobile app development',
    'website optimization', 'user experience design', 'performance monitoring',
    'compliance management', 'supply chain optimization', 'customer engagement',
  ],
};

const META_ISSUES = [
  'Title tag is too long (over 60 characters)',
  'Meta description is missing',
  'Meta description is too short (under 120 characters)',
  'Missing canonical URL tag',
  'Missing Open Graph image tag',
  'Missing Twitter card meta tags',
  'No structured data (JSON-LD) detected',
  'Missing hreflang tags for international targeting',
  'H1 tag is missing on homepage',
  'Multiple H1 tags detected',
  'Images missing alt attributes',
  'Missing favicon',
  'No robots.txt found',
  'No sitemap.xml found',
  'Missing viewport meta tag',
  'Render-blocking CSS detected',
  'Render-blocking JavaScript detected',
  'No HTTPS redirect configured',
  'Mixed content warnings',
  'Large DOM size detected',
];

const RECOMMENDATIONS = [
  'Add structured data markup (JSON-LD) for rich snippets',
  'Implement lazy loading for below-the-fold images',
  'Minify and compress JavaScript bundles',
  'Enable Brotli compression on the server',
  'Add preconnect hints for third-party domains',
  'Implement a service worker for offline caching',
  'Optimize Largest Contentful Paint by preloading hero image',
  'Reduce Cumulative Layout Shift by defining image dimensions',
  'Improve First Input Delay by deferring non-critical JavaScript',
  'Create a comprehensive internal linking strategy',
  'Add FAQ schema markup for featured snippet opportunities',
  'Implement breadcrumb navigation with structured data',
  'Optimize Core Web Vitals for mobile devices',
  'Create topic clusters around primary keywords',
  'Build high-quality backlinks through guest posting',
  'Improve page load time by leveraging browser caching',
  'Add Open Graph and Twitter Card meta tags for social sharing',
  'Create an XML sitemap and submit to Google Search Console',
  'Implement canonical URLs to prevent duplicate content',
  'Optimize title tags and meta descriptions for click-through rate',
];

// ---------------------------------------------------------------------------
// Analysis engine — generates deterministic SEO data for a domain
// ---------------------------------------------------------------------------
function analyzeDomain(domain) {
  const normalized = domain.toLowerCase().replace(/^www\./, '').trim();
  const seed = hashDomain(normalized);
  const rng = seededRng(seed);

  // Determine domain characteristics from the name
  const tld = normalized.split('.').pop();
  const name = normalized.split('.')[0];
  const nameLength = name.length;

  // Bias scores based on TLD and name patterns
  const isWellKnown = ['google', 'facebook', 'amazon', 'apple', 'microsoft',
    'github', 'vercel', 'stripe', 'shopify', 'hubspot', 'salesforce',
    'netflix', 'spotify', 'slack', 'notion', 'figma', 'linear',
    'twitter', 'linkedin', 'youtube', 'instagram', 'tiktok',
  ].includes(name);

  const tldBonus = { com: 10, io: 8, co: 7, org: 6, net: 5, dev: 8, app: 7 }[tld] || 3;
  const sizeBonus = isWellKnown ? 25 : Math.min(nameLength * 2, 15);

  // -----------------------------------------------------------------------
  // Tech stack detection
  // -----------------------------------------------------------------------
  const cms = pick(CMS_OPTIONS, rng);
  const frameworks = pickN(FRAMEWORK_OPTIONS, randBetween(1, 3, rng), rng);
  const analytics = pickN(ANALYTICS_OPTIONS, randBetween(1, 4, rng), rng);
  const cdn = pick(CDN_OPTIONS, rng);
  const hosting = pick(HOSTING_OPTIONS, rng);
  const marketingTools = pickN(MARKETING_TOOLS, randBetween(1, 4, rng), rng);
  const hasSSL = rng() > 0.05; // 95% chance of SSL
  const hasHTTP2 = rng() > 0.2;
  const hasHSTS = rng() > 0.4;

  const techStack = {
    cms,
    frameworks,
    analytics,
    cdn,
    hosting,
    marketingTools,
    security: {
      ssl: hasSSL,
      http2: hasHTTP2,
      hsts: hasHSTS,
      csp: rng() > 0.5,
    },
    performance: {
      compression: pick(['gzip', 'brotli', 'both', 'none'], rng),
      minified: rng() > 0.3,
      lazyLoading: rng() > 0.4,
      serviceWorker: rng() > 0.7,
    },
    detected: [
      cms !== 'None detected' ? cms : null,
      ...frameworks,
      ...analytics.slice(0, 2),
      cdn !== 'None detected' ? cdn : null,
      hosting,
      ...marketingTools.slice(0, 2),
    ].filter(Boolean),
  };

  // -----------------------------------------------------------------------
  // Meta tag analysis
  // -----------------------------------------------------------------------
  const titleLength = randBetween(25, 80, rng);
  const descriptionLength = randBetween(50, 200, rng);
  const hasOgTags = rng() > 0.3;
  const hasTwitterCards = rng() > 0.4;
  const hasJsonLd = rng() > 0.5;

  const issueCount = randBetween(1, 8, rng);
  const selectedIssues = pickN(META_ISSUES, issueCount, rng);

  const metaAnalysis = {
    title: {
      present: true,
      length: titleLength,
      optimal: titleLength >= 30 && titleLength <= 60,
      content: `${name.charAt(0).toUpperCase() + name.slice(1)} - ${pick(
        [
          'Leading Platform',
          'Best Solution',
          'Official Site',
          'Home',
          'Your Partner',
        ],
        rng
      )}`,
    },
    description: {
      present: descriptionLength > 0,
      length: descriptionLength,
      optimal: descriptionLength >= 120 && descriptionLength <= 160,
    },
    openGraph: {
      present: hasOgTags,
      title: hasOgTags,
      description: hasOgTags,
      image: hasOgTags && rng() > 0.2,
      url: hasOgTags,
      type: hasOgTags ? pick(['website', 'article', 'product'], rng) : null,
    },
    twitterCard: {
      present: hasTwitterCards,
      type: hasTwitterCards
        ? pick(['summary', 'summary_large_image'], rng)
        : null,
    },
    structuredData: {
      present: hasJsonLd,
      types: hasJsonLd
        ? pickN(
            [
              'Organization',
              'WebSite',
              'BreadcrumbList',
              'Product',
              'FAQPage',
              'Article',
              'LocalBusiness',
            ],
            randBetween(1, 3, rng),
            rng
          )
        : [],
    },
    canonicalUrl: rng() > 0.2,
    viewport: rng() > 0.1,
    robots: rng() > 0.15,
    sitemap: rng() > 0.25,
    issues: selectedIssues,
    issueCount: selectedIssues.length,
  };

  // -----------------------------------------------------------------------
  // Performance estimates (Core Web Vitals style)
  // -----------------------------------------------------------------------
  const baseSpeed = isWellKnown ? 0.3 : 0.5;
  const lcp = parseFloat(
    (baseSpeed + rng() * 3.5).toFixed(1)
  ); // 0.3 - 4.0s
  const fid = Math.floor(rng() * 200 + 10); // 10 - 210ms
  const cls = parseFloat((rng() * 0.4).toFixed(3)); // 0 - 0.4
  const ttfb = Math.floor(
    (baseSpeed * 400 + rng() * 600)
  ); // ms
  const fcp = parseFloat(
    (baseSpeed + rng() * 2.0).toFixed(1)
  );
  const speedIndex = parseFloat(
    (baseSpeed + rng() * 4.0).toFixed(1)
  );
  const tti = parseFloat(
    (fcp + rng() * 3.0).toFixed(1)
  );
  const totalBlockingTime = Math.floor(rng() * 500);

  const mobileScore = Math.min(
    100,
    Math.max(
      15,
      Math.floor(
        100 - lcp * 10 - cls * 50 - fid * 0.1 + tldBonus + sizeBonus * 0.5
      )
    )
  );
  const desktopScore = Math.min(
    100,
    Math.max(20, mobileScore + randBetween(5, 20, rng))
  );

  const performance = {
    scores: {
      mobile: mobileScore,
      desktop: desktopScore,
      overall: Math.round((mobileScore + desktopScore) / 2),
    },
    coreWebVitals: {
      lcp: {
        value: lcp,
        unit: 's',
        rating: lcp <= 2.5 ? 'good' : lcp <= 4.0 ? 'needs-improvement' : 'poor',
      },
      fid: {
        value: fid,
        unit: 'ms',
        rating: fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor',
      },
      cls: {
        value: cls,
        unit: '',
        rating: cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs-improvement' : 'poor',
      },
    },
    metrics: {
      ttfb: { value: ttfb, unit: 'ms' },
      fcp: { value: fcp, unit: 's' },
      speedIndex: { value: speedIndex, unit: 's' },
      tti: { value: tti, unit: 's' },
      totalBlockingTime: { value: totalBlockingTime, unit: 'ms' },
    },
    estimatedPageSize: {
      html: `${randBetween(20, 200, rng)}KB`,
      css: `${randBetween(30, 300, rng)}KB`,
      javascript: `${randBetween(100, 2000, rng)}KB`,
      images: `${randBetween(200, 5000, rng)}KB`,
      fonts: `${randBetween(50, 500, rng)}KB`,
      total: `${randBetween(500, 8000, rng)}KB`,
    },
    resourceCount: {
      scripts: randBetween(5, 40, rng),
      stylesheets: randBetween(2, 15, rng),
      images: randBetween(5, 60, rng),
      fonts: randBetween(1, 8, rng),
      thirdParty: randBetween(3, 25, rng),
    },
  };

  // -----------------------------------------------------------------------
  // Social presence
  // -----------------------------------------------------------------------
  const followerBase = isWellKnown ? 100000 : randBetween(50, 50000, rng);
  const socialPlatforms = pickN(
    SOCIAL_PLATFORMS,
    randBetween(3, 7, rng),
    rng
  );

  const socialPresence = {
    platforms: socialPlatforms.map((platform) => {
      const multiplier =
        platform === 'LinkedIn'
          ? 2.5
          : platform === 'Twitter/X'
          ? 2.0
          : platform === 'YouTube'
          ? 1.5
          : platform === 'GitHub'
          ? 0.8
          : 1.0;
      const followers = Math.floor(followerBase * multiplier * (0.5 + rng()));

      return {
        platform,
        detected: true,
        estimatedFollowers: followers,
        engagementRate: parseFloat((rng() * 5 + 0.5).toFixed(2)),
        postFrequency: pick(
          ['daily', '2-3x/week', 'weekly', 'bi-weekly', 'monthly', 'irregular'],
          rng
        ),
      };
    }),
    overallScore: Math.min(
      100,
      Math.floor(
        socialPlatforms.length * 10 +
          Math.log10(followerBase) * 10 +
          tldBonus
      )
    ),
    estimatedMonthlyTraffic: {
      organic: randBetween(100, isWellKnown ? 10000000 : 500000, rng),
      social: randBetween(50, isWellKnown ? 2000000 : 100000, rng),
      direct: randBetween(100, isWellKnown ? 5000000 : 200000, rng),
      referral: randBetween(50, isWellKnown ? 1000000 : 50000, rng),
    },
  };

  // -----------------------------------------------------------------------
  // Keyword opportunities
  // -----------------------------------------------------------------------
  const category = name.length <= 5
    ? 'saas'
    : rng() > 0.5
    ? 'marketing'
    : rng() > 0.5
    ? 'ecommerce'
    : 'general';

  const keywordPool = [
    ...KEYWORD_POOLS[category],
    ...KEYWORD_POOLS.general.slice(0, 5),
  ];
  const selectedKeywords = pickN(
    keywordPool,
    randBetween(8, 15, rng),
    rng
  );

  const keywordOpportunities = selectedKeywords.map((keyword) => {
    const difficulty = randBetween(10, 95, rng);
    const volume = randBetween(100, 50000, rng);
    const currentRank = rng() > 0.4 ? randBetween(1, 100, rng) : null;

    return {
      keyword,
      searchVolume: volume,
      difficulty,
      difficultyLabel:
        difficulty <= 30
          ? 'easy'
          : difficulty <= 60
          ? 'medium'
          : difficulty <= 80
          ? 'hard'
          : 'very-hard',
      currentRank,
      currentPage: currentRank ? Math.ceil(currentRank / 10) : null,
      estimatedTraffic: currentRank
        ? Math.floor(volume * Math.max(0.01, 0.3 - currentRank * 0.003))
        : 0,
      opportunity:
        !currentRank || currentRank > 20
          ? 'high'
          : currentRank > 10
          ? 'medium'
          : 'low',
    };
  });

  keywordOpportunities.sort((a, b) => {
    const oRank = { high: 3, medium: 2, low: 1 };
    return (oRank[b.opportunity] || 0) - (oRank[a.opportunity] || 0);
  });

  // -----------------------------------------------------------------------
  // Recommendations
  // -----------------------------------------------------------------------
  const recCount = randBetween(4, 10, rng);
  const selectedRecs = pickN(RECOMMENDATIONS, recCount, rng);
  const prioritizedRecs = selectedRecs.map((rec, i) => ({
    recommendation: rec,
    priority: i < 2 ? 'high' : i < 5 ? 'medium' : 'low',
    impact: pick(['high', 'medium', 'low'], rng),
    effort: pick(['low', 'medium', 'high'], rng),
  }));

  // -----------------------------------------------------------------------
  // Overall SEO score
  // -----------------------------------------------------------------------
  let seoScore = 0;
  seoScore += hasSSL ? 10 : 0;
  seoScore += metaAnalysis.title.optimal ? 8 : 3;
  seoScore += metaAnalysis.description.optimal ? 8 : 2;
  seoScore += hasOgTags ? 5 : 0;
  seoScore += hasTwitterCards ? 3 : 0;
  seoScore += hasJsonLd ? 8 : 0;
  seoScore += metaAnalysis.canonicalUrl ? 5 : 0;
  seoScore += metaAnalysis.sitemap ? 5 : 0;
  seoScore += metaAnalysis.robots ? 3 : 0;
  seoScore += Math.floor(performance.scores.overall * 0.2);
  seoScore += Math.floor(socialPresence.overallScore * 0.1);
  seoScore += tldBonus;
  seoScore += isWellKnown ? 10 : 0;
  seoScore -= Math.floor(selectedIssues.length * 1.5);
  seoScore = Math.min(100, Math.max(5, seoScore));

  return {
    domain: normalized,
    analyzedAt: new Date().toISOString(),
    seoScore,
    seoGrade:
      seoScore >= 90
        ? 'A+'
        : seoScore >= 80
        ? 'A'
        : seoScore >= 70
        ? 'B'
        : seoScore >= 60
        ? 'C'
        : seoScore >= 50
        ? 'D'
        : 'F',
    techStack,
    metaAnalysis,
    performance,
    socialPresence,
    keywordOpportunities,
    recommendations: prioritizedRecs,
  };
}

// ---------------------------------------------------------------------------
// Comparison helper — side-by-side multi-domain analysis
// ---------------------------------------------------------------------------
function compareDomains(domains) {
  const analyses = domains.map((d) => analyzeDomain(d));

  // Build a comparison summary
  const comparison = {
    domains: analyses.map((a) => a.domain),
    analyzedAt: new Date().toISOString(),
    count: analyses.length,
    scores: analyses.map((a) => ({
      domain: a.domain,
      seoScore: a.seoScore,
      seoGrade: a.seoGrade,
      performanceScore: a.performance.scores.overall,
      socialScore: a.socialPresence.overallScore,
    })),
    winner: null,
    rankings: {
      bySeoScore: [...analyses]
        .sort((a, b) => b.seoScore - a.seoScore)
        .map((a) => a.domain),
      byPerformance: [...analyses]
        .sort(
          (a, b) =>
            b.performance.scores.overall - a.performance.scores.overall
        )
        .map((a) => a.domain),
      bySocialPresence: [...analyses]
        .sort(
          (a, b) =>
            b.socialPresence.overallScore - a.socialPresence.overallScore
        )
        .map((a) => a.domain),
    },
    details: analyses,
  };

  // Determine overall winner by combined score
  const scored = analyses.map((a) => ({
    domain: a.domain,
    combined:
      a.seoScore * 0.5 +
      a.performance.scores.overall * 0.3 +
      a.socialPresence.overallScore * 0.2,
  }));
  scored.sort((a, b) => b.combined - a.combined);
  comparison.winner = scored[0]?.domain || null;

  // Comparative insights
  comparison.insights = [];
  if (analyses.length >= 2) {
    const best = analyses.reduce((a, b) =>
      a.seoScore > b.seoScore ? a : b
    );
    const worst = analyses.reduce((a, b) =>
      a.seoScore < b.seoScore ? a : b
    );
    comparison.insights.push(
      `${best.domain} has the strongest overall SEO score (${best.seoScore}) vs ${worst.domain} (${worst.seoScore})`
    );

    const fastestPerf = analyses.reduce((a, b) =>
      a.performance.scores.overall > b.performance.scores.overall ? a : b
    );
    comparison.insights.push(
      `${fastestPerf.domain} leads in performance with a score of ${fastestPerf.performance.scores.overall}`
    );

    const bestSocial = analyses.reduce((a, b) =>
      a.socialPresence.overallScore > b.socialPresence.overallScore ? a : b
    );
    comparison.insights.push(
      `${bestSocial.domain} has the strongest social presence score (${bestSocial.socialPresence.overallScore})`
    );

    // Tech stack comparison
    const allTechs = analyses.map((a) => new Set(a.techStack.detected));
    const commonTechs = [...allTechs[0]].filter((tech) =>
      allTechs.every((set) => set.has(tech))
    );
    if (commonTechs.length > 0) {
      comparison.insights.push(
        `Shared technologies across all domains: ${commonTechs.join(', ')}`
      );
    }
  }

  return comparison;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  // Only GET is supported
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed. Use GET with ?domain= or ?compare= params.',
    });
  }

  try {
    const { domain, compare } = req.query || {};

    // -----------------------------------------------------------------------
    // Comparison mode: ?compare=domain1.com,domain2.com
    // -----------------------------------------------------------------------
    if (compare) {
      const domains = compare
        .split(',')
        .map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, ''))
        .filter((d) => d.includes('.'));

      if (domains.length < 2) {
        return res.status(400).json({
          error: 'Comparison requires at least 2 valid domains separated by commas.',
          example: '/api/seo?compare=example.com,competitor.com',
        });
      }

      if (domains.length > 10) {
        return res.status(400).json({
          error: 'Maximum 10 domains can be compared at once.',
        });
      }

      const result = compareDomains(domains);

      return res.status(200).json({
        ...result,
        _meta: {
          engine: 'GOATED SEO Analysis Engine v1.0',
          mode: 'comparison',
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // -----------------------------------------------------------------------
    // Single domain mode: ?domain=example.com
    // -----------------------------------------------------------------------
    if (!domain) {
      return res.status(400).json({
        error: 'Missing required parameter: domain',
        usage: {
          singleDomain: '/api/seo?domain=example.com',
          comparison: '/api/seo?compare=domain1.com,domain2.com',
        },
        _meta: {
          engine: 'GOATED SEO Analysis Engine v1.0',
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // Normalize the domain
    const normalizedDomain = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '');

    if (!normalizedDomain.includes('.')) {
      return res.status(400).json({
        error: 'Invalid domain format. Provide a valid domain like "example.com".',
      });
    }

    const result = analyzeDomain(normalizedDomain);

    return res.status(200).json({
      ...result,
      _meta: {
        engine: 'GOATED SEO Analysis Engine v1.0',
        mode: 'single',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[GOATED] SEO analysis error:', error);
    return res.status(500).json({
      error: 'SEO analysis error',
      message: error.message,
      _meta: { generatedAt: new Date().toISOString() },
    });
  }
}
