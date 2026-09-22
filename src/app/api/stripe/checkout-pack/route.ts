import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canBuySitePack,
  getEffectivePlan,
  getEffectiveSiteLimit,
  getPackConfig,
  stripePriceIdForPack,
  type PackPlanId,
} from "@/lib/plans";
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
          "Billing is not configured. Set STRIPE_SECRET_KEY and pack price env vars.",
      },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Billing unavailable" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = getEffectivePlan(user.plan, user.stripeStatus);
  if (plan !== "pro" && plan !== "business") {
    return NextResponse.json(
      { error: "Site packs are available on Pro and Business plans only." },
      { status: 403 },
    );
  }

  const packPlan = plan as PackPlanId;
  const config = getPackConfig(packPlan)!;
  if (!canBuySitePack(packPlan, user.sitePackCount)) {
    const maxSites = getEffectiveSiteLimit(packPlan, config.maxPacks);
    const hint =
      packPlan === "pro"
        ? `You've reached the max Pro packs (${maxSites} sites). Upgrade to Business for more capacity.`
        : `You've reached the max Business packs (${maxSites} sites). Contact hello@websiteswithpunch.com for custom limits.`;
    return NextResponse.json(
      {
        error: hint,
        code: "PACK_LIMIT",
        maxPacks: config.maxPacks,
      },
      { status: 403 },
    );
  }

  const priceId = stripePriceIdForPack(packPlan);
  if (!priceId) {
    return NextResponse.json(
      {
        error:
          packPlan === "business"
            ? "Business pack price is not configured. Set STRIPE_PRICE_ID_PACK_BUSINESS."
            : "Pro pack price is not configured. Set STRIPE_PRICE_ID_PACK_PRO.",
      },
      { status: 503 },
    );
  }

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
  const metadata = {
    userId: user.id,
    type: "site_pack",
    packPlan,
  };

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?pack=1`,
    cancel_url: `${baseUrl}/dashboard?canceled=1`,
    metadata,
    subscription_data: { metadata },
  });

  return NextResponse.json({ url: checkout.url });
}
