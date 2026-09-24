import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Undo cancel_at_period_end and clear pending Free. */
export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Billing unavailable" }, { status: 503 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeSubscriptionId) {
    return NextResponse.json({ error: "No subscription on file." }, { status: 400 });
  }

  try {
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        cancelAtPeriodEnd: false,
        pendingPlan: null,
        pendingPlanAt: null,
      },
    });
    await prisma.site.updateMany({
      where: { userId: user.id },
      data: { keepOnDowngrade: false },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("resume error", err);
    return NextResponse.json({ error: "Could not resume plan." }, { status: 500 });
  }
}
