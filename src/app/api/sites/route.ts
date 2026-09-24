import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canBuySitePack,
  getEffectivePlan,
  getUserEffectiveSiteLimit,
  PLANS,
  SITE_PACKS,
  resolvePackCountForLimit,
} from "@/lib/plans";
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
  const resolved = resolvePackCountForLimit({
    sitePackCount: user.sitePackCount,
    pendingSitePackCount: user.pendingSitePackCount,
    pendingPackChangeAt: user.pendingPackChangeAt,
  });
  if (resolved.shouldApplyPending) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        sitePackCount: resolved.packCount,
        pendingSitePackCount: null,
        pendingPackChangeAt: null,
      },
    });
  }
  const limit = getUserEffectiveSiteLimit(
    plan,
    resolved.shouldApplyPending ? resolved.packCount : user.sitePackCount,
    resolved.shouldApplyPending ? null : user.pendingSitePackCount,
    resolved.shouldApplyPending ? null : user.pendingPackChangeAt,
  );
  if (count >= limit) {
    let upgradeHint: string;
    if (plan === "free") {
      upgradeHint = `Free allows ${PLANS.free.siteLimit} site. Upgrade to Pro (${PLANS.pro.siteLimit}) or Business (${PLANS.business.siteLimit}).`;
    } else if (plan === "pro") {
      if (canBuySitePack("pro", resolved.packCount)) {
        upgradeHint = `Pro site limit reached (${limit}). Buy a +${SITE_PACKS.pro.sitesPerPack} site pack ($${SITE_PACKS.pro.pricePerMonth}/mo) or upgrade to Business.`;
      } else {
        upgradeHint = `Pro max capacity reached (${limit} sites). Upgrade to Business for more sites.`;
      }
    } else {
      if (canBuySitePack("business", resolved.packCount)) {
        upgradeHint = `Business site limit reached (${limit}). Buy a +${SITE_PACKS.business.sitesPerPack} site pack ($${SITE_PACKS.business.pricePerMonth}/mo) or contact hello@websiteswithpunch.com.`;
      } else {
        upgradeHint = `Business max capacity reached (${limit} sites). Contact hello@websiteswithpunch.com for a custom limit.`;
      }
    }
    return NextResponse.json(
      { error: upgradeHint, code: "SITE_LIMIT", limit },
      { status: 403 },
    );
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
