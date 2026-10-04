/** Account emails (reset, password changed, verification code) built on lib/email. */
import { sendEmail, type SendResult } from "./email/send";
import { passwordChangedEmail, resetPasswordEmail, verificationCodeEmail } from "./email/templates";

export function appBaseUrl(): string {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export function resetLink(token: string): string {
  return `${appBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

export function sendResetEmail(to: string, link: string, name?: string | null): Promise<SendResult> {
  return sendEmail({ to, tag: "password-reset", ...resetPasswordEmail(link, name) });
}

export function sendPasswordChangedEmail(to: string, name?: string | null): Promise<SendResult> {
  return sendEmail({ to, tag: "password-changed", ...passwordChangedEmail(name) });
}

export function sendVerificationCode(to: string, code: string, name?: string | null): Promise<SendResult> {
  return sendEmail({ to, tag: "verify", ...verificationCodeEmail(code, name) });
}
