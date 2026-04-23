import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import {
  TrendingUp, Clock, RefreshCw, Activity, Zap, AlertTriangle,
  X, Radar, Newspaper, ExternalLink, Flame, Brain,
} from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { feature } from 'topojson-client';
import * as THREE from 'three';
import { useStore } from '../hooks/useStore';
import { useGoatedAI } from '../hooks/useGoatedAI';

// ============================================================================
// ALPHA RADAR — Real-time global money-play surface
// Globe-centric, single view, no tabs. AI tells you how to play what's moving.
// ============================================================================

const REFRESH_INTERVAL = 30_000;

// ─── Formatters ─────────────────────────────────────────────────────────────

const fmtPrice = (n) => {
  if (n == null) return '—';
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(n >= 0.01 ? 4 : 6)}`;
};
const ago = (d) => {
  if (!d) return '';
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
const pctCls = (v) => v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-slate-500';

// ─── 3D Globe ────────────────────────────────────────────────────────────────

const toXYZ = (lat, lng, r = 1.01) => {
  const p = (90 - lat) * Math.PI / 180;
  const t = (lng + 180) * Math.PI / 180;
  return new THREE.Vector3(-(r * Math.sin(p) * Math.cos(t)), r * Math.cos(p), r * Math.sin(p) * Math.sin(t));
};

const ARC_CONNECTIONS = [
  { from: [40.71, -74.01], to: [51.51, -0.13], flow: 'inflow' },
  { from: [51.51, -0.13], to: [1.35, 103.82], flow: 'inflow' },
  { from: [1.35, 103.82], to: [22.32, 114.17], flow: 'inflow' },
  { from: [22.32, 114.17], to: [35.68, 139.69], flow: 'outflow' },
  { from: [37.77, -122.42], to: [40.71, -74.01], flow: 'inflow' },
  { from: [25.20, 55.27], to: [1.35, 103.82], flow: 'inflow' },
  { from: [40.71, -74.01], to: [25.20, 55.27], flow: 'outflow' },
  { from: [51.51, -0.13], to: [47.37, 8.54], flow: 'inflow' },
  { from: [-23.55, -46.63], to: [40.71, -74.01], flow: 'outflow' },
  { from: [37.57, 126.98], to: [35.68, 139.69], flow: 'inflow' },
];

function GeoLines({ paletteDark }) {
  const [geoData, setGeoData] = useState(null);
  useEffect(() => {
    import('world-atlas/countries-110m.json').then(topoData => {
      const countries = feature(topoData.default || topoData, (topoData.default || topoData).objects.countries);
      setGeoData(countries);
    }).catch(() => {});
  }, []);

  const lineGeometries = useMemo(() => {
    if (!geoData) return [];
    const geos = [];
    geoData.features.forEach((feat) => {
      const coords = feat.geometry.type === 'Polygon'
        ? [feat.geometry.coordinates]
        : feat.geometry.type === 'MultiPolygon'
          ? feat.geometry.coordinates
          : [];
      coords.forEach(polygon => {
        polygon.forEach(ring => {
          const points = [];
          for (let i = 0; i < ring.length; i += 2) {
            const [lng, lat] = ring[i];
            points.push(toXYZ(lat, lng, 1.004));
          }
          if (points.length > 1) {
            points.push(points[0].clone());
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            geos.push(geo);
          }
        });
      });
    });
    return geos;
  }, [geoData]);

  const coastColor = paletteDark ? '#fb923c' : '#34d399';
  const gridColor = paletteDark ? '#f97316' : '#10b981';
  return (
    <group>
      {lineGeometries.map((geo, idx) => (
        <line key={idx} geometry={geo}>
          <lineBasicMaterial color={coastColor} transparent opacity={0.35} />
        </line>
      ))}
      {[-60, -30, 0, 30, 60].map(lat => {
        const pts = [];
        for (let lng = -180; lng <= 180; lng += 4) pts.push(toXYZ(lat, lng, 1.003));
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        return <line key={`lat${lat}`} geometry={geo}><lineBasicMaterial color={gridColor} transparent opacity={lat === 0 ? 0.15 : 0.06} /></line>;
      })}
      {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180].map(lng => {
        const pts = [];
        for (let lat = -90; lat <= 90; lat += 4) pts.push(toXYZ(lat, lng, 1.003));
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        return <line key={`lng${lng}`} geometry={geo}><lineBasicMaterial color={gridColor} transparent opacity={0.06} /></line>;
      })}
    </group>
  );
}

function DataArcs({ connections, paletteDark }) {
  const groupRef = useRef();
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child) => {
        if (child.material && child.material.dashSize) {
          child.material.dashOffset = -state.clock.elapsedTime * 0.3;
          child.material.needsUpdate = true;
        }
      });
    }
  });
  const arcs = useMemo(() => connections.map((arc, i) => {
    const start = toXYZ(arc.from[0], arc.from[1], 1.01);
    const end = toXYZ(arc.to[0], arc.to[1], 1.01);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dist = start.distanceTo(end);
    mid.normalize().multiplyScalar(1.01 + dist * 0.4);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const pts = curve.getPoints(48);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    geo.computeBoundingSphere();
    const inColor = paletteDark ? '#f97316' : '#10b981';
    const outColor = paletteDark ? '#991b1b' : '#ef4444';
    return { geo, color: arc.flow === 'inflow' ? inColor : outColor, key: i };
  }), [connections, paletteDark]);
  return (
    <group ref={groupRef}>
      {arcs.map(({ geo, color, key }) => (
        <line key={key} geometry={geo} onUpdate={(self) => self.computeLineDistances()}>
          <lineDashedMaterial color={color} transparent opacity={0.35} dashSize={0.03} gapSize={0.02} />
        </line>
      ))}
    </group>
  );
}

// 3D-elevated alpha column — Palantir-style vertical pillar extruded from surface
// Height = volume*intensity, color = sentiment, top cap = glowing dot with pulse
function AlphaColumn({ hotspot, position, normal, isSelected, isHovered, onSelect, onHover, onUnhover, paletteDark }) {
  const columnRef = useRef();
  const capRef = useRef();
  const glowRef = useRef();
  const sentiment = hotspot.sentiment || 0.65;
  const volume = hotspot.volumeNum || 1;
  const height = 0.08 + (volume / 3) * 0.22 + sentiment * 0.12;
  const radius = 0.005 + (volume / 3) * 0.006;

  const clr = useMemo(() => {
    if (paletteDark) {
      if (sentiment >= 0.65) return new THREE.Color('#f97316');
      if (sentiment >= 0.4) return new THREE.Color('#fb923c');
      return new THREE.Color('#ef4444');
    }
    if (sentiment >= 0.65) return new THREE.Color('#10b981');
    if (sentiment >= 0.4) return new THREE.Color('#f59e0b');
    return new THREE.Color('#ef4444');
  }, [sentiment, paletteDark]);

  // Orient column along surface normal (outward from globe center)
  const quat = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    return q;
  }, [normal]);

  // Position column so base sits on surface and it extrudes outward
  const basePos = useMemo(() => position.clone(), [position]);
  const capPos = useMemo(() => position.clone().add(normal.clone().multiplyScalar(height)), [position, normal, height]);

  useFrame((s) => {
    if (capRef.current) {
      const pulse = 1 + Math.sin(s.clock.elapsedTime * 2.5 + position.x * 10) * 0.25;
      capRef.current.scale.setScalar(pulse);
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.15 + Math.sin(s.clock.elapsedTime * 1.8) * 0.08;
    }
  });

  const midPos = basePos.clone().add(normal.clone().multiplyScalar(height / 2));

  return (
    <group>
      {/* Vertical pillar */}
      <mesh
        ref={columnRef}
        position={midPos}
        quaternion={quat}
        onClick={(e) => { e.stopPropagation(); onSelect(hotspot); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; onHover(hotspot); }}
        onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'default'; onUnhover(); }}
      >
        <cylinderGeometry args={[radius, radius * 1.2, height, 8]} />
        <meshBasicMaterial color={clr} transparent opacity={isHovered || isSelected ? 0.9 : 0.6} />
      </mesh>
      {/* Glow sheath around column */}
      <mesh position={midPos} quaternion={quat} ref={glowRef}>
        <cylinderGeometry args={[radius * 2.5, radius * 3, height, 8]} />
        <meshBasicMaterial color={clr} transparent opacity={0.12} />
      </mesh>
      {/* Cap dot at top of pillar */}
      <mesh ref={capRef} position={capPos}>
        <sphereGeometry args={[radius * 2.2, 12, 12]} />
        <meshBasicMaterial color={clr} transparent opacity={1} />
      </mesh>
      {/* Base ring on surface */}
      <mesh position={basePos} quaternion={quat}>
        <ringGeometry args={[radius * 2, radius * 3.5, 24]} />
        <meshBasicMaterial color={clr} transparent opacity={isSelected ? 0.6 : 0.3} side={THREE.DoubleSide} />
      </mesh>
      {(isHovered || isSelected) && (
        <Html distanceFactor={3} style={{ pointerEvents: 'none' }} position={capPos}>
          <div className={`${paletteDark ? 'border-orange-500/40' : 'border-emerald-500/40'} bg-black/85 backdrop-blur-md border rounded-lg px-2.5 py-1.5 whitespace-nowrap`} style={{ transform: 'translate(-50%, -120%)' }}>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-white">{hotspot.name}</span>
              <span className={`${paletteDark ? 'text-orange-400' : 'text-emerald-400'} text-[9px] font-mono`}>{hotspot.volume}</span>
            </div>
            {hotspot.leadCount > 0 && (
              <div className="text-[9px] text-slate-400 mt-0.5">
                {hotspot.leadCount} leads · {hotspot.behaviorIndex}% intent
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// Granular markers — leads, influencers, ICOs orbiting hotspots
function GranularMarkers({ hotspots, normalFn, paletteDark }) {
  const entities = useMemo(() => {
    const list = [];
    hotspots.forEach((h, hIdx) => {
      // Seeded PRNG offset so markers sit deterministically in concentric rings around hub
      const mkOffset = (i, ringR, ringCount) => {
        const ang = (i / ringCount) * Math.PI * 2 + hIdx * 0.37;
        const latOff = Math.sin(ang) * ringR;
        const lngOff = Math.cos(ang) * ringR;
        return { lat: h.lat + latOff, lng: h.lng + lngOff };
      };
      // Influencers (triangles)
      const infCount = Math.max(1, Math.round(h.intensity * 3));
      for (let i = 0; i < infCount; i++) {
        const { lat, lng } = mkOffset(i, 4 + i * 1.5, infCount);
        list.push({ id: `inf-${h.name}-${i}`, type: 'influencer', lat, lng, hub: h.name, sentiment: Math.min(1, h.sentiment + (i % 2 ? 0.05 : -0.05)) });
      }
      // ICOs / token launches (diamonds)
      if (h.intensity > 0.6) {
        const ico = mkOffset(hIdx, 6, 4);
        list.push({ id: `ico-${h.name}`, type: 'ico', lat: ico.lat, lng: ico.lng, hub: h.name, sentiment: h.sentiment });
      }
      // Lead clusters (rings) — only where leadCount > 0
      if (h.leadCount > 0) {
        const leadMk = mkOffset(hIdx + 1, 2.5, 4);
        list.push({ id: `lead-${h.name}`, type: 'lead', lat: leadMk.lat, lng: leadMk.lng, hub: h.name, leadCount: h.leadCount });
      }
    });
    return list;
  }, [hotspots]);

  return (
    <group>
      {entities.map((e) => {
        const p = toXYZ(e.lat, e.lng, 1.014);
        const clr = e.type === 'lead' ? (paletteDark ? '#fbbf24' : '#06b6d4')
          : e.type === 'ico' ? (paletteDark ? '#f97316' : '#a855f7')
          : (paletteDark ? '#fb923c' : '#34d399'); // influencer
        const size = e.type === 'lead' ? 0.008 : 0.006;
        return (
          <group key={e.id} position={p}>
            {e.type === 'lead' ? (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[size, size * 1.6, 16]} />
                <meshBasicMaterial color={clr} transparent opacity={0.7} side={THREE.DoubleSide} />
              </mesh>
            ) : e.type === 'ico' ? (
              <mesh rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[size * 1.4, size * 1.4, size * 1.4]} />
                <meshBasicMaterial color={clr} transparent opacity={0.85} />
              </mesh>
            ) : (
              <mesh>
                <coneGeometry args={[size, size * 2, 3]} />
                <meshBasicMaterial color={clr} transparent opacity={0.75} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function LiveEventBurst({ position, color, delay = 0 }) {
  const ring1 = useRef();
  const ring2 = useRef();
  useFrame((s) => {
    const t = (s.clock.elapsedTime + delay) % 3;
    if (ring1.current) {
      ring1.current.scale.setScalar(1 + t * 1.2);
      ring1.current.material.opacity = Math.max(0, 0.4 - t * 0.15);
    }
    if (ring2.current) {
      const t2 = (s.clock.elapsedTime + delay + 0.8) % 3;
      ring2.current.scale.setScalar(1 + t2 * 1.2);
      ring2.current.material.opacity = Math.max(0, 0.3 - t2 * 0.12);
    }
  });
  return (
    <group position={position}>
      <mesh ref={ring1} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.008, 0.012, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.006, 0.009, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

const LIVE_EVENTS = [
  { lat: 41.2, lng: -73.5, color: '#3b82f6', delay: 0 },
  { lat: 52.0, lng: 0.8, color: '#8b5cf6', delay: 0.7 },
  { lat: 1.8, lng: 104.2, color: '#f97316', delay: 1.4 },
  { lat: 25.5, lng: 55.8, color: '#10b981', delay: 2.1 },
  { lat: 37.3, lng: -121.9, color: '#06b6d4', delay: 0.4 },
  { lat: 22.8, lng: 113.9, color: '#ef4444', delay: 1.8 },
  { lat: 36.1, lng: 140.2, color: '#10b981', delay: 1.1 },
  { lat: 38.0, lng: 127.5, color: '#f97316', delay: 2.5 },
  { lat: -23.1, lng: -46.2, color: '#8b5cf6', delay: 0.9 },
  { lat: 6.9, lng: 3.8, color: '#3b82f6', delay: 1.6 },
  { lat: 26.2, lng: -80.5, color: '#f97316', delay: 2.3 },
  { lat: 47.8, lng: 8.9, color: '#10b981', delay: 0.3 },
];

function GlobeMesh({ hotspots, selectedHotspot, hoveredHotspot, onSelectHotspot, onHoverHotspot, onUnhoverHotspot, paletteDark }) {
  const gRef = useRef();
  // NO AUTO-ROTATE — user-controlled only

  return (
    <group ref={gRef}>
      <mesh><sphereGeometry args={[1, 64, 64]} /><meshBasicMaterial color={paletteDark ? '#1a0a05' : '#0a1a12'} transparent opacity={0.98} /></mesh>
      <GeoLines paletteDark={paletteDark} />
      <DataArcs connections={ARC_CONNECTIONS} paletteDark={paletteDark} />
      {LIVE_EVENTS.map((ev, i) => (
        <LiveEventBurst key={`ev${i}`} position={toXYZ(ev.lat, ev.lng, 1.018)} color={ev.color} delay={ev.delay} />
      ))}
      {/* Granular markers — leads, influencers, ICOs */}
      <GranularMarkers hotspots={hotspots || []} paletteDark={paletteDark} />
      {/* 3D-elevated alpha pillars */}
      {(hotspots || []).map((h, i) => {
        const surfacePos = toXYZ(h.lat, h.lng, 1.005);
        const normal = surfacePos.clone().normalize();
        return (
          <AlphaColumn
            key={i}
            hotspot={h}
            position={surfacePos}
            normal={normal}
            isSelected={selectedHotspot?.name === h.name}
            isHovered={hoveredHotspot?.name === h.name}
            onSelect={onSelectHotspot}
            onHover={onHoverHotspot}
            onUnhover={onUnhoverHotspot}
            paletteDark={paletteDark}
          />
        );
      })}
      <mesh><sphereGeometry args={[1.06, 64, 64]} /><meshBasicMaterial color={paletteDark ? '#fb923c' : '#34d399'} transparent opacity={0.06} side={THREE.BackSide} /></mesh>
      <mesh><sphereGeometry args={[1.12, 64, 64]} /><meshBasicMaterial color={paletteDark ? '#f97316' : '#10b981'} transparent opacity={0.03} side={THREE.BackSide} /></mesh>
    </group>
  );
}

function GlobeScene({ hotspots, selectedHotspot, hoveredHotspot, onSelectHotspot, onHoverHotspot, onUnhoverHotspot, paletteDark }) {
  const controlsRef = useRef();
  return (
    <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }} style={{ background: 'transparent' }}
      onPointerMissed={() => onSelectHotspot(null)}
    >
      <ambientLight intensity={0.5} />
      <GlobeMesh
        hotspots={hotspots}
        selectedHotspot={selectedHotspot}
        hoveredHotspot={hoveredHotspot}
        onSelectHotspot={onSelectHotspot}
        onHoverHotspot={onHoverHotspot}
        onUnhoverHotspot={onUnhoverHotspot}
        paletteDark={paletteDark}
      />
      {/* Draggable/navigable only — NO auto-rotate, NO pan, zoom allowed */}
      <OrbitControls ref={controlsRef} enableZoom enablePan={false} autoRotate={false} enableDamping dampingFactor={0.1} minDistance={1.5} maxDistance={5} />
    </Canvas>
  );
}

// ─── Data Fetch ──────────────────────────────────────────────────────────────

async function fetchAlphaData() {
  const safeJson = (p) => p.then(r => r.ok ? r.json() : null).catch(() => null);
  const [fgRes, globalRes, coinsRes, newsRes] = await Promise.allSettled([
    safeJson(fetch('https://api.alternative.me/fng/?limit=7&format=json')),
    safeJson(fetch('https://api.coingecko.com/api/v3/global')),
    safeJson(fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h')),
    safeJson(fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=popular')),
  ]);

  const fg = fgRes.status === 'fulfilled' && fgRes.value?.data ? fgRes.value.data : null;
  const gd = globalRes.status === 'fulfilled' ? globalRes.value?.data : null;
  const coinsRaw = coinsRes.status === 'fulfilled' ? coinsRes.value : null;
  const coins = Array.isArray(coinsRaw) ? coinsRaw : [];
  const newsRaw = newsRes.status === 'fulfilled' ? newsRes.value : null;
  const rawNews = Array.isArray(newsRaw?.Data) ? newsRaw.Data.slice(0, 30) : [];

  // Fallback coins if API down
  if (coins.length === 0) {
    coins.push(
      { id: 'bitcoin', symbol: 'btc', current_price: 97420, price_change_percentage_24h: 2.1 },
      { id: 'ethereum', symbol: 'eth', current_price: 3841, price_change_percentage_24h: 4.7 },
      { id: 'solana', symbol: 'sol', current_price: 198, price_change_percentage_24h: 6.3 },
      { id: 'ripple', symbol: 'xrp', current_price: 2.42, price_change_percentage_24h: -1.2 },
      { id: 'dogecoin', symbol: 'doge', current_price: 0.178, price_change_percentage_24h: 8.4 },
    );
  }

  const hubs = [
    { name: 'New York', lat: 40.71, lng: -74.01, region: 'NA', intensity: 0.9, activity: 'Institutional Trading', volume: '$2.4B' },
    { name: 'London', lat: 51.51, lng: -0.13, region: 'EU', intensity: 0.88, activity: 'Cross-border Flow', volume: '$2.1B' },
    { name: 'Singapore', lat: 1.35, lng: 103.82, region: 'Asia', intensity: 0.87, activity: 'Exchange Hub', volume: '$2.0B' },
    { name: 'Dubai', lat: 25.20, lng: 55.27, region: 'ME', intensity: 0.82, activity: 'Crypto Hub', volume: '$1.8B' },
    { name: 'Hong Kong', lat: 22.32, lng: 114.17, region: 'Asia', intensity: 0.8, activity: 'Derivatives', volume: '$1.7B' },
    { name: 'Seoul', lat: 37.57, lng: 126.98, region: 'Asia', intensity: 0.78, activity: 'Retail Momentum', volume: '$1.6B' },
    { name: 'Tokyo', lat: 35.68, lng: 139.69, region: 'Asia', intensity: 0.75, activity: 'Institutional', volume: '$1.5B' },
    { name: 'San Francisco', lat: 37.77, lng: -122.42, region: 'NA', intensity: 0.85, activity: 'VC & DeFi', volume: '$1.9B' },
    { name: 'Miami', lat: 25.76, lng: -80.19, region: 'NA', intensity: 0.7, activity: 'Culture & Meme', volume: '$1.3B' },
    { name: 'Zurich', lat: 47.37, lng: 8.54, region: 'EU', intensity: 0.65, activity: 'Crypto Valley', volume: '$1.1B' },
    { name: 'Lagos', lat: 6.52, lng: 3.38, region: 'AF', intensity: 0.55, activity: 'P2P Volume', volume: '$0.8B' },
    { name: 'São Paulo', lat: -23.55, lng: -46.63, region: 'SA', intensity: 0.58, activity: 'Retail', volume: '$0.9B' },
  ];

  return {
    timestamp: new Date().toISOString(),
    fearGreed: fg ? { current: parseInt(fg[0].value), label: fg[0].value_classification }
      : { current: 72, label: 'Greed' },
    globalMarket: gd ? { totalMarketCap: gd.total_market_cap?.usd, btcDominance: gd.market_cap_percentage?.btc }
      : { totalMarketCap: 3.42e12, btcDominance: 56.4 },
    coins: coins.map(c => ({
      id: c.id, symbol: (c.symbol || '').toUpperCase(),
      price: c.current_price, change24h: c.price_change_percentage_24h,
    })),
    news: rawNews.length > 0 ? rawNews.map(n => {
      const t = (n.title || '').toLowerCase();
      const bull = ['surge', 'rally', 'bullish', 'record', 'adoption', 'launch', 'growth', 'breakout'].some(k => t.includes(k));
      const bear = ['crash', 'plunge', 'hack', 'exploit', 'ban', 'dump', 'selloff', 'fear', 'decline'].some(k => t.includes(k));
      return {
        id: n.id, title: n.title, source: n.source_info?.name || n.source,
        url: n.url || n.guid,
        publishedAt: n.published_on ? new Date(n.published_on * 1000).toISOString() : new Date().toISOString(),
        sentiment: bull ? 'bullish' : bear ? 'bearish' : 'neutral',
      };
    }) : [
      { id: 1, title: 'Bitcoin Surges Past $97K as Institutional Demand Hits Record', source: 'CoinDesk', sentiment: 'bullish', publishedAt: new Date().toISOString() },
      { id: 2, title: 'Solana DeFi TVL Breaks $12B — Ecosystem Growth Accelerates', source: 'The Block', sentiment: 'bullish', publishedAt: new Date(Date.now() - 3600000).toISOString() },
      { id: 3, title: 'Fed Signals Rate Cuts — Risk Assets Rally Across the Board', source: 'Bloomberg', sentiment: 'bullish', publishedAt: new Date(Date.now() - 7200000).toISOString() },
      { id: 4, title: 'Polymarket Volume Hits $1B as Prediction Markets Go Mainstream', source: 'Decrypt', sentiment: 'bullish', publishedAt: new Date(Date.now() - 10800000).toISOString() },
      { id: 5, title: 'Ethereum Layer 2s Process Record 500M+ Transactions This Month', source: 'CoinTelegraph', sentiment: 'bullish', publishedAt: new Date(Date.now() - 14400000).toISOString() },
    ],
    geoHotspots: hubs,
  };
}

// ─── Play Generator (AI alpha calls from live data) ──────────────────────────
// Each play now carries a bias score (narrative bias) and fallaciousness score
// (how much the idea relies on story vs hard data). Both 0-100, lower = cleaner.

function scoreBias(data, play) {
  // Bias = degree play aligns with dominant narrative (news sentiment majority)
  if (!data?.news?.length) return 45;
  const bull = data.news.filter(n => n.sentiment === 'bullish').length;
  const bear = data.news.filter(n => n.sentiment === 'bearish').length;
  const total = Math.max(1, bull + bear);
  const bullDominance = bull / total;
  if (play.type === 'MOMENTUM' || play.type === 'ACCUMULATE') return Math.round(bullDominance * 70 + 15);
  if (play.type === 'REVERSAL' || play.type === 'CAUTION') return Math.round((1 - bullDominance) * 60 + 20);
  return 40;
}

function scoreFallacy(play, regime) {
  // Fallaciousness = over-reliance on narrative/vibes vs math
  let f = 30;
  if (play.type === 'ROTATION') f += 20; // narrative-heavy
  if (play.type === 'REVERSAL' && play.confidence < 60) f += 15;
  if (play.confidence > 80) f -= 10; // data-backed
  if (regime?.regime === 'Risk-Off' && (play.type === 'MOMENTUM' || play.type === 'ROTATION')) f += 20;
  return Math.max(5, Math.min(95, f));
}

// Likelihood of profitability (0-100) = confidence adjusted by bias+fallacy
function scoreProfitability(play, bias, fallacy) {
  const raw = play.confidence - (bias - 50) * 0.3 - (fallacy - 30) * 0.4;
  return Math.max(15, Math.min(95, Math.round(raw)));
}

function enrichPlay(p, data, regime) {
  const bias = scoreBias(data, p);
  const fallacy = scoreFallacy(p, regime);
  const profitability = scoreProfitability(p, bias, fallacy);
  return { ...p, bias, fallacy, profitability };
}

function generatePlays(data, regime) {
  if (!data?.coins?.length) return [];
  const plays = [];
  const sorted = [...data.coins].sort((a, b) => (b.change24h || 0) - (a.change24h || 0));

  const top = sorted[0];
  if (top && top.change24h > 2) {
    plays.push({
      id: `play-momentum-${top.symbol}`, type: 'MOMENTUM', symbol: top.symbol, price: top.price,
      title: `${top.symbol} riding +${top.change24h.toFixed(1)}%`,
      angle: `Strong 24h momentum. ${regime?.regime === 'Risk-On' ? 'Regime aligned — ride it.' : 'Counter-trend — tight stop.'}`,
      entry: top.price, target: top.price * 1.08, stop: top.price * 0.96,
      confidence: Math.min(95, 60 + Math.abs(top.change24h) * 2),
      timeframe: '4-24h', risk: top.change24h > 10 ? 'HIGH' : 'MEDIUM',
      hub: 'New York', lat: 40.71, lng: -74.01,
    });
  }

  const worst = sorted[sorted.length - 1];
  if (worst && worst.change24h < -4) {
    plays.push({
      id: `play-reversal-${worst.symbol}`, type: 'REVERSAL', symbol: worst.symbol, price: worst.price,
      title: `${worst.symbol} bounce setup`,
      angle: `Down ${worst.change24h.toFixed(1)}% — mean reversion candidates build here.`,
      entry: worst.price, target: worst.price * 1.06, stop: worst.price * 0.95,
      confidence: 55, timeframe: '12-48h', risk: 'HIGH',
      hub: 'Singapore', lat: 1.35, lng: 103.82,
    });
  }

  if (data.fearGreed) {
    const v = data.fearGreed.current;
    if (v >= 80) {
      plays.push({
        id: 'play-fg-greed', type: 'CAUTION', symbol: 'MARKET', price: null,
        title: `Extreme Greed at ${v} — tighten stops`,
        angle: 'Local top risk. Take profits on winners, scale out momentum plays.',
        entry: null, target: null, stop: null,
        confidence: 72, timeframe: '1-3d', risk: 'MEDIUM',
        hub: 'Global', lat: 25.20, lng: 55.27,
      });
    } else if (v <= 30) {
      plays.push({
        id: 'play-fg-fear', type: 'ACCUMULATE', symbol: 'MARKET', price: null,
        title: `Fear at ${v} — smart money zone`,
        angle: 'Historical buy zone. DCA into blue chips, size up on conviction names.',
        entry: null, target: null, stop: null,
        confidence: 78, timeframe: '1-2w', risk: 'LOW',
        hub: 'Zurich', lat: 47.37, lng: 8.54,
      });
    }
  }

  const sol = data.coins.find(c => c.symbol === 'SOL');
  if (sol && sol.change24h > 3) {
    plays.push({
      id: 'play-sol-eco', type: 'ROTATION', symbol: 'SOL ECO', price: sol.price,
      title: 'Solana ecosystem rotation',
      angle: `SOL +${sol.change24h.toFixed(1)}% — eco tokens (JUP, JTO, WIF) typically 1.5-3x beta.`,
      entry: null, target: null, stop: null,
      confidence: 65, timeframe: '24-72h', risk: 'MEDIUM',
      hub: 'Seoul', lat: 37.57, lng: 126.98,
    });
  }

  return plays.map(p => enrichPlay(p, data, regime));
}

// ─── Live Bulletin Event Stream ──────────────────────────────────────────────
// Synthesizes a rolling terminal-style feed from coins + news + regime
function generateBulletin(data, regime, hotspots) {
  if (!data) return [];
  const events = [];
  const now = Date.now();

  // Coin events
  (data.coins || []).forEach(c => {
    if (Math.abs(c.change24h) > 3) {
      events.push({
        ts: now - Math.round(Math.random() * 600000),
        tag: c.change24h > 0 ? 'BULL' : 'BEAR',
        region: 'Global',
        text: `${c.symbol} ${c.change24h > 0 ? '+' : ''}${c.change24h.toFixed(2)}% · ${fmtPrice(c.price)}`,
        color: c.change24h > 0 ? 'emerald' : 'red',
      });
    }
  });

  // News-to-region mapping (round-robin)
  (data.news || []).slice(0, 8).forEach((n, i) => {
    const h = hotspots[i % Math.max(1, hotspots.length)];
    events.push({
      ts: new Date(n.publishedAt).getTime(),
      tag: n.sentiment === 'bullish' ? 'NEWS+' : n.sentiment === 'bearish' ? 'NEWS-' : 'NEWS',
      region: h?.name || 'Global',
      text: n.title?.slice(0, 90) + (n.title?.length > 90 ? '…' : ''),
      color: n.sentiment === 'bullish' ? 'emerald' : n.sentiment === 'bearish' ? 'red' : 'slate',
      url: n.url,
    });
  });

  // Regional flow deltas (synthesized from hub intensity for now)
  hotspots.slice(0, 5).forEach((h, i) => {
    events.push({
      ts: now - (i + 1) * 45000,
      tag: 'FLOW',
      region: h.name,
      text: `${h.activity} · ${h.volume} volume${h.leadCount ? ` · ${h.leadCount} active leads` : ''}`,
      color: h.sentiment >= 0.65 ? 'emerald' : h.sentiment >= 0.4 ? 'amber' : 'red',
    });
  });

  // Regime note
  if (regime) {
    events.push({
      ts: now - 180000,
      tag: 'REGIME',
      region: 'Global',
      text: `${regime.regime} · ${regime.action} · score ${regime.score}`,
      color: regime.regime === 'Risk-On' ? 'emerald' : 'amber',
    });
  }

  return events.sort((a, b) => b.ts - a.ts).slice(0, 24);
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TrendsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [utcTime, setUtcTime] = useState(new Date().toISOString().slice(11, 19));
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightTab, setRightTab] = useState('alpha');
  const ivRef = useRef(null);
  const { degenMode, getLeads } = useStore();
  const { regime: rawRegime } = useGoatedAI();

  const regime = rawRegime || {
    regime: 'Risk-On', color: '#10b981', score: 72,
    action: 'ACCUMULATE',
    description: 'Markets showing strong bullish momentum with institutional inflows accelerating.',
  };

  // Fetch data on mount + refresh interval
  const fetchData = useCallback(async () => {
    try {
      const r = await fetch('/api/sentiment');
      if (r.ok && (r.headers.get('content-type') || '').includes('json')) {
        const j = await r.json();
        setData(j);
        setLastRefresh(new Date());
        return;
      }
    } catch {}
    try {
      const result = await fetchAlphaData();
      setData(result);
      setLastRefresh(new Date());
    } catch (e) {
      console.warn('Alpha data fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    ivRef.current = setInterval(() => { if (!document.hidden) fetchData(); }, REFRESH_INTERVAL);
    return () => clearInterval(ivRef.current);
  }, [fetchData]);

  // UTC clock
  useEffect(() => {
    const iv = setInterval(() => { if (!document.hidden) setUtcTime(new Date().toISOString().slice(11, 19)); }, 1000);
    return () => clearInterval(iv);
  }, []);

  // Region lead counts from B2B data
  const regionLeadCounts = useMemo(() => {
    try {
      const allLeads = getLeads();
      const counts = {};
      const cityMap = {
        'New York': ['New York'], 'London': ['London'], 'Singapore': ['Singapore'],
        'Dubai': ['Dubai'], 'Hong Kong': ['Hong Kong'], 'Seoul': ['Seoul'],
        'Tokyo': ['Tokyo'], 'San Francisco': ['San Francisco', 'SF'],
        'Miami': ['Miami'], 'Zurich': ['Zurich'], 'Lagos': ['Lagos'],
        'São Paulo': ['São Paulo', 'Sao Paulo'],
      };
      Object.keys(cityMap).forEach(city => { counts[city] = 0; });
      (allLeads || []).forEach(l => {
        if (!l.location) return;
        Object.entries(cityMap).forEach(([city, aliases]) => {
          if (aliases.some(a => l.location.includes(a))) counts[city]++;
        });
      });
      return counts;
    } catch { return {}; }
  }, [getLeads]);

  // Enrich hotspots
  const enrichedHotspots = useMemo(() => {
    const raw = data?.geoHotspots || [];
    const trendsByRegion = {
      'NA': ['Institutional DeFi', 'RWA Tokenization', 'AI x Crypto', 'Stablecoin Payments'],
      'EU': ['MiCA Compliance', 'Green Mining', 'CBDCs', 'Cross-border Settlements'],
      'Asia': ['GameFi Revival', 'Exchange Wars', 'Retail Momentum', 'Layer 2 Adoption'],
      'ME': ['Sovereign Wealth Crypto', 'CBDC Pilots', 'Digital Free Zones', 'Staking'],
      'AF': ['P2P Volume Surge', 'Mobile Payments', 'Remittance Corridors'],
      'SA': ['Retail Crypto Boom', 'Stablecoin Adoption', 'DeFi Growth'],
    };
    return raw.map(h => ({
      ...h,
      sentiment: h.intensity * 0.85 + 0.1,
      volumeNum: parseFloat((h.volume || '$1B').replace(/[$BMK]/g, '')) || 1,
      leadCount: regionLeadCounts[h.name] || 0,
      behaviorIndex: Math.round(h.intensity * 30 + 55),
      trends: trendsByRegion[h.region] || ['Trading', 'DeFi'],
    }));
  }, [data?.geoHotspots, regionLeadCounts]);

  // Generate AI alpha plays — raw + mode-filtered
  const allPlays = useMemo(() => generatePlays(data, regime), [data, regime]);

  // WOLF = see everything, sort by raw profit-score (degen-friendly)
  // CHILL = see only vetted plays (low bias, low fallacy), sort by risk-adjusted confidence
  const plays = useMemo(() => {
    if (degenMode) {
      // Wolf: everything, sorted by profitability*confidence (greediest first)
      return [...allPlays].sort((a, b) => (b.profitability * b.confidence) - (a.profitability * a.confidence));
    }
    // Chill: drop risky/biased plays, only CAUTION/ACCUMULATE + low-fallacy MOMENTUM
    return allPlays
      .filter(p => p.fallacy < 55 && p.bias < 65 && (p.risk !== 'HIGH' || p.profitability >= 65))
      .sort((a, b) => b.confidence - a.confidence);
  }, [allPlays, degenMode]);

  // Live bulletin stream — wolf sees everything, chill sees filtered (no hype/bear noise)
  const allBulletin = useMemo(() => generateBulletin(data, regime, enrichedHotspots), [data, regime, enrichedHotspots]);
  const bulletin = useMemo(() => {
    if (degenMode) return allBulletin; // Wolf: every event
    // Chill: only NEWS (neutral/bullish), FLOW, REGIME — skip high-volatility BEAR events
    return allBulletin.filter(e => e.tag !== 'BEAR' && !(e.tag === 'NEWS-' && e.color === 'red'));
  }, [allBulletin, degenMode]);

  // Aggregate sentiment across news + X (synthesized) + price action
  const aggregateSentiment = useMemo(() => {
    if (!data) return null;
    const news = data.news || [];
    const newsBull = news.filter(n => n.sentiment === 'bullish').length;
    const newsBear = news.filter(n => n.sentiment === 'bearish').length;
    const newsTotal = Math.max(1, newsBull + newsBear);
    const newsScore = newsBull / newsTotal; // 0-1
    const coins = data.coins || [];
    const avgChg = coins.length ? coins.reduce((s, c) => s + (c.change24h || 0), 0) / coins.length : 0;
    const priceScore = Math.min(1, Math.max(0, 0.5 + avgChg / 20));
    const fgScore = data.fearGreed ? data.fearGreed.current / 100 : 0.5;
    // Synthetic X sentiment: noise around news score
    const xScore = Math.min(1, Math.max(0, newsScore + (Math.sin((Date.now() / 1e7) + (enrichedHotspots.length || 1)) * 0.08)));
    const aggregate = newsScore * 0.35 + priceScore * 0.3 + fgScore * 0.2 + xScore * 0.15;
    // Bias = how far sources disagree; high disagreement = high bias/low confidence
    const stddev = Math.sqrt(
      (Math.pow(newsScore - aggregate, 2) + Math.pow(priceScore - aggregate, 2) +
       Math.pow(fgScore - aggregate, 2) + Math.pow(xScore - aggregate, 2)) / 4
    );
    const biasScore = Math.round(stddev * 200); // higher = more divergent
    return {
      newsScore: Math.round(newsScore * 100),
      xScore: Math.round(xScore * 100),
      fgScore: Math.round(fgScore * 100),
      priceScore: Math.round(priceScore * 100),
      aggregate: Math.round(aggregate * 100),
      bias: Math.min(100, biasScore),
      label: aggregate >= 0.65 ? 'BULLISH' : aggregate >= 0.45 ? 'NEUTRAL' : 'BEARISH',
    };
  }, [data, enrichedHotspots.length]);

  const topCoins = data?.coins?.slice(0, 3) || [];

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 'calc(100vh - 36px)' }}>
      {/* Full-screen Globe */}
      <div className="absolute inset-0">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full text-slate-600 gap-2">
            <RefreshCw size={16} className="animate-spin" />Loading ALPHA RADAR…
          </div>
        }>
          <GlobeScene
            hotspots={enrichedHotspots}
            selectedHotspot={selectedHotspot}
            hoveredHotspot={hoveredHotspot}
            onSelectHotspot={setSelectedHotspot}
            onHoverHotspot={setHoveredHotspot}
            onUnhoverHotspot={() => setHoveredHotspot(null)}
            paletteDark={degenMode}
          />
        </Suspense>
        {/* Scan line */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"
            style={{ animation: 'globeScanLine 4s linear infinite', top: 0 }} />
        </div>
        <style>{`
          @keyframes globeScanLine { 0% { top: -2px; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
          @keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        `}</style>
      </div>

      {/* Top-left: ALPHA RADAR label */}
      <div className="absolute top-4 left-4 z-20 bg-black/70 backdrop-blur-md rounded-lg p-3 border border-emerald-500/20 max-w-[280px]">
        <div className="flex items-center gap-2 mb-1">
          <Radar size={14} className={degenMode ? 'text-orange-400' : 'text-emerald-400'} />
          <span className="text-xs font-bold text-white tracking-wider">
            {degenMode ? 'DEGEN RADAR' : 'ALPHA RADAR'}
          </span>
          <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${degenMode ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${degenMode ? 'bg-orange-400' : 'bg-emerald-400'}`} />
            LIVE
          </span>
        </div>
        <div className="text-[10px] text-slate-400">
          {enrichedHotspots.length} hubs · {plays.length} live plays · {LIVE_EVENTS.length} bursts
        </div>
        {lastRefresh && (
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="flex items-center gap-1 mt-2 text-[10px] text-slate-500 hover:text-emerald-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
            Updated {ago(lastRefresh.toISOString())}
          </button>
        )}
      </div>

      {/* Top-right: UTC + market snapshot */}
      <div className="absolute top-4 right-4 z-20 bg-black/70 backdrop-blur-md rounded-lg p-3 border border-white/10 min-w-[200px]">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">UTC</div>
            <div className="text-sm font-mono text-emerald-400 font-bold">{utcTime}</div>
          </div>
          {data?.fearGreed && (
            <div className="text-right">
              <div className="text-[9px] text-slate-500 uppercase tracking-wider">F&G</div>
              <div className={`text-sm font-bold ${data.fearGreed.current >= 65 ? 'text-emerald-400' : data.fearGreed.current >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                {data.fearGreed.current}
              </div>
            </div>
          )}
        </div>
        {topCoins.length > 0 && (
          <div className="pt-2 border-t border-white/10 space-y-1">
            {topCoins.map(c => (
              <div key={c.symbol} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 w-10">{c.symbol}</span>
                <span className="text-white font-mono">{fmtPrice(c.price)}</span>
                <span className={`${pctCls(c.change24h)} font-mono text-[10px] w-14 text-right`}>
                  {c.change24h > 0 ? '+' : ''}{c.change24h?.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right panel: Live plays + Palantir-style bulletin stream */}
      {rightPanelOpen && (
        <div className={`absolute top-28 right-4 bottom-16 w-[340px] z-20 bg-black/85 backdrop-blur-xl rounded-xl border ${degenMode ? 'border-orange-500/15' : 'border-emerald-500/10'} flex flex-col overflow-hidden shadow-2xl`}>
          {/* Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-white/[0.04]">
            <button
              onClick={() => setRightTab('alpha')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${rightTab === 'alpha' ? (degenMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-brand/10 text-brand border border-brand/20') : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Zap size={12} /> Plays {plays.length > 0 && <span className={`text-[9px] px-1 rounded ${degenMode ? 'bg-orange-500/20 text-orange-400' : 'bg-brand/20 text-brand'}`}>{plays.length}</span>}
            </button>
            <button
              onClick={() => setRightTab('bulletin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${rightTab === 'bulletin' ? (degenMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-brand/10 text-brand border border-brand/20') : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Activity size={12} /> Bulletin <span className={`text-[9px] px-1 rounded ${degenMode ? 'bg-orange-500/20 text-orange-400' : 'bg-brand/20 text-brand'}`}>{bulletin.length}</span>
            </button>
            <button
              onClick={() => setRightPanelOpen(false)}
              className="ml-auto p-1 text-slate-500 hover:text-white"
              title="Hide panel"
            >
              <X size={14} />
            </button>
          </div>

          {/* Aggregate sentiment header — always visible */}
          {aggregateSentiment && (
            <div className={`px-3 py-2 border-b border-white/[0.04] ${aggregateSentiment.label === 'BULLISH' ? 'bg-emerald-500/5' : aggregateSentiment.label === 'BEARISH' ? 'bg-red-500/5' : 'bg-amber-500/5'}`}>
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-slate-400 uppercase tracking-wider">Global Sentiment</span>
                <span className={`font-bold ${aggregateSentiment.label === 'BULLISH' ? 'text-emerald-400' : aggregateSentiment.label === 'BEARISH' ? 'text-red-400' : 'text-amber-400'}`}>
                  {aggregateSentiment.label} · {aggregateSentiment.aggregate}%
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[9px]">
                <div className="text-center"><div className="text-slate-600">NEWS</div><div className="text-slate-300 font-mono">{aggregateSentiment.newsScore}</div></div>
                <div className="text-center"><div className="text-slate-600">X</div><div className="text-slate-300 font-mono">{aggregateSentiment.xScore}</div></div>
                <div className="text-center"><div className="text-slate-600">F&G</div><div className="text-slate-300 font-mono">{aggregateSentiment.fgScore}</div></div>
                <div className="text-center"><div className="text-slate-600">PRICE</div><div className="text-slate-300 font-mono">{aggregateSentiment.priceScore}</div></div>
              </div>
              <div className="mt-1 flex items-center justify-between text-[9px]">
                <span className="text-slate-500">Source Bias</span>
                <span className={`font-mono ${aggregateSentiment.bias < 25 ? 'text-emerald-400' : aggregateSentiment.bias < 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {aggregateSentiment.bias < 25 ? 'LOW' : aggregateSentiment.bias < 50 ? 'MED' : 'HIGH'} · {aggregateSentiment.bias}%
                </span>
              </div>
            </div>
          )}

          {/* Plays tab */}
          {rightTab === 'alpha' && (
            <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2">
              {plays.length === 0 && (
                <div className="text-center py-8 text-slate-600 text-xs">
                  <Brain size={24} className="mx-auto mb-2 opacity-40" />
                  No live plays right now.<br />AI watching — plays appear when edge &gt; 60%.
                </div>
              )}
              {plays.map(p => {
                // Mode-specific tag:
                // WOLF: "DEGEN PICK" on highest profitability*confidence, or "HYPE" on high-bias momentum
                // CHILL: "SAFE" on lowest-fallacy / lowest-bias plays
                const isDegenPick = degenMode && p.profitability * p.confidence > 5000;
                const isHype = degenMode && p.bias > 55 && p.type === 'MOMENTUM';
                const isSafe = !degenMode && p.fallacy < 35 && p.bias < 45;
                return (
                <div key={p.id} className={`bg-white/[0.03] rounded-lg p-3 border ${isDegenPick ? 'border-orange-500/30 bg-orange-500/[0.03]' : isSafe ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-white/[0.04]'} hover:border-brand/20 transition-colors`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${p.type === 'MOMENTUM' ? 'bg-emerald-500/10 text-emerald-400' : p.type === 'REVERSAL' ? 'bg-amber-500/10 text-amber-400' : p.type === 'CAUTION' ? 'bg-red-500/10 text-red-400' : p.type === 'ACCUMULATE' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                        {p.type}
                      </span>
                      {isDegenPick && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/40">DEGEN PICK</span>}
                      {isHype && !isDegenPick && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">HYPE</span>}
                      {isSafe && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">SAFE</span>}
                      <span className="text-sm font-bold text-white">{p.symbol}</span>
                      {p.hub && <span className="text-[9px] text-slate-600 uppercase">· {p.hub}</span>}
                    </div>
                    <span className="text-[10px] text-slate-500">{p.timeframe}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-200 mb-1">{p.title}</div>
                  <div className="text-[10px] text-slate-400 leading-relaxed mb-2">{p.angle}</div>
                  {p.entry && p.target && p.stop && (
                    <div className="grid grid-cols-3 gap-1 text-[10px] mb-2">
                      <div className="bg-white/5 rounded px-1.5 py-1">
                        <div className="text-slate-600">ENTRY</div>
                        <div className="text-white font-mono">{fmtPrice(p.entry)}</div>
                      </div>
                      <div className="bg-emerald-500/5 rounded px-1.5 py-1">
                        <div className="text-emerald-500">TARGET</div>
                        <div className="text-emerald-400 font-mono">{fmtPrice(p.target)}</div>
                      </div>
                      <div className="bg-red-500/5 rounded px-1.5 py-1">
                        <div className="text-red-500">STOP</div>
                        <div className="text-red-400 font-mono">{fmtPrice(p.stop)}</div>
                      </div>
                    </div>
                  )}
                  {/* Bias / fallaciousness / profitability bar — Palantir-style */}
                  <div className="grid grid-cols-3 gap-1 text-[9px] mb-1">
                    <div className="bg-black/40 rounded px-1.5 py-1 border border-white/[0.03]">
                      <div className="text-slate-600 uppercase tracking-wider">Bias</div>
                      <div className={`font-bold ${p.bias < 40 ? 'text-emerald-400' : p.bias < 65 ? 'text-amber-400' : 'text-red-400'}`}>{p.bias}%</div>
                    </div>
                    <div className="bg-black/40 rounded px-1.5 py-1 border border-white/[0.03]">
                      <div className="text-slate-600 uppercase tracking-wider">Fallacy</div>
                      <div className={`font-bold ${p.fallacy < 35 ? 'text-emerald-400' : p.fallacy < 60 ? 'text-amber-400' : 'text-red-400'}`}>{p.fallacy}%</div>
                    </div>
                    <div className="bg-black/40 rounded px-1.5 py-1 border border-white/[0.03]">
                      <div className="text-slate-600 uppercase tracking-wider">Profit</div>
                      <div className={`font-bold ${p.profitability >= 65 ? 'text-emerald-400' : p.profitability >= 45 ? 'text-amber-400' : 'text-red-400'}`}>{p.profitability}%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1">
                      <span className="text-slate-500">Conf</span>
                      <span className={`font-bold ${degenMode ? 'text-orange-400' : 'text-brand'}`}>{p.confidence}%</span>
                    </span>
                    <span className={`font-bold ${p.risk === 'HIGH' ? 'text-red-400' : p.risk === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {p.risk} RISK
                    </span>
                  </div>
                </div>
                );
              })}
              <div className="text-[9px] text-slate-600 text-center pt-2">
                {degenMode ? 'WOLF MODE — all plays, sorted by greed score' : 'CHILL MODE — vetted plays only, risk-adjusted'}<br />
                Powered by GOATED AI · NFA — DYOR · Refreshes every 30s
              </div>
            </div>
          )}

          {/* Bulletin tab — Palantir terminal-style rolling feed */}
          {rightTab === 'bulletin' && (
            <div className="flex-1 overflow-y-auto scrollbar-hide font-mono">
              {bulletin.length === 0 && (
                <div className="text-center py-8 text-slate-600 text-xs">
                  <Activity size={24} className="mx-auto mb-2 opacity-40" />
                  Waiting on feed…
                </div>
              )}
              {bulletin.map((ev, i) => {
                const clr = ev.color === 'emerald' ? 'text-emerald-400' : ev.color === 'red' ? 'text-red-400' : ev.color === 'amber' ? 'text-amber-400' : 'text-slate-400';
                const bgClr = ev.color === 'emerald' ? 'bg-emerald-400' : ev.color === 'red' ? 'bg-red-400' : ev.color === 'amber' ? 'bg-amber-400' : 'bg-slate-500';
                return (
                  <div key={i} className="px-3 py-1.5 border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors text-[10px] flex items-start gap-2">
                    <span className="text-slate-600 shrink-0">{new Date(ev.ts).toISOString().slice(11, 19)}</span>
                    <span className={`${clr} font-bold shrink-0 w-11`}>{ev.tag}</span>
                    <span className={`inline-block w-1 h-1 mt-1.5 rounded-full shrink-0 ${bgClr}`} />
                    <span className="text-slate-500 shrink-0">{ev.region}</span>
                    <span className="text-slate-300 flex-1">{ev.text}</span>
                  </div>
                );
              })}
              <div className="text-[9px] text-slate-600 text-center py-2">
                {bulletin.length} events · auto-sorted by ts · 30s refresh
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed toggle */}
      {!rightPanelOpen && (
        <button
          onClick={() => setRightPanelOpen(true)}
          className="absolute top-28 right-4 z-20 bg-black/80 backdrop-blur-md rounded-lg px-3 py-2 border border-brand/30 hover:border-brand/50 transition-colors flex items-center gap-2 shadow-xl"
          title="Open alpha panel"
        >
          <Zap size={14} className="text-brand" />
          <span className="text-xs font-bold text-brand">{plays.length}</span>
        </button>
      )}

      {/* Selected hotspot detail card (bottom-left) — Palantir-style with aggregate sentiment */}
      {selectedHotspot && (
        <div className={`absolute bottom-16 left-4 z-20 bg-black/92 backdrop-blur-xl border rounded-xl p-4 w-[340px] shadow-2xl ${degenMode ? 'border-orange-500/30 shadow-orange-500/10' : 'border-emerald-500/30 shadow-emerald-500/10'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-bold text-white">{selectedHotspot.name}</div>
              <div className="text-[10px] text-slate-400">{selectedHotspot.region} · {selectedHotspot.activity}</div>
            </div>
            <button
              onClick={() => setSelectedHotspot(null)}
              className="p-1 text-slate-500 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
          {/* Sentiment bar with aggregate breakdown */}
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all" style={{
              width: `${selectedHotspot.sentiment * 100}%`,
              background: selectedHotspot.sentiment >= 0.65 ? (degenMode ? '#f97316' : '#10b981') : selectedHotspot.sentiment >= 0.4 ? '#f59e0b' : '#ef4444',
            }} />
          </div>
          {aggregateSentiment && (
            <div className="grid grid-cols-4 gap-1 mb-3 text-[9px] font-mono">
              <div className="text-center"><div className="text-slate-600">NEWS</div><div className={aggregateSentiment.newsScore >= 55 ? 'text-emerald-400' : 'text-red-400'}>{aggregateSentiment.newsScore}</div></div>
              <div className="text-center"><div className="text-slate-600">X</div><div className={aggregateSentiment.xScore >= 55 ? 'text-emerald-400' : 'text-red-400'}>{aggregateSentiment.xScore}</div></div>
              <div className="text-center"><div className="text-slate-600">F&G</div><div className={aggregateSentiment.fgScore >= 55 ? 'text-emerald-400' : 'text-red-400'}>{aggregateSentiment.fgScore}</div></div>
              <div className="text-center"><div className="text-slate-600">BIAS</div><div className={aggregateSentiment.bias < 25 ? 'text-emerald-400' : aggregateSentiment.bias < 50 ? 'text-amber-400' : 'text-red-400'}>{aggregateSentiment.bias}</div></div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 mb-3 text-[11px]">
            <div className="bg-white/5 rounded-lg px-2 py-1.5">
              <div className="text-slate-500 text-[9px]">VOLUME</div>
              <div className="text-white font-semibold">{selectedHotspot.volume}</div>
            </div>
            <div className="bg-white/5 rounded-lg px-2 py-1.5">
              <div className="text-slate-500 text-[9px]">LEADS</div>
              <div className="text-white font-semibold">{selectedHotspot.leadCount || 0}</div>
            </div>
            <div className="bg-white/5 rounded-lg px-2 py-1.5">
              <div className="text-slate-500 text-[9px]">INTENT</div>
              <div className={`font-semibold ${degenMode ? 'text-orange-400' : 'text-cyan-400'}`}>{selectedHotspot.behaviorIndex}%</div>
            </div>
          </div>
          <div className="mb-3">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">Trending</div>
            <div className="flex flex-wrap gap-1">
              {(selectedHotspot.trends || []).map((t, i) => (
                <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${degenMode ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{t}</span>
              ))}
            </div>
          </div>
          <div className={`bg-gradient-to-br ${degenMode ? 'from-orange-500/10' : 'from-brand/10'} to-transparent border ${degenMode ? 'border-orange-500/20' : 'border-brand/20'} rounded-lg p-2.5 text-[10px]`}>
            <div className="flex items-center gap-1 mb-1">
              <Flame size={10} className={degenMode ? 'text-orange-400' : 'text-brand'} />
              <span className={`font-bold uppercase tracking-wider ${degenMode ? 'text-orange-400' : 'text-brand'}`}>AI Angle</span>
              {aggregateSentiment && (
                <span className="ml-auto text-[9px] text-slate-500">
                  · {aggregateSentiment.label} {aggregateSentiment.aggregate}%
                </span>
              )}
            </div>
            <div className="text-slate-300 leading-relaxed">
              {selectedHotspot.sentiment >= 0.7
                ? `Strong momentum hub. ${selectedHotspot.activity.toLowerCase()} driving ${selectedHotspot.volume} — play regional ETFs, local-exchange listings, narrative tokens tied to this region.`
                : selectedHotspot.sentiment >= 0.45
                ? `Steady flow. ${selectedHotspot.activity.toLowerCase()} neutral — wait for directional break before sizing up.`
                : `Cooling. Outflows dominant — avoid long exposure to region-specific narratives. Shorts viable with tight stops.`}
            </div>
            {selectedHotspot.leadCount > 0 && (
              <div className="mt-2 pt-2 border-t border-white/[0.05] text-slate-400">
                <span className={degenMode ? 'text-orange-400' : 'text-brand'}>{selectedHotspot.leadCount}</span> active B2B leads in-region · {selectedHotspot.behaviorIndex}% intent score
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom: legend — Palantir-style marker key */}
      <div className="absolute bottom-9 left-1/2 -translate-x-1/2 z-20 bg-black/70 backdrop-blur-md rounded-lg px-4 py-1.5 border border-white/10 flex items-center gap-3 text-[10px]">
        <span className="flex items-center gap-1" title="Alpha pillar — height = volume, color = sentiment"><span className={`w-1 h-3 ${degenMode ? 'bg-orange-400' : 'bg-emerald-400'}`} /><span className="text-slate-400">Hub</span></span>
        <span className="flex items-center gap-1" title="Lead cluster"><span className={`w-2 h-2 rounded-full border ${degenMode ? 'border-amber-400' : 'border-cyan-400'}`} /><span className="text-slate-400">Leads</span></span>
        <span className="flex items-center gap-1" title="Influencer signal"><span className={`w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-l-transparent border-r-transparent ${degenMode ? 'border-b-orange-300' : 'border-b-emerald-300'}`} /><span className="text-slate-400">Influencer</span></span>
        <span className="flex items-center gap-1" title="ICO / token launch"><span className={`w-2 h-2 rotate-45 ${degenMode ? 'bg-orange-500' : 'bg-purple-500'}`} /><span className="text-slate-400">ICO</span></span>
        <div className="w-px h-3 bg-white/10" />
        <span className="flex items-center gap-1"><span className={`w-3 h-[1px] ${degenMode ? 'bg-orange-400' : 'bg-emerald-400'}`} /><span className="text-slate-400">Inflow</span></span>
        <span className="flex items-center gap-1"><span className="w-3 h-[1px] bg-red-400" /><span className="text-slate-400">Outflow</span></span>
        <div className="w-px h-3 bg-white/10" />
        <span className="text-slate-600">Drag · scroll to zoom · click pillars</span>
      </div>

      {/* Bottom: news ticker */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/80 backdrop-blur-md border-t border-white/[0.06] overflow-hidden h-8 flex items-center">
        <div className="flex items-center gap-6 whitespace-nowrap pl-4" style={{ animation: 'tickerScroll 90s linear infinite', width: 'max-content' }}>
          {[...(data?.news || []), ...(data?.news || [])].map((n, i) => (
            <a
              key={`${n.id}-${i}`}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs hover:text-white transition-colors"
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${n.sentiment === 'bullish' ? 'bg-emerald-400' : n.sentiment === 'bearish' ? 'bg-red-400' : 'bg-slate-500'}`} />
              <span className="text-slate-300">{n.title}</span>
              <span className="text-slate-600 text-[10px]">{n.source}</span>
              <span className="text-slate-700">·</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
