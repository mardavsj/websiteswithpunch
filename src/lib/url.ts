import { parse as parseTld } from "tldts";

export type NormalizedSiteUrl = {
  /** Canonical origin stored in DB, e.g. https://ullam.ai */
  url: string;
  /** www-insensitive host key for dedupe, e.g. ullam.ai */
  hostKey: string;
  /** Hostname as stored (www stripped), e.g. ullam.ai */
  hostname: string;
  /** True when path, query, or hash was dropped from input */
  pathWasStripped: boolean;
};

export class SiteUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SiteUrlError";
  }
}

const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/;

function isBlockedHostname(hostname: string): string | null {
  const h = hostname.toLowerCase();
  if (!h || h === "localhost" || h.endsWith(".localhost")) {
    return "Localhost URLs can't be monitored.";
  }
  if (h === "0.0.0.0" || h === "::1" || h === "[::1]") {
    return "Local addresses can't be monitored.";
  }
  if (IPV4_RE.test(h) || h.includes(":")) {
    return "Enter a domain name, not an IP address.";
  }
  if (!h.includes(".")) {
    return "Enter a full domain (e.g. example.com).";
  }
  return null;
}

/**
 * Normalize a site URL for storage and www-insensitive dedupe.
 * One site = one host; www is ignored; paths/query/hash are dropped;
 * other subdomains (blog.x) stay distinct.
 */
export function normalizeSiteUrl(input: string): NormalizedSiteUrl {
  const trimmed = input.trim();
  if (!trimmed) throw new SiteUrlError("Enter a URL.");

  let withScheme = trimmed;
  if (!/^https?:\/\//i.test(withScheme)) {
    withScheme = `https://${withScheme}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new SiteUrlError("Invalid URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SiteUrlError("URL must start with http:// or https://.");
  }

  let hostname = parsed.hostname.toLowerCase();
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    hostname = hostname.slice(1, -1);
  }

  const blocked = isBlockedHostname(hostname);
  if (blocked) throw new SiteUrlError(blocked);

  const pathWasStripped = Boolean(
    (parsed.pathname && parsed.pathname !== "/") ||
      parsed.search ||
      parsed.hash,
  );

  // Prefer https origin; strip leading www for storage.
  const hostKey = hostname.replace(/^www\./, "");
  const storedHost = hostKey;
  const url = `https://${storedHost}`;

  return { url, hostKey, hostname: storedHost, pathWasStripped };
}

/** Best-effort hostKey from a stored URL (legacy rows may still have www/path). */
export function hostKeyFromStoredUrl(stored: string): string | null {
  try {
    return normalizeSiteUrl(stored).hostKey;
  } catch {
    try {
      const h = new URL(
        /^https?:\/\//i.test(stored) ? stored : `https://${stored}`,
      ).hostname
        .toLowerCase()
        .replace(/^www\./, "");
      return h || null;
    } catch {
      return null;
    }
  }
}

export function findSiteByHostKey<T extends { id: string; url: string; locked: boolean }>(
  sites: T[],
  hostKey: string,
  excludeId?: string,
): T | undefined {
  const key = hostKey.toLowerCase();
  return sites.find((s) => {
    if (excludeId && s.id === excludeId) return false;
    return hostKeyFromStoredUrl(s.url) === key;
  });
}

/** Registrable domain (eTLD+1) for RDAP/WHOIS. */
export function registrableDomain(hostnameOrUrl: string): string | null {
  let host = hostnameOrUrl.trim().toLowerCase();
  try {
    if (host.includes("/") || host.includes(":")) {
      host = new URL(/^https?:\/\//i.test(host) ? host : `https://${host}`).hostname;
    }
  } catch {
    /* use as-is */
  }
  host = host.replace(/^www\./, "");
  const domain = parseTld(host).domain;
  return domain || null;
}
