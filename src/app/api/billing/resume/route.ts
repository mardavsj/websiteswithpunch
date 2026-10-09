import { NextResponse } from "next/server";
import { scheduledKind } from "@/lib/dodo-subscription";
import { resync } from "@/lib/dodo-change";
import { fail, withSubscription } from "@/lib/billing-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Undo a booked cancellation, or a booked Business → Pro switch ("Keep Business"). */
export async function POST() {
  return withSubscription({ label: "resume" }, async ({ dodo, user, sub, st }) => {
    if (st.cancelAtPeriodEnd) {
      await dodo.subscriptions.update(sub.subscription_id, { cancel_at_next_billing_date: false });
    } else if (scheduledKind(st) === "downgrade") {
      await dodo.subscriptions.cancelChangePlan(sub.subscription_id);
    } else {
      return fail(400, "Your plan isn't set to change.");
    }
    await resync(dodo, sub.subscription_id, user.id);
    return NextResponse.json({ ok: true });
  });
}
