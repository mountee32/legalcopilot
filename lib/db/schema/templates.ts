/**
 * Templates Schema
 *
 * Firm and system templates for documents/emails.
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  boolean,
  index,
  uniqueIndex,
  integer,
} from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";

export const templateTypeEnum = pgEnum("template_type", ["document", "email"]);

export const templates = pgTable(
  "templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Null = system template */
    firmId: uuid("firm_id").references(() => firms.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    type: templateTypeEnum("type").notNull(),
    category: text("category"),

    content: text("content").notNull(),
    mergeFields: jsonb("merge_fields"),

    isActive: boolean("is_active").notNull().default(true),

    parentId: uuid("parent_id"),
    version: integer("version").notNull().default(1),

    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmTypeIdx: index("templates_firm_type_idx").on(t.firmId, t.type),
    firmNameIdx: index("templates_firm_name_idx").on(t.firmId, t.name),
    firmParentVersionUnique: uniqueIndex("templates_firm_parent_version_unique").on(
      t.firmId,
      t.parentId,
      t.version
    ),
  })
);

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
