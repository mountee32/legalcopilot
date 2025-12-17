/**
 * Firm (Tenant) Schema
 *
 * Multi-tenant boundary for the application.
 * All business data is scoped to a firm.
 */

import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

/**
 * A law firm/tenant.
 */
export const firms = pgTable("firms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Firm = typeof firms.$inferSelect;
export type NewFirm = typeof firms.$inferInsert;
