import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/referrals/server";
import { fmtUsd } from "@/lib/referrals/config";
import { PayoutDecision } from "@/components/admin/PayoutDecision";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Payouts · Admin", robots: { index: false } };

const fmt = (d: Date) => d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) + " IST";

/** ADMIN_EMAILS only; everyone else gets a plain 404 so the page doesn't advertise itself. */
export default async function AdminPayoutsPage() {
  const session = await getSession();
  if (!session?.user?.id || session.user.verified === false || !isAdminEmail(session.user.email)) notFound();

  const [open, recent] = await Promise.all([
    prisma.payout.findMany({ where: { status: "requested" }, orderBy: { createdAt: "asc" }, include: { user: { select: { email: true, name: true } } }, take: 100 }),
    prisma.payout.findMany({ where: { status: { not: "requested" } }, orderBy: { decidedAt: "desc" }, include: { user: { select: { email: true } } }, take: 30 }),
  ]);
  const owed = open.reduce((s, p) => s + p.amountCents, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <p className="label-caps">Admin</p>
      <h1 className="mt-1 font-display text-2xl font-medium text-ink sm:text-3xl">Payout requests</h1>
      <p className="mt-1 text-sm text-muted">
        {open.length} open · {fmtUsd(owed)} to pay. Send the money first, then mark it paid with the PayPal or UPI transaction ID.
      </p>

      <section className="mt-6 border border-rule bg-surface">
        <header className="border-b border-rule px-4 py-2.5"><h2 className="label-caps !text-ink/80">Open</h2></header>
        {open.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">No open requests.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {open.map((p) => (
              <li key={p.id} className="px-4 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium text-ink">{p.user.name || p.user.email}</p>
                  <p className="font-display text-xl font-medium tabular-nums text-ink">{fmtUsd(p.amountCents)}</p>
                </div>
                <p className="mt-0.5 break-all text-xs text-muted">{p.user.email} · requested {fmt(p.createdAt)}</p>
                <p className="mt-2 break-all text-sm text-ink">
                  <span className="label-caps mr-2">{p.method === "upi" ? "UPI" : "PayPal"}</span>
                  <span className="font-mono">{p.address}</span>
                </p>
                <PayoutDecision id={p.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 border border-rule bg-surface">
        <header className="border-b border-rule px-4 py-2.5"><h2 className="label-caps !text-ink/80">Recently decided</h2></header>
        {recent.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">Nothing yet.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{p.user.email}</p>
                  <p className="truncate text-xs text-muted">
                    {p.status === "paid" ? `Paid · ref ${p.reference}` : `Rejected · ${p.reason}`} · {p.decidedAt ? fmt(p.decidedAt) : ""}
                  </p>
                </div>
                <p className={`shrink-0 text-sm font-medium tabular-nums ${p.status === "paid" ? "text-ink" : "text-muted line-through"}`}>{fmtUsd(p.amountCents)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
