import { test } from "node:test";
import assert from "node:assert/strict";
import { insightStatus, scoreStatus } from "../src/lib/insights/status";
import { fixTitle, focusFix, isFixKey } from "../src/lib/insights/focus";
import { healthFixes } from "../src/lib/insights/health";
import { sectionInsight } from "../src/lib/insights/sections";
import type { AnalyticsPayload } from "../src/components/analytics-types";

const base = { uptimePercent: 100, avgLatencyMs: 150, sslDaysLeft: 90, domainDaysLeft: 200 };

function payload(o: Partial<AnalyticsPayload> = {}): AnalyticsPayload {
  return {
    range: "24h", healthScore: 100, healthLabel: "Excellent", uptimePercent: 100,
    totals: { checks: 10, up: 10, down: 0, error: 0 },
    latency: { avg: 150, p95: 180, min: 100, max: 200, series: [] },
    timeline: [], incidents: [], ssl: { daysLeft: 90, expiresAt: null }, domain: { daysLeft: 200, expiresAt: null },
    statusCodes: { "200": 10 }, lastDowntimeAt: null, empty: false, ...o,
  } as AnalyticsPayload;
}

test("perfect score: no fixes, keep-it-up tips, projected 100", () => {
  const h = healthFixes(base);
  assert.equal(h.score, 100);
  assert.equal(h.perfect, true);
  assert.equal(h.fixes.length, 0);
  assert.ok(h.tips.length >= 1);
  assert.equal(h.projected, 100);
});

test("owner example: 317 ms + 37 days SSL → +3.8 and +3 ordered by gain", () => {
  const h = healthFixes({ ...base, avgLatencyMs: 317, sslDaysLeft: 37, domainDaysLeft: 181 });
  assert.equal(h.score, 93);
  assert.deepEqual(h.fixes.map((f) => [f.key, f.gain]), [["latency", 3.8], ["ssl", 3]]);
  assert.match(h.fixes[0].lacking, /317 ms.*200 ms/);
  assert.match(h.fixes[1].steps[0], /Let's Encrypt.*No action needed/);
});

test("each latency band gains (100 - part) × 25%", () => {
  for (const [ms, gain] of [[200, 0], [500, 3.8], [1000, 7.5], [2000, 12.5], [5000, 17.5]] as const) {
    const f = healthFixes({ ...base, avgLatencyMs: ms }).fixes.find((x) => x.key === "latency");
    assert.equal(f?.gain ?? 0, gain, `${ms} ms`);
  }
});

test("SSL and domain bands, with urgent wording near expiry", () => {
  for (const [d, gain] of [[61, 0], [60, 3], [30, 6.8], [14, 9.8], [7, 12.8]] as const) {
    assert.equal(healthFixes({ ...base, sslDaysLeft: d }).fixes.find((x) => x.key === "ssl")?.gain ?? 0, gain, `ssl ${d}`);
  }
  for (const [d, gain] of [[91, 0], [90, 1.5], [60, 3.5], [30, 6], [14, 8]] as const) {
    assert.equal(healthFixes({ ...base, domainDaysLeft: d }).fixes.find((x) => x.key === "domain")?.gain ?? 0, gain, `domain ${d}`);
  }
  assert.match(healthFixes({ ...base, sslDaysLeft: 5 }).fixes[0].steps[0], /Renew it now/);
  assert.match(healthFixes({ ...base, domainDaysLeft: 10, registrar: "Namecheap" }).fixes[0].steps[0], /Namecheap/);
});

test("uptime below 100 is the biggest fix and quotes failed checks", () => {
  const h = healthFixes({ ...base, uptimePercent: 90, avgLatencyMs: 300, checks: 20, failed: 1 });
  assert.equal(h.fixes[0].key, "uptime");
  assert.equal(h.fixes[0].gain, 5);
  assert.match(h.fixes[0].lacking, /1 of 20/);
});

test("missing data: unknown expiry explained, no checks → nodata, never invented numbers", () => {
  const h = healthFixes({ uptimePercent: null, avgLatencyMs: null, sslDaysLeft: null, domainDaysLeft: null });
  assert.deepEqual(h.fixes.map((f) => f.key), ["ssl", "domain"]);
  assert.match(h.fixes[0].lacking, /couldn't read/);
  const empty = payload({ uptimePercent: null, totals: { checks: 0, up: 0, down: 0, error: 0 }, latency: { avg: null, p95: null, min: null, max: null, series: [] }, statusCodes: {}, ssl: { daysLeft: null, expiresAt: null }, domain: { daysLeft: null, expiresAt: null } });
  for (const s of ["uptime", "latency", "incidents", "codes", "ssl", "domain"] as const) assert.equal(sectionInsight(s, empty).state, "nodata", s);
});

test("sections: great when perfect, improve with tailored causes", () => {
  const ok = payload();
  for (const s of ["health", "uptime", "latency", "trend", "incidents", "codes", "ssl", "domain"] as const) assert.equal(sectionInsight(s, ok).state, "great", s);
  const bad = payload({
    uptimePercent: 90, totals: { checks: 10, up: 9, down: 1, error: 0 },
    latency: { avg: 300, p95: 900, min: 100, max: 1200, series: [] },
    incidents: [{ status: "down", startedAt: "", endedAt: null, durationMs: null, statusCode: 503, error: null }],
    statusCodes: { "200": 9, "503": 1 },
  });
  const inc = sectionInsight("incidents", bad);
  assert.equal(inc.items[0].title, "Server errors (5xx)");
  assert.match(inc.items[0].lacking, /503.*ongoing/);
  assert.deepEqual(sectionInsight("latency", bad).items.map((i) => i.title), ["Response time", "Uneven speed"]);
  assert.equal(sectionInsight("codes", bad).items[0].tone, "bad");
  const untrusted = sectionInsight("ssl", ok, { ssl: { trusted: false, trustError: "unable to verify the first certificate", host: "x.com" } } as never);
  assert.equal(untrusted.items[0].title, "Certificate not trusted");
  assert.match(sectionInsight("health", bad).note, /100 \/ 100/);
});

test("focused fix: only the selected fix is returned", () => {
  const h = healthFixes({ uptimePercent: 100, avgLatencyMs: 317, sslDaysLeft: 37, domainDaysLeft: 181 });
  const r = focusFix(h.fixes, "latency");
  assert.equal(r.fix?.key, "latency");
  assert.equal(r.others, 1);
  assert.equal(fixTitle("latency"), "Improve response time");
  const none = focusFix(h.fixes, "domain");
  assert.equal(none.fix, null);
  assert.equal(none.others, 2);
  assert.ok(isFixKey("ssl") && !isFixKey("health") && !isFixKey(null));
});

test("modal status chip", () => {
  assert.deepEqual(scoreStatus(92), { label: "Excellent", tone: "ok" });
  assert.equal(scoreStatus(70).label, "Good");
  assert.equal(scoreStatus(55).tone, "warn");
  assert.equal(scoreStatus(10).label, "Critical");
  assert.equal(insightStatus({ state: "great", note: "", items: [] }).label, "Healthy");
  assert.equal(insightStatus({ state: "nodata", note: "", items: [] }).tone, "neutral");
  const t = (tone: "warn" | "bad") => ({ title: "x", lacking: "", steps: [], tone });
  assert.deepEqual(insightStatus({ state: "improve", note: "", items: [t("warn")] }), { label: "Needs attention", tone: "warn" });
  assert.equal(insightStatus({ state: "improve", note: "", items: [t("warn"), t("bad")] }).tone, "bad");
});
