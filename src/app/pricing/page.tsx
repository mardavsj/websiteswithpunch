import type { Metadata } from "next";
import Link from "next/link";
import { PricingSection } from "@/components/marketing/sections-audience-pricing";
import { FaqSection } from "@/components/marketing/sections-faq-cta";
import { PLANS } from "@/lib/plans";
import { ANNUAL_PRICES } from "@/lib/billing-interval";

const price = (id: "pro" | "business") => `$${PLANS[id].price}/month or $${ANNUAL_PRICES[id]}/year`;

export const metadata: Metadata = {
  title: "Pricing",
  description: `Website monitoring pricing: Free for 1 site, Pro ${price("pro")}, Business ${price("business")}, plus optional site packs. Prices in USD. Cancel anytime.`,
  alternates: { canonical: "/pricing" },
};

const link = "text-accent underline underline-offset-2 hover:no-underline";

const points = [
  {
    title: "A software subscription",
    body: "Websites With Punch is an online software service (SaaS). Nothing is shipped: you sign in and use the dashboard in your browser right after you sign up.",
  },
  {
    title: "How billing works",
    body: "Pro and Business are billed in advance, monthly or yearly, and renew automatically until you cancel. Site packs join the same subscription and bill on the same schedule.",
  },
  {
    title: "Cancel anytime",
    body: "Cancel from Your plan or Manage billing. You keep your plan until the end of the period you've paid for and aren't charged again.",
  },
];

export default function PricingPage() {
  return (
    <div>
      <PricingSection as="h1" />
      <section className="border-b border-rule bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-medium text-ink sm:text-3xl">What you&apos;re buying</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {points.map((p) => (
              <div key={p.title} className="border border-rule bg-surface p-6">
                <h3 className="font-display text-lg font-medium text-ink">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted">
            Full details: <Link className={link} href="/refund-policy">Refund &amp; Cancellation Policy</Link>
            {" · "}
            <Link className={link} href="/terms">Terms of Service</Link>
            {" · "}
            <Link className={link} href="/privacy">Privacy Policy</Link>. Questions?{" "}
            <Link className={link} href="/contact?topic=billing">Contact us</Link>.
          </p>
        </div>
      </section>
      <FaqSection />
    </div>
  );
}
