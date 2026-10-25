import { FULL_FRAME, Sk, SkBtn, SkInput, SkStatus } from "./Sk";

const CARD = "border border-rule bg-surface";

function Head({ t }: { t: string }) {
  return <div className="border-b border-rule px-4 py-2.5"><p className="label-caps"><Sk>{t}</Sk></p></div>;
}

/** Mirrors /referrals: hero with link + stats, earnings, history | payout form, how it works. */
export function ReferralsSkeleton() {
  return (
    <div className={FULL_FRAME} role="status" aria-busy="true">
      <SkStatus label="Loading referrals…" />
      <div className="w-full">
        <h1 className="font-display text-2xl font-medium sm:text-3xl"><Sk>Referrals</Sk></h1>
        <p className="mt-1 text-sm"><Sk>Share Websites With Punch and earn from every payment.</Sk></p>
        <div className="mt-6 grid gap-4 lg:grid-cols-5 lg:items-start">
          <div className="space-y-4 lg:col-span-3">
            <div className={CARD}>
              <div className="h-1 bg-accent/40" />
              <div className="px-4 py-5 sm:px-6 sm:py-6">
                <p className="label-caps"><Sk>Referral program</Sk></p>
                <p className="mt-3 font-display text-3xl font-medium leading-tight sm:text-4xl"><Sk>Earn 20% of every payment</Sk></p>
                <p className="mt-2 text-sm"><Sk>Share your link. When someone signs up through it and pays, you get 20%.</Sk></p>
                <p className="mt-5 text-sm"><Sk>Your link</Sk></p>
                <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                  <SkInput className="flex-1 py-2.5">https://www.websiteswithpunch.com/r/ABCD2345</SkInput>
                  <SkBtn className="px-4 py-2.5 text-center text-sm">Copy link</SkBtn>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-px border border-rule bg-rule lg:grid-cols-4">
                  {["Link visits", "Signups", "Paying", "Earned"].map((k) => (
                    <div key={k} className="bg-surface px-4 py-3">
                      <p className="label-caps"><Sk>{k}</Sk></p>
                      <p className="mt-1 font-display text-2xl font-medium"><Sk>$0.00</Sk></p>
                      <p className="mt-0.5 text-xs"><Sk>Accounts via link</Sk></p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={CARD}>
              <Head t="Earnings" />
              <div className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-4">
                {["On hold", "Available", "Requested", "Paid out"].map((k) => (
                  <div key={k} className="bg-surface px-4 py-3">
                    <p className="label-caps"><Sk>{k}</Sk></p>
                    <p className="mt-1 font-display text-xl font-medium"><Sk>$0.00</Sk></p>
                    <p className="mt-0.5 text-xs"><Sk>Ready to withdraw</Sk></p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 border-t border-rule px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm"><Sk>You can withdraw $0.00</Sk></p>
                <SkBtn className="px-4 py-2.5 text-center text-sm">Withdraw $0.00</SkBtn>
              </div>
            </div>
            <div className={CARD}>
              <Head t="Commission history" />
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 border-b border-rule px-4 py-3 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm"><Sk>Oct 9, 2026</Sk></p>
                    <p className="text-xs"><Sk>Available Nov 8, 2026</Sk></p>
                  </div>
                  <p className="text-sm"><Sk>$2.40</Sk></p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4 lg:col-span-2">
            <div className={CARD}>
              <Head t="Payout method" />
              <div className="px-4 py-4">
                <div className="sk block h-9" />
                <p className="mt-4 text-sm"><Sk>PayPal email</Sk></p>
                <SkInput className="mt-1.5 py-2.5">you@example.com</SkInput>
                <p className="mt-1.5 text-xs"><Sk>Paid in USD to your PayPal account.</Sk></p>
                <SkBtn className="mt-4 px-4 py-2.5 text-sm">Save payout method</SkBtn>
              </div>
            </div>
            <div className={CARD}>
              <Head t="How it works" />
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 border-b border-rule px-4 py-3 last:border-0">
                  <span className="sk block h-6 w-6 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm"><Sk>Share your link</Sk></p>
                    <p className="mt-0.5 text-xs"><Sk>Anyone who signs up within 30 days is linked to you.</Sk></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
