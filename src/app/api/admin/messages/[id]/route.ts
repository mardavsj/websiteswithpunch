import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { adminOrNull } from "@/lib/admin/guard";
import { MINUTE, clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { crossSiteBlocked } from "@/lib/same-origin";
import { audit } from "@/lib/referrals/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ handled: z.boolean() });

/** Mark a contact message handled / open again. Admins only; everyone else gets a 404. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const blocked = crossSiteBlocked(req);
  if (blocked) return blocked;
  const admin = await adminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const limited = await rateLimit([{ key: `admin:msg:${admin.id}`, limit: 120, windowMs: 10 * MINUTE }]);
  if (!limited.ok) return tooMany(limited.retryAfterSec);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const res = await prisma.contactMessage.updateMany({
    where: { id: params.id.slice(0, 40) },
    data: parsed.data.handled ? { handledAt: new Date(), handledBy: admin.email } : { handledAt: null, handledBy: null },
  });
  if (!res.count) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  await audit(parsed.data.handled ? "admin.message.handled" : "admin.message.reopened", { actorId: admin.id, targetId: params.id, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}
