import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readUnsubscribeToken, scopeOff } from "@/lib/alerts/unsubscribe";
import { MINUTE, clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * One-click unsubscribe (RFC 8058): mail apps POST here from the List-Unsubscribe header, and the
 * /unsubscribe page's button does too. The signed token can only switch alerts off.
 */
export async function POST(req: Request) {
  const limited = await rateLimit([{ key: `unsub:ip:${clientIp(req)}`, limit: 30, windowMs: 10 * MINUTE }]);
  if (!limited.ok) return tooMany(limited.retryAfterSec);
  const parsed = readUnsubscribeToken(new URL(req.url).searchParams.get("t"));
  if (!parsed) return NextResponse.json({ error: "This unsubscribe link isn't valid." }, { status: 400, headers: NO_STORE });
  const done = await prisma.user.updateMany({ where: { id: parsed.userId }, data: scopeOff(parsed.scope) });
  if (done.count === 0) return NextResponse.json({ error: "Account not found." }, { status: 404, headers: NO_STORE });
  return NextResponse.json({ ok: true, scope: parsed.scope }, { headers: NO_STORE });
}

/** A plain GET (link preview, old clients) never changes anything: it opens the confirm page. */
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") || "";
  return NextResponse.redirect(new URL(`/unsubscribe?t=${encodeURIComponent(t)}`, req.url), 303);
}
