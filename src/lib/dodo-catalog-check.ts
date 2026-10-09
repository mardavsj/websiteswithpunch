/**
 * Verifies the eight Dodo catalog IDs in env against the Dodo API (in the configured mode):
 * each product and add-on exists, prices match plans.ts, and each pack add-on is attached to
 * its plan product. Used by scripts/check-dodo-catalog.ts and logged when Dodo answers 404.
 */
import type DodoPayments from "dodopayments";
import { CATALOG_ENV } from "./dodo-products";
import { packPrice, planPrice, type BillingInterval, type PaidPlanId } from "./billing-interval";

export type CatalogLine = { envVar: string; id: string | null; ok: boolean; detail: string };

const PLANS: PaidPlanId[] = ["pro", "business"];
const INTERVALS: BillingInterval[] = ["month", "year"];
const env = (name: string) => process.env[name]?.trim() || null;
const is404 = (e: unknown) => (e as { status?: number })?.status === 404;

export async function checkCatalog(dodo: DodoPayments): Promise<CatalogLine[]> {
  const out: CatalogLine[] = [];
  for (const plan of PLANS) {
    for (const interval of INTERVALS) {
      const pVar = CATALOG_ENV.plan[plan][interval];
      const aVar = CATALOG_ENV.pack[plan][interval];
      const pid = env(pVar);
      const aid = env(aVar);
      let attached: string[] | null = null;

      if (!pid) out.push({ envVar: pVar, id: null, ok: false, detail: "not set" });
      else {
        try {
          const p = await dodo.products.retrieve(pid);
          attached = p.addons ?? [];
          const price = "price" in p.price ? p.price.price : null;
          const want = planPrice(plan, interval) * 100;
          const priceOk = price === want && p.price.currency === "USD";
          out.push({
            envVar: pVar,
            id: pid,
            ok: priceOk,
            detail: `"${p.name}" ${p.price.currency} ${price == null ? "?" : price / 100}${priceOk ? "" : ` (expected USD ${want / 100})`}`,
          });
        } catch (e) {
          out.push({ envVar: pVar, id: pid, ok: false, detail: is404(e) ? "product not found in this Dodo mode" : `lookup failed: ${String(e)}` });
        }
      }

      if (!aid) out.push({ envVar: aVar, id: null, ok: false, detail: "not set" });
      else {
        try {
          const a = await dodo.addons.retrieve(aid);
          const want = packPrice(plan, interval) * 100;
          const priceOk = a.price === want && a.currency === "USD";
          const linked = attached == null ? null : attached.includes(aid);
          out.push({
            envVar: aVar,
            id: aid,
            ok: priceOk && linked !== false,
            detail: `"${a.name}" ${a.currency} ${a.price / 100}${priceOk ? "" : ` (expected USD ${want / 100})`}${
              linked === false ? ` · NOT attached to ${pVar}` : linked ? ` · attached to ${pVar}` : ""
            }`,
          });
        } catch (e) {
          out.push({ envVar: aVar, id: aid, ok: false, detail: is404(e) ? "add-on not found in this Dodo mode" : `lookup failed: ${String(e)}` });
        }
      }
    }
  }
  return out;
}

/** Log only the broken lines (IDs are not secrets); never throws. */
export async function logCatalogProblems(dodo: DodoPayments, label: string): Promise<void> {
  try {
    const bad = (await checkCatalog(dodo)).filter((l) => !l.ok);
    if (bad.length) console.error(`[dodo catalog] ${label}:`, bad.map((l) => `${l.envVar}=${l.id ?? "-"}: ${l.detail}`).join(" | "));
    else console.error(`[dodo catalog] ${label}: all 8 IDs check out; the 404 came from something else`);
  } catch (e) {
    console.error("[dodo catalog] check failed", e);
  }
}
