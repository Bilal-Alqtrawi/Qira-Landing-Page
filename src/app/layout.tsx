import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cairo } from "next/font/google";
import { site } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";
import NationalDayTheme from "@/components/national-day-theme";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";

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
    default: "منصة قِرى | Qira — سيستم يظبط إدارة مطعمك وكافيهك",
    template: "%s | منصة قِرى",
  },
  description:
    "تبي تريح بالك وتدير مطعمك بذكاء؟ قِرى تجمع لك الكاشير، نظام المطبخ، منيو الـ QR، والفوترة المعتمدة من زاتكا بجهة واحدة. جربها مجاناً الحين!",
  applicationName: "منصة قِرى",
  keywords: [
    "سيستم مطاعم",
    "برنامج كاشير مطاعم",
    "نظام كافيهات",
    "نقاط بيع POS",
    "منصة قِرى",
    "منيو QR",
    "فوترة زاتكا",
    "شاشة المطبخ KDS",
    "نظام مطاعم سحابي",
    "Qira",
  ],
  alternates: { canonical: "/", languages: { "ar-SA": "/" } },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    siteName: "منصة قِرى | Qira",
    title: "منصة قِرى | كل تشغيل مطعمك بجهة واحدة",
    description:
      "من أول طلب لين الفاتورة والتقارير المباشرة.. قِرى تظبط لك الكاشير والمطبخ وتخلي تشغيل مطعمك أسهل وأسرع. ابدأ تجربتك المجانية الحين.",
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "منصة قِرى | Qira - سيستم سحابي للمطاعم والمقاهي",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "منصة قِرى | Qira — سيستم متكامل للمطاعم والمقاهي",
    description:
      "الكاشير، المطبخ، والفوترة الإلكترونية بجهة واحدة. ارتاح من حوسة التشغيل وجرب قِرى مجاناً الحين.",
    images: ["/opengraph-image"],
  },
  icons: { icon: "/logo.svg", apple: "/logo.svg" },
  robots: { index: true, follow: true },
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
