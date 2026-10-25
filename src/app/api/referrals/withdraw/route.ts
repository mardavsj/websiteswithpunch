import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { HOUR, clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { crossSiteBlocked } from "@/lib/same-origin";
import { PayoutError, audit, requestPayout } from "@/lib/referrals/server";
import { notifyAdminsRequested } from "@/lib/referrals/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Request a manual payout of the whole available balance (>= $20, one open request at a time). */
export async function POST(req: Request) {
  const blocked = crossSiteBlocked(req);
  if (blocked) return blocked;
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const limited = await rateLimit([{ key: `withdraw:${userId}`, limit: 5, windowMs: HOUR }]);
  if (!limited.ok) return tooMany(limited.retryAfterSec);

  try {
    const payout = await requestPayout(userId);
    await audit("payout.request", { actorId: userId, targetId: payout.id, ip: clientIp(req), meta: { amountCents: payout.amountCents, method: payout.method } });
    await notifyAdminsRequested(payout.id);
    return NextResponse.json({ payout: { id: payout.id, amountCents: payout.amountCents, status: payout.status } }, { status: 201 });
  } catch (e) {
    if (e instanceof PayoutError) return NextResponse.json({ error: e.message }, { status: 409 });
    if ((e as { code?: string })?.code === "P2034") {
      return NextResponse.json({ error: "Your balance was updating. Please try again." }, { status: 409 });
    }
    console.error("[withdraw] failed", e);
    return NextResponse.json({ error: "Couldn't request the payout. Please try again." }, { status: 500 });
  }
}
