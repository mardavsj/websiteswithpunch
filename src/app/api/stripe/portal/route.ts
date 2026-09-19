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
      { error: "Stripe is not configured. See README for setup." },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe unavailable" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer on file. Upgrade first." },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${baseUrl}/dashboard`,
  });

  return NextResponse.json({ url: portal.url });
}
