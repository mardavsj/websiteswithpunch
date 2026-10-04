"use client";

import { useState } from "react";
import { IconPulse } from "../icons";
import { useHeroCheck } from "./HeroCheckProvider";

/**
 * Hero "Website down checker" panel. A plain GET form to the down checker page, so it still works
 * without JavaScript; with JS it checks in place and opens the result card below the hero row.
 */
export function HeroCheckForm() {
  const { submit, loading, formError, clearError, inputRef, preload } = useHeroCheck();
  const [value, setValue] = useState("");
  const describedBy = formError ? "hero-q-error" : "hero-q-help";

  return (
    <form
      action="/tools/website-down-checker"
      method="get"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
      className="border border-rule bg-surface shadow-[6px_6px_0_0_hsl(var(--accent)/0.18)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-2">
          <IconPulse className="h-4 w-4 shrink-0 text-accent" />
          <span className="truncate font-display text-sm font-medium text-ink">Website down checker</span>
        </span>
        <span className="hidden shrink-0 text-[11px] text-muted sm:inline">Uptime · SSL · domain</span>
      </div>
      <div className="p-4">
        <label htmlFor="hero-q" className="text-sm font-medium text-ink">
          Website
        </label>
        <div className="mt-2 flex gap-2">
          <input
            ref={inputRef}
            id="hero-q"
            name="q"
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="example.com"
            value={value}
            onFocus={preload}
            onPointerEnter={preload}
            onChange={(e) => {
              setValue(e.target.value);
              if (formError) clearError();
            }}
            aria-invalid={Boolean(formError)}
            aria-describedby={describedBy}
            className={`block w-full min-w-0 flex-1 rounded-none border bg-bg px-3 py-2.5 text-base text-ink outline-none transition placeholder:text-muted/70 focus:ring-2 ${
              formError ? "border-danger focus:ring-danger/20" : "border-rule focus:border-accent focus:ring-accent/20"
            }`}
          />
          <button
            type="submit"
            disabled={loading}
            onPointerEnter={preload}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-80"
          >
            {loading && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {loading ? "Checking…" : "Check"}
          </button>
        </div>
        {formError ? (
          <p id="hero-q-error" role="alert" className="mt-2 text-sm font-medium text-danger">
            {formError}
          </p>
        ) : (
          <p id="hero-q-help" className="mt-2 text-xs text-muted">
            Check any website in seconds. Free, no signup.
          </p>
        )}
      </div>
  </form>
  );
}
