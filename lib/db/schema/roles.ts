/**
 * Roles & Permissions (RBAC) Schema
 *
 * Firm-scoped roles with JSONB permission lists.
 * Default roles are created per firm ("admin", "fee_earner") and marked isSystem=true.
 */

import { pgTable, text, timestamp, uuid, jsonb, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { firms } from "./firms";

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),
    permissions: jsonb("permissions").notNull(),
    isSystem: boolean("is_system").notNull().default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmNameUnique: uniqueIndex("roles_firm_name_unique").on(t.firmId, t.name),
  })
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
