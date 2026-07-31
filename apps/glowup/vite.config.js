import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envDir = resolve(__dirname, '../..')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '')
  const isDemo = env.VITE_GLOWUP_DEMO === 'true'

  return {
    root: __dirname,
    envDir,
    plugins: [
      react(),
      // index.html hardcodes og:url/og:image/twitter:image against the real
      // glowup.melanie.studio domain — the demo build (glowupdemo.melanie.studio)
      // shares this same file, so swap the domain in link previews for demo
      // builds rather than shipping the wrong canonical URL.
      {
        name: 'glowup-demo-og-url',
        transformIndexHtml(html) {
          if (!isDemo) return html
          return html.replaceAll('https://glowup.melanie.studio', 'https://glowupdemo.melanie.studio')
        },
      },
    ],
    resolve: {
      alias: {
        '@shared': resolve(__dirname, '../../shared'),
      },
    },
    build: {
      outDir: resolve(__dirname, '../../dist/glowup'),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js', 'react-easy-crop'],
          },
        },
      },
    },
    esbuild: {
      loader: 'jsx',
      include: /(?:src|shared)\/.*\.[jt]sx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
  }
})
