import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ArrowLeft, Phone, Mail, Calendar, Globe, Building2, AlertCircle, Copy, Check, TrendingUp, TrendingDown, Minus, Target, Shield, Zap, Star, ChevronRight, ChevronDown, Users, DollarSign, Clock, Award, BarChart3, Activity, Cpu, Eye, MessageSquare, Send, Package, Calculator, Flame, Crosshair, Brain, Timer, AlertTriangle, Keyboard, ExternalLink, Search, UserSearch, Crown, Sparkles, PhoneCall, FileText, CreditCard, Trophy, Rocket, ChevronUp, MapPin, Hash, Lightbulb, Swords, TrendingUp as TrendUp2, ArrowRight, Voicemail, Share2, CheckCircle2
} from 'lucide-react';
import { useStore, fmt, enrichLead, initialsOf, placeIdOf, formatPhone } from '../hooks/useStore';
import { buildCallSheet, buildPackage, recommendStack, estimateMissedRevenue } from '../lib/outreach';
import { priceFor, quoteLine } from '../lib/pricing';

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
// CLOSE GUIDE TAB — Enhanced linear closing experience
// =============================================================================
// Google Maps link for a lead. Prefers the canonical listing URL captured from
// Places; falls back to a Maps search on the business name and location so the
// link resolves for every lead, on refresh and for previously-saved rows.
/**
 * The business's own listing photos, shown properly rather than as a thumbnail.
 *
 * The hero loads at 1600px — Places bills per photo request regardless of the
 * size returned, so asking for a small one saves nothing and just looks worse
 * on a retina screen. The remaining shots stay behind a click for the opposite
 * reason: each one IS another billable request, and most leads never need them.
 */
function ListingGallery({ lead }) {
  const [refs, setRefs] = React.useState(lead?.photoRefs?.length ? lead.photoRefs : (lead?.photoRef ? [lead.photoRef] : []));
  const [active, setActive] = React.useState(0);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setRefs(lead?.photoRefs?.length ? lead.photoRefs : (lead?.photoRef ? [lead.photoRef] : []));
    setActive(0); setFailed(false);
  }, [lead?._placeId, lead?.external_id, lead?.photoRef, lead?.photoRefs]);

  const placeId = placeIdOf(lead);
  React.useEffect(() => {
    if (refs.length > 1 || !placeId) return;
    let cancelled = false;
    fetch(`/api/leads?action=place&id=${encodeURIComponent(placeId)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (cancelled || !d?.lead) return;
        const next = d.lead.photoRefs?.length ? d.lead.photoRefs : (d.lead.photoRef ? [d.lead.photoRef] : []);
        if (next.length) setRefs(next);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [placeId, refs.length]);

  // ONE url per photo, used for both the hero and its thumbnail.
  //
  // Switching photos used to stall because the thumbnail was requested at 320px
  // and the hero at 1600px — two different URLs, so clicking a thumb started a
  // fresh download of an image the browser had never seen. Same URL for both
  // means the thumbnail strip warms the cache, and selecting one is instant.
  // It also halves the number of billable photo requests per lead.
  const src = React.useCallback((ref) => `/api/leads?action=photo&ref=${encodeURIComponent(ref)}&w=1600`, []);

  // Arrow keys move through the set. Ignored while typing, so the shortcut does
  // not fight the search and script fields elsewhere on the page.
  React.useEffect(() => {
    if (refs.length < 2) return;
    const onKey = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      setActive(i => (e.key === 'ArrowRight'
        ? (i + 1) % refs.length
        : (i - 1 + refs.length) % refs.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [refs.length]);

  if (!refs.length || failed) return null;

  return (
    <div className="mb-5">
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-black/40">
        {/* Every photo is mounted, and only the selected one is shown. The
            browser therefore fetches all of them once, up front, and switching
            is a CSS change rather than a network round trip. */}
        {refs.map((r, i) => (
          <img
            key={r}
            src={src(r)}
            alt={`${lead.company || 'Business'} — listing photo ${i + 1}`}
            onError={() => { if (i === 0) setFailed(true); }}
            decoding="async"
            className={`w-full h-56 sm:h-72 lg:h-80 object-cover ${i === active ? '' : 'hidden'}`}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-4 flex items-center gap-2">
          <MapPin size={13} className="text-orange-400" />
          <span className="text-xs text-white/90 font-medium">From their Google listing</span>
        </div>
        {refs.length > 1 && (
          <div className="absolute bottom-3 right-4 text-[11px] text-white/70">
            {active + 1} / {refs.length} <span className="text-white/40 ml-1">← →</span>
          </div>
        )}
      </div>

      {refs.length > 1 && (
        <div className="mt-2 grid grid-cols-6 gap-2">
          {refs.map((r, i) => (
            <button key={r} onClick={() => setActive(i)}
              className={`rounded-lg overflow-hidden border transition ${i === active ? 'border-orange-400/70' : 'border-white/[0.06] hover:border-white/20'}`}>
              <img src={src(r)} alt={`Photo ${i + 1}`} decoding="async" className="w-full h-14 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function mapsLinkFor(lead) {
  if (lead?.mapsUrl) return { url: lead.mapsUrl, exact: true };
  const q = [lead?.company || lead?.name, lead?.address || lead?.location].filter(Boolean).join(' ');
  if (!q.trim()) return null;
  return { url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, exact: false };
}

// The two numbers the operator actually says out loud. Replaces both the
// commission figures (payouts aren't wired) and the year-one/ROI projections
// that dressed an estimate up as a return.
function recommendedPkgQuote(pkgs) {
  const p = (pkgs || []).find(x => x.recommended) || (pkgs || [])[0];
  return { deposit: p?.price || 0, monthly: p?.monthly || 0 };
}

function CloseGuideTab({ lead, el, dv, closeSteps, completedSteps, closeConfidence, safeCallScript, safePackages, safeObjections, safePainPoints, safeConversion, setTab, alphaIntel }) {
  const [expandedStep, setExpandedStep] = useState(null);
  const [fastTrackMode, setFastTrackMode] = useState(false);

  // Derived here rather than passed down. The recommendation block below
  // referenced a `stack` that only ever existed in LeadDetail's scope, so
  // opening this tab threw ReferenceError and dropped the whole panel into the
  // error boundary. It builds from `el`, which this component already has.
  const stack = useMemo(() => recommendStack(el), [el]);

  // Step completion is purely derived from lead status — no manual localStorage tracking
  const stepChecks = useMemo(() => {
    const checks = {};
    closeSteps.forEach((s, i) => {
      if (s.status === 'done') checks[i] = true;
    });
    return checks;
  }, [closeSteps]);

  const quoted = recommendedPkgQuote(safePackages);
  const currentStep = closeSteps.find(s => s.status === 'current') || closeSteps[0];
  const currentStepIdx = currentStep ? currentStep.step - 1 : 0;
  const recommendedPkg = safePackages.find(p => p.recommended) || safePackages[1];
  const recQuote = recommendedPkgQuote(safePackages);
  // Annual and ROI are both retainer-based: the deposit is a one-time build
  // cost, so folding it into a recurring-return multiple would overstate it.
  const recAnnualRetainer = recQuote.monthly * 12;
  const annualLeakNum = Math.round(dv * 0.15 * 12);
  const roiMultiple = recAnnualRetainer ? (annualLeakNum / recAnnualRetainer).toFixed(1) : null;

  // Lost revenue calculations for psychology-driven scripts
  const monthlyLeak = fmt(Math.round(dv * 0.15));
  const annualLeak = fmt(Math.round(dv * 0.15 * 12));
  const costOfInaction = fmt(Math.round(dv * 0.15 * 3)); // 3 months of delay
  const fn = (lead.name || '').split(' ')[0];
  const recPkg = safePackages.find(p => p.recommended);
  // Monthly retainer — this is quoted with a "/mo" suffix in the scripts below.
  // Falls back to this business's derived price rather than a flat rate — the
  // whole point is that the number in the script matches who you are calling.
  const derived = priceFor(el, { includesBuild: !el.website && !el.domain });
  const recPrice = fmt(recPkg?.monthly ?? derived.monthly ?? 0);
  const recDeposit = fmt(recPkg?.price ?? derived.deposit ?? 0);
  const pp1 = (safePainPoints[0] || 'operational gaps').toLowerCase();
  const pp2 = (safePainPoints[1] || 'customer acquisition costs').toLowerCase();

  // "What to Say Right Now" scripts per step — tailored to THIS lead's pain + lost revenue
  const stepScripts = [
    { script: `${fn}, I've been studying ${lead.company}'s ${lead.industry} operation and I found something that might be costing you money. Companies your size dealing with ${pp1} typically lose ${monthlyLeak} per month in missed revenue. I have a specific fix — got 2 minutes?`, label: 'Pain-First Opener' },
    // Was a cold email quoting a headcount defaulted to 50. We do not run
    // email, and a Places record has no headcount.
    { script: `Voicemail, 20 seconds:\n\n"Hi, this is [your name] calling for the owner at ${lead.company}. I had a look at how your calls are handled and there is money going out the door on the ones nobody picks up. Give me a call back on [your number]."\n\nThen text the same number tomorrow:\n"Hi — left you a voicemail about ${lead.company}. We stop missed calls turning into lost jobs. Worth two minutes?"`, label: 'Voicemail + SMS' },
    { script: `${fn}, thanks for the time. Before I pitch anything, I want to understand YOUR numbers. Walk me through how ${lead.company} handles ${pp1} today.\n\n[Listen — let them talk]\n\nSo when that breaks down, what happens to your customer acquisition cost? What does it actually cost you to land a new client right now?\n\n[Listen — anchor the pain in dollars]\n\nGot it. So between ${pp1} and ${pp2}, you're looking at roughly ${monthlyLeak}/month in leakage. What if I showed you exactly how to cut that in half within 60 days?`, label: 'Discovery — Dollar Anchoring' },
    { script: `${fn}, based on what you told me about ${lead.company}'s challenges with ${pp1} and ${pp2}, here's the math:\n\nYou're currently losing: ~${monthlyLeak}/mo (${annualLeak}/yr)\nOur fix costs: ${recDeposit} to set up, then ${recPrice}/mo\nProjected recovery: ${fmt(Math.round(dv * 0.15))} in 90 days\nNet ROI: ${((dv * 0.15) / ((recPkg?.monthly || dv * 0.025) * 3)).toFixed(1)}x in the first quarter\n\nEvery month you wait costs ${lead.company} another ${monthlyLeak}. That's the real price of doing nothing.`, label: 'ROI-Anchored Proposal' },
    { script: `I hear you, ${fn}. But let's look at this differently:\n\nThe cost of this solution: ${recPrice}/mo\nThe cost of NOT solving ${pp1}: ${monthlyLeak}/mo\n\nYou're already paying ${monthlyLeak}/mo for this problem — you're just paying it in lost revenue instead of a solution. A 30-day pilot proves the ROI with zero long-term commitment. If we don't deliver, you walk away. But if we do — and we will — you just stopped a ${annualLeak}/yr bleed.`, label: 'Cost-of-Inaction Close' },
    { script: `${fn}, here's where we are: ${lead.company} has been losing ${monthlyLeak} every month to ${pp1}. We've shown you exactly how to fix it. Every week you wait to sign is another ${fmt(Math.round(dv * 0.15 / 4))} walking out the door.\n\nI'm sending the ${recPkg?.name || 'Growth'} agreement over now — ${recPrice}/mo, 30-day performance guarantee. Let's stop the bleeding and start recovering that ${annualLeak}/yr. Ready to go?`, label: 'Urgency Close' },
  ];

  // CTA actions per step
  const ctaLabels = ['Open AI Analysis', 'Open Outreach Templates', 'Open Call Script', 'Open Package Pricing', 'Open Objection Handler', 'Open Contract Template'];
  const ctaIcons = [Brain, Send, PhoneCall, Calculator, Shield, CreditCard];
  const ctaActions = [
    () => setTab('intelligence'),
    () => setTab('outreach'),
    () => setTab('outreach'),
    () => setTab('closing'),
    () => setTab('outreach'),
    () => setTab('closing'),
  ];

  // Fast Track steps (compressed 3-step for hot leads) — revenue-loss driven
  const fastTrackSteps = [
    { step: 1, name: 'Pain Strike', desc: `Lead with ${lead.company}'s specific revenue leak — make them feel the cost of inaction`, script: `${fn}, I'll cut straight to it — I ran the numbers on ${lead.company} and your ${pp1} problem is costing you roughly ${monthlyLeak} every single month. That's ${annualLeak} a year walking out the door. I can show you exactly where the leak is in 10 minutes. Worth a look?` },
    { step: 2, name: 'Dollar Demo', desc: 'Show the math: what they lose vs. what the fix costs — make inaction the expensive option', script: `Here's ${lead.company}'s situation in black and white:\n\nYou're losing: ${monthlyLeak}/mo to ${pp1}\nYour customer acquisition cost is inflated by ${pp2}\nOur fix: ${recDeposit} deposit + ${recPrice}/mo — pays for itself ${((dv * 0.15) / ((recPkg?.monthly || dv * 0.025))).toFixed(0)}x over\n\nYou're already spending ${monthlyLeak}/mo on this problem — you're just spending it on lost revenue instead of a solution.` },
    { step: 3, name: 'Bleed Close', desc: `Every day without signing costs ${lead.company} real money — close on the urgency`, script: `${fn}, we've seen the numbers. ${lead.company} is bleeding ${monthlyLeak} every month from ${pp1}. That's ${fmt(Math.round(dv * 0.15 / 4))} per week. Every week you wait to decide is another ${fmt(Math.round(dv * 0.15 / 4))} gone.\n\nI'm sending the agreement now. ${recPrice}/mo, 30-day money-back guarantee. Let's stop the bleeding today.` },
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
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.03] text-slate-400 border border-white/[0.06] font-bold uppercase tracking-wider">
                Untouched
              </span>
            </h2>
            <p className="text-xs text-slate-500">Revenue-loss-first path to closing {lead.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-black text-brand">{closeConfidence}%</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Close Probability</div>
          </div>
        </div>
      </div>

      {/* ── Why this one first ────────────────────────────────────────────────
          What used to be the separate Alpha Intel tab. It lives here because
          it only matters while you're deciding who to call, and everything in
          it is now sourced from the record rather than inferred — the old tab
          derived "best day and hour to call" from the length of the job title
          string and reported a vendor-contract window for local businesses
          that have no funding data at all. */}
      {alphaIntel && (alphaIntel.urgencyFactors.length > 0 || alphaIntel.industryRank > 0) && (
        <div className={`p-4 rounded-xl border ${
          alphaIntel.urgencyLevel === 'CRITICAL' ? 'border-red-500/30 bg-red-500/[0.04]' :
          alphaIntel.urgencyLevel === 'HIGH' ? 'border-orange-500/30 bg-orange-500/[0.04]' :
          alphaIntel.urgencyLevel === 'MEDIUM' ? 'border-yellow-500/25 bg-yellow-500/[0.03]' :
          'border-white/[0.06] bg-white/[0.02]'}`}>
          <div className="flex items-center gap-2.5 mb-3">
            <Flame size={16} className={
              alphaIntel.urgencyLevel === 'CRITICAL' ? 'text-red-400' :
              alphaIntel.urgencyLevel === 'HIGH' ? 'text-orange-400' :
              alphaIntel.urgencyLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-slate-400'} />
            <div className="text-sm font-bold text-white">Why {lead.company} first</div>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
              alphaIntel.urgencyLevel === 'CRITICAL' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
              alphaIntel.urgencyLevel === 'HIGH' ? 'text-orange-400 border-orange-500/30 bg-orange-500/10' :
              alphaIntel.urgencyLevel === 'MEDIUM' ? 'text-yellow-400 border-yellow-500/25 bg-yellow-500/10' :
              'text-slate-400 border-white/[0.08] bg-white/[0.03]'}`}>
              {alphaIntel.urgencyLevel}
            </span>
            {alphaIntel.industryRank > 0 && alphaIntel.totalInIndustry > 1 && (
              <span className="ml-auto text-[10px] text-slate-500">
                #{alphaIntel.industryRank} of {alphaIntel.totalInIndustry} in {lead.industry}
              </span>
            )}
          </div>

          {alphaIntel.urgencyFactors.length > 0 ? (
            <div className="space-y-1.5">
              {alphaIntel.urgencyFactors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <ChevronRight size={12} className="text-slate-600 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Nothing obviously broken on the record — no gap to lead with. Open on the
              missed-call math instead of a problem you can name.
            </p>
          )}
        </div>
      )}

      {/* Revenue Impact Banner */}
      <div className="p-4 rounded-xl border border-brand/20 bg-brand/[0.03]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <DollarSign size={20} className="text-brand shrink-0" />
            <div>
              <div className="text-sm font-bold text-brand">Deal Economics</div>
              <p className="text-xs text-slate-400 mt-0.5">
                What {lead.company} loses by NOT buying vs. what the contract is worth
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 ml-4">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Your Quote</div>
            <div className="text-xl font-black text-brand">{fmt(quoted.deposit)}</div>
            <div className="text-[10px] text-slate-500">+ {fmt(quoted.monthly)}/mo</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-red-500/[0.06] border border-red-500/15 text-center">
            <div className="text-[10px] text-red-400 uppercase tracking-wider font-bold">Their Monthly Loss</div>
            <div className="text-base font-bold text-red-400">{fmt(Math.round(dv * 0.15))}</div>
            <div className="text-[10px] text-slate-500">from {(safePainPoints[0] || 'inaction').toLowerCase()}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-orange-500/[0.06] border border-orange-500/15 text-center">
            <div className="text-[10px] text-orange-400 uppercase tracking-wider font-bold">Annual Revenue Leak</div>
            <div className="text-base font-bold text-orange-400">{fmt(Math.round(dv * 0.15 * 12))}</div>
            <div className="text-[10px] text-slate-500">cost of doing nothing</div>
          </div>
          <div className="p-2.5 rounded-lg bg-brand/[0.06] border border-brand/15 text-center">
            <div className="text-[10px] text-brand uppercase tracking-wider font-bold">Deal Value</div>
            <div className="text-base font-bold text-brand">{fmt(dv)}</div>
            <div className="text-[10px] text-slate-500">{fmt(quoted.deposit)} + {fmt(quoted.monthly)}/mo</div>
          </div>
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
                        <DollarSign size={9} /> {fmt(quoted.deposit)} + {fmt(quoted.monthly)}/mo if closed
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

                        {/* Step status indicator — auto-derived from lead status */}
                        <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                          s.status === 'done' ? 'bg-brand/[0.06] border-brand/15' : s.status === 'current' ? 'bg-cyan-500/[0.04] border-cyan-500/15' : 'bg-white/[0.02] border-white/[0.04]'
                        }`}>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${s.status === 'done' ? 'bg-brand' : 'bg-white/[0.06]'}`}>
                            {s.status === 'done' && <Check size={10} className="text-black" />}
                          </div>
                          <span className="text-xs text-slate-300">
                            {s.status === 'done' ? 'Completed — lead progressed past this step' : s.status === 'current' ? 'In progress — current step' : 'Upcoming'}
                          </span>
                        </div>

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
            <div className="text-2xl font-black text-brand">{fmt(quoted.deposit)}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Deposit</div>
            <div className="text-[9px] text-brand mt-1">+ {fmt(quoted.monthly)}/mo</div>
          </div>
        </div>
      </GlassCard>

      {/* AI Recommendations — Tailored to THIS business */}
      <GlassCard highlight>
        <h3 className="text-sm font-bold text-brand mb-3 flex items-center gap-2">
          <Brain size={16} />
          AI Close Strategy for {lead.company}
        </h3>
        <div className="space-y-2 text-xs text-slate-300">
          <p className="font-medium text-white">Why {lead.company} needs to buy — and why NOW:</p>
          <ul className="space-y-2.5 mt-2">
            <li className="flex items-start gap-2">
              <DollarSign size={12} className="text-red-400 shrink-0 mt-0.5" />
              <span><strong className="text-red-400">Revenue leak:</strong> {lead.company}'s struggle with {(safePainPoints[0] || 'operational gaps').toLowerCase()} is costing them an estimated <strong className="text-white">{fmt(Math.round(dv * 0.15))}/mo ({fmt(Math.round(dv * 0.15 * 12))}/yr)</strong>. Frame every conversation around stopping this bleed — not "adding a tool."</span>
            </li>
            <li className="flex items-start gap-2">
              <Users size={12} className="text-orange-400 shrink-0 mt-0.5" />
              {/* Was a CAC overspend percentage computed as 20 + score % 15,
                  against a headcount defaulted to 50, addressed to a first name
                  taken off the company. Replaced with what the listing shows. */}
              <span><strong className="text-orange-400">What they're missing:</strong>{' '}
                {stack.products.length
                  ? <>{stack.products.join(', ')} — {stack.summary.charAt(0).toLowerCase() + stack.summary.slice(1)}</>
                  : <>Nothing obvious is broken on the listing, so open on the missed-call math rather than a gap you have to argue for.</>}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Zap size={12} className="text-brand shrink-0 mt-0.5" />
              <span><strong className="text-brand">Attack vector:</strong> Lead with <strong className="text-white">{el.bestMethod || 'direct call'}</strong> — ask for the owner by role — a Places record carries no contact name. {el.receptionist?.qualified ? `Open on the ${el.receptionist.uncoveredHoursPerWeek} hours a week nobody answers.` : el.website ? 'Open on the missed-call math: what is a job worth, and what happens to the ones that come in while they are on one.' : 'Open on the missing website — they are invisible outside Maps.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <Timer size={12} className="text-yellow-400 shrink-0 mt-0.5" />
              <span><strong className="text-yellow-400">Cost of delay:</strong> Every month {lead.company} delays costs them <strong className="text-white">{fmt(Math.round(dv * 0.15))}</strong>. Over a quarter that's <strong className="text-white">{fmt(Math.round(dv * 0.15 * 3))}</strong> gone. Use this number in your close: <em>"The question isn't whether you can afford this — it's whether you can afford another {fmt(Math.round(dv * 0.15))} month of doing nothing."</em></span>
            </li>
            <li className="flex items-start gap-2">
              <Crosshair size={12} className="text-cyan-400 shrink-0 mt-0.5" />
              <span><strong className="text-cyan-400">Killer angle for {lead.industry}:</strong> {
                lead.industry === 'SaaS' ? `SaaS companies at ${lead.company}'s stage are obsessed with NRR and CAC payback. Lead with: "Every point of churn costs you ${fmt(Math.round(dv * 0.05))} — we cut churn drivers by 30%."` :
                lead.industry === 'E-commerce' ? `E-commerce is all about conversion rate and AOV. Lead with: "Your cart abandonment is costing ${fmt(Math.round(dv * 0.2))}/mo — we recover 15-20% of abandoned carts."` :
                lead.industry === 'Fintech' ? `Fintech buyers care about compliance risk and processing costs. Lead with: "Non-compliance penalties in your space average ${fmt(Math.round(dv * 0.25))} — we de-risk that completely."` :
                lead.industry === 'Healthcare' ? `Healthcare decision-makers respond to patient acquisition cost and compliance. Lead with: "Your patient acquisition cost is probably 3x higher than it should be — we've cut it by 40% for similar practices."` :
                lead.industry === 'MarTech' ? `MarTech buyers need attribution proof. Lead with: "You're likely wasting 30% of ad spend on channels that don't convert — we show you exactly where."` :
                lead.industry === 'Construction' ? `Construction firms bleed margin on manual estimates and slow follow-up. Lead with: "Every missed bid costs ${fmt(Math.round(dv * 0.08))} — we cut your estimate-to-close time by 50%."` :
                `${lead.industry} companies at ${lead.company}'s size are usually losing ${fmt(Math.round(dv * 0.15))}/mo to ${(safePainPoints[0] || 'process inefficiency').toLowerCase()}. Lead with the specific dollar amount — make the pain tangible and impossible to ignore.`
              }</span>
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
                'SaaS': ['Product demo with ROI calculator', 'Technical architecture review', 'Competitive feature comparison'],
                'E-commerce': ['Conversion rate optimization audit', 'Cart abandonment analysis', 'Customer lifetime value assessment'],
                'MarTech': ['Campaign performance benchmark', 'Multi-channel attribution analysis', 'Creative ROI assessment'],
                'Construction': ['Lead generation efficiency audit', 'Job costing optimization review', 'Digital presence assessment'],
                'Fintech': ['Compliance readiness scorecard', 'Risk assessment walkthrough', 'Transaction cost analysis'],
                'Healthcare': ['Patient acquisition cost analysis', 'Compliance gap assessment', 'Operational efficiency benchmark'],
                'SupplyChain': ['Supply chain efficiency audit', 'Quality metrics benchmark', 'Automation ROI calculator'],
                'PropTech': ['Market analytics deep-dive', 'Lead conversion optimization', 'Comparable analysis demo'],
                'FoodTech': ['Margin optimization review', 'Online ordering audit', 'Customer retention analysis'],
                'Media': ['Audience monetization assessment', 'Content ROI analysis', 'Distribution channel audit'],
                'LegalTech': ['Client intake efficiency audit', 'Billable hours optimization', 'Practice growth assessment'],
                'InsurTech': ['Agent productivity benchmark', 'Claims workflow audit', 'Customer experience scorecard'],
                'HRTech': ['Time-to-fill benchmark analysis', 'Sourcing channel ROI review', 'Employer brand audit'],
                'Logistics': ['Route optimization assessment', 'Fleet utilization audit', 'Last-mile efficiency analysis'],
                'EdTech': ['Student engagement analysis', 'Completion rate optimization', 'Acquisition cost benchmark'],
                'CleanTech': ['ROI payback period calculator', 'Energy savings projection', 'Sustainability impact report'],
                'AI/ML': ['Model ROI demonstration', 'Data pipeline audit', 'Enterprise readiness assessment'],
                'Gaming': ['Player retention analysis', 'Monetization benchmark', 'UA efficiency audit'],
                'Web3/Crypto': ['Community growth assessment', 'Token utility review', 'Governance optimization'],
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
              { label: 'Our Advantage', items: ['AI-powered intelligence', `${lead.industry}-specific playbooks`, `${fmt(recQuote.deposit)} + ${fmt(recQuote.monthly)}/mo`], color: 'brand' },
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
              {currentStep && currentStep.step === 1 && `${lead.company} is losing ~${fmt(Math.round(dv * 0.15))}/mo to ${(safePainPoints[0] || 'operational gaps').toLowerCase()}. Review the pain point analysis above and craft your opening around this number. Your first message should make ${(lead.name || '').split(' ')[0]} feel the cost of inaction — not hear a sales pitch. Prepare a ${el.bestMethod || 'direct outreach'} message and move to contact within 24 hours.`}
              {currentStep && currentStep.step === 2 && `Hit ${(lead.name || '').split(' ')[0]} today via ${el.bestMethod || 'phone'}. Lead with the money: "${lead.company} is leaving ${fmt(Math.round(dv * 0.15 * 12))}/yr on the table because of ${(safePainPoints[0] || 'process gaps').toLowerCase()}." Don't sell — diagnose. Your goal is to get them to confirm the pain and agree to a discovery call.`}
              {currentStep && currentStep.step === 3 && `Discovery call with ${(lead.name || '').split(' ')[0]}: Your job is to get them to say the dollar amount out loud. Ask: "What does ${(safePainPoints[0] || 'this problem').toLowerCase()} cost ${lead.company} per month?" Then anchor: "So you're spending ${fmt(Math.round(dv * 0.15))}/mo on a problem that has a ${fmt(safePackages.find(p => p.recommended)?.monthly || Math.round(dv * 0.025))}/mo fix." Verify budget authority and timeline.`}
              {currentStep && currentStep.step === 4 && `Send the proposal NOW. Frame it as: "${lead.company} is currently paying ${fmt(Math.round(dv * 0.15))}/mo for ${(safePainPoints[0] || 'this problem').toLowerCase()} — you're just paying it in lost revenue instead of a solution. The ${safePackages.find(p => p.recommended)?.name || 'Growth'} plan at ${recDeposit} + ${fmt(safePackages.find(p => p.recommended)?.monthly || Math.round(dv * 0.025))}/mo — and it starts paying for itself the first month." Follow up in 48 hours — every day of delay costs them.`}
              {currentStep && currentStep.step === 5 && `${(lead.name || '').split(' ')[0]} is negotiating — they WANT to buy but need justification. Reframe any budget objection: "The question isn't whether you can afford ${fmt(safePackages.find(p => p.recommended)?.monthly || Math.round(dv * 0.025))}/mo — it's whether you can afford another ${fmt(Math.round(dv * 0.15))} month of doing nothing." Offer the 30-day pilot if needed. Close this week.`}
              {currentStep && currentStep.step === 6 && `Lock it down. ${lead.company} — ${fmt(quoted.deposit)} deposit plus ${fmt(quoted.monthly)}/mo. Send the agreement, process payment, and schedule onboarding. Then immediately ask: "Who else in ${lead.industry} should I be talking to?" Every won deal should generate 2-3 warm referrals.`}
              {!currentStep && `Start with the revenue leak: ${lead.company} is losing ~${fmt(Math.round(dv * 0.15))}/mo to ${(safePainPoints[0] || 'inefficiency').toLowerCase()}. Build your outreach around making ${(lead.name || '').split(' ')[0]} feel that cost.`}
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
  // Selective selectors — never subscribe to the whole store. Prevents re-renders on
  // unrelated state mutations (ticker prices, RAF animations, lead list scrolls, etc).
  const lead = useStore(s => s.selectedLead);
  const [linkCopied, setLinkCopied] = useState(false);
  const setDetailOpen = useStore(s => s.setDetailOpen);
  const setSelectedLead = useStore(s => s.setSelectedLead);
  const previousPage = useStore(s => s.previousPage);
  const setPreviousPage = useStore(s => s.setPreviousPage);
  const setPage = useStore(s => s.setPage);
  const setAuditPrefill = useStore(s => s.setAuditPrefill);
  const getLeadAlpha = useStore(s => s.getLeadAlpha);
  const [tab, setTab] = useState('intelligence');
  const [coachingOutput, setCoachingOutput] = useState(null);
  const [coachingLoading, setCoachingLoading] = useState(false);
  // ── AI-generated per-lead outreach (replaces hardcoded templates on demand) ─
  const [aiScripts, setAiScripts] = useState(null);
  const [aiScriptsLoading, setAiScriptsLoading] = useState(false);
  const [aiScriptsError, setAiScriptsError] = useState(null);
  // ── Points of contact inside the business ──────────────────────────────────
  // The public Maps number reaches whoever is on the desk. This crawls the
  // prospect's own site for named people and direct lines so the operator can
  // ask for someone by name. On demand only — opening the Leads page must not
  // fire a crawl per row.
  const [contacts, setContacts] = useState(null);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState(null);

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

  // Safe defaults for fields that API/Apollo leads may be missing.
  //
  // NOTE ON ORDERING: safeObjections used to be declared above safePainPoints
  // while referencing it, which is a temporal dead zone. Apollo records carry no
  // `objections`, so the fallback array evaluated and threw
  // "Cannot access 'safePainPoints' before initialization" — crashing this whole
  // component for every live lead. Declare dependencies first.
  const dv = el.dealValue || el.value || 10000;

  // Real, business-specific call sheet derived from the record. The previous
  // fallbacks were generic B2B-SaaS filler ("Core CRM", "Email automation",
  // "Pipeline acceleration") that meant nothing to an HVAC contractor.
  const sheet = buildCallSheet(el);

  const safePainPoints = (el.painPoints && el.painPoints.length)
    ? el.painPoints
    : sheet.gaps.map(g => g.label);

  const safeCallScript = el.callScript || {
    opener: sheet.opener,
    discovery: sheet.discovery,
    pitch: sheet.pitch,
    close: sheet.close,
    valueProps: sheet.talkingPoints,
  };

  // Packages come from the tier this business actually qualifies for, priced
  // off PRICING rather than a percentage of an invented deal value.
  // The bundle this specific business needs, assembled from its own gaps —
  // a missing website and no after-hours answer are the two that move money,
  // so they lead. Deposit and monthly are both explicit: the operator has to
  // be able to quote the deal on the call without opening another tab.
  const tailored = buildPackage(el);
  const safePackages = el.packages || [
    {
      name: tailored.items.length > 1 ? 'Recommended Bundle' : 'Local Engine',
      price: tailored.deposit,
      monthly: tailored.monthly,
      features: tailored.items.map(i => `${i.name} — ${fmt(i.deposit)} + ${fmt(i.monthly)}/mo`),
      headline: tailored.headline,
      firstMonth: tailored.firstMonth,
      year1: tailored.year1,
      items: tailored.items,
      recommended: sheet.tier.id !== 'growth',
    },
    {
      name: 'Growth Engine', price: 10000, monthly: 2500,
      features: ['Everything in the bundle above', 'Outbound SDR campaign', 'Multi-channel outreach', 'Custom CRM integration', 'Weekly performance review'],
      firstMonth: 12500,
      year1: 40000,
      recommended: sheet.tier.id === 'growth',
    },
  ];

  const safeObjections = el.objections || sheet.objections;
  const firstName = (lead.name || '').split(' ')[0] || 'there';
  const painPoint1 = (safePainPoints[0] || 'scaling challenges').toLowerCase();
  const safeRanking = el.ranking || { overall: 50, byIndustry: 5, byPriority: 10, engagement: 'Medium', fitScore: 50, intentScore: 50 };
  const safeConversion = el.conversionProbability || Math.round((el.score || 50) * 0.6);
  const safeBuyingSignals = el.buyingSignals || lead.buyingSignals || [];

  const pc = priorityColors[lead.priority] || priorityColors.medium;

  const findContacts = useCallback(async () => {
    const site = el.website || el.domain;
    if (!site) { setContactsError('No website on record for this business.'); return; }
    setContactsLoading(true);
    setContactsError(null);
    try {
      const qs = new URLSearchParams({ action: 'enrich', website: site, company: el.company || '' });
      const res = await fetch(`/api/leads?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Lookup failed');
      if (!data.ok) throw new Error(data.reason || 'Nothing published on their site.');
      setContacts(data);
    } catch (e) {
      setContactsError(e.message || 'Could not read their site.');
    } finally {
      setContactsLoading(false);
    }
  }, [el.website, el.domain, el.company]);

  // Run it as soon as a lead is opened rather than waiting for a click. Every
  // other piece of lead data is derived on render, so the contacts panel was
  // the only thing that stayed blank until asked — the operator had no reason
  // to know there was anything behind the button.
  //
  // Deliberately per-lead and not per-row: firing this from the Leads table
  // would launch 25 site crawls on every page load.
  const contactsFetchedFor = useRef(null);
  useEffect(() => {
    const site = el.website || el.domain;
    const key = `${lead.id}|${site || ''}`;
    if (!site || contactsFetchedFor.current === key) return;
    contactsFetchedFor.current = key;
    setContacts(null);
    setContactsError(null);
    findContacts();
  }, [lead.id, el.website, el.domain, findContacts]);

  // ── Regenerate outreach with real AI, per-lead ──────────────────────────────
  const regenerateAIScripts = useCallback(async () => {
    setAiScriptsLoading(true);
    setAiScriptsError(null);
    try {
      const ctx = `Lead: ${lead.name}, ${lead.title} at ${lead.company} (${lead.industry}).
Employees: ${el.employees || 'unknown'}. Deal value: ${fmt(dv)}. Score: ${lead.score}.
Pain points: ${safePainPoints.join('; ')}.
Buying signals: ${safeBuyingSignals.join('; ') || 'none detected'}.
Competitor: ${lead.competitorUsing || 'none'}.
Revenue leak estimate: ${fmt(Math.round(dv * 0.15))}/mo (${fmt(Math.round(dv * 0.15 * 12))}/yr).
Best channel: ${el.bestMethod || 'phone'}.`;
      const prompt = `Generate SHARP, revenue-loss-first outreach for this specific lead. Format exactly:

1) **Cold Call Opener** — 15-second script, name the dollar amount in the first sentence
2) **Voicemail** — 20-second script, drop the numbers + a callback hook
3) **Follow-up Call** — for the second attempt, assume they half-remember you
4) **SMS** — 2 lines max, one question that gets a reply
5) **Breakup Call** — 20 seconds, give them a graceful out

Rules:
- Phone-first. Do NOT write email of any kind — we do not run email outreach.
- Cite the lead's exact pain points and dollar leak
- Zero marketing fluff
- No bullet padding
- If competitor exists, reference it on the follow-up, not the first call

Context:\n${ctx}`;
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await resp.json();
      if (data?.content) setAiScripts(data.content);
      else setAiScriptsError(data?.fallback ? 'AI unavailable — using template scripts below.' : 'No response. Try again.');
    } catch (e) {
      setAiScriptsError(`Generation failed: ${e.message}`);
    } finally {
      setAiScriptsLoading(false);
    }
  }, [lead, el, dv, safePainPoints, safeBuyingSignals]);

  // Degen Alpha Intel — per-lead intelligence (only computed when degen mode is on)
  const alphaIntel = getLeadAlpha(el);

  // ── GOATED Close Guide — step-by-step closing system ──────────────────────
  // NOTE: Demo data never auto-ticks. Step 1 is the anchor, rest are pending until
  // the operator actually works the deal. No gamification on seeded leads.
  // Quoted figures are used by the close steps below, so this has to be
  // declared before them — referencing it later was a temporal dead zone.
  const recQuote = recommendedPkgQuote(safePackages);
  // The close, as it actually runs for a local operator. The previous version
  // was enterprise-sales language — "Value Demonstration", "battle cards",
  // "competitor displacement", a proposal and a negotiation phase — for a call
  // to a plumber who decides in one conversation and has no procurement
  // process. Six steps, all of which happen on the phone.
  const closeSteps = [
    { step: 1, name: 'Two minutes of prep', status: 'current',
      desc: 'Read the listing before you dial. Their reviews tell you what to open with.',
      check: safePainPoints.length ? `Lead with: ${safePainPoints[0]}` : 'No obvious gap — open on missed-call math',
      action: el.mapsUrl ? 'Skim their recent reviews for complaints about reach or response time' : 'Check what they do and how big they are' },
    { step: 2, name: 'Dial and get the owner', status: 'pending',
      desc: 'Whoever answers is not who signs. Ask for the owner by role, not by name.',
      check: el.phone ? `Call ${formatPhone(el.phone)} — mid-morning or mid-afternoon` : 'No published number — walk in or message the listing',
      action: '"Hi, is the owner or manager around?" If not, ask when they are in and call back then.' },
    { step: 3, name: 'Make them say the number', status: 'pending',
      desc: 'Do not pitch. Ask questions until they tell you what a missed call costs them.',
      check: 'Get them to state their average job value out loud',
      action: '"What happens to a call that comes in while you are on a roof?" then "What is a job like that worth to you?"' },
    { step: 4, name: 'Quote it on the call', status: 'pending',
      desc: 'No proposal, no follow-up deck. They decide while you are on the phone.',
      check: `${fmt(recQuote.deposit)} deposit + ${fmt(recQuote.monthly)}/mo`,
      action: `"It is ${fmt(recQuote.deposit)} to set up and ${fmt(recQuote.monthly)} a month. If it books you one extra job a month it has paid for itself."` },
    { step: 5, name: 'Handle the one objection', status: 'pending',
      desc: 'It is almost always price, or "we already handle our calls fine".',
      check: 'Reframe against the cost of doing nothing, not against a competitor',
      action: safeObjections?.[0]?.response
        ? `Use: "${String(safeObjections[0].response).slice(0, 160)}"`
        : '"You are already paying for this — you are just paying it in jobs that went to whoever picked up."' },
    { step: 6, name: 'Book the setup', status: 'pending',
      desc: 'Get a date and a deposit while you are still on the phone. A "call me next week" is a no.',
      check: 'Card details taken and install date agreed',
      action: 'Then ask: "Who else in the trade should I be talking to?" Every close should produce two referrals.' },
  ];

  const completedSteps = 0; // demo data never auto-completes steps
  const closeConfidence = safeConversion; // base on lead quality, not fake progress

  const tabs = [
    { id: 'intelligence', label: 'Overview', icon: <BarChart3 size={15} /> },
    { id: 'closing', label: 'Close Guide', icon: <Target size={15} /> },
    { id: 'outreach', label: 'Outreach & Scripts', icon: <Brain size={15} /> },
  ];

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  const [showKeybindHint, setShowKeybindHint] = useState(true);

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
        e.preventDefault();
        goBack();
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
  }, [tab, tabs]);

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
        opener: `Hi, is the owner or manager around? I'm calling about ${lead.company}. I had a few thoughts I'd love your perspective on.`,
        discovery: safeCallScript.discovery.slice(0, 2),
        pitch: `We put an AI receptionist on the line that answers in under 60 seconds, qualifies the caller and books the job — so the calls arriving while you are on one stop going to whoever picks up next.`,
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
  const mapsLink = mapsLinkFor(el);
  const stack = recommendStack(el);
  const missed = estimateMissedRevenue(el);
  // Annual and ROI are both retainer-based: the deposit is a one-time build
  // cost, so folding it into a recurring-return multiple would overstate it.
  const recAnnualRetainer = recQuote.monthly * 12;
  const annualLeakNum = Math.round(dv * 0.15 * 12);
  const roiMultiple = recAnnualRetainer ? (annualLeakNum / recAnnualRetainer).toFixed(1) : null;

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
              <button onClick={() => { setTab('closing'); setTimeout(() => document.getElementById('close-guide-section')?.scrollIntoView({ behavior: 'smooth' }), 50); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/20 text-sm text-cyan-400 hover:bg-cyan-500/25 transition-colors">
                <Target size={14} /> Close Guide
              </button>
              <button onClick={() => { setTab('outreach'); setTimeout(() => document.getElementById('ai-coach-section')?.scrollIntoView({ behavior: 'smooth' }), 50); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/15 border border-purple-500/20 text-sm text-purple-400 hover:bg-purple-500/25 transition-colors">
                <Brain size={14} /> AI Coach
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.08] via-transparent to-cyan-500/[0.04]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Their premises, at a size you can actually read. Seeing the yard,
              the van and the signage tells you what kind of operation this is
              before you dial — which the 64px avatar never could. */}
          <ListingGallery lead={el} />
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
                {/* Initials, not the photo: the gallery above already shows the
                    premises at a useful size, and repeating it here at 64px
                    just said the same thing twice and worse. The ring is for
                    the score. */}
                <div className="w-16 h-16 rounded-xl bg-brand/15 flex items-center justify-center text-brand font-bold text-lg">
                  {initialsOf(lead.company || lead.name)}
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
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/25 flex items-center gap-1.5">
                  <TrendingDown size={12} /> Bleeding {fmt(Math.round(dv * 0.15))}/mo
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand/15 text-brand border border-brand/20">
                  Fit #{safeRanking.overall}
                </span>
                {/* Permalink. Keyed on the Google place id, so the link opens
                    this lead for someone whose browser has never run a search —
                    nothing about it depends on local storage. */}
                {placeIdOf(lead) && (
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(`${window.location.origin}/#/lead/${placeIdOf(lead)}`);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2400);
                    }}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08] transition flex items-center gap-1.5"
                  >
                    {linkCopied ? <CheckCircle2 size={11} /> : <Share2 size={11} />}
                    {linkCopied ? 'Link copied' : 'Share lead'}
                  </button>
                )}
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
              {/* Rebuilt on measured signals. The previous version read as an
                  analyst's brief and was almost entirely arithmetic on a
                  constant: annual revenue was dealValue x (8 + score % 7),
                  margins were 12 + score % 18, customer acquisition cost was
                  "inflated 20 + score % 15 percent above benchmark", and the
                  revenue leak was a flat $2,000 x 0.15 — the same $300/mo for
                  every business on the page. It also opened "{name} is {title}
                  at {company}", which for a Places record is the company name
                  twice and a null.

                  Everything below traces to a field: their own address, their
                  published hours, their review count and rating, and the
                  estimate we derive from review pace. The recommendation is the
                  same one the packages tab quotes. */}
              <p className="text-[13px] leading-relaxed text-slate-300">
                <span className="text-white font-medium">{el.company || lead.name}</span>
                {el.location ? <> in {el.location}</> : null}
                {el.industry && el.industry !== 'Unknown' ? <> — {el.industry.toLowerCase()}</> : null}.{' '}
                {el.reviewCount != null && (
                  <>{el.reviewCount === 0
                      ? <>No reviews on their listing at all. </>
                      : <><span className="text-white font-medium">{el.reviewCount.toLocaleString()}</span> review{el.reviewCount === 1 ? '' : 's'}
                          {el.rating ? <> at <span className="text-white font-medium">{el.rating}★</span></> : null}. </>}</>
                )}
                {el.activity?.label && <>{el.activity.label}{el.activity.why ? <> — {el.activity.why.replace(/\.$/, '')}</> : null}. </>}
                {el.revenueFormatted && (
                  <>Turnover looks like <span className="text-brand font-medium">{el.revenueFormatted}</span>, estimated from review pace against a typical job in their trade — a range, not a figure. </>
                )}
                {/* Where the money is going, sized against their own estimated
                    turnover rather than a flat multiple of a constant. Shown as
                    a range because the input is itself a range. */}
                {missed && (
                  <>Best guess, that is costing them{' '}
                  <span className="text-red-400 font-medium">{fmt(missed.lowMonthly)}–{fmt(missed.highMonthly)}/mo</span>
                  {' '}({missed.contributors.map(c => c.label.toLowerCase()).join('; ')}). </>
                )}
                {/* The recommendation, in the summary rather than a panel of its own. */}
                <span className="text-white font-medium">{stack.headline}.</span>{' '}
                {stack.summary}{' '}
                {stack.products.length > 0 && (
                  <>Quote <span className="text-white font-medium">{fmt(recQuote.deposit)}</span> plus{' '}
                  <span className="text-white font-medium">{fmt(recQuote.monthly)}</span>/mo. </>
                )}
                They decide on the call, not in a procurement cycle.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CONTACT INTEL + OUTREACH ACTIONS
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
        {/* ── Can we sell them a receptionist? ─────────────────────────────────
            Qualified from published opening hours, not assumed. Places returns
            structured open/close times, so the hours nobody is answering are
            arithmetic — we never have to ring the number to find out, and we
            never have to guess.

            When the listing says 24/7 we say so and turn it into a question
            rather than pretending the gap exists. */}
        {el.receptionist && (
          <div className={`rounded-2xl border p-5 mb-4 ${
            el.receptionist.qualified
              ? 'border-emerald-500/25 bg-emerald-500/[0.04]'
              : 'border-white/[0.06] bg-white/[0.02]'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                el.receptionist.qualified ? 'bg-emerald-500/15' : 'bg-white/[0.04]'}`}>
                <PhoneCall size={18} className={el.receptionist.qualified ? 'text-emerald-400' : 'text-slate-500'} />
              </div>
              <div className="min-w-0">
                <h3 className={`text-sm font-bold ${el.receptionist.qualified ? 'text-emerald-400' : 'text-slate-400'}`}>
                  AI Receptionist
                </h3>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {el.receptionist.qualified ? 'Qualified from their published hours' : 'Not supported by their hours'}
                </span>
              </div>
              {el.receptionist.qualified && (
                <span className="ml-auto shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  {el.receptionist.isEmergency ? 'P0 · EMERGENCY TRADE' : 'P1'}
                </span>
              )}
            </div>

            {el.receptionist.qualified && el.receptionist.uncoveredHoursPerWeek != null && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04] text-center">
                  <div className="text-lg font-bold text-white">{el.receptionist.openHoursPerWeek}h</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">Open / week</div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20 text-center">
                  <div className="text-lg font-bold text-emerald-400">{el.receptionist.uncoveredHoursPerWeek}h</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">Nobody answers</div>
                </div>
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04] text-center">
                  <div className="text-lg font-bold text-white">{el.receptionist.pctUncovered}%</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">Of the week</div>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed">{el.receptionist.why}</p>

            {el.receptionist.qualified ? (
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-400">
                  Quote <span className="text-white font-semibold">{quoteLine(el)}</span>
                </span>
                <button
                  onClick={() => {
                    const line = `"You're open ${el.receptionist.openHoursPerWeek} hours a week. What happens to the calls that come in during the other ${el.receptionist.uncoveredHoursPerWeek}?"`;
                    navigator.clipboard.writeText(line);
                    alert('Opening line copied to clipboard!');
                  }}
                  className="ml-auto flex items-center gap-1.5 px-3 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/25">
                  <Copy size={12} /> Copy the opener
                </button>
              </div>
            ) : (
              <p className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-slate-500">
                {el.website || el.domain
                  ? 'Lead with the review engine or their web presence instead.'
                  : 'Lead with the website build instead — that gap is real regardless of who answers the phone.'}
              </p>
            )}
          </div>
        )}

        {/* ── Points of contact inside the business ──────────────────────────
            The Maps number reaches the front desk. This surfaces named people
            and direct lines published on the prospect's own site, so the call
            can open with "is Dave around?" instead of a cold general enquiry.
            Everything shown is quoted from their pages; inferred first names
            are labelled as such rather than presented as fact. */}
        <div className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.03] p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
              <Users size={18} className="text-violet-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-violet-400">Points of Contact</h3>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Named people &amp; direct lines from their own site
              </span>
            </div>
            <button
              onClick={findContacts}
              disabled={contactsLoading || (!el.website && !el.domain)}
              className="ml-auto shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold hover:bg-violet-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {contactsLoading ? <><Timer size={13} className="animate-spin" /> Reading site…</>
                : <><Search size={13} /> Re-scan</>}
            </button>
          </div>

          {!el.website && !el.domain && (
            <p className="text-xs text-slate-500">
              No website on record, so there are no pages to read. The Maps number below is the only published line.
            </p>
          )}

          {contactsError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/[0.07] border border-amber-500/25">
              <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90">{contactsError}</p>
            </div>
          )}

          {contacts && (
            <div className="space-y-4">
              {contacts.people?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Named on their site</div>
                  <div className="space-y-1.5">
                    {contacts.people.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-sm text-white font-medium">{p.name}</span>
                        {p.role && <span className="text-xs text-slate-400">— {p.role}</span>}
                        <CopyBtn text={p.name} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contacts.probableNames?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                    Probable first names <span className="text-amber-400/70 normal-case tracking-normal">· inferred, not confirmed</span>
                  </div>
                  <div className="space-y-1.5">
                    {contacts.probableNames.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-sm text-white font-medium">{p.firstName}</span>
                        <span className="text-[10px] text-slate-500 font-mono truncate">from {p.evidence}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    Inferred from a named inbox. Worth trying — "is {contacts.probableNames[0].firstName} around?" — but don't state it as known.
                  </p>
                </div>
              )}

              {contacts.phones?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Numbers on their site</div>
                  <div className="space-y-1.5">
                    {contacts.phones.map((ph, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/15">
                        <PhoneCall size={13} className="text-emerald-400 shrink-0" />
                        <a href={`tel:${ph.number}`} className="text-sm text-white font-mono hover:text-emerald-300 transition-colors">{formatPhone(ph.number)}</a>
                        <span className="text-[10px] text-slate-500">{ph.source}</span>
                        {el.phone && ph.number.replace(/\D/g, '') !== el.phone.replace(/\D/g, '') && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold ml-auto shrink-0">
                            NOT THE MAPS LINE
                          </span>
                        )}
                        <CopyBtn text={formatPhone(ph.number)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!contacts.people?.length && !contacts.probableNames?.length && !contacts.phones?.length && (
                <p className="text-xs text-slate-500">
                  Read {(contacts.pagesFetched || []).join(', ') || 'their site'} — no names or direct numbers published.
                  Ask for the owner by role on the call.
                </p>
              )}

              <p className="text-[10px] text-slate-600 pt-1 border-t border-white/[0.04]">
                Quoted from {(contacts.pagesFetched || []).length} page(s) on {el.website || el.domain}.
                {contacts.partial && ' Stopped early — their site was slow, so this may be incomplete. Re-scan to try more pages.'}
              </p>
            </div>
          )}
        </div>

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
                <div className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${lead.phone ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {lead.phone ? 'Call Now' : 'Phone Unavailable'}
                </div>
                <div className="text-sm font-medium text-white font-mono tracking-wide">{lead.phone ? formatPhone(lead.phone) : 'No number on the listing'}</div>
                {lead.phone && <div className="text-[10px] text-slate-500 mt-0.5">Public line — tap to call</div>}
              </div>
            </a>
            {/* Email — rendered only when an address actually exists. Apollo's
                free plan returns company-level records, so lead.email is null
                for every one and this used to render as mailto:null. Outreach
                is phone-first and manual for now. */}
            {lead.email && (
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
            )}
            {/* Was a LinkedIn card. For a local owner-operator it linked to a
                people-search URL that almost never resolves to the right
                person, and LinkedIn is not a channel we run. Their reviews are
                what actually prepares you for the call — recent complaints are
                the opening. */}
            {el.mapsUrl && (
              <a href={`${el.mapsUrl}${el.mapsUrl.includes('?') ? '&' : '?'}hl=en`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl bg-blue-500/[0.08] border-2 border-blue-500/25 hover:bg-blue-500/15 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Star size={22} className="text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-blue-400 uppercase tracking-wider font-bold mb-1">Read Their Reviews</div>
                  <div className="text-base font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                    {el.reviewCount != null ? `${el.reviewCount} reviews${el.rating ? ` · ${el.rating}★` : ''}` : 'On Google Maps'}
                  </div>
                  <div className="text-[10px] text-blue-400/60 truncate">Complaints are the opening line</div>
                </div>
                <ExternalLink size={14} className="text-blue-400/50 shrink-0" />
              </a>
            )}
          </div>

          {/* Secondary Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Company Website — or, when there isn't one, the pitch.
                This used to render an <a> to "https://undefined" for every
                business without a site, which is exactly the segment we most
                want to sell a website to. */}
            {lead.website ? (
              <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-brand/[0.06] border border-brand/15 hover:bg-brand/10 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center shrink-0">
                  <Globe size={16} className="text-brand" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-brand uppercase tracking-wider font-semibold">Company Website</div>
                  <div className="text-sm text-white truncate group-hover:text-brand transition-colors">{lead.website}</div>
                </div>
                <ExternalLink size={12} className="text-brand/50 ml-auto shrink-0" />
              </a>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/[0.08] border border-amber-500/25">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                  <Globe size={16} className="text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">No Website</div>
                  <div className="text-sm text-white truncate">Lead with the build — {quoteLine(el, { includesBuild: true })}</div>
                </div>
              </div>
            )}
            {/* Location — links straight to the Google Maps listing when the
                lead came from Places, so the operator can read the reviews and
                photos before dialling. */}
            {mapsLink ? (
              <a href={mapsLink.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/[0.06] border border-orange-500/15 hover:bg-orange-500/10 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-orange-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-orange-400 uppercase tracking-wider font-semibold">
                    {mapsLink.exact ? 'Google Maps Listing' : 'Find on Google Maps'}
                  </div>
                  <div className="text-sm text-white truncate group-hover:text-orange-300 transition-colors">{lead.location || 'View listing'}</div>
                </div>
                <ExternalLink size={12} className="text-orange-400/50 ml-auto shrink-0" />
              </a>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/[0.06] border border-orange-500/15">
                <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-orange-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-orange-400 uppercase tracking-wider font-semibold">Location</div>
                  <div className="text-sm text-white truncate">{lead.location || 'Location unknown'}</div>
                </div>
              </div>
            )}
            {/* Their clock, and the review link.
                Local time because a cold call at 6am their time is a wasted
                lead, and the offset comes straight from the listing rather
                than being guessed from the address. The review link is the
                one artefact here a client can actually use: it is what they
                send customers to get reviewed, so it doubles as proof on the
                call that the review pitch is a real deliverable. */}
            {(el.utcOffsetMinutes != null || el.reviewLink) && (
              <div className="flex flex-wrap items-center gap-2">
                {el.utcOffsetMinutes != null && (() => {
                  const now = new Date(Date.now() + (el.utcOffsetMinutes + new Date().getTimezoneOffset()) * 60000);
                  const hr = now.getHours();
                  const businessHours = hr >= 8 && hr < 18;
                  return (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                      businessHours
                        ? 'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-300'
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400'}`}>
                      <Clock size={13} className="shrink-0" />
                      <span>
                        {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} their time
                        <span className="opacity-70">{businessHours ? ' · good time to call' : ' · outside business hours'}</span>
                      </span>
                    </div>
                  );
                })()}
                {el.reviewLink && (
                  <a href={el.reviewLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-slate-300 hover:bg-white/[0.05] transition">
                    <Star size={13} className="text-amber-400 shrink-0" />
                    Review link <span className="text-slate-500">— give this to the client</span>
                  </a>
                )}
              </div>
            )}

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
          {/* Was "LinkedIn Connect", which copied a message for a profile most
              of these owner-operators do not have. A brief they can paste into
              notes or a CRM is worth more. */}
          <button onClick={() => {
            const brief = [
              `${lead.company}${lead.location ? ` — ${lead.location}` : ''}`,
              el.phone ? `Phone: ${formatPhone(el.phone)}` : 'Phone: none published',
              el.website ? `Site: ${el.website}` : 'Site: NONE — lead with the build',
              el.rating != null ? `Reviews: ${el.reviewCount ?? 0} at ${el.rating}★` : null,
              el.activity?.label ? `Activity: ${el.activity.label} — ${el.activity.why}` : null,
              el.revenueFormatted ? `Est. revenue: ${el.revenueFormatted} (${el.revenueEstimate?.basis || 'estimated'})` : null,
              ``,
              `Gaps: ${safePainPoints.join(' · ') || 'none obvious — open on missed-call math'}`,
              `Quote: ${fmt(recQuote.deposit)} deposit + ${fmt(recQuote.monthly)}/mo`,
              ``,
              `Opener: ${safeCallScript.opener}`,
              el.mapsUrl ? `Maps: ${el.mapsUrl}` : null,
            ].filter(l => l !== null).join('\n');
            navigator.clipboard.writeText(brief);
            alert('Lead brief copied to clipboard!');
          }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-500/[0.06] border border-blue-500/15 hover:bg-blue-500/10 transition-colors group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={18} className="text-blue-400" />
            </div>
            <span className="text-xs font-semibold text-blue-400">Copy Lead Brief</span>
            <span className="text-[10px] text-slate-500">Everything in one paste</span>
          </button>
          {/* The audit and the leads page never spoke to each other, so arming
              a call with a report meant copying the URL and retyping it on
              another page. Only offered when they have a site to crawl. */}
          {(el.website || el.domain) && (
            <button onClick={() => {
              setAuditPrefill(el.website || el.domain);
              setPreviousPage('leads');
              setDetailOpen(false);
              setPage('audit');
            }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/15 hover:bg-amber-500/10 transition-colors group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Award size={18} className="text-amber-400" />
              </div>
              <span className="text-xs font-semibold text-amber-400">Audit Their Site</span>
              <span className="text-[10px] text-slate-500">Crawl it, price the gaps</span>
            </button>
          )}
          {/* Voicemail — replaces the old cold-email drafter. We don't run
              email outreach, and that button wrote a generic template that
              named no real signal from this business. */}
          <button onClick={() => {
            const vm = `VOICEMAIL — ${lead.company} (20 seconds)\n\n`
              + `"Hi, this is [your name] calling for the owner at ${lead.company}. `
              + `${tailored.headline}. `
              + `I put together the numbers on what that's costing you month to month — `
              + `takes two minutes to walk through. `
              + `Give me a call back on [your number]. Thanks."\n\n`
              + `[IF THEY CALL BACK — LEAD WITH]\n${safeCallScript.opener}`;
            navigator.clipboard.writeText(vm);
            alert('Voicemail script copied to clipboard!');
          }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-500/[0.06] border border-purple-500/15 hover:bg-purple-500/10 transition-colors group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Voicemail size={18} className="text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-purple-400">Voicemail Script</span>
            <span className="text-[10px] text-slate-500">Copy 20-second script</span>
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
            const sms = `Hi ${(lead.name || '').split(' ')[0]}, this is your GOATED closer from GOATED Solutions. I had a quick idea about how ${lead.company} could tackle ${safePainPoints[0]?.toLowerCase() || 'growth'}. Worth a 5-min chat? Let me know a good time.`;
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
                { day: 1, channel: 'Call', action: 'First dial — mid-morning', icon: PhoneCall, color: 'emerald',
                  detail: `Between jobs is when they pick up: 9-11am or 2-4pm, never 7-9am. "Hi, is the owner around? I'm calling about ${lead.company} — ${(safePainPoints[0] || 'the calls coming in after hours').toLowerCase()}. Worth two minutes?"` },
                { day: 1, channel: 'Voicemail', action: 'If no answer, leave one', icon: Voicemail, color: 'purple',
                  detail: `Twenty seconds, name the number, no pitch. "This is [name] — I looked at ${lead.company} and there's money going out the door on calls nobody picks up. Call me back on [number]."` },
                { day: 2, channel: 'SMS', action: 'Text the same number', icon: MessageSquare, color: 'cyan',
                  detail: `Texts get read when calls don't. "Hi — left you a voicemail about ${lead.company}. We stop missed calls turning into lost jobs. Want the two-minute version?"` },
                { day: 4, channel: 'Call', action: 'Second dial — different time', icon: PhoneCall, color: 'emerald',
                  detail: `If mid-morning failed, try late afternoon. Different hour, different person answering. Reference the voicemail: "I left a message Tuesday — did it reach you?"` },
                { day: 7, channel: 'Call', action: 'Last dial + close the loop', icon: PhoneCall, color: 'orange',
                  detail: `Give them the out. "I've tried a couple of times and I don't want to be a nuisance — if handling calls isn't a priority right now, just say so and I'll leave it." Permission-to-close often gets the real answer.` },
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
          QUICK NEXT STEP — Always-visible action bar
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-brand/[0.08] to-cyan-500/[0.05] border border-brand/15">
          <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center shrink-0">
            <Zap size={16} className="text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-brand uppercase tracking-wider font-bold">Next Step</div>
            <div className="text-sm text-slate-300 truncate">
              {lead.status === 'new' && `Research ${lead.company} and prepare ${el.bestMethod || 'outreach'} targeting "${safePainPoints[0]?.toLowerCase() || 'key pain points'}"`}
              {lead.status === 'contacted' && `Follow up with ${firstName} via ${el.bestMethod || 'phone'} — reference ${painPoint1}`}
              {lead.status === 'qualified' && `Schedule discovery call with ${firstName} — confirm budget and timeline`}
              {lead.status === 'proposal' && `Send proposal: ${fmt(dv)} deal with ${safePainPoints[0]?.toLowerCase() || 'core solution'} focus`}
              {lead.status === 'negotiation' && `Close this deal — handle objections and push for verbal commitment today`}
              {lead.status === 'won' && `Deal closed! Request referral and explore upsell opportunities`}
              {lead.status === 'lost' && `Re-engage in 30 days with fresh value prop targeting ${painPoint1}`}
              {!['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].includes(lead.status) && `Reach out to ${firstName} via ${el.bestMethod || 'phone'} with personalized value prop`}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-brand">{fmt(Math.round(dv * 0.12))}</span>
            <span className="text-[10px] text-slate-500">comm.</span>
          </div>
          <button onClick={() => setTab('closing')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-black text-xs font-bold hover:bg-brand/90 transition-colors shrink-0">
            <Target size={12} /> Close Guide
          </button>
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

        {/* ─── GOATED CLOSE GUIDE TAB ──────────────────────────────────────── */}
        {tab === 'closing' && (
          <div id="close-guide-section">
          <CloseGuideTab lead={lead} el={el} dv={dv} closeSteps={closeSteps} completedSteps={completedSteps}
            closeConfidence={closeConfidence} safeCallScript={safeCallScript} safePackages={safePackages}
            safeObjections={safeObjections} safePainPoints={safePainPoints}
            safeConversion={safeConversion} setTab={setTab} alphaIntel={alphaIntel} />
          </div>
        )}

        {/* ─── ALPHA INTEL TAB ─────────────────────────────────────────────── */}

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
                  <span className="text-sm font-bold text-purple-400">
                    {el.activity?.label || (el.lastReviewDays != null ? `${el.lastReviewDays}d ago` : 'Unknown')}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">Last activity</span>
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
                {/* Email row — same gating as the action tile above. */}
                {lead.email && (
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
                )}
                {/* Phone */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <Phone size={15} className="text-slate-500" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Phone</div>
                      {lead.phone ? (
                        <a href={`tel:${(lead.phone || '').replace(/[^+\d]/g, '')}`} className="text-sm text-brand hover:text-white transition-colors cursor-pointer font-mono">{formatPhone(lead.phone)}</a>
                      ) : (
                        <span className="text-sm text-slate-500">Enrich to unlock</span>
                      )}
                    </div>
                  </div>
                  {lead.phone && <CopyBtn text={formatPhone(lead.phone)} />}
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
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(`"${el.company}" owner OR president ${el.location || ''}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors">
                    <Search size={12} />
                    Find the owner
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
                {/* Headcount and revenue are Apollo fields — null for every
                    business sourced from Places, so both tiles read "N/A" on
                    the leads we actually work. Falls back to the signals we do
                    hold rather than showing an empty slot. */}
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    {lead.employees ? 'Employees' : 'Reviews'}
                  </div>
                  <div className="text-lg font-bold mt-1">
                    {lead.employees
                      ? lead.employees.toLocaleString()
                      : (el.reviewCount != null ? `${el.reviewCount}${el.rating ? ` · ${el.rating}★` : ''}` : '—')}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    {lead.revenue ? 'Revenue' : 'Est. revenue'}
                  </div>
                  <div className="text-lg font-bold mt-1">
                    {lead.revenue ? fmt(lead.revenue) : (el.revenueFormatted || '—')}
                  </div>
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

        {/* ─── SCRIPTS & PLAYS (merged into outreach tab) ──────────────────── */}
        {tab === 'outreach' && (
          <div id="ai-coach-section" className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Phone size={18} className="text-brand" /> Ranked Approaches
            </h2>

            {/* ── AI Per-Lead Regen ─────────────────────────────────────────── */}
            <GlassCard highlight>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-brand" />
                    <h3 className="text-sm font-bold">Generate fresh scripts for {lead.company}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    The templates below are pattern-scaffolds. Hit the button to have Claude rewrite all 5 channels using {lead.company}'s exact pain points and {fmt(Math.round(dv * 0.15))}/mo revenue leak.
                  </p>
                </div>
                <button
                  onClick={regenerateAIScripts}
                  disabled={aiScriptsLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-black font-semibold text-sm hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
                >
                  {aiScriptsLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain size={14} /> {aiScripts ? 'Regenerate' : 'Generate AI Scripts'}
                    </>
                  )}
                </button>
              </div>
              {aiScriptsError && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {aiScriptsError}
                </div>
              )}
              {aiScripts && (
                <div className="mt-4 p-4 rounded-lg bg-black/40 border border-brand/20 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-brand font-bold">AI-Tailored · Per-Lead</span>
                    <CopyBtn text={aiScripts} />
                  </div>
                  <pre className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">{aiScripts}</pre>
                </div>
              )}
            </GlassCard>

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

        {/* ─── AI COACH (also renders in outreach tab, below scripts) ────────── */}
        {tab === 'outreach-coach' && (
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
                      Lead with the <span className="text-brand font-medium">{fmt(recQuote.deposit)} deposit + {fmt(recQuote.monthly)}/mo</span> on the {safePackages.find(p => p.recommended)?.name || 'Growth'} package.
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

        {/* ─── PACKAGES & PRICING (shown in Close Guide tab) ─────────────────── */}
        {tab === 'closing' && (
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
                    {pkg.headline && (
                      <p className="text-[11px] text-slate-400 mt-1 px-2">{pkg.headline}</p>
                    )}
                    {/* Deposit and retainer are separate numbers. This used to
                        render the setup fee with a "/mo" suffix, so a $2,000
                        one-time deposit was quoted as $2,000 every month. */}
                    <div className="mt-3">
                      <span className="text-3xl font-bold">{fmt(pkg.price)}</span>
                      <span className="text-slate-500 text-sm"> deposit</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-xl font-bold text-brand">{fmt(pkg.monthly)}</span>
                      <span className="text-slate-500 text-sm">/mo retainer</span>
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
                <Calculator size={16} className="text-brand" /> What You're Quoting
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Deposit</div>
                  <div className="text-2xl font-bold text-white">{fmt(recQuote.deposit)}</div>
                  <div className="text-xs text-slate-500 mt-1">one time, up front</div>
                </div>
                <div className="p-4 rounded-xl bg-brand/[0.08] border border-brand/20 text-center">
                  <div className="text-[10px] text-brand uppercase tracking-wider mb-2">Monthly Retainer</div>
                  <div className="text-2xl font-bold text-brand">{fmt(recQuote.monthly)}</div>
                  <div className="text-xs text-slate-500 mt-1">{recommendedPkg?.name}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Annual Retainer</div>
                  <div className="text-2xl font-bold text-white">{fmt(recAnnualRetainer)}</div>
                  <div className="text-xs text-slate-500 mt-1">12 × monthly</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Their ROI</div>
                  <div className="text-2xl font-bold text-white">{roiMultiple ? `${roiMultiple}x` : '—'}</div>
                  <div className="text-xs text-slate-500 mt-1">recovered vs retainer</div>
                </div>
              </div>
              {roiMultiple && (
                <p className="text-xs text-slate-500 mt-4 text-center">
                  Against an estimated {fmt(annualLeakNum)}/yr in missed-call revenue, the {fmt(recAnnualRetainer)}/yr
                  retainer returns about {roiMultiple}x. Deposit is excluded — it's a one-time build cost, not recurring.
                </p>
              )}
            </GlassCard>
          </div>
        )}

        {/* ─── ACTIVITY (shown in Intelligence/Overview tab) ───────────────── */}
        {tab === 'intelligence' && (
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
                    <div className="text-xl font-bold text-purple-400">
                      {el.activity?.label || 'Activity unknown'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {el.activity?.why || 'No dated reviews to check recency against'}
                    </div>
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
                    action: `Call and ask for the owner — open on "${safePainPoints[0] || 'the calls going unanswered'}"`,
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
          KEYBIND HINT BAR
      ═══════════════════════════════════════════════════════════════════════ */}
      {showKeybindHint && (
        <div className="fixed bottom-0 right-0 left-16 md:left-16 z-[60] bg-surface-0/95 backdrop-blur-xl border-t border-white/[0.06] pointer-events-auto">
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
