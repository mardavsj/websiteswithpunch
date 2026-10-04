import { NextResponse } from "next/server";
import { z } from "zod";
import { MINUTE, clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { resetPasswordWithToken } from "@/lib/password-reset";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/password-rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(1).max(200),
  password: z.string().min(PASSWORD_MIN).max(PASSWORD_MAX),
});

const STATE_ERRORS = {
  expired: "This reset link has expired. Request a new one.",
  used: "This reset link has already been used. Request a new one if you still need it.",
  invalid: "This reset link isn't valid. Request a new one.",
} as const;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Password must be ${PASSWORD_MIN} to ${PASSWORD_MAX} characters.` },
      { status: 400 },
    );
  }

  const limited = await rateLimit([{ key: `reset:ip:${clientIp(req)}`, limit: 10, windowMs: 15 * MINUTE }]);
  if (!limited.ok) return tooMany(limited.retryAfterSec);

  try {
    const result = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
    if (result === "ok") return NextResponse.json({ ok: true });
    return NextResponse.json({ error: STATE_ERRORS[result], state: result }, { status: 400 });
  } catch (err) {
    console.error("[password-reset] reset failed", err);
    return NextResponse.json({ error: "Could not reset your password. Please try again." }, { status: 500 });
  }
}
