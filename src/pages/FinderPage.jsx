import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Globe, Linkedin, Building2, TrendingUp, TrendingDown, ArrowUpRight,
  ArrowDownRight, BarChart3, DollarSign, Users, Mail, Phone, ExternalLink,
  Filter, SlidersHorizontal, Download, Plus, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle2, XCircle, Zap, Target, Crosshair, Eye,
  FileText, Link2, Activity, Layers, Shield, Clock, Star, Flame,
  Send, UserPlus, MessageSquare, Radio, Wifi, RefreshCw, Copy, Share2,
  MapPin, Briefcase, Hash, CircleDot, PieChart, LayoutGrid, List,
  ArrowRight, Sparkles, Bug, Megaphone, Lightbulb, Wrench, Code,
  Database, Lock, Unlock, AlertCircle, Info, ChevronUp, X, Loader2,
  Radar, Scan, Brain, Network, Cpu, Gem, Rocket, GitBranch, Flag,
  Percent, Calculator, BarChart2, Play, Pause, GripVertical, Trash2,
  Edit3, MousePointerClick, ArrowDown, Settings, BookOpen
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants & Mock Data
// ---------------------------------------------------------------------------
const NEON = '#00ff88';
const NEON_DIM = 'rgba(0,255,136,0.15)';
const NEON_BORDER = 'rgba(0,255,136,0.25)';

const TABS = [
  { id: 'discover', label: 'Discover', icon: Radar },
  { id: 'seo', label: 'SEO Analysis', icon: BarChart3 },
  { id: 'painpoints', label: 'Pain Points', icon: AlertTriangle },
  { id: 'revenue', label: 'Revenue Scanner', icon: DollarSign },
  { id: 'outbound', label: 'Outbound Tools', icon: Send },
];

const SOURCES = ['All', 'LinkedIn', 'Crunchbase', 'Google', 'Website', 'Social'];
const INDUSTRIES = ['All', 'SaaS', 'E-Commerce', 'Fintech', 'Healthcare', 'Agency', 'Manufacturing', 'Real Estate', 'Services'];
const COMPANY_SIZES = ['All', '1-10', '11-50', '51-200', '201-500', '500+'];

const MOCK_LEADS = [
  {
    id: 1, name: 'Sarah Chen', title: 'VP of Marketing', company: 'Flowstate',
    industry: 'SaaS', size: '51-200', location: 'Austin, TX', source: 'LinkedIn',
    email: 's.chen@flowstate.io', phone: '+1 (512) 555-0142', website: 'flowstate.io',
    score: 94, revenue: '$4.2M', funding: '$12M Series A', employees: 87,
    painPoints: ['No outbound lead gen', 'Manual CRM workflows', 'Low organic traffic'],
    techStack: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
    revenueGaps: ['No upsell automation', 'Missing self-serve tier', 'No usage-based billing'],
    domainAuthority: 42, monthlyTraffic: '28K', backlinks: 1240,
    lastFunding: '2025-08-15', growthRate: '+34%', intentScore: 'High',
  },
  {
    id: 2, name: 'Marcus Rivera', title: 'CEO', company: 'NexGen Roofing',
    industry: 'Services', size: '11-50', location: 'Dallas, TX', source: 'Google',
    email: 'marcus@nexgenroofing.com', phone: '+1 (214) 555-0198', website: 'nexgenroofing.com',
    score: 88, revenue: '$2.8M', funding: 'Bootstrapped', employees: 34,
    painPoints: ['No online booking system', 'Zero SEO presence', 'No review management'],
    techStack: ['WordPress', 'QuickBooks'],
    revenueGaps: ['No recurring maintenance plans', 'No financing options', 'Manual quoting'],
    domainAuthority: 12, monthlyTraffic: '800', backlinks: 45,
    lastFunding: null, growthRate: '+18%', intentScore: 'Medium',
  },
  {
    id: 3, name: 'Priya Patel', title: 'Head of Growth', company: 'PipelineHQ',
    industry: 'SaaS', size: '51-200', location: 'San Francisco, CA', source: 'Crunchbase',
    email: 'priya@pipelinehq.com', phone: '+1 (415) 555-0277', website: 'pipelinehq.com',
    score: 91, revenue: '$8.5M', funding: '$22M Series B', employees: 156,
    painPoints: ['High churn rate (8% monthly)', 'Slow onboarding', 'No product-led growth'],
    techStack: ['Vue.js', 'Python', 'GCP', 'Snowflake'],
    revenueGaps: ['No marketplace/integrations', 'Missing enterprise tier', 'No annual billing incentive'],
    domainAuthority: 58, monthlyTraffic: '95K', backlinks: 4820,
    lastFunding: '2025-03-22', growthRate: '+52%', intentScore: 'High',
  },
  {
    id: 4, name: 'Jake Thompson', title: 'Founder', company: 'Coastal Collective',
    industry: 'E-Commerce', size: '1-10', location: 'San Diego, CA', source: 'Website',
    email: 'jake@coastalcollective.co', phone: '+1 (619) 555-0334', website: 'coastalcollective.co',
    score: 72, revenue: '$620K', funding: 'Bootstrapped', employees: 6,
    painPoints: ['No email automation', 'Poor mobile conversion', 'No loyalty program'],
    techStack: ['Shopify', 'Klaviyo'],
    revenueGaps: ['No subscription box', 'No wholesale channel', 'Missing upsell/cross-sell'],
    domainAuthority: 22, monthlyTraffic: '12K', backlinks: 280,
    lastFunding: null, growthRate: '+45%', intentScore: 'Medium',
  },
  {
    id: 5, name: 'Diana Okafor', title: 'COO', company: 'Pinnacle Dental Group',
    industry: 'Healthcare', size: '51-200', location: 'Chicago, IL', source: 'Google',
    email: 'dokafor@pinnacledental.com', phone: '+1 (312) 555-0411', website: 'pinnacledental.com',
    score: 85, revenue: '$6.1M', funding: 'Private Equity', employees: 120,
    painPoints: ['No online scheduling', 'Paper-based intake forms', 'No patient portal'],
    techStack: ['Dentrix', 'WordPress', 'Square'],
    revenueGaps: ['No membership plans', 'No cosmetic upsell flow', 'Missing insurance verification'],
    domainAuthority: 35, monthlyTraffic: '18K', backlinks: 560,
    lastFunding: '2024-11-10', growthRate: '+22%', intentScore: 'High',
  },
  {
    id: 6, name: 'Tom Westfield', title: 'Managing Director', company: 'Ironclad Creative',
    industry: 'Agency', size: '11-50', location: 'New York, NY', source: 'LinkedIn',
    email: 'tom@ironcladcreative.com', phone: '+1 (212) 555-0588', website: 'ironcladcreative.com',
    score: 79, revenue: '$3.4M', funding: 'Bootstrapped', employees: 28,
    painPoints: ['No project management tool', 'Manual time tracking', 'Client communication gaps'],
    techStack: ['Figma', 'Webflow', 'Slack', 'Google Workspace'],
    revenueGaps: ['No productized services', 'No retainer automation', 'Missing white-label offering'],
    domainAuthority: 48, monthlyTraffic: '8.5K', backlinks: 920,
    lastFunding: null, growthRate: '+12%', intentScore: 'Medium',
  },
  {
    id: 7, name: 'Elena Vasquez', title: 'CTO', company: 'TrustBridge Payments',
    industry: 'Fintech', size: '51-200', location: 'Miami, FL', source: 'Crunchbase',
    email: 'elena@trustbridge.io', phone: '+1 (305) 555-0667', website: 'trustbridge.io',
    score: 96, revenue: '$11.2M', funding: '$35M Series B', employees: 189,
    painPoints: ['Legacy API integration debt', 'No real-time fraud ML', 'Slow merchant onboarding'],
    techStack: ['Java', 'Kafka', 'AWS', 'Terraform', 'React'],
    revenueGaps: ['No embedded payments SDK', 'Missing currency support (LATAM)', 'No revenue share program'],
    domainAuthority: 62, monthlyTraffic: '120K', backlinks: 6200,
    lastFunding: '2025-06-01', growthRate: '+67%', intentScore: 'High',
  },
  {
    id: 8, name: 'Ryan Mitchell', title: 'VP Operations', company: 'Atlas Metal Fabrication',
    industry: 'Manufacturing', size: '201-500', location: 'Detroit, MI', source: 'Google',
    email: 'rmitchell@atlasmetal.com', phone: '+1 (313) 555-0744', website: 'atlasmetalfab.com',
    score: 68, revenue: '$18M', funding: 'Family-owned', employees: 310,
    painPoints: ['No ERP system', 'Paper-based quality control', 'No digital quoting'],
    techStack: ['Excel', 'QuickBooks Enterprise', 'AutoCAD'],
    revenueGaps: ['No e-commerce for standard parts', 'No predictive maintenance', 'Missing customer portal'],
    domainAuthority: 18, monthlyTraffic: '2.1K', backlinks: 120,
    lastFunding: null, growthRate: '+8%', intentScore: 'Low',
  },
  {
    id: 9, name: 'Aisha Johnson', title: 'Director of Sales', company: 'Catalyst Growth Partners',
    industry: 'Agency', size: '11-50', location: 'Atlanta, GA', source: 'LinkedIn',
    email: 'aisha@catalystgrowth.co', phone: '+1 (404) 555-0821', website: 'catalystgrowth.co',
    score: 83, revenue: '$2.1M', funding: 'Bootstrapped', employees: 19,
    painPoints: ['No CRM pipeline visibility', 'Manual reporting', 'Inconsistent lead follow-up'],
    techStack: ['HubSpot Free', 'Canva', 'Mailchimp'],
    revenueGaps: ['No performance-based pricing', 'Missing analytics dashboard for clients', 'No referral program'],
    domainAuthority: 38, monthlyTraffic: '5.2K', backlinks: 340,
    lastFunding: null, growthRate: '+28%', intentScore: 'High',
  },
  {
    id: 10, name: 'Kevin Liu', title: 'CEO', company: 'SyncWave',
    industry: 'SaaS', size: '11-50', location: 'Seattle, WA', source: 'Crunchbase',
    email: 'kevin@syncwave.dev', phone: '+1 (206) 555-0903', website: 'syncwave.dev',
    score: 90, revenue: '$1.8M', funding: '$5M Seed', employees: 22,
    painPoints: ['No developer documentation', 'No self-serve trial', 'Slow API response times'],
    techStack: ['Go', 'React', 'Redis', 'K8s', 'GCP'],
    revenueGaps: ['No developer marketplace', 'Missing usage metering', 'No partner/reseller channel'],
    domainAuthority: 30, monthlyTraffic: '14K', backlinks: 680,
    lastFunding: '2025-09-30', growthRate: '+89%', intentScore: 'High',
  },
  {
    id: 11, name: 'Natalie Brooks', title: 'Marketing Manager', company: 'Evergreen Goods Co',
    industry: 'E-Commerce', size: '11-50', location: 'Portland, OR', source: 'Website',
    email: 'natalie@evergreengoods.com', phone: '+1 (503) 555-1022', website: 'evergreengoods.com',
    score: 76, revenue: '$1.4M', funding: 'Bootstrapped', employees: 14,
    painPoints: ['Low email open rates', 'No influencer program', 'Abandoned cart rate 72%'],
    techStack: ['Shopify Plus', 'Klaviyo', 'TikTok Ads'],
    revenueGaps: ['No B2B/wholesale portal', 'Missing subscription model', 'No international shipping'],
    domainAuthority: 28, monthlyTraffic: '22K', backlinks: 890,
    lastFunding: null, growthRate: '+31%', intentScore: 'Medium',
  },
  {
    id: 12, name: 'David Kim', title: 'Founder & CEO', company: 'ClearLedger',
    industry: 'Fintech', size: '11-50', location: 'Boston, MA', source: 'Crunchbase',
    email: 'david@clearledger.com', phone: '+1 (617) 555-1199', website: 'clearledger.com',
    score: 87, revenue: '$3.6M', funding: '$8M Series A', employees: 42,
    painPoints: ['No mobile app', 'Manual reconciliation', 'No AI categorization'],
    techStack: ['Rails', 'React', 'Heroku', 'Plaid'],
    revenueGaps: ['No accountant marketplace', 'Missing payroll integration', 'No multi-entity support'],
    domainAuthority: 44, monthlyTraffic: '32K', backlinks: 1800,
    lastFunding: '2025-05-18', growthRate: '+41%', intentScore: 'High',
  },
  {
    id: 13, name: 'Lisa Fernandez', title: 'Practice Manager', company: 'Harmony Physical Therapy',
    industry: 'Healthcare', size: '11-50', location: 'Denver, CO', source: 'Google',
    email: 'lfernandez@harmonypt.com', phone: '+1 (720) 555-1344', website: 'harmonypt.com',
    score: 71, revenue: '$1.9M', funding: 'Private', employees: 26,
    painPoints: ['No telehealth capability', 'Manual insurance billing', 'No patient outcome tracking'],
    techStack: ['Jane App', 'WordPress', 'QuickBooks'],
    revenueGaps: ['No wellness membership', 'Missing home exercise app', 'No corporate wellness program'],
    domainAuthority: 15, monthlyTraffic: '3.4K', backlinks: 95,
    lastFunding: null, growthRate: '+15%', intentScore: 'Medium',
  },
  {
    id: 14, name: 'Chris Donovan', title: 'Head of Product', company: 'SignalPeak',
    industry: 'SaaS', size: '51-200', location: 'Boulder, CO', source: 'LinkedIn',
    email: 'chris@signalpeak.io', phone: '+1 (303) 555-1488', website: 'signalpeak.io',
    score: 92, revenue: '$7.8M', funding: '$18M Series B', employees: 134,
    painPoints: ['Feature bloat - low adoption', 'No in-app onboarding', 'High support ticket volume'],
    techStack: ['TypeScript', 'Next.js', 'Prisma', 'Vercel'],
    revenueGaps: ['No API monetization', 'Missing workflow automation tier', 'No professional services arm'],
    domainAuthority: 55, monthlyTraffic: '78K', backlinks: 3900,
    lastFunding: '2025-01-20', growthRate: '+48%', intentScore: 'High',
  },
  {
    id: 15, name: 'Amanda Wright', title: 'Owner', company: 'LevelUp Cleaning Co',
    industry: 'Services', size: '11-50', location: 'Phoenix, AZ', source: 'Google',
    email: 'amanda@levelupcleaning.com', phone: '+1 (480) 555-1599', website: 'levelupcleaning.com',
    score: 65, revenue: '$890K', funding: 'Bootstrapped', employees: 18,
    painPoints: ['No online booking', 'No automated scheduling', 'No customer SMS notifications'],
    techStack: ['Wix', 'Venmo', 'Google Calendar'],
    revenueGaps: ['No recurring cleaning plans', 'Missing commercial contracts', 'No supply product upsell'],
    domainAuthority: 8, monthlyTraffic: '420', backlinks: 22,
    lastFunding: null, growthRate: '+25%', intentScore: 'Medium',
  },
  {
    id: 16, name: 'Brian Hoffman', title: 'VP Engineering', company: 'FundStack',
    industry: 'Fintech', size: '51-200', location: 'New York, NY', source: 'LinkedIn',
    email: 'bhoffman@fundstack.com', phone: '+1 (646) 555-1744', website: 'fundstack.com',
    score: 93, revenue: '$14.5M', funding: '$40M Series C', employees: 210,
    painPoints: ['Compliance automation gaps', 'No real-time reporting', 'Legacy monolith migration'],
    techStack: ['Java', 'Angular', 'PostgreSQL', 'AWS', 'Docker'],
    revenueGaps: ['No white-label solution', 'Missing crypto custody', 'No embedded lending product'],
    domainAuthority: 65, monthlyTraffic: '145K', backlinks: 7800,
    lastFunding: '2025-11-05', growthRate: '+38%', intentScore: 'High',
  },
  {
    id: 17, name: 'Megan Torres', title: 'Digital Director', company: 'Ridgeline Marketing',
    industry: 'Agency', size: '11-50', location: 'Nashville, TN', source: 'Website',
    email: 'megan@ridgelinemarketing.co', phone: '+1 (615) 555-1866', website: 'ridgelinemarketing.co',
    score: 77, revenue: '$1.6M', funding: 'Bootstrapped', employees: 15,
    painPoints: ['No attribution tracking', 'Manual social scheduling', 'No competitive intelligence'],
    techStack: ['WordPress', 'SEMrush', 'Hootsuite', 'Google Analytics'],
    revenueGaps: ['No SaaS product for clients', 'Missing video production', 'No AI content pipeline'],
    domainAuthority: 41, monthlyTraffic: '6.8K', backlinks: 520,
    lastFunding: null, growthRate: '+20%', intentScore: 'Medium',
  },
  {
    id: 18, name: 'Jason Park', title: 'Co-Founder', company: 'Revly',
    industry: 'SaaS', size: '11-50', location: 'Los Angeles, CA', source: 'Crunchbase',
    email: 'jason@revly.io', phone: '+1 (323) 555-1977', website: 'revly.io',
    score: 86, revenue: '$2.4M', funding: '$6.5M Seed', employees: 30,
    painPoints: ['No freemium tier', 'Poor onboarding completion (23%)', 'No integration marketplace'],
    techStack: ['Python', 'React', 'FastAPI', 'AWS'],
    revenueGaps: ['No affiliate program', 'Missing agency/reseller plan', 'No data export monetization'],
    domainAuthority: 33, monthlyTraffic: '19K', backlinks: 740,
    lastFunding: '2025-07-12', growthRate: '+56%', intentScore: 'High',
  },
  {
    id: 19, name: 'Rachel Nguyen', title: 'Operations Lead', company: 'Lakeside Family Medicine',
    industry: 'Healthcare', size: '11-50', location: 'Minneapolis, MN', source: 'Google',
    email: 'rnguyen@lakesidefm.com', phone: '+1 (612) 555-2088', website: 'lakesidefm.com',
    score: 69, revenue: '$3.2M', funding: 'Private', employees: 38,
    painPoints: ['Fax-based referrals', 'No patient engagement', 'Outdated website (2019)'],
    techStack: ['Epic', 'WordPress (outdated)', 'Outlook'],
    revenueGaps: ['No wellness programs', 'Missing chronic care management', 'No cash-pay menu'],
    domainAuthority: 20, monthlyTraffic: '4.6K', backlinks: 180,
    lastFunding: null, growthRate: '+10%', intentScore: 'Low',
  },
  {
    id: 20, name: 'Alex Drummond', title: 'CEO', company: 'Vantage Point Consulting',
    industry: 'Services', size: '11-50', location: 'Washington, DC', source: 'LinkedIn',
    email: 'alex@vantagepointconsulting.com', phone: '+1 (202) 555-2199', website: 'vantagepointconsulting.com',
    score: 81, revenue: '$5.3M', funding: 'Bootstrapped', employees: 32,
    painPoints: ['No knowledge base', 'Manual proposal generation', 'No client dashboard'],
    techStack: ['Salesforce', 'PowerPoint', 'DocuSign', 'Zoom'],
    revenueGaps: ['No online courses/training', 'Missing subscription advisory', 'No proprietary framework IP'],
    domainAuthority: 46, monthlyTraffic: '11K', backlinks: 1400,
    lastFunding: null, growthRate: '+16%', intentScore: 'Medium',
  },
  {
    id: 21, name: 'Jordan Blake', title: 'Growth Lead', company: 'CloserIQ',
    industry: 'SaaS', size: '51-200', location: 'Austin, TX', source: 'LinkedIn',
    email: 'jordan@closeriq.com', phone: '+1 (512) 555-2311', website: 'closeriq.com',
    score: 89, revenue: '$5.9M', funding: '$15M Series A', employees: 98,
    painPoints: ['No outbound sequences', 'Manual lead scoring', 'No intent data integration'],
    techStack: ['React', 'Python', 'Snowflake', 'dbt'],
    revenueGaps: ['No AI coaching product', 'Missing SMB tier', 'No partner ecosystem revenue'],
    domainAuthority: 51, monthlyTraffic: '62K', backlinks: 3200,
    lastFunding: '2025-04-08', growthRate: '+44%', intentScore: 'High',
  },
  {
    id: 22, name: 'Samira Osei', title: 'CMO', company: 'Copper & Thread',
    industry: 'E-Commerce', size: '1-10', location: 'Brooklyn, NY', source: 'Website',
    email: 'samira@copperandthread.com', phone: '+1 (718) 555-2455', website: 'copperandthread.com',
    score: 74, revenue: '$480K', funding: 'Bootstrapped', employees: 5,
    painPoints: ['No SMS marketing', 'Inventory management gaps', 'No UGC strategy'],
    techStack: ['Shopify', 'Instagram', 'Canva'],
    revenueGaps: ['No custom/personalized products', 'Missing pop-up shop strategy', 'No wholesale B2B'],
    domainAuthority: 19, monthlyTraffic: '8.2K', backlinks: 340,
    lastFunding: null, growthRate: '+62%', intentScore: 'Medium',
  },
  {
    id: 23, name: 'Tyler Morrison', title: 'CRO', company: 'Groundswell Agency',
    industry: 'Agency', size: '51-200', location: 'Chicago, IL', source: 'LinkedIn',
    email: 'tyler@groundswellagency.com', phone: '+1 (312) 555-2598', website: 'groundswellagency.com',
    score: 82, revenue: '$4.8M', funding: 'Bootstrapped', employees: 64,
    painPoints: ['No unified reporting', 'Client churn at 15%/yr', 'No scalable fulfillment'],
    techStack: ['HubSpot', 'Asana', 'Google Ads', 'Meta Ads'],
    revenueGaps: ['No proprietary SaaS tool', 'Missing managed services tier', 'No equity/rev-share deals'],
    domainAuthority: 52, monthlyTraffic: '15K', backlinks: 1100,
    lastFunding: null, growthRate: '+19%', intentScore: 'Medium',
  },
  {
    id: 24, name: 'Olivia Sanders', title: 'Broker/Owner', company: 'Keystone Realty Group',
    industry: 'Real Estate', size: '11-50', location: 'Charlotte, NC', source: 'Google',
    email: 'olivia@keystonerealtygroup.com', phone: '+1 (704) 555-2700', website: 'keystonerealtygroup.com',
    score: 73, revenue: '$2.6M', funding: 'Private', employees: 22,
    painPoints: ['No CRM system', 'Manual transaction coordination', 'No lead nurture automation'],
    techStack: ['MLS', 'Zillow Premier', 'Mailchimp'],
    revenueGaps: ['No property management arm', 'Missing investor portal', 'No mortgage referral revenue'],
    domainAuthority: 25, monthlyTraffic: '7.4K', backlinks: 420,
    lastFunding: null, growthRate: '+14%', intentScore: 'Medium',
  },
];

const SEO_METRICS = {
  topKeywords: [
    { keyword: 'crm software', volume: 74000, difficulty: 82, position: null },
    { keyword: 'lead management tool', volume: 18100, difficulty: 65, position: null },
    { keyword: 'sales automation', volume: 33100, difficulty: 78, position: null },
    { keyword: 'customer relationship management', volume: 49500, difficulty: 88, position: null },
    { keyword: 'pipeline management software', volume: 8100, difficulty: 58, position: null },
    { keyword: 'outbound sales tools', volume: 6600, difficulty: 52, position: null },
    { keyword: 'email sequence software', volume: 4400, difficulty: 45, position: null },
    { keyword: 'b2b lead generation', volume: 22200, difficulty: 71, position: null },
  ],
  competitors: [
    { domain: 'hubspot.com', da: 93, traffic: '145M', keywords: 2400000, overlap: 78 },
    { domain: 'salesforce.com', da: 95, traffic: '98M', keywords: 1800000, overlap: 65 },
    { domain: 'pipedrive.com', da: 82, traffic: '12M', keywords: 420000, overlap: 82 },
    { domain: 'apollo.io', da: 78, traffic: '8.5M', keywords: 280000, overlap: 91 },
    { domain: 'lemlist.com', da: 72, traffic: '3.2M', keywords: 95000, overlap: 74 },
  ],
};

const OUTBOUND_TEMPLATES = [
  { id: 1, name: 'Cold Intro - SaaS', subject: 'Quick question about {company}\'s growth', openRate: '42%', replyRate: '12%', channel: 'Email' },
  { id: 2, name: 'Pain Point Trigger', subject: 'Noticed {painPoint} at {company}', openRate: '38%', replyRate: '15%', channel: 'Email' },
  { id: 3, name: 'LinkedIn Connection', subject: 'N/A', openRate: 'N/A', replyRate: '28%', channel: 'LinkedIn' },
  { id: 4, name: 'Case Study Share', subject: 'How {similar_company} solved {painPoint}', openRate: '45%', replyRate: '18%', channel: 'Email' },
  { id: 5, name: 'Warm Re-engagement', subject: 'Following up on our chat, {name}', openRate: '52%', replyRate: '22%', channel: 'Email' },
  { id: 6, name: 'Video Prospecting', subject: 'Made a quick video for {company}', openRate: '55%', replyRate: '24%', channel: 'Email' },
];

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------
function Badge({ children, color = 'emerald', className = '' }) {
  const colorMap = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    red: 'bg-red-500/15 text-red-400 border-red-500/25',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
    neon: 'bg-[rgba(0,255,136,0.12)] text-[#00ff88] border-[rgba(0,255,136,0.25)]',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${colorMap[color] || colorMap.emerald} ${className}`}>
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, trend, color = NEON }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-4"
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10" style={{ background: color }} />
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ background: `${color}15` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-white/40 uppercase tracking-wider font-medium">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.startsWith('+') ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend}
          </div>
        )}
      </div>
      {sub && <p className="mt-1 text-[11px] text-white/30 pl-[52px]">{sub}</p>}
    </motion.div>
  );
}

function ScoreRing({ score, size = 44, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 85 ? NEON : score >= 70 ? '#facc15' : score >= 50 ? '#f97316' : '#ef4444';
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
      </svg>
      <span className="absolute text-[11px] font-bold text-white">{score}</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: NEON_DIM }}>
          <Icon size={16} style={{ color: NEON }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-[11px] text-white/40">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score Breakdown Helper
// ---------------------------------------------------------------------------
function computeScoreBreakdown(lead) {
  const intentVal = lead.intentScore === 'High' ? 28 : lead.intentScore === 'Medium' ? 18 : 8;
  const techFit = Math.min(25, lead.techStack.length * 5 + (lead.techStack.some(t => ['React', 'Node.js', 'Python', 'TypeScript', 'Next.js'].includes(t)) ? 5 : 0));
  const fundingRecency = lead.lastFunding ? Math.max(5, 22 - Math.floor((Date.now() - new Date(lead.lastFunding).getTime()) / (1000 * 60 * 60 * 24 * 90)) * 3) : 5;
  const growth = parseInt(lead.growthRate) || 0;
  const growthScore = Math.min(25, Math.round(growth * 0.5));
  return { intent: intentVal, techFit, fundingRecency: Math.min(25, fundingRecency), growth: growthScore };
}

function ScoreBreakdownBar({ label, value, max, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/40 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
      <span className="text-[10px] font-semibold text-white/60 w-8 text-right">{value}/{max}</span>
    </div>
  );
}

function WhyThisLeadCard({ lead }) {
  const breakdown = computeScoreBreakdown(lead);
  const reasons = [];
  if (lead.intentScore === 'High') reasons.push('Showing strong buying signals and active evaluation behavior');
  if (parseInt(lead.growthRate) > 30) reasons.push(`Growing at ${lead.growthRate} - likely investing in new tools`);
  if (lead.lastFunding) {
    const months = Math.floor((Date.now() - new Date(lead.lastFunding).getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (months < 12) reasons.push(`Recent funding (${months}mo ago) - budget available for new solutions`);
  }
  if (lead.painPoints.length >= 3) reasons.push(`${lead.painPoints.length} identified pain points matching our solution`);
  if (lead.techStack.length <= 3) reasons.push('Lean tech stack indicates room for platform consolidation');
  if (reasons.length === 0) reasons.push('Matches target ICP based on industry, size, and pain profile');

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/[0.03] p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={14} style={{ color: NEON }} />
        <span className="text-xs font-semibold text-white">Why this lead?</span>
      </div>
      <div className="space-y-2 mb-3">
        <ScoreBreakdownBar label="Intent Signals" value={breakdown.intent} max={28} color="#a855f7" />
        <ScoreBreakdownBar label="Tech Stack Fit" value={breakdown.techFit} max={25} color="#3b82f6" />
        <ScoreBreakdownBar label="Funding Recency" value={breakdown.fundingRecency} max={25} color={NEON} />
        <ScoreBreakdownBar label="Growth Rate" value={breakdown.growth} max={25} color="#f59e0b" />
      </div>
      <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
        {reasons.map((r, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle2 size={11} style={{ color: NEON }} className="mt-0.5 shrink-0" />
            <span className="text-[11px] text-white/60">{r}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Discover
// ---------------------------------------------------------------------------
function DiscoverTab({ leads, searchQuery, onSelectLead, selectedLead }) {
  const [sourceFilter, setSourceFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [sizeFilter, setSizeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('score');
  const [viewMode, setViewMode] = useState('grid');
  const [whyLeadId, setWhyLeadId] = useState(null);
  const [addedToSequence, setAddedToSequence] = useState(new Set());
  const [flaggedLeads, setFlaggedLeads] = useState(new Set());
  const [enrichingLead, setEnrichingLead] = useState(null);
  const [enrichedLeads, setEnrichedLeads] = useState(new Set());

  const filtered = useMemo(() => {
    let result = [...leads];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) ||
        l.industry.toLowerCase().includes(q) || l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q)
      );
    }
    if (sourceFilter !== 'All') result = result.filter(l => l.source === sourceFilter);
    if (industryFilter !== 'All') result = result.filter(l => l.industry === industryFilter);
    if (sizeFilter !== 'All') result = result.filter(l => l.size === sizeFilter);
    result.sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'company') return a.company.localeCompare(b.company);
      if (sortBy === 'revenue') return parseFloat(b.revenue.replace(/[$MK,]/g, '')) - parseFloat(a.revenue.replace(/[$MK,]/g, ''));
      return 0;
    });
    return result;
  }, [leads, searchQuery, sourceFilter, industryFilter, sizeFilter, sortBy]);

  const handleEnrich = useCallback((e, leadId) => {
    e.stopPropagation();
    setEnrichingLead(leadId);
    setTimeout(() => {
      setEnrichedLeads(prev => new Set([...prev, leadId]));
      setEnrichingLead(null);
    }, 1500);
  }, []);

  const handleAddToSequence = useCallback((e, leadId) => {
    e.stopPropagation();
    setAddedToSequence(prev => new Set([...prev, leadId]));
  }, []);

  const handleFlag = useCallback((e, leadId) => {
    e.stopPropagation();
    setFlaggedLeads(prev => {
      const next = new Set(prev);
      next.has(leadId) ? next.delete(leadId) : next.add(leadId);
      return next;
    });
  }, []);

  return (
    <div>
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <Filter size={13} className="text-white/30" />
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
            className="bg-transparent text-white/70 text-xs border-none outline-none cursor-pointer">
            {SOURCES.map(s => <option key={s} value={s} className="bg-[#0a0a0f]">{s === 'All' ? 'All Sources' : s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <Building2 size={13} className="text-white/30" />
          <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}
            className="bg-transparent text-white/70 text-xs border-none outline-none cursor-pointer">
            {INDUSTRIES.map(i => <option key={i} value={i} className="bg-[#0a0a0f]">{i === 'All' ? 'All Industries' : i}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <Users size={13} className="text-white/30" />
          <select value={sizeFilter} onChange={e => setSizeFilter(e.target.value)}
            className="bg-transparent text-white/70 text-xs border-none outline-none cursor-pointer">
            {COMPANY_SIZES.map(s => <option key={s} value={s} className="bg-[#0a0a0f]">{s === 'All' ? 'All Sizes' : `${s} employees`}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <SlidersHorizontal size={13} className="text-white/30" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="bg-transparent text-white/70 text-xs border-none outline-none cursor-pointer">
            <option value="score" className="bg-[#0a0a0f]">Score</option>
            <option value="company" className="bg-[#0a0a0f]">Company</option>
            <option value="revenue" className="bg-[#0a0a0f]">Revenue</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-1 border border-white/[0.06] rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('grid')}
            className={`p-1.5 ${viewMode === 'grid' ? 'bg-white/[0.04] text-white' : 'text-white/30 hover:text-white/60'}`}>
            <LayoutGrid size={14} />
          </button>
          <button onClick={() => setViewMode('list')}
            className={`p-1.5 ${viewMode === 'list' ? 'bg-white/[0.04] text-white' : 'text-white/30 hover:text-white/60'}`}>
            <List size={14} />
          </button>
        </div>
        <Badge color="neon">{filtered.length} leads</Badge>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard icon={Users} label="Total Leads" value={filtered.length} sub="Matching filters" trend="+12%" />
        <StatCard icon={Target} label="High Intent" value={filtered.filter(l => l.intentScore === 'High').length} sub="Ready to buy" trend="+8%" color="#a855f7" />
        <StatCard icon={DollarSign} label="Pipeline Value" value={`$${(filtered.reduce((s, l) => s + parseFloat(l.revenue.replace(/[$MK,]/g, '')) * (l.revenue.includes('M') ? 1 : 0.001), 0)).toFixed(1)}M`} sub="Total addressable" trend="+24%" color="#3b82f6" />
        <StatCard icon={Flame} label="Avg Score" value={Math.round(filtered.reduce((s, l) => s + l.score, 0) / (filtered.length || 1))} sub="Lead quality" trend="+5%" color="#f59e0b" />
      </div>

      {/* Lead Cards */}
      <AnimatePresence mode="popLayout">
        <motion.div layout className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3' : 'flex flex-col gap-2'}>
          {filtered.map((lead, i) => {
            const breakdown = computeScoreBreakdown(lead);
            return (
            <motion.div
              key={lead.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.02, duration: 0.25 }}
              onClick={() => onSelectLead(lead)}
              className={`group relative rounded-xl border cursor-pointer transition-all duration-200
                ${selectedLead?.id === lead.id
                  ? 'border-[#00ff88]/40 bg-[#00ff88]/[0.04] shadow-[0_0_24px_rgba(0,255,136,0.06)]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                }
                ${viewMode === 'list' ? 'flex items-center gap-4 p-3' : 'p-4'}
              `}
            >
              {lead.intentScore === 'High' && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                </div>
              )}
              {flaggedLeads.has(lead.id) && (
                <div className="absolute top-2 right-6">
                  <Flag size={11} className="text-amber-400 fill-amber-400" />
                </div>
              )}

              <div className={viewMode === 'list' ? 'flex items-center gap-4 flex-1 min-w-0' : ''}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: NEON_DIM, color: NEON }}>
                    {lead.company.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{lead.company}</h4>
                    <p className="text-[11px] text-white/50 truncate">{lead.name} &middot; {lead.title}</p>
                  </div>
                  <ScoreRing score={lead.score} size={38} stroke={3} />
                </div>

                {viewMode === 'grid' && (
                  <>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge color="blue">{lead.industry}</Badge>
                      <Badge color="purple">{lead.source}</Badge>
                      <Badge color={lead.intentScore === 'High' ? 'emerald' : lead.intentScore === 'Medium' ? 'amber' : 'red'}>
                        {lead.intentScore} Intent
                      </Badge>
                    </div>

                    {/* Score Breakdown Mini */}
                    <div className="mb-3 p-2 rounded-lg border border-white/[0.04] bg-white/[0.01]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-white/30 font-medium">Score Breakdown</span>
                        <button onClick={e => { e.stopPropagation(); setWhyLeadId(whyLeadId === lead.id ? null : lead.id); }}
                          className="text-[10px] font-medium hover:underline" style={{ color: NEON }}>
                          {whyLeadId === lead.id ? 'Hide' : 'Why this lead?'}
                        </button>
                      </div>
                      <div className="flex gap-1">
                        {[
                          { label: 'Intent', val: breakdown.intent, max: 28, color: '#a855f7' },
                          { label: 'Tech', val: breakdown.techFit, max: 25, color: '#3b82f6' },
                          { label: 'Fund', val: breakdown.fundingRecency, max: 25, color: NEON },
                          { label: 'Growth', val: breakdown.growth, max: 25, color: '#f59e0b' },
                        ].map((s, si) => (
                          <div key={si} className="flex-1 text-center">
                            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-0.5">
                              <div className="h-full rounded-full" style={{ width: `${(s.val / s.max) * 100}%`, background: s.color }} />
                            </div>
                            <span className="text-[8px] text-white/30">{s.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <AnimatePresence>
                      {whyLeadId === lead.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden" onClick={e => e.stopPropagation()}>
                          <WhyThisLeadCard lead={lead} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="text-[11px]">
                        <span className="text-white/30">Revenue</span>
                        <p className="text-white font-semibold">{lead.revenue}</p>
                      </div>
                      <div className="text-[11px]">
                        <span className="text-white/30">Employees</span>
                        <p className="text-white font-semibold">{lead.employees}</p>
                      </div>
                      <div className="text-[11px]">
                        <span className="text-white/30">Growth</span>
                        <p className="text-emerald-400 font-semibold">{lead.growthRate}</p>
                      </div>
                      <div className="text-[11px]">
                        <span className="text-white/30">Location</span>
                        <p className="text-white font-semibold truncate">{lead.location}</p>
                      </div>
                    </div>

                    <div className="border-t border-white/[0.04] pt-2">
                      <p className="text-[10px] text-white/30 mb-1.5">Top Pain Points</p>
                      <div className="flex flex-col gap-1">
                        {lead.painPoints.slice(0, 2).map((pp, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <AlertTriangle size={10} className="text-amber-400 mt-0.5 shrink-0" />
                            <span className="text-[10px] text-white/50 leading-tight">{pp}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 mt-3 pt-2 border-t border-white/[0.04]">
                      <button
                        onClick={e => handleAddToSequence(e, lead.id)}
                        disabled={addedToSequence.has(lead.id)}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all
                          ${addedToSequence.has(lead.id) ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' : 'text-white/60 border border-white/[0.06] hover:bg-white/[0.04]'}`}>
                        {addedToSequence.has(lead.id) ? <><CheckCircle2 size={11} /> Sequenced</> : <><Send size={11} /> Sequence</>}
                      </button>
                      <button onClick={e => { e.stopPropagation(); }} className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-white/60 border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                        <Download size={11} /> Export
                      </button>
                      <button onClick={e => handleEnrich(e, lead.id)}
                        disabled={enrichedLeads.has(lead.id) || enrichingLead === lead.id}
                        className="flex items-center justify-center p-1.5 rounded-lg border border-white/[0.06] hover:bg-white/[0.04] transition-colors disabled:opacity-40"
                        title="Enrich lead data">
                        {enrichingLead === lead.id ? <Loader2 size={12} className="text-white/40 animate-spin" /> :
                          enrichedLeads.has(lead.id) ? <CheckCircle2 size={12} style={{ color: NEON }} /> :
                          <Sparkles size={12} className="text-white/40" />}
                      </button>
                      <button onClick={e => handleFlag(e, lead.id)}
                        className="flex items-center justify-center p-1.5 rounded-lg border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                        title="Flag lead">
                        <Flag size={12} className={flaggedLeads.has(lead.id) ? 'text-amber-400 fill-amber-400' : 'text-white/40'} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {viewMode === 'list' && (
                <>
                  <div className="hidden md:flex items-center gap-4 shrink-0">
                    <Badge color="blue">{lead.industry}</Badge>
                    <span className="text-xs text-white/60 w-16">{lead.revenue}</span>
                    <span className="text-xs text-emerald-400 w-12">{lead.growthRate}</span>
                    <Badge color={lead.intentScore === 'High' ? 'emerald' : lead.intentScore === 'Medium' ? 'amber' : 'red'}>
                      {lead.intentScore}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={e => handleAddToSequence(e, lead.id)} disabled={addedToSequence.has(lead.id)}
                      className="p-1.5 rounded-lg hover:bg-white/[0.04]" title="Add to sequence">
                      {addedToSequence.has(lead.id) ? <CheckCircle2 size={13} style={{ color: NEON }} /> : <Send size={13} className="text-white/40" />}
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-white/[0.04]" onClick={e => e.stopPropagation()} title="Export">
                      <Download size={13} className="text-white/40" />
                    </button>
                    <button onClick={e => handleEnrich(e, lead.id)} disabled={enrichedLeads.has(lead.id)}
                      className="p-1.5 rounded-lg hover:bg-white/[0.04]" title="Enrich">
                      {enrichedLeads.has(lead.id) ? <CheckCircle2 size={13} style={{ color: NEON }} /> : <Sparkles size={13} className="text-white/40" />}
                    </button>
                    <button onClick={e => handleFlag(e, lead.id)} className="p-1.5 rounded-lg hover:bg-white/[0.04]" title="Flag">
                      <Flag size={13} className={flaggedLeads.has(lead.id) ? 'text-amber-400 fill-amber-400' : 'text-white/40'} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <Search size={40} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">No leads found</p>
          <p className="text-xs mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: SEO Analysis
// ---------------------------------------------------------------------------
function SEOTab() {
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const handleAnalyze = useCallback(() => {
    if (!url) return;
    setAnalyzing(true);
    setTimeout(() => {
      const da = Math.floor(Math.random() * 40 + 30);
      setResults({
        url: url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        domainAuthority: da,
        pageAuthority: da - Math.floor(Math.random() * 10),
        spamScore: Math.floor(Math.random() * 8),
        totalBacklinks: Math.floor(Math.random() * 50000 + 500),
        referringDomains: Math.floor(Math.random() * 2000 + 50),
        organicKeywords: Math.floor(Math.random() * 15000 + 200),
        monthlyTraffic: `${(Math.random() * 500 + 5).toFixed(1)}K`,
        topPages: [
          { path: '/', traffic: '35%', keywords: 120 },
          { path: '/pricing', traffic: '18%', keywords: 45 },
          { path: '/blog', traffic: '22%', keywords: 340 },
          { path: '/features', traffic: '12%', keywords: 78 },
          { path: '/integrations', traffic: '8%', keywords: 56 },
        ],
        techStack: ['React', 'Vercel', 'Stripe', 'Intercom', 'Google Analytics', 'HubSpot'],
        loadTime: (Math.random() * 3 + 0.5).toFixed(2),
        mobileScore: Math.floor(Math.random() * 30 + 60),
        coreWebVitals: {
          lcp: (Math.random() * 2 + 1).toFixed(1),
          fid: Math.floor(Math.random() * 50 + 10),
          cls: (Math.random() * 0.15).toFixed(3),
        },
      });
      setAnalyzing(false);
    }, 1800);
  }, [url]);

  return (
    <div>
      {/* URL Input */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] focus-within:border-[#00ff88]/30">
          <Globe size={16} className="text-white/30 shrink-0" />
          <input
            type="text" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="Enter any URL to analyze (e.g., competitor.com)"
            className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
          />
        </div>
        <button onClick={handleAnalyze} disabled={analyzing || !url}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
          style={{ background: NEON, color: '#0a0a0f' }}>
          {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Scan size={16} />}
          {analyzing ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {!results && !analyzing && (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <BarChart3 size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium mb-1">Enter a URL to start SEO analysis</p>
          <p className="text-xs">Get domain authority, keywords, backlinks, traffic & more</p>
        </div>
      )}

      {analyzing && (
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
            <Radar size={48} style={{ color: NEON }} />
          </motion.div>
          <p className="text-sm text-white/50 mt-4">Analyzing {url}...</p>
          <div className="flex gap-3 mt-3">
            {['Crawling pages', 'Checking backlinks', 'Analyzing keywords'].map((t, i) => (
              <motion.div key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.6 }}>
                <Badge color={i === 0 ? 'emerald' : i === 1 ? 'blue' : 'purple'}>{t}</Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {results && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Domain Overview */}
          <SectionHeader icon={Globe} title={results.url} subtitle="Domain Overview" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard icon={Shield} label="Domain Authority" value={results.domainAuthority} color="#3b82f6" />
            <StatCard icon={Link2} label="Backlinks" value={results.totalBacklinks.toLocaleString()} color="#a855f7" />
            <StatCard icon={Hash} label="Organic Keywords" value={results.organicKeywords.toLocaleString()} color={NEON} />
            <StatCard icon={Eye} label="Monthly Traffic" value={results.monthlyTraffic} color="#f59e0b" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Core Web Vitals */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <SectionHeader icon={Activity} title="Core Web Vitals" />
              <div className="space-y-3">
                {[
                  { label: 'LCP (Largest Contentful Paint)', value: `${results.coreWebVitals.lcp}s`, good: parseFloat(results.coreWebVitals.lcp) < 2.5 },
                  { label: 'FID (First Input Delay)', value: `${results.coreWebVitals.fid}ms`, good: results.coreWebVitals.fid < 100 },
                  { label: 'CLS (Cumulative Layout Shift)', value: results.coreWebVitals.cls, good: parseFloat(results.coreWebVitals.cls) < 0.1 },
                  { label: 'Page Load Time', value: `${results.loadTime}s`, good: parseFloat(results.loadTime) < 2 },
                  { label: 'Mobile Score', value: `${results.mobileScore}/100`, good: results.mobileScore >= 80 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-white/50">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{item.value}</span>
                      {item.good ? <CheckCircle2 size={13} className="text-emerald-400" /> : <AlertCircle size={13} className="text-amber-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Pages */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <SectionHeader icon={FileText} title="Top Pages by Traffic" />
              <div className="space-y-2">
                {results.topPages.map((page, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/20 w-4">{i + 1}.</span>
                      <span className="text-xs text-white/70 font-mono">{page.path}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-white/40">{page.keywords} kw</span>
                      <span className="text-[11px] font-semibold" style={{ color: NEON }}>{page.traffic}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Keyword Opportunities */}
          <SectionHeader icon={Target} title="Keyword Opportunities" subtitle="Top ranking opportunities based on competitor analysis" />
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden mb-6">
            <div className="grid grid-cols-4 gap-4 px-4 py-2 border-b border-white/[0.06] text-[10px] text-white/30 uppercase tracking-wider font-semibold">
              <span>Keyword</span><span className="text-right">Search Volume</span><span className="text-right">Difficulty</span><span className="text-right">Opportunity</span>
            </div>
            {SEO_METRICS.topKeywords.map((kw, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 px-4 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <span className="text-xs text-white/70">{kw.keyword}</span>
                <span className="text-xs text-white/50 text-right">{kw.volume.toLocaleString()}</span>
                <div className="flex items-center justify-end gap-2">
                  <div className="w-12 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${kw.difficulty}%`, background: kw.difficulty > 70 ? '#ef4444' : kw.difficulty > 50 ? '#f59e0b' : NEON }} />
                  </div>
                  <span className="text-[11px] text-white/40 w-6 text-right">{kw.difficulty}</span>
                </div>
                <div className="text-right">
                  <Badge color={kw.difficulty < 50 ? 'emerald' : kw.difficulty < 70 ? 'amber' : 'red'}>
                    {kw.difficulty < 50 ? 'Easy' : kw.difficulty < 70 ? 'Medium' : 'Hard'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Competitor Comparison */}
          <SectionHeader icon={Crosshair} title="Competitor Landscape" subtitle="How the domain stacks up against competitors" />
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-4 py-2 border-b border-white/[0.06] text-[10px] text-white/30 uppercase tracking-wider font-semibold">
              <span>Domain</span><span className="text-right">DA</span><span className="text-right">Traffic</span><span className="text-right">Keywords</span><span className="text-right">Overlap</span>
            </div>
            {SEO_METRICS.competitors.map((c, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 px-4 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-white/[0.06] flex items-center justify-center text-[9px] text-white/30 font-bold">{i + 1}</div>
                  <span className="text-xs text-white/70">{c.domain}</span>
                </div>
                <span className="text-xs text-white/60 text-right font-semibold">{c.da}</span>
                <span className="text-xs text-white/50 text-right">{c.traffic}</span>
                <span className="text-xs text-white/50 text-right">{c.keywords.toLocaleString()}</span>
                <div className="flex items-center justify-end gap-2">
                  <div className="w-10 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.overlap}%`, background: NEON }} />
                  </div>
                  <span className="text-[11px] text-white/40">{c.overlap}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tech Stack */}
          <div className="mt-6">
            <SectionHeader icon={Code} title="Detected Tech Stack" />
            <div className="flex flex-wrap gap-2">
              {results.techStack.map((tech, i) => (
                <motion.div key={tech} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                  <Badge color="cyan">{tech}</Badge>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pain Point Categorization & Severity Engine
// ---------------------------------------------------------------------------
const PAIN_CATEGORIES = {
  Tech: { icon: Cpu, color: '#3b82f6', keywords: ['api', 'tech', 'legacy', 'erp', 'stack', 'integration', 'code', 'documentation', 'mobile app', 'app', 'ml', 'ai'] },
  Process: { icon: Wrench, color: '#f59e0b', keywords: ['manual', 'paper', 'fax', 'scheduling', 'booking', 'tracking', 'time', 'reconciliation', 'coordination', 'billing'] },
  Growth: { icon: TrendingUp, color: NEON, keywords: ['seo', 'content', 'marketing', 'email', 'traffic', 'influencer', 'lead', 'outbound', 'growth', 'acquisition', 'conversion', 'onboarding', 'churn', 'trial', 'freemium'] },
  Operations: { icon: Settings, color: '#a855f7', keywords: ['crm', 'pipeline', 'follow-up', 'reporting', 'automation', 'management', 'system', 'portal', 'dashboard', 'notification'] },
};

function categorizePainPoint(pp) {
  const lower = pp.toLowerCase();
  for (const [cat, { keywords }] of Object.entries(PAIN_CATEGORIES)) {
    if (keywords.some(k => lower.includes(k))) return cat;
  }
  return 'Operations';
}

function scoreSeverity(pp) {
  const lower = pp.toLowerCase();
  if (lower.includes('no ') || lower.includes('zero') || lower.includes('missing') || lower.includes('none') || lower.includes('outdated')) return 'Critical';
  if (lower.includes('low') || lower.includes('slow') || lower.includes('poor') || lower.includes('gap') || lower.includes('high churn') || lower.includes('manual')) return 'High';
  if (lower.includes('inconsistent') || lower.includes('limited') || lower.includes('basic')) return 'Medium';
  return 'Medium';
}

const SEVERITY_CONFIG = {
  Critical: { color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Critical', weight: 3 },
  High: { color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'High', weight: 2 },
  Medium: { color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Medium', weight: 1 },
  Low: { color: NEON, bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Low', weight: 0 },
};

const SOLUTION_MAP = {
  'no outbound': { solution: 'Automated multi-touch outbound sequences', positioning: 'Our platform automates email, LinkedIn, and call sequences - typically adding 20-40% to pipeline within 90 days.' },
  'manual': { solution: 'Workflow automation & process digitization', positioning: 'Eliminate manual work with our automation engine. Clients save 15-25 hours/week on average.' },
  'no crm': { solution: 'Integrated CRM with pipeline management', positioning: 'All-in-one CRM that auto-captures leads and tracks every touchpoint. Zero data entry required.' },
  'no online': { solution: 'Digital booking & scheduling system', positioning: 'Self-serve booking that integrates with your calendar. Increases appointments by 35% on average.' },
  'seo': { solution: 'SEO & content strategy implementation', positioning: 'Our growth engine identifies high-intent keywords and generates optimized content at scale.' },
  'churn': { solution: 'Customer health scoring & retention automation', positioning: 'Predict at-risk accounts 30 days early with AI-powered health scores and automated win-back campaigns.' },
  'onboarding': { solution: 'Interactive product-led onboarding', positioning: 'Guided onboarding flows that increase activation by 2-3x. No engineering required.' },
  'no email': { solution: 'Email marketing automation suite', positioning: 'Automated drip campaigns, segmentation, and A/B testing. Average 3.5x ROI in first quarter.' },
  'legacy': { solution: 'Modern architecture migration', positioning: 'Incremental migration path from legacy systems with zero downtime. Typical 40% cost reduction.' },
  'no lead': { solution: 'Inbound lead capture & enrichment', positioning: 'Smart forms, lead magnets, and real-time enrichment. Captures 3x more leads from existing traffic.' },
  'paper': { solution: 'Digital forms & document management', positioning: 'Paperless workflows with e-signatures and auto-filing. Reduce processing time by 80%.' },
  'no mobile': { solution: 'Mobile-first app development', positioning: 'Cross-platform mobile app with offline support. Engage users 4x more frequently.' },
};

function getSolution(pp) {
  const lower = pp.toLowerCase();
  for (const [key, val] of Object.entries(SOLUTION_MAP)) {
    if (lower.includes(key)) return val;
  }
  return { solution: 'Custom solution assessment needed', positioning: 'Our team can evaluate this specific challenge and propose a tailored solution within 48 hours.' };
}

// ---------------------------------------------------------------------------
// Tab: Pain Points
// ---------------------------------------------------------------------------
function PainPointsTab({ leads }) {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchUrl, setSearchUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');

  const enrichedPainPoints = useMemo(() => {
    const all = [];
    leads.forEach(l => {
      l.painPoints.forEach(pp => {
        const category = categorizePainPoint(pp);
        const severity = scoreSeverity(pp);
        const solution = getSolution(pp);
        all.push({ text: pp, category, severity, company: l.company, companyId: l.id, industry: l.industry, revenue: l.revenue, solution });
      });
    });
    all.sort((a, b) => (SEVERITY_CONFIG[b.severity]?.weight || 0) - (SEVERITY_CONFIG[a.severity]?.weight || 0));
    return all;
  }, [leads]);

  const painCategories = useMemo(() => {
    const cats = { Tech: 0, Process: 0, Growth: 0, Operations: 0 };
    enrichedPainPoints.forEach(pp => { cats[pp.category] = (cats[pp.category] || 0) + 1; });
    return cats;
  }, [enrichedPainPoints]);

  const filteredPainPoints = useMemo(() => {
    if (categoryFilter === 'All') return enrichedPainPoints;
    return enrichedPainPoints.filter(pp => pp.category === categoryFilter);
  }, [enrichedPainPoints, categoryFilter]);

  const severityDist = useMemo(() => {
    const dist = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    enrichedPainPoints.forEach(pp => { dist[pp.severity] = (dist[pp.severity] || 0) + 1; });
    return dist;
  }, [enrichedPainPoints]);

  const handleScan = useCallback(() => {
    if (!searchUrl) return;
    setScanning(true);
    setTimeout(() => {
      setScanResult({
        url: searchUrl,
        overallHealth: Math.floor(Math.random() * 30 + 40),
        painPoints: [
          { category: 'Growth', severity: 'Critical', detail: 'No live chat or chatbot detected. Average response time estimated at 24-48 hours.', revenue_impact: '$120K-$180K/yr lost', fix: 'Implement Intercom or Drift chatbot', positioning: 'Our AI chatbot integration reduces response time to under 30 seconds, converting 18% more visitors.' },
          { category: 'Growth', severity: 'High', detail: 'Blog has not been updated in 4+ months. Competitors publish 3-4x/week.', revenue_impact: '$80K-$150K/yr organic traffic value', fix: 'Content calendar with 2-3 posts/week', positioning: 'Our content engine generates SEO-optimized content at scale. Clients see 3x organic traffic in 6 months.' },
          { category: 'Growth', severity: 'Critical', detail: 'No lead magnets, gated content, or email capture forms beyond basic contact form.', revenue_impact: '$200K-$400K/yr pipeline', fix: 'Add exit-intent popups, lead magnets, free tools', positioning: 'Smart lead capture with our platform captures 3-5x more leads from existing traffic.' },
          { category: 'Tech', severity: 'Medium', detail: 'Mobile pagespeed score of 42/100. CTAs not optimized for thumb zones.', revenue_impact: '$50K-$90K/yr mobile conversions', fix: 'Mobile-first redesign, optimize images', positioning: 'Our mobile optimization service delivers 90+ PageSpeed scores, boosting mobile conversion by 40%.' },
          { category: 'Process', severity: 'High', detail: 'No case studies, testimonials, or trust badges visible on key pages.', revenue_impact: '$100K-$200K/yr conversion lift', fix: 'Add testimonials, logos, case studies above fold', positioning: 'Our social proof toolkit auto-generates and displays trust elements, lifting conversions 15-30%.' },
          { category: 'Operations', severity: 'Medium', detail: 'Pricing page requires "Contact Us" - no transparent pricing. Losing self-serve buyers.', revenue_impact: '$150K-$300K/yr self-serve revenue', fix: 'Add transparent pricing with free trial CTA', positioning: 'Our pricing optimization module tests pricing structures and maximizes self-serve conversion.' },
        ],
        competitors: [
          { name: 'Competitor A', advantages: ['Better SEO', 'Freemium model', 'API marketplace'] },
          { name: 'Competitor B', advantages: ['Stronger brand', 'More integrations', 'Community'] },
        ],
      });
      setScanning(false);
    }, 2200);
  }, [searchUrl]);

  return (
    <div>
      {/* URL Scanner */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] focus-within:border-[#00ff88]/30">
          <Brain size={16} className="text-white/30 shrink-0" />
          <input
            type="text" value={searchUrl} onChange={e => setSearchUrl(e.target.value)}
            placeholder="Enter a business URL or company name to analyze pain points..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
            onKeyDown={e => e.key === 'Enter' && handleScan()}
          />
        </div>
        <button onClick={handleScan} disabled={scanning || !searchUrl}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
          style={{ background: NEON, color: '#0a0a0f' }}>
          {scanning ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {scanning ? 'Scanning...' : 'Analyze'}
        </button>
      </div>

      {/* Category Overview with interactive filters */}
      <SectionHeader icon={AlertTriangle} title="Pain Point Distribution" subtitle={`Across ${leads.length} discovered businesses`} />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => setCategoryFilter('All')}
          className={`rounded-xl border p-3 text-center cursor-pointer transition-all ${categoryFilter === 'All' ? 'border-white/20 bg-white/[0.05]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'}`}>
          <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center bg-white/[0.06]">
            <Layers size={16} className="text-white/50" />
          </div>
          <p className="text-lg font-bold text-white">{enrichedPainPoints.length}</p>
          <p className="text-[10px] text-white/40">All</p>
        </motion.div>
        {Object.entries(painCategories).map(([cat, count]) => {
          const config = PAIN_CATEGORIES[cat];
          const CatIcon = config?.icon || Layers;
          const catColor = config?.color || '#fff';
          return (
            <motion.div key={cat} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => setCategoryFilter(categoryFilter === cat ? 'All' : cat)}
              className={`rounded-xl border p-3 text-center cursor-pointer transition-all ${categoryFilter === cat ? `border-white/20 bg-white/[0.05]` : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'}`}>
              <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ background: `${catColor}15` }}>
                <CatIcon size={16} style={{ color: catColor }} />
              </div>
              <p className="text-lg font-bold text-white">{count}</p>
              <p className="text-[10px] text-white/40">{cat}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Severity Distribution */}
      <div className="flex items-center gap-3 mb-6 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold shrink-0">Severity</span>
        <div className="flex-1 flex items-center gap-2">
          {Object.entries(severityDist).map(([sev, count]) => {
            const cfg = SEVERITY_CONFIG[sev];
            if (!count) return null;
            return (
              <div key={sev} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                <span className="text-[11px] text-white/50">{sev}</span>
                <span className="text-[11px] font-bold text-white">{count}</span>
              </div>
            );
          })}
        </div>
        <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden flex">
          {Object.entries(severityDist).map(([sev, count]) => {
            if (!count) return null;
            const cfg = SEVERITY_CONFIG[sev];
            return (
              <div key={sev} className="h-full" style={{ width: `${(count / enrichedPainPoints.length) * 100}%`, background: cfg.color }} />
            );
          })}
        </div>
      </div>

      {/* Scan Results */}
      {scanning && (
        <div className="flex flex-col items-center justify-center py-16">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <Brain size={48} style={{ color: NEON }} />
          </motion.div>
          <p className="text-sm text-white/50 mt-4">AI is analyzing business pain points...</p>
          <div className="flex gap-2 mt-3">
            {['Scanning pages', 'Analyzing competitors', 'Finding gaps'].map((t, i) => (
              <motion.div key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.7 }}>
                <Badge color={i === 0 ? 'cyan' : i === 1 ? 'purple' : 'amber'}>{t}</Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {scanResult && !scanning && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <SectionHeader icon={Sparkles} title={`Analysis: ${scanResult.url}`}
            subtitle={`Business health score: ${scanResult.overallHealth}/100`}
            action={<ScoreRing score={scanResult.overallHealth} size={48} stroke={4} />} />

          <div className="space-y-3 mb-6">
            {scanResult.painPoints.map((pp, i) => {
              const cfg = SEVERITY_CONFIG[pp.severity];
              const catConfig = PAIN_CATEGORIES[pp.category];
              const CatIcon = catConfig?.icon || Layers;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.12] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${catConfig?.color || '#fff'}15` }}>
                        <CatIcon size={12} style={{ color: catConfig?.color || '#fff' }} />
                      </div>
                      <Badge color={pp.severity === 'Critical' ? 'red' : pp.severity === 'High' ? 'amber' : 'blue'}>{pp.severity}</Badge>
                      <span className="text-sm font-semibold text-white">{pp.category}</span>
                    </div>
                    <span className="text-xs font-semibold text-red-400">{pp.revenue_impact}</span>
                  </div>
                  {/* Severity visual indicator */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map(n => (
                        <div key={n} className="w-6 h-1 rounded-full" style={{ background: n <= (cfg?.weight || 1) ? cfg.color : 'rgba(255,255,255,0.06)' }} />
                      ))}
                    </div>
                    <span className="text-[10px] text-white/30">Impact Level</span>
                  </div>
                  <p className="text-xs text-white/50 mb-3">{pp.detail}</p>
                  <div className="flex items-start gap-2 pt-2 border-t border-white/[0.04] mb-2">
                    <Lightbulb size={12} style={{ color: NEON }} className="mt-0.5 shrink-0" />
                    <span className="text-[11px]" style={{ color: NEON }}>{pp.fix}</span>
                  </div>
                  {pp.positioning && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-[#00ff88]/[0.04] border border-[#00ff88]/10">
                      <Target size={11} style={{ color: NEON }} className="mt-0.5 shrink-0" />
                      <span className="text-[10px] text-white/50">{pp.positioning}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Categorized Pain Points from Lead Database */}
      <SectionHeader icon={Building2} title={`Pain Points${categoryFilter !== 'All' ? ` - ${categoryFilter}` : ''}`}
        subtitle={`${filteredPainPoints.length} issues across ${leads.length} businesses`} />
      <div className="space-y-2 mb-6">
        {filteredPainPoints.slice(0, 20).map((pp, i) => {
          const cfg = SEVERITY_CONFIG[pp.severity];
          const catConfig = PAIN_CATEGORIES[pp.category];
          const CatIcon = catConfig?.icon || Layers;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:border-white/[0.12] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: `${catConfig?.color || '#fff'}15` }}>
                  <CatIcon size={13} style={{ color: catConfig?.color || '#fff' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-white">{pp.text}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30">{pp.company}</span>
                    <span className="text-[10px] text-white/20">|</span>
                    <span className="text-[10px] text-white/30">{pp.industry}</span>
                    <span className="text-[10px] text-white/20">|</span>
                    <span className="text-[10px] text-white/30">{pp.revenue}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="w-4 h-1 rounded-full" style={{ background: n <= (cfg?.weight || 1) ? cfg.color : 'rgba(255,255,255,0.06)' }} />
                    ))}
                  </div>
                  <Badge color={pp.severity === 'Critical' ? 'red' : pp.severity === 'High' ? 'amber' : 'blue'}>{pp.severity}</Badge>
                </div>
              </div>
              {/* Solution suggestion */}
              <div className="mt-2 pt-2 border-t border-white/[0.04]">
                <div className="flex items-start gap-2 mb-1">
                  <Wrench size={10} style={{ color: NEON }} className="mt-0.5 shrink-0" />
                  <span className="text-[10px] font-medium" style={{ color: NEON }}>{pp.solution.solution}</span>
                </div>
                <p className="text-[10px] text-white/35 pl-[18px]">{pp.solution.positioning}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Company Pain Points (expandable) */}
      <SectionHeader icon={Building2} title="Company Pain Point Database" subtitle="Click a company to see detailed analysis" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {leads.slice(0, 8).map((lead) => (
          <div key={lead.id}
            onClick={() => setSelectedCompany(selectedCompany?.id === lead.id ? null : lead)}
            className={`rounded-xl border p-3 cursor-pointer transition-all ${selectedCompany?.id === lead.id ? 'border-[#00ff88]/30 bg-[#00ff88]/[0.03]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ background: NEON_DIM, color: NEON }}>
                  {lead.company.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{lead.company}</p>
                  <p className="text-[10px] text-white/40">{lead.industry} &middot; {lead.revenue}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge color="red">{lead.painPoints.length} issues</Badge>
                {selectedCompany?.id === lead.id ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
              </div>
            </div>
            <AnimatePresence>
              {selectedCompany?.id === lead.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">
                  <div className="pt-2 border-t border-white/[0.06] space-y-2">
                    {lead.painPoints.map((pp, i) => {
                      const cat = categorizePainPoint(pp);
                      const sev = scoreSeverity(pp);
                      const sol = getSolution(pp);
                      const sevCfg = SEVERITY_CONFIG[sev];
                      const catConfig = PAIN_CATEGORIES[cat];
                      const CatIcon = catConfig?.icon || Layers;
                      return (
                        <div key={i} className="p-2 rounded-lg border border-white/[0.04] bg-white/[0.01]">
                          <div className="flex items-center gap-2 mb-1">
                            <CatIcon size={10} style={{ color: catConfig?.color || '#fff' }} />
                            <Badge color={sev === 'Critical' ? 'red' : sev === 'High' ? 'amber' : 'blue'}>{sev}</Badge>
                            <span className="text-[10px] text-white/30">{cat}</span>
                          </div>
                          <p className="text-[11px] text-white/60 mb-1">{pp}</p>
                          <div className="flex items-start gap-1.5 pt-1 border-t border-white/[0.03]">
                            <Lightbulb size={9} style={{ color: NEON }} className="mt-0.5 shrink-0" />
                            <span className="text-[9px] text-white/40">{sol.positioning}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-2 flex flex-wrap gap-1">
                      {lead.techStack.map(t => <Badge key={t} color="cyan">{t}</Badge>)}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue Gap Estimator & ROI Calculator
// ---------------------------------------------------------------------------
const REVENUE_GAP_ESTIMATES = {
  'upsell': { low: 80000, high: 200000, label: 'Upsell Revenue', competitor: 'Top SaaS companies generate 30-40% of revenue from expansion' },
  'subscription': { low: 120000, high: 350000, label: 'Recurring Revenue', competitor: 'Subscription models have 3-5x higher LTV than one-time purchases' },
  'self-serve': { low: 150000, high: 400000, label: 'Self-Serve Revenue', competitor: 'Product-led companies convert 25% of free users to paid' },
  'billing': { low: 60000, high: 180000, label: 'Billing Optimization', competitor: 'Annual billing uplift is typically 20-30% of MRR' },
  'marketplace': { low: 200000, high: 600000, label: 'Ecosystem Revenue', competitor: 'Platform marketplaces can represent 15-25% of total revenue' },
  'wholesale': { low: 100000, high: 300000, label: 'B2B Channel', competitor: 'B2B wholesale adds 40-60% revenue for D2C brands' },
  'referral': { low: 50000, high: 150000, label: 'Viral Growth', competitor: 'Referral programs deliver 25-35% of new customers for top companies' },
  'automation': { low: 80000, high: 250000, label: 'Process Automation', competitor: 'Automated workflows reduce cost-to-serve by 40-60%' },
  'maintenance': { low: 70000, high: 200000, label: 'Recurring Services', competitor: 'Maintenance plans generate 2-3x lifetime value' },
  'partner': { low: 100000, high: 400000, label: 'Partner Channel', competitor: 'Channel partnerships drive 30-50% of revenue for mature companies' },
  'white-label': { low: 150000, high: 500000, label: 'White-Label Revenue', competitor: 'White-label programs expand TAM by 3-5x with zero CAC' },
  'portal': { low: 60000, high: 180000, label: 'Customer Portal', competitor: 'Self-service portals reduce support costs 25-40%' },
  'default': { low: 50000, high: 150000, label: 'Revenue Opportunity', competitor: 'Industry benchmarks suggest 15-25% uplift from addressing this gap' },
};

function estimateGapRevenue(gap) {
  const lower = gap.toLowerCase();
  for (const [key, val] of Object.entries(REVENUE_GAP_ESTIMATES)) {
    if (key !== 'default' && lower.includes(key)) return val;
  }
  if (lower.includes('recurring') || lower.includes('plan') || lower.includes('membership')) return REVENUE_GAP_ESTIMATES.subscription;
  if (lower.includes('no ') || lower.includes('missing')) return REVENUE_GAP_ESTIMATES.default;
  return REVENUE_GAP_ESTIMATES.default;
}

function ROICalculator({ gap, estimate }) {
  const [investmentK, setInvestmentK] = useState(25);
  const annualReturn = estimate.low + (estimate.high - estimate.low) * 0.4;
  const roi = Math.round(((annualReturn - investmentK * 1000) / (investmentK * 1000)) * 100);
  const payback = Math.round((investmentK * 1000 / (annualReturn / 12)) * 10) / 10;

  return (
    <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] mt-2">
      <div className="flex items-center gap-2 mb-2">
        <Calculator size={12} style={{ color: NEON }} />
        <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">ROI Calculator</span>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[10px] text-white/40 shrink-0">Investment:</span>
        <input type="range" min={5} max={100} value={investmentK} onChange={e => setInvestmentK(Number(e.target.value))}
          className="flex-1 h-1 appearance-none bg-white/[0.08] rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00ff88]" />
        <span className="text-xs font-bold text-white w-12 text-right">${investmentK}K</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-1.5 rounded bg-white/[0.02]">
          <p className="text-sm font-bold" style={{ color: roi > 0 ? NEON : '#ef4444' }}>{roi}%</p>
          <p className="text-[9px] text-white/30">Annual ROI</p>
        </div>
        <div className="text-center p-1.5 rounded bg-white/[0.02]">
          <p className="text-sm font-bold text-white">{payback}mo</p>
          <p className="text-[9px] text-white/30">Payback Period</p>
        </div>
        <div className="text-center p-1.5 rounded bg-white/[0.02]">
          <p className="text-sm font-bold text-emerald-400">${Math.round(annualReturn / 1000)}K</p>
          <p className="text-[9px] text-white/30">Est. Return/yr</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Revenue Scanner
// ---------------------------------------------------------------------------
function RevenueScannerTab({ leads }) {
  const [scanUrl, setScanUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [expandedGap, setExpandedGap] = useState(null);
  const [showROI, setShowROI] = useState(null);

  const totalOpportunity = useMemo(() => {
    return leads.reduce((sum, l) => sum + l.revenueGaps.length * 85000, 0);
  }, [leads]);

  const gapsByCategory = useMemo(() => {
    const cats = {};
    leads.forEach(l => {
      l.revenueGaps.forEach(gap => {
        const est = estimateGapRevenue(gap);
        const cat = est.label;
        if (!cats[cat]) cats[cat] = { gaps: [], totalLow: 0, totalHigh: 0, companies: new Set() };
        cats[cat].gaps.push({ text: gap, company: l.company, revenue: l.revenue, industry: l.industry, estimate: est });
        cats[cat].totalLow += est.low;
        cats[cat].totalHigh += est.high;
        cats[cat].companies.add(l.company);
      });
    });
    return Object.entries(cats).sort((a, b) => b[1].totalHigh - a[1].totalHigh);
  }, [leads]);

  const handleScan = useCallback(() => {
    if (!scanUrl) return;
    setScanning(true);
    setTimeout(() => {
      setScanData({
        url: scanUrl,
        totalOpportunity: '$1.2M - $2.4M',
        routes: [
          { path: '/pricing', issue: 'No annual billing toggle - missing 20-30% revenue uplift', impact: '$180K-$360K/yr', priority: 'Critical', competitorNote: 'HubSpot, Salesforce, and 92% of top SaaS companies offer annual billing discounts' },
          { path: '/signup', issue: 'No freemium tier, forcing demo-only flow. Losing 70% of self-serve buyers', impact: '$400K-$800K/yr', priority: 'Critical', competitorNote: 'Slack, Notion, and Figma all grew via freemium. PLG companies grow 2.4x faster.' },
          { path: '/features', issue: 'No comparison tables vs competitors. Visitors leaving for competitor pricing pages', impact: '$100K-$200K/yr', priority: 'High', competitorNote: 'Monday.com and Pipedrive feature comparison pages rank top 3 for buyer keywords' },
          { path: '/integrations', issue: 'Only 12 integrations listed. Market leader has 200+. Missing Zapier/Make integration page', impact: '$150K-$300K/yr', priority: 'High', competitorNote: 'Companies with 50+ integrations retain customers 34% longer' },
          { path: '/blog', issue: 'No gated content, lead magnets, or content upgrades. All traffic is leaking', impact: '$80K-$150K/yr', priority: 'Medium', competitorNote: 'Ahrefs and HubSpot attribute 60%+ of pipeline to content-driven leads' },
          { path: '/api', issue: 'No developer documentation or API playground. Missing developer-led growth channel', impact: '$200K-$500K/yr', priority: 'High', competitorNote: 'Stripe and Twilio built billion-dollar businesses on developer experience' },
          { path: '/ (homepage)', issue: 'No social proof above fold. No live customer count or usage metrics displayed', impact: '$50K-$100K/yr', priority: 'Medium', competitorNote: 'Pages with social proof convert 15% higher than those without (Unbounce data)' },
        ],
        components: [
          { name: 'Onboarding Flow', status: 'Missing', detail: 'No interactive product tour. 65% of signups never complete setup.', fix: 'Add Appcues/Userflow-style guided onboarding', roi: { investment: 15000, annualReturn: 180000 } },
          { name: 'Usage Metering', status: 'Missing', detail: 'No usage-based pricing signals. Cannot monetize power users.', fix: 'Implement usage tracking and tiered limits', roi: { investment: 25000, annualReturn: 250000 } },
          { name: 'In-App Upsell', status: 'Missing', detail: 'No upgrade prompts when users hit feature limits.', fix: 'Add contextual upgrade CTAs at limit boundaries', roi: { investment: 8000, annualReturn: 120000 } },
          { name: 'Referral System', status: 'Missing', detail: 'No viral loops. Missing referral credits/rewards program.', fix: 'Launch double-sided referral program', roi: { investment: 12000, annualReturn: 150000 } },
          { name: 'Customer Health Score', status: 'Missing', detail: 'No churn prediction. Reactive support model.', fix: 'Build health score dashboard with automated alerts', roi: { investment: 20000, annualReturn: 200000 } },
        ],
        appDeficits: [
          { area: 'Mobile App', detail: 'No native mobile app detected. Competitors all have iOS/Android apps.', effort: 'High', roi: '$300K+/yr', competitorNote: 'Competitors with mobile apps see 3x daily engagement' },
          { area: 'API Marketplace', detail: 'No third-party app/integration marketplace for ecosystem revenue.', effort: 'High', roi: '$500K+/yr', competitorNote: 'Shopify generates $4B+/yr from its app marketplace ecosystem' },
          { area: 'Webhooks', detail: 'No webhook support for real-time event streaming to customer systems.', effort: 'Low', roi: '$50K-$100K/yr', competitorNote: 'Enterprise buyers list webhook support as a top-5 requirement' },
          { area: 'White-Label', detail: 'No white-label or reseller program for agency/partner distribution.', effort: 'Medium', roi: '$200K-$400K/yr', competitorNote: 'GoHighLevel built a $1B business primarily through white-label distribution' },
        ],
      });
      setScanning(false);
    }, 2500);
  }, [scanUrl]);

  return (
    <div>
      {/* URL Scanner */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] focus-within:border-[#00ff88]/30">
          <DollarSign size={16} className="text-white/30 shrink-0" />
          <input
            type="text" value={scanUrl} onChange={e => setScanUrl(e.target.value)}
            placeholder="Enter URL to scan for revenue deficits and monetization gaps..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
            onKeyDown={e => e.key === 'Enter' && handleScan()}
          />
        </div>
        <button onClick={handleScan} disabled={scanning || !scanUrl}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
          style={{ background: NEON, color: '#0a0a0f' }}>
          {scanning ? <Loader2 size={16} className="animate-spin" /> : <Scan size={16} />}
          {scanning ? 'Scanning...' : 'Scan Revenue'}
        </button>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={DollarSign} label="Total Opportunity" value={`$${(totalOpportunity / 1000000).toFixed(1)}M`} sub="Across all leads" color={NEON} />
        <StatCard icon={AlertTriangle} label="Revenue Gaps" value={leads.reduce((s, l) => s + l.revenueGaps.length, 0)} sub="Identified deficits" color="#ef4444" />
        <StatCard icon={Gem} label="Avg per Company" value={`$${Math.round(totalOpportunity / leads.length / 1000)}K`} sub="Revenue opportunity" color="#a855f7" />
        <StatCard icon={Rocket} label="Quick Wins" value={Math.floor(leads.length * 1.5)} sub="Low-effort fixes" color="#3b82f6" />
      </div>

      {/* Scan results */}
      {scanning && (
        <div className="flex flex-col items-center justify-center py-16">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>
            <DollarSign size={48} style={{ color: NEON }} />
          </motion.div>
          <p className="text-sm text-white/50 mt-4">Scanning routes and components for revenue gaps...</p>
        </div>
      )}

      {scanData && !scanning && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/[0.03] p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Total Revenue Opportunity Detected</p>
                <p className="text-[11px] text-white/40">{scanData.url}</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: NEON }}>{scanData.totalOpportunity}</p>
            </div>
          </div>

          {/* Route Deficits with competitor comparison */}
          <SectionHeader icon={Globe} title="Route-Level Revenue Deficits" subtitle={`${scanData.routes.length} revenue leaks identified`} />
          <div className="space-y-2 mb-6">
            {scanData.routes.map((route, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] text-white/50 bg-white/[0.04] px-1.5 py-0.5 rounded font-mono">{route.path}</code>
                    <Badge color={route.priority === 'Critical' ? 'red' : route.priority === 'High' ? 'amber' : 'blue'}>{route.priority}</Badge>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">{route.impact}</span>
                </div>
                <p className="text-xs text-white/50 mb-2">{route.issue}</p>
                {route.competitorNote && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-500/[0.06] border border-purple-500/10">
                    <Crosshair size={10} className="text-purple-400 mt-0.5 shrink-0" />
                    <span className="text-[10px] text-purple-300/70">{route.competitorNote}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Component Deficits with ROI */}
          <SectionHeader icon={Layers} title="Missing Revenue Components" subtitle="Product features with projected ROI" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {scanData.components.map((comp, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">{comp.name}</span>
                  <Badge color="red">{comp.status}</Badge>
                </div>
                <p className="text-xs text-white/50 mb-2">{comp.detail}</p>
                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04] mb-2">
                  <Wrench size={11} style={{ color: NEON }} />
                  <span className="text-[11px] text-white/60">{comp.fix}</span>
                </div>
                {comp.roi && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-center flex-1">
                      <p className="text-[10px] text-white/30">Investment</p>
                      <p className="text-xs font-bold text-white">${(comp.roi.investment / 1000).toFixed(0)}K</p>
                    </div>
                    <ArrowRight size={12} className="text-white/20" />
                    <div className="text-center flex-1">
                      <p className="text-[10px] text-white/30">Annual Return</p>
                      <p className="text-xs font-bold text-emerald-400">${(comp.roi.annualReturn / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-[10px] text-white/30">ROI</p>
                      <p className="text-xs font-bold" style={{ color: NEON }}>{Math.round((comp.roi.annualReturn / comp.roi.investment - 1) * 100)}%</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* App Deficits with competitor comparison */}
          <SectionHeader icon={Database} title="App-Level Deficits" subtitle="Platform gaps vs. competitors" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scanData.appDeficits.map((def, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-semibold text-white">{def.area}</span>
                  <div className="flex items-center gap-2">
                    <Badge color={def.effort === 'Low' ? 'emerald' : def.effort === 'Medium' ? 'amber' : 'red'}>{def.effort} effort</Badge>
                  </div>
                </div>
                <p className="text-xs text-white/50 mb-2">{def.detail}</p>
                {def.competitorNote && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-500/[0.06] border border-purple-500/10 mb-2">
                    <Crosshair size={10} className="text-purple-400 mt-0.5 shrink-0" />
                    <span className="text-[10px] text-purple-300/70">{def.competitorNote}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <span className="text-[10px] text-white/30">Estimated ROI</span>
                  <span className="text-xs font-bold text-emerald-400">{def.roi}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {!scanData && !scanning && (
        <>
          {/* Revenue gaps by category with dollar estimates */}
          <SectionHeader icon={Gem} title="Revenue Gap Opportunities" subtitle="Grouped by category with dollar estimates and competitor benchmarks" />
          {gapsByCategory.map(([category, data], catIdx) => (
            <div key={category} className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">{category}</span>
                  <Badge color="neon">{data.companies.size} companies</Badge>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  ${Math.round(data.totalLow / 1000)}K - ${Math.round(data.totalHigh / 1000)}K total
                </span>
              </div>
              <div className="space-y-2">
                {data.gaps.slice(0, 4).map((gap, i) => (
                  <motion.div key={`${catIdx}-${i}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIdx * 0.05 + i * 0.02 }}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold" style={{ background: NEON_DIM, color: NEON }}>
                          {gap.company.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">{gap.company}</p>
                          <p className="text-[9px] text-white/30">{gap.revenue} | {gap.industry}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-400">${Math.round(gap.estimate.low / 1000)}K-${Math.round(gap.estimate.high / 1000)}K/yr</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 mb-2">
                      <DollarSign size={10} className="text-red-400 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-white/50">{gap.text}</span>
                    </div>
                    {/* Competitor benchmark */}
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-500/[0.06] border border-purple-500/10 mb-2">
                      <Crosshair size={10} className="text-purple-400 mt-0.5 shrink-0" />
                      <span className="text-[10px] text-purple-300/70">{gap.estimate.competitor}</span>
                    </div>
                    {/* ROI toggle */}
                    <button
                      onClick={() => setShowROI(showROI === `${catIdx}-${i}` ? null : `${catIdx}-${i}`)}
                      className="flex items-center gap-1.5 text-[10px] font-medium hover:underline" style={{ color: NEON }}>
                      <Calculator size={10} />
                      {showROI === `${catIdx}-${i}` ? 'Hide ROI Calculator' : 'Calculate ROI'}
                    </button>
                    <AnimatePresence>
                      {showROI === `${catIdx}-${i}` && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden">
                          <ROICalculator gap={gap.text} estimate={gap.estimate} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Outbound Sequence & Template Data
// ---------------------------------------------------------------------------
const DEFAULT_SEQUENCE_STEPS = [
  { id: 1, type: 'email', label: 'Cold Email', delay: 0, delayLabel: 'Day 1', template: 'cold-intro' },
  { id: 2, type: 'linkedin', label: 'LinkedIn Connect', delay: 2, delayLabel: 'Day 3', template: 'linkedin-connect' },
  { id: 3, type: 'email', label: 'Follow-up Email', delay: 4, delayLabel: 'Day 5', template: 'follow-up' },
  { id: 4, type: 'call', label: 'Phone Call', delay: 7, delayLabel: 'Day 8', template: 'call-script' },
  { id: 5, type: 'email', label: 'Breakup Email', delay: 12, delayLabel: 'Day 13', template: 'breakup' },
];

const STEP_ICONS = { email: Mail, linkedin: Linkedin, call: Phone };
const STEP_COLORS = { email: '#3b82f6', linkedin: '#0a66c2', call: '#a855f7' };

const TEMPLATE_LIBRARY = {
  'cold-intro': {
    name: 'Cold Intro',
    channel: 'Email',
    subject: 'Quick question about {company}\'s growth',
    subjectVariantB: 'Idea for {company} - 2 min read',
    body: 'Hi {name},\n\nI noticed {company} is growing fast in {industry} - congrats on the momentum.\n\nI wanted to flag something we\'ve seen with similar companies: {painPoint}. We helped {similar_company} solve this and they saw a {result}.\n\nWorth a quick chat?\n\nBest,\n{sender}',
    bodyVariantB: 'Hi {name},\n\nBeen following {company}\'s trajectory - impressive {growthRate} growth.\n\nQuick thought: companies at your stage often leave money on the table with {painPoint}. We built a solution that typically delivers {result} within 90 days.\n\n15 minutes this week?\n\n{sender}',
    stats: { openRate: 42, replyRate: 12, openRateB: 47, replyRateB: 10 },
  },
  'linkedin-connect': {
    name: 'LinkedIn Connection',
    channel: 'LinkedIn',
    subject: 'N/A',
    body: 'Hi {name} - Impressed by what you\'re building at {company}. I work with {industry} companies on {solution} and thought there might be some synergy. Would love to connect.',
    bodyVariantB: '{name}, your work at {company} caught my eye. We help {industry} teams solve {painPoint}. Happy to share some insights - no pitch, just value.',
    stats: { openRate: null, replyRate: 28, openRateB: null, replyRateB: 32 },
  },
  'follow-up': {
    name: 'Follow-up',
    channel: 'Email',
    subject: 'Re: Quick question about {company}\'s growth',
    subjectVariantB: '{name}, forgot to mention this',
    body: 'Hi {name},\n\nJust wanted to make sure my previous note didn\'t get buried. I shared how we helped companies like {company} address {painPoint}.\n\nHere\'s a quick case study: {caseStudyLink}\n\nHappy to walk through it in 15 min.\n\nBest,\n{sender}',
    stats: { openRate: 38, replyRate: 15, openRateB: 41, replyRateB: 13 },
  },
  'call-script': {
    name: 'Discovery Call',
    channel: 'Phone',
    subject: 'N/A',
    body: 'Opening: "Hi {name}, this is {sender} from GOATED. I noticed {company} is {observation}. Do you have 30 seconds?"\n\nHook: "We work with {industry} companies facing {painPoint}. Is that something on your radar?"\n\nValue: "Companies like {similar_company} saw {result} after working with us."\n\nCTA: "Would it make sense to schedule 15 minutes to see if this could work for {company}?"',
    stats: { openRate: null, replyRate: 18 },
  },
  'breakup': {
    name: 'Breakup Email',
    channel: 'Email',
    subject: 'Closing the loop, {name}',
    subjectVariantB: 'Should I close your file?',
    body: 'Hi {name},\n\nI\'ve reached out a few times and haven\'t heard back - totally understand you\'re busy.\n\nI\'ll assume the timing isn\'t right and close out my notes on {company}. If {painPoint} becomes a priority in the future, feel free to reach out.\n\nWishing you and the team continued success.\n\nBest,\n{sender}',
    stats: { openRate: 55, replyRate: 22, openRateB: 52, replyRateB: 25 },
  },
  'case-study': {
    name: 'Case Study Share',
    channel: 'Email',
    subject: 'How {similar_company} solved {painPoint}',
    body: 'Hi {name},\n\nThought you\'d find this relevant - we recently helped {similar_company} (also in {industry}) tackle {painPoint}.\n\nResults:\n- {result1}\n- {result2}\n- {result3}\n\nFull case study: {link}\n\nWant to explore what similar results could look like for {company}?\n\n{sender}',
    stats: { openRate: 45, replyRate: 18 },
  },
  'video-prospecting': {
    name: 'Video Prospecting',
    channel: 'Email',
    subject: 'Made a quick video for {company}',
    body: 'Hi {name},\n\nI recorded a 90-second video specifically for {company} showing how you could {benefit}.\n\nWatch here: {videoLink}\n\nWould love your thoughts.\n\n{sender}',
    stats: { openRate: 55, replyRate: 24 },
  },
};

const SEND_SIM_METRICS = {
  totalSent: 2847,
  delivered: 2789,
  opened: 1171,
  replied: 341,
  bounced: 58,
  unsubscribed: 12,
  meetings: 87,
};

// ---------------------------------------------------------------------------
// Tab: Outbound Tools
// ---------------------------------------------------------------------------
function OutboundTab({ leads }) {
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [activeChannel, setActiveChannel] = useState('all');
  const [sequenceRunning, setSequenceRunning] = useState(false);
  const [enriching, setEnriching] = useState(null);
  const [enrichedLeads, setEnrichedLeads] = useState(new Set());
  const [activeSubTab, setActiveSubTab] = useState('builder');
  const [sequenceSteps, setSequenceSteps] = useState(DEFAULT_SEQUENCE_STEPS);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showVariantB, setShowVariantB] = useState(false);
  const [simRunning, setSimRunning] = useState(false);
  const [simResults, setSimResults] = useState(null);

  const toggleLead = (id) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleEnrich = (leadId) => {
    setEnriching(leadId);
    setTimeout(() => {
      setEnrichedLeads(prev => new Set([...prev, leadId]));
      setEnriching(null);
    }, 1500);
  };

  const addStep = (type) => {
    const lastDelay = sequenceSteps.length > 0 ? sequenceSteps[sequenceSteps.length - 1].delay + 3 : 0;
    const newStep = {
      id: Date.now(),
      type,
      label: type === 'email' ? 'Email' : type === 'linkedin' ? 'LinkedIn Message' : 'Phone Call',
      delay: lastDelay,
      delayLabel: `Day ${lastDelay + 1}`,
      template: type === 'email' ? 'cold-intro' : type === 'linkedin' ? 'linkedin-connect' : 'call-script',
    };
    setSequenceSteps(prev => [...prev, newStep]);
  };

  const removeStep = (stepId) => {
    setSequenceSteps(prev => prev.filter(s => s.id !== stepId));
  };

  const runSimulation = () => {
    setSimRunning(true);
    setTimeout(() => {
      const count = selectedLeads.size || leads.length;
      setSimResults({
        totalSent: count * sequenceSteps.filter(s => s.type === 'email').length,
        liMessages: count * sequenceSteps.filter(s => s.type === 'linkedin').length,
        calls: count * sequenceSteps.filter(s => s.type === 'call').length,
        projectedOpens: Math.round(count * sequenceSteps.filter(s => s.type === 'email').length * 0.42),
        projectedReplies: Math.round(count * sequenceSteps.filter(s => s.type === 'email').length * 0.12 + count * sequenceSteps.filter(s => s.type === 'linkedin').length * 0.28),
        projectedMeetings: Math.round(count * 0.08),
        openRate: '42%',
        replyRate: '14%',
        meetingRate: '3.2%',
        timeline: sequenceSteps.map(s => ({
          day: s.delay + 1,
          type: s.type,
          label: s.label,
          sent: count,
          projected: s.type === 'email' ? `${Math.round(count * 0.42)} opens` : s.type === 'linkedin' ? `${Math.round(count * 0.28)} accepts` : `${Math.round(count * 0.18)} connects`,
        })),
      });
      setSimRunning(false);
    }, 2000);
  };

  const channels = [
    { id: 'all', label: 'All Channels', icon: Layers },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { id: 'phone', label: 'Phone', icon: Phone },
  ];

  const outboundSubTabs = [
    { id: 'builder', label: 'Sequence Builder', icon: GitBranch },
    { id: 'templates', label: 'Template Library', icon: BookOpen },
    { id: 'simulation', label: 'Send Simulation', icon: Play },
    { id: 'queue', label: 'Lead Queue', icon: Users },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard icon={Send} label="Sequences Active" value="7" sub="Multi-touch campaigns" color={NEON} />
        <StatCard icon={Mail} label="Emails Sent (30d)" value="2,847" sub="42% open rate" color="#3b82f6" trend="+18%" />
        <StatCard icon={Linkedin} label="LI Messages" value="384" sub="28% reply rate" color="#0a66c2" trend="+12%" />
        <StatCard icon={Phone} label="Calls Made" value="156" sub="18% connect rate" color="#a855f7" trend="+5%" />
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {outboundSubTabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border
              ${activeSubTab === tab.id
                ? 'border-[#00ff88]/30 bg-[#00ff88]/[0.08] text-[#00ff88]'
                : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:text-white/70'}`}>
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Badge color="neon">{selectedLeads.size} selected</Badge>
          <button
            disabled={selectedLeads.size === 0 || sequenceRunning}
            onClick={() => { setSequenceRunning(true); setTimeout(() => setSequenceRunning(false), 3000); }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
            style={{ background: NEON, color: '#0a0a0f' }}>
            {sequenceRunning ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} />}
            {sequenceRunning ? 'Sending...' : 'Launch Sequence'}
          </button>
        </div>
      </div>

      {/* ===== SEQUENCE BUILDER ===== */}
      {activeSubTab === 'builder' && (
        <div>
          <SectionHeader icon={GitBranch} title="Multi-Step Sequence Builder"
            subtitle="Drag steps to reorder. Click to configure each touchpoint." />

          {/* Cadence Timeline Visualization */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={13} style={{ color: NEON }} />
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Cadence Timeline</span>
              <span className="text-[10px] text-white/30 ml-auto">{sequenceSteps.length} touchpoints over {(sequenceSteps[sequenceSteps.length - 1]?.delay || 0) + 1} days</span>
            </div>
            <div className="relative">
              {/* Timeline bar */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/[0.06]" />
              <div className="flex items-start justify-between relative px-2">
                {sequenceSteps.map((step, i) => {
                  const StepIcon = STEP_ICONS[step.type];
                  const stepColor = STEP_COLORS[step.type];
                  const progress = sequenceSteps.length > 1
                    ? (step.delay / (sequenceSteps[sequenceSteps.length - 1]?.delay || 1)) * 100
                    : 50;
                  return (
                    <motion.div key={step.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex flex-col items-center"
                      style={{ position: sequenceSteps.length > 2 ? 'absolute' : 'relative', left: sequenceSteps.length > 2 ? `${progress}%` : undefined, transform: sequenceSteps.length > 2 ? 'translateX(-50%)' : undefined }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 bg-[#0a0a0f] z-10 relative"
                        style={{ borderColor: stepColor }}>
                        <StepIcon size={14} style={{ color: stepColor }} />
                      </div>
                      <span className="text-[9px] text-white/50 mt-1 font-medium whitespace-nowrap">{step.delayLabel}</span>
                      <span className="text-[8px] text-white/25 whitespace-nowrap">{step.label}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sequence Steps */}
          <div className="space-y-2 mb-4">
            {sequenceSteps.map((step, i) => {
              const StepIcon = STEP_ICONS[step.type];
              const stepColor = STEP_COLORS[step.type];
              const tmpl = TEMPLATE_LIBRARY[step.template];
              return (
                <motion.div key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:border-white/[0.12] transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-white/20">
                      <GripVertical size={14} className="cursor-grab" />
                      <span className="text-[10px] font-mono w-4">{i + 1}</span>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${stepColor}15` }}>
                      <StepIcon size={15} style={{ color: stepColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{step.label}</span>
                        <Badge color={step.type === 'email' ? 'blue' : step.type === 'linkedin' ? 'cyan' : 'purple'}>{step.type}</Badge>
                      </div>
                      <p className="text-[10px] text-white/40">{step.delayLabel} {tmpl ? `| Template: ${tmpl.name}` : ''}</p>
                    </div>
                    {tmpl?.stats && (
                      <div className="hidden md:flex items-center gap-3 text-[10px] text-white/30 shrink-0">
                        {tmpl.stats.openRate != null && <span>Open: <span className="text-white/60 font-semibold">{tmpl.stats.openRate}%</span></span>}
                        <span>Reply: <span className="text-emerald-400 font-semibold">{tmpl.stats.replyRate}%</span></span>
                      </div>
                    )}
                    <button onClick={() => removeStep(step.id)}
                      className="p-1 rounded hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={13} className="text-red-400/50" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Add step buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/30">Add step:</span>
            {[
              { type: 'email', label: 'Email', icon: Mail, color: '#3b82f6' },
              { type: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0a66c2' },
              { type: 'call', label: 'Call', icon: Phone, color: '#a855f7' },
            ].map(opt => (
              <button key={opt.type} onClick={() => addStep(opt.type)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-dashed border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.02] transition-all text-white/50">
                <Plus size={12} /> <opt.icon size={12} style={{ color: opt.color }} /> {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== TEMPLATE LIBRARY ===== */}
      {activeSubTab === 'templates' && (
        <div>
          <SectionHeader icon={BookOpen} title="Template Library"
            subtitle="Customizable cold emails, LinkedIn messages, and call scripts with A/B variants" />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
            {Object.entries(TEMPLATE_LIBRARY).map(([key, tmpl]) => {
              const isSelected = selectedTemplate === key;
              const channelColor = tmpl.channel === 'Email' ? '#3b82f6' : tmpl.channel === 'LinkedIn' ? '#0a66c2' : '#a855f7';
              return (
                <motion.div key={key}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSelectedTemplate(isSelected ? null : key)}
                  className={`rounded-xl border p-3 cursor-pointer transition-all ${isSelected ? 'border-[#00ff88]/30 bg-[#00ff88]/[0.04]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white">{tmpl.name}</span>
                    <Badge color={tmpl.channel === 'Email' ? 'blue' : tmpl.channel === 'LinkedIn' ? 'cyan' : 'purple'}>{tmpl.channel}</Badge>
                  </div>
                  {tmpl.subject !== 'N/A' && (
                    <p className="text-[11px] text-white/40 mb-2 font-mono truncate">{tmpl.subject}</p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-white/30">
                    {tmpl.stats.openRate != null && <span>Open: <span className="text-white/60 font-semibold">{tmpl.stats.openRate}%</span></span>}
                    <span>Reply: <span className="text-emerald-400 font-semibold">{tmpl.stats.replyRate}%</span></span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Template Preview with A/B */}
          <AnimatePresence>
            {selectedTemplate && TEMPLATE_LIBRARY[selectedTemplate] && (() => {
              const tmpl = TEMPLATE_LIBRARY[selectedTemplate];
              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Edit3 size={14} style={{ color: NEON }} />
                      <span className="text-sm font-semibold text-white">{tmpl.name}</span>
                    </div>
                    {tmpl.bodyVariantB && (
                      <div className="flex items-center gap-1 p-0.5 rounded-lg border border-white/[0.08] bg-white/[0.02]">
                        <button onClick={() => setShowVariantB(false)}
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all ${!showVariantB ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'text-white/40'}`}>
                          Variant A
                        </button>
                        <button onClick={() => setShowVariantB(true)}
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all ${showVariantB ? 'bg-blue-500/10 text-blue-400' : 'text-white/40'}`}>
                          Variant B
                        </button>
                      </div>
                    )}
                  </div>

                  {tmpl.subject !== 'N/A' && (
                    <div className="mb-3">
                      <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Subject Line</span>
                      <p className="text-xs text-white/70 font-mono mt-1 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        {showVariantB && tmpl.subjectVariantB ? tmpl.subjectVariantB : tmpl.subject}
                      </p>
                    </div>
                  )}

                  <div className="mb-3">
                    <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Body</span>
                    <pre className="text-[11px] text-white/60 mt-1 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] whitespace-pre-wrap font-sans leading-relaxed">
                      {showVariantB && tmpl.bodyVariantB ? tmpl.bodyVariantB : tmpl.body}
                    </pre>
                  </div>

                  {/* A/B Performance Comparison */}
                  {tmpl.stats.openRateB != null && (
                    <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart2 size={12} style={{ color: NEON }} />
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">A/B Test Results</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 rounded-lg border border-[#00ff88]/10 bg-[#00ff88]/[0.03]">
                          <span className="text-[9px] text-white/30 uppercase">Variant A</span>
                          <div className="flex items-center gap-3 mt-1">
                            {tmpl.stats.openRate != null && <div><p className="text-sm font-bold text-white">{tmpl.stats.openRate}%</p><p className="text-[8px] text-white/30">Opens</p></div>}
                            <div><p className="text-sm font-bold text-emerald-400">{tmpl.stats.replyRate}%</p><p className="text-[8px] text-white/30">Replies</p></div>
                          </div>
                        </div>
                        <div className="p-2 rounded-lg border border-blue-500/10 bg-blue-500/[0.03]">
                          <span className="text-[9px] text-white/30 uppercase">Variant B</span>
                          <div className="flex items-center gap-3 mt-1">
                            {tmpl.stats.openRateB != null && <div><p className="text-sm font-bold text-white">{tmpl.stats.openRateB}%</p><p className="text-[8px] text-white/30">Opens</p></div>}
                            <div><p className="text-sm font-bold text-blue-400">{tmpl.stats.replyRateB}%</p><p className="text-[8px] text-white/30">Replies</p></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      )}

      {/* ===== SEND SIMULATION ===== */}
      {activeSubTab === 'simulation' && (
        <div>
          <SectionHeader icon={Play} title="Send Simulation"
            subtitle="Preview delivery projections and timing before launching" />

          {/* Simulation launch */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-white">Simulation Parameters</p>
                <p className="text-[10px] text-white/40">
                  {selectedLeads.size || leads.length} leads | {sequenceSteps.length} steps | {(sequenceSteps[sequenceSteps.length - 1]?.delay || 0) + 1} day cadence
                </p>
              </div>
              <button onClick={runSimulation} disabled={simRunning}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                style={{ background: NEON, color: '#0a0a0f' }}>
                {simRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                {simRunning ? 'Running...' : 'Run Simulation'}
              </button>
            </div>

            {/* Historical metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Delivered', value: `${SEND_SIM_METRICS.delivered}`, sub: `${Math.round(SEND_SIM_METRICS.delivered / SEND_SIM_METRICS.totalSent * 100)}% delivery rate`, color: NEON },
                { label: 'Opened', value: `${SEND_SIM_METRICS.opened}`, sub: `${Math.round(SEND_SIM_METRICS.opened / SEND_SIM_METRICS.delivered * 100)}% open rate`, color: '#3b82f6' },
                { label: 'Replied', value: `${SEND_SIM_METRICS.replied}`, sub: `${Math.round(SEND_SIM_METRICS.replied / SEND_SIM_METRICS.opened * 100)}% reply rate`, color: '#a855f7' },
                { label: 'Meetings', value: `${SEND_SIM_METRICS.meetings}`, sub: `${Math.round(SEND_SIM_METRICS.meetings / SEND_SIM_METRICS.totalSent * 100)}% meeting rate`, color: '#f59e0b' },
              ].map((m, i) => (
                <div key={i} className="p-2 rounded-lg border border-white/[0.04] bg-white/[0.01] text-center">
                  <p className="text-lg font-bold text-white">{m.value}</p>
                  <p className="text-[10px] text-white/30">{m.label}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: m.color }}>{m.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Results */}
          {simRunning && (
            <div className="flex flex-col items-center justify-center py-16">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                <Activity size={48} style={{ color: NEON }} />
              </motion.div>
              <p className="text-sm text-white/50 mt-4">Simulating delivery across all channels...</p>
            </div>
          )}

          {simResults && !simRunning && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* Projected outcomes */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
                {[
                  { label: 'Emails', value: simResults.totalSent, color: '#3b82f6' },
                  { label: 'LI Messages', value: simResults.liMessages, color: '#0a66c2' },
                  { label: 'Calls', value: simResults.calls, color: '#a855f7' },
                  { label: 'Est. Opens', value: simResults.projectedOpens, color: '#f59e0b' },
                  { label: 'Est. Replies', value: simResults.projectedReplies, color: NEON },
                  { label: 'Est. Meetings', value: simResults.projectedMeetings, color: '#ec4899' },
                ].map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                    <p className="text-xl font-bold text-white">{m.value}</p>
                    <p className="text-[10px] text-white/40">{m.label}</p>
                    <div className="w-full h-1 rounded-full bg-white/[0.04] mt-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '100%', background: m.color }} />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Cadence timeline with projected metrics */}
              <SectionHeader icon={Clock} title="Delivery Timeline" subtitle="When each touchpoint fires and projected outcomes" />
              <div className="space-y-2">
                {simResults.timeline.map((t, i) => {
                  const StepIcon = STEP_ICONS[t.type];
                  const stepColor = STEP_COLORS[t.type];
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="w-10 text-center shrink-0">
                        <p className="text-sm font-bold text-white">D{t.day}</p>
                        <p className="text-[8px] text-white/20">Day {t.day}</p>
                      </div>
                      <div className="w-px h-8 bg-white/[0.06]" />
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${stepColor}15` }}>
                        <StepIcon size={14} style={{ color: stepColor }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-white">{t.label}</p>
                        <p className="text-[10px] text-white/40">{t.sent} recipients</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold" style={{ color: stepColor }}>{t.projected}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ===== LEAD QUEUE ===== */}
      {activeSubTab === 'queue' && (
        <div>
          {/* Channel Filter */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {channels.map(ch => (
              <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                  ${activeChannel === ch.id
                    ? 'border-[#00ff88]/30 bg-[#00ff88]/[0.08] text-[#00ff88]'
                    : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:text-white/70'}`}>
                <ch.icon size={13} /> {ch.label}
              </button>
            ))}
          </div>

          <SectionHeader icon={Users} title="Outbound Lead Queue" subtitle="Select leads to add to your sequence"
            action={
              <button onClick={() => setSelectedLeads(prev => prev.size === leads.length ? new Set() : new Set(leads.map(l => l.id)))}
                className="text-[11px] text-white/40 hover:text-white/70 transition-colors">
                {selectedLeads.size === leads.length ? 'Deselect All' : 'Select All'}
              </button>
            }
          />
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[32px_1fr_100px_80px_80px_80px_120px] gap-3 px-4 py-2 border-b border-white/[0.06] text-[10px] text-white/30 uppercase tracking-wider font-semibold">
              <span></span><span>Lead / Company</span><span>Industry</span><span>Score</span><span>Intent</span><span>Revenue</span><span>Actions</span>
            </div>
            {/* Lead rows */}
            <div className="max-h-[400px] overflow-y-auto">
              {leads.map((lead) => (
                <div key={lead.id}
                  className={`grid grid-cols-[32px_1fr_100px_80px_80px_80px_120px] gap-3 px-4 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors items-center
                    ${selectedLeads.has(lead.id) ? 'bg-[#00ff88]/[0.03]' : ''}`}>
                  <button onClick={() => toggleLead(lead.id)} className="flex items-center justify-center">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all
                      ${selectedLeads.has(lead.id) ? 'border-[#00ff88] bg-[#00ff88]/20' : 'border-white/20'}`}>
                      {selectedLeads.has(lead.id) && <CheckCircle2 size={10} style={{ color: NEON }} />}
                    </div>
                  </button>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: NEON_DIM, color: NEON }}>
                      {lead.company.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-white font-semibold truncate">{lead.name}</p>
                      <p className="text-[10px] text-white/40 truncate">{lead.title} @ {lead.company}</p>
                    </div>
                  </div>
                  <Badge color="blue">{lead.industry}</Badge>
                  <ScoreRing score={lead.score} size={30} stroke={2.5} />
                  <Badge color={lead.intentScore === 'High' ? 'emerald' : lead.intentScore === 'Medium' ? 'amber' : 'red'}>{lead.intentScore}</Badge>
                  <span className="text-xs text-white/60 font-semibold">{lead.revenue}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEnrich(lead.id)} disabled={enrichedLeads.has(lead.id) || enriching === lead.id}
                      className="p-1 rounded hover:bg-white/[0.06] transition-colors disabled:opacity-30" title="Enrich">
                      {enriching === lead.id ? <Loader2 size={12} className="text-white/40 animate-spin" /> :
                        enrichedLeads.has(lead.id) ? <CheckCircle2 size={12} style={{ color: NEON }} /> :
                          <Sparkles size={12} className="text-white/40" />}
                    </button>
                    <button className="p-1 rounded hover:bg-white/[0.06] transition-colors" title="Send email">
                      <Mail size={12} className="text-white/40" />
                    </button>
                    <button className="p-1 rounded hover:bg-white/[0.06] transition-colors" title="LinkedIn">
                      <Linkedin size={12} className="text-white/40" />
                    </button>
                    <button className="p-1 rounded hover:bg-white/[0.06] transition-colors" title="Call">
                      <Phone size={12} className="text-white/40" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lead Detail Drawer
// ---------------------------------------------------------------------------
function LeadDrawer({ lead, onClose }) {
  if (!lead) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed top-0 right-0 h-full w-full max-w-md z-50 border-l border-white/[0.08] bg-[#0a0a0f]/95 backdrop-blur-xl overflow-y-auto"
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold" style={{ background: NEON_DIM, color: NEON }}>
                {lead.company.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{lead.company}</h3>
                <p className="text-xs text-white/50">{lead.name} &middot; {lead.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
              <X size={18} className="text-white/40" />
            </button>
          </div>

          {/* Score */}
          <div className="flex items-center gap-4 mb-5 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <ScoreRing score={lead.score} size={56} stroke={4} />
            <div className="flex-1">
              <p className="text-xs text-white/40">Lead Score</p>
              <p className="text-sm text-white font-semibold">{lead.score >= 85 ? 'Hot Lead - Ready to buy' : lead.score >= 70 ? 'Warm Lead - Nurture needed' : 'Cold Lead - Long-term nurture'}</p>
            </div>
            <Badge color={lead.intentScore === 'High' ? 'emerald' : lead.intentScore === 'Medium' ? 'amber' : 'red'}>
              {lead.intentScore} Intent
            </Badge>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Mail size={13} className="text-white/30" /> {lead.email}
              <button className="ml-auto p-1 rounded hover:bg-white/[0.06]"><Copy size={11} className="text-white/30" /></button>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Phone size={13} className="text-white/30" /> {lead.phone}
              <button className="ml-auto p-1 rounded hover:bg-white/[0.06]"><Copy size={11} className="text-white/30" /></button>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Globe size={13} className="text-white/30" /> {lead.website}
              <button className="ml-auto p-1 rounded hover:bg-white/[0.06]"><ExternalLink size={11} className="text-white/30" /></button>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <MapPin size={13} className="text-white/30" /> {lead.location}
            </div>
          </div>

          {/* Company Details */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'Revenue', value: lead.revenue, icon: DollarSign },
              { label: 'Employees', value: lead.employees, icon: Users },
              { label: 'Growth', value: lead.growthRate, icon: TrendingUp },
              { label: 'Funding', value: lead.funding, icon: Briefcase },
              { label: 'Industry', value: lead.industry, icon: Building2 },
              { label: 'Size', value: lead.size, icon: Users },
            ].map((item, i) => (
              <div key={i} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon size={11} className="text-white/30" />
                  <span className="text-[10px] text-white/30">{item.label}</span>
                </div>
                <p className="text-xs font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>

          {/* SEO Metrics */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 mb-5">
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">SEO Metrics</p>
            <div className="grid grid-cols-3 gap-3">
              <div><p className="text-lg font-bold text-white">{lead.domainAuthority}</p><p className="text-[10px] text-white/30">DA</p></div>
              <div><p className="text-lg font-bold text-white">{lead.monthlyTraffic}</p><p className="text-[10px] text-white/30">Traffic/mo</p></div>
              <div><p className="text-lg font-bold text-white">{lead.backlinks.toLocaleString()}</p><p className="text-[10px] text-white/30">Backlinks</p></div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mb-5">
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">Tech Stack</p>
            <div className="flex flex-wrap gap-1.5">
              {lead.techStack.map(t => <Badge key={t} color="cyan">{t}</Badge>)}
            </div>
          </div>

          {/* Pain Points */}
          <div className="mb-5">
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">Pain Points</p>
            <div className="space-y-1.5">
              {lead.painPoints.map((pp, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg border border-white/[0.04] bg-white/[0.01]">
                  <AlertTriangle size={11} className="text-amber-400 mt-0.5 shrink-0" />
                  <span className="text-[11px] text-white/60">{pp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Gaps */}
          <div className="mb-5">
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">Revenue Gaps</p>
            <div className="space-y-1.5">
              {lead.revenueGaps.map((rg, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg border border-white/[0.04] bg-white/[0.01]">
                  <DollarSign size={11} className="text-red-400 mt-0.5 shrink-0" />
                  <span className="text-[11px] text-white/60">{rg}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: NEON, color: '#0a0a0f' }}>
              <Send size={13} /> Add to Sequence
            </button>
            <button className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white/70 border border-white/[0.1] hover:bg-white/[0.04] transition-all">
              <Download size={13} /> Export
            </button>
            <button className="flex items-center justify-center p-2.5 rounded-xl border border-white/[0.1] hover:bg-white/[0.04] transition-all">
              <Share2 size={13} className="text-white/50" />
            </button>
          </div>
        </div>
      </motion.div>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Main: FinderPage
// ---------------------------------------------------------------------------
export default function FinderPage() {
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const searchRef = useRef(null);

  // Keyboard shortcut: Cmd+K / Ctrl+K to focus search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowDrawer(false);
        setSelectedLead(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSelectLead = useCallback((lead) => {
    setSelectedLead(lead);
    setShowDrawer(true);
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-[0.03] pointer-events-none" style={{ background: NEON }} />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 rounded-full blur-[100px] opacity-[0.02] pointer-events-none" style={{ background: '#a855f7' }} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: NEON_DIM }}>
              <Radar size={20} style={{ color: NEON }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Finder</h1>
              <p className="text-xs text-white/40">Discover leads, analyze competitors, find revenue opportunities</p>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="mb-5">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] focus-within:border-[#00ff88]/30 transition-colors">
            <Search size={18} className="text-white/30 shrink-0" />
            <input
              ref={searchRef}
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search leads, companies, industries, locations..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-white/20 bg-white/[0.04] border border-white/[0.06] rounded">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-1 mb-6 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                ${activeTab === tab.id
                  ? 'text-[#00ff88] bg-[#00ff88]/[0.08]'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'}`}>
              <tab.icon size={14} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="finderTabUnderline" className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{ background: NEON }} />
              )}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'discover' && (
              <DiscoverTab leads={MOCK_LEADS} searchQuery={searchQuery} onSelectLead={handleSelectLead} selectedLead={selectedLead} />
            )}
            {activeTab === 'seo' && <SEOTab />}
            {activeTab === 'painpoints' && <PainPointsTab leads={MOCK_LEADS} />}
            {activeTab === 'revenue' && <RevenueScannerTab leads={MOCK_LEADS} />}
            {activeTab === 'outbound' && <OutboundTab leads={MOCK_LEADS} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Lead Detail Drawer */}
      {showDrawer && selectedLead && (
        <LeadDrawer lead={selectedLead} onClose={() => { setShowDrawer(false); setSelectedLead(null); }} />
      )}
    </div>
  );
}
