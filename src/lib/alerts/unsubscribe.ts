import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/lib/site-config";

/** Alert types a user can switch off. "all" turns off every alert email. */
export const ALERT_SCOPES = ["down", "ssl", "domain", "all"] as const;
export type AlertScope = (typeof ALERT_SCOPES)[number];

function secret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("UNSUBSCRIBE_SECRET (or NEXTAUTH_SECRET) is not set");
  return s;
}

const sign = (payload: string) =>
  createHmac("sha256", `unsubscribe:${secret()}`).update(payload).digest("base64url").slice(0, 32);

/**
 * Signed, non-expiring token for one-click unsubscribe: base64url("userId.scope").signature.
 * It can only switch alerts off, so a leaked link can't do more than that.
 */
export function unsubscribeToken(userId: string, scope: AlertScope): string {
  const payload = Buffer.from(`${userId}.${scope}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readUnsubscribeToken(token: string | null | undefined): { userId: string; scope: AlertScope } | null {
  if (!token || token.length > 300) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const want = Buffer.from(sign(payload));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const [userId, scope] = Buffer.from(payload, "base64url").toString().split(".");
  if (!userId || !(ALERT_SCOPES as readonly string[]).includes(scope)) return null;
  return { userId, scope: scope as AlertScope };
}

/** Page link (shows a confirm button) and the RFC 8058 one-click POST endpoint. */
export function unsubscribeLinks(userId: string, scope: AlertScope) {
  const t = encodeURIComponent(unsubscribeToken(userId, scope));
  return {
    page: `${SITE_URL}/unsubscribe?t=${t}`,
    oneClick: `${SITE_URL}/api/alerts/unsubscribe?t=${t}`,
  };
}

export function unsubscribeHeaders(userId: string, scope: AlertScope): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeLinks(userId, scope).oneClick}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/** Prisma data that switches the scope off. */
export function scopeOff(scope: AlertScope) {
  if (scope === "down") return { alertDown: false };
  if (scope === "ssl") return { alertSsl: false };
  if (scope === "domain") return { alertDomain: false };
  return { alertDown: false, alertSsl: false, alertDomain: false };
}
