import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Link2, ExternalLink, Copy, Check, AlertCircle,
  ArrowUpRight, ArrowDownLeft, RefreshCw, Shield, CreditCard,
  Building2, DollarSign, Zap, Clock, TrendingUp, FileText,
  CheckCircle2, Banknote, Receipt, BarChart3, ArrowRight, Info,
} from 'lucide-react';
import { CONTACT_EMAIL } from '../lib/config';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtUsd = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount || 0);

const fmtUsdCompact = (amount) => {
  if (!amount) return '$0';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 10_000) return `$${Math.round(amount / 1_000).toLocaleString()}K`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${Math.round(amount).toLocaleString()}`;
};

const timeAgo = (ts) => {
  if (!ts) return '—';
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
};

const STRIPE_CONNECT_STATE_KEY = 'goated_stripe_connect_state';

// Pre-launch: no real Stripe Connect account yet. State is persisted locally
// and the OAuth flow is routed through /api/stripe-oauth when the server
// endpoint is live. Until then we show the pending state honestly.
function loadStripeState() {
  try {
    const saved = localStorage.getItem(STRIPE_CONNECT_STATE_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function saveStripeState(state) {
  try {
    if (state) localStorage.setItem(STRIPE_CONNECT_STATE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STRIPE_CONNECT_STATE_KEY);
  } catch { /* ignore */ }
}

// ── Animation variants ───────────────────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

// ── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    connected: { bg: 'bg-[#00ff88]/10', border: 'border-[#00ff88]/20', dot: 'bg-[#00ff88] animate-pulse', text: 'text-[#00ff88]', label: 'Stripe Connected' },
    pending:   { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', dot: 'bg-yellow-400 animate-pulse', text: 'text-yellow-400', label: 'Onboarding Pending' },
    idle:      { bg: 'bg-zinc-800', border: 'border-zinc-700', dot: 'bg-zinc-500', text: 'text-zinc-400', label: 'Not Connected' },
  };
  const s = map[status] || map.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.border} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sublabel, color = '#00ff88', index = 0 }) {
  return (
    <motion.div
      variants={fadeInUp}
      custom={index}
      className="bg-surface-1 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-[18px] h-[18px]" style={{ color }} />
        </div>
        <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      {sublabel && <p className="text-xs text-zinc-500 mt-1">{sublabel}</p>}
    </motion.div>
  );
}

// ── LedgerRow ────────────────────────────────────────────────────────────────
function LedgerRow({ row, index }) {
  const colorMap = {
    charge:   { icon: ArrowDownLeft, tone: '#00ff88', bg: 'bg-[#00ff88]/10', label: 'Charge' },
    payout:   { icon: Banknote,      tone: '#06b6d4', bg: 'bg-[#06b6d4]/10', label: 'Payout' },
    fee:      { icon: Receipt,       tone: '#f59e0b', bg: 'bg-[#f59e0b]/10', label: 'Platform Split' },
    refund:   { icon: ArrowUpRight,  tone: '#ef4444', bg: 'bg-[#ef4444]/10', label: 'Refund' },
    pending:  { icon: Clock,         tone: '#a855f7', bg: 'bg-[#a855f7]/10', label: 'Pending' },
  };
  const c = colorMap[row.kind] || colorMap.pending;
  const I = c.icon;

  return (
    <motion.div
      variants={fadeInUp}
      custom={index}
      className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/[0.02] transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${c.bg}`}>
          <I className="w-4 h-4" style={{ color: c.tone }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-white font-medium truncate">{row.title}</p>
          <p className="text-xs text-zinc-500">{c.label} · {timeAgo(row.ts)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold" style={{ color: c.tone }}>
          {row.kind === 'refund' || row.kind === 'fee' ? '-' : '+'}{fmtUsd(row.amount)}
        </span>
        {row.stripeUrl && (
          <a
            href={row.stripeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            title="View in Stripe"
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-500 hover:text-[#00ff88]" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function WalletPage() {
  const [stripeState, setStripeState] = useState(() => loadStripeState());
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ledger, setLedger] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const status = stripeState?.accountId
    ? (stripeState.payoutsEnabled ? 'connected' : 'pending')
    : 'idle';
  const isConnected = status === 'connected';
  const isPending = status === 'pending';

  // ── Load ledger from /api/stripe-ledger (server) when connected ───────────
  const refreshLedger = useCallback(async () => {
    if (!stripeState?.accountId) return;
    setLedgerLoading(true);
    try {
      const res = await fetch(`/api/stripe-ledger?accountId=${encodeURIComponent(stripeState.accountId)}`);
      if (!res.ok) throw new Error(`Ledger fetch failed: ${res.status}`);
      const data = await res.json();
      setLedger(Array.isArray(data?.rows) ? data.rows : []);
    } catch (err) {
      console.info('Stripe ledger unavailable (pre-launch):', err?.message);
      // Pre-launch: server endpoint may not exist yet — just show empty
      setLedger([]);
    } finally {
      setLedgerLoading(false);
    }
  }, [stripeState?.accountId]);

  useEffect(() => {
    if (stripeState?.accountId) refreshLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Connect Stripe Express (OAuth flow via /api/stripe-oauth) ─────────────
  const connectStripe = useCallback(async () => {
    setError(null);
    setConnecting(true);
    try {
      // Initiate OAuth. Server should return { url: 'https://connect.stripe.com/...' }
      const res = await fetch('/api/stripe-oauth', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }
      // Pre-launch fallback: mark as pending so the user sees a clear state
      const pending = {
        accountId: null,
        status: 'oauth_pending',
        startedAt: Date.now(),
      };
      saveStripeState(pending);
      setStripeState(pending);
      setError('Stripe onboarding endpoint is still provisioning. We saved your intent — email support to finish manually.');
    } catch (err) {
      setError(err?.message || 'Stripe OAuth failed to launch.');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnectStripe = useCallback(() => {
    saveStripeState(null);
    setStripeState(null);
    setLedger([]);
  }, []);

  const copyAccountId = useCallback(() => {
    if (!stripeState?.accountId) return;
    navigator.clipboard.writeText(stripeState.accountId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [stripeState?.accountId]);

  // ── Ledger-derived summary ────────────────────────────────────────────────
  const summary = useMemo(() => {
    const grossClosed = ledger.filter(r => r.kind === 'charge').reduce((s, r) => s + (r.amount || 0), 0);
    const platformSplit = ledger.filter(r => r.kind === 'fee').reduce((s, r) => s + (r.amount || 0), 0);
    const net = grossClosed - platformSplit;
    const nextPayout = ledger.find(r => r.kind === 'pending')?.amount || 0;
    return { grossClosed, platformSplit, net, nextPayout };
  }, [ledger]);

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#00ff88]" />
            </div>
            Master Wallet
          </h1>
          <p className="text-sm text-zinc-500 mt-1 ml-[52px]">Stripe Connect Express — payouts straight to your bank. Zero crypto.</p>
        </div>
        <StatusBadge status={status} />
      </motion.div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-yellow-300/60 hover:text-yellow-200 flex-shrink-0">
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">

        {/* ── Stripe Connect Section ──────────────────────────────────────── */}
        <motion.div variants={fadeInUp} custom={0}>
          <div className="bg-surface-1 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#635bff]/15 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#635bff]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Stripe Connect Express</h2>
                  <p className="text-xs text-zinc-500">Accept cards · auto-split platform fee · instant payouts</p>
                </div>
              </div>
              {isConnected && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => { setRefreshing(true); await refreshLedger(); setRefreshing(false); }}
                    disabled={refreshing || ledgerLoading}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white disabled:opacity-40"
                    title="Refresh ledger"
                  >
                    <RefreshCw className={`w-4 h-4 ${(refreshing || ledgerLoading) ? 'animate-spin' : ''}`} />
                  </button>
                  <a
                    href="https://dashboard.stripe.com/express"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:bg-white/5 border border-white/10 transition-colors inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Stripe Dashboard
                  </a>
                  <button
                    onClick={disconnectStripe}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {!stripeState?.accountId && !isPending ? (
                  /* ── Not connected: onboard CTA ─────────────────────────── */
                  <motion.div
                    key="disconnected"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8 space-y-5"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#635bff]/20 to-[#00ff88]/10 flex items-center justify-center mx-auto border border-white/5">
                      <CreditCard className="w-8 h-8 text-[#635bff]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Connect your Stripe account</h3>
                      <p className="text-sm text-zinc-400 max-w-md mx-auto">
                        v1: we use <span className="text-white font-semibold">Stripe Payment Links</span> for clean invoicing. Send a link, client pays, money lands in your account. Auto-split commissions arrive in v2 once volume justifies the Connect rails.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <button
                        onClick={connectStripe}
                        disabled={connecting}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#635bff] text-white font-semibold text-sm hover:bg-[#554fd9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {connecting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Launching Stripe…
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4" />
                            Connect Stripe Express
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-zinc-600 max-w-md mx-auto">
                      Self-serve only. No onboarding calls — if your account&apos;s legit and the deal&apos;s real, Stripe verifies you in 2 minutes. We never touch the money.
                    </p>
                  </motion.div>
                ) : isPending ? (
                  /* ── Onboarding pending ─────────────────────────────────── */
                  <motion.div
                    key="pending"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8 space-y-5"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto border border-yellow-500/20">
                      <Clock className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Stripe onboarding in progress</h3>
                      <p className="text-sm text-zinc-400 max-w-md mx-auto">
                        Your Stripe Express account is being provisioned. Once verification clears, payouts will enable automatically.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <button
                        onClick={connectStripe}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#635bff] text-white font-semibold text-sm hover:bg-[#554fd9] transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" /> Resume onboarding
                      </button>
                      <a
                        href={`mailto:${CONTACT_EMAIL}?subject=Stripe%20onboarding%20help`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-zinc-300 font-semibold text-sm hover:bg-white/10 border border-white/10 transition-colors"
                      >
                        Email support
                      </a>
                      <button
                        onClick={disconnectStripe}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* ── Connected: account bar + summary + ledger ─────────── */
                  <motion.div
                    key="connected"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Account bar */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-[#635bff]/20 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-4 h-4 text-[#635bff]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-zinc-500 mb-0.5">Stripe Account</p>
                        <p className="text-sm font-mono text-white truncate">{stripeState.accountId}</p>
                      </div>
                      <button
                        onClick={copyAccountId}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                        title="Copy account ID"
                      >
                        {copied ? <Check className="w-4 h-4 text-[#00ff88]" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                      </button>
                      <a
                        href="https://dashboard.stripe.com/express"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                        title="Open Stripe Dashboard"
                      >
                        <ExternalLink className="w-4 h-4 text-zinc-400" />
                      </a>
                    </div>

                    {/* Summary cards */}
                    <motion.div
                      variants={stagger}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                    >
                      <StatCard icon={TrendingUp} label="Gross Closed" value={fmtUsdCompact(summary.grossClosed)} sublabel="Settled via Stripe" color="#00ff88" index={0} />
                      <StatCard icon={Receipt}    label="Platform Split" value={fmtUsdCompact(summary.platformSplit)} sublabel="Per invoice" color="#f59e0b" index={1} />
                      <StatCard icon={Banknote}   label="Your Net" value={fmtUsdCompact(summary.net)} sublabel="Post-split" color="#06b6d4" index={2} />
                      <StatCard icon={Zap}        label="Next Payout" value={fmtUsdCompact(summary.nextPayout)} sublabel={stripeState?.payoutSchedule || 'Standard'} color="#a855f7" index={3} />
                    </motion.div>

                    {/* Recent Ledger */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
                        <button
                          onClick={refreshLedger}
                          disabled={ledgerLoading}
                          className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${ledgerLoading ? 'animate-spin' : ''}`} />
                          Refresh
                        </button>
                      </div>

                      <div className="bg-black/30 border border-white/5 rounded-xl overflow-hidden">
                        {ledgerLoading && ledger.length === 0 ? (
                          <div className="py-10 text-center">
                            <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin mx-auto mb-2" />
                            <p className="text-sm text-zinc-500">Loading ledger…</p>
                          </div>
                        ) : ledger.length === 0 ? (
                          <div className="py-10 text-center">
                            <Receipt className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                            <p className="text-sm text-zinc-500">No transactions yet</p>
                            <p className="text-xs text-zinc-600 mt-1">Charges, refunds, platform splits, and payouts will appear here.</p>
                          </div>
                        ) : (
                          <motion.div
                            variants={stagger}
                            initial="hidden"
                            animate="visible"
                            className="divide-y divide-white/5"
                          >
                            {ledger.map((row, i) => (
                              <LedgerRow key={row.id || i} row={row} index={i} />
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ── How payouts work ───────────────────────────────────────────── */}
        <motion.div variants={fadeInUp} custom={1}>
          <div className="bg-surface-1 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#00ff88]/10 flex items-center justify-center">
                <Info className="w-4 h-4 text-[#00ff88]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">How payouts work</h2>
                <p className="text-xs text-zinc-500">Stripe is the money custodian. We never are.</p>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: CreditCard, title: 'Customer pays via Stripe', desc: 'Invoice or payment link generated by GOATED. Customer pays with card, ACH, or wire. Funds land in Stripe — not in a GOATED-held account.', color: '#635bff' },
                  { icon: Receipt,    title: 'Platform fee auto-splits', desc: 'Stripe routes the agreed platform cut to GOATED (Application Fee). The rest goes to your Stripe Express balance. The split is recorded on every invoice.', color: '#f59e0b' },
                  { icon: Banknote,   title: 'Payout to your bank', desc: 'Stripe Express pays your balance to the bank you linked during onboarding. Standard schedule or Instant Payout (1% fee) — your choice.', color: '#00ff88' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-black/30 border border-white/5">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${item.color}15`, color: item.color }}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#00ff88]/5 to-transparent border border-[#00ff88]/15 flex items-start gap-3">
                <Shield className="w-4 h-4 text-[#00ff88] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white font-semibold mb-1">We never touch the money.</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Stripe is the payment custodian. GOATED only receives the Application Fee the platform is entitled to on each transaction. No pooled wallets, no crypto exposure, no FinCEN MTL risk.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Rails-only section removed v7.4 — self-serve commission model only.
            If a user brings their own deal outside our lead-gen stack, they route it themselves.
            Contact: support email for edge cases. No booking calls. */}

        {/* ── Security footer ───────────────────────────────────────────── */}
        <motion.div variants={fadeInUp} custom={3}>
          <div className="rounded-2xl border border-white/5 bg-black/30 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Shield className="w-3.5 h-3.5 text-[#00ff88]" />
                <span>PCI-DSS Level 1 via Stripe</span>
                <span className="text-zinc-700">·</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff88]" />
                <span>1099-K issued by Stripe on your behalf</span>
                <span className="text-zinc-700">·</span>
                <BarChart3 className="w-3.5 h-3.5 text-[#00ff88]" />
                <span>Full ledger exported on request</span>
              </div>
              <a
                href="https://stripe.com/connect/express"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-500 hover:text-[#00ff88] inline-flex items-center gap-1"
              >
                Learn about Stripe Express <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
