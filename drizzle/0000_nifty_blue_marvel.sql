CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE TYPE "public"."client_status" AS ENUM('prospect', 'active', 'dormant', 'archived');--> statement-breakpoint
CREATE TYPE "public"."client_type" AS ENUM('individual', 'company', 'trust', 'estate', 'charity', 'government');--> statement-breakpoint
CREATE TYPE "public"."billing_type" AS ENUM('hourly', 'fixed_fee', 'conditional', 'legal_aid', 'pro_bono');--> statement-breakpoint
CREATE TYPE "public"."matter_status" AS ENUM('lead', 'active', 'on_hold', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."practice_area" AS ENUM('conveyancing', 'litigation', 'family', 'probate', 'employment', 'immigration', 'personal_injury', 'commercial', 'criminal', 'ip', 'insolvency', 'other');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('draft', 'pending_review', 'approved', 'sent', 'archived');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('letter_in', 'letter_out', 'email_in', 'email_out', 'contract', 'court_form', 'evidence', 'note', 'id_document', 'financial', 'other');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'written_off');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('bank_transfer', 'card', 'cheque', 'cash', 'client_account');--> statement-breakpoint
CREATE TYPE "public"."time_entry_status" AS ENUM('draft', 'submitted', 'approved', 'billed', 'written_off');--> statement-breakpoint
CREATE TYPE "public"."approval_execution_status" AS ENUM('not_executed', 'executed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."approval_source" AS ENUM('ai', 'system', 'user');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."audit_category" AS ENUM('auth', 'client', 'matter', 'document', 'billing', 'email', 'ai', 'admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."audit_severity" AS ENUM('info', 'warning', 'error', 'critical');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"email_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"data" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"result" jsonb,
	"error" text,
	"attempts" text DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" text NOT NULL,
	"bucket" text NOT NULL,
	"path" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"reference" text NOT NULL,
	"type" "client_type" DEFAULT 'individual' NOT NULL,
	"status" "client_status" DEFAULT 'prospect' NOT NULL,
	"title" text,
	"first_name" text,
	"last_name" text,
	"company_name" text,
	"company_number" text,
	"email" text,
	"phone" text,
	"mobile" text,
	"address_line_1" text,
	"address_line_2" text,
	"city" text,
	"county" text,
	"postcode" text,
	"country" text DEFAULT 'United Kingdom',
	"id_verified" boolean DEFAULT false,
	"id_verified_at" timestamp,
	"sof_verified" boolean DEFAULT false,
	"sof_verified_at" timestamp,
	"metadata" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"reference" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"client_id" uuid NOT NULL,
	"fee_earner_id" uuid,
	"supervisor_id" uuid,
	"status" "matter_status" DEFAULT 'lead' NOT NULL,
	"practice_area" "practice_area" NOT NULL,
	"billing_type" "billing_type" DEFAULT 'hourly' NOT NULL,
	"hourly_rate" numeric(10, 2),
	"fixed_fee" numeric(10, 2),
	"estimated_value" numeric(10, 2),
	"opened_at" timestamp,
	"closed_at" timestamp,
	"key_deadline" timestamp,
	"practice_data" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"matter_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"text" text NOT NULL,
	"page_start" integer,
	"page_end" integer,
	"char_start" integer,
	"char_end" integer,
	"embedding" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"matter_id" uuid NOT NULL,
	"title" text NOT NULL,
	"type" "document_type" NOT NULL,
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"upload_id" uuid,
	"filename" text,
	"mime_type" text,
	"file_size" integer,
	"created_by" uuid,
	"document_date" timestamp,
	"recipient" text,
	"sender" text,
	"ai_summary" text,
	"extracted_text" text,
	"chunked_at" timestamp,
	"chunk_count" integer,
	"metadata" jsonb,
	"version" integer DEFAULT 1,
	"parent_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" text NOT NULL,
	"client_id" uuid NOT NULL,
	"matter_id" uuid,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"invoice_date" date NOT NULL,
	"due_date" date NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"vat_amount" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0',
	"balance_due" numeric(10, 2) NOT NULL,
	"terms" text,
	"notes" text,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"method" "payment_method" NOT NULL,
	"payment_date" date NOT NULL,
	"reference" text,
	"notes" text,
	"recorded_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matter_id" uuid NOT NULL,
	"fee_earner_id" uuid NOT NULL,
	"work_date" date NOT NULL,
	"description" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"hourly_rate" numeric(10, 2) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" time_entry_status DEFAULT 'draft' NOT NULL,
	"invoice_id" uuid,
	"activity_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"source_type" "approval_source" NOT NULL,
	"source_id" uuid,
	"action" text NOT NULL,
	"summary" text NOT NULL,
	"proposed_payload" jsonb,
	"entity_type" text,
	"entity_id" uuid,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"decided_by" uuid,
	"decided_at" timestamp,
	"decision_reason" text,
	"executed_at" timestamp,
	"execution_status" "approval_execution_status" DEFAULT 'not_executed' NOT NULL,
	"execution_error" text,
	"ai_metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"category" "audit_category" NOT NULL,
	"severity" "audit_severity" DEFAULT 'info' NOT NULL,
	"description" text,
	"entity_type" text,
	"entity_id" uuid,
	"old_value" jsonb,
	"new_value" jsonb,
	"metadata" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"request_id" text,
	"ai_model" text,
	"ai_prompt" text,
	"ai_response" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matters" ADD CONSTRAINT "matters_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matters" ADD CONSTRAINT "matters_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matters" ADD CONSTRAINT "matters_fee_earner_id_users_id_fk" FOREIGN KEY ("fee_earner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matters" ADD CONSTRAINT "matters_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_fee_earner_id_users_id_fk" FOREIGN KEY ("fee_earner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_source_id_users_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clients_firm_reference_unique" ON "clients" USING btree ("firm_id","reference");--> statement-breakpoint
CREATE UNIQUE INDEX "matters_firm_reference_unique" ON "matters" USING btree ("firm_id","reference");--> statement-breakpoint
CREATE UNIQUE INDEX "document_chunks_document_index_unique" ON "document_chunks" USING btree ("document_id","chunk_index");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_parent_version_unique" ON "documents" USING btree ("parent_id","version");--> statement-breakpoint
CREATE INDEX "approval_requests_firm_status_idx" ON "approval_requests" USING btree ("firm_id","status");--> statement-breakpoint
CREATE INDEX "approval_requests_action_idx" ON "approval_requests" USING btree ("action");--> statement-breakpoint
CREATE INDEX "approval_requests_entity_idx" ON "approval_requests" USING btree ("entity_type","entity_id");
