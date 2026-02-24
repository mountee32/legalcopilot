/**
 * Task Templates Schema
 *
 * Defines templates for tasks that can be applied to matters based on practice area and sub-type.
 * Templates can be system-level (firmId=null) for regulatory requirements or firm-level for custom workflows.
 *
 * @see lib/constants/practice-sub-types.ts for valid sub-types per practice area
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

/**
 * Task template category.
 * - regulatory: bar/regulatory requirements (AML, conflict checks) - system locked
 * - legal: Court/statutory requirements - system locked
 * - firm_policy: Firm's internal policies - firm editable
 * - best_practice: Recommended steps - firm editable
 */
export const taskTemplateCategoryEnum = pgEnum("task_template_category", [
  "regulatory",
  "legal",
  "firm_policy",
  "best_practice",
]);

/**
 * Assignee role for automatic assignment when template is applied.
 */
export const assigneeRoleEnum = pgEnum("assignee_role", [
  "fee_earner",
  "supervisor",
  "paralegal",
  "secretary",
]);

/**
 * Due date anchor for relative due date calculation.
 */
export const dueDateAnchorEnum = pgEnum("due_date_anchor", [
  "matter_opened",
  "key_deadline",
  "completion",
]);

/**
 * Task template definitions.
 * Templates group tasks for a specific practice area and sub-type.
 * System templates (firmId=null) provide regulatory defaults.
 */
export const taskTemplates = pgTable(
  "task_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Null = system template (regulatory/legal), otherwise firm-specific */
    firmId: uuid("firm_id").references(() => firms.id, { onDelete: "cascade" }),

    /** Display name e.g. "Freehold Purchase - Standard" */
    name: text("name").notNull(),

    /** Optional description of the template */
    description: text("description"),

    /** Practice area this template applies to */
    practiceArea: practiceAreaEnum("practice_area").notNull(),

    /** Sub-type within practice area e.g. "freehold_purchase" */
    subType: text("sub_type").notNull(),

    /** If true, auto-suggested when practice area and sub-type match */
    isDefault: boolean("is_default").notNull().default(false),

    /** Whether the template is active and available for use */
    isActive: boolean("is_active").notNull().default(true),

    /** User who created the template (null for system templates) */
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    /** Index for finding templates by practice area and sub-type */
    practiceAreaSubTypeIdx: index("task_templates_practice_area_sub_type_idx").on(
      t.practiceArea,
      t.subType
    ),
    /** Index for firm-specific templates */
    firmIdIdx: index("task_templates_firm_id_idx").on(t.firmId),
    /** Unique name per firm (null firmId = system templates) */
    uniqueNamePerFirm: uniqueIndex("task_templates_firm_name_unique").on(t.firmId, t.name),
  })
);

/**
 * Individual task items within a template.
 * Each item defines a task that will be created when the template is applied.
 */
export const taskTemplateItems = pgTable(
  "task_template_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Parent template */
    templateId: uuid("template_id")
      .notNull()
      .references(() => taskTemplates.id, { onDelete: "cascade" }),

    /** Task title */
    title: text("title").notNull(),

    /** Optional task description */
    description: text("description"),

    /** Whether this task must be created (user cannot skip) */
    mandatory: boolean("mandatory").notNull().default(false),

    /** Category for grouping and permissions */
    category: taskTemplateCategoryEnum("category").notNull(),

    /** Default priority when task is created */
    defaultPriority: taskPriorityEnum("default_priority").notNull().default("medium"),

    /** Days from anchor date for due date calculation */
    relativeDueDays: integer("relative_due_days"),

    /** What date to calculate relative due date from */
    dueDateAnchor: dueDateAnchorEnum("due_date_anchor"),

    /** Role to auto-assign task to (resolved at creation time) */
    assigneeRole: assigneeRoleEnum("assignee_role"),

    /** Sub-task checklist items as JSON array */
    checklistItems: jsonb("checklist_items"),

    /** Order within template (lower = first) */
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    /** Index for ordering items within a template */
    templateSortOrderIdx: index("task_template_items_template_sort_idx").on(
      t.templateId,
      t.sortOrder
    ),
  })
);

/**
 * Records when a template was applied to a matter.
 * Tracks which items were created, modified, or skipped.
 */
export const matterTemplateApplications = pgTable(
  "matter_template_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Matter the template was applied to */
    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),

    /** Template that was applied */
    templateId: uuid("template_id")
      .notNull()
      .references(() => taskTemplates.id, { onDelete: "restrict" }),

    /** When the template was applied */
    appliedAt: timestamp("applied_at").defaultNow().notNull(),

    /** User who applied the template */
    appliedById: uuid("applied_by_id").references(() => users.id, { onDelete: "set null" }),

    /**
     * Record of items and their outcomes.
     * Array of: { templateItemId, taskId?, wasModified, wasSkipped }
     */
    itemsApplied: jsonb("items_applied").notNull(),
  },
  (t) => ({
    /** Index for finding applications by matter */
    matterIdIdx: index("matter_template_applications_matter_idx").on(t.matterId),
  })
);

// Type exports
export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type NewTaskTemplate = typeof taskTemplates.$inferInsert;

export type TaskTemplateItem = typeof taskTemplateItems.$inferSelect;
export type NewTaskTemplateItem = typeof taskTemplateItems.$inferInsert;

export type MatterTemplateApplication = typeof matterTemplateApplications.$inferSelect;
export type NewMatterTemplateApplication = typeof matterTemplateApplications.$inferInsert;

/** Shape of itemsApplied JSON field */
export interface TemplateItemApplication {
  templateItemId: string;
  taskId?: string;
  wasModified: boolean;
  wasSkipped: boolean;
}
