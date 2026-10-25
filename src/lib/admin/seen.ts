/**
 * Green "new" badges: per admin, per section/filter key, how many rows appeared or changed since
 * that admin last opened it. Filters come from filters.ts so badges match the pages.
 * Never-opened keys: rows from before LAUNCH count as seen, except actionable keys
 * (open payouts, open messages, sites down), which count everything until first viewed.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { alertsWhere, commissionsWhere, messagesWhere, payoutsWhere, sitesWhere, usersWhere, type SiteFilter } from "./filters";

export const LAUNCH = new Date("2026-10-25T08:30:00Z");
const DAY = 86_400_000;
/** A refresh within this window keeps the previous visit's "new" highlights. */
const SESSION_MS = 5 * 60_000;
const gt = (d: Date) => ({ gt: d });

type Def = { model: "user" | "site" | "payout" | "contactMessage" | "alertLog" | "commission" | "auditLog"; actionable?: boolean; where: (fresh: Date, first: boolean) => Record<string, unknown> };
const and = (a: object, b: object) => ({ AND: [a, b] });

const siteDown = (since: Date, first: boolean): Prisma.SiteWhereInput => and(sitesWhere({ status: "down" }), first ? {} : { OR: [{ alertDownAt: gt(since) }, { alertDownAt: null, updatedAt: gt(since) }] });
const site = (status: SiteFilter, extra: (s: Date) => Prisma.SiteWhereInput): Def => ({ model: "site", where: (s) => and(sitesWhere({ status }), { OR: [{ createdAt: gt(s) }, extra(s)] }) });
const created = (model: Def["model"], base: object, field = "createdAt"): Def => ({ model, where: (s) => and(base, { [field]: gt(s) }) });

export const KEYS: Record<string, Def> = {
  users: created("user", usersWhere({})),
  ...Object.fromEntries(["paid", "free", "pro", "business"].map((p) => [`users:${p}`, created("user", usersWhere({ plan: p }))])),
  sites: { model: "site", actionable: true, where: (s, first) => ({ OR: [{ createdAt: gt(first ? LAUNCH : s) }, siteDown(s, first)] }) },
  "sites:down": { model: "site", actionable: true, where: siteDown },
  "sites:monitored": created("site", sitesWhere({ status: "monitored" })),
  "sites:locked": created("site", sitesWhere({ status: "locked" }), "lockedAt"),
  "sites:ssl": site("ssl", (s) => ({ sslExpiresAt: gt(new Date(s.getTime() + 30 * DAY)) })),
  "sites:domain": site("domain", (s) => ({ domainExpiresAt: gt(new Date(s.getTime() + 30 * DAY)) })),
  "payouts:requested": { model: "payout", actionable: true, where: (s, first) => and(payoutsWhere({ tab: "requested" }), first ? {} : { OR: [{ createdAt: gt(s) }, { amountChangedAt: gt(s) }] }) },
  "payouts:paid": created("payout", payoutsWhere({ tab: "paid" }), "decidedAt"),
  "payouts:rejected": created("payout", payoutsWhere({ tab: "rejected" }), "decidedAt"),
  "payouts:all": { model: "payout", where: (s) => ({ OR: [{ createdAt: gt(s) }, { decidedAt: gt(s) }, { amountChangedAt: gt(s) }] }) },
  "messages:open": { model: "contactMessage", actionable: true, where: (s, first) => and(messagesWhere({}), first ? {} : { createdAt: gt(s) }) },
  "messages:handled": created("contactMessage", messagesWhere({ state: "handled" }), "handledAt"),
  "messages:all": created("contactMessage", messagesWhere({ state: "all" })),
  alerts: created("alertLog", {}),
  ...Object.fromEntries(["down", "recovered", "ssl", "domain"].map((k) => [`alerts:${k}`, created("alertLog", alertsWhere({ kind: k }))])),
  referrals: created("commission", {}),
  ...Object.fromEntries(["available", "requested", "paid", "reversed"].map((k) => [`referrals:${k}`, created("commission", commissionsWhere({ status: k }), k === "available" ? "createdAt" : "updatedAt")])),
  audit: created("auditLog", {}),
};

/** Sidebar badge per section = its default view's key. */
export const SECTION_KEY: Record<string, string> = {
  "/admin/users": "users", "/admin/sites": "sites", "/admin/payouts": "payouts:requested", "/admin/referrals": "referrals",
  "/admin/messages": "messages:open", "/admin/alerts": "alerts", "/admin/audit": "audit",
};

type Seen = Map<string, { seenAt: Date; prevAt: Date | null }>;
async function seenMap(email: string, keys: string[]): Promise<Seen> {
  const rows = await prisma.adminSeen.findMany({ where: { adminEmail: email.toLowerCase(), key: { in: keys } } });
  return new Map(rows.map((r) => [r.key, r]));
}

const count = (d: Def, where: object) => (prisma[d.model] as unknown as { count: (a: { where: object }) => Promise<number> }).count({ where });

/** Unseen count per key for this admin. Unknown keys are 0. */
export async function newCounts(email: string, keys: string[]): Promise<Record<string, number>> {
  const ks = keys.filter((k) => KEYS[k]);
  const seen = await seenMap(email, ks);
  const out: Record<string, number> = {};
  await Promise.all(ks.map(async (k) => {
    const s = seen.get(k);
    out[k] = await count(KEYS[k], KEYS[k].where(s?.seenAt ?? LAUNCH, !s));
  }));
  return out;
}

/** Rows changed after this time get a "New" dot on the page being viewed (before marking it seen). */
export async function dotSince(email: string, key: string, now = Date.now()): Promise<Date> {
  const s = (await seenMap(email, [key])).get(key);
  if (!s) return KEYS[key]?.actionable ? new Date(0) : LAUNCH;
  if (now - s.seenAt.getTime() < SESSION_MS) return s.prevAt ?? (KEYS[key]?.actionable ? new Date(0) : LAUNCH);
  return s.seenAt;
}

/** Mark keys seen now. Keeps the earlier visit in prevAt unless this is a quick re-render. */
export async function markSeen(email: string, keys: string[], now = new Date()) {
  const adminEmail = email.toLowerCase();
  const seen = await seenMap(adminEmail, keys);
  await Promise.all(keys.filter((k) => KEYS[k]).map((key) => {
    const s = seen.get(key);
    const prevAt = !s ? null : now.getTime() - s.seenAt.getTime() < SESSION_MS ? s.prevAt : s.seenAt;
    return prisma.adminSeen.upsert({ where: { adminEmail_key: { adminEmail, key } }, create: { adminEmail, key, seenAt: now }, update: { seenAt: now, prevAt } });
  }));
}

/**
 * One call per admin page: counts for the given filter keys, the dot cut-off for the key being
 * viewed, then marks the viewed keys seen. `refresh` tells the page to refresh the sidebar.
 */
export async function viewSection(email: string, filterKeys: string[], viewing: string[]) {
  const before = await newCounts(email, [...new Set([...filterKeys, ...viewing])]);
  const since = await dotSince(email, viewing[0]);
  const refresh = viewing.some((k) => (before[k] ?? 0) > 0);
  await markSeen(email, viewing);
  const counts = { ...before };
  for (const k of viewing) counts[k] = 0;
  return { counts, since, refresh };
}
