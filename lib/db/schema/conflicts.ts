/**
 * Conflict Checking Schema
 *
 * Persisted conflict check searches and decisions.
 */

import { pgTable, text, timestamp, uuid, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { matters } from "./matters";
import { users } from "./users";

export const conflictCheckStatusEnum = pgEnum("conflict_check_status", [
  "pending",
  "clear",
  "conflict",
  "waived",
]);

export const conflictChecks = pgTable(
  "conflict_checks",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),

    searchTerms: jsonb("search_terms"),
    results: jsonb("results"),

    status: conflictCheckStatusEnum("status").notNull().default("pending"),

    decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at"),
    decisionReason: text("decision_reason"),
    waiverReason: text("waiver_reason"),

    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmMatterIdx: index("conflict_checks_firm_matter_idx").on(t.firmId, t.matterId),
    firmStatusIdx: index("conflict_checks_firm_status_idx").on(t.firmId, t.status),
  })
);

export type ConflictCheck = typeof conflictChecks.$inferSelect;
export type NewConflictCheck = typeof conflictChecks.$inferInsert;
