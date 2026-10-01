"use client";

import { useState } from "react";
import { AudienceDetail } from "./AudienceDetail";
import { personas } from "./audience-content";

const ease = "duration-500 ease-out motion-reduce:transition-none";

function Arrow({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-4 w-4 transition-transform ${ease} ${open ? "rotate-90 lg:rotate-0" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
    </svg>
  );
}

export function AudienceSection() {
  const [active, setActive] = useState(0);

  return (
    <section id="who-its-for" className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">Who it’s for</h2>
          <p className="mt-3 text-muted">People who own sites but don’t want a full ops stack.</p>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
          <ul className="self-start border-b border-rule">
            {personas.map((p, i) => {
              const on = i === active;
              return (
                <li key={p.id} className="border-t border-rule">
                  <button
                    type="button"
                    id={`who-${p.id}`}
                    aria-expanded={on}
                    aria-controls={`who-${p.id}-panel`}
                    onClick={() => setActive(i)}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    className="group/row relative flex min-h-[76px] w-full items-center gap-4 text-left sm:min-h-[96px] sm:gap-6 lg:min-h-[104px]"
                  >
                    <span
                      className={`absolute left-0 top-[-1px] h-px w-full origin-left bg-accent transition-transform ${ease} ${on ? "scale-x-100" : "scale-x-0"}`}
                      aria-hidden
                    />
                    <span className="w-6 shrink-0 font-display text-xs tabular-nums text-muted">
                      0{i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block font-display text-2xl font-medium tracking-tight transition-colors sm:text-3xl lg:text-4xl ${ease} ${
                          on ? "text-ink" : "text-ink/35 group-hover/row:text-ink/70"
                        }`}
                      >
                        {p.title}
                      </span>
                    </span>
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center border border-rule transition-colors ${ease} ${
                        on ? "bg-accent text-white" : "text-muted group-hover/row:text-ink"
                      }`}
                    >
                      <Arrow open={on} />
                    </span>
                  </button>

                  <div
                    id={`who-${p.id}-panel`}
                    role="region"
                    aria-labelledby={`who-${p.id}`}
                    className={`grid transition-[grid-template-rows] lg:hidden ${ease} ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div
                      className={`overflow-hidden transition-[visibility] ${ease} ${on ? "visible" : "invisible"}`}
                    >
                      <div className="pb-6">
                        <AudienceDetail p={p} />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="hidden lg:block">
            <div className="sticky top-24 grid">
              {personas.map((p, i) => {
                const on = i === active;
                return (
                  <div
                    key={p.id}
                    aria-hidden={!on}
                    className={`transition [grid-area:1/1] ${ease} ${
                      on ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible translate-y-3 opacity-0"
                    }`}
                  >
                    <AudienceDetail p={p} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
