import { StatusBadge } from "./StatusBadge";

/** Small presentational helpers for SiteCard (kept separate to stay small). */

export function DaysPill({ days, label, warnAt = 30 }: { days: number | null; label: string; warnAt?: number }) {
  if (days === null || days === undefined) {
    return (
      <div className="rounded-none border border-rule bg-surface px-3 py-2">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-muted">Not available</p>
        <p className="text-[10px] text-muted/80">retry recheck</p>
      </div>
    );
  }
  const warn = days <= warnAt;
  const critical = days <= 7;
  return (
    <div
      className={`rounded-none border border-rule px-3 py-2 ${
        critical ? "bg-rose-50 dark:bg-rose-400/10" : warn ? "bg-amber-50 dark:bg-amber-400/10" : "bg-surface"
      }`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`text-sm font-semibold ${
          critical ? "text-rose-700 dark:text-rose-300" : warn ? "text-amber-800 dark:text-amber-200" : "text-ink"
        }`}
      >
        {days} day{days === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export function latestOf(a: string | Date | null | undefined, b: string | Date | null | undefined) {
  const ta = a ? new Date(a).getTime() : 0;
  const tb = b ? new Date(b).getTime() : 0;
  return ta || tb ? new Date(Math.max(ta, tb)) : null;
}

/** Card buttons, shared by the dashboard SiteCard and the homepage checker's card. */
export const CARD_BTN = {
  recheck:
    "rounded-none bg-solid px-3 py-1.5 text-xs font-medium tabular-nums text-solid-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-75",
  analytics: "rounded-none bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover",
  edit: "rounded-none border border-rule px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft",
  delete: "rounded-none bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:bg-red-400",
};

/** The four boxes: last check, latency / code, SSL left, domain left (same amber/red thresholds). */
export function SiteCardMetrics({
  lastCheck,
  latencyMs,
  statusCode,
  sslDaysLeft,
  domainDaysLeft,
}: {
  lastCheck: string;
  latencyMs: number | null;
  statusCode: number | null;
  sslDaysLeft: number | null;
  domainDaysLeft: number | null;
}) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="rounded-none border border-rule bg-surface px-3 py-2">
        <p className="text-xs text-muted">Last check</p>
        <p className="text-sm font-medium text-ink">{lastCheck}</p>
      </div>
      <div className="rounded-none border border-rule bg-surface px-3 py-2">
        <p className="text-xs text-muted">Latency / code</p>
        <p className="text-sm font-medium text-ink">
          {latencyMs != null ? `${latencyMs}ms` : "—"}
          {statusCode != null ? ` · ${statusCode}` : ""}
        </p>
      </div>
      <DaysPill days={sslDaysLeft} label="SSL left" />
      <DaysPill days={domainDaysLeft} label="Domain left" />
    </div>
  );
}

/** Name + status badge on the left, the URL (opens in a new tab) on the right. */
export function SiteCardHead({ name, url, status }: { name: string; url: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h3 className="truncate font-display text-lg font-medium text-ink">{name}</h3>
        <StatusBadge status={status} />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        title={url}
        className="min-w-0 max-w-[50%] shrink truncate text-right text-sm text-accent hover:underline"
      >
        {url}
      </a>
    </div>
  );
}
