import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUp, ArrowDown, Globe, Zap, BarChart3, ExternalLink, Clock, Eye } from 'lucide-react';
import GoatLogo from '../components/GoatLogo';

const trends = [
  { name: 'AI Sales Automation', change: '+42%', score: 94, category: 'AI/ML', momentum: 'rising', volume: '12.4K', description: 'AI-powered SDR tools and automated outreach platforms are seeing massive adoption across B2B.', hotness: 'blazing' },
  { name: 'Revenue Intelligence', change: '+38%', score: 89, category: 'SaaS', momentum: 'rising', volume: '8.7K', description: 'Platforms that unify pipeline data, forecast revenue, and provide deal insights.', hotness: 'hot' },
  { name: 'Creator Economy B2B', change: '+35%', score: 85, category: 'Creator', momentum: 'rising', volume: '15.2K', description: 'B2B creators building audiences and monetizing through courses, communities, and consulting.', hotness: 'hot' },
  { name: 'RevOps Consolidation', change: '+27%', score: 82, category: 'Operations', momentum: 'rising', volume: '6.3K', description: 'Companies merging sales, marketing, and CS ops into unified revenue operations.', hotness: 'warming' },
  { name: 'Vertical SaaS', change: '+24%', score: 78, category: 'SaaS', momentum: 'stable', volume: '9.1K', description: 'Industry-specific software beating horizontal players in niche markets.', hotness: 'warming' },
  { name: 'Prediction Markets', change: '+31%', score: 76, category: 'Fintech', momentum: 'rising', volume: '22.8K', description: 'Kalshi, Polymarket and betting on real-world outcomes gaining mainstream traction.', hotness: 'hot' },
  { name: 'Cold Outreach', change: '-8%', score: 45, category: 'Sales', momentum: 'declining', volume: '4.2K', description: 'Traditional spray-and-pray cold email losing effectiveness against AI-powered alternatives.', hotness: 'cooling' },
  { name: 'Manual CRM Entry', change: '-15%', score: 32, category: 'Legacy', momentum: 'declining', volume: '2.1K', description: 'Manual data entry in CRMs being replaced by auto-capture and AI enrichment.', hotness: 'dead' },
];

const hotnessColors = { blazing: '#ef4444', hot: '#f97316', warming: '#f59e0b', cooling: '#3b82f6', dead: '#64748b' };

export default function TrendsPage() {
  const [selected, setSelected] = useState(null);
  const canvasRef = useRef(null);

  // Simple animated globe canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = 300;
    const h = canvas.height = 300;
    let frame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, r = 100;

      // Globe outline
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16,185,129,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Latitude lines
      for (let i = -2; i <= 2; i++) {
        const y = cy + i * 25;
        const rx = Math.sqrt(r * r - (i * 25) * (i * 25));
        ctx.beginPath();
        ctx.ellipse(cx, y, rx, 5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(16,185,129,0.15)';
        ctx.stroke();
      }

      // Longitude lines (rotating)
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI + frame * 0.005;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.abs(Math.cos(angle)) * r, r, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(16,185,129,0.15)';
        ctx.stroke();
      }

      // Hotspots
      const hotspots = [
        { lat: 0.3, lon: frame * 0.01, size: 4, pulse: true },
        { lat: -0.2, lon: frame * 0.01 + 1, size: 3, pulse: true },
        { lat: 0.5, lon: frame * 0.01 + 2.5, size: 5, pulse: true },
        { lat: -0.4, lon: frame * 0.01 + 4, size: 3, pulse: false },
        { lat: 0.1, lon: frame * 0.01 + 5, size: 4, pulse: true },
      ];

      hotspots.forEach(hs => {
        const x = cx + Math.cos(hs.lon) * r * 0.8 * Math.cos(hs.lat * Math.PI);
        const y = cy + Math.sin(hs.lat * Math.PI) * r * 0.8;
        if (Math.cos(hs.lon) > -0.3) {
          const pulseSize = hs.pulse ? hs.size + Math.sin(frame * 0.05) * 2 : hs.size;
          ctx.beginPath();
          ctx.arc(x, y, pulseSize + 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(16,185,129,0.1)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
          ctx.fillStyle = '#10b981';
          ctx.fill();
        }
      });

      frame++;
      requestAnimationFrame(draw);
    };
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp size={28} className="text-brand" />
        <div><h1 className="text-2xl font-bold">Trend Pulse</h1><p className="text-slate-500">Real-time market intelligence</p></div>
      </div>

      {/* Globe Visualizer */}
      <div className="bg-surface-3 rounded-xl p-6 border border-white/5 mb-6 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><Globe size={20} className="text-brand" />Global Trend Pulse</h3>
            <p className="text-slate-400 text-sm mb-4">Real-time market activity across regions</p>
            <div className="grid grid-cols-3 gap-4">
              {[{ region: 'North America', activity: 'Very High', color: '#10b981' }, { region: 'Europe', activity: 'High', color: '#06b6d4' }, { region: 'Asia Pacific', activity: 'Rising', color: '#f59e0b' }].map(r => (
                <div key={r.region} className="bg-surface-2 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">{r.region}</div>
                  <div className="font-bold text-sm" style={{ color: r.color }}>{r.activity}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block"><canvas ref={canvasRef} width={300} height={300} className="opacity-80" /></div>
        </div>
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {trends.map((t, i) => (
          <motion.button key={i} onClick={() => setSelected(selected === i ? null : i)}
            className={`bg-surface-3 rounded-xl p-5 border text-left card-hover ${selected === i ? 'border-brand/40 ring-1 ring-brand/20' : 'border-white/5'}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold">{t.name}</h3>
                  <span className="w-2 h-2 rounded-full" style={{ background: hotnessColors[t.hotness] }} />
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400">{t.category}</span>
                  <span className="flex items-center gap-1 text-slate-500"><Eye size={12} />{t.volume}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-mono font-bold ${t.change.startsWith('+') ? 'text-brand' : 'text-red-400'}`}>{t.change}</span>
                <div className="flex items-center gap-1 text-xs text-slate-500 justify-end mt-0.5">
                  {t.momentum === 'rising' ? <ArrowUp size={12} className="text-brand" /> : t.momentum === 'declining' ? <ArrowDown size={12} className="text-red-400" /> : null}
                  {t.momentum}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${t.score}%`, background: t.score >= 70 ? '#10b981' : t.score >= 40 ? '#f59e0b' : '#ef4444' }} />
              </div>
              <span className="font-bold text-sm">{t.score}</span>
            </div>
            {selected === i && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t border-white/5">
                <p className="text-sm text-slate-400 leading-relaxed mb-3">{t.description}</p>
                <div className="flex gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 capitalize">{t.hotness}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-slate-400">Trend Score: {t.score}</span>
                </div>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
