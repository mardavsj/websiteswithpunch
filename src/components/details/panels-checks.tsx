import { formatDuration } from "@/lib/analytics";
import type { AnalyticsPayload } from "@/components/analytics-types";
import type { SiteDetails } from "./types";
import { NA, Row, Rows, fmtTime, orNA } from "./parts";
import { Card, Chip, Hero, Meter, Stats, type Tone } from "./ui";
import { IconAlert, IconCalendar, IconClock, IconPulse } from "./icons";

type PD = { data: AnalyticsPayload; details: SiteDetails };

const n = (v: number) => v.toLocaleString("en-IN");

/** Current status from the latest check, as a chip. */
export function statusChip(status: string | undefined) {
  if (status === "up") return <Chip tone="ok">Up now</Chip>;
  if (status === "down" || status === "error") return <Chip tone="bad">Down now</Chip>;
  return <Chip>Not checked yet</Chip>;
}

export function UptimePanel({ data, details }: PD) {
  const t = data.totals;
  const pct = data.uptimePercent;
  const tone: Tone = data.site?.status === "up" ? "ok" : data.site?.status ? "bad" : "neutral";
  return (
    <>
      <Hero
        label="Uptime in this range"
        value={pct == null ? "—" : pct}
        unit={pct == null ? undefined : "%"}
        chip={statusChip(data.site?.status)}
        caption={pct == null ? "No checks in this range yet." : `${n(t.up)} of ${n(t.checks)} checks were up.`}
      >
        {pct != null && <Meter value={pct / 100} tone={tone} label="Uptime" />}
      </Hero>
      <Stats
        items={[
          { label: "Checks", value: n(t.checks) },
          { label: "Up", value: n(t.up) },
          { label: "Down (HTTP)", value: n(t.down), tone: t.down ? "bad" : undefined },
          { label: "No response", value: n(t.error), tone: t.error ? "bad" : undefined },
        ]}
      />
      <Card title="Uptime by window" icon={<IconPulse />}>
        <ul className="divide-y divide-rule">
          {details.uptimeWindows.map((w) => (
            <li key={w.key} className="px-4 py-2.5 text-[13px]">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted">Last {w.days === 1 ? "24 hours" : `${w.days} days`}</span>
                {w.checks ? (
                  <span className="tabular-nums text-ink">
                    <span className="font-medium">{w.percent}%</span>
                    <span className="text-muted"> · {n(w.checks)} checks</span>
                  </span>
                ) : (
                  <NA reason="No checks in this window yet." />
                )}
              </div>
              {w.checks > 0 && w.percent != null && (
                <div className="mt-1.5">
                  <Meter value={w.percent / 100} tone={w.percent >= 95 ? "accent" : "bad"} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Checks" icon={<IconClock />}>
        <Rows>
          <Row label="Last check">{orNA(data.site?.lastSeenAt && fmtTime(data.site.lastSeenAt), "Not checked yet.")}</Row>
          <Row label="Last full check">{orNA(details.lastFullCheckAt && fmtTime(details.lastFullCheckAt), "Not checked yet.")}</Row>
          <Row label="Last status code">{orNA(data.site?.lastStatusCode, "The last check got no HTTP response.")}</Row>
          <Row label="First check saved">{orNA(details.firstCheckAt && fmtTime(details.firstCheckAt), "No saved checks yet.")}</Row>
          <Row label="Check location">{details.schedule.location}</Row>
        </Rows>
      </Card>
      <Card title="Schedule" icon={<IconCalendar />}>
        <ul className="space-y-1.5 px-4 py-3 text-[13px] text-ink">
          {[details.schedule.daily, details.schedule.manual, details.schedule.auto].map((s) => (
            <li key={s} className="flex gap-2">
              <span className="mt-[7px] h-1 w-1 shrink-0 bg-accent" />
              <span>{s}.</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

export function DowntimePanel({ data, details }: PD) {
  const inc = data.incidents[0];
  const x = data.extras;
  const ongoing = inc && !inc.endedAt;
  return (
    <>
      <Hero
        compact
        label="Last problem in this range"
        value={data.lastDowntimeAt ? fmtTime(data.lastDowntimeAt) : "None"}
        chip={ongoing ? <Chip tone="bad">Ongoing</Chip> : data.lastDowntimeAt ? <Chip>Resolved</Chip> : <Chip tone="ok">No problems</Chip>}
        caption={data.lastDowntimeAt ? undefined : "No failed checks in this range."}
      />
      <Stats
        items={[
          { label: "Incidents", value: x ? x.incidentCount : data.incidents.length },
          { label: "Total downtime", value: x?.downtimeMs ? formatDuration(x.downtimeMs) : "None" },
        ]}
      />
      {inc && (
        <Card title="Latest incident" icon={<IconAlert />} meta={ongoing ? "Ongoing" : formatDuration(inc.durationMs)}>
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
        </Card>
      )}
      <Card title="All saved history" icon={<IconClock />} meta="90 days">
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
      </Card>
    </>
  );
}
