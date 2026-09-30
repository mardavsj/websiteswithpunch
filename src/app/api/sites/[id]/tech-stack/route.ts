import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchPage } from "@/lib/page-capture";
import { detectTech } from "@/lib/tech-detect";
import { TECH_RECHECK_MS } from "@/lib/tech-types";
import {
  nextAllowedAt,
  readTechStack,
  saveTechStack,
  techState,
  TechStoreError,
} from "@/lib/tech-store";

/**
 * Tech stack, decoupled from uptime checks.
 * GET  → stored result + when "Recheck stack" is allowed again.
 * POST → detect now; once per 24h per site (429 + retryAfterMs otherwise).
 *        The first detection (nothing stored yet) is always allowed.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: { id: string } };

const running = new Set<string>();

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

async function loadSite(id: string) {
  const session = await getSession();
  if (!session?.user?.id) return { res: json({ error: "Unauthorized" }, 401) };
  const site = await prisma.site.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, url: true, locked: true },
  });
  if (!site) return { res: json({ error: "Not found" }, 404) };
  if (site.locked) {
    return { res: json({ error: "This site is locked on your current plan.", code: "SITE_LOCKED" }, 403) };
  }
  return { site };
}

function failure(err: unknown) {
  const message = err instanceof Error ? err.message : "Detection failed";
  if (err instanceof TechStoreError) return json({ error: message, code: "DB_COLUMNS" }, 500);
  return json({ error: message }, 502);
}

export async function GET(_req: Request, { params }: Ctx) {
  const { site, res } = await loadSite(params.id);
  if (!site) return res;
  try {
    const { items, detectedAt } = await readTechStack(site.id);
    return json(techState(items, detectedAt));
  } catch (err) {
    return failure(err);
  }
}

export async function POST(_req: Request, { params }: Ctx) {
  const { site, res } = await loadSite(params.id);
  if (!site) return res;
  if (running.has(site.id)) {
    return json({ error: "Detection is already running for this site." }, 409);
  }
  running.add(site.id);
  try {
    const stored = await readTechStack(site.id);
    const next = nextAllowedAt(stored.detectedAt);
    if (next) {
      const retryAfterMs = next.getTime() - Date.now();
      return json(
        {
          error: `The tech stack can be rechecked once every ${TECH_RECHECK_MS / 3_600_000} hours.`,
          retryAfterMs,
          ...techState(stored.items, stored.detectedAt),
        },
        429,
        { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) }
      );
    }

    const started = Date.now();
    const page = await fetchPage(site.url);
    const items = await detectTech(page);
    if (!items.length && page.status >= 400) {
      throw new Error(`${new URL(page.url).host} answered HTTP ${page.status}, so there was nothing to analyse`);
    }
    const at = new Date();
    await saveTechStack(site.id, items, at);
    console.info(
      `[tech-stack] ${page.url} → ${items.length} technologies (HTTP ${page.status}, ${Date.now() - started}ms)`
    );
    return json(techState(items, at));
  } catch (err) {
    console.error(`[tech-stack] Detection failed for ${site.url}:`, err instanceof Error ? err.message : err);
    return failure(err);
  } finally {
    running.delete(site.id);
  }
}
