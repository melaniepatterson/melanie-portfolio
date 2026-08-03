import { useEffect, useRef } from "react";
import styles from "./AppletCanvas.module.css";

// Ported from applets/sunburst-lines.html — a self-looping fall/hold/rise
// cycle, unchanged except resize is scoped to this component's own
// container instead of the window.
export default function SunburstLines() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas.parentElement;
    const ctx = canvas.getContext("2d");

    const BG = "#2454FF";
    const LINE_COLOR = "#FFFFFF";
    const LINE_WIDTH = 1;

    const LINES_PER_SIDE = 18;
    const MAX_ANGLE_DEG = 74;
    const EDGE_BLADES = 2;
    const EDGE_MAX_ANGLE_DEG = 87;
    const PIVOT_Y_OFFSET = 0.06;
    const LEFT_PIVOT_X = -0.08;
    const RIGHT_PIVOT_X = 1.08;

    const FALL_STAGGER = 70;
    const FALL_DURATION = 650;
    const HOLD_DURATION = 1100;
    const RISE_STAGGER = 70;
    const RISE_DURATION = 550;
    const REST_DURATION = 500;

    let W = 0, H = 0, DPR = 1;
    let leftPivot, rightPivot, lineLength;

    function resize() {
      const rect = stage.getBoundingClientRect();
      DPR = window.devicePixelRatio || 1;
      W = rect.width;
      H = rect.height;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      leftPivot = { x: W * LEFT_PIVOT_X, y: H * (1 + PIVOT_Y_OFFSET) };
      rightPivot = { x: W * RIGHT_PIVOT_X, y: H * (1 + PIVOT_Y_OFFSET) };
      lineLength = Math.hypot(W, H) * 1.4;
    }
    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function easeInCubic(t) { return t * t * t; }
    function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }

    const totalFallTime = (LINES_PER_SIDE - 1) * FALL_STAGGER + FALL_DURATION;
    const totalRiseTime = (LINES_PER_SIDE - 1) * RISE_STAGGER + RISE_DURATION;
    const fallEnd = totalFallTime;
    const holdEnd = fallEnd + HOLD_DURATION;
    const riseEnd = holdEnd + totalRiseTime;
    const cycleLength = riseEnd + REST_DURATION;

    function targetAngle(i) {
      const normalCount = LINES_PER_SIDE - EDGE_BLADES;
      const normalMax = (MAX_ANGLE_DEG * Math.PI) / 180;

      if (i < normalCount) {
        const step = normalMax / (normalCount - 1);
        return i * step;
      }

      const edgeMax = (EDGE_MAX_ANGLE_DEG * Math.PI) / 180;
      const edgeIndex = i - (normalCount - 1);
      const t = edgeIndex / EDGE_BLADES;
      return normalMax + t * (edgeMax - normalMax);
    }

    function lineAngle(i, t) {
      const target = targetAngle(i);

      if (t <= fallEnd) {
        const start = i * FALL_STAGGER;
        const p = clamp01((t - start) / FALL_DURATION);
        return target * easeOutCubic(p);
      }
      if (t <= holdEnd) {
        return target;
      }
      if (t <= riseEnd) {
        const riseIndex = LINES_PER_SIDE - 1 - i;
        const start = holdEnd + riseIndex * RISE_STAGGER;
        const p = clamp01((t - start) / RISE_DURATION);
        return target * (1 - easeInCubic(p));
      }
      return 0;
    }

    function drawLine(pivot, angle, direction) {
      const theta = -Math.PI / 2 + direction * angle;
      const x2 = pivot.x + Math.cos(theta) * lineLength;
      const y2 = pivot.y + Math.sin(theta) * lineLength;
      ctx.beginPath();
      ctx.moveTo(pivot.x, pivot.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    function render(t) {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = LINE_WIDTH;

      for (let i = 0; i < LINES_PER_SIDE; i++) {
        const angle = lineAngle(i, t);
        drawLine(leftPivot, angle, +1);
        drawLine(rightPivot, angle, -1);
      }
    }

    let raf;
    let startTime = null;
    function frame(now) {
      if (startTime === null) startTime = now;
      const elapsed = (now - startTime) % cycleLength;
      render(elapsed);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className={styles.stage} style={{ background: "#2454FF" }}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
