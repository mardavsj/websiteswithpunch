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
  latencySeries,
  parseRange,
  percentile,
  rangeToMs,
  type CheckPoint,
  type RangeKey,
} from "@/lib/analytics";

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

  const since = new Date(now - rangeToMs(range));

  const rows = await prisma.checkResult.findMany({
    where: { siteId: site.id, checkedAt: { gte: since } },
    orderBy: { checkedAt: "asc" },
    take: 5000,
  });

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
      series: latencySeries(checks),
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
    statusCodes,
    lastDowntimeAt: lastDowntimeAt?.toISOString() ?? null,
    empty: total === 0,
    since: since.toISOString(),
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}
