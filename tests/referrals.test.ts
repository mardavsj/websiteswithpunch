/** Run with `npm test`. Referral commission maths, idempotent ledger, reversal, hold release. */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  balances, commissionAmount, commissionBase, recordCommission, reinstateCommission, releaseDue, reverseCommission, type LedgerDb,
} from "../src/lib/referrals/ledger";
import { paymentBasis } from "../src/lib/referrals/dodo";
import { cleanCode, maskAddress, newReferralCode, normalizeEmail, selfReferralReason, validatePayout } from "../src/lib/referrals/attribution";

type Row = Record<string, any>;
const DAY = 86_400_000;

/** Tiny in-memory stand-in for the two Prisma models the ledger uses. */
function fakeDb() {
  const commissions: Row[] = [];
  const payouts: Row[] = [];
  let n = 0;
  const match = (r: Row, w: Row = {}) =>
    Object.entries(w).every(([k, v]) => {
      if (v && typeof v === "object" && !(v instanceof Date)) {
        if ("in" in v) return v.in.includes(r[k]);
        if ("lte" in v) return r[k] <= v.lte;
        if ("not" in v) return r[k] !== v.not;
      }
      return r[k] === v;
    });
  const model = (rows: Row[], unique?: string) => ({
    create: async ({ data }: { data: Row }) => {
      if (unique && rows.some((r) => r[unique] === data[unique])) throw Object.assign(new Error("dup"), { code: "P2002" });
      const row = { id: `id${++n}`, payoutId: null, clawback: false, clawbackPayoutId: null, reversedReason: null, reversedAt: null, createdAt: new Date(), ...data };
      rows.push(row);
      return row;
    },
    // Copies, like Prisma: later writes must not change rows the caller already read.
    findUnique: async ({ where }: { where: Row }) => { const r = rows.find((x) => match(x, where)); return r ? { ...r } : null; },
    findMany: async ({ where }: { where: Row }) => rows.filter((r) => match(r, where)).map((r) => ({ ...r })),
    updateMany: async ({ where, data }: { where: Row; data: Row }) => {
      const hit = rows.filter((r) => match(r, where));
      hit.forEach((r) => Object.assign(r, data));
      return { count: hit.length };
    },
    update: async ({ where, data }: { where: Row; data: Row }) => {
      const r = rows.find((x) => match(x, where))!;
      for (const [k, v] of Object.entries(data)) {
        r[k] = v && typeof v === "object" && "decrement" in v ? r[k] - v.decrement : v && typeof v === "object" && "increment" in v ? r[k] + v.increment : v;
      }
      return r;
    },
  });
  const db = { commission: model(commissions, "paymentId"), payout: model(payouts) } as unknown as LedgerDb;
  return { db, commissions, payouts };
}

const pay = { paymentId: "pay_1", referrerId: "ref", referredUserId: "buyer", currency: "USD", baseCents: 1200, subscriptionId: "sub_1" };

test("20% of the pre-tax amount, rounded down to the cent", () => {
  assert.equal(commissionBase({ total_amount: 1416, tax: 216 }), 1200);
  assert.equal(commissionAmount(1200), 240);
  assert.equal(commissionAmount(999), 199);
  assert.deepEqual(paymentBasis({ payment_id: "p", status: "succeeded", total_amount: 2360, tax: 360, currency: "usd", subscription_id: "s" }), { baseCents: 2000, currency: "USD" });
  assert.equal(paymentBasis({ payment_id: "p", status: "failed", total_amount: 2360, currency: "USD", subscription_id: "s" }), null);
  assert.equal(paymentBasis({ payment_id: "p", total_amount: 2360, currency: "INR", subscription_id: "s" }), null);
  assert.equal(paymentBasis({ payment_id: "p", total_amount: 2360, currency: "USD" }), null);
});

test("one commission per payment id (webhook replay is a no-op)", async () => {
  const { db, commissions } = fakeDb();
  const now = new Date("2026-10-09T00:00:00Z");
  const a = await recordCommission(pay, now, db);
  const b = await recordCommission(pay, now, db);
  assert.equal(a.created, true);
  assert.equal(b.created, false);
  assert.equal(commissions.length, 1);
  assert.equal(commissions[0].amountCents, 240);
  assert.equal(commissions[0].status, "pending");
  assert.equal(commissions[0].availableAt.getTime(), now.getTime() + 30 * DAY);
});

test("hold releases after 30 days, not before", async () => {
  const { db, commissions } = fakeDb();
  const now = new Date("2026-10-09T00:00:00Z");
  await recordCommission(pay, now, db);
  assert.equal((await releaseDue(new Date(now.getTime() + 29 * DAY), db)).length, 0);
  assert.equal(commissions[0].status, "pending");
  assert.equal((await releaseDue(new Date(now.getTime() + 30 * DAY), db)).length, 1);
  assert.equal(commissions[0].status, "available");
  assert.equal((await releaseDue(new Date(now.getTime() + 31 * DAY), db)).length, 0);
});

test("refund reverses once; refund after payout becomes a clawback", async () => {
  const { db, commissions } = fakeDb();
  await recordCommission(pay, new Date(), db);
  assert.equal(await reverseCommission("pay_1", "refund", new Date(), db), "reversed");
  assert.equal(await reverseCommission("pay_1", "refund", new Date(), db), "noop");
  assert.equal(commissions[0].clawback, false);
  assert.equal(await reverseCommission("pay_unknown", "refund", new Date(), db), "noop");

  await recordCommission({ ...pay, paymentId: "pay_2" }, new Date(), db);
  commissions[1].status = "paid";
  await reverseCommission("pay_2", "dispute", new Date(), db);
  assert.equal(commissions[1].clawback, true);
  const b = balances(commissions.map((c) => ({ ...c })) as never);
  assert.equal(b.owed, 240);
});

test("reversal inside an open payout request lowers that payout", async () => {
  const { db, commissions, payouts } = fakeDb();
  await recordCommission(pay, new Date(), db);
  const p = await db.payout.create({ data: { userId: "ref", amountCents: 240, method: "paypal", address: "a@b.co", status: "requested" } } as never);
  Object.assign(commissions[0], { status: "requested", payoutId: (p as Row).id });
  await reverseCommission("pay_1", "refund", new Date(), db);
  assert.equal(payouts[0].amountCents, 0);
});

test("won dispute reinstates; refunds stay reversed", async () => {
  const { db, commissions } = fakeDb();
  const now = new Date();
  await recordCommission(pay, now, db);
  await reverseCommission("pay_1", "dispute", now, db);
  assert.equal(await reinstateCommission("pay_1", now, db), "reinstated");
  assert.equal(commissions[0].status, "pending");
  await reverseCommission("pay_1", "refund", now, db);
  assert.equal(await reinstateCommission("pay_1", now, db), "noop");
  assert.equal(commissions[0].status, "reversed");
});

test("balances: withdrawable is available minus owed clawbacks", () => {
  const r = (status: string, amountCents: number, extra: Row = {}) => ({ status, amountCents, currency: "USD", clawback: false, clawbackPayoutId: null, ...extra });
  const b = balances([r("pending", 100), r("available", 3000), r("paid", 500), r("reversed", 400, { clawback: true }), r("available", 999, { currency: "EUR" })]);
  assert.deepEqual([b.pending, b.available, b.paid, b.owed, b.withdrawable], [100, 3000, 500, 400, 2600]);
});

test("self-referral and attribution checks", () => {
  assert.equal(normalizeEmail("Jo.Hn+promo@GoogleMail.com"), "john@gmail.com");
  assert.equal(normalizeEmail("a.b+x@company.com"), "a.b@company.com");
  assert.equal(selfReferralReason({ email: "john@gmail.com", signupIpHash: null }, { email: "j.o.h.n+2@gmail.com", ipHash: null }), "same-email");
  assert.equal(selfReferralReason({ email: "a@x.com", signupIpHash: "h1" }, { email: "b@y.com", ipHash: "h1" }), "same-network");
  assert.equal(selfReferralReason({ email: "a@x.com", signupIpHash: "h1" }, { email: "b@x.com", ipHash: "h2" }), null);
  const code = newReferralCode();
  assert.equal(cleanCode(code.toLowerCase()), code);
  assert.equal(cleanCode("../../etc"), null);
  assert.equal(cleanCode("ABCDEFG0"), null);
});

test("payout method validation and masking", () => {
  assert.deepEqual(validatePayout("paypal", " Me@Example.com "), { method: "paypal", address: "me@example.com" });
  assert.ok("error" in validatePayout("paypal", "not-an-email"));
  assert.deepEqual(validatePayout("upi", "mardav@okhdfcbank"), { method: "upi", address: "mardav@okhdfcbank" });
  assert.ok("error" in validatePayout("upi", "bad upi"));
  assert.ok("error" in validatePayout("bank", "x@y.z"));
  assert.equal(maskAddress("mardav@okicici"), "ma••••@okicici");
});
