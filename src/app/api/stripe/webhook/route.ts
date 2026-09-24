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
  subscriptionPeriodEnd,
} from "@/lib/stripe-subscription";
import {
  applyDuePendingAndEnforce,
  clearPendingChanges,
  enforceSiteLimit,
} from "@/lib/site-limits";

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
  const { plan: derivedPlan, sitePackCount: derivedPacks } =
    derivePlanAndPacks(subscription);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const now = new Date();
  const periodStart = periodStartUnix(subscription);
  const periodEnd = subscriptionPeriodEnd(subscription);
  const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);

  let plan: PlanId | string = derivedPlan;
  let sitePackCount = derivedPacks;
  let pendingSitePackCount = user.pendingSitePackCount;
  let pendingPackChangeAt = user.pendingPackChangeAt;
  let pendingPlan = user.pendingPlan;
  let pendingPlanAt = user.pendingPlanAt;

  // Portal cancel: mirror cancel_at_period_end → pending Free
  if (cancelAtPeriodEnd && subscription.status !== "canceled") {
    pendingPlan = "free";
    pendingPlanAt = periodEnd ? new Date(periodEnd * 1000) : pendingPlanAt;
  } else if (
    !cancelAtPeriodEnd &&
    user.cancelAtPeriodEnd &&
    pendingPlan === "free"
  ) {
    // Resumed from portal
    pendingPlan = null;
    pendingPlanAt = null;
  }

  // Pending pack removal
  if (pendingSitePackCount != null && pendingPackChangeAt) {
    const due =
      now >= pendingPackChangeAt ||
      (periodStart != null && periodStart * 1000 >= pendingPackChangeAt.getTime());
    if (due) {
      sitePackCount = derivedPacks;
      pendingSitePackCount = null;
      pendingPackChangeAt = null;
    } else {
      sitePackCount = Math.max(user.sitePackCount ?? 0, pendingSitePackCount);
      pendingSitePackCount = derivedPacks;
    }
  }

  // Pending plan downgrade (Business→Pro): keep paid-through plan until due
  if (pendingPlan && pendingPlanAt) {
    const due =
      now >= pendingPlanAt ||
      (periodStart != null && periodStart * 1000 >= pendingPlanAt.getTime());
    if (due) {
      plan = pendingPlan === "pro" || pendingPlan === "business" ? pendingPlan : "free";
      pendingPlan = null;
      pendingPlanAt = null;
      if (plan === "free" || (plan === "pro" && user.plan === "business")) {
        sitePackCount = plan === "free" ? 0 : derivedPacks;
      }
    } else {
      // Keep current paid-through plan for limits
      plan = user.plan;
    }
  }

  // past_due: keep plan (grace) — do not drop to free
  if (subscription.status === "past_due" || subscription.status === "unpaid") {
    plan = user.plan;
    sitePackCount = user.sitePackCount ?? sitePackCount;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: plan as string,
      sitePackCount,
      pendingSitePackCount,
      pendingPackChangeAt,
      pendingPlan,
      pendingPlanAt,
      cancelAtPeriodEnd,
      stripeSubscriptionId: subscription.id,
      stripeStatus: subscription.status,
      stripeCustomerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
    },
  });

  await enforceSiteLimit(userId);
}

async function setFree(userId: string, status?: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: "free",
      sitePackCount: 0,
      pendingSitePackCount: null,
      pendingPackChangeAt: null,
      pendingPlan: null,
      pendingPlanAt: null,
      cancelAtPeriodEnd: false,
      stripeStatus: status || "canceled",
      stripeSubscriptionId: null,
    },
  });
  await enforceSiteLimit(userId);
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

        if (session.metadata?.signup === "1") {
          const result = await upsertUserFromPaidSignupSession(session);
          if (!result.ok) {
            console.error("Webhook signup upsert failed", result.reason);
          } else {
            const u = await prisma.user.findUnique({ where: { email: result.email } });
            if (u) {
              await clearPendingChanges(u.id);
              await enforceSiteLimit(u.id);
            }
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
          await clearPendingChanges(userId);
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
                pendingPlan: null,
                pendingPlanAt: null,
                cancelAtPeriodEnd: false,
              },
            });
            await enforceSiteLimit(userId);
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
        } else if (subscription.status === "past_due") {
          // Grace: keep sites active, just record status
          await prisma.user.update({
            where: { id: userId },
            data: { stripeStatus: "past_due" },
          });
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
        if (userId) {
          await applyDuePendingAndEnforce(userId);
          await syncFromSubscription(userId, subscription);
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;
        if (!customerId) break;
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { stripeStatus: user.stripeStatus === "canceled" ? user.stripeStatus : "past_due" },
          });
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
