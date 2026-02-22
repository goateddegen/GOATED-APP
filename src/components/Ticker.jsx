import React from 'react';

const items = [
  { label: 'Total Leads', value: '2,500', change: '+12%' },
  { label: 'Pipeline', value: '$4.2M', change: '+8%' },
  { label: 'Win Rate', value: '34%', change: '+5%' },
  { label: 'Avg Deal', value: '$168K', change: '+15%' },
  { label: 'Active', value: '847', change: '+23%' },
  { label: 'Closed Today', value: '12', change: '+3' },
  { label: 'AI Agents', value: '5 active', change: 'LIVE' },
  { label: 'Trend Score', value: '94', change: '+7' },
];

export default function Ticker() {
  const tripled = [...items, ...items, ...items];
  return (
    <div className="fixed top-0 left-0 right-0 h-9 glass z-50 overflow-hidden border-b border-white/5">
      <div className="flex" style={{ animation: 'scroll 35s linear infinite' }}>
        {tripled.map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-5 h-9 whitespace-nowrap text-[13px]">
            <span className="text-slate-500">{t.label}:</span>
            <span className="font-medium text-slate-200">{t.value}</span>
            <span className={t.change.startsWith('+') || t.change === 'LIVE' ? 'text-brand' : 'text-red-400'}>
              {t.change === 'LIVE' ? <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />{t.change}</span> : t.change}
            </span>
            <span className="text-white/10 mx-3">|</span>
          </div>
        ))}
      </div>
    </div>
  );
}
