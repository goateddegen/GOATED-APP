// =============================================================================
// GOATED — Revenue Loss Auditor (LIVE, URL-ONLY, ZERO HARDCODING)
// -----------------------------------------------------------------------------
// Input: one URL. Nothing else.
// Flow: client POSTs URL -> /api/audit scrapes live -> LLM returns structured
// analysis -> this page renders it. No category selectors, no case inputs,
// no leakage lookup tables, no stock copy. Every number is derived by the LLM
// from live-scraped signals.
//
// Shareable: /#/for/{slug}?u={encoded-url}  -- re-runs the audit on load.
// =============================================================================

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Sparkles, Target, TrendingDown, TrendingUp, Phone, Share2,
  CheckCircle2, AlertTriangle, MapPin, DollarSign, Flame, Copy, ExternalLink,
  Shield, Clock, Award, ChevronRight, Loader2, MessageSquare, Bot, Zap,
  Eye, Activity, Globe, Cpu, Users, ShoppingBag, Mail, BarChart3, Wrench,
} from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { contactMailto } from '../lib/config';

// ─── Helpers ────────────────────────────────────────────────────────────────
function slugify(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '').replace(/\./g, '-').toLowerCase();
  } catch { return (url || 'brand').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40); }
}

// Map fix product name -> icon (purely visual, no data hardcoded)
const productIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('voice') || n.includes('call')) return Phone;
  if (n.includes('sms') || n.includes('text')) return MessageSquare;
  if (n.includes('chat')) return Bot;
  if (n.includes('cart') || n.includes('checkout') || n.includes('recovery')) return ShoppingBag;
  if (n.includes('review')) return Award;
  if (n.includes('seo') || n.includes('content')) return Globe;
  if (n.includes('missed')) return Phone;
  if (n.includes('ads') || n.includes('copy')) return Zap;
  if (n.includes('pricing')) return DollarSign;
  if (n.includes('referral')) return Users;
  if (n.includes('email')) return Mail;
  if (n.includes('analytics') || n.includes('tracking')) return BarChart3;
  return Wrench;
};

const severityColor = (sev) => {
  const s = (sev || '').toLowerCase();
  if (s === 'high') return '#ef4444';
  if (s === 'medium') return '#f59e0b';
  return '#64748b';
};

// ─── Status phases shown while the LLM runs ─────────────────────────────────
const PHASES = [
  { label: 'Fetching site',          detail: 'Loading HTML + following redirects' },
  { label: 'Extracting signals',     detail: 'Meta, CTAs, tech stack, socials' },
  { label: 'Detecting stack',        detail: 'Shopify, HubSpot, Klaviyo, analytics' },
  { label: 'Running analysis',       detail: 'GOATED AI generating revenue-loss breakdown' },
  { label: 'Composing audit',        detail: 'Ranking leaks by revenue impact' },
];

// ─── Component ──────────────────────────────────────────────────────────────
export default function AuditPage() {
  const setPage = useStore(s => s.setPage);
  const degenMode = useStore(s => s.degenMode);

  const [url, setUrl] = useState('');
  const [step, setStep] = useState('input'); // input | running | result | error
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [phase, setPhase] = useState(0);
  const [copied, setCopied] = useState(false);
  const phaseTimer = useRef(null);

  const accent   = degenMode ? '#f97316' : '#10b981';
  const accentBg = degenMode ? 'rgba(249,115,22,0.08)' : 'rgba(16,185,129,0.08)';
  const accentBr = degenMode ? 'rgba(249,115,22,0.25)' : 'rgba(16,185,129,0.25)';

  // ── Run the real audit ─────────────────────────────────────────────────
  const run = useCallback(async (targetUrl) => {
    const u = (targetUrl || url || '').trim();
    if (!u) return;
    setErr(null);
    setResult(null);
    setStep('running');
    setPhase(0);

    // Rotate phase labels every 1.8s for perceived progress
    if (phaseTimer.current) clearInterval(phaseTimer.current);
    phaseTimer.current = setInterval(() => {
      setPhase(p => Math.min(p + 1, PHASES.length - 1));
    }, 1800);

    try {
      const resp = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: u }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || `HTTP ${resp.status}`);
      if (!data?.analysis) throw new Error('Audit returned no analysis');
      setResult(data);
      setStep('result');
    } catch (e) {
      setErr(e.message || 'Audit failed');
      setStep('error');
    } finally {
      if (phaseTimer.current) { clearInterval(phaseTimer.current); phaseTimer.current = null; }
    }
  }, [url]);

  // ── Hash router: /#/for/{slug}?u={url} re-runs the audit live on load ──
  useEffect(() => {
    const resolveHash = () => {
      const h = window.location.hash || '';
      const m = h.match(/#\/for\/([a-z0-9-]+)/i);
      if (m) {
        const qs = new URLSearchParams((h.split('?')[1] || ''));
        const sharedUrl = qs.get('u') || `https://${m[1].replace(/-/g, '.')}`;
        setUrl(sharedUrl);
        run(sharedUrl);
      }
    };
    resolveHash();
    window.addEventListener('hashchange', resolveHash);
    return () => {
      window.removeEventListener('hashchange', resolveHash);
      if (phaseTimer.current) clearInterval(phaseTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Shareable link ─────────────────────────────────────────────────────
  const shareLink = useMemo(() => {
    if (!result) return '';
    const slug = slugify(result.url);
    const qs = new URLSearchParams({ u: result.url });
    return `${window.location.origin}/#/for/${slug}?${qs.toString()}`;
  }, [result]);

  const copyShare = useCallback(() => {
    if (!shareLink) return;
    navigator.clipboard?.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  }, [shareLink]);

  // ══════════════════════════════════════════════════════════════════════
  // STEP: INPUT
  // ══════════════════════════════════════════════════════════════════════
  if (step === 'input') {
    return (
      <div className="min-h-screen pb-20">
        <section className="px-6 pt-12 sm:pt-20 pb-10 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${accentBg} 0%, transparent 70%)` }} />
          <div className="max-w-4xl mx-auto relative">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6" style={{ background: accentBg, borderColor: accentBr }}>
                <Sparkles size={14} style={{ color: accent }} />
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>Revenue Loss Auditor · Live · Free</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] mb-5 tracking-tight">
                Paste any URL.<br />
                We tell you <span style={{ color: accent }}>exactly</span> how much revenue<br />
                you're leaving on the table.
              </h1>
              <p className="text-lg text-slate-400 max-w-2xl mb-3 leading-relaxed">
                GOATED crawls your site live, reads every signal — stack, CTAs, socials, forms, analytics, booking, chat — and returns a ranked breakdown of where you're bleeding.
              </p>
              <p className="text-sm text-slate-500 max-w-2xl mb-10">
                No signup. No email capture. No category dropdown. No fake averages. Every number is derived from signals on your actual page, today, in real time.
              </p>
            </motion.div>

            <motion.form
              onSubmit={(e) => { e.preventDefault(); run(); }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
              className="rounded-2xl border border-white/[0.06] bg-surface-1/40 backdrop-blur p-6 sm:p-8"
            >
              <label className="block mb-5">
                <div className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-semibold">URL to audit</div>
                <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/40 px-4 py-4 focus-within:border-white/20">
                  <ExternalLink size={18} className="text-slate-600" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="stripe.com or https://linear.app"
                    autoFocus
                    className="flex-1 bg-transparent outline-none text-slate-100 placeholder-slate-600 text-lg"
                  />
                </div>
                <div className="text-[11px] text-slate-600 mt-1.5">Any public site. B2B, DTC, SaaS, services, local. Works best on their homepage.</div>
              </label>

              <button
                type="submit"
                disabled={!url}
                className="w-full rounded-xl px-6 py-4 text-base font-bold transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: accent, color: '#000' }}
              >
                Run the audit <ArrowRight size={18} />
              </button>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5"><Shield size={12} />Zero signup</span>
                <span className="flex items-center gap-1.5"><Clock size={12} />~10 seconds</span>
                <span className="flex items-center gap-1.5"><Cpu size={12} />Live crawl + AI</span>
                <span className="flex items-center gap-1.5"><Award size={12} />Shareable</span>
              </div>
            </motion.form>

            <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mt-10 text-xs text-slate-600">
              <div className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: accent }} />No email required</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: accent }} />Free forever</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: accent }} />13% only when we close for you</div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP: RUNNING
  // ══════════════════════════════════════════════════════════════════════
  if (step === 'running') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: accentBg, border: `1px solid ${accentBr}` }}>
            <Loader2 size={28} className="animate-spin" style={{ color: accent }} />
          </div>
          <div className="text-xl font-bold text-white mb-2">Analyzing {url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</div>
          <div className="text-sm text-slate-400 mb-6">{PHASES[phase].detail}</div>
          <div className="space-y-2 text-left">
            {PHASES.map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                {i < phase ? (
                  <CheckCircle2 size={16} style={{ color: accent }} />
                ) : i === phase ? (
                  <Loader2 size={16} className="animate-spin" style={{ color: accent }} />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700" />
                )}
                <span className={i <= phase ? 'text-slate-200' : 'text-slate-600'}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP: ERROR
  // ══════════════════════════════════════════════════════════════════════
  if (step === 'error') {
    const isKeyIssue = err && /api.?key|unauthor|forbidd|no llm|no provider|503|rate.?limit/i.test(String(err));
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-2xl">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/30">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <div className="text-xl font-bold text-white mb-2">Audit failed</div>
          <div className="text-sm text-slate-400 mb-6">{err}</div>
          {isKeyIssue && (
            <div className="text-left bg-black/40 border border-amber-500/20 rounded-xl p-5 mb-6">
              <div className="text-xs uppercase tracking-widest font-bold text-amber-400 mb-3">Production config needed</div>
              <p className="text-sm text-slate-300 mb-3">The audit API requires at least one LLM provider env var in Vercel:</p>
              <ul className="space-y-1.5 text-xs text-slate-400 font-mono mb-3 pl-4 list-disc">
                <li><span className="text-white">GROQ_API_KEY</span> — Llama 3.3 70B, free tier 30M tokens/mo (recommended primary)</li>
                <li><span className="text-white">ANTHROPIC_API_KEY</span> — Claude Haiku fallback (recommended secondary)</li>
              </ul>
              <p className="text-xs text-slate-500">Set in Vercel → Project → Settings → Environment Variables. Redeploy after save.</p>
            </div>
          )}
          <button
            onClick={() => setStep('input')}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold transition"
            style={{ background: accent, color: '#000' }}
          >
            Try another URL
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STEP: RESULT — render the live LLM output
  // ══════════════════════════════════════════════════════════════════════
  const r = result;
  const a = r?.analysis || {};
  const s = r?.signals || {};
  const biz = a.business || {};
  const loss = a.revenueLoss || {};
  const leaks = Array.isArray(a.leaks) ? a.leaks : [];
  const upsells = Array.isArray(a.upsellOpportunities) ? a.upsellOpportunities : [];
  const dimensions = Array.isArray(a.dimensions) ? a.dimensions : [];
  const outreachAngles = Array.isArray(a.outreachAngles) ? a.outreachAngles : [];
  const lossLow = Number(loss.monthlyLowEstimate) || 0;
  const lossHigh = Number(loss.monthlyHighEstimate) || 0;
  const lossMid = Math.round((lossLow + lossHigh) / 2);
  // Recovered in the first 90 days at a conservative one-third capture rate.
  const recoverable90 = Math.round(lossMid * 3 * 0.33);
  const annualLoss = Math.round(lossMid * 12);

  return (
    <div className="min-h-screen pb-20">
      <section className="px-6 pt-8 sm:pt-14 pb-6 relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 70% 50% at 50% -20%, ${accentBg} 0%, transparent 70%)` }} />
        <div className="max-w-5xl mx-auto relative">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setStep('input')} className="text-xs text-slate-500 hover:text-white transition">← Audit another URL</button>
            <div className="flex items-center gap-2">
              <a href={r.url} target="_blank" rel="noreferrer noopener"
                 className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] bg-black/40 hover:bg-black/60 transition text-slate-400">
                <ExternalLink size={13} />{r.url.replace(/^https?:\/\//,'').replace(/\/$/,'')}
              </a>
              <button onClick={copyShare} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] bg-black/40 hover:bg-black/60 transition">
                {copied ? <CheckCircle2 size={14} style={{ color: accent }} /> : <Share2 size={14} className="text-slate-400" />}
                <span className={copied ? 'text-white' : 'text-slate-400'}>{copied ? 'Link copied' : 'Share audit'}</span>
              </button>
            </div>
          </div>

          {/* Business summary */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="text-[11px] uppercase tracking-[0.25em] text-slate-500 mb-2 flex items-center gap-2">
              <span>Live audit for</span>
              <span className="text-white font-semibold">{biz.name || slugify(r.url)}</span>
              {biz.modelGuess && <><span>·</span><span>{biz.modelGuess}</span></>}
              {biz.stage && <><span>·</span><span>{biz.stage}</span></>}
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">{biz.type || 'Company analysis'}</div>
            <p className="text-slate-400 text-base leading-relaxed max-w-3xl">{a.scrapedSummary || 'No summary returned.'}</p>
          </motion.div>

          {/* Revenue loss headline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-10 rounded-2xl border p-6 sm:p-8" style={{ borderColor: accentBr, background: accentBg }}>
            <div className="text-[11px] uppercase tracking-[0.3em] font-bold mb-2" style={{ color: accent }}>Estimated revenue loss</div>
            <div className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1]">
              <span style={{ color: accent }}>
                ${lossLow.toLocaleString()}–${lossHigh.toLocaleString()}
              </span>
              <span className="text-slate-500 text-2xl sm:text-3xl font-bold"> / month</span>
            </div>
            {loss.reasoning && (
              <div className="mt-4 text-sm text-slate-300 leading-relaxed max-w-3xl">
                <span className="text-slate-500 uppercase tracking-widest text-[10px] font-bold mr-2">AI reasoning</span>
                {loss.reasoning}
              </div>
            )}
            {r.degraded && r.degradedReason && (
              <div className="mt-5 flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/[0.07] border border-amber-500/25">
                <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  {r.degradedReason} Findings below come from the live scan of this site — the dollar ranges are wide by design.
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <Stat icon={DollarSign} label="Midpoint / mo"      value={`$${lossMid.toLocaleString()}`} />
              <Stat icon={TrendingUp} label="Annualized impact"  value={`$${annualLoss.toLocaleString()}`} />
              <Stat icon={Award} label="Recoverable in 90 days"   value={`$${recoverable90.toLocaleString()}`} />
              <Stat icon={Activity} label="Confidence"            value={`${a.confidenceScore ?? '—'}${a.confidenceScore != null ? '/100' : ''}`} />
            </div>
          </motion.div>

          {/* Leaks */}
          {leaks.length > 0 && (
            <div className="mb-10">
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-semibold">Ranked leaks (from live signals)</div>
              <div className="space-y-3">
                {leaks.map((f, i) => {
                  const Icon = productIcon(f.fixProduct);
                  const sev = severityColor(f.severity);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                      className="rounded-xl border border-white/[0.06] bg-surface-1/40 p-5"
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${sev}15`, border: `1px solid ${sev}30` }}>
                          <Icon size={18} style={{ color: sev }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: sev }}>
                              {f.severity ? `${f.severity} impact` : 'Impact'}
                            </span>
                            <span className="text-[10px] text-slate-600">#{i + 1}</span>
                            {f.fixProduct && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: accentBg, color: accent, border: `1px solid ${accentBr}` }}>
                                Fix: {f.fixProduct}
                              </span>
                            )}
                          </div>
                          <div className="text-base font-semibold text-white mb-2 leading-snug">{f.title}</div>
                          {f.observed && <div className="text-sm text-slate-400 leading-relaxed mb-1"><span className="text-slate-500 text-[10px] uppercase tracking-widest mr-2 font-bold">Observed</span>{f.observed}</div>}
                          {f.impact && <div className="text-sm text-slate-400 leading-relaxed mb-1"><span className="text-slate-500 text-[10px] uppercase tracking-widest mr-2 font-bold">Impact</span>{f.impact}</div>}
                          {f.expectedLift && <div className="text-sm leading-relaxed font-semibold" style={{ color: accent }}><span className="text-slate-500 text-[10px] uppercase tracking-widest mr-2 font-bold">Expected lift</span>{f.expectedLift}</div>}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dimension scores — 12-dim audit v2 */}
          {dimensions.length > 0 && (
            <div className="mb-10">
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-semibold">Business health across every dimension</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dimensions.map((d, i) => {
                  const score = Math.max(0, Math.min(100, Number(d.score) || 0));
                  const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="rounded-xl border border-white/[0.06] bg-surface-1/40 p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{d.name || 'Dimension'}</div>
                        <div className="text-sm font-black" style={{ color: scoreColor }}>{score}</div>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${score}%`, background: scoreColor }}
                        />
                      </div>
                      {d.reasoning && (
                        <div className="text-[11px] text-slate-400 leading-relaxed">{d.reasoning}</div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Outreach angles */}
          {outreachAngles.length > 0 && (
            <div className="mb-10">
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-semibold">Cold outreach angles (channel-specific)</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {outreachAngles.map((ang, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.05 }}
                    className="rounded-xl border p-4"
                    style={{ borderColor: accentBr, background: accentBg }}
                  >
                    <div className="text-[10px] uppercase tracking-widest font-black mb-2" style={{ color: accent }}>{ang.channel || `Angle ${i + 1}`}</div>
                    {ang.hook && <div className="text-sm font-semibold text-white mb-1.5 leading-snug">{ang.hook}</div>}
                    {ang.script && <div className="text-[12px] text-slate-300 leading-relaxed italic">"{ang.script}"</div>}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Upsells */}
          {upsells.length > 0 && (
            <div className="mb-10">
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-semibold">Upsell opportunities (products GOATED can deploy for them)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {upsells.map((u, i) => {
                  const Icon = productIcon(u.name);
                  return (
                    <motion.div
                      key={i} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      className="rounded-xl border border-white/[0.06] bg-surface-1/40 p-4"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accentBg, border: `1px solid ${accentBr}` }}>
                          <Icon size={16} style={{ color: accent }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-white">{u.name}</div>
                          {u.priceRangeMonthly && <div className="text-xs text-slate-500 font-semibold mt-0.5">{u.priceRangeMonthly}</div>}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 leading-relaxed">{u.why}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scrape signals transparency */}
          <details className="mb-10 rounded-xl border border-white/[0.06] bg-surface-1/30 overflow-hidden">
            <summary className="cursor-pointer px-5 py-4 flex items-center justify-between text-sm font-semibold text-slate-300 hover:bg-white/[0.02]">
              <span className="flex items-center gap-2"><Eye size={14} style={{ color: accent }} /> What we actually saw on their site</span>
              <ChevronRight size={16} className="text-slate-500" />
            </summary>
            <div className="px-5 pb-5 pt-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
              <SignalPill label="Title"        value={s.title || '—'} />
              <SignalPill label="H1"           value={s.headings?.h1?.[0] || '—'} />
              <SignalPill label="Tech stack"   value={(s.tech || []).slice(0, 4).join(', ') || 'None detected'} />
              <SignalPill label="Internal links" value={s.links?.internal ?? 0} />
              <SignalPill label="External links" value={s.links?.external ?? 0} />
              <SignalPill label="Forms"        value={s.forms ?? 0} />
              <SignalPill label="Pricing page" value={s.hasPricingPage ? 'Yes' : 'No'} />
              <SignalPill label="Blog"         value={s.hasBlog ? 'Yes' : 'No'} />
              <SignalPill label="Checkout"     value={s.hasCheckout ? 'Yes' : 'No'} />
              <SignalPill label="Live chat"    value={s.hasLiveChat ? 'Yes' : 'No'} />
              <SignalPill label="Booking"      value={s.hasBooking ? 'Yes' : 'No'} />
              <SignalPill label="Analytics"    value={s.loadsAnalytics ? 'Yes' : 'No'} />
              <SignalPill label="Testimonials" value={s.hasTestimonials ? 'Yes' : 'No'} />
              <SignalPill label="Mobile"       value={s.mobileViewport ? 'Yes' : 'No'} />
              <SignalPill label="Socials"      value={Object.keys(s.socials || {}).join(', ') || '—'} />
              <SignalPill label="Emails found" value={s.contacts?.emails?.length ?? 0} />
            </div>
          </details>

          {/* Primary CTA — agency-first: book the call OR have us run outreach */}
          <div className="rounded-2xl border p-6 sm:p-8" style={{ borderColor: accentBr, background: accentBg }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="flex-1">
                <div className="text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: accent }}>Next step</div>
                <div className="text-xl font-black text-white leading-tight mb-1.5">
                  Want us to plug these leaks for you?
                </div>
                <div className="text-sm text-slate-300 leading-relaxed">
                  We run the missed-call recovery, the cold outreach, the booking flow — the whole engine that turns this audit into actual revenue.
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                    <div className="text-emerald-400 font-bold mb-0.5">Local Engine</div>
                    <div className="text-slate-400">$2,000 setup + $750/mo · 30-day refund</div>
                  </div>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                    <div className="text-amber-400 font-bold mb-0.5">Growth Engine</div>
                    <div className="text-slate-400">$10–20K setup + $2.5–5K/mo · application</div>
                  </div>
                </div>
                {a.oneLinePitch && (
                  <div className="mt-3 text-xs text-slate-400 italic border-l-2 pl-3" style={{ borderColor: accentBr }}>
                    "{a.oneLinePitch}"
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <a
                  href={contactMailto({
                    subject: `GOATED audit — ${biz.name || slugify(r.url)}`,
                    url: r.url,
                    business: biz.name,
                  })}
                  className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold transition whitespace-nowrap"
                  style={{ background: accent, color: '#000' }}
                >
                  <Phone size={18} /> Get these fixed — talk to us
                </a>
                <button
                  onClick={copyShare}
                  className="flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold border border-brand/40 bg-brand/10 hover:bg-brand/15 text-brand transition whitespace-nowrap"
                >
                  {copied ? <CheckCircle2 size={14} /> : <Share2 size={14} />}
                  {copied ? 'Link copied — send to client' : 'Share this audit'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 rounded-xl px-6 py-2 text-xs font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition whitespace-nowrap"
                >
                  Print / save as PDF
                </button>
              </div>
            </div>
          </div>

          {/* Footer meta */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <Flame size={12} style={{ color: accent }} />
              <span>Powered by GOATED AI · live crawl · {r.llm || 'LLM'}</span>
            </div>
            <div>{new Date(r.generatedAt).toLocaleString()}</div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Stat pill used in the headline row ─────────────────────────────────────
function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
      <Icon size={14} className="text-slate-500 mb-1" />
      <div className="text-lg font-black text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

// ─── Small signal pill used in the transparency accordion ───────────────────
function SignalPill({ label, value }) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-black/30 px-3 py-2">
      <div className="text-[9px] uppercase tracking-widest text-slate-600 font-bold">{label}</div>
      <div className="text-xs text-slate-200 truncate mt-0.5">{String(value)}</div>
    </div>
  );
}
