/**
 * The stored dodoSubscriptionId can point at a subscription that doesn't exist in the current
 * Dodo mode: e.g. an account subscribed while production ran in test_mode, then the env moved
 * to live_mode. Dodo then answers 404 to every billing call. Here we look up the customer's
 * paid subscription in the current mode (by stored customer ID and by email) and, when there
 * is exactly one on our catalog, re-link the user to it. Nothing is charged or changed in Dodo.
 */
import type DodoPayments from "dodopayments";
import type { User } from "@prisma/client";
import { prisma } from "./prisma";
import { dodoEnvironment, isDodoNotFound } from "./dodo";
import { lookupCatalogId } from "./dodo-products";
import { syncSubscription } from "./dodo-sync";

async function customerIds(dodo: DodoPayments, user: User): Promise<string[]> {
  const ids = new Set<string>(user.dodoCustomerId ? [user.dodoCustomerId] : []);
  try {
    const page = await dodo.customers.list({ email: user.email, page_size: 10 });
    for (const c of page.items) ids.add(c.customer_id);
  } catch (e) {
    console.error("[dodo relink] customer lookup failed", e);
  }
  return [...ids];
}

/** Paid subscriptions on our products in the current Dodo mode for this user. */
export async function paidSubscriptionsFor(dodo: DodoPayments, user: User) {
  const subs: DodoPayments.SubscriptionListResponse[] = [];
  for (const customer_id of await customerIds(dodo, user)) {
    for (const status of ["active", "past_due"] as const) {
      try {
        const page = await dodo.subscriptions.list({ customer_id, status, page_size: 20 });
        for (const s of page.items) {
          if (lookupCatalogId(s.product_id)?.kind === "plan" && !subs.some((x) => x.subscription_id === s.subscription_id)) subs.push(s);
        }
      } catch {
        // a customer ID from the other mode: nothing to list
      }
    }
  }
  return subs;
}

/** Re-link to the one paid subscription in this mode, or null (logged) when there isn't exactly one. */
export async function relinkMissingSubscription(dodo: DodoPayments, user: User): Promise<DodoPayments.Subscription | null> {
  const mode = dodoEnvironment();
  const subs = await paidSubscriptionsFor(dodo, user);
  if (subs.length !== 1) {
    console.error(
      `[dodo relink] ${user.id}: stored ${user.dodoSubscriptionId} not found in ${mode};`,
      subs.length ? `ambiguous: ${subs.map((s) => s.subscription_id).join(", ")}` : "no paid subscription in this mode",
    );
    return null;
  }
  const sub = await dodo.subscriptions.retrieve(subs[0].subscription_id);
  const customerId = sub.customer?.customer_id;
  if (customerId && customerId !== user.dodoCustomerId) {
    await prisma.user.update({ where: { id: user.id }, data: { dodoCustomerId: customerId } }).catch((e) => {
      console.error("[dodo relink] customer id not updated", e);
    });
  }
  await syncSubscription(sub, { userId: user.id });
  console.warn(`[dodo relink] ${user.id}: ${user.dodoSubscriptionId} → ${sub.subscription_id} (${mode})`);
  return sub;
}

/**
 * The user's subscription in this Dodo mode: the stored one, else a re-linked one, else null
 * (no paid subscription here). Errors other than "not found" are thrown.
 */
export async function retrieveOrRelink(dodo: DodoPayments, user: User): Promise<DodoPayments.Subscription | null> {
  if (!user.dodoSubscriptionId) return null;
  try {
    return await dodo.subscriptions.retrieve(user.dodoSubscriptionId);
  } catch (err) {
    if (!isDodoNotFound(err)) throw err;
    return relinkMissingSubscription(dodo, user);
  }
}

/**
 * A Dodo customer ID valid in this mode: the stored one if Dodo knows it, else one found by
 * email, else (create: true) a new customer. Saved on the user when it changes.
 */
export async function customerIdFor(dodo: DodoPayments, user: User, create: boolean): Promise<string | null> {
  if (user.dodoCustomerId) {
    try {
      return (await dodo.customers.retrieve(user.dodoCustomerId)).customer_id;
    } catch (err) {
      if (!isDodoNotFound(err)) throw err;
      console.warn(`[dodo relink] ${user.id}: customer ${user.dodoCustomerId} not found in ${dodoEnvironment()}`);
    }
  }
  const found = (await dodo.customers.list({ email: user.email, page_size: 1 })).items[0];
  const id = found
    ? found.customer_id
    : create
      ? (await dodo.customers.create({ email: user.email, name: user.name?.trim() || user.email, metadata: { userId: user.id } })).customer_id
      : null;
  if (id && id !== user.dodoCustomerId) {
    await prisma.user.update({ where: { id: user.id }, data: { dodoCustomerId: id } });
    user.dodoCustomerId = id;
  }
  return id;
}
