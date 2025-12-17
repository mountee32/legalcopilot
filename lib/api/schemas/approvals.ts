/**
 * Approval API Schemas
 *
 * Central approval queue used to enforce "AI drafts, humans approve".
 *
 * @see lib/db/schema/approvals.ts for database schema
 */

import { z, UuidSchema, DateTimeSchema, PaginationSchema } from "./common";

export const ApprovalSourceSchema = z.enum(["ai", "system", "user"]).openapi({
  example: "ai",
  description: "Origin of the approval request",
});

export const ApprovalStatusSchema = z
  .enum(["pending", "approved", "rejected", "cancelled", "expired"])
  .openapi({
    example: "pending",
    description: "Approval decision status",
  });

export const ApprovalExecutionStatusSchema = z
  .enum(["not_executed", "executed", "failed"])
  .openapi({
    example: "not_executed",
    description: "Execution status after approval",
  });

export const ApprovalRequestSchema = z
  .object({
    id: UuidSchema,
    sourceType: ApprovalSourceSchema,
    sourceId: UuidSchema.nullable(),
    action: z.string().openapi({ example: "email.send" }),
    summary: z.string(),
    proposedPayload: z.record(z.unknown()).nullable(),
    entityType: z.string().nullable(),
    entityId: UuidSchema.nullable(),
    matterId: UuidSchema.nullable(),
    status: ApprovalStatusSchema,
    decidedBy: UuidSchema.nullable(),
    decidedAt: DateTimeSchema.nullable(),
    decisionReason: z.string().nullable(),
    executedAt: DateTimeSchema.nullable(),
    executionStatus: ApprovalExecutionStatusSchema,
    executionError: z.string().nullable(),
    aiMetadata: z.record(z.unknown()).nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("ApprovalRequest");

export const ApprovalQuerySchema = PaginationSchema.extend({
  status: ApprovalStatusSchema.optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: UuidSchema.optional(),
}).openapi("ApprovalQuery");

export const CreateApprovalRequestSchema = z
  .object({
    sourceType: ApprovalSourceSchema.optional(),
    sourceId: UuidSchema.optional(),
    action: z.string().openapi({ example: "email.send" }),
    summary: z.string(),
    proposedPayload: z.record(z.unknown()).optional(),
    entityType: z.string().optional(),
    entityId: UuidSchema.optional(),
    matterId: UuidSchema.optional(),
    aiMetadata: z.record(z.unknown()).optional(),
  })
  .openapi("CreateApprovalRequest");

export const ApprovalListSchema = z
  .object({
    approvals: z.array(ApprovalRequestSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi("ApprovalListResponse");

export const ApproveRequestSchema = z
  .object({
    decisionReason: z.string().optional(),
  })
  .openapi("ApproveRequest");

export const BulkApproveRequestSchema = z
  .object({
    ids: z.array(UuidSchema).min(1),
    decisionReason: z.string().optional(),
  })
  .openapi("BulkApproveRequest");

export const BulkApproveResponseSchema = z
  .object({
    approvals: z.array(ApprovalRequestSchema),
  })
  .openapi("BulkApproveResponse");

export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;
export type ApprovalQuery = z.infer<typeof ApprovalQuerySchema>;
export type CreateApprovalRequest = z.infer<typeof CreateApprovalRequestSchema>;
