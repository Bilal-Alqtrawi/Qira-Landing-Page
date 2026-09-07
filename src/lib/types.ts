import type { OrderItem } from "@/db/schema";
export type ClientOrder = { id: string; items: OrderItem[]; total: number; status: string; tableNumber: number; note: string | null; createdAt: string; paidAt?: string | null; paymentMethod?: string | null; shiftId?: string | null };
export type ClientCompany = { id: string; name: string; ownerName: string; email: string; phone: string; branchCount: string; disabledItems: string[]; trialEndsAt: string; createdAt: string };
export type ClientShift = { id: string; openedAt: string; closedAt: string | null; openingAmount: number; closingAmount: number | null; expectedAmount: number | null };
export type ClientServiceRequest = { id: string; kind: string; tableNumber: number; createdAt: string };
export const statusLabels: Record<string, string> = { new: "جديد", preparing: "قيد التحضير", ready: "جاهز", paid: "مكتمل", cancelled: "ملغي" };
export const nextStatus: Record<string, string> = { new: "preparing", preparing: "ready", ready: "paid" };
export const actionLabels: Record<string, string> = { new: "ابدأ التحضير", preparing: "الطلب جاهز", ready: "تسجيل الدفع التجريبي" };
export const paymentLabels: Record<string, string> = { cash: "نقدي", card: "بطاقة", electronic: "دفع إلكتروني" };
export function orderNumber(id: string) { return id.slice(0, 6).toUpperCase(); }
