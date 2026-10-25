/** Referral emails. Never thrown: a failed email must not undo a ledger write. Verified users only. */
import { prisma } from "@/lib/prisma";
import { isVerified } from "@/lib/email-verify";
import { sendEmail } from "@/lib/email/send";
import type { BuiltEmail } from "@/lib/email/templates";
import {
  adminPayoutChangedEmail, adminPayoutRequestedEmail, commissionEarnedEmail, payoutMethodChangedEmail, payoutPaidEmail, payoutRejectedEmail,
} from "@/lib/email/referral";

async function send(userId: string, mail: BuiltEmail, tag: string) {
  try {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true, createdAt: true } });
    if (!u || !isVerified(u)) return;
    const r = await sendEmail({ to: u.email, ...mail, tag });
    if (!r.sent) console.warn(`[referral email] ${tag} not sent:`, r.reason);
  } catch (e) {
    console.error(`[referral email] ${tag} failed`, e);
  }
}

export const notifyEarned = (userId: string, cents: number) =>
  send(userId, commissionEarnedEmail(cents), "ref:earned");
export const notifyPaid = (userId: string, cents: number, method: string, reference: string) =>
  send(userId, payoutPaidEmail(cents, method, reference), "ref:paid");
export const notifyRejected = (userId: string, cents: number, reason: string) =>
  send(userId, payoutRejectedEmail(cents, reason), "ref:rejected");
export const notifyMethodChanged = (userId: string, method: string, masked: string) =>
  send(userId, payoutMethodChangedEmail(method, masked), "ref:method");

/** Every ADMIN_EMAILS address, one message each (so one bad address can't block the rest). */
async function toAdmins(mail: BuiltEmail, tag: string) {
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!list.length) console.warn(`[admin email] ${tag}: ADMIN_EMAILS is empty`);
  for (const to of list) {
    try {
      const r = await sendEmail({ to, ...mail, tag });
      if (!r.sent) console.warn(`[admin email] ${tag} to ${to} not sent:`, r.reason);
    } catch (e) {
      console.error(`[admin email] ${tag} failed`, e);
    }
  }
}

async function payoutForEmail(id: string) {
  const p = await prisma.payout.findUnique({ where: { id }, include: { user: { select: { email: true } } } });
  return p && { id: p.id, email: p.user.email, amountCents: p.amountCents, method: p.method, address: p.address, requestedCents: p.requestedCents, status: p.status };
}

export async function notifyAdminsRequested(payoutId: string) {
  const p = await payoutForEmail(payoutId).catch(() => null);
  if (p) await toAdmins(adminPayoutRequestedEmail(p), "admin:payout");
}

/** After a refund/dispute touched a commission: email admins if it sits in an open request. */
export async function notifyAdminsIfOpenPayoutChanged(paymentId: string) {
  try {
    const c = await prisma.commission.findUnique({ where: { paymentId }, select: { payoutId: true } });
    const p = c?.payoutId ? await payoutForEmail(c.payoutId) : null;
    if (!p || p.status !== "requested") return;
    await toAdmins(adminPayoutChangedEmail({ ...p, wasCents: p.requestedCents ?? p.amountCents }), "admin:payout-changed");
  } catch (e) {
    console.error("[admin email] payout-changed failed", e);
  }
}
