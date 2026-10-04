/** One Resend HTTP call for every transactional email (no SDK). */
export type SendResult = { sent: true } | { sent: false; reason: string };

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
  /** Short label for dev logs, e.g. "verify". */
  tag: string;
};

const DEFAULT_FROM = "Websites With Punch <hello@websiteswithpunch.com>";

export function authFromEmail(): string {
  return process.env.AUTH_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM;
}

/**
 * Sends through Resend. Without RESEND_API_KEY nothing is sent; outside production the text
 * version is logged so codes and links can be used locally. RESEND_API_URL exists only so tests
 * can point at a local mock; leave it unset in production.
 */
export async function sendEmail(mail: OutgoingEmail): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email:${mail.tag}] RESEND_API_KEY not set. To ${mail.to}: ${mail.subject}\n${mail.text}`);
    }
    return { sent: false, reason: "RESEND_API_KEY not set" };
  }
  try {
    const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: mail.from || authFromEmail(),
        to: [mail.to],
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { sent: false, reason: `Resend ${res.status}: ${(await res.text()).slice(0, 300)}` };
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
