import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MINUTE, clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { checkCode, isVerified } from "@/lib/email-verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MESSAGES = {
  locked: "Too many incorrect attempts. Send a new code to try again.",
  expired: "This code has expired. Send a new code.",
  none: "No active code. Send a new code.",
} as const;

/** POST { code } — confirm the signed-in account's email. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await rateLimit([
    { key: `verify-check:ip:${clientIp(req)}`, limit: 30, windowMs: 15 * MINUTE },
    { key: `verify-check:user:${session.user.id}`, limit: 20, windowMs: 15 * MINUTE },
  ]);
  if (!limited.ok) return tooMany(limited.retryAfterSec);

  const body = (await req.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.slice(0, 20) : "";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isVerified(user)) return NextResponse.json({ ok: true, already: true });

  try {
    const result = await checkCode(session.user.id, code);
    if (result.state === "ok") return NextResponse.json({ ok: true });
    if (result.state === "invalid") {
      const n = result.attemptsLeft;
      return NextResponse.json(
        { error: `That code isn't right. ${n} attempt${n === 1 ? "" : "s"} left.`, code: "INVALID_CODE", attemptsLeft: n },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: MESSAGES[result.state], code: `CODE_${result.state.toUpperCase()}`, attemptsLeft: 0 },
      { status: 400 },
    );
  } catch (err) {
    console.error("[verify] check failed", err);
    return NextResponse.json({ error: "Could not verify right now. Please try again." }, { status: 500 });
  }
}
