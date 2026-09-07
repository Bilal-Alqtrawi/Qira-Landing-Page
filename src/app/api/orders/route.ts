import { NextResponse } from "next/server";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders, serviceRequests, shifts } from "@/db/schema";
import { getCompany, getGuestToken, isSameOrigin, rateLimit } from "@/lib/auth";
import { menuItems } from "@/lib/site";

const publicFields = { id: orders.id, items: orders.items, total: orders.total, status: orders.status, tableNumber: orders.tableNumber, note: orders.note, createdAt: orders.createdAt, paidAt: orders.paidAt, paymentMethod: orders.paymentMethod, shiftId: orders.shiftId };
export async function GET(request: Request) {
  const dashboard = new URL(request.url).searchParams.get("scope") === "dashboard";
  const company = await getCompany();
  if (dashboard && !company) return NextResponse.json({ error: "سجّل الدخول أولًا." }, { status: 401 });
  const guest = await getGuestToken();
  if (!dashboard && !guest) return NextResponse.json({ orders: [] });
  const rows = await db.select(publicFields).from(orders).where(dashboard ? eq(orders.companyId, company!.id) : eq(orders.guestToken, guest!)).orderBy(desc(orders.createdAt)).limit(100);
  const requests = dashboard ? await db.select({ id: serviceRequests.id, kind: serviceRequests.kind, tableNumber: serviceRequests.tableNumber, createdAt: serviceRequests.createdAt }).from(serviceRequests).where(eq(serviceRequests.companyId, company!.id)).orderBy(desc(serviceRequests.createdAt)).limit(20) : [];
  return NextResponse.json({ orders: rows, serviceRequests: requests }, { headers: { "Cache-Control": "no-store" } });
}
const orderSchema = z.object({ requestKey: z.string().uuid(), items: z.array(z.object({ id: z.string().max(40), quantity: z.number().int().min(1).max(20) })).min(1).max(10), note: z.string().trim().max(500).optional() });
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح." }, { status: 403 });
  if (!rateLimit(request, "orders", 20)) return NextResponse.json({ error: "انتظر قليلًا قبل إرسال طلب آخر." }, { status: 429 });
  const body = await request.json().catch(() => null);
  try {
    const guestToken = (await getGuestToken(true))!;
    const company = await getCompany();
    if (body?.action === "service") {
      const parsed = z.object({ kind: z.enum(["service", "bill"]) }).safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "نوع الخدمة غير صحيح." }, { status: 400 });
      await db.insert(serviceRequests).values({ guestToken, companyId: company?.id, kind: parsed.data.kind });
      return NextResponse.json({ success: true }, { status: 201 });
    }
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "راجع الأصناف والكميات في سلتك." }, { status: 400 });
    const input = parsed.data;
    const unique = new Set(input.items.map(item => item.id));
    if (unique.size !== input.items.length || input.items.reduce((s, i) => s + i.quantity, 0) > 60) return NextResponse.json({ error: "الحد الأقصى ٦٠ صنفًا للطلب الواحد، دون تكرار أسطر الأصناف." }, { status: 400 });
    if (company && input.items.some(item => company.disabledItems.includes(item.id))) return NextResponse.json({ error: "أحد الأصناف لم يعد متاحًا. حدّث القائمة وعدّل سلتك." }, { status: 409 });
    const items = input.items.map(item => { const product = menuItems.find(p => p.id === item.id); if (!product) throw new Error("INVALID_ITEM"); return { id: product.id, name: product.name, price: product.price, quantity: item.quantity }; });
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const [saved] = await db.insert(orders).values({ guestToken, companyId: company?.id, requestKey: input.requestKey, items, total, note: input.note }).onConflictDoNothing({ target: orders.requestKey }).returning(publicFields);
    if (!saved) {
      const [existing] = await db.select(publicFields).from(orders).where(and(eq(orders.requestKey, input.requestKey), eq(orders.guestToken, guestToken))).limit(1);
      if (existing) return NextResponse.json({ order: existing });
      return NextResponse.json({ error: "تعذر إرسال الطلب. حدّث الصفحة وحاول مجددًا." }, { status: 409 });
    }
    return NextResponse.json({ order: saved }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_ITEM") return NextResponse.json({ error: "أحد الأصناف غير متاح الآن." }, { status: 400 });
    console.error("Order creation failed", error);
    return NextResponse.json({ error: "تعذر إرسال الطلب. احتفظنا بسلتك، حاول مرة أخرى." }, { status: 500 });
  }
}
export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح." }, { status: 403 });
  if (!rateLimit(request, "order-update", 40)) return NextResponse.json({ error: "انتظر قليلًا قبل المحاولة مجددًا." }, { status: 429 });
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(["preparing", "ready", "paid", "cancelled"]), paymentMethod: z.enum(["cash", "card", "electronic"]).default("cash") }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  const company = await getCompany(); const guest = await getGuestToken();
  if (!company && !guest) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    return await db.transaction(async tx => {
      const scope = company ? or(eq(orders.companyId, company.id), eq(orders.guestToken, guest || "none")) : eq(orders.guestToken, guest!);
      const [order] = await tx.select().from(orders).where(and(eq(orders.id, parsed.data.id), scope)).for("update").limit(1);
      if (!order) return NextResponse.json({ error: "الطلب غير موجود." }, { status: 404 });
      const ownsCompany = company && order.companyId === company.id;
      const ownsGuest = guest && order.guestToken === guest;
      if (!ownsCompany && !(ownsGuest && (!order.companyId || parsed.data.status === "cancelled"))) return NextResponse.json({ error: "تحديث هذا الطلب متاح لإدارة مطعمه فقط." }, { status: 403 });
      const transitions: Record<string, string[]> = { new: ["preparing", "cancelled"], preparing: ["ready"], ready: ["paid"], paid: [], cancelled: [] };
      if (!transitions[order.status]?.includes(parsed.data.status)) return NextResponse.json({ error: "تم تحديث الطلب بالفعل. حدّث القائمة وحاول مجددًا." }, { status: 409 });
      let shiftId: string | null = null;
      if (parsed.data.status === "paid" && order.companyId) {
        const [active] = await tx.select().from(shifts).where(and(eq(shifts.companyId, order.companyId), isNull(shifts.closedAt))).for("update").limit(1);
        if (!active) return NextResponse.json({ error: "ابدأ مناوبة في لوحة المطعم قبل تسجيل التحصيل التجريبي." }, { status: 409 });
        shiftId = active.id;
      }
      const [updated] = await tx.update(orders).set({ status: parsed.data.status, ...(parsed.data.status === "paid" ? { paidAt: new Date(), paymentMethod: parsed.data.paymentMethod, shiftId } : {}) }).where(and(eq(orders.id, order.id), eq(orders.status, order.status))).returning(publicFields);
      if (!updated) return NextResponse.json({ error: "تغيرت حالة الطلب. أعد المحاولة." }, { status: 409 });
      return NextResponse.json({ order: updated });
    });
  } catch (error) {
    console.error("Order update failed", error);
    return NextResponse.json({ error: "تعذر تحديث الطلب، حاول مجددًا." }, { status: 500 });
  }
}
