"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDuration, type RangeKey } from "@/lib/analytics";

type AnalyticsPayload = {
  range: RangeKey;
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

function Sparkline({ series }: { series: Array<{ t: string; ms: number }> }) {
  if (series.length < 2) {
    return (
      <div className="flex h-16 items-center text-xs text-muted">Not enough latency samples yet</div>
    );
  }
  const values = series.map((p) => p.ms);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const w = 320;
  const h = 64;
  const pts = series
    .map((p, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - ((p.ms - min) / span) * (h - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" preserveAspectRatio="none">
      <polyline fill="none" stroke="hsl(216 84% 53%)" strokeWidth="2" points={pts} />
    </svg>
  );
}

function TimelineBar({
  timeline,
}: {
  timeline: AnalyticsPayload["timeline"];
}) {
  if (!timeline.length) {
    return <div className="h-3 rounded-none bg-rule/40" />;
  }
  const color = (s: string) => {
    if (s === "up") return "bg-emerald-500";
    if (s === "down") return "bg-rose-500";
    if (s === "error") return "bg-amber-400";
    if (s === "mixed") return "bg-amber-300";
    return "bg-rule/30";
  };
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-none border border-rule">
      {timeline.map((b) => (
        <div
          key={b.t}
          className={`h-full flex-1 ${color(b.status)}`}
          title={`${new Date(b.t).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · ${b.status}`}
        />
      ))}
    </div>
  );
}

function CountdownCard({
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
  const pct =
    days == null ? 0 : Math.max(0, Math.min(100, Math.round((days / (warnAt * 3)) * 100)));
  const critical = days != null && days <= 7;
  const warn = days != null && days <= warnAt;
  return (
    <div className="rounded-none border border-rule bg-bg p-4">
      <p className="label-caps text-muted">{title}</p>
      <p
        className={`mt-2 font-display text-2xl font-medium ${
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
      <div className="mt-3 h-1.5 w-full bg-rule/30">
        <div
          className={`h-full transition-all duration-500 ${
            critical ? "bg-rose-500" : warn ? "bg-amber-500" : "bg-accent"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SiteAnalytics({
  siteId,
  compact = false,
}: {
  siteId: string;
  compact?: boolean;
}) {
  const [range, setRange] = useState<RangeKey>("7d");
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fade, setFade] = useState(true);

  const load = useCallback(
    async (r: RangeKey) => {
      setLoading(true);
      setError(null);
      setFade(false);
      try {
        const res = await fetch(`/api/sites/${siteId}/analytics?range=${r}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Could not load analytics");
        const json = (await res.json()) as AnalyticsPayload;
        setData(json);
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
    load(range);
  }, [range, load]);

  return (
    <section
      className={`rounded-none border border-rule bg-bg ${compact ? "p-4" : "p-5 sm:p-6"}`}
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
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                  range === r.key
                    ? "bg-ink text-bg"
                    : "bg-bg text-muted hover:bg-accent-soft hover:text-ink"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => load(range)}
            className="border border-rule px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft"
          >
            Refresh
          </button>
        </div>
      </div>

      <div
        className={`mt-5 transition-opacity duration-300 ${fade && !loading ? "opacity-100" : "opacity-40"}`}
      >
        {error && (
          <p className="rounded-none border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        )}

        {loading && !data && (
          <div className="grid gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse border border-rule bg-accent-soft/40" />
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
              <div className="border border-rule p-4">
                <p className="label-caps text-muted">Health score</p>
                <p className="mt-2 font-display text-3xl font-medium text-ink">{data.healthScore}</p>
                <p className="text-sm text-accent">{data.healthLabel}</p>
              </div>
              <div className="border border-rule p-4">
                <p className="label-caps text-muted">Uptime</p>
                <p className="mt-2 font-display text-3xl font-medium text-ink">
                  {data.uptimePercent == null ? "—" : `${data.uptimePercent}%`}
                </p>
                <p className="text-sm text-muted">
                  {data.totals.checks} checks · {data.totals.down + data.totals.error} issues
                </p>
              </div>
              <div className="border border-rule p-4">
                <p className="label-caps text-muted">Avg latency</p>
                <p className="mt-2 font-display text-3xl font-medium text-ink">
                  {data.latency.avg == null ? "—" : `${data.latency.avg}ms`}
                </p>
                <p className="text-sm text-muted">
                  p95 {data.latency.p95 == null ? "—" : `${data.latency.p95}ms`}
                </p>
              </div>
              <div className="border border-rule p-4">
                <p className="label-caps text-muted">Last downtime</p>
                <p className="mt-2 font-display text-xl font-medium text-ink">
                  {timeAgo(data.lastDowntimeAt)}
                </p>
                <p className="text-sm text-muted">In selected range</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="border border-rule p-4">
                <div className="flex items-center justify-between">
                  <p className="font-display text-sm font-medium text-ink">Latency trend</p>
                  <p className="text-xs text-muted">
                    {data.latency.min ?? "—"}–{data.latency.max ?? "—"} ms
                  </p>
                </div>
                <div className="mt-3">
                  <Sparkline series={data.latency.series} />
                </div>
              </div>
              <div className="border border-rule p-4">
                <p className="font-display text-sm font-medium text-ink">Availability timeline</p>
                <p className="mt-1 text-xs text-muted">Green up · Rose down · Amber errors/mixed</p>
                <div className="mt-4">
                  <TimelineBar timeline={data.timeline} />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <CountdownCard
                title="SSL certificate"
                days={data.ssl.daysLeft}
                expiresAt={data.ssl.expiresAt}
                warnAt={30}
              />
              <CountdownCard
                title="Domain registration"
                days={data.domain.daysLeft}
                expiresAt={data.domain.expiresAt}
                warnAt={60}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="border border-rule p-4">
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
              <div className="border border-rule p-4">
                <p className="font-display text-sm font-medium text-ink">Status codes</p>
                {Object.keys(data.statusCodes).length === 0 ? (
                  <p className="mt-3 text-sm text-muted">No status codes recorded yet.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {Object.entries(data.statusCodes)
                      .sort((a, b) => b[1] - a[1])
                      .map(([code, count]) => {
                        const pct = Math.round((count / data.totals.checks) * 100);
                        return (
                          <li key={code}>
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-ink">HTTP {code}</span>
                              <span className="text-muted">
                                {count} · {pct}%
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 bg-rule/30">
                              <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
