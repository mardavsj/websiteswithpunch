type Data = Record<string, unknown>;
type Tone = "ok" | "warn" | "bad";

const TONE: Record<Tone, string> = {
  ok: "text-emerald-700 dark:text-emerald-300",
  warn: "text-amber-700 dark:text-amber-300",
  bad: "text-danger",
};

const str = (v: unknown) => (typeof v === "string" && v ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const date = (v: unknown) => {
  const s = str(v);
  return s ? new Date(s).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
};
const daysTone = (d: number, warn: number): Tone => (d < 0 ? "bad" : d <= 7 ? "bad" : d <= warn ? "warn" : "ok");

function Headline({ tone, big, small }: { tone: Tone; big: string; small: string }) {
  return (
    <div>
      <p className={`font-display text-3xl font-medium tracking-tight sm:text-4xl ${TONE[tone]}`}>{big}</p>
      <p className="mt-1 text-sm text-muted">{small}</p>
    </div>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mt-5 grid gap-px border border-rule bg-rule sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="min-w-0 bg-bg px-4 py-3">
          <dt className="text-xs text-muted">{k}</dt>
          <dd className="mt-0.5 break-words text-sm font-medium text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Failed({ text }: { text: string }) {
  return <p role="alert" className="text-sm font-medium text-danger">{text}</p>;
}

const daysText = (d: number) => (d < 0 ? `Expired ${-d} day${d === -1 ? "" : "s"} ago` : `${d} day${d === 1 ? "" : "s"} left`);

export function SslResultView({ d }: { d: Data }) {
  const days = num(d.daysLeft);
  if (!d.ok || days === null) return <Failed text={str(d.error) ?? "We couldn't read a certificate."} />;
  const names = Array.isArray(d.altNames) ? (d.altNames as string[]) : [];
  const covers = names.length > 4 ? `${names.slice(0, 4).join(", ")} and ${names.length - 4} more` : names.join(", ") || "—";
  return (
    <>
      <Headline tone={d.trusted ? daysTone(days, 30) : "bad"} big={daysText(days)} small={`SSL certificate for ${String(d.host)}`} />
      {!d.trusted && <p className="mt-3 text-sm font-medium text-danger">{str(d.trustError) ?? "Browsers won't trust this certificate."}</p>}
      <Rows rows={[
        ["Expires", date(d.expiresAt)],
        ["Issuer", str(d.issuer) ?? "—"],
        ["Valid from", date(d.validFrom)],
        ["Trusted by browsers", d.trusted ? "Yes" : "No"],
        ["Covers", covers],
        ["Protocol", str(d.protocol) ?? "—"],
      ]} />
    </>
  );
}

export function DomainResultView({ d }: { d: Data }) {
  const days = num(d.daysLeft);
  if (!d.ok || days === null) return <Failed text={str(d.error) ?? "We couldn't find an expiry date."} />;
  return (
    <>
      <Headline tone={daysTone(days, 30)} big={daysText(days)} small={`Registration for ${String(d.domain)}`} />
      <Rows rows={[
        ["Expires", date(d.expiresAt)],
        ["Registrar", str(d.registrar) ?? "Not published"],
        ["Registered", date(d.registeredAt)],
        ["Source", str(d.source) ?? "—"],
      ]} />
    </>
  );
}

export function DownResultView({ d }: { d: Data }) {
  const code = num(d.statusCode);
  const ms = num(d.latencyMs);
  if (!d.ok || d.status === "error") {
    return (
      <>
        <Headline tone="bad" big="Unreachable" small={`We couldn't load ${String(d.host)} from our server.`} />
        <p className="mt-3 text-sm font-medium text-danger">{str(d.error) ?? "The request failed."}</p>
      </>
    );
  }
  const up = d.status === "up";
  return (
    <>
      <Headline
        tone={up ? "ok" : "bad"}
        big={up ? "It's up" : "It's down"}
        small={up ? `${String(d.host)} answered our request.` : `${String(d.host)} answered with an error.`}
      />
      <Rows rows={[
        ["Status code", code ? String(code) : "—"],
        ["Response time", ms !== null ? `${ms} ms` : "—"],
        ["Final URL", str(d.finalUrl) ?? "—"],
        ["Checked", date(d.checkedAt) + " " + (str(d.checkedAt) ? new Date(String(d.checkedAt)).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "")],
      ]} />
    </>
  );
}
