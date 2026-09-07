"use client";
import { Icon, Logo } from "@/components/ui";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="state-page"><Logo /><span className="icon-tile"><Icon name="alert" size={37} /></span><h1>تفصيلة صغيرة عطّلت الرحلة.</h1><p>تعذر تحميل هذه الصفحة الآن. جرّب مرة أخرى، أو عد إلى الصفحة الرئيسية. لن يؤدي التحديث إلى إنشاء طلب مكرر.</p><button className="button button-primary" onClick={reset} type="button">حاول مرة أخرى<Icon name="reset" size={18} /></button><a href="/" className="text-button" style={{ marginTop: 19 }}>العودة إلى الرئيسية<Icon name="arrow" size={16} /></a></main>;
}
