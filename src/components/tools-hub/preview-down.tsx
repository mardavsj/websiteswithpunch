import { MiniPanel, MiniStage, okTag } from "./Stage";

/** Down checker preview: the status code as a big tile and the response time on a fast→slow scale. */
export function DownPreview() {
  return (
    <MiniStage>
      <MiniPanel title="down · shop.example.com" tag={okTag}>
        <div className="flex items-center gap-3.5">
          <div className="flex h-[60px] w-[72px] shrink-0 flex-col items-center justify-center bg-emerald-700 text-white dark:bg-emerald-600">
            <span className="font-display text-2xl font-medium leading-none">200</span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wider">OK</span>
          </div>
          <div className="min-w-0">
            <p className="font-display text-2xl font-medium tracking-tight text-emerald-700 dark:text-emerald-300">It&apos;s up</p>
            <p className="truncate font-mono text-[10px] text-muted">→ https://www.shop.example.com/</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-[11px]">
            <span className="text-muted">Response time</span>
            <span className="font-medium text-ink">182 ms</span>
          </div>
          <div className="relative mt-1.5 flex h-1.5 gap-0.5">
            <span className="w-1/3 bg-emerald-500/80" />
            <span className="w-1/3 bg-amber-400/80" />
            <span className="w-1/3 bg-rose-500/70" />
            <span className="absolute -top-1 left-[12%] h-3.5 w-0.5 bg-ink" />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted">
            <span>fast</span>
            <span>slow</span>
          </div>
        </div>
      </MiniPanel>
    </MiniStage>
  );
}
