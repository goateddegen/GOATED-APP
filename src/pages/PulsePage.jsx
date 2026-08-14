// =============================================================================
// GOATED — Pulse
// -----------------------------------------------------------------------------
// The old Trends page was a 3D globe over `Math.random()`. This is the same
// idea pointed at data that exists: the operator's own lead book, plotted where
// the businesses actually are, coloured by the signal that makes each one worth
// a call today.
//
// A NOTE ON THE GLOBE. A sphere is the wrong projection for this data. Leads sit
// inside one metro — twenty miles across — so on a globe they are a single pixel
// and you learn nothing. Auto-fitting a flat projection to the bounding box of
// whatever the operator holds shows street-level clustering, which is the thing
// that actually helps: which side of town to work this morning.
//
// Every point is a real business at its real coordinates. Nothing here is
// generated.
// =============================================================================

import React, { useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { feature } from 'topojson-client';
// Real coastlines, 54KB, bundled rather than fetched — no runtime dependency on
// anyone else's CDN, and it works offline. 110m is the coarse cut, which is the
// right one at this size: finer detail is invisible on a 600px sphere and costs
// several hundred KB.
import landTopo from 'world-atlas/land-110m.json';
import { Radio, Flame, Globe, PhoneCall, Map as MapIcon } from 'lucide-react';
import { useStore, formatPhone } from '../hooks/useStore';

// ─── Globe ──────────────────────────────────────────────────────────────────
// three.js is already a dependency and this page is lazy-loaded, so the globe
// costs nothing to anyone who never opens Pulse.

/** lat/lng in degrees to a point on a sphere of the given radius. */
function toVec3(lat, lng, r) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

/** Coastlines as line loops laid on the sphere. Built once, module-level. */
const COASTLINES = (() => {
  try {
    const geo = feature(landTopo, landTopo.objects.land);
    const rings = [];
    for (const f of geo.features) {
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const poly of polys) {
        for (const ring of poly) {
          // Drop the tiniest islands — they cost draw calls and render as noise.
          if (ring.length < 6) continue;
          rings.push(ring);
        }
      }
    }
    return rings;
  } catch {
    return [];
  }
})();

function Coastlines({ radius = 1.002 }) {
  const geometries = useMemo(() => COASTLINES.map((ring) => {
    const pts = ring.map(([lng, lat]) => toVec3(lat, lng, radius));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }), [radius]);
  return (
    <group>
      {geometries.map((g, i) => (
        <line key={i} geometry={g}>
          <lineBasicMaterial color="#3b82f6" transparent opacity={0.55} />
        </line>
      ))}
    </group>
  );
}

function Marker({ position, colour, hot, onClick, onHover }) {
  const ref = React.useRef();
  useFrame((state) => {
    if (!ref.current || !hot) return;
    // Only the urgent ones breathe. Animating every marker on a book of a
    // thousand would cost frames and say nothing.
    const t = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.35;
    ref.current.scale.setScalar(t);
  });
  return (
    <mesh
      ref={ref}
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover?.(true); }}
      onPointerOut={() => onHover?.(false)}
    >
      <sphereGeometry args={[hot ? 0.018 : 0.011, 8, 8]} />
      <meshBasicMaterial color={colour} toneMapped={false} />
    </mesh>
  );
}

function GlobeScene({ points, onSelect, setHover, dragging }) {
  const group = React.useRef();

  // Face the book. A globe that starts on the Atlantic makes the operator drag
  // it around to find their own city.
  const centre = useMemo(() => {
    if (!points.length) return { lat: 0, lng: 0 };
    return {
      lat: points.reduce((a, p) => a + p.lead.coords.lat, 0) / points.length,
      lng: points.reduce((a, p) => a + p.lead.coords.lng, 0) / points.length,
    };
  }, [points]);

  // Auto-rotate, but yield to the hand. Spinning under a drag makes the globe
  // feel like it is fighting you.
  useFrame((state, delta) => {
    if (group.current && !dragging) group.current.rotation.y += delta * 0.04;
  });

  return (
    <group
      ref={group}
      rotation={[
        THREE.MathUtils.degToRad(centre.lat) * 0.6,
        -THREE.MathUtils.degToRad(centre.lng + 90),
        0,
      ]}
    >
      <mesh>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial color="#0b1220" transparent opacity={0.92} />
      </mesh>
      <Coastlines />
      {points.map(({ lead, signal }) => (
        <Marker
          key={lead._placeId || lead.id}
          position={toVec3(lead.coords.lat, lead.coords.lng, 1.012)}
          colour={signal.colour}
          hot={signal.id === 'complaint'}
          onClick={() => onSelect?.(lead)}
          onHover={(on) => setHover(on ? lead : null)}
        />
      ))}
    </group>
  );
}

// Signal bands, most urgent first. The first match wins, so the order is the
// priority order the operator should work in.
const SIGNALS = [
  {
    id: 'complaint',
    label: 'Just got burned',
    colour: '#ef4444',
    blurb: 'A customer publicly said they were let down. Timely, specific, and still raw.',
    match: (l) => !!l.recentComplaint,
  },
  {
    id: 'no-site',
    label: 'No website',
    colour: '#f59e0b',
    blurb: 'Every enquiry has to arrive by phone or Maps. Nothing catches the rest.',
    match: (l) => !l.website && !l.domain,
  },
  {
    id: 'slowing',
    label: 'Going quiet',
    colour: '#f97316',
    blurb: 'Review pace falling off — the moment an owner starts taking calls about work.',
    match: (l) => l.activity?.level === 'slowing',
  },
  {
    id: 'invisible',
    label: 'Invisible',
    colour: '#22d3ee',
    blurb: 'Under thirty reviews. Real business, no presence, and they know it.',
    match: (l) => typeof l.reviewCount === 'number' && l.reviewCount < 30,
  },
];

// Nothing matched: still a real business in the book, still worth seeing on the
// map. Plotting only the flagged ones hid most of the book and made the metro
// look emptier than it is.
const TRACKED = {
  id: 'tracked', label: 'Tracked', colour: '#64748b',
  blurb: 'In the book, no standout signal. Still a business you can call.',
  match: () => true,
};
const ALL_BANDS = [...SIGNALS, TRACKED];
const signalFor = (l) => SIGNALS.find(s => s.match(l)) || TRACKED;

export default function PulsePage({ onSelect }) {
  const liveLeads = useStore(s => s.liveLeads);
  const noWebsiteLeads = useStore(s => s.noWebsiteLeads);
  const [active, setActive] = useState(null);       // signal id filter
  const [hover, setHover] = useState(null);
  const [view, setView] = useState('globe');   // globe | map
  const [dragging, setDragging] = useState(false);

  const points = useMemo(() => {
    const all = [...(liveLeads || []), ...(noWebsiteLeads || [])];
    return all
      .filter(l => l.coords && Number.isFinite(l.coords.lat) && Number.isFinite(l.coords.lng))
      .map(l => ({ lead: l, signal: signalFor(l) }));
  }, [liveLeads, noWebsiteLeads]);

  const shown = useMemo(
    () => (active ? points.filter(p => p.signal.id === active) : points),
    [points, active],
  );

  // Fit the view to whatever is held. A fixed extent would put a Houston book in
  // the corner of a map of Texas.
  const box = useMemo(() => {
    if (!points.length) return null;
    // Percentile bounds, not min/max. A single stray lead — a search that
    // wandered into another state — stretched the extent across half a country
    // and squashed the actual metro into a few pixels. Trimming the outer 2%
    // each way keeps the view on where the book really is; the strays still
    // plot, they just sit at the edge instead of dictating the frame.
    const pct = (arr, q) => {
      const a = [...arr].sort((x, y) => x - y);
      return a[Math.min(a.length - 1, Math.max(0, Math.floor(a.length * q)))];
    };
    const lats = points.map(p => p.lead.coords.lat);
    const lngs = points.map(p => p.lead.coords.lng);
    const pad = 0.02;
    return {
      minLat: pct(lats, 0.02) - pad, maxLat: pct(lats, 0.98) + pad,
      minLng: pct(lngs, 0.02) - pad, maxLng: pct(lngs, 0.98) + pad,
    };
  }, [points]);

  const project = (c) => {
    if (!box) return { x: 50, y: 50 };
    const clamp = (n) => Math.max(1.5, Math.min(98.5, n));
    const x = clamp(((c.lng - box.minLng) / (box.maxLng - box.minLng)) * 100);
    // Latitude grows upward, SVG y grows downward.
    const y = clamp((1 - (c.lat - box.minLat) / (box.maxLat - box.minLat)) * 100);
    return { x, y };
  };

  const counts = useMemo(() => {
    const c = {};
    for (const s of ALL_BANDS) c[s.id] = points.filter(p => p.signal.id === s.id).length;
    return c;
  }, [points]);

  const complaints = useMemo(
    () => points.filter(p => p.signal.id === 'complaint')
      .sort((a, b) => (a.lead.recentComplaint?.daysAgo ?? 1e9) - (b.lead.recentComplaint?.daysAgo ?? 1e9)),
    [points],
  );

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <Radio size={20} className="text-emerald-400" />
        <h1 className="text-2xl font-bold text-white">Pulse</h1>
        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
          Live
        </span>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        {points.length.toLocaleString()} of your leads placed at their real coordinates, coloured by why they are worth a call.
      </p>

      {!points.length ? (
        <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-10 text-center">
          <Globe size={28} className="text-slate-700 mx-auto mb-3" />
          <div className="text-sm text-slate-400">No leads with coordinates yet.</div>
          <div className="text-xs text-slate-600 mt-1">Open Leads and let the book build — points appear as they arrive.</div>
        </div>
      ) : (
        <>
          {/* Signal filters */}
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <div className="flex rounded-lg border border-white/[0.06] overflow-hidden mr-1">
              {[['globe', Globe, 'Globe'], ['map', MapIcon, 'Map']].map(([id, Icon, label]) => (
                <button key={id} onClick={() => setView(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition ${view === id ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-white'}`}>
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>
            <button onClick={() => setActive(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${!active ? 'bg-white/[0.08] border-white/20 text-white' : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'}`}>
              All {points.length}
            </button>
            {ALL_BANDS.map(s => (
              <button key={s.id} onClick={() => setActive(active === s.id ? null : s.id)}
                disabled={!counts[s.id]}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition disabled:opacity-30 ${active === s.id ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                style={active === s.id
                  ? { background: `${s.colour}22`, borderColor: `${s.colour}66` }
                  : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: s.colour }} />
                {s.label} {counts[s.id]}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
            {/* ── Map ─────────────────────────────────────────────────── */}
            <div className="relative rounded-2xl border border-white/[0.06] bg-[#05070a] overflow-hidden aspect-[4/3]">
              {view === 'globe' ? (
                <>
                  <Canvas camera={{ position: [0, 0, 2.6], fov: 45 }} dpr={[1, 1.75]}
                    style={{ background: 'transparent' }}>
                    <Suspense fallback={null}>
                      <GlobeScene points={shown} onSelect={onSelect} setHover={setHover} dragging={dragging} />
                    </Suspense>
                    <OrbitControls
                      enablePan={false}
                      minDistance={1.35}
                      maxDistance={4}
                      rotateSpeed={0.5}
                      onStart={() => setDragging(true)}
                      onEnd={() => setDragging(false)}
                    />
                  </Canvas>
                  <div className="absolute top-3 left-4 text-[11px] text-slate-500 pointer-events-none">
                    {shown.length.toLocaleString()} plotted · drag to turn · scroll to zoom
                  </div>
                </>
              ) : (
              <>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                <defs>
                  <pattern id="pulse-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path d="M8 0H0V8" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.2" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#pulse-grid)" />
              </svg>

              {shown.map(({ lead, signal }) => {
                const { x, y } = project(lead.coords);
                const isHot = signal.id === 'complaint';
                return (
                  <button
                    key={lead._placeId || lead.id}
                    onClick={() => onSelect?.(lead)}
                    onMouseEnter={() => setHover(lead)}
                    onMouseLeave={() => setHover(null)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    title={lead.company}
                  >
                    {isHot && (
                      <span className="absolute inset-0 -m-2 rounded-full animate-ping"
                        style={{ background: `${signal.colour}33` }} />
                    )}
                    <span className="block rounded-full transition-transform group-hover:scale-[2.2]"
                      style={{
                        width: isHot ? 9 : 6,
                        height: isHot ? 9 : 6,
                        background: signal.colour,
                        boxShadow: `0 0 10px ${signal.colour}, 0 0 22px ${signal.colour}55`,
                      }} />
                  </button>
                );
              })}
              </>
              )}

              {hover && (
                <div className="absolute left-3 bottom-3 right-3 rounded-xl border border-white/10 bg-black/85 backdrop-blur px-3 py-2 pointer-events-none">
                  <div className="text-sm font-semibold text-white truncate">{hover.company}</div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {hover.location}
                    {hover.revenueFormatted ? ` · est. ${hover.revenueFormatted}` : ''}
                  </div>
                </div>
              )}
            </div>

            {/* ── Just got burned ─────────────────────────────────────── */}
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-red-500/15">
                <Flame size={15} className="text-red-400" />
                <span className="text-sm font-bold text-white">Just got burned</span>
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">
                  {complaints.length}
                </span>
              </div>
              <div className="divide-y divide-white/[0.04] overflow-y-auto max-h-[430px]">
                {complaints.length === 0 && (
                  <div className="p-4 text-xs text-slate-500">
                    No recent complaints in the book. Google only returns five reviews per business
                    and skews them positive, so this stays thin — when one appears it is worth the call.
                  </div>
                )}
                {complaints.map(({ lead }) => {
                  const c = lead.recentComplaint;
                  return (
                    <button key={lead._placeId || lead.id} onClick={() => onSelect?.(lead)}
                      className="w-full text-left px-4 py-3 hover:bg-white/[0.03] transition">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{lead.company}</span>
                        <span className="text-[10px] font-bold text-red-400 shrink-0">{c.rating}★</span>
                        <span className="text-[10px] text-slate-600 shrink-0 ml-auto">{c.daysAgo}d ago</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic">“{c.text}”</p>
                      {lead.phone && (
                        <div className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1.5">
                          <PhoneCall size={11} /> {formatPhone(lead.phone)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {ALL_BANDS.map(s => (
              <div key={s.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.colour }} />
                  <span className="text-xs font-semibold text-white">{s.label}</span>
                  <span className="ml-auto text-xs text-slate-500">{counts[s.id]}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">{s.blurb}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
