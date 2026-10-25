import { H2, P, UL } from "./LegalPage";
import { REFERRAL, fmtUsd, ratePercent } from "@/lib/referrals/config";

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
          You earn {ratePercent}% of every payment your referral makes for Pro or Business plans and
          site packs, calculated on the amount paid excluding tax (sales tax, VAT or GST). Free
          accounts earn nothing.
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
