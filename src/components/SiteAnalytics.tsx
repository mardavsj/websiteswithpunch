"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatDuration,
  lockedRangeNotice,
  type RangeKey,
} from "@/lib/analytics";
import {
  AvailabilityStrip,
  DomainExpiryMeter,
  DonutChart,
  ExpiryRingCard,
  LatencyAreaChart,
  RingGauge,
} from "./analytics-charts";

type AnalyticsPayload = {
  range: RangeKey;
  requestedRange?: RangeKey;
  rangeClamped?: boolean;
  siteCreatedAt?: string;
  ageMs?: number;
  ageDays?: number;
  unlockedRanges?: RangeKey[];
  healthScore: number;
  healthLabel: string;
  uptimePercent: number | null;
  totals: { checks: number; up: number; down: number; error: number };
  latency: {
    avg: number | null;
    p95: number | null;
    min: number | null;
    max: number | null;
    series: Array<{ t: string; ms: number }>;
  };
  timeline: Array<{
    t: string;
    status: "up" | "down" | "error" | "mixed" | "empty";
    up: number;
    down: number;
    error: number;
  }>;
  incidents: Array<{
    status: string;
    startedAt: string;
    endedAt: string | null;
    durationMs: number | null;
    statusCode: number | null;
    error: string | null;
  }>;
  ssl: { daysLeft: number | null; expiresAt: string | null };
  domain: { daysLeft: number | null; expiresAt: string | null };
  statusCodes: Record<string, number>;
  lastDowntimeAt: string | null;
  empty: boolean;
};

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "All" },
];

function timeAgo(iso: string | null): string {
  if (!iso) return "Never in this range";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "Just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export function SiteAnalytics({
  siteId,
  compact = false,
}: {
  siteId: string;
  compact?: boolean;
}) {
  // First fetch uses 24h (always unlocked once site exists); API clamps if needed.
  const [range, setRange] = useState<RangeKey>("24h");
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fade, setFade] = useState(true);
  const [lockNotice, setLockNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unlockedRanges: RangeKey[] = data?.unlockedRanges?.length
    ? data.unlockedRanges
    : ["24h"];
  const ageDays = data?.ageDays ?? 0;

  const clearNotice = useCallback(() => {
    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
      noticeTimer.current = null;
    }
    setLockNotice(null);
  }, []);

  const showLockNotice = useCallback(
    (locked: RangeKey) => {
      const msg = lockedRangeNotice(ageDays, locked);
      setLockNotice(msg);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => {
        setLockNotice(null);
        noticeTimer.current = null;
      }, 6000);
    },
    [ageDays]
  );

  useEffect(() => {
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  const load = useCallback(
    async (r: RangeKey) => {
      setLoading(true);
      setError(null);
      setFade(false);
      try {
        const res = await fetch(
          `/api/sites/${siteId}/analytics?range=${encodeURIComponent(r)}&_=${Date.now()}`,
          {
            method: "GET",
            cache: "no-store",
            headers: { Accept: "application/json" },
          }
        );
        if (!res.ok) throw new Error("Could not load analytics");
        const json = (await res.json()) as AnalyticsPayload;
        setData(json);
        setRange(json.range);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
        requestAnimationFrame(() => setFade(true));
      }
    },
    [siteId]
  );

  useEffect(() => {
    void load("24h");
    // intentionally only on mount / site change — range changes call load directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, load]);

  function selectRange(next: RangeKey) {
    const isUnlocked = unlockedRanges.includes(next);
    if (!isUnlocked) {
      showLockNotice(next);
      return;
    }
    clearNotice();
    if (next === range && !loading) {
      void load(next);
      return;
    }
    setRange(next);
    void load(next);
  }

  return (
    <section
      className={`rounded-none border border-rule bg-surface ${compact ? "p-4" : "p-5 sm:p-6"}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-medium text-ink">Site analytics</h2>
          <p className="text-xs text-muted">
            Built from real checks — uptime, latency, incidents, SSL & domain risk.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex border border-rule">
            {RANGES.map((r) => {
              const locked = !unlockedRanges.includes(r.key);
              const active = range === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => selectRange(r.key)}
                  aria-disabled={locked || undefined}
                  title={
                    locked
                      ? lockedRangeNotice(ageDays, r.key)
                      : undefined
                  }
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
            onClick={() => {
              clearNotice();
              void load(range);
            }}
            className="border border-rule px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft"
          >
            Refresh
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">Longer ranges unlock as this site ages.</p>

      {lockNotice && (
        <p
          role="status"
          className="mt-2 rounded-none border border-amber-200 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-400/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100"
        >
          {lockNotice}
        </p>
      )}

      {data && (
        <p className="mt-3 text-xs text-muted">
          Showing <span className="font-medium text-ink">{data.range}</span>
          {" · "}
          <span className="font-medium text-ink">{data.totals.checks}</span> checks in this window
          {loading ? " · updating…" : ""}
        </p>
      )}

      <div
        key={data?.range ?? "loading"}
        className={`mt-5 transition-opacity duration-300 ${fade && !loading ? "opacity-100" : "opacity-40"}`}
      >
        {error && (
          <p className="rounded-none border border-rose-200 bg-rose-50 dark:border-rose-400/30 dark:bg-rose-400/10 px-3 py-2 text-sm text-rose-800 dark:text-rose-200">
            {error}
          </p>
        )}

        {loading && !data && (
          <div className="grid gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse border border-rule bg-accent-soft/40" />
            ))}
          </div>
        )}

        {data && data.empty && (
          <div className="border border-dashed border-rule px-4 py-10 text-center">
            <p className="font-display text-base font-medium text-ink">No check history yet</p>
            <p className="mt-2 text-sm text-muted">
              Hit Recheck on the site card to start building uptime and latency history.
            </p>
          </div>
        )}

        {data && !data.empty && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center justify-center border border-rule bg-surface p-4">
                <p className="label-caps mb-2 self-start text-muted">Health score</p>
                <RingGauge
                  value={data.healthScore}
                  label="Score"
                  caption={data.healthLabel}
                />
              </div>
              <div className="flex flex-col items-center justify-center border border-rule bg-surface p-4">
                <p className="label-caps mb-2 self-start text-muted">Uptime</p>
                <RingGauge
                  value={data.uptimePercent}
                  label="Uptime"
                  suffix="%"
                />
                <p className="mt-2 text-center text-xs text-muted">
                  {data.totals.checks} checks · {data.totals.down + data.totals.error} issues
                </p>
              </div>
              <div className="border border-rule bg-surface p-4">
                <p className="label-caps text-muted">Avg latency</p>
                <p className="mt-2 font-display text-3xl font-medium text-ink">
                  {data.latency.avg == null ? "—" : `${data.latency.avg}ms`}
                </p>
                <p className="text-sm text-muted">
                  p95 {data.latency.p95 == null ? "—" : `${data.latency.p95}ms`}
                </p>
              </div>
              <div className="border border-rule bg-surface p-4">
                <p className="label-caps text-muted">Last downtime</p>
                <p className="mt-2 font-display text-xl font-medium text-ink">
                  {timeAgo(data.lastDowntimeAt)}
                </p>
                <p className="text-sm text-muted">In selected range</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="border border-rule bg-surface p-4">
                <div className="flex items-center justify-between">
                  <p className="font-display text-sm font-medium text-ink">Latency trend</p>
                  <p className="text-xs text-muted">
                    {data.latency.min ?? "—"}–{data.latency.max ?? "—"} ms
                  </p>
                </div>
                <div className="mt-2">
                  <LatencyAreaChart series={data.latency.series} />
                </div>
              </div>
              <div className="border border-rule bg-surface p-4">
                <p className="font-display text-sm font-medium text-ink">Availability timeline</p>
                <p className="mt-1 text-xs text-muted">
                  Segment density follows the selected range
                </p>
                <div className="mt-4">
                  <AvailabilityStrip timeline={data.timeline} />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ExpiryRingCard
                title="SSL certificate"
                days={data.ssl.daysLeft}
                expiresAt={data.ssl.expiresAt}
                warnAt={30}
              />
              <DomainExpiryMeter
                days={data.domain.daysLeft}
                expiresAt={data.domain.expiresAt}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="border border-rule bg-surface p-4">
                <p className="font-display text-sm font-medium text-ink">Incidents</p>
                {data.incidents.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">No incidents in this range. Nice.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-rule">
                    {data.incidents.map((inc, i) => (
                      <li key={`${inc.startedAt}-${i}`} className="py-2.5 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium capitalize text-ink">{inc.status}</span>
                          <span className="text-xs text-muted">
                            {formatDuration(inc.durationMs)}
                            {inc.endedAt ? "" : " · ongoing"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          {new Date(inc.startedAt).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })}
                          {inc.statusCode != null ? ` · HTTP ${inc.statusCode}` : ""}
                          {inc.error ? ` · ${inc.error}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="border border-rule bg-surface p-4">
                <p className="font-display text-sm font-medium text-ink">Status codes</p>
                <DonutChart
                  codes={data.statusCodes}
                  totalChecks={data.totals.checks}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
