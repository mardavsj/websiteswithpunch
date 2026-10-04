import { MiniPanel, MiniStage, okTag } from "./Stage";

const ROWS: [string, string][] = [
  ["Registrar", "Example Registrar, Inc."],
  ["Registered", "12 Mar 2019"],
  ["Source", "RDAP"],
];

/** Domain checker preview: a tear-off calendar date for the expiry, beside the registry facts. */
export function DomainPreview() {
  return (
    <MiniStage>
      <MiniPanel title="domain · example.com" tag={okTag}>
        <div className="flex items-stretch gap-3.5">
          <div className="w-[72px] shrink-0 border border-rule bg-bg text-center">
            <p className="bg-accent py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Jul</p>
            <p className="pt-1.5 font-display text-3xl font-medium leading-none text-ink">14</p>
            <p className="pb-1.5 pt-1 text-[10px] text-muted">2027</p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl font-medium tracking-tight text-emerald-700 dark:text-emerald-300">283 days</p>
            <p className="text-[11px] text-muted">until the registration expires</p>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-rule pt-3 text-[11px]">
          {ROWS.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd className="truncate text-right text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </MiniPanel>
    </MiniStage>
  );
}
