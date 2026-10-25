import type { AnalyticsPayload } from "@/components/analytics-types";
import type { DetailsSection, SiteDetails } from "@/components/details/types";
import { healthFixes, type Fix, type HealthInput } from "./health";
import { codeAdvice, incidentAdvice } from "./events";

import { great, improve, nodata, type Insight, type Tip } from "./shape";
export type { Insight, Tip };

export function healthInput(d: AnalyticsPayload, x?: SiteDetails | null): HealthInput {
  return {
    uptimePercent: d.uptimePercent,
    avgLatencyMs: d.latency.avg,
    sslDaysLeft: d.ssl.daysLeft,
    domainDaysLeft: d.domain.daysLeft,
    checks: d.totals.checks,
    failed: d.totals.down + d.totals.error,
    registrar: x?.domain?.registrar ?? null,
  };
}

const tip = (f: Fix): Tip => ({ title: f.title, lacking: f.lacking, steps: f.steps, tone: f.tone });

function uptime(d: AnalyticsPayload): Insight {
  if (d.uptimePercent == null || d.totals.checks === 0) return nodata("No checks in this range yet, so there's nothing to judge.");
  const f = healthFixes(healthInput(d)).fixes.find((x) => x.key === "uptime");
  return f ? improve([tip(f)]) : great("Every check in this range succeeded. Keep an eye on the uptime chart after big changes.");
}

function latency(d: AnalyticsPayload): Insight {
  const { avg, p95 } = d.latency;
  if (avg == null) return nodata("No timed checks in this range yet.");
  const items: Tip[] = [];
  const f = healthFixes(healthInput(d)).fixes.find((x) => x.key === "latency");
  if (f) items.push(tip(f));
  if (p95 != null && p95 > 500 && p95 > avg * 2) {
    items.push({
      title: "Uneven speed",
      tone: "warn",
      lacking: `Slowest 5% of checks took ${Math.round(p95)} ms or more, over twice the ${Math.round(avg)} ms average.`,
      steps: [
        "Open Latency trend to see when the spikes happen.",
        "Look for scheduled jobs, backups or cold starts (serverless or sleeping hosts) at those times.",
        "Keep the app warm or cache the slow pages so occasional visitors don't wait.",
      ],
    });
  }
  return items.length ? improve(items) : great(`Average ${Math.round(avg)} ms is within full marks (200 ms or less).`);
}

function ssl(d: AnalyticsPayload, x: SiteDetails | null): Insight {
  const s = x?.ssl;
  const items: Tip[] = [];
  if (s?.trusted === false) {
    items.push({
      title: "Certificate not trusted",
      tone: "bad",
      lacking: `Browsers will warn visitors${s.trustError ? `: ${s.trustError}` : "."}`,
      steps: [
        "Renew or reinstall the certificate from your host or certificate provider.",
        "Install the full chain (certificate plus intermediates), not just the site certificate.",
        `Make sure it covers the exact hostname${s.host ? ` (${s.host})` : ""}, including or excluding www as you use it.`,
      ],
    });
  }
  if (d.ssl.daysLeft == null && !items.length) {
    return nodata(s?.lastError ? `We couldn't read the certificate: ${s.lastError}` : "We haven't been able to read this site's certificate yet.");
  }
  const f = healthFixes(healthInput(d, x)).fixes.find((y) => y.key === "ssl");
  if (f && d.ssl.daysLeft != null) items.push(tip(f));
  if (d.ssl.daysLeft != null && d.ssl.daysLeft <= 0) items[items.length - 1].lacking = "The certificate has expired. Visitors see a security warning.";
  return items.length ? improve(items) : great("Valid certificate with more than 60 days left. Keep auto-renew on.");
}

function domain(d: AnalyticsPayload, x: SiteDetails | null): Insight {
  if (d.domain.daysLeft == null) {
    const reg = x?.domain?.registrar;
    return nodata(`The registry didn't give us an expiry date${x?.domain?.lastError ? ` (${x.domain.lastError})` : ""}. Check renewal ${reg ? `at ${reg}` : "at your registrar"}.`);
  }
  const f = healthFixes(healthInput(d, x)).fixes.find((y) => y.key === "domain");
  return f ? improve([tip(f)]) : great("More than 90 days left on the registration. Keep auto-renew on at your registrar.");
}

/** "How to improve" for one Details section. Pure: same data in, same advice out. */
export function sectionInsight(section: DetailsSection, d: AnalyticsPayload, x: SiteDetails | null = null): Insight {
  switch (section) {
    case "health": {
      const h = healthFixes(healthInput(d, x));
      return h.perfect ? great(h.tips.join(" ")) : improve(h.fixes.map((f) => ({ ...tip(f), gain: f.gain })), `Fix everything below to reach ${h.projected} / 100.`);
    }
    case "uptime":
    case "timeline":
      return uptime(d);
    case "latency":
    case "trend":
      return latency(d);
    case "downtime":
    case "incidents":
      return incidentAdvice(d);
    case "codes":
      return codeAdvice(d);
    case "ssl":
      return ssl(d, x);
    case "domain":
      return domain(d, x);
  }
}
