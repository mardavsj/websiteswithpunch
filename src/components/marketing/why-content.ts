/** "Why it matters" ledger: each quiet failure, what visitors hit, and what the dashboard shows first. */
export const lapses = [
  {
    id: "ssl",
    title: "An SSL certificate expires",
    impact: "The padlock turns into a warning page that looks like a scam. Most visitors leave.",
    code: "NET::ERR_CERT_DATE_INVALID",
    codeNote: "A full-page browser warning where your site should be.",
    weShow: "SSL days left for every HTTPS site, amber at 30 days and red at 7.",
  },
  {
    id: "domain",
    title: "A domain renewal is missed",
    impact: "The site, email and DNS can all vanish overnight, together.",
    code: "DNS_PROBE_FINISHED_NXDOMAIN",
    codeNote: "Or a registrar parking page in place of your site.",
    weShow: "Domain days left from best-effort RDAP/WHOIS lookups, on the same dashboard.",
  },
  {
    id: "uptime",
    title: "The site goes down",
    impact: "If nobody tells you the shop is down, every minute is lost revenue.",
    code: "503 Service Unavailable",
    codeNote: "Or a page that just keeps loading until it times out.",
    weShow: "Up/down status, response time and recent check history, plus a manual recheck once it’s fixed.",
  },
] as const;

export const whyColumns = ["What lapses", "What visitors run into", "What you see first"] as const;
