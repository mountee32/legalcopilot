/**
 * Approval Queue Schema
 *
 * Centralised human-in-the-loop approval requests.
 * AI can propose actions, but execution is gated by approvals.
 */

import { pgTable, text, timestamp, uuid, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";
import { matters } from "./matters";

export const approvalSourceEnum = pgEnum("approval_source", ["ai", "system", "user"]);

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "expired",
]);

export const approvalExecutionStatusEnum = pgEnum("approval_execution_status", [
  "not_executed",
  "executed",
  "failed",
]);

export const approvalRequests = pgTable(
  "approval_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    sourceType: approvalSourceEnum("source_type").notNull(),
    sourceId: uuid("source_id").references(() => users.id, { onDelete: "set null" }),

    action: text("action").notNull(), // e.g. "email.send", "matter.status_change"
    summary: text("summary").notNull(),
    proposedPayload: jsonb("proposed_payload"),

    entityType: text("entity_type"),
    entityId: uuid("entity_id"),

    /** Optional direct reference to matter for matter-level approvals */
    matterId: uuid("matter_id").references(() => matters.id, { onDelete: "cascade" }),

    status: approvalStatusEnum("status").notNull().default("pending"),
    decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at"),
    decisionReason: text("decision_reason"),

    executedAt: timestamp("executed_at"),
    executionStatus: approvalExecutionStatusEnum("execution_status")
      .notNull()
      .default("not_executed"),
    executionError: text("execution_error"),

    aiMetadata: jsonb("ai_metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmStatusIdx: index("approval_requests_firm_status_idx").on(t.firmId, t.status),
    actionIdx: index("approval_requests_action_idx").on(t.action),
    entityIdx: index("approval_requests_entity_idx").on(t.entityType, t.entityId),
    matterIdx: index("approval_requests_matter_idx").on(t.matterId),
  })
);

export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type NewApprovalRequest = typeof approvalRequests.$inferInsert;
