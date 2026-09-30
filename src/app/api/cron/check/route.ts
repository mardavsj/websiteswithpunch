import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runFullSiteCheck } from "@/lib/checks";
import { techStackFields } from "@/lib/tech-detect";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Tech stack is re-detected by the scheduled check at most once a day per site. */
const TECH_EVERY_MS = 24 * 60 * 60 * 1000;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || req.headers.get("x-cron-secret");
  if (!header) return false;
  if (header === secret) return true;
  if (header === `Bearer ${secret}`) return true;
  return false;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Locked sites are not monitored (history retained).
  const sites = await prisma.site.findMany({
    where: { locked: false },
    orderBy: { lastCheckedAt: "asc" },
  });
  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const site of sites) {
    try {
      const tech = !site.techStackAt || Date.now() - site.techStackAt.getTime() >= TECH_EVERY_MS;
      const result = await runFullSiteCheck(site.url, { tech });
      await prisma.site.update({
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
          ...techStackFields(result.tech),
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
      results.push({ id: site.id, status: result.uptime.status });
    } catch (err) {
      results.push({
        id: site.id,
        status: "error",
        error: err instanceof Error ? err.message : "check failed",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    checked: results.length,
    results,
    at: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  return GET(req);
}
