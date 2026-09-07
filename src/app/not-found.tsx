import Link from "next/link";
import { Icon, Logo } from "@/components/ui";
export default function NotFound() {
  return <main className="state-page"><Logo /><span className="state-number">٤٠٤</span><h1>هذه الصفحة ليست على القائمة.</h1><p>ربما تغيّر الرابط، لكن البداية الصحيحة ما زالت هنا. عد إلى Qira واستكشف المنظومة.</p><Link className="button button-primary" href="/">العودة إلى الرئيسية<Icon name="arrow" size={18} /></Link></main>;
}
