import Landing from "@/components/landing";
import { faqs } from "@/lib/content";
import { site } from "@/lib/site";

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org", "@graph": [
      { "@type": "Organization", "@id": `${site.url}/#organization`, name: site.name, url: site.url, logo: `${site.url}${site.logo}`, description: "منصة سحابية متكاملة لإدارة عمليات المطاعم", areaServed: { "@type": "Country", name: "المملكة العربية السعودية" } },
      { "@type": "WebSite", "@id": `${site.url}/#website`, url: site.url, name: site.name, inLanguage: "ar-SA", publisher: { "@id": `${site.url}/#organization` } },
      { "@type": "SoftwareApplication", name: "Qira لإدارة المطاعم", applicationCategory: "BusinessApplication", operatingSystem: "Web", inLanguage: "ar-SA", description: "منظومة متصلة لإدارة الطلبات ونقطة البيع والمطبخ الرقمي والفوترة والتقارير.", featureList: ["الطلب عبر QR", "المطبخ الرقمي KDS", "نقطة البيع POS", "إدارة المناوبات", "الفوترة الإلكترونية", "الولاء والتقارير"], offers: { "@type": "Offer", name: "تجربة مجانية لمدة شهرين", price: "0", priceCurrency: "SAR", description: "تجربة مجانية دون بطاقة ائتمانية ودون التزام. الأسعار بعد التجربة حسب الميزات المختارة." } },
      { "@type": "FAQPage", mainEntity: faqs.map(faq => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) },
    ],
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><Landing /></>;
}
