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
  .enum(["pending", "in_progress", "completed", "cancelled"])
  .openapi("TaskStatus");

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
