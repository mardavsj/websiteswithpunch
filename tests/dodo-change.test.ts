/** Run with `npm test`. Change Plan bodies: Dodo rejects bookings unless they use full_immediately. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { changeBody } from "../src/lib/dodo-change";
import { nextPaymentText } from "../src/lib/next-payment";
import { BILLING_SETUP_ERROR, dodoUserMessage } from "../src/lib/dodo";
import type { SubscriptionState } from "../src/lib/dodo-subscription";

process.env.DODO_PRODUCT_PRO_MONTHLY = "pdt_pro_m";
process.env.DODO_PRODUCT_BUSINESS_MONTHLY = "pdt_biz_m";
process.env.DODO_ADDON_PACK_PRO_MONTHLY = "adn_pro_m";

const st = { plan: "business", interval: "month", packs: 0, status: "active", cancelAtPeriodEnd: false, scheduled: null, periodEnd: null } as unknown as SubscriptionState;

test("renewal bookings use next_billing_date + full_immediately (Dodo's only allowed pair)", () => {
  const r = changeBody({ plan: "pro", interval: "month", packs: 1 }, "renewal", st);
  assert.ok(r.ok);
  assert.equal(r.body.effective_at, "next_billing_date");
  assert.equal(r.body.proration_billing_mode, "full_immediately");
  assert.equal(r.body.on_payment_failure, undefined);
  assert.deepEqual(r.body.addons, [{ addon_id: "adn_pro_m", quantity: 1 }]);
});

test("charge-now changes stay prorated, immediate, prevent_change", () => {
  const r = changeBody({ plan: "business", interval: "month", packs: 0 }, "now", st);
  assert.ok(r.ok);
  assert.equal(r.body.effective_at, "immediately");
  assert.equal(r.body.proration_billing_mode, "prorated_immediately");
  assert.equal(r.body.on_payment_failure, "prevent_change");
  assert.deepEqual(r.body.addons, []);
});

test("a booking replaces an existing scheduled change", () => {
  const withSched = { ...st, scheduled: { plan: "business", interval: "month", packs: 0, at: null } } as unknown as SubscriptionState;
  const r = changeBody({ plan: "pro", interval: "month", packs: 0 }, "renewal", withSched);
  assert.ok(r.ok && r.body.cancel_scheduled_change_plan === true);
});


test("next payment: same total vs booked change vs cancel", () => {
  const base = { nextPaymentDateFormatted: "Oct 9, 2027", nextTotalFormatted: "$510/year", nextAmountFormatted: "$510" };
  assert.equal(nextPaymentText({ ...base, nextChanges: false }), "Next payment: $510 on Oct 9, 2027");
  assert.equal(
    nextPaymentText({ ...base, nextTotalFormatted: "$420/year", nextAmountFormatted: "$420", nextChanges: true }),
    "From Oct 9, 2027: $420/year",
  );
  assert.equal(nextPaymentText({ ...base, cancelAtPeriodEnd: true }), null);
  assert.equal(nextPaymentText(null), null);
});

test("Dodo 'not found' errors never reach the user raw", () => {
  const raw = { status: 404, error: { message: "The requested resource could not be found. ID doesn't exist or has been deleted." } };
  assert.equal(dodoUserMessage(raw, "fallback"), BILLING_SETUP_ERROR);
  assert.equal(dodoUserMessage({ status: 400, error: { message: "ID doesn't exist or has been deleted" } }, "f"), BILLING_SETUP_ERROR);
  assert.equal(dodoUserMessage({ status: 409, error: { message: "A plan change is already pending" } }, "f"), "A plan change is already pending");
  assert.equal(dodoUserMessage(new Error("boom"), "fallback"), "fallback");
});
