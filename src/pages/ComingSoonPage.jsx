// =============================================================================
// GOATED — Coming Soon cover page (v7.5.2 — degen palette)
// -----------------------------------------------------------------------------
// Full-screen gate that hides the entire app until the operator flips
// VITE_LAUNCH_READY=true in Vercel env vars.
//
// Visual:
//   - Oversized 3D goat head (cursor tracking via existing GoatLogo)
//   - "GOATED" wordmark with red→orange→amber gradient sweep (degen palette)
//   - Drift particles tinted along the same gradient
//   - Halo pulses (red top-left, orange bottom-right)
//   - Tiny subtext line, no CTA, no email capture, no marketing
//
// The full app codebase still ships in the bundle but routes are gated.
// Operator can preview by setting localStorage.goated_operator_preview='1'
// or by appending ?preview=1 to the URL hash.
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';
import GoatLogo from '../components/GoatLogo';

// Pick a goat-head pixel size from the viewport. GoatLogo's wrapper applies
// width/height inline (numeric `size` prop), so we drive it imperatively
// rather than via CSS clamp — keeps the SVG perfectly square at every breakpoint.
function useResponsiveGoatSize() {
  const compute = () => {
    if (typeof window === 'undefined') return 280;
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Cap by both width AND height so it never crowds the title vertically.
    const byWidth = Math.min(360, Math.max(200, w * 0.32));
    const byHeight = h * 0.36;
    return Math.round(Math.min(byWidth, byHeight));
  };
  const [size, setSize] = useState(compute);
  useEffect(() => {
    const onResize = () => setSize(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

// ─── Degen palette (matches DEGEN MODE in useStore) ─────────────────────────
// All warm: red → orange → amber. No green anywhere.
const PALETTE = {
  red:    [239, 68, 68],   // #ef4444
  redLt:  [248, 113, 113], // #f87171
  orange: [249, 115, 22],  // #f97316
  orangeLt:[251, 146, 60], // #fb923c
  amber:  [245, 158, 11],  // #f59e0b
  amberLt:[251, 191, 36],  // #fbbf24
};

// ─── Animated particles canvas (red/orange/amber only) ─────────────────────
function DegenParticles() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // 70 particles drifting upward at varying speeds
    particlesRef.current = Array.from({ length: 70 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight + window.innerHeight,
      r: Math.random() * 3 + 0.8,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(Math.random() * 0.7 + 0.2),
      hue: Math.random(), // 0..1, particle's phase offset on the warm sweep
      life: Math.random(),
    }));

    let t = 0;
    const tick = () => {
      t += 0.005;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.005;

        if (p.y < -10) {
          p.y = window.innerHeight + 10;
          p.x = Math.random() * window.innerWidth;
          p.life = 0;
        }

        // Color sweeps red → orange → amber → orange → red on a sine, offset by p.hue
        const phase = (Math.sin(t + p.hue * Math.PI * 2) + 1) / 2; // 0..1
        // Pick between three warm anchors: red (0), orange (0.5), amber (1)
        let r, g, b;
        if (phase < 0.5) {
          // red → orange
          const k = phase * 2;
          r = Math.round(PALETTE.red[0] * (1 - k) + PALETTE.orange[0] * k);
          g = Math.round(PALETTE.red[1] * (1 - k) + PALETTE.orange[1] * k);
          b = Math.round(PALETTE.red[2] * (1 - k) + PALETTE.orange[2] * k);
        } else {
          // orange → amber
          const k = (phase - 0.5) * 2;
          r = Math.round(PALETTE.orange[0] * (1 - k) + PALETTE.amber[0] * k);
          g = Math.round(PALETTE.orange[1] * (1 - k) + PALETTE.amber[1] * k);
          b = Math.round(PALETTE.orange[2] * (1 - k) + PALETTE.amber[2] * k);
        }
        const alpha = Math.min(1, p.life) * 0.55;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.shadowBlur = 18;
        ctx.shadowColor = `rgba(${r},${g},${b},${alpha * 0.6})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

// ─── GOATED wordmark — Unbounded display, dialed back for readability ──────
function GoatedTitle() {
  return (
    <h1
      className="relative select-none m-0 mx-auto whitespace-nowrap"
      style={{
        // Unbounded 700 (was 800) + slightly looser letter-spacing reads
        // less "futuristic crypto" and more "premium business". Still
        // distinct, but doesn't shout. Falls back to Space Grotesk if
        // Unbounded fails to load — both are wide enough to hold the
        // gradient sweep without looking generic.
        fontFamily: '"Unbounded", "Space Grotesk", system-ui, sans-serif',
        fontWeight: 700,
        letterSpacing: '0',
        fontSize: 'clamp(2.5rem, 10.5vw, 8.5rem)',
        lineHeight: 1.18,
        padding: '0.1em 0.08em',
        maxWidth: '100%',
        backgroundImage:
          'linear-gradient(120deg, #ef4444 0%, #f87171 18%, #f97316 38%, #fbbf24 58%, #f97316 78%, #ef4444 100%)',
        backgroundSize: '300% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        filter:
          'drop-shadow(0 0 36px rgba(249,115,22,0.22)) drop-shadow(0 0 72px rgba(239,68,68,0.14))',
        animation: 'goatedGradientShift 8s ease-in-out infinite',
      }}
    >
      GOATED
    </h1>
  );
}

// ─── Coming Soon page ──────────────────────────────────────────────────────
export default function ComingSoonPage() {
  const goatSize = useResponsiveGoatSize();

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center px-4 sm:px-6 py-10"
      style={{ cursor: 'crosshair' }}
    >
      {/* Inline keyframes — kept local so this file is self-contained. */}
      <style>{`
        @keyframes goatedGradientShift {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes goatedHaloPulse {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50%      { opacity: 0.35; transform: scale(1.04); }
        }
      `}</style>

      {/* Halos (top-left red, bottom-right orange — degen warmth) */}
      <div
        className="absolute -top-40 -left-40 w-[40vw] h-[40vw] rounded-full blur-[120px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(239,68,68,0.32), transparent 70%)',
          animation: 'goatedHaloPulse 7s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[45vw] h-[45vw] rounded-full blur-[140px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.32), transparent 70%)',
          animation: 'goatedHaloPulse 9s ease-in-out infinite reverse',
        }}
      />

      {/* Particle layer */}
      <DegenParticles />

      {/* Centerpiece — goat → wordmark → subtext, all dead-center, no overlap */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[min(92vw,640px)] min-w-0">
        {/*
          3D goat — size driven by viewport via useResponsiveGoatSize().
          flex-shrink-0 prevents the row from collapsing, mb-2 gives a clean
          gap into the wordmark with no overlap.
        */}
        <div className="flex-shrink-0 mb-2 sm:mb-3">
          <GoatLogo size={goatSize} />
        </div>

        {/* min-width:0 lets the wordmark shrink rather than overflow on narrow viewports */}
        <div className="w-full min-w-0 flex flex-col items-center">
          <GoatedTitle />
        </div>

        {/* Tiny subtext — no CTA, no form, no marketing */}
        <p
          className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-slate-400/80 max-w-md leading-relaxed px-2"
          style={{
            fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.01em',
          }}
        >
          Probably the greatest thing that&apos;s ever happened to small business.
          <span className="block text-[10px] text-slate-600 mt-1.5 font-normal">
            AI for local service businesses. Private. By application. Texas-built.
          </span>
        </p>
      </div>

      {/* Tiny status pip, bottom-center */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 text-[9px] text-slate-700 tracking-widest uppercase"
        style={{ fontFamily: '"Space Grotesk", monospace' }}
      >
        <span className="w-1 h-1 rounded-full bg-orange-400 animate-pulse" />
        <span>v7.5.6 · private · access by application</span>
      </div>
    </div>
  );
}
