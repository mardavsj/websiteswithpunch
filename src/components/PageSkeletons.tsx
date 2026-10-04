/**
 * Route loading skeletons (loading.tsx). Each mirrors its real page's markup with grey bars sized
 * by invisible stand-in text (see skeleton/Sk.tsx), so the swap to real content doesn't shift.
 */
import { FULL_FRAME, Sk, SkBtn, SkInput, SkStatus } from "./skeleton/Sk";

export { DashboardSkeleton } from "./skeleton/DashboardSkeleton";
export { PlanSkeleton } from "./skeleton/PlanSkeleton";
export { SiteSkeleton } from "./skeleton/SiteSkeleton";

const LABEL = "mt-3 block text-sm";

export function ProfileSkeleton() {
  return (
    <div className={FULL_FRAME} role="status" aria-busy="true">
      <SkStatus label="Loading profile…" />
      <div className="w-full">
        <h1 className="font-display text-2xl font-medium">
          <Sk>Profile</Sk>
        </h1>
        <p className="mt-1 text-sm">
          <Sk>Your account details.</Sk>
        </p>
        <div className="mt-6 max-w-md space-y-4 rounded-none border border-rule bg-surface p-6">
          <div>
            <p className="block text-sm font-medium">
              <Sk>Email</Sk>
            </p>
            <p className="mt-1 text-sm">
              <Sk>you@example.com</Sk>
            </p>
          </div>
          <div>
            <p className="block text-sm font-medium">
              <Sk>Name</Sk>
            </p>
            <SkInput>Your name</SkInput>
          </div>
          <div className="border-t border-rule pt-4">
            <p className="text-sm font-medium">
              <Sk>Change password</Sk>
            </p>
            <p className="mt-1 text-xs">
              <Sk>Leave blank to keep your current password.</Sk>
            </p>
            <p className={LABEL}>
              <Sk>Current password</Sk>
            </p>
            <SkInput>Current password</SkInput>
            <p className={LABEL}>
              <Sk>New password</Sk>
            </p>
            <SkInput>At least 8 characters</SkInput>
          </div>
          <SkBtn className="px-4 py-2 text-sm font-medium">Save</SkBtn>
        </div>
      </div>
    </div>
  );
}

const NOTES = [
  ["Billing", "Include the email on your account. Please don't send card numbers."],
  ["Custom site limits", "Tell us roughly how many sites you need to monitor."],
  ["Something not working", "Add the site URL and what you expected to see."],
];

// Labels are inline in the real form, so their line box takes the body line height.
function Field({ label, hint, className = "" }: { label: string; hint: string; className?: string }) {
  return (
    <div>
      <span className="text-sm font-medium">
        <Sk>{label}</Sk>
      </span>
      <SkInput className={`mt-1.5 ${className}`}>{hint}</SkInput>
    </div>
  );
}

/** Contact: intro column with the notes list, and the message form. */
export function ContactSkeleton() {
  return (
    <div
      className="relative mx-auto flex w-full max-w-6xl flex-1 items-center [align-items:safe_center] px-4 py-16 sm:px-6"
      role="status"
      aria-busy="true"
    >
      <SkStatus />
      <div className="grid w-full gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <p className="label-caps">
            <Sk>Contact</Sk>
          </p>
          <h1 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            <Sk>Get in touch</Sk>
          </h1>
          <p className="mt-4 max-w-md leading-relaxed">
            <Sk>
              Questions about monitoring, your plan or a custom site limit? Send us a message and a
              real person will read it. We aim to reply within 1–2 business days.
            </Sk>
          </p>
          <p className="mt-3 max-w-md text-sm">
            <Sk>Websites With Punch is a product operated by Makvion Technologies.</Sk>
          </p>
          <dl className="mt-10 max-w-md border-t border-rule">
            {NOTES.map(([t, b]) => (
              <div key={t} className="border-b border-rule py-4">
                <dt className="text-sm font-medium">
                  <Sk>{t}</Sk>
                </dt>
                <dd className="mt-1 text-sm leading-relaxed">
                  <Sk>{b}</Sk>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative self-start space-y-5 border border-rule bg-surface p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" hint="Alex Morgan" />
            <Field label="Email" hint="you@company.com" />
          </div>
          <Field label="Topic" hint="General question" className="h-[37px]" />
          <div>
            <Field label="Message" hint="How can we help?" className="h-[158px]" />
            {/* textarea (inline-block) baseline gap + the counter margin */}
            <p className="mt-3.5 text-right text-xs">
              <Sk>0/5000</Sk>
            </p>
          </div>
          <SkBtn className="w-full py-2.5 text-center text-sm font-semibold sm:w-auto sm:px-6">
            Send message
          </SkBtn>
        </div>
      </div>
    </div>
  );
}

/** Terms and privacy: title, date line, then headings and paragraphs. */
export function DocSkeleton() {
  const para =
    "Websites With Punch provides website health monitoring, including uptime checks, SSL expiry lookups and best-effort domain expiry lookups for the sites you add.";
  return (
    <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6" role="status" aria-busy="true">
      <SkStatus />
      <h1 className="font-display text-3xl font-medium">
        <Sk>Terms of Service</Sk>
      </h1>
      <p className="mt-2 text-sm">
        <Sk>Last updated: October 4, 2026</Sk>
      </p>
      <div className="mt-8 space-y-6 leading-relaxed">
        <p>
          <Sk>{para}</Sk>
        </p>
        {["About the Service", "Accounts", "Billing"].map((h) => (
          <div key={h} className="space-y-6">
            <h2 className="font-display text-xl font-medium">
              <Sk>{h}</Sk>
            </h2>
            <p>
              <Sk>{para}</Sk>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
