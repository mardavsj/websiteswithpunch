import type { ArticleSection, Faq } from "@/components/seo/types";

export const domainFeature = {
  path: "/domain-expiry-monitoring",
  title: "Domain Expiry Monitoring: Never Miss a Domain Renewal",
  description:
    "Domain expiry monitoring for your own and your clients' sites: renewal dates looked up daily via RDAP, with days left on one dashboard next to uptime and SSL.",
  eyebrow: "Domain expiry monitoring",
  h1: "Domain expiry monitoring that keeps renewals in sight",
  intro:
    "A lapsed domain takes the website and usually the email down with it, and after the grace period anyone can register it. Websites With Punch looks up the expiry date of each site's domain every day and keeps the days left on your dashboard.",
  facts: [
    "Expiry looked up daily from the registry",
    "RDAP first, WHOIS fallback",
    "Days left next to uptime and SSL",
    "Amber at 30 days, red at 7",
  ],
  sections: [
    {
      h: "How the lookup works",
      p: [
        "For each site we take the registrable domain (shop.example.co.uk becomes example.co.uk) and ask the responsible registry over RDAP, the structured successor to WHOIS that ICANN requires for generic top-level domains. When a registry has no usable RDAP record we try WHOIS sources instead. The lookup runs with the daily check and whenever you recheck a site.",
        "It's a best-effort early warning rather than a registrar notice. Most common TLDs (.com, .net, .org, most new gTLDs and many country codes) work well. Some ccTLD registries keep expiry dates private, and then we show \"Not available\" rather than a guess.",
      ],
    },
    {
      h: "Why domains lapse",
      list: [
        "The card on file expired, so auto-renew silently failed.",
        "Renewal emails go to someone who left, or to a client who never opens them.",
        "Nobody remembers which registrar holds the domain, so nobody logs in.",
        "Multi-year registrations make the next renewal easy to forget entirely.",
      ],
      p: [
        "Seeing \"Domain: 24 days\" in amber on a site card is a prompt to log in to the registrar and confirm renewal is on, weeks before the site or email goes dark.",
      ],
    },
    {
      h: "Built for people who look after other people's domains",
      p: [
        "Freelancers and agencies often inherit domains registered by clients years ago, scattered across registrars. Add each client site once and the dashboard keeps every renewal date in one list, beside the uptime and SSL status you already watch. To look up a single domain without an account, use the free domain expiry checker, which also shows the registrar of record.",
      ],
    },
    {
      h: "What it doesn't do",
      p: [
        "We don't renew domains, hold registrar logins or send alerts, and we don't monitor DNS record changes. The renewal date and days left are on your dashboard whenever you open it.",
      ],
    },
  ] satisfies ArticleSection[],
  faqs: [
    {
      q: "Which domains can be monitored?",
      a: "Any public domain whose registry publishes an expiry date over RDAP or WHOIS, which covers .com, .net, .org, most new gTLDs and many country-code domains. If a registry hides the date we show it as not available.",
    },
    {
      q: "How often is the expiry date checked?",
      a: "Once a day with the background check, and again whenever you press Recheck on the site's page.",
    },
    {
      q: "Is a subdomain monitored separately?",
      a: "Each site is one host, but domain expiry is always looked up for the registrable domain, so blog.example.com and example.com share the same renewal date.",
    },
    {
      q: "Will you remind me before a domain expires?",
      a: "Not by email. The days left show on your dashboard, amber at 30 days and red at 7.",
    },
  ] satisfies Faq[],
};
