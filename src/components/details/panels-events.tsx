import { formatDuration } from "@/lib/analytics";
import type { AnalyticsPayload } from "@/components/analytics-types";
import { Item, List, fmtTime } from "./parts";
import { Card, Empty, Meter, Stats, type Tone } from "./ui";
import { IconAlert, IconHash } from "./icons";
import { Dot } from "./panels-charts";

type P = { data: AnalyticsPayload };

export function IncidentsPanel({ data }: P) {
  const x = data.extras;
  const list = data.incidents;
  return (
    <>
      <Stats
        items={[
          { label: "Incidents", value: x ? x.incidentCount : list.length, tone: list.length ? "bad" : undefined },
          { label: "Total downtime", value: x?.downtimeMs ? formatDuration(x.downtimeMs) : "None" },
        ]}
      />
      <Card
        title="Incidents"
        icon={<IconAlert />}
        meta={x && x.incidentCount > list.length ? `Latest ${list.length}` : undefined}
        note="An incident runs from the first failed check to the next successful one."
      >
        {list.length ? (
          <List>
            {list.map((inc, i) => (
              <Item
                key={`${inc.startedAt}-${i}`}
                lead={<Dot status={inc.endedAt ? "empty" : "down"} />}
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
          <Empty title="No incidents" reason="No failed checks in this range." />
        )}
      </Card>
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
const family = (code: string): Tone => (code[0] === "2" ? "ok" : code[0] === "3" ? "accent" : code[0] === "4" ? "warn" : "bad");

export function CodesPanel({ data }: P) {
  const total = data.totals.checks;
  const x = data.extras;
  const codes = Object.entries(data.statusCodes).sort((a, b) => b[1] - a[1]);
  const share = (n: number) => (total ? `${Math.round((n / total) * 1000) / 10}%` : "—");
  return (
    <>
      <Card title="HTTP status codes" icon={<IconHash />} note="The final response after following up to 5 redirects.">
        {codes.length ? (
          <ul className="divide-y divide-rule">
            {codes.map(([code, n]) => (
              <li key={code} className="px-4 py-2.5 text-[13px]">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 text-ink">
                    <span className="font-mono font-medium">{code}</span> <span className="text-muted">{MEANING[code] ?? ""}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-ink">
                    {n.toLocaleString("en-IN")} <span className="text-muted">· {share(n)}</span>
                  </span>
                </div>
                {x?.codeLastSeen[code] && <p className="mt-0.5 text-xs text-muted">Last seen {fmtTime(x.codeLastSeen[code])}</p>}
                <div className="mt-1.5">
                  <Meter value={total ? n / total : 0} tone={family(code)} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No HTTP responses" reason="No check got an HTTP response in this range." />
        )}
      </Card>
      <Card title="No response" icon={<IconAlert />} meta={x ? `${x.noCode.toLocaleString("en-IN")} · ${share(x.noCode)}` : undefined}>
        {x && x.errors.length > 0 ? (
          <List>
            {x.errors.map((e) => (
              <Item key={e.message} left={e.message} right={`× ${e.count}`} />
            ))}
          </List>
        ) : (
          <Empty title="None" reason="No check in this range went without an HTTP response." />
        )}
      </Card>
    </>
  );
}
