"use client";

import { useEffect, useRef, useState } from "react";

type Pt = { x: number; y: number };
type Geo = { markers: Pt[] } | { lines: { d: string; start: Pt; end: Pt }[] };

const LINE = "hsl(var(--accent) / 0.6)";
const chip = "flex h-[18px] w-[18px] items-center justify-center bg-accent text-[10px] font-semibold text-white";

/**
 * Overlay for the preview (its parent wraps the key and the stage). lg+: thin leader lines from
 * each key item into the first card, routed through the gaps between rows. Smaller screens:
 * numbered markers on the targets. Re-measures on resize and after FitWindow rescales.
 */
export function PreviewCallouts() {
  const ref = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);

  useEffect(() => {
    const root = ref.current?.parentElement;
    if (!root) return;
    const measure = () => {
      const o = root.getBoundingClientRect();
      const box = (el: Element | null | undefined) => {
        const b = el?.getBoundingClientRect();
        return b && { l: b.left - o.left, t: b.top - o.top, r: b.right - o.left, b: b.bottom - o.top, w: b.width, h: b.height };
      };
      const q = (sel: string) => root.querySelector(sel);
      const card = q("[data-callout-card]");
      const T = ["status", "ssl", "domain"].map((k) => box(q(`[data-callout="${k}"]`)?.firstElementChild));
      if (!card || T.some((t) => !t)) return setGeo(null);
      const t = T as NonNullable<(typeof T)[number]>[];
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        return setGeo({ markers: t.map((b) => ({ x: b.r - 10, y: b.t - 9 })) });
      }
      const K = [1, 2, 3].map((i) => box(q(`[data-key-title="${i}"]`)));
      const list = box(q("[data-key-list]"));
      const stage = box(q("[data-preview-stage]"));
      const kids = card.children;
      const [prev, head, pills, btns] = [card.parentElement?.previousElementSibling, kids[0], kids[1], kids[2]].map(box);
      const c = box(card);
      if (K.some((k) => !k) || !list || !stage || !prev || !head || !pills || !btns || !c) return setGeo(null);
      const k = K as NonNullable<(typeof K)[number]>[];
      // Lanes: gap above the card, gap under its header row, gap under its pills.
      const lanes = [(prev.b + c.t) / 2, (head.b + pills.t) / 2, (pills.b + btns.t) / 2];
      const ends = [
        { x: t[0].l + t[0].w / 2, y: t[0].t },
        { x: t[1].l + t[1].w / 2, y: t[1].t },
        { x: t[2].l + t[2].w / 2, y: t[2].b },
      ];
      // Order the vertical runs in the gutter so the three paths never cross.
      const down = lanes.filter((y, i) => y > k[i].t + k[i].h / 2).length >= 2;
      const gutter = (f: number) => list.r + (stage.l - list.r) * f;
      setGeo({
        lines: k.map((kb, i) => {
          const start = { x: kb.r + 8, y: kb.t + kb.h / 2 };
          const gx = gutter(down ? (3 - i) / 4 : (i + 1) / 4);
          return { d: `M${start.x} ${start.y}H${gx}V${lanes[i]}H${ends[i].x}V${ends[i].y}`, start, end: ends[i] };
        }),
      });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    window.addEventListener("preview-fit", measure);
    measure();
    return () => {
      ro.disconnect();
      window.removeEventListener("preview-fit", measure);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0">
      {geo && "markers" in geo &&
        geo.markers.map((m, i) => (
          <span key={i} className={`absolute ${chip}`} style={{ left: m.x, top: m.y }}>
            {i + 1}
          </span>
        ))}
      {geo && "lines" in geo && (
        <svg className="absolute inset-0 h-full w-full overflow-visible">
          {geo.lines.map(({ d, start, end }) => (
            <g key={d}>
              <path d={d} fill="none" stroke={LINE} strokeWidth="1" />
              <circle cx={start.x} cy={start.y} r="2" fill={LINE} />
              <circle cx={end.x} cy={end.y} r="3" fill="hsl(var(--accent))" />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
