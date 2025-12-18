/**
 * Task Template API Schemas
 *
 * @see lib/db/schema/task-templates.ts for database schema
 * @see lib/constants/practice-sub-types.ts for valid sub-types
 */

import { z, UuidSchema, DateTimeSchema, PaginationSchema, PaginationMetaSchema } from "./common";
import { TaskPrioritySchema } from "./tasks";
import { PracticeAreaSchema } from "./matters";

// ============================================================================
// Enums
// ============================================================================

export const TaskTemplateCategorySchema = z
  .enum(["regulatory", "legal", "firm_policy", "best_practice"])
  .openapi("TaskTemplateCategory");

export const AssigneeRoleSchema = z
  .enum(["fee_earner", "supervisor", "paralegal", "secretary"])
  .openapi("AssigneeRole");

export const DueDateAnchorSchema = z
  .enum(["matter_opened", "key_deadline", "completion"])
  .openapi("DueDateAnchor");

// ============================================================================
// Task Template Item Schemas
// ============================================================================

export const TaskTemplateItemSchema = z
  .object({
    id: UuidSchema,
    templateId: UuidSchema,
    title: z.string(),
    description: z.string().nullable(),
    mandatory: z.boolean(),
    category: TaskTemplateCategorySchema,
    defaultPriority: TaskPrioritySchema,
    relativeDueDays: z.number().int().nullable(),
    dueDateAnchor: DueDateAnchorSchema.nullable(),
    assigneeRole: AssigneeRoleSchema.nullable(),
    checklistItems: z.array(z.unknown()).nullable(),
    sortOrder: z.number().int(),
    createdAt: DateTimeSchema,
  })
  .openapi("TaskTemplateItem");

export const CreateTaskTemplateItemSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    mandatory: z.boolean().optional().default(false),
    category: TaskTemplateCategorySchema,
    defaultPriority: TaskPrioritySchema.optional(),
    relativeDueDays: z.number().int().min(0).max(365).optional(),
    dueDateAnchor: DueDateAnchorSchema.optional(),
    assigneeRole: AssigneeRoleSchema.optional(),
    checklistItems: z.array(z.string()).optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .openapi("CreateTaskTemplateItemRequest");

export const UpdateTaskTemplateItemSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    mandatory: z.boolean().optional(),
    category: TaskTemplateCategorySchema.optional(),
    defaultPriority: TaskPrioritySchema.optional(),
    relativeDueDays: z.number().int().min(0).max(365).nullable().optional(),
    dueDateAnchor: DueDateAnchorSchema.nullable().optional(),
    assigneeRole: AssigneeRoleSchema.nullable().optional(),
    checklistItems: z.array(z.string()).nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .openapi("UpdateTaskTemplateItemRequest");

// ============================================================================
// Task Template Schemas
// ============================================================================

export const TaskTemplateSchema = z
  .object({
    id: UuidSchema,
    firmId: UuidSchema.nullable(),
    name: z.string(),
    description: z.string().nullable(),
    practiceArea: PracticeAreaSchema,
    subType: z.string(),
    isDefault: z.boolean(),
    isActive: z.boolean(),
    createdById: UuidSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("TaskTemplate");

export const TaskTemplateWithItemsSchema = TaskTemplateSchema.extend({
  items: z.array(TaskTemplateItemSchema),
}).openapi("TaskTemplateWithItems");

export const CreateTaskTemplateSchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    practiceArea: PracticeAreaSchema,
    subType: z.string().min(1).max(100),
    isDefault: z.boolean().optional().default(false),
    isActive: z.boolean().optional().default(true),
    items: z.array(CreateTaskTemplateItemSchema).optional(),
  })
  .openapi("CreateTaskTemplateRequest");

export const UpdateTaskTemplateSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .openapi("UpdateTaskTemplateRequest");

export const TaskTemplateQuerySchema = PaginationSchema.extend({
  practiceArea: PracticeAreaSchema.optional(),
  subType: z.string().optional(),
  isActive: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  includeSystem: z
    .string()
    .transform((v) => v === "true")
    .optional()
    .default("true"),
}).openapi("TaskTemplateQuery");

export const TaskTemplateListSchema = z
  .object({
    templates: z.array(TaskTemplateSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("TaskTemplateListResponse");

// ============================================================================
// Apply Template Schemas
// ============================================================================

export const ApplyTemplateSchema = z
  .object({
    templateId: UuidSchema,
    selectedItemIds: z.array(UuidSchema).optional(),
    modifications: z
      .array(
        z.object({
          templateItemId: UuidSchema,
          title: z.string().min(1).max(200).optional(),
          description: z.string().max(5000).optional(),
          priority: TaskPrioritySchema.optional(),
          dueDate: DateTimeSchema.optional(),
          assigneeId: UuidSchema.optional(),
        })
      )
      .optional(),
  })
  .openapi("ApplyTemplateRequest");

export const ApplyTemplateResponseSchema = z
  .object({
    applicationId: UuidSchema,
    tasksCreated: z.number().int(),
    tasksSkipped: z.number().int(),
    tasks: z.array(
      z.object({
        id: UuidSchema,
        title: z.string(),
        templateItemId: UuidSchema.nullable(),
      })
    ),
  })
  .openapi("ApplyTemplateResponse");

// ============================================================================
// Template Status Schemas
// ============================================================================

export const TemplateApplicationSchema = z
  .object({
    id: UuidSchema,
    templateId: UuidSchema,
    templateName: z.string(),
    appliedAt: DateTimeSchema,
    appliedById: UuidSchema.nullable(),
    appliedByName: z.string().nullable(),
    itemsApplied: z.array(
      z.object({
        templateItemId: UuidSchema,
        taskId: UuidSchema.nullable(),
        wasModified: z.boolean(),
        wasSkipped: z.boolean(),
      })
    ),
  })
  .openapi("TemplateApplication");

export const TemplateStatusResponseSchema = z
  .object({
    applications: z.array(TemplateApplicationSchema),
    skippedItems: z.array(TaskTemplateItemSchema),
    availableTemplates: z.array(TaskTemplateSchema),
  })
  .openapi("TemplateStatusResponse");

// ============================================================================
// Type Exports
// ============================================================================

export type TaskTemplateItem = z.infer<typeof TaskTemplateItemSchema>;
export type CreateTaskTemplateItem = z.infer<typeof CreateTaskTemplateItemSchema>;
export type UpdateTaskTemplateItem = z.infer<typeof UpdateTaskTemplateItemSchema>;

export type TaskTemplate = z.infer<typeof TaskTemplateSchema>;
export type TaskTemplateWithItems = z.infer<typeof TaskTemplateWithItemsSchema>;
export type CreateTaskTemplate = z.infer<typeof CreateTaskTemplateSchema>;
export type UpdateTaskTemplate = z.infer<typeof UpdateTaskTemplateSchema>;
export type TaskTemplateQuery = z.infer<typeof TaskTemplateQuerySchema>;

export type ApplyTemplate = z.infer<typeof ApplyTemplateSchema>;
export type ApplyTemplateResponse = z.infer<typeof ApplyTemplateResponseSchema>;
export type TemplateStatusResponse = z.infer<typeof TemplateStatusResponseSchema>;
