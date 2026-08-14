// Lightweight slug -> title lookup for App.jsx's document.title effect —
// kept separate from data/projects.js (which carries full descriptions,
// every image's src/alt/width/height, and JSX) so the home page doesn't
// have to eagerly download that whole file just to set a <title> on a
// route it isn't even on. Work.jsx/WorkDetail.jsx still import the full
// data/projects.js directly, and both are already lazy-loaded.
export const PROJECT_TITLES = [
  { slug: "RISD", title: "Rhode Island School of Design" },
  { slug: "glow-up", title: "Glow Up App" },
  { slug: "brightline", title: "Brightline Maps" },
];
