import type { RangeKey } from "@/lib/analytics";
import type { HealthParts } from "@/lib/health-score";
import type { AnalyticsExtras } from "@/lib/analytics-extras";

/** GET /api/sites/[id]/analytics */
export type AnalyticsPayload = {
  range: RangeKey;
  requestedRange?: RangeKey;
  rangeClamped?: boolean;
  siteCreatedAt?: string;
  ageMs?: number;
  ageDays?: number;
  unlockedRanges?: RangeKey[];
  healthScore: number;
  healthLabel: string;
  /** Each part's 0–100 score before weighting (Health score Details). */
  healthParts?: HealthParts;
  uptimePercent: number | null;
  totals: { checks: number; up: number; down: number; error: number };
  latency: {
    avg: number | null;
    p95: number | null;
    min: number | null;
    max: number | null;
    series: Array<{ t: string; ms: number }>;
  };
  timeline: Array<{
    t: string;
    status: "up" | "down" | "error" | "mixed" | "empty";
    up: number;
    down: number;
    error: number;
  }>;
  incidents: Array<{
    status: string;
    startedAt: string;
    endedAt: string | null;
    durationMs: number | null;
    statusCode: number | null;
    error: string | null;
  }>;
  ssl: { daysLeft: number | null; expiresAt: string | null };
  domain: { daysLeft: number | null; expiresAt: string | null };
  statusCodes: Record<string, number>;
  /** Details panels: computed from the same rows (see lib/analytics-extras). */
  extras?: AnalyticsExtras & { latencyBucketMs: number; timelineBucketMs: number };
  lastDowntimeAt: string | null;
  empty: boolean;
  stale?: boolean;
  dataEndsAt?: string | null;
  site?: {
    status: string;
    lastCheckedAt: string | null;
    lastSeenAt?: string | null;
    lastStatusCode: number | null;
    lastLatencyMs: number | null;
  };
};
