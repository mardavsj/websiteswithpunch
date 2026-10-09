"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  expiryHue,
  expiryWindow,
  formatDay,
  formatSpanLong,
  formatSpanShort,
} from "@/lib/expiry-window";

/** SSL + domain expiry cards. Window = site added → expiry (full when added). */

const INK = "hsl(var(--ink))";
const MUTED = "hsl(var(--muted))";
const RULE = "hsl(var(--rule))";

/**
 * Colour follows % remaining (see expiryHue). The hue is set inline as
 * --meter-h; lightness switches per theme so it reads in light and dark.
 */
const METER_VARS = "[--meter-l:44%] dark:[--meter-l:55%]";
const METER_FILL = "hsl(var(--meter-h) 72% var(--meter-l))";
const METER_TEXT = "text-[hsl(var(--meter-h)_70%_32%)] dark:text-[hsl(var(--meter-h)_75%_66%)]";
const meterStyle = (h: number) => ({ "--meter-h": String(h) }) as CSSProperties;

export function ExpiryRingCard({
  title,
  action,
  days,
  expiresAt,
  addedAt,
}: {
  title: string;
  /** Top-right control (the Details button). */
  action?: ReactNode;
  days: number | null;
  expiresAt: string | null;
  addedAt?: string | null;
}) {
  const win = expiryWindow({ days, expiresAt, addedAt });
  const pct = win?.pct ?? 0;
  const hue = expiryHue(pct, days);
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const expiry = formatDay(expiresAt);
  const added = formatDay(addedAt);

  return (
    <div
      className={`rounded-none border border-rule bg-surface p-4 ${METER_VARS}`}
      style={meterStyle(hue)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="label-caps text-muted">{title}</p>
        {action}
      </div>
      <div className="mt-3 flex items-center gap-4">
        <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0" aria-hidden>
          <circle cx="32" cy="32" r={r} fill="none" stroke={RULE} strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 32 32)"
            style={{
              stroke: days == null ? MUTED : METER_FILL,
              transition: "stroke-dashoffset 0.65s ease, stroke 0.3s ease",
            }}
          />
          <text
            x="32"
            y="36"
            textAnchor="middle"
            style={{
              fontSize: "12px",
              fontWeight: 500,
              fill: INK,
              fontFamily: "var(--font-display), system-ui, sans-serif",
            }}
          >
            {days == null ? "—" : `${pct}%`}
          </text>
        </svg>
        <div className="min-w-0">
          <p
            className={`font-display text-2xl font-medium ${
              win?.expired ? "text-danger" : days == null ? "text-ink" : METER_TEXT
            }`}
          >
            {days == null ? "—" : win?.expired ? "Expired" : `${days} days`}
          </p>
          <p className="mt-1 text-xs text-muted">
            {expiry ? `Expires ${expiry}` : "Expiry not available"}
          </p>
          {win && !win.expired && (
            <p className="text-xs text-muted">
              {pct}% remaining{added ? ` · added ${added}` : ""}
            </p>
          )}
          {win?.expired && <p className="text-xs text-danger">Certificate expired</p>}
        </div>
      </div>
    </div>
  );
}

export function DomainExpiryMeter({
  action,
  days,
  expiresAt,
  addedAt,
}: {
  action?: ReactNode;
  days: number | null;
  expiresAt: string | null;
  addedAt?: string | null;
}) {
  const win = expiryWindow({ days, expiresAt, addedAt });
  const expired = Boolean(win?.expired);
  const pct = win?.pct ?? 0;
  const hue = expiryHue(pct, days);
  const expiry = formatDay(expiresAt);
  const added = formatDay(addedAt);

  const W = 400;
  const trackY = 8;
  const trackH = 10;
  const padX = 2;
  const trackW = W - padX * 2;
  // Anchored at the LEFT (expires side): shrinks toward "Expires" over time.
  const fillW = (pct / 100) * trackW;
  const midLabel = win && !expired ? formatSpanShort(win.midDays) : null;

  return (
    <div
      className={`rounded-none border border-rule bg-surface p-4 ${METER_VARS}`}
      style={meterStyle(hue)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="label-caps text-muted">Domain registration</p>
        {action}
      </div>

      <p
        className={`mt-3 font-display text-3xl font-medium tabular-nums ${
          expired ? "text-danger" : days == null ? "text-ink" : METER_TEXT
        }`}
      >
        {days == null ? "—" : expired ? "Expired" : days}
        {days != null && !expired ? (
          <span className="ml-1.5 text-base font-normal text-muted">days left</span>
        ) : null}
      </p>

      <svg
        viewBox={`0 0 ${W} 26`}
        className="mt-4 h-7 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={
          days == null
            ? "Domain registration expiry unavailable"
            : expired
              ? "Domain registration expired"
              : `Domain registration: ${days} days left, ${pct}% of the time since the site was added remaining`
        }
      >
        <rect x={padX} y={trackY} width={trackW} height={trackH} fill={RULE} />
        {pct > 0 && (
          <rect
            x={padX}
            y={trackY}
            width={Math.max(fillW, 2)}
            height={trackH}
            style={{ fill: METER_FILL, transition: "width 0.65s ease, fill 0.3s ease" }}
          />
        )}
        {win &&
          [0, 0.5, 1].map((f) => {
            const x = padX + f * trackW;
            return (
              <line
                key={f}
                x1={x}
                y1={trackY - 3}
                x2={x}
                y2={trackY + trackH + 3}
                stroke={INK}
                strokeOpacity={0.28}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
      </svg>

      {win && (
        <div className="mt-1.5 grid grid-cols-3 gap-2 text-[11px] font-medium leading-tight tracking-wide text-muted">
          <span className="min-w-0 text-left">
            Expires
            {expiry && <span className="block font-normal">{expiry}</span>}
          </span>
          <span className="min-w-0 text-center" title={`Halfway point: ${midLabel} left`}>
            {midLabel}
          </span>
          <span className="min-w-0 text-right">
            Added
            {added && <span className="block font-normal">{added}</span>}
          </span>
        </div>
      )}

      <p className={`mt-2 text-xs ${expired ? "text-danger" : "text-muted"}`}>
        {days == null
          ? "Expiry not available"
          : expired
            ? `Expired${expiry ? ` on ${expiry}` : ""}`
            : `${pct}% remaining · ${formatSpanLong(days)}`}
      </p>
    </div>
  );
}
