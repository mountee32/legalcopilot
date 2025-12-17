-- Templates
DO $$ BEGIN
  CREATE TYPE template_type AS ENUM ('document', 'email');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid,
  "name" text NOT NULL,
  "type" "template_type" NOT NULL,
  "category" text,
  "content" text NOT NULL,
  "merge_fields" jsonb,
  "is_active" boolean DEFAULT true NOT NULL,
  "parent_id" uuid,
  "version" integer DEFAULT 1 NOT NULL,
  "created_by_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "templates"
  ADD CONSTRAINT "templates_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "templates"
  ADD CONSTRAINT "templates_created_by_id_users_id_fk"
  FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "templates_firm_type_idx" ON "templates" ("firm_id", "type");
CREATE INDEX IF NOT EXISTS "templates_firm_name_idx" ON "templates" ("firm_id", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "templates_firm_parent_version_unique" ON "templates" ("firm_id", "parent_id", "version");

-- Intake: leads, quotes, referral sources
DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'won', 'lost', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "first_name" text,
  "last_name" text,
  "company_name" text,
  "email" text,
  "phone" text,
  "source" text,
  "status" "lead_status" DEFAULT 'new' NOT NULL,
  "score" integer,
  "notes" text,
  "converted_to_client_id" uuid,
  "created_by_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "leads"
  ADD CONSTRAINT "leads_converted_to_client_id_clients_id_fk"
  FOREIGN KEY ("converted_to_client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "leads"
  ADD CONSTRAINT "leads_created_by_id_users_id_fk"
  FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "leads_firm_status_idx" ON "leads" ("firm_id", "status");
CREATE INDEX IF NOT EXISTS "leads_firm_email_idx" ON "leads" ("firm_id", "email");

CREATE TABLE IF NOT EXISTS "quotes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "lead_id" uuid NOT NULL,
  "status" "quote_status" DEFAULT 'draft' NOT NULL,
  "items" jsonb,
  "subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
  "vat_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
  "total" numeric(10, 2) DEFAULT '0' NOT NULL,
  "valid_until" date,
  "notes" text,
  "converted_to_matter_id" uuid,
  "created_by_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "quotes"
  ADD CONSTRAINT "quotes_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quotes"
  ADD CONSTRAINT "quotes_lead_id_leads_id_fk"
  FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quotes"
  ADD CONSTRAINT "quotes_converted_to_matter_id_matters_id_fk"
  FOREIGN KEY ("converted_to_matter_id") REFERENCES "public"."matters"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "quotes"
  ADD CONSTRAINT "quotes_created_by_id_users_id_fk"
  FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "quotes_firm_lead_idx" ON "quotes" ("firm_id", "lead_id");

CREATE TABLE IF NOT EXISTS "referral_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "name" text NOT NULL,
  "type" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "referral_sources"
  ADD CONSTRAINT "referral_sources_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;

CREATE UNIQUE INDEX IF NOT EXISTS "referral_sources_firm_name_unique" ON "referral_sources" ("firm_id", "name");

-- Conflicts
DO $$ BEGIN
  CREATE TYPE conflict_check_status AS ENUM ('pending', 'clear', 'conflict', 'waived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "conflict_checks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "matter_id" uuid NOT NULL,
  "search_terms" jsonb,
  "results" jsonb,
  "status" "conflict_check_status" DEFAULT 'pending' NOT NULL,
  "decided_by" uuid,
  "decided_at" timestamp,
  "decision_reason" text,
  "waiver_reason" text,
  "created_by_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "conflict_checks"
  ADD CONSTRAINT "conflict_checks_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "conflict_checks"
  ADD CONSTRAINT "conflict_checks_matter_id_matters_id_fk"
  FOREIGN KEY ("matter_id") REFERENCES "public"."matters"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "conflict_checks"
  ADD CONSTRAINT "conflict_checks_decided_by_users_id_fk"
  FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "conflict_checks"
  ADD CONSTRAINT "conflict_checks_created_by_id_users_id_fk"
  FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "conflict_checks_firm_matter_idx" ON "conflict_checks" ("firm_id", "matter_id");
CREATE INDEX IF NOT EXISTS "conflict_checks_firm_status_idx" ON "conflict_checks" ("firm_id", "status");

-- Timeline enum additions for intake/templates/conflicts
DO $$ BEGIN
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'lead_converted';
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'quote_converted';
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'conflict_check_run';
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'conflict_check_cleared';
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'conflict_check_waived';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
