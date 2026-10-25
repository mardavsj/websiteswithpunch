import { H2, P, UL } from "./LegalPage";
import { REFERRAL, fmtUsd, ratePercent, SCOPE } from "@/lib/referrals/config";

/** Terms section for the referral program (numbers come from lib/referrals/config). */
export function ReferralTerms() {
  return (
    <>
      <H2 id="referrals">Referral Program</H2>
      <P>
        Signed-in users can share a personal referral link. If someone signs up within{" "}
        {REFERRAL.attributionDays} days of first opening your link (the first link they open counts),
        they become your referral.
      </P>
      <UL>
        <li>
          You earn {ratePercent}% {SCOPE}, calculated on the plan amount excluding tax (sales tax,
          VAT or GST). When a payment also covers site packs, only the plan part counts; payments for
          site packs alone, and free accounts, earn nothing. For a prorated upgrade, only the plan
          part of the prorated charge counts.
        </li>
        <li>
          Each commission is available as soon as the payment goes through. If the payment is
          refunded (in rare exceptions) or disputed, its commission is reversed,
          including after it has been paid out, in which case it is deducted from your next payout.
        </li>
        <li>
          You can request a payout once your available balance is at least {fmtUsd(REFERRAL.minPayoutCents)}.
          Payouts are reviewed and sent manually in USD to the PayPal email or UPI ID you save, usually
          within 7 business days. Payment provider fees or currency conversion may apply.
        </li>
        <li>
          Referring yourself, creating fake or duplicate accounts, spam, paid ads on our brand name
          or any other fraud forfeits all commissions and can close your account.
        </li>
        <li>
          Each account can have only one referrer, which cannot be changed later. Commissions are not
          wages, and you are responsible for any taxes on them.
        </li>
        <li>
          We may change or end the program at any time. Commissions already available when it ends
          stay payable.
        </li>
      </UL>
    </>
  );
}
