import { PLANS, SITE_PACKS } from "@/lib/plans";
import {
  IconBell,
  IconChart,
  IconGlobe,
  IconLink,
  IconLock,
  IconPulse,
} from "./icons";

export const howSteps = [
  {
    step: "01",
    title: "Add your URL",
    body: "Paste the site you care about. Free covers one site; paid plans scale with you.",
    Icon: IconLink,
  },
  {
    step: "02",
    title: "We check it",
    body: "Scheduled HTTP(S) checks, SSL expiry reads, and domain lookups run in the background.",
    Icon: IconPulse,
  },
  {
    step: "03",
    title: "See status & alerts",
    body: "Dashboard shows up/down, SSL days left, and domain days left — act before customers notice.",
    Icon: IconBell,
  },
];

export const monitorRows = [
  {
    title: "Uptime",
    eyebrow: "Availability",
    body: "We hit your URL on a schedule and record whether it responded. See up/down status, recent history, and response latency so you know when something broke — and how long it took to recover.",
    Icon: IconPulse,
  },
  {
    title: "SSL certificates",
    eyebrow: "Trust",
    body: "For HTTPS sites we read the certificate expiry date and show days remaining. Get ahead of browser trust warnings before customers see them and bounce.",
    Icon: IconLock,
  },
  {
    title: "Domain expiry",
    eyebrow: "Ownership",
    body: "Best-effort RDAP/WHOIS lookups surface when your root domain is due for renewal. A lapsed domain takes the site and often email offline — catch that early.",
    Icon: IconGlobe,
  },
];

export const painPoints = [
  {
    title: "Expired SSL kills trust",
    body: "A red padlock looks like a scam. Visitors leave. Monitoring days-left is calmer than scramble mode after the fact.",
    Icon: IconLock,
  },
  {
    title: "Domain lapse takes everything offline",
    body: "Miss a renewal and the site, email, and DNS can vanish overnight. Days-left on the dashboard is cheap insurance.",
    Icon: IconGlobe,
  },
  {
    title: "Downtime loses sales",
    body: "If nobody tells you the shop is down, every minute is lost revenue. Uptime history shows what happened and when.",
    Icon: IconChart,
  },
];

export const audiences = [
  {
    title: "Founders",
    body: "Ship product, not pager duty. One dashboard for the sites that keep revenue flowing.",
    wide: true,
  },
  {
    title: "Freelancers",
    body: "Client sites shouldn’t surprise you. Spot SSL and domain issues before the midnight email.",
    wide: false,
  },
  {
    title: "Small agencies",
    body: "Monitor a portfolio without enterprise pricing. Free for one, Pro for ten, Business for fifty.",
    wide: false,
  },
];

export const faqs = [
  {
    q: "How often do checks run?",
    a: "Uptime checks run on a regular schedule so you see recent status and latency on the dashboard. SSL and domain expiry are refreshed so days-remaining stay useful — not stale.",
  },
  {
    q: "What’s free vs Pro vs Business?",
    a: `Free monitors ${PLANS.free.siteLimit} site. Pro ($${PLANS.pro.price}/mo) covers up to ${PLANS.pro.siteLimit} sites. Business ($${PLANS.business.price}/mo) covers up to ${PLANS.business.siteLimit} sites. On Pro or Business, add optional site packs from the dashboard — they join your existing subscription.`,
  },
  {
    q: "What if I need more than 10 or 50 sites?",
    a: `On Pro, add optional +${SITE_PACKS.pro.sitesPerPack} site packs for $${SITE_PACKS.pro.pricePerMonth}/mo each (up to ${PLANS.pro.siteLimit + SITE_PACKS.pro.maxPacks * SITE_PACKS.pro.sitesPerPack} sites), then upgrade to Business. On Business, add +${SITE_PACKS.business.sitesPerPack} packs for $${SITE_PACKS.business.pricePerMonth}/mo each (up to ${PLANS.business.siteLimit + SITE_PACKS.business.maxPacks * SITE_PACKS.business.sitesPerPack} sites). Packs are added to your existing subscription — you pay for the rest of the current month today, then one bill on the same renewal date. Remove them anytime. You keep them until the end of the month you've paid for. Need more than that? Email hello@websiteswithpunch.com for a custom limit.`,
  },
  {
    q: "Do I need a card to start?",
    a: "No. Create an account, add one URL, and use the free plan. Upgrade when you need more sites — secure checkout appears only when you’re ready to pay.",
  },
  {
    q: "How accurate is domain expiry?",
    a: "We use best-effort RDAP/WHOIS lookups. Most common TLDs work well; some registries are sparse or rate-limited. Treat it as an early warning, not a legal registrar notice.",
  },
  {
    q: "Will you spam me with alerts?",
    a: "The goal is signal, not noise: clear status on the dashboard and practical warnings around SSL and domain windows — not a firehose of every transient blip.",
  },
  {
    q: "What happens to my sites if I downgrade or cancel?",
    a: "Nothing is deleted. Sites over your new limit are locked — they stay in your list but aren't checked, and their details stay hidden until you unlock them. You choose which sites stay active when the change is scheduled (or we keep your oldest if you cancel from the billing portal).",
  },
  {
    q: "Can I switch which site stays active?",
    a: "Before your plan changes, yes, as often as you like. After that, the active sites are fixed. To use a different one, delete an active site to free a slot, then add a new site or unlock a locked one.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Paid plans are month-to-month. Cancel from Your plan on the dashboard (or Manage billing). You keep your paid plan until the period ends, then Free. Nothing is deleted — extra sites are locked.",
  },
];

export const proofMetrics = [
  { label: "Uptime", detail: "Scheduled HTTP checks" },
  { label: "SSL", detail: "Days until expiry" },
  { label: "Domain", detail: "Renewal window" },
  { label: "One dashboard", detail: "Status at a glance" },
];
