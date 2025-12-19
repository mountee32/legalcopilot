/**
 * Task Schema
 *
 * Tasks are units of work linked to matters. They can be user-created or AI-proposed
 * (AI proposals must go through ApprovalRequest).
 *
 * Enhanced to support evidence-backed compliance workflows with:
 * - Stage linking (matterStageId)
 * - Source tracking (workflow, manual, AI)
 * - Evidence requirements
 * - Approval requirements
 * - Mandatory task flagging (immutable)
 *
 * @see backlog/dev/FEAT-enhanced-task-model.md for design specification
 */

import { pgTable, text, timestamp, uuid, pgEnum, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { matters } from "./matters";
import { users } from "./users";

// Note: We intentionally don't import assigneeRoleEnum from task-templates.ts
// to avoid a circular dependency (task-templates imports taskPriorityEnum from here).
// The requiredApproverRole field uses text with application-level validation against
// the assigneeRoleEnum values: "fee_earner", "supervisor", "paralegal", "secretary"

export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);

/**
 * Task status enum.
 * Extended to include skipped and not_applicable for workflow compliance.
 */
export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
  "skipped", // Deliberately skipped with justification (logged exception)
  "not_applicable", // Should not exist for this matter (logged exception)
]);

export const taskAiSourceEnum = pgEnum("task_ai_source", ["email", "document", "matter", "other"]);

/**
 * How was this task created?
 * Used for audit trail and to distinguish workflow-generated tasks from manual ones.
 */
export const taskSourceEnum = pgEnum("task_source", [
  "workflow", // Created from workflow template on matter activation
  "workflow_change", // Injected due to workflow change mid-matter
  "manual", // Manually created by user
  "ai", // Created by AI (must go through approval)
]);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    description: text("description"),

    assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),

    priority: taskPriorityEnum("priority").notNull().default("medium"),
    status: taskStatusEnum("status").notNull().default("pending"),

    dueDate: timestamp("due_date"),
    completedAt: timestamp("completed_at"),

    checklistItems: jsonb("checklist_items"),
    tags: jsonb("tags"),

    aiGenerated: boolean("ai_generated").notNull().default(false),
    aiSource: taskAiSourceEnum("ai_source"),

    sourceEntityType: text("source_entity_type"),
    sourceEntityId: uuid("source_entity_id"),

    /** Template item this task was created from (if any) */
    templateItemId: uuid("template_item_id"),

    // ═══════════════════════════════════════════════════════════════════════════
    // Enhanced Task Model Fields (Phase 1)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Stage this task belongs to (if from workflow).
     * References matterStages.id - FK enforced at application level to avoid
     * circular import (workflows.ts imports taskPriorityEnum from this file).
     */
    matterStageId: uuid("matter_stage_id"),

    /**
     * Source workflow task template ID (if from workflow).
     * References workflowTaskTemplates.id - FK enforced at application level.
     */
    workflowTaskTemplateId: uuid("workflow_task_template_id"),

    /** How was this task created? */
    source: taskSourceEnum("source").notNull().default("manual"),

    /**
     * Is this task mandatory for stage completion?
     * WARNING: This field is IMMUTABLE after creation.
     * Service layer MUST reject any update that attempts to change this value.
     */
    isMandatory: boolean("is_mandatory").notNull().default(false),

    /** Does this task require evidence to complete? */
    requiresEvidence: boolean("requires_evidence").notNull().default(false),

    /**
     * Required evidence types for this task (denormalized from template).
     * Array of evidence type codes, e.g. ["id_document", "proof_of_address"]
     * Persisted on instance so template changes don't affect historical requirements.
     */
    requiredEvidenceTypes: jsonb("required_evidence_types"), // string[] | null

    /** Must evidence be verified (not just attached) for completion? */
    requiresVerifiedEvidence: boolean("requires_verified_evidence").notNull().default(true),

    /** Does this task require approval to complete? */
    requiresApproval: boolean("requires_approval").notNull().default(false),

    /**
     * Who can approve this task? (null = any supervisor)
     * Values: "fee_earner" | "supervisor" | "paralegal" | "secretary"
     * Validated at application layer to match assigneeRoleEnum.
     */
    requiredApproverRole: text("required_approver_role"),

    /** Approval status (if requiresApproval) */
    approvalStatus: text("approval_status"), // "pending" | "approved" | "rejected"

    /** Who approved (if approved) */
    approvedById: uuid("approved_by_id").references(() => users.id, { onDelete: "set null" }),

    /** When approved */
    approvedAt: timestamp("approved_at"),

    /** Is this task visible to clients in portal? */
    clientVisible: boolean("client_visible").notNull().default(false),

    /** Regulatory/legal basis for this task (for audit) */
    regulatoryBasis: text("regulatory_basis"),

    // ═══════════════════════════════════════════════════════════════════════════

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmStatusIdx: index("tasks_firm_status_idx").on(t.firmId, t.status),
    firmAssigneeIdx: index("tasks_firm_assignee_idx").on(t.firmId, t.assigneeId),
    firmMatterIdx: index("tasks_firm_matter_idx").on(t.firmId, t.matterId),
    /** Index for finding tasks by workflow stage */
    matterStageIdx: index("tasks_matter_stage_idx").on(t.matterStageId),
  })
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
