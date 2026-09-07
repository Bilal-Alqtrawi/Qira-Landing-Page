import type { Metadata } from "next";
import { getCompany } from "@/lib/auth";
import DemoMenu from "@/components/demo-menu";
export const metadata: Metadata = { title: "جرّب قائمة المطعم الرقمية", description: "جرّب رحلة الطلب عبر QR مع Qira: اختر طبقك، أرسل الطلب وتابع حالته.", robots: { index: false, follow: true }, alternates: { canonical: "/demo" } };
export const dynamic = "force-dynamic";
export default async function DemoPage() {
  const company = await getCompany();
  return <DemoMenu companyName={company?.name || null} disabledItems={company?.disabledItems || []} />;
}
