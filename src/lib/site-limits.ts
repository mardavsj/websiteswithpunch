import { prisma } from "@/lib/prisma";
import {
  getEffectivePlan,
  getEffectiveSiteLimit,
  getUserEffectiveSiteLimit,
  resolvePackCountForLimit,
  type PlanId,
} from "@/lib/plans";

export type EnforceResult = {
  limit: number;
  activeCount: number;
  lockedCount: number;
  newlyLocked: number;
  newlyUnlocked: number;
  usedDefaultOldest: boolean;
};

/** Strip monitoring metrics for locked sites before sending to the client. */
export function toClientSite<T extends Record<string, unknown>>(site: T): T {
  if (!(site as { locked?: boolean }).locked) return site;
  return {
    ...site,
    status: "locked",
    lastCheckedAt: null,
    lastStatusCode: null,
    lastLatencyMs: null,
    sslExpiresAt: null,
    sslDaysLeft: null,
    domainExpiresAt: null,
    domainDaysLeft: null,
  };
}

/** Limit that will apply once all pending changes take effect (for picker copy). */
export function pendingTargetLimit(user: {
  plan: string;
  stripeStatus: string | null;
  sitePackCount: number;
  pendingSitePackCount: number | null;
  pendingPackChangeAt: Date | null;
  pendingPlan: string | null;
  pendingPlanAt: Date | null;
}): number | null {
  const hasPackPending =
    user.pendingSitePackCount != null &&
    user.pendingPackChangeAt != null &&
    user.pendingSitePackCount < (user.sitePackCount ?? 0);
  const hasPlanPending = Boolean(user.pendingPlan && user.pendingPlanAt);
  if (!hasPackPending && !hasPlanPending) return null;

  let plan: PlanId = getEffectivePlan(user.plan, user.stripeStatus);
  let packs = user.sitePackCount ?? 0;

  if (hasPlanPending && user.pendingPlan) {
    plan = (user.pendingPlan === "pro" || user.pendingPlan === "business"
      ? user.pendingPlan
      : "free") as PlanId;
    if (plan === "free") packs = 0;
    else if (plan === "pro" && user.plan === "business") packs = 0;
  }
  if (hasPackPending) {
    packs = user.pendingSitePackCount ?? 0;
  }
  return getEffectiveSiteLimit(plan, packs);
}

export function currentEffectiveLimit(user: {
  plan: string;
  stripeStatus: string | null;
  sitePackCount: number;
  pendingSitePackCount: number | null;
  pendingPackChangeAt: Date | null;
}): number {
  const plan = getEffectivePlan(user.plan, user.stripeStatus);
  return getUserEffectiveSiteLimit(
    plan,
    user.sitePackCount,
    user.pendingSitePackCount,
    user.pendingPackChangeAt,
  );
}

/**
 * Apply pending pack/plan changes that are due, then lock/unlock sites to match the limit.
 * Idempotent — safe from webhooks and dashboard loads.
 */
export async function applyDuePendingAndEnforce(userId: string): Promise<EnforceResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return {
      limit: 0,
      activeCount: 0,
      lockedCount: 0,
      newlyLocked: 0,
      newlyUnlocked: 0,
      usedDefaultOldest: false,
    };
  }

  const now = new Date();
  const data: Record<string, unknown> = {};

  const packResolved = resolvePackCountForLimit({
    sitePackCount: user.sitePackCount,
    pendingSitePackCount: user.pendingSitePackCount,
    pendingPackChangeAt: user.pendingPackChangeAt,
    now,
  });
  if (packResolved.shouldApplyPending) {
    data.sitePackCount = packResolved.packCount;
    data.pendingSitePackCount = null;
    data.pendingPackChangeAt = null;
  }

  if (user.pendingPlan && user.pendingPlanAt && now >= user.pendingPlanAt) {
    const next = user.pendingPlan;
    data.plan = next === "pro" || next === "business" ? next : "free";
    data.pendingPlan = null;
    data.pendingPlanAt = null;
    data.cancelAtPeriodEnd = false;
    if (data.plan === "free") {
      data.sitePackCount = 0;
      data.pendingSitePackCount = null;
      data.pendingPackChangeAt = null;
    } else if (data.plan === "pro" && user.plan === "business") {
      data.sitePackCount = 0;
      data.pendingSitePackCount = null;
      data.pendingPackChangeAt = null;
    }
  }

  if (Object.keys(data).length) {
    await prisma.user.update({ where: { id: userId }, data });
  }

  return enforceSiteLimit(userId);
}

/**
 * Lock/unlock sites so active (unlocked) count <= effective limit.
 * Prefer keepOnDowngrade marks; otherwise keep oldest unlocked sites.
 */
export async function enforceSiteLimit(userId: string): Promise<EnforceResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return {
      limit: 0,
      activeCount: 0,
      lockedCount: 0,
      newlyLocked: 0,
      newlyUnlocked: 0,
      usedDefaultOldest: false,
    };
  }

  const limit = currentEffectiveLimit(user);
  const sites = await prisma.site.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const unlocked = sites.filter((s) => !s.locked);
  const locked = sites.filter((s) => s.locked);

  let newlyLocked = 0;
  let newlyUnlocked = 0;
  let usedDefaultOldest = false;

  if (unlocked.length > limit) {
    const kept = unlocked.filter((s) => s.keepOnDowngrade);
    const rest = unlocked.filter((s) => !s.keepOnDowngrade);
    const selected: typeof unlocked = [];
    for (const s of kept) {
      if (selected.length < limit) selected.push(s);
    }
    if (selected.length < limit) {
      if (kept.length === 0) usedDefaultOldest = true;
      for (const s of rest) {
        if (selected.length < limit) selected.push(s);
      }
    }
    const selectedIds = new Set(selected.slice(0, limit).map((s) => s.id));
    const toLock = unlocked.filter((s) => !selectedIds.has(s.id));
    const now = new Date();
    for (const s of toLock) {
      await prisma.site.update({
        where: { id: s.id },
        data: { locked: true, lockedAt: now, keepOnDowngrade: false },
      });
      newlyLocked++;
    }
    for (const id of selectedIds) {
      await prisma.site.update({
        where: { id },
        data: { keepOnDowngrade: false },
      });
    }
    if (usedDefaultOldest && newlyLocked > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { showDefaultLockNotice: true },
      });
    }
  } else if (unlocked.length < limit && locked.length > 0) {
    const slots = limit - unlocked.length;
    const toUnlock = [...locked]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, slots);
    for (const s of toUnlock) {
      await prisma.site.update({
        where: { id: s.id },
        data: { locked: false, lockedAt: null, keepOnDowngrade: false },
      });
      newlyUnlocked++;
    }
  }

  const after = await prisma.site.findMany({
    where: { userId },
    select: { locked: true },
  });
  const activeCount = after.filter((s) => !s.locked).length;
  const lockedCount = after.filter((s) => s.locked).length;

  return {
    limit,
    activeCount,
    lockedCount,
    newlyLocked,
    newlyUnlocked,
    usedDefaultOldest,
  };
}

/** Mark which sites stay active when a pending reduction applies. */
export async function setKeepOnDowngrade(
  userId: string,
  siteIds: string[],
  maxKeep: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (siteIds.length > maxKeep) {
    return { ok: false, error: `Select at most ${maxKeep} site${maxKeep === 1 ? "" : "s"}.` };
  }
  const sites = await prisma.site.findMany({
    where: { userId, locked: false },
    select: { id: true },
  });
  const activeIds = new Set(sites.map((s) => s.id));
  for (const id of siteIds) {
    if (!activeIds.has(id)) {
      return { ok: false, error: "One or more selected sites are invalid." };
    }
  }
  await prisma.site.updateMany({
    where: { userId },
    data: { keepOnDowngrade: false },
  });
  if (siteIds.length) {
    await prisma.site.updateMany({
      where: { userId, id: { in: siteIds } },
      data: { keepOnDowngrade: true },
    });
  }
  return { ok: true };
}

/** Unlock a single locked site if a free slot exists (delete an active site first if at limit). */
export async function unlockSiteIfSlot(
  userId: string,
  siteId: string,
): Promise<{ ok: true } | { ok: false; error: string; code?: string; limit?: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "Unauthorized" };

  const site = await prisma.site.findFirst({ where: { id: siteId, userId } });
  if (!site) return { ok: false, error: "Not found" };
  if (!site.locked) return { ok: true };

  const limit = currentEffectiveLimit(user);
  const active = await prisma.site.count({ where: { userId, locked: false } });
  if (active >= limit) {
    return {
      ok: false,
      error: `Your plan includes ${limit} active site${limit === 1 ? "" : "s"}. Delete an active site or upgrade to free a slot.`,
      code: "NO_SLOT",
      limit,
    };
  }

  await prisma.site.update({
    where: { id: siteId },
    data: { locked: false, lockedAt: null },
  });
  return { ok: true };
}

export async function dismissDefaultLockNotice(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { showDefaultLockNotice: false },
  });
}

/** Clear all pending downgrade/cancel/pack-removal state (e.g. on upgrade). */
export async function clearPendingChanges(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      pendingPlan: null,
      pendingPlanAt: null,
      pendingSitePackCount: null,
      pendingPackChangeAt: null,
      cancelAtPeriodEnd: false,
    },
  });
  await prisma.site.updateMany({
    where: { userId },
    data: { keepOnDowngrade: false },
  });
}
