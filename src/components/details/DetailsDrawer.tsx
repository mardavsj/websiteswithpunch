"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { ModalPortal } from "@/components/ModalPortal";

type Props = { open: boolean; title: string; subtitle?: string; icon?: ReactNode; onClose: () => void; children: ReactNode };

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

/**
 * Side sheet for an analytics section's full details: slides from the right on wider screens and
 * is a bottom sheet on phones. Esc or the overlay closes it; focus stays inside while open and
 * returns to the Details button on close.
 */
export function DetailsDrawer({ open, title, subtitle, icon, onClose, children }: Props) {
  const panel = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // The sheet mounts a tick after `open` (portal), so focus it when the node appears.
  const attach = useCallback((el: HTMLDivElement | null) => {
    panel.current = el;
    if (el && !el.contains(document.activeElement)) el.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent);
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-solid/30" onClick={onClose} role="presentation">
        <div
          ref={attach}
          role="dialog"
          aria-modal="true"
          aria-labelledby="details-drawer-title"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          className="details-sheet absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col border-t border-rule bg-bg shadow-2xl outline-none sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[480px] sm:border-l sm:border-t-0"
        >
          <div className="mx-auto mt-2 h-1 w-10 bg-ink/15 sm:hidden" aria-hidden />
          <div className="flex items-center gap-3 border-b border-rule bg-surface px-5 py-3.5">
            {icon && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-accent-soft text-accent ring-1 ring-inset ring-accent/20">
                {icon}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 id="details-drawer-title" className="truncate font-display text-lg font-medium leading-6 text-ink">
                {title}
              </h2>
              {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="-mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">{children}</div>
        </div>
      </div>
    </ModalPortal>
  );
}
