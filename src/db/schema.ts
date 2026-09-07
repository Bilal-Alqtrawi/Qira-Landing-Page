import { pgTable, uuid, text, timestamp, integer, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull(), ownerName: text("owner_name").notNull(), email: text("email").notNull().unique(), phone: text("phone").notNull(), branchCount: text("branch_count").notNull().default("1"), passwordHash: text("password_hash").notNull(), disabledItems: jsonb("disabled_items").$type<string[]>().notNull().default([]), trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(), tokenHash: text("token_hash").notNull().unique(), companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const contactRequests = pgTable("contact_requests", {
  id: uuid("id").defaultRandom().primaryKey(), fullName: text("full_name").notNull(), restaurant: text("restaurant").notNull(), phone: text("phone").notNull(), email: text("email").notNull(), branchCount: text("branch_count").notNull(), message: text("message"), kind: text("kind").notNull().default("contact"), addOns: jsonb("add_ons").$type<string[]>().notNull().default([]), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export const shifts = pgTable("shifts", {
  id: uuid("id").defaultRandom().primaryKey(), companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(), openingAmount: integer("opening_amount").notNull(), closingAmount: integer("closing_amount"), expectedAmount: integer("expected_amount"), openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(), closedAt: timestamp("closed_at", { withTimezone: true }),
}, table => [uniqueIndex("one_active_shift_per_company").on(table.companyId).where(sql`${table.closedAt} is null`)]);
export type OrderItem = { id: string; name: string; quantity: number; price: number };
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(), companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }), guestToken: text("guest_token").notNull(), requestKey: uuid("request_key").notNull().unique(), tableNumber: integer("table_number").notNull().default(8), items: jsonb("items").$type<OrderItem[]>().notNull(), total: integer("total").notNull(), status: text("status").notNull().default("new"), note: text("note"), shiftId: uuid("shift_id").references(() => shifts.id), paymentMethod: text("payment_method"), paidAt: timestamp("paid_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [index("orders_company_idx").on(table.companyId), index("orders_guest_idx").on(table.guestToken)]);
export const serviceRequests = pgTable("service_requests", {
  id: uuid("id").defaultRandom().primaryKey(), companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }), guestToken: text("guest_token").notNull(), kind: text("kind").notNull(), tableNumber: integer("table_number").notNull().default(8), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
