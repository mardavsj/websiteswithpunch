import { normalizeSiteUrl, registrableDomain } from "./url";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** @deprecated Prefer normalizeSiteUrl — kept for callers that only need the stored URL string. */
export function normalizeUrl(input: string): string {
  return normalizeSiteUrl(input).url;
}

export function extractHostname(url: string): string {
  try {
    return normalizeSiteUrl(url).hostname;
  } catch {
    try {
      return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase();
    } catch {
      return url;
    }
  }
}

export function extractRootDomain(hostname: string): string {
  return registrableDomain(hostname) || hostname.toLowerCase().replace(/^www\./, "");
}

export function daysUntil(date: Date | null | undefined): number | null {
  if (!date) return null;
  const ms = date.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
