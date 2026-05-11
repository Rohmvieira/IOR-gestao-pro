import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull().default("default"),
  product: text("product").notNull(),
  client: text("client").notNull().default(""),
  qty: integer("qty").notNull().default(1),
  value: integer("value").notNull().default(0),
  notes: text("notes").notNull().default(""),
  stage: text("stage").notNull().default("Nota Fiscal"),
  date: text("date").notNull(),
  documents: jsonb("documents").notNull().$type<unknown[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
