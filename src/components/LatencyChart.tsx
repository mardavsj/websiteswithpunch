"use client";

import type { LatencyPoint } from "@/lib/analytics-series";

/** Latency trend chart (SVG, no chart libraries). Sharp corners, ink/accent/rule. */

const ACCENT = "hsl(var(--accent))";
const MUTED = "hsl(var(--muted))";
const RULE = "hsl(var(--rule))";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

/** Min/max of exactly what the chart plots (keeps the header in sync). */
export function seriesRange(series: LatencyPoint[]): { min: number; max: number } | null {
  if (!series.length) return null;
  const values = series.map((p) => p.ms);
  return { min: Math.min(...values), max: Math.max(...values) };
}

export function LatencyAreaChart({ series }: { series: LatencyPoint[] }) {
  if (series.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-xs text-muted">
        No latency samples yet
      </div>
    );
  }

  if (series.length === 1) {
    const p = series[0];
    return (
      <div
        className="relative flex h-44 flex-col items-center justify-center"
        role="img"
        aria-label={`Latency: one check, ${p.ms}ms at ${when(p.t)}`}
      >
        <span aria-hidden className="absolute inset-x-0 top-1/2 border-t border-rule" />
        <span className="relative mb-2 font-display text-lg font-medium tabular-nums text-ink">
          {p.ms}ms
        </span>
        <span
          aria-hidden
          className="relative h-3 w-3 rounded-full border-2 border-accent bg-bg"
        />
        <span className="relative mt-2 text-xs text-muted">{when(p.t)} · 1 check</span>
      </div>
    );
  }

  const values = series.map((p) => p.ms);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mid = Math.round((min + max) / 2);
  const span = max - min;

  const W = 640;
  const H = 200;
  const padL = 48;
  const padR = 12;
  const padT = 14;
  const padB = 20;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // X follows real time, so the same data always draws the same shape and
  // gaps between checks stay visible. Identical timestamps fall back to index.
  const times = series.map((p) => new Date(p.t).getTime());
  const t0 = times[0];
  const tSpan = times[times.length - 1] - t0;
  const points = series.map((p, i) => {
    const fx = tSpan > 0 ? (times[i] - t0) / tSpan : i / (series.length - 1);
    const fy = span > 0 ? (p.ms - min) / span : 0.5; // flat line sits mid-chart
    return { x: padL + fx * plotW, y: padT + plotH - fy * plotH, ms: p.ms, t: p.t };
  });

  const lineD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");
  const base = (padT + plotH).toFixed(2);
  const areaD = `${lineD} L${points[points.length - 1].x.toFixed(2)},${base} L${points[0].x.toFixed(2)},${base} Z`;

  const gridYs = [0, 0.5, 1].map((f) => padT + plotH * (1 - f));
  const yLabels = [
    { y: gridYs[2], text: `${max}` },
    { y: gridYs[1], text: `${mid}` },
    { y: gridYs[0], text: `${min}` },
  ];

  const showDots = series.length <= 60;
  const gradId = "latency-area-fill";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-44 w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Latency trend chart, ${series.length} points`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.32" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridYs.map((y, i) => (
        <line key={i} x1={padL} y1={y} x2={W - padR} y2={y} stroke={RULE} strokeWidth="1" />
      ))}

      {yLabels.map((l, i) => (
        <text
          key={i}
          x={padL - 8}
          y={l.y + 3}
          textAnchor="end"
          style={{ fontSize: "10px", fill: MUTED }}
        >
          {l.text}
        </text>
      ))}

      <text x={padL - 8} y={padT - 2} textAnchor="end" style={{ fontSize: "8px", fill: MUTED }}>
        ms
      </text>

      <path d={areaD} fill={`url(#${gradId})`} />
      <path
        d={lineD}
        fill="none"
        stroke={ACCENT}
        strokeWidth="2.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {showDots &&
        points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="hsl(var(--bg))"
            stroke={ACCENT}
            strokeWidth="1.75"
          >
            <title>{`${when(p.t)} · ${p.ms}ms`}</title>
          </circle>
        ))}
    </svg>
  );
}
