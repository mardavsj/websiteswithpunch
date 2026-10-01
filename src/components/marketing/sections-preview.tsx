import { DashboardReplica } from "./DashboardReplica";
import { FitWindow } from "./FitWindow";
import { PreviewCallouts } from "./PreviewCallouts";
import { previewCallouts } from "./preview-data";

function Caption({ className }: { className: string }) {
  return (
    <p className={`label-caps items-center gap-2 ${className}`}>
      <span className="h-1.5 w-1.5 bg-accent" aria-hidden />
      Preview with example data
    </p>
  );
}

/**
 * "Inside the dashboard": an inert replica of /dashboard with example data and the three signals
 * called out. lg+: copy (top-aligned) + key on the left, the window on the right, sized to fit one screen.
 */
export function ProductPreviewSection() {
  return (
    <section id="dashboard-preview" className="border-b border-rule bg-bg">
      <div className="relative mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:[@media(min-height:1000px)]:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:grid-rows-[auto_1fr_auto_1fr_auto] lg:gap-x-10">
        {/* lg: pt = stage border + padding, so the copy starts level with the window's top edge. */}
        <div className="lg:col-start-1 lg:row-start-1 lg:pb-6 lg:pt-[13px]">
          <p className="label-caps">Inside the dashboard</p>
          <h2 className="mt-4 lg:mt-3 max-w-[18ch] font-display text-[2.1rem] font-medium leading-[1.05] tracking-[-0.03em] text-ink sm:text-5xl lg:text-[2.5rem]">
            One screen. Every site. <span className="text-accent">Three signals.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted lg:mt-4 lg:text-base">
            This is the dashboard you land on after signup. Each site gets its own card with status,
            SSL days left and domain days left, plus a manual recheck and a full analytics view.
          </p>
        </div>

        {/* lg: equal 1fr rows above and below keep the key where it sat when the whole column was
            centred (pb-5 + the caption row below stand in for the old caption spacing), so the
            leader lines stay put. */}
        <ol data-key-list className="hidden gap-3 lg:col-start-1 lg:row-start-3 lg:grid lg:pb-5">
          <KeyItems />
        </ol>
        {/* lg: pb = stage padding + border, so the caption sits level with the window's bottom edge. */}
        <Caption className="hidden lg:col-start-1 lg:row-start-5 lg:flex lg:self-end lg:pb-[13px]" />

        <div
          data-preview-stage
          className="mt-12 border border-rule bg-[hsl(var(--ink)/0.03)] px-3 pb-8 pt-5 sm:mt-14 sm:px-8 sm:pb-12 sm:pt-6 lg:col-start-2 lg:row-span-5 lg:row-start-1 lg:mt-0 lg:self-center lg:p-3"
        >
          <Caption className="mb-4 flex sm:mb-5 lg:hidden" />
          <FitWindow>
            <DashboardReplica />
          </FitWindow>
        </div>

        <ol className="mt-6 grid gap-5 sm:grid-cols-3 lg:hidden">
          <KeyItems />
        </ol>
        <PreviewCallouts />
      </div>
    </section>
  );
}

function KeyItems() {
  return previewCallouts.map((c, i) => (
    <li key={c.key} className="flex gap-3">
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center bg-accent text-[10px] font-semibold text-white">
        {i + 1}
      </span>
      <div>
        <p className="text-sm font-medium text-ink">
          <span data-key-title={i + 1}>{c.title}</span>
        </p>
        <p className="mt-1 text-xs leading-snug text-muted">{c.body}</p>
      </div>
    </li>
  ));
}
