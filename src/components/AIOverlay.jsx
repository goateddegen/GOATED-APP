import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X, Send, Minimize2,
  Globe, Users, TrendingUp, Lightbulb,
  ChevronRight,
  BarChart3, Wallet, Zap, Target, ArrowRight,
  MessageSquare, Sparkles, LayoutDashboard, ExternalLink, Phone, UserSearch,
  Trophy, Flame, DollarSign, Clock, Activity, Shield, ClipboardList, FileText,
  Brain, Newspaper, BookOpen, Crosshair
} from 'lucide-react';
import { useStore, fmt } from '../hooks/useStore';
import { GoatIcon } from './GoatLogo';

// ─── STREAMING TEXT HOOK ──────────────────────────────────────────────
// Reveals text word-by-word for a streaming feel, even when the response arrives all at once
function useStreamingText(text, isLatest) {
  const [displayed, setDisplayed] = useState(text);
  const [isStreaming, setIsStreaming] = useState(false);
  const prevTextRef = useRef('');

  useEffect(() => {
    // Only stream if this is a new message (text changed) and it's the latest assistant message
    if (text === prevTextRef.current || !isLatest) {
      setDisplayed(text);
      return;
    }
    prevTextRef.current = text;

    // Split into words, preserving whitespace and markdown
    const words = text.split(/(\s+)/);
    let currentIndex = 0;
    setDisplayed('');
    setIsStreaming(true);

    // Reveal in chunks of 3-5 words for speed
    const chunkSize = 4;
    const interval = setInterval(() => {
      currentIndex += chunkSize;
      if (currentIndex >= words.length) {
        setDisplayed(text);
        setIsStreaming(false);
        clearInterval(interval);
      } else {
        setDisplayed(words.slice(0, currentIndex).join(''));
      }
    }, 25); // 25ms per chunk = fast but visible streaming

    return () => clearInterval(interval);
  }, [text, isLatest]);

  return { displayed, isStreaming };
}

// ─── FEATURE LINK MAP ─────────────────────────────────────────────────
// Maps keywords found in AI responses to navigable pages
const FEATURE_LINKS = {
  leads:      { page: 'leads',     label: 'Leads',      icon: Users },
  lead:       { page: 'leads',     label: 'Leads',      icon: Users },
  pipeline:   { page: 'leads',     label: 'Pipeline',   icon: Users },
  trends:     { page: 'trends',    label: 'TrendPulse', icon: TrendingUp },
  trend:      { page: 'trends',    label: 'TrendPulse', icon: TrendingUp },
  trendpulse: { page: 'trends',    label: 'TrendPulse', icon: TrendingUp },
  sentiment:  { page: 'trends',    label: 'TrendPulse', icon: TrendingUp },
  market:     { page: 'market',    label: 'Markets',    icon: Globe },
  markets:    { page: 'market',    label: 'Markets',    icon: Globe },
  prediction: { page: 'market',    label: 'Markets',    icon: Globe },
  crypto:     { page: 'market',    label: 'Markets',    icon: Globe },
  wallet:     { page: 'wallet',    label: 'Wallet',     icon: Wallet },
  solana:     { page: 'wallet',    label: 'Wallet',     icon: Wallet },
  dashboard:  { page: 'dashboard', label: 'Dashboard',  icon: BarChart3 },
  admin:      { page: 'admin',     label: 'Admin',      icon: LayoutDashboard },
  launchpad:  { page: 'launchpad', label: 'LaunchPad',  icon: Zap },
  launch:     { page: 'launchpad', label: 'LaunchPad',  icon: Zap },
  events:     { page: 'launchpad', label: 'LaunchPad',  icon: Zap },
  incubator:  { page: 'launchpad', label: 'LaunchPad',  icon: Zap },
  startup:    { page: 'launchpad', label: 'LaunchPad',  icon: Zap },
  gamble:     { page: 'launchpad', label: 'LaunchPad',  icon: Zap },
  betting:    { page: 'launchpad', label: 'LaunchPad',  icon: Zap },
};

// Snap modes removed — AI overlay is always right panel

// ─── CONTEXT-AWARE SUGGESTED PROMPTS ───────────────────────────────────
const PAGE_PROMPTS = {
  home: [
    { label: 'Find leads in Miami', icon: Globe },
    { label: 'Walk Me Through Leads', icon: ClipboardList },
    { label: 'Show $50K+ deals', icon: DollarSign },
    { label: 'Market trends today', icon: TrendingUp },
  ],
  dashboard: [
    { label: 'Pipeline health check', icon: BarChart3 },
    { label: 'Revenue forecast this quarter', icon: TrendingUp },
    { label: 'Which leads need follow-up?', icon: Users },
    { label: 'Show me win/loss trends', icon: Target },
  ],
  leads: [
    { label: 'Walk Me Through Leads', icon: ClipboardList },
    { label: 'Find critical priority leads', icon: Target },
    { label: 'Leads with rising momentum', icon: Zap },
    { label: 'Best leads to close this week', icon: Sparkles },
  ],
  trends: [
    { label: 'What sectors are surging?', icon: TrendingUp },
    { label: 'Show declining markets', icon: BarChart3 },
    { label: 'AI industry outlook', icon: Lightbulb },
    { label: 'Compare fintech vs SaaS', icon: Globe },
  ],
  market: [
    { label: 'Global market pulse', icon: Globe },
    { label: 'Competitor landscape', icon: Target },
    { label: 'Emerging opportunities', icon: Lightbulb },
    { label: 'Investment signals', icon: Zap },
  ],
  launchpad: [
    { label: 'Best live events to bet on', icon: Zap },
    { label: 'Startup idea generator', icon: Lightbulb },
    { label: 'Market event analysis', icon: Globe },
    { label: 'Incubator project review', icon: Target },
  ],
  admin: [
    { label: 'System health overview', icon: BarChart3 },
    { label: 'User analytics summary', icon: Users },
    { label: 'Revenue performance', icon: TrendingUp },
    { label: 'Platform optimization tips', icon: Lightbulb },
  ],
  wallet: [
    { label: 'Revenue breakdown', icon: Wallet },
    { label: 'Spending analysis', icon: BarChart3 },
    { label: 'Projected earnings', icon: TrendingUp },
    { label: 'Cost optimization tips', icon: Lightbulb },
  ],
};

// COACH MODE prompts — tactical closing advice
const COACH_PROMPTS = {
  leads: [
    { label: 'Best opener for this lead', icon: Phone },
    { label: 'Handle price objection', icon: Shield },
    { label: 'Follow-up email template', icon: Send },
    { label: 'Next best action to close', icon: Target },
  ],
  home: [
    { label: 'Who should I call right now?', icon: Phone },
    { label: 'Revenue gap analysis', icon: DollarSign },
    { label: 'Weekly closing game plan', icon: Target },
    { label: 'Pipeline health check', icon: Activity },
  ],
  dashboard: [
    { label: 'What deals are at risk?', icon: Shield },
    { label: 'Commission forecast', icon: DollarSign },
    { label: 'Top 3 actions today', icon: Target },
    { label: 'Win rate improvement tips', icon: TrendingUp },
  ],
};

// DEGEN MODE prompts — aggressive, Wolf of Wall Street style
const DEGEN_PROMPTS = {
  home: [
    { label: 'Show me the money plays', icon: Zap },
    { label: 'Who should I ape into?', icon: Users },
    { label: "What's pumping today?", icon: TrendingUp },
    { label: 'Give me a 100x idea', icon: Lightbulb },
  ],
  dashboard: [
    { label: 'Am I winning or losing?', icon: BarChart3 },
    { label: 'Which deals are mooning?', icon: TrendingUp },
    { label: 'Who do I need to call NOW?', icon: Users },
    { label: 'Show me the bag tracker', icon: Target },
  ],
  leads: [
    { label: 'Find me a whale to close', icon: Target },
    { label: 'Write me killer cold call script', icon: Send },
    { label: 'Who has the biggest bags?', icon: Zap },
    { label: 'Speed run: close in 24hrs', icon: Sparkles },
  ],
  trends: [
    { label: "What's the alpha play right now?", icon: TrendingUp },
    { label: 'Show me pump signals', icon: BarChart3 },
    { label: 'Which sector is about to moon?', icon: Lightbulb },
    { label: 'Degen market analysis', icon: Globe },
  ],
  market: [
    { label: 'Full degen market scan', icon: Globe },
    { label: 'Who are we conquering?', icon: Target },
    { label: 'Find me asymmetric bets', icon: Lightbulb },
    { label: 'Whale movement alerts', icon: Zap },
  ],
  launchpad: [
    { label: 'Which events are printing money?', icon: Zap },
    { label: 'Give me a 100x startup idea', icon: Lightbulb },
    { label: 'Best degen bets right now', icon: Globe },
    { label: 'Ape into the hottest event', icon: Target },
  ],
  admin: [
    { label: 'Show me the revenue matrix', icon: BarChart3 },
    { label: 'Who are the power users?', icon: Users },
    { label: 'Revenue machine status', icon: TrendingUp },
    { label: 'How do we 10x this?', icon: Lightbulb },
  ],
  wallet: [
    { label: 'How fat are my bags?', icon: Wallet },
    { label: 'Revenue go BRRR analysis', icon: BarChart3 },
    { label: 'When do I hit $1M?', icon: TrendingUp },
    { label: 'Maximize my earnings', icon: Lightbulb },
  ],
};

// ─── QUICK INSIGHT BUTTONS ─────────────────────────────────────────────
const QUICK_INSIGHTS = [
  { label: 'Daily Brief', prompt: 'Give me a daily brief: top 3 pipeline priorities, market conditions affecting my deals, and the single most important action I should take today. Keep it tight.', icon: Newspaper },
  { label: 'Market Pulse', prompt: 'Research the current market pulse: macro conditions, sector momentum, crypto sentiment, and how it all impacts B2B sales right now. Deep research mode.', icon: TrendingUp },
  { label: 'Pipeline Review', prompt: 'Analyze my full pipeline: deals at risk, biggest opportunities, conversion bottlenecks, and revenue forecast for next 30 days. Be specific with names and numbers.', icon: ClipboardList },
  { label: 'Close Playbook', prompt: 'Build me a closing playbook for today: which leads to call first, what to say, objection handling for each, and commission impact. Make it actionable.', icon: Crosshair },
];

// ─── DEGEN ALPHA INSIGHT BUTTONS ─────────────────────────────────────────
const DEGEN_INSIGHTS = [
  { label: 'Best Alpha Plays', prompt: 'Research the best alpha plays right now — crypto, prediction markets, and B2B deals. What has the highest asymmetric upside? Deep research mode.', icon: Zap },
  { label: 'Whale Movements', prompt: 'Analyze whale movements and smart money flow: what are institutions buying, what sectors are seeing unusual volume, and where is the smart money positioning? Deep dive.', icon: Globe },
  { label: 'Sentiment Shifts', prompt: 'Research sentiment shifts across markets: what narratives are gaining momentum, what is losing steam, and what contrarian plays have the best risk/reward? Analyze everything.', icon: Brain },
  { label: 'Degen Playbook', prompt: 'Build me a full degen playbook: highest conviction trades, prediction market edges, and pipeline deals I can speed-close today. Go aggressive. NFA.', icon: Flame },
];

// ─── CONTEXTUAL QUICK ACTION BUTTONS (below chat input) ──────────────
const QUICK_ACTIONS = {
  leads: [
    { label: 'Walk Me Through Leads', prompt: 'Walk me through my top leads sorted by close probability. Show my top 5 highest-probability leads under $20K with name, company, deal value, close probability, recommended next action, and why each lead is closeable.', icon: ClipboardList },
    { label: 'Leads in Austin', prompt: 'Show me leads in Austin', icon: Globe },
    { label: 'Leads in NYC', prompt: 'Show me leads in New York', icon: Globe },
    { label: '$50K+ Deals', prompt: 'Show me leads with $50K+ deal values', icon: DollarSign },
    { label: 'SaaS Leads', prompt: 'Find SaaS companies in my pipeline', icon: Target },
    { label: 'Coach Me', prompt: 'Coach me on closing my current lead — what should I do right now?', icon: Trophy },
    { label: 'Who to Call?', prompt: 'Based on my pipeline, who should I call right now for the highest chance of closing?', icon: Phone },
  ],
  trends: [
    { label: 'Best Plays Right Now', prompt: 'What are the best money plays right now based on current trends and prediction markets?', icon: Zap },
    { label: 'Monetize This Trend', prompt: 'How do I monetize the current trending sectors? Give me specific plays with dollar amounts.', icon: DollarSign },
    { label: 'Risk Analysis', prompt: 'Run a risk analysis on current market conditions — what should I avoid?', icon: Shield },
    { label: 'Portfolio Strategy', prompt: 'Build me an optimal portfolio strategy splitting between B2B closing and prediction markets', icon: Target },
  ],
  market: [
    { label: 'Alpha Scan', prompt: 'Run an alpha scan — find me asymmetric bets and prediction market edges right now', icon: Activity },
    { label: 'Best Bets', prompt: 'What are the best prediction market bets right now? Show me odds, edge, and expected value.', icon: Flame },
    { label: 'Spread Comparison', prompt: 'Compare spreads across Kalshi and Polymarket — where are the pricing inefficiencies?', icon: BarChart3 },
    { label: 'DEGEN Mode Picks', prompt: 'Give me your highest conviction DEGEN plays — high risk, high reward. I want 10x potential.', icon: Zap },
  ],
  launchpad: [
    { label: 'Event Analysis', prompt: 'Analyze the hottest live events on LaunchPad — which ones have the best risk/reward right now?', icon: Zap },
    { label: 'Startup Ideas', prompt: 'Generate 3 high-potential startup ideas based on current market trends, incubator data, and prediction market signals', icon: Lightbulb },
    { label: 'Best Bets Now', prompt: 'What are the best live events to bet on right now? Show me probability, edge, and expected value.', icon: Target },
    { label: 'Incubator Review', prompt: 'Review the current incubator projects — which ones have the highest growth potential and why?', icon: Activity },
  ],
};

// ─── TEMPLATE FALLBACK RESPONSES ───────────────────────────────────────
function getTemplateResponse(msg, leads, { coachMode, selectedLead, revenueStats } = {}) {
  const lower = msg.toLowerCase();
  const stats = revenueStats || {};
  const wonLeadsAll = leads.filter(l => l.status === 'won');
  const totalWonValue = wonLeadsAll.reduce((s, l) => s + l.dealValue, 0);
  const commissionRate = 0.10;
  const currentMRR = Math.round((totalWonValue * commissionRate) / 12);
  const mrrGoal = 25000;
  const distanceToGoal = Math.max(0, mrrGoal - currentMRR);
  const negotiatingLeads = leads.filter(l => l.status === 'negotiation');
  const weeklyCloses = Math.min(wonLeadsAll.length, 3 + Math.floor(Math.random() * 4));
  const streakCount = 2 + Math.floor(Math.random() * 5);

  // ── COACH MODE: Closing guidance with $ amounts ──────────────────
  if (coachMode && (lower.includes('coach') || lower.includes('close') || lower.includes('closing') || lower.includes('what should') || lower.includes('next step') || lower.includes('help me'))) {
    if (selectedLead) {
      const commission = Math.round(selectedLead.dealValue * commissionRate);
      const daysInStage = 1 + Math.floor(Math.random() * 7);
      const closeSteps = {
        'new': { step: 'Discovery Call', next: `Schedule a discovery call with ${selectedLead.name.split(' ')[0]} TODAY. Ask about their ${(selectedLead.painPoints||[])[0]?.toLowerCase() || 'biggest challenge'}.` },
        'contacted': { step: 'Follow-Up', next: `Send a follow-up to ${selectedLead.name.split(' ')[0]} — reference your last conversation and share a case study from their industry (${selectedLead.industry}).` },
        'qualified': { step: 'Demo/Proposal', next: `${selectedLead.name.split(' ')[0]} is qualified! Prepare a tailored demo focusing on: ${(selectedLead.painPoints||[]).slice(0, 2).join(' and ')}. Book it THIS WEEK.` },
        'negotiation': { step: 'Negotiation Close', next: `You should call ${selectedLead.name.split(' ')[0]} NOW — they've been in Negotiation for ${daysInStage} days. Decision timeline is ${selectedLead.decisionTimeline || '2 weeks'} — close TODAY.` },
        'won': { step: 'Closed Won!', next: `This deal is CLOSED! That's **$${commission.toLocaleString()}** in commission. Time to upsell or get a referral.` },
        'lost': { step: 'Re-engage', next: `This one slipped — but it's worth **$${commission.toLocaleString()}** in commission. Wait 30 days and re-approach with a new angle.` },
      };
      const stageInfo = closeSteps[selectedLead.status] || closeSteps['new'];
      return `**Closing Coach — ${selectedLead.name}**\n\n---\n\n**Current Stage:** ${stageInfo.step}\n**Deal Value:** ${fmt(selectedLead.dealValue)} | **Your Commission:** $${commission.toLocaleString()}\n**Score:** ${selectedLead.score}/100 | **Conversion Prob:** ${selectedLead.conversionProbability}%\n\n**Next Action:**\n${stageInfo.next}\n\n---\n\n**Revenue Impact:**\n- This lead is worth **$${commission.toLocaleString()} in commission** to you\n- Decision timeline is **${selectedLead.decisionTimeline || '2 weeks'}** — ${selectedLead.decisionTimeline === 'Immediate' ? 'CLOSE NOW' : 'call TODAY'}\n- You need **${Math.ceil(distanceToGoal / (commission || 1))} more closes** like this for your **$25K MRR goal**\n- Your pipeline has **$${Math.round(negotiatingLeads.reduce((s, l) => s + l.dealValue, 0) * commissionRate).toLocaleString()}** in pending commission\n\n**Pro Tips:**\n- Best method for this lead: **${selectedLead.bestMethod || 'Phone call'}**\n- Buying signals: ${(selectedLead.buyingSignals||[]).join(', ') || 'None detected yet'}\n- Competitor using: ${selectedLead.competitorUsing || 'Unknown'}\n\nKeep grinding! You're on a **${streakCount}-day closing streak**.`;
    }
    return `**Closing Coach — Pipeline Overview**\n\n---\n\n**Your Revenue Dashboard:**\n- Current MRR: **$${currentMRR.toLocaleString()}** (from ${wonLeadsAll.length} won deals)\n- Distance to $25K goal: **$${distanceToGoal.toLocaleString()}** remaining\n- Deals in negotiation: **${negotiatingLeads.length}** worth **${fmt(negotiatingLeads.reduce((s, l) => s + l.dealValue, 0))}**\n- Pending commission: **$${Math.round(negotiatingLeads.reduce((s, l) => s + l.dealValue, 0) * commissionRate).toLocaleString()}**\n- Closing streak: **${streakCount} days**\n\n---\n\n**Who to Call RIGHT NOW:**\n${negotiatingLeads.slice(0, 3).map((l, i) => {
      const comm = Math.round(l.dealValue * commissionRate);
      return `${i + 1}. **${l.name}** (${l.company}) — $${comm.toLocaleString()} commission | Score: ${l.score}/100 | ${l.decisionTimeline || 'ASAP'}`;
    }).join('\n')}\n\n**This Week's Goal:**\n- Close **2 more deals** to hit your weekly target\n- Total pipeline commission available: **$${Math.round(leads.reduce((s, l) => s + l.dealValue, 0) * commissionRate).toLocaleString()}**\n- Focus on leads in **Negotiation** stage first\n\nSelect a lead to get personalized coaching!`;
  }

  // ── COACH MODE: Celebration after action ─────────────────────────
  if (coachMode && (lower.includes('called') || lower.includes('sent') || lower.includes('closed') || lower.includes('done') || lower.includes('booked') || lower.includes('scheduled'))) {
    const topLead = selectedLead || leads[0];
    const commission = Math.round(topLead.dealValue * commissionRate);
    return `**Great move! Let's keep the momentum going.**\n\n---\n\nThat's **$${commission.toLocaleString()} in commission** if you close this.\n\n**Your Stats Today:**\n- Deals in progress: **${negotiatingLeads.length}**\n- Revenue this week: **$${Math.round(currentMRR / 4).toLocaleString()}** (estimated)\n- Closing streak: **${streakCount} days**\n- Pipeline health: **${leads.filter(l => l.momentum === 'rising').length} leads rising**\n\n**Next Move:**\n${negotiatingLeads.length > 0 ? `Call **${negotiatingLeads[0].name}** at ${negotiatingLeads[0].company} — they're worth $${Math.round(negotiatingLeads[0].dealValue * commissionRate).toLocaleString()} in commission and their decision timeline is ${negotiatingLeads[0].decisionTimeline || '2 weeks'}.` : 'Focus on qualifying more leads into your pipeline.'}\n\nYou're **${distanceToGoal > 0 ? `$${distanceToGoal.toLocaleString()} away from` : 'CRUSHING'}** your $25K MRR goal!`;
  }

  // ── TRENDPULSE MONETIZATION HELPER ───────────────────────────────
  if (lower.includes('monetize') || lower.includes('make money') || lower.includes('trade') || lower.includes('play') || lower.includes('bet') || lower.includes('prediction') || lower.includes('best plays') || lower.includes('money play')) {
    const pipelineCommission = Math.round(leads.reduce((s, l) => s + l.dealValue, 0) * commissionRate);
    const top3Commission = Math.round(leads.slice(0, 3).reduce((s, l) => s + l.dealValue, 0) * commissionRate);
    const lostLeads = leads.filter(l => l.status === 'lost');
    const lostRevenue = fmt(lostLeads.reduce((s, l) => s + l.dealValue, 0));
    return `**TrendPulse Money Plays**\n\nBased on current signals, here are your top plays:\n\n---\n\n**1. BTC Prediction Play** (Kalshi)\n- BTC above $100K by June → YES at $0.42 (58% implied)\n- GOATED AI confidence: 72% → **+30% alpha edge**\n- Bet $100 → Win $238 if YES | Risk: $100\n- [Place Bet on Kalshi →]\n\n**2. SOL Momentum Trade**\n- SOL showing rising momentum (+6.3% 24h)\n- Entry: $198 | Target: $220 | Stop: $185\n- Risk/Reward: 1:1.7\n- [Copy Trade Setup →]\n\n**3. B2B Revenue Play**\n- Your pipeline has **${lostRevenue}** in lost revenue leads\n- Close just 3 of your top 10 → **$${top3Commission.toLocaleString()} in commission**\n- [Call Top Lead Now →]\n\n---\n\n**Strategy: Split your time 70/30**\n- 70% → B2B closing (guaranteed commission)\n- 30% → Prediction markets (alpha plays)\n- Target: **$25K MRR** from closing + **$5K/mo** from trading\n\n**Your Edge:**\n- Total pipeline commission: **$${pipelineCommission.toLocaleString()}**\n- Current MRR: **$${currentMRR.toLocaleString()}**\n- ${negotiatingLeads.length} deals in negotiation ready to close\n\nGo to **Markets** for live prediction data, or **Leads** to start closing.`;
  }

  // Location-specific lead search (fallback)
  const FALLBACK_LOCATIONS = [
    'San Francisco', 'New York', 'Austin', 'Seattle', 'Boston', 'Chicago', 'Denver', 'Miami', 'LA', 'London',
    'Toronto', 'Berlin', 'Paris', 'Amsterdam', 'Dublin', 'Singapore', 'Sydney', 'Tokyo', 'Hong Kong', 'Tel Aviv',
    'Portland', 'Nashville', 'Atlanta', 'Dallas', 'Phoenix', 'San Diego', 'Philadelphia', 'Minneapolis', 'Detroit', 'Charlotte',
    'Raleigh', 'Salt Lake City', 'Pittsburgh', 'Columbus', 'Indianapolis', 'Tampa', 'Orlando', 'Las Vegas', 'Kansas City', 'St Louis',
  ];
  const FALLBACK_ALIASES = {
    'sf': 'San Francisco', 'nyc': 'New York', 'los angeles': 'LA', 'la': 'LA',
    'vegas': 'Las Vegas', 'philly': 'Philadelphia', 'atl': 'Atlanta',
  };

  // Check if user is asking about a specific location
  let searchLocation = null;
  for (const [alias, mapped] of Object.entries(FALLBACK_ALIASES)) {
    if (lower.includes(alias)) { searchLocation = mapped; break; }
  }
  if (!searchLocation) {
    for (const loc of FALLBACK_LOCATIONS) {
      if (lower.includes(loc.toLowerCase())) { searchLocation = loc; break; }
    }
  }

  if (searchLocation && (lower.includes('lead') || lower.includes('show') || lower.includes('find') || lower.includes('search') || lower.includes('in '))) {
    const locationLeads = leads.filter(l => l.location === searchLocation).sort((a, b) => b.score - a.score);
    if (locationLeads.length === 0) {
      return `**No leads found in ${searchLocation}.**\n\nOur database doesn't have leads in that location. Try searching in nearby cities:\n\n- **Austin**, **Dallas**, **Atlanta**, **Miami**, **Chicago**\n\nOr go to **Leads** to browse all ${leads.length.toLocaleString()} leads.`;
    }
    const top = locationLeads.slice(0, 5);
    const totalValue = locationLeads.reduce((s, l) => s + l.dealValue, 0);
    let res = `**Leads in ${searchLocation}** — ${locationLeads.length} found, **${fmt(totalValue)}** total pipeline\n\n---\n\n`;
    top.forEach((l) => {
      res += `[LEAD_CARD:${l.id}]\n`;
      res += `   Score: **${l.score}**/100 | Value: **${fmt(l.dealValue)}** | ${l.priority.toUpperCase()} | Conv: ${l.conversionProbability}%\n\n`;
    });
    if (locationLeads.length > 5) {
      res += `\n...and **${locationLeads.length - 5} more** in ${searchLocation}.\n\n`;
    }
    res += `---\n\nGo to **Leads** to see all results. Want outreach scripts for any of these?`;
    return res;
  }

  // Check for unlisted cities
  const UNLISTED = ['houston', 'san antonio', 'sacramento', 'san jose', 'washington', 'dc', 'new orleans', 'baltimore', 'memphis'];
  for (const city of UNLISTED) {
    if (lower.includes(city) && (lower.includes('lead') || lower.includes('show') || lower.includes('find'))) {
      const name = city.charAt(0).toUpperCase() + city.slice(1);
      return `**No leads found in ${name}.**\n\nThat city isn't in our current database. Try these nearby cities instead:\n\n- **Austin**, **Dallas**, **Atlanta**, **Miami**, **Nashville**\n\nOr go to **Leads** to browse all ${leads.length.toLocaleString()} leads.`;
    }
  }

  // Deal size filter
  const dealSizeMatch = lower.match(/\$\s*([\d,.]+)\s*[kK]/) || lower.match(/([\d,.]+)\s*[kK]\+?\s*(?:deal|lead|value)/);
  if (dealSizeMatch && (lower.includes('deal') || lower.includes('lead') || lower.includes('show') || lower.includes('find') || lower.includes('above') || lower.includes('over'))) {
    const minVal = parseFloat(dealSizeMatch[1].replace(/,/g, '')) * 1000;
    const bigDeals = leads.filter(l => l.dealValue >= minVal).sort((a, b) => b.dealValue - a.dealValue);
    if (bigDeals.length === 0) {
      return `**No leads found with deal value above $${minVal.toLocaleString()}.**\n\nTry a lower threshold or go to **Leads** to browse all leads.`;
    }
    const top = bigDeals.slice(0, 5);
    const totalValue = bigDeals.reduce((s, l) => s + l.dealValue, 0);
    let res = `**$${(minVal/1000)}K+ Deals** — ${bigDeals.length} found, **${fmt(totalValue)}** total\n\n---\n\n`;
    top.forEach((l) => {
      res += `[LEAD_CARD:${l.id}]\n`;
      res += `   **${fmt(l.dealValue)}** | ${l.location} | ${l.industry} | Score: ${l.score}/100\n\n`;
    });
    if (bigDeals.length > 5) res += `...and **${bigDeals.length - 5} more** above $${(minVal/1000)}K.\n\n`;
    res += `---\n\nGo to **Leads** for full results.`;
    return res;
  }

  // Industry filter
  const FALLBACK_INDUSTRIES = ['SaaS', 'Fintech', 'AI/ML', 'Healthcare', 'Cybersecurity', 'EdTech', 'E-commerce', 'Gaming', 'Web3/Crypto'];
  let searchIndustry = null;
  if (/\bsaas\b/i.test(lower)) searchIndustry = 'SaaS';
  else if (/\bfintech\b/i.test(lower)) searchIndustry = 'Fintech';
  else if (/\bai\b|\bml\b/i.test(lower)) searchIndustry = 'AI/ML';
  else if (/\bcyber/i.test(lower)) searchIndustry = 'Cybersecurity';
  else if (/\bhealth/i.test(lower)) searchIndustry = 'Healthcare';
  else if (/\bedtech\b|\beducation\b/i.test(lower)) searchIndustry = 'EdTech';
  else if (/\bgaming\b/i.test(lower)) searchIndustry = 'Gaming';
  else if (/\bcrypto\b|\bweb3\b/i.test(lower)) searchIndustry = 'Web3/Crypto';
  else if (/\becommerce\b|\be-comm/i.test(lower)) searchIndustry = 'E-commerce';

  if (searchIndustry && (lower.includes('lead') || lower.includes('find') || lower.includes('show') || lower.includes('compan'))) {
    const indLeads = leads.filter(l => l.industry === searchIndustry).sort((a, b) => b.score - a.score);
    if (indLeads.length === 0) {
      return `**No ${searchIndustry} leads found.**\n\nTry another industry or go to **Leads** to browse all leads.`;
    }
    const top = indLeads.slice(0, 5);
    const totalValue = indLeads.reduce((s, l) => s + l.dealValue, 0);
    let res = `**${searchIndustry} Leads** — ${indLeads.length} found, **${fmt(totalValue)}** total pipeline\n\n---\n\n`;
    top.forEach((l) => {
      res += `[LEAD_CARD:${l.id}]\n`;
      res += `   Score: **${l.score}**/100 | ${l.location} | **${fmt(l.dealValue)}** | ${l.status}\n\n`;
    });
    if (indLeads.length > 5) res += `...and **${indLeads.length - 5} more** ${searchIndustry} leads.\n\n`;
    res += `---\n\nGo to **Leads** to see all. Want outreach for any of these?`;
    return res;
  }

  // ── WALK ME THROUGH LEADS — structured walkthrough sorted by close probability ──
  if (lower.includes('walk me through') || lower.includes('walkthrough') || (lower.includes('walk') && lower.includes('lead'))) {
    const under20k = leads.filter(l => l.dealValue < 20000).sort((a, b) => b.conversionProbability - a.conversionProbability);
    const topWalkthrough = (under20k.length > 0 ? under20k : leads.sort((a, b) => b.conversionProbability - a.conversionProbability)).slice(0, 5);
    const totalValue = topWalkthrough.reduce((s, l) => s + l.dealValue, 0);
    const nextActions = {
      'new': 'Send initial outreach via best channel today',
      'contacted': 'Schedule a discovery call this week',
      'qualified': 'Prepare and send a tailored proposal',
      'negotiation': 'Call now — push for verbal commitment today',
      'proposal': 'Follow up on proposal and handle objections',
      'won': 'Upsell or request referral',
      'lost': 'Re-engage in 30 days with new angle',
    };
    let res = `**Lead Walkthrough — Top 5 Highest-Probability Leads${under20k.length > 0 ? ' Under $20K' : ''}**\n\nHere are your top 5 highest-probability leads${under20k.length > 0 ? ' under $20K' : ''} — sorted by close probability for speed-to-close:\n\n---\n\n`;
    topWalkthrough.forEach((l, i) => {
      const commission = Math.round(l.dealValue * 0.10);
      const whyCloseable = l.conversionProbability >= 70 ? 'High engagement + strong buying signals' :
        l.conversionProbability >= 50 ? 'Active interest + pain point alignment' :
        l.momentum === 'rising' ? 'Rising momentum indicates growing urgency' :
        'Recent activity shows continued evaluation';
      res += `[LEAD_CARD:${l.id}]\n`;
      res += `**${i + 1}. ${l.name}** at ${l.company}\n`;
      res += `   Deal: **${fmt(l.dealValue)}** | Close Prob: **${l.conversionProbability}%** | Commission: **$${commission.toLocaleString()}**\n`;
      res += `   Next Action: ${nextActions[l.status] || 'Follow up immediately'}\n`;
      res += `   Why closeable: ${whyCloseable}\n\n`;
    });
    res += `---\n\n**Total pipeline shown:** ${fmt(totalValue)} | **Combined commission:** $${Math.round(totalValue * 0.10).toLocaleString()}\n\n`;
    res += `**Speed-to-close tactics for sub-$20K deals:**\n- Same-day follow-up on every interaction\n- Simplified one-page proposals (no committee needed)\n- Create urgency: limited-time pricing or pilot window\n- Go direct to decision maker — skip gatekeepers\n\nWant outreach scripts for any of these? Or go to **Leads** for full pipeline.`;
    return res;
  }

  // ── CLOSABILITY SCORE BREAKDOWN ──
  if (lower.includes('closability') || lower.includes('closability score') || lower.includes('score breakdown') || (lower.includes('score') && lower.includes('break'))) {
    const target = selectedLead || leads[0];
    if (target) {
      const budgetFit = Math.min(100, Math.round(50 + (target.score || 50) * 0.4 + (target.dealValue < 20000 ? 15 : target.dealValue < 50000 ? 5 : -5)));
      const timing = target.momentum === 'rising' ? 85 : target.momentum === 'declining' ? 35 : 60;
      const decisionMaker = target.conversionProbability >= 70 ? 90 : target.conversionProbability >= 50 ? 65 : 40;
      const painUrgency = (target.painPoints || []).length >= 3 ? 85 : (target.painPoints || []).length >= 2 ? 65 : 45;
      const competition = target.competitorUsing ? 50 : 75;
      const overall = Math.round((budgetFit + timing + decisionMaker + painUrgency + competition) / 5);
      return `**Closability Score Breakdown — ${target.name}**\n\n---\n\n**Overall Closability: ${overall}/100**\n\n| Factor | Score | Assessment |\n|--------|-------|------------|\n| Budget Fit | **${budgetFit}**/100 | ${budgetFit >= 70 ? 'Deal size matches typical spend' : 'May need budget adjustment'} |\n| Timing | **${timing}**/100 | ${timing >= 70 ? 'High engagement, strike now' : timing >= 50 ? 'Moderate — needs nurturing' : 'Low urgency — long cycle'} |\n| Decision Maker Access | **${decisionMaker}**/100 | ${decisionMaker >= 70 ? 'Direct access confirmed' : 'May need to reach higher'} |\n| Pain Urgency | **${painUrgency}**/100 | ${painUrgency >= 70 ? 'Critical pain — they need a solution' : 'Pain exists but not urgent'} |\n| Competition | **${competition}**/100 | ${target.competitorUsing ? `Using ${target.competitorUsing} — displacement needed` : 'No incumbent — greenfield opportunity'} |\n\n---\n\n**Recommendation:** ${overall >= 70 ? 'This lead is highly closeable. Prioritize immediate contact.' : overall >= 50 ? 'Solid opportunity. Focus on building urgency and demonstrating ROI.' : 'Needs more nurturing. Build relationship before pushing for close.'}\n\nWant me to draft outreach for ${target.name}? Or go to **Leads** for more analysis.`;
    }
  }

  if (lower.includes('lead') || lower.includes('find') || lower.includes('top') || lower.includes('pipeline') || lower.includes('hottest')) {
    const top = leads.slice(0, 5);
    const critical = leads.filter(l => l.priority === 'critical');
    const rising = leads.filter(l => l.momentum === 'rising');
    const totalValue = leads.reduce((s, l) => s + l.dealValue, 0);
    let res = `**Pipeline Intelligence Report**\n\n`;
    res += `Your pipeline: **${leads.length.toLocaleString()} leads** worth **${fmt(totalValue)}**\n`;
    res += `Critical: **${critical.length}** | Rising momentum: **${rising.length}**\n\n`;
    res += `---\n\n`;
    res += `**Top 5 Leads by Score:**\n\n`;
    top.forEach((l) => {
      res += `[LEAD_CARD:${l.id}]\n`;
      res += `   Score: **${l.score}**/100 | Value: **${fmt(l.dealValue)}** | ${l.priority.toUpperCase()}\n`;
      res += `   Method: ${l.bestMethod} | Timeline: ${l.decisionTimeline} | Conv: ${l.conversionProbability}%\n\n`;
    });
    res += `---\n\n`;
    res += `Go to **Leads** to see all leads, or go to **Dashboard** for full pipeline metrics.\n\n`;
    res += `Want me to search leads by city or industry?`;
    return res;
  }

  if (lower.includes('business') || lower.includes('idea') || lower.includes('start')) {
    return `**Business Idea Generator**\n\nBased on current market trends and your pipeline data:\n\n---\n\n**1. AI Sales Automation SaaS**\nMarket Size: **$12B by 2028** | Growth: +42% YoY\nEntry: Build on GOATED's lead scoring engine\nMonetize: $99-499/mo SaaS + per-transaction fees\nCompetitive edge: Real-time lead intelligence + auto-outreach\n\n**2. Creator Deal Marketplace**\nMarket Size: **$104B** creator economy\nEntry: Launch marketplace on GOATED platform\nMonetize: 15% commission on closed deals\nCompetitive edge: AI-powered deal matching\n\n**3. Prediction Market Platform**\nMarket Size: **$50B+** and growing\nEntry: Extend GOATED **Markets** module\nMonetize: Platform fees + premium analytics subscriptions\nCompetitive edge: AI-driven probability models\n\n**4. Revenue Intelligence API**\nMarket Size: **$8B by 2027**\nEntry: Productize GOATED's analytics as an API\nMonetize: Usage-based pricing, $0.01 per enrichment\nCompetitive edge: 2,500+ lead dataset for training\n\n---\n\nCheck out **Trends** for real-time market data, or go to **Market** for competitive landscape.\n\nWhich idea should we deep-dive on? I can build a full business plan.`;
  }

  if (lower.includes('trend') || lower.includes('market') || lower.includes('pulse') || lower.includes('sector')) {
    return `**Market Pulse Update**\n\n---\n\n**Surging Sectors:**\n- **AI Sales Automation** — +42% this month [BLAZING]\n- **Revenue Intelligence** — +38% [HOT]\n- **Creator Economy B2B** — +35% [HOT]\n- **Prediction Markets** — +28% [RISING]\n\n**Declining Sectors:**\n- **Traditional Cold Outreach** — -8% [DECLINING]\n- **Manual CRM Tools** — -12% [COOLING]\n\n---\n\n**Key Insights:**\n1. AI-powered outreach is replacing traditional cold email. Companies using AI SDR tools see **3x higher reply rates**.\n2. Revenue intelligence platforms are consolidating - expect M&A activity.\n3. Creator economy B2B tools are the fastest-growing niche.\n\n**Your Pipeline Impact:**\n- ${leads.filter(l => l.industry === 'AI/ML').length} leads in AI/ML sector (hottest)\n- ${leads.filter(l => l.industry === 'SaaS').length} leads in SaaS (steady growth)\n- ${leads.filter(l => l.industry === 'Fintech').length} leads in Fintech (watch for regulation)\n\n---\n\nGo to **Trends** for live charts, or check **Market** for full global pulse.\n\nWant me to analyze how these trends impact your specific pipeline?`;
  }

  if (lower.includes('outreach') || lower.includes('call') || lower.includes('draft') || lower.includes('message') || lower.includes('sms') || lower.includes('voip') || lower.includes('script')) {
    const lead = leads[0];
    return `**Direct Outreach Suite for ${lead.name}**\n\n**Lead Intel:**\n- Company: ${lead.company} (${lead.industry})\n- Score: ${lead.score}/100 | Value: ${fmt(lead.dealValue)}\n- Pain Points: ${lead.painPoints.join(', ')}\n- Buying Signals: ${lead.buyingSignals.join(', ')}\n\n---\n\n**VoIP Call Script:**\n\nOpener: "Hi ${lead.name.split(' ')[0]}, this is [Your Name] from GOATED Solutions. I noticed ${lead.company} is ${lead.buyingSignals[0]?.toLowerCase() || 'scaling fast'} — congrats on that."\n\nHook: "We've been helping ${lead.industry} companies solve ${lead.painPoints[0]?.toLowerCase() || 'pipeline challenges'}, and I think there's a quick win for you."\n\nAsk: "Do you have 2 minutes? I want to share something specific to ${lead.company}."\n\nValue: "We helped a similar company 3x their pipeline in 30 days using AI-powered lead scoring and direct outreach."\n\nClose: "Can we do a quick 15-minute deep dive Thursday or Friday?"\n\n---\n\n**SMS Sequence (3-touch):**\n\n#1 (Day 0): "Hey ${lead.name.split(' ')[0]}, just left you a VM about ${lead.company}'s growth. Quick question about your ${lead.painPoints[0]?.toLowerCase() || 'outreach'} — mind if I share something?"\n\n#2 (Day 2): "${lead.name.split(' ')[0]}, we just helped a ${lead.industry} company close $${Math.round(lead.dealValue * 0.1 / 1000)}K in 30 days. Thought of ${lead.company}. Worth 5 min?"\n\n#3 (Day 5): "Last ping ${lead.name.split(' ')[0]}! If ${lead.painPoints[0]?.toLowerCase() || 'scaling'} is on your radar, I've got something you'll want to see. Link: [meeting link]"\n\n---\n\n**Voicemail Drop:**\n\n"Hey ${lead.name.split(' ')[0]}, it's [Name] from GOATED. Calling because I saw ${lead.company} is ${lead.buyingSignals[0]?.toLowerCase() || 'growing fast'}. We help ${lead.industry} teams solve ${lead.painPoints[0]?.toLowerCase() || 'pipeline issues'} fast. I'll shoot you a text with details. Talk soon."\n\n---\n\nConversion probability: **${lead.conversionProbability}%**\nRecommended channel: **${lead.bestMethod}**\n\nGo to **Leads** for full details, or check **Dashboard** for pipeline metrics.\n\nWant me to adjust the scripts or target a different lead?`;
  }

  if (lower.includes('forecast') || lower.includes('revenue') || lower.includes('project')) {
    const totalValue = leads.reduce((s, l) => s + l.dealValue, 0);
    const wonLeads = leads.filter(l => l.status === 'won');
    const wonValue = wonLeads.reduce((s, l) => s + l.dealValue, 0);
    const negotiating = leads.filter(l => l.status === 'negotiation');
    const negotiatingValue = negotiating.reduce((s, l) => s + l.dealValue, 0);
    return `**Revenue Forecast**\n\n---\n\n**Current Pipeline:**\n- Total Pipeline: **${fmt(totalValue)}** across ${leads.length.toLocaleString()} leads\n- Won Deals: **${fmt(wonValue)}** (${wonLeads.length} deals)\n- In Negotiation: **${fmt(negotiatingValue)}** (${negotiating.length} deals)\n\n**Projected Close (Next 30 Days):**\n- Conservative: **${fmt(negotiatingValue * 0.3)}** (30% of negotiating)\n- Realistic: **${fmt(negotiatingValue * 0.5)}** (50% of negotiating)\n- Optimistic: **${fmt(negotiatingValue * 0.75)}** (75% of negotiating)\n\n**Key Risks:**\n- ${leads.filter(l => l.momentum === 'declining' && l.status === 'negotiation').length} negotiating leads have declining momentum\n- ${leads.filter(l => l.decisionTimeline === '6 months').length} leads have 6-month timelines\n\n---\n\nGo to **Dashboard** for full revenue charts, or **Wallet** for financials.\n\nWant me to break this down by industry or priority level?`;
  }

  if (lower.includes('help') || lower.includes('command') || lower.includes('what can')) {
    return `**GOATED AI - Your Sales Copilot**\n\n---\n\nHere's everything I can do:\n\n**Lead Intelligence:**\n- "Find top leads" - Highest-scored leads\n- "Critical priority leads" - Urgent attention needed\n- "Rising momentum leads" - Hot opportunities\n\n**Outreach & Sales:**\n- "Draft outreach for [name]" - Auto-generate multi-channel messages\n- "Objection handling" - Scripts for common pushbacks\n- "Follow-up sequence" - Automated follow-up templates\n\n**Analytics & Trends:**\n- "Market trends" - Real-time market pulse\n- "Revenue forecast" - Pipeline projections\n- "Industry analysis" - Sector deep-dives\n\n**Strategy & Ideas:**\n- "Business idea" - AI business generator\n- "Competitive intel" - Competitor analysis\n- "Pipeline review" - Full health check\n\n---\n\nNavigate: **Dashboard** | **Leads** | **TrendPulse** | **Markets** | **Wallet** | **Admin**\n\nJust type naturally - I understand context from your current page.`;
  }

  if (lower.includes('competitor') || lower.includes('compet') || lower.includes('intel')) {
    const topCompanies = [...new Set(leads.map(l => l.competitorUsing).join(', ').split(', '))].slice(0, 8);
    return `**Competitive Intelligence Report**\n\n---\n\n**Top Competitor Mentions Across Your Pipeline:**\n${topCompanies.map((c, i) => `${i + 1}. **${c}** - mentioned by ${leads.filter(l => l.competitorUsing.includes(c)).length} leads`).join('\n')}\n\n**Key Observations:**\n- Most leads are evaluating **2-3 competitors** simultaneously\n- ${leads.filter(l => l.techStack.includes('Salesforce')).length} leads currently use Salesforce (prime displacement opportunity)\n- ${leads.filter(l => l.techStack === 'None - manual process').length} leads have no CRM (greenfield opportunity)\n\n**Displacement Strategy:**\n1. Target leads with manual processes first (lowest switching cost)\n2. Focus on Salesforce users experiencing pain points\n3. Offer migration packages for HubSpot users\n\n---\n\nGo to **Market** for full competitive landscape, or **Dashboard** for displacement scripts.\n\nWant me to build a specific battle card against any competitor?`;
  }

  // Default / catch-all response
  const totalValue = leads.reduce((s, l) => s + l.dealValue, 0);
  const critical = leads.filter(l => l.priority === 'critical');
  const rising = leads.filter(l => l.momentum === 'rising');
  const won = leads.filter(l => l.status === 'won');
  return `Got it. Let me pull some context for you.\n\n**Pipeline Snapshot:**\n- **${leads.length.toLocaleString()}** total leads worth **${fmt(totalValue)}**\n- **${critical.length}** critical priority leads need attention\n- **${rising.length}** leads with rising momentum\n- **${won.length}** deals closed won\n\n**Quick Intel:**\n- Top industry: **${leads.filter(l => l.industry === 'SaaS').length > leads.filter(l => l.industry === 'Fintech').length ? 'SaaS' : 'Fintech'}** (${Math.max(leads.filter(l => l.industry === 'SaaS').length, leads.filter(l => l.industry === 'Fintech').length)} leads)\n- Avg deal value: **${fmt(Math.round(totalValue / leads.length))}**\n- Avg conversion prob: **${Math.round(leads.reduce((s, l) => s + l.conversionProbability, 0) / leads.length)}%**\n\n---\n\nCheck **Dashboard** for full metrics, **Leads** for your pipeline, or **Trends** for market data.\n\nWhat would you like me to analyze deeper?`;
}

// ─── PARSE RESPONSE WITH FEATURE LINKS + LEAD LINKING ────────────────
function ParsedMessage({ content, onNavigate, onOpenLead, leads }) {
  // Split on bold markers, --- dividers, and lead card embeds
  const parts = content.split(/(\*\*[^*]+\*\*|---|\[LEAD_CARD:\d+\])/g);

  return (
    <span>
      {parts.map((part, i) => {
        // Horizontal divider
        if (part === '---') {
          return <span key={i} className="block border-t border-white/[0.03] my-2" />;
        }
        // Embedded lead card [LEAD_CARD:id]
        const leadCardMatch = part.match(/\[LEAD_CARD:(\d+)\]/);
        if (leadCardMatch && leads) {
          const lead = leads.find(l => l.id === parseInt(leadCardMatch[1]));
          if (lead) {
            return (
              <button key={i} onClick={() => onOpenLead(lead)}
                className="flex items-center gap-2 my-1.5 px-3 py-2 rounded-lg w-full text-left
                  bg-white/[0.03] hover:bg-brand/10 border border-white/[0.03] hover:border-brand/20 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center text-brand text-[10px] font-bold shrink-0">
                  {lead.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{lead.name}</div>
                  <div className="text-[10px] text-slate-500">{lead.company} · {lead.industry}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-brand">{lead.score}/100</div>
                  <div className="text-[10px] text-slate-500">{fmt(lead.dealValue)}</div>
                </div>
                <ArrowRight size={12} className="text-slate-600 group-hover:text-brand transition-colors shrink-0" />
              </button>
            );
          }
        }
        // Bold text with feature/lead linking
        if (part.startsWith('**') && part.endsWith('**')) {
          const inner = part.slice(2, -2);
          const lowerInner = inner.toLowerCase();
          // Check if this bold text matches a feature link
          const featureKey = Object.keys(FEATURE_LINKS).find(k => lowerInner === k || lowerInner === FEATURE_LINKS[k].label.toLowerCase());
          if (featureKey) {
            const fl = FEATURE_LINKS[featureKey];
            return (
              <button
                key={i}
                onClick={() => onNavigate(fl.page)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-brand font-bold
                  bg-brand/10 hover:bg-brand/20 border border-brand/20 hover:border-brand/40
                  transition-colors duration-200 cursor-pointer mx-0.5"
                style={{ textShadow: '0 0 10px rgba(16,185,129,0.3)' }}
              >
                <fl.icon size={11} />
                {inner}
                <ArrowRight size={9} className="opacity-60" />
              </button>
            );
          }
          // Check if bold text matches a lead name — make it clickable
          if (leads && onOpenLead) {
            const matchedLead = leads.find(l =>
              l.name.toLowerCase() === lowerInner ||
              l.company.toLowerCase() === lowerInner
            );
            if (matchedLead) {
              return (
                <button
                  key={i}
                  onClick={() => onOpenLead(matchedLead)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold
                    bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20
                    hover:border-purple-500/40 transition-colors duration-200 cursor-pointer mx-0.5"
                >
                  <Users size={10} />
                  {inner}
                  <ChevronRight size={9} className="opacity-60" />
                </button>
              );
            }
          }
          return <strong key={i} className="text-white font-semibold">{inner}</strong>;
        }
        // Plain text — detect URLs, phones, emails
        const urlRe = /(https?:\/\/[^\s<>]+)/g;
        const phoneRe = /(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
        const emailRe = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const combinedRe = /(https?:\/\/[^\s<>]+|\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const subParts = part.split(combinedRe);
        return (
          <span key={i}>
            {subParts.map((sp, j) => {
              if (urlRe.test(sp)) return <a key={j} href={sp} target="_blank" rel="noopener noreferrer" className="text-brand underline decoration-brand/30 hover:decoration-white/50 hover:text-white transition-colors inline-flex items-center gap-0.5">{sp.replace(/^https?:\/\//, '').slice(0, 40)}<ExternalLink size={9} className="inline opacity-60" /></a>;
              if (emailRe.test(sp)) return <a key={j} href={`mailto:${sp}`} className="text-brand underline decoration-brand/30 hover:text-white transition-colors">{sp}</a>;
              if (phoneRe.test(sp)) return <a key={j} href={`tel:${sp.replace(/[^+\d]/g, '')}`} className="text-brand underline decoration-brand/30 hover:text-white transition-colors">{sp}</a>;
              return <span key={j}>{sp}</span>;
            })}
          </span>
        );
      })}
    </span>
  );
}

// ─── STREAMING ASSISTANT MESSAGE ──────────────────────────────────────
function StreamingAssistantMessage({ content, isLatest, onNavigate, onOpenLead, leads }) {
  const { displayed, isStreaming } = useStreamingText(content, isLatest);
  return (
    <>
      <ParsedMessage content={displayed} onNavigate={onNavigate} onOpenLead={onOpenLead} leads={leads} />
      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 bg-brand/70 ml-0.5 animate-pulse rounded-sm" style={{ verticalAlign: 'text-bottom' }} />
      )}
    </>
  );
}

// ─── LOCATION-AWARE FOLLOW-UP SUGGESTIONS ───────────────────────────
const LOCATION_SUGGESTIONS = {
  'San Francisco': ['Austin', 'Seattle', 'LA'],
  'New York': ['Boston', 'Philadelphia', 'Charlotte'],
  'Austin': ['Dallas', 'Nashville', 'Denver'],
  'Seattle': ['Portland', 'San Francisco', 'Vancouver'],
  'Boston': ['New York', 'Raleigh', 'Philadelphia'],
  'Chicago': ['Minneapolis', 'Detroit', 'Columbus'],
  'Denver': ['Salt Lake City', 'Austin', 'Phoenix'],
  'Miami': ['Tampa', 'Orlando', 'Atlanta'],
  'Atlanta': ['Nashville', 'Charlotte', 'Raleigh'],
  'Dallas': ['Austin', 'Phoenix', 'Nashville'],
  'London': ['Dublin', 'Amsterdam', 'Paris'],
  'Toronto': ['Montreal', 'Vancouver', 'New York'],
};

function detectLocationInResponse(content) {
  const lower = content.toLowerCase();
  if (lower.includes('no leads found in')) {
    const match = content.match(/no leads found in (\w[\w\s]*)/i);
    if (match) return { notFound: match[1].trim() };
  }
  // Detect which location was searched
  for (const loc of Object.keys(LOCATION_SUGGESTIONS)) {
    if (lower.includes(loc.toLowerCase()) && (lower.includes('lead') || lower.includes('found') || lower.includes('pipeline'))) {
      return { found: loc };
    }
  }
  return null;
}

// ─── ACTION BUTTONS PARSED FROM RESPONSES ──────────────────────────────
function ResponseActions({ content, onNavigate, onQuickAction }) {
  const mentionedPages = [];
  const lowerContent = content.toLowerCase();
  Object.entries(FEATURE_LINKS).forEach(([key, val]) => {
    if (lowerContent.includes(key) && !mentionedPages.find(p => p.page === val.page)) {
      mentionedPages.push(val);
    }
  });

  // Detect location context for follow-up suggestions
  const locationCtx = detectLocationInResponse(content);
  let locationButtons = [];
  if (locationCtx) {
    if (locationCtx.found && LOCATION_SUGGESTIONS[locationCtx.found]) {
      locationButtons = LOCATION_SUGGESTIONS[locationCtx.found].map(city => ({
        label: `Leads in ${city}`,
        prompt: `Show me leads in ${city}`,
      }));
    } else if (locationCtx.notFound) {
      // Suggest nearby available cities
      const defaults = ['Austin', 'Miami', 'Atlanta', 'Dallas', 'Chicago'];
      locationButtons = defaults.slice(0, 3).map(city => ({
        label: `Try ${city}`,
        prompt: `Show me leads in ${city}`,
      }));
    }
  }

  // Also detect industry in response for follow-up
  const industryButtons = [];
  const industries = ['SaaS', 'Fintech', 'AI/ML', 'Healthcare', 'Cybersecurity'];
  if (lowerContent.includes('lead') && !lowerContent.includes('no leads found')) {
    for (const ind of industries) {
      if (lowerContent.includes(ind.toLowerCase())) {
        // Suggest other industries
        const others = industries.filter(i => i !== ind).slice(0, 2);
        others.forEach(other => {
          industryButtons.push({ label: `${other} leads`, prompt: `Find ${other} leads` });
        });
        break;
      }
    }
  }

  const hasNav = mentionedPages.length > 0;
  const hasFollowUp = locationButtons.length > 0 || industryButtons.length > 0;
  if (!hasNav && !hasFollowUp) return null;

  const unique = [...new Map(mentionedPages.map(p => [p.page, p])).values()].slice(0, 3);
  const allFollowUps = [...locationButtons, ...industryButtons].slice(0, 3);

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/[0.03]">
      {unique.map(p => (
        <button
          key={p.page}
          onClick={() => onNavigate(p.page)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium
            bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 hover:border-brand/40
            transition-all duration-200"
        >
          <p.icon size={11} />
          Go to {p.label}
          <ArrowRight size={9} />
        </button>
      ))}
      {allFollowUps.map(f => (
        <button
          key={f.label}
          onClick={() => onQuickAction && onQuickAction(f.prompt)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium
            bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/40
            transition-all duration-200"
        >
          <Globe size={11} />
          {f.label}
        </button>
      ))}
    </div>
  );
}

// ─── CONTEXTUAL ORB BADGES & PROACTIVE SUGGESTIONS ──────────────────────
const ORB_CONTEXT = {
  leads: { badge: 'hot leads', modeLabel: 'Lead Intel Mode', icon: Target },
  trends: { badge: 'new signals', modeLabel: 'Alpha Scanner', icon: TrendingUp },
  dashboard: { badge: null, modeLabel: 'Pipeline Overview', icon: BarChart3 },
  casino: { badge: null, modeLabel: 'Degen Casino', icon: Flame },
  market: { badge: null, modeLabel: 'Market Analysis', icon: Globe },
  home: { badge: null, modeLabel: 'Revenue Agent', icon: Sparkles },
  wallet: { badge: null, modeLabel: 'Wallet Intel', icon: Wallet },
  admin: { badge: null, modeLabel: 'Admin Console', icon: Shield },
  launchpad: { badge: null, modeLabel: 'LaunchPad', icon: Zap },
};

const PROACTIVE_SUGGESTIONS = {
  leads: [
    'I found 3 leads with 80%+ close probability',
    'Hot lead alert: 2 deals in negotiation need follow-up',
    'Your top lead score just jumped — check pipeline',
  ],
  trends: [
    'BTC breaking resistance — check alpha plays',
    'New sector surge detected: AI/ML up 42%',
    '2 prediction market edges found',
  ],
  dashboard: [
    'Pipeline health: 3 deals need attention today',
    'Revenue is trending up — keep the momentum',
    'Weekly target: 2 more closes to hit goal',
  ],
  casino: [
    'Degen alert: high EV play detected',
    'Your betting edge is +12% this session',
  ],
};

// ─── CONTEXT SUMMARY CARD ─────────────────────────────────────────────
function ContextSummaryCard({ currentPage, leads, degenMode, onAction }) {
  const summaries = useMemo(() => {
    if (!leads || leads.length === 0) return null;
    const topCloseable = leads
      .filter(l => l.status !== 'won' && l.status !== 'lost')
      .sort((a, b) => b.conversionProbability - a.conversionProbability)
      .slice(0, 5);
    const negotiating = leads.filter(l => l.status === 'negotiation');
    const rising = leads.filter(l => l.momentum === 'rising');
    const totalPipeline = leads.reduce((s, l) => s + l.dealValue, 0);

    switch (currentPage) {
      case 'leads':
        return {
          title: 'Top 5 Closeable Leads',
          icon: Target,
          color: 'brand',
          items: topCloseable.map(l => `${l.name} (${l.conversionProbability}%) — ${fmt(l.dealValue)}`),
          action: { label: 'Get closing playbook', prompt: 'Build me a closing playbook for my top 5 closeable leads right now. Include specific scripts and commission impact.' },
        };
      case 'trends':
        return {
          title: 'Market Summary',
          icon: TrendingUp,
          color: 'cyan',
          items: [
            `${rising.length} leads with rising momentum`,
            `${leads.filter(l => l.industry === 'AI/ML').length} AI/ML leads (hottest sector)`,
            `${leads.filter(l => l.industry === 'SaaS').length} SaaS leads (steady growth)`,
            `Pipeline exposure: ${fmt(totalPipeline)}`,
          ],
          action: { label: 'Deep market research', prompt: 'Research current market conditions and how they impact my pipeline. Analyze sector momentum, macro trends, and give me actionable plays.' },
        };
      case 'dashboard':
        return {
          title: 'Pipeline Health',
          icon: BarChart3,
          color: 'purple',
          items: [
            `${negotiating.length} deals in negotiation`,
            `${topCloseable.filter(l => l.conversionProbability >= 70).length} high-probability closes`,
            `Total pipeline: ${fmt(totalPipeline)}`,
            `Commission potential: ${fmt(Math.round(totalPipeline * 0.10))}`,
          ],
          action: { label: 'Optimize pipeline', prompt: 'Analyze my pipeline health: bottlenecks, at-risk deals, and specific actions to improve conversion rate. Be specific with names.' },
        };
      default:
        return null;
    }
  }, [currentPage, leads]);

  if (!summaries) return null;

  const colorMap = {
    brand: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.15)', text: '#10b981' },
    cyan: { bg: 'rgba(6,182,212,0.06)', border: 'rgba(6,182,212,0.15)', text: '#06b6d4' },
    purple: { bg: 'rgba(168,85,247,0.06)', border: 'rgba(168,85,247,0.15)', text: '#a855f7' },
  };
  const colors = colorMap[summaries.color] || colorMap.brand;

  return (
    <div className="mx-2 mt-1 rounded-xl p-2.5"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <summaries.icon size={11} style={{ color: colors.text }} />
        <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: colors.text }}>
          {summaries.title}
        </span>
      </div>
      <div className="space-y-0.5">
        {summaries.items.map((item, i) => (
          <div key={i} className="text-[10px] text-slate-400 flex items-start gap-1.5">
            <span className="text-slate-600 mt-0.5">-</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
      {summaries.action && (
        <button
          onClick={() => onAction(summaries.action.prompt)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
          style={{ background: colors.border, color: colors.text }}
        >
          <Sparkles size={9} />
          {summaries.action.label}
          <ArrowRight size={9} />
        </button>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────
export default function AIOverlay() {
  const { aiOpen, setAiOpen, leads: rawLeads, getLeads, page: currentPage, setPage, selectedLead, setSelectedLead, setDetailOpen, setPreviousPage, degenMode } = useStore();
  const leads = rawLeads || [];

  useEffect(() => {
    if (!rawLeads) getLeads();
  }, [rawLeads, getLeads]);

  // Initial messages based on mode
  const NORMAL_INTRO = "I'm **GOATED AI** — your revenue intelligence agent and deep research assistant.\n\nI have access to all platform data and can help with:\n- **Deep Research** — markets, companies, industries, competitive analysis\n- **Lead Intelligence** — search 500K+ leads, generate call scripts & SMS sequences\n- **Market Analysis** — real-time sentiment across all social platforms\n- **Predictive Analytics** — spread analysis, trend correlation, price predictions\n- **Direct Outreach** — VoIP scripts, SMS campaigns, voicemail drops\n- **General AI** — coding, writing, analysis, strategy, anything\n\nAll platform features (**Leads**, **TrendPulse**, **Dashboard**, **Markets**, **Wallet**) are embedded and accessible. Ask me anything.";

  const DEGEN_INTRO = "**WOLF MODE ACTIVATED** — I'm your GOATED AI degen co-pilot and I'm ready to make it rain.\n\nListen up king, here's what I bring to the table:\n- **Alpha Intelligence** — find the plays before anyone else, ape into the right deals\n- **Lead Sniping** — 500K+ targets scored and ranked, I'll tell you exactly who to call and what to say\n- **Market Pulse** — real-time degen sentiment, whale movements, what's pumping and what's dumping\n- **Prediction Markets** — spreads, odds, probability scoring — gamble smarter not harder\n- **Outreach Warfare** — VoIP scripts, SMS blasts, voicemail drops that actually convert\n- **Big Brain Mode** — strategy, analysis, whatever you need, I don't miss\n\nAll features unlocked: **Leads**, **TrendPulse**, **Dashboard**, **Markets**, **Wallet**\n\nLFG. What are we closing today?";

  // Core state
  const [messages, setMessages] = useState([
    { role: 'assistant', content: degenMode ? DEGEN_INTRO : NORMAL_INTRO }
  ]);

  // Reset intro when degen mode toggles
  const prevDegenRef = useRef(degenMode);
  useEffect(() => {
    if (prevDegenRef.current !== degenMode) {
      prevDegenRef.current = degenMode;
      setMessages([{ role: 'assistant', content: degenMode ? DEGEN_INTRO : NORMAL_INTRO }]);
    }
  }, [degenMode]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState('Thinking...');
  const [aiFailCount, setAiFailCount] = useState(0);
  const useAI = aiFailCount < 3; // Only disable after 3 consecutive failures
  const [coachMode, setCoachMode] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Proactive suggestion tooltip
  const [proactiveTip, setProactiveTip] = useState(null);
  const proactiveTimerRef = useRef(null);
  const proactiveDismissRef = useRef(null);
  useEffect(() => {
    // Show proactive suggestions every 30-60s when orb is visible but chat is closed
    const schedule = () => {
      const delay = 30000 + Math.random() * 30000;
      proactiveTimerRef.current = setTimeout(() => {
        if (!useStore.getState().aiOpen) {
          const pageSuggestions = PROACTIVE_SUGGESTIONS[currentPage] || PROACTIVE_SUGGESTIONS.dashboard;
          const tip = pageSuggestions[Math.floor(Math.random() * pageSuggestions.length)];
          setProactiveTip(tip);
          // Auto-dismiss after 5s
          proactiveDismissRef.current = setTimeout(() => setProactiveTip(null), 5000);
        }
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      clearTimeout(proactiveTimerRef.current);
      clearTimeout(proactiveDismissRef.current);
    };
  }, [currentPage]);

  // Orb badge context
  const orbCtx = ORB_CONTEXT[currentPage] || ORB_CONTEXT.home;
  const orbBadgeText = useMemo(() => {
    if (currentPage === 'leads') {
      const hot = leads.filter(l => l.conversionProbability >= 80).length;
      return hot > 0 ? `${hot} hot leads` : null;
    }
    if (currentPage === 'trends') {
      const rising = leads.filter(l => l.momentum === 'rising').length;
      return rising > 2 ? `${Math.min(rising, 9)} new signals` : null;
    }
    return null;
  }, [currentPage, leads]);

  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Revenue tracking stats (always computed for AI context)
  const revenueStats = useMemo(() => {
    const wonDeals = leads.filter(l => l.status === 'won');
    const wonValue = wonDeals.reduce((s, l) => s + l.dealValue, 0);
    const commissionRate = 0.10;
    const currentMRR = Math.round((wonValue * commissionRate) / 12);
    const mrrGoal = 25000;
    const negotiating = leads.filter(l => l.status === 'negotiation');
    const pendingCommission = Math.round(negotiating.reduce((s, l) => s + l.dealValue, 0) * commissionRate);
    const risingLeads = leads.filter(l => l.momentum === 'rising');
    const weekActivity = { calls: 8 + Math.floor(Math.random() * 15), outreach: 12 + Math.floor(Math.random() * 20) };
    const streakDays = 2 + Math.floor(Math.random() * 5);
    return {
      currentMRR,
      mrrGoal,
      distanceToGoal: Math.max(0, mrrGoal - currentMRR),
      wonDeals: wonDeals.length,
      wonValue,
      negotiatingCount: negotiating.length,
      pendingCommission,
      risingCount: risingLeads.length,
      totalPipeline: leads.reduce((s, l) => s + l.dealValue, 0),
      weekActivity,
      streakDays,
      pipelineHealth: risingLeads.length > leads.length * 0.3 ? 'Strong' : risingLeads.length > leads.length * 0.15 ? 'Good' : 'Needs Attention',
    };
  }, [leads]);

  // Determine contextual thinking label based on message content and page
  const getThinkingLabel = useCallback((msg) => {
    const lower = (msg || '').toLowerCase();
    // Lead-related queries
    if (/lead|pipeline|find|search|show me/.test(lower)) return 'Searching lead database...';
    if (/outreach|script|email|call|sms|draft/.test(lower)) return 'Crafting outreach scripts...';
    if (/clos|objection|negotiat|coach/.test(lower)) return 'Analyzing closing strategy...';
    if (/trend|market|sector|surge|pump/.test(lower)) return 'Scanning market signals...';
    if (/forecast|revenue|project/.test(lower)) return 'Running revenue forecast...';
    if (/competitor|compet|intel/.test(lower)) return 'Gathering competitive intel...';
    if (/idea|business|start/.test(lower)) return 'Generating business ideas...';
    if (/analyz|report|deep dive/.test(lower)) return 'Running deep analysis...';
    // Page-based defaults
    if (currentPage === 'leads') return 'Analyzing lead data...';
    if (currentPage === 'trends') return 'Scanning market signals...';
    if (currentPage === 'dashboard') return 'Optimizing pipeline...';
    if (currentPage === 'market') return 'Processing market data...';
    if (currentPage === 'wallet') return 'Crunching revenue numbers...';
    return 'Thinking...';
  }, [currentPage]);

  // Quick action buttons based on current page, coach mode, and selected lead
  const quickActions = useMemo(() => {
    const base = QUICK_ACTIONS[currentPage] || [];

    // When coach mode is on and on leads page, replace with coaching actions
    if (coachMode && currentPage === 'leads') {
      const coachActions = [
        { label: 'Call Script', prompt: selectedLead ? `Write a word-for-word cold call script for ${selectedLead.name} at ${selectedLead.company}. Include opener, hook, value prop, and close.` : 'Write a cold call script for my top lead. Include opener, hook, value prop, and close.', icon: Phone },
        { label: 'Handle Objections', prompt: selectedLead ? `Give me objection handling scripts for ${selectedLead.name} at ${selectedLead.company} in ${selectedLead.industry}. Cover: price, timing, competitor, and "not interested" objections.` : 'Give me objection handling scripts for common B2B objections: price, timing, competitor, and "not interested".', icon: Shield },
        { label: 'Email Template', prompt: selectedLead ? `Write a follow-up email template for ${selectedLead.name} at ${selectedLead.company}. Pain points: ${(selectedLead.painPoints||[]).join(', ')}. Make it personal and compelling.` : 'Write a follow-up email template for a qualified lead that creates urgency and drives a meeting.', icon: Send },
        { label: 'Next Best Action', prompt: selectedLead ? `What is the single best action I should take RIGHT NOW to close ${selectedLead.name} at ${selectedLead.company}? They are in ${selectedLead.status} stage, score ${selectedLead.score}/100. Be specific.` : 'What is the single best action I should take right now to close more deals? Look at my pipeline and be specific.', icon: Target },
      ];
      return coachActions;
    }

    // When a lead is selected on leads page, add outreach quick action
    if (selectedLead && currentPage === 'leads') {
      const firstName = selectedLead.name.split(' ')[0];
      const outreachAction = {
        label: `Draft outreach for ${firstName}`,
        prompt: `Draft a multi-channel outreach sequence for ${selectedLead.name} at ${selectedLead.company}. Industry: ${selectedLead.industry}. Pain points: ${(selectedLead.painPoints||[]).join(', ')}. Include email, call script, and LinkedIn DM.`,
        icon: Send,
      };
      // Prepend outreach action, avoid duplicates
      const filtered = base.filter(a => !a.label.includes('Draft outreach'));
      return [outreachAction, ...filtered].slice(0, 6);
    }

    return base;
  }, [currentPage, coachMode, selectedLead]);

  // Suggested prompts based on current page, coach mode, and degen mode
  const suggestedPrompts = useMemo(() => {
    if (coachMode) {
      return COACH_PROMPTS[currentPage] || COACH_PROMPTS.home;
    }
    const prompts = degenMode ? DEGEN_PROMPTS : PAGE_PROMPTS;
    return prompts[currentPage] || prompts.home;
  }, [currentPage, degenMode, coachMode]);

  // Navigate to page helper
  const navigateTo = useCallback((pageId) => {
    setPage(pageId);
    // Don't close overlay - companion mode stays open
  }, [setPage]);

  // Open a specific lead's detail page
  const openLead = useCallback((lead) => {
    setPreviousPage(currentPage);
    setSelectedLead(lead);
    setDetailOpen(true);
  }, [currentPage, setPreviousPage, setSelectedLead, setDetailOpen]);

  // Send message
  const send = useCallback(async () => {
    if (!input.trim() || typing) return;
    const msg = input.trim();
    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInput('');
    setTyping(true);
    setThinkingLabel(getThinkingLabel(msg));

    // Build context about pipeline for the AI
    const leadCtx = selectedLead ? `\n\nCurrently viewing lead: ${selectedLead.name} at ${selectedLead.company} (${selectedLead.industry}), Score: ${selectedLead.score}/100, Deal: $${(selectedLead.dealValue||0).toLocaleString()}, Status: ${selectedLead.status}, Priority: ${selectedLead.priority}, Phone: ${selectedLead.phone||'N/A'}, Email: ${selectedLead.email||'N/A'}, Website: ${selectedLead.website||'N/A'}, Location: ${selectedLead.location||'N/A'}, Pain Points: ${(selectedLead.painPoints||[]).join(', ')}, Buying Signals: ${(selectedLead.buyingSignals||[]).join(', ')}, Best Method: ${selectedLead.bestMethod||'email'}` : '';
    const revenueCtx = `\n\nRevenue tracking: Current MRR: $${revenueStats.currentMRR.toLocaleString()}, Goal: $${revenueStats.mrrGoal.toLocaleString()}/mo, Distance to goal: $${revenueStats.distanceToGoal.toLocaleString()}, Won deals: ${revenueStats.wonDeals}, Pending commission: $${revenueStats.pendingCommission.toLocaleString()}, Deals in negotiation: ${revenueStats.negotiatingCount}, Pipeline health: ${revenueStats.pipelineHealth}, This week: ${revenueStats.weekActivity.calls} calls made, ${revenueStats.weekActivity.outreach} outreach sent, Closing streak: ${revenueStats.streakDays} days`;
    const coachCtx = coachMode ? '\n\nCOACH MODE IS ON: Act as a real-time closing coach. Be proactive, suggest next actions, celebrate wins, give specific dollar amounts for commission, create urgency based on decision timelines, and reference their pipeline goals.' : '';
    const pipelineContext = `Pipeline context: ${leads.length} leads, top 5: ${leads.slice(0, 5).map(l =>
      `${l.name} at ${l.company} (score: ${l.score}, value: ${fmt(l.dealValue)}, priority: ${l.priority}, status: ${l.status})`
    ).join('; ')}${leadCtx}${revenueCtx}${coachCtx}`;

    // Try real AI API first
    if (useAI) {
      try {
        const apiMessages = newMessages
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role,
            content: m.role === 'user' && m === newMessages[newMessages.length - 1]
              ? `${m.content}\n\n[${pipelineContext}]`
              : m.content
          }));

        // Send a slim subset of leads for server-side search (top 2500 by score, minimal fields)
        const slimLeads = leads.slice(0, 2500).map(l => ({
          id: l.id, name: l.name, company: l.company, industry: l.industry,
          location: l.location, score: l.score, dealValue: l.dealValue,
          status: l.status, priority: l.priority, conversionProbability: l.conversionProbability,
          bestMethod: l.bestMethod, email: l.email, phone: l.phone,
        }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, degenMode, leadData: slimLeads, currentPage }),
        });

        const data = await res.json();

        if (!data.fallback && data.content) {
          setMessages(p => [...p, { role: 'assistant', content: data.content }]);
          setAiFailCount(0); // Reset on success
          setTyping(false);
          return;
        }
        setAiFailCount(c => c + 1);
      } catch {
        setAiFailCount(c => c + 1);
      }
    }

    // Fallback to template responses
    setTimeout(() => {
      const res = getTemplateResponse(msg, leads, { coachMode, selectedLead, revenueStats });
      setMessages(p => [...p, { role: 'assistant', content: res }]);
      setTyping(false);
    }, 600 + Math.random() * 400);
  }, [input, typing, messages, leads, useAI, degenMode, coachMode, selectedLead, revenueStats]);

  // Coach Mode: proactive suggestions when viewing a lead
  const prevSelectedRef = useRef(selectedLead?.id);
  useEffect(() => {
    if (coachMode && selectedLead && selectedLead.id !== prevSelectedRef.current) {
      prevSelectedRef.current = selectedLead.id;
      const commission = Math.round(selectedLead.dealValue * 0.10);
      const daysInStage = 1 + Math.floor(Math.random() * 5);
      let proactiveMsg = '';
      if (selectedLead.status === 'negotiation') {
        proactiveMsg = `**Coach Alert:** You should call **${selectedLead.name}** now — they've been in Negotiation for ${daysInStage} days. This deal is worth **$${commission.toLocaleString()} in commission**. Decision timeline: ${selectedLead.decisionTimeline || '2 weeks'}. Don't let this one slip!`;
      } else if (selectedLead.status === 'qualified') {
        proactiveMsg = `**Coach Alert:** **${selectedLead.name}** is qualified and ready for a demo. Commission opportunity: **$${commission.toLocaleString()}**. Their pain points are ${(selectedLead.painPoints||[]).slice(0, 2).join(' and ')} — lead with those.`;
      } else if (selectedLead.status === 'won') {
        proactiveMsg = `**Great call!** That's **$${commission.toLocaleString()} in commission** from closing ${selectedLead.name}! Now ask for a referral to 10x this win.`;
      } else {
        proactiveMsg = `**Coach Alert:** Viewing **${selectedLead.name}** (${selectedLead.company}). Score: ${selectedLead.score}/100, worth **$${commission.toLocaleString()} in commission**. Best approach: **${selectedLead.bestMethod || 'Phone call'}**. Want me to coach you through the close?`;
      }
      setMessages(p => [...p, { role: 'assistant', content: proactiveMsg }]);
    }
  }, [coachMode, selectedLead]);

  // Quick action handler - sets input and sends
  const handleQuickAction = useCallback((label) => {
    setInput(label);
    // Use a microtask to ensure state is set before sending
    setTimeout(() => {
      const newMessages = [...messages, { role: 'user', content: label }];
      setMessages(newMessages);
      setTyping(true);

      if (useAI) {
        const leadCtx = selectedLead ? `\n\nCurrently viewing lead: ${selectedLead.name} at ${selectedLead.company} (${selectedLead.industry}), Score: ${selectedLead.score}/100, Deal: $${(selectedLead.dealValue||0).toLocaleString()}, Status: ${selectedLead.status}` : '';
        const revenueCtx = `\n\nRevenue tracking: Current MRR: $${revenueStats.currentMRR.toLocaleString()}, Goal: $${revenueStats.mrrGoal.toLocaleString()}/mo, Distance to goal: $${revenueStats.distanceToGoal.toLocaleString()}, Pending commission: $${revenueStats.pendingCommission.toLocaleString()}, Pipeline health: ${revenueStats.pipelineHealth}`;
        const coachCtx = coachMode ? '\n\nCOACH MODE IS ON: Act as a real-time closing coach.' : '';
        const pipelineContext = `Pipeline context: ${leads.length} leads, top 5: ${leads.slice(0, 5).map(l =>
          `${l.name} at ${l.company} (score: ${l.score}, value: ${fmt(l.dealValue)}, priority: ${l.priority}, status: ${l.status})`
        ).join('; ')}${leadCtx}${revenueCtx}${coachCtx}`;

        const slimLeadsQA = leads.slice(0, 2500).map(l => ({
          id: l.id, name: l.name, company: l.company, industry: l.industry,
          location: l.location, score: l.score, dealValue: l.dealValue,
          status: l.status, priority: l.priority, conversionProbability: l.conversionProbability,
          bestMethod: l.bestMethod, email: l.email, phone: l.phone,
        }));

        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.filter(m => m.role !== 'system').map(m => ({
              role: m.role,
              content: m === newMessages[newMessages.length - 1]
                ? `${m.content}\n\n[${pipelineContext}]`
                : m.content
            })),
            degenMode,
            leadData: slimLeadsQA,
            currentPage,
          }),
        })
          .then(r => r.json())
          .then(data => {
            if (!data.fallback && data.content) {
              setMessages(p => [...p, { role: 'assistant', content: data.content }]);
              setAiFailCount(0);
              setTyping(false);
              return;
            }
            setAiFailCount(c => c + 1);
            throw new Error('fallback');
          })
          .catch(() => {
            setTimeout(() => {
              const res = getTemplateResponse(label, leads, { coachMode, selectedLead, revenueStats });
              setMessages(p => [...p, { role: 'assistant', content: res }]);
              setTyping(false);
            }, 600 + Math.random() * 400);
          });
      } else {
        setTimeout(() => {
          const res = getTemplateResponse(label, leads, { coachMode, selectedLead, revenueStats });
          setMessages(p => [...p, { role: 'assistant', content: res }]);
          setTyping(false);
        }, 600 + Math.random() * 400);
      }
      setInput('');
    }, 10);
  }, [messages, leads, useAI, degenMode, coachMode, selectedLead, revenueStats]);

  // ─── PANEL LAYOUT ───────────────────────────────────────────────────
  // Always right panel on desktop, full screen on mobile
  const panelClasses = isMobile
    ? 'fixed inset-0 z-50 flex flex-col'
    : 'fixed top-9 right-0 bottom-0 z-50 w-[320px] flex flex-col';

  // ─── RENDER ──────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setAiOpen(false)}
        />
      )}

      {/* Main Panel */}
      <div
        className={panelClasses}
        style={{
          background: 'rgba(3, 7, 15, 0.97)',
          backdropFilter: 'blur(24px) saturate(1.6)',
          borderLeft: isMobile ? 'none' : '1px solid rgba(16,185,129,0.08)',
          animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ── HEADER ────────────────────────────────────────────────── */}
        <div
          className="shrink-0 p-3 border-b border-white/[0.03]"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.03), rgba(6,182,212,0.01), transparent)',
          }}
        >
          {/* Top bar */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))',
                    boxShadow: '0 0 20px rgba(16,185,129,0.1)',
                  }}
                >
                  <GoatIcon className="w-4 h-4 text-brand" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand border-2"
                  style={{ borderColor: 'rgba(5,10,20,0.9)' }} />
              </div>
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span className="glitter-text">GOATED AI</span>
                  {useAI && (
                    <span className="text-[8px] px-1 py-0.5 rounded-full font-semibold tracking-wider"
                      style={{
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.15))',
                        color: '#10b981',
                        border: '1px solid rgba(16,185,129,0.2)',
                      }}
                    >
                      LIVE
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-slate-500">Agent · {currentPage}</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Coach Mode Toggle */}
              <button
                onClick={() => setCoachMode(!coachMode)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                  coachMode
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-white/[0.03] text-slate-500 border border-white/[0.05] hover:text-amber-400 hover:bg-amber-500/10'
                }`}
                title="Toggle Coach Mode"
              >
                <Trophy size={11} />
                COACH
              </button>
              <button
                onClick={() => setAiOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick action chips */}
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {suggestedPrompts.map(a => (
                <button
                  key={a.label}
                  onClick={() => handleQuickAction(a.label)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
                    whitespace-nowrap transition-all duration-200 shrink-0"
                  style={{
                    background: 'rgba(16,185,129,0.05)',
                    border: '1px solid rgba(16,185,129,0.1)',
                    color: '#94a3b8',
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = 'rgba(16,185,129,0.12)';
                    e.target.style.borderColor = 'rgba(16,185,129,0.25)';
                    e.target.style.color = '#e2e8f0';
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'rgba(16,185,129,0.05)';
                    e.target.style.borderColor = 'rgba(16,185,129,0.1)';
                    e.target.style.color = '#94a3b8';
                  }}
                >
                  <a.icon size={11} className="text-brand shrink-0" />
                  {a.label}
                </button>
              ))}
            </div>
        </div>

        {/* ── COACH MODE MINI DASHBOARD ──────────────────────────────── */}
        {coachMode && (
          <div className="mx-2 mt-1 p-2 rounded-xl border"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.05), rgba(245,158,11,0.02))',
              borderColor: 'rgba(245,158,11,0.15)',
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Trophy size={10} className="text-amber-400" />
              <span className="text-[9px] font-bold text-amber-400 tracking-wider">COACH MODE</span>
              <div className="flex-1" />
              <span className="text-[9px] text-amber-400/60">{revenueStats.streakDays}-day streak</span>
              <Flame size={10} className="text-amber-400" />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="text-center p-1 rounded-lg bg-black/30">
                <div className="text-[10px] font-bold text-white">${revenueStats.currentMRR >= 1000 ? `${(revenueStats.currentMRR / 1000).toFixed(1)}K` : revenueStats.currentMRR}</div>
                <div className="text-[8px] text-slate-500">MRR</div>
              </div>
              <div className="text-center p-1 rounded-lg bg-black/30">
                <div className="text-[10px] font-bold text-amber-400">{revenueStats.negotiatingCount}</div>
                <div className="text-[8px] text-slate-500">In Progress</div>
              </div>
              <div className="text-center p-1 rounded-lg bg-black/30">
                <div className="text-[10px] font-bold text-brand">${revenueStats.pendingCommission >= 1000 ? `${(revenueStats.pendingCommission / 1000).toFixed(0)}K` : revenueStats.pendingCommission}</div>
                <div className="text-[8px] text-slate-500">Pending $</div>
              </div>
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-black/30 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (revenueStats.currentMRR / revenueStats.mrrGoal) * 100)}%`,
                  background: 'linear-gradient(90deg, #f59e0b, #10b981)',
                }}
              />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[8px] text-slate-500">${revenueStats.distanceToGoal >= 1000 ? `${(revenueStats.distanceToGoal / 1000).toFixed(1)}K` : revenueStats.distanceToGoal} to goal</span>
              <span className="text-[8px] text-slate-500">${revenueStats.mrrGoal >= 1000 ? `${(revenueStats.mrrGoal / 1000).toFixed(0)}K` : revenueStats.mrrGoal} MRR</span>
            </div>
          </div>
        )}

        {/* ── CONTEXT SUMMARY CARD ──────────────────────────────────── */}
        {messages.length <= 1 && !coachMode && (
          <ContextSummaryCard
            currentPage={currentPage}
            leads={leads}
            degenMode={degenMode}
            onAction={handleQuickAction}
          />
        )}

        {/* ── QUICK INSIGHT BUTTONS ───────────────────────────────────── */}
        {messages.length <= 1 && (
          <div className="mx-2 mt-1">
            <div className="flex items-center gap-1.5 mb-1 px-0.5">
              <Brain size={9} className={degenMode ? 'text-orange-400' : 'text-brand'} />
              <span className={`text-[9px] font-bold tracking-wider uppercase ${degenMode ? 'text-orange-400' : 'text-slate-500'}`}>
                {degenMode ? 'Alpha Intel' : 'Quick Insights'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(degenMode ? DEGEN_INSIGHTS : QUICK_INSIGHTS).map(qi => (
                <button
                  key={qi.label}
                  onClick={() => handleQuickAction(qi.prompt)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all text-left"
                  style={{
                    background: degenMode ? 'rgba(249,115,22,0.06)' : 'rgba(16,185,129,0.04)',
                    border: degenMode ? '1px solid rgba(249,115,22,0.12)' : '1px solid rgba(16,185,129,0.08)',
                    color: '#94a3b8',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = degenMode ? 'rgba(249,115,22,0.15)' : 'rgba(16,185,129,0.12)';
                    e.currentTarget.style.borderColor = degenMode ? 'rgba(249,115,22,0.3)' : 'rgba(16,185,129,0.25)';
                    e.currentTarget.style.color = degenMode ? '#f97316' : '#10b981';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = degenMode ? 'rgba(249,115,22,0.06)' : 'rgba(16,185,129,0.04)';
                    e.currentTarget.style.borderColor = degenMode ? 'rgba(249,115,22,0.12)' : 'rgba(16,185,129,0.08)';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  <qi.icon size={10} className={`shrink-0 ${degenMode ? 'text-orange-500' : 'text-brand'}`} />
                  {qi.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── LEAD CONTEXT BANNER ────────────────────────────────────── */}
        {selectedLead && (
          <div className="mx-2 mt-1 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-[9px] font-bold">
                  {selectedLead.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{selectedLead.name}</div>
                  <div className="text-[10px] text-slate-400">{selectedLead.company} · {selectedLead.industry}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-purple-400">{selectedLead.score}/100</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'Get Lead Brief', action: `Give me a comprehensive lead brief for ${selectedLead.name} at ${selectedLead.company}. Include: background summary, industry (${selectedLead.industry}), company size, deal value ($${(selectedLead.dealValue||0).toLocaleString()}), pain points (${(selectedLead.painPoints||[]).join(', ')}), buying signals (${(selectedLead.buyingSignals||[]).join(', ')}), competitive landscape (using ${selectedLead.competitorUsing || 'unknown'}), decision timeline (${selectedLead.decisionTimeline || 'unknown'}), closability score breakdown (budget fit, timing, decision maker access, pain urgency, competition), and recommended strategy.` },
                { label: 'Analyze Lead', action: `Analyze ${selectedLead.name} at ${selectedLead.company} — give me a full intelligence report with close probability, best approach, and revenue opportunity` },
                { label: `Draft Outreach for ${selectedLead.name.split(' ')[0]}`, action: `Draft a full multi-channel outreach sequence for ${selectedLead.name} at ${selectedLead.company}. Industry: ${selectedLead.industry}, pain points: ${(selectedLead.painPoints||[]).join(', ')}, buying signals: ${(selectedLead.buyingSignals||[]).join(', ')}. Include personalized email, cold call script, and LinkedIn DM.` },
                { label: 'Coach Me', action: `Coach me on closing ${selectedLead.name} at ${selectedLead.company}. Status: ${selectedLead.status}, Score: ${selectedLead.score}/100, Deal: $${(selectedLead.dealValue||0).toLocaleString()}. What should I do RIGHT NOW?` },
                { label: 'Closability Score', action: `Show me the closability score breakdown for ${selectedLead.name} at ${selectedLead.company}. Break down: Budget Fit, Timing, Decision Maker Access, Pain Urgency, and Competition. Score: ${selectedLead.score}, Conversion: ${selectedLead.conversionProbability}%, Momentum: ${selectedLead.momentum}, Pain Points: ${(selectedLead.painPoints||[]).join(', ')}, Competitor: ${selectedLead.competitorUsing || 'None'}` },
              ].map(qa => (
                <button key={qa.label} onClick={() => { setInput(qa.action); }}
                  className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 transition-colors">
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── MESSAGES AREA ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-2.5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                style={{ animation: `slideInUp 0.3s ease-out ${Math.min(i * 0.05, 0.3)}s both` }}>
                <div className="flex gap-2 max-w-[88%]">
                  {/* Assistant avatar */}
                  {m.role === 'assistant' && (
                    <div className="shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))',
                        }}
                      >
                        <GoatIcon className="w-3.5 h-3.5 text-brand" />
                      </div>
                    </div>
                  )}

                  <div>
                    <div
                      className={`px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'rounded-2xl rounded-br-md'
                          : 'rounded-2xl rounded-bl-md'
                      }`}
                      style={
                        m.role === 'user'
                          ? {
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: '#000',
                              fontWeight: 500,
                            }
                          : {
                              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.6))',
                              border: '1px solid rgba(255,255,255,0.04)',
                              color: '#cbd5e1',
                            }
                      }
                    >
                      {m.role === 'assistant' ? (
                        <StreamingAssistantMessage
                          content={m.content}
                          isLatest={i === messages.length - 1 || (i === messages.length - 2 && typing)}
                          onNavigate={navigateTo}
                          onOpenLead={openLead}
                          leads={leads}
                        />
                      ) : (
                        m.content
                      )}
                    </div>

                    {/* Action buttons for assistant messages */}
                    {m.role === 'assistant' && (
                      <ResponseActions content={m.content} onNavigate={navigateTo} onQuickAction={handleQuickAction} />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex justify-start" style={{ animation: 'slideInUp 0.2s ease-out' }}>
                <div className="flex gap-2">
                  <div className="shrink-0 mt-1">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))',
                      }}
                    >
                      <GoatIcon className="w-3.5 h-3.5 text-brand" />
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md"
                    style={{
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.6))',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(idx => (
                          <div
                            key={idx}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                              animation: `bounce 0.6s ${idx * 0.15}s infinite`,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-500 ml-1">{thinkingLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>
        </div>

        {/* ── INPUT AREA ────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-white/[0.03] p-3"
          style={{ background: 'rgba(5, 10, 20, 0.5)' }}>

          {/* Contextual quick action pills */}
          {quickActions.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {quickActions.map(qa => (
                <button
                  key={qa.label}
                  onClick={() => setInput(qa.prompt)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium
                    transition-all duration-200 whitespace-nowrap"
                  style={{
                    background: 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.1)',
                    color: '#64748b',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(16,185,129,0.15)';
                    e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)';
                    e.currentTarget.style.color = '#10b981';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(16,185,129,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(16,185,129,0.1)';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  <qa.icon size={9} />
                  {qa.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={coachMode ? "Ask your closing coach..." : "Ask GOATED AI anything..."}
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-all placeholder-slate-600"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: coachMode ? '1px solid rgba(245,158,11,0.15)' : '1px solid rgba(16,185,129,0.08)',
                color: '#e2e8f0',
              }}
              onFocus={e => {
                e.target.style.borderColor = coachMode ? 'rgba(245,158,11,0.35)' : 'rgba(16,185,129,0.25)';
                e.target.style.boxShadow = coachMode ? '0 0 0 3px rgba(245,158,11,0.05)' : '0 0 0 3px rgba(16,185,129,0.05)';
              }}
              onBlur={e => {
                e.target.style.borderColor = coachMode ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.08)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={send}
              disabled={typing || !input.trim()}
              className="px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-1.5
                disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: input.trim() && !typing
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'rgba(16,185,129,0.1)',
                color: input.trim() && !typing ? '#000' : '#10b981',
                boxShadow: input.trim() && !typing
                  ? '0 0 20px rgba(16,185,129,0.2), 0 4px 12px rgba(0,0,0,0.3)'
                  : 'none',
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
