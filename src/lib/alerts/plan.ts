/**
 * Pure alert decisions (no DB, no email) so they can be unit tested. The caller claims each
 * returned key in AlertLog (unique per site) before sending, so a key emails at most once.
 */
export type AlertKind = "down" | "recovered" | "ssl" | "domain";
export type AlertLevel = "expired" | "invalid" | "1" | "7" | "30";
export type PlannedAlert =
  | { kind: "down"; key: string }
  | { kind: "recovered"; key: string; downSince: Date }
  | { kind: "ssl" | "domain"; key: string; level: AlertLevel; expiresAt: Date; daysLeft: number };

export type AlertSite = {
  status: string;
  alertDownAt: Date | null;
  sslExpiresAt: Date | null;
  sslDaysLeft: number | null;
  sslInfo?: unknown;
  domainExpiresAt: Date | null;
  domainDaysLeft: number | null;
};
export type AlertPrefs = { alertDown: boolean; alertSsl: boolean; alertDomain: boolean };

export const THRESHOLDS = [30, 7, 1] as const;
const DAY_MS = 86_400_000;
const day = (d: Date) => d.toISOString().slice(0, 10);

/** Most urgent threshold reached: 40 days → none, 20 → "30", 5 → "7", 0 or 1 → "1", past → "expired". */
export function expiryLevel(expiresAt: Date, now = Date.now()): { level: AlertLevel; daysLeft: number } | null {
  const ms = expiresAt.getTime() - now;
  const daysLeft = Math.ceil(ms / DAY_MS);
  if (ms <= 0) return { level: "expired", daysLeft: Math.min(0, daysLeft) };
  for (const t of [...THRESHOLDS].reverse()) if (daysLeft <= t) return { level: String(t) as AlertLevel, daysLeft };
  return null;
}

const untrusted = (info: unknown) =>
  Boolean(info && typeof info === "object" && (info as { trusted?: unknown }).trusted === false);

export function planAlerts(site: AlertSite, prefs: AlertPrefs, checkedAt: Date, now = Date.now()): PlannedAlert[] {
  const out: PlannedAlert[] = [];
  const failing = site.status === "down" || site.status === "error";
  if (prefs.alertDown) {
    if (failing && !site.alertDownAt) out.push({ kind: "down", key: `down:${checkedAt.toISOString()}` });
    if (site.status === "up" && site.alertDownAt) {
      out.push({ kind: "recovered", key: `up:${site.alertDownAt.toISOString()}`, downSince: site.alertDownAt });
    }
  }
  if (prefs.alertSsl && site.sslExpiresAt) {
    const lvl = expiryLevel(site.sslExpiresAt, now);
    if (lvl) {
      out.push({ kind: "ssl", key: `ssl:${lvl.level}:${day(site.sslExpiresAt)}`, ...lvl, expiresAt: site.sslExpiresAt });
    } else if (untrusted(site.sslInfo)) {
      out.push({ kind: "ssl", key: `ssl:invalid:${day(site.sslExpiresAt)}`, level: "invalid",
        expiresAt: site.sslExpiresAt, daysLeft: Math.ceil((site.sslExpiresAt.getTime() - now) / DAY_MS) });
    }
  }
  if (prefs.alertDomain && site.domainExpiresAt) {
    const lvl = expiryLevel(site.domainExpiresAt, now);
    if (lvl) {
      out.push({ kind: "domain", key: `domain:${lvl.level}:${day(site.domainExpiresAt)}`, ...lvl, expiresAt: site.domainExpiresAt });
    }
  }
  return out;
}
