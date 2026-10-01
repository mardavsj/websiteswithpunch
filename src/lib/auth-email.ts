/** Password reset email, sent through the Resend HTTP API (same pattern as contact-email). */
import { escapeHtml, type SendResult } from "./contact-email";

const DEFAULT_FROM = "Websites With Punch <hello@websiteswithpunch.com>";

export function authFromEmail(): string {
  return process.env.AUTH_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM;
}

export function appBaseUrl(): string {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export function resetLink(token: string): string {
  return `${appBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

export function buildResetEmail(link: string, name?: string | null) {
  const hello = name?.trim() ? `Hi ${name.trim().replace(/[\r\n]+/g, " ")},` : "Hi,";
  const subject = "Reset your Websites With Punch password";
  const text = `${hello}

We received a request to reset the password for your Websites With Punch account.

Reset your password: ${link}

This link expires in 1 hour and can be used once. If you didn't ask for this, you can ignore this email; your password won't change.

Websites With Punch
`;
  const safeLink = escapeHtml(link);
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f5f2">
<div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e3e3df;padding:28px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#0b0f17">
<p style="margin:0 0 20px;font-weight:600">Websites With Punch</p>
<p style="margin:0 0 12px">${escapeHtml(hello)}</p>
<p style="margin:0 0 20px">We received a request to reset the password for your account.</p>
<p style="margin:0 0 20px"><a href="${safeLink}" style="display:inline-block;background:#2873e8;color:#ffffff;text-decoration:none;font-weight:600;padding:10px 18px">Reset password</a></p>
<p style="margin:0 0 12px;color:#5b6270;font-size:13px">This link expires in 1 hour and can be used once. If you didn't ask for this, ignore this email; your password won't change.</p>
<p style="margin:0;color:#5b6270;font-size:12px;word-break:break-all">If the button doesn't work, paste this link into your browser:<br>${safeLink}</p>
</div></body></html>`;
  return { subject, text, html };
}

export async function sendResetEmail(to: string, link: string, name?: string | null): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[password-reset] RESEND_API_KEY not set. Reset link for ${to}:\n${link}`);
    }
    return { sent: false, reason: "RESEND_API_KEY not set" };
  }
  const { subject, text, html } = buildResetEmail(link, name);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: authFromEmail(), to: [to], subject, text, html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { sent: false, reason: `Resend ${res.status}: ${(await res.text()).slice(0, 300)}` };
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
