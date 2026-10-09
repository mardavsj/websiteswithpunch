/** Run with `npm test`. The subscription → plan mapping that sync and self-heal rely on. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { subscriptionState } from "../src/lib/dodo-subscription";

process.env.DODO_PRODUCT_PRO_MONTHLY = "pdt_test_pro_m";
process.env.DODO_PRODUCT_BUSINESS_MONTHLY = "pdt_test_biz_m";

const base = {
  subscription_id: "sub_test",
  status: "active",
  addons: [],
  cancel_at_next_billing_date: false,
  payment_frequency_interval: "Month",
};

test("Business monthly product maps to business, 0 packs", () => {
  const st = subscriptionState({ ...base, product_id: "pdt_test_biz_m" } as never);
  assert.equal(st.plan, "business");
  assert.equal(st.interval, "month");
  assert.equal(st.packs, 0);
  assert.equal(st.status, "active");
});

test("Pro monthly product maps to pro", () => {
  assert.equal(subscriptionState({ ...base, product_id: "pdt_test_pro_m" } as never).plan, "pro");
});

test("an unknown product maps to no plan (sync ignores it, never downgrades)", () => {
  assert.equal(subscriptionState({ ...base, product_id: "pdt_other" } as never).plan, null);
});
