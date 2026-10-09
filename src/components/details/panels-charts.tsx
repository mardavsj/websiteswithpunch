import type { AnalyticsPayload } from "@/components/analytics-types";
import { Item, List, Row, Rows, fmtDay, fmtMs, fmtTime, orNA } from "./parts";
import { Card, Empty, Stats } from "./ui";
import { IconAlert, IconInfo, IconList, IconPulse } from "./icons";

type P = { data: AnalyticsPayload };

function span(ms: number | undefined): string {
  if (!ms) return "—";
  const h = ms / 3_600_000;
  if (h < 1) return `${Math.round(ms / 60_000)}-minute`;
  return h < 24 ? `${h}-hour` : `${h / 24}-day`;
}

/** Status dot, same colours as the charts. */
export function Dot({ status }: { status: string }) {
  const c = status === "up" ? "bg-emerald-500" : status === "down" ? "bg-rose-500" : status === "mixed" ? "bg-amber-300" : status === "empty" ? "bg-ink/20" : "bg-amber-500";
  return <span className={`block h-2 w-2 rounded-full ${c}`} />;
}

export function TrendPanel({ data }: P) {
  const s = data.latency.series;
  const x = data.extras;
  const vals = s.map((p) => p.ms);
  return (
    <>
      <Stats
        items={[
          { label: "Points plotted", value: s.length },
          { label: "Lowest point", value: vals.length ? fmtMs(Math.min(...vals)) : "—" },
          { label: "Highest point", value: vals.length ? fmtMs(Math.max(...vals)) : "—" },
        ]}
      />
      <Card title="What the chart shows" icon={<IconInfo />} note={`Each point is the average of the checks in a ${span(x?.latencyBucketMs)} window.`}>
        <Rows>
          <Row label="Fastest single check">{orNA(data.latency.min != null && fmtMs(data.latency.min), "No timed checks.")}</Row>
          <Row label="Slowest single check">{orNA(data.latency.max != null && fmtMs(data.latency.max), "No timed checks.")}</Row>
        </Rows>
      </Card>
      <Card title="Latest checks" icon={<IconPulse />} meta={x?.recent.length || undefined}>
        {x?.recent.length ? (
          <List>
            {x.recent.map((c, i) => (
              <Item
                key={`${c.t}-${i}`}
                lead={<Dot status={c.status} />}
                left={fmtTime(c.t)}
                right={fmtMs(c.ms)}
                sub={`${c.status === "up" ? "Up" : c.status === "down" ? "Down" : "No response"}${c.code != null ? ` · HTTP ${c.code}` : ""}${c.error && c.status !== "up" ? ` · ${c.error}` : ""}`}
              />
            ))}
          </List>
        ) : (
          <Empty title="No checks yet" reason="No checks in this range." />
        )}
      </Card>
    </>
  );
}

export function TimelinePanel({ data }: P) {
  const tl = data.timeline;
  const bad = tl.filter((b) => b.status !== "up" && b.status !== "empty");
  const label = data.extras?.timelineBucketMs === 3_600_000 ? "hour" : "day";
  const legend: Array<[string, string, string]> = [
    ["up", "Up", `Every check in that ${label} was up`],
    ["down", "Down", "Every check got an HTTP error"],
    ["error", "Error", "Every check got no response"],
    ["mixed", "Mixed", "Some checks failed, some were up"],
    ["empty", "No data", `No checks ran in that ${label}`],
  ];
  return (
    <>
      <Stats
        items={[
          { label: `${label === "day" ? "Days" : "Hours"} shown`, value: tl.length },
          { label: "All up", value: tl.filter((b) => b.status === "up").length },
          { label: "With problems", value: bad.length, tone: bad.length ? "bad" : undefined },
          { label: "No checks", value: tl.filter((b) => b.status === "empty").length },
        ]}
      />
      <Card
        title="Legend"
        icon={<IconList />}
        note={label === "day" ? "Each segment is one day, midnight to midnight UTC (5:30 am to 5:30 am IST)." : "Each segment is one hour of checks."}
      >
        <List>
          {legend.map(([k, name, text]) => (
            <Item key={k} lead={<Dot status={k} />} left={name} right="" sub={text} />
          ))}
        </List>
      </Card>
      <Card title="Segments with problems" icon={<IconAlert />} meta={bad.length > 20 ? "Latest 20" : bad.length || undefined}>
        {bad.length ? (
          <List>
            {bad.slice(-20).reverse().map((b) => (
              <Item
                key={b.t}
                lead={<Dot status={b.status} />}
                left={label === "day" ? fmtDay(b.t) : fmtTime(b.t)}
                right={`${b.down + b.error} of ${b.up + b.down + b.error} failed`}
                sub={`${b.up} up · ${b.down} down · ${b.error} no response`}
              />
            ))}
          </List>
        ) : (
          <Empty title="All clear" reason="No segments with problems in this range." />
        )}
      </Card>
    </>
  );
}
