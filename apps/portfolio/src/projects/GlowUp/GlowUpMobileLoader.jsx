import MobileFrame from "../../components/MobileFrame";
import GlowUpLoaderPreview from "./GlowUpLoaderPreview";

// GlowUp's real loading screen, live (not a screenshot), inside a
// stand-in mobile frame — swap MobileFrame out once the custom
// mobile-device SVG is ready.
export default function GlowUpMobileLoader() {
  return (
    <MobileFrame>
      <GlowUpLoaderPreview />
    </MobileFrame>
  );
}
