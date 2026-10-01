import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plans";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { buildRecurringBreakdown, monthlyTotalCentsFromItems } from "@/lib/stripe-subscription";
import { formatRecurringFromCents, formatShortDate } from "@/lib/billing-format";
import {
  monthlySwitchPhases,
  monthlySwitchPlan,
  pendingIntervalSwitch,
  scheduleId,
} from "@/lib/interval-schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Annual → monthly at renewal. GET = preview, POST = schedule it, DELETE = cancel the pending
 * switch. Nothing is charged, refunded or credited: the paid year runs out, then monthly starts.
 */
type Loaded = { stripe: Stripe; sub: Stripe.Subscription; userId: string };

async function load(): Promise<Loaded | NextResponse> {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const stripe = isStripeConfigured() ? getStripe() : null;
  if (!stripe) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const plan = getEffectivePlan(user?.plan, user?.stripeStatus);
  if (!user?.stripeSubscriptionId || plan === "free") {
    return NextResponse.json({ error: "No active subscription." }, { status: 400 });
  }
  const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
    expand: ["schedule"],
  });
  return { stripe, sub, userId: user.id };
}

async function withLoaded(fn: (l: Loaded) => Promise<NextResponse>, label: string) {
  try {
    const l = await load();
    return l instanceof NextResponse ? l : await fn(l);
  } catch (err) {
    console.error(`switch-interval ${label} error`, err);
    return NextResponse.json({ error: "Could not update your billing. Try again." }, { status: 500 });
  }
}

export async function GET() {
  return withLoaded(async ({ stripe, sub }) => {
    const sw = monthlySwitchPlan(sub);
    if (!sw.ok) return NextResponse.json({ error: sw.error, code: sw.code }, { status: sw.status });
    const [planPrice, packPrice] = await Promise.all(
      sw.nextItems.map((i) => stripe.prices.retrieve(i.price)),
    );
    const planCents = planPrice?.unit_amount ?? null;
    const packCents = packPrice?.unit_amount ?? null;
    const currency = sub.currency || "usd";
    const cents = monthlyTotalCentsFromItems(sw.plan, sw.packs, planCents, packCents, "month");
    const at = new Date(sw.switchAt * 1000);
    return NextResponse.json({
      plan: sw.plan,
      packs: sw.packs,
      switchAt: at.toISOString(),
      switchAtFormatted: formatShortDate(at),
      newRecurringFormatted: formatRecurringFromCents(cents, currency, "month"),
      recurringBreakdown: buildRecurringBreakdown({
        plan: sw.plan,
        packCount: sw.packs,
        planUnitCents: planCents,
        packUnitCents: packCents,
        currency,
        interval: "month",
      }),
    });
  }, "preview");
}

export async function POST() {
  return withLoaded(async ({ stripe, sub, userId }) => {
    const sw = monthlySwitchPlan(sub);
    if (!sw.ok) return NextResponse.json({ error: sw.error, code: sw.code }, { status: sw.status });
    const schedule = await stripe.subscriptionSchedules.create({ from_subscription: sub.id });
    try {
      await stripe.subscriptionSchedules.update(schedule.id, {
        end_behavior: "release",
        metadata: { pendingInterval: "month", userId },
        phases: monthlySwitchPhases(sw, schedule.phases[0].start_date),
      });
    } catch (err) {
      // Leave the subscription exactly as it was.
      await stripe.subscriptionSchedules.release(schedule.id).catch(() => null);
      throw err;
    }
    const at = new Date(sw.switchAt * 1000);
    return NextResponse.json({
      ok: true,
      switchAt: at.toISOString(),
      switchAtFormatted: formatShortDate(at),
    });
  }, "schedule");
}

export async function DELETE() {
  return withLoaded(async ({ stripe, sub }) => {
    const id = scheduleId(sub);
    if (!id || !pendingIntervalSwitch(sub)) {
      return NextResponse.json({ error: "No switch to monthly is scheduled." }, { status: 400 });
    }
    await stripe.subscriptionSchedules.release(id);
    return NextResponse.json({ ok: true });
  }, "cancel");
}
