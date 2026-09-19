export type RangeKey = "24h" | "7d" | "30d" | "90d";

export type CheckPoint = {
  status: string;
  statusCode: number | null;
  latencyMs: number | null;
  error: string | null;
  checkedAt: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Unlock thresholds in days (age must be >= days). */
const RANGE_UNLOCK_DAYS: Record<RangeKey, number> = {
  "24h": 0,
  "7d": 7,
  "30d": 30,
  "90d": 14,
};

const RANGE_UNLOCK_LABEL: Record<RangeKey, string> = {
  "24h": "24-hour",
  "7d": "7-day",
  "30d": "30-day",
  "90d": "All-time",
};

/** All ranges ordered shortest → longest window. */
export const RANGE_ORDER: RangeKey[] = ["24h", "7d", "30d", "90d"];

export function rangeToMs(range: RangeKey): number {
  switch (range) {
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return 30 * 24 * 60 * 60 * 1000;
    case "90d":
      return 90 * 24 * 60 * 60 * 1000;
  }
}

export function parseRange(raw: string | null): RangeKey {
  if (raw === "24h" || raw === "7d" || raw === "30d" || raw === "90d") return raw;
  return "7d";
}

/** Days of history required before a range unlocks. */
export function rangeUnlockRequirement(range: RangeKey): { days: number; label: string } {
  return { days: RANGE_UNLOCK_DAYS[range], label: RANGE_UNLOCK_LABEL[range] };
}

/**
 * ageDays for messaging: 0 if brand new (ageMs === 0),
 * at least 1 if any positive age under a day, otherwise ceil(days).
 */
export function ageDaysFromMs(ageMs: number): number {
  if (ageMs <= 0) return 0;
  if (ageMs < DAY_MS) return 1;
  return Math.ceil(ageMs / DAY_MS);
}

/** Ranges unlocked given site age in milliseconds. */
export function getUnlockedRanges(ageMs: number): RangeKey[] {
  const ageDaysExact = ageMs / DAY_MS;
  return RANGE_ORDER.filter((key) => ageDaysExact >= RANGE_UNLOCK_DAYS[key]);
}

/** Longest unlocked range by window size; falls back to 24h. */
export function longestUnlockedRange(unlocked: RangeKey[]): RangeKey {
  if (!unlocked.length) return "24h";
  return unlocked.reduce((best, r) => (rangeToMs(r) > rangeToMs(best) ? r : best));
}

/**
 * Clamp a requested range to an unlocked one.
 * If requested is unlocked, keep it; otherwise use the longest unlocked.
 */
export function clampRangeToUnlocked(
  requested: RangeKey,
  unlocked: RangeKey[]
): { range: RangeKey; rangeClamped: boolean } {
  if (unlocked.includes(requested)) {
    return { range: requested, rangeClamped: false };
  }
  return { range: longestUnlockedRange(unlocked), rangeClamped: true };
}

export function formatAgeDays(ageDays: number): string {
  if (ageDays <= 0) return "less than a day";
  if (ageDays === 1) return "1 day";
  return `${ageDays} days`;
}

export function lockedRangeNotice(ageDays: number, range: RangeKey): string {
  const { days, label } = rangeUnlockRequirement(range);
  if (ageDays <= 0) {
    return `This site was just added. ${label} analytics unlocks after ${days} days of history.`;
  }
  const ageText = formatAgeDays(ageDays);
  return `This site has only been monitored for about ${ageText}. ${label} analytics unlocks after ${days} days of history.`;
}

export function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

export type Incident = {
  status: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  statusCode: number | null;
  error: string | null;
};

/** checks must be oldest → newest */
export function buildIncidents(checks: CheckPoint[]): Incident[] {
  const incidents: Incident[] = [];
  let current: {
    status: string;
    startedAt: Date;
    statusCode: number | null;
    error: string | null;
  } | null = null;

  for (const c of checks) {
    const bad = c.status === "down" || c.status === "error";
    if (bad) {
      if (!current) {
        current = {
          status: c.status,
          startedAt: c.checkedAt,
          statusCode: c.statusCode,
          error: c.error,
        };
      } else {
        current.status = c.status;
        current.statusCode = c.statusCode ?? current.statusCode;
        current.error = c.error ?? current.error;
      }
    } else if (current) {
      incidents.push({
        status: current.status,
        startedAt: current.startedAt.toISOString(),
        endedAt: c.checkedAt.toISOString(),
        durationMs: c.checkedAt.getTime() - current.startedAt.getTime(),
        statusCode: current.statusCode,
        error: current.error,
      });
      current = null;
    }
  }
  if (current) {
    incidents.push({
      status: current.status,
      startedAt: current.startedAt.toISOString(),
      endedAt: null,
      durationMs: Date.now() - current.startedAt.getTime(),
      statusCode: current.statusCode,
      error: current.error,
    });
  }
  return incidents.reverse();
}

export type TimelineBucket = {
  t: string;
  status: "up" | "down" | "error" | "mixed" | "empty";
  up: number;
  down: number;
  error: number;
};

export function buildTimeline(checks: CheckPoint[], range: RangeKey): TimelineBucket[] {
  if (!checks.length) return [];
  const bucketMs = range === "24h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const start = checks[0].checkedAt.getTime();
  const end = checks[checks.length - 1].checkedAt.getTime();
  const buckets: TimelineBucket[] = [];
  const map = new Map<number, TimelineBucket>();

  for (let t = Math.floor(start / bucketMs) * bucketMs; t <= end; t += bucketMs) {
    const b: TimelineBucket = {
      t: new Date(t).toISOString(),
      status: "empty",
      up: 0,
      down: 0,
      error: 0,
    };
    map.set(t, b);
    buckets.push(b);
  }

  for (const c of checks) {
    const key = Math.floor(c.checkedAt.getTime() / bucketMs) * bucketMs;
    const b = map.get(key);
    if (!b) continue;
    if (c.status === "up") b.up += 1;
    else if (c.status === "down") b.down += 1;
    else b.error += 1;
  }

  for (const b of buckets) {
    const total = b.up + b.down + b.error;
    if (total === 0) b.status = "empty";
    else if (b.down > 0 && b.up === 0 && b.error === 0) b.status = "down";
    else if (b.error > 0 && b.up === 0 && b.down === 0) b.status = "error";
    else if (b.up === total) b.status = "up";
    else b.status = "mixed";
  }
  return buckets;
}

export function latencySeries(
  checks: CheckPoint[],
  maxPoints = 48
): Array<{ t: string; ms: number }> {
  const withLatency = checks.filter((c) => c.latencyMs != null) as Array<
    CheckPoint & { latencyMs: number }
  >;
  if (!withLatency.length) return [];
  if (withLatency.length <= maxPoints) {
    return withLatency.map((c) => ({ t: c.checkedAt.toISOString(), ms: c.latencyMs }));
  }
  const step = withLatency.length / maxPoints;
  const out: Array<{ t: string; ms: number }> = [];
  for (let i = 0; i < maxPoints; i++) {
    const slice = withLatency.slice(Math.floor(i * step), Math.floor((i + 1) * step));
    if (!slice.length) continue;
    const avg = Math.round(slice.reduce((s, c) => s + c.latencyMs, 0) / slice.length);
    out.push({ t: slice[slice.length - 1].checkedAt.toISOString(), ms: avg });
  }
  return out;
}

export function healthScore(input: {
  uptimePercent: number | null;
  avgLatencyMs: number | null;
  sslDaysLeft: number | null;
  domainDaysLeft: number | null;
}): { score: number; label: string } {
  const uptime = input.uptimePercent ?? 100;
  let latencyScore = 100;
  if (input.avgLatencyMs != null) {
    if (input.avgLatencyMs <= 200) latencyScore = 100;
    else if (input.avgLatencyMs <= 500) latencyScore = 85;
    else if (input.avgLatencyMs <= 1000) latencyScore = 70;
    else if (input.avgLatencyMs <= 2000) latencyScore = 50;
    else latencyScore = 30;
  }
  const sslScore =
    input.sslDaysLeft == null
      ? 70
      : input.sslDaysLeft > 60
        ? 100
        : input.sslDaysLeft > 30
          ? 80
          : input.sslDaysLeft > 14
            ? 55
            : input.sslDaysLeft > 7
              ? 35
              : 15;
  const domainScore =
    input.domainDaysLeft == null
      ? 70
      : input.domainDaysLeft > 90
        ? 100
        : input.domainDaysLeft > 60
          ? 85
          : input.domainDaysLeft > 30
            ? 65
            : input.domainDaysLeft > 14
              ? 40
              : 20;

  const score = Math.round(
    uptime * 0.5 + latencyScore * 0.25 + sslScore * 0.15 + domainScore * 0.1
  );
  const clamped = Math.max(0, Math.min(100, score));
  let label = "Excellent";
  if (clamped < 50) label = "Critical";
  else if (clamped < 70) label = "Watch";
  else if (clamped < 85) label = "Good";
  return { score: clamped, label };
}

export function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}
