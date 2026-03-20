import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useGoatedAI } from '../hooks/useGoatedAI';

// Real-time market data fetcher
function useTickerData() {
  const [data, setData] = useState([
    { label: 'BTC', value: '$97,420', change: '+2.1%', src: 'CoinGecko', positive: true },
    { label: 'ETH', value: '$3,841', change: '+4.7%', src: 'CoinGecko', positive: true },
    { label: 'SOL', value: '$198', change: '+6.3%', src: 'CoinGecko', positive: true },
    { label: 'Trend Score', value: '94/100', change: '+7', src: 'Pulse', positive: true },
    { label: 'Fear & Greed', value: '72', change: 'Greed', src: 'Alt.me', positive: true },
    { label: 'Active Signals', value: '23', change: 'LIVE', src: 'GOATED', positive: true },
    { label: 'AI Coach', value: 'Ready', change: 'LIVE', src: 'GOATED', positive: true },
    { label: 'Pipeline', value: '$4.2M', change: '+8.3%', src: 'Pipeline', positive: true },
    { label: 'Win Rate', value: '34%', change: '+5.1%', src: 'Analytics', positive: true },
    { label: 'Active Leads', value: '250K+', change: '+127', src: 'LeadGen', positive: true },
    { label: 'Meetings', value: '47', change: '+12', src: 'Calendar', positive: true },
    { label: 'Revenue MTD', value: '$892K', change: '+34%', src: 'Revenue', positive: true },
    { label: 'Close Rate', value: '28%', change: '+3.2%', src: 'Analytics', positive: true },
    { label: 'Avg Deal', value: '$47K', change: '+$5K', src: 'Revenue', positive: true },
    { label: 'Top Sector', value: 'SaaS', change: 'Hot', src: 'Intel', positive: true },
  ]);

  useEffect(() => {
    let mounted = true;
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/market-data');
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted || !json.prices) return;
        setData(prev => {
          const updated = [...prev];
          json.prices.slice(0, 3).forEach((coin, i) => {
            if (updated[i]) {
              updated[i] = {
                ...updated[i],
                value: `$${coin.current_price?.toLocaleString() || updated[i].value}`,
                change: `${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(1) || '0'}%`,
                positive: (coin.price_change_percentage_24h || 0) >= 0,
              };
            }
          });
          return updated;
        });
      } catch { /* use fallback data */ }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return data;
}

export default React.memo(function Ticker() {
  const rawData = useTickerData();
  const degenMode = useStore(s => s.degenMode);
  const { regime, sentiment: aiSentiment } = useGoatedAI();

  // Compute degen alpha data in an effect to avoid setState-during-render
  const [degenAlpha, setDegenAlpha] = useState(null);
  useEffect(() => {
    if (!degenMode) { setDegenAlpha(null); return; }
    setDegenAlpha(useStore.getState().getDegenAlpha());
  }, [degenMode]);

  // Merge AI engine data into ticker
  const aiTickerItems = useMemo(() => {
    const items = [];
    if (regime) {
      items.push({ label: 'Regime', value: regime.name || 'Unknown', change: regime.action || '', src: 'AI ENGINE', positive: regime.name !== 'Markdown' });
    }
    if (aiSentiment?.composite != null) {
      const s = Math.round(aiSentiment.composite);
      items.push({ label: 'AI Sentiment', value: `${s}/100`, change: s >= 60 ? 'Bullish' : s >= 40 ? 'Neutral' : 'Bearish', src: 'GOATED AI', positive: s >= 50 });
    }
    return items;
  }, [regime, aiSentiment]);

  const data = useMemo(() => {
    let combined = [...rawData, ...aiTickerItems];
    if (degenMode && degenAlpha?.tickerAlpha) combined = [...combined, ...degenAlpha.tickerAlpha];
    return combined;
  }, [rawData, aiTickerItems, degenMode, degenAlpha]);

  const scrollRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef(0);
  const speedRef = useRef(0.65);
  const singleWidthRef = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const measure = () => {
      if (el.scrollWidth > 0) {
        singleWidthRef.current = el.scrollWidth / 4;
      }
    };
    requestAnimationFrame(measure);

    const tick = () => {
      posRef.current -= speedRef.current;
      const sw = singleWidthRef.current;
      if (sw > 0 && Math.abs(posRef.current) >= sw) {
        posRef.current += sw;
      }
      el.style.transform = `translate3d(${posRef.current}px, 0, 0)`;
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    const onEnter = () => { speedRef.current = 0.2; };
    const onLeave = () => { speedRef.current = 0.65; };
    const parent = el.parentElement;
    parent?.addEventListener('mouseenter', onEnter, { passive: true });
    parent?.addEventListener('mouseleave', onLeave, { passive: true });

    return () => {
      cancelAnimationFrame(animRef.current);
      parent?.removeEventListener('mouseenter', onEnter);
      parent?.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // Re-measure singleWidth when data changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      if (el.scrollWidth > 0) {
        singleWidthRef.current = el.scrollWidth / 4;
      }
    });
  }, [data]);

  // Quadruple for seamless loop
  const repeated = useMemo(() => [...data, ...data, ...data, ...data], [data]);

  return (
    <div className="fixed top-0 left-0 right-0 h-9 z-50 overflow-hidden border-b border-white/[0.03] hidden sm:block" style={{ background: 'rgba(0,0,0,0.97)' }}>
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 50%, transparent 100%)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(270deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 50%, transparent 100%)' }} />

      <div ref={scrollRef} className="flex will-change-transform" style={{ backfaceVisibility: 'hidden' }}>
        {repeated.map((t, i) => (
          <div key={i} className="flex items-center gap-1.5 px-3 h-9 whitespace-nowrap text-[11px]">
            <span className="text-slate-600 font-mono uppercase tracking-wider text-[9px]">{t.src}</span>
            <span className="text-slate-500">{t.label}</span>
            <span className="font-semibold text-slate-200">{t.value}</span>
            <span className={`font-mono font-medium ${t.change === 'LIVE' ? '' : t.positive !== false ? 'text-brand' : 'text-red-400'}`}>
              {t.change === 'LIVE' ? (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                  <span className="text-brand font-bold text-[10px]">LIVE</span>
                </span>
              ) : t.change}
            </span>
            <span className="text-white/[0.04] mx-1">|</span>
          </div>
        ))}
      </div>
    </div>
  );
});
