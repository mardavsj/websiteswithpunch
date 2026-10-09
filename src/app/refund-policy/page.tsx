import type { Metadata } from "next";
import { A, H2, LegalContact, LegalPage, P, UL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "How cancelling and refunds work for Websites With Punch subscriptions: cancel anytime, keep your plan to the end of the paid period, no refunds except billing errors.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund & Cancellation Policy" updated="October 4, 2026" path="/refund-policy">
      <P>
        This policy explains how cancellations and refunds work for Websites With Punch, a website
        monitoring software subscription operated by <strong>Makvion Technologies</strong>. It is
        part of our <A href="/terms">Terms of Service</A>. The Free plan costs nothing and needs no
        card, so you can try the service before you pay.
      </P>

      <H2>What You Pay For</H2>
      <P>
        Pro and Business are subscriptions to our online service, billed in advance monthly or
        yearly in USD. Optional site packs are billed on the same schedule. Subscriptions renew
        automatically until you cancel. Current prices are on our <A href="/pricing">Pricing</A>{" "}
        page.
      </P>

      <H2>Refunds</H2>
      <P>
        Payments are not refunded, including after you cancel. This applies to monthly and annual
        plans, site packs, upgrade charges and renewals, and to any unused time left in a billing
        period. The only exceptions are listed under Exceptions below.
      </P>

      <H2>Cancelling</H2>
      <P>You can cancel anytime, with no cancellation fee:</P>
      <UL>
        <li>
          On <strong>Your plan</strong>, choose <strong>Cancel plan</strong>.
        </li>
        <li>
          Or open <strong>Manage billing</strong> (on Your plan or in your profile menu) and cancel
          in the billing portal.
        </li>
      </UL>
      <P>
        After you cancel, you keep your plan until the end of the period you have already paid
        for, and you are not charged again. Your account then moves to the Free plan. Nothing is
        deleted: sites beyond the Free limit are locked until you upgrade or free a slot. To avoid
        the next charge, cancel before your renewal date.
      </P>

      <H2>Plan Changes</H2>
      <UL>
        <li>
          <strong>Annual to monthly:</strong> the switch takes effect at your next renewal. You keep
          annual billing until then, with no refund or credit for the remaining months.
        </li>
        <li>
          <strong>Downgrades and removing site packs:</strong> take effect at renewal, with no
          refund or credit. You keep your current capacity until then.
        </li>
        <li>
          <strong>Upgrades and adding site packs:</strong> take effect immediately and are
          charged right away on a prorated basis: unused time on your current subscription is
          credited, the new total is charged, and your billing date moves to that day.
        </li>
      </UL>

      <H2>Exceptions</H2>
      <P>We will refund the affected amount in these cases:</P>
      <UL>
        <li>
          <strong>Duplicate charges:</strong> you were charged more than once for the same plan,
          site pack or billing period.
        </li>
        <li>
          <strong>Billing errors:</strong> you were charged a different amount from the price shown
          at checkout, or charged again after your cancellation took effect.
        </li>
        <li>
          <strong>Service not provided:</strong> a technical problem on our side means a paid plan
          or site pack you were charged for was never made available to you, and we can&apos;t fix
          it within a reasonable time.
        </li>
      </UL>
      <P>
        Please tell us within 30 days of the charge. Approved refunds go back to the original
        payment method and usually arrive within a few business days, depending on your bank.
      </P>
      <P>
        Payments are processed by Dodo Payments, the merchant of record for your purchase, which
        may also issue refunds under its{" "}
        <A href="https://dodopayments.com/legal/buyer-terms">buyer terms</A>. Nothing in this
        policy limits any right to a refund you have under applicable law.
      </P>

      <H2>Billing Help</H2>
      <P>
        For a billing question or to report a charge, use our{" "}
        <A href="/contact?topic=billing">contact form</A> with the Billing topic. Include the email
        on your account and the date and amount of the charge. Never send card numbers. Please
        contact us before disputing a charge with your bank, so we can sort it out quickly.
      </P>

      <LegalContact />
    </LegalPage>
  );
}
