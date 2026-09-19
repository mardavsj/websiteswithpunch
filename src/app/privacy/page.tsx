import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 prose prose-slate">
      <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: September 19, 2026</p>
      <div className="mt-8 space-y-6 text-slate-700 leading-relaxed">
        <p>
          Websites With Punch (“we”, “us”) operates websiteswithpunch.com. This policy explains how
          we collect, use, and protect information when you use our website health monitoring
          service.
        </p>
        <h2 className="text-xl font-semibold text-slate-900">Information we collect</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Account details: name, email address, and hashed password.</li>
          <li>Monitored sites: URLs and names you submit, plus check results and certificate/domain metadata.</li>
          <li>Billing: handled by Stripe. We store Stripe customer/subscription IDs and status. We do not store full card numbers.</li>
          <li>Technical data: basic server logs needed to operate and secure the service.</li>
        </ul>
        <h2 className="text-xl font-semibold text-slate-900">How we use information</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>To provide uptime, SSL, and domain monitoring.</li>
          <li>To authenticate users and enforce plan limits.</li>
          <li>To process subscriptions and respond to support requests.</li>
          <li>To improve reliability and prevent abuse.</li>
        </ul>
        <h2 className="text-xl font-semibold text-slate-900">Sharing</h2>
        <p>
          We share data with processors necessary to run the product (e.g. hosting providers and
          Stripe for payments). We do not sell personal information.
        </p>
        <h2 className="text-xl font-semibold text-slate-900">Data retention</h2>
        <p>
          We retain account and monitoring data while your account is active. You may request
          deletion by contacting us. Check history may be pruned periodically.
        </p>
        <h2 className="text-xl font-semibold text-slate-900">Security</h2>
        <p>
          Passwords are hashed. Access to production systems is restricted. No method of
          transmission over the Internet is 100% secure.
        </p>
        <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
        <p>
          Questions:{" "}
          <a className="text-indigo-600 hover:underline" href="mailto:hello@websiteswithpunch.com">
            hello@websiteswithpunch.com
          </a>
        </p>
      </div>
    </div>
  );
}
