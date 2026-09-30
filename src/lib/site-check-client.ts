/** Browser-side helpers shared by SiteCard and SiteAnalytics. */

export const SITE_CHECKED_EVENT = "wwp:site-checked";
/** Must match RECHECK_COOLDOWN_MS on the server (src/lib/site-check-run.ts). */
export const RECHECK_COOLDOWN_MS = 60_000;

/** Error from the check endpoint; `retryAfter` (s) is set for 429 cooldowns. */
export class RecheckError extends Error {
  code?: string;
  retryAfter?: number;
  constructor(message: string, code?: string, retryAfter?: number) {
    super(message);
    this.name = "RecheckError";
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export type RecheckOptions = {
  /** Light uptime-only check used by Auto update (server-throttled). */
  live?: boolean;
  signal?: AbortSignal;
  /** Broadcast SITE_CHECKED_EVENT on success (default true). */
  broadcast?: boolean;
};

/**
 * Runs a check (POST /api/sites/:id {action:"check"}), which updates the site
 * record and stores a CheckResult history row. Manual (full) checks are
 * limited to once per minute: the server answers 429 with `retryAfter`
 * seconds, surfaced here as RecheckError. Live checks may come back
 * `throttled: true` (the latest saved result is reused).
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
    const retryAfter =
      typeof j?.retryAfter === "number"
        ? j.retryAfter
        : Number(res.headers.get("Retry-After")) || undefined;
    throw new RecheckError(j?.error || "Recheck failed. Try again.", j?.code, retryAfter);
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
