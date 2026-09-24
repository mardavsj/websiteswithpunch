import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { PlanId } from "@/lib/plans";
import { upsertUserFromPaidSignupSession } from "@/lib/complete-paid-signup";
import {
  derivePlanAndPacks,
  isLegacyPackOnlySubscription,
} from "@/lib/stripe-subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function syncFromSubscription(
  userId: string,
  subscription: Stripe.Subscription,
) {
  const { plan, sitePackCount } = derivePlanAndPacks(subscription);
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      sitePackCount,
      stripeSubscriptionId: subscription.id,
      stripeStatus: subscription.status,
      stripeCustomerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
    },
  });
}

async function setFree(userId: string, status?: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: "free",
      sitePackCount: 0,
      stripeStatus: status || "canceled",
      stripeSubscriptionId: null,
    },
  });
}

async function resolveUserId(
  subscription: Stripe.Subscription,
): Promise<string | undefined> {
  if (subscription.metadata?.userId) return subscription.metadata.userId;

  const byCustomer = await prisma.user.findFirst({
    where: { stripeCustomerId: String(subscription.customer) },
  });
  if (byCustomer) return byCustomer.id;

  if (subscription.metadata?.email) {
    const byEmail = await prisma.user.findUnique({
      where: {
        email: subscription.metadata.email.toLowerCase().trim(),
      },
    });
    return byEmail?.id;
  }

  return undefined;
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Billing webhook not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = headers().get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature error", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Pay-before-account signup flow
        if (session.metadata?.signup === "1") {
          const result = await upsertUserFromPaidSignupSession(session);
          if (!result.ok) {
            console.error("Webhook signup upsert failed", result.reason);
          }
          break;
        }

        // Legacy pack-only Checkout — ignore counters; packs now live on the main sub
        if (session.metadata?.type === "site_pack") {
          break;
        }

        // Existing logged-in upgrade / first Checkout purchase
        const userId = session.metadata?.userId;
        if (userId && session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subId);
          if (
            session.metadata?.planId === "business" ||
            session.metadata?.planId === "pro"
          ) {
            // Ensure metadata carries planId for future syncs
            if (subscription.metadata?.planId !== session.metadata.planId) {
              await stripe.subscriptions.update(subId, {
                metadata: {
                  ...subscription.metadata,
                  userId,
                  planId: session.metadata.planId,
                },
              });
              subscription.metadata = {
                ...subscription.metadata,
                userId,
                planId: session.metadata.planId,
              };
            }
          }
          await syncFromSubscription(userId, subscription);
          // Prefer explicit Checkout planId when present
          if (
            session.metadata?.planId === "business" ||
            session.metadata?.planId === "pro"
          ) {
            await prisma.user.update({
              where: { id: userId },
              data: { plan: session.metadata.planId as PlanId },
            });
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        // Legacy separate pack subscriptions must never overwrite plan / packs
        if (isLegacyPackOnlySubscription(subscription)) {
          break;
        }

        const userId = await resolveUserId(subscription);
        if (!userId) break;

        if (subscription.status === "active" || subscription.status === "trialing") {
          await syncFromSubscription(userId, subscription);
        } else if (
          subscription.status === "canceled" ||
          subscription.status === "unpaid" ||
          subscription.status === "incomplete_expired"
        ) {
          // Only wipe if this is the user's current main subscription
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (
            !user?.stripeSubscriptionId ||
            user.stripeSubscriptionId === subscription.id
          ) {
            await setFree(userId, subscription.status);
          }
        } else {
          // past_due, incomplete, etc. — keep plan but sync status + packs from items
          const { sitePackCount, plan } = derivePlanAndPacks(subscription);
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan,
              sitePackCount,
              stripeStatus: subscription.status,
              stripeSubscriptionId: subscription.id,
            },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Legacy pack-only cancel: ignore (do not wipe plan or decrement)
        if (isLegacyPackOnlySubscription(subscription)) {
          break;
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: subscription.id },
              { stripeCustomerId: String(subscription.customer) },
            ],
          },
        });
        if (!user) break;

        // Only clear if this deleted sub is (or was) the user's main subscription
        if (
          !user.stripeSubscriptionId ||
          user.stripeSubscriptionId === subscription.id
        ) {
          await setFree(user.id, "canceled");
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
