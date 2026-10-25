import { FULL_FRAME, Sk, SkBtn, SkInput, SkStatus } from "./Sk";

const CARD = "border border-rule bg-surface";

/** Mirrors /referrals: hero link, stats row, steps, payout row, history, fine print. */
export function ReferralsSkeleton() {
  return (
    <div className={FULL_FRAME} role="status" aria-busy="true">
      <SkStatus label="Loading referrals…" />
      <div className="w-full">
        <h1 className="font-display text-2xl font-medium sm:text-3xl">
          <Sk>Referrals</Sk>
        </h1>
        <div className="mt-6 space-y-4">
          <div className={`${CARD} px-4 py-5 sm:px-6`}>
            <p className="font-display text-xl font-medium sm:text-2xl">
              <Sk>Earn 20% when friends you refer pay</Sk>
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <SkInput className="flex-1 py-2.5">
                https://www.websiteswithpunch.com/r/ABCD2345
              </SkInput>
              <SkBtn className="px-4 py-2.5 text-center text-sm">Copy</SkBtn>
            </div>
          </div>
          <div className={`${CARD} flex flex-col sm:flex-row sm:items-center`}>
            <div className="grid flex-1 grid-cols-3 divide-x divide-rule">
              {["Available", "In review", "Paid"].map((k) => (
                <div key={k} className="px-4 py-3">
                  <p className="text-xs">
                    <Sk>{k}</Sk>
                  </p>
                  <p className="mt-0.5 font-display text-lg font-medium sm:text-xl">
                    <Sk>$00.00</Sk>
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-rule px-4 py-3 sm:border-l sm:border-t-0">
              <p className="text-xs sm:hidden">
                <Sk>$20.00 to go</Sk>
              </p>
              <SkBtn className="px-4 py-2 text-sm">Withdraw</SkBtn>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-sm sm:flex-row sm:gap-4">
            {[
              "Share your link",
              "They subscribe",
              "You get 20%",
            ].map((t) => (
              <p key={t} className="flex items-center gap-2">
                <span className="sk block h-5 w-5" />
                <Sk>{t}</Sk>
              </p>
            ))}
          </div>
          <div className={`${CARD} flex items-center gap-3 px-4 py-3`}>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <Sk>Payout method</Sk>
              </p>
              <p className="text-xs">
                <Sk>PayPal · you@example.com</Sk>
              </p>
            </div>
            <SkBtn className="px-3 py-1.5 text-sm">Edit</SkBtn>
          </div>
          <div className={CARD}>
            <div className="flex justify-between border-b border-rule px-4 py-2.5">
              <p className="text-sm">
                <Sk>History</Sk>
              </p>
              <p className="text-xs">
                <Sk>0 visits · 0 signups</Sk>
              </p>
            </div>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-rule px-4 py-2.5 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <Sk>Commission · Oct 9, 2026</Sk>
                  </p>
                  <p className="text-xs">
                    <Sk>Available Nov 8, 2026</Sk>
                  </p>
                </div>
                <p className="text-sm">
                  <Sk>$2.40</Sk>
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs">
            <Sk>Minimum payout $20.00 · USD only · Terms</Sk>
          </p>
        </div>
      </div>
    </div>
  );
}
