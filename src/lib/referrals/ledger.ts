/**
 * Referral commission ledger. Every write is idempotent:
 * - one Commission per Dodo payment (paymentId is unique; a replayed webhook is a no-op);
 * - status moves use guarded updates (where status = expected), so retries change nothing twice.
 * pending (hold) -> available -> requested -> paid; any state -> reversed on refund/dispute.
 */
import type { PrismaClient } from "@prisma/client";
import { REFERRAL } from "./config";

const DAY_MS = 86_400_000;
// Narrow handle so tests can pass an in-memory fake.
export type LedgerDb = Pick<PrismaClient, "commission" | "payout">;
let defaultDb: LedgerDb | null = null;
async function getDb(db?: LedgerDb): Promise<LedgerDb> {
  if (db) return db;
  if (!defaultDb) defaultDb = (await import("@/lib/prisma")).prisma;
  return defaultDb;
}

/** Commission basis: what the customer paid minus tax (Dodo reports tax separately when charged). */
export function commissionBase(p: { total_amount: number; tax?: number | null }): number {
  return Math.max(0, Math.round(p.total_amount) - Math.max(0, Math.round(p.tax ?? 0)));
}
export const commissionAmount = (baseCents: number, rateBps: number = REFERRAL.rateBps) =>
  Math.floor((baseCents * rateBps) / 10_000);

export type NewCommission = {
  paymentId: string; referrerId: string; referredUserId: string;
  subscriptionId?: string | null; currency: string; baseCents: number;
};

export async function recordCommission(c: NewCommission, now = new Date(), db?: LedgerDb) {
  const d = await getDb(db);
  const amountCents = commissionAmount(c.baseCents);
  if (amountCents <= 0) return { created: false as const, reason: "zero" };
  try {
    const row = await d.commission.create({
      data: {
        ...c, subscriptionId: c.subscriptionId ?? null, rateBps: REFERRAL.rateBps, amountCents,
        status: "pending", availableAt: new Date(now.getTime() + REFERRAL.holdDays * DAY_MS),
      },
    });
    return { created: true as const, row };
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") return { created: false as const, reason: "duplicate" };
    throw e;
  }
}

/** Refund or dispute: reverse the payment's commission (no-op if none or already reversed). */
export async function reverseCommission(paymentId: string, reason: "refund" | "dispute", now = new Date(), db?: LedgerDb) {
  const d = await getDb(db);
  const c = await d.commission.findUnique({ where: { paymentId } });
  if (!c || c.status === "reversed") return "noop" as const;
  const res = await d.commission.updateMany({
    where: { id: c.id, status: c.status },
    data: { status: "reversed", reversedReason: reason, reversedAt: now, clawback: c.status === "paid" },
  });
  if (res.count === 0) return "raced" as const;
  if (c.status === "requested" && c.payoutId) {
    await d.payout.update({ where: { id: c.payoutId }, data: { amountCents: { decrement: c.amountCents } } });
  }
  return "reversed" as const;
}

/** Dispute won/cancelled: put a dispute reversal back where it belongs. Refund reversals stay. */
export async function reinstateCommission(paymentId: string, now = new Date(), db?: LedgerDb) {
  const d = await getDb(db);
  const c = await d.commission.findUnique({ where: { paymentId } });
  if (!c || c.status !== "reversed" || c.reversedReason !== "dispute") return "noop" as const;
  let status = c.availableAt <= now ? "available" : "pending";
  let payoutId: string | null = null;
  if (c.clawback && !c.clawbackPayoutId) {
    status = "paid"; payoutId = c.payoutId; // still paid out, nothing owed any more
  } else if (!c.clawback && c.payoutId) {
    const p = await d.payout.findUnique({ where: { id: c.payoutId } });
    if (p?.status === "requested") {
      status = "requested"; payoutId = p.id;
      await d.payout.update({ where: { id: p.id }, data: { amountCents: { increment: c.amountCents } } });
    }
  }
  await d.commission.updateMany({
    where: { id: c.id, status: "reversed" },
    data: { status, payoutId, clawback: false, clawbackPayoutId: null, reversedReason: null, reversedAt: null },
  });
  return "reinstated" as const;
}

/** Hold over: pending -> available. Returns the released rows (for the "available" email). */
export async function releaseDue(now = new Date(), db?: LedgerDb) {
  const d = await getDb(db);
  const due = await d.commission.findMany({
    where: { status: "pending", availableAt: { lte: now } },
    select: { id: true, referrerId: true, amountCents: true },
    take: 1000,
  });
  if (!due.length) return [];
  await d.commission.updateMany({ where: { id: { in: due.map((r) => r.id) }, status: "pending" }, data: { status: "available" } });
  return due;
}

/** Cron hook: release, then email each referrer once with the newly available total. */
export async function releaseHeldCommissions(now = new Date()): Promise<number> {
  const due = await releaseDue(now);
  if (!due.length) return 0;
  const totals = new Map<string, number>();
  for (const r of due) totals.set(r.referrerId, (totals.get(r.referrerId) ?? 0) + r.amountCents);
  const { notifyAvailable } = await import("./notify");
  for (const [userId, cents] of totals) await notifyAvailable(userId, cents);
  return due.length;
}

export type Balances = { pending: number; available: number; requested: number; paid: number; reversed: number; owed: number; withdrawable: number };

/** Sums by status. owed = paid-then-reversed amounts not yet deducted from a payout. */
export function balances(rows: { status: string; amountCents: number; clawback: boolean; clawbackPayoutId: string | null; currency: string }[]): Balances {
  const b: Balances = { pending: 0, available: 0, requested: 0, paid: 0, reversed: 0, owed: 0, withdrawable: 0 };
  for (const r of rows) {
    if (r.currency !== REFERRAL.currency) continue;
    if (r.status in b) b[r.status as keyof Balances] += r.amountCents;
    if (r.status === "reversed" && r.clawback && !r.clawbackPayoutId) b.owed += r.amountCents;
  }
  b.withdrawable = Math.max(0, b.available - b.owed);
  return b;
}
