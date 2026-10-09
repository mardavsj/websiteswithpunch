import { extractHostname } from "./utils";
import { hostKeyFromStoredUrl, registrableDomain } from "./url";
import { readCapped } from "./safe-request";
import { fetchWhoisFallback } from "./checks-whois";
import { parseRdapDomain, type RdapDoc } from "./rdap-parse";

export type DomainResult = {
  expiresAt: Date | null;
  daysLeft: number | null;
  error: string | null;
  /** RDAP only: registrar, dates, nameservers and EPP status codes. */
  registrar?: string | null;
  registeredAt?: Date | null;
  updatedAt?: Date | null;
  nameservers?: string[];
  statuses?: string[];
  /** Which lookup answered ("RDAP" or "WHOIS") and the server that answered it. */
  source?: "RDAP" | "WHOIS";
  server?: string | null;
  /** Registrable domain that was looked up (e.g. example.co.uk). */
  domain?: string;
};

const UA = "WebsitesWithPunch-Monitor/1.0";

const RDAP_HEADERS = {
  Accept: "application/rdap+json, application/json",
  "User-Agent": UA,
} as const;

/** Never buffer more than this from a third-party RDAP/WHOIS reply. */
const MAX_BODY_BYTES = 1024 * 1024;

/** Registrable domains only (letters, digits, hyphens, dots; punycode for IDNs). */
const DOMAIN_RE = /^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/;

let ianaBootstrapPromise: Promise<Map<string, string[]>> | null = null;

async function loadIanaRdapBootstrap(): Promise<Map<string, string[]>> {
  if (!ianaBootstrapPromise) {
    ianaBootstrapPromise = (async () => {
      const res = await fetch("https://data.iana.org/rdap/dns.json", {
        headers: { Accept: "application/json", "User-Agent": UA },
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`IANA RDAP bootstrap HTTP ${res.status}`);
      const data = JSON.parse(await readCapped(res, 2 * MAX_BODY_BYTES)) as {
        services?: Array<[string[], string[]]>;
      };
      const map = new Map<string, string[]>();
      for (const service of data.services ?? []) {
        const [tlds, urls] = service;
        if (!Array.isArray(tlds) || !Array.isArray(urls)) continue;
        for (const tld of tlds) map.set(String(tld).toLowerCase(), urls.map(String));
      }
      return map;
    })().catch((err) => {
      ianaBootstrapPromise = null;
      throw err;
    });
  }
  return ianaBootstrapPromise;
}

function resolveRdapBases(domain: string, bootstrap: Map<string, string[]>): string[] {
  const labels = domain.toLowerCase().split(".").filter(Boolean);
  for (let i = 0; i < labels.length; i++) {
    const tld = labels.slice(i).join(".");
    const urls = bootstrap.get(tld);
    if (urls?.length) return urls;
  }
  return [];
}

function joinRdapDomainUrl(base: string, domain: string): string {
  return `${base.replace(/\/+$/, "")}/domain/${encodeURIComponent(domain)}`;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

async function fetchRdapFromUrl(url: string): Promise<DomainResult> {
  try {
    const res = await fetch(url, {
      headers: RDAP_HEADERS,
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return { expiresAt: null, daysLeft: null, error: `RDAP HTTP ${res.status}` };
    const contentType = res.headers.get("content-type") || "";
    const text = await readCapped(res);
    if (
      !contentType.includes("json") &&
      !text.trimStart().startsWith("{") &&
      !text.trimStart().startsWith("[")
    ) {
      return { expiresAt: null, daysLeft: null, error: "RDAP returned non-JSON" };
    }
    let data: RdapDoc;
    try {
      data = JSON.parse(text) as typeof data;
    } catch {
      return { expiresAt: null, daysLeft: null, error: "RDAP JSON parse failed" };
    }
    const parsed = parseRdapDomain(data);
    if (!parsed) return { expiresAt: null, daysLeft: null, error: "No expiry in RDAP" };
    return { ...parsed, source: "RDAP", server: hostOf(url) };
  } catch {
    return {
      expiresAt: null,
      daysLeft: null,
      error: "RDAP request failed",
    };
  }
}

async function fetchRdap(domain: string): Promise<DomainResult> {
  const errors: string[] = [];
  try {
    const bootstrap = await loadIanaRdapBootstrap();
    const bases = resolveRdapBases(domain, bootstrap);
    for (const base of bases) {
      const result = await fetchRdapFromUrl(joinRdapDomainUrl(base, domain));
      if (result.expiresAt) return result;
      if (result.error) errors.push(`${base}: ${result.error}`);
    }
    if (!bases.length) errors.push("No RDAP base for TLD in IANA bootstrap");
  } catch (err) {
    errors.push(err instanceof Error ? err.message : "IANA bootstrap failed");
  }

  const redirector = await fetchRdapFromUrl(`https://rdap.org/domain/${encodeURIComponent(domain)}`);
  if (redirector.expiresAt) return redirector;
  if (redirector.error) errors.push(`rdap.org: ${redirector.error}`);

  return { expiresAt: null, daysLeft: null, error: errors[0] || "RDAP unavailable" };
}

/** Whole domain-expiry lookup (RDAP + WHOIS fallbacks) never takes longer than this. */
const DOMAIN_BUDGET_MS = 20_000;

/** Domain expiry via eTLD+1, capped at DOMAIN_BUDGET_MS. Failures never mark the site down. */
export async function checkDomainExpiry(rawUrl: string): Promise<DomainResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<DomainResult>((resolve) => {
    timer = setTimeout(
      () => resolve({ expiresAt: null, daysLeft: null, error: "Domain lookup timed out" }),
      DOMAIN_BUDGET_MS,
    );
  });
  try {
    return await Promise.race([lookupDomainExpiry(rawUrl), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function lookupDomainExpiry(rawUrl: string): Promise<DomainResult> {
  const hostname = extractHostname(rawUrl);
  const root =
    registrableDomain(hostname) ||
    hostKeyFromStoredUrl(rawUrl) ||
    hostname.toLowerCase().replace(/^www\./, "");
  if (!root || !DOMAIN_RE.test(root)) {
    return { expiresAt: null, daysLeft: null, error: "Could not resolve domain" };
  }
  const rdap = await fetchRdap(root);
  if (rdap.expiresAt) return { ...rdap, domain: root };
  const whois = await fetchWhoisFallback(root);
  if (whois.expiresAt) return { ...whois, domain: root };
  return {
    expiresAt: null,
    daysLeft: null,
    error: rdap.error || whois.error || "Could not resolve domain expiry",
    domain: root,
  };
}
