import type { Metadata } from "next";
import Link from "next/link";
import { InAppBackLink } from "@/components/InAppBackLink";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use Websites With Punch.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <InAppBackLink />

      <h1 className="font-display text-3xl font-medium text-ink">
        Terms of Service
      </h1>

      <p className="mt-2 text-sm text-muted">
        Last updated: October 1, 2026
      </p>

      <div className="mt-8 space-y-6 leading-relaxed text-ink">
        <p className="text-muted">
          These Terms govern your use of Websites With Punch at{" "}
          <a
            className="text-accent hover:underline"
            href="https://websiteswithpunch.com"
          >
            websiteswithpunch.com
          </a>
          . Websites With Punch is a product operated by{" "}
          <strong>Makvion Technologies</strong>. By creating an account or
          using the service, you agree to these Terms.
        </p>

        <h2 className="font-display text-xl font-medium text-ink">
          About the Service
        </h2>

        <p className="text-muted">
          Websites With Punch is operated by Makvion Technologies and provides
          website health monitoring services, including uptime checks, SSL
          expiry lookups, and best-effort domain expiry lookups.
        </p>

        <p className="text-muted">
          Monitoring is informational and may be delayed, incomplete, or
          unavailable. Domain expiry information relies on public RDAP/WHOIS
          sources and is not guaranteed to be accurate or continuously
          available.
        </p>

        <h2 className="font-display text-xl font-medium text-ink">
          Accounts & Plans
        </h2>

        <p className="text-muted">
          Free accounts may monitor 1 site. Paid plans (Pro and Business)
          monitor more sites, with optional site packs, and are billed monthly
          or yearly via Stripe at the prices shown on our website.
        </p>

        <p className="text-muted">
          You are responsible for keeping your account credentials secure and
          for ensuring that the URLs and other information you submit to the
          service are accurate and that you are authorized to monitor the
          websites or systems you submit.
        </p>

        <h2 className="font-display text-xl font-medium text-ink">
          Acceptable Use
        </h2>

        <p className="text-muted">
          You must not use the service to attack, abuse, disrupt, or
          unauthorizedly access systems, or to perform abusive scraping or
          monitoring of systems you are not authorized to check.
        </p>

        <p className="text-muted">
          We may suspend or terminate accounts that violate these Terms,
          abuse the platform, or create a security or operational risk to the
          service or other users.
        </p>

        <h2 className="font-display text-xl font-medium text-ink">
          Payments & Billing
        </h2>

        <p className="text-muted">
          Paid subscriptions are processed through Stripe and renew
          automatically at the end of each billing period (monthly or yearly)
          until canceled. You can cancel your subscription from your plan
          settings or through the Stripe Customer Portal, where available.
        </p>

        <p className="text-muted">
          Prices displayed on our website are stated in USD unless otherwise
          specified. Your payment provider or financial institution may apply
          additional currency-conversion fees or other charges.
        </p>

        <p className="text-muted">
          All payments are non-refundable, including after you cancel, except
          where a refund is required by applicable law. When you cancel,
          downgrade, remove site packs, or switch from annual to monthly
          billing, no refund or credit is provided for the remaining time of
          the current billing period. You retain your current plan and
          capacity until the end of the period you have paid for, and the
          change takes effect at renewal.
        </p>

        <p className="text-muted">
          Upgrades take effect immediately and may be charged on a
          prorated basis for the remainder of the current billing period.
        </p>

        <h2 className="font-display text-xl font-medium text-ink">
          Disclaimer
        </h2>

        <p className="text-muted">
          THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND. We
          do not guarantee uninterrupted availability, continuous monitoring,
          delivery of alerts, or the accuracy or completeness of monitoring
          results.
        </p>

        <p className="text-muted">
          To the maximum extent permitted by applicable law, Makvion
          Technologies is not liable for downtime of your websites, missed or
          delayed alerts, expired certificates or domains, loss of data,
          business interruption, or consequential or indirect damages arising
          from your use of the service.
        </p>

        <h2 className="font-display text-xl font-medium text-ink">
          Changes to the Service
        </h2>

        <p className="text-muted">
          We may modify, improve, suspend, or discontinue features of the
          service from time to time. We will make reasonable efforts to
          communicate material changes where appropriate.
        </p>

        <h2 className="font-display text-xl font-medium text-ink">
          Changes to These Terms
        </h2>

        <p className="text-muted">
          We may update these Terms from time to time. When we make material
          changes, we may update the “Last updated” date on this page and
          provide additional notice where appropriate. Your continued use of
          the service after updated Terms become effective constitutes
          acceptance of the revised Terms.
        </p>

        <h2 className="font-display text-xl font-medium text-ink">
          Contact
        </h2>

        <p className="text-muted">
          Websites With Punch is operated by{" "}
          <strong>Makvion Technologies</strong>.
        </p>

        <p className="text-muted">
          Questions? Use our{" "}
          <Link
            className="text-accent hover:underline"
            href="/contact?topic=general"
          >
            contact form
          </Link>{" "}
          or write to hello@websiteswithpunch.com.
        </p>
      </div>
    </div>
  );
}