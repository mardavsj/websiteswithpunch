/** Contact-form notification to the team (reply-to is the sender), via lib/email. */
import type { ContactInput } from "./contact";
import { sendEmail, type SendResult } from "./email/send";
import { contactNotificationEmail } from "./email/templates";

export { escapeHtml } from "./email/layout";
export type { SendResult } from "./email/send";

const DEFAULT_FROM = "Websites With Punch <contact@websiteswithpunch.com>";
const DEFAULT_TO = "hello@websiteswithpunch.com";

export function sendContactEmail(input: ContactInput & { userId?: string | null; id: string }): Promise<SendResult> {
  return sendEmail({
    to: process.env.CONTACT_TO_EMAIL || DEFAULT_TO,
    from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
    replyTo: input.email,
    tag: "contact",
    ...contactNotificationEmail(input),
  });
}
