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
          // `three` and the react-three bindings are only reachable from the
          // Trends page, which is disabled. Naming them here put a 666 kB chunk
          // (171 kB gzipped) into the entry's modulepreload list, so every
          // visitor downloaded a 3D engine for a page they cannot open — most
          // of the payload on a phone, for nothing.
          //
          // Left unnamed, Rollup keeps them inside the lazily-imported page
          // chunk and they are fetched only if that page is ever reached.
          manualChunks: {
            vendor: ['react', 'react-dom', 'framer-motion', 'zustand'],
          }
        }
      }
    }
  }
})
