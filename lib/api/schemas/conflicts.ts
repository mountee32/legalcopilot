/**
 * Conflict Check API Schemas
 *
 * @see lib/db/schema/conflicts.ts for database schema
 */

import { z, UuidSchema, DateTimeSchema } from "./common";

export const ConflictCheckStatusSchema = z
  .enum(["pending", "clear", "conflict", "waived"])
  .openapi("ConflictCheckStatus");

export const ConflictCheckSchema = z
  .object({
    id: UuidSchema,
    matterId: UuidSchema,
    searchTerms: z.record(z.unknown()).nullable(),
    results: z.record(z.unknown()).nullable(),
    status: ConflictCheckStatusSchema,
    decidedBy: UuidSchema.nullable(),
    decidedAt: DateTimeSchema.nullable(),
    decisionReason: z.string().nullable(),
    waiverReason: z.string().nullable(),
    createdById: UuidSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("ConflictCheck");

export const ConflictSearchRequestSchema = z
  .object({
    matterId: UuidSchema,
    search: z.string().min(1).max(200),
  })
  .openapi("ConflictSearchRequest");

export const ConflictSearchResponseSchema = z
  .object({
    success: z.literal(true),
    conflictCheck: ConflictCheckSchema,
    matches: z.array(z.record(z.unknown())).default([]),
  })
  .openapi("ConflictSearchResponse");

export const ConflictDecisionRequestSchema = z
  .object({
    decisionReason: z.string().optional(),
    waiverReason: z.string().optional(),
  })
  .openapi("ConflictDecisionRequest");
