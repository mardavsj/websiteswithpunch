import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SITE_URL } from "@/lib/site-config";
import { referralSummary } from "@/lib/referrals/server";
import { ReferralHero } from "@/components/referrals/ReferralHero";
import { Earnings } from "@/components/referrals/Earnings";
import { PayoutForm } from "@/components/referrals/PayoutForm";
import { History } from "@/components/referrals/History";
import { HowItWorks } from "@/components/referrals/HowItWorks";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Referrals", robots: { index: false } };

export default async function ReferralsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  const s = await referralSummary(session.user.id);
  const b = s.balances;
  const earned = b.pending + b.available + b.requested + b.paid;
  const rows = s.rows.map((r) => ({
    id: r.id, status: r.status, amountCents: r.amountCents, baseCents: r.baseCents, clawback: r.clawback,
    availableAt: r.availableAt.toISOString(), createdAt: r.createdAt.toISOString(), reversedReason: r.reversedReason,
  }));
  const payouts = s.payouts.map((p) => ({
    id: p.id, amountCents: p.amountCents, method: p.method, address: p.address, status: p.status, reference: p.reference,
    reason: p.reason, createdAt: p.createdAt.toISOString(), decidedAt: p.decidedAt?.toISOString() ?? null,
  }));
  const method = s.method === "paypal" || s.method === "upi" ? s.method : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 items-center [align-items:safe_center] px-4 py-10 sm:px-6">
      <div className="w-full">
        <h1 className="font-display text-2xl font-medium text-ink sm:text-3xl">Referrals</h1>
        <p className="mt-1 text-sm text-muted">Share Websites With Punch and earn from every payment.</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-5 lg:items-start">
          <div className="min-w-0 space-y-4 lg:col-span-3">
            <ReferralHero link={`${SITE_URL}/r/${s.code}`} clicks={s.clicks} signups={s.signups} paying={s.paying} earned={earned} />
            <Earnings balances={b} hasMethod={Boolean(method && s.address)} hasOpenRequest={s.hasOpenRequest} />
            <History rows={rows} payouts={payouts} />
          </div>
          <div className="min-w-0 space-y-4 lg:col-span-2">
            <PayoutForm method={method} address={s.address} />
            <HowItWorks />
          </div>
        </div>
      </div>
    </div>
  );
}
