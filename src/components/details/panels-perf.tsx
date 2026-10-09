import { HEALTH_WEIGHTS } from "@/lib/health-score";
import { CHECK_SCHEDULE } from "@/lib/check-schedule";
import type { AnalyticsPayload } from "@/components/analytics-types";
import { Item, List, Row, Rows, fmtMs, fmtTime, orNA } from "./parts";
import { Card, Chip, Empty, Hero, Meter, Stats, type Tone } from "./ui";
import { IconClock, IconGauge, IconList, IconPulse } from "./icons";

type P = { data: AnalyticsPayload };

const pct = (n: number | null | undefined) => (n == null ? null : `${n}%`);
const scoreTone = (s: number): Tone => (s >= 70 ? "ok" : s >= 50 ? "warn" : "bad");
const msTone = (ms: number | null | undefined): Tone => (ms == null ? "neutral" : ms <= 500 ? "ok" : ms <= 1000 ? "warn" : "bad");

export function HealthPanel({ data }: P) {
  const p = data.healthParts;
  const lines = [
    { label: "Uptime", w: HEALTH_WEIGHTS.uptime, score: p?.uptime, input: pct(data.uptimePercent) ?? "No checks yet (counted as 100)" },
    { label: "Response time", w: HEALTH_WEIGHTS.latency, score: p?.latency, input: data.latency.avg == null ? "No timings yet (counted as 100)" : `Average ${fmtMs(data.latency.avg)}` },
    { label: "SSL certificate", w: HEALTH_WEIGHTS.ssl, score: p?.ssl, input: data.ssl.daysLeft == null ? "Expiry unknown (counted as 70)" : `${data.ssl.daysLeft} days left` },
    { label: "Domain", w: HEALTH_WEIGHTS.domain, score: p?.domain, input: data.domain.daysLeft == null ? "Expiry unknown (counted as 70)" : `${data.domain.daysLeft} days left` },
  ];
  const r = (v: number) => Math.round(v * 10) / 10;
  return (
    <>
      <Hero
        label="Health score"
        value={data.healthScore}
        unit="/ 100"
        chip={<Chip tone={scoreTone(data.healthScore)}>{data.healthLabel}</Chip>}
        caption="Uptime, response time, SSL and domain, each scored out of 100 and weighted."
      >
        <Meter value={data.healthScore / 100} tone={scoreTone(data.healthScore)} label="Health score" />
      </Hero>
      <Card title="How it adds up" icon={<IconGauge />} meta="score → points">
        <ul className="divide-y divide-rule">
          {lines.map((l) => (
            <li key={l.label} className="px-4 py-2.5 text-[13px]">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-ink">
                  {l.label} <span className="font-normal text-muted">· {Math.round(l.w * 100)}%</span>
                </span>
                <span className="tabular-nums text-muted">
                  {l.score == null ? "—" : <>{r(l.score)} → <span className="font-medium text-ink">{r(l.score * l.w)}</span></>}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted">{l.input}</p>
              {l.score != null && (
                <div className="mt-1.5">
                  <Meter value={l.score / 100} tone={scoreTone(l.score)} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Scoring bands" icon={<IconList />}>
        <List>
          <Item left="Labels" right="" sub="85+ Excellent · 70–84 Good · 50–69 Watch · under 50 Critical" />
          <Item left="Response time" right="" sub="≤200 ms 100 · ≤500 85 · ≤1 s 70 · ≤2 s 50 · slower 30" />
          <Item left="SSL days left" right="" sub="60+ 100 · 31–60 80 · 15–30 55 · 8–14 35 · ≤7 15" />
          <Item left="Domain days left" right="" sub="90+ 100 · 61–90 85 · 31–60 65 · 15–30 40 · ≤14 20" />
        </List>
      </Card>
    </>
  );
}

export function LatencyPanel({ data }: P) {
  const l = data.latency;
  const x = data.extras;
  const none = "No timed checks in this range.";
  const top = x?.slowest.length ? Math.max(...x.slowest.map((c) => c.ms ?? 0)) : 0;
  return (
    <>
      <Hero
        label="Average response time"
        value={l.avg == null ? "—" : Math.round(l.avg).toLocaleString("en-IN")}
        unit={l.avg == null ? undefined : "ms"}
        chip={l.avg == null ? undefined : <Chip tone={msTone(l.avg)}>{msTone(l.avg) === "ok" ? "Fast" : msTone(l.avg) === "warn" ? "Slow" : "Very slow"}</Chip>}
        caption={l.avg == null ? none : `Full request time from ${CHECK_SCHEDULE.location.split(" (")[0]}, including redirects.`}
      />
      <Stats
        items={[
          { label: "Median (p50)", value: x?.p50 != null ? fmtMs(x.p50) : "—" },
          { label: "p95", value: l.p95 != null ? fmtMs(l.p95) : "—" },
          { label: "Fastest", value: l.min != null ? fmtMs(l.min) : "—" },
          { label: "Slowest", value: l.max != null ? fmtMs(l.max) : "—" },
        ]}
      />
      <Card title="Checks" icon={<IconClock />}>
        <Rows>
          <Row label="Timed checks">{x ? x.timedChecks.toLocaleString("en-IN") : "—"}</Row>
          <Row label="Latest check">{orNA(data.site?.lastLatencyMs != null && fmtMs(data.site.lastLatencyMs), "Not checked yet.")}</Row>
        </Rows>
      </Card>
      <Card title="Slowest checks" icon={<IconPulse />} meta={x?.slowest.length || undefined}>
        {x?.slowest.length ? (
          <ul className="divide-y divide-rule">
            {x.slowest.map((c) => (
              <li key={c.t} className="px-4 py-2.5 text-[13px]">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-ink">{fmtTime(c.t)}</span>
                  <span className="font-medium tabular-nums text-ink">{fmtMs(c.ms)}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted">{c.code != null ? `HTTP ${c.code}` : c.error ?? "No response"}</p>
                <div className="mt-1.5">
                  <Meter value={top && c.ms != null ? c.ms / top : 0} tone={msTone(c.ms)} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No timed checks" reason={none} />
        )}
      </Card>
    </>
  );
}
