import { useState } from "react";
import img1 from "./images/melanie-patterson-risd.webp";
import img2 from "./images/melanie-patterson-risd-email-1.webp";
import img3 from "./images/03.webp";

export default function Hero() {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <img
        src={img1}
        width="1200"
        height="800"
        alt=""
        style={{ width: "100%", height: "auto", display: "block" }}
      />
      <img
        src={img2}
        alt=""
        style={{
          position: "absolute",
          bottom: "5%",
          right: "5%",
          width: "45%",
          height: "auto",
          transition: "transform 0.4s ease",
          transform: hovered ? "translate(4px, -4px)" : "none",
        }}
      />
      <img
        src={img3}
        alt=""
        style={{
          position: "absolute",
          bottom: "5%",
          left: "5%",
          width: "35%",
          height: "auto",
        }}
      />
    </div>
  );
}