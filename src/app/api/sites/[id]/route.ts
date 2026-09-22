import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeUrl } from "@/lib/utils";
import { runFullSiteCheck } from "@/lib/checks";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  url: z.string().min(3).max(500).optional(),
});

async function ownedSite(userId: string, id: string) {
  return prisma.site.findFirst({ where: { id, userId } });
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const site = await ownedSite(session.user.id, params.id);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const history = await prisma.checkResult.findMany({
    where: { siteId: site.id },
    orderBy: { checkedAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ site, history });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const site = await ownedSite(session.user.id, params.id);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data: { name?: string; url?: string } = {};
  if (parsed.data.name) data.name = parsed.data.name.trim();
  if (parsed.data.url) {
    try {
      data.url = normalizeUrl(parsed.data.url);
      new URL(data.url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    if (data.url !== site.url) {
      const duplicate = await prisma.site.findFirst({
        where: {
          userId: session.user.id,
          url: data.url,
          NOT: { id: site.id },
        },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Site already added", code: "DUPLICATE_URL" },
          { status: 409 },
        );
      }
    }
  }

  try {
    const updated = await prisma.site.update({ where: { id: site.id }, data });
    return NextResponse.json({ site: updated });
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
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const site = await ownedSite(session.user.id, params.id);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.site.delete({ where: { id: site.id } });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const site = await ownedSite(session.user.id, params.id);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  if (body?.action !== "check") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
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
  return NextResponse.json({ site: updated, result });
}
