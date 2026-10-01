import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { parseTopic } from "@/lib/contact";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about monitoring, billing or custom site limits? Send us a message.",
};

const notes = [
  { title: "Billing", body: "Include the email on your account. Please don't send card numbers." },
  { title: "Custom site limits", body: "Tell us roughly how many sites you need to monitor." },
  { title: "Something not working", body: "Add the site URL and what you expected to see." },
];

export default async function ContactPage({ searchParams }: { searchParams: { topic?: string } }) {
  const session = await getSession();
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <p className="label-caps">Contact</p>
          <h1 className="mt-4 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Get in touch
          </h1>
          <p className="mt-4 max-w-md leading-relaxed text-muted">
            Questions about monitoring, your plan or a custom site limit? Send us a message and a
            real person will read it. We aim to reply within 1–2 business days.
          </p>
          <dl className="mt-10 max-w-md border-t border-rule">
            {notes.map((n) => (
              <div key={n.title} className="border-b border-rule py-4">
                <dt className="text-sm font-medium text-ink">{n.title}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted">{n.body}</dd>
              </div>
            ))}
          </dl>
        </div>
        <ContactForm
          initialName={session?.user?.name ?? ""}
          initialEmail={session?.user?.email ?? ""}
          initialTopic={parseTopic(searchParams.topic)}
        />
      </div>
    </div>
  );
}
