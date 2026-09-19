import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-medium text-ink">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted">Last updated: September 19, 2026</p>
      <div className="mt-8 space-y-6 leading-relaxed text-ink">
        <p className="text-muted">
          These Terms govern your use of Websites With Punch at websiteswithpunch.com. By creating
          an account or using the service, you agree to these Terms.
        </p>
        <h2 className="font-display text-xl font-medium text-ink">Service</h2>
        <p className="text-muted">
          We provide website health monitoring including uptime checks, SSL expiry lookups, and
          best-effort domain expiry lookups. Monitoring is informational and may be delayed,
          incomplete, or unavailable. Domain expiry relies on public RDAP/WHOIS sources and is not
          guaranteed.
        </p>
        <h2 className="font-display text-xl font-medium text-ink">Accounts & plans</h2>
        <p className="text-muted">
          Free accounts may monitor 1 site. Pro accounts may monitor up to 10 sites for $12 per
          month, billed via Stripe. You are responsible for keeping credentials secure and for the
          URLs you submit.
        </p>
        <h2 className="font-display text-xl font-medium text-ink">Acceptable use</h2>
        <p className="text-muted">
          Do not use the service to attack, scrape abusively, or monitor systems you are not
          authorized to check. We may suspend accounts that abuse the platform.
        </p>
        <h2 className="font-display text-xl font-medium text-ink">Payments</h2>
        <p className="text-muted">
          Paid subscriptions renew until canceled through the Stripe Customer Portal. Fees are
          non-refundable except where required by law.
        </p>
        <h2 className="font-display text-xl font-medium text-ink">Disclaimer</h2>
        <p className="text-muted">
          THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND. We are not liable for
          downtime of your sites, missed alerts, expired certificates/domains, or consequential
          damages to the maximum extent permitted by law.
        </p>
        <h2 className="font-display text-xl font-medium text-ink">Contact</h2>
        <p className="text-muted">
          <a className="text-accent hover:underline" href="mailto:hello@websiteswithpunch.com">
            hello@websiteswithpunch.com
          </a>
        </p>
      </div>
    </div>
  );
}
