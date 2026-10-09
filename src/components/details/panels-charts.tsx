import { formatDuration } from "@/lib/analytics";
import type { AnalyticsPayload } from "@/components/analytics-types";
import { Group, Item, List, NA, Row, Rows, fmtDay, fmtMs, fmtTime, orNA } from "./parts";

type P = { data: AnalyticsPayload };

function span(ms: number | undefined): string {
  if (!ms) return "—";
  const h = ms / 3_600_000;
  if (h < 1) return `${Math.round(ms / 60_000)}-minute`;
  return h < 24 ? `${h}-hour` : `${h / 24}-day`;
}

export function TrendPanel({ data }: P) {
  const s = data.latency.series;
  const x = data.extras;
  const vals = s.map((p) => p.ms);
  return (
    <>
      <Group title="What the chart shows">
        <Rows>
          <Row label="Each point">Average of the checks in a {span(x?.latencyBucketMs)} window</Row>
          <Row label="Points plotted">{s.length}</Row>
          <Row label="Lowest point">{orNA(vals.length > 0 && fmtMs(Math.min(...vals)), "Not enough checks to plot yet.")}</Row>
          <Row label="Highest point">{orNA(vals.length > 0 && fmtMs(Math.max(...vals)), "Not enough checks to plot yet.")}</Row>
          <Row label="Fastest single check">{orNA(data.latency.min != null && fmtMs(data.latency.min), "No timed checks.")}</Row>
          <Row label="Slowest single check">{orNA(data.latency.max != null && fmtMs(data.latency.max), "No timed checks.")}</Row>
        </Rows>
      </Group>
      <Group title="Latest checks">
        {x?.recent.length ? (
          <List>
            {x.recent.map((c, i) => (
              <Item
                key={`${c.t}-${i}`}
                left={fmtTime(c.t)}
                right={fmtMs(c.ms)}
                sub={`${c.status === "up" ? "Up" : c.status === "down" ? "Down" : "No response"}${c.code != null ? ` · HTTP ${c.code}` : ""}${c.error && c.status !== "up" ? ` · ${c.error}` : ""}`}
              />
            ))}
          </List>
        ) : (
          <NA reason="No checks in this range." />
        )}
      </Group>
    </>
  );
}

export function TimelinePanel({ data }: P) {
  const tl = data.timeline;
  const bad = tl.filter((b) => b.status !== "up" && b.status !== "empty");
  const empty = tl.filter((b) => b.status === "empty").length;
  const label = data.extras?.timelineBucketMs === 3_600_000 ? "hour" : "day";
  return (
    <>
      <Group title="Segments" note={label === "day" ? "Days run midnight to midnight UTC (5:30 am to 5:30 am IST)." : undefined}>
        <Rows>
          <Row label="Each segment">One {label} of checks</Row>
          <Row label="Segments">{tl.length}</Row>
          <Row label="All checks up">{tl.filter((b) => b.status === "up").length}</Row>
          <Row label="With problems">{bad.length}</Row>
          <Row label="No checks">{empty}</Row>
        </Rows>
      </Group>
      <Group title="Colours">
        <Rows>
          <Row label="Up (green)">Every check in that {label} was up</Row>
          <Row label="Down (red)">Every check got an HTTP error</Row>
          <Row label="Error (amber)">Every check got no response</Row>
          <Row label="Mixed (light amber)">Some checks failed, some were up</Row>
          <Row label="Grey">No checks ran in that {label}</Row>
        </Rows>
      </Group>
      <Group title="Segments with problems">
        {bad.length ? (
          <List>
            {bad.slice(-20).reverse().map((b) => (
              <Item
                key={b.t}
                left={label === "day" ? fmtDay(b.t) : fmtTime(b.t)}
                right={`${b.down + b.error} of ${b.up + b.down + b.error} failed`}
                sub={`${b.up} up · ${b.down} down · ${b.error} no response`}
              />
            ))}
          </List>
        ) : (
          <p className="text-sm text-muted">None in this range.</p>
        )}
      </Group>
    </>
  );
}

export function IncidentsPanel({ data }: P) {
  const x = data.extras;
  const list = data.incidents;
  return (
    <>
      <Group title="Summary">
        <Rows>
          <Row label="Incidents">{x ? x.incidentCount : list.length}</Row>
          <Row label="Total downtime">{x?.downtimeMs ? formatDuration(x.downtimeMs) : "None"}</Row>
          {x && x.incidentCount > list.length && <Row label="Listed">Latest {list.length}</Row>}
        </Rows>
      </Group>
      <Group title="Incidents" note="An incident runs from the first failed check to the next successful one.">
        {list.length ? (
          <List>
            {list.map((inc, i) => (
              <Item
                key={`${inc.startedAt}-${i}`}
                left={<span className="capitalize">{inc.status}</span>}
                right={inc.endedAt ? formatDuration(inc.durationMs) : "Ongoing"}
                sub={
                  <>
                    {fmtTime(inc.startedAt)} → {inc.endedAt ? fmtTime(inc.endedAt) : "now"}
                    <br />
                    {inc.statusCode != null ? `HTTP ${inc.statusCode}` : "No HTTP response"}
                    {inc.error && inc.error !== `HTTP ${inc.statusCode}` ? ` · ${inc.error}` : ""}
                  </>
                }
              />
            ))}
          </List>
        ) : (
          <p className="text-sm text-muted">No incidents in this range.</p>
        )}
      </Group>
    </>
  );
}

const MEANING: Record<string, string> = {
  "200": "OK", "201": "Created", "204": "No content", "301": "Moved permanently", "302": "Found (redirect)",
  "304": "Not modified", "307": "Temporary redirect", "308": "Permanent redirect", "400": "Bad request",
  "401": "Unauthorized", "403": "Forbidden", "404": "Not found", "405": "Method not allowed",
  "408": "Request timeout", "410": "Gone", "429": "Too many requests", "500": "Internal server error",
  "502": "Bad gateway", "503": "Service unavailable", "504": "Gateway timeout", "520": "Unknown error (Cloudflare)",
  "521": "Web server down (Cloudflare)", "522": "Connection timed out (Cloudflare)", "523": "Origin unreachable (Cloudflare)",
  "524": "Timeout (Cloudflare)", "525": "SSL handshake failed (Cloudflare)", "526": "Invalid SSL (Cloudflare)",
};

export function CodesPanel({ data }: P) {
  const total = data.totals.checks;
  const x = data.extras;
  const codes = Object.entries(data.statusCodes).sort((a, b) => b[1] - a[1]);
  const share = (n: number) => (total ? `${Math.round((n / total) * 1000) / 10}%` : "—");
  return (
    <>
      <Group title="HTTP status codes" note="The final response after following up to 5 redirects.">
        {codes.length ? (
          <List>
            {codes.map(([code, n]) => (
              <Item
                key={code}
                left={`${code} ${MEANING[code] ?? ""}`}
                right={`${n.toLocaleString("en-IN")} · ${share(n)}`}
                sub={x?.codeLastSeen[code] ? `Last seen ${fmtTime(x.codeLastSeen[code])}` : undefined}
              />
            ))}
          </List>
        ) : (
          <NA reason="No check got an HTTP response in this range." />
        )}
      </Group>
      <Group title="No response">
        <Rows>
          <Row label="Checks">{x ? `${x.noCode.toLocaleString("en-IN")} · ${share(x.noCode)}` : "—"}</Row>
        </Rows>
        {x && x.errors.length > 0 && (
          <List>
            {x.errors.map((e) => (
              <Item key={e.message} left={e.message} right={`× ${e.count}`} />
            ))}
          </List>
        )}
      </Group>
    </>
  );
}
