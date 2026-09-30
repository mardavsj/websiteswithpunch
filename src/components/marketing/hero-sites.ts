/** Sample portfolio shown in the hero preview (illustrative data, not live). */
export type HeroSite = {
  name: string;
  host: string;
  up: boolean;
  /** "142 ms" when up, "503" when down. */
  reading: string;
  /** Response time (ms) of recent checks, oldest first; null = no response. */
  latency: (number | null)[];
  /** Change in average response time vs the previous period, in %. */
  trend: number;
  ssl: number;
  domain: number;
};

export const heroSites: HeroSite[] = [
  { name: "My shop", host: "shop.example.com", up: true, reading: "142 ms", latency: [168, 160, 171, 155, 150, 158, 149, 146, 152, 144, 147, 142], trend: -8, ssl: 62, domain: 164 },
  { name: "Client blog", host: "blog.example.org", up: true, reading: "210 ms", latency: [176, 181, 178, 186, 190, 184, 196, 240, 205, 199, 212, 210], trend: 12, ssl: 21, domain: 300 },
  { name: "Docs", host: "docs.example.dev", up: true, reading: "98 ms", latency: [101, 97, 99, 104, 96, 98, 100, 95, 99, 97, 100, 98], trend: 0, ssl: 88, domain: 41 },
  { name: "Launch page", host: "launch.example.io", up: false, reading: "503", latency: [132, 128, 136, 131, 140, 138, 165, 190, null, null, null, null], trend: 0, ssl: 45, domain: 212 },
];

/** Same thresholds as the dashboard's days-left pills: amber at 30 days, red at 7. */
export function daysTone(days: number) {
  if (days <= 7) return "bg-rose-400/15 text-rose-300";
  if (days <= 30) return "bg-amber-400/15 text-amber-200";
  return "bg-solid-fg/[0.06] text-solid-fg/85";
}
