"use client";

/** Polished SVG analytics primitives — no chart libraries. On-brand: sharp corners, ink/accent/rule. */

const ACCENT = "hsl(216 84% 53%)";
const INK = "hsl(216 35% 6%)";
const MUTED = "hsl(220 9% 46%)";
const RULE = "hsl(216 35% 6% / 0.12)";
const EMERALD = "hsl(160 84% 39%)";
const AMBER = "hsl(38 92% 50%)";
const ROSE = "hsl(350 89% 60%)";

function gaugeStroke(value: number): string {
  if (value >= 90) return EMERALD;
  if (value >= 70) return ACCENT;
  if (value >= 40) return AMBER;
  return ROSE;
}

function statusColor(status: string): string {
  if (status === "up") return EMERALD;
  if (status === "down") return ROSE;
  if (status === "error") return AMBER;
  if (status === "mixed") return "hsl(38 92% 65%)";
  return "hsl(216 35% 6% / 0.18)";
}

function codeFamilyColor(code: string): string {
  const n = Number(code);
  if (!Number.isFinite(n)) return MUTED;
  if (n >= 200 && n < 300) return EMERALD;
  if (n >= 300 && n < 400) return ACCENT;
  if (n >= 400 && n < 500) return AMBER;
  if (n >= 500 && n < 600) return ROSE;
  return MUTED;
}

export function RingGauge({
  value,
  label,
  size = 88,
  suffix = "",
  caption,
}: {
  value: number | null;
  label: string;
  size?: number;
  /** Appended after the center number, e.g. "%" */
  suffix?: string;
  /** Optional line under the ring (e.g. healthLabel) */
  caption?: string;
}) {
  const v = value == null ? 0 : Math.max(0, Math.min(100, value));
  const display = value == null ? "—" : `${Math.round(v)}${suffix}`;
  const stroke = value == null ? MUTED : gaugeStroke(v);
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (v / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 88 88"
        className="shrink-0"
        role="img"
        aria-label={`${label}: ${display}`}
      >
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={RULE}
          strokeWidth="7"
        />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="7"
          strokeLinecap="butt"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
          style={{ transition: "stroke-dashoffset 0.65s ease, stroke 0.3s ease" }}
        />
        <text
          x="44"
          y="42"
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: suffix ? "17px" : "20px",
            fontWeight: 500,
            fill: INK,
            letterSpacing: "-0.025em",
            fontFamily: "var(--font-display), system-ui, sans-serif",
          }}
        >
          {display}
        </text>
        <text
          x="44"
          y="58"
          textAnchor="middle"
          style={{
            fontSize: "8px",
            fill: MUTED,
            letterSpacing: "0.1em",
            fontWeight: 500,
          }}
        >
          {label.toUpperCase()}
        </text>
      </svg>
      {caption ? (
        <p className="mt-1 text-center text-sm text-accent">{caption}</p>
      ) : null}
    </div>
  );
}

export function LatencyAreaChart({
  series,
}: {
  series: Array<{ t: string; ms: number }>;
}) {
  if (series.length < 2) {
    return (
      <div className="flex h-44 items-center justify-center text-xs text-muted">
        Not enough latency samples yet
      </div>
    );
  }

  const values = series.map((p) => p.ms);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mid = Math.round((min + max) / 2);
  const span = Math.max(max - min, 1);

  const W = 640;
  const H = 200;
  const padL = 48;
  const padR = 12;
  const padT = 14;
  const padB = 20;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const points = series.map((p, i) => {
    const x = padL + (i / (series.length - 1)) * plotW;
    const y = padT + plotH - ((p.ms - min) / span) * plotH;
    return { x, y, ms: p.ms, t: p.t };
  });

  const lineD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");
  const areaD = `${lineD} L${points[points.length - 1].x.toFixed(2)},${(
    padT + plotH
  ).toFixed(2)} L${points[0].x.toFixed(2)},${(padT + plotH).toFixed(2)} Z`;

  const gridYs = [0, 0.5, 1].map((f) => padT + plotH * (1 - f));
  const yLabels = [
    { y: gridYs[2], text: `${max}` },
    { y: gridYs[1], text: `${mid}` },
    { y: gridYs[0], text: `${min}` },
  ];

  const showDots = series.length <= 24;
  const gradId = "latency-area-fill";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-44 w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Latency trend chart"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.32" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridYs.map((y, i) => (
        <line
          key={i}
          x1={padL}
          y1={y}
          x2={W - padR}
          y2={y}
          stroke={RULE}
          strokeWidth="1"
        />
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

      <text
        x={padL - 8}
        y={padT - 2}
        textAnchor="end"
        style={{ fontSize: "8px", fill: MUTED }}
      >
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
            fill="hsl(45 14% 96%)"
            stroke={ACCENT}
            strokeWidth="1.75"
          >
            <title>
              {`${new Date(p.t).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })} · ${p.ms}ms`}
            </title>
          </circle>
        ))}
    </svg>
  );
}

export function AvailabilityStrip({
  timeline,
}: {
  timeline: Array<{
    t: string;
    status: "up" | "down" | "error" | "mixed" | "empty";
    up: number;
    down: number;
    error: number;
  }>;
}) {
  const legend = [
    { key: "up", label: "Up", color: EMERALD },
    { key: "down", label: "Down", color: ROSE },
    { key: "error", label: "Error", color: AMBER },
    { key: "mixed", label: "Mixed", color: "hsl(38 92% 65%)" },
  ] as const;

  return (
    <div>
      {timeline.length === 0 ? (
        <div className="h-6 w-full border border-rule bg-rule/20" />
      ) : (
        <div className="flex h-6 w-full gap-px overflow-hidden border border-rule">
          {timeline.map((b) => (
            <div
              key={b.t}
              className="h-full flex-1"
              style={{ background: statusColor(b.status) }}
              title={`${new Date(b.t).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })} · ${b.status}`}
            />
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {legend.map((l) => (
          <span
            key={l.key}
            className="inline-flex items-center gap-1.5 border border-rule px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted"
          >
            <span
              className="inline-block h-2 w-2"
              style={{ background: l.color }}
            />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({
  codes,
  totalChecks,
}: {
  codes: Record<string, number>;
  totalChecks: number;
}) {
  const entries = Object.entries(codes).sort((a, b) => b[1] - a[1]);
  const sum = entries.reduce((s, [, c]) => s + c, 0) || totalChecks || 1;

  if (entries.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted">No status codes recorded yet.</p>
    );
  }

  const size = 128;
  const cx = 64;
  const cy = 64;
  const r = 44;
  const strokeW = 18;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const segments = entries.map(([code, count]) => {
    const frac = count / sum;
    const len = Math.max(frac * circ, 0.01);
    const seg = {
      code,
      count,
      pct: Math.round(frac * 100),
      color: codeFamilyColor(code),
      dasharray: `${len} ${circ - len}`,
      dashoffset: -offset,
    };
    offset += len;
    return seg;
  });

  return (
    <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
        role="img"
        aria-label="Status code distribution"
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={RULE}
          strokeWidth={strokeW}
        />
        {segments.map((s) => (
          <circle
            key={s.code}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeW}
            strokeDasharray={s.dasharray}
            strokeDashoffset={s.dashoffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        ))}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          style={{
            fontSize: "22px",
            fontWeight: 500,
            fill: INK,
            letterSpacing: "-0.025em",
            fontFamily: "var(--font-display), system-ui, sans-serif",
          }}
        >
          {totalChecks}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          style={{
            fontSize: "9px",
            fill: MUTED,
            letterSpacing: "0.1em",
            fontWeight: 500,
          }}
        >
          CHECKS
        </text>
      </svg>

      <ul className="w-full min-w-0 flex-1 space-y-2">
        {segments.map((s) => (
          <li
            key={s.code}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span className="inline-flex items-center gap-2 font-medium text-ink">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0"
                style={{ background: s.color }}
              />
              HTTP {s.code}
            </span>
            <span className="tabular-nums text-muted">
              {s.count} · {s.pct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExpiryRingCard({
  title,
  days,
  expiresAt,
  warnAt,
}: {
  title: string;
  days: number | null;
  expiresAt: string | null;
  warnAt: number;
}) {
  const critical = days != null && days <= 7;
  const warn = days != null && days <= warnAt;
  const maxDays = warnAt * 3;
  const pct =
    days == null
      ? 0
      : Math.max(0, Math.min(100, Math.round((days / maxDays) * 100)));
  const stroke = critical ? ROSE : warn ? AMBER : ACCENT;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="rounded-none border border-rule bg-bg p-4">
      <p className="label-caps text-muted">{title}</p>
      <div className="mt-3 flex items-center gap-4">
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          className="shrink-0"
          aria-hidden
        >
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke={RULE}
            strokeWidth="6"
          />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke={days == null ? MUTED : stroke}
            strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 32 32)"
            style={{ transition: "stroke-dashoffset 0.65s ease" }}
          />
          <text
            x="32"
            y="34"
            textAnchor="middle"
            style={{
              fontSize: "12px",
              fontWeight: 500,
              fill: INK,
              fontFamily: "var(--font-display), system-ui, sans-serif",
            }}
          >
            {days == null ? "—" : days}
          </text>
        </svg>
        <div className="min-w-0">
          <p
            className={`font-display text-2xl font-medium ${
              critical ? "text-rose-700" : warn ? "text-amber-800" : "text-ink"
            }`}
          >
            {days == null ? "—" : `${days} days`}
          </p>
          <p className="mt-1 text-xs text-muted">
            {expiresAt
              ? `Expires ${new Date(expiresAt).toLocaleDateString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "medium",
                })}`
              : "Expiry not available"}
          </p>
        </div>
      </div>
    </div>
  );
}
