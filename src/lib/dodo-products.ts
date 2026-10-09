/**
 * Dodo product / add-on IDs from env, and the reverse map the webhook and billing routes use.
 * Each plan × interval is its own subscription product. A Dodo add-on has one price and bills
 * on its parent's cycle, so each site pack exists twice: a monthly add-on ($6 / $9) attached to
 * the monthly product and an annual add-on ($60 / $90) attached to the annual product.
 */
import type { BillingInterval, PaidPlanId } from "./billing-interval";

export type CatalogKind = "plan" | "pack";

export const CATALOG_ENV: Record<CatalogKind, Record<PaidPlanId, Record<BillingInterval, string>>> = {
  plan: {
    pro: { month: "DODO_PRODUCT_PRO_MONTHLY", year: "DODO_PRODUCT_PRO_ANNUAL" },
    business: { month: "DODO_PRODUCT_BUSINESS_MONTHLY", year: "DODO_PRODUCT_BUSINESS_ANNUAL" },
  },
  pack: {
    pro: { month: "DODO_ADDON_PACK_PRO_MONTHLY", year: "DODO_ADDON_PACK_PRO_ANNUAL" },
    business: {
      month: "DODO_ADDON_PACK_BUSINESS_MONTHLY",
      year: "DODO_ADDON_PACK_BUSINESS_ANNUAL",
    },
  },
};

function envValue(name: string): string | null {
  return process.env[name]?.trim() || null;
}

export function productIdFor(plan: PaidPlanId, interval: BillingInterval = "month"): string | null {
  return envValue(CATALOG_ENV.plan[plan][interval]);
}

export function packAddonIdFor(plan: PaidPlanId, interval: BillingInterval = "month"): string | null {
  return envValue(CATALOG_ENV.pack[plan][interval]);
}

/** Clear, fixable message naming the env var, e.g. for a missing annual product. */
export function missingCatalogMessage(
  kind: CatalogKind,
  plan: PaidPlanId,
  interval: BillingInterval,
): string {
  const what = `${interval === "year" ? "Annual" : "Monthly"} ${plan === "business" ? "Business" : "Pro"}${
    kind === "pack" ? " site pack add-on" : " product"
  }`;
  return `${what} is not configured. Set ${CATALOG_ENV[kind][plan][interval]} in the server environment.`;
}

export type CatalogInfo = { kind: CatalogKind; plan: PaidPlanId; interval: BillingInterval };

/** Reverse lookup over the eight configured IDs (products and add-ons). */
export function lookupCatalogId(id: string | null | undefined): CatalogInfo | null {
  if (!id) return null;
  for (const kind of ["plan", "pack"] as const) {
    for (const plan of ["pro", "business"] as const) {
      for (const interval of ["month", "year"] as const) {
        if (envValue(CATALOG_ENV[kind][plan][interval]) === id) return { kind, plan, interval };
      }
    }
  }
  return null;
}
