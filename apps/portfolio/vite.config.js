import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// The entry CSS's <link rel="stylesheet"> otherwise blocks first paint
// until it downloads (Lighthouse's "render-blocking requests" flag) —
// the media="print" trick loads it without blocking, then the onload
// handler swaps it to media="all" once it's actually ready. <noscript>
// keeps it working with JS disabled.
function asyncCssPlugin() {
  return {
    name: 'async-css',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          /<link ([^>]*rel="stylesheet"[^>]*)>/g,
          (_match, attrs) => `<link ${attrs} media="print" onload="this.media='all'"><noscript><link ${attrs}></noscript>`
        )
      },
    },
  }
}

export default defineConfig({
  root: __dirname,
  envDir: resolve(__dirname, '../..'),
  plugins: [react(), asyncCssPlugin()],
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
