import { useNavigate } from "react-router-dom";
import { SplitText } from "../App";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "2rem",
      color: "#C93500",
    }}>
      <h1 style={{ fontSize: "6rem", fontWeight: 900, lineHeight: 1 }}>404</h1>
      <p style={{ fontSize: "0.85rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
        Page not found
      </p>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#C93500",
          fontSize: "0.85rem",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          borderBottom: "2px solid #C93500",
          padding: 0,
          fontFamily: "inherit",
        }}
      ><SplitText>← Go Back</SplitText></button>
    </div>
  );
}