import { PLANS, SITE_PACKS, type PlanId } from "@/lib/plans";

const packCeiling = (id: "pro" | "business") =>
  PLANS[id].siteLimit + SITE_PACKS[id].maxPacks * SITE_PACKS[id].sitesPerPack;

const perSite = (id: "pro" | "business") => (PLANS[id].price / PLANS[id].siteLimit).toFixed(2);

export type PlanFeature = { text: string; off?: boolean };

export type PricingPlan = {
  id: PlanId;
  name: string;
  price: number;
  audience: string;
  note: string;
  cta: string;
  href: string;
  features: PlanFeature[];
};

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
    price: PLANS.free.price,
    audience: "For the one site you can’t afford to lose.",
    note: "No card needed",
    cta: "Get started free",
    href: "/signup",
    features: [{ text: "1 monitored site" }, { text: "No site packs", off: true }, ...shared],
  },
  {
    id: "pro",
    name: PLANS.pro.name,
    price: PLANS.pro.price,
    audience: "For freelancers and growing portfolios.",
    note: `Billed monthly · $${perSite("pro")} per site`,
    cta: "Start with Pro",
    href: "/signup?plan=pro",
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
    price: PLANS.business.price,
    audience: "For agencies and larger portfolios.",
    note: `Billed monthly · $${perSite("business")} per site`,
    cta: "Start with Business",
    href: "/signup?plan=business",
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

export const customPlanHref = "mailto:hello@websiteswithpunch.com?subject=Custom%20site%20limit";
