/**
 * Email Import API Schemas
 *
 * Request/response validation for email import endpoints.
 *
 * @see lib/db/schema/email-imports.ts for database schema
 */

import { z, UuidSchema, DateTimeSchema } from "./common";

// ---------------------------------------------------------------------------
// Enum schemas
// ---------------------------------------------------------------------------

export const EmailImportMatchMethodSchema = z
  .enum(["subject_reference", "sender_domain", "per_matter_alias", "ai_match", "manual"])
  .openapi("EmailImportMatchMethod");

export const EmailImportStatusSchema = z
  .enum(["matched", "unmatched", "processing", "completed", "failed", "skipped"])
  .openapi("EmailImportStatus");

// ---------------------------------------------------------------------------
// Email Import record
// ---------------------------------------------------------------------------

export const EmailImportSchema = z
  .object({
    id: UuidSchema,
    firmId: UuidSchema,
    emailAccountId: UuidSchema,
    externalMessageId: z.string(),
    externalThreadId: z.string().nullable(),
    fromAddress: z.string(),
    subject: z.string(),
    receivedAt: DateTimeSchema,
    matterId: UuidSchema.nullable(),
    matchMethod: EmailImportMatchMethodSchema.nullable(),
    matchConfidence: z.string().nullable(),
    status: EmailImportStatusSchema,
    attachmentCount: z.number().int(),
    documentsCreated: z.array(z.string()).nullable(),
    pipelineRunIds: z.array(z.string()).nullable(),
    emailId: UuidSchema.nullable(),
    error: z.string().nullable(),
    processedAt: DateTimeSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("EmailImport");

// ---------------------------------------------------------------------------
// Query / List
// ---------------------------------------------------------------------------

export const EmailImportQuerySchema = z
  .object({
    status: EmailImportStatusSchema.optional(),
    matterId: UuidSchema.optional(),
    emailAccountId: UuidSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  })
  .openapi("EmailImportQuery");

export const EmailImportListSchema = z
  .object({
    imports: z.array(EmailImportSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
  })
  .openapi("EmailImportListResponse");

// ---------------------------------------------------------------------------
// Route (manual routing of unmatched import)
// ---------------------------------------------------------------------------

export const RouteEmailImportSchema = z
  .object({
    matterId: UuidSchema,
  })
  .openapi("RouteEmailImportRequest");

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type EmailImport = z.infer<typeof EmailImportSchema>;
export type EmailImportQuery = z.infer<typeof EmailImportQuerySchema>;
export type RouteEmailImport = z.infer<typeof RouteEmailImportSchema>;
