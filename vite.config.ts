import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const patientChart = path.resolve(
  rootDir,
  '../Multi-Panel Visit Note/packages/patient-chart',
)

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
