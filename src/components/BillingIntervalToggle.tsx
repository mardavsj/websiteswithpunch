"use client";

import type { KeyboardEvent } from "react";
import type { BillingInterval } from "@/lib/billing-interval";

const options: { value: BillingInterval; label: string }[] = [
  { value: "month", label: "Monthly" },
  { value: "year", label: "Annual" },
];

/**
 * Monthly / Annual segmented control (radiogroup; arrow keys switch). Both segments keep a fixed
 * size in either state, so toggling never shifts the layout around it.
 */
export function BillingIntervalToggle({
  value,
  onChange,
  disabled = false,
  className = "",
}: {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
  disabled?: boolean;
  className?: string;
}) {
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const next: BillingInterval = value === "month" ? "year" : "month";
    onChange(next);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next}"]`)?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Billing interval"
      onKeyDown={onKeyDown}
      className={`inline-flex shrink-0 border border-rule bg-surface p-1 ${className}`}
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            data-value={o.value}
            tabIndex={on ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={`inline-flex h-9 items-center gap-2 whitespace-nowrap px-3.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-60 sm:px-4 ${
              on ? "bg-solid text-solid-fg" : "text-muted hover:text-ink"
            }`}
          >
            {o.label}
            {o.value === "year" && (
              <span
                className={`px-1.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.06em] ${
                  on ? "bg-accent text-white" : "bg-accent-soft text-accent-hover dark:text-accent"
                }`}
              >
                2 months free
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
