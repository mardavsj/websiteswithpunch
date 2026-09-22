import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripePriceIdForPlan } from "@/lib/plans";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  planId: z.enum(["pro", "business"]),
});

export async function POST(req: Request) {
  try {
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

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input. Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const { name, planId } = parsed.data;
    const email = parsed.data.email.toLowerCase().trim();

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

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/api/stripe/complete-signup?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/signup?plan=${planId}&canceled=1`,
      metadata: {
        signup: "1",
        email,
        name: name.trim(),
        passwordHash,
        planId,
      },
      subscription_data: {
        metadata: {
          planId,
          email,
        },
      },
    });

    if (!checkout.url) {
      return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
    }

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("checkout-signup error", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
