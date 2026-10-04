"use client";

import { useState, type FormEvent } from "react";

const BTN =
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap px-2 text-[13px] font-medium sm:text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * One field, three destinations: each button posts the domain (GET ?q=) to its tool page, which
 * runs the check on load. Plain HTML form, so it also works before JavaScript loads.
 */
export function QuickStart() {
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent<HTMLFormElement>) {
    const q = new FormData(e.currentTarget).get("q");
    if (typeof q !== "string" || !q.trim()) {
      e.preventDefault();
      setError("Enter a domain, e.g. example.com.");
    }
  }

  return (
    <form method="get" action="/tools/ssl-checker" onSubmit={submit} noValidate>
      <label htmlFor="quick-q" className="text-sm font-medium text-ink">
        Domain or website
      </label>
      <input
        id="quick-q"
        name="q"
        type="text"
        inputMode="url"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="example.com"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "quick-q-error" : undefined}
        onChange={() => error && setError(null)}
        className={`mt-2 block w-full rounded-none border bg-bg px-3 py-3 text-base text-ink outline-none transition placeholder:text-muted/70 focus:ring-2 ${
          error ? "border-danger focus:ring-danger/20" : "border-rule focus:border-accent focus:ring-accent/20"
        }`}
      />
      {error && (
        <p id="quick-q-error" role="alert" className="mt-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <p className="mt-4 text-xs text-muted">Then pick a check:</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <button type="submit" formAction="/tools/ssl-checker" className={`${BTN} bg-accent text-white hover:bg-accent-hover`}>
          Check SSL
        </button>
        <button type="submit" formAction="/tools/domain-expiry-checker" className={`${BTN} border border-rule bg-bg text-ink hover:bg-accent-soft`}>
          Domain expiry
        </button>
        <button type="submit" formAction="/tools/website-down-checker" className={`${BTN} border border-rule bg-bg text-ink hover:bg-accent-soft`}>
          Is it down?
        </button>
      </div>
    </form>
  );
}
