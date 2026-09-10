import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cairo } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

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
    default: "Qira | مطعمك بالكامل. في منصة واحدة.",
    template: "%s | Qira",
  },
  description:
    "منصة Qira السحابية تجمع إدارة المطاعم، الطلب عبر QR، المطبخ الرقمي، نقطة البيع والفوترة الإلكترونية في منظومة واحدة. ابدأ تجربتك المجانية لمدة شهرين.",
  applicationName: "Qira",
  keywords: [
    "إدارة المطاعم",
    "نقطة بيع",
    "نظام مطاعم",
    "قائمة QR",
    "زاتكا",
    "الفوترة الإلكترونية",
    "المطبخ الرقمي",
    "Qira",
  ],
  alternates: { canonical: "/", languages: { "ar-SA": "/" } },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    siteName: "Qira",
    title: "مطعمك بالكامل. في منصة واحدة.",
    description:
      "من الطلب الأول إلى الفاتورة والتقارير. Qira تجمع كل التفاصيل. جرّبها مجانًا لمدة شهرين.",
    url: "/",
    images: [
      {
        url: "/burger.jpg",
        width: 1200,
        height: 630,
        alt: "Qira — منصة متكاملة لإدارة المطاعم",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Qira | مطعمك بالكامل. في منصة واحدة.",
    images: ["/burger.jpg"],
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
      <body>{children}</body>
    </html>
  );
}
