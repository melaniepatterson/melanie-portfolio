import { PROJECTS } from "./projects";

// Derived from PROJECTS' own hoverImage + comingSoon fields, rather than a
// hand-maintained parallel list — so a project's hover image (and whether
// it should show at all) only ever needs updating in one place.
export const CHASER_IMAGES = PROJECTS
  .filter((p) => p.hoverImage && !p.comingSoon)
  .map((p) => p.hoverImage);
