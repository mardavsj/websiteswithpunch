import type { ArticleSection, Faq } from "@/components/seo/types";

export const sslFeature = {
  path: "/ssl-certificate-monitoring",
  title: "SSL Certificate Monitoring: Track SSL Expiry for Every Site",
  description:
    "Track SSL certificate expiry for every site you run: days left read daily from the live certificate, amber at 30 and red at 7, next to uptime and domain expiry.",
  eyebrow: "SSL certificate monitoring",
  h1: "SSL certificate monitoring for every site you look after",
  intro:
    "Auto-renewal works until it doesn't. Websites With Punch reads the live certificate of each HTTPS site you add every day and shows the days left on your dashboard, so a failed renewal shows up as a number turning amber, not as a browser warning in front of your customers.",
  facts: [
    "Live certificate read once a day",
    "Days left on every site card",
    "Amber at 30 days, red at 7",
    "Recheck on demand after you renew",
  ],
  sections: [
    {
      h: "Why certificates still expire in 2026",
      p: [
        "Most sites now use free certificates that renew automatically, often every 60 to 90 days, and public certificate lifetimes are being cut further by the CA/Browser Forum. More renewals means more chances for one to fail quietly: a DNS provider change breaks the ACME challenge, a firewall blocks the validation request, a server moves and the cron job doesn't, an API token used for DNS validation expires.",
        "None of that is visible until the old certificate runs out and browsers start blocking the site. A daily outside read of the certificate your visitors actually receive is the simplest way to see a stuck renewal weeks before it matters.",
      ],
    },
    {
      h: "What we check",
      list: [
        "The certificate presented on port 443 for the site's host, read with a real TLS handshake, the same way a browser sees it.",
        "Its expiry date and the whole days remaining, shown on the site card and the site's page.",
        "The host your homepage finally lands on is read first (for example www after a redirect), with the bare domain as a fallback, so a certificate that only covers one of the two names is still found.",
      ],
      p: [
        "The days-left pill turns amber at 30 days and red at 7. After you renew, press Recheck on the site's page to confirm the new date straight away instead of waiting for the next daily check.",
      ],
    },
    {
      h: "One list for every client certificate",
      p: [
        "If you build or maintain sites for clients, certificates live in different places: a managed host here, a CDN there, a VPS with certbot somewhere else. Adding each site to one dashboard gives you a single sorted view of who is closest to expiry, without logging in to every provider. Want a one-off look at a single domain first? Use the free SSL checker, which also shows the issuer, the hostnames covered and whether browsers trust the certificate.",
      ],
    },
    {
      h: "What it doesn't do",
      p: [
        "We don't install or renew certificates for you, we don't scan internal hosts or non-standard ports, and we don't send alerts. You see the numbers on your dashboard, and the renewal itself stays with your host, CDN or ACME client.",
      ],
    },
  ] satisfies ArticleSection[],
  faqs: [
    {
      q: "How often is the SSL certificate checked?",
      a: "Once a day for every active site, and again whenever you press Recheck on the site's page.",
    },
    {
      q: "Do you warn me before a certificate expires?",
      a: "The days left are shown on your dashboard and turn amber at 30 days and red at 7. We don't send email or chat alerts.",
    },
    {
      q: "Does it work with Let's Encrypt and Cloudflare certificates?",
      a: "Yes. We read whatever certificate the site actually serves on port 443, whichever authority issued it and whether it comes from your server or a CDN.",
    },
    {
      q: "Can I check one certificate without signing up?",
      a: "Yes. The free SSL checker shows the issuer, expiry date, days left, covered hostnames and browser trust for any public domain.",
    },
  ] satisfies Faq[],
};
