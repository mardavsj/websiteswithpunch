import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runFullSiteCheck } from "@/lib/checks";
import { applyDuePendingAndEnforce, toClientSite } from "@/lib/site-limits";
import {
  SiteUrlError,
  findSiteByHostKey,
  normalizeSiteUrl,
} from "@/lib/url";

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
  await applyDuePendingAndEnforce(session.user.id);
  const site = await ownedSite(session.user.id, params.id);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (site.locked) {
    return NextResponse.json(
      {
        error: "This site is locked on your current plan.",
        code: "SITE_LOCKED",
        site: toClientSite(site as unknown as Record<string, unknown>),
      },
      { status: 403 },
    );
  }
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
  if (site.locked) {
    return NextResponse.json(
      { error: "Locked sites can't be edited. Unlock or upgrade first.", code: "SITE_LOCKED" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data: { name?: string; url?: string } = {};
  let pathWasStripped = false;
  let hostKey: string | undefined;
  if (parsed.data.name) data.name = parsed.data.name.trim();
  if (parsed.data.url) {
    let normalized;
    try {
      normalized = normalizeSiteUrl(parsed.data.url);
    } catch (err) {
      const msg = err instanceof SiteUrlError ? err.message : "Invalid URL";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    data.url = normalized.url;
    pathWasStripped = normalized.pathWasStripped;
    hostKey = normalized.hostKey;

    if (data.url !== site.url) {
      const userSites = await prisma.site.findMany({
        where: { userId: session.user.id },
        select: { id: true, url: true, locked: true },
      });
      const duplicate = findSiteByHostKey(userSites, normalized.hostKey, site.id);
      if (duplicate) {
        return NextResponse.json(
          {
            error: duplicate.locked
              ? "This site is already in your list but locked."
              : `You're already monitoring ${normalized.hostKey}.`,
            code: duplicate.locked ? "LOCKED_DUPLICATE" : "DUPLICATE_SITE",
            siteId: duplicate.id,
            hostKey: normalized.hostKey,
          },
          { status: 409 },
        );
      }
    }
  }

  try {
    const updated = await prisma.site.update({ where: { id: site.id }, data });
    return NextResponse.json({
      site: updated,
      pathWasStripped,
      hostKey,
      hint: pathWasStripped && hostKey ? `We monitor the whole site: ${hostKey}` : undefined,
    });
  } catch (err: unknown) {
    const code =
      typeof err === "object" && err && "code" in err ? (err as { code?: string }).code : undefined;
    if (code === "P2002") {
      return NextResponse.json(
        {
          error: hostKey ? `You're already monitoring ${hostKey}.` : "Site already added",
          code: "DUPLICATE_SITE",
          hostKey,
        },
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
  return NextResponse.json({ ok: true, freedSlot: !site.locked });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const site = await ownedSite(session.user.id, params.id);
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (site.locked) {
    return NextResponse.json(
      { error: "Locked sites are not checked.", code: "SITE_LOCKED" },
      { status: 403 },
    );
  }

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
