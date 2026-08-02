# melanie-portfolio

Two Vite/React apps in one repo, deployed as separate Vercel projects off `main`:

- `apps/portfolio` → [melanie.studio](https://melanie.studio)
- `apps/glowup` → skincare routine tracker, deployed twice from the same source:
  - [glowup.melanie.studio](https://glowup.melanie.studio) — the real app
  - [glowupdemo.melanie.studio](https://glowupdemo.melanie.studio) — read-only demo, linked from the portfolio case study

Backend is Supabase (Postgres + auth + storage). Edge functions in `supabase/functions/`.

## Setup

```bash
npm install
```

`.env.local`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

```bash
npm run dev:portfolio   # localhost:5173
npm run dev:glowup      # localhost:5174
```

Same pattern for `build:` and `preview:`.

## Deploys

Three Vercel projects, same repo, same `main` branch — a push redeploys all three:

- **melanie-portfolio**: `npm run build:portfolio` → `dist/portfolio`
- **glowup**: `npm run build:glowup` → `dist/glowup`
- **glowup-demo**: same as glowup, plus `VITE_GLOWUP_DEMO=true`

## Demo build

`VITE_GLOWUP_DEMO=true` swaps the real Supabase client for a mock (`demoClient.js` + static `demoData.js`) — everything routes through one client export, so that one swap is enough. Demo writes apply in-memory, so a visitor can click around and see their own changes (add a program, log a treatment, edit a product), but nothing is ever persisted anywhere — each page load starts fresh from the same seed data in `demoData.js`, with no state shared across tabs, reloads, or devices. `DemoBanner.jsx` shows it's a demo and flashes on every write as a reminder that it won't stick.
