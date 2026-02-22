import { create } from 'zustand';

const companies = ['Stripe', 'Shopify', 'Square', 'Plaid', 'Brex', 'Ramp', 'Mercury', 'Gusto', 'Rippling', 'Deel', 'Notion', 'Figma', 'Canva', 'Miro', 'Loom', 'Slack', 'Discord', 'Zoom', 'Calendly', 'Hubspot', 'Salesforce', 'Zendesk', 'Intercom', 'Gong', 'Outreach', 'Apollo', 'ZoomInfo', 'Datadog', 'Snowflake', 'Databricks', 'Vercel', 'Netlify', 'Cloudflare', 'MongoDB', 'Supabase'];
const industries = ['Fintech', 'SaaS', 'E-commerce', 'Healthcare', 'EdTech', 'DevTools', 'Cybersecurity', 'AI/ML', 'MarTech', 'PropTech'];
const priorities = ['critical', 'high', 'medium', 'low'];
const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const firstNames = ['James', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Chris', 'Amanda', 'Matt', 'Rachel', 'Alex', 'Nicole', 'Ryan', 'Taylor', 'Jordan', 'Morgan'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Chen', 'Kumar', 'Park', 'Lee'];
const titles = ['CEO', 'CTO', 'CFO', 'VP Sales', 'VP Marketing', 'VP Engineering', 'Director of Sales', 'Head of Growth', 'COO', 'Director of Ops'];
const locations = ['San Francisco', 'New York', 'Austin', 'Seattle', 'Boston', 'Chicago', 'Denver', 'Miami', 'LA', 'London', 'Toronto', 'Berlin'];
const painPoints = [
  'Manual lead qualification taking 40+ hrs/week', 'No unified view of pipeline health', 'Cold outreach under 2% reply rate',
  'Sales cycle 3x industry average', 'CRM data quality below 60%', 'Rep ramp time exceeding 90 days',
  'No real-time competitive intelligence', 'Forecasting accuracy under 50%', 'High customer churn rate',
  'Scaling team without losing quality', 'Tech stack fragmentation', 'No automated follow-up system'
];
const techStacks = ['Salesforce + HubSpot', 'Pipedrive + Mailchimp', 'HubSpot + Outreach', 'Salesforce + Gong + ZoomInfo', 'None - manual process', 'Custom CRM + Excel'];
const buyingSignals = ['Recent funding round', 'Hiring sales team', 'Tech stack migration', 'New leadership', 'Expanding to new market', 'Competitor loss', 'RFP issued', 'Budget cycle Q1'];

function generateLeads(count) {
  const leads = [];
  for (let i = 0; i < count; i++) {
    const company = companies[i % companies.length];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const industry = industries[Math.floor(Math.random() * industries.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const score = Math.floor(Math.random() * 100);
    const dealValue = Math.floor(Math.random() * 500000) + 10000;
    const employees = Math.floor(Math.random() * 10000) + 10;
    const revenue = Math.floor(Math.random() * 100000000) + 100000;
    const location = locations[Math.floor(Math.random() * locations.length)];
    const selectedPainPoints = painPoints.sort(() => 0.5 - Math.random()).slice(0, 3);
    const selectedSignals = buyingSignals.sort(() => 0.5 - Math.random()).slice(0, 3);

    leads.push({
      id: i + 1,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s/g, '')}.com`,
      phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      company, title: titles[Math.floor(Math.random() * titles.length)],
      industry, priority, status, score, dealValue, employees, revenue, location,
      website: `https://${company.toLowerCase().replace(/\s/g, '')}.com`,
      momentum: ['rising', 'stable', 'declining'][Math.floor(Math.random() * 3)],
      painPoints: selectedPainPoints,
      techStack: techStacks[Math.floor(Math.random() * techStacks.length)],
      buyingSignals: selectedSignals,
      lastContact: ['2 hours ago', '1 day ago', '3 days ago', '1 week ago', '2 weeks ago'][Math.floor(Math.random() * 5)],
      conversionProbability: Math.floor(Math.random() * 100),
      bestMethod: ['Cold Email', 'LinkedIn DM', 'Cold Call', 'Warm Intro', 'Conference'][Math.floor(Math.random() * 5)],
      decisionTimeline: ['This week', '2 weeks', '1 month', '3 months', '6 months'][Math.floor(Math.random() * 5)],
      competitorUsing: companies.filter(c => c !== company).sort(() => 0.5 - Math.random()).slice(0, 2).join(', '),
      callScript: {
        opener: `Hi ${firstName}, I noticed ${company} has been ${selectedSignals[0]?.toLowerCase() || 'growing rapidly'}. Quick question about your ${industry.toLowerCase()} ops.`,
        discovery: ['What is your current biggest challenge with lead generation?', 'How many hours per week does your team spend on manual prospecting?', 'What does your current tech stack look like for sales?', 'What would it mean for your business to cut sales cycle time in half?'],
        pitch: `We help ${industry} companies like ${company} increase qualified pipeline by 3-5x while cutting manual work by 80%. Our AI agents handle research, outreach, and qualification 24/7.`,
        close: `Based on what you shared about ${selectedPainPoints[0]?.toLowerCase() || 'your challenges'}, I think a 15-min demo would be valuable. Does Thursday at 2pm work?`,
        valueProps: [`Save ${Math.floor(Math.random() * 30 + 20)} hours/week on prospecting`, `Increase reply rates by ${Math.floor(Math.random() * 200 + 100)}%`, `Cut sales cycle by ${Math.floor(Math.random() * 40 + 20)}%`],
      },
      objections: [
        { objection: 'Too expensive', response: `Focus on ROI. Companies like yours see 3-5x return within 6 months. That's ${fmt(dealValue * 3)} in pipeline from a ${fmt(dealValue * 0.1)} investment.` },
        { objection: 'We already have a solution', response: `Totally understand. Most of our clients came from ${['Salesforce', 'HubSpot', 'Outreach'][Math.floor(Math.random() * 3)]}. The difference is our AI agents work 24/7 and improve daily.` },
        { objection: 'Need to think about it', response: `Of course. While you think, I can send a custom ROI analysis based on your pipeline. When would be a good time to reconnect?` },
        { objection: 'Not the right time', response: `I get it. Would it help if I sent a case study of how a similar ${industry} company got started? No pressure, just data.` },
      ],
      outreach: [
        { type: 'Cold Email', template: `Subject: ${company}'s ${selectedPainPoints[0]?.split(' ').slice(0, 3).join(' ') || 'growth challenge'}\n\nHi ${firstName},\n\nNoticed ${company} is ${selectedSignals[0]?.toLowerCase() || 'scaling fast'}. We help ${industry} companies eliminate ${selectedPainPoints[0]?.toLowerCase() || 'manual work'} with AI-powered automation.\n\nWorth a 15-min call this week?\n\nBest,\nGoated Solutions` },
        { type: 'LinkedIn DM', template: `Hey ${firstName}! Saw ${company}'s growth - impressive. We're helping ${industry} leaders automate their sales pipeline. Open to connecting?` },
        { type: 'Follow-up', template: `Hi ${firstName}, following up on my note about ${selectedPainPoints[0]?.toLowerCase() || 'your pipeline'}. Just helped a similar ${industry} company 3x their qualified leads in 30 days. Worth exploring?` },
      ],
      packages: [
        { name: 'Starter', price: Math.floor(dealValue * 0.05), features: ['500 AI-qualified leads/mo', 'Basic outreach automation', 'Email templates'] },
        { name: 'Growth', price: Math.floor(dealValue * 0.1), features: ['2,500 AI-qualified leads/mo', 'Multi-channel outreach', 'AI call coaching', 'CRM integration'], recommended: true },
        { name: 'Enterprise', price: Math.floor(dealValue * 0.2), features: ['Unlimited leads', 'Dedicated AI agents', 'Custom integrations', 'White-glove onboarding', 'Quarterly strategy reviews'] },
      ],
      ranking: {
        overall: Math.floor(Math.random() * 50) + 1,
        byIndustry: Math.floor(Math.random() * 10) + 1,
        byPriority: Math.floor(Math.random() * 20) + 1,
        engagement: ['Very High', 'High', 'Medium', 'Low'][Math.floor(Math.random() * 4)],
        fitScore: Math.floor(Math.random() * 40) + 60,
        intentScore: Math.floor(Math.random() * 100),
      },
    });
  }
  return leads.sort((a, b) => b.score - a.score);
}

const fmt = (v) => v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v}`;

export const useStore = create((set, get) => ({
  // Navigation
  page: 'home',
  setPage: (page) => set({ page, mobileMenu: false }),
  sidebar: true,
  toggleSidebar: () => set(s => ({ sidebar: !s.sidebar })),
  mobileMenu: false,
  setMobileMenu: (v) => set({ mobileMenu: v }),

  // Search
  searchOpen: false,
  setSearchOpen: (v) => set({ searchOpen: v }),
  keybindsOpen: false,
  setKeybindsOpen: (v) => set({ keybindsOpen: v }),

  // AI Overlay
  aiOpen: false,
  setAiOpen: (v) => set({ aiOpen: v }),
  aiModel: 'goated-v1',
  setAiModel: (m) => set({ aiModel: m }),

  // Leads
  leads: generateLeads(2500),
  search: '',
  setSearch: (s) => set({ search: s }),
  filterPriority: 'all',
  setFilterPriority: (f) => set({ filterPriority: f }),
  filterStatus: 'all',
  setFilterStatus: (f) => set({ filterStatus: f }),
  selectedLead: null,
  setSelectedLead: (l) => set({ selectedLead: l }),
  detailOpen: false,
  setDetailOpen: (v) => set({ detailOpen: v }),

  // Filtered leads
  getFilteredLeads: () => {
    const s = get();
    return s.leads.filter(l => {
      const matchSearch = !s.search || l.name.toLowerCase().includes(s.search.toLowerCase()) || l.company.toLowerCase().includes(s.search.toLowerCase()) || l.industry.toLowerCase().includes(s.search.toLowerCase());
      const matchPriority = s.filterPriority === 'all' || l.priority === s.filterPriority;
      const matchStatus = s.filterStatus === 'all' || l.status === s.filterStatus;
      return matchSearch && matchPriority && matchStatus;
    });
  },

  // Theme
  theme: 'neon',
  setTheme: (t) => set({ theme: t }),
}));

export { fmt, priorities, statuses, industries };
