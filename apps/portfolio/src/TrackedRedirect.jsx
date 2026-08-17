import { useEffect } from "react";
import { Navigate } from "react-router-dom";

// Values are read from env vars (.env.local locally, gitignored),
// never hardcoded here.
const TRACKING_CODES = {
  p1: import.meta.env.VITE_TRACKING_P1_SOURCE,
  p2: import.meta.env.VITE_TRACKING_P2_SOURCE,
};

// code is passed directly as a prop from an explicit <Route> per code in
// App.jsx (not read via useParams from a catchall /:code route) — that
// way an unmapped path/typo falls through to the real 404 route instead
// of silently redirecting home.
export default function TrackedRedirect({ code }) {
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
