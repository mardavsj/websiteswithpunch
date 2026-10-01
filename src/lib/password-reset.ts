/**
 * Password reset tokens. The raw token only ever lives in the emailed link; the database keeps
 * its SHA-256 hash. Tokens expire after 1 hour and are single-use.
 */
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export type ResetTokenState = "valid" | "expired" | "used" | "invalid";

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** 32 random bytes, base64url: exactly 43 URL-safe characters. */
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/;

/** Issue a new link for a user. Older unused links for that user stop working. */
export async function createResetToken(userId: string, now = new Date()): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: {
        userId,
        OR: [{ usedAt: null }, { expiresAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }],
      },
    }),
    prisma.passwordResetToken.create({
      data: {
        tokenHash: hashResetToken(token),
        userId,
        expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS),
      },
    }),
  ]);
  return token;
}

export async function checkResetToken(token: string | null | undefined, now = new Date()) {
  if (!token || !TOKEN_SHAPE.test(token)) return { state: "invalid" as const };
  const tokenHash = hashResetToken(token);
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!row || !timingSafeEqual(Buffer.from(row.tokenHash), Buffer.from(tokenHash))) {
    return { state: "invalid" as const };
  }
  if (row.usedAt) return { state: "used" as const };
  if (row.expiresAt.getTime() <= now.getTime()) return { state: "expired" as const };
  return { state: "valid" as const, row };
}

/**
 * Set a new password with a valid token. The token is claimed atomically (so two concurrent
 * submits can't both succeed), and every other open link for the user is retired too.
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
  now = new Date(),
): Promise<Exclude<ResetTokenState, "valid"> | "ok"> {
  const found = await checkResetToken(token, now);
  if (found.state !== "valid") return found.state;
  const { row } = found;
  const password = await bcrypt.hash(newPassword, 12);
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: row.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return "used" as const;
    await tx.user.update({ where: { id: row.userId }, data: { password } });
    await tx.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null },
      data: { usedAt: now },
    });
    return "ok" as const;
  });
}
