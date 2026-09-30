/** Sample portfolio shown in the hero preview (illustrative data, not live). */
export type HeroSite = {
  name: string;
  host: string;
  up: boolean;
  /** "142 ms" when up, "503" when down. */
  reading: string;
  /** Last 24 checks: 0 ok, 1 slow, 2 down. */
  bars: number[];
  ssl: number;
  domain: number;
};

const ok = (n: number) => Array.from({ length: n }, () => 0);

export const heroSites: HeroSite[] = [
  { name: "My shop", host: "shop.example.com", up: true, reading: "142 ms", bars: ok(24), ssl: 62, domain: 164 },
  { name: "Client blog", host: "blog.example.org", up: true, reading: "210 ms", bars: [...ok(15), 1, ...ok(8)], ssl: 21, domain: 300 },
  { name: "Docs", host: "docs.example.dev", up: true, reading: "98 ms", bars: ok(24), ssl: 88, domain: 41 },
  { name: "Launch page", host: "launch.example.io", up: false, reading: "503", bars: [...ok(20), 1, 2, 2, 2], ssl: 45, domain: 212 },
];

/** Same thresholds as the dashboard's days-left pills: amber at 30 days, red at 7. */
export function daysTone(days: number) {
  if (days <= 7) return "bg-rose-400/15 text-rose-300";
  if (days <= 30) return "bg-amber-400/15 text-amber-200";
  return "bg-solid-fg/[0.06] text-solid-fg/85";
}

export function barTone(v: number) {
  if (v === 2) return "bg-rose-400";
  if (v === 1) return "bg-amber-300";
  return "bg-emerald-400/80";
}
