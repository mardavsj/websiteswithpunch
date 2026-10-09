/**
 * One wording for the next payment, shared by "Current plan" and "Your plan" so they never
 * disagree. Totals come from /api/billing/summary: today's total and the next renewal's total
 * (which already reflects a booked pack removal, downgrade or annual → monthly switch).
 */
export type NextPaymentInput = {
  cancelAtPeriodEnd?: boolean;
  nextPaymentDateFormatted?: string | null;
  nextTotalFormatted?: string | null;
  nextAmountFormatted?: string | null;
  nextChanges?: boolean;
};

/** "Next payment: $510 on Oct 9" or "From Oct 9: $420/year"; null when nothing renews. */
export function nextPaymentText(s: NextPaymentInput | null | undefined): string | null {
  if (!s || s.cancelAtPeriodEnd || !s.nextPaymentDateFormatted) return null;
  if (s.nextChanges && s.nextTotalFormatted) return `From ${s.nextPaymentDateFormatted}: ${s.nextTotalFormatted}`;
  if (s.nextAmountFormatted) return `Next payment: ${s.nextAmountFormatted} on ${s.nextPaymentDateFormatted}`;
  return null;
}
