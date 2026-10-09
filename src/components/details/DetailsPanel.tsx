import type { AnalyticsPayload } from "@/components/analytics-types";
import { NEEDS_DETAILS, type DetailsSection, type SiteDetails } from "./types";
import type { ReactNode } from "react";
import { DetailsSkeleton } from "./parts";
import { DowntimePanel, UptimePanel } from "./panels-checks";
import { HealthPanel, LatencyPanel } from "./panels-perf";
import { TimelinePanel, TrendPanel } from "./panels-charts";
import { CodesPanel, IncidentsPanel } from "./panels-events";
import { SslPanel } from "./panel-ssl";
import { DomainPanel } from "./panel-domain";
import { IconAlert, IconCalendar, IconClock, IconGauge, IconGlobe, IconHash, IconList, IconPulse, IconShield } from "./icons";

export const SECTION_TITLES: Record<DetailsSection, string> = {
  health: "Health score",
  uptime: "Uptime",
  latency: "Response time",
  downtime: "Last downtime",
  trend: "Latency trend",
  timeline: "Availability timeline",
  ssl: "SSL certificate",
  domain: "Domain registration",
  incidents: "Incidents",
  codes: "Status codes",
};

export const SECTION_ICONS: Record<DetailsSection, ReactNode> = {
  health: <IconGauge />,
  uptime: <IconPulse />,
  latency: <IconClock />,
  downtime: <IconAlert />,
  trend: <IconPulse />,
  timeline: <IconCalendar />,
  ssl: <IconShield />,
  domain: <IconGlobe />,
  incidents: <IconList />,
  codes: <IconHash />,
};

type Props = {
  section: DetailsSection;
  data: AnalyticsPayload;
  details: SiteDetails | null;
  error: string | null;
  onRetry: () => void;
};

/** Body of the Details sheet for one analytics section. */
export function DetailsPanel({ section, data, details, error, onRetry }: Props) {
  if (NEEDS_DETAILS.includes(section) && !details) {
    if (error) {
      return (
        <div className="text-sm">
          <p className="flex gap-2 border border-rose-200 bg-rose-50 px-3 py-2.5 text-danger dark:border-rose-400/30 dark:bg-rose-400/10">
            <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 border border-rule bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft"
          >
            Try again
          </button>
        </div>
      );
    }
    return <DetailsSkeleton groups={section === "ssl" || section === "domain" ? 3 : 2} />;
  }
  switch (section) {
    case "health":
      return <HealthPanel data={data} />;
    case "uptime":
      return <UptimePanel data={data} details={details!} />;
    case "latency":
      return <LatencyPanel data={data} />;
    case "downtime":
      return <DowntimePanel data={data} details={details!} />;
    case "trend":
      return <TrendPanel data={data} />;
    case "timeline":
      return <TimelinePanel data={data} />;
    case "ssl":
      return <SslPanel data={data} details={details!} />;
    case "domain":
      return <DomainPanel data={data} details={details!} />;
    case "incidents":
      return <IncidentsPanel data={data} />;
    case "codes":
      return <CodesPanel data={data} />;
  }
}
