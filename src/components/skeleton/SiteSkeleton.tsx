import { Sk, SkStatus } from "./Sk";
import { SiteCardSkeleton } from "./SiteCardSkeleton";
import { AnalyticsSectionSkeleton } from "./AnalyticsSkeleton";

/** Single site: back link, the site card and the full analytics section. */
export function SiteSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" role="status" aria-busy="true">
      <SkStatus label="Loading site…" />
      <div className="mb-6 text-sm">
        <Sk>← Dashboard</Sk>
      </div>
      <div className="space-y-5">
        <SiteCardSkeleton analyticsLink={false} />
        <AnalyticsSectionSkeleton />
      </div>
    </div>
  );
}
