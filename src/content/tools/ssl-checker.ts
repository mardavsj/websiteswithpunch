import type { ArticleSection, Faq } from "@/components/seo/types";

export const sslChecker = {
  path: "/tools/ssl-checker",
  title: "SSL Checker: Check SSL Certificate Expiry Date & Issuer",
  description:
    "Free SSL checker: see who issued a site's certificate, the exact expiry date, days left, the hostnames it covers and whether browsers trust it.",
  h1: "SSL certificate checker",
  intro:
    "Enter a domain to read the SSL/TLS certificate it serves on port 443: the issuer, the expiry date, how many days are left, the hostnames it covers and whether browsers will trust it. Free, no signup.",
  sections: [
    {
      h: "What this SSL checker does",
      p: [
        "The checker opens a TLS connection to the domain on port 443, the same handshake a browser performs, and reads the certificate the server presents. It does not load the page or send any data to the site. The result shows the certificate's notAfter date (when it expires), the number of whole days left, the certificate authority that issued it, the date it became valid, the DNS names listed in its Subject Alternative Name field and the TLS version that was negotiated.",
        "It also tells you whether a browser would trust the certificate. A certificate can still be inside its validity dates and fail anyway: if it doesn't list the hostname you typed, if it's self-signed, or if the server forgets to send the intermediate certificate, visitors get a full-page warning instead of your site.",
      ],
    },
    {
      h: "Why SSL certificate expiry matters",
      p: [
        "When a certificate expires, every modern browser blocks the page with a security warning such as \"Your connection is not private\". Most visitors leave. Checkout, login and contact forms stop working, API clients and webhooks start failing, and search engines may stop showing the page while it's broken.",
        "Certificates are short-lived on purpose. Let's Encrypt and many other free authorities issue 90-day certificates, and the CA/Browser Forum has voted to keep reducing the maximum lifetime of all public certificates over the next few years. Shorter lifetimes are safer, but they mean renewal has to work every time. Auto-renewal usually does, until a DNS change, a firewall rule, a moved server or an expired API token quietly breaks it.",
      ],
    },
    {
      h: "How to read the result",
      list: [
        "Days left: green above 30 days, amber at 30 days or fewer, red at 7 days or fewer or once expired. If you rely on auto-renewal and see amber, renewal has probably already failed at least once.",
        "Issuer: the certificate authority (for example Let's Encrypt, Google Trust Services, Sectigo or DigiCert). An issuer you don't recognise on a domain you control is worth investigating.",
        "Covers: the hostnames in the certificate. If you typed www.example.com and only example.com is listed, the www address will show a warning.",
        "Trusted by browsers: \"No\" with a reason means visitors would see an error even if the dates look fine.",
      ],
    },
    {
      h: "How to fix common SSL problems",
      steps: [
        "Expired or expiring soon: renew in your host or CDN dashboard, or run your ACME client by hand (for example certbot renew) and read the error it prints. Then reload the web server so it serves the new file.",
        "Hostname not covered: reissue the certificate with every name visitors use, usually both example.com and www.example.com, or redirect the uncovered name somewhere that is covered.",
        "Missing intermediate: configure the full chain file (often fullchain.pem) instead of the single certificate. Desktop browsers sometimes hide this problem; phones and API clients usually don't.",
        "Self-signed: replace it with a certificate from a public authority. Let's Encrypt is free and supported by most hosts.",
        "Renewed but still old: a CDN, load balancer or second server may still hold the old certificate. Check each one, then run this checker again.",
      ],
    },
    {
      h: "Check a certificate from the command line",
      p: ["If you prefer a terminal, OpenSSL prints the same dates and issuer:"],
      code: "echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \\\n  | openssl x509 -noout -issuer -dates",
    },
  ] satisfies ArticleSection[],
  faqs: [
    {
      q: "Is this SSL checker free?",
      a: "Yes. It's free and needs no account. To keep it fair for everyone, each visitor can run up to 10 checks a minute and 100 a day across our free tools.",
    },
    {
      q: "How do I check when an SSL certificate expires?",
      a: "Type the domain into the checker above and press Check SSL. The Expires field is the certificate's expiry date and the large number is how many days are left. In a browser you can also click the padlock and open the certificate details, one site at a time.",
    },
    {
      q: "Does the checker store my domain?",
      a: "Results are cached for about 10 minutes so repeat lookups are fast, and are not saved to an account. Like any web server we keep short-lived request logs and a per-IP counter for rate limiting.",
    },
    {
      q: "Why does a browser say the certificate is invalid when the dates are fine?",
      a: "The usual causes are a hostname that isn't listed in the certificate, a missing intermediate certificate or a self-signed certificate. The \"Trusted by browsers\" row shows which one applies.",
    },
    {
      q: "How often should I check my SSL certificate?",
      a: "Certificates that renew every 90 days are worth checking at least weekly. Websites With Punch reads the certificate of every site you add once a day and shows the days left on your dashboard, amber at 30 days and red at 7.",
    },
    {
      q: "Can I check a certificate on a port other than 443?",
      a: "This free tool checks port 443, where public HTTPS sites serve their certificate. IP addresses, localhost and private networks can't be checked.",
    },
  ] satisfies Faq[],
  cta: "Add the site to Websites With Punch and we read its certificate every day, alongside uptime and domain expiry. Your dashboard shows the days left, turning amber at 30 days and red at 7. Free for one site, no card needed. (We don't send alerts yet: open the dashboard whenever you like.)",
};
