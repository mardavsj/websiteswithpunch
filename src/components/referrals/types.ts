import type { Balances } from "@/lib/referrals/ledger";

export type CommissionRow = {
  id: string;
  status: string;
  amountCents: number;
  baseCents: number;
  clawback: boolean;
  availableAt: string;
  createdAt: string;
  reversedReason: string | null;
};

export type PayoutRow = {
  id: string;
  amountCents: number;
  method: string;
  address: string;
  status: string;
  reference: string | null;
  reason: string | null;
  createdAt: string;
  decidedAt: string | null;
};

export type ReferralData = {
  link: string;
  code: string;
  clicks: number;
  signups: number;
  paying: number;
  balances: Balances;
  rows: CommissionRow[];
  payouts: PayoutRow[];
  hasOpenRequest: boolean;
  method: "paypal" | "upi" | null;
  address: string | null;
};

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
