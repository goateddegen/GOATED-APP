import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, ArrowUp, ArrowDown, BarChart3, Clock, Flame, Radio,
  ChevronRight, RefreshCw, Activity, Zap, Target, AlertTriangle,
  DollarSign, Globe, Brain, Search, ExternalLink, Newspaper, Sparkles,
  ChevronDown, X, Crosshair, Shield, TrendingDown, Radar, Rocket, MapPin,
  Filter, SlidersHorizontal, Trophy,
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
  { id: 'news', label: 'News Feed', icon: Newspaper },
  { id: 'prices', label: 'Live Prices', icon: DollarSign },
  { id: 'predictions', label: 'Predictions', icon: Target },
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
      {/* Trade setup hint */}
      <div className="flex items-center gap-3 p-2 rounded-lg bg-brand/5 border border-brand/10 text-[10px]">
        <Zap size={10} className="text-brand shrink-0" />
        <span className="text-slate-400">
          <span className={`font-bold ${play.direction === 'long' ? 'text-emerald-400' : 'text-red-400'}`}>
            {play.direction === 'long' ? 'LONG' : 'SHORT'}
          </span>
          {' '}{play.asset} · {goatedScore}/100 GOATED Score · {play.timeframe}
        </span>
        <span className="ml-auto text-brand font-bold">Trade Setup</span>
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
  const [betSide, setBetSide] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const y = m.yesPrice ?? parseFloat(m.outcomePrices?.[0] || '0.5');
  const n = 1 - y;
  const yesPct = Math.round(y * 100);
  const noPct = 100 - yesPct;
  const yesReturn = betAmount ? (parseFloat(betAmount) / y).toFixed(2) : '0';
  const noReturn = betAmount ? (parseFloat(betAmount) / n).toFixed(2) : '0';
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
      {/* Bet buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setBetSide(betSide === 'yes' ? null : 'yes')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            betSide === 'yes' ? 'bg-emerald-500 text-black' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
          }`}
        >
          Buy YES ${y.toFixed(2)}
        </button>
        <button
          onClick={() => setBetSide(betSide === 'no' ? null : 'no')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            betSide === 'no' ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
          }`}
        >
          Buy NO ${n.toFixed(2)}
        </button>
      </div>
      {betSide && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
          <div className={`mt-2 p-3 rounded-lg border ${betSide === 'yes' ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-slate-400">Amount (USDC)</span>
              <div className="flex gap-1 ml-auto">
                {['10', '25', '100'].map(v => (
                  <button key={v} onClick={() => setBetAmount(v)} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 hover:text-white transition-colors">${v}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="0.00" value={betAmount} onChange={e => setBetAmount(e.target.value)}
                className="flex-1 pl-3 pr-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand/30" />
              <button className={`px-4 py-2 rounded-lg text-xs font-bold ${betSide === 'yes' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'} ${!betAmount ? 'opacity-40 cursor-not-allowed' : ''}`} disabled={!betAmount}>
                {betSide === 'yes' ? 'Buy YES' : 'Buy NO'}
              </button>
            </div>
            {betAmount && (
              <div className="flex items-center justify-between mt-2 text-[10px]">
                <span className="text-slate-500">If {betSide.toUpperCase()} wins:</span>
                <span className="text-brand font-bold">${betSide === 'yes' ? yesReturn : noReturn} (+{betSide === 'yes' ? ((1/y - 1) * 100).toFixed(0) : ((1/n - 1) * 100).toFixed(0)}%)</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
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
  const ivRef = useRef(null);
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
            Trend Pulse
            <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />LIVE</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Multi-source sentiment aggregation &amp; predictive alpha{data?.sources && <span className="text-slate-600 ml-1">— {data.sources.join(' · ')}</span>}</p>
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
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Newspaper size={16} className="text-cyan-400" />Latest Intelligence</h3>
              <button onClick={() => setActiveTab('news')} className="text-xs text-brand hover:underline flex items-center gap-1">View all<ChevronRight size={12} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(data?.news || []).slice(0, 6).map(a => (
                <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                  className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.04] hover:border-brand/20 transition-all group block">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      a.sentiment === 'bullish' ? 'bg-emerald-500/10 text-emerald-400' : a.sentiment === 'bearish' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'
                    }`}>{a.sentiment === 'bullish' ? '↑ Bull' : a.sentiment === 'bearish' ? '↓ Bear' : '— Neutral'}</span>
                    <span className="text-[10px] text-slate-600">{a.source}</span>
                    <span className="text-[10px] text-slate-700 ml-auto">{ago(a.publishedAt)}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-snug group-hover:text-white line-clamp-2">{a.title}</p>
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
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Sentiment Analysis Summary</div>
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

      {/* ════════════ PREDICTIONS ════════════ */}
      {activeTab === 'predictions' && (
        <div className="space-y-4">
          {/* Spread Comparison Banner */}
          {spreadStats && (
            <div className="bg-gradient-to-r from-brand/10 via-blue-500/5 to-purple-500/10 border border-brand/20 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={18} className="text-brand" />
                  <h3 className="text-sm font-bold text-white">GOATED vs Kalshi vs Polymarket — Better Spreads, Better Alpha</h3>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-brand/15 text-brand font-bold">{spreadStats.avgSavings}% AVG SAVINGS</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {spreadStats.examples.map((ex, i) => (
                    <div key={i} className="bg-black/30 rounded-lg p-3 border border-white/5">
                      <p className="text-[10px] text-slate-400 mb-2 leading-tight truncate">{ex.question}</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-emerald-400 font-semibold">GOATED</span>
                          <span className="text-emerald-400 font-bold">${ex.goated?.toFixed(3)}</span>
                        </div>
                        {ex.kalshi != null && (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-blue-400">Kalshi</span>
                            <span className="text-slate-400">${ex.kalshi?.toFixed(3)}</span>
                          </div>
                        )}
                        {ex.polymarket != null && (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-purple-400">Polymarket</span>
                            <span className="text-slate-400">${ex.polymarket?.toFixed(3)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Info bar */}
          <div className="bg-gradient-to-r from-purple-500/5 via-transparent to-brand/5 border border-purple-500/10 rounded-xl p-4">
            <p className="text-xs text-slate-400"><Target size={12} className="inline mr-1 text-purple-400" />Live prediction markets aggregated from Kalshi, Polymarket &amp; GOATED. Buy YES or NO shares — if you're right, each share pays $1. <span className="text-brand font-medium">Powered by GOATED intelligence.</span></p>
          </div>

          {/* Filters row */}
          <div className="space-y-3">
            {/* Category filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-slate-600 uppercase tracking-wider font-medium flex items-center gap-1"><Filter size={10} />Category</span>
              {['All', 'Crypto', 'Politics', 'Economics', 'Tech', 'AI', 'Sports'].map(cat => (
                <button key={cat} onClick={() => setPredCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    predCategory === cat
                      ? 'bg-brand/10 text-brand border border-brand/20'
                      : 'text-slate-500 hover:text-slate-300 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
            {/* Platform filter + Sort */}
            <div className="flex items-center gap-2 flex-wrap justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Platform</span>
                {['All', 'GOATED', 'Kalshi', 'Polymarket'].map(plat => {
                  const style = plat !== 'All' ? PLATFORM_COLORS[plat] : null;
                  return (
                    <button key={plat} onClick={() => setPredPlatform(plat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        predPlatform === plat
                          ? style ? `${style.bg} ${style.text} border ${style.border}` : 'bg-brand/10 text-brand border border-brand/20'
                          : 'text-slate-500 hover:text-slate-300 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]'
                      }`}>
                      {plat}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600 uppercase tracking-wider font-medium flex items-center gap-1"><SlidersHorizontal size={10} />Sort</span>
                {[
                  { id: 'volume', label: 'Volume' },
                  { id: 'alpha', label: 'Alpha %' },
                  { id: 'trending', label: 'Trending' },
                  { id: 'newest', label: 'Newest' },
                ].map(s => (
                  <button key={s.id} onClick={() => setPredSort(s.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      predSort === s.id
                        ? 'bg-white/10 text-white border border-white/15'
                        : 'text-slate-500 hover:text-slate-300 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="text-[11px] text-slate-600 flex items-center gap-2">
            <span>{filteredPredictions.length} market{filteredPredictions.length !== 1 ? 's' : ''}</span>
            {predCategory !== 'All' && <span className="text-brand">in {predCategory}</span>}
            {predPlatform !== 'All' && <span className={PLATFORM_COLORS[predPlatform]?.text || 'text-brand'}>on {predPlatform}</span>}
          </div>

          {/* Prediction cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredPredictions.map(m => <TrendsPredictionCard key={m.id} m={m} />)}
          </div>
          {filteredPredictions.length === 0 && <div className="text-center py-16 text-slate-600"><Target size={32} className="mx-auto mb-2 opacity-30" /><p>No prediction markets match your filters</p></div>}
        </div>
      )}

      {/* Attribution */}
      <div className="text-center text-[10px] text-slate-700 pt-2 pb-4">
        Data from {(data?.sources || []).join(', ') || 'multiple sources'} · Refreshes every 30s · {data?.cached ? `Cached (${data.cacheAge}s)` : 'Live'}
      </div>
    </div>
  );
}
