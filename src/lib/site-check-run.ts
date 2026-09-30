import type { Site } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkUptime, runFullSiteCheck } from "@/lib/checks";

/** Manual Recheck (full check): once per minute per site. */
export const RECHECK_COOLDOWN_MS = 60_000;
/** Auto-update live checks: at most one per site per 45s (any tab/device). */
export const LIVE_MIN_GAP_MS = 45_000;

export type SiteCheckOutcome =
  | { kind: "ok"; site: Site; result: unknown }
  /** Live check skipped: a check ran moments ago; the saved result is reused. */
  | { kind: "throttled"; site: Site; retryAfterMs: number }
  /** Manual Recheck refused: the last full check was under a minute ago. */
  | { kind: "cooldown"; site: Site; retryAfterMs: number };

/**
 * Site.lastCheckedAt = time of the last FULL check (add site, manual Recheck,
 * cron). Live checks only refresh status/latency and store a history row, so
 * the Recheck cooldown survives page refreshes and isn't reset by auto update.
 */
export async function runSiteCheck(site: Site, live: boolean): Promise<SiteCheckOutcome> {
  const now = Date.now();
  return live ? runLive(site, now) : runFull(site, now);
}

async function runLive(site: Site, now: number): Promise<SiteCheckOutcome> {
  const latest = await prisma.checkResult.findFirst({
    where: { siteId: site.id },
    orderBy: [{ checkedAt: "desc" }, { id: "desc" }],
    select: { checkedAt: true },
  });
  const since = latest ? now - latest.checkedAt.getTime() : Infinity;
  if (since < LIVE_MIN_GAP_MS) {
    return { kind: "throttled", site, retryAfterMs: LIVE_MIN_GAP_MS - since };
  }
  const uptime = await checkUptime(site.url);
  const updated = await prisma.site.update({
    where: { id: site.id },
    data: {
      status: uptime.status,
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
  return { kind: "ok", site: updated, result: { uptime } };
}

async function runFull(site: Site, now: number): Promise<SiteCheckOutcome> {
  // Claim the cooldown slot atomically so parallel clicks/tabs can't both run.
  const claimed = await prisma.site.updateMany({
    where: {
      id: site.id,
      OR: [
        { lastCheckedAt: null },
        { lastCheckedAt: { lt: new Date(now - RECHECK_COOLDOWN_MS) } },
      ],
    },
    data: { lastCheckedAt: new Date(now) },
  });
  if (claimed.count === 0) {
    const fresh = (await prisma.site.findUnique({ where: { id: site.id } })) ?? site;
    const last = fresh.lastCheckedAt?.getTime() ?? now;
    return {
      kind: "cooldown",
      site: fresh,
      retryAfterMs: Math.max(1000, RECHECK_COOLDOWN_MS - (now - last)),
    };
  }

  try {
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
    return { kind: "ok", site: updated, result };
  } catch (err) {
    // Release the slot so a failed check doesn't block the next attempt.
    await prisma.site
      .update({ where: { id: site.id }, data: { lastCheckedAt: site.lastCheckedAt } })
      .catch(() => undefined);
    throw err;
  }
}
