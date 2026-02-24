/**
 * Evidence API Schemas
 *
 * @see lib/db/schema/evidence.ts for database schema
 */

import { z, UuidSchema, DateTimeSchema, PaginationSchema, PaginationMetaSchema } from "./common";

/**
 * Evidence types for compliance tracking.
 * Maps to regulatory and procedural requirements.
 */
export const EvidenceTypeSchema = z
  .enum([
    "id_document",
    "proof_of_address",
    "proof_of_funds",
    "source_of_wealth",
    "search_result",
    "signed_authority",
    "client_instruction",
    "title_document",
    "contract",
    "completion_statement",
    "land_registry",
    "other",
  ])
  .openapi("EvidenceType");

/**
 * How evidence was verified.
 */
export const VerificationMethodSchema = z
  .enum(["manual", "integration", "ai"])
  .openapi("VerificationMethod");

/**
 * Evidence item entity.
 */
export const EvidenceItemSchema = z
  .object({
    id: UuidSchema,
    taskId: UuidSchema,
    type: EvidenceTypeSchema,
    description: z.string().nullable(),
    documentId: UuidSchema.nullable(),
    documentName: z.string().optional(), // Joined from documents table
    addedById: UuidSchema.nullable(),
    addedByName: z.string().optional(), // Joined from users table
    addedAt: DateTimeSchema,
    verifiedById: UuidSchema.nullable(),
    verifiedByName: z.string().optional(), // Joined from users table
    verifiedAt: DateTimeSchema.nullable(),
    verificationMethod: VerificationMethodSchema.nullable(),
    verificationNotes: z.string().nullable(),
    metadata: z.record(z.unknown()).nullable(),
    createdAt: DateTimeSchema,
  })
  .openapi("EvidenceItem");

/**
 * Create evidence item request.
 */
export const CreateEvidenceSchema = z
  .object({
    type: EvidenceTypeSchema,
    description: z.string().max(2000).optional(),
    documentId: UuidSchema.optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .openapi("CreateEvidenceRequest");

/**
 * Verify evidence request.
 */
export const VerifyEvidenceSchema = z
  .object({
    verificationMethod: VerificationMethodSchema.default("manual"),
    verificationNotes: z.string().max(2000).optional(),
  })
  .openapi("VerifyEvidenceRequest");

/**
 * Query parameters for listing evidence.
 */
export const EvidenceQuerySchema = PaginationSchema.extend({
  type: EvidenceTypeSchema.optional(),
  verified: z.coerce.boolean().optional().openapi({
    description: "Filter by verification status (true = verified, false = unverified)",
  }),
}).openapi("EvidenceQuery");

/**
 * Evidence list response.
 */
export const EvidenceListSchema = z
  .object({
    evidence: z.array(EvidenceItemSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("EvidenceListResponse");

/**
 * Evidence summary for task responses.
 */
export const EvidenceSummarySchema = z
  .object({
    total: z.number().int(),
    verified: z.number().int(),
    unverified: z.number().int(),
    byType: z.record(z.number().int()),
  })
  .openapi("EvidenceSummary");

// Type exports
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;
export type CreateEvidence = z.infer<typeof CreateEvidenceSchema>;
export type VerifyEvidence = z.infer<typeof VerifyEvidenceSchema>;
export type EvidenceQuery = z.infer<typeof EvidenceQuerySchema>;
export type EvidenceSummary = z.infer<typeof EvidenceSummarySchema>;
