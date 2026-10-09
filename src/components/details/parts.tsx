import type { ReactNode } from "react";
import { Sk, SkStatus } from "@/components/skeleton/Sk";
import { IconAlert, IconInfo } from "./icons";

const TZ = { timeZone: "Asia/Kolkata" } as const;

/** Date + time, as the rest of the dashboard shows it. */
export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { ...TZ, dateStyle: "medium", timeStyle: "short" });
}

/** Date only, e.g. 23 Apr 2027. */
export function fmtDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { ...TZ, day: "numeric", month: "short", year: "numeric" });
}

export function fmtMs(ms: number | null | undefined): string {
  return ms == null ? "—" : `${Math.round(ms).toLocaleString("en-IN")} ms`;
}

export function Rows({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-rule">{children}</dl>;
}

/**
 * Label (muted) / value (strong, right-aligned). `stack` puts long values (serials,
 * fingerprints) on their own line in mono.
 */
export function Row({ label, children, stack = false }: { label: string; children: ReactNode; stack?: boolean }) {
  if (stack) {
    return (
      <div className="px-4 py-2.5 text-[13px]">
        <dt className="text-muted">{label}</dt>
        <dd className="mt-1 break-all font-mono text-xs leading-5 text-ink">{children}</dd>
      </div>
    );
  }
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5 text-[13px]">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium tabular-nums text-ink">{children}</dd>
    </div>
  );
}

/** A value we don't have, with the short reason why. */
export function NA({ reason }: { reason: string }) {
  return (
    <span className="inline-block text-right font-normal text-muted">
      <span className="inline-flex items-center gap-1">
        <IconInfo className="h-3.5 w-3.5" />
        Not available
      </span>
      <span className="block text-xs leading-snug">{reason}</span>
    </span>
  );
}

/** Value or "Not available" with a reason. */
export function orNA(value: ReactNode | null | undefined, reason: string): ReactNode {
  return value == null || value === "" || value === false ? <NA reason={reason} /> : value;
}

/** Callout above the cards. */
export function Note({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "warn" }) {
  const cls =
    tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"
      : "border-rule bg-surface text-muted";
  return (
    <div className={`mb-3 flex gap-2.5 border px-3 py-2.5 text-xs leading-relaxed ${cls}`}>
      {tone === "warn" ? <IconAlert className="mt-px h-4 w-4 shrink-0" /> : <IconInfo className="mt-px h-4 w-4 shrink-0" />}
      <p className="min-w-0">{children}</p>
    </div>
  );
}

/** Compact list row: left text, right value, optional second line. */
export function Item({ left, right, sub, lead }: { left: ReactNode; right: ReactNode; sub?: ReactNode; lead?: ReactNode }) {
  return (
    <li className="flex gap-3 px-4 py-2.5 text-[13px]">
      {lead && <span className="mt-1.5 shrink-0">{lead}</span>}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 font-medium text-ink">{left}</span>
          <span className="shrink-0 tabular-nums text-muted">{right}</span>
        </div>
        {sub && <p className="mt-0.5 break-words text-xs text-muted">{sub}</p>}
      </div>
    </li>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-rule">{children}</ul>;
}

const SK_LABELS = ["Expires on", "Valid from", "Issued by", "Covers", "TLS version", "Last checked"];

/** Neutral grey stand-in shaped like the panel (hero + cards of rows) while /details loads. */
export function DetailsSkeleton({ groups = 2 }: { groups?: number }) {
  const box = "border border-rule bg-surface";
  return (
    <div aria-busy="true">
      <SkStatus label="Loading details…" />
      <div className={`mb-3 px-4 py-4 ${box}`} aria-hidden>
        <Sk>Days left</Sk>
        <p className="mt-2 text-3xl"><Sk>000 days</Sk></p>
        <div className="mt-3 h-1.5 w-full bg-ink/[0.07]" />
      </div>
      {Array.from({ length: groups - 1 }, (_, g) => (
        <section key={g} className={`mt-3 ${box}`} aria-hidden>
          <div className="border-b border-rule px-4 py-2.5 text-xs"><Sk>{g ? "More details" : "Summary"}</Sk></div>
          {SK_LABELS.slice(0, g ? 3 : 5).map((l, i) => (
            <div key={l} className="flex justify-between gap-4 border-b border-rule px-4 py-2.5 text-[13px] last:border-0">
              <Sk>{l}</Sk>
              <Sk>{i % 2 ? "12 Mar 2027, 4:10 pm" : "Sample value"}</Sk>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
