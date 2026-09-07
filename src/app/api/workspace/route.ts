import { NextResponse } from "next/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { companies, orders, shifts } from "@/db/schema";
import { destroySession, getCompany, isSameOrigin, rateLimit } from "@/lib/auth";

export async function GET() {
  const company = await getCompany();
  if (!company) return NextResponse.json({ error: "يرجى تسجيل الدخول." }, { status: 401 });
  const rows = await db.select().from(shifts).where(eq(shifts.companyId, company.id)).orderBy(desc(shifts.openedAt)).limit(100);
  return NextResponse.json({ company, shifts: rows }, { headers: { "Cache-Control": "no-store" } });
}
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح." }, { status: 403 });
  const company = await getCompany();
  if (!company) return NextResponse.json({ error: "يرجى تسجيل الدخول." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.confirmation !== company.name) return NextResponse.json({ error: "اكتب اسم المطعم كاملًا كما يظهر في مساحة العمل لتأكيد الحذف." }, { status: 400 });
  try {
    await db.delete(companies).where(eq(companies.id, company.id));
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Workspace deletion failed", error);
    return NextResponse.json({ error: "تعذر حذف المساحة. حاول مرة أخرى." }, { status: 500 });
  }
}
const settings = z.object({ name: z.string().trim().min(2).max(120), ownerName: z.string().trim().min(2).max(100), phone: z.string().transform(v => v.replace(/[\s()-]/g, "")).pipe(z.string().regex(/^\+?[0-9]{8,15}$/)), branchCount: z.enum(["1", "2-5", "5+"]), disabledItems: z.array(z.enum(["burger", "chicken", "salad", "lemon"])).max(4) });
export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح." }, { status: 403 });
  const company = await getCompany();
  if (!company) return NextResponse.json({ error: "يرجى تسجيل الدخول." }, { status: 401 });
  const parsed = settings.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "راجع اسم المطعم، الاسم الكامل، ورقم الجوال." }, { status: 400 });
  await db.update(companies).set(parsed.data).where(eq(companies.id, company.id));
  return NextResponse.json({ success: true });
}
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح." }, { status: 403 });
  if (!rateLimit(request, "shifts", 15)) return NextResponse.json({ error: "انتظر قليلًا ثم حاول مرة أخرى." }, { status: 429 });
  const company = await getCompany();
  if (!company) return NextResponse.json({ error: "يرجى تسجيل الدخول." }, { status: 401 });
  const parsed = z.object({ action: z.enum(["open", "close"]), amount: z.number().int().min(0).max(100000000) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "أدخل رصيدًا نقديًا صحيحًا." }, { status: 400 });
  try {
    return await db.transaction(async tx => {
      const [active] = await tx.select().from(shifts).where(and(eq(shifts.companyId, company.id), isNull(shifts.closedAt))).for("update").limit(1);
      if (parsed.data.action === "open") {
        if (active) return NextResponse.json({ error: "توجد مناوبة نشطة بالفعل. أغلقها قبل فتح أخرى." }, { status: 409 });
        const [shift] = await tx.insert(shifts).values({ companyId: company.id, openingAmount: parsed.data.amount }).onConflictDoNothing().returning();
        if (!shift) return NextResponse.json({ error: "تم فتح مناوبة بالفعل. حدّث الصفحة." }, { status: 409 });
        return NextResponse.json({ shift }, { status: 201 });
      }
      if (!active) return NextResponse.json({ error: "لا توجد مناوبة نشطة لإغلاقها." }, { status: 409 });
      const [revenue] = await tx.select({ total: sql<number>`coalesce(sum(${orders.total}), 0)::int` }).from(orders).where(and(eq(orders.shiftId, active.id), eq(orders.status, "paid"), eq(orders.paymentMethod, "cash")));
      const expectedAmount = active.openingAmount + (revenue?.total || 0);
      const [shift] = await tx.update(shifts).set({ closedAt: new Date(), closingAmount: parsed.data.amount, expectedAmount }).where(eq(shifts.id, active.id)).returning();
      return NextResponse.json({ shift, difference: parsed.data.amount - expectedAmount });
    });
  } catch (error) {
    console.error("Shift operation failed", error);
    return NextResponse.json({ error: "تعذر حفظ المناوبة، حاول مجددًا." }, { status: 500 });
  }
}
