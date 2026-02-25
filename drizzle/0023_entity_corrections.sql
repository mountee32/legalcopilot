-- Entity corrections: two-level correction learning for pipeline findings
ALTER TYPE "pipeline_finding_status" ADD VALUE IF NOT EXISTS 'revised';

DO $$ BEGIN
  CREATE TYPE "entity_correction_scope" AS ENUM ('case', 'firm');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "entity_corrections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "firm_id" uuid NOT NULL REFERENCES "firms"("id") ON DELETE CASCADE,
  "matter_id" uuid REFERENCES "matters"("id") ON DELETE SET NULL,
  "finding_id" uuid REFERENCES "pipeline_findings"("id") ON DELETE SET NULL,
  "category_key" text NOT NULL,
  "field_key" text NOT NULL,
  "original_value" text,
  "corrected_value" text NOT NULL,
  "scope" "entity_correction_scope" NOT NULL DEFAULT 'case',
  "corrected_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "entity_corrections_firm_idx" ON "entity_corrections" ("firm_id");
CREATE INDEX IF NOT EXISTS "entity_corrections_field_idx" ON "entity_corrections" ("firm_id", "category_key", "field_key");

ALTER TYPE "timeline_event_type" ADD VALUE IF NOT EXISTS 'finding_revised';
