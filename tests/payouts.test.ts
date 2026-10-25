/** Run with `npm test`. Payout breakdown maths, INR parsing, rounding of the 20% commission. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { breakdown, rupeesToPaise, type Line } from "../src/lib/referrals/breakdown";
import { commissionAmount } from "../src/lib/referrals/ledger";

const L = (id: string, amountCents: number, o: Partial<Line> = {}): Line => ({ id, status: "requested", amountCents, baseCents: amountCents * 5, clawback: false, payoutId: "P", clawbackPayoutId: null, ...o });

test("20% rounding: $12 -> $2.40, $96 -> $19.20, $6 pack -> $1.20, odd cents floor", () => {
  assert.equal(commissionAmount(1200), 240);
  assert.equal(commissionAmount(9600), 1920);
  assert.equal(commissionAmount(600), 120);
  assert.equal(commissionAmount(999), 199); // 199.8 floors, never over-pays
  assert.equal(commissionAmount(1200) + commissionAmount(9600), 2160);
});

test("breakdown: two commissions add up to the payout exactly", () => {
  const b = breakdown("P", 2160, [L("a", 240), L("b", 1920)]);
  assert.equal(b.total, 2160);
  assert.equal(b.ok, true);
  assert.equal(b.included.length, 2);
});

test("breakdown: a commission reversed before payment is shown as removed, not counted", () => {
  const b = breakdown("P", 1920, [L("a", 240, { status: "reversed" }), L("b", 1920)]);
  assert.deepEqual(b.removed.map((r) => r.id), ["a"]);
  assert.equal(b.total, 1920);
  assert.equal(b.ok, true);
});

test("breakdown: earlier paid-then-refunded commission is deducted", () => {
  const rows = [L("a", 2400), L("old", 240, { status: "reversed", clawback: true, payoutId: "OLD", clawbackPayoutId: "P" })];
  const b = breakdown("P", 2160, rows);
  assert.equal(b.deducted, 240);
  assert.equal(b.total, 2160);
  assert.equal(b.ok, true);
});

test("breakdown: a paid commission refunded later stays in its own payout (it was paid)", () => {
  const b = breakdown("OLD", 240, [L("old", 240, { status: "reversed", clawback: true, payoutId: "OLD", clawbackPayoutId: "P" })]);
  assert.equal(b.ok, true);
});

test("breakdown: mismatch is flagged", () => {
  assert.equal(breakdown("P", 2500, [L("a", 240), L("b", 1920)]).ok, false);
  assert.equal(breakdown("P", 100, []).ok, false);
});

test("rupeesToPaise: exact, no float drift", () => {
  assert.equal(rupeesToPaise("1810.5"), 181050);
  assert.equal(rupeesToPaise("1,999.99"), 199999);
  assert.equal(rupeesToPaise("0.29"), 29);
  assert.equal(rupeesToPaise("2000"), 200000);
  for (const bad of ["", "abc", "1.234", "-5", "0", "1e3", null]) assert.equal(rupeesToPaise(bad), null, String(bad));
});
