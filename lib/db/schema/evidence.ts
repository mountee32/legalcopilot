/**
 * Evidence Items Schema
 *
 * First-class evidence entities linked to tasks.
 * Evidence is proof of compliance, separate from notes (commentary).
 *
 * @see backlog/dev/FEAT-enhanced-task-model.md for design specification
 */

import { pgTable, text, timestamp, uuid, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";
import { documents } from "./documents";

/**
 * Type of evidence for compliance tracking.
 * These map to regulatory and procedural requirements.
 */
export const evidenceTypeEnum = pgEnum("evidence_type", [
  "id_document", // Passport, driving licence
  "proof_of_address", // Utility bill, bank statement
  "proof_of_funds", // Bank statement, mortgage offer
  "source_of_wealth", // Documentation of wealth origin
  "search_result", // Property/public record searches
  "signed_authority", // Client authority to act
  "client_instruction", // Written instructions from client
  "title_document", // Title deeds, recorder/county entries
  "contract", // Exchange contracts
  "completion_statement", // Financial completion statement
  "land_registry", // Legacy key for property record filing forms
  "other", // Catch-all for non-standard evidence
]);

/**
 * How was the evidence verified?
 * - manual: Verified by human review
 * - integration: Verified by external system (e.g., ID check API)
 * - ai: Verified by AI analysis
 */
export const verificationMethodEnum = pgEnum("verification_method", [
  "manual",
  "integration",
  "ai",
]);

/**
 * Evidence items linked to tasks.
 * Evidence must be verified before task can be completed (if requiresEvidence).
 */
export const evidenceItems = pgTable(
  "evidence_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    /**
     * Task this evidence is linked to.
     * Note: Forward reference - tasks table imports are circular.
     * We use uuid without reference here; integrity enforced at app layer.
     */
    taskId: uuid("task_id").notNull(),

    /** Evidence type for categorization and compliance tracking */
    type: evidenceTypeEnum("type").notNull(),

    /** Description of this specific evidence item */
    description: text("description"),

    /**
     * Linked document (if applicable).
     * Evidence can be a document or external reference (via metadata).
     */
    documentId: uuid("document_id").references(() => documents.id, { onDelete: "set null" }),

    /** User who added this evidence */
    addedById: uuid("added_by_id").references(() => users.id, { onDelete: "set null" }),

    /** When evidence was added */
    addedAt: timestamp("added_at").defaultNow().notNull(),

    /** User who verified this evidence (null until verified) */
    verifiedById: uuid("verified_by_id").references(() => users.id, { onDelete: "set null" }),

    /** When evidence was verified (null until verified) */
    verifiedAt: timestamp("verified_at"),

    /** How was verification performed? */
    verificationMethod: verificationMethodEnum("verification_method"),

    /** Notes from verification (e.g., discrepancies noted) */
    verificationNotes: text("verification_notes"),

    /**
     * Additional metadata for the evidence.
     * May include: externalReference, expiryDate, issuer, etc.
     */
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    /** Index for finding evidence by task */
    taskIdx: index("evidence_items_task_idx").on(t.taskId),
    /** Index for firm-wide evidence queries */
    firmIdx: index("evidence_items_firm_idx").on(t.firmId),
    /** Index for finding evidence by type */
    typeIdx: index("evidence_items_type_idx").on(t.firmId, t.type),
    /** Index for finding unverified evidence */
    unverifiedIdx: index("evidence_items_unverified_idx").on(t.firmId, t.verifiedAt),
  })
);

// Type exports
export type EvidenceItem = typeof evidenceItems.$inferSelect;
export type NewEvidenceItem = typeof evidenceItems.$inferInsert;
