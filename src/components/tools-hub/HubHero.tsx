import { IconPulse } from "@/components/marketing/icons";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { StageChip, ToolStage } from "@/components/tools/ToolStage";
import { QuickStart } from "./QuickStart";

const FACTS = ["No signup", "Live from our server", "Plain-English results"];

/** Hub hero: the promise on the left, a working quick-start panel on the right. */
export function HubHero() {
  return (
    <section className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10">
        <Breadcrumbs items={[{ name: "Free tools", href: "/tools" }]} />
        <div className="mt-10 grid min-w-0 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <div className="min-w-0">
            <p className="label-caps text-accent">Free website tools</p>
            <h1 className="mt-4 font-display text-[2.3rem] font-medium leading-[1.04] tracking-[-0.035em] text-ink sm:text-[3.25rem] lg:text-[2.85rem]">
              Check any site&apos;s <span className="text-accent">SSL</span>, domain and uptime in seconds.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              Three free checks for the problems that take websites offline most often: an expiring
              certificate, a lapsing domain and a server that stopped answering.
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink">
              {FACTS.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span aria-hidden className="h-1.5 w-1.5 bg-accent" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <ToolStage icon={<IconPulse className="h-4 w-4" />} title="Quick check" badge={<StageChip>Free</StageChip>}>
            <QuickStart />
          </ToolStage>
        </div>
      </div>
    </section>
  );
}
