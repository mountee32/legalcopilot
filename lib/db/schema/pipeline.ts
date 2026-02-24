/**
 * Pipeline Schema
 *
 * Document processing pipeline — tracks multi-stage AI analysis runs,
 * extracted findings, and recommended actions.
 *
 * Pipeline stages: intake → ocr → classify → extract → reconcile → actions
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  integer,
  jsonb,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { matters } from "./matters";
import { documents } from "./documents";
import { users } from "./users";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Pipeline run status lifecycle: queued → running → completed | failed | cancelled */
export const pipelineRunStatusEnum = pgEnum("pipeline_run_status", [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

/** Individual stage within a pipeline run */
export const pipelineStageEnum = pgEnum("pipeline_stage", [
  "intake",
  "ocr",
  "classify",
  "extract",
  "reconcile",
  "actions",
]);

/** Stage status within a run */
export const pipelineStageStatusEnum = pgEnum("pipeline_stage_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
]);

/** Finding status — lifecycle for extracted data points */
export const pipelineFindingStatusEnum = pgEnum("pipeline_finding_status", [
  "pending", // Awaiting review
  "accepted", // Accepted by user
  "rejected", // Rejected by user
  "auto_applied", // Auto-applied above confidence threshold
  "conflict", // Conflicts with existing data
]);

/** Finding impact level */
export const pipelineFindingImpactEnum = pgEnum("pipeline_finding_impact", [
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

/** Action status — lifecycle for recommended actions */
export const pipelineActionStatusEnum = pgEnum("pipeline_action_status", [
  "pending",
  "accepted",
  "dismissed",
  "executed",
  "failed",
]);

/** Action type classification */
export const pipelineActionTypeEnum = pgEnum("pipeline_action_type", [
  "create_task",
  "create_deadline",
  "update_field",
  "send_notification",
  "flag_risk",
  "request_review",
  "ai_recommendation",
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

/**
 * Pipeline runs — one per document upload processed through the pipeline.
 * Tracks overall run status and per-stage progress.
 */
export const pipelineRuns = pgTable(
  "pipeline_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),

    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),

    status: pipelineRunStatusEnum("status").notNull().default("queued"),

    /** Current stage being processed */
    currentStage: pipelineStageEnum("current_stage"),

    /** Per-stage status and timing as JSON */
    stageStatuses: jsonb("stage_statuses")
      .$type<
        Record<
          string,
          {
            status: string;
            startedAt?: string;
            completedAt?: string;
            error?: string;
          }
        >
      >()
      .notNull()
      .default({}),

    /** SHA-256 hash of the document for dedup */
    documentHash: text("document_hash"),

    /** Classified document type key (from taxonomy) */
    classifiedDocType: text("classified_doc_type"),

    /** Classification confidence (0.000–1.000) */
    classificationConfidence: numeric("classification_confidence", { precision: 4, scale: 3 }),

    /** Taxonomy pack ID used for this run */
    taxonomyPackId: uuid("taxonomy_pack_id"),

    /** Total findings extracted */
    findingsCount: integer("findings_count").notNull().default(0),

    /** Total actions generated */
    actionsCount: integer("actions_count").notNull().default(0),

    /** Total AI tokens consumed across all stages */
    totalTokensUsed: integer("total_tokens_used").notNull().default(0),

    /** Error message if run failed */
    error: text("error"),

    /** User who triggered the run (null if system-triggered) */
    triggeredBy: uuid("triggered_by").references(() => users.id, { onDelete: "set null" }),

    /** Time the run started processing */
    startedAt: timestamp("started_at"),

    /** Time the run completed (success or failure) */
    completedAt: timestamp("completed_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmMatterIdx: index("pipeline_runs_firm_matter_idx").on(t.firmId, t.matterId),
    firmStatusIdx: index("pipeline_runs_firm_status_idx").on(t.firmId, t.status),
    documentIdx: index("pipeline_runs_document_idx").on(t.documentId),
  })
);

/**
 * Pipeline findings — individual data points extracted from documents.
 * Each finding maps to a taxonomy field and includes source location.
 */
export const pipelineFindings = pgTable(
  "pipeline_findings",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    pipelineRunId: uuid("pipeline_run_id")
      .notNull()
      .references(() => pipelineRuns.id, { onDelete: "cascade" }),

    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),

    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),

    /** Taxonomy category key this finding belongs to */
    categoryKey: text("category_key").notNull(),

    /** Taxonomy field key this finding maps to */
    fieldKey: text("field_key").notNull(),

    /** Human-readable label */
    label: text("label").notNull(),

    /** Extracted value (stored as text, interpreted per field data type) */
    value: text("value"),

    /** Raw source text quoted from the document */
    sourceQuote: text("source_quote"),

    /** Page number(s) where finding was extracted */
    pageStart: integer("page_start"),
    pageEnd: integer("page_end"),

    /** Character positions in extracted text */
    charStart: integer("char_start"),
    charEnd: integer("char_end"),

    /** AI confidence score (0.000–1.000) */
    confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull(),

    impact: pipelineFindingImpactEnum("impact").notNull().default("medium"),
    status: pipelineFindingStatusEnum("status").notNull().default("pending"),

    /** Existing value that this finding conflicts with (for reconciliation) */
    existingValue: text("existing_value"),

    /** User who resolved this finding */
    resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: timestamp("resolved_at"),

    /** Additional structured data */
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    runIdx: index("pipeline_findings_run_idx").on(t.pipelineRunId),
    matterFieldIdx: index("pipeline_findings_matter_field_idx").on(t.matterId, t.fieldKey),
    matterCategoryIdx: index("pipeline_findings_matter_category_idx").on(t.matterId, t.categoryKey),
    statusIdx: index("pipeline_findings_status_idx").on(t.firmId, t.status),
  })
);

/**
 * Pipeline actions — recommended or triggered actions from pipeline analysis.
 * Actions may create tasks, set deadlines, update fields, or flag risks.
 */
export const pipelineActions = pgTable(
  "pipeline_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    pipelineRunId: uuid("pipeline_run_id")
      .notNull()
      .references(() => pipelineRuns.id, { onDelete: "cascade" }),

    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),

    actionType: pipelineActionTypeEnum("action_type").notNull(),

    /** Short title for the action */
    title: text("title").notNull(),

    /** Detailed description / reasoning */
    description: text("description"),

    /** Priority order within the run */
    priority: integer("priority").notNull().default(0),

    status: pipelineActionStatusEnum("status").notNull().default("pending"),

    /** Whether this action was deterministic (rule-based) or AI-generated */
    isDeterministic: text("is_deterministic").notNull().default("true"),

    /** Structured payload describing the action to execute */
    actionPayload: jsonb("action_payload"),

    /** ID of the finding that triggered this action (if applicable) */
    triggerFindingId: uuid("trigger_finding_id").references(() => pipelineFindings.id, {
      onDelete: "set null",
    }),

    /** ID of the taxonomy action trigger that matched (if deterministic) */
    triggerRuleId: uuid("trigger_rule_id"),

    /** User who resolved this action */
    resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: timestamp("resolved_at"),

    /** Error message if action execution failed */
    error: text("error"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    runIdx: index("pipeline_actions_run_idx").on(t.pipelineRunId),
    matterIdx: index("pipeline_actions_matter_idx").on(t.matterId),
    statusIdx: index("pipeline_actions_status_idx").on(t.firmId, t.status),
  })
);

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type PipelineRun = typeof pipelineRuns.$inferSelect;
export type NewPipelineRun = typeof pipelineRuns.$inferInsert;

export type PipelineFinding = typeof pipelineFindings.$inferSelect;
export type NewPipelineFinding = typeof pipelineFindings.$inferInsert;

export type PipelineAction = typeof pipelineActions.$inferSelect;
export type NewPipelineAction = typeof pipelineActions.$inferInsert;
