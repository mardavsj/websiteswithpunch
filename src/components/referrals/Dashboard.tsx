import Link from "next/link";
import { REFERRAL, fmtUsd } from "@/lib/referrals/config";
import { SITE_URL } from "@/lib/site-config";
import { referralSummary } from "@/lib/referrals/server";
import { ReferralHero } from "./ReferralHero";
import { Earnings } from "./Earnings";
import { PayoutForm } from "./PayoutForm";
import { History } from "./History";
import { HowItWorks } from "./HowItWorks";

/** Signed-in /referrals (streamed behind ReferralsSkeleton). */
export async function ReferralDashboard({ userId }: { userId: string }) {
  const s = await referralSummary(userId);
  const b = s.balances;
  const rows = s.rows.map((r) => ({
    id: r.id,
    status: r.status,
    amountCents: r.amountCents,
    baseCents: r.baseCents,
    clawback: r.clawback,
    availableAt: r.availableAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
    reversedReason: r.reversedReason,
  }));
  const payouts = s.payouts.map((p) => ({
    id: p.id,
    amountCents: p.amountCents,
    method: p.method,
    address: p.address,
    status: p.status,
    reference: p.reference,
    reason: p.reason,
    createdAt: p.createdAt.toISOString(),
    decidedAt: p.decidedAt?.toISOString() ?? null,
  }));
  const method = s.method === "paypal" || s.method === "upi" ? s.method : null;

  return (
    // Same page frame as /profile and /plan.
    <div className="mx-auto flex w-full max-w-6xl flex-1 items-center [align-items:safe_center] px-4 py-10 sm:px-6">
      <div className="w-full">
        <h1 className="font-display text-2xl font-medium text-ink sm:text-3xl">
          Referrals
        </h1>
        <div className="mt-6 space-y-4">
          <ReferralHero link={`${SITE_URL}/r/${s.code}`} />
          <Earnings
            balances={b}
            hasMethod={Boolean(method && s.address)}
            hasOpenRequest={s.hasOpenRequest}
          />
          <HowItWorks />
          <PayoutForm method={method} address={s.address} />
          <History
            rows={rows}
            payouts={payouts}
            clicks={s.clicks}
            signups={s.signups}
            paying={s.paying}
          />
          <p className="text-xs text-muted">
            Minimum payout {fmtUsd(REFERRAL.minPayoutCents)} ·{" "}
            USD subscriptions only ·{" "}
            <Link
              href="/terms#referrals"
              className="underline underline-offset-2 hover:text-accent"
            >
              Terms
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
