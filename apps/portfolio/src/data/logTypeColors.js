// Shared between Log.jsx (list) and LogEntry.jsx (entry page) so the
// four type tags always match wherever they show up. Pale tinted
// background + a saturated matching text color — same "subtle pill"
// pattern as the rest of the site's small labels, just with a distinct
// hue per type instead of the site's one accent red.
export const TYPE_COLORS = {
  build: { bg: "#E8F0FF", text: "#2E5AAC" },
  debug: { bg: "#FBE7E0", text: "#C93500" },
  note: { bg: "#EEECE8", text: "#6B6558" },
  opinion: { bg: "#F3E8F7", text: "#7B4B94" },
};
