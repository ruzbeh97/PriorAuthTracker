import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// The chart package is developed in the sibling Multi-Panel Visit Note checkout.
// Builds that only have this repo (CI, Vercel) read it from the git submodule.
const siblingChart = path.resolve(
  rootDir,
  '../Multi-Panel Visit Note/packages/patient-chart',
)
const vendorChart = path.resolve(
  rootDir,
  'vendor/multi-panel-visit-note/packages/patient-chart',
)
const patientChart = fs.existsSync(siblingChart) ? siblingChart : vendorChart

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@visit-note/patient-chart': path.join(patientChart, 'src/index.ts'),
    },
  },
  server: {
    fs: {
      allow: [rootDir, patientChart],
    },
  },
  optimizeDeps: {
    exclude: ['@visit-note/patient-chart'],
  },
})
