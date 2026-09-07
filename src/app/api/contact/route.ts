import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { contactRequests } from "@/db/schema";
import { isSameOrigin, rateLimit } from "@/lib/auth";

const schema = z.object({
  fullName: z.string().trim().min(2).max(100),
  restaurant: z.string().trim().min(2).max(120),
  phone: z.string().transform(v => v.replace(/[\s()-]/g, "")).pipe(z.string().regex(/^\+?[0-9]{8,15}$/)),
  email: z.string().trim().toLowerCase().email().max(254),
  branchCount: z.enum(["1", "2-5", "5+"]),
  message: z.string().trim().max(3000).optional().default(""),
  kind: z.enum(["contact", "demo", "quote", "whatsapp"]).default("contact"),
  addOns: z.array(z.string().max(100)).max(7).default([]),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير مسموح." }, { status: 403 });
  if (!rateLimit(request, "contact", 5)) return NextResponse.json({ error: "تم إرسال عدة طلبات. يرجى الانتظار دقيقة قبل المحاولة مجددًا." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "يرجى مراجعة الحقول المطلوبة ورقم الجوال والبريد الإلكتروني." }, { status: 400 });
  try {
    const { website: _website, ...input } = parsed.data;
    const [lead] = await db.insert(contactRequests).values(input).returning({ id: contactRequests.id });
    return NextResponse.json({ success: true, reference: lead.id.slice(0, 8).toUpperCase() }, { status: 201 });
  } catch (error) {
    console.error("Contact request failed", error);
    return NextResponse.json({ error: "لم نتمكن من حفظ طلبك. بياناتك ما زالت في النموذج، حاول مرة أخرى." }, { status: 500 });
  }
}
