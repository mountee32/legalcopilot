-- Sprint 8: Email Imports
-- Tracks emails ingested from connected accounts, matching, and pipeline triggers.

-- Enums
DO $$ BEGIN
  CREATE TYPE "email_import_match_method" AS ENUM (
    'subject_reference',
    'sender_domain',
    'per_matter_alias',
    'ai_match',
    'manual'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "email_import_status" AS ENUM (
    'matched',
    'unmatched',
    'processing',
    'completed',
    'failed',
    'skipped'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Table
CREATE TABLE IF NOT EXISTS "email_imports" (
  "id"                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "firm_id"              uuid        NOT NULL REFERENCES "firms"("id") ON DELETE CASCADE,
  "email_account_id"     uuid        NOT NULL REFERENCES "email_accounts"("id") ON DELETE CASCADE,
  "external_message_id"  text        NOT NULL,
  "external_thread_id"   text,
  "from_address"         text        NOT NULL,
  "subject"              text        NOT NULL,
  "received_at"          timestamp   NOT NULL,
  "matter_id"            uuid        REFERENCES "matters"("id") ON DELETE SET NULL,
  "match_method"         "email_import_match_method",
  "match_confidence"     numeric,
  "status"               "email_import_status" NOT NULL DEFAULT 'processing',
  "attachment_count"     integer     NOT NULL DEFAULT 0,
  "documents_created"    jsonb,
  "pipeline_run_ids"     jsonb,
  "email_id"             uuid        REFERENCES "emails"("id") ON DELETE SET NULL,
  "error"                text,
  "processed_at"         timestamp,
  "created_at"           timestamp   NOT NULL DEFAULT now(),
  "updated_at"           timestamp   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "email_imports_firm_status_idx"
  ON "email_imports" ("firm_id", "status");

CREATE INDEX IF NOT EXISTS "email_imports_firm_account_idx"
  ON "email_imports" ("firm_id", "email_account_id");

CREATE INDEX IF NOT EXISTS "email_imports_firm_matter_idx"
  ON "email_imports" ("firm_id", "matter_id");

CREATE UNIQUE INDEX IF NOT EXISTS "email_imports_firm_external_msg_unique"
  ON "email_imports" ("firm_id", "external_message_id");

-- Extend timeline event type enum
ALTER TYPE "timeline_event_type" ADD VALUE IF NOT EXISTS 'email_import_completed';
ALTER TYPE "timeline_event_type" ADD VALUE IF NOT EXISTS 'email_import_failed';
ALTER TYPE "timeline_event_type" ADD VALUE IF NOT EXISTS 'email_import_unmatched';
