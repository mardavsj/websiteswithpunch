import { formatDuration, type RangeKey } from "@/lib/analytics";
import { AvailabilityStrip, DonutChart, RingGauge } from "./analytics-charts";
import { LatencyAreaChart, seriesRange } from "./LatencyChart";
import { DomainExpiryMeter, ExpiryRingCard } from "./expiry-meters";
import { TechStackCard, type TechPayload } from "./TechStackCard";

export type AnalyticsPayload = {
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
  /** Detected technologies (add site / Recheck / daily). */
  tech?: TechPayload;
  statusCodes: Record<string, number>;
  lastDowntimeAt: string | null;
  empty: boolean;
  stale?: boolean;
  dataEndsAt?: string | null;
  site?: {
    status: string;
    lastCheckedAt: string | null;
    lastSeenAt?: string | null;
    lastStatusCode: number | null;
    lastLatencyMs: number | null;
  };
};

export function timeAgo(iso: string | null | undefined, never = "Never in this range"): string {
  if (!iso) return never;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "Just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

/** SSL + domain cards, driven by the site record (not by check history). */
export function ExpiryCards({ data }: { data: AnalyticsPayload }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ExpiryRingCard
        title="SSL certificate"
        days={data.ssl.daysLeft}
        expiresAt={data.ssl.expiresAt}
        addedAt={data.siteCreatedAt}
      />
      <DomainExpiryMeter
        days={data.domain.daysLeft}
        expiresAt={data.domain.expiresAt}
        addedAt={data.siteCreatedAt}
      />
    </div>
  );
}

export function SiteAnalyticsBody({ data }: { data: AnalyticsPayload }) {
  const stale = Boolean(data.stale);
  // Header range comes from the plotted series, so it always matches the chart.
  const plotted = seriesRange(data.latency.series);
  return (
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
          <p className="text-sm text-muted">{stale ? "In last saved window" : "In selected range"}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border border-rule bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-medium text-ink">Latency trend</p>
            <p
              className="text-xs tabular-nums text-muted"
              title={
                data.latency.min != null
                  ? `Fastest ${data.latency.min}ms · slowest ${data.latency.max}ms (single checks)`
                  : undefined
              }
            >
              {plotted ? `${plotted.min}–${plotted.max} ms` : "— ms"}
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

      <ExpiryCards data={data} />

      <TechStackCard tech={data.tech} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border border-rule bg-surface p-4">
          <p className="font-display text-sm font-medium text-ink">Incidents</p>
          {data.incidents.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{stale ? "No incidents in the last saved window." : "No incidents in this range. Nice."}</p>
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
  );
}
