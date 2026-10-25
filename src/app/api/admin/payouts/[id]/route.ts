import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { MINUTE, clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { crossSiteBlocked } from "@/lib/same-origin";
import { PayoutError, audit, decidePayout, isAdminEmail } from "@/lib/referrals/server";
import { rupeesToPaise } from "@/lib/referrals/breakdown";
import { notifyPaid, notifyRejected } from "@/lib/referrals/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("paid"), reference: z.string().trim().min(3).max(120), inr: z.string().trim().max(16).optional(), expectedCents: z.number().int().min(0).max(100_000_000).optional() }),
  z.object({ action: z.literal("reject"), reason: z.string().trim().min(5).max(300) }),
]);

/** Admins only (ADMIN_EMAILS allowlist + verified session). Non-admins get a 404, not a hint. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const blocked = crossSiteBlocked(req);
  if (blocked) return blocked;
  const session = await getSession();
  const email = session?.user?.email;
  if (!session?.user?.id || session.user.verified === false || !isAdminEmail(email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const limited = await rateLimit([{ key: `admin:payout:${session.user.id}`, limit: 60, windowMs: 10 * MINUTE }]);
  if (!limited.ok) return tooMany(limited.retryAfterSec);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Add a payment reference (3+ characters) or a reason (5+ characters)." }, { status: 400 });
  }
  const d = parsed.data;
  let inrPaise: number | null = null;
  if (d.action === "paid" && d.inr) {
    inrPaise = rupeesToPaise(d.inr);
    if (inrPaise === null) return NextResponse.json({ error: "INR amount must be a number like 2000 or 1999.50." }, { status: 400 });
  }
  try {
    const p = await decidePayout(params.id, email!, d.action === "paid" ? { action: "paid", reference: d.reference, inrPaise, expectedCents: d.expectedCents } : d);
    await audit(`admin.payout.${parsed.data.action}`, { actorId: session.user.id, targetId: p.id, ip: clientIp(req), meta: { ...d, inrPaise, amountCents: p.amountCents } });
    if (parsed.data.action === "paid") await notifyPaid(p.userId, p.amountCents, p.method, parsed.data.reference);
    else await notifyRejected(p.userId, p.amountCents, parsed.data.reason);
    return NextResponse.json({ payout: { id: p.id, status: p.status } });
  } catch (e) {
    if (e instanceof PayoutError) return NextResponse.json({ error: e.message }, { status: 409 });
    console.error("[admin payout] failed", e);
    return NextResponse.json({ error: "Couldn't update the payout." }, { status: 500 });
  }
}
