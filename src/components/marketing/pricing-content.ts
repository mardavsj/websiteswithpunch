import { PLANS, SITE_PACKS, type PlanId } from "@/lib/plans";
import { ANNUAL_PRICES, perMonthPrice, type BillingInterval } from "@/lib/billing-interval";

const packCeiling = (id: "pro" | "business") =>
  PLANS[id].siteLimit + SITE_PACKS[id].maxPacks * SITE_PACKS[id].sitesPerPack;

/** Per-site cost per month on an interval: Pro $1.20 monthly, $1.00 annual. */
const perSite = (id: "pro" | "business", interval: BillingInterval) =>
  (perMonthPrice(id, interval) / PLANS[id].siteLimit).toFixed(2);

/** What a paid card shows per interval. Price is always per month; annual notes the yearly bill. */
export type PlanPricing = { price: number; note: string; href: string };

const paidPricing = (id: "pro" | "business"): Record<BillingInterval, PlanPricing> => ({
  month: {
    price: PLANS[id].price,
    note: `Billed monthly · $${perSite(id, "month")} per site`,
    href: `/signup?plan=${id}&interval=monthly`,
  },
  year: {
    price: perMonthPrice(id, "year"),
    note: `Billed $${ANNUAL_PRICES[id]} yearly · $${perSite(id, "year")} per site`,
    href: `/signup?plan=${id}&interval=annual`,
  },
});

export type PlanFeature = { text: string; off?: boolean };

export type PricingPlan = {
  id: PlanId;
  name: string;
  audience: string;
  cta: string;
  /** Free has one entry for both intervals. */
  pricing: Record<BillingInterval, PlanPricing>;
  features: PlanFeature[];
};

const freePricing: PlanPricing = { price: PLANS.free.price, note: "No card needed", href: "/signup" };

/** Rows shared word-for-word by every card (row 3 and 4). */
const shared: PlanFeature[] = [
  { text: "Uptime, SSL and domain checks" },
  { text: "Dashboard, analytics and check history" },
];

/** Paid-only, from the code: Stripe billing portal (needs a Stripe customer) and pack add/remove. */
const paid: PlanFeature[] = [
  { text: "Self-serve billing portal" },
  { text: "Manage packs from the dashboard" },
];

/**
 * Homepage pricing cards. Prices and limits come from PLANS / SITE_PACKS; only real features.
 * Rows are parallel across cards: 1 sites, 2 packs, 3–4 shared, then paid-only extras.
 */
export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: PLANS.free.name,
    audience: "For the one site you can’t afford to lose.",
    cta: "Get started free",
    pricing: { month: freePricing, year: freePricing },
    features: [{ text: "1 monitored site" }, { text: "No site packs", off: true }, ...shared],
  },
  {
    id: "pro",
    name: PLANS.pro.name,
    audience: "For freelancers and growing portfolios.",
    cta: "Start with Pro",
    pricing: paidPricing("pro"),
    features: [
      { text: `Up to ${PLANS.pro.siteLimit} monitored sites` },
      { text: `Optional +${SITE_PACKS.pro.sitesPerPack}-site packs, up to ${packCeiling("pro")} sites` },
      ...shared,
      ...paid,
    ],
  },
  {
    id: "business",
    name: PLANS.business.name,
    audience: "For agencies and larger portfolios.",
    cta: "Start with Business",
    pricing: paidPricing("business"),
    features: [
      { text: `Up to ${PLANS.business.siteLimit} monitored sites` },
      { text: `Optional +${SITE_PACKS.business.sitesPerPack}-site packs, up to ${packCeiling("business")} sites` },
      ...shared,
      ...paid,
      { text: "Lowest cost per site" },
    ],
  },
];

/** Highest self-serve limit (Business plus every pack); beyond this is a custom plan. */
export const maxSelfServeSites = packCeiling("business");

export const customPlanHref = "/contact?topic=custom-limits";
