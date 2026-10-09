/**
 * Mirror a Dodo subscription onto the User row, then lock/unlock sites to match. Shared by the
 * webhook and by the billing routes (which re-read the subscription right after a change, so
 * the dashboard updates without waiting for the webhook). Idempotent: it copies state, it
 * never adds or subtracts, so replays and duplicates are harmless.
 */
import { prisma } from "./prisma";
import {
  ENDED_STATUSES,
  isPaidStatus,
  subscriptionState,
  type SubLike,
} from "./dodo-subscription";
import { enforceSiteLimit } from "./site-limits";

export type SyncResult = "synced" | "ignored" | "stale" | "no_user";

/** Our user for a subscription: stored IDs, our metadata, then the checkout email. */
export async function findUserForSubscription(sub: SubLike) {
  const bySub = await prisma.user.findUnique({ where: { dodoSubscriptionId: sub.subscription_id } });
  if (bySub) return bySub;
  const metaId = sub.metadata?.userId;
  if (typeof metaId === "string" && metaId) {
    const byMeta = await prisma.user.findUnique({ where: { id: metaId } });
    if (byMeta) return byMeta;
  }
  const customerId = sub.customer?.customer_id;
  if (customerId) {
    const byCustomer = await prisma.user.findUnique({ where: { dodoCustomerId: customerId } });
    if (byCustomer) return byCustomer;
  }
  const email = sub.customer?.email?.toLowerCase().trim();
  return email ? prisma.user.findUnique({ where: { email } }) : null;
}

/**
 * @param eventAt webhook `timestamp`; events older than the last applied one are skipped.
 * Only webhooks pass it, so ordering compares Dodo timestamps with Dodo timestamps.
 */
export async function syncSubscription(
  sub: SubLike,
  opts: { userId?: string; eventAt?: Date | null } = {},
): Promise<SyncResult> {
  const user = opts.userId
    ? await prisma.user.findUnique({ where: { id: opts.userId } })
    : await findUserForSubscription(sub);
  if (!user) return "no_user";
  const eventAt = opts.eventAt && !Number.isNaN(opts.eventAt.getTime()) ? opts.eventAt : null;
  if (eventAt && user.dodoSyncedAt && eventAt < user.dodoSyncedAt) return "stale";

  const st = subscriptionState(sub);
  const isCurrent = !user.dodoSubscriptionId || user.dodoSubscriptionId === sub.subscription_id;
  const stamp = eventAt ? { dodoSyncedAt: eventAt } : {};
  const customerId = sub.customer?.customer_id;
  const ids = customerId && !user.dodoCustomerId ? { dodoCustomerId: customerId } : {};

  if (st.status === "pending") return "ignored"; // checkout not finished yet

  if (ENDED_STATUSES.has(st.status)) {
    // An old or failed subscription ending must not touch a newer one.
    if (!isCurrent) return "ignored";
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: "free",
        sitePackCount: 0,
        pendingSitePackCount: null,
        pendingPackChangeAt: null,
        pendingPlan: null,
        pendingPlanAt: null,
        cancelAtPeriodEnd: false,
        dodoStatus: st.status,
        ...ids,
        ...stamp,
      },
    });
    await enforceSiteLimit(user.id);
    return "synced";
  }

  if (!st.plan) {
    console.warn("[dodo] subscription for a product not in env", sub.subscription_id, sub.product_id);
    return "ignored";
  }
  // A second subscription never replaces one that is still paid unless it is paid too.
  if (!isCurrent && isPaidStatus(user.dodoStatus) && !isPaidStatus(st.status)) return "ignored";

  const sc = st.scheduled;
  const cancel = st.cancelAtPeriodEnd;
  const planPending = cancel ? "free" : sc && sc.plan !== st.plan ? sc.plan : null;
  const planAt = cancel ? st.periodEnd : planPending ? sc!.at : null;
  const packsPending =
    !cancel && sc && sc.plan === st.plan && sc.packs < st.packs ? sc.packs : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: st.plan,
      sitePackCount: st.packs,
      pendingPlan: planPending,
      pendingPlanAt: planAt,
      pendingSitePackCount: packsPending,
      pendingPackChangeAt: packsPending != null ? sc!.at : null,
      cancelAtPeriodEnd: cancel,
      dodoStatus: st.status,
      dodoSubscriptionId: sub.subscription_id,
      ...ids,
      ...stamp,
    },
  });

  const hadPending = Boolean(user.pendingPlan) || user.pendingSitePackCount != null;
  if (hadPending && !planPending && packsPending == null) {
    // Downgrade / removal / cancel was undone: forget the "keep these sites" picks.
    await prisma.site.updateMany({ where: { userId: user.id }, data: { keepOnDowngrade: false } });
  }
  await enforceSiteLimit(user.id);
  return "synced";
}
