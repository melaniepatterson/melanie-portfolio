import { useState, useEffect } from "react";

// Devices with no real hover (touch) shouldn't be told to "hover to
// interact" — matches the same (hover: hover) check used to gate
// GridFisheye's simulated cursor wander and ConfettiDemo's mobile
// auto-play, so hint text and interaction fallback all agree on what
// counts as "can this device actually hover."
export function useHoverCapable() {
  const [hoverCapable, setHoverCapable] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches
  );
  useEffect(() => {
    const mql = window.matchMedia("(hover: hover)");
    const onChange = () => setHoverCapable(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return hoverCapable;
}

// Cursor-repulsion physics shared by Radialgradient.jsx's home page stars
// and any other decorative element that wants the same "pushes away from
// the cursor, drifts back" desktop motion treatment. Split into a pure
// calculation (reads a pre-fetched rect, writes nothing) and a style
// application (writes only) so callers driving multiple elements from one
// mousemove handler can batch all reads before any writes — interleaving
// getBoundingClientRect() reads with style writes across multiple elements
// forces a synchronous layout recalculation between each pair.
export function computeRepulsion(rect, mouseX, mouseY, threshold, force, maxRotation) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = centerX - mouseX;
  const dy = centerY - mouseY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < threshold) {
    const strength = (threshold - dist) / threshold;
    const angle = Math.atan2(dy, dx);
    const pushX = Math.cos(angle) * strength * force;
    const pushY = Math.sin(angle) * strength * force;
    // Rotate based on horizontal push direction — left push tilts negative, right tilts positive
    const rotateDeg = -pushX / force * maxRotation;
    return {
      transition: "transform 3.5s cubic-bezier(0.22, 0.61, 0.36, 1)",
      transform: `translate(${pushX}px, ${pushY}px) rotate(${rotateDeg}deg)`,
    };
  }
  return {
    transition: "transform 3.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    transform: "translate(0px, 0px) rotate(0deg)",
  };
}

export function applyRepulsionStyle(el, style) {
  el.style.transition = style.transition;
  el.style.transform = style.transform;
}

export function SplitText({ children, className }) {
  return (
    <span className={className} aria-label={children}>
      <span aria-hidden="true">
        {children.split("").map((char, i) => (
          <span key={i} className="split-char" style={{ "--i": i }}>
            {char === " " ? " " : char}
          </span>
        ))}
      </span>
    </span>
  );
}

export function externalLinkProps(url) {
  if (url && url.startsWith("http")) {
    return { target: "_blank", rel: "noopener noreferrer" };
  }
  return {};
}
