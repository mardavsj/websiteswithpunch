"use client";

import { useEffect, useRef, type ReactNode } from "react";

const NAV = 65; // sticky navbar height
const CHROME = 84; // lg: section padding (2×24) + stage padding (2×16) + stage/section borders (3) + 1px slack
const MIN_W = 790; // never lay the window out narrower than this (dates in the pills stay on one line)
const MIN_3 = 0.8; // below this scale, show 2 site cards instead of 3 so text stays readable

/**
 * lg+: zooms the dashboard window so the whole section fits one viewport below the navbar,
 * dropping to 2 cards on short screens. Announces "preview-fit" so the callouts re-measure.
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
      el.classList.remove("fit-2");
      el.style.zoom = "";
      if (lg.matches) {
        const avail = window.innerHeight - NAV - CHROME;
        const width = el.getBoundingClientRect().width; // unzoomed: the stage content width
        let s = scaleFor(avail, width);
        if (s < MIN_3) {
          el.classList.add("fit-2");
          s = scaleFor(avail, width);
        }
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
