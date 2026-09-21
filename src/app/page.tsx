import {
  AudienceSection,
  FaqSection,
  FinalCtaSection,
  PricingSection,
} from "@/components/marketing/sections-bottom";
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
