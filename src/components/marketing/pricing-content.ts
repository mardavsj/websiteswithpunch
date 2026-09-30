import { PLANS, SITE_PACKS, type PlanId } from "@/lib/plans";

const packCeiling = (id: "pro" | "business") =>
  PLANS[id].siteLimit + SITE_PACKS[id].maxPacks * SITE_PACKS[id].sitesPerPack;

const perSite = (id: "pro" | "business") => (PLANS[id].price / PLANS[id].siteLimit).toFixed(2);

export type PricingPlan = {
  id: PlanId;
  name: string;
  price: number;
  audience: string;
  note: string;
  cta: string;
  href: string;
  featuresLabel: string;
  features: string[];
};

/** Homepage pricing cards. Prices and limits come from PLANS / SITE_PACKS; only real features. */
export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: PLANS.free.name,
    price: PLANS.free.price,
    audience: "For the one site you can’t afford to lose.",
    note: "No card needed",
    cta: "Get started free",
    href: "/signup",
    featuresLabel: "Includes",
    features: ["1 monitored site", "Uptime, SSL and domain checks", "Dashboard, analytics and check history"],
  },
  {
    id: "pro",
    name: PLANS.pro.name,
    price: PLANS.pro.price,
    audience: "For freelancers and growing portfolios.",
    note: `Billed monthly · $${perSite("pro")} per site`,
    cta: "Start with Pro",
    href: "/signup?plan=pro",
    featuresLabel: "Everything in Free, plus",
    features: [
      `Up to ${PLANS.pro.siteLimit} monitored sites`,
      `Optional +${SITE_PACKS.pro.sitesPerPack}-site packs, up to ${packCeiling("pro")} sites`,
      "Self-serve billing portal",
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
    featuresLabel: "Everything in Pro, plus",
    features: [
      `Up to ${PLANS.business.siteLimit} monitored sites`,
      `Optional +${SITE_PACKS.business.sitesPerPack}-site packs, up to ${packCeiling("business")} sites`,
      "Lowest cost per site",
    ],
  },
];

/** Shared by every plan (none of these are gated by plan). */
export const everyPlanIncludes = [
  "Uptime & latency",
  "SSL expiry",
  "Domain expiry",
  "Analytics & Health Score",
  "Manual recheck",
  "Auto refresh",
];

/** Highest self-serve limit (Business plus every pack); beyond this is a custom plan. */
export const maxSelfServeSites = packCeiling("business");

export const customPlanHref = "mailto:hello@websiteswithpunch.com?subject=Custom%20site%20limit";
