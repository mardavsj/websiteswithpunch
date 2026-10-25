/**
 * Real-Postgres payout tests. Skipped unless PAYOUT_DB_TEST=1, and they refuse to run against
 * anything but a localhost database (they create and delete their own test rows).
 *   PAYOUT_DB_TEST=1 npx tsx --test tests/payouts.db.test.ts
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

const url = process.env.DATABASE_URL ?? "";
const host = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
const run = process.env.PAYOUT_DB_TEST === "1" && ["localhost", "127.0.0.1"].includes(host);
const opts = { skip: run ? false : "set PAYOUT_DB_TEST=1 with a localhost DATABASE_URL" };

const TAG = `dbtest_${process.pid}`;
const uid = (s: string) => `${TAG}_${s}`;
type P = typeof import("../src/lib/prisma")["prisma"];
let prisma: P;
let srv: typeof import("../src/lib/referrals/server");
let ledger: typeof import("../src/lib/referrals/ledger");

async function referrer(name: string, commissions: number[]) {
  const id = uid(name);
  await prisma.user.create({ data: { id, email: `${id}@test.local`, password: "x", payoutMethod: "upi", payoutAddress: "test@upi" } });
  await prisma.user.create({ data: { id: `${id}_buyer`, email: `${id}_buyer@test.local`, password: "x" } });
  for (const [i, base] of commissions.entries()) {
    await ledger.recordCommission({ referrerId: id, referredUserId: `${id}_buyer`, paymentId: `${id}_pay${i}`, subscriptionId: "sub", currency: "USD", baseCents: base });
  }
  return id;
}

before(async () => {
  if (!run) return;
  prisma = (await import("../src/lib/prisma")).prisma;
  srv = await import("../src/lib/referrals/server");
  ledger = await import("../src/lib/referrals/ledger");
});

after(async () => {
  if (!run) return;
  await prisma.commission.deleteMany({ where: { referrerId: { startsWith: TAG } } });
  await prisma.payout.deleteMany({ where: { userId: { startsWith: TAG } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: TAG } } });
  await prisma.$disconnect();
});

test("rounding on real rows: $12 -> $2.40, $96 -> $19.20, $6 pack -> $1.20", opts, async () => {
  const id = await referrer("round", [1200, 9600, 600]);
  const rows = await prisma.commission.findMany({ where: { referrerId: id }, orderBy: { paymentId: "asc" } });
  assert.deepEqual(rows.map((r) => r.amountCents), [240, 1920, 120]);
});

test("two simultaneous withdrawals: exactly one payout, for the exact balance", opts, async () => {
  const id = await referrer("race", [1200, 9600]);
  const res = await Promise.allSettled([srv.requestPayout(id), srv.requestPayout(id), srv.requestPayout(id)]);
  const ok = res.filter((r) => r.status === "fulfilled");
  assert.equal(ok.length, 1);
  const payouts = await prisma.payout.findMany({ where: { userId: id } });
  assert.equal(payouts.length, 1);
  assert.equal(payouts[0].amountCents, 2160);
  assert.equal(payouts[0].requestedCents, 2160);
});

test("refund during an open request lowers the amount and flags it; breakdown still matches", opts, async () => {
  const id = await referrer("rev", [1200, 9600, 1200]);
  const p = await srv.requestPayout(id);
  assert.equal(p.amountCents, 2400);
  assert.equal(await ledger.reverseCommission(`${id}_pay0`, "refund"), "reversed");
  const after = await prisma.payout.findUniqueOrThrow({ where: { id: p.id } });
  assert.equal(after.amountCents, 2160);
  assert.equal(after.requestedCents, 2400);
  assert.ok(after.amountChangedAt);
  const { breakdown } = await import("../src/lib/referrals/breakdown");
  const rows = await prisma.commission.findMany({ where: { OR: [{ payoutId: p.id }, { clawbackPayoutId: p.id }] } });
  assert.equal(breakdown(p.id, after.amountCents, rows).ok, true);
  // Paying the stale amount is refused.
  await assert.rejects(srv.decidePayout(p.id, "admin@test.local", { action: "paid", reference: "REF1", expectedCents: 2400 }), /amount changed/i);
});

test("reject releases the commissions back to available", opts, async () => {
  const id = await referrer("rej", [1200, 9600]);
  const p = await srv.requestPayout(id);
  await srv.decidePayout(p.id, "admin@test.local", { action: "reject", reason: "testing reject" });
  const rows = await prisma.commission.findMany({ where: { referrerId: id } });
  assert.ok(rows.every((r) => r.status === "available" && r.payoutId === null));
  const again = await srv.requestPayout(id);
  assert.equal(again.amountCents, 2160);
});

test("mark paid is idempotent and stores reference + INR", opts, async () => {
  const id = await referrer("paid", [1200, 9600]);
  const p = await srv.requestPayout(id);
  const done = await srv.decidePayout(p.id, "admin@test.local", { action: "paid", reference: "UPI123", inrPaise: 181050, expectedCents: 2160 });
  assert.equal(done.status, "paid");
  assert.equal(done.paidInrPaise, 181050);
  await assert.rejects(srv.decidePayout(p.id, "admin@test.local", { action: "paid", reference: "UPI999" }), /already decided/);
  const b = ledger.balances(await prisma.commission.findMany({ where: { referrerId: id } }));
  assert.equal(b.available, 0);
  assert.equal(b.paid, 2160);
  assert.equal((await prisma.payout.findUniqueOrThrow({ where: { id: p.id } })).reference, "UPI123");
});
