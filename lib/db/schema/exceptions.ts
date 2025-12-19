/**
 * Exception/Override Log Schema
 *
 * Records when tasks are skipped or gates are overridden.
 * Critical for audit trail and regulatory compliance.
 *
 * @see backlog/dev/FEAT-enhanced-task-model.md for design specification
 */

import { pgTable, text, timestamp, uuid, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";

/**
 * Type of exception/override.
 * - skipped: Task was applicable but deliberately not done
 * - not_applicable: Task should not exist for this matter
 * - gate_override: Stage gate was overridden to proceed
 */
export const exceptionTypeEnum = pgEnum("exception_type", [
  "skipped",
  "not_applicable",
  "gate_override",
]);

/**
 * Source of the decision to create exception.
 * - user: Human decision
 * - system: System/automation decision (e.g., applicability conditions)
 */
export const decisionSourceEnum = pgEnum("decision_source", ["user", "system"]);

/**
 * Task exceptions log.
 * Records every instance where a task is skipped, marked not applicable,
 * or a stage gate is overridden. Essential for audit and compliance.
 */
export const taskExceptions = pgTable(
  "task_exceptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    /**
     * Type of object being excepted.
     * - "task": A task is being skipped or marked not applicable
     * - "stage": A stage gate is being overridden
     */
    objectType: text("object_type").notNull(), // "task" | "stage"

    /** ID of the object (task ID or stage ID) */
    objectId: uuid("object_id").notNull(),

    /** Type of exception */
    exceptionType: exceptionTypeEnum("exception_type").notNull(),

    /** Reason for exception (required for audit trail) */
    reason: text("reason").notNull(),

    /** Was this a human or system decision? */
    decisionSource: decisionSourceEnum("decision_source").notNull().default("user"),

    /** User who approved the exception */
    approvedById: uuid("approved_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    /** When exception was approved */
    approvedAt: timestamp("approved_at").defaultNow().notNull(),

    /**
     * Additional context for the exception.
     * May include: originalStatus, overriddenGateType, etc.
     */
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    /** Index for finding exceptions by object */
    objectIdx: index("task_exceptions_object_idx").on(t.objectType, t.objectId),
    /** Index for firm-wide exception queries */
    firmIdx: index("task_exceptions_firm_idx").on(t.firmId),
    /** Index for finding exceptions by approver */
    approverIdx: index("task_exceptions_approver_idx").on(t.approvedById),
  })
);

// Type exports
export type TaskException = typeof taskExceptions.$inferSelect;
export type NewTaskException = typeof taskExceptions.$inferInsert;
