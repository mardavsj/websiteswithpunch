import type { DomainInfo, SslInfo } from "@/lib/site-info";
import type { CHECK_SCHEDULE } from "@/lib/check-schedule";

export type DetailsSection =
  | "health"
  | "uptime"
  | "latency"
  | "downtime"
  | "trend"
  | "timeline"
  | "ssl"
  | "domain"
  | "incidents"
  | "codes";

/** GET /api/sites/[id]/details */
export type SiteDetails = {
  ssl: SslInfo | null;
  domain: DomainInfo | null;
  uptimeWindows: Array<{ key: string; days: number; checks: number; percent: number | null }>;
  firstCheckAt: string | null;
  lastFullCheckAt: string | null;
  lastUpAt: string | null;
  lastIssue: { at: string; status: string; code: number | null; error: string | null } | null;
  schedule: typeof CHECK_SCHEDULE;
  siteAddedAt: string;
};

/** Sections whose panel needs /details (the rest read the analytics payload already on screen). */
export const NEEDS_DETAILS: DetailsSection[] = ["uptime", "downtime", "ssl", "domain"];
