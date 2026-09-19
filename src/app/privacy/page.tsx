import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-medium text-ink">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: September 19, 2026</p>
      <div className="mt-8 space-y-6 leading-relaxed text-ink">
        <p>
          Websites With Punch (“we”, “us”) operates websiteswithpunch.com. This policy explains how
          we collect, use, and protect information when you use our website health monitoring
          service.
        </p>
        <h2 className="font-display text-xl font-medium text-ink">Information we collect</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted">
          <li>Account details: name, email address, and hashed password.</li>
          <li>Monitored sites: URLs and names you submit, plus check results and certificate/domain metadata.</li>
          <li>Billing: handled by Stripe. We store Stripe customer/subscription IDs and status. We do not store full card numbers.</li>
          <li>Technical data: basic server logs needed to operate and secure the service.</li>
        </ul>
        <h2 className="font-display text-xl font-medium text-ink">How we use information</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted">
          <li>To provide uptime, SSL, and domain monitoring.</li>
          <li>To authenticate users and enforce plan limits.</li>
          <li>To process subscriptions and respond to support requests.</li>
          <li>To improve reliability and prevent abuse.</li>
        </ul>
        <h2 className="font-display text-xl font-medium text-ink">Sharing</h2>
        <p className="text-muted">
          We share data with processors necessary to run the product (e.g. hosting providers and
          Stripe for payments). We do not sell personal information.
        </p>
        <h2 className="font-display text-xl font-medium text-ink">Data retention</h2>
        <p className="text-muted">
          We retain account and monitoring data while your account is active. You may request
          deletion by contacting us. Check history may be pruned periodically.
        </p>
        <h2 className="font-display text-xl font-medium text-ink">Security</h2>
        <p className="text-muted">
          Passwords are hashed. Access to production systems is restricted. No method of
          transmission over the Internet is 100% secure.
        </p>
        <h2 className="font-display text-xl font-medium text-ink">Contact</h2>
        <p className="text-muted">
          Questions:{" "}
          <a className="text-accent hover:underline" href="mailto:hello@websiteswithpunch.com">
            hello@websiteswithpunch.com
          </a>
        </p>
      </div>
    </div>
  );
}
