/** Share of the health score each part carries. */
export const HEALTH_WEIGHTS = { uptime: 0.5, latency: 0.25, ssl: 0.15, domain: 0.1 } as const;

/** Each part scored 0–100 before weighting (the Details panel shows these). */
export type HealthParts = { uptime: number; latency: number; ssl: number; domain: number };

function latencyPart(ms: number | null): number {
  if (ms == null || ms <= 200) return 100;
  if (ms <= 500) return 85;
  if (ms <= 1000) return 70;
  if (ms <= 2000) return 50;
  return 30;
}

function sslPart(days: number | null): number {
  if (days == null) return 70;
  if (days > 60) return 100;
  if (days > 30) return 80;
  if (days > 14) return 55;
  if (days > 7) return 35;
  return 15;
}

function domainPart(days: number | null): number {
  if (days == null) return 70;
  if (days > 90) return 100;
  if (days > 60) return 85;
  if (days > 30) return 65;
  if (days > 14) return 40;
  return 20;
}

export function healthScore(input: {
  uptimePercent: number | null;
  avgLatencyMs: number | null;
  sslDaysLeft: number | null;
  domainDaysLeft: number | null;
}): { score: number; label: string; parts: HealthParts } {
  const parts: HealthParts = {
    uptime: input.uptimePercent ?? 100,
    latency: latencyPart(input.avgLatencyMs),
    ssl: sslPart(input.sslDaysLeft),
    domain: domainPart(input.domainDaysLeft),
  };
  const w = HEALTH_WEIGHTS;
  const score = Math.round(
    parts.uptime * w.uptime + parts.latency * w.latency + parts.ssl * w.ssl + parts.domain * w.domain,
  );
  const clamped = Math.max(0, Math.min(100, score));
  let label = "Excellent";
  if (clamped < 50) label = "Critical";
  else if (clamped < 70) label = "Watch";
  else if (clamped < 85) label = "Good";
  return { score: clamped, label, parts };
}
