/** Browser-side helpers shared by SiteCard and SiteAnalytics. */

export const SITE_CHECKED_EVENT = "wwp:site-checked";

/**
 * Runs a live check (POST /api/sites/:id {action:"check"}), which updates the
 * site record and stores a CheckResult history row. On success it broadcasts
 * SITE_CHECKED_EVENT so any open analytics panel for the site refetches.
 */
export async function recheckSite(siteId: string): Promise<void> {
  const res = await fetch(`/api/sites/${siteId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "check" }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.error || "Recheck failed. Try again.");
  }
  window.dispatchEvent(new CustomEvent(SITE_CHECKED_EVENT, { detail: { siteId } }));
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
