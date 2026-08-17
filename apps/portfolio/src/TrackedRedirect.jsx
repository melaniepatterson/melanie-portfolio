import { useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";

// Codes are read from .env.local (gitignored) -- add one VITE_TRACKING_*
// pair per application. Values here are just meaningless short codes;
// the company mapping lives only in the Notion tracker, never in code.
const TRACKING_CODES = {
  p1: import.meta.env.VITE_TRACKING_P1_SOURCE,
  p2: import.meta.env.VITE_TRACKING_P2_SOURCE,
};

export default function TrackedRedirect() {
  const { code } = useParams();
  const source = TRACKING_CODES[code];

  useEffect(() => {
    if (!source || typeof window.gtag !== "function") return;

    window.gtag("event", "page_view", {
      page_location: window.location.origin + "/",
      page_path: "/",
      campaign_source: source,
      campaign_medium: "resume",
    });
  }, [source]);

  return <Navigate to="/" replace />;
}
