"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { DIALOG_SCROLL, ModalPortal } from "@/components/ModalPortal";
import { rememberPendingSite } from "@/lib/pending-site";

export type PromptKind = "analytics" | "edit" | "delete";

const COPY: Record<PromptKind, { title: string; lead: string }> = {
  analytics: {
    title: "Analytics need a free account",
    lead: "Analytics are built from a site's saved check history, so the site needs to be in an account first.",
  },
  edit: {
    title: "Save the site to edit it",
    lead: "This was a one-off check, so there's nothing to edit yet.",
  },
  delete: {
    title: "Nothing saved to delete",
    lead: "This was a one-off check. It isn't stored anywhere until you save it to an account.",
  },
};

/** Centred prompt (same frame as the dashboard modals) for card actions that need an account. */
export function AccountPrompt({
  kind,
  site,
  onClose,
}: {
  kind: PromptKind | null;
  site: { name: string; url: string };
  onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!kind) return;
    const back = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => box.current?.querySelector<HTMLElement>("a,button")?.focus(), 0);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !box.current) return;
      const items = [...box.current.querySelectorAll<HTMLElement>("a,button")];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      back?.focus({ preventScroll: true });
    };
  }, [kind, onClose]);

  if (!kind) return null;
  const { title, lead } = COPY[kind];
  const keep = () => rememberPendingSite(site);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-solid/40 p-4" onClick={onClose} role="presentation">
        <div
          ref={box}
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-prompt-title"
          aria-describedby="account-prompt-body"
          className={`${DIALOG_SCROLL} w-full max-w-lg rounded-none border border-rule bg-surface p-6 shadow-lg`}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="account-prompt-title" className="mb-4 font-display text-xl font-medium text-ink">
            {title}
          </h2>
          <div id="account-prompt-body" className="text-sm text-muted">
            <p>{lead}</p>
            <p className="mt-3">
              Create a free account to save <span className="font-medium text-ink">{site.name}</span> and get:
            </p>
            <ul className="mt-2 space-y-1.5">
              {["The site on your dashboard, with analytics and history", "Uptime, SSL and domain checks every day", "Free for one site, no card needed"].map((t) => (
                <li key={t} className="flex gap-2">
                  <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup" onClick={keep} className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
              Create free account
            </Link>
            <Link href="/login" onClick={keep} className="rounded-none border border-rule px-4 py-2 text-sm font-medium text-ink hover:bg-accent-soft">
              Log in
            </Link>
            <button type="button" onClick={onClose} className="rounded-none px-4 py-2 text-sm text-muted hover:text-ink sm:ml-auto">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
