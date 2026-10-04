import tls from "tls";
import { URL } from "url";
import { normalizeSiteUrl } from "./url";
import { checkDomainExpiry, type DomainResult } from "./checks-domain";
import { guardedLookup, isBlockedIp } from "./net-guard";
import { describeRequestError, probeOnce } from "./safe-request";
import net from "node:net";

export type { DomainResult };
export { checkDomainExpiry };

export type UptimeResult = {
  status: "up" | "down" | "error";
  statusCode: number | null;
  latencyMs: number | null;
  error: string | null;
  finalUrl?: string | null;
};

export type SslResult = {
  expiresAt: Date | null;
  daysLeft: number | null;
  error: string | null;
};

function checkTargetUrl(rawUrl: string): string {
  try {
    return normalizeSiteUrl(rawUrl).url;
  } catch {
    let u = rawUrl.trim();
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    const parsed = new URL(u);
    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = "/";
    return `${parsed.protocol}//${parsed.hostname}`;
  }
}

function apexFallbackUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.toLowerCase().startsWith("www.")) return null;
    parsed.hostname = parsed.hostname.replace(/^www\./i, "");
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return null;
  }
}

function isTlsHostnameError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? `${err.message} ${String((err as { cause?: unknown }).cause ?? "")}`
      : String(err);
  return /CERT_ALTNAME|hostname\/IP does not match|altname|SSL|TLS|fetch failed/i.test(msg);
}

/** Per-hop and whole-check time limits for the uptime request. */
const HOP_TIMEOUT_MS = 10_000;
const UPTIME_BUDGET_MS = 15_000;
const MAX_REDIRECTS = 5;

/**
 * GET the site, following up to MAX_REDIRECTS redirects by hand: every hop is re-validated
 * (http/https only, allowed ports, public addresses only) before we connect, so a public URL
 * can't bounce us to 127.0.0.1 or the cloud metadata address.
 */
export async function fetchUptimeOnce(url: string): Promise<UptimeResult> {
  const started = Date.now();
  let current = url;
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const left = UPTIME_BUDGET_MS - (Date.now() - started);
      if (left <= 0) throw Object.assign(new Error("Timed out"), { code: "ETIMEDOUT" });
      const res = await probeOnce(current, Math.min(HOP_TIMEOUT_MS, left));

      if (res.status >= 300 && res.status < 400 && res.location) {
        if (hop === MAX_REDIRECTS) break;
        current = new URL(res.location, current).toString();
        continue;
      }

      const ok = res.status >= 200 && res.status < 400;
      return {
        status: ok ? "up" : "down",
        statusCode: res.status,
        latencyMs: Date.now() - started,
        error: ok ? null : `HTTP ${res.status}`,
        finalUrl: current,
      };
    }
    return {
      status: "error",
      statusCode: null,
      latencyMs: Date.now() - started,
      error: "Too many redirects",
      finalUrl: current,
    };
  } catch (err) {
    return {
      status: "error",
      statusCode: null,
      latencyMs: Date.now() - started,
      error: describeRequestError(err),
      finalUrl: null,
    };
  }
}

export async function checkUptime(rawUrl: string): Promise<UptimeResult> {
  const primary = checkTargetUrl(rawUrl);
  const first = await fetchUptimeOnce(primary);
  if (first.status !== "error") return first;

  // Certs that omit www (e.g. www.ullam.ai → CN=ullam.ai) fail TLS before redirects.
  if (isTlsHostnameError(first.error) || first.error) {
    const apex = apexFallbackUrl(primary);
    if (apex && apex !== primary) {
      const second = await fetchUptimeOnce(apex);
      if (second.status !== "error") return second;
      return { ...second, error: second.error || first.error };
    }
  }
  return first;
}

function sslConnect(host: string, port: number): Promise<SslResult> {
  return new Promise((resolve) => {
    if ((port !== 443 && port !== 8443) || (net.isIP(host) && isBlockedIp(host))) {
      resolve({ expiresAt: null, daysLeft: null, error: "Blocked: private or reserved address" });
      return;
    }
    const socket = tls.connect(
      {
        host,
        port,
        servername: net.isIP(host) ? undefined : host,
        rejectUnauthorized: false,
        timeout: 8000,
        lookup: guardedLookup as never,
      },
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
        } catch {
          socket.destroy();
          resolve({
            expiresAt: null,
            daysLeft: null,
            error: "SSL read failed",
          });
        }
      },
    );
    socket.on("error", (err) => {
      socket.destroy();
      resolve({ expiresAt: null, daysLeft: null, error: describeRequestError(err) });
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ expiresAt: null, daysLeft: null, error: "SSL timeout" });
    });
  });
}

export async function checkSsl(rawUrl: string, preferUrl?: string | null): Promise<SslResult> {
  const candidates: string[] = [];
  for (const u of [preferUrl, rawUrl]) {
    if (!u) continue;
    try {
      candidates.push(checkTargetUrl(u));
    } catch {
      /* skip */
    }
  }
  for (const c of [...candidates]) {
    const apex = apexFallbackUrl(c);
    if (apex) candidates.push(apex);
  }

  const seen = new Set<string>();
  let last: SslResult = { expiresAt: null, daysLeft: null, error: "Invalid URL" };
  for (const url of candidates) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      continue;
    }
    if (parsed.protocol !== "https:") {
      last = { expiresAt: null, daysLeft: null, error: "Not HTTPS" };
      continue;
    }
    const host = parsed.hostname;
    if (seen.has(host)) continue;
    seen.add(host);
    last = await sslConnect(host, parsed.port ? Number(parsed.port) : 443);
    if (last.expiresAt) return last;
  }
  return last;
}

export async function runFullSiteCheck(rawUrl: string) {
  const uptime = await checkUptime(rawUrl);
  const [ssl, domain] = await Promise.all([
    checkSsl(rawUrl, uptime.finalUrl),
    checkDomainExpiry(rawUrl),
  ]);
  return { uptime, ssl, domain };
}
