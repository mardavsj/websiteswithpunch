"use client";

import type { ReactNode } from "react";
import { lockedRangeNotice, type RangeKey } from "@/lib/analytics";

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "All" },
];

/** Title row with range buttons, manual Refresh and the live indicator slot. */
export function AnalyticsHeader({
  range,
  unlockedRanges,
  ageDays,
  loading,
  onSelect,
  onRefresh,
  live,
}: {
  range: RangeKey;
  unlockedRanges: RangeKey[];
  ageDays: number;
  loading: boolean;
  onSelect: (r: RangeKey) => void;
  onRefresh: () => void;
  live?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-medium text-ink">Site analytics</h2>
        <p className="text-xs text-muted">
          Built from real checks — uptime, latency, incidents, SSL & domain risk.
        </p>
      </div>
      <div className="flex min-w-0 flex-col gap-2 sm:items-end">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex border border-rule">
            {RANGES.map((r) => {
              const locked = !unlockedRanges.includes(r.key);
              const active = range === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => onSelect(r.key)}
                  aria-disabled={locked || undefined}
                  aria-pressed={active}
                  title={locked ? lockedRangeNotice(ageDays, r.key) : undefined}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                    locked
                      ? "cursor-not-allowed bg-bg text-muted opacity-40"
                      : active
                        ? "bg-solid text-solid-fg"
                        : "bg-bg text-muted hover:bg-accent-soft hover:text-ink"
                  } ${loading && active && !locked ? "opacity-70" : ""}`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="border border-rule px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft"
          >
            Refresh
          </button>
        </div>
        {live}
      </div>
    </div>
  );
}
