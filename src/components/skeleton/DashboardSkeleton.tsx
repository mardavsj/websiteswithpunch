"use client";

import { usePathname } from "next/navigation";
import { Sk, SkBtn, SkStatus } from "./Sk";
import { useLayoutShape } from "./shape";
import { LockedSiteCardSkeleton, SiteCardSkeleton } from "./SiteCardSkeleton";
import { AnalyticsSectionSkeleton } from "./AnalyticsSkeleton";
import { SiteSkeleton } from "./SiteSkeleton";

const PLAN_NAME = { free: "Free", pro: "Pro", business: "Business" } as const;
const HEAD_BTN = "px-4 py-2 text-sm font-medium";

/** Mirrors the dashboard: welcome header, stat cards, one card per site, inline analytics. */
export function DashboardSkeleton() {
  const { plan, active, locked, limit, cards: remembered } = useLayoutShape();
  // Entering a site page from outside /dashboard shows this (outer) boundary: draw the site page.
  const path = usePathname() ?? "";
  if (/^\/dashboard\/sites\/[^/]+\/?$/.test(path) && !path.endsWith("/new")) return <SiteSkeleton />;
  const paid = plan !== "free";
  const inline = active === 1 && locked === 0;
  const empty = active + locked === 0;
  // Remembered card order and text lengths when they match the counts; otherwise plain cards.
  const total = Math.min(active + locked, 12);
  const cards: Array<[number | undefined, number | undefined, number]> =
    remembered.length === total
      ? remembered
      : [
          ...Array.from({ length: active }, () => [undefined, undefined, 0] as [undefined, undefined, number]),
          ...Array.from({ length: locked }, () => [undefined, undefined, 1] as [undefined, undefined, number]),
        ].slice(0, 12);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" role="status" aria-busy="true">
      <SkStatus label="Loading dashboard…" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium">
            <Sk>Welcome, Alex</Sk>
          </h1>
          <p className="mt-1 text-sm">
            <Sk>
              Current plan: {PLAN_NAME[plan]} · {active}/{limit} active
            </Sk>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {active >= limit ? (
            <SkBtn outline className="px-4 py-2 text-sm">
              Site limit reached
            </SkBtn>
          ) : (
            <SkBtn className={HEAD_BTN}>Add site</SkBtn>
          )}
          {paid && (
            <SkBtn outline className={HEAD_BTN}>
              Buy +5 site slots
            </SkBtn>
          )}
        </div>
      </div>

      {active > 1 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {["Sites monitored", "Down / error now", "Nearest SSL expiry"].map((label) => (
            <div key={label} className="border border-rule bg-surface p-4">
              <p className="label-caps">
                <Sk>{label}</Sk>
              </p>
              <p className="mt-1 font-display text-2xl font-medium">
                <Sk>12</Sk>
              </p>
            </div>
          ))}
        </div>
      )}

      {empty ? (
        <div className="mt-12 rounded-none border border-dashed border-rule bg-bg p-12 text-center">
          <h2 className="font-display text-lg font-medium">
            <Sk>No sites yet</Sk>
          </h2>
          <p className="mt-2 text-sm">
            <Sk>Add your first URL to start uptime, SSL, and domain monitoring.</Sk>
          </p>
          <div className="mt-6">
            <SkBtn className={HEAD_BTN}>Add your first site</SkBtn>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {cards.map(([nameLen, urlLen, isLocked], i) =>
            isLocked ? (
              <LockedSiteCardSkeleton key={i} nameLen={nameLen} urlLen={urlLen} />
            ) : (
              <SiteCardSkeleton key={i} analyticsLink={!inline} nameLen={nameLen} urlLen={urlLen} />
            ),
          )}
          {inline && <AnalyticsSectionSkeleton />}
          {!inline && active > 1 && (
            <p className="text-center text-sm">
              <Sk>
                Open <span className="font-medium">Analytics →</span> on any active site for the
                full breakdown with range filters.
              </Sk>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
