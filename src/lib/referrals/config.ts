/** Referral program rules (shown on /referrals and in the Terms; change both together). */
export const REFERRAL = {
  /** 20% in basis points. */
  rateBps: 2000,
  /** $20.00 in cents. */
  minPayoutCents: 2000,
  attributionDays: 30,
  currency: "USD",
  cookie: "wwp_ref",
} as const;

/** Shared wording for what earns commission. */
export const SCOPE = "on Pro and Business plan payments (site packs excluded)";

export const ratePercent = REFERRAL.rateBps / 100;
export const fmtUsd = (cents: number) =>
  `${cents < 0 ? "-" : ""}$${(Math.abs(cents) / 100).toFixed(2)}`;
