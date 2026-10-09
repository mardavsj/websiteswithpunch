import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRdapDomain } from "../src/lib/rdap-parse";
import { nextDomainInfo, nextSslInfo } from "../src/lib/site-info";
import { analyticsExtras } from "../src/lib/analytics-extras";
import { healthScore } from "../src/lib/health-score";

const RDAP = {
  status: ["client transfer prohibited", "client delete prohibited"],
  events: [
    { eventAction: "registration", eventDate: "2026-04-23T07:35:40Z" },
    { eventAction: "expiration", eventDate: "2027-04-23T07:35:40Z" },
    { eventAction: "last changed", eventDate: "2026-05-01T00:00:00Z" },
  ],
  entities: [{ roles: ["registrar"], vcardArray: ["vcard", [["fn", {}, "text", "GoDaddy.com, LLC"]]] as never }],
  nameservers: [{ ldhName: "NS43.DOMAINCONTROL.COM" }, { ldhName: "ns44.domaincontrol.com." }],
};

test("RDAP parse reads registrar, dates, nameservers and statuses", () => {
  const r = parseRdapDomain(RDAP)!;
  assert.equal(r.registrar, "GoDaddy.com, LLC");
  assert.equal(r.expiresAt?.toISOString(), "2027-04-23T07:35:40.000Z");
  assert.equal(r.registeredAt?.toISOString(), "2026-04-23T07:35:40.000Z");
  assert.equal(r.updatedAt?.toISOString(), "2026-05-01T00:00:00.000Z");
  assert.deepEqual(r.nameservers, ["ns43.domaincontrol.com", "ns44.domaincontrol.com"]);
  assert.deepEqual(r.statuses, ["client transfer prohibited", "client delete prohibited"]);
});

test("RDAP without an expiry is not a result", () => {
  assert.equal(parseRdapDomain({ events: [{ eventAction: "registration", eventDate: "2020-01-01" }] }), null);
});

test("a failed lookup keeps the last good facts and records the error", () => {
  const ok = nextDomainInfo(null, { ...parseRdapDomain(RDAP)!, source: "RDAP", server: "rdap.verisign.com", domain: "makvion.com" });
  assert.equal(ok.registrar, "GoDaddy.com, LLC");
  const failed = nextDomainInfo(ok, { expiresAt: null, daysLeft: null, error: "RDAP request failed" });
  assert.equal(failed.registrar, "GoDaddy.com, LLC");
  assert.equal(failed.lastError, "RDAP request failed");
  const ssl = nextSslInfo(null, { expiresAt: null, daysLeft: null, error: "SSL timeout" });
  assert.equal(ssl.checkedAt, null);
  assert.equal(ssl.lastError, "SSL timeout");
});

test("extras: percentiles, slowest, and no-response reasons only", () => {
  const at = (m: number) => new Date(Date.UTC(2026, 9, 9, 0, m));
  const checks = [
    { status: "up", statusCode: 200, latencyMs: 100, error: null, checkedAt: at(0) },
    { status: "down", statusCode: 503, latencyMs: 900, error: "HTTP 503", checkedAt: at(1) },
    { status: "error", statusCode: null, latencyMs: 300, error: "Timed out", checkedAt: at(2) },
    { status: "up", statusCode: 200, latencyMs: 200, error: null, checkedAt: at(3) },
  ];
  const x = analyticsExtras(checks, []);
  assert.equal(x.p50, 250);
  assert.equal(x.slowest[0].ms, 900);
  assert.equal(x.recent[0].t, at(3).toISOString());
  assert.deepEqual(x.errors, [{ message: "Timed out", count: 1 }]);
  assert.equal(x.noCode, 1);
});

test("health parts add up to the score", () => {
  const h = healthScore({ uptimePercent: 100, avgLatencyMs: 144, sslDaysLeft: 53, domainDaysLeft: 197 });
  assert.deepEqual(h.parts, { uptime: 100, latency: 100, ssl: 80, domain: 100 });
  assert.equal(h.score, 97);
});
