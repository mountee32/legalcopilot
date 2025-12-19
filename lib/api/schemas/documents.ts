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
    matterId: UuidSchema.optional(), // Optional - can be assigned later in upload wizard
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

export const DocumentDownloadResponseSchema = z
  .object({
    url: z.string(),
    expiresAt: DateTimeSchema,
    contentDisposition: z.enum(["inline", "attachment"]),
    filename: z.string(),
    mimeType: z.string().nullable(),
  })
  .openapi("DocumentDownloadResponse");

// ============================================================================
// Document Analysis Schemas (AI-powered document processing)
// ============================================================================

/** Request schema for document analysis endpoint */
export const AnalyzeDocumentRequestSchema = z
  .object({
    force: z.boolean().optional(),
  })
  .openapi("AnalyzeDocumentRequest");

/** Party extracted from document by AI */
export const ExtractedPartySchema = z
  .object({
    name: z.string(),
    role: z.string(),
  })
  .openapi("ExtractedParty");

/** Key date extracted from document by AI */
export const ExtractedDateSchema = z
  .object({
    label: z.string(),
    date: z.string(), // YYYY-MM-DD format
  })
  .openapi("ExtractedDate");

/** Confidence level for AI analysis (RAG status) */
export const ConfidenceLevelSchema = z.enum(["green", "amber", "red"]).openapi("ConfidenceLevel");

/** AI analysis result for a document */
export const DocumentAnalysisSchema = z
  .object({
    suggestedTitle: z.string(),
    documentType: DocumentTypeSchema,
    documentDate: z.string().nullable(),
    parties: z.array(ExtractedPartySchema),
    keyDates: z.array(ExtractedDateSchema),
    summary: z.string(),
    confidence: z.number().int().min(0).max(100),
    confidenceLevel: ConfidenceLevelSchema,
  })
  .openapi("DocumentAnalysis");

/** Response schema for document analysis endpoint */
export const AnalyzeDocumentResponseSchema = z
  .object({
    success: z.literal(true),
    analysis: DocumentAnalysisSchema,
    usage: z.object({
      tokensUsed: z.number().int(),
      model: z.string(),
    }),
  })
  .openapi("AnalyzeDocumentResponse");

// ============================================================================
// Document Update Schema (for PATCH /api/documents/[id])
// ============================================================================

/** Schema for updating document metadata including AI-extracted fields */
export const UpdateDocumentMetadataSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    type: DocumentTypeSchema.optional(),
    matterId: UuidSchema.nullable().optional(),
    documentDate: z.union([DateSchema, DateTimeSchema]).nullable().optional(),
    recipient: z.string().nullable().optional(),
    sender: z.string().nullable().optional(),
    aiSummary: z.string().nullable().optional(),
    extractedParties: z.array(ExtractedPartySchema).nullable().optional(),
    extractedDates: z.array(ExtractedDateSchema).nullable().optional(),
  })
  .openapi("UpdateDocumentMetadata");

// ============================================================================
// Type Exports
// ============================================================================

export type Document = z.infer<typeof DocumentSchema>;
export type UpdateDocumentMetadata = z.infer<typeof UpdateDocumentMetadataSchema>;
export type CreateDocument = z.infer<typeof CreateDocumentSchema>;
export type AnalyzeDocumentRequest = z.infer<typeof AnalyzeDocumentRequestSchema>;
export type ExtractedParty = z.infer<typeof ExtractedPartySchema>;
export type ExtractedDate = z.infer<typeof ExtractedDateSchema>;
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;
export type DocumentAnalysis = z.infer<typeof DocumentAnalysisSchema>;
export type AnalyzeDocumentResponse = z.infer<typeof AnalyzeDocumentResponseSchema>;
