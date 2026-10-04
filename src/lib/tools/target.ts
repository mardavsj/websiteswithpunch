import { domainToASCII } from "node:url";
import { normalizeSiteUrl, registrableDomain, SiteUrlError } from "@/lib/url";

export type ToolTarget = { host: string; domain: string };

/**
 * Parse what a visitor typed into a public tool ("Example.com/path", "https://www.x.co.uk").
 * Same rules as adding a site (no IPs, localhost or unknown suffixes), but the host is kept as
 * typed (www included) because www and the apex can serve different certificates.
 */
export function parseToolTarget(raw: unknown): ToolTarget {
  const input = typeof raw === "string" ? raw.trim().slice(0, 300) : "";
  if (!input) throw new SiteUrlError("Enter a domain, e.g. example.com.");
  normalizeSiteUrl(input); // throws SiteUrlError with a friendly message
  const withScheme = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  let host = new URL(withScheme).hostname.toLowerCase().replace(/\.$/, "");
  host = domainToASCII(host) || host;
  const domain = registrableDomain(host) || host.replace(/^www\./, "");
  return { host, domain };
}

export { SiteUrlError };
