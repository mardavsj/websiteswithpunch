import { PLANS, SITE_PACKS } from "@/lib/plans";

export const howSteps = [
  {
    step: "01",
    title: "Add your URL",
    body: "Paste the site you care about. Free covers one site; paid plans scale with you.",
  },
  {
    step: "02",
    title: "We check it",
    body: "Scheduled HTTP(S) checks, SSL expiry reads, and domain lookups run in the background.",
  },
  {
    step: "03",
    title: "See status & warnings",
    body: "Dashboard shows up/down, SSL days left, and domain days left — act before customers notice.",
  },
];

export const monitorRows = [
  {
    title: "Uptime",
    eyebrow: "Availability",
    body: "We hit your URL on a schedule and record whether it responded. See up/down status, recent history, and response latency so you know when something broke — and how long it took to recover.",
    visual: "uptime",
  },
  {
    title: "SSL certificates",
    eyebrow: "Trust",
    body: "For HTTPS sites we read the certificate expiry date and show days remaining. Get ahead of browser trust warnings before customers see them and bounce.",
    visual: "ssl",
  },
  {
    title: "Domain expiry",
    eyebrow: "Ownership",
    body: "Best-effort RDAP/WHOIS lookups surface when your root domain is due for renewal. A lapsed domain takes the site and often email offline — catch that early.",
    visual: "domain",
  },
] as const;

export const faqs = [
  {
    q: "What counts as one site?",
    a: "One site = one host. www and bare domains are the same (www.example.com and example.com). Paths like /topics are dropped — we monitor the whole origin. Other subdomains (blog.example.com, app.example.com) are separate sites.",
  },
  {
    q: "How often do checks run?",
    a: "Every site is checked once a day in the background: uptime and response time, SSL certificate expiry and domain expiry. Open a site to recheck it on demand (once a minute), or turn on auto refresh to recheck every 60 seconds while the page is open.",
  },
  {
    q: "What’s free vs Pro vs Business?",
    a: `Free monitors ${PLANS.free.siteLimit} site. Pro covers up to ${PLANS.pro.siteLimit} sites. Business covers up to ${PLANS.business.siteLimit} sites. Pay monthly, or yearly for 2 months free; prices in USD are on the Pricing page. On Pro or Business, add optional site packs from the dashboard — they join your existing subscription.`,
  },
  {
    q: "What if I need more than 10 or 50 sites?",
    a: `On Pro, add optional +${SITE_PACKS.pro.sitesPerPack} site packs (up to ${PLANS.pro.siteLimit + SITE_PACKS.pro.maxPacks * SITE_PACKS.pro.sitesPerPack} sites), then upgrade to Business. On Business, add +${SITE_PACKS.business.sitesPerPack} packs (up to ${PLANS.business.siteLimit + SITE_PACKS.business.maxPacks * SITE_PACKS.business.sitesPerPack} sites). Packs join your existing subscription and bill the same way, monthly or yearly. When you add a pack, the unused part of your current period is credited, the new total is charged right away, and your billing date moves to that day. You can remove packs anytime, and the removal takes effect at your next renewal. You keep the additional capacity until the end of the period you've paid for. Need more than that? Send us a message from the Contact page for a custom limit.`,
  },
  {
    q: "What exactly am I paying for?",
    a: "A subscription to our online website monitoring software (SaaS). There's nothing to install or ship: you sign in and use the dashboard in your browser, right after you sign up.",
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
    q: "Do you send alerts?",
    a: "No. Everything shows on your dashboard: up/down status, response time, and clear warnings as SSL and domain expiry dates get close. Open it whenever you like, or recheck a site on demand.",
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
    a: "Yes. Paid plans renew automatically each month or year, depending on the billing period you choose. You can cancel from Your plan on the dashboard or through Manage billing. When you cancel, your current plan remains active until the end of the billing period you've already paid for. After that, your account moves to the Free plan. Nothing is deleted — sites beyond the Free plan limit are locked.",
  },
  {
    q: "Do you offer refunds?",
    a: "Payments are non-refundable, including after you cancel. When you cancel, downgrade, remove a site pack, or switch from annual to monthly billing, no refund or credit is provided for the remaining time in the current billing period. You keep your current plan and capacity until the end of the period you've paid for, and the change takes effect at renewal. Upgrades take effect immediately and are charged on a prorated basis, with unused time credited. The only exceptions (duplicate charges, billing errors, or a paid plan we couldn't provide) are set out in our Refund & Cancellation Policy, linked in the footer.",
  },
];

export const proofMetrics = [
  { label: "Uptime", detail: "Scheduled HTTP checks" },
  { label: "SSL", detail: "Days until expiry" },
  { label: "Domain", detail: "Renewal window" },
  { label: "One dashboard", detail: "Status at a glance" },
];
