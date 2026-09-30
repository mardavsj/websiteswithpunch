import Link from "next/link";
import type { PricingPlan } from "./pricing-content";

export function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-4 w-4 shrink-0 ${className}`} fill="none" aria-hidden>
      <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth={1.75} strokeLinecap="square" />
    </svg>
  );
}

const cta = {
  free: "border border-rule bg-bg text-ink hover:bg-accent-soft",
  pro: "bg-accent text-white hover:bg-accent-hover",
  business: "bg-solid text-solid-fg hover:opacity-90",
} as const;

/** One plan: name + tag, who it's for, price + billing note, CTA, divider, feature list. */
export function PricingCard({ plan }: { plan: PricingPlan }) {
  const dark = plan.id === "pro";
  const soft = dark ? "text-solid-fg/60" : "text-muted";
  return (
    <div
      className={`flex min-w-0 flex-col p-6 sm:p-8 ${
        dark ? "border border-solid bg-solid text-solid-fg" : "border border-rule bg-surface text-ink"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-xl font-medium">{plan.name}</h3>
        {dark ? (
          <span className="bg-accent px-2 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-white">
            Most popular
          </span>
        ) : null}
      </div>
      <p className={`mt-2 text-sm leading-relaxed ${soft}`}>{plan.audience}</p>

      <p className="mt-6 flex items-baseline gap-1.5">
        <span className="font-display text-5xl font-medium tracking-tight">${plan.price}</span>
        <span className={`text-sm ${soft}`}>/ month</span>
      </p>
      <p className={`mt-2 text-xs ${soft}`}>{plan.note}</p>

      <Link
        href={plan.href}
        className={`mt-6 block px-4 py-3 text-center text-sm font-semibold transition-colors ${cta[plan.id]}`}
      >
        {plan.cta}
      </Link>

      <div className={`mt-8 border-t pt-6 ${dark ? "border-solid-fg/15" : "border-rule"}`}>
        <p className={`label-caps ${dark ? "!text-solid-fg/55" : ""}`}>{plan.featuresLabel}</p>
        <ul className="mt-4 space-y-3 text-sm">
          {plan.features.map((f) => (
            <li key={f} className="flex gap-3">
              <Check className="mt-0.5 text-accent" />
              <span className={dark ? "text-solid-fg/90" : "text-ink"}>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
