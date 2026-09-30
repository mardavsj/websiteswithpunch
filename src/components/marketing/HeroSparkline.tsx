import type { HeroSite } from "./hero-sites";

const H = 24;

/** Small response-time line per site; a dashed red tail marks checks with no response. */
export function HeroSparkline({ site }: { site: HeroSite }) {
  const vals = site.latency.filter((v): v is number => v !== null);
  // Pad small ranges so a steady site reads as a calm line, not noise.
  const span = Math.max(Math.max(...vals) - Math.min(...vals), 80);
  const min = (Math.max(...vals) + Math.min(...vals) - span) / 2;
  const n = site.latency.length;
  const x = (i: number) => (i / (n - 1)) * 100;
  const y = (v: number) => 3 + (1 - (v - min) / span) * (H - 8);

  const okCount = site.latency.findIndex((v) => v === null);
  const last = okCount === -1 ? n - 1 : okCount - 1;
  const pts = vals.slice(0, last + 1).map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const area = `0,${H} ${pts.join(" ")} ${x(last).toFixed(1)},${H}`;
  const endY = site.up ? y(vals[last]) : H - 2;

  return (
    <span className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
      <span className="relative h-6 min-w-0 flex-1">
        <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <polygon points={area} className="fill-accent/15" />
          <polyline
            points={pts.join(" ")}
            fill="none"
            strokeWidth="1.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="stroke-accent"
          />
          {!site.up && (
            <polyline
              points={`${x(last).toFixed(1)},${y(vals[last]).toFixed(1)} ${x(last + 1).toFixed(1)},${H - 2} 100,${H - 2}`}
              fill="none"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
              className="stroke-rose-500 dark:stroke-rose-400"
            />
          )}
        </svg>
        <span
          className={`absolute right-0 h-1.5 w-1.5 -translate-y-1/2 translate-x-1/2 rounded-full ${site.up ? "bg-accent" : "bg-rose-500"}`}
          style={{ top: `${(endY / H) * 100}%` }}
        />
      </span>
      <Trend site={site} />
    </span>
  );
}

function Trend({ site }: { site: HeroSite }) {
  if (!site.up) return <span className="w-12 shrink-0 text-right text-[11px] text-rose-700 lg:hidden dark:text-rose-300">no reply</span>;
  const { trend } = site;
  const tone = trend < 0 ? "text-emerald-700 dark:text-emerald-300" : trend > 0 ? "text-amber-800 dark:text-amber-200" : "text-muted";
  const arrow = trend < 0 ? "↓" : trend > 0 ? "↑" : "→";
  return (
    <span className={`w-12 shrink-0 text-right text-[11px] tabular-nums lg:hidden ${tone}`}>
      {arrow} {Math.abs(trend)}%
    </span>
  );
}
