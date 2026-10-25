"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

/** Admin account dropdown: who you are + Sign out. No plans, upgrades or referrals here. */
export function AdminMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); window.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title="Account"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rule bg-accent-soft text-sm font-medium text-ink hover:bg-bg"
      >
        {email.charAt(0).toUpperCase()}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-56 max-w-[calc(100vw-2rem)] border border-rule bg-surface py-1 shadow-lg">
          <p className="truncate px-3 py-2 text-xs text-muted">{email}</p>
          <button
            role="menuitem"
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex min-h-11 w-full items-center border-t border-rule px-3 text-left text-sm text-ink hover:bg-accent-soft focus:bg-accent-soft md:min-h-0 md:py-2"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
