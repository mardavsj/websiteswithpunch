import tls from "tls";
import { URL } from "url";
import { extractHostname, extractRootDomain, normalizeUrl } from "./utils";

export type UptimeResult = {
  status: "up" | "down" | "error";
  statusCode: number | null;
  latencyMs: number | null;
  error: string | null;
};

export type SslResult = {
  expiresAt: Date | null;
  daysLeft: number | null;
  error: string | null;
};

export type DomainResult = {
  expiresAt: Date | null;
  daysLeft: number | null;
  error: string | null;
};

export async function checkUptime(rawUrl: string): Promise<UptimeResult> {
  const url = normalizeUrl(rawUrl);
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "WebsitesWithPunch-Monitor/1.0" },
      cache: "no-store",
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - started;
    const ok = res.status >= 200 && res.status < 400;
    return {
      status: ok ? "up" : "down",
      statusCode: res.status,
      latencyMs,
      error: ok ? null : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      status: "error",
      statusCode: null,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }
}

export async function checkSsl(rawUrl: string): Promise<SslResult> {
  const url = normalizeUrl(rawUrl);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { expiresAt: null, daysLeft: null, error: "Invalid URL" };
  }

  if (parsed.protocol !== "https:") {
    return { expiresAt: null, daysLeft: null, error: "Not HTTPS" };
  }

  const host = parsed.hostname;
  const port = parsed.port ? Number(parsed.port) : 443;

  return new Promise((resolve) => {
    const socket = tls.connect(
      { host, port, servername: host, rejectUnauthorized: false, timeout: 10000 },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          socket.end();
          if (!cert || !cert.valid_to) {
            resolve({ expiresAt: null, daysLeft: null, error: "No certificate" });
            return;
          }
          const expiresAt = new Date(cert.valid_to);
          const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          resolve({ expiresAt, daysLeft, error: null });
        } catch (err) {
          socket.destroy();
          resolve({
            expiresAt: null,
            daysLeft: null,
            error: err instanceof Error ? err.message : "SSL read failed",
          });
        }
      }
    );
    socket.on("error", (err) => {
      resolve({ expiresAt: null, daysLeft: null, error: err.message });
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ expiresAt: null, daysLeft: null, error: "SSL timeout" });
    });
  });
}

async function fetchRdap(domain: string): Promise<DomainResult> {
  try {
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: { Accept: "application/rdap+json, application/json" },
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (!res.ok) {
      return { expiresAt: null, daysLeft: null, error: `RDAP HTTP ${res.status}` };
    }
    const data = (await res.json()) as {
      events?: Array<{ eventAction?: string; eventDate?: string }>;
    };
    const expiryEvent = data.events?.find(
      (e) =>
        e.eventAction === "expiration" ||
        e.eventAction === "expiration date" ||
        e.eventAction === "expiry"
    );
    if (!expiryEvent?.eventDate) {
      return { expiresAt: null, daysLeft: null, error: "No expiry in RDAP" };
    }
    const expiresAt = new Date(expiryEvent.eventDate);
    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return { expiresAt, daysLeft, error: null };
  } catch (err) {
    return {
      expiresAt: null,
      daysLeft: null,
      error: err instanceof Error ? err.message : "RDAP failed",
    };
  }
}

async function fetchWhoisFallback(domain: string): Promise<DomainResult> {
  try {
    // Best-effort public WHOIS JSON proxies / registries
    const endpoints = [
      `https://whois.freeaiapi.xyz/?name=${encodeURIComponent(domain)}`,
      `https://api.whois.vu/?q=${encodeURIComponent(domain)}`,
    ];
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          signal: AbortSignal.timeout(10000),
          cache: "no-store",
        });
        if (!res.ok) continue;
        const data = (await res.json()) as Record<string, unknown>;
        const raw =
          (data.expires as string) ||
          (data.expiry as string) ||
          (data.expiration_date as string) ||
          (data.Registry_Expiry_Date as string) ||
          (typeof data.whois === "string"
            ? (data.whois.match(/Expir(?:y|ation)\s*Date:\s*(.+)/i)?.[1] ?? null)
            : null);
        if (!raw) continue;
        const expiresAt = new Date(String(raw).trim());
        if (Number.isNaN(expiresAt.getTime())) continue;
        const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return { expiresAt, daysLeft, error: null };
      } catch {
        continue;
      }
    }
    return { expiresAt: null, daysLeft: null, error: "WHOIS unavailable" };
  } catch (err) {
    return {
      expiresAt: null,
      daysLeft: null,
      error: err instanceof Error ? err.message : "WHOIS failed",
    };
  }
}

export async function checkDomainExpiry(rawUrl: string): Promise<DomainResult> {
  const hostname = extractHostname(rawUrl);
  const root = extractRootDomain(hostname);
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

export async function runFullSiteCheck(rawUrl: string) {
  const [uptime, ssl, domain] = await Promise.all([
    checkUptime(rawUrl),
    checkSsl(rawUrl),
    checkDomainExpiry(rawUrl),
  ]);
  return { uptime, ssl, domain };
}
