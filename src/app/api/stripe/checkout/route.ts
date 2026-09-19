import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Set STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, and STRIPE_PRICE_ID.",
      },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe unavailable" }, { status: 503 });
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
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?upgraded=1`,
    cancel_url: `${baseUrl}/dashboard?canceled=1`,
    metadata: { userId: user.id },
    subscription_data: { metadata: { userId: user.id } },
  });

  return NextResponse.json({ url: checkout.url });
}
