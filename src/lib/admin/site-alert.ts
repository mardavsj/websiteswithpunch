/** Why a site that's down has no alert logged. Pure, so the admin drawer and tests agree. */
export type ReasonSite = { status: string; locked: boolean; alertDownAt: Date | null; lastCheckedAt: Date | null };
export type ReasonUser = { verified: boolean; alertDown: boolean };
export type ReasonLog = { kind: string; sent: boolean; createdAt: Date };

export function noAlertReason(site: ReasonSite, user: ReasonUser, logs: ReasonLog[]): string | null {
  if (site.status !== "down" && site.status !== "error") return null;
  if (site.locked) return "Site is locked (over the plan limit), so it isn't checked and gets no alerts.";
  const since = site.alertDownAt?.getTime() ?? 0;
  const log = logs.find((l) => l.kind === "down" && (!site.alertDownAt || l.createdAt.getTime() >= since - 60_000));
  if (log?.sent) return null;
  if (log) return "A down alert was logged but the email didn't go out (send failure or the daily cap). It isn't retried for this incident.";
  if (!user.verified) return "Owner hasn't verified their email. Alerts only go to verified accounts.";
  if (!user.alertDown) return "Owner turned off down alerts.";
  if (site.alertDownAt) return "Marked as alerted, but no log row exists (logged before alert history was kept).";
  return "No check with alerts on has run since it went down (for example it was last checked before alerts were deployed). The next daily check or a Recheck will email the owner if it's still down.";
}
