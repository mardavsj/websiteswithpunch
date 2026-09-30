import { DashboardReplica } from "./DashboardReplica";
import { PreviewCallouts } from "./PreviewCallouts";
import { previewCallouts } from "./preview-data";

/** "Inside the dashboard": an inert replica of /dashboard with example data and the three signals called out. */
export function ProductPreviewSection() {
  return (
    <section className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div>
            <p className="label-caps">Inside the dashboard</p>
            <h2 className="mt-4 max-w-[18ch] font-display text-[2.1rem] font-medium leading-[1.05] tracking-[-0.03em] text-ink sm:text-5xl">
              One screen. Every site. <span className="text-accent">Three signals.</span>
            </h2>
          </div>
          <p className="max-w-md text-lg leading-relaxed text-muted lg:justify-self-end">
            This is the dashboard you land on after signup. Each site gets its own card with status,
            SSL days left and domain days left, plus a manual recheck and a full analytics view.
          </p>
        </div>

        <div className="relative mt-12 border border-rule bg-[hsl(var(--ink)/0.03)] px-3 pb-8 pt-5 sm:mt-14 sm:px-8 sm:pb-12 sm:pt-6 xl:px-44">
          <p className="label-caps mb-4 flex items-center gap-2 sm:mb-5 xl:-ml-40">
            <span className="h-1.5 w-1.5 bg-accent" aria-hidden />
            Preview with example data
          </p>
          <DashboardReplica />
          <PreviewCallouts />
        </div>

        <ol className="mt-6 grid gap-5 sm:grid-cols-3 xl:hidden">
          {previewCallouts.map((c, i) => (
            <li key={c.key} className="flex gap-3">
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center bg-accent text-[10px] font-semibold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-ink">{c.title}</p>
                <p className="mt-1 text-xs leading-snug text-muted">{c.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
