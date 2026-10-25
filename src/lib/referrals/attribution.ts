/** Referral codes, payout-address validation and the basic self-referral checks (pure parts). */
import { createHash, randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
export const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;

export function newReferralCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

export function cleanCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const c = raw.trim().toUpperCase();
  return CODE_RE.test(c) ? c : null;
}

/** Same inbox check: lowercases, drops +tags, and Gmail dots (a.b+x@gmail.com = ab@gmail.com). */
export function normalizeEmail(email: string): string {
  const [local = "", domain = ""] = email.trim().toLowerCase().split("@");
  let l = local.split("+")[0];
  const d = domain === "googlemail.com" ? "gmail.com" : domain;
  if (d === "gmail.com") l = l.replace(/\./g, "");
  return `${l}@${d}`;
}

/** Salted hash so raw IPs are never stored. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(`wwp-ip:${process.env.NEXTAUTH_SECRET || ""}:${ip}`).digest("hex").slice(0, 32);
}

/** Why a referral must not be attributed, or null when it's fine. */
export function selfReferralReason(
  referrer: { email: string; signupIpHash: string | null },
  signup: { email: string; ipHash: string | null },
): string | null {
  if (normalizeEmail(referrer.email) === normalizeEmail(signup.email)) return "same-email";
  if (referrer.signupIpHash && signup.ipHash && referrer.signupIpHash === signup.ipHash) return "same-network";
  return null;
}

export type PayoutMethod = "paypal" | "upi";
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const UPI_RE = /^[a-z0-9][a-z0-9._-]{1,255}@[a-z][a-z0-9]{1,63}$/i;

export function validatePayout(method: unknown, address: unknown): { method: PayoutMethod; address: string } | { error: string } {
  const a = typeof address === "string" ? address.trim() : "";
  if (method === "paypal") {
    return EMAIL_RE.test(a) && a.length <= 254 ? { method, address: a.toLowerCase() } : { error: "Enter the email address of your PayPal account." };
  }
  if (method === "upi") {
    return UPI_RE.test(a) ? { method, address: a.toLowerCase() } : { error: "Enter a valid UPI ID, like name@bank." };
  }
  return { error: "Choose PayPal or UPI." };
}

export function maskAddress(a: string): string {
  const [l, d] = a.split("@");
  if (!d) return a.slice(0, 2) + "•••";
  return `${l.slice(0, 2)}${"•".repeat(Math.max(2, Math.min(6, l.length - 2)))}@${d}`;
}
