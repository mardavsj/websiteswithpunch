import type { AnalyticsPayload } from "@/components/analytics-types";
import type { SiteDetails } from "./types";
import { Item, List, Note, Row, Rows, fmtDay, fmtTime, orNA } from "./parts";
import { Card, Chip, Empty, Hero, Lifespan, Tags, daysTone } from "./ui";
import { IconCalendar, IconInfo, IconServer, IconShield } from "./icons";
import { NOT_YET } from "./panel-ssl";

type PD = { data: AnalyticsPayload; details: SiteDetails };

const EPP: Record<string, string> = {
  "client transfer prohibited": "Transfer lock on",
  "client delete prohibited": "Delete lock on",
  "client update prohibited": "Update lock on",
  "client renew prohibited": "Renewal lock on",
  "client hold": "Held by the registrar (not resolving)",
  "server transfer prohibited": "Registry transfer lock",
  "server delete prohibited": "Registry delete lock",
  "server update prohibited": "Registry update lock",
  "server hold": "Held by the registry (not resolving)",
  active: "Active",
  ok: "Active, no locks",
  "pending delete": "Pending deletion",
  "redemption period": "Expired, in redemption",
  "auto renew period": "Recently auto-renewed",
};
const BAD = /hold|pending delete|redemption/;
const TONE_TEXT = { ok: "Registered", warn: "Renew soon", bad: "Expiring", neutral: "Unknown", accent: "" } as const;

export function DomainPanel({ data, details }: PD) {
  const d = details.domain;
  const have = Boolean(d?.checkedAt);
  const whois = d?.source === "WHOIS";
  const why = !have ? "Not saved yet (see above)." : whois ? "The WHOIS fallback only gives the expiry date." : "The registry didn't publish it.";
  const left = data.domain.daysLeft;
  const expires = d?.expiresAt ?? data.domain.expiresAt ?? null;
  const tone = daysTone(left);
  return (
    <>
      {!have && (
        <Note>
          {d?.lastError
            ? "The latest lookup couldn't read this domain's registration. Some country-code registries (for example .io or .de) don't publish it."
            : NOT_YET}
        </Note>
      )}
      {have && d?.lastError && (
        <Note tone="warn">
          The lookup on {fmtTime(d.lastErrorAt)} failed. Showing what we read on {fmtTime(d.checkedAt)}.
        </Note>
      )}
      <Hero
        label={d?.domain ? `${d.domain} expires in` : "Expires in"}
        value={left == null ? "—" : left < 0 ? "Expired" : left}
        unit={left != null && left >= 0 ? (left === 1 ? "day" : "days") : undefined}
        chip={<Chip tone={tone}>{left != null && left < 0 ? "Expired" : TONE_TEXT[tone]}</Chip>}
        caption={expires ? `On ${fmtDay(expires)}` : "We couldn't read the expiry date."}
      >
        {d?.registeredAt && expires && (
          <Lifespan
            start={d.registeredAt}
            end={expires}
            startLabel={`Registered ${fmtDay(d.registeredAt)}`}
            endLabel={`Expires ${fmtDay(expires)}`}
            tone={tone}
          />
        )}
      </Hero>
      <Card title="Registration" icon={<IconCalendar />}>
        <Rows>
          <Row label="Registrar">{orNA(d?.registrar, why)}</Row>
          <Row label="Registered">{orNA(d?.registeredAt && fmtDay(d.registeredAt), why)}</Row>
          <Row label="Last updated">{orNA(d?.updatedAt && fmtDay(d.updatedAt), why)}</Row>
          <Row label="Expires">{orNA(expires && fmtDay(expires), why)}</Row>
        </Rows>
      </Card>
      <Card title="Nameservers" icon={<IconServer />} meta={d?.nameservers.length || undefined}>
        {d?.nameservers.length ? <Tags items={d.nameservers} mono /> : <Empty title="No nameservers" reason={why} />}
      </Card>
      <Card title="Registry status" icon={<IconShield />} note="EPP status flags set by the registrar or registry, e.g. transfer locks.">
        {d?.statuses.length ? (
          <List>
            {d.statuses.map((s) => (
              <Item
                key={s}
                lead={<span className={`block h-1.5 w-1.5 rounded-full ${BAD.test(s.toLowerCase()) ? "bg-rose-500" : "bg-emerald-500"}`} />}
                left={EPP[s.toLowerCase()] ?? s}
                right=""
                sub={EPP[s.toLowerCase()] ? s : undefined}
              />
            ))}
          </List>
        ) : (
          <Empty title="No status flags" reason={why} />
        )}
      </Card>
      <Card title="Source" icon={<IconInfo />}>
        <Rows>
          <Row label="Lookup">{orNA(d?.source && (whois ? "WHOIS (fallback)" : "RDAP"), "Not looked up yet.")}</Row>
          <Row label="Answered by">{orNA(d?.server, "Not looked up yet.")}</Row>
          <Row label="Last looked up">{orNA(d?.checkedAt && fmtTime(d.checkedAt), "Not looked up yet.")}</Row>
          <Row label="Refreshed">On add, Recheck and daily</Row>
        </Rows>
      </Card>
    </>
  );
}
