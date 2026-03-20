import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { feature } from 'topojson-client';

// ============================================================================
// SENTIMENT GLOBE — Interactive 3D globe with real geography, 96 hotspots,
// click interaction, connection arcs, and Palantir-level visuals
// ============================================================================

// ── All 96 global centers from WorldMap ─────────────────────────────────────
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
  // Additional Africa
  { name: 'Accra', lat: 5.56, lng: -0.19, type: 'emerging', weight: 0.3, region: 'Africa' },
  { name: 'Dar es Salaam', lat: -6.79, lng: 39.28, type: 'emerging', weight: 0.3, region: 'Africa' },
  { name: 'Casablanca', lat: 33.57, lng: -7.59, type: 'trade', weight: 0.35, region: 'Africa' },
  { name: 'Addis Ababa', lat: 9.02, lng: 38.75, type: 'emerging', weight: 0.3, region: 'Africa' },
  { name: 'Kigali', lat: -1.94, lng: 30.06, type: 'emerging', weight: 0.25, region: 'Africa' },
  // Additional Asia
  { name: 'Osaka', lat: 34.69, lng: 135.50, type: 'financial', weight: 0.5, region: 'Asia' },
  { name: 'Hanoi', lat: 21.03, lng: 105.85, type: 'emerging', weight: 0.35, region: 'Asia' },
  { name: 'Phnom Penh', lat: 11.56, lng: 104.92, type: 'emerging', weight: 0.2, region: 'Asia' },
  { name: 'Yangon', lat: 16.87, lng: 96.20, type: 'emerging', weight: 0.25, region: 'Asia' },
  { name: 'Dhaka', lat: 23.81, lng: 90.41, type: 'emerging', weight: 0.35, region: 'Asia' },
  { name: 'Karachi', lat: 24.86, lng: 67.01, type: 'trade', weight: 0.4, region: 'Asia' },
  { name: 'Colombo', lat: 6.93, lng: 79.84, type: 'emerging', weight: 0.25, region: 'Asia' },
  { name: 'Almaty', lat: 43.24, lng: 76.95, type: 'emerging', weight: 0.25, region: 'Asia' },
  { name: 'Tashkent', lat: 41.30, lng: 69.28, type: 'emerging', weight: 0.25, region: 'Asia' },
  // Additional Europe
  { name: 'Helsinki', lat: 60.17, lng: 24.94, type: 'tech', weight: 0.4, region: 'Europe' },
  { name: 'Oslo', lat: 59.91, lng: 10.75, type: 'financial', weight: 0.45, region: 'Europe' },
  { name: 'Copenhagen', lat: 55.68, lng: 12.57, type: 'tech', weight: 0.45, region: 'Europe' },
  { name: 'Lisbon', lat: 38.72, lng: -9.14, type: 'tech', weight: 0.4, region: 'Europe' },
  { name: 'Prague', lat: 50.08, lng: 14.44, type: 'tech', weight: 0.35, region: 'Europe' },
  { name: 'Budapest', lat: 47.50, lng: 19.04, type: 'emerging', weight: 0.3, region: 'Europe' },
  { name: 'Bucharest', lat: 44.43, lng: 26.10, type: 'emerging', weight: 0.3, region: 'Europe' },
  { name: 'Athens', lat: 37.98, lng: 23.73, type: 'trade', weight: 0.3, region: 'Europe' },
  { name: 'Kyiv', lat: 50.45, lng: 30.52, type: 'emerging', weight: 0.3, region: 'Europe' },
  // Additional Americas
  { name: 'Phoenix', lat: 33.45, lng: -112.07, type: 'tech', weight: 0.45, region: 'US West' },
  { name: 'Dallas', lat: 32.78, lng: -96.80, type: 'financial', weight: 0.5, region: 'US South' },
  { name: 'Montreal', lat: 45.50, lng: -73.57, type: 'tech', weight: 0.4, region: 'Canada' },
  { name: 'Monterrey', lat: 25.69, lng: -100.32, type: 'trade', weight: 0.35, region: 'LATAM' },
  { name: 'Medellin', lat: 6.25, lng: -75.56, type: 'emerging', weight: 0.3, region: 'LATAM' },
  { name: 'Quito', lat: -0.18, lng: -78.47, type: 'emerging', weight: 0.25, region: 'LATAM' },
  { name: 'Havana', lat: 23.11, lng: -82.37, type: 'emerging', weight: 0.2, region: 'LATAM' },
  // Additional Middle East
  { name: 'Abu Dhabi', lat: 24.45, lng: 54.65, type: 'financial', weight: 0.5, region: 'MENA' },
  { name: 'Doha', lat: 25.29, lng: 51.53, type: 'financial', weight: 0.45, region: 'MENA' },
  { name: 'Kuwait City', lat: 29.38, lng: 47.99, type: 'financial', weight: 0.35, region: 'MENA' },
  { name: 'Amman', lat: 31.95, lng: 35.93, type: 'emerging', weight: 0.25, region: 'MENA' },
  { name: 'Beirut', lat: 33.89, lng: 35.50, type: 'trade', weight: 0.25, region: 'MENA' },
  // Additional Oceania
  { name: 'Auckland', lat: -36.85, lng: 174.76, type: 'trade', weight: 0.35, region: 'Oceania' },
  { name: 'Brisbane', lat: -27.47, lng: 153.03, type: 'trade', weight: 0.35, region: 'Oceania' },
  { name: 'Perth', lat: -31.95, lng: 115.86, type: 'trade', weight: 0.3, region: 'Oceania' },
];

// ── Deterministic sentiment/volume from weight + name hash ──────────────────
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildHotspots(centers) {
  return centers.map((c, i) => {
    const h = hashStr(c.name);
    const sentiment = Math.round(45 + c.weight * 40 + (h % 15));
    const volume = Math.round(100000 + c.weight * 2500000 + (h % 400000));
    return { ...c, sentiment, volume, idx: i };
  });
}

const DEFAULT_HOTSPOTS = buildHotspots(GLOBAL_CENTERS);

// ── Trending topics per region ──────────────────────────────────────────────
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

// ── Type colors ─────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  financial: '#10b981',
  tech: '#06b6d4',
  trade: '#f59e0b',
  emerging: '#a855f7',
};

// ── Deterministic connection pairs between top financial centers ─────────────
const CONNECTION_PAIRS = [
  ['New York', 'London'], ['New York', 'Tokyo'], ['New York', 'San Francisco'],
  ['London', 'Frankfurt'], ['London', 'Hong Kong'], ['London', 'Dubai'],
  ['Tokyo', 'Shanghai'], ['Tokyo', 'Seoul'], ['Tokyo', 'Singapore'],
  ['Hong Kong', 'Singapore'], ['Hong Kong', 'Shanghai'], ['Hong Kong', 'Sydney'],
  ['Singapore', 'Mumbai'], ['Singapore', 'Jakarta'],
  ['San Francisco', 'Tokyo'], ['San Francisco', 'Seattle'],
  ['Dubai', 'Mumbai'], ['Dubai', 'Riyadh'],
  ['Shanghai', 'Beijing'], ['Shanghai', 'Shenzhen'],
  ['New York', 'Chicago'], ['London', 'Paris'],
  ['Paris', 'Frankfurt'], ['Sao Paulo', 'New York'],
  ['Sydney', 'Melbourne'], ['Mumbai', 'Bangalore'],
  ['Seoul', 'Taipei'], ['Berlin', 'Stockholm'],
];

// ── Lat/lng to 3D sphere position ───────────────────────────────────────────
function latLngToVec3(lat, lng, radius = 1.005) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ── Convert topojson country polygons to 3D line segments on sphere ─────────
function countryRingToPoints(ring, radius = 1.003) {
  const pts = [];
  for (let i = 0; i < ring.length; i++) {
    const [lng, lat] = ring[i];
    pts.push(latLngToVec3(lat, lng, radius));
  }
  return pts;
}

function geometryToLineSegments(geometry, radius = 1.003) {
  const segments = [];
  const processRing = (ring) => {
    const pts = countryRingToPoints(ring, radius);
    for (let i = 0; i < pts.length - 1; i++) {
      segments.push(pts[i], pts[i + 1]);
    }
  };
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(processRing);
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(poly => poly.forEach(processRing));
  }
  return segments;
}

// ── Country borders component (real geography) ─────────────────────────────
function CountryBorders({ rotation }) {
  const [lineGeom, setLineGeom] = useState(null);

  useEffect(() => {
    let mounted = true;
    import('world-atlas/countries-110m.json').then(topoData => {
      if (!mounted) return;
      const data = topoData.default || topoData;
      const countries = feature(data, data.objects.countries);
      const allSegments = [];
      countries.features.forEach(f => {
        const segs = geometryToLineSegments(f.geometry, 1.003);
        allSegments.push(...segs);
      });
      const positions = new Float32Array(allSegments.length * 3);
      allSegments.forEach((v, i) => {
        positions[i * 3] = v.x;
        positions[i * 3 + 1] = v.y;
        positions[i * 3 + 2] = v.z;
      });
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      if (mounted) setLineGeom(geom);
    }).catch(() => {
      // Fallback: try land-110m
      import('world-atlas/land-110m.json').then(topoData => {
        if (!mounted) return;
        const data = topoData.default || topoData;
        const land = feature(data, data.objects.land);
        const allSegments = [];
        land.features.forEach(f => {
          const segs = geometryToLineSegments(f.geometry, 1.003);
          allSegments.push(...segs);
        });
        const positions = new Float32Array(allSegments.length * 3);
        allSegments.forEach((v, i) => {
          positions[i * 3] = v.x;
          positions[i * 3 + 1] = v.y;
          positions[i * 3 + 2] = v.z;
        });
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        if (mounted) setLineGeom(geom);
      }).catch(() => {});
    });
    return () => { mounted = false; };
  }, []);

  if (!lineGeom) return null;
  return (
    <lineSegments geometry={lineGeom} rotation={rotation}>
      <lineBasicMaterial color="#00ff88" transparent opacity={0.12} />
    </lineSegments>
  );
}

// ── Globe surface ───────────────────────────────────────────────────────────
function GlobeSurface() {
  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        color="#050a08"
        roughness={0.9}
        metalness={0.1}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

// ── Atmosphere glow (larger transparent sphere with emerald tint) ───────────
function AtmosphereGlow() {
  const ref = useRef();
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(0.0, 1.0, 0.53, 1.0) * intensity * 0.4;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  return <mesh ref={ref} scale={[1.15, 1.15, 1.15]} material={material}>
    <sphereGeometry args={[1, 48, 48]} />
  </mesh>;
}

// ── Animated hotspot dot ────────────────────────────────────────────────────
function HotspotDot({ hotspot, position, isSelected, isHovered, onClick, onPointerOver, onPointerOut }) {
  const coreRef = useRef();
  const pulseRef = useRef();
  const haloRef = useRef();

  const sentiment = hotspot.sentiment;
  const color = TYPE_COLORS[hotspot.type] || '#00ff88';
  const intensity = hotspot.weight || 0.5;
  const baseSize = 0.008 + intensity * 0.016;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulseSpeed = 1.5 + intensity * 2;
    const pulseScale = 1 + Math.sin(t * pulseSpeed + hotspot.idx * 0.7) * 0.4 * intensity;

    if (pulseRef.current) {
      pulseRef.current.scale.setScalar(pulseScale);
      pulseRef.current.material.opacity = (0.25 - Math.sin(t * pulseSpeed + hotspot.idx * 0.7) * 0.12) * intensity;
    }
    if (haloRef.current) {
      haloRef.current.material.opacity = isSelected ? 0.6 + Math.sin(t * 3) * 0.2 : 0;
      haloRef.current.scale.setScalar(isSelected ? 1.8 + Math.sin(t * 2) * 0.3 : 0);
    }
  });

  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Invisible larger hit target */}
      <mesh
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Selection halo ring */}
      <mesh ref={haloRef}>
        <ringGeometry args={[baseSize * 2.5, baseSize * 3.5, 32]} />
        <meshBasicMaterial color="white" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Pulse ring */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[baseSize * 2.5, 12, 12]} />
        <meshBasicMaterial color={colorObj} transparent opacity={0.15} depthWrite={false} />
      </mesh>

      {/* Core dot */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[isHovered ? baseSize * 1.5 : baseSize, 12, 12]} />
        <meshBasicMaterial color={colorObj} />
      </mesh>

      {/* Glow sprite */}
      <sprite scale={[baseSize * 8, baseSize * 8, 1]}>
        <spriteMaterial
          color={colorObj}
          transparent
          opacity={0.15 + intensity * 0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  );
}

// ── Detail card shown via Html overlay ──────────────────────────────────────
function HotspotDetailCard({ hotspot, position, onClose }) {
  const topics = REGION_TOPICS[hotspot.region] || ['Market Growth', 'Digital Transform', 'Trade Expansion'];
  const typeColor = TYPE_COLORS[hotspot.type] || '#00ff88';
  const sentimentLabel = hotspot.sentiment >= 75 ? 'Bullish' : hotspot.sentiment >= 55 ? 'Neutral' : 'Bearish';
  const sentimentColor = hotspot.sentiment >= 75 ? '#10b981' : hotspot.sentiment >= 55 ? '#f59e0b' : '#ef4444';

  return (
    <Html position={[position.x * 1.15, position.y * 1.15, position.z * 1.15]} center distanceFactor={4} zIndexRange={[100, 0]}>
      <div
        className="pointer-events-auto select-none"
        style={{ width: 260 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-xl border border-white/10 bg-black/95 backdrop-blur-xl p-4 shadow-2xl"
          style={{ borderColor: typeColor + '30' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: typeColor, boxShadow: `0 0 6px ${typeColor}` }} />
                <span className="text-sm font-bold text-white">{hotspot.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider"
                  style={{ color: typeColor, background: typeColor + '18', border: `1px solid ${typeColor}30` }}>
                  {hotspot.type}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 ml-[18px]">{hotspot.region}</div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-0.5 -mt-1 -mr-1">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg bg-white/5 border border-white/5 p-2">
              <div className="text-[8px] uppercase tracking-wider text-slate-500 mb-0.5">Sentiment</div>
              <div className="text-xs font-bold" style={{ color: sentimentColor }}>
                {hotspot.sentiment}% <span className="text-[8px] font-normal">{sentimentLabel}</span>
              </div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/5 p-2">
              <div className="text-[8px] uppercase tracking-wider text-slate-500 mb-0.5">Volume</div>
              <div className="text-xs font-bold text-white">{(hotspot.volume / 1000).toFixed(0)}K</div>
            </div>
          </div>

          <div className="mb-2">
            <div className="text-[8px] uppercase tracking-wider text-slate-500 mb-1">Trending</div>
            <div className="flex flex-wrap gap-1">
              {topics.map((t, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded text-[8px] bg-white/5 border border-white/8 text-slate-400">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Html>
  );
}

// ── Connection arc between two cities ───────────────────────────────────────
function ConnectionArc({ from, to, dashOffset }) {
  const curve = useMemo(() => {
    const dist = from.distanceTo(to);
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const arcHeight = 1.0 + dist * 0.35;
    mid.normalize().multiplyScalar(arcHeight);
    return new THREE.QuadraticBezierCurve3(from, mid, to);
  }, [from, to]);

  const lineRef = useRef();

  useFrame(({ clock }) => {
    if (lineRef.current) {
      lineRef.current.material.dashOffset = -clock.getElapsedTime() * 0.3;
    }
  });

  const geometry = useMemo(() => {
    const points = curve.getPoints(48);
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, [curve]);

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineDashedMaterial
        color="#00ff88"
        transparent
        opacity={0.12}
        dashSize={0.03}
        gapSize={0.02}
        depthWrite={false}
      />
    </line>
  );
}

// ── Camera zoom controller ──────────────────────────────────────────────────
function CameraController({ target, controlsRef }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 2.8));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (target) {
      const dir = target.clone().normalize();
      targetPos.current = dir.clone().multiplyScalar(2.0);
      targetLookAt.current = dir.clone().multiplyScalar(0.3);
    } else {
      targetPos.current = new THREE.Vector3(0, 0, 2.8);
      targetLookAt.current = new THREE.Vector3(0, 0, 0);
    }
  }, [target]);

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.03);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 0.03);
      controlsRef.current.update();
    }
  });

  return null;
}

// ── Main Globe Scene ────────────────────────────────────────────────────────
function GlobeScene({ hotspots, onSelectCenter, selectedCenter }) {
  const controlsRef = useRef();
  const groupRef = useRef();
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [cameraTarget, setCameraTarget] = useState(null);

  // Build positions
  const positions = useMemo(() =>
    hotspots.map(h => ({
      ...h,
      vec: latLngToVec3(h.lat, h.lng, 1.005),
    }))
  , [hotspots]);

  // Build name->position lookup
  const nameToPos = useMemo(() => {
    const map = {};
    positions.forEach(p => { map[p.name] = p.vec; });
    return map;
  }, [positions]);

  // Build connection arcs (deterministic)
  const arcs = useMemo(() => {
    return CONNECTION_PAIRS
      .filter(([a, b]) => nameToPos[a] && nameToPos[b])
      .map(([a, b]) => ({ from: nameToPos[a], to: nameToPos[b], key: `${a}-${b}` }));
  }, [nameToPos]);

  // Sync external selectedCenter prop
  useEffect(() => {
    if (selectedCenter) {
      const idx = positions.findIndex(p => p.name === selectedCenter);
      if (idx >= 0) {
        setSelectedIdx(idx);
        setCameraTarget(positions[idx].vec.clone());
      }
    } else {
      setSelectedIdx(null);
      setCameraTarget(null);
    }
  }, [selectedCenter, positions]);

  const handleClick = useCallback((idx) => {
    const newIdx = selectedIdx === idx ? null : idx;
    setSelectedIdx(newIdx);
    if (newIdx !== null) {
      const h = positions[newIdx];
      setCameraTarget(h.vec.clone());
      if (onSelectCenter) onSelectCenter(h);
    } else {
      setCameraTarget(null);
      if (onSelectCenter) onSelectCenter(null);
    }
  }, [selectedIdx, positions, onSelectCenter]);

  // Compute line lengths for dashed material
  useEffect(() => {
    // Force compute line distances on arc lines after mount
    const timer = setTimeout(() => {
      if (groupRef.current) {
        groupRef.current.traverse(child => {
          if (child.isLine && child.material && child.material.isLineDashedMaterial) {
            child.computeLineDistances();
          }
        });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [arcs]);

  const currentRotation = useMemo(() => [0, 0, 0], []);

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={0.4} color="#ffffff" />
      <pointLight position={[-3, -2, 4]} intensity={0.2} color="#00ff88" />

      <CameraController target={cameraTarget} controlsRef={controlsRef} />

      <group ref={groupRef}>
        {/* Globe surface */}
        <GlobeSurface />

        {/* Atmosphere glow */}
        <AtmosphereGlow />

        {/* Real country borders */}
        <CountryBorders rotation={currentRotation} />

        {/* Connection arcs */}
        {arcs.map((arc) => (
          <ConnectionArc key={arc.key} from={arc.from} to={arc.to} />
        ))}

        {/* Hotspot dots */}
        {positions.map((h, i) => (
          <HotspotDot
            key={h.name}
            hotspot={h}
            position={h.vec}
            isSelected={selectedIdx === i}
            isHovered={hoveredIdx === i}
            onClick={(e) => { e.stopPropagation(); handleClick(i); }}
            onPointerOver={(e) => { e.stopPropagation(); setHoveredIdx(i); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHoveredIdx(null); document.body.style.cursor = 'auto'; }}
          />
        ))}

        {/* Selected hotspot detail card */}
        {selectedIdx !== null && positions[selectedIdx] && (
          <HotspotDetailCard
            hotspot={positions[selectedIdx]}
            position={positions[selectedIdx].vec}
            onClose={() => { setSelectedIdx(null); setCameraTarget(null); if (onSelectCenter) onSelectCenter(null); }}
          />
        )}

        {/* Hovered hotspot label */}
        {hoveredIdx !== null && hoveredIdx !== selectedIdx && positions[hoveredIdx] && (
          <Html
            position={[
              positions[hoveredIdx].vec.x * 1.08,
              positions[hoveredIdx].vec.y * 1.08,
              positions[hoveredIdx].vec.z * 1.08,
            ]}
            center
            distanceFactor={4}
            zIndexRange={[50, 0]}
          >
            <div className="pointer-events-none px-2 py-1 rounded bg-black/90 border border-white/10 text-[10px] text-white whitespace-nowrap shadow-lg">
              <span className="font-semibold">{positions[hoveredIdx].name}</span>
              <span className="text-slate-400 ml-1.5">{positions[hoveredIdx].sentiment}%</span>
            </div>
          </Html>
        )}
      </group>

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={1.5}
        maxDistance={4.5}
        autoRotate={selectedIdx === null}
        autoRotateSpeed={0.4}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={(5 * Math.PI) / 6}
        dampingFactor={0.05}
        enableDamping
      />
    </>
  );
}

// ── Exported Component ──────────────────────────────────────────────────────
export default function SentimentGlobe({ data, onSelectCenter, selectedCenter }) {
  const hotspots = useMemo(() => {
    if (data && data.length > 0) return data;
    return DEFAULT_HOTSPOTS;
  }, [data]);

  return (
    <div className="w-full relative" style={{ minHeight: 400 }}>
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent', height: '100%', minHeight: 400 }}
        dpr={[1, 2]}
      >
        <GlobeScene hotspots={hotspots} onSelectCenter={onSelectCenter} selectedCenter={selectedCenter} />
      </Canvas>

      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 flex gap-3 text-[9px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS.financial }} />Financial</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS.tech }} />Tech</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS.trade }} />Trade</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS.emerging }} />Emerging</span>
      </div>

      {/* Interaction hint */}
      <div className="absolute bottom-3 right-3 text-[9px] text-slate-600">
        Click a city to explore  |  Scroll to zoom  |  Drag to rotate
      </div>
    </div>
  );
}
