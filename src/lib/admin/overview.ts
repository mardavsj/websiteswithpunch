import { prisma } from "@/lib/prisma";
import { VERIFICATION_STARTED_AT } from "@/lib/email-verify";
import { PLANS, SITE_PACKS } from "@/lib/plans";

const DAY = 86_400_000;
export const verifiedWhere = { OR: [{ emailVerified: { not: null } }, { createdAt: { lt: VERIFICATION_STARTED_AT } }] };

/** Real counts only. MRR is an estimate from current plans at monthly list price (interval isn't stored). */
export async function overviewStats() {
  const week = new Date(Date.now() - 7 * DAY);
  const [users, verified, byPlan, packs, sites, down, open, available, alerts, messages, signups, activity, changed, unread, downList] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: verifiedWhere }),
    prisma.user.groupBy({ by: ["plan"], _count: { _all: true }, where: { plan: { in: ["pro", "business"] } } }),
    prisma.user.groupBy({ by: ["plan"], _sum: { sitePackCount: true }, where: { plan: { in: ["pro", "business"] } } }),
    prisma.site.count({ where: { locked: false } }),
    prisma.site.count({ where: { locked: false, status: { in: ["down", "error"] } } }),
    prisma.payout.aggregate({ where: { status: "requested" }, _count: { _all: true }, _sum: { amountCents: true } }),
    prisma.commission.aggregate({ where: { status: { in: ["available", "pending"] }, clawback: false }, _sum: { amountCents: true } }),
    prisma.alertLog.count({ where: { sent: true, createdAt: { gte: week } } }),
    prisma.contactMessage.count({ where: { createdAt: { gte: week } } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, email: true, plan: true, createdAt: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.payout.findMany({ where: { status: "requested", amountChangedAt: { not: null } }, take: 5, select: { id: true, amountCents: true, requestedCents: true, user: { select: { email: true } } } }),
    prisma.contactMessage.count({ where: { handledAt: null } }),
    prisma.site.findMany({ where: { locked: false, status: { in: ["down", "error"] } }, take: 5, orderBy: { lastCheckedAt: "desc" }, select: { id: true, name: true, userId: true, status: true } }),
  ]);
  const count = (p: string) => byPlan.find((r) => r.plan === p)?._count._all ?? 0;
  const packSum = (p: string) => packs.find((r) => r.plan === p)?._sum.sitePackCount ?? 0;
  const pro = count("pro");
  const business = count("business");
  const mrr = pro * PLANS.pro.price + business * PLANS.business.price + packSum("pro") * SITE_PACKS.pro.pricePerMonth + packSum("business") * SITE_PACKS.business.pricePerMonth;
  return {
    users, verified, pro, business, sites, down, mrr,
    openPayouts: open._count._all, openPayoutCents: open._sum.amountCents ?? 0,
    availableCents: available._sum.amountCents ?? 0,
    alerts, messages, signups, activity,
    changed: changed.filter((p) => p.requestedCents !== p.amountCents), unread, downList,
  };
}
