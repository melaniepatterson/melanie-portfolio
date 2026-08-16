// This is an SPA — one built index.html serves every route via Vercel's
// catch-all rewrite. That means every route shares the same <title> and
// Open Graph tags, so sharing a link to a specific project shows the
// generic homepage preview instead of that project's own title/image.
// document.title updates correctly client-side once React mounts, but
// link-unfurlers (Slack, Twitter, iMessage) and most crawlers read the
// raw HTML and never execute that JS.
//
// This script runs after `vite build` and writes a copy of the built
// index.html per route, each with its own <title>/description/OG/
// canonical tags swapped in — everything else (script tag, inlined CSS,
// #root div) stays identical, so the SPA still mounts and behaves
// exactly as before. Vercel serves a matching static file (e.g.
// portfolio/RISD/index.html for a request to /portfolio/RISD) before
// falling through to the SPA rewrite, the same way robots.txt and
// sitemap.xml already take priority over it.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '../../../dist/portfolio')
const baseUrl = 'https://www.melanie.studio'
const defaultImage = { url: `${baseUrl}/melanie-studio-og.png`, width: 1200, height: 630 }

const routes = [
  {
    path: '/',
    title: 'melanie.studio',
    description: "Melanie Patterson is an Indo-Jamaican American artist and designer working across fine art, web development, and design. Based in Providence, RI.",
    image: defaultImage,
  },
  {
    path: '/portfolio',
    title: 'Work — melanie.studio',
    description: 'Selected projects spanning interactive design, print, and fine art by Melanie Patterson.',
    image: defaultImage,
  },
  {
    path: '/portfolio/RISD',
    title: 'Rhode Island School of Design — melanie.studio',
    description: 'Interactive design, CRM systems, and print work for RISD Admissions.',
    image: { url: `${baseUrl}/images/projects/RISD/risd_seal_grid.webp`, width: 702, height: 414 },
  },
  {
    path: '/portfolio/glow-up',
    title: 'Glow Up App — melanie.studio',
    description: 'A skincare tracking and routine-planning app built with React and Supabase.',
    image: defaultImage,
  },
  {
    path: '/portfolio/brightline',
    title: 'Brightline Maps — melanie.studio',
    description: "Mural-scale illustrated maps for Brightline's South Florida train stations.",
    image: { url: `${baseUrl}/images/projects/Brightline/Brightline_Maps_Melanie_Patterson_Crop.webp`, width: 1279, height: 853 },
  },
  {
    path: '/about-contact',
    title: 'Info & Contact — melanie.studio',
    description: 'About Melanie Patterson, CV, and contact links.',
    image: defaultImage,
  },
  {
    path: '/privacy',
    title: 'Privacy & Cookies — melanie.studio',
    description: 'How melanie.studio uses cookies and analytics.',
    image: defaultImage,
  },
  {
    // Gated in projects.js via comingSoon: true — WorkDetail.jsx redirects
    // this path back to /portfolio at runtime, so this static file only
    // ever matters to crawlers/unfurlers that read raw HTML without
    // executing JS. noindex keeps it out of search results in the
    // meantime; the redirect is what keeps it off the public site itself.
    path: '/portfolio/DARE-body-count',
    title: 'Coming Soon — melanie.studio',
    description: "This project isn't public yet — check back soon.",
    image: defaultImage,
    noindex: true,
  },
]

const escapeAttr = (str) => str.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

const replacements = (route) => [
  [/<title>.*?<\/title>/, `<title>${escapeAttr(route.title)}</title>`],
  [/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeAttr(route.description)}" />`],
  [/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeAttr(route.title)}" />`],
  [/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeAttr(route.description)}" />`],
  [/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${route.canonical}" />`],
  [/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${route.image.url}" />`],
  [/<meta property="og:image:width" content="[^"]*" \/>/, `<meta property="og:image:width" content="${route.image.width}" />`],
  [/<meta property="og:image:height" content="[^"]*" \/>/, `<meta property="og:image:height" content="${route.image.height}" />`],
  [/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${route.image.url}" />`],
]

const template = readFileSync(join(distDir, 'index.html'), 'utf-8')

for (const route of routes) {
  route.canonical = route.path === '/' ? `${baseUrl}/` : `${baseUrl}${route.path}`
  let html = template
  for (const [pattern, replacement] of replacements(route)) {
    if (!pattern.test(html)) {
      throw new Error(`prerender-meta: pattern ${pattern} did not match for route ${route.path} — index.html template may have changed shape.`)
    }
    html = html.replace(pattern, replacement)
  }
  html = html.replace(/(<title>.*?<\/title>)/, `$1\n    <link rel="canonical" href="${route.canonical}" />`)

  if (route.noindex) {
    const robotsPattern = /<meta name="robots" content="[^"]*" \/>/
    if (!robotsPattern.test(html)) {
      throw new Error(`prerender-meta: robots meta pattern did not match for route ${route.path} — index.html template may have changed shape.`)
    }
    html = html.replace(robotsPattern, `<meta name="robots" content="noindex, nofollow" />`)
  }

  const outDir = route.path === '/' ? distDir : join(distDir, route.path)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'index.html'), html)
}

console.log(`prerender-meta: wrote per-route meta tags for ${routes.length} routes.`)
