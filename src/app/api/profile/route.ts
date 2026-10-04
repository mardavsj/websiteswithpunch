import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/password-rules";
import { sendPasswordChangedEmail } from "@/lib/auth-email";
import { MINUTE, rateLimit, tooMany } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  currentPassword: z.string().min(1).max(200).optional(),
  newPassword: z.string().min(PASSWORD_MIN).max(PASSWORD_MAX).optional(),
});

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { name, currentPassword, newPassword } = parsed.data;
  if (!name && !newPassword) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data: { name?: string; password?: string } = {};
  if (name != null) data.name = name;

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required." }, { status: 400 });
    }
    const limited = await rateLimit([{ key: `password-change:user:${user.id}`, limit: 10, windowMs: 15 * MINUTE }]);
    if (!limited.ok) return tooMany(limited.retryAfterSec);
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    data.password = await bcrypt.hash(newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { name: true, email: true },
  });

  if (data.password) {
    const sent = await sendPasswordChangedEmail(updated.email, updated.name).catch(() => null);
    if (sent && !sent.sent) console.warn("[profile] password-changed notice not sent:", sent.reason);
  }
  return NextResponse.json({ ok: true, name: updated.name, email: updated.email });
}
