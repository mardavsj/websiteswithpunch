import Link from "next/link";
import { PLANS } from "@/lib/plans";

/** True facts from the Free plan config: its site limit, and no checkout for Free. */
export const FREE_TRUST = `Free for ${PLANS.free.siteLimit} site${PLANS.free.siteLimit === 1 ? "" : "s"} · No card needed`;
export const START_LABEL = "Start monitoring free";

/** Mid-page CTA band, repeated after key homepage sections. */
export function CtaBand({ line }: { line: string }) {
  return (
    <section className="border-b border-rule bg-bg">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-display text-xl font-medium tracking-tight text-ink sm:text-2xl">{line}</p>
        <div className="shrink-0 sm:text-right">
          <Link
            href="/signup"
            className="inline-flex bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            {START_LABEL}
          </Link>
          <p className="mt-2 text-xs text-muted">{FREE_TRUST}</p>
        </div>
      </div>
    </section>
  );
}
