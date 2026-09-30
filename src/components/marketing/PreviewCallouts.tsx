"use client";

import { useEffect, useRef, useState } from "react";
import { previewCallouts } from "./preview-data";

type Box = { x: number; y: number; w: number; h: number };
type Geo = { fl: number; fr: number; cardTop: number; status: Box; ssl: Box; domain: Box };

const LINE = "hsl(var(--accent) / 0.6)";
const WIDE = 150; // px of stage gutter needed for side callouts with leader lines

/**
 * Overlay for the dashboard preview stage (its parent). With room at the sides (xl) it draws the
 * three callouts with thin leader lines into the first card; otherwise numbered markers only
 * (the legend under the stage explains them). Purely decorative: aria-hidden, no pointer events.
 */
export function PreviewCallouts() {
  const ref = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);

  useEffect(() => {
    const stage = ref.current?.parentElement;
    if (!stage) return;
    const measure = () => {
      const s = stage.getBoundingClientRect();
      const rect = (el: Element | null | undefined): Box | null => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
      };
      const pick = (k: string) => rect(stage.querySelector(`[data-callout="${k}"]`)?.firstElementChild);
      const frame = rect(stage.querySelector("[data-preview-frame]"));
      const card = rect(stage.querySelector("[data-callout-card]"));
      const [status, ssl, domain] = [pick("status"), pick("ssl"), pick("domain")];
      if (!frame || !card || !status || !ssl || !domain) return setGeo(null);
      setGeo({ fl: frame.x, fr: frame.x + frame.w, cardTop: card.y, status, ssl, domain });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    measure();
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  const wide = geo != null && geo.fl >= WIDE;
  const chip = "flex h-[18px] w-[18px] items-center justify-center bg-accent text-[10px] font-semibold text-white";

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0">
      {geo && !wide &&
        [geo.status, geo.ssl, geo.domain].map((b, i) => (
          <span key={i} className={`absolute ${chip}`} style={{ left: b.x + b.w - 10, top: b.y - 9 }}>
            {i + 1}
          </span>
        ))}
      {geo && wide && <Wide g={geo} chip={chip} />}
    </div>
  );
}

function Wide({ g, chip }: { g: Geo; chip: string }) {
  const y1 = g.cardTop - 16; // gap above the first card
  const y2 = g.ssl.y - 8; // gap between the card header and its pills
  const y3 = g.domain.y + g.domain.h / 2;
  const top = [y1 - 9, y2 - 9, Math.max(y3 - 9, y2 + 72)];
  const c3 = top[2] + 9;
  const sx = g.status.x + g.status.w / 2;
  const kx = g.ssl.x + g.ssl.w / 2;
  const dx = g.domain.x + g.domain.w;
  const paths = [
    `M${g.fl - 14} ${y1}H${sx}V${g.status.y}`,
    `M${g.fr + 14} ${y2}H${kx}V${g.ssl.y}`,
    `M${g.fr + 14} ${c3}H${g.fr + 7}V${y3}H${dx}`,
  ];
  const ends = [
    [sx, g.status.y],
    [kx, g.ssl.y],
    [dx, y3],
  ];
  return (
    <>
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        {paths.map((d) => (
          <path key={d} d={d} fill="none" stroke={LINE} strokeWidth="1" />
        ))}
        {ends.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="hsl(var(--accent))" />
        ))}
      </svg>
      {previewCallouts.map((c, i) => {
        const left = i === 0;
        return (
          <div
            key={c.key}
            className={`absolute w-[140px] ${left ? "text-right" : ""}`}
            style={left ? { left: g.fl - 154, top: top[i] } : { left: g.fr + 20, top: top[i] }}
          >
            <p className={`flex items-center gap-2 text-sm font-medium text-ink ${left ? "flex-row-reverse" : ""}`}>
              <span className={chip}>{i + 1}</span>
              {c.title}
            </p>
            <p className="mt-1 text-xs leading-snug text-muted">{c.body}</p>
          </div>
        );
      })}
    </>
  );
}
