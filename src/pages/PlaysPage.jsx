import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Clock, Target, Zap, Trophy, ArrowRight, CheckCircle2, Users,
  TrendingUp, Star, Shield, ChevronDown, ChevronUp, Sparkles, Brain,
  Copy, ThumbsUp, Send, MessageSquare, Search, Filter, X, Calendar,
  BarChart3, Lightbulb, UserPlus, Share2, Globe, Lock, PenTool,
  AlertCircle, Check, Crosshair, Phone, Mail, Heart, Activity,
  Rocket, Bot, RefreshCw, DollarSign, Award, Flame, Eye,
  Download, MessageCircle, Hash, Layers, Radio, Wifi
} from 'lucide-react';

/* ================================================================
   PLAYS DATA — 27 Plays across 5 categories
   ================================================================ */
const playCategories = [
  { id: 'cold-outreach', label: 'Cold Outreach', icon: Phone, color: '#3b82f6' },
  { id: 'inbound', label: 'Inbound Funnels', icon: Rocket, color: '#10b981' },
  { id: 'closing', label: 'Closing Plays', icon: Trophy, color: '#f59e0b' },
  { id: 'retention', label: 'Retention & Upsell', icon: Heart, color: '#ec4899' },
  { id: 'automation', label: 'Automation', icon: Bot, color: '#8b5cf6' },
];

const plays = [
  // ── Cold Outreach ──
  { category: 'cold-outreach', name: 'LinkedIn DM Blitz', difficulty: 'medium', rate: 64, steps: 7, time: '5 days', leads: 1847, color: '#3b82f6',
    description: 'Systematically reach decision-makers through personalized LinkedIn DMs at scale. Target 50 prospects daily with custom messaging.',
    steps_detail: ['Build ICP-matched prospect list (200+)', 'Scrape recent activity and triggers', 'Craft 5 message variants per persona', 'Send 50 connection requests daily', 'Follow up accepted connections within 4hrs', 'Share relevant case study in thread', 'Book discovery call with warm replies'],
    aiPlan: { timeline: ['Day 1: Build target list of 200 ICP-matched prospects', 'Day 2: Send first 50 connection requests with personalized notes', 'Day 3: Follow up with accepted connections, engage their content', 'Day 4-5: Convert warm conversations to booked calls'], templates: ['Hey {first_name}, saw your post about {topic} -- really resonated with what we\'re seeing at {our_company}. Would love to compare notes on {pain_point}.', '{first_name}, noticed {company} just {trigger_event}. We helped {similar_company} navigate the same transition and they saw {result}. Worth a quick chat?'], predicted: { meetings: '8-12', pipeline: '$120K-$280K', closeRate: '28-38%' } } },
  { category: 'cold-outreach', name: 'Cold Email Sequence', difficulty: 'easy', rate: 52, steps: 5, time: '14 days', leads: 3240, color: '#60a5fa',
    description: 'Five-touch email sequence with pattern interrupts and value-first messaging. Average 34% open rate, 8% reply rate.',
    steps_detail: ['Enrich leads with Clearbit/Apollo data', 'Write 5-email sequence with A/B variants', 'Configure sending schedule (Day 1,3,5,8,14)', 'Monitor opens and clicks in real-time', 'Route hot replies to sales team instantly'],
    aiPlan: { timeline: ['Day 1: Launch 500 leads into sequence', 'Day 3: Analyze opens, adjust subject lines', 'Day 5-8: Follow up with engaged prospects', 'Day 14: Breakup email drives final conversions'], templates: ['Subject: Quick question about {company}\'s {department}\n\nHi {first_name}, {personalized_observation}. We helped {reference_company} cut their {metric} by {percentage}. Mind if I share how?', 'Subject: closing the loop\n\n{first_name}, I\'ve reached out a couple times. Totally understand if timing is off. Just don\'t want you to miss what {similar_company} found when they made the switch.'], predicted: { meetings: '15-25', pipeline: '$180K-$420K', closeRate: '22-30%' } } },
  { category: 'cold-outreach', name: 'Twitter/X Engagement', difficulty: 'medium', rate: 48, steps: 8, time: '21 days', leads: 920, color: '#38bdf8',
    description: 'Build authority on Twitter/X by engaging target accounts daily, then convert followers into pipeline through DMs.',
    steps_detail: ['Identify 100 target accounts to engage', 'Comment thoughtfully on 20 posts daily', 'Quote tweet with added insights', 'Publish 2 original posts daily', 'DM engaged followers with soft CTA', 'Share exclusive content via DM', 'Convert warm conversations to calls', 'Track attribution from social to pipeline'],
    aiPlan: { timeline: ['Week 1: Engage 20 target accounts daily with value comments', 'Week 2: Start publishing original content, DM engaged followers', 'Week 3: Convert warm DM conversations to booked calls'], templates: ['Great thread on {topic}, {first_name}. One thing I\'d add -- we\'ve found that {insight} when working with {industry} companies. The data backs it up.', 'DM: Hey {first_name}, loved your take on {topic}. We actually built something that addresses that exact problem. Want to see it?'], predicted: { meetings: '5-10', pipeline: '$75K-$180K', closeRate: '25-35%' } } },
  { category: 'cold-outreach', name: 'Video Prospecting', difficulty: 'hard', rate: 71, steps: 6, time: '3 days', leads: 680, color: '#2563eb',
    description: 'Record personalized Loom videos for high-value targets. 3x response rate vs text-only outreach.',
    steps_detail: ['Select top 20 high-value targets', 'Research each company for 10 min', 'Record 60-sec personalized Loom per prospect', 'Embed video in email with custom thumbnail', 'Follow up with LinkedIn message + video link', 'Book call from video reply thread'],
    aiPlan: { timeline: ['Day 1: Research and record 10 personalized videos', 'Day 2: Send videos via email + LinkedIn', 'Day 3: Follow up on views, book calls from warm replies'], templates: ['Subject: Recorded this for you, {first_name} [VIDEO]\n\nHi {first_name}, I recorded a quick 60-second video showing something I noticed about {company}\'s {area}. No pitch, just thought you\'d find it useful. {loom_link}'], predicted: { meetings: '6-10', pipeline: '$150K-$350K', closeRate: '35-45%' } } },
  { category: 'cold-outreach', name: 'Voice Drop Campaign', difficulty: 'easy', rate: 44, steps: 4, time: '2 days', leads: 2100, color: '#1d4ed8',
    description: 'Ringless voicemail drops paired with same-day email follow-up. Reach 500+ prospects in hours.',
    steps_detail: ['Record 3 voicemail scripts (30 sec each)', 'Upload prospect list to voice drop platform', 'Schedule drops for 8-9am local time', 'Send email follow-up within 2 hours of drop'],
    aiPlan: { timeline: ['Day 1: Record scripts, upload 500 contacts, schedule drops', 'Day 1: Prepare email follow-up sequence', 'Day 2: Monitor callbacks, send follow-up emails', 'Day 2: Book meetings from inbound calls'], templates: ['Voicemail: Hey {first_name}, this is {your_name} from {company}. Quick message -- I noticed {trigger} and wanted to share how {similar_company} handled the same thing. Shoot me a text or email and I\'ll send the details.'], predicted: { meetings: '10-18', pipeline: '$90K-$200K', closeRate: '18-28%' } } },
  { category: 'cold-outreach', name: 'Multi-Touch Blitz', difficulty: 'hard', rate: 58, steps: 12, time: '14 days', leads: 412, color: '#4f46e5',
    description: 'Coordinated attack across email, LinkedIn, phone, and social. For high-value enterprise targets only.',
    steps_detail: ['LinkedIn profile view + connect', 'Day 1: Cold email with hook', 'Day 2: LinkedIn DM follow-up', 'Day 3: Comment on their content', 'Day 5: Cold call attempt #1', 'Day 7: Email #2 with case study', 'Day 8: LinkedIn voice note', 'Day 10: Call attempt #2', 'Day 11: Email #3 breakup teaser', 'Day 12: Final LinkedIn message', 'Day 13: Phone + email same day', 'Day 14: Breakup email'],
    aiPlan: { timeline: ['Week 1: Email + LinkedIn sequence (5 touches)', 'Week 1: Cold call attempts (2x)', 'Week 2: Escalate with voice notes + case studies', 'Week 2: Breakup sequence to create urgency'], templates: ['Subject: Quick question about {company}\'s {pain_point}\n\nHi {first_name}, noticed {buying_signal}. We helped {similar_company} solve this exact issue and saw {result}. Worth 10 minutes?'], predicted: { meetings: '4-6', pipeline: '$200K-$500K', closeRate: '30-40%' } } },

  // ── Inbound Funnels ──
  { category: 'inbound', name: 'Lead Magnet Funnel', difficulty: 'medium', rate: 56, steps: 8, time: '7 days', leads: 4200, color: '#10b981',
    description: 'Create a high-value downloadable resource that captures emails and feeds a nurture sequence converting at 12%.',
    steps_detail: ['Research top pain points in ICP', 'Create 20-page guide or template pack', 'Build landing page with social proof', 'Set up email capture + delivery automation', 'Write 7-email nurture sequence', 'Add retargeting pixel for non-converters', 'Promote via LinkedIn ads + organic posts', 'A/B test headlines and CTAs weekly'],
    aiPlan: { timeline: ['Day 1-2: Research and create lead magnet content', 'Day 3: Build landing page and email automation', 'Day 4-5: Write nurture sequence', 'Day 6-7: Launch promotion campaign'], templates: ['Landing page headline: The Ultimate {Industry} Playbook: {Number} Strategies Top Companies Use to {Desired Outcome}', 'Nurture email 1: Thanks for grabbing the guide, {first_name}. Most people skip to page 12 -- that\'s where the real gold is. Quick question: which of these challenges resonates most with you?'], predicted: { meetings: '20-35', pipeline: '$300K-$700K', closeRate: '15-25%' } } },
  { category: 'inbound', name: 'Webinar Pipeline', difficulty: 'medium', rate: 62, steps: 9, time: '14 days', leads: 1850, color: '#34d399',
    description: 'Host weekly webinars that convert 18% of attendees into qualified pipeline. Automated follow-up within 1 hour.',
    steps_detail: ['Choose topic aligned with buyer pain points', 'Create slide deck with actionable insights', 'Build registration page with countdown timer', 'Promote across LinkedIn, email, and partners', 'Host live session with Q&A segment', 'Send recording + resources within 1 hour', 'Follow up with attendees who asked questions', 'Book strategy calls from engaged attendees', 'Repurpose content into blog + social clips'],
    aiPlan: { timeline: ['Week 1: Build content, create registration page, start promotion', 'Week 2: Host webinar, follow up same day, book calls'], templates: ['Registration page: Join {number}+ {role}s who\'ve already registered for "{webinar_title}". You\'ll learn: {benefit_1}, {benefit_2}, {benefit_3}. Live Q&A included.'], predicted: { meetings: '12-20', pipeline: '$250K-$550K', closeRate: '20-30%' } } },
  { category: 'inbound', name: 'Content Flywheel', difficulty: 'hard', rate: 48, steps: 10, time: '30 days', leads: 6800, color: '#059669',
    description: 'Build a self-sustaining content engine that generates 500+ inbound leads monthly through SEO, social, and email.',
    steps_detail: ['Audit competitor content for gaps', 'Build content calendar (5 pieces/week)', 'Write flagship pillar content (3 guides)', 'Publish daily across LinkedIn + Twitter', 'Repurpose into video, podcast, carousel', 'Gate premium content behind email', 'Set up automated nurture for new subscribers', 'Engage every commenter personally', 'Analyze top performers and double down', 'Scale with guest contributors'],
    aiPlan: { timeline: ['Week 1: Content audit + calendar + first pillar piece', 'Week 2: Daily publishing begins, build engagement loops', 'Week 3: Launch gated content + nurture', 'Week 4: Analyze, optimize, scale up output'], templates: ['LinkedIn hook: Most {role}s waste 40+ hours/week on {activity}. Here\'s the 4-step framework I used to cut that to 4 hours (thread)'], predicted: { meetings: '25-40', pipeline: '$400K-$900K', closeRate: '12-22%' } } },
  { category: 'inbound', name: 'SEO Authority Play', difficulty: 'hard', rate: 45, steps: 8, time: '60 days', leads: 8900, color: '#047857',
    description: 'Dominate search rankings for high-intent buyer keywords. Builds compounding inbound traffic that converts 24/7.',
    steps_detail: ['Keyword research: find 50 high-intent terms', 'Map keywords to buyer journey stages', 'Write 20 long-form articles (2000+ words each)', 'Build internal linking structure', 'Launch link building campaign (guest posts)', 'Optimize existing content based on GSC data', 'Add CTAs and conversion points to all pages', 'Track rankings, traffic, and conversions weekly'],
    aiPlan: { timeline: ['Month 1: Keyword research, write and publish 10 articles', 'Month 2: Publish remaining 10 articles, start link building', 'Month 2+: Optimize and scale based on rankings data'], templates: ['Article template: {Primary Keyword}: The Complete Guide for {Target Role}s in {Year}. Cover: What, Why, How, Examples, FAQ.'], predicted: { meetings: '30-60', pipeline: '$500K-$1.2M', closeRate: '10-18%' } } },
  { category: 'inbound', name: 'Referral Engine', difficulty: 'easy', rate: 72, steps: 5, time: '3 days', leads: 1240, color: '#6ee7b7',
    description: 'Turn every closed deal into 3+ warm referrals. Creates compounding pipeline with 55% close rate on referred deals.',
    steps_detail: ['Send post-close satisfaction survey', 'Ask for 3 specific referrals by name', 'Provide pre-written referral templates to champion', 'Follow up on each referral within 24 hours', 'Send thank-you gift to referrer after intro'],
    aiPlan: { timeline: ['Day 1: Send NPS survey to 50 recent customers', 'Day 2: Request referrals from promoters (score 9-10)', 'Day 3: Send warm intros and follow up within 24hrs'], templates: ['Hi {customer}, thrilled you\'re seeing {specific_result}! Quick ask -- do you know 2-3 {titles} who\'d benefit similarly? Happy to make it easy with a warm intro template.'], predicted: { meetings: '8-15', pipeline: '$150K-$350K', closeRate: '45-60%' } } },

  // ── Closing Plays ──
  { category: 'closing', name: 'Demo to Close', difficulty: 'medium', rate: 68, steps: 7, time: '7 days', leads: 890, color: '#f59e0b',
    description: 'Structured demo framework that converts 68% of qualified demos into closed deals within one week.',
    steps_detail: ['Pre-call research: map their tech stack and pain points', 'Open with discovery recap (2 min)', 'Demo only features tied to their pain points', 'Show ROI calculator with their real numbers', 'Address top 3 objections proactively', 'Present pricing with anchoring technique', 'Set next step before hanging up'],
    aiPlan: { timeline: ['Pre-demo: Research company, prep custom ROI calculator', 'Demo day: Execute structured framework (45 min)', 'Day 2: Send custom proposal with ROI projections', 'Day 3-7: Follow up, handle objections, close'], templates: ['Pre-demo email: {first_name}, looking forward to our call. To make sure I show you the most relevant features, quick question: what\'s the #1 metric you\'re trying to improve this quarter?'], predicted: { meetings: '10-15', pipeline: '$200K-$450K', closeRate: '55-70%' } } },
  { category: 'closing', name: 'Proposal Accelerator', difficulty: 'easy', rate: 74, steps: 5, time: '3 days', leads: 560, color: '#fbbf24',
    description: 'Send proposals that close themselves. Interactive pricing, embedded ROI, and built-in e-sign gets deals done in 72 hours.',
    steps_detail: ['Generate custom proposal from CRM data', 'Include interactive ROI calculator', 'Add video walkthrough of proposal highlights', 'Enable e-signature directly in document', 'Set up auto-reminder sequence (24hr, 48hr, 72hr)'],
    aiPlan: { timeline: ['Day 1: Generate and send interactive proposal', 'Day 2: Monitor views, send video walkthrough', 'Day 3: Call to review, close on the spot'], templates: ['Proposal email: {first_name}, as promised, here\'s the full proposal for {company}. The interactive ROI section on page 3 uses your actual numbers -- think you\'ll find it interesting. Ready for e-sign whenever you are.'], predicted: { meetings: '5-8', pipeline: '$300K-$650K', closeRate: '65-78%' } } },
  { category: 'closing', name: 'Objection Crusher', difficulty: 'medium', rate: 61, steps: 6, time: '5 days', leads: 720, color: '#d97706',
    description: 'Systematic framework for handling the top 12 sales objections. Turns "no" into "let me think about it" into "yes".',
    steps_detail: ['Map all objections heard in last 90 days', 'Create response framework per objection type', 'Build proof point library (case studies, data)', 'Role-play with team using real scenarios', 'Deploy in live calls, track conversion lift', 'Update playbook monthly with new objections'],
    aiPlan: { timeline: ['Day 1-2: Audit objections and build response frameworks', 'Day 3: Create proof point library', 'Day 4: Team role-play sessions', 'Day 5: Deploy live and track results'], templates: ['Price objection: I hear you. Let me ask -- if we could show a 4x return in {timeframe}, would the investment make sense? Here\'s how {similar_company} saw exactly that...'], predicted: { meetings: '8-12', pipeline: '$180K-$400K', closeRate: '50-65%' } } },
  { category: 'closing', name: 'FOMO Close', difficulty: 'easy', rate: 66, steps: 4, time: '2 days', leads: 340, color: '#b45309',
    description: 'Create genuine urgency with limited-time offers, cohort-based pricing, and competitive intelligence.',
    steps_detail: ['Share competitive intelligence ("your competitor just signed")', 'Offer cohort-based pricing expiring in 48 hours', 'Send social proof from recent similar closed deals', 'Final call with decision summary and countdown'],
    aiPlan: { timeline: ['Day 1: Share competitive intel and time-limited offer', 'Day 2: Follow up with social proof, close on final call'], templates: ['Urgency email: {first_name}, wanted to give you a heads-up -- we\'re closing our Q{quarter} cohort pricing on {date}. After that, pricing goes up 20%. Also, I can share that {competitor_hint} in your space just signed. Happy to jump on a quick call today.'], predicted: { meetings: '3-5', pipeline: '$150K-$320K', closeRate: '60-72%' } } },
  { category: 'closing', name: 'Multi-Thread Deal', difficulty: 'hard', rate: 78, steps: 8, time: '10 days', leads: 280, color: '#92400e',
    description: 'Engage 3-5 stakeholders simultaneously in enterprise deals. Deals with 3+ threads close 78% of the time.',
    steps_detail: ['Map buying committee (champion, EB, influencer, blocker)', 'Tailor messaging per stakeholder role', 'Get champion to make warm intros internally', 'Send personalized value props to each thread', 'Align all stakeholders on business case', 'Handle individual objections per thread', 'Coordinate group presentation', 'Close with mutual action plan'],
    aiPlan: { timeline: ['Day 1-3: Map committee, tailor messaging, get intros', 'Day 4-6: Engage each stakeholder individually', 'Day 7-8: Align all threads on business case', 'Day 9-10: Group presentation and close'], templates: ['To champion: {first_name}, to move this forward, we\'ll need {EB_name}\'s sign-off on budget. Would you be able to intro me? I\'ll send a one-pager tailored to their priorities.'], predicted: { meetings: '6-10', pipeline: '$500K-$1.5M', closeRate: '70-82%' } } },

  // ── Retention & Upsell ──
  { category: 'retention', name: 'Expansion Revenue', difficulty: 'medium', rate: 70, steps: 6, time: '14 days', leads: 450, color: '#ec4899',
    description: 'Identify and execute upsell opportunities in existing accounts. Expansion revenue costs 5x less than new acquisition.',
    steps_detail: ['Analyze product usage data per account', 'Identify accounts hitting usage limits', 'Map unused features to known pain points', 'Send personalized usage insights report', 'Propose tiered upgrade with ROI projection', 'Close expansion within current billing cycle'],
    aiPlan: { timeline: ['Week 1: Analyze usage, identify top 20 expansion targets', 'Week 1: Send usage insights and upgrade recommendations', 'Week 2: Follow up, present ROI, close expansion deals'], templates: ['Hi {first_name}, I noticed {company} has been crushing it with {feature} -- you\'re in the top 10% of users. There\'s a feature in our growth plan that could take that even further. Want to see the numbers?'], predicted: { meetings: '8-14', pipeline: '$200K-$500K', closeRate: '55-70%' } } },
  { category: 'retention', name: 'Win-Back Campaign', difficulty: 'medium', rate: 38, steps: 7, time: '21 days', leads: 620, color: '#f472b6',
    description: 'Re-engage churned customers with personalized win-back offers. 38% of churned accounts return within 90 days.',
    steps_detail: ['Segment churned accounts by reason and tenure', 'Research what changed since they left', 'Craft personalized win-back message per segment', 'Offer exclusive return incentive', 'Share product updates addressing their churn reason', 'Schedule reconnection call', 'Onboard returning customers with white-glove treatment'],
    aiPlan: { timeline: ['Week 1: Segment churned accounts, research changes', 'Week 2: Send personalized win-back campaigns', 'Week 3: Follow up, offer incentives, re-onboard returnees'], templates: ['Hi {first_name}, it\'s been {months} months since {company} was with us. Since then, we\'ve shipped {feature_1} and {feature_2} -- both directly addressing what you mentioned when you left. Would love 15 minutes to show you.'], predicted: { meetings: '10-18', pipeline: '$120K-$300K', closeRate: '30-42%' } } },
  { category: 'retention', name: 'NPS to Upsell', difficulty: 'easy', rate: 65, steps: 4, time: '5 days', leads: 380, color: '#db2777',
    description: 'Convert NPS promoters (9-10) into expansion deals and referral sources. Promoters have 3x higher upsell rate.',
    steps_detail: ['Send NPS survey to active accounts', 'Auto-route promoters to upsell sequence', 'Send personalized thank-you with upgrade offer', 'Request referrals from highest scorers'],
    aiPlan: { timeline: ['Day 1: Send NPS survey to all active accounts', 'Day 2-3: Route promoters to upsell workflow', 'Day 4-5: Follow up with upgrade offers and referral requests'], templates: ['Thanks for the amazing feedback, {first_name}! Since you\'re getting so much value from {feature}, I think our {tier} plan would be a game-changer for you. Here\'s why...'], predicted: { meetings: '6-10', pipeline: '$100K-$250K', closeRate: '55-68%' } } },
  { category: 'retention', name: 'Quarterly Business Review', difficulty: 'medium', rate: 82, steps: 6, time: '7 days', leads: 210, color: '#be185d',
    description: 'Strategic QBRs that drive 82% renewal rate and uncover expansion opportunities in every session.',
    steps_detail: ['Pull account usage and ROI data', 'Build custom QBR deck per account', 'Include benchmark comparisons vs peers', 'Present wins, gaps, and recommendations', 'Align on next quarter goals', 'Propose expansion tied to new goals'],
    aiPlan: { timeline: ['Day 1-3: Build custom QBR decks for top 10 accounts', 'Day 4-5: Conduct QBR sessions', 'Day 6-7: Follow up with action items and expansion proposals'], templates: ['QBR agenda: 1) Wins this quarter ({metric_1} up {percent}%), 2) Benchmark vs industry peers, 3) Gaps and recommendations, 4) Goals for next quarter, 5) How we can help you get there faster'], predicted: { meetings: '10-15', pipeline: '$350K-$800K', closeRate: '75-85%' } } },
  { category: 'retention', name: 'Customer Advocacy', difficulty: 'easy', rate: 55, steps: 5, time: '10 days', leads: 170, color: '#9d174d',
    description: 'Build an army of customer advocates who create content, refer prospects, and defend you in communities.',
    steps_detail: ['Identify top 25 power users and champions', 'Invite to exclusive advocacy program', 'Co-create case study or testimonial', 'Feature them in content and events', 'Reward with early access and recognition'],
    aiPlan: { timeline: ['Day 1-3: Identify and invite top advocates', 'Day 4-7: Co-create content and schedule features', 'Day 8-10: Launch advocacy rewards and track referrals'], templates: ['{first_name}, you\'re one of our most successful customers -- seriously impressive results. We\'d love to feature your story in a case study. It\'d give {company} great visibility and we\'ll promote it across our channels. Interested?'], predicted: { meetings: '5-8', pipeline: '$80K-$200K', closeRate: '45-58%' } } },

  // ── Automation ──
  { category: 'automation', name: 'AI Email Writer', difficulty: 'easy', rate: 54, steps: 4, time: '1 day', leads: 5200, color: '#8b5cf6',
    description: 'AI drafts personalized emails for every prospect using enriched data. Send 500 personalized emails in under an hour.',
    steps_detail: ['Connect lead data source (CRM/CSV)', 'AI enriches each lead with public data', 'AI generates personalized email per prospect', 'Review and approve batch, auto-send'],
    aiPlan: { timeline: ['Hour 1: Import leads and run enrichment', 'Hour 2: AI generates 500 personalized emails', 'Hour 3: Review samples, approve batch', 'Hour 4: Auto-send with tracking enabled'], templates: ['AI-generated: Hi {first_name}, saw that {company} is {recent_news}. When companies in {industry} hit this stage, they typically face {pain_point}. We built something specifically for this -- {one_line_pitch}. Worth a look?'], predicted: { meetings: '20-35', pipeline: '$250K-$600K', closeRate: '18-28%' } } },
  { category: 'automation', name: 'Auto-Enrichment Pipeline', difficulty: 'medium', rate: 62, steps: 6, time: '2 days', leads: 8400, color: '#a78bfa',
    description: 'Automatically enrich every lead with 40+ data points from Clearbit, Apollo, and LinkedIn. Zero manual research.',
    steps_detail: ['Connect to enrichment APIs (Clearbit, Apollo, Hunter)', 'Set up webhook for new lead ingestion', 'Auto-score leads based on ICP fit', 'Route high-score leads to instant outreach', 'Flag intent signals for priority follow-up', 'Sync enriched data back to CRM'],
    aiPlan: { timeline: ['Day 1: Connect APIs, configure scoring model', 'Day 1: Set up webhooks and routing rules', 'Day 2: Test with batch of 100 leads', 'Day 2: Go live with full pipeline'], templates: ['Enrichment fields: Company size, revenue, tech stack, recent funding, hiring signals, decision-maker contacts, social profiles, intent signals, competitive landscape'], predicted: { meetings: '25-40', pipeline: '$400K-$900K', closeRate: '20-32%' } } },
  { category: 'automation', name: 'Slack Deal Alerts', difficulty: 'easy', rate: 88, steps: 3, time: '1 day', leads: 0, color: '#7c3aed',
    description: 'Real-time Slack notifications for deal movements, at-risk accounts, and hot leads. Never miss a buying signal.',
    steps_detail: ['Connect CRM to Slack via webhook', 'Configure alert rules (deal stage changes, risk signals, hot leads)', 'Set up team channels for different alert types'],
    aiPlan: { timeline: ['Hour 1: Connect CRM webhook to Slack', 'Hour 2: Configure alert rules and channels', 'Hour 3: Test with sample data, go live'], templates: ['Alert format: :fire: HOT LEAD: {company} ({size} employees) just visited pricing page 3x in 1 hour. Contact: {first_name} {last_name}, {title}. Last activity: {activity}.'], predicted: { meetings: 'N/A', pipeline: 'Accelerates $500K+', closeRate: '+15% lift' } } },
  { category: 'automation', name: 'CRM Auto-Sync', difficulty: 'medium', rate: 76, steps: 5, time: '2 days', leads: 0, color: '#6d28d9',
    description: 'Bidirectional sync between all tools and CRM. Emails, calls, meetings, and notes logged automatically.',
    steps_detail: ['Map data fields across all tools', 'Set up bidirectional sync rules', 'Configure conflict resolution logic', 'Enable auto-logging for emails, calls, meetings', 'Build dashboard for sync health monitoring'],
    aiPlan: { timeline: ['Day 1: Map fields, configure sync rules', 'Day 1: Set up conflict resolution', 'Day 2: Enable auto-logging across tools', 'Day 2: Build monitoring dashboard'], templates: ['Sync rules: Email replies -> CRM activity log | Calendar events -> CRM meetings | Call recordings -> CRM notes | LinkedIn messages -> CRM touchpoints'], predicted: { meetings: 'N/A', pipeline: 'Saves 8hrs/rep/week', closeRate: '+12% accuracy' } } },
  { category: 'automation', name: 'Lead Scoring Bot', difficulty: 'hard', rate: 67, steps: 7, time: '5 days', leads: 12000, color: '#5b21b6',
    description: 'ML-powered lead scoring that predicts conversion probability. Prioritize the right leads automatically.',
    steps_detail: ['Collect historical conversion data (12 months)', 'Identify top predictive signals', 'Train scoring model on historical patterns', 'Assign scores to all existing leads', 'Set up real-time scoring for new leads', 'Create routing rules by score tier', 'Monitor model accuracy and retrain monthly'],
    aiPlan: { timeline: ['Day 1-2: Collect data and identify signals', 'Day 3: Train and validate scoring model', 'Day 4: Deploy model, score existing leads', 'Day 5: Set up real-time scoring and routing'], templates: ['Score breakdown: Firmographic fit (30%), Behavioral signals (25%), Intent data (20%), Engagement level (15%), Timing signals (10%)'], predicted: { meetings: '35-60', pipeline: '$600K-$1.5M', closeRate: '25-38%' } } },
];

/* ================================================================
   PLAY CATEGORIES
   ================================================================ */


/* ================================================================
   AI PROMPTS — 12 prompts
   ================================================================ */
const aiPrompts = [
  { title: 'ICP Research Deep Dive', category: 'Prospecting', effectiveness: 4.9, prompt: 'You are a B2B sales researcher. Analyze {company_name} and provide: 1) Key decision makers with titles, 2) Recent company news/triggers, 3) Likely pain points based on their industry, 4) Tech stack they probably use, 5) 3 personalized conversation starters. Be specific and actionable.' },
  { title: 'Cold Email Personalization', category: 'Outreach', effectiveness: 4.8, prompt: 'Write a cold email to {name} at {company}. They are a {title} in {industry}. Recent trigger: {trigger}. My product helps with {value_prop}. Make it under 100 words, conversational, and end with a soft CTA. No fluff. Sound human, not salesy.' },
  { title: 'Objection Handler Script', category: 'Objection Handling', effectiveness: 4.7, prompt: 'I just heard this objection: "{objection}". My product is {product_desc}. Give me 3 different response strategies: 1) Empathize + redirect, 2) Story-based (use a hypothetical case study), 3) Question-based (reframe with a question). Keep each under 50 words.' },
  { title: 'Discovery Call Questions', category: 'Prospecting', effectiveness: 4.6, prompt: 'Generate 10 discovery call questions for a {title} at a {industry} company. Focus on uncovering: budget authority, timeline, pain points, current solutions, and decision process. Make questions open-ended and conversational. Order from easiest to hardest.' },
  { title: 'Follow-Up Sequence Writer', category: 'Follow-up', effectiveness: 4.8, prompt: 'Write a 5-email follow-up sequence for a prospect who {situation}. Space emails over 14 days. Each email should: add new value, reference previous email, and have a different CTA. Keep each under 75 words. Make the final email a breakup email.' },
  { title: 'LinkedIn DM Opener', category: 'Outreach', effectiveness: 4.5, prompt: 'Write 5 different LinkedIn DM openers for reaching out to {title}s in {industry}. Each should be under 30 words, feel natural (not salesy), and reference something specific they might relate to. Include a soft question, not a pitch.' },
  { title: 'Closing Technique Generator', category: 'Closing', effectiveness: 4.7, prompt: 'I am about to close a deal with {company}. The prospect is {situation}. Their main concern is {concern}. Generate 3 closing approaches: 1) Assumptive close, 2) Urgency-based close, 3) Value-summary close. Include exact phrases to use.' },
  { title: 'Competitive Battlecard', category: 'Objection Handling', effectiveness: 4.9, prompt: 'Create a competitive battlecard for my product ({product}) vs {competitor}. Include: 1) Their key weaknesses, 2) Our advantages, 3) Common switching objections and rebuttals, 4) Customer stories to reference, 5) Questions to ask that highlight our strengths.' },
  { title: 'Content Hook Generator', category: 'Prospecting', effectiveness: 4.4, prompt: 'Generate 10 LinkedIn post hooks for a {role} selling to {target_audience}. Each hook should be one line, create curiosity, and relate to {topic}. Use patterns like: contrarian take, surprising stat, story opener, question, or bold claim.' },
  { title: 'Reactivation Campaign', category: 'Follow-up', effectiveness: 4.6, prompt: 'Write a 3-email reactivation campaign for leads that went cold {timeframe} ago. Original interest was in {product/service}. Make each email short, add a new angle of value, and create urgency without being pushy. Include subject lines.' },
  { title: 'Industry Play Generator', category: 'Closing', effectiveness: 4.8, prompt: 'Generate a complete sales play for selling {product} to {industry}. Include: 1) Top 5 pain points in this industry, 2) Value proposition per pain point, 3) 3-email outreach sequence, 4) Discovery call script, 5) Demo talking points, 6) Common objections and rebuttals.' },
  { title: 'Account Expansion Mapper', category: 'Follow-up', effectiveness: 4.5, prompt: 'I have an existing customer {company} using our {current_product}. Map potential expansion opportunities: 1) Additional departments that could benefit, 2) Upsell triggers based on usage patterns, 3) Cross-sell opportunities, 4) Champion enablement talking points, 5) ROI justification for expansion.' },
];

const promptCategories = ['All', 'Prospecting', 'Outreach', 'Objection Handling', 'Closing', 'Follow-up'];
const diffColors = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

/* ================================================================
   TRENDING PLAYS — sorted by popularity (leads generated * success rate)
   ================================================================ */
const trendingPlays = [...plays].sort((a, b) => (b.leads * b.rate) - (a.leads * a.rate)).slice(0, 8).map((p, i) => ({
  ...p,
  rank: i + 1,
  trendIcon: i < 3 ? Flame : TrendingUp,
  trendColor: i < 3 ? '#f59e0b' : '#10b981',
}));

/* ================================================================
   AI PLAY SUGGESTIONS (industry-based)
   ================================================================ */
const industries = ['B2B SaaS', 'E-commerce', 'FinTech', 'HealthTech', 'Real Estate', 'Marketing Agency', 'EdTech', 'Cybersecurity', 'HR Tech', 'Legal Tech'];
const aiSuggestionPool = [
  { industry: 'B2B SaaS', title: 'Product-Led Growth Sequence', description: 'Target free trial users who hit activation milestones. Send personalized upgrade paths based on feature usage.', confidence: 94, leads: 2400, plays: ['Demo to Close', 'NPS to Upsell'] },
  { industry: 'B2B SaaS', title: 'G2 Review Mining', description: 'Scrape competitor reviews on G2. Target reviewers with personalized switching campaigns addressing their complaints.', confidence: 87, leads: 890, plays: ['Cold Email Sequence', 'Objection Crusher'] },
  { industry: 'E-commerce', title: 'Post-Purchase Referral Loop', description: 'Trigger referral requests immediately after positive delivery confirmation. Offer store credit for successful referrals.', confidence: 91, leads: 5600, plays: ['Referral Engine', 'Customer Advocacy'] },
  { industry: 'E-commerce', title: 'Browse Abandonment Recovery', description: 'Retarget users who viewed products 3+ times without purchasing. Show dynamic product ads with scarcity messaging.', confidence: 88, leads: 3200, plays: ['FOMO Close', 'AI Email Writer'] },
  { industry: 'FinTech', title: 'Compliance Change Outreach', description: 'Monitor regulatory changes and immediately reach out to affected companies offering compliance solutions.', confidence: 92, leads: 1100, plays: ['Cold Email Sequence', 'Video Prospecting'] },
  { industry: 'FinTech', title: 'CFO Direct Outreach', description: 'Target CFOs during quarterly close with ROI-focused messaging about cost reduction and efficiency gains.', confidence: 85, leads: 670, plays: ['Multi-Thread Deal', 'Proposal Accelerator'] },
  { industry: 'HealthTech', title: 'EMR Migration Pipeline', description: 'Identify healthcare orgs with legacy EMR systems. Target IT directors with migration ROI analysis and compliance benefits.', confidence: 89, leads: 450, plays: ['Video Prospecting', 'Demo to Close'] },
  { industry: 'HealthTech', title: 'Telehealth Expansion Play', description: 'Target practices expanding telehealth services. Lead with integration capabilities and patient satisfaction data.', confidence: 86, leads: 780, plays: ['Webinar Pipeline', 'Content Flywheel'] },
  { industry: 'Real Estate', title: 'New Listing Alert Nurture', description: 'Auto-send personalized property matches based on saved search criteria. Include market insights for each match.', confidence: 93, leads: 3400, plays: ['AI Email Writer', 'Auto-Enrichment Pipeline'] },
  { industry: 'Real Estate', title: 'Mortgage Rate Trigger', description: 'Monitor rate changes and instantly notify relevant prospects with updated qualification estimates and urgency messaging.', confidence: 90, leads: 2100, plays: ['Voice Drop Campaign', 'FOMO Close'] },
  { industry: 'Marketing Agency', title: 'Audit-First Outreach', description: 'Run automated website/ad audits for prospects. Send custom Loom walkthrough of findings with clear ROI projections.', confidence: 95, leads: 1200, plays: ['Video Prospecting', 'Cold Email Sequence'] },
  { industry: 'Marketing Agency', title: 'Client Results Showcase', description: 'Turn every client win into a micro case study. Use as social proof in cold outreach sequences.', confidence: 88, leads: 890, plays: ['Content Flywheel', 'LinkedIn DM Blitz'] },
  { industry: 'EdTech', title: 'Academic Calendar Targeting', description: 'Time outreach to budget cycles and enrollment periods. Target department heads 3 months before purchasing windows.', confidence: 87, leads: 560, plays: ['Multi-Touch Blitz', 'Webinar Pipeline'] },
  { industry: 'Cybersecurity', title: 'Breach Alert Pipeline', description: 'Monitor public breach disclosures. Reach out to similar companies in the same industry with prevention-focused messaging.', confidence: 91, leads: 340, plays: ['Cold Email Sequence', 'Video Prospecting'] },
  { industry: 'HR Tech', title: 'Hiring Surge Detector', description: 'Track companies with 10+ open positions. Target HR directors with efficiency and scaling messaging.', confidence: 89, leads: 920, plays: ['LinkedIn DM Blitz', 'Demo to Close'] },
  { industry: 'Legal Tech', title: 'Case Volume Analyzer', description: 'Identify law firms with growing caseloads through public court records. Pitch efficiency tools at the right moment.', confidence: 84, leads: 280, plays: ['Cold Email Sequence', 'Proposal Accelerator'] },
];

/* ================================================================
   COMPONENT
   ================================================================ */
// ── Execute Play Modal ──
function ExecutePlayModal({ play, onClose }) {
  const [step, setStep] = useState(0);
  const [executing, setExecuting] = useState(false);
  const [stepsCompleted, setStepsCompleted] = useState([]);
  const [aiOutput, setAiOutput] = useState({});
  const [targetCompany, setTargetCompany] = useState('');
  const [targetRole, setTargetRole] = useState('VP of Sales');
  const [industry, setIndustry] = useState('B2B SaaS');
  const [budget, setBudget] = useState(500);
  const [generating, setGenerating] = useState(null);

  if (!play) return null;

  const execSteps = [
    { id: 'config', label: 'Configure Target', icon: Target },
    { id: 'generate', label: 'AI Generation', icon: Sparkles },
    { id: 'review', label: 'Review & Edit', icon: Eye },
    { id: 'launch', label: 'Launch Play', icon: Rocket },
  ];

  const handleGenerate = async (type) => {
    setGenerating(type);
    const typeLabels = { email: 'cold email', linkedin: 'LinkedIn DM', script: 'phone call script', followup: 'follow-up email sequence' };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'play_execute',
          context: {
            playName: play.name,
            targetCompany: targetCompany || '[Target Company]',
            targetRole,
            industry,
            budget: `$${budget}`,
          },
          messages: [{ role: 'user', content: `Generate a ${typeLabels[type]} for the "${play.name}" play targeting a ${targetRole} at ${targetCompany || 'a company'} in ${industry}. Budget: $${budget}. Make it personalized, specific, and ready to send. No placeholders like [Company] — use the actual target info provided.` }],
        }),
      });
      const data = await res.json();
      if (!data.fallback && data.content) {
        setAiOutput(prev => ({ ...prev, [type]: data.content }));
        setGenerating(null);
        return;
      }
    } catch { /* fall through to template */ }

    // Fallback to local templates if API unavailable
    const templates = {
      email: `Subject: Quick question about ${targetCompany || '[Company]'}'s ${industry} strategy\n\nHi ${targetRole},\n\nI noticed ${targetCompany || 'your company'} has been expanding its ${industry} operations — congrats on the growth.\n\nWe helped a similar company increase their pipeline by 340% in 90 days using our ${play.name} framework. The approach is different from what most teams are doing.\n\nWould you be open to a 15-min call this week to see if it could work for ${targetCompany || 'your team'}?\n\nBest,\n[Your Name]`,
      linkedin: `Hey ${targetRole.split(' ').pop()},\n\nSaw your recent post about ${industry} challenges — really resonated with what we're seeing across the market.\n\nWe've been running a ${play.name} strategy that's generating 40-60% response rates for teams like yours. Just helped a similar company book 12 demos in a week.\n\nWould love to share the framework if you're interested. No pitch, just value.`,
      script: `OPENER: "Hi, this is [You] from [Company]. I know this is unexpected — got 30 seconds?"\n\nHOOK: "I'm reaching out because we helped a company in ${industry} solve their biggest pipeline challenge using our ${play.name} approach."\n\nDISCOVERY: "Quick question — how is ${targetCompany || 'your team'} currently handling outbound? What's working, what's not?"\n\nPITCH: "Based on what you shared, here's what we could do for ${targetCompany || 'your team'}..."\n\nCLOSE: "I'd love to walk you through exactly how this works. Does tomorrow at 2pm work for 15 min?"`,
      followup: `Subject: Re: ${targetCompany || '[Company]'} — quick follow-up\n\nHi ${targetRole},\n\nFollowing up on my note from last week. I know inboxes get wild.\n\n${targetCompany || 'Companies'} in ${industry} that implement ${play.name} strategies typically see:\n- 3-5x increase in qualified meetings\n- 40%+ reply rates (vs 2% industry average)\n- 60-day pipeline acceleration\n\nWorth 15 minutes to explore?\n\nBest,\n[Your Name]`,
    };
    setAiOutput(prev => ({ ...prev, [type]: templates[type] }));
    setGenerating(null);
  };

  const handleLaunch = () => {
    setExecuting(true);
    let i = 0;
    const interval = setInterval(() => {
      setStepsCompleted(prev => [...prev, i]);
      i++;
      if (i >= play.steps_detail.length) {
        clearInterval(interval);
        setTimeout(() => setExecuting(false), 500);
      }
    }, 800);
  };

  const copyText = (text) => { navigator.clipboard?.writeText(text); };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-4xl max-h-[90vh] bg-surface-2 rounded-2xl border border-white/[0.05] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${play.color}15`, color: play.color }}>
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Execute: {play.name}</h2>
              <p className="text-xs text-slate-500">{play.steps} steps · {play.time} · {play.rate}% success rate</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.02] text-slate-400"><X size={18} /></button>
        </div>

        {/* Step Navigation */}
        <div className="flex items-center gap-1 p-4 border-b border-white/[0.03] bg-surface-3/50">
          {execSteps.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => setStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  step === i ? 'bg-brand text-black' : step > i ? 'bg-brand/15 text-brand' : 'bg-white/[0.02] text-slate-500'
                }`}
              >
                {step > i ? <CheckCircle2 size={14} /> : <s.icon size={14} />}
                {s.label}
              </button>
              {i < execSteps.length - 1 && <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 0: Configure */}
          {step === 0 && (
            <div className="space-y-4 max-w-xl">
              <h3 className="font-bold text-lg mb-4">Configure Your Target</h3>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Target Company</label>
                <input value={targetCompany} onChange={e => setTargetCompany(e.target.value)} placeholder="e.g., Stripe, HubSpot, Acme Corp"
                  className="w-full px-4 py-3 rounded-xl bg-surface-3 border border-white/[0.03] text-sm focus:outline-none focus:border-brand/40" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Target Role</label>
                  <select value={targetRole} onChange={e => setTargetRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-3 border border-white/[0.03] text-sm focus:outline-none focus:border-brand/40">
                    {['VP of Sales', 'CRO', 'CEO', 'Head of Growth', 'CMO', 'Director of Sales', 'Founder', 'COO'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Industry</label>
                  <select value={industry} onChange={e => setIndustry(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-3 border border-white/[0.03] text-sm focus:outline-none focus:border-brand/40">
                    {['B2B SaaS', 'E-commerce', 'FinTech', 'HealthTech', 'Real Estate', 'Marketing Agency', 'EdTech', 'Cybersecurity'].map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Budget: ${budget}</label>
                <input type="range" min={0} max={5000} step={100} value={budget} onChange={e => setBudget(Number(e.target.value))}
                  className="w-full accent-brand" />
                <div className="flex justify-between text-xs text-slate-500 mt-1"><span>$0</span><span>$5,000</span></div>
              </div>
              {/* Predicted outcomes */}
              <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Brain size={14} className="text-purple-400" />Predicted Outcomes</h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Meetings', value: play.aiPlan.predicted.meetings, color: '#10b981' },
                    { label: 'Pipeline', value: play.aiPlan.predicted.pipeline, color: '#3b82f6' },
                    { label: 'Close Rate', value: play.aiPlan.predicted.closeRate, color: '#f59e0b' },
                  ].map(m => (
                    <div key={m.label} className="bg-surface-2 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-500 mb-1">{m.label}</div>
                      <div className="font-bold" style={{ color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setStep(1)} className="w-full py-3 rounded-xl bg-brand text-black font-bold text-sm flex items-center justify-center gap-2">
                Continue to AI Generation <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 1: AI Generation */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg mb-2">AI-Generated Content for {targetCompany || 'Target'}</h3>
              <p className="text-sm text-slate-400 mb-4">Click to generate personalized outreach content powered by AI.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[
                  { id: 'email', label: 'Cold Email', icon: Mail, desc: 'Personalized email sequence' },
                  { id: 'linkedin', label: 'LinkedIn DM', icon: Globe, desc: 'Connection message + follow-up' },
                  { id: 'script', label: 'Call Script', icon: Phone, desc: 'Discovery + pitch framework' },
                  { id: 'followup', label: 'Follow-Up', icon: RefreshCw, desc: 'Multi-touch follow-up sequence' },
                ].map(item => (
                  <div key={item.id} className="bg-surface-3 rounded-xl border border-white/[0.03] overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <item.icon size={16} className="text-brand" />
                          <span className="text-sm font-semibold">{item.label}</span>
                        </div>
                        <button onClick={() => handleGenerate(item.id)} disabled={generating === item.id}
                          className="px-3 py-1.5 rounded-lg bg-brand/15 text-brand text-xs font-medium hover:bg-brand/25 transition-colors disabled:opacity-50">
                          {generating === item.id ? <RefreshCw size={12} className="animate-spin" /> : aiOutput[item.id] ? 'Regenerate' : 'Generate'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{item.desc}</p>
                      {aiOutput[item.id] ? (
                        <div className="relative">
                          <pre className="bg-surface-2 rounded-lg p-3 text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">{aiOutput[item.id]}</pre>
                          <button onClick={() => copyText(aiOutput[item.id])}
                            className="absolute top-2 right-2 p-1.5 rounded-md bg-surface-3 text-slate-400 hover:text-white"><Copy size={12} /></button>
                        </div>
                      ) : (
                        <div className="bg-surface-2 rounded-lg p-6 text-center text-xs text-slate-600">
                          {generating === item.id ? 'Generating with AI...' : 'Click Generate to create content'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(0)} className="px-6 py-3 rounded-xl bg-white/[0.02] text-slate-300 font-medium text-sm">Back</button>
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl bg-brand text-black font-bold text-sm flex items-center justify-center gap-2">
                  Review Content <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg mb-2">Review Execution Plan</h3>
              <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
                <h4 className="text-sm font-semibold mb-3">Timeline: {play.time}</h4>
                <div className="space-y-2">
                  {play.aiPlan.timeline.map((t, j) => (
                    <div key={j} className="flex items-start gap-3 p-2 rounded-lg bg-surface-2">
                      <div className="w-6 h-6 rounded-full bg-brand/15 text-brand flex items-center justify-center text-xs font-bold flex-shrink-0">{j + 1}</div>
                      <span className="text-sm text-slate-300">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
                  <div className="text-xs text-slate-500 mb-1">Target</div>
                  <div className="font-bold">{targetCompany || 'All matching prospects'}</div>
                  <div className="text-xs text-slate-400 mt-1">{targetRole} · {industry}</div>
                </div>
                <div className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
                  <div className="text-xs text-slate-500 mb-1">Content Generated</div>
                  <div className="font-bold">{Object.keys(aiOutput).length} pieces</div>
                  <div className="text-xs text-slate-400 mt-1">{Object.keys(aiOutput).join(', ') || 'None yet'}</div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl bg-white/[0.02] text-slate-300 font-medium text-sm">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-brand text-black font-bold text-sm flex items-center justify-center gap-2">
                  Launch Play <Rocket size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Launch */}
          {step === 3 && (
            <div className="space-y-4">
              {!executing && stepsCompleted.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-brand/15 text-brand flex items-center justify-center mx-auto mb-4"><Rocket size={32} /></div>
                  <h3 className="font-bold text-xl mb-2">Ready to Launch</h3>
                  <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">This will activate the {play.name} play for {targetCompany || 'your targets'}. AI will execute each step automatically.</p>
                  <button onClick={handleLaunch} className="px-8 py-3.5 rounded-xl bg-brand text-black font-bold text-sm inline-flex items-center gap-2 hover:bg-brand/90 transition-colors">
                    <Zap size={16} />Launch Now
                  </button>
                </div>
              )}
              {(executing || stepsCompleted.length > 0) && (
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    {executing && <RefreshCw size={16} className="text-brand animate-spin" />}
                    {!executing && stepsCompleted.length >= play.steps_detail.length && <CheckCircle2 size={16} className="text-green-400" />}
                    {executing ? 'Executing...' : 'Play Complete!'}
                  </h3>
                  <div className="space-y-2">
                    {play.steps_detail.map((s, j) => {
                      const done = stepsCompleted.includes(j);
                      const active = executing && j === stepsCompleted.length;
                      return (
                        <motion.div key={j}
                          initial={{ opacity: 0.3 }} animate={{ opacity: done || active ? 1 : 0.3 }}
                          className={`flex items-start gap-3 p-3 rounded-xl border ${done ? 'bg-brand/5 border-brand/20' : active ? 'bg-surface-3 border-white/[0.05]' : 'bg-surface-3 border-white/[0.03]'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? 'bg-brand text-black' : active ? 'bg-white/[0.04] text-white' : 'bg-white/[0.02] text-slate-600'}`}>
                            {done ? <Check size={12} /> : j + 1}
                          </div>
                          <div className="flex-1">
                            <span className={`text-sm ${done ? 'text-white' : 'text-slate-500'}`}>{s}</span>
                            {active && <div className="mt-1 h-1 bg-surface-0 rounded-full overflow-hidden"><div className="h-full bg-brand rounded-full animate-pulse" style={{ width: '60%' }} /></div>}
                          </div>
                          {done && <span className="text-xs text-brand font-medium">Done</span>}
                        </motion.div>
                      );
                    })}
                  </div>
                  {!executing && stepsCompleted.length >= play.steps_detail.length && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-gradient-to-r from-brand/10 to-cyan-500/10 rounded-xl p-5 border border-brand/20">
                      <h4 className="font-bold text-brand mb-2">Play Activated Successfully!</h4>
                      <p className="text-sm text-slate-300 mb-3">The {play.name} play is now running. Expected results in {play.time}.</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Est. Meetings', value: play.aiPlan.predicted.meetings },
                          { label: 'Est. Pipeline', value: play.aiPlan.predicted.pipeline },
                          { label: 'Est. Close Rate', value: play.aiPlan.predicted.closeRate },
                        ].map(m => (
                          <div key={m.label} className="bg-black/20 rounded-lg p-3 text-center">
                            <div className="text-xs text-slate-500">{m.label}</div>
                            <div className="font-bold text-brand">{m.value}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PlaysPage() {
  const [expanded, setExpanded] = useState(null);
  const [activeAI, setActiveAI] = useState(null);
  const [tab, setTab] = useState('plays');
  const [copiedPrompt, setCopiedPrompt] = useState(null);
  const [promptFilter, setPromptFilter] = useState('All');
  const [showSubmitPrompt, setShowSubmitPrompt] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [playCategoryFilter, setPlayCategoryFilter] = useState('all');
  const [aiIndustry, setAiIndustry] = useState('B2B SaaS');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResults, setAiResults] = useState([]);
  const [executingPlay, setExecutingPlay] = useState(null);
  const [customPlayPrompt, setCustomPlayPrompt] = useState('');
  const [customPlayGenerating, setCustomPlayGenerating] = useState(false);
  const [customPlayResult, setCustomPlayResult] = useState('');
  const feedRef = useRef(null);

  // Filtered plays
  const filteredPlays = plays.filter(p => {
    const matchCat = playCategoryFilter === 'all' || p.category === playCategoryFilter;
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredPrompts = aiPrompts.filter(p => promptFilter === 'All' || p.category === promptFilter);

  const totalLeads = plays.reduce((s, p) => s + p.leads, 0);
  const avgRate = Math.round(plays.reduce((s, p) => s + p.rate, 0) / plays.length);
  const bestPlay = plays.reduce((best, p) => p.rate > best.rate ? p : best, plays[0]);
  const topROIPlays = [...plays].sort((a, b) => (b.rate * b.leads) - (a.rate * a.leads)).slice(0, 5);

  const handleCopyPrompt = (idx) => {
    const text = filteredPrompts[idx]?.prompt;
    if (text) navigator.clipboard?.writeText(text);
    setCopiedPrompt(idx);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const handleGenerateAI = () => {
    setAiGenerating(true);
    setAiResults([]);
    setTimeout(() => {
      const results = aiSuggestionPool.filter(s => s.industry === aiIndustry);
      setAiResults(results.length > 0 ? results : aiSuggestionPool.slice(0, 3));
      setAiGenerating(false);
    }, 2200);
  };

  // Generate custom play via AI
  const handleGenerateCustomPlay = async () => {
    if (!customPlayPrompt.trim()) return;
    setCustomPlayGenerating(true);
    setCustomPlayResult('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'play_generate',
          context: {},
          messages: [{ role: 'user', content: `Create a complete sales play for: ${customPlayPrompt}. My industry focus is ${aiIndustry}.` }],
        }),
      });
      const data = await res.json();
      if (!data.fallback && data.content) {
        setCustomPlayResult(data.content);
      } else {
        setCustomPlayResult(`# Custom Play: ${customPlayPrompt}\n\n**Category:** ${aiIndustry}\n\n## Steps\n1. Research your target market in ${aiIndustry}\n2. Build a prospect list of 200+ ICP-matched contacts\n3. Craft personalized messaging for ${customPlayPrompt}\n4. Execute multi-channel outreach (email + LinkedIn + phone)\n5. Follow up with engaged prospects within 24 hours\n6. Book discovery calls and qualify pipeline\n\n## Expected Results\n- 15-25 qualified meetings in 14 days\n- $200K-$500K in new pipeline\n- 25-35% close rate on qualified deals\n\n*Tip: Use the Execute Play modal on any existing play to generate AI-powered outreach content tailored to your targets.*`);
      }
    } catch {
      setCustomPlayResult('AI generation unavailable. Try again later or use one of the 27 built-in plays with the Execute button.');
    } finally {
      setCustomPlayGenerating(false);
    }
  };

  const tabs = [
    { id: 'plays', label: 'Playbooks', icon: Play },
    { id: 'create', label: 'Create Play', icon: Sparkles },
    { id: 'ai-plays', label: 'AI Suggestions', icon: Brain },
    { id: 'prompts', label: 'AI Prompts', icon: PenTool },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
            <Play size={22} className="text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Live Plays</h1>
            <p className="text-slate-500 text-sm">27 proven playbooks with real-time execution tracking and AI activation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20">
            <Sparkles size={12} className="text-brand" />
            <span className="text-xs font-medium text-brand">{plays.length} plays available</span>
          </div>
        </div>
      </div>

      {/* ═══ Analytics Dashboard ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total Plays', value: plays.length, icon: Layers, color: '#10b981' },
          { label: 'Avg Success Rate', value: `${avgRate}%`, icon: Trophy, color: '#f59e0b' },
          { label: 'Active Leads', value: totalLeads.toLocaleString(), icon: Users, color: '#a855f7' },
          { label: 'Categories', value: playCategories.length, icon: Calendar, color: '#3b82f6' },
          { label: 'AI-Powered', value: 'Yes', icon: BarChart3, color: '#ec4899' },
          { label: 'Best Close Rate', value: `${bestPlay.rate}%`, icon: Star, color: '#06b6d4' },
        ].map((s, i) => (
          <div key={i} className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><s.icon size={14} style={{ color: s.color }} />{s.label}</div>
            <div className="text-xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ═══ Top Performing Plays by ROI ═══ */}
      <div className="bg-surface-3 rounded-xl border border-white/[0.03] p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame size={18} className="text-orange-400" />
          <h3 className="font-bold text-sm">Top Performing Plays by ROI</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {topROIPlays.map((p, i) => (
            <div key={i} className="flex items-center gap-3 bg-surface-2 rounded-lg p-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: `${p.color}15`, color: p.color }}>#{i + 1}</div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-xs text-slate-500">{p.rate}% rate / {p.leads.toLocaleString()} leads</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Live Activity Feed + Content Layout ═══ */}
      <div className="flex gap-6 mb-6">
        {/* Left: Main tabs area */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-brand/15 text-brand border border-brand/30' : 'bg-surface-3 text-slate-400 border border-white/[0.03] hover:text-white'}`}>
                <t.icon size={16} />{t.label}
              </button>
            ))}
          </div>

          {/* Search bar (for plays and community tabs) */}
          {(tab === 'plays' || tab === 'community') && (
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder={tab === 'plays' ? 'Search 27 playbooks...' : 'Search community plays...'} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-3 border border-white/[0.03] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand/30" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={14} /></button>
              )}
            </div>
          )}

          {/* ═══════════════ PLAYS TAB ═══════════════ */}
          {tab === 'plays' && (
            <div>
              {/* Play Category Filters */}
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
                <button onClick={() => setPlayCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${playCategoryFilter === 'all' ? 'bg-brand/15 text-brand border border-brand/30' : 'bg-surface-3 text-slate-400 border border-white/[0.03] hover:text-white'}`}>
                  All ({plays.length})
                </button>
                {playCategories.map(cat => {
                  const count = plays.filter(p => p.category === cat.id).length;
                  return (
                    <button key={cat.id} onClick={() => setPlayCategoryFilter(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${playCategoryFilter === cat.id ? 'bg-brand/15 text-brand border border-brand/30' : 'bg-surface-3 text-slate-400 border border-white/[0.03] hover:text-white'}`}>
                      <cat.icon size={12} />{cat.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Conversion Rate by Category */}
              <div className="bg-surface-3 rounded-xl border border-white/[0.03] p-4 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={16} className="text-blue-400" />
                  <span className="text-sm font-semibold">Conversion Rate by Category</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {playCategories.map(cat => {
                    const catPlays = plays.filter(p => p.category === cat.id);
                    const catAvg = catPlays.length ? Math.round(catPlays.reduce((s, p) => s + p.rate, 0) / catPlays.length) : 0;
                    return (
                      <div key={cat.id} className="text-center">
                        <div className="text-xs text-slate-500 mb-1">{cat.label}</div>
                        <div className="h-16 flex items-end justify-center">
                          <div className="w-8 rounded-t" style={{ height: `${catAvg}%`, background: cat.color, opacity: 0.7 }} />
                        </div>
                        <div className="text-sm font-bold mt-1" style={{ color: cat.color }}>{catAvg}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Plays Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredPlays.map((p, i) => {
                  const globalIdx = plays.indexOf(p);
                  return (
                    <motion.div key={globalIdx}
                      className="bg-surface-3 rounded-xl border border-white/[0.03] overflow-hidden card-hover"
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm" style={{ background: `${p.color}15`, color: p.color }}>
                              #{globalIdx + 1}
                            </div>
                            <div>
                              <h3 className="font-bold">{p.name}</h3>
                              <div className="flex gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: `${diffColors[p.difficulty]}15`, color: diffColors[p.difficulty] }}>{p.difficulty}</span>
                                <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={11} />{p.time}</span>
                                <span className="text-xs text-slate-500 flex items-center gap-1"><Target size={11} />{p.steps} steps</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">{p.description}</p>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-surface-2 rounded-lg p-2.5">
                            <div className="text-xs text-slate-500 mb-1">Success Rate</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-surface-0 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${p.rate}%`, background: p.color }} />
                              </div>
                              <span className="font-bold text-sm" style={{ color: p.color }}>{p.rate}%</span>
                            </div>
                          </div>
                          <div className="bg-surface-2 rounded-lg p-2.5">
                            <div className="text-xs text-slate-500 mb-1">Active Leads</div>
                            <div className="font-bold text-sm">{p.leads.toLocaleString()}</div>
                          </div>
                        </div>

                        <button onClick={() => setExpanded(expanded === globalIdx ? null : globalIdx)}
                          className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-slate-200 transition-colors mb-3">
                          <span>View steps</span>
                          {expanded === globalIdx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        <AnimatePresence>
                          {expanded === globalIdx && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              className="space-y-2 mb-3 border-t border-white/[0.03] pt-3">
                              {p.steps_detail.map((step, j) => (
                                <div key={j} className="flex items-start gap-2.5 text-sm">
                                  <div className="w-5 h-5 rounded-full bg-surface-2 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 mt-0.5">{j + 1}</div>
                                  <span className="text-slate-300">{step}</span>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex gap-2">
                          <button onClick={() => setExecutingPlay(p)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-colors hover:opacity-80" style={{ background: `${p.color}15`, color: p.color }}>
                            <Zap size={14} />Execute Play
                          </button>
                          <button onClick={() => setActiveAI(activeAI === globalIdx ? null : globalIdx)}
                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${activeAI === globalIdx ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/[0.02] text-slate-300 hover:bg-white/[0.04]'}`}>
                            <Sparkles size={14} />AI
                          </button>
                        </div>

                        <AnimatePresence>
                          {activeAI === globalIdx && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              className="mt-4 border-t border-purple-500/20 pt-4">
                              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                  <Brain size={18} className="text-purple-400" />
                                  <h4 className="font-bold text-sm text-purple-300">AI Execution Plan</h4>
                                </div>
                                <div className="mb-3">
                                  <h5 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5"><Calendar size={12} />Timeline</h5>
                                  <div className="space-y-1">
                                    {p.aiPlan.timeline.map((t, j) => (
                                      <div key={j} className="flex items-start gap-2 text-xs">
                                        <CheckCircle2 size={12} className="text-purple-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-slate-300">{t}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <h5 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5"><Mail size={12} />Templates</h5>
                                  {p.aiPlan.templates.map((t, j) => (
                                    <div key={j} className="bg-black/20 rounded-lg p-2.5 mb-1.5 text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">{t}</div>
                                  ))}
                                </div>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                  {[
                                    { label: 'Meetings', value: p.aiPlan.predicted.meetings },
                                    { label: 'Pipeline', value: p.aiPlan.predicted.pipeline },
                                    { label: 'Close Rate', value: p.aiPlan.predicted.closeRate },
                                  ].map((m, j) => (
                                    <div key={j} className="bg-black/20 rounded-lg p-2.5 text-center">
                                      <div className="text-xs text-slate-500">{m.label}</div>
                                      <div className="font-bold text-sm text-purple-400">{m.value}</div>
                                    </div>
                                  ))}
                                </div>
                                <button onClick={() => setExecutingPlay(p)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-sm border border-purple-500/30 hover:bg-purple-500/30 transition-colors">
                                  <Zap size={14} />Execute Now
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════════ CREATE PLAY TAB ═══════════════ */}
          {tab === 'create' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="font-bold text-lg mb-1">Create a Custom Play</h2>
                <p className="text-sm text-slate-400">Describe your niche, target audience, or sales challenge and AI will generate a complete playbook.</p>
              </div>

              <div className="bg-surface-3 rounded-xl p-6 border border-white/[0.03]">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Your Industry</label>
                    <select value={aiIndustry} onChange={e => setAiIndustry(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-white/[0.03] text-sm text-white focus:outline-none focus:border-brand/40">
                      {['B2B SaaS', 'E-commerce', 'FinTech', 'HealthTech', 'Real Estate', 'Marketing Agency', 'EdTech', 'Cybersecurity', 'HR Tech', 'Legal Tech', 'Creator Economy', 'Local Business'].map(i => <option key={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Describe Your Play</label>
                    <textarea value={customPlayPrompt} onChange={e => setCustomPlayPrompt(e.target.value)}
                      placeholder="e.g., 'I sell marketing automation to e-commerce brands doing $1M-$10M revenue. I want a play that gets me 10 demos per week using LinkedIn and email.'"
                      rows={4} className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-white/[0.03] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand/40 resize-none" />
                  </div>
                  <button onClick={handleGenerateCustomPlay} disabled={customPlayGenerating || !customPlayPrompt.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand text-black font-bold text-sm disabled:opacity-50">
                    {customPlayGenerating ? <><RefreshCw size={14} className="animate-spin" />Generating Play...</> : <><Sparkles size={14} />Generate Custom Play</>}
                  </button>
                </div>
              </div>

              {customPlayResult && (
                <div className="bg-surface-3 rounded-xl p-6 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-purple-400" />
                      <h3 className="font-bold">Your Custom Play</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">AI Generated</span>
                    </div>
                    <button onClick={() => navigator.clipboard?.writeText(customPlayResult)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.02] text-slate-400 hover:text-white text-xs"><Copy size={12} />Copy</button>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {customPlayResult.split('\n').map((line, i) => {
                      if (line.startsWith('# ')) return <h2 key={i} className="text-lg font-bold text-white mt-4 mb-2">{line.slice(2)}</h2>;
                      if (line.startsWith('## ')) return <h3 key={i} className="text-base font-bold text-white mt-3 mb-1">{line.slice(3)}</h3>;
                      if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} className="flex gap-2 pl-2"><span className="text-brand">•</span><span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>') }} /></div>;
                      if (!line.trim()) return <div key={i} className="h-2" />;
                      return <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>') }} />;
                    })}
                  </div>
                </div>
              )}

              {/* Quick suggestions */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3">Try these prompts:</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    'LinkedIn-only outreach for SaaS startups',
                    'Win back churned e-commerce customers',
                    'Book 20 demos/week for cybersecurity product',
                    'Local business lead gen using Google Maps',
                    'Referral program for B2B services',
                  ].map(s => (
                    <button key={s} onClick={() => setCustomPlayPrompt(s)}
                      className="px-3 py-1.5 rounded-full bg-surface-3 border border-white/[0.03] text-xs text-slate-400 hover:text-brand hover:border-brand/20 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ AI PLAYS TAB ═══════════════ */}
          {tab === 'ai-plays' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={20} className="text-purple-400" />
                  <h2 className="font-bold text-lg">AI Play Generator</h2>
                </div>
                <p className="text-sm text-slate-400 mb-5">Generate custom playbooks tailored to your industry and target audience using AI analysis of thousands of successful plays.</p>

                <div className="flex gap-3 items-end">
                  <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Select Industry</label>
                    <select value={aiIndustry} onChange={e => setAiIndustry(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-surface-2 border border-white/[0.03] text-sm text-white focus:outline-none focus:border-purple-500/30">
                      {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                  </div>
                  <button onClick={handleGenerateAI} disabled={aiGenerating}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-sm border border-purple-500/30 hover:bg-purple-500/30 transition-colors disabled:opacity-50">
                    {aiGenerating ? <><RefreshCw size={16} className="animate-spin" />Generating...</> : <><Sparkles size={16} />Generate Plays for {aiIndustry}</>}
                  </button>
                </div>
              </div>

              {aiGenerating && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw size={32} className="text-purple-400 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Analyzing {aiIndustry} market data and generating optimal plays...</p>
                  </div>
                </div>
              )}

              {aiResults.length > 0 && !aiGenerating && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={18} className="text-purple-400" />
                    <h3 className="font-bold">AI-Generated Plays for {aiIndustry}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/15 text-purple-400">{aiResults.length} plays</span>
                  </div>
                  {aiResults.map((result, i) => (
                    <motion.div key={i} className="bg-surface-3 rounded-xl p-5 border border-purple-500/10 card-hover"
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold">{result.title}</h4>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/15 text-green-400">{result.confidence}% confidence</span>
                          </div>
                          <p className="text-sm text-slate-400">{result.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="text-xs text-slate-500 flex items-center gap-1"><Users size={12} />{result.leads.toLocaleString()} potential leads</div>
                        <div className="text-xs text-slate-500">Combines: {result.plays.join(' + ')}</div>
                      </div>
                      <button onClick={() => setExecutingPlay(plays[0])} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/15 text-purple-400 font-medium text-sm hover:bg-purple-500/25 transition-colors">
                        <Zap size={14} />Activate This Play
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* AI Prompt Templates */}
              <div>
                <h3 className="font-bold mb-4 flex items-center gap-2"><Lightbulb size={18} className="text-yellow-400" />AI Prompt Templates</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {[
                    { label: 'Generate cold outreach for...', placeholder: 'e.g., SaaS companies with 50-200 employees using HubSpot', icon: Mail },
                    { label: 'Build retention play for...', placeholder: 'e.g., e-commerce brands with 30%+ churn rate', icon: Heart },
                    { label: 'Create closing sequence for...', placeholder: 'e.g., enterprise deals with 3+ stakeholders', icon: Trophy },
                    { label: 'Design referral program for...', placeholder: 'e.g., B2B agencies with NPS > 8', icon: Share2 },
                  ].map((tmpl, i) => (
                    <div key={i} className="bg-surface-3 rounded-xl p-4 border border-white/[0.03]">
                      <div className="flex items-center gap-2 mb-2">
                        <tmpl.icon size={16} className="text-purple-400" />
                        <span className="text-sm font-medium">{tmpl.label}</span>
                      </div>
                      <div className="flex gap-2">
                        <input type="text" placeholder={tmpl.placeholder}
                          className="flex-1 px-3 py-2 rounded-lg bg-surface-2 border border-white/[0.03] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/30" />
                        <button className="px-3 py-2 rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 transition-colors">
                          <Sparkles size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ AI PROMPTS TAB ═══════════════ */}
          {tab === 'prompts' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg">AI Sales Prompts</h2>
                  <p className="text-sm text-slate-400">Curated prompts for every stage of the sales process</p>
                </div>
                <button onClick={() => setShowSubmitPrompt(!showSubmitPrompt)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-black font-medium text-sm">
                  <Lightbulb size={14} />Submit Prompt
                </button>
              </div>

              <AnimatePresence>
                {showSubmitPrompt && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="bg-surface-3 rounded-xl p-6 border border-brand/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">Submit a New Prompt</h3>
                      <button onClick={() => setShowSubmitPrompt(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
                    </div>
                    <div className="space-y-4 max-w-lg">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Prompt Title</label>
                        <input type="text" placeholder="e.g., Cold Email Personalization"
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-2 border border-white/[0.03] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand/30" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                        <select className="w-full px-4 py-2.5 rounded-lg bg-surface-2 border border-white/[0.03] text-sm text-white focus:outline-none focus:border-brand/30">
                          {promptCategories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Prompt Text</label>
                        <textarea placeholder="Write your prompt with {variable} placeholders..." rows={4}
                          className="w-full px-4 py-2.5 rounded-lg bg-surface-2 border border-white/[0.03] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand/30 resize-none" />
                      </div>
                      <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand text-black font-medium text-sm">
                        <Send size={14} />Submit Prompt
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {promptCategories.map(cat => (
                  <button key={cat} onClick={() => setPromptFilter(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${promptFilter === cat ? 'bg-brand/15 text-brand border border-brand/30' : 'bg-surface-3 text-slate-400 border border-white/[0.03] hover:text-white'}`}>
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredPrompts.map((pr, i) => (
                  <motion.div key={pr.title} className="bg-surface-3 rounded-xl p-5 border border-white/[0.03] card-hover"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-base mb-1">{pr.title}</h3>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/15 text-purple-400">{pr.category}</span>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400 text-sm">
                        <Star size={14} fill="currentColor" />{pr.effectiveness}
                      </div>
                    </div>
                    <div className="bg-surface-2 rounded-lg p-3 mb-4 text-xs text-slate-300 font-mono leading-relaxed max-h-32 overflow-y-auto">
                      {pr.prompt}
                    </div>
                    <button onClick={() => handleCopyPrompt(i)}
                      className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${copiedPrompt === i ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-white/[0.02] text-slate-300 hover:bg-white/[0.04]'}`}>
                      {copiedPrompt === i ? <><Check size={14} />Copied!</> : <><Copy size={14} />Copy Prompt</>}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══ Right Sidebar: Live Activity Feed ═══ */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-6">
            <div className="bg-surface-3 rounded-xl border border-white/[0.03] overflow-hidden">
              <div className="p-4 border-b border-white/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-green-400" />
                    <h3 className="font-bold text-sm">Live Activity</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-green-400">Live</span>
                  </div>
                </div>
              </div>
              <div ref={feedRef} className="max-h-[600px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {activityFeed.map((item) => (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, x: 20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-b border-white/[0.03] last:border-0">
                      <div className="p-3 flex gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${item.color}15`, color: item.color }}>
                          {item.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-300 leading-relaxed">{item.text}</p>
                          <span className="text-xs text-slate-600 mt-0.5 block">{item.timestamp}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Execute Play Modal */}
      <AnimatePresence>
        {executingPlay && <ExecutePlayModal play={executingPlay} onClose={() => setExecutingPlay(null)} />}
      </AnimatePresence>
    </div>
  );
}
