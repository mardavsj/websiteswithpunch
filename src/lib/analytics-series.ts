import type { CheckPoint, RangeKey } from "./analytics";

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

/**
 * Deterministic latency series: average latency per fixed, epoch-aligned time
 * bucket. The same checks always produce the same points, no matter when the
 * request is made or how many rows are in the window.
 * checks must be oldest → newest.
 */
export function latencySeries(
  checks: CheckPoint[],
  range: RangeKey
): Array<{ t: string; ms: number }> {
  const bucketMs = latencyBucketMs(range);
  const sums = new Map<number, { sum: number; n: number }>();
  for (const c of checks) {
    if (c.latencyMs == null) continue;
    const key = alignDown(c.checkedAt.getTime(), bucketMs);
    const b = sums.get(key);
    if (b) {
      b.sum += c.latencyMs;
      b.n += 1;
    } else {
      sums.set(key, { sum: c.latencyMs, n: 1 });
    }
  }
  return Array.from(sums.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([t, b]) => ({ t: new Date(t).toISOString(), ms: Math.round(b.sum / b.n) }));
}
