// =============================================================================
// GOATED — Managed Service Page
// -----------------------------------------------------------------------------
// Application-only. No pricing exposed. Terms scoped on the call.
// Tiers reframed as tracks (Starter / Pro / Elite) with shape only.
// =============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Sparkles, Check, Crown, Phone, MessageSquare, Bot, ShoppingBag,
  Award, Globe, Zap, Users, Mail, BarChart3, Shield, Clock, Rocket,
  DollarSign, Star, Flame, ExternalLink, Target, TrendingUp, Calendar,
  Lock, User, Building2, AlertTriangle, CheckCircle2, Send,
} from 'lucide-react';
import { useStore } from '../hooks/useStore';
import {
  CAL_MANAGED_URL, CAL_FALLBACK_MAILTO, CONTACT_EMAIL,
  calEmbedUrl, CAL_EVENT_MANAGED,
} from '../lib/config';

// ─── Sub-components ─────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: 'easeOut' },
};

// ─── Tracks (shape only, NO pricing) ─────────────────────────────────────────
const TRACKS = {
  starter: {
    label: 'Starter',
    fit: 'Solo founders, local service biz, $10K–$50K MRR',
    shape: 'Voice + SMS rail, one channel firing, monthly review',
    perks: [
      'AI voice agent (Vapi) — batched dials on your list',
      'SMS reactivation on 90-day no-responders',
      'Cal.com booking funnel wired to your calendar',
      'Live audit + 90-day fix plan',
      'Monthly async review loom',
    ],
  },
  pro: {
    label: 'Pro',
    recommended: true,
    fit: 'Scaling agencies + B2B teams, $50K–$250K MRR',
    shape: 'Full stack — voice + SMS + LinkedIn, weekly calls, live Slack',
    perks: [
      'Everything in Starter',
      'LinkedIn DMs via Unipile (throttled, human-tone)',
      'Missed-call-to-SMS rescue in 60 seconds',
      'Custom chatbot trained on your live site crawl',
      'Weekly live strategy call',
      'Priority Slack channel with same-day replies',
    ],
  },
  elite: {
    label: 'Elite',
    fit: 'Enterprise + venture-backed, $250K+ MRR, complex stacks',
    shape: 'Done-with-you + dedicated human AE + custom engineering',
    perks: [
      'Everything in Pro',
      'Dedicated outbound AE (human-in-the-loop)',
      'Custom integrations (CRM, legacy booking, payments)',
      'Programmatic SEO engine',
      'Review response automation',
      'Bi-weekly co-working sprints',
    ],
  },
};

function TrackCard({ trackKey, track, selected, onSelect }) {
  return (
    <motion.button
      {...fadeUp}
      type="button"
      onClick={() => onSelect(trackKey)}
      className={`relative rounded-2xl p-6 flex flex-col text-left border transition-all hover:-translate-y-0.5 ${
        selected
          ? 'border-brand bg-brand/[0.08] shadow-[0_0_0_1px_rgba(0,255,136,0.35)]'
          : track.recommended
            ? 'border-brand/40 bg-gradient-to-b from-brand/[0.04] to-transparent hover:border-brand/60'
            : 'border-white/10 bg-surface-2/40 hover:border-white/20'
      }`}
    >
      {track.recommended && !selected && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand text-black text-[10px] font-black tracking-wider uppercase flex items-center gap-1">
          <Crown size={11} /> Most Picked
        </div>
      )}
      {selected && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand text-black text-[10px] font-black tracking-wider uppercase flex items-center gap-1">
          <CheckCircle2 size={11} /> Selected
        </div>
      )}
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">
        Track
      </div>
      <div className="text-3xl font-black text-white mb-2">{track.label}</div>
      <div className="text-xs text-brand font-semibold mb-1 uppercase tracking-wider">Fit</div>
      <div className="text-sm text-slate-300 mb-3">{track.fit}</div>
      <div className="text-xs text-brand font-semibold mb-1 uppercase tracking-wider">Shape</div>
      <div className="text-sm text-slate-400 mb-4 leading-relaxed">{track.shape}</div>

      <div className="pt-3 border-t border-white/[0.05]">
        <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2 font-bold">What's inside</div>
        <ul className="space-y-2 mb-5">
          {track.perks.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <Check size={15} className="text-brand flex-shrink-0 mt-0.5" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-3 border-t border-white/[0.05] flex items-center gap-2">
        <Lock size={12} className="text-slate-600" />
        <span className="text-[11px] text-slate-500">Pricing scoped on the call</span>
      </div>
    </motion.button>
  );
}

function IncludedCard({ icon: Icon, title, desc, color = '#00ff88' }) {
  return (
    <motion.div
      {...fadeUp}
      className="rounded-xl border border-white/10 bg-surface-2/30 p-5 hover:border-white/20 transition-colors"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
        style={{ background: `${color}18` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div className="text-sm font-bold text-white mb-1">{title}</div>
      <div className="text-xs text-slate-400 leading-relaxed">{desc}</div>
    </motion.div>
  );
}

function UpsellRow({ icon: Icon, name, desc }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/[0.05] last:border-0">
      <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{name}</div>
        <div className="text-xs text-slate-500 truncate">{desc}</div>
      </div>
      <Lock size={12} className="text-slate-700 flex-shrink-0" />
    </div>
  );
}

function StepCard({ n, title, desc }) {
  return (
    <motion.div {...fadeUp} className="relative pl-12">
      <div className="absolute left-0 top-0 w-9 h-9 rounded-full border-2 border-brand/40 bg-brand/10 text-brand font-bold flex items-center justify-center text-sm">
        {n}
      </div>
      <div className="text-sm font-bold text-white mb-1">{title}</div>
      <div className="text-xs text-slate-400 leading-relaxed">{desc}</div>
    </motion.div>
  );
}

// ─── FAQ data (no pricing disclosures) ────────────────────────────────────────
const FAQ = [
  {
    q: 'How does pricing work?',
    a: 'Every engagement is scoped on the qualification call. Setup + retainer + rev-share are the three levers, and they get tuned to the actual deal shape. We don\'t publish rates because a $10K/mo local shop and a $1M/mo SaaS don\'t belong on the same pricing page.',
  },
  {
    q: 'What if the AI agent doesn\'t book any meetings?',
    a: 'Month 2 retainer is halved if we don\'t book at least 5 qualified meetings in month 1. We don\'t keep clients we can\'t move. The rev-share means we only win when you win.',
  },
  {
    q: 'Do you handle my outreach scripts, or do I?',
    a: 'We write them, you approve them. Every script is AI-drafted from your live audit signals then tuned with you on a 30-min working call before any dial goes out.',
  },
  {
    q: 'Is this HIPAA / SOC 2 / compliant?',
    a: 'Voice + SMS outbound is TCPA + DNC compliant by default — we scrub against the national DNC before every batch and respect state-level restrictions. Full HIPAA coverage is a P1 line item, ask on discovery.',
  },
  {
    q: 'What if I already have Apollo / HubSpot / Salesforce?',
    a: 'We integrate. That\'s the point. The whole stack is booking rails + voice/SMS + LinkedIn, on top of whatever CRM you already pay for.',
  },
  {
    q: 'Can I cancel?',
    a: 'Yes. 30-day notice on the retainer. Setup deposit is non-refundable after the audit + script pack is delivered (typically 7 days in).',
  },
  {
    q: 'Is this application-only?',
    a: 'Yes. We take 3–5 new clients a quarter. If we can\'t move the needle on your pipeline inside 90 days, we pass rather than take your deposit. That gatekeeping is what makes the rev-share math work.',
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ManagedPage() {
  const setPage = useStore(s => s.setPage);
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState('pro');
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    url: '',
    revenue: '',
    goal: '',
    timeline: '3m',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const runAudit = useCallback(() => {
    setPage('audit');
    window.scrollTo({ top: 0 });
  }, [setPage]);

  const onField = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      // Best-effort POST to /api/managed-apply. If not yet provisioned,
      // fall back to a mailto: the email has all context in the body.
      const payload = {
        ...form,
        track: selectedTrack,
        source: 'managed-page',
        submittedAt: new Date().toISOString(),
      };
      let ok = false;
      try {
        const res = await fetch('/api/managed-apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        ok = res.ok;
      } catch { ok = false; }

      if (!ok) {
        // Server endpoint not ready — open mailto with the full payload
        const subject = `Managed Service Application — ${form.company || form.name} (${selectedTrack})`;
        const body = [
          `Track: ${selectedTrack}`,
          `Name: ${form.name}`,
          `Email: ${form.email}`,
          `Company: ${form.company}`,
          `URL: ${form.url}`,
          `Revenue band: ${form.revenue}`,
          `Timeline: ${form.timeline}`,
          '',
          'Goal:',
          form.goal,
        ].join('\n');
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err?.message || 'Something went sideways. Email us at ' + CONTACT_EMAIL);
    } finally {
      setSubmitting(false);
    }
  }, [form, selectedTrack, submitting]);

  const canSubmit = form.name.trim() && form.email.trim() && form.company.trim() && form.url.trim() && form.goal.trim().length > 10;

  return (
    <div className="relative min-h-screen bg-surface-0">
      {/* Ambient glow */}
      <div
        className="fixed inset-x-0 top-0 h-[500px] pointer-events-none opacity-50 -z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(0,255,136,0.15) 0%, rgba(0,255,136,0.05) 30%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-20">
        {/* ═══ HERO ═════════════════════════════════════════════════════════ */}
        <motion.section {...fadeUp} className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-[11px] font-bold tracking-wider uppercase">
            <Flame size={12} /> Managed Service · Application-only
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight max-w-4xl mx-auto">
            We run the whole{' '}
            <span className="bg-gradient-to-r from-brand via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              outbound machine
            </span>{' '}
            for you.
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Voice + SMS + LinkedIn — zero email — fired at every dormant lead, missed buyer, and
            no-show on your list. You apply, we scope, you sign, we deploy. Calls go out in 72 hours.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Lock size={14} className="text-brand" /> Pricing scoped on the call
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5">
              <Shield size={14} className="text-brand" /> TCPA + DNC compliant
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-brand" /> Live in 72 hours
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a href="#apply" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-black font-bold text-sm hover:bg-emerald-400 transition-colors">
              <Send size={16} /> Apply now
            </a>
            <button
              onClick={runAudit}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] text-white font-bold text-sm hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
            >
              <Sparkles size={16} /> Run free audit first
            </button>
          </div>
        </motion.section>

        {/* ═══ WHAT'S INCLUDED ══════════════════════════════════════════════ */}
        <motion.section {...fadeUp} className="space-y-6">
          <div className="text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand mb-1">
              The Machine
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              What actually gets deployed
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <IncludedCard icon={Phone} title="AI Voice Agent" desc="Vapi-powered, trained on your audit. Dials every dormant lead, missed buyer, no-show. Books directly into your Cal.com." color="#f59e0b" />
            <IncludedCard icon={MessageSquare} title="SMS Rail" desc="Twilio. Pre-call warm-up, post-call follow-up, missed-call rescue in 60 seconds. TCPA-clean." color="#06b6d4" />
            <IncludedCard icon={Users} title="LinkedIn Outreach" desc="Unipile API. Warm-signal DMs, connection requests, InMail. Human tone, throttled safely under LI limits." color="#3b82f6" />
            <IncludedCard icon={Calendar} title="Booking Rail" desc="Cal.com embed + custom event types. Every positive response from any channel hits the same confirmed-slot funnel." color="#a855f7" />
            <IncludedCard icon={Target} title="Live Audit Engine" desc="Every prospect is pre-scanned with /api/audit — tech stack, CTAs, revenue leaks — so the script opens on their actual pain." color="#00ff88" />
            <IncludedCard icon={Bot} title="Per-Client LLM" desc="Groq Llama 3.3 70B primary, Claude 3.5 fallback. Every script + reply is tuned to the target's vertical and objection profile." color="#ec4899" />
            <IncludedCard icon={BarChart3} title="Revenue Attribution" desc="Stripe Connect + webhook ledger. Every closed deal tagged to the channel that sourced it. Platform split runs automatically." color="#10b981" />
            <IncludedCard icon={Shield} title="Compliance Layer" desc="National DNC scrub before every batch. State-level restrictions enforced. Auto-suppression on opt-outs. Recording consent baked in." color="#ef4444" />
          </div>
        </motion.section>

        {/* ═══ TRACKS (no pricing) ══════════════════════════════════════════ */}
        <motion.section {...fadeUp} className="space-y-6">
          <div className="text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand mb-1">
              Pick a track
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Three shapes. One engine.</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
              Pricing is scoped on your qualification call — a $10K/mo local shop and a $1M/mo SaaS
              don&apos;t belong on the same pricing page. Pick the shape that fits, we&apos;ll do the math with you live.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
            {Object.entries(TRACKS).map(([k, t]) => (
              <TrackCard
                key={k}
                trackKey={k}
                track={t}
                selected={selectedTrack === k}
                onSelect={setSelectedTrack}
              />
            ))}
          </div>
          <div className="text-center text-xs text-slate-500 pt-2">
            Every track: setup + monthly retainer + rev-share. All three levers tuned on the call.
          </div>
        </motion.section>

        {/* ═══ HOW IT WORKS ═════════════════════════════════════════════════ */}
        <motion.section {...fadeUp} className="space-y-6">
          <div className="text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand mb-1">
              The 72-Hour Ramp
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">How an engagement starts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
            <StepCard n="1" title="Application" desc="Fill the form below. We read every one in under 24h. No application fee. If you&apos;re not a fit we&apos;ll tell you and route you to self-serve." />
            <StepCard n="2" title="Qualification call" desc="30-min Zoom — we walk through your audit, you tell us your actual pipeline, we scope the tier + pricing live." />
            <StepCard n="3" title="Deposit + onboarding" desc="Stripe link lands in your inbox same day. Pay, kickoff call inside 24h. We spin up Vapi / Twilio / Cal." />
            <StepCard n="4" title="Calls go out" desc="Hour 72: first batch of outbound voice + SMS + LinkedIn fires. First meetings on your calendar by day 7." />
          </div>
        </motion.section>

        {/* ═══ UPSELL STACK (expanded, no prices) ═══════════════════════════ */}
        <motion.section {...fadeUp} className="space-y-6">
          <div className="text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand mb-1">
              Stack the wins
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Add-ons that print</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
              Voice is the anchor. Every one of these has shipped a client to 10× in 90 days on its
              own. Stack them and it compounds. Pricing bundles with your track on the call.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0 max-w-5xl mx-auto">
            <div>
              <UpsellRow icon={MessageSquare} name="SMS reactivation" desc="90-day no-responder list hit with a 2-touch sequence" />
              <UpsellRow icon={Phone} name="Missed-call rescue" desc="Every missed call replied via SMS in 60 seconds" />
              <UpsellRow icon={ShoppingBag} name="Abandoned-cart recovery" desc="Ecom: SMS + voice on carts over $X, within 15 min" />
              <UpsellRow icon={Bot} name="Website chatbot" desc="Grounded on your live site crawl, books to your cal" />
              <UpsellRow icon={Award} name="Review automation" desc="Google + Yelp + Trustpilot — AI replies, flag for humans" />
              <UpsellRow icon={Globe} name="Programmatic SEO" desc="Auto-generate location / feature / comparison pages" />
              <UpsellRow icon={Zap} name="AI ads copy generator" desc="Weekly Meta / Google refresh from best-converting patterns" />
              <UpsellRow icon={DollarSign} name="Pricing optimization" desc="Scrape competitors, recommend price + positioning moves" />
              <UpsellRow icon={Users} name="Referral program" desc="Widget + SMS share + tracked payouts" />
              <UpsellRow icon={Mail} name="Transactional email rescue" desc="SPF / DKIM / DMARC + Resend migration — receipts-only" />
            </div>
            <div>
              <UpsellRow icon={BarChart3} name="Analytics + tracking" desc="GA4 + Meta pixel + conversion events, wired + QA'd" />
              <UpsellRow icon={Target} name="Competitor displacement" desc="Alerts when their rivals raise / hire — you call first" />
              <UpsellRow icon={TrendingUp} name="Churn rescue" desc="Churn risk signals + auto voice/SMS before they cancel" />
              <UpsellRow icon={Crown} name="VIP whale program" desc="Tiered treatment for your top 5% — dedicated AM + offers" />
              <UpsellRow icon={Calendar} name="Event sales engine" desc="Webinar / summit outbound — voice + SMS + LI for ticket sales" />
              <UpsellRow icon={Sparkles} name="Content repurposing" desc="Podcast/Video → 30 LinkedIn clips + newsletters weekly" />
              <UpsellRow icon={Shield} name="Reputation firewall" desc="Monitor + auto-respond to low stars, escalate to humans" />
              <UpsellRow icon={Building2} name="Investor outbound" desc="Warm-signal VC/angel DMs off your actual traction metrics" />
              <UpsellRow icon={User} name="Executive ghostwriting" desc="Your LinkedIn feed turned into a daily inbound machine" />
              <UpsellRow icon={Rocket} name="Launch campaigns" desc="Product launch / new-location blitz — 3-channel coordinated" />
            </div>
          </div>
        </motion.section>

        {/* ═══ PILOT / SOCIAL PROOF ═════════════════════════════════════════ */}
        <motion.section {...fadeUp} className="relative rounded-3xl border border-brand/20 bg-gradient-to-br from-brand/[0.06] via-surface-2/40 to-cyan-500/[0.04] p-8 sm:p-10 overflow-hidden">
          <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
          <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand mb-2">
                Pilot Program · Limited to 2 Pro slots · Closes May 31 &apos;26
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
                First 2 Pro pilots get a co-founder seat.
              </h3>
              <p className="text-sm text-slate-400 max-w-lg">
                Reduced rev-share for the first 6 months, every new add-on we ship during the pilot
                shipped to you free, and a direct line to me on Slack. Exact pilot terms disclosed on
                the call — not here.
              </p>
            </div>
            <a
              href="#apply"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-black font-bold text-sm hover:bg-emerald-400 transition-colors whitespace-nowrap"
            >
              <Rocket size={16} /> Claim a pilot slot
            </a>
          </div>
        </motion.section>

        {/* ═══ APPLICATION FORM ═════════════════════════════════════════════ */}
        <motion.section {...fadeUp} id="apply" className="scroll-mt-8">
          <div className="rounded-3xl border border-brand/20 bg-gradient-to-b from-brand/[0.04] to-transparent p-6 sm:p-10 max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand mb-1">
                Apply for Managed
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Tell us the shape.</h2>
              <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
                We review every application within 24 hours. If we can&apos;t move the needle on your
                pipeline inside 90 days, we&apos;ll tell you — and route you to self-serve instead.
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-brand/15 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-brand" />
                </div>
                <h3 className="text-xl font-black text-white">Application received.</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  We&apos;ll respond within 24 hours with next steps or a pass. If you want to fast-track,
                  grab a qualification slot on the calendar below.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <a href="#book" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-black font-bold text-sm hover:bg-emerald-400 transition-colors">
                    <Calendar size={14} /> Book qualification call
                  </a>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', company: '', url: '', revenue: '', goal: '', timeline: '3m' }); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-zinc-300 border border-white/10 text-sm hover:bg-white/10 transition-colors"
                  >
                    Submit another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                {/* Track selector echo */}
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-black/30 border border-white/5 text-sm">
                  <span className="text-slate-500">Applying for:</span>
                  <div className="flex gap-1.5">
                    {Object.entries(TRACKS).map(([k, t]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setSelectedTrack(k)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          selectedTrack === k
                            ? 'bg-brand text-black'
                            : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full name" required>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={onField('name')}
                      placeholder="Your name"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand/50 transition-colors"
                    />
                  </Field>
                  <Field label="Work email" required>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={onField('email')}
                      placeholder="you@company.com"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand/50 transition-colors"
                    />
                  </Field>
                  <Field label="Company" required>
                    <input
                      type="text"
                      required
                      value={form.company}
                      onChange={onField('company')}
                      placeholder="Acme Co."
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand/50 transition-colors"
                    />
                  </Field>
                  <Field label="Website" required>
                    <input
                      type="url"
                      required
                      value={form.url}
                      onChange={onField('url')}
                      placeholder="https://..."
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand/50 transition-colors"
                    />
                  </Field>
                  <Field label="Monthly revenue range" required>
                    <select
                      required
                      value={form.revenue}
                      onChange={onField('revenue')}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 transition-colors"
                    >
                      <option value="">Select a range</option>
                      <option value="pre-revenue">Pre-revenue / launching</option>
                      <option value="0-10k">$0 – $10K / mo</option>
                      <option value="10-50k">$10K – $50K / mo</option>
                      <option value="50-250k">$50K – $250K / mo</option>
                      <option value="250k-1m">$250K – $1M / mo</option>
                      <option value="1m+">$1M+ / mo</option>
                    </select>
                  </Field>
                  <Field label="When do you want to go live?" required>
                    <select
                      required
                      value={form.timeline}
                      onChange={onField('timeline')}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 transition-colors"
                    >
                      <option value="asap">ASAP — this week</option>
                      <option value="1m">Within 30 days</option>
                      <option value="3m">1–3 months</option>
                      <option value="exploring">Just exploring</option>
                    </select>
                  </Field>
                </div>

                <Field label="What are you actually trying to fix?" required>
                  <textarea
                    required
                    value={form.goal}
                    onChange={onField('goal')}
                    rows={4}
                    placeholder="One paragraph. What&apos;s leaking? What have you tried? What would winning look like in 90 days?"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand/50 transition-colors resize-none"
                  />
                  <p className="text-[11px] text-zinc-600 mt-1">Min 10 chars. The more specific, the faster we scope.</p>
                </Field>

                {submitError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                    <Lock size={12} /> We read every one personally. 24h response.
                  </div>
                  <button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-black font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>Submitting…</>
                    ) : (
                      <><Send size={14} /> Submit application <ArrowRight size={14} /></>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.section>

        {/* ═══ CAL.COM EMBED ════════════════════════════════════════════════ */}
        <motion.section {...fadeUp} id="book" className="space-y-4 scroll-mt-8">
          <div className="text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand mb-1">
              Fast-track
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Or just grab a slot</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
              45-min qualification call. We walk your audit, scope the track, and land a Stripe link
              in your inbox before we hang up.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
            <iframe
              src={calEmbedUrl(CAL_EVENT_MANAGED, { source: 'managed-page' })}
              className="w-full"
              style={{ height: 720, border: 0 }}
              title="Book a qualification call"
              loading="lazy"
            />
          </div>
          <div className="text-center text-xs text-slate-500">
            Can&apos;t see the calendar? <a href={CAL_MANAGED_URL} target="_blank" rel="noopener" className="text-brand hover:underline">Open it directly</a>
            {' · '}
            or <a href={CAL_FALLBACK_MAILTO} className="text-brand hover:underline">email us</a>.
          </div>
        </motion.section>

        {/* ═══ CONTINGENCY / DEVIL'S ADVOCATE ══════════════════════════════ */}
        <motion.section {...fadeUp} className="space-y-6">
          <div className="text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand mb-1">
              Devil&apos;s Advocate
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">What if it doesn&apos;t work?</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
              We&apos;re not pretending every engagement works. Here&apos;s what actually happens when it
              doesn&apos;t — on our side, not yours.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <ContingencyCard
              icon={AlertTriangle}
              title="No meetings in Month 1"
              desc="Retainer drops 50% for Month 2. We re-tune the script, swap the list, or pivot the channel mix. If Month 2 still doesn&apos;t book 5+ qualified meetings, we refund the retainer differential and part ways cleanly."
              color="#f59e0b"
            />
            <ContingencyCard
              icon={Shield}
              title="Compliance flag"
              desc="Carrier flags SMS or TCPA complaint lands? We pause instantly, audit the list against DNC + state restrictions, and re-file. You don&apos;t pay for paused days. Insurance is included at the Elite tier."
              color="#ef4444"
            />
            <ContingencyCard
              icon={TrendingUp}
              title="Channel saturation"
              desc="If voice/SMS hit diminishing returns, we pivot to programmatic SEO, referral engine, or investor outbound — whatever your vertical actually responds to. Add-ons can be swapped mid-engagement."
              color="#06b6d4"
            />
          </div>
        </motion.section>

        {/* ═══ FAQ ══════════════════════════════════════════════════════════ */}
        <motion.section {...fadeUp} className="space-y-4 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand mb-1">
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">The short answers</h2>
          </div>
          <div className="space-y-2 pt-4">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={i} className="rounded-xl border border-white/10 bg-surface-2/30 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-sm font-semibold text-white">{item.q}</span>
                    <ArrowRight
                      size={16}
                      className={`text-slate-500 flex-shrink-0 transition-transform ${
                        open ? 'rotate-90 text-brand' : ''
                      }`}
                    />
                  </button>
                  {open && (
                    <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/[0.05] pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* ═══ FINAL CTA ════════════════════════════════════════════════════ */}
        <motion.section {...fadeUp} className="text-center space-y-5 py-10">
          <div className="flex items-center justify-center gap-1 text-brand mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} fill="currentColor" />
            ))}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white max-w-3xl mx-auto leading-[1.1]">
            The pipeline you&apos;re ignoring is{' '}
            <span className="bg-gradient-to-r from-brand via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              still hemorrhaging.
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Every week you wait is another $X thousand out the door. Apply or run the free audit —
            either way, the meter stops today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#apply"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-black font-bold text-sm hover:bg-emerald-400 transition-colors"
            >
              <Send size={16} /> Apply for Managed
              <ArrowRight size={16} />
            </a>
            <button
              onClick={runAudit}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] text-white font-bold text-sm hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
            >
              <Sparkles size={16} /> Run free audit
            </button>
          </div>
          <div className="text-[11px] text-slate-600">
            Managed Service · Application-only · 72-hour ramp
          </div>
        </motion.section>
      </div>
    </div>
  );
}

// ─── Small helpers ───────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1">
        {label} {required && <span className="text-brand">*</span>}
      </span>
      {children}
    </label>
  );
}

function ContingencyCard({ icon: Icon, title, desc, color = '#00ff88' }) {
  return (
    <motion.div
      {...fadeUp}
      className="rounded-xl border border-white/10 bg-surface-2/30 p-5 hover:border-white/20 transition-colors"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
        style={{ background: `${color}18` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div className="text-sm font-bold text-white mb-1">{title}</div>
      <div className="text-xs text-slate-400 leading-relaxed">{desc}</div>
    </motion.div>
  );
}
