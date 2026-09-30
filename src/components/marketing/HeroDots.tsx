"use client";

import { useEffect, useRef } from "react";

const GAP = 14; // px: same grid as the old CSS dot background (one dot at the centre of each tile)
const REACH = 150; // px: cursor influence radius
const PUSH = 9; // px: max outward (magnetic) displacement
const BASE = 0.09; // ink alpha of a resting dot, matching the dotted panels

/** Theme colour from a "h s% l%" custom property, as an hsla() string builder. */
function tone(name: string) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).split("/")[0].trim();
  const [h = "0", s = "0%", l = "50%"] = raw.split(/\s+/);
  return (a: number) => `hsla(${h}, ${s}, ${l}, ${a.toFixed(3)})`;
}

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/**
 * Hero background: a static dot grid. Only on hover (fine pointers, motion allowed) do nearby dots
 * swell, tint blue and spring outward, with a lagging trail and soft ripples. Idle = no rAF at all.
 */
export function HeroDots() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const live =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ink = tone("--ink");
    let accent = tone("--accent");
    let w = 0;
    let h = 0;
    let cols = 0;
    let n = 0;
    let ox = new Float32Array(0);
    let oy = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let glow = new Float32Array(0);
    const cur = { x: 0, y: 0, on: false };
    const head = { x: 0, y: 0 }; // follows the cursor closely
    const tail = { x: 0, y: 0 }; // lags behind: the trail
    const ripples: { x: number; y: number; t: number }[] = [];
    let lastRip = { x: -1e4, y: -1e4 };
    let k = 0; // cursor presence, eased 0..1
    let raf = 0;
    let last = 0;
    let running = false;

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      ctx!.fillStyle = ink(BASE);
      ctx!.beginPath();
      for (let i = 0; i < n; i++) {
        if (glow[i] > 0.01 || ox[i] || oy[i]) continue;
        const x = (i % cols) * GAP + GAP / 2;
        const y = ((i / cols) | 0) * GAP + GAP / 2;
        ctx!.moveTo(x + 1, y);
        ctx!.arc(x, y, 1, 0, Math.PI * 2);
      }
      ctx!.fill();
      for (let i = 0; i < n; i++) {
        const g = glow[i];
        if (g <= 0.01 && !ox[i] && !oy[i]) continue;
        const x = (i % cols) * GAP + GAP / 2 + ox[i];
        const y = ((i / cols) | 0) * GAP + GAP / 2 + oy[i];
        const r = 1 + g * 1.1;
        ctx!.beginPath();
        ctx!.arc(x, y, r, 0, Math.PI * 2);
        ctx!.fillStyle = ink(BASE + g * 0.2);
        ctx!.fill();
        if (g > 0.3) {
          ctx!.fillStyle = accent((g - 0.3) * 0.75);
          ctx!.fill();
        }
      }
    }

    /** Advance springs; returns true while anything is still moving. */
    function step(dt: number) {
      const target = cur.on ? 1 : 0;
      k += (target - k) * Math.min(1, dt * 5);
      head.x += (cur.x - head.x) * Math.min(1, dt * 12);
      head.y += (cur.y - head.y) * Math.min(1, dt * 12);
      tail.x += (cur.x - tail.x) * Math.min(1, dt * 3.5);
      tail.y += (cur.y - tail.y) * Math.min(1, dt * 3.5);
      for (let j = ripples.length - 1; j >= 0; j--) if ((ripples[j].t += dt / 0.9) >= 1) ripples.splice(j, 1);
      const damp = Math.exp(-13 * dt);
      const ease = Math.min(1, dt * 9);
      let busy = Math.abs(target - k) > 0.003 || Math.hypot(cur.x - tail.x, cur.y - tail.y) > 0.3 || ripples.length > 0;
      for (let i = 0; i < n; i++) {
        const bx = (i % cols) * GAP + GAP / 2;
        const by = ((i / cols) | 0) * GAP + GAP / 2;
        let tx = 0;
        let ty = 0;
        let g = 0;
        if (k > 0.003) {
          for (const [p, s, reach] of [[head, 1, REACH], [tail, 0.55, REACH * 0.8]] as const) {
            const dx = bx - p.x;
            const dy = by - p.y;
            const d = Math.hypot(dx, dy) || 1;
            const f = smooth(1 - d / reach) * s * k;
            if (f <= 0) continue;
            tx += (dx / d) * f * PUSH;
            ty += (dy / d) * f * PUSH;
            g = Math.max(g, f);
          }
          for (const rp of ripples) {
            const dx = bx - rp.x;
            const dy = by - rp.y;
            const d = Math.hypot(dx, dy) || 1;
            const ring = 1 - Math.abs(d - rp.t * 200) / 26;
            if (ring <= 0) continue;
            const a = smooth(ring) * (1 - rp.t) * 3 * k;
            tx += (dx / d) * a;
            ty += (dy / d) * a;
          }
        }
        if (!tx && !ty && !g && !ox[i] && !oy[i] && glow[i] <= 0.001) continue;
        vx[i] = (vx[i] + (tx - ox[i]) * 170 * dt) * damp;
        vy[i] = (vy[i] + (ty - oy[i]) * 170 * dt) * damp;
        ox[i] += vx[i] * dt;
        oy[i] += vy[i] * dt;
        glow[i] += (g - glow[i]) * ease;
        const moving = Math.abs(vx[i]) + Math.abs(vy[i]) + Math.abs(tx - ox[i]) + Math.abs(ty - oy[i]) > 0.02;
        if (moving || Math.abs(g - glow[i]) > 0.002) busy = true;
        else if (!tx && !ty && !g) ox[i] = oy[i] = vx[i] = vy[i] = glow[i] = 0; // fully back at rest
      }
      return busy;
    }

    function frame(now: number) {
      const busy = step(Math.min(0.05, (now - last) / 1000));
      last = now;
      draw();
      if (busy) raf = requestAnimationFrame(frame);
      else running = false; // settled: hold the pose (or rest), no rAF while idle
    }

    function wake() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function resize() {
      const r = host!.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / GAP);
      n = cols * Math.ceil(h / GAP);
      [ox, oy, vx, vy, glow] = [0, 0, 0, 0, 0].map(() => new Float32Array(n));
      draw();
      if (k > 0.003) wake();
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      cur.x = e.clientX - r.left;
      cur.y = e.clientY - r.top;
      if (k < 0.02) {
        head.x = tail.x = cur.x; // arriving: start at the cursor rather than sweeping in
        head.y = tail.y = cur.y;
      }
      cur.on = true;
      if (Math.hypot(cur.x - lastRip.x, cur.y - lastRip.y) > 40) {
        lastRip = { x: cur.x, y: cur.y };
        if (ripples.length < 5) ripples.push({ x: cur.x, y: cur.y, t: 0 });
      }
      wake();
    };
    const onLeave = () => {
      cur.on = false;
      lastRip = { x: -1e4, y: -1e4 };
      wake();
    };
    const onTheme = () => {
      ink = tone("--ink");
      accent = tone("--accent");
      if (!running) draw();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const mo = new MutationObserver(onTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    if (live) {
      host.addEventListener("pointermove", onMove, { passive: true });
      host.addEventListener("pointerleave", onLeave);
    }
    resize();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full [mask-image:radial-gradient(ellipse_95%_90%_at_60%_45%,black_55%,transparent)]"
    />
  );
}
