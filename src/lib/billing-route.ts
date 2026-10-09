/**
 * Shared plumbing for /api/billing/* routes: session, rate limit, Dodo client, the user's
 * subscription (re-read from Dodo, never trusted from the DB) and consistent JSON errors.
 */
import { NextResponse } from "next/server";
import type DodoPayments from "dodopayments";
import type { User } from "@prisma/client";
import { getSession } from "./auth";
import { prisma } from "./prisma";
import { MINUTE, rateLimit, tooMany } from "./rate-limit";
import { dodoErrorStatus, dodoUserMessage, getDodo, isDodoConfigured, isDodoNotFound } from "./dodo";
import { logCatalogProblems } from "./dodo-catalog-check";
import { retrieveOrRelink } from "./dodo-relink";
import { isPaidStatus, scheduledKind, subscriptionState, type SubscriptionState } from "./dodo-subscription";
import type { PaidPlanId } from "./billing-interval";

export function fail(status: number, error: string, code?: string, extra?: object) {
  return NextResponse.json({ error, ...(code ? { code } : {}), ...extra }, { status });
}

export type BillingCtx = {
  user: User;
  dodo: DodoPayments;
  sub: DodoPayments.Subscription;
  st: SubscriptionState & { plan: PaidPlanId };
};

type Opts = { label: string; rateKey?: string; rateLimit?: number };

/** Signed-in user + Dodo client, or the error response to return. */
export async function loadUser(opts: Opts): Promise<NextResponse | { user: User; dodo: DodoPayments }> {
  const session = await getSession();
  if (!session?.user?.id) return fail(401, "Unauthorized");
  if (opts.rateKey) {
    const limited = await rateLimit([
      { key: `${opts.rateKey}:user:${session.user.id}`, limit: opts.rateLimit ?? 10, windowMs: 10 * MINUTE },
    ]);
    if (!limited.ok) return tooMany(limited.retryAfterSec);
  }
  const dodo = isDodoConfigured() ? getDodo() : null;
  if (!dodo) return fail(503, "Billing is unavailable right now. Please try again later or contact us.");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return fail(401, "Unauthorized");
  return { user, dodo };
}

/**
 * Runs `fn` with the user's active subscription. Answers 403 NO_SUBSCRIPTION without one,
 * and turns Dodo errors into readable JSON (4xx messages from Dodo are passed through).
 */
export async function withSubscription(
  opts: Opts,
  fn: (ctx: BillingCtx) => Promise<NextResponse>,
): Promise<NextResponse> {
  const loaded = await loadUser(opts);
  if (loaded instanceof NextResponse) return loaded;
  const { user, dodo } = loaded;
  if (!user.dodoSubscriptionId || !isPaidStatus(user.dodoStatus)) {
    if (user.dodoStatus === "on_hold") {
      return fail(402, ON_HOLD_ERROR, "PAYMENT_FAILED");
    }
    return fail(403, "An active subscription is required.", "NO_SUBSCRIPTION");
  }
  let sub: DodoPayments.Subscription | null;
  try {
    // A stored ID from the other Dodo mode (test → live) is re-linked when possible.
    sub = await retrieveOrRelink(dodo, user);
  } catch (err) {
    return dodoFail(opts.label, err);
  }
  if (!sub) return fail(409, SUBSCRIPTION_MISSING_ERROR, "SUBSCRIPTION_NOT_FOUND");
  try {
    const st = subscriptionState(sub);
    if (!st.plan || !isPaidStatus(st.status)) {
      return fail(403, "An active subscription is required.", "NO_SUBSCRIPTION");
    }
    return await fn({ user, dodo, sub, st: st as BillingCtx["st"] });
  } catch (err) {
    // The subscription exists, so a 404 here is a product / add-on ID: log which env var.
    if (isDodoNotFound(err)) await logCatalogProblems(dodo, opts.label);
    return dodoFail(opts.label, err);
  }
}

function dodoFail(label: string, err: unknown) {
  console.error(`billing ${label} error`, err);
  const status = dodoErrorStatus(err);
  return fail(
    status && status >= 400 && status < 500 ? 400 : 502,
    dodoUserMessage(err, "Billing is unavailable right now. Please try again in a moment."),
  );
}

export const SUBSCRIPTION_MISSING_ERROR =
  "We couldn't find your subscription with our payment provider, so nothing was changed or charged. Please contact us from the Contact page and we'll sort it out.";

export const ON_HOLD_ERROR =
  "Your last renewal payment didn't go through, so your plan is on hold. Update your payment method in Manage billing to restore it.";

const SCHEDULED_ERRORS = {
  interval: ["A switch to monthly billing is booked for your renewal date. Keep annual billing in Your plan first, then try again.", "SWITCH_PENDING"],
  downgrade: ["A switch to Pro is booked for your renewal date. Choose Keep Business in Your plan first, then try again.", "DOWNGRADE_PENDING"],
  packs: ["A site pack removal is booked for your renewal date. Undo it in Your plan first, then try again.", "REMOVAL_PENDING"],
} as const;

/** 409 when a renewal-date change is booked whose kind is not in `allow`. */
export function blockIfScheduled(
  st: SubscriptionState,
  allow: Array<"interval" | "downgrade" | "packs"> = [],
): NextResponse | null {
  const kind = scheduledKind(st);
  if (kind === "none" || allow.includes(kind)) return null;
  const [error, code] = SCHEDULED_ERRORS[kind];
  return fail(409, error, code);
}
