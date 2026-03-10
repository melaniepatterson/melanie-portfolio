import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PROJECTS } from "./data/projects";

const CHASER_IMAGES = PROJECTS.map(p => p.images[0]);

export default function RepulseLogo() {
  const imgRef = useRef(null);
  const chaserRef = useRef(null);
  const [chaserImage, setChaserImage] = useState(null);
  const [chaserVisible, setChaserVisible] = useState(false);

  const chaserPos = useRef({ x: 0, y: 0 });
  const cursorPos = useRef({ x: 0, y: 0 });
  const animFrame = useRef(null);

  // Repulsion effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      cursorPos.current = { x: e.clientX, y: e.clientY };

      const img = imgRef.current;
      const rect = img.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = centerX - e.clientX;
      const dy = centerY - e.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const threshold = 400;

      if (dist < threshold) {
        const force = (threshold - dist) / threshold;
        const angle = Math.atan2(dy, dx);
        const pushX = Math.cos(angle) * force * 400;
        const pushY = Math.sin(angle) * force * 400;
        img.style.transition = "transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)";
        img.style.transform = `translate(${pushX}px, ${pushY}px)`;
      } else {
        img.style.transition = "transform 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        img.style.transform = "translate(0px, 0px)";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Chaser animation loop
  useEffect(() => {
    const animate = () => {
      chaserPos.current.x += (cursorPos.current.x - chaserPos.current.x) * 0.08;
      chaserPos.current.y += (cursorPos.current.y - chaserPos.current.y) * 0.08;
      if (chaserRef.current) {
        chaserRef.current.style.transform = `translate(${chaserPos.current.x}px, ${chaserPos.current.y}px)`;
      }
      animFrame.current = requestAnimationFrame(animate);
    };
    animFrame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame.current);
  }, []);

  const handleLinkEnter = () => {
    const randomImg = CHASER_IMAGES[Math.floor(Math.random() * CHASER_IMAGES.length)];
    setChaserImage(randomImg);
    setChaserVisible(true);
  };

  const handleLinkLeave = () => {
    setChaserVisible(false);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 0
    }}>

      {/* Chaser image */}
      <div
        ref={chaserRef}
        style={{
          position: "fixed",
          top: -120,
          left: 0,
          width: 160,
          height: 120,
          pointerEvents: "none",
          zIndex: 4,
          opacity: chaserVisible ? 1 : 0,
          transition: "opacity 0.2s ease"
        }}
      >
       
        {chaserImage && (
          <img
            src={chaserImage}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "grayscale(100%)" }}
          />
        )}
            <div
        style={{
          backgroundColor: "#c93500",
          mixBlendMode: "screen",
          position: "absolute",
          inset: 0
        }}
      >
        </div>
      </div>

      <img
        ref={imgRef}
        src="/images/melanie studio circle.svg"
        style={{
          width: 1500,
          height: 1500,
          willChange: "transform",
        }}
      />

      <div style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "3rem",
        zIndex: 10,
        pointerEvents: "none"
      }}>
        <Link
          to="/portfolio"
          onMouseEnter={handleLinkEnter}
          onMouseLeave={handleLinkLeave}
          style={{
            fontSize: "2rem",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textDecoration: "none",
            borderBottom: "3px solid #C93500",
            color: "#C93500",
            pointerEvents: "all",
          }}
        >Work</Link>
        <Link
          to="/about-contact"
          onMouseEnter={handleLinkEnter}
          onMouseLeave={handleLinkLeave}
          style={{
            fontSize: "2rem",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textDecoration: "none",
            borderBottom: "3px solid #C93500",
            color: "#C93500",
            pointerEvents: "all",
          }}
        >Info</Link>
      </div>
    </div>
  );
}