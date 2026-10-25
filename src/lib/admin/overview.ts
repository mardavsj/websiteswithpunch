import { prisma } from "@/lib/prisma";
import { VERIFICATION_STARTED_AT } from "@/lib/email-verify";
import { PLANS, SITE_PACKS } from "@/lib/plans";
import { alertsWhere, commissionsWhere, messagesWhere, payoutsWhere, sitesWhere, usersWhere } from "./filters";

export const verifiedWhere = { OR: [{ emailVerified: { not: null } }, { createdAt: { lt: VERIFICATION_STARTED_AT } }] };

/** Real counts only. MRR is an estimate from current plans at monthly list price (interval isn't stored). */
export async function overviewStats(now = Date.now()) {
  const [users, verified, byPlan, packs, sites, down, open, available, alerts, messages, signups, activity, changed, unread, downList, ssl, domain] = await Promise.all([
    prisma.user.count({ where: usersWhere({}) }),
    prisma.user.count({ where: verifiedWhere }),
    prisma.user.groupBy({ by: ["plan"], _count: { _all: true }, where: usersWhere({ plan: "paid" }) }),
    prisma.user.groupBy({ by: ["plan"], _sum: { sitePackCount: true }, where: usersWhere({ plan: "paid" }) }),
    prisma.site.count({ where: sitesWhere({ status: "monitored" }, now) }),
    prisma.site.count({ where: sitesWhere({ status: "down" }, now) }),
    prisma.payout.aggregate({ where: payoutsWhere({ tab: "requested" }), _count: { _all: true }, _sum: { amountCents: true } }),
    prisma.commission.aggregate({ where: commissionsWhere({ status: "available" }), _count: { _all: true }, _sum: { amountCents: true } }),
    prisma.alertLog.count({ where: alertsWhere({ sent: "yes", range: "7d" }, now) }),
    prisma.contactMessage.count({ where: messagesWhere({ state: "all", range: "7d" }, now) }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, email: true, plan: true, createdAt: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.payout.findMany({ where: { status: "requested", amountChangedAt: { not: null } }, take: 5, select: { id: true, amountCents: true, requestedCents: true, user: { select: { email: true } } } }),
    prisma.contactMessage.count({ where: messagesWhere({}) }),
    prisma.site.findMany({ where: sitesWhere({ status: "down" }, now), take: 5, orderBy: { lastCheckedAt: "desc" }, select: { id: true, name: true, userId: true, status: true } }),
    prisma.site.count({ where: sitesWhere({ status: "ssl" }, now) }),
    prisma.site.count({ where: sitesWhere({ status: "domain" }, now) }),
  ]);
  const count = (p: string) => byPlan.find((r) => r.plan === p)?._count._all ?? 0;
  const packSum = (p: string) => packs.find((r) => r.plan === p)?._sum.sitePackCount ?? 0;
  const pro = count("pro");
  const business = count("business");
  const mrr = pro * PLANS.pro.price + business * PLANS.business.price + packSum("pro") * SITE_PACKS.pro.pricePerMonth + packSum("business") * SITE_PACKS.business.pricePerMonth;
  return {
    users, verified, pro, business, sites, down, mrr,
    openPayouts: open._count._all, openPayoutCents: open._sum.amountCents ?? 0,
    availableCents: available._sum.amountCents ?? 0, availableCount: available._count._all, ssl, domain,
    alerts, messages, signups, activity,
    changed: changed.filter((p) => p.requestedCents !== p.amountCents), unread, downList,
  };
}
