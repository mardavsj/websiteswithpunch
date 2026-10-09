import type { AnalyticsPayload } from "@/components/analytics-types";
import type { SiteDetails } from "./types";
import { Group, Item, List, NA, Note, Row, Rows, fmtDay, fmtTime, orNA } from "./parts";

type PD = { data: AnalyticsPayload; details: SiteDetails };

const NOT_YET =
  "Not saved for this site yet. Full details are collected on every check: press Recheck, or wait for the next daily check.";
const days = (n: number | null) => (n == null ? null : n < 0 ? "Expired" : `${n} day${n === 1 ? "" : "s"}`);

export function SslPanel({ data, details }: PD) {
  const c = details.ssl;
  const have = Boolean(c?.checkedAt);
  const why = have ? "Not in this certificate." : "Not saved yet (see above).";
  return (
    <>
      {!have && <Note>{c?.lastError ? `The latest check couldn't read a certificate: ${c.lastError}.` : NOT_YET}</Note>}
      {have && c?.lastError && (
        <Note tone="warn">
          The check on {fmtTime(c.lastErrorAt)} couldn&apos;t read the certificate ({c.lastError}). Showing the one read on{" "}
          {fmtTime(c.checkedAt)}.
        </Note>
      )}
      <Group title="Certificate">
        <Rows>
          <Row label="Browser trust">
            {have ? c!.trusted ? "Trusted" : <span className="text-danger">{c!.trustError ?? "Not trusted"}</span> : <NA reason={why} />}
          </Row>
          <Row label="Days left">{orNA(days(data.ssl.daysLeft), "We couldn't read the expiry date.")}</Row>
          <Row label="Expires">{orNA(c?.expiresAt ? fmtTime(c.expiresAt) : data.ssl.expiresAt && fmtTime(data.ssl.expiresAt), why)}</Row>
          <Row label="Valid from">{orNA(c?.validFrom && fmtTime(c.validFrom), why)}</Row>
          <Row label="Issued by">{orNA(c?.issuer, why)}</Row>
          <Row label="Issued to (CN)">{orNA(c?.subject, have ? "This certificate has no common name; see the names it covers." : why)}</Row>
          <Row label="Serial number" mono>{orNA(c?.serialNumber, why)}</Row>
          <Row label="SHA-256 fingerprint" mono>{orNA(c?.fingerprint256, why)}</Row>
        </Rows>
      </Group>
      <Group title={`Names covered${c?.altNames.length ? ` (${c.altNames.length})` : ""}`}>
        {c?.altNames.length ? (
          <List>
            {c.altNames.map((n) => (
              <li key={n} className="break-all py-1.5 text-sm text-ink">{n}</li>
            ))}
          </List>
        ) : (
          <NA reason={have ? "The certificate lists no DNS names." : "Not saved yet (see above)."} />
        )}
      </Group>
      <Group title="Connection">
        <Rows>
          <Row label="Host checked">{orNA(c?.host, why)}</Row>
          <Row label="TLS version">{orNA(c?.protocol, have ? "The server didn't report it." : why)}</Row>
          <Row label="Last read">{orNA(c?.checkedAt && fmtTime(c.checkedAt), "Not read yet.")}</Row>
        </Rows>
      </Group>
    </>
  );
}

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

export function DomainPanel({ data, details }: PD) {
  const d = details.domain;
  const have = Boolean(d?.checkedAt);
  const whois = d?.source === "WHOIS";
  const why = !have ? "Not saved yet (see above)." : whois ? "The WHOIS fallback only gives the expiry date." : "The registry didn't publish it.";
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
      <Group title="Registration">
        <Rows>
          <Row label="Domain">{orNA(d?.domain, "Not looked up yet.")}</Row>
          <Row label="Days left">{orNA(days(data.domain.daysLeft), "We couldn't read the expiry date.")}</Row>
          <Row label="Expires">{orNA(d?.expiresAt ? fmtDay(d.expiresAt) : data.domain.expiresAt && fmtDay(data.domain.expiresAt), why)}</Row>
          <Row label="Registered">{orNA(d?.registeredAt && fmtDay(d.registeredAt), why)}</Row>
          <Row label="Last updated">{orNA(d?.updatedAt && fmtDay(d.updatedAt), why)}</Row>
          <Row label="Registrar">{orNA(d?.registrar, why)}</Row>
        </Rows>
      </Group>
      <Group title="Nameservers">
        {d?.nameservers.length ? (
          <List>
            {d.nameservers.map((n) => (
              <li key={n} className="break-all py-1.5 text-sm text-ink">{n}</li>
            ))}
          </List>
        ) : (
          <NA reason={why} />
        )}
      </Group>
      <Group title="Status codes" note="Registry flags (EPP status), e.g. transfer locks.">
        {d?.statuses.length ? (
          <List>
            {d.statuses.map((s) => (
              <Item key={s} left={s} right={EPP[s.toLowerCase()] ?? ""} />
            ))}
          </List>
        ) : (
          <NA reason={why} />
        )}
      </Group>
      <Group title="Source">
        <Rows>
          <Row label="Lookup">{orNA(d?.source && (whois ? "WHOIS (fallback)" : "RDAP"), "Not looked up yet.")}</Row>
          <Row label="Answered by">{orNA(d?.server, "Not looked up yet.")}</Row>
          <Row label="Last looked up">{orNA(d?.checkedAt && fmtTime(d.checkedAt), "Not looked up yet.")}</Row>
          <Row label="When">On add, on Recheck and in the daily check</Row>
        </Rows>
      </Group>
    </>
  );
}
