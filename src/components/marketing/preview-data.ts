/** Example data for the homepage dashboard preview (placeholders, not real sites). */

export type PreviewSite = {
  name: string;
  url: string;
  status: "up" | "down";
  lastCheck: string;
  latencyMs: number | null;
  code: number | null;
  sslDays: number;
  domainDays: number;
};

export const previewUser = { name: "Alex", initial: "A", plan: "Pro", limit: 10, packSites: 5 };

export const previewSites: PreviewSite[] = [
  { name: "My shop", url: "https://shop.example.com", status: "up", lastCheck: "1 Oct 2026, 9:41 am", latencyMs: 142, code: 200, sslDays: 62, domainDays: 164 },
  { name: "Launch page", url: "https://launch.example.io", status: "down", lastCheck: "1 Oct 2026, 9:40 am", latencyMs: 1204, code: 503, sslDays: 45, domainDays: 6 },
  { name: "Client blog", url: "https://blog.example.org", status: "up", lastCheck: "1 Oct 2026, 9:41 am", latencyMs: 210, code: 200, sslDays: 21, domainDays: 300 },
  { name: "Docs", url: "https://docs.example.dev", status: "up", lastCheck: "1 Oct 2026, 9:40 am", latencyMs: 98, code: 200, sslDays: 88, domainDays: 41 },
];

/** The three signals, pointed at on the first card. */
export const previewCallouts = [
  { key: "status", title: "Status", body: "Up or down, with the latest response time and status code." },
  { key: "ssl", title: "SSL days left", body: "Turns amber at 30 days and red at 7." },
  { key: "domain", title: "Domain days left", body: "From best-effort RDAP/WHOIS lookups, same thresholds." },
] as const;
