import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { SoftCta } from "@/components/seo/SoftCta";
import { FEATURE_LINKS, TOOL_LINKS } from "@/content/links";
import { pageMeta } from "@/lib/seo-meta";

export const metadata = pageMeta({
  path: "/tools",
  title: "Free Website Tools: SSL, Domain Expiry & Down Checker",
  description:
    "Free website health tools: check SSL certificate expiry, look up a domain's expiry date over RDAP and test whether a website is down. No signup.",
  og: "tools",
});
export const dynamic = "force-static";

export default function ToolsIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
      <Breadcrumbs items={[{ name: "Free tools", href: "/tools" }]} />
      <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-ink sm:text-[2.6rem] sm:leading-[1.1]">
        Free website health tools
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
        Three quick checks for the problems that take websites offline most often: an expired SSL certificate, a
        lapsed domain and a server that stopped answering. Each runs live from our server, needs no account and
        explains what the result means and how to fix it.
      </p>
      <ul className="mt-10 space-y-3">
        {TOOL_LINKS.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="group block border border-rule bg-surface p-6 transition-colors hover:bg-bg">
              <h2 className="font-display text-xl font-medium text-ink group-hover:text-accent">{t.title} →</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{t.body}</p>
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="mt-16 font-display text-2xl font-medium tracking-tight text-ink">Checks that run every day</h2>
      <p className="mt-3 text-base leading-relaxed text-muted">
        The tools answer once. Websites With Punch runs the same three checks on each site you add once a day and keeps
        the results on one dashboard.
      </p>
      <ul className="mt-5 space-y-2.5">
        {FEATURE_LINKS.map((f) => (
          <li key={f.href} className="text-base text-muted">
            <Link href={f.href} className="font-medium text-ink hover:text-accent hover:underline">{f.title}</Link>: {f.body}
          </li>
        ))}
      </ul>
      <div className="mt-16">
        <SoftCta body="Add a site and see uptime, SSL days left and domain days left side by side, checked daily. Free for one site; no card needed. We don't send alerts: the dashboard is where you look." />
      </div>
    </div>
  );
}
