import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull().default("default"),
  date: text("date").notNull(),
  studentId: integer("student_id"),
  desc: text("desc").notNull(),
  value: integer("value").notNull().default(0),
  payment: text("payment").notNull().default("PIX"),
  type: text("type").notNull().default("Curso"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSaleSchema = createInsertSchema(salesTable).omit({ id: true, createdAt: true });
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof salesTable.$inferSelect;
