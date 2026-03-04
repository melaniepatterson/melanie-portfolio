import { useEffect, useRef } from "react";

export default function RepulseLogo() {
  const imgRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
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

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#fff",
      zIndex: 0
    }}>
      <img
        ref={imgRef}
        src="/images/melanie studio circle.svg"
        style={{
          width: 1500,
          height: 1500,
          willChange: "transform",
        }}
      />
    </div>
  );
}
