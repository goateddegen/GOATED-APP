import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { feature } from 'topojson-client';

// ============================================================================
// WORLD MAP — Custom 2D geographic representation with heatmap overlay
// Black background matching app UI/UX, plots major economic/population centers
// ============================================================================

const W = 1000;
const H = 500;
const project = (lng, lat) => [
  ((lng + 180) / 360) * W,
  ((90 - lat) / 180) * H,
];

// Convert GeoJSON coordinates to SVG path string
function geoToPath(geometry) {
  const pathSegments = [];
  const ringToPath = (ring) => {
    return ring.map((coord, i) => {
      const [x, y] = project(coord[0], coord[1]);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ') + ' Z';
  };
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(ring => pathSegments.push(ringToPath(ring)));
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(polygon => polygon.forEach(ring => pathSegments.push(ringToPath(ring))));
  }
  return pathSegments.join(' ');
}

// ── Major global economic/population centers ────────────────────────────────
// Each center has: name, lat, lng, type (financial/tech/trade/emerging), GDP weight
const GLOBAL_CENTERS = [
  // North America
  { name: 'New York', lat: 40.71, lng: -74.01, type: 'financial', weight: 1.0, region: 'US East' },
  { name: 'San Francisco', lat: 37.77, lng: -122.42, type: 'tech', weight: 0.9, region: 'US West' },
  { name: 'Los Angeles', lat: 34.05, lng: -118.24, type: 'trade', weight: 0.8, region: 'US West' },
  { name: 'Chicago', lat: 41.88, lng: -87.63, type: 'financial', weight: 0.75, region: 'US Central' },
  { name: 'Houston', lat: 29.76, lng: -95.37, type: 'trade', weight: 0.65, region: 'US South' },
  { name: 'Miami', lat: 25.76, lng: -80.19, type: 'financial', weight: 0.6, region: 'US South' },
  { name: 'Toronto', lat: 43.65, lng: -79.38, type: 'financial', weight: 0.65, region: 'Canada' },
  { name: 'Mexico City', lat: 19.43, lng: -99.13, type: 'emerging', weight: 0.55, region: 'LATAM' },
  { name: 'Seattle', lat: 47.61, lng: -122.33, type: 'tech', weight: 0.7, region: 'US West' },
  { name: 'Austin', lat: 30.27, lng: -97.74, type: 'tech', weight: 0.55, region: 'US South' },
  { name: 'Atlanta', lat: 33.75, lng: -84.39, type: 'trade', weight: 0.55, region: 'US South' },
  { name: 'Boston', lat: 42.36, lng: -71.06, type: 'tech', weight: 0.6, region: 'US East' },
  { name: 'Denver', lat: 39.74, lng: -104.99, type: 'tech', weight: 0.45, region: 'US West' },
  { name: 'Vancouver', lat: 49.28, lng: -123.12, type: 'tech', weight: 0.5, region: 'Canada' },
  // South America
  { name: 'Sao Paulo', lat: -23.55, lng: -46.63, type: 'financial', weight: 0.7, region: 'LATAM' },
  { name: 'Buenos Aires', lat: -34.60, lng: -58.38, type: 'financial', weight: 0.45, region: 'LATAM' },
  { name: 'Bogota', lat: 4.71, lng: -74.07, type: 'emerging', weight: 0.4, region: 'LATAM' },
  { name: 'Santiago', lat: -33.45, lng: -70.67, type: 'emerging', weight: 0.4, region: 'LATAM' },
  { name: 'Lima', lat: -12.05, lng: -77.04, type: 'emerging', weight: 0.35, region: 'LATAM' },
  // Europe
  { name: 'London', lat: 51.51, lng: -0.13, type: 'financial', weight: 1.0, region: 'Europe' },
  { name: 'Frankfurt', lat: 50.11, lng: 8.68, type: 'financial', weight: 0.7, region: 'Europe' },
  { name: 'Paris', lat: 48.86, lng: 2.35, type: 'financial', weight: 0.75, region: 'Europe' },
  { name: 'Zurich', lat: 47.38, lng: 8.54, type: 'financial', weight: 0.65, region: 'Europe' },
  { name: 'Amsterdam', lat: 52.37, lng: 4.90, type: 'tech', weight: 0.55, region: 'Europe' },
  { name: 'Berlin', lat: 52.52, lng: 13.41, type: 'tech', weight: 0.6, region: 'Europe' },
  { name: 'Stockholm', lat: 59.33, lng: 18.07, type: 'tech', weight: 0.5, region: 'Europe' },
  { name: 'Dublin', lat: 53.35, lng: -6.26, type: 'tech', weight: 0.5, region: 'Europe' },
  { name: 'Madrid', lat: 40.42, lng: -3.70, type: 'trade', weight: 0.5, region: 'Europe' },
  { name: 'Milan', lat: 45.46, lng: 9.19, type: 'financial', weight: 0.55, region: 'Europe' },
  { name: 'Warsaw', lat: 52.23, lng: 21.01, type: 'emerging', weight: 0.4, region: 'Europe' },
  { name: 'Istanbul', lat: 41.01, lng: 28.98, type: 'trade', weight: 0.55, region: 'Europe' },
  { name: 'Moscow', lat: 55.76, lng: 37.62, type: 'financial', weight: 0.5, region: 'Europe' },
  // Middle East / Africa
  { name: 'Dubai', lat: 25.20, lng: 55.27, type: 'financial', weight: 0.8, region: 'MENA' },
  { name: 'Tel Aviv', lat: 32.09, lng: 34.78, type: 'tech', weight: 0.6, region: 'MENA' },
  { name: 'Riyadh', lat: 24.69, lng: 46.72, type: 'financial', weight: 0.55, region: 'MENA' },
  { name: 'Lagos', lat: 6.52, lng: 3.38, type: 'emerging', weight: 0.45, region: 'Africa' },
  { name: 'Nairobi', lat: -1.29, lng: 36.82, type: 'emerging', weight: 0.35, region: 'Africa' },
  { name: 'Cairo', lat: 30.04, lng: 31.24, type: 'emerging', weight: 0.4, region: 'MENA' },
  { name: 'Johannesburg', lat: -26.20, lng: 28.05, type: 'financial', weight: 0.4, region: 'Africa' },
  { name: 'Cape Town', lat: -33.93, lng: 18.42, type: 'trade', weight: 0.3, region: 'Africa' },
  // Asia Pacific
  { name: 'Tokyo', lat: 35.68, lng: 139.69, type: 'financial', weight: 0.95, region: 'Asia' },
  { name: 'Shanghai', lat: 31.23, lng: 121.47, type: 'financial', weight: 0.9, region: 'Asia' },
  { name: 'Beijing', lat: 39.90, lng: 116.40, type: 'financial', weight: 0.85, region: 'Asia' },
  { name: 'Hong Kong', lat: 22.32, lng: 114.17, type: 'financial', weight: 0.85, region: 'Asia' },
  { name: 'Singapore', lat: 1.35, lng: 103.82, type: 'financial', weight: 0.8, region: 'Asia' },
  { name: 'Seoul', lat: 37.57, lng: 126.98, type: 'tech', weight: 0.75, region: 'Asia' },
  { name: 'Bangalore', lat: 12.97, lng: 77.59, type: 'tech', weight: 0.7, region: 'Asia' },
  { name: 'Mumbai', lat: 19.08, lng: 72.88, type: 'financial', weight: 0.75, region: 'Asia' },
  { name: 'Delhi', lat: 28.61, lng: 77.21, type: 'trade', weight: 0.6, region: 'Asia' },
  { name: 'Shenzhen', lat: 22.54, lng: 114.06, type: 'tech', weight: 0.7, region: 'Asia' },
  { name: 'Sydney', lat: -33.87, lng: 151.21, type: 'financial', weight: 0.65, region: 'Oceania' },
  { name: 'Melbourne', lat: -37.81, lng: 144.96, type: 'trade', weight: 0.45, region: 'Oceania' },
  { name: 'Jakarta', lat: -6.21, lng: 106.85, type: 'emerging', weight: 0.5, region: 'Asia' },
  { name: 'Bangkok', lat: 13.76, lng: 100.50, type: 'trade', weight: 0.45, region: 'Asia' },
  { name: 'Taipei', lat: 25.03, lng: 121.57, type: 'tech', weight: 0.55, region: 'Asia' },
  { name: 'Kuala Lumpur', lat: 3.14, lng: 101.69, type: 'trade', weight: 0.4, region: 'Asia' },
  { name: 'Ho Chi Minh', lat: 10.82, lng: 106.63, type: 'emerging', weight: 0.4, region: 'Asia' },
  { name: 'Manila', lat: 14.60, lng: 120.98, type: 'emerging', weight: 0.35, region: 'Asia' },
  // ── Additional Africa ──
  { name: 'Accra', lat: 5.56, lng: -0.19, type: 'emerging', weight: 0.3, region: 'Africa' },
  { name: 'Dar es Salaam', lat: -6.79, lng: 39.28, type: 'emerging', weight: 0.3, region: 'Africa' },
  { name: 'Casablanca', lat: 33.57, lng: -7.59, type: 'trade', weight: 0.35, region: 'Africa' },
  { name: 'Addis Ababa', lat: 9.02, lng: 38.75, type: 'emerging', weight: 0.3, region: 'Africa' },
  { name: 'Kigali', lat: -1.94, lng: 30.06, type: 'emerging', weight: 0.25, region: 'Africa' },
  // ── Additional Asia ──
  { name: 'Osaka', lat: 34.69, lng: 135.50, type: 'financial', weight: 0.5, region: 'Asia' },
  { name: 'Hanoi', lat: 21.03, lng: 105.85, type: 'emerging', weight: 0.35, region: 'Asia' },
  { name: 'Phnom Penh', lat: 11.56, lng: 104.92, type: 'emerging', weight: 0.2, region: 'Asia' },
  { name: 'Yangon', lat: 16.87, lng: 96.20, type: 'emerging', weight: 0.25, region: 'Asia' },
  { name: 'Dhaka', lat: 23.81, lng: 90.41, type: 'emerging', weight: 0.35, region: 'Asia' },
  { name: 'Karachi', lat: 24.86, lng: 67.01, type: 'trade', weight: 0.4, region: 'Asia' },
  { name: 'Colombo', lat: 6.93, lng: 79.84, type: 'emerging', weight: 0.25, region: 'Asia' },
  { name: 'Almaty', lat: 43.24, lng: 76.95, type: 'emerging', weight: 0.25, region: 'Asia' },
  { name: 'Tashkent', lat: 41.30, lng: 69.28, type: 'emerging', weight: 0.25, region: 'Asia' },
  // ── Additional Europe ──
  { name: 'Helsinki', lat: 60.17, lng: 24.94, type: 'tech', weight: 0.4, region: 'Europe' },
  { name: 'Oslo', lat: 59.91, lng: 10.75, type: 'financial', weight: 0.45, region: 'Europe' },
  { name: 'Copenhagen', lat: 55.68, lng: 12.57, type: 'tech', weight: 0.45, region: 'Europe' },
  { name: 'Lisbon', lat: 38.72, lng: -9.14, type: 'tech', weight: 0.4, region: 'Europe' },
  { name: 'Prague', lat: 50.08, lng: 14.44, type: 'tech', weight: 0.35, region: 'Europe' },
  { name: 'Budapest', lat: 47.50, lng: 19.04, type: 'emerging', weight: 0.3, region: 'Europe' },
  { name: 'Bucharest', lat: 44.43, lng: 26.10, type: 'emerging', weight: 0.3, region: 'Europe' },
  { name: 'Athens', lat: 37.98, lng: 23.73, type: 'trade', weight: 0.3, region: 'Europe' },
  { name: 'Kyiv', lat: 50.45, lng: 30.52, type: 'emerging', weight: 0.3, region: 'Europe' },
  // ── Additional Americas ──
  { name: 'Phoenix', lat: 33.45, lng: -112.07, type: 'tech', weight: 0.45, region: 'US West' },
  { name: 'Dallas', lat: 32.78, lng: -96.80, type: 'financial', weight: 0.5, region: 'US South' },
  { name: 'Montreal', lat: 45.50, lng: -73.57, type: 'tech', weight: 0.4, region: 'Canada' },
  { name: 'Monterrey', lat: 25.69, lng: -100.32, type: 'trade', weight: 0.35, region: 'LATAM' },
  { name: 'Medellin', lat: 6.25, lng: -75.56, type: 'emerging', weight: 0.3, region: 'LATAM' },
  { name: 'Quito', lat: -0.18, lng: -78.47, type: 'emerging', weight: 0.25, region: 'LATAM' },
  { name: 'Havana', lat: 23.11, lng: -82.37, type: 'emerging', weight: 0.2, region: 'LATAM' },
  // ── Additional Middle East ──
  { name: 'Abu Dhabi', lat: 24.45, lng: 54.65, type: 'financial', weight: 0.5, region: 'MENA' },
  { name: 'Doha', lat: 25.29, lng: 51.53, type: 'financial', weight: 0.45, region: 'MENA' },
  { name: 'Kuwait City', lat: 29.38, lng: 47.99, type: 'financial', weight: 0.35, region: 'MENA' },
  { name: 'Amman', lat: 31.95, lng: 35.93, type: 'emerging', weight: 0.25, region: 'MENA' },
  { name: 'Beirut', lat: 33.89, lng: 35.50, type: 'trade', weight: 0.25, region: 'MENA' },
  // ── Additional Oceania ──
  { name: 'Auckland', lat: -36.85, lng: 174.76, type: 'trade', weight: 0.35, region: 'Oceania' },
  { name: 'Brisbane', lat: -27.47, lng: 153.03, type: 'trade', weight: 0.35, region: 'Oceania' },
  { name: 'Perth', lat: -31.95, lng: 115.86, type: 'trade', weight: 0.3, region: 'Oceania' },
];

// Type colors
const TYPE_COLORS = {
  financial: { base: '#10b981', glow: 'rgba(16,185,129,0.3)' },
  tech: { base: '#06b6d4', glow: 'rgba(6,182,212,0.3)' },
  trade: { base: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  emerging: { base: '#a855f7', glow: 'rgba(168,85,247,0.3)' },
};

// Trending topics per region for the detail popup
const REGION_TOPICS = {
  'US East': ['AI Enterprise Sales', 'Wall Street Fintech', 'Healthcare SaaS'],
  'US West': ['GenAI Infrastructure', 'Climate Tech', 'Web3 Gaming'],
  'US Central': ['AgTech Automation', 'Supply Chain AI', 'Insurance Tech'],
  'US South': ['Energy Transition', 'Space Tech', 'Defense Contracts'],
  'Canada': ['Mining Tech', 'Cannabis Tech', 'Immigration SaaS'],
  'LATAM': ['Neobanking', 'E-commerce Logistics', 'Remittance Tech'],
  'Europe': ['Green Energy', 'GDPR Compliance', 'Open Banking'],
  'MENA': ['Smart City Projects', 'Sovereign Wealth', 'Islamic Fintech'],
  'Africa': ['Mobile Money', 'AgriTech', 'Solar Infrastructure'],
  'Asia': ['Semiconductor Race', 'EV Battery Tech', 'Super Apps'],
  'Oceania': ['Mining Automation', 'Renewable Grid', 'Pacific Trade Routes'],
};

// Activity types per center type
const ACTIVITY_TYPES = {
  financial: ['Capital Flow', 'IPO Pipeline', 'M&A Activity', 'Fund Raising'],
  tech: ['Startup Funding', 'Talent Migration', 'Patent Filing', 'R&D Spend'],
  trade: ['Port Volume', 'Export Growth', 'FDI Inflow', 'Trade Deals'],
  emerging: ['Market Entry', 'Infrastructure Build', 'VC Scouting', 'Growth Signal'],
};

// ── Detail Popup Card ─────────────────────────────────────────────────────
function DetailCard({ center, onClose }) {
  if (!center) return null;

  const sentimentScore = Math.round(60 + center.intensity * 35);
  const volume = Math.round(1000 + center.intensity * 9000).toLocaleString();
  const activities = ACTIVITY_TYPES[center.type] || ACTIVITY_TYPES.financial;
  const activity = activities[Math.floor(center.i % activities.length)];
  const topics = REGION_TOPICS[center.region] || ['Market Growth', 'Digital Transform', 'Trade Expansion'];
  const typeColor = TYPE_COLORS[center.type] || TYPE_COLORS.financial;

  return (
    <div className="mt-4 mx-auto max-w-xl rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full" style={{ background: typeColor.base, boxShadow: `0 0 8px ${typeColor.base}` }} />
            <h3 className="text-lg font-bold text-white">{center.name}</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border"
              style={{ color: typeColor.base, borderColor: typeColor.base + '40', background: typeColor.base + '15' }}>
              {center.type}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">{center.region}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors p-1"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-white/5 border border-white/5 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Activity</div>
          <div className="text-sm font-semibold text-white">{activity}</div>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/5 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Volume</div>
          <div className="text-sm font-semibold text-white">{volume}</div>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/5 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Sentiment</div>
          <div className="text-sm font-semibold" style={{ color: sentimentScore >= 80 ? '#10b981' : sentimentScore >= 60 ? '#f59e0b' : '#ef4444' }}>
            {sentimentScore}%
            <span className="text-[10px] ml-1">{sentimentScore >= 80 ? 'Bullish' : sentimentScore >= 60 ? 'Neutral' : 'Bearish'}</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Trending in {center.region}</div>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic, i) => (
            <span key={i} className="px-2.5 py-1 rounded-full text-[11px] bg-white/5 border border-white/10 text-slate-300">
              {topic}
            </span>
          ))}
        </div>
      </div>

      <button
        className="w-full py-2 rounded-lg text-sm font-semibold transition-all"
        style={{
          background: `linear-gradient(135deg, ${typeColor.base}20, ${typeColor.base}10)`,
          border: `1px solid ${typeColor.base}40`,
          color: typeColor.base,
        }}
        onClick={() => {/* Could navigate to alpha view */}}
      >
        View Alpha
      </button>
    </div>
  );
}

// ── Main WorldMap Component ─────────────────────────────────────────────────
export default function WorldMap({ hotspots = [], className = '', onCenterClick }) {
  const [landPaths, setLandPaths] = useState(null);
  const [hoveredCenter, setHoveredCenter] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(null);

  useEffect(() => {
    let mounted = true;
    import('world-atlas/countries-110m.json').then(topoData => {
      if (!mounted) return;
      const data = topoData.default || topoData;
      const countries = feature(data, data.objects.countries);
      const paths = countries.features.map(f => geoToPath(f.geometry));
      setLandPaths(paths);
    }).catch(() => {
      import('world-atlas/land-110m.json').then(topoData => {
        if (!mounted) return;
        const data = topoData.default || topoData;
        const land = feature(data, data.objects.land);
        const paths = land.features.map(f => geoToPath(f.geometry));
        setLandPaths(paths);
      }).catch(() => {});
    });
    return () => { mounted = false; };
  }, []);

  // Merge hotspots with built-in centers
  const allPoints = useMemo(() => {
    // If hotspots provided, use those
    if (hotspots.length > 0) {
      return hotspots.map((h, i) => {
        const [x, y] = project(h.lng, h.lat);
        const intensity = h.intensity || 0.5;
        const size = 3 + intensity * 8;
        const typeColor = TYPE_COLORS[h.type] || TYPE_COLORS.financial;
        return { ...h, x, y, size, color: typeColor.base, glow: typeColor.glow, intensity, i };
      });
    }
    // Default: show all global centers
    return GLOBAL_CENTERS.map((c, i) => {
      const [x, y] = project(c.lng, c.lat);
      const size = 2 + c.weight * 6;
      const typeColor = TYPE_COLORS[c.type];
      return { ...c, x, y, size, color: typeColor.base, glow: typeColor.glow, intensity: c.weight, i };
    });
  }, [hotspots]);

  const handleCenterClick = useCallback((center) => {
    setSelectedCenter(prev => prev && prev.i === center.i ? null : center);
    if (onCenterClick) onCenterClick(center);
  }, [onCenterClick]);

  const isSelected = useCallback((h) => selectedCenter && selectedCenter.i === h.i, [selectedCenter]);

  return (
    <div className={`relative w-full ${className}`}>
      <div style={{ aspectRatio: '2/1', minHeight: 220, position: 'relative' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Glow filter definitions */}
          <defs>
            {Object.entries(TYPE_COLORS).map(([type, { base }]) => (
              <radialGradient key={`grad-${type}`} id={`glow-grad-${type}`}>
                <stop offset="0%" stopColor={base} stopOpacity="0.4" />
                <stop offset="50%" stopColor={base} stopOpacity="0.1" />
                <stop offset="100%" stopColor={base} stopOpacity="0" />
              </radialGradient>
            ))}
            {/* Hover expanded glow gradient */}
            {Object.entries(TYPE_COLORS).map(([type, { base }]) => (
              <radialGradient key={`hover-grad-${type}`} id={`hover-glow-${type}`}>
                <stop offset="0%" stopColor={base} stopOpacity="0.6" />
                <stop offset="40%" stopColor={base} stopOpacity="0.2" />
                <stop offset="100%" stopColor={base} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>

          {/* Pure black background matching app UI */}
          <rect width={W} height={H} fill="#000000" />

          {/* Land masses — clean country borders on black */}
          {landPaths ? (
            landPaths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="rgba(16,185,129,0.18)"
                stroke="rgba(16,185,129,0.35)"
                strokeWidth="0.5"
                strokeLinejoin="round"
              />
            ))
          ) : (
            <text x={W / 2} y={H / 2} textAnchor="middle" fill="rgba(255,255,255,0.1)" fontSize="14" fontFamily="monospace">Loading map...</text>
          )}

          {/* Heatmap glow underlays — bigger radius */}
          {allPoints.map((h) => (
            <circle
              key={`glow-${h.i}`}
              cx={h.x} cy={h.y}
              r={hoveredCenter && hoveredCenter.i === h.i ? h.size * 10 : h.size * 7}
              fill={`url(#${hoveredCenter && hoveredCenter.i === h.i ? 'hover-glow' : 'glow-grad'}-${h.type})`}
              opacity={hoveredCenter && hoveredCenter.i === h.i ? 0.25 : 0.08 + h.intensity * 0.1}
              style={{ transition: 'r 0.3s ease, opacity 0.3s ease' }}
            />
          ))}

          {/* Animated pulse rings for ALL dots — faster for higher weight */}
          {allPoints.map((h) => {
            const pulseDur = Math.max(1.5, 4 - h.intensity * 3);
            return (
              <circle
                key={`ring-${h.i}`}
                cx={h.x} cy={h.y}
                r={h.size}
                fill="none"
                stroke={h.color}
                strokeWidth="0.8"
                opacity="0.4"
              >
                <animate
                  attributeName="r"
                  values={`${h.size};${h.size * 3.5};${h.size}`}
                  dur={`${pulseDur}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.3;0.02;0.3"
                  dur={`${pulseDur}s`}
                  repeatCount="indefinite"
                />
              </circle>
            );
          })}

          {/* Core dots — MUCH bigger for visibility + click target */}
          {allPoints.map((h) => (
            <g key={`core-${h.i}`}>
              {/* Invisible hit area for easier clicking */}
              <circle
                cx={h.x} cy={h.y}
                r={Math.max(8, h.size * 1.5)}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={() => handleCenterClick(h)}
                onMouseEnter={() => setHoveredCenter(h)}
                onMouseLeave={() => setHoveredCenter(null)}
              />
              {/* Selected center white highlight ring */}
              {isSelected(h) && (
                <circle
                  cx={h.x} cy={h.y}
                  r={Math.max(7, h.size * 1.1)}
                  fill="none"
                  stroke="white"
                  strokeWidth="1.2"
                  opacity="0.9"
                >
                  <animate
                    attributeName="opacity"
                    values="0.9;0.5;0.9"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              {/* Bright outer ring — bigger */}
              <circle
                cx={h.x} cy={h.y}
                r={Math.max(5, h.size * 0.9)}
                fill="none"
                stroke={h.color}
                strokeWidth="1"
                opacity={0.5 + h.intensity * 0.3}
              />
              {/* Solid core — bigger */}
              <circle
                cx={h.x} cy={h.y}
                r={Math.max(3.5, h.size * 0.7)}
                fill={h.color}
                opacity={0.85 + h.intensity * 0.15}
                style={{ cursor: 'pointer', filter: `drop-shadow(0 0 4px ${h.color}80)` }}
                onClick={() => handleCenterClick(h)}
              />
            </g>
          ))}

          {/* Labels for hovered center */}
          {hoveredCenter && (
            <g>
              <rect
                x={hoveredCenter.x - 40} y={hoveredCenter.y - 22}
                width="80" height="18" rx="3"
                fill="rgba(0,0,0,0.85)"
                stroke={hoveredCenter.color}
                strokeWidth="0.5"
              />
              <text
                x={hoveredCenter.x} y={hoveredCenter.y - 10}
                textAnchor="middle" fill="white"
                fontSize="7" fontFamily="monospace"
              >
                {hoveredCenter.name}
              </text>
            </g>
          )}

          {/* Region labels */}
          <text x="220" y="130" textAnchor="middle" fill="rgba(255,255,255,0.06)" fontSize="10" fontFamily="monospace" letterSpacing="2">NORTH AMERICA</text>
          <text x="270" y="310" textAnchor="middle" fill="rgba(255,255,255,0.06)" fontSize="10" fontFamily="monospace" letterSpacing="2">SOUTH AMERICA</text>
          <text x="510" y="130" textAnchor="middle" fill="rgba(255,255,255,0.06)" fontSize="10" fontFamily="monospace" letterSpacing="2">EUROPE</text>
          <text x="570" y="230" textAnchor="middle" fill="rgba(255,255,255,0.06)" fontSize="10" fontFamily="monospace" letterSpacing="2">MENA</text>
          <text x="530" y="310" textAnchor="middle" fill="rgba(255,255,255,0.06)" fontSize="10" fontFamily="monospace" letterSpacing="2">AFRICA</text>
          <text x="750" y="170" textAnchor="middle" fill="rgba(255,255,255,0.06)" fontSize="10" fontFamily="monospace" letterSpacing="2">ASIA PACIFIC</text>
          <text x="830" y="380" textAnchor="middle" fill="rgba(255,255,255,0.06)" fontSize="10" fontFamily="monospace" letterSpacing="2">OCEANIA</text>
        </svg>

        {/* HTML tooltip overlays — bigger hover targets (min 28px) */}
        {allPoints.map((h) => (
          <div
            key={`tip-${h.i}`}
            className="absolute group"
            style={{
              left: `${(h.x / W) * 100}%`,
              top: `${(h.y / H) * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: Math.max(28, h.size * 4),
              height: Math.max(28, h.size * 4),
              cursor: 'pointer',
            }}
            onClick={() => handleCenterClick(h)}
            onMouseEnter={() => setHoveredCenter(h)}
            onMouseLeave={() => setHoveredCenter(null)}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-md bg-black/95 border border-white/10 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
              <div className="font-semibold text-white">{h.name}</div>
              {h.region && <div className="text-slate-400 mt-0.5">{h.region}</div>}
              {h.activity && <div className="text-slate-400 mt-0.5">{h.activity} · {h.volume}</div>}
              <div className="text-slate-500 mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: h.color }} />
                {h.type && <span className="capitalize">{h.type}</span>}
                {h.intensity && <span>· {Math.round(h.intensity * 100)}%</span>}
              </div>
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex gap-3 text-[9px] text-slate-500">
          {Object.entries(TYPE_COLORS).map(([type, { base }]) => (
            <div key={type} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: base }} />
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail popup card shown below map when a center is selected */}
      {selectedCenter && (
        <DetailCard
          center={selectedCenter}
          onClose={() => setSelectedCenter(null)}
        />
      )}
    </div>
  );
}
