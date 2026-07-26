import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import apiPlugin from './vite-plugin-api.js'

export default defineConfig(({ mode }) => {
  // Serverless handlers read secrets off process.env. Vite only exposes VITE_*
  // to the client, so load the rest into process.env for the local API plugin —
  // this is what gives localhost the same live API behaviour as production.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react(), apiPlugin()],
    server: { port: 5173, host: true },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          // @react-three/* read React's internals at module-evaluation time, so
          // they MUST live in the same chunk as react/react-dom. Splitting them
          // into the `three` chunk crashed the production bundle on load —
          // `three` is imported by the entry and evaluates before `vendor`, so
          // React was still undefined ("Cannot read properties of undefined
          // (reading '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED')").
          // Bare `three` has no React dependency, so it stays split out — it's
          // ~950KB and only needed by the globe.
          manualChunks: {
            three: ['three'],
            vendor: ['react', 'react-dom', '@react-three/fiber', '@react-three/drei', 'framer-motion', 'zustand'],
          }
        }
      }
    }
  }
})
