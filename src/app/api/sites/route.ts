import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan, getSiteLimit, PLANS } from "@/lib/plans";
import { normalizeUrl } from "@/lib/utils";
import { runFullSiteCheck } from "@/lib/checks";

const schema = z.object({
  name: z.string().min(1).max(120),
  url: z.string().min(3).max(500),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sites = await prisma.site.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ sites });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const count = await prisma.site.count({ where: { userId: user.id } });
  const plan = getEffectivePlan(user.plan, user.stripeStatus);
  const limit = getSiteLimit(plan);
  if (count >= limit) {
    const upgradeHint =
      plan === "free"
        ? `Free allows ${PLANS.free.siteLimit} site. Upgrade to Pro (${PLANS.pro.siteLimit}) or Business (${PLANS.business.siteLimit}).`
        : plan === "pro"
          ? `Pro allows up to ${PLANS.pro.siteLimit} sites. Upgrade to Business for ${PLANS.business.siteLimit}.`
          : `Business allows up to ${PLANS.business.siteLimit} sites. Contact us for a higher limit.`;
    return NextResponse.json({ error: upgradeHint }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name or URL" }, { status: 400 });
  }

  let url: string;
  try {
    url = normalizeUrl(parsed.data.url);
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const duplicate = await prisma.site.findFirst({
    where: { userId: user.id, url },
    select: { id: true },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: "Site already added", code: "DUPLICATE_URL" },
      { status: 409 },
    );
  }

  let site;
  try {
    site = await prisma.site.create({
      data: {
        userId: user.id,
        name: parsed.data.name.trim(),
        url,
        status: "pending",
      },
    });
  } catch (err: unknown) {
    const code =
      typeof err === "object" && err && "code" in err ? (err as { code?: string }).code : undefined;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Site already added", code: "DUPLICATE_URL" },
        { status: 409 },
      );
    }
    throw err;
  }

  try {
    const result = await runFullSiteCheck(url);
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
  } catch (err) {
    console.error("Initial check failed", err);
  }

  const refreshed = await prisma.site.findUnique({ where: { id: site.id } });
  return NextResponse.json({ site: refreshed }, { status: 201 });
}
