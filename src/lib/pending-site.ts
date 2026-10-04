/**
 * A site checked on the homepage before signing up. Kept in this browser only (localStorage) for a
 * day; the dashboard offers to add it on the next visit, then forgets it.
 */
const KEY = "wwp:pending-site";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type PendingSite = { name: string; url: string };

export function rememberPendingSite(site: PendingSite) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...site, at: Date.now() }));
  } catch {
    // storage blocked: signup still works, the site just isn't prefilled
  }
}

/** Returns the remembered site (if recent) and clears it. */
export function takePendingSite(): PendingSite | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);
    const v = JSON.parse(raw) as Partial<PendingSite> & { at?: number };
    if (typeof v.url !== "string" || typeof v.name !== "string" || !v.at || Date.now() - v.at > MAX_AGE_MS) return null;
    return { name: v.name.slice(0, 100), url: v.url.slice(0, 300) };
  } catch {
    return null;
  }
}
