import { prisma } from "@/lib/prisma";
import { balances, type Balances } from "@/lib/referrals/ledger";
import { breakdown } from "@/lib/referrals/breakdown";

export type ReferrerTotals = Balances & { earned: number; paidOut: number; payouts: number; mismatched: string[] };

/**
 * Per-referrer ledger totals plus a reconciliation: every payout's linked commissions minus deductions
 * must equal its stored amount, and the money marked paid must equal what the paid payouts say.
 */
export async function referrerTotals(ids: string[]): Promise<Map<string, ReferrerTotals>> {
  const out = new Map<string, ReferrerTotals>();
  if (!ids.length) return out;
  const [rows, payouts] = await Promise.all([
    prisma.commission.findMany({
      where: { referrerId: { in: ids } },
      select: { id: true, referrerId: true, status: true, amountCents: true, baseCents: true, clawback: true, payoutId: true, clawbackPayoutId: true, currency: true },
    }),
    prisma.payout.findMany({ where: { userId: { in: ids } }, select: { id: true, userId: true, status: true, amountCents: true } }),
  ]);
  for (const id of ids) {
    const mine = rows.filter((r) => r.referrerId === id);
    const b = balances(mine);
    const ps = payouts.filter((p) => p.userId === id);
    // Rejected payouts released their commissions, so only open and paid ones must still add up.
    const mismatched = ps.filter((p) => p.status !== "rejected" && !breakdown(p.id, p.amountCents, mine).ok).map((p) => p.id);
    out.set(id, {
      ...b,
      earned: mine.filter((r) => r.status !== "reversed" || r.clawback).reduce((s, r) => s + r.amountCents, 0),
      paidOut: ps.filter((p) => p.status === "paid").reduce((s, p) => s + p.amountCents, 0),
      payouts: ps.length,
      mismatched,
    });
  }
  return out;
}
