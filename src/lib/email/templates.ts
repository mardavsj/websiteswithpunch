/** Subjects, HTML and plain text for each transactional email. */
import { C, escapeHtml, renderEmail, renderText } from "./layout";
import { topicLabel, type ContactInput } from "@/lib/contact";
import { SITE_URL } from "@/lib/site-config";

export type BuiltEmail = { subject: string; html: string; text: string };

const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();
const hello = (name?: string | null) => (name?.trim() ? `Hi ${oneLine(name).slice(0, 80)},` : "Hi,");
const SAFETY = "Didn't request this? You can ignore this email. The account can't be confirmed without this code.";

export function verificationCodeEmail(code: string, name?: string | null, minutes = 10): BuiltEmail {
  const subject = `${code} is your Websites With Punch code`;
  const reason = "You're receiving this because this address was used to sign up or log in at websiteswithpunch.com.";
  return {
    subject,
    html: renderEmail({
      title: subject,
      preheader: `Your verification code is ${code}. It expires in ${minutes} minutes.`,
      heading: "Confirm your email",
      intro: [escapeHtml(hello(name)), "Enter this code on the verification page to finish setting up your account:"],
      code,
      notes: [`This code expires in ${minutes} minutes and works once.`, SAFETY],
      reason,
    }),
    text: renderText([
      hello(name),
      "Enter this code on the verification page to finish setting up your account:",
      code,
      `This code expires in ${minutes} minutes and works once.`,
      SAFETY,
      reason,
    ]),
  };
}

export function resetPasswordEmail(link: string, name?: string | null): BuiltEmail {
  const subject = "Reset your Websites With Punch password";
  const reason = "You're receiving this because a password reset was requested for this address at websiteswithpunch.com.";
  const safety = "Didn't ask for this? Ignore this email and your password stays the same.";
  return {
    subject,
    html: renderEmail({
      title: subject,
      preheader: "Use this link to choose a new password. It expires in 1 hour.",
      heading: "Reset your password",
      intro: [escapeHtml(hello(name)), "We received a request to reset the password for your account. Choose a new one here:"],
      button: { label: "Reset password", url: link },
      notes: [
        "This link expires in 1 hour and can be used once.",
        safety,
        `If the button doesn't work, paste this link into your browser:<br><a class="wwp-link" href="${escapeHtml(link)}" style="color:${C.accent};word-break:break-all">${escapeHtml(link)}</a>`,
      ],
      reason,
    }),
    text: renderText([
      hello(name),
      "We received a request to reset the password for your account. Choose a new one here:",
      link,
      "This link expires in 1 hour and can be used once.",
      safety,
      reason,
    ]),
  };
}

export function passwordChangedEmail(name?: string | null, when = new Date()): BuiltEmail {
  const subject = "Your Websites With Punch password was changed";
  const at = when.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) + " IST";
  const resetUrl = `${SITE_URL}/forgot-password`;
  const reason = "You're receiving this because the password for this account was changed.";
  const warn = "If this wasn't you, reset your password right away and contact us.";
  return {
    subject,
    html: renderEmail({
      title: subject,
      preheader: `Your password was changed on ${at}.`,
      heading: "Your password was changed",
      intro: [escapeHtml(hello(name)), `The password for your Websites With Punch account was changed on <strong>${escapeHtml(at)}</strong>.`],
      button: { label: "Reset password", url: resetUrl },
      notes: [warn, "If you made this change, no action is needed."],
      reason,
    }),
    text: renderText([hello(name), `The password for your Websites With Punch account was changed on ${at}.`, warn, `Reset your password: ${resetUrl}`, reason]),
  };
}

export function contactNotificationEmail(input: ContactInput & { userId?: string | null; id: string }): BuiltEmail {
  const topic = topicLabel(input.topic);
  const name = oneLine(input.name);
  const subject = `[Contact] ${topic} from ${name}`;
  const rows: Array<[string, string]> = [
    ["From", `${name} <${input.email}>`],
    ["Topic", topic],
    ["Account", input.userId ? `user ${input.userId}` : "not logged in"],
    ["Reference", input.id],
  ];
  const cell = `font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-size:13px;line-height:20px;padding:6px 0;vertical-align:top`;
  const table = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px">${rows
    .map(([k, v]) => `<tr><td class="wwp-muted" width="90" style="${cell};color:${C.muted}">${k}</td><td class="wwp-ink" style="${cell};color:${C.ink};word-break:break-word">${escapeHtml(v)}</td></tr>`)
    .join("")}</table>`;
  const msg = `<div class="wwp-ink wwp-rule" style="border-top:1px solid ${C.rule};padding-top:16px;margin-bottom:16px;white-space:pre-wrap;font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-size:15px;line-height:24px;color:${C.ink}">${escapeHtml(input.message)}</div>`;
  return {
    subject,
    html: renderEmail({
      title: subject,
      preheader: `${topic}: ${oneLine(input.message).slice(0, 90)}`,
      heading: `New message: ${topic}`,
      intro: [],
      extra: table + msg,
      notes: ["Reply to this email to answer the sender directly."],
      reason: "Sent from the contact form at websiteswithpunch.com/contact.",
    }),
    text: `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${input.message}\n\n(Reply to this email to answer the sender directly.)\n`,
  };
}
