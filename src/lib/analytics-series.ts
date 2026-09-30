import { rangeToMs, type CheckPoint, type RangeKey } from "./analytics";

const MIN = 60_000;
const HOUR = 60 * MIN;

/** Fixed latency bucket per range (epoch-aligned, so boundaries never drift). */
export function latencyBucketMs(range: RangeKey): number {
  switch (range) {
    case "24h":
      return 30 * MIN; // 48 buckets
    case "7d":
      return 3 * HOUR; // 56 buckets
    case "30d":
      return 12 * HOUR; // 60 buckets
    case "90d":
      return 24 * HOUR; // 90 buckets
  }
}

/** Round a timestamp down to the start of its fixed bucket. */
export function alignDown(ms: number, bucketMs: number): number {
  return Math.floor(ms / bucketMs) * bucketMs;
}

export type LatencyPoint = { t: string; ms: number };

/** Below this many buckets the averaged line is too thin to read. */
const MIN_BUCKETS = 3;

/**
 * Deterministic latency series. checks must be oldest → newest (the query
 * orders by checkedAt, then id), so the same rows always give the same points.
 *
 * - Few samples (≤ 2× the range's slot count) or fewer than MIN_BUCKETS
 *   buckets: every check is plotted at its real time (raw).
 * - Otherwise: average per fixed, epoch-aligned bucket (boundaries never drift).
 */
export function latencySeries(checks: CheckPoint[], range: RangeKey): LatencyPoint[] {
  const samples = checks.filter((c) => c.latencyMs != null);
  if (!samples.length) return [];
  const raw = () => samples.map((c) => ({ t: c.checkedAt.toISOString(), ms: c.latencyMs as number }));

  const bucketMs = latencyBucketMs(range);
  const slots = Math.round(rangeToMs(range) / bucketMs);
  if (samples.length <= slots * 2) return raw();

  const sums = new Map<number, { sum: number; n: number }>();
  for (const c of samples) {
    const key = alignDown(c.checkedAt.getTime(), bucketMs);
    const b = sums.get(key);
    if (b) {
      b.sum += c.latencyMs as number;
      b.n += 1;
    } else {
      sums.set(key, { sum: c.latencyMs as number, n: 1 });
    }
  }
  if (sums.size < MIN_BUCKETS) return raw();
  return Array.from(sums.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([t, b]) => ({ t: new Date(t).toISOString(), ms: Math.round(b.sum / b.n) }));
}
