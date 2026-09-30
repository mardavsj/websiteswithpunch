/** Simulation + drawing for the hero "signal network" background (no DOM wiring here). */

type Dot = { x: number; y: number; vx: number; vy: number; r: number; ox: number; oy: number };
type Pulse = { a: number; b: number; t: number; dur: number; hops: number };

const LINK = 140; // px: nodes closer than this are joined by a line
const HOVER = 170; // px: cursor reach
const EDGE = 30; // px: nodes wrap this far off-canvas, so the drift never visibly starts or ends

/** Theme colour from a "h s% l%" custom property, as an hsla() string builder. */
function tone(name: string) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).split("/")[0].trim();
  const [h = "0", s = "0%", l = "50%"] = raw.split(/\s+/);
  return (a: number) => `hsla(${h}, ${s}, ${l}, ${Math.max(0, a).toFixed(3)})`;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function createNetwork(ctx: CanvasRenderingContext2D) {
  const dots: Dot[] = [];
  const pulses: Pulse[] = [];
  const cur = { x: 0, y: 0, on: false, k: 0 };
  let w = 0;
  let h = 0;
  let spawnIn = 0;
  let ink = tone("--ink");
  let accent = tone("--accent");
  let dark = false;

  const pos = (d: Dot) => [d.x + d.ox, d.y + d.oy] as const;
  const gap = (i: number, j: number) => Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
  const any = () => (Math.random() * dots.length) | 0;

  /** Send a pulse from node `from` to a random linked neighbour (not straight back to `not`). */
  function spawn(from: number, hops = 0, not = -1) {
    const near: number[] = [];
    for (let j = 0; j < dots.length; j++) if (j !== from && j !== not && gap(from, j) < LINK) near.push(j);
    if (!near.length) return;
    const b = near[(Math.random() * near.length) | 0];
    pulses.push({ a: from, b, t: 0, dur: Math.max(0.6, gap(from, b) / 70), hops });
  }

  function theme() {
    ink = tone("--ink");
    accent = tone("--accent");
    dark = document.documentElement.classList.contains("dark");
  }

  /** New size in CSS px; node count scales with area (fewer on touch screens). */
  function resize(nw: number, nh: number, fine: boolean, still: boolean) {
    if (w && h)
      for (const d of dots) {
        d.x *= nw / w;
        d.y *= nh / h;
      }
    w = nw;
    h = nh;
    const want = Math.round(Math.min(fine ? 110 : 40, Math.max(14, (w * h) / (fine ? 12500 : 16000))));
    while (dots.length < want) {
      const sp = rand(5, 14);
      const ang = rand(0, Math.PI * 2);
      dots.push({ x: rand(0, w), y: rand(0, h), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: rand(1, 1.9), ox: 0, oy: 0 });
    }
    if (dots.length > want) {
      dots.length = want;
      pulses.length = 0;
    }
    if (still) {
      // Reduced motion: a few pulses frozen mid-link in the single static frame.
      if (!pulses.length) for (let i = 0; i < 5; i++) spawn(any());
      for (const p of pulses) p.t = rand(0.3, 0.7);
    }
  }

  function step(dt: number) {
    cur.k += ((cur.on ? 1 : 0) - cur.k) * Math.min(1, dt * 4);
    const ease = Math.min(1, dt * 5);
    for (const d of dots) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.x < -EDGE) d.x += w + EDGE * 2;
      else if (d.x > w + EDGE) d.x -= w + EDGE * 2;
      if (d.y < -EDGE) d.y += h + EDGE * 2;
      else if (d.y > h + EDGE) d.y -= h + EDGE * 2;
      let tx = 0;
      let ty = 0;
      const dx = d.x - cur.x;
      const dy = d.y - cur.y;
      const dist = Math.hypot(dx, dy);
      if (cur.k > 0.01 && dist < HOVER && dist > 0.1) {
        const f = (1 - dist / HOVER) * 14 * cur.k; // gentle push away from the cursor
        tx = (dx / dist) * f;
        ty = (dy / dist) * f;
      }
      d.ox += (tx - d.ox) * ease;
      d.oy += (ty - d.oy) * ease;
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.t += dt / p.dur;
      const done = p.t >= 1;
      if (done || gap(p.a, p.b) > LINK * 1.2) {
        pulses.splice(i, 1);
        if (done && p.hops < 3 && Math.random() < 0.6) spawn(p.b, p.hops + 1, p.a);
      }
    }
    spawnIn -= dt;
    if (spawnIn <= 0 && pulses.length < Math.max(3, dots.length / 9)) {
      spawn(any());
      spawnIn = rand(0.3, 0.7);
    }
  }

  function line(ax: number, ay: number, bx: number, by: number, style: string) {
    ctx.strokeStyle = style;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  function dot(x: number, y: number, r: number, style: string) {
    ctx.fillStyle = style;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const lineA = dark ? 0.18 : 0.15;
    const dotA = dark ? 0.4 : 0.32;
    ctx.lineWidth = 1;
    for (let i = 0; i < dots.length; i++) {
      const [ax, ay] = pos(dots[i]);
      for (let j = i + 1; j < dots.length; j++) {
        const [bx, by] = pos(dots[j]);
        const d = Math.hypot(ax - bx, ay - by);
        if (d < LINK) line(ax, ay, bx, by, ink((1 - d / LINK) * lineA));
      }
    }
    for (const d of dots) {
      const [x, y] = pos(d);
      const near = cur.k > 0.01 ? Math.max(0, 1 - Math.hypot(x - cur.x, y - cur.y) / HOVER) * cur.k : 0;
      if (near > 0) line(x, y, cur.x, cur.y, accent(near * 0.5));
      dot(x, y, d.r + near * 1.3, ink(dotA + near * 0.2));
      if (near > 0) dot(x, y, d.r + near * 1.3, accent(near * 0.7));
    }
    ctx.lineWidth = 1.5;
    for (const p of pulses) {
      const [ax, ay] = pos(dots[p.a]);
      const [bx, by] = pos(dots[p.b]);
      const fade = Math.min(1, p.t * 5, (1 - p.t) * 5);
      const t0 = Math.max(0, p.t - 0.2);
      const x = ax + (bx - ax) * p.t;
      const y = ay + (by - ay) * p.t;
      line(ax + (bx - ax) * t0, ay + (by - ay) * t0, x, y, accent(0.35 * fade));
      dot(x, y, 2, accent(0.8 * fade));
    }
  }

  return { cur, theme, resize, step, draw };
}
