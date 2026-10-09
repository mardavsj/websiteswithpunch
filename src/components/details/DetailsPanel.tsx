import type { AnalyticsPayload } from "@/components/analytics-types";
import { NEEDS_DETAILS, type DetailsSection, type SiteDetails } from "./types";
import { DetailsSkeleton } from "./parts";
import { DowntimePanel, HealthPanel, LatencyPanel, UptimePanel } from "./panels-checks";
import { CodesPanel, IncidentsPanel, TimelinePanel, TrendPanel } from "./panels-charts";
import { DomainPanel, SslPanel } from "./panels-expiry";

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
          <p className="border border-rose-200 bg-rose-50 px-3 py-2 text-danger dark:border-rose-400/30 dark:bg-rose-400/10">
            {error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 border border-rule px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft"
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
