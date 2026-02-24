/**
 * Email Imports Schema
 *
 * Tracks emails ingested from connected email accounts.
 * Records match results, processing status, and links to created documents/pipeline runs.
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  integer,
  index,
  uniqueIndex,
  numeric,
} from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { matters } from "./matters";
import { emails } from "./emails";
import { emailAccounts } from "./integrations";

export const emailImportMatchMethodEnum = pgEnum("email_import_match_method", [
  "subject_reference",
  "sender_domain",
  "per_matter_alias",
  "ai_match",
  "manual",
]);

export const emailImportStatusEnum = pgEnum("email_import_status", [
  "matched",
  "unmatched",
  "processing",
  "completed",
  "failed",
  "skipped",
]);

export const emailImports = pgTable(
  "email_imports",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    emailAccountId: uuid("email_account_id")
      .notNull()
      .references(() => emailAccounts.id, { onDelete: "cascade" }),

    externalMessageId: text("external_message_id").notNull(),
    externalThreadId: text("external_thread_id"),

    fromAddress: text("from_address").notNull(),
    subject: text("subject").notNull(),
    receivedAt: timestamp("received_at").notNull(),

    matterId: uuid("matter_id").references(() => matters.id, { onDelete: "set null" }),
    matchMethod: emailImportMatchMethodEnum("match_method"),
    matchConfidence: numeric("match_confidence"),

    status: emailImportStatusEnum("status").notNull().default("processing"),

    attachmentCount: integer("attachment_count").notNull().default(0),
    documentsCreated: jsonb("documents_created"), // string[] of document IDs
    pipelineRunIds: jsonb("pipeline_run_ids"), // string[] of pipeline run IDs

    emailId: uuid("email_id").references(() => emails.id, { onDelete: "set null" }),

    error: text("error"),
    processedAt: timestamp("processed_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmStatusIdx: index("email_imports_firm_status_idx").on(t.firmId, t.status),
    firmAccountIdx: index("email_imports_firm_account_idx").on(t.firmId, t.emailAccountId),
    firmMatterIdx: index("email_imports_firm_matter_idx").on(t.firmId, t.matterId),
    uniqueExternalMsg: uniqueIndex("email_imports_firm_external_msg_unique").on(
      t.firmId,
      t.externalMessageId
    ),
  })
);

export type EmailImport = typeof emailImports.$inferSelect;
export type NewEmailImport = typeof emailImports.$inferInsert;
