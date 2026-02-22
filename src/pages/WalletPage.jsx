import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowUpRight, ArrowDownRight, Plus, Send, RefreshCw, ExternalLink, Shield, Copy, Check } from 'lucide-react';

const chains = [
  { name: 'Ethereum', sym: 'ETH', bal: 2.45, usd: 8575, change: '+3.2%', color: '#627eea', icon: 'E' },
  { name: 'Solana', sym: 'SOL', bal: 145.8, usd: 14580, change: '+5.1%', color: '#9945ff', icon: 'S' },
  { name: 'Polygon', sym: 'MATIC', bal: 5420, usd: 5420, change: '-1.2%', color: '#8247e5', icon: 'P' },
  { name: 'Bitcoin', sym: 'BTC', bal: 0.15, usd: 14250, change: '+2.8%', color: '#f7931a', icon: 'B' },
];

const transactions = [
  { type: 'received', amount: '+0.5 ETH', usd: '$1,750', from: '0x742d...1a3f', time: '2 hours ago', chain: 'Ethereum' },
  { type: 'sent', amount: '-2,000 MATIC', usd: '$2,000', from: '0x891c...4b2e', time: '5 hours ago', chain: 'Polygon' },
  { type: 'received', amount: '+15 SOL', usd: '$1,500', from: '9kXn...8mPq', time: '1 day ago', chain: 'Solana' },
  { type: 'commission', amount: '+$3,400', usd: '$3,400', from: 'Deal #1247', time: '2 days ago', chain: 'Revenue' },
];

const wallets = [
  { name: 'MetaMask', icon: '🦊', connected: false, chains: ['ETH', 'MATIC'] },
  { name: 'Phantom', icon: '👻', connected: false, chains: ['SOL'] },
  { name: 'Coinbase Wallet', icon: '🔵', connected: false, chains: ['ETH', 'BTC'] },
];

export default function WalletPage() {
  const [connecting, setConnecting] = useState(null);
  const [copied, setCopied] = useState(false);
  const total = chains.reduce((s, c) => s + c.usd, 0);

  const copyAddress = () => {
    navigator.clipboard.writeText('0x742d35Cc6634C0532925a3b844Bc9e7595f1a3f');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Wallet size={28} className="text-brand" />
        <div><h1 className="text-2xl font-bold">Wallet & Revenue</h1><p className="text-slate-500">Multi-chain wallet and revenue tracking</p></div>
      </div>

      {/* Total Value */}
      <motion.div className="rounded-2xl p-8 text-center mb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(15,23,42,0.9) 50%, rgba(6,182,212,0.15) 100%)' }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="absolute inset-0 neon-border rounded-2xl" />
        <div className="relative">
          <p className="text-slate-400 mb-2">Total Portfolio Value</p>
          <h2 className="text-5xl font-black mb-2">${total.toLocaleString()}</h2>
          <span className="text-brand text-sm font-medium">+$2,450 (5.8%) today</span>
          <div className="flex justify-center gap-3 mt-4">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-black font-medium text-sm"><Plus size={16} />Deposit</button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white text-sm"><Send size={16} />Send</button>
            <button onClick={copyAddress} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white text-sm">{copied ? <Check size={16} className="text-brand" /> : <Copy size={16} />}{copied ? 'Copied' : 'Address'}</button>
          </div>
        </div>
      </motion.div>

      {/* Chains */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {chains.map((c, i) => (
          <motion.div key={c.name} className="bg-surface-3 rounded-xl p-4 border border-white/5 card-hover"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: `${c.color}20`, color: c.color }}>{c.icon}</div>
              <div><div className="font-medium">{c.name}</div><div className="text-xs text-slate-500">{c.sym}</div></div>
            </div>
            <div className="text-xl font-bold mb-1">${c.usd.toLocaleString()}</div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">{c.bal} {c.sym}</span>
              <span className={`text-xs font-medium ${c.change.startsWith('+') ? 'text-brand' : 'text-red-400'}`}>{c.change}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transactions */}
        <div className="bg-surface-3 rounded-xl border border-white/5">
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <h2 className="font-semibold">Recent Transactions</h2>
            <button className="text-xs text-brand hover:underline">View all</button>
          </div>
          {transactions.map((t, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'received' || t.type === 'commission' ? 'bg-brand/15 text-brand' : 'bg-red-500/15 text-red-400'}`}>
                {t.type === 'received' || t.type === 'commission' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{t.amount}</div>
                <div className="text-xs text-slate-500 truncate">{t.from}</div>
              </div>
              <div className="text-right">
                <div className="text-sm">{t.usd}</div>
                <div className="text-xs text-slate-500">{t.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Connect Wallets */}
        <div className="bg-surface-3 rounded-xl border border-white/5">
          <div className="p-4 border-b border-white/5"><h2 className="font-semibold flex items-center gap-2"><Shield size={16} className="text-brand" />Connect Wallet</h2></div>
          <div className="p-4 space-y-3">
            {wallets.map((w, i) => (
              <button key={i} onClick={() => setConnecting(w.name)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-2 border border-white/5 hover:border-brand/20 transition-all">
                <span className="text-2xl">{w.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{w.name}</div>
                  <div className="text-xs text-slate-500">Supports: {w.chains.join(', ')}</div>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-brand/15 text-brand text-xs font-medium">
                  {connecting === w.name ? <RefreshCw size={14} className="animate-spin" /> : 'Connect'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
