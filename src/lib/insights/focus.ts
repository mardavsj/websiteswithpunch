import type { Fix, FixKey } from "./health";

export const FIX_KEYS: FixKey[] = ["uptime", "latency", "ssl", "domain"];

const NAMES: Record<FixKey, string> = { uptime: "uptime", latency: "response time", ssl: "SSL certificate", domain: "domain renewal" };

export function isFixKey(x: unknown): x is FixKey {
  return typeof x === "string" && (FIX_KEYS as string[]).includes(x);
}

/** Heading for a single-fix view, e.g. "Improve response time". */
export function fixTitle(k: FixKey): string {
  return `Improve ${NAMES[k]}`;
}

/**
 * Picks only the selected fix out of the full list. `fix` is null when that part already has
 * full marks (nothing to do); `others` counts the remaining fixes for the "See all fixes" link.
 */
export function focusFix(fixes: Fix[], key: FixKey): { fix: Fix | null; others: number } {
  const fix = fixes.find((f) => f.key === key) ?? null;
  return { fix, others: fixes.filter((f) => f.key !== key).length };
}
