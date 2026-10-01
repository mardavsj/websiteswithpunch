"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CONTACT_TOPICS,
  MESSAGE_MAX,
  contactHref,
  parseTopic,
  validateContact,
  type ContactErrors,
} from "@/lib/contact";

type Field = keyof ContactErrors;
const ORDER: Field[] = ["name", "email", "topic", "message"];

const inputBase =
  "mt-1.5 w-full rounded-none border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted/70 outline-none focus:ring-2";
const inputClass = (bad: boolean) =>
  `${inputBase} ${bad ? "border-danger focus:border-danger focus:ring-danger/20" : "border-rule focus:border-accent focus:ring-accent/20"}`;

export function ContactForm({ initialName, initialEmail }: { initialName: string; initialEmail: string }) {
  const signedIn = useSession().status === "authenticated";
  // The topic always follows the link: ?topic= is read on every navigation, including clicks
  // made while already on /contact (the page stays mounted then, so state alone would go stale).
  const urlTopic = parseTopic(useSearchParams().get("topic"));
  const [values, setValues] = useState({
    name: initialName,
    email: initialEmail,
    topic: urlTopic as string,
    message: "",
    company: "",
  });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setValues((v) => ({ ...v, topic: urlTopic }));
    setErrors((e) => ({ ...e, topic: undefined }));
    setSentTo(null);
  }, [urlTopic]);

  /** Keep the URL in step with the select, so following any topic link changes it back. */
  function pickTopic(topic: string) {
    set("topic", topic);
    window.history.replaceState(null, "", contactHref(parseTopic(topic)));
  }

  function set(field: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (field in errors) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function showErrors(next: ContactErrors) {
    setErrors(next);
    const first = ORDER.find((f) => next[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const check = validateContact(values);
    if (!check.ok) return showErrors(check.errors);
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...check.data, company: values.company }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.errors) showErrors(data.errors);
        setFormError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSentTo(check.data.email);
    } catch {
      setFormError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="self-start border border-rule bg-surface p-6 sm:p-8" role="status">
        <p className="label-caps !text-accent">Message sent</p>
        <h2 className="mt-3 font-display text-2xl font-medium text-ink">Thanks, we&apos;ve got it.</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We&apos;ll reply to <span className="font-medium text-ink">{sentTo}</span>. We aim to
          get back to you within 1–2 business days.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={signedIn ? "/dashboard" : "/"}
            className="bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            {signedIn ? "Back to dashboard" : "Back to home"}
          </Link>
          <button
            type="button"
            onClick={() => {
              setValues((v) => ({ ...v, message: "", company: "" }));
              setSentTo(null);
            }}
            className="border border-rule px-4 py-2 text-sm text-ink hover:bg-accent-soft"
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  const err = (f: Field) =>
    errors[f] ? (
      <p id={`${f}-error`} className="mt-1.5 text-sm text-danger">
        {errors[f]}
      </p>
    ) : null;
  const aria = (f: Field) => ({
    "aria-invalid": Boolean(errors[f]),
    "aria-describedby": errors[f] ? `${f}-error` : undefined,
  });

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="relative self-start space-y-5 border border-rule bg-surface p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-ink">Name</label>
          <input id="name" name="name" autoComplete="name" placeholder="Alex Morgan" value={values.name}
            onChange={(e) => set("name", e.target.value)} className={inputClass(!!errors.name)} {...aria("name")} />
          {err("name")}
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-ink">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" value={values.email}
            onChange={(e) => set("email", e.target.value)} className={inputClass(!!errors.email)} {...aria("email")} />
          {err("email")}
        </div>
      </div>
      <div>
        <label htmlFor="topic" className="text-sm font-medium text-ink">Topic</label>
        <select id="topic" name="topic" value={values.topic} onChange={(e) => pickTopic(e.target.value)}
          className={inputClass(!!errors.topic)} {...aria("topic")}>
          {CONTACT_TOPICS.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        {err("topic")}
      </div>
      <div>
        <label htmlFor="message" className="text-sm font-medium text-ink">Message</label>
        <textarea id="message" name="message" rows={7} maxLength={MESSAGE_MAX} value={values.message}
          placeholder="How can we help? Include your site URL if it's about a specific site."
          onChange={(e) => set("message", e.target.value)}
          className={`${inputClass(!!errors.message)} resize-y`} {...aria("message")} />
        <div className="flex items-start justify-between gap-3">
          <div>{err("message")}</div>
          <p className="mt-1.5 shrink-0 text-xs tabular-nums text-muted">
            {values.message.trim().length}/{MESSAGE_MAX}
          </p>
        </div>
      </div>
      {/* Honeypot: hidden from people and screen readers; bots tend to fill it. */}
      <div aria-hidden className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" value={values.company}
          onChange={(e) => set("company", e.target.value)} />
      </div>
      {formError && <p className="text-sm text-danger" role="alert">{formError}</p>}
      <button type="submit" disabled={sending}
        className="w-full rounded-none bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60 sm:w-auto sm:px-6">
        {sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
