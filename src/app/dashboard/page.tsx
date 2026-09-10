import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCompany } from "@/lib/auth";
import Workspace from "@/components/workspace";
import type { ClientCompany } from "@/lib/types";
export const metadata: Metadata = {
  title: "مساحة مطعمك",
  robots: { index: false, follow: false },
  alternates: { canonical: "/dashboard" },
};
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const company = await getCompany();
  if (!company) redirect("/?login=1");
  const serialized = JSON.parse(JSON.stringify(company)) as ClientCompany;
  return <Workspace initialCompany={serialized} />;
}
