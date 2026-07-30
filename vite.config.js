import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// index.html is shared between the portfolio (melanie.studio) and the
// standalone GlowUp deployment (glowup.melanie.studio) — same repo/branch,
// only VITE_GLOWUP_STANDALONE differs per Vercel project. A runtime JS
// effect can fix what a browser sees after the page loads, but link-preview
// crawlers (iMessage, Slack, etc.) read the raw built HTML and never run
// JS — this transformIndexHtml hook swaps the identity tags in the actual
// output file at build time instead, so crawlers see the right thing too.
// No-op (returns null, filtered out below) when the env var is unset, so
// the portfolio's own build is completely untouched.
function glowupStandaloneHtml() {
  if (process.env.VITE_GLOWUP_STANDALONE !== 'true') return null
  return {
    name: 'glowup-standalone-html',
    transformIndexHtml(html) {
      return html
        .replace(
          '<link rel="icon" href="/melanie-studio-favicon.ico" />',
          '<link rel="icon" type="image/png" href="/glowup-icon-192.png" />'
        )
        .replace(
          '<link rel="apple-touch-icon" href="/logo192.png" />',
          '<link rel="apple-touch-icon" href="/glowup-apple-touch-icon.png" media="(prefers-color-scheme: light)" />\n' +
          '    <link rel="apple-touch-icon" href="/glowup-apple-touch-icon-dark.png" media="(prefers-color-scheme: dark)" />\n' +
          '    <meta name="apple-mobile-web-app-title" content="Glow Up" />'
        )
        .replace(
          '<link rel="manifest" href="/manifest.json" />',
          '<link rel="manifest" href="/manifest-glowup.json" />'
        )
        .replace(
          /<meta name="description" content="[^"]*" \/>/,
          '<meta name="description" content="Your skincare routine, organized. Track products, treatments, and your routine — all in one place." />'
        )
        .replace(
          /<meta property="og:title" content="[^"]*" \/>/,
          '<meta property="og:title" content="Glow Up" />'
        )
        .replace(
          /<meta property="og:description" content="[^"]*" \/>/,
          '<meta property="og:description" content="Your skincare routine, organized. Track products, treatments, and your routine — all in one place." />'
        )
        .replace('<title>melanie.studio</title>', '<title>Glow Up</title>')
    },
  }
}

export default defineConfig({
  plugins: [react(), glowupStandaloneHtml()].filter(Boolean),
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
})
