/**
 * Green "new" badges: counting and mark-seen on a localhost DB (own rows only).
 *   PAYOUT_DB_TEST=1 npx tsx --test tests/seen.db.test.ts
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

const url = process.env.DATABASE_URL ?? "";
const host = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
const run = process.env.PAYOUT_DB_TEST === "1" && ["localhost", "127.0.0.1"].includes(host);
const opts = { skip: run ? false : "set PAYOUT_DB_TEST=1 with a localhost DATABASE_URL" };
const TAG = `seen_${process.pid}`;
const ADMIN = `${TAG}@admin.local`;
type P = typeof import("../src/lib/prisma")["prisma"];
let prisma: P;
let seen: typeof import("../src/lib/admin/seen");
let f: typeof import("../src/lib/admin/filters");

before(async () => {
  if (!run) return;
  prisma = (await import("../src/lib/prisma")).prisma;
  seen = await import("../src/lib/admin/seen");
  f = await import("../src/lib/admin/filters");
});
after(async () => {
  if (!run) return;
  await prisma.adminSeen.deleteMany({ where: { adminEmail: { startsWith: TAG } } });
  await prisma.contactMessage.deleteMany({ where: { email: { startsWith: TAG } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: TAG } } });
  await prisma.$disconnect();
});

const msg = (i: number, extra = {}) => prisma.contactMessage.create({ data: { email: `${TAG}${i}@t.local`, name: "x", topic: "general", message: "hi", ...extra } });

test("actionable keys count everything until first viewed, then only newer rows", opts, async () => {
  await msg(1, { createdAt: new Date("2026-01-01") }); // old but still open
  const open = await prisma.contactMessage.count({ where: f.messagesWhere({}) });
  assert.equal((await seen.newCounts(ADMIN, ["messages:open"]))["messages:open"], open);
  const v = await seen.viewSection(ADMIN, ["messages:open", "messages:all"], ["messages:open"]);
  assert.equal(v.refresh, true);
  assert.equal(v.since.getTime(), 0, "first visit highlights every open message");
  assert.equal(v.counts["messages:open"], 0);
  assert.equal((await seen.newCounts(ADMIN, ["messages:open"]))["messages:open"], 0);
  // Quick re-render (router.refresh) keeps the highlights and doesn't loop.
  const again = await seen.viewSection(ADMIN, ["messages:open"], ["messages:open"]);
  assert.equal(again.refresh, false);
  assert.equal(again.since.getTime(), 0);
  await new Promise((r) => setTimeout(r, 20));
  await msg(2);
  await msg(3, { handledAt: new Date() });
  const c = await seen.newCounts(ADMIN, ["messages:open", "messages:handled"]);
  assert.equal(c["messages:open"], 1);
  assert.ok(c["messages:handled"] >= 1);
});

test("non-actionable keys ignore rows from before launch; per-filter keys are separate", opts, async () => {
  const base = await seen.newCounts(ADMIN, ["users", "users:pro"]);
  await prisma.user.create({ data: { id: `${TAG}_old`, email: `${TAG}_old@t.local`, password: "x", createdAt: new Date("2026-01-01") } });
  await prisma.user.create({ data: { id: `${TAG}_pro`, email: `${TAG}_pro@t.local`, password: "x", plan: "pro" } });
  const c = await seen.newCounts(ADMIN, ["users", "users:pro"]);
  assert.equal(c.users, base.users + 1);
  assert.equal(c["users:pro"], base["users:pro"] + 1);
  await seen.markSeen(ADMIN, ["users:pro"]);
  const d = await seen.newCounts(ADMIN, ["users", "users:pro"]);
  assert.equal(d["users:pro"], 0);
  assert.equal(d.users, c.users, "viewing a filter doesn't clear the section");
  const other = await seen.newCounts(`${TAG}_2@admin.local`, ["users:pro"]);
  assert.equal(other["users:pro"], c["users:pro"], "seen state is per admin");
});

test("markSeen keeps the previous visit across a slow revisit", opts, async () => {
  const t0 = new Date(Date.now() - 3_600_000);
  await seen.markSeen(ADMIN, ["alerts"], t0);
  await seen.markSeen(ADMIN, ["alerts"]);
  const row = await prisma.adminSeen.findUniqueOrThrow({ where: { adminEmail_key: { adminEmail: ADMIN, key: "alerts" } } });
  assert.equal(row.prevAt?.getTime(), t0.getTime());
  assert.equal((await seen.dotSince(ADMIN, "alerts")).getTime(), t0.getTime());
});
