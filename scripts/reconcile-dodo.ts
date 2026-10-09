/**
 * One-off: re-read a Dodo subscription and mirror it onto its user (same code as the webhook).
 * Needs the PRODUCTION env (DATABASE_URL, DODO_PAYMENTS_API_KEY, DODO_PAYMENTS_ENVIRONMENT,
 * DODO_PRODUCT_* / DODO_ADDON_*), e.g. after `vercel env pull .env.production.local`:
 *   npx tsx --env-file=.env.production.local scripts/reconcile-dodo.ts sub_xxx
 * Prints before/after plan; never prints secrets.
 */
import { prisma } from "../src/lib/prisma";
import { getDodo } from "../src/lib/dodo";
import { findUserForSubscription, syncSubscription } from "../src/lib/dodo-sync";
import { subscriptionState } from "../src/lib/dodo-subscription";

async function main() {
  const subId = process.argv[2];
  if (!subId?.startsWith("sub_")) throw new Error("Usage: tsx scripts/reconcile-dodo.ts sub_xxx");
  const dodo = getDodo();
  if (!dodo) throw new Error("DODO_PAYMENTS_API_KEY is not set");
  const sub = await dodo.subscriptions.retrieve(subId);
  const st = subscriptionState(sub);
  console.log("Dodo:", { product: sub.product_id, status: st.status, plan: st.plan, packs: st.packs });
  if (!st.plan) console.warn("Product isn't in DODO_PRODUCT_* env: check the env vars, nothing changed.");
  const before = await findUserForSubscription(sub);
  if (!before) throw new Error("No user found for this subscription");
  console.log("Before:", { user: before.id, plan: before.plan, packs: before.sitePackCount, status: before.dodoStatus });
  console.log("Result:", await syncSubscription(sub, { userId: before.id }));
  const after = await prisma.user.findUnique({ where: { id: before.id } });
  console.log("After:", { plan: after?.plan, packs: after?.sitePackCount, status: after?.dodoStatus });
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
