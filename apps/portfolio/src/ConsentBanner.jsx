import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "melanie-studio-consent";

function updateConsent(granted) {
  if (typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: granted ? "granted" : "denied",
  });
}

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const isWork = useLocation().pathname === "/portfolio";

  useEffect(() => {
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch {}
    if (saved === "granted" || saved === "denied") {
      updateConsent(saved === "granted");
    } else {
      setVisible(true);
    }
  }, []);

  const choose = (granted) => {
    try { localStorage.setItem(STORAGE_KEY, granted ? "granted" : "denied"); } catch {}
    updateConsent(granted);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      // Work.jsx has its own floating "Filters" pill fixed to the bottom
      // on mobile (bottom: 1.5rem there) — clearing it here reuses the
      // same offset Work.module.css already uses to push its own footer
      // content clear of that pill, rather than a new one-off number.
      bottom: isWork ? "calc(5.5rem + env(safe-area-inset-bottom, 0px))" : "1.25rem",
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
