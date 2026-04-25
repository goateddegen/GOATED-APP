// =============================================================================
// GOATED — Coming Soon cover page
// -----------------------------------------------------------------------------
// Full-screen gate that hides the entire app until the operator flips
// VITE_LAUNCH_READY=true in Vercel env vars.
//
// Until then visitors see:
//   - 3D goat head with cursor tracking (existing GoatLogo component)
//   - "GOATED" gradient text animating between red and green
//   - Background particles in matching gradient colors
//   - Email capture (optional, stored in localStorage for now — wire to
//     Supabase when launch ready)
//
// The full app codebase still ships in the bundle but routes 404 publicly.
// Operator can preview by setting VITE_LAUNCH_READY=true locally.
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';
import GoatLogo from '../components/GoatLogo';

// ─── Animated particles canvas ──────────────────────────────────────────────
function GradientParticles() {
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
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Init 60 particles drifting upward
    particlesRef.current = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight + window.innerHeight, // start below screen
      r: Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(Math.random() * 0.7 + 0.2),
      hue: Math.random(), // 0-1, used to pick from red↔green gradient
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

        // Reset particle when it drifts off the top
        if (p.y < -10) {
          p.y = window.innerHeight + 10;
          p.x = Math.random() * window.innerWidth;
          p.life = 0;
        }

        // Color interpolates between red (#ef4444) and green (#10b981) over time
        // Phase shifts by particle.hue so particles stagger their colors
        const phase = (Math.sin(t + p.hue * Math.PI * 2) + 1) / 2; // 0..1
        const r = Math.round(239 * (1 - phase) + 16 * phase);   // 239 → 16
        const g = Math.round(68 * (1 - phase) + 185 * phase);   // 68  → 185
        const b = Math.round(68 * (1 - phase) + 129 * phase);   // 68  → 129
        const alpha = Math.min(1, p.life) * 0.6;

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

// ─── Animated gradient text ─────────────────────────────────────────────────
// Pure CSS — uses a moving linear-gradient as background-clip on the text.
function GoatedTitle() {
  return (
    <h1
      className="relative font-black tracking-tighter leading-none select-none"
      style={{
        fontSize: 'clamp(4rem, 16vw, 14rem)',
        backgroundImage:
          'linear-gradient(120deg, #ef4444 0%, #f87171 18%, #10b981 50%, #34d399 70%, #ef4444 100%)',
        backgroundSize: '300% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(0 0 36px rgba(16,185,129,0.18)) drop-shadow(0 0 64px rgba(239,68,68,0.12))',
        animation: 'goatedGradientShift 8s ease-in-out infinite',
      }}
    >
      GOATED
    </h1>
  );
}

// ─── Email capture (waitlist, localStorage for now) ─────────────────────────
function WaitlistCapture() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('That doesn’t look like a valid email.');
      return;
    }
    try {
      const list = JSON.parse(localStorage.getItem('goated_waitlist') || '[]');
      if (!list.includes(email)) list.push(email);
      localStorage.setItem('goated_waitlist', JSON.stringify(list));
    } catch { /* ignore */ }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center text-sm text-emerald-300/90 font-medium">
        You’re on the list. We’ll ping you when we open access.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md mx-auto">
      <div className="flex gap-2 rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-md p-1.5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="founder@yourcompany.com"
          className="flex-1 bg-transparent outline-none px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-black transition"
          style={{
            background:
              'linear-gradient(120deg, #10b981 0%, #34d399 50%, #ef4444 100%)',
          }}
        >
          Get access
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-red-400 text-center">{error}</div>}
      <div className="mt-3 text-[11px] text-slate-600 text-center">
        Private beta. Self-serve when we open. No marketing email spam ever.
      </div>
    </form>
  );
}

// ─── Coming Soon page ───────────────────────────────────────────────────────
export default function ComingSoonPage() {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center px-6"
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

      {/* Radial halos (top-left red, bottom-right green) */}
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
          background: 'radial-gradient(circle, rgba(16,185,129,0.32), transparent 70%)',
          animation: 'goatedHaloPulse 9s ease-in-out infinite reverse',
        }}
      />

      {/* Particle layer */}
      <GradientParticles />

      {/* Centerpiece */}
      <div className="relative z-10 flex flex-col items-center gap-10 text-center max-w-2xl">
        {/* 3D goat head with cursor tracking — existing component */}
        <div className="-mb-2">
          <GoatLogo size={200} />
        </div>

        <GoatedTitle />

        <p className="text-base sm:text-lg text-slate-300/90 max-w-xl leading-relaxed font-medium">
          The greatest thing that’s ever happened to small business is on the way.
          <br />
          <span className="text-slate-500 text-sm font-normal">
            Private beta. Application-only. No upfront. We&apos;re paid when you close.
          </span>
        </p>

        <WaitlistCapture />

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-slate-600 mt-2">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
          <span className="text-slate-800">|</span>
          <span>Opening in waves — SMB operators first</span>
          <span className="text-slate-800">|</span>
          <span>13% only when we close</span>
        </div>
      </div>

      {/* Bottom-left footer */}
      <div className="absolute bottom-4 left-4 z-10 text-[10px] text-slate-700 font-mono">
        v7.5 · private · access by application
      </div>
      {/* Bottom-right operator hint (only shown when localStorage flag is set) */}
      {typeof window !== 'undefined' && localStorage.getItem('goated_operator_preview') === '1' && (
        <div className="absolute bottom-4 right-4 z-10 text-[10px] text-slate-600 font-mono">
          operator preview · set VITE_LAUNCH_READY=true to ship
        </div>
      )}
    </div>
  );
}
