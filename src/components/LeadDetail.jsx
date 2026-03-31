import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Phone, Mail, Calendar, Globe, Building2, AlertCircle, Copy, Check,
  TrendingUp, TrendingDown, Minus, Target, Shield, Zap, Star, ChevronRight,
  ChevronDown, Users, DollarSign, Clock, Award, BarChart3, Activity,
  Cpu, Eye, MessageSquare, Send, Package, Calculator, Flame, Crosshair,
  Brain, Radar, Timer, AlertTriangle, Keyboard, ExternalLink, Search, UserSearch,
  Crown, Sparkles, PhoneCall, FileText, CreditCard, Trophy, Rocket, ChevronUp,
  MapPin, Linkedin, Hash, Lightbulb, Swords, TrendingUp as TrendUp2, ArrowRight,
  Volume2, Pause, Square
} from 'lucide-react';
import { useStore, fmt, enrichLead } from '../hooks/useStore';

// ─── Color Maps ────────────────────────────────────────────────────────────────
const priorityColors = {
  critical: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', hex: '#f87171' },
  high: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30', hex: '#facc15' },
  medium: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', hex: '#60a5fa' },
  low: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', hex: '#34d399' },
};
const statusColors = {
  won: 'bg-emerald-500/15 text-emerald-400', lost: 'bg-red-500/15 text-red-400',
  negotiation: 'bg-yellow-500/15 text-yellow-400', proposal: 'bg-purple-500/15 text-purple-400',
  qualified: 'bg-blue-500/15 text-blue-400', contacted: 'bg-cyan-500/15 text-cyan-400',
  new: 'bg-slate-500/15 text-slate-400',
};
const engagementColors = {
  'Very High': '#10b981', 'High': '#34d399', 'Medium': '#facc15', 'Low': '#f87171',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function scoreColor(val) {
  if (val >= 80) return '#10b981';
  if (val >= 60) return '#34d399';
  if (val >= 40) return '#facc15';
  if (val >= 20) return '#fb923c';
  return '#f87171';
}

function severityFor(index) {
  if (index === 0) return { label: 'High', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' };
  if (index === 1) return { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' };
  return { label: 'Low', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' };
}

function signalStrength(index) {
  if (index === 0) return { label: 'Strong', bars: 3 };
  if (index === 1) return { label: 'Moderate', bars: 2 };
  return { label: 'Weak', bars: 1 };
}

// ─── SVG Circular Gauge ────────────────────────────────────────────────────────
function CircularGauge({ value, max = 100, size = 96, strokeWidth = 8, color, label, sublabel }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference * (1 - progress);
  const gaugeColor = color || scoreColor(value);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={gaugeColor} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xl font-bold" style={{ color: gaugeColor }}>{value}</span>
        {sublabel && <span className="text-[10px] text-slate-500">{sublabel}</span>}
      </div>
      {label && <span className="text-xs text-slate-400 mt-1">{label}</span>}
    </div>
  );
}

// ─── Copy Button ───────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const doCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={doCopy} className="p-1.5 rounded-md text-slate-500 hover:text-brand hover:bg-white/[0.02] transition-colors" title="Copy">
      {copied ? <Check size={13} className="text-brand" /> : <Copy size={13} />}
    </button>
  );
}

// ─── Accordion ─────────────────────────────────────────────────────────────────
function Accordion({ title, children, defaultOpen = false, icon }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-white/[0.03] bg-white/[0.02] overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors">
        <span className="flex items-center gap-2 font-semibold text-sm">
          {icon}
          {title}
        </span>
        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 border-t border-white/[0.03]">{children}</div>}
    </div>
  );
}

// ─── Signal Bars ───────────────────────────────────────────────────────────────
function SignalBars({ bars }) {
  return (
    <div className="flex items-end gap-0.5 h-3">
      {[1, 2, 3].map(i => (
        <div key={i} className={`w-1 rounded-sm ${i <= bars ? 'bg-brand' : 'bg-white/[0.04]'}`}
          style={{ height: `${(i / 3) * 100}%` }} />
      ))}
    </div>
  );
}

// ─── Glass Card ────────────────────────────────────────────────────────────────
function GlassCard({ children, className = '', highlight = false }) {
  return (
    <div className={`rounded-2xl border backdrop-blur-sm p-5 ${highlight ? 'border-brand/30 bg-brand/[0.04]' : 'border-white/[0.06] bg-white/[0.02]'} ${className}`}>
      {children}
    </div>
  );
}

// =============================================================================
// AI VOICE BRIEF — Web Speech API powered lead summary reader
// =============================================================================
function VoiceBrief({ lead, el, dv, safeConversion, safePainPoints }) {
  const [voiceState, setVoiceState] = useState('idle'); // idle | playing | paused
  const [briefText, setBriefText] = useState('');
  const utteranceRef = useRef(null);

  const generateBriefText = useCallback(() => {
    const name = lead.name || 'Unknown';
    const company = lead.company || 'Unknown Company';
    const industry = lead.industry || 'Unknown Industry';
    const amount = dv ? `$${dv.toLocaleString()}` : 'Unknown';
    const prob = safeConversion || 0;
    const painPoint = safePainPoints?.[0] || 'scaling challenges';
    const strategy = lead.status === 'negotiation'
      ? 'Push for verbal commitment today with a simplified proposal and urgency-based close.'
      : lead.status === 'qualified'
      ? 'Schedule a tailored demo focusing on their primary pain point and present ROI projections.'
      : lead.status === 'contacted'
      ? 'Send a follow-up referencing your last interaction with a relevant case study.'
      : lead.status === 'won'
      ? 'Request a referral and explore upsell opportunities.'
      : 'Initiate first contact via their preferred channel with a personalized value proposition.';

    return `${name} at ${company}, ${industry}. Deal value ${amount}. Close probability ${prob}%. ${painPoint}. Recommended approach: ${strategy}`;
  }, [lead, el, dv, safeConversion, safePainPoints]);

  const handlePlay = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      alert('Voice synthesis is not supported in this browser.');
      return;
    }

    if (voiceState === 'paused') {
      window.speechSynthesis.resume();
      setVoiceState('playing');
      return;
    }

    // Stop any existing speech
    window.speechSynthesis.cancel();

    const text = generateBriefText();
    setBriefText(text);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to get a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Samantha') || v.name.includes('Google US') || v.name.includes('Alex'));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => setVoiceState('idle');
    utterance.onerror = () => setVoiceState('idle');

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setVoiceState('playing');
  }, [voiceState, generateBriefText]);

  const handlePause = useCallback(() => {
    window.speechSynthesis.pause();
    setVoiceState('paused');
  }, []);

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setVoiceState('idle');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {/* Voice Brief Button + Controls */}
      <div className="flex items-center gap-2">
        {voiceState === 'idle' && (
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/20 text-sm text-cyan-400 hover:bg-cyan-500/25 transition-colors"
          >
            <Volume2 size={14} /> AI Voice Brief
          </button>
        )}
        {voiceState === 'playing' && (
          <>
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/15 border border-yellow-500/20 text-sm text-yellow-400 hover:bg-yellow-500/25 transition-colors"
            >
              <Pause size={14} /> Pause
            </button>
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/20 text-sm text-red-400 hover:bg-red-500/25 transition-colors"
            >
              <Square size={14} /> Stop
            </button>
          </>
        )}
        {voiceState === 'paused' && (
          <>
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand/15 border border-brand/20 text-sm text-brand hover:bg-brand/25 transition-colors"
            >
              <Volume2 size={14} /> Resume
            </button>
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/20 text-sm text-red-400 hover:bg-red-500/25 transition-colors"
            >
              <Square size={14} /> Stop
            </button>
          </>
        )}
      </div>

      {/* Brief Text Card — shown while playing or paused */}
      {(voiceState === 'playing' || voiceState === 'paused') && briefText && (
        <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            {voiceState === 'playing' && (
              <div className="flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1 bg-cyan-400 rounded-full"
                    style={{
                      height: '12px',
                      animation: `pulse 0.8s ${i * 0.15}s ease-in-out infinite alternate`,
                    }}
                  />
                ))}
              </div>
            )}
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
              {voiceState === 'playing' ? 'Reading Brief...' : 'Paused'}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{briefText}</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CLOSE GUIDE TAB — Enhanced linear closing experience
// =============================================================================
function CloseGuideTab({ lead, el, dv, closeSteps, completedSteps, closeConfidence, safeCallScript, safePackages, safeObjections, safeOutreach, safePainPoints, safeConversion, setTab }) {
  const [expandedStep, setExpandedStep] = useState(null);
  const [fastTrackMode, setFastTrackMode] = useState(false);
  const [stepChecks, setStepChecks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('goated_close_checks_' + lead.id) || '{}'); } catch { return {}; }
  });

  // Persist step checks to localStorage
  useEffect(() => {
    try { localStorage.setItem('goated_close_checks_' + lead.id, JSON.stringify(stepChecks)); } catch {}
  }, [stepChecks, lead.id]);

  const commission = Math.round(dv * 0.12);
  const currentStep = closeSteps.find(s => s.status === 'current') || closeSteps[0];
  const currentStepIdx = currentStep ? currentStep.step - 1 : 0;
  const recommendedPkg = safePackages.find(p => p.recommended) || safePackages[1];
  const roiMultiple = recommendedPkg ? ((dv / (recommendedPkg.price * 12)) || 0).toFixed(1) : 0;

  // "What to Say Right Now" scripts per step
  const stepScripts = [
    { script: safeCallScript.opener || `Hi ${(lead.name || '').split(' ')[0]}, I came across ${lead.company} and noticed some interesting opportunities in your space. Do you have 2 minutes?`, label: 'Opening Script' },
    { script: (safeOutreach[0]?.template) || `Subject: Quick idea for ${lead.company}\n\nHi ${(lead.name || '').split(' ')[0]},\n\nI noticed ${lead.company} is growing fast in ${lead.industry}. I had an idea that could accelerate that growth — worth a 15-min chat?\n\nBest,\nGOATED Solutions`, label: 'Outreach Template' },
    { script: `${(lead.name || '').split(' ')[0]}, thanks for taking the time. I've done some research on ${lead.company} and I'm curious — what's your #1 growth challenge right now?\n\n[Listen]\n\nInteresting. A lot of ${lead.industry} companies tell us the same thing. How is that affecting your bottom line?\n\n[Listen]\n\nGot it. What if I could show you how we solve exactly that for companies like yours?`, label: 'Discovery Script' },
    { script: `Based on our conversation, here's what I've put together for ${lead.company}:\n\nPackage: ${safePackages.find(p => p.recommended)?.name || 'Growth'} Plan\nInvestment: ${fmt(safePackages.find(p => p.recommended)?.price || Math.round(dv * 0.025))}/mo\nProjected ROI: ${fmt(Math.round(dv * 0.15))} in the first 90 days\n\nThis includes everything we discussed to solve ${safePainPoints[0]?.toLowerCase() || 'your core challenges'}.`, label: 'Proposal Script' },
    { script: `I completely understand your concern about [objection]. Let me address that directly:\n\n${safeObjections[0]?.response || 'Our ROI typically covers the investment within 90 days.'}\n\nWhat if we did a 30-day pilot so you can see the results firsthand with zero risk?`, label: 'Negotiation Script' },
    { script: `${(lead.name || '').split(' ')[0]}, based on everything we've discussed, it sounds like this is a great fit. Let's get the paperwork started today so we can begin delivering results by next week.\n\nI'll send over the agreement now — it's a simple ${safePackages.find(p => p.recommended)?.name || 'Growth'} plan at ${fmt(safePackages.find(p => p.recommended)?.price || Math.round(dv * 0.025))}/mo. Fair?`, label: 'Closing Script' },
  ];

  // CTA actions per step
  const ctaLabels = ['Open AI Analysis', 'Open Outreach Templates', 'Open Call Script', 'Open Package Pricing', 'Open Objection Handler', 'Open Contract Template'];
  const ctaIcons = [Brain, Send, PhoneCall, Calculator, Shield, CreditCard];
  const ctaActions = [
    () => setTab('intelligence'),
    () => setTab('outreach'),
    () => setTab('scripts'),
    () => setTab('packages'),
    () => setTab('outreach'),
    () => setTab('packages'),
  ];

  // Fast Track steps (compressed 3-step for hot leads)
  const fastTrackSteps = [
    { step: 1, name: 'Power Call', desc: 'Skip research — go straight to a high-energy discovery + pitch call', script: `${(lead.name || '').split(' ')[0]}! I'll be direct — I found something that could add ${fmt(Math.round(dv * 0.15))} to ${lead.company}'s revenue this quarter. Got 10 minutes?` },
    { step: 2, name: 'Power Pitch', desc: 'Combine discovery + proposal into one compelling presentation', script: `Here's what I see: ${lead.company} is losing roughly ${fmt(Math.round(dv * 0.1))}/mo on ${safePainPoints[0]?.toLowerCase() || 'missed opportunities'}. Our ${safePackages.find(p => p.recommended)?.name || 'Growth'} plan fixes that in 30 days. Investment: ${fmt(safePackages.find(p => p.recommended)?.price || Math.round(dv * 0.025))}/mo. ROI: ${fmt(Math.round(dv * 0.15))} in 90 days.` },
    { step: 3, name: 'Power Close', desc: 'Handle objections on the spot and close in the same conversation', script: `${(lead.name || '').split(' ')[0]}, everything we discussed makes sense for ${lead.company}. Let's get started today — I'll send the agreement right now and we'll have you onboarded by end of week. Deal?` },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Guarantee Badge + Game Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
            <Target size={20} className="text-brand" />
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              GOATED Close Guide
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-bold uppercase tracking-wider">
                Status: {lead.status || 'New'}
              </span>
            </h2>
            <p className="text-xs text-slate-500">AI-analyzed step-by-step path to close this deal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-black text-brand">{closeConfidence}%</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Close Probability</div>
          </div>
        </div>
      </div>

      {/* Commission Banner */}
      <div className="p-4 rounded-xl border border-brand/20 bg-brand/[0.03] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign size={20} className="text-brand shrink-0" />
          <div>
            <div className="text-sm font-bold text-brand">Potential Commission</div>
            <p className="text-xs text-slate-400 mt-0.5">
              Based on deal value of {fmt(dv)} at 12% commission rate
            </p>
          </div>
        </div>
        <div className="text-right shrink-0 ml-4">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Your Commission</div>
          <div className="text-xl font-black text-brand">{fmt(commission)}</div>
          <div className="text-[10px] text-slate-500">if you close this deal</div>
        </div>
      </div>

      {/* Fast Track Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Progress: {completedSteps}/{closeSteps.length} steps</span>
          </div>
          <span className="text-brand font-medium text-xs">{Math.round((completedSteps / closeSteps.length) * 100)}% complete</span>
        </div>
        <button onClick={() => setFastTrackMode(!fastTrackMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
            fastTrackMode
              ? 'bg-orange-500/15 border-orange-500/25 text-orange-400'
              : 'bg-white/[0.02] border-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}>
          <Rocket size={14} /> {fastTrackMode ? 'FAST TRACK ON' : 'Fast Track Mode'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-brand to-cyan-400 rounded-full transition-all duration-500"
          style={{ width: `${(completedSteps / closeSteps.length) * 100}%` }} />
      </div>

      {/* ═══ FAST TRACK MODE ═══ */}
      {fastTrackMode && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center gap-2">
            <Rocket size={16} className="text-orange-400" />
            <span className="text-xs font-bold text-orange-400">FAST TRACK MODE — Compressed 3-step close for hot leads</span>
          </div>
          {fastTrackSteps.map((fs, i) => (
            <div key={fs.step} className="rounded-xl border border-orange-500/20 bg-orange-500/[0.03] p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0 text-xs font-bold">
                  {fs.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-orange-400 mb-1">{fs.name}</h3>
                  <p className="text-xs text-slate-400 mb-2">{fs.desc}</p>
                  <div className="p-3 rounded-lg bg-black/30 border border-white/[0.03]">
                    <div className="text-[10px] text-orange-400 uppercase tracking-wider mb-1 font-bold">SAY THIS</div>
                    <p className="text-xs text-slate-300 whitespace-pre-line">{fs.script}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ STANDARD STEP-BY-STEP TIMELINE ═══ */}
      {!fastTrackMode && (
        <div className="space-y-3">
          {closeSteps.map((s, i) => {
            const isExpanded = expandedStep === i || s.status === 'current';
            const CtaIcon = ctaIcons[i] || Brain;
            return (
              <div key={s.step} className={`relative rounded-xl border p-4 transition-all ${
                s.status === 'current' ? 'border-brand/30 bg-brand/[0.04]' :
                s.status === 'done' ? 'border-white/[0.04] bg-white/[0.01]' :
                'border-white/[0.03] bg-white/[0.01] opacity-60'
              }`}>
                <div className="flex items-start gap-3">
                  {/* Step indicator */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    s.status === 'done' ? 'bg-brand text-black' :
                    s.status === 'current' ? 'bg-brand/20 text-brand border border-brand/40' :
                    'bg-white/[0.03] text-slate-600'
                  }`}>
                    {s.status === 'done' ? <Check size={14} /> : s.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-bold ${s.status === 'current' ? 'text-brand' : s.status === 'done' ? 'text-white' : 'text-slate-500'}`}>
                          Step {s.step}: {s.name}
                        </h3>
                        {s.status === 'current' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand/15 text-brand border border-brand/20 font-bold animate-pulse">
                            CURRENT
                          </span>
                        )}
                        {s.status === 'done' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand/10 text-brand font-bold flex items-center gap-1">
                            <Check size={8} /> Done
                          </span>
                        )}
                      </div>
                      <button onClick={() => setExpandedStep(isExpanded && s.status !== 'current' ? null : i)}
                        className="p-1 rounded-md text-slate-500 hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{s.desc}</p>

                    {/* Revenue Impact badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/15 font-medium flex items-center gap-1">
                        <DollarSign size={9} /> {fmt(commission)} commission if closed
                      </span>
                    </div>

                    {/* Expanded content for current/clicked step */}
                    {isExpanded && (
                      <div className="mt-3 space-y-3">
                        {/* Checkpoint */}
                        <div className="p-3 rounded-lg bg-black/30 border border-white/[0.03]">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Checkpoint</div>
                          <p className="text-xs text-slate-300">{s.check}</p>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-2 mb-1">Action Required</div>
                          <p className="text-xs text-brand font-medium">{s.action}</p>
                        </div>

                        {/* What to Say Right Now */}
                        <div className="p-3 rounded-lg bg-brand/[0.04] border border-brand/15">
                          <div className="text-[10px] text-brand uppercase tracking-wider mb-1 font-bold flex items-center gap-1">
                            <MessageSquare size={10} /> What to Say Right Now — {stepScripts[i]?.label}
                          </div>
                          <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{stepScripts[i]?.script}</p>
                        </div>

                        {/* Step completion checkbox */}
                        <label className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] cursor-pointer hover:bg-white/[0.04] transition-colors">
                          <input type="checkbox" checked={!!stepChecks[i]} onChange={() => setStepChecks(prev => ({ ...prev, [i]: !prev[i] }))}
                            className="accent-[#00ff88] w-4 h-4" />
                          <span className="text-xs text-slate-300">{stepChecks[i] ? 'Completed' : 'Mark as completed'}</span>
                        </label>

                        {/* DO THIS NOW CTA */}
                        <button onClick={ctaActions[i]}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand text-black font-bold text-sm hover:bg-brand/90 transition-colors">
                          <CtaIcon size={16} />
                          DO THIS NOW: {ctaLabels[i]}
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Close Progress Summary */}
      <GlassCard className="!p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Target size={16} className="text-brand" />
            Close Progress
          </h3>
          <span className="text-xs text-slate-400">{lead.status || 'New'}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="text-2xl font-black text-brand">{closeConfidence}%</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Close Prob</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="text-2xl font-black text-brand">{completedSteps}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Steps Done</div>
            <div className="mt-1 flex justify-center gap-0.5">
              {closeSteps.map((cs, ci) => (
                <div key={ci} className={`w-3 h-3 rounded-sm ${cs.status === 'done' ? 'bg-brand' : cs.status === 'current' ? 'bg-brand/30 animate-pulse' : 'bg-white/[0.04]'}`} />
              ))}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-brand/[0.04] border border-brand/15">
            <div className="text-2xl font-black text-brand">{fmt(commission)}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Commission</div>
            <div className="text-[9px] text-brand mt-1">if closed at {fmt(dv)}</div>
          </div>
        </div>
      </GlassCard>

      {/* AI Recommendations */}
      <GlassCard highlight>
        <h3 className="text-sm font-bold text-brand mb-3 flex items-center gap-2">
          <Brain size={16} />
          AI Close Recommendations
        </h3>
        <div className="space-y-2 text-xs text-slate-300">
          <p>Based on analysis of {lead.name}'s profile, similar deals, and current pipeline stage:</p>
          <ul className="space-y-1.5 mt-2">
            <li className="flex items-start gap-2">
              <Zap size={12} className="text-brand shrink-0 mt-0.5" />
              <span>Best approach: <strong className="text-white">{el.bestMethod || 'Direct call'}</strong> — leads in {lead.industry} respond {Math.round(15 + lead.score * 0.3)}% better to this channel</span>
            </li>
            <li className="flex items-start gap-2">
              <Timer size={12} className="text-yellow-400 shrink-0 mt-0.5" />
              <span>Optimal timing: <strong className="text-white">{el.decisionTimeline || '1-3 months'}</strong> — act fast, {lead.momentum === 'rising' ? 'momentum is rising' : 'before competitor locks them in'}</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle size={12} className="text-orange-400 shrink-0 mt-0.5" />
              <span>Key risk: <strong className="text-white">{safePainPoints[0]}</strong> — address this in your first interaction to build credibility</span>
            </li>
            <li className="flex items-start gap-2">
              <DollarSign size={12} className="text-brand shrink-0 mt-0.5" />
              <span>Expected deal range: <strong className="text-white">{fmt(Math.round(dv * 0.8))} — {fmt(Math.round(dv * 1.2))}</strong> based on company size and industry benchmarks</span>
            </li>
          </ul>
        </div>
      </GlassCard>

      {/* ═══ Pain-Point-Based Close Ranking ═══ */}
      <GlassCard>
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Target size={16} className="text-cyan-400" />
          Pain-Point Close Ranking
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase">Ranked by Close Probability</span>
        </h3>
        <div className="space-y-3">
          {(() => {
            const painCloseData = safePainPoints.map((pain, i) => {
              const baseProb = Math.max(25, safeConversion - i * 12);
              const entryPoints = {
                'Technology': ['CTO/VP Engineering technical review', 'IT infrastructure audit proposal', 'Developer productivity assessment'],
                'Healthcare': ['Compliance gap analysis offer', 'Patient outcome improvement study', 'Operational efficiency benchmark'],
                'Finance': ['Risk assessment walkthrough', 'Regulatory readiness scorecard', 'Portfolio optimization demo'],
                'Real Estate': ['Market analytics deep-dive', 'Lead conversion optimization', 'Comparable analysis tool demo'],
                'Manufacturing': ['Supply chain efficiency audit', 'Quality metrics benchmark', 'Automation ROI calculator'],
              };
              const industryEntries = entryPoints[lead.industry] || ['Business impact assessment', 'Industry benchmark comparison', 'ROI discovery session'];
              return {
                pain,
                closeProb: baseProb,
                revenueImpact: Math.round(dv * (0.25 - i * 0.06)),
                entryPoint: industryEntries[i] || industryEntries[0],
                urgency: i === 0 ? 'Immediate' : i === 1 ? 'This week' : 'This month',
              };
            }).sort((a, b) => b.closeProb - a.closeProb);

            return painCloseData.map((item, i) => (
              <div key={i} className={`p-4 rounded-xl border ${i === 0 ? 'border-brand/25 bg-brand/[0.04]' : 'border-white/[0.04] bg-white/[0.01]'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-brand/20 text-brand' : i === 1 ? 'bg-cyan-500/15 text-cyan-400' : 'bg-white/[0.04] text-slate-500'}`}>
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{item.pain}</div>
                      <div className="text-[10px] text-slate-500">Revenue impact: <span className="text-red-400 font-medium">{fmt(item.revenueImpact)}/yr lost</span></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: scoreColor(item.closeProb) }}>{item.closeProb}%</div>
                    <div className="text-[10px] text-slate-500">Close prob.</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                    <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold mb-0.5">Entry Point</div>
                    <div className="text-xs text-slate-300">{item.entryPoint}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                    <div className="text-[10px] text-orange-400 uppercase tracking-wider font-bold mb-0.5">Urgency</div>
                    <div className="text-xs text-slate-300">{item.urgency}</div>
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </GlassCard>

      {/* Competitive Positioning */}
      <GlassCard>
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Crosshair size={16} className="text-red-400" />
          Competitive Positioning
        </h3>
        <div className="space-y-3">
          {lead.competitorUsing && (
            <div className="p-3 rounded-lg bg-red-500/[0.04] border border-red-500/10">
              <div className="text-[10px] text-red-400 uppercase tracking-wider font-bold mb-1">Currently Using</div>
              <div className="text-sm text-white font-medium">{lead.competitorUsing}</div>
              <div className="text-xs text-slate-400 mt-1">Displacement strategy: Lead with {safePainPoints[0]?.toLowerCase() || 'efficiency gains'} — their current solution likely falls short here.</div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { label: 'Our Advantage', items: ['AI-powered intelligence', `${lead.industry}-specific playbooks`, `${roiMultiple}x projected ROI`], color: 'brand' },
              { label: 'Their Weakness', items: ['Generic one-size-fits-all', 'No industry specialization', 'Slower time-to-value'], color: 'red-400' },
              { label: 'Switching Triggers', items: ['Contract renewal window', `${safePainPoints[0]} worsening`, 'New budget cycle'], color: 'yellow-400' },
            ].map((col, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className={`text-[10px] text-${col.color} uppercase tracking-wider font-bold mb-2`}>{col.label}</div>
                <div className="space-y-1.5">
                  {col.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-1.5 text-xs text-slate-300">
                      <div className={`w-1.5 h-1.5 rounded-full bg-${col.color}`} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Next Best Action */}
      <div className="p-5 rounded-2xl border-2 border-brand/30 bg-brand/[0.06] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
              <Zap size={20} className="text-brand" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand flex items-center gap-2">
                Next Best Action
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand/15 text-brand border border-brand/25 font-bold uppercase animate-pulse">DO THIS NOW</span>
              </h3>
              <p className="text-[10px] text-slate-500">AI-recommended action based on current deal stage</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-black/30 border border-brand/15">
            <p className="text-sm text-slate-200 leading-relaxed">
              {currentStep && currentStep.step === 1 && `Complete your research on ${lead.company}. Review the AI Executive Summary and Pain Point analysis above, then prepare a personalized ${el.bestMethod || 'outreach'} message targeting "${safePainPoints[0]}". Move to Initial Outreach within 24 hours.`}
              {currentStep && currentStep.step === 2 && `Send your initial outreach via ${el.bestMethod || 'email'} today. Use the AI-generated scripts from the Outreach tab. Reference "${safePainPoints[0]}" in your opener. Set a 48-hour follow-up reminder.`}
              {currentStep && currentStep.step === 3 && `Schedule and conduct your discovery call with ${lead.name}. Focus on confirming pain points (${safePainPoints.slice(0, 2).join(', ')}), verifying budget authority, and establishing their timeline. Use AI coaching mode for real-time objection handling.`}
              {currentStep && currentStep.step === 4 && `Prepare and send the ${safePackages.find(p => p.recommended)?.name || 'Growth'} proposal at ${fmt(safePackages.find(p => p.recommended)?.price || Math.round(dv * 0.025))}/mo. Include custom ROI projections showing ${roiMultiple}x return. Schedule a follow-up within 3 days.`}
              {currentStep && currentStep.step === 5 && `${lead.name} is in negotiation. Lead with the industry objection handlers above. If budget is the concern, offer the 30-day pilot. Target closing this week — momentum is ${lead.momentum}.`}
              {currentStep && currentStep.step === 6 && `Finalize the contract with ${lead.name} at ${fmt(dv)}. Process payment, set up onboarding, and send a welcome sequence. Your commission: ${fmt(Math.round(dv * 0.12))}.`}
              {!currentStep && `Review the intelligence dashboard and prepare a personalized outreach strategy for ${lead.name}.`}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => {
              if (currentStep) {
                const ctaIdx = currentStep.step - 1;
                if (ctaActions[ctaIdx]) ctaActions[ctaIdx]();
              }
            }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-black font-bold text-sm hover:bg-brand/90 transition-colors">
              <Zap size={14} /> Take Action Now
            </button>
            <span className="text-[10px] text-slate-500">
              Est. time to complete: {currentStep && currentStep.step <= 2 ? '15 min' : currentStep && currentStep.step <= 4 ? '30 min' : '1 hour'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function LeadDetail() {
  const { selectedLead: lead, setDetailOpen, setSelectedLead, previousPage, setPreviousPage, setPage, degenMode, getLeadAlpha } = useStore();
  const [tab, setTab] = useState('intelligence');
  const [coachingOutput, setCoachingOutput] = useState(null);
  const [coachingLoading, setCoachingLoading] = useState(false);

  const goBack = () => {
    setDetailOpen(false);
    setSelectedLead(null);
    if (previousPage) {
      setPage(previousPage);
      setPreviousPage(null);
    }
  };

  if (!lead) return null;

  // Auto-enrich lead with expensive fields (callScript, packages, etc.) if not already done
  // This is the Tier 2 lazy enrichment — only runs when lead detail is viewed
  const enrichedLead = lead._enriched === false ? enrichLead(lead) : lead;
  // Use enriched version for all field access below (but keep `lead` reference for store ops)
  const el = enrichedLead || lead;

  // Safe defaults for fields that API/Apollo leads may be missing
  const dv = el.dealValue || el.value || 10000;
  const safeCallScript = el.callScript || {
    opener: `Hi ${(lead.name || '').split(' ')[0]}, I came across ${lead.company || 'your company'} and wanted to connect.`,
    discovery: ['What are your current growth challenges?', 'How are you handling lead management today?'],
    pitch: `We help companies like ${lead.company || 'yours'} accelerate their pipeline and close deals faster.`,
    close: 'Would it make sense to schedule a quick call to explore this further?',
    valueProps: ['Pipeline acceleration', 'Automated lead scoring', 'Revenue intelligence'],
  };
  const safePackages = el.packages || [
    { name: 'Starter', price: Math.round(dv * 0.01), features: ['Core CRM', 'Email automation', 'Basic reporting'], recommended: false },
    { name: 'Growth', price: Math.round(dv * 0.025), features: ['Core CRM', 'Email automation', 'Advanced reporting', 'AI lead scoring', 'Custom integrations'], recommended: true },
    { name: 'Enterprise', price: Math.round(dv * 0.05), features: ['Everything in Growth', 'Dedicated CSM', 'Custom API', 'SLA guarantees', 'White-glove onboarding'], recommended: false },
  ];
  const safeObjections = el.objections || [
    { objection: 'Budget constraints', response: 'Our ROI typically covers the investment within 90 days. We can start with a pilot.' },
    { objection: 'Already have a solution', response: 'Many of our best customers switched from existing tools. We can run a side-by-side comparison.' },
    { objection: 'Need to involve more people', response: 'Absolutely — we can set up a group demo tailored to each stakeholder\'s priorities.' },
  ];
  const safeOutreach = el.outreach || [
    { type: 'Cold Email', template: `Subject: Quick question about ${lead.company || 'your company'}\n\nHi ${(lead.name || '').split(' ')[0]},\n\nI came across ${lead.company || 'your company'} and had a quick idea to share. Worth a 15-min call?\n\nBest,\nGoated Solutions` },
    { type: 'LinkedIn DM', template: `Hi ${(lead.name || '').split(' ')[0]}, saw your work at ${lead.company || 'your company'} — would love to connect.` },
    { type: 'Follow-up', template: `Hi ${(lead.name || '').split(' ')[0]}, following up on my note. Would love to share how we help ${lead.industry || 'companies'} teams grow faster.` },
  ];
  const safeRanking = el.ranking || { overall: 50, byIndustry: 5, byPriority: 10, engagement: 'Medium', fitScore: 50, intentScore: 50 };
  const safeConversion = el.conversionProbability || Math.round((el.score || 50) * 0.6);
  const safePainPoints = el.painPoints || lead.painPoints || ['Scaling challenges', 'Revenue growth', 'Operational efficiency'];
  const safeBuyingSignals = el.buyingSignals || lead.buyingSignals || [];

  const pc = priorityColors[lead.priority] || priorityColors.medium;

  // Degen Alpha Intel — per-lead intelligence (only computed when degen mode is on)
  const alphaIntel = degenMode ? getLeadAlpha(el) : null;

  // ── GOATED Close Guide — step-by-step closing system ──────────────────────
  const closeSteps = [
    { step: 1, name: 'Research & Prep', status: lead.status === 'new' ? 'current' : 'done', desc: 'AI deep research on company, pain points, decision makers, and competitive landscape', check: 'Review AI Executive Summary above', action: 'Read the full intelligence report and pain point analysis' },
    { step: 2, name: 'Initial Outreach', status: ['new', 'contacted'].includes(lead.status) && lead.status !== 'new' ? 'current' : lead.status === 'new' ? 'pending' : 'done', desc: 'Multi-channel first touch — personalized based on AI analysis of best method', check: `Use ${el.bestMethod || 'email'} as primary channel`, action: 'Send personalized outreach using AI-generated scripts' },
    { step: 3, name: 'Discovery Call', status: lead.status === 'qualified' ? 'current' : ['new', 'contacted'].includes(lead.status) ? 'pending' : 'done', desc: 'Guided discovery with real-time AI coaching and objection handling', check: 'Confirm pain points and budget authority', action: 'Schedule and conduct discovery call with AI coaching enabled' },
    { step: 4, name: 'Value Demonstration', status: lead.status === 'proposal' ? 'current' : ['new', 'contacted', 'qualified'].includes(lead.status) ? 'pending' : 'done', desc: 'Custom proposal with ROI projections tailored to their specific pain points', check: 'Present personalized packages from Packages tab', action: 'Send proposal with custom pricing and ROI analysis' },
    { step: 5, name: 'Negotiation', status: lead.status === 'negotiation' ? 'current' : lead.status === 'won' ? 'done' : 'pending', desc: 'AI-powered negotiation support with real-time battle cards and competitor displacement strategies', check: 'Handle objections using AI battle cards', action: 'Navigate objections and align on terms' },
    { step: 6, name: 'Close & Onboard', status: lead.status === 'won' ? 'done' : 'pending', desc: 'Secure commitment, process payment, and begin onboarding sequence', check: 'Confirm deal value and payment terms', action: 'Close the deal and initiate client onboarding' },
  ];

  const completedSteps = closeSteps.filter(s => s.status === 'done').length;
  const closeConfidence = Math.min(98, safeConversion + (completedSteps * 8));

  const tabs = [
    { id: 'intelligence', label: 'Intelligence', icon: <BarChart3 size={15} /> },
    { id: 'closing', label: 'Close Guide', icon: <Target size={15} /> },
    ...(degenMode ? [{ id: 'alpha', label: 'Alpha Intel', icon: <Radar size={15} /> }] : []),
    { id: 'scripts', label: 'Scripts & Plays', icon: <Phone size={15} /> },
    { id: 'outreach', label: 'AI Coach', icon: <Brain size={15} /> },
    { id: 'packages', label: 'Packages & Pricing', icon: <Package size={15} /> },
    { id: 'activity', label: 'Activity', icon: <Activity size={15} /> },
  ];

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  const [showKeybindHint, setShowKeybindHint] = useState(true);
  const [voipConfirm, setVoipConfirm] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture keys when typing in inputs/textareas
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

      const currentIndex = tabs.findIndex(t => t.id === tab);

      // Number keys 1-7 switch tabs
      if (e.key >= '1' && e.key <= String(tabs.length)) {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (idx < tabs.length) setTab(tabs[idx].id);
        return;
      }

      // Arrow keys for prev/next tab
      if (e.key === 'ArrowLeft' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const prev = (currentIndex - 1 + tabs.length) % tabs.length;
        setTab(tabs[prev].id);
        return;
      }
      if (e.key === 'ArrowRight' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const next = (currentIndex + 1) % tabs.length;
        setTab(tabs[next].id);
        return;
      }

      // Escape to close
      if (e.key === 'Escape') {
        if (voipConfirm) {
          setVoipConfirm(false);
        } else {
          e.preventDefault();
          goBack();
        }
        return;
      }

      // V = VoIP call (with confirmation)
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        if (voipConfirm) {
          // Second press — trigger the call
          setVoipConfirm(false);
          // Trigger click on the Call button
          const callBtn = document.querySelector('[data-action="voip-call"]');
          if (callBtn) callBtn.click();
        } else {
          setVoipConfirm(true);
          setTimeout(() => setVoipConfirm(false), 3000);
        }
        return;
      }

      // O = open outreach / AI Coach tab
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        setTab('outreach');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tab, tabs, voipConfirm]);

  // Generate ranked approaches from the single callScript
  const approaches = [
    {
      rank: 1,
      name: 'Direct Value Approach',
      confidence: Math.min(95, (lead.score || 50) + 10),
      successRate: Math.min(88, safeConversion + 15),
      script: safeCallScript,
    },
    {
      rank: 2,
      name: 'Consultative Discovery',
      confidence: Math.min(85, lead.score || 50),
      successRate: Math.min(75, safeConversion + 5),
      script: {
        opener: `Hi ${lead.name.split(' ')[0]}, I've been researching ${lead.company}'s position in the ${lead.industry} space. I had a few thoughts I'd love your perspective on.`,
        discovery: safeCallScript.discovery.slice(0, 2),
        pitch: `Based on patterns we've seen across ${lead.industry}, companies with ${(lead.employees || 50).toLocaleString()}+ employees typically leave 30-40% of revenue on the table with manual processes. We've built a system to fix that.`,
        close: `Would it make sense to set up a working session where we map out exactly where the gaps are? I can bring benchmarks from similar companies.`,
        valueProps: safeCallScript.valueProps,
      },
    },
    {
      rank: 3,
      name: 'Social Proof Approach',
      confidence: Math.min(75, (lead.score || 50) - 5),
      successRate: Math.min(65, safeConversion - 5),
      script: {
        opener: `Hi ${lead.name.split(' ')[0]}, [mutual connection/event reference]. I just helped a ${lead.industry} company solve exactly the kind of challenge you might be facing with ${safePainPoints[0]?.toLowerCase() || 'growth'}.`,
        discovery: [safeCallScript.discovery[0]],
        pitch: `We recently helped a company in ${lead.industry} increase their pipeline by 4x in 60 days. Happy to share the exact playbook if relevant.`,
        close: `I can send over the case study with specific numbers. If it resonates, we can chat more. Fair?`,
        valueProps: safeCallScript.valueProps,
      },
    },
  ];

  // ROI calculations
  const recommendedPkg = safePackages.find(p => p.recommended) || safePackages[1];
  const roiMultiple = recommendedPkg ? ((dv / (recommendedPkg.price * 12)) || 0).toFixed(1) : 0;

  // ─── Momentum Icon ──────────────────────────────────────────────────────────
  const MomentumIcon = lead.momentum === 'rising' ? TrendingUp : lead.momentum === 'declining' ? TrendingDown : Minus;
  const momentumColor = lead.momentum === 'rising' ? 'text-emerald-400' : lead.momentum === 'declining' ? 'text-red-400' : 'text-yellow-400';
  const momentumBg = lead.momentum === 'rising' ? 'bg-emerald-500/10' : lead.momentum === 'declining' ? 'bg-red-500/10' : 'bg-yellow-500/10';

  return (
    <div className="min-h-screen pb-12">
      {/* ═══════════════════════════════════════════════════════════════════════
          STICKY HEADER
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-surface-0/80 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button onClick={goBack}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.02] transition-colors">
                <ArrowLeft size={16} /> Back
              </button>
              <div className="h-5 w-px bg-white/[0.04]" />
              <span className="text-sm font-medium text-white truncate max-w-[200px]">{lead.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${pc.bg} ${pc.text} border ${pc.border}`}>
                {lead.priority}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a href={`tel:${(lead.phone || '').replace(/[^+\d]/g, '')}`} data-action="voip-call"
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-brand text-black font-medium text-sm hover:bg-brand/90 transition-colors cursor-pointer"
                onClick={(e) => { if (!lead.phone) { e.preventDefault(); alert('No phone number available for this lead.'); } }}>
                <Phone size={14} /> Call {lead.phone ? lead.phone : ''}
              </a>
              <button onClick={() => {
                const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(10, 0, 0, 0);
                const end = new Date(start); end.setMinutes(30);
                const title = encodeURIComponent(`Call with ${lead.name} — ${lead.company}`);
                const details = encodeURIComponent(`Lead: ${lead.name}\nCompany: ${lead.company}\nPhone: ${lead.phone || 'N/A'}\nEmail: ${lead.email}\nDeal: $${(lead.dealValue || 0).toLocaleString()}\n\nGenerated by GOATED`);
                const fmt2 = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt2(start)}/${fmt2(end)}&details=${details}`, '_blank');
              }} className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-sm hover:bg-white/[0.04] transition-colors">
                <Calendar size={14} /> Schedule
              </button>
              <button onClick={() => setTab('outreach')} className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/20 text-sm text-purple-400 hover:bg-purple-500/25 transition-colors">
                <Brain size={14} /> AI Coach
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          AI VOICE BRIEF BAR
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3">
        <VoiceBrief lead={lead} el={el} dv={dv} safeConversion={safeConversion} safePainPoints={safePainPoints} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.08] via-transparent to-cyan-500/[0.04]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar + Score Ring */}
            <div className="relative">
              <svg width={100} height={100} className="-rotate-90">
                <circle cx={50} cy={50} r={44} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
                <circle cx={50} cy={50} r={44} fill="none" stroke={scoreColor(lead.score)} strokeWidth={6}
                  strokeLinecap="round" strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 * (1 - lead.score / 100)}
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-xl bg-brand/15 flex items-center justify-center text-brand font-bold text-lg">
                  {lead.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
            </div>

            {/* Lead Info */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{lead.name}</h1>
              <p className="text-slate-400 mt-1">{lead.title} at <span className="text-white font-medium">{lead.company}</span></p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${pc.bg} ${pc.text} border ${pc.border}`}>
                  {lead.priority}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[lead.status]}`}>
                  {lead.status}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand/15 text-brand border border-brand/20">
                  Rank #{safeRanking.overall}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${momentumBg} ${momentumColor} flex items-center gap-1`}>
                  <MomentumIcon size={12} /> {lead.momentum}
                </span>
              </div>
            </div>

            {/* Key Metrics Row */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand">{lead.score}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Score</div>
              </div>
              <div className="h-10 w-px bg-white/[0.04]" />
              <div className="text-center">
                <div className="text-2xl font-bold">{fmt(dv)}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Deal Value</div>
              </div>
              <div className="h-10 w-px bg-white/[0.04]" />
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{safeConversion}%</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Conversion</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          AI EXECUTIVE SUMMARY
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="rounded-xl border border-brand/10 bg-brand/[0.02] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand/15 flex items-center justify-center shrink-0 mt-0.5">
              <Brain size={16} className="text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-bold text-brand">AI Executive Summary</h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-semibold">AUTO-GENERATED</span>
              </div>
              <p className="text-[13px] leading-relaxed text-slate-300">
                <span className="text-white font-medium">{lead.name}</span> is {lead.title} at{' '}
                <span className="text-white font-medium">{lead.company}</span>, a {lead.industry} company{' '}
                {el.employees ? `with approximately ${el.employees.toLocaleString()} employees` : 'operating in the mid-market segment'}.{' '}
                The business has an estimated annual revenue of{' '}
                <span className="text-brand font-medium">{fmt(dv * (8 + (lead.score % 7)))}</span>{' '}
                with projected profit margins of {12 + (lead.score % 18)}%.{' '}
                {safePainPoints.length > 0 && (
                  <>Key vulnerability areas include {safePainPoints.slice(0, 2).map(p => p.toLowerCase()).join(' and ')}, {' '}
                  which represent significant revenue leakage estimated at {fmt(dv * 0.15)} to {fmt(dv * 0.35)} annually. </>
                )}
                {safeBuyingSignals.length > 0 && (
                  <>Active buying signals — {safeBuyingSignals.slice(0, 2).join(', ').toLowerCase()} — indicate {' '}
                  a <span className="text-brand font-medium">{safeConversion}% conversion probability</span>.{' '}</>
                )}
                Our analysis suggests a potential deposit/engagement value of{' '}
                <span className="text-white font-medium">{fmt(Math.round(dv * 0.08))} to {fmt(Math.round(dv * 0.25))}</span>{' '}
                based on deal structure, with a recommended approach via{' '}
                <span className="text-white font-medium">{el.bestMethod || 'direct outreach'}</span>{' '}
                targeting a {el.decisionTimeline || '1-3 month'} close window.{' '}
                {lead.competitorUsing && <>Currently using <span className="text-yellow-400">{lead.competitorUsing}</span>, presenting a displacement opportunity. </>}
                Priority classification: <span className="font-medium" style={{ color: pc.hex }}>{lead.priority?.toUpperCase()}</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CONTACT INTEL + OUTREACH ACTIONS
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
        {/* Contact Intel Section — PROMINENT */}
        <div className="rounded-2xl border-2 border-cyan-500/25 bg-gradient-to-br from-cyan-500/[0.04] to-blue-500/[0.02] p-5 sm:p-6 mb-4 shadow-lg shadow-cyan-500/5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <UserSearch size={20} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-cyan-400">Contact Intel</h3>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Verified & enriched contact data</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 font-bold uppercase tracking-wider">Enriched</span>
            </div>
          </div>

          {/* Primary Contact Cards — Large & Prominent */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Phone - PRIMARY CTA */}
            <a href={lead.phone ? `tel:${(lead.phone || '').replace(/[^+\d]/g, '')}` : '#'}
              onClick={(e) => { if (!lead.phone) e.preventDefault(); }}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all group ${lead.phone ? 'bg-emerald-500/[0.08] border-emerald-500/25 hover:bg-emerald-500/15 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10' : 'bg-white/[0.01] border-white/[0.04] opacity-50'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${lead.phone ? 'bg-emerald-500/20' : 'bg-white/[0.04]'}`}>
                <PhoneCall size={22} className={lead.phone ? 'text-emerald-400' : 'text-slate-600'} />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${lead.phone ? 'text-emerald-400' : 'text-slate-500'}`}>Phone</div>
                <div className="text-lg font-mono font-bold text-white truncate">{lead.phone || 'No number'}</div>
              </div>
              {lead.phone && <CopyBtn text={lead.phone} />}
            </a>
            {/* Email */}
            <a href={`mailto:${lead.email}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-purple-500/[0.08] border-2 border-purple-500/25 hover:bg-purple-500/15 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                <Mail size={22} className="text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-purple-400 uppercase tracking-wider font-bold mb-1">Email</div>
                <div className="text-base font-medium text-white truncate group-hover:text-purple-300 transition-colors">{lead.email}</div>
              </div>
              <CopyBtn text={lead.email} />
            </a>
            {/* LinkedIn */}
            <a href={lead.linkedin_url || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(lead.name + ' ' + lead.company)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl bg-blue-500/[0.08] border-2 border-blue-500/25 hover:bg-blue-500/15 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Linkedin size={22} className="text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-blue-400 uppercase tracking-wider font-bold mb-1">LinkedIn</div>
                <div className="text-base font-medium text-white truncate group-hover:text-blue-300 transition-colors">{lead.name}</div>
                {lead.linkedin_company_url && <div className="text-[10px] text-blue-400/60 truncate">{lead.linkedin_company_url}</div>}
              </div>
              <ExternalLink size={14} className="text-blue-400/50 shrink-0" />
            </a>
          </div>

          {/* Secondary Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Company Website */}
            <a href={lead.website?.startsWith('http') ? lead.website : `https://${lead.website}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-brand/[0.06] border border-brand/15 hover:bg-brand/10 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center shrink-0">
                <Globe size={16} className="text-brand" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-brand uppercase tracking-wider font-semibold">Company Website</div>
                <div className="text-sm text-white truncate group-hover:text-brand transition-colors">{lead.website || lead.company}</div>
              </div>
              <ExternalLink size={12} className="text-brand/50 ml-auto shrink-0" />
            </a>
            {/* Location */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/[0.06] border border-orange-500/15">
              <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-orange-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-orange-400 uppercase tracking-wider font-semibold">Location</div>
                <div className="text-sm text-white truncate">{lead.location || 'Location unknown'}</div>
              </div>
            </div>
            {/* People Search */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <a href={`https://www.truepeoplesearch.com/results?name=${encodeURIComponent(lead.name)}&citystatezip=${encodeURIComponent(lead.location || '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors">
                <Search size={12} /> People Search
              </a>
              <a href={`https://www.whitepages.com/name/${encodeURIComponent(lead.name)}/${encodeURIComponent((lead.location || '').split(',').pop()?.trim() || '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-500/10 text-slate-300 text-xs font-semibold hover:bg-slate-500/20 transition-colors">
                <Search size={12} /> Whitepages
              </a>
            </div>
          </div>
        </div>

        {/* Outreach Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Send LinkedIn Connection */}
          <button onClick={() => {
            const msg = `Hi ${(lead.name || '').split(' ')[0]}, I came across your profile and was impressed by your work at ${lead.company}. I'd love to connect and share some ideas about ${safePainPoints[0]?.toLowerCase() || 'growth opportunities'} in ${lead.industry}. Looking forward to connecting!`;
            navigator.clipboard.writeText(msg);
            alert('LinkedIn connection request copied to clipboard!');
          }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-500/[0.06] border border-blue-500/15 hover:bg-blue-500/10 transition-colors group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Send size={18} className="text-blue-400" />
            </div>
            <span className="text-xs font-semibold text-blue-400">LinkedIn Connect</span>
            <span className="text-[10px] text-slate-500">Copy request message</span>
          </button>
          {/* Draft Cold Email */}
          <button onClick={() => {
            const emailBody = `Subject: Quick idea for ${lead.company}\n\nHi ${(lead.name || '').split(' ')[0]},\n\nI've been following ${lead.company}'s growth in the ${lead.industry} space, and I noticed you might be dealing with ${safePainPoints[0]?.toLowerCase() || 'scaling challenges'}.\n\nWe've helped similar ${lead.industry} companies solve this exact problem, generating an average of ${fmt(Math.round(dv * 0.15))} in additional revenue within 90 days.\n\nWould you be open to a quick 15-minute call this week to see if there's a fit?\n\nBest regards`;
            navigator.clipboard.writeText(emailBody);
            alert('Cold email template copied to clipboard!');
          }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-500/[0.06] border border-purple-500/15 hover:bg-purple-500/10 transition-colors group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail size={18} className="text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-purple-400">Draft Cold Email</span>
            <span className="text-[10px] text-slate-500">Copy email template</span>
          </button>
          {/* Call Script */}
          <button onClick={() => {
            const script = `CALL SCRIPT — ${lead.name} (${lead.company})\n\n[OPENER]\n"${safeCallScript.opener}"\n\n[DISCOVERY]\n${safeCallScript.discovery.map((q, i) => `Q${i+1}: "${q}"`).join('\n')}\n\n[PITCH]\n"${safeCallScript.pitch}"\n\n[CLOSE]\n"${safeCallScript.close}"\n\n[KEY PAIN POINTS TO ADDRESS]\n${safePainPoints.map((p, i) => `${i+1}. ${p}`).join('\n')}`;
            navigator.clipboard.writeText(script);
            alert('Call script copied to clipboard!');
          }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 hover:bg-emerald-500/10 transition-colors group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PhoneCall size={18} className="text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-emerald-400">Call Script</span>
            <span className="text-[10px] text-slate-500">Copy full script</span>
          </button>
          {/* SMS Template */}
          <button onClick={() => {
            const sms = `Hi ${(lead.name || '').split(' ')[0]}, this is [Your Name] from GOATED Solutions. I had a quick idea about how ${lead.company} could tackle ${safePainPoints[0]?.toLowerCase() || 'growth'}. Worth a 5-min chat? Let me know a good time.`;
            navigator.clipboard.writeText(sms);
            alert('SMS template copied to clipboard!');
          }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-yellow-500/[0.06] border border-yellow-500/15 hover:bg-yellow-500/10 transition-colors group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare size={18} className="text-yellow-400" />
            </div>
            <span className="text-xs font-semibold text-yellow-400">SMS Template</span>
            <span className="text-[10px] text-slate-500">Copy text message</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          OUTREACH SEQUENCE BUILDER
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.02] p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Send size={16} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-purple-400">Outreach Sequence</h3>
              <span className="text-[10px] text-slate-500">Multi-step automated cadence for {lead.name}</span>
            </div>
          </div>
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-[19px] top-8 bottom-4 w-0.5 bg-purple-500/15" />
            <div className="space-y-4">
              {[
                { day: 1, channel: 'LinkedIn', action: 'Send Connection Request', icon: Linkedin, color: 'blue',
                  detail: `"Hi ${(lead.name || '').split(' ')[0]}, I came across ${lead.company} and was impressed by your work in ${lead.industry}. Would love to connect and exchange ideas."` },
                { day: 3, channel: 'Cold Email', action: 'Personalized Email', icon: Mail, color: 'purple',
                  detail: `Subject: Quick idea for ${lead.company}\n\nHi ${(lead.name || '').split(' ')[0]}, I work with ${lead.industry} companies facing ${safePainPoints[0]?.toLowerCase() || 'growth challenges'}. Worth a 15-min chat?` },
                { day: 5, channel: 'Follow-up Email', action: 'Value-Add Follow-up', icon: Mail, color: 'cyan',
                  detail: `Hi ${(lead.name || '').split(' ')[0]}, sharing a case study of how we helped a similar ${lead.industry} company generate ${fmt(Math.round(dv * 0.15))} in 90 days. Thought it might be relevant.` },
                { day: 7, channel: 'Phone Call', action: 'Direct Call', icon: PhoneCall, color: 'emerald',
                  detail: `"${(lead.name || '').split(' ')[0]}, I sent a couple messages about how we're helping ${lead.industry} companies. Did you get a chance to look? I only need 2 minutes."` },
                { day: 10, channel: 'LinkedIn DM', action: 'LinkedIn Follow-up', icon: MessageSquare, color: 'blue',
                  detail: `"Hey ${(lead.name || '').split(' ')[0]}, following up on my connection request. I have some specific insights on ${safePainPoints[0]?.toLowerCase() || 'growth'} for ${lead.company}. Open to a quick chat?"` },
              ].map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className={`w-10 h-10 rounded-full bg-${step.color}-500/15 border-2 border-${step.color}-500/30 flex items-center justify-center shrink-0 z-10 relative`}>
                      <StepIcon size={16} className={`text-${step.color}-400`} />
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold text-${step.color}-400`}>Day {step.day}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.05] text-slate-400">{step.channel}</span>
                        <span className="text-xs text-white font-medium">{step.action}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04] text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                        {step.detail}
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(step.detail); }}
                        className={`mt-1.5 flex items-center gap-1 text-[10px] font-medium text-${step.color}-400/70 hover:text-${step.color}-400 transition-colors`}>
                        <Copy size={10} /> Copy template
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIMILAR LEADS
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand/15 flex items-center justify-center">
              <Users size={16} className="text-brand" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Similar Leads</h3>
              <span className="text-[10px] text-slate-500">Same industry, region, or deal range as {lead.name}</span>
            </div>
          </div>
          {(() => {
            let allLeads = [];
            try { allLeads = useStore.getState().leads || []; } catch { allLeads = []; }
            if (!Array.isArray(allLeads) || allLeads.length === 0) {
              return <div className="text-xs text-slate-500 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">No leads data available to find similar leads.</div>;
            }
            const similar = allLeads
              .filter(l => l && l.id !== lead.id && (l.industry === lead.industry || l.location === lead.location))
              .slice(0, 4);
            if (!similar.length) return <div className="text-xs text-slate-500 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">No similar leads found in the same industry or location.</div>;
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {similar.map(s => (
                  <button key={s.id} onClick={() => {
                    // Navigate to the similar lead
                    window.dispatchEvent(new CustomEvent('navigate-lead', { detail: s.id }));
                    // Also directly update the store to open this lead
                    const store = useStore.getState();
                    if (store.setSelectedLead) store.setSelectedLead(s);
                    if (store.setDetailOpen) store.setDetailOpen(true);
                  }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-white/[0.04] hover:border-brand/30 transition-colors text-left">
                    <div className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center text-xs font-bold text-brand">
                      {s.name?.[0] || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-white truncate">{s.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{s.company} · {s.industry}</div>
                    </div>
                    <div className="text-[10px] font-bold text-brand">{s.score}</div>
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB NAVIGATION
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-14 z-20 backdrop-blur-xl bg-surface-0/80 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${tab === t.id
                    ? 'text-brand border-brand'
                    : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-white/[0.05]'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB CONTENT
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ─── DEGEN ALPHA INTEL TAB ──────────────────────────────────────────── */}
        {/* ─── GOATED CLOSE GUIDE TAB ──────────────────────────────────────── */}
        {tab === 'closing' && (
          <CloseGuideTab lead={lead} el={el} dv={dv} closeSteps={closeSteps} completedSteps={completedSteps}
            closeConfidence={closeConfidence} safeCallScript={safeCallScript} safePackages={safePackages}
            safeObjections={safeObjections} safeOutreach={safeOutreach} safePainPoints={safePainPoints}
            safeConversion={safeConversion} setTab={setTab} />
        )}

        {/* ─── DEGEN ALPHA INTEL TAB ──────────────────────────────────────────── */}
        {tab === 'alpha' && !degenMode && (
          <div className="p-6 rounded-xl border border-orange-500/20 bg-orange-500/[0.03] text-center">
            <Flame size={32} className="text-orange-400/40 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Alpha Intel requires DEGEN MODE to be enabled.</p>
            <p className="text-xs text-slate-500 mt-1">Toggle DEGEN MODE from the sidebar to access alpha intelligence data.</p>
          </div>
        )}
        {tab === 'alpha' && degenMode && !alphaIntel && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                <Flame size={20} className="text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Alpha Intel</h2>
                <p className="text-xs text-slate-500">DEGEN MODE intelligence for {lead.name}</p>
              </div>
            </div>
            <div className="p-6 rounded-xl border border-orange-500/20 bg-orange-500/[0.03] text-center">
              <Radar size={32} className="text-orange-400/40 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No Alpha Intel data available for this lead.</p>
              <p className="text-xs text-slate-500 mt-1">Alpha Intel requires lead enrichment data that is not yet available for {lead.name}. Try refreshing or check back later.</p>
            </div>
          </div>
        )}
        {tab === 'alpha' && degenMode && alphaIntel && (
          <div className="space-y-6">
            {/* Alpha Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                <Flame size={20} className="text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  Alpha Intel — {lead.name}
                </h2>
                <p className="text-xs text-slate-500">Real-time sniping data & actionable intelligence</p>
              </div>
            </div>

            {/* Urgency Banner */}
            <div className={`p-4 rounded-xl border ${
              alphaIntel.urgencyLevel === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30' :
              alphaIntel.urgencyLevel === 'HIGH' ? 'bg-orange-500/10 border-orange-500/30' :
              alphaIntel.urgencyLevel === 'MEDIUM' ? 'bg-yellow-500/10 border-yellow-500/30' :
              'bg-slate-500/10 border-slate-500/30'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle size={18} className={
                  alphaIntel.urgencyLevel === 'CRITICAL' ? 'text-red-400' :
                  alphaIntel.urgencyLevel === 'HIGH' ? 'text-orange-400' :
                  'text-yellow-400'
                } />
                <span className={`text-sm font-bold uppercase tracking-wider ${
                  alphaIntel.urgencyLevel === 'CRITICAL' ? 'text-red-400' :
                  alphaIntel.urgencyLevel === 'HIGH' ? 'text-orange-400' :
                  'text-yellow-400'
                }`}>
                  Urgency: {alphaIntel.urgencyLevel}
                </span>
              </div>
              <div className="space-y-1.5 ml-8">
                {alphaIntel.urgencyFactors.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <Zap size={12} className="text-orange-400 flex-shrink-0" /> {f}
                  </div>
                ))}
                {alphaIntel.urgencyFactors.length === 0 && (
                  <div className="text-sm text-slate-500">No urgency signals detected — standard follow-up pace</div>
                )}
              </div>
            </div>

            {/* Alpha Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GlassCard className="text-center alpha-panel">
                <div className="text-[10px] text-orange-400 uppercase tracking-wider mb-2 font-bold">Buying Signal</div>
                <CircularGauge value={alphaIntel.buyingSignalScore} size={80} strokeWidth={6} color="#f97316" />
                <div className="text-[10px] text-slate-500 mt-1">
                  {alphaIntel.buyingSignalScore >= 80 ? 'EXTREMELY HIGH' : alphaIntel.buyingSignalScore >= 60 ? 'HIGH' : alphaIntel.buyingSignalScore >= 40 ? 'MODERATE' : 'LOW'}
                </div>
              </GlassCard>

              <GlassCard className="text-center alpha-panel">
                <div className="text-[10px] text-orange-400 uppercase tracking-wider mb-2 font-bold">Industry Rank</div>
                <div className="text-3xl font-bold text-white">{ordinal(alphaIntel.industryRank)}</div>
                <div className="text-[10px] text-slate-500 mt-1">of {alphaIntel.totalInIndustry.toLocaleString()}</div>
                <div className="mt-2 h-1.5 bg-white/[0.02] rounded-full overflow-hidden">
                  <div className="h-full bg-orange-400 rounded-full" style={{ width: `${alphaIntel.industryPctile}%` }} />
                </div>
                <div className="text-[10px] text-orange-400 mt-1">Top {100 - alphaIntel.industryPctile}%</div>
              </GlassCard>

              <GlassCard className="text-center alpha-panel">
                <div className="text-[10px] text-orange-400 uppercase tracking-wider mb-2 font-bold">Best Contact</div>
                <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center mx-auto mb-1">
                  <Timer size={18} className="text-orange-400" />
                </div>
                <div className="text-sm font-bold text-white">{alphaIntel.bestDay}</div>
                <div className="text-xs text-slate-400">{alphaIntel.bestHour}:00 AM</div>
              </GlassCard>

              <GlassCard className="text-center alpha-panel">
                <div className="text-[10px] text-orange-400 uppercase tracking-wider mb-2 font-bold">Competitor Window</div>
                <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center mx-auto mb-1">
                  <Crosshair size={18} className="text-orange-400" />
                </div>
                <div className={`text-sm font-bold ${alphaIntel.competitorWindow === 'CLOSING SOON' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {alphaIntel.competitorWindow}
                </div>
                <div className="text-xs text-slate-400">{alphaIntel.contractExpiry}</div>
              </GlassCard>
            </div>

            {/* Snipe Playbook */}
            <GlassCard className="alpha-panel">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Crosshair size={16} className="text-orange-400" /> Snipe Playbook
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <div className="text-[10px] text-orange-400 uppercase tracking-widest mb-1 font-bold">Step 1 — Initial Strike</div>
                  <p className="text-sm text-slate-300">
                    Hit {lead.name.split(' ')[0]} on <span className="text-orange-400 font-semibold">{alphaIntel.bestDay} at {alphaIntel.bestHour}:00 AM</span> via {lead.bestMethod || 'phone'}.
                    Lead with their #1 pain point: <span className="text-white font-medium">"{safePainPoints[0] || 'scaling challenges'}"</span>
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <div className="text-[10px] text-orange-400 uppercase tracking-widest mb-1 font-bold">Step 2 — Value Drop</div>
                  <p className="text-sm text-slate-300">
                    {lead.industry} companies with {(lead.employees || 50).toLocaleString()}+ employees are leaving <span className="text-brand font-semibold">30-40% revenue on the table</span>.
                    Drop the industry benchmark comparison — {alphaIntel.industryPctile >= 70 ? 'they\'re already top-tier, emphasize maintaining edge' : 'show them where they rank vs competitors'}.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <div className="text-[10px] text-orange-400 uppercase tracking-widest mb-1 font-bold">Step 3 — Close Window</div>
                  <p className="text-sm text-slate-300">
                    {alphaIntel.competitorWindow === 'CLOSING SOON'
                      ? `Their current vendor contract window is closing in ${alphaIntel.contractExpiry}. FOMO angle — "We're working with 3 other ${lead.industry} companies right now. Spots are limited."`
                      : `Contract window is open for ${alphaIntel.contractExpiry}. Build urgency with pilot: "Let's run a 30-day proof of concept — zero risk, we'll prove the ROI."`
                    }
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-brand/5 border border-brand/20">
                  <div className="text-[10px] text-brand uppercase tracking-widest mb-1 font-bold">Step 4 — Lock It Down</div>
                  <p className="text-sm text-slate-300">
                    Push for the {safePackages.find(p => p.recommended)?.name || 'Growth'} package at <span className="text-brand font-semibold">{fmt((safePackages.find(p => p.recommended)?.price || 500) * 12)}/yr</span>.
                    ROI angle: <span className="text-brand font-semibold">{roiMultiple}x return</span> on their {fmt(dv)} deal value.
                    Close: <span className="text-white font-medium italic">"If this works the way it has for every other {lead.industry} company we work with, when would you want to start?"</span>
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Lead Context Intel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <GlassCard className="alpha-panel">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Target size={16} className="text-orange-400" /> Pain Point Intel
                </h3>
                <div className="space-y-2">
                  {safePainPoints.map((p, i) => {
                    const sev = severityFor(i);
                    return (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${sev.bg}`}>
                          <span className={`text-[10px] font-bold ${sev.color}`}>{i + 1}</span>
                        </div>
                        <span className="text-sm text-slate-300 flex-1">{p}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sev.bg} ${sev.color}`}>
                          {sev.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>

              <GlassCard className="alpha-panel">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Eye size={16} className="text-orange-400" /> Company Intel
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Industry</span>
                    <span className="text-white font-medium">{lead.industry}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Employees</span>
                    <span className="text-white font-medium">{(lead.employees || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Funding</span>
                    <span className="text-white font-medium">{lead.funding_round || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Growth Rate</span>
                    <span className="text-brand font-medium">{lead.growth_rate ? `${lead.growth_rate}%` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tech Stack</span>
                    <span className="text-white font-medium">{lead.tech_stack_primary || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">NPS Score</span>
                    <span className={`font-medium ${(lead.nps_score || 0) >= 50 ? 'text-brand' : 'text-yellow-400'}`}>
                      {lead.nps_score || 'N/A'}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* ─── INTELLIGENCE TAB ─────────────────────────────────────────────── */}
        {tab === 'intelligence' && (
          <div className="space-y-6">
            {/* Intelligence Dashboard */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-brand" /> Intelligence Dashboard
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Lead Score */}
                <GlassCard className="flex flex-col items-center justify-center relative">
                  <CircularGauge value={lead.score} size={88} strokeWidth={7} label="Lead Score" />
                </GlassCard>
                {/* Fit Score */}
                <GlassCard className="flex flex-col items-center justify-center relative">
                  <CircularGauge value={safeRanking.fitScore} size={88} strokeWidth={7} label="Fit Score" />
                </GlassCard>
                {/* Intent Score */}
                <GlassCard className="flex flex-col items-center justify-center relative">
                  <CircularGauge value={safeRanking.intentScore} size={88} strokeWidth={7} color="#22d3ee" label="Intent Score" />
                </GlassCard>
                {/* Conversion */}
                <GlassCard className="flex flex-col items-center justify-center relative">
                  <CircularGauge value={safeConversion} size={88} strokeWidth={7} color="#a78bfa" label="Conversion" sublabel="%" />
                </GlassCard>
                {/* Engagement */}
                <GlassCard className="flex flex-col items-center justify-center py-6">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                    style={{ backgroundColor: (engagementColors[safeRanking.engagement] || '#facc15') + '20' }}>
                    <Activity size={18} style={{ color: engagementColors[safeRanking.engagement] || '#facc15' }} />
                  </div>
                  <span className="text-sm font-bold" style={{ color: engagementColors[safeRanking.engagement] || '#facc15' }}>
                    {safeRanking.engagement}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">Engagement</span>
                </GlassCard>
                {/* Timeline */}
                <GlassCard className="flex flex-col items-center justify-center py-6">
                  <div className="w-10 h-10 rounded-full bg-purple-500/15 flex items-center justify-center mb-2">
                    <Clock size={18} className="text-purple-400" />
                  </div>
                  <span className="text-sm font-bold text-purple-400">{lead.decisionTimeline || 'TBD'}</span>
                  <span className="text-xs text-slate-400 mt-1">Timeline</span>
                </GlassCard>
              </div>
            </div>

            {/* Rankings */}
            <GlassCard>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Award size={16} className="text-brand" /> Rankings
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{ordinal(safeRanking.overall)}</div>
                  <div className="text-xs text-slate-500 mt-1">Overall Rank</div>
                  <div className="mt-2 h-1.5 bg-white/[0.02] rounded-full overflow-hidden">
                    <div className="h-full bg-brand rounded-full" style={{ width: `${Math.max(5, 100 - safeRanking.overall * 2)}%` }} />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">{ordinal(safeRanking.byIndustry)}</div>
                  <div className="text-xs text-slate-500 mt-1">Industry Rank</div>
                  <div className="mt-2 h-1.5 bg-white/[0.02] rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.max(5, 100 - safeRanking.byIndustry * 10)}%` }} />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">{ordinal(safeRanking.byPriority)}</div>
                  <div className="text-xs text-slate-500 mt-1">Priority Rank</div>
                  <div className="mt-2 h-1.5 bg-white/[0.02] rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400 rounded-full" style={{ width: `${Math.max(5, 100 - safeRanking.byPriority * 5)}%` }} />
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Contact Info + People Search */}
            <GlassCard>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Users size={16} className="text-brand" /> Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Email */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <Mail size={15} className="text-slate-500" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Email</div>
                      <a href={`mailto:${lead.email}`} className="text-sm text-brand hover:text-white underline decoration-brand/30 hover:decoration-white/50 transition-colors">{lead.email}</a>
                    </div>
                  </div>
                  <CopyBtn text={lead.email} />
                </div>
                {/* Phone */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <Phone size={15} className="text-slate-500" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Phone</div>
                      <a href={`tel:${(lead.phone || '').replace(/[^+\d]/g, '')}`} className="text-sm text-brand hover:text-white underline decoration-brand/30 hover:decoration-white/50 transition-colors">{lead.phone}</a>
                    </div>
                  </div>
                  <CopyBtn text={lead.phone || ''} />
                </div>
                {/* Website */}
                <div className="group relative flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <Globe size={15} className="text-slate-500" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Website</div>
                      <a href={lead.website?.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-brand hover:text-white underline decoration-brand/30 hover:decoration-white/50 transition-colors flex items-center gap-1">
                        {lead.website} <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <CopyBtn text={lead.website || ''} />
                  </div>
                  {/* Hover Preview */}
                  {lead.website && (
                    <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block w-[320px] rounded-xl border border-white/10 bg-[#0d0f12] shadow-2xl overflow-hidden">
                      <div className="p-2 border-b border-white/5 flex items-center gap-2">
                        <img src={`https://www.google.com/s2/favicons?domain=${lead.website}&sz=16`} alt="" className="w-4 h-4 rounded" loading="lazy" />
                        <span className="text-xs text-slate-400 truncate">{lead.website}</span>
                        <a href={lead.website?.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer"
                          className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-brand/15 text-brand hover:bg-brand/25 transition-colors">Visit</a>
                      </div>
                      <iframe src={lead.website?.startsWith('http') ? lead.website : `https://${lead.website}`} title="Preview"
                        className="w-full h-[180px] pointer-events-none opacity-80" sandbox="allow-scripts allow-same-origin" loading="lazy" />
                    </div>
                  )}
                </div>
                {/* Location */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <Building2 size={15} className="text-slate-500" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Location</div>
                      <div className="text-sm text-white">{lead.location}</div>
                    </div>
                  </div>
                  <CopyBtn text={lead.location || ''} />
                </div>
              </div>

              {/* People Search + Social Links */}
              <div className="mt-3 p-3 rounded-lg bg-white/[0.01] border border-white/[0.03]">
                <div className="flex items-center gap-2 mb-2">
                  <UserSearch size={14} className="text-purple-400" />
                  <span className="text-xs font-semibold text-slate-400">People Search & Social</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${lead.name} ${lead.company}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </a>
                  <a href={`https://twitter.com/search?q=${encodeURIComponent(`${lead.name} ${lead.company}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 text-xs font-medium hover:bg-sky-500/20 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X / Twitter
                  </a>
                  <a href={`https://www.truepeoplesearch.com/results?name=${encodeURIComponent(lead.name)}&citystatezip=${encodeURIComponent(lead.location || '')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                    <Search size={12} /> TruePeopleSearch
                  </a>
                  <a href={`https://www.whitepages.com/name/${encodeURIComponent(lead.name)}/${encodeURIComponent((lead.location || '').split(',').pop()?.trim() || '')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-300 text-xs font-medium hover:bg-slate-500/20 transition-colors">
                    <Search size={12} /> WhitePages
                  </a>
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(`"${lead.name}" "${lead.company}" contact`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors">
                    <Globe size={12} /> Google OSINT
                  </a>
                </div>
              </div>
            </GlassCard>

            {/* Company Intelligence */}
            <GlassCard>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Building2 size={16} className="text-brand" /> Company Intelligence
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Employees</div>
                  <div className="text-lg font-bold mt-1">{lead.employees ? lead.employees.toLocaleString() : 'N/A'}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Revenue</div>
                  <div className="text-lg font-bold mt-1">{lead.revenue ? fmt(lead.revenue) : 'N/A'}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Industry</div>
                  <div className="text-lg font-bold mt-1">{lead.industry}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Best Method</div>
                  <div className="text-lg font-bold text-purple-400 mt-1">{lead.bestMethod || 'Cold Email'}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Tech Stack</div>
                  <div className="flex items-center gap-2">
                    <Cpu size={14} className="text-brand flex-shrink-0" />
                    <span className="text-sm text-slate-300">{lead.techStack}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Using Competitors</div>
                  <div className="flex items-center gap-2">
                    <Eye size={14} className="text-red-400 flex-shrink-0" />
                    <span className="text-sm text-slate-300">{lead.competitorUsing || 'No data'}</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Pain Points + Buying Signals side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pain Points */}
              <GlassCard>
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <AlertCircle size={16} className="text-yellow-400" /> Pain Points
                </h3>
                <div className="space-y-2.5">
                  {safePainPoints.map((p, i) => {
                    const sev = severityFor(i);
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <AlertCircle size={14} className={`${sev.color} mt-0.5 flex-shrink-0`} />
                        <div className="flex-1">
                          <span className="text-sm text-slate-300">{p}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sev.bg} ${sev.color} border ${sev.border}`}>
                          {sev.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Buying Signals */}
              <GlassCard>
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Zap size={16} className="text-brand" /> Buying Signals
                </h3>
                <div className="space-y-2.5">
                  {safeBuyingSignals.length > 0 ? safeBuyingSignals.map((s, i) => {
                    const str = signalStrength(i);
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <Zap size={14} className="text-brand flex-shrink-0" />
                        <span className="flex-1 text-sm text-slate-300">{s}</span>
                        <div className="flex items-center gap-2">
                          <SignalBars bars={str.bars} />
                          <span className="text-[10px] text-slate-500">{str.label}</span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
                      <Zap size={20} className="text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No buying signals detected yet.</p>
                      <p className="text-xs text-slate-600 mt-1">Signals will appear as the lead engages with your outreach and shows purchase intent.</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>

            {/* Momentum */}
            <GlassCard>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-brand" /> Momentum Indicator
              </h3>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl ${momentumBg} flex items-center justify-center`}>
                  <MomentumIcon size={28} className={momentumColor} />
                </div>
                <div>
                  <div className={`text-xl font-bold capitalize ${momentumColor}`}>{lead.momentum}</div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {lead.momentum === 'rising' && 'Lead engagement is increasing. Strike while the iron is hot.'}
                    {lead.momentum === 'stable' && 'Engagement is steady. Consistent outreach recommended.'}
                    {lead.momentum === 'declining' && 'Engagement is dropping. Re-engagement campaign needed.'}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* ═══ AI Close Strategy Section ═══ */}
            <Accordion title="AI Close Strategy" defaultOpen={false} icon={<Brain size={16} className="text-purple-400" />}>
              <div className="space-y-5 pt-3">
                {/* Pain Point Analysis */}
                <div>
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Target size={12} /> Pain Point Analysis — {lead.industry}
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      const industryPains = {
                        'Technology': ['Scaling infrastructure costs eating into margins', 'Talent acquisition bottleneck slowing product delivery', 'Technical debt accumulating from rapid growth'],
                        'Healthcare': ['HIPAA compliance gaps creating liability exposure', 'Patient acquisition cost rising 15-20% YoY', 'Staff burnout driving 30%+ turnover rates'],
                        'Finance': ['Regulatory compliance complexity increasing overhead', 'Legacy systems creating operational inefficiency', 'Customer churn from poor digital experience'],
                        'Real Estate': ['Market volatility making pipeline unpredictable', 'Lead conversion rates declining below industry avg', 'Commission compression from discount brokerages'],
                        'Manufacturing': ['Supply chain disruptions causing revenue leakage', 'Quality control gaps increasing return rates', 'Workforce automation transition resistance'],
                        'Retail': ['E-commerce competition eroding foot traffic', 'Inventory management inefficiency tying up capital', 'Customer loyalty declining across segments'],
                        'Energy': ['Regulatory pressure increasing compliance costs', 'Commodity price volatility hitting margins', 'Sustainability mandates requiring capital investment'],
                      };
                      const pains = industryPains[lead.industry] || [
                        `${lead.industry} companies losing 15-25% revenue to operational inefficiency`,
                        `Growth bottleneck from manual processes and legacy systems`,
                        `Competitive pressure intensifying from digital-native entrants`
                      ];
                      return pains.map((pain, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/[0.04] border border-red-500/10">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? 'bg-red-500/15' : i === 1 ? 'bg-yellow-500/15' : 'bg-blue-500/15'}`}>
                            <span className={`text-[10px] font-bold ${i === 0 ? 'text-red-400' : i === 1 ? 'text-yellow-400' : 'text-blue-400'}`}>{i + 1}</span>
                          </div>
                          <div className="flex-1">
                            <span className="text-sm text-slate-300">{pain}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-red-500/15 text-red-400' : i === 1 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-blue-500/15 text-blue-400'}`}>
                                {i === 0 ? 'Critical' : i === 1 ? 'High' : 'Medium'} Impact
                              </span>
                              <span className="text-[10px] text-slate-500">Est. revenue impact: {fmt(Math.round(dv * (0.2 - i * 0.05)))}/yr</span>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Recommended Approach */}
                <div>
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Crosshair size={12} /> Recommended Approach
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-cyan-500/[0.04] border border-cyan-500/10">
                      <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold mb-1.5">Cold Call Script Opener</div>
                      <p className="text-sm text-slate-300 italic leading-relaxed">
                        "Hi {(lead.name || '').split(' ')[0]}, I'll be brief — I've been studying {lead.industry} companies like {lead.company} and found that most are leaving {fmt(Math.round(dv * 0.15))} on the table annually from {safePainPoints[0]?.toLowerCase() || 'operational gaps'}. I had a specific idea for {lead.company} — do you have 90 seconds?"
                      </p>
                      <CopyBtn text={`Hi ${(lead.name || '').split(' ')[0]}, I'll be brief — I've been studying ${lead.industry} companies like ${lead.company} and found that most are leaving ${fmt(Math.round(dv * 0.15))} on the table annually from ${safePainPoints[0]?.toLowerCase() || 'operational gaps'}. I had a specific idea for ${lead.company} — do you have 90 seconds?`} />
                    </div>
                    <div className="p-3 rounded-lg bg-cyan-500/[0.04] border border-cyan-500/10">
                      <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold mb-1.5">Email Subject Lines</div>
                      <div className="space-y-1.5">
                        {[
                          `${lead.company}'s ${safePainPoints[0]?.toLowerCase() || 'growth'} problem (and a fix)`,
                          `Quick question about ${lead.company}'s ${lead.industry?.toLowerCase()} strategy`,
                          `Saw ${lead.company}'s recent move — had an idea`,
                        ].map((subj, i) => (
                          <div key={i} className="flex items-center justify-between bg-black/20 p-2 rounded-md">
                            <span className="text-sm text-slate-300">{subj}</span>
                            <CopyBtn text={subj} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Objection Handling */}
                <div>
                  <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Shield size={12} /> Industry Objection Handling
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      const industryObjections = [
                        {
                          objection: `"We already have a ${lead.industry?.toLowerCase()} solution in place"`,
                          response: `That's exactly why I called — most ${lead.industry} companies we work with had solutions before switching. The difference is we specifically address ${safePainPoints[0]?.toLowerCase() || 'the gaps'} that generic tools miss. What if I showed you a side-by-side comparison? Takes 10 minutes and you'll know immediately if there's a fit.`,
                          winRate: Math.min(82, safeConversion + 15),
                        },
                        {
                          objection: `"Not in the budget right now"`,
                          response: `Totally understand. Here's what's interesting — our ${lead.industry} clients typically see ${fmt(Math.round(dv * 0.15))} in recovered revenue within 90 days, which more than covers the ${fmt(Math.round(dv * 0.025))}/mo investment. Would a 30-day pilot with zero upfront cost make sense? You only pay if the ROI is there.`,
                          winRate: Math.min(71, safeConversion + 8),
                        },
                        {
                          objection: `"I need to talk to my team / boss first"`,
                          response: `Of course — that's a smart move. What if I put together a 1-page ROI summary specifically for ${lead.company} that you could share? I'll include industry benchmarks so your team can see exactly where you stand. Who else should I loop in for the follow-up?`,
                          winRate: Math.min(67, safeConversion + 5),
                        },
                      ];
                      return industryObjections.map((obj, i) => (
                        <div key={i} className="p-3 rounded-lg bg-yellow-500/[0.04] border border-yellow-500/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-yellow-400">{obj.objection}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-semibold">{obj.winRate}% win rate</span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">{obj.response}</p>
                          <CopyBtn text={obj.response} />
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Deal Timeline + Close Probability */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg bg-purple-500/[0.04] border border-purple-500/10">
                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Clock size={12} /> Deal Timeline Estimate
                    </h4>
                    <div className="space-y-2">
                      {(() => {
                        const weeks = dv >= 100000 ? '8-12 weeks' : dv >= 50000 ? '4-8 weeks' : dv >= 20000 ? '2-4 weeks' : '1-2 weeks';
                        const stages = dv >= 100000
                          ? [{ name: 'Discovery + Stakeholder Mapping', dur: '2 weeks' }, { name: 'Multi-threaded Engagement', dur: '3 weeks' }, { name: 'Proposal + Procurement', dur: '2 weeks' }, { name: 'Negotiation + Legal', dur: '2-3 weeks' }, { name: 'Close', dur: '1 week' }]
                          : dv >= 50000
                          ? [{ name: 'Discovery Call', dur: '1 week' }, { name: 'Value Demo', dur: '1-2 weeks' }, { name: 'Proposal + Review', dur: '1-2 weeks' }, { name: 'Close', dur: '1 week' }]
                          : [{ name: 'Discovery + Pitch', dur: '1 week' }, { name: 'Proposal', dur: '3-5 days' }, { name: 'Close', dur: '3-5 days' }];
                        return (
                          <>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm text-slate-400">Estimated close timeline</span>
                              <span className="text-sm font-bold text-purple-400">{weeks}</span>
                            </div>
                            {stages.map((s, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${i === 0 ? 'bg-brand/15 text-brand' : 'bg-white/[0.04] text-slate-500'}`}>{i + 1}</div>
                                <span className="flex-1 text-xs text-slate-300">{s.name}</span>
                                <span className="text-[10px] text-slate-500">{s.dur}</span>
                              </div>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-brand/[0.04] border border-brand/10">
                    <h4 className="text-xs font-bold text-brand uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Target size={12} /> Close Probability Assessment
                    </h4>
                    <div className="text-center mb-4">
                      <div className="text-4xl font-black text-brand">{safeConversion}%</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Close probability</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Contributing Factors</div>
                      {[
                        { factor: 'Lead Score', value: lead.score, impact: lead.score >= 70 ? 'Positive' : lead.score >= 40 ? 'Neutral' : 'Negative' },
                        { factor: 'Momentum', value: lead.momentum, impact: lead.momentum === 'rising' ? 'Positive' : lead.momentum === 'stable' ? 'Neutral' : 'Negative' },
                        { factor: 'Budget Fit', value: `${fmt(dv)}`, impact: dv >= 50000 ? 'Positive' : 'Neutral' },
                        { factor: 'Engagement', value: safeRanking.engagement, impact: safeRanking.engagement === 'Very High' || safeRanking.engagement === 'High' ? 'Positive' : 'Neutral' },
                        { factor: 'Buying Signals', value: `${safeBuyingSignals.length} active`, impact: safeBuyingSignals.length >= 3 ? 'Positive' : safeBuyingSignals.length >= 1 ? 'Neutral' : 'Negative' },
                      ].map((f, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{f.factor}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-300">{typeof f.value === 'number' ? f.value : f.value}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                              f.impact === 'Positive' ? 'bg-emerald-500/15 text-emerald-400' :
                              f.impact === 'Negative' ? 'bg-red-500/15 text-red-400' :
                              'bg-yellow-500/15 text-yellow-400'
                            }`}>{f.impact}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Accordion>
          </div>
        )}

        {/* ─── SCRIPTS & PLAYS TAB ──────────────────────────────────────────── */}
        {tab === 'scripts' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Phone size={18} className="text-brand" /> Ranked Approaches
            </h2>

            {approaches.map((approach, idx) => (
              <GlassCard key={idx} highlight={idx === 0} className={idx === 0 ? '' : 'opacity-90'}>
                {/* Approach Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand/20 text-brand border border-brand/30">
                          Recommended
                        </span>
                      )}
                      <span className="text-xs text-slate-500">Rank #{approach.rank}</span>
                    </div>
                    <h3 className="text-lg font-bold">{approach.name}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-xs text-slate-500">Confidence</div>
                      <div className="text-sm font-bold" style={{ color: scoreColor(approach.confidence) }}>
                        {approach.confidence}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Est. Success</div>
                      <div className="text-sm font-bold" style={{ color: scoreColor(approach.successRate) }}>
                        {approach.successRate}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confidence + Success bars */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Confidence</span>
                      <span className="font-medium" style={{ color: scoreColor(approach.confidence) }}>{approach.confidence}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.02] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${approach.confidence}%`, backgroundColor: scoreColor(approach.confidence) }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Est. Success Rate</span>
                      <span className="font-medium" style={{ color: scoreColor(approach.successRate) }}>{approach.successRate}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.02] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${approach.successRate}%`, backgroundColor: scoreColor(approach.successRate) }} />
                    </div>
                  </div>
                </div>

                {/* Script sections - full for rank 1, condensed for others */}
                {idx === 0 ? (
                  <div className="space-y-3">
                    {[
                      { label: 'Opener', content: approach.script.opener },
                      ...approach.script.discovery.map((q, i) => ({ label: `Discovery Q${i + 1}`, content: q })),
                      { label: 'Pitch', content: approach.script.pitch },
                      { label: 'Close', content: approach.script.close },
                    ].map((s, i) => (
                      <div key={i}>
                        <div className="text-[10px] text-brand uppercase font-semibold tracking-widest mb-1.5">{s.label}</div>
                        <div className="bg-white/[0.03] border border-white/[0.05] p-3.5 rounded-lg text-sm text-slate-300 leading-relaxed flex items-start justify-between gap-2">
                          <span>{s.content}</span>
                          <CopyBtn text={s.content} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] text-brand uppercase font-semibold tracking-widest mb-1.5">Opener</div>
                      <div className="bg-white/[0.03] border border-white/[0.05] p-3.5 rounded-lg text-sm text-slate-300 leading-relaxed flex items-start justify-between gap-2">
                        <span>{approach.script.opener}</span>
                        <CopyBtn text={approach.script.opener} />
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-brand uppercase font-semibold tracking-widest mb-1.5">Pitch</div>
                      <div className="bg-white/[0.03] border border-white/[0.05] p-3.5 rounded-lg text-sm text-slate-300 leading-relaxed flex items-start justify-between gap-2">
                        <span>{approach.script.pitch}</span>
                        <CopyBtn text={approach.script.pitch} />
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-brand uppercase font-semibold tracking-widest mb-1.5">Close</div>
                      <div className="bg-white/[0.03] border border-white/[0.05] p-3.5 rounded-lg text-sm text-slate-300 leading-relaxed flex items-start justify-between gap-2">
                        <span>{approach.script.close}</span>
                        <CopyBtn text={approach.script.close} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Value Props for rank 1 */}
                {idx === 0 && approach.script.valueProps && (
                  <div className="mt-4 p-3 rounded-lg bg-brand/[0.05] border border-brand/10">
                    <div className="text-[10px] text-brand uppercase font-semibold tracking-widest mb-2">Value Propositions</div>
                    {approach.script.valueProps.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-300 mb-1.5 last:mb-0">
                        <Star size={13} className="text-brand flex-shrink-0" /> {v}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            ))}

            {/* Objection Handling */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Shield size={18} className="text-yellow-400" /> Objection Handling
              </h2>
              <div className="space-y-2">
                {safeObjections.map((o, i) => (
                  <Accordion key={i} title={`"${o.objection}"`}
                    icon={<Shield size={14} className="text-yellow-400" />}
                    defaultOpen={i === 0}>
                    <div className="pt-3">
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Recommended Response</div>
                      <p className="text-sm text-slate-300 leading-relaxed bg-white/[0.02] p-3 rounded-lg flex items-start justify-between gap-2">
                        <span>{o.response}</span>
                        <CopyBtn text={o.response} />
                      </p>
                    </div>
                  </Accordion>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── AI COACH TAB (replaced static outreach templates) ─────────────── */}
        {tab === 'outreach' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Brain size={18} className="text-purple-400" /> AI Outreach Coach
              </h2>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Personalized for {lead.name}</span>
            </div>

            {/* Dynamic Strategy Overview */}
            <GlassCard highlight>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                  <Brain size={24} className="text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm mb-1">Recommended Strategy for {lead.name.split(' ')[0]}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Based on {lead.name}'s profile as <span className="text-white font-medium">{lead.title}</span> at{' '}
                    <span className="text-white font-medium">{lead.company}</span> ({lead.industry}),
                    with a score of <span className="text-brand font-bold">{lead.score}/100</span> and{' '}
                    <span className={`font-medium ${lead.momentum === 'rising' ? 'text-emerald-400' : lead.momentum === 'declining' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {lead.momentum}
                    </span> momentum — here's your personalized closing playbook:
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Step-by-Step Closing Playbook */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Step-by-Step Playbook</h3>

              {/* Step 1: Opening */}
              <GlassCard>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-brand">1</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-sm text-brand">Opening — Build Rapport</h4>
                      <span className="text-[10px] text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-full">
                        {lead.bestMethod || 'Phone'}
                      </span>
                    </div>
                    <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.04] mb-2">
                      <p className="text-sm text-slate-300 leading-relaxed italic">
                        "{safeCallScript.opener}"
                      </p>
                    </div>
                    <div className="text-xs text-slate-500">
                      <span className="text-purple-400 font-medium">💡 Coach tip:</span>{' '}
                      {lead.score >= 80
                        ? 'High-intent lead — be direct and confident. They\'re already interested, don\'t oversell.'
                        : lead.score >= 60
                        ? 'Medium-intent — focus on discovery questions first. Understand their pain before pitching.'
                        : 'Lower intent — lead with value and curiosity. Share an industry insight to earn attention.'
                      }
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Step 2: Discovery */}
              <GlassCard>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-cyan-400">2</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-sm text-cyan-400">Discovery — Uncover Pain</h4>
                    </div>
                    <div className="space-y-2 mb-2">
                      {safeCallScript.discovery.map((q, i) => (
                        <div key={i} className="flex items-start gap-2 bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                          <MessageSquare size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-slate-300 italic">"{q}"</p>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500">
                      <span className="text-purple-400 font-medium">💡 Coach tip:</span>{' '}
                      Focus on pain points: <span className="text-white">{safePainPoints.slice(0, 2).join(', ') || 'scaling, efficiency'}</span>.
                      Listen for buying signals like budget discussions, timeline urgency, or competitive comparisons.
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Step 3: Value Proposition */}
              <GlassCard>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-400">3</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-sm text-purple-400">Pitch — Deliver Value</h4>
                    </div>
                    <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.04] mb-2">
                      <p className="text-sm text-slate-300 leading-relaxed italic">
                        "{safeCallScript.pitch}"
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {safeCallScript.valueProps.map((vp, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {vp}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500">
                      <span className="text-purple-400 font-medium">💡 Coach tip:</span>{' '}
                      {lead.industry} companies respond best to ROI-focused messaging.
                      Lead with the <span className="text-brand font-medium">{roiMultiple}x ROI</span> on the {safePackages.find(p => p.recommended)?.name || 'Growth'} package.
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Step 4: Handle Objections */}
              <GlassCard>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-yellow-400">4</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-yellow-400 mb-2">Objection Handling</h4>
                    <div className="space-y-2">
                      {safeObjections.map((o, i) => (
                        <Accordion key={i} title={`"${o.objection}"`}
                          icon={<Shield size={14} className="text-yellow-400" />}
                          defaultOpen={i === 0}>
                          <div className="pt-3">
                            <p className="text-sm text-slate-300 leading-relaxed bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                              <span className="text-yellow-400 font-medium">Say:</span> "{o.response}"
                            </p>
                          </div>
                        </Accordion>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Step 5: Close */}
              <GlassCard highlight>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-brand">5</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-brand mb-2">Close — Lock It Down</h4>
                    <div className="bg-brand/5 p-3 rounded-lg border border-brand/20 mb-2">
                      <p className="text-sm text-slate-300 leading-relaxed italic">
                        "{safeCallScript.close}"
                      </p>
                    </div>
                    <div className="text-xs text-slate-500">
                      <span className="text-brand font-medium">🎯 Close probability:</span>{' '}
                      <span className="text-white font-bold">{safeConversion}%</span> —
                      {safeConversion >= 70
                        ? ' This lead is primed to close. Push for commitment today.'
                        : safeConversion >= 50
                        ? ' Good odds. Secure a follow-up meeting with clear next steps.'
                        : ' Needs more nurturing. Focus on building trust and scheduling a deeper discovery call.'
                      }
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* AI Generate Custom Strategy Button */}
            <GlassCard>
              <div className="text-center py-2">
                <button
                  onClick={async () => {
                    setCoachingLoading(true);
                    try {
                      const res = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          messages: [{ role: 'user', content: `Generate a personalized closing strategy for this lead: ${lead.name}, ${lead.title} at ${lead.company} (${lead.industry}). Score: ${lead.score}/100. Pain points: ${safePainPoints.join(', ')}. Deal value: $${dv}. Momentum: ${lead.momentum}. Priority: ${lead.priority}. Give me 3 specific, actionable steps I can take TODAY to move this deal forward. Be specific to their industry and role.` }],
                          pageContext: 'leads',
                          degenMode,
                        }),
                      });
                      const data = await res.json();
                      setCoachingOutput(data.response || data.message || 'Unable to generate strategy. Try again.');
                    } catch {
                      setCoachingOutput('AI coaching unavailable right now. Use the playbook above as your guide.');
                    }
                    setCoachingLoading(false);
                  }}
                  disabled={coachingLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500/15 border border-purple-500/30 text-purple-400 font-semibold text-sm rounded-xl hover:bg-purple-500/25 transition-colors disabled:opacity-50"
                >
                  {coachingLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                      Generating strategy...
                    </>
                  ) : (
                    <>
                      <Brain size={16} /> Generate Custom AI Strategy
                    </>
                  )}
                </button>
                {coachingOutput && (
                  <div className="mt-4 text-left bg-white/[0.02] p-4 rounded-xl border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={14} className="text-purple-400" />
                      <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">AI Strategy</span>
                    </div>
                    <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{coachingOutput}</div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}

        {/* ─── PACKAGES & PRICING TAB ───────────────────────────────────────── */}
        {tab === 'packages' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Package size={18} className="text-brand" /> Packages & Pricing
            </h2>

            {/* Side by side cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {safePackages.map((pkg, i) => (
                <GlassCard key={i} highlight={pkg.recommended}
                  className={`relative flex flex-col ${pkg.recommended ? 'md:-translate-y-2' : ''}`}>
                  {pkg.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand text-black text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Recommended
                    </div>
                  )}
                  <div className="text-center pt-2 pb-4">
                    <h3 className="text-lg font-bold">{pkg.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{fmt(pkg.price)}</span>
                      <span className="text-slate-500 text-sm">/mo</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2.5 border-t border-white/[0.06] pt-4">
                    {pkg.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 rounded-full bg-brand/15 flex items-center justify-center flex-shrink-0">
                          <Check size={10} className="text-brand" />
                        </div>
                        <span className="text-slate-300">{f}</span>
                      </div>
                    ))}
                  </div>
                  <button className={`w-full mt-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    pkg.recommended
                      ? 'bg-brand text-black hover:bg-brand/90'
                      : 'bg-white/[0.02] border border-white/[0.05] text-slate-300 hover:bg-white/[0.04]'
                  }`}>
                    {pkg.recommended ? 'Get Started' : 'Learn More'}
                  </button>
                </GlassCard>
              ))}
            </div>

            {/* Feature Comparison Table */}
            <GlassCard>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-brand" /> Feature Comparison
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-3 px-3 text-slate-500 font-medium">Feature</th>
                      {safePackages.map((pkg, i) => (
                        <th key={i} className={`text-center py-3 px-3 font-medium ${pkg.recommended ? 'text-brand' : 'text-slate-400'}`}>
                          {pkg.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Collect all unique features */}
                    {(() => {
                      const allFeatures = [...new Set(safePackages.flatMap(p => p.features))];
                      return allFeatures.map((feature, fi) => (
                        <tr key={fi} className="border-b border-white/[0.03]">
                          <td className="py-2.5 px-3 text-slate-300">{feature}</td>
                          {safePackages.map((pkg, pi) => (
                            <td key={pi} className="text-center py-2.5 px-3">
                              {pkg.features.includes(feature) ? (
                                <Check size={16} className="text-brand mx-auto" />
                              ) : (
                                <Minus size={16} className="text-slate-600 mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* ROI Calculator */}
            <GlassCard highlight>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Calculator size={16} className="text-brand" /> ROI Calculator
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Deal Value</div>
                  <div className="text-2xl font-bold text-white">{fmt(dv)}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Recommended Package (Annual)</div>
                  <div className="text-2xl font-bold text-brand">{recommendedPkg ? fmt(recommendedPkg.price * 12) : 'N/A'}</div>
                  <div className="text-xs text-slate-500 mt-1">{recommendedPkg?.name} plan</div>
                </div>
                <div className="p-4 rounded-xl bg-brand/[0.08] border border-brand/20 text-center">
                  <div className="text-[10px] text-brand uppercase tracking-wider mb-2">Projected ROI</div>
                  <div className="text-2xl font-bold text-brand">{roiMultiple}x</div>
                  <div className="text-xs text-slate-500 mt-1">Return on investment</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center">
                If you close this deal at {fmt(dv)}, your annual ROI on the {recommendedPkg?.name} plan ({fmt(recommendedPkg?.price * 12)}/yr) is {roiMultiple}x.
              </p>
            </GlassCard>
          </div>
        )}

        {/* ─── ACTIVITY TAB ─────────────────────────────────────────────────── */}
        {tab === 'activity' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity size={18} className="text-brand" /> Activity & Timeline
            </h2>

            {/* Key Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <GlassCard>
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-brand" /> Last Contact
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
                    <Clock size={22} className="text-brand" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">{lead.lastContact}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Since last interaction</div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Target size={16} className="text-purple-400" /> Decision Timeline
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Target size={22} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-400">{lead.decisionTimeline || 'TBD'}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Expected decision window</div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Recommended Next Actions */}
            <GlassCard>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Zap size={16} className="text-brand" /> Recommended Next Actions
              </h3>
              <div className="space-y-3">
                {[
                  {
                    action: `Send personalized ${(lead.bestMethod || 'Cold Email') === 'Cold Email' ? 'email' : (lead.bestMethod || '') === 'LinkedIn DM' ? 'LinkedIn message' : 'outreach'} based on "${safePainPoints[0] || 'key pain point'}"`,
                    priority: 'High',
                    timing: 'Today',
                  },
                  {
                    action: `Prepare ${safePackages.find(p => p.recommended)?.name || 'Growth'} package proposal with custom ROI analysis`,
                    priority: 'Medium',
                    timing: 'Within 2 days',
                  },
                  {
                    action: `Research latest ${lead.industry} trends to strengthen discovery questions`,
                    priority: 'Low',
                    timing: 'This week',
                  },
                ].map((item, i) => {
                  const sev = severityFor(i);
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${sev.bg}`}>
                        <span className={`text-[10px] font-bold ${sev.color}`}>{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-slate-300">{item.action}</div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sev.bg} ${sev.color} border ${sev.border}`}>
                            {item.priority}
                          </span>
                          <span className="text-[10px] text-slate-500">{item.timing}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Engagement Activity Timeline */}
            <GlassCard>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Activity size={16} className="text-brand" /> Engagement Summary
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider w-28 flex-shrink-0">Engagement</div>
                  <div className="flex-1 h-2 bg-white/[0.02] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: safeRanking.engagement === 'Very High' ? '95%' : safeRanking.engagement === 'High' ? '75%' : safeRanking.engagement === 'Medium' ? '50%' : '25%',
                      backgroundColor: engagementColors[safeRanking.engagement] || '#facc15'
                    }} />
                  </div>
                  <span className="text-xs font-medium w-16 text-right" style={{ color: engagementColors[safeRanking.engagement] }}>
                    {safeRanking.engagement}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider w-28 flex-shrink-0">Momentum</div>
                  <div className="flex-1 flex items-center gap-2">
                    <MomentumIcon size={16} className={momentumColor} />
                    <span className={`text-sm font-medium capitalize ${momentumColor}`}>{lead.momentum}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider w-28 flex-shrink-0">Best Channel</div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-purple-400">{lead.bestMethod}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider w-28 flex-shrink-0">Buying Signals</div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-brand">{safeBuyingSignals.length} detected</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Buying Signals compact view */}
            <GlassCard>
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Zap size={16} className="text-brand" /> Active Buying Signals
              </h3>
              <div className="flex flex-wrap gap-2">
                {safeBuyingSignals.length > 0 ? safeBuyingSignals.map((s, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium bg-brand/10 text-brand border border-brand/20 flex items-center gap-1.5">
                    <Zap size={10} /> {s}
                  </span>
                )) : (
                  <div className="text-xs text-slate-500 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] w-full">
                    No active buying signals detected for this lead yet. Buying signals are identified as the lead engages with outreach and content.
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          VOIP CONFIRMATION OVERLAY
      ═══════════════════════════════════════════════════════════════════════ */}
      {voipConfirm && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-yellow-500/15 border border-yellow-500/30 backdrop-blur-xl shadow-2xl flex items-center gap-3 animate-in fade-in">
          <AlertTriangle size={18} className="text-yellow-400 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-yellow-400">Initiate VoIP call to {lead.name}?</div>
            <div className="text-xs text-slate-400">Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-yellow-400 font-mono text-[10px]">V</kbd> again to confirm, <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono text-[10px]">Esc</kbd> to cancel</div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          KEYBIND HINT BAR
      ═══════════════════════════════════════════════════════════════════════ */}
      {showKeybindHint && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-surface-0/90 backdrop-blur-xl border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] text-slate-500 overflow-x-auto no-scrollbar">
              <span className="flex items-center gap-1.5 shrink-0">
                <Keyboard size={12} className="text-slate-600" />
                <span className="text-slate-400 font-medium">Shortcuts</span>
              </span>
              <span className="h-3 w-px bg-white/[0.06]" />
              {tabs.map((t, i) => (
                <span key={t.id} className="flex items-center gap-1 shrink-0">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-slate-400 font-mono text-[10px] min-w-[18px] text-center">{i + 1}</kbd>
                  <span className="text-slate-600">{t.label}</span>
                </span>
              ))}
              <span className="h-3 w-px bg-white/[0.06]" />
              <span className="flex items-center gap-1 shrink-0">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-slate-400 font-mono text-[10px]">&larr;&rarr;</kbd>
                <span className="text-slate-600">Prev/Next</span>
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-slate-400 font-mono text-[10px]">V</kbd>
                <span className="text-slate-600">VoIP</span>
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-slate-400 font-mono text-[10px]">O</kbd>
                <span className="text-slate-600">Outreach</span>
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-slate-400 font-mono text-[10px]">Esc</kbd>
                <span className="text-slate-600">Close</span>
              </span>
            </div>
            <button onClick={() => setShowKeybindHint(false)} className="text-slate-600 hover:text-slate-400 transition-colors ml-3 shrink-0 text-xs">
              Hide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
