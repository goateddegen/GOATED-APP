import React, { useState, useEffect, useRef } from 'react';

export default function GoatLogo({ size = 200, className = '' }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [smoothMouse, setSmoothMouse] = useState({ x: 0, y: 0 });
  const ref = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 25;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 25;
      setMouse({ x: Math.max(-20, Math.min(20, x)), y: Math.max(-20, Math.min(20, y)) });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Smooth interpolation for cursor tracking
  useEffect(() => {
    const lerp = () => {
      setSmoothMouse(prev => ({
        x: prev.x + (mouse.x - prev.x) * 0.08,
        y: prev.y + (mouse.y - prev.y) * 0.08,
      }));
      animRef.current = requestAnimationFrame(lerp);
    };
    animRef.current = requestAnimationFrame(lerp);
    return () => cancelAnimationFrame(animRef.current);
  }, [mouse]);

  return (
    <div ref={ref} style={{ width: size, height: size }} className={`relative ${className}`}>
      {/* Ambient glow layers */}
      <div className="absolute inset-0 rounded-full blur-3xl opacity-40" style={{ background: 'radial-gradient(circle, #10b98140 0%, transparent 70%)', animation: 'pulse 3s ease-in-out infinite' }} />
      <div className="absolute inset-4 rounded-full blur-2xl opacity-20" style={{ background: 'radial-gradient(circle, #06b6d430 0%, transparent 60%)', animation: 'pulse 2.5s ease-in-out infinite 0.5s' }} />

      {/* Main SVG goat with 3D perspective tracking */}
      <svg
        viewBox="0 0 200 200"
        className="relative w-full h-full drop-shadow-2xl"
        style={{
          transform: `perspective(800px) rotateY(${smoothMouse.x}deg) rotateX(${-smoothMouse.y}deg) scale(${1 + Math.abs(smoothMouse.x + smoothMouse.y) * 0.002})`,
          transition: 'filter 0.3s',
          filter: `drop-shadow(0 0 ${20 + Math.abs(smoothMouse.x) * 0.5}px rgba(16,185,129,0.5))`,
        }}
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#030712" />
          </linearGradient>
          <linearGradient id="hornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <linearGradient id="glowGrad">
            <stop offset="0%" stopColor="#10b981">
              <animate attributeName="stop-color" values="#10b981;#06b6d4;#10b981" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#06b6d4">
              <animate attributeName="stop-color" values="#06b6d4;#10b981;#06b6d4" dur="3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          <linearGradient id="eyeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="softGlow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        {/* Animated orbit ring */}
        <circle cx="100" cy="100" r="94" fill="none" stroke="url(#glowGrad)" strokeWidth="1.5" filter="url(#glow)" opacity="0.6">
          <animate attributeName="stroke-dasharray" values="0,600;150,450;300,300;450,150;600,0" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="100" r="88" fill="none" stroke="url(#glowGrad)" strokeWidth="0.5" opacity="0.3">
          <animate attributeName="stroke-dasharray" values="600,0;450,150;300,300;150,450;0,600" dur="6s" repeatCount="indefinite" />
        </circle>

        {/* Body */}
        <ellipse cx="100" cy="108" rx="52" ry="56" fill="url(#bodyGrad)" stroke="rgba(16,185,129,0.2)" strokeWidth="1" />

        {/* Left horn */}
        <path d="M58 82 Q48 50 35 28 Q42 35 48 42 Q54 58 58 74 Z" fill="url(#hornGrad)" />
        <path d="M56 80 Q46 48 33 26" fill="none" stroke="#10b981" strokeWidth="2" filter="url(#glow)" opacity="0.8">
          <animate attributeName="stroke-opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </path>

        {/* Right horn */}
        <path d="M142 82 Q152 50 165 28 Q158 35 152 42 Q146 58 142 74 Z" fill="url(#hornGrad)" />
        <path d="M144 80 Q154 48 167 26" fill="none" stroke="#10b981" strokeWidth="2" filter="url(#glow)" opacity="0.8">
          <animate attributeName="stroke-opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </path>

        {/* Ears */}
        <ellipse cx="56" cy="88" rx="10" ry="18" fill="url(#bodyGrad)" transform="rotate(-15 56 88)" />
        <ellipse cx="144" cy="88" rx="10" ry="18" fill="url(#bodyGrad)" transform="rotate(15 144 88)" />

        {/* Snout */}
        <ellipse cx="100" cy="130" rx="22" ry="18" fill="#030712" />

        {/* Eye sockets */}
        <ellipse cx="78" cy="102" rx="9" ry="11" fill="#030712" />
        <ellipse cx="122" cy="102" rx="9" ry="11" fill="#030712" />

        {/* Animated eyes with cursor tracking */}
        <ellipse cx={78 + smoothMouse.x * 0.15} cy={102 + smoothMouse.y * 0.1} rx="5" ry="6" fill="url(#eyeGlow)" filter="url(#glow)">
          <animate attributeName="ry" values="6;7;6" dur="2s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx={122 + smoothMouse.x * 0.15} cy={102 + smoothMouse.y * 0.1} rx="5" ry="6" fill="url(#eyeGlow)" filter="url(#glow)">
          <animate attributeName="ry" values="6;7;6" dur="2s" repeatCount="indefinite" />
        </ellipse>

        {/* Eye highlights */}
        <circle cx={76 + smoothMouse.x * 0.1} cy={100 + smoothMouse.y * 0.08} r="2" fill="#fff" opacity="0.9" />
        <circle cx={120 + smoothMouse.x * 0.1} cy={100 + smoothMouse.y * 0.08} r="2" fill="#fff" opacity="0.9" />

        {/* Nostrils */}
        <ellipse cx="92" cy="135" rx="3" ry="2.5" fill="rgba(16,185,129,0.3)" />
        <ellipse cx="108" cy="135" rx="3" ry="2.5" fill="rgba(16,185,129,0.3)" />

        {/* Mouth */}
        <path d="M88 145 Q100 152 112 145" fill="none" stroke="rgba(16,185,129,0.25)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <circle key={i} r="1.5" fill="#10b981" opacity="0.5" filter="url(#glow)">
            <animate attributeName="cx" values={`${60 + i * 15};${70 + i * 12};${60 + i * 15}`} dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
            <animate attributeName="cy" values={`${50 + i * 10};${40 + i * 8};${50 + i * 10}`} dur={`${2.5 + i * 0.4}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>
    </div>
  );
}

export function GoatIcon({ className = 'w-7 h-7' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 10 Q5 6 3 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 10 Q19 6 21 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="12" cy="14" rx="7" ry="7" fill="currentColor" opacity="0.15" stroke="currentColor" strokeOpacity="0.3" />
      <circle cx="9" cy="12" r="1.5" fill="#10b981" />
      <circle cx="15" cy="12" r="1.5" fill="#10b981" />
    </svg>
  );
}
