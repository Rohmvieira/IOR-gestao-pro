import { pgTable, serial, text, integer, boolean, date, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull().default("default"),
  name: text("name").notNull(),
  type: text("type").notNull(),        // Curso | Workshop | Estágio | Ambulatório
  date: date("date").notNull(),
  end: date("end").notNull(),
  modality: text("modality").notNull(), // Presencial | Online | Híbrido
  value: integer("value").notNull().default(0),
  capacity: integer("capacity").notNull().default(12),
  enrolled: jsonb("enrolled").notNull().$type<number[]>().default([]),
  waitlist: jsonb("waitlist").notNull().$type<number[]>().default([]),
  instructor: text("instructor").notNull().default(""),
  desc: text("desc").notNull().default(""),
  checklist: jsonb("checklist").notNull().$type<string[]>().default([]),
  checklistDeadlines: jsonb("checklist_deadlines").notNull().$type<Record<string,string>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;
