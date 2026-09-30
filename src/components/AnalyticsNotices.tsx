import { formatDate } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { ExpiryCards, timeAgo, type AnalyticsPayload } from "./SiteAnalyticsBody";

type RecheckProps = {
  busy: boolean;
  /** Seconds until Recheck is allowed again (once per minute). */
  cooldown?: number;
  onRecheck: () => void;
  error?: string | null;
};

/** Same black solid style as the Recheck button on the site card. */
export function RecheckButton({ busy, cooldown = 0, onRecheck }: Omit<RecheckProps, "error">) {
  const wait = cooldown > 0;
  return (
    <button
      type="button"
      onClick={onRecheck}
      disabled={busy || wait}
      aria-busy={busy || undefined}
      title={wait ? "Recheck is limited to once per minute" : undefined}
      className="shrink-0 self-start rounded-none bg-solid px-3 py-1.5 text-xs font-medium tabular-nums text-solid-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-75 sm:self-center"
    >
      {busy ? "Checking…" : wait ? `Recheck in ${cooldown}s` : "Recheck"}
    </button>
  );
}

/** Latest known status from the site record (updated on every check). */
export function LatestKnown({ data }: { data: AnalyticsPayload }) {
  const s = data.site;
  const seen = s?.lastSeenAt ?? s?.lastCheckedAt;
  if (!s || !seen) return null;
  const bits = [
    s.lastStatusCode != null ? `HTTP ${s.lastStatusCode}` : null,
    s.lastLatencyMs != null ? `${s.lastLatencyMs}ms` : null,
    data.ssl.daysLeft != null ? `SSL ${data.ssl.daysLeft}d left` : null,
    data.domain.daysLeft != null ? `Domain ${data.domain.daysLeft}d left` : null,
  ].filter(Boolean);
  return (
    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
      <span>Latest known:</span>
      <StatusBadge status={s.status} />
      {bits.length > 0 && <span className="min-w-0 break-words">{bits.join(" · ")}</span>}
      <span>· checked {timeAgo(seen, "never")}</span>
    </div>
  );
}

export function StaleBanner({
  data,
  busy,
  cooldown,
  onRecheck,
  error,
}: RecheckProps & { data: AnalyticsPayload }) {
  const at = data.dataEndsAt ?? data.site?.lastSeenAt ?? data.site?.lastCheckedAt ?? null;
  return (
    <div role="status" className="mb-5 rounded-none border border-rule bg-bg px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-start gap-2 text-sm text-ink">
            <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
            <span className="min-w-0 break-words">
              <span className="font-medium">Not up to date.</span> Showing the last saved
              analytics from {timeAgo(at, "an earlier check").toLowerCase()}
              {at ? ` (${formatDate(at)})` : ""}.
            </span>
          </p>
          <LatestKnown data={data} />
        </div>
        <RecheckButton busy={busy} cooldown={cooldown} onRecheck={onRecheck} />
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function EmptyHistory({
  data,
  busy,
  cooldown,
  onRecheck,
  error,
}: RecheckProps & { data: AnalyticsPayload }) {
  const hasExpiry = data.ssl.daysLeft != null || data.domain.daysLeft != null;
  return (
    <div className="space-y-5">
      <div className="border border-dashed border-rule px-4 py-10 text-center">
        <p className="font-display text-base font-medium text-ink">No check history yet</p>
        <p className="mt-2 text-sm text-muted">
          Run a check now to start building uptime and latency history.
        </p>
        <div className="mt-4 flex justify-center">
          <RecheckButton busy={busy} cooldown={cooldown} onRecheck={onRecheck} />
        </div>
        {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        <div className="flex justify-center">
          <LatestKnown data={data} />
        </div>
      </div>
      {hasExpiry && <ExpiryCards data={data} />}
    </div>
  );
}
