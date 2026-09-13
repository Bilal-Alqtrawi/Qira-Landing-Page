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
    default: "مطعم قِرى | Qira - مطعمك بالكامل في منصة واحدة",
    template: "%s | مطعم قِرى",
  },
  description:
    "منصة قِرى (Qira) السحابية تجمع إدارة المطاعم، الطلب عبر QR، المطبخ الرقمي، نقطة البيع والفوترة الإلكترونية في منظومة واحدة. ابدأ تجربتك المجانية.",
  applicationName: "مطعم قِرى",
  keywords: [
    "إدارة المطاعم",
    "نقطة بيع",
    "نظام مطاعم",
    "قائمة QR",
    "زاتكا",
    "الفوترة الإلكترونية",
    "المطبخ الرقمي",
    "Qira",
    "مطعم قِرى",
    "قِرى",
  ],
  alternates: { canonical: "/", languages: { "ar-SA": "/" } },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    siteName: "مطعم قِرى | Qira",
    title: "مطعم قِرى | مطعمك بالكامل في منصة واحدة",
    description:
      "من الطلب الأول إلى الفاتورة والتقارير. منصة قِرى تجمع كل التفاصيل. جرّبها مجانًا.",
    url: "/",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "مطعم قِرى — منصة متكاملة لإدارة المطاعم",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "مطعم قِرى | Qira - مطعمك بالكامل في منصة واحدة",
    images: ["/logo.svg"],
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
