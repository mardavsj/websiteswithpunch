/** Payout breakdown maths (pure, shared by the admin drawer and tests). All amounts are integer cents. */
export type Line = { id: string; status: string; amountCents: number; baseCents: number; clawback: boolean; payoutId: string | null; clawbackPayoutId: string | null };

/**
 * included   = commissions this payout pays (requested/paid; a paid one reversed later stays here,
 *              it was paid at the time and is recovered as a deduction from a later payout)
 * removed    = commissions reversed before payment (shown struck through, not counted)
 * deductions = earlier paid-then-reversed commissions recovered from this payout
 */
export function breakdown(payoutId: string, amountCents: number, rows: Line[]) {
  const mine = rows.filter((r) => r.payoutId === payoutId);
  const included = mine.filter((r) => !(r.status === "reversed" && !r.clawback));
  const removed = mine.filter((r) => r.status === "reversed" && !r.clawback);
  const deductions = rows.filter((r) => r.clawbackPayoutId === payoutId);
  const gross = included.reduce((s, r) => s + r.amountCents, 0);
  const deducted = deductions.reduce((s, r) => s + r.amountCents, 0);
  const total = gross - deducted;
  return { included, removed, deductions, gross, deducted, total, ok: total === amountCents };
}

/** "1,234.50" rupees -> 123450 paise; null when empty or invalid. */
export function rupeesToPaise(v: unknown): number | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const s = String(v).replace(/,/g, "").trim();
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(s)) return null;
  const [r, p = ""] = s.split(".");
  const paise = Number(r) * 100 + Number((p + "00").slice(0, 2));
  return paise > 0 ? paise : null;
}

export const fmtInr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
