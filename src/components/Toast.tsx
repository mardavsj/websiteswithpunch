"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "error" | "success" | "info";

type ToastItem = {
  id: number;
  message: string;
  kind: ToastKind;
};

type ToastContextValue = {
  toast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let idSeq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "error") => {
    const id = ++idSeq;
    setItems((prev) => [...prev, { id, message, kind }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[min(100%-2rem,22rem)] flex-col gap-2"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={
              t.kind === "success"
                ? "pointer-events-auto border border-emerald-200 bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-400/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100 shadow-md"
                : t.kind === "info"
                  ? "pointer-events-auto border border-rule bg-surface px-4 py-3 text-sm text-ink shadow-md"
                  : "pointer-events-auto border border-rose-200 bg-rose-50 dark:border-rose-400/30 dark:bg-rose-400/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200 shadow-md"
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
