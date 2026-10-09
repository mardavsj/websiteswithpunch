/**
 * Read-only: why do billing calls 404 for one user? Prints the stored Dodo IDs, whether they
 * exist in the configured mode, the customer's paid subscriptions there, and a Dodo PREVIEW
 * (no charge, nothing changed) of "+1 site pack". With production env pulled from Vercel:
 *   npx tsx --env-file=.env.production.local scripts/diagnose-dodo-user.ts user@example.com
 * Then, if a different live subscription is listed: scripts/reconcile-dodo.ts sub_xxx
 */
import { prisma } from "../src/lib/prisma";
import { dodoEnvironment, getDodo } from "../src/lib/dodo";
import { subscriptionState } from "../src/lib/dodo-subscription";
import { changeBody, previewBody } from "../src/lib/dodo-change";
import { paidSubscriptionsFor } from "../src/lib/dodo-relink";

const why = (e: unknown) => {
  const x = e as { status?: number; error?: { message?: string }; message?: string };
  return `${x.status ?? "?"} ${x.error?.message ?? x.message ?? String(e)}`;
};

async function main() {
  const email = process.argv[2]?.toLowerCase().trim();
  if (!email) throw new Error("Usage: tsx scripts/diagnose-dodo-user.ts user@example.com");
  const dodo = getDodo();
  if (!dodo) throw new Error("DODO_PAYMENTS_API_KEY is not set");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("No user with that email");
  console.log(`Dodo mode: ${dodoEnvironment()}`);
  console.log("DB:", {
    plan: user.plan,
    packs: user.sitePackCount,
    status: user.dodoStatus,
    subscription: user.dodoSubscriptionId,
    customer: user.dodoCustomerId,
  });

  let st = null;
  if (user.dodoSubscriptionId) {
    try {
      const sub = await dodo.subscriptions.retrieve(user.dodoSubscriptionId);
      st = subscriptionState(sub);
      console.log("Stored subscription: FOUND", {
        product: sub.product_id,
        addons: sub.addons,
        status: sub.status,
        currency: sub.currency,
        plan: st.plan,
        interval: st.interval,
        packs: st.packs,
      });
    } catch (e) {
      console.log(`Stored subscription: NOT FOUND in this mode (${why(e)})`);
    }
  }

  const subs = await paidSubscriptionsFor(dodo, user);
  console.log(`Paid subscriptions on our products in this mode: ${subs.length}`);
  for (const s of subs) console.log(" ", s.subscription_id, s.product_id, s.status, s.currency, s.created_at);

  if (st?.plan) {
    const built = changeBody({ plan: st.plan, interval: st.interval, packs: st.packs + 1 }, "now", st);
    if (!built.ok) console.log("Preview +1 pack: config error:", built.error);
    else {
      console.log("Preview +1 pack body:", JSON.stringify(previewBody(built.body)));
      try {
        const p = await dodo.subscriptions.previewChangePlan(user.dodoSubscriptionId!, previewBody(built.body));
        console.log("Preview +1 pack: OK, charge now", p.immediate_charge?.summary);
      } catch (e) {
        console.log(`Preview +1 pack: FAILED (${why(e)})`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
