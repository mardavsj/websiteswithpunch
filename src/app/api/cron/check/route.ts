import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runFullSiteCheck } from "@/lib/checks";
import { pruneRateLimits } from "@/lib/rate-limit";
import { pruneUnverified } from "@/lib/email-verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/**
 * 60s works on every Vercel Hobby project. With Fluid compute on (Settings → Functions) Hobby
 * allows up to 300: raise this AND RUN_BUDGET_MS together to check more sites per run.
 */
export const maxDuration = 60;

/** Stop starting new checks after this, leaving time to finish in-flight ones and reply. */
const RUN_BUDGET_MS = 40_000;
/** Sites checked at the same time (each check is mostly network wait). */
const CONCURRENCY = 12;
/** Hard cap per site (uptime 15s + SSL/domain lookups in parallel, 20s max). */
const SITE_TIMEOUT_MS = 18_000;
/** Check history older than this is deleted (longest analytics range is 90 days). */
const RETENTION_DAYS = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Only Vercel Cron's `Authorization: Bearer <CRON_SECRET>`, compared in constant time. */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.headers.get("authorization") || "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      t = setTimeout(() => reject(new Error("Site check timed out")), ms);
    }),
  ]).finally(() => clearTimeout(t));
}

type CronSite = { id: string; url: string; sslExpiresAt: Date | null; domainExpiresAt: Date | null };
const daysLeft = (d: Date) => Math.ceil((d.getTime() - Date.now()) / DAY_MS);

async function checkOne(site: CronSite) {
  const result = await withTimeout(runFullSiteCheck(site.url), SITE_TIMEOUT_MS);
  await prisma.$transaction([
    prisma.site.update({
      where: { id: site.id },
      data: {
        status: result.uptime.status,
        lastCheckedAt: new Date(),
        lastStatusCode: result.uptime.statusCode,
        lastLatencyMs: result.uptime.latencyMs,
        // A lookup that failed transiently keeps the stored date (days left recomputed).
        ...(result.ssl.expiresAt
          ? { sslExpiresAt: result.ssl.expiresAt, sslDaysLeft: result.ssl.daysLeft }
          : site.sslExpiresAt
            ? { sslDaysLeft: daysLeft(site.sslExpiresAt) }
            : { sslExpiresAt: null, sslDaysLeft: null }),
        ...(result.domain.expiresAt
          ? { domainExpiresAt: result.domain.expiresAt, domainDaysLeft: result.domain.daysLeft }
          : site.domainExpiresAt
            ? { domainDaysLeft: daysLeft(site.domainExpiresAt) }
            : {}),
      },
    }),
    prisma.checkResult.create({
      data: {
        siteId: site.id,
        status: result.uptime.status,
        statusCode: result.uptime.statusCode,
        latencyMs: result.uptime.latencyMs,
        error: result.uptime.error,
      },
    }),
  ]);
  return result.uptime.status;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const started = Date.now();

  // Least recently checked first, so sites skipped when the budget runs out go first next run.
  const sites = await prisma.site.findMany({
    where: { locked: false },
    orderBy: { lastCheckedAt: { sort: "asc", nulls: "first" } },
    select: { id: true, url: true, sslExpiresAt: true, domainExpiresAt: true },
  });

  const counts = { up: 0, down: 0, error: 0, failed: 0 };
  let next = 0;
  async function worker() {
    while (next < sites.length && Date.now() - started < RUN_BUDGET_MS) {
      const site = sites[next++];
      try {
        const status = await checkOne(site);
        counts[status as "up" | "down" | "error"] += 1;
      } catch (err) {
        counts.failed += 1;
        console.error(`[cron] check failed for site ${site.id}`, err);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, sites.length) }, worker));

  // Housekeeping: old check history, expired rate-limit rows, old webhook ids, and accounts that
  // never verified their email within 48h (only if they have no sites and no Stripe customer).
  const cleanup = { checks: 0, rateLimits: 0, stripeEvents: 0, unverifiedUsers: 0, codes: 0 };
  try {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * DAY_MS);
    cleanup.checks = (await prisma.checkResult.deleteMany({ where: { checkedAt: { lt: cutoff } } })).count;
    cleanup.rateLimits = await pruneRateLimits();
    cleanup.stripeEvents = (
      await prisma.stripeEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 30 * DAY_MS) } } })
    ).count;
    const pruned = await pruneUnverified();
    cleanup.unverifiedUsers = pruned.users;
    cleanup.codes = pruned.codes;
  } catch (err) {
    console.error("[cron] cleanup failed", err);
  }

  return NextResponse.json({
    ok: true,
    total: sites.length,
    checked: next,
    skipped: sites.length - next,
    ...counts,
    cleanup,
    ms: Date.now() - started,
  });
}

export async function POST(req: Request) {
  return GET(req);
}
