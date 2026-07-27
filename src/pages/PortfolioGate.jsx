import { SplitText } from "../App";

// Temporary stand-in for the whole portfolio site (home, /portfolio, project
// pages, /about-contact) while attention is on the GlowUp beta launch.
// Remove this gate in App.jsx's Layout to bring the portfolio back.
export default function PortfolioGate() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "2rem",
      color: "#C93500",
      textAlign: "center",
      padding: "0 1.5rem",
    }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 900, lineHeight: 1, margin: 0 }}>melanie.studio</h1>
      <p style={{ fontSize: "0.85rem", letterSpacing: "0.05em", maxWidth: 340, lineHeight: 1.7, margin: 0 }}>
        Portfolio site is being reworked — check back soon. In the meantime, take a look at what I've been building.
      </p>
      <a
        href="/routine"
        style={{
          color: "#C93500",
          fontSize: "0.85rem",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          borderBottom: "2px solid #C93500",
          textDecoration: "none",
          paddingBottom: 2,
        }}
      ><SplitText>Visit Glow Up →</SplitText></a>
    </div>
  );
}
