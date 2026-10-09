import { percentile, type CheckPoint, type Incident } from "./analytics";

/** One saved check, as listed in the Details panels. */
export type CheckRow = { t: string; status: string; code: number | null; ms: number | null; error: string | null };

const row = (c: CheckPoint): CheckRow => ({
  t: c.checkedAt.toISOString(),
  status: c.status,
  code: c.statusCode,
  ms: c.latencyMs,
  error: c.error,
});

/**
 * Extra facts for the Details panels, computed from the rows the analytics route already loaded
 * (no extra queries). checks must be oldest → newest.
 */
export function analyticsExtras(checks: CheckPoint[], incidents: Incident[]) {
  const timed = checks.filter((c) => c.latencyMs != null);
  const sorted = timed.map((c) => c.latencyMs!).sort((a, b) => a - b);
  const p50 = percentile(sorted, 50);
  const slowest = [...timed]
    .sort((a, b) => b.latencyMs! - a.latencyMs! || b.checkedAt.getTime() - a.checkedAt.getTime())
    .slice(0, 5)
    .map(row);
  const recent = checks.slice(-10).reverse().map(row);

  const errorCounts = new Map<string, number>();
  for (const c of checks) {
    // "No response" reasons only: HTTP errors are already counted under their status code.
    if (c.statusCode != null || !c.error) continue;
    errorCounts.set(c.error, (errorCounts.get(c.error) ?? 0) + 1);
  }
  const errors = [...errorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([message, count]) => ({ message: message.slice(0, 160), count }));

  const lastSeen: Record<string, string> = {};
  for (const c of checks) if (c.statusCode != null) lastSeen[String(c.statusCode)] = c.checkedAt.toISOString();

  return {
    p50: p50 == null ? null : Math.round(p50),
    timedChecks: sorted.length,
    slowest,
    recent,
    errors,
    noCode: checks.filter((c) => c.statusCode == null).length,
    codeLastSeen: lastSeen,
    downtimeMs: incidents.reduce((s, i) => s + (i.durationMs ?? 0), 0),
    incidentCount: incidents.length,
    firstAt: checks[0]?.checkedAt.toISOString() ?? null,
  };
}

export type AnalyticsExtras = ReturnType<typeof analyticsExtras>;
