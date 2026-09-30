"use client";

import { useEffect, useRef } from "react";
import { createNetwork } from "./hero-network-engine";

/**
 * Hero background: drifting grey nodes, thin links and blue "check" pulses hopping between them.
 * Pauses off-screen / in hidden tabs; one static frame under reduced motion; hover only for fine pointers.
 */
export function HeroNetwork() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const net = createNetwork(ctx);
    net.theme();
    let raf = 0;
    let last = 0;
    let visible = true;
    let running = false;

    const resize = () => {
      const r = host.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      net.resize(w, h, fine, still);
      net.draw();
    };

    const frame = (now: number) => {
      net.step(Math.min(0.05, (now - last) / 1000));
      last = now;
      net.draw();
      raf = requestAnimationFrame(frame);
    };

    const sync = () => {
      const go = visible && !document.hidden && !still;
      if (go && !running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!go && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      net.cur.x = e.clientX - r.left;
      net.cur.y = e.clientY - r.top;
      net.cur.on = true;
    };
    const onLeave = () => {
      net.cur.on = false;
    };
    const onTheme = () => {
      net.theme();
      if (!running) net.draw();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(canvas);
    const mo = new MutationObserver(onTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("visibilitychange", sync);
    if (fine && !still) {
      host.addEventListener("pointermove", onMove, { passive: true });
      host.addEventListener("pointerleave", onLeave);
    }
    resize();
    sync();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", sync);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full [mask-image:linear-gradient(180deg,rgba(0,0,0,0.35),rgba(0,0,0,0.5)_45%,black_70%)] lg:[mask-image:linear-gradient(90deg,rgba(0,0,0,0.3),rgba(0,0,0,0.45)_38%,black_62%)]"
    />
  );
}
