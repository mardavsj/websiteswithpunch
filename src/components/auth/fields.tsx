"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { PASSWORD_MIN } from "@/lib/password-rules";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailError(email: string): string | undefined {
  const v = email.trim();
  if (!v) return "Enter your email address.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address, like you@company.com.";
  return undefined;
}

export function newPasswordErrors(password: string, confirm: string) {
  return {
    password:
      password.length < PASSWORD_MIN ? `Use at least ${PASSWORD_MIN} characters.` : undefined,
    confirm: !confirm
      ? "Confirm your password."
      : confirm !== password
        ? "Passwords don't match."
        : undefined,
  };
}

const inputBase =
  "block w-full rounded-none border bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 outline-none transition focus:ring-2 disabled:opacity-60";
const inputTone = (error?: string) =>
  error
    ? "border-danger focus:border-danger focus:ring-danger/20"
    : "border-rule focus:border-accent focus:ring-accent/20";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  aside?: ReactNode;
};

function FieldFrame({ id, label, error, hint, aside, children }: Omit<FieldProps, "children"> & { children: ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {aside}
      </div>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <div id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

export function TextField({ id, label, error, hint, aside, className = "", ...input }: FieldProps) {
  return (
    <FieldFrame id={id} label={label} error={error} hint={hint} aside={aside}>
      <input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${inputBase} ${inputTone(error)} ${className}`}
        {...input}
      />
    </FieldFrame>
  );
}

export function PasswordField({ id, label, error, hint, aside, className = "", ...input }: FieldProps) {
  const [shown, setShown] = useState(false);
  return (
    <FieldFrame id={id} label={label} error={error} hint={hint} aside={aside}>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={shown ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={`${inputBase} ${inputTone(error)} pr-16 ${className}`}
          {...input}
        />
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          aria-controls={id}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-muted hover:text-ink focus-visible:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40"
        >
          {shown ? "Hide" : "Show"}
        </button>
      </div>
    </FieldFrame>
  );
}

/** Rough guide only; the one hard rule is the minimum length. */
function strength(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length < PASSWORD_MIN) return 0;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (pw.length >= 12 && kinds >= 3) return 3;
  if (pw.length >= 10 || kinds >= 3) return 2;
  return 1;
}

const LEVELS = [
  { label: "Too short", bar: "bg-rule", text: "text-muted" },
  { label: "Weak", bar: "bg-rose-500", text: "text-rose-700 dark:text-rose-300" },
  { label: "Good", bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
  { label: "Strong", bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
];

export function PasswordHint({ password }: { password: string }) {
  const level = strength(password);
  const meetsMin = password.length >= PASSWORD_MIN;
  return (
    <div aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-1 flex-1 ${level >= i ? LEVELS[level].bar : "bg-rule"}`} />
        ))}
      </div>
      <p className="mt-1.5 flex justify-between gap-3">
        <span className={meetsMin ? "text-emerald-700 dark:text-emerald-300" : ""}>
          {meetsMin ? "✓ " : ""}At least {PASSWORD_MIN} characters
        </span>
        {password ? <span className={LEVELS[level].text}>{LEVELS[level].label}</span> : null}
      </p>
    </div>
  );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="flex w-full items-center justify-center gap-2 rounded-none bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
      ) : null}
      {children}
    </button>
  );
}

export const authLink = "font-medium text-accent hover:underline focus-visible:underline focus-visible:outline-none";
