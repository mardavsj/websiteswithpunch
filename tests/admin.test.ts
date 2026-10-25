/** Run with `npm test`. Admin allowlist matching and middleware routing decisions. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { adminDecision, isAdminEmail } from "../src/lib/admin/access";

const LIST = " Boss@Example.com , ops@example.com,";

test("isAdminEmail: trimmed, case-insensitive, empty-safe", () => {
  assert.equal(isAdminEmail("boss@example.com", LIST), true);
  assert.equal(isAdminEmail("  OPS@EXAMPLE.COM ", LIST), true);
  assert.equal(isAdminEmail("other@example.com", LIST), false);
  assert.equal(isAdminEmail("", LIST), false);
  assert.equal(isAdminEmail(null, LIST), false);
  assert.equal(isAdminEmail("boss@example.com", ""), false);
  assert.equal(isAdminEmail("", ","), false);
});

test("admin area is 404 for guests and non-admins, open for admins", () => {
  for (const p of ["/admin", "/admin/users", "/api/admin/payouts/x"]) {
    assert.equal(adminDecision(p, "GET", false, false), "not-found");
    assert.equal(adminDecision(p, "GET", true, false), "not-found");
    assert.equal(adminDecision(p, "POST", true, true), "next");
  }
  assert.equal(adminDecision("/administrator", "GET", true, false), "next");
});

test("admins are sent from customer pages to /admin", () => {
  for (const p of ["/", "/dashboard", "/dashboard/sites/1", "/plan", "/referrals", "/checkout/pro", "/onboarding"]) {
    assert.equal(adminDecision(p, "GET", true, true), "to-admin", p);
    assert.equal(adminDecision(p, "GET", true, false), "next", p);
  }
  assert.equal(adminDecision("/contact", "GET", true, true), "next");
  assert.equal(adminDecision("/planning", "GET", true, true), "next");
});

test("admins cannot write to customer APIs", () => {
  assert.equal(adminDecision("/api/sites", "POST", true, true), "forbidden");
  assert.equal(adminDecision("/api/sites/1", "DELETE", true, true), "forbidden");
  assert.equal(adminDecision("/api/billing/checkout", "POST", true, true), "forbidden");
  assert.equal(adminDecision("/api/referrals/withdraw", "POST", true, true), "forbidden");
  assert.equal(adminDecision("/api/sites", "GET", true, true), "next");
  assert.equal(adminDecision("/api/sites", "POST", true, false), "next");
  assert.equal(adminDecision("/api/contact", "POST", true, true), "next");
});
