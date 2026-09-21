import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripePriceIdForPlan, type PlanId } from "@/lib/plans";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Billing is not configured. Set STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, and STRIPE_PRICE_ID_PRO (or STRIPE_PRICE_ID).",
      },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Billing unavailable" }, { status: 503 });
  }

  let planId: "pro" | "business" = "pro";
  try {
    const body = await req.json();
    if (body?.planId === "business" || body?.planId === "pro") {
      planId = body.planId;
    }
  } catch {
    // empty body → default Pro
  }

  const priceId = stripePriceIdForPlan(planId);
  if (!priceId) {
    return NextResponse.json(
      {
        error:
          planId === "business"
            ? "Business price is not configured. Set STRIPE_PRICE_ID_BUSINESS."
            : "Pro price is not configured. Set STRIPE_PRICE_ID_PRO or STRIPE_PRICE_ID.",
      },
      { status: 503 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?upgraded=1`,
    cancel_url: `${baseUrl}/dashboard?canceled=1`,
    metadata: { userId: user.id, planId },
    subscription_data: { metadata: { userId: user.id, planId } },
  });

  return NextResponse.json({ url: checkout.url });
}
