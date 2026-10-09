import type { ReactNode } from "react";
import { Sk, SkStatus } from "@/components/skeleton/Sk";

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

/** Titled group inside a panel. */
export function Group({ title, children, note }: { title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="label-caps">{title}</h3>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

export function Rows({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-rule border-y border-rule">{children}</dl>;
}

/** Label / value line. `mono` for serials and fingerprints. */
export function Row({ label, children, mono = false }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-2 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className={`min-w-0 text-ink ${mono ? "break-all font-mono text-xs leading-5" : "break-words"}`}>
        {children}
      </dd>
    </div>
  );
}

/** A value we don't have, with the short reason why. */
export function NA({ reason }: { reason: string }) {
  return (
    <span className="text-muted">
      Not available
      <span className="block text-xs">{reason}</span>
    </span>
  );
}

/** Value or "Not available" with a reason. */
export function orNA(value: ReactNode | null | undefined, reason: string): ReactNode {
  return value == null || value === "" || value === false ? <NA reason={reason} /> : value;
}

export function Note({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "warn" }) {
  const cls =
    tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"
      : "border-rule bg-bg text-muted";
  return <p className={`mb-4 border px-3 py-2 text-xs ${cls}`}>{children}</p>;
}

/** Compact list row: left text, right value, optional second line. */
export function Item({ left, right, sub }: { left: ReactNode; right: ReactNode; sub?: ReactNode }) {
  return (
    <li className="py-2 text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-ink">{left}</span>
        <span className="shrink-0 tabular-nums text-muted">{right}</span>
      </div>
      {sub && <p className="mt-0.5 break-words text-xs text-muted">{sub}</p>}
    </li>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-rule border-y border-rule">{children}</ul>;
}

const SK_LABELS = ["Expires on", "Valid from", "Issued by", "Covers", "TLS version", "Last checked"];

/** Neutral grey stand-in shaped like a panel (groups of label/value rows) while /details loads. */
export function DetailsSkeleton({ groups = 2 }: { groups?: number }) {
  return (
    <div aria-busy="true">
      <SkStatus label="Loading details…" />
      {Array.from({ length: groups }, (_, g) => (
        <section key={g} className="mt-5 first:mt-0" aria-hidden>
          <h3 className="label-caps">
            <Sk>{g ? "More details" : "Summary"}</Sk>
          </h3>
          <dl className="mt-1.5 divide-y divide-rule border-y border-rule">
            {SK_LABELS.slice(0, g ? 3 : 6).map((l, i) => (
              <div key={l} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-2 text-sm">
                <dt>
                  <Sk>{l}</Sk>
                </dt>
                <dd>
                  <Sk>{i % 2 ? "12 Mar 2027, 4:10 pm" : "Sample value text"}</Sk>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
