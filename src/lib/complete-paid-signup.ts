import type Stripe from "stripe";
import { prisma } from "./prisma";
import type { PlanId } from "./plans";

/**
 * Idempotent: create or update a User after a pay-before-signup Checkout session.
 * Expects session.metadata.signup === "1" plus email, passwordHash, planId, name.
 */
export async function upsertUserFromPaidSignupSession(
  session: Stripe.Checkout.Session,
): Promise<{ ok: true; email: string; created: boolean } | { ok: false; reason: string }> {
  const meta = session.metadata || {};
  if (meta.signup !== "1") {
    return { ok: false, reason: "not_signup" };
  }

  const email = (meta.email || "").toLowerCase().trim();
  const passwordHash = meta.passwordHash;
  const name = meta.name?.trim() || null;
  let planId: PlanId | null = null;
  if (meta.planId === "pro" || meta.planId === "business") {
    planId = meta.planId;
  }

  if (!email || !passwordHash || !planId) {
    return { ok: false, reason: "missing_metadata" };
  }

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id || null;
  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id || null;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        plan: planId,
        stripeStatus: "active",
        ...(stripeCustomerId ? { stripeCustomerId } : {}),
        ...(stripeSubscriptionId ? { stripeSubscriptionId } : {}),
      },
    });
    return { ok: true, email, created: false };
  }

  await prisma.user.create({
    data: {
      email,
      name,
      password: passwordHash,
      plan: planId,
      stripeCustomerId,
      stripeSubscriptionId,
      stripeStatus: "active",
    },
  });
  return { ok: true, email, created: true };
}
