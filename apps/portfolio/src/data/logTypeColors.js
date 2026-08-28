// Shared between Log.jsx (list) and LogEntry.jsx (entry page) so the
// four type tags always match wherever they show up. Pale tinted
// background + a saturated matching text color — same "subtle pill"
// pattern as the rest of the site's small labels.
//
// Each pairing stays within the site's own red/pink/cream family
// (nothing arbitrary like blue or purple) — debug uses the site's own
// red at full strength, build/opinion are two distinct depths of pink,
// note is a warm neutral close to the page's own cream. Every pairing
// is computed (not eyeballed) to clear 4.5:1 contrast against its own
// pill background.
export const TYPE_COLORS = {
  build: { bg: "#FDEDF4", text: "#9A3763" },
  debug: { bg: "#FDEEE8", text: "#C93500" },
  note: { bg: "#EFEBE5", text: "#6B6156" },
  opinion: { bg: "#F7EBF0", text: "#6E3B4E" },
};
