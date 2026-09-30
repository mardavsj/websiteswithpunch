import { IconLink } from "./icons";
import { Field, appear, delay } from "./how-parts";
import { Panel, VisualStage } from "./monitor-visual-parts";

/** Step 1: the real "Add site" form, with the URL typing in and the whole-site hint. */
export function HowAddSiteVisual() {
  return (
    <VisualStage compact>
      <Panel
        icon={<IconLink className="h-4 w-4" />}
        title="Add site"
        badge={<span className="shrink-0 text-[11px] text-muted">Free · 1 site</span>}
      >
        <div className="space-y-3">
          <Field label="Name">
            <span className={appear} style={delay(150)}>
              My shop
            </span>
          </Field>
          <div>
            <Field label="URL">
              <span className="flex min-w-0 items-center">
                <span
                  className="truncate transition-[clip-path] duration-[1100ms] ease-[steps(28,end)] [clip-path:inset(0_100%_0_0)] group-data-[inview=true]:[clip-path:inset(0_0_0_0)] motion-reduce:transition-none"
                  style={delay(400)}
                >
                  https://shop.example.com/sale
                </span>
                <span className="ml-px h-3.5 w-px shrink-0 bg-accent motion-safe:animate-pulse" />
              </span>
            </Field>
            <p className={`mt-1 text-[11px] leading-snug text-muted ${appear}`} style={delay(1600)}>
              We monitor the whole site: <span className="text-ink">shop.example.com</span>
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span
              className="bg-accent px-3 py-1.5 text-xs font-medium text-white transition duration-300 group-data-[inview=true]:shadow-[0_0_0_3px_hsl(var(--accent)/0.25)] motion-reduce:transition-none"
              style={delay(1900)}
            >
              Add site
            </span>
            <span className="border border-rule px-3 py-1.5 text-xs text-ink">Cancel</span>
          </div>
        </div>
      </Panel>
    </VisualStage>
  );
}
