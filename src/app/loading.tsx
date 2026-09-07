import { Icon, Logo } from "@/components/ui";
export default function Loading() {
  return <div className="state-page" role="status" aria-live="polite"><Logo /><Icon name="loading" size={28} className="spin" /><p>نرتّب التفاصيل لتجربة أوضح...</p></div>;
}
