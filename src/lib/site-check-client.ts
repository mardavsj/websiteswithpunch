/** Browser-side helpers shared by SiteCard and SiteAnalytics. */

export const SITE_CHECKED_EVENT = "wwp:site-checked";

export type RecheckOptions = {
  /** Cheap uptime-only check used by analytics live mode (server-throttled). */
  live?: boolean;
  signal?: AbortSignal;
  /** Broadcast SITE_CHECKED_EVENT on success (default true). */
  broadcast?: boolean;
};

/**
 * Runs a check (POST /api/sites/:id {action:"check"}), which updates the site
 * record and stores a CheckResult history row. The server may answer
 * `throttled: true` when the site was checked moments ago; the latest saved
 * result is then reused. On success it broadcasts SITE_CHECKED_EVENT so any
 * open analytics panel for the site refetches.
 */
export async function recheckSite(
  siteId: string,
  opts: RecheckOptions = {}
): Promise<{ throttled: boolean }> {
  const res = await fetch(`/api/sites/${siteId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "check", live: opts.live === true }),
    signal: opts.signal,
  });
  const j = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(j?.error || "Recheck failed. Try again.");
  }
  if (opts.broadcast !== false) {
    window.dispatchEvent(new CustomEvent(SITE_CHECKED_EVENT, { detail: { siteId } }));
  }
  return { throttled: Boolean(j?.throttled) };
}

/** Subscribe to successful rechecks for one site. Returns an unsubscribe fn. */
export function onSiteChecked(siteId: string, cb: () => void): () => void {
  function handler(e: Event) {
    const id = (e as CustomEvent<{ siteId?: string }>).detail?.siteId;
    if (!id || id === siteId) cb();
  }
  window.addEventListener(SITE_CHECKED_EVENT, handler);
  return () => window.removeEventListener(SITE_CHECKED_EVENT, handler);
}
