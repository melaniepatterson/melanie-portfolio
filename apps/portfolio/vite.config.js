import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { existsSync, unlinkSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// The entry CSS is small (~3.5 KB raw / ~1.5 KB gzip — it's just the
// global App.css shared by every route; each lazy route already gets
// its own separate CSS chunk via Rollup's automatic code-splitting, so
// there's nothing further to trim here). Under Slow-4G simulation the
// round trip for that one extra request was Lighthouse's whole
// "render-blocking requests" complaint. Inlining it into <head> removes
// the request entirely — no network latency to hide behind a swap, so
// (unlike the earlier media="print" attempt) there's no window where
// JS can paint before the styles are ready, and no CLS risk.
function inlineCriticalCssPlugin() {
  const inlinedAssets = new Set()
  let outDir
  return {
    name: 'inline-critical-css',
    configResolved(config) {
      outDir = config.build.outDir
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx?.bundle) return html
        return html.replace(
          /<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/g,
          (match, assetPath) => {
            const asset = ctx.bundle[assetPath]
            if (asset && asset.type === 'asset' && typeof asset.source === 'string') {
              inlinedAssets.add(assetPath)
              return `<style>${asset.source}</style>`
            }
            return match
          }
        )
      },
    },
    // The bundled .css file still gets written to disk since it was part
    // of the bundle before this plugin's html transform ran — now that
    // its content lives inline in index.html and nothing references the
    // file anymore, delete it so it isn't shipped as dead weight.
    closeBundle() {
      for (const assetPath of inlinedAssets) {
        const filePath = resolve(outDir, assetPath)
        if (existsSync(filePath)) unlinkSync(filePath)
      }
    },
  }
}

export default defineConfig({
  root: __dirname,
  envDir: resolve(__dirname, '../..'),
  plugins: [react(), inlineCriticalCssPlugin()],
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
