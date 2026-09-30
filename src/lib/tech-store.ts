import { prisma } from "@/lib/prisma";
import { parseTechStack, TECH_RECHECK_MS, type TechItem, type TechStackState } from "@/lib/tech-types";

/**
 * Reads/writes Site.techStack + techStackAt with raw SQL, so the feature (and
 * nothing else) depends on those columns. A Prisma client generated before
 * the schema change (e.g. `prisma db push` couldn't regenerate it on Windows
 * while `npm run dev` held the engine file) can't break uptime checks this
 * way, and a missing column gives a clear message instead of a silent blank.
 */

export class TechStoreError extends Error {}

const MISSING_COLUMNS =
  "The database is missing the tech stack columns. Stop the dev server, run `npx prisma db push`, then start it again.";

function wrap(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (/no such column|does not exist|techStack/i.test(msg)) {
    console.error("[tech-stack] DB columns missing:", msg.trim().split("\n").filter(Boolean).pop());
    throw new TechStoreError(MISSING_COLUMNS);
  }
  throw err;
}

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(typeof v === "string" && /^\d+$/.test(v) ? Number(v) : (v as string | number));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function readTechStack(siteId: string): Promise<{ items: TechItem[] | null; detectedAt: Date | null }> {
  try {
    const rows = await prisma.$queryRaw<Array<{ techStack: string | null; techStackAt: unknown }>>`
      SELECT s."techStack" AS "techStack", s."techStackAt" AS "techStackAt" FROM "Site" s WHERE s."id" = ${siteId}`;
    const row = rows[0];
    return { items: parseTechStack(row?.techStack), detectedAt: toDate(row?.techStackAt) };
  } catch (err) {
    wrap(err);
  }
}

export async function saveTechStack(siteId: string, items: TechItem[], at: Date): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "Site" SET "techStack" = ${JSON.stringify(items)}, "techStackAt" = ${at} WHERE "id" = ${siteId}`;
  } catch (err) {
    wrap(err);
  }
}

export function nextAllowedAt(detectedAt: Date | null): Date | null {
  if (!detectedAt) return null;
  const next = detectedAt.getTime() + TECH_RECHECK_MS;
  return next > Date.now() ? new Date(next) : null;
}

export function techState(items: TechItem[] | null, detectedAt: Date | null): TechStackState {
  return {
    items,
    detectedAt: detectedAt?.toISOString() ?? null,
    nextAllowedAt: nextAllowedAt(detectedAt)?.toISOString() ?? null,
    now: new Date().toISOString(),
  };
}
