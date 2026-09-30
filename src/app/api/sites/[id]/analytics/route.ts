import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ageDaysFromMs,
  buildIncidents,
  buildTimeline,
  clampRangeToUnlocked,
  getUnlockedRanges,
  healthScore,
  parseRange,
  percentile,
  rangeToMs,
  type CheckPoint,
  type RangeKey,
} from "@/lib/analytics";
import { alignDown, latencyBucketMs, latencySeries } from "@/lib/analytics-series";
import { parseTechStack } from "@/lib/tech-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const site = await prisma.site.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!site) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (site.locked) {
    return NextResponse.json(
      { error: "This site is locked on your current plan.", code: "SITE_LOCKED" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(req.url);
  const requestedRange = parseRange(searchParams.get("range"));

  // Site age from createdAt; fall back to earliest CheckResult when needed
  let siteCreatedAt: Date = site.createdAt;
  if (!siteCreatedAt || Number.isNaN(siteCreatedAt.getTime())) {
    const earliest = await prisma.checkResult.findFirst({
      where: { siteId: site.id },
      orderBy: { checkedAt: "asc" },
      select: { checkedAt: true },
    });
    siteCreatedAt = earliest?.checkedAt ?? new Date();
  }

  const now = Date.now();
  const ageMs = Math.max(0, now - siteCreatedAt.getTime());
  const ageDays = ageDaysFromMs(ageMs);
  const unlockedRanges = getUnlockedRanges(ageMs);
  const { range, rangeClamped } = clampRangeToUnlocked(requestedRange, unlockedRanges);

  // Window start is aligned to the fixed latency bucket, so refreshing within
  // the same bucket always reads the exact same rows (no sliding edge).
  const windowMs = rangeToMs(range);
  const bucketMs = latencyBucketMs(range);
  let since = new Date(alignDown(now - windowMs, bucketMs));

  // Newest rows first so the 5000 cap keeps recent data; id breaks ties.
  const loadRows = async (from: Date, to?: Date) =>
    (
      await prisma.checkResult.findMany({
        where: { siteId: site.id, checkedAt: to ? { gte: from, lte: to } : { gte: from } },
        orderBy: [{ checkedAt: "desc" }, { id: "desc" }],
        take: 5000,
      })
    ).reverse();

  let rows = await loadRows(since);

  // Nothing in the live window: fall back to the latest saved window of the
  // same length, anchored at the most recent check we have.
  let stale = false;
  let latestAt: Date | null = rows.length ? rows[rows.length - 1].checkedAt : null;
  if (!rows.length) {
    const latest = await prisma.checkResult.findFirst({
      where: { siteId: site.id },
      orderBy: [{ checkedAt: "desc" }, { id: "desc" }],
      select: { checkedAt: true },
    });
    if (latest) {
      stale = true;
      latestAt = latest.checkedAt;
      since = new Date(alignDown(latest.checkedAt.getTime() - windowMs, bucketMs));
      rows = await loadRows(since, latest.checkedAt);
    }
  }

  const checks: CheckPoint[] = rows.map((r) => ({
    status: r.status,
    statusCode: r.statusCode,
    latencyMs: r.latencyMs,
    error: r.error,
    checkedAt: r.checkedAt,
  }));

  const total = checks.length;
  const up = checks.filter((c) => c.status === "up").length;
  const down = checks.filter((c) => c.status === "down").length;
  const error = checks.filter((c) => c.status === "error").length;
  const uptimePercent = total ? Math.round((up / total) * 1000) / 10 : null;

  const latencies = checks
    .map((c) => c.latencyMs)
    .filter((n): n is number => n != null)
    .sort((a, b) => a - b);
  const avgLatency =
    latencies.length > 0
      ? Math.round(latencies.reduce((s, n) => s + n, 0) / latencies.length)
      : null;

  const statusCodes: Record<string, number> = {};
  for (const c of checks) {
    if (c.statusCode == null) continue;
    const k = String(c.statusCode);
    statusCodes[k] = (statusCodes[k] || 0) + 1;
  }

  const incidents = buildIncidents(checks);
  const lastDowntimeAt =
    [...checks].reverse().find((c) => c.status === "down" || c.status === "error")?.checkedAt ??
    null;

  const { score, label } = healthScore({
    uptimePercent,
    avgLatencyMs: avgLatency,
    sslDaysLeft: site.sslDaysLeft,
    domainDaysLeft: site.domainDaysLeft,
  });

  const body = {
    range,
    requestedRange,
    rangeClamped,
    siteCreatedAt: siteCreatedAt.toISOString(),
    ageMs,
    ageDays,
    unlockedRanges: unlockedRanges as RangeKey[],
    siteId: site.id,
    siteName: site.name,
    siteUrl: site.url,
    healthScore: score,
    healthLabel: label,
    uptimePercent,
    totals: { checks: total, up, down, error },
    latency: {
      avg: avgLatency,
      p95: percentile(latencies, 95) != null ? Math.round(percentile(latencies, 95)!) : null,
      min: latencies.length ? latencies[0] : null,
      max: latencies.length ? latencies[latencies.length - 1] : null,
      series: latencySeries(checks, range),
    },
    timeline: buildTimeline(checks, range),
    incidents: incidents.slice(0, 20),
    ssl: {
      daysLeft: site.sslDaysLeft,
      expiresAt: site.sslExpiresAt?.toISOString() ?? null,
    },
    domain: {
      daysLeft: site.domainDaysLeft,
      expiresAt: site.domainExpiresAt?.toISOString() ?? null,
    },
    // Detected on add site / Recheck / daily cron; null = not detected yet.
    tech: {
      items: parseTechStack(site.techStack),
      detectedAt: site.techStackAt?.toISOString() ?? null,
    },
    statusCodes,
    lastDowntimeAt: lastDowntimeAt?.toISOString() ?? null,
    empty: total === 0,
    stale,
    since: since.toISOString(),
    dataEndsAt: latestAt?.toISOString() ?? null,
    site: {
      status: site.status,
      /** Last full check (add / Recheck / cron) — drives the Recheck cooldown. */
      lastCheckedAt: site.lastCheckedAt?.toISOString() ?? null,
      /** Freshest check of any kind (incl. auto update). */
      lastSeenAt: latestAt?.toISOString() ?? site.lastCheckedAt?.toISOString() ?? null,
      lastStatusCode: site.lastStatusCode,
      lastLatencyMs: site.lastLatencyMs,
    },
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}
