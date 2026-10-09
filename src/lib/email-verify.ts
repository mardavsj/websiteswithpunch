/**
 * Email verification with a 6-digit code. Codes come from crypto.randomInt, are stored as an
 * HMAC (keyed with NEXTAUTH_SECRET, so a leaked table can't be brute-forced offline), expire
 * after 10 minutes, work once, and allow 5 wrong tries before a new code is needed.
 */
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";
import { HOUR, rateLimit } from "./rate-limit";
import { sendVerificationCode } from "./auth-email";

/**
 * Accounts created before this moment (14:00 IST, 4 Oct 2026 — before this feature existed
 * anywhere) count as verified, so existing users are never asked for a code.
 */
export const VERIFICATION_STARTED_AT = new Date("2026-10-04T08:30:00.000Z");
export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SEC = 60;
const CODE_RE = /^\d{6}$/;

export function isVerified(u: { emailVerified: Date | null; createdAt: Date }): boolean {
  return Boolean(u.emailVerified) || u.createdAt.getTime() < VERIFICATION_STARTED_AT.getTime();
}

function hashCode(userId: string, code: string): string {
  return createHmac("sha256", process.env.NEXTAUTH_SECRET || "dev-only-secret").update(`${userId}:${code}`).digest("hex");
}

/** "alex@example.com" → "a***@example.com" */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
}

/** Seconds until another code may be sent (0 = now). */
export async function resendCooldown(userId: string, now = Date.now()): Promise<number> {
  const last = await prisma.emailVerificationCode.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!last) return 0;
  return Math.max(0, Math.ceil(RESEND_COOLDOWN_SEC - (now - last.createdAt.getTime()) / 1000));
}

export type IssueResult =
  | { ok: true; sent: boolean; cooldown: number }
  | { ok: false; reason: "cooldown" | "rate"; retryAfterSec: number };

/** Create and email a fresh code (older codes stop working). Rate-limited per email and IP. */
export async function issueCode(
  user: { id: string; email: string; name: string | null },
  ip: string,
): Promise<IssueResult> {
  const wait = await resendCooldown(user.id);
  if (wait > 0) return { ok: false, reason: "cooldown", retryAfterSec: wait };
  const limited = await rateLimit([
    { key: `verify-send:email:${user.email}`, limit: 5, windowMs: HOUR },
    { key: `verify-send:ip:${ip}`, limit: 10, windowMs: HOUR },
  ]);
  if (!limited.ok) return { ok: false, reason: "rate", retryAfterSec: limited.retryAfterSec };

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.$transaction([
    prisma.emailVerificationCode.deleteMany({ where: { userId: user.id } }),
    prisma.emailVerificationCode.create({
      data: { userId: user.id, codeHash: hashCode(user.id, code), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
    }),
  ]);
  const sent = await sendVerificationCode(user.email, code, user.name).catch((e) => ({ sent: false as const, reason: String(e) }));
  if (!sent.sent) console.warn("[verify] code email not sent:", sent.reason);
  return { ok: true, sent: sent.sent, cooldown: RESEND_COOLDOWN_SEC };
}

export type CheckResult =
  | { state: "ok" }
  | { state: "invalid"; attemptsLeft: number }
  | { state: "locked" | "expired" | "none" };

/** Check a submitted code; on success the user is marked verified (atomically, once). */
export async function checkCode(userId: string, raw: string, now = new Date()): Promise<CheckResult> {
  const code = raw.replace(/\D/g, "");
  const row = await prisma.emailVerificationCode.findFirst({
    where: { userId, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return { state: "none" };
  if (row.expiresAt.getTime() <= now.getTime()) return { state: "expired" };
  if (row.attempts >= MAX_ATTEMPTS) return { state: "locked" };

  const expected = Buffer.from(row.codeHash, "hex");
  const given = Buffer.from(hashCode(userId, CODE_RE.test(code) ? code : "x"), "hex");
  if (!CODE_RE.test(code) || !timingSafeEqual(expected, given)) {
    const bumped = await prisma.emailVerificationCode.updateMany({
      where: { id: row.id, usedAt: null, attempts: { lt: MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    const left = MAX_ATTEMPTS - row.attempts - 1;
    if (bumped.count === 0 || left <= 0) return { state: "locked" };
    return { state: "invalid", attemptsLeft: left };
  }

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.emailVerificationCode.updateMany({
      where: { id: row.id, usedAt: null, attempts: { lt: MAX_ATTEMPTS }, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return { state: "expired" as const };
    await tx.user.updateMany({ where: { id: userId, emailVerified: null }, data: { emailVerified: now } });
    return { state: "ok" as const };
  });
}

/** Cron: unverified accounts older than 48h with no sites and no Dodo customer, plus old codes. */
export async function pruneUnverified(now = Date.now()) {
  const cutoff = new Date(now - 48 * HOUR);
  const users = await prisma.user.deleteMany({
    where: {
      emailVerified: null,
      createdAt: { lt: cutoff, gte: VERIFICATION_STARTED_AT },
      dodoCustomerId: null,
      sites: { none: {} },
    },
  });
  const codes = await prisma.emailVerificationCode.deleteMany({
    where: { expiresAt: { lt: new Date(now - 24 * HOUR) } },
  });
  return { users: users.count, codes: codes.count };
}
