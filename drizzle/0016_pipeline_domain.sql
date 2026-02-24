-- Pipeline Domain: runs, findings, and actions for document processing pipeline
-- Depends on: firms, matters, documents, users

-- Enums
CREATE TYPE "pipeline_run_status" AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE "pipeline_stage" AS ENUM ('intake', 'ocr', 'classify', 'extract', 'reconcile', 'actions');
CREATE TYPE "pipeline_stage_status" AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');
CREATE TYPE "pipeline_finding_status" AS ENUM ('pending', 'accepted', 'rejected', 'auto_applied', 'conflict');
CREATE TYPE "pipeline_finding_impact" AS ENUM ('critical', 'high', 'medium', 'low', 'info');
CREATE TYPE "pipeline_action_status" AS ENUM ('pending', 'accepted', 'dismissed', 'executed', 'failed');
CREATE TYPE "pipeline_action_type" AS ENUM ('create_task', 'create_deadline', 'update_field', 'send_notification', 'flag_risk', 'request_review', 'ai_recommendation');

-- Add pipeline timeline event types
ALTER TYPE "timeline_event_type" ADD VALUE IF NOT EXISTS 'pipeline_started';
ALTER TYPE "timeline_event_type" ADD VALUE IF NOT EXISTS 'pipeline_completed';
ALTER TYPE "timeline_event_type" ADD VALUE IF NOT EXISTS 'pipeline_failed';
ALTER TYPE "timeline_event_type" ADD VALUE IF NOT EXISTS 'pipeline_stage_completed';
ALTER TYPE "timeline_event_type" ADD VALUE IF NOT EXISTS 'pipeline_finding_extracted';
ALTER TYPE "timeline_event_type" ADD VALUE IF NOT EXISTS 'pipeline_action_generated';
ALTER TYPE "timeline_event_type" ADD VALUE IF NOT EXISTS 'pipeline_finding_resolved';
ALTER TYPE "timeline_event_type" ADD VALUE IF NOT EXISTS 'pipeline_action_resolved';

-- Pipeline runs
CREATE TABLE "pipeline_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "firm_id" uuid NOT NULL REFERENCES "firms"("id") ON DELETE CASCADE,
  "matter_id" uuid NOT NULL REFERENCES "matters"("id") ON DELETE CASCADE,
  "document_id" uuid NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "status" "pipeline_run_status" NOT NULL DEFAULT 'queued',
  "current_stage" "pipeline_stage",
  "stage_statuses" jsonb NOT NULL DEFAULT '{}',
  "document_hash" text,
  "classified_doc_type" text,
  "classification_confidence" numeric(4,3),
  "taxonomy_pack_id" uuid,
  "findings_count" integer NOT NULL DEFAULT 0,
  "actions_count" integer NOT NULL DEFAULT 0,
  "total_tokens_used" integer NOT NULL DEFAULT 0,
  "error" text,
  "triggered_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "started_at" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "pipeline_runs_firm_matter_idx" ON "pipeline_runs" ("firm_id", "matter_id");
CREATE INDEX "pipeline_runs_firm_status_idx" ON "pipeline_runs" ("firm_id", "status");
CREATE INDEX "pipeline_runs_document_idx" ON "pipeline_runs" ("document_id");

-- Pipeline findings
CREATE TABLE "pipeline_findings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "firm_id" uuid NOT NULL REFERENCES "firms"("id") ON DELETE CASCADE,
  "pipeline_run_id" uuid NOT NULL REFERENCES "pipeline_runs"("id") ON DELETE CASCADE,
  "matter_id" uuid NOT NULL REFERENCES "matters"("id") ON DELETE CASCADE,
  "document_id" uuid NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "category_key" text NOT NULL,
  "field_key" text NOT NULL,
  "label" text NOT NULL,
  "value" text,
  "source_quote" text,
  "page_start" integer,
  "page_end" integer,
  "char_start" integer,
  "char_end" integer,
  "confidence" numeric(4,3) NOT NULL,
  "impact" "pipeline_finding_impact" NOT NULL DEFAULT 'medium',
  "status" "pipeline_finding_status" NOT NULL DEFAULT 'pending',
  "existing_value" text,
  "resolved_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "resolved_at" timestamp,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "pipeline_findings_run_idx" ON "pipeline_findings" ("pipeline_run_id");
CREATE INDEX "pipeline_findings_matter_field_idx" ON "pipeline_findings" ("matter_id", "field_key");
CREATE INDEX "pipeline_findings_matter_category_idx" ON "pipeline_findings" ("matter_id", "category_key");
CREATE INDEX "pipeline_findings_status_idx" ON "pipeline_findings" ("firm_id", "status");

-- Pipeline actions
CREATE TABLE "pipeline_actions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "firm_id" uuid NOT NULL REFERENCES "firms"("id") ON DELETE CASCADE,
  "pipeline_run_id" uuid NOT NULL REFERENCES "pipeline_runs"("id") ON DELETE CASCADE,
  "matter_id" uuid NOT NULL REFERENCES "matters"("id") ON DELETE CASCADE,
  "action_type" "pipeline_action_type" NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "priority" integer NOT NULL DEFAULT 0,
  "status" "pipeline_action_status" NOT NULL DEFAULT 'pending',
  "is_deterministic" text NOT NULL DEFAULT 'true',
  "action_payload" jsonb,
  "trigger_finding_id" uuid REFERENCES "pipeline_findings"("id") ON DELETE SET NULL,
  "trigger_rule_id" uuid,
  "resolved_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "resolved_at" timestamp,
  "error" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "pipeline_actions_run_idx" ON "pipeline_actions" ("pipeline_run_id");
CREATE INDEX "pipeline_actions_matter_idx" ON "pipeline_actions" ("matter_id");
CREATE INDEX "pipeline_actions_status_idx" ON "pipeline_actions" ("firm_id", "status");
