"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { HeroPreview } from "./HeroPreview";
import { DomainMiniCard, HealthMiniCard, SslMiniCard } from "./hero-cards";

/** Parallax only for desktop pointers with motion allowed. */
const QUERY = "(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/** Writes --mx / --my (-1..1, pointer offset from the stage centre) on the stage element. */
function useParallax() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const mq = window.matchMedia?.(QUERY);
    if (!el || !mq) return;
    let raf = 0;
    let on = false;
    const set = (x: number, y: number) => {
      el.style.setProperty("--mx", x.toFixed(3));
      el.style.setProperty("--my", y.toFixed(3));
    };
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        set(
          clamp((e.clientX - r.left - r.width / 2) / r.width),
          clamp((e.clientY - r.top - r.height / 2) / r.height),
        );
      });
    };
    const onLeave = () => set(0, 0);
    const sync = () => {
      if (mq.matches === on) return;
      on = mq.matches;
      if (on) {
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
      } else {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        set(0, 0);
      }
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}

const shift = (px: number): CSSProperties => ({
  transform: `translate3d(calc(var(--mx, 0) * ${px}px), calc(var(--my, 0) * ${px}px), 0)`,
});

/** One depth layer: parallax shift on the outer box, gentle float (lg+, motion allowed) inside. */
function Layer({ className, px, delay, children }: { className: string; px: number; delay?: string; children: ReactNode }) {
  return (
    <div className={`${className} transition-transform duration-700 ease-out motion-reduce:transition-none`} style={shift(px)}>
      <div className={delay ? `motion-safe:lg:animate-[hero-float_7s_ease-in-out_infinite] ${delay}` : undefined}>
        {children}
      </div>
    </div>
  );
}

/** Layered product composition: Sites card plus floating SSL, domain and health cards. */
export function HeroStage() {
  const ref = useParallax();
  return (
    <div ref={ref} className="relative lg:py-16 lg:[perspective:1600px]" aria-hidden>
      <div className="relative lg:[transform:rotateX(2deg)_rotateY(-4deg)]">
        <Layer className="relative" px={5}>
          <HeroPreview />
        </Layer>
        <Layer className="absolute -top-12 right-0 hidden w-52 lg:block xl:-right-3" px={14} delay="[animation-delay:-1.5s]">
          <SslMiniCard />
        </Layer>
        <Layer className="absolute -bottom-[4.5rem] right-0 hidden w-52 lg:block xl:-right-3" px={10} delay="[animation-delay:-4s]">
          <DomainMiniCard />
        </Layer>
        <Layer
          className="relative z-10 -mt-5 ml-4 w-48 lg:absolute lg:-bottom-16 lg:-left-6 lg:m-0"
          px={18}
          delay="[animation-delay:-6s]"
        >
          <HealthMiniCard />
        </Layer>
      </div>
    </div>
  );
}
