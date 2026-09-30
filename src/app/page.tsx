import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AudienceSection } from "@/components/marketing/AudienceSection";
import { PricingSection } from "@/components/marketing/sections-audience-pricing";
import {
  FaqSection,
  FinalCtaSection,
} from "@/components/marketing/sections-faq-cta";
import { FeaturesSection } from "@/components/marketing/sections-mid";
import { ProductPreviewSection } from "@/components/marketing/sections-preview";
import { WhyItMattersSection } from "@/components/marketing/sections-why";
import { HowItWorksSection } from "@/components/marketing/sections-how";
import { HeroSection } from "@/components/marketing/sections-hero";
import { IntroLine, ProofStrip } from "@/components/marketing/sections-top";

export default async function HomePage() {
  const session = await getSession();
  if (session?.user) redirect("/dashboard");

  return (
    <div>
      <HeroSection />
      <IntroLine />
      <ProofStrip />
      <HowItWorksSection />
      <FeaturesSection />
      <WhyItMattersSection />
      <ProductPreviewSection />
      <AudienceSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
    </div>
  );
}
