import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cairo } from "next/font/google";
import { site } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";
import NationalDayTheme from "@/components/national-day-theme";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import SeoSchema from "@/components/schema-seo";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "منصة قِرى | Qira — منصة واحدة تدير مطعمك وكافيهك بالكامل",
    template: "%s | منصة قِرى",
  },
  description:
    "مطعمك يحتاج منصة واحدة فقط! قِرى تربط لك الكاشير، شاشة المطبخ، منيو الـ QR، وإدارة المناوبات والفوترة المعتمدة من زاتكا. اشترك على قد احتياجك وجربها مجاناً.",
  applicationName: "منصة قِرى",
  category: "Restaurant Management Platform",
  authors: [{ name: "منصة قِرى", url: site.url }],
  creator: "منصة قِرى",
  publisher: "منصة قِرى",

  keywords: [
    "منصة قِرى",
    "منصة إدارة مطاعم",
    "منصة كافيهات",
    "منصة كاشير سحابية",
    "نقاط بيع POS",
    "برنامج كاشير معتمد زاتكا",
    "شاشة المطبخ KDS",
    "منيو QR تفاعلي",
    "إدارة المناوبات والحسابات",
    "الفوترة الإلكترونية السعودية",
    "Qira Platform",
    "Qira POS",
  ],

  alternates: {
    canonical: site.url,
    languages: {
      "ar-SA": site.url,
    },
  },

  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: site.url,
    siteName: "منصة قِرى | Qira",
    title: "منصة قِرى | شغل مطعمك كله مترابط من منصة واحدة",
    description:
      "من أول طلب، لين آخر حساب.. منصة قِرى تربط الطلب بالمطبخ والكاشير وتخليك تتابع كل خطوة دون تشتت أنظمة. ابدأ بأساسيات مطعمك الحين مجاناً.",
    images: [
      {
        url: "/preview-image.jpg",
        width: 1200,
        height: 630,
        alt: "منصة قِرى - منصة سحابية متكاملة لإدارة المطاعم والمقاهي",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "منصة قِرى | Qira — منصة متكاملة لإدارة المطاعم والمقاهي",
    description:
      "الكاشير، المطبخ، والفوترة الإلكترونية في منصة واحدة. اشترك على قد احتياجك وارتاح من حوسة وتشتت الأنظمة.",
    images: ["/preview-image.jpg"],
  },

  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  other: {
    "geo.region": "SA",
    "geo.placename": "Saudi Arabia",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F6F6E8",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <head>
        <NationalDayTheme />
        <SeoSchema />
      </head>
      <body>
        {children}
        <Analytics />
        <GoogleAnalytics
          gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYSTIC as string}
        />
      </body>
    </html>
  );
}
