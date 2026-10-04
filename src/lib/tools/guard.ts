import { NextResponse } from "next/server";
import { clientIp, HOUR, MINUTE, rateLimit, tooMany } from "@/lib/rate-limit";
import { parseToolTarget, SiteUrlError, type ToolTarget } from "./target";

/** Public tools: 10 checks per minute and 100 per day per IP, shared across the three tools. */
const PER_MINUTE = 10;
const PER_DAY = 100;

type Entry = { at: number; body: unknown };
const cache = new Map<string, Entry>();
const MAX_ENTRIES = 500;

function cached(key: string, ttlMs: number): unknown | undefined {
  const e = cache.get(key);
  if (!e) return undefined;
  if (Date.now() - e.at > ttlMs) {
    cache.delete(key);
    return undefined;
  }
  return e.body;
}

function remember(key: string, body: unknown) {
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  cache.set(key, { at: Date.now(), body });
}

/**
 * Shared handler for /api/tools/*: validate the target, rate-limit per IP, then serve a brief
 * in-memory cache (and let the CDN cache the reply for the same TTL) before running the check.
 */
export async function runTool(
  req: Request,
  tool: string,
  ttlSec: number,
  check: (t: ToolTarget) => Promise<Record<string, unknown>>,
) {
  const q = new URL(req.url).searchParams.get("q");
  let target: ToolTarget;
  try {
    target = parseToolTarget(q);
  } catch (err) {
    const message = err instanceof SiteUrlError ? err.message : "Enter a valid domain.";
    return NextResponse.json({ error: message, code: "INVALID_DOMAIN" }, { status: 400 });
  }
  const ip = clientIp(req);
  const limited = await rateLimit([
    { key: `tools:min:${ip}`, limit: PER_MINUTE, windowMs: MINUTE },
    { key: `tools:day:${ip}`, limit: PER_DAY, windowMs: 24 * HOUR },
  ]);
  if (!limited.ok) {
    return tooMany(limited.retryAfterSec, "You've run a lot of checks. Please wait a moment and try again.");
  }
  const key = `${tool}:${target.host}`;
  const headers = {
    "Cache-Control": `public, max-age=0, s-maxage=${ttlSec}`,
    "X-Robots-Tag": "noindex",
  };
  const hit = cached(key, ttlSec * 1000);
  if (hit) return NextResponse.json(hit, { headers });
  const body = { host: target.host, domain: target.domain, checkedAt: new Date().toISOString(), ...(await check(target)) };
  remember(key, body);
  return NextResponse.json(body, { headers });
}
