import { pgTable, serial, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull().default("default"),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  cpf: text("cpf").notNull().default(""),       // ← dado sensível - LGPD
  city: text("city").notNull().default(""),
  since: text("since").notNull().default(""),
  courses: jsonb("courses").notNull().$type<number[]>().default([]),
  contract: boolean("contract").notNull().default(false),
  pType: text("p_type").notNull().default("avista"),
  pMethod: text("p_method").notNull().default("PIX"),
  totalValue: integer("total_value").notNull().default(0),
  installments: integer("installments").notNull().default(0),
  instValue: integer("inst_value").notNull().default(0),
  payDay: integer("pay_day"),
  startMonth: text("start_month").notNull().default(""),
  paidMonths: jsonb("paid_months").notNull().$type<number[]>().default([]),
  paid: boolean("paid").notNull().default(false),
  certificate: jsonb("certificate").notNull().$type<number[]>().default([]),
  interests: jsonb("interests").notNull().$type<number[]>().default([]),
  notes: text("notes").notNull().default(""),
  enrollmentDates: jsonb("enrollment_dates").notNull().$type<Record<string,string>>().default({}),
  pedDocs: jsonb("ped_docs").notNull().$type<Record<string,unknown[]>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
