/** Referral emails. Never thrown: a failed email must not undo a ledger write. Verified users only. */
import { prisma } from "@/lib/prisma";
import { isVerified } from "@/lib/email-verify";
import { sendEmail } from "@/lib/email/send";
import type { BuiltEmail } from "@/lib/email/templates";
import {
  commissionAvailableEmail, commissionEarnedEmail, payoutMethodChangedEmail, payoutPaidEmail, payoutRejectedEmail,
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

export const notifyEarned = (userId: string, cents: number, availableAt: Date) =>
  send(userId, commissionEarnedEmail(cents, availableAt), "ref:earned");
export const notifyAvailable = (userId: string, cents: number) =>
  send(userId, commissionAvailableEmail(cents), "ref:available");
export const notifyPaid = (userId: string, cents: number, method: string, reference: string) =>
  send(userId, payoutPaidEmail(cents, method, reference), "ref:paid");
export const notifyRejected = (userId: string, cents: number, reason: string) =>
  send(userId, payoutRejectedEmail(cents, reason), "ref:rejected");
export const notifyMethodChanged = (userId: string, method: string, masked: string) =>
  send(userId, payoutMethodChangedEmail(method, masked), "ref:method");
