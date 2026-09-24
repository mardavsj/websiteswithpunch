"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function GuestMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="Open menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title="Menu"
        className="inline-flex h-8 w-8 items-center justify-center rounded-none border border-rule text-ink hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-48 border border-rule bg-surface py-1 shadow-lg"
        >
          <Link
            role="menuitem"
            href="/login"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-ink hover:bg-accent-soft focus:bg-accent-soft"
          >
            Log in
          </Link>
          <div className="my-1 border-t border-rule" role="separator" />
          <Link
            role="menuitem"
            href="/signup"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-accent hover:bg-accent-soft focus:bg-accent-soft"
          >
            Start free
          </Link>
        </div>
      )}
    </div>
  );
}
