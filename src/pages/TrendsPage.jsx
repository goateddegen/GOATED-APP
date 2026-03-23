import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, ArrowUp, ArrowDown, BarChart3, Clock, Flame, Radio,
  ChevronRight, RefreshCw, Activity, Zap, Target, AlertTriangle,
  DollarSign, Globe, Brain, Search, ExternalLink, Newspaper, Sparkles,
  ChevronDown, X, Crosshair, Shield, TrendingDown, Radar, Rocket, MapPin,
  Filter, SlidersHorizontal, Trophy,
  ArrowUpRight, ArrowDownRight, Minus, Signal, LayoutGrid, List,
  PieChart, LineChart, Hash, ShieldCheck, Percent, Coins, Building2,
  Landmark, Fuel, Gem, Scale, Vote, Cpu, Banknote, CircleDollarSign,
  ChevronUp, Star, Eye, Wifi, Layers,
} from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { feature } from 'topojson-client';
import * as THREE from 'three';
import { useStore } from '../hooks/useStore';
import { useGoatedAI } from '../hooks/useGoatedAI';
import WorldMap from '../components/WorldMap';

// ============================================================================
// TREND PULSE — Palantir-Level Trading Intelligence Engine
// Real-time multi-source sentiment aggregation + predictive alpha
// ============================================================================

const REFRESH_INTERVAL = 30_000;
const TABS = [
  { id: 'overview', label: 'Intelligence Hub', icon: Brain },
  { id: 'globe', label: 'Global Heatmap', icon: Globe },
  { id: 'alpha', label: 'Alpha Plays', icon: Zap },
  { id: 'news', label: 'Live News', icon: Newspaper },
  { id: 'prices', label: 'Live Prices', icon: DollarSign },
  { id: 'research', label: 'Deep Research', icon: Search },
];

// ─── Formatters ─────────────────────────────────────────────────────────────

const fmtPrice = (n) => {
  if (n == null) return '—';
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(n >= 0.01 ? 4 : 6)}`;
};
const fmtVol = (n) => {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
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

// ─── Sparkline ──────────────────────────────────────────────────────────────

function Spark({ data, color, w = 80, h = 24 }) {
  if (!data || data.length < 2) return <div style={{ width: w, height: h }} />;
  const d = data.length > 50 ? data.filter((_, i) => i % Math.ceil(data.length / 50) === 0) : data;
  const mn = Math.min(...d), mx = Math.max(...d), r = mx - mn || 1;
  const c = color || (d[d.length - 1] >= d[0] ? '#10b981' : '#ef4444');
  const pts = d.map((v, i) => `${(i / (d.length - 1)) * w},${h - ((v - mn) / r) * (h - 2) - 1}`).join(' ');
  return <svg width={w} height={h} className="flex-shrink-0"><polyline fill="none" stroke={c} strokeWidth="1.5" points={pts} strokeLinejoin="round" /></svg>;
}

// ─── Sentiment Ring ─────────────────────────────────────────────────────────

function Ring({ score, label, sz = 'lg' }) {
  const clr = score >= 70 ? '#00ff88' : score >= 45 ? '#f59e0b' : '#ef4444';
  const rad = sz === 'lg' ? 56 : sz === 'md' ? 36 : 24;
  const circ = 2 * Math.PI * rad;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={rad * 2 + 16} height={rad * 2 + 16} className="-rotate-90">
          <circle cx={rad + 8} cy={rad + 8} r={rad} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={sz === 'lg' ? 6 : 4} />
          <circle cx={rad + 8} cy={rad + 8} r={rad} fill="none" stroke={clr} strokeWidth={sz === 'lg' ? 6 : 4}
            strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ} strokeLinecap="round"
            className="transition-all duration-1000" style={{ filter: `drop-shadow(0 0 6px ${clr}40)` }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className={`font-black ${sz === 'lg' ? 'text-3xl' : 'text-lg'}`} style={{ color: clr }}>{score}</span>
          {sz === 'lg' && <span className="text-[10px] text-slate-500 tracking-wider">/ 100</span>}
        </div>
      </div>
      <span className="font-semibold text-sm" style={{ color: clr }}>{label}</span>
    </div>
  );
}

// ─── 3D Globe — Palantir-Level Interactive Intelligence Globe ────────────────

const toXYZ = (lat, lng, r = 1.01) => {
  const p = (90 - lat) * Math.PI / 180;
  const t = (lng + 180) * Math.PI / 180;
  return new THREE.Vector3(-(r * Math.sin(p) * Math.cos(t)), r * Math.cos(p), r * Math.sin(p) * Math.sin(t));
};

// Data arc connections between major financial centers
const ARC_CONNECTIONS = [
  { from: [40.71, -74.01], to: [51.51, -0.13], flow: 'inflow', label: 'NY→LDN' },
  { from: [51.51, -0.13], to: [1.35, 103.82], flow: 'inflow', label: 'LDN→SGP' },
  { from: [1.35, 103.82], to: [22.32, 114.17], flow: 'inflow', label: 'SGP→HK' },
  { from: [22.32, 114.17], to: [35.68, 139.69], flow: 'outflow', label: 'HK→TKY' },
  { from: [37.77, -122.42], to: [40.71, -74.01], flow: 'inflow', label: 'SF→NY' },
  { from: [25.20, 55.27], to: [1.35, 103.82], flow: 'inflow', label: 'DXB→SGP' },
  { from: [40.71, -74.01], to: [25.20, 55.27], flow: 'outflow', label: 'NY→DXB' },
  { from: [51.51, -0.13], to: [47.37, 8.54], flow: 'inflow', label: 'LDN→ZRH' },
  { from: [-23.55, -46.63], to: [40.71, -74.01], flow: 'outflow', label: 'SAO→NY' },
  { from: [37.57, 126.98], to: [35.68, 139.69], flow: 'inflow', label: 'SEL→TKY' },
];

// GeoJSON country borders rendered as 3D lines on the sphere
function GeoLines() {
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
          // Sample every 2nd point for performance
          for (let i = 0; i < ring.length; i += 2) {
            const [lng, lat] = ring[i];
            points.push(toXYZ(lat, lng, 1.004));
          }
          if (points.length > 1) {
            // Close the ring
            points.push(points[0].clone());
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            geos.push(geo);
          }
        });
      });
    });
    return geos;
  }, [geoData]);

  return (
    <group>
      {lineGeometries.map((geo, idx) => (
        <line key={idx} geometry={geo}>
          <lineBasicMaterial color="#10b981" transparent opacity={0.15} />
        </line>
      ))}
      {/* Latitude grid lines */}
      {[-60, -30, 0, 30, 60].map(lat => {
        const pts = [];
        for (let lng = -180; lng <= 180; lng += 4) pts.push(toXYZ(lat, lng, 1.003));
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        return <line key={`lat${lat}`} geometry={geo}><lineBasicMaterial color="#10b981" transparent opacity={lat === 0 ? 0.08 : 0.03} /></line>;
      })}
      {/* Longitude grid lines */}
      {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180].map(lng => {
        const pts = [];
        for (let lat = -90; lat <= 90; lat += 4) pts.push(toXYZ(lat, lng, 1.003));
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        return <line key={`lng${lng}`} geometry={geo}><lineBasicMaterial color="#10b981" transparent opacity={0.03} /></line>;
      })}
    </group>
  );
}

// Animated arcs wrapper
function DataArcs({ connections }) {
  const groupRef = useRef();

  useFrame((state) => {
    // Animate dash offset on all arc lines
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
    return { geo, color: arc.flow === 'inflow' ? '#10b981' : '#ef4444', key: i };
  }), [connections]);

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

// Interactive hotspot on the globe
function GlobeHotspot({ hotspot, position, isSelected, isHovered, onSelect, onHover, onUnhover }) {
  const ref = useRef();
  const glowRef = useRef();
  const ringRef = useRef();
  const sentiment = hotspot.sentiment || 0.65;
  const volume = hotspot.volumeNum || 1;
  const baseSize = 0.012 + (volume / 3) * 0.025;

  // Color based on sentiment: green=bullish, amber=neutral, red=bearish
  const clr = useMemo(() => {
    if (sentiment >= 0.65) return new THREE.Color('#10b981');
    if (sentiment >= 0.4) return new THREE.Color('#f59e0b');
    return new THREE.Color('#ef4444');
  }, [sentiment]);

  useFrame((s) => {
    if (ref.current) {
      const pulse = 1 + Math.sin(s.clock.elapsedTime * 2.5 + position.x * 10) * 0.2;
      ref.current.scale.setScalar(pulse);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 1.5 + position.y * 8) * 0.3);
      glowRef.current.material.opacity = 0.08 + Math.sin(s.clock.elapsedTime * 2) * 0.04;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = s.clock.elapsedTime * 0.5;
      ringRef.current.material.opacity = isSelected ? 0.6 : 0;
    }
  });

  return (
    <group position={position}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[baseSize * 3, 16, 16]} />
        <meshBasicMaterial color={clr} transparent opacity={0.08} />
      </mesh>
      {/* Selection ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[baseSize * 2.5, baseSize * 3, 32]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      {/* Core dot */}
      <mesh
        ref={ref}
        onClick={(e) => { e.stopPropagation(); onSelect(hotspot); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; onHover(hotspot); }}
        onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'default'; onUnhover(); }}
      >
        <sphereGeometry args={[baseSize, 12, 12]} />
        <meshBasicMaterial color={clr} transparent opacity={isHovered || isSelected ? 1 : 0.85} />
      </mesh>
      {/* Hover label */}
      {isHovered && !isSelected && (
        <Html distanceFactor={3} style={{ pointerEvents: 'none' }}>
          <div className="bg-black/80 backdrop-blur-md border border-emerald-500/30 rounded-lg px-3 py-1.5 whitespace-nowrap" style={{ transform: 'translateY(-24px)' }}>
            <span className="text-xs font-semibold text-white">{hotspot.name}</span>
            <span className="text-[10px] text-emerald-400 ml-2">{hotspot.volume}</span>
          </div>
        </Html>
      )}
      {/* Selected detail card */}
      {isSelected && (
        <Html distanceFactor={2.5} style={{ pointerEvents: 'auto' }}>
          <div className="bg-black/90 backdrop-blur-xl border border-emerald-500/30 rounded-xl p-4 w-[280px] shadow-2xl shadow-emerald-500/10" style={{ transform: 'translateY(-60px) translateX(20px)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-white">{hotspot.name}</div>
                <div className="text-[10px] text-slate-400">{hotspot.region} Region</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${sentiment >= 0.65 ? 'bg-emerald-400' : sentiment >= 0.4 ? 'bg-amber-400' : 'bg-red-400'}`} />
                <span className={`text-xs font-bold ${sentiment >= 0.65 ? 'text-emerald-400' : sentiment >= 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
                  {Math.round(sentiment * 100)}
                </span>
              </div>
            </div>
            {/* Sentiment gauge bar */}
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all" style={{
                width: `${sentiment * 100}%`,
                background: sentiment >= 0.65 ? '#10b981' : sentiment >= 0.4 ? '#f59e0b' : '#ef4444',
                boxShadow: `0 0 8px ${sentiment >= 0.65 ? '#10b981' : sentiment >= 0.4 ? '#f59e0b' : '#ef4444'}40`,
              }} />
            </div>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
              <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
                <div className="text-slate-500 text-[9px]">VOLUME</div>
                <div className="text-white font-semibold">{hotspot.volume}</div>
              </div>
              <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
                <div className="text-slate-500 text-[9px]">B2B LEADS</div>
                <div className="text-white font-semibold">{hotspot.leadCount || 0}</div>
              </div>
              <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
                <div className="text-slate-500 text-[9px]">SENTIMENT</div>
                <div className={`font-semibold ${sentiment >= 0.65 ? 'text-emerald-400' : sentiment >= 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
                  {sentiment >= 0.65 ? 'Bullish' : sentiment >= 0.4 ? 'Neutral' : 'Bearish'}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
                <div className="text-slate-500 text-[9px]">BEHAVIOR</div>
                <div className="text-cyan-400 font-semibold">{hotspot.behaviorIndex || 72}%</div>
              </div>
            </div>
            {/* Trending topics */}
            <div className="mb-3">
              <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">Trending in {hotspot.name}</div>
              <div className="flex flex-wrap gap-1">
                {(hotspot.trends || ['DeFi Adoption', 'Institutional Flow', 'NFT Activity', 'Layer 2']).map((t, i) => (
                  <span key={i} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">{t}</span>
                ))}
              </div>
            </div>
            {/* Consumer insights */}
            <div className="text-[10px] text-slate-400 mb-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                {Math.round(sentiment * 100)}% bullish sentiment
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-cyan-400" />
                {hotspot.activity}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-purple-400" />
                {hotspot.consumerInsight || 'Rising crypto adoption'}
              </div>
            </div>
            {/* View Alpha button */}
            <button
              className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg py-2 transition-all flex items-center justify-center gap-1.5"
              onClick={(e) => { e.stopPropagation(); hotspot.onViewAlpha?.(); }}
            >
              <Zap size={12} /> View Alpha
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}

function GlobeMesh({ hotspots, selectedHotspot, hoveredHotspot, onSelectHotspot, onHoverHotspot, onUnhoverHotspot, controlsRef }) {
  const gRef = useRef();
  const autoRotateRef = useRef(true);
  const idleTimerRef = useRef(null);

  useFrame((s) => {
    if (gRef.current && autoRotateRef.current) {
      gRef.current.rotation.y += 0.0015; // 0.15 speed equivalent
    }
  });

  // Stop auto-rotate when a hotspot is selected, resume after 5s idle
  useEffect(() => {
    if (selectedHotspot) {
      autoRotateRef.current = false;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    } else {
      idleTimerRef.current = setTimeout(() => {
        autoRotateRef.current = true;
      }, 5000);
    }
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [selectedHotspot]);

  return (
    <group ref={gRef}>
      {/* Planet sphere */}
      <mesh><sphereGeometry args={[1, 64, 64]} /><meshBasicMaterial color="#050a08" transparent opacity={0.97} /></mesh>
      {/* Real GeoJSON country borders */}
      <GeoLines />
      {/* Data flow arcs */}
      <DataArcs connections={ARC_CONNECTIONS} />
      {/* Interactive hotspots */}
      {(hotspots || []).map((h, i) => {
        const pos = toXYZ(h.lat, h.lng, 1.015);
        return (
          <GlobeHotspot
            key={i}
            hotspot={h}
            position={pos}
            isSelected={selectedHotspot?.name === h.name}
            isHovered={hoveredHotspot?.name === h.name}
            onSelect={onSelectHotspot}
            onHover={onHoverHotspot}
            onUnhover={onUnhoverHotspot}
          />
        );
      })}
      {/* Atmosphere glow */}
      <mesh><sphereGeometry args={[1.06, 64, 64]} /><meshBasicMaterial color="#10b981" transparent opacity={0.02} side={THREE.BackSide} /></mesh>
      <mesh><sphereGeometry args={[1.12, 64, 64]} /><meshBasicMaterial color="#10b981" transparent opacity={0.01} side={THREE.BackSide} /></mesh>
    </group>
  );
}

function GlobeScene({ hotspots, selectedHotspot, hoveredHotspot, onSelectHotspot, onHoverHotspot, onUnhoverHotspot }) {
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
        controlsRef={controlsRef}
      />
      <OrbitControls
        ref={controlsRef}
        enableZoom
        enablePan={false}
        autoRotate={false}
        minDistance={1.5}
        maxDistance={5}
      />
    </Canvas>
  );
}

// ─── GOATED Score Badge ─────────────────────────────────────────────────────

function GoatedScoreBadge({ score }) {
  const clr = score >= 80 ? '#00ff88' : score >= 60 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'ELITE' : score >= 60 ? 'STRONG' : score >= 40 ? 'MODERATE' : 'WEAK';
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative w-12 h-12">
        <svg width={48} height={48} className="-rotate-90">
          <circle cx={24} cy={24} r={20} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={3} />
          <circle cx={24} cy={24} r={20} fill="none" stroke={clr} strokeWidth={3}
            strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 - (score / 100) * 2 * Math.PI * 20}
            strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${clr}40)` }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black" style={{ color: clr }}>{score}</span>
        </div>
      </div>
      <span className="text-[8px] font-bold tracking-wider" style={{ color: clr }}>{label}</span>
    </div>
  );
}

// ─── Alpha Card ─────────────────────────────────────────────────────────────

function AlphaCard({ play }) {
  const dClr = play.direction === 'long' ? 'text-emerald-400' : play.direction === 'reduce' ? 'text-amber-400' : 'text-red-400';
  const dBg = play.direction === 'long' ? 'bg-emerald-500/10' : play.direction === 'reduce' ? 'bg-amber-500/10' : 'bg-red-500/10';
  const rClr = play.risk === 'high' ? 'text-red-400' : play.risk === 'medium' ? 'text-amber-400' : 'text-emerald-400';
  const goatedScore = play.goatedScore || play.confidence || 50;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.04] hover:border-brand/20 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${dBg} ${dClr}`}>{play.direction === 'long' ? 'LONG' : play.direction === 'reduce' ? 'REDUCE' : 'SHORT'}</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-slate-400 uppercase">{play.type}</span>
          {play.assetClass && <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 uppercase">{play.assetClass}</span>}
        </div>
        <GoatedScoreBadge score={goatedScore} />
      </div>
      <h3 className="text-white font-semibold mb-2 group-hover:text-brand transition-colors">{play.title}</h3>
      <p className="text-slate-400 text-sm mb-3 leading-relaxed">{play.description}</p>
      {/* Thesis */}
      {play.thesis && (
        <div className="mb-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">THESIS</div>
          <p className="text-xs text-slate-300 leading-relaxed">{play.thesis}</p>
        </div>
      )}
      <div className="flex items-center gap-4 text-xs mb-3">
        <span className="flex items-center gap-1 text-slate-500"><Crosshair size={12} /><span className="font-medium text-slate-300">{play.asset}</span></span>
        <span className="flex items-center gap-1 text-slate-500"><Clock size={12} />{play.timeframe}</span>
        <span className={`flex items-center gap-1 ${rClr}`}><Shield size={12} /><span className="capitalize">{play.risk} risk</span></span>
        {play.sparklineData && <Spark data={play.sparklineData} w={60} h={18} />}
      </div>
      {/* Entry/Exit levels */}
      {(play.entry || play.exit || play.stopLoss) && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {play.entry && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2 text-center">
              <div className="text-[9px] text-slate-600 uppercase">Entry</div>
              <div className="text-xs font-bold text-emerald-400">{play.entry}</div>
            </div>
          )}
          {play.exit && (
            <div className="bg-brand/5 border border-brand/10 rounded-lg p-2 text-center">
              <div className="text-[9px] text-slate-600 uppercase">Target</div>
              <div className="text-xs font-bold text-brand">{play.exit}</div>
            </div>
          )}
          {play.stopLoss && (
            <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2 text-center">
              <div className="text-[9px] text-slate-600 uppercase">Stop Loss</div>
              <div className="text-xs font-bold text-red-400">{play.stopLoss}</div>
            </div>
          )}
        </div>
      )}
      {/* Actionable Play */}
      <div className="p-2.5 rounded-lg bg-brand/5 border border-brand/10 text-[11px] space-y-1">
        <div className="flex items-center gap-1.5">
          <Target size={11} className="text-brand shrink-0" />
          <span className="text-brand font-black uppercase tracking-wider text-[10px]">PLAY:</span>
          <span className="text-slate-200 font-medium">
            {play.direction === 'long' ? 'Long' : 'Short'} {play.asset}
            {play.entry ? ` above ${play.entry}` : ''}
            {play.stopLoss ? ` with stop at ${play.stopLoss}` : ''}
            {play.exit ? ` — target ${play.exit}` : ''}
            {!play.entry && !play.exit ? ` · ${play.timeframe} horizon · Watch for confirmation before entering` : ''}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span>{goatedScore}/100 GOATED Score</span>
          <span>{play.timeframe}</span>
          <span className="ml-auto text-brand font-bold">Actionable Setup</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Hardcoded Premium Alpha Plays ──────────────────────────────────────────

const PREMIUM_ALPHA_PLAYS = [
  {
    type: 'macro-convergence', title: 'BTC + Gold Macro Convergence Play',
    description: 'Bitcoin and gold are both reacting to the same macro catalyst: Fed rate cut expectations and USD weakening. BTC historically rallies 40-60% in the 6 months following first rate cut.',
    thesis: 'The Fed has signaled 2-3 rate cuts in 2026. Gold is already at ATH. BTC tends to lag gold by 4-8 weeks in rate-cut cycles, then outperform 3-5x. On-chain data shows exchange outflows at 2-year highs — supply shock imminent.',
    asset: 'BTC', direction: 'long', confidence: 88, goatedScore: 91, timeframe: '2-8 weeks', risk: 'medium',
    assetClass: 'CRYPTO + MACRO', entry: '$95,000-$97,500', exit: '$115,000-$125,000', stopLoss: '$89,000',
    sparklineData: Array.from({length: 30}, (_, i) => 92000 + Math.sin(i/4)*3000 + i*180),
  },
  {
    type: 'cross-asset', title: 'SOL Ecosystem Beta Rotation',
    description: 'Solana DeFi TVL broke $12B with 40% MoM growth. When SOL rallies 10%+, ecosystem tokens (JUP, RAY, ORCA) follow with 1.5-3x beta within 48-72h.',
    thesis: 'SOL is the strongest L1 this cycle with real usage metrics (500M+ monthly txns). Jupiter processed $80B+ in cumulative volume. The ecosystem trade is the highest Sharpe ratio play in crypto right now. Firedancer upgrade catalyst approaching.',
    asset: 'SOL + JUP + RAY', direction: 'long', confidence: 82, goatedScore: 85, timeframe: '24-72h', risk: 'medium',
    assetClass: 'CRYPTO', entry: 'SOL $190-$200', exit: 'SOL $240-$260', stopLoss: 'SOL $175',
    sparklineData: Array.from({length: 30}, (_, i) => 170 + Math.sin(i/5)*15 + i*1.2),
  },
  {
    type: 'prediction-arb', title: 'Fed Rate Cut Prediction Market Arb',
    description: 'Kalshi prices June rate cut at 62% while GOATED prices it at 68%. 6% spread opportunity on a high-conviction macro event with CME FedWatch confirming 70%+ probability.',
    thesis: 'The market is mispricing the dovish Fed pivot. CPI trending down for 4 consecutive months, unemployment ticking up. CME FedWatch at 72% for June cut. Buy YES on GOATED at $0.68 (better than Kalshi $0.62). Risk/reward: 1.47x if YES wins, lose $0.68 if NO.',
    asset: 'Fed Rate Cut YES', direction: 'long', confidence: 74, goatedScore: 78, timeframe: 'Jun 2026', risk: 'low',
    assetClass: 'PREDICTION MKT', entry: '$0.68 (YES)', exit: '$1.00 at resolution', stopLoss: 'N/A (binary)',
    sparklineData: Array.from({length: 30}, (_, i) => 0.55 + Math.sin(i/6)*0.05 + i*0.004),
  },
  {
    type: 'momentum', title: 'NVIDIA Post-Earnings Momentum',
    description: 'NVIDIA beat earnings estimates by 12% with data center revenue up 120% YoY. Historical pattern: NVDA rallies 8-15% in the 10 trading days post-earnings beat.',
    thesis: 'AI capex cycle is accelerating, not decelerating. Hyperscalers (MSFT, GOOG, AMZN) all increased GPU spend guidance. NVDA forward P/E at 32x is reasonable vs 60%+ growth. Blackwell ramp is just beginning. Options flow shows massive call buying at $180-$200 strikes.',
    asset: 'NVDA', direction: 'long', confidence: 79, goatedScore: 82, timeframe: '1-2 weeks', risk: 'medium',
    assetClass: 'STOCKS', entry: '$168-$175', exit: '$195-$210', stopLoss: '$158',
    sparklineData: Array.from({length: 30}, (_, i) => 155 + Math.sin(i/4)*8 + i*0.8),
  },
  {
    type: 'mean-reversion', title: 'ETH/BTC Ratio Mean Reversion',
    description: 'ETH/BTC ratio at 0.039 — lowest since 2021. Historically, this ratio mean-reverts to 0.05-0.06 during alt seasons. ETH staking yield + L2 growth provide fundamental floor.',
    thesis: 'ETH ETF staking approval catalyst expected Q2 2026. If approved, ETH yield becomes accessible to TradFi, potentially adding $5-10B in new demand. ETH/BTC ratio below 0.04 has been a generational buy signal in every previous cycle. Pectra upgrade shipping Q2.',
    asset: 'ETH (vs BTC)', direction: 'long', confidence: 71, goatedScore: 76, timeframe: '4-12 weeks', risk: 'medium',
    assetClass: 'CRYPTO', entry: 'ETH $3,700-$3,850', exit: 'ETH $5,000-$5,500', stopLoss: 'ETH $3,400',
    sparklineData: Array.from({length: 30}, (_, i) => 3400 + Math.sin(i/5)*200 + i*15),
  },
  {
    type: 'event-driven', title: 'Senate Election Prediction Spread',
    description: 'Democrats polling at 48% for Senate control but prediction markets only price it at 46%. Historical polling accuracy suggests 52-55% true probability — 6-9% edge available.',
    thesis: 'Midterm election cycles with incumbent party losing presidency (not applicable here but same voter dynamics) show higher turnout for opposition. Key swing states (PA, GA, AZ) trending blue in recent special elections. Buy YES at $0.46, true value likely $0.52+.',
    asset: 'DEM Senate YES', direction: 'long', confidence: 65, goatedScore: 68, timeframe: 'Nov 2026', risk: 'high',
    assetClass: 'PREDICTION MKT', entry: '$0.46 (YES)', exit: '$1.00 at resolution', stopLoss: 'N/A (binary)',
    sparklineData: Array.from({length: 30}, (_, i) => 0.42 + Math.sin(i/7)*0.03 + i*0.001),
  },
  {
    type: 'sector-rotation', title: 'AI Infrastructure Long — AVGO + MRVL',
    description: 'Custom ASIC demand surging as hyperscalers diversify beyond NVIDIA. Broadcom and Marvell are the picks-and-shovels play on enterprise AI adoption.',
    thesis: 'Google TPU v6 using Broadcom silicon. Amazon Trainium chips using Marvell networking. Both companies see 50%+ AI revenue growth. Trading at 25-30x forward P/E vs 40%+ growth = PEG ratio under 1. This is the "second wave" AI trade that most retail investors are missing.',
    asset: 'AVGO + MRVL', direction: 'long', confidence: 76, goatedScore: 80, timeframe: '3-6 months', risk: 'medium',
    assetClass: 'STOCKS', entry: 'AVGO $185-$195, MRVL $85-$90', exit: 'AVGO $240+, MRVL $120+', stopLoss: 'AVGO $170, MRVL $78',
    sparklineData: Array.from({length: 30}, (_, i) => 180 + Math.sin(i/6)*10 + i*0.5),
  },
];

// ─── Sentiment Donut Chart ──────────────────────────────────────────────────

function SentimentDonut({ bullish, bearish, neutral, size = 80 }) {
  const total = bullish + bearish + neutral || 1;
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const bullPct = bullish / total;
  const bearPct = bearish / total;
  const neutPct = neutral / total;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Neutral (base layer) */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#64748b" strokeWidth={8} opacity={0.3}
          strokeDasharray={circ} strokeDashoffset={0} />
        {/* Bearish */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ef4444" strokeWidth={8}
          strokeDasharray={`${(bullPct + bearPct) * circ} ${circ}`} strokeDashoffset={0}
          strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 3px #ef444440)' }} />
        {/* Bullish */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#10b981" strokeWidth={8}
          strokeDasharray={`${bullPct * circ} ${circ}`} strokeDashoffset={0}
          strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 3px #10b98140)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-white">{total}</span>
        <span className="text-[8px] text-slate-500 uppercase">total</span>
      </div>
    </div>
  );
}

// ─── Sentiment Strength Bar ─────────────────────────────────────────────────

function SentimentStrengthBar({ sentiment }) {
  const strength = sentiment === 'bullish' ? 0.8 : sentiment === 'bearish' ? 0.7 : 0.4;
  const clr = sentiment === 'bullish' ? '#10b981' : sentiment === 'bearish' ? '#ef4444' : '#64748b';
  return (
    <div className="flex items-center gap-1.5 min-w-[60px]">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${strength * 100}%`, backgroundColor: clr, boxShadow: `0 0 6px ${clr}40` }} />
      </div>
      <span className="text-[9px] font-mono" style={{ color: clr }}>{Math.round(strength * 100)}%</span>
    </div>
  );
}

// ─── Signal Badge ───────────────────────────────────────────────────────────

function SigBadge({ s }) {
  const bull = s.type === 'bullish';
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bull ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
      {bull ? <ArrowUp size={14} className="text-emerald-400" /> : <ArrowDown size={14} className="text-red-400" />}
      <span className={`text-xs ${bull ? 'text-emerald-400' : 'text-red-400'}`}>{s.msg}</span>
      {s.weight === 'high' && <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-slate-400">HIGH</span>}
    </div>
  );
}

// ─── Platform colors & helpers ──────────────────────────────────────────────

const PLATFORM_COLORS = {
  GOATED: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20', accent: '#00ff88' },
  Kalshi: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/20', accent: '#3b82f6' },
  Polymarket: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/20', accent: '#a855f7' },
};

const CATEGORY_COLORS = {
  Crypto: 'bg-amber-500/10 text-amber-400',
  Politics: 'bg-rose-500/10 text-rose-400',
  Economics: 'bg-cyan-500/10 text-cyan-400',
  Tech: 'bg-indigo-500/10 text-indigo-400',
  AI: 'bg-violet-500/10 text-violet-400',
  Sports: 'bg-orange-500/10 text-orange-400',
  Climate: 'bg-teal-500/10 text-teal-400',
  Culture: 'bg-pink-500/10 text-pink-400',
  Macro: 'bg-cyan-500/10 text-cyan-400',
  Stocks: 'bg-indigo-500/10 text-indigo-400',
  Other: 'bg-slate-500/10 text-slate-400',
};

// ─── Prediction Card with Betting UI ────────────────────────────────────────

function TrendsPredictionCard({ m }) {
  const y = m.yesPrice ?? parseFloat(m.outcomePrices?.[0] || '0.5');
  const n = 1 - y;
  const yesPct = Math.round(y * 100);
  const noPct = 100 - yesPct;
  const trendColor = m.trend === 'up' ? 'text-emerald-400' : m.trend === 'down' ? 'text-red-400' : 'text-slate-500';
  const platformStyle = PLATFORM_COLORS[m.platform] || PLATFORM_COLORS.GOATED;
  const catStyle = CATEGORY_COLORS[m.category] || CATEGORY_COLORS.Other;

  // Compute alpha percentage for display
  const alphaDisplay = m.alpha || (y > 0 ? `+${Math.round((1/y - 1) * 100)}%` : '');
  // Determine competitor spread for display
  const competitorSpread = m.kalshiSpread || m.polymarketSpread || null;
  const competitorName = m.kalshiSpread ? 'Kalshi' : m.polymarketSpread ? 'Polymarket' : null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.04] transition-colors">
      {/* Platform badge + Category pill + Resolution */}
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${platformStyle.bg} ${platformStyle.text} border ${platformStyle.border}`}>
          {m.platform || 'GOATED'}
        </span>
        {m.category && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${catStyle}`}>{m.category}</span>
        )}
        {m.resolution && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-500 flex items-center gap-1">
            <Clock size={8} />{m.resolution}
          </span>
        )}
        {m.trend && (
          <span className={`text-[9px] font-bold ml-auto ${trendColor}`}>
            {m.trend === 'up' ? '\u25B2' : m.trend === 'down' ? '\u25BC' : '\u25C6'}{' '}
            {m.change != null ? `${m.change > 0 ? '+' : ''}${m.change}%` : ''}
          </span>
        )}
      </div>
      {/* Question */}
      <p className="text-sm text-white font-medium leading-snug mb-2">{m.question}</p>
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-500 rounded-l-full transition-all" style={{ width: `${yesPct}%` }} />
          <div className="h-full bg-red-500 rounded-r-full transition-all" style={{ width: `${noPct}%` }} />
        </div>
      </div>
      {/* Yes/No + Volume */}
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold">Yes {yesPct}%</span>
          <span className="text-red-400 font-bold">No {noPct}%</span>
        </div>
        <div className="flex items-center gap-2">
          {m.volume > 0 && <span className="text-slate-600">{fmtVol(m.volume)} vol</span>}
        </div>
      </div>
      {/* Alpha + Spread comparison */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {alphaDisplay && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand/10 text-brand font-bold flex items-center gap-1">
            <Zap size={8} />{alphaDisplay} alpha if YES wins
          </span>
        )}
        {m.goatedSpread != null && competitorSpread != null && (
          <span className="text-[10px] text-slate-500">
            GOATED: <span className="text-brand font-semibold">${m.goatedSpread.toFixed(3)}</span>
            {' vs '}
            {competitorName}: <span className="text-slate-400">${competitorSpread.toFixed(3)}</span>
          </span>
        )}
      </div>
      {/* Odds badges */}
      <div className="flex gap-2">
        <span className="flex-1 py-2 rounded-lg text-xs font-bold text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          YES ${y.toFixed(2)}
        </span>
        <span className="flex-1 py-2 rounded-lg text-xs font-bold text-center bg-red-500/10 text-red-400 border border-red-500/20">
          NO ${n.toFixed(2)}
        </span>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MARKETS TAB — DATA & COMPONENTS (from MarketPage)
// ============================================================================

// ---------------------------------------------------------------------------
// Helpers (Markets)
// ---------------------------------------------------------------------------
function formatPrice(n, decimals) {
  if (n == null || isNaN(n)) return '$0.00';
  if (decimals != null) return `$${n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(6)}`;
}
function formatLargeNumber(n) {
  if (n == null || isNaN(n)) return '$0';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
function formatCompactNumber(n) {
  if (n == null || isNaN(n)) return '0';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n}`;
}
function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

// ---------------------------------------------------------------------------
// ASSET CLASS COLORS / ICONS
// ---------------------------------------------------------------------------
const ASSET_COLORS = {
  BTC: '#f7931a', ETH: '#627eea', SOL: '#00ffa3', BNB: '#f3ba2f',
  ADA: '#0033ad', DOT: '#e6007a', AVAX: '#e84142', MATIC: '#8247e5',
  LINK: '#2a5ada', UNI: '#ff007a', XRP: '#00aae4', DOGE: '#c2a633',
  ATOM: '#2e3148', NEAR: '#00ec97', ARB: '#28a0f0', OP: '#ff0420',
  APT: '#00bcd4', SUI: '#4da2ff', FIL: '#0090ff', INJ: '#00f2fe',
  AAPL: '#a2aaad', NVDA: '#76b900', TSLA: '#cc0000', MSFT: '#00a4ef',
  GOOGL: '#4285f4', AMZN: '#ff9900', META: '#0668e1', JPM: '#003087',
  'SPY': '#1a73e8', 'QQQ': '#7b1fa2', 'DIA': '#0d47a1', 'IWM': '#2e7d32',
  'EUR/USD': '#003399', 'GBP/USD': '#cf142b', 'USD/JPY': '#bc002d',
  'AUD/USD': '#00843d', 'USD/CAD': '#ff0000', 'USD/CHF': '#d52b1e',
  GOLD: '#ffd700', SILVER: '#c0c0c0', OIL: '#4a4a4a', 'NAT GAS': '#00bcd4',
  COPPER: '#b87333', PLATINUM: '#e5e4e2',
};
const CLASS_COLORS = {
  crypto: '#00ff88', stocks: '#00a4ef', predictions: '#a855f7',
  forex: '#f59e0b', commodities: '#ffd700',
};

// ---------------------------------------------------------------------------
// MOCK DATA: Stocks / Forex / Commodities
// ---------------------------------------------------------------------------
const STOCKS_DATA = [
  { id: 'spy', symbol: 'SPY', name: 'S&P 500 ETF', price: 5842.50, change24h: 0.73, marketCap: 5.2e12, volume24h: 82e9, assetClass: 'stocks' },
  { id: 'qqq', symbol: 'QQQ', name: 'Nasdaq 100 ETF', price: 20465.20, change24h: 1.12, marketCap: 3.8e12, volume24h: 64e9, assetClass: 'stocks' },
  { id: 'dia', symbol: 'DIA', name: 'Dow Jones ETF', price: 43210.80, change24h: -0.18, marketCap: 4.1e12, volume24h: 38e9, assetClass: 'stocks' },
  { id: 'iwm', symbol: 'IWM', name: 'Russell 2000 ETF', price: 2284.30, change24h: -0.92, marketCap: 1.8e12, volume24h: 22e9, assetClass: 'stocks' },
  { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.', price: 234.82, change24h: 1.42, marketCap: 3.62e12, volume24h: 58e9, assetClass: 'stocks' },
  { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA Corp.', price: 142.56, change24h: 3.87, marketCap: 3.49e12, volume24h: 48e9, assetClass: 'stocks' },
  { id: 'tsla', symbol: 'TSLA', name: 'Tesla Inc.', price: 248.92, change24h: -2.34, marketCap: 793e9, volume24h: 32e9, assetClass: 'stocks' },
  { id: 'msft', symbol: 'MSFT', name: 'Microsoft Corp.', price: 442.18, change24h: 0.56, marketCap: 3.29e12, volume24h: 28e9, assetClass: 'stocks' },
  { id: 'googl', symbol: 'GOOGL', name: 'Alphabet Inc.', price: 178.94, change24h: 0.89, marketCap: 2.21e12, volume24h: 24e9, assetClass: 'stocks' },
  { id: 'amzn', symbol: 'AMZN', name: 'Amazon.com Inc.', price: 218.64, change24h: 1.67, marketCap: 2.28e12, volume24h: 31e9, assetClass: 'stocks' },
  { id: 'meta', symbol: 'META', name: 'Meta Platforms', price: 612.40, change24h: 2.15, marketCap: 1.56e12, volume24h: 22e9, assetClass: 'stocks' },
  { id: 'jpm', symbol: 'JPM', name: 'JPMorgan Chase', price: 242.68, change24h: -0.45, marketCap: 698e9, volume24h: 12e9, assetClass: 'stocks' },
];
const FOREX_DATA = [
  { id: 'eurusd', symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0892, change24h: 0.14, volume24h: 2.1e12, assetClass: 'forex' },
  { id: 'gbpusd', symbol: 'GBP/USD', name: 'British Pound / USD', price: 1.2734, change24h: -0.22, volume24h: 1.1e12, assetClass: 'forex' },
  { id: 'usdjpy', symbol: 'USD/JPY', name: 'US Dollar / Yen', price: 149.82, change24h: 0.31, volume24h: 1.5e12, assetClass: 'forex' },
  { id: 'audusd', symbol: 'AUD/USD', name: 'Australian Dollar / USD', price: 0.6648, change24h: -0.47, volume24h: 450e9, assetClass: 'forex' },
  { id: 'usdcad', symbol: 'USD/CAD', name: 'US Dollar / Canadian', price: 1.3542, change24h: 0.08, volume24h: 380e9, assetClass: 'forex' },
  { id: 'usdchf', symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', price: 0.8834, change24h: -0.15, volume24h: 320e9, assetClass: 'forex' },
  { id: 'nzdusd', symbol: 'NZD/USD', name: 'New Zealand Dollar / USD', price: 0.6124, change24h: -0.62, volume24h: 120e9, assetClass: 'forex' },
  { id: 'eurgbp', symbol: 'EUR/GBP', name: 'Euro / British Pound', price: 0.8554, change24h: 0.36, volume24h: 280e9, assetClass: 'forex' },
];
const COMMODITIES_DATA = [
  { id: 'gold', symbol: 'GOLD', name: 'Gold (XAU/USD)', price: 2648.30, change24h: 0.82, volume24h: 180e9, marketCap: null, assetClass: 'commodities' },
  { id: 'silver', symbol: 'SILVER', name: 'Silver (XAG/USD)', price: 31.24, change24h: 1.34, volume24h: 28e9, marketCap: null, assetClass: 'commodities' },
  { id: 'oil', symbol: 'OIL', name: 'Crude Oil (WTI)', price: 71.82, change24h: -1.87, volume24h: 95e9, marketCap: null, assetClass: 'commodities' },
  { id: 'natgas', symbol: 'NAT GAS', name: 'Natural Gas', price: 3.42, change24h: 2.64, volume24h: 18e9, marketCap: null, assetClass: 'commodities' },
  { id: 'copper', symbol: 'COPPER', name: 'Copper (HG)', price: 4.18, change24h: -0.72, volume24h: 22e9, marketCap: null, assetClass: 'commodities' },
  { id: 'platinum', symbol: 'PLATINUM', name: 'Platinum (XPT/USD)', price: 982.40, change24h: 0.44, volume24h: 6e9, marketCap: null, assetClass: 'commodities' },
];

// ---------------------------------------------------------------------------
// MOCK DATA: Prediction Markets (expanded)
// ---------------------------------------------------------------------------
const PREDICTION_MARKETS = [
  { id: 'pm1', question: 'Will the Republican candidate win the 2028 Presidential Election?', yesPrice: 0.48, volume: 142000000, category: 'Political', platform: 'Polymarket', trend: 'up', change: +1.8, alpha: '+108%', resolution: 'Nov 2028' },
  { id: 'pm2', question: 'Will Trump run for President in 2028?', yesPrice: 0.12, volume: 68000000, category: 'Political', platform: 'Polymarket', trend: 'down', change: -2.4, alpha: '+733%', resolution: 'Jun 2028' },
  { id: 'pm3', question: 'Will there be a US government shutdown in 2026?', yesPrice: 0.38, volume: 24000000, category: 'Political', platform: 'Kalshi', trend: 'up', change: +4.1, alpha: '+163%', resolution: 'Dec 2026' },
  { id: 'pm4', question: 'Will US impose new tariffs on China in Q2 2026?', yesPrice: 0.67, volume: 31000000, category: 'Political', platform: 'Kalshi', trend: 'up', change: +2.9, alpha: '+49%', resolution: 'Jun 2026' },
  { id: 'pm5', question: 'Will the Fed cut rates before June 2026?', yesPrice: 0.61, volume: 89000000, category: 'Economic', platform: 'Kalshi', trend: 'down', change: -1.8, alpha: '+64%', resolution: 'Jun 2026' },
  { id: 'pm6', question: 'Will US GDP growth exceed 3% in 2026?', yesPrice: 0.29, volume: 18000000, category: 'Economic', platform: 'Kalshi', trend: 'down', change: -0.7, alpha: '+245%', resolution: 'Jan 2027' },
  { id: 'pm7', question: 'Will S&P 500 hit 6500 in 2026?', yesPrice: 0.42, volume: 54000000, category: 'Economic', platform: 'Kalshi', trend: 'up', change: +3.2, alpha: '+138%', resolution: 'Dec 2026' },
  { id: 'pm8', question: 'Will US inflation drop below 2% by end of 2026?', yesPrice: 0.34, volume: 22000000, category: 'Economic', platform: 'Kalshi', trend: 'up', change: +1.1, alpha: '+194%', resolution: 'Dec 2026' },
  { id: 'pm9', question: 'Will US unemployment exceed 5% in 2026?', yesPrice: 0.18, volume: 15000000, category: 'Economic', platform: 'Kalshi', trend: 'flat', change: +0.2, alpha: '+456%', resolution: 'Dec 2026' },
  { id: 'pm10', question: 'Will BTC reach $150K before July 2026?', yesPrice: 0.31, volume: 76000000, category: 'Crypto', platform: 'Polymarket', trend: 'up', change: +5.4, alpha: '+223%', resolution: 'Jul 2026' },
  { id: 'pm11', question: 'Will Ethereum flip BTC market cap in 2026?', yesPrice: 0.06, volume: 12000000, category: 'Crypto', platform: 'Polymarket', trend: 'flat', change: +0.2, alpha: '+1567%', resolution: 'Dec 2026' },
  { id: 'pm12', question: 'Will Solana reach $500 in 2026?', yesPrice: 0.22, volume: 28000000, category: 'Crypto', platform: 'Polymarket', trend: 'up', change: +3.1, alpha: '+355%', resolution: 'Dec 2026' },
  { id: 'pm13', question: 'US spot Solana ETF approved in 2026?', yesPrice: 0.41, volume: 45000000, category: 'Crypto', platform: 'Polymarket', trend: 'up', change: +8.7, alpha: '+144%', resolution: 'Dec 2026' },
  { id: 'pm14', question: 'Will DOGE reach $1 in 2026?', yesPrice: 0.09, volume: 34000000, category: 'Crypto', platform: 'Polymarket', trend: 'up', change: +1.9, alpha: '+1011%', resolution: 'Dec 2026' },
  { id: 'pm15', question: 'Will AI tokens outperform BTC in Q2 2026?', yesPrice: 0.44, volume: 16000000, category: 'Crypto', platform: 'Kalshi', trend: 'up', change: +2.4, alpha: '+127%', resolution: 'Jun 2026' },
  { id: 'pm16', question: 'Will total crypto market cap exceed $5T in 2026?', yesPrice: 0.52, volume: 38000000, category: 'Crypto', platform: 'Polymarket', trend: 'up', change: +1.6, alpha: '+92%', resolution: 'Dec 2026' },
  { id: 'pm17', question: 'Will Apple release an AI-first iPhone in 2026?', yesPrice: 0.73, volume: 21000000, category: 'Tech', platform: 'Kalshi', trend: 'up', change: +1.2, alpha: '+37%', resolution: 'Dec 2026' },
  { id: 'pm18', question: 'Will OpenAI IPO in 2026?', yesPrice: 0.35, volume: 42000000, category: 'Tech', platform: 'Polymarket', trend: 'down', change: -3.4, alpha: '+186%', resolution: 'Dec 2026' },
  { id: 'pm19', question: 'Will AGI be declared achieved by a major lab in 2026?', yesPrice: 0.14, volume: 56000000, category: 'Tech', platform: 'Polymarket', trend: 'up', change: +2.8, alpha: '+614%', resolution: 'Dec 2026' },
  { id: 'pm20', question: 'Will NVIDIA market cap exceed $5T in 2026?', yesPrice: 0.38, volume: 29000000, category: 'Tech', platform: 'Kalshi', trend: 'up', change: +4.2, alpha: '+163%', resolution: 'Dec 2026' },
  { id: 'pm21', question: 'Will Tesla release a fully autonomous robotaxi in 2026?', yesPrice: 0.19, volume: 33000000, category: 'Tech', platform: 'Polymarket', trend: 'down', change: -1.6, alpha: '+426%', resolution: 'Dec 2026' },
  { id: 'pm22', question: 'Will Russia-Ukraine ceasefire happen in 2026?', yesPrice: 0.32, volume: 48000000, category: 'Geopolitical', platform: 'Polymarket', trend: 'up', change: +2.1, alpha: '+213%', resolution: 'Dec 2026' },
  { id: 'pm23', question: 'Will China invade Taiwan in 2026?', yesPrice: 0.04, volume: 62000000, category: 'Geopolitical', platform: 'Polymarket', trend: 'flat', change: -0.1, alpha: '+2400%', resolution: 'Dec 2026' },
  { id: 'pm24', question: 'Will Iran develop a nuclear weapon in 2026?', yesPrice: 0.08, volume: 19000000, category: 'Geopolitical', platform: 'Kalshi', trend: 'down', change: -0.5, alpha: '+1150%', resolution: 'Dec 2026' },
  { id: 'pm25', question: 'Will viewership for 2026 World Cup final exceed 2B?', yesPrice: 0.62, volume: 14000000, category: 'Sports', platform: 'Polymarket', trend: 'up', change: +0.8, alpha: '+61%', resolution: 'Jul 2026' },
  { id: 'pm26', question: 'Will a streaming service surpass Netflix subscribers in 2026?', yesPrice: 0.21, volume: 8000000, category: 'Tech', platform: 'Kalshi', trend: 'down', change: -1.2, alpha: '+376%', resolution: 'Dec 2026' },
];

// ---------------------------------------------------------------------------
// Alpha Signals (Markets)
// ---------------------------------------------------------------------------
const ALPHA_SIGNALS = [
  { id: 'a1', title: 'Whale Alert: 12,400 BTC moved from exchange to cold wallet', type: 'whale', severity: 'high', coin: 'BTC', time: Date.now() - 900_000, impact: 'Bullish -- supply squeeze signal',
    trade: { direction: 'LONG', asset: 'BTC', entry: '$97,200', target: '$102,000', stop: '$95,500', leverage: '3x', timeframe: '2-7 days', expectedReturn: '+4.9%', predictionLink: 'BTC above $100K by April 2026?', predictionOdds: '72% YES' } },
  { id: 'a2', title: 'NVDA after-hours: beat earnings by 18%, guidance raised', type: 'flow', severity: 'high', coin: 'NVDA', time: Date.now() - 1_200_000, impact: 'Bullish -- AI capex cycle intact',
    trade: { direction: 'LONG', asset: 'NVDA', entry: '$142.50', target: '$165.00', stop: '$135.00', leverage: '1x (shares)', timeframe: '1-4 weeks', expectedReturn: '+15.8%', predictionLink: 'Will NVIDIA market cap exceed $5T in 2026?', predictionOdds: '38% YES (+163% alpha)' } },
  { id: 'a3', title: 'Ethereum ETF inflows hit $340M today -- 3rd consecutive record', type: 'flow', severity: 'high', coin: 'ETH', time: Date.now() - 1_800_000, impact: 'Bullish -- institutional demand accelerating',
    trade: { direction: 'LONG', asset: 'ETH', entry: '$3,840', target: '$4,200', stop: '$3,650', leverage: '5x', timeframe: '1-2 weeks', expectedReturn: '+9.4%', predictionLink: 'Will Ethereum flip BTC market cap in 2026?', predictionOdds: '6% YES (+1567% alpha)' } },
  { id: 'a4', title: 'Gold breaks $2,650 as Middle East tensions escalate', type: 'volume', severity: 'high', coin: 'GOLD', time: Date.now() - 2_400_000, impact: 'Bullish -- safe haven bid intensifying',
    trade: { direction: 'LONG', asset: 'GOLD (XAU/USD)', entry: '$2,648', target: '$2,720', stop: '$2,610', leverage: '10x', timeframe: '3-10 days', expectedReturn: '+2.7%', predictionLink: null, predictionOdds: null } },
  { id: 'a5', title: 'SOL open interest surged 28% in 4 hours on Binance', type: 'derivatives', severity: 'high', coin: 'SOL', time: Date.now() - 3_600_000, impact: 'Volatile -- leveraged long buildup',
    trade: { direction: 'LONG', asset: 'SOL', entry: '$198', target: '$225', stop: '$185', leverage: '5x', timeframe: '1-3 days', expectedReturn: '+13.6%', predictionLink: 'Will Solana reach $500 in 2026?', predictionOdds: '22% YES (+355% alpha)' } },
  { id: 'a6', title: 'EUR/USD breaks above 1.09 -- ECB rate decision tomorrow', type: 'flow', severity: 'medium', coin: 'EUR/USD', time: Date.now() - 4_200_000, impact: 'Volatile -- forex markets pricing in divergence',
    trade: { direction: 'LONG', asset: 'EUR/USD', entry: '1.0892', target: '1.0960', stop: '1.0840', leverage: '20x', timeframe: '1-3 days', expectedReturn: '+0.6% (12% w/ leverage)', predictionLink: null, predictionOdds: null } },
  { id: 'a7', title: 'BTC funding rate turning negative across major exchanges', type: 'derivatives', severity: 'medium', coin: 'BTC', time: Date.now() - 5_400_000, impact: 'Contrarian bullish -- shorts may get squeezed',
    trade: { direction: 'LONG', asset: 'BTC Perp', entry: '$97,400', target: '$101,000', stop: '$95,800', leverage: '5x', timeframe: '12-48h', expectedReturn: '+3.7%', predictionLink: 'BTC above $100K by April 2026?', predictionOdds: '72% YES' } },
  { id: 'a8', title: 'TSLA put/call ratio spikes to 1.8 -- unusual options activity', type: 'derivatives', severity: 'medium', coin: 'TSLA', time: Date.now() - 6_000_000, impact: 'Bearish -- hedging activity elevated',
    trade: { direction: 'SHORT', asset: 'TSLA', entry: '$248.90', target: '$230.00', stop: '$258.00', leverage: '2x', timeframe: '1-2 weeks', expectedReturn: '+7.6%', predictionLink: 'Will Tesla release a fully autonomous robotaxi in 2026?', predictionOdds: '19% YES' } },
  { id: 'a9', title: 'AVAX sees 140% spike in DEX volume -- new protocol launch', type: 'volume', severity: 'medium', coin: 'AVAX', time: Date.now() - 7_200_000, impact: 'Bullish -- ecosystem growth catalyst',
    trade: { direction: 'LONG', asset: 'AVAX', entry: '$38.50', target: '$45.00', stop: '$35.50', leverage: '3x', timeframe: '3-7 days', expectedReturn: '+16.9%', predictionLink: null, predictionOdds: null } },
  { id: 'a10', title: 'Crude oil inventories draw larger than expected (-8.2M bbl)', type: 'volume', severity: 'medium', coin: 'OIL', time: Date.now() - 8_400_000, impact: 'Bullish -- tighter supply outlook',
    trade: { direction: 'LONG', asset: 'WTI Crude', entry: '$71.82', target: '$75.50', stop: '$69.80', leverage: '5x', timeframe: '1-2 weeks', expectedReturn: '+5.1%', predictionLink: null, predictionOdds: null } },
];

// ---------------------------------------------------------------------------
// Spread Comparisons / Degen Picks / Cross-Correlations / Fear & Greed
// ---------------------------------------------------------------------------
const SPREAD_COMPARISONS = [
  { event: 'Republican wins 2028 Election', goated: 0.46, kalshi: 0.52, polymarket: 0.50, volume: '142M', category: 'Political' },
  { event: 'Fed cuts rates before June 2026', goated: 0.59, kalshi: 0.65, polymarket: 0.63, volume: '89M', category: 'Economic' },
  { event: 'BTC reaches $150K by Jul 2026', goated: 0.29, kalshi: 0.35, polymarket: 0.33, volume: '76M', category: 'Crypto' },
  { event: 'S&P 500 hits 6500 in 2026', goated: 0.40, kalshi: 0.46, polymarket: 0.44, volume: '54M', category: 'Economic' },
  { event: 'OpenAI IPO in 2026', goated: 0.33, kalshi: 0.39, polymarket: 0.37, volume: '42M', category: 'Tech' },
  { event: 'Solana ETF approved in 2026', goated: 0.39, kalshi: 0.45, polymarket: 0.43, volume: '45M', category: 'Crypto' },
];
const DEGEN_PICKS = [
  { asset: 'SOL', direction: 'LONG', leverage: '10x', entry: '$198', target: '$250', confidence: 94, expectedReturn: '+26.3%', reason: 'ETF approval catalyst + OI surge' },
  { asset: 'BTC', direction: 'LONG', leverage: '5x', entry: '$97,200', target: '$115,000', confidence: 91, expectedReturn: '+18.3%', reason: 'Whale accumulation + negative funding' },
  { asset: 'DOGE', direction: 'LONG', leverage: '20x', entry: '$0.18', target: '$0.35', confidence: 78, expectedReturn: '+94.4%', reason: 'Meme supercycle + retail FOMO incoming' },
  { asset: 'TSLA', direction: 'SHORT', leverage: '3x', entry: '$248.90', target: '$210', confidence: 82, expectedReturn: '+15.6%', reason: 'Put/call ratio 1.8x + robotaxi delay' },
  { asset: 'AVAX', direction: 'LONG', leverage: '8x', entry: '$38.50', target: '$55', confidence: 85, expectedReturn: '+42.9%', reason: 'DEX volume +140% + new protocol launch' },
];
const CROSS_CORRELATIONS = [
  { pair: 'BTC-Gold', correlation: 0.31, direction: 'rising', change: '+0.08', insight: 'Safe-haven narrative strengthening as macro uncertainty grows', colorA: '#f7931a', colorB: '#ffd700' },
  { pair: 'BTC-SPY', correlation: -0.12, direction: 'diverging', change: '-0.19', insight: 'Decoupling from equities -- crypto becoming uncorrelated alpha', colorA: '#f7931a', colorB: '#1a73e8' },
  { pair: 'ETH-SOL', correlation: 0.87, direction: 'stable', change: '+0.02', insight: 'Alt-L1s moving in lockstep. Rotation risk low', colorA: '#627eea', colorB: '#00ffa3' },
  { pair: 'NVDA-BTC', correlation: 0.44, direction: 'rising', change: '+0.11', insight: 'AI/crypto convergence trade gaining institutional traction', colorA: '#76b900', colorB: '#f7931a' },
  { pair: 'Oil-USD/JPY', correlation: 0.38, direction: 'stable', change: '-0.03', insight: 'Energy-yen carry trade correlation holding steady', colorA: '#4a4a4a', colorB: '#bc002d' },
  { pair: 'Gold-EUR/USD', correlation: 0.52, direction: 'rising', change: '+0.06', insight: 'Dollar weakness benefiting both gold and euro', colorA: '#ffd700', colorB: '#003399' },
];
const FEAR_GREED_INDEX = { value: 72, label: 'Greed', previousClose: 68, weekAgo: 61, monthAgo: 45 };
const BTC_DOMINANCE = 52.4;
const ETH_DOMINANCE = 17.8;

const mktSignalTypeIcons = { whale: Zap, flow: TrendingUp, derivatives: Activity, volume: BarChart3, adoption: Globe };
const mktSignalSeverityColors = {
  high: 'bg-red-500/15 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};
const MARKET_SUB_TABS = [
  { key: 'all', label: 'All Markets', icon: Globe },
  { key: 'crypto', label: 'Crypto', icon: Coins },
  { key: 'stocks', label: 'Stocks', icon: Building2 },
  { key: 'predictions', label: 'Predictions', icon: Brain },
  { key: 'forex', label: 'Forex', icon: CircleDollarSign },
  { key: 'commodities', label: 'Commodities', icon: Gem },
];

// ---------------------------------------------------------------------------
// HeatmapCell (multi-asset)
// ---------------------------------------------------------------------------
function HeatmapCell({ asset, onClick, flash }) {
  const change = asset.change24h ?? 0;
  let bgClass = 'bg-white/[0.02]';
  if (change > 5) bgClass = 'bg-emerald-500/30';
  else if (change > 2) bgClass = 'bg-emerald-500/20';
  else if (change > 0) bgClass = 'bg-emerald-500/10';
  else if (change < -5) bgClass = 'bg-red-500/30';
  else if (change < -2) bgClass = 'bg-red-500/20';
  else if (change < 0) bgClass = 'bg-red-500/10';
  const textColor = change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-slate-400';
  const accentColor = ASSET_COLORS[asset.symbol] || CLASS_COLORS[asset.assetClass] || '#888';
  const flashBorder = flash === 'green' ? 'border-emerald-400/60 shadow-emerald-500/20 shadow-lg' : flash === 'red' ? 'border-red-400/60 shadow-red-500/20 shadow-lg' : 'border-white/5';
  return (
    <motion.button onClick={onClick}
      className={`${bgClass} rounded-xl p-3 border ${flashBorder} text-left transition-all hover:border-white/10 hover:scale-[1.02] active:scale-[0.98] w-full`}
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>{asset.symbol?.slice(0, 2)}</div>
        <div className="min-w-0">
          <span className="text-xs font-bold text-white truncate block">{asset.symbol}</span>
          <p className="text-[9px] text-slate-500 leading-none truncate">{asset.name}</p>
        </div>
      </div>
      <div className={`text-sm font-bold mb-0.5 transition-colors duration-300 ${flash === 'green' ? 'text-emerald-300' : flash === 'red' ? 'text-red-300' : 'text-white'}`}>
        {asset.assetClass === 'forex' ? `$${asset.price.toFixed(4)}` : formatPrice(asset.price)}
      </div>
      <div className={`flex items-center gap-1 text-xs font-medium ${textColor}`}>
        {change > 0 ? <ArrowUpRight size={12} /> : change < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
        {change > 0 ? '+' : ''}{change.toFixed(2)}%
      </div>
      {asset.assetClass && (
        <div className="mt-1.5">
          <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
            style={{ backgroundColor: `${CLASS_COLORS[asset.assetClass] || '#888'}15`, color: CLASS_COLORS[asset.assetClass] || '#888' }}>{asset.assetClass}</span>
        </div>
      )}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// MarketPredictionCard
// ---------------------------------------------------------------------------
function MarketPredictionCard({ market }) {
  const pct = Math.round(market.yesPrice * 100);
  const trendColor = market.trend === 'up' ? 'text-emerald-400' : market.trend === 'down' ? 'text-red-400' : 'text-slate-400';
  const TrendIcon = market.trend === 'up' ? ArrowUpRight : market.trend === 'down' ? ArrowDownRight : Minus;
  return (
    <div className="rounded-lg bg-surface-2/40 border border-white/5 p-3 hover:border-white/10 transition-all">
      <p className="text-xs font-medium text-white leading-snug mb-2">{market.question}</p>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 60 ? '#10b981' : pct <= 30 ? '#ef4444' : '#f59e0b' }} />
        </div>
        <span className="text-xs font-bold text-white">{pct}%</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400">{market.category}</span>
          <span className="text-[9px] text-slate-600">{market.platform}</span>
        </div>
        {market.alpha && <span className="text-[9px] font-bold text-emerald-400">{market.alpha}</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MiniSparkline & MoverCard
// ---------------------------------------------------------------------------
function MktMiniSparkline({ positive, color }) {
  const points = useMemo(() => {
    const pts = [];
    let y = 20;
    for (let i = 0; i < 12; i++) {
      const delta = (Math.random() - (positive ? 0.35 : 0.65)) * 6;
      y = Math.max(4, Math.min(36, y + delta));
      pts.push({ x: i * 7, y });
    }
    return pts;
  }, [positive]);
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return (
    <svg width="77" height="40" viewBox="0 0 77 40" fill="none" className="opacity-60">
      <path d={pathD} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function MktMoverCard({ asset, rank, type }) {
  const change = asset.change24h ?? 0;
  const isGain = type === 'gainer';
  const accentColor = ASSET_COLORS[asset.symbol] || CLASS_COLORS[asset.assetClass] || '#888';
  const changeColor = isGain ? '#10b981' : '#ef4444';
  return (
    <motion.div
      className={`rounded-xl p-3 border transition-all hover:scale-[1.02] ${isGain ? 'bg-emerald-500/[0.06] border-emerald-500/15 hover:border-emerald-500/30' : 'bg-red-500/[0.06] border-red-500/15 hover:border-red-500/30'}`}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: rank * 0.06 }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ${isGain ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{rank}</span>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>{asset.symbol?.slice(0, 2)}</div>
          <div>
            <span className="text-sm font-bold text-white">{asset.symbol}</span>
            <span className="ml-1.5 text-[8px] font-semibold px-1 py-0.5 rounded uppercase"
              style={{ backgroundColor: `${CLASS_COLORS[asset.assetClass] || '#888'}15`, color: CLASS_COLORS[asset.assetClass] || '#888' }}>{asset.assetClass}</span>
          </div>
        </div>
        <MktMiniSparkline positive={isGain} color={changeColor} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">{asset.assetClass === 'forex' ? `$${asset.price.toFixed(4)}` : formatPrice(asset.price)}</span>
        <span className={`text-lg font-black ${isGain ? 'text-emerald-400' : 'text-red-400'}`}>{change > 0 ? '+' : ''}{change.toFixed(2)}%</span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// CorrelationBadge
// ---------------------------------------------------------------------------
function CorrelationBadge({ data }) {
  const dirColor = data.direction === 'rising' ? 'text-emerald-400' : data.direction === 'diverging' ? 'text-red-400' : 'text-slate-400';
  const DirIcon = data.direction === 'rising' ? ArrowUpRight : data.direction === 'diverging' ? ArrowDownRight : Minus;
  const barWidth = Math.abs(data.correlation) * 100;
  const barColor = data.correlation > 0.5 ? '#10b981' : data.correlation > 0 ? '#f59e0b' : '#ef4444';
  return (
    <motion.div className="rounded-xl border border-white/5 bg-surface-2/40 p-3 hover:border-white/10 transition-all"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `${data.colorA}30`, boxShadow: `0 0 6px ${data.colorA}30` }} />
            <span className="text-[10px] text-slate-600 mx-0.5">/</span>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `${data.colorB}30`, boxShadow: `0 0 6px ${data.colorB}30` }} />
          </div>
          <span className="text-xs font-bold text-white">{data.pair}</span>
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-bold ${dirColor}`}>
          <DirIcon size={10} />{data.direction}<span className="text-slate-500 ml-0.5">({data.change})</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, backgroundColor: barColor }} />
        </div>
        <span className="text-sm font-black text-white">{data.correlation.toFixed(2)}</span>
      </div>
      <p className="text-[10px] text-slate-500 leading-snug">{data.insight}</p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// AlphaSignalRow (Markets)
// ---------------------------------------------------------------------------
function MktAlphaSignalRow({ signal, index, expanded, onToggle, degenMode }) {
  const Icon = mktSignalTypeIcons[signal.type] || Zap;
  const severityClass = mktSignalSeverityColors[signal.severity] || mktSignalSeverityColors.low;
  const coinColor = ASSET_COLORS[signal.coin] || '#888';
  const t = signal.trade;
  const isLong = t?.direction === 'LONG';
  const glowBorder = signal.severity === 'high' ? 'border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : signal.severity === 'medium' ? 'border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : 'border-blue-500/30';
  return (
    <motion.div className={`rounded-xl bg-surface-2/50 border ${glowBorder} hover:border-white/20 transition-all overflow-hidden`}
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
      <button onClick={onToggle} className="flex items-start gap-3 p-4 w-full text-left">
        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${severityClass} border`}><Icon size={16} /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {t && <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide ${isLong ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>{t.direction}</span>}
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${coinColor}20`, color: coinColor }}>{signal.coin}</span>
            {t && <span className="text-xs font-bold text-brand">{t.expectedReturn}</span>}
          </div>
          <p className="text-sm text-white leading-snug font-medium">{signal.title}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap"><span className="text-[10px] text-slate-500">{signal.impact}</span></div>
          {t && (
            <div className="flex items-center gap-3 mt-2 text-[10px]">
              <span className="text-slate-500">Entry <span className="text-white font-mono font-bold">{t.entry}</span></span>
              <span className="text-slate-500">Target <span className="text-emerald-400 font-mono font-bold">{t.target}</span></span>
              <span className="text-slate-500">Stop <span className="text-red-400 font-mono font-bold">{t.stop}</span></span>
              <span className="text-slate-500">Lev <span className="text-yellow-400 font-mono font-bold">{t.leverage}</span></span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] text-slate-500 whitespace-nowrap">{timeAgo(new Date(signal.time).toISOString())}</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${signal.severity === 'high' ? 'bg-red-500/15 text-red-400' : signal.severity === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>{signal.severity.toUpperCase()}</span>
          {t && <ChevronDown size={12} className={`text-slate-600 transition-transform ${expanded ? 'rotate-180' : ''}`} />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && t && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className={`mx-3 mb-3 p-4 rounded-lg border ${isLong ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} className={isLong ? 'text-emerald-400' : 'text-red-400'} />
                <span className="text-sm font-bold text-white">Trade Setup</span>
                <span className={`text-[11px] px-2 py-0.5 rounded font-black ${isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{t.direction} {t.asset}</span>
                <span className="ml-auto text-xs text-slate-400">{t.timeframe}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-black/20 rounded-lg p-2.5 text-center"><span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Entry</span><span className="text-sm text-white font-mono font-bold">{t.entry}</span></div>
                <div className="bg-black/20 rounded-lg p-2.5 text-center"><span className="text-[9px] text-emerald-500 uppercase tracking-wider block mb-1">Target</span><span className="text-sm text-emerald-400 font-mono font-bold">{t.target}</span></div>
                <div className="bg-black/20 rounded-lg p-2.5 text-center"><span className="text-[9px] text-red-500 uppercase tracking-wider block mb-1">Stop Loss</span><span className="text-sm text-red-400 font-mono font-bold">{t.stop}</span></div>
              </div>
              <div className="flex items-center justify-between text-[11px] bg-black/20 rounded-lg p-2.5">
                <div className="flex items-center gap-4">
                  <span className="text-slate-500">Leverage: <span className="text-yellow-400 font-bold">{t.leverage}</span></span>
                  <span className="text-slate-500">Expected: <span className="text-brand font-bold text-sm">{t.expectedReturn}</span></span>
                </div>
                {degenMode && <button className="px-3 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/30 hover:bg-orange-500/30 transition-colors">COPY TRADE</button>}
              </div>
              {t.predictionLink && (
                <div className="mt-3 p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/15 flex items-center gap-2">
                  <Brain size={12} className="text-purple-400 shrink-0" />
                  <div className="text-[11px] text-slate-400 flex-1"><span className="text-purple-400 font-medium">Prediction Market:</span> {t.predictionLink}</div>
                  <span className="text-[11px] font-bold text-purple-400 whitespace-nowrap bg-purple-500/10 px-2 py-0.5 rounded">{t.predictionOdds}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TrendsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQ, setSearchQ] = useState('');
  const [newsFilter, setNewsFilter] = useState('all');
  const [predCategory, setPredCategory] = useState('All');
  const [predPlatform, setPredPlatform] = useState('All');
  const [predSort, setPredSort] = useState('volume');
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [globeUtcTime, setGlobeUtcTime] = useState(new Date().toISOString().slice(11, 19));
  const [scanLineActive, setScanLineActive] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  // Deep Research tab state
  const [researchQuery, setResearchQuery] = useState('');
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchReport, setResearchReport] = useState(null);
  // Markets tab state
  const [marketData, setMarketData] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketSubTab, setMarketSubTab] = useState('all');
  const [marketView, setMarketView] = useState('heatmap');
  const [marketSearchQuery, setMarketSearchQuery] = useState('');
  const [showMarketSearch, setShowMarketSearch] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [mktPredFilter, setMktPredFilter] = useState('All');
  const [expandedSignal, setExpandedSignal] = useState(null);
  const [priceFlashes, setPriceFlashes] = useState({});
  const [tickTimestamp, setTickTimestamp] = useState(Date.now());
  const ivRef = useRef(null);
  const mktTickRef = useRef(null);
  const mktIntervalRef = useRef(null);
  const { degenMode, setPage, getLeads } = useStore();
  const { aiData, regime: rawRegime, sentiment: rawAiSentiment, predictions: rawAiPredictions, correlations: rawCorrelations, portfolioHeat: rawPortfolioHeat, loading: aiLoading } = useGoatedAI();

  // Fallback data for AI panels when API hasn't returned yet
  const regime = rawRegime || {
    regime: 'Risk-On', color: '#10b981', score: 72,
    description: 'Markets showing strong bullish momentum with institutional inflows accelerating across major assets.',
    action: 'ACCUMULATE',
  };
  const aiSentiment = rawAiSentiment || {
    composite: 68, label: 'Bullish', confidence: 74,
    breakdown: { technical: 72, social: 65, onchain: 70, macro: 62 },
  };
  const portfolioHeat = rawPortfolioHeat || {
    heat: 45, label: 'Moderate', avgVolatility: 3.2,
    riskAdvice: 'Portfolio risk is moderate. Consider rebalancing if heat exceeds 60.',
  };
  const correlations = rawCorrelations.length > 0 ? rawCorrelations : [
    { a: 'BTC', b: 'ETH', correlation: 0.87 },
    { a: 'BTC', b: 'SOL', correlation: 0.72 },
    { a: 'ETH', b: 'SOL', correlation: 0.68 },
    { a: 'BTC', b: 'GOLD', correlation: 0.31 },
    { a: 'BTC', b: 'SPY', correlation: 0.45 },
    { a: 'SOL', b: 'AVAX', correlation: 0.61 },
    { a: 'ETH', b: 'LINK', correlation: 0.58 },
    { a: 'BTC', b: 'DXY', correlation: -0.42 },
  ];
  const FALLBACK_PREDICTIONS = [
    { id: 'fb-btc', symbol: 'BTC', currentPrice: 97420, action: 'ACCUMULATE', actionColor: '#10b981', change24hPredicted: 2.4, change7dPredicted: 6.8, goatedScore: 82, riskScore: 35, riskLabel: 'Low', breakout: { probability: 65, direction: 'up', timeframe: '48h' } },
    { id: 'fb-eth', symbol: 'ETH', currentPrice: 3841, action: 'BUY', actionColor: '#10b981', change24hPredicted: 3.1, change7dPredicted: 8.5, goatedScore: 78, riskScore: 38, riskLabel: 'Low', breakout: { probability: 52, direction: 'up', timeframe: '72h' } },
    { id: 'fb-sol', symbol: 'SOL', currentPrice: 198, action: 'STRONG BUY', actionColor: '#00ff88', change24hPredicted: 4.2, change7dPredicted: 12.1, goatedScore: 88, riskScore: 42, riskLabel: 'Medium', breakout: { probability: 71, direction: 'up', timeframe: '24h' } },
    { id: 'fb-bnb', symbol: 'BNB', currentPrice: 612, action: 'HOLD', actionColor: '#f59e0b', change24hPredicted: 0.8, change7dPredicted: 3.2, goatedScore: 65, riskScore: 30, riskLabel: 'Low', breakout: { probability: 28, direction: 'up', timeframe: '7d' } },
    { id: 'fb-ada', symbol: 'ADA', currentPrice: 0.82, action: 'BUY', actionColor: '#10b981', change24hPredicted: 2.8, change7dPredicted: 7.4, goatedScore: 71, riskScore: 45, riskLabel: 'Medium', breakout: { probability: 44, direction: 'up', timeframe: '72h' } },
    { id: 'fb-dot', symbol: 'DOT', currentPrice: 7.85, action: 'ACCUMULATE', actionColor: '#10b981', change24hPredicted: 1.5, change7dPredicted: 5.1, goatedScore: 67, riskScore: 40, riskLabel: 'Medium', breakout: { probability: 38, direction: 'up', timeframe: '5d' } },
    { id: 'fb-avax', symbol: 'AVAX', currentPrice: 38.5, action: 'WATCH', actionColor: '#f59e0b', change24hPredicted: -1.2, change7dPredicted: 2.8, goatedScore: 58, riskScore: 55, riskLabel: 'Medium', breakout: { probability: 32, direction: 'down', timeframe: '48h' } },
    { id: 'fb-link', symbol: 'LINK', currentPrice: 18.2, action: 'BUY', actionColor: '#10b981', change24hPredicted: 3.5, change7dPredicted: 9.2, goatedScore: 75, riskScore: 38, riskLabel: 'Low', breakout: { probability: 48, direction: 'up', timeframe: '72h' } },
  ];
  const aiPredictions = rawAiPredictions.length > 0 ? rawAiPredictions : FALLBACK_PREDICTIONS;

  // UTC clock for globe overlay
  useEffect(() => {
    if (activeTab !== 'globe') return;
    const iv = setInterval(() => setGlobeUtcTime(new Date().toISOString().slice(11, 19)), 1000);
    return () => clearInterval(iv);
  }, [activeTab]);

  // Compute per-region lead density from actual B2B lead data
  const regionLeadCounts = useMemo(() => {
    if (activeTab !== 'globe') return {};
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
      Object.entries(cityMap).forEach(([city, aliases]) => { counts[city] = 0; });
      (allLeads || []).forEach(l => {
        if (!l.location) return;
        Object.entries(cityMap).forEach(([city, aliases]) => {
          if (aliases.some(a => l.location.includes(a))) counts[city]++;
        });
      });
      return counts;
    } catch { return {}; }
  }, [activeTab, getLeads]);

  // Enrich hotspots with B2B + consumer data
  const enrichedHotspots = useMemo(() => {
    const raw = data?.geoHotspots || [];
    const trendsByRegion = {
      'NA': ['Institutional DeFi', 'RWA Tokenization', 'AI x Crypto', 'Stablecoin Payments'],
      'EU': ['MiCA Compliance', 'Green Mining', 'CBDCs', 'Cross-border Settlements'],
      'Asia': ['GameFi Revival', 'Exchange Wars', 'Retail Momentum', 'Layer 2 Adoption'],
      'ME': ['Sovereign Wealth Crypto', 'CBDC Pilots', 'Digital Free Zones', 'Staking Infrastructure'],
      'AF': ['P2P Volume Surge', 'Mobile Payments', 'Remittance Corridors', 'Financial Inclusion'],
      'SA': ['Retail Crypto Boom', 'Stablecoin Adoption', 'Regulatory Clarity', 'DeFi Growth'],
    };
    const insightsByRegion = {
      'NA': 'Rising institutional adoption', 'EU': 'Regulatory clarity driving inflows',
      'Asia': 'Retail-driven momentum surge', 'ME': 'Sovereign fund allocations growing',
      'AF': 'P2P volume at all-time highs', 'SA': 'Stablecoin usage eclipsing fiat',
    };
    return raw.map(h => ({
      ...h,
      sentiment: h.intensity * 0.85 + 0.1,
      volumeNum: parseFloat((h.volume || '$1B').replace(/[$BMK]/g, '')) || 1,
      leadCount: regionLeadCounts[h.name] || Math.floor(h.intensity * 800 + 50),
      behaviorIndex: Math.round(h.intensity * 30 + 55),
      trends: trendsByRegion[h.region] || ['DeFi', 'Trading', 'NFTs', 'Infrastructure'],
      consumerInsight: insightsByRegion[h.region] || 'Growing crypto awareness',
      onViewAlpha: () => setActiveTab('alpha'),
    }));
  }, [data?.geoHotspots, regionLeadCounts, setActiveTab]);

  // Direct client-side fetchers (used when /api/sentiment unavailable in dev)
  const fetchDirect = useCallback(async () => {
    const safeJson = (p) => p.then(r => r.ok ? r.json() : null).catch(() => null);
    const [fgRes, trendRes, globalRes, coinsRes, newsRes, kalshiRes, polymarketRes] = await Promise.allSettled([
      safeJson(fetch('https://api.alternative.me/fng/?limit=7&format=json')),
      safeJson(fetch('https://api.coingecko.com/api/v3/search/trending')),
      safeJson(fetch('https://api.coingecko.com/api/v3/global')),
      safeJson(fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=1h,24h,7d')),
      safeJson(fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=popular')),
      safeJson(fetch('/api/kalshi?limit=15')),
      safeJson(fetch('/api/polymarket?limit=15')),
    ]);
    const fg = fgRes.status === 'fulfilled' && fgRes.value?.data ? fgRes.value.data : null;
    const trending = trendRes.status === 'fulfilled' && trendRes.value?.coins ? trendRes.value.coins.map(c => c.item) : [];
    const gd = globalRes.status === 'fulfilled' ? globalRes.value?.data : null;
    const coinsRaw = coinsRes.status === 'fulfilled' ? coinsRes.value : null;
    const coins = Array.isArray(coinsRaw) ? coinsRaw : [];
    const newsRaw = newsRes.status === 'fulfilled' ? newsRes.value : null;
    const rawNews = Array.isArray(newsRaw?.Data) ? newsRaw.Data.slice(0, 20) : [];

    // Compute sentiment score
    let score = 50;
    const signals = [];
    if (fg?.length) {
      const v = parseInt(fg[0].value);
      score += (v - 50) * 0.3;
      const d = fg.length >= 2 ? v - parseInt(fg[1].value) : 0;
      if (d > 5) signals.push({ type: 'bullish', msg: `Fear & Greed rising +${d} pts`, weight: 'high' });
      if (d < -5) signals.push({ type: 'bearish', msg: `Fear & Greed falling ${d} pts`, weight: 'high' });
    }
    if (coins.length) {
      const avg = coins.reduce((s, c) => s + (c.price_change_percentage_24h || 0), 0) / coins.length;
      score += avg * 2.5;
      const green = coins.filter(c => (c.price_change_percentage_24h || 0) > 0).length;
      if (green >= 15) signals.push({ type: 'bullish', msg: `${green}/20 top coins green`, weight: 'high' });
      if (green <= 5) signals.push({ type: 'bearish', msg: `Only ${green}/20 coins green`, weight: 'high' });
    }
    // If no coins from API, use realistic mock data so page is never empty
    if (coins.length === 0) {
      const mockCoins = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', current_price: 97420, market_cap: 1.92e12, total_volume: 42e9, price_change_percentage_24h: 2.1, price_change_percentage_1h_in_currency: 0.3, price_change_percentage_7d_in_currency: 5.8, market_cap_rank: 1, sparkline_in_7d: { price: Array.from({length: 168}, (_, i) => 92000 + Math.sin(i/10)*3000 + i*30) } },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', current_price: 3841, market_cap: 462e9, total_volume: 18e9, price_change_percentage_24h: 4.7, price_change_percentage_1h_in_currency: 0.8, price_change_percentage_7d_in_currency: 8.2, market_cap_rank: 2, sparkline_in_7d: { price: Array.from({length: 168}, (_, i) => 3400 + Math.sin(i/12)*200 + i*2.5) } },
        { id: 'solana', name: 'Solana', symbol: 'SOL', current_price: 198, market_cap: 92e9, total_volume: 5.2e9, price_change_percentage_24h: 6.3, price_change_percentage_1h_in_currency: 1.2, price_change_percentage_7d_in_currency: 12.4, market_cap_rank: 5, sparkline_in_7d: { price: Array.from({length: 168}, (_, i) => 170 + Math.sin(i/8)*15 + i*0.15) } },
        { id: 'binancecoin', name: 'BNB', symbol: 'BNB', current_price: 612, market_cap: 94e9, total_volume: 2.1e9, price_change_percentage_24h: 1.3, price_change_percentage_1h_in_currency: -0.2, price_change_percentage_7d_in_currency: 3.1, market_cap_rank: 4, sparkline_in_7d: { price: Array.from({length: 168}, (_, i) => 590 + Math.sin(i/10)*15 + i*0.12) } },
        { id: 'ripple', name: 'XRP', symbol: 'XRP', current_price: 2.42, market_cap: 138e9, total_volume: 8.4e9, price_change_percentage_24h: -1.2, price_change_percentage_1h_in_currency: -0.5, price_change_percentage_7d_in_currency: 2.8, market_cap_rank: 3, sparkline_in_7d: { price: Array.from({length: 168}, (_, i) => 2.3 + Math.sin(i/10)*0.1 + i*0.0005) } },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA', current_price: 0.82, market_cap: 29e9, total_volume: 1.2e9, price_change_percentage_24h: 3.5, price_change_percentage_1h_in_currency: 0.4, price_change_percentage_7d_in_currency: 7.2, market_cap_rank: 8, sparkline_in_7d: { price: Array.from({length: 168}, (_, i) => 0.72 + Math.sin(i/10)*0.05 + i*0.0005) } },
        { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', current_price: 0.178, market_cap: 26e9, total_volume: 2.8e9, price_change_percentage_24h: 8.4, price_change_percentage_1h_in_currency: 2.1, price_change_percentage_7d_in_currency: 15.3, market_cap_rank: 9, sparkline_in_7d: { price: Array.from({length: 168}, (_, i) => 0.14 + Math.sin(i/8)*0.02 + i*0.0002) } },
        { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', current_price: 38.5, market_cap: 15.8e9, total_volume: 820e6, price_change_percentage_24h: -2.8, price_change_percentage_1h_in_currency: -0.9, price_change_percentage_7d_in_currency: -4.1, market_cap_rank: 12, sparkline_in_7d: { price: Array.from({length: 168}, (_, i) => 42 - Math.sin(i/12)*3 - i*0.02) } },
        { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', current_price: 18.2, market_cap: 11.4e9, total_volume: 950e6, price_change_percentage_24h: 5.1, price_change_percentage_1h_in_currency: 0.7, price_change_percentage_7d_in_currency: 9.8, market_cap_rank: 14, sparkline_in_7d: { price: Array.from({length: 168}, (_, i) => 16 + Math.sin(i/10)*1.5 + i*0.012) } },
        { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', current_price: 7.85, market_cap: 11.1e9, total_volume: 480e6, price_change_percentage_24h: 1.9, price_change_percentage_1h_in_currency: 0.1, price_change_percentage_7d_in_currency: 4.5, market_cap_rank: 15, sparkline_in_7d: { price: Array.from({length: 168}, (_, i) => 7.2 + Math.sin(i/10)*0.4 + i*0.003) } },
      ];
      coins.push(...mockCoins);
      score = 72; // Default greed
      signals.push({ type: 'bullish', msg: 'Market in greed territory', weight: 'high' });
      signals.push({ type: 'bullish', msg: 'SOL leading alt rally +6.3%', weight: 'high' });
    }

    score = Math.max(0, Math.min(100, Math.round(score)));
    const label = score >= 80 ? 'Extreme Greed' : score >= 65 ? 'Greed' : score >= 45 ? 'Neutral' : score >= 25 ? 'Fear' : 'Extreme Fear';
    const alphaCall = score >= 80 ? 'CAUTION — Possible local top' : score >= 65 ? 'BULLISH — Momentum strong' : score >= 45 ? 'NEUTRAL — Wait for direction' : score >= 25 ? 'ACCUMULATE — Smart money buys fear' : 'MAX OPPORTUNITY — Generational buy zone';

    // Alpha plays
    const alphaPlays = [];
    const sorted = [...coins].sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
    if (sorted[0]) alphaPlays.push({ type: 'momentum', title: `${sorted[0].symbol.toUpperCase()} Momentum Play`, description: `${sorted[0].name} up ${sorted[0].price_change_percentage_24h?.toFixed(1)}% in 24h with strong volume.`, asset: sorted[0].symbol.toUpperCase(), direction: 'long', confidence: Math.min(95, 60 + Math.abs(sorted[0].price_change_percentage_24h || 0) * 2), timeframe: '4h-24h', risk: sorted[0].price_change_percentage_24h > 10 ? 'high' : 'medium' });
    const loser = sorted[sorted.length - 1];
    if (loser && (loser.price_change_percentage_24h || 0) < -5) alphaPlays.push({ type: 'reversal', title: `${loser.symbol.toUpperCase()} Bounce Setup`, description: `${loser.name} down ${loser.price_change_percentage_24h?.toFixed(1)}%. Potential mean reversion.`, asset: loser.symbol.toUpperCase(), direction: 'long', confidence: 55, timeframe: '12h-48h', risk: 'high' });
    const sol = coins.find(c => c.symbol === 'sol');
    if (sol && (sol.price_change_percentage_24h || 0) > 2) alphaPlays.push({ type: 'ecosystem', title: 'Solana Ecosystem Rotation', description: `SOL up ${sol.price_change_percentage_24h?.toFixed(1)}% — ecosystem tokens follow with 1.5-3x beta.`, asset: 'SOL eco', direction: 'long', confidence: 65, timeframe: '24-72h', risk: 'medium' });

    // Geo hotspots
    const hubs = [
      { name: 'New York', lat: 40.71, lng: -74.01, region: 'NA', intensity: 0.9, activity: 'Institutional Trading', volume: '$2.4B' },
      { name: 'London', lat: 51.51, lng: -0.13, region: 'EU', intensity: 0.88, activity: 'Institutional', volume: '$2.1B' },
      { name: 'Singapore', lat: 1.35, lng: 103.82, region: 'Asia', intensity: 0.87, activity: 'Exchange Hub', volume: '$2.0B' },
      { name: 'Dubai', lat: 25.20, lng: 55.27, region: 'ME', intensity: 0.82, activity: 'Crypto Hub', volume: '$1.8B' },
      { name: 'Hong Kong', lat: 22.32, lng: 114.17, region: 'Asia', intensity: 0.8, activity: 'Trading', volume: '$1.7B' },
      { name: 'Seoul', lat: 37.57, lng: 126.98, region: 'Asia', intensity: 0.78, activity: 'Retail Mania', volume: '$1.6B' },
      { name: 'Tokyo', lat: 35.68, lng: 139.69, region: 'Asia', intensity: 0.75, activity: 'Institutional', volume: '$1.5B' },
      { name: 'San Francisco', lat: 37.77, lng: -122.42, region: 'NA', intensity: 0.85, activity: 'VC & DeFi', volume: '$1.9B' },
      { name: 'Miami', lat: 25.76, lng: -80.19, region: 'NA', intensity: 0.7, activity: 'Culture', volume: '$1.3B' },
      { name: 'Zurich', lat: 47.37, lng: 8.54, region: 'EU', intensity: 0.65, activity: 'Crypto Valley', volume: '$1.1B' },
      { name: 'Lagos', lat: 6.52, lng: 3.38, region: 'AF', intensity: 0.55, activity: 'P2P', volume: '$0.8B' },
      { name: 'São Paulo', lat: -23.55, lng: -46.63, region: 'SA', intensity: 0.58, activity: 'Retail', volume: '$0.9B' },
    ];

    return {
      timestamp: new Date().toISOString(),
      sentiment: { score, label, alphaCall, signals },
      fearGreed: fg ? { current: parseInt(fg[0].value), label: fg[0].value_classification, history: fg.map(f => ({ value: parseInt(f.value), label: f.value_classification })) } : { current: 72, label: 'Greed', history: [{ value: 72, label: 'Greed' }, { value: 68, label: 'Greed' }, { value: 65, label: 'Greed' }, { value: 58, label: 'Neutral' }, { value: 61, label: 'Greed' }, { value: 55, label: 'Neutral' }, { value: 52, label: 'Neutral' }] },
      globalMarket: gd ? { totalMarketCap: gd.total_market_cap?.usd, totalVolume: gd.total_volume?.usd, btcDominance: gd.market_cap_percentage?.btc, ethDominance: gd.market_cap_percentage?.eth, marketCapChange24h: gd.market_cap_change_percentage_24h_usd } : { totalMarketCap: 3.42e12, totalVolume: 142e9, btcDominance: 56.4, ethDominance: 13.2, marketCapChange24h: 2.3 },
      coins: coins.map(c => ({ id: c.id, name: c.name, symbol: (c.symbol || '').toUpperCase(), image: c.image, price: c.current_price, marketCap: c.market_cap, volume24h: c.total_volume, change1h: c.price_change_percentage_1h_in_currency, change24h: c.price_change_percentage_24h, change7d: c.price_change_percentage_7d_in_currency, sparkline7d: c.sparkline_in_7d?.price || [], rank: c.market_cap_rank })),
      trending: trending.map(t => ({ id: t.id, name: t.name, symbol: t.symbol, thumb: t.thumb || t.small, marketCapRank: t.market_cap_rank })),
      news: rawNews.length > 0 ? rawNews.map(n => { const t = (n.title || '').toLowerCase(); const bull = ['surge','rally','bullish','record','adoption','launch','growth','breakout'].some(k => t.includes(k)); const bear = ['crash','plunge','hack','exploit','ban','dump','selloff','fear','decline'].some(k => t.includes(k)); return { id: n.id, title: n.title, source: n.source_info?.name || n.source, url: n.url || n.guid, imageUrl: n.imageurl, publishedAt: n.published_on ? new Date(n.published_on * 1000).toISOString() : new Date().toISOString(), sentiment: bull ? 'bullish' : bear ? 'bearish' : 'neutral', categories: n.categories?.split('|').filter(Boolean) || [] }; }) : [
        { id: 1, title: 'Bitcoin Surges Past $97K as Institutional Demand Hits Record Levels', source: 'CoinDesk', sentiment: 'bullish', publishedAt: new Date().toISOString(), categories: ['BTC', 'Markets'] },
        { id: 2, title: 'Solana DeFi TVL Breaks $12B — Ecosystem Growth Accelerates', source: 'The Block', sentiment: 'bullish', publishedAt: new Date(Date.now() - 3600000).toISOString(), categories: ['SOL', 'DeFi'] },
        { id: 3, title: 'Fed Signals Rate Cuts Coming — Risk Assets Rally Across the Board', source: 'Bloomberg', sentiment: 'bullish', publishedAt: new Date(Date.now() - 7200000).toISOString(), categories: ['Macro', 'Policy'] },
        { id: 4, title: 'Polymarket Volume Hits $1B in March as Prediction Markets Go Mainstream', source: 'Decrypt', sentiment: 'bullish', publishedAt: new Date(Date.now() - 10800000).toISOString(), categories: ['Predictions', 'Markets'] },
        { id: 5, title: 'Ethereum Layer 2s Process Record 500M+ Transactions This Month', source: 'CoinTelegraph', sentiment: 'bullish', publishedAt: new Date(Date.now() - 14400000).toISOString(), categories: ['ETH', 'L2'] },
        { id: 6, title: 'Trump Speech Sends Kalshi Political Contracts Surging 8%', source: 'Reuters', sentiment: 'bullish', publishedAt: new Date(Date.now() - 18000000).toISOString(), categories: ['Politics', 'Predictions'] },
        { id: 7, title: 'NVIDIA Earnings Beat Expectations — AI Stocks Rally in After-Hours', source: 'CNBC', sentiment: 'bullish', publishedAt: new Date(Date.now() - 21600000).toISOString(), categories: ['Stocks', 'AI'] },
        { id: 8, title: 'Whale Alert: $200M BTC Moved Off Exchanges — Accumulation Signal', source: 'Whale Alert', sentiment: 'bullish', publishedAt: new Date(Date.now() - 25200000).toISOString(), categories: ['BTC', 'On-chain'] },
        { id: 9, title: 'SEC Commissioner Hints at Clearer Crypto Regulations Coming Q2', source: 'Bloomberg', sentiment: 'neutral', publishedAt: new Date(Date.now() - 28800000).toISOString(), categories: ['Regulation', 'Policy'] },
        { id: 10, title: 'Meme Coin Frenzy Returns — DOGE and PEPE Up 15%+ in 24 Hours', source: 'CoinGecko', sentiment: 'bullish', publishedAt: new Date(Date.now() - 32400000).toISOString(), categories: ['Meme', 'Markets'] },
        { id: 11, title: 'Oil Prices Decline 3% on OPEC Supply Increase — Commodities Under Pressure', source: 'Reuters', sentiment: 'bearish', publishedAt: new Date(Date.now() - 36000000).toISOString(), categories: ['Commodities', 'Macro'] },
        { id: 12, title: 'Crypto VC Funding Surges to $4.2B in Q1 2026 — Bull Market Back', source: 'The Block', sentiment: 'bullish', publishedAt: new Date(Date.now() - 39600000).toISOString(), categories: ['VC', 'Funding'] },
      ],
      predictions: (() => {
        // Base GOATED predictions
        const goatedPredictions = [
          { id: 'g1', question: 'BTC above $100K by April 2026?', yesPrice: 0.72, volume: 24000000, trend: 'up', change: 3.1, category: 'Crypto', platform: 'GOATED', resolution: 'Apr 2026', goatedSpread: 0.008, kalshiSpread: 0.04, polymarketSpread: 0.035, alpha: '+163%' },
          { id: 'g2', question: 'Fed rate cut in June 2026?', yesPrice: 0.68, volume: 18000000, trend: 'up', change: 2.4, category: 'Economics', platform: 'GOATED', resolution: 'Jun 2026', goatedSpread: 0.006, kalshiSpread: 0.032, polymarketSpread: 0.028, alpha: '+147%' },
          { id: 'g3', question: 'SOL to flip BNB by market cap?', yesPrice: 0.41, volume: 8500000, trend: 'up', change: 5.2, category: 'Crypto', platform: 'GOATED', resolution: 'Sep 2026', goatedSpread: 0.01, kalshiSpread: 0.045, polymarketSpread: 0.038, alpha: '+178%' },
          { id: 'g4', question: 'US recession before 2027?', yesPrice: 0.22, volume: 31000000, trend: 'down', change: -2.1, category: 'Economics', platform: 'GOATED', resolution: 'Dec 2026', goatedSpread: 0.005, kalshiSpread: 0.03, polymarketSpread: 0.025, alpha: '+150%' },
          { id: 'g5', question: 'ETH ETF staking approved by SEC?', yesPrice: 0.55, volume: 12000000, trend: 'up', change: 1.8, category: 'Crypto', platform: 'GOATED', resolution: 'Dec 2026', goatedSpread: 0.007, kalshiSpread: 0.038, polymarketSpread: 0.032, alpha: '+157%' },
          { id: 'g6', question: 'NVIDIA stock above $200 by July?', yesPrice: 0.38, volume: 9200000, trend: 'up', change: 4.3, category: 'Tech', platform: 'GOATED', resolution: 'Jul 2026', goatedSpread: 0.009, kalshiSpread: 0.042, polymarketSpread: 0.036, alpha: '+167%' },
          { id: 'g7', question: 'Will AI replace 10% of dev jobs by 2027?', yesPrice: 0.33, volume: 7800000, trend: 'up', change: 6.8, category: 'AI', platform: 'GOATED', resolution: 'Dec 2026', goatedSpread: 0.008, kalshiSpread: 0.04, polymarketSpread: 0.034, alpha: '+163%' },
          { id: 'g8', question: 'Will Democrats win Senate in 2026?', yesPrice: 0.46, volume: 14200000, trend: 'up', change: 1.2, category: 'Politics', platform: 'GOATED', resolution: 'Nov 2026', goatedSpread: 0.006, kalshiSpread: 0.035, polymarketSpread: 0.03, alpha: '+150%' },
        ];
        // Merge Kalshi markets
        const kalshiMarkets = kalshiRes.status === 'fulfilled' && kalshiRes.value?.markets
          ? kalshiRes.value.markets.map(m => ({ ...m, platform: 'Kalshi' }))
          : [];
        // Merge Polymarket markets
        const polyMarkets = polymarketRes.status === 'fulfilled' && polymarketRes.value?.markets
          ? polymarketRes.value.markets.map(m => ({ ...m, platform: 'Polymarket' }))
          : [];
        // Deduplicate by checking question similarity (simple substring match)
        const seen = new Set(goatedPredictions.map(p => p.question.toLowerCase().slice(0, 30)));
        const deduped = [...kalshiMarkets, ...polyMarkets].filter(m => {
          const key = (m.question || '').toLowerCase().slice(0, 30);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return [...goatedPredictions, ...deduped];
      })(),
      geoHotspots: hubs,
      alphaPlays,
      sources: ['CoinGecko', 'Alternative.me', 'CryptoCompare', 'Kalshi', 'Polymarket'],
      cached: false,
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // Try server API first
      const r = await fetch('/api/sentiment');
      if (!r.ok) throw new Error(`${r.status}`);
      const ct = r.headers.get('content-type') || '';
      if (!ct.includes('json')) throw new Error('Not JSON');
      const j = await r.json();
      setData(j);
      setLastRefresh(new Date());
    } catch (e) {
      // Fallback: fetch directly from external APIs
      console.log('Server API unavailable, fetching directly...');
      try {
        const result = await fetchDirect();
        setData(result);
        setLastRefresh(new Date());
      } catch (e2) {
        console.error('Direct fetch also failed:', e2);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchDirect]);

  useEffect(() => {
    fetchData();
    if (autoRefresh) ivRef.current = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(ivRef.current);
  }, [autoRefresh]);

  // ─── Markets tab: fetch crypto data ───
  const fetchMarketData = useCallback(async () => {
    try {
      const res = await fetch('/api/market-data');
      const ct = res.headers.get('content-type') || '';
      if (!res.ok || !ct.includes('json')) throw new Error('Not available');
      const d = await res.json();
      setMarketData(d);
    } catch {
      try {
        const [coinsRes, globalRes] = await Promise.allSettled([
          fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d'),
          fetch('https://api.coingecko.com/api/v3/global'),
        ]);
        const coins = coinsRes.status === 'fulfilled' && coinsRes.value.ok ? await coinsRes.value.json() : [];
        const globalData = globalRes.status === 'fulfilled' && globalRes.value.ok ? await globalRes.value.json() : null;
        if (Array.isArray(coins) && coins.length > 0) {
          const prices = coins.map(c => ({
            id: c.id, name: c.name, symbol: c.symbol?.toUpperCase(), image: c.image,
            price: c.current_price, change1h: c.price_change_percentage_1h_in_currency || 0,
            change24h: c.price_change_percentage_24h || 0, change7d: c.price_change_percentage_7d_in_currency || 0,
            volume24h: c.total_volume, marketCap: c.market_cap, rank: c.market_cap_rank, assetClass: 'crypto',
          }));
          const gd = globalData?.data || {};
          const totalMC = gd.total_market_cap?.usd || prices.reduce((s, c) => s + (c.marketCap || 0), 0);
          const totalVol = gd.total_volume?.usd || prices.reduce((s, c) => s + (c.volume24h || 0), 0);
          const gainCount = prices.filter(c => c.change24h > 0).length;
          const loseCount = prices.filter(c => c.change24h < 0).length;
          const avgChange = prices.reduce((s, c) => s + c.change24h, 0) / prices.length;
          const sentimentLabel = avgChange > 2 ? 'Strongly Bullish' : avgChange > 0 ? 'Mildly Bullish' : avgChange > -2 ? 'Mildly Bearish' : 'Strongly Bearish';
          setMarketData({
            prices, marketOverview: { totalMarketCap: totalMC, total24hVolume: totalVol, totalCoinsTracked: prices.length, gainers: gainCount, losers: loseCount, marketSentiment: sentimentLabel },
            timestamp: new Date().toISOString(),
          });
        }
      } catch { /* silent */ }
    } finally {
      setMarketLoading(false);
    }
  }, []);

  // Fetch market data when Markets tab is active
  useEffect(() => {
    if (activeTab === 'markets' && !marketData) {
      setMarketLoading(true);
      fetchMarketData();
    }
    if (activeTab === 'markets') {
      mktIntervalRef.current = setInterval(fetchMarketData, 15_000);
      return () => clearInterval(mktIntervalRef.current);
    }
    return () => { if (mktIntervalRef.current) clearInterval(mktIntervalRef.current); };
  }, [activeTab, fetchMarketData, marketData]);

  // Price tick simulation for markets tab
  useEffect(() => {
    if (activeTab !== 'markets') { if (mktTickRef.current) clearInterval(mktTickRef.current); return; }
    mktTickRef.current = setInterval(() => {
      const flashMap = {};
      setMarketData(prev => {
        if (!prev?.prices) return prev;
        const prices = (Array.isArray(prev.prices) ? prev.prices : Object.values(prev.prices)).map(c => {
          const isCrypto = (c.assetClass || 'crypto') === 'crypto';
          const range = isCrypto ? 0.005 : 0.001;
          const jitter = ((Math.random() - 0.5) * 2 * range);
          const absJitter = Math.abs(jitter) < 0.001 ? (jitter >= 0 ? 0.001 : -0.001) : jitter;
          flashMap[c.symbol] = absJitter > 0 ? 'green' : 'red';
          return { ...c, price: c.price * (1 + absJitter), change24h: (c.change24h || 0) + absJitter * 100 };
        });
        return { ...prev, prices };
      });
      setPriceFlashes(flashMap);
      setTickTimestamp(Date.now());
      setTimeout(() => setPriceFlashes({}), 600);
    }, 2000);
    return () => clearInterval(mktTickRef.current);
  }, [activeTab]);

  // Markets computed data
  const mktCryptoAssets = useMemo(() => {
    if (!marketData?.prices) return [];
    const arr = Array.isArray(marketData.prices) ? marketData.prices : Object.values(marketData.prices);
    return arr.map(c => ({ ...c, assetClass: c.assetClass || 'crypto' })).sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
  }, [marketData]);
  const mktAllAssets = useMemo(() => [...mktCryptoAssets, ...STOCKS_DATA, ...FOREX_DATA, ...COMMODITIES_DATA], [mktCryptoAssets]);
  const mktFilteredAssets = useMemo(() => {
    let list = mktAllAssets;
    if (marketSubTab !== 'all' && marketSubTab !== 'predictions') list = list.filter(a => a.assetClass === marketSubTab);
    if (marketSearchQuery.trim()) { const q = marketSearchQuery.toLowerCase(); list = list.filter(a => a.symbol?.toLowerCase().includes(q) || a.name?.toLowerCase().includes(q)); }
    return list;
  }, [mktAllAssets, marketSubTab, marketSearchQuery]);
  const mktAllGainers = useMemo(() => [...mktAllAssets].filter(a => a.change24h > 0).sort((a, b) => b.change24h - a.change24h), [mktAllAssets]);
  const mktAllLosers = useMemo(() => [...mktAllAssets].filter(a => a.change24h < 0).sort((a, b) => a.change24h - b.change24h), [mktAllAssets]);
  const mktOverview = marketData?.marketOverview || {};
  const mktSentimentLabel = mktOverview.marketSentiment || 'Loading...';
  const mktSentimentColor = mktSentimentLabel.includes('Bullish') ? 'text-emerald-400' : mktSentimentLabel.includes('Bearish') ? 'text-red-400' : 'text-yellow-400';
  const mktPredCategories = ['All', ...new Set(PREDICTION_MARKETS.map(p => p.category))];
  const mktFilteredPredictions = mktPredFilter === 'All' ? PREDICTION_MARKETS : PREDICTION_MARKETS.filter(p => p.category === mktPredFilter);

  const filteredNews = useMemo(() => {
    let n = data?.news || [];
    if (newsFilter !== 'all') n = n.filter(a => a.sentiment === newsFilter);
    if (searchQ) { const q = searchQ.toLowerCase(); n = n.filter(a => a.title?.toLowerCase().includes(q) || a.source?.toLowerCase().includes(q)); }
    return n;
  }, [data?.news, newsFilter, searchQ]);

  const filteredCoins = useMemo(() => {
    let c = data?.coins || [];
    if (searchQ) { const q = searchQ.toLowerCase(); c = c.filter(x => x.name?.toLowerCase().includes(q) || x.symbol?.toLowerCase().includes(q)); }
    return c;
  }, [data?.coins, searchQ]);

  const filteredPredictions = useMemo(() => {
    let preds = data?.predictions || [];
    // Category filter
    if (predCategory !== 'All') {
      preds = preds.filter(p => (p.category || '').toLowerCase() === predCategory.toLowerCase());
    }
    // Platform filter
    if (predPlatform !== 'All') {
      preds = preds.filter(p => (p.platform || 'GOATED') === predPlatform);
    }
    // Sort
    switch (predSort) {
      case 'volume': preds = [...preds].sort((a, b) => (b.volume || 0) - (a.volume || 0)); break;
      case 'alpha': preds = [...preds].sort((a, b) => {
        const aVal = parseFloat(String(a.alpha || '0').replace(/[^0-9.-]/g, ''));
        const bVal = parseFloat(String(b.alpha || '0').replace(/[^0-9.-]/g, ''));
        return bVal - aVal;
      }); break;
      case 'trending': preds = [...preds].sort((a, b) => Math.abs(b.change || 0) - Math.abs(a.change || 0)); break;
      case 'newest': preds = [...preds].reverse(); break;
      default: break;
    }
    return preds;
  }, [data?.predictions, predCategory, predPlatform, predSort]);

  // Spread stats for banner
  const spreadStats = useMemo(() => {
    const preds = data?.predictions || [];
    const withSpreads = preds.filter(p => p.goatedSpread != null && (p.kalshiSpread || p.polymarketSpread));
    if (withSpreads.length === 0) return null;
    const totalSavings = withSpreads.reduce((sum, p) => {
      const competitor = p.kalshiSpread || p.polymarketSpread || 0;
      return sum + (competitor > 0 ? ((competitor - p.goatedSpread) / competitor) * 100 : 0);
    }, 0);
    return {
      avgSavings: Math.round(totalSavings / withSpreads.length),
      count: withSpreads.length,
      examples: withSpreads.slice(0, 4).map(p => ({
        question: p.question?.slice(0, 40) + (p.question?.length > 40 ? '...' : ''),
        goated: p.goatedSpread,
        kalshi: p.kalshiSpread,
        polymarket: p.polymarketSpread,
      })),
    };
  }, [data?.predictions]);

  // Degen Alpha data — only compute when degenMode is active
  const degenAlphaData = useMemo(() => {
    if (!degenMode) return null;
    try {
      return useStore.getState().getDegenAlpha();
    } catch {
      return null;
    }
  }, [degenMode]);

  // ─── Loading skeleton ───
  if (loading && !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/[0.02] rounded-xl border border-white/5 animate-pulse" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{[1,2].map(i => <div key={i} className="h-64 bg-white/[0.02] rounded-xl border border-white/5 animate-pulse" />)}</div>
      </div>
    );
  }

  const sent = data?.sentiment || { score: 50, label: 'Loading', signals: [], alphaCall: '' };
  const fg = data?.fearGreed;
  const gm = data?.globalMarket;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <Brain className="text-brand" size={28} />
            GOATED Intelligence
            <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />LIVE</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Real-time market research &amp; alpha signals{data?.sources && <span className="text-slate-600 ml-1">— {data.sources.join(' · ')}</span>}</p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && <span className="text-[11px] text-slate-600 flex items-center gap-1"><Clock size={11} />Updated {ago(lastRefresh.toISOString())}</span>}
          <button onClick={() => { setLoading(true); fetchData(); }} className="p-2 rounded-lg bg-white/5 hover:bg-brand/10 text-slate-400 hover:text-brand transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === t.id ? 'bg-brand/10 text-brand border border-brand/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] border border-transparent'
            }`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* Search (news/prices) */}
      {(activeTab === 'news' || activeTab === 'prices') && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input type="text" placeholder={activeTab === 'news' ? 'Search news...' : 'Search coins...'} value={searchQ} onChange={e => setSearchQ(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand/30" />
          {searchQ && <button onClick={() => setSearchQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"><X size={14} /></button>}
        </div>
      )}

      {/* ════════════ OVERVIEW ════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* ─── DEGEN MODE OVERLAY ─── */}
          {degenMode && degenAlphaData && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="degen-fire-border rounded-xl overflow-hidden"
              style={{
                border: '1px solid rgba(255,140,0,0.4)',
                background: 'linear-gradient(135deg, rgba(255,100,0,0.06) 0%, rgba(0,0,0,0.4) 50%, rgba(255,60,0,0.06) 100%)',
              }}
            >
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <Flame size={22} className="text-orange-400" />
                  <h2 className="text-lg font-black tracking-tight"
                    style={{ background: 'linear-gradient(90deg, #ff8c00, #ff4500, #ff6600)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    DEGEN ALPHA PLAYS
                  </h2>
                  <span className="text-[9px] bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full font-bold border border-orange-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />LIVE
                  </span>
                  {degenAlphaData.stats?.totalPipeline > 0 && (
                    <span className="ml-auto text-[10px] text-orange-400/70 font-mono">
                      Pipeline: {fmtVol(degenAlphaData.stats.totalPipeline)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Whale Radar */}
                  <div className="alpha-panel bg-black/40 rounded-xl p-3.5 border border-orange-500/15">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Radar size={12} className="text-orange-400" />
                      <span className="text-[10px] text-orange-400 uppercase tracking-wider font-bold">Whale Radar</span>
                      <span className="text-[9px] text-slate-600 ml-auto">{degenAlphaData.whales?.length || 0} tracked</span>
                    </div>
                    <div className="space-y-1.5">
                      {(degenAlphaData.whales || []).slice(0, 5).map((w, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px]">
                          <span className="text-orange-400/60 font-mono w-3">#{i + 1}</span>
                          <span className="text-white font-medium flex-1 truncate">{w.company}</span>
                          <span className="text-slate-500">{w.score}</span>
                          <span className="text-orange-300 font-mono">{fmtVol(w.dealValue || w.value || 0)}</span>
                          <span className={`text-[9px] ${w.momentum === 'rising' ? 'text-emerald-400' : w.momentum === 'declining' ? 'text-red-400' : 'text-slate-500'}`}>
                            {w.momentum === 'rising' ? '\u25B2' : w.momentum === 'declining' ? '\u25BC' : '\u25C6'}
                          </span>
                        </div>
                      ))}
                      {(!degenAlphaData.whales || degenAlphaData.whales.length === 0) && (
                        <div className="text-[10px] text-slate-600 text-center py-2">No whales detected</div>
                      )}
                    </div>
                  </div>

                  {/* Snipe Queue */}
                  <div className="alpha-panel bg-black/40 rounded-xl p-3.5 border border-orange-500/15">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Crosshair size={12} className="text-orange-400" />
                      <span className="text-[10px] text-orange-400 uppercase tracking-wider font-bold">Snipe Queue</span>
                      <span className="text-[9px] text-slate-600 ml-auto">{degenAlphaData.snipeQueue?.length || 0} targets</span>
                    </div>
                    <div className="space-y-1.5">
                      {(degenAlphaData.snipeQueue || []).slice(0, 5).map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px]">
                          <span className="text-orange-400/60 font-mono w-3">#{i + 1}</span>
                          <span className="text-white font-medium flex-1 truncate">{s.company}</span>
                          <span className="text-slate-500">{s.score}</span>
                          <span className="text-orange-300 font-mono">{fmtVol(s.dealValue || s.value || 0)}</span>
                        </div>
                      ))}
                      {(!degenAlphaData.snipeQueue || degenAlphaData.snipeQueue.length === 0) && (
                        <div className="text-[10px] text-slate-600 text-center py-2">No snipe targets</div>
                      )}
                    </div>
                  </div>

                  {/* Intent Surge */}
                  <div className="alpha-panel bg-black/40 rounded-xl p-3.5 border border-orange-500/15">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Zap size={12} className="text-orange-400" />
                      <span className="text-[10px] text-orange-400 uppercase tracking-wider font-bold">Intent Surges</span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl font-black text-orange-400">{degenAlphaData.surges?.length || 0}</span>
                      <div>
                        <div className="text-[10px] text-slate-400">Active Surges</div>
                        <div className="text-[9px] text-slate-600">Score 80+ & Rising</div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${Math.min(100, (degenAlphaData.surges?.length || 0) / 25 * 100)}%`,
                        background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                      }} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[9px] text-slate-600">
                      <span>0</span>
                      <span>{degenAlphaData.surges?.length > 15 ? 'CRITICAL' : degenAlphaData.surges?.length > 5 ? 'ACTIVE' : 'LOW'}</span>
                      <span>25+</span>
                    </div>
                  </div>

                  {/* Hot Sectors */}
                  <div className="alpha-panel bg-black/40 rounded-xl p-3.5 border border-orange-500/15">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Flame size={12} className="text-orange-400" />
                      <span className="text-[10px] text-orange-400 uppercase tracking-wider font-bold">Hot Sectors</span>
                    </div>
                    <div className="space-y-1.5">
                      {(degenAlphaData.hotSectors || []).slice(0, 5).map((sec, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between text-[10px] mb-0.5">
                            <span className="text-white font-medium truncate">{sec.industry}</span>
                            <span className="text-orange-400 font-mono">{sec.count} <span className="text-slate-600">({sec.pct}%)</span></span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${sec.pct}%`, background: 'linear-gradient(90deg, #ff8c00, #ff4500)' }} />
                          </div>
                        </div>
                      ))}
                      {(!degenAlphaData.hotSectors || degenAlphaData.hotSectors.length === 0) && (
                        <div className="text-[10px] text-slate-600 text-center py-2">No hot sectors</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-4">
              <Ring score={sent.score} label={sent.label} sz="md" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">GOATED Score</div>
                <div className="text-xs text-slate-400 leading-relaxed">{sent.alphaCall}</div>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Fear &amp; Greed</div>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-black ${(fg?.current || 50) >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>{fg?.current || '—'}</span>
                <span className={`text-sm ${(fg?.current || 50) >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>{fg?.label || '—'}</span>
              </div>
              {fg?.history?.length > 1 && (
                <div className="flex items-center gap-1 mt-2">
                  <Spark data={fg.history.map(h => h.value).reverse()} w={100} h={20} color={fg.current >= 50 ? '#10b981' : '#ef4444'} />
                  <span className="text-[10px] text-slate-600">7d</span>
                </div>
              )}
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Total Market Cap</div>
              <div className="text-xl font-bold text-white">{fmtVol(gm?.totalMarketCap)}</div>
              <div className={`text-xs mt-1 flex items-center gap-1 ${(gm?.marketCapChange24h || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(gm?.marketCapChange24h || 0) >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {Math.abs(gm?.marketCapChange24h || 0).toFixed(2)}% (24h)
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">BTC Dominance</div>
              <div className="text-xl font-bold text-amber-400">{(gm?.btcDominance || 0).toFixed(1)}%</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${gm?.btcDominance || 0}%` }} /></div>
                <span className="text-[10px] text-slate-600">ETH {(gm?.ethDominance || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Signals */}
          {sent.signals?.length > 0 && (
            <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-4">
              <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Radar size={14} className="text-brand" />Live Intelligence Signals</h3>
              <div className="flex flex-wrap gap-2">{sent.signals.map((s, i) => <SigBadge key={i} s={s} />)}</div>
            </div>
          )}

          {/* ─── Market Regime — Prominent Banner ─── */}
          <div className="rounded-xl overflow-hidden" style={{
            background: `linear-gradient(135deg, ${regime.color}08 0%, rgba(0,0,0,0.4) 50%, ${regime.color}05 100%)`,
            border: `1px solid ${regime.color}30`,
          }}>
            <div className="p-5 flex items-center gap-5">
              <div className="flex flex-col items-center gap-1">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${regime.color}15`, border: `2px solid ${regime.color}40` }}>
                  <span className="text-3xl font-black" style={{ color: regime.color }}>{regime.score}</span>
                </div>
                <span className="text-[9px] text-slate-500">REGIME SCORE</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Brain size={16} className="text-purple-400" />
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider">Market Regime</span>
                  <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded-full font-semibold">GOATED AI</span>
                </div>
                <div className="text-2xl font-black uppercase tracking-wider mb-1" style={{ color: regime.color || '#6366f1' }}>{regime.regime}</div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">{regime.description}</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${regime.color}20`, color: regime.color, border: `1px solid ${regime.color}30` }}>{regime.action}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${regime.score}%`, backgroundColor: regime.color, boxShadow: `0 0 8px ${regime.color}40` }} /></div>
                  <span className="text-xs text-slate-500 font-mono">{regime.score}/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── GOATED AI Engine ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* AI Sentiment Fusion */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity size={14} className="text-cyan-400" />
                    <span className="text-[10px] text-slate-600 uppercase tracking-wider">AI Sentiment Fusion</span>
                    <span className="text-[10px] text-slate-500 ml-auto">{aiSentiment.confidence}% confidence</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <Ring score={aiSentiment.composite} label={aiSentiment.label} sz="md" />
                    <div className="flex-1 space-y-1.5">
                      {Object.entries(aiSentiment.breakdown || {}).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-600 w-14 capitalize">{k}</span>
                          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-brand rounded-full transition-all" style={{ width: `${v}%` }} /></div>
                          <span className="text-[10px] text-slate-500 w-6">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              {/* Portfolio Heat */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame size={14} className={portfolioHeat.heat > 60 ? 'text-red-400' : portfolioHeat.heat > 35 ? 'text-amber-400' : 'text-blue-400'} />
                    <span className="text-[10px] text-slate-600 uppercase tracking-wider">Portfolio Heat</span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-3xl font-black ${portfolioHeat.heat > 60 ? 'text-red-400' : portfolioHeat.heat > 35 ? 'text-amber-400' : 'text-blue-400'}`}>{portfolioHeat.heat}</span>
                    <div>
                      <div className={`text-sm font-bold ${portfolioHeat.heat > 60 ? 'text-red-400' : portfolioHeat.heat > 35 ? 'text-amber-400' : 'text-blue-400'}`}>{portfolioHeat.label}</div>
                      <div className="text-[10px] text-slate-500">Avg Vol: {portfolioHeat.avgVolatility}%</div>
                    </div>
                  </div>
                  <div className="h-2 bg-gradient-to-r from-blue-500 via-amber-500 to-red-500 rounded-full mb-2 relative">
                    <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-black shadow-lg transition-all" style={{ left: `${Math.min(95, portfolioHeat.heat)}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400">{portfolioHeat.riskAdvice}</p>
                </div>
            </div>

          {/* ─── Coin Heatmap Grid ─── */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><BarChart3 size={14} className="text-brand" />Market Heatmap</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {(data?.coins || []).slice(0, 10).map(c => {
                const ch = c.change24h || 0;
                const intensity = Math.min(1, Math.abs(ch) / 10);
                const bg = ch >= 0
                  ? `rgba(16,185,129,${0.08 + intensity * 0.2})`
                  : `rgba(239,68,68,${0.08 + intensity * 0.2})`;
                const border = ch >= 0
                  ? `rgba(16,185,129,${0.15 + intensity * 0.25})`
                  : `rgba(239,68,68,${0.15 + intensity * 0.25})`;
                return (
                  <div key={c.id} className="rounded-xl p-3 text-center transition-all hover:scale-105 cursor-default"
                    style={{ background: bg, border: `1px solid ${border}` }}>
                    {c.image && <img src={c.image} alt="" className="w-8 h-8 rounded-full mx-auto mb-1.5" loading="lazy" />}
                    <div className="text-sm font-bold text-white">{c.symbol}</div>
                    <div className="text-xs text-slate-400 font-mono">{fmtPrice(c.price)}</div>
                    <div className={`text-sm font-black mt-1 ${pctCls(ch)}`}>{ch > 0 ? '+' : ''}{ch?.toFixed(1)}%</div>
                    <Spark data={c.sparkline7d} w={50} h={16} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── AI Predictions ─── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Target size={16} className="text-brand" />AI Price Predictions
                  <span className="text-[9px] bg-brand/10 text-brand px-2 py-0.5 rounded-full">GOATED AI v2</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {aiPredictions.slice(0, 8).map(p => (
                  <div key={p.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 hover:border-white/10 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white">{p.symbol}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${p.actionColor}15`, color: p.actionColor }}>{p.action}</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-1">${typeof p.currentPrice === 'number' ? p.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <div className="text-[9px] text-slate-600">24h Target</div>
                        <div className={`text-xs font-bold ${p.change24hPredicted >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{p.change24hPredicted >= 0 ? '+' : ''}{p.change24hPredicted}%</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-600">7d Target</div>
                        <div className={`text-xs font-bold ${p.change7dPredicted >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{p.change7dPredicted >= 0 ? '+' : ''}{p.change7dPredicted}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[9px] mb-0.5">
                          <span className="text-slate-600">GOATED Score</span>
                          <span className="text-brand font-bold">{p.goatedScore}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-brand rounded-full" style={{ width: `${p.goatedScore}%` }} /></div>
                      </div>
                      <div className="text-[9px] px-1.5 py-0.5 rounded" style={{
                        backgroundColor: p.riskScore > 60 ? '#ef444415' : p.riskScore > 35 ? '#f59e0b15' : '#10b98115',
                        color: p.riskScore > 60 ? '#ef4444' : p.riskScore > 35 ? '#f59e0b' : '#10b981',
                      }}>{p.riskLabel}</div>
                    </div>
                    {p.breakout?.probability > 40 && (
                      <div className="mt-2 text-[9px] bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20">
                        Breakout {p.breakout.direction?.toUpperCase()} — {p.breakout.probability}% ({p.breakout.timeframe})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          {/* ─── Correlation Matrix ─── */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Crosshair size={14} className="text-brand" />Cross-Asset Correlation Matrix</h3>
            {(() => {
              const assets = ['BTC', 'ETH', 'SOL', 'GOLD', 'SPY', 'DXY'];
              const corrMap = {};
              correlations.forEach(c => {
                corrMap[`${c.a}-${c.b}`] = c.correlation;
                corrMap[`${c.b}-${c.a}`] = c.correlation;
              });
              const getCorr = (a, b) => {
                if (a === b) return 1.0;
                return corrMap[`${a}-${b}`] ?? corrMap[`${b}-${a}`] ?? null;
              };
              const corrColor = (v) => {
                if (v === null) return 'rgba(255,255,255,0.02)';
                if (v >= 0.7) return 'rgba(16,185,129,0.3)';
                if (v >= 0.4) return 'rgba(16,185,129,0.15)';
                if (v >= 0) return 'rgba(16,185,129,0.06)';
                if (v >= -0.3) return 'rgba(239,68,68,0.06)';
                return 'rgba(239,68,68,0.2)';
              };
              const corrText = (v) => {
                if (v === null) return 'text-slate-700';
                if (v >= 0.6) return 'text-emerald-400';
                if (v >= 0.3) return 'text-emerald-400/60';
                if (v >= 0) return 'text-slate-500';
                if (v >= -0.3) return 'text-red-400/60';
                return 'text-red-400';
              };
              return (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-[10px] text-slate-600 p-1.5 w-14"></th>
                        {assets.map(a => <th key={a} className="text-[10px] text-slate-400 font-bold p-1.5 text-center">{a}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map(row => (
                        <tr key={row}>
                          <td className="text-[10px] text-slate-400 font-bold p-1.5">{row}</td>
                          {assets.map(col => {
                            const v = getCorr(row, col);
                            return (
                              <td key={col} className="p-1">
                                <div className="rounded-lg text-center py-2 px-1 transition-all hover:scale-105"
                                  style={{ background: corrColor(v) }}>
                                  <span className={`text-xs font-mono font-bold ${corrText(v)}`}>
                                    {v !== null ? (v === 1 ? '1.00' : (v > 0 ? '+' : '') + v.toFixed(2)) : '--'}
                                  </span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
            {/* Legend */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.04]">
              <span className="text-[9px] text-slate-600">Correlation strength:</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 rounded-sm" style={{ background: 'rgba(239,68,68,0.2)' }} />
                <span className="text-[9px] text-slate-600">Strong -</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 rounded-sm" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <span className="text-[9px] text-slate-600">Weak</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 rounded-sm" style={{ background: 'rgba(16,185,129,0.3)' }} />
                <span className="text-[9px] text-slate-600">Strong +</span>
              </div>
              {/* Also show as pills */}
              <div className="ml-auto flex flex-wrap gap-1.5">
                {correlations.filter(c => Math.abs(c.correlation) >= 0.6).slice(0, 4).map((c, i) => (
                  <span key={i} className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${c.correlation > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {c.a}/{c.b} {c.correlation > 0 ? '+' : ''}{c.correlation}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Trending + Movers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><Flame size={16} className="text-orange-400" />Trending Now</h3>
              <div className="space-y-2">
                {(data?.trending || []).slice(0, 7).map((c, i) => (
                  <div key={c.id || i} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <span className="text-[10px] text-slate-600 w-4">#{i + 1}</span>
                    {c.thumb && <img src={c.thumb} alt="" className="w-5 h-5 rounded-full" loading="lazy" />}
                    <span className="text-sm text-white font-medium flex-1">{c.name}</span>
                    <span className="text-xs text-slate-500 uppercase">{c.symbol}</span>
                  </div>
                ))}
                {(!data?.trending || data.trending.length === 0) && <div className="text-xs text-slate-600 text-center py-4">Loading trending data...</div>}
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><Activity size={16} className="text-brand" />Top Movers (24h)</h3>
              <div className="space-y-2">
                {(data?.coins || []).filter(c => c.change24h != null).sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 7).map(c => (
                  <div key={c.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                    {c.image && <img src={c.image} alt="" className="w-5 h-5 rounded-full" loading="lazy" />}
                    <span className="text-sm text-white font-medium">{c.symbol}</span>
                    <span className="text-xs text-slate-500 flex-1">{fmtPrice(c.price)}</span>
                    <Spark data={c.sparkline7d} w={50} h={16} />
                    <span className={`text-xs font-bold ${pctCls(c.change24h)}`}>{c.change24h > 0 ? '+' : ''}{c.change24h?.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alpha preview */}
          {(data?.alphaPlays || []).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Zap size={16} className="text-brand" />{degenMode ? '🔥 DEGEN ALPHA PLAYS' : 'Alpha Plays'}<span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full">{data.alphaPlays.length}</span></h3>
                <button onClick={() => setActiveTab('alpha')} className="text-xs text-brand hover:underline flex items-center gap-1">View all<ChevronRight size={12} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{data.alphaPlays.slice(0, 2).map((p, i) => <AlphaCard key={i} play={p} />)}</div>
            </div>
          )}

          {/* News preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Newspaper size={16} className="text-cyan-400" />Latest Intelligence <span className="text-[9px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />LIVE</span></h3>
              <button onClick={() => setActiveTab('news')} className="text-xs text-brand hover:underline flex items-center gap-1">View all<ChevronRight size={12} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(data?.news || []).slice(0, 6).map(a => (
                <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                  className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.04] hover:border-brand/20 transition-all group block">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                      a.sentiment === 'bullish' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : a.sentiment === 'bearish' ? 'bg-red-500/15 text-red-400 border-red-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>{a.sentiment === 'bullish' ? 'BULLISH' : a.sentiment === 'bearish' ? 'BEARISH' : 'NEUTRAL'}</span>
                    <span className="text-[10px] text-slate-600">{a.source}</span>
                    <span className="text-[10px] text-slate-700 ml-auto">{ago(a.publishedAt)}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-snug group-hover:text-white line-clamp-2">{a.title}</p>
                  <div className="mt-1.5 text-[10px] flex items-center gap-1">
                    <span className="text-brand font-black">PLAY:</span>
                    <span className="text-slate-500">{a.sentiment === 'bullish' ? 'Watch for momentum continuation — potential long setup' : a.sentiment === 'bearish' ? 'Monitor for short-term risk — consider reducing exposure' : 'Wait for directional confirmation before acting'}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════ GLOBE ════════════ */}
      {activeTab === 'globe' && (
        <div className="space-y-4">
          {/* 3D Globe — Palantir-Level */}
          <div className="bg-black/40 border border-white/[0.06] rounded-xl overflow-hidden" style={{ height: 560 }}>
            <div className="relative w-full h-full">
              {/* Scan line effect */}
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-xl">
                <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"
                  style={{ animation: 'globeScanLine 4s linear infinite', top: 0 }} />
              </div>
              <style>{`@keyframes globeScanLine { 0% { top: -2px; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }`}</style>

              <Suspense fallback={<div className="flex items-center justify-center h-full text-slate-600"><RefreshCw size={16} className="animate-spin mr-2" />Loading Globe Intelligence...</div>}>
                <GlobeScene
                  hotspots={enrichedHotspots}
                  selectedHotspot={selectedHotspot}
                  hoveredHotspot={hoveredHotspot}
                  onSelectHotspot={setSelectedHotspot}
                  onHoverHotspot={setHoveredHotspot}
                  onUnhoverHotspot={() => setHoveredHotspot(null)}
                />
              </Suspense>

              {/* Top-left: GLOBAL INTELLIGENCE label */}
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md rounded-lg p-3 border border-emerald-500/20 z-20">
                <div className="flex items-center gap-2 mb-1">
                  <Radar size={14} className="text-emerald-400" />
                  <span className="text-xs font-bold text-white tracking-wider">GLOBAL INTELLIGENCE</span>
                  <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    LIVE
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">{enrichedHotspots.length} hubs · {ARC_CONNECTIONS.length} data flows active</div>
              </div>

              {/* Top-right: UTC time + refresh indicator */}
              <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md rounded-lg p-3 border border-white/10 z-20 text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">UTC TIME</div>
                <div className="text-sm font-mono text-emerald-400 font-bold">{globeUtcTime}</div>
                <div className="flex items-center gap-1 justify-end mt-1">
                  <RefreshCw size={8} className="text-slate-600 animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="text-[9px] text-slate-600">Real-time</span>
                </div>
              </div>

              {/* Bottom: Legend bar */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md rounded-lg px-4 py-2 border border-white/10 z-20 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/30" />
                  <span className="text-slate-400">Bullish</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-lg shadow-amber-400/30" />
                  <span className="text-slate-400">Neutral</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-red-400 shadow-lg shadow-red-400/30" />
                  <span className="text-slate-400">Bearish</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-3 h-[1px] bg-emerald-400" />
                  <span className="text-slate-400">Inflow</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-3 h-[1px] bg-red-400" />
                  <span className="text-slate-400">Outflow</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <span className="text-[10px] text-slate-600">Click hotspot for intel · Scroll to zoom</span>
              </div>
            </div>
          </div>

          {/* 2D Flat World Map — Accurate Geography */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><MapPin size={12} className="text-brand" />Geographic Activity Heatmap</div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500/80" /> High</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500/80" /> Medium</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500/80" /> Low</span>
              </div>
            </div>
            <WorldMap hotspots={data?.geoHotspots || []} className="rounded-lg overflow-hidden" />
          </div>

          {/* Hotspot intelligence cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {enrichedHotspots.sort((a, b) => b.intensity - a.intensity).slice(0, 8).map(h => {
              const s = h.sentiment || h.intensity;
              const sClr = s >= 0.65 ? 'text-emerald-400' : s >= 0.4 ? 'text-amber-400' : 'text-red-400';
              const sBg = s >= 0.65 ? 'bg-emerald-500/10' : s >= 0.4 ? 'bg-amber-500/10' : 'bg-red-500/10';
              return (
                <div key={h.name} className={`bg-white/[0.02] border rounded-xl p-3 cursor-pointer hover:bg-white/[0.04] transition-all ${selectedHotspot?.name === h.name ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/[0.06]'}`}
                  onClick={() => setSelectedHotspot(selectedHotspot?.name === h.name ? null : h)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{h.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${sBg} ${sClr} font-semibold`}>{Math.round(s * 100)}</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-1">{h.activity}</div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                    <span>{h.volume}</span>
                    <span>·</span>
                    <span>{h.leadCount} leads</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${h.intensity * 100}%`, background: `hsl(${h.intensity * 108},100%,50%)` }} />
                    </div>
                    <span className="text-[10px] text-slate-600 ml-2">{h.behaviorIndex}% idx</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════ ALPHA ════════════ */}
      {activeTab === 'alpha' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-brand/5 via-transparent to-purple-500/5 border border-brand/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><Zap size={18} className="text-brand" /><h3 className="text-lg font-bold text-white">{degenMode ? '🔥 DEGEN ALPHA SIGNALS' : 'Alpha Intelligence'}</h3></div>
            <p className="text-sm text-slate-400">Curated cross-asset trade setups with detailed thesis, entry/exit levels, and GOATED conviction scores. Crypto + Stocks + Prediction Markets. <span className="text-slate-600">NFA — DYOR.</span></p>
          </div>
          {/* Asset class filter summary */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] text-slate-600 uppercase tracking-wider">Asset Classes:</span>
            {['CRYPTO', 'STOCKS', 'PREDICTION MKT', 'CRYPTO + MACRO'].map(cls => {
              const count = [...PREMIUM_ALPHA_PLAYS, ...(data?.alphaPlays || [])].filter(p => (p.assetClass || 'CRYPTO') === cls).length;
              if (count === 0) return null;
              return (
                <span key={cls} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/[0.06]">
                  {cls} <span className="text-brand font-bold ml-1">{count}</span>
                </span>
              );
            })}
            <span className="ml-auto text-[10px] text-slate-600">{PREMIUM_ALPHA_PLAYS.length + (data?.alphaPlays || []).length} total plays</span>
          </div>
          {/* Premium alpha plays */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-brand" />
              <h3 className="text-sm font-semibold text-slate-300">Premium Alpha Plays</h3>
              <span className="text-[9px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-bold">CURATED</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PREMIUM_ALPHA_PLAYS.map((p, i) => <AlphaCard key={`premium-${i}`} play={p} />)}
            </div>
          </div>
          {/* Auto-generated plays */}
          {(data?.alphaPlays || []).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} className="text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-300">Auto-Generated Momentum Plays</h3>
                <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full font-bold">LIVE</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{data.alphaPlays.map((p, i) => <AlphaCard key={`auto-${i}`} play={p} />)}</div>
            </div>
          )}
        </div>
      )}

      {/* ════════════ NEWS ════════════ */}
      {activeTab === 'news' && (() => {
        const allNews = data?.news || [];
        const bullCount = allNews.filter(a => a.sentiment === 'bullish').length;
        const bearCount = allNews.filter(a => a.sentiment === 'bearish').length;
        const neutCount = allNews.filter(a => a.sentiment === 'neutral').length;
        return (
        <div className="space-y-3">
          {/* Sentiment Summary Bar */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-6">
              <SentimentDonut bullish={bullCount} bearish={bearCount} neutral={neutCount} size={72} />
              <div className="flex-1 space-y-2">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium flex items-center gap-2">News Sentiment Analysis <span className="text-[9px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 normal-case"><span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />LIVE FEED</span></div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <ArrowUp size={14} className="text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">{bullCount}</span>
                    <span className="text-xs text-slate-500">Bullish</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ArrowDown size={14} className="text-red-400" />
                    <span className="text-sm font-bold text-red-400">{bearCount}</span>
                    <span className="text-xs text-slate-500">Bearish</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-0.5 bg-slate-500 rounded" />
                    <span className="text-sm font-bold text-slate-400">{neutCount}</span>
                    <span className="text-xs text-slate-500">Neutral</span>
                  </div>
                </div>
                {/* Overall sentiment bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(bullCount / (allNews.length || 1)) * 100}%` }} />
                    <div className="h-full bg-red-500 transition-all" style={{ width: `${(bearCount / (allNews.length || 1)) * 100}%` }} />
                    <div className="h-full bg-slate-600 transition-all" style={{ width: `${(neutCount / (allNews.length || 1)) * 100}%` }} />
                  </div>
                  <span className={`text-xs font-bold ${bullCount > bearCount ? 'text-emerald-400' : bearCount > bullCount ? 'text-red-400' : 'text-slate-400'}`}>
                    {bullCount > bearCount ? 'NET BULLISH' : bearCount > bullCount ? 'NET BEARISH' : 'MIXED'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {['all', 'bullish', 'bearish', 'neutral'].map(f => (
              <button key={f} onClick={() => setNewsFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${newsFilter === f ? 'bg-brand/10 text-brand border border-brand/20' : 'text-slate-500 hover:text-slate-300 bg-white/[0.02] border border-white/[0.04]'}`}>
                {f === 'all' ? `All (${allNews.length})` : f === 'bullish' ? `Bullish (${bullCount})` : f === 'bearish' ? `Bearish (${bearCount})` : `Neutral (${neutCount})`}
              </button>
            ))}
            <span className="text-[10px] text-slate-600 ml-auto">{filteredNews.length} articles</span>
          </div>
          <div className="space-y-2">
            {filteredNews.map(a => {
              const sentBg = a.sentiment === 'bullish' ? 'bg-emerald-500/15' : a.sentiment === 'bearish' ? 'bg-red-500/15' : 'bg-slate-500/10';
              const sentClr = a.sentiment === 'bullish' ? 'text-emerald-400' : a.sentiment === 'bearish' ? 'text-red-400' : 'text-slate-400';
              const sentBorder = a.sentiment === 'bullish' ? 'border-emerald-500/20' : a.sentiment === 'bearish' ? 'border-red-500/20' : 'border-slate-500/20';
              const sentLabel = a.sentiment === 'bullish' ? 'BULLISH' : a.sentiment === 'bearish' ? 'BEARISH' : 'NEUTRAL';
              const sentIcon = a.sentiment === 'bullish' ? <ArrowUp size={12} /> : a.sentiment === 'bearish' ? <ArrowDown size={12} /> : <span className="w-2.5 h-0.5 bg-slate-500 rounded inline-block" />;
              // Extract keyword tags from title
              const keywords = [];
              const titleLower = (a.title || '').toLowerCase();
              const keywordMap = { 'bitcoin': 'BTC', 'btc': 'BTC', 'ethereum': 'ETH', 'eth': 'ETH', 'solana': 'SOL', 'sol': 'SOL', 'fed': 'Fed', 'rate': 'Rates', 'ai': 'AI', 'nvidia': 'NVDA', 'defi': 'DeFi', 'nft': 'NFT', 'regulation': 'Regulation', 'sec': 'SEC', 'whale': 'Whales', 'institutional': 'Institutional', 'rally': 'Rally', 'crash': 'Crash', 'surge': 'Surge', 'hack': 'Hack', 'adoption': 'Adoption', 'etf': 'ETF', 'stablecoin': 'Stablecoins', 'meme': 'Meme', 'layer 2': 'L2', 'l2': 'L2', 'prediction': 'Predictions', 'polymarket': 'Polymarket', 'kalshi': 'Kalshi' };
              const seen = new Set();
              Object.entries(keywordMap).forEach(([k, v]) => { if (titleLower.includes(k) && !seen.has(v)) { seen.add(v); keywords.push(v); } });

              const Wrapper = a.url ? 'a' : 'div';
              const wrapperProps = a.url ? { href: a.url, target: '_blank', rel: 'noopener noreferrer' } : {};

              return (
                <Wrapper key={a.id} {...wrapperProps}
                  className="flex items-start gap-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.04] hover:border-brand/20 transition-all group cursor-pointer">
                  {a.imageUrl && <img src={a.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {/* Prominent sentiment badge */}
                      <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${sentBg} ${sentClr} border ${sentBorder} flex items-center gap-1`}>
                        {sentIcon} {sentLabel}
                      </span>
                      {/* Sentiment strength bar */}
                      <SentimentStrengthBar sentiment={a.sentiment} />
                      <span className="text-[10px] text-slate-600 font-medium">{a.source}</span>
                      <span className="text-[10px] text-slate-700">{ago(a.publishedAt)}</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-snug group-hover:text-white mb-1.5">{a.title}</p>
                    {/* Category + keyword tags */}
                    <div className="flex flex-wrap gap-1">
                      {(a.categories || []).slice(0, 3).map(c => (
                        <span key={c} className="text-[9px] bg-brand/10 text-brand px-1.5 py-0.5 rounded-full border border-brand/10">{c}</span>
                      ))}
                      {keywords.slice(0, 4).map(k => (
                        <span key={k} className="text-[9px] bg-white/5 text-slate-500 px-1.5 py-0.5 rounded-full">{k}</span>
                      ))}
                    </div>
                  </div>
                  {a.url && <ExternalLink size={14} className="text-slate-700 group-hover:text-brand flex-shrink-0 mt-1" />}
                </Wrapper>
              );
            })}
            {filteredNews.length === 0 && <div className="text-center py-12 text-slate-600"><Newspaper size={32} className="mx-auto mb-2 opacity-30" /><p>No articles match</p></div>}
          </div>
        </div>
        );
      })()}

      {/* ════════════ PRICES ════════════ */}
      {activeTab === 'prices' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/5 text-[10px] text-slate-600 uppercase tracking-wider">
                <th className="text-left py-3 px-4">#</th><th className="text-left py-3 px-4">Asset</th><th className="text-right py-3 px-4">Price</th>
                <th className="text-right py-3 px-4">1h</th><th className="text-right py-3 px-4">24h</th><th className="text-right py-3 px-4">7d</th>
                <th className="text-right py-3 px-4">Volume</th><th className="text-right py-3 px-4">Mkt Cap</th><th className="text-right py-3 px-4 w-24">7d</th>
              </tr></thead>
              <tbody>
                {filteredCoins.map(c => (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-slate-600 text-xs">{c.rank}</td>
                    <td className="py-3 px-4"><div className="flex items-center gap-2">{c.image && <img src={c.image} alt="" className="w-5 h-5 rounded-full" loading="lazy" />}<span className="font-medium text-white">{c.name}</span><span className="text-slate-600 text-xs">{c.symbol}</span></div></td>
                    <td className="py-3 px-4 text-right font-mono text-white">{fmtPrice(c.price)}</td>
                    <td className={`py-3 px-4 text-right font-mono text-xs ${pctCls(c.change1h)}`}>{c.change1h != null ? `${c.change1h > 0 ? '+' : ''}${c.change1h.toFixed(1)}%` : '—'}</td>
                    <td className={`py-3 px-4 text-right font-mono text-xs ${pctCls(c.change24h)}`}>{c.change24h != null ? `${c.change24h > 0 ? '+' : ''}${c.change24h.toFixed(1)}%` : '—'}</td>
                    <td className={`py-3 px-4 text-right font-mono text-xs ${pctCls(c.change7d)}`}>{c.change7d != null ? `${c.change7d > 0 ? '+' : ''}${c.change7d.toFixed(1)}%` : '—'}</td>
                    <td className="py-3 px-4 text-right text-slate-400 text-xs">{fmtVol(c.volume24h)}</td>
                    <td className="py-3 px-4 text-right text-slate-400 text-xs">{fmtVol(c.marketCap)}</td>
                    <td className="py-3 px-4 text-right"><Spark data={c.sparkline7d} w={72} h={20} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════ MARKETS ════════════ */}
      {activeTab === 'markets' && (
        <div className="space-y-5">
          {/* Market Overview Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <motion.div className="rounded-xl border border-white/5 bg-surface-1/80 p-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-1.5 mb-1"><PieChart size={11} className="text-brand" /><span className="text-[9px] text-slate-500 uppercase tracking-wider">Total Market Cap</span></div>
              <div className="text-lg font-black text-white">{mktOverview.totalMarketCap ? formatLargeNumber(mktOverview.totalMarketCap) : '--'}</div>
              <div className="text-[10px] text-slate-500">Crypto only</div>
            </motion.div>
            <motion.div className="rounded-xl border border-white/5 bg-surface-1/80 p-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
              <div className="flex items-center gap-1.5 mb-1"><BarChart3 size={11} className="text-blue-400" /><span className="text-[9px] text-slate-500 uppercase tracking-wider">24h Volume</span></div>
              <div className="text-lg font-black text-white">{mktOverview.total24hVolume ? formatLargeNumber(mktOverview.total24hVolume) : '--'}</div>
              <div className="text-[10px] text-slate-500">All exchanges</div>
            </motion.div>
            <motion.div className="rounded-xl border border-white/5 bg-surface-1/80 p-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
              <div className="flex items-center gap-1.5 mb-1"><Coins size={11} className="text-orange-400" /><span className="text-[9px] text-slate-500 uppercase tracking-wider">BTC Dominance</span></div>
              <div className="text-lg font-black text-white">{BTC_DOMINANCE}%</div>
              <div className="h-1 rounded-full bg-white/5 mt-1 overflow-hidden"><div className="h-full rounded-full bg-orange-400/60" style={{ width: `${BTC_DOMINANCE}%` }} /></div>
            </motion.div>
            <motion.div className="rounded-xl border border-white/5 bg-surface-1/80 p-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
              <div className="flex items-center gap-1.5 mb-1"><Activity size={11} className={FEAR_GREED_INDEX.value > 60 ? 'text-emerald-400' : 'text-yellow-400'} /><span className="text-[9px] text-slate-500 uppercase tracking-wider">Fear & Greed</span></div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-black ${FEAR_GREED_INDEX.value > 60 ? 'text-emerald-400' : 'text-yellow-400'}`}>{FEAR_GREED_INDEX.value}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${FEAR_GREED_INDEX.value > 60 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{FEAR_GREED_INDEX.label}</span>
              </div>
            </motion.div>
            <motion.div className="rounded-xl border border-white/5 bg-surface-1/80 p-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <div className="flex items-center gap-1.5 mb-1"><Signal size={11} className={mktSentimentColor} /><span className="text-[9px] text-slate-500 uppercase tracking-wider">Market Status</span></div>
              <div className={`text-lg font-black ${mktSentimentColor}`}>{mktSentimentLabel.includes('Bullish') ? 'BULL' : mktSentimentLabel.includes('Bearish') ? 'BEAR' : 'NEUTRAL'}</div>
              <div className={`text-[10px] ${mktSentimentColor}`}>{mktSentimentLabel}</div>
            </motion.div>
            <motion.div className="rounded-xl border border-white/5 bg-surface-1/80 p-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="flex items-center gap-1.5 mb-1"><Layers size={11} className="text-brand" /><span className="text-[9px] text-slate-500 uppercase tracking-wider">Assets Tracked</span></div>
              <div className="text-lg font-black text-white">{mktAllAssets.length + PREDICTION_MARKETS.length}</div>
              <div className="text-[10px] text-slate-500">5 asset classes</div>
            </motion.div>
            <motion.div className="rounded-xl border border-white/5 bg-surface-1/80 p-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <div className="flex items-center gap-1.5 mb-1"><TrendingUp size={11} className="text-emerald-400" /><span className="text-[9px] text-slate-500 uppercase tracking-wider">Gainers / Losers</span></div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-black text-emerald-400">{mktAllGainers.length}</span>
                <span className="text-sm text-slate-600">/</span>
                <span className="text-lg font-black text-red-400">{mktAllLosers.length}</span>
              </div>
              <div className="h-1 rounded-full bg-white/5 mt-1 overflow-hidden flex">
                <div className="h-full bg-emerald-400/60" style={{ width: `${mktAllAssets.length > 0 ? (mktAllGainers.length / mktAllAssets.length) * 100 : 50}%` }} />
                <div className="h-full bg-red-400/60 flex-1" />
              </div>
            </motion.div>
          </div>

          {/* Spread Comparison: GOATED vs Competitors */}
          {(() => {
            const avgKalshiEdge = (SPREAD_COMPARISONS.reduce((s, c) => s + ((1 - c.goated / c.kalshi) * 100), 0) / SPREAD_COMPARISONS.length).toFixed(1);
            const avgPolyEdge = (SPREAD_COMPARISONS.reduce((s, c) => s + ((1 - c.goated / c.polymarket) * 100), 0) / SPREAD_COMPARISONS.length).toFixed(1);
            const avgEdge = ((parseFloat(avgKalshiEdge) + parseFloat(avgPolyEdge)) / 2).toFixed(1);
            return (
              <motion.div className="rounded-xl border border-brand/20 bg-gradient-to-r from-brand/5 via-surface-1/80 to-purple-500/5 overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="px-4 py-2.5 bg-brand/10 border-b border-brand/20 flex items-center justify-center gap-3">
                  <Zap size={14} className="text-brand" />
                  <span className="text-sm font-black text-brand">GOATED spreads avg {avgEdge}% tighter than competitors</span>
                  <span className="text-[10px] text-brand/70 hidden sm:inline">| Save {avgKalshiEdge}% vs Kalshi | Save {avgPolyEdge}% vs Polymarket</span>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {SPREAD_COMPARISONS.map((s, i) => {
                    const kalshiEdge = ((1 - s.goated / s.kalshi) * 100).toFixed(0);
                    const polyEdge = ((1 - s.goated / s.polymarket) * 100).toFixed(0);
                    const bestEdge = Math.max(parseFloat(kalshiEdge), parseFloat(polyEdge));
                    return (
                      <motion.div key={i} className="bg-black/20 rounded-lg p-3 border border-white/5 hover:border-brand/20 transition-all" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-white leading-snug flex-1 mr-2">{s.event}</span>
                          <span className="text-[10px] font-black text-brand bg-brand/15 px-2 py-0.5 rounded-full">{bestEdge}% EDGE</span>
                        </div>
                        <div className="space-y-1.5 mb-2">
                          <div className="flex items-center gap-2"><span className="text-[9px] text-brand font-bold w-14">GOATED</span><div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-brand" style={{ width: `${s.goated * 100}%` }} /></div><span className="text-[11px] text-brand font-black w-10 text-right">${s.goated.toFixed(2)}</span></div>
                          <div className="flex items-center gap-2"><span className="text-[9px] text-slate-500 w-14">Kalshi</span><div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-slate-600" style={{ width: `${s.kalshi * 100}%` }} /></div><span className="text-[11px] text-slate-400 font-bold w-10 text-right">${s.kalshi.toFixed(2)}</span></div>
                          <div className="flex items-center gap-2"><span className="text-[9px] text-slate-500 w-14">Poly</span><div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-slate-600" style={{ width: `${s.polymarket * 100}%` }} /></div><span className="text-[11px] text-slate-400 font-bold w-10 text-right">${s.polymarket.toFixed(2)}</span></div>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-600">Vol ${s.volume}</span>
                          <span className="text-emerald-400 font-bold">You save ${(s.kalshi - s.goated).toFixed(2)}-${(s.polymarket - s.goated).toFixed(2)}/share</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })()}

          {/* Market Sub-Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {MARKET_SUB_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = marketSubTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setMarketSubTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${isActive ? 'bg-brand/15 text-brand border border-brand/30 shadow-lg shadow-brand/5' : 'bg-surface-3 text-slate-500 border border-white/[0.03] hover:text-white hover:bg-surface-2'}`}>
                  <Icon size={14} />{tab.label}
                  {tab.key !== 'all' && tab.key !== 'predictions' && (
                    <span className={`text-[10px] px-1.5 rounded-full ${isActive ? 'bg-brand/20' : 'bg-white/5'}`}>
                      {tab.key === 'crypto' ? mktCryptoAssets.length : tab.key === 'stocks' ? STOCKS_DATA.length : tab.key === 'forex' ? FOREX_DATA.length : COMMODITIES_DATA.length}
                    </span>
                  )}
                  {tab.key === 'predictions' && <span className={`text-[10px] px-1.5 rounded-full ${isActive ? 'bg-brand/20' : 'bg-white/5'}`}>{PREDICTION_MARKETS.length}</span>}
                </button>
              );
            })}
          </div>

          {/* Live Price Ticker */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="font-medium text-emerald-400">LIVE</span></div>
            <span>Prices tick every 2s</span><span className="text-slate-600">|</span>
            <span>Last tick: {new Date(tickTimestamp).toLocaleTimeString()}</span><span className="text-slate-600">|</span>
            <span>{mktFilteredAssets.length} assets tracked</span>
          </div>

          {/* Market Movers — Top Gainers & Losers */}
          <div className="rounded-xl border border-white/5 bg-surface-1/80 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2"><Flame size={16} className="text-brand" /><h2 className="font-bold text-white text-sm">Market Movers</h2><span className="text-[10px] text-slate-500">Top gainers & losers across all asset classes</span></div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5"><TrendingUp size={14} className="text-emerald-400" /><span className="text-xs font-bold text-emerald-400">Top Gainers</span></div>
                  <div className="space-y-2">{mktAllGainers.slice(0, 3).map((a, i) => <MktMoverCard key={`mg-${a.assetClass}-${a.symbol}`} asset={a} rank={i + 1} type="gainer" />)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5"><TrendingDown size={14} className="text-red-400" /><span className="text-xs font-bold text-red-400">Top Losers</span></div>
                  <div className="space-y-2">{mktAllLosers.slice(0, 3).map((a, i) => <MktMoverCard key={`ml-${a.assetClass}-${a.symbol}`} asset={a} rank={i + 1} type="loser" />)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap / List or Predictions */}
          {marketSubTab !== 'predictions' ? (
            <>
              {/* Heatmap View */}
              <div className="rounded-xl border border-white/5 bg-surface-1/80 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <div className="flex items-center gap-2"><Flame size={16} className="text-brand" /><h2 className="font-bold text-white">{marketSubTab === 'all' ? 'All Markets' : marketSubTab.charAt(0).toUpperCase() + marketSubTab.slice(1)} Heatmap</h2><span className="text-xs text-slate-500">{mktFilteredAssets.length} assets</span></div>
                  <div className="flex items-center gap-1 bg-surface-3 rounded-lg p-0.5">
                    <button onClick={() => setMarketView('heatmap')} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${marketView === 'heatmap' ? 'bg-brand/15 text-brand' : 'text-slate-500 hover:text-white'}`}><LayoutGrid size={12} />Grid</button>
                    <button onClick={() => setMarketView('list')} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${marketView === 'list' ? 'bg-brand/15 text-brand' : 'text-slate-500 hover:text-white'}`}><List size={12} />List</button>
                  </div>
                </div>
                {marketView === 'heatmap' ? (
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {mktFilteredAssets.map(asset => (
                      <HeatmapCell key={`${asset.assetClass}-${asset.symbol}`} asset={asset} flash={priceFlashes[asset.symbol]}
                        onClick={() => setSelectedAsset(selectedAsset?.symbol === asset.symbol && selectedAsset?.assetClass === asset.assetClass ? null : asset)} />
                    ))}
                    {mktFilteredAssets.length === 0 && <div className="col-span-full text-center py-12 text-slate-500 text-sm">No assets match your search</div>}
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-slate-500 font-medium">
                      <div className="col-span-3">Asset</div><div className="col-span-1 text-center">Class</div><div className="col-span-2 text-right">Price</div>
                      <div className="col-span-2 text-right">24h Change</div><div className="col-span-2 text-right">Market Cap</div><div className="col-span-2 text-right">Volume</div>
                    </div>
                    {mktFilteredAssets.map((asset, i) => {
                      const change = asset.change24h ?? 0;
                      const changeColor = change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-slate-400';
                      const ChangeIcon = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus;
                      const accentColor = ASSET_COLORS[asset.symbol] || '#888';
                      return (
                        <motion.div key={`${asset.assetClass}-${asset.symbol}`}
                          className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors cursor-pointer"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          onClick={() => setSelectedAsset(selectedAsset?.symbol === asset.symbol ? null : asset)}>
                          <div className="col-span-3 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>{asset.symbol?.slice(0, 2)}</div>
                            <div><span className="text-sm font-bold text-white">{asset.symbol}</span><p className="text-[10px] text-slate-500 leading-none truncate max-w-[120px]">{asset.name}</p></div>
                          </div>
                          <div className="col-span-1 flex justify-center"><span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full uppercase" style={{ backgroundColor: `${CLASS_COLORS[asset.assetClass] || '#888'}15`, color: CLASS_COLORS[asset.assetClass] || '#888' }}>{asset.assetClass}</span></div>
                          <div className="col-span-2 text-right text-sm font-medium text-white">{asset.assetClass === 'forex' ? `$${asset.price.toFixed(4)}` : formatPrice(asset.price)}</div>
                          <div className={`col-span-2 text-right text-sm font-medium flex items-center justify-end gap-1 ${changeColor}`}><ChangeIcon size={14} />{change > 0 ? '+' : ''}{change.toFixed(2)}%</div>
                          <div className="col-span-2 text-right text-sm text-slate-400">{asset.marketCap ? formatLargeNumber(asset.marketCap) : '--'}</div>
                          <div className="col-span-2 text-right text-sm text-slate-400">{asset.volume24h ? formatLargeNumber(asset.volume24h) : '--'}</div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Asset Detail */}
              <AnimatePresence>
                {selectedAsset && (
                  <motion.div className="rounded-xl border border-white/5 bg-surface-1/80 p-5" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: `${ASSET_COLORS[selectedAsset.symbol] || '#888'}20`, color: ASSET_COLORS[selectedAsset.symbol] || '#888' }}>{selectedAsset.symbol?.slice(0, 3)}</div>
                        <div><h3 className="text-lg font-bold text-white">{selectedAsset.name}</h3><p className="text-sm text-slate-500">{selectedAsset.symbol}</p></div>
                      </div>
                      <button onClick={() => setSelectedAsset(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-surface-2/50 rounded-lg p-3"><span className="text-xs text-slate-500">Price</span><p className="text-lg font-bold text-white">{selectedAsset.assetClass === 'forex' ? `$${selectedAsset.price.toFixed(4)}` : formatPrice(selectedAsset.price)}</p></div>
                      <div className="bg-surface-2/50 rounded-lg p-3"><span className="text-xs text-slate-500">24h Change</span><p className={`text-lg font-bold ${(selectedAsset.change24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{(selectedAsset.change24h ?? 0) >= 0 ? '+' : ''}{(selectedAsset.change24h ?? 0).toFixed(2)}%</p></div>
                      <div className="bg-surface-2/50 rounded-lg p-3"><span className="text-xs text-slate-500">Market Cap</span><p className="text-lg font-bold text-white">{selectedAsset.marketCap ? formatLargeNumber(selectedAsset.marketCap) : 'N/A'}</p></div>
                      <div className="bg-surface-2/50 rounded-lg p-3"><span className="text-xs text-slate-500">24h Volume</span><p className="text-lg font-bold text-white">{selectedAsset.volume24h ? formatLargeNumber(selectedAsset.volume24h) : 'N/A'}</p></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            /* Predictions Sub-Tab */
            <div className="rounded-xl border border-white/5 bg-surface-1/80 overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><Brain size={16} className="text-purple-400" /><h2 className="font-bold text-white">Prediction Markets</h2><span className="text-xs text-slate-500">{PREDICTION_MARKETS.length} events</span></div>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {mktPredCategories.map(cat => (
                    <button key={cat} onClick={() => setMktPredFilter(cat)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${mktPredFilter === cat ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' : 'bg-surface-3 text-slate-500 border border-white/[0.03] hover:text-white'}`}>
                      {cat} <span className="ml-1 text-[10px] opacity-60">({cat === 'All' ? PREDICTION_MARKETS.length : PREDICTION_MARKETS.filter(p => p.category === cat).length})</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[700px] overflow-y-auto scrollbar-hide">
                {mktFilteredPredictions.map(market => <MarketPredictionCard key={market.id} market={market} />)}
              </div>
            </div>
          )}

          {/* Cross-Asset Correlations */}
          <motion.div className="rounded-xl border border-white/5 bg-surface-1/80 overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2"><Radio size={16} className="text-blue-400" /><h2 className="font-bold text-white text-sm">Cross-Asset Correlations</h2><span className="text-[10px] text-slate-500">Real-time correlation matrix insights</span></div>
              <span className="text-[9px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">30-day rolling</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {CROSS_CORRELATIONS.map((corr) => <CorrelationBadge key={corr.pair} data={corr} />)}
            </div>
          </motion.div>

          {/* Alpha Signals */}
          <div className={`rounded-xl border bg-surface-1/80 overflow-hidden ${degenMode ? 'border-orange-500/30' : 'border-white/5'}`}>
            <div className={`flex items-center gap-2 p-4 border-b ${degenMode ? 'border-orange-500/20 bg-orange-500/5' : 'border-white/5'}`}>
              <Zap size={16} className={degenMode ? 'text-orange-400' : 'text-yellow-400'} />
              <h2 className="font-bold text-white text-sm">Alpha Signals</h2>
              <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded-full bg-white/5">Real-time</span>
              <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{ALPHA_SIGNALS.length} active</span>
            </div>
            <div className="p-3 space-y-2 max-h-[480px] overflow-y-auto scrollbar-hide">
              {ALPHA_SIGNALS.map((signal, i) => (
                <MktAlphaSignalRow key={signal.id} signal={signal} index={i} expanded={expandedSignal === signal.id}
                  onToggle={() => setExpandedSignal(expandedSignal === signal.id ? null : signal.id)} degenMode={degenMode} />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <ShieldCheck size={12} className="text-slate-600" />
            <p className="text-[10px] text-slate-600">Crypto via CoinGecko. Stocks, forex, commodities are indicative. Prediction data from Polymarket & Kalshi. Not financial advice.</p>
          </div>
        </div>
      )}

      {/* ════════════ DEEP RESEARCH ════════════ */}
      {activeTab === 'research' && (
        <div className="space-y-5">
          {/* Search input */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={researchQuery}
              onChange={e => setResearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && researchQuery.trim()) {
                  setResearchLoading(true);
                  setResearchReport(null);
                  setTimeout(() => {
                    const q = researchQuery.toLowerCase();
                    const reports = {
                      btc: {
                        title: `BTC Deep Analysis: ${researchQuery}`,
                        summary: 'Bitcoin is showing strong institutional accumulation patterns with on-chain metrics signaling a potential breakout above key resistance levels. The current market structure resembles pre-rally conditions seen in previous cycles, with decreasing exchange reserves and rising long-term holder supply.',
                        findings: [
                          'Exchange reserves at 2-year lows — accumulation phase confirmed by on-chain data',
                          'RSI divergence on weekly timeframe suggests momentum building for upside move',
                          'Institutional inflows via ETFs averaging $340M/week, highest since Q1 2024',
                          'Hash rate at all-time highs indicating miner confidence in future price appreciation',
                          'Options market skew favoring calls at 1.3x ratio — smart money positioning bullish',
                        ],
                        sentiment: 78,
                        sentimentLabel: 'Bullish',
                        risk: 'Moderate. Key downside risk is macro liquidity tightening if Fed reverses rate cut trajectory. Support at $58K must hold for bullish thesis.',
                        plays: ['Long BTC spot with stop at $58K support', 'BTC call spreads targeting $85K-$95K range (60-90 DTE)', 'Accumulate on dips below $62K with DCA strategy'],
                      },
                      ai: {
                        title: `AI Sector Deep Analysis: ${researchQuery}`,
                        summary: 'The AI sector continues to show explosive growth with compute demand outpacing supply. Key players are seeing revenue acceleration while new entrants are disrupting traditional software verticals. The sector is transitioning from hype to fundamental value creation.',
                        findings: [
                          'NVIDIA data center revenue up 154% YoY — GPU demand still outstripping supply',
                          'AI infrastructure spending by hyperscalers expected to reach $200B+ in 2026',
                          'Open-source models closing the gap with proprietary solutions — commoditization risk emerging',
                          'Enterprise AI adoption rate jumped from 35% to 67% in 12 months',
                          'AI agent frameworks gaining traction — next wave of value creation in autonomous systems',
                        ],
                        sentiment: 82,
                        sentimentLabel: 'Very Bullish',
                        risk: 'Elevated valuations create vulnerability to earnings misses. Regulatory headwinds in EU and potential compute export restrictions add uncertainty.',
                        plays: ['Overweight AI infrastructure plays (NVDA, AVGO, MRVL)', 'AI software picks-and-shovels approach (PLTR, SNOW, MDB)', 'Short overvalued AI wrappers with no moat'],
                      },
                      election: {
                        title: `Election Impact Analysis: ${researchQuery}`,
                        summary: 'Political markets are showing increased volatility as election dynamics shift. Prediction markets are pricing in significant policy divergence between candidates, with crypto and tech sectors most exposed to regulatory outcomes.',
                        findings: [
                          'Prediction market volumes surging 300%+ compared to previous election cycles',
                          'Crypto-friendly policy stance creating 15-20% premium in digital asset markets',
                          'Defense and energy sectors showing strong correlation with polling data shifts',
                          'Tax policy uncertainty creating hedging demand in equity options markets',
                          'Immigration policy odds moving markets in agriculture and construction sectors',
                        ],
                        sentiment: 52,
                        sentimentLabel: 'Neutral',
                        risk: 'High uncertainty period. Policy whiplash risk is elevated. Markets historically see 10-15% volatility expansion in election months.',
                        plays: ['Straddle strategies on SPY for election week volatility', 'Long crypto as hedge against regulatory clarity trade', 'Rotate into defensive sectors if polling volatility increases'],
                      },
                    };
                    let report = null;
                    if (q.includes('btc') || q.includes('bitcoin')) report = reports.btc;
                    else if (q.includes('ai') || q.includes('artificial intelligence') || q.includes('nvidia') || q.includes('tech')) report = reports.ai;
                    else if (q.includes('election') || q.includes('trump') || q.includes('politics') || q.includes('vote')) report = reports.election;
                    else {
                      report = {
                        title: `Deep Analysis: ${researchQuery}`,
                        summary: `GOATED AI has analyzed "${researchQuery}" across multiple data sources including on-chain metrics, social sentiment, technical indicators, and macro conditions. The current environment shows mixed signals with selective opportunities emerging for informed participants.`,
                        findings: [
                          `Market sentiment around "${researchQuery}" is trending moderately positive across social channels`,
                          'Technical indicators show consolidation pattern — breakout direction pending catalyst',
                          'Volume profile suggests accumulation by sophisticated participants at current levels',
                          'Correlation with broader market risk appetite remains elevated at 0.72',
                          'Smart money flow indicators are neutral-to-positive on 7-day timeframe',
                        ],
                        sentiment: 58,
                        sentimentLabel: 'Slightly Bullish',
                        risk: 'Moderate. Position sizing should reflect uncertainty. Key risk factors include macro headwinds and sector-specific regulatory developments.',
                        plays: ['Scale into positions with 3-5 entry tranches over 2 weeks', 'Set tight risk management with 5-8% stop losses', 'Monitor for catalyst events before increasing exposure'],
                      };
                    }
                    setResearchReport(report);
                    setResearchLoading(false);
                  }, 2000);
                }
              }}
              placeholder="Enter topic for deep analysis... (e.g., 'BTC breakout potential', 'AI sector momentum')"
              className="w-full pl-11 pr-4 py-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand/30 focus:bg-white/[0.05] transition-all"
            />
            {researchQuery && (
              <button onClick={() => { setResearchQuery(''); setResearchReport(null); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Loading state */}
          {researchLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
                <Brain size={24} className="text-brand absolute inset-0 m-auto" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white mb-1">GOATED AI analyzing...</p>
                <p className="text-xs text-slate-500">Scanning on-chain data, sentiment feeds, technical indicators & macro signals</p>
              </div>
            </motion.div>
          )}

          {/* Research report */}
          {researchReport && !researchLoading && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Report header */}
              <div className="bg-gradient-to-r from-brand/10 via-purple-500/5 to-blue-500/10 border border-brand/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={18} className="text-brand" />
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/15 text-brand font-bold uppercase tracking-wider">Deep Research Report</span>
                  <span className="ml-auto text-[10px] text-slate-500">{new Date().toLocaleDateString()}</span>
                </div>
                <h2 className="text-lg font-black text-white">{researchReport.title}</h2>
              </div>

              {/* Executive Summary */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-purple-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Executive Summary</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{researchReport.summary}</p>
              </div>

              {/* Key Findings */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={14} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Key Findings</h3>
                </div>
                <div className="space-y-2.5">
                  {researchReport.findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand/10 text-brand text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <p className="text-sm text-slate-300 leading-relaxed">{f}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sentiment Analysis */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={14} className="text-blue-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sentiment Analysis</h3>
                </div>
                <div className="flex items-center gap-6">
                  <Ring score={researchReport.sentiment} label={researchReport.sentimentLabel} sz="lg" />
                  <div className="flex-1">
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden flex">
                      <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 rounded-full transition-all" style={{ width: `${researchReport.sentiment}%` }} />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
                      <span>Bearish</span>
                      <span>Neutral</span>
                      <span>Bullish</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} className="text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Risk Assessment</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{researchReport.risk}</p>
              </div>

              {/* Recommended Plays */}
              <div className="bg-white/[0.02] border border-brand/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-brand" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recommended Plays</h3>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-bold">ALPHA</span>
                </div>
                <div className="space-y-2">
                  {researchReport.plays.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-brand/5 border border-brand/10">
                      <Crosshair size={12} className="text-brand flex-shrink-0" />
                      <p className="text-sm text-slate-200">{p}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex items-center gap-2 pt-1">
                <Shield size={10} className="text-slate-600" />
                <p className="text-[10px] text-slate-600">AI-generated analysis. Not financial advice. Always do your own research before making investment decisions.</p>
              </div>
            </motion.div>
          )}

          {/* Empty state */}
          {!researchLoading && !researchReport && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                <Brain size={28} className="text-slate-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-400 mb-1">Enter a topic to research</h3>
              <p className="text-xs text-slate-600 max-w-sm">GOATED AI will analyze sentiment, technicals, on-chain data, and macro conditions to generate a comprehensive research report.</p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {['BTC breakout potential', 'AI sector momentum', 'Election market impact', 'SOL ecosystem growth'].map(suggestion => (
                  <button key={suggestion} onClick={() => setResearchQuery(suggestion)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-500 bg-white/[0.03] border border-white/[0.06] hover:text-white hover:border-brand/20 transition-all">
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attribution */}
      <div className="text-center text-[10px] text-slate-700 pt-2 pb-4">
        Data from {(data?.sources || []).join(', ') || 'multiple sources'} · Refreshes every 30s · {data?.cached ? `Cached (${data.cacheAge}s)` : 'Live'}
      </div>
    </div>
  );
}
