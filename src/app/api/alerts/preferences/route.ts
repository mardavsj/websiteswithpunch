import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MINUTE, rateLimit, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREFS = { alertDown: true, alertSsl: true, alertDomain: true } as const;
const schema = z
  .object({ alertDown: z.boolean(), alertSsl: z.boolean(), alertDomain: z.boolean() })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0);

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prefs = await prisma.user.findUnique({ where: { id: session.user.id }, select: PREFS });
  return NextResponse.json(prefs ?? {}, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await rateLimit([{ key: `alertprefs:${session.user.id}`, limit: 30, windowMs: 5 * MINUTE }]);
  if (!limited.ok) return tooMany(limited.retryAfterSec, "Too many changes. Please wait a moment.");
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings." }, { status: 400 });
  const prefs = await prisma.user.update({ where: { id: session.user.id }, data: parsed.data, select: PREFS });
  return NextResponse.json(prefs);
}
