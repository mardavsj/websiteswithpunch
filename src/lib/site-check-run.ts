import type { Site } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkUptime, runFullSiteCheck } from "@/lib/checks";

/** Live checks (analytics page auto-refresh): at most one per site per 45s. */
export const LIVE_MIN_GAP_MS = 45_000;
/** Manual Recheck: guards against double-clicks / rapid repeats. */
export const MANUAL_MIN_GAP_MS = 10_000;

export type SiteCheckOutcome =
  | { throttled: true; site: Site; retryAfterMs: number }
  | { throttled: false; site: Site; result: unknown };

/**
 * Runs and stores a check for one site, with a per-site throttle shared by all
 * tabs/devices. The throttle slot is claimed atomically (conditional update on
 * lastCheckedAt), so concurrent callers can't both run a check.
 * live=true runs the cheap uptime-only check; otherwise the full check
 * (uptime + SSL + domain) as before.
 */
export async function runSiteCheck(site: Site, live: boolean): Promise<SiteCheckOutcome> {
  const minGapMs = live ? LIVE_MIN_GAP_MS : MANUAL_MIN_GAP_MS;
  const now = new Date();
  const claimed = await prisma.site.updateMany({
    where: {
      id: site.id,
      OR: [
        { lastCheckedAt: null },
        { lastCheckedAt: { lt: new Date(now.getTime() - minGapMs) } },
      ],
    },
    data: { lastCheckedAt: now },
  });

  if (claimed.count === 0) {
    const fresh = (await prisma.site.findUnique({ where: { id: site.id } })) ?? site;
    const last = fresh.lastCheckedAt?.getTime() ?? now.getTime();
    return {
      throttled: true,
      site: fresh,
      retryAfterMs: Math.max(0, minGapMs - (now.getTime() - last)),
    };
  }

  try {
    if (live) {
      const uptime = await checkUptime(site.url);
      const updated = await prisma.site.update({
        where: { id: site.id },
        data: {
          status: uptime.status,
          lastCheckedAt: new Date(),
          lastStatusCode: uptime.statusCode,
          lastLatencyMs: uptime.latencyMs,
        },
      });
      await prisma.checkResult.create({
        data: {
          siteId: site.id,
          status: uptime.status,
          statusCode: uptime.statusCode,
          latencyMs: uptime.latencyMs,
          error: uptime.error,
        },
      });
      return { throttled: false, site: updated, result: { uptime } };
    }

    const result = await runFullSiteCheck(site.url);
    const updated = await prisma.site.update({
      where: { id: site.id },
      data: {
        status: result.uptime.status,
        lastCheckedAt: new Date(),
        lastStatusCode: result.uptime.statusCode,
        lastLatencyMs: result.uptime.latencyMs,
        sslExpiresAt: result.ssl.expiresAt,
        sslDaysLeft: result.ssl.daysLeft,
        domainExpiresAt: result.domain.expiresAt,
        domainDaysLeft: result.domain.daysLeft,
      },
    });
    await prisma.checkResult.create({
      data: {
        siteId: site.id,
        status: result.uptime.status,
        statusCode: result.uptime.statusCode,
        latencyMs: result.uptime.latencyMs,
        error: result.uptime.error,
      },
    });
    return { throttled: false, site: updated, result };
  } catch (err) {
    // Release the throttle slot so a failed check doesn't fake a fresh timestamp.
    await prisma.site
      .update({ where: { id: site.id }, data: { lastCheckedAt: site.lastCheckedAt } })
      .catch(() => undefined);
    throw err;
  }
}
