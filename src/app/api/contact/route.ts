import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateContact } from "@/lib/contact";
import { sendContactEmail } from "@/lib/contact-email";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

/**
 * Contact form: validate, save to ContactMessage (backup, so nothing is lost), then email the
 * team via Resend. A failed or skipped email still returns success; the row has emailSent=false.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real visitors never see this field. Pretend success, store nothing.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const parsed = validateContact(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "Check the highlighted fields.", errors: parsed.errors },
      { status: 400 },
    );
  }

  const limited = rateLimit(`contact:${clientIp(req)}`, LIMIT, WINDOW_MS);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "You've sent several messages in a short time. Please try again in an hour." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  try {
    const session = await getSession();
    const userId = session?.user?.id ?? null;
    const row = await prisma.contactMessage.create({
      data: { ...parsed.data, userId, emailSent: false },
    });

    const result = await sendContactEmail({ ...parsed.data, userId, id: row.id });
    if (result.sent) {
      await prisma.contactMessage.update({ where: { id: row.id }, data: { emailSent: true } });
    } else {
      console.warn(`[contact] email not sent for message ${row.id}: ${result.reason}`);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("contact save error", err);
    return NextResponse.json(
      { error: "Something went wrong sending your message. Please try again." },
      { status: 500 },
    );
  }
}
