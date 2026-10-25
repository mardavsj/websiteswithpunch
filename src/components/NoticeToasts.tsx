"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Notice = { key: string; text: string };

const LIFE_MS = 8000;
const storeKey = (scope: string) => `wwp:notices:${scope}`;

function readDismissed(scope: string): string[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(storeKey(scope)) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Info toasts for one scope (a site). `push` shows a notice unless the user closed that
 * notice earlier this session. Dismissals live in sessionStorage, read only after mount.
 */
export function useNoticeToasts(scope: string) {
  const [items, setItems] = useState<Notice[]>([]);
  const dismissed = useRef<Set<string>>(new Set());
  useEffect(() => {
    dismissed.current = new Set(readDismissed(scope));
    setItems([]);
  }, [scope]);

  const push = useCallback((n: Notice) => {
    if (dismissed.current.has(n.key)) return;
    setItems((prev) => [...prev.filter((p) => p.key !== n.key), n].slice(-3));
  }, []);

  const drop = useCallback((key: string) => setItems((prev) => prev.filter((p) => p.key !== key)), []);

  const close = useCallback(
    (key: string) => {
      dismissed.current.add(key);
      try {
        sessionStorage.setItem(storeKey(scope), JSON.stringify([...dismissed.current]));
      } catch {
        /* storage off: still closes */
      }
      drop(key);
    },
    [scope, drop]
  );

  const view = <NoticeStack items={items} onExpire={drop} onClose={close} />;
  return { push, view };
}

function NoticeStack({ items, onExpire, onClose }: { items: Notice[]; onExpire: (k: string) => void; onClose: (k: string) => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-[190] flex flex-col gap-2 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[22rem]"
    >
      {items.map((n) => (
        <NoticeToast key={n.key} n={n} onExpire={onExpire} onClose={onClose} />
      ))}
    </div>
  );
}

function NoticeToast({ n, onExpire, onClose }: { n: Notice; onExpire: (k: string) => void; onClose: (k: string) => void }) {
  const [paused, setPaused] = useState(false);
  const left = useRef(LIFE_MS);
  useEffect(() => {
    if (paused) return;
    const start = Date.now();
    const t = setTimeout(() => onExpire(n.key), left.current);
    return () => {
      clearTimeout(t);
      left.current = Math.max(800, left.current - (Date.now() - start));
    };
  }, [paused, n.key, onExpire]);
  return (
    <div
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="toast-in pointer-events-auto relative flex items-start gap-3 border border-rule bg-surface py-3 pl-5 pr-4 text-sm text-ink shadow-md"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-accent" />
      <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="mt-0.5 h-4 w-4 shrink-0 text-accent">
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 9v4.5M10 6.5v.01" strokeLinecap="round" />
      </svg>
      <p className="min-w-0 flex-1 leading-relaxed">{n.text}</p>
      <button
        type="button"
        onClick={() => onClose(n.key)}
        aria-label="Dismiss notice"
        className="-m-1 shrink-0 p-1 text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>
    </div>
  );
}
