import { site } from "@/lib/site";

const socialLinks = [] as string[];

export default function SeoSchema() {
  const organization = {
    "@type": "Organization",
    "@id": `${site.url}/#organization`,
    name: "منصة قِرى",
    alternateName: ["Qira", "Qira Platform", "منصة قِرى لإدارة المطاعم"],
    url: site.url,
    logo: {
      "@type": "ImageObject",
      url: `${site.url}/logo.svg`,
    },
    description:
      "منصة قِرى هي منصة سحابية تخلّيك تدير مطعمك أو كافيهك من منصة واحدة؛ من أول طلب لين آخر حساب بدون تشتت أدوات.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "SA",
    },
    areaServed: {
      "@type": "Country",
      name: "Saudi Arabia",
    },
    inLanguage: "ar-SA",
    ...(socialLinks.length > 0 && { sameAs: socialLinks }),
  };

  const website = {
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    url: site.url,
    name: "منصة قِرى | Qira",
    alternateName: "منصة قِرى - منصة إدارة المطاعم والكافيهات",
    description:
      "شغّل مطعمك كله مترابط؛ من المنيو إلى الحسابات كل جزء يكمل الثاني من منصة واحدة.",
    publisher: {
      "@id": `${site.url}/#organization`,
    },
    inLanguage: "ar-SA",
  };

  const softwareApplication = {
    "@type": "SoftwareApplication",
    "@id": `${site.url}/#software`,
    name: "منصة قِرى | Qira SaaS Platform",
    operatingSystem: "All (Web-Based Cloud Platform)",
    applicationCategory: "BusinessApplication",
    description:
      "منصة سحابية مخصصة لإدارة المطاعم والمقاهي، تجمع نقطة البيع POS، شاشة المطبخ KDS، طلبات الـ QR، وإدارة المناوبات والفوترة المعتمدة من زاتكا.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "SAR",
      availability: "https://schema.org/InStock",
      description: "اشترك على قد احتياجك - تجربة مجانية متكاملة",
    },
    featureList: [
      "الطلب عبر QR مباشرة من الطاولة دون انتظار",
      "المطبخ الرقمي KDS - كل طلب في مكانه وكل مرحلة واضحة",
      "نقطة البيع POS وكل طرق الدفع من شاشة واحدة",
      "إدارة المناوبات - اعرف أين يبدأ كل ريال وأين ينتهي",
      "الفواتير والامتثال الضريبي وزاتكا",
      "الولاء والتقارير لبناء سبب لعودة العملاء",
    ],
  };

  const schema = {
    "@context": "https://schema.org",
    "@graph": [organization, website, softwareApplication],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}
