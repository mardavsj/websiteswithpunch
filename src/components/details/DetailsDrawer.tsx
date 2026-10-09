"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { ModalPortal } from "@/components/ModalPortal";

type Props = { open: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode };

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

/**
 * Side sheet for an analytics section's full details: slides from the right on wider screens and
 * is a bottom sheet on phones. Esc or the overlay closes it; focus stays inside while open and
 * returns to the Details button on close.
 */
export function DetailsDrawer({ open, title, subtitle, onClose, children }: Props) {
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
          className="details-sheet absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col border-t border-rule bg-surface shadow-lg outline-none sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[440px] sm:border-l sm:border-t-0"
        >
          <div className="flex items-start justify-between gap-3 border-b border-rule px-5 py-4">
            <div className="min-w-0">
              <h2 id="details-drawer-title" className="font-display text-lg font-medium text-ink">
                {title}
              </h2>
              {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="-mr-1 shrink-0 px-2 py-1 text-lg leading-none text-muted hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              ×
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        </div>
      </div>
    </ModalPortal>
  );
}
