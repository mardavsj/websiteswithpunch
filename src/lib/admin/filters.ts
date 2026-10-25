/**
 * One where-builder per admin list. Overview counts and the pages they link to both use these,
 * so a number on the Overview always equals the rows on the page it opens.
 */
import type { Prisma } from "@prisma/client";

const DAY = 86_400_000;
export const RANGES = { "7d": 7, "30d": 30 } as const;
export type Range = keyof typeof RANGES;
export const rangeOf = (raw?: string): Range | undefined => (raw === "7d" || raw === "30d" ? raw : undefined);
const since = (r: Range | undefined, now: number) => (r ? { createdAt: { gte: new Date(now - RANGES[r] * DAY) } } : {});
/** Start of the window, rounded down to the minute so the Overview and the page agree. */
const minute = (n: number) => Math.floor(n / 60_000) * 60_000;

export const USER_PLANS = ["free", "pro", "business", "paid"] as const;
export function usersWhere(o: { q?: string; plan?: string }): Prisma.UserWhereInput {
  const plan = o.plan === "paid" ? { plan: { in: ["pro", "business"] } } : o.plan && (USER_PLANS as readonly string[]).includes(o.plan) ? { plan: o.plan } : {};
  return {
    ...(o.q && { OR: [{ email: { contains: o.q, mode: "insensitive" } }, { name: { contains: o.q, mode: "insensitive" } }] }),
    ...plan,
  };
}

export const SITE_FILTERS = ["monitored", "down", "ssl", "domain", "locked"] as const;
export type SiteFilter = (typeof SITE_FILTERS)[number];
export const siteFilterOf = (raw?: string) => (SITE_FILTERS as readonly string[]).includes(raw ?? "") ? (raw as SiteFilter) : undefined;
export const FAILING = ["down", "error"];
/** Expiring = within 30 days or already expired; only monitored sites. */
export function sitesWhere(o: { q?: string; status?: SiteFilter }, now = Date.now()): Prisma.SiteWhereInput {
  const soon = new Date(minute(now) + 30 * DAY);
  const f: Record<SiteFilter, Prisma.SiteWhereInput> = {
    monitored: { locked: false },
    down: { locked: false, status: { in: FAILING } },
    ssl: { locked: false, sslExpiresAt: { lte: soon } },
    domain: { locked: false, domainExpiresAt: { lte: soon } },
    locked: { locked: true },
  };
  return {
    ...(o.q && { OR: [{ name: { contains: o.q, mode: "insensitive" } }, { url: { contains: o.q, mode: "insensitive" } }, { user: { email: { contains: o.q, mode: "insensitive" } } }] }),
    ...(o.status && f[o.status]),
  };
}

export const ALERT_KINDS = ["down", "recovered", "ssl", "domain"];
export function alertsWhere(o: { kind?: string; sent?: string; range?: Range }, now = Date.now()): Prisma.AlertLogWhereInput {
  return {
    ...(o.kind && ALERT_KINDS.includes(o.kind) && { kind: o.kind }),
    ...((o.sent === "yes" || o.sent === "no") && { sent: o.sent === "yes" }),
    ...since(o.range, minute(now)),
  };
}

export const MESSAGE_TOPICS = ["general", "billing", "custom-limits", "other"];
/** state: undefined = open (default), "handled", "all". */
export function messagesWhere(o: { topic?: string; state?: string; range?: Range }, now = Date.now()): Prisma.ContactMessageWhereInput {
  return {
    ...(o.topic && MESSAGE_TOPICS.includes(o.topic) && { topic: o.topic }),
    ...(o.state === "handled" ? { handledAt: { not: null } } : o.state === "all" ? {} : { handledAt: null }),
    ...since(o.range, minute(now)),
  };
}

export const COMMISSION_STATUSES = ["available", "requested", "paid", "reversed"];
/** Legacy "pending" rows count as available (the hold was removed). Owed-back rows aren't available. */
export function commissionsWhere(o: { status?: string }): Prisma.CommissionWhereInput {
  if (o.status === "available") return { status: { in: ["available", "pending"] }, clawback: false };
  return o.status && COMMISSION_STATUSES.includes(o.status) ? { status: o.status } : {};
}

export const PAYOUT_TABS = ["requested", "paid", "rejected", "all"] as const;
export function payoutsWhere(o: { tab: string; q?: string }): Prisma.PayoutWhereInput {
  return {
    ...(o.tab !== "all" && { status: o.tab }),
    ...(o.q && { user: { email: { contains: o.q, mode: "insensitive" } } }),
  };
}
