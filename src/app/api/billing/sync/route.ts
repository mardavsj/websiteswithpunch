import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plans";
import { syncSubscription } from "@/lib/dodo-sync";
import { subscriptionState } from "@/lib/dodo-subscription";
import { fail, loadUser } from "@/lib/billing-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Re-read the user's subscription from Dodo and mirror it. Called by the dashboard after
 * checkout (Dodo appends ?subscription_id=… to the return URL) and while a charge confirms,
 * so the plan switches on without waiting for the webhook. Only the owner's subscription is
 * accepted (same Dodo customer, or our userId in its metadata).
 */
export async function POST(req: Request) {
  const loaded = await loadUser({ label: "sync", rateKey: "billing-sync", rateLimit: 60 });
  if (loaded instanceof NextResponse) return loaded;
  const { user, dodo } = loaded;
  const body = await req.json().catch(() => ({}));
  const given = typeof body?.subscriptionId === "string" ? body.subscriptionId : "";
  if (given && !/^sub_[A-Za-z0-9]{6,64}$/.test(given)) return fail(400, "Invalid subscription.");
  const id = given || user.dodoSubscriptionId;
  if (!id) return NextResponse.json({ ok: true, plan: getEffectivePlan(user.plan, user.dodoStatus) });

  let interval: string | null = null;
  try {
    const sub = await dodo.subscriptions.retrieve(id);
    const owner =
      (user.dodoCustomerId && sub.customer?.customer_id === user.dodoCustomerId) ||
      sub.metadata?.userId === user.id;
    if (!owner) return fail(403, "This subscription belongs to another account.");
    await syncSubscription(sub, { userId: user.id });
    interval = subscriptionState(sub).interval;
  } catch (err) {
    console.error("billing sync error", err);
    return fail(502, "Could not check your subscription. Try again in a moment.");
  }
  const fresh = await prisma.user.findUnique({ where: { id: user.id } });
  return NextResponse.json({
    ok: true,
    plan: getEffectivePlan(fresh?.plan, fresh?.dodoStatus),
    status: fresh?.dodoStatus ?? null,
    sitePackCount: fresh?.sitePackCount ?? 0,
    interval,
  });
}
