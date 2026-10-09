/** Run with `npm test`. Finding the user's subscription when the stored ID is from the other Dodo mode. */
import { test } from "node:test";
import assert from "node:assert/strict";
import type DodoPayments from "dodopayments";
import type { User } from "@prisma/client";
import { paidSubscriptionsFor } from "../src/lib/dodo-relink";

process.env.DODO_PRODUCT_BUSINESS_ANNUAL = "pdt_biz_year";

const user = { id: "u1", email: "a@b.co", dodoCustomerId: "cus_test", dodoSubscriptionId: "sub_test" } as User;

function fakeDodo(byCustomer: Record<string, Array<{ subscription_id: string; product_id: string; status: string }>>) {
  return {
    customers: { list: async () => ({ items: [{ customer_id: "cus_live" }] }) },
    subscriptions: {
      list: async ({ customer_id, status }: { customer_id: string; status: string }) => {
        if (!(customer_id in byCustomer)) throw Object.assign(new Error("nf"), { status: 404 });
        return { items: byCustomer[customer_id].filter((s) => s.status === status) };
      },
    },
  } as unknown as DodoPayments;
}

test("finds the live subscription by email when the stored customer is from test mode", async () => {
  const subs = await paidSubscriptionsFor(
    fakeDodo({ cus_live: [{ subscription_id: "sub_live", product_id: "pdt_biz_year", status: "active" }] }),
    user,
  );
  assert.deepEqual(subs.map((s) => s.subscription_id), ["sub_live"]);
});

test("ignores products outside our catalog and ended subscriptions", async () => {
  const subs = await paidSubscriptionsFor(
    fakeDodo({
      cus_live: [
        { subscription_id: "sub_other", product_id: "pdt_unknown", status: "active" },
        { subscription_id: "sub_old", product_id: "pdt_biz_year", status: "cancelled" },
      ],
    }),
    user,
  );
  assert.equal(subs.length, 0);
});

test("customerIdFor swaps a test-mode customer for the live one found by email", async () => {
  const { customerIdFor } = await import("../src/lib/dodo-relink");
  const { prisma } = await import("../src/lib/prisma");
  const saved: unknown[] = [];
  const orig = prisma.user.update;
  (prisma.user as unknown as { update: unknown }).update = async (a: unknown) => (saved.push(a), {});
  try {
    const u = { ...user } as User;
    const dodo = {
      customers: {
        retrieve: async () => {
          throw Object.assign(new Error("nf"), { status: 404 });
        },
        list: async () => ({ items: [{ customer_id: "cus_live" }] }),
      },
    } as unknown as DodoPayments;
    assert.equal(await customerIdFor(dodo, u, false), "cus_live");
    assert.equal(u.dodoCustomerId, "cus_live");
    assert.equal(saved.length, 1);
  } finally {
    (prisma.user as unknown as { update: unknown }).update = orig;
  }
});
