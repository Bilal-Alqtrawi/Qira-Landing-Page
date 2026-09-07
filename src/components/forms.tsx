"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "./ui";
import { site } from "@/lib/site";

type ContactKind = "contact" | "demo" | "quote" | "whatsapp";
export function ContactForm({
  kind = "contact",
  addOns = [],
  compact = false,
}: {
  kind?: ContactKind;
  addOns?: string[];
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const form = event.currentTarget;
    setError("");
    setLoading(true);
    const fields = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch("https://formspree.io/f/mbgjavkb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ ...fields, kind, addOns }),
      });
      if (!response.ok)
        throw new Error("تعذر إرسال الطلب، يُرجى المحاولة لاحقًا.");
      // إنشاء رقم مرجعي عشوائي لإظهار شاشة النجاح للمستخدم
      const randomRef = "QR-" + Math.floor(100000 + Math.random() * 900000);
      setReference(randomRef);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى.",
      );
    } finally {
      setLoading(false);
    }
  }
  if (reference)
    return (
      <div className="form-success" role="status">
        <span className="success-icon">
          <Icon name="doubleCheck" size={34} />
        </span>
        <h3>وصلنا طلبك بكل تفاصيله.</h3>
        <p>
          شكرًا لاهتمامك بQira. تم حفظ طلبك بنجاح، ويمكنك الاحتفاظ بالرقم
          المرجعي للمتابعة.
        </p>
        <div className="reference-number">
          رقم الطلب <b dir="ltr">{reference}</b>
        </div>
        <p className="form-note">
          هذه بيئة تجريبية. لا تُرسل رسائل أو مواعيد مؤكدة تلقائيًا.
        </p>
        <button
          className="button button-outline"
          type="button"
          onClick={() => setReference("")}
        >
          إرسال طلب جديد
          <Icon name="arrow" size={16} />
        </button>
      </div>
    );
  return (
    <form
      onSubmit={submit}
      className={`contact-form ${compact ? "compact" : ""}`}
    >
      {kind === "demo" && (
        <p className="form-intro">
          <Icon name="calendar" />
          اترك بياناتك والوقت المناسب في الرسالة؛ يُحفظ طلب العرض دون حجز موعد
          تلقائي.
        </p>
      )}
      {kind === "quote" && (
        <div className="selected-addons">
          <b>عرضك المخصص</b>
          <span>
            النظام الأساسي{addOns.length ? ` + ${addOns.join("، ")}` : " فقط"}
          </span>
        </div>
      )}
      {kind === "whatsapp" && (
        <p className="form-intro">
          <Icon name="message" />
          {site.whatsapp
            ? "يسعدنا مساعدتك عبر واتساب أو من خلال النموذج."
            : "لم يُربط رقم واتساب بهذه النسخة بعد. اترك رقمك وسؤالك في طلب التواصل."}
        </p>
      )}
      <div className="form-grid">
        <label>
          الاسم الكامل <span>*</span>
          <input
            name="fullName"
            autoComplete="name"
            placeholder="اسمك كما تحب أن نناديك"
            required
            minLength={2}
            maxLength={100}
          />
        </label>
        <label>
          اسم المطعم / السلسلة <span>*</span>
          <input
            name="restaurant"
            autoComplete="organization"
            placeholder="اسم مطعمك"
            required
            minLength={2}
            maxLength={120}
          />
        </label>
        <label>
          رقم الجوال — يدعم واتساب <span>*</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder="05X XXX XXXX"
            required
            pattern="[+]?[0-9 ]{8,21}"
            maxLength={22}
          />
        </label>
        <label>
          البريد الإلكتروني <span>*</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            placeholder="you@restaurant.com"
            required
            maxLength={254}
          />
        </label>
        <label className="full-width">
          عدد الفروع الحالية <span>*</span>
          <span className="select-wrap">
            <select name="branchCount" defaultValue="1" required>
              <option value="1">فرع واحد</option>
              <option value="2-5">من فرعين إلى خمسة فروع</option>
              <option value="5+">أكثر من خمسة فروع</option>
            </select>
            <Icon name="down" size={16} />
          </span>
        </label>
        <label className="full-width">
          رسالتك <small>— اختياري</small>
          <textarea
            name="message"
            placeholder={
              kind === "demo"
                ? "ما الوقت المناسب للتواصل؟ وما الذي تود استكشافه؟"
                : "أخبرنا قليلًا عن مطعمك وما الذي تبحث عنه..."
            }
            maxLength={3000}
            rows={3}
            defaultValue={kind === "whatsapp" ? site.whatsappMessage : ""}
          />
        </label>
        <div className="honeypot" aria-hidden="true">
          <input name="website" tabIndex={-1} autoComplete="off" />
        </div>
      </div>
      {error && (
        <p className="form-error" role="alert">
          <Icon name="alert" size={17} />
          {error}
        </p>
      )}
      <button
        className="button button-primary full-width"
        disabled={loading}
        type="submit"
      >
        {loading
          ? "جارٍ إرسال طلبك..."
          : kind === "quote"
            ? "اطلب عرضي المخصص"
            : kind === "demo"
              ? "أرسل طلب العرض التجريبي"
              : "أرسل طلبك"}
        <Icon
          name={loading ? "loading" : "arrow"}
          className={loading ? "spin" : ""}
          size={18}
        />
      </button>
      <p className="form-note">
        <Icon name="lock" size={13} />
        تتم حماية بياناتك وعدم مشاركتها مع أي جهة أخرى. بإرسالك الطلب توافق على{" "}
        <Link href="/legal/privacy">سياسة الخصوصية</Link>.
      </p>
    </form>
  );
}

export function AuthForm({
  mode,
  onModeChange,
  onContact,
}: {
  mode: "trial" | "login";
  onModeChange: (mode: "trial" | "login") => void;
  onContact: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const trial = mode === "trial";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch(
        `/api/auth/${trial ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...Object.fromEntries(formData),
            consent: formData.get("consent") === "on",
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "تعذر الاتصال. حاول مرة أخرى.",
      );
      setLoading(false);
    }
  }
  return (
    <form className="auth-form" onSubmit={submit}>
      <p className="auth-intro">
        {trial
          ? "شهران كاملان لاكتشاف تشغيل أذكى. دون بطاقة ائتمانية ودون التزام."
          : "أهلًا بعودتك. تفاصيل مطعمك تنتظرك في مكان واحد."}
      </p>
      {trial && (
        <div className="trial-promise">
          <Icon name="gift" size={23} />
          <div>
            <b>كل المساحة لتجرب. وكل الحرية لتقرر.</b>
            <span>حساب مستقل لمطعمك يبدأ من اليوم.</span>
          </div>
        </div>
      )}
      <div className="form-grid">
        {trial && (
          <>
            <label>
              الاسم الكامل
              <input
                name="fullName"
                autoComplete="name"
                placeholder="الاسم الكامل"
                required
                minLength={2}
                maxLength={100}
              />
            </label>
            <label>
              اسم المطعم
              <input
                name="restaurant"
                autoComplete="organization"
                placeholder="اسم مطعمك"
                required
                minLength={2}
                maxLength={120}
              />
            </label>
          </>
        )}
        <label className={trial ? "" : "full-width"}>
          البريد الإلكتروني
          <input
            name="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            placeholder="you@restaurant.com"
            required
            maxLength={254}
          />
        </label>
        {trial && (
          <label>
            رقم الجوال
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              dir="ltr"
              placeholder="05X XXX XXXX"
              required
              pattern="[+]?[0-9 ]{8,21}"
              maxLength={22}
            />
          </label>
        )}
        <label className="full-width">
          كلمة المرور
          <span className="password-field">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={trial ? "new-password" : "current-password"}
              placeholder={trial ? "٨ أحرف على الأقل" : "كلمة مرور حسابك"}
              minLength={trial ? 8 : 1}
              maxLength={128}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
              }
            >
              <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
            </button>
          </span>
        </label>
        {trial && (
          <label className="full-width">
            عدد الفروع
            <span className="select-wrap">
              <select name="branchCount" defaultValue="1">
                <option value="1">فرع واحد</option>
                <option value="2-5">من فرعين إلى خمسة فروع</option>
                <option value="5+">أكثر من خمسة فروع</option>
              </select>
              <Icon name="down" size={16} />
            </span>
          </label>
        )}
      </div>
      {trial ? (
        <label className="checkbox-label">
          <input name="consent" type="checkbox" required />
          <span>
            أوافق على{" "}
            <Link href="/legal/terms" target="_blank">
              الشروط والأحكام
            </Link>{" "}
            و
            <Link href="/legal/privacy" target="_blank">
              سياسة الخصوصية
            </Link>
            .
          </span>
        </label>
      ) : (
        <button
          className="text-button auth-help"
          type="button"
          onClick={onContact}
        >
          تحتاج مساعدة في الوصول لحسابك؟
        </button>
      )}
      {error && (
        <p className="form-error" role="alert">
          <Icon name="alert" size={16} />
          {error}
        </p>
      )}
      <button
        type="submit"
        className="button button-primary full-width"
        disabled={loading}
      >
        {loading
          ? "لحظات ونكون معك..."
          : trial
            ? "أنشئ حسابي وابدأ الشهرين المجانيين"
            : "تسجيل الدخول"}
        <Icon
          name={loading ? "loading" : "arrow"}
          className={loading ? "spin" : ""}
          size={17}
        />
      </button>
      <p className="auth-switch">
        {trial ? "لديك حساب بالفعل؟" : "أول مرة مع Qira؟"}
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setError("");
            onModeChange(trial ? "login" : "trial");
          }}
        >
          {trial ? "تسجيل الدخول" : "ابدأ تجربتك المجانية"}
        </button>
      </p>
    </form>
  );
}
