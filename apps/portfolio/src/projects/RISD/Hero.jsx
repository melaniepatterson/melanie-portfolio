import { useState } from "react";
import img3 from "./images/03.webp";
import EmailBrowserFrame from "./EmailBrowserFrame";

export default function Hero() {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <img
        src="/images/projects/RISD/melanie-patterson-risd.webp"
        width="1200"
        height="800"
        alt=""
        style={{ width: "100%", height: "auto", display: "block" }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: "7%",
          width: "45%",
          transform: "translateY(-50%)",
        }}
      >
        <div
          style={{
            transition: "transform 0.4s ease",
            transform: hovered ? "translate(4px, -4px)" : "none",
          }}
        >
          <EmailBrowserFrame src="/images/projects/RISD/app_open_email.webm" />
        </div>
      </div>
    </div>
  );
}