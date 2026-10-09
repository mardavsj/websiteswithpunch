import type { Site } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkSsl, checkUptime, runFullSiteCheck } from "@/lib/checks";
import { infoFields } from "@/lib/site-info";

/** Recheck (manual or auto refresh): once per minute per site. */
export const RECHECK_COOLDOWN_MS = 60_000;

const DAY_MS = 24 * 60 * 60 * 1000;

export type SiteCheckOutcome =
  | { kind: "ok"; site: Site; result: unknown }
  /** Refused: the last recheck was under a minute ago. */
  | { kind: "cooldown"; site: Site; retryAfterMs: number };

/**
 * Site.lastCheckedAt = time of the last recheck (add site, manual Recheck,
 * auto refresh tick, cron). Every recheck claims the same once-per-minute
 * slot, so the Recheck countdown and the auto refresh countdown always agree
 * and survive page refreshes.
 *
 * auto = auto refresh tick: uptime + SSL like a manual Recheck, but the
 * domain expiry is not looked up again (third-party RDAP/WHOIS every minute
 * would be wasteful and rate-limited); its days-left is recomputed from the
 * stored expiry date instead. Manual Recheck and cron still look it up.
 */
export async function runSiteCheck(
  site: Site,
  opts: { auto?: boolean } = {}
): Promise<SiteCheckOutcome> {
  const now = Date.now();
  // Claim the slot atomically so parallel clicks/tabs can't both run.
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
    const expiry = opts.auto ? await autoCheck(site) : await fullCheck(site);
    const updated = await prisma.site.update({
      where: { id: site.id },
      data: {
        status: expiry.uptime.status,
        lastCheckedAt: new Date(),
        lastStatusCode: expiry.uptime.statusCode,
        lastLatencyMs: expiry.uptime.latencyMs,
        ...expiry.fields,
      },
    });
    await prisma.checkResult.create({
      data: {
        siteId: site.id,
        status: expiry.uptime.status,
        statusCode: expiry.uptime.statusCode,
        latencyMs: expiry.uptime.latencyMs,
        error: expiry.uptime.error,
      },
    });
    return { kind: "ok", site: updated, result: expiry.result };
  } catch (err) {
    // Release the slot so a failed check doesn't block the next attempt.
    await prisma.site
      .update({ where: { id: site.id }, data: { lastCheckedAt: site.lastCheckedAt } })
      .catch(() => undefined);
    throw err;
  }
}

async function fullCheck(site: Site) {
  const result = await runFullSiteCheck(site.url);
  return {
    uptime: result.uptime,
    result,
    fields: {
      sslExpiresAt: result.ssl.expiresAt,
      sslDaysLeft: result.ssl.daysLeft,
      domainExpiresAt: result.domain.expiresAt,
      domainDaysLeft: result.domain.daysLeft,
      ...infoFields(site, result),
    },
  };
}

async function autoCheck(site: Site) {
  const uptime = await checkUptime(site.url);
  const ssl = await checkSsl(site.url, uptime.finalUrl);
  const domainDaysLeft = site.domainExpiresAt
    ? Math.ceil((site.domainExpiresAt.getTime() - Date.now()) / DAY_MS)
    : site.domainDaysLeft;
  return {
    uptime,
    result: { uptime, ssl },
    fields: {
      // Keep the stored certificate if this handshake failed transiently.
      ...(ssl.expiresAt ? { sslExpiresAt: ssl.expiresAt, sslDaysLeft: ssl.daysLeft } : {}),
      domainDaysLeft,
      ...infoFields(site, { ssl }),
    },
  };
}
