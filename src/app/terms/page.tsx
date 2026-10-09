import type { Metadata } from "next";
import { A, H2, LegalContact, LegalPage, P } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use Websites With Punch, a website monitoring software subscription by Makvion Technologies.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="October 4, 2026" path="/terms">
      <P>
        These Terms govern your use of Websites With Punch at{" "}
        <a className="text-accent underline underline-offset-2 hover:no-underline" href="https://websiteswithpunch.com">
          websiteswithpunch.com
        </a>
        , a software product operated by <strong>Makvion Technologies</strong>, based in India
        (&quot;we&quot;, &quot;us&quot;). By creating an account or using the service, you agree to
        these Terms, our <A href="/privacy">Privacy Policy</A> and our{" "}
        <A href="/refund-policy">Refund &amp; Cancellation Policy</A>.
      </P>

      <H2>About the Service</H2>
      <P>
        Websites With Punch is a software-as-a-service (SaaS) subscription for website health
        monitoring: uptime checks, SSL certificate expiry checks and best-effort domain expiry
        lookups, shown on an online dashboard. It is a digital service you use in your browser
        right after you sign up. No physical goods are sold or shipped.
      </P>
      <P>
        Monitoring is informational and may be delayed, incomplete, or unavailable. Domain expiry
        information relies on public RDAP/WHOIS sources and is not guaranteed to be accurate or
        continuously available.
      </P>

      <H2>Accounts &amp; Plans</H2>
      <P>
        Free accounts may monitor 1 site. Paid plans (Pro and Business) monitor more sites, with
        optional site packs, and are billed monthly or yearly at the prices shown on our{" "}
        <A href="/pricing">Pricing</A> page.
      </P>
      <P>
        You are responsible for keeping your account credentials secure and for ensuring that the
        URLs and other information you submit to the service are accurate and that you are
        authorized to monitor the websites or systems you submit.
      </P>

      <H2>Acceptable Use</H2>
      <P>
        You must not use the service to attack, abuse, disrupt, or unauthorizedly access systems, or
        to perform abusive scraping or monitoring of systems you are not authorized to check.
      </P>
      <P>
        We may suspend or terminate accounts that violate these Terms, abuse the platform, or create
        a security or operational risk to the service or other users.
      </P>

      <H2>Payments &amp; Billing</H2>
      <P>
        Payments are processed by Dodo Payments, which acts as the merchant of record for your
        purchase: it sells the subscription to you on our behalf, collects payment and handles
        sales tax, VAT or GST where it applies. Its{" "}
        <A href="https://dodopayments.com/legal/buyer-terms">buyer terms</A> also apply to the
        payment, and its name may appear on your card statement. We never see or store your full
        card number.
      </P>
      <P>
        Paid subscriptions renew automatically at the end of each billing period (monthly or yearly)
        until canceled. You can cancel anytime from Your plan page or from the Dodo Payments
        customer portal (Manage billing).
      </P>
      <P>
        Prices are stated in USD unless otherwise specified. Applicable taxes may be added at
        checkout, and your bank may apply currency-conversion or other fees.
      </P>
      <P>
        Payments are non-refundable, including after you cancel, except in the limited cases set
        out in our <A href="/refund-policy">Refund &amp; Cancellation Policy</A>. When you cancel,
        downgrade, remove site packs, or switch from annual to monthly billing, no refund or credit
        is provided for the remaining time of the current billing period. You keep your current
        plan and capacity until the end of the period you have paid for, and the change takes
        effect at renewal.
      </P>
      <P>
        Upgrades and added site packs take effect immediately and are charged right away on a
        prorated basis: unused time on your current subscription is credited, the new total is
        charged, and your billing date moves to that day.
      </P>

      <H2>Disclaimer</H2>
      <P>
        THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND. We do not guarantee
        uninterrupted availability, continuous monitoring, or the accuracy or completeness of
        monitoring results.
      </P>
      <P>
        To the maximum extent permitted by applicable law, Makvion Technologies is not liable for
        downtime of your websites, missed or delayed status changes, expired certificates or domains,
        loss of data, business interruption, or consequential or indirect damages arising from your
        use of the service.
      </P>

      <H2>Changes to the Service</H2>
      <P>
        We may modify, improve, suspend, or discontinue features of the service from time to time.
        We will make reasonable efforts to communicate material changes where appropriate.
      </P>

      <H2>Changes to These Terms</H2>
      <P>
        We may update these Terms from time to time. When we make material changes, we will update
        the “Last updated” date on this page and provide additional notice where appropriate. Your
        continued use of the service after updated Terms become effective constitutes acceptance of
        the revised Terms.
      </P>

      <H2>Governing Law</H2>
      <P>
        These Terms are governed by the laws of India, and disputes arising from them or from the
        service are subject to the jurisdiction of the courts of India. This does not limit any
        rights you have under the mandatory consumer laws of the country where you live.
      </P>

      <LegalContact />
    </LegalPage>
  );
}
