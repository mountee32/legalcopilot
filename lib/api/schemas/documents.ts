/**
 * Document API Schemas
 *
 * @see lib/db/schema/documents.ts for database schema
 */

import { z, UuidSchema, DateSchema, DateTimeSchema } from "./common";

export const DocumentTypeSchema = z
  .enum([
    "letter_in",
    "letter_out",
    "email_in",
    "email_out",
    "contract",
    "court_form",
    "evidence",
    "note",
    "id_document",
    "financial",
    "other",
  ])
  .openapi("DocumentType");

export const DocumentStatusSchema = z
  .enum(["draft", "pending_review", "approved", "sent", "archived"])
  .openapi("DocumentStatus");

export const DocumentSchema = z
  .object({
    id: UuidSchema,
    matterId: UuidSchema,
    title: z.string(),
    type: DocumentTypeSchema,
    status: DocumentStatusSchema,
    uploadId: UuidSchema.nullable(),
    filename: z.string().nullable(),
    mimeType: z.string().nullable(),
    fileSize: z.number().int().nullable(),
    createdBy: UuidSchema.nullable(),
    documentDate: DateTimeSchema.nullable(),
    recipient: z.string().nullable(),
    sender: z.string().nullable(),
    aiSummary: z.string().nullable(),
    extractedText: z.string().nullable(),
    chunkedAt: DateTimeSchema.nullable(),
    chunkCount: z.number().int().nullable(),
    metadata: z.record(z.unknown()).nullable(),
    version: z.number().int(),
    parentId: UuidSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("Document");

export const CreateDocumentSchema = z
  .object({
    matterId: UuidSchema,
    title: z.string().min(1).max(200),
    type: DocumentTypeSchema,
    uploadId: UuidSchema.optional(),
    filename: z.string().optional(),
    mimeType: z.string().optional(),
    fileSize: z.number().int().optional(),
    documentDate: z.union([DateSchema, DateTimeSchema]).optional(),
    recipient: z.string().optional(),
    sender: z.string().optional(),
    extractedText: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .openapi("CreateDocumentRequest");

export const AskMatterSchema = z
  .object({
    question: z.string().min(1).max(5000),
  })
  .openapi("AskMatterRequest");

export const ChunkDocumentRequestSchema = z
  .object({
    maxChars: z.number().int().min(200).max(10_000).optional(),
  })
  .openapi("ChunkDocumentRequest");

export const ChunkDocumentResponseSchema = z
  .object({
    success: z.literal(true),
    chunkCount: z.number().int(),
  })
  .openapi("ChunkDocumentResponse");

export const DocumentJobAcceptedResponseSchema = z
  .object({
    accepted: z.literal(true),
    jobId: UuidSchema,
  })
  .openapi("DocumentJobAcceptedResponse");

export const ExtractDocumentRequestSchema = z
  .object({
    async: z.boolean().optional(),
    force: z.boolean().optional(),
    autoChunk: z.boolean().optional(),
    maxChars: z.number().int().min(200).max(10_000).optional(),
  })
  .openapi("ExtractDocumentRequest");

export const ExtractDocumentResponseSchema = z
  .object({
    success: z.literal(true),
    extractedText: z.string(),
    length: z.number().int(),
    chunkCount: z.number().int().nullable(),
  })
  .openapi("ExtractDocumentResponse");

export const SummarizeDocumentResponseSchema = z
  .object({
    success: z.literal(true),
    summary: z.string(),
    keyPoints: z.array(z.string()).default([]),
  })
  .openapi("SummarizeDocumentResponse");

export const DocumentEntitiesSchema = z
  .object({
    dates: z.array(z.string()).default([]),
    parties: z.array(z.string()).default([]),
    amounts: z.array(z.string()).default([]),
    addresses: z.array(z.string()).default([]),
  })
  .openapi("DocumentEntities");

export const DocumentEntitiesResponseSchema = z
  .object({
    success: z.literal(true),
    entities: DocumentEntitiesSchema,
  })
  .openapi("DocumentEntitiesResponse");

export const SourceCitationSchema = z
  .object({
    documentId: UuidSchema,
    documentChunkId: UuidSchema,
    quote: z.string().optional(),
  })
  .openapi("SourceCitation");

export const AskMatterResponseSchema = z
  .object({
    answer: z.string(),
    citations: z.array(SourceCitationSchema).default([]),
  })
  .openapi("AskMatterResponse");

export const DocumentChunkSchema = z
  .object({
    id: UuidSchema,
    documentId: UuidSchema,
    matterId: UuidSchema,
    chunkIndex: z.number().int(),
    text: z.string(),
    pageStart: z.number().int().nullable(),
    pageEnd: z.number().int().nullable(),
    charStart: z.number().int().nullable(),
    charEnd: z.number().int().nullable(),
    createdAt: DateTimeSchema,
  })
  .openapi("DocumentChunk");

export const DocumentChunkListSchema = z
  .object({
    chunks: z.array(DocumentChunkSchema),
  })
  .openapi("DocumentChunkListResponse");

export const DocumentListSchema = z
  .object({
    documents: z.array(DocumentSchema),
  })
  .openapi("DocumentListResponse");

export type Document = z.infer<typeof DocumentSchema>;
export type CreateDocument = z.infer<typeof CreateDocumentSchema>;
