"use client";

import { useState } from "react";

/** Shows a value with a Copy button (no mailto: replies happen from the team inbox). */
export function CopyText({ value, label = "Copy" }: { value: string; label?: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("ok");
    } catch {
      setState("fail");
    }
    setTimeout(() => setState("idle"), 1800);
  }
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-2">
      <span className="min-w-0 select-all break-all font-mono text-sm text-ink">{value}</span>
      <button type="button" onClick={copy} className="shrink-0 border border-rule px-2 py-0.5 text-xs font-medium text-ink hover:border-accent hover:text-accent">
        {state === "ok" ? "Copied" : state === "fail" ? "Select it" : label}
      </button>
    </span>
  );
}
