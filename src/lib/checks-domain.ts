import { extractHostname } from "./utils";
import { hostKeyFromStoredUrl, registrableDomain } from "./url";
import { readCapped } from "./safe-request";
import { fetchWhoisFallback } from "./checks-whois";

export type DomainResult = {
  expiresAt: Date | null;
  daysLeft: number | null;
  error: string | null;
  /** RDAP only (used by the public checker): registrar name and registration date. */
  registrar?: string | null;
  registeredAt?: Date | null;
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

type RdapEntity = { roles?: string[]; vcardArray?: [string, Array<[string, unknown, string, unknown]>] };
type RdapDoc = { events?: Array<{ eventAction?: string; eventDate?: string }>; entities?: RdapEntity[] };

function rdapRegistrar(data: RdapDoc): string | null {
  const ent = data.entities?.find((e) => e.roles?.includes("registrar"));
  const fn = ent?.vcardArray?.[1]?.find((f) => f[0] === "fn")?.[3];
  return typeof fn === "string" && fn.trim() ? fn.trim().slice(0, 120) : null;
}

function parseRdapExpiry(data: RdapDoc): DomainResult | null {
  const expiryEvent = data.events?.find((e) => isExpirationAction(e.eventAction));
  if (!expiryEvent?.eventDate) return null;
  const expiresAt = new Date(expiryEvent.eventDate);
  if (Number.isNaN(expiresAt.getTime())) return null;
  const reg = data.events?.find((e) => e.eventAction === "registration")?.eventDate;
  const registeredAt = reg && !Number.isNaN(Date.parse(reg)) ? new Date(reg) : null;
  return { expiresAt, daysLeft: daysLeftFrom(expiresAt), error: null, registrar: rdapRegistrar(data), registeredAt };
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
    return parseRdapExpiry(data) ?? { expiresAt: null, daysLeft: null, error: "No expiry in RDAP" };
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
  if (rdap.expiresAt) return rdap;
  const whois = await fetchWhoisFallback(root);
  if (whois.expiresAt) return whois;
  return {
    expiresAt: null,
    daysLeft: null,
    error: rdap.error || whois.error || "Could not resolve domain expiry",
  };
}
