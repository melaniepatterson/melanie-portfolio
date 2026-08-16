import { useEffect, useState } from "react";
import DeviceCompare from "../../components/DeviceCompare";
import MobileFrame from "../../components/MobileFrame";

const MOBILE_SRC = "/images/projects/GlowUp/melanie-patterson-glow-up-calendar-mobile.webp";
const MOBILE_ALT = "The Glow Up calendar on mobile, showing a month grid with AM/PM routine slots colored by day type.";

// The desktop/mobile pairing reads well side by side on desktop, but the
// browser-chrome frame is wide and short — stacked full-width on mobile
// (see DeviceCompare.module.css) it doesn't carry the same visual weight
// a hero needs there. Mobile shows just the phone frame instead; the
// desktop screenshot moves down into the regular gallery as its own
// mobile-only item (see projects.js's mobileOnly flag).
export default function Hero() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (isMobile) {
    return (
      <MobileFrame scrollable fullWidth>
        <img src={MOBILE_SRC} alt={MOBILE_ALT} />
      </MobileFrame>
    );
  }

  return (
    <DeviceCompare
      desktopSrc="/images/projects/GlowUp/melanie-patterson-glow-up-calendar-desktop.webp"
      desktopAlt="The Glow Up calendar on desktop, showing a month grid with AM/PM routine slots colored by day type and an active Tretinoin Onboarding program banner."
      mobileSrc={MOBILE_SRC}
      mobileAlt={MOBILE_ALT}
    />
  );
}
