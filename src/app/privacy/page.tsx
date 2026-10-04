import type { Metadata } from "next";
import { H2, LegalContact, LegalPage, P, UL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Websites With Punch collects, uses and protects your information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 4, 2026" path="/privacy">
      <p>
        Websites With Punch is a product operated by <strong>Makvion Technologies</strong>, based
        in India (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). This Privacy Policy explains
        how we collect, use, store, and protect information when you use{" "}
        <a className="text-accent underline underline-offset-2 hover:no-underline" href="https://websiteswithpunch.com">
          websiteswithpunch.com
        </a>{" "}
        and our website health monitoring service.
      </p>

      <H2>Information We Collect</H2>
      <UL>
        <li>
          <strong>Account details:</strong> name, email address, and hashed password.
        </li>
        <li>
          <strong>Monitored sites:</strong> URLs and names you submit, along with monitoring results
          and certificate/domain metadata associated with those sites.
        </li>
        <li>
          <strong>Billing information:</strong> payments and card details are handled by our
          payment partner. We store the customer, subscription and payment identifiers and status
          it gives us, as needed to operate your account. We never store full card numbers.
        </li>
        <li>
          <strong>Technical data:</strong> basic server logs, IP addresses, device/browser
          information, and other technical information needed to operate, secure, and troubleshoot
          the service.
        </li>
        <li>
          <strong>Communications:</strong> messages you send through our contact form (your name,
          email, topic and message) are stored in our database so none are lost, and are also
          emailed to our team.
        </li>
        <li>
          <strong>Email verification:</strong> at sign-up we email a 6-digit code and store only a
          hashed copy, which expires after 10 minutes. Unverified accounts with no sites are deleted
          after about 48 hours.
        </li>
        <li>
          <strong>Free tools:</strong> domains entered in our free checkers are looked up live,
          cached briefly and not linked to an account.
        </li>
      </UL>

      <H2>How We Use Information</H2>
      <UL>
        <li>To provide uptime, SSL, and domain monitoring.</li>
        <li>To create and manage user accounts.</li>
        <li>To authenticate users and enforce plan and usage limits.</li>
        <li>To process subscriptions and payments.</li>
        <li>To provide customer support and respond to requests.</li>
        <li>To maintain, secure, and improve the service.</li>
        <li>To detect, prevent, and investigate abuse, fraud, or security incidents.</li>
        <li>To comply with applicable legal and regulatory requirements.</li>
      </UL>

      <H2>Payment Processing</H2>
      <P>
        Payments for paid plans are processed by our payment partner, a third-party payment provider
        that may act as the merchant of record for your purchase. It collects and processes your
        payment details under its own privacy policy and terms.
      </P>
      <P>
        We receive limited information from it, such as customer and subscription identifiers,
        payment status, and billing details needed to manage your account. We do not store your
        full card number on our systems.
      </P>

      <H2>Service Providers</H2>
      <UL>
        <li>
          <strong>Vercel</strong> hosts the website and app. We use Vercel Web Analytics and Speed
          Insights to count page views and measure page speed; they use no cookies and don&apos;t
          track you across other sites.
        </li>
        <li>
          <strong>Neon</strong> hosts our database (in Singapore).
        </li>
        <li>
          <strong>Our payment partner</strong> processes payments for paid plans.
        </li>
        <li>
          <strong>Resend</strong> delivers our transactional email: sign-up verification codes,
          password reset links, password change confirmations and contact form messages to our team.
        </li>
        <li>
          To find domain expiry dates we send your site&apos;s domain name (never your account
          details) to public RDAP and WHOIS lookup services.
        </li>
      </UL>

      <H2>Cookies</H2>
      <P>
        We only use cookies needed to keep you signed in (a session cookie and related security
        cookies). We don&apos;t use advertising or tracking cookies. Your light/dark theme choice,
        and a small layout hint (site counts and name lengths) used to draw loading screens, are
        kept in your browser&apos;s local storage.
      </P>

      <H2>Sharing of Information</H2>
      <P>
        We share information only with the service providers listed above and others needed to run
        Websites With Punch, such as hosting, payment, email and security providers.
      </P>
      <P>
        We may also disclose information when reasonably necessary to comply with applicable law,
        respond to lawful requests, protect our rights or property, investigate fraud or abuse, or
        protect the security of our users and services.
      </P>
      <P>We do not sell personal information.</P>

      <H2>Data Retention</H2>
      <P>
        We retain account and monitoring information for as long as reasonably necessary to provide
        the service, keep business and financial records, resolve disputes, enforce our agreements,
        and comply with legal obligations.
      </P>
      <P>
        You may request deletion of your account and personal information by contacting us. Some
        information may need to be kept where required by law or for legitimate business purposes.
      </P>
      <P>
        Individual check results are kept for about 100 days and then deleted automatically; your
        sites&apos; current status stays until you remove them.
      </P>

      <H2>Security</H2>
      <P>
        We use reasonable technical and organizational measures designed to protect information
        from unauthorized access, loss, misuse, or alteration. Passwords are securely hashed, and
        access to production systems is restricted. No method of transmission or storage over the
        Internet is completely secure, so we cannot guarantee absolute security.
      </P>

      <H2>Your Rights</H2>
      <P>
        Depending on your location and applicable law (including India&apos;s data protection
        law), you may have rights to access, correct, delete, or restrict certain processing of
        your information. To make a request, contact us using the details below. We may need to
        verify your identity first.
      </P>

      <H2>Changes to This Policy</H2>
      <P>
        We may update this Privacy Policy from time to time. When we make material changes, we will
        update the &quot;Last updated&quot; date on this page and provide additional notice where
        appropriate.
      </P>

      <LegalContact lead="Questions or privacy requests?" />
    </LegalPage>
  );
}
