import Link from "next/link";
import type { Persona } from "./audience-content";

/** Editorial persona sheet: statement, before → after, and the plan-sized stat. */
export function AudienceDetail({ p }: { p: Persona }) {
  return (
    <div className="border border-rule bg-surface p-6 sm:p-10">
      <div>
        <p className="label-caps !text-accent">For {p.title.toLowerCase()}</p>
        <p className="mt-4 max-w-md font-display text-xl font-medium leading-snug text-ink sm:text-3xl lg:max-w-lg">
          {p.body}
        </p>

        <dl className="mt-8 grid border-t border-rule sm:grid-cols-2">
          <div className="py-5 sm:pr-6">
            <dt className="label-caps">Without</dt>
            <dd className="mt-2 text-sm leading-relaxed text-muted">{p.pain}</dd>
          </div>
          <div className="border-t border-rule py-5 sm:border-l sm:border-t-0 sm:pl-6">
            <dt className="label-caps !text-accent">With Punch</dt>
            <dd className="mt-2 text-sm leading-relaxed text-ink">{p.outcome}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-end justify-between gap-5 border-t border-rule pt-6">
          <div className="flex items-end gap-4">
            <span className="font-display text-6xl font-medium leading-[0.85] tracking-tight text-ink sm:text-7xl">
              {p.stat}
            </span>
            <span className="max-w-[9rem] pb-0.5 text-sm leading-snug text-muted">{p.statLabel}</span>
          </div>
          <Link
            href={p.href}
            className="group/cta inline-flex items-center gap-2 bg-solid px-5 py-3 text-sm font-semibold text-solid-fg hover:opacity-90"
          >
            {p.cta}
            <span
              className="transition-transform duration-300 group-hover/cta:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden
            >
              →
            </span>
          </Link>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-muted">{p.get}</p>
      </div>
    </div>
  );
}
