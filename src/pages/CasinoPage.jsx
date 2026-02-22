import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dice5, TrendingUp, Clock, Users, Zap, Trophy, DollarSign, BarChart3, Flame, Target } from 'lucide-react';

const markets = [
  { q: 'Will Q1 2026 SaaS M&A exceed $50B?', yes: 1.8, no: 2.2, category: 'M&A', volume: '$2.4M', ends: '2d 14h', hot: true },
  { q: 'Will AI SDR tools hit 1M users by March?', yes: 1.4, no: 3.0, category: 'AI', volume: '$890K', ends: '5d 8h', hot: true },
  { q: 'Will Stripe go public in 2026?', yes: 2.1, no: 1.7, category: 'IPO', volume: '$5.1M', ends: '45d', hot: false },
  { q: 'Will TikTok be banned in the US?', yes: 4.5, no: 1.2, category: 'Regulation', volume: '$12.3M', ends: '30d', hot: true },
  { q: 'Will Bitcoin hit $150K by Q2?', yes: 2.8, no: 1.5, category: 'Crypto', volume: '$8.7M', ends: '90d', hot: false },
  { q: 'Will OpenAI revenue exceed $10B in 2026?', yes: 1.3, no: 3.5, category: 'AI', volume: '$3.2M', ends: '180d', hot: false },
];

const games = [
  { name: 'Deal or No Deal', desc: 'Guess if a lead converts', players: 1247, reward: '$500', type: 'prediction' },
  { name: 'Pipeline Poker', desc: 'Bet on pipeline outcomes', players: 892, reward: '$1,000', type: 'card' },
  { name: 'Trend Roulette', desc: 'Spin on trending topics', players: 2341, reward: '$250', type: 'spin' },
  { name: 'Close Race', desc: 'Who closes fastest?', players: 567, reward: '$2,000', type: 'race' },
];

const categories = ['All', 'AI', 'M&A', 'IPO', 'Crypto', 'Regulation'];

export default function CasinoPage() {
  const [tab, setTab] = useState('markets');
  const [balance] = useState(10000);
  const [selectedCat, setSelectedCat] = useState('All');
  const [betAmounts, setBetAmounts] = useState({});

  const filteredMarkets = selectedCat === 'All' ? markets : markets.filter(m => m.category === selectedCat);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Dice5 size={28} className="text-brand" />
          <div><h1 className="text-2xl font-bold">Prediction Casino</h1><p className="text-slate-500">Bet on markets, trends, and outcomes</p></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-surface-3 border border-white/10">
            <span className="text-slate-500 text-sm">Balance:</span>
            <span className="font-bold text-lg ml-2">${balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ id: 'markets', label: 'Prediction Markets', icon: BarChart3 }, { id: 'games', label: 'Live Games', icon: Dice5 }, { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-brand/15 text-brand border border-brand/30' : 'bg-surface-3 text-slate-400 border border-white/5 hover:text-white'}`}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'markets' && (
        <>
          {/* Category filter */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map(c => (
              <button key={c} onClick={() => setSelectedCat(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedCat === c ? 'bg-brand/15 text-brand border border-brand/30' : 'bg-surface-3 text-slate-500 border border-white/5'}`}>
                {c}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredMarkets.map((m, i) => (
              <motion.div key={i} className="bg-surface-3 rounded-xl border border-white/5 overflow-hidden"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {m.hot && <span className="px-2 py-0.5 bg-red-500/15 text-red-400 text-xs font-bold rounded-full flex items-center gap-1"><Flame size={12} />HOT</span>}
                        <span className="px-2 py-0.5 bg-white/5 text-slate-400 text-xs rounded-full">{m.category}</span>
                      </div>
                      <h3 className="font-bold text-lg">{m.q}</h3>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div className="flex items-center gap-1 justify-end"><Clock size={12} />{m.ends}</div>
                      <div className="flex items-center gap-1 justify-end mt-1"><DollarSign size={12} />{m.volume}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button className="p-4 rounded-xl bg-brand/10 border border-brand/20 hover:border-brand/40 transition-all group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-brand">YES</span>
                        <span className="text-2xl font-black text-white">{m.yes}x</span>
                      </div>
                      <div className="text-xs text-slate-500">Potential return on $100: <span className="text-brand font-bold">${(100 * m.yes).toFixed(0)}</span></div>
                    </button>
                    <button className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-all group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-red-400">NO</span>
                        <span className="text-2xl font-black text-white">{m.no}x</span>
                      </div>
                      <div className="text-xs text-slate-500">Potential return on $100: <span className="text-red-400 font-bold">${(100 * m.no).toFixed(0)}</span></div>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" placeholder="Bet amount" className="flex-1 px-3 py-2 bg-surface-1 border border-white/5 rounded-lg text-sm outline-none focus:border-brand/30"
                      value={betAmounts[i] || ''} onChange={e => setBetAmounts({ ...betAmounts, [i]: e.target.value })} />
                    <button className="px-4 py-2 rounded-lg bg-brand text-black font-medium text-sm">Place Bet</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {tab === 'games' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {games.map((g, i) => (
            <motion.div key={i} className="bg-surface-3 rounded-xl p-5 border border-white/5 card-hover"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-brand/15 flex items-center justify-center"><Dice5 size={24} className="text-brand" /></div>
                <div><h3 className="font-bold text-lg">{g.name}</h3><p className="text-sm text-slate-500">{g.desc}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface-2 rounded-lg p-3"><div className="text-xs text-slate-500">Players</div><div className="font-bold">{g.players.toLocaleString()}</div></div>
                <div className="bg-surface-2 rounded-lg p-3"><div className="text-xs text-slate-500">Prize Pool</div><div className="font-bold text-brand">{g.reward}</div></div>
              </div>
              <button className="w-full py-2.5 rounded-lg bg-brand/15 text-brand font-medium text-sm hover:bg-brand/25 transition-colors">Play Now</button>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="bg-surface-3 rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5"><h2 className="font-semibold flex items-center gap-2"><Trophy size={18} className="text-yellow-400" />Top Predictors</h2></div>
          {[
            { name: 'DegenKing', pnl: '+$24,500', winRate: '78%', rank: 1 },
            { name: 'AlphaSniper', pnl: '+$18,200', winRate: '72%', rank: 2 },
            { name: 'TrendMaster', pnl: '+$15,800', winRate: '68%', rank: 3 },
            { name: 'CryptoGoat', pnl: '+$12,100', winRate: '65%', rank: 4 },
            { name: 'PipelineKing', pnl: '+$9,400', winRate: '63%', rank: 5 },
          ].map((p, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-white/5 last:border-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i < 3 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-surface-2 text-slate-500'}`}>{p.rank}</div>
              <div className="flex-1"><div className="font-medium">{p.name}</div></div>
              <div className="text-right"><div className="font-bold text-brand">{p.pnl}</div><div className="text-xs text-slate-500">Win rate: {p.winRate}</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
