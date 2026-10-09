import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readDomainInfo, readSslInfo } from "@/lib/site-info";
import { CHECK_SCHEDULE } from "@/lib/check-schedule";

export const dynamic = "force-dynamic";

const WINDOWS = { "24h": 1, "7d": 7, "30d": 30 } as const;
const DAY_MS = 86_400_000;

/**
 * Facts for the analytics Details panels that the analytics payload doesn't carry: stored
 * certificate/domain details, uptime over fixed windows, and first/last check times. Loaded once
 * in the background after the analytics, so panels usually open with no wait.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const site = await prisma.site.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true, locked: true, sslInfo: true, domainInfo: true, lastCheckedAt: true, createdAt: true },
  });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (site.locked) {
    return NextResponse.json(
      { error: "This site is locked on your current plan.", code: "SITE_LOCKED" },
      { status: 403 },
    );
  }

  const now = Date.now();
  const where = { siteId: site.id };
  const [windows, first, lastIssue, lastUp] = await Promise.all([
    Promise.all(
      Object.entries(WINDOWS).map(async ([key, days]) => {
        const groups = await prisma.checkResult.groupBy({
          by: ["status"],
          where: { ...where, checkedAt: { gte: new Date(now - days * DAY_MS) } },
          _count: { _all: true },
        });
        const checks = groups.reduce((s, g) => s + g._count._all, 0);
        const up = groups.find((g) => g.status === "up")?._count._all ?? 0;
        return { key, days, checks, percent: checks ? Math.round((up / checks) * 1000) / 10 : null };
      }),
    ),
    prisma.checkResult.findFirst({ where, orderBy: { checkedAt: "asc" }, select: { checkedAt: true } }),
    prisma.checkResult.findFirst({
      where: { ...where, status: { in: ["down", "error"] } },
      orderBy: [{ checkedAt: "desc" }, { id: "desc" }],
      select: { checkedAt: true, status: true, statusCode: true, error: true },
    }),
    prisma.checkResult.findFirst({
      where: { ...where, status: "up" },
      orderBy: [{ checkedAt: "desc" }, { id: "desc" }],
      select: { checkedAt: true },
    }),
  ]);

  return NextResponse.json(
    {
      ssl: readSslInfo(site.sslInfo),
      domain: readDomainInfo(site.domainInfo),
      uptimeWindows: windows,
      firstCheckAt: first?.checkedAt.toISOString() ?? null,
      lastFullCheckAt: site.lastCheckedAt?.toISOString() ?? null,
      lastUpAt: lastUp?.checkedAt.toISOString() ?? null,
      lastIssue: lastIssue
        ? {
            at: lastIssue.checkedAt.toISOString(),
            status: lastIssue.status,
            code: lastIssue.statusCode,
            error: lastIssue.error,
          }
        : null,
      schedule: CHECK_SCHEDULE,
      siteAddedAt: site.createdAt.toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
