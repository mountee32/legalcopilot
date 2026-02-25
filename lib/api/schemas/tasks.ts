/**
 * Task API Schemas
 *
 * @see lib/db/schema/tasks.ts for database schema
 */

import { z, UuidSchema, DateTimeSchema, PaginationSchema, PaginationMetaSchema } from "./common";

export const TaskPrioritySchema = z
  .enum(["low", "medium", "high", "urgent"])
  .openapi("TaskPriority");

export const TaskStatusSchema = z
  .enum(["pending", "in_progress", "completed", "cancelled", "skipped", "not_applicable"])
  .openapi("TaskStatus");

export const TaskSourceSchema = z
  .enum(["workflow", "workflow_change", "manual", "ai"])
  .openapi("TaskSource");

export const ApprovalStatusSchema = z
  .enum(["pending", "approved", "rejected"])
  .openapi("ApprovalStatus");

export const TaskAiSourceSchema = z
  .enum(["email", "document", "matter", "other"])
  .openapi("TaskAiSource");

export const TaskSchema = z
  .object({
    id: UuidSchema,
    matterId: UuidSchema,
    title: z.string(),
    description: z.string().nullable(),
    assigneeId: UuidSchema.nullable(),
    createdById: UuidSchema.nullable(),
    priority: TaskPrioritySchema,
    status: TaskStatusSchema,
    dueDate: DateTimeSchema.nullable(),
    completedAt: DateTimeSchema.nullable(),
    checklistItems: z.array(z.unknown()).nullable(),
    tags: z.array(z.unknown()).nullable(),
    aiGenerated: z.boolean(),
    aiSource: TaskAiSourceSchema.nullable(),
    sourceEntityType: z.string().nullable(),
    sourceEntityId: UuidSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("Task");

export const CreateTaskSchema = z
  .object({
    matterId: UuidSchema,
    title: z.string().min(1).max(200),
    description: z.string().max(10_000).optional(),
    assigneeId: UuidSchema.optional(),
    priority: TaskPrioritySchema.optional(),
    dueDate: DateTimeSchema.optional(),
    checklistItems: z.array(z.unknown()).optional(),
    tags: z.array(z.unknown()).optional(),
  })
  .openapi("CreateTaskRequest");

export const UpdateTaskSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(10_000).optional(),
    assigneeId: UuidSchema.nullable().optional(),
    priority: TaskPrioritySchema.optional(),
    status: TaskStatusSchema.optional(),
    dueDate: DateTimeSchema.nullable().optional(),
    checklistItems: z.array(z.unknown()).nullable().optional(),
    tags: z.array(z.unknown()).nullable().optional(),
  })
  .openapi("UpdateTaskRequest");

export const TaskQuerySchema = PaginationSchema.extend({
  matterId: UuidSchema.optional(),
  assigneeId: UuidSchema.optional(),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  aiGenerated: z
    .preprocess((v) => {
      if (v === undefined || v === "") return undefined;
      if (v === "true") return true;
      if (v === "false") return false;
      return v;
    }, z.boolean().optional())
    .optional(),
}).openapi("TaskQuery");

export const TaskListSchema = z
  .object({
    tasks: z.array(TaskSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("TaskListResponse");

export const GenerateTasksSchema = z
  .object({
    goal: z.string().max(2000).optional(),
  })
  .openapi("GenerateTasksRequest");

// ═══════════════════════════════════════════════════════════════════════════
// Task Action Schemas (Phase 3: Task Status Extensions)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Schema for skipping a task.
 * Requires a reason for audit trail.
 */
export const SkipTaskSchema = z
  .object({
    reason: z
      .string()
      .min(10, "Reason must be at least 10 characters")
      .max(2000, "Reason must be at most 2000 characters"),
  })
  .openapi("SkipTaskRequest");

/**
 * Schema for marking a task as not applicable.
 * Requires a reason for audit trail.
 */
export const MarkNotApplicableSchema = z
  .object({
    reason: z
      .string()
      .min(10, "Reason must be at least 10 characters")
      .max(2000, "Reason must be at most 2000 characters"),
  })
  .openapi("MarkNotApplicableRequest");

/**
 * Schema for requesting approval on a task.
 * Optional notes can be included for the approver.
 */
export const RequestApprovalSchema = z
  .object({
    notes: z.string().max(2000).optional(),
  })
  .openapi("RequestApprovalRequest");

/**
 * Schema for approving a task.
 * Optional notes can be included.
 */
export const ApproveTaskSchema = z
  .object({
    notes: z.string().max(2000).optional(),
  })
  .openapi("ApproveTaskRequest");

/**
 * Schema for rejecting a task approval.
 * Requires a reason explaining why approval was rejected.
 */
export const RejectTaskSchema = z
  .object({
    reason: z
      .string()
      .min(10, "Reason must be at least 10 characters")
      .max(2000, "Reason must be at most 2000 characters"),
  })
  .openapi("RejectTaskRequest");

/**
 * Schema for completing a task.
 * Optional notes can be included.
 */
export const CompleteTaskSchema = z
  .object({
    notes: z.string().max(2000).optional(),
  })
  .openapi("CompleteTaskRequest");
