import Link from "next/link";
import { REFERRAL, fmtUsd, ratePercent } from "@/lib/referrals/config";

const STEPS = [
  { t: "Share your link", d: `Anyone who opens it and signs up within ${REFERRAL.attributionDays} days is linked to you. The first link they used counts.` },
  { t: "They pay, you earn", d: `You get ${ratePercent}% of every Pro, Business or site pack payment they make, before tax.` },
  { t: `${REFERRAL.holdDays}-day hold`, d: "Each commission waits out the refund window, then becomes available. Refunds and disputes reverse it." },
  { t: "Withdraw", d: `From ${fmtUsd(REFERRAL.minPayoutCents)}, request a payout to PayPal or UPI. We review and pay it by hand, usually within 5 business days.` },
];

export function HowItWorks() {
  return (
    <section className="border border-rule bg-surface">
      <header className="border-b border-rule px-4 py-2.5">
        <h3 className="label-caps !text-ink/80">How it works</h3>
      </header>
      <ol className="divide-y divide-rule">
        {STEPS.map((s, i) => (
          <li key={s.t} className="flex gap-3 px-4 py-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-accent/10 text-xs font-semibold tabular-nums text-accent">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{s.t}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="border-t border-rule px-4 py-3 text-xs leading-relaxed text-muted">
        Referring yourself or abusing the program forfeits commissions. Full rules in the{" "}
        <Link href="/terms#referrals" className="text-accent hover:underline">Terms</Link>.
      </p>
    </section>
  );
}
