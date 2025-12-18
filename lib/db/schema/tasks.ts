/**
 * Task Schema
 *
 * Tasks are units of work linked to matters. They can be user-created or AI-proposed
 * (AI proposals must go through ApprovalRequest).
 */

import { pgTable, text, timestamp, uuid, pgEnum, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { matters } from "./matters";
import { users } from "./users";

export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

export const taskAiSourceEnum = pgEnum("task_ai_source", ["email", "document", "matter", "other"]);

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

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmStatusIdx: index("tasks_firm_status_idx").on(t.firmId, t.status),
    firmAssigneeIdx: index("tasks_firm_assignee_idx").on(t.firmId, t.assigneeId),
    firmMatterIdx: index("tasks_firm_matter_idx").on(t.firmId, t.matterId),
  })
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
