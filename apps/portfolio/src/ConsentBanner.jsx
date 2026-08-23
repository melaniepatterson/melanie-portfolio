import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "melanie-studio-consent";
const VISITOR_ID_KEY = "melanie-studio-visitor-id";
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 182;
// Fired by the Privacy page's "change cookie preferences" link — lets it
// reopen this banner on demand without any direct relationship between
// the two components (Privacy doesn't render or control ConsentBanner).
export const OPEN_CONSENT_EVENT = "melanie-studio:open-consent";

function updateConsent(granted) {
  if (typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: granted ? "granted" : "denied",
  });
}

// A random id, not tied to any real identity — this is only so a given
// browser's own record can be told apart from another's in consent_logs,
// not to track who someone is. Generated once and reused on repeat
// visits (same key the choice itself is stored under, in the same spot).
function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

// Record of consent decisions, logged via this project's own Vercel
// Function (see /api/log-consent.js) so there's at least a recent trail
// showing a choice was made (GDPR Art. 7(1) puts the burden of proof on
// the site) — separate from the localStorage flag above, which only
// handles gating GA in this one browser. Vercel's request logs are a
// rolling window, not permanent storage, but that's the tradeoff for not
// running a database for this one insert. Fire-and-forget with
// keepalive: gating already happened via localStorage/gtag before this
// runs, so a failed or slow request here should never block or affect
// the visitor's actual experience — keepalive just means it isn't
// silently cancelled if the page is already navigating away.
function logConsent(granted) {
  fetch("/api/log-consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      choice: granted ? "granted" : "denied",
      visitorId: getVisitorId(),
      pagePath: window.location.pathname,
    }),
    keepalive: true,
  }).catch((error) => console.error("consent log failed:", error));
}

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const isWork = useLocation().pathname === "/portfolio";
  // Work's floating "Filters" pill is mobile-only (see Work.module.css) —
  // desktop's version lives top-left instead, so there's nothing to
  // clear there. Same 640px breakpoint used everywhere else in this app.
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch {}
    const expired = !saved?.timestamp || Date.now() - saved.timestamp > SIX_MONTHS_MS;
    if (!expired && (saved.choice === "granted" || saved.choice === "denied")) {
      updateConsent(saved.choice === "granted");
    } else {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    const open = () => setVisible(true);
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  const choose = (granted) => {
    const record = { choice: granted ? "granted" : "denied", timestamp: Date.now() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(record)); } catch {}
    updateConsent(granted);
    logConsent(granted);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      // Work.jsx has its own floating "Filters" pill fixed to the bottom
      // on mobile only (bottom: 1.5rem there) — clearing it here reuses
      // the same offset Work.module.css already uses to push its own
      // footer content clear of that pill, rather than a new one-off
      // number. Desktop's filter control lives top-left instead, so this
      // page shouldn't get a special offset there — same spot as every
      // other page.
      bottom: isWork && isMobile ? "calc(5.5rem + env(safe-area-inset-bottom, 0px))" : "1.25rem",
      left: "1.25rem",
      zIndex: 1000,
      width: "min(280px, calc(100vw - 2.5rem))",
      background: "#FAF7F2",
      borderRadius: 14,
      padding: "1rem 1.1rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
    }}>
      <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.5, color: "#C93500" }}>
        This site uses a little Google Analytics to see what's working — no ads, no selling data.
      </p>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={() => choose(true)}
          style={{
            padding: "0.45rem 1rem",
            borderRadius: 9999,
            border: "none",
            background: "#C93500",
            color: "#FAF7F2",
            fontFamily: "inherit",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Sounds good
        </button>
        <button
          onClick={() => choose(false)}
          style={{
            padding: "0.45rem 1rem",
            borderRadius: 9999,
            border: "1px solid #C93500",
            background: "transparent",
            color: "#C93500",
            fontFamily: "inherit",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
