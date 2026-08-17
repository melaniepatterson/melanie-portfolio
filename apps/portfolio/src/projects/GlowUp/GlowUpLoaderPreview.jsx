import { useEffect, useRef, useState } from "react";
import styles from "./GlowUpLoaderPreview.module.css";

// A recreation of GlowUp's real loading screen (GlowUpLoader.jsx) — same
// cycling sayings and rolling color bar — adapted to sit inside a bounded
// gallery frame instead of a full-viewport overlay. Faster than exporting
// and compressing a video of the real thing for a placeholder.
const SAYINGS = [
  "Buffering your barrier...",
  "Building layer by layer...",
  "Your actives are activating...",
  "Purging the cache. Not your skin...",
  "Slugging through it...",
  "One pump is never enough...",
  "SPF loading. Don't skip it...",
  "Reapplying every two hours...",
  "Exfoliating the unnecessary...",
  "Double cleansing the data...",
  "Reading the ingredients list...",
];

const BAR_COLORS = ["#ED6FBB", "#98AAF8", "#7BE3A5", "#F5C222", "#F07040"];
// In cqi (container query inline-size units, against .stage's own
// container-type: inline-size — see GlowUpLoaderPreview.module.css)
// instead of raw px, so this scales with the frame like everything
// else in .stage does. Converted directly from the real loader's own
// SLOT (240px) and BAND_HALF (45px) using the same 390px reference
// width as every other size in that file.
const SLOT = 61.538;
const BAND_HALF = 11.538;
const UNIT = SLOT * BAR_COLORS.length;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildBarGradient() {
  const order = shuffle(BAR_COLORS);
  const stops = ["#FFFFFF 0cqi"];
  order.forEach((color, i) => {
    const center = i * SLOT + SLOT / 2;
    stops.push(`#FFFFFF ${center - BAND_HALF}cqi`);
    stops.push(`${color} ${center}cqi`);
    stops.push(`#FFFFFF ${center + BAND_HALF}cqi`);
  });
  stops.push(`#FFFFFF ${UNIT}cqi`);
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

export default function GlowUpLoaderPreview() {
  const barGradient = useRef(buildBarGradient());
  const sayingQueue = useRef(shuffle(SAYINGS));
  const sayingIndex = useRef(0);
  const [text, setText] = useState("");

  useEffect(() => {
    let charTimer, holdTimer;
    function typeSaying() {
      const saying = sayingQueue.current[sayingIndex.current];
      let i = 0;
      setText("");
      function step() {
        i++;
        setText(saying.slice(0, i));
        if (i < saying.length) {
          charTimer = setTimeout(step, 40);
        } else {
          holdTimer = setTimeout(() => {
            sayingIndex.current++;
            if (sayingIndex.current >= sayingQueue.current.length) {
              sayingQueue.current = shuffle(SAYINGS);
              sayingIndex.current = 0;
            }
            typeSaying();
          }, 1800);
        }
      }
      step();
    }
    typeSaying();
    return () => {
      clearTimeout(charTimer);
      clearTimeout(holdTimer);
    };
  }, []);

  return (
    <div className={styles.stage}>
      <div className={styles.inner}>
        <div className={styles.wordmark}>glow up.</div>
        <div className={styles.barTrack}>
          <div
            className={styles.bar}
            style={{
              backgroundImage: barGradient.current,
              backgroundSize: `${UNIT}cqi 100%`,
            }}
          />
        </div>
        <div className={styles.saying}>{text}</div>
      </div>
    </div>
  );
}
