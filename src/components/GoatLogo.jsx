import React, { useEffect, useRef } from 'react';

const GoatLogo = React.memo(function GoatLogo({ size = 200, className = '' }) {
  const ref = useRef(null);
  const svgRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  // Eye element refs for direct DOM manipulation
  const eyeLRef = useRef(null);
  const eyeRRef = useRef(null);
  const hlLRef = useRef(null);
  const hlRRef = useRef(null);
  const hl2LRef = useRef(null);
  const hl2RRef = useRef(null);

  useEffect(() => {
    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      smoothRef.current.x = lerp(smoothRef.current.x, mouseRef.current.x, 0.15);
      smoothRef.current.y = lerp(smoothRef.current.y, mouseRef.current.y, 0.15);
      const { x, y } = smoothRef.current;

      // Update SVG transform directly — no React re-renders
      if (svgRef.current) {
        const s = 1 + Math.abs(x + y) * 0.003;
        svgRef.current.style.transform = `perspective(800px) rotateY(${x}deg) rotateX(${-y}deg) scale(${s})`;
      }

      // Move eyes via DOM — zero re-renders
      const ex = x * 0.18;
      const ey = y * 0.12;
      if (eyeLRef.current) { eyeLRef.current.setAttribute('cx', 78 + ex); eyeLRef.current.setAttribute('cy', 102 + ey); }
      if (eyeRRef.current) { eyeRRef.current.setAttribute('cx', 122 + ex); eyeRRef.current.setAttribute('cy', 102 + ey); }
      if (hlLRef.current) { hlLRef.current.setAttribute('cx', 76 + x * 0.12); hlLRef.current.setAttribute('cy', 100 + y * 0.09); }
      if (hlRRef.current) { hlRRef.current.setAttribute('cx', 120 + x * 0.12); hlRRef.current.setAttribute('cy', 100 + y * 0.09); }
      if (hl2LRef.current) { hl2LRef.current.setAttribute('cx', 80 + x * 0.14); hl2LRef.current.setAttribute('cy', 104 + y * 0.1); }
      if (hl2RRef.current) { hl2RRef.current.setAttribute('cx', 124 + x * 0.14); hl2RRef.current.setAttribute('cy', 104 + y * 0.1); }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // Cache the bounding rect to avoid layout thrashing on every mousemove
    let cachedRect = null;
    let rectCacheTimer = null;
    const getRect = () => {
      if (!cachedRect && ref.current) {
        cachedRect = ref.current.getBoundingClientRect();
        // Invalidate cache after 1s to handle scrolling/resizing
        clearTimeout(rectCacheTimer);
        rectCacheTimer = setTimeout(() => { cachedRect = null; }, 1000);
      }
      return cachedRect;
    };

    const onMove = (e) => {
      const rect = getRect();
      if (!rect) return;
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 40;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 40;
      mouseRef.current.x = Math.max(-30, Math.min(30, x));
      mouseRef.current.y = Math.max(-30, Math.min(30, y));
    };

    // Invalidate rect cache on scroll/resize
    const invalidateRect = () => { cachedRect = null; };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('scroll', invalidateRect, { passive: true });
    window.addEventListener('resize', invalidateRect, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', invalidateRect);
      window.removeEventListener('resize', invalidateRect);
      clearTimeout(rectCacheTimer);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={ref} style={{ width: size, height: size }} className={`relative ${className}`}>
      {/* Multi-layer ambient glow */}
      <div className="absolute inset-0 rounded-full blur-[60px] opacity-30" style={{ background: 'radial-gradient(circle, #10b98150 0%, transparent 70%)', animation: 'pulse 4s ease-in-out infinite' }} />
      <div className="absolute inset-[-10%] rounded-full blur-[80px] opacity-15" style={{ background: 'radial-gradient(circle, #a855f730 0%, transparent 60%)', animation: 'pulse 5s ease-in-out infinite 1s' }} />
      <div className="absolute inset-4 rounded-full blur-[40px] opacity-25" style={{ background: 'radial-gradient(circle, #06b6d440 0%, transparent 60%)', animation: 'pulse 3s ease-in-out infinite 0.5s' }} />

      <svg ref={svgRef} viewBox="0 0 200 200" className="relative w-full h-full" style={{ willChange: 'transform, filter' }}>
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#030712" />
          </linearGradient>
          <linearGradient id="hornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="glowGrad">
            <stop offset="0%" stopColor="#10b981">
              <animate attributeName="stop-color" values="#10b981;#06b6d4;#a855f7;#10b981" dur="4s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#06b6d4">
              <animate attributeName="stop-color" values="#06b6d4;#a855f7;#10b981;#06b6d4" dur="4s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          <linearGradient id="eyeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="softGlow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="heavyGlow"><feGaussianBlur stdDeviation="6" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        {/* Outer rotating ring */}
        <circle cx="100" cy="100" r="96" fill="none" stroke="url(#glowGrad)" strokeWidth="0.5" opacity="0.4">
          <animateTransform attributeName="transform" type="rotate" values="0 100 100;360 100 100" dur="20s" repeatCount="indefinite" />
        </circle>

        {/* Inner orbits */}
        <circle cx="100" cy="100" r="94" fill="none" stroke="url(#glowGrad)" strokeWidth="1.5" filter="url(#glow)" opacity="0.5">
          <animate attributeName="stroke-dasharray" values="0,600;100,500;200,400;300,300;200,400;100,500;0,600" dur="10s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="100" r="88" fill="none" stroke="url(#glowGrad)" strokeWidth="0.8" opacity="0.25">
          <animate attributeName="stroke-dasharray" values="600,0;500,100;400,200;300,300;400,200;500,100;600,0" dur="8s" repeatCount="indefinite" />
        </circle>

        {/* Body */}
        <ellipse cx="100" cy="108" rx="52" ry="56" fill="url(#bodyGrad)" stroke="rgba(16,185,129,0.15)" strokeWidth="1.5" />
        <ellipse cx="100" cy="108" rx="52" ry="56" fill="none" stroke="url(#glowGrad)" strokeWidth="0.5" opacity="0.3" filter="url(#softGlow)" />

        {/* Left horn */}
        <path d="M58 82 Q48 50 35 28 Q42 35 48 42 Q54 58 58 74 Z" fill="url(#hornGrad)" />
        <path d="M56 80 Q46 48 33 26" fill="none" stroke="#10b981" strokeWidth="2.5" filter="url(#heavyGlow)" opacity="0.9">
          <animate attributeName="stroke-opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite" />
        </path>
        <circle cx="38" cy="35" r="2" fill="#10b981" opacity="0" filter="url(#glow)">
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin="0.5s" />
          <animate attributeName="r" values="1;3;1" dur="3s" repeatCount="indefinite" begin="0.5s" />
        </circle>

        {/* Right horn */}
        <path d="M142 82 Q152 50 165 28 Q158 35 152 42 Q146 58 142 74 Z" fill="url(#hornGrad)" />
        <path d="M144 80 Q154 48 167 26" fill="none" stroke="#10b981" strokeWidth="2.5" filter="url(#heavyGlow)" opacity="0.9">
          <animate attributeName="stroke-opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite" begin="0.3s" />
        </path>
        <circle cx="162" cy="35" r="2" fill="#06b6d4" opacity="0" filter="url(#glow)">
          <animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" begin="1s" />
          <animate attributeName="r" values="1;3;1" dur="2.5s" repeatCount="indefinite" begin="1s" />
        </circle>

        {/* Ears */}
        <ellipse cx="56" cy="88" rx="10" ry="18" fill="url(#bodyGrad)" transform="rotate(-15 56 88)" stroke="rgba(16,185,129,0.1)" strokeWidth="0.5" />
        <ellipse cx="144" cy="88" rx="10" ry="18" fill="url(#bodyGrad)" transform="rotate(15 144 88)" stroke="rgba(16,185,129,0.1)" strokeWidth="0.5" />

        {/* Snout */}
        <ellipse cx="100" cy="130" rx="22" ry="18" fill="#030712" stroke="rgba(16,185,129,0.08)" strokeWidth="0.5" />

        {/* Eye sockets */}
        <ellipse cx="78" cy="102" rx="10" ry="12" fill="#020617" />
        <ellipse cx="122" cy="102" rx="10" ry="12" fill="#020617" />

        {/* Eyes — controlled via refs, zero re-renders */}
        <ellipse ref={eyeLRef} cx="78" cy="102" rx="5.5" ry="7" fill="url(#eyeGlow)" filter="url(#heavyGlow)">
          <animate attributeName="ry" values="7;8;7" dur="2s" repeatCount="indefinite" />
        </ellipse>
        <ellipse ref={eyeRRef} cx="122" cy="102" rx="5.5" ry="7" fill="url(#eyeGlow)" filter="url(#heavyGlow)">
          <animate attributeName="ry" values="7;8;7" dur="2s" repeatCount="indefinite" />
        </ellipse>

        {/* Eye highlights */}
        <circle ref={hlLRef} cx="76" cy="100" r="2.5" fill="#fff" opacity="0.95" />
        <circle ref={hlRRef} cx="120" cy="100" r="2.5" fill="#fff" opacity="0.95" />
        <circle ref={hl2LRef} cx="80" cy="104" r="1" fill="#fff" opacity="0.5" />
        <circle ref={hl2RRef} cx="124" cy="104" r="1" fill="#fff" opacity="0.5" />

        {/* Nostrils */}
        <ellipse cx="92" cy="135" rx="3" ry="2.5" fill="rgba(16,185,129,0.25)" />
        <ellipse cx="108" cy="135" rx="3" ry="2.5" fill="rgba(16,185,129,0.25)" />

        {/* Mouth — smirk */}
        <path d="M86 145 Q100 155 114 143" fill="none" stroke="rgba(16,185,129,0.25)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => {
          const colors = ['#10b981', '#06b6d4', '#a855f7', '#10b981', '#06b6d4', '#f59e0b'];
          return (
            <circle key={i} r={1 + (i % 3) * 0.5} fill={colors[i % colors.length]} opacity="0" filter="url(#glow)">
              <animate attributeName="cx" values={`${45 + i * 11};${60 + i * 9};${45 + i * 11}`} dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
              <animate attributeName="cy" values={`${42 + i * 8};${28 + i * 6};${42 + i * 8}`} dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.7;0" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.2}s`} />
            </circle>
          );
        })}

        {/* Crown sparkle */}
        <text x="100" y="60" textAnchor="middle" fontSize="14" fill="#10b981" opacity="0.8" filter="url(#glow)">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
          ✦
        </text>
      </svg>
    </div>
  );
});

export default GoatLogo;

export const GoatIcon = React.memo(function GoatIcon({ className = 'w-7 h-7' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <defs>
        <linearGradient id="iconGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path d="M7 10 Q5 6 3 2" stroke="url(#iconGlow)" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 10 Q19 6 21 2" stroke="url(#iconGlow)" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="12" cy="14" rx="7" ry="7" fill="currentColor" opacity="0.1" stroke="currentColor" strokeOpacity="0.2" />
      <circle cx="9" cy="12" r="1.5" fill="#10b981">
        <animate attributeName="r" values="1.5;2;1.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="15" cy="12" r="1.5" fill="#10b981">
        <animate attributeName="r" values="1.5;2;1.5" dur="2s" repeatCount="indefinite" begin="0.3s" />
      </circle>
    </svg>
  );
});
