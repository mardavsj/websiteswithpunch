import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteLimit, isPro } from "@/lib/plans";
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
  const plan = isPro(user.plan, user.stripeStatus) ? "pro" : "free";
  const limit = getSiteLimit(plan);
  if (count >= limit) {
    return NextResponse.json(
      {
        error:
          plan === "free"
            ? "Free plan allows 1 site. Upgrade to Pro for up to 10 sites."
            : "Pro plan allows up to 10 sites.",
      },
      { status: 403 }
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

  const site = await prisma.site.create({
    data: {
      userId: user.id,
      name: parsed.data.name.trim(),
      url,
      status: "pending",
    },
  });

  // Run initial check (best-effort)
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
