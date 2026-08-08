import MobileFrame from "../../components/MobileFrame";
import GlowUpLoaderPreview from "./GlowUpLoaderPreview";

// GlowUp's real loading screen, live (not a screenshot), inside the
// mobile-device frame.
export default function GlowUpMobileLoader() {
  return (
    <MobileFrame>
      <GlowUpLoaderPreview />
    </MobileFrame>
  );
}
