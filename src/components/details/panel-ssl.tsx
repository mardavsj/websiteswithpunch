import type { AnalyticsPayload } from "@/components/analytics-types";
import type { SiteDetails } from "./types";
import { NA, Note, Row, Rows, fmtDay, fmtTime, orNA } from "./parts";
import { Card, Chip, Empty, Hero, Lifespan, Tags, daysTone } from "./ui";
import { IconGlobe, IconHash, IconLink, IconShield } from "./icons";

type PD = { data: AnalyticsPayload; details: SiteDetails };

export const NOT_YET =
  "Not saved for this site yet. Full details are collected on every check: press Recheck, or wait for the next daily check.";

const TONE_TEXT = { ok: "Valid", warn: "Renew soon", bad: "Expiring", neutral: "Unknown", accent: "" } as const;

export function SslPanel({ data, details }: PD) {
  const c = details.ssl;
  const have = Boolean(c?.checkedAt);
  const why = have ? "Not in this certificate." : "Not saved yet (see above).";
  const left = data.ssl.daysLeft;
  const expires = c?.expiresAt ?? data.ssl.expiresAt ?? null;
  const tone = have && c && !c.trusted ? "bad" : daysTone(left);
  const chip = have && c && !c.trusted ? "Not trusted" : left != null && left < 0 ? "Expired" : TONE_TEXT[tone];
  return (
    <>
      {!have && <Note>{c?.lastError ? `The latest check couldn't read a certificate: ${c.lastError}.` : NOT_YET}</Note>}
      {have && c?.lastError && (
        <Note tone="warn">
          The check on {fmtTime(c.lastErrorAt)} couldn&apos;t read the certificate ({c.lastError}). Showing the one read on{" "}
          {fmtTime(c.checkedAt)}.
        </Note>
      )}
      <Hero
        label="Expires in"
        value={left == null ? "—" : left < 0 ? "Expired" : left}
        unit={left != null && left >= 0 ? (left === 1 ? "day" : "days") : undefined}
        chip={<Chip tone={tone}>{chip}</Chip>}
        caption={expires ? `On ${fmtTime(expires)}` : "We couldn't read the expiry date."}
      >
        {c?.validFrom && c.expiresAt && (
          <Lifespan
            start={c.validFrom}
            end={c.expiresAt}
            startLabel={`Issued ${fmtDay(c.validFrom)}`}
            endLabel={`Expires ${fmtDay(c.expiresAt)}`}
            tone={tone}
          />
        )}
      </Hero>
      <Card title="Certificate" icon={<IconShield />}>
        <Rows>
          <Row label="Browser trust">
            {have ? (
              c!.trusted ? <Chip tone="ok">Trusted</Chip> : <span className="text-danger">{c!.trustError ?? "Not trusted"}</span>
            ) : (
              <NA reason={why} />
            )}
          </Row>
          <Row label="Issued by">{orNA(c?.issuer, why)}</Row>
          <Row label="Issued to (CN)">{orNA(c?.subject, have ? "No common name; see the names it covers." : why)}</Row>
          <Row label="Valid from">{orNA(c?.validFrom && fmtTime(c.validFrom), why)}</Row>
          <Row label="Expires">{orNA(expires && fmtTime(expires), why)}</Row>
        </Rows>
      </Card>
      <Card title="Names covered" icon={<IconGlobe />} meta={c?.altNames.length ? c.altNames.length : undefined}>
        {c?.altNames.length ? (
          <Tags items={c.altNames} />
        ) : (
          <Empty title="No names listed" reason={have ? "The certificate lists no DNS names." : "Not saved yet (see above)."} />
        )}
      </Card>
      <Card title="Connection" icon={<IconLink />}>
        <Rows>
          <Row label="Host checked">{orNA(c?.host, why)}</Row>
          <Row label="TLS version">{orNA(c?.protocol, have ? "The server didn't report it." : why)}</Row>
          <Row label="Last read">{orNA(c?.checkedAt && fmtTime(c.checkedAt), "Not read yet.")}</Row>
        </Rows>
      </Card>
      <Card title="Identifiers" icon={<IconHash />}>
        <Rows>
          <Row label="Serial number" stack>{orNA(c?.serialNumber, why)}</Row>
          <Row label="SHA-256 fingerprint" stack>{orNA(c?.fingerprint256, why)}</Row>
        </Rows>
      </Card>
    </>
  );
}
