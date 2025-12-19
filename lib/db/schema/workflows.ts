/**
 * Workflow Templates & Stages Schema
 *
 * System-defined workflow templates with stages for compliance workflows.
 * Matters pin to a specific workflow version at creation.
 *
 * Tables (in dependency order):
 * 1. workflowTemplates - System templates (key, version, practiceArea, subTypes)
 * 2. workflowStages - Stages with gating (hard/soft/none)
 * 3. workflowTaskTemplates - Task templates within stages
 * 4. matterWorkflows - Instance pinned to matter + version
 * 5. matterStages - Stage instances with status tracking
 *
 * @see backlog/dev/FEAT-enhanced-task-model.md for design specification
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  boolean,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { matters, practiceAreaEnum } from "./matters";
import { users } from "./users";
import { taskPriorityEnum } from "./tasks";
import { assigneeRoleEnum } from "./task-templates";

// ═══════════════════════════════════════════════════════════════════════════
// Enums
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gate type for workflow stages.
 * - hard: Cannot proceed to next stage until this stage is complete
 * - soft: Warning shown, but can override and proceed
 * - none: No gating, tasks are informational
 */
export const workflowGateTypeEnum = pgEnum("workflow_gate_type", ["hard", "soft", "none"]);

/**
 * What a relative due date is calculated from.
 */
export const dueDateRelativeToEnum = pgEnum("due_date_relative_to", [
  "stage_started",
  "task_created",
  "matter_created",
  "matter_opened",
]);

/**
 * Status of a matter stage instance.
 */
export const matterStageStatusEnum = pgEnum("matter_stage_status", [
  "pending",
  "in_progress",
  "completed",
  "skipped",
]);

// ═══════════════════════════════════════════════════════════════════════════
// Tables
// ═══════════════════════════════════════════════════════════════════════════

/**
 * System-defined workflow templates (versioned, immutable once released).
 * Workflows define the stages and tasks for a practice area.
 */
export const workflowTemplates = pgTable(
  "workflow_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Human-readable key for lookup, e.g. "residential-purchase" */
    key: text("key").notNull(),

    /** Semantic version, e.g. "2.3.0" */
    version: text("version").notNull(),

    /** Display name */
    name: text("name").notNull(),

    /** Description of the workflow */
    description: text("description"),

    /** Practice area this applies to */
    practiceArea: practiceAreaEnum("practice_area").notNull(),

    /**
     * Sub-types this workflow applies to (null = all sub-types in practice area).
     * Array of sub-type strings, e.g. ["freehold_purchase", "leasehold_purchase"]
     */
    subTypes: jsonb("sub_types"), // string[] | null

    /** Conditions for auto-selection (JSON) */
    selectionConditions: jsonb("selection_conditions"),

    /** Whether this is the default for the practice area + sub-type */
    isDefault: boolean("is_default").notNull().default(false),

    /** When this version was released (immutable after this) */
    releasedAt: timestamp("released_at"),

    /** Is this version currently active for new matters? */
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    /** Unique constraint on key + version */
    keyVersionUnique: uniqueIndex("workflow_templates_key_version_unique").on(t.key, t.version),
    /** Index for finding templates by practice area */
    practiceAreaIdx: index("workflow_templates_practice_area_idx").on(t.practiceArea),
    /** Index for finding active templates */
    activeIdx: index("workflow_templates_active_idx").on(t.isActive),
  })
);

/**
 * Stages within a workflow template.
 * Stages define gates and completion criteria.
 */
export const workflowStages = pgTable(
  "workflow_stages",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    workflowTemplateId: uuid("workflow_template_id")
      .notNull()
      .references(() => workflowTemplates.id, { onDelete: "cascade" }),

    /** Stage name */
    name: text("name").notNull(),

    /** Description */
    description: text("description"),

    /** Order within workflow (lower = first) */
    sortOrder: integer("sort_order").notNull(),

    /** Gate type for this stage */
    gateType: workflowGateTypeEnum("gate_type").notNull().default("none"),

    /**
     * Completion criteria for this stage.
     * - "all_mandatory_tasks": All mandatory tasks must be resolved
     * - "all_tasks": All tasks must be resolved
     * - "custom": Custom logic (treated as all_mandatory_tasks for Phase 1)
     *
     * "Resolved" means: completed, skipped (with exception), or not_applicable (with exception)
     */
    completionCriteria: text("completion_criteria").notNull().default("all_mandatory_tasks"),

    /**
     * Conditions under which this stage applies (null = always applies).
     * Stage is skipped entirely if conditions evaluate to false.
     * Example: { "has_mortgage": true }
     *
     * Condition keys use snake_case to match YAML conventions.
     */
    applicabilityConditions: jsonb("applicability_conditions"),

    /** Is this stage visible to clients in portal? */
    clientVisible: boolean("client_visible").notNull().default(true),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    /** Index for ordering stages within a workflow */
    workflowSortOrderIdx: index("workflow_stages_workflow_sort_idx").on(
      t.workflowTemplateId,
      t.sortOrder
    ),
  })
);

/**
 * Task templates within a workflow stage.
 * Defines tasks that will be created when workflow is activated.
 */
export const workflowTaskTemplates = pgTable(
  "workflow_task_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    stageId: uuid("stage_id")
      .notNull()
      .references(() => workflowStages.id, { onDelete: "cascade" }),

    /** Task title */
    title: text("title").notNull(),

    /** Description */
    description: text("description"),

    /** Is this task mandatory for stage completion? */
    isMandatory: boolean("is_mandatory").notNull().default(false),

    /** Does this task require evidence to complete? */
    requiresEvidence: boolean("requires_evidence").notNull().default(false),

    /** Required evidence types (array of evidence type codes) */
    requiredEvidenceTypes: jsonb("required_evidence_types"), // string[] | null

    /** Must evidence be verified (not just attached) for completion? */
    requiresVerifiedEvidence: boolean("requires_verified_evidence").notNull().default(true),

    /** Does this task require approval to complete? */
    requiresApproval: boolean("requires_approval").notNull().default(false),

    /** Who can approve this task? */
    requiredApproverRole: assigneeRoleEnum("required_approver_role"),

    /** Default assignee role */
    defaultAssigneeRole: assigneeRoleEnum("default_assignee_role"),

    /** Default priority */
    defaultPriority: taskPriorityEnum("default_priority").notNull().default("medium"),

    /** Relative due date (days from anchor) */
    relativeDueDays: integer("relative_due_days"),

    /** What the due date is relative to */
    dueDateRelativeTo: dueDateRelativeToEnum("due_date_relative_to"),

    /** Is this task visible to clients in portal? */
    clientVisible: boolean("client_visible").notNull().default(false),

    /** Regulatory/legal basis for this task */
    regulatoryBasis: text("regulatory_basis"),

    /** Order within stage (lower = first) */
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    /** Index for ordering tasks within a stage */
    stageSortOrderIdx: index("workflow_task_templates_stage_sort_idx").on(t.stageId, t.sortOrder),
  })
);

/**
 * Instance of a workflow attached to a matter (pinned to version).
 * Matters can only have one active workflow at a time.
 */
export const matterWorkflows = pgTable(
  "matter_workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    /** Pinned workflow template */
    workflowTemplateId: uuid("workflow_template_id")
      .notNull()
      .references(() => workflowTemplates.id, { onDelete: "restrict" }),

    /** Pinned version (denormalized for audit) */
    workflowVersion: text("workflow_version").notNull(),

    /** When this workflow was activated on the matter */
    activatedAt: timestamp("activated_at").defaultNow().notNull(),

    /** User who activated it */
    activatedById: uuid("activated_by_id").references(() => users.id, { onDelete: "set null" }),

    /** Current stage ID (for quick lookup) */
    currentStageId: uuid("current_stage_id"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    /** Unique constraint - one workflow per matter */
    matterUnique: uniqueIndex("matter_workflows_matter_unique").on(t.matterId),
    /** Index for finding workflows by firm */
    firmIdx: index("matter_workflows_firm_idx").on(t.firmId),
    /** Index for finding workflows by template */
    templateIdx: index("matter_workflows_template_idx").on(t.workflowTemplateId),
  })
);

/**
 * Stage instances on a matter (tracks completion status).
 * Created when workflow is activated, one per workflow stage.
 */
export const matterStages = pgTable(
  "matter_stages",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    matterWorkflowId: uuid("matter_workflow_id")
      .notNull()
      .references(() => matterWorkflows.id, { onDelete: "cascade" }),

    /** Source stage template */
    workflowStageId: uuid("workflow_stage_id")
      .notNull()
      .references(() => workflowStages.id, { onDelete: "restrict" }),

    /** Stage name (denormalized for display) */
    name: text("name").notNull(),

    /** Sort order (denormalized for ordering) */
    sortOrder: integer("sort_order").notNull(),

    /**
     * Status of this stage instance.
     * - pending: Not started
     * - in_progress: Active (first task started or previous stage completed)
     * - completed: All completion criteria met
     * - skipped: Stage does not apply (applicability conditions not met)
     */
    status: matterStageStatusEnum("status").notNull().default("pending"),

    /** Why this stage was skipped (if status = skipped) */
    skippedReason: text("skipped_reason"),

    /**
     * When stage was started.
     * Set automatically when:
     * - First task in stage moves to in_progress, OR
     * - Previous stage completes
     */
    startedAt: timestamp("started_at"),

    /** When stage was completed */
    completedAt: timestamp("completed_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    /** Index for finding stages by workflow */
    workflowIdx: index("matter_stages_workflow_idx").on(t.matterWorkflowId),
    /** Index for ordering stages */
    sortOrderIdx: index("matter_stages_sort_order_idx").on(t.matterWorkflowId, t.sortOrder),
  })
);

// ═══════════════════════════════════════════════════════════════════════════
// Type Exports
// ═══════════════════════════════════════════════════════════════════════════

export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type NewWorkflowTemplate = typeof workflowTemplates.$inferInsert;

export type WorkflowStage = typeof workflowStages.$inferSelect;
export type NewWorkflowStage = typeof workflowStages.$inferInsert;

export type WorkflowTaskTemplate = typeof workflowTaskTemplates.$inferSelect;
export type NewWorkflowTaskTemplate = typeof workflowTaskTemplates.$inferInsert;

export type MatterWorkflow = typeof matterWorkflows.$inferSelect;
export type NewMatterWorkflow = typeof matterWorkflows.$inferInsert;

export type MatterStage = typeof matterStages.$inferSelect;
export type NewMatterStage = typeof matterStages.$inferInsert;

/** Applicability condition structure */
export interface ApplicabilityConditions {
  [key: string]: boolean | string | number;
}

/** Selection condition structure */
export interface SelectionConditions {
  [key: string]: boolean | string | number;
}
