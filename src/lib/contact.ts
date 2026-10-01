/** Contact form: topics, limits and validation shared by the page and POST /api/contact. */

export const CONTACT_TOPICS = [
  { id: "general", label: "General question" },
  { id: "billing", label: "Billing" },
  { id: "custom-limits", label: "Custom site limits" },
  { id: "other", label: "Something else" },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["id"];

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 5000;
export const NAME_MAX = 120;
export const EMAIL_MAX = 254;

export function parseTopic(value: unknown): ContactTopic {
  const v = typeof value === "string" ? value : "";
  return CONTACT_TOPICS.some((t) => t.id === v) ? (v as ContactTopic) : "general";
}

/** Link to the contact form with its topic preselected (every link names one explicitly). */
export const contactHref = (topic: ContactTopic) => `/contact?topic=${topic}`;

export function topicLabel(id: ContactTopic): string {
  return CONTACT_TOPICS.find((t) => t.id === id)?.label ?? "General question";
}

export type ContactInput = { name: string; email: string; topic: ContactTopic; message: string };
export type ContactErrors = Partial<Record<"name" | "email" | "topic" | "message", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Trims fields and returns either clean input or per-field errors (plain language). */
export function validateContact(raw: Record<string, unknown>):
  | { ok: true; data: ContactInput }
  | { ok: false; errors: ContactErrors } {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const name = str(raw.name);
  const email = str(raw.email);
  const message = str(raw.message);
  const topicRaw = str(raw.topic);
  const errors: ContactErrors = {};

  if (!name) errors.name = "Enter your name.";
  else if (name.length > NAME_MAX) errors.name = `Keep your name under ${NAME_MAX} characters.`;

  if (!email) errors.email = "Enter your email address.";
  else if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address, like you@example.com.";
  }

  if (!CONTACT_TOPICS.some((t) => t.id === topicRaw)) errors.topic = "Choose a topic.";

  if (!message) errors.message = "Enter a message.";
  else if (message.length < MESSAGE_MIN) {
    errors.message = `Add a little more detail (at least ${MESSAGE_MIN} characters).`;
  } else if (message.length > MESSAGE_MAX) {
    errors.message = `Keep your message under ${MESSAGE_MAX} characters.`;
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { name, email, topic: topicRaw as ContactTopic, message } };
}
