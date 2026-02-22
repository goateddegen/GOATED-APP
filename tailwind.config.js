/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: '#10b981',
        neon: { green: '#00ff88', cyan: '#00d4ff', pink: '#ff006e', purple: '#a855f7', orange: '#ff8800' },
        surface: { 0: '#030712', 1: '#0f172a', 2: '#1e293b', 3: '#111827' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
      animation: {
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'ticker': 'ticker 30s linear infinite',
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
      },
      keyframes: {
        glow: { '0%,100%': { boxShadow: '0 0 5px rgba(16,185,129,0.5)' }, '50%': { boxShadow: '0 0 20px rgba(16,185,129,0.8)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        ticker: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-33.33%)' } },
        pulseNeon: { '0%,100%': { opacity: '0.6', textShadow: '0 0 5px currentColor' }, '50%': { opacity: '1', textShadow: '0 0 20px currentColor, 0 0 40px currentColor' } },
      }
    },
  },
  plugins: [],
}
