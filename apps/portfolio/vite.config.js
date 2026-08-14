import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: __dirname,
  envDir: resolve(__dirname, '../..'),
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../../shared'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    outDir: resolve(__dirname, '../../dist/portfolio'),
    emptyOutDir: true,
  },
  esbuild: {
    loader: 'jsx',
    include: /(?:src|shared)\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    include: ['vaul', '@radix-ui/react-dialog'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
})
