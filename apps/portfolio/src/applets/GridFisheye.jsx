import { useEffect, useRef } from "react";
import styles from "./AppletCanvas.module.css";

// Ported from applets/grid-fisheye.html — a full-page mouse-follow effect
// there, scoped down here to just this component's own box: mouse tracking
// and resizing are both relative to the canvas's container instead of the
// window, and the page-wide `cursor: none` from the original is dropped
// since this is an embedded element, not the whole page.
export default function GridFisheye() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas.parentElement;
    const ctx = canvas.getContext("2d");

    const GRID_SIZE = 20;
    const LINE_WIDTH = 2;
    const GRID_COLOR = "#2454ff";
    const BG_COLOR = "#000000";

    const RADIUS = 140;
    const STRENGTH = 0.3;
    const EDGE_SOFTNESS = 0.5;
    const EASE = 0.18;
    const SAMPLE_STEP = 6;

    let dpr = Math.max(window.devicePixelRatio || 1, 1);
    let width = 0, height = 0;

    let targetX = -9999, targetY = -9999;
    let curX = -9999, curY = -9999;
    let hasPointer = false;

    function resize() {
      const rect = stage.getBoundingClientRect();
      dpr = Math.max(window.devicePixelRatio || 1, 1);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();

    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      hasPointer = true;
    }
    function onLeave() {
      hasPointer = false;
    }
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    // Touch devices have no cursor, so mousemove never fires and the grid
    // would just sit flat forever — wander a simulated target around
    // instead so the bulge effect is still visible. Picking a new random
    // waypoint every couple seconds and letting the existing EASE lerp
    // glide toward it (below) reuses the same chasing motion the rest of
    // the site already uses (see Radialgradient.jsx's chaser image).
    let wanderTimeout;
    const canSimulateHover = !window.matchMedia("(hover: hover)").matches;
    if (canSimulateHover) {
      hasPointer = true;
      const pickNextTarget = () => {
        targetX = Math.random() * width;
        targetY = Math.random() * height;
        wanderTimeout = setTimeout(pickNextTarget, 1800 + Math.random() * 1200);
      };
      pickNextTarget();
    }

    function smoothstep(edge0, edge1, x) {
      const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    }

    function warp(x, y, cx, cy) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0 || dist >= RADIUS) return [x, y];

      const norm = dist / RADIUS;
      const newNorm = Math.pow(norm, 1 - STRENGTH);
      const scale = (newNorm * RADIUS) / dist;

      const bulgedX = cx + dx * scale;
      const bulgedY = cy + dy * scale;

      const fade = 1 - smoothstep(RADIUS * EDGE_SOFTNESS, RADIUS, dist);

      return [x + (bulgedX - x) * fade, y + (bulgedY - y) * fade];
    }

    function drawLine(points) {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.stroke();
    }

    let raf;
    function frame() {
      curX += (targetX - curX) * EASE;
      curY += (targetY - curY) * EASE;

      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const activeRadius = hasPointer || targetX > -9000 ? RADIUS : 0;

      for (let x = 0; x <= width; x += GRID_SIZE) {
        const near = Math.abs(x - curX) < activeRadius + GRID_SIZE;
        if (!near) {
          drawLine([[x, 0], [x, height]]);
          continue;
        }
        const pts = [];
        for (let y = 0; y <= height; y += SAMPLE_STEP) {
          pts.push(warp(x, y, curX, curY));
        }
        pts.push(warp(x, height, curX, curY));
        drawLine(pts);
      }

      for (let y = 0; y <= height; y += GRID_SIZE) {
        const near = Math.abs(y - curY) < activeRadius + GRID_SIZE;
        if (!near) {
          drawLine([[0, y], [width, y]]);
          continue;
        }
        const pts = [];
        for (let x = 0; x <= width; x += SAMPLE_STEP) {
          pts.push(warp(x, y, curX, curY));
        }
        pts.push(warp(width, y, curX, curY));
        drawLine(pts);
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(wanderTimeout);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div className={styles.stage} style={{ background: "#000000" }}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
