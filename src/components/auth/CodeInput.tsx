"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

export const CODE_LENGTH = 6;

/**
 * Six single-digit boxes: typing advances, Backspace steps back, arrows move, and pasting or
 * iOS/Android one-time-code autofill (any box) spreads the digits. Calls onComplete when full.
 */
export function CodeInput({
  digits,
  onChange,
  onComplete,
  disabled,
  invalid,
  describedBy,
}: {
  digits: string[];
  onChange: (next: string[]) => void;
  onComplete: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const focus = (i: number) => refs.current[Math.max(0, Math.min(CODE_LENGTH - 1, i))]?.focus();

  function fill(from: number, raw: string) {
    const chars = raw.replace(/\D/g, "").split("");
    if (chars.length === 0) return;
    const next = [...digits];
    let i = chars.length >= CODE_LENGTH ? 0 : from; // a full code always fills from the start
    for (const c of chars.slice(0, CODE_LENGTH)) {
      if (i >= CODE_LENGTH) break;
      next[i++] = c;
    }
    onChange(next);
    if (next.every(Boolean)) {
      refs.current[CODE_LENGTH - 1]?.blur();
      onComplete(next.join(""));
    } else focus(i);
  }

  function onType(i: number, v: string) {
    if (!v.replace(/\D/g, "")) {
      const next = [...digits];
      next[i] = "";
      return onChange(next);
    }
    // Typing over a filled box: keep only the new digit.
    if (digits[i] && v.length === 2) v = v[0] === digits[i] ? v[1] : v[0];
    fill(i, v);
  }

  function onKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[i]) next[i] = "";
      else if (i > 0) {
        next[i - 1] = "";
        focus(i - 1);
      }
      onChange(next);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focus(i + 1);
    }
  }

  function onPaste(i: number, e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    fill(i, e.clipboardData.getData("text"));
  }

  const tone = invalid
    ? "border-danger focus:border-danger focus:ring-danger/20"
    : "border-rule focus:border-accent focus:ring-accent/20";

  return (
    <div className="grid grid-cols-6 gap-2 sm:gap-3" role="group" aria-label="6-digit code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          onChange={(e) => onType(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onPaste={(e) => onPaste(i, e)}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={i === 0}
          placeholder="·"
          aria-label={`Digit ${i + 1} of ${CODE_LENGTH}`}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          className={`h-12 w-full min-w-0 rounded-none border bg-bg text-center font-mono text-xl font-semibold text-ink outline-none transition placeholder:text-muted/60 focus:ring-2 disabled:opacity-60 sm:h-14 sm:text-2xl ${tone}`}
        />
      ))}
    </div>
  );
}
