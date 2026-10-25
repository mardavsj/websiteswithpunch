import Link from "next/link";
import type { ReactNode } from "react";

/** Fixed zone + locale: the same string on the server and in any browser. */
export const fmtDate = (d: Date | null | undefined, time = true) =>
  d ? d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", ...(time ? { timeStyle: "short" } : {}) }) + (time ? " IST" : "") : "—";

export const PAGE_SIZE = 25;
export const pageOf = (raw?: string) => Math.max(1, Math.min(10_000, Number.parseInt(raw ?? "1", 10) || 1));

export function AdminHeader({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-medium text-ink">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="min-w-0 border border-rule bg-surface">
      {title && (
        <header className="flex items-center justify-between gap-2 border-b border-rule px-4 py-2.5">
          <h2 className="label-caps !text-ink/80">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, note, href }: { label: string; value: ReactNode; note?: ReactNode; href?: string }) {
  const body = (
    <>
      <p className="truncate text-xs text-muted">{label}</p>
      <p className="mt-1 truncate font-display text-2xl font-medium tabular-nums text-ink">{value}</p>
      {note && <p className="mt-0.5 truncate text-xs text-muted">{note}</p>}
    </>
  );
  return href
    ? <Link href={href} className="block min-w-0 bg-surface px-4 py-4 hover:bg-accent-soft">{body}</Link>
    : <div className="min-w-0 bg-surface px-4 py-4">{body}</div>;
}

/** Horizontal scroll on small screens instead of squashed columns. */
export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-rule">
            {head.map((h) => <th key={h} className="whitespace-nowrap px-4 py-2.5 text-xs font-medium text-muted">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {empty ? <tr><td colSpan={head.length} className="px-4 py-8 text-center text-sm text-muted">Nothing here yet.</td></tr> : children}
        </tbody>
      </table>
    </div>
  );
}

export const td = "whitespace-nowrap px-4 py-2.5 text-ink";

type Q = Record<string, string | undefined>;
const qs = (base: Q, extra: Q) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...extra })) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "?";
};

/** Server-rendered filter chips: plain links, no client state. */
export function Filters({ path, q, name, options }: { path: string; q: Q; name: string; options: Array<[string, string]> }) {
  return (
    <div className="flex flex-wrap gap-1.5 text-sm">
      {options.map(([v, label]) => {
        const on = (q[name] ?? "") === v;
        return (
          <Link key={`${name}:${v}`} href={`${path}${qs(q, { [name]: v || undefined, page: undefined })}`} aria-current={on ? "true" : undefined} className={`border px-3 py-1.5 ${on ? "border-accent bg-accent text-white" : "border-rule bg-surface text-muted hover:border-accent hover:text-ink"}`}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}

export function Pager({ path, q, page, total }: { path: string; q: Q; page: number; total: number }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const btn = "border border-rule px-3 py-1.5 text-sm";
  return (
    <div className="flex items-center justify-between gap-3 border-t border-rule px-4 py-2.5 text-xs text-muted">
      <span>{total.toLocaleString("en-US")} total · page {Math.min(page, pages)} of {pages}</span>
      <span className="flex gap-2">
        {page > 1 ? <Link className={`${btn} text-ink hover:border-accent`} href={`${path}${qs(q, { page: String(page - 1) })}`}>Previous</Link> : <span className={`${btn} opacity-40`}>Previous</span>}
        {page < pages ? <Link className={`${btn} text-ink hover:border-accent`} href={`${path}${qs(q, { page: String(page + 1) })}`}>Next</Link> : <span className={`${btn} opacity-40`}>Next</span>}
      </span>
    </div>
  );
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" | "ok" | "danger" }) {
  const c = { muted: "text-muted border-rule", accent: "text-accent border-accent/30", ok: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30", danger: "text-danger border-danger/30" }[tone];
  return <span className={`inline-block border px-1.5 py-0.5 text-[11px] font-medium ${c}`}>{children}</span>;
}

export { qs };
