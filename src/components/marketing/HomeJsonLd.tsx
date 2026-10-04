import { PLANS } from "@/lib/plans";
import { faqs } from "./home-content";
import { TOUR } from "./tour-content";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site-config";

/**
 * Structured data for the homepage: the organisation and the app. Monthly prices come from the
 * same PLANS config the pricing section uses, so they can't drift; no ratings or reviews. The
 * FAQPage is built from the same list the visible FAQ renders; the VideoObject is the tour in
 * "How it works".
 */
export function HomeJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icon-512.png`,
        parentOrganization: {
          "@type": "Organization",
          name: "Makvion Technologies",
          address: { "@type": "PostalAddress", addressCountry: "IN" },
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        name: `${SITE_NAME} Website Health`,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        publisher: { "@id": `${SITE_URL}/#organization` },
        offers: Object.values(PLANS).map((p) => ({
          "@type": "Offer",
          name: p.name,
          price: String(p.price),
          priceCurrency: "USD",
          description: p.description,
        })),
      },
      {
        "@type": "VideoObject",
        "@id": `${SITE_URL}/#tour`,
        name: TOUR.name,
        description: TOUR.description,
        thumbnailUrl: [`${SITE_URL}${TOUR.posterJpg}`],
        contentUrl: `${SITE_URL}${TOUR.mp4}`,
        uploadDate: TOUR.uploadDate,
        duration: TOUR.isoDuration,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped can't break out of the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
