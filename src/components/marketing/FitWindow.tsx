"use client";

import { useEffect, useRef, type ReactNode } from "react";

const NAV = 65; // sticky navbar height
const CHROME = 60; // lg: section padding (2×16) + stage padding (2×12) + stage/section borders (3) + 1px slack
const MIN_W = 790; // never lay the window out narrower than this (dates in the pills stay on one line)

/**
 * lg+: zooms the dashboard window (2 cards + the top of a 3rd) so the whole section fits one
 * viewport below the navbar. Announces "preview-fit" so the callouts re-measure.
 */
export function FitWindow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const lg = window.matchMedia("(min-width: 1024px)");

    /** Scale that fits `avail`; iterated because zooming widens the layout, which changes its height. */
    const scaleFor = (avail: number, width: number) => {
      let s = 1;
      for (let i = 0; i < 3; i++) {
        el.style.zoom = String(s);
        const natural = el.getBoundingClientRect().height / s;
        s = Math.min(1, avail / natural, width / MIN_W);
      }
      return s;
    };

    const fit = () => {
      el.style.zoom = "";
      if (lg.matches) {
        const avail = window.innerHeight - NAV - CHROME;
        const width = el.getBoundingClientRect().width; // unzoomed: the stage content width
        const s = scaleFor(avail, width);
        el.style.zoom = String(s);
        const h = el.getBoundingClientRect().height; // re-check after reflow at the new width
        if (h > avail) el.style.zoom = String((s * avail) / h);
      }
      window.dispatchEvent(new Event("preview-fit"));
    };

    fit();
    document.fonts?.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return <div ref={ref}>{children}</div>;
}
