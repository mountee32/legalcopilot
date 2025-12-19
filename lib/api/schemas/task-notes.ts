/**
 * Task Notes API Schemas
 *
 * @see lib/db/schema/task-notes.ts for database schema
 */

import { z, UuidSchema, DateTimeSchema, PaginationSchema, PaginationMetaSchema } from "./common";

/**
 * Note visibility level.
 */
export const NoteVisibilitySchema = z
  .enum(["internal", "client_visible"])
  .openapi("NoteVisibility");

/**
 * Task note entity.
 */
export const TaskNoteSchema = z
  .object({
    id: UuidSchema,
    taskId: UuidSchema,
    content: z.string(),
    visibility: NoteVisibilitySchema,
    authorId: UuidSchema,
    authorName: z.string().optional(), // Joined from users table
    originalNoteId: UuidSchema.nullable(),
    version: z.number().int(),
    isCurrent: z.boolean(),
    createdAt: DateTimeSchema,
  })
  .openapi("TaskNote");

/**
 * Task note attachment entity.
 */
export const TaskNoteAttachmentSchema = z
  .object({
    id: UuidSchema,
    noteId: UuidSchema,
    documentId: UuidSchema,
    documentName: z.string().optional(), // Joined from documents table
    createdAt: DateTimeSchema,
  })
  .openapi("TaskNoteAttachment");

/**
 * Create task note request.
 */
export const CreateTaskNoteSchema = z
  .object({
    content: z.string().min(1).max(50_000),
    visibility: NoteVisibilitySchema.default("internal"),
    attachmentIds: z.array(UuidSchema).max(10).optional(),
  })
  .openapi("CreateTaskNoteRequest");

/**
 * Update task note request (creates new version).
 */
export const UpdateTaskNoteSchema = z
  .object({
    content: z.string().min(1).max(50_000),
    visibility: NoteVisibilitySchema.optional(),
  })
  .openapi("UpdateTaskNoteRequest");

/**
 * Query parameters for listing task notes.
 */
export const TaskNoteQuerySchema = PaginationSchema.extend({
  includeHistory: z.coerce.boolean().default(false).openapi({
    description: "Include previous versions of edited notes",
  }),
  visibility: NoteVisibilitySchema.optional(),
}).openapi("TaskNoteQuery");

/**
 * Task notes list response.
 */
export const TaskNoteListSchema = z
  .object({
    notes: z.array(TaskNoteSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("TaskNoteListResponse");

/**
 * Task note with attachments response.
 */
export const TaskNoteWithAttachmentsSchema = TaskNoteSchema.extend({
  attachments: z.array(TaskNoteAttachmentSchema),
}).openapi("TaskNoteWithAttachments");

// Type exports
export type TaskNote = z.infer<typeof TaskNoteSchema>;
export type CreateTaskNote = z.infer<typeof CreateTaskNoteSchema>;
export type UpdateTaskNote = z.infer<typeof UpdateTaskNoteSchema>;
export type TaskNoteQuery = z.infer<typeof TaskNoteQuerySchema>;
export type TaskNoteAttachment = z.infer<typeof TaskNoteAttachmentSchema>;
