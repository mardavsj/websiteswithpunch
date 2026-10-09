/** Run with `npm test`. Cheap checks for the Dodo webhook signature verification. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { signPayload, verifyWebhook } from "../src/lib/dodo-webhook-verify";

// Reference vector from the Standard Webhooks spec (also what the `standardwebhooks` package
// produces for these inputs).
const SECRET = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";
const ID = "msg_p5jXN8AQM9LWM0D4loKWxJek";
const TS = 1614265330;
const BODY = '{"test": 2432232314}';
const SIG = "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=";
const headers = { id: ID, timestamp: String(TS), signature: SIG };

test("signs the reference vector", () => {
  assert.equal(signPayload(SECRET, ID, TS, BODY), SIG);
});

test("accepts a valid signature", () => {
  assert.deepEqual(verifyWebhook(SECRET, headers, BODY, TS + 10), { ok: true });
});

test("accepts when one of several signatures matches (secret rotation)", () => {
  const signature = `v1,AAAA${SIG.slice(7)} ${SIG}`;
  assert.equal(verifyWebhook(SECRET, { ...headers, signature }, BODY, TS).ok, true);
});

test("rejects a tampered body", () => {
  const r = verifyWebhook(SECRET, headers, '{"test": 1}', TS);
  assert.deepEqual(r, { ok: false, reason: "bad_signature" });
});

test("rejects the wrong secret", () => {
  const other = "whsec_" + Buffer.from("not-the-secret").toString("base64");
  assert.equal(verifyWebhook(other, headers, BODY, TS).ok, false);
});

test("rejects old or future timestamps (replay window)", () => {
  assert.deepEqual(verifyWebhook(SECRET, headers, BODY, TS + 301), { ok: false, reason: "too_old" });
  assert.deepEqual(verifyWebhook(SECRET, headers, BODY, TS - 301), { ok: false, reason: "too_old" });
});

test("rejects missing headers and non-v1 schemes", () => {
  assert.equal(verifyWebhook(SECRET, { ...headers, id: null }, BODY, TS).ok, false);
  const v2 = { ...headers, signature: SIG.replace("v1,", "v2,") };
  assert.equal(verifyWebhook(SECRET, v2, BODY, TS).ok, false);
});
