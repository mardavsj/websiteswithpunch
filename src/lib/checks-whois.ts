import type { DomainResult } from "./checks-domain";
import { readCapped } from "./safe-request";

/** WHOIS-over-HTTP fallbacks for TLDs without a usable RDAP record (moved from checks-domain). */
const UA = "WebsitesWithPunch-Monitor/1.0";

function daysLeftFrom(expiresAt: Date): number {
  return Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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

export async function fetchWhoisFallback(domain: string): Promise<DomainResult> {
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
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      });
      if (!res.ok) {
        errors.push(`${endpoint}: HTTP ${res.status}`);
        continue;
      }
      const data = JSON.parse(await readCapped(res)) as Record<string, unknown>;
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
      return { expiresAt, daysLeft: daysLeftFrom(expiresAt), error: null, source: "WHOIS", server: new URL(endpoint).hostname };
    } catch {
      errors.push(`${endpoint}: request failed`);
    }
  }
  return { expiresAt: null, daysLeft: null, error: errors[0] || "WHOIS unavailable" };
}

