CREATE TYPE "public"."taxonomy_field_data_type" AS ENUM (
  'text',
  'number',
  'date',
  'boolean',
  'currency',
  'percentage',
  'json'
);
--> statement-breakpoint
CREATE TYPE "public"."taxonomy_trigger_type" AS ENUM (
  'deadline',
  'recommendation',
  'alert',
  'status_change'
);
--> statement-breakpoint
CREATE TYPE "public"."taxonomy_conflict_detection_mode" AS ENUM (
  'exact',
  'fuzzy_text',
  'fuzzy_number',
  'date_range',
  'semantic'
);
--> statement-breakpoint
CREATE TYPE "public"."taxonomy_prompt_template_type" AS ENUM (
  'extraction',
  'classification',
  'action_generation',
  'summarization'
);
--> statement-breakpoint
CREATE TABLE "taxonomy_packs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid,
  "key" text NOT NULL,
  "version" text DEFAULT '1.0.0' NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "practice_area" "practice_area" NOT NULL,
  "is_system" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "parent_pack_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomy_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pack_id" uuid NOT NULL,
  "key" text NOT NULL,
  "label" text NOT NULL,
  "description" text,
  "icon" text,
  "color" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomy_fields" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "category_id" uuid NOT NULL,
  "key" text NOT NULL,
  "label" text NOT NULL,
  "description" text,
  "data_type" "taxonomy_field_data_type" NOT NULL,
  "examples" jsonb,
  "confidence_threshold" numeric(4, 3) DEFAULT '0.800' NOT NULL,
  "requires_human_review" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomy_document_types" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pack_id" uuid NOT NULL,
  "key" text NOT NULL,
  "label" text NOT NULL,
  "description" text,
  "activated_categories" jsonb NOT NULL,
  "classification_hints" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomy_action_triggers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pack_id" uuid NOT NULL,
  "trigger_type" "taxonomy_trigger_type" NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "trigger_condition" jsonb NOT NULL,
  "action_template" jsonb NOT NULL,
  "jurisdiction_specific" boolean DEFAULT false NOT NULL,
  "jurisdiction_rules" jsonb,
  "is_deterministic" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomy_reconciliation_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pack_id" uuid NOT NULL,
  "field_key" text NOT NULL,
  "case_field_mapping" text NOT NULL,
  "conflict_detection_mode" "taxonomy_conflict_detection_mode" NOT NULL,
  "auto_apply_threshold" numeric(4, 3) DEFAULT '0.850' NOT NULL,
  "requires_human_review" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomy_prompt_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pack_id" uuid NOT NULL,
  "template_type" "taxonomy_prompt_template_type" NOT NULL,
  "system_prompt" text NOT NULL,
  "user_prompt_template" text NOT NULL,
  "model_preference" text,
  "temperature" numeric(4, 3),
  "max_tokens" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "taxonomy_packs"
  ADD CONSTRAINT "taxonomy_packs_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id")
  ON DELETE cascade
  ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "taxonomy_packs"
  ADD CONSTRAINT "taxonomy_packs_parent_pack_id_taxonomy_packs_id_fk"
  FOREIGN KEY ("parent_pack_id") REFERENCES "public"."taxonomy_packs"("id")
  ON DELETE set null
  ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "taxonomy_categories"
  ADD CONSTRAINT "taxonomy_categories_pack_id_taxonomy_packs_id_fk"
  FOREIGN KEY ("pack_id") REFERENCES "public"."taxonomy_packs"("id")
  ON DELETE cascade
  ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "taxonomy_fields"
  ADD CONSTRAINT "taxonomy_fields_category_id_taxonomy_categories_id_fk"
  FOREIGN KEY ("category_id") REFERENCES "public"."taxonomy_categories"("id")
  ON DELETE cascade
  ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "taxonomy_document_types"
  ADD CONSTRAINT "taxonomy_document_types_pack_id_taxonomy_packs_id_fk"
  FOREIGN KEY ("pack_id") REFERENCES "public"."taxonomy_packs"("id")
  ON DELETE cascade
  ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "taxonomy_action_triggers"
  ADD CONSTRAINT "taxonomy_action_triggers_pack_id_taxonomy_packs_id_fk"
  FOREIGN KEY ("pack_id") REFERENCES "public"."taxonomy_packs"("id")
  ON DELETE cascade
  ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "taxonomy_reconciliation_rules"
  ADD CONSTRAINT "taxonomy_reconciliation_rules_pack_id_taxonomy_packs_id_fk"
  FOREIGN KEY ("pack_id") REFERENCES "public"."taxonomy_packs"("id")
  ON DELETE cascade
  ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "taxonomy_prompt_templates"
  ADD CONSTRAINT "taxonomy_prompt_templates_pack_id_taxonomy_packs_id_fk"
  FOREIGN KEY ("pack_id") REFERENCES "public"."taxonomy_packs"("id")
  ON DELETE cascade
  ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "taxonomy_packs_firm_idx" ON "taxonomy_packs" USING btree ("firm_id");
--> statement-breakpoint
CREATE INDEX "taxonomy_packs_practice_area_idx" ON "taxonomy_packs" USING btree ("practice_area");
--> statement-breakpoint
CREATE INDEX "taxonomy_packs_active_idx" ON "taxonomy_packs" USING btree ("is_active");
--> statement-breakpoint
CREATE UNIQUE INDEX "taxonomy_packs_firm_key_version_unique"
  ON "taxonomy_packs" USING btree ("firm_id", "key", "version");
--> statement-breakpoint
CREATE INDEX "taxonomy_categories_pack_sort_idx"
  ON "taxonomy_categories" USING btree ("pack_id", "sort_order");
--> statement-breakpoint
CREATE UNIQUE INDEX "taxonomy_categories_pack_key_unique"
  ON "taxonomy_categories" USING btree ("pack_id", "key");
--> statement-breakpoint
CREATE INDEX "taxonomy_fields_category_sort_idx"
  ON "taxonomy_fields" USING btree ("category_id", "sort_order");
--> statement-breakpoint
CREATE UNIQUE INDEX "taxonomy_fields_category_key_unique"
  ON "taxonomy_fields" USING btree ("category_id", "key");
--> statement-breakpoint
CREATE INDEX "taxonomy_document_types_pack_sort_idx"
  ON "taxonomy_document_types" USING btree ("pack_id", "sort_order");
--> statement-breakpoint
CREATE UNIQUE INDEX "taxonomy_document_types_pack_key_unique"
  ON "taxonomy_document_types" USING btree ("pack_id", "key");
--> statement-breakpoint
CREATE INDEX "taxonomy_action_triggers_pack_idx"
  ON "taxonomy_action_triggers" USING btree ("pack_id");
--> statement-breakpoint
CREATE INDEX "taxonomy_reconciliation_rules_pack_idx"
  ON "taxonomy_reconciliation_rules" USING btree ("pack_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "taxonomy_reconciliation_rules_pack_field_unique"
  ON "taxonomy_reconciliation_rules" USING btree ("pack_id", "field_key");
--> statement-breakpoint
CREATE UNIQUE INDEX "taxonomy_prompt_templates_pack_template_type_unique"
  ON "taxonomy_prompt_templates" USING btree ("pack_id", "template_type");
