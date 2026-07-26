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
          manualChunks: {
            three: ['three', '@react-three/fiber', '@react-three/drei'],
            vendor: ['react', 'react-dom', 'framer-motion', 'zustand'],
          }
        }
      }
    }
  }
})
