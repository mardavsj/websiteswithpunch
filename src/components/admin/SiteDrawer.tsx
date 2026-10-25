import Link from "next/link";
import { AdminModal } from "./AdminModal";
import { prisma } from "@/lib/prisma";
import { isVerified } from "@/lib/email-verify";
import { noAlertReason } from "@/lib/admin/site-alert";
import { Badge, fmtDate } from "./ui";
import { Days, SiteStatus } from "./SiteBadges";

/** Server-rendered site panel (opened by ?s=ID): last check, alert state and alert history. */
export async function SiteDrawer({ id, close }: { id: string; close: string }) {
  const s = await prisma.site.findUnique({
    where: { id: id.slice(0, 40) },
    select: {
      name: true, url: true, status: true, locked: true, lastCheckedAt: true, lastStatusCode: true, lastLatencyMs: true,
      sslExpiresAt: true, sslDaysLeft: true, domainExpiresAt: true, domainDaysLeft: true, alertDownAt: true, createdAt: true,
      user: { select: { id: true, email: true, plan: true, emailVerified: true, createdAt: true, alertDown: true, alertSsl: true, alertDomain: true } },
      alertLogs: { orderBy: { createdAt: "desc" }, take: 30, select: { id: true, kind: true, key: true, sent: true, createdAt: true } },
      _count: { select: { checkResults: true } },
    },
  });
  const verified = s ? isVerified(s.user) : false;
  const reason = s ? noAlertReason(s, { verified, alertDown: s.user.alertDown }, s.alertLogs) : null;
  const row = (k: string, v: React.ReactNode) => (
    <div className="flex gap-3 py-1.5 text-sm"><dt className="w-32 shrink-0 text-muted">{k}</dt><dd className="min-w-0 break-all text-ink">{v ?? "—"}</dd></div>
  );
  const onOff = (on: boolean) => (on ? "on" : <span className="text-danger">off</span>);
  return (
    <AdminModal
      close={close}
      label="Site details"
      eyebrow="Site"
      title={s?.name ?? "Not found"}
      subtitle={s?.url}
      chip={s && <SiteStatus status={s.status} locked={s.locked} />}
      left={s ? (
        <>
            {reason && (
              <div role="note" className="mb-4 border border-danger/40 bg-danger/5 p-3 text-sm">
                <p className="font-medium text-danger">Down, no alert sent</p>
                <p className="mt-1 text-ink">{reason}</p>
              </div>
            )}
            <dl className="mt-4 divide-y divide-rule border-y border-rule">
              {row("Status", <SiteStatus status={s.status} locked={s.locked} />)}
              {row("Last checked", s.lastCheckedAt ? fmtDate(s.lastCheckedAt) : "Never")}
              {row("Response", s.lastStatusCode || s.lastLatencyMs ? `${s.lastStatusCode ?? "no response"}${s.lastLatencyMs ? ` · ${s.lastLatencyMs} ms` : ""}` : null)}
              {row("Checks stored", s._count.checkResults)}
              {row("SSL", <><Days n={s.sslDaysLeft} />{s.sslExpiresAt && <span className="text-muted"> · {fmtDate(s.sslExpiresAt, false)}</span>}</>)}
              {row("Domain", <><Days n={s.domainDaysLeft} />{s.domainExpiresAt && <span className="text-muted"> · {fmtDate(s.domainExpiresAt, false)}</span>}</>)}
              {row("Down alert sent", s.alertDownAt ? fmtDate(s.alertDownAt) : "No")}
              {row("Added", fmtDate(s.createdAt))}
            </dl>
        </>
      ) : <p className="text-sm text-muted">This record was not found.</p>}
      right={s ? (
        <>
            <h3 className="label-caps mt-6 lg:mt-0">Owner</h3>
            <dl className="mt-2 divide-y divide-rule border-y border-rule">
              {row("Email", <Link href={`/admin/users?u=${s.user.id}`} className="text-accent hover:underline">{s.user.email}</Link>)}
              {row("Plan", s.user.plan)}
              {row("Verified", verified ? "yes" : <span className="text-danger">no</span>)}
              {row("Alerts", <>down {onOff(s.user.alertDown)} · SSL {onOff(s.user.alertSsl)} · domain {onOff(s.user.alertDomain)}</>)}
            </dl>
            <h3 className="label-caps mt-6">Alert history ({s.alertLogs.length})</h3>
            <ul className="mt-2 divide-y divide-rule border-y border-rule">
              {s.alertLogs.length === 0 && <li className="py-2 text-sm text-muted">No alerts logged for this site.</li>}
              {s.alertLogs.map((a) => (
                <li key={a.id} className="flex items-center gap-2 py-2 text-sm">
                  <span className="flex-1 text-ink">{a.kind}</span>
                  <span className="text-muted">{fmtDate(a.createdAt)}</span>
                  <Badge tone={a.sent ? "ok" : "danger"}>{a.sent ? "sent" : "not sent"}</Badge>
                </li>
              ))}
            </ul>
        </>
      ) : undefined}
    />
  );
}
