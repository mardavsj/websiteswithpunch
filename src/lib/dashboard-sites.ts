import type { Site } from "@prisma/client";
import { toClientSite } from "@/lib/site-limits";

/** What the dashboard passes to each SiteCard. */
export type DashboardSite = {
  id: string;
  name: string;
  url: string;
  status: string;
  lastCheckedAt: string | null;
  lastStatusCode: number | null;
  lastLatencyMs: number | null;
  sslDaysLeft: number | null;
  domainDaysLeft: number | null;
  locked: boolean;
};

/** Locked sites get their metrics hidden (toClientSite); dates become ISO strings. */
export function toDashboardSite(site: Site): DashboardSite {
  const s = toClientSite(site);
  return {
    id: s.id,
    name: s.name,
    url: s.url,
    status: s.status,
    lastCheckedAt: site.locked || !site.lastCheckedAt ? null : site.lastCheckedAt.toISOString(),
    lastStatusCode: s.lastStatusCode,
    lastLatencyMs: s.lastLatencyMs,
    sslDaysLeft: s.sslDaysLeft,
    domainDaysLeft: s.domainDaysLeft,
    locked: site.locked,
  };
}
