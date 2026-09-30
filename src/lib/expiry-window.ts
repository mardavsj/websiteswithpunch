/**
 * Expiry meter math shared by the SSL and domain cards.
 * The window runs from when the site was added to the expiry date: full on
 * the day the site is added, shrinking to 0 at expiry.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type ExpiryWindow = {
  /** Days from window start (site added) to expiry. */
  windowDays: number;
  /** Remaining share of the window, 0–100 (0 when expired). */
  pct: number;
  expired: boolean;
  /** Remaining time at the window's midpoint (for the middle tick). */
  midDays: number;
};

export function expiryWindow(input: {
  days: number | null;
  expiresAt: string | null;
  addedAt?: string | null;
}): ExpiryWindow | null {
  const { days, expiresAt, addedAt } = input;
  if (days == null) return null;
  const remaining = Math.max(0, days);
  const expiryMs = expiresAt ? new Date(expiresAt).getTime() : NaN;
  const addedMs = addedAt ? new Date(addedAt).getTime() : NaN;

  let windowDays =
    Number.isFinite(expiryMs) && Number.isFinite(addedMs) ? (expiryMs - addedMs) / DAY_MS : NaN;
  // Unknown start, or remaining longer than the window (e.g. renewed / expiry
  // unknown when added): clamp so the bar reads 100%.
  if (!Number.isFinite(windowDays) || windowDays <= 0 || remaining > windowDays) {
    windowDays = remaining;
  }

  const expired = days <= 0;
  let pct = expired || windowDays <= 0 ? 0 : Math.round((remaining / windowDays) * 100);
  if (!expired && remaining > 0 && pct === 0) pct = 1;
  pct = Math.max(0, Math.min(100, pct));
  return { windowDays, pct, expired, midDays: windowDays / 2 };
}

/** Compact span for tick labels: "45d", "3 mo", "1y 2mo". */
export function formatSpanShort(days: number): string {
  const d = Math.max(0, Math.round(days));
  if (d < 60) return `${d}d`;
  if (d < 365) return `${Math.round(d / 30)} mo`;
  let y = Math.floor(d / 365);
  let mo = Math.round((d % 365) / 30);
  if (mo >= 12) {
    y += 1;
    mo = 0;
  }
  return mo ? `${y}y ${mo}mo` : `${y}y`;
}

/** Detailed remaining time: "12 days", "6 mo 13d", "1y 2mo". */
export function formatSpanLong(days: number): string {
  const d = Math.max(0, Math.round(days));
  if (d < 60) return `${d} day${d === 1 ? "" : "s"}`;
  if (d < 365) {
    const mo = Math.floor(d / 30);
    const rem = d % 30;
    return rem ? `${mo} mo ${rem}d` : `${mo} mo`;
  }
  return formatSpanShort(d);
}

export function formatDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
  });
}
