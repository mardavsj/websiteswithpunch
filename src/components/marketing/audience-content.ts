import { PLANS, SITE_PACKS } from "@/lib/plans";

export type Persona = {
  id: string;
  title: string;
  /** One-line positioning (the original card copy). */
  body: string;
  /** Before → after. */
  pain: string;
  outcome: string;
  /** What you get, in plan terms. */
  get: string;
  stat: string;
  statLabel: string;
  cta: string;
  href: string;
};

const proMax = PLANS.pro.siteLimit + SITE_PACKS.pro.maxPacks * SITE_PACKS.pro.sitesPerPack;
const bizMax =
  PLANS.business.siteLimit + SITE_PACKS.business.maxPacks * SITE_PACKS.business.sitesPerPack;

export const personas: Persona[] = [
  {
    id: "founders",
    title: "Founders",
    body: "Ship product, not pager duty. One dashboard for the sites that keep revenue flowing.",
    pain: "The site that pays the bills goes down, and you hear it from a customer.",
    outcome: "Up/down, SSL days and domain days on one dashboard, plus a Health Score for each site.",
    get: "Uptime, SSL and domain checks for your main site. Upgrade only when you add more.",
    stat: String(PLANS.free.siteLimit),
    statLabel: `site on ${PLANS.free.name}, no card needed`,
    cta: "Start free",
    href: "/signup",
  },
  {
    id: "freelancers",
    title: "Freelancers",
    body: "Client sites shouldn’t surprise you. Spot SSL and domain issues before the midnight email.",
    pain: "An expired certificate or lapsed domain on a client site becomes your emergency.",
    outcome: "Every client site in one list, with SSL and domain days left turning amber before they run out.",
    get: `Pro covers up to ${PLANS.pro.siteLimit} sites; add +${SITE_PACKS.pro.sitesPerPack} packs up to ${proMax}.`,
    stat: String(PLANS.pro.siteLimit),
    statLabel: `client sites on ${PLANS.pro.name}`,
    cta: "Start with Pro",
    href: "/signup?plan=pro",
  },
  {
    id: "agencies",
    title: "Small agencies",
    body: "Monitor a portfolio without enterprise pricing. Free for one, Pro for ten, Business for fifty.",
    pain: "A growing portfolio, and monitoring tools built and priced for enterprise teams.",
    outcome: "One dashboard for the whole portfolio, with per-site analytics when something looks off.",
    get: `Business covers up to ${PLANS.business.siteLimit} sites; add +${SITE_PACKS.business.sitesPerPack} packs up to ${bizMax}.`,
    stat: String(PLANS.business.siteLimit),
    statLabel: `sites on ${PLANS.business.name}, in one view`,
    cta: "Start with Business",
    href: "/signup?plan=business",
  },
];
