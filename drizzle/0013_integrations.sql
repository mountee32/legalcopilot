-- Integrations: email/calendar/payment/accounting/e-signature

DO $$ BEGIN
  CREATE TYPE integration_connection_status AS ENUM ('connected', 'revoked', 'error');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Email integration
DO $$ BEGIN
  CREATE TYPE email_provider AS ENUM ('google', 'microsoft');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "email_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "provider" "email_provider" NOT NULL,
  "email_address" text NOT NULL,
  "external_account_id" text,
  "scopes" jsonb,
  "tokens" jsonb,
  "webhook_secret" text NOT NULL,
  "status" "integration_connection_status" DEFAULT 'connected' NOT NULL,
  "last_sync_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "email_accounts"
  ADD CONSTRAINT "email_accounts_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "email_accounts"
  ADD CONSTRAINT "email_accounts_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "email_accounts_firm_user_idx" ON "email_accounts" ("firm_id", "user_id");
CREATE INDEX IF NOT EXISTS "email_accounts_firm_provider_idx" ON "email_accounts" ("firm_id", "provider");
CREATE UNIQUE INDEX IF NOT EXISTS "email_accounts_firm_provider_external_unique"
  ON "email_accounts" ("firm_id", "provider", "external_account_id");

CREATE TABLE IF NOT EXISTS "email_provider_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "provider" "email_provider" NOT NULL,
  "external_event_id" text NOT NULL,
  "payload" jsonb,
  "received_at" timestamp DEFAULT now() NOT NULL,
  "processed_at" timestamp,
  "processed_ok" boolean DEFAULT false NOT NULL,
  "error" text
);

ALTER TABLE "email_provider_events"
  ADD CONSTRAINT "email_provider_events_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "email_provider_events"
  ADD CONSTRAINT "email_provider_events_account_id_email_accounts_id_fk"
  FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "email_provider_events_account_idx" ON "email_provider_events" ("account_id", "received_at");
CREATE UNIQUE INDEX IF NOT EXISTS "email_provider_events_firm_provider_external_unique"
  ON "email_provider_events" ("firm_id", "provider", "external_event_id");

-- Calendar integration
DO $$ BEGIN
  CREATE TYPE calendar_provider AS ENUM ('google', 'microsoft');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sync_direction AS ENUM ('push', 'pull', 'both');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "calendar_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "provider" "calendar_provider" NOT NULL,
  "external_account_id" text,
  "scopes" jsonb,
  "tokens" jsonb,
  "webhook_secret" text NOT NULL,
  "status" "integration_connection_status" DEFAULT 'connected' NOT NULL,
  "sync_direction" "sync_direction" DEFAULT 'push' NOT NULL,
  "last_sync_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "calendar_accounts"
  ADD CONSTRAINT "calendar_accounts_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "calendar_accounts"
  ADD CONSTRAINT "calendar_accounts_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "calendar_accounts_firm_user_idx" ON "calendar_accounts" ("firm_id", "user_id");
CREATE INDEX IF NOT EXISTS "calendar_accounts_firm_provider_idx" ON "calendar_accounts" ("firm_id", "provider");
CREATE UNIQUE INDEX IF NOT EXISTS "calendar_accounts_firm_provider_external_unique"
  ON "calendar_accounts" ("firm_id", "provider", "external_account_id");

CREATE TABLE IF NOT EXISTS "calendar_provider_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "provider" "calendar_provider" NOT NULL,
  "external_event_id" text NOT NULL,
  "payload" jsonb,
  "received_at" timestamp DEFAULT now() NOT NULL,
  "processed_at" timestamp,
  "processed_ok" boolean DEFAULT false NOT NULL,
  "error" text
);

ALTER TABLE "calendar_provider_events"
  ADD CONSTRAINT "calendar_provider_events_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "calendar_provider_events"
  ADD CONSTRAINT "calendar_provider_events_account_id_calendar_accounts_id_fk"
  FOREIGN KEY ("account_id") REFERENCES "public"."calendar_accounts"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "calendar_provider_events_account_idx" ON "calendar_provider_events" ("account_id", "received_at");
CREATE UNIQUE INDEX IF NOT EXISTS "calendar_provider_events_firm_provider_external_unique"
  ON "calendar_provider_events" ("firm_id", "provider", "external_event_id");

-- Payment providers
DO $$ BEGIN
  CREATE TYPE payment_provider AS ENUM ('stripe', 'gocardless');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "payment_provider_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "provider" "payment_provider" NOT NULL,
  "webhook_secret" text NOT NULL,
  "config" jsonb,
  "external_account_id" text,
  "status" "integration_connection_status" DEFAULT 'connected' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "payment_provider_accounts"
  ADD CONSTRAINT "payment_provider_accounts_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "payment_provider_accounts_firm_provider_idx"
  ON "payment_provider_accounts" ("firm_id", "provider");

CREATE TABLE IF NOT EXISTS "payment_provider_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "provider" "payment_provider" NOT NULL,
  "external_event_id" text NOT NULL,
  "event_type" text,
  "payload" jsonb,
  "received_at" timestamp DEFAULT now() NOT NULL,
  "processed_at" timestamp,
  "processed_ok" boolean DEFAULT false NOT NULL,
  "error" text
);

ALTER TABLE "payment_provider_events"
  ADD CONSTRAINT "payment_provider_events_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "payment_provider_events"
  ADD CONSTRAINT "payment_provider_events_account_id_payment_provider_accounts_id_fk"
  FOREIGN KEY ("account_id") REFERENCES "public"."payment_provider_accounts"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "payment_provider_events_account_idx" ON "payment_provider_events" ("account_id", "received_at");
CREATE UNIQUE INDEX IF NOT EXISTS "payment_provider_events_firm_provider_external_unique"
  ON "payment_provider_events" ("firm_id", "provider", "external_event_id");

-- Accounting providers
DO $$ BEGIN
  CREATE TYPE accounting_provider AS ENUM ('xero', 'quickbooks');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "accounting_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "provider" "accounting_provider" NOT NULL,
  "tokens" jsonb,
  "external_tenant_id" text,
  "webhook_secret" text NOT NULL,
  "status" "integration_connection_status" DEFAULT 'connected' NOT NULL,
  "last_sync_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "accounting_connections"
  ADD CONSTRAINT "accounting_connections_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "accounting_connections_firm_provider_idx"
  ON "accounting_connections" ("firm_id", "provider");
CREATE UNIQUE INDEX IF NOT EXISTS "accounting_connections_firm_provider_tenant_unique"
  ON "accounting_connections" ("firm_id", "provider", "external_tenant_id");

CREATE TABLE IF NOT EXISTS "accounting_sync_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "provider" "accounting_provider" NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" uuid,
  "external_id" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "error" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "accounting_sync_events"
  ADD CONSTRAINT "accounting_sync_events_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "accounting_sync_events_firm_provider_idx"
  ON "accounting_sync_events" ("firm_id", "provider");
CREATE INDEX IF NOT EXISTS "accounting_sync_events_entity_idx"
  ON "accounting_sync_events" ("entity_type", "entity_id");

-- E-signature providers
DO $$ BEGIN
  CREATE TYPE esignature_provider AS ENUM ('docusign', 'adobe_sign');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE signature_request_status AS ENUM (
    'draft',
    'pending_approval',
    'sent',
    'delivered',
    'completed',
    'declined',
    'voided',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "signature_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "document_id" uuid NOT NULL,
  "provider" "esignature_provider" NOT NULL,
  "external_id" text,
  "status" "signature_request_status" DEFAULT 'draft' NOT NULL,
  "signers" jsonb,
  "sent_at" timestamp,
  "completed_at" timestamp,
  "signed_document_id" uuid,
  "created_by_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "signature_requests"
  ADD CONSTRAINT "signature_requests_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "signature_requests"
  ADD CONSTRAINT "signature_requests_document_id_documents_id_fk"
  FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "signature_requests"
  ADD CONSTRAINT "signature_requests_signed_document_id_documents_id_fk"
  FOREIGN KEY ("signed_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "signature_requests"
  ADD CONSTRAINT "signature_requests_created_by_id_users_id_fk"
  FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "signature_requests_firm_document_idx"
  ON "signature_requests" ("firm_id", "document_id");
CREATE INDEX IF NOT EXISTS "signature_requests_firm_provider_idx"
  ON "signature_requests" ("firm_id", "provider");

CREATE TABLE IF NOT EXISTS "esignature_provider_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "request_id" uuid NOT NULL,
  "provider" "esignature_provider" NOT NULL,
  "external_event_id" text NOT NULL,
  "payload" jsonb,
  "received_at" timestamp DEFAULT now() NOT NULL,
  "processed_at" timestamp,
  "processed_ok" boolean DEFAULT false NOT NULL,
  "error" text
);

ALTER TABLE "esignature_provider_events"
  ADD CONSTRAINT "esignature_provider_events_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "esignature_provider_events"
  ADD CONSTRAINT "esignature_provider_events_request_id_signature_requests_id_fk"
  FOREIGN KEY ("request_id") REFERENCES "public"."signature_requests"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "esignature_provider_events_request_idx"
  ON "esignature_provider_events" ("request_id", "received_at");
CREATE UNIQUE INDEX IF NOT EXISTS "esignature_provider_events_firm_provider_external_unique"
  ON "esignature_provider_events" ("firm_id", "provider", "external_event_id");

