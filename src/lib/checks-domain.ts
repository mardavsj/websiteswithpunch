import { extractHostname } from "./utils";
import { hostKeyFromStoredUrl, registrableDomain } from "./url";

export type DomainResult = {
  expiresAt: Date | null;
  daysLeft: number | null;
  error: string | null;
};

const UA = "WebsitesWithPunch-Monitor/1.0";

const RDAP_HEADERS = {
  Accept: "application/rdap+json, application/json",
  "User-Agent": UA,
} as const;

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
      const data = (await res.json()) as { services?: Array<[string[], string[]]> };
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
  return `${base.replace(/\/+$/, "")}/domain/${domain}`;
}

function isExpirationAction(action: string | undefined): boolean {
  if (!action) return false;
  const a = action.toLowerCase().trim();
  if (a === "expiration" || a === "expiry" || a === "expiration date" || a === "registry expiration") {
    return true;
  }
  return a.includes("expir");
}

function daysLeftFrom(expiresAt: Date): number {
  return Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function parseRdapExpiry(data: {
  events?: Array<{ eventAction?: string; eventDate?: string }>;
}): DomainResult | null {
  const expiryEvent = data.events?.find((e) => isExpirationAction(e.eventAction));
  if (!expiryEvent?.eventDate) return null;
  const expiresAt = new Date(expiryEvent.eventDate);
  if (Number.isNaN(expiresAt.getTime())) return null;
  return { expiresAt, daysLeft: daysLeftFrom(expiresAt), error: null };
}

async function fetchRdapFromUrl(url: string): Promise<DomainResult> {
  try {
    const res = await fetch(url, {
      headers: RDAP_HEADERS,
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (!res.ok) return { expiresAt: null, daysLeft: null, error: `RDAP HTTP ${res.status}` };
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();
    if (
      !contentType.includes("json") &&
      !text.trimStart().startsWith("{") &&
      !text.trimStart().startsWith("[")
    ) {
      return { expiresAt: null, daysLeft: null, error: "RDAP returned non-JSON" };
    }
    let data: { events?: Array<{ eventAction?: string; eventDate?: string }> };
    try {
      data = JSON.parse(text) as typeof data;
    } catch {
      return { expiresAt: null, daysLeft: null, error: "RDAP JSON parse failed" };
    }
    return parseRdapExpiry(data) ?? { expiresAt: null, daysLeft: null, error: "No expiry in RDAP" };
  } catch (err) {
    return {
      expiresAt: null,
      daysLeft: null,
      error: err instanceof Error ? err.message : "RDAP failed",
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

  const redirector = await fetchRdapFromUrl(`https://rdap.org/domain/${domain}`);
  if (redirector.expiresAt) return redirector;
  if (redirector.error) errors.push(`rdap.org: ${redirector.error}`);

  return { expiresAt: null, daysLeft: null, error: errors[0] || "RDAP unavailable" };
}

function pickExpiryString(data: Record<string, unknown>): string | null {
  for (const key of [
    "expires", "expiry", "expiration", "expiration_date", "expiry_date",
    "Registry_Expiry_Date", "registry_expiry_date",
  ]) {
    const v = data[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const dates = data.dates;
  if (dates && typeof dates === "object" && !Array.isArray(dates)) {
    const d = dates as Record<string, unknown>;
    for (const key of ["expires", "expiry", "expiration", "expire", "registry_expiry"]) {
      const v = d[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  if (typeof data.whois === "string") {
    const m = data.whois.match(/Expir(?:y|ation)(?:\s*Date)?\s*:\s*(.+)/i);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

async function fetchWhoisFallback(domain: string): Promise<DomainResult> {
  const endpoints = [
    `https://who-dat.as93.net/${encodeURIComponent(domain)}`,
    `https://whois.freeaiapi.xyz/?name=${encodeURIComponent(domain)}`,
    `https://api.whois.vu/?q=${encodeURIComponent(domain)}`,
  ];
  const errors: string[] = [];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: { Accept: "application/json", "User-Agent": UA },
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      });
      if (!res.ok) {
        errors.push(`${endpoint}: HTTP ${res.status}`);
        continue;
      }
      const data = (await res.json()) as Record<string, unknown>;
      const raw = pickExpiryString(data);
      if (!raw) {
        errors.push(`${endpoint}: no expiry field`);
        continue;
      }
      const expiresAt = new Date(raw);
      if (Number.isNaN(expiresAt.getTime())) {
        errors.push(`${endpoint}: invalid date`);
        continue;
      }
      return { expiresAt, daysLeft: daysLeftFrom(expiresAt), error: null };
    } catch (err) {
      errors.push(`${endpoint}: ${err instanceof Error ? err.message : "request failed"}`);
    }
  }
  return { expiresAt: null, daysLeft: null, error: errors[0] || "WHOIS unavailable" };
}

/** Domain expiry via eTLD+1. Failures never mark the site down. */
export async function checkDomainExpiry(rawUrl: string): Promise<DomainResult> {
  const hostname = extractHostname(rawUrl);
  const root =
    registrableDomain(hostname) ||
    hostKeyFromStoredUrl(rawUrl) ||
    hostname.toLowerCase().replace(/^www\./, "");
  if (!root) {
    return { expiresAt: null, daysLeft: null, error: "Could not resolve domain" };
  }
  const rdap = await fetchRdap(root);
  if (rdap.expiresAt) return rdap;
  const whois = await fetchWhoisFallback(root);
  if (whois.expiresAt) return whois;
  return {
    expiresAt: null,
    daysLeft: null,
    error: rdap.error || whois.error || "Could not resolve domain expiry",
  };
}
