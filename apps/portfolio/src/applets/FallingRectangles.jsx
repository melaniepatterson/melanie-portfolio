import { useEffect, useRef } from "react";
import Matter from "matter-js";
import styles from "./AppletCanvas.module.css";

// Ported from applets/falling-rectangles.html — uniform 9:32 portrait
// rectangles launch from a fixed zone near the left edge, tip and cascade
// under real physics (Matter.js), and settle into a pile that spreads
// rightward. Scoped down here to this component's own box: resize is
// relative to the container instead of the window, and the render loop
// uses requestAnimationFrame instead of the standalone page's setInterval
// (a workaround that page needed for a sandboxed preview tool, not needed
// here). The whole scene is mirrored left-to-right at render time, so it
// visibly drops from the right and cascades left.
export default function FallingRectangles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas.parentElement;
    const ctx = canvas.getContext("2d");

    const { Engine, World, Bodies, Body, Composite, Common } = Matter;

    const engine = Engine.create();
    engine.gravity.y = 1.6; // snappier so the whole sequence resolves within about 6s
    const world = engine.world;

    let W = 0, H = 0;
    const WALL = 300;
    let ground, leftWall, rightWall;

    const CLEARANCE_RATIO = 0.19; // fraction of height left empty below the stack
    const SIDE_PADDING = 60; // clearance kept clear on both edges

    function buildBounds() {
      if (ground) World.remove(world, [ground, leftWall, rightWall]);
      const floorY = H * (1 - CLEARANCE_RATIO);
      ground = Bodies.rectangle(W / 2, floorY + WALL / 2, W + WALL * 2, WALL, {
        isStatic: true,
        friction: 0.9,
      });
      // Walls sit inset by SIDE_PADDING (not at the true edges), so nothing
      // can ever physically slide into the padding.
      leftWall = Bodies.rectangle(SIDE_PADDING - WALL / 2, H / 2, WALL, H * 4, { isStatic: true });
      rightWall = Bodies.rectangle(W - SIDE_PADDING + WALL / 2, H / 2, WALL, H * 4, { isStatic: true });
      World.add(world, [ground, leftWall, rightWall]);
    }

    function resize() {
      const rect = stage.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildBounds();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();

    const MAX_RECTS = 36;
    const RECT_H = 100;
    const RECT_W = RECT_H * (9 / 32); // fixed 9:32 aspect ratio, uniform for every rectangle
    let spawnTimer = null;
    let spawnIndex = 0;

    // The drop point stays confined to a fixed zone near the left edge — that's
    // where everything falls from. Once on the floor, physics is free to spread
    // and cascade the pile further right; nothing constrains that. The tail
    // reinforces just the left portion of the drop zone, on top of the first
    // wave's own share there, building extra height on the left.
    const LEFT_ZONE_START = SIDE_PADDING + 10;
    const LEFT_ZONE_WIDTH = 320;
    const TAIL_ZONE_WIDTH = 150;
    const LEFT_BIAS_FROM = 22;

    function spawnRect() {
      if (!W || !H) return null;
      const bodies = Composite.allBodies(world).filter((b) => !b.isStatic);
      if (bodies.length >= MAX_RECTS) {
        clearTimeout(spawnTimer);
        return null;
      }

      const isTail = spawnIndex >= LEFT_BIAS_FROM;
      spawnIndex++;
      const x = LEFT_ZONE_START + RECT_W / 2 + Common.random(0, isTail ? TAIL_ZONE_WIDTH : LEFT_ZONE_WIDTH);
      const y = -RECT_H / 2 - Common.random(0, 120);

      const TILT = 15 * (Math.PI / 180); // degrees to radians
      const body = Bodies.rectangle(x, y, RECT_W, RECT_H, {
        angle: Common.random(-TILT, TILT), // portrait, but with a slight random tilt for variety
        friction: 0.4,
        frictionStatic: 0.8,
        frictionAir: 0.0008,
        restitution: 0,
        density: 0.0012,
        chamfer: { radius: 1.5 },
      });

      // A bit of downward push and sideways life so they read as launched, not dropped.
      // The tail gets a touch of extra leftward push, reinforcing the bias.
      const vx = isTail ? Common.random(-1.1, -0.3) : Common.random(-0.6, 0.6);
      Body.setVelocity(body, { x: vx, y: Common.random(2, 4) });

      body.rectW = RECT_W;
      body.rectH = RECT_H;
      body.shade = Common.random(-14, 14);
      body.gradientFlip = Math.random() < 0.5;

      World.add(world, body);
      return body;
    }

    function scheduleSpawn() {
      clearTimeout(spawnTimer);
      spawnTimer = setTimeout(() => {
        const body = spawnRect();
        if (body) scheduleSpawn();
      }, Common.random(55, 90));
    }

    function reset() {
      const bodies = Composite.allBodies(world).filter((b) => !b.isStatic);
      World.remove(world, bodies);
      clearTimeout(spawnTimer);
      spawnIndex = 0;
      scheduleSpawn();
    }

    function shadeColor(hex, amt) {
      const num = parseInt(hex.slice(1), 16);
      const r = Math.min(255, Math.max(0, (num >> 16) + amt));
      const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
      const b = Math.min(255, Math.max(0, (num & 0xff) + amt));
      return `rgb(${r},${g},${b})`;
    }

    function draw() {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, W, H);

      const bodies = Composite.allBodies(world).filter((b) => !b.isStatic);

      // The whole scene is mirrored left-to-right at render time — physics still
      // drops everything from what it thinks is the left edge, this just flips
      // the picture so it visibly drops from the right and cascades left.
      ctx.save();
      ctx.translate(W, 0);
      ctx.scale(-1, 1);

      for (const body of bodies) {
        const w = body.rectW, h = body.rectH;

        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);

        // Straight top-to-bottom along the piece's own portrait axis (rotates with
        // it), with the light/dark direction randomized per piece at spawn.
        const lightEnd = shadeColor("#2454ff", body.shade + 22);
        const darkEnd = shadeColor("#2454ff", body.shade - 40);
        const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        grad.addColorStop(0, body.gradientFlip ? darkEnd : lightEnd);
        grad.addColorStop(0.55, "#2454ff");
        grad.addColorStop(1, body.gradientFlip ? lightEnd : darkEnd);
        ctx.fillStyle = grad;
        ctx.fillRect(-w / 2, -h / 2, w, h);

        ctx.restore();
      }

      ctx.restore();
    }

    canvas.addEventListener("click", reset);
    scheduleSpawn();

    let raf;
    let lastTime = null;
    const STEP = 1000 / 60;
    function frame(now) {
      if (lastTime === null) lastTime = now;
      Engine.update(engine, STEP);
      if (W && H) draw();
      lastTime = now;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(spawnTimer);
      ro.disconnect();
      canvas.removeEventListener("click", reset);
    };
  }, []);

  return (
    <div className={styles.stage} style={{ background: "#000000" }}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
