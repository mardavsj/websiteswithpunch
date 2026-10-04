import type { ArticleSection } from "./types";

/** Long-form explainer under a tool or feature: plain, server-rendered HTML for crawlers and readers. */
export function Article({ sections }: { sections: ArticleSection[] }) {
  return (
    <div className="space-y-12">
      {sections.map((s) => (
        <section key={s.h}>
          <h2 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-[1.7rem]">{s.h}</h2>
          {s.p?.map((t) => (
            <p key={t.slice(0, 40)} className="mt-4 text-base leading-relaxed text-muted">{t}</p>
          ))}
          {s.list && (
            <ul className="mt-4 space-y-2.5">
              {s.list.map((t) => (
                <li key={t.slice(0, 40)} className="flex gap-3 text-base leading-relaxed text-muted">
                  <span aria-hidden className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 bg-accent" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          )}
          {s.steps && (
            <ol className="mt-4 space-y-3">
              {s.steps.map((t, i) => (
                <li key={t.slice(0, 40)} className="flex gap-3 text-base leading-relaxed text-muted">
                  <span className="mt-0.5 font-display text-sm font-medium text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          )}
          {s.code && (
            <pre className="mt-4 overflow-x-auto border border-rule bg-surface p-4 text-[13px] leading-relaxed text-ink">
              <code>{s.code}</code>
            </pre>
          )}
        </section>
      ))}
    </div>
  );
}
