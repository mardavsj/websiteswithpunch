import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Postgres-backed fixed-window rate limiter. Works across serverless instances because the
 * counters live in the RateLimit table. Every rule in one call is checked with ONE query (a
 * multi-row upsert): an expired window resets to 1, otherwise the count goes up by one.
 * If the database is unreachable we fail open (log and allow) rather than lock everyone out.
 */
export type Rule = { key: string; limit: number; windowMs: number };
export type LimitResult = { ok: true } | { ok: false; retryAfterSec: number; key: string };

export async function rateLimit(rules: Rule[]): Promise<LimitResult> {
  const seen = new Set<string>();
  const list = rules.filter((r) => r.key && r.limit > 0 && !seen.has(r.key) && !!seen.add(r.key));
  if (!list.length) return { ok: true };
  try {
    const values = Prisma.join(
      list.map(
        (r) =>
          Prisma.sql`(${r.key.slice(0, 200)}, 1, now() + (${Math.round(r.windowMs)}::int * interval '1 millisecond'))`,
      ),
    );
    const rows = await prisma.$queryRaw<Array<{ key: string; count: number; expiresAt: Date }>>`
      INSERT INTO "RateLimit" ("key", "count", "expiresAt") VALUES ${values}
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."expiresAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "expiresAt" = CASE WHEN "RateLimit"."expiresAt" <= now() THEN EXCLUDED."expiresAt" ELSE "RateLimit"."expiresAt" END
      RETURNING "key", "count", "expiresAt"`;
    for (const r of list) {
      const row = rows.find((x) => x.key === r.key.slice(0, 200));
      if (row && Number(row.count) > r.limit) {
        const retryAfterSec = Math.max(1, Math.ceil((row.expiresAt.getTime() - Date.now()) / 1000));
        return { ok: false, retryAfterSec, key: r.key };
      }
    }
    return { ok: true };
  } catch (err) {
    console.error("[rate-limit] check failed; allowing request", err);
    return { ok: true };
  }
}

/** Standard 429 JSON reply with a Retry-After header. */
export function tooMany(retryAfterSec: number, error = "Too many attempts. Please wait a few minutes and try again.") {
  return NextResponse.json(
    { error, code: "RATE_LIMITED", retryAfter: retryAfterSec },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}

/** Delete counters whose window ended over a day ago (called from the daily cron). */
export async function pruneRateLimits(): Promise<number> {
  const res = await prisma.rateLimit.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  return res.count;
}

/**
 * Client IP. On Vercel, x-real-ip and the first x-forwarded-for hop are set by the edge and
 * can't be spoofed by the caller; elsewhere this is best effort.
 */
export function clientIp(req: Request | { headers: Headers | Record<string, unknown> }): string {
  const h = req.headers;
  const get = (name: string): string | null => {
    if (typeof (h as Headers).get === "function") return (h as Headers).get(name);
    const v = (h as Record<string, unknown>)[name];
    return typeof v === "string" ? v : Array.isArray(v) ? String(v[0]) : null;
  };
  const real = get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  const fwd = get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 64) || "unknown";
  return "unknown";
}

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
