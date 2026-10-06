import type { Metadata } from "next";
import { A, H2, LegalContact, LegalPage, P, UL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How Websites With Punch uses essential session cookies and privacy-friendly, cookieless analytics. No advertising cookies.",
  alternates: { canonical: "/cookie-policy" },
};

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy" updated="October 5, 2026" path="/cookie-policy">
      <P>
        This Cookie Policy explains how Websites With Punch, operated by{" "}
        <strong>Makvion Technologies</strong>, based in India, uses cookies and similar storage when
        you visit{" "}
        <a
          className="text-accent underline underline-offset-2 hover:no-underline"
          href="https://websiteswithpunch.com"
        >
          websiteswithpunch.com
        </a>
        . It sits alongside our <A href="/privacy">Privacy Policy</A>.
      </P>

      <H2>What Cookies Are</H2>
      <P>
        Cookies are small text files a website stores in your browser. Some keep you signed in;
        others are used for ads or tracking. We only use the first kind.
      </P>

      <H2>Essential Cookies (Necessary)</H2>
      <P>
        We use NextAuth (Auth.js) session cookies so you can stay logged in and so sign-in requests
        stay secure. These are necessary for the service to work and do not need consent.
      </P>
      <P>
        On the live site (HTTPS) the names are prefixed for security. In local development the
        prefix is omitted:
      </P>
      <UL>
        <li>
          <strong>__Secure-next-auth.session-token</strong> (or{" "}
          <code className="text-sm">next-auth.session-token</code>): your signed-in session. Lives up
          to 14 days, or until you sign out.
        </li>
        <li>
          <strong>__Host-next-auth.csrf-token</strong> (or{" "}
          <code className="text-sm">next-auth.csrf-token</code>): protects login and other auth
          actions from cross-site request forgery.
        </li>
        <li>
          <strong>__Secure-next-auth.callback-url</strong> (or{" "}
          <code className="text-sm">next-auth.callback-url</code>): remembers where to send you after
          you sign in (for example, back to the page you were trying to open).
        </li>
      </UL>
      <P>
        We do not use social login, so we do not set OAuth cookies such as PKCE, state or nonce.
      </P>

      <H2>Analytics (No Cookies)</H2>
      <P>
        On Vercel deployments we use <strong>Vercel Web Analytics</strong> and{" "}
        <strong>Speed Insights</strong> to count page views and measure how fast pages load. They
        are privacy-friendly, first-party style tools from our host: they do{" "}
        <strong>not set cookies</strong>, do not show ads and do not track you across other websites.
        Web Analytics uses a short-lived hash of the request instead of a cookie; Speed Insights
        reports anonymous performance metrics (such as Core Web Vitals). Neither runs in local
        development.
      </P>

      <H2>What We Do Not Use</H2>
      <P>
        We do not use advertising cookies, marketing pixels, social share trackers or other
        third-party ad trackers.
      </P>

      <H2>Local Storage (Not Cookies)</H2>
      <P>
        Your light/dark theme choice and a small layout hint (site counts and name lengths used to
        draw loading screens) are kept in your browser&apos;s local storage, not in cookies. Clearing
        site data removes them; the defaults return until you choose again.
      </P>

      <H2>How to Control Cookies</H2>
      <P>
        You can view, block or delete cookies in your browser settings. Blocking essential cookies
        or clearing them will sign you out, and you will need to log in again to use the dashboard.
        There is no cookie consent banner on this site because we only use necessary cookies and
        cookieless analytics.
      </P>

      <LegalContact />
    </LegalPage>
  );
}
