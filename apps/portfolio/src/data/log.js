// Lightweight, low-effort dev notebook — small builds, debugging notes,
// and short opinions. Unlike data/projects.js (full case studies with
// hero images and galleries), an entry here should be a 2-minute edit:
// just fill in the fields below, no layout decisions required.
//
// type: one of "build" | "debug" | "note" | "opinion" — drives the
// small color tag shown next to the title (see Log.module.css/
// LogEntry.module.css's TYPE_COLORS).
//
// relatedProject: optional — a slug from data/projects.js (see
// data/projectTitles.js for the current list), or null. Renders a
// "Related project →" link on the entry page.
//
// content: Markdown (rendered via react-markdown on the entry page).
// Fenced code blocks (```js, ```css, etc.) render as plain styled
// <pre><code> — no syntax highlighting, just monospace + a background.
//
// published: false hides an entry everywhere — Log.jsx's list,
// LogEntry.jsx (direct URL redirects to /log), WorkDetail's reverse
// "Related Log" lookup, and prerender-meta.mjs's per-route static
// files. Kept as a flag rather than commenting the object out: still
// type-checked, still a normal object to edit, and flipping it back on
// later is a one-word change instead of un-commenting a block. Both
// seed entries below are placeholder copy, not Melanie's own writing
// yet — set to false until they're rewritten for real.
export const LOG_ENTRIES = [
  {
    slug: "device-compare-bug",
    date: "2026-08-25",
    title: "Chasing a hero-image bug in DeviceCompare",
    type: "debug",
    published: false,
    tags: ["React", "component design"],
    excerpt: "Deleting a screenshot from the middle of the list quietly promoted the wrong image to \"hero.\" The array shifted; my state didn't know.",
    content: `DeviceCompare renders a row of screenshots with one marked as the "hero" — bigger, shown first. I was tracking which one with a plain index:

\`\`\`js
const [heroIndex, setHeroIndex] = useState(0);
// ...
<button onClick={() => setHeroIndex(i)}>Make hero</button>
\`\`\`

Worked fine until the delete button shipped. Remove item 1 from a 4-item array and everything after it shifts down one slot — index 2 is now what used to be at index 3. \`heroIndex\` never got told any of that happened, so it just kept pointing at whatever number it already had, which after a delete is almost never the thing you meant.

The fix was obvious in hindsight: stop tracking a position, track an identity.

\`\`\`js
const [heroId, setHeroId] = useState(images[0].id);
// survives deletes, reorders, whatever — id doesn't shift
const hero = images.find((img) => img.id === heroId) ?? images[0];
\`\`\`

Classic case of the state shape quietly encoding an assumption ("this list only ever grows") that the UI stopped guaranteeing the moment I added a delete button. [Dan Abramov's piece on array index as key](https://react.dev/learn/rendering-lists#why-does-react-need-keys) is basically the same lesson wearing a different hat — same failure mode, just one abstraction layer up.

Still deciding whether to backfill a test for this or just trust that "track ids, not positions" is now burned into memory.`,
    relatedProject: "glow-up",
  },
  {
    slug: "confetti-fall-depth",
    date: "2026-08-20",
    title: "Giving canvas confetti some fake depth",
    type: "build",
    published: false,
    tags: ["Canvas", "animation"],
    excerpt: "Every piece of confetti falling at the same speed reads as flat and a little cheap. One extra random number fixes that.",
    content: `Built a confetti-fall script for a decision-letter reveal — nothing exotic, a canvas, a particle array, gravity. First pass had every piece falling at the same speed and it looked exactly like what it was: a loop, not weather.

The fix was giving each particle a fake "depth" at spawn time and letting everything else derive from it — size, speed, and opacity all scale off the same one number instead of being rolled independently:

\`\`\`js
function spawnParticle() {
  const depth = 0.4 + Math.random() * 0.6; // 0.4 (far) – 1.0 (near)
  return {
    x: Math.random() * canvas.width,
    y: -20,
    depth,
    size: 4 + depth * 6,
    speed: 2 + depth * 4,
    opacity: 0.5 + depth * 0.5,
  };
}

function update(p) {
  p.y += p.speed;
  // slight horizontal drift, scaled down for "farther" pieces too
  p.x += Math.sin(p.y * 0.05) * (depth * 1.5);
}
\`\`\`

Tying size/speed/opacity to one shared value instead of randomizing each independently is what actually sells the depth — near pieces are bigger, faster, and more opaque all at once, so they read as "closer" instead of just "different." Randomizing the three separately just looked like noise.

Total runtime cost: one extra multiply per particle per frame. [MDN's Canvas API docs](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) don't have an opinion on any of this — it's not a canvas trick, it's just... painting with a variable instead of a constant.`,
    relatedProject: "RISD",
  },
];
