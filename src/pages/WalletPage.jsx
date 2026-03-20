import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Link2, ExternalLink, Copy, Check, AlertCircle,
  ArrowUpRight, ArrowDownLeft, RefreshCw, Shield, CreditCard,
  Building2, Coins,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const LAMPORTS_PER_SOL = 1_000_000_000;
const COMMISSION_RATE = 0.12; // 12% platform commission
const PHANTOM_INSTALL_URL = 'https://phantom.app/';

// ── Helpers ──────────────────────────────────────────────────────────────────
const truncateAddress = (addr) =>
  addr ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : '';

const formatSol = (lamports) => {
  const sol = lamports / LAMPORTS_PER_SOL;
  return sol.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
};

const formatUsd = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const timeAgo = (unixTs) => {
  const seconds = Math.floor(Date.now() / 1000) - unixTs;
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// ── LocalStorage persistence ─────────────────────────────────────────────────
function loadSavedConnection() {
  try {
    const saved = localStorage.getItem('goated_phantom_pubkey');
    return saved || null;
  } catch {
    return null;
  }
}

function saveConnection(pubkey) {
  if (pubkey) localStorage.setItem('goated_phantom_pubkey', pubkey);
  else localStorage.removeItem('goated_phantom_pubkey');
}

// ── Solana RPC calls ─────────────────────────────────────────────────────────
async function fetchSolBalance(pubkey) {
  const res = await fetch(SOLANA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [pubkey],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result.value; // lamports
}

async function fetchRecentTransactions(pubkey) {
  const res = await fetch(SOLANA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getSignaturesForAddress',
      params: [pubkey, { limit: 10 }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result || [];
}

async function fetchSolPrice() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await res.json();
    return data.solana?.usd || 0;
  } catch {
    return 0;
  }
}

// ── Animation variants ───────────────────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ connected }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      connected
        ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20'
        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#00ff88] animate-pulse' : 'bg-zinc-500'}`} />
      {connected ? 'Connected' : 'Disconnected'}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sublabel, color = '#00ff88', index = 0 }) {
  return (
    <motion.div
      variants={fadeInUp}
      custom={index}
      className="bg-surface-1 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
        <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      {sublabel && <p className="text-xs text-zinc-500 mt-1">{sublabel}</p>}
    </motion.div>
  );
}

function TransactionRow({ tx, index }) {
  const isConfirmed = tx.confirmationStatus === 'finalized' || tx.confirmationStatus === 'confirmed';
  const sig = tx.signature;

  return (
    <motion.div
      variants={fadeInUp}
      custom={index}
      className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/[0.02] transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          tx.err ? 'bg-red-500/10' : 'bg-[#00ff88]/10'
        }`}>
          {tx.err
            ? <AlertCircle className="w-4 h-4 text-red-400" />
            : <ArrowUpRight className="w-4 h-4 text-[#00ff88]" />
          }
        </div>
        <div className="min-w-0">
          <p className="text-sm text-white font-medium truncate">
            {truncateAddress(sig)}
          </p>
          <p className="text-xs text-zinc-500">
            {tx.blockTime ? timeAgo(tx.blockTime) : 'Pending'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          tx.err
            ? 'bg-red-500/10 text-red-400'
            : isConfirmed
              ? 'bg-[#00ff88]/10 text-[#00ff88]'
              : 'bg-yellow-500/10 text-yellow-400'
        }`}>
          {tx.err ? 'Failed' : isConfirmed ? 'Confirmed' : 'Processing'}
        </span>
        <a
          href={`https://solscan.io/tx/${sig}`}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ExternalLink className="w-3.5 h-3.5 text-zinc-500 hover:text-[#00ff88]" />
        </a>
      </div>
    </motion.div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function WalletPage() {
  // Wallet state
  const [pubkey, setPubkey] = useState(() => loadSavedConnection());
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Data state
  const [balanceLamports, setBalanceLamports] = useState(null);
  const [solPrice, setSolPrice] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingTxs, setLoadingTxs] = useState(false);

  // Phantom detection
  const getProvider = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return window.phantom?.solana || window.solana || null;
  }, []);

  const isPhantomInstalled = useCallback(() => {
    const provider = getProvider();
    return provider?.isPhantom === true;
  }, [getProvider]);

  // ── Fetch wallet data ──────────────────────────────────────────────────────
  const refreshBalance = useCallback(async (address) => {
    const key = address || pubkey;
    if (!key) return;
    setLoadingBalance(true);
    try {
      const [balance, price] = await Promise.all([
        fetchSolBalance(key),
        fetchSolPrice(),
      ]);
      setBalanceLamports(balance);
      setSolPrice(price);
    } catch (err) {
      console.error('Balance fetch error:', err);
    } finally {
      setLoadingBalance(false);
    }
  }, [pubkey]);

  const refreshTransactions = useCallback(async (address) => {
    const key = address || pubkey;
    if (!key) return;
    setLoadingTxs(true);
    try {
      const txs = await fetchRecentTransactions(key);
      setTransactions(txs);
    } catch (err) {
      console.error('Transaction fetch error:', err);
    } finally {
      setLoadingTxs(false);
    }
  }, [pubkey]);

  const refreshAll = useCallback(async (address) => {
    await Promise.all([refreshBalance(address), refreshTransactions(address)]);
  }, [refreshBalance, refreshTransactions]);

  // ── Auto-reconnect on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!pubkey) return;

    const provider = getProvider();
    if (provider?.isPhantom) {
      provider.connect({ onlyIfTrusted: true })
        .then((resp) => {
          const key = resp.publicKey.toString();
          setPubkey(key);
          saveConnection(key);
          refreshAll(key);
        })
        .catch(() => {
          // User revoked — clear saved state
          setPubkey(null);
          saveConnection(null);
        });
    } else {
      // Phantom not available but we had a saved key — fetch data anyway
      refreshAll(pubkey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Connect ────────────────────────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    setError(null);
    setConnecting(true);

    const provider = getProvider();
    if (!provider?.isPhantom) {
      setError('phantom_not_installed');
      setConnecting(false);
      return;
    }

    try {
      const resp = await provider.connect();
      const key = resp.publicKey.toString();
      setPubkey(key);
      saveConnection(key);
      await refreshAll(key);
    } catch (err) {
      if (err.code === 4001) {
        setError('Connection request was rejected.');
      } else {
        setError(err.message || 'Failed to connect to Phantom.');
      }
    } finally {
      setConnecting(false);
    }
  }, [getProvider, refreshAll]);

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const disconnectWallet = useCallback(() => {
    const provider = getProvider();
    provider?.disconnect?.();
    setPubkey(null);
    saveConnection(null);
    setBalanceLamports(null);
    setTransactions([]);
    setSolPrice(0);
    setError(null);
  }, [getProvider]);

  // ── Copy address ───────────────────────────────────────────────────────────
  const copyAddress = useCallback(() => {
    if (!pubkey) return;
    navigator.clipboard.writeText(pubkey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [pubkey]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const solBalance = balanceLamports !== null ? balanceLamports / LAMPORTS_PER_SOL : 0;
  const usdValue = solBalance * solPrice;
  const isConnected = !!pubkey;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#00ff88]" />
            </div>
            Wallet
          </h1>
          <p className="text-sm text-zinc-500 mt-1 ml-[52px]">Manage your Solana wallet and bank connections</p>
        </div>
        <StatusBadge connected={isConnected} />
      </motion.div>

      {/* Error banner */}
      <AnimatePresence>
        {error && error !== 'phantom_not_installed' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400">
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">

        {/* ── Phantom Wallet Section ──────────────────────────────────── */}
        <motion.div variants={fadeInUp} custom={0}>
          <div className="bg-surface-1 border border-white/5 rounded-2xl overflow-hidden">
            {/* Section header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#ab9ff2]/10 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-[#ab9ff2]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Phantom Wallet</h2>
                  <p className="text-xs text-zinc-500">Solana Ecosystem</p>
                </div>
              </div>
              {isConnected && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => refreshAll()}
                    disabled={loadingBalance}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white disabled:opacity-40"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingBalance ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={disconnectWallet}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {!isConnected ? (
                  /* ── Not connected state ──────────────────────────────── */
                  <motion.div
                    key="disconnected"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {error === 'phantom_not_installed' ? (
                      /* Phantom not installed prompt */
                      <div className="text-center py-8 space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#ab9ff2]/10 flex items-center justify-center mx-auto">
                          <AlertCircle className="w-8 h-8 text-[#ab9ff2]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">Phantom Wallet Required</h3>
                          <p className="text-sm text-zinc-400 max-w-md mx-auto">
                            Phantom is the leading Solana wallet. Install it to connect your wallet and manage your SOL balance.
                          </p>
                        </div>
                        <a
                          href={PHANTOM_INSTALL_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ab9ff2] text-white font-medium text-sm hover:bg-[#9b8fe2] transition-colors"
                        >
                          Install Phantom
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setError(null)}
                          className="block mx-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-2"
                        >
                          Try connecting again
                        </button>
                      </div>
                    ) : (
                      /* Default connect prompt */
                      <div className="text-center py-8 space-y-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ab9ff2]/20 to-[#00ff88]/10 flex items-center justify-center mx-auto border border-white/5">
                          <Wallet className="w-8 h-8 text-[#ab9ff2]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">Connect Your Wallet</h3>
                          <p className="text-sm text-zinc-400 max-w-md mx-auto">
                            Connect your Phantom wallet to view your SOL balance, track transactions, and manage platform payments.
                          </p>
                        </div>
                        <button
                          onClick={connectWallet}
                          disabled={connecting}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00ff88] text-black font-semibold text-sm hover:bg-[#00e67a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {connecting ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Link2 className="w-4 h-4" />
                              Connect Phantom
                            </>
                          )}
                        </button>
                        <p className="text-xs text-zinc-600">
                          Solana network only. Ensure Phantom is installed.
                        </p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  /* ── Connected state ──────────────────────────────────── */
                  <motion.div
                    key="connected"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Address bar */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-[#ab9ff2]/20 flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-4 h-4 text-[#ab9ff2]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-zinc-500 mb-0.5">Wallet Address</p>
                        <p className="text-sm font-mono text-white truncate">{pubkey}</p>
                      </div>
                      <button
                        onClick={copyAddress}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                        title="Copy address"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-[#00ff88]" />
                        ) : (
                          <Copy className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>
                      <a
                        href={`https://solscan.io/account/${pubkey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                        title="View on Solscan"
                      >
                        <ExternalLink className="w-4 h-4 text-zinc-400" />
                      </a>
                    </div>

                    {/* Balance cards */}
                    <motion.div
                      variants={stagger}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                    >
                      <StatCard
                        icon={Coins}
                        label="SOL Balance"
                        value={loadingBalance && balanceLamports === null ? '---' : `${formatSol(balanceLamports || 0)} SOL`}
                        sublabel={solPrice > 0 ? `${formatUsd(usdValue)}` : 'Price unavailable'}
                        color="#ab9ff2"
                        index={0}
                      />
                      <StatCard
                        icon={ArrowUpRight}
                        label="SOL Price"
                        value={solPrice > 0 ? formatUsd(solPrice) : '---'}
                        sublabel="via CoinGecko"
                        color="#06b6d4"
                        index={1}
                      />
                      <StatCard
                        icon={Shield}
                        label="Platform Fee"
                        value={`${COMMISSION_RATE * 100}%`}
                        sublabel="On platform transactions"
                        color="#f59e0b"
                        index={2}
                      />
                    </motion.div>

                    {/* Recent transactions */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
                        <button
                          onClick={() => refreshTransactions()}
                          disabled={loadingTxs}
                          className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingTxs ? 'animate-spin' : ''}`} />
                          Refresh
                        </button>
                      </div>

                      <div className="bg-black/30 border border-white/5 rounded-xl overflow-hidden">
                        {loadingTxs && transactions.length === 0 ? (
                          <div className="py-10 text-center">
                            <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin mx-auto mb-2" />
                            <p className="text-sm text-zinc-500">Loading transactions...</p>
                          </div>
                        ) : transactions.length === 0 ? (
                          <div className="py-10 text-center">
                            <ArrowDownLeft className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                            <p className="text-sm text-zinc-500">No recent transactions</p>
                            <p className="text-xs text-zinc-600 mt-1">Transactions will appear here once activity occurs</p>
                          </div>
                        ) : (
                          <motion.div
                            variants={stagger}
                            initial="hidden"
                            animate="visible"
                            className="divide-y divide-white/5"
                          >
                            {transactions.map((tx, i) => (
                              <TransactionRow key={tx.signature} tx={tx} index={i} />
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

        {/* ── Fiat / Bank Account Section ───────────────────────────── */}
        <motion.div variants={fadeInUp} custom={1}>
          <div className="bg-surface-1 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Bank & Fiat</h2>
                  <p className="text-xs text-zinc-500">USD deposits, withdrawals & card payments</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Plaid + Stripe
              </span>
            </div>
            <div className="p-6 space-y-6">
              {/* Bank Connection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-black/30 border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <div>
                      <h3 className="text-sm font-semibold text-white">Bank Account (ACH)</h3>
                      <p className="text-xs text-zinc-500">Link via Plaid for direct transfers</p>
                    </div>
                  </div>
                  <button
                    onClick={() => alert('Plaid integration requires PLAID_CLIENT_ID and PLAID_SECRET environment variables. Add them to your .env file to enable bank connections.')}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/15 text-blue-400 font-medium text-sm border border-blue-500/20 hover:bg-blue-500/25 transition-colors"
                  >
                    <Link2 className="w-4 h-4" />
                    Connect Bank Account
                  </button>
                  <p className="text-[10px] text-zinc-600 mt-2 text-center">256-bit encryption · FDIC insured transfers</p>
                </div>

                <div className="p-5 rounded-xl bg-black/30 border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    <div>
                      <h3 className="text-sm font-semibold text-white">Card Payments</h3>
                      <p className="text-xs text-zinc-500">Credit/debit via Stripe</p>
                    </div>
                  </div>
                  <button
                    onClick={() => alert('Stripe integration requires STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY environment variables. Add them to your .env file to enable card payments.')}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-500/15 text-purple-400 font-medium text-sm border border-purple-500/20 hover:bg-purple-500/25 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Add Payment Method
                  </button>
                  <p className="text-[10px] text-zinc-600 mt-2 text-center">Visa, Mastercard, Amex · PCI compliant</p>
                </div>
              </div>

              {/* Fiat Balance Display */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">USD Balance</p>
                  <p className="text-lg font-bold text-white">$0.00</p>
                </div>
                <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Pending</p>
                  <p className="text-lg font-bold text-zinc-500">$0.00</p>
                </div>
                <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Total Deposited</p>
                  <p className="text-lg font-bold text-zinc-500">$0.00</p>
                </div>
                <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Total Withdrawn</p>
                  <p className="text-lg font-bold text-zinc-500">$0.00</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand/10 text-brand border border-brand/20 text-sm font-medium hover:bg-brand/20 transition-colors">
                  <ArrowDownLeft size={16} /> Deposit USD
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-sm font-medium text-zinc-300 hover:bg-white/[0.04] transition-colors">
                  <ArrowUpRight size={16} /> Withdraw USD
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-sm font-medium text-zinc-300 hover:bg-white/[0.04] transition-colors">
                  <RefreshCw size={16} /> Convert to SOL
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Platform Commission Info ────────────────────────────────── */}
        <motion.div variants={fadeInUp} custom={2}>
          <div className="bg-surface-1 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#00ff88]/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#00ff88]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Platform Commission</h2>
                <p className="text-xs text-zinc-500">Transaction fee structure</p>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-black/30 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-4 h-4 text-[#00ff88]" />
                    <span className="text-xs font-medium text-zinc-400">Deal Commission</span>
                  </div>
                  <p className="text-2xl font-bold text-white">12%</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Applied to every platform-processed transaction. Covers escrow, dispute resolution, and platform operations.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-black/30 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpRight className="w-4 h-4 text-[#06b6d4]" />
                    <span className="text-xs font-medium text-zinc-400">Withdrawal Fee</span>
                  </div>
                  <p className="text-2xl font-bold text-white">$2.50</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Flat fee per withdrawal to external wallets. No minimum withdrawal amount.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-black/30 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-[#a855f7]" />
                    <span className="text-xs font-medium text-zinc-400">Escrow Protection</span>
                  </div>
                  <p className="text-2xl font-bold text-white">Free</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    All deals include on-chain escrow at no extra cost. Funds are released only when both parties confirm.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stripe section integrated into Bank & Fiat above */}

      </motion.div>
    </div>
  );
}
