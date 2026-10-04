import { Sk, SkBtn, SkCard, SkRing } from "./Sk";

const BTN = "px-3 py-1.5 text-xs font-medium";
const TITLE = "font-display text-sm font-medium";

/** The "Auto refresh/recheck" control, reserved while analytics load so the header keeps its height. */
export function AutoUpdateSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-1 sm:items-end" aria-hidden>
      <div className="flex flex-wrap items-center gap-2">
        <SkBtn outline className={BTN}>
          Auto refresh/recheck
        </SkBtn>
      </div>
    </div>
  );
}

/** Mirrors AnalyticsHeader: title, range toggle, Refresh and the live slot. */
export function AnalyticsHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-medium">
          <Sk>Site analytics</Sk>
        </h2>
        <p className="text-xs">
          <Sk>Built from real checks — uptime, latency, incidents, SSL & domain risk.</Sk>
        </p>
      </div>
      <div className="flex min-w-0 flex-col gap-2 sm:items-end">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex border border-rule">
            {["24h", "7d", "30d", "All"].map((r) => (
              <span key={r} className={BTN}>
                <Sk>{r}</Sk>
              </span>
            ))}
          </div>
          <SkBtn outline className={BTN}>
            Refresh
          </SkBtn>
        </div>
        <AutoUpdateSkeleton />
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {["Up", "Down", "Error", "Mixed"].map((l) => (
        <span
          key={l}
          className="inline-flex items-center gap-1.5 border border-rule px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
        >
          <span className="sk inline-block h-2 w-2" />
          <Sk>{l}</Sk>
        </span>
      ))}
    </div>
  );
}

/** Mirrors SiteAnalyticsBody: gauges, charts, timeline, SSL/domain panels, incidents, codes. */
export function AnalyticsBodySkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col items-center justify-center border border-rule bg-surface p-4">
          <p className="label-caps mb-2 self-start">
            <Sk>Health score</Sk>
          </p>
          <SkRing size={88} r={34} stroke={7} />
          <p className="mt-1 text-center text-sm">
            <Sk>Excellent</Sk>
          </p>
        </div>
        <div className="flex flex-col items-center justify-center border border-rule bg-surface p-4">
          <p className="label-caps mb-2 self-start">
            <Sk>Uptime</Sk>
          </p>
          <SkRing size={88} r={34} stroke={7} />
          <p className="mt-2 text-center text-xs">
            <Sk>48 checks · 0 issues</Sk>
          </p>
        </div>
        <SkCard>
          <p className="label-caps">
            <Sk>Avg latency</Sk>
          </p>
          <p className="mt-2 font-display text-3xl font-medium">
            <Sk>120ms</Sk>
          </p>
          <p className="text-sm">
            <Sk>p95 180ms</Sk>
          </p>
        </SkCard>
        <SkCard>
          <p className="label-caps">
            <Sk>Last downtime</Sk>
          </p>
          <p className="mt-2 font-display text-xl font-medium">
            <Sk>Never in this range</Sk>
          </p>
          <p className="text-sm">
            <Sk>In selected range</Sk>
          </p>
        </SkCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SkCard>
          <div className="flex items-center justify-between">
            <p className={TITLE}>
              <Sk>Latency trend</Sk>
            </p>
            <p className="text-xs">
              <Sk>80–200 ms</Sk>
            </p>
          </div>
          <div className="mt-2">
            <div className="sk h-44 w-full" />
          </div>
        </SkCard>
        <SkCard>
          <p className={TITLE}>
            <Sk>Availability timeline</Sk>
          </p>
          <p className="mt-1 text-xs">
            <Sk>Segment density follows the selected range</Sk>
          </p>
          <div className="mt-4">
            <div className="h-6 w-full border border-rule">
              <div className="sk h-full w-full" />
            </div>
            <Legend />
          </div>
        </SkCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SkCard>
          <p className="label-caps">
            <Sk>SSL certificate</Sk>
          </p>
          <div className="mt-3 flex items-center gap-4">
            <SkRing size={64} r={22} stroke={6} />
            <div className="min-w-0">
              <p className="font-display text-2xl font-medium">
                <Sk>75 days</Sk>
              </p>
              <p className="mt-1 text-xs">
                <Sk>Expires 18 Dec 2026</Sk>
              </p>
              <p className="text-xs">
                <Sk>79% remaining · added 14 Sept 2026</Sk>
              </p>
            </div>
          </div>
        </SkCard>
        <SkCard>
          <p className="label-caps">
            <Sk>Domain registration</Sk>
          </p>
          <p className="mt-3 font-display text-3xl font-medium">
            <Sk>220</Sk>
            <span className="ml-1.5 text-base font-normal">
              <Sk>days left</Sk>
            </span>
          </p>
          <div className="mt-4 flex h-7 items-center px-0.5">
            <div className="sk h-2.5 w-full" />
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-2 text-[11px] font-medium leading-tight tracking-wide">
            <span className="min-w-0 text-left">
              <Sk>Expires</Sk>
              <span className="block font-normal">
                <Sk>12 May 2027</Sk>
              </span>
            </span>
            <span className="min-w-0 text-center">
              <Sk>4 mo</Sk>
            </span>
            <span className="min-w-0 text-right">
              <Sk>Added</Sk>
              <span className="block font-normal">
                <Sk>14 Sept 2026</Sk>
              </span>
            </span>
          </div>
          <p className="mt-2 text-xs">
            <Sk>92% remaining · 7 mo 10d</Sk>
          </p>
        </SkCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SkCard>
          <p className={TITLE}>
            <Sk>Incidents</Sk>
          </p>
          <p className="mt-3 text-sm">
            <Sk>No incidents in this range. Nice.</Sk>
          </p>
        </SkCard>
        <SkCard>
          <p className={TITLE}>
            <Sk>Status codes</Sk>
          </p>
          <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <SkRing size={128} r={44} stroke={18} />
            <ul className="w-full min-w-0 flex-1 space-y-2">
              <li className="flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-2 font-medium">
                  <span className="sk inline-block h-2.5 w-2.5 shrink-0" />
                  <Sk>HTTP 200</Sk>
                </span>
                <Sk>48 · 100%</Sk>
              </li>
            </ul>
          </div>
        </SkCard>
      </div>
    </div>
  );
}

/** Whole analytics section (route skeleton for the site page / single-site dashboard). */
export function AnalyticsSectionSkeleton() {
  return (
    <section className="min-w-0 rounded-none border border-rule bg-surface p-5 sm:p-6">
      <AnalyticsHeaderSkeleton />
      <div className="mt-5">
        <AnalyticsBodySkeleton />
      </div>
    </section>
  );
}
