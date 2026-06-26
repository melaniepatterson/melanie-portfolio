// GlowUpLogo — single source of truth for the Glow Up. wordmark
import React from "react"

export default function GlowUpLogo({ size, style, className }) {
  return React.createElement("span", {
    className: className,
    style: Object.assign({ fontSize: size || 20, fontWeight: 800, letterSpacing: "-0.04em", color: "#1A1A1A", lineHeight: 1 }, style || {})
  },
    "Glow ",
    React.createElement("span", { style: { color: "#C93500" } }, "Up"),
    React.createElement("span", { style: { color: "#FFD6F9" } }, ".")
  )
}
