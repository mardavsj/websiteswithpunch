"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

export type KeepSiteOption = {
  id: string;
  name: string;
  url: string;
  createdAt: string;
};

type Props = {
  open: boolean;
  title: string;
  maxKeep: number;
  sites: KeepSiteOption[];
  initialSelected?: string[];
  confirmLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (siteIds: string[]) => void;
  confirmDetail?: (selected: KeepSiteOption[], locked: KeepSiteOption[]) => ReactNode;
};

export function KeepSitesPicker({
  open,
  title,
  maxKeep,
  sites,
  initialSelected,
  confirmLabel = "Continue",
  loading,
  onClose,
  onConfirm,
  confirmDetail,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"pick" | "confirm">("pick");

  useEffect(() => {
    if (!open) return;
    setStep("pick");
    const init = initialSelected?.length
      ? initialSelected.slice(0, maxKeep)
      : sites.slice(0, maxKeep).map((s) => s.id);
    setSelected(new Set(init));
  }, [open, maxKeep, sites, initialSelected]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const selectedSites = useMemo(
    () => sites.filter((s) => selected.has(s.id)),
    [sites, selected],
  );
  const lockedSites = useMemo(
    () => sites.filter((s) => !selected.has(s.id)),
    [sites, selected],
  );

  if (!open) return null;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < maxKeep) next.add(id);
      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-none border border-rule bg-bg p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "pick" ? (
          <>
            <h2 className="font-display text-xl font-medium text-ink">{title}</h2>
            <p className="mt-2 text-sm text-muted">
              Your new plan includes {maxKeep} site{maxKeep === 1 ? "" : "s"}. Choose which ones stay
              active.
            </p>
            <p className="mt-1 text-sm font-medium text-ink">
              {selected.size} of {maxKeep} selected
            </p>
            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto border border-rule p-2">
              {sites.map((s) => {
                const checked = selected.has(s.id);
                const disabled = !checked && selected.size >= maxKeep;
                return (
                  <li key={s.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 px-2 py-2 text-sm ${
                        disabled ? "opacity-50" : "hover:bg-accent-soft"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggle(s.id)}
                      />
                      <span>
                        <span className="font-medium text-ink">{s.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted">{s.url}</span>
                        <span className="block text-[10px] text-muted">
                          Added{" "}
                          {new Date(s.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={selected.size !== maxKeep}
                onClick={() => (confirmDetail ? setStep("confirm") : onConfirm([...selected]))}
                className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {confirmDetail ? "Continue" : confirmLabel}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-none border border-rule px-4 py-2 text-sm text-ink hover:bg-accent-soft"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-xl font-medium text-ink">Confirm</h2>
            <div className="mt-3 text-sm leading-relaxed text-muted">
              {confirmDetail?.(selectedSites, lockedSites)}
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => onConfirm([...selected])}
                className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {loading ? "Working…" : confirmLabel}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep("pick")}
                className="rounded-none border border-rule px-4 py-2 text-sm text-ink hover:bg-accent-soft"
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
