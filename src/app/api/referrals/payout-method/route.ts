import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HOUR, clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { crossSiteBlocked } from "@/lib/same-origin";
import { maskAddress, validatePayout } from "@/lib/referrals/attribution";
import { audit } from "@/lib/referrals/server";
import { notifyMethodChanged } from "@/lib/referrals/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Save PayPal email or UPI ID. 5 changes per day; each change is audited and emailed to the owner. */
export async function PUT(req: Request) {
  const blocked = crossSiteBlocked(req);
  if (blocked) return blocked;
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { method?: unknown; address?: unknown } | null;
  const v = validatePayout(body?.method, body?.address);
  if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 });

  const limited = await rateLimit([{ key: `payoutmethod:${userId}`, limit: 5, windowMs: 24 * HOUR }]);
  if (!limited.ok) return tooMany(limited.retryAfterSec, "Too many payout method changes today. Try again tomorrow.");

  const before = await prisma.user.findUnique({ where: { id: userId }, select: { payoutMethod: true, payoutAddress: true } });
  if (before?.payoutMethod === v.method && before.payoutAddress === v.address) {
    return NextResponse.json({ method: v.method, address: v.address });
  }
  await prisma.user.update({ where: { id: userId }, data: { payoutMethod: v.method, payoutAddress: v.address, payoutUpdatedAt: new Date() } });
  await audit("payout.method", {
    actorId: userId, targetId: userId, ip: clientIp(req),
    meta: { method: v.method, to: maskAddress(v.address), from: before?.payoutAddress ? maskAddress(before.payoutAddress) : null },
  });
  if (before?.payoutAddress) await notifyMethodChanged(userId, v.method, maskAddress(v.address));
  return NextResponse.json({ method: v.method, address: v.address });
}
