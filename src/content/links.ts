import type { RelatedLink } from "@/components/seo/types";

/** Every public tool and feature page, used for related links, the tools index, nav and sitemap. */
export const TOOL_LINKS: RelatedLink[] = [
  { href: "/tools/ssl-checker", title: "SSL checker", body: "Issuer, expiry date, days left and browser trust for any domain's certificate." },
  { href: "/tools/domain-expiry-checker", title: "Domain expiry checker", body: "Registrar, expiry date and days left, read live from the registry over RDAP." },
  { href: "/tools/website-down-checker", title: "Website down checker", body: "Is it down for everyone or just you? Status code, response time and redirects." },
];

export const FEATURE_LINKS: RelatedLink[] = [
  { href: "/uptime-monitoring", title: "Uptime monitoring", body: "A daily check of every site, on-demand rechecks, auto refresh and 90 days of history." },
  { href: "/ssl-certificate-monitoring", title: "SSL certificate monitoring", body: "Days left on every certificate you look after, amber at 30 days and red at 7." },
  { href: "/domain-expiry-monitoring", title: "Domain expiry monitoring", body: "Renewal dates for your own and your clients' domains on one dashboard." },
];

/** Related links for a page: the other pages first, never the page itself. */
export function relatedFor(path: string, prefer: "tools" | "features") {
  const first = prefer === "tools" ? TOOL_LINKS : FEATURE_LINKS;
  const second = prefer === "tools" ? FEATURE_LINKS : TOOL_LINKS;
  return [...first, ...second].filter((l) => l.href !== path).slice(0, 4);
}
