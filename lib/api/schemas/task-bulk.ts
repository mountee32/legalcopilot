/**
 * Bulk Task Operation Schemas
 *
 * Zod schemas for bulk task operations.
 * All bulk operations accept an array of task IDs (min: 1, max: 200).
 *
 * @see lib/db/schema/tasks.ts for database schema
 */

import { z, UuidSchema, DateTimeSchema } from "./common";

/** Maximum number of tasks that can be processed in a single bulk operation */
export const BULK_TASK_LIMIT = 200;

/**
 * Base schema for bulk task operations.
 * All bulk operations require an array of task IDs.
 */
export const BulkTaskIdsSchema = z
  .object({
    ids: z
      .array(UuidSchema)
      .min(1, "At least one task ID is required")
      .max(BULK_TASK_LIMIT, `Maximum ${BULK_TASK_LIMIT} tasks per operation`),
  })
  .openapi("BulkTaskIds");

/**
 * Schema for bulk completing tasks.
 * Only non-mandatory tasks without evidence/approval requirements can be bulk completed.
 */
export const BulkCompleteTasksSchema = BulkTaskIdsSchema.extend({
  notes: z.string().max(2000).optional(),
}).openapi("BulkCompleteTasksRequest");

/**
 * Schema for bulk assigning tasks.
 */
export const BulkAssignTasksSchema = BulkTaskIdsSchema.extend({
  assigneeId: UuidSchema.nullable(),
}).openapi("BulkAssignTasksRequest");

/**
 * Schema for bulk setting due dates.
 */
export const BulkSetDueDateSchema = BulkTaskIdsSchema.extend({
  dueDate: DateTimeSchema.nullable(),
}).openapi("BulkSetDueDateRequest");

/**
 * Response schema for bulk operations.
 */
export const BulkTaskResultSchema = z
  .object({
    success: z.boolean(),
    processed: z.number(),
    failed: z.number(),
    results: z.array(
      z.object({
        id: UuidSchema,
        success: z.boolean(),
        error: z.string().optional(),
      })
    ),
  })
  .openapi("BulkTaskResult");
