/**
 * Standard Webhooks signature check for Dodo Payments (see docs.dodopayments.com →
 * Developer Resources → Webhooks → Verifying Signatures). Pure node:crypto, unit-tested in
 * tests/dodo-webhook.test.ts against the Standard Webhooks reference vector.
 *
 * signed content = `${webhook-id}.${webhook-timestamp}.${raw body}`
 * key            = base64-decode(secret without the "whsec_" prefix)
 * header         = space-separated "v1,<base64 HMAC-SHA256>" entries; any match passes.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** Replay window, same as the Standard Webhooks libraries. */
export const WEBHOOK_TOLERANCE_SEC = 5 * 60;

export type WebhookHeaders = {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
};

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "missing_headers" | "bad_timestamp" | "too_old" | "bad_signature" };

function signingKey(secret: string): Buffer {
  const raw = secret.trim().replace(/^whsec_/, "");
  return Buffer.from(raw, "base64");
}

export function signPayload(secret: string, id: string, timestamp: number, body: string): string {
  const mac = createHmac("sha256", signingKey(secret))
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  return `v1,${mac}`;
}

export function verifyWebhook(
  secret: string,
  headers: WebhookHeaders,
  body: string,
  nowSec = Math.floor(Date.now() / 1000),
): VerifyResult {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return { ok: false, reason: "missing_headers" };
  if (!/^\d+$/.test(timestamp)) return { ok: false, reason: "bad_timestamp" };
  const ts = Number(timestamp);
  if (Math.abs(nowSec - ts) > WEBHOOK_TOLERANCE_SEC) return { ok: false, reason: "too_old" };

  const expected = Buffer.from(signPayload(secret, id, ts, body).slice(3), "base64");
  for (const part of signature.split(" ")) {
    const [version, sig] = part.split(",", 2);
    if (version !== "v1" || !sig) continue;
    const given = Buffer.from(sig, "base64");
    if (given.length === expected.length && timingSafeEqual(given, expected)) return { ok: true };
  }
  return { ok: false, reason: "bad_signature" };
}
