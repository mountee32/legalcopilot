/**
 * Document Schema
 *
 * Documents are files associated with matters.
 * Includes correspondence, contracts, evidence, etc.
 *
 * @see docs/backend-design.md Section 2.7 for full Document specification
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  integer,
  jsonb,
  uniqueIndex,
  vector,
} from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { matters } from "./matters";
import { users } from "./users";

/**
 * Document type classification.
 */
export const documentTypeEnum = pgEnum("document_type", [
  "letter_in", // Incoming letter
  "letter_out", // Outgoing letter
  "email_in", // Incoming email (archived)
  "email_out", // Outgoing email (archived)
  "contract", // Contract or agreement
  "court_form", // Court form or filing
  "evidence", // Evidence document
  "note", // File note or attendance note
  "id_document", // ID verification document
  "financial", // Financial document
  "other", // Other document type
]);

/**
 * Document status in review workflow.
 */
export const documentStatusEnum = pgEnum("document_status", [
  "draft", // Being created/edited
  "pending_review", // Awaiting approval
  "approved", // Approved for sending/use
  "sent", // Sent to recipient
  "archived", // No longer active
]);

/**
 * Document records.
 * Actual file stored in MinIO, this tracks metadata.
 */
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    /** Matter this document belongs to (nullable for uploads pending assignment) */
    matterId: uuid("matter_id").references(() => matters.id),

    /** Document title/description */
    title: text("title").notNull(),

    type: documentTypeEnum("type").default("other"),
    status: documentStatusEnum("status").notNull().default("draft"),

    /** Reference to file in uploads table */
    uploadId: uuid("upload_id"),

    /** Original filename */
    filename: text("filename"),

    /** MIME type */
    mimeType: text("mime_type"),

    /** File size in bytes */
    fileSize: integer("file_size"),

    /** User who created/uploaded */
    createdBy: uuid("created_by").references(() => users.id),

    /** Document date (may differ from upload date) */
    documentDate: timestamp("document_date"),

    /** If letter/email, the recipient */
    recipient: text("recipient"),

    /** If letter/email, the sender */
    sender: text("sender"),

    /** AI-generated summary */
    aiSummary: text("ai_summary"),

    /** AI confidence score 0-100 */
    aiConfidence: integer("ai_confidence"),

    /** AI-extracted parties from document [{name, role}] */
    extractedParties: jsonb("extracted_parties"),

    /** AI-extracted key dates from document [{label, date}] */
    extractedDates: jsonb("extracted_dates"),

    /** When AI analysis was completed */
    analyzedAt: timestamp("analyzed_at"),

    /** Token count from AI analysis (for cost tracking) */
    aiTokensUsed: integer("ai_tokens_used"),

    /** AI model used for analysis */
    aiModel: text("ai_model"),

    /** Extracted text content (for search) */
    extractedText: text("extracted_text"),

    /** Document has been chunked for citations/retrieval */
    chunkedAt: timestamp("chunked_at"),
    chunkCount: integer("chunk_count"),

    /** Document-specific metadata */
    metadata: jsonb("metadata"),

    /** Version number (for versioned documents) */
    version: integer("version").default(1),

    /** Parent document ID (for versions) */
    parentId: uuid("parent_id"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    // A document can be versioned by reusing parentId + incrementing version
    uniqueVersionPerParent: uniqueIndex("documents_parent_version_unique").on(
      t.parentId,
      t.version
    ),
  })
);

/**
 * Stored text chunks used for retrieval and source citations.
 */
export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),

    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),

    chunkIndex: integer("chunk_index").notNull(),
    text: text("text").notNull(),

    pageStart: integer("page_start"),
    pageEnd: integer("page_end"),
    charStart: integer("char_start"),
    charEnd: integer("char_end"),

    embedding: vector("embedding", { dimensions: 1536 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    uniqueChunkIndex: uniqueIndex("document_chunks_document_index_unique").on(
      t.documentId,
      t.chunkIndex
    ),
  })
);

// Type exports
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;

// TODO: Add when implementing:
// - templates (document templates)
// - documentTags (tagging system)
// - documentAccess (permission tracking)
