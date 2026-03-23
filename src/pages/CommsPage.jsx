import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Phone, PhoneCall, PhoneOff, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Video, VideoOff, Mic, MicOff, Mail, Send, Search, Plus, Hash, Users, User,
  AtSign, Paperclip, Smile, MoreHorizontal, Star, Pin, Bell, BellOff,
  ChevronDown, ChevronRight, ChevronLeft, Settings, Volume2, VolumeX, Headphones,
  Circle, CheckCircle2, Clock, Calendar, MapPin, Building2, Briefcase, Globe,
  TrendingUp, Zap, Bot, Sparkles, ArrowRight, ArrowLeft, X, Maximize2, Minimize2,
  Image, FileText, Link2, ThumbsUp, Heart, Laugh, Reply, Forward, Trash2, Edit3,
  Shield, Crown, UserPlus, Filter, SortAsc, Archive, Inbox, AlertCircle,
  Copy, ExternalLink, Tag, Target, Activity, BarChart3, Eye, EyeOff,
  Wifi, WifiOff, Radio, Voicemail, Download, Upload, RefreshCw, ToggleLeft, ToggleRight,
  MessageCircle, Linkedin, Chrome, Smartphone, Monitor, Lock, Unlock,
  Play, Pause, SkipForward, BookOpen, Lightbulb, GraduationCap, ClipboardList,
  UserCheck, UserX, Share2, Repeat, Award, PenTool, Layout
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------
const CONTACTS = [
  { id: 1, name: 'Sarah Chen', avatar: 'SC', company: 'TechVault Inc.', role: 'VP of Sales', email: 'sarah.chen@techvault.io', phone: '+1 (415) 555-0142', leadScore: 92, dealStage: 'Negotiation', dealValue: 185000, status: 'online', location: 'San Francisco, CA' },
  { id: 2, name: 'Marcus Williams', avatar: 'MW', company: 'DataForge', role: 'CTO', email: 'marcus@dataforge.com', phone: '+1 (212) 555-0198', leadScore: 87, dealStage: 'Proposal Sent', dealValue: 320000, status: 'online', location: 'New York, NY' },
  { id: 3, name: 'Elena Rodriguez', avatar: 'ER', company: 'CloudNine Systems', role: 'Head of Growth', email: 'elena.r@cloudnine.io', phone: '+1 (310) 555-0176', leadScore: 78, dealStage: 'Discovery', dealValue: 95000, status: 'away', location: 'Los Angeles, CA' },
  { id: 4, name: 'James Park', avatar: 'JP', company: 'NexGen AI', role: 'CEO', email: 'jpark@nexgenai.com', phone: '+1 (650) 555-0134', leadScore: 95, dealStage: 'Closed Won', dealValue: 450000, status: 'offline', location: 'Palo Alto, CA' },
  { id: 5, name: 'Priya Sharma', avatar: 'PS', company: 'ScaleUp Labs', role: 'Director of Ops', email: 'priya@scaleuplabs.io', phone: '+1 (512) 555-0167', leadScore: 64, dealStage: 'Qualification', dealValue: 72000, status: 'online', location: 'Austin, TX' },
  { id: 6, name: 'David Kim', avatar: 'DK', company: 'Quantum Dynamics', role: 'VP Engineering', email: 'd.kim@quantumd.com', phone: '+1 (206) 555-0189', leadScore: 81, dealStage: 'Demo Scheduled', dealValue: 210000, status: 'dnd', location: 'Seattle, WA' },
  { id: 7, name: 'Lisa Thompson', avatar: 'LT', company: 'BrightPath Analytics', role: 'CMO', email: 'lisa.t@brightpath.co', phone: '+1 (303) 555-0145', leadScore: 73, dealStage: 'Proposal Sent', dealValue: 156000, status: 'online', location: 'Denver, CO' },
  { id: 8, name: 'Ahmed Hassan', avatar: 'AH', company: 'Pinnacle Software', role: 'Product Lead', email: 'ahmed@pinnaclesoft.io', phone: '+1 (617) 555-0123', leadScore: 88, dealStage: 'Negotiation', dealValue: 275000, status: 'away', location: 'Boston, MA' },
  { id: 9, name: 'Rachel Foster', avatar: 'RF', company: 'Velocity Partners', role: 'Managing Director', email: 'rfoster@velocityp.com', phone: '+1 (312) 555-0156', leadScore: 91, dealStage: 'Closed Won', dealValue: 520000, status: 'online', location: 'Chicago, IL' },
  { id: 10, name: 'Tom Bradley', avatar: 'TB', company: 'SynergyOps', role: 'Head of Sales', email: 'tom.b@synergyops.io', phone: '+1 (404) 555-0178', leadScore: 56, dealStage: 'Cold Outreach', dealValue: 45000, status: 'offline', location: 'Atlanta, GA' },
];

const CHANNELS = [
  { id: 'general', name: 'general', icon: Hash, unread: 3, members: 24, description: 'Company-wide announcements and chat' },
  { id: 'sales', name: 'sales', icon: Hash, unread: 12, members: 8, description: 'Sales team coordination and wins' },
  { id: 'marketing', name: 'marketing', icon: Hash, unread: 5, members: 6, description: 'Marketing campaigns and assets' },
  { id: 'deals', name: 'deals', icon: Hash, unread: 0, members: 10, description: 'Active deal discussions and updates' },
  { id: 'product', name: 'product', icon: Hash, unread: 7, members: 12, description: 'Product feedback and feature requests' },
  { id: 'watercooler', name: 'watercooler', icon: Hash, unread: 0, members: 24, description: 'Off-topic conversations and fun' },
];

const VOICE_CHANNELS = [
  { id: 'vc-standup', name: 'Daily Standup', members: [CONTACTS[0], CONTACTS[1], CONTACTS[4]] },
  { id: 'vc-war-room', name: 'War Room', members: [] },
  { id: 'vc-chill', name: 'Chill Lounge', members: [CONTACTS[6]] },
];

const generateTimestamp = (minutesAgo) => {
  const d = new Date(Date.now() - minutesAgo * 60000);
  return d;
};

const formatTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

const formatClockTime = (date) => {
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const INBOX_CONVERSATIONS = [
  { id: 'conv-1', contact: CONTACTS[0], channel: 'sms', lastMessage: 'Just reviewed the proposal. The pricing looks great - can we schedule a call tomorrow to finalize?', time: generateTimestamp(3), unread: 2, starred: true },
  { id: 'conv-2', contact: CONTACTS[1], channel: 'email', lastMessage: 'Re: Q4 Integration Roadmap - Attached the updated technical specs. Let me know your thoughts on the API approach.', time: generateTimestamp(15), unread: 1, starred: false },
  { id: 'conv-3', contact: CONTACTS[2], channel: 'linkedin', lastMessage: 'Thanks for connecting! I saw your post about AI-driven sales. Would love to chat about how we could work together.', time: generateTimestamp(42), unread: 0, starred: false },
  { id: 'conv-4', contact: CONTACTS[3], channel: 'voip', lastMessage: 'Call completed - 23 min. Discussed partnership terms and next steps for pilot program.', time: generateTimestamp(120), unread: 0, starred: true },
  { id: 'conv-5', contact: CONTACTS[4], channel: 'sms', lastMessage: 'Hey! Our team loved the demo yesterday. Sending over the procurement form today.', time: generateTimestamp(180), unread: 3, starred: false },
  { id: 'conv-6', contact: CONTACTS[5], channel: 'email', lastMessage: 'Re: Security Compliance - We need SOC2 documentation before proceeding. Can you expedite?', time: generateTimestamp(240), unread: 0, starred: false },
  { id: 'conv-7', contact: CONTACTS[6], channel: 'community', lastMessage: 'Posted a question in #marketing about the new campaign analytics dashboard.', time: generateTimestamp(300), unread: 1, starred: false },
  { id: 'conv-8', contact: CONTACTS[7], channel: 'sms', lastMessage: 'Contract looks good. Legal is reviewing - should have sign-off by EOW.', time: generateTimestamp(360), unread: 0, starred: true },
  { id: 'conv-9', contact: CONTACTS[8], channel: 'voip', lastMessage: 'Missed call (2 attempts). Left voicemail about renewal pricing.', time: generateTimestamp(480), unread: 1, starred: false },
  { id: 'conv-10', contact: CONTACTS[9], channel: 'linkedin', lastMessage: 'Saw you at SaaStr Annual! Let\'s reconnect - interested in your enterprise plan.', time: generateTimestamp(720), unread: 0, starred: false },
];

const CHAT_MESSAGES = [
  { id: 'm1', sender: CONTACTS[0], text: 'Hey team, just onboarded TechVault for the pilot program!', time: generateTimestamp(120), reactions: [{ emoji: '\u{1F389}', count: 5 }, { emoji: '\u{1F525}', count: 3 }], thread: 2 },
  { id: 'm2', sender: CONTACTS[1], text: 'Amazing work Sarah! What was the key differentiator?', time: generateTimestamp(115), reactions: [], thread: null },
  { id: 'm3', sender: CONTACTS[0], text: 'The AI lead scoring was a game changer. They loved how it predicted churn risk.', time: generateTimestamp(110), reactions: [{ emoji: '\u{1F44F}', count: 2 }], thread: null },
  { id: 'm4', sender: CONTACTS[4], text: 'Speaking of AI features, has anyone tested the new auto-follow-up sequences?', time: generateTimestamp(90), reactions: [], thread: 4 },
  { id: 'm5', sender: CONTACTS[6], text: 'Yes! Set one up for our Q1 campaign. Open rates are up 34% compared to manual outreach.', time: generateTimestamp(85), reactions: [{ emoji: '\u{1F4C8}', count: 1 }], thread: null },
  { id: 'm6', sender: CONTACTS[7], text: 'Can we get a walkthrough of the new dialer integration? My team needs to set up call recording.', time: generateTimestamp(60), reactions: [], thread: 3 },
  { id: 'm7', sender: CONTACTS[1], text: '@Ahmed sure thing - I\'ll set up a 15 min session. The transcription quality is excellent.', time: generateTimestamp(55), reactions: [{ emoji: '\u{1F44D}', count: 1 }], thread: null },
  { id: 'm8', sender: CONTACTS[8], text: 'Quick update: Velocity Partners confirmed interest in the beta program!', time: generateTimestamp(30), reactions: [{ emoji: '\u{1F389}', count: 8 }, { emoji: '\u{1F4B0}', count: 4 }, { emoji: '\u{1F680}', count: 6 }], thread: null },
  { id: 'm9', sender: CONTACTS[2], text: 'Congrats Rachel! We should feature this in the next all-hands.', time: generateTimestamp(25), reactions: [], thread: null },
  { id: 'm10', sender: CONTACTS[5], text: 'Don\'t forget team standup in 10 minutes. Agenda: pipeline review, new feature demo, Q1 targets.', time: generateTimestamp(10), reactions: [{ emoji: '\u{2705}', count: 6 }], thread: null },
  { id: 'm11', sender: CONTACTS[0], text: 'Also, I shared a new case study template in #marketing. Check it out!', time: generateTimestamp(5), reactions: [], thread: null },
  { id: 'm12', sender: CONTACTS[4], text: 'Has anyone had issues with the LinkedIn integration sync? Mine seems delayed by about 15 mins.', time: generateTimestamp(2), reactions: [], thread: 1 },
];

const RECENT_CALLS = [
  { id: 'call-1', contact: CONTACTS[0], type: 'outgoing', duration: '23:45', time: generateTimestamp(120), recorded: true, transcribed: true },
  { id: 'call-2', contact: CONTACTS[3], type: 'incoming', duration: '12:30', time: generateTimestamp(300), recorded: true, transcribed: true },
  { id: 'call-3', contact: CONTACTS[8], type: 'missed', duration: null, time: generateTimestamp(480), recorded: false, transcribed: false },
  { id: 'call-4', contact: CONTACTS[5], type: 'outgoing', duration: '45:12', time: generateTimestamp(600), recorded: true, transcribed: false },
  { id: 'call-5', contact: CONTACTS[1], type: 'incoming', duration: '8:55', time: generateTimestamp(900), recorded: false, transcribed: false },
  { id: 'call-6', contact: CONTACTS[7], type: 'outgoing', duration: '31:20', time: generateTimestamp(1200), recorded: true, transcribed: true },
];

const VOICEMAILS = [
  { id: 'vm-1', contact: CONTACTS[8], duration: '1:42', time: generateTimestamp(480), transcript: 'Hey, this is Rachel. Wanted to discuss renewal pricing for next quarter. Call me back when you get a chance. Thanks!', isNew: true },
  { id: 'vm-2', contact: CONTACTS[3], duration: '0:58', time: generateTimestamp(1440), transcript: 'James here from NexGen. Quick question about the API limits on the enterprise plan. No rush, just ping me.', isNew: true },
  { id: 'vm-3', contact: CONTACTS[9], duration: '2:15', time: generateTimestamp(2880), transcript: 'Tom Bradley, SynergyOps. Following up on our conversation last week. Interested in setting up a pilot program. Let me know available times.', isNew: false },
  { id: 'vm-4', contact: CONTACTS[5], duration: '0:33', time: generateTimestamp(4320), transcript: 'David Kim. SOC2 docs received, thanks. Legal has a couple of questions. Will email details.', isNew: false },
];

const PINNED_MESSAGES = [
  { id: 'pin-1', sender: CONTACTS[8], text: 'Pre-revenue phase. Focus on product, onboarding, and first 100 users. LFG!', time: generateTimestamp(2880) },
  { id: 'pin-2', sender: CONTACTS[1], text: 'New feature release: AI Call Transcription is live. Enable in Settings > Integrations.', time: generateTimestamp(4320) },
];

const COMMUNITY_MEMBERS = [
  { ...CONTACTS[0], role: 'admin', badge: Crown },
  { ...CONTACTS[1], role: 'moderator', badge: Shield },
  { ...CONTACTS[2], role: 'member', badge: null },
  { ...CONTACTS[3], role: 'admin', badge: Crown },
  { ...CONTACTS[4], role: 'member', badge: null },
  { ...CONTACTS[5], role: 'member', badge: null },
  { ...CONTACTS[6], role: 'moderator', badge: Shield },
  { ...CONTACTS[7], role: 'member', badge: null },
  { ...CONTACTS[8], role: 'admin', badge: Crown },
  { ...CONTACTS[9], role: 'member', badge: null },
];

const ACTIVITY_TIMELINE = [
  { id: 'act-1', type: 'email', text: 'Opened proposal email', time: generateTimestamp(15) },
  { id: 'act-2', type: 'call', text: 'Discovery call - 23 min', time: generateTimestamp(120) },
  { id: 'act-3', type: 'meeting', text: 'Product demo scheduled', time: generateTimestamp(1440) },
  { id: 'act-4', type: 'note', text: 'Added internal note about budget concerns', time: generateTimestamp(2880) },
  { id: 'act-5', type: 'deal', text: 'Deal stage moved to Negotiation', time: generateTimestamp(4320) },
  { id: 'act-6', type: 'linkedin', text: 'Connected on LinkedIn', time: generateTimestamp(10080) },
];

// ---------------------------------------------------------------------------
// Outreach Coach Data
// ---------------------------------------------------------------------------
const DEAL_STAGE_TALKING_POINTS = {
  'Cold Outreach': {
    prep: [
      'Research their company news and recent funding rounds',
      'Find mutual connections on LinkedIn for warm intro',
      'Prepare a compelling 30-second elevator pitch',
      'Have 2-3 relevant case studies ready from similar companies',
    ],
    tips: [
      'Lead with value, not features - what problem do you solve for them?',
      'Ask open-ended discovery questions to understand their pain points',
      'Mention a specific trigger event that prompted your outreach',
      'Keep the first call under 10 minutes - respect their time',
    ],
    objections: [
      { objection: '"We\'re not interested right now"', response: 'I completely understand. Many of our best clients felt the same initially. Could I share a quick case study showing how [similar company] saw 3x ROI in 90 days?' },
      { objection: '"We already have a solution"', response: 'That\'s great to hear. Out of curiosity, how is it handling [specific pain point]? We\'ve helped companies like yours fill gaps in that area.' },
      { objection: '"Send me an email"', response: 'Absolutely, I\'ll send that over. To make sure I include the most relevant info - what\'s your biggest priority this quarter?' },
    ],
  },
  'Qualification': {
    prep: [
      'Review BANT criteria - Budget, Authority, Need, Timeline',
      'Prepare discovery questions about their current workflow',
      'Research their tech stack and potential integration points',
      'Identify the decision-making process and stakeholders',
    ],
    tips: [
      'Focus on understanding their buying process',
      'Quantify their pain - how much is the problem costing them?',
      'Identify all stakeholders involved in the decision',
      'Set clear next steps before ending the call',
    ],
    objections: [
      { objection: '"The budget is too tight"', response: 'I hear you. Let me show you how we can phase the implementation - many clients start small and expand. What budget range are you working with?' },
      { objection: '"I need to talk to my team"', response: 'Of course! Would it help if I put together a brief executive summary your team can review? I can also join a follow-up call to answer their questions directly.' },
      { objection: '"What makes you different?"', response: 'Great question. Three things set us apart: [unique value prop 1], [unique value prop 2], and our clients see an average of [specific metric] improvement.' },
    ],
  },
  'Discovery': {
    prep: [
      'Deep-dive into their business model and revenue streams',
      'Map out their organizational structure and key players',
      'Prepare a tailored demo flow addressing their specific needs',
      'Have ROI calculator ready with industry benchmarks',
    ],
    tips: [
      'Listen more than you talk - aim for 70/30 ratio',
      'Take detailed notes for your CRM and follow-up',
      'Ask about their evaluation criteria and timeline',
      'Uncover the "why now" behind their interest',
    ],
    objections: [
      { objection: '"We\'re just exploring options"', response: 'That makes sense. To help you evaluate effectively, what would a successful solution look like for your team? Let me show you how we align.' },
      { objection: '"This seems complex to implement"', response: 'I understand the concern. Our average implementation takes just 2 weeks, and we assign a dedicated success manager. Here\'s how the timeline typically looks...' },
      { objection: '"Can you integrate with our existing tools?"', response: 'Absolutely. We have native integrations with 50+ tools. Let me pull up our integration catalog and walk through your specific stack.' },
    ],
  },
  'Demo Scheduled': {
    prep: [
      'Customize the demo environment with their branding/data',
      'Prepare a clear agenda and share it in advance',
      'Identify the 3 key features most relevant to their needs',
      'Have technical resources on standby for deep questions',
    ],
    tips: [
      'Start with their pain point, not a product tour',
      'Show, don\'t tell - use real scenarios from their industry',
      'Pause frequently for questions and feedback',
      'End with a clear proposal timeline',
    ],
    objections: [
      { objection: '"The UI looks complicated"', response: 'The interface is highly customizable. Let me show you the simplified view our similar clients use - it takes about 15 minutes to configure for your workflow.' },
      { objection: '"How long is the learning curve?"', response: 'Most users are proficient within a week. We provide onboarding sessions, video tutorials, and 24/7 chat support. Our avg adoption rate is 94% in the first month.' },
      { objection: '"We need to see a POC first"', response: 'We love doing proof of concepts! We can set up a 2-week trial with your actual data. Let me outline what that looks like...' },
    ],
  },
  'Proposal Sent': {
    prep: [
      'Review the proposal for accuracy and personalization',
      'Prepare pricing justification and ROI calculations',
      'Anticipate negotiation points and prepare concessions',
      'Have customer references ready for similar deals',
    ],
    tips: [
      'Follow up within 24 hours of sending the proposal',
      'Ask if they have questions rather than if they\'ve decided',
      'Create urgency with time-limited offers if appropriate',
      'Offer to walk through the proposal on a call',
    ],
    objections: [
      { objection: '"The pricing is too high"', response: 'I understand budget is important. Let\'s look at the ROI - based on your numbers, you\'d see payback in [X months]. Would a phased approach work better?' },
      { objection: '"We\'re comparing with competitors"', response: 'Smart approach. Can I ask what criteria matter most? I want to make sure our proposal clearly addresses your top priorities.' },
      { objection: '"The contract terms need changes"', response: 'Happy to discuss terms. Which specific areas would you like to adjust? We have flexible options for [payment, duration, SLA].' },
    ],
  },
  'Negotiation': {
    prep: [
      'Know your walk-away point and approved discount levels',
      'Prepare value-add options as negotiation levers',
      'Review all stakeholder concerns raised during the process',
      'Have legal/finance team on standby for contract questions',
    ],
    tips: [
      'Focus on value, not price - anchor to ROI',
      'Trade concessions rather than giving them away',
      'Get verbal agreement before sending revised terms',
      'Set a clear decision deadline',
    ],
    objections: [
      { objection: '"We need a bigger discount"', response: 'I want to find a way to make this work. If we extend the contract term to 2 years, I can offer [X]% additional savings. Would that work for your budget?' },
      { objection: '"Legal has concerns about the SLA"', response: 'Let me connect you directly with our legal team. We can customize the SLA terms - what specific metrics matter most to your team?' },
      { objection: '"Can we delay the start date?"', response: 'Of course. We can lock in current pricing with a signed agreement and flex on the start date. When would be ideal for your team?' },
    ],
  },
  'Closed Won': {
    prep: [
      'Prepare onboarding plan and timeline',
      'Identify expansion and upsell opportunities',
      'Schedule regular check-in cadence',
      'Request referral or case study participation',
    ],
    tips: [
      'Celebrate the win and thank all stakeholders',
      'Ensure smooth handoff to customer success',
      'Set expectations for the first 90 days',
      'Plant seeds for future expansion conversations',
    ],
    objections: [],
  },
  'Closed Lost': {
    prep: [
      'Conduct a loss analysis - what went wrong?',
      'Document lessons learned for future deals',
      'Plan a re-engagement strategy for 3-6 months out',
      'Maintain the relationship for future opportunities',
    ],
    tips: [
      'Ask for candid feedback on why they chose differently',
      'Stay gracious - leave the door open',
      'Set a reminder to reconnect in the future',
      'Share relevant industry content to stay top of mind',
    ],
    objections: [],
  },
};

const POST_CALL_TEMPLATE = `## Post-Call Summary

**Date:** [Today's Date]
**Duration:** [Call Duration]
**Attendees:** [Names]

### Key Discussion Points
1.
2.
3.

### Action Items
- [ ]
- [ ]
- [ ]

### Next Steps
- Follow-up date:
- Decision timeline:
- Additional stakeholders to involve:

### Notes
[Additional observations, competitor mentions, budget signals, etc.]
`;

const EMAIL_TEMPLATES = [
  {
    id: 'cold-intro',
    name: 'Cold Introduction',
    subject: 'Quick question about {{company}}\'s growth strategy',
    body: `Hi {{firstName}},

I noticed {{company}} recently {{trigger_event}}. Congratulations!

I work with similar companies in the {{industry}} space and helped them achieve {{specific_result}}.

Would you be open to a 15-minute call to explore if we could deliver similar results for {{company}}?

Best regards`,
  },
  {
    id: 'follow-up',
    name: 'Follow-Up After No Reply',
    subject: 'Re: {{previous_subject}}',
    body: `Hi {{firstName}},

I wanted to follow up on my previous email. I know things get busy.

I came across this article about {{relevant_topic}} and thought of {{company}}. [Link]

If now isn't the right time, no worries at all. Would it make sense to reconnect in {{timeframe}}?

Best`,
  },
  {
    id: 'post-demo',
    name: 'Post-Demo Recap',
    subject: 'Great chatting today - recap and next steps',
    body: `Hi {{firstName}},

Thanks for your time today. I really enjoyed learning about {{company}}'s approach to {{topic}}.

As discussed, here's a quick recap:
- {{key_point_1}}
- {{key_point_2}}
- {{key_point_3}}

Next steps:
1. I'll send over {{deliverable}} by {{date}}
2. {{action_item}}

Looking forward to our next conversation on {{next_meeting_date}}.

Best regards`,
  },
  {
    id: 'proposal-follow',
    name: 'Proposal Follow-Up',
    subject: 'Following up on the proposal for {{company}}',
    body: `Hi {{firstName}},

I wanted to check in regarding the proposal I sent over on {{date}}.

I'm happy to:
- Walk through any sections that need clarification
- Adjust terms based on your team's feedback
- Connect you with a reference customer in {{industry}}

What questions can I answer for your team?

Best regards`,
  },
];

const LINKEDIN_TEMPLATES = {
  connectionRequest: [
    {
      id: 'cr-1',
      name: 'Mutual Interest',
      message: `Hi {{firstName}}, I came across your profile and was impressed by your work at {{company}}. I'm also passionate about {{shared_interest}} and would love to connect and exchange ideas. Looking forward to connecting!`,
    },
    {
      id: 'cr-2',
      name: 'Mutual Connection',
      message: `Hi {{firstName}}, I noticed we're both connected with {{mutual_connection}}. I've been following {{company}}'s growth in {{industry}} and would love to be part of your network. Hope to connect!`,
    },
    {
      id: 'cr-3',
      name: 'Content Engagement',
      message: `Hi {{firstName}}, I really enjoyed your recent post about {{topic}}. Your insight on {{specific_point}} resonated with me. Would love to connect and continue the conversation.`,
    },
  ],
  followUpSequence: [
    {
      day: 1,
      name: 'Day 1 - Thank You',
      message: `Thanks for connecting, {{firstName}}! I'd love to learn more about what you're working on at {{company}}. How are things going with {{relevant_topic}}?`,
    },
    {
      day: 3,
      name: 'Day 3 - Value Share',
      message: `{{firstName}}, thought you might find this interesting - I recently came across {{resource}} that's relevant to {{industry}}. Happy to share more insights from our work with similar companies.`,
    },
    {
      day: 7,
      name: 'Day 7 - Soft Ask',
      message: `Hi {{firstName}}, I've been thinking about how {{company}} could benefit from {{value_prop}}. We recently helped {{similar_company}} achieve {{result}}. Would you be open to a quick 15-min chat to explore this?`,
    },
    {
      day: 14,
      name: 'Day 14 - Case Study',
      message: `{{firstName}}, I wanted to share a case study from {{similar_company}} in {{industry}}. They saw {{specific_result}} after implementing our solution. I think {{company}} could see similar results. Worth a conversation?`,
    },
    {
      day: 21,
      name: 'Day 21 - Break-Up',
      message: `Hi {{firstName}}, I don't want to be a bother, so this will be my last message. If timing ever aligns and you'd like to explore how we can help {{company}} with {{pain_point}}, I'm just a message away. Wishing you and the team all the best!`,
    },
  ],
  inMailTemplates: [
    {
      id: 'im-1',
      name: 'Executive Outreach',
      subject: '{{company}} + {{your_company}} - potential synergy',
      message: `Hi {{firstName}},

I'm reaching out because I believe there's a strong fit between what we do at {{your_company}} and {{company}}'s goals in {{area}}.

We've helped leaders like {{reference_name}} at {{reference_company}} achieve {{specific_result}}.

I'd love 15 minutes of your time to explore if we can deliver similar value for {{company}}.

Would {{day}} work for a brief call?`,
    },
    {
      id: 'im-2',
      name: 'Event Follow-Up',
      subject: 'Great seeing you at {{event_name}}',
      message: `Hi {{firstName}},

It was great connecting at {{event_name}}. Your talk on {{topic}} really resonated with our team.

I'd love to continue our conversation about {{discussion_topic}}. We've been working on some exciting things that align with what you shared.

Would you be open to grabbing a virtual coffee this week?`,
    },
  ],
};

const LINKEDIN_PROFILE_VISITS = [
  { contact: CONTACTS[0], visitTime: generateTimestamp(30), viewed: 'Your profile', engagement: 'Liked your post' },
  { contact: CONTACTS[2], visitTime: generateTimestamp(180), viewed: 'Your profile', engagement: 'Viewed your article' },
  { contact: CONTACTS[7], visitTime: generateTimestamp(720), viewed: 'Your profile', engagement: null },
  { contact: CONTACTS[4], visitTime: generateTimestamp(1440), viewed: 'Your company page', engagement: 'Followed your company' },
  { contact: CONTACTS[9], visitTime: generateTimestamp(2880), viewed: 'Your profile', engagement: 'Connection request sent' },
];

// ---------------------------------------------------------------------------
// Channel icon colors
// ---------------------------------------------------------------------------
const channelIcons = {
  sms: { icon: Smartphone, color: '#00ff88', label: 'SMS' },
  email: { icon: Mail, color: '#3b82f6', label: 'Email' },
  linkedin: { icon: Linkedin, color: '#0a66c2', label: 'LinkedIn' },
  voip: { icon: Phone, color: '#f59e0b', label: 'VoIP' },
  community: { icon: MessageCircle, color: '#a855f7', label: 'Community' },
};

const statusColors = {
  online: '#00ff88',
  away: '#f59e0b',
  dnd: '#ef4444',
  offline: '#6b7280',
};

const dealStageColors = {
  'Cold Outreach': '#6b7280',
  'Qualification': '#3b82f6',
  'Discovery': '#8b5cf6',
  'Demo Scheduled': '#f59e0b',
  'Proposal Sent': '#f97316',
  'Negotiation': '#ec4899',
  'Closed Won': '#00ff88',
  'Closed Lost': '#ef4444',
};

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function StatusDot({ status, size = 'sm' }) {
  const sizes = { xs: 'w-2 h-2', sm: 'w-2.5 h-2.5', md: 'w-3 h-3', lg: 'w-3.5 h-3.5' };
  return (
    <span
      className={`${sizes[size]} rounded-full inline-block flex-shrink-0`}
      style={{ backgroundColor: statusColors[status] || '#6b7280', boxShadow: status === 'online' ? `0 0 6px ${statusColors[status]}` : 'none' }}
    />
  );
}

function Avatar({ contact, size = 'md', showStatus = true }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
  const dotPos = { sm: '-bottom-0.5 -right-0.5', md: '-bottom-0.5 -right-0.5', lg: '-bottom-0 -right-0', xl: '-bottom-0 -right-0' };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold`}
        style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.05))', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88' }}>
        {contact.avatar}
      </div>
      {showStatus && contact.status && (
        <span className={`absolute ${dotPos[size]}`}>
          <StatusDot status={contact.status} size={size === 'sm' ? 'xs' : 'sm'} />
        </span>
      )}
    </div>
  );
}

function ChannelBadge({ channel }) {
  const info = channelIcons[channel];
  if (!info) return null;
  const Icon = info.icon;
  return (
    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{ backgroundColor: `${info.color}15`, color: info.color, border: `1px solid ${info.color}30` }}>
      <Icon size={10} />
      {info.label}
    </span>
  );
}

function UnreadBadge({ count }) {
  if (!count) return null;
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
      style={{ backgroundColor: '#00ff88', color: '#0a0a0f' }}>
      {count > 99 ? '99+' : count}
    </motion.span>
  );
}

function TypingIndicator({ names }) {
  if (!names || names.length === 0) return null;
  const text = names.length === 1 ? `${names[0]} is typing` : `${names.join(', ')} are typing`;
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
      className="flex items-center gap-2 px-4 py-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
      <div className="flex gap-0.5">
        {[0, 1, 2].map(i => (
          <motion.span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00ff88' }}
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
        ))}
      </div>
      <span>{text}</span>
    </motion.div>
  );
}

function NeonDivider() {
  return <div className="h-px w-full my-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.15), transparent)' }} />;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all hover:bg-white/[0.04]"
      style={{ color: copied ? '#00ff88' : 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {copied ? <CheckCircle2 size={10} /> : <Copy size={10} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Unified Inbox Panel (Left)
// ---------------------------------------------------------------------------
function UnifiedInbox({ conversations, selected, onSelect, searchQuery, onSearchChange, filter, onFilterChange }) {
  const filteredConvos = conversations.filter(c => {
    const matchesSearch = !searchQuery || c.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || c.channel === filter;
    return matchesSearch && matchesFilter;
  });

  const filters = [
    { key: 'all', label: 'All', icon: Inbox },
    { key: 'sms', label: 'SMS', icon: Smartphone },
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { key: 'voip', label: 'Calls', icon: Phone },
    { key: 'community', label: 'Chat', icon: MessageCircle },
  ];

  return (
    <div className="flex flex-col h-full" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold tracking-wide" style={{ color: '#00ff88' }}>INBOX</h2>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <Filter size={14} />
            </button>
            <button className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <Archive size={14} />
            </button>
          </div>
        </div>
        {/* Search */}
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.02)', color: 'white' }}
          />
        </div>
        {/* Filters */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map(f => {
            const Icon = f.icon;
            const active = filter === f.key;
            return (
              <button key={f.key} onClick={() => onFilterChange(f.key)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-all"
                style={{
                  backgroundColor: active ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.01)',
                  color: active ? '#00ff88' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${active ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                <Icon size={10} />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {filteredConvos.map((conv, idx) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => onSelect(conv)}
              className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-all group"
              style={{
                backgroundColor: selected?.id === conv.id ? 'rgba(0,255,136,0.08)' : 'transparent',
                borderLeft: selected?.id === conv.id ? '2px solid #00ff88' : '2px solid transparent',
                borderBottom: '1px solid rgba(255,255,255,0.01)',
              }}>
              <Avatar contact={conv.contact} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold truncate" style={{ color: conv.unread ? 'white' : 'rgba(255,255,255,0.7)' }}>
                    {conv.contact.name}
                  </span>
                  <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {formatTime(conv.time)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <ChannelBadge channel={conv.channel} />
                  {conv.starred && <Star size={10} style={{ color: '#f59e0b' }} fill="#f59e0b" />}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] truncate pr-2" style={{ color: conv.unread ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)' }}>
                    {conv.lastMessage}
                  </p>
                  <UnreadBadge count={conv.unread} />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat / Messaging Area (Center)
// ---------------------------------------------------------------------------
function ChatArea({ selectedConversation, activeChannel, onChannelChange, messages, channels, voiceChannels, showCommunity, onToggleCommunity }) {
  const [messageInput, setMessageInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const shouldShow = Math.random() > 0.7;
      if (shouldShow) {
        const randomContact = CONTACTS[Math.floor(Math.random() * 5)];
        setTypingUsers([randomContact.name.split(' ')[0]]);
        setTimeout(() => setTypingUsers([]), 3000);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = useCallback(() => {
    if (!messageInput.trim()) return;
    setMessageInput('');
    inputRef.current?.focus();
  }, [messageInput]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="flex flex-col h-full">
      {/* Channel Header */}
      <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-center gap-3">
          {selectedConversation ? (
            <>
              <Avatar contact={selectedConversation.contact} size="sm" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{selectedConversation.contact.name}</span>
                  <ChannelBadge channel={selectedConversation.channel} />
                </div>
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {selectedConversation.contact.company} &middot; {selectedConversation.contact.role}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0,255,136,0.1)' }}>
                <Hash size={16} style={{ color: '#00ff88' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">#{activeChannel}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.015)', color: 'rgba(255,255,255,0.4)' }}>
                    {channels.find(c => c.id === activeChannel)?.members || 0} members
                  </span>
                </div>
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {channels.find(c => c.id === activeChannel)?.description || ''}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]" style={{ color: 'rgba(255,255,255,0.5)' }} title="Voice call">
            <Phone size={16} />
          </button>
          <button className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]" style={{ color: 'rgba(255,255,255,0.5)' }} title="Video call">
            <Video size={16} />
          </button>
          <button className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]" style={{ color: 'rgba(255,255,255,0.5)' }} title="Pinned messages">
            <Pin size={16} />
          </button>
          <button onClick={onToggleCommunity}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]"
            style={{ color: showCommunity ? '#00ff88' : 'rgba(255,255,255,0.5)' }} title="Community hub">
            <Users size={16} />
          </button>
          <button className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]" style={{ color: 'rgba(255,255,255,0.5)' }} title="Search">
            <Search size={16} />
          </button>
        </div>
      </div>

      {/* AI Summary Bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex items-center gap-2 px-4 py-1.5 text-[11px]"
        style={{ backgroundColor: 'rgba(0,255,136,0.04)', borderBottom: '1px solid rgba(0,255,136,0.08)' }}>
        <Bot size={12} style={{ color: '#00ff88' }} />
        <span style={{ color: 'rgba(0,255,136,0.7)' }}>
          <strong className="font-semibold" style={{ color: '#00ff88' }}>AI Summary:</strong>
          {' '}12 messages today. Key topics: onboarding, AI feature adoption, beta program updates.
          Sarah onboarded TechVault, Rachel confirmed Velocity Partners for beta.
        </span>
        <button className="ml-auto flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-medium transition-colors hover:bg-white/[0.02]"
          style={{ color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
          <Sparkles size={10} className="inline mr-1" />
          Details
        </button>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {messages.map((msg, idx) => {
          const isConsecutive = idx > 0 && messages[idx - 1].sender.id === msg.sender.id
            && (msg.time - messages[idx - 1].time) < 300000;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`group flex items-start gap-3 py-1 px-2 -mx-2 rounded-lg transition-colors hover:bg-white/[0.02] ${isConsecutive ? 'mt-0' : 'mt-3'}`}>
              {isConsecutive ? (
                <div className="w-10 flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {formatClockTime(msg.time)}
                  </span>
                </div>
              ) : (
                <Avatar contact={msg.sender} size="md" showStatus={false} />
              )}
              <div className="flex-1 min-w-0">
                {!isConsecutive && (
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold" style={{ color: '#00ff88' }}>{msg.sender.name}</span>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{formatClockTime(msg.time)}</span>
                    {msg.sender.role && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(255,255,255,0.015)', color: 'rgba(255,255,255,0.35)' }}>
                        {msg.sender.company}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>{msg.text}</p>
                {/* Reactions */}
                {msg.reactions.length > 0 && (
                  <div className="flex items-center gap-1 mt-1.5">
                    {msg.reactions.map((r, i) => (
                      <button key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] transition-colors hover:bg-white/[0.04]"
                        style={{ backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.02)' }}>
                        <span>{r.emoji}</span>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{r.count}</span>
                      </button>
                    ))}
                    <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/[0.02]">
                      <Plus size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    </button>
                  </div>
                )}
                {/* Thread indicator */}
                {msg.thread && (
                  <button className="flex items-center gap-1.5 mt-1 px-2 py-1 rounded-md text-[11px] transition-colors hover:bg-white/[0.02]"
                    style={{ color: '#00ff88' }}>
                    <MessageSquare size={12} />
                    <span>{msg.thread} replies</span>
                    <ChevronRight size={10} />
                  </button>
                )}
              </div>
              {/* Hover actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1">
                <button className="p-1 rounded hover:bg-white/[0.02] transition-colors" title="React">
                  <Smile size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </button>
                <button className="p-1 rounded hover:bg-white/[0.02] transition-colors" title="Reply in thread">
                  <Reply size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </button>
                <button className="p-1 rounded hover:bg-white/[0.02] transition-colors" title="Forward">
                  <Forward size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </button>
                <button className="p-1 rounded hover:bg-white/[0.02] transition-colors" title="More">
                  <MoreHorizontal size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </button>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      <AnimatePresence>
        {typingUsers.length > 0 && <TypingIndicator names={typingUsers} />}
      </AnimatePresence>

      {/* Message Input */}
      <div className="px-4 pb-3 pt-1 flex-shrink-0">
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.02)' }}>
          <div className="flex items-end gap-2 px-3 py-2">
            <button className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02] flex-shrink-0"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              <Plus size={18} />
            </button>
            <textarea
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedConversation ? `Message ${selectedConversation.contact.name}...` : `Message #${activeChannel}...`}
              className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed max-h-32"
              style={{ color: 'white' }}
              rows={1}
            />
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]"
                style={{ color: 'rgba(255,255,255,0.4)' }} title="Attach file">
                <Paperclip size={16} />
              </button>
              <button className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]"
                style={{ color: 'rgba(255,255,255,0.4)' }} title="Add image">
                <Image size={16} />
              </button>
              <button onClick={() => setShowEmoji(!showEmoji)}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]"
                style={{ color: showEmoji ? '#00ff88' : 'rgba(255,255,255,0.4)' }} title="Emoji">
                <Smile size={16} />
              </button>
              <button onClick={handleSend}
                className="p-1.5 rounded-lg transition-all ml-1"
                style={{
                  backgroundColor: messageInput.trim() ? '#00ff88' : 'rgba(255,255,255,0.015)',
                  color: messageInput.trim() ? '#0a0a0f' : 'rgba(255,255,255,0.2)',
                }}>
                <Send size={16} />
              </button>
            </div>
          </div>
          {/* Formatting toolbar hint */}
          <div className="flex items-center justify-between px-3 py-1"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-2">
              <button className="text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors hover:bg-white/[0.02]"
                style={{ color: 'rgba(255,255,255,0.3)' }}>B</button>
              <button className="text-[10px] italic px-1.5 py-0.5 rounded transition-colors hover:bg-white/[0.02]"
                style={{ color: 'rgba(255,255,255,0.3)' }}>I</button>
              <button className="text-[10px] line-through px-1.5 py-0.5 rounded transition-colors hover:bg-white/[0.02]"
                style={{ color: 'rgba(255,255,255,0.3)' }}>S</button>
              <button className="text-[10px] px-1.5 py-0.5 rounded transition-colors hover:bg-white/[0.02]"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
                <Link2 size={10} />
              </button>
            </div>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              <kbd className="px-1 py-0.5 rounded text-[9px]" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>Enter</kbd> to send
              &middot;
              <kbd className="px-1 py-0.5 rounded text-[9px] ml-1" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>Shift+Enter</kbd> new line
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contact Detail Panel (Right)
// ---------------------------------------------------------------------------
function ContactDetailPanel({ contact, onClose }) {
  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center"
        style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)' }}>
          <User size={24} style={{ color: 'rgba(0,255,136,0.3)' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Select a conversation</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Contact details will appear here</p>
      </div>
    );
  }

  const scoreColor = contact.leadScore >= 80 ? '#00ff88' : contact.leadScore >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="p-4 text-center flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="p-1 rounded-lg transition-colors hover:bg-white/[0.02]"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            <X size={14} />
          </button>
        </div>
        <Avatar contact={contact} size="xl" />
        <h3 className="text-base font-bold text-white mt-3">{contact.name}</h3>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{contact.role}</p>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <Building2 size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{contact.company}</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-0.5">
          <MapPin size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{contact.location}</span>
        </div>
        {/* Status badge */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <StatusDot status={contact.status} size="sm" />
          <span className="text-[11px] capitalize" style={{ color: statusColors[contact.status] }}>
            {contact.status === 'dnd' ? 'Do Not Disturb' : contact.status}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-1 p-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { icon: Phone, label: 'Call', color: '#00ff88' },
          { icon: Mail, label: 'Email', color: '#3b82f6' },
          { icon: Calendar, label: 'Schedule', color: '#f59e0b' },
          { icon: Edit3, label: 'Note', color: '#a855f7' },
        ].map(action => (
          <button key={action.label}
            className="flex flex-col items-center gap-1 py-2 rounded-lg transition-all hover:bg-white/[0.02]">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${action.color}15`, border: `1px solid ${action.color}25` }}>
              <action.icon size={14} style={{ color: action.color }} />
            </div>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Lead Score & Deal */}
      <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Lead Score</span>
          <span className="text-sm font-bold" style={{ color: scoreColor }}>{contact.leadScore}/100</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${contact.leadScore}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: scoreColor, boxShadow: `0 0 8px ${scoreColor}40` }}
          />
        </div>

        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Deal Stage</span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${dealStageColors[contact.dealStage]}20`, color: dealStageColors[contact.dealStage], border: `1px solid ${dealStageColors[contact.dealStage]}30` }}>
            {contact.dealStage}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Deal Value</span>
          <span className="text-sm font-bold" style={{ color: '#00ff88' }}>
            ${(contact.dealValue / 1000).toFixed(0)}K
          </span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Contact Info</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Mail size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{contact.email}</span>
            <button className="ml-auto p-0.5 rounded hover:bg-white/[0.02] transition-colors">
              <Copy size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{contact.phone}</span>
            <button className="ml-auto p-0.5 rounded hover:bg-white/[0.02] transition-colors">
              <Copy size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Linkedin size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span className="text-xs" style={{ color: '#0a66c2' }}>View Profile</span>
            <button className="ml-auto p-0.5 rounded hover:bg-white/[0.02] transition-colors">
              <ExternalLink size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
            </button>
          </div>
        </div>
      </div>

      {/* AI Suggested Follow-up */}
      <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={12} style={{ color: '#00ff88' }} />
          <h4 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#00ff88' }}>AI Suggested Action</h4>
        </div>
        <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Schedule a follow-up call within 48 hours. {contact.name} showed high engagement with the proposal.
            Prepare competitive analysis slides for potential objections on pricing.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: '#00ff88', color: '#0a0a0f' }}>
              <Calendar size={11} />
              Schedule Now
            </button>
            <button className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors hover:bg-white/[0.02]"
              style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <X size={11} />
              Dismiss
            </button>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="p-3 flex-1">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Recent Activity</h4>
        <div className="space-y-3">
          {ACTIVITY_TIMELINE.map((activity, idx) => {
            const actIcons = { email: Mail, call: Phone, meeting: Calendar, note: Edit3, deal: Target, linkedin: Linkedin };
            const actColors = { email: '#3b82f6', call: '#00ff88', meeting: '#f59e0b', note: '#a855f7', deal: '#ec4899', linkedin: '#0a66c2' };
            const Icon = actIcons[activity.type] || Activity;
            const clr = actColors[activity.type] || '#6b7280';
            return (
              <div key={activity.id} className="flex items-start gap-2.5">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${clr}15`, border: `1px solid ${clr}25` }}>
                    <Icon size={11} style={{ color: clr }} />
                  </div>
                  {idx < ACTIVITY_TIMELINE.length - 1 && (
                    <div className="w-px flex-1 mt-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)', minHeight: '16px' }} />
                  )}
                </div>
                <div className="pb-2">
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{activity.text}</p>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatTime(activity.time)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VoIP Dialer (Enhanced - Full Featured)
// ---------------------------------------------------------------------------
function VoIPDialer({ isOpen, onClose }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isRecording, setIsRecording] = useState(true);
  const [activeTab, setActiveTab] = useState('dialer');
  const [playingCall, setPlayingCall] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isInCall && !isOnHold) {
      timerRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isInCall, isOnHold]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatPhoneInput = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handleDial = (digit) => {
    if (phoneNumber.replace(/\D/g, '').length < 10) {
      setPhoneNumber(prev => formatPhoneInput(prev.replace(/\D/g, '') + digit));
    }
  };

  const handleCall = () => {
    if (phoneNumber.trim()) {
      setIsInCall(true);
      setCallDuration(0);
    }
  };

  const handleHangup = () => {
    setIsInCall(false);
    setIsOnHold(false);
    setIsMuted(false);
    setIsSpeaker(false);
    setPhoneNumber('');
    setCallDuration(0);
  };

  const handleBackspace = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length > 0) {
      setPhoneNumber(formatPhoneInput(digits.slice(0, -1)));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md rounded-2xl overflow-hidden"
          style={{ backgroundColor: '#12121a', border: '1px solid rgba(255,255,255,0.02)', boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 100px rgba(0,255,136,0.05)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <Phone size={16} style={{ color: '#00ff88' }} />
              <span className="text-sm font-bold" style={{ color: '#00ff88' }}>GOATED Dialer</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-5 pt-3 gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['dialer', 'recent', 'voicemail'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-3 py-2 text-xs font-medium capitalize transition-colors rounded-t-lg"
                style={{
                  color: activeTab === tab ? '#00ff88' : 'rgba(255,255,255,0.4)',
                  borderBottom: activeTab === tab ? '2px solid #00ff88' : '2px solid transparent',
                }}>
                {tab === 'dialer' ? 'Dialer' : tab === 'recent' ? 'History' : 'Voicemail'}
                {tab === 'voicemail' && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full text-[8px] font-bold"
                    style={{ backgroundColor: '#ef4444', color: 'white' }}>
                    {VOICEMAILS.filter(v => v.isNew).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'dialer' ? (
            <div className="p-5">
              {/* Phone Input */}
              <div className="text-center mb-4">
                {isInCall ? (
                  <div>
                    <p className="text-lg font-bold text-white mb-1">{phoneNumber || 'Unknown'}</p>
                    {isOnHold ? (
                      <motion.p animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-sm font-mono" style={{ color: '#f59e0b' }}>
                        ON HOLD - {formatDuration(callDuration)}
                      </motion.p>
                    ) : (
                      <motion.p animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
                        className="text-sm font-mono" style={{ color: '#00ff88' }}>
                        {formatDuration(callDuration)}
                      </motion.p>
                    )}
                    <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                      {isRecording && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                          <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Recording
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(0,255,136,0.1)', color: '#00ff88' }}>
                        <Bot size={10} />
                        AI Transcribing
                      </span>
                      {isMuted && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                          <MicOff size={10} />
                          Muted
                        </span>
                      )}
                      {isSpeaker && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                          <Volume2 size={10} />
                          Speaker
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(formatPhoneInput(e.target.value.replace(/\D/g, '')))}
                      placeholder="(555) 000-0000"
                      className="text-2xl font-mono text-center bg-transparent outline-none w-full"
                      style={{ color: 'white' }}
                    />
                    {phoneNumber && (
                      <button onClick={handleBackspace}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors hover:bg-white/[0.04]"
                        style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Dial Pad */}
              {!isInCall && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { digit: '1', sub: '' },
                    { digit: '2', sub: 'ABC' },
                    { digit: '3', sub: 'DEF' },
                    { digit: '4', sub: 'GHI' },
                    { digit: '5', sub: 'JKL' },
                    { digit: '6', sub: 'MNO' },
                    { digit: '7', sub: 'PQRS' },
                    { digit: '8', sub: 'TUV' },
                    { digit: '9', sub: 'WXYZ' },
                    { digit: '*', sub: '' },
                    { digit: '0', sub: '+' },
                    { digit: '#', sub: '' },
                  ].map(({ digit, sub }) => (
                    <button key={digit} onClick={() => handleDial(digit)}
                      className="h-14 rounded-xl flex flex-col items-center justify-center transition-all hover:bg-white/[0.04] active:scale-95"
                      style={{ backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.02)' }}>
                      <span className="text-lg font-semibold text-white">{digit}</span>
                      {sub && <span className="text-[8px] tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* In-Call Controls */}
              {isInCall && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <button onClick={() => setIsMuted(!isMuted)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                    style={{
                      backgroundColor: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.015)',
                      border: `1px solid ${isMuted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.02)'}`,
                    }}>
                    {isMuted ? <MicOff size={20} style={{ color: '#ef4444' }} /> : <Mic size={20} style={{ color: 'white' }} />}
                    <span className="text-[10px]" style={{ color: isMuted ? '#ef4444' : 'rgba(255,255,255,0.5)' }}>
                      {isMuted ? 'Unmute' : 'Mute'}
                    </span>
                  </button>

                  <button onClick={() => setIsOnHold(!isOnHold)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                    style={{
                      backgroundColor: isOnHold ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.015)',
                      border: `1px solid ${isOnHold ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.02)'}`,
                    }}>
                    <Pause size={20} style={{ color: isOnHold ? '#f59e0b' : 'white' }} />
                    <span className="text-[10px]" style={{ color: isOnHold ? '#f59e0b' : 'rgba(255,255,255,0.5)' }}>
                      {isOnHold ? 'Resume' : 'Hold'}
                    </span>
                  </button>

                  <button onClick={() => setIsSpeaker(!isSpeaker)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                    style={{
                      backgroundColor: isSpeaker ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.015)',
                      border: `1px solid ${isSpeaker ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.02)'}`,
                    }}>
                    {isSpeaker ? <Volume2 size={20} style={{ color: '#3b82f6' }} /> : <VolumeX size={20} style={{ color: 'white' }} />}
                    <span className="text-[10px]" style={{ color: isSpeaker ? '#3b82f6' : 'rgba(255,255,255,0.5)' }}>
                      Speaker
                    </span>
                  </button>

                  <button onClick={() => setIsRecording(!isRecording)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                    style={{
                      backgroundColor: isRecording ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.015)',
                      border: `1px solid ${isRecording ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.02)'}`,
                    }}>
                    <Radio size={20} style={{ color: isRecording ? '#ef4444' : 'white' }} />
                    <span className="text-[10px]" style={{ color: isRecording ? '#ef4444' : 'rgba(255,255,255,0.5)' }}>
                      {isRecording ? 'Stop Rec' : 'Record'}
                    </span>
                  </button>

                  <button className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                    style={{ backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <Headphones size={20} style={{ color: 'white' }} />
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Audio</span>
                  </button>

                  <button className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                    style={{ backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <UserPlus size={20} style={{ color: 'white' }} />
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Transfer</span>
                  </button>
                </div>
              )}

              {/* Call / Hangup Button */}
              <div className="flex items-center justify-center">
                <button onClick={isInCall ? handleHangup : handleCall}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{
                    backgroundColor: isInCall ? '#ef4444' : '#00ff88',
                    boxShadow: isInCall ? '0 0 20px rgba(239,68,68,0.3)' : '0 0 20px rgba(0,255,136,0.3)',
                  }}>
                  {isInCall
                    ? <PhoneOff size={24} style={{ color: 'white' }} />
                    : <Phone size={24} style={{ color: '#0a0a0f' }} />
                  }
                </button>
              </div>

              {/* Recording toggle (pre-call) */}
              {!isInCall && (
                <div className="flex items-center justify-between mt-4 p-2.5 rounded-lg"
                  style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <Radio size={14} style={{ color: isRecording ? '#ef4444' : 'rgba(255,255,255,0.4)' }} />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Auto-record calls</span>
                  </div>
                  <button onClick={() => setIsRecording(!isRecording)} className="relative">
                    {isRecording
                      ? <ToggleRight size={22} style={{ color: '#00ff88' }} />
                      : <ToggleLeft size={22} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    }
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'recent' ? (
            /* Recent Calls Tab */
            <div className="max-h-96 overflow-y-auto">
              {RECENT_CALLS.map(call => {
                const callTypeIcons = { outgoing: PhoneOutgoing, incoming: PhoneIncoming, missed: PhoneMissed };
                const callTypeColors = { outgoing: '#00ff88', incoming: '#3b82f6', missed: '#ef4444' };
                const Icon = callTypeIcons[call.type];
                const clr = callTypeColors[call.type];
                const isPlaying = playingCall === call.id;
                return (
                  <div key={call.id}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.02] cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.01)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${clr}15` }}>
                      <Icon size={14} style={{ color: clr }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white">{call.contact.name}</span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatTime(call.time)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] capitalize" style={{ color: clr }}>{call.type}</span>
                        {call.duration && <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{call.duration}</span>}
                        {call.recorded && (
                          <span className="text-[9px] px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>REC</span>
                        )}
                        {call.transcribed && (
                          <span className="text-[9px] px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,255,136,0.1)', color: '#00ff88' }}>AI</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {call.recorded && (
                        <button onClick={() => setPlayingCall(isPlaying ? null : call.id)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.04]"
                          style={{ color: isPlaying ? '#00ff88' : 'rgba(255,255,255,0.4)' }}
                          title={isPlaying ? 'Stop playback' : 'Play recording'}>
                          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                      )}
                      {call.recorded && (
                        <button className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.04]"
                          style={{ color: 'rgba(255,255,255,0.4)' }}
                          title="Download recording">
                          <Download size={14} />
                        </button>
                      )}
                      <button className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.04]"
                        style={{ color: '#00ff88' }}
                        title="Call back"
                        onClick={() => {
                          setPhoneNumber(call.contact.phone);
                          setActiveTab('dialer');
                        }}>
                        <Phone size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Voicemail Tab */
            <div className="max-h-96 overflow-y-auto">
              {VOICEMAILS.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <Voicemail size={32} style={{ color: 'rgba(255,255,255,0.15)' }} />
                  <p className="text-sm mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>No voicemails</p>
                </div>
              ) : (
                VOICEMAILS.map(vm => (
                  <div key={vm.id}
                    className="px-5 py-3 transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.01)' }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(168,85,247,0.15)' }}>
                        <Voicemail size={14} style={{ color: '#a855f7' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white">{vm.contact.name}</span>
                            {vm.isNew && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                                style={{ backgroundColor: '#00ff88', color: '#0a0a0f' }}>NEW</span>
                            )}
                          </div>
                          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatTime(vm.time)}</span>
                        </div>
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Duration: {vm.duration}
                        </span>
                      </div>
                    </div>
                    {/* Transcript */}
                    <div className="ml-11 p-2 rounded-lg mb-2"
                      style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="flex items-center gap-1 mb-1">
                        <Bot size={10} style={{ color: '#00ff88' }} />
                        <span className="text-[9px] font-medium" style={{ color: '#00ff88' }}>AI Transcript</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {vm.transcript}
                      </p>
                    </div>
                    <div className="ml-11 flex items-center gap-2">
                      <button className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors hover:bg-white/[0.04]"
                        style={{ color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
                        <Play size={10} />
                        Play
                      </button>
                      <button className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors hover:bg-white/[0.04]"
                        style={{ color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}
                        onClick={() => {
                          setPhoneNumber(vm.contact.phone);
                          setActiveTab('dialer');
                        }}>
                        <Phone size={10} />
                        Call Back
                      </button>
                      <button className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors hover:bg-white/[0.04]"
                        style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <Download size={10} />
                        Save
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Outreach Coach Panel
// ---------------------------------------------------------------------------
function OutreachCoachPanel({ selectedContact }) {
  const [activeCoachTab, setActiveCoachTab] = useState('prep');
  const [isSimulatingCall, setIsSimulatingCall] = useState(false);
  const [coachingTipIndex, setCoachingTipIndex] = useState(0);
  const [showPostCallTemplate, setShowPostCallTemplate] = useState(false);

  const contact = selectedContact || CONTACTS[0];
  const stageData = DEAL_STAGE_TALKING_POINTS[contact.dealStage] || DEAL_STAGE_TALKING_POINTS['Cold Outreach'];

  // Simulate real-time coaching tips during "calls"
  useEffect(() => {
    if (!isSimulatingCall) return;
    const interval = setInterval(() => {
      setCoachingTipIndex(prev => (prev + 1) % stageData.tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isSimulatingCall, stageData.tips.length]);

  const coachTabs = [
    { id: 'prep', label: 'Pre-Call Prep', icon: ClipboardList },
    { id: 'live', label: 'Live Coach', icon: Zap },
    { id: 'objections', label: 'Objections', icon: Shield },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'postcall', label: 'Post-Call', icon: CheckCircle2 },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(168,85,247,0.2))', border: '1px solid rgba(0,255,136,0.2)' }}>
            <GraduationCap size={16} style={{ color: '#00ff88' }} />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: '#00ff88' }}>OUTREACH COACH</h2>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>AI-powered coaching for {contact.name}</p>
          </div>
        </div>

        {/* Contact Context */}
        <div className="flex items-center gap-2 p-2 rounded-lg mb-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <Avatar contact={contact} size="sm" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-white">{contact.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{contact.company}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${dealStageColors[contact.dealStage]}20`, color: dealStageColors[contact.dealStage] }}>
                {contact.dealStage}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold" style={{ color: '#00ff88' }}>${(contact.dealValue / 1000).toFixed(0)}K</span>
        </div>

        {/* Coach Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {coachTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveCoachTab(tab.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-all"
                style={{
                  backgroundColor: activeCoachTab === tab.id ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.01)',
                  color: activeCoachTab === tab.id ? '#00ff88' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${activeCoachTab === tab.id ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                <Icon size={10} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {activeCoachTab === 'prep' && (
            <motion.div key="prep" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={14} style={{ color: '#f59e0b' }} />
                <h3 className="text-xs font-bold" style={{ color: '#f59e0b' }}>Pre-Call Preparation</h3>
              </div>
              <div className="space-y-2 mb-4">
                {stageData.prep.map((point, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-2 p-2.5 rounded-lg"
                    style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
                      <span className="text-[9px] font-bold" style={{ color: '#00ff88' }}>{idx + 1}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{point}</p>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Target size={14} style={{ color: '#a855f7' }} />
                <h3 className="text-xs font-bold" style={{ color: '#a855f7' }}>Suggested Talking Points</h3>
              </div>
              <div className="space-y-2">
                {stageData.tips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg"
                    style={{ backgroundColor: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.1)' }}>
                    <Sparkles size={12} style={{ color: '#a855f7' }} className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{tip}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeCoachTab === 'live' && (
            <motion.div key="live" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {!isSimulatingCall ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,255,136,0.05))', border: '1px solid rgba(0,255,136,0.2)' }}>
                    <Zap size={24} style={{ color: '#00ff88' }} />
                  </div>
                  <p className="text-sm font-medium text-white mb-2">Live Coaching Mode</p>
                  <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Start a simulated call to receive real-time coaching tips based on {contact.name}'s profile and deal stage.
                  </p>
                  <button onClick={() => setIsSimulatingCall(true)}
                    className="px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90"
                    style={{ backgroundColor: '#00ff88', color: '#0a0a0f' }}>
                    <PhoneCall size={12} className="inline mr-1.5" />
                    Start Simulated Call
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                        className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00ff88', boxShadow: '0 0 8px rgba(0,255,136,0.5)' }} />
                      <span className="text-xs font-bold" style={{ color: '#00ff88' }}>LIVE COACHING ACTIVE</span>
                    </div>
                    <button onClick={() => setIsSimulatingCall(false)}
                      className="px-2 py-1 rounded-md text-[10px] font-medium"
                      style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                      End Session
                    </button>
                  </div>

                  {/* Current Coaching Tip */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={coachingTipIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-4 rounded-xl mb-4"
                      style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,255,136,0.02))', border: '1px solid rgba(0,255,136,0.15)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Bot size={14} style={{ color: '#00ff88' }} />
                        <span className="text-xs font-bold" style={{ color: '#00ff88' }}>AI Coach Tip</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full ml-auto"
                          style={{ backgroundColor: 'rgba(0,255,136,0.1)', color: '#00ff88' }}>
                          {coachingTipIndex + 1}/{stageData.tips.length}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {stageData.tips[coachingTipIndex]}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* All tips queue */}
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Coaching Queue</h4>
                  <div className="space-y-1.5">
                    {stageData.tips.map((tip, idx) => (
                      <div key={idx}
                        className="flex items-start gap-2 p-2 rounded-lg transition-all"
                        style={{
                          backgroundColor: idx === coachingTipIndex ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.01)',
                          border: `1px solid ${idx === coachingTipIndex ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.02)'}`,
                          opacity: idx < coachingTipIndex ? 0.5 : 1,
                        }}>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{
                            backgroundColor: idx <= coachingTipIndex ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${idx <= coachingTipIndex ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.06)'}`,
                          }}>
                          {idx < coachingTipIndex ? (
                            <CheckCircle2 size={8} style={{ color: '#00ff88' }} />
                          ) : (
                            <span className="text-[7px] font-bold" style={{ color: idx === coachingTipIndex ? '#00ff88' : 'rgba(255,255,255,0.3)' }}>{idx + 1}</span>
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeCoachTab === 'objections' && (
            <motion.div key="objections" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} style={{ color: '#ec4899' }} />
                <h3 className="text-xs font-bold" style={{ color: '#ec4899' }}>
                  Objection Handling - {contact.dealStage}
                </h3>
              </div>
              {stageData.objections.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 size={32} style={{ color: 'rgba(0,255,136,0.3)' }} />
                  <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    No common objections for this deal stage
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stageData.objections.map((obj, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                      className="rounded-xl overflow-hidden"
                      style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="px-3 py-2" style={{ backgroundColor: 'rgba(239,68,68,0.05)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <AlertCircle size={10} style={{ color: '#ef4444' }} />
                          <span className="text-[10px] font-bold" style={{ color: '#ef4444' }}>OBJECTION</span>
                        </div>
                        <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{obj.objection}</p>
                      </div>
                      <div className="px-3 py-2" style={{ backgroundColor: 'rgba(0,255,136,0.03)' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles size={10} style={{ color: '#00ff88' }} />
                          <span className="text-[10px] font-bold" style={{ color: '#00ff88' }}>SUGGESTED RESPONSE</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{obj.response}</p>
                        <div className="mt-2">
                          <CopyButton text={obj.response} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeCoachTab === 'templates' && (
            <motion.div key="templates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <Mail size={14} style={{ color: '#3b82f6' }} />
                <h3 className="text-xs font-bold" style={{ color: '#3b82f6' }}>Email Templates</h3>
              </div>
              <div className="space-y-3 mb-6">
                {EMAIL_TEMPLATES.map(template => (
                  <div key={template.id} className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center justify-between px-3 py-2"
                      style={{ backgroundColor: 'rgba(59,130,246,0.05)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-xs font-medium text-white">{template.name}</span>
                      <CopyButton text={`Subject: ${template.subject}\n\n${template.body}`} />
                    </div>
                    <div className="px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <p className="text-[10px] font-medium mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Subject: {template.subject}
                      </p>
                      <p className="text-[11px] leading-relaxed whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {template.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeCoachTab === 'postcall' && (
            <motion.div key="postcall" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={14} style={{ color: '#00ff88' }} />
                <h3 className="text-xs font-bold" style={{ color: '#00ff88' }}>Post-Call Summary Template</h3>
              </div>
              <div className="rounded-xl overflow-hidden mb-4"
                style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center justify-between px-3 py-2"
                  style={{ backgroundColor: 'rgba(0,255,136,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-xs font-medium text-white">Summary Template</span>
                  <CopyButton text={POST_CALL_TEMPLATE} />
                </div>
                <div className="px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <pre className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {POST_CALL_TEMPLATE}
                  </pre>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} style={{ color: '#f59e0b' }} />
                <h3 className="text-xs font-bold" style={{ color: '#f59e0b' }}>Quick Actions After Call</h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Update deal stage in CRM', icon: Target, color: '#ec4899' },
                  { label: 'Send follow-up email', icon: Mail, color: '#3b82f6' },
                  { label: 'Schedule next meeting', icon: Calendar, color: '#f59e0b' },
                  { label: 'Add internal notes', icon: Edit3, color: '#a855f7' },
                  { label: 'Share recording with team', icon: Share2, color: '#00ff88' },
                ].map((action, idx) => (
                  <button key={idx}
                    className="flex items-center gap-3 w-full p-2.5 rounded-lg transition-all hover:bg-white/[0.02] text-left"
                    style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${action.color}15`, border: `1px solid ${action.color}25` }}>
                      <action.icon size={12} style={{ color: action.color }} />
                    </div>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{action.label}</span>
                    <ChevronRight size={12} className="ml-auto" style={{ color: 'rgba(255,255,255,0.2)' }} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LinkedIn Outreach Panel
// ---------------------------------------------------------------------------
function LinkedInOutreachPanel({ selectedContact }) {
  const [activeLinkedInTab, setActiveLinkedInTab] = useState('connect');

  const contact = selectedContact || CONTACTS[0];

  const linkedInTabs = [
    { id: 'connect', label: 'Connect', icon: UserPlus },
    { id: 'sequence', label: 'Sequence', icon: Repeat },
    { id: 'inmail', label: 'InMail', icon: Mail },
    { id: 'tracking', label: 'Tracking', icon: Eye },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(10,102,194,0.15)', border: '1px solid rgba(10,102,194,0.3)' }}>
            <Linkedin size={16} style={{ color: '#0a66c2' }} />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: '#0a66c2' }}>LINKEDIN OUTREACH</h2>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Templates and tracking</p>
          </div>
        </div>

        {/* LinkedIn Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {linkedInTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveLinkedInTab(tab.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-all"
                style={{
                  backgroundColor: activeLinkedInTab === tab.id ? 'rgba(10,102,194,0.15)' : 'rgba(255,255,255,0.01)',
                  color: activeLinkedInTab === tab.id ? '#0a66c2' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${activeLinkedInTab === tab.id ? 'rgba(10,102,194,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                <Icon size={10} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {activeLinkedInTab === 'connect' && (
            <motion.div key="connect" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <UserPlus size={14} style={{ color: '#0a66c2' }} />
                <h3 className="text-xs font-bold" style={{ color: '#0a66c2' }}>Connection Request Templates</h3>
              </div>
              <div className="space-y-3">
                {LINKEDIN_TEMPLATES.connectionRequest.map(template => (
                  <div key={template.id} className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center justify-between px-3 py-2"
                      style={{ backgroundColor: 'rgba(10,102,194,0.05)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-xs font-medium text-white">{template.name}</span>
                      <CopyButton text={template.message} />
                    </div>
                    <div className="px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {template.message}
                      </p>
                      <p className="text-[9px] mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {template.message.length}/300 characters
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeLinkedInTab === 'sequence' && (
            <motion.div key="sequence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <Repeat size={14} style={{ color: '#00ff88' }} />
                <h3 className="text-xs font-bold" style={{ color: '#00ff88' }}>Follow-Up Sequence Builder</h3>
              </div>
              <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Automated follow-up messages at optimal intervals after connection.
              </p>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-px" style={{ backgroundColor: 'rgba(0,255,136,0.15)' }} />

                <div className="space-y-4">
                  {LINKEDIN_TEMPLATES.followUpSequence.map((step, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                      className="relative pl-10">
                      {/* Timeline dot */}
                      <div className="absolute left-2 top-2 w-5 h-5 rounded-full flex items-center justify-center z-10"
                        style={{ backgroundColor: '#0a0a0f', border: '2px solid #00ff88', boxShadow: '0 0 8px rgba(0,255,136,0.3)' }}>
                        <span className="text-[7px] font-bold" style={{ color: '#00ff88' }}>{step.day}</span>
                      </div>

                      <div className="rounded-xl overflow-hidden"
                        style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="flex items-center justify-between px-3 py-2"
                          style={{ backgroundColor: 'rgba(0,255,136,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div>
                            <span className="text-xs font-medium text-white">{step.name}</span>
                            <span className="text-[9px] ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Day {step.day}</span>
                          </div>
                          <CopyButton text={step.message} />
                        </div>
                        <div className="px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                          <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {step.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeLinkedInTab === 'inmail' && (
            <motion.div key="inmail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <Mail size={14} style={{ color: '#a855f7' }} />
                <h3 className="text-xs font-bold" style={{ color: '#a855f7' }}>InMail Templates</h3>
              </div>
              <div className="space-y-3">
                {LINKEDIN_TEMPLATES.inMailTemplates.map(template => (
                  <div key={template.id} className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center justify-between px-3 py-2"
                      style={{ backgroundColor: 'rgba(168,85,247,0.05)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-xs font-medium text-white">{template.name}</span>
                      <CopyButton text={`Subject: ${template.subject}\n\n${template.message}`} />
                    </div>
                    <div className="px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <p className="text-[10px] font-medium mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Subject: {template.subject}
                      </p>
                      <p className="text-[11px] leading-relaxed whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {template.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={12} style={{ color: '#00ff88' }} />
                  <span className="text-[10px] font-bold" style={{ color: '#00ff88' }}>PRO TIP</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  InMail response rates are 3x higher when you reference a shared connection, recent company news, or engage with their content first.
                </p>
              </div>
            </motion.div>
          )}

          {activeLinkedInTab === 'tracking' && (
            <motion.div key="tracking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <Eye size={14} style={{ color: '#f59e0b' }} />
                <h3 className="text-xs font-bold" style={{ color: '#f59e0b' }}>Profile Visit Tracking</h3>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Profile Views', value: '47', change: '+12 this week' },
                  { label: 'Search Hits', value: '23', change: '+5 this week' },
                  { label: 'Post Views', value: '1.2K', change: '+340 this week' },
                ].map(stat => (
                  <div key={stat.label} className="p-2.5 rounded-lg text-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <p className="text-sm font-bold text-white">{stat.value}</p>
                    <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{stat.label}</p>
                    <p className="text-[8px]" style={{ color: '#00ff88' }}>{stat.change}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} style={{ color: '#00ff88' }} />
                <h3 className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>Recent Visitors</h3>
              </div>

              <div className="space-y-2">
                {LINKEDIN_PROFILE_VISITS.map((visit, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg transition-colors hover:bg-white/[0.02]"
                    style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <Avatar contact={visit.contact} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white">{visit.contact.name}</span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatTime(visit.visitTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{visit.contact.company}</span>
                        {visit.engagement && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(0,255,136,0.1)', color: '#00ff88' }}>
                            {visit.engagement}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.04]"
                      style={{ color: '#0a66c2' }} title="View profile">
                      <ExternalLink size={12} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Community Hub Sidebar
// ---------------------------------------------------------------------------
function CommunityHub({ channels, voiceChannels, members, activeChannel, onChannelChange, pinnedMessages }) {
  const [expandedSections, setExpandedSections] = useState({ text: true, voice: true, members: true, pinned: false });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const onlineMembers = members.filter(m => m.status === 'online');
  const offlineMembers = members.filter(m => m.status !== 'online');

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Server Header */}
      <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00ff88, #00cc6a)', boxShadow: '0 0 12px rgba(0,255,136,0.3)' }}>
              <Zap size={16} style={{ color: '#0a0a0f' }} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">GOATED HQ</h3>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>24 members</span>
            </div>
          </div>
          <button className="p-1 rounded-lg transition-colors hover:bg-white/[0.02]"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Pinned Messages */}
      <div className="px-2 pt-2">
        <button onClick={() => toggleSection('pinned')}
          className="flex items-center gap-1.5 w-full px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded transition-colors hover:bg-white/[0.02]"
          style={{ color: 'rgba(255,255,255,0.35)' }}>
          {expandedSections.pinned ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          <Pin size={10} />
          Pinned ({pinnedMessages.length})
        </button>
        <AnimatePresence>
          {expandedSections.pinned && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              {pinnedMessages.map(msg => (
                <div key={msg.id} className="ml-4 px-2 py-1.5 my-0.5 rounded-md"
                  style={{ backgroundColor: 'rgba(255,255,255,0.01)', borderLeft: '2px solid rgba(0,255,136,0.3)' }}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[10px] font-semibold" style={{ color: '#00ff88' }}>{msg.sender.name}</span>
                    <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{formatTime(msg.time)}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{msg.text}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NeonDivider />

      {/* Text Channels */}
      <div className="px-2">
        <button onClick={() => toggleSection('text')}
          className="flex items-center gap-1.5 w-full px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded transition-colors hover:bg-white/[0.02]"
          style={{ color: 'rgba(255,255,255,0.35)' }}>
          {expandedSections.text ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          Text Channels
        </button>
        <AnimatePresence>
          {expandedSections.text && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-0.5">
              {channels.map(ch => (
                <button key={ch.id} onClick={() => onChannelChange(ch.id)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-all group"
                  style={{
                    backgroundColor: activeChannel === ch.id ? 'rgba(0,255,136,0.1)' : 'transparent',
                    color: activeChannel === ch.id ? 'white' : 'rgba(255,255,255,0.45)',
                  }}>
                  <Hash size={14} style={{ color: activeChannel === ch.id ? '#00ff88' : 'rgba(255,255,255,0.2)' }} />
                  <span className="flex-1 text-left truncate">{ch.name}</span>
                  {ch.unread > 0 && <UnreadBadge count={ch.unread} />}
                  <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/[0.04]"
                    style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <UserPlus size={10} />
                  </button>
                </button>
              ))}
              <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-white/[0.02]"
                style={{ color: 'rgba(255,255,255,0.25)' }}>
                <Plus size={14} />
                <span>Add Channel</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NeonDivider />

      {/* Voice Channels */}
      <div className="px-2">
        <button onClick={() => toggleSection('voice')}
          className="flex items-center gap-1.5 w-full px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded transition-colors hover:bg-white/[0.02]"
          style={{ color: 'rgba(255,255,255,0.35)' }}>
          {expandedSections.voice ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          Voice Channels
        </button>
        <AnimatePresence>
          {expandedSections.voice && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-0.5">
              {voiceChannels.map(vc => (
                <div key={vc.id}>
                  <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-white/[0.02]"
                    style={{ color: 'rgba(255,255,255,0.45)' }}>
                    <Volume2 size={14} style={{ color: vc.members.length > 0 ? '#00ff88' : 'rgba(255,255,255,0.2)' }} />
                    <span className="flex-1 text-left">{vc.name}</span>
                    {vc.members.length > 0 && (
                      <span className="text-[10px]" style={{ color: '#00ff88' }}>{vc.members.length}</span>
                    )}
                  </button>
                  {vc.members.length > 0 && (
                    <div className="ml-7 space-y-0.5">
                      {vc.members.map(m => (
                        <div key={m.id} className="flex items-center gap-1.5 px-1.5 py-0.5 text-[11px]"
                          style={{ color: 'rgba(255,255,255,0.5)' }}>
                          <StatusDot status={m.status} size="xs" />
                          <span>{m.name.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NeonDivider />

      {/* Members */}
      <div className="px-2 flex-1">
        <button onClick={() => toggleSection('members')}
          className="flex items-center gap-1.5 w-full px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded transition-colors hover:bg-white/[0.02]"
          style={{ color: 'rgba(255,255,255,0.35)' }}>
          {expandedSections.members ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          Members &mdash; {members.length}
        </button>
        <AnimatePresence>
          {expandedSections.members && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              {onlineMembers.length > 0 && (
                <div className="mb-2">
                  <p className="text-[9px] uppercase tracking-wider px-2 py-1 font-semibold" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    Online &mdash; {onlineMembers.length}
                  </p>
                  {onlineMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-2 px-2 py-1 rounded-md transition-colors hover:bg-white/[0.02] cursor-pointer">
                      <div className="relative">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold"
                          style={{ backgroundColor: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
                          {m.avatar}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5">
                          <StatusDot status={m.status} size="xs" />
                        </span>
                      </div>
                      <span className="text-[11px] flex-1 truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{m.name}</span>
                      {m.badge && <m.badge size={10} style={{ color: m.role === 'admin' ? '#f59e0b' : '#3b82f6' }} />}
                    </div>
                  ))}
                </div>
              )}
              {offlineMembers.length > 0 && (
                <div>
                  <p className="text-[9px] uppercase tracking-wider px-2 py-1 font-semibold" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    Offline &mdash; {offlineMembers.length}
                  </p>
                  {offlineMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-2 px-2 py-1 rounded-md transition-colors hover:bg-white/[0.02] cursor-pointer opacity-50">
                      <div className="relative">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold"
                          style={{ backgroundColor: 'rgba(255,255,255,0.015)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.02)' }}>
                          {m.avatar}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5">
                          <StatusDot status={m.status} size="xs" />
                        </span>
                      </div>
                      <span className="text-[11px] flex-1 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{m.name}</span>
                      {m.badge && <m.badge size={10} style={{ color: 'rgba(255,255,255,0.2)' }} />}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Navigation Sidebar (far left strip)
// ---------------------------------------------------------------------------
function NavStrip({ activeView, onViewChange, onOpenDialer, unreadTotal }) {
  const navItems = [
    { id: 'inbox', icon: Inbox, label: 'Inbox', badge: unreadTotal },
    { id: 'chat', icon: MessageSquare, label: 'Chat', badge: 27 },
    { id: 'community', icon: Users, label: 'Community', badge: 0 },
    { id: 'calls', icon: Phone, label: 'Calls', badge: 1 },
    { id: 'coach', icon: GraduationCap, label: 'Coach', badge: 0 },
    { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', badge: 0 },
  ];

  return (
    <div className="flex flex-col items-center py-3 px-1.5 gap-1 flex-shrink-0"
      style={{ borderRight: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
      {/* Logo */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 cursor-pointer transition-transform hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #00ff88, #00cc6a)', boxShadow: '0 0 15px rgba(0,255,136,0.25)' }}>
        <Zap size={18} style={{ color: '#0a0a0f' }} />
      </div>

      <NeonDivider />

      {navItems.map(item => (
        <button key={item.id} onClick={() => onViewChange(item.id)}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all group"
          style={{
            backgroundColor: activeView === item.id ? 'rgba(0,255,136,0.15)' : 'transparent',
            border: activeView === item.id ? '1px solid rgba(0,255,136,0.25)' : '1px solid transparent',
          }}
          title={item.label}>
          <item.icon size={18} style={{ color: activeView === item.id ? '#00ff88' : 'rgba(255,255,255,0.4)' }} />
          {item.badge > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[8px] font-bold"
              style={{ backgroundColor: '#00ff88', color: '#0a0a0f' }}>
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
          {/* Tooltip */}
          <span className="absolute left-full ml-2 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
            style={{ backgroundColor: '#1a1a2e', color: 'white', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            {item.label}
          </span>
        </button>
      ))}

      <div className="flex-1" />

      {/* Dialer FAB */}
      <button onClick={onOpenDialer}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #00ff88, #00cc6a)', boxShadow: '0 0 12px rgba(0,255,136,0.2)' }}
        title="Open Dialer">
        <PhoneCall size={16} style={{ color: '#0a0a0f' }} />
      </button>

      <NeonDivider />

      {/* User avatar */}
      <div className="relative mt-1">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer"
          style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.3), rgba(0,255,136,0.1))', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }}>
          TA
        </div>
        <span className="absolute -bottom-0.5 -right-0.5">
          <StatusDot status="online" size="xs" />
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats Bar (top)
// ---------------------------------------------------------------------------
function StatsBar() {
  const stats = [
    { label: 'Unread', value: '23', icon: Mail, color: '#3b82f6', trend: '+5' },
    { label: 'Active Chats', value: '8', icon: MessageSquare, color: '#00ff88', trend: '+2' },
    { label: 'Calls Today', value: '12', icon: Phone, color: '#f59e0b', trend: '+3' },
    { label: 'Response Time', value: '4.2m', icon: Clock, color: '#a855f7', trend: '-1.3m' },
    { label: 'AI Assists', value: '47', icon: Bot, color: '#ec4899', trend: '+12' },
  ];

  return (
    <div className="flex items-center gap-4 px-4 py-2 flex-shrink-0 overflow-x-auto"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
      <div className="flex items-center gap-2 mr-2">
        <h1 className="text-base font-black tracking-wider" style={{ color: '#00ff88', textShadow: '0 0 20px rgba(0,255,136,0.3)' }}>
          COMMS
        </h1>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
          <Wifi size={8} className="inline mr-0.5" />
          LIVE
        </span>
      </div>
      <div className="flex items-center gap-3 flex-1">
        {stats.map(stat => (
          <div key={stat.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.015)' }}>
            <stat.icon size={13} style={{ color: stat.color }} />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-none">{stat.value}</span>
              <span className="text-[9px] leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{stat.label}</span>
            </div>
            <span className="text-[9px] font-medium" style={{ color: stat.trend.startsWith('+') ? '#00ff88' : stat.trend.startsWith('-') ? (stat.label === 'Response Time' ? '#00ff88' : '#ef4444') : 'rgba(255,255,255,0.3)' }}>
              {stat.trend}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <RefreshCw size={14} />
        </button>
        <button className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <Settings size={14} />
        </button>
        <button className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.02]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <Bell size={14} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main CommsPage Component
// ---------------------------------------------------------------------------
export default function CommsPage() {
  const [activeView, setActiveView] = useState('inbox');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [activeChannel, setActiveChannel] = useState('sales');
  const [showDialer, setShowDialer] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showContactPanel, setShowContactPanel] = useState(true);
  const [inboxSearch, setInboxSearch] = useState('');
  const [inboxFilter, setInboxFilter] = useState('all');
  const [pulseKey, setPulseKey] = useState(0);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseKey(k => k + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleConversationSelect = useCallback((conv) => {
    setSelectedConversation(conv);
    setShowContactPanel(true);
  }, []);

  const handleChannelChange = useCallback((channelId) => {
    setActiveChannel(channelId);
    setSelectedConversation(null);
  }, []);

  const totalUnread = INBOX_CONVERSATIONS.reduce((sum, c) => sum + c.unread, 0);

  // Determine which center panel to show based on activeView
  const showInboxOrChat = activeView === 'inbox' || activeView === 'chat' || activeView === 'community' || activeView === 'calls';
  const showCoach = activeView === 'coach';
  const showLinkedIn = activeView === 'linkedin';

  return (
    <div className="flex flex-col w-full" style={{ height: 'calc(100vh - 64px)', backgroundColor: '#0a0a0f', color: 'white' }}>
      {/* Stats Bar */}
      <StatsBar />

      {/* Main Layout */}
      <div className="flex flex-1 min-h-0">
        {/* Nav Strip */}
        <NavStrip
          activeView={activeView}
          onViewChange={setActiveView}
          onOpenDialer={() => setShowDialer(true)}
          unreadTotal={totalUnread}
        />

        {showCoach ? (
          /* Outreach Coach Full Panel */
          <>
            {/* Left: Contacts for coaching */}
            <motion.div
              initial={{ width: 320 }}
              animate={{ width: 320 }}
              className="flex-shrink-0 overflow-hidden"
              style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
              <UnifiedInbox
                conversations={INBOX_CONVERSATIONS}
                selected={selectedConversation}
                onSelect={handleConversationSelect}
                searchQuery={inboxSearch}
                onSearchChange={setInboxSearch}
                filter={inboxFilter}
                onFilterChange={setInboxFilter}
              />
            </motion.div>
            {/* Center: Coach Panel */}
            <div className="flex-1 min-w-0" style={{ backgroundColor: '#0a0a0f' }}>
              <OutreachCoachPanel selectedContact={selectedConversation?.contact || null} />
            </div>
          </>
        ) : showLinkedIn ? (
          /* LinkedIn Outreach Full Panel */
          <>
            {/* Left: Contacts */}
            <motion.div
              initial={{ width: 320 }}
              animate={{ width: 320 }}
              className="flex-shrink-0 overflow-hidden"
              style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
              <UnifiedInbox
                conversations={INBOX_CONVERSATIONS}
                selected={selectedConversation}
                onSelect={handleConversationSelect}
                searchQuery={inboxSearch}
                onSearchChange={setInboxSearch}
                filter={inboxFilter}
                onFilterChange={setInboxFilter}
              />
            </motion.div>
            {/* Center: LinkedIn Panel */}
            <div className="flex-1 min-w-0" style={{ backgroundColor: '#0a0a0f' }}>
              <LinkedInOutreachPanel selectedContact={selectedConversation?.contact || null} />
            </div>
          </>
        ) : (
          /* Default: Inbox/Chat/Community/Calls views */
          <>
            {/* Inbox Panel */}
            <motion.div
              initial={{ width: 320 }}
              animate={{ width: activeView === 'inbox' || activeView === 'chat' ? 320 : 0 }}
              className="flex-shrink-0 overflow-hidden"
              style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
              <UnifiedInbox
                conversations={INBOX_CONVERSATIONS}
                selected={selectedConversation}
                onSelect={handleConversationSelect}
                searchQuery={inboxSearch}
                onSearchChange={setInboxSearch}
                filter={inboxFilter}
                onFilterChange={setInboxFilter}
              />
            </motion.div>

            {/* Center Chat Area */}
            <div className="flex-1 min-w-0" style={{ backgroundColor: '#0a0a0f' }}>
              <ChatArea
                selectedConversation={selectedConversation}
                activeChannel={activeChannel}
                onChannelChange={handleChannelChange}
                messages={CHAT_MESSAGES}
                channels={CHANNELS}
                voiceChannels={VOICE_CHANNELS}
                showCommunity={showCommunity}
                onToggleCommunity={() => setShowCommunity(!showCommunity)}
              />
            </div>

            {/* Right Panel: Contact Details or Community Hub */}
            <AnimatePresence mode="wait">
              {showCommunity ? (
                <motion.div
                  key="community"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 260, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
                  <CommunityHub
                    channels={CHANNELS}
                    voiceChannels={VOICE_CHANNELS}
                    members={COMMUNITY_MEMBERS}
                    activeChannel={activeChannel}
                    onChannelChange={handleChannelChange}
                    pinnedMessages={PINNED_MESSAGES}
                  />
                </motion.div>
              ) : showContactPanel ? (
                <motion.div
                  key="contact"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 300, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
                  <ContactDetailPanel
                    contact={selectedConversation?.contact || null}
                    onClose={() => setShowContactPanel(false)}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* VoIP Dialer Modal */}
      <VoIPDialer isOpen={showDialer} onClose={() => setShowDialer(false)} />

      {/* Floating quick-access bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full z-40"
        style={{ backgroundColor: 'rgba(18,18,26,0.95)', border: '1px solid rgba(255,255,255,0.02)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(0,255,136,0.05)', backdropFilter: 'blur(12px)' }}>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:bg-white/[0.02]"
          style={{ color: 'rgba(255,255,255,0.6)' }}>
          <Bot size={14} style={{ color: '#00ff88' }} />
          AI Compose
        </button>
        <div className="w-px h-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }} />
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:bg-white/[0.02]"
          style={{ color: 'rgba(255,255,255,0.6)' }}>
          <Sparkles size={14} style={{ color: '#f59e0b' }} />
          Smart Reply
        </button>
        <div className="w-px h-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }} />
        <button onClick={() => setShowDialer(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:bg-white/[0.02]"
          style={{ color: 'rgba(255,255,255,0.6)' }}>
          <Phone size={14} style={{ color: '#3b82f6' }} />
          Quick Call
        </button>
        <div className="w-px h-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }} />
        <button onClick={() => setActiveView('coach')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:bg-white/[0.02]"
          style={{ color: 'rgba(255,255,255,0.6)' }}>
          <GraduationCap size={14} style={{ color: '#a855f7' }} />
          Coach
        </button>
        <div className="w-px h-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }} />
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:bg-white/[0.02]"
          style={{ color: 'rgba(255,255,255,0.6)' }}>
          <Search size={14} style={{ color: '#a855f7' }} />
          Search All
        </button>
      </motion.div>
    </div>
  );
}
