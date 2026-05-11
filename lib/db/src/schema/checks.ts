import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const checksTable = pgTable("checks", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull().default("default"),
  text: text("text").notNull(),
  done: boolean("done").notNull().default(false),
  priority: text("priority").notNull().default("Média"),
  due: text("due").notNull().default(""),
  assignee: text("assignee").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCheckSchema = createInsertSchema(checksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCheck = z.infer<typeof insertCheckSchema>;
export type Check = typeof checksTable.$inferSelect;
