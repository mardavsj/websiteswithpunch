import { test } from "node:test";
import assert from "node:assert/strict";
import { planBasis, type Kind } from "../src/lib/referrals/basis";
import { REFERRAL } from "../src/lib/referrals/config";

const ids: Record<string, Kind> = {
  pro_m: { kind: "plan", plan: "pro", interval: "month" },
  pack_pro_m: { kind: "pack", plan: "pro", interval: "month" },
  biz_y: { kind: "plan", plan: "business", interval: "year" },
};
const classify = (id: string) => ids[id] ?? null;
const commission = (c: number) => Math.floor((c * REFERRAL.rateBps) / 10_000);

test("Pro $12 + pack $6 -> commission on the $12 plan only ($2.40)", () => {
  const b = planBasis({ preTaxCents: 1800, totalCents: 1800, classify,
    items: [{ items_id: "pro_m", amount: 1200, tax: 0 }, { items_id: "pack_pro_m", amount: 600, tax: 0 }] });
  assert.deepEqual(b, { planCents: 1200, source: "line-items" });
  assert.equal(commission(b.planCents), 240);
});

test("tax-inclusive item amounts are reduced to pre-tax", () => {
  const b = planBasis({ preTaxCents: 1800, totalCents: 2124, classify,
    items: [{ items_id: "pro_m", amount: 1416, tax: 216 }, { items_id: "pack_pro_m", amount: 708, tax: 108 }] });
  assert.equal(b.planCents, 1200);
});

test("pack-only payment (pack added mid-cycle) -> 0", () => {
  const b = planBasis({ preTaxCents: 300, totalCents: 300, classify, items: [{ items_id: "pack_pro_m", amount: 300 }] });
  assert.equal(b.planCents, 0);
});

test("prorated upgrade uses the prorated plan line, capped at the pre-tax total", () => {
  const b = planBasis({ preTaxCents: 1500, totalCents: 1500, classify,
    items: [{ items_id: "biz_y", amount: 1500 }] });
  assert.equal(b.planCents, 1500);
  assert.equal(planBasis({ preTaxCents: 1000, totalCents: 1000, classify, items: [{ items_id: "biz_y", amount: 5000 }] }).planCents, 1000);
});

test("fallback: full cycle matches list price; anything else is unmatched (0)", () => {
  const sub = { plan: "pro" as const, interval: "month" as const, packs: 2 };
  assert.deepEqual(planBasis({ preTaxCents: 2400, totalCents: 2400, classify, sub }), { planCents: 1200, source: "list-price" });
  assert.deepEqual(planBasis({ preTaxCents: 1200, totalCents: 1200, classify, sub, items: [{ items_id: "?", amount: 1200 }] }), { planCents: 1200, source: "list-price" });
  assert.deepEqual(planBasis({ preTaxCents: 300, totalCents: 300, classify, sub }), { planCents: 0, source: "unmatched" });
  assert.equal(planBasis({ preTaxCents: 12000, totalCents: 12000, classify, sub: { plan: "pro", interval: "year", packs: 0 } }).planCents, 12000);
});
