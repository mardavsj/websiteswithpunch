import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { planIdFromStripePriceId, type PlanId } from "@/lib/plans";
import { upsertUserFromPaidSignupSession } from "@/lib/complete-paid-signup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolvePlanId(subscription: Stripe.Subscription): PlanId {
  const fromMeta = subscription.metadata?.planId;
  if (fromMeta === "business" || fromMeta === "pro") return fromMeta;
  const priceId = subscription.items.data[0]?.price?.id;
  return planIdFromStripePriceId(priceId);
}

async function setPaid(userId: string, subscription: Stripe.Subscription) {
  const plan = resolvePlanId(subscription);
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
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
      stripeStatus: status || "canceled",
      stripeSubscriptionId: null,
    },
  });
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

        // Existing logged-in upgrade flow
        const userId = session.metadata?.userId;
        if (userId && session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subId);
          if (session.metadata?.planId === "business" || session.metadata?.planId === "pro") {
            subscription.metadata = {
              ...subscription.metadata,
              planId: session.metadata.planId,
            };
          }
          await setPaid(userId, subscription);
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        let userId =
          subscription.metadata?.userId ||
          (
            await prisma.user.findFirst({
              where: { stripeCustomerId: String(subscription.customer) },
            })
          )?.id;

        // Signup flow may only have email on subscription metadata
        if (!userId && subscription.metadata?.email) {
          userId = (
            await prisma.user.findUnique({
              where: { email: subscription.metadata.email.toLowerCase().trim() },
            })
          )?.id;
        }

        if (userId) {
          if (subscription.status === "active" || subscription.status === "trialing") {
            await setPaid(userId, subscription);
          } else if (
            subscription.status === "canceled" ||
            subscription.status === "unpaid" ||
            subscription.status === "incomplete_expired"
          ) {
            await setFree(userId, subscription.status);
          } else {
            await prisma.user.update({
              where: { id: userId },
              data: {
                stripeStatus: subscription.status,
                stripeSubscriptionId: subscription.id,
              },
            });
          }
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: subscription.id },
              { stripeCustomerId: String(subscription.customer) },
            ],
          },
        });
        if (user) await setFree(user.id, "canceled");
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
