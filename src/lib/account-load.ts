import type { Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolvePackCountForLimit } from "@/lib/plans";
import { applyDuePendingAndEnforce, currentEffectiveLimit } from "@/lib/site-limits";

/** Site columns the dashboard and /plan render (no check history). */
export const ACCOUNT_SITE_FIELDS = {
  id: true,
  name: true,
  url: true,
  status: true,
  locked: true,
  createdAt: true,
  lastCheckedAt: true,
  lastStatusCode: true,
  lastLatencyMs: true,
  sslDaysLeft: true,
  domainDaysLeft: true,
} satisfies Prisma.SiteSelect;

export type AccountSite = Prisma.SiteGetPayload<{ select: typeof ACCOUNT_SITE_FIELDS }>;

/**
 * True when applyDuePendingAndEnforce would change nothing: no pending plan/pack change is due
 * and the active site count already matches the limit (same conditions it checks).
 */
function isSettled(user: User, sites: AccountSite[], now = new Date()): boolean {
  const pack = resolvePackCountForLimit({
    sitePackCount: user.sitePackCount,
    pendingSitePackCount: user.pendingSitePackCount,
    pendingPackChangeAt: user.pendingPackChangeAt,
    now,
  });
  if (pack.shouldApplyPending) return false;
  if (user.pendingPlan && user.pendingPlanAt && now >= user.pendingPlanAt) return false;
  const limit = currentEffectiveLimit(user);
  const active = sites.filter((s) => !s.locked).length;
  return !(active > limit || (active < limit && active < sites.length));
}

/**
 * User + sites for the dashboard and /plan in one parallel round trip. Only when a pending
 * change is due (or sites need locking/unlocking) does it run the enforce step and re-read.
 */
export async function loadAccount(userId: string) {
  const read = () =>
    Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.site.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: ACCOUNT_SITE_FIELDS,
      }),
    ]);
  let [user, sites] = await read();
  if (user && !isSettled(user, sites)) {
    await applyDuePendingAndEnforce(userId);
    [user, sites] = await read();
  }
  return { user, sites };
}
