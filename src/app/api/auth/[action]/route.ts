import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { createSession, destroySession, getCompany, hashPassword, isSameOrigin, rateLimit, verifyPassword } from "@/lib/auth";

const email = z.string().trim().toLowerCase().email().max(254);
const registration = z.object({
  fullName: z.string().trim().min(2).max(100),
  restaurant: z.string().trim().min(2).max(120),
  email,
  phone: z.string().transform(v => v.replace(/[\s()-]/g, "")).pipe(z.string().regex(/^\+?[0-9]{8,15}$/)),
  branchCount: z.enum(["1", "2-5", "5+"]),
  password: z.string().min(8).max(128),
  consent: z.literal(true),
});

export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح." }, { status: 403 });
  if (!rateLimit(request, "auth", 10)) return NextResponse.json({ error: "محاولات كثيرة. انتظر دقيقة ثم حاول مجددًا." }, { status: 429 });
  const { action } = await params;
  try {
    if (action === "logout") {
      await destroySession();
      return NextResponse.json({ success: true });
    }
    const body = await request.json().catch(() => null);
    if (action === "register") {
      const parsed = registration.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "راجع البيانات: جميع الحقول مطلوبة، ورقم الجوال والبريد يجب أن يكونا صحيحين، وكلمة المرور ٨ أحرف على الأقل." }, { status: 400 });
      const input = parsed.data;
      const [exists] = await db.select({ id: companies.id }).from(companies).where(eq(companies.email, input.email)).limit(1);
      if (exists) return NextResponse.json({ error: "هذا البريد مسجل بالفعل. يمكنك تسجيل الدخول إلى حسابك." }, { status: 409 });
      const trialEndsAt = new Date();
      trialEndsAt.setMonth(trialEndsAt.getMonth() + 2);
      const [company] = await db.insert(companies).values({ name: input.restaurant, ownerName: input.fullName, email: input.email, phone: input.phone, branchCount: input.branchCount, passwordHash: await hashPassword(input.password), trialEndsAt }).returning({ id: companies.id });
      await createSession(company.id);
      return NextResponse.json({ success: true, redirect: "/dashboard" }, { status: 201 });
    }
    if (action === "login") {
      const parsed = z.object({ email, password: z.string().min(1).max(128) }).safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "أدخل بريدًا إلكترونيًا وكلمة مرور صحيحة." }, { status: 400 });
      const [company] = await db.select().from(companies).where(eq(companies.email, parsed.data.email)).limit(1);
      if (!company || !(await verifyPassword(parsed.data.password, company.passwordHash))) return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." }, { status: 401 });
      await createSession(company.id);
      return NextResponse.json({ success: true, redirect: "/dashboard" });
    }
    return NextResponse.json({ error: "المسار غير موجود." }, { status: 404 });
  } catch (error) {
    console.error("Authentication operation failed", error);
    return NextResponse.json({ error: "تعذر إتمام العملية الآن. حاول مرة أخرى بعد قليل." }, { status: 500 });
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (action !== "me") return NextResponse.json({ error: "المسار غير موجود." }, { status: 404 });
  const company = await getCompany();
  return NextResponse.json({ company }, { headers: { "Cache-Control": "no-store" } });
}
