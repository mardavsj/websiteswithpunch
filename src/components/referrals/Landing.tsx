import Link from "next/link";
import { REFERRAL, fmtUsd, ratePercent } from "@/lib/referrals/config";

const min = fmtUsd(REFERRAL.minPayoutCents).replace(".00", "");

const STEPS = [
  { title: "Share your link", body: "Create a free account and copy your personal link." },
  { title: "They subscribe to Pro or Business", body: `Anyone who signs up within ${REFERRAL.attributionDays} days of opening it becomes your referral.` },
  { title: `You get ${ratePercent}%`, body: `Of every payment they make. Withdraw from ${min} via PayPal or UPI.` },
];

const FAQ = [
  { q: "Who can join?", a: "Anyone with a free Websites With Punch account. No application, no paid plan needed." },
  { q: "How much do I earn?", a: `${ratePercent}% of every payment your referral makes for Pro or Business plans and site packs, excluding tax. USD subscriptions only. Refunded or disputed payments are reversed.` },
  { q: "When can I withdraw?", a: `Each commission is available as soon as the payment goes through. Request a payout once your available balance reaches ${min}.` },
  { q: "How do I get paid?", a: "Payouts are reviewed and sent manually in USD to your PayPal email or UPI ID, usually within 7 business days. Provider fees or conversion may apply." },
];

/** Public /referrals for logged-out visitors. Server-only markup: nothing here can differ on hydration. */
export function ReferralLanding({ refCode }: { refCode: string | null }) {
  // Middleware already sets the first-touch cookie from ?ref; carrying it to /signup keeps it either way.
  const signup = refCode ? `/signup?ref=${refCode}` : "/signup";
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-medium uppercase tracking-wider text-accent">Referral program</p>
      <h1 className="mt-3 max-w-2xl font-display text-3xl font-medium tracking-tight text-ink sm:text-5xl">
        Earn {ratePercent}% when friends you refer pay
      </h1>
      <p className="mt-4 max-w-xl text-base text-muted">
        Know someone who runs websites? Send them your link. When they pay, you get a cut of every payment.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={signup} className="bg-accent px-5 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-accent-hover">
          Create free account
        </Link>
        <Link href="/login?callbackUrl=%2Freferrals" className="border border-rule px-5 py-3 text-center text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent">
          Log in
        </Link>
      </div>

      <ol className="mt-14 grid gap-px border border-rule bg-rule md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="bg-surface px-5 py-6">
            <span className="font-mono text-xs text-accent">0{i + 1}</span>
            <h2 className="mt-2 font-display text-lg font-medium text-ink">{s.title}</h2>
            <p className="mt-1.5 text-sm text-muted">{s.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-14 max-w-3xl" aria-labelledby="ref-faq">
        <h2 id="ref-faq" className="font-display text-xl font-medium text-ink sm:text-2xl">Questions</h2>
        <div className="mt-4 divide-y divide-rule border-y border-rule">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden className="text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted">
          Full rules in our{" "}
          <Link href="/terms#referrals" className="underline underline-offset-2 hover:text-accent">Terms</Link>.
        </p>
      </section>
    </div>
  );
}
