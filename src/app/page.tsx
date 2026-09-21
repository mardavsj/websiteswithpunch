import {
  AudienceSection,
  PricingSection,
} from "@/components/marketing/sections-audience-pricing";
import {
  FaqSection,
  FinalCtaSection,
} from "@/components/marketing/sections-faq-cta";
import {
  FeaturesSection,
  ProductPreviewSection,
  WhyItMattersSection,
} from "@/components/marketing/sections-mid";
import {
  HeroSection,
  HowItWorksSection,
  IntroLine,
  ProofStrip,
} from "@/components/marketing/sections-top";

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <ProofStrip />
      <IntroLine />
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
