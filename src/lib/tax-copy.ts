/**
 * Tax wording, in one place. Catalog prices ($12 / $42 / $120 / $420 and packs) exclude tax;
 * Dodo Payments (merchant of record) calculates any tax, e.g. GST, per customer location.
 * Never show a fixed percentage: Dodo decides the rate.
 */

/** Pricing and new-subscription checkout (the hosted Dodo page lists tax before you pay). */
export const TAX_NOTE_CHECKOUT =
  "Prices in USD. Applicable taxes (e.g. GST) are calculated at checkout and shown before you pay.";

/** Charges to the saved card (upgrade, annual switch, extra pack): no checkout page. */
export const TAX_NOTE_SAVED_CARD =
  "Applicable taxes (e.g. GST) are calculated by Dodo Payments. Your receipt shows the exact total charged.";

/** "Tax: $4.32 (calculated by Dodo Payments)" when Dodo's preview reports tax, else null. */
export function taxLine(formatted: string | null | undefined): string | null {
  return formatted ? `Tax: ${formatted} (calculated by Dodo Payments)` : null;
}

/** Plan page totals and renewals. */
export const TAX_NOTE_PLAN =
  "Prices exclude applicable taxes (e.g. GST), which Dodo Payments adds to each payment.";

/** After checkout: the amount paid can differ from the plan price by the tax Dodo added. */
export const RECEIPT_NOTE =
  "Your Dodo Payments receipt shows the total paid, including any applicable tax (e.g. GST).";
