"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import type { HeroCheck } from "./run-check";

type Logic = typeof import("./run-check");
type Ui = typeof import("./HeroResult");

type HeroCheckCtx = {
  open: boolean;
  loading: boolean;
  query: string;
  result: HeroCheck | null;
  formError: string | null;
  ui: Ui | null;
  inputRef: RefObject<HTMLInputElement>;
  submit: (raw: string) => void;
  close: () => void;
  clearError: () => void;
  setResult: (r: HeroCheck) => void;
  preload: () => void;
};

const Ctx = createContext<HeroCheckCtx | null>(null);

export function useHeroCheck() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useHeroCheck outside HeroCheckProvider");
  return c;
}

/** The checker's code (URL rules, fetches, card, prompt) loads on first focus or submit, not with the page. */
let loading: Promise<[Logic, Ui]> | null = null;
const load = () => (loading ??= Promise.all([import("./run-check"), import("./HeroResult")]).catch((e) => {
  loading = null;
  throw e;
}));

/** Shares the hero checker's state between the form (left column) and the result card (below the row). */
export function HeroCheckProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<HeroCheck | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [ui, setUi] = useState<Ui | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  const submit = useCallback(async (raw: string) => {
    const v = raw.trim();
    const fail = (msg: string) => {
      setFormError(msg);
      inputRef.current?.focus();
    };
    if (!v) return fail("Enter a website, e.g. example.com.");
    const id = ++seq.current;
    setBusy(true);
    setFormError(null);
    try {
      const [logic, mod] = await load();
      setUi(() => mod);
      if (id !== seq.current) return;
      const invalid = logic.validateSite(v);
      if (invalid) return fail(invalid);
      setQuery(v);
      setResult(null);
      setOpen(true);
      const r = await logic.runCheck(v);
      if (id === seq.current) setResult(r);
    } catch (e) {
      if (id !== seq.current) return;
      setOpen(false);
      fail(e instanceof Error && e.name === "CheckError" ? e.message : "The checker couldn't load. Refresh the page and try again.");
    } finally {
      if (id === seq.current) setBusy(false);
    }
  }, []);

  const close = useCallback(() => {
    seq.current++;
    setBusy(false);
    setOpen(false);
    inputRef.current?.focus();
  }, []);

  const value = useMemo<HeroCheckCtx>(
    () => ({
      open,
      loading: busy,
      query,
      result,
      formError,
      ui,
      inputRef,
      submit: (raw) => void submit(raw),
      close,
      clearError: () => setFormError(null),
      setResult,
      preload: () => void load().then(([, mod]) => setUi(() => mod)).catch(() => undefined),
    }),
    [open, busy, query, result, formError, ui, submit, close],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
