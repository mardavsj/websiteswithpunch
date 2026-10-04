"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ToolResult, ToolResultSkeleton, type ToolKind } from "./ToolResult";

const API: Record<ToolKind, string> = { ssl: "/api/tools/ssl", domain: "/api/tools/domain", down: "/api/tools/down" };

type Props = { kind: ToolKind; label: string; placeholder: string; button: string };

/**
 * Public checker: one field, one button. The request is a GET so a repeat lookup can be served
 * from cache; ?q= in the address bar pre-fills and runs the check (shareable links).
 */
export function ToolForm({ kind, label, placeholder, button }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const seq = useRef(0);

  async function run(q: string) {
    const v = q.trim();
    if (!v) return setError("Enter a domain, e.g. example.com.");
    const id = ++seq.current;
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API[kind]}?q=${encodeURIComponent(v)}`);
      const data = await res.json().catch(() => ({}));
      if (id !== seq.current) return;
      if (!res.ok) setError(typeof data.error === "string" ? data.error : "The check failed. Please try again.");
      else {
        setResult(data);
        const url = new URL(window.location.href);
        url.searchParams.set("q", v);
        window.history.replaceState(null, "", url);
      }
    } catch {
      if (id === seq.current) setError("Network error. Check your connection and try again.");
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      setValue(q.slice(0, 300));
      void run(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    void run(value);
  }

  const id = `tool-${kind}`;
  return (
    <div>
      <form onSubmit={submit} noValidate>
        <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id={id}
            name="q"
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`block w-full min-w-0 flex-1 rounded-none border bg-bg px-3 py-3 text-base text-ink placeholder:text-muted/70 outline-none transition focus:ring-2 ${
              error ? "border-danger focus:ring-danger/20" : "border-rule focus:border-accent focus:ring-accent/20"
            }`}
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 bg-accent px-6 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-80"
          >
            {loading && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {loading ? "Checking…" : button}
          </button>
        </div>
        {error && (
          <p id={`${id}-error`} role="alert" className="mt-2 text-sm font-medium text-danger">{error}</p>
        )}
      </form>
      <div aria-live="polite">
        {loading && <ToolResultSkeleton />}
        {result && <ToolResult kind={kind} data={result} />}
      </div>
    </div>
  );
}
