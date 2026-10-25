/**
 * Overview counts must equal the row counts of the pages they link to. Seeds its own rows on a
 * localhost DB only, then compares overviewStats() with each linked page's where-builder.
 *   PAYOUT_DB_TEST=1 npx tsx --test tests/admin-counts.db.test.ts
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

const url = process.env.DATABASE_URL ?? "";
const host = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
const run = process.env.PAYOUT_DB_TEST === "1" && ["localhost", "127.0.0.1"].includes(host);
const opts = { skip: run ? false : "set PAYOUT_DB_TEST=1 with a localhost DATABASE_URL" };
const TAG = `cnt_${process.pid}`;
type P = typeof import("../src/lib/prisma")["prisma"];
let prisma: P;
let f: typeof import("../src/lib/admin/filters");
let ov: typeof import("../src/lib/admin/overview");

before(async () => {
  if (!run) return;
  prisma = (await import("../src/lib/prisma")).prisma;
  f = await import("../src/lib/admin/filters");
  ov = await import("../src/lib/admin/overview");
});
after(async () => {
  if (!run) return;
  await prisma.contactMessage.deleteMany({ where: { email: { startsWith: TAG } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: TAG } } });
  await prisma.$disconnect();
});

test("overview counts equal linked-page counts (with seeded data)", opts, async () => {
  const soon = new Date(Date.now() + 5 * 86_400_000);
  for (const [i, plan] of ["free", "pro", "business"].entries()) {
    const id = `${TAG}_${i}`;
    await prisma.user.create({ data: { id, email: `${id}@test.local`, password: "x", plan } });
    await prisma.site.createMany({ data: [
      { userId: id, name: "up", url: `https://${id}-a.test`, status: "up", sslExpiresAt: soon, sslDaysLeft: 5 },
      { userId: id, name: "down", url: `https://${id}-b.test`, status: "down", domainExpiresAt: soon, domainDaysLeft: 5 },
      { userId: id, name: "err", url: `https://${id}-c.test`, status: "error" },
      { userId: id, name: "locked", url: `https://${id}-d.test`, status: "down", locked: true },
    ] });
    const s = await prisma.site.findFirstOrThrow({ where: { userId: id, name: "down" } });
    await prisma.alertLog.createMany({ data: [{ userId: id, siteId: s.id, key: "down:1", kind: "down", sent: true }, { userId: id, siteId: s.id, key: "down:2", kind: "down", sent: false }] });
    await prisma.contactMessage.createMany({ data: [{ email: `${TAG}${i}@t.local`, name: "x", topic: "general", message: "hi" }, { email: `${TAG}${i}b@t.local`, name: "x", topic: "general", message: "hi", handledAt: new Date() }] });
  }
  const now = Date.now();
  const s = await ov.overviewStats(now);
  const c = {
    users: await prisma.user.count({ where: f.usersWhere({}) }),
    paying: await prisma.user.count({ where: f.usersWhere({ plan: "paid" }) }),
    sites: await prisma.site.count({ where: f.sitesWhere({ status: "monitored" }, now) }),
    down: await prisma.site.count({ where: f.sitesWhere({ status: "down" }, now) }),
    ssl: await prisma.site.count({ where: f.sitesWhere({ status: "ssl" }, now) }),
    domain: await prisma.site.count({ where: f.sitesWhere({ status: "domain" }, now) }),
    alerts: await prisma.alertLog.count({ where: f.alertsWhere({ sent: "yes", range: "7d" }, now) }),
    messages: await prisma.contactMessage.count({ where: f.messagesWhere({ state: "all", range: "7d" }, now) }),
    unread: await prisma.contactMessage.count({ where: f.messagesWhere({}) }),
    payouts: await prisma.payout.count({ where: f.payoutsWhere({ tab: "requested" }) }),
    available: await prisma.commission.count({ where: f.commissionsWhere({ status: "available" }) }),
  };
  const got = s as unknown as Record<string, unknown>;
  assert.equal(got.users, c.users);
  assert.equal((got.pro as number) + (got.business as number), c.paying);
  assert.equal(got.openPayouts, c.payouts);
  assert.equal(got.sites, c.sites);
  assert.equal(got.down, c.down);
  assert.equal(got.ssl, c.ssl);
  assert.equal(got.domain, c.domain);
  assert.equal(got.alerts, c.alerts);
  assert.equal(got.messages, c.messages);
  assert.equal(got.unread, c.unread);
  assert.equal(got.availableCount, c.available);
  assert.ok(c.down >= 6 && c.sites - c.down >= 3 && c.alerts >= 3, "seeded rows counted");
  console.log("overview:", JSON.stringify(c));
});
