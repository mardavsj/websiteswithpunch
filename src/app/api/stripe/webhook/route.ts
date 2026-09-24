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

function periodStartUnix(subscription: Stripe.Subscription): number | null {
  const starts = (subscription.items?.data ?? [])
    .map((i) => i.current_period_start)
    .filter((n): n is number => typeof n === "number" && n > 0);
  if (starts.length) return Math.max(...starts);
  const legacy = (subscription as unknown as { current_period_start?: number })
    .current_period_start;
  return typeof legacy === "number" ? legacy : null;
}

async function syncFromSubscription(
  userId: string,
  subscription: Stripe.Subscription,
) {
  const { plan, sitePackCount: derivedPacks } = derivePlanAndPacks(subscription);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const now = new Date();
  const periodStart = periodStartUnix(subscription);
  let sitePackCount = derivedPacks;
  let pendingSitePackCount = user.pendingSitePackCount;
  let pendingPackChangeAt = user.pendingPackChangeAt;

  if (pendingSitePackCount != null && pendingPackChangeAt) {
    const due =
      now >= pendingPackChangeAt ||
      (periodStart != null && periodStart * 1000 >= pendingPackChangeAt.getTime());

    if (due) {
      // New period started — apply pending (prefer Stripe-derived, which should match)
      sitePackCount = derivedPacks;
      pendingSitePackCount = null;
      pendingPackChangeAt = null;
    } else {
      // Still in paid-through month — do not drop the paid pack count
      sitePackCount = Math.max(user.sitePackCount ?? 0, pendingSitePackCount);
      // Keep pending target aligned with Stripe qty
      pendingSitePackCount = derivedPacks;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      sitePackCount,
      pendingSitePackCount,
      pendingPackChangeAt,
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
      pendingSitePackCount: null,
      pendingPackChangeAt: null,
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

async function applyPendingIfDue(userId: string, subscription?: Stripe.Subscription) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.pendingSitePackCount == null || !user.pendingPackChangeAt) return;

  const now = new Date();
  const periodStart = subscription ? periodStartUnix(subscription) : null;
  const due =
    now >= user.pendingPackChangeAt ||
    (periodStart != null &&
      periodStart * 1000 >= user.pendingPackChangeAt.getTime());

  if (!due) return;

  const packs = subscription
    ? derivePlanAndPacks(subscription).sitePackCount
    : user.pendingSitePackCount;

  await prisma.user.update({
    where: { id: userId },
    data: {
      sitePackCount: packs,
      pendingSitePackCount: null,
      pendingPackChangeAt: null,
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

        if (session.metadata?.signup === "1") {
          const result = await upsertUserFromPaidSignupSession(session);
          if (!result.ok) {
            console.error("Webhook signup upsert failed", result.reason);
          }
          break;
        }

        if (session.metadata?.type === "site_pack") {
          break;
        }

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
          if (
            session.metadata?.planId === "business" ||
            session.metadata?.planId === "pro"
          ) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                plan: session.metadata.planId as PlanId,
                pendingSitePackCount: null,
                pendingPackChangeAt: null,
              },
            });
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

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
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (
            !user?.stripeSubscriptionId ||
            user.stripeSubscriptionId === subscription.id
          ) {
            await setFree(userId, subscription.status);
          }
        } else {
          await syncFromSubscription(userId, subscription);
          await prisma.user.update({
            where: { id: userId },
            data: { stripeStatus: subscription.status },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

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

        if (
          !user.stripeSubscriptionId ||
          user.stripeSubscriptionId === subscription.id
        ) {
          await setFree(user.id, "canceled");
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const inv = invoice as unknown as {
          subscription?: string | { id: string } | null;
          parent?: { subscription_details?: { subscription?: string } };
        };
        const subRef =
          typeof inv.subscription === "string"
            ? inv.subscription
            : inv.subscription && typeof inv.subscription === "object"
              ? inv.subscription.id
              : typeof inv.parent?.subscription_details?.subscription === "string"
                ? inv.parent.subscription_details.subscription
                : null;
        if (!subRef) break;
        const subscription = await stripe.subscriptions.retrieve(subRef);
        if (isLegacyPackOnlySubscription(subscription)) break;
        const userId = await resolveUserId(subscription);
        if (userId) await applyPendingIfDue(userId, subscription);
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
