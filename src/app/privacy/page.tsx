import type { Metadata } from "next";
import Link from "next/link";
import { InAppBackLink } from "@/components/InAppBackLink";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <InAppBackLink />

      <h1 className="font-display text-3xl font-medium text-ink">
        Privacy Policy
      </h1>

      <p className="mt-2 text-sm text-muted">
        Last updated: October 1, 2026
      </p>

      <div className="mt-8 space-y-6 leading-relaxed text-ink">
        <p>
          Websites With Punch is a product operated by{" "}
          <strong>Makvion Technologies</strong> (&quot;we&quot;, &quot;us&quot;, or
          &quot;our&quot;).
          This Privacy Policy explains how we collect, use, store, and protect
          information when you use{" "}
          <a
            className="text-accent hover:underline"
            href="https://websiteswithpunch.com"
          >
            websiteswithpunch.com
          </a>{" "}
          and our website health monitoring service.
        </p>

        <h2 className="font-display text-xl font-medium text-ink">
          Information We Collect
        </h2>

        <ul className="list-disc space-y-2 pl-5 text-muted">
          <li>
            <strong>Account details:</strong> name, email address, and hashed
            password.
          </li>
          <li>
            <strong>Monitored sites:</strong> URLs and names you submit, along
            with monitoring results and certificate/domain metadata associated
            with those sites.
          </li>
          <li>
            <strong>Billing information:</strong> payments and payment card
            details are handled by Stripe. We store Stripe customer,
            subscription, and payment-related identifiers and status as needed
            to operate your account. We do not store full payment card
            numbers.
          </li>
          <li>
            <strong>Technical data:</strong> basic server logs, IP addresses,
            device/browser information, and other technical information that
            may be necessary to operate, maintain, secure, and troubleshoot
            the service.
          </li>
          <li>
            <strong>Communications:</strong> information you provide when you
            contact us for support or otherwise communicate with us.
          </li>
        </ul>

        <h2 className="font-display text-xl font-medium text-ink">
          How We Use Information
        </h2>

        <ul className="list-disc space-y-2 pl-5 text-muted">
          <li>To provide uptime, SSL, and domain monitoring.</li>
          <li>To create and manage user accounts.</li>
          <li>To authenticate users and enforce plan and usage limits.</li>
          <li>To process subscriptions and payments.</li>
          <li>To provide customer support and respond to requests.</li>
          <li>To maintain, secure, and improve the service.</li>
          <li>To detect, prevent, and investigate abuse, fraud, or security incidents.</li>
          <li>To comply with applicable legal and regulatory requirements.</li>
        </ul>

        <h2 className="font-display text-xl font-medium text-ink">
          Payment Processing
        </h2>

        <p className="text-muted">
          Payments for paid plans are processed by Stripe. When you subscribe
          to a paid plan, Stripe may collect and process payment information
          in accordance with its own privacy policy and terms.
        </p>

        <p className="text-muted">
          We receive limited information from Stripe, such as customer and
          subscription identifiers, payment status, and billing-related
          information necessary to manage your account. We do not store your
          full payment card number on our systems.
        </p>

        <h2 className="font-display text-xl font-medium text-ink">
          Sharing of Information
        </h2>

        <p className="text-muted">
          We may share information with service providers and processors that
          are necessary to operate Websites With Punch. These may include
          hosting and infrastructure providers, payment processors such as
          Stripe, email or communications providers, analytics or security
          providers, and other vendors that support our operations.
        </p>

        <p className="text-muted">
          We may also disclose information when reasonably necessary to comply
          with applicable law, respond to lawful requests, protect our rights
          or property, investigate fraud or abuse, or protect the security of
          our users and services.
        </p>

        <p className="text-muted">
          We do not sell personal information.
        </p>

        <h2 className="font-display text-xl font-medium text-ink">
          Data Retention
        </h2>

        <p className="text-muted">
          We retain account and monitoring information for as long as
          reasonably necessary to provide the service, maintain business and
          financial records, resolve disputes, enforce our agreements, and
          comply with legal obligations.
        </p>

        <p className="text-muted">
          You may request deletion of your account and personal information by
          contacting us. Certain information may need to be retained where
          required by law or reasonably necessary for legitimate business
          purposes.
        </p>

        <p className="text-muted">
          Monitoring and check history may be automatically deleted or pruned
          periodically in accordance with our operational requirements.
        </p>

        <h2 className="font-display text-xl font-medium text-ink">
          Security
        </h2>

        <p className="text-muted">
          We use reasonable technical and organizational measures designed to
          protect information from unauthorized access, loss, misuse, or
          alteration. Passwords are securely hashed, and access to production
          systems is restricted.
        </p>

        <p className="text-muted">
          However, no method of transmission or storage over the Internet is
          completely secure, and we cannot guarantee absolute security.
        </p>

        <h2 className="font-display text-xl font-medium text-ink">
          Your Rights
        </h2>

        <p className="text-muted">
          Depending on your location and applicable law, you may have rights
          regarding your personal information, including rights to access,
          correct, delete, or restrict certain processing of your information.
        </p>

        <p className="text-muted">
          To make a privacy-related request, please contact us using the
          information below. We may need to verify your identity before
          completing certain requests.
        </p>

        <h2 className="font-display text-xl font-medium text-ink">
          Changes to This Policy
        </h2>

        <p className="text-muted">
          We may update this Privacy Policy from time to time. When we make
          material changes, we may update the &quot;Last updated&quot; date on
          this page
          and provide additional notice where appropriate.
        </p>

        <h2 className="font-display text-xl font-medium text-ink">
          Contact
        </h2>

        <p className="text-muted">
          Websites With Punch is operated by{" "}
          <strong>Makvion Technologies</strong>.
        </p>

        <p className="text-muted">
          Questions or privacy requests? Use our{" "}
          <Link
            className="text-accent hover:underline"
            href="/contact?topic=general"
          >
            contact form
          </Link>{" "}
          or email{" "}
          <a
            className="text-accent hover:underline"
            href="mailto:hello@websiteswithpunch.com"
          >
            hello@websiteswithpunch.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}