import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { alertsWhere, commissionsWhere, messagesWhere, sitesWhere, usersWhere } from "../src/lib/admin/filters";
import { noAlertReason } from "../src/lib/admin/site-alert";

test("filters: paid users, down/monitored sites, available commissions", () => {
  assert.deepEqual(usersWhere({ plan: "paid" }), { plan: { in: ["pro", "business"] } });
  assert.deepEqual(usersWhere({ plan: "nope" }), {});
  assert.deepEqual(sitesWhere({ status: "down" }), { locked: false, status: { in: ["down", "error"] } });
  assert.deepEqual(sitesWhere({ status: "monitored" }), { locked: false });
  assert.deepEqual(commissionsWhere({ status: "available" }), { status: { in: ["available", "pending"] }, clawback: false });
  assert.deepEqual(messagesWhere({}), { handledAt: null });
  assert.deepEqual(messagesWhere({ state: "all" }), {});
  const a = alertsWhere({ sent: "yes", range: "7d" }, Date.UTC(2026, 9, 25, 12, 0, 30));
  assert.equal(a.sent, true);
  assert.equal((a.createdAt as { gte: Date }).gte.toISOString(), "2026-10-18T12:00:00.000Z");
});

test("overview links point at the filtered pages that use the same helpers", () => {
  const src = readFileSync("src/app/admin/page.tsx", "utf8");
  for (const href of ["/admin/users?plan=paid", "/admin/sites?status=monitored", "/admin/sites?status=down", "/admin/alerts?sent=yes&range=7d", "/admin/messages?state=all&range=7d", "/admin/referrals?status=available", "/admin/payouts?tab=requested"]) {
    assert.ok(src.includes(`"${href}"`), href);
  }
  assert.ok(!/href[=:] *"\/admin\/alerts"/.test(src), "no bare /admin/alerts link for site counts");
});

const site = (o: Partial<Parameters<typeof noAlertReason>[0]> = {}) => ({ status: "down", locked: false, alertDownAt: null, lastCheckedAt: new Date(), ...o });
const ok = { verified: true, alertDown: true };

test("no-alert reason", () => {
  assert.equal(noAlertReason(site({ status: "up" }), ok, []), null);
  assert.match(noAlertReason(site(), { verified: false, alertDown: true }, [])!, /verified/);
  assert.match(noAlertReason(site(), { verified: true, alertDown: false }, [])!, /turned off/);
  assert.match(noAlertReason(site(), ok, [])!, /next daily check or a Recheck/);
  assert.match(noAlertReason(site({ status: "error" }), ok, [])!, /next daily check/);
  const t = new Date();
  assert.equal(noAlertReason(site({ alertDownAt: t }), ok, [{ kind: "down", sent: true, createdAt: t }]), null);
  assert.match(noAlertReason(site({ alertDownAt: t }), ok, [{ kind: "down", sent: false, createdAt: t }])!, /didn't go out/);
  assert.match(noAlertReason(site({ locked: true }), ok, [])!, /locked/);
});
