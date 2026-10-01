/** Sends a contact-form message to the team via the Resend HTTP API (no SDK). */
import { topicLabel, type ContactInput } from "./contact";

const DEFAULT_FROM = "Websites With Punch <contact@websiteswithpunch.com>";
const DEFAULT_TO = "hello@websiteswithpunch.com";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strip CR/LF so a name can't break the subject line. */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

export function buildContactEmail(input: ContactInput & { userId?: string | null; id: string }) {
  const topic = topicLabel(input.topic);
  const subject = `[Contact] ${topic} from ${oneLine(input.name)}`;
  const meta = [
    `From: ${oneLine(input.name)} <${input.email}>`,
    `Topic: ${topic}`,
    `Account: ${input.userId ? `user ${input.userId}` : "not logged in"}`,
    `Reference: ${input.id}`,
  ];
  const text = `${meta.join("\n")}\n\n${input.message}\n`;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:#0b0f17">
<p style="margin:0 0 12px;color:#5b6270">${meta.map(escapeHtml).join("<br>")}</p>
<div style="white-space:pre-wrap;border-top:1px solid #e3e3df;padding-top:12px">${escapeHtml(input.message)}</div>
</div>`;
  return { subject, text, html };
}

export type SendResult = { sent: true } | { sent: false; reason: string };

export async function sendContactEmail(
  input: ContactInput & { userId?: string | null; id: string },
): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const { subject, text, html } = buildContactEmail(input);
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[contact] RESEND_API_KEY not set; message saved only.\n${subject}\n${text}`);
    }
    return { sent: false, reason: "RESEND_API_KEY not set" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
        to: [process.env.CONTACT_TO_EMAIL || DEFAULT_TO],
        reply_to: input.email,
        subject,
        text,
        html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { sent: false, reason: `Resend ${res.status}: ${(await res.text()).slice(0, 300)}` };
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
