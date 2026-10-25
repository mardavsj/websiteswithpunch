import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { REFERRAL } from "./config";
import { cleanCode, newReferralCode, selfReferralReason } from "./attribution";
import { balances, releaseDue } from "./ledger";

export async function audit(action: string, o: { actorId?: string | null; targetId?: string | null; meta?: Prisma.InputJsonValue; ip?: string | null }) {
  await prisma.auditLog
    .create({ data: { action, actorId: o.actorId ?? null, targetId: o.targetId ?? null, meta: o.meta, ip: o.ip ?? null } })
    .catch((e) => console.error("[audit] write failed", action, e));
}

/** ADMIN_EMAILS: comma separated allowlist. Empty = nobody is an admin. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

export async function ensureReferralCode(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (u?.referralCode) return u.referralCode;
  for (let i = 0; i < 5; i++) {
    const code = newReferralCode();
    const res = await prisma.user
      .updateMany({ where: { id: userId, referralCode: null }, data: { referralCode: code } })
      .catch((e) => ((e as { code?: string }).code === "P2002" ? null : Promise.reject(e)));
    if (res?.count) return code;
    if (res) break; // someone else set it in parallel
  }
  const again = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (!again?.referralCode) throw new Error("Could not create a referral code");
  return again.referralCode;
}

/** At signup: link the new user to the referrer (once; the referredById column is never overwritten). */
export async function attributeSignup(user: { id: string; email: string }, rawCode: unknown, ipHash: string | null) {
  const code = cleanCode(rawCode);
  if (!code) return null;
  const referrer = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true, email: true, signupIpHash: true } });
  if (!referrer || referrer.id === user.id) return null;
  const why = selfReferralReason(referrer, { email: user.email, ipHash });
  if (why) {
    await audit("referral.blocked", { targetId: user.id, meta: { referrerId: referrer.id, why } });
    return null;
  }
  const done = await prisma.user.updateMany({
    where: { id: user.id, referredById: null },
    data: { referredById: referrer.id, referredAt: new Date() },
  });
  return done.count ? referrer.id : null;
}

const SUMMARY_ROWS = { id: true, status: true, amountCents: true, baseCents: true, currency: true, clawback: true, clawbackPayoutId: true, availableAt: true, createdAt: true, reversedReason: true } as const;

export async function referralSummary(userId: string) {
  await releaseDue(new Date()).catch(() => undefined); // lazy release in case the cron hasn't run yet
  const code = await ensureReferralCode(userId);
  const [user, rows, signups, paying, payouts, open] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { referralClicks: true, payoutMethod: true, payoutAddress: true } }),
    prisma.commission.findMany({ where: { referrerId: userId }, orderBy: { createdAt: "desc" }, select: SUMMARY_ROWS, take: 500 }),
    prisma.user.count({ where: { referredById: userId } }),
    prisma.commission.groupBy({ by: ["referredUserId"], where: { referrerId: userId, status: { not: "reversed" } } }),
    prisma.payout.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.payout.findFirst({ where: { userId, status: "requested" }, select: { id: true } }),
  ]);
  return {
    code, clicks: user?.referralClicks ?? 0, signups, paying: paying.length,
    balances: balances(rows), rows, payouts, hasOpenRequest: Boolean(open),
    method: user?.payoutMethod ?? null, address: user?.payoutAddress ?? null,
  };
}

export class PayoutError extends Error {}

/** One open request per user; the balance read and the status moves happen in one serializable transaction. */
export async function requestPayout(userId: string) {
  return prisma.$transaction(
    async (tx) => {
      const u = await tx.user.findUnique({ where: { id: userId }, select: { payoutMethod: true, payoutAddress: true } });
      if (!u?.payoutMethod || !u.payoutAddress) throw new PayoutError("Save a payout method first.");
      if (await tx.payout.findFirst({ where: { userId, status: "requested" }, select: { id: true } })) {
        throw new PayoutError("You already have a payout request in review.");
      }
      const rows = await tx.commission.findMany({
        where: { referrerId: userId, currency: REFERRAL.currency, OR: [{ status: "available" }, { status: "reversed", clawback: true, clawbackPayoutId: null }] },
        select: { id: true, status: true, amountCents: true },
      });
      const avail = rows.filter((r) => r.status === "available");
      const owed = rows.filter((r) => r.status === "reversed");
      const net = avail.reduce((s, r) => s + r.amountCents, 0) - owed.reduce((s, r) => s + r.amountCents, 0);
      if (net < REFERRAL.minPayoutCents) throw new PayoutError("Your available balance is below the $20 minimum.");
      const payout = await tx.payout.create({ data: { userId, amountCents: net, method: u.payoutMethod, address: u.payoutAddress } });
      const moved = await tx.commission.updateMany({ where: { id: { in: avail.map((r) => r.id) }, status: "available" }, data: { status: "requested", payoutId: payout.id } });
      if (moved.count !== avail.length) throw new PayoutError("Your balance changed. Please try again.");
      if (owed.length) await tx.commission.updateMany({ where: { id: { in: owed.map((r) => r.id) } }, data: { clawbackPayoutId: payout.id } });
      return payout;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

/** Admin decision on a requested payout (guarded: only a "requested" payout can change). */
export async function decidePayout(id: string, adminEmail: string, d: { action: "paid"; reference: string } | { action: "reject"; reason: string }) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const res = await tx.payout.updateMany({
      where: { id, status: "requested" },
      data: d.action === "paid"
        ? { status: "paid", reference: d.reference, decidedBy: adminEmail, decidedAt: now }
        : { status: "rejected", reason: d.reason, decidedBy: adminEmail, decidedAt: now },
    });
    if (res.count === 0) throw new PayoutError("This request was already decided.");
    if (d.action === "paid") {
      await tx.commission.updateMany({ where: { payoutId: id, status: "requested" }, data: { status: "paid" } });
    } else {
      await tx.commission.updateMany({ where: { payoutId: id, status: "requested" }, data: { status: "available", payoutId: null } });
      await tx.commission.updateMany({ where: { clawbackPayoutId: id }, data: { clawbackPayoutId: null } });
    }
    return tx.payout.findUniqueOrThrow({ where: { id } });
  });
}
