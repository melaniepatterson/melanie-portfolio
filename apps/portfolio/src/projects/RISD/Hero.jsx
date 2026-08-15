import { useState } from "react";
import EmailBrowserFrame from "./EmailBrowserFrame";
import VisibilityGatedVideo from "../../components/VisibilityGatedVideo";

export default function Hero() {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <VisibilityGatedVideo
        src="/images/projects/RISD/melanie-patterson-risd.webm"
        width={1200}
        height={800}
        alt=""
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