import { formatDuration } from "@/lib/analytics";
import { HEALTH_WEIGHTS } from "@/lib/health-score";
import { CHECK_SCHEDULE } from "@/lib/check-schedule";
import type { AnalyticsPayload } from "@/components/analytics-types";
import type { SiteDetails } from "./types";
import { Group, Item, List, NA, Row, Rows, fmtMs, fmtTime, orNA } from "./parts";

type P = { data: AnalyticsPayload };
type PD = P & { details: SiteDetails };

const pct = (n: number | null | undefined) => (n == null ? null : `${n}%`);
const NO_CHECKS = "No checks in this range yet.";

export function HealthPanel({ data }: P) {
  const p = data.healthParts;
  const lines = [
    { label: "Uptime", w: HEALTH_WEIGHTS.uptime, score: p?.uptime, input: pct(data.uptimePercent) ?? "No checks yet (counted as 100)" },
    { label: "Response time", w: HEALTH_WEIGHTS.latency, score: p?.latency, input: data.latency.avg == null ? "No timings yet (counted as 100)" : `Average ${fmtMs(data.latency.avg)}` },
    { label: "SSL certificate", w: HEALTH_WEIGHTS.ssl, score: p?.ssl, input: data.ssl.daysLeft == null ? "Expiry unknown (counted as 70)" : `${data.ssl.daysLeft} days left` },
    { label: "Domain", w: HEALTH_WEIGHTS.domain, score: p?.domain, input: data.domain.daysLeft == null ? "Expiry unknown (counted as 70)" : `${data.domain.daysLeft} days left` },
  ];
  return (
    <>
      <Group title="Score">
        <Rows>
          <Row label="Health score">
            {data.healthScore} / 100 · {data.healthLabel}
          </Row>
        </Rows>
      </Group>
      <Group title="How it adds up" note="Each part is scored out of 100, then weighted.">
        <List>
          {lines.map((l) => (
            <Item
              key={l.label}
              left={`${l.label} · ${Math.round(l.w * 100)}%`}
              right={l.score == null ? "—" : `${Math.round(l.score * 10) / 10} → ${Math.round(l.score * l.w * 10) / 10}`}
              sub={l.input}
            />
          ))}
        </List>
      </Group>
      <Group title="Scoring bands">
        <Rows>
          <Row label="Labels">85+ Excellent · 70–84 Good · 50–69 Watch · under 50 Critical</Row>
          <Row label="Response time">≤200 ms 100 · ≤500 85 · ≤1 s 70 · ≤2 s 50 · slower 30</Row>
          <Row label="SSL days left">60+ 100 · 31–60 80 · 15–30 55 · 8–14 35 · ≤7 15</Row>
          <Row label="Domain days left">90+ 100 · 61–90 85 · 31–60 65 · 15–30 40 · ≤14 20</Row>
        </Rows>
      </Group>
    </>
  );
}

export function UptimePanel({ data, details }: PD) {
  const t = data.totals;
  return (
    <>
      <Group title="This range">
        <Rows>
          <Row label="Uptime">{orNA(pct(data.uptimePercent), NO_CHECKS)}</Row>
          <Row label="Checks">{t.checks.toLocaleString("en-IN")}</Row>
          <Row label="Up">{t.up.toLocaleString("en-IN")}</Row>
          <Row label="Down (HTTP error)">{t.down.toLocaleString("en-IN")}</Row>
          <Row label="No response">{t.error.toLocaleString("en-IN")}</Row>
        </Rows>
      </Group>
      <Group title="Uptime by window">
        <Rows>
          {details.uptimeWindows.map((w) => (
            <Row key={w.key} label={`Last ${w.days === 1 ? "24 hours" : `${w.days} days`}`}>
              {w.checks ? `${w.percent}% · ${w.checks.toLocaleString("en-IN")} checks` : <NA reason="No checks in this window yet." />}
            </Row>
          ))}
        </Rows>
      </Group>
      <Group title="Checks">
        <Rows>
          <Row label="Last check">{orNA(data.site?.lastSeenAt && fmtTime(data.site.lastSeenAt), "Not checked yet.")}</Row>
          <Row label="Last full check">{orNA(details.lastFullCheckAt && fmtTime(details.lastFullCheckAt), "Not checked yet.")}</Row>
          <Row label="Last status code">{orNA(data.site?.lastStatusCode, "The last check got no HTTP response.")}</Row>
          <Row label="First check saved">{orNA(details.firstCheckAt && fmtTime(details.firstCheckAt), "No saved checks yet.")}</Row>
          <Row label="Schedule">
            {details.schedule.daily}. {details.schedule.manual}. {details.schedule.auto}.
          </Row>
          <Row label="Check location">{details.schedule.location}</Row>
        </Rows>
      </Group>
    </>
  );
}

export function LatencyPanel({ data }: P) {
  const l = data.latency;
  const x = data.extras;
  const none = "No timed checks in this range.";
  return (
    <>
      <Group title="Response time" note={`Full request time from ${CHECK_SCHEDULE.location.split(" (")[0]}, including redirects.`}>
        <Rows>
          <Row label="Average">{orNA(l.avg != null && fmtMs(l.avg), none)}</Row>
          <Row label="Median (p50)">{orNA(x?.p50 != null && fmtMs(x.p50), none)}</Row>
          <Row label="p95">{orNA(l.p95 != null && fmtMs(l.p95), none)}</Row>
          <Row label="Fastest">{orNA(l.min != null && fmtMs(l.min), none)}</Row>
          <Row label="Slowest">{orNA(l.max != null && fmtMs(l.max), none)}</Row>
          <Row label="Timed checks">{x ? x.timedChecks.toLocaleString("en-IN") : "—"}</Row>
          <Row label="Latest check">{orNA(data.site?.lastLatencyMs != null && fmtMs(data.site.lastLatencyMs), "Not checked yet.")}</Row>
        </Rows>
      </Group>
      <Group title="Slowest checks">
        {x?.slowest.length ? (
          <List>
            {x.slowest.map((c) => (
              <Item key={c.t} left={fmtTime(c.t)} right={fmtMs(c.ms)} sub={c.code != null ? `HTTP ${c.code}` : c.error ?? "No response"} />
            ))}
          </List>
        ) : (
          <NA reason={none} />
        )}
      </Group>
    </>
  );
}

export function DowntimePanel({ data, details }: PD) {
  const inc = data.incidents[0];
  const x = data.extras;
  return (
    <>
      <Group title="This range">
        <Rows>
          <Row label="Last problem">{orNA(data.lastDowntimeAt && fmtTime(data.lastDowntimeAt), "No failed checks in this range.")}</Row>
          <Row label="Incidents">{x ? x.incidentCount : data.incidents.length}</Row>
          <Row label="Total downtime">{x?.downtimeMs ? formatDuration(x.downtimeMs) : "None"}</Row>
        </Rows>
      </Group>
      {inc && (
        <Group title="Latest incident">
          <Rows>
            <Row label="Status">
              <span className="capitalize">{inc.status}</span>
            </Row>
            <Row label="Started">{fmtTime(inc.startedAt)}</Row>
            <Row label="Ended">{inc.endedAt ? fmtTime(inc.endedAt) : "Ongoing"}</Row>
            <Row label="Duration">{formatDuration(inc.durationMs)}</Row>
            <Row label="Status code">{orNA(inc.statusCode, "No HTTP response.")}</Row>
            <Row label="Error">{orNA(inc.error, "No error text saved.")}</Row>
          </Rows>
        </Group>
      )}
      <Group title="All saved history">
        <Rows>
          <Row label="Last failed check">
            {details.lastIssue ? fmtTime(details.lastIssue.at) : <NA reason="No failed checks saved (we keep 90 days)." />}
          </Row>
          {details.lastIssue && (
            <Row label="What happened">
              {details.lastIssue.code != null ? `HTTP ${details.lastIssue.code}` : details.lastIssue.error ?? "No response"}
            </Row>
          )}
          <Row label="Last successful check">{orNA(details.lastUpAt && fmtTime(details.lastUpAt), "No successful check saved yet.")}</Row>
        </Rows>
      </Group>
    </>
  );
}
