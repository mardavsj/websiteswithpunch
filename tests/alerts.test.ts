/** Run with `npm test`. Alert planning (thresholds, dedupe keys) and signed unsubscribe tokens. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { expiryLevel, planAlerts, type AlertSite } from "../src/lib/alerts/plan";

process.env.UNSUBSCRIBE_SECRET = "test-unsubscribe-secret";
const DAY = 86_400_000;
const now = Date.parse("2026-10-09T00:30:00Z");
const on = { alertDown: true, alertSsl: true, alertDomain: true };
const site = (o: Partial<AlertSite> = {}): AlertSite => ({
  status: "up", alertDownAt: null, sslExpiresAt: null, sslDaysLeft: null, domainExpiresAt: null, domainDaysLeft: null, ...o,
});

test("expiry thresholds: 30 / 7 / 1 / expired", () => {
  assert.equal(expiryLevel(new Date(now + 40 * DAY), now), null);
  assert.equal(expiryLevel(new Date(now + 20 * DAY), now)?.level, "30");
  assert.equal(expiryLevel(new Date(now + 5 * DAY), now)?.level, "7");
  assert.equal(expiryLevel(new Date(now + 2 * 3600_000), now)?.level, "1");
  assert.equal(expiryLevel(new Date(now - DAY), now)?.level, "expired");
});

test("down once, then recovered once", () => {
  const checked = new Date(now);
  const down = planAlerts(site({ status: "down" }), on, checked, now);
  assert.deepEqual(down.map((a) => a.kind), ["down"]);
  // Still down next check: alertDownAt is set, so no second email.
  assert.equal(planAlerts(site({ status: "down", alertDownAt: checked }), on, new Date(now + DAY), now).length, 0);
  const up = planAlerts(site({ status: "up", alertDownAt: checked }), on, new Date(now + DAY), now);
  assert.deepEqual(up.map((a) => a.key), [`up:${checked.toISOString()}`]);
});

test("same threshold produces the same key (deduped by AlertLog unique)", () => {
  const s = site({ sslExpiresAt: new Date(now + 6 * DAY) });
  const a = planAlerts(s, on, new Date(now), now)[0].key;
  const b = planAlerts(s, on, new Date(now + 3600_000), now + 3600_000)[0].key;
  assert.equal(a, b);
  assert.match(a, /^ssl:7:/);
  // Renewed certificate = new expiry date = new key.
  assert.notEqual(planAlerts(site({ sslExpiresAt: new Date(now + 25 * DAY) }), on, new Date(now), now)[0].key, a);
});

test("untrusted cert alerts as invalid; prefs turn kinds off", () => {
  const s = site({ sslExpiresAt: new Date(now + 90 * DAY), sslInfo: { trusted: false }, status: "down" });
  assert.equal(planAlerts(s, on, new Date(now), now).find((a) => a.kind === "ssl")?.key.startsWith("ssl:invalid:"), true);
  assert.equal(planAlerts(s, { alertDown: false, alertSsl: false, alertDomain: true }, new Date(now), now).length, 0);
});

test("unsubscribe token round-trips and rejects tampering", async () => {
  const { unsubscribeToken, readUnsubscribeToken, unsubscribeHeaders, scopeOff } = await import("../src/lib/alerts/unsubscribe");
  const t = unsubscribeToken("user_1", "ssl");
  assert.deepEqual(readUnsubscribeToken(t), { userId: "user_1", scope: "ssl" });
  const [body, sig] = t.split(".");
  const forged = Buffer.from("user_2.all").toString("base64url");
  assert.equal(readUnsubscribeToken(`${forged}.${sig}`), null);
  assert.equal(readUnsubscribeToken(`${body}.${sig.slice(0, -1)}x`), null);
  assert.equal(readUnsubscribeToken("garbage"), null);
  const h = unsubscribeHeaders("user_1", "all");
  assert.match(h["List-Unsubscribe"], /^<https:\/\/.+\/api\/alerts\/unsubscribe\?t=/);
  assert.equal(h["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  assert.deepEqual(scopeOff("all"), { alertDown: false, alertSsl: false, alertDomain: false });
});
