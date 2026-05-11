import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull().default("default"),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  courseId: integer("course_id"),
  stage: text("stage").notNull().default("Leads Frios"),
  source: text("source").notNull().default(""),
  payment: text("payment").notNull().default(""),
  lossReason: text("loss_reason").notNull().default(""),
  value: integer("value").notNull().default(0),
  type: text("type").notNull().default("Curso"),
  notes: text("notes").notNull().default(""),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
