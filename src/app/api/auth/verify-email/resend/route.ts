import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp, tooMany } from "@/lib/rate-limit";
import { isVerified, issueCode } from "@/lib/email-verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST — email a new code to the signed-in, unverified account (60s cooldown, hourly caps). */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, emailVerified: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isVerified(user)) return NextResponse.json({ ok: true, already: true });

  try {
    const result = await issueCode(user, clientIp(req));
    if (!result.ok) {
      return tooMany(
        result.retryAfterSec,
        result.reason === "cooldown"
          ? `Please wait ${result.retryAfterSec}s before sending another code.`
          : "Too many codes requested. Please try again later.",
      );
    }
    return NextResponse.json({ ok: true, cooldown: result.cooldown });
  } catch (err) {
    console.error("[verify] resend failed", err);
    return NextResponse.json({ error: "Could not send a code right now. Please try again." }, { status: 500 });
  }
}
