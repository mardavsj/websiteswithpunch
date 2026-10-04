import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/password-rules";
import { HOUR, clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { looksLikeBot } from "@/lib/spam";
import { checkSignupEmail } from "@/lib/email-domain";
import { issueCode } from "@/lib/email-verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().max(254).email(),
  password: z.string().min(PASSWORD_MIN).max(PASSWORD_MAX),
});

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    // Bots (honeypot filled or form sent faster than a person can type): generic failure.
    if (looksLikeBot(body, "website")) {
      return NextResponse.json({ error: "Signup failed. Please try again." }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Invalid input. Password must be ${PASSWORD_MIN} to ${PASSWORD_MAX} characters.` },
        { status: 400 },
      );
    }

    const limited = await rateLimit([
      { key: `signup:ip:${clientIp(req)}`, limit: 5, windowMs: HOUR },
      { key: `signup:ipday:${clientIp(req)}`, limit: 20, windowMs: 24 * HOUR },
    ]);
    if (!limited.ok) return tooMany(limited.retryAfterSec, "Too many signups from this network. Please try again later.");

    const email = parsed.data.email.toLowerCase();
    const domainError = await checkSignupEmail(email);
    if (domainError) return NextResponse.json({ error: domainError, code: "EMAIL_DOMAIN" }, { status: 400 });
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    const password = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: { name: parsed.data.name, email, password, plan: "free" },
      select: { id: true, email: true, name: true },
    });
    // The account stays limited to /verify-email until this code is entered.
    await issueCode(user, clientIp(req)).catch((e) => console.warn("[verify] signup code failed", e));
    return NextResponse.json({ user, verify: true }, { status: 201 });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    console.error("signup error", err);
    return NextResponse.json({ error: "Signup failed. Please try again." }, { status: 500 });
  }
}
