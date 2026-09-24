/** Client-safe money / date formatting for billing UI (no Stripe import). */

export function formatChargeToday(amountCents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

/** e.g. "$18/month" from dollar amount (whole dollars preferred). */
export function formatMonthlyFromDollars(dollars: number, currency = "usd"): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
    minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(dollars);
  return `${formatted}/month`;
}

export function formatMonthlyFromCents(cents: number, currency = "usd"): string {
  return formatMonthlyFromDollars(cents / 100, currency);
}

/** "Oct 1" or "Oct 1, 2027" if not the current year. */
export function formatShortDate(isoOrDate: string | Date | null | undefined): string | null {
  if (!isoOrDate) return null;
  try {
    const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    const sameYear = d.getFullYear() === now.getFullYear();
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(sameYear ? {} : { year: "numeric" }),
    });
  } catch {
    return null;
  }
}

export function daysLeftUntil(unixSeconds: number | null | undefined, nowMs = Date.now()): number | null {
  if (typeof unixSeconds !== "number" || unixSeconds <= 0) return null;
  const ms = unixSeconds * 1000 - nowMs;
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86400000);
}
