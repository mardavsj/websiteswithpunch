import { formatDuration } from "@/lib/analytics";
import { AvailabilityStrip, DonutChart, RingGauge } from "./analytics-charts";
import { LatencyAreaChart, seriesRange } from "./LatencyChart";
import { DomainExpiryMeter, ExpiryRingCard } from "./expiry-meters";
import { DetailsButton } from "./details/DetailsContext";
import type { DetailsSection } from "./details/types";

import type { AnalyticsPayload } from "./analytics-types";
export type { AnalyticsPayload };

export function timeAgo(iso: string | null | undefined, never = "Never in this range"): string {
  if (!iso) return never;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "Just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

/** Card title row with the section's Details button at the top right. */
function Head({ section, title, className = "" }: { section: DetailsSection; title: string; className?: string }) {
  return (
    <div className={`flex w-full items-start justify-between gap-2 ${className}`}>
      <p className="label-caps text-muted">{title}</p>
      <DetailsButton section={section} label={title} />
    </div>
  );
}

/** SSL + domain cards, driven by the site record (not by check history). */
export function ExpiryCards({ data }: { data: AnalyticsPayload }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ExpiryRingCard
        title="SSL certificate"
        action={<DetailsButton section="ssl" label="SSL certificate" />}
        days={data.ssl.daysLeft}
        expiresAt={data.ssl.expiresAt}
        addedAt={data.siteCreatedAt}
      />
      <DomainExpiryMeter
        action={<DetailsButton section="domain" label="Domain registration" />}
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
          <Head section="health" title="Health score" className="mb-2" />
          <RingGauge
            value={data.healthScore}
            label="Score"
            caption={data.healthLabel}
          />
        </div>
        <div className="flex flex-col items-center justify-center border border-rule bg-surface p-4">
          <Head section="uptime" title="Uptime" className="mb-2" />
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
          <Head section="latency" title="Avg latency" />
          <p className="mt-2 font-display text-3xl font-medium text-ink">
            {data.latency.avg == null ? "—" : `${data.latency.avg}ms`}
          </p>
          <p className="text-sm text-muted">
            p95 {data.latency.p95 == null ? "—" : `${data.latency.p95}ms`}
          </p>
        </div>
        <div className="border border-rule bg-surface p-4">
          <Head section="downtime" title="Last downtime" />
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
            <div className="flex items-center gap-2">
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
            <DetailsButton section="trend" label="Latency trend" />
            </div>
          </div>
          <div className="mt-2">
            <LatencyAreaChart series={data.latency.series} />
          </div>
        </div>
        <div className="border border-rule bg-surface p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-sm font-medium text-ink">Availability timeline</p>
            <DetailsButton section="timeline" label="Availability timeline" />
          </div>
          <p className="mt-1 text-xs text-muted">
            Segment density follows the selected range
          </p>
          <div className="mt-4">
            <AvailabilityStrip timeline={data.timeline} />
          </div>
        </div>
      </div>

      <ExpiryCards data={data} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border border-rule bg-surface p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-sm font-medium text-ink">Incidents</p>
            <DetailsButton section="incidents" label="Incidents" />
          </div>
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
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-sm font-medium text-ink">Status codes</p>
            <DetailsButton section="codes" label="Status codes" />
          </div>
          <DonutChart
            codes={data.statusCodes}
            totalChecks={data.totals.checks}
          />
        </div>
      </div>
    </div>
  );
}
