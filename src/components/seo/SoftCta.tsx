import Link from "next/link";

/** Low-key signup prompt under a tool result or article. Claims stay within what the product does. */
export function SoftCta({ title = "Monitor it daily for free", body }: { title?: string; body: string }) {
  return (
    <aside className="border border-rule bg-surface p-6 sm:p-8">
      <p className="font-display text-xl font-medium tracking-tight text-ink sm:text-2xl">{title}</p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{body}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link
          href="/signup"
          className="inline-flex items-center bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Start free
        </Link>
        <Link href="/#pricing" className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
          See pricing
        </Link>
      </div>
    </aside>
  );
}
