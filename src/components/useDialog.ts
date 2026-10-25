"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,summary,[tabindex]:not([tabindex="-1"])';

/**
 * Shared modal behaviour: locks body scroll, moves focus inside, traps Tab, closes on Esc and
 * gives focus back to whatever opened it.
 */
export function useDialog(getEl: () => HTMLElement | null, open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const getRef = useRef(getEl);
  getRef.current = getEl;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      const el = getRef.current();
      if (el && !el.contains(document.activeElement)) el.focus();
    }, 0);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // A confirm dialog opened inside this one handles its own Esc first.
        const el0 = getRef.current();
        if (el0 && el0.querySelector('[role="dialog"], [role="alertdialog"], .fixed.inset-0')) return;
        e.preventDefault();
        closeRef.current();
        return;
      }
      const el = getRef.current();
      if (e.key !== "Tab" || !el) return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent);
      if (!items.length) return e.preventDefault();
      const first = items[0];
      const last = items[items.length - 1];
      const a = document.activeElement;
      if (!el.contains(a)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (a === first || a === el)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && a === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);
}
