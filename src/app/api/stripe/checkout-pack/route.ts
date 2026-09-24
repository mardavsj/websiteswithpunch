import { NextResponse } from "next/server";
import type Stripe from "stripe";
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
import {
  derivePlanAndPacks,
  findPackItem,
  hostedInvoiceUrlFromSubscription,
  subscriptionNeedsPaymentAction,
} from "@/lib/stripe-subscription";
import { enforceSiteLimit } from "@/lib/site-limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Add one site pack, or undo a pending removal (raise qty back, $0, clear pending).
 */
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
      {
        error: "Site packs are available on Pro and Business plans only.",
        code: "NO_SUBSCRIPTION",
      },
      { status: 403 },
    );
  }

  if (
    !user.stripeSubscriptionId ||
    (user.stripeStatus !== "active" && user.stripeStatus !== "trialing")
  ) {
    return NextResponse.json(
      {
        error: "An active subscription is required to add a site pack.",
        code: "NO_SUBSCRIPTION",
      },
      { status: 403 },
    );
  }

  const packPlan = plan as PackPlanId;
  const config = getPackConfig(packPlan)!;
  const paidPacks = user.sitePackCount ?? 0;
  const hasPendingRemoval =
    user.pendingSitePackCount != null &&
    user.pendingPackChangeAt != null &&
    user.pendingSitePackCount < paidPacks;

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

  try {
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
      { expand: ["latest_invoice.payment_intent"] },
    );

    if (subscription.status !== "active" && subscription.status !== "trialing") {
      return NextResponse.json(
        {
          error: "An active subscription is required to add a site pack.",
          code: "NO_SUBSCRIPTION",
        },
        { status: 403 },
      );
    }

    const existingPack = findPackItem(subscription);
    const stripeQty = existingPack?.quantity ?? 0;

    // Undo a pending removal: raise Stripe qty by 1 toward paid count, no charge
    if (hasPendingRemoval && stripeQty < paidPacks) {
      const nextQty = stripeQty + 1;
      const items: Stripe.SubscriptionUpdateParams.Item[] = existingPack
        ? [{ id: existingPack.id, quantity: nextQty }]
        : [{ price: priceId, quantity: 1 }];

      const updated = await stripe.subscriptions.update(subscription.id, {
        items,
        proration_behavior: "none",
      });

      const fullyRestored = nextQty >= paidPacks;
      await prisma.user.update({
        where: { id: user.id },
        data: fullyRestored
          ? {
              pendingSitePackCount: null,
              pendingPackChangeAt: null,
              stripeStatus: updated.status,
            }
          : {
              pendingSitePackCount: nextQty,
              stripeStatus: updated.status,
            },
      });

      await enforceSiteLimit(user.id);

      return NextResponse.json({
        ok: true,
        undone: true,
        sitePackCount: paidPacks,
        sitesPerPack: config.sitesPerPack,
      });
    }

    if (!canBuySitePack(packPlan, paidPacks)) {
      const maxSites = getEffectiveSiteLimit(packPlan, config.maxPacks);
      const hint =
        packPlan === "pro"
          ? `You've reached the max Pro packs (${maxSites} sites). Upgrade to Business for more capacity.`
          : `You've reached the max Business packs (${maxSites} sites). Contact hello@websiteswithpunch.com for custom limits.`;
      return NextResponse.json(
        { error: hint, code: "PACK_LIMIT", maxPacks: config.maxPacks },
        { status: 403 },
      );
    }

    if (stripeQty >= config.maxPacks) {
      return NextResponse.json(
        {
          error: `You've reached the max packs (${config.maxPacks}).`,
          code: "PACK_LIMIT",
          maxPacks: config.maxPacks,
        },
        { status: 403 },
      );
    }

    const items: Stripe.SubscriptionUpdateParams.Item[] = existingPack
      ? [{ id: existingPack.id, quantity: stripeQty + 1 }]
      : [{ price: priceId, quantity: 1 }];

    let updated: Stripe.Subscription;
    try {
      updated = await stripe.subscriptions.update(subscription.id, {
        items,
        proration_behavior: "always_invoice",
        payment_behavior: "pending_if_incomplete",
        expand: ["latest_invoice.payment_intent"],
      });
    } catch (err) {
      const stripeErr = err as { message?: string };
      console.error("checkout-pack payment error", err);
      return NextResponse.json(
        {
          error:
            stripeErr.message ||
            "Payment failed. No site pack was added. Update your card in Manage billing and try again.",
          code: "PAYMENT_FAILED",
        },
        { status: 402 },
      );
    }

    if (subscriptionNeedsPaymentAction(updated)) {
      const hostedUrl = hostedInvoiceUrlFromSubscription(updated);
      if (hostedUrl) {
        return NextResponse.json({
          requiresAction: true,
          hostedInvoiceUrl: hostedUrl,
          code: "PAYMENT_REQUIRED",
        });
      }
      return NextResponse.json(
        {
          error:
            "Payment requires additional confirmation. Complete it from Manage billing, then refresh.",
          code: "PAYMENT_FAILED",
        },
        { status: 402 },
      );
    }

    const { sitePackCount } = derivePlanAndPacks(updated);
    if (sitePackCount <= paidPacks && sitePackCount <= stripeQty) {
      return NextResponse.json(
        {
          error:
            "Payment did not complete. No site pack was added. Try again or update your card.",
          code: "PAYMENT_FAILED",
        },
        { status: 402 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        sitePackCount,
        pendingSitePackCount: null,
        pendingPackChangeAt: null,
        stripeStatus: updated.status,
        stripeSubscriptionId: updated.id,
      },
    });

    await enforceSiteLimit(user.id);

    return NextResponse.json({
      ok: true,
      sitePackCount,
      sitesPerPack: config.sitesPerPack,
    });
  } catch (err) {
    console.error("checkout-pack error", err);
    return NextResponse.json(
      { error: "Could not add site pack.", code: "PAYMENT_FAILED" },
      { status: 500 },
    );
  }
}
