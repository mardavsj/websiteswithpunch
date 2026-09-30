"use client";

import { useEffect, useRef, type ReactNode } from "react";

const NAV = 65; // sticky navbar height
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
    const px = (n: Element | null | undefined, ...props: string[]) => {
      const cs = n ? getComputedStyle(n) : null;
      return props.reduce((sum, p) => sum + (cs ? parseFloat(cs.getPropertyValue(p)) || 0 : 0), 0);
    };
    /** Vertical space around the window: stage padding + borders, section padding, section border. */
    const chrome = () => {
      const stage = el.parentElement;
      const wrap = stage?.parentElement;
      const box = ["padding-top", "padding-bottom", "border-top-width", "border-bottom-width"];
      return px(stage, ...box) + px(wrap, "padding-top", "padding-bottom") + px(wrap?.parentElement, "border-bottom-width") + 1;
    };

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
        const avail = window.innerHeight - NAV - chrome();
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
