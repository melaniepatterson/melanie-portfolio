// Lightweight image list for Radialgradient.jsx's hover-chaser effect — kept
// separate from data/projects.js (full descriptions, every image's
// src/alt/width/height, and JSX) so the home page doesn't have to eagerly
// download that whole file just to grab each project's first image.
// comingSoon mirrors the same project's comingSoon flag in projects.js —
// keep the two in sync by hand when either changes; importing the full
// PROJECTS array here just to look this one boolean up live would defeat
// the point of this file being lightweight.
export const CHASER_IMAGES = [
  { src: "/images/projects/RISD/melanie-patterson-risd.webp", comingSoon: false },
  { src: "/images/projects/GlowUp/melanie-patterson-glow-up-calendar-desktop.webp", comingSoon: false },
  { src: "https://placehold.co/1200x800/1a1a1a/FAF7F2", comingSoon: true },
];
