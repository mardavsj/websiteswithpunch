import { ratePercent } from "@/lib/referrals/config";

const STEPS = ["Share your link", "They subscribe", `You get ${ratePercent}%`];

/** Three tiny steps, one line on desktop. */
export function HowItWorks() {
  return (
    <ol className="flex flex-col gap-1.5 text-sm text-muted sm:flex-row sm:items-center sm:gap-2" aria-label="How it works">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          {i > 0 && <span className="hidden text-rule sm:inline" aria-hidden>›</span>}
          <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-rule text-[11px] tabular-nums text-ink">{i + 1}</span>
          {s}
        </li>
      ))}
    </ol>
  );
}
