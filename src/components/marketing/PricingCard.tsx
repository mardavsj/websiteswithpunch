import Link from "next/link";
import type { BillingInterval } from "@/lib/billing-interval";
import type { PricingPlan } from "./pricing-content";

function Dash({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-4 w-4 shrink-0 ${className}`} fill="none" aria-hidden>
      <path d="M4 8h8" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-4 w-4 shrink-0 ${className}`} fill="none" aria-hidden>
      <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth={1.75} strokeLinecap="square" />
    </svg>
  );
}

function Spark() {
  return (
    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M6 0.5 7.2 4.8 11.5 6 7.2 7.2 6 11.5 4.8 7.2 0.5 6 4.8 4.8Z" />
    </svg>
  );
}

/** Straddles the card's top edge; the page-colour ring reads as a notch cut into the border. */
function PopularTag() {
  return (
    <span className="absolute left-1/2 top-0 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap bg-accent px-2.5 py-1.5 text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-white ring-2 ring-bg">
      <Spark />
      Most popular
    </span>
  );
}

const cta = {
  free: "border border-rule bg-bg text-ink hover:bg-accent-soft",
  pro: "bg-accent text-white hover:bg-accent-hover",
  business: "bg-solid text-solid-fg hover:opacity-90",
} as const;

/**
 * One plan: name + tag, who it's for, price + billing note, CTA, divider, feature list.
 * Price, note and CTA link follow the Monthly / Annual toggle; everything else is fixed.
 * lg: each card is a subgrid spanning the parent's rows (6 blocks + 7 feature rows, the longest
 * list; update span_13 / row-span-7 if the lists grow),
 * so every block and every feature row sits at the same height across the three cards.
 */
export function PricingCard({ plan, interval }: { plan: PricingPlan; interval: BillingInterval }) {
  const dark = plan.id === "pro";
  const { price, note, href } = plan.pricing[interval];
  const soft = dark ? "text-solid-fg/60" : "text-muted";
  return (
    <div
      className={`relative flex min-w-0 flex-col p-6 sm:p-8 lg:[grid-row:span_13] lg:grid lg:grid-rows-subgrid lg:gap-y-0 ${
        dark ? "border border-solid bg-solid text-solid-fg max-lg:mt-3" : "border border-rule bg-surface text-ink"
      }`}
    >
      {dark ? <PopularTag /> : null}
      <h3 className="font-display text-xl font-medium">{plan.name}</h3>
      <p className={`mt-2 text-sm leading-relaxed ${soft}`}>{plan.audience}</p>

      <p className="mt-6 flex items-baseline gap-1.5">
        <span className="font-display text-5xl font-medium tabular-nums tracking-tight">${price}</span>
        <span className={`text-sm ${soft}`}>/ month</span>
      </p>
      <p className={`mt-2 text-xs ${soft}`}>{note}</p>

      <Link
        href={href}
        className={`mt-6 block px-4 py-3 text-center text-sm font-semibold transition-colors ${cta[plan.id]}`}
      >
        {plan.cta}
      </Link>

      <div className={`mt-8 border-t pb-4 pt-6 ${dark ? "border-solid-fg/15" : "border-rule"}`}>
        <p className={`label-caps ${dark ? "!text-solid-fg/55" : ""}`}>Includes</p>
      </div>
      <ul className="space-y-3 text-sm lg:row-span-7 lg:grid lg:grid-rows-subgrid lg:gap-y-0">
        {plan.features.map((f) => (
          <li key={f.text} className="flex gap-3">
            {f.off ? <Dash className={`mt-0.5 ${soft}`} /> : <Check className="mt-0.5 text-accent" />}
            <span className={f.off ? soft : dark ? "text-solid-fg/90" : "text-ink"}>{f.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
