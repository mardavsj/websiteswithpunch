import { TourPlayer } from "./TourPlayer";

/** "How it works" closer: the product tour on a dotted stage, below the three step cards. */
export function TourBlock() {
  return (
    <div className="mt-20 lg:mt-24">
      <div className="max-w-xl lg:max-w-3xl">
        <p className="label-caps">Product tour</p>
        <h3 className="mt-2 font-display text-2xl font-medium text-ink sm:text-3xl">See it in action</h3>
        <p className="mt-3 text-muted">
          Adding a site, the first check, the dashboard, rechecks, analytics and plans, in 54 seconds.
        </p>
      </div>
      <div className="relative mt-8 border border-rule bg-bg p-3 pb-5 pr-5 sm:p-8 sm:pb-10 sm:pr-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(hsl(var(--ink)/0.09)_1px,transparent_1px)] [background-size:14px_14px]"
        />
        <div className="relative">
          <TourPlayer />
        </div>
      </div>
    </div>
  );
}
