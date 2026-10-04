import type { ArticleSection, Faq } from "@/components/seo/types";

export const domainChecker = {
  path: "/tools/domain-expiry-checker",
  title: "Domain Expiry Checker: Free Expiration Date Lookup (RDAP)",
  description:
    "Free domain expiry checker. See when any domain expires, how many days are left and which registrar manages it, read live from the registry over RDAP.",
  h1: "Domain expiry checker",
  intro:
    "Enter a domain to see its registration expiry date, the days left and the registrar of record, read live from the registry using RDAP (the official successor to WHOIS). Free, no signup.",
  sections: [
    {
      h: "How this domain expiry lookup works",
      p: [
        "Every domain is registered for a fixed period, usually one to ten years, and has to be renewed before that period ends. The checker reduces what you type to the registrable domain (blog.example.co.uk becomes example.co.uk), finds the registry responsible for that top-level domain in IANA's RDAP bootstrap list, and asks it for the domain's record. The expiry date is the event the registry labels \"expiration\".",
        "RDAP, the Registration Data Access Protocol, replaced the old free-text WHOIS service for generic top-level domains such as .com, .net, .org and the newer gTLDs. It returns structured data over HTTPS, so the dates are exactly what the registry holds rather than text scraped from a reply. When a registry has no usable RDAP record we try a WHOIS source instead, and the Source row says which one answered.",
      ],
    },
    {
      h: "Why an expired domain is worse than downtime",
      p: [
        "When a domain lapses, the website stops resolving and email to that domain usually stops arriving too, because MX records live in the same DNS zone. Password resets, invoices and customer replies go nowhere. After the registrar's grace and redemption periods, which vary by registrar and TLD and often add up to around 30 to 75 days for .com, the name can be released and registered by anyone, including people who buy dropped domains to resell them or to reuse their search traffic.",
        "It rarely happens because nobody cared. The card on file expired, the renewal notices went to an ex-employee's inbox, or the client registered the domain years ago and nobody remembers which registrar holds it. A domain can look perfectly healthy right up until the day it stops resolving.",
      ],
    },
    {
      h: "Reading the result",
      list: [
        "Days left: green above 30 days, amber at 30 or fewer, red at 7 or fewer. Many registrars auto-renew in the final weeks, so amber is the point to confirm that renewal is switched on and the payment method is valid.",
        "Expires: the registry's expiration date. Registrars may show a slightly earlier date in their dashboard because they renew ahead of it.",
        "Registrar: the company the domain is registered through, which is where you renew it. If you don't recognise it, that's the first thing to sort out.",
        "Registered: when the domain was first created, if the registry publishes it.",
      ],
    },
    {
      h: "How to make sure a domain never lapses",
      steps: [
        "Find the registrar shown above and log in, or ask whoever controls the account. Without access you can't renew.",
        "Turn on auto-renew and check the card on file expires after the next renewal date.",
        "Update the registrant and account email to an address that will still be read in a few years, ideally a shared inbox rather than one person.",
        "Consider renewing for several years at once for domains that matter. Most registries allow up to ten years.",
        "Keep a list of every domain you're responsible for with its expiry date, and look at it regularly, or let a monitoring dashboard keep it for you.",
      ],
    },
    {
      h: "When no expiry date is shown",
      p: [
        "Some country-code registries don't publish expiry dates at all, or only in a format we can't read reliably; .de and some others keep them private, and a few ccTLDs (for example .io or .co) are not listed in IANA's RDAP bootstrap. In those cases we say so rather than guess. Your registrar's dashboard always shows the real renewal date.",
      ],
    },
  ] satisfies ArticleSection[],
  faqs: [
    {
      q: "How do I find out when a domain expires?",
      a: "Type the domain into the checker above. It queries the registry over RDAP and shows the expiry date, the days left and the registrar. You can also run a WHOIS or RDAP lookup from a terminal, or check your registrar account.",
    },
    {
      q: "What is RDAP?",
      a: "RDAP (Registration Data Access Protocol) is the IETF-standard, JSON-based replacement for WHOIS. ICANN requires registries and registrars of generic top-level domains to run it, which is why its dates are more reliable than parsed WHOIS text.",
    },
    {
      q: "What happens when a domain expires?",
      a: "The website and usually email stop working. The owner normally gets a grace period to renew, then a redemption period with an extra fee, after which the domain can be deleted and registered by someone else. The exact periods depend on the registrar and the TLD.",
    },
    {
      q: "Why doesn't the checker show the owner's name?",
      a: "Most registries redact personal contact details for privacy, and this tool only shows registration facts: the registrar and the key dates.",
    },
    {
      q: "Is the domain expiry checker free?",
      a: "Yes, with no account. Each visitor can run up to 10 checks a minute and 100 a day across our free tools, and results are cached for up to an hour.",
    },
    {
      q: "Can I track expiry dates for many domains?",
      a: "Yes. Websites With Punch looks up the domain expiry of every site you add once a day and shows the days left on one dashboard, next to uptime and SSL. The free plan covers one site; Pro covers 10 and Business 50.",
    },
  ] satisfies Faq[],
  cta: "Add your site and we look up its domain expiry every day, next to uptime and SSL, so the renewal date is always one glance away. Free for one site. (No alerts yet: the days left show on your dashboard, amber at 30 and red at 7.)",
};
