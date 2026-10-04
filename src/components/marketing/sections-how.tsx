import { HowAddSiteVisual } from "./HowAddSiteVisual";
import { HowDashboardVisual } from "./HowDashboardVisual";
import { HowFirstCheckVisual } from "./HowFirstCheckVisual";
import { StepNode, StepRail } from "./how-parts";
import { InView } from "./InView";
import { TourBlock } from "./TourBlock";
import { howSteps } from "./home-content";

const visuals = [HowAddSiteVisual, HowFirstCheckVisual, HowDashboardVisual];
/** Base delay per step when the steps sit side by side (lg); 0 when stacked. */
const stagger = ["[--d:0ms]", "[--d:0ms] lg:[--d:900ms]", "[--d:0ms] lg:[--d:1800ms]"];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">How it works</h2>
          <p className="mt-3 text-muted">Three steps. Minutes to set up. Ongoing peace of mind.</p>
        </div>
        <ol className="mt-14 grid gap-10 lg:grid-cols-3 lg:gap-8">
          {howSteps.map((s, i) => {
            const Visual = visuals[i];
            return (
              <li key={s.step} className={`min-w-0 ${stagger[i]}`}>
                <InView className="relative flex h-full flex-col pl-14 lg:pl-0">
                  {i < howSteps.length - 1 ? <StepRail /> : null}
                  <div className="absolute left-0 top-0 lg:static">
                    <StepNode n={s.step} />
                  </div>
                  <div className="pt-2 lg:min-h-[7.5rem] lg:pt-6">
                    <h3 className="font-display text-xl font-medium text-ink">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                  </div>
                  <div className="mt-5 flex-1">
                    <Visual />
                  </div>
                </InView>
              </li>
            );
          })}
        </ol>
        <TourBlock />
      </div>
    </section>
  );
}
