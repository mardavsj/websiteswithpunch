import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { HOUR, MINUTE, clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { createResetToken } from "@/lib/password-reset";
import { resetLink, sendResetEmail } from "@/lib/auth-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().trim().email().max(200) });
const NEUTRAL = "If an account exists, we've sent a reset link.";

/**
 * Request a reset link. The reply is the same whether or not the account exists, so the form
 * can't be used to find out who has an account.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const ipLimited = await rateLimit([{ key: `forgot:ip:${clientIp(req)}`, limit: 5, windowMs: 15 * MINUTE }]);
  if (!ipLimited.ok) {
    return tooMany(ipLimited.retryAfterSec, "Too many reset requests. Please wait a few minutes and try again.");
  }

  const email = parsed.data.email.toLowerCase();
  // Per-address cap: over it we still answer neutrally (no enumeration), we just don't send.
  if (!(await rateLimit([{ key: `forgot:email:${email}`, limit: 3, windowMs: HOUR }])).ok) {
    return NextResponse.json({ ok: true, message: NEUTRAL });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });
    if (user) {
      const token = await createResetToken(user.id);
      const result = await sendResetEmail(user.email, resetLink(token), user.name);
      if (!result.sent && process.env.RESEND_API_KEY) {
        console.error(`[password-reset] email not sent: ${result.reason}`);
      }
    }
  } catch (err) {
    console.error("[password-reset] request failed", err);
  }
  return NextResponse.json({ ok: true, message: NEUTRAL });
}
