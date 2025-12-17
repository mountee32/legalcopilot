-- Firm scoping for billing tables
ALTER TABLE "time_entries" ADD COLUMN IF NOT EXISTS "firm_id" uuid;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "firm_id" uuid;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "firm_id" uuid;

UPDATE "invoices" i
SET "firm_id" = c."firm_id"
FROM "clients" c
WHERE i."firm_id" IS NULL AND i."client_id" = c."id";

UPDATE "time_entries" t
SET "firm_id" = m."firm_id"
FROM "matters" m
WHERE t."firm_id" IS NULL AND t."matter_id" = m."id";

UPDATE "payments" p
SET "firm_id" = i."firm_id"
FROM "invoices" i
WHERE p."firm_id" IS NULL AND p."invoice_id" = i."id";

ALTER TABLE "time_entries" ALTER COLUMN "firm_id" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "firm_id" SET NOT NULL;
ALTER TABLE "payments" ALTER COLUMN "firm_id" SET NOT NULL;

ALTER TABLE "time_entries"
  ADD CONSTRAINT "time_entries_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;

-- Make invoice number uniqueness firm-scoped
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_invoice_number_unique";
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_firm_number_unique" ON "invoices" ("firm_id", "invoice_number");
CREATE INDEX IF NOT EXISTS "invoices_firm_created_at_idx" ON "invoices" ("firm_id", "created_at");

-- Invoice sequences allocator (one row per firm)
CREATE TABLE IF NOT EXISTS "invoice_sequences" (
  "firm_id" uuid PRIMARY KEY NOT NULL,
  "next_number" integer DEFAULT 1 NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "invoice_sequences"
  ADD CONSTRAINT "invoice_sequences_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;

-- Invoice line items
CREATE TABLE IF NOT EXISTS "invoice_line_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "invoice_id" uuid NOT NULL,
  "description" text NOT NULL,
  "amount" numeric(10, 2) NOT NULL,
  "source_type" text,
  "source_id" uuid,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "invoice_line_items"
  ADD CONSTRAINT "invoice_line_items_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invoice_line_items"
  ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk"
  FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX IF NOT EXISTS "invoice_line_items_firm_invoice_idx" ON "invoice_line_items" ("firm_id", "invoice_id");

-- Payment idempotency placeholders
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "external_provider" text;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "external_id" text;
CREATE INDEX IF NOT EXISTS "payments_firm_invoice_idx" ON "payments" ("firm_id", "invoice_id");
CREATE INDEX IF NOT EXISTS "payments_external_idx" ON "payments" ("external_provider", "external_id");

-- Common billing query indexes
CREATE INDEX IF NOT EXISTS "time_entries_firm_status_idx" ON "time_entries" ("firm_id", "status");
CREATE INDEX IF NOT EXISTS "time_entries_firm_work_date_idx" ON "time_entries" ("firm_id", "work_date");
CREATE INDEX IF NOT EXISTS "time_entries_firm_matter_idx" ON "time_entries" ("firm_id", "matter_id");

