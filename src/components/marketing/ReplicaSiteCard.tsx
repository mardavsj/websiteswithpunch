import { DaysPill } from "@/components/SiteCardParts";
import { StatusBadge } from "@/components/StatusBadge";
import type { PreviewSite } from "./preview-data";

/**
 * Static copy of the dashboard SiteCard (same markup and classes), with inert spans in place of
 * buttons/links. `callouts` tags the three signals so PreviewCallouts can point at them.
 */
export function ReplicaSiteCard({
  site,
  callouts = false,
  className = "",
}: {
  site: PreviewSite;
  callouts?: boolean;
  className?: string;
}) {
  const tag = (key: string) => (callouts ? { "data-callout": key } : {});
  return (
    <article
      className={`rounded-none border border-rule bg-surface p-5 transition hover:border-ink/20 ${className}`}
      {...(callouts ? { "data-callout-card": "" } : {})}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="truncate font-display text-lg font-medium text-ink">{site.name}</h3>
          <span className="contents" {...tag("status")}>
            <StatusBadge status={site.status} />
          </span>
        </div>
        <span className="min-w-0 max-w-[50%] shrink truncate text-right text-sm text-accent hover:underline">
          {site.url}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-none border border-rule bg-surface px-3 py-2">
          <p className="text-xs text-muted">Last check</p>
          <p className="text-sm font-medium text-ink">{site.lastCheck}</p>
        </div>
        <div className="rounded-none border border-rule bg-surface px-3 py-2">
          <p className="text-xs text-muted">Latency / code</p>
          <p className="text-sm font-medium text-ink">
            {site.latencyMs != null ? `${site.latencyMs}ms` : "—"}
            {site.code != null ? ` · ${site.code}` : ""}
          </p>
        </div>
        <div className="contents" {...tag("ssl")}>
          <DaysPill days={site.sslDays} label="SSL left" />
        </div>
        <div className="contents" {...tag("domain")}>
          <DaysPill days={site.domainDays} label="Domain left" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-none bg-solid px-3 py-1.5 text-xs font-medium tabular-nums text-solid-fg hover:opacity-90">
            Recheck
          </span>
          <span className="rounded-none bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover">
            Analytics →
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-none border border-rule px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft">
            Edit
          </span>
          <span className="rounded-none bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
            Delete
          </span>
        </div>
      </div>
    </article>
  );
}
